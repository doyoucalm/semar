# Tarot Reader — Closing the 4 Gaps vs Labyrinthos

> Deep-research synthesis, 2026-05-30. 102 agents · 20 sources fetched · 82 claims →
> 25 verified (3-vote adversarial) · 21 confirmed, 4 killed. This is the **logic
> foundation** we restart from. Treat refuted/open items as design decisions, not
> settled fact.

Benchmark = **Labyrinthos** tarot app (Surya's reference for OUR tarot reader).
Our moat (do NOT lose it): cross-engine synthesis — tarot + BaZi + ZWDS + I-Ching +
Javanese weton. Labyrinthos is tarot/lenormand/runes only; no Chinese/Javanese systems.

---

## Gap 1 — Spreads (🔴 we have 1, Labyrinthos has 70+)

**Data model (confirmed, high confidence):**
```
Spread = { id, name, category, positions: [ { index, label, meaning } ] }
```
A spread is an **ordered list of positions, each carrying a position-semantic**.
This belongs in `packages/tarot` as a first-class type (currently positions are
hardcoded in the web layer — that's gap #3, same fix).

**Labyrinthos categories** (App Store, verbatim "70+ spreads"):
General (Single Card, Past/Present/Future, Celtic Cross, Situation/Action/Outcome),
Love (Relationship, Compatibility, Broken Heart), Career (Work Problems, Turbulent
Finances, Building Your Future), 8 Moon Phase, 22 Major-Arcana-inspired, 8 Wheel of
the Year, + custom-spread creation.

**Starter set to implement (~8-12):** Single Card (1) · Past/Present/Future (3) ·
Situation/Action/Outcome (3) · Celtic Cross (10) · + themed Love / Career / Year-Ahead.

**⚠️ CRITICAL CAVEAT:** the **exact position semantics** of Celtic Cross (10) and
Horseshoe (7) could NOT be verified — 3 separate position-list claims were refuted
(1-2 votes) because sources disagree on slot meanings. **Decision for tomorrow:**
pick ONE authoritative reference (e.g. Biddy Tarot OR Labyrinthos academy) and
standardize all position labels against it. Do not trust a single blog.
Celtic Cross = exactly 10 cards is confirmed; the 10 *meanings* are not.

---

## Gap 2 — Card meaning depth (🔴 we have 1-line upright/reversed)

**Richer per-card schema (confirmed):**
```
Card = {
  id, name, arcana, suit?, rank?, number?,
  keywords: string[],
  upright:  { overview, work, love, finance, health, mentality, advice },
  reversed: { overview, work, love, finance, health, mentality, advice },
  yesNo:    'yes' | 'no' | 'maybe',
  element:  'fire'|'water'|'air'|'earth',     // see Gap 4 mapping
  foolsJourney?: number,                       // Major Arcana 0-21 position
}
```
Quality RWS references (tarotx.net) structure each card as separate Upright/Reversed
sections each with Keywords / Overview / Work / Love / Finance / Health / Mentality /
Situation-and-advice. Labyrinthos adds context tags (Family/Friends/Education) + Yes/No.
Deck = 22 Major + 4 suits × 14 (Ace-10 + Page/Knight/Queen/King), Fool's-Journey framing.

**⚠️ Polarity nuance:** the open dataset (corpora) uses **light/shadow** polarity, NOT
upright/reversed orientation. Our deck has explicit reversals → map light/shadow →
upright/reversed *deliberately*, don't assume they're identical.

---

## Gap 3 — Spread as first-class in engine

Same fix as Gap 1: move the `Spread` type + position catalogue into `packages/tarot`,
out of the web layer. `drawCards` should accept a `Spread` and return cards bound to
positions. Author the position-semantic catalogue ourselves (see Gap 1 caveat).

---

## Gap 4 — "Mirror" reading analytics (🟡 we have CLI stats, web doesn't show)

**Aggregate over preset time buckets** (confirmed — Labyrinthos Mirror + Tarot Journal):
- most-common card
- suit distribution / most-common number
- reversal %
- Major-vs-Minor ratio
- elemental balance

**Time buckets (confirmed exact set):** alltime · specific year · this year ·
last 6mo · last 3mo · last 30d · last 7d.

Maps to a query layer: GROUP BY card, GROUP BY suit, COUNT(reversed)/COUNT(*),
COUNT(major)/COUNT(minor), filtered by time-bucket enum. We already compute most of
this in `packages/cli` stats — port to the web diary page.

**Elemental mapping (confirmed, RWS/Golden Dawn):**
Wands=Fire · Cups=Water · Swords=Air · Pentacles=Earth.
(Minority of decks swap Swords=Fire/Wands=Air — store as a per-suit constant with a
comment noting the convention.)

**Elemental dignities — 4×4 interaction matrix (confirmed):**
- same element → amplify
- Fire+Air → support · Water+Earth → support
- Fire-Water → enemies (weaken) · Air-Earth → enemies
- Fire-Earth → neutral · Water-Air → neutral

**This matrix is the bridge to our moat:** tarot elemental balance ↔ BaZi Wu Xing
(five-element) distribution. **OPEN QUESTION:** how to normalize tarot's 4 Western
elements against BaZi's 5 (Wood/Fire/Earth/Metal/Water)? No source addressed this
Semar-specific mapping — needs a custom correspondence layer we design ourselves.

---

## Open data & licensing (Gap 2/3 seed layer)

| Dataset | License | Coverage | Use for |
|---|---|---|---|
| **dariusk/corpora** `tarot_interpretations.json` | **CC0** (public domain) | all 78 — keywords, light/shadow meanings, fortune_telling | **meanings backbone** (cleanest for selling) |
| **metabismuth/tarot-json** | **MIT** (attribution) | 78 cards + bundled RWS scans 350×600px (~7.37MB) | **imagery** (retain MIT notice) |

**RWS imagery public-domain status (confirmed):**
- US: public domain since **1966** (publication + 28 + 28 renewal lapse).
- Life+70 (UK/EU): public domain since **1 Jan 2022** (Pamela Colman Smith d. 1951).
- US Games Systems' 1971 copyright (Reg. VA-101-718) covers **only new material** in
  their recolored edition (17 USC §103(b)) — original 1909/1911 Smith art is free.

**⚠️ Legal caveats (verify before commercial sale):**
- Status is officially "disputed"; US Games **actively enforces** against derivatives
  of its 1971 recolored edition + trademarks the "Rider-Waite"/"Waite" names.
  → Reuse ONLY the original 1909/1911 art/text. Author anything deriving from 1971.
- corpora's CC0 lives in README only (no standalone LICENSE file) and its text may be
  upstream-derived (possibly Brian Crick's `tarot-interpretations`). Effective, but
  **trace provenance before monetizing**.

---

## Net build plan (for tomorrow's restart-from-logic)

1. **Seed data layer:** import corpora (meanings, CC0) + metabismuth (art, MIT).
   Map light/shadow → upright/reversed deliberately.
2. **Author ourselves:** the spread-position catalogue (one authoritative reference)
   + the elemental-dignity 4×4 matrix + the tarot-element ↔ BaZi-Wu-Xing correspondence.
3. **Model as first-class tested engine features** in `packages/tarot`:
   `Spread` type + catalogue, richer `Card` schema, analytics/dignity helpers.
4. **Surface in web:** spread picker, deep card pages, "Mirror" stats on diary page.

## Refuted / unresolved (do not treat as fact)
- ❌ "RWS not PD in EU" — refuted 0-3; it IS PD in EU/UK since 2022.
- ❌ Three specific Celtic Cross / Horseshoe position-list wordings — refuted 1-2
  (source disagreement). Pick one reference and standardize.
- ❓ corpora text provenance / CC0 cleanliness for resale.
- ❓ Love/Career/Year-Ahead per-position semantics (names confirmed, meanings need authoring).
- ❓ tarot 4-element → BaZi 5-element normalization (design decision, no source).

## Key sources
- Labyrinthos App Store listing (primary) — 70+ spreads, Mirror analytics
- corpora `tarot_interpretations.json` (CC0) · metabismuth/tarot-json (MIT)
- Wikipedia: Rider–Waite Tarot, Pamela Colman Smith (PD status)
- tarotx.net (per-card schema) · tarotjournal.com (analytics buckets)
- Biddy Tarot (Celtic Cross = 10) · Labyrinthos academy (elemental dignities)
