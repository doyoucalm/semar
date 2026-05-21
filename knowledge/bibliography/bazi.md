# BaZi (八字) Bibliography

Classical Chinese sources, modern Chinese masters, and English-language references used throughout the BaZi knowledge base.

## Classical Chinese Texts

- **《渊海子平》 (Yuān Hǎi Zǐ Píng — Origin and Sea of Ziping).** Song-Yuan dynasty (compiled 13th–14th c.), attributed to Xú Dàshēng. The foundational text of the Ziping school of BaZi, the basis for nearly all subsequent practice. Modern editions readily available in Chinese; partial English translations exist in academic and practitioner literature.

- **《三命通会》 (Sān Mìng Tōng Huì — Comprehensive Compendium of the Three Fates).** Ming dynasty (16th c.), compiled by Wàn Mínyīng. The most extensive classical compendium; the standard reference for symbolic stars, classical interactions, and historical case readings. Standard reference for shen sha rules in this project.

- **《滴天髓》 (Dī Tiān Suǐ — Drops of Heavenly Essence).** Song dynasty, attributed to Liu Bowen (with later commentaries, especially that of Rén Tiéqiáo in the Qing). The major theoretical text for advanced BaZi technique. Crucial for the day-master strength analysis and element-flow theory.

- **《穷通宝鉴》 (Qiōng Tōng Bǎo Jiàn — Treasured Mirror of the Penetrating Origin).** Ming dynasty. Treatment of day-master configurations season by season — what each day master needs and dislikes depending on month of birth.

- **《子平真诠》 (Zǐ Píng Zhēn Quán — Real Truth of Ziping).** Qing dynasty, by Shen Xiaozhan. The classical treatment of the "useful god" (用神) doctrine. Together with *Drops of Heavenly Essence* and *Three Fates Compendium*, this is one of the three pillars of classical BaZi theory.

## Modern Chinese Masters (translated and influential)

- **Joey Yap.** *The Ten Gods.* JY Books, Kuala Lumpur, 2007.
  Accessible modern English-language presentation of the Ten Gods system. Yap's *Ten Thousand Year Calendar* (JY Books) is a useful working reference. Note: Yap's school is one lineage among several; some interpretive choices are specific to him.

- **Joey Yap.** *Symbolic Stars in BaZi.* JY Books, Kuala Lumpur, 2010.
  English-language reference for the shen sha, with practical examples. Used in this project for cross-checking the shen sha lookup tables.

- **Master Sang (Larry Sang).** *The Classic of BaZi: The Heavenly Stems and Earthly Branches.* American Feng Shui Institute. The foundational English-language exposition from the American Feng Shui Institute lineage.

- **Raymond Lo.** *Feng Shui and Destiny.* Times Books, Singapore, 1992. Includes a working introduction to BaZi for the Western reader.

## English-Language Reference and Pedagogy

- **Stephen Skinner.** *Flying Star Feng Shui Made Easy.* Tuttle, 2002 — and his other works on Chinese metaphysical systems. Skinner's work provides historical and cultural context for the Chinese systems.

- **Sherrill Tyler.** *Five Elements: The Wuxing Cycle in Chinese Metaphysics.* Various editions.

- **Eva Wong.** *Taoism: An Essential Guide.* Shambhala, Boston, 1997. Useful for the philosophical context of the Five Elements and yin-yang principles underlying BaZi.

## Solar Term and Calendar Reference

- **Hong Kong Observatory.** *Gregorian-Chinese Calendar Conversion Tables*, 1901–2100. Authoritative source for solar term dates used in BaZi pillar calculation. Source dataset used by `packages/bazi/data/solar-terms.json`.

- **Astronomy Engine.** Don Cross. C/JavaScript ephemeris library used by `packages/bazi/src/astro.ts` for solar term moment calculation. The HKO dates are taken as ground truth; Astronomy Engine provides the precise UTC moment within the HKO-dated day.

## Academic and Sinological Studies

- **Joseph Needham et al.** *Science and Civilisation in China, Volume II: History of Scientific Thought.* Cambridge University Press, 1956. Background on the philosophical context (yin-yang, five elements, the sexagenary cycle) within which BaZi developed.

- **Richard J. Smith.** *Fortune-tellers and Philosophers: Divination in Traditional Chinese Society.* Westview Press, Boulder, 1991. Scholarly history of Chinese divinatory practice including BaZi within the broader context.

## Notes on Source Comparison

Different lineages disagree on:
- The exact transformation conditions for branch combinations (六合, 三合).
- Whether 子丑 combines into earth or water.
- The exact orb and rule for several shen sha — *Three Fates Compendium* and *Origin and Sea of Ziping* sometimes differ on table entries; *Joey Yap, Symbolic Stars* selects a single modern consensus.
- Whether the hour pillar starts from solar noon, the apparent sun, or local zone time. This project uses the apparent sun position (via Astronomy Engine) at the chart's location, giving precise solar hour boundaries.

When sources disagree, the project's `data/*.json` files are commented to record which lineage was chosen. The default is the *Three Fates Compendium / Origin and Sea of Ziping* consensus, with Joey Yap's modern tabulation used for the symbolic stars.
