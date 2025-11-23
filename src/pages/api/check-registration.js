import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert time string to minutes since midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if two times are within 3 hours of each other
function isWithinThreeHours(time1, time2) {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  const diff = Math.abs(minutes1 - minutes2);
  return diff <= 180; // 3 hours in minutes
}

export async function post({ request }) {
  try {
    const { player_name, day_of_week, start_time } = await request.json();
    
    // Validate required fields
    if (!player_name || !day_of_week || !start_time) {
      return new Response(
        JSON.stringify({ 
          error: 'Faltan campos requeridos',
          details: { player_name, day_of_week, start_time }
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Get all registrations for this player on the same day
    const { data: existingRegistrations, error } = await supabase
      .from('raid_registrations')
      .select('*')
      .eq('player_name', player_name)
      .eq('day_of_week', day_of_week)
      .in('status', ['en_revision', 'aceptado']); // Only check active registrations

    if (error) {
      console.error('Database error:', error);
      throw new Error('Error al consultar las inscripciones existentes');
    }

    // 2. Check if any existing registration is within 3 hours of the new time
    const conflictingRegistration = existingRegistrations.find(reg => 
      isWithinThreeHours(reg.start_time, start_time)
    );

    if (conflictingRegistration) {
      return new Response(
        JSON.stringify({
          exists: true,
          message: 'Ya tienes una inscripción en un horario cercano',
          existing: {
            raid_name: conflictingRegistration.raid_name,
            day_of_week: conflictingRegistration.day_of_week,
            start_time: conflictingRegistration.start_time,
            status: conflictingRegistration.status,
            created_at: conflictingRegistration.created_at
          }
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. No conflicting registrations found
    return new Response(
      JSON.stringify({
        exists: false,
        message: 'No hay conflictos de horario',
        canRegister: true
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in check-registration:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al verificar la inscripción',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
