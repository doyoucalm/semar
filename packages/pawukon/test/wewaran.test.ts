import { describe, expect, it } from 'vitest';
import {
  astawaraOf,
  caturwaraOf,
  computeWewaran,
  dasawaraOf,
  dwiwaraOf,
  ekawaraOf,
  sadwaraOf,
  sangawaraOf,
  triwaraOf,
} from '../src/wewaran.js';

describe('wewaran — Lucky 1985-05-05 (p=176, Redite Paing)', () => {
  // Cross-checked against m.kalenderbali.org/artihari.php?bl=5&tg=5&th=1985
  // (2026-05-19 spot-check). Page shows Eka Wara "-" because urip 5+9=14 is even.
  it('ekawara = null (urip 14 even → Pepet=Menga side)', () => {
    expect(ekawaraOf('Paing', 'Redite')).toBeNull();
  });
  it('dwiwara = Menga (urip 5+9=14 mod 2 = 0)', () => {
    expect(dwiwaraOf('Paing', 'Redite')).toBe('Menga');
  });
  it('triwara at p=176 = Beteng', () => {
    expect(triwaraOf(176)).toBe('Beteng');
  });
  it('caturwara at p=176 = Laba', () => {
    expect(caturwaraOf(176)).toBe('Laba');
  });
  it('sadwara at p=176 = Aryang', () => {
    expect(sadwaraOf(176)).toBe('Aryang');
  });
  it('astawara at p=176 = Brahma (post-hold (176-3)%8 = 5 → Brahma)', () => {
    expect(astawaraOf(176)).toBe('Brahma');
  });
  it('sangawara at p=176 = Jangur (post-hold (176-4)%9 = 1 → Jangur)', () => {
    expect(sangawaraOf(176)).toBe('Jangur');
  });
  it('dasawara = Sri (urip 14 mod 10 = 4)', () => {
    expect(dasawaraOf('Paing', 'Redite')).toBe('Sri');
  });
});

describe('Hold windows at p=71..73 (Caturwara, Astawara) and p=1..4 (Sangawara)', () => {
  // Hold-name and post-hold-offset confirmed against m.kalenderbali.org/artihari
  // for all of p=70..75 on 2026-06-13..18 during the 2026-05-19 spot-check.

  it('caturwara: p=70 Laba (pre-hold natural)', () => {
    expect(caturwaraOf(70)).toBe('Laba'); // (70-1)%4 = 1 → Laba
  });
  it('caturwara: p=71..73 all Laba (held)', () => {
    expect(caturwaraOf(71)).toBe('Laba');
    expect(caturwaraOf(72)).toBe('Laba');
    expect(caturwaraOf(73)).toBe('Laba');
  });
  it('caturwara: p=74 Menala (post-hold (74-3)%4 = 3)', () => {
    expect(caturwaraOf(74)).toBe('Menala');
  });
  it('caturwara: p=75 Sri (post-hold (75-3)%4 = 0)', () => {
    expect(caturwaraOf(75)).toBe('Sri');
  });

  it('astawara: p=70 Brahma (pre-hold natural)', () => {
    expect(astawaraOf(70)).toBe('Brahma'); // (70-1)%8 = 5 → Brahma
  });
  it('astawara: p=71..73 all Kala (held)', () => {
    expect(astawaraOf(71)).toBe('Kala');
    expect(astawaraOf(72)).toBe('Kala');
    expect(astawaraOf(73)).toBe('Kala');
  });
  it('astawara: p=74 Uma (post-hold (74-3)%8 = 7)', () => {
    expect(astawaraOf(74)).toBe('Uma');
  });
  it('astawara: p=75 Sri (post-hold (75-3)%8 = 0)', () => {
    expect(astawaraOf(75)).toBe('Sri');
  });

  it('sangawara: p=1..4 all Dangu (held start)', () => {
    expect(sangawaraOf(1)).toBe('Dangu');
    expect(sangawaraOf(2)).toBe('Dangu');
    expect(sangawaraOf(3)).toBe('Dangu');
    expect(sangawaraOf(4)).toBe('Dangu');
  });
  it('sangawara: p=5 Jangur (natural cycle resumes, (5-4)%9 = 1)', () => {
    expect(sangawaraOf(5)).toBe('Jangur');
    expect(sangawaraOf(6)).toBe('Gigis');
  });
});

describe('Wewaran spot-check vs m.kalenderbali.org/artihari (2026-05-19)', () => {
  // 13 paired data points covering pre/hold/post zones plus a wider sample.
  // Source: m.kalenderbali.org/artihari.php?bl={M}&tg={D}&th={Y}
  const CASES: Array<[number, string, { triwara: string; caturwara: string; sadwara: string; astawara: string; sangawara: string; dasawara: string; ekawara: string | null; pancawara: 'Umanis' | 'Paing' | 'Pon' | 'Wage' | 'Kliwon'; saptawara: 'Redite' | 'Soma' | 'Anggara' | 'Buda' | 'Wraspati' | 'Sukra' | 'Saniscara' }]> = [
    [1, '2026-04-05', { triwara: 'Pasah', caturwara: 'Sri', sadwara: 'Tungleh', astawara: 'Sri', sangawara: 'Dangu', dasawara: 'Sri', ekawara: null, pancawara: 'Paing', saptawara: 'Redite' }],
    [2, '2026-04-06', { triwara: 'Beteng', caturwara: 'Laba', sadwara: 'Aryang', astawara: 'Indra', sangawara: 'Dangu', dasawara: 'Pati', ekawara: 'Luang', pancawara: 'Pon', saptawara: 'Soma' }],
    [3, '2026-04-07', { triwara: 'Kajeng', caturwara: 'Jaya', sadwara: 'Urukung', astawara: 'Guru', sangawara: 'Dangu', dasawara: 'Raja', ekawara: 'Luang', pancawara: 'Wage', saptawara: 'Anggara' }],
    [4, '2026-04-08', { triwara: 'Pasah', caturwara: 'Menala', sadwara: 'Paniron', astawara: 'Yama', sangawara: 'Dangu', dasawara: 'Manuh', ekawara: 'Luang', pancawara: 'Kliwon', saptawara: 'Buda' }],
    [5, '2026-04-09', { triwara: 'Beteng', caturwara: 'Sri', sadwara: 'Was', astawara: 'Ludra', sangawara: 'Jangur', dasawara: 'Duka', ekawara: 'Luang', pancawara: 'Umanis', saptawara: 'Wraspati' }],
    [45, '2026-05-19', { triwara: 'Kajeng', caturwara: 'Sri', sadwara: 'Urukung', astawara: 'Ludra', sangawara: 'Erangan', dasawara: 'Dewa', ekawara: null, pancawara: 'Umanis', saptawara: 'Anggara' }],
    [70, '2026-06-13', { triwara: 'Pasah', caturwara: 'Laba', sadwara: 'Paniron', astawara: 'Brahma', sangawara: 'Nohan', dasawara: 'Sri', ekawara: null, pancawara: 'Umanis', saptawara: 'Saniscara' }],
    [71, '2026-06-14', { triwara: 'Beteng', caturwara: 'Laba', sadwara: 'Was', astawara: 'Kala', sangawara: 'Ogan', dasawara: 'Sri', ekawara: null, pancawara: 'Paing', saptawara: 'Redite' }],
    [72, '2026-06-15', { triwara: 'Kajeng', caturwara: 'Laba', sadwara: 'Maulu', astawara: 'Kala', sangawara: 'Erangan', dasawara: 'Pati', ekawara: 'Luang', pancawara: 'Pon', saptawara: 'Soma' }],
    [73, '2026-06-16', { triwara: 'Pasah', caturwara: 'Laba', sadwara: 'Tungleh', astawara: 'Kala', sangawara: 'Urungan', dasawara: 'Raja', ekawara: 'Luang', pancawara: 'Wage', saptawara: 'Anggara' }],
    [74, '2026-06-17', { triwara: 'Beteng', caturwara: 'Menala', sadwara: 'Aryang', astawara: 'Uma', sangawara: 'Tulus', dasawara: 'Manuh', ekawara: 'Luang', pancawara: 'Kliwon', saptawara: 'Buda' }],
    [75, '2026-06-18', { triwara: 'Kajeng', caturwara: 'Sri', sadwara: 'Urukung', astawara: 'Sri', sangawara: 'Dadi', dasawara: 'Duka', ekawara: 'Luang', pancawara: 'Umanis', saptawara: 'Wraspati' }],
    [176, '1985-05-05', { triwara: 'Beteng', caturwara: 'Laba', sadwara: 'Aryang', astawara: 'Brahma', sangawara: 'Jangur', dasawara: 'Sri', ekawara: null, pancawara: 'Paing', saptawara: 'Redite' }],
  ];

  for (const [p, gregorian, expected] of CASES) {
    it(`p=${p} (${gregorian}) matches kalenderbali.org`, () => {
      expect(triwaraOf(p)).toBe(expected.triwara);
      expect(caturwaraOf(p)).toBe(expected.caturwara);
      expect(sadwaraOf(p)).toBe(expected.sadwara);
      expect(astawaraOf(p)).toBe(expected.astawara);
      expect(sangawaraOf(p)).toBe(expected.sangawara);
      expect(dasawaraOf(expected.pancawara, expected.saptawara)).toBe(expected.dasawara);
      expect(ekawaraOf(expected.pancawara, expected.saptawara)).toBe(expected.ekawara);
    });
  }
});

describe('Pure modular cycles — full-cycle coverage', () => {
  it('triwara covers all 3 names within 3 days', () => {
    const names = new Set([triwaraOf(1), triwaraOf(2), triwaraOf(3)]);
    expect(names.size).toBe(3);
  });
  it('sadwara covers all 6 names within 6 days', () => {
    const names = new Set([1, 2, 3, 4, 5, 6].map(sadwaraOf));
    expect(names.size).toBe(6);
  });
});

describe('computeWewaran — bundle for Lucky', () => {
  it('returns full set for p=176, Paing Redite (verified against kalenderbali.org)', () => {
    const w = computeWewaran(176, 'Paing', 'Redite');
    expect(w).toEqual({
      ekawara: null,
      dwiwara: 'Menga',
      triwara: 'Beteng',
      caturwara: 'Laba',
      pancawara: 'Paing',
      sadwara: 'Aryang',
      saptawara: 'Redite',
      astawara: 'Brahma',
      sangawara: 'Jangur',
      dasawara: 'Sri',
    });
  });
});
