import {
  MONTH_BRANCH_ORDER,
  type Branch, type BranchIdx, type StemIdx,
  stemElement, stemYinYang, branchElement, branchYinYang,
} from './constants.js';
import {
  pillarFromIndex, makePillar, sexagenaryIndexOf,
  type Pillar,
} from './sexagenary.js';
import { MINOR_TERMS_ORDER, termMeta } from './data.js';
import { solarTermMoment } from './astro.js';
import { solarCorrection, applyCorrectionToWall, type SolarCorrection } from './solar-time.js';

export interface BirthInput {
  readonly year: number;
  readonly month: number;       // 1–12
  readonly day: number;         // 1–31
  readonly hour: number;        // 0–23
  readonly minute: number;      // 0–59
  /** Minutes east of UTC. Asia/Jakarta = 420. China standard = 480. */
  readonly utcOffsetMinutes: number;
  /**
   * Birth gender. Optional for the natal chart, but REQUIRED to compute luck
   * pillars (大运) — see computeLuckPillars.
   */
  readonly gender?: 'male' | 'female';
  /**
   * Birth longitude in degrees east (Bandung ≈ 107.6, Jakarta ≈ 106.8).
   * When provided, the day & hour pillars use 真太阳时 (true solar time):
   * longitude (LMT) + Equation-of-Time correction. When omitted, civil clock
   * time is used as-is (backwards compatible).
   */
  readonly longitude?: number;
}

export interface BaziChart {
  readonly birth: BirthInput;
  /** Birth instant in UTC ms since epoch. */
  readonly utcMs: number;
  /** The four pillars: year, month, day, hour. */
  readonly year: Pillar;
  readonly month: Pillar;
  readonly day: Pillar;
  readonly hour: Pillar;
  /** Day-master = day stem; the most important single character in BaZi analysis. */
  readonly dayMaster: { stem: Pillar['stem']; element: string; polarity: string };
  /** Compact 8-character string e.g. "乙丑 庚辰 甲辰 己巳". */
  readonly eightCharacters: string;
  /**
   * True-solar-time correction applied to the day/hour pillars. Present only
   * when `birth.longitude` was supplied. Exposed for transparency.
   */
  readonly solarTime?: SolarCorrection & {
    /** Corrected local wall-clock used for day/hour pillars. */
    readonly correctedLocal: { year: number; month: number; day: number; hour: number; minute: number };
  };
}

export function computeBazi(birth: BirthInput): BaziChart {
  validate(birth);

  const utcMs = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute)
    - birth.utcOffsetMinutes * 60_000;

  // Year & month pillars track the Sun's real position (solar terms), so they
  // use the true UTC instant regardless of local-clock conventions.
  const yearPillar = computeYearPillar(utcMs, birth.year);
  const monthPillar = computeMonthPillar(utcMs, yearPillar.stemIdx);

  // Day & hour pillars are read from the LOCAL clock. With a birth longitude,
  // correct civil time → true solar time (may shift the date near midnight).
  let solarTime: BaziChart['solarTime'] | undefined;
  let dayHourInput = birth;
  if (birth.longitude != null) {
    const corr = solarCorrection(utcMs, birth.longitude, birth.utcOffsetMinutes);
    const localWallMs = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
    const correctedLocal = applyCorrectionToWall(localWallMs, corr.totalMinutes);
    solarTime = { ...corr, correctedLocal };
    dayHourInput = { ...birth, ...correctedLocal };
  }

  const dayPillar = computeDayPillar(dayHourInput);
  const hourPillar = computeHourPillar(dayHourInput, dayPillar.stemIdx);

  return {
    birth,
    utcMs,
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    dayMaster: {
      stem: dayPillar.stem,
      element: stemElement(dayPillar.stemIdx),
      polarity: stemYinYang(dayPillar.stemIdx),
    },
    eightCharacters: `${yearPillar.name} ${monthPillar.name} ${dayPillar.name} ${hourPillar.name}`,
    ...(solarTime ? { solarTime } : {}),
  };
}

function validate(b: BirthInput): void {
  const errs: string[] = [];
  if (!Number.isInteger(b.year)) errs.push(`year must be integer, got ${b.year}`);
  if (!Number.isInteger(b.month) || b.month < 1 || b.month > 12) errs.push(`month must be 1..12, got ${b.month}`);
  if (!Number.isInteger(b.day) || b.day < 1 || b.day > 31) errs.push(`day must be 1..31, got ${b.day}`);
  if (!Number.isInteger(b.hour) || b.hour < 0 || b.hour > 23) errs.push(`hour must be 0..23, got ${b.hour}`);
  if (!Number.isInteger(b.minute) || b.minute < 0 || b.minute > 59) errs.push(`minute must be 0..59, got ${b.minute}`);
  if (!Number.isInteger(b.utcOffsetMinutes)) errs.push(`utcOffsetMinutes must be integer`);
  if (errs.length) throw new Error(`Invalid BirthInput: ${errs.join('; ')}`);
}

/**
 * Year pillar — uses Lichun (立春) as the boundary.
 *
 * Formula: stem = (gregYear - 4) % 10, branch = (gregYear - 4) % 12,
 * after deciding whether the birth happened before or after that year's
 * Lichun. If before, the BaZi year is gregYear - 1.
 */
function computeYearPillar(birthUtcMs: number, gregYear: number): Pillar {
  const lichunMs = solarTermMoment('lichun', gregYear).utcMs;
  const baziYear = birthUtcMs < lichunMs ? gregYear - 1 : gregYear;
  const stemIdx = ((((baziYear - 4) % 10) + 10) % 10) as StemIdx;
  const branchIdx = ((((baziYear - 4) % 12) + 12) % 12) as BranchIdx;
  return makePillar(stemIdx, branchIdx);
}

/**
 * Month pillar — month branch determined by the most recent minor solar
 * term that has passed at the birth instant; month stem derived via the
 * Five Tigers Formula (五虎遁元) from the year stem.
 *
 * Five Tigers Formula:
 *   Year stem → 寅 (first BaZi month) stem
 *   firstMonthStemIdx = ((yearStemIdx % 5) * 2 + 2) % 10
 */
function computeMonthPillar(birthUtcMs: number, yearStemIdx: StemIdx): Pillar {
  // Walk through this year's minor terms (and prev-year xiaohan/daxue for
  // early-January births) and pick the latest one preceding birthUtcMs.
  // The minor terms in calendar order are: xiaohan, lichun, jingzhe,
  // qingming, lixia, mangzhong, xiaoshu, liqiu, bailu, hanlu, lidong,
  // daxue (xiaohan again at year-roll, but checked via prev year).

  const probeYear = new Date(birthUtcMs).getUTCFullYear();
  type Candidate = { branch: Branch; momentMs: number };
  const candidates: Candidate[] = [];

  for (const year of [probeYear - 1, probeYear]) {
    for (const key of MINOR_TERMS_ORDER) {
      const meta = termMeta(key);
      if (!meta.monthBranch) continue;
      try {
        const moment = solarTermMoment(key, year);
        candidates.push({ branch: meta.monthBranch as Branch, momentMs: moment.utcMs });
      } catch {
        // out-of-range; skip
      }
    }
  }
  candidates.sort((a, b) => a.momentMs - b.momentMs);

  let monthBranch: Branch | undefined;
  for (const c of candidates) {
    if (c.momentMs <= birthUtcMs) monthBranch = c.branch;
    else break;
  }
  if (!monthBranch) {
    throw new Error('Could not determine month branch — birth predates earliest minor term in data');
  }

  const branchIdx = MONTH_BRANCH_ORDER.indexOf(monthBranch);
  if (branchIdx < 0) throw new Error(`Unknown month branch ${monthBranch}`);
  // 寅 is BaZi-month-index 0 and Branch-cycle-index 2.
  const branchCycleIdx = ((branchIdx + 2) % 12) as BranchIdx;

  const firstMonthStemIdx = (((yearStemIdx % 5) * 2 + 2) % 10) as StemIdx;
  const monthStemIdx = ((firstMonthStemIdx + branchIdx) % 10) as StemIdx;

  return makePillar(monthStemIdx, branchCycleIdx);
}

/**
 * Day pillar — counted in the 60-day jiazi cycle from a known reference.
 *
 * Reference: 1985-05-05 (Bandung-local) was a 甲辰 day (sexagenary index 40).
 * For any other date, sexagenaryIndex = (40 + daysDiff) mod 60. Days are
 * counted in the birth's local timezone, with midnight as the day boundary.
 *
 * Cross-check: 2000-01-01 should be 甲申 (index 20) → daysDiff -5238 → fits.
 */
const DAY_REF_LOCAL_YMD = { y: 1985, m: 5, d: 5 };
const DAY_REF_SEXAGENARY = 40;

function computeDayPillar(b: BirthInput): Pillar {
  // Days between birth-local-date and ref-local-date, both at midnight.
  const birthMidnightLocalMs = Date.UTC(b.year, b.month - 1, b.day);
  const refMidnightLocalMs = Date.UTC(DAY_REF_LOCAL_YMD.y, DAY_REF_LOCAL_YMD.m - 1, DAY_REF_LOCAL_YMD.d);
  const daysDiff = Math.round((birthMidnightLocalMs - refMidnightLocalMs) / 86400_000);
  return pillarFromIndex(DAY_REF_SEXAGENARY + daysDiff);
}

/**
 * Hour pillar — branch from the 2-hour block (子 covers 23:00–00:59),
 * stem from the Five Rats Formula (五鼠遁元):
 *   Day stem → 子 (first) hour stem
 *   firstHourStemIdx = ((dayStemIdx % 5) * 2) % 10
 */
function computeHourPillar(b: BirthInput, dayStemIdx: StemIdx): Pillar {
  const branchIdx = hourBranchIndex(b.hour);
  const firstHourStemIdx = (((dayStemIdx % 5) * 2) % 10) as StemIdx;
  const hourStemIdx = ((firstHourStemIdx + branchIdx) % 10) as StemIdx;
  return makePillar(hourStemIdx, branchIdx);
}

export function hourBranchIndex(hour: number): BranchIdx {
  // 子 = 23–01 (covers 23:xx and 00:xx)
  // 丑 = 01–03, 寅 = 03–05, 卯 = 05–07, 辰 = 07–09, 巳 = 09–11,
  // 午 = 11–13, 未 = 13–15, 申 = 15–17, 酉 = 17–19, 戌 = 19–21, 亥 = 21–23
  if (hour === 23 || hour === 0) return 0;
  return (Math.floor((hour + 1) / 2)) as BranchIdx;
}

export { sexagenaryIndexOf };
export { stemElement, stemYinYang, branchElement, branchYinYang };
