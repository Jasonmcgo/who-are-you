# CC-053 — Admin Answer Review/Edit

**Type:** New admin-portal feature. **No new questions. No new signals. No engine logic changes.** Adds capability to view a saved session's question-by-question answers and edit them on behalf of the user; re-derives the report after edit. Multi-file UI feature with judgment calls about how each question type renders in edit mode.
**Goal:** Let an admin open a saved session, see what the user actually answered (per question), update any answer on the user's behalf, and have the report re-derive against the updated answer set. Foundation for the future user-self-access feature (account-based login + answer update) without committing to that scope yet.
**Predecessors:** CC-019 (Persistence and demographics — sessions are persisted in a saveable form), CODEX-049 (/admin Suspense fix — `/admin` route now prerenders cleanly), CODEX-050 (admin re-render mode — admin session detail view re-derives the report from saved answers; CC-053 extends this with answer-level access).
**Successor:** Future user-facing equivalent — same answer review/update interface, but accessed by the user themselves via account login. The component architecture should support eventual reuse with minimal rework.

---

## Why this CC

Surfaced 2026-04-30 from product-vision conversation about MVP launch. The hosted-system MVP plans for users to:

- Take the assessment (one-time, low-friction).
- Optionally complete demographics → email becomes account ID → log back in to review/update answers and re-render the report against the current (presumably evolving) engine.
- Receive custom LLM PDFs, monthly newsletters tied to engine improvements.

The future user-facing answer-update feature is post-MVP-launch architecture. **The immediate need is the admin-side equivalent:** an admin can open any saved session, see the user's answers, update them (e.g., the user contacted support to revise an answer they wish they'd marked differently), and have the report re-derive.

Practical use cases TODAY:

- Calibration validation: an admin can change one of a saved session's answers and immediately see how the report shifts. Useful for testing rewrite-track CCs against real saved data with controlled answer-set deltas.
- Support handling: user emails support saying *"I marked Job/Career as my #1 stake but meant Money,"* admin can update on the user's behalf without making the user re-take.
- Test-data manipulation: admin can construct synthetic answer sets by editing existing sessions for engine smoke tests.
- Foundation for the eventual user-facing feature: components built here should reuse cleanly when we wire user-account login.

This CC is admin-only. No user-facing surface. No authentication / authorization changes (the `/admin` route is already admin-gated).

---

## Scope

Files modified or created:

1. **NEW** — `app/admin/sessions/[id]/answers/page.tsx` (or a tab/sub-route within the existing session detail; verify with Read what the route structure is). Lists all the user's answers question-by-question.
2. **NEW** — `app/admin/sessions/[id]/answers/AnswerEditor.tsx` (or component file with the per-question-type editors). Composed from sub-components for each answer type.
3. **NEW or extended** — per-question-type editor components:
   - `RankingAnswerEditor.tsx` — drag-rank or numbered-list edit of a ranking answer.
   - `FreeformAnswerEditor.tsx` — text-area edit of a freeform answer.
   - `MultiselectAnswerEditor.tsx` — checkbox edit of a multi-select answer.
   - `SinglepickAnswerEditor.tsx` — radio-button edit of a single-pick answer.
   - `MultiselectDerivedAnswerEditor.tsx` — same as multiselect but with the derived-options list (per Q-I2 / Q-I3).
4. **NEW** — `app/api/admin/sessions/[id]/answers/route.ts` (or server action). Handles POST to update an answer; persists to the session record; returns updated session.
5. `lib/saveSession.ts` (or wherever session persistence lives — verify with grep) — extend with an `updateSessionAnswer(sessionId, questionId, newAnswer)` function. Keeps existing `saveSession` / `loadSession` untouched.
6. `app/admin/sessions/[id]/page.tsx` — add a link/button to the answers view. Existing report rendering stays unchanged.

Nothing else. Specifically:

- **No engine logic changes.** `buildInnerConstitution` consumes the updated answer set unchanged.
- **No question-text or signal changes.** Editing an answer changes the value, not the question definition.
- **No demographics editing in this CC.** Demographics are handled separately (different schema, different UI surface). Future CC if needed.
- **No persistence-schema changes.** The session record's `answers` field already stores the answer set; `updateSessionAnswer` updates an entry within that field.
- **No re-derivation snapshot persistence.** Per CODEX-050, the admin view re-derives on each render; the saved session's `inner_constitution` snapshot field is NOT updated when an answer changes (the next time the admin loads the session, the re-derive runs against the updated answers, which is the correct behavior).
- **No user-facing surface changes.** Public report URLs, the survey flow, and the user-facing app stay untouched.
- **No authentication changes.** Admin route is already gated.

---

## The locked behavior

When an admin opens `/admin/sessions/[id]/answers` (or whatever the route lands on):

1. The session's saved `answers` array is loaded.
2. Questions are listed in the order they were asked (per `data/questions.ts` ordering).
3. Each question shows:
   - Question ID (e.g., "Q-S1") in mono uppercase
   - Question text (the user-facing prompt)
   - The user's current answer, rendered per question type
   - An "Edit" button that opens the per-type editor inline
4. After edit + save:
   - The answer is persisted via the API/server action
   - The page re-renders showing the updated answer
   - A small indicator confirms the update ("Updated [timestamp]")
5. A link/button at the top returns to the session detail page (which re-derives the report against the updated answer set).

### Per-question-type editors

The locked editor patterns:

- **Ranking** (Q-S1, Q-S2, Q-S3-*, Q-E1-*, Q-Stakes1, Q-3C1, Q-Ambition1, Q-T1–T8, Q-X3, Q-X4, etc.): rendered as a numbered list with drag-handles. Admin can reorder; on save, the new order persists. Items are read from `question.items` (the canonical item list); the user's current order is in the answer's `order` array.
- **Freeform** (Q-I1): rendered as a text-area pre-filled with the user's text. Save updates the text.
- **Multiselect** (Q-I2, Q-I3 derived): rendered as checkboxes. The options list comes from the question's derivation (per `data/questions.ts` `derived_from` + the user's parent answer). The user's current selections are pre-checked. Save updates the selections.
- **Forced choice / single-pick** (Q-C1, Q-C3, Q-P1, Q-P2, Q-F1, Q-F2, Q-X1, Q-X2): rendered as radio buttons. The options list is `question.options`. The user's current selection is pre-checked. Save updates.

Each editor is a small component (~50-80 lines). Keep state local until save (no auto-save on change); save commits to the API/server action.

### Visual register

Editor surfaces use admin-distinct styling (mono labels, ink-mute helper text) — clearly differentiated from the user-facing survey's typography. The intent: admin should never confuse this view with the user's experience.

---

## Steps

### 1. Audit the existing admin route structure

`Read` `app/admin/sessions/[id]/page.tsx` to confirm the route shape post-CODEX-050. `ls app/admin/sessions/` to see if any sub-routes already exist. Decide whether to:

- **A.** Add a new sub-route at `/admin/sessions/[id]/answers` (cleaner separation).
- **B.** Add a tab/toggle within the existing session detail page (denser UI).

Default: A. Surface in Report Back.

### 2. Locate session persistence

`grep -rn "loadSession\|saveSession\|inner_constitution\|session.answers" lib/ app/`. Identify:

- Where sessions are stored (localStorage / database / API endpoint).
- The shape of the saved session (verify it has `answers: Answer[]` per `lib/types.ts`).
- The existing load / save functions.

### 3. Implement `updateSessionAnswer` in `lib/saveSession.ts`

```ts
export async function updateSessionAnswer(
  sessionId: string,
  questionId: string,
  newAnswer: Answer
): Promise<void> {
  const session = await loadSession(sessionId); // existing
  const updatedAnswers = session.answers.map((a) =>
    a.question_id === questionId ? newAnswer : a
  );
  await persistSession(sessionId, { ...session, answers: updatedAnswers });
}
```

Adapt to whatever the existing persistence shape is. Keep `loadSession` / `saveSession` unchanged; this is an additive helper.

### 4. Implement the API/server action route

For Next.js App Router, this is a `route.ts` at `app/api/admin/sessions/[id]/answers/route.ts`:

```ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { questionId, newAnswer } = await req.json();
  await updateSessionAnswer(params.id, questionId, newAnswer);
  return NextResponse.json({ ok: true });
}
```

Or use a server action if the project's pattern is server-action-based. Verify with how other admin routes handle mutations.

### 5. Build the answer-list page

`app/admin/sessions/[id]/answers/page.tsx`:

- Loads the session.
- Iterates through questions in the canonical order (from `data/questions.ts`).
- For each question, renders a question-card component showing:
  - Question ID + text
  - User's current answer (read-only initially)
  - Edit button → toggles to the per-type editor
  - Save / Cancel buttons in edit mode
- A header banner: *"ADMIN ANSWER REVIEW · changes here update the user's saved session and trigger report re-derivation"* (mono uppercase, admin-distinct).

### 6. Build the per-type editor components

Five small components per the per-question-type list above. Each takes:

- `question: Question` (the question definition)
- `currentAnswer: Answer` (the user's current answer)
- `onSave: (newAnswer: Answer) => Promise<void>`
- `onCancel: () => void`

Keep each one focused and minimal. No animation, no fancy interactions — admin tooling, not consumer UX.

### 7. Wire the link from session detail page

In `app/admin/sessions/[id]/page.tsx`, add a small link/button (mono, ink-mute) somewhere visible: *"View / Edit Answers →"* linking to `/admin/sessions/[id]/answers`.

### 8. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` exits 0 (the build streak should continue).
- Manual: load a saved session in admin, click into Answers view, verify each question type renders correctly. Edit one answer per type (a ranking, a freeform, a multiselect, a single-pick). Save. Return to session detail. Confirm the re-derived report reflects the updated answer.

### 9. Browser smoke (Jason verifies)

- Load Jason0429's saved session.
- Click into Answers.
- For each question type, edit one answer:
  - Ranking: change Q-S1's order (Knowledge → 2nd instead of 1st, observe the Compass top shift in the re-rendered report).
  - Freeform: change Q-I1's text and observe the Keystone Reflection update.
  - Multiselect: uncheck one of Q-I3's marked stakes and observe the cost-bearing read shift.
  - Single-pick: change Q-P2 and observe the pressure-block signal change.
- Confirm the report re-renders with the updated values.

---

## Acceptance

- `app/admin/sessions/[id]/answers/page.tsx` (or sub-route equivalent) lists all questions and the user's current answers.
- Each of the five question types has a working editor.
- `lib/saveSession.ts` exports `updateSessionAnswer`.
- The API/server action persists answer updates to the session record.
- The session detail page links to the answers view.
- Updated answers cause re-derivation when the session detail page re-renders.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- `git diff --stat` shows changes only in admin / API / persistence files.

---

## Out of scope

- **User-facing answer-update interface.** This CC is admin-only. Future user-facing equivalent reuses the editor components but adds account-based access control.
- **Demographics editing.** Different schema, different UI; separate CC if needed.
- **Question-text editing.** Admin can change a user's *answer*, not the question definition itself.
- **Bulk answer editing across sessions.** Per-session-per-question only.
- **Answer history / audit trail.** When an admin updates an answer, the previous value is overwritten. No version history. Future CC if needed.
- **Validation of answer shape against question definition.** v1 trusts the editor UI to produce well-formed answers. Future CC if validation issues surface.
- **Re-running the engine on save and persisting the new `inner_constitution` snapshot.** Per CODEX-050's pattern, the admin view re-derives on each load; saved snapshot is not updated. Keeping this consistent.
- **Showing a diff of what changed in the re-derived report.** Possibly useful, but heavier UI. Future CC.
- **Authentication / authorization changes.** Admin route inherits existing gating.
- **Rate limiting / undo.** v1 admin-only; trusting admin not to spam updates.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

This is a CC- (Claude Code) prompt because the per-question-type editor UI involves real judgment calls about visual register, interaction patterns, and component organization. Codex could execute it, but the UI design weighs toward Claude Code.

## Execution Directive

Single pass. The five per-type editors are the load-bearing components — keep them small and focused. The locked behavior (admin loads → sees answers → edits → re-derives) is non-negotiable; the visual / interaction details have latitude. **Move prompt to `prompts/completed/` when shipped.**

## Bash Commands Authorized

- `ls app/admin/sessions/`
- `cat app/admin/sessions/[id]/page.tsx`
- `grep -rn "loadSession\|saveSession\|persistSession\|inner_constitution" lib/ app/`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke; kill before exiting)
- `mv prompts/active/CC-053-admin-answer-review-edit.md prompts/completed/CC-053-admin-answer-review-edit.md`
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`
- `app/admin/sessions/[id]/page.tsx` (post-CODEX-050 form)
- `lib/saveSession.ts` (or wherever session persistence lives)
- `lib/types.ts` `Answer` types (ranking / freeform / multiselect / forced; verify the union shape)
- `data/questions.ts` (full read; understand question types and item shapes)
- `prompts/completed/CODEX-050-admin-session-rerender.md` for the live-engine render context this CC builds on.
- `app/components/Ranking.tsx`, `app/components/SinglePickPicker.tsx`, `app/components/MultiSelectDerived.tsx`, etc. (existing user-facing components — do not modify, but reading them informs the admin-side editor design).

## Allowed to Modify

- `app/admin/sessions/[id]/answers/page.tsx` (new)
- `app/admin/sessions/[id]/answers/*.tsx` (new — per-type editors)
- `app/api/admin/sessions/[id]/answers/route.ts` (new — or server action equivalent)
- `lib/saveSession.ts`
- `app/admin/sessions/[id]/page.tsx` (only to add the link to answers view)

**No other files.** No engine logic, no canon docs, no user-facing surface, no question definitions.

## Report Back

1. **Route structure choice** — sub-route (Option A) or in-page tab (Option B), with one-line justification.
2. **Files modified or created** with line counts.
3. **Per-type editor inventory** — confirm all five question types have working editors with concrete UI patterns described.
4. **`updateSessionAnswer` shape** — paste the function signature and a short note on persistence-layer compatibility.
5. **Verification results** — tsc, lint, build. Confirm `npm run build` exits 0.
6. **Manual sweep** — confirmation that one answer per type was edited successfully and the re-derived report reflected the change.
7. **Out-of-scope drift caught**.
8. **Browser smoke deferred to Jason** — name the four answer-edit tests Jason will run on Jason0429's session.
9. **Future-user-facing-feature compatibility note** — flag whether the editor components can be reused for the eventual user-self-access feature, and what'd need to change if not.
10. **Prompt move-to-completed confirmation**.

---

## Notes for the executing engineer

- This is the foundation for an eventual user-facing answer-update feature (per the MVP product vision). Design the per-type editors to be reusable — minimize admin-specific assumptions, keep the props shape clean enough that swapping the API caller from admin to user-account would be a one-line change.
- The five question types come from the existing user-facing components (Ranking, SinglePickPicker, MultiSelectDerived, etc.). Don't reuse those components directly — they have user-flow assumptions baked in (progress tracking, second-pass logic, attachments). Build admin-specific editors that share the visual register but not the user-flow assumptions.
- The per-type editors should NOT validate against the question definition beyond shape correctness (e.g., a ranking editor produces a `RankingAnswer` with `order` field; doesn't check that the order's items are a complete permutation of `question.items`). Trust the UI to produce well-formed answers; engine handles missing/malformed gracefully.
- The "Updated [timestamp]" indicator after save is small but load-bearing for admin confidence — the admin should never wonder whether the save persisted.
- Pre-CC-053 saved sessions don't change shape; the existing `answers` array is the same structure. No migration needed.
- The visual register should make it obvious this is admin tooling, not the user's experience. Mono labels, ink-mute helper text, no animation, no progress indicators. The user-facing survey is meant to feel inviting; the admin editor is meant to feel utilitarian.
- Per CODEX-/CC- routing convention, the prompt file moves to `prompts/completed/` when shipped. Explicit reminder.
