export const prerender = false;
import type { APIRoute } from 'astro';

const DISCORD_WEBHOOK_URL = import.meta.env.DISCORD_WEBHOOK_URL;

function getClientIP(request: Request, clientAddress?: string) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const ip = forwarded.split(',')[0].trim();
        // Normalizar IP de localhost
        if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
        return ip;
    }
    
    // En desarrollo local a veces no hay IP real, usar 'localhost' o similar
    let ip = clientAddress || '127.0.0.1';
    
    // Normalizar IP de localhost para consistencia entre IPv4 e IPv6
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    
    return ip;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL is missing');
      return new Response(JSON.stringify({ error: 'Config Error' }), { status: 500 });
    }

    const body = await request.json();
    const ip = getClientIP(request, clientAddress);
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
          username: "Colmillo Tracker",
          avatar_url: "https://i.imgur.com/4M34hi2.png",
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
