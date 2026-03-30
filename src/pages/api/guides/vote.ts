import { supabase } from '../../../lib/supabase';
import { RouletteService } from '../../../lib/roulette-service';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const { guideId, action } = await request.json();
    const ip = RouletteService.getClientIP(request, clientAddress);
    const ipHash = RouletteService.getIpHash(ip);

    if (action === 'remove') {
      const { error } = await supabase
        .from('guide_votes')
        .delete()
        .eq('guide_id', guideId)
        .eq('ip_hash', ipHash);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Default action is 'add'
    const { data, error } = await supabase
      .from('guide_votes')
      .insert([{ guide_id: guideId, ip_hash: ipHash }])
      .select();

    if (error) {
      if (error.code === '23505') { // Duplicate unique key
        return new Response(JSON.stringify({ success: true, message: 'Ya has votado' }), { status: 200 });
      }
      throw error;
    }

    // Otorgar crédito en la ruleta (solo la primera vez para esta guía e IP)
    const rewardActionId = `guide_vote_${guideId}`;
    const { success: rewarded } = await RouletteService.grantReward(ip, rewardActionId, 1);

    return new Response(JSON.stringify({ success: true, data, rewarded }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
  }
};
