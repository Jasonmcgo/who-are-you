# CC-004 — Freeform Activation (Strengthen-Only)

## Goal

Wire the freeform signal `conviction_under_cost` (emitted by Q-I3's keyword extractor in `lib/identityEngine.ts`) into the tension engine as a **strengthener** — not a trigger — of T-001 and T-002. When the user writes about belief cost AND structured answers have already fired T-001 or T-002, the engine raises those tensions' `confidence` from `medium` to `high` and the UI discloses the strengthening source (by question_id only, never by quoting the user's text).

Strict boundary: strengthening signals never cause a tension to fire on their own. Every tension's canonical firing rule (its `Signals:` block) remains untouched.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input. This prompt is self-contained.

If something is genuinely ambiguous, apply the most canon-faithful interpretation and flag the decision in the Risks / next-step recommendations section of the report-back — do not halt to ask.

If a prerequisite appears missing (a referenced file is absent, a check fails, a canon block has drifted since this prompt was written), attempt the canon-faithful equivalent, record the discrepancy in the report, and continue. Do not stop short.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

Canon:

- docs/canon/tension-library-v1.md
- docs/canon/signal-library.md
- docs/canon/signal-and-tension-model.md
- docs/canon/freeform-signal-extraction.md
- docs/canon/inner-constitution.md

Code:

- lib/types.ts
- lib/identityEngine.ts
- app/page.tsx
- data/questions.ts (read only; do not modify)

---

## Context

Per the CC-003 audit, all four freeform-extracted signals (`independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness`) are `unused` — the UI collects freeform input, the keyword extractor emits signals, but no tension consumes them. The freeform layer is the highest-leverage unlit part of the product: the user writes something meaningful and the system acknowledges the input without letting it change interpretation.

CC-004 is the first activation and is scoped deliberately small: **one freeform signal, two tensions, pure strengthen.** The architecture introduced here (canonical `Strengtheners:` declaration on tensions, engine strengthener pass after `detectTensions`, UI disclosure line) is designed so later CCs can add additional strengthener mappings without changing the engine or UI shape.

Strengthen-only (not Trigger) was chosen for three reasons:

1. The keyword extractor is literal substring matching (`text.includes("cost")` fires on "the cost of living"). Strengthen-only confines the false-positive blast radius to "a confidence bar moves," not "a tension appears unwarranted."
2. The deterministic spine stays intact: every tension still requires structured-signal evidence to fire. Freeform becomes corroborating weight, not primary evidence.
3. Smaller canon delta. No existing `Signals:` block changes; each strengthened tension just gains an additive `Strengtheners:` field.

---

## Design Invariants

1. **Strengthening never fires a tension.** If a tension was not already detected against the structured answers by its canonical `Signals:` rule, its strengtheners are ignored for that session.
2. **Confidence bump is binary.** `medium` → `high`. No new enum value. No additive accumulation across multiple strengtheners. A tension is either strengthened or not.
3. **Strengtheners are canonically declared.** The engine reads the mapping from a registry that mirrors the canonical `Strengtheners:` field in `tension-library-v1.md`. The engine does not invent strengthener mappings; canon is the source.
4. **UI discloses by question_id only.** Use the signal's `source_question_ids` to cite "your response to Q-I3." Never quote, paraphrase, or echo the user's written text.
5. **Strengthening is freeform-only in this CC.** Forced-choice signals are not eligible to strengthen tensions in CC-004. That door can open later; for now, `Strengtheners:` lists only freeform signals.

---

## Requirements

### 1. Canon — declare the strengthener mapping on T-001 and T-002

Edit `docs/canon/tension-library-v1.md`. Add a `Strengtheners:` block to T-001 and T-002 only. Position: immediately after `User Prompt:` and before the trailing `---`. Preserve every existing line verbatim.

Target state for T-001:

```
## T-001 Truth vs Belonging

Signals:
- truth_priority_high
- adapts_under_social_pressure

Description:
The user values truth, but may soften or withhold it when relationships are at risk.

User Prompt:
This pattern may be present: you value truth, but adapt when social cost is high. Does this feel accurate?

Strengtheners:
- conviction_under_cost — raises confidence when the user's freeform answer describes real cost paid for holding a belief.
```

Target state for T-002:

```
## T-002 Conviction vs Economic Security

Signals:
- truth_priority_high OR strong_independent_conviction
- adapts_under_economic_pressure OR hides_belief

Description:
The user may hold strong beliefs internally while limiting expression when financial security is at risk.

User Prompt:
This pattern may be present: your convictions may remain intact internally, but become more private when economic risk rises. Does this feel accurate?

Strengtheners:
- conviction_under_cost — raises confidence when the user's freeform answer describes real cost paid for holding a belief.
```

No other tension block receives a `Strengtheners:` field in CC-004.

### 2. Canon — document the semantic

Edit `docs/canon/signal-and-tension-model.md`. Append a new top-level section titled `## Strengtheners` at the end of the file. The section must cover all four of:

- What the `Strengtheners:` field means (raises confidence on a tension that was already detected by its canonical `Signals:` rule).
- The explicit invariant that strengtheners never fire tensions on their own.
- The binary confidence bump (`medium` → `high`), no additive semantics.
- Pointer to `signal-library.md` as the authoritative registry for each strengthener signal's metadata.

One short paragraph per point is sufficient. Do not modify the existing tension object schema or any other prose.

### 3. Canon — update signal-library.md

Edit `docs/canon/signal-library.md`:

a. **Promote `conviction_under_cost` to `active`.** Update its entry:
   - `implementation_status: active`
   - Add new field `strengthens_tensions: [T-001, T-002]`
   - `used_by_tensions:` remains `—` (strengthen is not trigger).
   - Update the notes field to describe the strengthening relationship and cite the `tension-library-v1.md` entries.

b. **Update the Per-Signal Entry Schema section.** Add `strengthens_tensions` as an optional field: "list of tension_ids this signal strengthens (not triggers); present only for strengthener signals."

c. **Update the Status Definitions section.** Expand `active`:
   `active — produced by at least one canonical question AND (used by at least one canonical tension OR declared as a strengthener of at least one canonical tension via a Strengtheners: field in tension-library-v1.md).`

d. **Update the Report counts.** Active signals: 24 → 25. Unused signals: 19 → 18. Total: 47 (unchanged). Adjust any summary lists accordingly: `conviction_under_cost` moves from the Unused Signals list to the Active Signals list.

e. **Do not modify any other signal entry, and do not renumber or reorder anything.**

### 4. Code — types

Edit `lib/types.ts`. Add one field to the `Tension` type:

- `strengthened_by: Signal[]` — defaults to `[]`; populated by the strengthener pass when applicable.

No other type changes. Do not modify existing field types or names.

### 5. Code — engine

Edit `lib/identityEngine.ts`.

a. **Declare the strengthener registry.** Immediately after the existing `SIGNAL_DESCRIPTIONS` constant, add a `STRENGTHENERS` constant whose keys are tension_ids and whose values are arrays of strengthener `SignalId`s. Mirror the canonical declarations from §1 exactly:

```ts
// Mirrors the `Strengtheners:` field declared in docs/canon/tension-library-v1.md.
// Only freeform signals are eligible in CC-004. See docs/canon/signal-and-tension-model.md § Strengtheners.
const STRENGTHENERS: Record<string, SignalId[]> = {
  "T-001": ["conviction_under_cost"],
  "T-002": ["conviction_under_cost"],
};
```

b. **Initialize `strengthened_by` on every pushed tension.** Every `tensions.push({...})` call inside `detectTensions` must include `strengthened_by: []`. This keeps type completeness without the strengthener pass having to reshape tensions post hoc.

c. **Add a strengthener pass.** Add a new exported function:

```ts
export function applyStrengtheners(tensions: Tension[], signals: Signal[]): Tension[]
```

Behavior, for each tension in `tensions`:
   - Look up strengtheners via `STRENGTHENERS[t.tension_id]`. If none declared, leave the tension unchanged.
   - For each declared strengthener signal_id, check `has(signals, id)`. Collect every matching signal object from `signals`.
   - If at least one strengthener is present: set `confidence: "high"` and `strengthened_by: [...matchingSignals]`. (Replace, not append — strengthened_by starts as [] from §5b.)
   - If no strengthener is present: leave `confidence` and `strengthened_by` unchanged.

The pass must NOT add tensions, remove tensions, or modify `status`, `user_prompt`, `description`, `signals_involved`, or `type`. Only `confidence` and `strengthened_by`.

d. **Wire the pass into `buildInnerConstitution`.** Call `applyStrengtheners(tensions, signals)` immediately after `detectTensions(signals)` and before the return statement. Assign the result back to `tensions`.

Do not modify any existing tension detection block. Do not modify `deriveSignals`, `extractFreeformSignals`, `deriveCoreOrientation`, `deriveSacredValues`, or `toAnswer`.

### 6. Code — UI

Edit `app/page.tsx`.

In the tension display block, when a tension's `strengthened_by.length > 0`, render one additional line immediately beneath the existing `user_prompt`. Content:

`Strengthened by your response to Q-I3.`

If `strengthened_by` contains signals from multiple distinct `source_question_ids`, list them inline: `Strengthened by your responses to Q-I3 and Q-I1.` (Only Q-I3 will appear in CC-004; handle the general case anyway.)

Do not quote, paraphrase, or echo the user's written text. Do not render the signal_id or the confidence value to the user. Visual treatment should be one short line in a subdued register below `user_prompt`; do not introduce new Tailwind colors or heavy styling.

### 7. Verification

Required checks:

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.

Required manual smoke tests via `npm run dev`:

- **7a — Strengthening occurs.** Answer Q-C1 = "Misunderstood but correct", Q-P1 = "Stay silent", Q-I3 = "I lost friends for telling the truth". Expected: T-001 appears in Possible Tensions with `confidence: "high"` and a "Strengthened by your response to Q-I3." line beneath its prompt. T-002 does NOT appear (no economic-pressure structured signals).
- **7b — Strengthening never fires a tension.** Answer Q-C1 = "Liked but slightly dishonest", Q-P1 = "Say it directly", Q-I3 = "I lost my job over this". Expected: T-001 does NOT appear (structured signals don't trigger it). `conviction_under_cost` is present as a derived signal but strengthens nothing because T-001 was not detected. No "Strengthened by..." line appears anywhere.
- **7c — No strengthening when freeform is empty.** Answer Q-C1 = "Misunderstood but correct", Q-P1 = "Stay silent", leave Q-I3 blank. Expected: T-001 appears with `confidence: "medium"` and no "Strengthened by..." line.
- **7d — Regression on structured tensions.** Confirm at least one of T-005, T-006, T-007, T-008, T-010, T-011 still fires from its existing triggers after the changes. Pick any one that can be produced with the forced questions and check.

---

## Allowed to Modify

- `docs/canon/tension-library-v1.md` (T-001 and T-002 blocks only; add `Strengtheners:` field per §1)
- `docs/canon/signal-and-tension-model.md` (append `## Strengtheners` section per §2; no edits elsewhere)
- `docs/canon/signal-library.md` (changes per §3 only)
- `lib/types.ts` (add `strengthened_by` to `Tension` per §4)
- `lib/identityEngine.ts` (strengthener registry + pass + wiring per §5)
- `app/page.tsx` (disclosure line per §6)

Do **not** modify:

- `docs/canon/question-bank-v1.md`
- `docs/canon/card-schema.md`
- `docs/canon/inner-constitution.md`
- `docs/canon/signal-mapping-rule.md`
- `docs/canon/foundational-system.md`
- `docs/canon/question-design-standard.md`
- `docs/canon/engine-building-blocks.md`
- `docs/canon/freeform-signal-extraction.md`
- `docs/canon/freeform-extraction-prompt.md`
- `data/questions.ts`
- any file in `prompts/`
- any other file in the repo

---

## Out of Scope

- Wiring `independent_thought_signal`, `epistemic_flexibility`, or `cost_awareness` into any tension. They remain `unused` after CC-004.
- Modifying the freeform keyword extractor in `lib/identityEngine.ts` (`extractFreeformSignals`). Its signal emissions are taken as-is.
- Implementing Q-C2, Q-C4, Q-P3 in `data/questions.ts`.
- Any change to structured-signal tension detection logic (Signals: blocks, detectTension function bodies for any existing tension).
- LLM or AI-based freeform extraction.
- localStorage or any persistence.
- Displaying user-written freeform text in the UI.
- New tension types.
- New signals.
- New questions.
- New confidence values beyond `low | medium | high`.
- Additive or counting confidence models. The bump is binary.
- Retroactively strengthening tensions from forced-question signals.
- Signal `strength` reinforcement (the hardcoded `"medium"` on Signal objects is unrelated to tension confidence and stays unchanged).
- Cross-card signal reinforcement.
- Any UI redesign beyond the single additional disclosure line.

---

## Acceptance Criteria

1. `docs/canon/tension-library-v1.md`: T-001 and T-002 each carry a `Strengtheners:` field positioned after `User Prompt:`, with the exact content in §1. No other tension block is modified.
2. `docs/canon/signal-and-tension-model.md`: a new `## Strengtheners` section is appended, covering all four points in §2. Existing prose and schemas are unchanged.
3. `docs/canon/signal-library.md`:
   a. `conviction_under_cost` has `implementation_status: active`, a new `strengthens_tensions: [T-001, T-002]` field, a `used_by_tensions: —` line (unchanged), and updated notes describing the strengthening relationship with line-level citations to `tension-library-v1.md`.
   b. The Per-Signal Entry Schema section lists `strengthens_tensions` as an optional field.
   c. The Status Definitions section's `active` clause includes the strengthener case per §3c.
   d. The Report counts read: active 25, pending 4, unused 18, deprecated 0, total 47. Summary lists reflect `conviction_under_cost`'s promotion.
   e. No other signal entry is modified.
4. `lib/types.ts`: `Tension` type has a new `strengthened_by: Signal[]` field. No other type is modified.
5. `lib/identityEngine.ts`:
   a. `STRENGTHENERS` constant exists and matches the canonical declarations in §1.
   b. Every `tensions.push({...})` inside `detectTensions` includes `strengthened_by: []`.
   c. `applyStrengtheners(tensions, signals)` is exported and behaves per §5c.
   d. `buildInnerConstitution` calls `applyStrengtheners` between `detectTensions` and the return.
   e. No existing detection block, no other exported function, is modified.
6. `app/page.tsx`: strengthened tensions render a single "Strengthened by your response to Q-Xn[ and Q-Xm]." line beneath the `user_prompt`. User-written text is not shown. No other UI change.
7. All four smoke tests in §7 produce the expected outcomes.
8. `npx tsc --noEmit` passes with no output.
9. `npm run lint` passes with no output beyond the script banner.
10. No file outside the Allowed to Modify list has been edited.
11. Test 7b explicitly confirms that strengthening did not fire a tension that structured signals alone would not have fired.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — one bullet per file.
2. **Canon deltas** — quote in full:
   - the final T-001 block after edit,
   - the final T-002 block after edit,
   - the appended `## Strengtheners` section in `signal-and-tension-model.md`,
   - the updated `conviction_under_cost` entry in `signal-library.md`.
3. **Code deltas** — show the `STRENGTHENERS` registry, the `applyStrengtheners` function body, and the one-line UI addition verbatim. Confirm no existing tension detection block was modified.
4. **Signal-library count changes** — before/after values for active, pending, unused, deprecated, total.
5. **Smoke-test results** — pass/fail for 7a, 7b, 7c, 7d with the exact answers used and the observed UI behavior for each.
6. **Checks** — output of `npx tsc --noEmit` and `npm run lint`.
7. **Scope-creep check** — explicit confirmation that:
   - no freeform signal other than `conviction_under_cost` was wired anywhere,
   - no tension other than T-001 and T-002 acquired a `Strengtheners:` field,
   - no existing `Signals:` / `Description:` / `User Prompt:` line on any tension was modified,
   - no change was made to `extractFreeformSignals` or `data/questions.ts`.
8. **Architectural extensibility** — one paragraph confirming (or denying) that adding `independent_thought_signal → T-003` as a strengthener in a future CC would require only (a) a canon edit to T-003's `Strengtheners:` field and (b) a one-line addition to the `STRENGTHENERS` registry. If any additional refactor would be needed, name it.
9. **Risks / next-step recommendations** — same format as prior CC reports.
