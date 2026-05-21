/**
 * The 64 hexagrams in King Wen sequence.
 *
 * Each hexagram's `binary` is read bottom-line-first.
 * '1' = yang (—), '0' = yin (- -). Length is exactly 6.
 * The bottom line of the cast goes at position 0.
 */

export interface Hexagram {
  readonly number: number;
  readonly cn: string;
  readonly pinyin: string;
  readonly en: string;
  readonly binary: string;
}

export const HEXAGRAMS: readonly Hexagram[] = [
  { number: 1,  cn: '乾',   pinyin: 'Qián',     en: 'The Creative',              binary: '111111' },
  { number: 2,  cn: '坤',   pinyin: 'Kūn',      en: 'The Receptive',             binary: '000000' },
  { number: 3,  cn: '屯',   pinyin: 'Zhūn',     en: 'Difficulty at the Beginning', binary: '100010' },
  { number: 4,  cn: '蒙',   pinyin: 'Méng',     en: 'Youthful Folly',            binary: '010001' },
  { number: 5,  cn: '需',   pinyin: 'Xū',       en: 'Waiting',                   binary: '111010' },
  { number: 6,  cn: '訟',   pinyin: 'Sòng',     en: 'Conflict',                  binary: '010111' },
  { number: 7,  cn: '師',   pinyin: 'Shī',      en: 'The Army',                  binary: '010000' },
  { number: 8,  cn: '比',   pinyin: 'Bǐ',       en: 'Holding Together',          binary: '000010' },
  { number: 9,  cn: '小畜', pinyin: 'Xiǎo Chù', en: 'Small Taming',              binary: '111011' },
  { number: 10, cn: '履',   pinyin: 'Lǚ',       en: 'Treading',                  binary: '110111' },
  { number: 11, cn: '泰',   pinyin: 'Tài',      en: 'Peace',                     binary: '111000' },
  { number: 12, cn: '否',   pinyin: 'Pǐ',       en: 'Standstill',                binary: '000111' },
  { number: 13, cn: '同人', pinyin: 'Tóng Rén', en: 'Fellowship with Men',       binary: '101111' },
  { number: 14, cn: '大有', pinyin: 'Dà Yǒu',   en: 'Great Possession',          binary: '111101' },
  { number: 15, cn: '謙',   pinyin: 'Qiān',     en: 'Modesty',                   binary: '001000' },
  { number: 16, cn: '豫',   pinyin: 'Yù',       en: 'Enthusiasm',                binary: '000100' },
  { number: 17, cn: '隨',   pinyin: 'Suí',      en: 'Following',                 binary: '100110' },
  { number: 18, cn: '蠱',   pinyin: 'Gǔ',       en: 'Work on the Decayed',       binary: '011001' },
  { number: 19, cn: '臨',   pinyin: 'Lín',      en: 'Approach',                  binary: '110000' },
  { number: 20, cn: '觀',   pinyin: 'Guān',     en: 'Contemplation',             binary: '000011' },
  { number: 21, cn: '噬嗑', pinyin: 'Shì Kè',   en: 'Biting Through',            binary: '100101' },
  { number: 22, cn: '賁',   pinyin: 'Bì',       en: 'Grace',                     binary: '101001' },
  { number: 23, cn: '剝',   pinyin: 'Bō',       en: 'Splitting Apart',           binary: '000001' },
  { number: 24, cn: '復',   pinyin: 'Fù',       en: 'Return',                    binary: '100000' },
  { number: 25, cn: '無妄', pinyin: 'Wú Wàng',  en: 'Innocence',                 binary: '100111' },
  { number: 26, cn: '大畜', pinyin: 'Dà Chù',   en: 'Great Taming',              binary: '111001' },
  { number: 27, cn: '頤',   pinyin: 'Yí',       en: 'Nourishment',               binary: '100001' },
  { number: 28, cn: '大過', pinyin: 'Dà Guò',   en: 'Great Exceeding',           binary: '011110' },
  { number: 29, cn: '坎',   pinyin: 'Kǎn',      en: 'The Abysmal',               binary: '010010' },
  { number: 30, cn: '離',   pinyin: 'Lí',       en: 'The Clinging',              binary: '101101' },
  { number: 31, cn: '咸',   pinyin: 'Xián',     en: 'Influence',                 binary: '001110' },
  { number: 32, cn: '恆',   pinyin: 'Héng',     en: 'Duration',                  binary: '011100' },
  { number: 33, cn: '遯',   pinyin: 'Dùn',      en: 'Retreat',                   binary: '001111' },
  { number: 34, cn: '大壯', pinyin: 'Dà Zhuàng',en: 'Great Power',               binary: '111100' },
  { number: 35, cn: '晉',   pinyin: 'Jìn',      en: 'Progress',                  binary: '000101' },
  { number: 36, cn: '明夷', pinyin: 'Míng Yí',  en: 'Darkening of the Light',    binary: '101000' },
  { number: 37, cn: '家人', pinyin: 'Jiā Rén',  en: 'The Family',                binary: '101011' },
  { number: 38, cn: '睽',   pinyin: 'Kuí',      en: 'Opposition',                binary: '110101' },
  { number: 39, cn: '蹇',   pinyin: 'Jiǎn',     en: 'Obstruction',               binary: '001010' },
  { number: 40, cn: '解',   pinyin: 'Xiè',      en: 'Deliverance',               binary: '010100' },
  { number: 41, cn: '損',   pinyin: 'Sǔn',      en: 'Decrease',                  binary: '110001' },
  { number: 42, cn: '益',   pinyin: 'Yì',       en: 'Increase',                  binary: '100011' },
  { number: 43, cn: '夬',   pinyin: 'Guài',     en: 'Breakthrough',              binary: '111110' },
  { number: 44, cn: '姤',   pinyin: 'Gòu',      en: 'Coming to Meet',            binary: '011111' },
  { number: 45, cn: '萃',   pinyin: 'Cuì',      en: 'Gathering Together',        binary: '000110' },
  { number: 46, cn: '升',   pinyin: 'Shēng',    en: 'Pushing Upward',            binary: '011000' },
  { number: 47, cn: '困',   pinyin: 'Kùn',      en: 'Oppression',                binary: '010110' },
  { number: 48, cn: '井',   pinyin: 'Jǐng',     en: 'The Well',                  binary: '011010' },
  { number: 49, cn: '革',   pinyin: 'Gé',       en: 'Revolution',                binary: '101110' },
  { number: 50, cn: '鼎',   pinyin: 'Dǐng',     en: 'The Cauldron',              binary: '011101' },
  { number: 51, cn: '震',   pinyin: 'Zhèn',     en: 'The Arousing',              binary: '100100' },
  { number: 52, cn: '艮',   pinyin: 'Gèn',      en: 'Keeping Still',             binary: '001001' },
  { number: 53, cn: '漸',   pinyin: 'Jiàn',     en: 'Development',               binary: '001011' },
  { number: 54, cn: '歸妹', pinyin: 'Guī Mèi',  en: 'The Marrying Maiden',       binary: '110100' },
  { number: 55, cn: '豐',   pinyin: 'Fēng',     en: 'Abundance',                 binary: '101100' },
  { number: 56, cn: '旅',   pinyin: 'Lǚ',       en: 'The Wanderer',              binary: '001101' },
  { number: 57, cn: '巽',   pinyin: 'Xùn',      en: 'The Gentle',                binary: '011011' },
  { number: 58, cn: '兌',   pinyin: 'Duì',      en: 'The Joyous',                binary: '110110' },
  { number: 59, cn: '渙',   pinyin: 'Huàn',     en: 'Dispersion',                binary: '010011' },
  { number: 60, cn: '節',   pinyin: 'Jié',      en: 'Limitation',                binary: '110010' },
  { number: 61, cn: '中孚', pinyin: 'Zhōng Fú', en: 'Inner Truth',               binary: '110011' },
  { number: 62, cn: '小過', pinyin: 'Xiǎo Guò', en: 'Small Exceeding',           binary: '001100' },
  { number: 63, cn: '既濟', pinyin: 'Jì Jì',    en: 'After Completion',          binary: '101010' },
  { number: 64, cn: '未濟', pinyin: 'Wèi Jì',   en: 'Before Completion',         binary: '010101' },
];

const BY_BINARY: ReadonlyMap<string, Hexagram> = new Map(
  HEXAGRAMS.map((h) => [h.binary, h] as const),
);

export function hexagramByBinary(binary: string): Hexagram {
  const hex = BY_BINARY.get(binary);
  if (!hex) throw new Error(`No hexagram for binary "${binary}"`);
  return hex;
}

export function hexagramByNumber(n: number): Hexagram {
  const hex = HEXAGRAMS[n - 1];
  if (!hex || hex.number !== n) throw new Error(`No hexagram numbered ${n}`);
  return hex;
}
