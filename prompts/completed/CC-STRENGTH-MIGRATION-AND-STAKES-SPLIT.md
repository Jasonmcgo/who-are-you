# CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT — Phase 1 Closeout + §13 StakesLoad Composition

**Origin:** Trajectory Model Refinement Canon (`docs/canon/trajectory-model-refinement.md`) §10–§13. Phase 2 Aim composition (`computeAimScore` in `lib/aim.ts`) is already canonical and wired in `identityEngine.ts:1973`. Phase 1 Strength layer (`lib/threeCStrength.ts`) is already computed and exposed at `driveOutput.strengths`. What's missing is (a) interpretive-math consumers still read the Mix (`distribution.cost/coverage/compliance`) instead of the Strengths, and (b) §13's StakesLoad ≠ DefensiveGrip multiplicative composition has not yet been built.

This CC closes both gaps. After it lands, the canonical reading direction is:

> **Strength = substance. Mix = relative emphasis (pie-chart only). Grip = DefensiveGrip × StakesAmplifier.**

**Method discipline:** Substrate migration + one fresh derivation. No new question-bank items. No engine math invented from scratch — Phase 1/2 formulas already exist; this CC routes consumers to the right substrate. The Stakes split is the one new build, and it's a decomposition of existing Grip inputs, not a new measurement.

**Scope frame:** CC-mega, ~1.5–2 hours executor time (recalibrated estimate). Multiple files touched but each change is localized and the audit surface is well-defined.

**Cost surface:** $0 — no LLM calls. Cache regen optional and bounded; legacy alias system from CC-MOMENTUM-HONESTY can preserve byte-stable hashes if needed.

---

## Embedded context

### What already exists (do not rebuild)

| Concept | File | Status |
|---|---|---|
| 3C Strength layer | `lib/threeCStrength.ts` — `computeCostStrength`, `computeCoverageStrength`, `computeComplianceStrength` | ✓ Computed, exposed at `driveOutput.strengths` |
| Phase 2 Aim formula | `lib/aim.ts:135` — `computeAimScore` | ✓ Canonical, wired in `identityEngine.ts:1973` |
| 12-label MovementQuadrantLabel union | `lib/movementQuadrant.ts` | ✓ Just shipped (CC-MOMENTUM-HONESTY) |
| Movement Limiter (drag + tolerance) | `lib/movementLimiter.ts` | ✓ Locked by CC-CHART-LABEL-LEGIBILITY |
| Tolerance bands (uniform +3°) | `lib/movementLimiter.ts::computeToleranceDegrees` | ✓ Locked |
| Risk Form labels (Open-Handed / White-Knuckled / Ungoverned / Grip-Governed) | `lib/riskForm.ts` | ✓ Locked |
| Trajectory chart layout | `lib/trajectoryChart.ts` | ✓ Locked |

### What this CC builds

**Segment A — Migrate interpretive consumers from Mix to Strength.**
Currently `workMap.ts::isCostLeaning` and `isCoverageLeaning` read `distribution.cost >= 38` (a Mix threshold). Same in `loveMap.ts::isCoverageLeaning`. `riskForm.ts::computeRiskForm` reads `distribution.compliance`. Per canon §10: **interpretive math uses Strengths. Pie-chart language may use Mix.** Migrate these three call sites to read `driveOutput.strengths` instead.

**Segment B — Canonize Strength/Mix distinction in types.**
The `DriveDistribution` type at `lib/types.ts:441` documents that `cost + coverage + compliance` sum to 100. The `DriveStrengths` type at `lib/types.ts:471` exists but is informally named. Make the type-level distinction explicit: rename `DriveDistribution` → `DriveMix` (preserve alias for backward compat), add JSDoc explaining the two layers, and ensure `DriveOutput` surfaces both with clear naming.

**Segment C — §13 StakesLoad ≠ DefensiveGrip split.**
Today, `Grip` is a single composed value derived from the existing grip cluster signals. Per canon §13, Grip is actually two components: `StakesLoad` (objective — what's on the line: money, job, reputation, dependents) and `DefensiveGrip` (subjective — how much the stakes hijack the person). Composition is multiplicative:

```ts
Grip = DefensiveGrip × StakesAmplifier
```

where `StakesAmplifier ∈ [1.0, 1.5]` scales with StakesLoad ONLY when DefensiveGrip ≥ a floor (so high stakes alone are not fear).

The current Grip computation effectively bundles these. This CC decomposes them so the engine can report both, and the multiplicative composition becomes canonical. Existing Grip consumers continue to read the composed value (no downstream changes required for visualization).

**Segment D — Retire legacy Aim formula from canonical path (keep as debug only).**
`computeAimScoreLegacy` runs alongside `computeAimScore` and stores at `constitution.aimReadingLegacy`. The legacy reading is helpful for cohort comparison but is no longer canonical. Move it behind a feature flag (`DEBUG_LEGACY_AIM`) or strip it from the canonical output object; keep the function for cohort audit comparison but don't expose `aimReadingLegacy` on the constitution object in production renders.

**Segment E — §11 ComplianceStrength → WiseRiskStrength rename (semantic).**
The Aim formula already consumes `driveStrengths.compliance` as `wiseRiskStrength`. The Strength field is still called `compliance` in code, which conflicts with the §11 reframing ("Compliance" should mean wise risk, discernment, governance — not timid rule-following). Add a `wiseRisk` alias on `DriveStrengths` (or rename outright with backward-compat alias). Update inline documentation in `lib/threeCStrength.ts` per canon §11.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/workMap.ts` | MODIFY | `isCostLeaning` / `isCoverageLeaning` read `driveOutput.strengths`, not `.distribution`. Recalibrate threshold from 38 (Mix %) to a Strength threshold (likely 55–60 since Strengths are not percent-of-pie). Audit reports cohort distribution at candidate thresholds. |
| `lib/loveMap.ts` | MODIFY | Same migration for `isCoverageLeaning`. |
| `lib/riskForm.ts` | MODIFY | Read `driveStrengths.compliance` instead of `distribution.compliance`. Calibrate "high" threshold (currently `>= 30`% Mix; new Strength threshold needs cohort calibration). |
| `lib/types.ts` | MODIFY | Add `DriveMix` alias for `DriveDistribution`. Add `wiseRisk` field on `DriveStrengths` (or rename `compliance` with alias). JSDoc explaining the two-layer model per canon §10. |
| `lib/threeCStrength.ts` | MODIFY | Inline comments updated per canon §11 (Cost/Coverage/Compliance reframing). Add `wiseRisk` accessor. |
| `lib/identityEngine.ts` | MODIFY | Move `aimReadingLegacy` behind `DEBUG_LEGACY_AIM` flag (default off). Wire StakesLoad/DefensiveGrip decomposition into the Grip computation chain. |
| `lib/grip.ts` (or wherever Grip is currently composed — verify) | MODIFY | Decompose existing Grip into DefensiveGrip + StakesLoad. Add `computeStakesAmplifier(stakesLoad, defensiveGrip)` per §13 multiplicative rule. Export both components on `GripReading`. |
| `tests/audit/strengthMigrationAndStakesSplit.audit.ts` | NEW | 12 audit assertions (see below). |

### Segment A — workMap/loveMap threshold migration

**Current `isCostLeaning` (workMap.ts:80):**
```ts
function isCostLeaning(drive: DriveOutput | undefined): boolean {
  if (!drive) return false;
  const d = drive.distribution;
  return d.cost >= d.coverage && d.cost >= d.compliance && d.cost >= 38;
}
```

**Proposed:**
```ts
function isCostLeaning(drive: DriveOutput | undefined): boolean {
  if (!drive?.strengths) return false;
  const s = drive.strengths;
  // Strength threshold: a substrate must be both leading AND substantial
  return s.cost >= s.coverage && s.cost >= s.compliance && s.cost >= STRENGTH_LEAN_THRESHOLD;
}
```

**Calibration:** Audit reports cohort relabel counts at `STRENGTH_LEAN_THRESHOLD` = 50, 55, 60, 65. Recommend the value that produces minimal cohort label churn while still excluding low-substance leans. Default ship at 55 unless cohort data argues otherwise.

### Segment B — Type-level Strength/Mix canon

In `lib/types.ts`:

```ts
/**
 * DriveMix — Cost/Coverage/Compliance as relative emphasis, summing to 100.
 * Used for: pie-chart rendering, "you're 40% Cost, 35% Coverage, 25% Compliance" UX.
 * NOT used for: interpretive math, lean classifiers, Aim composition.
 *
 * Per canon §10 — `docs/canon/trajectory-model-refinement.md`.
 */
export type DriveMix = {
  cost: number;       // 0-100, sums with others to 100
  coverage: number;
  compliance: number;
  rankAware: boolean;
  inputCount: { cost: number; coverage: number; compliance: number };
};

// Backward compatibility — preserve until consumers migrate
export type DriveDistribution = DriveMix;

/**
 * DriveStrengths — independent 0-100 substance scores. Do not sum to 100.
 * Used for: interpretive math, lean classifiers, Aim composition.
 *
 * Per canon §10/§11.
 */
export type DriveStrengths = {
  cost: number;        // 0-100 — Goal-axis substance (work, effort, output, craft)
  coverage: number;    // 0-100 — Soul-axis substance (love, care, presence, mercy)
  compliance: number;  // 0-100 — Wise-risk substance. Aliased as wiseRisk.
  wiseRisk: number;    // alias for compliance per §11 reframing — use this in new code
};
```

### Segment C — §13 StakesLoad ≠ DefensiveGrip composition

**Locate current Grip composition.** It's likely in `lib/grip.ts` or `lib/identityEngine.ts` (executor: find the function that returns `gripReading.score`). The current Grip integrates multiple input clusters including money/security signals, control/being-right signals, etc.

**Decompose:**

```ts
// StakesLoad — objective signal: are real stakes present?
function computeStakesLoad(signals: Signal[]): number {
  // Sum of weighted stakes signals: Q-Stakes1 elevations, money/wealth/security
  // surface clusters, dependent obligations, public-office/fiduciary markers.
  // Returns 0-100.
}

// DefensiveGrip — subjective signal: do defensive patterns appear?
function computeDefensiveGrip(signals: Signal[]): number {
  // Existing grip cluster MINUS the stakes-only signals: control under pressure,
  // being-right-under-pressure, money-as-fear-target (NOT money-as-reality),
  // pressure-adaptation, fear-of-loss-of-self.
  // Returns 0-100.
}

// StakesAmplifier — multiplicative scalar
function computeStakesAmplifier(stakesLoad: number, defensiveGrip: number): number {
  // Per canon §13: high stakes amplify Grip ONLY when defensive signals are also present.
  // - If defensiveGrip < 20 → return 1.0 (no amplification regardless of stakes)
  // - Else: return 1.0 + (stakesLoad / 100) * 0.5  (amplifier in [1.0, 1.5])
  if (defensiveGrip < 20) return 1.0;
  return 1.0 + (stakesLoad / 100) * 0.5;
}

// Composed Grip — multiplicative per §13
function computeGrip(signals: Signal[]): GripReading {
  const stakesLoad = computeStakesLoad(signals);
  const defensiveGrip = computeDefensiveGrip(signals);
  const amplifier = computeStakesAmplifier(stakesLoad, defensiveGrip);
  const composed = clamp(defensiveGrip * amplifier, 0, 100);
  return { score: composed, components: { defensiveGrip, stakesLoad, amplifier } };
}
```

**Calibration target — Daniel synthetic shape.** Daniel (Goal 75 / Soul 95 / Aim 63 / current Grip 46, surface cluster: money, control, security, plan-that-used-to-work, pressure-adaptation under economic stress) — Jason's intuition is the engine reads his Grip too lightly. Under §13 composition, this shape has high StakesLoad AND high DefensiveGrip, so StakesAmplifier should land near 1.4–1.5×, producing composed Grip ≈ 55–65 instead of 46. Audit reports Daniel's decomposed components and validates the amplifier path fires.

**Cohort regression — Jason synthetic shape.** Jason (Grip 21, low stakes overall — surface cluster does NOT include money/security elevation): StakesLoad low + DefensiveGrip low → amplifier ≈ 1.0 → composed Grip ≈ 21. Confirms the decomposition is non-destructive for low-stakes / low-defensive shapes.

### Segment D — Retire aimReadingLegacy from production output

Currently `constitution.aimReadingLegacy` is populated unconditionally. After this CC, populate it only when `process.env.DEBUG_LEGACY_AIM === "true"` (or equivalent flag mechanism consistent with the codebase). Audit cohort comparison scripts can opt in; the production render does not include the legacy reading.

### Segment E — §11 semantic reframing

In `lib/threeCStrength.ts`:
- Update file-level comment to reflect §11 canon: "Compliance is wise risk, discernment, governance, restraint, and trajectory calibration. NOT timid rule-following."
- Add `wiseRisk` as the recommended forward-facing name; keep `compliance` as backward-compat alias.

Update one downstream consumer (`lib/aim.ts:71` JSDoc) to reflect the rename. No prose-template changes (LLM prompts are out of scope).

---

## Audit assertions (12 NEW)

In `tests/audit/strengthMigrationAndStakesSplit.audit.ts`:

1. **`work-map-reads-strength-not-mix`** — `isCostLeaning` and `isCoverageLeaning` in `lib/workMap.ts` reference `driveOutput.strengths`, not `driveOutput.distribution`.
2. **`love-map-reads-strength-not-mix`** — `isCoverageLeaning` in `lib/loveMap.ts` references `driveOutput.strengths`.
3. **`risk-form-reads-strength-not-mix`** — `computeRiskForm` reads `driveStrengths.compliance`, not `distribution.compliance`.
4. **`pie-chart-still-reads-mix`** — `lib/driveDistributionChart.ts` continues to read Mix (canon §10 explicitly preserves Mix for pie-chart rendering).
5. **`strength-lean-threshold-calibration-reported`** — audit prints cohort relabel counts at STRENGTH_LEAN_THRESHOLD = 50, 55, 60, 65; recommends V1 value.
6. **`drive-mix-alias-preserved`** — `DriveDistribution` remains usable as a type alias for `DriveMix` (no breaking type changes downstream).
7. **`drive-strengths-has-wise-risk-alias`** — `DriveStrengths.wiseRisk === DriveStrengths.compliance` for every cohort fixture.
8. **`grip-decomposition-exposes-components`** — `GripReading.components` has `defensiveGrip`, `stakesLoad`, and `amplifier` fields, each 0-100 (amplifier in [1.0, 1.5]).
9. **`grip-amplifier-gated-by-defensive-floor`** — for fixtures with `defensiveGrip < 20`, `amplifier === 1.0` regardless of stakesLoad.
10. **`grip-composition-multiplicative`** — for every cohort fixture, `GripReading.score ≈ clamp(defensiveGrip × amplifier, 0, 100)` (within rounding).
11. **`daniel-shape-stakes-amplifies`** — constructed Daniel-shape input (per §13 calibration target) produces `amplifier ≥ 1.4` and composed Grip ≥ 55. Confirms intuition-test passes.
12. **`jason-shape-stakes-passthrough`** — Jason fixture (Grip 21, low stakes) produces `amplifier === 1.0` and composed Grip unchanged from pre-CC value (within rounding tolerance ±2).
13. **`aim-reading-legacy-gated-behind-flag`** — `constitution.aimReadingLegacy` is `undefined` in production output unless `DEBUG_LEGACY_AIM` is set.
14. **`aim-reading-canonical-unchanged`** — `computeAimScore` produces identical output before/after this CC for all cohort fixtures (this CC does NOT modify the Aim formula).

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify `computeAimScore` or `AIM_WEIGHTS`.** Phase 2 Aim is canonical and locked. This CC routes inputs, not formula.
2. **Do NOT modify the 12-label `MovementQuadrantLabel` union or Grip-aware quadrant gating.** Both just shipped in CC-MOMENTUM-HONESTY.
3. **Do NOT modify `lib/movementLimiter.ts` formulas** (`computeGripDragModifier`, `computeAimGovernorModifier`, `computeToleranceDegrees`). All three are locked by CC-CHART-LABEL-LEGIBILITY and CC-MOMENTUM-HONESTY. The maxGripDrag coefficient (0.45) stays as-is even if Daniel-intuition suggests it should be higher; that's a separate calibration CC.
4. **Do NOT modify Risk Form letter logic** (`Open-Handed Aim` / `White-Knuckled Aim` / `Grip-Governed` / `Ungoverned Movement`). Only the substrate it reads (Strength vs Mix) changes.
5. **Do NOT modify LLM system prompts or prose anchors.** Cohort cache stays byte-stable; if any input to the prose layer changes shape, use the `legacyLabel` alias pattern established by CC-MOMENTUM-HONESTY.
6. **Do NOT modify the angle-band integration logic** (42–58°). Canon §2 is locked.
7. **Do NOT modify the trajectory chart rendering** — layout, viewBox, legend, consolidated readout all stay as CC-CHART-LABEL-LEGIBILITY shipped them.
8. **Do NOT add new question-bank items.** Per the minimal-questions-maximum-output rule. StakesLoad is decomposed from EXISTING Q-Stakes1 and surface-cluster signals; no new questions added.
9. **Do NOT regenerate cohort cache.** No prompt-file changes; cache hashes remain valid via `legacyLabel` / `wiseRisk` alias patterns.
10. **Do NOT modify the pie-chart (`driveDistributionChart.ts`).** It continues to read Mix per canon §10.
11. **Do NOT add Cindy or Michele to the cohort fixture set.** Those additions are separate CODEX scope; this CC validates with constructed inputs per AGENTS.md canon-faithful clause.
12. **Do NOT bundle the chart corner-bolding harmonization** (chart bolds 4-corner legacy labels while readout uses 12-label set). That's a separate CC-LABELS-VISUAL-REFINEMENT remnant.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean (0 warnings)
- [ ] `npx tsx tests/audit/strengthMigrationAndStakesSplit.audit.ts` — all 14 assertions pass
- [ ] All other existing audits remain green (29/29 from CC-MOMENTUM-HONESTY → 30/30 with this CC's new file)
- [ ] Cohort sweep regression: for every fixture, the pre-CC Aim score equals the post-CC Aim score (within ±0.1 rounding)
- [ ] Cohort sweep regression: for every fixture, the pre-CC Movement Strength equals the post-CC Movement Strength (Movement Limiter formulas are locked)
- [ ] Daniel synthetic shape validation: composed Grip ≥ 55, amplifier ≥ 1.4

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **DriveStrengths/DriveMix type paste** — confirm both types exported with documentation.
3. **STRENGTH_LEAN_THRESHOLD calibration report** — cohort distribution at 50/55/60/65, recommended V1 ship value.
4. **Grip decomposition function paste** — show `computeStakesLoad`, `computeDefensiveGrip`, `computeStakesAmplifier`, composed `computeGrip`.
5. **Daniel synthetic validation** — paste decomposed components: StakesLoad, DefensiveGrip, StakesAmplifier, composed Grip. Confirm intuition test passes.
6. **Jason fixture regression** — paste Grip decomposition. Confirm amplifier === 1.0 and composed Grip within ±2 of pre-CC value.
7. **Cohort Grip-shift table** — for every fixture, show: legacy Grip / new composed Grip / amplifier value. Highlight fixtures where amplifier > 1.1 (these are the stakes-elevated cases).
8. **Aim score regression confirmation** — table of cohort fixture Aim scores pre/post; all should match within ±0.1.
9. **Audit pass/fail breakdown** — every audit listed in verification checklist.
10. **Out-of-scope verification** — confirm none of the 12 DO-NOT items were touched.

---

**Architectural test:** Daniel's synthetic render after this CC reads honestly:

- *Grip 58 (composed) — DefensiveGrip 42 × StakesAmplifier 1.38*
- *Stakes are real and the defensive pattern is engaged with them — that's why the grip reads higher than the bare defensive pattern alone would suggest*

Jason's render reads unchanged in substance — his low defensive signals + low stakes mean the multiplicative composition is a no-op. The CC adds honesty for the cohort where it's warranted (stakes-elevated shapes) without disturbing already-honest reads. Phase 1 substrate migration completes the canon §10/§11 work; Phase 2 §13 closes the Grip-composition arc.

After this CC, the trajectory math arc is closed and the engine math is canonized end-to-end against the Trajectory Model Refinement canon. Next CC pivots to the labels visual remnant (chart corner-bolding harmonization) or to user-facing canon work (CC-PRODUCT-THESIS-CANON).
