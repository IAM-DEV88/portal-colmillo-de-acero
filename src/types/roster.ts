// Tipos básicos
export type Role = 'T' | 'H' | 'D';
export type MainAlt = 'M' | 'A';
export type ClassName = 'Guerrero' | 'Paladín' | 'Cazador' | 'Pícaro' | 'Sacerdote' | 
  'Caballero de la Muerte' | 'Chamán' | 'Mago' | 'Brujo' | 'Druida';

export type RaidCode = 'ICC' | 'TOC' | 'ULD' | 'NAX' | 'OS' | 'VOA' | 'EOE' | 'ONY' | 'RS';
export type DifficultyCode = '10N' | '10H' | '25N' | '25H';
export type ProfessionCode = 'AL' | 'HB' | 'TL' | 'EN' | 'EG' | 'JC' | 'BS' | 'IN' | 'MN' | 'SK' | 'LW';

// Tipos para el Sistema de Notas Compactas Duales (SNCD)
export interface Schedule {
  days: string;
  time: string;
  isRaidLeader: boolean;
}

export interface RaidInfo {
  code: RaidCode;
  difficulty: string;  // Changed from DifficultyCode to string to allow for display names
  name: string;
  difficultyCode: DifficultyCode;
  isRaidLeader?: boolean;
  days?: string[];
  dayRange?: string; // Para rangos como 'L-V'
  time?: string;
}

// Bloque de personaje
export interface CharacterBlock {
  mainAlt: MainAlt;
  mainRole: Role;
  dualRole?: Role;
  mainGearScore: number;
  dualGearScore?: number;
  professions: ProfessionCode[];
}

// Bloque de evento
export interface EventBlock {
  days: string[];
  dayRange?: string; // Para rangos como 'L-V'
  time?: string;
  raid?: RaidCode;
  difficulty?: DifficultyCode;
  isRaidLeader: boolean;
  isLookingForGroup: boolean;
}

// Bloque de nota (puede ser personaje o evento)
export interface NoteBlock {
  type: 'character' | 'event' | 'unknown';
  content: string;
  isValid: boolean;
  error?: string;
  parsedData?: any;
}

export interface PublicNoteValidation {
  isValid: boolean;
  blocks: NoteBlock[];
  mainAlt?: MainAlt;
  role?: Role;
  dualRole?: Role;
  gearScore?: number;
  dualGearScore?: number;
  professions?: ProfessionCode[];
  schedules?: Schedule[];
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
  class: ClassName;
  rank: string;
  publicNote?: string;
  officerNote?: string;
  noteValidation?: PublicNoteValidation;
  mainAlt: MainAlt;
}

export interface Member extends RosterMember {
  noteValidation: PublicNoteValidation;
}

export interface RosterStats {
  totalMembers: number;
  roleDistribution: Record<string, number>;
  gearScoreStats: {
    min: number;
    max: number;
    avg: number;
    total: number;
  };
  raidLeadersCount: number;
  mainAltDistribution: { M: number; A: number };
  professions: Record<string, number>;
  validNotesCount: number;
}

export interface RosterData {
  members: Member[];
  classInfo: Record<string, ClassInfo>;
  rankInfo: Record<string, { name: string; order: number }>;
  classes: string[];
  totalMembers: number;
  stats: RosterStats;
  raids: any[];
  raidDays: Record<string, unknown>;
  raidTimes: Record<string, unknown>;
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage?: number;
  color?: string;
}

export interface RoleDistributionItem extends DistributionItem {
  role: string;
}

export interface MainAltDistribution {
  M: number;
  A: number;
}

export interface ClassDistributionItem extends DistributionItem {
  color: string;
}

export interface MainAltDistributionItem extends DistributionItem {
  type: 'M' | 'A';
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

// Constantes para códigos de banda
export const RAID_NAMES: Record<RaidCode, string> = {
  'ICC': 'Ciudadela de la Corona de Hielo',
  'TOC': 'Prueba del Cruzado',
  'ULD': 'Ulduar',
  'NAX': 'Naxxramas',
  'OS': 'El Oculus de los Creadores',
  'VOA': 'Cámara de Archavon',
  'EOE': 'El Ojo de la Eternidad',
  'ONY': 'Guarida de Onyxia',
  'RS': 'Cámara de los Aspectos'
} as const;

// Mapeo de días de la semana
export const DAY_NAMES: Record<string, string> = {
  'L': 'Lun',
  'M': 'Mar',
  'X': 'Mié',
  'J': 'Jue',
  'V': 'Vie',
  'S': 'Sáb',
  'D': 'Dom'
} as const;

// Constantes para códigos de dificultad
export const DIFFICULTY_NAMES: Record<DifficultyCode, string> = {
  '10N': '10 Normal',
  '10H': '10 Heroico',
  '25N': '25 Normal',
  '25H': '25 Heroico'
} as const;

// Constantes para profesiones
export const PROFESSIONS: Record<ProfessionCode, string> = {
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

// Valores para validación
export const RAID_CODES = Object.keys(RAID_NAMES) as RaidCode[];
export const DIFFICULTY_CODES = Object.keys(DIFFICULTY_NAMES) as DifficultyCode[];
export const PROFESSION_CODES = Object.keys(PROFESSIONS) as ProfessionCode[];

// Información de clases
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
} as const;

// Mapeo de roles a colores
export const ROLE_NAMES: Record<Role, { name: string; color: string; bgColor: string }> = {
  'T': { name: 'Tanque', color: 'text-blue-300', bgColor: 'bg-blue-500/20' },
  'H': { name: 'Sanador', color: 'text-green-300', bgColor: 'bg-green-500/20' },
  'D': { name: 'DPS', color: 'text-red-300', bgColor: 'bg-red-500/20' }
} as const;

// Mapeo de estados de main/alt
export const MAIN_ALT_STATUS = {
  M: { name: 'Main', color: 'text-amber-300' },
  A: { name: 'Alt', color: 'text-purple-300' }
} as const;

// Mapeo de profesiones a colores
export const PROFESSION_NAMES: Record<ProfessionCode, { name: string; color: string; bgColor: string }> = {
  'AL': { name: 'Alquimia', color: 'text-green-300', bgColor: 'bg-green-500/20' },
  'BS': { name: 'Herrería', color: 'text-gray-300', bgColor: 'bg-gray-500/20' },
  'EN': { name: 'Encantamiento', color: 'text-purple-300', bgColor: 'bg-purple-500/20' },
  'EG': { name: 'Ingeniería', color: 'text-yellow-300', bgColor: 'bg-yellow-500/20' },
  'HB': { name: 'Herboristería', color: 'text-green-500', bgColor: 'bg-green-500/20' },
  'IN': { name: 'Inscripción', color: 'text-blue-300', bgColor: 'bg-blue-500/20' },
  'JC': { name: 'Joyería', color: 'text-yellow-300', bgColor: 'bg-yellow-500/20' },
  'LW': { name: 'Peletería', color: 'text-orange-300', bgColor: 'bg-orange-500/20' },
  'MN': { name: 'Minería', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  'SK': { name: 'Desuello', color: 'text-red-300', bgColor: 'bg-red-500/20' },
  'TL': { name: 'Sastrería', color: 'text-pink-300', bgColor: 'bg-pink-500/20' }
} as const;

// Constantes para el sistema de notas
export const NOTE_TYPES = {
  CHARACTER: 'character',
  EVENT: 'event'
} as const;

export const DAYS_OF_WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
