/**
 * Pawukon — Javanese & Balinese traditional calendar constants.
 *
 * Spelling notes: Indonesian-Latin spelling preferred; common variants in
 * comments. Names cover both Java and Bali — they share Saptawara and
 * Pancawara, while the multi-wara structure (1–10 day cycles), the 30-wuku
 * Pawukon, and Sasih/Saka are primarily Balinese.
 */

/** Saptawara — 7-day week. Index 0 = Redite = Sunday. */
export const SAPTAWARA = [
  'Redite',
  'Soma',
  'Anggara',
  'Buda',
  'Wraspati',
  'Sukra',
  'Saniscara',
] as const;
export type Saptawara = (typeof SAPTAWARA)[number];

/** Saptawara → Indonesian day name (Javanese / common). */
export const SAPTAWARA_ID: Record<Saptawara, string> = {
  Redite: 'Minggu',
  Soma: 'Senin',
  Anggara: 'Selasa',
  Buda: 'Rabu',
  Wraspati: 'Kamis',
  Sukra: 'Jumat',
  Saniscara: 'Sabtu',
};

/** Pancawara — 5-day market week (pasaran). */
export const PANCAWARA = ['Umanis', 'Paing', 'Pon', 'Wage', 'Kliwon'] as const;
export type Pancawara = (typeof PANCAWARA)[number];

/** Pancawara → Javanese pasaran name. Umanis = Legi (Java). */
export const PANCAWARA_JV: Record<Pancawara, string> = {
  Umanis: 'Legi',
  Paing: 'Pahing',
  Pon: 'Pon',
  Wage: 'Wage',
  Kliwon: 'Kliwon',
};

/**
 * 30 Wuku in canonical order. Day 1 of wuku Sinta begins each 210-day
 * Pawukon cycle.
 */
export const WUKU = [
  'Sinta',
  'Landep',
  'Ukir',
  'Kulantir',
  'Tolu',
  'Gumbreg',
  'Wariga',
  'Warigadean',
  'Julungwangi',
  'Sungsang',
  'Dunggulan',
  'Kuningan',
  'Langkir',
  'Medangsia',
  'Pujut',
  'Pahang',
  'Krulut',
  'Merakih',
  'Tambir',
  'Medangkungan',
  'Matal',
  'Uye',
  'Menail',
  'Prangbakat',
  'Bala',
  'Ugu',
  'Wayang',
  'Kelawu',
  'Dukut',
  'Watugunung',
] as const;
export type Wuku = (typeof WUKU)[number];

/** Triwara — 3-day cycle. */
export const TRIWARA = ['Pasah', 'Beteng', 'Kajeng'] as const;
export type Triwara = (typeof TRIWARA)[number];

/** Caturwara — 4-day cycle. */
export const CATURWARA = ['Sri', 'Laba', 'Jaya', 'Menala'] as const;
export type Caturwara = (typeof CATURWARA)[number];

/** Sadwara — 6-day cycle. */
export const SADWARA = [
  'Tungleh',
  'Aryang',
  'Urukung',
  'Paniron',
  'Was',
  'Maulu',
] as const;
export type Sadwara = (typeof SADWARA)[number];

/** Astawara — 8-day cycle. */
export const ASTAWARA = [
  'Sri',
  'Indra',
  'Guru',
  'Yama',
  'Ludra',
  'Brahma',
  'Kala',
  'Uma',
] as const;
export type Astawara = (typeof ASTAWARA)[number];

/** Sangawara — 9-day cycle. */
export const SANGAWARA = [
  'Dangu',
  'Jangur',
  'Gigis',
  'Nohan',
  'Ogan',
  'Erangan',
  'Urungan',
  'Tulus',
  'Dadi',
] as const;
export type Sangawara = (typeof SANGAWARA)[number];

/** Dasawara — 10-day cycle. */
export const DASAWARA = [
  'Pandita',
  'Pati',
  'Suka',
  'Duka',
  'Sri',
  'Manuh',
  'Manusa',
  'Raja',
  'Dewa',
  'Raksasa',
] as const;
export type Dasawara = (typeof DASAWARA)[number];

/** Sasih — 12 Balinese lunar months. Sasih + Saka deferred to v2 (requires astronomical new-moon detection). */
export const SASIH = [
  'Kasa',
  'Karo',
  'Katiga',
  'Kapat',
  'Kalima',
  'Kanem',
  'Kapitu',
  'Kawolu',
  'Kasanga',
  'Kadasa',
  'Desta',
  'Sadha',
] as const;
export type Sasih = (typeof SASIH)[number];

/**
 * Urip / neptu — numerical weights attached to each pancawara and saptawara day.
 * Source: Javanese tradition (neptu) and Balinese tradition (urip) — same numbers,
 * different terminology. Used to compute Dwiwara, Dasawara, and weton total.
 */
export const URIP_PANCAWARA: Record<Pancawara, number> = {
  Umanis: 5, // Legi
  Paing: 9, // Pahing
  Pon: 7,
  Wage: 4,
  Kliwon: 8,
};

export const URIP_SAPTAWARA: Record<Saptawara, number> = {
  Redite: 5, // Minggu
  Soma: 4, // Senin
  Anggara: 3, // Selasa
  Buda: 7, // Rabu
  Wraspati: 8, // Kamis
  Sukra: 6, // Jumat
  Saniscara: 9, // Sabtu
};

/** Dwiwara — 2-day cycle, urip-derived. 0=Menga, 1=Pepet. */
export const DWIWARA = ['Menga', 'Pepet'] as const;
export type Dwiwara = (typeof DWIWARA)[number];

/** Ekawara — 1-day cycle, single value. */
export const EKAWARA = 'Luang' as const;
export type Ekawara = typeof EKAWARA;
