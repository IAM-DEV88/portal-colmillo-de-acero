import type {
  RosterMember,
  RosterData,
  ClassName,
  Role,
  MainAlt,
  ProfessionCode,
  RaidCode,
  DifficultyCode,
  PublicNoteValidation,
  NoteBlock,
  Member,
  RosterStats,
} from '../types/roster';

import {
  validatePublicNote as validateRosterNote,
  calculateRoleDistribution as calculateRoleDistro,
  calculateGearScoreStats as calculateGSStats,
  countRaidLeaders as countLeaders,
  calculateMainAltDistribution as calculateMainAlts,
  PROFESSION_CODES,
} from './rosterUtils';

import { DEFAULT_CLASS_INFO } from '../components/roster/rosterConstants';
import featuredPlayersData from '../data/featuredPlayers.json';

// Local type extensions
export interface RosterMemberType extends RosterMember {
  leaderData?: Record<string, unknown>;
  validation?: {
    isValid: boolean;
    missingFields: string[];
  };
}

/**
 * Procesa un miembro del roster para normalizar sus datos y calcular estadísticas
 */
export const processRosterMember = (member: any): RosterMemberType => {
  // Handle the case where member might be in the new format with nested data
  const memberData = member.leaderData
    ? {
        ...member,
        name: member.name || '',
        class: member.class || 'Desconocido',
        rank:
          member.rank &&
          (member.rank.toLowerCase().includes('guild master') ||
            member.rank.toLowerCase().includes('alter'))
            ? 'Administrador'
            : member.rank || 'Miembro',
        publicNote: member.public_note || member.publicNote || '',
        officerNote: member.officer_note || member.officerNote || '',
        race: member.race || '',
        guildLeave: member.guild_leave === true || member.guildLeave === true,
        level: 80, // Default level for WoW Classic
        gearScore: 0, // Will be calculated from note validation
      }
    : {
        ...member,
        rank:
          member.rank &&
          (member.rank.toLowerCase().includes('guild master') ||
            member.rank.toLowerCase().includes('alter'))
            ? 'Administrador'
            : member.rank || 'Miembro',
      };

  // Normalize class name
  const normalizeClassName = (name: string): string => {
    if (!name) return '';
    const trimmedName = name.trim();
    
    // First, try to find a direct match in keys
    const directMatch = Object.keys(DEFAULT_CLASS_INFO).find(
      (key) => key.toLowerCase() === trimmedName.toLowerCase()
    );
    if (directMatch) return directMatch;
    
    // If no direct match in keys, try to find a match in the 'name' property (Spanish)
    const spanishMatch = Object.entries(DEFAULT_CLASS_INFO).find(
      ([_, info]) => info.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (spanishMatch) return spanishMatch[0]; // Return the English key (e.g. 'Warrior')

    const lowerName = trimmedName.toLowerCase();
    if (lowerName === 'deathknight' || lowerName === 'death knight') {
      return 'Death Knight';
    }
    return lowerName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const normalizedClassName = normalizeClassName(memberData.class || '');
  const className =
    (Object.keys(DEFAULT_CLASS_INFO) as (keyof typeof DEFAULT_CLASS_INFO)[]).find(
      (key) => key.toLowerCase() === normalizedClassName.toLowerCase()
    ) || 'Desconocido';

  const rawMainAlt = memberData.mainAlt || memberData.main_alt || '';
  const mainAlt =
    rawMainAlt === 'M' || rawMainAlt.toLowerCase() === 'main' 
      ? 'M' 
      : rawMainAlt === 'A' || rawMainAlt.toLowerCase() === 'alt' 
        ? 'A' 
        : '';

  // Validar la nota pública
  const noteValidation = validateRosterNote(
    memberData.publicNote || '',
    memberData.name || '',
    memberData.officerNote || ''
  );

  const validNoteValidation: PublicNoteValidation = {
    isValid: noteValidation.isValid || false,
    blocks: noteValidation.blocks || [],
    mainAlt: noteValidation.mainAlt || mainAlt || 'M', // Use mainAlt as fallback, default to M
    role: noteValidation.role,
    dualRole: noteValidation.dualRole,
    gearScore: noteValidation.gearScore || 0,
    dualGearScore: noteValidation.dualGearScore,
    professions: noteValidation.professions || [],
    isRaidLeader: noteValidation.isRaidLeader || false,
    hasSchedule: noteValidation.hasSchedule || false,
    schedules: noteValidation.schedules || [],
    error: noteValidation.error,
    missingFields: noteValidation.missingFields || [],
  };

  // Deducir facción de la raza
  const allianceRaces = ['HU', 'NE', 'DW', 'GN', 'DR'] as const;
  const hordeRaces = ['OR', 'TA', 'UN', 'TR', 'BE'] as const;
  let deducedFaction = '';
  if (memberData.race) {
    if ((allianceRaces as readonly string[]).includes(memberData.race)) {
      deducedFaction = '1';
    } else if ((hordeRaces as readonly string[]).includes(memberData.race)) {
      deducedFaction = '2';
    }
  }

  // Recopilar reconocimientos
  const memberRecognitions: any[] = [];
  const typedFeaturedData = featuredPlayersData as any;
  const recognitionsList = typedFeaturedData.recognitions || [];

  Object.entries(typedFeaturedData).forEach(([year, yearData]) => {
    if (year === 'recognitions') return;
    Object.entries(yearData as Record<string, any>).forEach(([month, monthData]) => {
      if (monthData.featuredPlayers) {
        (monthData.featuredPlayers || []).forEach((fp: any) => {
          const fpName = String(fp.playerName || '').trim().toLowerCase();
          const targetName = String(memberData.name || '').trim().toLowerCase();
          if (fpName === targetName && fpName !== '') {
            (fp.recognitionIndices || []).forEach((idx: number) => {
              const rec = recognitionsList[idx];
              if (rec) {
                memberRecognitions.push({
                  ...rec,
                  date: `${year}-${month.padStart(2, '0')}-01`,
                });
              }
            });
          }
        });
      }
    });
  });

  memberRecognitions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    ...memberData,
    name: memberData.name || 'Unknown',
    class: className,
    rank: memberData.rank || 'Miembro',
    publicNote: memberData.publicNote || '',
    officerNote: memberData.officerNote || '',
    race: memberData.race || '',
    guildLeave: memberData.guildLeave || false,
    level: memberData.level || 80,
    gearScore: noteValidation.gearScore || 0,
    mainAlt: noteValidation.mainAlt || mainAlt || 'M', // Prioritize note validation
    noteValidation: validNoteValidation,
    leaderData: memberData.leaderData || {},
    validation: {
      isValid: noteValidation.isValid,
      missingFields: noteValidation.missingFields || [],
    },
    recognitions: memberRecognitions,
    faction: deducedFaction,
  } as RosterMemberType;
};

/**
 * Asegura que un miembro del roster tenga todas las propiedades requeridas
 */
export function ensureRosterMember(member: Partial<RosterMember>): RosterMember {
  return {
    name: member.name || 'Unknown',
    class: member.class || 'Guerrero',
    rank: member.rank || 'Aspirante',
    publicNote: member.publicNote || '',
    officerNote: member.officerNote || '',
    race: member.race || '',
    faction: (() => {
      const allianceRaces = ['HU', 'NE', 'DW', 'GN', 'DR'];
      const hordeRaces = ['OR', 'TA', 'UN', 'TR', 'BE'];
      if (member.race) {
        if (allianceRaces.includes(member.race)) return '1';
        if (hordeRaces.includes(member.race)) return '2';
      }
      return member.faction || '';
    })(),
    noteValidation: member.noteValidation || {
      isValid: false,
      mainAlt: 'M',
      role: 'D',
      gearScore: 0,
      professions: [],
      schedules: [],
      missingFields: [],
      error: 'No note provided',
    },
    mainAlt: member.mainAlt || 'A',
    recognitions: Array.isArray(member.recognitions) ? member.recognitions : [],
    ...member,
  } as RosterMember;
}

/**
 * Calcula la distribución por rango
 */
export function calculateRankDistribution(
  members: any[] = []
): Array<{ name: string; count: number; percentage: number }> {
  if (!members || !Array.isArray(members)) return [];
  const totalMembers = members.length;
  if (totalMembers === 0) return [];
  const rankCounts = members.reduce((acc: Record<string, number>, member) => {
    acc[member.rank] = (acc[member.rank] || 0) + 1;
    return acc;
  }, {});

  const rankOrder = [
    'Guild Master',
    'Administrador',
    'Oficial',
    'Oficial Alt',
    'Raider',
    'Raider Alt',
    'Miembro',
    'Alter',
    'Social',
    'Silenciado',
  ];

  return Object.entries(rankCounts)
    .map(([name, count]) => ({
      name,
      count: count as number,
      percentage: totalMembers > 0 ? Math.round(((count as number) / totalMembers) * 100 * 10) / 10 : 0,
      order: rankOrder.indexOf(name) === -1 ? 999 : rankOrder.indexOf(name),
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ name, count, percentage }) => ({ name, count, percentage }));
}

/**
 * Calcula la distribución por clase
 */
export function calculateClassDistribution(
  members: any[] = [],
  classInfo: any = {}
): Array<{ name: string; count: number; color: string }> {
  if (!Array.isArray(members) || !classInfo) return [];
  const classCounts = members.reduce((acc: Record<string, number>, member) => {
    if (member && member.class) {
      acc[member.class] = (acc[member.class] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(classCounts)
    .filter(([className]) => className && classInfo[className])
    .map(([className, count]) => ({
      name: classInfo[className].name, // Use display name (Spanish)
      count: count as number,
      color: classInfo[className].color || 'FFFFFF',
    }));
}

/**
 * Calcula estadísticas generales del roster
 */
export const calculateStats = (members: RosterMember[]): RosterStats => {
  const initialStats = {
    totalMembers: 0,
    roleDistribution: {},
    gearScoreStats: { min: 0, max: 0, avg: 0, total: 0, mainGearScore: 0, dualGearScore: null },
    raidLeadersCount: 0,
    mainAltDistribution: { M: 0, A: 0 },
    professions: {},
    validNotesCount: 0,
  };

  if (!members.length) return initialStats as RosterStats;

  const professions: Record<string, number> = {};
  PROFESSION_CODES.forEach((code) => {
    professions[code] = 0;
  });

  const roleDistribution = calculateRoleDistro(members);
  const gearScoreStats = calculateGSStats(members);
  const raidLeadersCount = countLeaders(members);
  const mainAltDistribution = calculateMainAlts(members);
  const validNotesCount = members.filter((m) => m.noteValidation?.isValid).length;

  members.forEach((member) => {
    if (!member.noteValidation?.isValid) return;
    const profSources = member.noteValidation.professions || [];
    const characterBlocks = (member.noteValidation.blocks || []).filter(
      (b: any) => b.type === 'character' && b.parsedData?.professions?.length
    );
    characterBlocks.forEach((block: any) => {
      profSources.push(...block.parsedData.professions);
    });

    const uniqueProfs = [...new Set(profSources)]
      .map((p) => p?.trim().toUpperCase())
      .filter((p) => p && p.length === 2 && PROFESSION_CODES.includes(p as any));

    uniqueProfs.forEach((prof) => {
      if (prof in professions) professions[prof]++;
    });
  });

  return {
    totalMembers: members.length,
    roleDistribution,
    gearScoreStats,
    raidLeadersCount,
    mainAltDistribution,
    professions,
    validNotesCount,
  };
};

/**
 * Calcula la distribución por raza
 */
export function calculateRaceDistribution(members: any[] = []): Array<{ name: string; count: number; percentage: number; code: string }> {
  if (!Array.isArray(members)) return [];
  const counts = members.reduce((acc, member) => {
    const race = member.race || 'UNKNOWN';
    acc[race] = (acc[race] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = members.length;
  const RACE_NAMES: Record<string, string> = {
    'HU': 'Humano', 'NE': 'Elfo de la Noche', 'DW': 'Enano', 'GN': 'Gnomo', 'DR': 'Draenei',
    'OR': 'Orco', 'TA': 'Tauren', 'UN': 'No-muerto', 'TR': 'Trol', 'BE': 'Elfo de Sangre'
  };

  return Object.entries(counts)
    .map(([code, count]) => ({
      name: code === 'UNKNOWN' ? 'No Censada' : RACE_NAMES[code] || code,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      code,
    }))
    .sort((a, b) => (a.name === 'No Censada' ? 1 : b.name === 'No Censada' ? -1 : b.count - a.count));
}

/**
 * Calcula la distribución por facción
 */
export function calculateFactionDistribution(members: any[] = []): Array<{ name: string; count: number; percentage: number; code: string }> {
  if (!Array.isArray(members)) return [];
  const counts = members.reduce((acc, member) => {
    const faction = member.faction || 'UNKNOWN';
    acc[faction] = (acc[faction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = members.length;
  const FACTION_NAMES: Record<string, string> = { '1': 'Alianza', '2': 'Horda' };

  return Object.entries(counts)
    .map(([code, count]) => ({
      name: code === 'UNKNOWN' ? 'No Censada' : FACTION_NAMES[code] || code,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      code,
    }))
    .sort((a, b) => (a.name === 'No Censada' ? 1 : b.name === 'No Censada' ? -1 : b.count - a.count));
}

/**
 * Calcula la distribución por profesión
 */
export function calculateProfessionDistribution(members: any[] = []): Array<{ name: string; count: number; percentage: number; code: string }> {
  if (!Array.isArray(members)) return [];
  const counts: Record<string, number> = {};
  let uncensoredCount = 0;
  const total = members.length;
  const PROFESSIONS: Record<string, string> = {
    'AL': 'Alquimia', 'HB': 'Herboristería', 'TL': 'Sastrería', 'EN': 'Encantamiento',
    'EG': 'Ingeniería', 'JC': 'Joyería', 'BS': 'Herrería', 'IN': 'Inscripción',
    'MN': 'Minería', 'SK': 'Desuello', 'LW': 'Peletería'
  };

  members.forEach((member) => {
    const professions = member.noteValidation?.professions || [];
    if (professions.length === 0) {
      uncensoredCount++;
    } else {
      // Ensure unique professions per member to avoid double counting
      const uniqueProfs = [...new Set(professions)];
      uniqueProfs.forEach((prof: string) => {
        counts[prof] = (counts[prof] || 0) + 1;
      });
    }
  });

  const dist = Object.entries(counts)
    .map(([code, count]) => ({
      name: PROFESSIONS[code] || code,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      code,
    }))
    .sort((a, b) => b.count - a.count);

  if (uncensoredCount > 0) {
    dist.push({
      name: 'No Censada',
      count: uncensoredCount,
      percentage: total > 0 ? Math.round((uncensoredCount / total) * 100) : 0,
      code: 'UNKNOWN',
    });
  }

  return dist;
}

/**
 * Obtiene la prioridad del rango para ordenamiento
 */
export function getRankPriority(rank: string): number {
  const rankLower = rank?.toLowerCase() || '';
  if (rankLower.includes('guild master')) return 0;
  if (rankLower.includes('administrador')) return 1;
  if (rankLower.includes('oficial')) return 2;
  if (rankLower.includes('oficial alt')) return 3;
  if (rankLower.includes('raider')) return 4;
  if (rankLower.includes('raider alt')) return 5;
  if (rankLower.includes('miembro')) return 6;
  if (rankLower.includes('alter')) return 7;
  if (rankLower.includes('social')) return 8;
  return 9;
}

