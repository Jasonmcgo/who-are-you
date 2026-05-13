# CC-GRIP-CALIBRATION — Shape-Aware Primal Question Router + Three-Concept Separation

**Origin:** Jason's live session (jason0429, 4/29/2026) misclustered to *Am I secure?* with score 1.5 from named-grips `[control, money/security, being right]`. The deterministic `NAMED_GRIP_TO_PRIMAL` mapping in `lib/gripTaxonomy.ts` did the math correctly given the table; the table itself was the architectural error. For Knowledge-protector + Ni+Te + 94-Conscientiousness + Wisdom-governed shapes, "control" and "money/security" route toward mastery / craft / efficacy register (*Am I good enough?* / *Am I successful?*), not safety / foundation register. Jason's tension explanations confirmed this — they describe a man asking "Can I make the insight real? Can I operationalize it?" not a man asking "Will the foundations hold?"

This CC adds a shape-aware calibration pass over the deterministic floor, separates three architectural concepts the current code conflates, and introduces hedged prose mode for low-confidence cases.

**Canon for this CC** (Clarence + Jason 2026-05-10):

> *A named grip is not a conclusion. It is a clue.*
>
> *The grip is not what the person names. The grip is what the named pressure becomes inside that person's shape.*

**Method discipline:** Engine for truth. LLM for reception. Per `feedback_engine_for_truth_llm_for_reception.md`: the engine DECIDES the calibrated cluster (deterministic rules over shape signals — transparent, auditable, no LLM judgment). The LLM RENDERS the prose at the rubric standard. Calibration must NOT leak into LLM reinterpretation — every weight delta is rule-driven and traceable.

**Scope frame:** Three-part architecture — (1) calibration rules + router, (2) three-concept output structure, (3) hedged-mode LLM prose path. ~3-4 hours executor time. CC-mega scale because of the rule enumeration AND the structural addition of three new output concepts AND the LLM prompt expansion. Per `feedback_cc_time_estimates_5x_too_high`, treat that as the ceiling, not the floor.

**Cost surface:** ~$0.35 cohort regeneration. Existing 7 cached entries must be regenerated (their inputs hash will change). Calibration may unlock 2-3 new entries from the previously-low-confidence pool when shape context lifts an ambiguous case to high-confidence.

---

## Embedded context (CC executor environments don't see Cowork memory)

### The miscluster that triggered this CC

Jason's session named-grips: `[Grips control under pressure, Grips money / security under pressure, Grips being right under pressure]`.

Deterministic table math:
- "control" → primary Am I safe? (+1.0) + secondary Am I secure? (+0.5)
- "money/security" → primary Am I secure? (+1.0)
- "being right" → primary Am I good enough? (+1.0) + secondary Am I successful? (+0.5)

Aggregate: Am I secure? = 1.5 (winner) | Am I safe? = 1.0 | Am I good enough? = 1.0 | Am I successful? = 0.5.

Jason's freeform tension explanations:
- *"I invest in learning through AI tools (making programs), composing music, cooking — seeking knowledge and learning how to actually **do** the things."*
- *"I can learn a subject in a month that University students wouldn't learn in a year — and I'll have **put it to use**."*

These are mastery / craft / consequence register. They are not security register. The wrong cluster generated a wrong paragraph; the wrong paragraph would have aimed downstream prose at the wrong wound.

### Same phrase, different wound

Clarence's principle: each surface grip carries multiple possible underlying primal questions, distinguished by shape:

| Surface grip | Default routing | Shape-aware override |
|---|---|---|
| Control under pressure | Am I safe? + Am I secure? | Knowledge/Wisdom/Honor + Ni/Ne/Te/Ti driver + high-C → Am I good enough? + Am I successful? (mastery: "I need the read/system/standard to hold") |
| Money / security under pressure | Am I secure? | Knowledge/Purpose/Honor/Freedom Compass + craft/build/use freeform language → Am I good enough? + Am I successful? (money as fuel/proof/independence, not foundation) |
| Being right under pressure | Am I good enough? + Am I successful? | Relational freeform language ("rejected/embarrassed/exposed/judged") → Am I good enough? + Am I wanted? (relational shame, not craft anxiety) |
| Approval of specific people | Am I wanted? + Am I loved? | Si/Si+Fe shapes with high reactivity → Am I loved? primary (relational dependency, not room compliance) |
| Reputation under pressure | Am I successful? + Am I good enough? | Compass holds Honor/Justice as protect-class → Do I have purpose? secondary (mission-stakes, not status-stakes) |

The deterministic mapping is the FLOOR. Calibration is the TRUTH.

### Sub-registers within each Primal

The same Primal Question carries distinct sub-registers per shape. Naming them targets the LLM prose:

| Primal | Sub-registers |
|---|---|
| Am I safe? | physical-threat / existential-ground / avoidance-of-conflict |
| Am I secure? | foundation-anxiety / stewardship-of-craft / financial-fuel / independence-buffer |
| Am I loved? | relational-dependency / tenderness-deprivation / withdrawal-and-test |
| Am I wanted? | room-compliance / belonging-anxiety / approval-from-specific-people |
| Am I successful? | applause-seeking / consequence / standard-met / external-validation |
| Am I good enough? | shame-inadequacy / craft-standard / proving-capability / hiding |
| Do I have purpose? | mission-urgency / savior-complex / restless-reinvention |

The LLM prose layer reaches for the shape-appropriate sub-register; the calibration output names which one.

### Jason's rubric example (gold-standard four-part rendering)

> Surface Grip: Control under pressure.
> Underlying Question: Can I make the insight real enough to trust?
> Distorted Strategy: You may keep refining the architecture because a merely plausible answer feels morally lazy.
> Healthy Gift: You turn abstract truth into usable form.

When the engine re-runs Jason's session post-calibration, the resulting prose should travel to this rubric. This is the validation case.

### Three-concept separation

The current code conflates three things into one "grip cluster":

1. **Surface Grip** — the user-facing or answer-derived phrase the engine already names ("Control under pressure"). Observable behavior.
2. **Primal Question** — the underlying emotional question driving the surface grip ("Can I make the insight real?"). Internal driver.
3. **Distorted Strategy** — what the person does when the primal question gets loud ("Over-refines, challenges the model, delays peace until the architecture is clean"). Harm pattern.

Each plays a different role in the report. Surface grip is the engine's observation. Primal question is the diagnosis. Distorted strategy is the warning. Healthy gift (already in `PRIMAL_GIFT_REGISTER`) is the redemption. The four together give the LLM full structural input to render the section.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/gripCalibration.ts` | NEW | Calibration rules + `calibratePrimalCluster()` + `DistortedStrategy` mapping. Pure data + pure functions. Client-bundle-safe. |
| `lib/gripTaxonomy.ts` | MODIFY | Extend `derivePrimalCluster` to call `calibratePrimalCluster` after the deterministic pass. Extend `PrimalCluster` type with new fields (`baseScores`, `calibrationDeltas`, `appliedRules`, `subRegister`, `distortedStrategy`, four-level confidence). |
| `lib/gripTaxonomyInputs.ts` | MODIFY | Pass calibration data + sub-register + distorted-strategy into `GripParagraphInputs`. |
| `lib/gripTaxonomyLlm.ts` | MODIFY | System prompt updated with three-concept rendering instructions, hedged-mode triggers + template, sub-register awareness, Jason's rubric as lead example. Update `GripParagraphInputs` type. |
| `lib/identityEngine.ts` | MODIFY (surgical) | `attachGripTaxonomy` consumes calibration inputs; no architectural change to attach order. |
| `lib/renderMirror.ts` | MODIFY (surgical) | Grip section emit consumes new fields; render four-part structure when high/medium-high confidence; hedged short form when medium/low. Preserve calibration trace as inspectable section comment (HTML comment, not user-visible). |
| `app/components/InnerConstitutionPage.tsx` | MODIFY (surgical) | Render four-part structure when high/medium-high confidence; hedged short form when medium/low. |
| `scripts/buildGripTaxonomy.ts` | MODIFY | Force regeneration of all 7 existing entries (input hash changes); add any newly-unlocked entries from previously-low-confidence pool. |
| `lib/cache/grip-paragraphs.json` | REGENERATE | All entries regenerate with new input hash. |
| `tests/audit/gripCalibration.audit.ts` | NEW | Calibration-rule traceability + Jason validation case + zero-regression assertions. |
| `tests/audit/gripTaxonomy.audit.ts` | EXTEND | Existing assertions extended to cover new output fields. |

### Calibration rule format

```ts
type ShapePredicate = {
  driver?: CognitiveFunctionId[];                // any-of
  driverPair?: FunctionPairKey[];                // any-of (PascalCase per feedback_pair_key_casing_canon)
  topCompass?: { include?: string[]; exclude?: string[] };  // include any-of, exclude none-of
  conscientiousness?: { min?: number; max?: number };       // 0-100
  reactivity?: { min?: number; max?: number };              // 0-100
  openness?: { min?: number; max?: number };                // 0-100
  extraversion?: { min?: number; max?: number };            // 0-100
  agreeableness?: { min?: number; max?: number };           // 0-100
  riskFormLetter?: ("W" | "G" | "F" | "R")[];               // any-of
  goalSoul?: { quadrant?: string[]; minGoal?: number; minSoul?: number; maxAngleDeg?: number };
  vulnerability?: { min?: number; max?: number };           // 0-100, from Goal/Soul Z-axis
  weatherLoad?: { min?: number; max?: number };             // 0-100
  fireResponse?: string[];                                   // any-of
  freeformContains?: { tags: string[]; mode: "any-of" | "all-of" };  // semantic tags from freeform answers
  contributingGripsInclude?: string[];                       // any-of (humanReadable strings)
};

type CalibrationRule = {
  id: string;                                    // human-readable rule ID for traceability
  predicate: ShapePredicate;
  deltas: Partial<Record<PrimalQuestion, number>>;
  subRegisterHints?: Partial<Record<PrimalQuestion, string>>;  // sub-register tag if this rule fires
  rationale: string;                             // why this rule fires; surfaces in audit trace
};
```

### Calibrated output type

```ts
type CalibratedPrimalCluster = {
  // Existing fields (preserved):
  primary: PrimalQuestion | null;
  secondary?: PrimalQuestion;
  tertiary?: PrimalQuestion;                     // NEW — Clarence requested
  contributingGrips: string[];
  giftRegister: string;
  scores: Record<PrimalQuestion, number>;        // FINAL scores (post-calibration)

  // NEW transparency fields:
  baseScores: Record<PrimalQuestion, number>;    // pre-calibration deterministic scores
  calibrationDeltas: Record<PrimalQuestion, number>; // sum of all rule deltas applied
  appliedRules: Array<{ id: string; rationale: string; deltas: Partial<Record<PrimalQuestion, number>> }>;

  // NEW four-level confidence:
  confidence: "high" | "medium-high" | "medium" | "low";
  proseMode: "declarative" | "hedged";           // derived from confidence + signal density

  // NEW three-concept separation:
  surfaceGrip: string;                           // top contributing grip's humanReadable
  subRegister?: string;                          // tag like "craft-standard", "stewardship-of-craft"
  distortedStrategy: { primary: string; cost?: string };
  healthyGift: string;                           // expansion of giftRegister with sub-register flavor
};
```

### Confidence ladder

Replace binary `high|low` with four levels. Triggers:

- **high**: 3+ contributing grips AND top score > 1.5x second AND no rule reversed the deterministic top
- **medium-high**: 2+ grips AND top > 1.2x second, OR 3+ grips with top > 1.5x second but a calibration rule flipped the top (provisional confidence in the new top)
- **medium**: 2 grips with top within 1.2x of second, OR 1 grip + strong shape signals that match a primary-amplifying rule
- **low**: 1 grip with no shape-rule amplification, OR all grips ambiguous (top within 1.05x of second after calibration)

`proseMode`: `declarative` if high or medium-high, `hedged` if medium or low.

### Calibration rules to encode (initial set, ~12 rules)

These are the rules to ship. Each must have a unique `id`, a human-readable `rationale`, and a `subRegisterHints` annotation where applicable.

**Rule R1 — Mastery override on `control` for thinking-driver Knowledge-protectors.**
- Predicate: `driver` includes `ni|ne|ti|te` + `topCompass.include` ∋ Knowledge|Truth|Honor + `conscientiousness.min: 80` + `contributingGripsInclude` ∋ "Grips control under pressure"
- Deltas: Am I safe? -0.5 | Am I secure? -0.25 | Am I good enough? +0.5 | Am I successful? +0.25
- Sub-register hints: Am I good enough? → "craft-standard" | Am I successful? → "consequence"
- Rationale: "Knowledge/Truth/Honor protector + thinking-driver + high-C: 'control' grip routes toward mastery and clean execution, not safety/avoidance"

**Rule R2 — Stewardship confirmation on `money/security` for Stability-protectors.**
- Predicate: `topCompass.include` ∋ Stability|Family|Loyalty + `contributingGripsInclude` ∋ "Grips money / security under pressure" OR "Money/wealth stakes elevated"
- Deltas: Am I secure? +0.5
- Sub-register hint: Am I secure? → "foundation-anxiety"
- Rationale: "Stability/Family/Loyalty protector — 'money/security' grip genuinely points at foundational security register; deterministic mapping confirmed"

**Rule R3 — Mastery override on `money/security` for Knowledge-protectors without Stability.**
- Predicate: `topCompass.include` ∋ Knowledge|Truth|Honor + `topCompass.exclude` ∋ Stability|Family + `conscientiousness.min: 80` + `contributingGripsInclude` ∋ "Grips money / security under pressure" OR "Money/wealth stakes elevated"
- Deltas: Am I secure? -0.5 | Am I good enough? +0.25 | Am I successful? +0.25
- Sub-register hints: Am I secure? → "stewardship-of-craft" | Am I good enough? → "proving-capability" | Am I successful? → "consequence"
- Rationale: "Knowledge protector without Stability/Family — 'money/security' is fuel/proof/independence, not foundation anxiety"

**Rule R4 — Relational override on `being right`.**
- Predicate: `contributingGripsInclude` ∋ "Grips being right under pressure" + `freeformContains.tags` ∋ rejected|embarrassed|exposed|judged + `freeformContains.mode: any-of`
- Deltas: Am I good enough? +0.25 | Am I wanted? +0.5 | Am I successful? -0.25
- Sub-register hints: Am I good enough? → "shame-inadequacy" | Am I wanted? → "belonging-anxiety"
- Rationale: "'Being right' grip + relational shame language — same phrase, relational wound, not craft wound"

**Rule R5 — Craft confirmation on `being right`.**
- Predicate: `contributingGripsInclude` ∋ "Grips being right under pressure" + `freeformContains.tags` ∋ truth|accuracy|coherence|proof|works|operationalize|use
- Deltas: Am I good enough? +0.25 | Am I successful? +0.25 | Do I have purpose? +0.15
- Sub-register hints: Am I good enough? → "craft-standard" | Am I successful? → "consequence" | Do I have purpose? → "mission-stakes"
- Rationale: "'Being right' grip + craft language — same phrase, craft wound, mastery/consequence/mission register"

**Rule R6 — Wisdom-governed dampens defensive primals.**
- Predicate: `riskFormLetter` includes "W"
- Deltas: Am I safe? -0.5 | Am I secure? -0.25
- Rationale: "Wisdom-governed Risk Form — internal governor active; less likely to be safety/security-driven under pressure"

**Rule R7 — Reckless-fearful or Grip-governed amplifies defensive primals.**
- Predicate: `riskFormLetter` includes "R" OR "G"
- Deltas: Am I safe? +0.25 | Am I secure? +0.25
- Rationale: "Reckless-fearful or Grip-governed — pressure responses tend toward defensive primals"

**Rule R8 — Si driver confirms security register.**
- Predicate: `driver` includes "si"
- Deltas: Am I secure? +0.25 | Am I safe? +0.15
- Sub-register hint: Am I secure? → "foundation-anxiety"
- Rationale: "Si driver — precedent-keeping shape genuinely points at security/safety register; deterministic mapping confirmed"

**Rule R9 — Fe driver shifts toward relational primals.**
- Predicate: `driver` includes "fe"
- Deltas: Am I wanted? +0.25 | Am I loved? +0.25
- Sub-register hint: Am I wanted? → "room-compliance" | Am I loved? → "tenderness-deprivation"
- Rationale: "Fe driver — relational register elevates wanted/loved primals"

**Rule R10 — Goal-leaning + low-Soul amplifies success/good-enough register.**
- Predicate: `goalSoul.minGoal: 70` + `goalSoul.maxAngleDeg: 35` (Goal-dominant)
- Deltas: Am I successful? +0.25 | Am I good enough? +0.15
- Sub-register hints: Am I successful? → "consequence" | Am I good enough? → "proving-capability"
- Rationale: "Goal-dominant Movement — work-line dominance signals success/capability primal pressure"

**Rule R11 — High vulnerability amplifies relational primals.**
- Predicate: `vulnerability.min: 60` (Z-axis)
- Deltas: Am I loved? +0.25 | Am I wanted? +0.15
- Rationale: "High Goal/Soul vulnerability — interior-exposure register lifts relational primal pressure"

**Rule R12 — Single-signal hedge marker (informational only).**
- Predicate: `contributingGripsInclude` length-1 condition (use a custom predicate field `gripCountMax: 1`)
- Deltas: (none)
- Side effect: forces `proseMode: "hedged"` on output regardless of confidence-ladder result
- Rationale: "Single contributing grip — confidence in cluster derivation is structurally limited; hedged prose mode applies"

**Note on R4/R5 (freeform-contains rules):** these require a freeform-tag extraction pass. If the engine doesn't already extract semantic tags from freeform tension explanations, this CC adds a minimal extractor that scans for the hardcoded tag lists in R4 + R5. Implementation: simple keyword-match against open-tension `explanation` fields and any other freeform answer fields. Document the tag list in `lib/gripCalibration.ts` constants. Do NOT add an LLM-based extractor — the rules must remain transparent. If freeform fields aren't available in the constitution at the calibration call site, R4 and R5 are no-ops for now; flag in the rationale.

### Three-concept rendering

The render pipeline produces four prose elements (when confidence ≥ medium-high):

```
## Your Grip

[Surface Grip line] You [name the surface grip in plain language].

[Underlying Question line] The question your shape may be asking is *[primary primal question, with sub-register flavor]*.

[Paragraph — the heart] [Gift-first warm prose, then pivot to distorted strategy as cost, then closing imperative. ~120-180 words.]

[Distorted Strategy callout — short, italicized] *Under pressure, this can pull toward [distorted strategy primary]. The cost: [distorted strategy cost].*

[Healthy Gift callout — short, italicized] *Held well, this becomes [healthy gift expansion with sub-register flavor].*
```

When confidence is medium or low (`proseMode: "hedged"`):

```
## Your Grip

A possible read — held lightly. Your answers carry signal that may point toward *[primal question, hedged: "wondering whether..."]*. [60-80 word hedged paragraph that names the possible question, acknowledges thin signal, suggests the gift register without declaring it. No closing imperative.]

*If this lands, the gift may be [healthy gift, hedged]. If it doesn't, the read is the wrong aim — your shape is making a finer-grained question that this section hasn't measured cleanly.*
```

### Distorted strategy mapping

```ts
type DistortedStrategyEntry = { primary: string; cost?: string };

const DISTORTED_STRATEGY: Partial<Record<PrimalQuestion, Record<string, DistortedStrategyEntry>>> = {
  "Am I good enough?": {
    "craft-standard": {
      primary: "over-refining the architecture because a merely plausible answer feels morally lazy",
      cost: "delaying peace until the structure is clean",
    },
    "shame-inadequacy": {
      primary: "hiding the work until it feels safe to be seen",
      cost: "the people closest to you can't help you carry what you won't show them",
    },
    // ... (additional sub-registers)
  },
  // ... (other primals)
};
```

The full table needs ~3-4 entries per Primal × sub-register combination. Embed the table inline in `lib/gripCalibration.ts`. Each entry must be ≤ 120 chars (compression discipline).

---

## LLM system prompt updates

Modify `lib/gripTaxonomyLlm.ts` `GRIP_SYSTEM_PROMPT`:

1. **Replace the existing rubric examples with Jason's gold-standard four-part rubric as the lead example.** Keep one of the existing examples (Am I wanted? for ocean/27 stays good); add one more high-confidence-but-different-shape example (TBD post-calibration).

2. **Add hedged-mode section.** When `proseMode: "hedged"`, the LLM produces shorter, less-declarative prose. Embed the hedged template directly. Examples:

> Hedged mode example (single-grip case):
>
> *A possible read — held lightly. Your answers carry signal that may point toward whether the standard you can see is one your work is meeting. The question may not be loud yet — it sometimes registers only when a piece of work doesn't quite land. If this lands, the gift may be the kind of craft that gets sharper because you've kept it honest with yourself. If it doesn't, the read is the wrong aim — your shape is making a finer-grained question that this section hasn't measured cleanly.*

3. **Add three-concept consumption.** The LLM input now includes `surfaceGrip`, `primary`, `subRegister`, `distortedStrategy.primary`, `distortedStrategy.cost`, `healthyGift`. Instruct the LLM to:
   - Use the surface grip in plain language at the top (one line)
   - Compose the primary paragraph using the sub-register flavor (not generic Primal language)
   - Render distorted strategy + healthy gift as separate italicized callouts (engine writes them; LLM passes them through verbatim with at most light grammar smoothing)
   - The paragraph itself is the LLM's load-bearing prose; the callouts are engine-authored

4. **Add four banned phrases** (architecture-narration prevention):
   - "calibration"
   - "primal cluster"
   - "weight delta"
   - "shape-aware"

5. **Update the user-prompt builder** to include the new fields in the structured input.

---

## Audit assertions (12 NEW + extensions to existing)

In `tests/audit/gripCalibration.audit.ts`:

1. **`grip-calibration-rule-uniqueness`** — every `CalibrationRule.id` is unique.
2. **`grip-calibration-rationale-non-empty`** — every rule has non-empty `rationale`.
3. **`grip-calibration-deterministic-floor-preserved`** — `derivePrimalCluster` still returns the deterministic baseScores in the output (no rule deletes the floor).
4. **`grip-calibration-deltas-sum-correct`** — `calibrationDeltas[primal] === sum(appliedRules.filter.deltas[primal])` for every primal in every cohort fixture.
5. **`grip-calibration-final-equals-base-plus-delta`** — `scores[primal] === baseScores[primal] + calibrationDeltas[primal]` for every primal in every cohort fixture.
6. **`grip-calibration-jason-validation`** — for `ocean/07-jason-real-session.json` (after fixture is updated to include Jason's live session Q-GRIP1/Q-Stakes1 answers OR if the live session data is encoded in the audit), the calibrated `primary` is "Am I good enough?" OR "Am I successful?" — NOT "Am I secure?". Subregister tag is "craft-standard" or "consequence". (Note: this assertion may depend on the fixture update being done in a separate companion CC; if Jason's fixture isn't updated by the time CC-GRIP-CALIBRATION lands, scaffold the assertion as a `.skip` with a TODO comment pointing at the companion fixture-update CC.)
7. **`grip-calibration-zero-regression-secure-confirmed`** — `gsg/02-compartmentalized` and `ocean/24-si-precedent-keeper` retain `Am I secure?` as primary post-calibration (Rule R2 / R8 confirm them).
8. **`grip-calibration-zero-regression-wanted-confirmed`** — `ocean/27-fe-room-reader-attuned` retains `Am I wanted?` as primary (Rule R9 confirms).
9. **`grip-calibration-confidence-ladder`** — every cohort fixture has confidence in `{high, medium-high, medium, low}` (no other strings).
10. **`grip-calibration-prose-mode-derivation`** — `proseMode === "declarative"` iff confidence is high or medium-high; `proseMode === "hedged"` iff confidence is medium or low.
11. **`grip-calibration-three-concepts-populated`** — for every fixture with `confidence !== "low"`, all three concepts (`surfaceGrip`, `subRegister` if applicable, `distortedStrategy`) are populated.
12. **`grip-calibration-banned-phrase-absence`** — for every cached LLM paragraph, the four new banned phrases ("calibration", "primal cluster", "weight delta", "shape-aware") are absent.

In `tests/audit/gripTaxonomy.audit.ts` (extensions):
- Update existing assertions to consume the new output fields (`baseScores`, `calibrationDeltas`, `appliedRules`).
- The existing `grip-taxonomy-mapping-coverage` stays — calibration doesn't replace the deterministic mapping.

---

## Cohort regeneration

After the calibration code lands, re-run `scripts/buildGripTaxonomy.ts --force` to regenerate all 7 existing cached entries (input hash will change due to new fields in `GripParagraphInputs`). Expected behaviors:

- **gsg/02-compartmentalized**, **gsg/12-productive-ne**, **ocean/24-si-precedent-keeper**, **ocean/25-ti-coherence-prober**: all 4 currently `Am I secure?`. Expected post-calibration:
  - gsg/02: stays Am I secure? if Compass holds Stability/Family. Re-examine if Compass is Knowledge-leaning.
  - ocean/24: stays Am I secure? (Si driver — Rule R8).
  - ocean/25 (Ti coherence-prober): likely shifts to Am I good enough? sub-register craft-standard (Ti driver + craft-language tendencies). Validate.
  - gsg/12: re-examine.
- **ocean/02-high-conscientiousness**, **gsg/07-true-gripping**: both currently `Am I successful?`. Likely stable; gsg/07 may add Am I good enough? as secondary.
- **ocean/27-fe-room-reader-attuned**: currently `Am I wanted?`. Stable (Rule R9).
- **Previously-low-confidence pool (17 fixtures)**: any that had at least one named-grip but were below confidence threshold may now lift to medium-confidence with calibration shape signals. Re-cache as needed.

Cost: ~$0.20-0.35 depending on how many newly-unlocked entries land.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify the existing `NAMED_GRIP_TO_PRIMAL` deterministic table.** It is the floor. Calibration adds; it does not edit.
2. **Do NOT introduce LLM-based interpretation in the calibration pass.** Every weight delta must be rule-driven. The LLM only renders the prose; it does not reinterpret the cluster.
3. **Do NOT add new survey questions.** Per `feedback_minimal_questions_maximum_output` — derive from existing signals. Freeform-tag extraction uses existing tension `explanation` fields.
4. **Do NOT modify named-grip generation logic in `lib/goalSoulGive.ts`.** The grips that fire stay as they are. Calibration acts on what fires; it doesn't change what fires.
5. **Do NOT modify the Path master synthesis (`lib/synthesis3Llm*.ts`).** The Grip section is independent.
6. **Do NOT add fixture data.** CC-GRIP-FIXTURE-EXPANSION is a separate CC for the cohort thinness gap.
7. **Do NOT bundle CC-SYNTHESIS-PICTURE.** P-word picture is queued behind this CC.
8. **Do NOT modify Risk Form 2x2 classifier, OCEAN composition, Compass logic, Movement quadrant logic, or Drive-bucket logic.** Calibration READS these; it does not WRITE them.
9. **Do NOT add a new top-level report section.** The Grip section already exists from CC-GRIP-TAXONOMY; this CC enriches its content, not its placement.
10. **Do NOT change the `NON_PRIMAL_NAMED_GRIPS` exclusion set.**
11. **Do NOT add loop-detection signals.** That's CODEX-MBTI-LOOP-DETECTION (separate, queued).

---

## Verification checklist (executor must run all)

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npx tsx tests/audit/gripCalibration.audit.ts` (new — all 12 assertions pass)
- [ ] `npx tsx tests/audit/gripTaxonomy.audit.ts` (extended — all original + extension assertions pass)
- [ ] `npx tsx tests/audit/proseArchitecture.audit.ts`
- [ ] `npx tsx tests/audit/synthesis1a.audit.ts`
- [ ] `npx tsx tests/audit/synthesis1Finish.audit.ts`
- [ ] `npx tsx tests/audit/synthesis3.audit.ts`
- [ ] `npx tsx tests/audit/jungianCompletion.audit.ts`
- [ ] `npx tsx tests/audit/oceanDashboard.audit.ts`
- [ ] `npx tsx tests/audit/goalSoulGive.audit.ts`
- [ ] `npx tsx tests/audit/fixturesSiTiFiFe.audit.ts`
- [ ] `ANTHROPIC_API_KEY=$(grep ^ANTHROPIC_API_KEY .env.local | cut -d= -f2) npx tsx scripts/buildGripTaxonomy.ts --force` (cohort regenerates clean, all entries cached)

---

## Report-back format

When complete, report back:

1. **Summary** — files added/modified, line-count delta, audit-pass count.
2. **Calibration trace for the 7 high-confidence fixtures** — for each, show baseScores → calibrationDeltas → finalScores, applied rule IDs with rationale, and the resulting primary/secondary/tertiary + confidence + proseMode.
3. **Newly-unlocked fixtures** — any that lifted from low-confidence to medium or higher post-calibration.
4. **Jason validation case** — if Jason's fixture has Q-GRIP1/Q-Stakes1 data, run it and report. If not, report which assertion is `.skip`'d and why.
5. **Sample LLM paragraphs** — for 2 fixtures (one declarative, one hedged), paste the full rendered four-part Grip section.
6. **Cohort distribution shift** — table comparing pre-calibration cluster distribution vs post-calibration.
7. **Cost note** — actual API spend.
8. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
9. **Out-of-scope verification** — confirm none of the 11 DO-NOT items were touched.
10. **Recommendations for follow-on work** — including any rule gaps surfaced by cohort testing, any sub-register hints that didn't trigger anywhere (suggesting they should be removed or the rule should be tightened), and any fixture-pair-key conflicts the calibration revealed.

---

## Canon-quality framing for the LLM prompt (use as anchor lines)

The two Clarence canon lines at the top of this CC should appear once in the system prompt as the architectural framing the LLM operates inside:

> *A named grip is not a conclusion. It is a clue.*
>
> *The grip is not what the person names. The grip is what the named pressure becomes inside that person's shape.*

Place them as a comment block in the system prompt, not in the user-facing output. They tell the LLM why the calibration matters; they should not appear in the rendered Grip section.

---

**Architectural test for this CC:** when Jason's session re-runs post-calibration, the rendered Grip section should produce prose that lands at or near the gold-standard rubric:

> Surface Grip: Control under pressure.
> Underlying Question: Can I make the insight real enough to trust?
> Distorted Strategy: You may keep refining the architecture because a merely plausible answer feels morally lazy.
> Healthy Gift: You turn abstract truth into usable form.

If the post-calibration prose lands here, the architecture works. If it doesn't, the rule set or the LLM prompt needs another pass.
