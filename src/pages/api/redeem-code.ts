
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code } = await request.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Código requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Check if code exists and is unused
    const { data: codeData, error: fetchError } = await supabase
      .from('redemption_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !codeData) {
      return new Response(JSON.stringify({ error: 'Código inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (codeData.is_used) {
      return new Response(JSON.stringify({ error: 'Este código ya ha sido usado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Mark code as used
    const { error: updateError } = await supabase
      .from('redemption_codes')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('id', codeData.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Error al procesar el código' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Return success with credits amount
    return new Response(
      JSON.stringify({
        success: true,
        credits: codeData.credits,
        message: `¡Código canjeado! +${codeData.credits} turnos.`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Redemption error:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
