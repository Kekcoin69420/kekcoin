-- Temple presence heartbeat — run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS temple_presence (
  pilgrim_id   text PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Anonymous Pilgrim',
  sigil        text NOT NULL DEFAULT '𓂀',
  page         text,
  last_seen    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS temple_presence_last_seen_idx ON temple_presence (last_seen DESC);

ALTER TABLE temple_presence ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'temple_presence' AND policyname = 'Public read presence') THEN
    CREATE POLICY "Public read presence" ON temple_presence FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'temple_presence' AND policyname = 'Public upsert presence') THEN
    CREATE POLICY "Public upsert presence" ON temple_presence FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'temple_presence' AND policyname = 'Public update presence') THEN
    CREATE POLICY "Public update presence" ON temple_presence FOR UPDATE USING (true);
  END IF;
END $$;

-- Optional: purge stale rows (run manually or via cron)
-- DELETE FROM temple_presence WHERE last_seen < now() - interval '10 minutes';