import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LUCKY_PROFILE } from '../src/profile.js';
import { runDaily } from '../src/daily.js';
import { readEntries } from '../src/diary-log.js';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'semar-cli-test-'));
  process.env.SEMAR_HOME = tmp;
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('runDaily', () => {
  const FIXED_NOW = Date.UTC(2026, 4, 17, 12, 0); // 2026-05-17 noon UTC

  it('produces a summary that mentions all four engines', () => {
    const { summary } = runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW });
    expect(summary).toContain('Semar daily');
    expect(summary).toContain('Transits:');
    expect(summary).toContain('Day pillar today:');
    expect(summary).toContain('Tarot:');
    expect(summary).toContain('I-Ching:');
  });

  it('writes a JSONL entry to the diary', () => {
    runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW });
    const diary = join(tmp, 'diary.jsonl');
    expect(existsSync(diary)).toBe(true);
    const lines = readFileSync(diary, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]!);
    expect(parsed.kind).toBe('today');
    expect(parsed.payload.tarot).toHaveLength(3);
    expect(parsed.payload.iching.primary.number).toBeGreaterThanOrEqual(1);
    expect(parsed.payload.iching.primary.number).toBeLessThanOrEqual(64);
  });

  it('produces 3 distinct tarot cards (no duplicates in a single draw)', () => {
    const { entry } = runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW });
    const tarot = entry.payload.tarot as Array<{ card: string }>;
    const names = new Set(tarot.map((t) => t.card));
    expect(names.size).toBe(3);
  });

  it('deterministic: same fixed-now ⇒ same tarot + I-Ching', () => {
    const a = runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW });
    const b = runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW });
    const aT = a.entry.payload.tarot as Array<{ card: string; reversed: boolean }>;
    const bT = b.entry.payload.tarot as Array<{ card: string; reversed: boolean }>;
    expect(aT.map((c) => c.card)).toEqual(bT.map((c) => c.card));
    const aI = a.entry.payload.iching as { primary: { number: number } };
    const bI = b.entry.payload.iching as { primary: { number: number } };
    expect(aI.primary.number).toBe(bI.primary.number);
  });

  it('saves the question when provided', () => {
    runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW, question: 'what now?' });
    const entries = readEntries();
    expect(entries[0]!.question).toBe('what now?');
  });

  it('appends rather than overwriting', () => {
    runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW });
    runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW + 86_400_000 });
    expect(readEntries()).toHaveLength(2);
  });

  it("records transits' tightest aspect, if any", () => {
    const { entry } = runDaily(LUCKY_PROFILE, { nowMs: FIXED_NOW });
    const aspects = entry.payload.transits as { aspectsToNatal: unknown[] };
    expect(Array.isArray(aspects.aspectsToNatal)).toBe(true);
  });
});
