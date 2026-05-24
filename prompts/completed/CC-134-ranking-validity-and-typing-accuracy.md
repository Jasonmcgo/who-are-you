# CC-134 — Ranking validity + typing accuracy (capture untouched rankings; derive type from top-pick convergence)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- **This is an intentional derivation change** (like CC-112/CC-116). It WILL
  change some cohorts' Lens/type read — that is the point (it fixes mistypes).
  The clinician/two-tier baseline WILL move and must be re-snapshotted, with
  the per-cohort type deltas shown for review.
- **Invariant that must hold:** the Movement numerics (Goal / Soul / Aim /
  Grip) do NOT depend on type and must stay byte-identical. Only the
  Lens/type/confidence and everything downstream of it (archetype, Lens-keyed
  prose, OCEAN bridges) may change. Prove Movement is unchanged.

## Context

Two upstream data-quality faults are corrupting reports (Megan is the live
case; her Grip read landed but her values-ordering, blind-spots, and type read
did not):

**(A) Untouched rankings are saved as the default presentation order.** In
`app/assessment/page.tsx` the ranking `seed` is `prev.order ?? question.items.
map(i => i.id)` and `draft = drafts[qid] ?? seed`. `Ranking.tsx` only emits
`onChange` on a deliberate drag/keyboard move. So a respondent who never
touches a ranking has the **default item order saved as if it were a
deliberate ranking** — indistinguishable from a real answer. For value
questions (Q-S1/Q-S2) the default order is coherent-looking, so it produces
*false* top-values (and false "blind spots"). For type questions (Q-T1–T8) the
default is shuffled-per-question, so it produces noise → low-confidence /
mistyped Lens.

**(B) Type is derived from flat average rank, so weak-vs-weak noise tips the
dominant.** `lib/jungianStack.ts › aggregateLensStack` selects the dominant
perceiving/judging function by `averageRank` across ALL Q-T positions. A
function that lands 2nd repeatedly (e.g. the Ti-voice over-attracts) gets a
lower average than the true dominant that occasionally lands 3rd — so weak
functions invert strong ones. Owner's worked example: "Ti beats Fi for me even
though Fi is my 3 and Ti is my 6." This is the structural cause of the mistypes
(Kevin, Connor) and of false-low/false-high Lens confidence.

**Design principle (owner):** the **top pick** carries the signal; the noisy
middle does not; and **weak-vs-weak comparisons are non-data** — people cannot
reliably introspect the relative order of functions they don't live in. So:
capture and weight the top pick, treat ranks 2–4 as low/zero weight, derive
type from **top-pick convergence across Q-T1–T8**, and when picks don't
converge (or a selection contradicts another card), **ask** rather than assert.

This is the typing-accuracy / data-quality pass logged in
`docs/pattern-taxonomy-notes.md` as the prerequisite for any engine-derived
label. It does not build labels; it makes the inputs trustworthy.

## Part A — Capture untouched rankings (route to the existing second pass)

The second pass already exists: `app/components/SecondPassPage.tsx` re-asks
**skipped** ranking questions as a single-pick ("what's your #1?"). The gap is
that *untouched* rankings aren't *skipped* — they're silently saved as default
order, so they never reach the second pass.

### Tasks
1. **Interaction tracking** in `app/components/Ranking.tsx`: set a `touched`
   flag on the first deliberate reorder (drag or keyboard move) and surface it
   to the parent (e.g. an `onTouched` callback or include it in the change
   payload). A ranking that is advanced past without a touch is "untouched."
2. In `app/assessment/page.tsx`, when advancing a ranking question that was
   never touched, **route it to the second pass** the same way a skip does
   (add its id to `skippedQuestionIds` / the second-pass set). Do NOT save the
   default order as a deliberate answer. The existing `SecondPassPage`
   single-pick UI then re-asks it — which also fixes the original confusion
   (a clear "pick your top" beats the drag-rank that wasn't understood).
3. **Capture = top pick** (owner decision: "the top choice says as much").
   The single-pick second pass already captures the top; that is sufficient.
   For the highest-leverage rankings only (Q-S1, Q-S2, and the Q-T set),
   optionally also capture **"least you"** as a second tap — more informative
   than positions 2–3. Flag whether you added "least."
4. **Cap / prioritize.** A fully passive respondent could leave many rankings
   untouched; re-asking all rebuilds a long second pass. Prioritize the
   high-signal set (sacred values Q-S1/Q-S2, type Q-T1–T8) and cap the rest
   (suggest a ceiling; flag the number).

## Part B — Backfill heuristic audit (existing cohorts)

Existing sessions have no `touched` flag recorded, so detect *suspected*
untouched rankings heuristically: **a saved ranking whose order exactly equals
its question's default `items` order** is flagged "suspected untouched / low
confidence." Add an audit (`tests/audit/rankingUntouchedHeuristic.audit.ts` or
a `scripts/` report) that runs over the 14 cohort fixtures and reports, per
session, which rankings match default order — so we can see how much of each
report (esp. Megan) is artifact. Report-back includes the per-cohort tally.
(This is diagnostic; it does not mutate fixtures.)

## Part C — Type from top-pick convergence (the mistype fix)

Change `lib/jungianStack.ts › aggregateLensStack` so dominant/auxiliary
selection is driven by **top-pick convergence**, not flat average rank:

1. **Score by top-pick frequency, not average rank.** For each function, count
   how often it is the **rank-1 pick** across the Q-T blocks it appears in.
   Weight rank-1 heavily; weight ranks 2–3 near-zero; optionally treat the
   explicit last/"least" as a small negative. (Replace `averageRank` in the
   dominant/aux selection; you may keep `cumulativeWeight` for diagnostics.)
2. **Dominant** = the perceiving (ni/ne/si/se) and judging (ti/te/fi/fe)
   function that *most often leads*, then resolve dom-vs-aux + MBTI mapping via
   the existing `STACK_TABLE` / `VALID_AUX_BY_DOMINANT` (unchanged).
3. **Confidence from convergence.** If the leading function in a pool does not
   clear the runner-up by a margin in **top-pick** terms (not avg-rank), mark
   confidence `low`. Non-convergence — scattered #1s with no clear leader — is
   `low` and is the trigger for Part D. Keep the CC-097 same-dimension-mirror
   intuition where it still applies, but the primary signal is now top-pick.
4. **Keep `computeJungianStack` / OCEAN bridges consistent.** They read the
   same resolved stack; verify the OCEAN position-weight contributions still
   compute and re-snapshot if they shift (expected for any cohort whose stack
   order changed). Do NOT change the position-weight curve or `STACK_TABLE`.
5. Provide the convergence rule as a single tunable function with the threshold
   as a named constant (owner may retune); document the default.
6. **Perceiving-axis (N/S) valence guard — REQUIRED.** The intuition (N) item
   voices are written warmer/deeper than the sensing (S) voices, so warm,
   people-oriented respondents over-pick N (the warm-Sensor → NF mistype). Megan
   is the live case: her four perceiving top-picks split **Se / Ne / Si / Ni**
   (one each), yet she resolved to FiNe — a coin-flip the warm-N voices tipped.
   Until CC-135 rebalances the items, top-pick convergence must **NOT raise N
   confidence over a close S**: treat the N-vs-S (perceiving) call as suspect by
   default — when the S pick is within margin of the N pick, mark Lens
   confidence `low` and route to Part D rather than committing to N. The
   judging-axis fix (top-pick over avg-rank) still applies normally; this guard
   is specific to the N/S axis and its known item-valence bias. Without it, Part
   C would *harden* warm-Sensor mistypes into confident-but-wrong N.

Expected outcome: cohorts whose dominant flipped on weak-vs-weak noise (the
Ti>Fi class) re-resolve toward the true dominant or move to `low` confidence
(which the report already hedges). Show the before/after type per cohort.

## Part D — "Doesn't jive / non-convergent" → confirm clarifier

Wire a confirmation clarifier into the existing follow-up/second-pass phase
(`lib/followUpQuestions.ts` generator + resolver, CC-125/126):

1. **Non-convergent type → head-to-head clarifier (REQUIRED on any N/S split).**
   When Part C confidence is `low` from scattered top-picks — and **always** when
   the perceiving call is an N-vs-S split (per the §C.6 valence guard) — generate
   a clarifier that puts the **two leading voices head-to-head** (top candidates
   only, never weak-vs-weak) and let it resolve the perceiving function /
   dominant. The N/S head-to-head must pair a **warm-Sensor framing** against the
   intuitive one, so warmth isn't the deciding cue. Megan is the textbook trigger
   (Se/Ne/Si/Ni split + Nursing-Manager anchor → likely FiSe, not FiNe).
2. **"Doesn't jive" gaps:** when a blind-spot / allocation gap is detected AND
   one of its inputs was untouched or low-confidence, do NOT assert the
   hypocrisy — instead surface a confirm clarifier ("you named X highest; your
   week reads Y — which is truer right now?"). This stops false blind-spots
   like Megan's Honor gap from being asserted off artifact data.
3. These ride alongside the existing 2–3 generated clarifiers; respect the
   second-pass cap.

## Read First (Required)

- `app/components/Ranking.tsx` (touched flag) + `app/assessment/page.tsx`
  (`seed`/`draft` logic ~L334–354; `skippedQuestionIds` flow ~L183/367–442).
- `app/components/SecondPassPage.tsx` (single-pick re-ask of skipped rankings).
- `lib/jungianStack.ts` (`aggregateLensStack`, `averageRank`, `rankWeight`,
  `computeJungianStack`, `STACK_TABLE`, CC-097 confidence logic).
- `lib/identityEngine.ts` — where Q-T rankings become function `Signal`s
  (`signalsFromDerivedRanking` / the Q-T extraction) and where `aggregateLensStack`
  / `computeJungianStack` are called.
- `lib/followUpQuestions.ts` + `lib/followUpResolver.ts` (clarifier generation)
  for Part D.
- `docs/canon/ne-item-validity-review.md`, `docs/canon/signal-and-tension-model.md`,
  `docs/pattern-taxonomy-notes.md` (the parked typing-accuracy rationale).
- `tests/audit/twoTierBaseline.snapshot.*` + `tests/audit/shapeAwareProseRoutingV2.audit.ts`
  + any Lens/jungian audit that pins type per fixture.

## Allowed to Modify (exhaustive)

- `app/components/Ranking.tsx`, `app/assessment/page.tsx`,
  `app/components/SecondPassPage.tsx` (Part A).
- `lib/jungianStack.ts` (Part C). `lib/identityEngine.ts` only at the Q-T
  signal-extraction / stack-call sites if needed to pass top-pick data through
  — NOT the Movement/Goal/Soul/Aim/Grip math.
- `lib/followUpQuestions.ts`, `lib/followUpResolver.ts` (Part D).
- New audit: `tests/audit/rankingUntouchedHeuristic.audit.ts` (Part B).
- Re-snapshot `tests/audit/twoTierBaseline.snapshot.json` (cold, LAST; show
  per-cohort type deltas) + refresh anchors in any Lens/type audit that breaks
  on the intended re-typing (flag each).

Nothing else. No Movement/Goal/Soul/Aim/Grip math change. No new archetype
type. No label work (CC-132/133 territory). No cache regen (manual follow-up).

## Out of Scope

- Engine-derived overarching labels / the 10 patterns (parked; needs this first).
- Adding a Q-Function-Order question (the `explicitOrdering` hook stays unused).
- The label render (CC-132/133). Cohort cache regen (separate, after this lands).

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier audit, the new untouched-heuristic audit, the shape-aware /
  Lens / jungian audits
- a cold render of 2–3 fixtures (incl. Megan, and a known mistype like Kevin /
  Connor) in both modes to eyeball before/after type + Movement-unchanged
- `grep` / `rg` read-only verification

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. **Movement numerics byte-identical** before/after for all cohorts (prove it).
3. **Part A:** an untouched ranking is no longer saved as default order — it is
   routed to the single-pick second pass; a deliberately-ranked question is
   unaffected. Demonstrate with a simulated untouched vs touched flow.
4. **Part B:** the untouched-heuristic audit runs over 14 cohorts and reports
   per-session which rankings equal default order (Megan's tally included).
5. **Part C:** dominant/aux is selected by top-pick convergence; a constructed
   weak-vs-weak case (Ti ranked 2nd repeatedly, Fi 3rd) no longer flips the
   dominant to Ti — it resolves to Fi or to `low` confidence. Show per-cohort
   before/after type; the Ti>Fi class is corrected or hedged.
6. **Part D:** a non-convergent type generates a top-2 head-to-head clarifier;
   a blind-spot built on an untouched/low-confidence input is surfaced as a
   confirm clarifier instead of an asserted hypocrisy.
7. The two-tier baseline is re-snapshotted cold, LAST; per-cohort type deltas
   shown and confined to the intended re-typing (no Movement drift).
8. No file outside the Allowed-to-Modify list edited; no cache regenerated.

## Report Back

- Part A: the `touched` mechanism + the untouched→second-pass routing; whether
  "least you" was added; the cap chosen.
- Part B: the per-cohort untouched-heuristic tally (how much of Megan is artifact).
- Part C: the convergence rule + threshold constant; the per-cohort before/after
  type table; confirmation Movement is byte-identical; OCEAN-bridge effect.
- Part D: the two clarifier triggers + example generated clarifiers.
- The two-tier diff scope (type-only, no Movement drift); audit-anchor refreshes.
- **Cache note:** Lens/type changes shift archetype + prose cache keys — state
  which cohorts will need regen (the post-CC manual `regen-cache.sh`).
- Any ambiguity decision; any site found but left out of scope.
