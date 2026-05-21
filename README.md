# 天人合一 Codex

> *Codex tidak memberi jawaban. Codex memberi mata.*

A divination diary for the multi-system practitioner. Six wisdom traditions — BaZi, Zi Wei Dou Shu, I Ching, Tarot, Pythagorean Numerology, Western Astrology — held in one notebook. Chat is the interface. Pattern recognition over years is the point.

Built for one practitioner first (the author), a small circle of fellow practitioners second.

---

## Status

v0.2 — greenfield rebuild. Engine-first. v0.1 archived to `v0.1-archive` branch.

## Stack

- TypeScript, pnpm monorepo, Next.js App Router
- Supabase (auth, RLS, cloud sync)
- Astronomy Engine for planetary positions (MIT)
- HKO ephemeris for lunar / solar terms (1901–2100)
- MiniMax M2.7 at runtime (Anthropic-compatible endpoint)

## Layout

- `packages/` — divination engines, each a standalone npm package
- `apps/` — Next.js chat surface (later)
- `docs/` — design doc, brand guidelines, voice canon
- `knowledge/` — reference texts (BaZi corpus, hexagrams, etc.)
- `tokens/` — design tokens (single source of truth)
- `fixtures/` — test charts

See `HANDOFF.md` for the full decision log and `CLAUDE.md` for working context.

## License

UNLICENSED — private.
