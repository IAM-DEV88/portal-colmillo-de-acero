import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication using the correct cookie name
    const isAuthenticated = cookies.get('admin_session')?.value === 'authenticated';
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();
    const {
      id,
      player_name,
      player_class,
      player_role,
      day_of_week,
      start_time,
      raid_id,
      status = 'pendiente',
      action = 'update',
    } = data;

    if (!player_name || !player_class || !player_role || !day_of_week || !start_time) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan datos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse raid_id to integer if present
    const parsedRaidId =
      raid_id !== undefined && raid_id !== null && raid_id !== ''
        ? parseInt(String(raid_id), 10)
        : null;

    // Define baseData with explicit type to allow dynamic property assignment
    const baseData: Record<string, any> = {
      player_name,
      player_class,
      player_role,
      day_of_week,
      start_time,
      status,
    };

    // Only include raid_id if it's a valid number
    if (parsedRaidId !== null && !isNaN(parsedRaidId)) {
      baseData.raid_id = parsedRaidId;
    }

    let result;

    if (action === 'create') {
      // Validate raid_id for creation
      if (!baseData.raid_id) {
        return new Response(JSON.stringify({ success: false, error: 'Falta el ID de la raid' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create new registration
      const { data: newRegistration, error: createError } = await supabase
        .from('raid_registrations')
        .insert([
          {
            ...baseData,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      result = newRegistration;
    } else {
      // Update existing registration
      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Se requiere un ID para actualizar' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { data: updatedRegistration, error: updateError } = await supabase
        .from('raid_registrations')
        .update({
          ...baseData,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updatedRegistration;
    }

    if (!result) {
      throw new Error('Error al procesar la solicitud: No se devolvieron datos');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registro actualizado correctamente',
        data: result,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in update-registration:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error del servidor',
        details: error.details || error.hint || '',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
