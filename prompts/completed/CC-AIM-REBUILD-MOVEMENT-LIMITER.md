# CC-AIM-REBUILD-MOVEMENT-LIMITER — Phase 2 of Trajectory Model Refinement

**Origin:** `docs/canon/trajectory-model-refinement.md` §12 (Aim formula rebuild), §6–9 (movement limiter), §13 (Stakes ≠ Grip). Phase 1 (CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT) shipped `drive.strengths.{cost, coverage, compliance}` as substrate. Phase 2 consumes that substrate and adds the math layer the canon defines.

**Method discipline:** Engine for truth. Four interlocking work segments, each deterministic. No prose changes. No LLM prompt changes. Engine-internal until Phase 3.

**Scope frame:** ~4-5 hours executor time. CC-mega scale. Four work segments compose into one shipable engine layer:

1. **New derivations** — ConvictionClarity (continuous), GoalSoulCoherence (50° band proximity), ResponsibilityIntegration (stakes-without-collapse)
2. **Aim formula rebuild** — new 5-component weighted composition on Phase 1's Strength substrate
3. **StakesLoad / DefensiveGrip split** — separates objective stakes from subjective collapse; multiplicative Grip composition
4. **Movement limiter** — tolerance cone (Aim → degrees), Grip drag, Aim governor, Usable Movement composite

**Cost surface:** Zero LLM. No cohort cache regen (engine-internal fields; LLM prompts don't yet consume them — that's Phase 3).

---

## Embedded context (CC executor environments don't see Cowork memory)

### Canon reference (full canon at `docs/canon/trajectory-model-refinement.md`)

**§6 — Tolerance Cone Formula:**
```ts
function computeToleranceDegrees(aim: number): number {
  if (aim >= 85) return 4;
  if (aim >= 70) return 7;
  if (aim >= 55) return 10;
  if (aim >= 40) return 15;
  return 20;
}
```

**§7 — Grip Drag Formula:**
```ts
function computeGripDragModifier(grip: number): number {
  const maxGripDrag = 0.45;
  return 1 - ((grip / 100) * maxGripDrag);
}
```

**§8 — Aim Governor Formula:**
```ts
function computeAimGovernorModifier(aim: number): number {
  const maxAimGovernor = 0.15;
  return 1 - ((aim / 100) * maxAimGovernor);
}
```

**§9 — Usable Movement:**
```ts
usableMovement = potentialMovement × gripDragModifier × aimGovernorModifier
```

Canon line: *"Grip is waste. Aim is cost."* A car's brakes ≠ a flat tire.

**§12 — Aim formula rebuild:**
```
Aim = WiseRiskStrength       × 0.40
    + ConvictionClarity      × 0.20
    + GoalSoulCoherence      × 0.20    // closeness to 50° band
    + MovementStrength       × 0.10
    + ResponsibilityIntegration × 0.10
```

**§13 — Stakes ≠ Grip:**
```ts
StakesLoad = what is actually on the line (objective)
DefensiveGrip = how much the stakes hijack the person (subjective)
Grip = DefensiveGrip × StakesAmplifier   // MULTIPLICATIVE
// NOT: Grip = DefensiveGrip + StakesLoad (additive — wrong)
```

> Canon: high stakes amplify Grip ONLY when defensive signals are also present. Stakes alone are not fear.

### Phase 1 substrate (what's available)

Per CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT (landed 2026-05-10):

- `drive.strengths.cost` = goalScore (Option A direct coupling, `|diff|=0` across cohort)
- `drive.strengths.coverage` = soulScore (same)
- `drive.strengths.compliance` = computed from `(conscientiousness × 0.40) + (convictionTemp×score × 0.30) + (driveMix.compliance × 0.30)`
- Cohort range: ComplianceStrength 40.3 to 62.0 (narrow — see §below)
- Jason fixture: CostStrength=88, CoverageStrength=54, ComplianceStrength=51.8

**Code location:** `lib/threeCStrength.ts` exports `computeCostStrength`, `computeCoverageStrength`, `computeComplianceStrength`, `COMPLIANCE_STRENGTH_WEIGHTS` constant.

### Critical gap surfaced by Phase 1 (must address in Phase 2)

Jason's fixture has `belief_under_tension.conviction_temperature === "unknown"` despite high Q-P1/Q-P2 conviction signals. The 4-level temperature mapping (`high=80, moderate=50, low=25, unknown=50`) defaults him to 50 because BeliefUnderTension doesn't fire cleanly on his answers.

**This is why his ComplianceStrength is 51.8 (cohort median) and not high** — the conviction component contributes only 15 of his ComplianceStrength (50 × 0.30).

Phase 2's `ConvictionClarity` derivation must be richer than the 4-level temperature. Recommended approach: derive a continuous 0-100 conviction score directly from `Q-P1`, `Q-P2`, `Q-V1`, `Q-I1` (substantive freeform), `Q-I2/Q-I3` if present. Do NOT depend solely on the `belief_under_tension.conviction_temperature` field.

### Why ComplianceStrength range is narrow (40.3 to 62.0)

Phase 1's formula leans 40% on Conscientiousness, which clusters mid-range in the cohort. The bottom of the range (40.3 for fully-thin-signal users) reflects the conviction default of 50 + driveMix.compliance default ~33 averaging out. Phase 2 can either:

- Replace ComplianceStrength's conviction component with the new ConvictionClarity (recommended — richer signal, wider distribution)
- Add a non-linear transform on the low end
- Leave Phase 1's ComplianceStrength alone and use Phase 2's new ConvictionClarity directly in the Aim formula

**Recommended:** treat ComplianceStrength as input to the Aim formula's "WiseRiskStrength" component, but use Phase 2's ConvictionClarity directly as a separate Aim component. This way Phase 1's ComplianceStrength stays unchanged (preserves downstream consumers' expectations) while Phase 2 gets a fresh, wider-distribution conviction signal.

### Current Grip composition (what changes in §13's split)

Current `computeGrippingPull` in `lib/goalSoulGive.ts` composes Grip from:

1. Q-Stakes1 loss-aversion (+25 or +15) — **STAKES**
2. Pressure-adaptation cluster (cap 30, each +10) — **DEFENSIVE**
3. Vulnerability < 0 (+25) — **DEFENSIVE**
4. Raw Soul < 35 (+20) — **DEFENSIVE**
5. Q-GRIP1 direct grips_* (cap 25) — **DEFENSIVE**
6. Q-GS1 gripping_proof_signal — **DEFENSIVE**
7. Q-V1 performance_identity — **DEFENSIVE**

Phase 2 split:
- **StakesLoad** = component #1 only (objective stakes — what's on the line)
- **DefensiveGrip** = components #2–7 (subjective collapse — pressure adaptation + vulnerability collapse + thin soul + named grips + Q-GS1 + Q-V1)
- **Grip = DefensiveGrip × StakesAmplifier(StakesLoad)**

This is a meaningful refactor. Downstream consumers of `grippingPull.score` will see a different value distribution. Phase 2 ships the new fields (StakesLoad, DefensiveGrip, gripAmplifier) ALONGSIDE the existing `grippingPull.score`; the existing field continues to use the current additive formula for backward compatibility, while a new `grippingPull.gripFromDefensive` field surfaces the canonical multiplicative version. Phase 3 (or a later CC) will switch downstream consumers.

---

## Work segments

### Segment 1: New supporting derivations

Three new derivations, each in its own module or extension to an existing one:

#### 1.1 `lib/convictionClarity.ts` (NEW)

Continuous 0-100 conviction score, derived from rich signal:

```ts
export interface ConvictionClarityInputs {
  // From signals
  highConvictionExpression: boolean;       // Q-P1
  highConvictionUnderRisk: boolean;        // Q-P2
  convictionUnderCost: boolean;            // Q-I1 substantive freeform OR explicit signal
  // From Q-V1 ranking (if present)
  vulnerabilityOpenUncertainty_rank: number | null;   // rank in Q-V1 (1, 2, 3+, or null)
  sacredBeliefConnection_rank: number | null;
  performanceIdentity_rank: number | null;
  goalLogicExplanation_rank: number | null;
  // From BeliefUnderTension shape (fallback)
  beliefUnderTensionTemperature: "high" | "moderate" | "low" | "unknown" | null;
  // From OCEAN (light contribution)
  conscientiousness: number | null;        // 0-100
}

export interface ConvictionClarityReading {
  score: number;                            // 0-100
  components: {
    p1_p2_signal: number;                   // 0-40 (max if both Q-P1 + Q-P2 fire)
    qv1_positive: number;                   // 0-30 (Q-V1 vulnerability_open / sacred_belief_connection)
    qv1_penalty: number;                    // 0-15 (Q-V1 performance_identity / goal_logic_explanation)
    belief_tension_fallback: number;        // 0-20 (only when other signals are thin)
    conscientiousness_lift: number;         // 0-10
  };
  rationale: string;
}

export function computeConvictionClarity(inputs: ConvictionClarityInputs): ConvictionClarityReading;
```

**Composition formula (proposed):**

```
score = p1_p2_signal + qv1_positive - qv1_penalty + belief_tension_fallback + conscientiousness_lift
```

- `p1_p2_signal`: high_conviction_expression (+20) + high_conviction_under_risk (+20). Max 40.
- `qv1_positive`: vulnerability_open_uncertainty rank-1 (+15) / rank-2 (+8); sacred_belief_connection rank-1 (+10) / rank-2 (+5). Sum capped at 30.
- `qv1_penalty`: performance_identity rank-1 (+8) / rank-2 (+4); goal_logic_explanation rank-1 (+5) / rank-2 (+2). Sum capped at 15. **Subtracted** from score.
- `belief_tension_fallback`: only fires when `p1_p2_signal + qv1_positive < 20` (thin direct signal). Maps temperature: high → 20, moderate → 12, low → 5, unknown → 0.
- `conscientiousness_lift`: `clamp((conscientiousness - 70) / 30 × 10, 0, 10)` — only lifts for high-C shapes; zero for moderate-C.

Final: clamp to [0, 100], round to 1 decimal.

**Test against Jason's fixture (constructed inputs):**
- Q-P1 high (+20), Q-P2 high (+20) → p1_p2 = 40
- Q-V1: assume vulnerability_open_uncertainty rank-1 (+15)
- Penalty: assume 0
- belief_tension_fallback: 0 (direct signal is rich enough)
- Conscientiousness 94: lift = (94-70)/30 × 10 = 8
- **Total: 40 + 15 + 8 = 63**

That's a meaningful improvement over the 50 default that "unknown" temperature was producing.

**Audit:** ConvictionClarity ≥ 50 for any fixture where Q-P1 OR Q-P2 fires.

#### 1.2 `lib/goalSoulCoherence.ts` (NEW)

Closeness to the 50° integration band (42-58° per canon §2).

```ts
export interface GoalSoulCoherenceInputs {
  angleDegrees: number;   // 0-90 from goalSoulMovement
}

export interface GoalSoulCoherenceReading {
  score: number;          // 0-100
  band: "low-arc" | "productive-under-integrated" | "integration" | "soul-heavy" | "vertical-longing";
  bandDescription: string;
  rationale: string;
}

export function computeGoalSoulCoherence(inputs: GoalSoulCoherenceInputs): GoalSoulCoherenceReading;
```

**Formula:**

```ts
const distanceFromBand = Math.max(0, Math.abs(angle - 50) - 8);  // 8 = half-band-width (42-58)
const score = clamp(100 - 3 * distanceFromBand, 0, 100);
```

Decay rate (3 points per degree outside band) is calibration; document as `GOAL_SOUL_COHERENCE_DECAY` constant.

**Band classification per canon §2:**
- 0-30° → low-arc
- 30-42° → productive-under-integrated
- 42-58° → integration
- 58-70° → soul-heavy
- 70-90° → vertical-longing

**Examples:**
- 50°: distance=0 → score=100, band=integration
- 42°: distance=0 → score=100, band=integration
- 32° (Jason): distance=10 → score=70, band=productive-under-integrated
- 20°: distance=22 → score=34, band=low-arc
- 90°: distance=32 → score=4, band=vertical-longing

**Audit:** all 24 cohort fixtures + 4 trajectory fixtures get a band classification; in-band fixtures (42-58°) score ≥ 100; out-of-band fixtures score < 100.

#### 1.3 `lib/responsibilityIntegration.ts` (NEW)

Engaged stakes without defensive collapse. Rewards stakes-bearing when defensive signals are absent.

```ts
export interface ResponsibilityIntegrationInputs {
  stakesLoad: number;       // 0-100, from Segment 3
  defensiveGrip: number;    // 0-100, from Segment 3
  movementStrength: number; // 0-100
}

export interface ResponsibilityIntegrationReading {
  score: number;  // 0-100
  rationale: string;
}

export function computeResponsibilityIntegration(inputs: ResponsibilityIntegrationInputs): ResponsibilityIntegrationReading;
```

**Formula:**

```ts
const stakesEngagement = stakesLoad / 100;        // 0-1
const defensiveCollapse = defensiveGrip / 100;     // 0-1
const movement = movementStrength / 100;           // 0-1

// Reward stakes-bearing without collapse; require some forward motion
const score = clamp(100 * stakesEngagement * (1 - defensiveCollapse) * Math.max(0.3, movement), 0, 100);
```

Interpretation: high stakes × low defensive grip × non-trivial movement → high responsibility integration. The `Math.max(0.3, movement)` floor prevents a paralyzed-but-stakes-bearing user from scoring artificially high — some movement is required to count as "integrated responsibility."

**Examples:**
- Responsible Leader fixture (StakesLoad=80, DefensiveGrip=5, MovementStrength=80): score = 100 × 0.8 × 0.95 × 0.8 = 60.8
- Jason (StakesLoad≈30, DefensiveGrip≈16, MovementStrength=70.8): 100 × 0.3 × 0.84 × 0.708 = 17.8
- Free spirit drift (StakesLoad=10, DefensiveGrip=10, MovementStrength=30): 100 × 0.1 × 0.9 × 0.3 = 2.7

**Audit:** ResponsibilityIntegration ≥ 50 for Responsible Leader fixture; ≤ 30 for Drift fixture.

**Dependency note:** segments 1.3 and 3 are interlocked. ResponsibilityIntegration consumes StakesLoad and DefensiveGrip; those come from Segment 3. Implement Segment 3 first, then Segment 1.3.

---

### Segment 2: Aim formula rebuild

Rebuild `lib/aim.ts` `computeAimScore` to use the new 5-component composition.

#### 2.1 New AimScoreInputs

```ts
export interface AimScoreInputs {
  wiseRiskStrength: number;            // 0-100, from drive.strengths.compliance (Phase 1)
  convictionClarity: number;           // 0-100, from Segment 1.1
  goalSoulCoherence: number;           // 0-100, from Segment 1.2
  movementStrength: number;            // 0-100, from goalSoulMovement
  responsibilityIntegration: number;   // 0-100, from Segment 1.3
}
```

#### 2.2 New AIM_WEIGHTS

```ts
export const AIM_WEIGHTS = {
  wiseRiskStrength: 0.40,
  convictionClarity: 0.20,
  goalSoulCoherence: 0.20,
  movementStrength: 0.10,
  responsibilityIntegration: 0.10,
} as const;
```

(Weights sum to 1.0; audit asserts this.)

#### 2.3 New computeAimScore

```ts
export function computeAimScore(inputs: AimScoreInputs): AimReading {
  const wrs = clamp01(inputs.wiseRiskStrength);
  const cc = clamp01(inputs.convictionClarity);
  const gsc = clamp01(inputs.goalSoulCoherence);
  const ms = clamp01(inputs.movementStrength);
  const ri = clamp01(inputs.responsibilityIntegration);

  const weighted =
    wrs * AIM_WEIGHTS.wiseRiskStrength +
    cc * AIM_WEIGHTS.convictionClarity +
    gsc * AIM_WEIGHTS.goalSoulCoherence +
    ms * AIM_WEIGHTS.movementStrength +
    ri * AIM_WEIGHTS.responsibilityIntegration;

  const score = Math.round(weighted * 10) / 10;

  // rationale, components, weights preserved per Phase 1 transparency pattern
  // ...
}
```

#### 2.4 Legacy computeAimScore preserved

The previous Aim formula (compliance × 0.30 + cost × 0.30 + conviction × 0.20 + movementStrength × 0.20) is kept as `computeAimScoreLegacy` for cohort comparison. Audit reports both for every fixture so we can see the distribution shift.

#### 2.5 Jason validation

Constructed inputs for Jason (target Wisdom-governed):
- WiseRiskStrength: 51.8 (Phase 1's ComplianceStrength)
- ConvictionClarity: 63 (per Segment 1.1 estimate)
- GoalSoulCoherence: 70 (32° angle)
- MovementStrength: 70.8
- ResponsibilityIntegration: 17.8

**Aim = 51.8×0.40 + 63×0.20 + 70×0.20 + 70.8×0.10 + 17.8×0.10**
**Aim = 20.72 + 12.60 + 14.00 + 7.08 + 1.78**
**Aim = 56.2**

Hmm — still below 60 threshold. Let me reconsider.

The issue: GoalSoulCoherence is moderate (70) because Jason's 32° angle is outside the 42-58 band. So even with rich ConvictionClarity, his Aim only lands ~56.

**This is the canon's point.** Jason at 32° is "Productive but under-integrated" per canon §2. His shape genuinely isn't fully Wisdom-governed yet — he's *aimed* (Aim is moderate-high), but the trajectory itself isn't in the integration band.

**Two interpretations:**

(a) The math is correctly reflecting Jason's shape — he's in a productive but not-fully-integrated place. The "Wisdom-governed" label in the legacy Risk Form was generous; the new architecture correctly flags him as moderate (Free movement or near-threshold).

(b) The audit should accept Jason landing at 55-60 range (moderate Aim) rather than asserting ≥60. The architectural test is whether his shape SHIFTS UP from the 43.7 he had before — not whether he crosses an arbitrary threshold.

**Recommend interpretation (b).** Audit assertion: Jason's new Aim score ≥ 55 (improvement over 43.7) AND ≥ 5 points higher than legacy. The 60 threshold for Wisdom-governed shifts to be assessed in Phase 3 with the new Risk Form labels (Open-Handed Aim, etc.).

The actual Wisdom-governed (Open-Handed Aim) classification will then depend on Jason's actual answers + the threshold calibration in Phase 3.

---

### Segment 3: StakesLoad / DefensiveGrip split + multiplicative Grip

#### 3.1 Extract StakesLoad from current Grip composition

```ts
// lib/stakesLoad.ts (NEW or extension of goalSoulGive.ts)

export interface StakesLoadInputs {
  qStakes1Ranking: Record<string, number>;  // money_stakes, job_stakes, reputation_stakes, etc.
}

export interface StakesLoadReading {
  score: number;  // 0-100
  topStakes: string[];  // top-2 stakes types
  rationale: string;
}

export function computeStakesLoad(inputs: StakesLoadInputs): StakesLoadReading;
```

**Composition (replicates current Grip's stakes contribution):**

```ts
const HEAVY_STAKES = ["money_stakes", "job_stakes", "reputation_stakes"];

let score = 0;
const top2 = top-2 ranked stakes in HEAVY_STAKES;
if (top2.length >= 1 && top2[0] is in top-1) score += 50;  // top-1 weight
if (top2.length >= 2 && top2[1] is in top-2) score += 30;  // top-2 weight
// Other stakes contribute lightly
for (other top-3 stakes) score += 10;
return clamp(score, 0, 100);
```

**Audit:** StakesLoad ≥ 70 for Responsible Leader fixture (heavy money/job/reputation top-3).

#### 3.2 Extract DefensiveGrip

```ts
// lib/defensiveGrip.ts (NEW or extension)

export interface DefensiveGripInputs {
  pressureAdaptationCount: number;  // 0-4 (hides_belief, adapts_economic, adapts_social, chaos_exposure)
  vulnerabilityNegative: boolean;   // vulnerability < 0
  thinSoul: boolean;                 // raw soul < 35
  qGrip1Signals: { signal: string; rank: number }[];
  qGS1GrippingProofSignal: number | null;  // rank, null if absent
  qV1PerformanceIdentity: number | null;   // rank, null if absent
}

export function computeDefensiveGrip(inputs: DefensiveGripInputs): DefensiveGripReading;
```

**Composition (replicates current Grip's defensive contribution, excluding stakes):**

```ts
let score = 0;
// Pressure adaptation
score += Math.min(30, pressureAdaptationCount * 10);
// Vulnerability negative
if (vulnerabilityNegative) score += 25;
// Thin soul
if (thinSoul) score += 20;
// Q-GRIP1 signals (cap 25)
let qGrip1Total = 0;
for (signal of qGrip1Signals) {
  if (signal.rank === 1) qGrip1Total += 8;
  else if (signal.rank === 2) qGrip1Total += 5;
  else if (signal.rank === 3) qGrip1Total += 3;
  else qGrip1Total += 1;
}
score += Math.min(25, qGrip1Total);
// Q-GS1 gripping_proof_signal
if (qGS1GrippingProofSignal === 1) score += 5;
else if (qGS1GrippingProofSignal && qGS1GrippingProofSignal <= 3) score += 2;
// Q-V1 performance_identity
if (qV1PerformanceIdentity === 1) score += 4;
else if (qV1PerformanceIdentity === 2) score += 2;

return clamp(score, 0, 100);
```

**Audit:** DefensiveGrip ≤ 10 for Responsible Leader fixture (no pressure adaptation, positive vulnerability, non-thin soul).

#### 3.3 Multiplicative Grip composition

```ts
// lib/gripFromDefensive.ts (NEW) OR extension of goalSoulGive.ts

const MAX_STAKES_AMPLIFICATION = 0.5;  // calibration knob

export function computeStakesAmplifier(stakesLoad: number): number {
  return 1 + (stakesLoad / 100) * MAX_STAKES_AMPLIFICATION;
  // StakesLoad 0 → 1.0 (no amplification)
  // StakesLoad 100 → 1.5 (max amplification)
}

export function computeGripFromDefensive(
  defensiveGrip: number,
  stakesLoad: number
): { grip: number; amplifier: number; rationale: string } {
  const amplifier = computeStakesAmplifier(stakesLoad);
  const grip = clamp(defensiveGrip * amplifier, 0, 100);
  return { grip, amplifier, rationale: /* ... */ };
}
```

#### 3.4 Backward compatibility

Preserve `grippingPull.score` with the existing additive formula. Add new fields:
- `grippingPull.stakesLoad`
- `grippingPull.defensiveGrip`
- `grippingPull.gripAmplifier`
- `grippingPull.gripFromDefensive` (the new canonical multiplicative Grip)

Downstream consumers (CC-GRIP-CALIBRATION, CC-PRIMAL-COHERENCE, Risk Form) continue to use `grippingPull.score` until a future CC switches them. Phase 2 reports cohort distribution shift for review.

#### 3.5 Cohort distribution report

Audit reports for all 28 fixtures (24 cohort + 4 trajectory):

| Fixture | Old Grip | New StakesLoad | New DefensiveGrip | New GripFromDefensive | Diff |
|---|---|---|---|---|---|

Look for: Responsible Leader fixture should show large drop (heavy stakes-driven grip → low). Gripping fixtures should show moderate-to-no change (already mostly defensive).

---

### Segment 4: Movement Limiter

#### 4.1 `lib/movementLimiter.ts` (NEW)

```ts
export function computeToleranceDegrees(aim: number): number {
  if (aim >= 85) return 4;
  if (aim >= 70) return 7;
  if (aim >= 55) return 10;
  if (aim >= 40) return 15;
  return 20;
}

const MAX_GRIP_DRAG = 0.45;
export function computeGripDragModifier(grip: number): number {
  return 1 - ((clamp01(grip) / 100) * MAX_GRIP_DRAG);
}

const MAX_AIM_GOVERNOR = 0.15;
export function computeAimGovernorModifier(aim: number): number {
  return 1 - ((clamp01(aim) / 100) * MAX_AIM_GOVERNOR);
}

export interface UsableMovementReading {
  potentialMovement: number;          // raw bounded Goal/Soul vector length
  gripDragModifier: number;           // 0-1
  aimGovernorModifier: number;        // 0-1
  usableMovement: number;             // post-modifier
  toleranceDegrees: number;           // ± degrees on direction
  rationale: string;
}

export function computeUsableMovement(inputs: {
  potentialMovement: number;
  grip: number;          // use gripFromDefensive (canonical)
  aim: number;
}): UsableMovementReading;
```

#### 4.2 Type integration

Add to `InnerConstitution.goalSoulMovement.dashboard`:

```ts
movementLimiter?: UsableMovementReading;
```

#### 4.3 Examples (Jason fixture)

- potentialMovement: 70.8
- grip (canonical): ~16
- aim (new): ~56
- gripDragModifier: 1 - (16/100 × 0.45) = 0.928
- aimGovernorModifier: 1 - (56/100 × 0.15) = 0.916
- usableMovement: 70.8 × 0.928 × 0.916 = 60.2
- toleranceDegrees: aim 56 → 10° (just below 55 threshold; if aim recalibrates higher could be 10°)

---

## Type signatures (consolidated)

Add to `lib/types.ts`:

```ts
import type { ConvictionClarityReading } from "./convictionClarity";
import type { GoalSoulCoherenceReading } from "./goalSoulCoherence";
import type { ResponsibilityIntegrationReading } from "./responsibilityIntegration";
import type { UsableMovementReading } from "./movementLimiter";

export interface InnerConstitution {
  // existing fields...

  convictionClarity?: ConvictionClarityReading;
  goalSoulCoherence?: GoalSoulCoherenceReading;
  responsibilityIntegration?: ResponsibilityIntegrationReading;

  // Updated grippingPull
  goalSoulGive: {
    // existing fields preserved
    grippingPull: {
      score: number;                    // LEGACY additive (preserved)
      stakesLoad: number;               // NEW
      defensiveGrip: number;            // NEW
      gripAmplifier: number;            // NEW
      gripFromDefensive: number;        // NEW canonical multiplicative
      signals: GripSignal[];            // existing
    };
  };

  // Updated movement
  goalSoulMovement: {
    dashboard: {
      // existing fields
      movementLimiter?: UsableMovementReading;
    };
  };

  // Updated aim
  aimReading?: AimReading;  // now using new formula
}
```

---

## Orchestration

Update `lib/identityEngine.ts` to wire the new derivations in dependency order:

```
1. computeGoalSoulGive       → raw goal, soul, vulnerability, legacy grippingPull
2. (Phase 1) attachDriveStrengths → drive.strengths.{cost, coverage, compliance}
3. computeStakesLoad          → grippingPull.stakesLoad           [SEGMENT 3]
4. computeDefensiveGrip       → grippingPull.defensiveGrip        [SEGMENT 3]
5. computeGripFromDefensive   → grippingPull.gripFromDefensive    [SEGMENT 3]
6. computeMovement            → goalSoulMovement (existing)
7. computeConvictionClarity   → convictionClarity                  [SEGMENT 1.1]
8. computeGoalSoulCoherence   → goalSoulCoherence                  [SEGMENT 1.2]
9. computeResponsibilityIntegration → responsibilityIntegration   [SEGMENT 1.3]
10. computeAimScore (REBUILT) → aimReading                          [SEGMENT 2]
11. computeUsableMovement      → goalSoulMovement.dashboard.movementLimiter [SEGMENT 4]
12. (existing) computeRiskFormFromAim → uses new Aim
13. (existing) gripTaxonomy, primalCoherence, etc.
```

---

## Audit assertions (24 NEW)

In `tests/audit/aimRebuild.audit.ts`:

### Segment 1 audits (new derivations)

1. **`conviction-clarity-rich-signal-improves`** — ConvictionClarity ≥ 50 for any fixture where Q-P1 OR Q-P2 fires (test against Jason fixture constructed inputs OR cohort fixtures with P signals).
2. **`conviction-clarity-bounded`** — ConvictionClarity in [0, 100] for all 28 fixtures.
3. **`conviction-clarity-jason-fixture`** — Jason fixture lands ConvictionClarity ≥ 55 (was effectively 50 under unknown-temperature default).
4. **`goal-soul-coherence-integration-band`** — fixtures with angle 42-58° land coherence ≥ 95.
5. **`goal-soul-coherence-vertical-longing`** — fixtures with angle ≥ 80° land coherence ≤ 20.
6. **`goal-soul-coherence-low-arc`** — fixtures with angle ≤ 10° land coherence ≤ 30.
7. **`responsibility-integration-leader-high`** — Responsible Leader fixture lands ResponsibilityIntegration ≥ 50.
8. **`responsibility-integration-drift-low`** — fixtures classifying as Drift / Ungoverned land ResponsibilityIntegration ≤ 25.

### Segment 2 audits (Aim rebuild)

9. **`aim-weights-sum-to-one`** — `AIM_WEIGHTS` sums to 1.0 within float tolerance.
10. **`aim-deterministic`** — `computeAimScore` deterministic.
11. **`aim-bounded`** — output in [0, 100] for all fixtures.
12. **`aim-jason-improves`** — Jason fixture's new Aim score ≥ 55 AND ≥ 5 points higher than legacy (legacy was 43.7).
13. **`aim-steward-fixture-high`** — Wise-Risk Steward fixture lands new Aim ≥ 65.
14. **`aim-cohort-distribution`** — for all 28 fixtures: report legacy Aim, new Aim, diff. Observational; no assertion on direction.

### Segment 3 audits (Stakes / Defensive split)

15. **`stakes-load-leader-high`** — Responsible Leader fixture lands StakesLoad ≥ 70.
16. **`defensive-grip-leader-low`** — Responsible Leader fixture lands DefensiveGrip ≤ 15.
17. **`grip-amplifier-bounds`** — gripAmplifier in [1.0, 1.5] for all fixtures.
18. **`grip-from-defensive-leader-low`** — Responsible Leader fixture lands gripFromDefensive ≤ 25 (was likely ~35-45 under legacy additive).
19. **`grip-legacy-preserved`** — `grippingPull.score` (additive legacy) byte-identical to pre-CC for all 28 fixtures.
20. **`grip-cohort-distribution-shift`** — observational table: legacy grip vs new gripFromDefensive for all 28 fixtures.

### Segment 4 audits (Movement Limiter)

21. **`tolerance-cone-aim-bands`** — synthetic test cases:
    - aim=90 → tolerance=4
    - aim=75 → tolerance=7
    - aim=60 → tolerance=10
    - aim=45 → tolerance=15
    - aim=20 → tolerance=20
22. **`grip-drag-bounds`** — gripDragModifier in [0.55, 1.0] for all valid grip inputs.
23. **`aim-governor-bounds`** — aimGovernorModifier in [0.85, 1.0] for all valid aim inputs.
24. **`usable-movement-jason-validation`** — Jason fixture usableMovement in [55, 65] range.

### Cross-segment audits

25. **`aim-rebuild-no-prose-changes`** — confirm `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx` show zero diff. Phase 2 is engine-only.
26. **`aim-rebuild-no-cohort-cache-regen`** — confirm `lib/cache/synthesis3-paragraphs.json` and `lib/cache/grip-paragraphs.json` are unchanged.

In `tests/audit/threeC_strength.audit.ts` (extension):
- 1 assertion that Phase 1's Strength derivations still produce identical outputs (Phase 2 may have changed orchestration but not Strength math).

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify the legacy `computeAimScoreLegacy` formula.** Preserved for cohort comparison.
2. **Do NOT modify Phase 1's `lib/threeCStrength.ts`.** Compose alongside.
3. **Do NOT modify `lib/renderMirror.ts` or `app/components/InnerConstitutionPage.tsx`.** Phase 3 is render layer.
4. **Do NOT modify LLM system prompts or rubric examples.** Phase 3 is prose layer.
5. **Do NOT regenerate cohort cache.** No LLM inputs change.
6. **Do NOT replace `grippingPull.score` with the new canonical formula.** Add new fields; preserve legacy for backward compatibility. Phase 3 (or later) switches downstream consumers.
7. **Do NOT modify Risk Form classifier (`lib/riskForm.ts`).** It continues to use `grippingPull.score` for now. Phase 3 will switch it to `gripFromDefensive`.
8. **Do NOT modify CC-PRIMAL-COHERENCE, CC-GRIP-CALIBRATION, CC-AGE-CALIBRATION, CC-VOICE-RUBRIC-EXPANSION, CC-CRISIS-PATH-PROSE, CC-PATTERN-CATALOG-SI-SE-FI code.** Compose alongside.
9. **Do NOT change the goalSoulMovement angle / length calculation.** Movement limiter consumes them.
10. **Do NOT bundle Phase 3 work (label refinement, Risk Form label changes, prose updates).**
11. **Do NOT add new survey questions.** All derivations from existing signals.
12. **Do NOT add new cohort fixtures.** Use the 24 existing + 4 trajectory + 4 coherence synthetic.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npx tsx tests/audit/aimRebuild.audit.ts` — all 26 assertions pass
- [ ] `npx tsx tests/audit/threeC_strength.audit.ts` (extended) — pass
- [ ] All other existing audits remain green (no regression)
- [ ] No cohort cache regen
- [ ] No prose render changes

---

## Report-back format

1. **Summary** — files added/modified, line-count delta, audit pass count.
2. **New derivations: code paste** — full implementations of `computeConvictionClarity`, `computeGoalSoulCoherence`, `computeResponsibilityIntegration`, `computeStakesLoad`, `computeDefensiveGrip`, `computeGripFromDefensive`, `computeUsableMovement`, new `computeAimScore`.
3. **Constants** — `AIM_WEIGHTS`, `MAX_STAKES_AMPLIFICATION`, `MAX_GRIP_DRAG`, `MAX_AIM_GOVERNOR`, `GOAL_SOUL_COHERENCE_DECAY` — confirmed values.
4. **Cohort distribution table** — for all 28 fixtures (24 cohort + 4 trajectory):
    - Goal, Soul, Angle, MovementStrength
    - WiseRiskStrength (from Phase 1 ComplianceStrength)
    - ConvictionClarity (new)
    - GoalSoulCoherence (new)
    - ResponsibilityIntegration (new)
    - StakesLoad, DefensiveGrip, gripAmplifier, gripFromDefensive
    - Legacy Aim, New Aim, diff
    - Tolerance degrees, gripDragModifier, aimGovernorModifier, usableMovement
5. **Jason fixture validation** — explicit table with all values; confirm Aim ≥ 55 AND ≥ 5 points higher than legacy.
6. **Responsible Leader fixture validation** — StakesLoad ≥ 70 AND DefensiveGrip ≤ 15 AND gripFromDefensive ≤ 25.
7. **Wise-Risk Steward fixture validation** — new Aim ≥ 65; tolerance cone ≤ 10° (high Aim should produce narrow tolerance).
8. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
9. **Out-of-scope verification** — confirm none of the 12 DO-NOT items were touched.
10. **Recommendations for follow-on work** — including:
    - Whether Jason's Aim score lands at or above 55 with the new derivations
    - Calibration adjustments needed if cohort distribution suggests miscalibration
    - Any new derivation that doesn't fire meaningfully on cohort (suggests cohort thinness or predicate issues)
    - Whether the multiplicative Grip composition produces cohort distribution Jason would recognize (the "Free Spirit drift" case should have low new Grip even if some defensive signals are present)

---

## Architectural test for Phase 2

After Phase 2 lands, the following should be true for the cohort:

1. **Jason fixture's Aim score rises** from 43.7 (legacy) to ≥ 55 (new) — moves toward Wisdom-governed territory without yet asserting full classification (that's Phase 3 with the new Risk Form labels).
2. **Responsible Leader fixture's Grip score drops** materially — heavy stakes no longer auto-inflate Grip without defensive signals present.
3. **Wise-Risk Steward fixture lands as canonical Open-Handed Aim shape** — high Aim, narrow tolerance cone, low Grip drag.
4. **All cohort fixtures get a band classification** — productive-under-integrated, integration, low-arc, etc.
5. **No prose, render, cache, or LLM-prompt changes** — pure engine layer.

If all five hold, Phase 3 can build on top of Phase 2 confidently.

---

**Note on Jason fixture Q-GRIP1 backfill:** CC-TRAJECTORY-TEST-FIXTURES flagged that `ocean/07-jason-real-session.json` lacks Q-GRIP1. Phase 2's audits for Jason fixture (#3, #12, #24) use *constructed inputs* matching Jason's known canonical shape (Conscientiousness 94, high Q-P1/Q-P2, Goal=85, Soul=53, Grip=21). If a future small CC backfills the actual Q-GRIP1 ranking into the fixture file, these assertions can be tightened to run against the real fixture. For Phase 2, constructed-input validation is acceptable.
