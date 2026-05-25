/**
 * Client-side diary store backed by localStorage.
 * Schema-compatible with the CLI JSONL diary so entries can be merged later.
 * Phase 2: replace with Supabase.
 */

'use client';

import type { WebDiaryEntry } from './diary-types';
export type { WebDiaryEntry } from './diary-types';

const KEY = 'semar-diary-v1';

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

export function appendEntry(entry: WebDiaryEntry): void {
  const entries = load();
  entries.push(entry);
  save(entries);
}

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
