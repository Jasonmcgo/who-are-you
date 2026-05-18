# CC-101-VO-WIRING

## Objective

Wire the `victimOwnerScore` from CC-100-VO-EXTRACTOR-AND-COMPOSER
(calibrated via CC-102-VO-CALIBRATION) into the engine math: owner
weight contributes to Aim, victim weight contributes to Grip, and
victim register adds drag to Usable Movement.

**Plus** — per canon decision 2026-05-17 (Option C: "trust data,
surface tension") — add a Layer 2.5 mechanism:
- Phase 4: derive a canon-predicted V/O register from Lens stack +
  Compass + OCEAN + Q-C4 signature (the "lived shape" prediction)
- Phase 5: detect tension when measured V/O register diverges from
  canon-predicted register; surface tension flag on Constitution

The canon decision is load-bearing: V/O score itself wires as-measured
(trust the data), but the gap between expressed register and
canon-predicted lived register surfaces as a tension finding.

Per `feedback_tension_is_the_form.md`:

> Tension IS the form. The engine surfaces tension; the user
> chooses what to do with it. Engine doesn't collapse the tension
> by tuning one side toward the other.

Per `feedback_victim_owner_axis_gsag.md`:

> Victim register → heavy Grip contribution. Owner register →
> strong Aim contribution. Goal/Soul movement gated by victim weight.

## Prerequisite

CC-100-VO-EXTRACTOR-AND-COMPOSER and CC-102-VO-CALIBRATION must
have landed (both in prompts/completed/). The V/O composer must
produce a populated `victim_owner` field on `InnerConstitution`
for every fixture. If `victim_owner` is undefined, this CC's
wiring won't fire and audits won't pass.

## Read First

- `prompts/completed/CC-100-VO-EXTRACTOR-AND-COMPOSER.md` —
  composer scaffold + canon weight table
- `prompts/completed/CC-102-VO-CALIBRATION.md` — cohort calibration
  report + 4 PEND flags (Daniel boundary / Kevin + Cindy expressed-vs-
  lived gap / Michele verb-disambiguation gap)
- `feedback_victim_owner_axis_gsag.md` — V/O canon (Grip + Aim
  contribution mechanics)
- `feedback_tension_is_the_form.md` — tension-as-finding canon
- `feedback_trajectory_model_refinement_canon.md` — current Grip/
  Aim composition (V/O is additive, doesn't replace)
- `feedback_50_degree_journey_canon.md` — Goal/Soul/Aim/Grip spine
- `feedback_openness_suppression_by_agreeableness.md` — Fe-protector
  + high-A shape canon (informs predicted-register signature)
- `feedback_mbti_as_litmus_canon.md` — engine measures shape, not
  MBTI label (informs predicted-register signature)
- `feedback_relationships_and_behavioral_metadata_canon.md` — Layer 2.5
  architecture pattern
- `lib/victimOwnerAxis.ts` — composer module (consumed read-only)
- `lib/gripDecomposition.ts` — Grip composition path
- `lib/aim.ts` — Aim composition path
- `lib/movementLimiter.ts` — Usable Movement calculation
- `lib/identityEngine.ts:attachVictimOwnerAxis` — V/O integration site
- `tests/fixtures/cohort-real/*.json` — 7 real-person calibration
  anchors (Jason / Daniel / Harry / Cindy / Michele / Kevin / Ashley)

## Canon constraints (locked)

- **V/O score wires as-measured.** The composer's empirical fidelity
  is intact per CC-102's STOP-rule outcome. Don't soften, dampen,
  or otherwise modify the score in this CC. The gap between
  expressed and canon-predicted is surfaced as tension, not
  collapsed by adjusting either side.
- **Thresholds DO NOT change.** Existing canon thresholds
  (MAX_GRIP_DRAG=0.45, MAX_AIM_GOVERNOR=0.15, MBTI_TIE_MARGIN=0.5,
  AGREEMENT_LIFT_INFERRED_SCORE_FLOOR=60, etc.) all stay as-is.
  V/O contribution is additive, not multiplicative.
- **Backward-compatible by default.** If `victim_owner` is undefined
  on a Constitution (legacy fixture or session that hasn't
  re-rendered), engine math falls back to current behavior. No NaN,
  no crash, no silent regression.
- **Zero Wave 1 persistence file changes.** `lib/staleShape.ts`,
  `lib/llmRewritesBundle.ts`, `lib/sessionLlmBundleStore.ts`,
  `lib/*LlmServer.ts` untouched.
- **Cohort regression gates are load-bearing.** No cohort fixture's
  Goal/Soul/Aim/Grip/Movement number may move more than the canon
  predicts (tables in each Phase). Surprises stop and report.
- **Document EVERY math change with rationale per AGENTS.md.**
- **No LLM calls, no cache file edits, no commits, no pushes.**

## Scope — Phase 1: Aim contribution from owner score

### Item 1a — Aim owner-boost in `lib/aim.ts`

After existing Aim computation, add owner-side boost:

```typescript
// Per feedback_victim_owner_axis_gsag.md: owner-anchored shapes
// receive a strong Aim contribution. Gradient-weighted from 0
// (balanced) to +15 (owner-anchored at score=100). Tolerance cone
// scales monotonically across the +15 range.
const ownerBoost = victim_owner && victim_owner.score > 50
  ? ((victim_owner.score - 50) / 50) * 15
  : 0;

const adjustedAim = clamp(baseAim + ownerBoost, 0, 100);
```

**Cohort expected impact (using CC-102's measured V/O scores):**

| User | Pre-CC Aim | V/O score | Aim boost | Post-CC Aim |
|---|---|---|---|---|
| Jason | ~60.8 | 77 | +8.1 | ~69 |
| Daniel | ~68.1 | 81 | +9.3 | ~77 |
| Harry | ~60.1 | 60 | +3 | ~63 |
| Cindy | ~61.6 | 69 | +5.7 | ~67 |
| Michele | ~57.0 | 36 | 0 (victim, no owner boost) | ~57 |
| Kevin | ~60.7 | 87 | +11.1 | ~72 |
| Ashley | ~59.7 | 72 | +6.6 | ~66 |

### Item 1b — Audit assertions for Phase 1

- `vo-jason-aim-owner-boost` — Jason real Aim ≥ 67 post-CC
- `vo-michele-no-aim-boost` — Michele Aim within ±2 of pre-CC (victim-leaning, no boost)
- `vo-kevin-aim-largest-boost` — Kevin Aim ≥ 70 post-CC (score=87, largest boost)
- `vo-aim-clamp-100` — synthetic owner-anchored fixture + baseAim=95 produces clamped Aim=100
- `vo-aim-no-victim-side-boost` — synthetic victim-anchored (score=0) does NOT modify Aim

## Scope — Phase 2: Grip contribution from victim score

### Item 2a — Grip victim-amplifier in `lib/gripDecomposition.ts`

After existing §13 amplifier composition, add victim-side
amplification:

```typescript
// Per feedback_victim_owner_axis_gsag.md: victim-anchored shapes
// receive heavy Grip contribution. Gradient-weighted from 0 (balanced)
// to +1.20x amplifier (victim-anchored at score=0). Stacks
// multiplicatively with existing stakes amplifier; clamped to
// MAX_GRIP_DRAG canonical ceiling (0.45).
const victimMultiplier = victim_owner && victim_owner.score < 50
  ? 1 + ((50 - victim_owner.score) / 50) * 0.20
  : 1;

const adjustedAmplifier = clamp(stakesAmplifier * victimMultiplier, 1.0, 1.5);
const adjustedGrip = defensiveGrip * adjustedAmplifier;
```

**Cohort expected impact:**

| User | Pre-CC composed Grip | V/O score | Victim multiplier | Post-CC composed Grip |
|---|---|---|---|---|
| Jason | 30.6 | 77 (owner) | 1.0 | 30.6 |
| Daniel | 41.3 | 81 (owner) | 1.0 | 41.3 |
| Harry | 17.8 | 60 (owner-leaning) | 1.0 | 17.8 |
| Cindy | 38.2 | 69 (owner) | 1.0 | 38.2 |
| Michele | 30.6 | 36 (victim-leaning) | 1.056 | ~32 (+1.5) |
| Kevin | 27.7 | 87 (owner) | 1.0 | 27.7 |
| Ashley | 23.5 | 72 (owner) | 1.0 | 23.5 |
| Synthetic victim | n/a | 0 | 1.20 | meaningful boost |

Michele is the only real-person cohort fixture in victim register
(per CC-102) so she's the only one with Grip amplification visible.

### Item 2b — Audit assertions for Phase 2

- `vo-cohort-grip-stable-for-owners` — All 6 owner-register cohort
  fixtures' composed Grip within ±2 of pre-CC values
- `vo-michele-grip-victim-amplified` — Michele composed Grip
  increases by ~5% post-CC (her victim-leaning score=36 fires
  victim multiplier)
- `vo-synthetic-victim-grip-amplified` — synthetic victim-anchored
  fixture's composed Grip is ≥10% higher than same fixture with
  `victim_owner` undefined
- `vo-grip-clamp-canon-cap` — composed Grip × 1.20x multiplier still
  caps at 100

## Scope — Phase 3: Goal/Soul movement gating

### Item 3a — Usable Movement victim-drag in `lib/movementLimiter.ts`

After existing Aim-governor + Grip-drag composition, add victim-drag:

```typescript
// Per feedback_victim_owner_axis_gsag.md: victim register gates
// Goal/Soul movement. Heavy victim weight pulls Usable Movement
// down further beyond Aim+Grip drag. Gradient: 0 at balanced
// (score=50), -10% at victim-anchored (score=0). Preserves the
// trajectory model's max 0.70 total-drag ceiling (Grip 0.45 +
// Aim 0.15 + V/O 0.10 = 0.70, leaving 30% usable floor).
const victimDrag = victim_owner && victim_owner.score < 50
  ? ((50 - victim_owner.score) / 50) * 0.10
  : 0;

const adjustedUsable = potentialMovement * (1 - gripDrag - aimGovernor - victimDrag);
```

### Item 3b — Audit assertions for Phase 3

- `vo-cohort-movement-stable-for-owners` — 6 owner-register cohort
  fixtures' Usable Movement within ±5 points of pre-CC
- `vo-michele-movement-victim-dragged` — Michele's Usable Movement
  decreases by 1-3 points post-CC (victim-leaning drag)
- `vo-synthetic-victim-movement-dragged` — synthetic victim-anchored
  fixture's Usable Movement at least 5 points lower than same
  fixture with `victim_owner` undefined
- `vo-movement-min-30-percent` — synthetic worst-case (Grip 45 + Aim
  drag + V/O drag) preserves ≥30% of potential

## Scope — Phase 4: Canon-predicted register function (NEW — per Option C)

### Item 4a — New function `predictVictimOwnerRegister` in `lib/victimOwnerAxis.ts`

Derives a canon-predicted V/O register from shape signature (NOT
behavioral signals). The prediction represents the canon-canonical
"lived shape" expectation per
`project_cohort_calibration_2026_05_17.md`.

```typescript
interface CanonPredictedRegister {
  score: number;       // 0-100, same scale as composer
  register: VictimOwnerRegister;
  rationale: string;   // signature components used
}

function predictVictimOwnerRegister(
  constitution: InnerConstitution
): CanonPredictedRegister {
  let score = 50;  // neutral start
  const components: string[] = [];

  // Lens dominant function bias
  const dom = constitution.lens_stack?.dominant;
  const aux = constitution.lens_stack?.auxiliary;
  if (dom === "te") { score += 10; components.push("Te-driver +10"); }
  else if (dom === "ni" && aux === "te") { score += 10; components.push("Ni-Te +10"); }
  else if (dom === "ti") { score += 5; components.push("Ti-driver +5"); }
  else if (dom === "si") { score += 5; components.push("Si-driver +5"); }
  else if (dom === "ne") { score += 5; components.push("Ne-driver +5"); }
  else if (dom === "fe") { score -= 5; components.push("Fe-driver -5 (relational softening)"); }
  // se, fi, fe-aux: neutral

  // Compass top values
  const compass = constitution.compass_top || [];
  const compassIds = compass.slice(0, 4).map(c => c.signal_id);
  if (compassIds.some(id => /knowledge|truth|honor/i.test(id))) {
    score += 10;
    components.push("Knowledge/Truth/Honor compass +10");
  }
  if (compassIds.some(id => /faith/i.test(id))) {
    score += 5;
    components.push("Faith compass +5");
  }
  if (compassIds.some(id => /compassion|mercy/i.test(id))) {
    score -= 5;
    components.push("Compassion/Mercy compass -5");
  }

  // OCEAN — high A softening (Fe-protector canon)
  const A = constitution.ocean?.agreeableness ?? 0;
  const C = constitution.ocean?.conscientiousness ?? 0;
  if (A >= 95) { score -= 10; components.push(`A=${A} extreme -10 (Fe-protector softening)`); }
  else if (A < 70) { score += 5; components.push(`A=${A} lower +5`); }
  if (C >= 90) { score += 10; components.push(`C=${C} ceiling +10`); }

  // Q-C4 blame attribution top
  const blameTop = /* extract Q-C4 top signal */;
  if (blameTop === "individual") { score += 10; components.push("Q-C4 Individual +10"); }
  else if (blameTop === "authority") { score += 5; components.push("Q-C4 Authority +5"); }
  else if (blameTop === "nature") { score -= 5; components.push("Q-C4 Nature -5"); }
  // system, supernatural: neutral (Supernatural-as-faith-trust per Harry canon)

  score = Math.max(0, Math.min(100, score));
  const register = scoreToRegister(score);
  return { score, register, rationale: components.join(", ") };
}
```

**Cohort canon-predicted expectations** (per
`project_cohort_calibration_2026_05_17.md`):

| User | Predicted score | Predicted register | Measured score (CC-102) | Measured register |
|---|---|---|---|---|
| Jason | ~85 (Ni-Te + Knowledge + C=94 + Individual) | owner-anchored | 77 | owner-anchored ✓ |
| Daniel | ~70 (Si + Faith + C=99 + Individual + A=82) | owner-leaning | 81 | owner-anchored (+1) |
| Harry | ~70 (Si-Fe + Faith + C=98 + Supernatural + A=92) | owner-leaning | 60 | owner-leaning ✓ |
| Cindy | ~50 (Se + Family + A=94 + Individual) | balanced | 69 | owner-leaning (+1 band) |
| Michele | ~60 (Ne-Fi + Freedom + System) | owner-leaning | 36 | victim-leaning (-2 bands, REVERSED) |
| Kevin | ~50 (Fe-Si + Faith + A=94 + Individual) | balanced | 87 | owner-anchored (+2 bands) |
| Ashley | ~70 (Se/Ni + Truth + System + wide cost) | owner-leaning | 72 | owner-leaning ✓ |

### Item 4b — Audit assertions for Phase 4

- `vo-canon-predicted-jason-owner-anchored` — score ≥ 80, register = owner-anchored
- `vo-canon-predicted-kevin-balanced` — score 40-60, register = balanced (high-A softens)
- `vo-canon-predicted-michele-owner-leaning` — score 55-70
- `vo-canon-predicted-populated-on-cohort` — every cohort fixture
  has populated `canonPredictedRegister` field

## Scope — Phase 5: Expressed-vs-canon tension detection

### Item 5a — Tension flag in `VictimOwnerReading`

Extend the `VictimOwnerReading` interface (from CC-100) with a
tension field:

```typescript
interface VictimOwnerReading {
  // ... existing fields from CC-100
  canonPredicted: CanonPredictedRegister;
  registerTension: {
    fires: boolean;
    direction: "expressed-exceeds-canon" | "canon-exceeds-expressed" | "direction-reversed" | "aligned";
    magnitude: "minor" | "meaningful" | "significant";  // 1 band / 2 bands / reversed
    bandDelta: number;  // 0 = same band, 1 = adjacent, 2+ = further, negative = reversed direction
    note: string;  // human-readable summary
  };
}
```

### Item 5b — Tension detection logic

```typescript
function detectRegisterTension(
  measured: { score: number; register: VictimOwnerRegister },
  predicted: { score: number; register: VictimOwnerRegister }
): RegisterTension {
  const measuredBand = registerToBandIndex(measured.register);  // 0-4
  const predictedBand = registerToBandIndex(predicted.register);
  const bandDelta = measuredBand - predictedBand;
  const absBandDelta = Math.abs(bandDelta);

  // Direction reversal: one is owner-leaning+ and the other is victim-leaning-
  const directionReversed =
    (measured.score >= 60 && predicted.score <= 40) ||
    (measured.score <= 40 && predicted.score >= 60);

  if (absBandDelta === 0) {
    return { fires: false, direction: "aligned", magnitude: "minor", bandDelta: 0, note: "..." };
  }

  const direction = directionReversed
    ? "direction-reversed"
    : (bandDelta > 0 ? "expressed-exceeds-canon" : "canon-exceeds-expressed");

  const magnitude = directionReversed
    ? "significant"
    : (absBandDelta >= 2 ? "significant" : (absBandDelta === 1 ? "meaningful" : "minor"));

  return {
    fires: true,
    direction,
    magnitude,
    bandDelta,
    note: buildTensionNote(measured, predicted, direction, magnitude),
  };
}
```

**Cohort tension expected to fire:**

| User | Tension? | Direction | Magnitude | Note |
|---|---|---|---|---|
| Jason | No | aligned | n/a | both owner-anchored |
| Daniel | Maybe | expressed-exceeds-canon | minor | 1 band off, boundary |
| Harry | No | aligned | n/a | both owner-leaning |
| Cindy | Yes | expressed-exceeds-canon | meaningful | survey reads owner; canon expects balanced |
| Michele | Yes | direction-reversed | significant | survey reads victim; canon expects owner-leaning (verb disambiguation gap) |
| Kevin | Yes | expressed-exceeds-canon | significant | survey reads owner-anchored; canon expects balanced (Fe-protector confidence-when-asked) |
| Ashley | No | aligned | n/a | both owner-leaning |

### Item 5c — Audit assertions for Phase 5

- `vo-tension-fires-on-kevin-real` — Kevin tension.fires=true,
  direction=expressed-exceeds-canon, magnitude=significant
- `vo-tension-fires-on-cindy-real` — Cindy tension.fires=true,
  direction=expressed-exceeds-canon, magnitude=meaningful
- `vo-tension-fires-on-michele-real` — Michele tension.fires=true,
  direction=direction-reversed, magnitude=significant
- `vo-tension-aligned-for-jason-harry-ashley` — Jason, Harry, Ashley
  all show tension.fires=false / aligned
- `vo-tension-note-string-populated` — every cohort fixture produces
  a non-empty `note` field

## Acceptance criteria

1. `npx tsc --noEmit` clean
2. lint clean (no new warnings)
3. `audit:victim-owner-wiring` exits 0 with 100% PASS
4. `audit:victim-owner-axis` (from CC-100/102) still passes
5. Wave 1 audits all pass
6. CC-084 through CC-102 audits all pass
7. All 8 cohort fixtures' Goal/Soul values byte-identical pre- vs
   post-CC (V/O doesn't modify Goal or Soul directly)
8. Cohort fixtures' Aim values increase per Phase 1 expected impact
   table; no decreases for any user
9. Cohort fixtures' Composed Grip stable for owner-register users
   (±2); Michele's increases ~5% (victim-leaning amplification)
10. Cohort fixtures' Usable Movement within -3 to +9 of pre-CC
11. Synthetic victim-anchored fixture shows visible Grip amplification
    AND visible Movement drag
12. Canon-predicted register populated on every cohort fixture
13. Register tension correctly fires on Kevin (expressed-exceeds),
    Cindy (expressed-exceeds), Michele (direction-reversed); silent
    on Jason / Harry / Ashley (aligned)
14. Every math change documented with code comment citing canon source
15. Backward-compat: `victim_owner` undefined → all math identical
    to pre-CC behavior
16. Zero Wave 1 persistence file changes
17. Zero LLM calls
18. Zero cache file modifications
19. Zero commits / pushes — left dirty for review

## Allowed to modify

- `lib/aim.ts` — owner-side Aim boost
- `lib/gripDecomposition.ts` — victim-side Grip amplifier
- `lib/movementLimiter.ts` — victim-drag in Usable Movement
- `lib/victimOwnerAxis.ts` — add `predictVictimOwnerRegister` +
  `detectRegisterTension` functions; extend `VictimOwnerReading`
  interface
- `lib/types.ts` — type extensions
- `tests/audit/victimOwnerWiring.audit.ts` (new file)
- `tests/audit/victimOwnerAxis.audit.ts` — add Phase 4-5 assertions
- `package.json` — new `audit:victim-owner-wiring` script
- `prompts/active/CC-101-VO-WIRING.md` → `prompts/completed/`

Nothing else.

## Out of scope

- Composer weight tuning (CC-100/CC-102 own that)
- New cohort fixtures
- Prose surfacing of V/O register or tension (deferred — design
  after wiring lands and we see whether cohort reads need narrative
  or stay as data; CC-103+ candidate)
- Refining "should" / "hope" verb disambiguation for Michele
  (separate CC-VO-VERB-DISAMBIGUATION)
- Daniel +1 boundary tune (separate micro-tune CC if worth it)

## Estimated

30-45 min (CC has 5 phases but each is small; recalibrated per
`feedback_cc_executor_time_estimates_5x_too_high.md`).

## Notes for executor

- **Phase 4-5 are NEW per canon decision 2026-05-17 (Option C).**
  Don't shortcut them. The user explicitly chose "trust data, surface
  tension" over "trust data only" or "soften toward canon" — the
  tension surfacing is load-bearing for the V/O axis architecture.
- **Backward-compat is load-bearing.** Many sessions (live + ocean +
  goal-soul-give fixtures) will not have `victim_owner` populated
  until they re-render. Engine math MUST handle undefined gracefully —
  no crashes, no NaN, no silent zero-out of existing scores.
- **The cohort impact tables in each Phase are the empirical
  anchors.** Tune the canon-derived multipliers (max +15 Aim boost,
  1.20x Grip multiplier cap, 10% Movement drag cap) only if cohort
  regression requires it. Document any deviation.
- **Q-C4 blame attribution extraction:** the canonical signal_id
  format is `*_responsibility_priority` (per CC-097B-CALIBRATION's
  finding). Use that format when reading Q-C4 top for Phase 4's
  predictor function.
- Per AGENTS.md canon-faithful interpretation: if any phase's
  cohort regression hits an unresolvable conflict (e.g., Jason Aim
  boost pushes him above canon ceiling somewhere), document the
  tradeoff, flag for follow-up CC-101-V2, and prefer cohort
  stability over completing the full integration in one CC.
- **The register tension is the canon's product.** Even if Kevin's
  V/O score wires into Grip/Aim correctly, the tension flag on his
  Constitution is what makes the V/O architecture honest: it tells
  us his expressed register exceeds his lived register. Future
  prose CCs can surface this; for now it lives as data.
