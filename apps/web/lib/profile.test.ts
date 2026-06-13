import { describe, it, expect } from 'vitest';
import { todayLocal, PROFILE } from './profile';

// Characterization tests — pin the WIB date logic. The daily/diary/chat surfaces
// all derive "today" from this; a refactor must keep it deterministic and on +7.

describe('todayLocal', () => {
  it('is deterministic when given an instant', () => {
    const ms = Date.UTC(2026, 5, 14, 3, 0); // 2026-06-14 03:00 UTC = 10:00 WIB
    expect(todayLocal(ms)).toBe('2026-06-14');
    expect(todayLocal(ms)).toBe(todayLocal(ms));
  });

  it('applies the +7 (WIB) offset across the UTC midnight boundary', () => {
    // 2026-06-13 20:00 UTC = 2026-06-14 03:00 WIB → must read as the 14th.
    const ms = Date.UTC(2026, 5, 13, 20, 0);
    expect(todayLocal(ms)).toBe('2026-06-14');
  });

  it('returns YYYY-MM-DD', () => {
    expect(todayLocal(Date.UTC(2000, 0, 1, 12, 0))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('PROFILE invariants', () => {
  it('birth offset is WIB (+7h = 420m)', () => {
    expect(PROFILE.birth.utcOffsetMinutes).toBe(420);
  });
});
