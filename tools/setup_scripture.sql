-- Add scripture + source_url columns for the Codex (if not already present)

ALTER TABLE memes ADD COLUMN IF NOT EXISTS scripture text;
ALTER TABLE memes ADD COLUMN IF NOT EXISTS source_url text;

CREATE INDEX IF NOT EXISTS memes_scripture_idx ON memes (id) WHERE scripture IS NOT NULL;