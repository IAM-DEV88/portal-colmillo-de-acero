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
export const validatePublicNote = (note: string | undefined, characterName: string = 'Desconocido'): PublicNoteValidation => {
  const result: PublicNoteValidation = { 
    isValid: false,
    raids: [],
    isRaidLeader: false,
    hasSchedule: false,
    hasRaids: false,
    schedules: []
  };
  
  // Log para depuración
  const separator = '='.repeat(80);
  console.log(`\n${separator}`);
  console.log(`=== INICIO DE DETECCIÓN PARA: ${characterName.toUpperCase()} ===`);
  console.log(`=== NOTA: "${note?.trim() || '[VACÍA]'}"`);
  console.log(separator);
  console.log('Códigos de raid disponibles:', Object.keys(RAIDS).join(', '));
  
  if (!note?.trim()) {
    return { ...result, error: 'La nota pública no puede estar vacía' };
  }
  
  const trimmedNote = note.trim();
  
  // 1. Detectar si es Raid Leader
  result.isRaidLeader = /\bRL\b/i.test(trimmedNote);
  console.log(`[${characterName}] ¿Es Raid Leader?`, result.isRaidLeader);
  
  // 2. Detectar roles (T, H, D) y main/alt
  const mainAltRoleMatch = trimmedNote.match(/^([MA]?)([THD])([THD]?)\b/i);
  if (mainAltRoleMatch) {
    const [, mainAlt, role1, role2] = mainAltRoleMatch;
    if (mainAlt) result.mainAlt = mainAlt.toUpperCase() as MainAlt;
    if (role1) result.role = role1.toUpperCase() as Role;
    if (role2) result.dualRole = role2.toUpperCase() as Role;
    console.log(`[${characterName}] Roles detectados:`, { mainAlt: result.mainAlt, role: result.role, dualRole: result.dualRole });
  } else {
    console.log(`[${characterName}] No se detectaron roles en la nota`);
  }
  
  // 3. Extraer Gear Score - formatos: 5.6, 5,6 o 5000
  // Busca números de 4 dígitos o números con un solo dígito antes y después del punto/coma
  const gsMatch = trimmedNote.match(/\b(\d{4}|\d[.,]\d)\b/);
  console.log(`[${characterName}] Coincidencia de Gear Score:`, gsMatch?.[0]);
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
  
  // 5. Extraer horarios
  const scheduleMatch = trimmedNote.match(/\b(\d{1,2}(?::\d{2})?[Xx])\b/);
  if (scheduleMatch) {
    result.schedules = [scheduleMatch[1].toUpperCase()];
    result.hasSchedule = true;
    console.log(`[${characterName}] Horario detectado:`, result.schedules[0]);
  } else {
    result.schedules = [];
    console.log(`[${characterName}] No se detectó horario`);
  }
  
  // 5. Extraer raids
  const raidMatches = [...trimmedNote.matchAll(/\b(ICC|TOC|ULD|NAX|OS|VOA|EOE|ONY|RS|MALY|SAP)\b/gi)];
  const raids: RaidInfo[] = [];
  
  // Añadir raids encontradas sin dificultad
  for (const match of raidMatches) {
    const raidCode = match[0].toUpperCase() as RaidCode;
    if (raidCode in RAIDS && !raids.some(r => r.code === raidCode)) {
      raids.push({
        code: raidCode,
        name: RAIDS[raidCode],
        difficultyCode: undefined,
        difficulty: undefined
      });
    }
  }
  
  // 6. Extraer dificultades
  const difficultyMatches = [...trimmedNote.matchAll(/\b(10N|25N|10H|25H|H)\b/gi)];
  const difficulties = [...new Set(difficultyMatches.map(m => m[0].toUpperCase()))];
  
  // Si hay al menos una raid y al menos una dificultad, asignar la primera dificultad a todas las raids
  if (raids.length > 0 && difficulties.length > 0) {
    const difficultyCode = difficulties[0] as DifficultyCode;
    for (const raid of raids) {
      raid.difficultyCode = difficultyCode;
      raid.difficulty = DIFFICULTIES[difficultyCode as keyof typeof DIFFICULTIES];
    }
  }
  
  // Asignar las raids al resultado
  if (raids.length > 0) {
    result.raids = raids;
    result.hasRaids = true;
    console.log(`[${characterName}] Raids detectadas:`, raids);
  } else {
    console.log(`[${characterName}] No se detectaron raids`);
  }
  
  // 7. Extraer profesiones (códigos exactos, insensibles a mayúsculas/minúsculas, permitiendo separación por / o espacios)
  const profCodes = Object.keys(PROFESSIONS);
  const profPattern = new RegExp(`\\b(${profCodes.join('|')})\\b`, 'gi');
  const profMatches = trimmedNote.match(profPattern) || [];
  
  if (profMatches.length > 0) {
    const validProfessions = new Set<ProfessionCode>();
    
    for (const match of profMatches) {
      const upperMatch = match.toUpperCase() as ProfessionCode;
      if (profCodes.includes(upperMatch)) {
        validProfessions.add(upperMatch);
      }
    }
    
    if (validProfessions.size > 0) {
      result.professions = Array.from(validProfessions);
    }
  }
  
  // Verificar si faltan campos importantes
  const missingFields = [];
  if (!result.role) missingFields.push('rol');
  if (!result.mainAlt) missingFields.push('main/alt');
  if (!result.gearScore) missingFields.push('gear score');
  if (raids.length === 0) missingFields.push('raids');
  
  console.log(`[${characterName}] Campos faltantes:`, missingFields);
  
  // Validar si la nota es válida
  result.isValid = [
    result.role,
    result.mainAlt,
    result.gearScore,
    result.professions?.length,
    result.schedules?.length,
    result.raids?.length
  ].some(Boolean);
  
  // Mostrar resumen final
  console.log(`\n${separator}`);
  console.log(`=== RESUMEN FINAL PARA: ${characterName.toUpperCase()} ===`);
  console.log(`=== NOTA ORIGINAL: "${note?.trim() || '[VACÍA]'}"`);
  console.log(separator);
  console.log(`• Es válido:`, result.isValid ? '✅' : '❌');
  console.log(`• Raids:`, result.raids?.length ? result.raids.map((r: RaidInfo) => 
    `${r.code}${r.difficultyCode ? ` (${r.difficultyCode})` : ''}`).join(', ') : 'Ninguna');
  console.log(`• Rol:`, result.role || 'No especificado');
  console.log(`• Main/Alt:`, result.mainAlt || 'No especificado');
  console.log(`• Gear Score:`, result.gearScore || 'No especificado');
  console.log(`• Profesiones:`, result.professions?.length ? result.professions.join(', ') : 'Ninguna');
  console.log(`• Horarios:`, result.schedules?.length ? result.schedules.join(', ') : 'Ninguno');
  console.log(separator + '\n');

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
