# Semar / 天人合一 Codex — Claude context

> Read this first whenever you open this repo. Brief and load-bearing.

## What this is

**Semar** (codename) / **天人合一 Codex** (public name) — a divination diary for the multi-system practitioner. Chat-only interface. Engine-first build. Owner-operator tool, scratch-your-own-itch first; small beta (10–20 practitioners) second.

- Owner: Lucky Surya Haryadi (蒋承禄), Bandung
- Repo: github.com/doyoucalm/semar
- Tagline: *"Codex tidak memberi jawaban. Codex memberi mata."*
- Independence: not related to Mierakigai/Migai.

The full scope, decisions log, and resume checklist live in `HANDOFF.md` — read it before making architectural moves.

## Locked decisions (don't relitigate without asking)

| Pilar | Decision |
|---|---|
| Engines (6) | BaZi, ZWDS, I Ching, Tarot, Numerology (Pythagorean), Western Astrology |
| Ephemeris (lunar/solar terms) | HKO data 1901–2100 |
| Ephemeris (planets) | Astronomy Engine (MIT) — **never** Swiss Ephemeris (AGPL trap) |
| Runtime LLM | MiniMax M2.7 via `@anthropic-ai/sdk` baseURL `https://api.minimax.io/anthropic` |
| Build LLM | Claude (this assistant) |
| Stack | Next.js App Router + Supabase + pnpm monorepo |
| UX | Chat-only. Modules 1/2/3 (Snapshot, Composer, Constellation) are rich-card message types **inside** chat — NOT separate pages |
| Auth | Supabase Auth + RLS + cloud sync (required for pattern recognition) |
| Build order | Engine-first → chat skeleton → tool wiring → pattern recognition |

The v0.1 repo failed by building UI before engines were solid. Don't repeat that.

## Voice canon (hard rules)

The character/voice contract is in `docs/voice-canon.md`. Read it. Short version:

- Semar speaks **plain flowing prose**. No bullet lists, no numbered lists, no headers in responses to user.
- Warm, not saccharine. Metaphors from nature (trees, rivers, seasons, fire, stone).
- **Never prescribes.** Never says "you should." Reveals what is, not what to do.
- **The sage prunes.** Brevity is the voice. A short verdict beats a long explanation.
- No drama, no markdown theatre, no "mystical galaxy" purple cliché.

These rules are NOT auto-followed by M2.7 at runtime — heavy prompt engineering needed in Phase 3.

## Pigment rules (hard rules)

Full tokens in `tokens/semar-tokens.css`. Critical constraints:

- App background is **always** Ink Indigo (`--ink-900`). There is no light mode.
- **No purples.** The mystical-galaxy-purple is the cliché this brand exists to refuse.
- **No pure white.** Always Parchment 50 (`#fbf6ea`) or warmer.
- **Never two accents on the same screen.** Ember (wisdom) *or* Vermillion (ritual) — never both shouting.
- Vermillion is for ritual moments only — should feel rare.

## Layout

```
/workspace/semar/
├── HANDOFF.md             # full decision log + resume checklist
├── CLAUDE.md              # this file
├── README.md              # human-facing intro
├── package.json           # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── docs/
│   ├── semar-brand-guidelines-light.html   # printable brand book
│   ├── voice-canon.md                      # voice contract (Phase 3 prompt source)
│   ├── divination_diary_design_doc.md      # Codex spec
│   └── personal/                           # GITIGNORED — Lucky's blueprint, never commit
├── fixtures/
│   └── lucky-bazi.json    # Lucky's chart 乙丑 庚辰 甲辰 己巳 (test fixture)
├── knowledge/             # 42 files, CN+EN BaZi reference (salvaged from v0.1)
├── tokens/
│   └── semar-tokens.css   # design tokens — single source of truth
└── packages/              # engines + app live here
```

## How to work in this repo

- **Engine-first.** New engine = `packages/<name>` with: pure TS, vitest tests, zero UI deps, zero LLM deps. Engines must be callable as plain functions before any chat tool wraps them.
- **No mocks at engine boundary.** Test against real ephemeris data / real hexagram tables. The bug we're afraid of is "passes in test, wrong in chart" — mocks hide that exact class.
- **Personal data never commits.** `docs/personal/` is gitignored. Lucky's full blueprint stays local.
- **MiniMax key is at `/root/.mm_key`** (chmod 600). Don't echo it. Don't commit it.
- pnpm path on this machine: `/root/.hermes/node/bin/pnpm` (not on PATH by default).

## When the user says "go semar beresin"

Resume from `HANDOFF.md` § "Resume checklist". Verify state on disk before re-doing completed steps.
