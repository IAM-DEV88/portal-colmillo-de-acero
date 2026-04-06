import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get('admin_session')?.value;
  const userRole = cookies.get('admin_role')?.value;

  if (!session || userRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { playerName } = await request.json();

    if (!playerName) {
      return new Response(JSON.stringify({ error: 'Player name is required' }), { status: 400 });
    }

    console.log(`[CLEAR] Limpiando leader_data para: ${playerName}`);

    const { error } = await supabase
      .from('roster_players')
      .update({ leader_data: null })
      .eq('name', playerName);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error('Error clearing leader data:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
