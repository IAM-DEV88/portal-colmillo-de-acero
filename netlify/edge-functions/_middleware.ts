import type { Context } from 'netlify:edge';

export default async (request: Request, context: Context) => {
  // Pasar la solicitud sin modificaciones
  return await context.next();
};

export const config = {
  path: '/*',
  excludedPath: ['/assets/*', '/*.css', '/*.js']
};
