# Astrology Engine Extension — Verified Research

> deep-research, run 2026-05-31 (verify phase fixed + resumed 2026-06-01).
> 108 agents · 25 sources · 101 claims → 25 verified (3-vote adversarial),
> **24 confirmed, 1 killed**, 10 synthesized. This is the FORMALLY-VERIFIED
> version that supersedes the earlier salvaged notes. It **validates the build
> already shipped** (`feat(astrology): 7 pluggable house systems + sidereal`,
> commit ade6ab7) — no code corrections needed.

## What the build did (all confirmed correct)

- **House systems pluggable from RAMC + obliquity + latitude + Asc/MC** — exactly
  the inputs Semar computes. ✓ (confirmed 3-0)
- **Reference = CircularNatalHoroscopeJS** (Unlicense / public domain) — the right
  source to port from. ✓
- **Placidus = iterative semi-arc trisection, no closed form, ~10 iters, fails
  >66° latitude** — matches our iterative impl + high-latitude caveat. ✓ (3-0)
- **Equal / Whole-Sign / Porphyry = trivial closed-form, no high-lat failure;
  Porphyry must be AUTHORED (absent from the open refs)** — we authored it. ✓
- **Sidereal = subtract an ayanamsa from tropical longitudes, one engine serves
  both** — exactly our approach. ✓ (3-0)
- **astronomy-engine = ±1 arcmin vs NOVAS — more than enough for natal work.** ✓ (3-0)

## Refinements for the STILL-OPEN items

### KB meanings (still must author — confirmed)
- **dariusk/corpora is CC0** and its `/data/divination/` has `zodiac.json` — but it
  is **THIN: sign-level only** (per-sign element/mode/etc), NOT planet-in-sign /
  planet-in-house / aspect / house-meaning prose. (3-0)
- So: bundle `zodiac.json` as a thin CC0 seed for sign attributes; **author the
  interpretive bulk ourselves** (or LLM-generate), optionally derived from the
  **public-domain Ptolemy *Tetrabiblos* (Ashmand tr., Gutenberg #70850)**. (3-0)
- No permissively-licensed STRUCTURED dataset for the interpretive layer exists.
  (kerykeion / AstrologerStudio remain AGPL — do not bundle.)

### Chart wheel (when we build it)
- **`@astrodraw/astrochart` — MIT, pure TypeScript, zero runtime deps, render-only**,
  consumes a planets object of degrees + a 12-cusp array (what we produce). ✓ (3-0)
- ⚠️ **Two caveats:** (a) re-confirm the LICENSE file at integration — one external
  source mis-called it GPL (primary sources = MIT); retain the notice regardless.
  (b) **Budget a small input ADAPTER** — the "no adapter needed, exact shape match"
  claim was **REFUTED 0-3**. Don't assume drop-in.
- Avoid `hew/astrology-chart-wheel` — unmaintained (1 commit, 0 releases, not on npm).

### Validation
- Validating Semar against astronomy-engine is **circular** (we're built on it).
  Use **astro.com / Swiss Ephemeris** (~1 mas vs JPL) as the independent gold
  standard for hand-checks. **Do NOT bundle Swiss Ephemeris** (AGPL-or-paid). (3-0)

## Default-config note
Research's synthesized recommendation: **Placidus + tropical** is the conventional
Western default. Our engine **defaults to whole-sign** (preserved for backward
compat) but exposes all 7 + sidereal — caller picks. Consider switching the web
default to Placidus when surfacing the chart.

## Killed / refuted
- ✗ (0-3) "@astrodraw/astrochart input is exactly what Semar produces, no adapter" —
  refuted. Plan for an adapter.

## Sources
- [CircularNatalHoroscopeJS (Unlicense)](https://github.com/0xStarcat/CircularNatalHoroscopeJS)
- [AstroScript Houses.pm (algorithm ref, Perl)](https://github.com/skrushinsky/astroscript/blob/master/lib/AstroScript/Houses.pm)
- [Swiss Ephemeris house-system docs](https://www.astro.com/swisseph/swisseph.htm)
- [dariusk/corpora /data/divination (CC0)](https://github.com/dariusk/corpora/tree/master/data/divination)
- [Ptolemy Tetrabiblos, Ashmand tr. (PD, Gutenberg #70850)](https://www.gutenberg.org/ebooks/70850)
- [@astrodraw/AstroChart (MIT)](https://github.com/AstroDraw/AstroChart) · [npm](https://www.npmjs.com/package/@astrodraw/astrochart)
- [astronomy-engine](https://github.com/cosinekitty/astronomy) · [astro.com chart (validation)](https://www.astro.com/cgi/chart.cgi)
