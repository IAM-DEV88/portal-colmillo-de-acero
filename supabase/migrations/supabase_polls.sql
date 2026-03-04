-- SQL para crear la tabla de votos de horarios (schedule_votes) en Supabase
-- Esta tabla reemplaza a recruitment_votes y usa una estructura de columnas fija para mejor reporte
CREATE TABLE IF NOT EXISTS schedule_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    raid_name TEXT NOT NULL, -- ICC, TOC, SR
    difficulty TEXT NOT NULL, -- Normal, Heroico
    size TEXT NOT NULL, -- 10, 25
    day_of_week TEXT NOT NULL, -- lunes, martes, etc.
    preferred_time TEXT NOT NULL, -- HH:mm
    ip_hash TEXT, -- Para evitar spam básico
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para mejorar la velocidad de las consultas
CREATE INDEX IF NOT EXISTS idx_schedule_raid ON schedule_votes(raid_name);
CREATE INDEX IF NOT EXISTS idx_schedule_day ON schedule_votes(day_of_week);
