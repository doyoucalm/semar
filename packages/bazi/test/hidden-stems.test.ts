import { describe, it, expect } from 'vitest';
import { hiddenStemsOf } from '../src/hidden-stems.js';

describe('hidden stems (藏干)', () => {
  it('辰 (Lucky\'s month/day branch) → 戊 (primary), 乙 (middle), 癸 (residual)', () => {
    const hs = hiddenStemsOf('辰');
    expect(hs.map((h) => h.stem)).toEqual(['戊', '乙', '癸']);
    expect(hs.map((h) => h.role)).toEqual(['primary', 'middle', 'residual']);
    expect(hs[0]!.weight).toBeCloseTo(0.6);
    expect(hs[1]!.weight).toBeCloseTo(0.3);
    expect(hs[2]!.weight).toBeCloseTo(0.1);
  });

  it('丑 (Lucky\'s year branch) → 己 癸 辛', () => {
    expect(hiddenStemsOf('丑').map((h) => h.stem)).toEqual(['己', '癸', '辛']);
  });

  it('巳 (Lucky\'s hour branch) → 丙 庚 戊', () => {
    expect(hiddenStemsOf('巳').map((h) => h.stem)).toEqual(['丙', '庚', '戊']);
  });

  it('卯 and 子 and 酉 each have only one hidden stem', () => {
    expect(hiddenStemsOf('卯')).toHaveLength(1);
    expect(hiddenStemsOf('子')).toHaveLength(1);
    expect(hiddenStemsOf('酉')).toHaveLength(1);
  });

  it('every branch has 1..3 hidden stems', () => {
    const all: import('../src/constants.js').Branch[] = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    for (const b of all) {
      const n = hiddenStemsOf(b).length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    }
  });
});
