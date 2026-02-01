import { createClient } from '@supabase/supabase-js';
import rosterData from '../data/roster.json';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Falta la configuración de Supabase');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RosterCharacter {
  name: string;
  class: string;
  rank: string;
  publicNote: string;
  officerNote: string;
}

// Extraer los personajes del roster desde la estructura real del JSON
// El archivo `roster.json` tiene la forma:
// { "globalLastUpdate": number, "players": { "<name>": { ...RosterCharacter } } }
function getRosterCharacters(): RosterCharacter[] {
  const anyRoster = rosterData as any;
  const players = anyRoster && anyRoster.players ? anyRoster.players : {};
  return Object.values(players) as RosterCharacter[];
}

interface VoteData {
  id: string;
  character_name: string;
  ip_address: string;
  voted_at: string;
}

interface MonthlyVoteStats {
  monthKey: string;
  monthLabel: string;
  stats: Array<{
    character: string;
    count: number;
  }>;
}

// Get client IP address (works in both development and production)
function getClientIp(request: Request): string | null {
  try {
    const headers = request.headers;

    // Headers comunes que contienen la IP real del cliente
    const possibleIpHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'fastly-client-ip', // Fastly
      'true-client-ip', // Akamai
      'x-cluster-client-ip', // Rackspace
      'x-forwarded',
      'forwarded-for',
      'x-http-forwarded-for',
    ];

    // Buscar la IP en los encabezados
    for (const header of possibleIpHeaders) {
      const ip = headers.get(header);
      if (ip) {
        // Tomar la primera IP si hay múltiples (puede haber proxies)
        const firstIp = ip.split(',')[0].trim();
        if (firstIp) {
          // Validar que sea una dirección IP válida
          if (
            /^(?:\d{1,3}\.){3}\d{1,3}$/.test(firstIp) || // IPv4
            /^[0-9a-fA-F:]+$/.test(firstIp)
          ) {
            // IPv6
            return firstIp;
          }
        }
      }
    }

    // En desarrollo local, usar una IP de marcador de posición
    if (import.meta.env.DEV) {
      console.warn('No se pudo determinar la IP real, usando IP de desarrollo local');
      return '127.0.0.1';
    }

    console.warn('No se pudo determinar la IP del cliente');
    return null;
  } catch (error) {
    console.error('Error al obtener la IP del cliente:', error);
    return null;
  }
}

// Check if a character exists in the roster
export function isCharacterInRoster(characterName: string): boolean {
  const characters = getRosterCharacters();
  return characters.some(
    (char: RosterCharacter) => char.name.toLowerCase() === characterName.toLowerCase()
  );
}

// Check if an IP has voted for a character recently (within 24 hours)
export async function canIpVote(
  characterName: string,
  ipAddress: string
): Promise<{ canVote: boolean; lastVotedAt?: string }> {
  const { data, error } = await supabase
    .from('votes')
    .select('voted_at')
    .ilike('character_name', characterName)
    .eq('ip_address', ipAddress)
    .order('voted_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return { canVote: true };
  }

  const lastVoted = new Date(data[0].voted_at);
  const now = new Date();
  const hoursSinceLastVote = (now.getTime() - lastVoted.getTime()) / (1000 * 60 * 60);

  return {
    canVote: hoursSinceLastVote >= 24,
    lastVotedAt: data[0].voted_at,
  };
}

// Record a vote for a character
export async function recordVote(
  characterName: string,
  request: Request
): Promise<{ success: boolean; error?: string; data?: any }> {
  console.log('Iniciando registro de voto para:', characterName);

  // Verificar configuración de Supabase
  if (!supabaseUrl || !supabaseKey) {
    const errorMsg = 'Error: Falta la configuración de Supabase';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const ipAddress = getClientIp(request);
  console.log('Dirección IP detectada:', ipAddress);

  if (!ipAddress) {
    const errorMsg = 'No se pudo obtener la dirección IP';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  // Verificar si el personaje existe en el roster
  const characterExists = isCharacterInRoster(characterName);
  console.log('¿Personaje existe en el roster?', characterExists);

  if (!characterExists) {
    const errorMsg = 'El personaje no existe en la hermandad';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  // Verificar si la IP ya votó por este personaje recientemente
  console.log('Verificando si la IP puede votar...');
  const { canVote, lastVotedAt } = await canIpVote(characterName, ipAddress);
  console.log('¿Puede votar?', canVote, 'Último voto:', lastVotedAt);

  if (!canVote && lastVotedAt) {
    const nextVoteTime = new Date(lastVotedAt);
    nextVoteTime.setHours(nextVoteTime.getHours() + 24);
    const hoursLeft = Math.ceil((nextVoteTime.getTime() - new Date().getTime()) / (1000 * 60 * 60));
    const errorMsg = `Ya has votado por este personaje. Podrás votar de nuevo en ${hoursLeft} horas.`;
    console.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }

  try {
    console.log('Intentando registrar voto para:', characterName, 'desde IP:', ipAddress);

    // Usar el cliente de Supabase directamente
    const { data, error } = await supabase
      .from('votes')
      .insert([
        {
          character_name: characterName,
          ip_address: ipAddress,
          voted_at: new Date().toISOString(),
        },
      ])
      .select();

    console.log('Respuesta de Supabase:', { data, error });

    if (error) {
      console.error('Error al insertar voto en Supabase:', error);
      throw new Error(error.message || 'Error al registrar el voto');
    }

    if (!data || data.length === 0) {
      throw new Error('No se recibieron datos de confirmación del servidor');
    }

    return {
      success: true,
      data: data[0],
    };
  } catch (error: any) {
    console.error('Error al registrar voto:', error);
    return {
      success: false,
      error: error.message || 'Error al procesar el voto. Por favor, inténtalo de nuevo.',
    };
  }
}

// Get vote statistics
export async function getVoteStats(): Promise<{
  success: boolean;
  data?: MonthlyVoteStats[];
  error?: string;
}> {
  try {
    console.log('Conectando a Supabase...');
    console.log('URL de Supabase:', supabaseUrl ? 'Configurada' : 'No configurada');

    if (!supabaseUrl || !supabaseKey) {
      const errorMsg = 'Error: Faltan las variables de entorno de Supabase';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('Obteniendo estadísticas de votos...');
    const { data, error } = await supabase
      .from('votes')
      .select('character_name, voted_at')
      .order('voted_at', { ascending: false });

    if (error) {
      console.error('Error de Supabase al obtener estadísticas:', error);
      return {
        success: false,
        error: `Error de base de datos: ${error.message || 'Error desconocido'}`,
      };
    }

    console.log(`Se obtuvieron ${data?.length || 0} votos`);

    // Si no hay datos, devolver un array vacío
    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }

    // Función auxiliar para normalizar y canonizar nombres de personajes
    const getCanonicalCharacterName = (rawName: string): string => {
      const cleaned = rawName.trim();

      // Intentar encontrar el nombre exacto en el roster (respetando mayúsculas reales)
      const fromRoster = getRosterCharacters().find(
        (char) => char.name.toLowerCase() === cleaned.toLowerCase()
      );

      if (fromRoster) {
        return fromRoster.name;
      }

      // Fallback: capitalizar de forma básica
      if (!cleaned) return cleaned;
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    };

    // Agrupar votos por mes y por personaje (normalizando nombres)
    const monthlyAggregation = data.reduce(
      (acc, vote) => {
        if (!vote.character_name || !vote.voted_at) return acc;

        const voteDate = new Date(vote.voted_at);
        if (isNaN(voteDate.getTime())) return acc;

        const year = voteDate.getFullYear();
        const month = voteDate.getMonth() + 1; // 0-indexed
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;

        if (!acc[monthKey]) {
          const monthLabel = new Intl.DateTimeFormat('es-ES', {
            month: 'long',
            year: 'numeric',
          }).format(voteDate);

          acc[monthKey] = {
            monthKey,
            monthLabel,
            characters: {} as Record<string, { character: string; count: number }>,
          };
        }

        const canonicalName = getCanonicalCharacterName(vote.character_name);
        const charKey = canonicalName.toLowerCase();

        if (!acc[monthKey].characters[charKey]) {
          acc[monthKey].characters[charKey] = {
            character: canonicalName,
            count: 0,
          };
        }

        acc[monthKey].characters[charKey].count += 1;

        return acc;
      },
      {} as Record<
        string,
        {
          monthKey: string;
          monthLabel: string;
          characters: Record<string, { character: string; count: number }>;
        }
      >
    );

    // Convertir a array ordenado por mes (más reciente primero) y personajes por votos
    const result: MonthlyVoteStats[] = Object.values(monthlyAggregation)
      .sort((a, b) => (a.monthKey < b.monthKey ? 1 : a.monthKey > b.monthKey ? -1 : 0))
      .map(({ monthKey, monthLabel, characters }) => ({
        monthKey,
        monthLabel,
        stats: Object.values(characters).sort((a, b) => b.count - a.count),
      }));

    console.log('Estadísticas procesadas correctamente (por mes):', result);
    return { success: true, data: result };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error inesperado en getVoteStats:', err);
    // No lanzar excepción hacia arriba: devolvemos un estado seguro
    return {
      success: false,
      data: [],
      error: `Error inesperado: ${errorMessage}`,
    };
  }
}
