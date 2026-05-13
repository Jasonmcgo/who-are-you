# CC-GRIP-SIGNAL-WEIGHTING — Identity-Weighted qGrip1 + Relational-Stakes Routing + Q-3C2 Channel

> **▶ DEPENDENCY — CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT + CC-GRIP-WIRING-AND-FLOOR-CALIBRATION + CC-SHAPE-AWARE-PROSE-ROUTING must all be landed and on `prompts/completed/`. Verify sweep is 32/32 green before starting.**

**Origin:** Cohort spot-calibration 2026-05-11 surfaced a structural collapse in `lib/gripDecomposition.ts::computeDefensiveGrip`. Two genuinely different lived shapes (Daniel — SJ/stewardship-coded, top grips Control + Money + Plan; Cindy — ESFP/relational, top grips Being-needed + Reputation + Approval) produce *identical* defensiveGrip = 31.0 and identical StakesLoad = 70.0, therefore identical composed Grip = 41.9 with identical amplifier = 1.35.

Root cause traced to two lines:

1. **`gripDecomposition.ts:154-163` — qGrip1 scoring is position-symmetric and signal-blind.** The loop assigns 8/5/3/1/1/1/1/1 to ranks 1/2/3/4-8 regardless of *which* grip signal occupies that rank. Anyone who ranks all 8 Q-GRIP1 items produces qGrip1 = 21. Identity of the grips doesn't matter.

2. **`gripDecomposition.ts:96-105` — StakesLoad weights only top-3 of HEAVY_STAKES.** Daniel's Q-Stakes1 (job@4, safety@5) and Cindy's (safety@4, job@5) differ only at positions outside the weighted band, so both score 70.

Per Jason's stated GSG-master canon (the trajectory math is the over-arching priority), the gsg model should differentiate these two shapes because the *signals* differentiate them. Canon §13 explicitly distinguishes "classically defensive" grips (control / plan-that-used-to-work / being-right / certainty / money-as-fear) from relational stakes grips (being-needed / approval / reputation). The current code treats them as equivalent inputs to DefensiveGrip. They are not equivalent shapes.

This CC implements three principled (not data-fit) fixes:

**A. Signal-identity weighting in qGrip1** — classically defensive grips weighted heavier; relational grips weighted lighter (they belong partly to StakesLoad, see B).

**B. Route relational grips into StakesLoad** — when being-needed / approval / reputation appear in Q-GRIP1 top-3, augment StakesLoad. Relational stakes are stakes, not pure defensive register.

**C. Wire Q-3C2 rank-1 into Grip composition** — investigatory: confirm whether "what I protect first when crowded" currently feeds Grip. If not, wire rank-1 of Q-3C2 into either DefensiveGrip (when rank-1 is Money/margin or Safety/rules — classical defensive) or StakesLoad (when rank-1 is Reputation or Progress-on-building — stakes-class). Channel decision is per-option, see Segment C.

**Method discipline:** weight-table tuning + small signal-routing additions. No engine math invented. The §13 multiplicative composition stays; only the inputs change shape. Cache stability preserved via the established legacy-letter re-computation pattern.

**Scope frame:** CC-medium, ~60–90 min executor time. Three localized changes in one file (`lib/gripDecomposition.ts`) plus audit. Cache strategy: Option B (no regen).

**Cost surface:** $0 — no LLM calls, no cache regen.

---

## Embedded context

### What the §13 composition already does (canonical, do not touch)

```ts
Grip = DefensiveGrip × StakesAmplifier
StakesAmplifier = defensive < 25 ? 1.0 : 1 + (stakes/100) × 0.5
```

`DEFENSIVE_GRIP_AMPLIFIER_FLOOR = 25` (CC-GRIP-WIRING). `MAX_STAKES_AMPLIFICATION = 0.5` (canonical).

### The current DefensiveGrip composition

```ts
DefensiveGrip = pressureAdaptation + vulnerabilityNegative + thinSoul
              + qGrip1 + qGS1ProvingProof + qV1PerformanceIdentity
```

The qGrip1 component is the collapse point. Today:
- rank 1 → 8 points
- rank 2 → 5 points
- rank 3 → 3 points
- rank 4-8 → 1 point each
- Cap at 25

Identity-blind. Any user ranking all 8 grips lands at qGrip1 = 21.

### The qGrip1 / Q-GRIP1 signal IDs

```ts
const Q_GRIP1_IDS: SignalId[] = [
  "grips_control",
  "grips_security",
  "grips_reputation",
  "grips_certainty",
  "grips_old_plan",
  "grips_comfort",
  "grips_approval",
  "grips_neededness",
];
```

### Daniel and Cindy as the diagnostic pair

| User | Q-GRIP1 top-3 | Q-Stakes1 top-3 | Current Defensive | Current StakesLoad | Current Composed |
|---|---|---|---|---|---|
| Jason real fixture | Control(1) Money(2) Right(3)* | Close-rel(1) Money(2) Rep(3) | 21 | 10 | 21 (amp 1.0, below floor) |
| Daniel real answers | Control(1) Money(2) Plan(3) | Close-rel(1) Money(2) Rep(3) | 31 | 70 | 41.9 (amp 1.35) |
| Cindy real answers | Needed(1) Rep(2) Approval(3) | Close-rel(1) Money(2) Rep(3) | 31 | 70 | 41.9 (amp 1.35) |

*Jason's specific Q-GRIP1 ranking is whatever his fixture encodes — executor should verify, not assume.

Post-CC projection (after Segments A + B):

| User | Defensive (proj) | StakesLoad (proj) | Composed (proj) |
|---|---|---|---|
| Jason | ~20–22 (low defensive) | ~10–15 (low stakes) | ~21 (below floor, amp 1.0) |
| Daniel | ~37 (control + money + plan = classical defensive weighted up) | ~70 (heavy stakes top-3) | ~50 (amp 1.35) |
| Cindy | ~22–25 (relational top-3 weighted down; relational-grips also route to stakes) | ~80–85 (relational grips augment) | ~32–37 (amp 1.40) |

Daniel and Cindy diverge by 13–18 composed points instead of matching exactly. Their *trajectories* now tell visibly different stories. Jason's stays unchanged.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/gripDecomposition.ts` | MODIFY | Segments A + B + C. Add `Q_GRIP1_DEFENSIVE_WEIGHTS` table; refactor qGrip1 loop to consume weights; add relational-grip → StakesLoad routing; investigate + wire Q-3C2 rank-1. |
| `lib/identityEngine.ts` | MAYBE MODIFY | If Segment C requires passing additional signals into `computeDefensiveGrip` or `computeStakesLoad`, plumb at the call site. |
| `tests/audit/gripSignalWeighting.audit.ts` | NEW | 13 audit assertions. |

### Segment A — Signal-identity weights for qGrip1

Add a canonical weight table at module top:

```ts
// Per canon §13 — classically defensive grips weighted higher than
// relational grips. Relational grips (being-needed, approval, reputation)
// route partly to StakesLoad (Segment B) and are weighted lower here.
//
// Weights are canon-anchored, not data-fit. They reflect the §13
// distinction between defensive register (control, certainty, plan,
// money-as-fear) and stakes register (relational obligations).
export const Q_GRIP1_DEFENSIVE_WEIGHTS: Record<SignalId, number> = {
  grips_control:     1.5,  // classical defensive — highest
  grips_certainty:   1.4,  // being-right under pressure
  grips_security:    1.3,  // money-as-fear (money-as-stake is in StakesLoad)
  grips_old_plan:    1.2,  // pattern-rigidity under pressure
  grips_comfort:     0.6,  // avoidance, not defensive collapse
  grips_neededness:  0.7,  // relational — partly stakes (Segment B)
  grips_approval:    0.6,  // relational — partly stakes (Segment B)
  grips_reputation:  0.5,  // almost entirely stakes register
};
```

Refactor the qGrip1 loop:

```ts
let qGrip1Raw = 0;
for (const id of Q_GRIP1_IDS) {
  const rank = rankOfSignalFromQuestion(signals, id, "Q-GRIP1");
  if (rank === undefined) continue;
  const weight = Q_GRIP1_DEFENSIVE_WEIGHTS[id] ?? 1.0;
  let positionScore: number;
  if (rank === 1) positionScore = 8;
  else if (rank === 2) positionScore = 5;
  else if (rank === 3) positionScore = 3;
  else positionScore = 1;
  qGrip1Raw += positionScore * weight;
}
const qGrip1 = Math.min(25, Math.round(qGrip1Raw * 10) / 10);
```

Position scoring stays the same (8/5/3/1) — only identity weighting is added.

**Cap consideration:** the current cap 25 will be reached or exceeded only when classical-defensive grips occupy top-3. With weights 1.5/1.4/1.3 the max top-3 is 8×1.5 + 5×1.4 + 3×1.3 = 12 + 7 + 3.9 = 22.9 plus 5 lower-rank ones (assumed weight 1.0 average) = ~27.9. Cap at 25 truncates the high end gently — keep it. If cohort review shows the cap is too tight, raise in a follow-up CC.

### Segment B — Relational-grip → StakesLoad routing

Add a small bump to `computeStakesLoad` when relational grips appear in Q-GRIP1 top-3. The rationale: per canon §13, "high stakes amplify Grip only when defensive signals are also present" — but the stakes themselves include relational obligations. Cindy's "being-needed" is a stake (social belonging on the line); the engine currently doesn't read it as one.

In `computeStakesLoad(signals)`, after computing the heavy-stakes-from-Q-Stakes1 base score:

```ts
// Segment B — relational grips augment StakesLoad when in Q-GRIP1 top-3.
// Per canon §13: relational grips name relational stakes, which belong
// to the StakesLoad substrate alongside heavy material stakes.
const RELATIONAL_GRIP_STAKES_BUMP: Record<SignalId, number> = {
  grips_neededness: 12,   // being-needed @ rank 1
  grips_approval:   10,   // approval @ rank 1
  grips_reputation:  8,   // reputation @ rank 1 (already partly in HEAVY_STAKES)
};

let relationalStakesBump = 0;
for (const id of ["grips_neededness", "grips_approval", "grips_reputation"] as const) {
  const rank = rankOfSignalFromQuestion(signals, id, "Q-GRIP1");
  if (rank === undefined) continue;
  const base = RELATIONAL_GRIP_STAKES_BUMP[id] ?? 0;
  // Scale by rank: rank 1 full, rank 2 60%, rank 3 30%, else 0.
  const rankScale = rank === 1 ? 1.0 : rank === 2 ? 0.6 : rank === 3 ? 0.3 : 0;
  relationalStakesBump += base * rankScale;
}

score += relationalStakesBump;
```

Apply the same clamp(0, 100) at the end of the function.

For Daniel (no relational grips in top-3): bump = 0, StakesLoad stays at 70.
For Cindy (Needed@1, Reputation@2, Approval@3): bump = 12×1.0 + 8×0.6 + 10×0.3 = 12 + 4.8 + 3 = 19.8 → StakesLoad rises from 70 to ~90 (clamped). Amp 1.45 instead of 1.35. Composed = 25 × 1.45 = ~36 instead of 31 × 1.35 = 41.9.

**Note the unintuitive direction:** Cindy's composed Grip might *decrease* slightly even as her StakesLoad rises, because her defensiveGrip drops MORE under Segment A weighting. Both moves are canon-correct: Cindy's grip is real but smaller-than-the-old-additive-formula said, and routed more honestly through stakes-amp.

### Segment C — Q-3C2 rank-1 channel

**Investigatory first.** Grep `lib/identityEngine.ts` and `lib/gripDecomposition.ts` for any consumer of `Q-3C2` signals. Determine whether Q-3C2 rank-1 currently feeds Grip composition at all.

Q-3C2 options and proposed channel routing:

| Q-3C2 rank-1 option | Defensive register? | Stakes register? | Routing |
|---|---|---|---|
| Money / margin / financial options | classical defensive (money-as-fear) | also stakes | bump DefensiveGrip + small StakesLoad bump |
| Time / presence with dependents | care, not defensive | mild stake (relational) | small StakesLoad bump only |
| Safety / rules / risk control | classical defensive (control register) | — | bump DefensiveGrip |
| Progress on the thing I am building | not defensive | mild stake (achievement) | small StakesLoad bump only |
| Rest / health / recovery | self-care, not defensive | — | no bump |
| Reputation or standing with important people | relational defensive | stake (already counted) | small StakesLoad bump |

Proposed weight: 5 points to the appropriate substrate, single hit only (not cumulative across positions — only rank-1 fires).

```ts
// Segment C — Q-3C2 rank-1 channel.
const Q3C2_GRIP_CHANNEL: Record<SignalId, "defensive" | "stakes" | "both" | "none"> = {
  protects_money_margin:    "both",    // +5 defensive, +5 stakes
  protects_safety_rules:    "defensive", // +5 defensive
  protects_reputation_q3c2: "stakes",  // +5 stakes
  protects_dependents_time: "stakes",  // +5 stakes (small)
  protects_building_progress: "stakes", // +5 stakes (small)
  protects_rest_health:     "none",    // 0
};
```

Executor verifies the actual Q-3C2 signal IDs and adjusts as needed. The exact signal ID names should match what `lib/signals.ts` or the Q-3C2 derivation produces.

For Daniel (Q-3C2 #1 = Money/margin): defensive +5, stakes +5. Defensive 37 → 42, stakes 70 → 75. Amp 1.375. Composed = 42 × 1.375 = ~58.
For Cindy (Q-3C2 #1 = Time/presence with dependents): defensive +0, stakes +5. Defensive 25, stakes ~85. Amp 1.425. Composed = 25 × 1.425 = ~36.

Daniel-Cindy gap widens to ~22 points. Differentiation restored.

---

## Audit assertions (13 NEW)

In `tests/audit/gripSignalWeighting.audit.ts`:

1. **`qgrip1-uses-identity-weights`** — source contains `Q_GRIP1_DEFENSIVE_WEIGHTS` table with entries for all 8 Q_GRIP1_IDS; weights vary (max ÷ min ≥ 2.0).
2. **`qgrip1-classical-defensive-weights-higher`** — `grips_control`, `grips_certainty`, `grips_security`, `grips_old_plan` all have weights ≥ 1.2 in the table.
3. **`qgrip1-relational-grips-weights-lower`** — `grips_neededness`, `grips_approval`, `grips_reputation` all have weights ≤ 0.7 in the table.
4. **`qgrip1-loop-consumes-weights`** — refactored loop multiplies positionScore by weight per signal.
5. **`relational-grips-augment-stakes`** — `computeStakesLoad` source contains `RELATIONAL_GRIP_STAKES_BUMP` and applies it when relational grips appear in Q-GRIP1 top-3.
6. **`q3c2-channel-wired`** — source for `computeDefensiveGrip` OR `computeStakesLoad` references Q-3C2 signals; if not, this assertion FAILS with a clear "Q-3C2 not yet wired" message so the gap is visible (canon-faithful flag).
7. **`daniel-cindy-defensive-diverge`** — synthetic Daniel shape (top-3: Control + Money + Plan) produces defensiveGrip ≥ Cindy synthetic shape (top-3: Needed + Reputation + Approval) by at least 10 points.
8. **`daniel-cindy-composed-diverge`** — synthetic Daniel composed Grip exceeds synthetic Cindy composed Grip by at least 10 points.
9. **`cohort-defensive-variance-increased`** — cohort std-dev of defensiveGrip after this CC > pre-CC std-dev (audit prints both for cohort review). Floor: post-CC std-dev ≥ 8 across the 24 fixtures.
10. **`cohort-composed-variance-increased`** — same for composed Grip.
11. **`jason-fixture-regression`** — Jason fixture composed Grip stays within ±5 of pre-CC value (was 21). Jason's grips are low-volume; weighting shouldn't move him much.
12. **`amplifier-floor-unchanged`** — `DEFENSIVE_GRIP_AMPLIFIER_FLOOR === 25`. `MAX_STAKES_AMPLIFICATION === 0.5`.
13. **`composition-still-multiplicative`** — for every cohort fixture, `gripReading.score ≈ clamp(defensiveGrip × amplifier, 0, 100)` within ±0.2.
14. **`cache-stability`** — synthesis3 and gripTaxonomy hash inputs continue to consume legacy-Grip-derived Risk Form letter, so cohort cache stays byte-stable. ($0 regen.)

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify the §13 multiplicative composition formula** (`computeStakesAmplifier`, `computeGrip`). Only the substrates feeding them change.
2. **Do NOT modify `DEFENSIVE_GRIP_AMPLIFIER_FLOOR` (25) or `MAX_STAKES_AMPLIFICATION` (0.5).** Both are canonical post-CC-GRIP-WIRING.
3. **Do NOT modify `computeAimScore` or `AIM_WEIGHTS`.** Aim formula stays locked.
4. **Do NOT modify Movement Limiter formulas** (`computeGripDragModifier`, `computeAimGovernorModifier`, `computeToleranceDegrees`).
5. **Do NOT modify the 12-label MovementQuadrantLabel union or Grip-aware twin gating.**
6. **Do NOT modify Risk Form letter labels or thresholds.**
7. **Do NOT modify the trajectory chart layout, viewBox, legend, or readout structure.**
8. **Do NOT modify LLM system prompts or prose anchors.** Cache hashes stay byte-stable per the established legacy-letter pattern.
9. **Do NOT add new question-bank items.** Q-3C2 already exists; this CC only wires its rank-1 into Grip composition.
10. **Do NOT modify the Q-S3-wider "Social life" option split** (queued separately as Q-S3-WIDER-SPLIT option-refinement).
11. **Do NOT modify the Q-E1-outward "Building/creating" option split** (queued separately as Q-E1-BUILDING-CREATING-SPLIT option-refinement).
12. **Do NOT modify the three-profile archetype routing (jasonType / cindyType / danielType / unmappedType).** This CC operates one layer below archetype.
13. **Do NOT modify pressureAdaptation, vulnerabilityNegative, thinSoul, qGS1ProvingProof, or qV1PerformanceIdentity components.** They're correctly calibrated for the cohort. Only qGrip1 + StakesLoad + Q-3C2 channel change.
14. **Do NOT lower the qGrip1 cap at 25 below 25.** Raising it is permitted if cohort review surfaces fixtures pushing against the cap (cap reached = differentiation lost at the top end). Audit reports any cohort fixture whose pre-cap qGrip1 ≥ 25.
15. **Do NOT regenerate cohort cache** without an explicit cost-approved decision. Default is Option B (cache stable via legacy-letter pattern).
16. **Do NOT bundle the Q-3C2 signal-ID rename** if executor finds the existing signal IDs are differently named than the table above. Use the actual IDs from the codebase; the table is illustrative.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean (0 warnings)
- [ ] `npx tsx tests/audit/gripSignalWeighting.audit.ts` — all 13–14 assertions pass
- [ ] All other existing audits remain green (32/32 from CC-SHAPE-AWARE-PROSE-ROUTING → 33/33 with this CC's new file)
- [ ] Cohort defensiveGrip std-dev increases vs pre-CC baseline
- [ ] Daniel synthetic shape composed Grip exceeds Cindy synthetic by ≥ 10 points
- [ ] Jason fixture composed Grip stays within ±5 of pre-CC value (21)
- [ ] Q-3C2 channel either fires or is documented as a gap with a TODO

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **Q_GRIP1_DEFENSIVE_WEIGHTS table paste** — confirm the 8 entries and their weights.
3. **qGrip1 loop refactor paste** — show the weighted score computation.
4. **RELATIONAL_GRIP_STAKES_BUMP paste** — show the relational-grip routing.
5. **Q-3C2 channel paste** — show how Q-3C2 rank-1 routes to defensive/stakes/both/none, OR document the gap and propose a next-CC scope.
6. **Daniel synthetic validation** — paste defensiveGrip, stakesLoad, amplifier, composed Grip. Compare to pre-CC values (31 / 70 / 1.35 / 41.9).
7. **Cindy synthetic validation** — paste same metrics. Compare to pre-CC values.
8. **Jason fixture regression** — paste current Grip. Confirm within ±5 of pre-CC 21.
9. **Cohort variance report** — std-dev of defensiveGrip and composed Grip across all 24 fixtures, pre vs post. Confirm increase.
10. **Cohort divergence table** — for every fixture, show pre-CC defensiveGrip / post-CC / delta. Highlight fixtures that move by ≥ 5 points.
11. **Audit pass/fail breakdown.**
12. **Out-of-scope verification** — confirm none of the 16 DO-NOT items were touched.

---

**Architectural test:** Daniel and Cindy now produce visibly different Grip readings from genuinely different signal inputs. Daniel's classical-defensive Q-GRIP1 cluster (Control + Money + Plan) elevates defensiveGrip; Cindy's relational cluster (Needed + Reputation + Approval) routes through StakesLoad and produces a lower defensiveGrip with higher stakes amplification. Their trajectory math tells distinct stories — gsg model is doing what gsg-master canon requires.

Jason's fixture stays unchanged in substance (his Q-GRIP1 weights to a moderate-defensive cluster, but his low volume keeps overall defensiveGrip in the same band). The CC restores cohort variance without overfitting to the three-shape stress-test.

After this CC, the Grip substrate is signal-honest: identity of the user's named grips drives the composition, not just position. Next refinements in the queue: Q-S3-wider split (Social-life vs Travel/experience), Q-E1-outward split (Building vs Creating with 65/35 momentum split for Creating per Jason canon 2026-05-11).
