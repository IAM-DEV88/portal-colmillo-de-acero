import { supabase } from '../../../lib/supabase';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const key = formData.get('key') as string;
  const value = formData.get('value') as string;

  if (!key) {
    return new Response('Missing key', { status: 400 });
  }

  const { error } = await supabase
    .from('config')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) {
    console.error('Error updating config:', error);
    return new Response(error.message, { status: 500 });
  }

  // Redirect back to admin page
  return redirect('/admin?configUpdated=true');
};
