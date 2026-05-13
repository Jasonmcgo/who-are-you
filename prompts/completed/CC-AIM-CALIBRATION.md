# CC-AIM-CALIBRATION — Aim as First-Class Composite Score + 2×2 Recalibration

**Origin:** Jason raised on 2026-05-10 that the current Risk Form 2×2 conflates two distinct concepts:

> *"Aim scores (which are positive risk aversion to focus aim, vs. risk aversion that feeds the 7 primal questions)."*

Investigation (2026-05-10) found that `lib/riskForm.ts` currently uses `drive.distribution.compliance` as the "risk-bucket" axis with a threshold of 30. Jason's stated calibration intent was `Aim ≥ ~60` for Wisdom-governed — a meaningful gap. Two possibilities:

1. The threshold needs to rise from 30 to ~60.
2. Compliance-bucket alone isn't a good proxy for Aim; Aim needs to be a composite score drawing from multiple signals.

This CC pursues option 2 (richer score), keeps option 1 as a fallback, and resolves a separate labeling-vs-semantics question that the current code has unresolved.

**Method discipline:** Engine for truth. Aim becomes a first-class 0–100 composite score, computed deterministically from existing Drive bucket + Movement + Conviction signals. The 2×2 thresholds are exposed as inspectable constants. Both the legacy "risk-bucket" classification and the new "Aim composite" classification are produced (transparency); the new classification becomes the canonical one over time.

**Scope frame:** ~2-3 hours executor time. CC-mega scale because of the Aim score definition + the 2×2 recalibration + the labeling question + LLM prompt updates that consume the new score.

**Cost surface:** ~$0.50 cohort regeneration if the Aim score lands meaningful enough to change the Risk Form letter for some fixtures. Could be lower if most fixtures stay where they are.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The current state (read-back from `lib/riskForm.ts`)

```ts
RISK_FORM_HIGH_BUCKET = 30  // compliance bucket threshold
RISK_FORM_HIGH_GRIP = 40

if (highBucket && !highGrip)  letter = "Wisdom-governed"
if (highBucket && highGrip)   letter = "Grip-governed"
if (!highBucket && !highGrip) letter = "Free movement"
if (!highBucket && highGrip)  letter = "Reckless-fearful"
```

### The labeling-vs-semantics resolution

Jason's stated mental model placed quadrants this way:

| Quadrant | Condition (Jason's framing) |
|---|---|
| Wisdom-governed | high Aim + low Grip |
| FUD / Grip-governed | **low** Aim + high Grip |
| Free movement / Drift | low Aim + low Grip |
| Reckless-fearful | **high** Aim + high Grip (driven AND gripping; chaotic motion) |

Current code labels the high-bucket+high-grip case as "Grip-governed" and the low-bucket+high-grip case as "Reckless-fearful" — the OPPOSITE of Jason's framing.

**Resolution: redefine the Aim axis (composite score), not the labels.** With Aim properly composed, the high-Aim+high-Grip case genuinely IS chaotic motion (the system is driven AND fearful — Reckless-fearful), and the low-Aim+high-Grip case genuinely IS no-direction-but-gripping (FUD / Grip-governed). The existing labels become correct once Aim is the right concept.

This means: keep the labels, redefine the axis. Audit asserts on the new conceptual mapping.

### What Aim is (definitionally)

**Aim = positive, forward-focused, governed risk-orientation. The willingness to move toward something costly because it's worth it.**

Distinct from:
- **Risk-aversion** (the inverse of risk-orientation; not what Aim measures)
- **Compliance** (rule-following; partial proxy for Aim but not the full picture)
- **Conviction** (held belief; correlates with Aim but is different)
- **Grip** (defensive risk-aversion driven by primal questions; the inverse register of Aim)

A user with high Aim is willing to move forward on costly bets where the cost is justified. A user with high Grip is unwilling to move forward because the cost feels threatening regardless of justification. Same coin, opposite faces.

### Aim composite formula (proposed; calibrate against cohort)

```
Aim = (compliance_bucket * 0.30)
    + (cost_bucket_normalized * 0.30)
    + (conviction_score_normalized * 0.20)
    + (movement_strength_normalized * 0.20)
```

Where:
- `compliance_bucket` is `drive.distribution.compliance` (0-100, already the legacy axis)
- `cost_bucket_normalized` is `drive.distribution.cost` scaled to 0-100 (already 0-100)
- `conviction_score_normalized` is the Conviction card's 0-100 score (existing signal — already measured)
- `movement_strength_normalized` is `goalSoulGive.movementStrength` (0-100)

The weighting rationale:
- Compliance + Cost together = 60% — the Drive matrix carries most of the Aim signal
- Conviction = 20% — held-belief register separates governed-Aim from impulsive-Aim
- Movement strength = 20% — actual forward motion confirms the Aim is operative, not just theoretical

**Calibration target:** Jason's profile (Goal 85, Soul 53, Grip 21, Conviction high, Conscientiousness 94) should produce Aim ≥ 65 (canonical Wisdom-governed). The cohort fixture analysis will reveal whether the formula needs reweighting.

### The new thresholds

```
RISK_FORM_HIGH_AIM = 60     // raised from compliance-bucket 30
RISK_FORM_HIGH_GRIP = 40    // unchanged (per Jason's calibration intent)
```

These two constants are the entire 2×2 calibration surface. Tunable in one file.

### Backward compatibility

The existing `computeRiskForm()` function takes `driveDistribution` + `grippingPullScore`. The new function `computeRiskFormFromAim()` takes the same inputs PLUS `convictionScore` and `movementStrength`, and produces both `aimScore` (composite) and the resulting `letter` using the new threshold.

The legacy function stays available (deprecated) so we can audit before/after classification distribution. The new function becomes the canonical call site once cohort validation passes.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/aim.ts` | NEW | `computeAimScore()` function, weighting constants exposed for calibration. |
| `lib/riskForm.ts` | MODIFY | Add `computeRiskFormFromAim()` alongside existing `computeRiskForm()`. New function consumes Aim score; old function deprecated but kept for audit comparison. |
| `lib/types.ts` | MODIFY | Add `aimScore?: number` and `riskFormFromAim?: RiskFormReading` to `InnerConstitution`. |
| `lib/identityEngine.ts` | MODIFY (surgical) | Compute Aim score after Drive distribution + Conviction + Movement land; attach both `aimScore` and `riskFormFromAim` to constitution. |
| `lib/synthesis3Llm.ts` | MODIFY | System prompt consumes Aim score for register hints (high Aim → wisdom register; low Aim + high Grip → FUD register; etc.). |
| `lib/gripTaxonomyLlm.ts` | MODIFY | Same — Aim-aware register. |
| `lib/renderMirror.ts` | MODIFY (surgical) | Render Aim score in the Movement section alongside Goal/Soul/Grip. |
| `app/components/InnerConstitutionPage.tsx` | MODIFY (surgical) | Same render addition. |
| `tests/audit/aimCalibration.audit.ts` | NEW | Aim formula determinism, threshold calibration, Jason validation case, label-semantics resolution, cohort distribution. |
| `lib/cache/synthesis3-paragraphs.json` | REGENERATE (partial) | Only fixtures whose Aim-derived register changes. |
| `lib/cache/grip-paragraphs.json` | REGENERATE (partial) | Same. |

### Type signatures

```ts
// lib/aim.ts

export const AIM_WEIGHTS = {
  compliance: 0.30,
  cost: 0.30,
  conviction: 0.20,
  movementStrength: 0.20,
} as const;

export interface AimScoreInputs {
  complianceBucket: number;     // 0-100
  costBucket: number;           // 0-100
  convictionScore: number;      // 0-100
  movementStrength: number;     // 0-100
}

export interface AimReading {
  score: number;                // 0-100 composite
  components: {
    compliance: number;
    cost: number;
    conviction: number;
    movementStrength: number;
  };
  weights: typeof AIM_WEIGHTS;
  rationale: string;            // human-readable composition trace
}

export function computeAimScore(inputs: AimScoreInputs): AimReading;
```

```ts
// lib/riskForm.ts (extension)

export const RISK_FORM_HIGH_AIM = 60;        // NEW threshold for Aim-composite
export const RISK_FORM_HIGH_GRIP = 40;       // unchanged

export function computeRiskFormFromAim(
  aimScore: number,
  grippingPullScore: number
): RiskFormReading;

// Existing computeRiskForm() stays available for legacy / audit comparison.
```

### Aim-aware LLM register hints

Add to system prompts (after CC-AGE-CALIBRATION's band-aware register block):

```
# Aim register (anchor — adjusts trajectory-class register)

The user's report includes an Aim composite score (0-100) and a Risk Form letter derived from Aim × Grip.

- HIGH AIM (>60) + LOW GRIP (<40): Wisdom-governed register. The user is moving with internal governance. Frame as "the governor that aims movement rather than prevents it."
- HIGH AIM (>60) + HIGH GRIP (>40): Reckless-fearful register. The user is driven AND gripping — chaotic motion. Frame as "engaged but not at peace; the engine is running, the brakes are also on."
- LOW AIM (<60) + HIGH GRIP (>40): Grip-governed (FUD) register. Fear is driving more than direction. Frame as "movement constrained by what's gripping rather than aimed by what's worth pursuing."
- LOW AIM (<60) + LOW GRIP (<40): Free movement / Drift register. The user is moving without strong governance. Frame as "motion appears unimpeded, but without strong governance, calibration may be a future asking."

These registers compose with the path-class register (trajectory vs crisis) and the developmental band register. Crisis-class users do not consume Aim register hints (the trajectory framework doesn't apply).
```

### Render addition

In the Movement section (markdown + React), the existing block:

```
Goal: 85 / 100
Soul: 53 / 100
Direction: 32° (Goal-leaning)
Movement Strength: 70.8 / 100
Quadrant: Giving / Presence
Gripping Pull: 21 / 100
```

Becomes:

```
Goal: 85 / 100
Soul: 53 / 100
Aim: 72 / 100         ← NEW
Grip: 21 / 100         ← renamed from "Gripping Pull" for parallelism
Direction: 32° (Goal-leaning)
Movement Strength: 70.8 / 100
Quadrant: Giving / Presence
Risk Form: Wisdom-governed (Aim 72, Grip 21)
```

The existing `Gripping Pull: 21 / 100` line is renamed to `Grip: 21 / 100` for parallelism with `Aim: 72 / 100`. The Risk Form letter line is updated to reference Aim instead of risk-bucket percentage.

---

## Audit assertions (10 NEW)

In `tests/audit/aimCalibration.audit.ts`:

1. **`aim-formula-determinism`** — `computeAimScore()` is deterministic; identical inputs produce identical outputs.
2. **`aim-formula-bounded-output`** — for any input in [0, 100] for all four components, output `score` is in [0, 100].
3. **`aim-weights-sum-to-one`** — `AIM_WEIGHTS.compliance + .cost + .conviction + .movementStrength === 1.0` (within floating-point tolerance).
4. **`aim-jason-validation`** — for the Jason fixture (when Q-GRIP1/Q-Stakes1 land OR via constructed input), `aimScore >= 60` AND `riskFormFromAim.letter === "Wisdom-governed"`. (Skip with TODO if fixture isn't yet available.)
5. **`aim-thresholds-exposed`** — `RISK_FORM_HIGH_AIM` and `RISK_FORM_HIGH_GRIP` are exported constants with the canonical values.
6. **`aim-quadrant-semantic-correctness`** — synthetic test cases for each quadrant validate the label-semantics resolution:
   - Aim 75 + Grip 25 → Wisdom-governed
   - Aim 75 + Grip 60 → Reckless-fearful (high engagement + high fear)
   - Aim 35 + Grip 60 → Grip-governed (FUD)
   - Aim 35 + Grip 25 → Free movement
7. **`aim-cohort-distribution`** — for the 24-fixture cohort, every fixture has both legacy `riskForm.letter` and new `riskFormFromAim.letter` computed; report any fixtures where the letter differs (observational; not asserted as right/wrong).
8. **`aim-render-includes-score`** — rendered markdown for at least one fixture contains "Aim: " (regex check).
9. **`aim-llm-prompts-anchor`** — both `synthesis3Llm.ts` and `gripTaxonomyLlm.ts` SYSTEM_PROMPTs contain the Aim register block.
10. **`aim-rationale-non-empty`** — every `AimReading.rationale` is a non-empty string explaining the composition.

In `tests/audit/synthesis3.audit.ts` (extension):
- 1 assertion that the SYSTEM_PROMPT contains the Aim register switching block.

---

## Cohort regeneration

After the prompts change, regenerate caches with `--force`. Expect:
- Fixtures whose Risk Form letter changes (legacy → Aim-based) will produce new prose
- Fixtures whose letter stays the same may still regenerate if the Aim score introduces a register-hint variation
- Total ~$0.30–$0.50 depending on classification stability

```
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildSynthesis3.ts --force
ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildGripTaxonomy.ts --force
```

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT remove the legacy `computeRiskForm()` function.** Keep it available for audit comparison. Deprecation is fine; removal is a future CC after cohort validation lands.
2. **Do NOT modify the Drive distribution computation.** Aim CONSUMES the Drive buckets; it doesn't recompute them.
3. **Do NOT modify the Conviction score computation.** Aim CONSUMES the Conviction score.
4. **Do NOT modify the Movement strength computation.** Aim CONSUMES it.
5. **Do NOT modify the Grip score computation.** Aim is independent of Grip.
6. **Do NOT add new survey questions.** Per `feedback_minimal_questions_maximum_output`. Aim is derived from existing signals.
7. **Do NOT modify the per-quadrant prose templates beyond the Aim-aware register hint.** The user-facing prose for each quadrant stays as it is in current code; only the register hint that influences LLM-touched paragraphs is added.
8. **Do NOT modify CC-PRIMAL-COHERENCE, CC-PRODUCT-THESIS-CANON, CC-RELIGIOUS-REGISTER-RULES, CC-AGE-CALIBRATION, or CC-CRISIS-PATH-PROSE code.** This CC composes alongside; no edits to upstream.
9. **Do NOT bundle CC-TRAJECTORY-VISUALIZATION work.** The four-vector dashboard rendering (Aim → tolerance cone) is a separate CC.
10. **Do NOT change the order of constitution-building steps in `identityEngine.ts`.** Aim is computed after Drive / Conviction / Movement land; that order is canonical.
11. **Do NOT swap quadrant labels.** The labeling-vs-semantics resolution is to redefine Aim, not to relabel.

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/aimCalibration.audit.ts` (new — all 10 assertions pass)
- [ ] `npx tsx tests/audit/synthesis3.audit.ts` (extended — pass)
- [ ] All other existing audits remain green
- [ ] Cohort regeneration runs cleanly
- [ ] Jason fixture (when available) lands as Wisdom-governed with Aim ≥ 60

---

## Report-back format

1. **Summary** — files added/modified, line-count delta, audit pass count.
2. **Aim formula constants paste** — `AIM_WEIGHTS` and `RISK_FORM_HIGH_AIM` confirmed values.
3. **Cohort classification comparison** — table of all 24 fixtures with legacy `risk-bucket %`, new `aim score`, legacy letter, new letter, and `changed?` flag. Highlights where the new score reclassifies users.
4. **Quadrant semantic test cases** — for each of the 4 synthetic quadrant cases, paste the input + computed `riskFormFromAim` output. Confirm label-semantics correctness.
5. **Jason validation case** — if available, Aim score and Risk Form letter for Jason fixture. Flag if Aim < 60 (formula needs reweighting).
6. **Sample LLM paragraphs** — 3 paragraphs from different quadrants showing the Aim-aware register working (e.g., Wisdom-governed paragraph vs Reckless-fearful paragraph).
7. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
8. **Out-of-scope verification** — confirm none of the 11 DO-NOT items were touched.
9. **Recommendations for follow-on work** — including:
   - Suggested re-weighting of `AIM_WEIGHTS` if Jason validation fails
   - Cohort fixtures where the Aim composite produces unexpected results (need investigation)
   - Whether the legacy `computeRiskForm()` should be removed in a follow-on CC

---

**Architectural test for this CC:** Jason's profile lands as Wisdom-governed with Aim ≥ 60 and Grip 21. The four-quadrant semantic correctness test passes for synthetic cases. The cohort distribution shifts in a way that's interpretable and discussable rather than chaotic. If all three land, the Aim score is doing real work and the existing labels become semantically correct.
