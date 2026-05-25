/** Lucky's profile — same source-of-truth as CLI LUCKY_PROFILE. */
export const PROFILE = {
  name: 'Lucky Surya Haryadi',
  birth: {
    year: 1985, month: 5, day: 5,
    hour: 3, minute: 15,
    utcOffsetMinutes: 7 * 60,   // WIB = UTC+7
    latitude:  -6.9175,         // Bandung
    longitude: 107.6191,
    gender: 'male' as const,
  },
  lunarOverride: { lunarMonth: 3, lunarDay: 16, isLeapMonth: false },
} as const;

/** Today's YYYY-MM-DD in WIB (UTC+7). */
export function todayLocal(): string {
  const local = new Date(Date.now() + PROFILE.birth.utcOffsetMinutes * 60_000);
  return local.toISOString().slice(0, 10);
}
