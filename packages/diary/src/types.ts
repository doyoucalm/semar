/**
 * One Codex entry. Append-only — entries are not edited, only annotated
 * via follow-up entries that reference them.
 */
export interface DiaryEntry {
  readonly id: string;
  /** Full ISO instant the entry was created. */
  readonly createdAt: string;
  /** YYYY-MM-DD in the user's local timezone. The "diary day". */
  readonly date: string;
  /** The question asked, if any. Codex does not require one. */
  readonly question?: string;
  readonly readings: readonly EngineReading[];
  /** Optional human note added at write time. */
  readonly notes?: string;
}

export type EngineKey = 'iching' | 'tarot' | 'numerology' | 'bazi' | 'astrology';

export interface EngineReading {
  readonly engine: EngineKey;
  /** Engine-specific structured result. */
  readonly cast: unknown;
  /** One-line descriptive summary. Codex describes, never prescribes. */
  readonly summary: string;
}
