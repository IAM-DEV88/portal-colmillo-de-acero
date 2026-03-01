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
      console.log('Returning cached roster data');
      return cache.roster;
    }

    console.log('Fetching fresh roster data from Supabase');
    
    // Optimized fetching: select only needed fields instead of '*'
    // and use a larger page size if possible, or keep the chunk logic but centralized here
    const CHUNK = 1000;
    let from = 0;
    let all: any[] = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const { data, error } = await supabase
          .from('roster_players')
          .select('name, class, rank, public_note, officer_note, race, leader_data, is_sanctioned, guild_leave, updated_at')
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
      console.error('Failed to fetch roster from Supabase, falling back to JSON if available', error);
      // Fallback logic could be handled here or by the consumer
      return null;
    }
  },

  /**
   * Get formatted roster data ready for UI consumption
   */
  async getFormattedRoster() {
    try {
      const players = await this.getAllPlayers();
    
      // Calculate global last update from the data itself if available
      const globalLastUpdate = players && players.length > 0
      ? Math.max(...players.map((p: any) => {
          const leaderDataUpdate = Number(p.leader_data?.lastUpdate) || 0;
          const rowUpdate = p.updated_at ? new Date(p.updated_at).getTime() : 0;
          return Math.max(leaderDataUpdate, rowUpdate);
        }))
      : (rosterDataJson?.globalLastUpdate || 0);

    const playersMap = players ? 
        players.reduce((acc: Record<string, any>, player: any) => {
          acc[player.name] = {
            class: player.class,
            rank: player.rank,
            publicNote: player.public_note, // Mapping snake_case to camelCase
            officerNote: player.officer_note,
            race: player.race,
            leaderData: player.leader_data,
            isSanctioned: player.is_sanctioned,
            guildLeave: player.guild_leave === true
          };
          return acc;
        }, {}) 
        : (rosterDataJson?.players || {});

      return {
        globalLastUpdate,
        players: playersMap
      };
    } catch (error) {
      console.error('Error in getFormattedRoster:', error);
      // Fallback to JSON file on error
      return {
        globalLastUpdate: rosterDataJson?.globalLastUpdate || 0,
        players: rosterDataJson?.players || {}
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
