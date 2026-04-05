import type { APIRoute } from 'astro';
import { BlogService } from '../../../lib/blog-service';
import { RouletteService } from '../../../lib/roulette-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { commentId } = await request.json();
    const clientIp = RouletteService.getClientIP(request);
    
    const result = await BlogService.likeComment(commentId, clientIp);
    
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};
