export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';
import { getOutcome, calculatePrize } from '../../lib/game-logic';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function getClientIP(request: Request, clientAddress?: string) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const ip = forwarded.split(',')[0].trim();
        if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
        return ip;
    }
    let ip = clientAddress || '127.0.0.1';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    return ip;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
    try {
        const ip = getClientIP(request, clientAddress);
        const sessionId = ip;
        
        // 1. Get current state from Supabase
        const { data: existingSession, error: fetchError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('ip_hash', sessionId)
            .single();

        if (fetchError || !existingSession) {
            return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
        }

        if (existingSession.credits <= 0) {
            return new Response(JSON.stringify({ error: 'No credits left' }), { status: 403 });
        }

        // 2. Perform Spin
        const outcome = getOutcome();
        const prize = calculatePrize(outcome, existingSession.gold_pool);

        // 3. Calculate new state
        let newCredits = existingSession.credits - 1;
        let newGoldPool = existingSession.gold_pool + 10; // Increment pool per spin
        let hasWonChoker = existingSession.has_won_choker || (prize.type === 'item' && prize.id === 'choker');

        if (prize.type === 'gold') {
            newGoldPool += prize.amount;
        } else if (prize.type === 'loss') {
            newGoldPool = prize.amount; // Reduced pool (already includes the +10 in the base calculation if desired, but prize.amount usually overwrites it here)
        } else if (prize.type === 'turns') {
            newCredits += prize.amount;
        }

        // Update history (keep last 3)
        const newHistory = [outcome, ...(existingSession.spin_history || [])].slice(0, 3);

        // 4. Update Supabase
        const { error: updateError } = await supabase
            .from('game_sessions')
            .update({
                credits: newCredits,
                gold_pool: newGoldPool,
                has_won_choker: hasWonChoker,
                spin_history: newHistory,
                last_active: new Date().toISOString()
            })
            .eq('ip_hash', sessionId);

        if (updateError) {
            console.error('Update Error:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to update game state' }), { status: 500 });
        }

        return new Response(JSON.stringify({
            outcome,
            prize,
            credits: newCredits,
            gold_pool: newGoldPool,
            has_won_choker: hasWonChoker,
            spin_history: newHistory
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
