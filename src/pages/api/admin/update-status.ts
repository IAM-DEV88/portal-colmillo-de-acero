// src/pages/api/admin/update-status.ts
import { supabase } from '../../../lib/supabase';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check if user is authenticated
  const session = cookies.get('admin_session')?.value;
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData();
  const id = formData.get('id');
  const status = formData.get('status');

  if (!id || !status) {
    return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update the status in the database
  const { error } = await supabase.from('raid_registrations').update({ status }).eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return success response with the updated status
  return new Response(
    JSON.stringify({
      success: true,
      status: status,
      message: 'Estado actualizado correctamente',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
