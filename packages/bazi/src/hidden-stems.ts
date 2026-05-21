import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Branch, Stem } from './constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type HiddenStemRole = 'primary' | 'middle' | 'residual';

export interface HiddenStem {
  readonly stem: Stem;
  readonly role: HiddenStemRole;
  readonly cnRole: string;
  readonly weight: number;
}

interface RawData {
  readonly roles: Record<HiddenStemRole, { cn: string; weight: number }>;
  readonly branches: Record<Branch, ReadonlyArray<{ stem: Stem; role: HiddenStemRole }>>;
}

let cached: RawData | undefined;
function load(): RawData {
  if (!cached) {
    const path = join(__dirname, '..', 'data', 'hidden-stems.json');
    cached = JSON.parse(readFileSync(path, 'utf8')) as RawData;
  }
  return cached;
}

export function hiddenStemsOf(branch: Branch): readonly HiddenStem[] {
  const data = load();
  const rows = data.branches[branch] ?? [];
  return rows.map((r) => ({
    stem: r.stem,
    role: r.role,
    cnRole: data.roles[r.role].cn,
    weight: data.roles[r.role].weight,
  }));
}
