import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { rosterService } from '../../services/rosterService';

// Helper to clean strings
const clean = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Interfaces
interface PlayerGS {
    id: number;
    name: string;
    gs: number;
    role: string;
    class: string;
    originalRegistration: any;
}

interface RaidInstance {
    raidId: string;
    day: string;
    time: string;
    priority: number;
    type: '10' | '25';
    assigned: PlayerGS[];
}

// Min GearScore Requirements
const DEFAULT_GS = 5000;

// Helper to get Min GS dynamically from roster data
const getMinGS = (raidId: string, rosterDataPlayers: Record<string, any>): number => {
    const upper = raidId.toUpperCase();

    for (const playerName in rosterDataPlayers) {
        const player = rosterDataPlayers[playerName];
        if (player.leaderData && player.leaderData.cores) {
            for (const core of player.leaderData.cores) {
                const coreRaid = (core.raid || '').toUpperCase();
                if (coreRaid === upper || coreRaid.includes(upper) || upper.includes(coreRaid)) {
                    if (core.gs) {
                        return typeof core.gs === 'number' ? core.gs : parseInt(core.gs);
                    }
                }
            }
        }
    }

    if (upper.includes('ICC10H ABAS')) return 5800;
    if (upper.includes('ICC25N POR LK')) return 5600;
    if (upper.includes('SR25N') || upper.includes('SAGRARIO')) return 5600;
    if (upper.includes('ICC25N')) return 5400;

    return DEFAULT_GS;
};

export const GET: APIRoute = async ({ request }) => {
    try {
        console.log('--- Iniciando Distribución Automática de Raids ---');

        const rosterResult = await rosterService.getFormattedRoster(true); // Force fresh for distribution
        const rosterDataPlayers = rosterResult.players || {};

        const { data: registrations, error } = await supabase
            .from('raid_registrations')
            .select('*')
            .in('status', ['aceptado', 'en_espera', 'en_revision']);

        if (error || !registrations) {
            return new Response(JSON.stringify({ error: 'Error fetching registrations', details: error }), { status: 500 });
        }

        const rosterPlayersCleanedNames = Object.keys(rosterDataPlayers).map(p => clean(p));
        const guildPlayers = registrations.filter(reg => rosterPlayersCleanedNames.includes(clean(reg.player_name)));

        console.log(`Jugadores en Roster: ${guildPlayers.length}. Ignorando ${registrations.length - guildPlayers.length} externos.`);

        const uniquePlayers = new Map<string, PlayerGS>();

        guildPlayers.forEach(reg => {
            const name = reg.player_name;
            const cleanName = clean(name);

            if (!uniquePlayers.has(cleanName)) {
                const rosterKey = Object.keys(rosterDataPlayers).find(k => clean(k) === cleanName);
                if (rosterKey) {
                    const playerData = (rosterDataPlayers as any)[rosterKey];
                    const note = playerData.publicNote || '';
                    const role = reg.player_role ? clean(reg.player_role) : 'dps';

                    let gs = 0;
                    const n = note.toLowerCase();
                    let match;

                    if (role.includes('tank')) {
                        match = n.match(/t(\d+(\.\d+)?)/) || n.match(/mt(\d+(\.\d+)?)/);
                    } else if (role.includes('heal')) {
                        match = n.match(/h(\d+(\.\d+)?)/) || n.match(/mh(\d+(\.\d+)?)/);
                    } else {
                        match = n.match(/d(\d+(\.\d+)?)/) || n.match(/md(\d+(\.\d+)?)/) || n.match(/ad(\d+(\.\d+)?)/);
                    }

                    if (match) {
                        gs = parseFloat(match[1]) * 1000;
                    } else {
                        const numbers = n.match(/(\d+(\.\d+)?)/g);
                        if (numbers) {
                            gs = Math.max(...numbers.map(num => parseFloat(num))) * 1000;
                        }
                    }

                    let distRole = 'dps';
                    if (role.includes('tank')) distRole = 'tank';
                    else if (role.includes('heal')) distRole = 'healer';
                    else if (role.includes('melee')) distRole = 'melee';
                    else distRole = 'ranged';

                    uniquePlayers.set(cleanName, {
                        id: reg.id,
                        name: rosterKey,
                        gs,
                        role: distRole,
                        class: reg.player_class,
                        originalRegistration: reg
                    });
                }
            }
        });

        const sortedPool = Array.from(uniquePlayers.values()).sort((a, b) => b.gs - a.gs);
        console.log(`Pool de Jugadores Únicos: ${sortedPool.length}`);

        const raidsMap = new Map<string, RaidInstance>();

        for (const playerName in rosterDataPlayers) {
            const player = rosterDataPlayers[playerName];
            if (player.leaderData && player.leaderData.cores) {
                for (const core of player.leaderData.cores) {
                    const raidId = core.raid;
                    const schedule = core.schedule || '';
                    const parts = schedule.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const day = clean(parts[0]);
                        const time = parts[1];
                        const raidIdUpper = raidId.toUpperCase();
                        const key = `${raidIdUpper}|${day}|${time}`;

                        if (!raidsMap.has(key)) {
                            if (raidIdUpper.includes('ICC25N') && !raidIdUpper.includes('POR LK')) {
                                if (['miercoles', 'jueves'].includes(day)) continue;
                            }

                            let priority = 2;
                            if (raidIdUpper.includes('ICC10H ABAS') ||
                                raidIdUpper.includes('ICC25N POR LK') ||
                                raidIdUpper.includes('SR25N')) {
                                if (['miercoles', 'jueves'].includes(day)) priority = 1;
                            }

                            raidsMap.set(key, {
                                raidId: raidId,
                                day: parts[0],
                                time: time,
                                priority,
                                type: (raidIdUpper.includes('10') || raidIdUpper.includes('ICC10')) ? '10' : '25',
                                assigned: []
                            });
                        }
                    }
                }
            }
        }

        guildPlayers.forEach(reg => {
            const raidIdUpper = reg.raid_id.toUpperCase();
            const key = `${raidIdUpper}|${clean(reg.day_of_week)}|${reg.start_time}`;

            if (!raidsMap.has(key)) {
                if (raidIdUpper.includes('ICC25N') && !raidIdUpper.includes('POR LK')) {
                    const cleanDay = clean(reg.day_of_week);
                    if (['miercoles', 'jueves'].includes(cleanDay)) return;
                }

                let priority = 2;
                if (raidIdUpper.includes('ICC10H ABAS') ||
                    raidIdUpper.includes('ICC25N POR LK') ||
                    raidIdUpper.includes('SR25N')) {
                    if (['miercoles', 'jueves'].includes(clean(reg.day_of_week))) priority = 1;
                }

                raidsMap.set(key, {
                    raidId: reg.raid_id,
                    day: reg.day_of_week,
                    time: reg.start_time,
                    priority,
                    type: (raidIdUpper.includes('10') || raidIdUpper.includes('ICC10')) ? '10' : '25',
                    assigned: []
                });
            }
        });

        const raids = Array.from(raidsMap.values()).sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            if (a.type !== b.type) return b.type === '25' ? 1 : -1;
            const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            const dayA = days.indexOf(clean(a.day));
            const dayB = days.indexOf(clean(b.day));
            if (dayA !== dayB) return dayA - dayB;
            return a.time.localeCompare(b.time);
        });

        const playerSaves = new Map<string, Set<string>>();
        const assignments: any[] = [];

        const raidsByFamily = new Map<string, RaidInstance[]>();
        for (const raid of raids) {
            const family = raid.raidId.toUpperCase();
            if (!raidsByFamily.has(family)) raidsByFamily.set(family, []);
            raidsByFamily.get(family)?.push(raid);
        }

        const getRaidType = (id: string) => {
            const upper = id.toUpperCase();
            if (upper.includes('ICC10')) return 'ICC10';
            if (upper.includes('ICC25')) return 'ICC25';
            if (upper.includes('SR25') || upper.includes('SAGRARIO')) return 'SR25';
            return id;
        };

        for (const [family, familyRaids] of raidsByFamily.entries()) {
            const raidType = getRaidType(family);
            const minGS = getMinGS(family, rosterDataPlayers);
            const candidates = sortedPool.filter(p => p.gs >= minGS);
            const is25 = familyRaids[0].type === '25';
            const caps = is25
                ? { tank: 2, healer: 5, melee: 9, ranged: 9 }
                : { tank: 2, healer: 2, melee: 3, ranged: 3 };

            const roles = ['tank', 'healer', 'melee', 'ranged'];
            for (const role of roles) {
                const roleCandidates = candidates.filter(p => {
                    let pRole = p.role;
                    if (pRole === 'rango') pRole = 'ranged';
                    const saves = playerSaves.get(p.name) || new Set();
                    return pRole === role && !saves.has(raidType);
                });

                for (const player of roleCandidates) {
                    for (let i = 0; i < familyRaids.length; i++) {
                        const raid = familyRaids[i];
                        let currentCount = 0;
                        if (role === 'tank') currentCount = raid.assigned.filter(p => p.role === 'tank').length;
                        else if (role === 'healer') currentCount = raid.assigned.filter(p => p.role === 'healer').length;
                        else if (role === 'melee') currentCount = raid.assigned.filter(p => p.role === 'melee').length;
                        else if (role === 'ranged') currentCount = raid.assigned.filter(p => p.role === 'ranged' || p.role === 'rango').length;

                        const maxCap = (role === 'tank') ? caps.tank : (role === 'healer') ? caps.healer : (role === 'melee') ? caps.melee : caps.ranged;

                        if (currentCount < maxCap) {
                            raid.assigned.push(player);
                            if (!playerSaves.has(player.name)) playerSaves.set(player.name, new Set());
                            playerSaves.get(player.name)?.add(raidType);
                            assignments.push({
                                playerId: player.id,
                                playerName: player.name,
                                raidId: raid.raidId,
                                day: raid.day,
                                time: raid.time,
                                raidType
                            });
                            break;
                        }
                    }
                }
            }
        }

        for (const assign of assignments) {
            const existingReg = guildPlayers.find(r => clean(r.player_name) === clean(assign.playerName) && getRaidType(r.raid_id) === assign.raidType);
            if (existingReg) {
                await supabase.from('raid_registrations').update({ status: 'aceptado', raid_id: assign.raidId, day_of_week: assign.day, start_time: assign.time }).eq('id', existingReg.id);
            } else {
                const { data: duplicate } = await supabase.from('raid_registrations').select('id').eq('player_name', assign.playerName).eq('raid_id', assign.raidId).eq('day_of_week', assign.day).eq('start_time', assign.time).maybeSingle();
                if (duplicate) {
                    await supabase.from('raid_registrations').update({ status: 'aceptado' }).eq('id', duplicate.id);
                } else {
                    const pInfo = sortedPool.find(p => p.name === assign.playerName);
                    await supabase.from('raid_registrations').insert({ player_name: assign.playerName, player_class: pInfo?.class || 'Unknown', player_role: pInfo?.role || 'dps', raid_id: assign.raidId, day_of_week: assign.day, start_time: assign.time, status: 'aceptado' });
                }
            }
        }

        const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
        if (webhookUrl) {
            const raidFields = raids.filter(r => r.assigned.length > 0).map(r => {
                const tanks = r.assigned.filter(p => p.role === 'tank');
                const healers = r.assigned.filter(p => p.role === 'healer');
                const dps = r.assigned.filter(p => p.role === 'melee' || p.role === 'ranged' || p.role === 'dps');
                const avgGS = r.assigned.length > 0 ? Math.round(r.assigned.reduce((acc, p) => acc + p.gs, 0) / r.assigned.length) : 0;
                return {
                    name: `⚔️ ${r.raidId} (${r.day} ${r.time})`,
                    value: `👤 **Jugadores:** ${r.assigned.length}/${r.type === '25' ? '25' : '10'}\n🛡️ **T/H/D:** ${tanks.length}T / ${healers.length}H / ${dps.length}D\n📈 **GS Promedio:** ${avgGS}\n━━━━━━━━━━━━━━━━━━━━`,
                    inline: false
                };
            });

            const payload = {
                username: "Sistema de Distribución",
                avatar_url: "https://colmillo.netlify.app/images/logo.png",
                embeds: [{
                    title: "✅ Distribución de Raids Completada",
                    description: `Se han procesado **${assignments.length}** asignaciones exitosas en el roster oficial.\n\n[🔗 Ver Calendario Completo en la Web](https://colmillo.netlify.app/raids)`,
                    color: 0x10b981,
                    fields: raidFields,
                    timestamp: new Date().toISOString(),
                    footer: { text: "Colmillo de Acero • Gestión de Raids" }
                }]
            };
            await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }

        const result = { success: true, assignments_count: assignments.length, raids: raids.map(r => ({ id: r.raidId, day: r.day, count: r.assigned.length })) };
        return new Response(JSON.stringify(result, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
        console.error('Error in distribution:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};