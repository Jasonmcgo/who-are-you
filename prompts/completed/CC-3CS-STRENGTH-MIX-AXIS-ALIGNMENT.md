# CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT — Foundation Phase 1 of Trajectory Model Refinement

**Origin:** `docs/canon/trajectory-model-refinement.md` §10–11 + §18 items 1–4. Per Jason + Clarence canon (2026-05-10): the current Cost/Coverage/Compliance Drive distribution is forced to sum to 100%, which creates artificial collapse and decouples the trajectory components from their measurement substrate. Jason's fixture surfaced the issue empirically — Goal=85 (high) but Cost bucket≈22 (low) — and the canon refinement defines the architectural fix.

This is the FOUNDATION CC of the three-phase trajectory model refinement. Phase 2 (Aim formula rebuild) and Phase 3 (label refinement) both depend on this substrate being in place.

**Method discipline:** Engine for truth. The Strength scores are independent 0-100 derivations; the Mix is the existing pie distribution. Both surfaces preserved. No prose changes. No LLM prompt changes. No cohort cache regeneration required (Strength/Mix are new fields; existing prose-cache hashes don't change unless we expose them to inputs).

**Scope frame:** ~3-4 hours executor time. CC-mega scale because of the substrate alignment work — CostStrength must share signal substrate with Goal-axis substance (or be tightly coupled), same for CoverageStrength/Soul and ComplianceStrength/Aim. Editorial judgment in defining the derivation predicates.

**Cost surface:** Zero LLM calls if Strength fields are not yet consumed by LLM prompts (they aren't — that's Phase 2/3 work).

---

## Embedded context (CC executor environments don't see Cowork memory)

### Canon reference

Full canon at `docs/canon/trajectory-model-refinement.md`. Key sections this CC implements:

**§10 — 3C Strength + 3C Mix two-layer:**

> Separate the 3C model into two layers.
>
> **A. 3C Strengths (independent 0–100, do NOT sum to 100):**
> CostStrength, CoverageStrength, ComplianceStrength
>
> **B. 3C Mix (relative emphasis, sums to 100):**
> CostMix + CoverageMix + ComplianceMix = 100
>
> **Canon:** 3C Strengths measure capacity/substance. 3C Mix measures relative emphasis. Interpretive math uses Strengths. Pie-chart language may use Mix.

**§11 — Cost/Coverage/Compliance definitions:**

| Bucket | What it actually means |
|---|---|
| Cost | work, effort, output, craft, building, responsibility, economic reality, consequence — **Goal-axis substance** |
| Coverage | love, care, presence, mercy, family, belovedness, human obligation — **Soul-axis substance** |
| Compliance | wise risk, discernment, governance, restraint, moral/risk calibration — **NOT timid rule-following** |

### The empirical issue this CC fixes

Jason's fixture (jason0429): Goal=85, Soul=53, but in the current Drive distribution: cost≈22%, coverage≈55%, compliance≈22%. The Cost bucket is at 22% despite Goal being at 85 — because the buckets are computed from a separate signal substrate (`lib/drive.ts`) than the trajectory components (`lib/goalSoulGive.ts`).

When Aim is computed as a blend of cost/compliance buckets + conviction + movement strength, Jason lands at Aim=43.7 (Free movement) despite canonical Wisdom-governed expectation. The root cause: Cost and Compliance buckets don't share substrate with Goal/Soul/Aim.

This CC introduces CostStrength/CoverageStrength/ComplianceStrength as new derivations that DO share substrate with Goal/Soul/Aim, while preserving the existing Mix percentages for Drive case classification.

### The substrate-alignment principle

The architectural canon (per `feedback_engine_internal_vocabulary_ban`):

> The 3C's framework (Cost/Coverage/Compliance) is the **engineering register** of the trajectory framework (Goal/Soul/Wisdom). Same three components, named twice for two audiences.

Concretely: CostStrength should be tightly coupled to Goal score; CoverageStrength to Soul score; ComplianceStrength to the wise-risk substance that Phase 2's Aim formula will consume. Whether "tightly coupled" means "identical to" or "shares ≥80% of the signal substrate" is an implementation choice — the audit will validate that they move together.

### Why Strength + Mix is the right split

A user with high Goal AND high Soul AND high Compliance currently has the Drive Mix flatten one bucket because the three must sum to 100. The user might genuinely have high capacity on all three axes (CostStrength=85, CoverageStrength=70, ComplianceStrength=80) and the Mix would still meaningfully report relative emphasis (CostMix=37%, CoverageMix=30%, ComplianceMix=33%). Strengths show substance; Mix shows emphasis.

A user with low Goal AND low Soul AND low Compliance currently sees a Mix that may falsely suggest "this person has a strong Compliance preference" when they actually have low everything. Strengths would surface this honestly: CostStrength=25, CoverageStrength=20, ComplianceStrength=30 — moderate emphasis on Compliance, but ALL low.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/drive.ts` (or wherever Drive distribution computes) | MODIFY | Add `CostStrength`, `CoverageStrength`, `ComplianceStrength` derivations. Preserve existing Mix computation. |
| `lib/types.ts` | MODIFY | Add `strengths: { cost: number; coverage: number; compliance: number }` field on the Drive distribution type, alongside existing `distribution` (which becomes the Mix). |
| `lib/identityEngine.ts` | MODIFY (surgical) | Wire Strength derivation into the constitution chain at the same point Drive distribution computes. |
| `lib/renderMirror.ts` | NO MODIFICATION YET | Render exposure of Strength is Phase 3 (prose). For this CC, Strength fields exist on the constitution but are not yet user-visible. |
| `tests/audit/threeC_strength.audit.ts` | NEW | Audit assertions: Strength fields exist, Strength substrate aligns with Goal/Soul/Aim trajectory components, Mix continues to sum to 100, no regression in Drive case classification. |

### Substrate alignment rules

**CostStrength derivation must share substrate with Goal score.** Recommended approach: re-use or near-mirror `computeGoalScore` predicates (`lib/goalSoulGive.ts`), with the recognition that Goal score predicates already capture "work, effort, output, craft, building, responsibility, economic reality, consequence." The executor has two reasonable options:

1. **Option A — Direct coupling.** `CostStrength = goalScore` (or `costStrength = clamp(goalScore + smallAdjustment, 0, 100)` where adjustment accounts for any cost-specific signals not yet in goalScore). Tightest coupling; easiest to validate; loses the ability to diverge if future signals justify separation.

2. **Option B — Parallel substrate.** Compose CostStrength from a near-identical predicate set as Goal, in a separate `computeCostStrength` function. Allows future divergence; introduces drift risk if the two functions get out of sync.

Recommend **Option A** for V1, with `computeCostStrength` as a thin wrapper that returns `goalScore` (or near-identical derivation) — the simplest path that honors the canon. Audit asserts that `Math.abs(costStrength - goalScore) <= 5` across cohort.

**Same approach for CoverageStrength** — couples to `soulScore`.

**ComplianceStrength is the new derivation.** It does NOT correspond to any single existing score; it's the wise-risk / governance / discernment substance Phase 2's Aim formula will consume. The executor must define its predicates fresh, drawing on:

- Q-P1, Q-P2 (conviction signals — high conviction under risk reads as wise-risk)
- Q-Stakes1 (stakes-bearing without defensive collapse — but per canon §13, separate StakesLoad from DefensiveGrip)
- Q-I1/Q-I2/Q-I3 (Belief Under Tension — conviction temperature contributes)
- Q-V1 (governance-related signals)
- OCEAN Conscientiousness (discipline / restraint)
- Drive distribution's existing compliance bucket (as one input, not the only input)

Compose with weights that produce a 0-100 score where:
- High = strong wise-risk substance (governed, discerning, restrained without rigid)
- Low = thin wise-risk substance (impulsive or chaotic)

The exact weights are calibration knobs; document them as constants in the derivation function.

### Mix preservation

The existing Drive distribution (the percentages summing to 100) is preserved verbatim. It continues to drive:
- Drive case classification (aligned / inverted-small / inverted-big / partial-mismatch / balanced / unstated)
- Existing prose that uses bucket-lean (per `feedback_drive_case_vs_bucket_lean` — 38% bucket-lean threshold)
- Any other downstream consumer of `drive.distribution`

Strength is additive — it ADDS new fields without removing existing ones.

### Risk Form note

The existing `lib/riskForm.ts` continues to use `drive.distribution.compliance` (the Mix) as its risk-bucket axis. Phase 2 will refactor Risk Form to use ComplianceStrength (or the new Aim formula derived from it). This CC does NOT modify `riskForm.ts`.

### Type signature

```ts
// lib/types.ts — add to existing Drive output type

export interface DriveStrengths {
  cost: number;        // 0-100
  coverage: number;    // 0-100
  compliance: number;  // 0-100
}

export interface DriveOutput {
  // existing fields preserved
  distribution: {
    cost: number;
    coverage: number;
    compliance: number;
  };  // Mix — sums to 100

  // NEW field
  strengths: DriveStrengths;  // independent 0-100 each

  // ... other existing fields
}
```

### Composition with prior CCs

- **CC-PRIMAL-COHERENCE**, **CC-GRIP-CALIBRATION**, **CC-AGE-CALIBRATION** — untouched. They consume different parts of the constitution.
- **CC-AIM-CALIBRATION** — partially superseded. The legacy `computeAimScore` continues to work with the Mix; Phase 2 will rebuild Aim using Strength. This CC adds the substrate; Phase 2 consumes it.
- **CC-VOICE-RUBRIC-EXPANSION**, **CC-CRISIS-PATH-PROSE** — untouched. No LLM prompt changes in this CC.

---

## Audit assertions (10 NEW)

In `tests/audit/threeC_strength.audit.ts`:

1. **`three-c-strength-fields-exist`** — every constitution post-build has `drive.strengths.cost`, `drive.strengths.coverage`, `drive.strengths.compliance` populated as numbers in [0, 100].
2. **`three-c-strength-mix-preserved`** — `drive.distribution.cost + drive.distribution.coverage + drive.distribution.compliance ≈ 100` (existing Mix invariant — must continue to hold).
3. **`three-c-cost-strength-aligns-with-goal`** — for every cohort fixture, `abs(drive.strengths.cost - goalSoulGive.goal) <= 5`. (Tolerance allows for small derivation-specific adjustments while enforcing tight coupling.)
4. **`three-c-coverage-strength-aligns-with-soul`** — for every cohort fixture, `abs(drive.strengths.coverage - goalSoulGive.soul) <= 5`.
5. **`three-c-compliance-strength-bounded`** — `drive.strengths.compliance` is in [0, 100] for every fixture (no overflow on the new derivation).
6. **`three-c-compliance-strength-distributional`** — across the 24-fixture cohort, ComplianceStrength shows distribution variety (not collapsed at one value); report min/max/median in audit output.
7. **`three-c-strength-deterministic`** — running the constitution build twice on identical answers produces identical Strength values.
8. **`three-c-jason-fixture-revalidation`** — for Jason fixture (Goal=85, Soul=53), assert CostStrength ≥ 80 AND CoverageStrength ∈ [45, 60]. ComplianceStrength: report value (not yet asserted; Phase 2 will validate against canonical Wisdom-governed expectation).
9. **`three-c-drive-case-classification-unchanged`** — for every cohort fixture, the Drive case classification (from existing Mix) is byte-identical to pre-CC. Strength doesn't disrupt Mix.
10. **`three-c-no-prose-changes`** — confirm `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx` show zero diff. Strength fields exist on the constitution but are not yet user-visible.

In `tests/audit/goalSoulGive.audit.ts` (extension):
- 1 assertion confirming `goalSoulGive` outputs are unchanged (Goal, Soul, Vulnerability, Grip, quadrant all byte-identical pre/post CC).

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify `goalSoulGive.ts` Goal/Soul/Vulnerability/Grip computation.** Strength reads from Goal/Soul; it doesn't recompute them.
2. **Do NOT modify the existing Drive Mix computation or Drive case classification.** Strength is additive.
3. **Do NOT modify `lib/riskForm.ts`.** Risk Form continues to use Mix.compliance. Phase 2 will refactor.
4. **Do NOT modify `lib/aim.ts`.** Aim continues to use Mix.compliance and Mix.cost. Phase 2 will rebuild Aim on Strength substrate.
5. **Do NOT modify any LLM system prompts or rubric examples.** Phase 3 is prose layer.
6. **Do NOT modify `lib/renderMirror.ts` or `InnerConstitutionPage.tsx`.** Strength fields are engine-internal until Phase 3.
7. **Do NOT regenerate cohort cache.** No LLM-prompt inputs change in this CC.
8. **Do NOT add new survey questions.** Strength derives from existing signals.
9. **Do NOT modify CC-PRIMAL-COHERENCE, CC-GRIP-CALIBRATION, CC-AGE-CALIBRATION, CC-VOICE-RUBRIC-EXPANSION, CC-CRISIS-PATH-PROSE, CC-PATTERN-CATALOG-SI-SE-FI code.** Compose alongside; no upstream edits.
10. **Do NOT bundle Phase 2 or Phase 3 work.** Aim rebuild, tolerance cone, label refinement — all separate CCs.

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/threeC_strength.audit.ts` (new — all 10 assertions pass)
- [ ] `npx tsx tests/audit/goalSoulGive.audit.ts` (extended — pass; Goal/Soul/Vuln/Grip unchanged)
- [ ] All other existing audits remain green
- [ ] No cohort regeneration (no LLM inputs changed)

---

## Report-back format

1. **Summary** — files added/modified, line-count delta, audit pass count.
2. **Strength derivation code paste** — full implementation of `computeCostStrength`, `computeCoverageStrength`, `computeComplianceStrength`.
3. **Substrate alignment evidence** — for the 24-fixture cohort, paste a table: fixture | Goal | CostStrength | abs(diff) | Soul | CoverageStrength | abs(diff) | ComplianceStrength. Confirm `abs(diff) ≤ 5` everywhere.
4. **Jason fixture revalidation** — paste CostStrength, CoverageStrength, ComplianceStrength for Jason fixture. Confirm canon expectations.
5. **Drive case classification non-regression** — confirm byte-identity on Drive case for all 24 fixtures pre/post CC.
6. **ComplianceStrength distribution** — min / max / median / quartiles across cohort.
7. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
8. **Out-of-scope verification** — confirm none of the 10 DO-NOT items were touched.
9. **Recommendations for follow-on work** — including:
    - Whether Option A (`CostStrength = goalScore`) or Option B (parallel substrate) was chosen, with rationale
    - Whether the ComplianceStrength derivation seems calibrated correctly against canon expectations (high for wise-risk shapes; low for impulsive/chaotic)
    - Any cohort fixture where the Strength values seem materially off from canonical expectation (flag for Jason's review)

---

**Architectural test for this CC:** Jason fixture's CostStrength matches his Goal score (within 5 points); CoverageStrength matches his Soul score (within 5 points); ComplianceStrength surfaces a value that Phase 2's Aim formula will use to land him at Wisdom-governed (≥60). If CostStrength=85 and CoverageStrength=53 cleanly, the substrate alignment is correct and Phase 2 can build on it.
