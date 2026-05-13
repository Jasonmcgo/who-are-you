# CC-COHORT-EXPANSION-SI-SE-CRISIS — Fixture Expansion for Under-Represented Driver Shapes + Crisis Flavors

**Origin:** Three CC report-backs surfaced cohort thinness as a recurring constraint:

- **CC-PATTERN-CATALOG-SI-SE-FI** — Si/Ti/Fi/Fe driver patterns are validated by a single cohort fixture each (single-point observations are not robust validation).
- **CC-PRIMAL-COHERENCE-EXTENSION** — 4 of 6 crisis flavors (paralysis, withdrawal, restless-without-anchor, grasp-without-substance) don't fire on cohort.
- **CC-VOICE-RUBRIC-EXPANSION** — Si/Ti register reach is thinner than Se/Fi (3-of-7 markers vs 5-of-7).

This CC adds ~8 new fixtures spanning the under-represented dimensions. Pure data work — no engine logic changes, no LLM prompt changes.

**Method discipline:** Each fixture is a plausible-shape construction designed to hit specific signal combinations. Schema mirrors existing fixtures. Audits verify each fixture builds cleanly and fires the expected patterns/clusters/flavors.

**Scope frame:** ~2-3 hours executor time. Pure fixture authoring — editorial judgment in shape design, mechanical schema construction. CC-standard scale.

**Cost surface:** ~$0.30 cohort cache regen IF the new fixtures are expected to have cached LLM paragraphs immediately. RECOMMENDED to skip cache regen in this CC — let the cohort-thinness gap close at the fixture-data layer first; downstream prose CCs can regen when they fire.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The cohort gaps (from prior CC reports)

#### Driver representation (per CC-PATTERN-CATALOG-SI-SE-FI)

| Driver | Existing fixtures | Pattern fires on |
|---|---|---|
| Ni | 6 | many |
| Ne | 4 | many |
| Te | 4 | many |
| Se | 6 (all E-low) | gsg/03, 08, 10 strivers |
| Si | 1 | ocean/24-si-precedent-keeper |
| Ti | 1 | ocean/25-ti-coherence-prober |
| Fi | 1 | ocean/26-fi-inner-truth-anchor |
| Fe | 1 | ocean/27-fe-room-reader-attuned |

**Gap:** Si/Ti/Fi/Fe each have single-fixture validation. Need 1-2 additional fixtures per driver to lift validation density. Se has variety in count but no high-E examples — also worth one explicit high-E Se fixture.

#### Crisis flavor coverage (per CC-PRIMAL-COHERENCE-EXTENSION)

| Flavor | Synthetic fixtures | Cohort fires |
|---|---|---|
| longing-without-build | ✓ (02-crisis-longing-without-build.json) | ✓ gsg/07-true-gripping |
| grasp-without-substance | ✓ (03-crisis-grasp-without-substance.json) | none |
| paralysis | ✓ (04-crisis-paralysis.json) | none |
| withdrawal | ✓ (06-crisis-withdrawal.json) | none |
| restless-without-anchor | ✓ (07-crisis-restless-without-anchor.json) | none |
| working-without-presence | ✓ (05) | ✓ ocean/02, ocean/25, gsg/03, gsg/08, gsg/10 |

**Gap:** 4 of 6 crisis flavors have only synthetic fixtures. Real-cohort fixtures that exhibit these patterns naturally would lift confidence that the detection rules are catching real shapes, not just engineered edge cases.

### What this CC adds

**9 new fixtures total** — 4 driver-coverage + 4 crisis-flavor-coverage + 1 integration-band:

#### Driver-coverage fixtures

1. **`tests/fixtures/cohort/si-tradition-steward.json`** — second Si driver fixture. Different shape than `ocean/24-si-precedent-keeper`: Si+Te (not Si+Fe), high Conscientiousness, Loyalty/Family Compass, age band Stewardship. Target: precedent-keeper pattern fires AND distinct from existing Si fixture.

2. **`tests/fixtures/cohort/se-high-extraversion-responder.json`** — explicit high-E Se driver. Se+Ti or Se+Fi, OCEAN Extraversion ≥75, moderate Conscientiousness, present-tense responder shape. Target: validates Se-1 pattern's primary E-route (currently only the C-fallback route fires on cohort).

3. **`tests/fixtures/cohort/ti-systems-analyst.json`** — second Ti driver. Ti+Ne or Ti+Se, Truth/Knowledge Compass, moderate-low Conscientiousness, age band Direction or Integration. Target: Ti coherence-prover pattern fires; distinct from ocean/25's profile.

4. **`tests/fixtures/cohort/fi-quiet-resister.json`** — second Fi driver. Fi+Se or Fi+Ne, moderate-low Agreeableness (resists performing agreement), high Conviction signal. Target: Fi inner-compass refusal pattern fires; distinct from ocean/26's profile.

#### Crisis-flavor-coverage fixtures

5. **`tests/fixtures/cohort/grasp-without-substance-relational.json`** — high Am-I-loved? grip + Soul ≤ 20 + Goal moderate. Real-cohort shape: caregiver who has given love without receiving relational substance back. Trigger: Q-Stakes1 heavy on close_relationships + Am-I-loved? primal + low Soul score.

6. **`tests/fixtures/cohort/paralysis-shame-without-project.json`** — high Am-I-good-enough? grip + both Goal AND Soul ≤ 25. Real shape: someone who has lost or hasn't yet found the work that the shame would discipline. Distinct from `working-without-presence` which has high Goal.

7. **`tests/fixtures/cohort/withdrawal-movement-collapse.json`** — high Am-I-safe? grip + both Goal AND Soul ≤ 20. Real shape: someone whose system has retreated from engagement entirely. Trigger: high pressure-adaptation signals + minimal Goal/Soul scoring + Am-I-safe? primal.

8. **`tests/fixtures/cohort/restless-reinvention-no-anchor.json`** — high Do-I-have-purpose? grip + Goal ≤ 30 + Soul ≤ 30. Real shape: someone who has cycled through visions without committing to one. Trigger: multiple Q-V1 vulnerabilities + low Goal completion signals + Do-I-have-purpose? primal.

#### Integration-band fixture (closes Phase 3a's Aim-distribution gap)

9. **`tests/fixtures/cohort/fully-integrated-giver.json`** — the canonical 50° Life shape (brochure Example 10). Goal high (≥70), Soul high (≥70), angle in 42-58° integration band, low Grip, high Aim. Tests whether the new Aim formula correctly produces Aim ≥ 60 (Open-Handed Aim) for a canonical integrated shape — the question Phase 3a couldn't answer because zero cohort fixtures sit in the integration band.

   **Target signal combinations:**
   - Q-E1-outward AND Q-E1-inward both substantive (building energy AND caring energy)
   - Q-A2: balanced — both proactive_creator-like AND relational_investment
   - Q-S2 top-2 includes BOTH a Goal-aligned value AND a Soul-aligned value (e.g., truth + compassion, or knowledge + family)
   - Q-V1: vulnerability_open_uncertainty + sacred_belief_connection in top-2 (positive register)
   - Q-Stakes1: moderate stakes, no defensive collapse
   - OCEAN: high Conscientiousness, high Agreeableness, moderate-to-high Extraversion
   - Age band: Purpose Consolidation (50) or Stewardship (60)
   - Compass: top-2 reflects integration (e.g., truth + compassion, knowledge + family, faith + service)

   **Expected post-engine outputs:**
   - Goal score: ≥ 70
   - Soul score: ≥ 70
   - Angle: ∈ [44°, 56°] (in integration band)
   - GoalSoulCoherence.score: ≥ 95
   - ConvictionClarity: ≥ 65
   - ResponsibilityIntegration: ≥ 45
   - Aim: ≥ 62 (Open-Handed Aim — validates the formula)
   - Grip: ≤ 25 (low)
   - Risk Form letter: **Open-Handed Aim** ← validates Phase 3a's labels are reachable
   - Quadrant: **Giving / Presence** (in-band)
   - Coherence path class: trajectory (NOT crisis)

   **This fixture is the empirical answer to Phase 3a's threshold question.** If it lands Aim ≥ 62, the 60 threshold is correctly calibrated and the canon-faithful Option 3 holds. If it lands Aim < 60 despite optimal shape inputs, then the formula or threshold needs recalibration (a future CC).

### What this CC does NOT add

- **Crisis-flavor fixtures for trajectory-band coverage** (e.g., a 50°-band fixture). Phase 3b will need these if visualization audit specifies; out of scope here.
- **Fixtures specifically for Open Tension testing** (e.g., the "3 C's question" allocation tension). Separate CC if needed.
- **OCEAN-band-specific edge cases** (e.g., low-C high-E shapes). Existing cohort covers OCEAN variation; this CC focuses on driver + crisis dimensions.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| 8 new fixtures in `tests/fixtures/cohort/` (or appropriate subdir) | NEW | Each fixture: ~30-45 lines JSON, schema matches existing |
| `tests/audit/cohortExpansion.audit.ts` | NEW | Audit assertions: each new fixture builds cleanly, fires the expected pattern/cluster/flavor |

### Fixture schema (per existing convention)

```json
{
  "id": "cohort/si-tradition-steward",
  "label": "Si Tradition Steward",
  "description": "Second Si driver fixture — Si+Te, Loyalty/Family Compass, Stewardship age band.",
  "demographics": { "age": 58, "...": "..." },
  "answers": {
    "Q-E1-outward": [...],
    "Q-A1": "...",
    "Q-T": [...],
    "Q-S1": [...],
    "Q-S2": [...],
    "Q-GRIP1": [...],
    "Q-Stakes1": [...],
    "Q-V1": [...],
    "...": "..."
  }
}
```

Verify schema against `ocean/24-si-precedent-keeper.json` for the canonical reference structure.

### Per-fixture target outputs (asserted by audit)

| Fixture | Target driver | Target Primal cluster | Target crisis flavor | Other |
|---|---|---|---|---|
| si-tradition-steward | Si | Am I secure? (or low confidence) | trajectory | precedent-keeper pattern fires |
| se-high-extraversion-responder | Se | varies | trajectory | Se-1 primary E-route fires |
| ti-systems-analyst | Ti | Am I good enough? | trajectory | Ti-1 pattern fires |
| fi-quiet-resister | Fi | Am I good enough? OR Do I have purpose? | trajectory | Fi-1 pattern fires |
| grasp-without-substance-relational | n/a (Soul-leaning shape) | Am I loved? | grasp-without-substance | crisis-path |
| paralysis-shame-without-project | n/a | Am I good enough? | paralysis | crisis-path; Goal AND Soul ≤ 25 |
| withdrawal-movement-collapse | n/a | Am I safe? | withdrawal | crisis-path; movement < 20 |
| restless-reinvention-no-anchor | n/a | Do I have purpose? | restless-without-anchor | crisis-path |
| fully-integrated-giver | n/a (50° integration band) | none dominant (low Grip) | trajectory | **validates Aim ≥ 62 threshold reachability** |

---

## Audit assertions (10 NEW)

In `tests/audit/cohortExpansion.audit.ts`:

1. **`cohort-expansion-fixtures-build-clean`** — every new fixture passes through `buildInnerConstitution` without throwing.
2. **`cohort-expansion-si-tradition-steward-driver`** — si-tradition-steward fixture has `lensStack.dominant === "si"`.
3. **`cohort-expansion-se-high-e-pattern-fires`** — se-high-extraversion-responder fixture has Se-1 pattern firing via primary E-route (not C-fallback).
4. **`cohort-expansion-ti-systems-analyst-driver`** — ti-systems-analyst fixture has `lensStack.dominant === "ti"`.
5. **`cohort-expansion-fi-quiet-resister-driver`** — fi-quiet-resister fixture has `lensStack.dominant === "fi"`.
6. **`cohort-expansion-grasp-without-substance-flavor`** — grasp-without-substance-relational fixture has `coherenceReading.pathClass === "crisis"` AND `crisisFlavor === "grasp-without-substance"`.
7. **`cohort-expansion-paralysis-flavor`** — paralysis-shame-without-project fixture has `coherenceReading.pathClass === "crisis"` AND `crisisFlavor === "paralysis"`.
8. **`cohort-expansion-withdrawal-flavor`** — withdrawal-movement-collapse fixture has `coherenceReading.pathClass === "crisis"` AND `crisisFlavor === "withdrawal"`.
9. **`cohort-expansion-restless-without-anchor-flavor`** — restless-reinvention-no-anchor fixture has `coherenceReading.pathClass === "crisis"` AND `crisisFlavor === "restless-without-anchor"`.
10. **`cohort-expansion-existing-cohort-undisturbed`** — the existing 28 fixtures (24 cohort + 4 trajectory) continue to build cleanly without change.
11. **`cohort-expansion-fully-integrated-giver-validates-aim`** — fully-integrated-giver fixture lands `aimReading.score ≥ 62` AND `riskFormFromAim.letter === "Open-Handed Aim"` AND `movementQuadrant.label === "Giving / Presence"` AND `goalSoulCoherence.score ≥ 95`. **This is the empirical validation that Phase 3a's threshold + Phase 2's formula correctly produce the canonical Open-Handed Aim classification when given an in-band, well-shaped fixture.** Flag for human review if the fixture lands Aim < 60 despite optimal inputs — that would indicate the formula needs recalibration.

In `tests/audit/patternCatalogSiSeFi.audit.ts` extension:
- 4 new assertions confirming the 4 new driver-coverage fixtures fire the expected Si/Se/Ti/Fi pattern (this validates that pattern catalog isn't single-fixture-fragile).

In `tests/audit/primalCoherence.audit.ts` extension:
- 4 new assertions confirming the 4 new crisis-flavor fixtures classify correctly.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any engine code (`lib/*`).**
2. **Do NOT modify the existing 28 cohort + trajectory fixtures.** Strictly additive.
3. **Do NOT add cached LLM prose** for the new fixtures. Future prose CCs handle regen.
4. **Do NOT modify the question bank (`data/questions.ts`).** New fixtures use existing questions.
5. **Do NOT modify any existing audit's assertions.** New audits in new file; extensions are pure ADD.
6. **Do NOT bundle Phase 3a, Phase 3b, or trajectory-visualization work.**
7. **Do NOT add fixtures beyond the 8 specified.** Cohort expansion past these is future-CC scope.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean (JSON-only additions; should be unaffected)
- [ ] `npm run lint` clean
- [ ] `npx tsx tests/audit/cohortExpansion.audit.ts` — all 10 assertions pass
- [ ] `npx tsx tests/audit/patternCatalogSiSeFi.audit.ts` (extended) — pass
- [ ] `npx tsx tests/audit/primalCoherence.audit.ts` (extended) — pass
- [ ] All other existing audits remain green

---

## Report-back format

1. **Summary** — files added, line-count delta, audit pass count.
2. **Per-fixture content summary** — for each of the 8 new fixtures, paste a one-line summary: id, target driver / Primal / flavor, demographics (age band), Compass top-2, achieved Goal / Soul / Aim / Grip values.
3. **Pattern catalog firing report** — for each of the 4 driver-coverage fixtures, confirm the canonical Si/Se/Ti/Fi pattern fires.
4. **Crisis flavor firing report** — for each of the 4 crisis-flavor fixtures, confirm `pathClass === "crisis"` AND `crisisFlavor` matches target.
5. **Cohort distribution shift** — paste before/after counts:
   - Si/Se/Ti/Fi driver fixture counts (was 1 each)
   - Crisis flavor cohort fires (was 0 for 4 flavors)
6. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
7. **Out-of-scope verification** — confirm none of the 7 DO-NOT items were touched.
8. **Recommendations** — including any fixture shape that proved difficult to construct (suggests question-bank revision in a future CC), or any pattern/flavor that still doesn't fire on the new fixture (suggests predicate refinement).

---

**Architectural test:** cohort thinness on Si/Ti/Fi/Fe drivers reduces from 1-fixture validation to 2-fixture validation. Cohort thinness on 4 crisis flavors closes — each flavor now has at least one real-cohort fixture (not just synthetic). Phase 3 audits can reference broader cohort distribution; future prose CCs can validate rubrics against the expanded variety.
