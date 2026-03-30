export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

import { RouletteService } from '../../lib/roulette-service';

// GET: Obtener estado actual (Seguro)
export const GET: APIRoute = async ({ request, clientAddress }) => {
    try {
        const ip = RouletteService.getClientIP(request, clientAddress);
        // Usamos el hash de la IP consistentemente
        const sessionId = RouletteService.getIpHash(ip); 

        // 1. Intentar obtener la sesión existente
        console.log(`[GameState] Buscando sesión para IP: ${sessionId}`);
        
        const { data: existingSession, error: fetchError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('ip_hash', sessionId)
            .single();

        if (existingSession) {
            console.log(`[GameState] Sesión encontrada para ${sessionId}:`, existingSession.credits, 'créditos');
            
            // Lógica de reseteo centralizada en RouletteService
            const finalSession = await RouletteService.ensureDailyReset(existingSession);

            return new Response(JSON.stringify(finalSession), { 
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, max-age=0' 
                }
            });
        }

        // Si hay error de conexión (diferente a "no encontrado")
        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[GameState] Error DB buscando sesión:', fetchError);
            // Si la tabla no existe (código 42P01), es un error crítico de configuración
            if (fetchError.code === '42P01') {
                return new Response(JSON.stringify({ error: 'Tabla game_sessions no existe. Ejecuta el SQL.' }), { 
                    status: 500, 
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        console.log(`[GameState] Creando nueva sesión para ${sessionId}`);

        // 3. Si no existe, crear una nueva sesión por defecto
        const newSession = {
            ip_hash: sessionId,
            credits: 5,
            gold_pool: 100,
            has_won_choker: false,
            spin_history: [],
            last_active: new Date().toISOString()
        };

        const { data: createdSession, error: createError } = await supabase
            .from('game_sessions')
            .insert([newSession])
            .select()
            .single();

        if (createError) {
            console.error('[GameState] Error creando sesión:', createError);
            return new Response(JSON.stringify({ error: 'Failed to create session' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(createdSession), { 
            status: 201,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0' 
            }
        });

    } catch (e) {
        console.error('API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

// POST: Actualizar estado del juego (OBSOLETO - Por seguridad, la lógica está en /api/game-spin y /api/game-claim)
export const POST: APIRoute = async () => {
    return new Response(JSON.stringify({ error: 'Endpoint deshabilitado por seguridad' }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
};
