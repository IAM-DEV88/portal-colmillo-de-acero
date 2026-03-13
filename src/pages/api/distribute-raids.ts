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
    const upper = raidId.toUpperCase().replace(/\s+/g, '');

    for (const playerName in rosterDataPlayers) {
        const player = rosterDataPlayers[playerName];
        if (player.leaderData && player.leaderData.cores) {
            for (const core of player.leaderData.cores) {
                const coreRaid = (core.raid || '').toUpperCase().replace(/\s+/g, '');
                if (coreRaid === upper || coreRaid.includes(upper) || upper.includes(coreRaid)) {
                    if (core.gs) {
                        return typeof core.gs === 'number' ? core.gs : parseInt(core.gs);
                    }
                }
            }
        }
    }

    if (upper.includes('ICC25H')) return 6000;
    if (upper.includes('ICC10H')) return 5800;
    if (upper.includes('ICC25N')) return 5000;
    if (upper.includes('SR25') || upper.includes('SAGRARIO')) return 5800;
    if (upper.includes('ICC10N')) return 5500;

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

        // Identificar jugadores de hermandad vs externos
        const guildPlayersRegs = registrations.filter(reg => {
            const cleanName = clean(reg.player_name);
            const rosterKey = Object.keys(rosterDataPlayers).find(k => clean(k) === cleanName);
            // Solo es de hermandad si está en el roster Y NO ha marcado guild_leave
            // El rosterService.getFormattedRoster ya filtra los que tienen guild_leave: true
            return rosterKey !== undefined;
        });
        
        const externalPlayersRegs = registrations.filter(reg => !guildPlayersRegs.includes(reg));

        // Poner externos en espera inmediatamente
        if (externalPlayersRegs.length > 0) {
            await supabase.from('raid_registrations')
                .update({ status: 'en_espera' })
                .in('id', externalPlayersRegs.map(r => r.id));
        }

        console.log(`Registros de Hermandad: ${guildPlayersRegs.length}. Externos (en espera): ${externalPlayersRegs.length}.`);

        const playerPool: PlayerGS[] = [];

        guildPlayersRegs.forEach(reg => {
            const name = reg.player_name;
            const cleanName = clean(name);

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

                playerPool.push({
                    id: reg.id,
                    name: rosterKey,
                    gs,
                    role: distRole,
                    class: reg.player_class,
                    originalRegistration: reg
                });
            }
        });

        const sortedPool = playerPool.sort((a, b) => b.gs - a.gs);
        console.log(`Pool de Inscripciones de Hermandad: ${sortedPool.length}`);

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
                        const raidIdUpper = raidId.toUpperCase().replace(/\s+/g, '');
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

        guildPlayersRegs.forEach(reg => {
            const raidIdUpper = reg.raid_id.toUpperCase().replace(/\s+/g, '');
            const key = `${raidIdUpper}|${clean(reg.day_of_week)}|${reg.start_time}`;

            if (!raidsMap.has(key)) {
                // Prioridad según el día (Miércoles en adelante)
                const dayOrder = ['miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'lunes', 'martes'];
                const cleanDay = clean(reg.day_of_week);
                let priority = 2;
                
                // Bandas core suelen ser miercoles/jueves/sabado
                if (['miercoles', 'jueves'].includes(cleanDay)) priority = 1;

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
            
            const dayOrder = ['miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'lunes', 'martes'];
            const dayA = dayOrder.indexOf(clean(a.day));
            const dayB = dayOrder.indexOf(clean(b.day));
            if (dayA !== dayB) return dayA - dayB;
            return a.time.localeCompare(b.time);
        });

        const playerSaves = new Map<string, Set<string>>();

        const getRaidType = (id: string) => {
            const upper = id.toUpperCase().replace(/\s+/g, '');
            if (upper.includes('ICC10H')) return 'ICC10H';
            if (upper.includes('ICC10N')) return 'ICC10N';
            if (upper.includes('ICC25H')) return 'ICC25H';
            if (upper.includes('ICC25N')) return 'ICC25N';
            if (upper.includes('SR25') || upper.includes('SAGRARIO')) return 'SR25';
            return id;
        };

        const assignments: any[] = [];
        const assignedPlayerIds = new Set<number>(); // Track IDs of registrations that were accepted

        // Agrupar bandas por familia (ej: todos los ICC25N)
        const raidsByFamily = new Map<string, RaidInstance[]>();
        for (const raid of raids) {
            const family = getRaidType(raid.raidId);
            if (!raidsByFamily.has(family)) raidsByFamily.set(family, []);
            raidsByFamily.get(family)?.push(raid);
        }

        // Definir orden de procesamiento por exigencia de GS (Mayor a Menor)
        const familyPriorityOrder = [
            'ICC25H',
            'ICC10H',
            'SR25',
            'ICC25N',
            'ICC10N'
        ];

        const sortedFamilies = Array.from(raidsByFamily.keys()).sort((a, b) => {
            const indexA = familyPriorityOrder.findIndex(f => a.includes(f));
            const indexB = familyPriorityOrder.findIndex(f => b.includes(f));
            
            // Si no está en la lista, prioridad baja
            const pA = indexA === -1 ? 99 : indexA;
            const pB = indexB === -1 ? 99 : indexB;
            
            return pA - pB;
        });

        // Procesar cada familia de banda en orden de exigencia
        for (const family of sortedFamilies) {
            const familyRaids = raidsByFamily.get(family)!;
            const raidType = family;
            
            // Candidatos del roster oficial que cumplen el GS mínimo para esta familia
            const minGSRequired = getMinGS(familyRaids[0].raidId, rosterDataPlayers);
            const candidates = sortedPool.filter(p => p.gs >= minGSRequired);
            
            const is25 = familyRaids[0].type === '25';
            const caps = is25
                ? { tank: 2, healer: 5, melee: 9, ranged: 9 }
                : { tank: 2, healer: 2, melee: 3, ranged: 3 };

            const roles = ['tank', 'healer', 'melee', 'ranged'];
            
            for (const role of roles) {
                // Candidatos para este rol específico que no tengan save de esta banda todavía
                // IMPORTANTE: Un jugador puede ir a varias bandas distintas (ej: ICC25 y SR25)
                const roleCandidates = candidates.filter(p => {
                    let pRole = p.role;
                    if (pRole === 'rango') pRole = 'ranged';
                    const saves = playerSaves.get(p.name) || new Set();
                    return pRole === role && !saves.has(raidType);
                });

                for (const player of roleCandidates) {
                    // 1. PRIMERO: Intentar asignar al jugador a la banda que él solicitó originalmente (si hay cupo)
                    const originalReg = player.originalRegistration;
                    const originalRaidKey = `${originalReg.raid_id.toUpperCase().replace(/\s+/g, '')}|${clean(originalReg.day_of_week)}|${originalReg.start_time}`;
                    
                    const originalRaid = familyRaids.find(r => {
                        const rKey = `${r.raidId.toUpperCase().replace(/\s+/g, '')}|${clean(r.day)}|${r.time}`;
                        return rKey === originalRaidKey;
                    });

                    let assigned = false;

                    if (originalRaid) {
                        let currentCount = 0;
                        if (role === 'tank') currentCount = originalRaid.assigned.filter(p => p.role === 'tank').length;
                        else if (role === 'healer') currentCount = originalRaid.assigned.filter(p => p.role === 'healer').length;
                        else if (role === 'melee') currentCount = originalRaid.assigned.filter(p => p.role === 'melee').length;
                        else if (role === 'ranged') currentCount = originalRaid.assigned.filter(p => p.role === 'ranged' || p.role === 'rango').length;

                        const maxCap = (role === 'tank') ? caps.tank : (role === 'healer') ? caps.healer : (role === 'melee') ? caps.melee : caps.ranged;

                        if (currentCount < maxCap) {
                            originalRaid.assigned.push(player);
                            if (!playerSaves.has(player.name)) playerSaves.set(player.name, new Set());
                            playerSaves.get(player.name)?.add(raidType);
                            
                            assignedPlayerIds.add(player.id);
                            assignments.push({
                                playerId: player.id,
                                playerName: player.name,
                                raidId: originalRaid.raidId,
                                day: originalRaid.day,
                                time: originalRaid.time,
                                raidType
                            });
                            assigned = true;
                        }
                    }

                    if (assigned) continue;

                    // 2. SEGUNDO: Si su banda pedida está llena o no existe en esta familia, intentar en CUALQUIER OTRA banda de la misma familia
                    for (let i = 0; i < familyRaids.length; i++) {
                        const raid = familyRaids[i];
                        
                        // Saltar si es la misma que ya intentamos
                        const rKey = `${raid.raidId.toUpperCase().replace(/\s+/g, '')}|${clean(raid.day)}|${raid.time}`;
                        if (rKey === originalRaidKey) continue;

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
                            
                            assignedPlayerIds.add(player.id);
                            assignments.push({
                                playerId: player.id,
                                playerName: player.name,
                                raidId: raid.raidId,
                                day: raid.day,
                                time: raid.time,
                                raidType
                            });
                            break; // Jugador asignado, pasar al siguiente candidato
                        }
                    }
                }
            }
        }

        // Actualizar estados en la base de datos
        // 1. Marcar los asignados como 'aceptado' y moverlos al día/hora correspondiente
        for (const assign of assignments) {
            await supabase.from('raid_registrations')
                .update({ 
                    status: 'aceptado', 
                    raid_id: assign.raidId, 
                    day_of_week: assign.day, 
                    start_time: assign.time 
                })
                .eq('id', assign.playerId);
        }

        // 2. Marcar como 'en_espera' a los jugadores de hermandad que no pudieron ser asignados
        const unassignedGuildRegs = guildPlayersRegs.filter(reg => !assignedPlayerIds.has(reg.id));
        if (unassignedGuildRegs.length > 0) {
            await supabase.from('raid_registrations')
                .update({ status: 'en_espera' })
                .in('id', unassignedGuildRegs.map(r => r.id));
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
                    description: `Se han procesado **${assignments.length}** asignaciones exitosas.\n⚠️ **En Espera:** ${registrations.length - assignments.length} (Externos o sin cupo).\n\n[🔗 Ver Calendario Completo en la Web](https://colmillo.netlify.app/raids)`,
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