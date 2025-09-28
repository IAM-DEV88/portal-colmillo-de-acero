// Tipos y constantes para el módulo de roster

export type ClassName = 'Guerrero' | 'Paladín' | 'Cazador' | 'Pícaro' | 'Sacerdote' | 
  'Caballero de la Muerte' | 'Chamán' | 'Mago' | 'Brujo' | 'Druida';

export type Role = 'T' | 'H' | 'D';
export type MainAlt = 'M' | 'A';
export type ProfessionCode = 'AL' | 'HB' | 'TL' | 'EN' | 'EG' | 'JC' | 'BS' | 'IN' | 'MN' | 'SK' | 'LW';
export type RaidCode = 'ICC' | 'TOC' | 'ULD' | 'NAX' | 'OS' | 'VOA' | 'EOE' | 'ONY' | 'RS';
export type DifficultyCode = '10N' | '10H' | '25N' | '25H';

export interface RaidInfo {
  name: string;
  difficulty?: string;
  code: string;
  difficultyCode?: string;
}

export interface PublicNoteValidation {
  isValid: boolean;
  mainAlt?: MainAlt;
  role?: Role;
  dualRole?: Role;
  gearScore?: string;
  professions?: string[];
  schedules?: string[];
  raids?: RaidInfo[];
  isRaidLeader: boolean;
  hasSchedule: boolean;
  hasRaids: boolean;
  error?: string;
  missingFields?: string[];
}

export interface ClassInfo {
  color: string;
  name: string;
}

export interface RosterMember {
  name: string;
  class: string;
  rank: string;
  publicNote?: string;
  noteValidation?: PublicNoteValidation;
}

export interface Member extends RosterMember {
  noteValidation: PublicNoteValidation;
}

export interface RosterData {
  members: Member[];
  classInfo: Record<string, ClassInfo>;
  rankInfo: Record<string, { name: string; order: number }>;
}

// Constantes de configuración
export const ROLES = {
  T: 'Tank',
  H: 'Healer',
  D: 'DPS'
} as const;

export const STATUS = {
  M: 'Main',
  A: 'Alt'
} as const;

export const PROFESSIONS = {
  'AL': 'Alquimia',
  'HB': 'Herboristería',
  'TL': 'Sastrería',
  'EN': 'Encantamiento',
  'EG': 'Ingeniería',
  'JC': 'Joyería',
  'BS': 'Herrería',
  'IN': 'Inscripción',
  'MN': 'Minería',
  'SK': 'Desuello',
  'LW': 'Peletería'
} as const;

export const RAIDS = {
  'ICC': 'Icecrown Citadel',
  'TOC': 'Trial of the Crusader',
  'ULD': 'Ulduar',
  'NAX': 'Naxxramas',
  'OS': 'Obsidian Sanctum',
  'VOA': 'Vault of Archavon',
  'EOE': 'Eye of Eternity',
  'ONY': "Onyxia's Lair",
  'RS': 'Ruby Sanctum'
} as const;

export const DIFFICULTIES = {
  '10N': '10 Normal',
  '10H': '10 Heroico',
  '25N': '25 Normal',
  '25H': '25 Heroico'
} as const;

export const CLASS_INFO: Record<ClassName, ClassInfo> = {
  'Guerrero': { color: 'C79C6E', name: 'Guerrero' },
  'Paladín': { color: 'F58CBA', name: 'Paladín' },
  'Cazador': { color: 'ABD473', name: 'Cazador' },
  'Pícaro': { color: 'FFF569', name: 'Pícaro' },
  'Sacerdote': { color: 'FFFFFF', name: 'Sacerdote' },
  'Caballero de la Muerte': { color: 'C41F3B', name: 'Caballero de la Muerte' },
  'Chamán': { color: '0070DE', name: 'Chamán' },
  'Mago': { color: '69CCF0', name: 'Mago' },
  'Brujo': { color: '9482C9', name: 'Brujo' },
  'Druida': { color: 'FF7D0A', name: 'Druida' }
};

export const ROLE_NAMES: Record<Role, { name: string; color: string; bgColor: string }> = {
  'T': { name: 'Tanque', color: 'text-blue-300', bgColor: 'bg-blue-500/20' },
  'H': { name: 'Sanador', color: 'text-green-300', bgColor: 'bg-green-500/20' },
  'D': { name: 'DPS', color: 'text-red-300', bgColor: 'bg-red-500/20' }
};

export const PROFESSION_NAMES: Record<ProfessionCode, { name: string; color: string; bgColor: string }> = {
  'JC': { name: 'Joyería', color: 'text-yellow-300', bgColor: 'bg-yellow-500/20' },
  'BS': { name: 'Herrería', color: 'text-gray-300', bgColor: 'bg-gray-500/20' },
  'EN': { name: 'Encantamiento', color: 'text-purple-300', bgColor: 'bg-purple-500/20' },
  'EG': { name: 'Ingeniería', color: 'text-blue-200', bgColor: 'bg-blue-500/20' },
  'AL': { name: 'Alquimia', color: 'text-green-200', bgColor: 'bg-green-500/20' },
  'TL': { name: 'Sastrería', color: 'text-pink-300', bgColor: 'bg-pink-500/20' },
  'IN': { name: 'Inscripción', color: 'text-indigo-300', bgColor: 'bg-indigo-500/20' },
  'HB': { name: 'Herboristería', color: 'text-lime-300', bgColor: 'bg-lime-500/20' },
  'MN': { name: 'Minería', color: 'text-gray-400', bgColor: 'bg-gray-600/20' },
  'SK': { name: 'Desuello', color: 'text-orange-300', bgColor: 'bg-orange-500/20' }
};

export const REGEX = {
  GEAR_SCORE: /(\d+\.\d+)/,
  HOUR: /(\d{1,2})h/gi,
  PROFESSIONS: new RegExp(`(${Object.keys(PROFESSIONS).join('|')})\s*[\/\s]\s*(${Object.keys(PROFESSIONS).join('|')})`, 'i'),
  RAID_WITH_DIFFICULTY: new RegExp(`(${Object.keys(RAIDS).join('|')})\s*(${Object.keys(DIFFICULTIES).join('|')}|H)`, 'gi'),
  RAID_WITH_DIFFICULTY_NO_SPACE: new RegExp(`(${Object.keys(RAIDS).join('|')})(${Object.keys(DIFFICULTIES).join('|')}|H)`, 'gi'),
  RAID_ONLY: new RegExp(`(${Object.keys(RAIDS).join('|')})(?![0-9A-Za-z])`, 'gi')
};
