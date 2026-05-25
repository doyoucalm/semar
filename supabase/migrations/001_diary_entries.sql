-- Semar diary entries table
-- Phase 2: Supabase persistence for cross-device sync.
-- Schema mirrors WebDiaryEntry (lib/diary-types.ts) exactly.

CREATE TABLE IF NOT EXISTS diary_entries (
  id          TEXT        PRIMARY KEY,              -- client-generated (makeId)
  created_at  TIMESTAMPTZ NOT NULL,                 -- ISO string from new Date()
  local_date  TEXT        NOT NULL,                 -- 'YYYY-MM-DD' in user's tz
  kind        TEXT        NOT NULL
                CHECK (kind IN ('today', 'cast', 'note')),
  question    TEXT,
  notes       TEXT,
  payload     JSONB       NOT NULL DEFAULT '{}'
);

-- Index for the most common queries (by date range)
CREATE INDEX IF NOT EXISTS diary_entries_local_date_idx ON diary_entries (local_date DESC);

-- RLS: enabled but open for now (single-user personal tool).
-- TODO Phase 3: add user_id UUID REFERENCES auth.users(id)
-- and scope policy to auth.uid() = user_id.
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all reads"   ON diary_entries FOR SELECT USING (true);
CREATE POLICY "allow all inserts" ON diary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "allow all updates" ON diary_entries FOR UPDATE USING (true) WITH CHECK (true);
