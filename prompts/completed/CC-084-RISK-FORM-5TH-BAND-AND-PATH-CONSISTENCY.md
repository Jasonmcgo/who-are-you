# CC-084 — Risk Form 5th Band + Path Card Consistency

## Objective

Two engine routing changes in one tight CC, no calibration math:

1. **Wire the "Lightly Governed Movement" 5th band** in the Risk Form classifier per `feedback_lightly_governed_movement_rename.md`. Aim 40–60 + low Grip (composed Grip below the §13 floor or just above) should route to this label, not "Ungoverned Movement." Today, Michele (Aim 57, composed Grip 30.6) and Ashley (Aim 60, composed Grip 23.5) both read "Ungoverned" — neither one's motion is actually ungoverned; both have Aim doing real work.

2. **Fix the Path card's hardcoded "Open-Handed Aim" reference.** Today the Path card's prose says "Your Risk Form reads as Open-Handed Aim — the governor is doing its work" regardless of what the Movement section's classifier actually output. Michele and Ashley's reports contradict themselves: Movement section says "Ungoverned"; Path card says "Open-Handed." The Path card text must read the actual classifier output (which after Item 1 will include the new 5th-band label).

## Sequencing

- **Can fire in PARALLEL with CC-087** (admin demographic edit — no file overlap).
- **Sequential with CC-085 and CC-086** — all three touch `lib/renderMirror.ts`.

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass. If the Risk Form 5-band canon definition in `feedback_lightly_governed_movement_rename.md` is ambiguous or absent, pause and report rather than inventing a threshold.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`
- `npx tsx scripts/cohortSweep.ts` (if it exists) or equivalent fixture-cohort render

Do NOT run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any build script that calls the LLM.

## Read First (Required)

1. `lib/riskForm.ts` — the classifier. Confirm current 4-band signature (Open-Handed Aim / White-Knuckled Aim / Ungoverned Movement / Free Movement or whatever the actual current labels are).
2. `lib/renderMirror.ts` — locate the Path card's Risk Form mention (`grep "Open-Handed Aim" lib/renderMirror.ts`). Confirm it's hardcoded vs read from classifier output.
3. `lib/identityEngine.ts` — confirm how `riskForm` result is threaded into the render path.
4. `feedback_lightly_governed_movement_rename.md` in the user's memory (Cowork chat memory file). If not accessible, the canon is: Aim 40–60 AND composed Grip below ~25 → Lightly Governed Movement. Aim ≥ 60 + low Grip stays Open-Handed Aim. Aim ≥ 60 + composed Grip ≥ ~40 → White-Knuckled Aim. Aim < 40 → Ungoverned Movement.
5. `tests/fixtures/cohort/` — pick 2-3 fixtures whose existing reports demonstrate the Michele/Ashley pattern (Aim ~50-60, Grip ~25-30) to use for smoke verification.

## Scope

### Item 1 — Add the 5th band to the classifier

Modify `lib/riskForm.ts` to add a `LightlyGovernedMovement` label (verify exact casing per existing convention). Routing rule: Aim 40–60 AND composed Grip in [20, 35] (verify thresholds via the canon doc; if unclear, pick conservative-but-canon-faithful values and document inline).

Update the prose text associated with the label: "Your Risk Form reads as Lightly Governed Movement: Aim is moderate, Grip is light. The governor is present but understated; movement is happening, just not strongly aimed yet."

### Item 2 — Fix Path card's hardcoded reference

In `lib/renderMirror.ts`, locate where the Path card text says "Your Risk Form reads as Open-Handed Aim". Replace that hardcoded reference with the actual classifier output (read from constitution.riskForm.letter or constitution.riskFormFromAim.letter, whichever is canon). The Path card's surrounding prose should adapt to whatever label was classified, not assert "the governor is doing its work" when the classifier said otherwise.

### Item 3 — Regression sweep

After Items 1+2, re-render the cohort fixtures. Verify:
- No fixture's Movement section + Path card contradict each other on Risk Form label
- At least 1-2 fixtures route to the new "Lightly Governed Movement" label
- Daniel's fixture still reads "White-Knuckled Aim" (regression anchor — his composed Grip 55 should keep him out of the new band)
- JasonDMcG's fixture still reads "Open-Handed Aim" (his composed Grip 30.6 + Aim 60.8 should NOT trip into Lightly Governed)

### Item 4 — Audit

New `tests/audit/riskForm5thBandAndPathConsistency.audit.ts` with assertions:
1. The new band label is exported from `lib/riskForm.ts`
2. The classifier produces the new label for a synthetic input (Aim 55, composedGrip 25)
3. Across the cohort fixtures, no Movement-section label contradicts the Path-card label
4. Daniel's fixture still reads White-Knuckled Aim
5. JasonDMcG's fixture still reads Open-Handed Aim

## Do NOT

- **Do NOT change any Grip calibration math.** The §13 amplifier, the composed Grip computation, the defensive Grip — untouched. This CC only re-routes existing values through a finer-grained band classifier.
- **Do NOT change any other Risk Form label text.** Open-Handed Aim / White-Knuckled Aim / Ungoverned Movement / Free Movement prose stays exactly as it is. Only the new 5th band gets new prose.
- **Do NOT touch any Wave 1 persistence file** (`lib/proseRewriteLlmServer.ts`, `lib/keystoneRewriteLlmServer.ts`, `lib/synthesis3LlmServer.ts`, `lib/gripTaxonomyLlmServer.ts`, `lib/launchPolishV3LlmServer.ts`, `lib/llmRewritesBundle.ts`, `lib/sessionLlmBundleStore.ts`, `lib/staleShape.ts`).
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** If the twoTier audit fails after the Risk Form change, that's expected (Risk Form text on the cohort fixtures will change for the routed sessions). Report it; don't refresh the baseline.
- **Do NOT touch any prose template outside the Risk Form / Path card scope.** Hands card, Lens card, "What this is good for" — out of scope here (CC-086 owns those).
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No `@anthropic-ai/sdk`.
- **Do NOT commit or push.** Leave dirty for review.

## Allowed to Modify

- `lib/riskForm.ts`
- `lib/renderMirror.ts` (Path card section only — leave Hands/Lens/Compass/Movement-section etc. untouched)
- `lib/identityEngine.ts` (only if threading the new label requires it; ideally no edit)
- `lib/types.ts` (only if the union of RiskForm labels needs the new variant added)
- `tests/audit/riskForm5thBandAndPathConsistency.audit.ts` (new)
- `package.json` (add `audit:risk-form-5th-band` script)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Grip calibration math
- Soul / Goal / Aim math
- Prose templates outside Risk Form / Path card
- Engine version bumps
- Schema changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes (pre-existing PathExpanded.tsx warning OK)
3. `npx tsx tests/audit/riskForm5thBandAndPathConsistency.audit.ts` passes 5/5
4. Wave 1 audits still pass (`audit:llm-rewrites-persisted-on-session`, `audit:stale-shape-detector`, `audit:calibration-phase-1`)
5. Demographics audit still passes
6. Cohort fixture render: at least 1 fixture routes to the new "Lightly Governed Movement" label
7. Daniel's fixture still reads White-Knuckled Aim
8. JasonDMcG's fixture still reads Open-Handed Aim
9. No fixture has Movement-section / Path-card contradiction on Risk Form
10. Zero modifications to Wave 1 persistence files
11. Zero LLM calls
12. Zero cache file modifications
13. Zero commits

## Report Back

- The new band's threshold values + the canonical reference used to set them
- Which fixtures route to the new label (by filename)
- Confirmation Daniel + JasonDMcG didn't move (regression anchors)
- Which lines of `lib/renderMirror.ts` were changed for the Path card consistency fix
- Audit results (5/5 expected)
- Regression sweep: full audit count + any failures with one-line classification (pre-existing vs introduced)

## Notes for executor

- Estimated time: 30-45 min
- Cost: $0
- Pure routing/text change. No calibration. No engine math.
