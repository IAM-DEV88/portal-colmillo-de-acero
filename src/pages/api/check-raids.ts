export const prerender = false;

import { getUpcomingRaids, GUILD_TIMEZONE } from '../../utils/raidUtils';

export const GET = async ({ request }) => {
  try {
    // 1. Verificar si hay raids próximas (30 minutos antes)
    const upcomingRaids = getUpcomingRaids(30, 10); // Ventana de 10 minutos para ser flexible con el cron

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
    const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL; // Canal Admin
    
    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL is not defined');
      return new Response(JSON.stringify({ error: 'Webhook configuration missing' }), { status: 500 });
    }

    const embeds = upcomingRaids.map(raid => ({
      title: `⚠️ Recordatorio de Raid: ${raid.raid_name}`,
      description: `La raid de **${raid.raid_name}** liderada por **${raid.leader}** está programada para comenzar en 30 minutos via **Roster**.`,
      color: 0xFFA500, // Naranja
      fields: [
        { name: 'Hora de Inicio', value: raid.start_time, inline: true },
        { name: 'Día', value: raid.day_of_week.charAt(0).toUpperCase() + raid.day_of_week.slice(1), inline: true },
        { name: 'Líder', value: raid.leader, inline: true }
      ],
      footer: {
        text: `Zona Horaria: ${GUILD_TIMEZONE} • Sistema de Alertas Automático`
      },
      timestamp: new Date().toISOString()
    }));

    const payload = {
      username: "Portal Web Colmillo de Acero",
      avatar_url: "https://colmillo.netlify.app/images/logo.png",
      content: "📢 **AVISO DE RAID PRÓXIMA** <@&1336049966465454153>", // Mención a rol de oficiales si es necesario, ajustar ID
      embeds: embeds
    };

    // 3. Enviar a Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord API Error: ${response.status} ${await response.text()}`);
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
