import { supabase } from '../lib/supabase';
import rosterDataJson from '../data/roster.json';

// Simple in-memory cache
const cache = {
  roster: null as any[] | null,
  lastFetched: 0,
  ttl: 5 * 60 * 1000 // 5 minutes TTL
};

export const rosterService = {
  /**
   * Fetches all roster players with caching and optimized pagination
   */
  async getAllPlayers() {
    const now = Date.now();
    
    // Return cached data if valid
    if (cache.roster && (now - cache.lastFetched < cache.ttl)) {
      return cache.roster;
    }

    console.log('Fetching fresh roster data from Supabase');
    
    const CHUNK = 1000;
    let from = 0;
    let all: any[] = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const { data, error } = await supabase
          .from('roster_players')
          .select('name, class, rank, public_note, officer_note, race, leader_data, is_sanctioned, guild_leave, updated_at, last_updated_by')
          .range(from, from + CHUNK - 1);
          
        if (error) {
          console.error('Error fetching roster chunk:', error);
          throw error;
        }

        const rows = data || [];
        all = all.concat(rows);

        if (rows.length < CHUNK) {
          hasMore = false;
        } else {
          from += CHUNK;
        }
      }

      // Update cache
      cache.roster = all;
      cache.lastFetched = now;
      
      return all;
    } catch (error) {
      console.error('Failed to fetch roster from Supabase', error);
      return null;
    }
  },

  /**
   * Get formatted roster data ready for UI consumption
   */
  async getFormattedRoster() {
    try {
      const players = await this.getAllPlayers();
      
      if (!players) throw new Error('No players found');

      // Calculate global last update
      let globalLastUpdate = 0;
      let lastUpdatedBy = 'Desconocido';
      let lastUpdatedAt = null;

      players.forEach((p: any) => {
        // Usar EXCLUSIVAMENTE leader_data.lastUpdate para la fecha global de actualización
        // ya que representa la sincronización real desde el juego.
        // updated_at de la DB puede cambiar por ediciones menores y distorsionar el autor real del roster.
        let leaderUpdate = Number(p.leader_data?.lastUpdate) || 0;
        
        // Normalizar: Lua suele dar segundos, JS milisegundos.
        // Si el número es muy grande (> año 2286), asumimos que son ms y convertimos a s.
        if (leaderUpdate > 10000000000) leaderUpdate = Math.floor(leaderUpdate / 1000);

        if (leaderUpdate > globalLastUpdate) {
           globalLastUpdate = leaderUpdate;
           // El autor es el jugador cuyo leader_data tiene el timestamp más reciente (el generador del Lua)
           lastUpdatedBy = p.last_updated_by || p.name || 'Desconocido';
           lastUpdatedAt = new Date(leaderUpdate * 1000).toISOString();
         }
      });

      const activePlayers = (players || []).filter((p: any) => p.guild_leave !== true);

      const playersMap = activePlayers.reduce((acc: Record<string, any>, player: any) => {
        acc[player.name] = {
          name: player.name,
          class: player.class,
          rank: player.rank,
          publicNote: player.public_note,
          officerNote: player.officer_note,
          race: player.race,
          leaderData: player.leader_data,
          isSanctioned: player.is_sanctioned,
          guildLeave: false,
          updatedAt: player.updated_at,
          lastUpdatedBy: player.last_updated_by
        };
        return acc;
      }, {});

      return {
        globalLastUpdate,
        lastUpdatedBy,
        lastUpdatedAt,
        totalCount: activePlayers.length,
        players: playersMap
      };
    } catch (error) {
      console.error('Error in getFormattedRoster:', error);
      const fallbackPlayers = Object.entries(rosterDataJson?.players || {})
        .filter(([_, data]: [string, any]) => !data.guildLeave)
        .reduce((acc, [name, data]) => ({ ...acc, [name]: data }), {});

      return {
        globalLastUpdate: rosterDataJson?.globalLastUpdate || 0,
        lastUpdatedBy: 'Sistema',
        lastUpdatedAt: null,
        totalCount: Object.keys(fallbackPlayers).length,
        players: fallbackPlayers
      };
    }
  },

  /**
   * Invalidate cache to force fresh fetch on next call
   */
  invalidateCache() {
    cache.roster = null;
    cache.lastFetched = 0;
  }
};
