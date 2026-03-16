import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

const getRaidDenomination = (id: string) => {
    const upper = id.toUpperCase().replace(/\s+/g, ' ').trim();
    
    // ICC
    if (upper.includes('ICC25H')) return 'ICC25H';
    if (upper.includes('ICC25N')) return 'ICC25N';
    if (upper.includes('ICC10H')) return 'ICC10H';
    if (upper.includes('ICC10N')) return 'ICC10N';
    
    // SR
    if (upper.includes('SR25H') || upper.includes('SAGRARIO 25H')) return 'SR25H';
    if (upper.includes('SR25N') || upper.includes('SAGRARIO 25N')) return 'SR25N';
    if (upper.includes('SR10H') || upper.includes('SAGRARIO 10H')) return 'SR10H';
    if (upper.includes('SR10N') || upper.includes('SAGRARIO 10N')) return 'SR10N';
    
    // TOC
    if (upper.includes('TOC25H') || upper.includes('PRUEBA 25H')) return 'TOC25H';
    if (upper.includes('TOC25N') || upper.includes('PRUEBA 25N')) return 'TOC25N';
    if (upper.includes('TOC10H') || upper.includes('PRUEBA 10H')) return 'TOC10H';
    if (upper.includes('TOC10N') || upper.includes('PRUEBA 10N')) return 'TOC10N';

    // Fallback genérico por tamaño si no se especifica dificultad (asumir N)
    if (upper.includes('25')) {
        if (upper.includes('ICC')) return 'ICC25N';
        if (upper.includes('SR') || upper.includes('SAGRARIO')) return 'SR25N';
        if (upper.includes('TOC') || upper.includes('PRUEBA')) return 'TOC25N';
        return 'RAID25';
    }
    if (upper.includes('10')) {
        if (upper.includes('ICC')) return 'ICC10N';
        if (upper.includes('SR') || upper.includes('SAGRARIO')) return 'SR10N';
        if (upper.includes('TOC') || upper.includes('PRUEBA')) return 'TOC10N';
        return 'RAID10';
    }

    return upper;
};

export const GET: APIRoute = async ({ cookies }) => {
    // Check authentication and role
    const session = cookies.get('admin_session')?.value;
    const role = cookies.get('admin_role')?.value;

    if (!session || role !== 'admin') {
        return new Response(JSON.stringify({ error: 'No autorizado. Se requiere rol de administrador.' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { data: registrations, error: fetchError } = await supabase
            .from('raid_registrations')
            .select('*')
            .in('status', ['aceptado', 'en_espera', 'en_revision']);

        if (fetchError) throw fetchError;
        if (!registrations) return new Response(JSON.stringify({ success: true, count: 0 }), { status: 200 });

        // Day Order starting from Wednesday (Server Reset)
        const dayOrder: Record<string, number> = {
            'miercoles': 0,
            'jueves': 1,
            'viernes': 2,
            'sabado': 3,
            'domingo': 4,
            'lunes': 5,
            'martes': 6
        };

        const playerSaves = new Map<string, Set<string>>();
        const toDelete: number[] = [];

        // Ordenar por día de la semana (Miércoles primero) para mantener el registro más temprano
        const sortedRegs = [...registrations].sort((a, b) => {
            const dayA = dayOrder[a.day_of_week.trim().toLowerCase()] ?? 99;
            const dayB = dayOrder[b.day_of_week.trim().toLowerCase()] ?? 99;
            
            if (dayA !== dayB) return dayA - dayB;
            return a.id - b.id; // En el mismo día, mantener el registro más antiguo
        });

        for (const reg of sortedRegs) {
            const playerName = reg.player_name.trim().toLowerCase();
            const denom = getRaidDenomination(reg.raid_id);
            
            if (!playerSaves.has(playerName)) {
                playerSaves.set(playerName, new Set());
            }

            const saves = playerSaves.get(playerName)!;
            if (saves.has(denom)) {
                // Ya tiene un registro para este save -> DUPLICADO
                toDelete.push(reg.id);
            } else {
                saves.add(denom);
            }
        }

        if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('raid_registrations')
                .delete()
                .in('id', toDelete);

            if (deleteError) throw deleteError;
        }

        return new Response(JSON.stringify({ 
            success: true, 
            count: toDelete.length 
        }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), { status: 500 });
    }
};
