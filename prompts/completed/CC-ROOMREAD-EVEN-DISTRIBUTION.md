# CC-ROOMREAD-EVEN-DISTRIBUTION

> Room Read fix. The engine over-targets a dominant player (a 4-player/4-round
> family game made one person the answer nearly every round). CC-175.1's coverage
> is a SOFT additive penalty (`COVERAGE_PENALTY_PER_REPEAT = 0.5`) — a nudge a
> dominant profile out-scores. Replace it with a real EVEN-DISTRIBUTION quota:
> engine-pick targets divide as evenly as possible across players.

## Requirement (owner, verbatim intent)

Engine-pick targets must divide as evenly as possible across the selected players.
With P players and R rounds: each player is the engine pick `floor(R/P)` or
`ceil(R/P)` times — never "one player twice while another is zero." The remainder
(`R mod P` extra slots) may go to the best-matching / random players. Examples:
4 players / 4 rounds → exactly 1 each; 8 rounds / 4 players → 2 each; 5 rounds /
4 players → one player 2, the rest 1.

## Where (verified)

`lib/games/roomRead/generate.ts`, `generateRoomReadGame`. Today, per round it
filters candidate cards by theme, scores each as `confidenceBoost + enginePick.score
+ tensionBonus − repeats × COVERAGE_PENALTY_PER_REPEAT`, and picks the top. The
soft `−0.5×repeats` term is the thing being replaced.

## The fix — quota-gated target selection

Cap per player = `ceil(R / P)`. Track `featureCountByPlayer` (already exists).
Per round, among the theme's candidate cards (each carries its `getEnginePick`
target):
1. Compute the current **minimum feature-count tier** (the under-served players).
2. Prefer candidate cards whose engine-pick player is in that lowest tier; among
   those, pick the highest-ranked by the EXISTING quality rank (confidenceBoost +
   engine score + runner-up tension). This keeps the "best debatable card" logic —
   it just constrains *who* it can target.
3. A player who has reached the cap `ceil(R/P)` is INELIGIBLE as a target until the
   game ends. Relax to the next-lowest tier only if no card in the theme can target
   a lower tier (card-library limitation — see fallback).
The `R mod P` "+1" slots fall out naturally to whoever has the strongest matches in
the later rounds (random tiebreak among equals is acceptable per owner).

**Fallback (must not throw):** if a theme's available cards can ONLY target
already-capped players (the library lacks variety to hit an under-served player for
that theme), allow the least-repeated eligible target and record it — do NOT crash.
With ~5 cards/theme there's usually enough variety; the fallback is the safety net,
and a too-frequent fallback is a signal to broaden the card library (report it).

## Do NOT

- Do NOT change the engine scorer, the card library, the signal builder, scoring,
  or verdict. This is generation-selection only (`generate.ts` + its tests).
- Do NOT make it a rigid fixed permutation that ignores card quality — within the
  eligible (under-served) targets, the best/most-debatable card still wins.
- Do NOT touch persistence, API, or UI (that's the separate round-status CC).
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance (tests under tests/games/roomRead/)

- 4 players / 4 rounds: each player is the engine pick **exactly once** (across the
  cohort-real demo set, and across a synthetic set where one player dominates every
  theme — the dominant player still gets exactly 1, proving it's a hard quota, not a
  nudge).
- 8 rounds / 4 players: each player exactly 2.
- 5 rounds / 4 players: counts are {2,1,1,1} — no {3,1,1,0} or {2,2,1,0}.
- 4 rounds / 6 players: 4 distinct players each once, 2 players zero (best possible
  when P > R) — and NO player gets 2.
- The existing tension/debatability behavior still holds WITHIN the eligible set.
- `npx tsc --noEmit` + lint clean; existing roomRead tests still green.

## Report back

- The per-round target tally for 4p/4r over both a balanced and a one-dominant-
  player set (prove the dominant player no longer sweeps).
- Any theme where the fallback fired (card-library variety gap) — flag for a
  library follow-up.
- Confirm only `generate.ts` + tests changed.
