import { describe, expect, it } from 'vitest';
import { pawukonOf, pawukonFromDate } from '../src/pawukon.js';
import { gregorianToJDN } from '../src/jdn.js';

describe('pawukonOf — verified anchors', () => {
  it('Lucky 1985-05-05 → day 176, wuku Ugu (#26)', () => {
    const p = pawukonFromDate(1985, 5, 5);
    expect(p.day).toBe(176);
    expect(p.wuku).toBe('Ugu');
    expect(p.wukuIndex).toBe(25); // 0-indexed; display #26
    expect(p.dayInWuku).toBe(0); // first day of wuku Ugu (Redite/Sunday)
  });

  it('2000-01-01 → day 70, wuku Sungsang (#10)', () => {
    const p = pawukonFromDate(2000, 1, 1);
    expect(p.day).toBe(70);
    expect(p.wuku).toBe('Sungsang');
    expect(p.wukuIndex).toBe(9);
    expect(p.dayInWuku).toBe(6); // last day of wuku (Saniscara/Saturday)
  });

  it('2024-01-01 → day 16, wuku Ukir (#3)', () => {
    const p = pawukonFromDate(2024, 1, 1);
    expect(p.day).toBe(16);
    expect(p.wuku).toBe('Ukir');
    expect(p.wukuIndex).toBe(2);
    expect(p.dayInWuku).toBe(1); // Soma/Monday
  });

  it('2026-05-12 → day 38, wuku Gumbreg (#6)', () => {
    const p = pawukonFromDate(2026, 5, 12);
    expect(p.day).toBe(38);
    expect(p.wuku).toBe('Gumbreg');
    expect(p.wukuIndex).toBe(5);
    expect(p.dayInWuku).toBe(2); // Anggara/Tuesday
  });
});

describe('pawukonOf — cycle invariants', () => {
  it('day-in-wuku 0 always corresponds to Sunday/Redite', () => {
    const start = gregorianToJDN(2026, 1, 1);
    for (let i = 0; i < 210; i++) {
      const p = pawukonOf(start + i);
      const expectedDow = p.dayInWuku;
      // Saptawara index = (jdn + 1) mod 7, where 0=Sunday
      const dow = ((start + i + 1) % 7 + 7) % 7;
      expect(dow).toBe(expectedDow);
    }
  });

  it('day repeats after exactly 210 days', () => {
    const start = gregorianToJDN(2026, 1, 1);
    expect(pawukonOf(start).day).toBe(pawukonOf(start + 210).day);
    expect(pawukonOf(start).wuku).toBe(pawukonOf(start + 210).wuku);
  });

  it('all 210 days hit every (wuku, dayInWuku) pair exactly once', () => {
    const start = gregorianToJDN(2026, 1, 1);
    const seen = new Set<string>();
    for (let i = 0; i < 210; i++) {
      const p = pawukonOf(start + i);
      seen.add(`${p.wukuIndex}:${p.dayInWuku}`);
    }
    expect(seen.size).toBe(210);
  });

  it('day=1 → wuku Sinta, dayInWuku=0; day=210 → wuku Watugunung, dayInWuku=6', () => {
    const start = gregorianToJDN(2026, 1, 1);
    for (let i = 0; i < 210; i++) {
      const p = pawukonOf(start + i);
      if (p.day === 1) {
        expect(p.wuku).toBe('Sinta');
        expect(p.dayInWuku).toBe(0);
      }
      if (p.day === 210) {
        expect(p.wuku).toBe('Watugunung');
        expect(p.dayInWuku).toBe(6);
      }
    }
  });
});
