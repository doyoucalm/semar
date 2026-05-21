import { describe, expect, it } from 'vitest';
import { pancawaraOf, saptawaraOf, wetonFromDate, wetonOf } from '../src/weton.js';
import { gregorianToJDN } from '../src/jdn.js';

describe('pancawaraOf', () => {
  it('1985-05-05 → Paing (Pahing)', () => {
    expect(pancawaraOf(gregorianToJDN(1985, 5, 5))).toBe('Paing');
  });
  it('2000-01-01 → Umanis (Legi)', () => {
    expect(pancawaraOf(gregorianToJDN(2000, 1, 1))).toBe('Umanis');
  });
  it('2024-01-01 → Paing', () => {
    expect(pancawaraOf(gregorianToJDN(2024, 1, 1))).toBe('Paing');
  });
  it('2026-05-12 → Wage', () => {
    expect(pancawaraOf(gregorianToJDN(2026, 5, 12))).toBe('Wage');
  });
});

describe('saptawaraOf', () => {
  it('1985-05-05 → Redite (Sunday)', () => {
    expect(saptawaraOf(gregorianToJDN(1985, 5, 5))).toBe('Redite');
  });
  it('2000-01-01 → Saniscara (Saturday)', () => {
    expect(saptawaraOf(gregorianToJDN(2000, 1, 1))).toBe('Saniscara');
  });
  it('2024-01-01 → Soma (Monday)', () => {
    expect(saptawaraOf(gregorianToJDN(2024, 1, 1))).toBe('Soma');
  });
  it('2026-05-12 → Anggara (Tuesday)', () => {
    expect(saptawaraOf(gregorianToJDN(2026, 5, 12))).toBe('Anggara');
  });
});

describe('wetonOf', () => {
  it('Lucky 1985-05-05 = Minggu Pahing, neptu 14', () => {
    const w = wetonFromDate(1985, 5, 5);
    expect(w.hari).toBe('Minggu');
    expect(w.pasaran).toBe('Pahing');
    expect(w.idLabel).toBe('Minggu Pahing');
    expect(w.baliLabel).toBe('Redite Paing');
    expect(w.uripSaptawara).toBe(5);
    expect(w.uripPancawara).toBe(9);
    expect(w.neptu).toBe(14);
  });

  it('2024-01-01 = Senin Pahing, neptu 13', () => {
    const w = wetonFromDate(2024, 1, 1);
    expect(w.idLabel).toBe('Senin Pahing');
    expect(w.neptu).toBe(13); // Senin=4 + Pahing=9
  });

  it('2000-01-01 = Sabtu Legi, neptu 14', () => {
    const w = wetonFromDate(2000, 1, 1);
    expect(w.idLabel).toBe('Sabtu Legi');
    expect(w.neptu).toBe(14); // Sabtu=9 + Legi=5
  });

  it('produces 35 distinct weton across 35 consecutive days', () => {
    const start = gregorianToJDN(2026, 1, 1);
    const seen = new Set<string>();
    for (let i = 0; i < 35; i++) {
      seen.add(wetonOf(start + i).idLabel);
    }
    expect(seen.size).toBe(35);
  });

  it('weton cycle has period 35', () => {
    const start = gregorianToJDN(2026, 1, 1);
    expect(wetonOf(start).idLabel).toBe(wetonOf(start + 35).idLabel);
    expect(wetonOf(start).idLabel).toBe(wetonOf(start + 70).idLabel);
  });
});
