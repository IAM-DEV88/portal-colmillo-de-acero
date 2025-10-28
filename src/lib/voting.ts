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

interface VoteData {
  id: string;
  character_name: string;
  ip_address: string;
  voted_at: string;
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
          if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(firstIp) || // IPv4
              /^[0-9a-fA-F:]+$/.test(firstIp)) { // IPv6
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
  return rosterData.some(
    (char: RosterCharacter) => char.name.toLowerCase() === characterName.toLowerCase()
  );
}

// Check if an IP has voted for a character recently (within 24 hours)
export async function canIpVote(characterName: string, ipAddress: string): Promise<{ canVote: boolean; lastVotedAt?: string }> {
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
    lastVotedAt: data[0].voted_at
  };
}

// Record a vote for a character
export async function recordVote(characterName: string, request: Request): Promise<{ success: boolean; error?: string; data?: any }> {
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
      error: errorMsg 
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
          voted_at: new Date().toISOString()
        }
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
      data: data[0]
    };
  } catch (error: any) {
    console.error('Error al registrar voto:', error);
    return { 
      success: false, 
      error: error.message || 'Error al procesar el voto. Por favor, inténtalo de nuevo.' 
    };
  }
}

// Get vote statistics
export async function getVoteStats(): Promise<{ success: boolean; data?: Array<{ character: string; count: number }>; error?: string }> {
  const { data, error } = await supabase
    .from('votes')
    .select('character_name, voted_at')
    .order('voted_at', { ascending: false });

  if (error) {
    console.error('Error fetching vote stats:', error);
    return { success: false, error: error.message };
  }

  try {
    // Group votes by character
    const votesByCharacter = data.reduce((acc, vote) => {
      if (!acc[vote.character_name]) {
        acc[vote.character_name] = 0;
      }
      acc[vote.character_name]++;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array of objects
    const result = Object.entries(votesByCharacter).map(([character, count]) => ({
      character,
      count
    }));

    return { success: true, data: result };
  } catch (err) {
    console.error('Error processing vote stats:', err);
    return { success: false, error: 'Error al procesar las estadísticas de votos' };
  }
}
