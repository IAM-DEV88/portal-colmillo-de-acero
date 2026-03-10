export const prerender = false;

import {
  getUpcomingRaids,
  GUILD_TIMEZONE,
  getAllRaidSchedules,
  getRaidRosterForScheduleWithExternal,
} from '../../utils/raidUtils';
import { rosterService } from '../../services/rosterService';
import { supabase } from '../../lib/supabase';

// Días de la semana en orden para el reporte semanal
const DAYS_IN_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function normalizeDay(d: string): string {
  if (!d) return '';
  return d.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace('miércoles', 'miercoles')
    .replace('sábado', 'sabado')
    .trim();
}

function getShiftedDay(day: string, time: string): string {
  // Ya no desplazamos. Respetamos el día de la base de datos para coincidir con la web.
  return normalizeDay(day);
}

export const GET = async ({ url }: { url: URL }) => {
  try {
    const isTest = url.searchParams.get('test') === 'true';
    const testType = url.searchParams.get('type');

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
    let upcomingRaids: any[] = [];

    if (isTest) {
      messageType = testType?.toUpperCase() || (Math.random() < 0.5 ? 'RAID' : 'GENERAL');
      if (messageType === 'RAID') {
        upcomingRaids = await getUpcomingRaids(null, 5, true); // Force fresh
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
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: GUILD_TIMEZONE }));
      const minutes = now.getMinutes();
      upcomingRaids = await getUpcomingRaids(30, 15, true); // Force fresh

      if (upcomingRaids.length > 0) {
        messageType = 'RAID';
      } else if ((minutes >= 0 && minutes < 15) || (minutes >= 30 && minutes < 45)) {
        messageType = 'GENERAL';
      }
    }

    if (messageType === 'NONE') {
      return new Response(JSON.stringify({ message: 'No actions required' }), { status: 200 });
    }

    const isGeneralMessage = ['GENERAL', 'SUMMARY', 'ROSTER', 'WEEKLY', 'SCHEDULE', 'POLLS'].includes(messageType);

    if (isGeneralMessage) {
      const nowServer = new Date(new Date().toLocaleString('en-US', { timeZone: GUILD_TIMEZONE }));
      
      // Ajuste de sesión: Si son menos de las 4 AM, consideramos que aún es el "día de raideo" anterior
      // para que las raids de las 00:00 se muestren como "Mañana" durante la noche anterior.
      const sessionDate = new Date(nowServer);
      if (nowServer.getHours() < 4) {
        sessionDate.setDate(sessionDate.getDate() - 1);
      }

      const currentDay = sessionDate.toLocaleDateString('es-ES', { weekday: 'long', timeZone: GUILD_TIMEZONE }).toLowerCase();
      const currentDayNormalized = normalizeDay(currentDay);

      const tomorrowDate = new Date(sessionDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowDayRaw = tomorrowDate.toLocaleDateString('es-ES', { weekday: 'long', timeZone: GUILD_TIMEZONE }).toLowerCase();
      const tomorrowDayNormalized = normalizeDay(tomorrowDayRaw);

      const dynamicMessages: any[] = [];

      // 1. Encuestas
      let pollResults: any[] = [];
      try {
        const { data } = await supabase.from('schedule_votes').select('*');
        pollResults = data || [];
      } catch (e) {
        console.error('Error fetching polls:', e);
      }

      const pollFields: any[] = [];
      const votesByDay: Record<string, any[]> = {};
      pollResults.forEach(v => {
        const day = v.day_of_week || 'Sin día';
        if (!votesByDay[day]) votesByDay[day] = [];
        votesByDay[day].push({ raid: v.raid_name, diff: v.difficulty, size: v.size, time: v.preferred_time });
      });

      ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].forEach(day => {
        const dayVotes = votesByDay[day];
        if (dayVotes && dayVotes.length > 0) {
          const counts: Record<string, number> = {};
          dayVotes.forEach(dv => {
            const key = `• \`${dv.time}\` **${dv.raid}** (${dv.diff?.charAt(0)}${dv.size})`;
            counts[key] = (counts[key] || 0) + 1;
          });
          pollFields.push({
            name: `📅 ${day.charAt(0).toUpperCase() + day.slice(1)}`,
            value: Object.entries(counts).map(([text, count]) => `${text} x${count}`).join('\n'),
            inline: false
          });
        }
      });

      if (pollFields.length > 0 || messageType === 'POLLS') {
        dynamicMessages.push({
          title: "🗳️ ¡Ayuda a la hermandad!",
          description: "Contribuye a planificar y ejecutar nuestros raideos de manera más eficiente.\n* Deja tu voto por la banda y horario que más prefieras [*aquí*](https://colmillo.netlify.app/voto-horario)\n* Además, encuentra información detallada sobre las mecánicas de raids en nuestra [*sección de guías*](https://colmillo.netlify.app/guides).\n\n📊 **Resultados de la encuesta**:",
          fields: pollFields.length > 0 ? pollFields : [{ name: "Sin votos", value: "Aún no hay votos.", inline: false }],
          url: "https://colmillo.netlify.app/voto-horario",
          color: 0x10b981,
          type: 'POLLS'
        });
      }

      // 2. Roster
      const rosterFormattedData = await rosterService.getFormattedRoster(true); // Always fresh for Discord notifications
      const players = (rosterFormattedData as any).players || {};
      const activePlayers = Object.values(players).filter((p: any) => !p.guildLeave);
      const rankCounts: Record<string, number> = {};
      activePlayers.forEach((p: any) => { rankCounts[p.rank || 'Sin Rango'] = (rankCounts[p.rank || 'Sin Rango'] || 0) + 1; });

      const lastUpdatedAt = rosterFormattedData.lastUpdatedAt || (rosterFormattedData.globalLastUpdate ? rosterFormattedData.globalLastUpdate * 1000 : null);
      const formattedDate = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: GUILD_TIMEZONE }) : 'Desconocida';

      const rosterFields = [
        { name: "📊 Total Miembros", value: `**${activePlayers.length}**`, inline: true },
        { name: "🕒 Última Actualización", value: `${formattedDate}`, inline: true },
        { name: "✍️ Autor", value: `${rosterFormattedData.lastUpdatedBy || 'Desconocido'}`, inline: true }
      ];

      ['Administrador', 'Oficial', 'Explorador', 'Iniciado', 'Aspirante'].forEach(rank => {
        if (rankCounts[rank]) rosterFields.push({ name: rank, value: `**${rankCounts[rank]}**`, inline: true });
      });

      dynamicMessages.push({
        title: "🤝 **¡Únete a Colmillo de Acero!**",
        description: "¿Buscas una hermandad comprometida?\n\n**Colmillo de Acero** recluta jugadores de todo nivel para complementar cores 5.6k+ de raideo diario.\n* WISP función y GS al Administrador/Oficial en linea para subir de rango y actualizar su nota.\n* Rangos superiores podran participar en [raideos](https://colmillo.netlify.app/raids), sorteos, [ruletas](https://colmillo.netlify.app/ruleta) y mostrar detalles de sus personajes en la web.\n* Horarios de raid desde las 18:00 hora server en adelante.\n* Unete a nuestra comunidad en [Whatsapp](https://chat.whatsapp.com/Ek9BcgjvzrCAcyRRvWL72g)\n* Explora mucho más en nuestro [portal web](https://colmillo.netlify.app/).\n\n👥 Estado del Roster",
        fields: rosterFields,
        url: "https://colmillo.netlify.app/roster",
        color: 0x8b5cf6,
        type: 'ROSTER'
      });

      // 3. Weekly / Summary logic
      const slotsMap = new Map<string, { raidId: string; day: string; time: string; count: number; isOfficial?: boolean; minGS?: number }>();

      // Fetch Cores
      Object.values(players).forEach((member: any) => {
        if (member.leaderData?.cores) {
          member.leaderData.cores.forEach((core: any) => {
            const timeMatch = String(core.schedule).match(/(\d{1,2}:\d{2})/);
            if (!timeMatch) return;
            const time = timeMatch[1].padStart(5, '0');
            const dayMatch = String(core.schedule).toLowerCase().match(/(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)/);
            if (!dayMatch) return;
            const day = getShiftedDay(dayMatch[1], time);
            const raidId = core.raid.toUpperCase().trim();
            const minGS = core.gs || 0;
            const key = `${raidId}-${day}-${time}`;
            
            if (!slotsMap.has(key)) {
              slotsMap.set(key, { raidId, day, time, count: 0, isOfficial: true, minGS });
            } else {
              slotsMap.get(key)!.isOfficial = true;
              if (minGS > 0) slotsMap.get(key)!.minGS = minGS;
            }
          });
        }
      });

      // Fetch Registrations
      const { data: regs } = await supabase.from('raid_registrations').select('raid_id, day_of_week, start_time, status').in('status', ['aceptado', 'en_revision', 'en_espera']);
      (regs || []).forEach(reg => {
        const time = (reg.start_time || '').toString().padStart(5, '0').substring(0, 5);
        const day = getShiftedDay(reg.day_of_week || '', time);
        const raidId = (reg.raid_id || '').toString().toUpperCase().trim();
        const key = `${raidId}-${day}-${time}`;
        if (!slotsMap.has(key)) slotsMap.set(key, { raidId, day, time, count: 0 });
        if (reg.status === 'aceptado') slotsMap.get(key)!.count += 1;
      });

      // Build WEEKLY
      const currentMonth = nowServer.toLocaleDateString('es-ES', { month: 'long', timeZone: GUILD_TIMEZONE });
      const seasonTitle = `Temporada ${currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} ${nowServer.getFullYear()}`;

      const weeklyFields: any[] = [];
      for (const day of DAYS_IN_ORDER) {
        const daySlots = Array.from(slotsMap.values()).filter(s => s.day === day).sort((a, b) => {
          let am = a.time === '00:00' ? 1440 : Number(a.time.split(':')[0]) * 60 + Number(a.time.split(':')[1]);
          let bm = b.time === '00:00' ? 1440 : Number(b.time.split(':')[0]) * 60 + Number(b.time.split(':')[1]);
          return am - bm;
        });
        if (daySlots.length > 0) {
          weeklyFields.push({
            name: `📅 ${day.charAt(0).toUpperCase() + day.slice(1)}`,
            value: daySlots.map(s => {
              const gsText = s.minGS ? ` Min. \`${s.minGS} \`` : '';
              return `• \`${s.time}\` [**${s.raidId}**](https://colmillo.netlify.app/raids?raid-id=${encodeURIComponent(s.raidId)}&day=${encodeURIComponent(s.day)})${gsText} (${s.count} registrados)${s.isOfficial ? ' [CORE]' : ''}`;
            }).join('\n'),
            inline: false
          });
        }
      }
      if (weeklyFields.length > 0) {
        dynamicMessages.push({
          title: `⚔️ Horario de Raideo Semanal - ${seasonTitle}`,
          description: "Oficiales y rangos superiores gestionan los **horarios de raideo** de **Colmillo de Acero**\n* Es **importante consultar horarios** de raideo directamente en [**nuestra web**](https://colmillo.netlify.app/raids/)\n* Llevamos registros para **tener en cuenta a los jugadores mas comprometidos** y sancionar a quienes no aportan nada.\n* Garantizamos la invitación a **quienes se hayan registrado en nuestra web**, incluso si no son miembros de la hermandad.\n* El **Rango Oficial** es otorgado a **quienes arman y dirigen bandas** y concede **acceso** inmediato a **opciones avanzadas** del addon **RaidDominion** para dirigir raids.",
          fields: weeklyFields,
          url: "https://colmillo.netlify.app/raids",
          color: 0xef4444,
          type: 'WEEKLY'
        });
      }

      // Build SUMMARY
      const summaryFields: any[] = [];
      [{ key: currentDayNormalized, label: 'Hoy', raw: currentDay }, { key: tomorrowDayNormalized, label: 'Mañana', raw: tomorrowDayRaw }].forEach(target => {
        const daySlots = Array.from(slotsMap.values()).filter(s => s.day === target.key).sort((a, b) => {
          let am = a.time === '00:00' ? 1440 : Number(a.time.split(':')[0]) * 60 + Number(a.time.split(':')[1]);
          let bm = b.time === '00:00' ? 1440 : Number(b.time.split(':')[0]) * 60 + Number(b.time.split(':')[1]);
          return am - bm;
        });
        if (daySlots.length > 0) {
          summaryFields.push({
            name: `${target.label} (${target.raw.charAt(0).toUpperCase() + target.raw.slice(1)})`,
            value: daySlots.map(s => {
              const gsText = s.minGS ? ` Min. GS \`${s.minGS}\`` : '';
              return `• \`${s.time}\` [**${s.raidId}**](https://colmillo.netlify.app/raids?raid-id=${encodeURIComponent(s.raidId)}&day=${encodeURIComponent(s.day)})${gsText} (${s.count} registrados)`;
            }).join('\n'),
            inline: false
          });
        }
      });
      if (summaryFields.length > 0) {
        dynamicMessages.push({
          title: "📅 Próximas Raids",
          description: "Para asegurar el éxito en nuestras raids es crucial cumplir con los siguientes requisitos mínimos:\n* **Gearscore**: Debes estar por encima del gearscore requerido para la banda.\n* **Equipamiento**: Asegúrate de que tu equipamiento esté devidamente engemado y encantado.\n* **Piezas PVE**: No se permite el uso de ninguna pieza de equipamiento PVP",
          fields: summaryFields,
          url: "https://colmillo.netlify.app/raids",
          color: 0xff0000,
          type: 'SUMMARY'
        });
      }

      // 4. Evitar mensajes repetidos (Lógica de Persistencia en Supabase)
      let lastMsgType = '';
      try {
          const { data } = await supabase.from('config').select('value').eq('key', 'last_discord_msg_type').single();
          lastMsgType = data?.value || '';
      } catch (e) {
          console.error('Error fetching last message type:', e);
      }

      // Filtrar mensajes para no repetir el último enviado (si hay más de uno disponible)
      const availableMessages = dynamicMessages.length > 1 
        ? dynamicMessages.filter(m => m.type !== lastMsgType)
        : dynamicMessages;

      // Choose Message
      let msg = isTest && testType 
        ? dynamicMessages.find(m => m.type === messageType) 
        : availableMessages[Math.floor(Math.random() * availableMessages.length)];
      
      if (!msg) msg = dynamicMessages[0];

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Portal Web Colmillo de Acero",
          avatar_url: "https://colmillo.netlify.app/images/logo.png",
          content: isTest ? ":loudspeaker: **【 TEST MENSAJE GENERAL 】**" : undefined,
          embeds: [{
            title: msg.title,
            description: msg.description,
            fields: msg.fields,
            url: msg.url,
            color: msg.color,
            footer: { text: "Colmillo de Acero • Comunidad", icon_url: "https://colmillo.netlify.app/images/logo.png" }
          }]
        })
      });

      // Guardar el tipo de mensaje enviado para la próxima ejecución
      if (!isTest && msg.type) {
          await supabase.from('config').upsert({ key: 'last_discord_msg_type', value: msg.type }, { onConflict: 'key' });
      }

      return new Response(JSON.stringify({ success: true, type: msg.type }), { status: 200 });
    }

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
        if (diffMs < -12 * 60 * 60 * 1000) {
          diffMs += 24 * 60 * 60 * 1000;
        } else if (diffMs < 0) {
          diffMs = 0;
        }

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

        return {
          title: `:warning: Recordatorio de Raid: ${raid.raid_name} (${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})`,
          url: raidLink,
          description: `@everyone La raid de **${raid.raid_name}** liderada por **${raid.leader}** está programada para comenzar **${timeString}** via **RaidDominion**.\n\n:point_right: **Garantía de invitación para asistentes registrados en la web.**\n\n[**【Apuntarse a ${raid.raid_name}】**](${raidLink})`,
          color: 0xff0000,
          thumbnail: { url: "https://colmillo.netlify.app/images/logo.png" },
          fields: [
            { name: ":alarm_clock: Hora de Inicio", value: `\`${raid.start_time}\``, inline: true },
            { name: ":calendar: Día", value: `\`${raid.day_of_week.charAt(0).toUpperCase() + raid.day_of_week.slice(1)}\``, inline: true },
            { name: ":guard: Líder", value: `**${leaderInfo}**`, inline: true },
            { name: ":shield: Tanques", value: tanksList, inline: true },
            { name: ":herb: Sanadores", value: healersList, inline: true },
            { name: "\u200b", value: "\u200b", inline: true },
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
      }));

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Portal Web Colmillo de Acero",
          avatar_url: "https://colmillo.netlify.app/images/logo.png",
          content: isTest ? ":loudspeaker: **【 TEST AVISO RAID 】**" : ":loudspeaker: **【 AVISO DE RAID PRÓXIMA 】** <@&1336049966465454153>",
          embeds
        })
      });
      return new Response(JSON.stringify({ success: true, count: upcomingRaids.length }), { status: 200 });
    }

    return new Response(JSON.stringify({ message: 'No action taken', type: messageType }), { status: 200 });

  } catch (error: any) {
    console.error('Error in check-raids:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
