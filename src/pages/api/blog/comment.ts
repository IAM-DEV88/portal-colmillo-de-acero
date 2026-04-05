import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { postId, player_name, content } = await request.json();

    if (!postId || !player_name || !content) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan campos obligatorios' }), { status: 400 });
    }

    const { error } = await supabase
      .from('rd_blog_comments')
      .insert([{
        post_id: postId,
        player_name,
        content,
        is_approved: false, // Siempre requiere moderación
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Comentario enviado a moderación' }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};
