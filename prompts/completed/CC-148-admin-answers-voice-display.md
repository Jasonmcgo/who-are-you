# CC-148 — Admin "edit answers" page: show voice prose, not raw function codes

> Owner-flagged: "the voices aren't showing on the edit-answers page, just the
> jungian process (for legacy and new model)." Q-T answers render as raw signal
> codes (ni/si/ne/se, ti/te/fe/fi) and "Picked: ni (signal: ni)" instead of the
> human voice text.

## Execution mode

Proceed without pausing. Single pass. On ambiguity, apply the codebase-faithful
interpretation, proceed, and flag it.

## Launch Directive

`claude --dangerously-skip-permissions`. Independent of CC-146/CC-147 and the
couple module. Admin render only — no engine, no derivation, no question-bank
data change.

## Context — verified root cause

File: `app/admin/sessions/[id]/answers/page.tsx`.

1. **Misclassification (the main bug).** Line 19 imports
   `import { questions as allQuestions } from ".../data/questions";` — but
   `questions` is the **filtered** export (legacy Q-T1–Q-T8 removed by CC-138.2);
   the real full bank is exported as `allQuestions` (`data/questions.ts` L15;
   filtered `questions` is L877). So the variable named `allQuestions` in this file
   is actually the filtered set. Consequences:
   - Main list (`allQuestions.map`, L318) never renders legacy Q-T at all.
   - `bankIds = new Set(allQuestions.map(q => q.question_id))` (L476) excludes
     legacy Q-T, so `FollowUpAnswersSection` (`answers.filter(a => !bankIds.has(
     a.question_id))`, L501) sweeps every Q-T answer into the **follow-up /
     clarifier** section, which renders via `FollowUpAnswerValue` (raw ids). That
     is exactly the screenshot: Q-T rows under the "Follow-up & clarifier answers"
     header showing ni/si/ne/se and "Picked: ni (signal: ni)".

2. **single_pick never looks up the voice.** `ReadOnlyAnswer`'s `single_pick`
   branch (L830-842) prints `answer.picked_id` raw. (The `ranking` branch L793-812
   already does `item?.quote ?? item?.label ?? id`, so once Q-T render in the main
   list they'll show voices — but single_pick still won't.)

3. **Editor + follow-up renderers.** `SinglepickAnswerEditor.tsx` shows
   `opt.label` ("Voice A/B"), not the voice. `FollowUpAnswerValue` (L648-768)
   shows raw ids for ranking/single_pick. `RankingAnswerEditor.tsx` already shows
   `item?.quote ?? item?.label ?? id` (fine).

Legacy Q-T ranking items carry the voice text in a `quote` field (e.g.
`data/questions.ts` Q-T1 items: `{ id:"ni", label:"Voice A", quote:"…hidden shape
underneath…", signal:"ni" }`). Binary `Q-TB-*` and re-ask single-pick answers use
the same item shape (id = function code, `quote` = voice).

## Tasks

**T1 (root fix).** Change the import so the admin page uses the **full** bank:
`import { allQuestions } from ".../data/questions";` (drop the misleading alias).
This restores legacy Q-T to the main list (rendered by `ReadOnlyAnswer`, which
already voice-looks-up ranking) and removes them from the follow-up sweep, so
`FollowUpAnswersSection` again holds only genuine `fq*` clarifiers. (The admin
review surface intentionally shows ALL answered questions, including retired-from-
flow legacy ones — distinct from the assessment flow, which correctly uses the
filtered `questions`.)

**T2.** Add a small shared voice lookup, e.g. `voiceQuoteFor(question, idOrSignal)`
that returns `item.quote ?? item.label ?? idOrSignal` by matching the question's
`items` (ranking OR binary/single-pick options) on `id` (and, as a fallback, on
`signal`). Use it in:
   - `ReadOnlyAnswer` `single_pick` branch (L830-842): show the voice quote for
     `picked_id` instead of the raw code. Handle the case where `question.type`
     is `ranking` (legacy) but the answer is `single_pick` (re-ask) — look up in
     `question.items`.
   - `SinglepickAnswerEditor.tsx`: render `opt.quote ?? opt.label` for each choice
     (still set/compare on whatever id the answer model uses — change the DISPLAY
     only, not the stored value).

**T3 (consistency).** In `FollowUpAnswerValue` ranking + single_pick branches,
apply the same voice lookup **when the item has a quote**. Genuine `fq*`
head-to-head clarifiers whose options are only "Voice A/B" with no `quote` should
keep showing label + `(signal: …)` — do not invent text. (After T1, legacy Q-T no
longer reach this renderer, but the lookup makes it robust.)

## Allowed to modify

- `app/admin/sessions/[id]/answers/page.tsx`
- `app/admin/sessions/[id]/answers/SinglepickAnswerEditor.tsx`
- a new small helper module under that admin folder if you prefer to share
  `voiceQuoteFor` (optional)

Do NOT modify `data/questions.ts`, the engine, `RankingAnswerEditor.tsx` (already
correct), or saved-answer shapes. Display-only changes; stored values unchanged.

## Acceptance criteria

1. For a session with legacy Q-T ranking answers, the admin page shows each Q-T in
   the **main list** (not the follow-up section) with the full voice `quote` per
   ranked item, plus working Edit/Reset.
2. For a session with single_pick Q-T answers (re-ask or binary), the picked
   choice shows its voice `quote`, not "ni"/"Picked: ni".
3. The "Follow-up & clarifier answers" section now contains only true `fq*`
   clarifiers (no Q-T). `fq*` head-to-heads still render acceptably (Voice label +
   signal when no quote exists).
4. No saved answer is mutated by viewing; Edit/Reset still write the same values.
   `tsc` + lint clean.

## Flag in report

- Confirm whether any other importer mistakenly used `questions as allQuestions`
  vs the true full bank on an admin/review surface (grep), and whether this page
  was the only one.
- Note if `fq*` clarifier options carry a `quote`/`voice` field (if so, T3 shows
  it; if not, label+signal is the honest display).
