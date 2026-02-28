-- SQL para eliminar el campo player_name de la tabla recruitment_votes
ALTER TABLE recruitment_votes DROP COLUMN IF EXISTS player_name;
