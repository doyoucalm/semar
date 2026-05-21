import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Nayin {
  readonly index: number;
  readonly pillar: string;
  readonly cn: string;
  readonly element: string;
  readonly en: string;
}

interface RawData {
  readonly entries: readonly Nayin[];
}

let cached: readonly Nayin[] | undefined;
function load(): readonly Nayin[] {
  if (!cached) {
    const path = join(__dirname, '..', 'data', 'nayin.json');
    cached = (JSON.parse(readFileSync(path, 'utf8')) as RawData).entries;
  }
  return cached;
}

export function nayinOfIndex(sexagenaryIndex: number): Nayin {
  const norm = ((sexagenaryIndex % 60) + 60) % 60;
  const row = load()[norm];
  if (!row) throw new Error(`No nayin for sexagenary index ${sexagenaryIndex}`);
  return row;
}
