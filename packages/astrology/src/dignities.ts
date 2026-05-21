import type { Planet, Sign } from './constants.js';

/**
 * Essential dignities (classical, modern overlay).
 *
 *  - DOMICILE     planet rules this sign
 *  - EXALTATION   planet is "exalted" in this sign
 *  - DETRIMENT    opposite of domicile (weakest by rulership)
 *  - FALL         opposite of exaltation
 *
 * For the outer planets (Uranus / Neptune / Pluto) we use the common modern
 * rulership overlay; classical tradition didn't know them.
 */

export type Dignity = 'domicile' | 'exaltation' | 'detriment' | 'fall';

const DOMICILE: Record<Sign, Planet[]> = {
  Aries:       ['Mars'],
  Taurus:      ['Venus'],
  Gemini:      ['Mercury'],
  Cancer:      ['Moon'],
  Leo:         ['Sun'],
  Virgo:       ['Mercury'],
  Libra:       ['Venus'],
  Scorpio:     ['Mars', 'Pluto'],     // classical Mars, modern Pluto
  Sagittarius: ['Jupiter'],
  Capricorn:   ['Saturn'],
  Aquarius:    ['Saturn', 'Uranus'],  // classical Saturn, modern Uranus
  Pisces:      ['Jupiter', 'Neptune'],// classical Jupiter, modern Neptune
};

const EXALTATION: Partial<Record<Sign, Planet>> = {
  Aries:       'Sun',
  Taurus:      'Moon',
  Cancer:      'Jupiter',
  Virgo:       'Mercury',
  Libra:       'Saturn',
  Capricorn:   'Mars',
  Pisces:      'Venus',
};

const OPPOSITE: Record<Sign, Sign> = {
  Aries: 'Libra',       Libra: 'Aries',
  Taurus: 'Scorpio',    Scorpio: 'Taurus',
  Gemini: 'Sagittarius',Sagittarius: 'Gemini',
  Cancer: 'Capricorn',  Capricorn: 'Cancer',
  Leo: 'Aquarius',      Aquarius: 'Leo',
  Virgo: 'Pisces',      Pisces: 'Virgo',
};

export function dignityOf(planet: Planet, sign: Sign): Dignity | null {
  if (DOMICILE[sign].includes(planet)) return 'domicile';
  if (EXALTATION[sign] === planet) return 'exaltation';

  const opp = OPPOSITE[sign];
  if (DOMICILE[opp].includes(planet)) return 'detriment';
  if (EXALTATION[opp] === planet) return 'fall';

  return null;
}
