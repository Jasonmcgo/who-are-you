# CC-COUPLE-5 — Obvious-or-Oblivious Mode 1 Phase 2: full deck/bank + predictors + adjacency

> Builds on CC-COUPLE-4 (which delivered 3-rank input, partial-credit scoring, the
> warm reveal, and predictors for the Grip/Lens/Love items). This CC deepens the
> CONTENT: expand the question bank to the full deck structure in
> `docs/obvious-oblivious-game-spec.md`, wire engine predictors for the new items,
> and define adjacency so the "strong-adjacent = 1pt" tier works across the bank.
> Still **Mode 1, engine-truth.** (Self-pass + partner-override = a later CC;
> Mode 2 "Who's More Likely" = a separate build.)

## Prereq

CC-COUPLE-4 must be landed (its scoring/reveal/3-rank foundation + the
Grip/Lens/Love predictors). This CC assumes that infrastructure exists and only
adds items + predictors + adjacency.

## Read first

`docs/obvious-oblivious-game-spec.md` (the 6 decks + question-design rule),
`lib/coupleGameItems.ts` (the bank + predictors as left by CC-COUPLE-4),
`lib/coupleReveal.ts` (scoring/adjacency).

## Tasks

**T1 — expand the bank to the deck structure.** Add items for the remaining decks
from the spec: **Couple Loop**, **Fight Weather**, **Secretly Needed** (and round
out Grip/Lens/Love where CC-COUPLE-4 was thin). Each item follows the spec's
question-design rule: one engine-derived answer + plausible distractors that are
*nearby patterns* (so a half-right guess teaches). Tag each item by deck.

**T2 — wire predictors for the new items.** Map each new item's engine-derived
answer from existing outputs: `gripPattern.bucket`, `lens_stack.dominant`,
`loveMap` register, Aim, blame lens, work/love map. Where no defensible mapping
exists, return null (graceful "no strong read") rather than fabricate — but keep
that the minority. State per-item which output drives it.

**T3 — adjacency across the bank.** For every item, declare its adjacency set
(which distractors are "strong adjacent" to the engine answer) so the 1-pt tier
fires consistently. Use the spec's "nearby pattern" principle.

**T4 — deck selection.** Present a balanced spread across decks per play session
(don't dump all of one deck); cap the round length sensibly. Surface the deck
label in the UI (the spec's six-deck framing: Obvious to Me / Oblivious to Me /
Love Under Aim / Love Under Grip / Fight Weather / Secretly Needed).

## Allowed to modify

- `lib/coupleGameItems.ts` (new items + predictors + adjacency + deck tags)
- `lib/coupleReveal.ts` only if adjacency/scoring needs extension (keep
  CC-COUPLE-4's scoring contract)
- `app/couple/[token]/page.tsx` only for deck-label display / round selection

Do NOT change the individual-report engine/derivation, the couple-session schema,
or CC-COUPLE-4's scoring/reveal mechanics. No self-pass / partner-answer collection.

## Acceptance criteria

1. The bank covers the 6 decks with engine-tied predictors; a play against a
   fully-answered cohort (Michele) draws a balanced spread and the **large
   majority of items score** (few "no strong read").
2. Adjacency fires: close top-3 guesses earn 1pt with the translation line, across
   decks (not just the CC-COUPLE-4 items).
3. Distractors are nearby patterns, not random — a half-right guess produces a
   teaching translation, not a flat "wrong."
4. `tsc` + lint clean. No individual-report derivation change. Scoring contract
   from CC-COUPLE-4 intact.

## Flag in report

- Item count per deck + which engine output drives each new item's answer.
- Any items left as "no strong read" (no defensible predictor) — these are
  candidates for the self-pass / future cohort data.
- A sample balanced round for Michele (the items drawn + their reveals).
