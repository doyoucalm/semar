import { randomUUID } from 'node:crypto';
import {
  computeTransits,
  type ComputeTransitsOptions,
  type NatalChart,
  type TransitAspect,
  type TransitChart,
} from '@semar/astrology';
import { castHexagram, mulberry32 as ichingMulberry, type Rng } from '@semar/iching';
import { drawCards } from '@semar/tarot';
import type { DiaryEntry, EngineReading } from './types.js';
import type { DiaryStorage } from './storage.js';

export interface AskDailyOptions {
  readonly storage: DiaryStorage;
  /** Optional — Codex does not require a question. */
  readonly question?: string;
  /** Optional human note. */
  readonly notes?: string;
  /** Seedable PRNG. Defaults to Math.random. Use the same seed to replay. */
  readonly rng?: Rng;
  /** Override the instant — useful in tests. Defaults to now(). */
  readonly now?: () => Date;
  /** Override the local timezone offset in minutes (default: host TZ). */
  readonly localTimezoneOffsetMinutes?: number;
  /**
   * Optional natal chart. When provided, today's transits-to-natal are
   * included as an `astrology` reading. Omit for an iching+tarot-only entry.
   */
  readonly natalChart?: NatalChart;
  /** Forwarded to {@link computeTransits} (orb overrides, planet filters). */
  readonly transitOptions?: ComputeTransitsOptions;
}

/**
 * The Codex daily ritual. Casts one hexagram and pulls one card, writes the
 * entry to storage, returns it. The summary strings describe — they do not
 * prescribe ("Codex tidak memberi jawaban. Codex memberi mata.").
 *
 * Two engines are intentional: I Ching answers "what is the shape of this
 * moment?", Tarot answers "what image surfaces?". Together they triangulate
 * without either claiming authority.
 */
export async function askDaily(opts: AskDailyOptions): Promise<DiaryEntry> {
  const {
    storage,
    question,
    notes,
    rng = Math.random,
    now = () => new Date(),
    localTimezoneOffsetMinutes,
    natalChart,
    transitOptions,
  } = opts;

  const instant = now();
  const date = localDateString(instant, localTimezoneOffsetMinutes);

  const ichingCast = castHexagram(rng);
  const tarotDraw = drawCards(1, { rng });
  const tarotCard = tarotDraw[0];
  if (!tarotCard) throw new Error('Tarot draw returned no card');

  const readings: EngineReading[] = [
    {
      engine: 'iching',
      cast: ichingCast,
      summary: hexagramSummary(ichingCast),
    },
    {
      engine: 'tarot',
      cast: tarotCard,
      summary: tarotSummary(tarotCard),
    },
  ];

  if (natalChart) {
    const transits = computeTransits(natalChart, instant.getTime(), transitOptions);
    readings.push({
      engine: 'astrology',
      cast: transits,
      summary: transitSummary(transits),
    });
  }

  const entry: DiaryEntry = {
    id: randomUUID(),
    createdAt: instant.toISOString(),
    date,
    ...(question !== undefined ? { question } : {}),
    readings,
    ...(notes !== undefined ? { notes } : {}),
  };

  await storage.append(entry);
  return entry;
}

function hexagramSummary(cast: ReturnType<typeof castHexagram>): string {
  const primary = `${cast.primary.cn} (${cast.primary.pinyin}) — ${cast.primary.en}`;
  if (cast.relating) {
    return `${primary} → ${cast.relating.cn} (${cast.relating.pinyin}) — ${cast.relating.en}`;
  }
  return primary;
}

function tarotSummary(drawn: ReturnType<typeof drawCards>[number]): string {
  return drawn.reversed ? `${drawn.card.name} (reversed)` : drawn.card.name;
}

/**
 * One-line description of today's sky against the natal chart. Names the
 * tightest applying aspect when one exists (the most "alive" transit);
 * otherwise notes that nothing sits within tight orb. Describes — does not
 * prescribe.
 */
function transitSummary(transits: TransitChart): string {
  const aspects = transits.aspectsToNatal;
  if (aspects.length === 0) return 'no transits within tight orb';
  const applying = aspects.find((a) => a.motion === 'applying') ?? aspects[0]!;
  return formatAspect(applying);
}

function formatAspect(a: TransitAspect): string {
  return `t.${a.transit} ${a.kind} n.${a.natal} (orb ${a.orb.toFixed(2)}°, ${a.motion})`;
}

/**
 * Local-day string for the diary `date` field.
 * Defaults to the host's timezone; tests should pin offsetMinutes.
 */
export function localDateString(instant: Date, offsetMinutes?: number): string {
  const offset = offsetMinutes ?? -instant.getTimezoneOffset();
  const shifted = new Date(instant.getTime() + offset * 60_000);
  return shifted.toISOString().slice(0, 10);
}

// Re-export the rng helper so callers don't need a second import.
export { ichingMulberry as mulberry32 };
