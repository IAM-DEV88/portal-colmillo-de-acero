import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/auth';

export const onRequest = defineMiddleware(async ({ url, cookies, locals, redirect }, next) => {
    // Check if it's an admin route
    if (url.pathname.startsWith('/admin')) {
        // Allow pass-through for the dedicated login page
        if (url.pathname === '/admin/login' || url.pathname.startsWith('/admin/login')) {
            return next();
        }

        // Check for the admin_session cookie which should now be a protected JWT
        const token = cookies.get('admin_session')?.value;

        if (!token) {
            return redirect('/admin/login');
        }

        // Force migration from old insecure plain text cookies
        if (token === 'authenticated') {
            cookies.delete('admin_session', { path: '/' });
            cookies.delete('admin_role', { path: '/' });
            return redirect('/admin/login?error=session_expired');
        }

        const payload = await verifySessionToken(token);

        if (!payload) {
            // Invalid or expired token
            cookies.delete('admin_session', { path: '/' });
            cookies.delete('admin_role', { path: '/' });
            return redirect('/admin/login?error=invalid_token');
        }

        // Valid token. Inject the role into locals so Astro pages can read `Astro.locals.userRole`
        locals.userRole = payload.role as string;
    }

    // Continue processing the route
    return next();
});
