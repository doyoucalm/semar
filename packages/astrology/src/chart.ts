import { PLANETS, signOfLongitude, degreeInSign, type Planet, type Sign } from './constants.js';
import {
  eclipticLongitudeOf, isRetrograde, ascendantAndMidheaven, makeAstroTime,
} from './astro.js';
import { wholeSignHouses, houseOfLongitude, type House } from './houses.js';
import { dignityOf, type Dignity } from './dignities.js';
import { findAspects, type Aspect, type AspectOptions } from './aspects.js';

export interface ChartInput {
  readonly year: number;
  readonly month: number;       // 1–12
  readonly day: number;         // 1–31
  readonly hour: number;        // 0–23
  readonly minute: number;      // 0–59
  /** Minutes east of UTC. Asia/Jakarta = 420. */
  readonly utcOffsetMinutes: number;
  /** Geographic latitude in degrees, north positive. Bandung ≈ -6.91. */
  readonly latitude: number;
  /** Geographic longitude in degrees, east positive. Bandung ≈ 107.61. */
  readonly longitude: number;
}

export interface Placement {
  readonly planet: Planet;
  readonly longitude: number;   // 0..360
  readonly sign: Sign;
  readonly degreeInSign: number; // 0..30
  readonly retrograde: boolean;
  readonly house: number;        // 1..12
  readonly dignity: Dignity | null;
}

export interface NatalChart {
  readonly input: ChartInput;
  readonly utcMs: number;
  readonly ascendant: { longitude: number; sign: Sign; degreeInSign: number };
  readonly midheaven: { longitude: number; sign: Sign; degreeInSign: number };
  readonly houses: readonly House[];
  readonly placements: readonly Placement[];
  readonly aspects: readonly Aspect[];
  readonly houseSystem: 'whole-sign';
}

export interface ComputeChartOptions {
  readonly aspectOrbs?: AspectOptions['orbOverrides'];
}

export function computeChart(input: ChartInput, opts: ComputeChartOptions = {}): NatalChart {
  validate(input);
  const utcMs =
    Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute) -
    input.utcOffsetMinutes * 60_000;
  const time = makeAstroTime(utcMs);

  const { ascendant: ascLon, midheaven: mcLon } = ascendantAndMidheaven(
    time, input.latitude, input.longitude,
  );
  const houses = wholeSignHouses(ascLon);

  const placements: Placement[] = PLANETS.map((planet) => {
    const longitude = eclipticLongitudeOf(planet, time);
    const sign = signOfLongitude(longitude);
    return {
      planet,
      longitude: round3(longitude),
      sign,
      degreeInSign: round3(degreeInSign(longitude)),
      retrograde: isRetrograde(planet, time),
      house: houseOfLongitude(longitude, houses),
      dignity: dignityOf(planet, sign),
    };
  });

  const aspects = findAspects(
    placements.map((p) => ({ planet: p.planet, longitude: p.longitude })),
    opts.aspectOrbs ? { orbOverrides: opts.aspectOrbs } : {},
  );

  return {
    input,
    utcMs,
    ascendant: {
      longitude: round3(ascLon),
      sign: signOfLongitude(ascLon),
      degreeInSign: round3(degreeInSign(ascLon)),
    },
    midheaven: {
      longitude: round3(mcLon),
      sign: signOfLongitude(mcLon),
      degreeInSign: round3(degreeInSign(mcLon)),
    },
    houses,
    placements,
    aspects,
    houseSystem: 'whole-sign',
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
  if (typeof b.latitude !== 'number' || b.latitude < -90 || b.latitude > 90) errs.push(`latitude -90..90`);
  if (typeof b.longitude !== 'number' || b.longitude < -180 || b.longitude > 180) errs.push(`longitude -180..180`);
  if (errs.length) throw new Error(`Invalid ChartInput: ${errs.join('; ')}`);
}

function round3(n: number): number { return Math.round(n * 1000) / 1000; }
