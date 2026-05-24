# CC-136 — Admin Reset / re-ask + gap-fill link for any session (clear + archive)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
Edits are admin / data-collection surfaces — mostly disjoint from CC-134
(assessment/Ranking/jungianStack). If CC-134 is mid-flight, keep edits off the
files it owns; the only shared touchpoint is the follow-up route — flag any
overlap.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- **Admin / data-collection feature.** No engine/derivation/render-content
  change. No Movement/Goal/Soul/Aim/Grip math change.
- A DB migration is in scope (adds an answer-history store). Use the existing
  drizzle setup (`drizzle.config.ts`, `db/`); generate + apply per repo norms.

## Context

Owner needs (admin/maintenance):

1. **Send links to collect missing answers.** Several cohorts will be manually
   uploaded from the local system — captured *before* the full question bank
   existed, so they have gaps. **This already works:** the follow-up link
   endpoint (`app/api/follow-up/[token]/route.ts`) returns
   `missingQuestions(answers)` (every bank question not in the session's
   `answers[]`) + generated follow-ups. So an uploaded partial session's gaps
   are asked automatically — *provided a link can be minted for it* (see Part C).

2. **Reset / re-ask an already-answered question.** Admin can EDIT an answer but
   cannot CLEAR it. Owner's product idea (per screenshot): a **Reset button next
   to Edit** that "restores the question to its default and removes the
   user/individual answer." Because of #1, Reset needs no link changes — once
   an answer is removed it becomes "missing" and the existing link re-asks it.

**Owner decision (reset semantics): clear + archive.** Reset clears the LIVE
answer so the question re-asks, but **snapshots the prior answer + timestamp**
into an answer-history store. This avoids data loss when re-asking an
already-answered question (re-collecting CC-135's rebalanced items, re-measuring
under movement, etc.) and lays the groundwork for the longitudinal
movement/grip/consistency tracking owner named — without building the full
versioned-"passes" system yet (that's CC-137, out of scope here).

## Part A — `resetSessionAnswer` action + answer-history archive

1. **DB:** add an `answer_history` store (a JSON column on the session row, or a
   sibling table) holding append-only entries:
   `{ question_id, answer, archived_at, reason }`. Migration via drizzle.
2. **Action** (`lib/saveSession.ts`, mirroring `updateSessionAnswer`):
   `resetSessionAnswer(sessionId, questionId, reason="admin_reset")` —
   - append the current answer to `answer_history`;
   - remove it from the live `answers[]`;
   - **cascade:** if the reset question is a parent of derived questions
     (`derived_from`), also archive + remove those derived answers (they're
     stale without the parent; `missingQuestions` already hides derived until
     parents are re-answered);
   - return the updated session (same shape `updateSessionAnswer` returns).
3. The removed question now satisfies `missingQuestions` automatically — no
   change to `missingQuestions.ts` or the link endpoint needed for it to be
   re-asked.

## Part B — Reset button (admin answers page)

In `app/admin/sessions/[id]/answers/page.tsx` (+ a small `ResetButton` if
warranted), add a **Reset** control next to **Edit** for each answered question:

- Confirm dialog: "Reset clears this saved answer and re-asks it on the next
  link. The prior value is archived." (Don't reset silently.)
- On confirm → call `resetSessionAnswer` → refetch the session (same pattern as
  Edit's save) → returning to the detail view re-derives, as today.
- Show a subtle "pending re-ask" state for reset questions (they'll render as
  unanswered/missing after reset). A small session-level count of "N questions
  pending re-ask" is a nice-to-have.
- Reset should be available for all editable answer types (forced/freeform,
  ranking, single-pick, multiselect-derived) — mirror the Edit coverage.

## Part C — Mint a gap-fill link for ANY session

Confirm the admin can generate/copy a follow-up (gap-fill) **token link for any
session**, including manually-uploaded cohorts — not only sessions already in
the follow-up flow. The public answer page already renders `missingQuestions`
+ follow-ups; the gap is link *minting*.

- If token minting is currently tied to the cohort follow-up flow only, add an
  admin **"Generate gap-fill link"** (and copy-to-clipboard) on the session
  detail / answers page that mints a token for that session and yields
  `{origin}/follow-up/{token}`.
- The link then covers: missing (gaps + Reset) ∪ generated clarifiers. No new
  question-set logic needed beyond minting.

## Part D — "Always-collect" hook (OPTIONAL — flag, don't over-build)

Owner wants every link send to optionally include "special items we want to
collect" (e.g. push CC-135's rebalanced N/S items for re-collection; periodic
re-measures). Add a minimal, clearly-flagged hook: a small configurable set of
`question_id`s (global constant or a per-link admin selection) that the link
**force-includes** even if answered (treated like missing for that send). Keep
it behind a flag / simple constant; do NOT build scheduling or per-user
campaigns here. If it adds meaningful complexity, stub the hook and flag it for
a follow-up rather than implementing fully.

## Read First (Required)

- `app/admin/sessions/[id]/answers/page.tsx` + the `*AnswerEditor.tsx` editors
  (Edit/save pattern, where Reset slots in).
- `lib/saveSession.ts` (`updateSessionAnswer` — mirror for `resetSessionAnswer`).
- `lib/missingQuestions.ts` (how "missing" is computed — confirms Reset→missing).
- `app/api/follow-up/[token]/route.ts` + `lib/followUpResolver.ts` (link
  question set) and the token **mint** path (CC-126/127/129) for Part C.
- `db/` schema + `drizzle.config.ts` (for the `answer_history` migration).
- `app/admin/sessions/page.tsx` / `[id]` detail (where "Generate link" / copy
  affordances live, CC-129).

## Allowed to Modify (exhaustive)

- `lib/saveSession.ts` (+ a new `lib/answerHistory.ts` helper if warranted).
- `app/admin/sessions/[id]/answers/page.tsx` (+ a small `ResetButton.tsx`).
- The token-mint surface for Part C: `app/admin/sessions/[id]/...` and/or the
  relevant `app/api/admin/...` route; the follow-up route ONLY if minting needs
  it (flag overlap with CC-134's Part D edits there).
- DB migration files (drizzle) + the schema module for `answer_history`.
- A test/audit (`tests/audit/adminResetReask.audit.ts`).

Nothing else. No engine/derivation/render-content change. No Movement math.
No versioned-passes system (CC-137).

## Out of Scope

- **CC-137 — versioned "passes" + longitudinal deltas** (movement/grip/
  consistency over time). The `answer_history` archive here is its groundwork,
  but reading history into derivation / computing cross-pass deltas is separate.
- Scheduling / automated re-ask campaigns; per-user link dashboards.
- Any change to how answers are scored once collected.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- drizzle generate/migrate per repo norms (against the dev DB)
- the new admin-reset audit; `grep`/`rg` read-only verification
- a manual exercise: reset a question on a fixture/dev session, confirm it
  becomes missing and the minted link surfaces it; confirm prior value archived

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. `resetSessionAnswer` clears the live answer, **archives** the prior value
   (+timestamp+reason) to `answer_history`, and cascades to derived children.
   Prove the archive retains the prior value.
3. A reset question is reported by `missingQuestions` and is asked by the
   minted link (demonstrate end-to-end on a dev session).
4. The admin answers page shows a **Reset** button next to Edit for every
   answer type, with a confirm; reset triggers re-derivation on return.
5. An admin can mint a gap-fill link for an arbitrary (e.g. manually-uploaded)
   session; the link covers missing(gaps+reset) ∪ clarifiers.
6. (If built) the always-collect hook force-includes its configured ids; else
   it's stubbed + flagged.
7. DB migration applies cleanly; no engine/derivation/Movement change.
8. No file outside the Allowed-to-Modify list edited.

## Report Back

- The `answer_history` shape + migration; the `resetSessionAnswer` cascade rule.
- The Reset UI (per-type coverage + confirm); how re-derivation is triggered.
- Part C: how a link is minted for an arbitrary session; the resulting URL shape.
- Part D: built vs stubbed, and the configured ids if any.
- End-to-end proof: reset → missing → minted link asks it → prior archived.
- Any overlap with CC-134's follow-up-route edits (flag).
- CC-137 groundwork note: what the archive captures and what longitudinal
  deltas would still need.
- Any ambiguity decision.
