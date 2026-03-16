import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { rosterService } from '../../services/rosterService';

// Helper to clean strings
const clean = (s: string) => (s || '').toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Interfaces
interface PlayerGS {
    id: number;
    name: string;
    gs: number;
    role: string;
    class: string;
    originalRegistration: any;
    originalRole: string; // Para diagnóstico
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

// Helper to normalize raid denominations (Weekly Save Logic)
const getRaidDenomination = (id: string) => {
    const upper = id.toUpperCase().replace(/\s+/g, ' ').trim();
    
    // ICC
    if (upper.includes('ICC25H')) return 'ICC25H';
    if (upper.includes('ICC25N')) return 'ICC25N';
    if (upper.includes('ICC10H')) return 'ICC10H';
    if (upper.includes('ICC10N')) return 'ICC10N';
    
    // SR
    if (upper.includes('SR25H') || upper.includes('SAGRARIO 25H')) return 'SR25H';
    if (upper.includes('SR25N') || upper.includes('SAGRARIO 25N')) return 'SR25N';
    if (upper.includes('SR10H') || upper.includes('SAGRARIO 10H')) return 'SR10H';
    if (upper.includes('SR10N') || upper.includes('SAGRARIO 10N')) return 'SR10N';
    
    // TOC
    if (upper.includes('TOC25H') || upper.includes('PRUEBA 25H')) return 'TOC25H';
    if (upper.includes('TOC25N') || upper.includes('PRUEBA 25N')) return 'TOC25N';
    if (upper.includes('TOC10H') || upper.includes('PRUEBA 10H')) return 'TOC10H';
    if (upper.includes('TOC10N') || upper.includes('PRUEBA 10N')) return 'TOC10N';

    // Fallback genérico por tamaño si no se especifica dificultad (asumir N)
    if (upper.includes('25')) {
        if (upper.includes('ICC')) return 'ICC25N';
        if (upper.includes('SR') || upper.includes('SAGRARIO')) return 'SR25N';
        if (upper.includes('TOC') || upper.includes('PRUEBA')) return 'TOC25N';
        return 'RAID25';
    }
    if (upper.includes('10')) {
        if (upper.includes('ICC')) return 'ICC10N';
        if (upper.includes('SR') || upper.includes('SAGRARIO')) return 'SR10N';
        if (upper.includes('TOC') || upper.includes('PRUEBA')) return 'TOC10N';
        return 'RAID10';
    }

    return upper;
};

// Day Order starting from Wednesday (Server Reset)
const dayOrder: Record<string, number> = {
    'miercoles': 0,
    'jueves': 1,
    'viernes': 2,
    'sabado': 3,
    'domingo': 4,
    'lunes': 5,
    'martes': 6
};

// Helper to get Min GS dynamically from roster data
const getMinGS = (raidId: string, rosterDataPlayers: Record<string, any>): number => {
    const upper = raidId.toUpperCase().replace(/\s+/g, ' ').trim();

    for (const playerName in rosterDataPlayers) {
        const player = rosterDataPlayers[playerName];
        if (player.leaderData && player.leaderData.cores) {
            for (const core of player.leaderData.cores) {
                const coreRaid = (core.raid || '').toUpperCase().replace(/\s+/g, ' ').trim();
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

export const GET: APIRoute = async ({ request, cookies }) => {
    // Check authentication and role
    const session = cookies.get('admin_session')?.value;
    const role = cookies.get('admin_role')?.value;

    if (!session || role !== 'admin') {
        return new Response(JSON.stringify({ error: 'No autorizado. Se requiere rol de administrador.' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const url = new URL(request.url);
        const strategy = url.searchParams.get('strategy') || 'high-to-low'; // high-to-low o low-to-high

        console.log(`--- Iniciando Distribución Automática (${strategy}) ---`);

        const rosterResult = await rosterService.getFormattedRoster(true); // Force fresh for distribution
        const rosterDataPlayers = rosterResult.players || {};

        const { data: registrations, error } = await supabase
            .from('raid_registrations')
            .select('*')
            .in('status', ['aceptado', 'en_espera', 'en_revision']);

        if (error || !registrations) {
            return new Response(JSON.stringify({ error: 'Error fetching registrations', details: error }), { status: 500 });
        }

        // --- LIMPIEZA DE DUPLICADOS DE SAVE (Pre-distribución) ---
        // Priorizar registros 'aceptado', luego por orden cronológico.
        const playerDenomRegistrations = new Map<string, any>();
        const toSetEnEspera = new Set<number>();

        // 1. Limpieza de Registros IDÉNTICOS (Mismo personaje, misma banda exacta)
        const seenIdentical = new Set<string>();
        const sortedRegsForCleanup = [...registrations].sort((a, b) => {
            // Prioridad: 1. Aceptados, 2. Con Notas, 3. ID más antiguo
            if (a.status === 'aceptado' && b.status !== 'aceptado') return -1;
            if (a.status !== 'aceptado' && b.status === 'aceptado') return 1;
            if ((a.player_notes || '').length > (b.player_notes || '').length) return -1;
            return a.id - b.id;
        });

        const filteredRegs = sortedRegsForCleanup.filter(reg => {
            // La clave de identidad debe incluir el NOMBRE del personaje
            const key = `${clean(reg.player_name)}|${clean(reg.raid_id)}|${clean(reg.day_of_week)}|${clean(reg.start_time)}`;
            if (seenIdentical.has(key)) {
                toSetEnEspera.add(reg.id);
                return false;
            }
            seenIdentical.add(key);
            return true;
        });

        // 2. Limpieza de Duplicados de SAVE (Mismo save, distinto día/hora)
        filteredRegs.forEach(reg => {
            const playerName = clean(reg.player_name);
            const denom = getRaidDenomination(reg.raid_id);
            const key = `${playerName}|${denom}`;

            if (playerDenomRegistrations.has(key)) {
                // Ya existe un registro prioritario para este save
                toSetEnEspera.add(reg.id);
            } else {
                playerDenomRegistrations.set(key, reg);
            }
        });

        console.log(`--- Limpieza: ${toSetEnEspera.size} registros duplicados marcados para 'en_espera' ---`);

        // --- PROCESAMIENTO DE JUGADORES ---
        const playerPool: PlayerGS[] = [];
        
        // Identificar jugadores de hermandad y externos
        registrations.forEach(reg => {
            // Si ya fue marcado como duplicado, no lo incluimos en el pool de distribución activa
            if (toSetEnEspera.has(reg.id)) return;

            const cleanName = clean(reg.player_name);
            const rosterKey = Object.keys(rosterDataPlayers).find(k => clean(k) === cleanName);
            const role = reg.player_role ? clean(reg.player_role) : 'dps';
            const playerNotes = (reg.player_notes || '').toLowerCase();
            
            let distRole = 'ranged';
            if (role.includes('tank')) distRole = 'tank';
            else if (role.includes('heal')) distRole = 'healer';
            else if (role.includes('melee')) distRole = 'melee';
            else if (role.includes('ranged') || role.includes('rango')) distRole = 'ranged';
            else {
                // Fallback inteligente por clase
                const meleeClasses = ['warrior', 'guerrero', 'rogue', 'picaro', 'deathknight', 'dk', 'paladin'];
                const rangedClasses = ['mage', 'mago', 'hunter', 'cazador', 'warlock', 'brujo', 'priest', 'sacerdote'];
                
                const className = (reg.player_class || '').toLowerCase();
                
                if (meleeClasses.some(c => className.includes(c))) distRole = 'melee';
                else if (rangedClasses.some(c => className.includes(c))) distRole = 'ranged';
                else if (className.includes('druid') || className.includes('druida')) {
                    // Druida: feral/gato/oso = melee, pollo/equilibrio = ranged
                    distRole = (role.includes('pollo') || role.includes('equi') || role.includes('balan')) ? 'ranged' : 'melee';
                } else if (className.includes('shaman') || className.includes('chaman')) {
                    // Chaman: mejora = melee, elemental = ranged
                    distRole = (role.includes('ele')) ? 'ranged' : 'melee';
                }
            }

            let gs = 0;
            let note = '';
            
            if (rosterKey) {
                const playerData = (rosterDataPlayers as any)[rosterKey];
                note = (playerData.publicNote || '').toLowerCase();
            } else {
                // Para externos, intentamos sacar el GS de sus propias notas de inscripción
                note = playerNotes;
            }

            let match;
            // Extraer GS de la nota (ej: T6.5H5.5)
            if (distRole === 'tank') {
                match = note.match(/t(\d+(\.\d+)?)/) || note.match(/mt(\d+(\.\d+)?)/);
            } else if (distRole === 'healer') {
                match = note.match(/h(\d+(\.\d+)?)/) || note.match(/mh(\d+(\.\d+)?)/);
            } else {
                match = note.match(/d(\d+(\.\d+)?)/) || note.match(/md(\d+(\.\d+)?)/) || note.match(/ad(\d+(\.\d+)?)/);
            }

            if (match) {
                const val = parseFloat(match[1]);
                gs = val < 10 ? val * 1000 : val;
            } else {
                const numbers = note.match(/(\d+(\.\d+)?)/g);
                if (numbers) {
                    const maxNum = Math.max(...numbers.map(num => parseFloat(num)));
                    gs = maxNum < 10 ? maxNum * 1000 : maxNum;
                }
            }

            // Fallback GS para miembros de hermandad si no hay nota o es muy bajo
            if (rosterKey && gs < 2000) gs = DEFAULT_GS;
            // Para externos sin nota, GS 1 para que solo llenen huecos si no hay nadie más
            if (!rosterKey && gs < 100) gs = 1;

            playerPool.push({
                id: reg.id,
                name: rosterKey || reg.player_name,
                gs,
                role: distRole,
                class: reg.player_class,
                originalRegistration: reg,
                originalRole: role
            });
        });

        // --- PROCESAMIENTO DE BANDAS ---
        const raidsMap = new Map<string, RaidInstance>();

        // 1. Obtener bandas de los CORES (Líderes)
        for (const playerName in rosterDataPlayers) {
            const player = rosterDataPlayers[playerName];
            if (player.leaderData?.cores) {
                player.leaderData.cores.forEach((core: any) => {
                    if (!core.raid || !core.schedule) return;
                    const parts = core.schedule.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        const day = clean(parts[0]);
                        const time = parts[1];
                        const raidIdUpper = core.raid.toUpperCase().trim();
                        const key = `${raidIdUpper}|${day}|${time}`;

                        if (!raidsMap.has(key)) {
                            raidsMap.set(key, {
                                raidId: core.raid,
                                day: parts[0],
                                time: time,
                                priority: 1, // Cores oficiales tienen prioridad 1
                                type: (raidIdUpper.includes('10') || raidIdUpper.includes('ICC10')) ? '10' : '25',
                                assigned: []
                            });
                        }
                    }
                });
            }
        }

        // 2. Obtener bandas de las INSCRIPCIONES (Incluso si no son cores)
        registrations.forEach(reg => {
            const raidIdUpper = reg.raid_id.toUpperCase().trim();
            const key = `${raidIdUpper}|${clean(reg.day_of_week)}|${reg.start_time}`;

            if (!raidsMap.has(key)) {
                raidsMap.set(key, {
                    raidId: reg.raid_id,
                    day: reg.day_of_week,
                    time: reg.start_time,
                    priority: 2, // Inscripciones manuales prioridad 2
                    type: (raidIdUpper.includes('10') || raidIdUpper.includes('ICC10')) ? '10' : '25',
                    assigned: []
                });
            }
        });

        // --- LÓGICA DE DISTRIBUCIÓN ---
        
        // Un jugador solo puede hacer una raid de la misma denominación por semana
        const playerWeeklySaves = new Map<string, Set<string>>();
        const assignments: any[] = [];
        const assignedRegIds = new Set<number>();

        // --- PRE-RELLENADO ---
        // SIEMPRE pre-rellenamos lo que ya está 'aceptado' para que el sistema sepa qué huecos están ocupados,
        // independientemente de la estrategia.
        registrations.forEach(reg => {
            if (reg.status === 'aceptado') {
                const cleanDay = clean(reg.day_of_week);
                const key = `${reg.raid_id.toUpperCase().trim()}|${cleanDay}|${reg.start_time}`;
                const raid = raidsMap.get(key);
                
                if (raid) {
                    // Buscamos al jugador en el playerPool (que excluye duplicados de save)
                    const player = playerPool.find(p => p.id === reg.id);
                    if (player) {
                        raid.assigned.push(player);
                        assignedRegIds.add(player.id);
                        
                        const raidDenom = getRaidDenomination(raid.raidId);
                        if (!playerWeeklySaves.has(player.name)) playerWeeklySaves.set(player.name, new Set());
                        playerWeeklySaves.get(player.name)?.add(raidDenom);
                    }
                }
            }
        });
        console.log(`--- Pre-rellenado: ${assignedRegIds.size} jugadores ya aceptados mantenidos en sus puestos ---`);

        // Ordenar pool según estrategia (Solo los que NO han sido asignados aún)
        const sortedPool = playerPool.filter(p => !assignedRegIds.has(p.id)).sort((a, b) => {
            if (strategy === 'low-to-high') {
                return a.gs - b.gs; // Menor GS primero para Iniciación
            }
            return b.gs - a.gs; // Mayor GS primero para Pro
        });

        console.log(`--- Pool de Distribución Activa: ${sortedPool.length} jugadores pendientes ---`);

        // Agrupar raids por denominación y ordenar por día (Miércoles primero) y luego GS según estrategia
        const raids = Array.from(raidsMap.values()).sort((a, b) => {
            const dayA = dayOrder[clean(a.day)] ?? 99;
            const dayB = dayOrder[clean(b.day)] ?? 99;
            
            // 1. Ordenar por día (Miércoles = 0, Jueves = 1, etc.)
            if (dayA !== dayB) {
                return dayA - dayB;
            }

            // 2. Dentro del mismo día, ordenar por GS Requerido
            const gsA = getMinGS(a.raidId, rosterDataPlayers);
            const gsB = getMinGS(b.raidId, rosterDataPlayers);
            
            if (strategy === 'low-to-high') {
                return gsA - gsB; // Llenar primero las de menor GS (Iniciación)
            }
            return gsB - gsA; // Llenar primero las de mayor GS (Pro - Default)
        });

        for (const raid of raids) {
            const minGS = getMinGS(raid.raidId, rosterDataPlayers);
            const is25 = raid.type === '25';
            const caps = is25
                ? { tank: 2, healer: 5, melee: 9, ranged: 9 }
                : { tank: 2, healer: 2, melee: 3, ranged: 3 };

            // En Iniciación, si la raid no está llena, permitimos un pequeño "overflow" de DPS para no dejar a nadie fuera
            if (strategy === 'low-to-high' && is25) {
                caps.melee = 10;
                caps.ranged = 10;
            }

            const roles: ('tank' | 'healer' | 'melee' | 'ranged')[] = ['tank', 'healer', 'melee', 'ranged'];
            const raidDenom = getRaidDenomination(raid.raidId);

            for (const role of roles) {
                const currentRoleCount = () => raid.assigned.filter(p => p.role === role).length;
                const maxRoleCap = caps[role];

                // Buscar candidatos para este rol
                const candidates = sortedPool.filter(p => {
                    if (assignedRegIds.has(p.id)) return false;
                    
                    // Si es Iniciación, permitimos que cualquier DPS llene cualquier slot de DPS
                    const isPlayerDPS = p.role === 'melee' || p.role === 'ranged';
                    const isSlotDPS = role === 'melee' || role === 'ranged';
                    
                    if (strategy === 'low-to-high' && isPlayerDPS && isSlotDPS) {
                        // OK - DPS flexible para Iniciación
                    } else if (p.role !== role) {
                        return false;
                    }

                    // Bloqueo de save semanal por denominación (ICC25N, ICC25H, etc)
                    const saves = playerWeeklySaves.get(p.name) || new Set();
                    if (saves.has(raidDenom)) return false;

                    // Para Iniciación (low-to-high), el GS NO es un bloqueador (queremos ubicar a todos)
                    if (strategy === 'low-to-high') return true;

                    // Para Pro (high-to-low), mantenemos el requisito de GS mínimo de la banda
                    if (p.gs < minGS) return false;

                    return true;
                });

                for (const player of candidates) {
                    if (currentRoleCount() < maxRoleCap) {
                        raid.assigned.push(player);
                        assignedRegIds.add(player.id);
                        
                        // Registrar save semanal por denominación (Normalizado)
                        if (!playerWeeklySaves.has(player.name)) playerWeeklySaves.set(player.name, new Set());
                        playerWeeklySaves.get(player.name)?.add(raidDenom);

                        assignments.push({
                            regId: player.id,
                            status: 'aceptado',
                            raid_id: raid.raidId,
                            day: raid.day,
                            time: raid.time
                        });
                    }
                }
            }
        }

        // Marcar el resto como en espera (incluyendo duplicados de save)
        const unassignedRegs = registrations.filter(r => !assignedRegIds.has(r.id));
        
        for (const reg of unassignedRegs) {
            assignments.push({
                regId: reg.id,
                status: 'en_espera'
            });
        }

        // --- ACTUALIZAR BASE DE DATOS ---
        console.log(`--- Actualizando ${assignments.length} registros en la base de datos ---`);
        console.log(`--- (Aceptados: ${assignments.filter(a => a.status === 'aceptado').length} | En Espera: ${assignments.filter(a => a.status === 'en_espera').length}) ---`);
        
        const updatePromises = assignments.map(async (ass) => {
            const updateData: any = { status: ass.status };
            if (ass.status === 'aceptado') {
                updateData.raid_id = ass.raid_id;
                updateData.day_of_week = ass.day;
                updateData.start_time = ass.time;
            } else {
                // Si lo pasamos a espera, nos aseguramos de NO tocar raid_id/day/time 
                // para evitar violar la restricción única con otro registro existente.
            }
            const { error } = await supabase.from('raid_registrations').update(updateData).eq('id', ass.regId);
            if (error) {
                console.error(`Error actualizando registro ${ass.regId}:`, error);
                // Si falla por clave duplicada al intentar aceptar, lo ponemos en espera como fallback
                if (error.code === '23505' && ass.status === 'aceptado') {
                    await supabase.from('raid_registrations').update({ status: 'en_espera' }).eq('id', ass.regId);
                }
            }
        });

        await Promise.all(updatePromises);

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