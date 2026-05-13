# 50° Life Trajectory Model: Calculation Refinement Canon

**Origin:** Jason + Clarence 2026-05-10. Comprehensive architectural refinement of the trajectory math after CC-AIM-CALIBRATION shipped and surfaced the Cost/Compliance bucket decoupling from Goal/Aim measurement. Builds on `docs/canon/trajectory-model-inventory.md`.

**Status:** Canon. Source of truth for all subsequent trajectory-math CCs.

---

## Core Model (Canon)

```
Goal/Soul   = potential trajectory (bounded vector inside 0–100 field)
Aim         = precision cone + light governor
Grip        = defensive drag/distortion
7 Primals   = grammar of Grip
Path        = correction back toward 50°
```

**The model promises the user:**
> Where their life energy is aimed, how strong that movement is, how tightly they can hold the line, and what Grip pulls them back from purpose.

**Final canon sentence (Clarence + Jason 2026-05-10):**
> The 50° Life model is a bounded purpose-vector system. Goal/Soul defines potential trajectory. Aim defines precision and applies a light governor. Grip defines defensive drag. The 7 Primal Questions explain the emotional grammar of that drag. Path names the correction back toward purpose.

---

## §1 — Goal/Soul as Bounded Vector

Goal and Soul are NOT additive totals. A user with Goal=85, Soul=100 does not have movement of 185. They form a bounded vector in a 0–100 field.

```
potentialMovement = clamp(sqrt(goal² + soul²) / sqrt(2), 0, 100)
directionAngle    = clamp(atan2(soul, goal) × 180/π, 0, 90)
```

Example (Goal=85, Soul=100): direction ≈ 49.6°, potentialMovement ≈ 92.8 — a strong, near-ideal 50° trajectory.

> **Canon:** Goal/Soul is a bounded purpose vector. The angle shows direction. The length shows available integrated force.

---

## §2 — 50° (Not 45°) Is the Integration Band

45° is mathematical symmetry; 50° is the product canon. The ideal is *slightly Soul-guided work*: enough Goal to move, enough Soul to matter.

**Direction bands:**

| Range | Label |
|---|---|
| 0–30° | Low arc / Goal-heavy |
| 30–42° | Productive but under-integrated |
| 42–58° | **50° Life / integrated trajectory** |
| 58–70° | Soul-heavy / high arc |
| 70–90° | Vertical longing / insufficient forward motion |

The current 35–55° "balanced" band is too broad and 45°-centered.

---

## §3 — Quadrant Labels Use Threshold AND Angle

Current logic flattens to "Giving / Presence" whenever Goal≥50 AND Soul≥50, regardless of angle. Refined logic uses both:

```ts
if (goal >= 50 && soul >= 50 && angle >= 42 && angle <= 58)  → "Giving / Presence"
if (goal >= 50 && soul >= 50 && angle < 42)                  → "Goal-led Presence"
if (goal >= 50 && soul >= 50 && angle > 58)                  → "Soul-led Presence"
if (goal >= 50 && soul < 50)                                  → "Work without Presence"
if (goal < 50 && soul >= 50)                                  → "Love without Form"
if (goal < 50 && soul < 50 && gripClusterFires)               → "Gripping"
if (goal < 50 && soul < 50 && !gripClusterFires)              → "Drift"
```

> **Canon:** "Giving / Presence" requires high Goal AND high Soul AND trajectory angle in the 50° integration band.

---

## §4 — Potential Movement vs Usable Movement

Two distinct concepts, both rendered:

```
potentialMovement = bounded Goal/Soul vector length (raw available force)
usableMovement    = potentialMovement × gripDragModifier × aimGovernorModifier
```

> **Canon:** Goal/Soul produces Potential Movement. Aim and Grip together produce Usable Movement.

---

## §5 — Aim Has Two Functions

Aim is not just a quadrant axis. It plays two distinct roles:

**1. Aim improves accuracy** — high Aim narrows the dotted tolerance cone; low Aim widens it. Tolerance cone primary driver.

**2. Aim lightly limits movement** — wise governance costs some raw energy. But Aim should limit at roughly **one-third** the rate of Grip.

> **Canon:** Aim is a light governor. Grip is defensive drag. Aim limits at ~⅓ the rate of Grip.
>
> **Distinction:** *Grip is waste. Aim is cost.* Grip consumes energy because fear pulls the person backward. Aim consumes energy because steering, judgment, and restraint require effort. A car's brakes are not the same as a flat tire.

---

## §6 — Tolerance Cone Formula

```ts
function computeToleranceDegrees(aim: number): number {
  if (aim >= 85) return 4;
  if (aim >= 70) return 7;
  if (aim >= 55) return 10;
  if (aim >= 40) return 15;
  return 20;
}
```

Jason fixture (Aim=43.7) → tolerance ±15° → render as `32° ± 15°`.

---

## §7 — Grip Drag Formula

```ts
function computeGripDragModifier(grip: number): number {
  const maxGripDrag = 0.45;
  return 1 - ((grip / 100) * maxGripDrag);
}
```

Grip=21 → modifier 0.9055 → ~9.5% drag.

---

## §8 — Aim Governor Formula

```ts
function computeAimGovernorModifier(aim: number): number {
  const maxAimGovernor = 0.15;
  return 1 - ((aim / 100) * maxAimGovernor);
}
```

Aim=43.7 → modifier 0.934 → ~6.6% governance cost.

(Future refinement may use a sweet-spot curve; for now linear is acceptable.)

---

## §9 — Usable Movement Composite

```ts
usableMovement =
  potentialMovement
  × computeGripDragModifier(grip)
  × computeAimGovernorModifier(aim);
```

Jason fixture: 70.8 × 0.9055 × 0.934 ≈ 59.9.

**Recommended display:**

```
Potential Movement: 70.8
Usable Movement:    59.9
Direction:          32°
Tolerance:          ±15°
Grip Drag:          light/moderate
Aim Governor:       modest
```

---

## §10 — 3C Strength + 3C Mix (Two Layers)

The current model forces Cost/Coverage/Compliance to sum to 100%. This creates artificial collapse: a user high on all three axes has one bucket look low because of the forced distribution.

**Recommended split:**

**A. 3C Strengths (independent 0–100 scores, do not sum to 100):**
```
CostStrength
CoverageStrength
ComplianceStrength
```

**B. 3C Mix (relative emphasis, sums to 100):**
```
CostMix + CoverageMix + ComplianceMix = 100
```

> **Canon:** 3C Strengths measure capacity/substance. 3C Mix measures relative emphasis. **Interpretive math uses Strengths.** Pie-chart language may use Mix.

---

## §11 — Cost / Coverage / Compliance Reframed

| Bucket | What it actually means |
|---|---|
| Cost | work, effort, output, craft, building, responsibility, economic reality, consequence — Goal-axis substance |
| Coverage | love, care, presence, mercy, family, belovedness, human obligation — Soul-axis substance |
| Compliance | wise risk, discernment, governance, restraint, moral/risk calibration, trajectory line-holding |

> **Canon:** "Compliance" should not mean timid rule-following. It should mean wise risk, discernment, governance, restraint, and trajectory calibration.

---

## §12 — Aim Formula Rebuilt

Current Aim is decoupled from Goal/Soul because it leans on Cost and Compliance buckets that don't share substrate with the trajectory components.

**Proposed structure:**

```ts
Aim =
  WiseRiskStrength       × 0.40
+ ConvictionClarity      × 0.20
+ GoalSoulCoherence      × 0.20  // closeness to 50° integration band
+ MovementStrength       × 0.10
+ ResponsibilityIntegration × 0.10
```

**New derivations required:**
- `WiseRiskStrength` — replaces ComplianceStrength as the wise-risk axis
- `ConvictionClarity` — continuous derivation from BeliefUnderTension shape (replaces 4-level temperature mapping)
- `GoalSoulCoherence` — closeness to 50° band (e.g., `1 - abs(angle - 50) / 50` or similar)
- `ResponsibilityIntegration` — engaged stakes without defensive collapse

This makes Aim a *guidance/tolerance score*, not a Drive-bucket blend.

---

## §13 — Stakes ≠ Grip

High stakes (money, job, reputation, dependents, fiduciary duty, public office) are not automatically FUD. A leader with real obligations *should* care about those things. They are stakes, not fear.

**Recommended split:**

```ts
StakesLoad     = what is actually on the line (objective)
DefensiveGrip  = how much the stakes hijack the person (subjective)
```

**Grip composition:**

```ts
Grip = DefensiveGrip × StakesAmplifier   // multiplicative
```

NOT:

```ts
Grip = DefensiveGrip + StakesLoad        // additive — wrong
```

> **Canon:** High stakes amplify Grip *only when defensive signals are also present*. Stakes alone are not fear.

---

## §14 — Risk Form Labels Refined

| Aim | Grip | Current label | Refined label |
|---|---|---|---|
| High | Low | Wisdom-governed | **Open-Handed Aim** |
| High | High | Reckless-fearful | **White-Knuckled Aim** |
| Low | High | Grip-governed (FUD) | Grip-Governed (kept) |
| Low | Low | Free movement / Drift | **Ungoverned Movement / Drift** |

**Better prose for low Aim + low Grip:**

> Grip is low, so little energy appears trapped in fear or defensive overcontrol. Aim is also low-to-moderate, which means the trajectory may be freer than it is governed. The next growth edge is not more force, but better calibration.

---

## §15 — Visual Rendering

The trajectory chart shows four elements:

1. **Potential trajectory** — full raw Goal/Soul vector (e.g., 32° / 70.8)
2. **Usable trajectory** — shorter solid line after Aim + Grip effects (e.g., 32° / 59.9)
3. **Dotted tolerance cone** — derived from Aim (e.g., 32° ± 15°)
4. **Grip drag marker** — small at low Grip, stronger pullback at high Grip

**Important visual correction:** do NOT render "Gripping" as a large lower-left label unless the user is actually in the Gripping quadrant. At Grip=21, render a small drag marker, not a competing region label.

---

## §16 — 7 Primal Questions Stay Under Grip

The 7 Primal Questions are not the destination. They explain the emotional grammar of Grip.

> **Canon:** The 7 Primal Questions are not the destination. They are the Grip patterns that bend the trajectory.

```
surfaceGrip + shapeContext → primalQuestionWeights   ✓
surfaceGrip → primalQuestion                         ✗
```

The shape-aware calibration direction (per CC-GRIP-CALIBRATION) is correct. Preserve baseScores, calibrationDeltas, finalScores, appliedRules, rationale, confidence.

---

## §17 — User-Facing Interpretation

> You are aimed here.
> Your potential movement is this.
> Your usable movement is this after Aim and Grip.
> Your tolerance cone is this wide.
> Your Grip explains what pulls you off course.
> Your Path explains how to return to purpose.

---

## §18 — Required CC Work (the implementation queue)

This canon document drives the next round of CCs. See:
- CC-3CS-AXIS-ALIGNMENT (Phase 1: Strength/Mix split + axis alignment)
- CC-MOVEMENT-LIMITER + CC-AIM-FORMULA-REBUILD (Phase 2: usable movement, tolerance, new Aim composition, StakesLoad split)
- CC-LABELS-VISUAL-REFINEMENT (Phase 3: quadrant labels, Risk Form labels, chart rendering)

Test fixtures required (see §19 in source).

---

## §19 — Provenance

Jason + Clarence, 2026-05-10. Built on observed Aim 43.7 fixture data (Free movement classification) divergent from canonical Wisdom-governed expectation. Refines all previously-queued CCs related to Aim recalibration, 3C axis alignment, conviction continuous score, and trajectory visualization.
