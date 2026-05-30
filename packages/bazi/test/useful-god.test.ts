import { describe, it, expect } from 'vitest';
import { computeUsefulGod } from '../src/useful-god.js';
import type { ElementCounts, DayMasterStrength } from '../src/elements.js';

const counts = (o: Partial<ElementCounts>): ElementCounts =>
  ({ 木: 0, 火: 0, 土: 0, 金: 0, 水: 0, ...o });

describe('computeUsefulGod — 扶抑法', () => {
  it('weak wood day master favours 印(水) + 比劫(木)', () => {
    const str: DayMasterStrength = { supporting: 4.7, draining: 7.3, verdict: 'weak' };
    const ug = computeUsefulGod('甲', counts({ 木: 2, 水: 1, 火: 3, 土: 2, 金: 2 }), str);
    expect(ug.confidence).toBe('high');
    expect(ug.favorableElements).toEqual(['木', '水']);
    expect(ug.unfavorableElements).toEqual(['火', '土', '金']);
    expect(ug.favorableGroups).toEqual(['印', '比劫']);
  });

  it('strong wood day master favours 食伤(火)/财(土)/官杀(金)', () => {
    const str: DayMasterStrength = { supporting: 8, draining: 3, verdict: 'strong' };
    const ug = computeUsefulGod('甲', counts({ 木: 5, 水: 3 }), str);
    expect(ug.confidence).toBe('high');
    expect(ug.favorableElements).toEqual(['火', '土', '金']);
    expect(ug.unfavorableElements).toEqual(['木', '水']);
    expect(ug.favorableGroups).toEqual(['食伤', '财', '官杀']);
  });

  it('strong fire day master favours earth/metal/water', () => {
    const str: DayMasterStrength = { supporting: 7, draining: 2, verdict: 'strong' };
    const ug = computeUsefulGod('丙', counts({ 火: 4, 木: 3 }), str);
    expect(ug.dayMasterElement).toBe('火');
    // fire: output=土, wealth=金, officer=水
    expect(ug.favorableElements).toEqual(['土', '金', '水']);
  });

  it('balanced chart returns a low-confidence verdict', () => {
    const str: DayMasterStrength = { supporting: 5, draining: 5, verdict: 'balanced' };
    const ug = computeUsefulGod('甲', counts({ 木: 2, 水: 2, 火: 2, 土: 2, 金: 2 }), str);
    expect(ug.confidence).toBe('low');
    expect(ug.reasoning).toMatch(/balanced/i);
  });

  it('favourable and unfavourable sets never overlap', () => {
    const str: DayMasterStrength = { supporting: 3, draining: 8, verdict: 'weak' };
    const ug = computeUsefulGod('庚', counts({ 金: 1, 土: 1, 火: 4, 木: 3 }), str);
    for (const e of ug.favorableElements) {
      expect(ug.unfavorableElements).not.toContain(e);
    }
  });
});
