import { rosterService } from '../services/rosterService';
import { supabase } from '../lib/supabase';

// Configuración de la zona horaria de la hermandad (ajustar según corresponda)
// Usamos Europe/London para coincidir con la hora del servidor (UTC+0 / UTC+1)
// Anteriormente Europe/Madrid (UTC+1 / UTC+2)
export const GUILD_TIMEZONE = 'Europe/London';

interface RaidSchedule {
  raid_name: string;
  day_of_week: string;
  start_time: string;
  leader: string;
}

// Mapa de días para normalización
const DAY_MAP: Record<string, string> = {
  'lunes': 'lunes',
  'martes': 'martes',
  'miercoles': 'miercoles',
  'miércoles': 'miercoles',
  'jueves': 'jueves',
  'viernes': 'viernes',
  'sabado': 'sabado',
  'sábado': 'sabado',
  'domingo': 'domingo'
};

/**
 * Obtiene la hora actual en la zona horaria de la hermandad
 */
export function getGuildTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: GUILD_TIMEZONE }));
}

/**
 * Obtiene todos los horarios de raid consultando Supabase dinámicamente
 */
export async function getAllRaidSchedules(): Promise<RaidSchedule[]> {
  const schedules: RaidSchedule[] = [];
  const seenSchedules = new Set<string>();

  const rosterData = await rosterService.getFormattedRoster();
  if (!rosterData || !rosterData.players) return [];

  Object.entries(rosterData.players).forEach(([playerName, member]: [string, any]) => {
    const leaderData = member.leaderData;
    if (!leaderData || !leaderData.cores || !Array.isArray(leaderData.cores)) return;

    leaderData.cores.forEach((core: any) => {
      if (!core.raid || !core.schedule) return;

      // Normalizar hora
      let normalizedTime = "";
      const timeMatch = String(core.schedule).match(/(\d{1,2}:\d{2})/);
      if (timeMatch) normalizedTime = timeMatch[1].padStart(5, '0');
      else return; // Si no hay hora, no nos sirve para notificaciones

      // Normalizar día
      let normalizedDay = "";
      const dayMatch = String(core.schedule).toLowerCase().match(/(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)/);
      if (dayMatch) {
        const rawDay = dayMatch[1].toLowerCase();
        normalizedDay = DAY_MAP[rawDay] || rawDay;
      } else return; // Si no hay día, no nos sirve

      // Clave única para evitar duplicados si varios miembros tienen el mismo core listado
      // Usamos raid + dia + hora + lider (para distinguir diferentes grupos)
      const key = `${core.raid}-${normalizedDay}-${normalizedTime}-${playerName}`;

      if (!seenSchedules.has(key)) {
        seenSchedules.add(key);
        schedules.push({
          raid_name: core.raid,
          day_of_week: normalizedDay,
          start_time: normalizedTime,
          leader: playerName
        });
      }
    });
  });

  return schedules;
}

/**
 * Busca la próxima raid más cercana a partir de la hora actual
 * Opcionalmente busca raids dentro de una ventana de tiempo específica
 * @param minutesAhead Minutos a futuro para buscar (ej: 30) - Si es null, busca la más cercana sin límite
 * @param windowMinutes Ventana de tolerancia en minutos (ej: 5)
 */
export async function getUpcomingRaids(minutesAhead: number | null = 30, windowMinutes: number = 5): Promise<RaidSchedule[]> {
  const now = getGuildTime();
  const allSchedules = await getAllRaidSchedules();

  if (minutesAhead === null) {
    // Buscar la raid futura más cercana
    // 1. Convertir todo a fechas comparables
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const todayIndex = now.getDay();

    let nearestDiff = Infinity;
    let nearestRaids: RaidSchedule[] = [];

    allSchedules.forEach(schedule => {
      // Calcular fecha de la raid
      const schedDayIndex = days.indexOf(schedule.day_of_week);
      if (schedDayIndex === -1) return;

      const [h, m] = schedule.start_time.split(':').map(Number);

      // Si la hora es 00:00, la tratamos como el final del día (minuto 1440)
      const schedTimeMinutes = (h === 0 && m === 0) ? 24 * 60 : h * 60 + m;

      let dayDiff = schedDayIndex - todayIndex;
      if (dayDiff < 0) dayDiff += 7; // Es en la próxima semana

      // Si es hoy pero la hora ya pasó, es la próxima semana
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      if (dayDiff === 0 && schedTimeMinutes < nowMinutes) {
        dayDiff = 7;
      }

      // Diferencia total en minutos
      const totalDiffMinutes = (dayDiff * 24 * 60) + (schedTimeMinutes - nowMinutes);

      if (totalDiffMinutes < nearestDiff) {
        nearestDiff = totalDiffMinutes;
        nearestRaids = [schedule];
      } else if (totalDiffMinutes === nearestDiff) {
        nearestRaids.push(schedule);
      }
    });

    return nearestRaids;
  }

  // Comportamiento original: ventana de tiempo fija
  const targetTime = new Date(now.getTime() + minutesAhead * 60000);

  // Obtener día de la semana y hora objetivo en formato compatible
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const targetDay = days[targetTime.getDay()];

  const targetHour = targetTime.getHours();
  const targetMinute = targetTime.getMinutes();

  // Convertir hora objetivo a minutos desde medianoche para comparación fácil
  const targetTimeMinutes = targetHour * 60 + targetMinute;
  const windowStart = targetTimeMinutes - windowMinutes;
  const windowEnd = targetTimeMinutes + windowMinutes;

  return allSchedules.filter(schedule => {
    // Para raids a las 00:00, tratarlas como el final del día (técnicamente el inicio del día siguiente)
    // Pero si el calendario dice "Jueves 00:00", el aviso debe dispararse cuando el targetTime es Viernes 00:00.
    const [h, m] = schedule.start_time.split(':').map(Number);
    const scheduleTimeMinutes = h * 60 + m;

    // No aplicamos desplazamiento para 00:00, respetamos el día programado
    let effectiveDay = schedule.day_of_week;

    // 1. Coincidir día efectivo
    if (effectiveDay !== targetDay) return false;

    // 2. Coincidir hora dentro de la ventana
    // Si h=0, ya sabemos que coincide con el inicio del día efectivo (targetDay)
    return scheduleTimeMinutes >= windowStart && scheduleTimeMinutes <= windowEnd;
  });
}

const CLASS_MAP_EN_TO_ES: Record<string, string> = {
  PALADIN: 'Paladín',
  PRIEST: 'Sacerdote',
  SHAMAN: 'Chamán',
  DEATHKNIGHT: 'Caballero de la Muerte',
  DRUID: 'Druida',
  WARRIOR: 'Guerrero',
  MAGE: 'Mago',
  WARLOCK: 'Brujo',
  HUNTER: 'Cazador',
  ROGUE: 'Pícaro'
};

const CLASS_MAP_ES_TO_EN: Record<string, string> = {
  'PALADIN': 'PALADIN',
  'PALADÍN': 'PALADIN',
  'PALADINN': 'PALADIN',
  'SACERDOTE': 'PRIEST',
  'CHAMÁN': 'SHAMAN',
  'CHAMAN': 'SHAMAN',
  'CABALLERO DE LA MUERTE': 'DEATHKNIGHT',
  'DRUIDA': 'DRUID',
  'GUERRERO': 'WARRIOR',
  'MAGO': 'MAGE',
  'BRUJO': 'WARLOCK',
  'CAZADOR': 'HUNTER',
  'PÍCARO': 'ROGUE',
  'PICARO': 'ROGUE'
};

function toClassKey(enOrEs?: string): string | undefined {
  if (!enOrEs) return undefined;
  const raw = enOrEs.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (CLASS_MAP_EN_TO_ES[raw]) return raw; // already EN
  if (CLASS_MAP_ES_TO_EN[raw]) return CLASS_MAP_ES_TO_EN[raw];
  return undefined;
}

function normRole(role?: string): 'tank' | 'healer' | 'melee' | 'ranged' | undefined {
  const r = (role || '').toLowerCase().trim();
  if (!r) return undefined;
  // Inglés
  if (r.includes('tank')) return 'tank';
  if (r.includes('heal')) return 'healer';
  if (r.includes('melee') || r === 'mdps' || r.includes('m-dps')) return 'melee';
  if (r.includes('range') || r === 'rdps' || r.includes('r-dps')) return 'ranged';
  // Español
  if (r.includes('tanq') || r.includes('tanque')) return 'tank';
  if (r.includes('sana') || r.includes('sanador') || r.includes('sanadores')) return 'healer';
  if (r.includes('cuerpo')) return 'melee';
  if (r.includes('distancia')) return 'ranged';
  return undefined;
}

function roleFallbackByClass(enOrEs?: string): 'melee' | 'ranged' | undefined {
  const c = toClassKey(enOrEs);
  // Claramente melee
  if (!c) return undefined;
  if (['DEATHKNIGHT', 'WARRIOR', 'PALADIN', 'ROGUE'].includes(c)) return 'melee';
  // Claramente ranged
  if (['HUNTER', 'MAGE', 'WARLOCK', 'PRIEST'].includes(c)) return 'ranged';
  // Ambiguos (DRUID/SHAMAN) sin subrol: por defecto ranged
  if (['DRUID', 'SHAMAN'].includes(c)) return 'ranged';
  return undefined;
}

function normDay(text: string): string | null {
  const m = String(text).toLowerCase().match(/(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)/);
  if (!m) return null;
  const raw = m[1].toLowerCase();
  return DAY_MAP[raw] || raw;
}

function normTime(text: string): string | null {
  const m = String(text).match(/(\d{1,2}:\d{2})/);
  if (!m) return null;
  return m[1].padStart(5, '0');
}

function toEsClass(enOrEs?: string): string | undefined {
  if (!enOrEs) return undefined;
  const key = toClassKey(enOrEs);
  if (key && CLASS_MAP_EN_TO_ES[key]) return CLASS_MAP_EN_TO_ES[key];
  return enOrEs;
}

export async function getRaidRosterForSchedule(schedule: RaidSchedule): Promise<{
  leaderClass?: string;
  tank: Array<{ name: string; class?: string }>;
  healer: Array<{ name: string; class?: string }>;
  melee: Array<{ name: string; class?: string }>;
  ranged: Array<{ name: string; class?: string }>;
}> {
  const rosterData = await rosterService.getFormattedRoster();
  const leader = schedule.leader;
  const leaderNode: any = (rosterData as any)?.players?.[leader];
  const leaderClass = leaderNode?.class;
  const cores: any[] = leaderNode?.leaderData?.cores || [];
  const targetDay = schedule.day_of_week;
  const targetTime = schedule.start_time;
  const targetRaid = schedule.raid_name;

  let members: any[] = [];
  for (const core of cores) {
    const cDay = normDay(core.schedule || '');
    const cTime = normTime(core.schedule || '');
    if (!cDay || !cTime) continue;
    if (core.raid === targetRaid && cDay === targetDay && cTime === targetTime) {
      members = Array.isArray(core.members) ? core.members : [];
      break;
    }
  }

  const result = {
    tank: [] as Array<{ name: string; class?: string }>,
    healer: [] as Array<{ name: string; class?: string }>,
    melee: [] as Array<{ name: string; class?: string }>,
    ranged: [] as Array<{ name: string; class?: string }>,
    leaderClass: leaderClass as string | undefined
  };

  for (const m of members) {
    const name: string = m.name;
    const rosterEntry: any = (rosterData as any)?.players?.[name];

    // Si existe en roster, chequear guildLeave
    if (rosterEntry && rosterEntry.guildLeave === true) continue;

    // Si no existe en roster, lo incluimos igual (para ser fiel a raids)

    const memberClass = m.class && m.class.length ? toEsClass(m.class) : rosterEntry?.class;
    let role = normRole(m.role);
    if (!role) {
      const fallback = roleFallbackByClass(m.class || rosterEntry?.class);
      role = fallback || 'ranged';
    }
    if (role === 'tank') result.tank.push({ name, class: memberClass });
    else if (role === 'healer') result.healer.push({ name, class: memberClass });
    else if (role === 'melee') result.melee.push({ name, class: memberClass });
    else result.ranged.push({ name, class: memberClass });
  }

  return result;
}

export async function getRaidRosterForScheduleWithExternal(schedule: RaidSchedule): Promise<{
  leaderClass?: string;
  tank: Array<{ name: string; class?: string }>;
  healer: Array<{ name: string; class?: string }>;
  melee: Array<{ name: string; class?: string }>;
  ranged: Array<{ name: string; class?: string }>;
  sanctioned: Array<{ name: string; class?: string }>;
}> {
  const rosterData = await rosterService.getFormattedRoster();

  const result = {
    tank: [] as Array<{ name: string; class?: string }>,
    healer: [] as Array<{ name: string; class?: string }>,
    melee: [] as Array<{ name: string; class?: string }>,
    ranged: [] as Array<{ name: string; class?: string }>,
    sanctioned: [] as Array<{ name: string; class?: string }>,
    leaderClass: undefined as string | undefined
  };

  const seen = new Set<string>();

  // Función para verificar si un jugador está sancionado en CUALQUIER parte del roster
  const isGlobalSanctioned = (playerName: string): boolean => {
    if (!rosterData || !rosterData.players) return false;

    const lowerName = playerName.toLowerCase().trim();

    // 1. Verificar isSanctioned o guildLeave en su propia ficha
    const selfData = (rosterData as any).players[playerName] ||
      Object.entries((rosterData as any).players).find(([k]) => k.toLowerCase().trim() === lowerName)?.[1];

    if (selfData && (selfData.isSanctioned === 1 || selfData.guildLeave === true)) return true;

    // 2. Recorrer todos los líderes para ver sus cores y miembros buscando isSanctioned: 1
    return Object.values((rosterData as any).players).some((player: any) => {
      const cores = player.leaderData?.cores;
      if (!cores || !Array.isArray(cores)) return false;

      return cores.some((core: any) => {
        if (!core.members || !Array.isArray(core.members)) return false;
        return core.members.some((m: any) =>
          m.name?.toLowerCase().trim() === lowerName && m.isSanctioned === 1
        );
      });
    });
  };

  // 1. Obtener datos de Supabase (idéntico a raids.astro)
  let supabasePlayers: any[] = [];
  try {
    const { data, error } = await supabase
      .from('raid_registrations')
      .select('*')
      .in('status', ['aceptado', 'en_revision', 'en_espera']);

    if (!error && data) {
      const targetRaidId = schedule.raid_name.toUpperCase().trim();
      const targetTime = schedule.start_time;

      supabasePlayers = data.filter(reg => {
        const regRaidId = (reg.raid_id || '').toUpperCase().trim();
        const regTime = (reg.start_time || '').toString().padStart(5, '0').substring(0, 5);
        const regDay = (reg.day_of_week || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        return (regRaidId === targetRaidId || regRaidId.includes(targetRaidId) || targetRaidId.includes(regRaidId)) &&
          regTime === targetTime &&
          regDay === schedule.day_of_week;
      });
    }
  } catch (e) {
    console.error('Error fetching from Supabase:', e);
  }

  // 2. Procesar Roster (Official Cores)
  if (rosterData && rosterData.players) {
    Object.entries(rosterData.players).forEach(([playerName, member]: [string, any]) => {
      const leaderData = member.leaderData;
      if (!leaderData || !leaderData.cores || !Array.isArray(leaderData.cores)) return;

      leaderData.cores.forEach((core: any) => {
        if (!core.raid || !core.schedule) return;

        // Normalizar horario del core
        let normalizedTime = "Sin hora";
        let normalizedDay = "Sin día";
        const timeMatch = String(core.schedule).match(/(\d{1,2}:\d{2})/);
        if (timeMatch) normalizedTime = timeMatch[1].padStart(5, '0');
        const dayMatch = String(core.schedule).toLowerCase().match(/(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)/);
        if (dayMatch) {
          normalizedDay = dayMatch[1]
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace('miércoles', 'miercoles')
            .replace('sábado', 'sabado');
        }

        // Verificar si este core coincide con la raid actual
        const cRaid = (core.raid || '').toUpperCase().trim();
        const tRaid = schedule.raid_name.toUpperCase().trim();
        const raidMatch = cRaid === tRaid || cRaid.includes(tRaid) || tRaid.includes(cRaid);

        if (raidMatch && normalizedDay === schedule.day_of_week && normalizedTime === schedule.start_time) {
          // Es el core correcto. Añadir al líder.
          if (!seen.has(playerName.toLowerCase())) {
            const sanctioned = isGlobalSanctioned(playerName);
            addPlayerToResult(playerName, member.class, 'DPS', result, seen, sanctioned);
            if (playerName.toLowerCase() === schedule.leader.toLowerCase()) {
              result.leaderClass = member.class;
            }
          }

          // Añadir a los miembros del core
          if (core.members && Array.isArray(core.members)) {
            core.members.forEach((m: any) => {
              if (!m.name || seen.has(m.name.toLowerCase())) return;
              const mRoster: any = (rosterData as any).players[m.name];
              const sanctioned = m.isSanctioned === 1 || isGlobalSanctioned(m.name);
              addPlayerToResult(m.name, m.class || mRoster?.class, m.role, result, seen, sanctioned);
            });
          }
        }
      });
    });
  }

  // 3. Añadir jugadores de Supabase que no estaban en el core
  supabasePlayers.forEach(reg => {
    const name = (reg.player_name || '').trim();
    if (!name || seen.has(name.toLowerCase())) return;

    // Buscar en el roster con trim para evitar problemas de espacios
    const mRosterKey = Object.keys(rosterData.players).find(k => k.trim().toLowerCase() === name.toLowerCase());
    const mRoster: any = mRosterKey ? (rosterData as any).players[mRosterKey] : null;

    const sanctioned = isGlobalSanctioned(name);
    addPlayerToResult(name, reg.player_class || mRoster?.class, reg.player_role, result, seen, sanctioned);
  });

  return result;
}

function addPlayerToResult(name: string, pClass: string, pRole: string, result: any, seen: Set<string>, sanctioned: boolean = false) {
  const normalizedClass = toEsClass(pClass);

  if (sanctioned) {
    result.sanctioned.push({ name, class: normalizedClass });
    seen.add(name.toLowerCase());
    return;
  }

  let role = normRole(pRole);
  if (!role) {
    role = roleFallbackByClass(pClass) || 'ranged';
  }

  if (role === 'tank') result.tank.push({ name, class: normalizedClass });
  else if (role === 'healer') result.healer.push({ name, class: normalizedClass });
  else if (role === 'melee') result.melee.push({ name, class: normalizedClass });
  else result.ranged.push({ name, class: normalizedClass });

  seen.add(name.toLowerCase());
}
