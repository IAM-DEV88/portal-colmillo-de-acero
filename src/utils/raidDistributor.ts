import { createClient } from '@supabase/supabase-js';
import rosterData from '../data/roster.json';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PlayerGS {
  name: string;
  gs: number;
  role: string;
  class: string;
  originalRegistration: any;
}

interface RaidInstance {
  raidId: string;
  day: string;
  time: string;
  priority: number; // 1 = High (Wed/Thu), 2 = Low (Others)
  type: '10' | '25';
  tanks: PlayerGS[];
  healers: PlayerGS[];
  melee: PlayerGS[];
  ranged: PlayerGS[];
}

const RAID_PRIORITIES = {
  'ICC10H ABAS': 1,
  'ICC25N POR LK': 1,
  'SR25N': 1,
  'ICC25N': 2 // Generic
};

const HIGH_PRIORITY_DAYS = ['miercoles', 'jueves'];

// Helper to clean strings
const clean = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export async function distributeRaids() {
  console.log('Starting raid distribution...');

  // 1. Fetch accepted registrations
  const { data: registrations, error } = await supabase
    .from('raid_registrations')
    .select('*')
    .eq('status', 'aceptado');

  if (error || !registrations) {
    console.error('Error fetching registrations:', error);
    return { success: false, error };
  }

  // 2. Identify Non-Guild Players & Update Status
  const rosterPlayers = Object.keys(rosterData.players).map(p => clean(p));
  const nonGuildPlayers = registrations.filter(reg => !rosterPlayers.includes(clean(reg.player_name)));

  if (nonGuildPlayers.length > 0) {
    console.log(`Found ${nonGuildPlayers.length} non-guild players. Updating status to 'en_revision'...`);
    const names = nonGuildPlayers.map(p => p.player_name);
    await supabase
      .from('raid_registrations')
      .update({ status: 'en_revision' })
      .in('player_name', names); // Batch update might need loop if names are unique constraint? No, names can repeat.
      // Ideally update by ID
      const ids = nonGuildPlayers.map(p => p.id);
      await supabase
        .from('raid_registrations')
        .update({ status: 'en_revision' })
        .in('id', ids);
  }

  // 3. Process Valid Players (Guild Members)
  const validRegistrations = registrations.filter(reg => rosterPlayers.includes(clean(reg.player_name)));
  const playerPool: PlayerGS[] = [];

  for (const reg of validRegistrations) {
    // Find player in roster (case insensitive match)
    const rosterKey = Object.keys(rosterData.players).find(k => clean(k) === clean(reg.player_name));
    if (!rosterKey) continue;

    const playerData = (rosterData.players as any)[rosterKey];
    const note = playerData.publicNote || '';
    
    // Extract GS based on Role
    let gs = 0;
    const role = reg.player_role ? clean(reg.player_role) : 'dps'; // default
    
    // Regex for specific roles: t5.8, h5.8, d5.8, m5.8 (melee?), r5.8 (ranged?)
    // Note format examples: "md5.8", "mh6.0", "mt4.9"
    // Heuristic:
    // If tank -> look for 't' followed by number, or 'mt'
    // If healer -> look for 'h' followed by number, or 'mh'
    // If dps -> look for 'd' followed by number, or 'md', 'ad'
    
    // Normalize note for regex
    const n = note.toLowerCase();
    let match;

    if (role === 'tank') {
        match = n.match(/t(\d+(\.\d+)?)/) || n.match(/mt(\d+(\.\d+)?)/);
    } else if (role === 'healer' || role === 'heal') {
        match = n.match(/h(\d+(\.\d+)?)/) || n.match(/mh(\d+(\.\d+)?)/);
    } else {
        // DPS (melee or ranged)
        match = n.match(/d(\d+(\.\d+)?)/) || n.match(/md(\d+(\.\d+)?)/) || n.match(/ad(\d+(\.\d+)?)/);
    }

    if (match) {
        gs = parseFloat(match[1]) * 1000;
    } else {
        // Fallback: take the highest number found in the note
        const numbers = n.match(/(\d+(\.\d+)?)/g);
        if (numbers) {
            gs = Math.max(...numbers.map(num => parseFloat(num))) * 1000;
        }
    }

    // Assign Role Category for Distribution
    let distRole = 'dps';
    if (role === 'tank') distRole = 'tank';
    else if (role === 'healer' || role === 'heal') distRole = 'healer';
    else if (role === 'melee') distRole = 'melee';
    else distRole = 'ranged'; // Default for dps/rango

    playerPool.push({
        name: reg.player_name,
        gs,
        role: distRole,
        class: reg.player_class,
        originalRegistration: reg
    });
  }

  // Sort Pool by GS Descending
  playerPool.sort((a, b) => b.gs - a.gs);

  // 4. Define Raids (Buckets)
  // We need to know WHICH raids are active this week.
  // For simplicity, we'll iterate through the UNIQUE raids found in registrations
  // and prioritize them.
  
  const raidsMap = new Map<string, RaidInstance>();

  validRegistrations.forEach(reg => {
    const key = `${reg.raid_id}|${reg.day_of_week}|${reg.start_time}`;
    if (!raidsMap.has(key)) {
        const raidName = reg.raid_id.toUpperCase();
        const day = clean(reg.day_of_week);
        
        // Priority Logic
        let priority = 2;
        let isHighPriorityRaid = false;
        
        if (raidName.includes('ICC10H ABAS') || 
            raidName.includes('ICC25N POR LK') || 
            raidName.includes('SR25N')) {
            isHighPriorityRaid = true;
        }

        if (isHighPriorityRaid && HIGH_PRIORITY_DAYS.includes(day)) {
            priority = 1;
        }

        // Determine Type (10 or 25)
        const type = raidName.includes('10') ? '10' : '25';

        raidsMap.set(key, {
            raidId: reg.raid_id,
            day: reg.day_of_week,
            time: reg.start_time,
            priority,
            type,
            tanks: [],
            healers: [],
            melee: [],
            ranged: []
        });
    }
  });

  const raids = Array.from(raidsMap.values()).sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority; // 1 before 2
      // If same priority, maybe prioritize 25 over 10?
      if (a.type !== b.type) return b.type === '25' ? 1 : -1;
      return 0;
  });

  // 5. Distribute Players
  // Track player assignments per instance ID to avoid saving ID twice
  // Instance ID is loosely defined by raid name (e.g. ICC25N)
  // NOTE: SR25N is separate from ICC25N.
  
  const playerSaves = new Map<string, Set<string>>(); // PlayerName -> Set<RaidType>
  // RaidTypes: 'ICC10', 'ICC25', 'SR25', etc.

  const getRaidType = (id: string) => {
      const upper = id.toUpperCase();
      if (upper.includes('ICC10')) return 'ICC10';
      if (upper.includes('ICC25')) return 'ICC25';
      if (upper.includes('SR25') || upper.includes('SAGRARIO')) return 'SR25';
      if (upper.includes('TOC25')) return 'TOC25';
      if (upper.includes('TOC10')) return 'TOC10';
      return id; // Fallback
  };

  // We need to fill raids one by one
  for (const raid of raids) {
      const raidType = getRaidType(raid.raidId);
      
      // Caps
      const caps = raid.type === '25' 
        ? { tank: 2, healer: 5, melee: 9, ranged: 9 }
        : { tank: 2, healer: 2, melee: 3, ranged: 3 }; // Approx for 10-man

      // Filter candidates for this raid
      // Candidates are players who:
      // 1. Have not been saved to this raidType yet
      // 2. Meet minimum GS? (Optional, implicitly handled by sorting)
      
      const candidates = playerPool.filter(p => {
          const saves = playerSaves.get(p.name) || new Set();
          return !saves.has(raidType);
      });

      // Fill Roles
      // We iterate candidates again for each role to pick best GS
      
      // Tanks
      const tankCandidates = candidates.filter(p => p.role === 'tank');
      for (const p of tankCandidates) {
          if (raid.tanks.length < caps.tank) {
              raid.tanks.push(p);
              if (!playerSaves.has(p.name)) playerSaves.set(p.name, new Set());
              playerSaves.get(p.name)?.add(raidType);
          }
      }

      // Healers
      const healerCandidates = candidates.filter(p => p.role === 'healer');
      for (const p of healerCandidates) {
          if (raid.healers.length < caps.healer) {
              raid.healers.push(p);
              if (!playerSaves.has(p.name)) playerSaves.set(p.name, new Set());
              playerSaves.get(p.name)?.add(raidType);
          }
      }

      // Melee
      const meleeCandidates = candidates.filter(p => p.role === 'melee');
      for (const p of meleeCandidates) {
          if (raid.melee.length < caps.melee) {
              raid.melee.push(p);
              if (!playerSaves.has(p.name)) playerSaves.set(p.name, new Set());
              playerSaves.get(p.name)?.add(raidType);
          }
      }

      // Ranged
      const rangedCandidates = candidates.filter(p => p.role === 'ranged');
      for (const p of rangedCandidates) {
          if (raid.ranged.length < caps.ranged) {
              raid.ranged.push(p);
              if (!playerSaves.has(p.name)) playerSaves.set(p.name, new Set());
              playerSaves.get(p.name)?.add(raidType);
          }
      }
  }

  // 6. Apply Changes to DB
  // We need to update the `raid_registrations` table.
  // For each player assigned to a raid, we update their entry to match that raid's ID/Day/Time.
  // Wait! A player might be assigned to MULTIPLE raids (e.g. ICC10 and ICC25).
  // But in the DB, they might have only 1 entry or multiple.
  // If they registered for "Availability", they might have 1 entry per day.
  
  // Strategy:
  // We will DELETE existing accepted registrations for the week and INSERT the new optimized assignments.
  // This is destructive but cleanest for "distribution".
  // OR, we update existing ones where possible.
  
  // Given the complexity of mapping N registrations to M assignments, 
  // and the user's instruction "Distribuirlos en las bandas... repitiéndolos",
  // it implies we are generating the "Official List".
  
  // Let's print the plan first.
  console.log('Distribution Plan Generated:');
  raids.forEach(r => {
      console.log(`\n--- Raid: ${r.raidId} (${r.day} ${r.time}) ---`);
      console.log(`Tanks (${r.tanks.length}/${r.type==='25'?2:2}): ${r.tanks.map(p => `${p.name} (${p.gs})`).join(', ')}`);
      console.log(`Healers (${r.healers.length}/${r.type==='25'?5:2}): ${r.healers.map(p => `${p.name} (${p.gs})`).join(', ')}`);
      console.log(`Melee (${r.melee.length}/${r.type==='25'?9:3}): ${r.melee.map(p => `${p.name} (${p.gs})`).join(', ')}`);
      console.log(`Ranged (${r.ranged.length}/${r.type==='25'?9:3}): ${r.ranged.map(p => `${p.name} (${p.gs})`).join(', ')}`);
  });

  // Since I cannot safely delete/insert without potentially losing data (like comments or sign-up timestamps which might be relevant),
  // I will just log the plan for now and return it.
  // To "Apply", we would need to know if the user wants to OVERWRITE the schedule.
  
  // However, the user said "Distribuirlos...".
  // I will implement a "Simulated Apply" where I assume I can update the `raid_id`, `day`, `time` of their existing registration.
  // BUT a player can be in multiple raids. If they only registered once, I can't clone them in DB easily without creating new rows.
  
  // For this task, I will focus on updating the STATUS.
  // Those who got a spot -> 'aceptado'.
  // Those who didn't -> 'en_espera' (or 'en_revision'?).
  // AND I will try to update their raid_id/day/time to match the assignment if they have a matching registration.
  
  return { success: true, plan: raids };
}