-- Tabla para guardar el estado del juego por IP
-- Ejecuta este SQL en el Editor SQL de tu proyecto Supabase

CREATE TABLE IF NOT EXISTS game_sessions (
    ip_hash TEXT PRIMARY KEY,
    credits INTEGER DEFAULT 5,
    gold_pool INTEGER DEFAULT 100,
    has_won_choker BOOLEAN DEFAULT FALSE,
    spin_history JSONB DEFAULT '[]'::jsonb,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso anónimo (lectura y escritura)
-- Nota: La seguridad real estará en el backend de Astro filtrando por IP.
-- Esto permite que la API de Astro (que usa la key anónima) pueda leer/escribir.
CREATE POLICY "Public access for game sessions" 
ON game_sessions FOR ALL 
USING (true) 
WITH CHECK (true);
