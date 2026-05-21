# Overnight autonomous run — 2026-05-18 → 2026-05-19

User went to sleep at 00:05 WIB-ish. This document records the plan I will execute autonomously and the safe-stop conditions.

## Current state (snapshot at handoff)

- **Tests**: 80 passing in `@semar/pawukon` (added 17 sasih tests this session). Workspace total ~325 passing (need to re-run pnpm -r to confirm).
- **What landed today**:
  - `src/tilem.ts` — astronomical Tilem/Purnama via astronomy-engine, Bali civil-date mapping, lunation counting.
  - `src/sasih.ts` — `computeSasih(y,m,d)` returns `{saka, sasih, displayName, isNampih, penanggal, isPangelong, isTilem, isPurnama, ...}`. Uses anchor Saka 1947 Nyepi 2025-03-29, plain `saka mod 19` nampih rule.
  - `docs/research/2026-05-19-mala-sasih.md` — full research doc on intercalation rule (Saka mod 19, ngunaratri 63-day, SK 1993-2002 transition caveat).
  - **NOT YET**: sasih not yet integrated into `computePawukonChart`, not yet in render functions, not yet in sample-lucky.ts.
- **Open thread caveats from yesterday**:
  - Wewaran spot-check for Caturwara/Astawara/Sangawara not done.
  - SK 1993-2002 transition not modeled (out of scope for MVP).
  - Saka 1917 anomaly (Nyepi 1995-04-01) not handled.
  - Penanggal/pangelong has no ngunaratri correction → may be ±1 day off vs kalenderbali.org.

## Autonomous plan (in order)

1. **Integrate sasih into engine + render** (~15 min)
   - Add `sasih` field to `PawukonChart`.
   - Extend `renderPawukonMarkdown` with a Balinese-lunar block.
   - Update tests.

2. **Regenerate Lucky sample** (~5 min)
   - Wire `computeSasih` into sample-lucky.ts.
   - Output should show sasih + penanggal for natal (1985-05-05) and today.
   - Eyeball reasonableness: Lucky's Saka should be ~1907.

3. **External validation** (~15 min)
   - WebFetch kalenderbali.org for a few sample dates and verify our sasih output matches.
   - Target dates: 2025-03-29 (Nyepi anchor), 2024-03-11 (Nyepi 2024), today 2026-05-18, and one date in May 1985.
   - Document any discrepancies in a `sasih_validation.md` note.

4. **Wewaran spot-check** (~10 min)
   - Pull 5 sample dates from kalenderbali.org with their full wewaran printout.
   - Compare against `computeWewaran` output for Caturwara/Astawara/Sangawara.
   - If off-by-one, fix the formula in `wewaran.ts`. Else, clear the caveat in handoff.

5. **Update HANDOFF.md** (~10 min)
   - New session block: "2026-05-19 (overnight) — sasih + Saka landed".
   - Test counts, what landed, what deferred, what to resume next.

6. **Stop** — at this point both the engine extension and basic validation are done. Write the closing message and end the loop.

## Safety constraints (will NOT do without user)

- ❌ `git init` / `git push` / any git ops (repo not initialized; do not initialize without permission).
- ❌ Touch `docs/personal/` (gitignored, contains user's full blueprint).
- ❌ Modify `~/.hermes/` or anything outside `/workspace/semar/`.
- ❌ Spawn many parallel agents that consume tokens — single in-process work only.
- ❌ Delete or rename files outside `packages/pawukon/` without strong reason.
- ❌ Make >5 WebFetch calls (rate limits + cost). Will limit to ~5 total.
- ❌ Touch the GrowthBook / Wijaya / Pasar Sebar / Migai Kola / Migai Chat / Astaredekor codebases.

## Stop conditions (will end the loop)

- Plan steps 1–5 done → write closing summary, stop.
- A test failure I can't fix in 2 iterations.
- A WebFetch / external call fails repeatedly (3 tries).
- An unforeseen branch that needs user decision (e.g., "should sasih before-2000 use old pivot or just return null?").
- Token budget exhausted (loop self-terminates if needed).

## Resume signal for user

Tomorrow when user wakes: say "go semar beresin" or "lanjutin semar go" → I'll read this OVERNIGHT_PLAN file + HANDOFF.md and resume from whatever state I stopped at.
