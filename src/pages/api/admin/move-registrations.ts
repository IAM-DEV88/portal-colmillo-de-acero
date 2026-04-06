import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get('admin_session')?.value;
  const userRole = cookies.get('admin_role')?.value;

  if (!session || userRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { sourceSlot, targetSlot } = await request.json();

    if (!sourceSlot || !targetSlot) {
      return new Response(JSON.stringify({ error: 'Missing slot data' }), { status: 400 });
    }

    // Helper para normalizar (quitar acentos)
    const normalize = (str: string) => 
      str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    console.log(`[MOVE] Intentando mover de:`, sourceSlot);
    console.log(`[MOVE] Hacia:`, targetSlot);

    // Normalizar datos para búsqueda robusta
    const sourceRaid = sourceSlot.raid_id.trim();
    const sourceDay = normalize(sourceSlot.day_of_week);
    const sourceTime = sourceSlot.start_time.trim().substring(0, 5);

    // Búsqueda "fuzzy" para el nombre de la raid (ignora espacios extra)
    const raidFuzzyPattern = sourceRaid.replace(/\s+/g, '%');

    const targetRaid = targetSlot.raid_id.trim();
    const targetDay = normalize(targetSlot.day_of_week);
    const targetTime = targetSlot.start_time.trim().substring(0, 5);

    // Días alternativos para búsqueda robusta (con/sin acento)
    const getSearchDays = (day: string) => {
      const d = day.toLowerCase().trim();
      if (d.includes('sabado')) return ['sabado', 'sábado', 'Sabado', 'Sábado'];
      if (d.includes('miercoles')) return ['miercoles', 'miércoles', 'Miercoles', 'Miércoles'];
      return [d, d.charAt(0).toUpperCase() + d.slice(1)];
    };

    const sourceSearchDays = getSearchDays(sourceDay);
    const targetSearchDays = getSearchDays(targetDay);

    // 1. Obtener todos los registros del slot origen
    const { data: sourceRegs, error: fetchError } = await supabase
      .from('raid_registrations')
      .select('*')
      .filter('raid_id', 'ilike', `%${raidFuzzyPattern}%`)
      .in('day_of_week', sourceSearchDays)
      .filter('start_time', 'ilike', `${sourceTime}%`)
      .in('status', ['aceptado', 'en_revision', 'en_espera', 'sancionado']);

    if (fetchError) {
      console.error('[MOVE] Error al buscar registros origen:', fetchError);
      throw fetchError;
    }

    console.log(`[MOVE] Registros encontrados para mover: ${sourceRegs?.length || 0}`);

    if (!sourceRegs || sourceRegs.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `No se encontraron registros para ${sourceRaid} - ${sourceDay} - ${sourceTime}` 
      }), { status: 404 });
    }

    let movedCount = 0;
    let collisionCount = 0;

    // 2. Procesar cada registro para evitar colisiones
    for (const reg of sourceRegs) {
      // Verificar si el jugador ya tiene un registro en el slot destino
      const { data: existingTarget, error: checkError } = await supabase
        .from('raid_registrations')
        .select('id')
        .eq('player_name', reg.player_name)
        .ilike('raid_id', targetRaid)
        .in('day_of_week', targetSearchDays)
        .filter('start_time', 'ilike', `${targetTime}%`)
        .maybeSingle();

      if (checkError) console.error('[MOVE] Error verificando colisión:', checkError);

      if (existingTarget) {
        console.log(`[MOVE] Colisión detectada para ${reg.player_name}. Eliminando duplicado huérfano.`);
        await supabase.from('raid_registrations').delete().eq('id', reg.id);
        collisionCount++;
      } else {
        const { error: updateError } = await supabase
          .from('raid_registrations')
          .update({
            raid_id: targetRaid,
            day_of_week: targetSlot.day_of_week.trim(),
            start_time: targetTime
          })
          .eq('id', reg.id);        
        if (updateError) {
          console.error(`[MOVE] Error actualizando registro ${reg.id}:`, updateError);
        } else {
          movedCount++;
        }
      }
    }

    console.log(`[MOVE] Finalizado: ${movedCount} movidos, ${collisionCount} colisiones resueltas.`);

    return new Response(JSON.stringify({ 
      success: true, 
      moved: movedCount, 
      collisions: collisionCount 
    }), { status: 200 });

  } catch (error: any) {
    console.error('Error moving registrations:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
