import type { APIRoute } from 'astro';
import { BlogService } from '../../../lib/blog-service';
import { supabase } from '../../../lib/supabase';
import { DiscordService } from '../../../services/discordService';

/**
 * Endpoint para generación automática de posts.
 * Diseñado para ser llamado por un Cron Job (Netlify, GitHub Actions, etc.)
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    // Seguridad básica: Verificar token de cron
    const token = url.searchParams.get('token');
    const cronToken = import.meta.env.CRON_TOKEN;

    if (!cronToken || token !== cronToken) {
      console.warn('Intento de generación de blog no autorizado');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    console.log('Iniciando generación automática de post...');
    
    // Generar el post
    const newPost = await BlogService.generatePost();
    
    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('rd_blog_posts')
      .insert([newPost])
      .select();

    if (error) throw error;

    // Notificar en Discord
    if (data && data[0]) {
      await DiscordService.notifyNewBlogPost(data[0]);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Post generado automáticamente con éxito',
      post: data?.[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error en auto-generate:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
