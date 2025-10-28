// src/pages/api/vote-stats.ts
import type { APIRoute } from 'astro';
import { getVoteStats } from '../../lib/voting';

// Habilitar CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS: APIRoute = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

export const GET: APIRoute = async () => {
  try {
    const result = await getVoteStats();
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error) {
    console.error('Error en el servidor:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
};

// Para compatibilidad con Netlify Functions
export const ALL: APIRoute = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return OPTIONS(context);
  }
  if (context.request.method === 'GET') {
    return GET(context);
  }
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Método no permitido' 
  }), {
    status: 405,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Allow': 'GET, OPTIONS'
    }
  });
};
