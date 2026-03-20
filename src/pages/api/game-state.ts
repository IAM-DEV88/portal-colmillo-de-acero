export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getClientIP(request: Request, clientAddress?: string) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const ip = forwarded.split(',')[0].trim();
        // Normalizar IP de localhost
        if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
        return ip;
    }
    
    // En desarrollo local a veces no hay IP real, usar 'localhost' o similar
    let ip = clientAddress || '127.0.0.1';
    
    // Normalizar IP de localhost para consistencia entre IPv4 e IPv6
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    
    return ip;
}

// GET: Obtener estado actual (Seguro)
export const GET: APIRoute = async ({ request, clientAddress }) => {
    try {
        const ip = getClientIP(request, clientAddress);
        // Usamos la IP directamente como ID. En producción podrías hashearla.
        const sessionId = ip; 

        // 1. Intentar obtener la sesión existente
        console.log(`[GameState] Buscando sesión para IP: ${sessionId}`);
        
        const { data: existingSession, error: fetchError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('ip_hash', sessionId)
            .single();

        if (existingSession) {
            console.log(`[GameState] Sesión encontrada para ${sessionId}:`, existingSession.credits, 'créditos');
            
            // Lógica de reseteo a las 00:00 hora server (Europe/London)
            const guildTimezone = 'Europe/London';
            
            // Formatear fechas como YYYY-MM-DD en la zona horaria del servidor
            const now = new Date();
            const nowServerStr = now.toLocaleDateString('en-CA', { timeZone: guildTimezone }); // en-CA da YYYY-MM-DD
            
            const lastActive = new Date(existingSession.last_active);
            const lastActiveServerStr = lastActive.toLocaleDateString('en-CA', { timeZone: guildTimezone });

            console.log(`[GameState] IP: ${sessionId} | Now Server Day: ${nowServerStr} | Last Active Server Day: ${lastActiveServerStr}`);

            // Comprobar si las cadenas de fecha son diferentes
            const isDifferentDay = nowServerStr !== lastActiveServerStr;

            if (isDifferentDay) {
                console.log(`[GameState] Reseteando sesión por cambio de día (Medianoche Server). IP: ${sessionId}`);
                
                const resetData = {
                    credits: 5,
                    gold_pool: existingSession.gold_pool > 100 ? existingSession.gold_pool : 100,
                    has_won_choker: false,
                    spin_history: [],
                    last_active: now.toISOString() // Guardamos en UTC para persistencia
                };

                const { data: updatedSession, error: updateError } = await supabase
                    .from('game_sessions')
                    .update(resetData)
                    .eq('ip_hash', sessionId)
                    .select()
                    .single();

                if (!updateError) {
                    console.log(`[GameState] Sesión reseteada con éxito para ${sessionId}`);
                    return new Response(JSON.stringify(updatedSession), { 
                        status: 200,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-store, max-age=0' 
                        }
                    });
                }
                console.error('[GameState] Error al resetear sesión:', updateError);
            }

            return new Response(JSON.stringify(existingSession), { 
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
