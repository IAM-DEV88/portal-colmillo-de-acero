import { supabase } from '../lib/supabase';
import { rosterService } from './rosterService';
import { getRaidName } from '../lib/raids';

export const adminService = {
    createRaidFromName(name: string, id: string = '', gs: number = 5000): any {
        const nameLower = name.toLowerCase();
        let image = '/images/raids/iccfarm.jpg';
        if (nameLower.includes('toc')) image = '/images/raids/tocfarm.jpg';
        else if (nameLower.includes('sr') || nameLower.includes('sagrario')) image = '/images/raids/sr.jpg';
        else if (nameLower.includes('lk')) image = '/images/raids/icclk.jpg';

        return {
            id: id || name,
            name,
            image,
            description: 'Raid oficial de la hermandad.',
            minGearScore: gs,
            rules: ''
        };
    },

    async fetchRaidRegistrations() {
        try {
            const { data, error } = await supabase
                .from('raid_registrations')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                console.error('Error fetching raid registrations:', error);
                return { data: [], error: error.message };
            }
            return { data: data || [], error: null };
        } catch (e: any) {
            console.error('Unexpected error fetching registrations:', e);
            return { data: [], error: 'Error inesperado al cargar los datos' };
        }
    },

    async assembleWotlkRaids(rosterData: any, registrations: any[]) {
        const wotlkRaids: any[] = [];
        const seenRaids = new Set<string>();

        // 1. Populate from rosterData
        if (rosterData && rosterData.players) {
            Object.values(rosterData.players).forEach((member: any) => {
                const leaderData = member.leaderData;
                if (!leaderData || !leaderData.cores || !Array.isArray(leaderData.cores)) return;

                leaderData.cores.forEach((core: any) => {
                    if (!core.raid) return;
                    const coreRaidKey = core.raid.toUpperCase().trim();

                    if (!seenRaids.has(coreRaidKey)) {
                        seenRaids.add(coreRaidKey);
                        wotlkRaids.push(this.createRaidFromName(core.raid, core.raid, core.gs || 5000));
                    }
                });
            });
        }

        // 2. Populate from supabase registrations
        registrations.forEach((reg) => {
            if (!reg.raid_id) return;
            const raidName = getRaidName(reg.raid_id);
            const raidId = reg.raid_id;
            const raidKey = raidId.toUpperCase().trim();

            if (!seenRaids.has(raidKey)) {
                seenRaids.add(raidKey);
                wotlkRaids.push(this.createRaidFromName(raidName, raidId, 5000));
            }
        });

        if (wotlkRaids.length === 0) {
            wotlkRaids.push(this.createRaidFromName('ICC25N', 'ICC25N', 5000));
        }

        return wotlkRaids;
    }
};
