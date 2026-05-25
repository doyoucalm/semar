/**
 * SERVER-ONLY engine helpers (uses BaZi which reads files via node:fs).
 * Import only from Server Components or API routes.
 */
import { computeBazi }                  from '@semar/bazi';
import { computeChart, computeTransits } from '@semar/astrology';
import { computePawukonChart }           from '@semar/pawukon';
import { PROFILE, todayLocal }           from './profile';

export type CoreData = ReturnType<typeof getDailyCore>;

export function getDailyCore(nowMs = Date.now()) {
  const local = todayLocal();
  const b = PROFILE.birth;

  const natalBazi = computeBazi({
    year: b.year, month: b.month, day: b.day,
    hour: b.hour, minute: b.minute,
    utcOffsetMinutes: b.utcOffsetMinutes,
  });

  const utcDate = new Date(nowMs);
  const todayBazi = computeBazi({
    year: utcDate.getUTCFullYear(), month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(), hour: 12, minute: 0,
    utcOffsetMinutes: 0,
  });

  const natalAstro = computeChart({
    year: b.year, month: b.month, day: b.day,
    hour: b.hour, minute: b.minute,
    utcOffsetMinutes: b.utcOffsetMinutes,
    latitude: b.latitude, longitude: b.longitude,
  });
  const transits = computeTransits(natalAstro, nowMs);

  const [ly, lm, ld] = local.split('-').map(Number);
  const pChart = computePawukonChart({ year: ly!, month: lm!, day: ld! });
  const tight = transits.aspectsToNatal[0];

  return {
    localDate: local,
    bazi: {
      today: `${todayBazi.day.stem}${todayBazi.day.branch}`,
      natal: `${natalBazi.year.stem}${natalBazi.year.branch} ${natalBazi.month.stem}${natalBazi.month.branch} ${natalBazi.day.stem}${natalBazi.day.branch} ${natalBazi.hour.stem}${natalBazi.hour.branch}`,
    },
    transit: tight ? {
      planet: tight.transit, natal: tight.natal,
      kind: tight.kind, orb: tight.orb, motion: tight.motion,
    } : null,
    weton: {
      hari: pChart.weton.hari, pasaran: pChart.weton.pasaran,
      neptu: pChart.weton.neptu, wuku: pChart.pawukon.wuku,
    },
  };
}
