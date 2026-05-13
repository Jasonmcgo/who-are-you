# CC-PATTERN-CATALOG-SI-SE-FI — Extend Pattern Catalog with Si/Se/Ti/Fi/Fe Patterns

**Origin:** Per `feedback_pattern_catalog_function_bias` (memory canon): the pattern catalog has Ne/Ni/Te bias — only 3 of 8 cognitive functions are consumed by patterns. Five candidate patterns leveraging si/se/ti/fi/fe were drafted and queued but never implemented. This CC ships them.

This is a pure engine-layer CC. No prose changes. No LLM cache regeneration (patterns affect named-grip emission and pattern-firing signals, but the cohort cache is keyed on synthesized inputs that already carry pattern outcomes). The CC closes the function-coverage asymmetry the memory entry has been documenting since CC-024 era.

**Method discipline:** Engine for truth. The patterns are deterministic detection rules over existing signals (no new measurements, no new questions). Each pattern has a unique ID, a non-empty rationale, and an inspectable predicate. Audit asserts on pattern-firing distribution across the cohort.

**Scope frame:** ~2-3 hours executor time. CC-mega scale because of the editorial judgment in pattern shape design. The five candidate patterns need to be rediscovered (the original drafts are in memory referencing — not in the repo currently). The executor should:

1. Read the existing pattern catalog implementation to understand the architecture
2. Identify the 5 candidate patterns from prior memory / docs / pattern_catalog_function_bias references
3. Implement them following existing pattern conventions
4. Validate against the cohort

**Cost surface:** Probably zero LLM calls (patterns are deterministic detection). If pattern emission feeds named-grip generation, there may be downstream cache invalidation; expect ~$0.20 if so.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The function-coverage asymmetry

The current pattern catalog (location to be rediscovered by the executor — it's not at `lib/patternCatalog.ts` per the audit) consumes only 3 of 8 cognitive functions (Ne, Ni, Te) for pattern detection. Patterns that should fire on Si, Se, Ti, Fi, Fe driver shapes are absent. Result: shapes with those drivers get less specific pattern firing than Ni/Ne/Te shapes.

This contributes to the broader Si/Se voice weakness (per CC-VOICE-RUBRIC-EXPANSION). The combination of:
- Thin pattern firing for Si/Se shapes (this CC's territory)
- LLM rubric over-representation of Ni/Ne register (CC-VOICE-RUBRIC-EXPANSION's territory)
- Cohort under-representation of Si/Se driver fixtures (CC-COHORT-EXPANSION-SI-SE's territory)

… produces compounding voice weakness. Each CC closes one layer.

### The 5 candidate patterns (executor must locate exact wording from prior drafts)

These were drafted in prior CC sessions and queued. The executor should search:

1. The repo for any existing pattern documentation in `docs/` or in code comments
2. Any existing `feedback_pattern_*` or `project_pattern_*` memory references in the codebase comments
3. The git log for any "pattern catalog" related commits

If the original drafts cannot be located, the executor should design patterns following the function-coverage asymmetry — at minimum:

- **Pattern Si-1: Precedent-keeper under pressure** — Si driver + high-Conscientiousness + high Compass for Stability/Loyalty/Family. Captures the shape that defends what holds when pressure rises. Distinct from "control" (which is Ni-flavored) and from "money/security" (which is Drive-bucket-flavored).

- **Pattern Se-1: Present-tense responder** — Se driver + high-Extraversion + moderate-Conscientiousness. Captures the shape that responds to what's actually in the room rather than working a long-range plan. Likely informs the Movement section's prose register.

- **Pattern Ti-1: Coherence prover** — Ti driver + Compass holding Truth/Knowledge as protect-class. Captures the shape that needs the read to be internally consistent before committing — distinct from "being right" (which can be Te-flavored externalist).

- **Pattern Fi-1: Inner-compass refusal** — Fi driver + high-Disagreeableness OR low-Agreeableness OR high Conviction-cost-bearing. Captures the shape that refuses to perform agreement when the inner compass disagrees. Distinct from "approval-seeking" (Fe-flavored) and from "being right" (Te-flavored).

- **Pattern Fe-1: Room-attunement under conflict** — Fe driver + high-Extraversion + Compass holding relational values. Captures the shape that reads the room's tension before naming the user's own. Distinct from existing "approval of specific people" (per `lib/gripCalibration.ts`) which is Primal-mapping; this is pre-Primal pattern detection.

The exact pattern IDs, predicates, and metadata format MUST follow the existing pattern catalog conventions in the codebase. The executor reads the existing patterns first, then mirrors that structure.

### Why these patterns matter

Each pattern, when fired, gives the engine an additional signal for downstream consumers (Path/Gait card, Compass interpretation, Movement section, named-grip emission). The current report for an Si-driver user has the same pattern density as a thin signal — the engine is generating pattern-poor reads for Si shapes. Adding the patterns gives the engine more to compose against.

### Composition with prior CCs

- **CC-PATTERN-CATALOG-SI-SE-FI** (this CC): adds the 5 patterns at the engine layer.
- **CC-VOICE-RUBRIC-EXPANSION** (parallel/companion): adds the LLM rubric examples for Si/Se/Ti/Fi register so prose composes with the new pattern signals.
- **CC-COHORT-EXPANSION-SI-SE** (later): adds fixtures to validate both the new patterns and the new rubrics fire correctly.

---

## Architecture

### Discovery phase (executor first task)

Before implementing, the executor must:

1. Locate the existing pattern catalog file(s). Search candidates: `lib/patterns*.ts`, `lib/patternCatalog*.ts`, anywhere `pattern.*emission` or `PatternId` types are defined. Probably lives in a file with related identityEngine consumers.
2. Read the existing pattern definitions to extract the canonical pattern shape (type signature, metadata fields, predicate format, ID convention).
3. Read the question-to-pattern mapping if separate from pattern definitions.
4. Read at least 2 existing patterns end-to-end (definition + audit + cohort firing) to understand the full lifecycle.

If the pattern catalog doesn't exist as a discrete module, the patterns may live inside `lib/identityEngine.ts` or be embedded in the named-grip emission logic. The executor should report the actual location in the report-back.

### File map (provisional — finalize after discovery)

| File | Action | Purpose |
|---|---|---|
| `lib/patterns/*.ts` (or wherever patterns live) | MODIFY | Add the 5 new patterns following existing conventions. |
| `lib/identityEngine.ts` | MODIFY (surgical) | Wire pattern emission into the constitution-building chain if not already automatic. |
| `tests/audit/patternCatalogSiSeFi.audit.ts` | NEW | Audit assertions: pattern uniqueness, rationale-non-empty, cohort firing distribution. |
| `tests/audit/<existing pattern audit>.audit.ts` | EXTEND if exists | Verify the new patterns don't break existing pattern coverage. |

### Pattern shape (must conform to existing conventions)

Each pattern entry should carry, at minimum:
- Unique pattern ID (e.g., `P-SI-1`, `P-SE-1`, etc., or follow existing convention)
- Human-readable label
- Predicate function or declarative rule
- Rationale string
- Downstream consumer indication (which body cards or sections consume the pattern's firing)

---

## Audit assertions (10 NEW)

In `tests/audit/patternCatalogSiSeFi.audit.ts`:

1. **`pattern-si-se-fi-pattern-uniqueness`** — every new pattern ID is unique against existing pattern IDs.
2. **`pattern-si-se-fi-rationale-non-empty`** — every new pattern has a non-empty rationale string.
3. **`pattern-si-se-fi-predicate-deterministic`** — running the predicate twice on identical inputs produces identical output (no randomness).
4. **`pattern-si-se-fi-si-coverage`** — Pattern Si-1 fires on at least one cohort fixture (e.g., ocean/24-si-precedent-keeper).
5. **`pattern-si-se-fi-se-coverage`** — Pattern Se-1 fires on at least one cohort fixture (e.g., gsg/03-striving or similar Se-leaning shape).
6. **`pattern-si-se-fi-ti-coverage`** — Pattern Ti-1 fires on ocean/25-ti-coherence-prober.
7. **`pattern-si-se-fi-fi-coverage`** — Pattern Fi-1 fires on at least one cohort fixture; flag for review if cohort thinness prevents firing on any fixture.
8. **`pattern-si-se-fi-fe-coverage`** — Pattern Fe-1 fires on ocean/27-fe-room-reader-attuned.
9. **`pattern-si-se-fi-cohort-distribution`** — observational report: how many cohort fixtures fire each new pattern. Not asserted; informational.
10. **`pattern-si-se-fi-no-prose-changes`** — confirm `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx` show zero diff. This is an engine-layer CC.

In existing pattern audit (if present), extend with assertions verifying the new patterns don't break existing pattern emission counts.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any prose render code.** Engine-layer only.
2. **Do NOT modify CC-GRIP-CALIBRATION's `NAMED_GRIP_TO_PRIMAL` mapping.** Patterns can FEED named-grip emission upstream, but the mapping itself stays.
3. **Do NOT modify CC-PRIMAL-COHERENCE's coherence gating.** Patterns are pre-coherence diagnostic.
4. **Do NOT modify any LLM system prompts or rubric examples.** Prose register is CC-VOICE-RUBRIC-EXPANSION's territory.
5. **Do NOT add new survey questions.** Patterns derive from existing signals.
6. **Do NOT add fixture data.** That's CC-COHORT-EXPANSION-SI-SE.
7. **Do NOT modify the lens_stack computation in `lib/jungianStack.ts`.** Patterns CONSUME lens_stack.dominant; they don't recompute it.
8. **Do NOT modify any existing pattern definitions.** Only ADD new ones.
9. **Do NOT bundle CC-VOICE-RUBRIC-EXPANSION work.** The two CCs compose; they don't merge.
10. **Do NOT add new pattern types beyond the 5 in scope.** Pattern catalog expansion past these 5 is future-CC scope (post-cohort-validation).

---

## Verification checklist

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/patternCatalogSiSeFi.audit.ts` (new — all 10 assertions pass)
- [ ] All existing audits remain green
- [ ] Cohort regeneration only if pattern emission feeds cache hash (likely not needed)

---

## Report-back format

1. **Summary** — files added/modified (including discovery report on pattern catalog location), line-count delta, audit pass count.
2. **Pattern catalog location report** — where the pattern catalog actually lives in the codebase. Document for future CC reference.
3. **Five new pattern definitions paste** — full code for each new pattern (ID, predicate, metadata, rationale).
4. **Cohort firing distribution table** — for the 24-fixture cohort, report which fixtures fire each new pattern. Highlight any patterns that don't fire on any cohort fixture (flag for CC-COHORT-EXPANSION-SI-SE follow-up).
5. **Composition check** — confirm the new patterns don't accidentally fire on Ni/Ne/Te-driver shapes where they shouldn't.
6. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
7. **Out-of-scope verification** — confirm none of the 10 DO-NOT items were touched.
8. **Recommendations for follow-on work** — including:
   - Any pattern that didn't fire on cohort due to fixture thinness (suggesting CC-COHORT-EXPANSION-SI-SE prioritization)
   - Any predicate that produced unexpected firing on adjacent shapes (suggesting predicate tightening)
   - Whether the pattern catalog location should be refactored into a discrete module if it's currently embedded

---

**Architectural test for this CC:** ocean/24-si-precedent-keeper has Pattern Si-1 firing in its constitution; ocean/25-ti-coherence-prober has Pattern Ti-1 firing; ocean/27-fe-room-reader-attuned has Pattern Fe-1 firing. The function-coverage asymmetry from `feedback_pattern_catalog_function_bias` is closed for the 5 named patterns. Any remaining asymmetry (e.g., a 6th pattern proposal that surfaces in cohort review) is documented as a follow-on, not as a failure of this CC's scope.
