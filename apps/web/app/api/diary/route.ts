/**
 * /api/diary
 *
 * GET  → returns all entries, ordered by created_at ASC
 * POST → upserts a batch of entries (ignoreDuplicates = true for already-synced)
 *
 * Server-side only — uses SQLite via lib/db.ts.
 * No auth needed (single-user personal tool running on private VPS).
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { WebDiaryEntry } from '@/lib/diary-types';

interface DiaryRow {
  id: string;
  created_at: string;
  local_date: string;
  kind: string;
  question: string | null;
  notes: string | null;
  payload: string;        // JSON string in SQLite
}

function toRow(e: WebDiaryEntry): DiaryRow {
  return {
    id:         e.id,
    created_at: e.createdAt,
    local_date: e.localDate,
    kind:       e.kind,
    question:   e.question ?? null,
    notes:      e.notes    ?? null,
    payload:    JSON.stringify(e.payload),
  };
}

function fromRow(row: DiaryRow): WebDiaryEntry {
  return {
    id:        row.id,
    createdAt: row.created_at,
    localDate: row.local_date,
    kind:      row.kind as WebDiaryEntry['kind'],
    question:  row.question  ?? undefined,
    notes:     row.notes     ?? undefined,
    payload:   JSON.parse(row.payload) as Record<string, unknown>,
  };
}

// GET /api/diary
export async function GET() {
  try {
    const db   = getDb();
    const rows = db.prepare(
      `SELECT * FROM diary_entries ORDER BY created_at ASC`
    ).all() as DiaryRow[];

    return NextResponse.json({ entries: rows.map(fromRow) });
  } catch (err) {
    console.error('[diary API] GET error:', err);
    return NextResponse.json({ error: 'db error' }, { status: 500 });
  }
}

// POST /api/diary   body: { entries: WebDiaryEntry[] }
export async function POST(req: Request) {
  try {
    const { entries } = (await req.json()) as { entries: WebDiaryEntry[] };
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ inserted: 0 });
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO diary_entries
        (id, created_at, local_date, kind, question, notes, payload)
      VALUES
        (@id, @created_at, @local_date, @kind, @question, @notes, @payload)
    `);

    const insertMany = db.transaction((rows: DiaryRow[]) => {
      let count = 0;
      for (const row of rows) {
        const info = stmt.run(row);
        count += info.changes;
      }
      return count;
    });

    const inserted = insertMany(entries.map(toRow));
    return NextResponse.json({ inserted });
  } catch (err) {
    console.error('[diary API] POST error:', err);
    return NextResponse.json({ error: 'db error' }, { status: 500 });
  }
}
