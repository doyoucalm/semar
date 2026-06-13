/**
 * Display helpers for the BaZi calculator — element colors, English labels,
 * and stem/branch → element maps. Pure data, safe for the client bundle.
 */

export type Element = '木' | '火' | '土' | '金' | '水';

export const ELEMENT_EN: Record<Element, string> = {
  木: 'Wood', 火: 'Fire', 土: 'Earth', 金: 'Metal', 水: 'Water',
};

/** Theme-aligned element colors (work on the #0f0a06 dark ground). */
export const ELEMENT_COLOR: Record<Element, string> = {
  木: '#6faf6f', // wood — green
  火: '#c44a30', // fire — ember
  土: '#c9a84c', // earth — gold
  金: '#d9c9a8', // metal — pale
  水: '#5b85a8', // water — slate blue
};

export const STEM_ELEMENT: Record<string, Element> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

export const BRANCH_ELEMENT: Record<string, Element> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export const STEM_PINYIN: Record<string, string> = {
  甲: 'jiǎ', 乙: 'yǐ', 丙: 'bǐng', 丁: 'dīng', 戊: 'wù',
  己: 'jǐ', 庚: 'gēng', 辛: 'xīn', 壬: 'rén', 癸: 'guǐ',
};

export const BRANCH_PINYIN: Record<string, string> = {
  子: 'zǐ', 丑: 'chǒu', 寅: 'yín', 卯: 'mǎo', 辰: 'chén', 巳: 'sì',
  午: 'wǔ', 未: 'wèi', 申: 'shēn', 酉: 'yǒu', 戌: 'xū', 亥: 'hài',
};

/** Branch → Chinese zodiac animal (for readability). */
export const BRANCH_ANIMAL: Record<string, string> = {
  子: 'Rat', 丑: 'Ox', 寅: 'Tiger', 卯: 'Rabbit', 辰: 'Dragon', 巳: 'Snake',
  午: 'Horse', 未: 'Goat', 申: 'Monkey', 酉: 'Rooster', 戌: 'Dog', 亥: 'Pig',
};

/** Ten Gods (十神) — Chinese → English. */
export const TEN_GOD_EN: Record<string, string> = {
  比肩: 'Friend',
  劫财: 'Rob Wealth',
  食神: 'Eating God',
  伤官: 'Hurting Officer',
  偏财: 'Indirect Wealth',
  正财: 'Direct Wealth',
  七杀: 'Seven Killings',
  正官: 'Direct Officer',
  偏印: 'Indirect Resource',
  正印: 'Direct Resource',
};

/** Short ten-god tag for tight spaces. */
export const TEN_GOD_SHORT: Record<string, string> = {
  比肩: 'F', 劫财: 'RW', 食神: 'EG', 伤官: 'HO', 偏财: 'IW',
  正财: 'DW', 七杀: '7K', 正官: 'DO', 偏印: 'IR', 正印: 'DR',
};

export function elementOf(char: string): Element | null {
  return STEM_ELEMENT[char] ?? BRANCH_ELEMENT[char] ?? null;
}

export function colorOf(char: string): string {
  const el = elementOf(char);
  return el ? ELEMENT_COLOR[el] : '#e8d9c0';
}
