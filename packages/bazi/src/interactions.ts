import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  STEMS, BRANCHES,
  stemElement, stemYinYang, branchElement,
  type Branch, type Stem, type StemIdx, type BranchIdx,
} from './constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type PillarSlot = 'year' | 'month' | 'day' | 'hour';

export type BranchInteractionKind =
  | 'sixCombination'    // 六合
  | 'threeCombination'  // 三合 (full triad)
  | 'threeConference'   // 三会 (full triad)
  | 'clash'             // 冲
  | 'punishment'        // 刑
  | 'break'             // 破
  | 'harm';             // 害

export interface BranchInteraction {
  readonly kind: BranchInteractionKind;
  readonly slots: readonly PillarSlot[];
  readonly branches: readonly Branch[];
  /** Element produced (combinations / conferences); null otherwise. */
  readonly element?: string | null;
  readonly name: string;
}

export type StemInteractionKind =
  | 'fiveCombination'   // 天干五合
  | 'clash'             // 相冲
  | 'control';          // 相克

export interface StemInteraction {
  readonly kind: StemInteractionKind;
  readonly slots: readonly PillarSlot[];
  readonly stems: readonly Stem[];
  readonly element?: string | null;
  readonly name: string;
}

interface BranchData {
  readonly sixCombinations: { branches: [Branch, Branch]; element: string | null; name: string }[];
  readonly threeCombinations: { branches: [Branch, Branch, Branch]; element: string; name: string }[];
  readonly threeConferences: { branches: [Branch, Branch, Branch]; element: string; name: string }[];
  readonly clashes: { branches: [Branch, Branch] }[];
  readonly punishments: { branches: Branch[]; name: string }[];
  readonly breaks: { branches: [Branch, Branch] }[];
  readonly harms: { branches: [Branch, Branch] }[];
}
interface StemData {
  readonly combinations: { stems: [Stem, Stem]; element: string; name: string }[];
  readonly clashes: { stems: [Stem, Stem]; name: string }[];
}

let branchData: BranchData | undefined;
let stemData: StemData | undefined;
function loadBranch(): BranchData {
  if (!branchData) {
    branchData = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'branch-interactions.json'), 'utf8')) as BranchData;
  }
  return branchData;
}
function loadStem(): StemData {
  if (!stemData) {
    stemData = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'stem-interactions.json'), 'utf8')) as StemData;
  }
  return stemData;
}

export interface ChartPillars {
  readonly year: { stem: Stem; branch: Branch };
  readonly month: { stem: Stem; branch: Branch };
  readonly day: { stem: Stem; branch: Branch };
  readonly hour: { stem: Stem; branch: Branch };
}

const SLOTS: readonly PillarSlot[] = ['year', 'month', 'day', 'hour'];

export function findBranchInteractions(pillars: ChartPillars): BranchInteraction[] {
  const data = loadBranch();
  const slotsAndBranches = SLOTS.map((s) => ({ slot: s, branch: pillars[s].branch }));
  const out: BranchInteraction[] = [];

  // Pairwise — six combinations, clashes, breaks, harms.
  for (let i = 0; i < slotsAndBranches.length; i++) {
    for (let j = i + 1; j < slotsAndBranches.length; j++) {
      const A = slotsAndBranches[i]!;
      const B = slotsAndBranches[j]!;
      const pair: [Branch, Branch] = [A.branch, B.branch];

      for (const c of data.sixCombinations) {
        if (matches(pair, c.branches)) {
          out.push({ kind: 'sixCombination', slots: [A.slot, B.slot], branches: c.branches, element: c.element, name: c.name });
        }
      }
      for (const c of data.clashes) {
        if (matches(pair, c.branches)) {
          out.push({ kind: 'clash', slots: [A.slot, B.slot], branches: c.branches, name: `${c.branches[0]}${c.branches[1]}相冲` });
        }
      }
      for (const c of data.breaks) {
        if (matches(pair, c.branches)) {
          out.push({ kind: 'break', slots: [A.slot, B.slot], branches: c.branches, name: `${c.branches[0]}${c.branches[1]}相破` });
        }
      }
      for (const c of data.harms) {
        if (matches(pair, c.branches)) {
          out.push({ kind: 'harm', slots: [A.slot, B.slot], branches: c.branches, name: `${c.branches[0]}${c.branches[1]}相害` });
        }
      }
    }
  }

  // Punishments — handle both pair (子卯) and triad (寅巳申, 丑戌未) and self-punishment.
  for (const p of data.punishments) {
    const slotsHit = findAllOccurrences(slotsAndBranches, p.branches);
    if (slotsHit) {
      out.push({ kind: 'punishment', slots: slotsHit.slots, branches: p.branches, name: p.name });
    }
  }

  // Triple combinations / conferences — require all 3 branches present.
  for (const t of data.threeCombinations) {
    const slotsHit = findAllOccurrences(slotsAndBranches, t.branches);
    if (slotsHit) {
      out.push({ kind: 'threeCombination', slots: slotsHit.slots, branches: t.branches, element: t.element, name: t.name });
    }
  }
  for (const t of data.threeConferences) {
    const slotsHit = findAllOccurrences(slotsAndBranches, t.branches);
    if (slotsHit) {
      out.push({ kind: 'threeConference', slots: slotsHit.slots, branches: t.branches, element: t.element, name: t.name });
    }
  }

  return out;
}

export function findStemInteractions(pillars: ChartPillars): StemInteraction[] {
  const data = loadStem();
  const slotsAndStems = SLOTS.map((s) => ({ slot: s, stem: pillars[s].stem }));
  const out: StemInteraction[] = [];

  for (let i = 0; i < slotsAndStems.length; i++) {
    for (let j = i + 1; j < slotsAndStems.length; j++) {
      const A = slotsAndStems[i]!;
      const B = slotsAndStems[j]!;
      const pair: [Stem, Stem] = [A.stem, B.stem];

      for (const c of data.combinations) {
        if (matches(pair, c.stems)) {
          out.push({ kind: 'fiveCombination', slots: [A.slot, B.slot], stems: c.stems, element: c.element, name: c.name });
        }
      }
      for (const c of data.clashes) {
        if (matches(pair, c.stems)) {
          out.push({ kind: 'clash', slots: [A.slot, B.slot], stems: c.stems, name: c.name });
        }
      }

      // Control (相克): different element where one overcomes the other.
      const overcame = stemOvercomes(A.stem, B.stem);
      if (overcame) {
        out.push({
          kind: 'control',
          slots: [A.slot, B.slot],
          stems: overcame,
          name: `${overcame[0]}${overcame[1]}相尅`,
        });
      }
    }
  }
  return out;
}

function matches<T>(observed: readonly T[], required: readonly T[]): boolean {
  if (observed.length !== required.length) return false;
  const a = [...observed].sort();
  const b = [...required].sort();
  return a.every((x, i) => x === b[i]);
}

function findAllOccurrences<T>(
  bag: { slot: PillarSlot; branch?: T; stem?: T }[],
  required: readonly T[],
): { slots: PillarSlot[] } | null {
  const slots: PillarSlot[] = [];
  const consumed = new Set<number>();
  for (const r of required) {
    const i = bag.findIndex((b, idx) => !consumed.has(idx) && (b.branch === r || b.stem === r));
    if (i === -1) return null;
    consumed.add(i);
    slots.push(bag[i]!.slot);
  }
  return { slots };
}

// Five-element destructive: wood→earth→water→fire→metal→wood.
const STEM_OVERCOMES: Record<string, string> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

function stemOvercomes(a: Stem, b: Stem): readonly [Stem, Stem] | null {
  const aEl = stemElement(STEMS.indexOf(a) as StemIdx);
  const bEl = stemElement(STEMS.indexOf(b) as StemIdx);
  if (STEM_OVERCOMES[aEl] === bEl) return [a, b];
  if (STEM_OVERCOMES[bEl] === aEl) return [b, a];
  return null;
}

// re-exports — keep loader-style helpers within the module
export { stemYinYang, branchElement };
