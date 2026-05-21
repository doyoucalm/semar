import { describe, it, expect } from 'vitest';
import { computeZWDSChart } from '../src/engine.js';
import {
  wenchangBranch, wenquBranch,
  zuofuBranch, youbiBranch,
  tiankuiBranch, tianyueBranch,
  lucunBranch, qingyangBranch, tuoluoBranch,
  huoxingBranch, lingxingBranch,
  dikongBranch, dijieBranch,
} from '../src/aux-stars.js';

describe('六吉 placement rules', () => {
  describe('文昌 / 文曲 (by hour)', () => {
    it('文昌 寅时 → 申', () => expect(wenchangBranch('寅')).toBe('申'));
    it('文昌 子时 → 戌', () => expect(wenchangBranch('子')).toBe('戌'));
    it('文昌 巳时 → 巳', () => expect(wenchangBranch('巳')).toBe('巳'));
    it('文昌 亥时 → 亥', () => expect(wenchangBranch('亥')).toBe('亥'));

    it('文曲 寅时 → 午', () => expect(wenquBranch('寅')).toBe('午'));
    it('文曲 子时 → 辰', () => expect(wenquBranch('子')).toBe('辰'));
    it('文曲 巳时 → 酉', () => expect(wenquBranch('巳')).toBe('酉'));
  });

  describe('左辅 / 右弼 (by lunar month)', () => {
    it('左辅 month 1 → 辰', () => expect(zuofuBranch(1)).toBe('辰'));
    it('左辅 month 3 → 午', () => expect(zuofuBranch(3)).toBe('午'));
    it('左辅 month 12 → 卯', () => expect(zuofuBranch(12)).toBe('卯'));

    it('右弼 month 1 → 戌', () => expect(youbiBranch(1)).toBe('戌'));
    it('右弼 month 3 → 申', () => expect(youbiBranch(3)).toBe('申'));
    it('右弼 month 12 → 亥', () => expect(youbiBranch(12)).toBe('亥'));
  });

  describe('天魁 / 天钺 (by year stem)', () => {
    it('甲: 天魁 丑, 天钺 未', () => {
      expect(tiankuiBranch('甲')).toBe('丑');
      expect(tianyueBranch('甲')).toBe('未');
    });
    it('乙: 天魁 子, 天钺 申', () => {
      expect(tiankuiBranch('乙')).toBe('子');
      expect(tianyueBranch('乙')).toBe('申');
    });
    it('辛: 天魁 午, 天钺 寅', () => {
      expect(tiankuiBranch('辛')).toBe('午');
      expect(tianyueBranch('辛')).toBe('寅');
    });
    it('癸: 天魁 卯, 天钺 巳', () => {
      expect(tiankuiBranch('癸')).toBe('卯');
      expect(tianyueBranch('癸')).toBe('巳');
    });
  });
});

describe('六煞 placement rules', () => {
  describe('禄存 → 擎羊 / 陀罗 (by year stem)', () => {
    it('甲: 禄存 寅, 擎羊 卯, 陀罗 丑', () => {
      expect(lucunBranch('甲')).toBe('寅');
      expect(qingyangBranch('甲')).toBe('卯');
      expect(tuoluoBranch('甲')).toBe('丑');
    });
    it('乙: 禄存 卯, 擎羊 辰, 陀罗 寅', () => {
      expect(lucunBranch('乙')).toBe('卯');
      expect(qingyangBranch('乙')).toBe('辰');
      expect(tuoluoBranch('乙')).toBe('寅');
    });
    it('癸: 禄存 子, 擎羊 丑, 陀罗 亥', () => {
      expect(lucunBranch('癸')).toBe('子');
      expect(qingyangBranch('癸')).toBe('丑');
      expect(tuoluoBranch('癸')).toBe('亥');
    });
  });

  describe('火星 / 铃星 (by year-branch trine + hour)', () => {
    it('丑年 寅时 (巳酉丑 trine): 火 巳, 铃 子', () => {
      // start 火=卯, 铃=戌; hour 寅 idx=2
      expect(huoxingBranch('丑', '寅')).toBe('巳');
      expect(lingxingBranch('丑', '寅')).toBe('子');
    });
    it('午年 子时 (寅午戌 trine, hour idx=0): 火 丑, 铃 卯', () => {
      expect(huoxingBranch('午', '子')).toBe('丑');
      expect(lingxingBranch('午', '子')).toBe('卯');
    });
    it('卯年 巳时 (亥卯未 trine, hour idx=5): 火 寅, 铃 卯', () => {
      // start 火=酉, 铃=戌; +5 → 寅, 卯
      expect(huoxingBranch('卯', '巳')).toBe('寅');
      expect(lingxingBranch('卯', '巳')).toBe('卯');
    });
  });

  describe('地空 / 地劫 (by hour)', () => {
    it('地空 寅时 → 酉, 地劫 寅时 → 丑', () => {
      expect(dikongBranch('寅')).toBe('酉');
      expect(dijieBranch('寅')).toBe('丑');
    });
    it('地空/地劫 子时: 地空 亥, 地劫 亥', () => {
      // hourIdx=0 → both at 亥
      expect(dikongBranch('子')).toBe('亥');
      expect(dijieBranch('子')).toBe('亥');
    });
  });
});

describe("Lucky's ZWDS — full aux-star placement", () => {
  const chart = computeZWDSChart({
    year: 1985, month: 5, day: 5,
    hour: 3, minute: 15,
    utcOffsetMinutes: 7 * 60,
    gender: 'male',
    lunarOverride: { year: 1985, month: 3, day: 16, isLeapMonth: false },
  });

  // 乙丑 year, lunar month 3, 寅时. Expected:
  //   文昌 申, 文曲 午, 左辅 午, 右弼 申,
  //   天魁 子, 天钺 申, 擎羊 辰, 陀罗 寅,
  //   火星 巳, 铃星 子, 地空 酉, 地劫 丑,
  //   禄存 卯.
  const findCell = (branch: string) => chart.cells.find((c) => c.branch === branch)!;

  it('places all 12 aux stars across the 12 palaces', () => {
    const allAux = chart.cells.flatMap((c) => c.auxStars);
    expect(allAux).toHaveLength(12);
    expect(new Set(allAux).size).toBe(12); // each unique
  });

  it('文昌 in 申 palace', () => {
    expect(findCell('申').auxStars).toContain('文昌');
  });

  it('文曲 and 左辅 both in 午 palace (coincidental for this chart)', () => {
    const wu = findCell('午');
    expect(wu.auxStars).toContain('文曲');
    expect(wu.auxStars).toContain('左辅');
  });

  it('天魁 in 子, 天钺 and 右弼 in 申 (天钺 + 右弼 both at 申)', () => {
    expect(findCell('子').auxStars).toContain('天魁');
    expect(findCell('申').auxStars).toContain('天钺');
    expect(findCell('申').auxStars).toContain('右弼');
  });

  it('擎羊 in 辰, 陀罗 in 寅 (flanking 禄存 at 卯)', () => {
    expect(findCell('辰').auxStars).toContain('擎羊');
    expect(findCell('寅').auxStars).toContain('陀罗');
    expect(findCell('卯').hasLucun).toBe(true);
  });

  it('火星 in 巳, 铃星 in 子', () => {
    expect(findCell('巳').auxStars).toContain('火星');
    expect(findCell('子').auxStars).toContain('铃星');
  });

  it('地空 in 酉, 地劫 in 丑', () => {
    expect(findCell('酉').auxStars).toContain('地空');
    expect(findCell('丑').auxStars).toContain('地劫');
  });

  it('exactly one palace has 禄存', () => {
    expect(chart.cells.filter((c) => c.hasLucun)).toHaveLength(1);
  });
});
