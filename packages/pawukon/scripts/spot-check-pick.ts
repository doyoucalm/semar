/**
 * Pick Gregorian dates that land on critical Pawukon-days for spot-check.
 *
 * Goal: find 10 dates that together exercise:
 *   - the Caturwara/Astawara hold window (p=71,72,73)
 *   - the post-hold boundary (p=70 pre, p=74 post)
 *   - the Sangawara hold window (p=1..4) and natural start (p=5,6)
 *   - a couple of mid-cycle controls
 *
 * Strategy: start from 2026-01-01, walk forward day by day, collect the first
 * Gregorian date that matches each target Pawukon-day. Print as a table.
 */
import { computePawukonChart } from '../src/engine.js';

const TARGETS = new Set([1, 2, 3, 4, 5, 6, 70, 71, 72, 73, 74, 75, 105, 150, 200, 210]);
type Row = { date: string; p: number; pawukon: ReturnType<typeof computePawukonChart> };

const rows: Row[] = [];
const found = new Set<number>();

const start = new Date(Date.UTC(2026, 0, 1));
for (let i = 0; i < 500 && found.size < TARGETS.size; i++) {
  const d = new Date(start.getTime() + i * 86400000);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const chart = computePawukonChart({ year: y, month: m, day });
  const p = chart.pawukon.day;
  if (TARGETS.has(p) && !found.has(p)) {
    found.add(p);
    rows.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`, p, pawukon: chart });
  }
}

rows.sort((a, b) => a.p - b.p);
for (const r of rows) {
  const w = r.pawukon.weton;
  const wewaran = r.pawukon.wewaran;
  console.log(
    [
      `p=${String(r.p).padStart(3)}`,
      r.date,
      `${w.idLabel.padEnd(15)}`,
      `wuku=${r.pawukon.pawukon.wuku.padEnd(13)}`,
      `caturwara=${wewaran.caturwara.padEnd(8)}`,
      `astawara=${wewaran.astawara.padEnd(7)}`,
      `sangawara=${wewaran.sangawara}`,
    ].join('  '),
  );
}
