import type { 
  RosterMember, 
  Role, 
  MainAlt, 
  ClassName, 
  RaidCode, 
  DifficultyCode, 
  ProfessionCode, 
  PublicNoteValidation, 
  CharacterBlock, 
  EventBlock,
  NoteBlock,
  RaidInfo,
  Schedule
} from '../types/roster';

declare module '../types/roster' {
  interface RosterMember {
    level?: number;
    gearScore?: number;
    validation?: {
      isValid: boolean;
      missingFields: string[];
    };
  }
}

// Definir constantes de profesiones
export const PROFESSION_CODES: ProfessionCode[] = ['AL', 'BS', 'EN', 'EG', 'JC', 'IN', 'MN', 'SK', 'TL', 'HB', 'LW'];

// Mapa de códigos de profesión a nombres
const PROFESSION_NAMES: Record<ProfessionCode, string> = {
  'AL': 'Alquimia',
  'BS': 'Herrería',
  'EN': 'Encantamiento',
  'EG': 'Ingeniería',
  'JC': 'Joyería',
  'IN': 'Inscripción',
  'MN': 'Minería',
  'SK': 'Desuello',
  'TL': 'Sastrería',
  'HB': 'Herboristería',
  'LW': 'Peletería'
};
const RAID_NAMES: Record<RaidCode, string> = {
  'ICC': 'Icecrown Citadel',
  'TOC': 'Trial of the Crusader',
  'ULD': 'Ulduar',
  'NAX': 'Naxxramas',
  'OS': 'Obsidian Sanctum',
  'VOA': 'Vault of Archavon',
  'EOE': 'Eye of Eternity',
  'ONY': 'Onyxia\'s Lair',
  'RS': 'Ruby Sanctum'
};

const DIFFICULTY_NAMES: Record<string, string> = {
  '10N': '10 Normal',
  '10H': '10 Heroic',
  '25N': '25 Normal',
  '25H': '25 Heroic'
};

// Constantes para los códigos de raid y dificultad
export const RAID_CODES = ['ICC', 'TOC', 'ULD', 'NAX', 'OS', 'VOA', 'EOE', 'ONY', 'RS'] as const;
export const DIFFICULTY_CODES = ['10N', '10H', '25N', '25H'] as const;

// Colores para cada raid
const RAID_COLORS: Record<RaidCode, string> = {
  'ICC': '#a335ee', // Morado
  'TOC': '#ff8000',  // Naranja
  'ULD': '#1eff00',  // Verde
  'NAX': '#e6cc80',  // Oro
  'OS':  '#0070dd',  // Azul
  'VOA': '#e6cc80',  // Oro
  'EOE': '#e6cc80',  // Oro
  'ONY': '#e6cc80',  // Oro
  'RS':  '#e6cc80'   // Oro
};

// Funciones de cálculo para el roster
export const calculateRoleDistribution = (members: RosterMember[]): Record<string, number> => {
  const roleCounts: Record<string, number> = {
    // Inicializar contadores para roles principales
    'T': 0, // Tank
    'H': 0, // Healer
    'D': 0, // DPS
    // Inicializar contadores para combinaciones de roles duales
    'TH': 0, // Tank/Heal
    'TD': 0, // Tank/DPS
    'HD': 0  // Heal/DPS
  };
  
  for (const member of members) {
    const noteValidation = member.noteValidation;
    if (!noteValidation) continue;
    
    const mainRole = noteValidation.role;
    const dualRole = noteValidation.dualRole;
    
    // Contar rol principal
    if (mainRole) {
      // Solo contamos el rol principal para el total de roles principales
      roleCounts[mainRole] = (roleCounts[mainRole] || 0) + 1;
      
      // Si hay rol dual, contamos la combinación de roles duales
      if (dualRole && dualRole !== mainRole) {
        // Ordenamos los roles alfabéticamente para evitar duplicados (ej: TH y HT)
        const roles = [mainRole, dualRole].sort().join('');
        
        // Mapear a las claves estándar
        if (roles === 'HT' || roles === 'TH') {
          roleCounts['TH'] = (roleCounts['TH'] || 0) + 1;
        } else if (roles === 'DT' || roles === 'TD') {
          roleCounts['TD'] = (roleCounts['TD'] || 0) + 1;
        } else if (roles === 'DH' || roles === 'HD') {
          roleCounts['HD'] = (roleCounts['HD'] || 0) + 1;
        }
      }
    }
  }
  
  return roleCounts;
};

export const calculateGearScoreStats = (members: RosterMember[]): {
  min: number;
  max: number;
  avg: number;
  total: number;
  mainGearScore: number;
  dualGearScore: number | null;
} => {
  if (!members.length) return { 
    min: 0, 
    max: 0, 
    avg: 0, 
    total: 0,
    mainGearScore: 0,
    dualGearScore: null
  };
  
  let min = Number.MAX_SAFE_INTEGER;
  let max = 0;
  let total = 0;
  let count = 0;
  let mainGearScore = 0;
  let dualGearScore: number | null = null;
  
  for (const member of members) {
    const noteValidation = member.noteValidation;
    if (!noteValidation) continue;
    
    // Obtener el gearScore principal
    const currentMainGearScore = noteValidation.gearScore || 0;
    let averageGearScore = currentMainGearScore;
    let currentDualGearScore: number | null = null;
    
    // Si hay un rol dual, calcular el promedio con el gear score dual
    if (noteValidation.dualRole && noteValidation.dualGearScore) {
      currentDualGearScore = noteValidation.dualGearScore;
      averageGearScore = (currentMainGearScore + currentDualGearScore) / 2;
      
      // Actualizar el dual gear score más alto
      if (dualGearScore === null || currentDualGearScore > dualGearScore) {
        dualGearScore = currentDualGearScore;
      }
    }
    
    // Actualizar el main gear score más alto
    if (currentMainGearScore > 0 && currentMainGearScore > mainGearScore) {
      mainGearScore = currentMainGearScore;
    }
    
    // Solo considerar miembros con gear score válido
    if (averageGearScore > 0) {
      min = Math.min(min, averageGearScore);
      max = Math.max(max, averageGearScore);
      total += averageGearScore;
      count++;
    }
  }
  
  return {
    min: count > 0 ? Math.round(min * 10) / 10 : 0, // Redondear a 1 decimal
    max: count > 0 ? Math.round(max * 10) / 10 : 0, // Redondear a 1 decimal
    avg: count > 0 ? Math.round((total / count) * 10) / 10 : 0, // Redondear a 1 decimal
    total: count,
    mainGearScore: Math.round(mainGearScore * 10) / 10,
    dualGearScore: dualGearScore !== null ? Math.round(dualGearScore * 10) / 10 : null
  };
};

export const countRaidLeaders = (members: RosterMember[]): number => {
  return members.filter(member => {
    // Verificar si el miembro es raid leader a través de noteValidation
    if (member.noteValidation?.isRaidLeader) return true;
    
    // O verificar en las raids si existe alguna donde sea raid leader
    if (member.noteValidation?.raids?.some(raid => raid.isRaidLeader)) {
      return true;
    }
    
    return false;
  }).length;
};

export const calculateMainAltDistribution = (members: RosterMember[]): { M: number; A: number } => {
  const result = { M: 0, A: 0 };
  
  for (const member of members) {
    // Usar mainAlt directamente del miembro o de noteValidation si existe
    const mainAlt = member.mainAlt || member.noteValidation?.mainAlt;
    if (mainAlt === 'M' || mainAlt === 'A') {
      result[mainAlt]++;
    }
  }
  
  return result;
};

/**
 * Parsea un bloque de personaje según el formato SNCD
 * Formato: [M/A][T/H/D]GS[?T/H/DGS][PROF1PROF2]
 * Ejemplo: MT6.2JCEN (Main Tanque 6.2 Joyería/Encantamiento)
 * Ejemplo con rol dual: MT6.2H5.3ALMN (Main Tanque 6.2k, Heal 5.3k, Alquimia/Minería)
 */
const parseCharacterBlock = (content: string): CharacterBlock | null => {
  // Convertir a mayúsculas y eliminar espacios
  const normalized = content.trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized) return null;

  let remaining = normalized;
  
  // 1. Extraer main/alt (opcional, por defecto Main)
  let mainAlt: MainAlt = 'M';
  const mainAltMatch = remaining.match(/^([MA])/);
  if (mainAltMatch) {
    mainAlt = mainAltMatch[1] as MainAlt;
    remaining = remaining.substring(1);
  }
  
  // 2. Extraer rol principal y gear score (aceptar minúsculas para los roles)
  const mainRoleMatch = remaining.match(/^([tTdDhH])(\d+(?:\.\d+)?)/);
  if (!mainRoleMatch) {
    console.log('No se pudo extraer el rol principal del bloque:', content);
    return null;
  }
  
  const mainRole = mainRoleMatch[1].toUpperCase() as Role;
  const mainGearScore = parseFloat(mainRoleMatch[2]);
  remaining = remaining.substring(mainRoleMatch[0].length);
  
  console.log(`Bloque ${content}: Rol principal: ${mainRole}, GS: ${mainGearScore}, Resto: ${remaining}`);
  
  // 3. Extraer rol dual y gear score (opcional, aceptar minúsculas)
  let dualRole: Role | undefined;
  let dualGearScore: number | undefined;
  
  const dualRoleMatch = remaining.match(/^([tTdDhH])(\d+(?:\.\d+)?)/);
  if (dualRoleMatch) {
    dualRole = dualRoleMatch[1].toUpperCase() as Role;
    dualGearScore = parseFloat(dualRoleMatch[2]);
    remaining = remaining.substring(dualRoleMatch[0].length);
    console.log(`Bloque ${content}: Rol dual: ${dualRole}, GS: ${dualGearScore}, Resto: ${remaining}`);
  }

  // 4. Extraer profesiones (2 letras cada una, máximo 2)
  const professions: ProfessionCode[] = [];
  
  console.log(`[parseCharacterBlock] Procesando contenido restante: "${remaining}"`);
  
  // Primero buscar el caso especial 'ALMN' (Alquimia + Minería)
  if (remaining.includes('ALMN')) {
    console.log('[parseCharacterBlock] Caso especial ALMN encontrado');
    professions.push('AL', 'MN');
    remaining = remaining.replace('ALMN', '');
  } else {
    // Buscar códigos de profesión válidos en el resto del texto
    // Primero buscar códigos de 2 letras mayúsculas
    const professionRegex = new RegExp(`(${PROFESSION_CODES.join('|')})`, 'g');
    let match;
    
    while ((match = professionRegex.exec(remaining)) !== null && professions.length < 2) {
      const code = match[0] as ProfessionCode;
      if (!professions.includes(code)) {
        console.log(`[parseCharacterBlock] Encontrada profesión: ${code}`);
        professions.push(code);
      }
    }
    
    // Si no encontramos con el regex, intentar con el método anterior
    if (professions.length === 0) {
      console.log('[parseCharacterBlock] No se encontraron profesiones con regex, intentando método alternativo');
      for (let i = 0; i < remaining.length - 1; i++) {
        const code = remaining.substring(i, i + 2).toUpperCase() as ProfessionCode;
        if (PROFESSION_CODES.includes(code) && !professions.includes(code)) {
          console.log(`[parseCharacterBlock] Encontrada profesión (método alternativo): ${code}`);
          professions.push(code);
          i++; // Saltar al siguiente par
          if (professions.length >= 2) break;
        }
      }
    }
  }
  
  console.log(`[parseCharacterBlock] Bloque "${content}": Profesiones encontradas:`, professions);

  // Validar que el rol dual sea diferente al principal
  if (dualRole && dualRole === mainRole) {
    dualRole = undefined;
    dualGearScore = undefined;
  }

  return {
    mainAlt,
    mainRole,
    mainGearScore,
    dualRole,
    dualGearScore,
    professions: Array.from(new Set(professions))
  };
};

/**
 * Parsea un bloque de evento según el formato SNCD
 * Formato: [DÍAS][HORA][RL?][RAID][DIFICULTAD]
 * Ejemplo: L-V20:00RLICC25H (Lunes a Viernes a las 20:00, ICC 25H, Raid Leader)
 */
const parseEventBlock = (content: string): EventBlock | null => {
  if (!content) return null;
  
  let remaining = content.trim();
  if (remaining.length === 0) return null;
  
  let isRaidLeader = false;
  let days: string[] = [];
  
  // 1. Extraer días (soporta L-V o L,M,X,J,V)
  const daysMatch = remaining.match(/^([LMXJVSD]+(?:-[LMXJVSD]+)?)/) || remaining.match(/([LMXJVSD],?)+/);
  if (daysMatch) {
    const daysStr = daysMatch[0];
    
    // Manejar rangos como L-V (Lunes a Viernes)
    if (daysStr.includes('-')) {
      const [startDay, endDay] = daysStr.split('-');
      const dayOrder = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      const startIndex = dayOrder.indexOf(startDay);
      const endIndex = dayOrder.indexOf(endDay);
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
        // Crear array con todos los días del rango
        for (let i = startIndex; i <= endIndex; i++) {
          days.push(dayOrder[i]);
        }
      } else {
        // Si no es un rango válido, tratar como días individuales
        days = daysStr.split('').filter(day => dayOrder.includes(day));
      }
    } else {
      // Días individuales separados por comas o juntos
      days = daysStr.split(',').flatMap(part => 
        part.split('').filter(day => ['L', 'M', 'X', 'J', 'V', 'S', 'D'].includes(day))
      );
    }
    
    remaining = remaining.substring(daysMatch[0].length).trim();
  }

  // 2. Extraer hora (formatos: HH:MM, HHMM)
  let time: string | undefined;
  const timeMatch = remaining.match(/^(\d{1,2})(?::?(\d{2}))?/);
  
  if (timeMatch) {
    let hours = timeMatch[1].padStart(2, '0');
    let minutes = timeMatch[2] ? timeMatch[2] : '00';
    if (minutes.length === 1) minutes = `0${minutes}`;
    time = `${hours}:${minutes}`;
    
    // Avanzar el puntero más allá de la hora
    remaining = remaining.substring(timeMatch[0].length).trim();
  }
  
  // 3. Buscar RL (Raid Leader) en cualquier posición
  if (remaining.includes('RL')) {
    isRaidLeader = true;
    remaining = remaining.replace(/RL/gi, '').trim();
  }

  // Extraer raid y dificultad (formatos: RAIDDIFICULTAD, RAID DIFICULTAD, o RAID-DIFICULTAD)
  
  let raid: RaidCode | undefined;
  let difficulty: DifficultyCode | undefined;
  
  // Try to match raid code with optional RL prefix and difficulty (e.g., RLICC25H, ICC25H, ICC-25H, ICC 25H)
  const raidWithDiffMatch = remaining.match(
    new RegExp(`^(RL)?\s*(${RAID_CODES.join('|')})\s*([-\s]?)\s*(${DIFFICULTY_CODES.join('|')})`, 'i')
  );
  
  if (raidWithDiffMatch) {
    // Check if RL was in the match
    if (raidWithDiffMatch[1]) {
      isRaidLeader = true;
    }
    
    raid = raidWithDiffMatch[2].toUpperCase() as RaidCode;
    difficulty = (raidWithDiffMatch[4] || '25N').toUpperCase() as DifficultyCode; // Default to 25N if no difficulty
    remaining = remaining.substring(raidWithDiffMatch[0].length).trim();
  } else {
    // Intentar encontrar solo raid (sin dificultad)
    const raidMatch = remaining.match(new RegExp(`^(${RAID_CODES.join('|')})`));
    if (raidMatch) {
      raid = raidMatch[1] as RaidCode;
      remaining = remaining.substring(raidMatch[0].length).trim();
      
      // Intentar extraer dificultad después del raid
      const diffMatch = remaining.match(new RegExp(`^(${DIFFICULTY_CODES.join('|')})`));
      if (diffMatch) {
        difficulty = diffMatch[1] as DifficultyCode;
        remaining = remaining.substring(diffMatch[0].length).trim();
      }
    }
  }

  // Buscar RL (Raid Leader) en cualquier parte
  if (remaining.includes('RL')) {
    isRaidLeader = true;
    remaining = remaining.replace(/RL/gi, '').trim();
  }
  
  // Si no se encontró dificultad, intentar extraerla
  if (!difficulty) {
    const diffMatch = remaining.match(new RegExp(`(${DIFFICULTY_CODES.join('|')})`));
    if (diffMatch && diffMatch[1]) {
      difficulty = diffMatch[1].toUpperCase() as DifficultyCode;
      if (typeof diffMatch.index === 'number') {
        remaining = remaining.substring(0, diffMatch.index) + 
                   remaining.substring(diffMatch.index + diffMatch[0].length);
      }
    } else {
      difficulty = '25N'; // Valor por defecto
    }
  }
  
  // Validar valores de raid y dificultad
  const validRaid: RaidCode = raid && RAID_CODES.includes(raid as RaidCode) ? raid as RaidCode : 'ICC';
  const validDifficulty: DifficultyCode = DIFFICULTY_CODES.includes(difficulty as DifficultyCode) 
    ? difficulty as DifficultyCode 
    : '25N';
    
  return {
    days,
    time: time || '00:00',
    raid: validRaid, 
    difficulty: validDifficulty, 
    isRaidLeader,
    isLookingForGroup: !isRaidLeader 
  };
};

/**
 * Formatea un bloque de evento con colores para mostrarlo en la UI
 */
export const formatEventBlock = (event: EventBlock): string => {
  if (!event) return '';
  
  // Mapeo de días a sus nombres completos
  const dayNames: {[key: string]: string} = {
    'L': 'Lunes',
    'M': 'Martes',
    'X': 'Miércoles',
    'J': 'Jueves',
    'V': 'Viernes',
    'S': 'Sábado',
    'D': 'Domingo'
  };
  
  // Mapeo de dificultades a sus nombres completos
  type DifficultyKey = '10N' | '10H' | '25N' | '25H';
  const difficultyNames: Record<DifficultyKey, string> = {
    '10N': '10 Normal',
    '10H': '10 Heroico',
    '25N': '25 Normal',
    '25H': '25 Heroico'
  };
  
  // Asegurarse de que la dificultad sea válida
  const difficulty = event.difficulty as DifficultyKey | undefined;
  
  // Función auxiliar para obtener el nombre de la dificultad de forma segura
  const getDifficultyName = (difficulty: string | undefined): string => {
    return difficulty && difficulty in difficultyNames 
      ? difficultyNames[difficulty as DifficultyKey] 
      : difficulty || '';
  };
  
  // Asegurarse de que event.days sea un array
  const daysArray = Array.isArray(event.days) ? event.days : [event.days];
  
  // Función para formatear un rango de días (ej: L-V)
  const formatDayRange = (range: string): string => {
    // Construir la cadena de días
    let daysStr = '';
    if (event.days && event.days.length > 0) {
      daysStr = event.days.map(day => dayNames[day as keyof typeof dayNames] || day).join(', ');
    } else if (event.dayRange) {
      const [start, end] = event.dayRange.split('-').map(day => dayNames[day as keyof typeof dayNames] || day);
      daysStr = `${start} a ${end}`;
    }
    return daysStr;
  };
  
  // Obtener los nombres de los días
  const days = daysArray
    .filter((d): d is string => typeof d === 'string')
    .map(d => formatDayRange(d))
    .filter(Boolean)
    .join(', ');
  
  // Color para el raid
  const raidColor = event.raid && typeof event.raid === 'string' && event.raid in RAID_COLORS 
    ? RAID_COLORS[event.raid as keyof typeof RAID_COLORS] 
    : '#ffffff';
  
  // Construir la cadena de líder de raid
  const leaderStr = event.isRaidLeader ? ' (RL)' : '';
  
  // Construir el texto con estilos en línea
  return `
    <div style="
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #e0e0e0;
      background-color: rgba(0, 0, 0, 0.7);
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      max-width: 300px;
    ">
      <div style="margin-bottom: 8px; display: flex; align-items: center;">
        <span style="color: #4fc3f7; font-weight: 600; min-width: 60px;">Días:</span> 
        <span style="font-weight: 500;">${days}</span>
      </div>
      <div style="margin-bottom: 8px; display: flex; align-items: center;">
        <span style="color: #4fc3f7; font-weight: 600; min-width: 60px;">Hora:</span> 
        <span style="font-weight: 500;">${event.time} HS</span>
      </div>
      <div style="margin-bottom: 8px; display: flex; align-items: center;">
        <span style="color: #4fc3f7; font-weight: 600; min-width: 60px;">Raideo:</span> 
        <span style="color: ${raidColor}; font-weight: 600;">${event.raid} ${getDifficultyName(event.difficulty || '25N')}</span>
      </div>
      ${event.isRaidLeader ? 
        '<div style="color: #ff9800; font-weight: 600; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">Raid Leader</div>' : 
        '<div style="color: #a5d6a7; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1);">Buscando grupo</div>'}
    </div>
  `;
};

/**
 * Valida y extrae información de la nota pública y del oficial de un miembro según el SNCD
 */
export const validatePublicNote = (
  note: string | undefined, 
  characterName: string = 'Desconocido',
  officerNote: string = ''
): PublicNoteValidation => {
  // Combinar notas públicas y oficiales
  const combinedNote = [
    note?.trim() || '',
    officerNote?.trim() || ''
  ]
    .filter(Boolean) // Eliminar cadenas vacías
    .join(' ') // Unir con espacio
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();

  const result: PublicNoteValidation = { 
    isValid: false,
    blocks: [],
    raids: [],
    isRaidLeader: false,
    hasSchedule: false,
    hasRaids: false,
    schedules: [],
    publicNote: note,
    officerNote: officerNote
  };

  if (!combinedNote) {
    return { ...result, error: 'La nota pública y del oficial están vacías' };
  }
  
  // Usar combinedNote para el procesamiento
  const blocks: NoteBlock[] = [];
  const noteBlocks = combinedNote.split(/[\s|]+/).filter(Boolean);
  
  // Log compacto de la estructura de la nota
  const logStructure = {
    originalNote: combinedNote,
    blocks: [] as Array<{
      type: 'character' | 'event',
      content: string,
      data?: CharacterBlock | EventBlock | null
    }>
  };

  for (const block of noteBlocks) {
    // Intentar parsear como bloque de personaje (empieza con M o A)
    if (/^[MA]/i.test(block)) {
      const charBlock = parseCharacterBlock(block);

      if (charBlock) {
        // Agregar al log de estructura
        logStructure.blocks.push({
          type: 'character',
          content: block,
          data: {
            mainAlt: charBlock.mainAlt,
            mainRole: charBlock.mainRole,
            mainGearScore: charBlock.mainGearScore,
            dualRole: charBlock.dualRole,
            dualGearScore: charBlock.dualGearScore,
            professions: charBlock.professions
          }
        });
        
        result.blocks.push({
          type: 'character',
          content: block,
          isValid: true,
          parsedData: charBlock
        });

        // Actualizar propiedades principales
        result.mainAlt = charBlock.mainAlt;
        result.role = charBlock.mainRole;
        result.dualRole = charBlock.dualRole; // Guardar el rol dual
        
        // Asegurar que gearScore sea un número
        result.gearScore = typeof charBlock.mainGearScore === 'number' 
          ? charBlock.mainGearScore 
          : parseFloat(charBlock.mainGearScore) || 0;
          
        // Guardar el gear score dual si existe
        if (charBlock.dualGearScore !== undefined) {
          result.dualGearScore = typeof charBlock.dualGearScore === 'number'
            ? charBlock.dualGearScore
            : parseFloat(charBlock.dualGearScore) || 0;
        }

        // Log de depuración
        console.log(`[validatePublicNote] Procesado bloque de personaje:`, {
          block,
          mainRole: result.role,
          dualRole: result.dualRole,
          gearScore: result.gearScore,
          mainAlt: result.mainAlt
        });

        if (charBlock.dualRole) {
          console.log(`[validatePublicNote] Rol dual detectado: ${charBlock.dualRole}`);
        }

        if (charBlock.professions && charBlock.professions.length > 0) {
          result.professions = charBlock.professions;
        }

        continue;
      } else {
        result.blocks.push({
          type: 'character',
          content: block,
          isValid: false,
          error: 'Formato de bloque de personaje inválido'
        });
      }
    }

    // Si no es un bloque de personaje, intentar como bloque de evento
    const eventBlock = parseEventBlock(block);
    
    if (eventBlock) {
      // Agregar al log de estructura
      logStructure.blocks.push({
        type: 'event',
        content: block,
        data: {
          days: eventBlock.days,
          time: eventBlock.time,
          raid: eventBlock.raid,
          difficulty: eventBlock.difficulty,
          isRaidLeader: eventBlock.isRaidLeader,
          isLookingForGroup: eventBlock.isLookingForGroup
        }
      });
      
      blocks.push({
        type: 'event',
        content: block,
        isValid: true,
        parsedData: eventBlock
      });
      
      // Actualizar información de raids y horarios
      if (eventBlock.raid) {
        const difficulty = eventBlock.difficulty && DIFFICULTY_CODES.includes(eventBlock.difficulty as DifficultyCode)
          ? eventBlock.difficulty as DifficultyCode
          : '25N'; // Default to 25N if difficulty is not valid
        
        // Crear clave única para evitar duplicados
        const raidKey = `${eventBlock.raid}-${difficulty}-${eventBlock.isRaidLeader ? 'RL' : ''}`;
        
        // Solo agregar si no existe ya
        const existingRaidIndex = result.raids?.findIndex(r => 
          r.code === eventBlock.raid && 
          r.difficultyCode === difficulty
        ) ?? -1;

        const raidInfo: RaidInfo = {
          code: eventBlock.raid,
          name: RAID_NAMES[eventBlock.raid] || eventBlock.raid,
          difficulty: DIFFICULTY_NAMES[difficulty as keyof typeof DIFFICULTY_NAMES] || difficulty,
          difficultyCode: difficulty,
          isRaidLeader: eventBlock.isRaidLeader || false,
          days: eventBlock.days,
          time: eventBlock.time
        };
        
        if (existingRaidIndex === -1) {
          if (!result.raids) result.raids = [];
          result.raids.push(raidInfo);
        } else if (result.raids) {
          // Si ya existe, actualizar con la información más reciente
          result.raids[existingRaidIndex] = {
            ...result.raids[existingRaidIndex],
            isRaidLeader: result.raids[existingRaidIndex].isRaidLeader || raidInfo.isRaidLeader,
            days: result.raids[existingRaidIndex].days || raidInfo.days,
            time: result.raids[existingRaidIndex].time || raidInfo.time
          };
        }
        
        result.hasRaids = true;
        
        // Solo agregar horario si hay días y hora
        if (eventBlock.days.length > 0 && eventBlock.time) {
          if (!result.schedules) result.schedules = [];
          
          // Crear clave única para el horario
          const scheduleKey = `${eventBlock.days.join('')}-${eventBlock.time}`;
          if (!result.schedules.some(s => 
            s.days === eventBlock.days.join('') && 
            s.time === eventBlock.time
          )) {
            result.schedules.push({
              days: eventBlock.days.join(''),
              time: eventBlock.time,
              isRaidLeader: eventBlock.isRaidLeader || false
            });
            result.hasSchedule = true;
          }
        }
        
        if (eventBlock.isRaidLeader) {
          result.isRaidLeader = true;
        }
      }
    } else {
      // Bloque no reconocido
      // Agregar al log de estructura
      const blockContent = typeof block === 'string' ? block : 'content' in block ? String(block.content) : 'Unknown block';
      
      // Agregar al log de estructura con el tipo correcto
      logStructure.blocks.push({
        type: 'character',
        content: blockContent,
        data: {
          mainAlt: 'M',
          mainRole: 'D',
          mainGearScore: 0,
          professions: []
        }
      });
      
      // Crear un nuevo bloque de tipo character con error
      const errorBlock: NoteBlock = {
        type: 'character',
        content: blockContent,
        isValid: false,
        error: 'Tipo de bloque desconocido',
        parsedData: {
          mainAlt: 'M',
          mainRole: 'D',
          mainGearScore: 0,
          professions: []
        } as CharacterBlock
      };
      
      // Si el bloque original tenía parsedData, intentar mantenerlo
      if (typeof block === 'object' && 'parsedData' in block && block.parsedData) {
        errorBlock.parsedData = block.parsedData as CharacterBlock | EventBlock;
      }
      
      result.blocks.push(errorBlock);
    }
  }
  
  // Verificar campos faltantes
  const missingFields: string[] = [];
  
  if (!result.mainAlt) {
    missingFields.push('Datos de personaje');
  }

  if (blocks.length === 0) {
    missingFields.push('Bloques válidos');
  }

  if (missingFields.length > 0) {
    result.missingFields = [...new Set([...(result.missingFields || []), ...missingFields])];
  }

  // Verificar validez general
  const allBlocksValid = blocks.length > 0 && blocks.every(b => b.isValid);
  
  // Actualizar estado de validación
  result.isValid = allBlocksValid && missingFields.length === 0;
  
  // Combinar bloques de personaje y evento
  result.blocks = [...result.blocks, ...blocks];
  
  // Procesar raids únicas
  if (result.raids && result.raids.length > 0) {
    const uniqueRaids: RaidInfo[] = [];
    
    for (const raid of result.raids) {
      if (!raid.name || !raid.code) continue;
      
      // Verificar si ya existe una raid con el mismo código y dificultad
      const existingRaid = uniqueRaids.find(
        r => r.code === raid.code && r.difficultyCode === raid.difficultyCode
      );
      
      if (!existingRaid) {
        // Si no existe, agregarla a la lista única
        uniqueRaids.push({
          code: raid.code,
          name: raid.name,
          difficulty: raid.difficulty || '25 Normal',
          difficultyCode: raid.difficultyCode || '25N',
          isRaidLeader: raid.isRaidLeader || false,
          days: raid.days || [],
          time: raid.time
        });
      } else {
        // Si ya existe, combinar la información
        const index = uniqueRaids.findIndex(
          r => r.code === raid.code && r.difficultyCode === raid.difficultyCode
        );
        if (index !== -1) {
          uniqueRaids[index] = {
            ...uniqueRaids[index],
            isRaidLeader: uniqueRaids[index].isRaidLeader || raid.isRaidLeader,
            days: uniqueRaids[index].days || raid.days || [],
            time: uniqueRaids[index].time || raid.time
          };
        }
      }
    }
    
    // Reemplazar el array de raids con el de raids únicas
    result.raids = uniqueRaids;
  }

  // Manejar raids indefinidas
  result.raids = result.raids || [];

  // Asegurarse de que las raids tengan un código válido
  result.raids = result.raids.map(raid => ({
    ...raid,
    code: raid.code || 'OTRO',
    difficulty: raid.difficulty || '25 Normal',
    difficultyCode: raid.difficultyCode || '25N'
  }));

  // Actualizar flags basados en los datos
  result.hasRaids = result.raids.length > 0;
  result.hasSchedule = (result.schedules?.length ?? 0) > 0;

  // Mostrar log compacto de la estructura
  if (logStructure.blocks.length > 0) {
    console.log('\n=== ESTRUCTURA DE NOTA ===');
    console.log(`Nota: "${logStructure.originalNote}"`);
    console.log('Bloques encontrados:');
    
    logStructure.blocks.forEach((block, index) => {
      console.log(`\n[Bloque ${index + 1}] ${block.type.toUpperCase()}: "${block.content}"`);
      
      if (block.type === 'character' && block.data) {
        const charData = block.data as CharacterBlock;
        const roles = [
          `[${charData.mainAlt === 'M' ? 'Main' : 'Alt'}] ${charData.mainRole} ${charData.mainGearScore}`,
          charData.dualRole && `+ ${charData.dualRole} ${charData.dualGearScore || ''}`,
          charData.professions?.length > 0 && `Prof: ${charData.professions.join(', ')}`
        ].filter(Boolean).join(' | ');
        
        console.log(roles);
      } else if (block.type === 'event' && block.data) {
        const eventData = block.data as EventBlock;
        const eventInfo = [
          eventData.days?.join('') && `Días: ${eventData.days.join('')}`,
          eventData.time && `Hora: ${eventData.time}`,
          eventData.raid && `Raid: ${eventData.raid}${eventData.difficulty ? ' ' + eventData.difficulty : ''}`,
          eventData.isRaidLeader && '[RL]'
        ].filter(Boolean).join(' | ');
        
        console.log(eventInfo);
      }
    });
  }

  return result;
}

/**
 * Extrae información de raids con sus dificultades según el formato SNCD
 * Compatible con formatos como "ICC 25H", "ICC25H", "TOC10N", etc.
 */
export function extractRaidDifficulties(note: string): RaidInfo[] {
  const raids: RaidInfo[] = [];
  if (!note) return raids;

  // 1. Buscar formato con espacio: "ICC 25H"
  const spaceFormat = new RegExp(`(${RAID_CODES.join('|')})\\s+(${DIFFICULTY_CODES.join('|')})`, 'gi');
  const spaceMatches = Array.from(note.matchAll(spaceFormat));
  
  for (const match of spaceMatches) {
    if (!match[1] || !match[2]) continue;
            
    const raidCode = match[1].toUpperCase() as RaidCode;
    const difficulty = match[2].toUpperCase() as DifficultyCode;
            
    // Verificar si ya existe esta combinación de raid y dificultad
    const exists = raids.some(r => 
      r.code === raidCode && r.difficultyCode === difficulty
    );
            
    if (!exists) {
      // Si no existe, agregarla a la lista
      raids.push({
        code: raidCode,
        difficulty: difficulty,
        name: RAID_NAMES[raidCode] || raidCode,
        difficultyCode: difficulty
      });
    }
  }

  // 2. Buscar formato pegado: "ICC25H" o "TOC10N"
  const attachedFormat = new RegExp(`(${RAID_CODES.join('|')})(${DIFFICULTY_CODES.join('|')})`, 'gi');
  const attachedMatches = Array.from(note.matchAll(attachedFormat));
  
  for (const match of attachedMatches) {
    if (!match[1] || !match[2]) continue;
            
    const raidCode = match[1].toUpperCase() as RaidCode;
    const difficulty = match[2].toUpperCase() as DifficultyCode;
    
    // Verificar si ya existe esta combinación de raid y dificultad
    const exists = raids.some(r => 
      r.code === raidCode && r.difficultyCode === difficulty
    );
    
    if (!exists) {
      raids.push({
        code: raidCode,
        difficulty: difficulty,
        name: RAID_NAMES[raidCode] || raidCode,
        difficultyCode: difficulty
      });
    }
  }
  
  return raids;
};
