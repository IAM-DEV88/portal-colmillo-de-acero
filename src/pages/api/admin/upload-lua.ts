import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { parseLuaRoster } from '../../../utils/luaParser';
import { rosterService } from '../../../services/rosterService';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const adminSession = cookies.get('admin_session');
  const userRole = cookies.get('admin_role')?.value;

  if (!adminSession || adminSession.value !== 'authenticated' || (userRole !== 'admin' && userRole !== 'official')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No se proporcionó archivo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const textContent = await file.text();

    // 1. Process Lua file with native JS parser (ported from Python)
    const parsedData = parseLuaRoster(textContent) as any;
    if (parsedData.error) {
      return new Response(JSON.stringify({ error: `Error procesando Lua: ${parsedData.error}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { players: newPlayers, globalLastUpdate, generatedBy } = parsedData;

    // 2. Fetch existing players from DB
    // We assume there's a 'players' table or similar. Since the user mentioned list2.py output structure,
    // let's assume we store this in a 'roster' table or 'players' table.
    // Based on previous context, there might be a 'roster' table. Let's check or create logic.
    // Actually, the prompt implies we should create this logic.
    // Let's assume a table structure: 
    // players (id, name, class, rank, public_note, officer_note, race, guild_leave, leader_data, is_sanctioned, last_updated_by, updated_at)

    // First, let's get all existing players to handle guildLeave logic (paginado para evitar límite de 1000)
    async function fetchAllExistingPlayers() {
      const CHUNK = 1000;
      let from = 0;
      let all: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from('roster_players')
          .select('name, guild_leave, leader_data, last_updated_by, updated_at')
          .range(from, from + CHUNK - 1);
        if (error) {
          console.error('Error fetching existing players:', error);
          break;
        }
        const rows = data || [];
        all = all.concat(rows);
        if (rows.length < CHUNK) break;
        from += CHUNK;
      }
      return all;
    }

    const existingPlayers = await fetchAllExistingPlayers();

    const existingMap = new Map(existingPlayers?.map(p => [p.name, p]) || []);
    const existingMaxLastUpdate = existingPlayers && existingPlayers.length > 0
      ? Math.max(...existingPlayers.map(p => Number(p.leader_data?.lastUpdate) || 0))
      : 0;
    const incomingLastUpdate = Number(globalLastUpdate) || 0;
    const isStaleUpload = incomingLastUpdate > 0 && existingMaxLastUpdate > 0 && incomingLastUpdate < existingMaxLastUpdate;
    const updates = [];

    // 3. Prepare updates
    // A. Players present in Lua -> Update info, set guild_leave = false
    for (const [name, data] of Object.entries(newPlayers)) {
      const pData = data as any;

      // Merge leaderData logic
      // The Python script only returns leaderData for the 'generatedBy' player.
      // For everyone else, pData.leaderData is empty.
      // We must preserve existing leaderData for everyone EXCEPT the current generator (if they are updating their own data)
      // OR if we want to support multiple officers uploading data, we need to handle it carefully.

      // The logic should be:
      // 1. Get existing leaderData from DB (default to {})
      // 2. If this player is the 'generatedBy' user, we OVERWRITE their specific entry or the whole object?
      //    Wait, the previous JSON structure (roster.json) seemed to store leaderData directly under the player object:
      //    player: { leaderData: { lastUpdate: ..., cores: [...] } }
      //    It seems it was 1:1. Each player has THEIR OWN leaderData if they are a leader.

      //    If 'generatedBy' is "OfficerA", then "OfficerA" gets their leaderData updated with the Lua content.
      //    "OfficerB" should keep their EXISTING leaderData in the DB.

      const existing = existingMap.get(name);
      let finalLeaderData = existing?.leader_data || {};
      if (name === generatedBy) {
        const existingLeaderLastUpdate = Number(existing?.leader_data?.lastUpdate) || 0;
        if (incomingLastUpdate >= existingLeaderLastUpdate) {
          finalLeaderData = pData.leaderData;
        }
      }

      // If the player is NOT the generator, we keep their existing leaderData (finalLeaderData = existing.leader_data)
      // The Python script returns empty object for them, so we ignore pData.leaderData for them.

      updates.push({
        name: name,
        class: pData.class,
        rank: pData.rank,
        public_note: pData.publicNote,
        officer_note: pData.officerNote,
        race: pData.race,
        guild_leave: false,
        leader_data: finalLeaderData,
        is_sanctioned: pData.isSanctioned || false,
        // Al realizar una subida de Lua, todos los jugadores se marcan con el autor y fecha de esta actualización global
        last_updated_by: generatedBy,
        updated_at: new Date().toISOString()
      });
    }

    // B. Players NOT in Lua but in DB -> Set guild_leave = true
    // (Only if they were NOT already left)
    if (existingPlayers) {
      for (const p of existingPlayers) {
        if (!newPlayers[p.name] && !p.guild_leave) {
          updates.push({
            name: p.name,
            guild_leave: true,
            leader_data: {}, // Clear leader data for left players (as per list2.py)
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    // 4. Perform Upsert
    const { error: upsertError } = await supabase
      .from('roster_players')
      .upsert(updates, { onConflict: 'name' });

    if (upsertError) {
      return new Response(JSON.stringify({ error: `Error actualizando base de datos: ${upsertError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Invalidate the server-side cache so pages reflect changes immediately
    rosterService.invalidateCache();

    return new Response(JSON.stringify({
      success: true,
      message: `Procesado correctamente. ${updates.length} jugadores actualizados/insertados.`,
      stats: {
        total: updates.length,
        generator: generatedBy,
        incomingLastUpdate,
        existingMaxLastUpdate,
        isStaleUpload
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: `Error interno: ${e.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
