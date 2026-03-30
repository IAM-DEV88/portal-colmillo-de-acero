import { supabase } from './supabase';

export class RouletteService {
  /**
   * Otorga créditos extra a un usuario basado en su IP.
   * @param ip IP del usuario
   * @param amount Cantidad de créditos a sumar
   * @returns El estado actualizado de la sesión
   */
  static async addCredits(ip: string, amount: number) {
    const sessionId = ip;

    // 1. Obtener o crear la sesión
    const { data: session, error: fetchError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('ip_hash', sessionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Error al obtener sesión: ${fetchError.message}`);
    }

    if (!session) {
      // Crear nueva sesión con los créditos base + extra
      const { data: newSession, error: createError } = await supabase
        .from('game_sessions')
        .insert([{
          ip_hash: sessionId,
          credits: 5 + amount,
          gold_pool: 100,
          last_active: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;
      return newSession;
    }

    // 2. Actualizar créditos existentes
    const { data: updatedSession, error: updateError } = await supabase
      .from('game_sessions')
      .update({
        credits: session.credits + amount,
        last_active: new Date().toISOString()
      })
      .eq('ip_hash', sessionId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedSession;
  }

  /**
   * Verifica si una acción ya otorgó un crédito (para evitar abusos).
   * @param ip IP del usuario
   * @param actionId ID único de la acción (ej: 'guide_vote_icc')
   * @returns true si ya se otorgó crédito por esta acción
   */
  static async hasAlreadyRewarded(ip: string, actionId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('game_rewards_log')
      .select('id')
      .eq('ip_hash', ip)
      .eq('action_id', actionId)
      .single();

    return !!data;
  }

  /**
   * Registra una recompensa otorgada.
   */
  static async logReward(ip: string, actionId: string) {
    const { error } = await supabase
      .from('game_rewards_log')
      .insert([{
        ip_hash: ip,
        action_id: actionId,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
  }
}
