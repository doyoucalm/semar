/**
 * Zodiac signs and planetary bodies — names, glyphs, ordering.
 *
 * Signs are 30° wedges of the ecliptic starting at 0° Aries (the
 * Vernal Equinox point), measured counter-clockwise.
 */

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;
export type Sign = (typeof SIGNS)[number];

export const SIGN_GLYPHS: Record<Sign, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

/**
 * The 10 classical planets plus the two lunar nodes — the moving bodies/
 * points placed on a chart. "Planet" is used loosely here in the astrology-
 * software sense: a body that gets a sign, house, and aspects. The North
 * and South Nodes are the intersection points of the Moon's orbit with the
 * ecliptic, not actual bodies — but charts always treat them as placements.
 */
export const PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  'NorthNode', 'SouthNode',
] as const;
export type Planet = (typeof PLANETS)[number];

export const PLANET_GLYPHS: Record<Planet, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  NorthNode: '☊', SouthNode: '☋',
};

/** Returns sign index (0=Aries..11=Pisces) for an ecliptic longitude in degrees. */
export function signOfLongitude(longitude: number): Sign {
  const lon = ((longitude % 360) + 360) % 360;
  return SIGNS[Math.floor(lon / 30)]!;
}

/** Degree within a sign (0–29.999...). */
export function degreeInSign(longitude: number): number {
  const lon = ((longitude % 360) + 360) % 360;
  return lon - Math.floor(lon / 30) * 30;
}

/** Mean obliquity of the ecliptic at J2000, in degrees. Good to ~arcmin across 1900–2100. */
export const MEAN_OBLIQUITY_J2000 = 23.4392911;
