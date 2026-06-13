---
name: refactoring
description: Use when restructuring existing code without changing its behavior — extracting components, renaming, splitting files, de-duplicating, moving logic between layers. Before touching the code. (For behavior changes, use test-driven-development instead.)
---

# Refactoring

## Overview

Refactoring changes the *shape* of code while keeping its *behavior* identical. The danger is silent behavior drift: a "cleanup" that quietly changes output. The defense is a safety net you trust.

**Core principle:** A refactor is only safe if a passing test would catch you breaking it.

**Violating the letter of this rule is violating the spirit of this rule.**

This is the skill `superpowers` leaves implicit (it lives inside TDD's red-green-**refactor**). Here it is explicit, tuned for this monorepo.

## The Iron Law

```
NO REFACTOR WITHOUT A GREEN SAFETY NET FIRST
```

If the code you're about to restructure has no passing test that exercises its behavior, you write that test (a *characterization test*) and watch it pass — BEFORE you change anything. No net, no refactor.

## Refactor vs. Change — know which you're doing

| You are... | It is a... | Use |
|---|---|---|
| Renaming, extracting, splitting, de-duping, moving code between layers — output identical | **Refactor** | this skill |
| Changing what the code produces, fixing a bug, adding a case | **Behavior change** | `test-driven-development` |
| Mixing both in one commit | **A mistake** | Stop. Split them. |

If you can't tell whether behavior changed, you don't have enough tests. Add them first.

## The Loop

```
1. PIN     — characterization test(s) exercise current behavior → run → GREEN
2. CHANGE  — ONE small structural edit (one extraction, one rename)
3. PROVE   — run the same tests → still GREEN (zero diff in behavior)
4. BUILD   — run the REAL build, not just typecheck (see below)
5. COMMIT  — one refactor, one commit, message says "refactor: ..."
6. REPEAT  — next small step
```

Never batch ten structural changes then test once. Small reversible steps mean a red test points at exactly one edit.

## Pin Behavior First (characterization tests)

Before restructuring code that isn't covered:

- Write a test that asserts what the code does **right now** — even if you think the current behavior is ugly. You are pinning it, not judging it.
- Run it. It must pass. A characterization test that fails means you misread the behavior — fix your understanding, not the code.
- Pure logic (`packages/*`, `apps/web/lib/*`) is cheap to pin — assert inputs→outputs. Pin there first; it's where refactors are safest and most common.
- UI/DOM behavior is expensive to pin. Prefer extracting pure logic OUT of components and pinning that, over trying to test the rendered DOM.

## Verify With The Real Build — not just `tsc`

`tsc --noEmit` passing is **not** proof a refactor is safe. In this repo:

- A workspace package can typecheck green but break the client bundle (e.g. `node:fs` pulled across the `'use client'` boundary). Only `next build` catches it.
- A `.gitignore` or path change can pass typecheck but drop a runtime-required file. Only a fresh build / `git check-ignore` catches it.

So step 4 is: `pnpm --filter <pkg> test` AND `cd apps/web && pnpm build` for web work. For a deployed surface, also `systemctl restart semar` + curl the routes. Evidence before "done" — see `verification-before-completion`.

## Respect The Layer Boundaries

This monorepo has a deliberate shape. A refactor must not blur it:

```
packages/*        pure engines — no React, no I/O, no Next. Tested in isolation.
apps/web/lib/*    pure helpers + data + server-only modules. node:fs ONLY in server-only files.
apps/web/app/api  server routes — the ONLY place engines that read files may run.
apps/web/components UI. Imports lib + engines. 'use client' for interactivity.
apps/web/app/*    routes/pages. Thin — delegate to components.
```

Moving logic *down* (component → lib → package) is almost always a good refactor. Moving I/O *up* into a client component is almost always a bug. When extracting, push pure logic toward `lib/` or a package where it can be pinned with a fast test.

## Red Flags — STOP

- About to restructure code that has **no passing test** exercising it
- "I'll just clean this up real quick" (no net, no plan)
- Mixing a rename/extract with a behavior tweak in one commit
- Claiming the refactor is safe after only `tsc`, without `next build`
- "The tests still pass" — but you never ran them this message
- Ten files changed, one giant commit titled "refactor"
- Deleting a test because it's "in the way" of the refactor
- Refactoring on `main` instead of a branch

## Rationalization Prevention

| Excuse | Reality |
|---|---|
| "It's a trivial rename" | Renames break imports/strings/keys. Net first. |
| "tsc is green, ship it" | tsc ≠ build. Run `next build`. |
| "I'll test at the end" | Then a red test can't tell you which of 10 edits broke it. |
| "There's no test to write" | Then write the characterization test. That IS the work. |
| "Behavior's basically the same" | "Basically" = you changed behavior. Split the commit. |
| "Tests are slow, I'll trust myself" | Trust ≠ evidence. Run them. |

## When Stuck

| Problem | Solution |
|---|---|
| Can't write a test — too coupled | That coupling IS the thing to refactor. Extract a pure function first, pin that. |
| Test needs the whole app to run | You're testing the wrong layer. Pull logic into `lib/`. |
| Refactor got huge mid-way | Stop. Revert to last green commit. Re-plan into smaller steps (`writing-plans`). |
| Don't know what behavior to pin | Read the code, run it once, assert what you observed. Ask your human partner if unsure. |

## The Bottom Line

```
Green safety net → one small structural change → still green → real build → commit
Otherwise → not refactoring, just hoping
```

No exceptions without your human partner's permission.
