// rosterConstants.ts

export const DEFAULT_CLASS_INFO: Record<string, { name: string; color: string }> = {
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
  GN: 'Gnomo', HU: 'Humano', NE: 'Elfo de la Noche', DW: 'Enano', DR: 'Draenei',
  OR: 'Orco', TA: 'Tauren', UN: 'No Muerto', TR: 'Trol', BE: 'Elfo de Sangre'
};

export const FACTION_NAMES: Record<string, string> = {
  '1': 'Alianza', '2': 'Horda'
};

export const PROFESSIONS: Record<string, string> = {
  AL: 'Alquimia', HB: 'Herboristería', TL: 'Sastrería', EN: 'Encantamiento',
  EG: 'Ingeniería', JC: 'Joyería', BS: 'Herrería', IN: 'Inscripción',
  MN: 'Minería', SK: 'Desuello', LW: 'Peletería'
};

export const ROLES: Record<string, string> = {
  T: 'Tanque', H: 'Sanador', D: 'DPS'
};

export const PROFESSION_COLORS: Record<string, { color: string; bgColor: string }> = {
  AL: { color: 'text-blue-300', bgColor: 'bg-blue-500/20' },
  HB: { color: 'text-green-300', bgColor: 'bg-green-500/20' },
  TL: { color: 'text-amber-300', bgColor: 'bg-amber-500/20' },
  EN: { color: 'text-purple-300', bgColor: 'bg-purple-500/20' },
  EG: { color: 'text-orange-300', bgColor: 'bg-orange-500/20' },
  JC: { color: 'text-yellow-300', bgColor: 'bg-yellow-500/20' },
  BS: { color: 'text-gray-300', bgColor: 'bg-gray-500/20' },
  IN: { color: 'text-pink-300', bgColor: 'bg-pink-500/20' },
  MN: { color: 'text-gray-400', bgColor: 'bg-gray-600/20' },
  SK: { color: 'text-red-200', bgColor: 'bg-red-700/20' },
  LW: { color: 'text-amber-200', bgColor: 'bg-amber-700/20' },
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  '10N': 'bg-blue-500/20 text-blue-300',
  '10H': 'bg-blue-700/20 text-blue-400',
  '25N': 'bg-purple-500/20 text-purple-300',
  '25H': 'bg-red-500/20 text-red-300',
};

export const RANK_ORDER = [
  'Guild Master', 'Administrador', 'Oficial', 'Oficial Alt',
  'Raider', 'Raider Alt', 'Miembro', 'Alter', 'Social', 'Silenciado'
];
