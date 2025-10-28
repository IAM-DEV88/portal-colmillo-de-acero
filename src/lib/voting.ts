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

// Get client IP address (works with Vercel and other platforms)
function getClientIp(request: Request): string | null {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',').shift() ||
    headers.get('x-real-ip') ||
    null
  );
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
  const ipAddress = getClientIp(request);
  if (!ipAddress) {
    return { success: false, error: 'No se pudo obtener la dirección IP' };
  }

  // Check if character exists in roster
  if (!isCharacterInRoster(characterName)) {
    return { success: false, error: 'El personaje no existe en la hermandad' };
  }

  // Check if IP has voted for this character recently
  const { canVote, lastVotedAt } = await canIpVote(characterName, ipAddress);
  if (!canVote && lastVotedAt) {
    const nextVoteTime = new Date(lastVotedAt);
    nextVoteTime.setHours(nextVoteTime.getHours() + 24);
    const hoursLeft = Math.ceil((nextVoteTime.getTime() - new Date().getTime()) / (1000 * 60 * 60));
    return { 
      success: false, 
      error: `Ya has votado por este personaje. Podrás votar de nuevo en ${hoursLeft} horas.` 
    };
  }

  try {
    console.log('Intentando registrar voto para:', characterName, 'desde IP:', ipAddress);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([
        { 
          character_name: characterName,
          ip_address: ipAddress,
          voted_at: new Date().toISOString()
        }
      ])
    });

    const data = await response.json();
    console.log('Respuesta de Supabase:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Error al registrar el voto');
    }
    
    return { 
      success: true,
      data
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
