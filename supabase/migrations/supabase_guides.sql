-- SQL para las tablas de guías, votos y comentarios
-- Ejecutar en el Editor SQL de Supabase

-- 1. Tabla de Guías (Metadatos y estado)
CREATE TABLE IF NOT EXISTS guides (
    id TEXT PRIMARY KEY, -- Slug de la guía (ej: 'icc-heroico')
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Especialización', 'Profesiones', 'Leveo', 'Mecánicas'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Votos (Likes)
CREATE TABLE IF NOT EXISTS guide_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guide_id TEXT REFERENCES guides(id) ON DELETE CASCADE,
    ip_hash TEXT NOT NULL, -- Para evitar spam básico
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(guide_id, ip_hash)
);

-- 3. Tabla de Comentarios
CREATE TABLE IF NOT EXISTS guide_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guide_id TEXT REFERENCES guides(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE, -- Moderación previa autorización admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_guides_category ON guides(category);
CREATE INDEX IF NOT EXISTS idx_guide_comments_guide_id ON guide_comments(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_comments_approved ON guide_comments(is_approved);

-- Insertar guías iniciales (opcional, para inicializar los IDs)
INSERT INTO guides (id, title, category, description) VALUES 
('icc-heroico', 'ICC 25 Heroico - Mecánicas', 'Mecánicas', 'Guía completa de las mecánicas de ICC 25 Heroico'),
('halion-rs', 'Halion - Sagrario Rubí', 'Mecánicas', 'Colección de guías visuales y estrategias para el encuentro de Halion 25H/N'),
('toc', 'Prueba del Cruzado (ToC)', 'Mecánicas', 'Guía completa de todos los encuentros de ToC 25H/N'),
('nota-publica', 'Guía de Nota Pública', 'Leveo', 'Aprende a configurar tu nota pública para participar en el sistema de raids'),
('paladin-retribucion-335a', 'Paladín Retribución 3.3.5a', 'Especialización', 'Guía del Paladín Retribución para WotLK'),
('paladin-proteccion-335a', 'Paladín Protección 3.3.5a', 'Especialización', 'Guía del Paladín Tanque para WotLK'),
('druida-restauracion-335a', 'Druida Restauración 3.3.5a', 'Especialización', 'Guía del Druida Healer para WotLK'),
('druida-equilibrio-335a', 'Druida Equilibrio 3.3.5a', 'Especialización', 'Guía del Druida Cásterr para WotLK'),
('brujo-afliccion-335a', 'Brujo Aflicción 3.3.5a', 'Especialización', 'Guía del Brujo Aflicción para WotLK'),
('brujo-demonologia-335a', 'Brujo Demonología 3.3.5a', 'Especialización', 'Guía del Brujo Buff para WotLK'),
('guerrero-furia-335a', 'Guerrero Furia 3.3.5a', 'Especialización', 'Guía del Guerrero Furia para WotLK'),
('guerrero-proteccion-335a', 'Guerrero Protección 3.3.5a', 'Especialización', 'Guía del Guerrero Tanque para WotLK'),
('chaman-restauracion-335a', 'Chamán Restauración 3.3.5a', 'Especialización', 'Guía del Chamán Healer para WotLK'),
('chaman-mejora-335a', 'Chamán Mejora 3.3.5a', 'Especialización', 'Guía del Chamán Melé para WotLK'),
('picaro-combate-335a', 'Pícaro Combate 3.3.5a', 'Especialización', 'Guía del Pícaro Combate para WotLK')
ON CONFLICT (id) DO NOTHING;
