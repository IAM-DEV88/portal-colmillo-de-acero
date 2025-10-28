-- Create the tables and functions needed for the voting system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Characters table
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(character_id, user_id)
);

-- Monthly vote aggregates
CREATE TABLE IF NOT EXISTS public.monthly_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  vote_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(character_id, month)
);

-- View for character votes
CREATE OR REPLACE VIEW public.character_votes AS
SELECT 
  c.id AS character_id,
  c.name AS character_name,
  COALESCE(SUM(mv.vote_count), 0) AS vote_count
FROM 
  public.characters c
LEFT JOIN 
  public.monthly_votes mv ON c.id = mv.character_id
GROUP BY 
  c.id, c.name;

-- Function to handle voting
CREATE OR REPLACE FUNCTION public.handle_vote(
  p_character_id UUID,
  p_user_id UUID,
  p_vote_date TIMESTAMP WITH TIME ZONE,
  p_month TEXT
) 
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_vote_id UUID;
  v_existing_vote RECORD;
  v_monthly_vote RECORD;
  v_result JSONB;
BEGIN
  -- Check if user has already voted for this character
  SELECT id, last_voted_at 
  INTO v_existing_vote
  FROM public.votes
  WHERE character_id = p_character_id AND user_id = p_user_id;

  -- If no existing vote, insert a new one
  IF v_existing_vote IS NULL THEN
    INSERT INTO public.votes (character_id, user_id, last_voted_at)
    VALUES (p_character_id, p_user_id, p_vote_date)
    RETURNING id INTO v_vote_id;
  ELSE
    -- Update existing vote timestamp
    UPDATE public.votes
    SET last_voted_at = p_vote_date
    WHERE id = v_existing_vote.id
    RETURNING id INTO v_vote_id;
  END IF;

  -- Check for existing monthly vote record
  SELECT id, vote_count 
  INTO v_monthly_vote
  FROM public.monthly_votes
  WHERE character_id = p_character_id AND month = p_month;

  -- Update or insert monthly vote count
  IF v_monthly_vote IS NULL THEN
    INSERT INTO public.monthly_votes (character_id, month, vote_count)
    VALUES (p_character_id, p_month, 1);
  ELSE
    UPDATE public.monthly_votes
    SET vote_count = vote_count + 1
    WHERE id = v_monthly_vote.id;
  END IF;

  -- Return success
  SELECT jsonb_build_object(
    'success', true,
    'vote_id', v_vote_id,
    'character_id', p_character_id,
    'user_id', p_user_id,
    'voted_at', p_vote_date
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Create a trigger to reset votes at the beginning of each month
CREATE OR REPLACE FUNCTION public.reset_monthly_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by a scheduled job in Supabase
  -- It will reset the vote counts for all characters for the new month
  
  -- Get the first day of the current month in YYYY-MM format
  DECLARE
    current_month TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  BEGIN
    -- Delete all monthly votes for the current month
    -- This will be automatically recreated when new votes come in
    DELETE FROM public.monthly_votes
    WHERE month = current_month;
    
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to reset votes on the first day of each month
-- Note: This needs to be set up in the Supabase dashboard
-- under Database → Replication → Scheduled Jobs
-- Create a new job that runs on the 1st of each month at 00:00:00
-- with the following SQL: SELECT public.reset_monthly_votes();
