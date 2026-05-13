# CC-PRIMAL-COHERENCE — Two-Path Framework Gating (Trajectory vs Crisis)

**Origin:** Jason's insight (2026-05-10) — the 50° life model isn't universal. It's the framework for the *trajectory class* of users (those whose Primal cluster aligns with their Goal/Soul shape). When a user's Primal cluster *inverts* against their Goal/Soul shape (e.g., high *Am I successful?* grip with low Goal score, or high *Am I loved?* grip with low Soul score), the trajectory framework breaks — telling that user "your trajectory is 32° Goal-leaning at strength 71" is technically accurate AND functionally cruel. It confirms a shape they're not actually inhabiting.

This CC adds a coherence-gating step to the engine. It computes the gap between the user's actual Goal/Soul scores and the expected profile for their Primal cluster, and sets `pathClass: "trajectory" | "crisis"` on the constitution. Downstream consumers (Path/Gait card, Grip section, Movement section, eventual visualization) gate prose register on `pathClass`.

**Critical constraint:** this CC is purely additive. It computes the coherence reading and attaches it to the constitution. It does NOT change any existing prose render. CC-CRISIS-PATH-PROSE (queued behind this) is the prose-layer CC that wires up differential rendering. Splitting them respects the canon: engine for truth, LLM for reception.

**Canon for this CC** (Jason validated 2026-05-10):

> *Sometimes the grip is not what's pulling you off course. It's what you're reaching for because there is no course yet. The work isn't to loosen — the work is to build something for the hand to hold.*

This canon line is the architectural framing the instrument operates inside when the crisis-path applies. It does NOT belong in any user-facing prose yet — that's CC-CRISIS-PATH-PROSE territory. Embed it in code comments as the architectural anchor for the gating logic.

**Method discipline:** Engine for truth. LLM for reception. Per `feedback_engine_for_truth_llm_for_reception.md` — the engine DECIDES the path class (deterministic computation over Primal cluster + Goal/Soul scores). No LLM judgment in the gating logic. Output is fully transparent: actualScores + expectedRange + gap + pathClass + crisisFlavor with rationale.

**Scope frame:** Two-part architecture — (1) coherence computation + per-Primal expected-profile table, (2) gating attachment to constitution. ~1-2 hours executor time. CC-standard scale (smaller than CC-GRIP-CALIBRATION because no LLM prompt updates and no render changes).

**Cost surface:** Zero. Pure deterministic logic; no LLM calls; no cache regeneration. Audit + cohort verification only.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The miscluster pattern that triggered this CC

A user with a Primal cluster like *Am I successful?* + *Am I good enough?* who has Goal score 30 and Soul score 25 is in a fundamentally different place than a user with the same Primal cluster and Goal 80 / Soul 50. The first is reaching for excellence/consequence without the work-line to carry that weight — the grip is naming a longing the shape isn't yet supporting. The second is in trajectory: the Primal pressure is aligned with the energy profile that supports it.

The current engine renders both users identically — same Path/Gait card, same trajectory degree-reading, same Movement section. That's the bug this CC fixes. The first user's report needs to say *"the read points at something hard — there's a gap between what you're reaching for and what you're building right now"* rather than *"your trajectory is 18° Goal-leaning at strength 39."*

### Per-Primal expected Goal/Soul profile (load-bearing table)

Each Primal Question has an *expected* Goal/Soul correlation profile based on the canonical healthy expression of that Primal:

| Primal | Native axis | Expected Goal range | Expected Soul range | Notes |
|---|---|---|---|---|
| Am I safe? | (defensive baseline) | {25, 100} | {25, 100} | Not strongly axis-aligned; only crisis-flagged on extreme withdrawal (both axes < 20) |
| Am I secure? | Goal-leaning | {40, 100} | {20, 100} | Stewardship of resources to build; concerning if Goal < 30 with high secure-grip |
| Am I loved? | Soul-leaning | {15, 100} | {40, 100} | Tenderness, presence, relational depth; concerning if Soul < 30 with high love-grip |
| Am I wanted? | Soul-leaning (room-shaped) | {15, 100} | {35, 100} | Outward-Soul; concerning if Soul < 25 with high wanted-grip |
| Am I successful? | Strongly Goal-leaning | {55, 100} | {15, 100} | Excellence, consequence, output; concerning if Goal < 40 — Jason's "ouch" case |
| Am I good enough? | Goal-leaning + Soul integration | {40, 100} | {25, 100} | Craft requires both axes; concerning if BOTH Goal < 30 AND Soul < 25 |
| Do I have purpose? | Both axes | {35, 100} | {35, 100} | Purpose integrates work and giving; concerning if BOTH below 30 |

These ranges are starting heuristics. They MUST be calibratable as constants in `lib/primalCoherence.ts` so cohort testing can refine them without touching computation logic.

### Gap calculation

For the dominant Primal P with high or medium-high confidence:

```
goalGap = max(0, expected[P].goalRange.min - actual.goalScore)
soulGap = max(0, expected[P].soulRange.min - actual.soulScore)
totalGap = goalGap + soulGap
```

Crisis-path threshold: `totalGap >= 20`. Below 20: trajectory-path. At/above 20: crisis-path.

For Primals where the concerning condition requires BOTH axes low (Am I good enough?, Do I have purpose?), use a logical-AND check rather than additive gap:

```
if (goalGap > 10 AND soulGap > 5) → crisis path
```

Encode this nuance per-Primal in the expected-profile table.

### Crisis flavor classification

When `pathClass === "crisis"`, derive a `crisisFlavor` for downstream prose register:

| Flavor | Trigger | Prose register hint |
|---|---|---|
| `longing-without-build` | Goal-leaning Primal + actual Goal below expected min | "Reaching for consequence; work-line is empty." |
| `grasp-without-substance` | Soul-leaning Primal + actual Soul below expected min | "Reaching for love/belonging; relational line is empty." |
| `paralysis` | Both-axes Primal (good-enough, purpose) + both axes below expected | "Shame/restlessness without a project to hold it." |
| `withdrawal` | Am-I-safe? Primal + both axes below 20 | "Movement collapse; the work is not refinement, it's re-engagement." |
| `restless-without-anchor` | Do-I-have-purpose? Primal + both axes below 30 | "Reinvention loop; the work is to commit to a smaller thing first." |

Note: `restless-without-anchor` is a special case of `paralysis` for the purpose Primal. Encode as a separate flavor so the LLM prose layer (in CC-CRISIS-PATH-PROSE) can target it specifically.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/primalCoherence.ts` | NEW | `PRIMAL_EXPECTED_PROFILE` constants, `computePrimalCoherence()` function, `CoherenceReading` type, gap math, crisis-flavor derivation. |
| `lib/types.ts` | MODIFY | Add `coherenceReading?: CoherenceReading` to `InnerConstitution` type. |
| `lib/identityEngine.ts` | MODIFY (surgical) | Add `attachPrimalCoherence()` helper called after `attachGripTaxonomy()` in the constitution-building chain. Reads `gripTaxonomy.primary`, `goalSoulGive.goalScore`, `goalSoulGive.soulScore` as inputs. |
| `tests/audit/primalCoherence.audit.ts` | NEW | Audit assertions covering profile completeness, gap math, path-class derivation, crisis-flavor mapping, zero-regression. |
| `tests/fixtures/coherence/01-trajectory-class.json` | NEW (synthetic) | Synthetic fixture for a coherent shape (e.g., Am I successful? + Goal 75 + Soul 40). Asserts `pathClass === "trajectory"`. |
| `tests/fixtures/coherence/02-crisis-longing-without-build.json` | NEW (synthetic) | Synthetic fixture: Am I successful? grip + Goal 25 + Soul 20. Asserts `pathClass === "crisis"`, `crisisFlavor === "longing-without-build"`. |
| `tests/fixtures/coherence/03-crisis-grasp-without-substance.json` | NEW (synthetic) | Synthetic fixture: Am I loved? grip + Soul 20 + Goal 35. Asserts `pathClass === "crisis"`, `crisisFlavor === "grasp-without-substance"`. |
| `tests/fixtures/coherence/04-crisis-paralysis.json` | NEW (synthetic) | Synthetic fixture: Am I good enough? grip + Goal 22 + Soul 18. Asserts `pathClass === "crisis"`, `crisisFlavor === "paralysis"`. |

### Type signatures

```ts
// lib/primalCoherence.ts

export type PathClass = "trajectory" | "crisis";

export type CrisisFlavor =
  | "longing-without-build"
  | "grasp-without-substance"
  | "paralysis"
  | "withdrawal"
  | "restless-without-anchor";

export type PrimalExpectedProfile = {
  primary: PrimalQuestion;
  goalRange: { min: number; max: number };
  soulRange: { min: number; max: number };
  // Concerning condition: 'additive' uses sum of gaps >= threshold;
  // 'both-axes' requires both gaps to exceed individual thresholds.
  concernRule:
    | { kind: "additive"; threshold: number }
    | { kind: "both-axes"; goalGapMin: number; soulGapMin: number };
  crisisFlavorWhenInverted: CrisisFlavor;
  // Optional special-case predicate for nuanced flavor selection.
  crisisFlavorOverride?: (goal: number, soul: number) => CrisisFlavor | null;
};

export type CoherenceReading = {
  // Inputs (preserved for transparency):
  primalPrimary: PrimalQuestion | null;
  primalConfidence: PrimalCluster["confidence"];
  actualGoalScore: number;
  actualSoulScore: number;
  expectedGoalRange: { min: number; max: number } | null;
  expectedSoulRange: { min: number; max: number } | null;

  // Derived:
  goalGap: number;
  soulGap: number;
  totalGap: number;
  pathClass: PathClass;
  crisisFlavor: CrisisFlavor | null;

  // Transparency:
  rationale: string;
  // Edge cases:
  appliedOverride: boolean; // true if crisisFlavorOverride fired
  primalConfidenceTooLow: boolean; // when confidence is "low", coherence falls back to trajectory by default
};

export const PRIMAL_EXPECTED_PROFILE: Record<PrimalQuestion, PrimalExpectedProfile>;

export function computePrimalCoherence(
  primalCluster: PrimalCluster,
  goalScore: number,
  soulScore: number
): CoherenceReading;
```

### Gating semantics

**Confidence gate:** if `primalCluster.confidence === "low"` OR `primalCluster.primary === null`, the coherence reading defaults to `pathClass: "trajectory"` with `primalConfidenceTooLow: true`. Rationale: we don't have enough Primal signal to make a crisis-class call. Better to default to the existing prose than to miscall someone into the crisis register on thin evidence.

**Confidence "medium" gate:** medium-confidence Primal clusters CAN trigger crisis-path classification, but the rationale must explicitly note the medium-confidence basis. CC-CRISIS-PATH-PROSE will use this flag to soften the crisis-path register for medium-confidence cases (declarative-but-tentative rather than declarative-and-urgent).

**Pattern interaction with Risk Form:** users in the *Reckless-fearful* Risk Form quadrant (high Aim + high Grip) often present as crisis-path even when their Goal/Soul scores look healthy on paper. Edge case to flag in audit but NOT to handle in V1 — that's CC-RECKLESS-FEARFUL-PATH (separate, queued).

---

## Audit assertions (12 NEW)

In `tests/audit/primalCoherence.audit.ts`:

1. **`primal-coherence-profile-completeness`** — every `PrimalQuestion` value has a corresponding entry in `PRIMAL_EXPECTED_PROFILE` (no orphans, no missing).
2. **`primal-coherence-profile-validity`** — every profile has valid `goalRange` and `soulRange` (min < max, both 0-100).
3. **`primal-coherence-deterministic-output`** — running `computePrimalCoherence()` twice on identical inputs produces identical output (no randomness).
4. **`primal-coherence-low-confidence-defaults-trajectory`** — when `primalCluster.confidence === "low"`, output `pathClass === "trajectory"` AND `primalConfidenceTooLow === true`.
5. **`primal-coherence-trajectory-class-fixture`** — for `tests/fixtures/coherence/01-trajectory-class.json` (Am I successful? + Goal 75 + Soul 40), `pathClass === "trajectory"` and `crisisFlavor === null`.
6. **`primal-coherence-longing-without-build`** — for `tests/fixtures/coherence/02-crisis-longing-without-build.json`, `pathClass === "crisis"` AND `crisisFlavor === "longing-without-build"`.
7. **`primal-coherence-grasp-without-substance`** — for `tests/fixtures/coherence/03-crisis-grasp-without-substance.json`, `pathClass === "crisis"` AND `crisisFlavor === "grasp-without-substance"`.
8. **`primal-coherence-paralysis`** — for `tests/fixtures/coherence/04-crisis-paralysis.json`, `pathClass === "crisis"` AND `crisisFlavor === "paralysis"`.
9. **`primal-coherence-cohort-zero-regression`** — for the existing 24-fixture cohort, every fixture's `pathClass` is computed; report distribution. NO assertion that any specific fixture is trajectory or crisis (cohort is real-world data; this is observational). The audit just confirms the computation runs without errors and produces valid outputs.
10. **`primal-coherence-rationale-non-empty`** — every `CoherenceReading.rationale` is a non-empty string.
11. **`primal-coherence-gap-math-correct`** — for every cohort fixture, `goalGap === max(0, expected.goalRange.min - actual.goalScore)` AND `soulGap === max(0, expected.soulRange.min - actual.soulScore)` AND `totalGap === goalGap + soulGap`.
12. **`primal-coherence-no-prose-changes`** — confirm that `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx` are unchanged by this CC. (Audit reads file content and asserts no diff in those files. CC-PRIMAL-COHERENCE is purely additive at the engine layer; prose changes are CC-CRISIS-PATH-PROSE's job.)

In `tests/audit/gripCalibration.audit.ts` (extension):
- Add a check that `coherenceReading` is attached to every constitution after `attachGripTaxonomy()` runs — verifies the helper is wired into the chain. (1 new assertion.)

---

## Cohort observation report (NOT an audit assertion — informational)

After the code lands, run the coherence computation against the existing 24-fixture cohort and report the distribution as part of the report-back:

| Fixture | Primal | Goal | Soul | Path class | Crisis flavor (if applicable) |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

This gives Jason an observational view of which existing cohort fixtures fall into trajectory vs crisis class. Useful for cohort-thinness assessment (and possibly fixture-expansion priorities). Not an assertion because cohort data is real and we don't yet know what the "correct" distribution should be.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any prose render code.** `lib/renderMirror.ts`, `app/components/InnerConstitutionPage.tsx`, all LLM prompts in `lib/*Llm.ts` files — UNTOUCHED. Audit assertion #12 enforces this.
2. **Do NOT modify CC-GRIP-CALIBRATION code.** `lib/gripCalibration.ts`, `lib/gripTaxonomy.ts` — only EXTEND with the gating attachment, no edits to existing functions.
3. **Do NOT modify Goal/Soul scoring logic in `lib/goalSoulGive.ts`.** Coherence READS the scores; it does not WRITE them.
4. **Do NOT modify the Risk Form 2x2 classifier.** The "Reckless-fearful crisis-class" edge case is a separate CC.
5. **Do NOT add new survey questions.** Per `feedback_minimal_questions_maximum_output` — derive from existing signals. Coherence uses only Primal cluster + Goal/Soul scores.
6. **Do NOT add new top-level report sections.** No render changes whatsoever.
7. **Do NOT modify the Path/Gait card content.** Even though Path is the natural home for crisis-path differentiation, that's CC-CRISIS-PATH-PROSE's territory.
8. **Do NOT modify the four-vector dashboard plans (CC-TRAJECTORY-VISUALIZATION).** That CC depends on this one but is separate.
9. **Do NOT bundle the open-hands work (CC-OPEN-HANDS).** Open-hands prose only fires for trajectory-path users; the gating must land first.
10. **Do NOT modify fixture data outside the four NEW synthetic fixtures listed in the file map.**
11. **Do NOT add LLM-based interpretation in the gating logic.** Every classification is rule-driven and traceable.

---

## Verification checklist (executor must run all)

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/primalCoherence.audit.ts` (new — all 12 assertions pass)
- [ ] `npx tsx tests/audit/gripCalibration.audit.ts` (extended — original 12 + 1 new wiring assertion pass)
- [ ] `npx tsx tests/audit/gripTaxonomy.audit.ts`
- [ ] `npx tsx tests/audit/proseArchitecture.audit.ts`
- [ ] `npx tsx tests/audit/synthesis1a.audit.ts`
- [ ] `npx tsx tests/audit/synthesis1Finish.audit.ts`
- [ ] `npx tsx tests/audit/synthesis3.audit.ts`
- [ ] `npx tsx tests/audit/jungianCompletion.audit.ts`
- [ ] `npx tsx tests/audit/oceanDashboard.audit.ts`
- [ ] `npx tsx tests/audit/goalSoulGive.audit.ts`
- [ ] `npx tsx tests/audit/fixturesSiTiFiFe.audit.ts`
- [ ] `npx tsx tests/audit/mbtiLabelFix.audit.ts`

No build-time scripts or cohort regeneration needed (no LLM calls, no cache changes).

---

## Report-back format

When complete, report back:

1. **Summary** — files added/modified, line-count delta, audit-pass count.
2. **`PRIMAL_EXPECTED_PROFILE` table dump** — paste the full table from the new file. Confirms each Primal's expected ranges + concern rule + default crisis flavor.
3. **Synthetic fixture validation** — for each of the 4 new synthetic fixtures, paste the computed `CoherenceReading` (all fields). Confirm asserted classification fires.
4. **Cohort observational distribution** — table of all 24 cohort fixtures with their computed `pathClass` and `crisisFlavor`. Observational only; no assertions on what each fixture "should" be.
5. **Edge cases** — any cohort fixture where the gating produced an unexpected result (e.g., a fixture I'd intuit as trajectory-class that computed as crisis, or vice versa). Flag for Jason's review without acting on.
6. **Wiring confirmation** — confirm `attachPrimalCoherence()` is called after `attachGripTaxonomy()` in `lib/identityEngine.ts`, and that `coherenceReading` is populated on every output `InnerConstitution`.
7. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
8. **Out-of-scope verification** — confirm none of the 11 DO-NOT items were touched. Specifically confirm `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx` show zero diff.
9. **Recommendations for follow-on work** — including:
   - Suggested adjustments to `PRIMAL_EXPECTED_PROFILE` ranges based on cohort observation
   - Any crisis flavors that didn't trigger anywhere in the cohort (suggesting cohort-thinness gap, NOT a problem with the flavor)
   - Specific fixtures that should be added in CC-COHERENCE-FIXTURE-EXPANSION to cover untested crisis flavors

---

## Architectural notes for the executor

1. **The gating is one-way.** Coherence flags crisis-path users; it never re-flags a crisis-path user back to trajectory based on subsequent signals. This avoids classification thrash.

2. **The gating is conservative by default.** Low-confidence Primal clusters default to trajectory-path. Better to under-flag crisis than over-flag (a wrong "you're in crisis" is worse than a missed one).

3. **The gating is fully transparent.** Every `CoherenceReading` carries the inputs (Primal + scores), the expected ranges, the gap math, the path class, the flavor, and a rationale string. CC-CRISIS-PATH-PROSE will consume the rationale to inform LLM prose; the audit consumes it for traceability.

4. **The expected-profile table is the calibration surface.** When cohort testing reveals a Primal whose ranges need tightening or loosening, the only file that needs editing is `lib/primalCoherence.ts`. The table is intentionally co-located with the computation function so calibration is one-edit.

5. **The crisis flavors are starting heuristics.** CC-CRISIS-PATH-PROSE may surface that the 5 flavors don't cover the full crisis-class register (e.g., a "performance-fatigue" flavor for high-Conscientiousness users in coherent-but-edge-of-collapse state). That's a follow-on, not this CC's scope.

---

**Architectural test for this CC:** After it lands, the existing 24-fixture cohort should show a distribution between trajectory-class and crisis-class that's *plausible* (most fixtures trajectory; a small number crisis when the Goal/Soul scores genuinely fall below Primal expectations). And the four synthetic fixtures should hit their asserted classifications cleanly. If both happen, the gating works and CC-CRISIS-PATH-PROSE can build on top of it confidently.
