# CC-097B — Cross-Signal Driver Inference + Mirror-Axis Output (Layer 2)

## Objective

Per the four-class routing failure taxonomy (`feedback_se_fi_attractor_canon.md`) surfaced 2026-05-17:

- **Class A** (Si/Se driver false low-confidence) is resolved by **CC-097-CONFIDENCE-FIX** (landed).
- **Class B** (Ne→Fe promotion — Michele's ENFP reads as ENFJ) and **Class C** (Fe→Se demotion — Kevin's ESFJ reads as ESFP) are **NOT** resolved by CC-097A's Q-T rewords alone for **existing** stored sessions. Cohort fixtures are signal-indexed, so existing Michele/Kevin renders won't shift from CC-097A. They require a **cross-signal layer** that consumes Compass cluster + OCEAN + keystone + cost surface + Trust register + Distribution + DiSC-derived signals to disambiguate when Q-T direct read disagrees with the cross-signal pattern.
- **Class D** (mirror-axis — Harry's Si↔Ne, Ashley's Se↔Ni) requires a **first-class engine output**: when Q-T direct AND cross-signal point to opposite mirror-partners (with both function clusters scoring moderate-high), the engine should output *mirror-axis read* rather than forcing a winner. The axis IS the shape; the tension is the form.

Per Jason canon 2026-05-17 (`feedback_mbti_as_litmus_canon.md`): MBTI is litmus, not product. Engine produces driver-function reads; cohort is validation surface. Per `feedback_jungian_over_mbti_canon.md`: engine detects any 4-function ordering including non-MBTI (Harry's Si-Fe-Ne-Te).

This CC ships **(a) cross-signal driver inference** + **(b) mirror-axis output schema**. Defers **(c) function-by-function Lens prose composer** to CC-097D.

## Sequencing

- **Fires AFTER CC-097A + CC-097-CONFIDENCE-FIX have landed.** This CC builds on the corrected confidence calc.
- **Independent of CC-097C** (mirror-axis output integration with card routing) and **CC-097D** (Lens prose composer). Those follow.
- **Independent of CC-098** (card routing table widening).

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Architectural CC, two phases:

1. **Phase 1 — Cross-signal driver inference module.** New file `lib/crossSignalDriverInference.ts`. Per-function scoring (8 functions). Integration in `aggregateLensStack()` or layered after. Output: parallel driver-function inference + comparison with Q-T direct read.
2. **Phase 2 — Mirror-axis detection + output schema.** When Q-T direct and cross-signal disagree across canonical mirror pairs (Si↔Ne, Ni↔Se, etc.) AND both function clusters score moderate-high, output mirror-axis result. New optional field on LensStack: `mirrorAxis?: MirrorAxisRead`. New optional field: `crossSignalAgreement?: "agree" | "disagree-prefer-cross-signal" | "mirror-axis"`.

Single executor pass. Both phases ship together.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`
- `npx tsx scripts/<diagnostic>.ts`

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `lib/jungianStack.ts` — `aggregateLensStack()` post-CONFIDENCE-FIX. Note the LensStack schema (returned object shape). Understand how the result flows to `lens_stack: stack` at `lib/identityEngine.ts:2129`.
2. `lib/identityEngine.ts` — constitution-level structure. Locate where Compass top values, OCEAN scores, keystone belief, cost surface (Q-I1), Trust register (Q-X3/Q-X4), Distribution buckets are computed/exposed. The cross-signal inference will consume these.
3. `lib/types.ts` — `LensStack` type definition. The mirror-axis output adds optional fields.
4. `data/questions.ts` — Q-X3 / Q-X4 / Q-I1 / Q-S1 / Q-S2 question structures (for cross-signal extraction).
5. `tests/fixtures/cohort/` — pull at minimum 3 fixtures representing Class B exemplar (Michele Ne-Fi true, Q-T reads Fe-Ni), Class C exemplar (Kevin Fe-Si true, Q-T reads Se-Fi), Class D exemplar (Harry Si-Fe-Ne-Te). If cohort lacks any of these, **add synthetic fixtures** so the audit can validate.
6. `feedback_se_fi_attractor_canon.md` — four-class taxonomy + cross-signal anchors (canonical weights per driver function).
7. `feedback_mirror_axis_canon.md` — mirror-axis detection logic + output schema canon.
8. `feedback_jungian_over_mbti_canon.md` — non-canonical stack support; engine detects any 4-function ordering.
9. `feedback_mbti_as_litmus_canon.md` — MBTI labels suppressed user-mode, provisional clinician-mode; cohort = validation surface.
10. `project_cohort_calibration_2026_05_17.md` — empirical cohort data (Compass per user, OCEAN, keystone, Distribution). Use as canon-weights validation surface.
11. `feedback_minimal_questions_maximum_output.md` — derive new dimensions from existing signals; DiSC is derived, not measured.
12. `feedback_gradient_calibration_canon.md` — gradient routing for nuanced inputs; cross-signal scoring is gradient by construction.

## Scope

### Phase 1 — Cross-signal driver inference

**New file: `lib/crossSignalDriverInference.ts`**

Exports:

```typescript
export type CognitiveFunctionId = "si" | "se" | "ni" | "ne" | "ti" | "te" | "fi" | "fe";

export interface CrossSignalScores {
  ni: number;  // 0-100 driver-likelihood score
  ne: number;
  si: number;
  se: number;
  ti: number;
  te: number;
  fi: number;
  fe: number;
}

export interface CrossSignalDriverInference {
  /** Highest-scoring driver from cross-signal evidence */
  inferredDriver: CognitiveFunctionId;
  /** Score of inferred driver */
  inferredDriverScore: number;
  /** Score gap to second-highest function (confidence proxy) */
  scoreGap: number;
  /** Full scoring matrix for downstream consumers */
  scores: CrossSignalScores;
  /** Inputs used (debugging / transparency) */
  evidenceTrace: string[];
}

export function inferDriverFromCrossSignals(
  constitution: Constitution
): CrossSignalDriverInference;
```

**Per-function scoring (canon weights, validated against `project_cohort_calibration_2026_05_17.md`):**

```typescript
// Ni-driver detection (Jason exemplar — gold standard)
ni_score =
  + 25 * (compass_contains("Knowledge") ? 1 : 0)
  + 20 * (compass_contains("Truth") ? 1 : 0)
  + 15 * (keystone_register === "long-arc-pattern-bearing" ? 1 : 0)
  + 15 * (distribution["building_and_wealth"] >= 0.30 ? 1 : 0)
  + 10 * (ocean.openness >= 75 ? 1 : 0)
  + 10 * (ocean.conscientiousness >= 90 ? 1 : 0)
  + 5  * (work_map === "Strategic / Architectural" ? 1 : 0);

// Ne-driver detection (Michele exemplar — Class B target)
ne_score =
  + 25 * (compass_contains("Freedom") ? 1 : 0)
  + 20 * (keystone_register === "humanist-universal-essence" ? 1 : 0)
  + 15 * (ocean.openness >= 75 && ocean.conscientiousness >= 80 ? 1 : 0)
  + 15 * (cost_surface_count <= 3 ? 1 : 0)  // narrow + selective
  + 10 * (distribution["risk_and_uncertainty"] >= 0.30 ? 1 : 0)
  + 10 * (compass_contains("Knowledge") || compass_contains("Truth") ? 1 : 0)
  + 5  * (trust_register_includes("Education") || trust_register_includes("Journalism") ? 1 : 0);

// Si-driver detection (Daniel + Harry exemplars)
si_score =
  + 25 * (compass_contains("Faith") && (compass_contains("Honor") || compass_contains("Loyalty")) ? 1 : 0)
  + 20 * (trust_register_top_includes("Religious", "Small Business", "mentor") ? 1 : 0)
  + 15 * (keystone_register === "belief-held-close-tradition-anchored" ? 1 : 0)
  + 15 * (ocean.conscientiousness >= 90 ? 1 : 0)
  + 10 * (work_map === "Operational / Stewardship" ? 1 : 0)
  + 10 * (cost_surface_count >= 4 ? 1 : 0)
  + 5  * (distribution["building_and_wealth"] + distribution["people_service_society"] >= 0.65 ? 1 : 0);

// Se-driver detection (Cindy exemplar)
se_score =
  + 25 * (work_map === "Embodied Craft" ? 1 : 0)
  + 20 * (sub_register === "relational" ? 1 : 0)
  + 15 * (compass_contains("Family") && !compass_contains("Knowledge") && !compass_contains("Truth") ? 1 : 0)
  + 15 * (distribution["people_service_society"] >= 0.40 ? 1 : 0)
  + 10 * (ocean.openness <= 75 ? 1 : 0)  // moderate-only openness
  + 10 * (ocean.conscientiousness <= 95 ? 1 : 0)
  + 5  * (cost_surface_count >= 4 ? 1 : 0);

// Fe-driver detection (Kevin exemplar — Class C target)
fe_score =
  + 25 * (compass_contains("Family") && (compass_contains("Compassion") || compass_contains("Loyalty")) ? 1 : 0)
  + 20 * (ocean.agreeableness >= 90 && ocean_agreeableness_register === "moral-concern-dominant" ? 1 : 0)
  + 15 * (work_map === "Pastoral / Counselor" || work_map === "Embodied Craft" ? 1 : 0)
  + 15 * (sub_register === "relational" || sub_register === "protective" ? 1 : 0)
  + 10 * (trust_register_includes_relational ? 1 : 0)
  + 10 * (cost_surface_count >= 4 ? 1 : 0)
  + 5  * (distribution["people_service_society"] >= 0.40 ? 1 : 0);

// Fi-driver detection
fi_score =
  + 25 * (keystone_register === "individual-conscience-autonomy" ? 1 : 0)
  + 20 * (compass_contains("Freedom") && (compass_contains("Truth") || compass_contains("Justice")) ? 1 : 0)
  + 15 * (cost_surface_count <= 3 ? 1 : 0)  // selective conviction
  + 15 * (ocean.agreeableness >= 80 && ocean_agreeableness_register === "moral-concern-dominant" ? 1 : 0)
  + 10 * (compass_contains("Compassion") ? 1 : 0)
  + 10 * (trust_register_includes("own counsel") ? 1 : 0)
  + 5  * (work_map === "Pastoral / Counselor" ? 1 : 0);

// Te-driver detection (Jason exemplar — Te-aux, validated via DiSC D-highest)
te_score =
  + 25 * (disc_derived_D_highest ? 1 : 0)
  + 20 * (work_map === "Strategic / Architectural" || work_map === "Operational / Stewardship" ? 1 : 0)
  + 15 * (compass_contains("Knowledge") || compass_contains("Honor") ? 1 : 0)
  + 15 * (ocean.extraversion >= 60 && ocean.conscientiousness >= 90 ? 1 : 0)
  + 10 * (distribution["building_and_wealth"] >= 0.25 ? 1 : 0)
  + 10 * (disc_derived_S_low ? 1 : 0)
  + 5  * (sub_register === "mastery" ? 1 : 0);

// Ti-driver detection (no cohort exemplar yet; conservative scoring)
ti_score =
  + 20 * (compass_contains("Knowledge") && compass_contains("Truth") ? 1 : 0)
  + 20 * (ocean.openness >= 75 && ocean.conscientiousness >= 80 && ocean.agreeableness <= 75 ? 1 : 0)
  + 15 * (work_map === "Strategic / Architectural" ? 1 : 0)
  + 15 * (cost_surface_count <= 3 ? 1 : 0)
  + 10 * (keystone_register === "logical-coherence-bearing" ? 1 : 0)
  + 10 * (disc_derived_D_low && disc_derived_C_high ? 1 : 0)
  + 5  * (ocean.agreeableness <= 75 ? 1 : 0);
```

**DiSC derivation (helpers within the module — derived from existing signals):**

```typescript
// DiSC is derived per feedback_minimal_questions_maximum_output.md — no new survey questions.
function deriveDiSC(constitution: Constitution): {
  D: number;  // 0-100
  i: number;
  S: number;
  C: number;
} {
  return {
    D: weightedSum([
      { signal: te_signal_strength, weight: 0.35 },
      { signal: goal_orientation, weight: 0.25 },
      { signal: 100 - ocean.agreeableness, weight: 0.15 },
      { signal: ocean.extraversion, weight: 0.15 },
      { signal: distribution["building_and_wealth"] * 100, weight: 0.10 },
    ]),
    i: weightedSum([
      { signal: fe_signal_strength, weight: 0.30 },
      { signal: ne_signal_strength, weight: 0.20 },
      { signal: ocean.extraversion, weight: 0.20 },
      { signal: ocean.agreeableness, weight: 0.15 },
      { signal: distribution["people_service_society"] * 100, weight: 0.15 },
    ]),
    S: weightedSum([
      { signal: si_signal_strength, weight: 0.30 },
      { signal: fe_signal_strength, weight: 0.25 },
      { signal: ocean.agreeableness, weight: 0.20 },
      { signal: 100 - ocean.openness, weight: 0.15 },
      { signal: cost_surface_count * 10, weight: 0.10 },
    ]),
    C: weightedSum([
      { signal: ti_signal_strength, weight: 0.25 },
      { signal: ni_signal_strength, weight: 0.20 },
      { signal: ocean.conscientiousness, weight: 0.25 },
      { signal: compass_contains_knowledge_or_truth ? 100 : 0, weight: 0.15 },
      { signal: ocean.openness, weight: 0.15 },
    ]),
  };
}
```

**Validation: cohort fixtures must produce expected driver inference:**

| User | Q-T direct | Cross-signal expected | Status |
|---|---|---|---|
| Jason | Ni | **Ni** (top score), Te 2nd | agree → high confidence |
| Daniel | Si | **Si** (top), Te 2nd | agree → high confidence |
| Cindy | Se | **Se** (top), Fi 2nd | agree → high confidence |
| Harry | Si | **Si** (top), Fe 2nd | agree → high confidence (non-canonical Si-Fe aux) |
| Michele | Fe (currently misread) | **Ne** (top), Fi 2nd | **disagree → cross-signal preferred** |
| Kevin | Se (currently misread) | **Fe** (top), Si 2nd | **disagree → cross-signal preferred** |
| Ashley | Se surface | **Ni** OR Se, depending on score gap → mirror-axis detected | **mirror-axis** if both Ni-cluster AND Se-cluster score moderate-high |

### Phase 2 — Mirror-axis detection + output schema

**Mirror pairs (per `feedback_mirror_axis_canon.md`):**

```typescript
const MIRROR_PAIRS: Record<CognitiveFunctionId, CognitiveFunctionId> = {
  si: "ne",  // Si-Ne mirror axis (ISTJ↔ENFP / ISFJ↔ENTP)
  ne: "si",
  ni: "se",  // Ni-Se mirror axis (INTJ↔ESFP / INFJ↔ESTP)
  se: "ni",
};
// Judging functions don't form mirror axes in the same way (Ti↔Te, Fi↔Fe are
// attitude-only differences). Mirror axes specifically apply to perceiving
// functions per Jung canon.
```

**Mirror-axis detection logic:**

```typescript
function detectMirrorAxis(
  qtDirectStack: LensStack,
  crossSignalInference: CrossSignalDriverInference
): MirrorAxisRead | null {
  const qtDriver = qtDirectStack.dominant;
  const csDriver = crossSignalInference.inferredDriver;

  // Mirror partners?
  if (MIRROR_PAIRS[qtDriver] !== csDriver) return null;

  // Both function clusters score moderate-high (e.g., >= 50)?
  const qtFunctionScore = crossSignalInference.scores[qtDriver];
  const csFunctionScore = crossSignalInference.scores[csDriver];
  if (qtFunctionScore < 50 || csFunctionScore < 50) return null;

  // Mirror-axis confirmed.
  return {
    axisName: `${qtDriver.toUpperCase()}-${csDriver.toUpperCase()}`,
    primary: qtDriver,          // currently leading
    secondary: csDriver,         // latent / rising
    confidence: "high",          // confidence in the AXIS, not in the dominant
    primaryScore: qtFunctionScore,
    secondaryScore: csFunctionScore,
  };
}
```

**LensStack schema additions (in `lib/types.ts`):**

```typescript
export interface LensStack {
  dominant: CognitiveFunctionId;
  auxiliary: CognitiveFunctionId;
  tertiary: CognitiveFunctionId;
  inferior: CognitiveFunctionId;
  confidence: "high" | "low";  // unchanged from CC-097-CONFIDENCE-FIX
  mbtiCode?: string;

  // NEW — CC-097B
  crossSignalAgreement?: "agree" | "disagree-prefer-cross-signal" | "mirror-axis";
  crossSignalInferredDriver?: CognitiveFunctionId;  // populated when disagree or mirror
  mirrorAxis?: MirrorAxisRead;  // populated only when mirror-axis detected
}

export interface MirrorAxisRead {
  axisName: string;          // e.g., "SI-NE", "SE-NI"
  primary: CognitiveFunctionId;
  secondary: CognitiveFunctionId;
  primaryScore: number;
  secondaryScore: number;
  confidence: "high";        // axis is the shape; high by construction
}
```

**Integration in `aggregateLensStack()` (in `lib/jungianStack.ts`):**

After existing logic computes the LensStack from Q-T signals, call `inferDriverFromCrossSignals(constitution)` and post-process:

```typescript
const qtDirectStack = /* existing aggregateLensStack logic */;
const crossSignal = inferDriverFromCrossSignals(constitution);

// Three cases:
if (crossSignal.inferredDriver === qtDirectStack.dominant) {
  // Case 1: AGREE — no override, high confidence
  qtDirectStack.crossSignalAgreement = "agree";
  qtDirectStack.crossSignalInferredDriver = crossSignal.inferredDriver;
  // confidence: stays as set by existing logic
} else if (isMirrorPartner(qtDirectStack.dominant, crossSignal.inferredDriver, crossSignal.scores)) {
  // Case 2: MIRROR-AXIS — both partners score moderate-high
  qtDirectStack.crossSignalAgreement = "mirror-axis";
  qtDirectStack.crossSignalInferredDriver = crossSignal.inferredDriver;
  qtDirectStack.mirrorAxis = detectMirrorAxis(qtDirectStack, crossSignal);
  qtDirectStack.confidence = "low";  // appropriately hedged
} else {
  // Case 3: DISAGREE — cross-signal preferred, hedge appropriately
  qtDirectStack.crossSignalAgreement = "disagree-prefer-cross-signal";
  qtDirectStack.crossSignalInferredDriver = crossSignal.inferredDriver;
  qtDirectStack.confidence = "low";  // user sees hedge prose about the disagreement
  // NOTE: We do NOT mutate dominant/aux to the cross-signal value yet.
  // The Q-T direct read remains in `dominant`; the cross-signal read is exposed
  // separately via crossSignalInferredDriver. CC-097D's Lens prose composer
  // will surface both registers ("Q-T points X; cross-signals point Y").
}
```

**Important: this CC does NOT mutate the existing `dominant`/`auxiliary`/`tertiary`/`inferior` fields.** Those continue to reflect Q-T direct read. CC-097B adds *parallel* cross-signal output via new fields. CC-097D will compose prose that surfaces both layers.

### Phase 3 — CC-089 hedge prose template update

CC-089's hedge prose currently says: *"The engine's confidence in this Lens read is low... your processing pattern leans toward X, supported by Y, but the signal isn't strong."*

After this CC, three hedge variants are needed:

**Variant A — `crossSignalAgreement === "mirror-axis"`:**

> *"Your processing pattern sits on the [axisName] axis — both registers are alive in you. The [primary] register protects [primary-description]; the [secondary] register reaches toward [secondary-description]. Most days one is leading; the other is never far. The tension between them is part of your shape, not a verdict."*

**Variant B — `crossSignalAgreement === "disagree-prefer-cross-signal"`:**

> *"Your ranking answers point toward the [qt-driver]-led pattern, but the broader signature of your other responses (Compass values, what you'd protect at cost, what you trust, how you organize your effort) suggests a [cross-signal-driver]-led pattern underneath. Both are real — the surface and the depth may be doing different work. Trust your own read of yourself if either feels off."*

**Variant C — `confidence === "low"` AND `crossSignalAgreement === "agree"`** (existing behavior, retained):

> *"The engine's read of your cognitive pattern is uncertain..."* (existing CC-089 wording).

**Update `lib/identityEngine.ts` Lens prose generation** (find the hedge block per CC-089) to route the three variants based on `crossSignalAgreement`.

### Phase 4 — Audit

New `tests/audit/crossSignalDriverInference.audit.ts` with assertions:

1. **Jason cohort fixture (Ni-Te clean):** `inferDriverFromCrossSignals` returns `inferredDriver: "ni"`, `crossSignalAgreement: "agree"`, score gap > 15.
2. **Daniel cohort fixture (Si-Te clean):** `inferredDriver: "si"`, `agreement: "agree"`, score gap > 15.
3. **Cindy cohort fixture (Se-Fi clean):** `inferredDriver: "se"`, `agreement: "agree"`, score gap > 15.
4. **Harry synthetic fixture (Si-Fe-Ne-Te non-canonical):** `inferredDriver: "si"`, `agreement: "agree"`, score gap > 10 (lower than canonical due to non-canonical aux).
5. **Michele synthetic fixture (Class B — true ENFP, Q-T mistakenly reads Fe-Ni):** Q-T `dominant: "fe"`, but `inferredDriver: "ne"`, `agreement: "disagree-prefer-cross-signal"`, `confidence: "low"`. **Add this fixture if not present.**
6. **Kevin synthetic fixture (Class C — true ESFJ, Q-T mistakenly reads Se-Fi):** Q-T `dominant: "se"`, but `inferredDriver: "fe"`, `agreement: "disagree-prefer-cross-signal"`. **Add this fixture if not present.**
7. **Ashley synthetic fixture (Class D — mirror-axis Se↔Ni):** Q-T `dominant: "se"`, cross-signal `inferredDriver: "ni"`, both scores >= 50, `agreement: "mirror-axis"`, `mirrorAxis.axisName: "SE-NI"`.
8. **DiSC derivation regression:** Jason fixture produces `D > i > C > S` ordering (matches Jason's lived DiSC per cohort calibration).
9. **DiSC derivation regression:** Harry synthetic fixture produces `S > i > C > D` ordering (matches Harry's lived DiSC).
10. **LensStack schema:** new optional fields (`crossSignalAgreement`, `crossSignalInferredDriver`, `mirrorAxis`) exist on the type AND are populated correctly per case.
11. **Hedge prose Variant A:** Ashley fixture's rendered Lens text contains "axis" and "both registers are alive."
12. **Hedge prose Variant B:** Michele fixture's rendered Lens text contains "broader signature" or "underneath" + names both Q-T-driver and cross-signal-driver.
13. **Cohort regression:** all 4 existing-agreement cohort fixtures (Jason/Daniel/Cindy/Harry) render with `agreement: "agree"` AND existing Lens prose unchanged (Variant C path not triggered for these).

### Phase 5 — Regression sweep

After Phases 1-4:
- Wave 1 + CC-084 through CC-094 + CC-097A + CC-097-CONFIDENCE-FIX audits all pass
- New `audit:cross-signal-driver-inference` passes 13/13
- CC-089 audit (`audit:hedged-low-confidence-lens`) — review with new hedge variants. Existing assertions about hedge presence should still pass for genuinely-low-confidence cases. New variant assertions land in CC-097B's audit.
- twoTier baseline drift: **expected for Michele/Kevin/Ashley synthetic fixtures** if their stored renders previously had no hedge prose (they did have ⚠ but now also get the new variant text). For existing-agreement cohort fixtures (Jason/Daniel/Cindy/Harry — agreement case), no drift. Document.

## Do NOT

- **Do NOT mutate the existing `dominant`/`auxiliary`/`tertiary`/`inferior` fields based on cross-signal.** Q-T direct read stays in those fields. Cross-signal output lives in NEW fields. CC-097D will compose prose that surfaces both.
- **Do NOT change `aggregateLensStack()`'s function signature.** Schema additions only.
- **Do NOT remove or change `confidence` calc logic** from CC-097-CONFIDENCE-FIX. Add to it; don't replace.
- **Do NOT change Q-T item wording.** CC-097A owns that.
- **Do NOT touch card routing** (Compass, Trust, Conviction, Gravity, Hands gift-category selection). CC-098 owns card routing widening.
- **Do NOT touch Lens prose composition for non-canonical stacks.** CC-097D owns the function-by-function prose composer. CC-097B only updates the HEDGE prose template (3 variants) per Phase 3.
- **Do NOT add Q-T items.** Cross-signal inference uses EXISTING signals (Compass, OCEAN, keystone, Trust, cost surface, Distribution). Per `feedback_minimal_questions_maximum_output.md`.
- **Do NOT change `lib/jungianStack.ts`'s confidence calc** beyond setting `confidence: "low"` when `crossSignalAgreement === "disagree-prefer-cross-signal"` or `"mirror-axis"`. The CC-097-CONFIDENCE-FIX same-dimension-mirror logic stays untouched.
- **Do NOT touch Wave 1 persistence files.**
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`.** Document expected drift; CC-088 style refresh follows separately.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No SDK.
- **Do NOT commit or push.**
- **Do NOT introduce MBTI label changes to user-facing prose.** MBTI label canon (suppressed user-mode, provisional clinician-mode) stays. Surface label for `disagree` cases stays "provisional"; for `mirror-axis` cases, surface label can become the axis name ("Si-Ne axis") OR stay "provisional" — executor's call, flag in report.

## Allowed to Modify

- `lib/crossSignalDriverInference.ts` (new file — cross-signal scoring module)
- `lib/jungianStack.ts` — integrate cross-signal inference at end of `aggregateLensStack()`; populate new LensStack fields
- `lib/types.ts` — add `crossSignalAgreement`, `crossSignalInferredDriver`, `mirrorAxis` optional fields to `LensStack`; add `MirrorAxisRead` interface
- `lib/identityEngine.ts` — Lens prose hedge variants (Phase 3); locate per CC-089 patch points (lines ~4900–4925 area). Variant A/B/C routing based on `crossSignalAgreement`.
- `tests/fixtures/cohort/michele-ne-fi-class-b.json` (new — if Michele-class fixture doesn't exist)
- `tests/fixtures/cohort/kevin-fe-si-class-c.json` (new — if Kevin-class fixture doesn't exist)
- `tests/fixtures/cohort/ashley-mirror-axis-se-ni.json` (new — if Ashley-class fixture doesn't exist)
- `tests/audit/crossSignalDriverInference.audit.ts` (new)
- `package.json` — add `audit:cross-signal-driver-inference` script
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Q-T item wording (CC-097A)
- Confidence calc logic in `aggregateLensStack()` (CC-097-CONFIDENCE-FIX)
- Card routing — Compass / Trust / Conviction / Gravity / Hands gift-category selection (CC-098)
- Function-by-function Lens prose composer for non-canonical stacks (CC-097D)
- Engine math (Goal / Soul / Aim / Grip / Movement)
- LLM rewrite layer
- DB schema changes
- New survey questions (per `feedback_minimal_questions_maximum_output.md`)

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes (no new warnings introduced)
3. `npx tsx tests/audit/crossSignalDriverInference.audit.ts` passes 13/13
4. Wave 1 audits still pass
5. CC-084 through CC-094 + CC-097A + CC-097-CONFIDENCE-FIX audits still pass
6. Michele synthetic fixture: Q-T `dominant: "fe"` + cross-signal `inferredDriver: "ne"` + `agreement: "disagree-prefer-cross-signal"`
7. Kevin synthetic fixture: Q-T `dominant: "se"` + cross-signal `inferredDriver: "fe"` + `agreement: "disagree-prefer-cross-signal"`
8. Ashley synthetic fixture: mirror-axis output with `axisName: "SE-NI"`, both scores >= 50
9. Jason/Daniel/Cindy/Harry agreement cases: `agreement: "agree"` + existing Lens prose unchanged
10. DiSC derivation: Jason produces D > i > C > S; Harry produces S > i > C > D
11. New LensStack fields populated correctly
12. Existing LensStack fields (`dominant`/`auxiliary`/`tertiary`/`inferior`) unchanged for all cohort fixtures
13. Three hedge variants implemented per Phase 3; routed by `crossSignalAgreement`
14. Zero engine math changes (Goal/Soul/Aim/Grip/Movement untouched)
15. Zero card routing changes (categoryHasSupport, picker, gift categories all unchanged)
16. Zero Wave 1 persistence file changes
17. Zero LLM calls
18. Zero cache file modifications
19. Zero snapshot baseline regenerations (document expected drift)
20. Zero commits

## Report Back

- Cross-signal scoring weights implemented (canon vs deviated — report any cohort-fit adjustments to the weights)
- DiSC derivation formulas (canon vs deviated)
- Per cohort fixture: Q-T dominant + cross-signal inferred + agreement status + score gap
- Mirror-axis detection results: which fixtures triggered, what the axis read produced
- Hedge prose variants implemented (Phase 3)
- Cohort regression: confirmation that 4 agreement cases (Jason/Daniel/Cindy/Harry) render identically to pre-CC
- Synthetic fixtures added (Michele/Kevin/Ashley) — their full signal compositions for record
- twoTier baseline drift documentation: which fixtures' rendered output changes
- Audit results (13/13 + regression sweep)
- Any deviation from Allowed-to-Modify list

## Notes for executor

- Estimated time: 3-5 hours (architectural CC; new module + integration + 3 fixtures + 13-assertion audit + prose variants)
- Cost: $0 (no LLM)
- **The scoring weights in Phase 1 are CANON-first, empirical-validate-second.** They derive from Jason's editorial judgment on the cohort calibration data. Run the cohort through the scoring matrix first. If a fixture's expected driver doesn't come out on top, adjust the weights — but document EVERY adjustment with rationale ("Lowered Si weight on Conscientiousness from 15 to 10 because cohort fixture X scored Si=N with weight 15 but expected Fe=N"). Per `AGENTS.md`, apply canon-faithful interpretation; flag deviations in report.
- The architecture intentionally adds PARALLEL output rather than mutating Q-T direct read. This preserves the existing engine surface for any downstream consumer that doesn't yet know about cross-signal output, while giving CC-097D and future CCs a clean integration point.
- Per `feedback_mbti_as_litmus_canon.md`: when Q-T and cross-signal disagree, the cross-signal is preferred for the *read*, but the engine doesn't print "you are an X" — it surfaces the texture of both reads. The user confirms.
- Per `feedback_jungian_over_mbti_canon.md`: non-canonical stacks like Harry's Si-Fe-Ne-Te should produce agreement reads where cross-signal aligns with Q-T direct (Harry's Compass + Trust + DiSC all confirm Si-Fe). The CC-097B architecture doesn't care whether the resulting stack is MBTI-canonical; it cares whether the layers agree.
- **Important architectural choice:** the cross-signal layer is *additive* to the existing LensStack. It does NOT replace Q-T direct read. The `dominant` field continues to reflect what the user's Q-T ranking said. New fields (`crossSignalInferredDriver`, `mirrorAxis`) carry the parallel signal. This is the canon-faithful interpretation of "MBTI as litmus" — Q-T is the surface; cross-signal is the latent layer; both are exposed; prose layer (CC-097D) composes them.
- Apply canon-faithful interpretation on ambiguity per `AGENTS.md` and flag in report.
