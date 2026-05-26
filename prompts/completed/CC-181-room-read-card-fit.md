# CC-181 — Room Read: Card Fit

> Room Read calibration. Two owner observations from live play: (1) "this question
> could have been for any[one]" / "could easily be 2 or more" — cards where the
> engine pick is a near-tie should lean on split reads; (2) "another question for the
> Si's — none here" — a card whose best target is a weak/false-positive match (no
> player actually fits) still gets chosen and named confidently. This CC improves
> card SELECTION + split behavior in the GAME; it does NOT re-open core engine typing.

## Requirement (owner)

When a card genuinely fits 2+ players, surface it as a split read rather than a
confident single pick. When NO player strongly fits a card (e.g. an Si-flavored card
in a room with no Si player), prefer a card that fits SOMEONE — don't strand the
round on a weak, false-positive-driven pick.

## Background (verified)

- `lib/games/roomRead/generate.ts` ranks candidate cards by
  `confidenceBoost + enginePick.score + RUNNER_UP_TENSION_BONUS × tension(gap)`. The
  `tensionWeight` tent already routes near-ties toward "debatable," and the engine
  marks `isSplit` on near-ties (`SPLIT_EPS` in `engine.ts`) — verify these actually
  fire on the live cohort; the owner saw confident single picks where a split was
  warranted.
- The known **Si false-positive** (see memory: `scoreSi` over-credits devout/high-C
  Ni-Te shapes via faith/loyalty/C proxies — Jason canonical) means an architect-
  shaped player can win an Si/precedent card with a mediocre absolute score. That's
  why JasonDMcG drew the R1 precedent (lens) card. Core `scoreSi` calibration is a
  SEPARATE track — here we only stop the GAME from leaning on weak picks.

## Fix — Part A: weak-fit demotion in card selection

In the candidate ranking, when a card's `enginePick.score` (or confidence) for the
sub-pool is below a floor (no player strongly matches), DEMOTE that card so a card
that fits someone in the sub-pool wins instead. Keep the existing quota sub-pool
logic intact — this is an added quality filter WITHIN the eligible set, not a quota
change. Surface a diagnostic (similar to `fallbackEvents`) when a round had to fall
back to a weak-fit card because nothing better existed for that theme/sub-pool.

## Fix — Part B: split-read surfacing

Confirm `isSplit` propagates from `getEnginePick` through `generateRoomReadGame` to
the stored round and into the reveal, and that near-tie gaps actually produce splits
on real player data (add/extend a test on a near-tie fixture). If the threshold is
too tight to fire in practice, widen `SPLIT_EPS` toward the debatable band — with a
test that pins the new behavior.

## Do NOT

- Do NOT modify core `scoreSi` / `identityEngine` typing — that's a separate
  calibration track. Scope changes to `lib/games/roomRead/*` (selection + split).
- Do NOT change the even-distribution quota or the per-player cap.
- Do NOT change the leak guard or payload shapes.
- Do NOT touch the couple module.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- Rounds prefer cards that fit a player in the sub-pool; weak-fit picks only occur
  when no better card exists for that theme/sub-pool, and are logged.
- Near-tie cards surface as split reads (test pins the behavior on a near-tie
  fixture); existing even-distribution tests still pass (8r/4p still 2-each).
- `npx tsc --noEmit` + lint clean; `npm run build` compiles; roomRead suite green.

## Report back

- The weak-fit floor chosen + how it interacts with the sub-pool quota.
- Whether `isSplit` already fired on the cohort or needed `SPLIT_EPS` widening.
- Files touched (generate.ts / engine.ts / tests only); tsc/lint/build status.
