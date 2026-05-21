/**
 * Render a NatalChart as plain text or Markdown. The summary is structured
 * and descriptive; Codex's voice rules apply only when an LLM later turns
 * this into prose. Here we just lay out the facts.
 */

import { PLANET_GLYPHS, SIGN_GLYPHS } from './constants.js';
import type { NatalChart, Placement } from './chart.js';
import type { TransitChart } from './transits.js';

export function renderChartText(chart: NatalChart): string {
  const lines: string[] = [];
  lines.push('═══ Natal Chart ═══');
  lines.push(formatInput(chart));
  lines.push('');
  lines.push(`Ascendant : ${formatDegree(chart.ascendant.degreeInSign)} ${chart.ascendant.sign} ${SIGN_GLYPHS[chart.ascendant.sign]}`);
  lines.push(`Midheaven : ${formatDegree(chart.midheaven.degreeInSign)} ${chart.midheaven.sign} ${SIGN_GLYPHS[chart.midheaven.sign]}`);
  lines.push('');
  lines.push('Placements');
  for (const p of chart.placements) {
    lines.push(formatPlacementLine(p));
  }
  lines.push('');
  lines.push('Houses (Whole Sign)');
  for (const h of chart.houses) {
    lines.push(`  ${pad2(h.number)}  ${h.sign} ${SIGN_GLYPHS[h.sign]}`);
  }
  if (chart.aspects.length > 0) {
    lines.push('');
    lines.push('Aspects');
    for (const a of chart.aspects) {
      lines.push(`  ${PLANET_GLYPHS[a.a]} ${a.a.padEnd(8)} ${kindGlyph(a.kind)} ${PLANET_GLYPHS[a.b]} ${a.b.padEnd(8)} (${formatDegree(a.orb)} orb)`);
    }
  }
  return lines.join('\n');
}

export function renderChartMarkdown(chart: NatalChart): string {
  const lines: string[] = [];
  lines.push('## Natal Chart');
  lines.push('');
  lines.push(`**Born:** ${formatInput(chart)}`);
  lines.push(`**Ascendant:** ${formatDegree(chart.ascendant.degreeInSign)} ${chart.ascendant.sign}`);
  lines.push(`**Midheaven:** ${formatDegree(chart.midheaven.degreeInSign)} ${chart.midheaven.sign}`);
  lines.push('');
  lines.push('### Placements');
  lines.push('');
  lines.push('| Planet | Sign | Degree | House | Dignity | R |');
  lines.push('|---|---|---|---|---|---|');
  for (const p of chart.placements) {
    lines.push(
      `| ${PLANET_GLYPHS[p.planet]} ${p.planet} | ${p.sign} ${SIGN_GLYPHS[p.sign]} | ${formatDegree(p.degreeInSign)} | ${p.house} | ${p.dignity ?? '—'} | ${p.retrograde ? '℞' : ''} |`,
    );
  }
  if (chart.aspects.length > 0) {
    lines.push('');
    lines.push('### Aspects');
    lines.push('');
    lines.push('| A | Aspect | B | Orb |');
    lines.push('|---|---|---|---|');
    for (const a of chart.aspects) {
      lines.push(`| ${a.a} | ${a.kind} | ${a.b} | ${formatDegree(a.orb)} |`);
    }
  }
  return lines.join('\n');
}

function formatInput(chart: NatalChart): string {
  const i = chart.input;
  const off = i.utcOffsetMinutes;
  const sign = off >= 0 ? '+' : '-';
  const absMin = Math.abs(off);
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
  const mm = String(absMin % 60).padStart(2, '0');
  return (
    `${i.year}-${pad2(i.month)}-${pad2(i.day)} ` +
    `${pad2(i.hour)}:${pad2(i.minute)} (UTC${sign}${hh}:${mm}), ` +
    `${i.latitude.toFixed(2)}°${i.latitude >= 0 ? 'N' : 'S'}, ` +
    `${i.longitude.toFixed(2)}°${i.longitude >= 0 ? 'E' : 'W'}`
  );
}

function formatPlacementLine(p: Placement): string {
  const rg = p.retrograde ? '℞' : ' ';
  const dignity = p.dignity ? ` [${p.dignity}]` : '';
  return `  ${PLANET_GLYPHS[p.planet]} ${p.planet.padEnd(8)} ${formatDegree(p.degreeInSign)} ${p.sign.padEnd(11)} ${SIGN_GLYPHS[p.sign]} ${rg}  H${pad2(p.house)}${dignity}`;
}

function formatDegree(d: number): string {
  // 12.345 → "12°20'"
  const deg = Math.floor(d);
  const min = Math.round((d - deg) * 60);
  return `${pad2(deg)}°${pad2(min)}'`;
}

function pad2(n: number): string { return String(n).padStart(2, '0'); }

function kindGlyph(kind: string): string {
  switch (kind) {
    case 'conjunction': return '☌';
    case 'sextile':     return '⚹';
    case 'square':      return '□';
    case 'trine':       return '△';
    case 'opposition':  return '☍';
    default:            return kind;
  }
}

export function renderTransitsText(t: TransitChart, natalChart?: NatalChart): string {
  const lines: string[] = [];
  const date = new Date(t.utcMs).toISOString().replace('T', ' ').slice(0, 16);
  lines.push('═══ Transits ═══');
  lines.push(`Moment (UTC): ${date}`);
  if (natalChart) {
    lines.push(`Natal: ${formatInput(natalChart)}`);
  }
  lines.push('');
  lines.push('Transiting planets');
  for (const p of t.placements) {
    const rg = p.retrograde ? '℞' : ' ';
    lines.push(`  ${PLANET_GLYPHS[p.planet]} ${p.planet.padEnd(8)} ${formatDegree(p.degreeInSign)} ${p.sign.padEnd(11)} ${SIGN_GLYPHS[p.sign]} ${rg}`);
  }
  if (t.aspectsToNatal.length > 0) {
    lines.push('');
    lines.push('Aspects to natal (tightest first)');
    for (const a of t.aspectsToNatal) {
      const motion = a.motion === 'applying' ? '↗' : a.motion === 'separating' ? '↘' : '•';
      lines.push(
        `  ${PLANET_GLYPHS[a.transit]} t.${a.transit.padEnd(8)} ${kindGlyph(a.kind)} ` +
        `${PLANET_GLYPHS[a.natal]} n.${a.natal.padEnd(8)} ` +
        `(${formatDegree(a.orb)} orb, ${motion} ${a.motion})`,
      );
    }
  } else {
    lines.push('');
    lines.push('No transit-to-natal aspects within orb.');
  }
  return lines.join('\n');
}

export function renderTransitsMarkdown(t: TransitChart, natalChart?: NatalChart): string {
  const lines: string[] = [];
  const date = new Date(t.utcMs).toISOString().replace('T', ' ').slice(0, 16);
  lines.push('## Transits');
  lines.push('');
  lines.push(`**Moment (UTC):** ${date}`);
  if (natalChart) {
    lines.push(`**Natal:** ${formatInput(natalChart)}`);
  }
  lines.push('');
  lines.push('### Transiting planets');
  lines.push('');
  lines.push('| Planet | Sign | Degree | R |');
  lines.push('|---|---|---|---|');
  for (const p of t.placements) {
    lines.push(`| ${PLANET_GLYPHS[p.planet]} ${p.planet} | ${p.sign} ${SIGN_GLYPHS[p.sign]} | ${formatDegree(p.degreeInSign)} | ${p.retrograde ? '℞' : ''} |`);
  }
  if (t.aspectsToNatal.length > 0) {
    lines.push('');
    lines.push('### Aspects to natal');
    lines.push('');
    lines.push('| Transit | Aspect | Natal | Orb | Motion |');
    lines.push('|---|---|---|---|---|');
    for (const a of t.aspectsToNatal) {
      lines.push(`| ${a.transit} | ${a.kind} | ${a.natal} | ${formatDegree(a.orb)} | ${a.motion} |`);
    }
  }
  return lines.join('\n');
}
