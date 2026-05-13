# CC-PHASE-3A-LABEL-LOGIC — Engine Label Refinement (Risk Form + Quadrant + Threshold Calibration)

**Origin:** `docs/canon/trajectory-model-refinement.md` §3 (quadrant labels with angle band), §14 (Risk Form label refinement). Phase 2 (CC-AIM-REBUILD-MOVEMENT-LIMITER) shipped the new Aim formula; CC-AIM-CALIBRATION-MIGRATION-FINISH completes the wiring. Phase 3a refines the labels the engine emits — engine-only, no LLM prose or chart visualization changes.

**Method discipline:** Engine for truth. Pure label and threshold logic. New label names ship on the constitution; prose templates that hardcode old labels are left untouched (Phase 3b territory). The instrument now emits canonical labels even though some user-facing prose may continue to reference legacy names for a transitional window.

**Scope frame:** ~2-3 hours executor time. CC-standard scale. Three interlocking changes:

1. **Quadrant label refinement** — add angle-band gating to `computeMovementQuadrant`: Giving / Presence requires 42-58° band; Goal-led Presence / Soul-led Presence are the high-both-axes labels outside the band
2. **Risk Form label refinement** — rename per canon §14: Open-Handed Aim / White-Knuckled Aim / Grip-Governed (kept) / Ungoverned Movement
3. **Risk Form threshold recalibration** — confirm Aim ≥ 60 + Grip ≥ 40 thresholds against new-formula cohort distribution; adjust if empirically warranted

**Cost surface:** Zero LLM. Engine layer only. Cache regen NOT triggered (LLM prompts and Risk Form prose templates are Phase 3b).

---

## Embedded context (CC executor environments don't see Cowork memory)

### Canon §3 — Quadrant label logic

> Current movement quadrant appears to label any case with `goal >= 50 && soul >= 50` as `Giving / Presence`. That is too blunt.

Recommended:

```ts
if (goal >= 50 && soul >= 50 && angle >= 42 && angle <= 58) → "Giving / Presence"
if (goal >= 50 && soul >= 50 && angle < 42)                → "Goal-led Presence"
if (goal >= 50 && soul >= 50 && angle > 58)                → "Soul-led Presence"
if (goal >= 50 && soul < 50)                                → "Work without Presence"
if (goal < 50 && soul >= 50)                                → "Love without Form"
if (goal < 50 && soul < 50)                                 → gripClusterFires ? "Gripping" : "Drift"
```

> Canon: "Giving / Presence" requires not only high Goal and high Soul, but also a trajectory angle near the 50° integration band.

### Canon §14 — Risk Form labels

| Aim | Grip | Old label | Refined label |
|---|---|---|---|
| High | Low | Wisdom-governed | **Open-Handed Aim** |
| High | High | Reckless-fearful | **White-Knuckled Aim** |
| Low | High | Grip-governed (FUD) | Grip-Governed (kept; capitalization formalized) |
| Low | Low | Free movement | **Ungoverned Movement / Drift** |

> Canon: 'Reckless-fearful' is confusing if Aim is high. 'Free movement' can sound positive even when Aim is low and the line is poorly governed. 'Low risk-orientation' is not the right description for low Aim.

### Threshold recalibration question

Current `lib/riskForm.ts`:
- `RISK_FORM_HIGH_AIM = 60`
- `RISK_FORM_HIGH_GRIP = 40`

Per Phase 2's report, the new Aim formula lifted cohort Aim scores by 5-25 points compared to legacy. This means MORE fixtures now cross the 60 threshold under the new formula than under legacy.

Empirical question for the executor: across the 28-fixture cohort (24 cohort + 4 trajectory), does the existing 60 threshold still correctly separate Wisdom-governed shapes (post-rename: Open-Handed Aim) from Productive-but-under-integrated shapes?

**Calibration target:** Jason fixture (Aim 51.5) should land as Ungoverned Movement / Drift OR potentially as a NEW label that captures "Productive but under-integrated" specifically. The current 60 threshold puts him at Ungoverned Movement (below threshold + low Grip). That matches his shape per canon §2.

**Recommendation:** Hold the 60 threshold for V1, run the cohort under new labels, and report observations. Threshold adjustment is a follow-on if cohort review surfaces miscalibration.

### Phase 1 + Phase 2 dependencies

The constitution carries (post Phase 1 + 2 + migration finish):
- `drive.strengths.{cost, coverage, compliance}` (Phase 1)
- `convictionClarity`, `goalSoulCoherence`, `responsibilityIntegration` (Phase 2)
- `aimReading.score` (Phase 2 new formula, post-migration)
- `aimReadingLegacy.score` (Phase 2 preserved legacy)
- `goalSoulGive.grippingPull.{score (legacy), stakesLoad, defensiveGrip, gripAmplifier, gripFromDefensive}` (Phase 2 decomposition)
- `goalSoulMovement.dashboard.movementLimiter` (Phase 2: tolerance, drag, governor, usableMovement)

Phase 3a consumes:
- `aimReading.score` (new Aim) → input to `computeRiskFormFromAim`
- `gripFromDefensive` OR `grippingPull.score` → second input to Risk Form (decision point: switch to canonical multiplicative Grip?)
- `goalSoulGive.adjustedGoal`, `adjustedSoul`, and angle → quadrant logic

**Decision: switch Risk Form to consume `aimReading.score` (new) and `grippingPull.score` (legacy additive, NOT gripFromDefensive).** The reason: Phase 2's design pinned LLM cache keys to legacy Grip. Switching to gripFromDefensive in Phase 3a would invalidate cache keys. Defer gripFromDefensive switch to a later CC; for now, Risk Form uses new Aim + legacy Grip. This is incrementally safer.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/movementQuadrant.ts` | MODIFY | Add angle parameter; add Goal-led Presence / Soul-led Presence labels; gate Giving / Presence on 42-58° band |
| `lib/riskForm.ts` | MODIFY | Rename labels per canon §14; switch input from `aimReadingLegacy.score` to `aimReading.score` (new) |
| `lib/types.ts` | MODIFY | Update `RiskFormLetter` union with new labels; update `MovementQuadrantLabel` union with new labels |
| `lib/identityEngine.ts` | MODIFY (surgical) | Pass angle to `computeMovementQuadrant`; pass new Aim score to `computeRiskFormFromAim` |
| `tests/audit/phase3aLabels.audit.ts` | NEW | Audit assertions covering label coverage, cohort distribution, threshold calibration |

### Type signature updates

```ts
// lib/types.ts

export type MovementQuadrantLabel =
  | "Giving / Presence"       // existing
  | "Goal-led Presence"       // NEW
  | "Soul-led Presence"       // NEW
  | "Work without Presence"   // existing
  | "Love without Form"       // existing
  | "Gripping"                // existing
  | "Drift";                  // existing

export type RiskFormLetter =
  | "Open-Handed Aim"         // RENAMED from "Wisdom-governed"
  | "White-Knuckled Aim"      // RENAMED from "Reckless-fearful"
  | "Grip-Governed"           // RENAMED (capitalization)
  | "Ungoverned Movement";    // RENAMED from "Free movement"
```

### Backward compatibility constants

Preserve legacy label strings as deprecated constants (for any prose template lookup that hasn't been updated yet):

```ts
// lib/types.ts

export const LEGACY_RISK_FORM_LABEL: Record<RiskFormLetter, string> = {
  "Open-Handed Aim": "Wisdom-governed",
  "White-Knuckled Aim": "Reckless-fearful",
  "Grip-Governed": "Grip-governed",
  "Ungoverned Movement": "Free movement",
};

export const LEGACY_QUADRANT_LABEL: Partial<Record<MovementQuadrantLabel, string>> = {
  "Goal-led Presence": "Giving / Presence",  // collapses to legacy for transitional prose
  "Soul-led Presence": "Giving / Presence",
};
```

Phase 3b (when it eventually fires) can drop these aliases once prose templates are fully migrated.

### Updated computeMovementQuadrant

```ts
// lib/movementQuadrant.ts

const QUADRANT_HIGH_AXIS_THRESHOLD = 50;
const INTEGRATION_BAND_MIN = 42;
const INTEGRATION_BAND_MAX = 58;

export interface MovementQuadrantInputs {
  adjustedGoal: number;
  adjustedSoul: number;
  angleDegrees: number;       // NEW — required for band gating
  gripClusterFires: boolean;
}

export interface MovementQuadrantReading {
  label: MovementQuadrantLabel;
  legacyLabel: string;        // legacy collapse for transitional prose
  rationale: string;
}

export function computeMovementQuadrant(inputs: MovementQuadrantInputs): MovementQuadrantReading {
  const { adjustedGoal: g, adjustedSoul: s, angleDegrees: angle, gripClusterFires } = inputs;
  const inBand = angle >= INTEGRATION_BAND_MIN && angle <= INTEGRATION_BAND_MAX;

  let label: MovementQuadrantLabel;
  if (g >= QUADRANT_HIGH_AXIS_THRESHOLD && s >= QUADRANT_HIGH_AXIS_THRESHOLD) {
    if (inBand) label = "Giving / Presence";
    else if (angle < INTEGRATION_BAND_MIN) label = "Goal-led Presence";
    else label = "Soul-led Presence";
  } else if (g >= QUADRANT_HIGH_AXIS_THRESHOLD && s < QUADRANT_HIGH_AXIS_THRESHOLD) {
    label = "Work without Presence";
  } else if (g < QUADRANT_HIGH_AXIS_THRESHOLD && s >= QUADRANT_HIGH_AXIS_THRESHOLD) {
    label = "Love without Form";
  } else {
    label = gripClusterFires ? "Gripping" : "Drift";
  }

  const legacyLabel = LEGACY_QUADRANT_LABEL[label] ?? label;
  // rationale string with band info
  // ...
  return { label, legacyLabel, rationale: /* ... */ };
}
```

### Updated computeRiskFormFromAim

```ts
// lib/riskForm.ts

export const RISK_FORM_HIGH_AIM = 60;     // unchanged for V1; revisit in follow-on
export const RISK_FORM_HIGH_GRIP = 40;    // unchanged

export interface RiskFormReading {
  letter: RiskFormLetter;
  legacyLetter: string;        // legacy collapse
  aimScore: number;
  gripScore: number;
  rationale: string;
}

export function computeRiskFormFromAim(
  aimScore: number,
  grippingPullScore: number,
): RiskFormReading {
  const highAim = aimScore >= RISK_FORM_HIGH_AIM;
  const highGrip = grippingPullScore >= RISK_FORM_HIGH_GRIP;

  let letter: RiskFormLetter;
  if (highAim && !highGrip) letter = "Open-Handed Aim";
  else if (highAim && highGrip) letter = "White-Knuckled Aim";
  else if (!highAim && highGrip) letter = "Grip-Governed";
  else letter = "Ungoverned Movement";

  const legacyLetter = LEGACY_RISK_FORM_LABEL[letter];
  // rationale string
  return { letter, legacyLetter, aimScore, gripScore: grippingPullScore, rationale: /* ... */ };
}
```

### Orchestration order (no change)

`computeRiskFormFromAim` continues to run after `computeAimScore` and after `attachGoalSoulGive`. The change is only in the inputs it receives (new Aim score) and the labels it emits.

`computeMovementQuadrant` now receives the angle parameter; orchestration ensures angle is computed before quadrant.

---

## Audit assertions (10 NEW)

In `tests/audit/phase3aLabels.audit.ts`:

### Quadrant label assertions

1. **`quadrant-label-union-completeness`** — `MovementQuadrantLabel` union covers all 7 expected labels.
2. **`quadrant-giving-presence-band-gated`** — synthetic test cases:
   - Goal=80, Soul=80, angle=50 → "Giving / Presence"
   - Goal=80, Soul=80, angle=35 → "Goal-led Presence"
   - Goal=80, Soul=80, angle=65 → "Soul-led Presence"
3. **`quadrant-jason-fixture-classification`** — Jason fixture (Goal=85, Soul=53, angle=32°) lands as "Work without Presence" (Goal high, Soul < 50 threshold). Note: under the strict `soul >= 50` threshold, Jason's Soul=53 is JUST above 50, so he lands in Goal-led Presence territory. Audit asserts: Goal-led Presence OR Work without Presence (depending on exact Soul score).

   **Calibration note:** if Soul=53 lands Jason in Goal-led Presence (high both + angle 32 < 42), this is canon-correct. The "Productive but under-integrated" band classification surfaces via `goalSoulCoherence.band === "productive-under-integrated"` from Phase 2.

4. **`quadrant-legacy-label-collapse`** — for "Goal-led Presence" and "Soul-led Presence", `legacyLabel === "Giving / Presence"`. For other labels, `legacyLabel === label`.

### Risk Form label assertions

5. **`risk-form-letter-union-completeness`** — `RiskFormLetter` union covers all 4 expected labels.
6. **`risk-form-label-renames`** — synthetic test cases:
   - aim=75, grip=25 → "Open-Handed Aim"
   - aim=75, grip=60 → "White-Knuckled Aim"
   - aim=35, grip=60 → "Grip-Governed"
   - aim=35, grip=25 → "Ungoverned Movement"
7. **`risk-form-jason-fixture-classification`** — Jason fixture lands as "Ungoverned Movement" (Aim 51.5 < 60, Grip 21 < 40).
8. **`risk-form-legacy-letter-mapping`** — every new letter has a `legacyLetter` mapping (Open-Handed Aim → Wisdom-governed, etc.).

### Cohort + threshold calibration

9. **`phase-3a-cohort-distribution`** — for all 28 fixtures, paste a table: legacy quadrant label, new quadrant label, legacy Risk Form letter, new Risk Form letter, Aim, Grip. Observational; flag any fixture where the relabeling produces a surprising result (e.g., a previously Wisdom-governed fixture landing as Ungoverned Movement under the new Aim threshold).
10. **`phase-3a-threshold-recommendation`** — informational: based on cohort distribution, report whether the 60 Aim threshold cleanly separates intended-Wisdom-governed from intended-Ungoverned shapes. If 80% or more of canonically-intended-Wisdom fixtures land below 60, recommend threshold adjustment. (Not asserted; for human review.)

In `tests/audit/aimRebuild.audit.ts` (extension):
- 1 assertion that Risk Form letter under new Aim score uses new labels (Open-Handed Aim etc.).

In `tests/audit/threeC_strength.audit.ts` (extension):
- No change needed.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any LLM system prompts.** Phase 3b is prose layer.
2. **Do NOT modify cohort cache.** No LLM regen.
3. **Do NOT modify `lib/renderMirror.ts` or `app/components/InnerConstitutionPage.tsx` for the labels themselves.** Render layer will pick up new labels via the constitution's existing fields — but the prose templates around the labels (e.g., "Your Risk Form reads as Free movement: low risk-orientation, low grip...") stay untouched. Phase 3b handles prose refinement.
4. **Do NOT update prose templates in `lib/riskForm.ts` that contain the legacy label names in their text** (e.g., `"Your Risk Form reads as Free movement..."`). These prose strings are user-facing copy; CC-PHASE-3B-LABELS-PROSE-VISUAL-REFINEMENT will update them. For Phase 3a, the prose strings should be updated to reference the NEW label by name (since legacyLetter alias allows transitional rendering if needed).

   **Clarification:** Phase 3a CAN update the PROSE constant in `lib/riskForm.ts` to use new labels (since the constants are co-located with the engine logic). What Phase 3a should NOT do is update the SYSTEM_PROMPT register block in `lib/aim.ts` AIM_REGISTER_ANCHOR_BLOCK — that's an LLM prompt anchor; Phase 3b handles those.

5. **Do NOT modify CC-PRIMAL-COHERENCE / CC-GRIP-CALIBRATION / CC-AGE-CALIBRATION / CC-CRISIS-PATH-PROSE code.**
6. **Do NOT switch `lib/riskForm.ts` to consume `gripFromDefensive`.** Stays on legacy `grippingPull.score` for V1; later CC handles that.
7. **Do NOT change the Aim threshold (60) or Grip threshold (40) in this CC.** Calibration recommendations are reported but not acted on.
8. **Do NOT bundle CC-ENGINE-VOCABULARY-BAN or CC-OPEN-TENSION-PROSE-RUBRIC work.** Separate CCs.
9. **Do NOT add new fixtures.**

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean (cold-rebuild — clear `.tsbuildinfo` first to catch any drift)
- [ ] `npm run lint` clean
- [ ] `npx tsx tests/audit/phase3aLabels.audit.ts` — all 10 assertions pass
- [ ] All other existing audits remain green (especially `aimRebuild.audit.ts` extension)
- [ ] No cohort cache changes
- [ ] No LLM prompt or anchor block changes

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **Type union updates** — paste `MovementQuadrantLabel` and `RiskFormLetter` updated unions.
3. **Quadrant label refinement code** — `computeMovementQuadrant` updated function.
4. **Risk Form refinement code** — `computeRiskFormFromAim` updated function + PROSE map.
5. **Jason fixture classification** — show new quadrant label and Risk Form letter for Jason. Expected: Goal-led Presence (if Soul=53 crosses 50) OR Work without Presence (if doesn't); Ungoverned Movement for Risk Form.
6. **Cohort distribution table** — for all 28 fixtures: legacy quadrant / new quadrant / legacy Risk Form / new Risk Form. Highlight reclassifications.
7. **Threshold calibration recommendation** — based on cohort distribution, recommend whether to adjust the 60 Aim threshold in a follow-on CC.
8. **Backward compatibility confirmation** — every new label has a `legacyLabel` / `legacyLetter` alias.
9. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
10. **Out-of-scope verification** — confirm none of the 9 DO-NOT items were touched.

---

**Architectural test:** Jason fixture's Risk Form letter becomes "Ungoverned Movement" (was "Free movement"); his quadrant becomes "Goal-led Presence" (was "Giving / Presence" — the 32° angle is outside 42-58° band). Cohort distribution shifts cleanly: Wisdom-governed → Open-Handed Aim, Free movement → Ungoverned Movement, and any high-both-axes-but-off-angle fixtures get the new Goal-led / Soul-led Presence labels. No LLM, render, or cache changes.
