export const prerender = false;

import {
  getUpcomingRaids,
  GUILD_TIMEZONE,
  getAllRaidSchedules,
  getRaidRosterForScheduleWithExternal,
} from '../../utils/raidUtils';
import { rosterService } from '../../services/rosterService';
import { supabase } from '../../lib/supabase';

// Mensajes aleatorios generales
const GENERAL_MESSAGES = [
  {
    title: ":shield: Addon RaidDominion",
    description: "Descrube nuestro addon para dirigir raids y cómo usarlo.",
    url: "https://colmillo.netlify.app/",
    color: 0xf59e0b // Amber
  },
  {
    title: ":calendar: Calendario de Raids",
    description: "No te pierdas ninguna raid. Consulta nuestros horarios y apúntate en el sistema.",
    url: "https://colmillo.netlify.app/raids",
    color: 0x3b82f6 // Blue
  },
  {
    title: ":scroll: Guias de Raideo",
    description: "Encuentra información detallada sobre cómo jugar y participar en raids.",
    url: "https://colmillo.netlify.app/guides",
    color: 0x10b981 // Green
  },
  {
    title: ":group: ¡Únete a Colmillo de Acero!",
    description: "¿Buscas una hermandad comprometida? Revisa nuestras normas y roster. ¡Te estamos esperando!",
    url: "https://colmillo.netlify.app/roster",
    color: 0x8b5cf6 // Violet
  },
  {
    title: ":game_die: ¡Ruleta Colmillo de Acero!",
    description: "¿Quieres ganar una Gargantilla carmesí de la Reina de Sangre? ¡Juega en la ruleta y participa en el sorteo!",
    url: "https://colmillo.netlify.app/ruleta",
    color: 0xf59e0b // Amber
  }
];

export const GET = async ({ request, url }) => {
  try {
    const isTest = url.searchParams.get('test') === 'true';
    
    // Configuración del Webhook
    const webhookUrl = isTest 
      ? import.meta.env.DISCORD_WEBHOOK_URL 
      : import.meta.env.DISCORD_PUBLIC_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error(`Webhook URL is not defined (isTest: ${isTest})`);
      return new Response(JSON.stringify({ error: 'Webhook configuration missing' }), { status: 500 });
    }

    // Lógica de Selección de Mensaje
    let messageType = 'NONE';
    let upcomingRaids = [];
    const testType = url.searchParams.get('type'); // 'RAID', 'ROSTER', 'WEEKLY', 'SUMMARY', 'SCHEDULE', 'GENERAL'
    
    if (isTest) {
        // En test, si no se especifica tipo, es aleatorio
        messageType = testType?.toUpperCase() || (Math.random() < 0.5 ? 'RAID' : 'GENERAL');
        
        if (messageType === 'RAID') {
             upcomingRaids = getUpcomingRaids(null); // Buscar cualquiera
             if (upcomingRaids.length === 0) {
                 upcomingRaids = [{
                    raid_name: 'ICC25N',
                    day_of_week: 'lunes',
                    start_time: '22:00',
                    leader: 'TestLeader'
                 }];
             }
        }
    } else {
        // En producción
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: GUILD_TIMEZONE }));
        const minutes = now.getMinutes();
        
        console.log(`[Production Check] Time: ${now.toISOString()} (${GUILD_TIMEZONE}), Minutes: ${minutes}`);

        // 1. Prioridad: Raid Inminente (30 mins)
        upcomingRaids = getUpcomingRaids(30, 15); // Aumentamos ventana a 15 mins para mayor fiabilidad con el cron
        
        if (upcomingRaids.length > 0) {
            console.log(`[Production Check] Upcoming raids found: ${upcomingRaids.length}`);
            messageType = 'RAID';
        } else {
            // 2. Secundaria: Mensaje General (Cada media hora)
            // Aumentamos la ventana a 15 minutos para asegurar que el cron de GitHub (que a veces se retrasa) lo capture
            if ((minutes >= 0 && minutes < 15) || (minutes >= 30 && minutes < 45)) {
                console.log(`[Production Check] General message window active (minutes: ${minutes})`);
                messageType = 'GENERAL';
            } else {
                console.log(`[Production Check] Outside general message window (minutes: ${minutes})`);
            }
        }
    }

    // Ejecutar envío según tipo
    if (messageType === 'NONE') {
      return new Response(JSON.stringify({ 
        message: 'No actions required at this time.',
        timestamp: new Date().toISOString()
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // --- ENVÍO MENSAJE GENERAL / DINÁMICO ---
    const isGeneralMessage = ['GENERAL', 'SUMMARY', 'ROSTER', 'WEEKLY', 'SCHEDULE', 'POLLS'].includes(messageType);
    if (isGeneralMessage) {
        const nowServer = new Date(new Date().toLocaleString('en-US', { timeZone: GUILD_TIMEZONE }));
        const currentDay = nowServer.toLocaleDateString('es-ES', { weekday: 'long', timeZone: GUILD_TIMEZONE }).toLowerCase();
        const allSchedules = getAllRaidSchedules();
        
        const dynamicMessages = [...GENERAL_MESSAGES];

        // Conexión a Supabase para las encuestas
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        let pollResults = [];
        
        if (supabaseUrl && supabaseKey) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data } = await supabase.from('schedule_votes').select('*');
            pollResults = data || [];
        }

        // --- 5. RESULTADOS DE ENCUESTAS ---
        const pollFields = [];
        
        // Agrupar votos por respuestas (Día y Raid/Dificultad)
        const votesByDay: Record<string, any[]> = {};
        pollResults.forEach(v => {
            const day = v.day_of_week || 'Sin día';
            const raid = v.raid_name || '?';
            const diff = v.difficulty || '?';
            const size = v.size || '?';
            const time = v.preferred_time || '?';
            
            if (!votesByDay[day]) votesByDay[day] = [];
            votesByDay[day].push({ raid, diff, size, time });
        });

        const daysInOrderES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

        daysInOrderES.forEach(day => {
            const dayVotes = votesByDay[day];
            if (dayVotes && dayVotes.length > 0) {
                // Contar combinaciones
                const counts: Record<string, number> = {};
                dayVotes.forEach(dv => {
                    const key = `• \`${dv.time}\` **${dv.raid}** (${dv.diff.charAt(0)}${dv.size})`;
                    counts[key] = (counts[key] || 0) + 1;
                });
                
                const summary = Object.entries(counts)
                    .map(([text, count]) => `${text} x${count}`)
                    .join('\n');

                pollFields.push({
                    name: `📅 ${day.charAt(0).toUpperCase() + day.slice(1)}`,
                    value: summary,
                    inline: true
                });
            }
        });

        const pollsMsg = {
            title: "🗳️ Voto por horario",
            description: "Preferencia de bandas y horarios de los miembros:",
            fields: pollFields.length > 0 ? pollFields : [{ name: "Sin votos", value: "Aún no hay votos registrados.", inline: false }],
            url: "https://colmillo.netlify.app/voto-horario",
            color: 0x10b981,
            type: 'POLLS'
        };
        dynamicMessages.push(pollsMsg);

        // --- 0. Utilidades de normalización de días ---
        const normalizeDay = (day: string): string =>
          day
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace('miércoles', 'miercoles')
            .replace('sábado', 'sabado');

        const currentDayNormalized = normalizeDay(currentDay);
        const tomorrowDate = new Date(nowServer);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowDayRaw = tomorrowDate
          .toLocaleDateString('es-ES', { weekday: 'long', timeZone: GUILD_TIMEZONE })
          .toLowerCase();
        const tomorrowDayNormalized = normalizeDay(tomorrowDayRaw);
        
        // --- 1. RESUMEN DE ROSTER POR RANGOS ---
        // Usar la misma lógica centralizada que en `roster.astro`/`raids.astro`
        const rosterFormattedData = await rosterService.getFormattedRoster();
        const players = (rosterFormattedData as any).players || {};
        const activePlayers = Object.values(players).filter((p: any) => !p.guildLeave);
        const totalMembers = activePlayers.length;
        const rankCounts: Record<string, number> = {};
        
        activePlayers.forEach((p: any) => {
            const rank = p.rank || 'Sin Rango';
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        });

        // Metadatos de actualización: reutilizar la lógica ya validada del servicio
        const globalLastUpdate = rosterFormattedData.globalLastUpdate;
        const lastUpdatedBy = rosterFormattedData.lastUpdatedBy || 'Desconocido';
        const lastUpdatedAt = rosterFormattedData.lastUpdatedAt || null;

        const lastUpdateDate = lastUpdatedAt
          ? new Date(lastUpdatedAt)
          : globalLastUpdate
          ? new Date(globalLastUpdate * 1000)
          : null;
        const formattedDate = lastUpdateDate 
            ? lastUpdateDate.toLocaleString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: GUILD_TIMEZONE 
              }) 
            : 'Desconocida';

        // Ordenar rangos por jerarquía específica
        const rankHierarchy = ['Administrador', 'Oficial', 'Explorador', 'Iniciado', 'Aspirante'];
        
        const sortedRanks = Object.entries(rankCounts).sort((a, b) => {
            const indexA = rankHierarchy.indexOf(a[0]);
            const indexB = rankHierarchy.indexOf(b[0]);
            
            // Si ambos están en la jerarquía, usar ese orden
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // Si solo uno está, ese va primero
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            // Si ninguno está, por cantidad descendente
            return b[1] - a[1];
        });

        const rosterFields: any[] = [];
        // Añadir Total como primer campo destacado
        rosterFields.push({ name: "📊 Total Miembros", value: `**${totalMembers}**`, inline: true });
        rosterFields.push({ name: "🕒 Última Actualización", value: `${formattedDate}`, inline: true });
        rosterFields.push({ name: "✍️ Autor", value: `${lastUpdatedBy}`, inline: true });
        
        sortedRanks.forEach(([rank, count]) => {
            rosterFields.push({
                name: rank,
                value: `**${count}**`,
                inline: true
            });
        });
        
        const rosterMsg = {
            title: "👥 Estado del Roster",
            description: "Distribución actual de miembros por rango:",
            fields: rosterFields,
            url: "https://colmillo.netlify.app/roster",
            color: 0x8b5cf6,
            type: 'ROSTER'
        };
        dynamicMessages.push(rosterMsg);

        // --- 2. RESUMEN SEMANAL DE RAIDS (Supabase como fuente y días en columnas) ---
        const daysInOrder = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

        // Leer directamente de Supabase los registros aceptados
        const { data: weeklyRegistrations, error: weeklyError } = await supabase
          .from('raid_registrations')
          .select('raid_id, day_of_week, start_time, status')
          .eq('status', 'aceptado');

        const weeklyFields: any[] = [];

        if (!weeklyError && weeklyRegistrations && weeklyRegistrations.length > 0) {
          // Agrupar por (raid_id, day_of_week, start_time)
          const slotsMap = new Map<string, { raidId: string; day: string; time: string; count: number }>();

          weeklyRegistrations.forEach((reg: any) => {
            const rawDay = (reg.day_of_week || '').toString().toLowerCase();
            const normalizedDay = rawDay
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace('miércoles', 'miercoles')
              .replace('sábado', 'sabado');

            const time = (reg.start_time || '').toString().padStart(5, '0').substring(0, 5);
            const raidId = (reg.raid_id || '').toString().toUpperCase().trim();

            if (!raidId || !normalizedDay || !time) return;

            const key = `${raidId}-${normalizedDay}-${time}`;
            if (!slotsMap.has(key)) {
              slotsMap.set(key, { raidId, day: normalizedDay, time, count: 0 });
            }
            const slot = slotsMap.get(key)!;
            slot.count += 1;
          });

          for (const day of daysInOrder) {
            const daySlots = Array.from(slotsMap.values())
              .filter((s) => s.day === day)
              .sort((a, b) => {
                const [ah, am] = a.time.split(':').map(Number);
                const [bh, bm] = b.time.split(':').map(Number);
                let aMinutes = ah * 60 + am;
                let bMinutes = bh * 60 + bm;
                // Tratar 00:00 como final del día para orden (después de 23:00)
                if (aMinutes === 0) aMinutes = 24 * 60;
                if (bMinutes === 0) bMinutes = 24 * 60;
                return aMinutes - bMinutes;
              });

            if (daySlots.length === 0) continue;

            const linesForDay: string[] = [];

            daySlots.forEach((slot) => {
              const playersLabel =
                slot.count > 0
                  ? `${slot.count} jugador${slot.count === 1 ? '' : 'es'} confirmados`
                  : 'sin jugadores confirmados aún';

              linesForDay.push(`• \`${slot.time}\` **${slot.raidId}** — ${playersLabel}`);
            });

            weeklyFields.push({
              name: `📅 ${day.charAt(0).toUpperCase() + day.slice(1)}`,
              value: linesForDay.join('\n'),
              inline: true,
            });
          }
        }

        // Campo extra con CTA si hay al menos un día con contenido
        if (weeklyFields.length > 0) {
          weeklyFields.push({
            name: 'ℹ️ Registro',
            value:
              '📌 *Apúntate en las listas de invitación en la web para asegurar tu plaza: https://colmillo.netlify.app/raids*',
            inline: false,
          });
        }

        const weeklyMsg = {
            title: "⚔️ Actividad Semanal",
            description: weeklyFields.length > 0
              ? "Resumen de raids confirmadas esta semana:"
              : "No hay raids programadas esta semana. Revisa el calendario y apúntate cuando se abran nuevas bandas.",
            url: "https://colmillo.netlify.app/raids",
            color: 0xef4444,
            type: 'WEEKLY',
            fields: weeklyFields.length > 0 ? weeklyFields : undefined,
        };
        dynamicMessages.push(weeklyMsg);

        // --- 3. RESUMEN DE RAIDS HOY/MAÑANA (Supabase + columnas) ---
        const summaryFields: any[] = [];

        try {
          const { data: summaryRegs, error: summaryError } = await supabase
            .from('raid_registrations')
            .select('raid_id, day_of_week, start_time, status')
            .in('status', ['aceptado', 'en_revision', 'en_espera']);

          if (!summaryError && summaryRegs && summaryRegs.length > 0) {
            // Agrupar por (raid_id, day, time)
            type Slot = { raidId: string; day: string; time: string };
            const slotsMap = new Map<string, Slot>();

            summaryRegs.forEach((reg: any) => {
              const day = normalizeDay((reg.day_of_week || '').toString());
              const time = (reg.start_time || '').toString().padStart(5, '0').substring(0, 5);
              const raidId = (reg.raid_id || '').toString().toUpperCase().trim();
              if (!raidId || !day || !time) return;

              const key = `${raidId}-${day}-${time}`;
              if (!slotsMap.has(key)) {
                slotsMap.set(key, { raidId, day, time });
              }
            });

            const targets = [
              { key: currentDayNormalized, label: 'Hoy' },
              { key: tomorrowDayNormalized, label: 'Mañana' },
            ];

            for (const target of targets) {
              const daySlots = Array.from(slotsMap.values())
                .filter((s) => s.day === target.key)
                .sort((a, b) => {
                  const [ah, am] = a.time.split(':').map(Number);
                  const [bh, bm] = b.time.split(':').map(Number);
                  let aMinutes = ah * 60 + am;
                  let bMinutes = bh * 60 + bm;
                  if (aMinutes === 0) aMinutes = 24 * 60;
                  if (bMinutes === 0) bMinutes = 24 * 60;
                  return aMinutes - bMinutes;
                });

              if (daySlots.length === 0) continue;

              const linesForDay: string[] = [];

              daySlots.forEach((slot) => {
                // Calcular tiempo restante respecto a nowServer
                const [h, m] = slot.time.split(':').map(Number);
                const raidDate = new Date(nowServer);
                if (target.key === tomorrowDayNormalized) {
                  raidDate.setDate(raidDate.getDate() + 1);
                }
                if (h === 0 && m === 0) {
                  raidDate.setHours(24, 0, 0, 0);
                } else {
                  raidDate.setHours(h, m, 0, 0);
                }

                const diffMs = raidDate.getTime() - nowServer.getTime();
                const totalMinutes = Math.floor(diffMs / 60000);

                let timeInfo = '';
                if (diffMs < 0) {
                  timeInfo = '*(ya finalizada o en curso)*';
                } else {
                  const hrs = Math.floor(totalMinutes / 60);
                  const mins = totalMinutes % 60;
                  timeInfo = hrs > 0 ? `(en ${hrs}h ${mins}m)` : `(en ${mins}m)`;
                }

                linesForDay.push(`• \`${slot.time}\` **${slot.raidId}** ${timeInfo}`);
              });

              const prettyDay =
                target.key === currentDayNormalized
                  ? currentDay
                  : tomorrowDayRaw;

              summaryFields.push({
                name: `${target.label} (${prettyDay.charAt(0).toUpperCase() + prettyDay.slice(1)})`,
                value: linesForDay.join('\n'),
                inline: true,
              });
            }
          }
        } catch (e) {
          console.error('Error building SUMMARY from Supabase:', e);
        }

        if (summaryFields.length > 0) {
          const summaryMsg = {
            title: "📅 Próximas Raids",
            description: "Raids programadas para hoy y mañana:",
            url: "https://colmillo.netlify.app/raids",
            color: 0xff0000,
            type: 'SUMMARY',
            fields: summaryFields,
          };
          dynamicMessages.push(summaryMsg);
        }

        // Selección del mensaje (Test específico o aleatorio)
        let msg;
        if (isTest && testType) {
            msg = dynamicMessages.find(m => (m as any).type === messageType) || dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)];
        } else {
            msg = dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)];
        }
        
        const payload = {
          username: "Portal Web Colmillo de Acero",
          avatar_url: "https://colmillo.netlify.app/images/logo.png",
          content: isTest ? ":loudspeaker: **【 TEST MENSAJE GENERAL 】**" : undefined,
          embeds: [
            {
              title: msg.title,
              description: msg.description,
              url: msg.url,
              color: msg.color,
              fields: (msg as any).fields || undefined,
              thumbnail: { url: "https://colmillo.netlify.app/images/logo.png" },
              footer: {
                text: "Colmillo de Acero • Comunidad",
                icon_url: "https://colmillo.netlify.app/images/logo.png",
              },
            },
          ],
        };

        // Enviar solo la card visual (embed), sin mensaje previo con enlace
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        return new Response(JSON.stringify({ success: true, type: messageType }), { status: 200 });
    }

    // --- ENVÍO MENSAJE RAID (Lógica anterior refinada) ---
    if (messageType === 'RAID') {
        const embeds = await Promise.all(upcomingRaids.map(async (raid) => {
      const raidLink = `https://colmillo.netlify.app/raids?raid-id=${encodeURIComponent(raid.raid_name)}&day=${encodeURIComponent(raid.day_of_week)}`;
      const roster = await getRaidRosterForScheduleWithExternal(raid);
      const leaderInfo = roster.leaderClass ? `${raid.leader} — ${roster.leaderClass}` : raid.leader;
      const tanksList = roster.tank.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';
      const healersList = roster.healer.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';
      const meleeList = roster.melee.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';
      const rangedList = roster.ranged.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';
      const sanctionedList = roster.sanctioned.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';

      // Calcular tiempo restante dinámico
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: GUILD_TIMEZONE }));
      const [h, m] = raid.start_time.split(':').map(Number);
      const raidTime = new Date(now);
      raidTime.setHours(h, m, 0, 0);
      
      let diffMs = raidTime.getTime() - now.getTime();
      // Si la diferencia es negativa (ej: son las 23:50 y la raid es a las 00:00 del día siguiente, o casos de borde)
      // Ajustamos si asumimos que es una raid próxima
      if (diffMs < -12 * 60 * 60 * 1000) { // Si pasó hace más de 12 horas, probablemente es mañana
         diffMs += 24 * 60 * 60 * 1000;
      } else if (diffMs < 0) {
         // Si es negativa pero pequeña (ej. -1 min), ponemos 0 o "Ahora"
         diffMs = 0;
      }
      
      // Formato amigable de tiempo
      const totalMinutes = Math.ceil(diffMs / 60000);
      let timeString = "";
      
      if (totalMinutes <= 0) {
          timeString = "¡AHORA MISMO!";
      } else {
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          if (hours > 0) {
              timeString = `en ${hours} ${hours === 1 ? 'hora' : 'horas'}${minutes > 0 ? ` y ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}` : ''}`;
          } else {
              timeString = `en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
          }
      }

      const embed = {
        title: `:warning: Recordatorio de Raid: ${raid.raid_name} (${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})`,
        url: raidLink, 
        description: `@everyone La raid de **${raid.raid_name}** liderada por **${raid.leader}** está programada para comenzar **${timeString}** via **RaidDominion**.\n\n:point_right: **¡Reacciona a este mensaje para confirmar tu asistencia y estar listo para la invocación!**\n\n[【Ver Roster Completo en la Web】](${raidLink})`,
        color: 0xff0000, 
        thumbnail: {
          url: "https://colmillo.netlify.app/images/logo.png"
        },
        fields: [
          // Fila 1: Hora / Día / Líder
          { name: ":alarm_clock: Hora de Inicio", value: raid.start_time, inline: true },
          { name: ":calendar: Día", value: raid.day_of_week.charAt(0).toUpperCase() + raid.day_of_week.slice(1), inline: true },
          { name: ":king: Líder", value: leaderInfo, inline: true },
          
          // Separador visual o salto de línea forzado si es necesario, pero inline: false ya hace salto.
          
          // Fila 2: Tanques / Sanadores (2 columnas para dar más ancho)
          { name: ":shield: Tanques", value: tanksList, inline: true },
          { name: ":herb: Sanadores", value: healersList, inline: true },
          { name: "\u200b", value: "\u200b", inline: true }, // Spacer invisible para mantener grid de 3 si discord fuerza 3
          
          // Fila 3: Melee / Ranged / Sancionados
          { name: ":crossed_swords: Cuerpo a Cuerpo", value: meleeList, inline: true },
          { name: ":bow_and_arrow: A Distancia", value: rangedList, inline: true },
          { name: ":no_entry: Sancionados", value: sanctionedList, inline: true }
        ],
        footer: {
          text: "Sistema de Notificaciones RaidDominion",
          icon_url: "https://colmillo.netlify.app/images/logo.png",
        },
        timestamp: now.toISOString()
      };
      return embed;
    }));

    // 3. Enviar a Discord
    // Nota: Para que el enlace final genere su propia preview/metadata, Discord a veces requiere que el contenido esté separado o sea el único enlace.
    // Sin embargo, en un webhook con embeds, el contenido de texto (content) aparece ANTES de los embeds visualmente.
    // Si queremos que el enlace aparezca "después" de la card (embed), técnicamente no se puede en un solo mensaje de webhook estándar (el orden es Content -> Embeds).
    // PERO, si ponemos el enlace en el 'content', aparecerá arriba.
    // El usuario pide "aparezca luego del card".
    // La única forma de hacer que algo aparezca visualmente DESPUÉS de un embed en Discord es enviar DOS mensajes o usar un truco.
    // O quizás se refiere a que el enlace esté solo para que despliegue metadata.
    // Si ponemos el enlace dentro del content junto con texto, a veces no despliega metadata si hay embeds.
    // Vamos a intentar enviar el enlace en un segundo mensaje o aceptar que estará arriba.
    // Releyendo: "aparezca luego del card... debido a que no permite que el enlace despliegue su metadata".
    // Si hay embeds en el mensaje, Discord suele suprimir la preview de los enlaces del content.
    // Solución: Enviar primero la notificación con el embed, y luego un segundo mensaje con el enlace solo.
    
    // 1. Enviar primero el mensaje solo con el enlace para generar preview
    const nowServer = new Date(new Date().toLocaleString('en-US', { timeZone: GUILD_TIMEZONE }));
    const monthName = nowServer.toLocaleString('es-ES', { month: 'long' });
    const currentYear = nowServer.getFullYear();
    const dynamicLabel = `Temporada ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${currentYear}`;

    const payloadLink = {
        username: "Portal Web Colmillo de Acero",
        avatar_url: "https://colmillo.netlify.app/images/logo.png",
        content: `[:link: ${dynamicLabel}](https://colmillo.netlify.app/raids)`
    };

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadLink)
    });

    // 2. Enviar la notificación con el embed (Roster)
    const payloadMain = {
      username: "Portal Web Colmillo de Acero",
      avatar_url: "https://colmillo.netlify.app/images/logo.png",
      content: (isTest ? ":loudspeaker: **【 TEST DE AVISO DE RAID 】**" : ":loudspeaker: **【 AVISO DE RAID PRÓXIMA 】 ** <@&1336049966465454153>"),
      embeds: embeds
    };

    const responseMain = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadMain)
    });

    if (!responseMain.ok) {
      throw new Error(`Discord API Error (Main): ${responseMain.status} ${await responseMain.text()}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      raids_notified: upcomingRaids.length,
      details: upcomingRaids 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    } // Closing brace for if (messageType === 'RAID')

    // Fallback response for any cases not covered above
    return new Response(JSON.stringify({ 
      message: 'Processing complete, no specific action taken.',
      type: messageType,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in check-raids:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
