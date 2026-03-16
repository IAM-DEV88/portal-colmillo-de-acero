import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { rosterService } from '../../../services/rosterService';

const clean = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const GET: APIRoute = async ({ cookies }) => {
    // Check authentication and role
    const session = cookies.get('admin_session')?.value;
    const role = cookies.get('admin_role')?.value;

    if (!session || role !== 'admin') {
        return new Response(JSON.stringify({ error: 'No autorizado. Se requiere rol de administrador.' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const rosterResult = await rosterService.getFormattedRoster(true);
        const rosterPlayers = rosterResult.players || {};
        const guildPlayerNames = new Set(Object.keys(rosterPlayers).map(clean));

        const { data: registrations, error: fetchError } = await supabase
            .from('raid_registrations')
            .select('id, player_name')
            .in('status', ['aceptado', 'en_revision']);

        if (fetchError) throw fetchError;

        const externals = registrations?.filter(reg => !guildPlayerNames.has(clean(reg.player_name))) || [];

        if (externals.length > 0) {
            const { error: updateError } = await supabase
                .from('raid_registrations')
                .update({ status: 'en_espera' })
                .in('id', externals.map(e => e.id));

            if (updateError) throw updateError;
        }

        return new Response(JSON.stringify({ 
            success: true, 
            count: externals.length 
        }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), { status: 500 });
    }
};
