// src/pages/api/admin/delete.ts
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

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de registro no proporcionado' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Delete the registration
  const { error } = await supabase.from('raid_registrations').delete().eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin?success=deleted',
    },
  });
};
