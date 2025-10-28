// src/pages/api/vote.ts
import type { APIRoute } from 'astro';
import { recordVote } from '../../lib/voting';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const characterName = body.characterName?.toString().trim();
    
    if (!characterName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Por favor ingresa un nombre de personaje' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const result = await recordVote(characterName, request);
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error en el endpoint de voto:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
};

// Exportar un manejador por defecto para compatibilidad
export const ALL: APIRoute = async (context) => {
  if (context.request.method === 'POST') {
    return POST(context);
  }
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Método no permitido' 
    }),
    { 
      status: 405, 
      headers: { 
        'Content-Type': 'application/json',
        'Allow': 'POST'
      } 
    }
  );
};
