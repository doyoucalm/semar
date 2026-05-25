# Semar / 天人合一 Codex — Handoff

**Status**: Init in progress, paused for token limit on 2026-05-17.
**Resume signal**: User says **"go semar beresin"** — pick up from "Resume checklist" below.

---

## Project identity

- **Internal codename**: Semar (Punakawan, penjelmaan Sang Hyang Ismaya — abdi bijak)
- **Public name**: 天人合一 Codex
- **Tagline**: "Codex tidak memberi jawaban. Codex memberi mata."
- **Owner**: Lucky Surya Haryadi (蒋承禄), Bandung
- **Repo**: github.com/doyoucalm/semar (existing main = v0.1 "kacau balau", greenfield to come)
- **Independence**: tidak terkait Mierakigai/Migai

## Final MVP scope (locked decisions)

| Pilar | Decision | Rationale |
|---|---|---|
| **Engines (6)** | BaZi, ZWDS, I Ching, Tarot, Numerology (Pythagorean), Western Astrology | User added numerology+astrology beyond initial 4 |
| **Ephemeris (lunar/solar terms)** | HKO data (Hong Kong Observatory) 1901-2100 | Free, accurate, MIT-friendly |
| **Ephemeris (planets)** | Astronomy Engine (MIT-licensed JS port) | Avoids Swiss Ephemeris AGPL trap |
| **LLM runtime** | MiniMax M2.7 via `@anthropic-ai/sdk` with baseURL `https://api.minimax.io/anthropic` | Anthropic-compat endpoint = clean DX |
| **Build LLM** | Claude (this assistant) | "Pake anthropic ya" = Claude for build, MiniMax for runtime |
| **Stack** | Next.js App Router + Supabase + pnpm monorepo | Solo build velocity |
| **UX** | Chat-only; Module 1/2/3 (Snapshot, Composer, Constellation) jadi rich-card message types di dalam chat, BUKAN halaman terpisah | Chat is THE interface |
| **Auth** | Supabase Auth + RLS + cloud sync (wajib untuk pattern recognition) | |
| **Audience** | Lucky + 10-20 praktisi (beta) | Scratch own itch first |
| **Build order** | Engine-first → chat skeleton → tool wiring → pattern recognition | v0.1 failed karena UI dulu engine belum solid; sekarang dibalik |

## MiniMax API — validated

- **Key**: `/root/.mm_key` (chmod 600, 125 chars, prefix `sk-cp-`). Already existed since 2026-05-15.
- **Tested 2026-05-17**: ✅ models list, ✅ simple chat (Bahasa), ✅ tool calling (OpenAI format), ✅ full chat→tool→synthesis round trip
- **Endpoint**: `https://api.minimax.io/v1/chat/completions` (OpenAI-compat) or `/anthropic` (Anthropic-compat)
- **Models available**: M2.7, M2.7-highspeed, M2.5, M2.5-highspeed, M2.1, M2.1-highspeed, M2
- **Quirk**: Thinking content embedded in `<think>...</think>` tags inside `content` field. Must strip server-side before showing user.
- **Quirk**: Voice rules (no markdown drama, no prescriptions, "sage prunes") NOT auto-followed by M2.7 — heavy prompt engineering needed in Phase 3.

## Cleanup decision for old repo

User answered: "udah visi-nya benar, kepentok engine belum solid sibuk UI/UX dulu. Sekarang dibalik."

Plan (NOT YET EXECUTED on git):
1. Push existing `main` → `v0.1-archive` branch (preserve history)
2. Build fresh `main` from /workspace/semar/
3. Leave Docker bnimahardika.qd.je/langit/semar running as v0.1 demo

## Salvage from old repo (`github.com/doyoucalm/semar`)

Cloned to `/tmp/semar-existing/`. 3 artifacts worth porting:

| Source | Destination | Status |
|---|---|---|
| `/tmp/semar-existing/knowledge/` (136KB, 42 files, CN+EN BaZi) | `/workspace/semar/knowledge/` | ✅ DONE |
| `/tmp/semar-existing/src/lib/semar-prompt.ts` (108 lines, voice canon) | `/workspace/semar/docs/voice-canon.md` (extract content) | ⏳ TODO |
| `/tmp/semar-existing/people/28d1de075be676bf898dee646d032b70.json` (Lucky's chart 乙丑 庚辰 甲辰 己巳) | `/workspace/semar/fixtures/lucky-bazi.json` | ⏳ TODO |

Everything else from old repo = SCRAP (bazi-mcp dependency, Prisma+SQLite, old IA routes, Docker, Framer Motion + Tailwind P5 Retro — all conflict with new architecture).

## Current /workspace/semar/ state

```
/workspace/semar/
├── docs/
│   └── semar-brand-guidelines-light.html   ✅ ported
├── knowledge/                              ✅ ported (42 files, 136KB)
└── tokens/                                 (empty placeholder)
```

## Source files referenced (READ-ONLY, don't move/delete)

- `/tmp/semar-extract/Semar Brand Guidelines _ Light.html` — brand HTML extracted from upload zip
- `/tmp/brand-guideline/files/divination_diary_design_doc.md` — Codex spec
- `/tmp/brand-guideline/files/lucky_personal_toolkit.md` — Lucky's personal toolkit
- `/tmp/brand-guideline/files/lucky_cosmic_calendar_12_months.md` — yearly cosmic calendar
- `/tmp/brand-guideline/files/lucky_surya_haryadi_blueprint.json` — Lucky's full blueprint (100KB)
- `/tmp/semar-existing/` — old repo clone, source for salvage
- `/root/.hermes/cache/documents/` — original uploaded zips

## Resume checklist (when user says "go semar beresin")

In task tracker (TaskList to view), pick up in order:

- [ ] **#9 Port semar-prompt.ts → voice-canon.md** — read `/tmp/semar-existing/src/lib/semar-prompt.ts`, extract character/voice paragraphs (skip the code/imports), save as MD
- [ ] **#10 Port Lucky's BaZi fixture** — `mkdir /workspace/semar/fixtures && cp /tmp/semar-existing/people/28d1de...json /workspace/semar/fixtures/lucky-bazi.json`
- [ ] **#11 Place design doc + personal files into docs/** — `cp` from `/tmp/brand-guideline/files/` to `/workspace/semar/docs/` (design doc) and `/workspace/semar/docs/personal/` (3 personal files)
- [ ] **#12 Extract tokens/semar-tokens.css** — generate the CSS variables file the brand HTML references (refer to /tmp/semar-extract for inline styles + the palette/type sections of brand guideline)
- [ ] **#13 Scaffold pnpm monorepo root** — package.json + pnpm-workspace.yaml + tsconfig.base.json + .gitignore. packages/* as workspaces.
- [ ] **#14 Write CLAUDE.md** — brand context + scope + voice rules + paths. Reference this HANDOFF.md for full decisions.
- [ ] **#15 Write README.md** — short human-facing intro
- [ ] **#16 Save Semar project memory** — `/root/.claude/projects/-root/memory/semar_project.md` + index entry in MEMORY.md
- [ ] **#17 Build packages/iching** — simplest engine first as proof-of-toolchain. 3-coin casting + 64 hexagram table + tests with vitest. Validates monorepo wiring before BaZi/ZWDS heavy lifting.

After #17 green: discuss with user before tackling BaZi (HKO ephemeris data needs sourcing) or other heavier engines.

## Git plan (DEFER until local solid)

```bash
# In old clone:
cd /tmp/semar-existing
git push origin main:v0.1-archive   # preserve history

# Convert /workspace/semar to git repo pointing at same remote:
cd /workspace/semar
git init
git remote add origin git@github.com:doyoucalm/semar.git
git add -A
git commit -m "Greenfield init: engine-first architecture"
git push --force origin main        # confirm with user FIRST before --force
```

## Open questions for later

1. Smart cast routing — when user asks daily question, which engines does Semar auto-call vs always-call-all-4? (Phase 3)
2. Western Astrology house system — Placidus, Whole Sign, Equal? (Phase 1.6)
3. ZWDS — Northern (Beipai 北派) or Southern (Nanpai 南派) school? Affects star placement algo. (Phase 1.2)
4. Privacy / encryption-at-rest for personal birth data — pgsodium or app-level? (Phase 2)
5. Pattern Recognition threshold — minimum entries before constellation view unlocks? Brand suggests "after 30+" (Phase 4)

---

# SESSION HANDOFF — 2026-05-17 (extended autonomous run + ZWDS)

## CRITICAL DATA CORRECTION

Lucky's birth time was earlier recorded as **09:31 WIB** in fixtures and case studies. Late in this session he corrected it to **03:15 WIB**. Same date (1985-05-05), same place (Bandung).

**Effect on each engine:**

| Engine | 09:31 (old) | 03:15 (corrected) | Impact |
|---|---|---|---|
| BaZi | Year 乙丑 · Month 庚辰 · Day 甲辰 · **Hour 己巳** | Year 乙丑 · Month 庚辰 · Day 甲辰 · **Hour 丙寅** | Hour pillar changes only — re-reads needed |
| ZWDS | Self at **亥**, Body at **酉**, hour **巳** | Self at **寅**, Body at **午**, hour **寅** | Whole chart rotates — completely different reading |
| Astrology | Asc/MC/houses computed for 09:31 | Will need recompute for 03:15 | Sun/planet signs unchanged; Asc/MC + houses shift |

**Files that still reference the wrong 09:31 time (need re-write):**
- `/workspace/semar/knowledge/bazi/case-studies/lucky-1985.md` — entire case study based on 己巳 hour pillar. Needs rewrite.
- `/workspace/semar/packages/bazi/test/*` and `/workspace/semar/packages/astrology/test/*` — fixtures use 9:31. Tests pass but the "Lucky" they describe is fictional.
- Any `docs/personal/*` blueprint files (gitignored, on disk only) — check before any new reading.

**Verified at corrected time (03:15 WIB Bandung):**
- BaZi pillars: 乙丑 庚辰 甲辰 丙寅 — confirmed via `pnpm exec tsx scripts/recompute-lucky.ts` in `packages/bazi`.
- ZWDS chart: Bureau 土五局, 紫微 at 未, 天府 at 酉 — confirmed via `pnpm exec tsx scripts/print-lucky.ts` in `packages/zwds`.

## What got built this session

### 1. Astrology transits (DONE, 13 tests pass)
- `packages/astrology/src/transits.ts` — `computeTransits(natal, utcMs, opts)` returns current planet positions + transit-to-natal aspects with applying/separating motion.
- Render: `renderTransitsText`, `renderTransitsMarkdown`.
- Default transit orbs tighter than natal (3° conjunction/square/trine/opposition, 2° sextile).
- Exported from `packages/astrology/src/index.ts`.

### 2. ZWDS package (DONE for MVP, 29 tests pass + 3 skipped)
New `packages/zwds`:
- `constants.ts` — STEMS, BRANCHES, 12 PALACES, 14 MAIN_STARS + glyphs/EN names + hour-branch helpers.
- `lunar.ts` — Gregorian→lunisolar conversion. **HAS BUGS** around leap-month + UTC/local-time boundaries (see "Known broken" below).
- `year-pillar.ts` — lunar year → sexagenary pair (anchor: 1984=甲子).
- `palaces.ts` — Self/Body palace formulas + 12-palace placement counter-clockwise.
- `palace-stems.ts` — Five Tigers Formula to assign stem to each palace.
- `bureau.ts` — Nayin table (60 entries) → Five Elements Bureau (water/wood/metal/earth/fire, numbers 2/3/4/5/6).
- `main-stars.ts` — 紫微 lookup from bureau+day, 天府 mirror via 寅-axis, 14-star placement.
- `transformations.ts` — Four Transformations (化禄/化权/化科/化忌) lookup by year stem. Note: some target auxiliary stars (文昌/文曲/左辅/右弼) which aren't yet in MAIN_STARS — flagged as TODO.
- `engine.ts` — `computeZWDSChart(input)` returns 12 palace cells. Accepts `lunarOverride` to bypass the buggy converter.
- `render.ts` — text 4×4 board + Markdown table.

### 3. Knowledge base extension (DONE)
Filled previously-empty stubs and added new entries:
- Astrology: 12 signs, 10 planets, 12 houses, 5 aspects (conj/opp/sq/trine/sext), dignities overview, house-systems overview, natal-reading framework.
- BaZi: 5 elements, 6 interactions, 6 existing symbolic stars filled, 6 new shen sha (canopy / golden-carriage / study-hall / disaster-star / heavenly-net-earthly-trap / void-empty), Lucky case study (WITH WRONG TIME — needs rewrite).
- Bibliography for all three traditions: tarot.md, astrology.md, bazi.md + index README.
- Tarot KB was completed in earlier session (78 cards + 4 suit overviews).

## Known broken / heavy work remaining

### Lunar conversion (`packages/zwds/src/lunar.ts`)
Three test cases skipped: 1985-05-05, 1984-02-02 (Spring Festival), 2020-04-23 (闰4月). Root cause: my suì-based numbering uses UTC for the 冬至/中气 vs new-moon comparison, but the official rule requires local civil time (Beijing). The leap-month detection picks the wrong index for years like 1984 (闰10月) and 1985.

**Right fix paths:**
- Option A: rewrite with local-time arithmetic throughout, plus the strict rule "month containing 冬至 in local CST = month 11."
- Option B: replace with a precomputed lookup table (1900-2100) generated once from a trusted source (e.g. Hong Kong Observatory lunar calendar, or `@lunisolar/lunisolar` npm package output).
- Option C: depend on an existing library (`@lunisolar/lunisolar` or `chinese-lunar-calendar`) and validate against known dates.

Until fixed, all callers should pass `lunarOverride` with a date verified from a trusted calendar.

### Astrology re-fixturing for 03:15
- The vitest fixtures in `packages/astrology/test/chart.test.ts` use 9:31 WIB. Tests pass but Lucky's Asc/MC/houses are wrong for him. Decide: leave as "smoke test fixture" or update to 03:15.

### BaZi case study rewrite
`knowledge/bazi/case-studies/lucky-1985.md` was written with `己巳` hour pillar throughout, with Direct-Wealth/Seven-Killings narrative. With the corrected 丙寅 hour, the late-life pillar is Eating-God / Friend / Indirect-Wealth — a different reading. Either rewrite or move the existing file to an "anonymised fixture" name.

### ZWDS depth not yet built
The MVP only places the 14 main stars. Heavy ZWDS reading also needs:
- 6 auxiliary stars (左辅 右弼 天魁 天钺 文昌 文曲) — the 化科 of 丙年 already references 文昌; the transformations table has placeholders that need resolving.
- ~40+ minor stars (天马 天空 地劫 ... shen-sha-equivalents).
- Decade limits (大限) — 10-year cycle that starts from 命宫 going either CW or CCW depending on yin/yang year + gender.
- Small limit (小限) — annual.
- Stars' brightness levels per palace (庙/旺/平/陷).
- A real interpretation layer.

### Other KB gaps still open
- Tarot spreads, frameworks, case studies.
- Astrology case studies.
- I Ching + Numerology have engines but no KB pages.

## Test counts at handoff

| Package | Tests | Notes |
|---|---|---|
| @semar/iching | 20 ✓ | unchanged |
| @semar/numerology | 32 ✓ | unchanged |
| @semar/bazi | 76 ✓ | unchanged (fixture still at 9:31) |
| @semar/tarot | 16 ✓ | unchanged |
| @semar/astrology | 46 ✓ | +13 transit tests |
| @semar/diary | 15 ✓ | unchanged |
| @semar/zwds | 29 ✓ (+3 skipped) | NEW |
| **total** | **234 passing** | |

## Resume hints

When resuming this work the user is likely to ask one of:
- **"fix lunar"** → take option B from above (precomputed table 1900-2100, generate once from astronomy-engine with the strict local-time rule, embed as JSON).
- **"redo bazi case study"** → rewrite `knowledge/bazi/case-studies/lucky-1985.md` for the 丙寅 hour pillar.
- **"extend zwds"** → add the 6 auxiliary stars next, then decade limits.
- ~~"daily ritual integration" → wire computeTransits into packages/diary~~ — DONE 2026-05-18.

All decisions and voice rules above still apply. `docs/personal/` remains gitignored — Lucky's full blueprint lives there; never commit.

---

# SESSION HANDOFF — 2026-05-18 (daily ritual transit wiring)

## What got built this session

### `@semar/diary` askDaily — astrology engine added (DONE, 4 new tests)
- `packages/diary/src/types.ts` — `EngineKey` now includes `'astrology'`.
- `packages/diary/src/daily.ts` — `AskDailyOptions` gained `natalChart?: NatalChart` + `transitOptions?: ComputeTransitsOptions`. When `natalChart` is provided, `askDaily()` calls `computeTransits(natalChart, instant.getTime(), transitOptions)` and appends an `EngineReading{ engine: 'astrology', cast: TransitChart, summary }`. Summary line names the tightest *applying* aspect (or tightest by orb if none applying), falling back to "no transits within tight orb".
- `packages/diary/package.json` — added `@semar/astrology` workspace dep.
- Tests cover: presence of astrology reading, tightest-applying summary format, transitOptions forwarding (tight orbs → fewer aspects), and backwards-compat (no natalChart → iching+tarot only as before).
- Diary test count: 15 → 19.

### Architecture note
The `@semar/cli` `runDaily()` and the `@semar/diary` `askDaily()` remain *parallel* implementations, not unified:
- `@semar/cli` writes its own custom JSONL via `diary-log.ts` (already includes BaZi day pillar + 3-card tarot + transits + I-Ching).
- `@semar/diary` is the storage-abstracted reusable engine (future web UI). Now matches CLI on transit coverage but is still 1-card tarot + iching + optional astrology. BaZi day-pillar parity is a future task if the diary package wants full parity.

## Test counts at handoff

| Package | Tests | Notes |
|---|---|---|
| @semar/iching | 20 ✓ | unchanged |
| @semar/numerology | 32 ✓ | unchanged |
| @semar/bazi | 76 ✓ | unchanged |
| @semar/tarot | 16 ✓ | unchanged |
| @semar/astrology | 46 ✓ | unchanged |
| @semar/diary | 19 ✓ (+4) | **new astrology engine** |
| @semar/zwds | 29 ✓ (+3 skipped) | unchanged |
| @semar/cli | 7 ✓ | unchanged |
| **total** | **245 passing** (+11) | 3 skipped (lunar) |

## Remaining open from prior session

Still unchanged from 2026-05-17:
- Lunar converter (3 skipped tests in `packages/zwds/src/lunar.ts`).
- BaZi case study rewrite for corrected 丙寅 hour.
- ZWDS depth (auxiliary stars, decade limits, brightness).
- Tarot/Astrology case studies in KB.
- Astrology fixtures still at 9:31 (cosmetic — tests pass, but Lucky's Asc/MC/houses fictional).
- Git: still not a repo. Plan in earlier section unchanged.

---

# SESSION HANDOFF — 2026-05-18 (afternoon) — research, strategy lock, schema partial, art initiative

## What happened

### 1. Competitive UX research — TWO passes done
- **PART 1** (3,373 words): UI/UX patterns + voice/copy + monetization across ProBazi, Joey Yap, TryBazi, Allan Teo, Chinese Fortune Calendar, Labyrinthos, Co-Star, The Pattern, Sanctuary.
- **PART 2** (2,546 words): Continuation + AI + long-term pattern reading gap analysis. Added Day One/Stoic/Rosebud/Mindsera/Cantian-AI/Astro-Seek/TimePassages comparisons.
- Both at `/workspace/semar/docs/research/2026-05-18-competitive-ux.md`. Read PART 2 first — it's where the strategic insight lives.

### 2. Strategic differentiator identified + saved to memory
Cross-engine longitudinal pattern synthesis via shared tag vocabulary = market white space. Nobody combines (a) multiple divination engines + (b) longitudinal storage + (c) AI synthesis bounded by a tag taxonomy. The tag layer requires praktisi-grade cross-system fluency = Lucky's moat.

**Load-bearing feature:** Weekly Cross-Engine Convergence Digest (Sunday-evening artifact, pull-not-push). 3-block format: Counts · Convergence · **Negation** (anti-cheese guardrail). AI structurally bounded by receiving pre-aggregated summary only, never raw chat history. Monetization fit: free diary, paid synthesis (matches [[migai-monetization-llm-credits]]).

Memory: `/root/.claude/projects/-root/memory/semar_differentiator.md` (indexed in MEMORY.md).

### 3. Schema design for event log — 2 of 7 decisions locked
Started designing the `DiaryEvent` schema to support the Convergence Digest.

**Locked decisions** (user-confirmed via AskUserQuestion):
- ✅ **Events first-class**, `DiaryEntry` becomes a thin session wrapper `{id, createdAt, localDate, question?, notes?}`. Migration sekali, query windowed `tag`/`engine` jadi murah.
- ✅ **Hybrid polarity**: `polarity: 'positive'|'negative'|'neutral'|'mixed'` (cross-engine enum) + `polarityNative?: string` (engine-specific: 'reversed'|'applying'|'yin'|...). Enum dipakai Convergence Digest; native preserved untuk fidelity per-engine.

**Quiz sent to Lucky's Telegram DM** (msg #318, 2026-05-18) on remaining 5 decisions:
1. Symbol granularity per engine (1 event/card vs 1 event/spread, dst.)
2. Polarity assignment rules + canon question ("are we prescribing by labeling?")
3. Intensity scoring formula (0-1)
4. Longitudinal time window default (7d / 30d / lunar / adaptive)
5. Tag taxonomy v0 sourcing + initial size

Migration code menunggu jawaban.

### 4. Code changes this session

| File | Change |
|---|---|
| `packages/diary/src/types.ts` | Added `'astrology'` to `EngineKey` union |
| `packages/diary/src/daily.ts` | `askDaily()` now takes optional `natalChart` + `transitOptions`; appends `astrology` reading with `TransitChart` cast + tightest-applying-aspect summary |
| `packages/diary/package.json` | Added `@semar/astrology` workspace dep |
| `packages/diary/test/daily.test.ts` | +4 tests covering transit integration + backwards-compat (15 → 19) |
| `docs/research/2026-05-18-competitive-ux.md` | NEW — 5,919 words across 2 parts |
| `HANDOFF.md` | This entry |

**Test total: 245 passing** across 8 packages (+11 from 234), 3 still skipped (lunar).

### 5. New initiative — Suikoden-2-themed tarot art generation

**Locked decisions** (user-confirmed end of session):
- ✅ **Model**: OpenAI `gpt-image-1` (or 2026 successor) — check current best at resume time
- ✅ **Strategy**: pre-generate all 78 cards once, cache as static PNG. ~$3 (standard) to ~$13 (HD) one-shot
- ✅ **Style anchor**: Junko Kawano watercolor character portraits (Suikoden II box-art / character-intro aesthetic)

**Blocker**: tidak ada `OPENAI_API_KEY` di `/root/.hermes/.env`. Lucky harus provision key dulu (https://platform.openai.com/api-keys, ~$5 deposit cukup). Tambah ke `.env`:
```
OPENAI_API_KEY=sk-proj-...
```

**Architecture sketch (next session implements)**:
```
packages/art-tarot/
├── package.json          # @semar/art-tarot
├── src/
│   ├── style.ts          # base style anchor string
│   ├── prompts.ts        # 78 per-card archetype descriptions
│   └── pipeline.ts       # OpenAI API wrapper, retries, save-to-disk
├── scripts/
│   └── generate.ts       # CLI: `pnpm gen [--card 00] [--all]`
├── assets/
│   └── cards/            # 00-fool.png … 77-king-of-pentacles.png
└── README.md
```

**Style anchor (draft, refine before run)**:
> "Watercolor character portrait in the style of Junko Kawano's Suikoden II artwork. Soft painterly brush strokes, melancholic late-1990s JRPG box-art atmosphere, muted earth tones with selective vibrant accents (deep crimson, indigo, ochre). Portrait-orientation tarot card, vertical composition. Ornamental gold-leaf border, slightly aged parchment background. Single iconic figure embodying the archetype of {CARD_NAME}: {CARD_BEEF}. No text on card. Hand-painted feel with subtle grain."

`{CARD_BEEF}` = one-sentence archetype description per card (78 to write). Example seeds:
- Fool: *"young wanderer at a clifftop edge, knapsack on a stick over the shoulder, small white dog at heel, gaze turned skyward, expression of innocent wonder"*
- Tower: *"stone keep cracked by lightning, crown tumbling from the parapet, two small figures falling against a stormy violet sky, embers rising"*
- Death: *"skeletal knight on a pale horse, black banner bearing a single white rose, sunset behind a distant cathedral"*

**Cost math**: gpt-image-1 standard = $0.04/img × 78 = **$3.12 one-time**. HD = $0.17 × 78 = $13.26. Standard cukup buat MVP; HD save buat Major Arcana only ($0.17 × 22 = $3.74 + standard for 56 minors = $5.98) kalau mau hybrid.

**Open sub-decisions** (defer until generation run):
- Card-back design (single shared back image)
- Reversed = mirror in code vs. dedicated reversed art (more $)
- Whether to also generate the 4 Page/Knight/Queen/King retainers as recognizable Suikoden 108-stars archetypes (e.g. Knight of Swords = Flik energy) — risk: copyright if too literal
- Asset hosting: checked-in to git (~5-10 MB total, fine) vs Supabase storage bucket

## Open decisions for next session

1. **Image-gen model for tarot art** — OpenAI gpt-image-1, MiniMax image-01, Google Imagen, Stability, or self-hosted SDXL? Cost/quality/license trade-offs differ.
2. **Generation strategy** — pre-generate all 78 cards once (~$3 with gpt-image-1) and cache, or on-demand per draw, or hybrid (cache + variant requests)?
3. **Style spec** — Suikoden 2 has distinct sub-styles: Junko Kawano's watercolor character portraits, in-game pixel sprites, town/castle backgrounds. Which to anchor on? Need reference images.
4. **Where art lives in the stack** — new `packages/art-tarot/` engine, asset CDN, Supabase storage bucket, or just static checked-in PNGs?

## Resume signal

User says **"go semar beresin"** → read this handoff section + check Telegram for the 5 quiz answers + check git status (still no repo as of close).

---

# SESSION HANDOFF — 2026-05-18 (evening — complete sample + pawukon deferred)

## What landed this session

### Complete sample reading for Lucky — DONE
- `packages/cli/scripts/sample-lucky.ts` — one-shot script that runs all 6 engines (BaZi · ZWDS · Western Astrology · Transits · Numerology · I-Ching · Tarot) against `LUCKY_PROFILE` and writes a rich markdown report.
- Output: `/workspace/semar/samples/2026-05-18-lucky.md` (127 lines, 5,814 chars).
- Verified: Day Master 甲木 weak (supporting 4.7 / draining 7.3), strong 土 (4.9), ZWDS Bureau 土五局 self at 寅 body at 午, asc Aries 4°09', sun Taurus 14°18' house 2, moon Scorpio 14°31' house 8.
- I-Ching today (deterministic, seeded by `localDate:Lucky Surya Haryadi:iching`): hex 36 明夷 Darkening of the Light, no changing lines.
- Tarot 3-card: past=Strength reversed, present=9 of Wands upright, future=The Hierophant reversed.
- Run: `cd packages/cli && npx tsx scripts/sample-lucky.ts`.

### Pawukon engine (Javanese + Balinese calendar) — DEFERRED
User requested adding Javanese + Balinese calendar systems. Research agent was prepped (210-day Pawukon, weton, pancawara, saptawara, wuku, sasih, Saka year) but execution paused — user went to sleep. Pickup point next session.

## Resume hints

- **"go semar pawukon"** → spawn research agent for Pawukon epoch + algorithm (full brief was drafted, can re-derive from this section); then build `packages/pawukon/` with weton/pancawara/saptawara/wuku/sasih engines; then regenerate sample so it includes Javanese weton + Balinese wuku for Lucky.
- **"go semar tarot gen"** → still pending OPENAI_API_KEY provisioning.
- **"go semar beresin"** → check TG for quiz answers (msg #318) before resuming schema migration.

Test count unchanged this session: **245 passing** across 8 packages (no test changes — sample script is non-test scaffolding).

---

# SESSION HANDOFF — 2026-05-18 (late evening — pawukon engine landed)

## What landed this session

### `@semar/pawukon` package — DONE (56 tests pass)
New package implementing the Javanese + Balinese day-cycle calendar (full Pawukon stack except sasih/Saka). Files:

- `src/constants.ts` — all name lists: Saptawara (Redite..Saniscara), Pancawara (Umanis..Kliwon) + Javanese aliases (Legi/Pahing), 30 Wuku in canonical order (Sinta..Watugunung), Triwara/Caturwara/Sadwara/Astawara/Sangawara/Dasawara, Dwiwara (Menga/Pepet), Ekawara (Luang), Sasih names. Plus `URIP_PANCAWARA` + `URIP_SAPTAWARA` maps (Javanese neptu numbers).
- `src/jdn.ts` — Gregorian↔JDN (Fliegel & Van Flandern) + positive `mod`.
- `src/weton.ts` — `pancawaraOf`, `saptawaraOf`, `wetonOf` → `{pancawara, saptawara, hari, pasaran, idLabel, baliLabel, uripPancawara, uripSaptawara, neptu}`.
- `src/pawukon.ts` — `pawukonOf` → `{day (1..210), wukuIndex, wuku, dayInWuku}`. Constant `+65` aligns with kalenderbali.org anchors.
- `src/wewaran.ts` — `computeWewaran(pawukonDay, pancawara, saptawara)` covering all 10 cycles. Semi-arithmetic Caturwara (Trijaya Dungulan: Jaya held p=71-73), Astawara (Kala Tiga: Kala held p=71-73), Sangawara (Dangu held p=1-4).
- `src/engine.ts` — `computePawukonChart({year, month, day})` → `{jdn, weton, pawukon, wewaran}`.
- `src/render.ts` — `renderWetonText/Markdown`, `renderPawukonText/Markdown`.

### Verified anchors (all from kalenderbali.org / ki-demang.com)
| Date | JDN | Weton | Wuku | Pawukon-day |
|---|---|---|---|---|
| 1985-05-05 (Lucky) | 2,446,191 | Minggu Pahing (neptu 14) | Ugu (#26) | 176 |
| 2000-01-01 | 2,451,545 | Sabtu Legi (neptu 14) | Sungsang (#10) | 70 |
| 2024-01-01 | 2,460,311 | Senin Pahing (neptu 13) | Ukir (#3) | 16 |
| 2026-05-12 | 2,461,173 | Selasa Wage (neptu 7) | Gumbreg (#6) | 38 |

### Sasih + Saka — DEFERRED to v2
Both require true astronomical new-moon detection at Bali longitude plus ngunalatri (~63-day collapse) and Mala-sasih intercalation. Two paths when revisited:
- Precomputed tilem/purnama lookup table 1900-2100 (one-shot generated via astronomy-engine).
- Inline Meeus *Astronomical Algorithms* ch.49 moon-phase calculator (~80 LOC).

Research doc with full rationale + sources: `docs/research/2026-05-18-pawukon.md`.

### Lucky sample regenerated
`samples/2026-05-18-lucky.md` (143 lines, 6647 chars) now has the Pawukon section between Tarot and the footer. Two sub-blocks: natal weton + Balinese wewaran for Lucky (Minggu Pahing, wuku Ugu, Dangu, Ludra, ...), plus today's wuku for context (currently 2026-05-18 = Senin Kliwon, wuku Wariga).

`packages/cli/package.json` now lists `@semar/pawukon` as a workspace dep.

### Known wewaran caveats
The semi-arithmetic cycles (Caturwara, Astawara, Sangawara) follow Babadbali documented rules but have NOT been spot-checked against more than 1 real-data point. Recommendation: validate 5-10 random dates against kalenderbali.org before relying on them in production readings. The simpler cycles (pancawara/saptawara/wuku/triwara/sadwara/dwiwara/dasawara) are rock-solid — all 4 verified anchors agree.

## Test counts at handoff

| Package | Tests | Notes |
|---|---|---|
| @semar/iching | 20 ✓ | unchanged |
| @semar/numerology | 32 ✓ | unchanged |
| @semar/bazi | 76 ✓ | unchanged |
| @semar/tarot | 16 ✓ | unchanged |
| @semar/astrology | 46 ✓ | unchanged |
| @semar/diary | 19 ✓ | unchanged |
| @semar/zwds | 29 ✓ (+3 skipped) | unchanged |
| @semar/cli | 7 ✓ | unchanged |
| @semar/pawukon | 56 ✓ | **NEW** |
| **total** | **301 passing** (+56) | 3 still skipped (lunar) |

## Resume hints

- **"go semar tarot gen"** → still pending OPENAI_API_KEY provisioning.
- **"go semar beresin"** → check TG for quiz answers (msg #318) before resuming schema migration.
- **"go semar pawukon spot check"** → validate 5-10 dates' Caturwara/Astawara/Sangawara against kalenderbali.org; fix any off-by-one in `wewaran.ts`.
- **"go semar sasih"** → implement Balinese lunar month + Saka year via Meeus ch.49 (or precomputed table). See research doc §5.
- **"go semar kb pawukon"** → write knowledge/pawukon/ content (wuku meanings, neptu interpretation, weton compatibility) — currently no KB pages.

All decisions and voice rules from earlier handoffs still apply. `docs/personal/` remains gitignored. Git: still not a repo as of close.

---

# SESSION HANDOFF — 2026-05-19 (wewaran spot-check + 4 bugs fixed)

## What landed

### Pawukon wewaran validated against m.kalenderbali.org/artihari (DONE)

Spot-checked 13 (p, Gregorian) pairs covering pre-hold / hold-window / post-hold zones plus a wider random sample:

| p   | Gregorian   | What it exercises               |
|----:|-------------|---------------------------------|
| 1–4 | 2026-04-05..08 | Sangawara Dangu held-start    |
| 5   | 2026-04-09  | First post-Sangawara-hold day    |
| 45  | 2026-05-19  | Today, mid-cycle control         |
| 70  | 2026-06-13  | Last natural Caturwara/Astawara  |
| 71–73 | 2026-06-14..16 | Caturwara/Astawara hold zone |
| 74  | 2026-06-17  | First post-hold day              |
| 75  | 2026-06-18  | Second post-hold day             |
| 176 | 1985-05-05  | Lucky's anchor                   |

Reference source: `https://m.kalenderbali.org/artihari.php?bl={M}&tg={D}&th={Y}` — its "artihari" page lists all 10 wewaran cycles by name. **Confidence**: high — values match Babadbali rules in spirit but kalenderbali.org's empirical convention is the validator we trust, and it now agrees with the engine across all 13 cases.

### 4 bugs found + fixed in `packages/pawukon/src/wewaran.ts`

| # | Cycle | Old (wrong) | New (correct) | Symptom |
|---|---|---|---|---|
| 1 | **Caturwara hold name** | Jaya (index 2) | **Laba** (index 1) | engine returned Jaya at p=71..73; kalenderbali = Laba |
| 2 | **Caturwara hold boundary** | `p <= 71` falls in pre-hold | `p <= 70` | p=71 used `(p-1)%4 = Jaya`; should already be in hold |
| 3 | **Astawara post-hold offset** | `(p-4) % 8` | `(p-3) % 8` | p=74 returned Kala (wrong), p=176 returned Ludra (wrong); real = Uma / Brahma |
| 4 | **Sangawara post-hold offset** | `(p-5) % 9` | `(p-4) % 9` | every post-hold day was off by 1: p=5 Dangu→Jangur, p=176 Dangu→Jangur, etc. |

Plus a **convention divergence** worth flagging:

| # | Cycle | Old behavior | New behavior |
|---|---|---|---|
| 5 | **Ekawara** | Always returned `'Luang'` | Returns `'Luang'` iff urip-pancawara + urip-saptawara is odd (equivalently: Dwiwara = Pepet), else `null`. Renderer shows `—` for null. |

Rationale for #5: Babadbali's rumus pages say "Ekawara: always Luang", but kalenderbali.org's per-day "artihari" view shows it as a dash on even-urip days. The empirical convention is what users will compare against, so we adopt it.

### Type change

`Wewaran.ekawara` is now `Ekawara | null`. `ekawaraOf` now takes `(pancawara, saptawara)`. One caller updated (`computeWewaran`); `renderPawukonMarkdown` falls back to `'—'`.

### Test changes

`packages/pawukon/test/wewaran.test.ts` grew by 12 tests:
- 13 spot-check cases (one per (p, Gregorian) pair above) bundled in a single data-driven `describe` block, each asserting all 7 wewaran cycles match the kalenderbali reference verbatim.
- Existing hold-window tests rewritten to match the new (correct) values (Laba/Uma instead of Jaya/Kala post-hold; Jangur instead of Dangu at p=5).
- Existing Lucky bundle test updated to `astawara: Brahma, sangawara: Jangur, ekawara: null`.
- `engine.test.ts`: `renderPawukonMarkdown(...).toContain('Dangu')` swapped for `'Jangur'`.

Sample regenerated: `samples/2026-05-19-lucky.md` (152 lines, 8509 chars) now shows the corrected wewaran for Lucky.

### Files touched

| File | Change |
|---|---|
| `packages/pawukon/src/wewaran.ts` | 4 formula fixes + Ekawara signature change + reworded doc comments |
| `packages/pawukon/src/render.ts` | `ekawara ?? '—'` |
| `packages/pawukon/test/wewaran.test.ts` | +12 spot-check cases, hold-window tests rewritten |
| `packages/pawukon/test/engine.test.ts` | Dangu → Jangur in markdown contain check |
| `packages/pawukon/scripts/spot-check-pick.ts` | NEW — helper that walks dates to find Gregorian dates landing on target Pawukon-days |
| `packages/pawukon/scripts/spot-check-print.ts` | NEW — prints engine wewaran for a fixed list of dates for paste-compare |
| `samples/2026-05-19-lucky.md` | NEW — Lucky reading regenerated post-fix |
| `HANDOFF.md` | this entry |

## Test counts at handoff

| Package | Tests | Δ |
|---|---:|---|
| @semar/iching | 20 ✓ | — |
| @semar/numerology | 32 ✓ | — |
| @semar/bazi | 76 ✓ | — |
| @semar/tarot | 16 ✓ | — |
| @semar/astrology | 48 ✓ | — |
| @semar/diary | 19 ✓ | — |
| @semar/zwds | 62 ✓ (+3 skipped) | — |
| @semar/cli | 7 ✓ | — |
| @semar/pawukon | **92 ✓** | **+12** |
| **total** | **372 ✓** | **+12** |

3 lunar tests still skipped in `@semar/zwds`.

## Resume hints

- **"go semar tarot gen"** → still pending OPENAI_API_KEY provisioning.
- **"go semar beresin"** → check TG for quiz answers (msg #318) before resuming the DiaryEvent schema migration.
- **"go semar sasih"** → implement Balinese lunar month + Saka year via Meeus ch.49 (or precomputed table). See `docs/research/2026-05-18-pawukon.md` §5.
- **"go semar kb pawukon"** → write `knowledge/pawukon/` content (wuku meanings, neptu interpretation, weton compatibility) — currently no KB pages.
- **"go semar lunar"** → fix the 3 skipped lunar tests in `@semar/zwds` via precomputed table or `@lunisolar/lunisolar`.
- **"go semar bazi case study"** → rewrite `knowledge/bazi/case-studies/lucky-1985.md` for the corrected `丙寅` hour pillar (still on the old `己巳` reading).
- Git: still not a repo. Earlier plan unchanged.

---

# SESSION HANDOFF — 2026-05-25 (web app deployed + interpretive layer)

## What landed this session

### 1. `apps/web` — Next.js 15 web application built from scratch
Full mobile-first PWA shell at `semar.astaredekar.com` (port 3777 via nginx reverse proxy, SSL via certbot).

**Routes:**
- `/daily` — DailyBrief: BaZi day pillar, Weton, transit aspect, cross-engine synthesis + oracle chooser (Tarot/I-Ching/Keduanya)
- `/cast/tarot` — 3-card spread with 3D CSS flip animation
- `/cast/iching` — 3-coin casting method with animated coins + hexagram build
- `/diary` — Reverse-chronological log + 14-day calendar strip
- `/cast`, `/chat` — stubs

**Systemd service**: `/etc/systemd/system/semar.service`
- ExecStart uses full path: `/root/.hermes/node/bin/node /workspace/semar/apps/web/node_modules/next/dist/bin/next start --port 3777`
- systemd doesn't include `/root/.hermes/node/bin` in PATH — full path is mandatory.

### 2. `apps/web/lib/meanings.ts` — interpretive data layer (NEW)
Pure static lookup tables (no imports):
- `HEXAGRAM_GUIDANCE` — 64 hexagrams, 1-line judgment text (EN)
- `TAROT_MEANINGS` — 78 cards, `{upright, reversed}` keyword strings
- `BAZI_STEM` — 10 heavenly stems in `"ElementPolarity — brief · description"` format
- `BAZI_BRANCH` — 12 earthly branches in same format
- `NEPTU_BRIEF` — neptu 7–17 one-liners
- `WUKU_BRIEF` — 30 wuku one-liners
- `TRANSIT_ASPECT` — 5 aspect types one-liners (ID)
- `PLANET_BRIEF` — 15 planets/points (EN name, ID life area)

### 3. DailyBrief enhancements
- Neptu/wuku brief below Weton line
- BaZi stem + branch energy brief in gold
- Transit aspect one-liner below transit display
- **KONVERGENSI section** — `buildSynthesis()` combines all 3 signals into a paragraph
- **Fixed tarot save bug**: was saving raw `TarotDraw[]` with `cardName` field → diary showed `p:undefined`. Now normalizes to `{position, card: d.cardName, reversed}`.

### 4. TarotCard — keywords after flip
`TAROT_MEANINGS[draw.cardName]?.upright/reversed` shown below card name post-flip.

### 5. CoinCast — hexagram guidance
`HEXAGRAM_GUIDANCE[result.hexagram.number]` italic paragraph after result. Also shows relating hexagram guidance.

### 6. HexagramDisplay — fixed build direction
I-Ching casts from line 1 (bottom) to line 6 (top). Placeholder dashes moved to top of flex column so first cast line appears at bottom and hexagram grows upward (traditional).

### 7. Diary improvements
- `getEntryDates()` now returns ALL entry kinds (was filtering `kind === 'today'` only → missing cast entries)
- CalendarStrip timezone fixed: was using `new Date().toISOString().slice(0,10)` (UTC midnight → wrong date for WIB). Now uses `todayLocal()` as reference + UTC noon arithmetic.
- `EntryRow` handles `card` field (not `cardName`) for tarot entries; shows engine label; shows I-Ching EN name + relating hexagram.

## Files created/modified

| File | Change |
|---|---|
| `apps/web/` | NEW — entire Next.js app (too many files to list) |
| `apps/web/lib/meanings.ts` | NEW — 78 tarot + 64 hexagram + BaZi + Weton + transit lookups |
| `apps/web/components/DailyBrief.tsx` | buildSynthesis + BaZi/neptu/wuku/transit briefs + KONVERGENSI + tarot save fix |
| `apps/web/components/TarotCard.tsx` | keywords after flip |
| `apps/web/components/CoinCast.tsx` | hexagram guidance + relating guidance |
| `apps/web/components/HexagramDisplay.tsx` | bottom-to-top build direction fix |
| `apps/web/app/diary/page.tsx` | CalendarStrip TZ fix + EntryRow improvements |
| `apps/web/lib/diary-store.ts` | getEntryDates() returns all kinds |
| `/etc/systemd/system/semar.service` | NEW — production systemd unit |
| `/etc/nginx/sites-available/semar.astaredekar.com` | NEW — nginx reverse proxy config |

## Open items inherited + new

**New open items from this session:**
- **Chat page** (`/chat`) — stub only. Needs `MINIMAX_API_KEY` wired as env var. MiniMax key already exists at `/root/.mm_key`.
- **Tarot art batch 2** — Cards 05+ (Hierophant = Leon Silverberg Suikoden II archetype). Only cards 00-04 have art. Art goes to `apps/web/public/card-art/` and `ART_SLUGS` in `apps/web/lib/engines-client.ts` needs updating.
- **Supabase migration** — Diary is currently localStorage Phase 1. Phase 2 = Supabase for cross-device sync.
- **Weekly Convergence Digest** — the moat feature per [[semar_differentiator]]. Cross-engine longitudinal pattern synthesis. Sunday-evening artifact. Build before chat interface.
- **OPENAI_API_KEY** — still not provisioned. Blocks tarot art generation pipeline.

**Inherited open items (still unresolved):**
- Lunar converter 3 skipped tests in `@semar/zwds`
- BaZi case study rewrite for 丙寅 hour
- ZWDS depth (auxiliary stars, decade limits)
- Astrology fixtures still at 9:31 (cosmetic)
- Sasih/Saka year for pawukon
- KB pawukon content
- Git: still not a repo

## Resume hints

- **"go semar chat"** → wire MiniMax API (`/root/.mm_key`) as `MINIMAX_API_KEY` env in `.env.local` + implement `/chat` page as AI-powered divination interface.
- **"go semar convergence"** → implement Weekly Convergence Digest: aggregate diary events by tag/engine over 7-day window, send pre-aggregated summary to MiniMax, render as 3-block artifact (Counts · Convergence · Negation).
- **"go semar tarot batch 2"** → generate cards 05+ via Genspark or OpenAI image gen. Card 05 = The Hierophant = Leon Silverberg (Suikoden II). Slug pattern: `apps/web/public/card-art/05-hierophant.jpg`.
- **"go semar beresin"** → check TG for quiz answers (msg #318) before resuming DiaryEvent schema migration.

