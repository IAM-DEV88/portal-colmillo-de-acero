export const prerender = false;

import { getUpcomingRaids, GUILD_TIMEZONE, getRaidRosterForScheduleWithExternal } from '../../utils/raidUtils';
import rosterData from '../../data/roster.json';

export const GET = async ({ request, url }) => {
  try {
    const isTest = url.searchParams.get('test') === 'true';
    let upcomingRaids = [];

    if (isTest) {
      // En modo test, buscar la raid más próxima (sin ventana de tiempo)
      // Pasamos null como minutesAhead para activar la búsqueda de "la siguiente más cercana"
      upcomingRaids = getUpcomingRaids(null);
      
      if (upcomingRaids.length === 0) {
        // Fallback si no encuentra nada (raro si hay roster)
         upcomingRaids = [
          {
            raid_name: 'ICC25N',
            day_of_week: 'lunes',
            start_time: '22:00',
            leader: 'TestLeader'
          }
        ];
      }
    } else {
      // 1. Verificar si hay raids próximas (30 minutos antes)
      upcomingRaids = getUpcomingRaids(30, 10); // Ventana de 10 minutos para ser flexible con el cron
    }

    if (upcomingRaids.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No upcoming raids found in the next 30 minutes.',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Preparar payload para Discord
    // Si es test, usar canal admin/privado. Si es real, usar canal público.
    const webhookUrl = isTest 
      ? import.meta.env.DISCORD_WEBHOOK_URL 
      : import.meta.env.DISCORD_PUBLIC_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error(`Webhook URL is not defined (isTest: ${isTest})`);
      return new Response(JSON.stringify({ error: 'Webhook configuration missing' }), { status: 500 });
    }

    const embeds = await Promise.all(upcomingRaids.map(async (raid) => {
      const raidLink = `https://colmillo.netlify.app/raids?raid-id=${encodeURIComponent(raid.raid_name)}&day=${encodeURIComponent(raid.day_of_week)}`;
      const roster = await getRaidRosterForScheduleWithExternal(raid);
      const leaderInfo = roster.leaderClass ? `${raid.leader} — ${roster.leaderClass}` : raid.leader;
      const tanksList = roster.tank.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';
      const healersList = roster.healer.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';
      const meleeList = roster.melee.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';
      const rangedList = roster.ranged.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';
      const sanctionedList = roster.sanctioned.map(p => p.class ? `${p.name} — ${p.class}` : p.name).join('\n') || '—';

      const embed = {
        title: `⚠️ Recordatorio de Raid: ${raid.raid_name} (${new Date().toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' })})`,
        url: raidLink, // Hace el título clickeable
        description: `@everyone La raid de **${raid.raid_name}** liderada por **${raid.leader}** está programada para comenzar en 30 minutos via **RaidDominion**.\n\n[【Registrarse en este core】](${raidLink})`,
        color: 0xff0000, // Rojo
        thumbnail: {
          url: "https://colmillo.netlify.app/images/logo.png"
        },
        fields: [
          { name: "⏰ Hora de Inicio", value: raid.start_time, inline: true },
          { name: "📅 Día", value: raid.day_of_week.charAt(0).toUpperCase() + raid.day_of_week.slice(1), inline: true },
          { name: "👑 Líder", value: leaderInfo, inline: false },
          { name: "🛡️ Tanques", value: tanksList, inline: true },
          { name: "🌿 Sanadores", value: healersList, inline: true },
          { name: "⚔️ Cuerpo a Cuerpo", value: meleeList, inline: false },
          { name: "🏹 A Distancia", value: rangedList, inline: false },
          { name: "🚫 Sancionados", value: sanctionedList, inline: false }
        ],
        footer: {
          text: "Sistema de Notificaciones RaidDominion",
          icon_url: "https://colmillo.netlify.app/images/logo.png"
        },
        timestamp: new Date().toISOString()
      };
      return embed;
    }));

    // 3. Enviar a Discord en un solo mensaje (contenido + ambas tarjetas)
    const payloadMain = {
      username: "Portal Web Colmillo de Acero",
      avatar_url: "https://colmillo.netlify.app/images/logo.png",
      content: (isTest ? "📢 **【 TEST DE AVISO DE RAID 】**" : "📢 **【 AVISO DE RAID PRÓXIMA 】 ** <@&1336049966465454153>") + "\nhttps://colmillo.netlify.app/",
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

  } catch (error) {
    console.error('Error in check-raids:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
