import { createClient } from '@supabase/supabase-js';
import { rosterService } from '../services/rosterService';

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

    const rosterResult = await rosterService.getFormattedRoster();
    const rosterData = rosterResult.players || {};

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
    const rosterPlayers = Object.keys(rosterData).map(p => clean(p));
    const nonGuildPlayers = registrations.filter(reg => !rosterPlayers.includes(clean(reg.player_name)));

    if (nonGuildPlayers.length > 0) {
        console.log(`Found ${nonGuildPlayers.length} non-guild players. Updating status to 'en_revision'...`);
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
        const rosterKey = Object.keys(rosterData).find(k => clean(k) === clean(reg.player_name));
        if (!rosterKey) continue;

        const playerData = (rosterData as any)[rosterKey];
        const note = playerData.publicNote || '';

        // Extract GS based on Role
        let gs = 0;
        const role = reg.player_role ? clean(reg.player_role) : 'dps'; // default

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
    const raidsMap = new Map<string, RaidInstance>();

    validRegistrations.forEach(reg => {
        const key = `${reg.raid_id}|${reg.day_of_week}|${reg.start_time}`;
        if (!raidsMap.has(key)) {
            const raidName = reg.raid_id.toUpperCase();
            const day = clean(reg.day_of_week);

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
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.type !== b.type) return b.type === '25' ? 1 : -1;
        return 0;
    });

    // 5. Distribute Players
    const playerSaves = new Map<string, Set<string>>();

    const getRaidType = (id: string) => {
        const upper = id.toUpperCase();
        if (upper.includes('ICC10')) return 'ICC10';
        if (upper.includes('ICC25')) return 'ICC25';
        if (upper.includes('SR25') || upper.includes('SAGRARIO')) return 'SR25';
        if (upper.includes('TOC25')) return 'TOC25';
        if (upper.includes('TOC10')) return 'TOC10';
        return id;
    };

    for (const raid of raids) {
        const raidType = getRaidType(raid.raidId);
        const caps = raid.type === '25'
            ? { tank: 2, healer: 5, melee: 9, ranged: 9 }
            : { tank: 2, healer: 2, melee: 3, ranged: 3 };

        const candidates = playerPool.filter(p => {
            const saves = playerSaves.get(p.name) || new Set();
            return !saves.has(raidType);
        });

        const tankCandidates = candidates.filter(p => p.role === 'tank');
        for (const p of tankCandidates) {
            if (raid.tanks.length < caps.tank) {
                raid.tanks.push(p);
                if (!playerSaves.has(p.name)) playerSaves.set(p.name, new Set());
                playerSaves.get(p.name)?.add(raidType);
            }
        }

        const healerCandidates = candidates.filter(p => p.role === 'healer');
        for (const p of healerCandidates) {
            if (raid.healers.length < caps.healer) {
                raid.healers.push(p);
                if (!playerSaves.has(p.name)) playerSaves.set(p.name, new Set());
                playerSaves.get(p.name)?.add(raidType);
            }
        }

        const meleeCandidates = candidates.filter(p => p.role === 'melee');
        for (const p of meleeCandidates) {
            if (raid.melee.length < caps.melee) {
                raid.melee.push(p);
                if (!playerSaves.has(p.name)) playerSaves.set(p.name, new Set());
                playerSaves.get(p.name)?.add(raidType);
            }
        }

        const rangedCandidates = candidates.filter(p => p.role === 'ranged');
        for (const p of rangedCandidates) {
            if (raid.ranged.length < caps.ranged) {
                raid.ranged.push(p);
                if (!playerSaves.has(p.name)) playerSaves.set(p.name, new Set());
                playerSaves.get(p.name)?.add(raidType);
            }
        }
    }

    // 6. Logging the plan
    console.log('Distribution Plan Generated:');
    raids.forEach(r => {
        console.log(`\n--- Raid: ${r.raidId} (${r.day} ${r.time}) ---`);
        console.log(`Tanks (${r.tanks.length}/${r.type === '25' ? 2 : 2}): ${r.tanks.map(p => `${p.name} (${p.gs})`).join(', ')}`);
        console.log(`Healers (${r.healers.length}/${r.type === '25' ? 5 : 2}): ${r.healers.map(p => `${p.name} (${p.gs})`).join(', ')}`);
        console.log(`Melee (${r.melee.length}/${r.type === '25' ? 9 : 3}): ${r.melee.map(p => `${p.name} (${p.gs})`).join(', ')}`);
        console.log(`Ranged (${r.ranged.length}/${r.type === '25' ? 9 : 3}): ${r.ranged.map(p => `${p.name} (${p.gs})`).join(', ')}`);
    });

    return { success: true, plan: raids };
}