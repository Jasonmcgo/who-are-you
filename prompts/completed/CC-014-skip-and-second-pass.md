# CC-014 — Skip Mechanism + Second-Pass with Single-Pick (V1)

## Goal

Add a skip-and-return ingress channel for users who can't or won't engage with the rigorous rank-flow on first pass. After CC-014, the running app at `localhost:3003`:

- Shows a **Skip** affordance on every question. When the user skips, the question is deferred and the user advances.
- Stores a **meta-signal** for each skip — flat fact ("user skipped Q-Tn"), no content interpretation, no impact on shape derivation.
- After the regular question flow ends and before the Inner Constitution renders, presents each skipped question in a **second-pass single-pick affordance**: same prompt, four options shown with concrete-moment examples, user picks one. Skip is **not** available in second-pass — selection is required.
- Emits the **picked option's signal** at rank 1 / strength `high`. Non-picked options emit nothing — no negative inference, no aggregation, no assumption about what the user "would have ranked second."
- Examples are authored only for **Q-T1 through Q-T8** (the high-friction Temperament card, eight questions × four voices = 32 example strings). Q-S1, Q-S2, Q-X3, Q-X4, Q-C4 reuse their existing label + gloss text in single-pick mode (the values themselves are already concrete).

This is a V1 implementation. Out of scope: an always-on rank-or-pick toggle from the start (a V1.5 enhancement that would let users pick the example channel without first skipping). Out of scope also: any engine-driven request for a "second pick" within the same question. V1 is single-pick per skipped question, no follow-ups. Engine accepts the rank-1 signal and produces whatever output it can; if some tensions don't fire because the user heavily skipped, that's honest.

The skip feature came from real user feedback: Michele had a rough time with Q-T's voice quotes, and the project's product principle is *"add other channels for different users, don't replace the rigorous flow."*

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

This CC touches `app/page.tsx` substantially (skip state, second-pass loop, integration), adds two new components (`SinglePickPicker.tsx`, `SecondPassPage.tsx`), modifies `QuestionShell.tsx` to surface a Skip affordance, modifies `lib/types.ts` (new types for meta-signal + skip state + single-pick answer), modifies `lib/identityEngine.ts` (handle single-pick answers, register meta-signals), and adds 32 example strings to a new file or to `data/questions.ts` items. Per-edit approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff`, `awk`, `sed`, `head`, `tail`, `wc`.

The agent should not pause to ask permission for these.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input.

If something is genuinely ambiguous, apply the most spec-faithful interpretation and flag the decision in Risks / next-step recommendations. Do not halt.

If a prerequisite appears missing, attempt the canon-faithful equivalent, record the discrepancy, and continue.

---

## Read First (Required)

**Canon (read; do not edit any canon file):**

- `docs/canon/shape-framework.md` — § Five Dangers to Avoid is binding on every renderer-authored example string.
- `docs/canon/temperament-framework.md` — § 3 cognitive function descriptions. The 32 example strings should preserve the canonical character of each function (Ni / Ne / Si / Se / Ti / Te / Fi / Fe) without becoming cartoonish per § 8 / § 7.5 of `design-spec-v2.md`.
- `docs/canon/question-bank-v1.md` — current Q-T1 through Q-T8 entries. The example strings extend (do not modify) what's already there.
- `docs/canon/inner-constitution.md` — § Output Rules. The renderer-authored example strings are user-visible content; they must respect the same hedging vocabulary as engine-generated prose.
- `docs/temperament-voice-draft-v1.md` — the source of the existing Q-T voice quotes. Use as anchor for the new examples; each example expands on the voice it's an example of.

**Reference (do not edit):**

- `docs/design-prototype/components.jsx` — the design lab's prototype. Useful for understanding how `RankingA` / `RankingB` / `RankingC` and `QuestionPage` were structured. The prototype does NOT include a skip mechanism — CC-014 is genuinely new feature work, not a translation. But the prototype's button styling, kicker treatment, and visual rhythm inform CC-014's UI choices.
- `docs/design-prototype/styles.css` — token + class reference.
- `docs/design-prototype/design.md` — canonical spec (byte-identical to `docs/design-spec-v2.md`).
- `docs/design-prototype/LAB-README.md` — the lab's framing of the handoff.
- `docs/design-spec-v2.md` — § 6 ranking primitive, § 8 question shell, § 11 tone and language rules. The single-pick affordance in second-pass should respect the same tone and visual register.

**Existing code (read; will be edited):**

- `app/page.tsx` — question flow logic. Will be extended with skip state, second-pass loop, and integration with `SecondPassPage`.
- `app/components/QuestionShell.tsx` — adds Skip affordance to the footer (small text link, not equal-button, per § D-2 below).
- `lib/types.ts` — new types per § D-1.
- `lib/identityEngine.ts` — new answer-handling for single-pick + meta-signal registration.

**Existing code (do NOT edit):**

- `app/components/Ranking.tsx`, `app/components/ProgressIndicator.tsx`, `app/components/ShapeCard.tsx`, `app/components/TensionCard.tsx`, `app/components/MbtiDisclosure.tsx`, `app/components/InnerConstitutionPage.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts` *content of existing question entries* — may extend with example strings per § D-7 but do not modify any existing field.
- Any `docs/canon/*.md` file. CC-014 is a code-only CC. The example strings live in code, not in canon.
- `lib/identityEngine.ts` engine functions other than as listed in § Allowed to Modify. Specifically: do not modify any derivation rule, tension detection block, or aggregation helper.

---

## Context

The skip feature serves three product goals named in conversation with the user (Jason):

1. **"Don't lose users to clinical language."** A user who can't engage with Q-T's voice quotes shouldn't have their entire result rendered thin or unfinished. The skip-then-pick path lets them complete the assessment with reduced cognitive load.
2. **"The skip itself is a signal."** A user skipping a question carries information — they couldn't engage, didn't have patience, or the question was poorly framed for them. CC-014 captures this as a meta-signal but does NOT interpret content from it (per § D-3).
3. **"Don't replace the rigorous flow — add channels."** The default path stays rank-flow. Skip is an escape-hatch, not a parallel channel. Users who want the rigor get it; users who don't get a usable alternate.

The reference for the simpler-channel concept is **AcuMax Index** (acumaxindex.com), where users circle resonant words and keep only the closest matches. AcuMax succeeds at extracting useful signal from minimal cognitive engagement. CC-014's second-pass single-pick is a smaller version of that pattern: pick the resonant option, ignore the rest.

V1 explicitly limits the example-based affordance to second-pass-after-skip. An always-on alternate channel (rank OR pick from the start) is V1.5 work. Reasoning: prove the skip-and-return mechanism first; expand to always-on if the example channel proves valuable.

---

## Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Type system additions

Add to `lib/types.ts`:

```ts
// Meta-signal — engagement data, not content data
export type MetaSignalType = "question_skipped" | "question_double_skipped";

export type MetaSignal = {
  type: MetaSignalType;
  question_id: string;
  card_id: CardId;
  recorded_at: number;  // Date.now() at skip time
};

// Single-pick answer (for second-pass)
export type SinglePickAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "single_pick";
  picked_id: RankingItemId;       // ID of the option the user picked
  picked_signal: SignalId;        // signal mapped to that pick
};

// Extend Answer union
export type Answer = ForcedFreeformAnswer | RankingAnswer | SinglePickAnswer;

// Extend InnerConstitution with meta-signals
export type InnerConstitution = {
  // existing fields preserved verbatim
  ...
  meta_signals: MetaSignal[];   // NEW — engagement data, not derivation input
};
```

The `meta_signals` array is collected during the session and surfaced for analytics-style use. It does NOT feed any per-card derivation, any tension detection, any cross-card synthesis. It's data for product evolution, not for Inner Constitution rendering.

### D-2: Skip button placement and visual treatment

Add a Skip affordance to `app/components/QuestionShell.tsx`. **Visual treatment: small mono caps text link below the Continue button**, not an equal-weight footer button. This signals that skip is an escape hatch for moments when the question doesn't fit, not a parallel channel that competes with ranking.

Specs:

- Position: below the Continue button on the right side of the footer, not in the same row.
- Typography: JetBrains Mono caps, 10px, tracking +0.12em, `var(--ink-mute)` resting, `var(--umber)` on hover.
- Text: `skip — i'll come back to this`.
- Hidden by default in any non-first-pass mode (e.g., second-pass and the Inner Constitution result page must NOT show a Skip affordance).
- Accessibility: button element with `aria-label="Skip this question; we'll come back with examples"`, focus-visible umber outline per the existing `data-focus-ring` pattern.

The placement and styling can be adjusted to fit visual rhythm; the constraint is that Skip must be visibly secondary to Continue. If a small text link below Continue feels visually awkward, an alternative placement is *to the left of Back* — but never on equal visual footing with Continue.

### D-3: Skip emits meta-signal only — no content interpretation

When the user skips a question, the system records a `MetaSignal { type: "question_skipped", question_id, card_id, recorded_at }` and advances. The skip does NOT emit any content signal (no `Signal` entry in `signals[]`). The engine's per-card derivation, tension detection, and cross-card synthesis are unaffected by skipped questions — they simply have less data to work with.

This is honest: a user who skipped Q-T1 may have skipped because the voice quotes felt clinical, because they were tired, or because the question didn't apply. The system doesn't try to infer which reason applied. The meta-signal records the fact.

### D-4: Second-pass loop integration in `app/page.tsx`

After the regular question flow ends (last question answered or skipped), check if `skippedQuestionIds.length > 0`. If yes, enter second-pass mode:

```ts
// pseudocode
if (current >= questions.length - 1 && skippedQuestionIds.length > 0) {
  // Enter second-pass loop
  setMode("secondPass");
  setSecondPassIndex(0);
}
```

The `secondPass` mode renders `<SecondPassPage>` (see § D-5) showing each skipped question one at a time. After all skipped questions have a single-pick answer, set `showResult(true)` and proceed to the Inner Constitution.

State additions to `app/page.tsx`:

- `skippedQuestionIds: string[]` — set populated as the user skips questions during first pass.
- `mode: "first_pass" | "second_pass"` — controls which view renders. Inferred from current state if explicit field is awkward.
- `secondPassIndex: number` — current position in the second-pass loop.
- `metaSignals: MetaSignal[]` — accumulated for the InnerConstitution.

### D-5: `SecondPassPage` component

Create `app/components/SecondPassPage.tsx`. Renders:

- A page header announcing the second-pass: mono caps `WE'RE COMING BACK TO A FEW`, serif italic subtitle *"You skipped these earlier. Here's a simpler version — pick the option that feels closest, or marks 'closest' even if it's imperfect."* (Approximate wording; agent may polish.)
- A small progress indicator showing position in the second-pass loop (e.g., `2 of 4` mono caps).
- The current skipped question's prompt (serif body, same treatment as first-pass).
- The `<SinglePickPicker>` component (see § D-6) for selecting one option.
- A Continue button (footer). **No Skip button.**

When the user picks an option and clicks Continue, the engine receives a `SinglePickAnswer`, the `secondPassIndex` advances. After the last skipped question, `showResult(true)` is called.

### D-6: `SinglePickPicker` component

Create `app/components/SinglePickPicker.tsx`. Renders the four options (or however many the original question had) as vertically stacked option cards. Each card shows:

- The option label (e.g., `Voice A` for Q-T, `Government` for Q-X3).
- The option's gloss (the existing `gloss` field) OR the option's example string (only for Q-T questions where examples are authored — see § D-7).
- For Q-T questions: both the voice-quote (italic serif) AND the concrete-moment example below it (regular serif), so the user has both the canonical voice and a plain-English illustration.
- A radio-like selection indicator (umber-filled circle when selected, `var(--rule)` outline when not).

Interaction:

- Click a card to select it. Single selection only — selecting a different card deselects the previous.
- Continue button is disabled until a selection is made.
- Keyboard: Tab moves focus through cards; Space or Enter selects the focused card.
- Selected state visual treatment: umber-wash background, umber outline (matches `Ranking.tsx` active state).

The `SinglePickPicker` returns the selected option ID via `onChange(pickedId: string)`. Parent (`SecondPassPage`) handles the conversion to `SinglePickAnswer` and advancement.

### D-7: Example strings for Q-T questions

Author 32 plain-English concrete-moment examples — one per Q-T option (8 questions × 4 voices). Each example is one sentence, anchored in an everyday situation, that illustrates the cognitive function the voice represents.

**Authoring guide:**

- Plain English, no jargon, no MBTI-speak.
- Match the function's character per `temperament-framework.md` § 3 without being cartoonish per `design-spec-v2.md` § 7.5.
- Anchor in everyday situations: meetings, conversations, decisions, plans, problems, relationships.
- One sentence each. Natural prose voice, not bullet-style.
- The example sits below the canonical voice quote in the second-pass UI; together they should give the user enough to recognize themselves.

**Examples for Q-T1 ("When you're working on a hard problem,") — illustrative only; agent authors final text:**

- Voice A (Ni): *"When reading a long argument, I notice the underlying logic of where it's going before the words finish."*
- Voice B (Ne): *"I leave a meeting with three new angles to explore before lunch is over."*
- Voice C (Si): *"Before deciding, I check what's worked before in similar situations and trust the precedent."*
- Voice D (Se): *"I'd rather start working and see what surfaces than plan extensively in advance."*

These are first-draft sketches. The agent should author final text that feels native to each function and reads as one specific moment, not abstract description.

**Storage location.** Add an `example` field to each Q-T item in `data/questions.ts`:

```ts
items: [
  {
    id: "ni",
    label: "Voice A",
    voice: "Voice A",
    quote: "Once I see how the pieces are going to land, the rest is mostly execution. I'm looking for the pattern that would explain everything else.",
    example: "When reading a long argument, I notice the underlying logic of where it's going before the words finish.",
    signal: "ni",
  },
  // ...
]
```

Add `example?: string` to `RankingItem` in `lib/types.ts` (optional field, only populated for Q-T questions in V1).

### D-8: Engine handling of single-pick answers

In `lib/identityEngine.ts`, add a new function `signalFromSinglePick(answer: SinglePickAnswer): Signal`. Returns one Signal:

- `signal_id` = the picked option's `signal`
- `description` = `SIGNAL_DESCRIPTIONS[signal_id]` lookup, fallback to humanized signal_id
- `from_card` = answer's `card_id`
- `source_question_ids` = `[answer.question_id]`
- `strength` = `"high"`
- `rank` = `1`

Update `deriveSignals(answers: Answer[])` to dispatch single-pick answers to `signalFromSinglePick`.

The single Signal emitted contributes to per-card derivation as a partial-rank signal at rank 1 — the same way a ranking question's first item contributes. Engine derivation, tension detection, and cross-card synthesis treat it identically to a rank-1 ranking signal.

### D-9: Skip flow stops short of full meta-signal exposure in v1

The `meta_signals: MetaSignal[]` array is populated in the InnerConstitution but is NOT rendered in the user-facing Inner Constitution document in V1. The Inner Constitution renderer (`InnerConstitutionPage.tsx`) reads only the existing fields. Meta-signals are stored for potential future use (analytics, product evolution, V1.5 features that surface skip patterns) but don't surface to the user as an output.

The renderer is unchanged in CC-014. Only the engine and the question flow change.

### D-10: First-pass + second-pass cannot interleave

The user skips during first pass, advances through all questions, hits the end, enters second-pass mode for skipped questions. Once in second-pass, the user CANNOT return to first-pass. They cannot skip in second-pass (per D-5 — Skip button is hidden). They must pick.

If the user wants to revisit any question, they use the existing Back button in QuestionShell — but Back during second-pass returns to the previous skipped question's single-pick screen, not to the first-pass for that question.

There is no "edit your earlier rankings after seeing the result" affordance in V1. That's V2 territory.

### D-11: Out-of-scope explicit list

To prevent drift, V1 of CC-014 does NOT include any of:

- Always-on rank-or-pick toggle from the start of every question.
- Engine-driven request for a "second pick" within the same skipped question (e.g., picking Government → engine asks for runner-up). Single pick, period.
- Examples for Q-S1, Q-S2, Q-X3, Q-X4, Q-C4 second-pass screens (those questions reuse existing label + gloss in single-pick).
- Render of meta-signals in the Inner Constitution.
- Persistence of skip state across sessions.
- Analytics or telemetry endpoints (those would be Postgres-era work).
- Skip button in second-pass.
- A `confidence` field on `SinglePickAnswer` (single-pick is always strength `high` per D-8).
- A "leave as fully skipped, accept thinner output" affordance (per Q-D-10, second-pass requires selection).
- New canon files or canon edits.
- New tensions or signals.

### D-12: Five Dangers compliance for new strings

Every renderer-authored string introduced by CC-014 (Skip button text, second-pass page header, second-pass subtitle, the 32 Q-T example sentences) must respect `shape-framework.md` § Five Dangers:

1. No "you are [type]" framings.
2. No stress-as-revelation language.
3. No moralizing on trust, values, or contact profiles.
4. No clinical implication.
5. No type-label headlines.

The example sentences in particular must read as *plain-English moments*, not as diagnostic prose.

---

## Requirements

### 1. Add types per § D-1 to `lib/types.ts`

`MetaSignal`, `MetaSignalType`, `SinglePickAnswer`. Extend `Answer` union. Extend `RankingItem` with optional `example?: string`. Extend `InnerConstitution` with `meta_signals: MetaSignal[]`. All existing types preserved verbatim.

### 2. Update `app/components/QuestionShell.tsx`

Add Skip affordance per § D-2. Skip button visible only in first-pass mode (controlled by a new prop `mode: "first_pass" | "second_pass"`, defaulting to `"first_pass"`).

When the user clicks Skip, call a new `onSkip` callback prop that the parent (`app/page.tsx`) handles by recording a meta-signal and advancing.

### 3. Create `app/components/SinglePickPicker.tsx`

Per § D-6. Single-selection affordance with cards stacked vertically. Returns picked option ID via `onChange`.

### 4. Create `app/components/SecondPassPage.tsx`

Per § D-5. Top-level component that wraps `QuestionShell` (in second-pass mode) with `SinglePickPicker` as the body widget. Iterates through `skippedQuestionIds`. Calls `onComplete` when the last skipped question is answered.

### 5. Update `app/page.tsx`

- Add state: `skippedQuestionIds: string[]`, `metaSignals: MetaSignal[]`, `secondPassIndex: number`, plus mode-derivation logic.
- On Skip during first-pass: append to `skippedQuestionIds`, append to `metaSignals`, advance to next question.
- On end of first-pass: if `skippedQuestionIds.length > 0`, enter second-pass loop. Else proceed to result.
- On end of second-pass loop: enter result mode.
- Mount `<SecondPassPage>` when in second-pass mode.
- Pass `metaSignals` array through to `buildInnerConstitution` if needed (or merge in via a wrapper).

The question-flow logic for first-pass otherwise stays identical to its CC-012 / CC-D shape.

### 6. Update `lib/identityEngine.ts`

- Add `signalFromSinglePick` per § D-8.
- Update `deriveSignals` to dispatch `SinglePickAnswer` entries.
- Update `buildInnerConstitution` to accept and forward `metaSignals` into the returned `InnerConstitution`. Signature may need to extend: `buildInnerConstitution(answers: Answer[], metaSignals?: MetaSignal[])`.
- No other engine changes. Per-card derivation, tension detection, cross-card synthesis all unchanged.

### 7. Author 32 example strings for Q-T questions

Per § D-7. Add `example` field to each item in Q-T1 through Q-T8 in `data/questions.ts`. Each example is one sentence, plain English, concrete moment, function-faithful.

The agent should write the examples directly. No canon edit; the strings live in code.

### 8. Author renderer strings per § D-5 and § D-2

- Skip button text: `skip — i'll come back to this` (or agent-polished alternative).
- Second-pass page header: `WE'RE COMING BACK TO A FEW` (or agent-polished alternative).
- Second-pass subtitle: per § D-5 spec, agent polishes.

All renderer strings respect § D-12.

### 9. Type-check, lint, and verify

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.
- Manual smoke test in a browser at `localhost:3003`:
  - Question flow renders normally.
  - Skip button appears below Continue, mono caps, ink-mute.
  - Clicking Skip on Q-T1 advances to Q-T2.
  - At end of regular flow, second-pass page appears for the skipped Q-T1.
  - Second-pass UI shows four voice options with quote + example below each.
  - No Skip button visible in second-pass.
  - Selecting an option enables Continue; clicking Continue advances second-pass index.
  - After all second-pass questions are answered, Inner Constitution renders normally.
  - The InnerConstitution object includes `meta_signals` array with one entry per skipped question.
  - The picked option emits a content signal at rank 1 / strength high; non-picked emit nothing.

If browser smoke testing is performed by the user instead of the agent, the agent must clearly state in report-back that browser testing was deferred.

---

## Allowed to Modify

**Code:**

- `lib/types.ts` — add new types per § D-1; preserve all existing types.
- `lib/identityEngine.ts` — add `signalFromSinglePick`, update `deriveSignals` dispatch, update `buildInnerConstitution` signature per § D-8 / § 6. Preserve all other functions and constants verbatim.
- `app/page.tsx` — extend state and flow per § D-4 / § 5. Preserve question-flow logic for first-pass (state shape, `submitResponse`, `handleContinue`, etc. otherwise unchanged).
- `app/components/QuestionShell.tsx` — add Skip affordance per § D-2.
- `app/components/SinglePickPicker.tsx` — NEW.
- `app/components/SecondPassPage.tsx` — NEW.
- `data/questions.ts` — extend Q-T items with `example` field. Do NOT modify any other field on any question.

Do **NOT** modify:

- Any `docs/canon/*.md` file.
- Any other file under `docs/`.
- `app/components/Ranking.tsx`, `app/components/ProgressIndicator.tsx`, `app/components/ShapeCard.tsx`, `app/components/TensionCard.tsx`, `app/components/MbtiDisclosure.tsx`, `app/components/InnerConstitutionPage.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts` entries other than the Q-T item extensions.
- `lib/identityEngine.ts` engine functions other than `signalFromSinglePick`, `deriveSignals` dispatch, and `buildInnerConstitution` signature. Specifically: `signalFromAnswer`, `signalsFromRankingAnswer`, `extractFreeformSignals`, `detectTensions`, `applyStrengtheners`, `deriveCoreOrientation`, `deriveSacredValues`, `aggregateLensStack`, all per-card derivation functions, all cross-card synthesis functions, `toAnswer`, `toRankingAnswer`, `strengthForRank`, `has`, `hasFromQuestion`, `hasAtRank`, `cardFor`, `ref`, all `SIGNAL_DESCRIPTIONS`, `SACRED_PRIORITY_SIGNAL_IDS`, `STRENGTHENERS`, `STACK_TABLE`, `MBTI_LOOKUP` — all preserved verbatim.
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`, `postcss.config.mjs`.

---

## Out of Scope

Per § D-11. Reproduced for emphasis: no always-on toggle, no second-pick-within-question, no examples for non-Q-T questions, no meta-signal rendering in the Inner Constitution, no persistence, no telemetry, no skip-in-second-pass, no canon edits, no new tensions, no new signals (other than the existing ones being emitted by single-pick answers).

---

## Acceptance Criteria

1. `lib/types.ts` declares `MetaSignal`, `MetaSignalType`, `SinglePickAnswer`. `Answer` union extended. `RankingItem` extended with optional `example?: string`. `InnerConstitution` extended with `meta_signals: MetaSignal[]`. All existing types preserved verbatim.
2. `app/components/QuestionShell.tsx` shows a Skip affordance in first-pass mode per § D-2; hidden in second-pass mode.
3. `app/components/SinglePickPicker.tsx` exists per § D-6.
4. `app/components/SecondPassPage.tsx` exists per § D-5.
5. `app/page.tsx` integrates skip + second-pass flow per § D-4 / § 5. First-pass logic unchanged.
6. `lib/identityEngine.ts` has `signalFromSinglePick`, dispatches single-pick answers, accepts and forwards `metaSignals`. All other functions byte-identical.
7. `data/questions.ts` Q-T1–Q-T8 items each have an `example` field. 32 example strings authored. Other questions unchanged.
8. Manual smoke test passes per § 9.
9. `npx tsc --noEmit` passes cleanly.
10. `npm run lint` passes cleanly.
11. No file outside the Allowed to Modify list has been edited.
12. No canon file is touched.
13. No tension detection rule, derivation function, or cross-card synthesis function is modified.
14. The Inner Constitution renderer (`InnerConstitutionPage.tsx`) is unchanged. Meta-signals are stored on the constitution but not displayed.
15. Skip is visible only in first-pass; second-pass requires selection.
16. Single-pick answer emits one signal at rank 1 / strength high; non-picked options emit nothing.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description. Note new components.
2. **Type system additions** — quote new types from `lib/types.ts` verbatim. Confirm existing types preserved.
3. **Skip affordance** — show the QuestionShell footer-region update. Quote the Skip button JSX + click handler. Confirm it's visible only in first-pass.
4. **Meta-signal flow** — quote the skip handler in `app/page.tsx` showing how meta-signals are recorded.
5. **Second-pass page** — quote the `SecondPassPage` component structure (header, picker mount, footer). Show the loop logic.
6. **SinglePickPicker** — quote the component code. Confirm single-selection, keyboard support, selected-state visual treatment.
7. **Engine extension** — quote `signalFromSinglePick` and the updated `deriveSignals` dispatch and `buildInnerConstitution` signature.
8. **Example strings** — quote one full Q-T entry's items with all four examples (Q-T1 is fine). Confirm all 32 example strings authored. Confirm Five Dangers compliance for the renderer-authored prose.
9. **Smoke-test results** — confirm the full skip → second-pass → result flow works end-to-end. If browser testing was deferred, say so.
10. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
11. **Scope-creep check** — explicit confirmation that:
    - No canon file was modified.
    - No engine logic beyond what's authorized was changed.
    - No new tensions or signals were authored (existing signals are emitted by single-pick).
    - No always-on rank-or-pick toggle was added.
    - No second-pick affordance within a single question was added.
    - No examples for non-Q-T questions.
    - InnerConstitutionPage.tsx is unchanged.
    - First-pass question flow logic is byte-identical.
12. **Risks / next-step recommendations** — anything that surfaced. Specifically:
    - Whether the example strings produced for Q-T felt natural or forced. Authoring 32 short concrete-moment sentences in canon-faithful voice is non-trivial; flag any that read as cartoonish.
    - Whether the second-pass UX feels obvious to a first-time user, or whether onboarding microcopy is needed.
    - Whether the meta-signal storage feels useful as-is, or whether a follow-up CC should add a small admin-style display for product-evolution analytics.
    - Whether the V1 limitation (single-pick only, no second-pick) produces acceptably-thin Lens stack derivation for users who heavily skip Q-T, or whether the engine should request a second pick for Q-T questions specifically.
    - Whether the always-on alternate (V1.5 deferred) should be promoted given anything observed during implementation.
    - Any other observation worth surfacing.
