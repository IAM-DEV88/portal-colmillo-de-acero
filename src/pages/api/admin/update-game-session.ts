export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: APIRoute = async ({ request, cookies }) => {
    // Validar sesión de admin
    const sessionCookie = cookies.get('admin_session')?.value;
    const roleCookie = cookies.get('admin_role')?.value;

    if (!sessionCookie || sessionCookie !== 'authenticated' || (roleCookie !== 'admin' && roleCookie !== 'official')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    try {
        const formData = await request.formData();
        const ipHash = formData.get('ip_hash')?.toString();

        if (!ipHash) {
            return new Response(JSON.stringify({ error: 'Falta ip_hash' }), { status: 400 });
        }

        const updates: any = {};

        const characters = formData.get('character_names');
        if (characters !== null) {
            updates.character_names = characters.toString().trim();
        }

        const credits = formData.get('credits');
        if (credits !== null && credits.toString() !== '') {
            const parsedCredits = parseInt(credits.toString(), 10);
            if (!isNaN(parsedCredits)) {
                updates.credits = parsedCredits;
            }
        }

        const { error } = await supabase
            .from('game_sessions')
            .update(updates)
            .eq('ip_hash', ipHash);

        if (error) {
            console.error('Error al actualizar la sesión de juego:', error);
            return new Response(JSON.stringify({ error: 'Error al actualizar sesión' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: true, ip_hash: ipHash, character_names: updates.character_names, credits: updates.credits }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        console.error('API Error:', e);
        return new Response(JSON.stringify({ error: 'Error del servidor interno' }), { status: 500 });
    }
};
