// src/pages/api/vote.ts
import type { APIRoute } from 'astro';
import { recordVote } from '../../lib/voting';

// Habilitar CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS: APIRoute = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

export const POST: APIRoute = async ({ request }) => {
  console.log('Solicitud POST recibida en /api/vote');
  
  try {
    // Verificar el método de la solicitud
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método no permitido' }),
        { 
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Allow': 'POST, OPTIONS'
          }
        }
      );
    }

    // Verificar el tipo de contenido
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content-Type debe ser application/json' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Parsear el cuerpo de la solicitud
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error al analizar el cuerpo de la solicitud:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Error al analizar el cuerpo de la solicitud' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Validar el nombre del personaje
    const characterName = body.characterName?.toString().trim();
    console.log('Nombre del personaje recibido:', characterName);
    
    if (!characterName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Por favor ingresa un nombre de personaje' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Registrar el voto
    console.log('Registrando voto para:', characterName);
    const result = await recordVote(characterName, request);
    console.log('Resultado del registro:', result);
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { 
          ...corsHeaders,
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
          ...corsHeaders,
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
