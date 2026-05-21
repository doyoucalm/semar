import { describe, it, expect } from 'vitest';
import { computeBazi } from '../src/engine.js';
import { analyzeChart } from '../src/analyze.js';

const LUCKY_BIRTH = {
  year: 1985, month: 5, day: 5, hour: 9, minute: 31,
  utcOffsetMinutes: 7 * 60,
};

describe("analyzeChart() on Lucky's chart", () => {
  const chart = computeBazi(LUCKY_BIRTH);
  const analysis = analyzeChart(chart);

  it('produces 4 enriched pillars', () => {
    expect(Object.keys(analysis.pillars).sort()).toEqual(['day', 'hour', 'month', 'year']);
  });

  it('day pillar has stemTenGod = null (day master itself)', () => {
    expect(analysis.pillars.day.stemTenGod).toBeNull();
  });

  it('year stem 乙 vs day master 甲 = 劫财', () => {
    expect(analysis.pillars.year.stemTenGod).toBe('劫财');
  });

  it('month stem 庚 vs day master 甲 = 七杀', () => {
    expect(analysis.pillars.month.stemTenGod).toBe('七杀');
  });

  it('hour stem 己 vs day master 甲 = 正财', () => {
    expect(analysis.pillars.hour.stemTenGod).toBe('正财');
  });

  it('year pillar hidden stems (in 丑) come with ten gods matching the fixture', () => {
    const hidden = analysis.pillars.year.hiddenStems;
    expect(hidden.map((h) => h.stem)).toEqual(['己', '癸', '辛']);
    expect(hidden.map((h) => h.tenGod)).toEqual(['正财', '正印', '正官']);
  });

  it('nayin per pillar matches the fixture: 海中金 / 白蜡金 / 覆灯火 / 大林木', () => {
    expect(analysis.pillars.year.nayin.cn).toBe('海中金');
    expect(analysis.pillars.month.nayin.cn).toBe('白蜡金');
    expect(analysis.pillars.day.nayin.cn).toBe('覆灯火');
    expect(analysis.pillars.hour.nayin.cn).toBe('大林木');
  });

  it('element distribution sums to roughly 8 + hidden stems', () => {
    const sum = Object.values(analysis.elements).reduce((s, v) => s + v, 0);
    expect(sum).toBeGreaterThan(8);  // 8 visible chars + hidden stems
  });

  it('day-master strength has a verdict', () => {
    expect(['strong', 'balanced', 'weak']).toContain(analysis.dayMasterStrength.verdict);
  });

  it('detects branch interactions (Lucky has 辰辰自刑 + 丑辰相破×2)', () => {
    const punishments = analysis.branchInteractions.filter((i) => i.kind === 'punishment');
    expect(punishments.length).toBeGreaterThan(0);
    const breaks = analysis.branchInteractions.filter((i) => i.kind === 'break');
    expect(breaks.length).toBeGreaterThan(0);
  });

  it('detects stem interactions (Lucky has 乙庚合金, 甲己合土, 甲庚相冲)', () => {
    const fiveCombos = analysis.stemInteractions.filter((i) => i.kind === 'fiveCombination');
    expect(fiveCombos).toHaveLength(2);
  });

  it('shen sha non-empty (天乙, 文昌, 金舆, 华盖, etc.)', () => {
    expect(analysis.shenSha.length).toBeGreaterThan(0);
    const keys = new Set(analysis.shenSha.map((s) => s.key));
    expect(keys.has('tianyi')).toBe(true);
    expect(keys.has('wenchang')).toBe(true);
    expect(keys.has('jinyu')).toBe(true);
    expect(keys.has('huagai')).toBe(true);
  });
});
