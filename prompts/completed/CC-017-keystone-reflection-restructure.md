# CC-017 — Keystone Reflection Restructure (Q-I block)

## Launch Directive

You are executing CC-017. This CC redesigns the Keystone Reflection block (Q-I1 / Q-I2 / Q-I3) from a freeform belief stress-test with heuristic text-mining into an **anchor + cross-card structured stress-test**. Q-I1 stays as a freeform anchor whose content the engine no longer analyzes. Q-I2 and Q-I3 become structured multi-select questions that consume the user's already-ranked Trust card and Compass card data and ask which trust drivers could change their mind and which sacred drivers they'd risk losing for the belief. A new conditional question Q-I1b fires only when Q-I1 is skipped, with a softer threshold and no skip option.

The architectural shift: the engine moves from text-mining (weak signal, fragile) to cross-card evidence (strong signal, structurally rich). This is the canonical instance of the matrix-model insight — *the relationship of the user's answers across cards generates richer signal than any single answer's content* — applied to belief-under-tension reading.

This CC is sequenced after CC-016b (which shipped) and before the v2 Coherence Engine (CC-018+). It is independent of CC-016c (Q-T item-order shuffle) and v2.5 (Universal-Three Restructuring); they may land in any order. Note: the v2 memo previously informally allocated CC-017 to the Interpretive Evidence Layer; that work bumps to CC-018+ since this Keystone redesign came up first in real-user testing.

## Bash Authorized

Yes. Use the shell freely for `tsc`, `eslint`, dev-server smoke runs, and inspection scripts. Do not commit or push.

## Execution Directive

### Item 1 — Q-I1 becomes belief anchor; preserve the four catalog signals

**Current state.** Q-I1 in `data/questions.ts` is a freeform question whose content is text-mined by `extractFreeformSignals` in `lib/identityEngine.ts` to emit `independent_thought_signal` (when text contains "disagree" or "people around me"). The same function emits `epistemic_flexibility` and `conviction_under_cost` / `cost_awareness` from text-mining Q-I2 and Q-I3 respectively.

**Target state.** Q-I1 stays freeform, same question text ("What is something you believe that most people around you disagree with?"), still skippable. The text is stored as the user's **belief anchor** and surfaced visibly at the top of Q-I2 and Q-I3 so the user can see the belief they're stress-testing.

**The four catalog signals continue to fire from Q-I1 content.** This is a deliberate preservation decision. The four signals (`independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness`) capture broad-abstraction observations (the user has independent beliefs, expresses flexibility-related language, has experienced cost) that are not replaced by the structured Q-I2 / Q-I3 data. They are a "v0" of belief-content extraction; when a future LLM-substitution path eventually lands (per the v2 memo's data-boundary rules in `llm-substitution-rules.md`), richer extraction can enrich rather than replace into a void. Preserving the four signals keeps continuity in the data across the v0 → v1 transition.

**Implementation.** No change required to `extractFreeformSignals` itself. The function continues to text-mine freeform content using the existing string-match heuristics. Because Q-I2 and Q-I3 transition from `freeform` to `multiselect_derived` (Items 3 and 4), the dispatcher in `deriveSignals` (`if (a.type === "freeform") { out.push(...extractFreeformSignals(a)); }`) automatically routes only Q-I1's freeform answer through this path. Q-I2 and Q-I3 go through the new `multiselect_derived` dispatch branch (Item 8) and never reach `extractFreeformSignals`. No source-id gating needed; the type-based dispatch is the entire mechanism.

**Signal library status.** All four signals (`independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness`) stay `implementation_status: active`. Their `produced_by_questions` field updates to reflect the new reality: `[Q-I1]` only (since Q-I2 and Q-I3 are no longer freeform). No deprecation entries.

**Distinguishing this from Item 5 (BeliefUnderTension simplification).** The four catalog signals (`independent_thought_signal` etc.) are produced by `extractFreeformSignals` and live in the `Signal[]` array — they're a different abstraction layer from the `BeliefUnderTension` object produced by `analyzeBeliefSubmission`. The two functions are independent; one stays heuristic (Item 1), the other moves to structured-source (Item 5). Both run on the same Q-I1 freeform content, but they produce different shapes for different consumers.

### Item 2 — Q-I1b conditional follow-up

**New question.** Q-I1b renders only when Q-I1 was skipped (i.e., when the answers array contains a `question_skipped` MetaSignal for `Q-I1`).

- `question_id`: `Q-I1b`
- `card_id`: `conviction`
- `type`: `freeform`
- `text`: `"Ok, maybe not most. How about a belief that at least half the people around you disagree with?"`

**Skippability.** Q-I1b is **not skippable**. The Skip button must not render on Q-I1b. The primary action (Continue) is disabled until the user enters non-empty text. This is the only non-skippable question in the bank; document the constraint in canon.

**Render predicate.** Q-I1b renders if-and-only-if Q-I1 has been skipped (meta-signal present) or Q-I1 has not been answered. If Q-I1 was answered with non-empty text, Q-I1b is hidden entirely and the question flow advances directly past it. Implement via a render-predicate the question dispatcher checks before showing the question.

**Storage.** Q-I1b's text gets stored as the belief anchor when Q-I1 was skipped. Q-I2 and Q-I3 read the anchor from whichever of Q-I1 or Q-I1b was answered.

**Implementation note for skip routing.** Q-I1's existing skip handler emits the `question_skipped` MetaSignal as today (CC-014 behavior preserved). The render predicate then advances to Q-I1b on the next render pass. No special skip-handler logic for Q-I1 — the conditional render predicate is the entire mechanism.

**Q-I1b skip handling.** The Skip button does not render on Q-I1b. If somehow it did fire (e.g., keyboard event), the handler should be a no-op. The user must answer Q-I1b to proceed. This is the deliberate "quiet pressure" — the half-the-people threshold is broad enough that anyone who can introspect can name something, and the engine treats inability-to-name as itself a meta-signal (separately, via the existing `question_skipped` MetaSignal which never fires on Q-I1b but which fires on Q-I1 in the cascade case where the user skipped both — see Item 7).

### Item 3 — Q-I2 restructured

**Current state.** Q-I2 is freeform: *"What would change your mind about that belief?"* Text-mined for `epistemic_flexibility`.

**Target state.** Q-I2 becomes a **multi-select check-all-that-apply** question with items dynamically derived from the user's Trust card answers (Q-X3 institutional + Q-X4 personal).

- `question_id`: `Q-I2`
- `card_id`: `conviction`
- `type`: `multiselect_derived` (new — see Item 6)
- `text`: `"What or who could change your mind about this belief?"`
- `helper`: `"Check all that apply. The model reads which trust sources have power over this belief."`
- `derived_from`: `["Q-X3", "Q-X4"]`
- `derived_top_n_per_source`: `3` (top 3 from each of Q-X3 and Q-X4 = 6 items)
- `none_option`: `{ id: "none", label: "None of these" }`
- `other_option`: `{ id: "other", label: "Other (please specify)", allows_text: true }`

**Belief anchor display.** Above the question, render the user's belief anchor verbatim in a quoted-callout style: *"Looking at the belief you named: '[anchor text]'"*. This is a UI affordance, not a signal — it lets the user see the belief while answering.

**Mutual exclusion rules.** "None of these" is mutually exclusive with the six derived items and with "Other." Selecting "None" clears any other selections; selecting any other clears "None." "Other" is compatible with the six derived items; the user can check several derived items plus "Other" with a freeform addendum.

**Cascade-skip.** If neither Q-X3 nor Q-X4 has been answered (no parent data exists for either source), Q-I2 cascade-skips with a `derived_question_skipped` MetaSignal — same pattern as CC-016's Q-S3-cross / Q-E1-cross when parents lack data. If exactly one of Q-X3 / Q-X4 has been answered, Q-I2 renders with whatever items are available (3 instead of 6).

### Item 4 — Q-I3 restructured

**Current state.** Q-I3 is freeform: *"Have you ever paid a cost — social, professional, or personal — for holding a belief? What happened?"* Text-mined for `conviction_under_cost` and `cost_awareness`.

**Target state.** Q-I3 becomes the parallel multi-select against the Compass card.

- `question_id`: `Q-I3`
- `card_id`: `pressure` (preserve the existing card_id assignment from canon)
- `type`: `multiselect_derived`
- `text`: `"What would you risk losing for this belief?"`
- `helper`: `"Check all that apply. The model reads which sacred drivers you'd risk for this belief."`
- `derived_from`: `["Q-S1", "Q-S2"]`
- `derived_top_n_per_source`: `3` (top 3 from each = 6 items)
- `none_option`: `{ id: "none", label: "None of these" }`
- `other_option`: `{ id: "other", label: "Other (please specify)", allows_text: true }`

**Belief anchor display, mutual exclusion, cascade-skip.** Same patterns as Q-I2.

### Item 5 — BeliefUnderTension extraction simplified

**Current state.** `lib/beliefHeuristics.ts` `analyzeBeliefSubmission` extracts a five-dimension `BeliefUnderTension` object: `value_domain`, `disagreement_context`, `conviction_temperature`, `social_cost`, `epistemic_posture`, plus per-tag confidence flags. All five are heuristic text-mined from the freeform Q-I1 / Q-I2 / Q-I3 content.

**Target state.** `BeliefUnderTension` simplifies to **three structured-source dimensions**:

- `value_domain` — derived from Q-I3 selections. The dominant sacred-value cluster the user marked as at-risk. If multiple sacred values selected with similar weight, pick the user's top-1 from their Q-S1/Q-S2 ranking among the selected set. If "None of these" selected, `value_domain: "unknown"`.
- `epistemic_posture` — derived from Q-I2. *None of these* selected → `rigid`. 1-2 trust drivers selected → `reflective`. 3+ trust drivers selected → `open`. Plus `guarded` if the user's Q-X4 selections include "Own counsel" only.
- `conviction_temperature` — derived from Q-I2 + Q-I3 combined cardinality. Q-I2 *None* + Q-I3 with multiple selections → `high` (impervious-but-cost-bearing — held against the world for real cost). Q-I2 with selections + Q-I3 *None* → `low` (revisable, low cost). Q-I2 with selections + Q-I3 with selections → `moderate` (revisable but cost-aware). Q-I2 *None* + Q-I3 *None* → `unknown` (held but no articulated cost or revision path; engine surfaces this as a meta-pattern, not as confidence).

**Drop:** `disagreement_context`, `social_cost`, and all five per-tag confidence flags. The structured source means confidence is implicit (`high` for all three remaining dimensions when both Q-I2 and Q-I3 were answered; `medium` when one cascade-skipped; `unknown` when both cascade-skipped).

**Type updates in `lib/types.ts`.**

```ts
export type BeliefUnderTension = {
  belief_text: string;                          // from Q-I1 or Q-I1b
  belief_source_question_id: "Q-I1" | "Q-I1b";  // which one provided the anchor
  value_domain: ValueDomain;                    // derived from Q-I3
  conviction_temperature: ConvictionTemperature;// derived from Q-I2 + Q-I3
  epistemic_posture: EpistemicPosture;          // derived from Q-I2
  // NOT included: disagreement_context, social_cost, *_user_confirmed, *_confident
};
```

The `ValueDomain`, `ConvictionTemperature`, `EpistemicPosture` enums stay; `DisagreementContext` and `SocialCost` enums get deleted.

**Keystone confirmation panel.** The CC-015c confirmation panel (`KeystoneReflection.tsx`) currently renders five tag rows (Yes / Different / Skip per tag). It now renders three tag rows. The "Different" dropdown options for `value_domain` (Truth / Freedom / Loyalty / etc.) stay; the dropdown options for `disagreement_context` and `social_cost` get deleted.

### Item 6 — New question type: `multiselect_derived`

**Type definitions in `lib/types.ts`.**

```ts
export type MultiSelectDerivedQuestion = {
  question_id: string;
  card_id: CardId;
  type: "multiselect_derived";
  derived_from: string[];                                  // parent question_ids
  derived_top_n_per_source?: number;                       // defaults to 3
  text: string;
  helper?: string;
  none_option?: { id: string; label: string };
  other_option?: { id: string; label: string; allows_text?: boolean };
};

export type Question =
  | ForcedFreeformQuestion
  | RankingQuestion
  | DerivedRankingQuestion
  | MultiSelectDerivedQuestion;

export type MultiSelectDerivedAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "multiselect_derived";
  selections: {
    id: string;
    signal: SignalId | null;        // null for "none" and "other"
    source_question_id?: string;    // the parent question_id for derived items
  }[];
  none_selected: boolean;
  other_text?: string;              // present iff "other" was selected with allows_text
};

export type Answer =
  | ForcedFreeformAnswer
  | RankingAnswer
  | RankingDerivedAnswer
  | MultiSelectDerivedAnswer
  | SinglePickAnswer;
```

**Conditional-render predicate field on `ForcedFreeformQuestion`** (used by Q-I1b):

```ts
export type ForcedFreeformQuestion = {
  // ... existing fields preserved ...
  render_if_skipped?: string;       // question_id; renders only if that question was skipped
  unskippable?: boolean;             // when true, Skip button does not render and Continue requires non-empty content
};
```

### Item 7 — Cascade and skip semantics

Three cases the dispatcher must handle correctly:

**Case A — Q-I1 answered.** Q-I1b is hidden via `render_if_skipped` predicate. Belief anchor = Q-I1 text. Q-I2 and Q-I3 render normally with the anchor displayed.

**Case B — Q-I1 skipped, Q-I1b answered.** Q-I1b renders (predicate satisfies). User must enter non-empty text (unskippable). Belief anchor = Q-I1b text. Q-I2 and Q-I3 render normally.

**Case C — Q-I1 skipped, Q-I1b not answered (the user closes the browser, etc.).** The session is incomplete; engine treats this as a degenerate case. If the user reaches Q-I2 / Q-I3 without an anchor (which should not be possible via the UI given Q-I1b is unskippable, but is a defensive case), Q-I2 and Q-I3 cascade-skip. The Mirror's Keystone Reflection section renders as: *"You did not name a belief in this session. The model leaves space for that — what you'd say here is your own."* (Add this fallback line to `result-writing-canon.md`.)

**Q-I2 / Q-I3 individual skip.** Even when an anchor exists, the user can still skip Q-I2 or Q-I3 individually via the existing CC-014 Skip pathway. Skipping one does not skip the other. Skipping Q-I2 means the engine has no `epistemic_posture` data; skipping Q-I3 means no `value_domain` data. The BeliefUnderTension shape handles missing data gracefully (mark dimensions `unknown`, render abbreviated prose).

### Item 8 — Signal extraction

New function `signalsFromMultiSelectDerived(answer: MultiSelectDerivedAnswer): Signal[]` in `lib/identityEngine.ts`. Each derived selection emits a signal at strength `medium` carrying:

- `signal_id`: the original signal_id from the source question's item (e.g., `government_trust_priority` if user selected the Government item that derived from Q-X3).
- `source_question_ids`: `[source_question_id, answer.question_id]` (preserves provenance, parallel to the CC-016 cross-rank pattern).
- `from_card`: `answer.card_id`.
- A new field `multiselect_derived?: { question_id: string; selected: true }` to mark the signal as "consumed in a multi-select belief stress-test." Or reuse an existing meta-tracking shape — your call. Surface in report.

**None-of-these MetaSignals.**

- Q-I2 with `none_selected: true` → emit MetaSignal `belief_impervious` (new).
- Q-I3 with `none_selected: true` → emit MetaSignal `belief_no_cost_named` (new).

These two new MetaSignal types should be added to the `MetaSignalType` union in `lib/types.ts`.

**Other-text handling.** When `other_text` is non-empty, store it as a freeform field on the answer but do **not** text-mine it for signals. It exists for the user; the engine treats it as commentary, not data. This preserves the architectural commitment that the engine moves away from text-mining.

**Signal extraction dispatch.** In `deriveSignals`, add:

```ts
if (a.type === "multiselect_derived") {
  out.push(...signalsFromMultiSelectDerived(a));
  continue;
}
```

### Item 9 — Renderer

**New component:** `app/components/MultiSelectDerived.tsx`. Renders:

1. **Belief anchor block** at the top — the user's belief text in a quoted callout style, with subtle styling that visually separates it from the question.
2. **Question text** and **helper**.
3. **Six derived items** as labeled checkboxes. Each item shows the human label from the source question (e.g., "Government" from Q-X3, "Family" from Q-X4 personal-trust position).
4. **"None of these"** as a separately-styled checkbox below the six, mutually exclusive with them.
5. **"Other (please specify)"** as a checkbox; when selected, reveal a small freeform input.

Styling should follow the existing visual language (font-mono helper, font-serif question text, the same checkbox treatment used in any other multi-select surface — if none exists yet, author one consistent with the project's design tokens).

**Page integration.** `app/page.tsx` adds a render branch for `question.type === "multiselect_derived"`, which:

- Computes the derived items from the parent answers (re-use or generalize the `deriveItemsForCrossRank` helper from CC-016 — refactor into `deriveItemsForCrossUse` or similar that handles both rank-derived and multiselect-derived; same shape).
- Cascade-skips when no parent has data (same `queueMicrotask` pattern as CC-016's derived-ranking cascade-skip).
- Surfaces the belief anchor by reading the answer to Q-I1 (or Q-I1b if Q-I1 was skipped) and passing the anchor text as a prop to `MultiSelectDerived`.
- On Continue, builds a `MultiSelectDerivedAnswer` with the user's selections and `none_selected` / `other_text` fields populated.

**Continue affordance.** `multiselect_derived` questions render the existing **Continue** button (not Accept — Accept was specifically for rankings per CC-016b). `canContinue` is true when at least one option is selected (any derived item, or "None of these," or "Other" with non-empty text).

**Q-I1b unskippable rendering.** `QuestionShell` reads the new `unskippable` flag from the question and hides the Skip button when set. The existing `skipVisible` predicate becomes:

```ts
const skipVisible = mode === "first_pass" && typeof onSkip === "function" && !question.unskippable;
```

Pass the question's `unskippable` flag through the `QuestionShell` props (small new prop).

### Item 10 — Mirror prose update

`lib/beliefHeuristics.ts` `generateBeliefContextProse` simplifies to consume the three-dimension shape:

- Drop the `contextLine` and `costLine` functions and their callers in `generateBeliefContextProse`.
- Update `valueOpener`, `temperatureLine`, and `postureLine` to handle the structured source — confidence is now implicit, not heuristic, so the *"the wording suggests"* hedging should shift to *"your selections place this belief inside …"* style language. Each line gets a small rewording to reflect the new source.
- The existing closing line (*"The model does not judge whether this belief is correct. The model only sees the role it plays in your shape — and the role appears to be load-bearing."*) is a protected line per `result-writing-canon.md`; preserve verbatim.

The Mirror's Keystone Reflection section renders **shorter** under this redesign — three dimensions instead of five, and structured-source confidence means less hedging language. That is intentional and an improvement.

**Fallback prose for Case C** (no anchor): a single short line per Item 7's fallback. Add as a new `noAnchorLine()` helper in `beliefHeuristics.ts`, called when `belief.belief_text` is empty.

### Item 11 — Canon updates

**`docs/canon/question-bank-v1.md`:**

- Replace the existing Q-I1 / Q-I2 / Q-I3 entries with the new shapes. Q-I1 entry text unchanged; trailing note updated to clarify "anchor only — content not signal-extracted." Q-I2 and Q-I3 entries fully rewritten to the multiselect_derived shape with the new question text, helper, derived_from, derived_top_n_per_source, none_option, and other_option.
- Add a new Q-I1b entry between Q-I1 and Q-I2 with the conditional-render and unskippable flags.
- Update the Keystone Reflection block intro to reflect the anchor + cross-card stress-test architecture: *"The Keystone Reflection is the canonical instance of cross-card belief evaluation. Q-I1 (or Q-I1b on skip) anchors a belief; Q-I2 reads which trust sources could revise it; Q-I3 reads which sacred drivers the user would risk for it. Q-I2 and Q-I3 derive their items from the user's already-ranked Trust and Compass card answers; the engine reads the user's belief through their own pre-named portfolio rather than through text-mining the answer content."*

**`docs/canon/signal-library.md`:**

- The four signals (`independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness`) **stay active** per Item 1's preservation decision. Update each entry's `produced_by_questions` field to `[Q-I1]` (drop Q-I2 / Q-I3 since those questions are no longer freeform). Add a trailing note on each entry: *"Heuristic extraction from Q-I1 freeform content (CC-017). Preserved for v0 → v1 LLM-substitution continuity per CC-017 § Item 1."* No status change. No count change.
- Add `belief_impervious` and `belief_no_cost_named` as new MetaSignal entries (or in the appropriate meta-section if one exists).

**`docs/canon/result-writing-canon.md`:**

- Document the BeliefUnderTension simplification: three structured-source dimensions, two retired heuristic dimensions.
- Add the Case C fallback line.
- Preserve the existing protected lines (no edits).

**New canon file (optional but recommended):** `docs/canon/keystone-reflection-rules.md`. Captures the architectural pattern in 5–8 short rules: anchor-only Q-I1; conditional unskippable Q-I1b on Q-I1 skip; cross-card derivation for Q-I2 / Q-I3; structured-source dimensions only; non-text-mined other-text; mutual-exclusion semantics for None-of-these; cascade-skip when parents lack data.

## Allowed-to-Modify

- `data/questions.ts` — replace Q-I2 and Q-I3 entries; add Q-I1b entry; Q-I1 entry stays byte-identical except possibly an inline comment.
- `lib/types.ts` — add `MultiSelectDerivedQuestion` / `MultiSelectDerivedAnswer` types; add `unskippable?` and `render_if_skipped?` fields to `ForcedFreeformQuestion`; simplify `BeliefUnderTension`; delete `DisagreementContext` and `SocialCost` enums; add `belief_impervious` and `belief_no_cost_named` to `MetaSignalType`; extend `Answer` and `Question` unions.
- `lib/identityEngine.ts` — `extractFreeformSignals` stays unchanged in body; the type-based dispatch in `deriveSignals` automatically routes only Q-I1 freeform answers through it (Q-I2 / Q-I3 are no longer freeform). Add `signalsFromMultiSelectDerived` and dispatch; update or generalize `deriveItemsForCrossRank` to support multi-select derivations; refactor BeliefUnderTension construction in `buildInnerConstitution` to read from structured Q-I2/Q-I3 selections rather than from heuristic text-mining (the two surfaces are independent — `extractFreeformSignals` produces the four catalog signals; the BeliefUnderTension construction is a separate path).
- `lib/beliefHeuristics.ts` — simplify `analyzeBeliefSubmission` to produce the three-dimension shape from structured selections (delete the text-mining heuristics for `disagreement_context` and `social_cost`); update `generateBeliefContextProse` to consume the simplified shape; delete `contextLine` and `costLine`; reword `valueOpener` / `temperatureLine` / `postureLine` for structured-source language; add `noAnchorLine()` for Case C fallback.
- `app/components/MultiSelectDerived.tsx` — new component (per Item 9 spec).
- `app/components/KeystoneReflection.tsx` — drop the two retired tag rows (`disagreement_context`, `social_cost`); preserve the three remaining tag rows; delete the corresponding option lists (`CONTEXT_OPTIONS`, `COST_OPTIONS`).
- `app/components/QuestionShell.tsx` — accept a new `unskippable?: boolean` prop; gate `skipVisible` on `!question.unskippable`.
- `app/page.tsx` — add render branch for `multiselect_derived`; cascade-skip logic for derived multi-select; conditional-render logic for Q-I1b based on Q-I1 skip status; pass the belief anchor to `MultiSelectDerived`; pass `unskippable` flag to `QuestionShell` when applicable.
- `docs/canon/question-bank-v1.md` — replace Q-I2 / Q-I3 entries; add Q-I1b entry; update Keystone Reflection intro.
- `docs/canon/signal-library.md` — deprecate four signals; add two new MetaSignal entries; update counts.
- `docs/canon/result-writing-canon.md` — document the simplification + Case C fallback.
- `docs/canon/keystone-reflection-rules.md` — new file (per Item 11).

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify Q-I1 question text. The text *"What is something you believe that most people around you disagree with?"* stays exactly as-is in canon and in `data/questions.ts`.
- **Do not** modify any other question (Q-S, Q-X, Q-T, Q-A, Q-C, Q-P, Q-F, Q-S3, Q-E1, including their items, glosses, and signal mappings).
- **Do not** modify the existing `Ranking.tsx`, `MirrorSection.tsx`, `InnerConstitutionPage.tsx`, `MapSection.tsx`, `PathExpanded.tsx`, `ShapeCard.tsx`, `TensionCard.tsx`, `ProgressIndicator.tsx`, `MbtiDisclosure.tsx`, `SinglePickPicker.tsx`, `SecondPassPage.tsx`. Read-only.
- **Do not** modify the per-card derivation functions (`deriveCompassOutput`, `deriveConvictionOutput`, etc.) beyond what's strictly necessary for the BeliefUnderTension shape change. Specifically: the `deriveConvictionOutput` function consumes BeliefUnderTension; update its consumption to match the simplified shape, but do not change any other logic in that function.
- **Do not** modify the Mirror's section structure. The Keystone Reflection section continues to exist; only its prose generator simplifies.
- **Do not** modify any T-001 through T-015 detection block. Read-only.
- **Do not** modify any existing signal definition's `description`, `produced_by_questions`, `used_by_tensions`, or `rank_aware` fields except for the four deprecation status updates spelled out in Item 11.
- **Do not** introduce the v2 Coherence Engine's `InterpretiveEvidence` type, `kind` taxonomy, or `rendering_posture` field. That's CC-018+ work.
- **Do not** introduce LLM substitution, persistence, or cross-card pattern library work.
- **Do not** touch CC-014 second-pass mechanism. The Q-I1 → Q-I1b pathway is a NEW conditional render mechanism, distinct from second-pass.
- **Do not** modify CC-016 cascade-skip logic for ranking_derived questions. The new cascade-skip for multiselect_derived may share helper code (`deriveItemsForCrossUse` refactor), but the existing ranking_derived cascade-skip behavior must remain identical.
- **Do not** modify the Accept/Skip affordance on rankings (CC-016b). `multiselect_derived` uses Continue; rankings continue to use Accept.
- **Do not** modify build configuration files (`eslint.config.mjs`, `tsconfig.json`, `package.json`).
- **Do not** modify AGENTS.md, CLAUDE.md, README, or any prompt file other than this one.
- **Do not** text-mine the `other_text` freeform field on multiselect_derived answers. Other-text is for the user; the engine treats it as commentary, not data. This is a deliberate architectural commitment.

## Acceptance Criteria

1. **Q-I1 unchanged in question text and skippability.** The four catalog signals (`independent_thought_signal` / `epistemic_flexibility` / `conviction_under_cost` / `cost_awareness`) **continue to fire from Q-I1 freeform content** via `extractFreeformSignals`. Verify with a smoke session where the user types *"I disagree with everyone about evidence and proof, this has cost me my job"* into Q-I1 — all four signals should appear in the resulting `Signal[]` with `source_question_ids: ["Q-I1"]`. Verify the same signals do NOT appear from Q-I2 or Q-I3 (since those questions are now `multiselect_derived` and never route through `extractFreeformSignals`).
2. **Q-I1b renders only when Q-I1 was skipped.** Verify: session A (Q-I1 answered) → Q-I1b not seen, advances to Q-I2. Session B (Q-I1 skipped) → Q-I1b renders, Skip button does NOT render, Continue is disabled until non-empty text entered.
3. **Q-I2 renders 6 derived items + None + Other** when both Q-X3 and Q-X4 have been answered. Verify the 6 items match the user's top-3 from each parent ranking.
4. **Q-I3 renders 6 derived items + None + Other** when both Q-S1 and Q-S2 have been answered. Verify the 6 items match the user's top-3 from each parent.
5. **Mutual exclusion** — clicking "None of these" clears any other selections; clicking any derived item clears "None." Clicking "Other" alongside derived items is permitted.
6. **Cascade-skip** when no parent data exists for either of Q-I2's parents (Q-X3 and Q-X4 both skipped or unanswered). Same for Q-I3 with Q-S1 and Q-S2.
7. **Belief anchor displayed** above Q-I2 and Q-I3 when an anchor exists (from either Q-I1 or Q-I1b).
8. **`BeliefUnderTension` has three dimensions.** Verify by inspecting the `InnerConstitution.belief_under_tension` field — should contain `belief_text`, `belief_source_question_id`, `value_domain`, `conviction_temperature`, `epistemic_posture`. Should NOT contain `disagreement_context`, `social_cost`, or any `*_user_confirmed` / `*_confident` fields.
9. **`epistemic_posture` derives correctly.** Smoke: Q-I2 with "None of these" → `posture: "rigid"`. Q-I2 with 1-2 selections → `posture: "reflective"`. Q-I2 with 3+ selections → `posture: "open"`. Q-I2 with only "Own counsel" (and no other selections) → `posture: "guarded"`.
10. **`conviction_temperature` derives correctly** from Q-I2 + Q-I3 combined cardinality per Item 5 spec.
11. **`value_domain` derives correctly** from Q-I3 selections per Item 5 spec.
12. **`belief_impervious` MetaSignal emitted** when Q-I2's `none_selected: true`. **`belief_no_cost_named`** emitted when Q-I3's `none_selected: true`.
13. **Other-text not text-mined.** Verify by entering rich freeform into a Q-I2 "Other" — none of the deprecated signals appear.
14. **Mirror's Keystone Reflection section renders** with the simplified three-dimension prose. Verify visually or by reading `generateBeliefContextProse` output for a session with all three dimensions populated.
15. **Case C fallback prose renders** for a session with Q-I1 and Q-I1b both unanswered (Q-I1b unanswered should not be reachable through normal UI flow given the unskippable constraint, but the engine must handle the degenerate case). The Mirror's Keystone section should show the *"You did not name a belief in this session"* line.
16. **Keystone Confirmation panel renders 3 tag rows** (down from 5). The two retired tag rows do not render.
17. **CC-016 cascade-skip behavior unchanged** for Q-S3-cross / Q-E1-cross. The new multiselect_derived cascade-skip does not break the existing ranking_derived cascade-skip.
18. **CC-016b Accept/Skip behavior unchanged** for ranking questions. The 19 ranking + ranking_derived questions still show Accept; the new `multiselect_derived` shows Continue.
19. **TSC clean.** `npx tsc --noEmit` exits 0 with no output.
20. **Lint clean.** `npm run lint` exits 0 with no warnings.
21. **No file outside the Allowed-to-Modify list is modified.**

## Report Back

1. **Files changed** — file-by-file diff summary, each with a one-line description of the change.
2. **Q-I1 catalog-signal preservation verification** — confirm all four catalog signals (`independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness`) continue to fire from Q-I1 freeform content via the existing string-match heuristics. Confirm they do NOT fire from Q-I2 / Q-I3 (which are no longer freeform). Paste two smoke sessions' `Signal[]` outputs as evidence: one where Q-I1 contains all four trigger phrases (all four signals fire), one where Q-I1 contains none of them (no catalog signals fire from Q-I).
3. **Q-I1b conditional render verification** — confirm both Case A (Q-I1 answered) and Case B (Q-I1 skipped → Q-I1b shown, no Skip button, unskippable) work. Walk through the dispatcher logic in the report.
4. **Q-I2 / Q-I3 multi-select verification** — paste the rendered item lists for one smoke session showing top-3 from each parent.
5. **BeliefUnderTension shape verification** — paste a sample `InnerConstitution.belief_under_tension` JSON for a session with all three dimensions populated. Confirm only the three new dimensions are present.
6. **Per-dimension derivation smoke** — five sets covering: rigid posture (None in Q-I2), reflective (1-2 in Q-I2), open (3+ in Q-I2), guarded (Own counsel only in Q-I2), unknown (None in both). Paste the resulting BeliefUnderTension dimension values for each.
7. **MetaSignal emission verification** — confirm `belief_impervious` and `belief_no_cost_named` fire under the right conditions.
8. **Mirror prose verification** — paste the rendered `generateBeliefContextProse` output for one session and confirm the prose works without the dropped dimensions.
9. **Case C fallback verification** — paste the no-anchor prose.
10. **Keystone confirmation panel verification** — confirm 3 tag rows render, not 5.
11. **CC-016 / CC-016b regression check** — confirm ranking_derived cascade-skip still works (run a CC-016 smoke for Q-S3-cross with no parent data); confirm ranking questions still show Accept (run any ranking question through the renderer).
12. **TSC + lint** — paste exit codes.
13. **Scope-creep check** — confirm only files on the Allowed-to-Modify list were modified; confirm none of the "do not" items were touched.
14. **Risks / next-step recommendations** — anything you noticed during the work that warrants a follow-up CC.

## Notes for the executing engineer

- The cascade-skip pattern for `multiselect_derived` is structurally identical to CC-016's `ranking_derived` cascade-skip. Refactor the helper into a shared form (`deriveItemsForCrossUse` or similar) and reuse — do not duplicate the logic. Both consumers should call the same helper.
- The belief anchor display above Q-I2 / Q-I3 is the highest-uncertainty visual element. If the styling treatment isn't obvious from the existing design tokens, surface in the report and Jason will give it a UX pass post-CC.
- Q-I1b's unskippable constraint is the only non-skippable question in the bank. Document this clearly in the new `keystone-reflection-rules.md` so future CCs don't accidentally remove the constraint thinking it's a bug.
- The `analyzeBeliefSubmission` simplification is the largest piece of behavioral-code-deletion in this CC. Be careful with the test surface — the Keystone confirmation panel's "Different" dropdowns for `value_domain` continue to work and the prose generator continues to render coherently for all combinations of structured-source dimensions.
- The `*_user_confirmed` and `*_confident` fields are deleted because the structured source means confidence is implicit. Future v2 work (CC-018+) will introduce a richer `rendering_posture` field on the Interpretive Evidence layer that captures the same idea more cleanly. For now, the simplification is correct.
- Browser smoke is deferred to Jason. Your smoke testing should cover: signal extraction (no deprecated signals from Q-I sources), Q-I1b conditional render path, multi-select item derivation, mutual exclusion semantics, cascade-skip, BeliefUnderTension structured-source derivation, MetaSignal emissions for None-of-these, Mirror prose generation across all three-dimension combinations, and the no-anchor fallback. UX/visual verification is Jason's.
