import { supabase } from './supabase';

export class RouletteService {
  /**
   * Obtiene la IP real del cliente manejando proxies.
   */
  static getClientIP(request: Request, clientAddress?: string): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const ip = forwarded.split(',')[0].trim();
      if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
      return ip;
    }
    let ip = clientAddress || '127.0.0.1';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    return ip;
  }

  /**
   * Genera un hash consistente para la IP para proteger la privacidad y mantener consistencia.
   */
  static getIpHash(ip: string): string {
    if (!ip || ip === 'unknown' || ip === 'anonymous') return 'anonymous';
    try {
      // Usar btoa para un hash simple y consistente con el código previo
      return btoa(ip).substring(0, 16);
    } catch (e) {
      // Fallback si btoa falla (ej: caracteres no-latin1)
      return ip.substring(0, 16);
    }
  }

  /**
   * Otorga créditos extra a un usuario basado en su IP, con validación de límites.
   * @param ip IP del usuario
   * @param actionId ID único de la acción (ej: 'guide_vote_icc' o 'schedule_vote_2024-03-30')
   * @param limit Límite de veces que se puede otorgar esta recompensa (opcional)
   * @returns Objeto con el resultado de la operación
   */
  static async grantReward(ip: string, actionId: string, limit: number = 1) {
    const ipHash = this.getIpHash(ip);

    // 1. Verificar si ya se alcanzó el límite para esta acción e IP
    const { count, error: countError } = await supabase
      .from('game_rewards_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('action_id', actionId);

    if (countError) throw countError;

    if (count !== null && count >= limit) {
      return { success: false, message: 'Límite de recompensa alcanzado' };
    }

    // 2. Registrar la recompensa
    const { error: logError } = await supabase
      .from('game_rewards_log')
      .insert([{
        ip_hash: ipHash,
        action_id: actionId,
        created_at: new Date().toISOString()
      }]);

    if (logError) throw logError;

    // 3. Otorgar los créditos
    await this.addCredits(ipHash, 1);

    return { success: true, message: 'Recompensa otorgada con éxito' };
  }

  /**
   * Asegura que la sesión esté al día, reseteando créditos si es necesario (00:00 Europe/London).
   * @param session La sesión actual obtenida de la DB
   * @returns La sesión actualizada (o la misma si no hubo cambios)
   */
  static async ensureDailyReset(session: any) {
    if (!session) return null;

    const guildTimezone = 'Europe/London';
    const now = new Date();
    const nowServerStr = now.toLocaleDateString('en-CA', { timeZone: guildTimezone });
    
    const lastActive = new Date(session.last_active);
    const lastActiveServerStr = lastActive.toLocaleDateString('en-CA', { timeZone: guildTimezone });

    if (nowServerStr !== lastActiveServerStr) {
      const resetData = {
        credits: 5,
        gold_pool: 100, // Reseteamos el pozo a 100 en el reset diario
        has_won_choker: false,
        spin_history: [],
        last_active: now.toISOString()
      };

      const { data: updatedSession, error: updateError } = await supabase
        .from('game_sessions')
        .update(resetData)
        .eq('ip_hash', session.ip_hash)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedSession;
    }
    return session;
  }

  /**
   * Otorga créditos extra a un usuario basado en su IP.
   * @param ipHash Hash de la IP del usuario (o IP directa que será hasheada)
   * @param amount Cantidad de créditos a sumar
   * @param goldAmount Cantidad opcional de oro a sumar al pool
   * @returns El estado actualizado de la sesión
   */
  static async addCredits(ipHash: string, amount: number, goldAmount: number = 0) {
    // Asegurarse de que el ID sea consistente (si recibimos IP, hashearla)
    const sessionId = (ipHash.includes('.') || ipHash.includes(':')) ? this.getIpHash(ipHash) : ipHash;

    // 1. Obtener o crear la sesión
    let { data: session, error: fetchError } = await supabase
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
          gold_pool: 100 + goldAmount,
          last_active: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;
      return newSession;
    }

    // 2. Verificar reseteo diario antes de sumar (CRÍTICO para no perder créditos del día)
    session = await this.ensureDailyReset(session);

    // 3. Actualizar créditos existentes
    const { data: updatedSession, error: updateError } = await supabase
      .from('game_sessions')
      .update({
        credits: (session.credits ?? 0) + amount,
        gold_pool: (session.gold_pool ?? 0) + goldAmount, // Preservamos el valor actual (incluyendo 0)
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
