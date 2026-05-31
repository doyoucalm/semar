import {
  PLANETS, signOfLongitude, degreeInSign, MEAN_OBLIQUITY_J2000, type Planet, type Sign,
} from './constants.js';
import {
  eclipticLongitudeOf, isRetrograde, ascendantAndMidheaven, makeAstroTime,
} from './astro.js';
import { computeHouses, houseOfLongitude, type House, type HouseSystem } from './houses.js';
import { dignityOf, type Dignity } from './dignities.js';
import { findAspects, type Aspect, type AspectOptions } from './aspects.js';
import { ayanamsaValue, type Ayanamsa } from './ayanamsa.js';

export type Zodiac = 'tropical' | 'sidereal';

const mod360 = (n: number): number => ((n % 360) + 360) % 360;

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
  readonly houseSystem: HouseSystem;
  /** Tropical (Western) or sidereal (Vedic). */
  readonly zodiac: Zodiac;
  /** Ayanamsa applied (degrees). 0 for tropical. */
  readonly ayanamsaDeg: number;
}

export interface ComputeChartOptions {
  readonly aspectOrbs?: AspectOptions['orbOverrides'];
  /** House system. Default 'whole-sign'. */
  readonly houseSystem?: HouseSystem;
  /** Zodiac. Default 'tropical'. Sidereal subtracts an ayanamsa from all longitudes. */
  readonly zodiac?: Zodiac;
  /** Ayanamsa for sidereal charts. Default 'lahiri'. */
  readonly ayanamsa?: Ayanamsa;
}

export function computeChart(input: ChartInput, opts: ComputeChartOptions = {}): NatalChart {
  validate(input);
  const houseSystem = opts.houseSystem ?? 'whole-sign';
  const zodiac = opts.zodiac ?? 'tropical';

  const utcMs =
    Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute) -
    input.utcOffsetMinutes * 60_000;
  const time = makeAstroTime(utcMs);

  const { ascendant: ascLon, midheaven: mcLon, ramc } = ascendantAndMidheaven(
    time, input.latitude, input.longitude,
  );

  // Sidereal = compute everything tropically, then rotate all ecliptic
  // longitudes by −ayanamsa. House MEMBERSHIP is rotation-invariant, so it is
  // resolved against the tropical cusps; only the displayed longitude/sign shift.
  const ayanamsaDeg = zodiac === 'sidereal' ? ayanamsaValue(opts.ayanamsa ?? 'lahiri', utcMs) : 0;
  const shift = (lon: number): number => mod360(lon - ayanamsaDeg);

  const tropicalHouses = computeHouses(houseSystem, {
    ascendant: ascLon,
    midheaven: mcLon,
    ramc,
    latitude: input.latitude,
    obliquity: MEAN_OBLIQUITY_J2000,
  });

  // Output houses carry the (possibly shifted) cusp longitude + its sign.
  const houses: House[] = tropicalHouses.map((h) => {
    const lon = shift(h.startLongitude);
    return { number: h.number, sign: signOfLongitude(lon), startLongitude: round3(lon) };
  });

  const placements: Placement[] = PLANETS.map((planet) => {
    const tropLon = eclipticLongitudeOf(planet, time);
    const lon = shift(tropLon);
    const sign = signOfLongitude(lon);
    return {
      planet,
      longitude: round3(lon),
      sign,
      degreeInSign: round3(degreeInSign(lon)),
      retrograde: isRetrograde(planet, time),
      house: houseOfLongitude(tropLon, tropicalHouses),
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
      longitude: round3(shift(ascLon)),
      sign: signOfLongitude(shift(ascLon)),
      degreeInSign: round3(degreeInSign(shift(ascLon))),
    },
    midheaven: {
      longitude: round3(shift(mcLon)),
      sign: signOfLongitude(shift(mcLon)),
      degreeInSign: round3(degreeInSign(shift(mcLon))),
    },
    houses,
    placements,
    aspects,
    houseSystem,
    zodiac,
    ayanamsaDeg: round3(ayanamsaDeg),
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
