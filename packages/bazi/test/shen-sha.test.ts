import { describe, it, expect } from 'vitest';
import { findShenSha } from '../src/shen-sha.js';

// Lucky's pillars: 乙丑 庚辰 甲辰 己巳, day master 甲
const LUCKY = {
  year:  { stem: '乙' as const, branch: '丑' as const },
  month: { stem: '庚' as const, branch: '辰' as const },
  day:   { stem: '甲' as const, branch: '辰' as const },
  hour:  { stem: '己' as const, branch: '巳' as const },
};

describe("Shen Sha (神煞) — Lucky's chart", () => {
  const stars = findShenSha(LUCKY);

  it('天乙贵人 lands on year (丑 matches day-stem 甲 lookup [丑,未])', () => {
    const hit = stars.find((s) => s.key === 'tianyi');
    expect(hit?.slot).toBe('year');
    expect(hit?.branch).toBe('丑');
  });

  it('文昌贵人 lands on hour (巳 matches day-stem 甲 lookup [巳])', () => {
    const hit = stars.find((s) => s.key === 'wenchang');
    expect(hit?.slot).toBe('hour');
    expect(hit?.branch).toBe('巳');
  });

  it('金舆 lands on 辰 (matches day-stem 甲 lookup [辰]) — month and day both have it', () => {
    const hits = stars.filter((s) => s.key === 'jinyu');
    expect(hits).toHaveLength(2);
    expect(hits.map((h) => h.slot).sort()).toEqual(['day', 'month']);
  });

  it('华盖 lands on Lucky\'s chart (年 丑 → 丑 via 巳酉丑 triad; 日 辰 → 辰 via 申子辰 triad)', () => {
    const hits = stars.filter((s) => s.key === 'huagai');
    expect(hits.length).toBeGreaterThan(0);
    // All landings should be on 丑 or 辰 — never anywhere else.
    expect(hits.every((h) => h.branch === '丑' || h.branch === '辰')).toBe(true);
  });

  it('天罗地网 active for 甲乙 day stems on 辰巳 branches — Lucky has both', () => {
    const hits = stars.filter((s) => s.key === 'tianyuandinawang');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('空亡 for day pillar 甲辰 (xun 40–49) → voids 寅 and 卯; Lucky has neither, so no kongwang hits', () => {
    const hits = stars.filter((s) => s.key === 'kongwang');
    expect(hits).toEqual([]);
  });

  it('all star hits carry category and slot', () => {
    for (const hit of stars) {
      expect(hit.category).toBeTruthy();
      expect(hit.slot).toBeTruthy();
      expect(hit.cn).toBeTruthy();
      expect(hit.en).toBeTruthy();
    }
  });
});

describe('空亡 detection for a different day pillar', () => {
  it('day pillar 甲子 (xun 0–9) → voids 戌 and 亥', () => {
    const hits = findShenSha({
      year:  { stem: '丁', branch: '亥' },
      month: { stem: '癸', branch: '丑' },
      day:   { stem: '甲', branch: '子' },
      hour:  { stem: '甲', branch: '戌' },
    });
    const kongwang = hits.filter((h) => h.key === 'kongwang');
    expect(kongwang.map((h) => h.branch).sort()).toEqual(['亥', '戌']);
  });
});
