/**
 * Client-side diary store.
 *
 * Strategy:
 *   - localStorage: primary read path + offline fallback (always fast, sync).
 *   - /api/diary:   write-through on every appendEntry + pull-to-sync on app load.
 *
 * All exported read functions remain synchronous — no callers need changing.
 * API operations are fire-and-forget for writes, and called once on mount
 * via DiarySync component for reads.
 */

'use client';

import type { WebDiaryEntry } from './diary-types';
export type { WebDiaryEntry } from './diary-types';

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

// ── Public API ────────────────────────────────────────────────────────────────

/** Append entry to localStorage + fire-and-forget upsert to /api/diary. */
export function appendEntry(entry: WebDiaryEntry): void {
  const entries = load();
  entries.push(entry);
  save(entries);

  // Fire-and-forget — never blocks the UI
  void fetch('/api/diary', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ entries: [entry] }),
  }).catch((err) => console.warn('[diary] API upsert failed:', err));
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
 * Pull all remote entries from /api/diary and merge into localStorage.
 * Remote entries missing locally are added (cross-device sync).
 * Local entries always win on ID collision.
 *
 * Call once on app mount via DiarySync component. Silent-fails if offline.
 */
export async function syncFromRemote(): Promise<{ added: number }> {
  try {
    const res = await fetch('/api/diary');
    if (!res.ok) { console.warn('[diary] pull failed:', res.status); return { added: 0 }; }

    const { entries: remote } = (await res.json()) as { entries: WebDiaryEntry[] };
    if (!remote || remote.length === 0) return { added: 0 };

    const local    = load();
    const localIds = new Set(local.map((e) => e.id));
    const toAdd    = remote.filter((e) => !localIds.has(e.id));
    if (toAdd.length === 0) return { added: 0 };

    const merged = [...local, ...toAdd]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    save(merged);
    return { added: toAdd.length };
  } catch (err) {
    console.warn('[diary] sync error:', err);
    return { added: 0 };
  }
}

/**
 * Push all localStorage entries not yet in the server DB.
 * Used for one-time migration when first loading on a new device.
 */
export async function pushLocalToRemote(): Promise<{ pushed: number }> {
  const local = load();
  if (local.length === 0) return { pushed: 0 };

  try {
    const res = await fetch('/api/diary', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ entries: local }),
    });
    if (!res.ok) { console.warn('[diary] push failed:', res.status); return { pushed: 0 }; }

    const { inserted } = (await res.json()) as { inserted: number };
    return { pushed: inserted };
  } catch (err) {
    console.warn('[diary] push error:', err);
    return { pushed: 0 };
  }
}

// ── Legacy Supabase compat (kept so no import sites break) ───────────────────
export const syncFromSupabase   = syncFromRemote;
export const pushLocalToSupabase = pushLocalToRemote;
