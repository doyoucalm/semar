/**
 * Render a ZWDS chart as the classical 4×4 board layout.
 *
 *   The 12 branches are laid out clockwise from 巳 (top-left) around
 *   the outer ring of a 4×4 grid; the centre 2×2 holds the chart
 *   summary. Layout (each branch is one cell):
 *
 *       巳   午   未   申
 *       辰  (info)    酉
 *       卯  (info)    戌
 *       寅   丑   子   亥
 */

import type { ZWDSChart, PalaceCell } from './engine.js';
import { type Branch } from './constants.js';

const BOARD: ReadonlyArray<Branch | null> = [
  '巳', '午', '未', '申',
  '辰', null, null, '酉',
  '卯', null, null, '戌',
  '寅', '丑', '子', '亥',
];

export function renderZWDSText(c: ZWDSChart): string {
  const lines: string[] = [];
  const cellsByBranch = new Map<Branch, PalaceCell>();
  for (const cell of c.cells) cellsByBranch.set(cell.branch, cell);

  lines.push('═══ Zi Wei Dou Shu Chart (紫微斗数) ═══');
  lines.push(`Lunar: ${c.lunar.year} year, ${c.lunar.isLeapMonth ? '闰' : ''}${c.lunar.month}月 ${c.lunar.day}日, hour ${c.hour}`);
  lines.push(`Year pillar: ${c.year.stem}${c.year.branch}     Bureau: ${c.bureau.cn}`);
  lines.push(`Self palace: ${c.selfPalaceBranch}     Body palace: ${c.bodyPalaceBranch}`);
  lines.push(`紫微 → ${c.ziweiBranch}     天府 → ${c.tianfuBranch}`);
  lines.push('');

  const cellW = 22;
  const renderCell = (branch: Branch | null): string => {
    if (!branch) return ' '.repeat(cellW) + '\n' + ' '.repeat(cellW) + '\n' + ' '.repeat(cellW) + '\n' + ' '.repeat(cellW);
    const cell = cellsByBranch.get(branch)!;
    const tag = (cell.isSelf ? '★命' : cell.isBody ? '☆身' : '  ');
    const mainLine = cell.mainStars.map((s) => {
      const trans = cell.transformations.find((t) => t.star === s);
      return trans ? `${s}${trans.transformation[1]}` : s;
    }).join(' ') || '——';
    const auxParts = cell.auxStars.slice();
    if (cell.hasLucun) auxParts.push('禄存' as unknown as typeof auxParts[number]);
    const auxLine = auxParts.length ? auxParts.join(' ') : '';
    return [
      `${cell.stem}${cell.branch} ${tag} `.padEnd(cellW, ' '),
      `${cell.palace}`.padEnd(cellW, ' '),
      mainLine.padEnd(cellW, ' '),
      auxLine.padEnd(cellW, ' '),
    ].join('\n');
  };

  // The board is 4 rows × 4 columns; each cell has 4 lines (stem+tag, palace, main, aux).
  const rows = [BOARD.slice(0, 4), BOARD.slice(4, 8), BOARD.slice(8, 12), BOARD.slice(12, 16)];
  for (const row of rows) {
    const cellsRendered = row.map(renderCell).map((c) => c.split('\n'));
    for (let line = 0; line < 4; line++) {
      lines.push(cellsRendered.map((cell) => cell[line] ?? '').join('│'));
    }
    lines.push('─'.repeat(cellW * 4 + 3));
  }

  return lines.join('\n');
}

export function renderZWDSMarkdown(c: ZWDSChart): string {
  const lines: string[] = [];
  lines.push(`## Zi Wei Dou Shu Chart (紫微斗数)`);
  lines.push('');
  lines.push(`**Lunar:** ${c.lunar.year} · ${c.lunar.isLeapMonth ? '闰' : ''}${c.lunar.month}月 ${c.lunar.day}日 · 时 ${c.hour}`);
  lines.push(`**Year pillar:** ${c.year.stem}${c.year.branch}`);
  lines.push(`**Bureau:** ${c.bureau.cn}`);
  lines.push(`**Self palace:** ${c.selfPalaceBranch}　**Body palace:** ${c.bodyPalaceBranch}`);
  lines.push(`**紫微:** ${c.ziweiBranch}　**天府:** ${c.tianfuBranch}`);
  lines.push('');
  lines.push('### Palace Cells');
  lines.push('');
  lines.push('| Branch | Palace | Stem | Main Stars | Aux Stars | Transformations | Marker |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const cell of c.cells) {
    const stars = cell.mainStars.join(' ') || '——';
    const auxParts = cell.auxStars.slice() as string[];
    if (cell.hasLucun) auxParts.push('禄存');
    const aux = auxParts.length ? auxParts.join(' ') : '';
    const trans = cell.transformations.map((t) => `${t.star}${t.transformation}`).join(', ') || '';
    const marker = cell.isSelf ? '★ 命' : cell.isBody ? '☆ 身' : '';
    lines.push(`| ${cell.branch} | ${cell.palace} | ${cell.stem} | ${stars} | ${aux} | ${trans} | ${marker} |`);
  }
  return lines.join('\n');
}
