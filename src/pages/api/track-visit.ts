export const prerender = false;
import type { APIRoute } from 'astro';

const DISCORD_WEBHOOK_URL = import.meta.env.DISCORD_WEBHOOK_URL;

import { RouletteService } from '../../lib/roulette-service';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL is missing');
      return new Response(JSON.stringify({ error: 'Config Error' }), { status: 500 });
    }

    const body = await request.json();
    const ip = RouletteService.getClientIP(request, clientAddress);

    // Ignorar visitas locales (localhost/127.0.0.1)
    if (ip === '127.0.0.1' || body.url?.includes('localhost') || body.url?.includes('127.0.0.1')) {
        return new Response(JSON.stringify({ success: true, ignored: true }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    
    // Construct simplified Discord Embed
    const embed = {
      title: "🌐 Nueva Visita",
      color: 0x3b82f6, // Blue
      fields: [
        { name: "Página", value: body.url || 'Desconocida', inline: false },
        { name: "IP", value: ip, inline: true },
        { name: "Dispositivo", value: parseUserAgent(userAgent), inline: true },
        { name: "Resolución", value: body.screen || 'N/A', inline: true },
        { name: "Zona Horaria", value: body.timezone || 'N/A', inline: true },
        { name: "Referrer", value: body.referrer || 'Directo', inline: false },
      ],
      timestamp: new Date().toISOString()
    };

    // Send to Discord
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          username: "Portal Web Colmillo de Acero",
          avatar_url: "https://colmillo.netlify.app/images/raids/default.jpg",
          embeds: [embed] 
      })
    });

    if (!response.ok) {
        console.error('Error sending to Discord:', await response.text());
        return new Response(JSON.stringify({ error: 'Discord Error' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error('Track Visit Error:', e);
    return new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500 });
  }
};

function parseUserAgent(ua: string) {
    if (ua.includes('Mobile')) return '📱 Móvil';
    if (ua.includes('Tablet')) return '📱 Tablet';
    if (ua.includes('Windows')) return '💻 Windows';
    if (ua.includes('Macintosh')) return '💻 Mac';
    if (ua.includes('Linux')) return '🐧 Linux';
    if (ua.includes('Android')) return '🤖 Android';
    if (ua.includes('iPhone')) return '🍎 iPhone';
    return '❓ Desconocido';
}
