import { supabase } from '../../../lib/supabase';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { guideId, playerName, content } = await request.json();

    if (!guideId || !playerName || !content) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan campos' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('guide_comments')
      .insert([{ 
        guide_id: guideId, 
        player_name: playerName, 
        content,
        is_approved: false // Moderación por defecto
      }]);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
  }
};
