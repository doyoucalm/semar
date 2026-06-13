# Semar Web — Build & Refactor Structure

> How we build and (especially) refactor `apps/web`. Adapted from the
> [obra/superpowers](https://github.com/obra/superpowers) methodology — a complete
> agent development process — and tuned to this pnpm monorepo. Companion to
> [`.claude/skills/refactoring/SKILL.md`](../.claude/skills/refactoring/SKILL.md).

The superpowers thesis: **don't jump to code.** Tease out a spec, get it approved,
write a bite-sized plan, execute it test-first in small reversible steps, verify with
real evidence, then finish cleanly. This doc applies that to the web app.

---

## 1. The architecture (what may depend on what)

```
packages/*            pure engines (bazi, zwds, iching, tarot, astrology, pawukon,
                      numerology) — no React, no Next, no I/O. 368 tests. The truth.
        │  (imported by)
        ▼
apps/web/lib/*        pure helpers + data + server-only modules
        │             · pure/data: bazi-display, meanings, profile, diary-types
        │             · server-only (node:fs): db, engines-server  ← never client-imported
        ▼
apps/web/app/api/*    server routes — the ONLY place file-reading engines run
        │             (bazi, chat, convergence, diary)
        ▼
apps/web/components/* UI. Imports lib + engines. 'use client' for interactivity.
        ▼
apps/web/app/*        routes/pages. Thin — delegate to components.
```

**The one rule that bites:** a `node:fs` / server-only module must never be pulled into a
`'use client'` graph. `tsc` won't catch it; `next build` will. That's why every engine that
reads HKO data is reached via an `/api/*` route, not imported into a component.

**Refactor direction:** push logic *down* (component → lib → package) where it's pure and
cheap to test. Never push I/O *up* into a client component.

---

## 2. The build pipeline (the verification gate)

Nothing is "done" until this passes — fresh, this session (`verification-before-completion`):

```bash
# engines / pure logic
pnpm -r --filter='!./packages/logo' exec vitest run      # all package tests
cd apps/web && pnpm test                                 # web lib characterization tests

# the web build — catches what tsc cannot
cd apps/web && pnpm build                                 # MUST be exit 0

# deployed surface
systemctl restart semar && curl -s -o /dev/null -w '%{http_code}' http://localhost:3777/daily
```

`tsc --noEmit` is a smoke check, not the gate. The gate is `next build` (+ tests + a live curl).

---

## 3. The workflow (every non-trivial change)

```
BRAINSTORM ─▶ SPEC ─▶ PLAN ─▶ EXECUTE (test-first, small steps) ─▶ VERIFY ─▶ FINISH
   │            │       │            │                                │
   │            │       │            │                                └ build + tests + curl, evidence in hand
   │            │       │            └ one change per commit; refactor commits ≠ behavior commits
   │            │       └ docs/plans/YYYY-MM-DD-<name>.md — bite-sized, file paths, test per step
   │            └ docs/specs/YYYY-MM-DD-<name>-design.md — approved before any code
   └ ask what we're really building; propose 2-3 approaches; don't assume "simple"
```

For a **refactor specifically**, the EXECUTE phase is the loop in the refactoring skill:
`pin behavior (green) → one structural change → still green → real build → commit → repeat`.

**Trivial changes** (a token tweak, a copy fix) skip spec/plan — but still pass the build gate.

---

## 4. Where things live (conventions, from superpowers)

| Artifact | Path | When |
|---|---|---|
| Design spec | `docs/specs/YYYY-MM-DD-<topic>-design.md` | before code on any multi-step change |
| Implementation plan | `docs/plans/YYYY-MM-DD-<topic>.md` | after spec approved, before code |
| Refactor safety net | `apps/web/lib/*.test.ts` (+ engine tests) | before the refactor |
| Skill | `.claude/skills/<name>/SKILL.md` | reusable, opinionated process |
| Session handoff | `HANDOFF.md` (+ dated sections) | on wrap |

Commit messages name the kind: `refactor:`, `feat:`, `fix:`, `test:`, `docs:`. A `refactor:`
commit changes zero behavior — if a test output changes, it isn't a refactor.

---

## 5. The refactor safety net (today's state)

| Layer | Coverage | Refactor safety |
|---|---|---|
| `packages/*` engines | 368 tests | ✅ safe to refactor |
| `apps/web/lib/*` pure logic | characterization tests (this commit) | 🟡 growing — pin before you touch |
| `apps/web/components`, `app/*` | none (DOM) | 🔴 extract logic to `lib/` and pin it, don't test the DOM |

The fastest way to make a red layer safe is to **move its pure logic down into `lib/` and
characterize it** — then the component is a thin shell that's low-risk to restructure.

---

*Structure learned from obra/superpowers (2026-06-14). The methodology is theirs; the layer
map, the `next build`-not-`tsc` gate, and the lib-extraction strategy are this repo's.*
