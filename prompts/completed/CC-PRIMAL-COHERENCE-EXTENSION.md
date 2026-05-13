# CC-PRIMAL-COHERENCE-EXTENSION — Working-Without-Presence Flavor + Threshold Tuning

**Origin:** CC-PRIMAL-COHERENCE landed cleanly 2026-05-10. Cohort observation surfaced two findings the original CC's gating rules missed:

1. **The Goal-pinned/Soul-collapsed pattern.** Three cohort fixtures (gsg/03-striving, gsg/08-early-career-striving, gsg/10-entrepreneur-striving) plus ocean/25-ti-coherence-prober share a shape: Goal score 100, Soul score 1–16, Am-I-good-enough? primal. The current `both-axes` concern rule (requires Goal-gap ≥ 10) misses these because Goal=100 has zero gap. But these are recognizably crisis-class — the workaholic/output-as-identity shape. **This is a sixth crisis flavor: `working-without-presence`.**

2. **`Am I successful?` additive threshold is too generous.** `gsg/07-true-gripping` (Goal 42, Soul 17, totalGap=13) sits just under the current threshold of 15. The fixture is literally named "true-gripping" — the cohort author intended a crisis read. Dropping threshold to 12 ships gsg/07 to crisis-class.

This is a small CC. Pure engine-layer additions to `lib/primalCoherence.ts` plus one new synthetic fixture plus audit extension. No prose changes; no LLM cache changes; no render changes.

**Method discipline:** Engine for truth. The new flavor has its own detection rule (override on the standard concern-rule path). The threshold tune is a single constant edit. Both are inspectable, deterministic, transparent.

**Scope frame:** ~45-90 minutes executor time. CODEX-scale (small surgical extension). Changes are additive; no behavior changes for existing trajectory-class fixtures or for the four already-handled crisis flavors.

**Cost surface:** Zero. Pure deterministic logic; no LLM calls; no cache regeneration.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The working-without-presence shape

| Field | Value | Reasoning |
|---|---|---|
| Trigger primals | Am I good enough? OR Am I successful? | Both are Goal-leaning primals where the user is reaching for excellence/standard |
| Goal threshold | ≥ 80 | The work-line is doing maximum work |
| Soul threshold | ≤ 20 | The relational/soul-line has collapsed under the work |
| Confidence requirement | NOT "low" | Don't flag working-without-presence on thin Primal signal |
| Override behavior | Replaces the default crisisFlavor for the matched primary primal | Detected before the standard concern-rule path |

### Why working-without-presence is its own flavor (not a refinement of paralysis or longing-without-build)

| Flavor | Work-line state | Soul-line state | Diagnostic |
|---|---|---|---|
| longing-without-build | low (gap from expected floor) | low or moderate | Grip is reaching for what isn't being built yet |
| paralysis | low | low | Grip is real; the project the shame would discipline isn't there |
| **working-without-presence** | **maximum (≥ 80, often pinned at 100)** | **collapsed (≤ 20)** | **Grip is real; output IS happening at maximum; output is the wrong answer to the question being asked** |

Each names a different shape with its own next move. Collapsing them loses the prose register.

### The threshold tune for Am-I-successful?

Current: additive ≥ 15
Proposed: additive ≥ 12

Rationale: gsg/07-true-gripping (Goal 42, Soul 17 → totalGap = 13) is intuitively crisis-class but currently classified as trajectory. The additive threshold of 15 is too generous for the Am-I-successful? primal specifically because its Goal expected floor is high (55) — even moderate gaps below the floor produce gap totals that should signal crisis.

Dropping to 12 makes gsg/07 tip to crisis. No other cohort fixtures cross the new threshold (verified per the CC-PRIMAL-COHERENCE cohort observation log).

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/primalCoherence.ts` | MODIFY | Add `working-without-presence` to `CrisisFlavor` union; add detection function; add override to `computePrimalCoherence`; drop Am-I-successful? threshold from 15 to 12. |
| `tests/fixtures/coherence/05-crisis-working-without-presence.json` | NEW (synthetic) | Synthetic fixture: Am-I-good-enough? grip + Goal 100 + Soul 5. Asserts `pathClass === "crisis"`, `crisisFlavor === "working-without-presence"`. |
| `tests/audit/primalCoherence.audit.ts` | MODIFY | Add 4 new assertions (flavor coverage, working-without-presence detection, threshold tune validation, gsg/07 reclassification check). |

### Type addition

```ts
export type CrisisFlavor =
  | "longing-without-build"
  | "grasp-without-substance"
  | "paralysis"
  | "withdrawal"
  | "restless-without-anchor"
  | "working-without-presence";  // NEW
```

### Detection rule (override path)

In `lib/primalCoherence.ts`, modify `computePrimalCoherence()`:

```ts
// NEW — working-without-presence override fires BEFORE the standard concern-rule path
function checkWorkingWithoutPresence(
  primalCluster: PrimalCluster,
  goalScore: number,
  soulScore: number
): { fires: boolean; rationale: string } {
  if (primalCluster.confidence === "low") return { fires: false, rationale: "" };
  if (primalCluster.primary !== "Am I good enough?" && primalCluster.primary !== "Am I successful?") {
    return { fires: false, rationale: "" };
  }
  if (goalScore < 80) return { fires: false, rationale: "" };
  if (soulScore > 20) return { fires: false, rationale: "" };
  return {
    fires: true,
    rationale: `Goal score ${goalScore} pinned at maximum (≥80) with Soul score ${soulScore} collapsed (≤20). Work-line is doing maximum work; relational/soul-line has collapsed under the work. The grip ("${primalCluster.primary}") is being answered with maximum output, yet the question is still firing — diagnostic signature that output is the wrong answer.`,
  };
}

// Inside computePrimalCoherence(), AFTER existing low-confidence check, BEFORE standard concern-rule:
const wwp = checkWorkingWithoutPresence(primalCluster, goalScore, soulScore);
if (wwp.fires) {
  return {
    primalPrimary: primalCluster.primary,
    primalConfidence: primalCluster.confidence,
    actualGoalScore: goalScore,
    actualSoulScore: soulScore,
    expectedGoalRange: PRIMAL_EXPECTED_PROFILE[primalCluster.primary]!.goalRange,
    expectedSoulRange: PRIMAL_EXPECTED_PROFILE[primalCluster.primary]!.soulRange,
    goalGap: 0,                            // Goal is over the floor
    soulGap: Math.max(0, PRIMAL_EXPECTED_PROFILE[primalCluster.primary]!.soulRange.min - soulScore),
    totalGap: 0,                           // Standard gap math doesn't apply
    pathClass: "crisis",
    crisisFlavor: "working-without-presence",
    rationale: wwp.rationale,
    appliedOverride: true,
    primalConfidenceTooLow: false,
  };
}
```

### Threshold tune

```ts
// In PRIMAL_EXPECTED_PROFILE for "Am I successful?":
{
  primary: "Am I successful?",
  goalRange: { min: 55, max: 100 },
  soulRange: { min: 15, max: 100 },
  concernRule: { kind: "additive", threshold: 12 },  // CHANGED from 15
  crisisFlavorWhenInverted: "longing-without-build",
}
```

### Synthetic fixture

`tests/fixtures/coherence/05-crisis-working-without-presence.json`:
- Construct a fixture with Am-I-good-enough? primal (high confidence), Goal score 100, Soul score 5
- Assert pathClass === "crisis", crisisFlavor === "working-without-presence", appliedOverride === true

---

## Audit assertions (4 NEW)

In `tests/audit/primalCoherence.audit.ts`:

13. **`primal-coherence-flavor-coverage-extended`** — every value in `CrisisFlavor` union has at least one synthetic fixture OR cohort fixture that produces it. (Acknowledges that some flavors won't fire on cohort due to thinness; synthetic fixtures cover.)

14. **`primal-coherence-working-without-presence-fixture`** — `tests/fixtures/coherence/05-crisis-working-without-presence.json` produces `pathClass === "crisis"`, `crisisFlavor === "working-without-presence"`, `appliedOverride === true`.

15. **`primal-coherence-am-successful-threshold-tune`** — `gsg/07-true-gripping` (Goal 42, Soul 17, Am-I-successful?) now produces `pathClass === "crisis"` with `crisisFlavor === "longing-without-build"`. (Validation that the threshold tune ships gsg/07 to crisis-class as intended.)

16. **`primal-coherence-cohort-working-without-presence-detection`** — for the 4 known cohort fixtures with the Goal-pinned/Soul-collapsed pattern (gsg/03-striving, gsg/08-early-career-striving, gsg/10-entrepreneur-striving, ocean/25-ti-coherence-prober), confirm `pathClass === "crisis"` and `crisisFlavor === "working-without-presence"` for each. This is the cohort validation of the new flavor's detection.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any prose render code.** `lib/renderMirror.ts`, `app/components/InnerConstitutionPage.tsx`, all LLM prompts — UNTOUCHED.
2. **Do NOT modify the threshold for any other primal.** Only Am-I-successful? threshold changes (15 → 12).
3. **Do NOT add new survey questions, modify Goal/Soul scoring, or modify the Risk Form classifier.**
4. **Do NOT modify the existing four crisis flavors.** They keep their detection rules, prose register, and behavior.
5. **Do NOT add new override rules for other primal patterns.** Only working-without-presence ships in this CC.
6. **Do NOT bundle prose-layer changes for working-without-presence.** That's CC-CRISIS-PATH-PROSE's territory; this CC just sets the flavor on the constitution.
7. **Do NOT modify CC-PRODUCT-THESIS-CANON, CC-RELIGIOUS-REGISTER-RULES, CC-AGE-CALIBRATION, or CC-AIM-CALIBRATION code.** This CC is engine-layer only and composes alongside.

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/primalCoherence.audit.ts` (extended — all 16 assertions pass; 12 original + 4 new)
- [ ] `npx tsx tests/audit/gripCalibration.audit.ts` (unchanged — pass)
- [ ] All other existing audits remain green

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **Updated CrisisFlavor union paste** — confirm 6-flavor enumeration.
3. **Detection function paste** — full `checkWorkingWithoutPresence` implementation.
4. **Threshold tune confirmation** — show the changed `concernRule.threshold` value for Am-I-successful?.
5. **Cohort reclassification report** — table comparing pre-CC and post-CC pathClass/crisisFlavor for ALL 24 cohort fixtures + 5 synthetic fixtures. Highlight changed rows. Expected changes: gsg/07 trajectory→crisis, gsg/03/08/10 trajectory→crisis (working-without-presence), ocean/25 trajectory→crisis (working-without-presence). All other fixtures unchanged.
6. **Synthetic fixture validation** — paste the computed CoherenceReading for fixture 05.
7. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
8. **Out-of-scope verification** — confirm none of the 7 DO-NOT items were touched.

---

**Architectural test for this CC:** the four cohort fixtures with Goal-pinned/Soul-collapsed shape land as crisis-class with `working-without-presence` flavor. gsg/07-true-gripping lands as crisis-class with `longing-without-build` flavor (the threshold tune working). Synthetic fixture 05 validates working-without-presence end-to-end. No other fixtures change classification. No prose-layer files touched. All audits green.
