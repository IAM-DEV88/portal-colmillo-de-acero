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

// GET: Obtener estado actual del juego para esta IP
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
            const nowServer = new Date(new Date().toLocaleString('en-US', { timeZone: guildTimezone }));
            const lastActiveServer = new Date(new Date(existingSession.last_active).toLocaleString('en-US', { timeZone: guildTimezone }));

            // Comprobar si estamos en un día diferente al de la última actividad según la hora server
            const isDifferentDay = 
                nowServer.getDate() !== lastActiveServer.getDate() || 
                nowServer.getMonth() !== lastActiveServer.getMonth() || 
                nowServer.getFullYear() !== lastActiveServer.getFullYear();

            if (isDifferentDay) {
                console.log(`[GameState] Reseteando sesión por cambio de día (Medianoche Server). IP: ${sessionId}`);
                
                const resetData = {
                    credits: 5,
                    gold_pool: existingSession.gold_pool > 100 ? existingSession.gold_pool : 100,
                    has_won_choker: false,
                    spin_history: [],
                    last_active: new Date().toISOString() // Guardamos en UTC para persistencia
                };

                const { data: updatedSession, error: updateError } = await supabase
                    .from('game_sessions')
                    .update(resetData)
                    .eq('ip_hash', sessionId)
                    .select()
                    .single();

                if (!updateError) {
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

// POST: Actualizar estado del juego
export const POST: APIRoute = async ({ request, clientAddress }) => {
    try {
        const ip = getClientIP(request, clientAddress);
        const sessionId = ip;
        
        const body = await request.json();
        
        // Extraer solo los campos permitidos para actualizar
        const { credits, gold_pool, has_won_choker, spin_history } = body;

        // Validaciones básicas
        if (typeof credits !== 'number' || typeof gold_pool !== 'number') {
             return new Response(JSON.stringify({ error: 'Invalid data types' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const updateData: any = {
            credits,
            gold_pool,
            last_active: new Date().toISOString()
        };

        if (typeof has_won_choker === 'boolean') updateData.has_won_choker = has_won_choker;
        if (Array.isArray(spin_history)) updateData.spin_history = spin_history;

        const { data, error } = await supabase
            .from('game_sessions')
            .update(updateData)
            .eq('ip_hash', sessionId)
            .select()
            .single();

        if (error) {
            console.error('[GameState] Error updating session:', error);
            
            // Si la sesión no existe (por limpieza o error), intentar crearla (Upsert manual)
            // Esto maneja el caso donde el usuario envía POST pero su sesión fue borrada o nunca creada
            if (error.code === 'PGRST116' || error.details?.includes('0 rows')) {
                 console.log(`[GameState] Sesión perdida, recreando para ${sessionId}`);
                 const newSession = { ...updateData, ip_hash: sessionId, created_at: new Date().toISOString() };
                 const { data: newData, error: newError } = await supabase.from('game_sessions').upsert(newSession).select().single();
                 if (!newError) {
                     return new Response(JSON.stringify({ success: true, data: newData }), { status: 200 });
                 }
            }
            
            return new Response(JSON.stringify({ error: 'Update failed' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, data }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('API Error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
