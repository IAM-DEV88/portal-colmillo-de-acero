// Define default class info with TypeScript type
export const DEFAULT_CLASS_INFO: Record<string, { name: string; color: string }> = {
  // English class names
  'Warrior': { color: 'C79C6E', name: 'Guerrero' },
  'Paladin': { color: 'F58CBA', name: 'Paladín' },
  'Hunter': { color: 'ABD473', name: 'Cazador' },
  'Rogue': { color: 'FFF569', name: 'Pícaro' },
  'Priest': { color: 'FFFFFF', name: 'Sacerdote' },
  'Death Knight': { color: 'C41F3B', name: 'Caballero de la Muerte' },
  'Shaman': { color: '0070DE', name: 'Chamán' },
  'Mage': { color: '69CCF0', name: 'Mago' },
  'Warlock': { color: '9482C9', name: 'Brujo' },
  'Druid': { color: 'FF7D0A', name: 'Druida' },
  // Keep Spanish class names for backward compatibility
  'Guerrero': { color: 'C79C6E', name: 'Guerrero' },
  'Paladín': { color: 'F58CBA', name: 'Paladín' },
  'Cazador': { color: 'ABD473', name: 'Cazador' },
  'Pícaro': { color: 'FFF569', name: 'Pícaro' },
  'Sacerdote': { color: 'FFFFFF', name: 'Sacerdote' },
  'Caballero de la Muerte': { color: 'C41F3B', name: 'Caballero de la Muerte' },
  'Chamán': { color: '0070DE', name: 'Chamán' },
  'Mago': { color: '69CCF0', name: 'Mago' },
  'Brujo': { color: '9482C9', name: 'Brujo' },
  'Druida': { color: 'FF7D0A', name: 'Druida' },
};

export const RACE_NAMES: Record<string, string> = {
  GN: 'Gnomo',
  HU: 'Humano',
  NE: 'Elfo de la Noche',
  DW: 'Enano',
  DR: 'Draenei',
  OR: 'Orco',
  TA: 'Tauren',
  UN: 'No Muerto',
  TR: 'Trol',
  BE: 'Elfo de Sangre',
  // Full names just in case
  Orc: 'Orco',
  Troll: 'Trol',
  Tauren: 'Tauren',
  Undead: 'No Muerto',
  BloodElf: 'Elfo de Sangre',
  Draenei: 'Draenei',
  Dwarf: 'Enano',
  Gnome: 'Gnomo',
  Human: 'Humano',
  NightElf: 'Elfo de la Noche',
};

export const FACTION_NAMES: Record<string, string> = {
  '1': 'Alianza',
  '2': 'Horda',
  Alliance: 'Alianza',
  Horde: 'Horda',
};
