import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import rosterData from '../../data/roster.json';

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
// These values are based on the consolidation of leaderData from roster.json, matching raids.astro logic
const DEFAULT_GS = 5000;

// Helper to get Min GS dynamically from roster data
const getMinGS = (raidId: string): number => {
    const upper = raidId.toUpperCase();
    
    // Buscar en leaderData del roster.json para encontrar la configuración real
    const players = rosterData.players as Record<string, any>;
    for (const playerName in players) {
        const player = players[playerName];
        if (player.leaderData && player.leaderData.cores) {
            for (const core of player.leaderData.cores) {
                // Verificamos si el core coincide con la raid solicitada
                const coreRaid = (core.raid || '').toUpperCase();
                
                // Lógica de coincidencia flexible
                if (coreRaid === upper || coreRaid.includes(upper) || upper.includes(coreRaid)) {
                    // Si encontramos el core, devolvemos su GS si existe
                    if (core.gs) {
                        return typeof core.gs === 'number' ? core.gs : parseInt(core.gs);
                    }
                }
            }
        }
    }
    
    // Fallback a valores conocidos si no se encuentra en el JSON dinámico
    if (upper.includes('ICC10H ABAS')) return 5800;
    if (upper.includes('ICC25N POR LK')) return 5600;
    if (upper.includes('SR25N') || upper.includes('SAGRARIO')) return 5600;
    if (upper.includes('ICC25N')) return 5400;
    
    return DEFAULT_GS;
};

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('--- Iniciando Distribución Automática de Raids ---');

    // 1. Obtener TODOS los registros relevantes (aceptado/en_revision/en_espera) para tener el pool completo
    //    Si el usuario quiere re-distribuir, debe considerar a todos.
    //    Pero el usuario dijo "comprobación en supabase de los registros de jugadores ACEPTADOS".
    //    ACTUALIZACIÓN: También debe revisar 'en_espera' y 'en_revision' para rescatar falsos positivos.
    const { data: registrations, error } = await supabase
      .from('raid_registrations')
      .select('*')
      .in('status', ['aceptado', 'en_espera', 'en_revision']);

    if (error || !registrations) {
      return new Response(JSON.stringify({ error: 'Error fetching registrations', details: error }), { status: 500 });
    }

    // 2. Filtrar No-Guild (SOLO LECTURA)
    const rosterPlayers = Object.keys(rosterData.players).map(p => clean(p));
    // Identificar jugadores que SÍ están en roster.json (Pool válido para distribución)
    const guildPlayers = registrations.filter(reg => rosterPlayers.includes(clean(reg.player_name)));
    
    // Los jugadores que NO están en el roster se ignoran por completo (no se toca su estado)
    console.log(`Jugadores en Roster: ${guildPlayers.length}. Ignorando ${registrations.length - guildPlayers.length} externos.`);

    // 3. Parsear GS y Crear Pool Único
    const uniquePlayers = new Map<string, PlayerGS>();

    guildPlayers.forEach(reg => {
      const name = reg.player_name;
      const cleanName = clean(name);
      
      // Solo consideramos el MEJOR registro si hay duplicados para el mismo rol/raid?
      // O simplemente tomamos el primero y asumimos que es la persona.
      if (!uniquePlayers.has(cleanName)) {
        const rosterKey = Object.keys(rosterData.players).find(k => clean(k) === cleanName);
        if (rosterKey) {
            const playerData = (rosterData.players as any)[rosterKey];
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

    // 4. Definir Raids (Slots Disponibles)
    // CAMBIO IMPORTANTE: No confiar solo en los registros existentes.
    // Leer los slots disponibles desde el roster.json (leaderData) para saber qué raids existen realmente.
    const raidsMap = new Map<string, RaidInstance>();

    // 4.1 Extraer raids configuradas por líderes
    const players = rosterData.players as Record<string, any>;
    for (const playerName in players) {
        const player = players[playerName];
        if (player.leaderData && player.leaderData.cores) {
            for (const core of player.leaderData.cores) {
                // Verificar si es una raid válida para distribuir
                // Normalizamos el nombre y horario
                const raidId = core.raid;
                const schedule = core.schedule || '';
                
                // Formato esperado schedule: "MIERCOLES 18:00" o similar
                // Intentamos parsear día y hora
                // FIX: Usar regex para split por espacios múltiples
                const parts = schedule.trim().split(/\s+/);
                if (parts.length >= 2) {
                    const day = clean(parts[0]);
                    const time = parts[1]; // Asumimos formato HH:MM
                    
                    const raidIdUpper = raidId.toUpperCase();
                    const key = `${raidIdUpper}|${day}|${time}`;
                    
                    if (!raidsMap.has(key)) {
                        // Excluir ICC25N Normal (sin "POR LK") en Miércoles y Jueves
                        if (raidIdUpper.includes('ICC25N') && !raidIdUpper.includes('POR LK')) {
                            if (['miercoles', 'jueves'].includes(day)) {
                                continue;
                            }
                        }

                        // Prioridad
                        let priority = 2;
                        if (raidIdUpper.includes('ICC10H ABAS') || 
                            raidIdUpper.includes('ICC25N POR LK') || 
                            raidIdUpper.includes('SR25N')) {
                            if (['miercoles', 'jueves'].includes(day)) {
                                priority = 1;
                            }
                        }

                        raidsMap.set(key, {
                            raidId: raidId,
                            day: parts[0],
                            time: time,
                            priority,
                            type: (raidIdUpper.includes('10') || raidIdUpper.includes('ICC10')) ? '10' : '25', // Detectar mejor si es 10 o 25
                            assigned: []
                        });
                    }
                }
            }
        }
    }

    // Si el mapa está vacío (fallo de lectura), fallback a lo anterior (registros)
    // FIX: Siempre asegurarnos de que las raids con gente apuntada EXISTAN en el mapa
    // incluso si no están en roster.json (casos borde)
    // Combinamos roster con registros existentes
    guildPlayers.forEach(reg => {
        const raidIdUpper = reg.raid_id.toUpperCase();
        const key = `${raidIdUpper}|${clean(reg.day_of_week)}|${reg.start_time}`;
        
        if (!raidsMap.has(key)) {
             // Excluir ICC25N Normal (sin "POR LK") en Miércoles y Jueves
             if (raidIdUpper.includes('ICC25N') && !raidIdUpper.includes('POR LK')) {
                const cleanDay = clean(reg.day_of_week);
                if (['miercoles', 'jueves'].includes(cleanDay)) {
                    // console.log(`Excluyendo raid ${reg.raid_id} (${reg.day_of_week}) del pool de distribución (sin líder). Jugadores serán redistribuidos.`);
                    return;
                }
            }

            let priority = 2;
            if (raidIdUpper.includes('ICC10H ABAS') || 
                raidIdUpper.includes('ICC25N POR LK') || 
                raidIdUpper.includes('SR25N')) {
                if (['miercoles', 'jueves'].includes(clean(reg.day_of_week))) {
                    priority = 1;
                }
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
        
        // Orden secundario por día y hora para que se llenen cronológicamente
        // Días: Lunes, Martes, Miercoles...
        const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        const dayA = days.indexOf(clean(a.day));
        const dayB = days.indexOf(clean(b.day));
        if (dayA !== dayB) return dayA - dayB;
        
        return a.time.localeCompare(b.time);
    });

    // 5. Distribución Uniforme y Estricta
    // Objetivo: Llenar TODAS las raids disponibles de forma equilibrada, no solo la primera que encuentre.
    // Estrategia: 
    // 1. Agrupar raids por TIPO (ICC10H, ICC25N, etc.)
    // 2. Para cada tipo, obtener todos los jugadores elegibles (GS >= minGS)
    // 3. Distribuir round-robin o llenar secuencialmente respetando topes
    
    const playerSaves = new Map<string, Set<string>>();
    const assignments: any[] = [];
    
    // Agrupar raids por "RaidFamily" (ej: ICC10H ABAS, ICC25N)
    const raidsByFamily = new Map<string, RaidInstance[]>();
    
    for (const raid of raids) {
        // Usamos el nombre base como familia
        // ICC10H ABAS -> ICC10H ABAS
        // ICC25N POR LK -> ICC25N POR LK
        // SR25N -> SR25N
        // ICC25N -> ICC25N
        const family = raid.raidId.toUpperCase();
        if (!raidsByFamily.has(family)) {
            raidsByFamily.set(family, []);
        }
        raidsByFamily.get(family)?.push(raid);
    }
    
    const getRaidType = (id: string) => {
        const upper = id.toUpperCase();
        if (upper.includes('ICC10')) return 'ICC10';
        if (upper.includes('ICC25')) return 'ICC25';
        if (upper.includes('SR25') || upper.includes('SAGRARIO')) return 'SR25';
        return id;
    };

    // Procesar cada familia de raids independientemente
    for (const [family, familyRaids] of raidsByFamily.entries()) {
        const raidType = getRaidType(family);
        const minGS = getMinGS(family); // Asumimos mismo GS para toda la familia
        
        // Filtrar jugadores elegibles para esta familia (GS y ID Save)
        // Nota: sortedPool ya está ordenado por GS descendente (mejores primero)
        const candidates = sortedPool.filter(p => p.gs >= minGS);
        
        // Definir caps
        const is25 = familyRaids[0].type === '25';
        const caps = is25 
            ? { tank: 2, healer: 5, melee: 9, ranged: 9 }
            : { tank: 2, healer: 2, melee: 3, ranged: 3 };

        // Distribuir por ROL para asegurar composición en cada instancia
        const roles = ['tank', 'healer', 'melee', 'ranged'];
        
        for (const role of roles) {
            const roleCandidates = candidates.filter(p => {
                // Verificar Rol
                let pRole = p.role;
                if (pRole === 'rango') pRole = 'ranged'; // Normalización extra por si acaso
                
                // Verificar si ya tiene save en este TIPO de raid (ICC10, ICC25, etc)
                const saves = playerSaves.get(p.name) || new Set();
                if (saves.has(raidType)) return false;
                
                return pRole === role;
            });
            
            // Distribuir estos candidatos entre las raids disponibles de la familia
            // Estrategia: Round-Robin para llenar parejo, o llenar una y luego la siguiente?
            // El usuario se queja de "Lunes 6, Martes 1... Viernes 44". Quiere "uniforme".
            // Round-robin es mejor para uniformidad, pero llenar secuencialmente asegura raids viables.
            // Si hacemos round-robin y tenemos 15 jugadores para 2 raids de 10 -> 8 y 7. Ambas incompletas.
            // Si llenamos secuencialmente -> 10 y 5. Una completa, una a medias.
            // El usuario dice "distribucion mas uniforme segun los topes de 10".
            // Viernes 44 es un problema de NO respetar topes.
            // Mi código anterior SI respetaba topes, pero quizás el orden de raids hacía que todos cayeran en viernes si era la primera?
            // No, el sort ponía Lunes primero.
            
            // Vamos a intentar llenar secuencialmente PERO estricto con los topes.
            // Y si sobra gente, pasar a la siguiente raid del mismo tipo.
            
            let currentRaidIndex = 0;
            
            for (const player of roleCandidates) {
                // Buscar una raid que tenga cupo para este rol
                let assigned = false;
                
                // Intentamos asignar en orden de prioridad/día (familyRaids ya está ordenado)
                for (let i = 0; i < familyRaids.length; i++) {
                    const raid = familyRaids[i];
                    
                    // Verificar cupo específico del rol
                    let currentCount = 0;
                    if (role === 'tank') currentCount = raid.assigned.filter(p => p.role === 'tank').length;
                    else if (role === 'healer') currentCount = raid.assigned.filter(p => p.role === 'healer').length;
                    else if (role === 'melee') currentCount = raid.assigned.filter(p => p.role === 'melee').length;
                    else if (role === 'ranged') currentCount = raid.assigned.filter(p => p.role === 'ranged' || p.role === 'rango').length;
                    
                    const maxCap = (role === 'tank') ? caps.tank : 
                                   (role === 'healer') ? caps.healer : 
                                   (role === 'melee') ? caps.melee : caps.ranged;
                                   
                    if (currentCount < maxCap) {
                        // Asignar
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
                        
                        assigned = true;
                        break; // Jugador asignado, pasar al siguiente jugador
                    }
                }
            }
        }
    }

    // 6. Aplicar Cambios Reales
    // Estrategia: Actualizar individualmente solo los registros necesarios.
    // Sin reset masivo de 'en_espera' para no afectar a jugadores externos o registros manuales.
    
    for (const assign of assignments) {
        // Buscar registro original que coincida con RaidType (para reutilizarlo)
        const existingReg = guildPlayers.find(r => 
            clean(r.player_name) === clean(assign.playerName) && 
            getRaidType(r.raid_id) === assign.raidType
        );

        if (existingReg) {
            // Ya tiene un registro para este TIPO de raid (ej: ICC25)
            // Lo actualizamos para que coincida con la nueva asignación
            await supabase
                .from('raid_registrations')
                .update({
                    status: 'aceptado',
                    raid_id: assign.raidId,
                    day_of_week: assign.day,
                    start_time: assign.time
                })
                .eq('id', existingReg.id);
        } else {
            // No tenía registro para este tipo de raid.
            // Comprobación de duplicados estricta antes de insertar
            const { data: duplicate } = await supabase
                .from('raid_registrations')
                .select('id')
                .eq('player_name', assign.playerName)
                .eq('raid_id', assign.raidId)
                .eq('day_of_week', assign.day)
                .eq('start_time', assign.time)
                .maybeSingle();

            if (duplicate) {
                await supabase
                    .from('raid_registrations')
                    .update({ status: 'aceptado' })
                    .eq('id', duplicate.id);
            } else {
                const pInfo = sortedPool.find(p => p.name === assign.playerName);
                await supabase
                    .from('raid_registrations')
                    .insert({
                        player_name: assign.playerName,
                        player_class: pInfo?.class || 'Unknown',
                        player_role: pInfo?.role || 'dps',
                        raid_id: assign.raidId,
                        day_of_week: assign.day,
                        start_time: assign.time,
                        status: 'aceptado'
                    });
            }
        }
    }

    // 7. Notificar por Discord (Canal Privado)
    const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
        const raidFields = raids
            .filter(r => r.assigned.length > 0)
            .map(r => {
                const tanks = r.assigned.filter(p => p.role === 'tank');
                const healers = r.assigned.filter(p => p.role === 'healer');
                const dps = r.assigned.filter(p => p.role === 'melee' || p.role === 'ranged' || p.role === 'dps');
                
                // Calcular GS promedio
                const avgGS = r.assigned.length > 0 
                    ? Math.round(r.assigned.reduce((acc, p) => acc + p.gs, 0) / r.assigned.length) 
                    : 0;

                return {
                    name: `⚔️ ${r.raidId} (${r.day} ${r.time})`,
                    value: `👤 **Jugadores:** ${r.assigned.length}/${r.type === '25' ? '25' : '10'}\n` +
                           `🛡️ **T/H/D:** ${tanks.length}T / ${healers.length}H / ${dps.length}D\n` +
                           `📈 **GS Promedio:** ${avgGS}\n` +
                           `👑 **Líder:** ${r.raidId.includes('ICC') ? 'Asignado' : 'Por definir'}\n` +
                           `━━━━━━━━━━━━━━━━━━━━`,
                    inline: false
                };
            });

        const payload = {
            username: "Sistema de Distribución",
            avatar_url: "https://colmillo.netlify.app/images/logo.png",
            embeds: [{
                title: "✅ Distribución de Raids Completada",
                description: `Se han procesado **${assignments.length}** asignaciones exitosas en el roster oficial.\n\n[🔗 Ver Calendario Completo en la Web](https://colmillo.netlify.app/raids)`,
                color: 0x10b981, // Green
                fields: raidFields,
                timestamp: new Date().toISOString(),
                footer: { text: "Colmillo de Acero • Gestión de Raids" }
            }]
        };

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    // Resultado para el navegador
    const result = {
        success: true,
        assignments_count: assignments.length,
        raids: raids.map(r => ({
            id: r.raidId,
            day: r.day,
            count: r.assigned.length
        }))
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in distribution:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};