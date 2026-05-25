# CC-170-DERIVED-FOLLOWUPS-ANSWERABLE

> Cowork-chat CC, 2026-05-24. Make the follow-up flow render and collect the
> DERIVED clarifiers it currently defers. These are the highest-value
> typing-refinement questions (they're built from the person's own ranked
> answers), so getting them answerable directly advances the
> confidence-refinement goal. Behavior-preserving refactor + follow-up wiring.

## The problem

On the follow-up link page, only `ranking` / `forced` / `freeform` questions
render. The derived types are filtered out and counted in the footer note
("N additional questions couldn't be shown here — they depend on items you
ranked elsewhere"):
- `ranking_derived` (cross-ranks, e.g. allocation Q-S3-cross / Q-E1-cross)
- `multiselect_derived` (Q-I2 trust drivers, Q-I3 sacred drivers)
- `binary_pick_derived` (the perceiving/judging dominance ordering — exactly
  the clarifier that refines borderline lens typing, e.g. Nat)

They're deferred because their **options/items resolve at render time from the
top-N of their `derived_from` parent rankings**, and the follow-up page neither
(a) has the parent answers wired in nor (b) reuses the resolution + render
logic. But the data IS available: the follow-up token → `follow_up_links` →
`session_id` → the session's stored `answers` (the completed survey, including
the parent rankings). And the resolution logic already exists — it just lives
inside the assessment page.

## Existing machinery to reuse (do NOT reinvent)

- `app/assessment/page.tsx`:
  - `deriveItemsForCrossRank(question_id, derived_from, topN, answers)` (~L64)
    → resolves `ranking_derived` items.
  - `deriveItemsForMultiSelect(derived_from, topNPerSource, answers)` (~L113)
    → resolves `multiselect_derived` items.
  - the `binary_pick_derived` item resolution (locate it in the assessment's
    binary flow — the two items come from the parent `binary_pick` picks named
    in `derived_from`; if it's inline, factor it into a named resolver).
- `lib/saveSession.ts` (~L230-281) already handles persisting derived answers
  and the parent/`derived_from` relationship — reuse it on submit.
- The follow-up POST (`app/api/follow-up/[token]/route.ts`) already merges
  answers back by `question_id`.

## Part 1 — extract the resolvers into a shared lib (behavior-preserving)

Create `lib/deriveQuestionItems.ts` and MOVE (not copy) the three resolvers
there as pure functions:
- `deriveItemsForCrossRank(...)`
- `deriveItemsForMultiSelect(...)`
- `deriveItemsForBinaryPick(...)` (the binary_pick_derived resolver — extract
  or author from the assessment's existing logic; takes `derived_from` + answers
  → the two RankingItems).

Refactor `app/assessment/page.tsx` to import from the new lib. This MUST be a
no-op for the assessment — same items, same render, same skip behavior. The
assessment's `isAutoSkipQuestion` / cascade-skip logic also calls these; point
those at the shared lib too. Verify the assessment audits are byte-identical.

## Part 2 — feed the follow-up flow the parent answers

`app/api/follow-up/[token]/route.ts` GET handler: add the session's `answers`
(the full completed survey) to the JSON payload. (It already loads the session
to compute `missingQuestions`; just include `answers`.) This is the parent
context the resolvers need.

## Part 3 — resolve + render derived questions on the follow-up page

`app/follow-up/[token]/page.tsx`:
- Expand `renderableMissing` to INCLUDE the derived types, EXCEPT ones whose
  parents can't be resolved (resolver returns null → genuinely unanswerable;
  keep those deferred). For a completed session the parents are answered, so
  the deferred count should drop to ~0.
- For each renderable derived question, resolve its items via the shared
  resolver + the parent `answers` from the payload (mirror the assessment's
  `useMemo` resolution), then render with the matching component:
  - `ranking_derived` → `Ranking`
  - `multiselect_derived` → the multiselect component the assessment uses
  - `binary_pick_derived` → `SinglePickPicker` (binary, 2 items)
- Keep the deferred-count note ONLY for questions that truly can't resolve
  (missing parent data). Reword it to plain language and FIX the jammed
  "questionscouldn't" → "questions couldn't" (assemble the sentence as a single
  string/variable to avoid the cross-line JSX whitespace bug). Suggested copy
  when count > 0: "(N follow-up question(s) need answers you didn't complete in
  the original survey, so they're not shown here.)"

## Part 4 — submit the derived answers

Ensure the follow-up POST persists the derived answers in the same shapes the
assessment + `saveSession.ts` already expect:
- `binary_pick_derived` → `SinglePickAnswer` (pick one of two; rank-1 signal)
- `multiselect_derived` → its multiselect answer shape
- `ranking_derived` → ranking answer shape
Reuse the existing merge-by-`question_id` path; do not double-append. After
submit, the engine re-derivation should consume them (this is what sharpens the
lens/grip typing).

## Do NOT

- Change the assessment's behavior — Part 1 is a pure extraction; assessment
  audits must stay green/byte-identical.
- Change engine math, the question bank, or the derived-question definitions
  in `data/questions.ts` / `lib/types.ts`.
- Reinvent the resolvers — move and reuse the assessment's.
- Persist derived answers in a new/divergent shape — match saveSession.
- Commit or push.

## Acceptance

- `tsc --noEmit` clean; lint clean.
- Assessment unchanged: its audits (and any assessment-flow snapshot) stay
  green/byte-identical after the resolver extraction.
- Kevin's follow-up link now RENDERS the previously-deferred derived
  clarifiers (the deferred count drops to ~0 for a completed session); each
  derived question shows resolved options drawn from his actual rankings.
- Submitting a follow-up that includes derived answers persists them
  (merge-by-question_id, no double-append) and the re-derived constitution
  reflects them.
- The footer note (when it still appears) reads in plain language with no
  jammed words.
- `followUpQuestions.audit.ts` / `followUpBackend.audit.ts` green; full suite
  green at close.

## Report back

- Files modified/created (the new shared lib; assessment refactor; follow-up
  route + page; submit path).
- Confirm the assessment render is unchanged (how verified).
- Kevin's follow-up: before/after deferred count + a sample resolved derived
  question (showing options drawn from his rankings).
- A round-trip test: submit a derived follow-up answer → confirm it persists +
  re-derivation consumes it.
- Audit results.

## Why this matters (context)

This is the load-bearing piece of the confidence-refinement framework (the
pending "provide questions until confidence = high" goal): the binary_pick_derived
dominance clarifier and the derived trust/sacred drivers are precisely the
follow-ups that move borderline typings (Nat, Michele, Ashley) toward high
confidence. Until now they were generated but unanswerable via the link.
