/**
 * Semar mark generator — D3 approach.
 *
 * Outputs the same geometry as semar-mark.svg but built
 * programmatically via D3. Run in browser (preview/index.html)
 * or Node with jsdom.
 *
 * Usage (browser):
 *   import { renderMark } from './generate-mark.js'
 *   renderMark(document.getElementById('mark'), { size: 400 })
 *
 * Usage (Node + jsdom):
 *   const { JSDOM } = require('jsdom')
 *   const d3 = require('d3')
 *   // see generate-mark-node.js
 */

// ── Design tokens (mirrors semar-tokens.css) ─────────────────────
const TOKENS = {
  inkBg:       '#0d1119',
  inkElevated: '#1a1f2e',
  ember:       '#c9a961',
  parchment:   '#f4ead5',
  bronze:      '#8b7355',
};

// ── Post-Heaven Bagua (后天八卦) — angle from North, clockwise ────
// Each entry: [trigram unicode, name-cn, name-en, angle_deg]
const BAGUA = [
  ['☵', '坎', 'Kan · Water',    0   ],
  ['☶', '艮', 'Gen · Mountain', 45  ],
  ['☳', '震', 'Zhen · Thunder', 90  ],
  ['☴', '巽', 'Xun · Wind',     135 ],
  ['☲', '离', 'Li · Fire',      180 ],
  ['☷', '坤', 'Kun · Earth',    225 ],
  ['☱', '兑', 'Dui · Lake',     270 ],
  ['☰', '乾', 'Qian · Heaven',  315 ],
];

/**
 * Convert polar (radius, angleDeg from North CW) to cartesian.
 * @param {number} cx  centre x
 * @param {number} cy  centre y
 * @param {number} r   radius
 * @param {number} deg angle in degrees, 0 = top, clockwise
 */
function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * (Math.PI / 180); // rotate so 0° = top
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Append the Semar astrolabe mark to a container element.
 *
 * @param {Element}  container  DOM element to append the SVG into
 * @param {object}   opts
 * @param {number}   [opts.size=400]        SVG width/height in px
 * @param {string}   [opts.bg=TOKENS.inkBg] background fill (or 'none')
 * @param {function} opts.d3                D3 library reference
 */
export function renderMark(container, { size = 400, bg = TOKENS.inkBg, d3 } = {}) {
  if (!d3) throw new Error('Pass d3 as opts.d3');

  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 400; // keep ratios relative to 400px baseline

  // Radii (baseline 400px)
  const R = {
    outerDeco:   175 * scale,
    bezelOut:    155 * scale,
    bezelIn:     106 * scale,
    trigram:     131 * scale,
    innerCircle:  52 * scale,
    dot:         175 * scale,
  };

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${size} ${size}`)
    .attr('width', size)
    .attr('height', size)
    .attr('xmlns', 'http://www.w3.org/2000/svg');

  // ── Defs ────────────────────────────────────────────────────────
  const defs = svg.append('defs');

  const glowGrad = defs.append('radialGradient').attr('id', 'mark-glow');
  glowGrad.append('stop').attr('offset', '0%')
    .attr('stop-color', TOKENS.ember).attr('stop-opacity', 0.10);
  glowGrad.append('stop').attr('offset', '55%')
    .attr('stop-color', TOKENS.ember).attr('stop-opacity', 0.03);
  glowGrad.append('stop').attr('offset', '100%')
    .attr('stop-color', TOKENS.ember).attr('stop-opacity', 0);

  const innerGrad = defs.append('radialGradient')
    .attr('id', 'inner-fill').attr('cx', '40%').attr('cy', '35%').attr('r', '65%');
  innerGrad.append('stop').attr('offset', '0%').attr('stop-color', TOKENS.inkElevated);
  innerGrad.append('stop').attr('offset', '100%').attr('stop-color', TOKENS.inkBg);

  // ── Background ──────────────────────────────────────────────────
  svg.append('rect').attr('width', size).attr('height', size).attr('fill', bg);
  svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', size / 2)
    .attr('fill', 'url(#mark-glow)');

  // ── Outer decorative ring ───────────────────────────────────────
  svg.append('circle')
    .attr('cx', cx).attr('cy', cy).attr('r', R.outerDeco)
    .attr('fill', 'none')
    .attr('stroke', TOKENS.ember).attr('stroke-width', 0.6).attr('opacity', 0.30);

  // ── Bezel ───────────────────────────────────────────────────────
  svg.append('circle')
    .attr('cx', cx).attr('cy', cy).attr('r', R.bezelOut)
    .attr('fill', 'none')
    .attr('stroke', TOKENS.ember).attr('stroke-width', 1.6);

  svg.append('circle')
    .attr('cx', cx).attr('cy', cy).attr('r', R.bezelIn)
    .attr('fill', 'none')
    .attr('stroke', TOKENS.ember).attr('stroke-width', 1.0);

  // ── Sector dividers (r=bezelIn → r=outerDeco) ──────────────────
  BAGUA.forEach(([, , , deg]) => {
    const inner = polar(cx, cy, R.bezelIn,   deg);
    const outer = polar(cx, cy, R.outerDeco, deg);
    svg.append('line')
      .attr('x1', inner.x).attr('y1', inner.y)
      .attr('x2', outer.x).attr('y2', outer.y)
      .attr('stroke', TOKENS.ember).attr('stroke-width', 0.6)
      .attr('opacity', 0.40);
  });

  // ── Compass dots at outer ring ──────────────────────────────────
  BAGUA.forEach(([, , , deg]) => {
    const p = polar(cx, cy, R.dot, deg);
    svg.append('circle')
      .attr('cx', p.x).attr('cy', p.y).attr('r', 2.2 * scale)
      .attr('fill', TOKENS.ember).attr('opacity', 0.55);
  });

  // ── Trigrams ────────────────────────────────────────────────────
  BAGUA.forEach(([glyph, , , deg]) => {
    const p = polar(cx, cy, R.trigram, deg);
    svg.append('text')
      .attr('x', p.x).attr('y', p.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 22 * scale)
      .attr('fill', TOKENS.ember)
      .attr('font-family', 'serif')
      .text(glyph);
  });

  // ── Inner circle ────────────────────────────────────────────────
  svg.append('circle')
    .attr('cx', cx).attr('cy', cy).attr('r', R.innerCircle)
    .attr('fill', 'url(#inner-fill)');
  svg.append('circle')
    .attr('cx', cx).attr('cy', cy).attr('r', R.innerCircle)
    .attr('fill', 'none')
    .attr('stroke', TOKENS.ember).attr('stroke-width', 1.0).attr('opacity', 0.85);

  // ── Center character 天 ─────────────────────────────────────────
  svg.append('text')
    .attr('x', cx).attr('y', cy)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 46 * scale)
    .attr('fill', TOKENS.ember)
    .attr('font-family', "'Ma Shan Zheng','Noto Serif TC','AR PL UMing CN',serif")
    .text('天');

  return svg.node();
}
