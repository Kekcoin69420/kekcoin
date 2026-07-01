-- Meme submission queue — run in Supabase SQL editor after setup_memes.sql
-- Bot uses service_role key to insert/approve; public has no direct access.

CREATE TABLE IF NOT EXISTS meme_submissions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL,
  title              text NOT NULL,
  summary            text,
  lore               text,
  description        text,
  cat                text NOT NULL DEFAULT 'modern',
  img_url            text,
  telegram_user_id   bigint NOT NULL,
  telegram_username  text,
  display_name       text,
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by        bigint,
  reviewed_at        timestamptz,
  reject_reason      text,
  approved_meme_id   text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meme_submissions_status_idx
  ON meme_submissions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS meme_submissions_slug_idx
  ON meme_submissions (slug);

ALTER TABLE meme_submissions ENABLE ROW LEVEL SECURITY;
-- No public policies — service role bypasses RLS for bot moderation.

-- Public bucket for submission images (bot uploads via service key)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meme-submissions',
  'meme-submissions',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Public read meme submission images'
  ) THEN
    CREATE POLICY "Public read meme submission images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'meme-submissions');
  END IF;
END $$;