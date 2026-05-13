# CC-GRIP-TAXONOMY-REPLACEMENT — 4-Layer Grip Pattern Architecture + Foster Vocabulary Removal

> **▶ DEPENDENCY — CC-GRIP-SIGNAL-WEIGHTING must be landed and on `prompts/completed/`. Verify sweep is 33/33 green before starting.**

**Origin:** The 50° Journey canon (2026-05-11) replaces the Foster "7 Primal Questions" framework in all user-facing surfaces with a proprietary Grip taxonomy. This is not a label rename — it's a four-layer architectural replacement plus a full removal pass for Foster vocabulary across every report surface.

Per `feedback_clarence_report_architecture_rulings.md` (binding) and `feedback_grip_pattern_shape_aware_routing.md`:

1. **The classifier must be shape-aware.** Jason's Q-GRIP1 top-3 is Control/Security/Certainty (classical-defensive surface cluster), but his lived register is Worth Grip — control of outcomes in service of "am I good enough?", not control to feel safe. Same surface signal, different register, different Grip Pattern. The classifier reads surface cluster + lived Primal + Compass anchor + driver coding.

2. **The taxonomy is two-tier.** Canonical buckets (7) + shape-specific elaborative labels. Canonical: Safety / Security / Belonging / Worth / Recognition / Control / Purpose. Elaborative: "Control / Mastery" (Jason), "Belonging through usefulness" (Cindy), "Security through structure" (Daniel).

3. **The underlying question is engine-generated prose, not a fixed Foster label.** It's the recognition moment, per-user, distinct from the bucket name.

4. **Foster vocabulary must disappear** from generated copy, UI labels, chart annotations, and appendix prose. Internal compatibility aliases may survive in signal IDs only if needed for cache stability — never in user-visible surfaces.

**Method discipline:** classifier function + render-layer routing + LLM prompt updates + Option A cohort regen. No engine math invented. The Grip *score* (composed Grip from §13) stays exactly as CC-GRIP-SIGNAL-WEIGHTING shipped it; only the *label and prose* layered on top of the score change.

**Scope frame:** CC-mega, ~2 hours executor time. Multiple files touched. First CC since CC-SHAPE-AWARE-PROSE-ROUTING that genuinely needs Option A regen.

**Cost surface:** ~$0.50–$2.00 cohort cache regen across 24 fixtures. Option A is required because cached prose paragraphs reference Foster vocabulary directly.

---

## Embedded context

### The 4-layer architecture (canon)

```
Layer 1 — Classifier (shape-aware)
  Inputs: Q-GRIP1 top-3 + lived Primal output + Compass top-4 + driver pair
  Output: canonical Grip Pattern bucket (one of 7)

Layer 2 — Canonical bucket
  Safety / Security / Belonging / Worth / Recognition / Control / Purpose

Layer 3 — Renderer (shape-specific elaborative label)
  Examples:
    Worth + classical-defensive surface + NJ driver → "Control / Mastery"
    Belonging + relational surface + caregiver driver → "Belonging through usefulness"
    Security + Faith-anchored Compass + steward driver → "Security through structure"

Layer 4 — Underlying question prose (engine-generated)
  Examples:
    Jason: "Can I make the insight real enough to trust?"
    Cindy: "Will I still belong if I cannot meet what they need?"
    Daniel: "Will the system I built hold what I'm responsible for?"
```

### Shape-aware classifier disambiguation table (canon)

For "Control" surface signal:

| Surface | Compass anchor | Driver coding | → Grip Pattern |
|---|---|---|---|
| Control top-3 + Knowledge/Honor/Peace | NJ / architect | **Worth Grip** (rendered as "Control / Mastery") |
| Control top-3 + Faith/Stability/Order | SJ / steward | **Security Grip** (rendered as "Security through structure") |
| Control top-3 + Safety/Health-anchored | any | **Safety Grip** (rendered as "Control as protection") |
| Control top-3 + Family/Mercy | caregiver | **Belonging Grip** (rendered as "Control as protective overreach") |

For "Being needed" surface signal:

| Surface | Compass anchor | Driver coding | → Grip Pattern |
|---|---|---|---|
| Needed top-3 + Family/Loyalty | caregiver | **Belonging Grip** (rendered as "Belonging through usefulness") |
| Needed top-3 + Knowledge/Honor | architect | **Worth Grip** (rendered as "Worth through service") |
| Needed top-3 + Recognition-anchored | any | **Recognition Grip** (rendered as "Visibility through indispensability") |

Executor builds similar tables for "Reputation," "Certainty," "Money/Security," "Comfort/Escape," "Approval," and the Q-3C2 top-1 signals. Where the cluster is mixed and routing is ambiguous, the classifier returns the highest-confidence bucket with confidence: "medium" or "low" — the renderer then produces a more generic elaborative label.

### The Foster vocabulary that must disappear

User-facing strings to remove from every rendered surface:

- "Primal Question"
- "Primary Primal Question"
- "Secondary Primal Question"
- "Tertiary Primal Question"
- "Am I safe?"
- "Am I secure?"
- "Am I wanted?"
- "Am I loved?"
- "Am I successful?"
- "Am I good enough?"
- "Do I have purpose?"
- Any phrase referring to "the 7 Primal Questions" by name

These may survive in internal code: signal IDs, hash inputs, comment annotations, console.log diagnostics. They must NOT survive in: rendered markdown, LLM system prompts, LLM-generated prose (cached or fresh), chart annotations, UI labels, audit-output user-facing strings.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/gripPattern.ts` | NEW | Classifier (Layer 1) + canonical bucket type (Layer 2) + renderer (Layer 3) + underlying-question generator (Layer 4). |
| `lib/types.ts` | MODIFY | Add `GripPatternKey`, `GripPatternReading` types. Add `gripPattern` field to `InnerConstitution`. |
| `lib/identityEngine.ts` | MODIFY | Wire `attachGripPattern(constitution)` after archetype + grip + Primal output are all attached. |
| `lib/gripCalibration.ts` | MODIFY | Replace `PRIMAL_ROUTED_SURFACE` Foster-keyed map with Grip Pattern routing OR delete entirely (per executor judgment — the routing logic moves to `lib/gripPattern.ts`). |
| `lib/gripTaxonomy.ts` | MODIFY | Update output contracts: replace `primalQuestion` / `primaryPrimal` / `secondaryPrimal` fields with `gripPattern` / `underlyingQuestion`. Internal Primal computation may remain (as a hidden classifier input) but the output object stops exposing Foster vocabulary. |
| `lib/gripTaxonomyLlm.ts` | MODIFY | LLM system prompt: replace "Primal Questions" framing with Grip Patterns. Remove all "Am I X?" framings from prompt text. |
| `lib/gripTaxonomyLlmServer.ts` | MODIFY | If it composes prompt fragments or renders Foster vocabulary, update. |
| `lib/gripTaxonomyLlmClient.ts` | MODIFY | Same — any client-side prompt fragments. |
| `lib/renderMirror.ts` | MODIFY | Grip section: replace "Primary Primal Question: Am I X?" lines with "Grip Pattern: [elaborative label]" + "Underlying Question: [generated prose]". |
| `lib/trajectoryChart.ts` | MODIFY | Replace `Pulling: Am I X? — high confidence` annotation with `Pulling: [elaborative Grip Pattern label] — [confidence]`. |
| `app/components/InnerConstitutionPage.tsx` | MODIFY | React render — mirror the markdown render's new structure. |
| `lib/synthesis3Inputs.ts` | MODIFY | Hash input version bump — the new Grip Pattern enters LLM input contract. |
| `lib/gripTaxonomyInputs.ts` | MODIFY | Same hash bump. |
| `tests/audit/gripTaxonomyReplacement.audit.ts` | NEW | 16 audit assertions. |

### Segment A — `lib/gripPattern.ts` (NEW)

```ts
// CC-GRIP-TAXONOMY-REPLACEMENT — 4-layer Grip Pattern architecture.
// Replaces Foster's 7 Primal Questions in user-facing language.
// Per canon: classifier is shape-aware (surface + Primal + Compass + driver),
// the bucket is one of 7 canonical patterns, the renderer produces a
// shape-specific elaborative label, and the underlying question is
// engine-generated prose.

export type GripPatternKey =
  | "safety"        // Safety Grip
  | "security"      // Security Grip
  | "belonging"     // Belonging Grip
  | "worth"         // Worth Grip
  | "recognition"   // Recognition Grip
  | "control"       // Control Grip
  | "purpose"       // Purpose Grip
  | "unmapped";     // Explicit fallback when classifier can't resolve

export const GRIP_PATTERN_BUCKETS: Record<GripPatternKey, {
  publicLabel: string;     // The 7 canonical names ("Safety Grip", "Worth Grip", etc.)
  axisDistorted: string;   // "Goal" | "Soul" | "Aim" | "Soul/Goal" — for engine routing
  defaultHealthyGift: string;
}> = {
  safety:      { publicLabel: "Safety Grip",      axisDistorted: "Aim",  defaultHealthyGift: "wisdom, protection" },
  security:    { publicLabel: "Security Grip",    axisDistorted: "Goal/Aim", defaultHealthyGift: "stewardship" },
  belonging:   { publicLabel: "Belonging Grip",   axisDistorted: "Soul", defaultHealthyGift: "inclusion" },
  worth:       { publicLabel: "Worth Grip",       axisDistorted: "Soul/Grip", defaultHealthyGift: "humility, craft" },
  recognition: { publicLabel: "Recognition Grip", axisDistorted: "Goal", defaultHealthyGift: "excellence" },
  control:     { publicLabel: "Control Grip",     axisDistorted: "Aim",  defaultHealthyGift: "governance" },
  purpose:     { publicLabel: "Purpose Grip",     axisDistorted: "Goal/Soul", defaultHealthyGift: "mission" },
  unmapped:    { publicLabel: "Mixed Grip",       axisDistorted: "—",    defaultHealthyGift: "—" },
};

export interface GripPatternReading {
  bucket: GripPatternKey;           // Layer 2 — canonical bucket
  renderedLabel: string;            // Layer 3 — shape-specific elaborative label
  underlyingQuestion: string;       // Layer 4 — engine-generated recognition prose
  confidence: "high" | "medium" | "low";
  rationale: string;                // For diagnostic / audit purposes
}

export function classifyGripPattern(inputs: {
  qGrip1Top3: SignalId[];           // surface cluster
  livedPrimalRegister: string | null; // engine-derived (from existing Primal computation, internal only)
  compassTop4: string[];            // Compass top-4 priorities
  driverPair: FunctionPairKey | null;
  archetype: ProfileArchetype;      // jasonType / cindyType / danielType / unmappedType
}): GripPatternReading {
  // Shape-aware routing per canon. See disambiguation tables in CC prompt.
  // ...
}
```

**Executor implements the routing tables.** The classifier reads the four inputs, applies the disambiguation rules from the canon, and returns a `GripPatternReading`. The renderer (Layer 3) is a method on `GripPatternReading` or a separate helper that takes the bucket + driver coding and produces the elaborative label string. The underlying-question generator (Layer 4) is a templated function that takes the bucket + lived register + surface cluster and produces the recognition prose.

### Segment B — Foster vocabulary removal

After Segment A is implemented and wired, execute a grep-and-replace sweep across:

- `lib/renderMirror.ts` — remove all "Primary Primal Question:" / "Am I X?" lines from the Grip section
- `lib/trajectoryChart.ts` — `primal-annotation` text element
- `lib/gripTaxonomyLlm.ts` — system prompt fragments
- `lib/gripTaxonomy.ts` — output type fields renamed from `primalQuestion` → `gripPattern`
- `app/components/InnerConstitutionPage.tsx` — React render labels

The cohort grep audit (audit #14 below) is the gate: zero Foster-vocabulary hits in any rendered fixture.

### Segment C — Underlying-question generator (Layer 4)

The generator produces shape-specific recognition prose. It's NOT a fixed lookup; it's templated against:

- The canonical bucket (constrains the question family)
- The lived register (specific Compass + Primal + cluster context)
- The driver coding (architect / steward / caregiver register)

Examples per bucket + shape:

| Bucket | Shape | Generated underlying question |
|---|---|---|
| Worth | Jason-type (NJ + Knowledge + Control surface) | *"Can I make the insight real enough to trust?"* |
| Worth | caregiver + service-anchored | *"Am I doing enough for them to feel cared for?"* |
| Belonging | Cindy-type (caregiver + Family + Needed surface) | *"Will I still belong if I cannot meet what they need?"* |
| Belonging | architect + outsider-coded | *"Will I be welcome if I bring this whole thing into the room?"* |
| Security | Daniel-type (steward + Faith + Control/Plan surface) | *"Will the system I built hold what I'm responsible for?"* |
| Security | caregiver + dependents-anchored | *"Will the people who depend on me be safe if I let go?"* |
| Control | architect + Mastery-anchored | *"Can I shape this outcome cleanly enough to trust it?"* |

Executor builds the generator with sensible fallbacks; ~3-4 question templates per bucket cover most shapes. Per-user specificity comes from interpolating user signals into the templates.

### Segment D — LLM cache regen (Option A)

Bump the hash input version in `lib/synthesis3Inputs.ts` and `lib/gripTaxonomyInputs.ts`. The cohort cache invalidates. Regenerate all 24 fixture paragraphs against the new Grip Pattern vocabulary. Budget ~$0.50–$2.00.

This is the first non-zero regen since the engine-math arc started. Document the cost in the report-back.

---

## Audit assertions (16 NEW)

In `tests/audit/gripTaxonomyReplacement.audit.ts`:

1. **`grip-pattern-module-exists`** — `lib/gripPattern.ts` exists and exports `classifyGripPattern`, `GripPatternKey`, `GripPatternReading`, `GRIP_PATTERN_BUCKETS`.
2. **`grip-pattern-bucket-list-canonical`** — `GRIP_PATTERN_BUCKETS` contains exactly 7 named patterns + 1 unmapped fallback. Names match canon: Safety, Security, Belonging, Worth, Recognition, Control, Purpose.
3. **`grip-pattern-attached-to-constitution`** — every cohort fixture has `constitution.gripPattern` with non-null `bucket`, `renderedLabel`, and `underlyingQuestion`.
4. **`jason-routes-to-worth-grip`** — Jason fixture (`ocean/07-jason-real-session.json`) classifies to bucket: "worth" at confidence high or medium. NOT "control" (the naive Q-GRIP1-only mapping would route him there). This is the gold-standard regression for shape-aware routing.
5. **`cindy-synthetic-routes-to-belonging-grip`** — Cindy synthetic shape (cindyType archetype + relational top-3 + Family/Mercy/Loyalty) classifies to bucket: "belonging" at confidence high or medium.
6. **`daniel-synthetic-routes-to-security-grip`** — Daniel synthetic shape (danielType + classical-defensive top-3 + Faith/Honor/Stability) classifies to bucket: "security" at confidence high or medium.
7. **`rendered-labels-shape-specific`** — Jason renders "Control / Mastery" (or equivalent Worth-coded elaborative); Cindy renders "Belonging through usefulness" (or equivalent); Daniel renders "Security through structure" (or equivalent). Audit confirms three distinct rendered labels for three distinct shapes.
8. **`underlying-questions-shape-specific`** — Jason underlyingQuestion contains "insight" or "trust" or "real enough"; Cindy contains "belong" or "meet what they need"; Daniel contains "system" or "hold" or "responsible." Three distinct prose lines for three distinct shapes.
9. **`cohort-bucket-distribution-non-degenerate`** — across 24 cohort fixtures, at least 3 distinct buckets are represented (not all routing to one default). Audit prints distribution.
10. **`foster-vocabulary-absent-from-renders`** — grep across all 24 cohort rendered markdown outputs for: `"Primal Question"`, `"Am I safe"`, `"Am I secure"`, `"Am I wanted"`, `"Am I loved"`, `"Am I successful"`, `"Am I good enough"`, `"Do I have purpose"`. Zero hits across all fixtures = PASS. Any hit in any fixture = FAIL with explicit fixture + phrase reported.
11. **`foster-vocabulary-absent-from-llm-prompts`** — grep `lib/gripTaxonomyLlm.ts` (and any other prompt files) for the same Foster strings in the prompt text itself. Zero hits = PASS.
12. **`foster-vocabulary-absent-from-chart`** — `lib/trajectoryChart.ts` rendered output does NOT contain `"Am I"` followed by `"?"` in the primal-annotation text. The annotation now displays the elaborative Grip Pattern label.
13. **`grip-pattern-feeds-llm-cache-hash`** — `lib/synthesis3Inputs.ts` and `lib/gripTaxonomyInputs.ts` both consume `gripPattern.bucket` or `gripPattern.renderedLabel` in their hash inputs. Cache hash version is bumped.
14. **`cohort-cache-regenerated`** — cohort cache miss expected for all 24 fixtures pre-regen; post-regen all 24 hit. Audit confirms regen completed (Option A). Cost reported.
15. **`legacy-primal-output-still-internal`** — internal code may retain Primal computation for cache stability (signal IDs, hash inputs) but `constitution.gripTaxonomy.primaryPrimal` (or equivalent) is no longer exposed in the constitution output object that the renderer reads. Audit confirms render path consumes `gripPattern.*` fields, not `primalQuestion.*` fields.
16. **`grip-score-unchanged`** — `constitution.gripReading.score` and components are byte-identical to pre-CC values for every fixture. This CC changes the label layer, NOT the score. Within ±0.1 tolerance.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify `constitution.gripReading.score` or its components** (defensiveGrip, stakesLoad, amplifier). Grip composition stays canonical per CC-GRIP-SIGNAL-WEIGHTING. This CC operates on the label layer above the score.
2. **Do NOT modify the §13 multiplicative composition formula** (`computeStakesAmplifier`, `computeGrip`).
3. **Do NOT modify `DEFENSIVE_GRIP_AMPLIFIER_FLOOR` (25) or `MAX_STAKES_AMPLIFICATION` (0.5)**.
4. **Do NOT modify `Q_GRIP1_DEFENSIVE_WEIGHTS`, `RELATIONAL_GRIP_STAKES_BUMP`, or `Q3C2_GRIP_CHANNEL`** — all just shipped in CC-GRIP-SIGNAL-WEIGHTING.
5. **Do NOT modify `computeAimScore` or `AIM_WEIGHTS`**.
6. **Do NOT modify Movement Limiter formulas**.
7. **Do NOT modify the 12-label `MovementQuadrantLabel` union or Grip-aware twin gating**.
8. **Do NOT modify Risk Form letter labels or thresholds**.
9. **Do NOT modify the trajectory chart layout, viewBox, legend, or readout structure** — only the primal-annotation text content changes.
10. **Do NOT add the Hands body card** — that's CC-HANDS-CARD's scope (next CC in sequence).
11. **Do NOT restructure the report page architecture** (Executive Read placement, Core Signal Map page, masthead tagline, How to Read This copy) — that's CC-PROGRESSIVE-DISCLOSURE-FRONT-PAGE's scope.
12. **Do NOT modify engine-internal signal IDs** (`grips_control`, `grips_neededness`, etc.) — they stay as internal labels. The user-facing layer maps them to Grip Patterns.
13. **Do NOT add new question-bank items**.
14. **Do NOT modify the three-profile archetype routing** (jasonType / cindyType / danielType / unmappedType) — it's a classifier *input* here, not a target of modification.
15. **Do NOT modify the lean classifiers** (`workMap.ts`, `loveMap.ts`) or pie chart.
16. **Do NOT modify Compass values or Peace/Faith disambiguation**.
17. **Do NOT keep Foster vocabulary as compatibility aliases in user-facing surfaces.** Internal code (signal IDs, comments, console.log, hash inputs) may retain Foster references. Anything that reaches the rendered markdown, chart text, UI labels, or LLM-generated prose must be Grip-Pattern-only. This is the canon-faithful gate per Clarence rulings 2026-05-11.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean (0 warnings)
- [ ] `npx tsx tests/audit/gripTaxonomyReplacement.audit.ts` — all 16 assertions pass
- [ ] All existing audits remain green (33/33 → 34/34 with this CC's new file)
- [ ] Cohort regen completes cleanly. Cost documented.
- [ ] Jason routes to Worth Grip; Cindy routes to Belonging Grip; Daniel routes to Security Grip
- [ ] Foster grep across all 24 fixtures = 0 hits

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count, regen cost.
2. **`lib/gripPattern.ts` paste** — show classifier function + renderer + underlying-question generator structure.
3. **Disambiguation tables paste** — confirm the routing logic encodes the canon disambiguation (Control + Knowledge → Worth; Control + Faith → Security; etc.).
4. **Cohort bucket distribution** — for every cohort fixture, list `bucket / renderedLabel / underlyingQuestion / confidence`. Confirm 3+ distinct buckets represented.
5. **Jason routing validation** — paste Jason's full `gripPattern` reading. Confirm bucket === "worth", confidence high or medium.
6. **Cindy synthetic validation** — paste Cindy's `gripPattern` reading. Confirm bucket === "belonging".
7. **Daniel synthetic validation** — paste Daniel's `gripPattern` reading. Confirm bucket === "security".
8. **Foster grep audit** — count of Foster vocabulary occurrences in: (a) rendered markdown across 24 fixtures, (b) LLM prompt source files, (c) chart annotations. Expected: 0 in all three.
9. **LLM cache regen confirmation** — hash version bump, cohort cache invalidation, regen completion, $cost.
10. **Grip score regression** — confirm `constitution.gripReading.score` is byte-identical to pre-CC for every fixture (±0.1).
11. **Audit pass/fail breakdown**.
12. **Out-of-scope verification** — confirm none of the 17 DO-NOT items were touched.

---

**Architectural test:** the user-visible report layer has fully transitioned. Open any cohort fixture's rendered markdown — there is no "Primal Question" anywhere, no "Am I X?" lines anywhere. The Grip section reads:

```
## Your Grip
Surface Grip: [signal cluster]
Grip Pattern: [shape-specific elaborative label]
Underlying Question: [engine-generated recognition prose]
Healthy Gift: [...]
Distorted Strategy: [...]
```

The chart annotation reads:

```
Pulling: [elaborative Grip Pattern label] — [confidence]
```

The cohort variance now shows three distinct Grip Patterns across the diagnostic shapes (Jason → Worth, Cindy → Belonging, Daniel → Security) with shape-specific elaborative labels per user. The engine-internal Primal computation may still run for cache stability, but no user surface mentions it. The borrowed taxonomy has disappeared from the product.

After this CC, the queue advances to CC-HANDS-CARD (9th body card with new existential-Goal-axis derivation) and then CC-PROGRESSIVE-DISCLOSURE-FRONT-PAGE (full report architectural restructure).
