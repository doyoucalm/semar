/**
 * Append-only JSONL diary at $SEMAR_HOME/diary.jsonl.
 *
 * One JSON object per line. Schema is intentionally loose — engines
 * add their own structured blobs and the wrapper records the timestamp
 * + question if present.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { diaryPath } from './profile.js';

export interface DiaryEntry {
  readonly id: string;
  readonly createdAt: string; // ISO UTC
  readonly localDate: string; // YYYY-MM-DD in profile's local time
  readonly kind: 'today' | 'chart' | 'cast' | 'draw' | 'transits' | 'custom';
  readonly question?: string;
  readonly notes?: string;
  readonly payload: Record<string, unknown>;
}

export function appendEntry(entry: DiaryEntry): void {
  const path = diaryPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(path, JSON.stringify(entry) + '\n', 'utf8');
}

export function readEntries(): DiaryEntry[] {
  const path = diaryPath();
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as DiaryEntry);
}

export function localDateString(utcMs: number, utcOffsetMinutes: number): string {
  const local = new Date(utcMs + utcOffsetMinutes * 60_000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

let counter = 0;
export function makeId(): string {
  const t = Date.now().toString(36);
  const c = (counter++).toString(36).padStart(3, '0');
  const r = Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0');
  return `${t}-${c}-${r}`;
}
