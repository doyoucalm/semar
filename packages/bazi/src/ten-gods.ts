/**
 * Ten Gods (十神) — the relational labels each non-day-master stem receives,
 * computed from the day master's element + polarity.
 *
 * The 10 categories pair up by polarity:
 *
 *   same element, same polarity      → 比肩  Friend / Self
 *   same element, opposite polarity  → 劫财  Rob Wealth
 *   I generate, same polarity        → 食神  Eating God
 *   I generate, opposite polarity    → 伤官  Hurting Officer
 *   I overcome, same polarity        → 偏财  Indirect Wealth
 *   I overcome, opposite polarity    → 正财  Direct Wealth
 *   overcomes me, same polarity      → 七杀  Seven Killings
 *   overcomes me, opposite polarity  → 正官  Direct Officer
 *   generates me, same polarity      → 偏印  Indirect Resource
 *   generates me, opposite polarity  → 正印  Direct Resource
 */

import { STEMS, stemElement, stemYinYang, type Stem, type StemIdx } from './constants.js';

export const TEN_GODS = [
  '比肩', '劫财',
  '食神', '伤官',
  '偏财', '正财',
  '七杀', '正官',
  '偏印', '正印',
] as const;
export type TenGod = (typeof TEN_GODS)[number];

/** Generative cycle (我生): wood→fire→earth→metal→water→wood. */
const GENERATES: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};
/** Destructive cycle (我克): wood→earth→water→fire→metal→wood. */
const OVERCOMES: Record<string, string> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

export function tenGodOf(dayMaster: Stem, otherStem: Stem): TenGod {
  const dmIdx = STEMS.indexOf(dayMaster) as StemIdx;
  const oIdx = STEMS.indexOf(otherStem) as StemIdx;

  const dmElement = stemElement(dmIdx);
  const oElement = stemElement(oIdx);
  const samePolarity = stemYinYang(dmIdx) === stemYinYang(oIdx);

  if (oElement === dmElement)            return samePolarity ? '比肩' : '劫财';
  if (GENERATES[dmElement] === oElement) return samePolarity ? '食神' : '伤官';
  if (OVERCOMES[dmElement] === oElement) return samePolarity ? '偏财' : '正财';
  if (OVERCOMES[oElement] === dmElement) return samePolarity ? '七杀' : '正官';
  if (GENERATES[oElement] === dmElement) return samePolarity ? '偏印' : '正印';

  throw new Error(`Could not derive ten god: ${dayMaster} vs ${otherStem}`);
}
