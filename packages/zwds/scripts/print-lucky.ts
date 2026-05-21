import { computeZWDSChart, renderZWDSText } from '../src/index.js';

const chart = computeZWDSChart({
  year: 1985, month: 5, day: 5,
  hour: 3, minute: 15,
  utcOffsetMinutes: 7 * 60,
  gender: 'male',
  lunarOverride: { year: 1985, month: 3, day: 16, isLeapMonth: false },
});

console.log(renderZWDSText(chart));
