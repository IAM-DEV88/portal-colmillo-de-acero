-- Función para manejar un voto en la encuesta.
-- Se puede llamar desde el cliente usando supabase.rpc('handle_survey_vote', {...})
CREATE OR REPLACE FUNCTION handle_survey_vote(
  p_character_name TEXT,
  p_connection_time TEXT,
  p_activity_preference TEXT,
  p_raid_preference TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_normalized_name TEXT;
  v_last_vote TIMESTAMPTZ;
  v_survey_id BIGINT;
BEGIN
  -- 1. Normalizar el nombre del personaje (minúsculas, sin espacios)
  v_normalized_name := lower(trim(p_character_name));

  -- 2. Buscar si ya existe un voto para este personaje
  SELECT id, last_voted_at INTO v_survey_id, v_last_vote
  FROM public.player_surveys
  WHERE normalized_character_name = v_normalized_name;

  -- 3. Verificar la restricción de 24 horas
  IF v_survey_id IS NOT NULL AND v_last_vote > (NOW() - INTERVAL '24 hours') THEN
    -- Si ha votado en las últimas 24h, devolver un error.
    RETURN json_build_object(
      'status', 'error',
      'message', 'Solo puedes votar una vez cada 24 horas.',
      'next_vote_possible_at', v_last_vote + INTERVAL '24 hours'
    );
  END IF;

  -- 4. Si no hay voto o si han pasado más de 24h, insertar o actualizar.
  IF v_survey_id IS NULL THEN
    -- Insertar un nuevo registro
    INSERT INTO public.player_surveys (character_name, normalized_character_name, connection_time, activity_preference, raid_preference, last_voted_at)
    VALUES (p_character_name, v_normalized_name, p_connection_time, p_activity_preference, p_raid_preference, NOW());
  ELSE
    -- Actualizar el registro existente
    UPDATE public.player_surveys
    SET
      connection_time = p_connection_time,
      activity_preference = p_activity_preference,
      raid_preference = p_raid_preference,
      last_voted_at = NOW()
    WHERE id = v_survey_id;
  END IF;

  -- 5. Devolver una respuesta de éxito
  RETURN json_build_object(
    'status', 'success',
    'message', 'Tu voto ha sido registrado. ¡Gracias por participar!'
  );
END;
$$;
