/**
 * Text-based calendar view for "semar cal [YYYY-MM]".
 *
 * Days with diary entries are marked with *.
 * Today (if in the same month) is bracketed [].
 *
 * Example output for May 2026:
 *
 *        May 2026
 *  Mo Tu We Th Fr Sa Su
 *               1  2  3
 *   4  5  6  7  8  9 10
 *  11 12 13 14 15 16 17
 *  18 19 20 21 22 23*24*
 * [25]26 27 28 29 30 31
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function renderCalendar(
  year: number,
  month: number,           // 1-based
  entryDates: Set<string>,
  todayStr?: string,       // YYYY-MM-DD, defaults to UTC today
): string {
  const today = todayStr ?? new Date().toISOString().slice(0, 10);

  const monthName = MONTH_NAMES[month - 1]!;
  const paddedTitle = `       ${monthName} ${year}`;

  // 0=Sun…6=Sat → convert to Mon-start 0=Mon…6=Sun
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const startOffset = (firstDow + 6) % 7;

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Each cell is exactly 3 chars: " N " / "N* " / "[N]"
  const cell = (d: number): string => {
    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const n = String(d).padStart(2, ' ');
    if (ds === today) return `[${n.trim().padStart(2)}]`; // [D]
    if (entryDates.has(ds)) return `${n}*`;
    return `${n} `;
  };

  // Pad all cells to 3 chars (today cell is [DD] = 4 chars for 2-digit days > 9)
  // Actually let's keep uniform 3-char cells: use " D]" / "[D " isn't great.
  // Simpler: today = "DD<" marker (all 3 chars), entry = "DD*", normal = "DD "
  const cell3 = (d: number): string => {
    const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const n = String(d).padStart(2, ' ');
    if (ds === today) return `\x1b[1m${n}\x1b[0m<`; // bold + <
    if (entryDates.has(ds)) return `${n}*`;
    return `${n} `;
  };

  // Build plain-text version (no ANSI) as well for environments that need it
  const cells: string[] = [];
  for (let i = 0; i < startOffset; i++) cells.push('   ');
  for (let d = 1; d <= daysInMonth; d++) cells.push(cell3(d));

  const rows: string[] = [paddedTitle, ' Mo Tu We Th Fr Sa Su'];
  for (let i = 0; i < cells.length; i += 7) {
    const chunk = cells.slice(i, i + 7);
    // Pad last row to full week width
    while (chunk.length < 7) chunk.push('   ');
    rows.push(' ' + chunk.join(''));
  }

  // Legend
  rows.push('');
  rows.push(' *  = ada entry    <  = hari ini');

  return rows.join('\n');
}

/** Parse "YYYY-MM" arg or default to current UTC month. */
export function parseYearMonth(arg?: string): { year: number; month: number } {
  if (arg) {
    const m = arg.match(/^(\d{4})-(\d{1,2})$/);
    if (m) {
      const year = parseInt(m[1]!, 10);
      const month = parseInt(m[2]!, 10);
      if (month >= 1 && month <= 12) return { year, month };
    }
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}
