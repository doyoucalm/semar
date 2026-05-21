import { computeBazi } from '../src/engine.js';

const c = computeBazi({
  year: 1985, month: 5, day: 5,
  hour: 3, minute: 15,
  utcOffsetMinutes: 7 * 60,
  longitude: 107.61,
});

console.log('=== Lucky 1985-05-05 03:15 WIB Bandung ===');
console.log('Year :', c.year.stem + c.year.branch);
console.log('Month:', c.month.stem + c.month.branch);
console.log('Day  :', c.day.stem + c.day.branch);
console.log('Hour :', c.hour.stem + c.hour.branch);
