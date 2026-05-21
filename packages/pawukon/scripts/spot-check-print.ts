import { computePawukonChart } from '../src/engine.js';

const DATES: Array<[number, number, number, string?]> = [
  [1985, 5, 5, 'Lucky anchor'],
  [2026, 5, 19, 'today'],
  [2026, 1, 15, 'random Jan'],
  [2026, 6, 13, 'p=70 pre-hold'],
  [2026, 6, 14, 'p=71 hold start'],
  [2026, 6, 15, 'p=72 hold mid'],
  [2026, 6, 16, 'p=73 hold end'],
  [2026, 6, 17, 'p=74 post-hold'],
  [2026, 6, 18, 'p=75'],
  [2026, 4, 5, 'p=1 Dangu start'],
  [2026, 4, 9, 'p=5 post-Dangu hold'],
];

for (const [y, m, d, note] of DATES) {
  const c = computePawukonChart({ year: y, month: m, day: d });
  console.log(
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}  p=${String(c.pawukon.day).padStart(3)}  ${c.weton.idLabel.padEnd(15)}  wuku=${c.pawukon.wuku.padEnd(13)}  tri=${c.wewaran.triwara.padEnd(7)} catur=${c.wewaran.caturwara.padEnd(7)} asta=${c.wewaran.astawara.padEnd(7)} sanga=${c.wewaran.sangawara.padEnd(8)} dasa=${c.wewaran.dasawara.padEnd(7)}  // ${note ?? ''}`,
  );
}
