/**
 * Client-side diary store.
 *
 * Strategy:
 *   - localStorage: primary read path + offline fallback (always fast, sync).
 *   - Supabase: write-through on every appendEntry + pull-to-sync on app load.
 *
 * All exported read functions remain synchronous — no callers need changing.
 * Supabase operations are fire-and-forget for writes, and called once on mount
 * via DiarySync component for reads.
 *
 * Phase 3: add auth.users scoping to RLS policy.
 */

'use client';

import type { WebDiaryEntry } from './diary-types';
export type { WebDiaryEntry } from './diary-types';

import { supabase } from './supabase';

const KEY = 'semar-diary-v1';

// ── Local storage helpers ─────────────────────────────────────────────────────

function load(): WebDiaryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as WebDiaryEntry[];
  } catch {
    return [];
  }
}

function save(entries: WebDiaryEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(entries));
}

// ── Supabase row shape ────────────────────────────────────────────────────────

interface DiaryRow {
  id: string;
  created_at: string;
  local_date: string;
  kind: string;
  question: string | null;
  notes: string | null;
  payload: Record<string, unknown>;
}

function toRow(e: WebDiaryEntry): DiaryRow {
  return {
    id:         e.id,
    created_at: e.createdAt,
    local_date: e.localDate,
    kind:       e.kind,
    question:   e.question ?? null,
    notes:      e.notes    ?? null,
    payload:    e.payload,
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
    payload:   row.payload,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Append entry to localStorage + fire-and-forget Supabase upsert. */
export function appendEntry(entry: WebDiaryEntry): void {
  const entries = load();
  entries.push(entry);
  save(entries);

  if (supabase) {
    void supabase
      .from('diary_entries')
      .upsert(toRow(entry))
      .then(({ error }) => {
        if (error) console.warn('[diary] supabase upsert failed:', error.message);
      });
  }
}

/** Synchronous read — always from localStorage. */
export function getEntries(opts: { from?: string; to?: string } = {}): WebDiaryEntry[] {
  return load().filter((e) => {
    if (opts.from && e.localDate < opts.from) return false;
    if (opts.to   && e.localDate > opts.to)   return false;
    return true;
  });
}

export function getEntryDates(): Set<string> {
  return new Set(load().map((e) => e.localDate));
}

export function getTodayEntry(localDate: string): WebDiaryEntry | null {
  return load().findLast((e) => e.kind === 'today' && e.localDate === localDate) ?? null;
}

let _counter = 0;
export function makeId(): string {
  return `${Date.now().toString(36)}-${(++_counter).toString(36).padStart(3, '0')}-${Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0')}`;
}

// ── Cross-device sync ─────────────────────────────────────────────────────────

/**
 * Pull all remote entries from Supabase and merge into localStorage.
 * Remote entries that are missing locally are added (cross-device sync).
 * Local entries always win on ID collision (already written, no regression).
 *
 * Call once on app mount via DiarySync component. Silent-fails if offline.
 */
export async function syncFromSupabase(): Promise<{ added: number }> {
  if (!supabase) return { added: 0 };

  try {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1000);                        // >1000 entries → paginate later

    if (error) {
      console.warn('[diary] supabase pull failed:', error.message);
      return { added: 0 };
    }
    if (!data || data.length === 0) return { added: 0 };

    const remote = (data as DiaryRow[]).map(fromRow);
    const local  = load();
    const localIds = new Set(local.map((e) => e.id));

    const toAdd = remote.filter((e) => !localIds.has(e.id));
    if (toAdd.length === 0) return { added: 0 };

    const merged = [...local, ...toAdd]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    save(merged);
    return { added: toAdd.length };
  } catch (err) {
    console.warn('[diary] supabase sync error:', err);
    return { added: 0 };
  }
}

/**
 * Push all localStorage entries that are missing in Supabase.
 * Useful for initial migration after credentials are first configured.
 */
export async function pushLocalToSupabase(): Promise<{ pushed: number }> {
  if (!supabase) return { pushed: 0 };

  const local = load();
  if (local.length === 0) return { pushed: 0 };

  try {
    const { error } = await supabase
      .from('diary_entries')
      .upsert(local.map(toRow), { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      console.warn('[diary] supabase push failed:', error.message);
      return { pushed: 0 };
    }
    return { pushed: local.length };
  } catch (err) {
    console.warn('[diary] supabase push error:', err);
    return { pushed: 0 };
  }
}
