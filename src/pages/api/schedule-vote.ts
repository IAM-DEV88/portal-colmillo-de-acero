export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('schedule_votes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching schedule-votes:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();
    const { raid_name, difficulty, size, day_of_week, preferred_time } = body;
    const ip = clientAddress || 'unknown';

    if (!raid_name || !difficulty || !size || !day_of_week || !preferred_time) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
    }

    // Verificar límite de votos (3 cada 24 horas)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count, error: countError } = await supabase
      .from('schedule_votes')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ip)
      .gte('created_at', twentyFourHoursAgo);

    if (countError) throw countError;

    if (count !== null && count >= 3) {
      return new Response(JSON.stringify({ 
        error: 'Has alcanzado el límite de 3 votos cada 24 horas. Por favor, espera para volver a votar.' 
      }), { status: 429 });
    }

    // Insertar el voto en la tabla schedule_votes
    const { data, error } = await supabase
      .from('schedule_votes')
      .insert([
        { 
          raid_name, 
          difficulty, 
          size, 
          day_of_week, 
          preferred_time,
          ip_hash: ip
        }
      ])
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (error: any) {
    console.error('Error in schedule-vote:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
