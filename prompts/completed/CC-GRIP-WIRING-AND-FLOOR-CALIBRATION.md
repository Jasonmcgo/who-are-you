# CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — Make §13 Composed Grip Canonical for Visualization

> **▶ FIRST OF TWO QUEUED CCs.**
>
> This CC executes first. `prompts/active/CC-SHAPE-AWARE-PROSE-ROUTING.md` is queued behind it and depends on this CC's wiring being in place. After this CC reaches 31/31 audits green and report-back is delivered, the next CC may begin. Do NOT bundle the prose-routing scope into this CC — it is intentionally separated to keep the engine-substrate change auditable on its own before prose templates start moving.

**Origin:** CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT landed the §13 multiplicative Grip composition (DefensiveGrip × StakesAmplifier) on `constitution.gripReading.score` — but downstream visual/UX consumers (Movement Quadrant routing, Movement Limiter drag computation, Risk Form letter classification, trajectory chart) still consume the legacy additive value `grippingPull.score`. Result: Daniel's synthetic composes to Grip 88.5 internally, but his rendered chart still shows Grip 46 with 27% drag — the engine knows the truth, the chart hasn't been told.

Additionally, the §13 amplifier floor was implemented at `DEFENSIVE_GRIP_AMPLIFIER_FLOOR = 20`. Jason's defensiveGrip 21 narrowly clears this floor and produces amp 1.05 — but canon §13 intent was "no amplification for low-defensive shapes." Jason is the canonical low-defensive shape; if he's amplifying even minimally, the floor is too low.

This CC closes both gaps:

1. **Raise `DEFENSIVE_GRIP_AMPLIFIER_FLOOR` from 20 to 25** so Jason cleanly produces amp = 1.0.
2. **Wire `gripReading.score` into all canonical Grip consumers** (Quadrant, Limiter, Risk Form, chart).
3. **Display both defensive and composed values in the metric block** — Grip: 46 defensive · 88.5 with stakes — mirroring the Potential → Usable Movement honesty precedent.

**Method discipline:** Substrate wiring + one constant tweak + display refinement. No engine math invented; no formula coefficients changed (other than the floor constant). LLM cache regen managed via hash bump or feature flag — executor's call based on which path is least disruptive.

**Scope frame:** CC-medium, ~45–75 min executor time. Multiple files but each change is localized.

**Cost surface:** Cohort cache regen LIKELY because three fixtures (gsg/12-productive-ne, ocean/25-ti-coherence, ocean/02-high-consci) shift composed Grip meaningfully when downstream consumers read the new substrate. Bounded ~$0.30–$1.00 depending on regen scope.

---

## Embedded context

### What the §13 composition already does (CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT landing)

- `lib/gripDecomposition.ts` exposes `computeStakesAmplifier`, `computeDefensiveGrip`, `computeStakesLoad`, `computeGrip`
- `constitution.gripReading.score` = composed Grip per §13 (DefensiveGrip × StakesAmplifier)
- `constitution.gripReading.components` = {defensiveGrip, stakesLoad, amplifier}
- `constitution.grippingPull.score` = legacy additive Grip (unchanged for cache stability)

### What this CC migrates

Movement Quadrant routing currently reads `grippingPull.score` for the HIGH_GRIP_THRESHOLD check (Grip ≥ 35 produces the defensive Quadrant twin). Migrate to `gripReading.score`.

Movement Limiter `computeGripDragModifier(grip)` currently consumes the legacy additive value. Migrate to `gripReading.score` so drag computation reflects §13 honesty.

Risk Form canonical classifier `computeRiskFormFromAim` (or wherever Grip enters the letter selection) currently reads legacy Grip. Migrate to `gripReading.score`. The legacy classifier `computeRiskForm` stays on Mix substrate per the prior CC's resolution flag — DO NOT touch legacy.

Trajectory chart Grip-drag marker rendering reads Grip from somewhere upstream. Migrate to `gripReading.score`.

Metric block display in `renderMirror.ts` / `InnerConstitutionPage.tsx` currently shows a single Grip value. Display both: `Grip: 46 defensive · 88.5 with stakes` (or similar phrasing — executor's editorial call within the existing visual style).

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/gripDecomposition.ts` | MODIFY | Bump `DEFENSIVE_GRIP_AMPLIFIER_FLOOR` from 20 to 25. |
| `lib/movementQuadrant.ts` | MODIFY | HIGH_GRIP_THRESHOLD check reads `gripReading.score`, not `grippingPull.score`. |
| `lib/movementLimiter.ts` | MODIFY | `computeGripDragModifier` input is `gripReading.score`. |
| `lib/riskForm.ts` | MODIFY | Canonical classifier (`computeRiskFormFromAim`) reads `gripReading.score`. Legacy `computeRiskForm` stays on Mix substrate (per prior CC's flag). |
| `lib/trajectoryChart.ts` | MODIFY | Grip-drag marker reads `gripReading.score`. |
| `lib/renderMirror.ts` | MODIFY | Metric block displays both values: defensive · composed. |
| `app/components/InnerConstitutionPage.tsx` | MODIFY | Same dual display at React layer. |
| `lib/synthesis3Inputs.ts` | MAYBE MODIFY | If composed Grip enters LLM input contract, the cache hash needs a version bump. Otherwise leave untouched. |
| `tests/audit/gripWiringAndFloorCalibration.audit.ts` | NEW | 12 audit assertions. |

### Segment A: Floor bump

```ts
// lib/gripDecomposition.ts
export const DEFENSIVE_GRIP_AMPLIFIER_FLOOR = 25;  // raised from 20 per canon intent
```

Effect on Jason: defensiveGrip 21 < 25 → amp = 1.0 → composed === defensiveGrip = 21. Canon §13 intent honored.

### Segment B: Quadrant wiring

In `lib/movementQuadrant.ts`, the high-Grip twin gating uses `HIGH_GRIP_THRESHOLD = 35` and a Grip score input. Change the input source so it reads from `constitution.gripReading.score` (the composed value), not `grippingPull.score`. The 12-label union and Grip-aware twin logic stay exactly as CC-MOMENTUM-HONESTY shipped them. Only the input value changes.

Cohort impact: Daniel synthetic (composed Grip 88.5) was already routing to Strained Integration via legacy Grip 46 ≥ 35 — Daniel's Quadrant label doesn't change because both legacy and composed cross the threshold. The three shift fixtures (gsg/12, ocean/25, ocean/02) need cohort verification — gsg/12 legacy 61 → composed 30.5 may now route DOWN out of the high-Grip twin (61 ≥ 35 → "Driven Output", but 30.5 < 35 → "Goal-led Presence"). Audit reports cohort relabel count.

### Segment C: Limiter wiring

In `lib/movementLimiter.ts`, `computeGripDragModifier(grip)` takes a grip parameter. Whatever caller passes today is the legacy value; change that caller to pass `gripReading.score` instead.

Daniel impact: drag goes from ~21% (Grip 46 × maxGripDrag 0.45) to ~40% (Grip 88.5 × 0.45). Honest read.

Jason impact: drag stays effectively unchanged (Grip 21 with new amp 1.0 vs old composed 22.1) — within noise.

Cohort impact: same three fixtures shift drag percentages. Audit reports for each.

### Segment D: Risk Form wiring

In `lib/riskForm.ts`, find the canonical classifier that reads Grip (likely `computeRiskFormFromAim` per the prior CC's resolution flag). Change its Grip input to `gripReading.score`. Legacy `computeRiskForm` stays on Mix substrate and is NOT touched.

Cohort impact: thresholds for letter selection may flip a few fixtures. Audit reports.

### Segment E: Chart wiring

In `lib/trajectoryChart.ts`, the Grip-drag marker rendering and the consolidated readout drag percentage both ultimately consume a Grip value. Find that input point and switch to `gripReading.score`.

Visual impact: Daniel's red drag marker becomes more prominent; consolidated readout shows higher drag percentage.

### Segment F: Metric block display

In `renderMirror.ts` and `InnerConstitutionPage.tsx`, the current Grip line shows a single value (e.g., `Grip: 46 / 100`). New display shows both:

```
Grip: 46 defensive · 88.5 with stakes
```

Or, if defensive == composed (Jason's case where amp = 1.0):

```
Grip: 21 / 100
```

(Single value when no stakes amplification fired — matches existing style.)

Executor's editorial call on exact phrasing; the precedent is the Movement section's "Potential 70.8 → Usable 59.2 (-16% drag)" framing. Mirror that visual logic.

### Segment G: LLM cache strategy

If `gripReading.score` enters the synthesis3 input contract (because prose anchors interpolate Grip numbers), the cache hash needs a version bump in `lib/synthesis3Inputs.ts`. Executor's call:

- **Option A:** Hash bump → full cohort regen (~$0.30–$1.00). Clean, but costs.
- **Option B:** Feature flag → composed Grip only enters LLM inputs when flag is on; cache stays stable until flag flips. Safer, defers cost.

Recommend Option A if cohort is < 30 fixtures and regen cost is bounded. Otherwise Option B.

---

## Audit assertions (12 NEW)

In `tests/audit/gripWiringAndFloorCalibration.audit.ts`:

1. **`amplifier-floor-raised-to-25`** — `DEFENSIVE_GRIP_AMPLIFIER_FLOOR === 25`.
2. **`jason-amplifier-now-canonical-1-0`** — Jason fixture amplifier === 1.0 exactly; composed Grip === defensiveGrip (21).
3. **`daniel-amplifier-preserved`** — Daniel synthetic amplifier ≥ 1.4 (unchanged by floor bump because his defensiveGrip 61 ≫ 25).
4. **`quadrant-reads-grip-reading-score`** — `lib/movementQuadrant.ts` HIGH_GRIP_THRESHOLD check sources from `gripReading.score`, not `grippingPull.score`.
5. **`limiter-reads-grip-reading-score`** — `computeGripDragModifier` caller passes `gripReading.score`.
6. **`risk-form-canonical-reads-grip-reading-score`** — canonical classifier reads `gripReading.score`. Legacy `computeRiskForm` UNCHANGED.
7. **`chart-drag-marker-reads-grip-reading-score`** — trajectory chart marker rendering consumes `gripReading.score`.
8. **`metric-block-displays-both-grip-values`** — when amp > 1.05, metric block shows both defensive AND composed; when amp ≤ 1.05, single value.
9. **`daniel-chart-drag-increased`** — Daniel synthetic chart drag % ≥ 35% (was ~27% on legacy Grip 46).
10. **`cohort-quadrant-relabel-report`** — audit prints list of fixtures whose Quadrant label changed due to wiring (expected: gsg/12 may drop out of "Driven Output"; ocean/25 may drop out of "Pressed Output"; ocean/02 may drop out of "Pressed Output").
11. **`cohort-drag-shift-report`** — for every fixture, print legacy drag % and new drag %. Confirm fixtures with amp > 1.1 show increased drag.
12. **`llm-cache-strategy-documented`** — audit prints whether Option A (hash bump + regen) or Option B (feature flag) was chosen, with rationale.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify the §13 composition formula** (`computeStakesAmplifier`, `computeGrip`). Only the floor constant changes.
2. **Do NOT modify `computeAimScore` or `AIM_WEIGHTS`.** Aim formula stays locked.
3. **Do NOT modify the 12-label `MovementQuadrantLabel` union or Grip-aware twin logic.** Only the input value (gripReading.score) changes.
4. **Do NOT modify `computeGripDragModifier` coefficient (`maxGripDrag = 0.45`).** Drag formula stays as-is; if Daniel's drag still reads too light after this CC, that's a separate calibration CC.
5. **Do NOT modify Risk Form letter labels** (`Open-Handed Aim` / `White-Knuckled Aim` / `Grip-Governed` / `Ungoverned Movement`). Only the substrate threshold input changes.
6. **Do NOT touch prose templates, body cards, gift labels, growth edges, Mirror-Types Seed, Work Map examples, or the "What this is good for" appendix.** All shape-aware prose work belongs to the parallel CC-SHAPE-AWARE-PROSE-ROUTING and must NOT be bundled here.
7. **Do NOT modify LLM system prompts.** Only the input substrate to the prompts may change (and only if the cache hash bumps).
8. **Do NOT modify the angle-band integration logic** (42–58°). Canon §2 stays locked.
9. **Do NOT modify the chart layout, viewBox, legend, or consolidated readout structure.** Only the Grip value inside the marker / readout changes.
10. **Do NOT touch the lean classifiers in workMap/loveMap.** They were already migrated to Strength substrate in the prior CC.
11. **Do NOT modify the legacy `computeRiskForm` classifier.** It stays on Mix substrate per the prior CC's resolution flag.
12. **Do NOT bundle the architectural debt items** (synthesis3 cache hash migration off legacy Aim, lean classifier hard Strength swap). Those are named follow-ups, not in this CC's scope.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean (0 warnings)
- [ ] `npx tsx tests/audit/gripWiringAndFloorCalibration.audit.ts` — all 12 assertions pass
- [ ] All existing audits remain green (30/30 from CC-STRENGTH-MIGRATION → 31/31 with this CC's new file)
- [ ] Daniel synthetic render: chart drag % ≥ 35% (was ~27%), Grip metric line shows "46 defensive · 88.5 with stakes"
- [ ] Jason fixture render: amplifier === 1.0, Grip metric line shows single value (21)
- [ ] Cohort regen completes cleanly OR feature flag documented and audited

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **Floor bump confirmation** — paste new `DEFENSIVE_GRIP_AMPLIFIER_FLOOR` constant.
3. **Quadrant/Limiter/RiskForm/Chart wiring paste** — show the changed lines that switched from `grippingPull.score` to `gripReading.score`.
4. **Metric block display paste** — show the new "defensive · with stakes" rendering, plus the single-value fallback case.
5. **Jason fixture validation** — amplifier, composed Grip, displayed Grip value.
6. **Daniel synthetic validation** — amplifier, composed Grip, chart drag %, Quadrant label.
7. **Cohort relabel table** — fixtures whose Quadrant label or Risk Form letter changed due to wiring.
8. **Cohort drag-shift table** — for each fixture, legacy drag % and new drag %.
9. **LLM cache strategy** — Option A (regen) or Option B (feature flag), with rationale and cost.
10. **Audit pass/fail breakdown** — every audit listed in verification.
11. **Out-of-scope verification** — confirm none of the 12 DO-NOT items were touched.

---

**Architectural test:** Daniel's rendered chart now shows the §13 honesty: Grip 46 defensive · 88.5 with stakes, drag ~40%, Quadrant: Strained Integration. The engine and the visualization tell the same story. Jason's rendered chart stays clean: Grip 21 (single value), amplifier 1.0, no stakes amplification fired — canon §13 intent met.

After this CC, the trajectory math arc is canonized end-to-end AND visualized end-to-end. Next CC pivots to shape-aware prose routing on top of the corrected substrate.
