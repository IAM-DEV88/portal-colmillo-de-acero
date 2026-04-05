// src/services/discordService.ts

const WEBHOOK_PUBLIC = import.meta.env.DISCORD_PUBLIC_WEBHOOK_URL;
const SITE_URL = 'https://colmillo.netlify.app'; // Ajusta si el dominio cambia

export class DiscordService {
  /**
   * Envía una notificación de nuevo post al canal público de Discord
   */
  static async notifyNewBlogPost(post: { title: string; slug: string; excerpt: string; category: string; image_url?: string }) {
    if (!WEBHOOK_PUBLIC) {
      console.warn('DISCORD_PUBLIC_WEBHOOK_URL no configurada. Saltando notificación.');
      return;
    }

    const postUrl = `${SITE_URL}/blog/${post.slug}`;
    const categoryEmoji: Record<string, string> = {
      'lore': '📜',
      'addons': '🔧',
      'raids': '⚔️',
      'class-guide': '📖',
      'community': '🤝'
    };

    const emoji = categoryEmoji[post.category] || '📰';

    const embed = {
      title: `${emoji} NUEVA CRÓNICA: ${post.title}`,
      description: `${post.excerpt}\n\n[**【 Leer Crónica Completa 】**](${postUrl})\n\n@everyone ¡Pásate por el blog, deja tu comentario y apoya a la hermandad!`,
      url: postUrl,
      color: 0xF59E0B, // Ámbar (amber-500)
      image: {
        url: post.image_url?.startsWith('http') ? post.image_url : `${SITE_URL}${post.image_url || '/images/raids/default.jpg'}`
      },
      footer: {
        text: "Portal Web Colmillo de Acero • Blog",
        icon_url: `${SITE_URL}/images/logo.png`
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(WEBHOOK_PUBLIC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Guía Colmillo",
          avatar_url: `${SITE_URL}/images/logo.png`,
          content: "📢 **¡Nueva publicación en El Blog!** @everyone",
          embeds: [embed]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error enviando a Discord:', errorText);
      }
    } catch (error) {
      console.error('Error de red al notificar a Discord:', error);
    }
  }
}
