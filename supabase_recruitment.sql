-- SQL para crear la tabla de reclutamiento en Supabase
CREATE TABLE IF NOT EXISTS recruitment_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL,
    raid_name TEXT NOT NULL, -- TOC, ICC, SR
    difficulty TEXT NOT NULL, -- Normal, Heroica
    size TEXT NOT NULL, -- 10, 25
    day_of_week TEXT NOT NULL, -- lunes, martes, etc.
    preferred_time TEXT NOT NULL, -- HH:MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_hash TEXT -- Para evitar spam básico (opcional)
);

-- Índices para mejorar la velocidad de las consultas de resumen
CREATE INDEX IF NOT EXISTS idx_recruitment_raid ON recruitment_votes(raid_name);
CREATE INDEX IF NOT EXISTS idx_recruitment_day ON recruitment_votes(day_of_week);
