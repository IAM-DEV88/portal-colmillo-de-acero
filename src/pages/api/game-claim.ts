export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

import { RouletteService } from '../../lib/roulette-service';

export const POST: APIRoute = async ({ request, clientAddress }) => {
    try {
        const ip = RouletteService.getClientIP(request, clientAddress);
        const sessionId = RouletteService.getIpHash(ip);
        const body = await request.json();
        const { type } = body; // 'pool' or 'choker'

        // 1. Get current state from Supabase
        const { data: existingSession, error: fetchError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('ip_hash', sessionId)
            .single();

        if (fetchError || !existingSession) {
            return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
        }

        // 2. Determine reset values
        const claimedAmount = existingSession.gold_pool;
        let newGoldPool = existingSession.gold_pool;
        let hasWonChoker = existingSession.has_won_choker;

        if (type === 'pool' && existingSession.gold_pool > 0) {
            newGoldPool = 0; // Reset gold pool after claim
        } else if (type === 'choker' && existingSession.has_won_choker) {
            hasWonChoker = false; // Reset choker status after claim
            newGoldPool = 0; // Choker claim usually also resets gold pool
        } else {
            return new Response(JSON.stringify({ error: 'Nothing to claim' }), { status: 400 });
        }

        // 3. Update Supabase
        const { error: updateError } = await supabase
            .from('game_sessions')
            .update({
                gold_pool: newGoldPool,
                has_won_choker: hasWonChoker,
                last_gold_claimed: claimedAmount,
                last_active: new Date().toISOString()
            })
            .eq('ip_hash', sessionId);

        if (updateError) {
            console.error('Update Error:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to update game state' }), { status: 500 });
        }

        return new Response(JSON.stringify({
            success: true,
            gold_pool: newGoldPool,
            claimed_amount: claimedAmount,
            has_won_choker: hasWonChoker
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
