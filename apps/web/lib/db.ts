/**
 * SQLite singleton — server-side only.
 * DB file lives at /workspace/semar/data/semar.db (persists across deploys).
 * Initialised once per process; migrations are idempotent.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), '..', '..', 'data');
const DB_PATH  = path.join(DATA_DIR, 'semar.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data dir exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');   // concurrent reads OK
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS diary_entries (
      id          TEXT        PRIMARY KEY,
      created_at  TEXT        NOT NULL,
      local_date  TEXT        NOT NULL,
      kind        TEXT        NOT NULL
                    CHECK (kind IN ('today', 'cast', 'note')),
      question    TEXT,
      notes       TEXT,
      payload     TEXT        NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS diary_entries_local_date_idx
      ON diary_entries (local_date DESC);
  `);

  return _db;
}
