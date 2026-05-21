import { describe, it, expect } from 'vitest';
import { bureauOf, sexagenaryIndex } from '../src/bureau.js';

describe('sexagenaryIndex', () => {
  it('甲子 → 0, 乙丑 → 1, 癸亥 → 59', () => {
    expect(sexagenaryIndex('甲', '子')).toBe(0);
    expect(sexagenaryIndex('乙', '丑')).toBe(1);
    expect(sexagenaryIndex('癸', '亥')).toBe(59);
  });

  it('rejects invalid pairs', () => {
    expect(() => sexagenaryIndex('甲', '丑')).toThrow();
  });
});

describe('bureauOf — nayin lookup', () => {
  // Spot-check against the classical nayin table.
  it('甲子 → 海中金 → metal bureau', () => {
    expect(bureauOf('甲', '子').element).toBe('metal');
    expect(bureauOf('甲', '子').number).toBe(4);
  });

  it('丙寅 → 炉中火 → fire bureau', () => {
    expect(bureauOf('丙', '寅').element).toBe('fire');
    expect(bureauOf('丙', '寅').number).toBe(6);
  });

  it('壬午 → 杨柳木 → wood bureau', () => {
    expect(bureauOf('壬', '午').element).toBe('wood');
    expect(bureauOf('壬', '午').number).toBe(3);
  });

  it('丁亥 → 屋上土 → earth bureau', () => {
    expect(bureauOf('丁', '亥').element).toBe('earth');
    expect(bureauOf('丁', '亥').number).toBe(5);
  });

  it('壬子 → 桑柘木 → wood bureau', () => {
    expect(bureauOf('壬', '子').element).toBe('wood');
  });
});
