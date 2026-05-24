# CC-140 — Admin answer-review: show (and reset) follow-up / clarifier answers

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Admin display fix.** Independent of CC-141 (which edits jungianStack /
identityEngine / followUpQuestions). CC-140 edits the admin answer-review page
and reads already-stored answers — keep OFF `lib/followUpQuestions.ts` so it
doesn't collide with a mid-flight CC-141.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- Display-only (+ reuse CC-136's reset). No engine/derivation/Movement change.
  No change to how follow-up answers are saved or scored.

## Context

Confirmed bug: follow-up / clarifier answers (`fq1_grip_object`,
`fq2_release_condition`, `fq3_aim_replacement`, `compression_check`, the new
`fq4_*`/`fq5_*` type-clarity clarifiers, …) **do save** into `sessions.answers`
and **do feed the report** — but they are **invisible** in the admin
answer-review page. That page (`app/admin/sessions/[id]/answers/page.tsx`)
renders by iterating the `data/questions.ts` bank, and `fq*` questions are not
in the bank, so they never appear. Proven live: a submitted gap-fill bank
answer (`Q-I1b`) shows in the tally; the session's `fq*` clarifier answers do
not. Owner: "it may influence the report… just doesn't save it in the saved
answers." It saves; the admin view can't show it.

## Tasks

1. **Render a "Follow-up & clarifier answers" section.** After the bank
   questions, list every answer in `sessions.answers` whose `question_id` is
   **not** in the `data/questions.ts` bank (i.e., the follow-up/clarifier
   answers). Each renders readably from data already on the answer:
   - its stored `question_text` (follow-up answers carry their own text),
   - the chosen value(s) — `picked_id` / `picked_label` / the
     `derived_item_sources` order, whatever the stored shape carries.
   Use the admin register (mono labels, ink-mute helper) and a clear section
   header so it's distinct from the bank answers. Show the `question_id`
   (e.g. `fq1_grip_object`) as a muted tag for traceability.
2. **Reset support (re-ask) for follow-up answers.** Wire the CC-136 **Reset**
   button onto each follow-up answer too — `resetSessionAnswer(sessionId,
   questionId)` already works on any `question_id` (it archives + removes from
   `sessions.answers`). A reset follow-up answer then re-surfaces on the next
   gap-fill/follow-up link the same way other re-asks do. (Edit is out of scope
   for `fq*` for now — they carry inline signals; Reset + re-ask is the safe
   path. Flag if Edit is wanted later.)
3. **Pending-re-ask + count.** Include reset follow-up answers in the existing
   "N pending re-ask" header count so the admin sees the full outstanding set.

## Optional (flag, don't force)

- **Derived gap-fill coverage.** `Q-I2` (multiselect_derived) showed "did not
  surface." The follow-up gap-fill page skips derived types
  (`buildGapFillAnswers` — "derived types skipped (we didn't render them)").
  If quick, render derived-type gap-fill questions on the follow-up page whose
  parents ARE answered; otherwise leave it and flag as a separate follow-up
  (it's a collection-coverage gap, not a display bug).

## Read First (Required)

- `app/admin/sessions/[id]/answers/page.tsx` (+ the `*AnswerEditor.tsx` editors,
  the Reset wiring from CC-136, the pending-re-ask badge/count).
- `lib/saveSession.ts` (`resetSessionAnswer` — reuse as-is).
- `data/questions.ts` (the bank set, to compute "not in bank").
- `lib/followUpResolver.ts` + `lib/followUpQuestions.ts` (READ ONLY — to
  understand the stored follow-up answer shape; do not edit followUpQuestions
  while CC-141 may be in flight).
- The follow-up answer shape in `sessions.answers` (the `fq*` entries:
  `question_id`, `question_text`, `picked_id`/`picked_signal` or
  `derived_item_sources`).

## Allowed to Modify (exhaustive)

- `app/admin/sessions/[id]/answers/page.tsx` (+ a small presentational
  component if warranted, e.g. `FollowUpAnswerRow.tsx`).
- The follow-up gap-fill page `app/follow-up/[token]/page.tsx` ONLY if you take
  the optional derived-coverage task.
- A test/audit if useful.

Nothing else. No engine/derivation/Movement change. No edits to
`lib/followUpQuestions.ts` / `lib/jungianStack.ts` / `lib/identityEngine.ts`
(CC-141's surface). No DB schema change.

## Out of Scope

- Editing follow-up answers in place (Reset + re-ask only).
- CC-141's confidence/clarifier logic; CC-138's reformat.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the admin-reset audit + any new audit
- a dev render of a session that has `fq*` answers (e.g. JasonDMcG) to confirm
  they now display + reset
- `grep` / `rg`

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. A session with follow-up answers (e.g. JasonDMcG's `fq*` set) shows them in
   a distinct "Follow-up & clarifier answers" section with question text + the
   chosen value(s) + a muted `question_id` tag.
3. Each follow-up answer has a working Reset (archives + removes; re-surfaces on
   the next link); reset follow-ups are counted in "pending re-ask."
4. No change to how follow-up answers are saved/scored; bank-question rendering
   unchanged; the report is unaffected.
5. No file outside the Allowed-to-Modify list edited.

## Report Back

- The "not in bank" detection + how each follow-up answer is rendered from its
  stored shape.
- Reset wiring for follow-up answers (reuse of `resetSessionAnswer`).
- Whether the optional derived-coverage task was taken or flagged.
- Dev-render proof (JasonDMcG `fq*` answers now visible + resettable).
- Any ambiguity decision.
