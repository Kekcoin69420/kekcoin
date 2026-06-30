-- Run this in your Supabase SQL editor (supabase.com → project → SQL Editor)
-- Creates the memes table with full-text search and public read access

CREATE TABLE IF NOT EXISTS memes (
  id          text PRIMARY KEY,
  title       text NOT NULL,
  year        integer,
  creator     text,
  origin      text,
  cat         text DEFAULT 'modern',
  icon        text DEFAULT '𓂀',
  tier        text DEFAULT 'Modern',
  kek         integer DEFAULT 3 CHECK (kek BETWEEN 1 AND 5),
  summary     text,
  description text,
  lore        text DEFAULT '',
  tags        text[] DEFAULT '{}',
  img         text,
  created_at  timestamptz DEFAULT now()
);

-- Generated full-text search column (auto-updates on INSERT/UPDATE)
ALTER TABLE memes
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(summary,'') || ' ' ||
      coalesce(description,'') || ' ' ||
      array_to_string(coalesce(tags, ARRAY[]::text[]), ' ')
    )
  ) STORED;

-- Indexes for fast filtering, sorting, and search
CREATE INDEX IF NOT EXISTS memes_search_idx ON memes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS memes_cat_idx    ON memes(cat);
CREATE INDEX IF NOT EXISTS memes_kek_idx    ON memes(kek DESC);
CREATE INDEX IF NOT EXISTS memes_year_idx   ON memes(year);

-- Row-level security: public can read, only service role can write
ALTER TABLE memes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='memes' AND policyname='Public read memes'
  ) THEN
    CREATE POLICY "Public read memes" ON memes FOR SELECT USING (true);
  END IF;
END $$;
