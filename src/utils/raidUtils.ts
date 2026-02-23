import rosterData from '../data/roster.json';

// Configuración de la zona horaria de la hermandad (ajustar según corresponda)
// Por defecto usamos America/Argentina/Buenos_Aires (UTC-3) común en comunidades latinas de WoW
export const GUILD_TIMEZONE = 'America/Argentina/Buenos_Aires';

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
 * Parsea los horarios de raid desde el roster.json
 */
export function getAllRaidSchedules(): RaidSchedule[] {
  const schedules: RaidSchedule[] = [];
  const seenSchedules = new Set<string>();

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
      // Pero roster.json suele agrupar por lider. Aquí 'playerName' es el lider.
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
 * Busca raids que comiencen dentro de un rango de minutos específico
 * @param minutesAhead Minutos a futuro para buscar (ej: 30)
 * @param windowMinutes Ventana de tolerancia en minutos (ej: 5)
 */
export function getUpcomingRaids(minutesAhead: number = 30, windowMinutes: number = 5): RaidSchedule[] {
  const now = getGuildTime();
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

  const allSchedules = getAllRaidSchedules();

  return allSchedules.filter(schedule => {
    // 1. Coincidir día
    if (schedule.day_of_week !== targetDay) return false;

    // 2. Coincidir hora dentro de la ventana
    const [h, m] = schedule.start_time.split(':').map(Number);
    const scheduleTimeMinutes = h * 60 + m;

    return scheduleTimeMinutes >= windowStart && scheduleTimeMinutes <= windowEnd;
  });
}
