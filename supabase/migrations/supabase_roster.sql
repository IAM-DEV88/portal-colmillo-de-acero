
-- Create roster_players table if not exists
CREATE TABLE IF NOT EXISTS roster_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    class TEXT,
    rank TEXT,
    public_note TEXT,
    officer_note TEXT,
    race TEXT,
    guild_leave BOOLEAN DEFAULT FALSE,
    leader_data JSONB DEFAULT '{}',
    is_sanctioned BOOLEAN DEFAULT FALSE,
    last_updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_roster_name ON roster_players(name);
CREATE INDEX IF NOT EXISTS idx_roster_guild_leave ON roster_players(guild_leave);
