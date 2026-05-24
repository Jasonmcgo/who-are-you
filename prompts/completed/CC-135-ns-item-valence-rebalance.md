# CC-135 — N/S item-valence rebalance + warm-Sensor controls (fix the warm→NF mistype at the source)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Run AFTER CC-134.** CC-134 adds the interim N/S guard + the forced N/S
head-to-head clarifier (it stops warm-Sensor mistypes from being asserted
*confidently*). CC-135 fixes the **root cause** — the item wording itself —
so the guard can later be relaxed. Do not start until CC-134 is merged.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- **This rewrites assessment item content** (the Q-T perceiving voices) and
  therefore re-derives type for everyone. The clinician/two-tier baseline WILL
  move; re-snapshot and show per-cohort type deltas.
- **Validation gate (hard):** the rebalanced items are NOT to be trusted until
  they correctly recover **warm Sensors** as S (not N). If no warm-Sensor
  ground-truth exemplar is available yet, land the rewrite behind review and
  flag the gate as open — do NOT declare the mistype fixed without a control.
- Movement (Goal/Soul/Aim/Grip) does not depend on type — keep it byte-identical.

## Context

Per Clarence + the Megan case: the **intuition (N) item voices are written
warmer and deeper than the sensing (S) voices**, so warmth/people-orientation
is confounded with intuition. A warm, reflective respondent reads the N voice
("the hidden shape underneath," "what this could become") as *them* and the S
voice as either rote (Si "what's worked before") or thoughtless (Se "just start
moving") — so they get pulled to N, and specifically to NF. There are **no warm
Sensor controls**: nowhere for a warm Sensor to land in an S voice.

Megan is the live case — a Nursing Manager (about as Se/Si a role as exists)
whose four perceiving top-picks split **Se / Ne / Si / Ni**, yet she resolved
to FiNe. Her dominant Fi is solid; the *perceiving* function was mistyped warm.
She is the textbook **warm-Sensor → NF** error and a prime control candidate.

CC-134's §C.6 guard + N/S clarifier mitigate this at derivation/confirmation
time. CC-135 removes the bias at the source so the instrument measures N vs S
on **cognitive process**, not on **warmth**.

## Tasks

### 1. Rebalance the Sensing voices for equal warmth, depth, and people-orientation
In `data/questions.ts`, across the perceiving Q-T items (Q-T1, Q-T2, Q-T3,
Q-T4, and any other block whose voices discriminate N vs S), rewrite the **Se
and Si `quote`/`example`** prose so each S voice carries the *same* warmth,
inner depth, and relational/people-orientation as its N counterpart in that
block — without changing what cognitive process it describes.

- Se today often reads impulsive ("just start moving"); rewrite to the *warm,
  attuned, present* Se — reading the actual person/room in real time, meeting
  what's in front of you, embodied care and responsiveness.
- Si today often reads rote ("what's worked before"); rewrite to the *warm,
  devoted, continuity* Si — the remembered care, the reliable presence, the
  felt loyalty to what and who has held up over time.
- The N voices stay; the goal is **parity of valence**, not dulling N. Each
  block should offer a Sensor a voice as recognizable and appealing as the
  Intuitive's.
- **Do NOT change** the `signal` mapping (ni/ne/si/se), the neutral "Voice A–D"
  labels, or the per-question option shuffle — those defenses are already good.

### 2. Add warm-Sensor control framing
Ensure at least one S voice per perceiving block is explicitly warm/people-
oriented, so a feeling-dominant Sensor (Fi/Fe + Se/Si) has a true home. This is
the "control" Clarence asked for: warmth must be available on *both* sides of
the N/S contrast, so warmth stops predicting N.

### 3. Author a valence rubric + an item-balance audit
Add `docs/canon/ns-item-valence.md` (or extend `ne-item-validity-review.md`):
a short rubric scoring each perceiving voice on warmth / depth / people-
orientation, with the rule "N and S voices in a block must score within one
band of each other." Add `tests/audit/nsItemValence.audit.ts` that asserts the
balance rule over the Q-T item set (heuristic/lexical check is fine; flag it as
a guide, not a proof).

### 4. Validate against warm-Sensor ground truth (the gate)
Re-derive the cohort and report per-cohort type before/after. The fix is only
proven if **a warm Sensor resolves to S**. Use a real warm-Sensor exemplar if
one exists; otherwise construct a warm-Sensor test profile (high Agreeableness/
Feeling + concrete/present perceiving) and confirm it lands S, not N. State
plainly whether a real control was available; if not, the gate stays OPEN and
the rebalanced items ship for review only.

### 5. Relax the CC-134 guard only after the gate passes
Once warm Sensors are recovered correctly, the §C.6 "treat N-vs-S as suspect"
guard can be loosened (note it; do not silently remove CC-134's clarifier —
that stays as a backstop).

## Read First (Required)

- `data/questions.ts` — the Q-T perceiving items (`voice`/`quote`/`example`/
  `signal`); confirm which blocks discriminate N vs S.
- `docs/canon/ne-item-validity-review.md`, `docs/canon/jungian-items-current.md`,
  `docs/canon/question-design-standard.md` — item-design canon; add the
  warmth-balance principle here.
- `lib/jungianStack.ts` (`aggregateLensStack`) + the Q-T → signal extraction in
  `lib/identityEngine.ts` — to re-derive and read type before/after.
- `tests/audit/twoTierBaseline.snapshot.*` + any Lens/type audit.
- CC-134 (the guard + clarifier this CC's gate eventually relaxes).

## Allowed to Modify (exhaustive)

- `data/questions.ts` (Q-T perceiving voice prose only — NOT the `signal` map,
  labels, or shuffle).
- `docs/canon/ns-item-valence.md` (new) or `ne-item-validity-review.md`.
- `tests/audit/nsItemValence.audit.ts` (new) + re-snapshot
  `tests/audit/twoTierBaseline.snapshot.json` (cold, LAST; show type deltas) +
  Lens/type audit anchor refreshes (flag each).

Nothing else. No Movement math change. No derivation-logic change (that was
CC-134). No label work. No cache regen (manual follow-up).

## Out of Scope

- The typing-derivation algorithm (CC-134 owns it).
- Non-perceiving Q-T items (judging voices) unless their valence also confounds.
- Engine-derived labels / patterns (still parked; this is part of the
  prerequisite typing-accuracy pass).

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier audit, the new `nsItemValence` audit, Lens/type audits
- a cold re-derive of cohorts (incl. Megan + any warm-Sensor exemplar) to show
  before/after type and Movement-unchanged
- `grep` / `rg` read-only verification

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. Movement numerics byte-identical before/after (prove it).
3. Each perceiving block's S voices carry warmth/depth/people-orientation within
   one band of their N counterparts (rubric + `nsItemValence` audit pass); the
   `signal` map, neutral labels, and shuffle are unchanged.
4. A warm-Sensor profile (real exemplar if available, else constructed)
   resolves to **S, not N** — shown before/after. If no real control exists,
   the validation gate is explicitly flagged OPEN.
5. Per-cohort type deltas reported; Megan re-checked (expected to move off FiNe
   toward FiSe / a Sensor read, or to `low` pending her N/S clarifier).
6. Two-tier baseline re-snapshotted cold, LAST; deltas confined to re-typing,
   no Movement drift.
7. Canon updated with the warmth-balance principle; no file outside the
   Allowed-to-Modify list edited; no cache regenerated.

## Report Back

- Per-item before/after for each rebalanced S voice + the rubric scores.
- The warm-Sensor validation result (real or constructed) + whether the gate is
  open or closed.
- Per-cohort type before/after (esp. Megan); confirmation Movement is unchanged.
- Canon text added; the `nsItemValence` audit + what it asserts.
- Cache note: which cohorts' type/archetype/prose keys shifted → the post-CC
  `regen-cache.sh` scope.
- Whether the CC-134 §C.6 guard can be relaxed yet (only if the gate closed).
- Any ambiguity decision; any block left out of scope.
