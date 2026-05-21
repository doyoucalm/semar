import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DiaryEntry } from './types.js';

/**
 * Append-only storage. Two adapters out of the box; both are safe to
 * use in tests via dependency injection.
 *
 * Cloud sync (Supabase) is a Phase-2 concern — the interface stays the
 * same when a remote adapter is added.
 */
export interface DiaryStorage {
  append(entry: DiaryEntry): Promise<void>;
  list(filter?: ListFilter): Promise<DiaryEntry[]>;
  get(id: string): Promise<DiaryEntry | null>;
  /** Latest entry on the given local date (YYYY-MM-DD). */
  today(date: string): Promise<DiaryEntry | null>;
}

export interface ListFilter {
  /** Inclusive YYYY-MM-DD lower bound. */
  readonly from?: string;
  /** Inclusive YYYY-MM-DD upper bound. */
  readonly to?: string;
}

export class InMemoryStorage implements DiaryStorage {
  private readonly entries: DiaryEntry[] = [];

  async append(entry: DiaryEntry): Promise<void> {
    this.entries.push(entry);
  }

  async list(filter: ListFilter = {}): Promise<DiaryEntry[]> {
    return this.entries.filter((e) => matches(e, filter));
  }

  async get(id: string): Promise<DiaryEntry | null> {
    return this.entries.find((e) => e.id === id) ?? null;
  }

  async today(date: string): Promise<DiaryEntry | null> {
    const same = this.entries.filter((e) => e.date === date);
    return same.at(-1) ?? null;
  }
}

/**
 * JSONL file — one entry per line, appended atomically by the OS.
 * Reads stream the whole file; fine for diary-scale corpora (millions
 * of entries would be wasteful, but a single practitioner produces a
 * few thousand at most over decades).
 */
export class FileSystemStorage implements DiaryStorage {
  constructor(public readonly path: string) {}

  async append(entry: DiaryEntry): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await appendFile(this.path, JSON.stringify(entry) + '\n', 'utf8');
  }

  async list(filter: ListFilter = {}): Promise<DiaryEntry[]> {
    const all = await this.readAll();
    return all.filter((e) => matches(e, filter));
  }

  async get(id: string): Promise<DiaryEntry | null> {
    const all = await this.readAll();
    return all.find((e) => e.id === id) ?? null;
  }

  async today(date: string): Promise<DiaryEntry | null> {
    const all = await this.readAll();
    const same = all.filter((e) => e.date === date);
    return same.at(-1) ?? null;
  }

  private async readAll(): Promise<DiaryEntry[]> {
    let text: string;
    try {
      text = await readFile(this.path, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw e;
    }
    return text
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as DiaryEntry);
  }
}

function matches(e: DiaryEntry, f: ListFilter): boolean {
  if (f.from && e.date < f.from) return false;
  if (f.to && e.date > f.to) return false;
  return true;
}
