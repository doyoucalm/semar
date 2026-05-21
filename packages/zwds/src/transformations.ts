/**
 * The Four Transformations (四化) of ZWDS.
 *
 * For each year stem, a fixed set of four main stars are "transformed"
 * into one of:
 *   化禄 (Lu — wealth/blessing)
 *   化权 (Quan — power/authority)
 *   化科 (Ke — recognition/scholarship)
 *   化忌 (Ji — obstruction/obsession)
 *
 * The transformations are the most dynamic part of a ZWDS chart —
 * they tell you which stars are "activated" by the birth year (natal
 * transformations) or by any later year (transit transformations).
 *
 * Lookup table is the classical one from Ziwei Doushu Quanshu; modern
 * schools sometimes vary, especially for 庚 year (some assign 太阳-禄
 * + 武曲-权 + 太阴-科 + 天同-忌 vs the variant we use here).
 */

import type { Stem } from './constants.js';
import type { MainStar } from './constants.js';

export type Transformation = '化禄' | '化权' | '化科' | '化忌';

export interface YearTransformations {
  readonly stem: Stem;
  readonly transformations: Record<Transformation, MainStar>;
}

const TABLE: Record<Stem, Record<Transformation, MainStar>> = {
  '甲': { '化禄': '廉贞', '化权': '破军', '化科': '武曲', '化忌': '太阳' },
  '乙': { '化禄': '天机', '化权': '天梁', '化科': '紫微', '化忌': '太阴' },
  '丙': { '化禄': '天同', '化权': '天机', '化科': '文昌' as unknown as MainStar, '化忌': '廉贞' },
  '丁': { '化禄': '太阴', '化权': '天同', '化科': '天机', '化忌': '巨门' },
  '戊': { '化禄': '贪狼', '化权': '太阴', '化科': '右弼' as unknown as MainStar, '化忌': '天机' },
  '己': { '化禄': '武曲', '化权': '贪狼', '化科': '天梁', '化忌': '文曲' as unknown as MainStar },
  '庚': { '化禄': '太阳', '化权': '武曲', '化科': '太阴', '化忌': '天同' },
  '辛': { '化禄': '巨门', '化权': '太阳', '化科': '文曲' as unknown as MainStar, '化忌': '文昌' as unknown as MainStar },
  '壬': { '化禄': '天梁', '化权': '紫微', '化科': '左辅' as unknown as MainStar, '化忌': '武曲' },
  '癸': { '化禄': '破军', '化权': '巨门', '化科': '太阴', '化忌': '贪狼' },
};

/**
 * Note: Some transformations target auxiliary stars (文昌/文曲/左辅/右弼)
 * which are not in the 14 main stars set. For now they are typed
 * `unknown as MainStar` to keep the table complete; the engine ignores
 * those when matching against the main stars table. A future revision
 * will add the auxiliary stars and resolve these properly.
 */
export function transformationsFor(stem: Stem): Record<Transformation, MainStar> {
  return TABLE[stem];
}

/** Returns the set of main stars that receive each transformation, filtered to MAIN_STARS only. */
export function mainStarTransformations(
  stem: Stem,
  mainStars: readonly MainStar[],
): Array<{ star: MainStar; transformation: Transformation }> {
  const set = new Set(mainStars);
  const t = TABLE[stem];
  const result: Array<{ star: MainStar; transformation: Transformation }> = [];
  for (const trans of ['化禄', '化权', '化科', '化忌'] as const) {
    const target = t[trans];
    if (set.has(target as MainStar)) {
      result.push({ star: target as MainStar, transformation: trans });
    }
  }
  return result;
}
