# Trajectory Model Variable Inventory

**Origin:** Jason's request 2026-05-10 — "show me the whole inventory of contributing variables that create the trajectory / length scores." This document maps every score in the 50° trajectory model back to its source signals and survey questions.

**Purpose:** A canonical reference for any future CC that touches trajectory math. When recalibrating a score, this doc tells you what would shift if you change a weight.

---

## The Architecture in One Diagram

```
Survey answers (Q-T1-8, Q-S1-3, Q-A1-2, Q-V1, Q-E1, Q-X3-4, Q-GS1, Q-GRIP1, Q-Stakes1, Q-3C1, Q-Ambition1, Q-I1-3, Q-P1-2, Q-F1-2, Q-Formation, OCEAN)
        ↓
Signal pool (76 named signals, e.g., building_energy_priority, soul_beloved_named, grips_control)
        ↓
Intermediate scores (Goal, Soul, Vulnerability) — weighted predicate sums
        ↓
Adjusted Goal/Soul (asymmetric lift from Vulnerability)
        ↓
Movement (Direction angle + Length strength) — polar coordinates of adjusted Goal/Soul
        ↓
Grip score (defensive register, 7 components)
        ↓
Drive distribution (Cost/Coverage/Compliance buckets, sum to 100%)
        ↓
Conviction temperature (high/moderate/low/unknown) ← from Q-I2/Q-I3
        ↓
Aim score (compliance + cost + conviction + movement strength, weighted)
        ↓
Risk Form letter (Aim × Grip 2×2)
        ↓
Primal cluster (7 Primal Questions, calibrated by 12 shape rules)
        ↓
Coherence reading (trajectory vs crisis path)
```

---

## 1. Goal Score (0–100)

**Computed in:** `lib/goalSoulGive.ts → computeGoalScore`

**Inputs (11 predicates):**

| Source | Trigger | Weight |
|---|---|---|
| Q-E1-outward top-1 | building / solving / restoring energy priority | +25 |
| Q-A1 | proactive_creator OR responsibility_maintainer | +15 |
| Q-A2 goal-coded | proactive_creator / exploration_drive / stability_restoration | +10 |
| Q-3C1 | cost_drive top-1 or top-2 | +15 |
| Q-Ambition1 | success / legacy / wealth in top-2 | +15 |
| Q-T te/se top-2 | normalized count of te/se signals at rank ≤2, capped at 1.0 | × 10 |
| Q-S1 | stability_priority in top-2 | +5 |
| Conviction signals (Q-P1, Q-P2) | high_conviction_under_risk OR high_conviction_expression | +5 |
| Q-GS1 | goal_completion_signal: top-1 (+6), top-3 (+3) | direct |
| Q-GS1 | durable_creation_signal: top-1 (+5), top-3 (+2) | direct |
| Q-V1 | goal_logic_explanation: top-1 (+3), top-2 (+1) | direct |

**Output:** sum of weights, clamped to [0, 100]. Evidence trace: `goalSoulGive.evidence.goalDrivers`.

---

## 2. Soul Score (0–100)

**Computed in:** `lib/goalSoulGive.ts → computeSoulScore`

**Inputs (12 predicates):**

| Source | Trigger | Weight |
|---|---|---|
| Q-E1-inward top-1 | caring_energy_priority | +25 |
| Q-A2 | relational_investment | +15 |
| Q-S2 top-2 | compassion / mercy / family / faith — highest-ranked at 1.0 (top-1) or 0.6 (top-2) | × 20 |
| Q-S1 top-2 | peace / loyalty intersection | +10 |
| Q-X4-relational top-1 | partner / family / friend | +10 |
| Q-T fe/fi top-2 | normalized count, capped at 1.0 | × 10 |
| Q-S3-close OR Q-S3-wider | non-self top-1 / nonprofits top-1 | +10 |
| Q-GS1 | soul_people_signal: top-1 (+6), top-3 (+3) | direct |
| Q-GS1 | soul_calling_signal: top-1 (+6), top-3 (+3) | direct |
| Q-GS1 | creative_truth_signal: top-1 (+4), top-3 (+2) | direct |
| Q-GS1 | durable_creation_signal: top-1 (+3), top-3 (+1) | direct (synth with Goal) |
| Q-V1 | soul_beloved_named: top-1 (+10), top-2 (+6) | direct **strong lift** |

**Output:** sum of weights, clamped to [0, 100]. Evidence: `goalSoulGive.evidence.soulDrivers`.

---

## 3. Vulnerability Score (−50 to +50)

**Computed in:** `lib/goalSoulGive.ts → computeVulnerabilityScore`

**Engine-internal Z-axis** that modulates the asymmetric lift on adjusted Goal/Soul.

**Positive contributions:**

| Source | Trigger | Weight |
|---|---|---|
| Q-I1 freeform | text ≥40 chars OR conviction_under_cost signal | +20 |
| Q-P1 | high_conviction_expression | +15 |
| Q-P2 | high_conviction_under_risk | +15 |
| Q-X4-chosen | own_counsel NOT rank-1 (openness to other sources) | +15 |
| OCEAN openness proxy | ≥4 openness-keyed signals present | +20 |
| Q-V1 | vulnerability_open_uncertainty top-1 (+12), top-2 (+7) | direct |
| Q-V1 | sacred_belief_connection top-1 (+8), top-2 (+4) | direct |
| Q-V1 | soul_beloved_named top-1 (+5), top-2 (+2) | direct |

**Inverse penalty (capped at −15):** hides_belief, adapts_under_economic_pressure, adapts_under_social_pressure (Q-F1, Q-F2, Q-Stakes1).

**Q-V1 negative direct:** vulnerability_deflection top-1 (−10) / top-2 (−5); performance_identity top-1 (−6) / top-2 (−3); goal_logic_explanation top-1 (−3) / top-2 (−1).

**Output:** `(positive − penalty − 35)`, clamped to [−50, +50].

---

## 4. Asymmetric Lift (Vulnerability → Adjusted Goal/Soul)

**Computed in:** `lib/goalSoulGive.ts` lines 199–211

```
vNorm = (vulnerability + 50) / 100  // 0 to 1
goalLiftFactor = 0.85 + (0.30 × vNorm)
soulLiftFactor = 0.60 + (0.80 × vNorm)
adjustedGoal = clamp(rawGoal × goalLiftFactor, 0, 100)
adjustedSoul = clamp(rawSoul × soulLiftFactor, 0, 100)
```

**Effect:** Low vulnerability suppresses Soul more than Goal. Canonical: high output + thin love-line + low vulnerability → reads as "Work without Presence."

---

## 5. Movement Strength (0–100)

**Computed in:** `lib/goalSoulMovement.ts → computeLength`

```
length = clamp(sqrt(adjustedGoal² + adjustedSoul²) / sqrt(2), 0, 100)
```

**Descriptor:** 0–30 short / 30–60 moderate / 60–85 long / 85–100 full.

---

## 6. Direction (0–90°)

**Computed in:** `lib/goalSoulMovement.ts → computeAngle`

```
angle = clamp(atan2(adjustedSoul, adjustedGoal) × 180/π, 0, 90)
```

**Descriptor:** 0–35° Goal-leaning / 35–55° balanced / 55–90° Soul-leaning.

---

## 7. Grip Score (0–100) — defensive register

**Computed in:** `lib/goalSoulGive.ts → computeGrippingPull`

| Source | Trigger | Weight |
|---|---|---|
| Q-Stakes1 | money/job/reputation top-1 | +25 (once) |
| Q-Stakes1 | money/job/reputation top-2 (not top-1) | +15 (once) |
| Pressure-adaptation cluster | each of: hides_belief, adapts_economic, adapts_social, chaos_exposure (cap 30) | +10 each |
| Vulnerability < 0 | (engine-internal Z) | +25 |
| Raw Soul < 35 | (thin love-line) | +20 |
| Q-GRIP1 direct grips_* | rank 1 (+8) / rank 2 (+5) / rank 3 (+3) / rank 4+ (+1), cap 25 | direct |
| Q-GS1 | gripping_proof_signal: top-1 (+5), top-2/3 (+2) | direct |
| Q-V1 | performance_identity: top-1 (+4), top-2 (+2) | direct |

**Output:** sum, clamped to [0, 100]. Evidence: `goalSoulGive.grippingPull.signals[]`.

---

## 8. Drive Distribution (3C's buckets, 0–100 each, sum to 100%)

**Computed in:** `lib/drive.ts`

Three buckets: **cost**, **coverage**, **compliance**. Engine-derived from how the user's signals allocate across cost/coverage/compliance-tagged signals. Independent computation from Goal/Soul score predicates.

**Per architectural canon (Jason 2026-05-10):**
- Cost bucket = Goal axis substance
- Coverage bucket = Soul axis substance
- Compliance bucket = Wisdom-governed Grip / Aim axis substance

**Empirical issue (Jason fixture, 2026-05-10):** Goal=85 (high), Soul=53 (moderate), but Cost bucket≈22, Coverage≈55, Compliance≈22. **The trajectory components and Drive buckets are decoupled in the engine — they don't share a measurement substrate.** This is the issue CC-3CS-AXIS-ALIGNMENT is queued to investigate.

---

## 9. Conviction Temperature → Conviction Score

**Computed in:** `belief_under_tension.conviction_temperature` (derived from Q-I2/Q-I3)

**Mapping:** high=80, moderate=50, low=25, unknown=50.

**Coarseness flag:** the four-level mapping is a step function. Future CC-CONVICTION-CONTINUOUS-SCORE could derive a continuous score from BeliefUnderTension shape.

---

## 10. Aim Score (0–100)

**Computed in:** `lib/aim.ts → computeAimScore`

```
Aim = compliance × 0.30 + cost × 0.30 + conviction × 0.20 + movementStrength × 0.20
```

**Inputs:**
- `complianceBucket` (0–100) ← `drive.distribution.compliance`
- `costBucket` (0–100) ← `drive.distribution.cost`
- `convictionScore` (0–100) ← from temperature mapping above
- `movementStrength` (0–100) ← Movement strength

**Empirical issue:** because Cost and Compliance buckets are decoupled from Goal score (per #8 above), the Aim score for a Wisdom-governed shape can land low. Jason fixture: Aim 43.7 vs canonical Wisdom-governed expectation ≥60.

**Per architectural canon:** Aim should be Compliance-dominant (compliance × 0.5–0.7 rather than equally weighted with cost / conviction / movement). Adjustment proposal in CC-AIM-RECALIBRATION-COMPLIANCE-DOMINANT.

---

## 11. Risk Form (4-quadrant 2×2 letter)

**Computed in:** `lib/riskForm.ts → computeRiskFormFromAim`

**Axes:** Aim (X) × Grip (Y).
**Thresholds:** Aim ≥ 60 (high) | Grip ≥ 40 (high).

| Aim | Grip | Letter |
|---|---|---|
| High (≥60) | Low (<40) | Wisdom-governed |
| High (≥60) | High (≥40) | Reckless-fearful |
| Low (<60) | High (≥40) | Grip-governed (FUD) |
| Low (<60) | Low (<40) | Free movement (Drift) |

**Legacy:** the original `computeRiskForm` (compliance bucket × grip) is preserved but deprecated; new path uses `computeRiskFormFromAim`.

---

## 12. 7 Primal Questions Cluster

**Computed in:** `lib/gripTaxonomy.ts → derivePrimalCluster` + `lib/gripCalibration.ts → calibratePrimalCluster`

**Mechanism:** maps named-grip humanReadable strings → Primal Question scores.

**The 7 Primals + gifts:**
1. Am I safe? — wisdom
2. Am I secure? — stewardship
3. Am I loved? — tenderness
4. Am I wanted? — belonging
5. Am I successful? — excellence
6. Am I good enough? — humility, craft
7. Do I have purpose? — mission

**Scoring:**
- Each named-grip contributes +1.0 to its primary Primal and +0.5 to its secondary (where applicable)
- Top-3 selected; confidence ladder applied (high / medium-high / medium / low)

**Calibration (12 rules R1–R12):** post-derivation, 12 shape-aware rules apply weight deltas based on Lens dominant/auxiliary, top Compass, Risk Form letter, OCEAN A/C, Goal/Soul, vulnerability. Rules transparent; output preserves baseScores + calibrationDeltas + finalScores + appliedRules with rationale.

**Working-without-presence override** (CC-PRIMAL-COHERENCE-EXTENSION): fires before standard concern-rule when (Am I good enough? OR Am I successful?) AND Goal ≥ 80 AND Soul ≤ 20.

---

## 13. Primal Coherence (trajectory vs crisis path)

**Computed in:** `lib/primalCoherence.ts → computePrimalCoherence`

**Mechanism:** compares user's actual Goal/Soul against expected profile for their primary Primal.

**Per-Primal expected profile (PRIMAL_EXPECTED_PROFILE):**

| Primal | Goal range | Soul range | Concern rule |
|---|---|---|---|
| Am I safe? | {25, 100} | {25, 100} | both-axes (gap ≥5/5); flavor: withdrawal |
| Am I secure? | {40, 100} | {20, 100} | additive ≥10; flavor: longing-without-build |
| Am I loved? | {15, 100} | {40, 100} | additive ≥10; flavor: grasp-without-substance |
| Am I wanted? | {15, 100} | {35, 100} | additive ≥10; flavor: grasp-without-substance |
| Am I successful? | {55, 100} | {15, 100} | additive ≥12 (post-extension); flavor: longing-without-build |
| Am I good enough? | {40, 100} | {25, 100} | both-axes (gap ≥10/5); flavor: paralysis |
| Do I have purpose? | {35, 100} | {35, 100} | both-axes (gap ≥5/5); flavor: paralysis (override: restless-without-anchor when both <30) |

**Output:** pathClass (trajectory | crisis), crisisFlavor (one of 6 — including working-without-presence override), goalGap, soulGap, totalGap, rationale.

**Gating:** low-confidence Primal → defaults to trajectory (conservative).

---

## 14. Quadrant Placement (CC-071)

**Computed in:** `lib/goalSoulGive.ts → placeQuadrant`

Reads adjusted Goal/Soul (post asymmetric lift):

| Adj. Goal | Adj. Soul | Gripping cluster fires? | Quadrant |
|---|---|---|---|
| ≥50 | ≥50 | — | give |
| ≥50 | <50 | — | striving |
| <50 | ≥50 | — | longing |
| <50 | <50 | yes | gripping |
| <50 | <50 | no | neutral |

Low confidence → always neutral.

**Gripping cluster condition (all 4 must fire):**
1. Q-Stakes1 heavy (money/job/reputation top-1 or top-2; close_relationships NOT top-1)
2. Pressure-adaptation ≥2 of: hides_belief, adapts_economic, adapts_social, chaos_exposure
3. Vulnerability < 0
4. Thin Soul-line (caring_energy NOT top-1 on Q-E1-inward AND no compassion/mercy/family/faith in Q-S2 top-2)

---

## 15. Movement Quadrant (CC-SYNTHESIS-1A)

**Computed in:** `lib/movementQuadrant.ts → computeMovementQuadrant`

Reads adjusted Goal/Soul, threshold 50:

| Adj. Goal | Adj. Soul | Label |
|---|---|---|
| <50 | <50 | Drift |
| ≥50 | <50 | Work without Presence |
| <50 | ≥50 | Love without Form |
| ≥50 | ≥50 | Giving / Presence |

---

## Orchestration order (`lib/identityEngine.ts → buildInnerConstitution`)

1. `computeGoalSoulGive(signals, answers)` → raw/adjusted Goal/Soul, Vulnerability, Grip, quadrant
2. `detectGoalSoulPatterns(signals, goalSoulGive)` → cross-card heuristics
3. `computeMovement(...)` → angle, length, movement
4. `computeRiskForm(drive.distribution, gripScore)` → legacy 2×2 (kept for audit)
5. `computeMovementQuadrant(adjGoal, adjSoul)` → 4-label quadrant
6. `derivePrimalCluster(grippingPull.signals, calibrationContext)` → primary/secondary/tertiary + scores
7. `computePrimalCoherence(primalCluster, goal, soul)` → trajectory vs crisis
8. `computeAimScore(compliance, cost, conviction, movement)` → Aim composite
9. `computeRiskFormFromAim(aim, grip)` → Aim-based 2×2 (canonical)
10. `attachLlmGripParagraph` / `attachLlmPathMasterSynthesis` → cache lookups + fallbacks

---

## Known calibration issues (as of 2026-05-10)

1. **Cost/Compliance buckets decoupled from Goal/Aim measurement.** Jason fixture renders Aim 43.7 (Free movement) despite canonical Wisdom-governed shape. Cost bucket ≈22 despite Goal ≈85. CC-3CS-AXIS-ALIGNMENT queued to investigate.

2. **Conviction temperature is coarse 4-level mapping.** Step function (high=80, moderate=50, low=25, unknown=50). CC-CONVICTION-CONTINUOUS-SCORE queued for finer derivation.

3. **Aim formula is equal-weighted across compliance + cost + conviction + movement.** Per canon, compliance should dominate (compliance × 0.5-0.7). CC-AIM-RECALIBRATION-COMPLIANCE-DOMINANT queued.

4. **Cohort thinness on 4 of 7 Primals + Si/Se/Ti/Fi driver shapes.** CC-COHORT-EXPANSION-SI-SE queued.

5. **Rendering: chart visual unchanged from pre-CC-AIM era.** Tolerance cone, per-Primal Grip vector, age-line — all queued for CC-TRAJECTORY-VISUALIZATION which depends on AIM + AGE + CRISIS-PATH all landing first.
