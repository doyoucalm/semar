import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InMemoryStorage, FileSystemStorage } from '../src/storage.js';
import type { DiaryEntry } from '../src/types.js';

function makeEntry(date: string, id = `id-${date}`): DiaryEntry {
  return {
    id,
    createdAt: `${date}T12:00:00.000Z`,
    date,
    readings: [],
  };
}

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;
  beforeEach(() => { storage = new InMemoryStorage(); });

  it('append + list round-trips', async () => {
    await storage.append(makeEntry('2026-05-17'));
    expect(await storage.list()).toHaveLength(1);
  });

  it('today returns the most recent entry for that date', async () => {
    await storage.append({ ...makeEntry('2026-05-17', 'first'), createdAt: '2026-05-17T08:00:00Z' });
    await storage.append({ ...makeEntry('2026-05-17', 'second'), createdAt: '2026-05-17T20:00:00Z' });
    const t = await storage.today('2026-05-17');
    expect(t?.id).toBe('second');
  });

  it('today returns null when no entry matches', async () => {
    expect(await storage.today('2026-05-17')).toBeNull();
  });

  it('list filters by date range', async () => {
    await storage.append(makeEntry('2026-05-15'));
    await storage.append(makeEntry('2026-05-17'));
    await storage.append(makeEntry('2026-05-20'));
    const recent = await storage.list({ from: '2026-05-16', to: '2026-05-19' });
    expect(recent.map((e) => e.date)).toEqual(['2026-05-17']);
  });

  it('get retrieves by id', async () => {
    const e = makeEntry('2026-05-17');
    await storage.append(e);
    expect((await storage.get(e.id))?.id).toBe(e.id);
    expect(await storage.get('nope')).toBeNull();
  });
});

describe('FileSystemStorage', () => {
  let dir: string;
  let storage: FileSystemStorage;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'semar-diary-'));
    storage = new FileSystemStorage(join(dir, 'diary.jsonl'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('survives a reload', async () => {
    await storage.append(makeEntry('2026-05-17'));
    await storage.append(makeEntry('2026-05-18'));

    const reopened = new FileSystemStorage(storage.path);
    const all = await reopened.list();
    expect(all.map((e) => e.date)).toEqual(['2026-05-17', '2026-05-18']);
  });

  it('list on a fresh file returns empty array (no throw)', async () => {
    expect(await storage.list()).toEqual([]);
  });

  it('creates parent directories on first write', async () => {
    const deep = new FileSystemStorage(join(dir, 'nested/path/diary.jsonl'));
    await deep.append(makeEntry('2026-05-17'));
    expect(await deep.list()).toHaveLength(1);
  });

  it('today still works after persistence', async () => {
    await storage.append({ ...makeEntry('2026-05-17', 'a'), createdAt: '2026-05-17T08:00:00Z' });
    await storage.append({ ...makeEntry('2026-05-17', 'b'), createdAt: '2026-05-17T20:00:00Z' });
    const reopened = new FileSystemStorage(storage.path);
    expect((await reopened.today('2026-05-17'))?.id).toBe('b');
  });
});
