import { describe, expect, it } from 'vitest';
import { computePawukonChart } from '../src/engine.js';
import {
  renderPawukonMarkdown,
  renderPawukonText,
  renderWetonMarkdown,
  renderWetonText,
} from '../src/render.js';

describe('computePawukonChart — Lucky 1985-05-05', () => {
  const chart = computePawukonChart({ year: 1985, month: 5, day: 5 });

  it('jdn = 2,446,191', () => {
    expect(chart.jdn).toBe(2446191);
  });
  it('weton = Minggu Pahing, neptu 14', () => {
    expect(chart.weton.idLabel).toBe('Minggu Pahing');
    expect(chart.weton.neptu).toBe(14);
  });
  it('pawukon day=176, wuku Ugu', () => {
    expect(chart.pawukon.day).toBe(176);
    expect(chart.pawukon.wuku).toBe('Ugu');
  });
  it('wewaran fully populated', () => {
    expect(chart.wewaran.triwara).toBe('Beteng');
    expect(chart.wewaran.sadwara).toBe('Aryang');
    expect(chart.wewaran.dasawara).toBe('Sri');
  });

  it('text renderers produce non-empty output', () => {
    expect(renderWetonText(chart)).toContain('Minggu Pahing');
    expect(renderPawukonText(chart)).toContain('Ugu');
  });
  it('markdown renderers include weton and wuku', () => {
    expect(renderWetonMarkdown(chart)).toContain('Minggu Pahing');
    expect(renderWetonMarkdown(chart)).toContain('**14**');
    expect(renderPawukonMarkdown(chart)).toContain('Ugu');
    expect(renderPawukonMarkdown(chart)).toContain('Jangur'); // Lucky's sangawara (post fix)
  });
});

describe('computePawukonChart — other anchors', () => {
  it('2000-01-01 = Sabtu Legi, wuku Sungsang', () => {
    const c = computePawukonChart({ year: 2000, month: 1, day: 1 });
    expect(c.weton.idLabel).toBe('Sabtu Legi');
    expect(c.pawukon.wuku).toBe('Sungsang');
    expect(c.pawukon.day).toBe(70);
  });
  it('2024-01-01 = Senin Pahing, wuku Ukir', () => {
    const c = computePawukonChart({ year: 2024, month: 1, day: 1 });
    expect(c.weton.idLabel).toBe('Senin Pahing');
    expect(c.pawukon.wuku).toBe('Ukir');
    expect(c.pawukon.day).toBe(16);
  });
});
