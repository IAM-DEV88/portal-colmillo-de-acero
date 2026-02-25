export const prerender = false;

import { getUpcomingRaids, GUILD_TIMEZONE, getRaidRosterForScheduleWithExternal } from '../../utils/raidUtils';
import rosterData from '../../data/roster.json';

// Mensajes aleatorios generales
const GENERAL_MESSAGES = [
  {
    title: "🛡️ RaidDominion",
    description: "Descrube nuestro addon para raids y cómo usarlo.",
    url: "https://colmillo.netlify.app/",
    color: 0xf59e0b // Amber
  },
  {
    title: "📅 Calendario de Raids",
    description: "No te pierdas ninguna raid. Consulta nuestros horarios y apúntate en el sistema.",
    url: "https://colmillo.netlify.app/raids",
    color: 0x3b82f6 // Blue
  },
  {
    title: "📜 Guias de Raideo",
    description: "Encuentra información detallada sobre cómo jugar y participar en raids.",
    url: "https://colmillo.netlify.app/guides",
    color: 0x10b981 // Green
  },
  {
    title: "👥 ¡Únete a Colmillo de Acero!",
    description: "¿Buscas una hermandad comprometida? Revisa nuestras normas y roster. ¡Te estamos esperando!",
    url: "https://colmillo.netlify.app/roster",
    color: 0x8b5cf6 // Violet
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
    
    if (isTest) {
        // En test, aleatorio entre RAID y GENERAL
        messageType = Math.random() < 0.5 ? 'RAID' : 'GENERAL';
        
        if (messageType === 'RAID') {
             upcomingRaids = getUpcomingRaids(null); // Buscar cualquiera
             if (upcomingRaids.length === 0) {
                 // Mock si no hay
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
        // 1. Prioridad: Raid Inminente (30 mins)
        upcomingRaids = getUpcomingRaids(30, 10);
        
        if (upcomingRaids.length > 0) {
            messageType = 'RAID';
        } else {
            // 2. Secundaria: Mensaje General (Cada hora, primeros 10 mins)
            const now = new Date();
            if (now.getMinutes() < 10) {
                messageType = 'GENERAL';
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

    // --- ENVÍO MENSAJE GENERAL ---
    if (messageType === 'GENERAL') {
        const msg = GENERAL_MESSAGES[Math.floor(Math.random() * GENERAL_MESSAGES.length)];
        
        const payload = {
            username: "Portal Web Colmillo de Acero",
            avatar_url: "https://colmillo.netlify.app/images/logo.png",
            content: isTest ? "📢 **【 TEST MENSAJE GENERAL 】**" : undefined,
            embeds: [{
                title: msg.title,
                description: msg.description,
                url: msg.url,
                color: msg.color,
                thumbnail: { url: "https://colmillo.netlify.app/images/logo.png" },
                footer: { text: "Colmillo de Acero • Comunidad", icon_url: "https://colmillo.netlify.app/images/logo.png" }
            }]
        };

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        // Enlace separado
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "Portal Web Colmillo de Acero",
                avatar_url: "https://colmillo.netlify.app/images/logo.png",
                content: `🔗 [Ir a la Web](${msg.url})` 
            })
        });

        return new Response(JSON.stringify({ success: true, type: 'GENERAL' }), { status: 200 });
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
      const minutesRemaining = Math.ceil(diffMs / 60000);
      let timeString = "";
      if (minutesRemaining <= 0) {
          timeString = "¡AHORA MISMO!";
      } else if (minutesRemaining === 1) {
          timeString = "en 1 minuto";
      } else {
          timeString = `en ${minutesRemaining} minutos`;
      }

      const embed = {
        title: `⚠️ Recordatorio de Raid: ${raid.raid_name} (${new Date().toLocaleTimeString('es-ES', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })})`,
        url: raidLink, 
        description: `@everyone La raid de **${raid.raid_name}** liderada por **${raid.leader}** está programada para comenzar **${timeString}** via **RaidDominion**.\n\n👉 **¡Reacciona a este mensaje para confirmar tu asistencia y estar listo para la invocación!**\n\n[【Ver Roster Completo en la Web】](${raidLink})`,
        color: 0xff0000, 
        thumbnail: {
          url: "https://colmillo.netlify.app/images/logo.png"
        },
        fields: [
          // Fila 1: Hora / Día / Líder
          { name: "⏰ Hora de Inicio", value: raid.start_time, inline: true },
          { name: "📅 Día", value: raid.day_of_week.charAt(0).toUpperCase() + raid.day_of_week.slice(1), inline: true },
          { name: "👑 Líder", value: leaderInfo, inline: true },
          
          // Separador visual o salto de línea forzado si es necesario, pero inline: false ya hace salto.
          
          // Fila 2: Tanques / Sanadores (2 columnas para dar más ancho)
          { name: "🛡️ Tanques", value: tanksList, inline: true },
          { name: "🌿 Sanadores", value: healersList, inline: true },
          { name: "\u200b", value: "\u200b", inline: true }, // Spacer invisible para mantener grid de 3 si discord fuerza 3
          
          // Fila 3: Melee / Ranged / Sancionados
          { name: "⚔️ Cuerpo a Cuerpo", value: meleeList, inline: true },
          { name: "🏹 A Distancia", value: rangedList, inline: true },
          { name: "🚫 Sancionados", value: sanctionedList, inline: true }
        ],
        footer: {
          text: "Sistema de Notificaciones RaidDominion",
          icon_url: "https://colmillo.netlify.app/images/logo.png",
        },
        timestamp: new Date().toISOString()
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
    
    const payloadMain = {
      username: "Portal Web Colmillo de Acero",
      avatar_url: "https://colmillo.netlify.app/images/logo.png",
      content: (isTest ? "📢 **【 TEST DE AVISO DE RAID 】**" : "📢 **【 AVISO DE RAID PRÓXIMA 】 ** <@&1336049966465454153>"),
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

    // Segundo mensaje solo con el enlace para generar preview
    const payloadLink = {
        username: "Portal Web Colmillo de Acero",
        avatar_url: "https://colmillo.netlify.app/images/logo.png",
        content: "[🔗 Ver Horario de Raid Completo en la Web](https://colmillo.netlify.app/raids)"
    };

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadLink)
    });

    return new Response(JSON.stringify({ 
      success: true, 
      raids_notified: upcomingRaids.length,
      details: upcomingRaids 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    } // Closing brace for if (messageType === 'RAID')

  } catch (error) {
    console.error('Error in check-raids:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
