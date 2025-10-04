import type { 
  RosterMember, 
  Role, 
  MainAlt, 
  ClassName, 
  RaidCode, 
  DifficultyCode, 
  ProfessionCode, 
  PublicNoteValidation as BasePublicNoteValidation, 
  CharacterBlock, 
  EventBlock,
  NoteBlock,
  RaidInfo,
  Schedule
} from '../types/roster';

// Extend the base PublicNoteValidation interface
export interface PublicNoteValidation extends Omit<BasePublicNoteValidation, 'publicNote' | 'officerNote'> {
  publicNote?: string;
  officerNote?: string;
}

declare module '../types/roster' {
  interface RosterMember {
    level?: number;
    gearScore?: number;
    validation?: {
      isValid: boolean;
      missingFields: string[];
    };
  }

  export interface PublicNoteValidation {
    isValid: boolean;
    mainAlt?: MainAlt;
    role?: Role;
    dualRole?: Role;
    gearScore?: number;
    dualGearScore?: number;
    professions?: ProfessionCode[];
    schedules?: string[];
    raids?: RaidInfo[];
    isRaidLeader?: boolean;
    hasSchedule?: boolean;
    hasRaids?: boolean;
    blocks?: Array<{
      type: string;
      content: string;
      isValid: boolean;
      parsedData?: any;
      error?: string;
    }>;
    error?: string;
    missingFields?: string[];
    days?: string[];
    publicNote?: string;
    officerNote?: string;
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
  
  // Array para almacenar todos los gear scores (primarios y secundarios)
  const allGearScores: number[] = [];
  
  for (const member of members) {
    const noteValidation = member.noteValidation;
    if (!noteValidation) continue;
    
    // Obtener el gearScore principal
    const currentMainGearScore = noteValidation.gearScore || 0;
    
    // Agregar el gear score principal si es mayor a 0
    if (currentMainGearScore > 0) {
      allGearScores.push(currentMainGearScore);
      
      // Actualizar el gear score principal más alto
      if (currentMainGearScore > mainGearScore) {
        mainGearScore = currentMainGearScore;
      }
      
      // Actualizar min y max con el gear score principal
      min = Math.min(min, currentMainGearScore);
      max = Math.max(max, currentMainGearScore);
      total += currentMainGearScore;
      count++;
    }
    
    // Si hay un rol dual, procesar el gear score secundario
    if (noteValidation.dualRole && noteValidation.dualGearScore) {
      const currentDualGearScore = noteValidation.dualGearScore;
      
      // Agregar el gear score secundario si es mayor a 0
      if (currentDualGearScore > 0) {
        allGearScores.push(currentDualGearScore);
        
        // Actualizar el dual gear score más alto
        if (dualGearScore === null || currentDualGearScore > dualGearScore) {
          dualGearScore = currentDualGearScore;
        }
        
        // Actualizar min y max con el gear score secundario
        min = Math.min(min, currentDualGearScore);
        max = Math.max(max, currentDualGearScore);
        total += currentDualGearScore;
        count++;
      }
    }
  }
  
  // Calcular el promedio de todos los gear scores
  const avg = count > 0 ? total / count : 0;
  
  // Si no hay gear scores, establecer min a 0
  const finalMin = allGearScores.length > 0 ? min : 0;
  
  return {
    min: Math.round(finalMin * 10) / 10,
    max: Math.round(max * 10) / 10,
    avg: Math.round(avg * 10) / 10,
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
 * Formatos soportados:
 * - [M/A][T/H/D][GS][T/H/DGS][PROF1PROF2]
 * - [M/A][T/H/D] (sin GS)
 * - [M/A][T/H/D][PROF1PROF2] (sin GS)
 * - [M/A][T/H/D][GS] (sin profesiones)
 * - [M/A] (solo main/alt)
 * 
 * Ejemplos:
 * - MT6.2JCEN (Main Tanque 6.2 Joyería/Encantamiento)
 * - MT6.2H5.3ALMN (Main Tanque 6.2k, Heal 5.3k, Alquimia/Minería)
 * - MT (Solo rol)
 * - MTAL (Rol + profesiones)
 * - M (Solo main/alt)
 */
const parseCharacterBlock = (content: string): CharacterBlock | null => {
  // Verificar que el bloque coincida con el patrón de personaje
  const match = content.match(/^([MA])([THD])(\d+(?:\.\d+)?)([THD]\d+(?:\.\d+)?)?([A-Za-z]{2,6})?/i) || 
                content.match(/^([MA])([THD])([A-Za-z]{2,6})?/i) ||
                content.match(/^([MA])$/i);
                
  if (!match) return null;
  
  const [, mainAlt, mainRole, gs, dualInfo, profs] = match;
  
  // Si no hay rol principal, solo se acepta si es solo M o A
  if (!mainRole && content.length > 1) return null;
  
  // Procesar gear score principal
  let gearScore = 0;
  if (gs) {
    const parsedGs = parseFloat(gs);
    if (!isNaN(parsedGs)) {
      gearScore = parsedGs;
    }
  }
  
  // Procesar rol dual si existe
  let dualRole: Role | undefined;
  let dualGearScore: number | undefined;
  
  if (dualInfo) {
    // Manejar el formato de rol dual con gear score (ej: d5.9)
    const dualMatch = dualInfo.match(/^([THD])(\d+(?:\.\d+)?)/i);
    if (dualMatch) {
      dualRole = dualMatch[1].toUpperCase() as Role;
      dualGearScore = parseFloat(dualMatch[2]);
    } else {
      // Si no coincide con el formato de gear score, verificar si es solo el rol dual
      const roleOnlyMatch = dualInfo.match(/^([THD])/i);
      if (roleOnlyMatch) {
        dualRole = roleOnlyMatch[1].toUpperCase() as Role;
      }
    }
  }
  
  // Procesar profesiones (2 letras cada una, máximo 2)
  const professions: ProfessionCode[] = [];
  if (profs) {
    for (let i = 0; i < profs.length; i += 2) {
      const prof = profs.substring(i, i + 2).toUpperCase();
      if (PROFESSION_CODES.includes(prof as ProfessionCode) && !professions.includes(prof as ProfessionCode)) {
        professions.push(prof as ProfessionCode);
        // Solo permitir hasta 2 profesiones
        if (professions.length >= 2) break;
      }
    }
  }
  
  // Si no hay rol principal, solo permitir si es exactamente M o A
  if (!mainRole) {
    if (content.length === 1) {
      return {
        mainAlt: (mainAlt.toUpperCase() === 'M' ? 'M' : 'A') as 'M' | 'A',
        mainRole: undefined,
        mainGearScore: 0,
        professions: []
      };
    }
    return null; // No se permite otra cosa después de M/A sin rol
  }
  
  // Validar que el rol principal sea válido
  const validMainRole: Role | undefined = ['T', 'H', 'D'].includes(mainRole.toUpperCase()) ? 
    (mainRole.toUpperCase() as Role) : undefined;
    
  // Si el rol no es válido, rechazar el bloque
  if (!validMainRole) {
    return null;
  }
    
  // Validar que el rol dual sea válido si existe
  const validDualRole: Role | undefined = dualRole && ['T', 'H', 'D'].includes(dualRole) ? 
    dualRole as Role : undefined;
    
  // Asegurar que los tipos sean correctos
  const result: CharacterBlock = {
    mainAlt: (mainAlt.toUpperCase() === 'M' ? 'M' : 'A') as 'M' | 'A',
    mainRole: validMainRole,
    mainGearScore: gearScore,
    dualRole: validDualRole,
    dualGearScore: validDualRole ? dualGearScore : undefined,
    professions
  };
  
  // Permitir el mismo rol para main y dual (ej: DPS/DPS)
  // Solo validar que los roles sean válidos, no que sean diferentes

  return result;
};

/**
 * Parsea un bloque de evento según el formato SNCD
 * Formato: [DÍAS][HORA][RL?][RAID][DIFICULTAD]
 * Ejemplo: L-V20:00RLICC25H (Lunes a Viernes a las 20:00, ICC 25H, Raid Leader)
 * También maneja formato: L-V18rlicc10n (Lunes a Viernes 18:00, ICC 10N)
 */
const parseEventBlock = (content: string): EventBlock | null => {
  if (!content) return null;
  
  let remaining = content.trim();
  if (remaining.length === 0) return null;
  
  let isRaidLeader = false;
  let days: string[] = [];
  let time: string | undefined;
  let raid: RaidCode | undefined;
  let difficulty: DifficultyCode | undefined;
  
  // Mapa de códigos de día a sus nombres completos
  const dayMap: Record<string, string> = {
    'L': 'Lun',
    'M': 'Mar',
    'X': 'Mié',
    'J': 'Jue',
    'V': 'Vie',
    'S': 'Sáb',
    'D': 'Dom'
  };
  
  // 1. Extraer días (soporta L-V, l-v, L-v, l-V, etc.) - Opcional
  // Días en español: L (lunes), M (martes), X (miércoles), J (jueves), V (viernes), S (sábado), D (domingo)
  const daysMatch = remaining.match(/^([LMXJVSD]+(?:-[LMXJVSD])?)/i);
  if (daysMatch && daysMatch.index === 0) {  // Solo si el match está al inicio
    const daysStr = daysMatch[0].toUpperCase();
    
    // Si es un rango (ej: L-V)
    if (daysStr.includes('-')) {
      const [start, end] = daysStr.split('-') as [string, string];
      const startIndex = 'LMXJVSD'.indexOf(start);
      const endIndex = 'LMXJVSD'.indexOf(end);
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        days = Array.from(new Set('LMXJVSD'.substring(startIndex, endIndex + 1).split('')));
      } else {
        // Si no es un rango válido, tomar solo el primer día
        days = [start[0]];
      }
    } else {
      // Si son días individuales, eliminar duplicados
      days = Array.from(new Set(daysStr.split('')));
    }
    
    // Validar que todos los días sean válidos
    const validDays = new Set('LMXJVSD');
    if (!days.every(day => validDays.has(day))) {
      days = []; // No fallar, simplemente no usar días inválidos
    }
    
    remaining = remaining.substring(daysMatch[0].length).trim();
  }

  // 2. Extraer RL (Raid Leader) - puede estar en cualquier lugar - Opcional
  if (remaining.toLowerCase().includes('rl')) {
    isRaidLeader = true;
    remaining = remaining.replace(/rl/gi, '').trim();
  }
  
  // 3. Extraer hora (formato HH o HH:MM) - Opcional
  const timeMatch = remaining.match(/^(\d{1,2})(?::(\d{2}))?/);
  if (timeMatch) {
    // Verificar si es un caso especial donde 'M' es seguido de números
    const isMDayWithTime = days.length === 1 && days[0] === 'M' && timeMatch.index === 0;
    
    // Si no es el caso especial de 'M' seguido de hora, o si es un caso especial pero tiene formato válido
    if (!isMDayWithTime || (isMDayWithTime && timeMatch[0].length > 0)) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      
      // Validar horas y minutos
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        remaining = remaining.substring(timeMatch[0].length).trim();
      }
      // Si la hora no es válida, simplemente la ignoramos
    } else if (isMDayWithTime) {
      // Si es solo 'M' sin hora, continuar sin extraer hora
      remaining = remaining.substring(1).trim();
    }
  }

  // 4. Extraer raid y dificultad - Obligatorio
  // Soporta múltiples formatos:
  // - Formato 1: ICC10N (raid + número + dificultad)
  // - Formato 2: ICC 10N (raid separado de dificultad)
  // - Formato 3: M20RLTOC25N (prefijo M + número + RL + raid + dificultad)
  // - Formato 4: Icc10n (case insensitive)
  
  // Primero, normalizar el texto restante a mayúsculas para facilitar la comparación
  const upperRemaining = remaining.toUpperCase();
  
  // Intentar encontrar cualquier código de raid en el texto restante
  const raidCodeMatch = RAID_CODES.find(code => 
    upperRemaining.includes(code.toUpperCase())
  );

  if (raidCodeMatch) {
    const raidIndex = upperRemaining.indexOf(raidCodeMatch.toUpperCase());
    const beforeRaid = remaining.substring(0, raidIndex);
    const afterRaid = remaining.substring(raidIndex + raidCodeMatch.length);
    
    // Verificar si hay un prefijo M seguido de número (ej: M20)
    const prefixMatch = beforeRaid.match(/M(\d+)$/i);
    if (prefixMatch) {
      // Es un formato como M20RLTOC25N
      raid = raidCodeMatch as RaidCode;
      
      // Buscar la dificultad después del código de raid
      const diffMatch = afterRaid.match(/^(\d{1,2})([NH])/);
      if (diffMatch) {
        difficulty = `${diffMatch[1]}${diffMatch[2]}` as DifficultyCode;
        remaining = afterRaid.substring(diffMatch[0].length).trim();
      }
    } else {
      // Formato estándar: raid + número + N/H
      const raidMatch = remaining.substring(raidIndex).match(new RegExp(`^(${raidCodeMatch})(\\d{1,2})([NH])`, 'i'));
      if (raidMatch) {
        raid = raidMatch[1].toUpperCase() as RaidCode;
        difficulty = `${raidMatch[2]}${raidMatch[3].toUpperCase()}` as DifficultyCode;
        remaining = remaining.substring(raidIndex + raidMatch[0].length).trim();
      } else {
        // Formato con espacio: raid + espacio + número + N/H
        const spaceMatch = remaining.substring(raidIndex).match(new RegExp(`^(${raidCodeMatch})\\s*(\\d{1,2})([NH])`, 'i'));
        if (spaceMatch) {
          raid = spaceMatch[1].toUpperCase() as RaidCode;
          difficulty = `${spaceMatch[2]}${spaceMatch[3].toUpperCase()}` as DifficultyCode;
          remaining = remaining.substring(raidIndex + spaceMatch[0].length).trim();
        } else {
          // Si no coincide con ningún formato, usar el código de raid y buscar dificultad por separado
          raid = raidCodeMatch as RaidCode;
          remaining = remaining.substring(raidIndex + raidCodeMatch.length).trim();
          
          // Buscar dificultad como número seguido de N/H
          const diffMatch = remaining.match(/^(\d{1,2})([NH])/i);
          if (diffMatch) {
            difficulty = `${diffMatch[1]}${diffMatch[2].toUpperCase()}` as DifficultyCode;
            remaining = remaining.substring(diffMatch[0].length).trim();
          }
        }
      }
    }
  }
  
  // Si aún no tenemos raid, intentar el formato antiguo como respaldo
  if (!raid) {
    const raidMatch = remaining.match(new RegExp(`^(${RAID_CODES.join('|')})(\\d{1,2}[NH])`, 'i'));
    if (raidMatch) {
      raid = raidMatch[1].toUpperCase() as RaidCode;
      difficulty = raidMatch[2].toUpperCase() as DifficultyCode;
      remaining = remaining.substring(raidMatch[0].length).trim();
    }
  }
  
  // 5. Validar que tengamos raid y dificultad (únicos campos obligatorios)
  if (!raid || !difficulty) {
    return null; // No devolver evento si falta raid o dificultad
  }
  
  // 6. Validar valores de raid y dificultad
  const validRaid: RaidCode | null = RAID_CODES.includes(raid as RaidCode) ? raid as RaidCode : null;
  const validDifficulty: DifficultyCode | null = DIFFICULTY_CODES.includes(difficulty as DifficultyCode) 
    ? difficulty as DifficultyCode 
    : null;
    
  // 7. Si no hay raid o dificultad válida, no devolver evento
  if (!validRaid || !validDifficulty) {
    return null;
  }
    
  return {
    days,
    time,
    raid: validRaid, 
    difficulty: validDifficulty, 
    isRaidLeader,
    isLookingForGroup: !isRaidLeader,
    dayRange: days.length > 0 ? `${days[0]}${days.length > 1 ? `-${days[days.length-1]}` : ''}` : 'L-V'
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

  // Inicializar el array de bloques
  const blocks: NoteBlock[] = [];
  
  const result: PublicNoteValidation = { 
    isValid: false,
    blocks: blocks,
    raids: [],
    isRaidLeader: false,
    hasSchedule: false,
    hasRaids: false,
    schedules: [],
    publicNote: note,
    officerNote: officerNote,
    missingFields: []
  };

  if (!combinedNote) {
    return { ...result, error: 'La nota pública y del oficial están vacías' };
  }
  
  // Dividir la nota en bloques separados por espacios
  const noteBlocks = combinedNote.split(/\s+/).filter(Boolean);
  
  // Procesar cada bloque individualmente
  for (const block of noteBlocks) {
    // Primero intentar parsear como bloque de personaje
    const charBlock = parseCharacterBlock(block);
    if (charBlock) {
      blocks.push({
        type: 'character',
        content: block,
        isValid: true,
        parsedData: charBlock
      });
      continue;
    }
    
    // Luego intentar parsear como bloque de evento
    const eventBlock = parseEventBlock(block);
    if (eventBlock) {
      blocks.push({
        type: 'event',
        content: block,
        isValid: true,
        parsedData: eventBlock
      });
      continue;
    }
    
    // Si no es ninguno de los dos, marcarlo como inválido
    blocks.push({
      type: 'unknown',
      content: block,
      isValid: false,
      error: 'Formato no reconocido'
    });
  }
  // Actualizar el estado de validación basado en los bloques
  result.isValid = blocks.every(block => block.isValid);
  result.isRaidLeader = blocks.some(block => block.type === 'event' && block.parsedData?.isRaidLeader);
  result.hasSchedule = blocks.some(block => block.type === 'event');
  result.hasRaids = blocks.some(block => block.type === 'event' && block.parsedData?.raid);
  
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
      }
    } else {
      // Intentar parsear como bloque de evento
      const eventBlock = parseEventBlock(block);
      if (eventBlock) {
        // Agregar al log de estructura con todas las propiedades requeridas
        logStructure.blocks.push({
          type: 'event',
          content: block,
          data: {
            days: eventBlock.days,
            time: eventBlock.time,
            raid: eventBlock.raid,
            difficulty: eventBlock.difficulty,
            isRaidLeader: eventBlock.isRaidLeader,
            isLookingForGroup: eventBlock.isLookingForGroup,
            dayRange: eventBlock.dayRange
          } as EventBlock
        });
      }
    }
  }

  // Extraer información de personaje del primer bloque de personaje
  const characterBlock = blocks.find(b => b.type === 'character' && b.parsedData);
  if (characterBlock) {
    const data = characterBlock.parsedData as CharacterBlock;
    result.mainAlt = data.mainAlt;
    result.role = data.mainRole;
    result.dualRole = data.dualRole;
    result.gearScore = data.mainGearScore;
    result.dualGearScore = data.dualGearScore;
    result.professions = data.professions;
  }

  // Extraer información de eventos
  const eventBlocks = blocks.filter(b => b.type === 'event' && b.parsedData) as Array<NoteBlock & { parsedData: EventBlock }>;
  
  // Actualizar información de raids y horarios
  result.schedules = [];
  result.raids = [];
  
  for (const block of eventBlocks) {
    const event = block.parsedData;
    
    // Agregar a horarios
    if (event.days && event.time) {
      result.schedules!.push({
        days: event.dayRange || event.days.join(''),
        time: event.time,
        isRaidLeader: event.isRaidLeader
      });
    }
    
    // Agregar a raids
    if (event.raid && event.difficulty) {
      // Asegurarse de que raid sea un RaidCode válido
      const raidCode = RAID_CODES.includes(event.raid as RaidCode) ? event.raid as RaidCode : 'ICC';
      const raidName = RAID_NAMES[raidCode] || raidCode;
      
      // Asegurarse de que difficulty sea un DifficultyCode válido
      const difficultyCode = DIFFICULTY_CODES.includes(event.difficulty as DifficultyCode) 
        ? event.difficulty as DifficultyCode 
        : '25N';
      const difficultyName = DIFFICULTY_NAMES[difficultyCode] || difficultyCode;
      
      result.raids!.push({
        code: raidCode,
        difficulty: difficultyName,
        name: raidName,
        difficultyCode: difficultyCode,
        isRaidLeader: event.isRaidLeader,
        days: event.days,
        dayRange: event.dayRange,
        time: event.time
      });
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

  // Actualizar contadores (ya se actualizaron anteriormente)
  result.hasSchedule = (result.schedules?.length ?? 0) > 0;

  // Mostrar log compacto de la estructura
  if (logStructure.blocks.length > 0) {
    logStructure.blocks.forEach((block, index) => {
      if (block.type === 'character' && block.data) {
        const charData = block.data as CharacterBlock;
        const roles = [
          `[${charData.mainAlt === 'M' ? 'Main' : 'Alt'}] ${charData.mainRole} ${charData.mainGearScore}`,
          charData.dualRole && `+ ${charData.dualRole} ${charData.dualGearScore || ''}`,
          charData.professions?.length > 0 && `Prof: ${charData.professions.join(', ')}`
        ].filter(Boolean).join(' | ');
        
      } else if (block.type === 'event' && block.data) {
        const eventData = block.data as EventBlock;
        const eventInfo = [
          eventData.days?.join('') && `Días: ${eventData.days.join('')}`,
          eventData.time && `Hora: ${eventData.time}`,
          eventData.raid && `Raid: ${eventData.raid}${eventData.difficulty ? ' ' + eventData.difficulty : ''}`,
          eventData.isRaidLeader && '[RL]'
        ].filter(Boolean).join(' | ');
        
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
