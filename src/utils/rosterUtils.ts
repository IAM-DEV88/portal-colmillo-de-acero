import type { 
  PublicNoteValidation, 
  RaidInfo, 
  Role, 
  MainAlt, 
  ProfessionCode, 
  RaidCode, 
  DifficultyCode
} from '../types/roster';

import {
  RAIDS,
  DIFFICULTIES,
  PROFESSIONS,
  ROLES,
  STATUS
} from '../types/roster';

/**
 * Valida y extrae información de la nota pública de un miembro
 */
export const validatePublicNote = (note: string | undefined): PublicNoteValidation => {
  const result: PublicNoteValidation = { 
    isValid: false,
    raids: [],
    isRaidLeader: false,
    hasSchedule: false,
    hasRaids: false
  };
  
  if (!note?.trim()) {
    return { ...result, error: 'La nota pública no puede estar vacía' };
  }
  
  const trimmedNote = note.trim();
  
  // 1. Detectar si es Raid Leader
  result.isRaidLeader = /\bRL\b/i.test(trimmedNote);
  
  // 2. Detectar roles (T, H, D) y main/alt
  const mainAltRoleMatch = trimmedNote.match(/^([MA]?)([THD])([THD]?)\b/i);
  if (mainAltRoleMatch) {
    const [, mainAlt, role1, role2] = mainAltRoleMatch;
    if (mainAlt) result.mainAlt = mainAlt.toUpperCase() as MainAlt;
    if (role1) result.role = role1.toUpperCase() as Role;
    if (role2) result.dualRole = role2.toUpperCase() as Role;
  }
  
  // 3. Extraer Gear Score - formatos: 5.6, 5,6 o 5000
  // Busca números de 4 dígitos o números con un solo dígito antes y después del punto/coma
  const gsMatch = trimmedNote.match(/\b(\d{4}|\d[.,]\d)\b/);
  if (gsMatch) {
    let gsValue = gsMatch[0];
    // Si es un número de 4 dígitos, convertirlo a formato decimal (ej: 5585 -> 5.5)
    if (/^\d{4}$/.test(gsValue)) {
      const num = parseInt(gsValue);
      gsValue = (num / 1000).toFixed(1);
    } else {
      // Reemplazar coma por punto para estandarizar
      gsValue = gsValue.replace(',', '.');
    }
    result.gearScore = gsValue;
  }
  
  // 4. Extraer horarios (formatos: HHx, HHX, HH:MMx, HH:MMX, HHx-HHx, etc.)
  const hourMatches: string[] = [];
  
  // Debug: Log the note being processed
  const debugNote = trimmedNote.toLowerCase();
  const debugLeaders = ['stormgrim', 'voidhammer', 'vorthrak'];
  const isDebugLeader = debugLeaders.some(name => debugNote.includes(name.toLowerCase()));
  
  if (isDebugLeader) {

  }
  
  // Buscar rangos de horario (ej: 20x-23x, 18h-20h, 18X-20X)
  const rangeMatches = [
    ...trimmedNote.matchAll(/(\d{1,2})[xh]?\s*-\s*(\d{1,2})[xh]/gi)
  ];
  rangeMatches.forEach(match => {
    const startHour = parseInt(match[1], 10);
    const endHour = parseInt(match[2], 10);
    
    // Validar que las horas estén en rango
    if (startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23) {
      hourMatches.push(`${startHour.toString().padStart(2, '0')}X`);
      hourMatches.push(`${endHour.toString().padStart(2, '0')}X`);
    }
  });
  
  // Buscar horas individuales con varios formatos:
  // - Después de espacio o barra: "18x", "18X", "18 x", "18 X"
  // - Después de letra de dificultad: "25n18x", "10h20x"
  // - Con minutos: "18:30x", "18:30X"
  const timePatterns = [
    // Formato después de letra de dificultad (ej: 25n18x)
    /(?:^|[\s|]|[a-zA-Z])(\d{1,2})(?::(\d{2}))?[xX](?=[\s|]|$)/g,
    // Formato con espacio opcional (ej: 18x, 18 x, 18X, 18 X)
    /(?:^|[\s|])(\d{1,2})\s*[xX](?=[\s|]|$)/g,
    // Formato pegado al final (ej: ...18x, ...18X)
    /(\d{2})[xX](?=[^\d]|$)/g
  ];
  
  const individualMatches: RegExpMatchArray[] = [];
  for (const pattern of timePatterns) {
    const matches = [...trimmedNote.matchAll(pattern)];
    individualMatches.push(...matches);
  }
  
  if (isDebugLeader) {

  }
  
  individualMatches.forEach(match => {
    const hour = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    
    if (hour >= 0 && hour <= 23 && minutes >= 0 && minutes <= 59) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
      hourMatches.push(`${formattedHour}${formattedMinutes}X`);
    }
  });
  
  if (hourMatches.length > 0) {
    result.schedules = [...new Set(hourMatches)].sort();
    result.hasSchedule = true;
  }
  
  // 5. Extraer raids y dificultades
  // Primero buscamos el formato con múltiples dificultades: "ICC 10n 25n" o "ICC10n25n"
  let raidMatches: Array<[string, string, string?]> = [];
  
  // Patrón para capturar raid con múltiples dificultades (ej: "ICC 10n 25n" o "ICC10n25n")
  const multiDifficultyPattern = /(ICC|TOC|ULD|NAX|OS|VOA|EOE|ONY|RS)(?:\s*)((?:\d+[NHnh]\s*)+)/gi;
  let match;
  
  while ((match = multiDifficultyPattern.exec(trimmedNote)) !== null) {
    const raidCode = match[1].toUpperCase();
    const difficulties = match[2].match(/\d+[NHnh]/gi) || [];
    
    for (const diff of difficulties) {
      raidMatches.push([raidCode, diff.toUpperCase()]);
    }
  }
  
  // Si no encontramos en el formato múltiple, buscamos formatos individuales
  if (raidMatches.length === 0) {
    // Buscar formato con espacio: "ICC 25H" o "ULD 10N"
    const spaceFormat = [...trimmedNote.matchAll(/(ICC|TOC|ULD|NAX|OS|VOA|EOE|ONY|RS)\s+(10N|25N|10H|25H|H)/gi)];
    if (spaceFormat.length > 0) {
      raidMatches = spaceFormat.map(m => [m[1], m[2]]);
    } else {
      // Buscar formato pegado: "ICC25H" o "ULD10N"
      const attachedFormat = [...trimmedNote.matchAll(/(ICC|TOC|ULD|NAX|OS|VOA|EOE|ONY|RS)(10N|25N|10H|25H|H)/gi)];
      raidMatches = attachedFormat.map(m => [m[1], m[2]]);
    }
  }
  
  if (raidMatches.length > 0) {
    const raids: RaidInfo[] = [];
    
    for (const [raidCode, difficultyCode] of raidMatches) {
      if (raidCode in RAIDS) {
        const raidKey = raidCode as RaidCode;
        const diffKey = difficultyCode as DifficultyCode;
        
        raids.push({
          code: raidKey,
          name: RAIDS[raidKey],
          difficultyCode: diffKey,
          difficulty: DIFFICULTIES[diffKey as keyof typeof DIFFICULTIES]
        });
      }
    }
    
    if (raids.length > 0) {
      result.raids = raids;
      result.hasRaids = true;
    }
  }
  
  // 6. Extraer profesiones (códigos exactos, insensibles a mayúsculas/minúsculas, permitiendo separación por / o espacios)
  const profCodes = Object.keys(PROFESSIONS);
  // Busca códigos individuales o separados por / o espacios
  const profMatches = [
    ...trimmedNote.matchAll(new RegExp(`(?:^|[\s/])(?:${profCodes.join('|')})(?=[\s/]|$)`, 'gi'))
  ];
  
  if (profMatches.length > 0) {
    const validProfessions = new Set<ProfessionCode>();
    
    for (const match of profMatches) {
      const profCode = match[0].trim().toUpperCase() as ProfessionCode;
      if (profCode in PROFESSIONS) {
        validProfessions.add(profCode);
      }
    }
    
    result.professions = Array.from(validProfessions);
  }
  
  // Validar que tenga al menos un rol o raid
  result.isValid = !!(result.role || result.dualRole || (result.raids && result.raids.length > 0));
  
  return result;
}

// Función para extraer raids con sus dificultades - maneja formatos como "ICC 25H", "ICC25H", "TOC10N", etc.
const extractRaidDifficulties = (note: string): {code: RaidCode, difficulty: string, name: string}[] => {
  const raidWithDiffRegex = /(?:^|\s)(ICC|TOC|ULD|NAX|OS|RS|EOE|VOA|ONY|MALY|SAP)(?:\s*)(\d{1,2}[NHnh]?)(?=\s|$)/gi;
  const raidPairs: {code: RaidCode, difficulty: string, name: string}[] = [];
  
  // Primero buscamos raids con dificultad
  const matches = [...note.matchAll(raidWithDiffRegex)];
  for (const match of matches) {
    const code = match[1].toUpperCase() as RaidCode;
    const difficulty = match[2].toUpperCase();
    
    // Solo agregamos si no existe ya este código de raid
    if (!raidPairs.some(r => r.code === code)) {
      raidPairs.push({
        code,
        difficulty,
        name: RAIDS[code] || code
      });
    }
  }
  
  // Luego buscamos raids sin dificultad especificada
  const raidOnlyRegex = new RegExp(`\\b(${Object.keys(RAIDS).join('|')})\\b`, 'gi');
  const raidOnlyMatches = [...note.matchAll(raidOnlyRegex)];
  
  for (const match of raidOnlyMatches) {
    const code = match[1].toUpperCase() as RaidCode;
    
    // Solo agregamos si no existe ya este código de raid
    if (!raidPairs.some(r => r.code === code)) {
      raidPairs.push({
        code,
        difficulty: '',
        name: RAIDS[code] || code
      });
    }
  }
  
  return raidPairs;
};
