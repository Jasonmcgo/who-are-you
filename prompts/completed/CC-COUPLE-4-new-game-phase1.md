# CC-COUPLE-4 — New Obvious-or-Oblivious (Mode 1) Phase 1: 3-rank + partial credit + warm reveal + real coverage

> Owner wants to test the *new* game with Michele. The current playable build is
> the MVP (CC-COUPLE-1/2/3): single-pick, engine-as-truth, only 3 of 8 items
> scorable (5 always "no strong read"), and a deflating 0% binary reveal. This CC
> builds the first slice of the redesign in `docs/obvious-oblivious-game-spec.md`
> so a play against Michele's profile feels like a real game, not a thin test.
> **Scope: Mode 1, engine-truth only.** (Self-pass / "verified" truth + partner
> override = Phase 3; Mode 2 "Who's More Likely" = later; party deck = later.)

## Read first

- `docs/obvious-oblivious-game-spec.md` (the design).
- `lib/coupleGameItems.ts` (the 8 items; only the 2 grip + 1 stress-posture
  predictors are wired, the rest `predict: () => null`).
- `lib/coupleReveal.ts` (the current binary Obvious/Oblivious resolver).
- `app/couple/[token]/page.tsx` (guess + reveal UI), and the report-side invite.
- `app/components/Ranking.tsx` (CC-157 arrows — reuse for the 3-rank input).

## Tasks

**T1 — 3-rank guess input.** Replace single-pick with **rank-your-top-3** per
prompt, reusing the `Ranking` component (so the CC-157 ▲▼ arrows give mobile +
a11y for free). Store the ranked guess.

**T2 — partial-credit scoring** (in `coupleReveal.ts`, replacing the binary
Obvious/Oblivious result): correct answer ranked **#1 = 5**, correct answer **in
top-3 (not #1) = 3**, **strong-adjacent in top-3 = 1**, else 0 with a light
"confidently wrong → comic badge" (no penalty, no "0% / you failed"). Each item
declares its **adjacency set** (which options are "strong adjacent" to the
engine answer) so the 1-pt tier works.

**T3 — warm 3-part reveal.** Per item: **Engine read** ("The model predicted: …")
+ a **translation** line that never punishes ("You weren't wrong — you saw the
outer behavior; the inner read was …"). (The "Partner read" line is stubbed/hidden
until the Phase-3 self-pass exists — leave a clean slot for it.) Roll up a warm
total (e.g. "You read Michele clearly on 4 of 6"), not a cold percentage.

**T4 — expand predictor coverage so it isn't mostly skipped.** Wire engine-derived
answers for the **cleanly-mappable items** — the Grip, Lens, and Love prompts —
from existing outputs: `gripPattern.bucket` (what love becomes under fear / what
they call helping), `lens_stack.dominant` (what they notice first / their default
question), `loveMap` register (how they show love), Aim (what helps them return).
Goal: the **majority** of presented items score, not 3 of 8. Items with no
defensible mapping still return null and route to a graceful "no strong read"
(don't fabricate) — but that should be the minority now, not the majority.

## Allowed to modify

- `lib/coupleGameItems.ts` (more predictors + adjacency sets + 3-rank shape)
- `lib/coupleReveal.ts` (partial-credit scoring + warm reveal-type mapping)
- `app/couple/[token]/page.tsx` (3-rank input + warm reveal UI)
- a small scoring/util module if cleaner

Do NOT touch the individual report engine/derivation, the schema, or the
couple-session data model (CC-COUPLE-1). No self-pass / partner-answer collection
in this CC.

## Acceptance criteria

1. Playing against **Michele's** session (local; couple_sessions exists there)
   presents prompts with a **3-rank** input, scores with **partial credit**, and
   shows a **warm reveal** — no binary "Oblivious/0%" framing.
2. The **majority of presented items score** (predictors wired for Grip/Lens/Love)
   — not 5-of-8 "no strong read." State the new scorable count.
3. Adjacency works: a top-3 guess that's "close" earns 1 pt and shows the
   translation line.
4. `tsc` + lint clean. No individual-report derivation change. couple_sessions
   model unchanged.

## Flag in report

- New scorable-item count vs the MVP's 3-of-8, and which engine output drives each.
- The adjacency model (how "strong adjacent" is defined per item).
- Confirm the reveal has a clean slot for the Phase-3 partner-read line.
- A sample reveal for Michele's profile (engine read + translation) so the owner
  can sanity-check tone before wider testing.
