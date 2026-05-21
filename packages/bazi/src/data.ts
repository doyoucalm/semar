import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type TermKey =
  | 'lichun' | 'yushui' | 'jingzhe' | 'chunfen'
  | 'qingming' | 'guyu' | 'lixia' | 'xiaoman'
  | 'mangzhong' | 'xiazhi' | 'xiaoshu' | 'dashu'
  | 'liqiu' | 'chushu' | 'bailu' | 'qiufen'
  | 'hanlu' | 'shuangjiang' | 'lidong' | 'xiaoxue'
  | 'daxue' | 'dongzhi' | 'xiaohan' | 'dahan';

export interface TermMeta {
  readonly key: TermKey;
  readonly cn: string;
  readonly en: string;
  readonly longitude: number;
  readonly kind: 'major' | 'minor';
  /** Only present on the 12 minor terms — the month branch they begin. */
  readonly monthBranch?: string;
}

export interface TermEntry {
  readonly year: number;
  readonly date: string; // YYYY-MM-DD
  readonly termKey: TermKey;
}

interface HkoData {
  readonly schemaVersion: number;
  readonly source: string;
  readonly yearRange: readonly [number, number];
  readonly terms: readonly TermMeta[];
  readonly entries: readonly TermEntry[];
}

let cached: HkoData | undefined;

export function loadHkoData(): HkoData {
  if (!cached) {
    const path = join(__dirname, '..', 'data', 'solar-terms.json');
    cached = JSON.parse(readFileSync(path, 'utf8')) as HkoData;
  }
  return cached;
}

/** All 12 minor terms, in astronomical order starting at Lichun. */
export const MINOR_TERMS_ORDER: readonly TermKey[] = [
  'lichun', 'jingzhe', 'qingming', 'lixia',
  'mangzhong', 'xiaoshu', 'liqiu', 'bailu',
  'hanlu', 'lidong', 'daxue', 'xiaohan',
];

export function termMeta(key: TermKey): TermMeta {
  const meta = loadHkoData().terms.find((t) => t.key === key);
  if (!meta) throw new Error(`Unknown term: ${key}`);
  return meta;
}
