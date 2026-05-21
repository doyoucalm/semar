import { describe, it, expect } from 'vitest';
import { loadHkoData, MINOR_TERMS_ORDER, termMeta } from '../src/data.js';

describe('HKO solar-term data', () => {
  const data = loadHkoData();

  it('covers 1901..2100 with 24 terms per year', () => {
    expect(data.yearRange).toEqual([1901, 2100]);
    expect(data.entries.length).toBe(200 * 24);
  });

  it('exposes 24 term metadata entries', () => {
    expect(data.terms).toHaveLength(24);
  });

  it('the 12 minor terms each declare a month branch', () => {
    const minors = data.terms.filter((t) => t.kind === 'minor');
    expect(minors).toHaveLength(12);
    for (const m of minors) {
      expect(m.monthBranch).toBeTruthy();
    }
  });

  it('major terms do not declare a month branch', () => {
    const majors = data.terms.filter((t) => t.kind === 'major');
    expect(majors).toHaveLength(12);
    for (const m of majors) {
      expect(m.monthBranch).toBeUndefined();
    }
  });

  it('1985 lixia falls on 1985-05-05 (Lucky\'s birth date)', () => {
    const row = data.entries.find((e) => e.year === 1985 && e.termKey === 'lixia');
    expect(row?.date).toBe('1985-05-05');
  });

  it('every entry has a known termKey', () => {
    const known = new Set(data.terms.map((t) => t.key));
    for (const e of data.entries) {
      expect(known.has(e.termKey)).toBe(true);
    }
  });

  it('MINOR_TERMS_ORDER has 12 keys, all minor', () => {
    expect(MINOR_TERMS_ORDER).toHaveLength(12);
    for (const k of MINOR_TERMS_ORDER) {
      expect(termMeta(k).kind).toBe('minor');
    }
  });
});
