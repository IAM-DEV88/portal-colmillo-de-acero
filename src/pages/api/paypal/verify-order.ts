export const prerender = false;
import type { APIRoute } from 'astro';

const PAYPAL_CLIENT_ID = import.meta.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = import.meta.env.PAYPAL_SECRET;
const DISCORD_WEBHOOK_URL = import.meta.env.DISCORD_WEBHOOK_URL;

// Determinar si estamos en modo Sandbox o Live basado en el Client ID
const PAYPAL_API = PAYPAL_CLIENT_ID?.startsWith('AQ') 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const data = await response.json();
    return data.access_token;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function getClientIP(request: Request, clientAddress?: string) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const ip = forwarded.split(',')[0].trim();
        if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
        return ip;
    }
    let ip = clientAddress || '127.0.0.1';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    return ip;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
    try {
        const ip = getClientIP(request, clientAddress);
        const sessionId = ip;
        const { orderID, option } = await request.json();
        
        if (!orderID || !option) {
            return new Response(JSON.stringify({ error: 'Faltan datos de la orden' }), { status: 400 });
        }

        const accessToken = await getPayPalAccessToken();

        // 1. Capturar/Verificar la orden en PayPal
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const details = await response.json();

        // 2. Validar que el pago fue exitoso y el monto coincide
        if (details.status !== 'COMPLETED' && details.name !== 'ORDER_ALREADY_CAPTURED') {
             return new Response(JSON.stringify({ error: 'El pago no se ha completado', details }), { status: 400 });
        }

        // Si ya fue capturada, details.purchase_units podría no estar presente en la respuesta de error
        // Pero si es COMPLETED, validamos el monto.
        if (details.status === 'COMPLETED') {
            const capturedAmount = details.purchase_units[0].payments.captures[0].amount.value;
            if (parseFloat(capturedAmount) !== option.price) {
                return new Response(JSON.stringify({ error: 'El monto pagado no coincide con el paquete' }), { status: 400 });
            }
        }

        // 3. ACTUALIZAR CRÉDITOS EN SUPABASE (SEGURO)
        const { data: session } = await supabase
            .from('game_sessions')
            .select('credits, gold_pool')
            .eq('ip_hash', sessionId)
            .single();

        if (session) {
            const newCredits = session.credits + option.turns;
            const newGoldPool = session.gold_pool + (option.turns * 100); // Bonus pool for buying

            await supabase
                .from('game_sessions')
                .update({ 
                    credits: newCredits, 
                    gold_pool: newGoldPool,
                    last_active: new Date().toISOString()
                })
                .eq('ip_hash', sessionId);
        }

        // 4. Notificar a Discord desde el servidor (Seguro)
        if (DISCORD_WEBHOOK_URL) {
            const payer = details.payer;
            const payload = {
                embeds: [{
                    title: "💰 COMPRA VERIFICADA (SERVER)",
                    color: 0x00ff00,
                    fields: [
                        { name: "Usuario", value: `${payer.name.given_name} ${payer.name.surname}`, inline: true },
                        { name: "Paquete", value: option.label, inline: true },
                        { name: "Monto", value: `$${capturedAmount} USD`, inline: true },
                        { name: "ID PayPal", value: details.id, inline: false },
                        { name: "Email", value: payer.email_address, inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            };

            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        return new Response(JSON.stringify({ success: true, details }), { status: 200 });

    } catch (e: any) {
        console.error('Error verificando pago:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
