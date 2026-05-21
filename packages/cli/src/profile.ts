/**
 * Profile = the chart-holder's birth data plus optional lunar-date
 * override (since the lunar.ts auto-converter is still buggy).
 *
 * Stored at `~/.semar/profile.json` or under the SEMAR_HOME env var.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

export interface Profile {
  readonly name: string;
  readonly birth: {
    readonly year: number;   // Gregorian
    readonly month: number;  // 1..12
    readonly day: number;
    readonly hour: number;
    readonly minute: number;
    readonly utcOffsetMinutes: number;
    readonly latitude: number;
    readonly longitude: number;
    readonly gender: 'male' | 'female';
  };
  readonly lunarOverride?: {
    readonly year: number;
    readonly month: number;
    readonly day: number;
    readonly isLeapMonth: boolean;
  };
}

export function semarHome(): string {
  return process.env.SEMAR_HOME ?? join(homedir(), '.semar');
}

export function profilePath(): string {
  return join(semarHome(), 'profile.json');
}

export function diaryPath(): string {
  return join(semarHome(), 'diary.jsonl');
}

export function loadProfile(): Profile {
  const path = profilePath();
  if (!existsSync(path)) {
    throw new Error(
      `No profile at ${path}. Run 'semar profile init' or create the file manually.`,
    );
  }
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as Profile;
}

export function saveProfile(p: Profile): void {
  const path = profilePath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(p, null, 2), 'utf8');
}

/**
 * Lucky's verified profile — corrected birth time 2026-05-17.
 * Used as the default `init` fixture; safe to delete and replace.
 */
export const LUCKY_PROFILE: Profile = {
  name: 'Lucky Surya Haryadi',
  birth: {
    year: 1985, month: 5, day: 5,
    hour: 3, minute: 15,
    utcOffsetMinutes: 7 * 60,
    latitude: -6.91,
    longitude: 107.61,
    gender: 'male',
  },
  lunarOverride: { year: 1985, month: 3, day: 16, isLeapMonth: false },
};
