/**
 * Compute a Zi Wei Dou Shu chart from a Gregorian birth moment.
 *
 * Output: 12 palaces (each on a branch, each with a stem and a main-
 * star list), plus the Self and Body palace, the year pillar, the
 * five-elements bureau, and the year-stem-driven transformations.
 */

import { hourBranchOf, type Branch, type Stem, type Palace, type MainStar, type AuxStar } from './constants.js';
import { toLunar, type LunarDate } from './lunar.js';
import { yearPillar } from './year-pillar.js';
import { selfPalaceBranch, bodyPalaceBranch, placePalaces } from './palaces.js';
import { palaceStems } from './palace-stems.js';
import { bureauOf, type Bureau } from './bureau.js';
import { ziweiBranch, tianfuBranch, placeMainStars, validatePlacements } from './main-stars.js';
import {
  transformationsFor, type Transformation,
} from './transformations.js';
import { placeAuxStars, lucunBranch } from './aux-stars.js';
import {
  computeDecadeLimits, activeDecadeLimit, suiAge, type DecadeLimit,
} from './decade-limits.js';

export interface ChartInput {
  readonly year: number;
  readonly month: number; // 1..12
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  /** Minutes east of UTC. Asia/Jakarta = 420. Beijing = 480. */
  readonly utcOffsetMinutes: number;
  /** 'male' | 'female' — determines decade-limit direction (not used in MVP). */
  readonly gender: 'male' | 'female';
  /**
   * Optional override: when provided, the engine skips the Gregorian→
   * lunar conversion (which has known edge-case bugs around leap
   * months) and uses the supplied lunar date directly. Most reliable
   * when verified against a trusted lunar calendar tool.
   */
  readonly lunarOverride?: LunarDate;
}

export interface PalaceCell {
  readonly palace: Palace;
  readonly branch: Branch;
  readonly stem: Stem;
  readonly mainStars: readonly MainStar[];
  readonly auxStars: readonly AuxStar[];
  /** 禄存 — luck-bearing point. Lives here when the palace branch matches. */
  readonly hasLucun: boolean;
  readonly transformations: ReadonlyArray<{ star: MainStar; transformation: Transformation }>;
  readonly isSelf: boolean;
  readonly isBody: boolean;
}

export interface ZWDSChart {
  readonly input: ChartInput;
  readonly utcMs: number;
  readonly lunar: LunarDate;
  readonly year: { stem: Stem; branch: Branch };
  readonly hour: Branch;
  readonly selfPalaceBranch: Branch;
  readonly bodyPalaceBranch: Branch;
  readonly bureau: Bureau;
  readonly ziweiBranch: Branch;
  readonly tianfuBranch: Branch;
  readonly cells: readonly PalaceCell[];
  /** All 12 大限 (decade limits) from 命宮, in sequence order. */
  readonly decadeLimits: readonly DecadeLimit[];
}

export { type DecadeLimit } from './decade-limits.js';

export function computeZWDSChart(input: ChartInput): ZWDSChart {
  validate(input);
  const utcMs =
    Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute) -
    input.utcOffsetMinutes * 60_000;

  const lunar = input.lunarOverride ?? toLunar(utcMs, input.utcOffsetMinutes);
  const yp = yearPillar(lunar.year);
  const hour = hourBranchOf(input.hour, input.minute);

  const selfBranch = selfPalaceBranch(lunar.month, hour);
  const bodyBranch = bodyPalaceBranch(lunar.month, hour);
  const { byBranch } = placePalaces(selfBranch);

  const stems = palaceStems(yp.stem);
  const selfStem = stems.get(selfBranch)!;
  const bureau = bureauOf(selfStem, selfBranch);

  const ziwei = ziweiBranch(bureau, lunar.day);
  const tianfu = tianfuBranch(ziwei);
  const placements = placeMainStars(ziwei, tianfu);
  validatePlacements(placements);

  const transTable = transformationsFor(yp.stem);
  const transformations: Array<{ star: MainStar; transformation: Transformation }> = [];
  for (const trans of ['化禄', '化权', '化科', '化忌'] as const) {
    const target = transTable[trans];
    // Only include the transformation if its target is one of the main stars.
    if (placements.some((p) => p.star === target)) {
      transformations.push({ star: target, transformation: trans });
    }
  }

  const auxPlacements = placeAuxStars({
    yearStem: yp.stem,
    yearBranch: yp.branch,
    lunarMonth: lunar.month,
    hour,
  });
  const lucun = lucunBranch(yp.stem);

  const cells: PalaceCell[] = [];
  for (const branch of [
    '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
  ] as readonly Branch[]) {
    const palace = byBranch.get(branch)!;
    const stem = stems.get(branch)!;
    const mainStarsHere = placements.filter((p) => p.branch === branch).map((p) => p.star);
    const auxStarsHere = auxPlacements.filter((p) => p.branch === branch).map((p) => p.star);
    const transHere = transformations.filter((t) => mainStarsHere.includes(t.star));
    cells.push({
      palace,
      branch,
      stem,
      mainStars: mainStarsHere,
      auxStars: auxStarsHere,
      hasLucun: branch === lucun,
      transformations: transHere,
      isSelf: branch === selfBranch,
      isBody: branch === bodyBranch,
    });
  }

  const decadeLimits = computeDecadeLimits(
    selfBranch,
    byBranch.get(selfBranch) ?? '命宫',
    bureau.number,
    yp.stem,
    input.gender,
    byBranch,
  );

  return {
    input,
    utcMs,
    lunar,
    year: yp,
    hour,
    selfPalaceBranch: selfBranch,
    bodyPalaceBranch: bodyBranch,
    bureau,
    ziweiBranch: ziwei,
    tianfuBranch: tianfu,
    cells,
    decadeLimits,
  };
}

function validate(b: ChartInput): void {
  const errs: string[] = [];
  if (!Number.isInteger(b.year)) errs.push(`year must be integer`);
  if (!Number.isInteger(b.month) || b.month < 1 || b.month > 12) errs.push(`month 1..12`);
  if (!Number.isInteger(b.day) || b.day < 1 || b.day > 31) errs.push(`day 1..31`);
  if (!Number.isInteger(b.hour) || b.hour < 0 || b.hour > 23) errs.push(`hour 0..23`);
  if (!Number.isInteger(b.minute) || b.minute < 0 || b.minute > 59) errs.push(`minute 0..59`);
  if (!Number.isInteger(b.utcOffsetMinutes)) errs.push(`utcOffsetMinutes integer`);
  if (b.gender !== 'male' && b.gender !== 'female') errs.push(`gender male|female`);
  if (errs.length) throw new Error(`Invalid ChartInput: ${errs.join('; ')}`);
}
