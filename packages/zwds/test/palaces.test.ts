import { describe, it, expect } from 'vitest';
import {
  selfPalaceBranch, bodyPalaceBranch, placePalaces,
} from '../src/palaces.js';

describe('Self palace placement', () => {
  it('lunar month 1, hour 子 → 命宫 at 寅', () => {
    expect(selfPalaceBranch(1, '子')).toBe('寅');
  });

  it('lunar month 1, hour 午 → 命宫 at 申 (寅 − 6)', () => {
    expect(selfPalaceBranch(1, '午')).toBe('申');
  });

  it("Lucky: lunar month 3, hour 巳 → 命宫 at 亥", () => {
    // Lunar 3月: 寅 → 卯 → 辰 (month palace = 辰).
    // 巳 hour index = 5; from 辰 go back 5 → 亥.
    expect(selfPalaceBranch(3, '巳')).toBe('亥');
  });
});

describe('Body palace placement', () => {
  it('lunar month 1, hour 子 → 身宫 at 寅 (same as Self when hour=子)', () => {
    expect(bodyPalaceBranch(1, '子')).toBe('寅');
  });

  it("Lucky: lunar month 3, hour 巳 → 身宫 at 酉 (辰 + 5)", () => {
    expect(bodyPalaceBranch(3, '巳')).toBe('酉');
  });
});

describe('placePalaces — counter-clockwise from Self', () => {
  it('returns 12 distinct palace-branch pairs', () => {
    const { assignments } = placePalaces('寅');
    expect(assignments).toHaveLength(12);
    const branches = new Set(assignments.map((a) => a.branch));
    const palaces = new Set(assignments.map((a) => a.palace));
    expect(branches.size).toBe(12);
    expect(palaces.size).toBe(12);
  });

  it('命宫 sits on the given Self branch', () => {
    const { byPalace } = placePalaces('亥');
    expect(byPalace.get('命宫')).toBe('亥');
  });

  it("Lucky's chart: self at 亥 ⇒ 父母 at 子, 兄弟 at 戌", () => {
    // Counter-clockwise from 亥: 命=亥, 兄弟=戌, 夫妻=酉, 子女=申, 财帛=未,
    // 疾厄=午, 迁移=巳, 仆役=辰, 官禄=卯, 田宅=寅, 福德=丑, 父母=子.
    const { byPalace } = placePalaces('亥');
    expect(byPalace.get('命宫')).toBe('亥');
    expect(byPalace.get('兄弟')).toBe('戌');
    expect(byPalace.get('迁移')).toBe('巳'); // opposite of 命宫
    expect(byPalace.get('父母')).toBe('子');
  });
});
