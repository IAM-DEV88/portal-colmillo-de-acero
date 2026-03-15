import { supabase } from '../../../lib/supabase';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const { guideId } = await request.json();
    const ipHash = btoa(clientAddress || 'anonymous').substring(0, 16);

    const { data, error } = await supabase
      .from('guide_votes')
      .insert([{ guide_id: guideId, ip_hash: ipHash }])
      .select();

    if (error) {
      if (error.code === '23505') { // Duplicate unique key
        return new Response(JSON.stringify({ success: false, error: 'Ya has votado por esta guía' }), { status: 400 });
      }
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
  }
};
