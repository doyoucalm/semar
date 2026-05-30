/**
 * 用神 — Useful God (favourable element) via the 扶抑法 (support/restrain) method.
 *
 * This is the single most-requested "conclusion" of a BaZi reading: given the
 * day master and the balance of the chart, which elements *help* the native
 * and which *hurt*. The 扶抑 method is the most widely taught:
 *
 *   - Day master WEAK  → it needs support → favour 印 (resource, generates DM)
 *                        and 比劫 (peers, same element). Restrain the drainers.
 *   - Day master STRONG → it needs draining → favour 食伤 (output), 财 (wealth),
 *                        官杀 (officer). Avoid more 印 / 比劫.
 *   - BALANCED → 扶抑 gives a weak signal; we lean by the support/drain ratio
 *                and flag low confidence (a real reading would consult 调候 etc).
 *
 * LIMITATION (be honest to API buyers): this is 扶抑 only. It does not yet model
 * 调候 (climatic balance), 通关 (bridging), 专旺/从格 (dominant/follow charts).
 * Those refine the result for edge charts and are a documented roadmap item.
 */

import { STEMS, stemElement, type Stem, type StemIdx } from './constants.js';
import { ELEMENTS, type Element, type ElementCounts, type DayMasterStrength } from './elements.js';

const GENERATES: Record<Element, Element> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};
const OVERCOMES: Record<Element, Element> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

export type TenGodGroup = '印' | '比劫' | '食伤' | '财' | '官杀';

export interface UsefulGod {
  readonly method: '扶抑';
  readonly dayMasterElement: Element;
  readonly strength: DayMasterStrength['verdict'];
  /** How confident the 扶抑 verdict is. 'low' for balanced charts. */
  readonly confidence: 'high' | 'low';
  readonly favorableElements: readonly Element[];
  readonly unfavorableElements: readonly Element[];
  readonly favorableGroups: readonly TenGodGroup[];
  readonly reasoning: string;
}

export function computeUsefulGod(
  dayMasterStem: Stem,
  distribution: ElementCounts,
  strength: DayMasterStrength,
): UsefulGod {
  const dmIdx = STEMS.indexOf(dayMasterStem) as StemIdx;
  const dm = stemElement(dmIdx) as Element;

  const resource = generatorOf(dm);   // 印  — generates DM
  const peer = dm;                     // 比劫 — same element
  const output = GENERATES[dm];        // 食伤 — DM generates
  const wealth = OVERCOMES[dm];        // 财  — DM overcomes
  const officer = overcomerOf(dm);     // 官杀 — overcomes DM

  const supportGroups: TenGodGroup[] = ['印', '比劫'];
  const drainGroups: TenGodGroup[] = ['食伤', '财', '官杀'];
  const supportEls = [resource, peer];
  const drainEls = [output, wealth, officer];

  // For balanced charts, lean on the numeric support/drain ratio rather than
  // punting entirely — but mark confidence low.
  let direction: 'support' | 'drain';
  let confidence: 'high' | 'low';
  if (strength.verdict === 'weak') {
    direction = 'support'; confidence = 'high';
  } else if (strength.verdict === 'strong') {
    direction = 'drain'; confidence = 'high';
  } else {
    direction = strength.supporting >= strength.draining ? 'drain' : 'support';
    confidence = 'low';
  }

  const favorableElements = dedupe(direction === 'support' ? supportEls : drainEls);
  const unfavorableElements = dedupe(direction === 'support' ? drainEls : supportEls);
  const favorableGroups = direction === 'support' ? supportGroups : drainGroups;

  const reasoning =
    `Day master ${dayMasterStem} (${dm}) is ${strength.verdict} ` +
    `(support ${strength.supporting} vs drain ${strength.draining}). ` +
    (direction === 'support'
      ? `It needs strengthening, so 印 (${resource}) and 比劫 (${peer}) are favourable; ` +
        `食伤/财/官杀 drain it.`
      : `It is well-rooted, so 食伤 (${output}), 财 (${wealth}) and 官杀 (${officer}) ` +
        `are favourable outlets; more 印/比劫 would overload it.`) +
    (confidence === 'low' ? ' Chart is near-balanced — treat as a weak 扶抑 signal.' : '');

  return {
    method: '扶抑',
    dayMasterElement: dm,
    strength: strength.verdict,
    confidence,
    favorableElements,
    unfavorableElements,
    favorableGroups,
    reasoning,
  };
}

function generatorOf(el: Element): Element {
  const found = (Object.entries(GENERATES) as [Element, Element][]).find(([, c]) => c === el);
  if (!found) throw new Error(`No generator for ${el}`);
  return found[0];
}
function overcomerOf(el: Element): Element {
  const found = (Object.entries(OVERCOMES) as [Element, Element][]).find(([, c]) => c === el);
  if (!found) throw new Error(`No overcomer for ${el}`);
  return found[0];
}
function dedupe(els: Element[]): Element[] {
  return ELEMENTS.filter((e) => els.includes(e));
}
