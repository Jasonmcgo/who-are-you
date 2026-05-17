# CC-093 — Aim Drag Rate Verification (Verify-First, Fix Only If Off-Canon)

## Objective

Per the trajectory-model canon (`feedback_trajectory_model_refinement_canon.md`, filed 2026-05-10), **Aim has dual function**:

1. **Tolerance cone** — Aim sets the tolerance fan width (`±9°, derived from Aim`). Visible in the trajectory chart legend. Confirmed rendered correctly.
2. **Light governor** — Aim contributes drag at **⅓ the rate of Grip**. The chart legend says: *"Faint line: potential trajectory before Grip drag + Aim governance."* Both contribute to pulling Usable below Potential.

This CC is **verify-first**: read the actual drag formula in `lib/movementLimiter.ts` (or wherever it lives) and confirm that Aim's contribution coefficient is **1/3 of Grip's coefficient**. If the math is on-canon, **report and close — no code change**. If it's off-canon, draft a small calibration fix as a follow-up CC and close this one with the diagnosis.

Per the gradient calibration canon: don't assume the math is right; verify the gradient. If Aim's drag contribution is currently 0 (Aim doesn't contribute drag at all) or full-rate (Aim contributes equally to Grip), the trajectory math is mis-calibrated relative to canon.

## Sequencing

- Parallel-safe with CC-088, CC-089, CC-090, CC-091, CC-094.
- Independent of all other CCs.

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Verify-first. Read the relevant code; trace the drag formula; confirm Aim's contribution rate; report the finding. If the math is correct, this CC ends after Item 2. If the math is off, this CC creates a follow-up CC draft and ends — does NOT apply the fix in this CC's run (calibration changes deserve their own scoped CC, not bundled into a verification pass).

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npx tsx tests/audit/<name>.audit.ts` for read-only check of existing audits

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `lib/movementLimiter.ts` — primary candidate for the drag formula. Look for `UsableMovementReading` computation, factors named like `gripDrag`, `aimGovernance`, drag coefficients.
2. `lib/identityEngine.ts` — search for `usableMovement`, `potentialMovement`, drag-related logic.
3. `lib/aim.ts` — Aim score computation. The drag formula likely consumes `aimReading.score`.
4. `lib/gripDecomposition.ts` — Grip composition. Drag formula consumes `gripReading.score`.
5. `feedback_trajectory_model_refinement_canon.md` — the canon. Specifically the "Aim's dual function (tolerance + light governor at ⅓ Grip rate)" line.

## Scope

### Item 1 — Locate the drag formula

Grep for the computation that produces `usableMovement.score` from `potentialMovement.score`. Likely structure:

```typescript
const dragFactor = (some function of gripReading.score) + (some function of aimReading.score)
const usable = potential * (1 - dragFactor)
```

Or possibly:

```typescript
const gripDrag = gripReading.score * GRIP_COEFFICIENT
const aimGovernance = aimReading.score * AIM_COEFFICIENT
const totalDrag = gripDrag + aimGovernance
```

Find the exact constants / coefficients used.

### Item 2 — Compute the ratio

Calculate: **AIM_COEFFICIENT / GRIP_COEFFICIENT**.

- If ratio === 1/3 (~0.333): **Canon-compliant. No fix needed. Close CC with positive confirmation.**
- If ratio === 0 (Aim doesn't contribute drag at all): **Off-canon — Aim is missing as a drag contributor. Draft follow-up CC.**
- If ratio === 1 (Aim contributes equally to Grip): **Off-canon — Aim is over-weighted as drag. Draft follow-up CC.**
- If ratio is some other value (0.2, 0.5, etc.): **Off-canon — Aim's contribution doesn't match the canonical 1/3 rate. Draft follow-up CC noting the actual value and the canonical target.**

### Item 3 — If on-canon, close with report

If Item 2 confirms 1/3 ratio:
- Document the exact formula + constants in the report-back
- Confirm via cohort fixture: pick a fixture with mid-range Aim + mid-range Grip (e.g., Daniel: Aim ~68, Grip ~41), compute expected drag, compare against engine output
- Close this CC; no follow-up needed

### Item 4 — If off-canon, draft follow-up CC

If Item 2 finds the math off-canon:
- Draft `prompts/active/CC-093-FOLLOWUP-AIM-DRAG-CALIBRATION.md` with:
  - Current coefficient value(s)
  - Canonical target (Aim at 1/3 Grip rate)
  - Single-line code change to bring math on-canon
  - Cohort impact analysis: how do Daniel / Cindy / Jason / Michele / Ashley / Harry usable-movement numbers change?
  - Acceptance criteria including a regression for at least 3 cohort fixtures
- Close THIS CC (CC-093) with the follow-up CC reference; the actual math change happens in the follow-up CC after Jason reviews
- Do NOT apply the math change in this CC's run

### Item 5 — Tolerance cone independence verification

Separate from drag rate: verify that **Aim tightens the tolerance cone** (the visible `±9°` fan in the trajectory SVG). This part should already work correctly (per Daniel's chart rendering), but spot-check:
- Higher Aim → narrower cone
- Lower Aim → wider cone
- The ±N° angle in the chart's `length-readout` text scales with Aim somehow

If the tolerance cone is fixed at `±9°` regardless of Aim, that's ALSO an off-canon finding worth flagging. The canon says cone width is "derived from Aim," not constant.

### Item 6 — Optional audit

If the math is on-canon, OPTIONALLY add a guard audit `tests/audit/aimDragRateCanon.audit.ts` that locks the 1/3 ratio in place:
- Assertion: `Math.abs(AIM_COEFFICIENT / GRIP_COEFFICIENT - 1/3) < 0.01`
- Prevents future drift from canon

If adding the audit, also add `package.json` script. Skip if the audit would require structural test setup that's disproportionate to the value.

## Do NOT

- **Do NOT apply calibration math changes in this CC's run.** This is verify-first. Math changes go in a follow-up CC.
- **Do NOT change `AIM_COEFFICIENT` or `GRIP_COEFFICIENT` constants** unless the math is off-canon AND Jason approves the change via the follow-up CC's drafting.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** No baseline drift expected from this CC (unless Item 6 is applied; then minimal).
- **Do NOT modify the Risk Form classifier.** CC-084 already wired the 5th band; that's separate from the drag rate.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No SDK.
- **Do NOT commit or push.**

## Allowed to Modify

- `tests/audit/aimDragRateCanon.audit.ts` (new — only if Item 6 chosen)
- `package.json` (only if Item 6 audit script added)
- `prompts/active/CC-093-FOLLOWUP-AIM-DRAG-CALIBRATION.md` (only if Item 4 triggered)
- Move prompt to `prompts/completed/` at end (CC-093 itself)

Anything else: **read-only**. This is a verification CC.

## Out of Scope

- Math changes (deferred to follow-up CC if needed)
- Tolerance cone implementation changes (flag if off-canon; don't fix in this CC)
- Other Risk Form / Quadrant / classifier changes
- LLM rewrite layer
- Schema changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes (read-only changes only — should be no-op if math is on-canon)
2. `npm run lint` passes
3. The drag formula is located and documented in the report-back
4. The AIM_COEFFICIENT / GRIP_COEFFICIENT ratio is computed and reported
5. If on-canon: report-back confirms 1/3 ratio; no follow-up CC needed
6. If off-canon: follow-up CC draft created at `prompts/active/CC-093-FOLLOWUP-AIM-DRAG-CALIBRATION.md`; THIS CC closes without applying the math change
7. Tolerance cone behavior also reported (width scales with Aim, or fixed at ±9°)
8. Zero modifications to engine math constants
9. Zero modifications to Wave 1 persistence files
10. Zero LLM calls
11. Zero cache file modifications
12. Zero commits

## Report Back

- The drag formula: exact lines + constants
- The AIM_COEFFICIENT / GRIP_COEFFICIENT ratio: actual value
- Canon compliance: on-canon (1/3) or off-canon (with actual value)
- Tolerance cone behavior: width-scales-with-Aim or fixed
- If off-canon: pointer to the drafted follow-up CC
- Cohort fixture spot-check: Daniel-like fixture's expected drag based on the formula vs actual rendered drag — match or mismatch
- If Item 6 (audit) added: audit results

## Notes for executor

- Estimated time: 20–30 min (most of it is reading code; the diff is small)
- Cost: $0
- This CC is deliberately scoped tight. If you find something unexpected (e.g., drag formula uses non-linear functions instead of linear coefficients), document but don't try to recalibrate in this CC's run.
- Per the gradient canon, verify before you fix. Half the value of this CC is just knowing whether the math is on-canon.
