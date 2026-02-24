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

    // 2. Filtrar No-Guild y mover a en_revision
    const rosterPlayers = Object.keys(rosterData.players).map(p => clean(p));
    // Identificar jugadores que NO están en roster.json
    const nonGuildPlayers = registrations.filter(reg => !rosterPlayers.includes(clean(reg.player_name)));
    // Identificar jugadores que SÍ están en roster.json (Pool válido)
    const guildPlayers = registrations.filter(reg => rosterPlayers.includes(clean(reg.player_name)));

    if (nonGuildPlayers.length > 0) {
      // Solo actualizamos a 'en_revision' si no lo están ya
      const toUpdate = nonGuildPlayers.filter(p => p.status !== 'en_revision');
      if (toUpdate.length > 0) {
          console.log(`Moviendo ${toUpdate.length} jugadores no-guild a 'en_revision'...`);
          const ids = toUpdate.map(p => p.id);
          await supabase
            .from('raid_registrations')
            .update({ status: 'en_revision' })
            .in('id', ids);
      }
    }

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
    // Estrategia:
    // a. Marcar TODOS los registros originales del pool como 'en_espera' primero.
    // b. Recorrer assignments y actualizar/crear.
    
    // Paso a: Reset
    const allPoolIds = sortedPool.map(p => p.id); // Solo IDs principales
    // Necesitamos TODOS los IDs de guildPlayers, no solo los del pool único.
    const allGuildRegIds = guildPlayers.map(p => p.id);
    
    if (allGuildRegIds.length > 0) {
        await supabase
            .from('raid_registrations')
            .update({ status: 'en_espera' }) // Reset temporal
            .in('id', allGuildRegIds);
    }

    // Paso b: Aplicar Asignaciones
    // Para cada asignación, buscamos si el jugador tenía un registro para ese RaidType.
    // Si sí, actualizamos ESE registro a 'aceptado' y nuevos datos.
    // Si no, actualizamos el registro principal (ID del pool) o creamos uno nuevo.
    
    for (const assign of assignments) {
        // Buscar registro original que coincida con RaidType (para reutilizarlo)
        const existingReg = guildPlayers.find(r => 
            clean(r.player_name) === clean(assign.playerName) && 
            getRaidType(r.raid_id) === assign.raidType
        );

        if (existingReg) {
            // Update
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
            // Primero verificamos si YA EXISTE un registro duplicado (por si acaso el update de en_espera no fue suficiente o hay concurrencia)
            // Buscamos por la clave única compuesta: player_name, raid_id, day_of_week, start_time
            const { data: duplicateCheck } = await supabase
                .from('raid_registrations')
                .select('id')
                .eq('player_name', assign.playerName)
                .eq('raid_id', assign.raidId)
                .eq('day_of_week', assign.day)
                .eq('start_time', assign.time)
                .maybeSingle();

            if (duplicateCheck) {
                // Si existe, lo actualizamos a aceptado
                await supabase
                    .from('raid_registrations')
                    .update({ status: 'aceptado' })
                    .eq('id', duplicateCheck.id);
            } else {
                // Si no existe, insertamos
                const { error: insertError } = await supabase
                    .from('raid_registrations')
                    .insert({
                        player_name: assign.playerName,
                        player_class: sortedPool.find(p => p.name === assign.playerName)?.class,
                        player_role: sortedPool.find(p => p.name === assign.playerName)?.role,
                        raid_id: assign.raidId,
                        day_of_week: assign.day,
                        start_time: assign.time,
                        status: 'aceptado'
                    });
                    
                if (insertError) console.error('Error insertando registro:', insertError);
            }
        }
    }

    // Resultado
    const result = {
        raids: raids.map(r => ({
            id: r.raidId,
            day: r.day,
            time: r.time,
            count: r.assigned.length,
            players: r.assigned.map(p => `${p.name} (${p.role} - ${p.gs})`)
        })),
        unassignedCount: allGuildRegIds.length - assignments.length // Aprox
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