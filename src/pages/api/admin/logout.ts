// src/pages/api/admin/logout.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = () => {
  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax' + 
        (import.meta.env.PROD ? '; Secure' : ''),
      'Location': '/admin'
    }
  });
};
