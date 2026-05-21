import type { PawukonChart } from './engine.js';

/** Two-line Javanese-flavored text: weton + neptu. */
export function renderWetonText(chart: PawukonChart): string {
  const { weton } = chart;
  return `${weton.idLabel} (${weton.baliLabel}) — neptu ${weton.neptu}`;
}

/** Markdown block for the Javanese view. */
export function renderWetonMarkdown(chart: PawukonChart): string {
  const { weton } = chart;
  return [
    `**Weton:** ${weton.idLabel}`,
    ``,
    `| Komponen | Nilai | Urip |`,
    `|---|---|---|`,
    `| Hari (saptawara) | ${weton.saptawara} / ${weton.hari} | ${weton.uripSaptawara} |`,
    `| Pasaran (pancawara) | ${weton.pancawara} / ${weton.pasaran} | ${weton.uripPancawara} |`,
    `| **Neptu total** | | **${weton.neptu}** |`,
  ].join('\n');
}

/** Markdown block for the Balinese view (pawukon + wewaran). */
export function renderPawukonMarkdown(chart: PawukonChart): string {
  const { pawukon, wewaran } = chart;
  return [
    `**Pawukon:** day ${pawukon.day} / 210 — wuku **${pawukon.wuku}** (#${pawukon.wukuIndex + 1}), hari ke-${pawukon.dayInWuku + 1} (${wewaran.saptawara})`,
    ``,
    `| Wewaran | Nilai |`,
    `|---|---|`,
    `| Ekawara (1) | ${wewaran.ekawara ?? '—'} |`,
    `| Dwiwara (2) | ${wewaran.dwiwara} |`,
    `| Triwara (3) | ${wewaran.triwara} |`,
    `| Caturwara (4) | ${wewaran.caturwara} |`,
    `| Pancawara (5) | ${wewaran.pancawara} |`,
    `| Sadwara (6) | ${wewaran.sadwara} |`,
    `| Saptawara (7) | ${wewaran.saptawara} |`,
    `| Astawara (8) | ${wewaran.astawara} |`,
    `| Sangawara (9) | ${wewaran.sangawara} |`,
    `| Dasawara (10) | ${wewaran.dasawara} |`,
  ].join('\n');
}

/** Combined text rendering — weton line + compact pawukon line. */
export function renderPawukonText(chart: PawukonChart): string {
  const { weton, pawukon, wewaran, sasih } = chart;
  const lines = [
    `${weton.idLabel} (${weton.baliLabel}) — neptu ${weton.neptu}`,
    `Pawukon day ${pawukon.day}/210, wuku ${pawukon.wuku} (#${pawukon.wukuIndex + 1})`,
    `Wewaran: Tri=${wewaran.triwara}, Catur=${wewaran.caturwara}, Sad=${wewaran.sadwara}, Asta=${wewaran.astawara}, Sanga=${wewaran.sangawara}, Dasa=${wewaran.dasawara}`,
  ];
  if (sasih) {
    const phase = sasih.isTilem ? 'Tilem' : sasih.isPurnama ? 'Purnama' : sasih.isPangelong ? `Panglong ${sasih.penanggal}` : `Penanggal ${sasih.penanggal}`;
    lines.push(`Sasih: ${sasih.displayName} Saka ${sasih.saka} — ${phase}`);
  }
  return lines.join('\n');
}

/** Markdown block for sasih + Saka year (Balinese lunar). */
export function renderSasihMarkdown(chart: PawukonChart): string {
  const { sasih } = chart;
  if (!sasih) {
    return `*(Sasih unavailable — astronomical computation failed for this date)*`;
  }
  const phase = sasih.isTilem
    ? 'Tilem (new moon — last day of preceding sasih or first day of new sasih)'
    : sasih.isPurnama
      ? 'Purnama (full moon, ~mid-sasih)'
      : sasih.isPangelong
        ? `Panglong ${sasih.penanggal} (waning ${sasih.penanggal}/15)`
        : `Penanggal ${sasih.penanggal} (waxing ${sasih.penanggal}/15)`;
  const lines = [
    `**Sasih:** ${sasih.displayName}${sasih.isNampih ? ' (intercalary month — nampih)' : ''}`,
    ``,
    `| Komponen | Nilai |`,
    `|---|---|`,
    `| Saka year | ${sasih.saka} |`,
    `| Sasih name | ${sasih.sasih} (#${sasih.sasihNumber} in calendar order) |`,
    `| Position in Saka year | ${sasih.indexInSakaYear + 1} of ${sasih.isNampih ? 13 : 12} |`,
    `| Phase | ${phase} |`,
    `| Tilem civil date | ${sasih.tilemStart.baliDate.year}-${String(sasih.tilemStart.baliDate.month).padStart(2, '0')}-${String(sasih.tilemStart.baliDate.day).padStart(2, '0')} (Bali) |`,
  ];
  return lines.join('\n');
}
