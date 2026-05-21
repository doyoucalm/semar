import { describe, it, expect } from 'vitest';
import { tenGodOf } from '../src/ten-gods.js';

describe("Ten Gods (十神) — Lucky's chart, day master 甲", () => {
  // Day master 甲 = yang wood.
  it('甲 vs 乙 (year stem) = 劫财 (same wood, opposite polarity)', () => {
    expect(tenGodOf('甲', '乙')).toBe('劫财');
  });

  it('甲 vs 庚 (month stem) = 七杀 (metal overcomes wood, same yang polarity)', () => {
    expect(tenGodOf('甲', '庚')).toBe('七杀');
  });

  it('甲 vs 己 (hour stem) = 正财 (wood overcomes earth, opposite polarity)', () => {
    expect(tenGodOf('甲', '己')).toBe('正财');
  });

  it('甲 vs 甲 = 比肩 (same wood, same yang)', () => {
    expect(tenGodOf('甲', '甲')).toBe('比肩');
  });

  it('甲 vs 丁 = 伤官 (wood generates fire, opposite polarity)', () => {
    expect(tenGodOf('甲', '丁')).toBe('伤官');
  });

  it('甲 vs 癸 = 正印 (water generates wood, opposite polarity)', () => {
    expect(tenGodOf('甲', '癸')).toBe('正印');
  });

  it('hidden stems of 丑 vs day master 甲 → 正财 / 正印 / 正官 (matches Lucky fixture)', () => {
    expect(tenGodOf('甲', '己')).toBe('正财'); // primary
    expect(tenGodOf('甲', '癸')).toBe('正印'); // middle
    expect(tenGodOf('甲', '辛')).toBe('正官'); // residual
  });

  it('rule symmetry — same element same polarity is always 比肩', () => {
    expect(tenGodOf('丙', '丙')).toBe('比肩');
    expect(tenGodOf('庚', '庚')).toBe('比肩');
  });
});
