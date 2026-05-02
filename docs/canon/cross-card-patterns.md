# Cross-Card Patterns (CC-022b)

Cross-card patterns are a **prose-layer** architectural primitive. They surface specific named insights that emerge when signals from one card combine with signals from another — the matrix-model reads that distinguish the engine's output from a generic personality summary.

**Architectural constraint**: cross-card patterns are detected at **prose-generation time**, not at derivation time. They consume signals that already exist on the InnerConstitution; they do not add new signals, do not gate tension detection, do not change which cards render. Adding a new pattern to the catalog cannot break existing detections — patterns are independent registry entries.

**Architectural separation** (per `demographic-rules.md` Rule 4 amendment, 2026-04-26):

- **Derivation layer** (`buildInnerConstitution`, `deriveSignals`, `detectTensions`, per-card output generators): demographic-blind. Two users with identical answer arrays + different demographics produce byte-identical InnerConstitution structures.
- **Prose-generation layer** (cross-card patterns, Simple Summary, name threading, demographic interpolation): may consume the user's demographics for personalization. Reflects user-supplied facts; never infers, never asserts cultural-archetype claims.

Cross-card patterns live entirely in the prose-generation layer. Their `detection` functions read only `Signal[]`, `SignalRef[]` (top compass / top gravity), `LensStack`, and `MetaSignal[]` — never `DemographicSet`. Their `prose` functions may interpolate the user's name via `nameOrYour` for personalization.

## Code surface

```ts
export type CrossCardPattern = {
  pattern_id: string;
  name: string;
  description: string;
  applicable_card: ShapeCardId;             // where the prose surfaces in the Map
  detection: (
    signals: Signal[],
    topCompass: SignalRef[],
    topGravity: SignalRef[],
    lensStack: LensStack,
    metaSignals: MetaSignal[]
  ) => boolean;
  prose: (
    signals: Signal[],
    topCompass: SignalRef[],
    topGravity: SignalRef[],
    lensStack: LensStack,
    demographics?: DemographicSet | null
  ) => string;
};

export function detectCrossCardPatterns(...): { pattern: CrossCardPattern; prose: string }[];
```

`CROSS_CARD_PATTERNS` is the registry. `detectCrossCardPatterns` filters and returns the active patterns with their generated prose. `MapSection.tsx` groups by `applicable_card` and renders each card's pattern prose as a "Pattern observation" block visible when that card is expanded.

## The composition-check rule

When authoring a new pattern, verify that the framing **composes** with the source card's semantics. A pattern's verb (or framing primitive) must make sense against the structural meaning of the card whose prose it lives in.

Examples:
- Q-I2's pattern-style works because *"could revise"* composes with *"trust source"* — trust sources can revise beliefs.
- A hypothetical Q-I3-style pattern that asks *"would you risk losing for this belief?"* against *"sacred values"* would FAIL composition — sacred values, by definition, are not things you would freely sacrifice. The verb's semantics fight the noun's semantics.

The same check applies at the cross-card-pattern level: a pattern claiming *"X composed with Y produces Z"* must use a Z whose framing fits X and Y's joint structure. When a pattern doesn't compose, the prose lands as gotcha or as nonsense, and should be rejected before catalog entry.

This rule is the same composition check noted in `prompts/queued/Q-I3-restructure-notes.md`. CC-024 (Keystone Block Restructure, shipped 2026-04-27) picked up the Q-I3 question-level fix by re-deriving Q-I3 from Q-Stakes1's concrete loss domains. Cross-card patterns continue to honor the rule at the prose-layer level when authored.

## Initial catalog (CC-022b ship)

12 patterns. Each is a (detection rule, prose template) pair targeting one of the eight body-map cards.

### 1. Faith ↔ Supernatural distinction → Compass

**Detection**: high `faith_priority` (top-2 in Compass) AND not high `supernatural_responsibility_priority` (not top-2 in attribution).

**Prose**: *"Faith appears to function less as an escape hatch from responsibility and more as an orienting trust. {Name?} may believe in what is beyond human control without using it to excuse what remains within human responsibility."*

**Why it composes**: Faith (compass) + responsibility-attribution (gravity) are distinct frames. The pattern names the structural relationship between them — they're not the same axis, and someone can hold high Faith while still locating responsibility within human action.

### 2. Justice ↔ System attribution → Gravity

**Detection**: high `justice_priority` + high `system_responsibility_priority`.

**Prose**: *"Your sense of justice operates against the structures more than against the individuals — this often shows up as advocacy work, systemic critique, or the kind of attention that seeks the source of the harm rather than the surface of it."*

### 3. Truth ↔ private-under-threat Conviction → Conviction

**Detection**: high `truth_priority` + `conceals_under_threat` or `guarded_in_public` Conviction signal.

**Prose**: *"Your commitment to truth coexists with caution about expressing it publicly. The truth you protect may live inwardly more than visibly — a conviction kept rather than declared."*

### 4. Freedom ↔ Order tension → Compass

**Detection**: high `freedom_priority` + high `order_priority` OR `stability_priority`.

**Prose**: *"You appear to protect both freedom and order — these often live in tension. The shape of how you hold both is one of the more telling things this card surfaces."*

### 5. Family ↔ Money allocation gap → Compass

**Detection**: high `family_priority` (Q-S2) + family low in Q-S3-cross top-2.

**Prose**: *"You named Family as among your most sacred values. The allocation card surfaces a gap between that ranking and where your discretionary money currently flows — a gap the model surfaces but does not adjudicate."*

**Note**: this pattern is the Compass-side reflection of T-013 (which fires in Allocation Gaps). Both can render; they're at different abstraction levels.

### 6. Knowledge ↔ Education trust → Trust

**Detection**: high `knowledge_priority` + high `education_trust_priority`.

**Prose**: *"Your trust in education aligns with your sacred ranking of knowledge — the institutions you trust most are the ones whose work matches what you protect."*

### 7. Loyalty ↔ Family/Partner trust → Trust

**Detection**: high `loyalty_priority` + (high `family_trust_priority` OR high `partner_trust_priority`).

**Prose**: *"Loyalty operates as both a sacred value you protect AND the kind of trust you extend most readily — these reinforce each other in the shape of how you commit."*

### 8. Stability ↔ Chaos formation → Weather

**Detection**: high `stability_priority` + `chaos_exposure` from Q-F2.

**Prose**: *"The stability you protect now may be a deliberate response to early uncertainty. What you protect is sometimes shaped by what you didn't have."*

### 9. Pattern-reader Lens ↔ low present-tense action → Lens

**Detection**: dominant `ni` or `ne` + `reactive_operator` from Q-A1.

**Prose**: *"The pattern-reader gift can produce paralysis when the patterns multiply faster than action. {Name?} may need to choose ground that's good enough rather than waiting for the optimal pattern to land."*

### 10. Costly conviction without revision → Conviction

**Detection**: `holds_internal_conviction` + `belief_impervious` MetaSignal (from Q-I2 None-selected).

**Prose**: *"Your willingness to bear cost for belief comes paired with a closed revision path — neither alone is the full shape; together they describe a conviction that has chosen its room and may stop testing whether the room was rightly chosen."*

### 11. Builder ↔ Maintenance allocation gap → Path

**Detection**: pattern-reader Lens (Ni or Ne dominant) + structurer support (Te aux) + (`reactive_operator` OR `responsibility_maintainer`) from Q-A1 + at least one structural sacred value (Faith / Truth / Knowledge / Justice) in Compass top-2.

**Prose**: *"For your shape, the meaningful allocation gap may not be the standard money-toward-charity question. The sharper question is whether your creative output, your protected hours, and your strategic attention are moving toward the future you say you believe in — or whether maintenance is consuming the time that was supposed to build it."*

**Why it composes**: T-013's "money-toward-charity" framing reads as cheap-gotcha for builder-shapes whose meaningful allocation isn't dollars. This pattern is the builder-shape correction — same structural insight (named values vs lived allocation), translated into the resource the user actually spends. T-013 still fires for shapes where money-flow is the right surface; this pattern fires alongside or in place of it for builder-shapes.

### 12. Endurance under low present load → Weather

**Detection**: `holds_internal_conviction` + low/moderate current Weather load.

**Prose**: *"The endurance pattern this shape carries shows up best at low load — when there's nothing acute to absorb. The shape's gift may be the reserve that gets called on when load arrives, not the visible carrying that load already requires."*

## CC-029 catalog expansion (added 2026-04-29) — Tier 2: middle

Five patterns extending coverage to **Si / Se / Ti / Fi / Fe** dominants. Pre-CC-029, of the 12 catalog patterns, 6 explicitly checked dominant-function conditions and all 6 checked Ni or Ne — sensor-dominant and feeler-dominant users got pattern silence on the Mirror beyond their Lens-stack reading. Each new pattern composes a dominant function with an existing signal in a way that reads as a cross-card observation (not a function description); none introduces new questions or signals.

This is **Tier 2** of the cognitive-function-parity program. CC-034 (Tier 1, shipped) raised the floor by giving each non-Ne/Ni dominant a function-specific gift-category fallback so no function reads as generic Pattern prose. CC-029 raises the middle by giving each underserved function its own cross-card pattern. CC-036 (Tier 3, queued) raises the ceiling with secondary discriminating routes per function.

### 13. Si — tradition built from chaos → Weather

**Detection**: `lensStack.dominant === "si"` + `chaos_exposure` signal (Q-F2 "Uncertain or chaotic" childhood environment).

**Prose**: *"Your sensing register doesn't read as nostalgia for what was — it reads as construction of what wasn't given. Your formation in uncertain ground tends to produce people who build the tradition they didn't inherit, hour by hour, choice by choice. The continuity others took for granted is something you make."*

**Why it composes**: Si's preservation register, when paired with formation in chaos, reads as actively *building* the tradition the user wasn't given — not as nostalgia for what was. Names the user as the keeper because no one kept it for them. Weather is the canon home — formation-and-load card, where chaos-formation patterns live.

### 14. Se — alive in crisis, strained on the long arc → Path

**Detection**: `lensStack.dominant === "se"` + `reactive_operator` signal from Q-A1 (canonical accessor: `hasFromQuestion(signals, "reactive_operator", "Q-A1")`, mirroring `inferAgencyPattern.current === "reactive"`).

**Prose**: *"Your sensing register is most alive in the present — engaged with what's actually here, responsive to what changes. The same register that makes you effective in crisis can struggle with the long arc, where the gift of immediacy doesn't carry. The growth move isn't to dampen the immediacy. It's to choose one long-arc commitment and protect it on a different rhythm."*

**Why it composes**: Se's somatic-engagement strength becomes a planning gap when sustained over a long arc. Names the gift→risk dynamic without judging the reactive mode. Path is the canon home — agency / aspiration / sustained-direction card.

### 15. Ti — closed reasoning chamber → Conviction

**Detection**: `lensStack.dominant === "ti"` + `holds_internal_conviction` signal + Te not in dominant or auxiliary slot. Implementation: `lensStack.auxiliary !== "te"` (since `dominant === "ti"` is already enforced, the dominant-isn't-Te clause is automatic; the operative low-Te check is on auxiliary).

**Prose**: *"Your reasoning is internally consistent and well-formed — the frameworks you hold are real frameworks, not slogans. The risk in this configuration is testing those frameworks mostly against your own internal coherence rather than against external proof. The growth move is exposing one held position to the discipline of someone who'd disagree with it for reasons you respect."*

**Why it composes**: Ti's framework-building can become a closed chamber when Te (external proof, system-level testing) is low. Names the risk register without implying the framework is wrong. Conviction is the canon home — Ti's framework-building lives in the belief-and-its-defense register.

### 16. Fi — willing to bear cost only for personally-authentic conviction → Fire

**Detection**: `lensStack.dominant === "fi"` + `high_conviction_under_risk` signal (Q-P2 "Accept the risk" answer).

**Prose**: *"When your conviction is personally authentic — when you've weighed it and made it your own — you will bear cost for it. The same register reads more thinly when the belief is shared by your group but hasn't been weighed personally. The growth move is naming this distinction out loud — both to yourself and to the people who count on you."*

**Why it composes**: Fi's authenticity-driven cost-bearing is a strength when the conviction is the user's own. The pattern surfaces the boundary as honest, not as failure: group-shared belief without personal authentication tends not to trigger the same cost-bearing — and that's worth seeing. Fire is the canon home — cost-bearing / conviction-under-cost card.

### 17. Fe — attunement turning into yielded conviction under social pressure → Fire

**Detection**: `lensStack.dominant === "fe"` + `adapts_under_social_pressure` signal (Q-P1 "Stay silent" or "Soften it" answers).

**Prose**: *"Your attunement to others is real — you read what the moment is asking and respond to what's needed. The same register, under social pressure, can yield more than you intend. The gift and the risk are the same instrument; the question is whether you're attending to what others need or attending to what you need to keep your place with them."*

**Why it composes**: Fe's relational attunement is a real gift; the same register can become yielding under social pressure. Names the gift→risk gradient without pathologizing the attunement. Fire is the canon home — pressure-card prose lives there per `SURVEY_CARD_TO_SHAPE_CARD` (`pressure → fire`).

### Post-CC-029 pattern coverage by dominant function

| Dominant | Pre-CC-029 | Post-CC-029 |
|---|---|---|
| Ni | 4 (faith / pattern-reader / costly-conviction / builder-aux) | 4 |
| Ne | 2 (pattern-reader / builder-aux) | 2 |
| Si | 0 | **1** (tradition-from-chaos) |
| Se | 0 | **1** (crisis-alive) |
| Ti | 0 | **1** (closed-chamber) |
| Te | 1 (builder-aux) | 1 |
| Fi | 0 | **1** (personally-authentic) |
| Fe | 0 | **1** (yielded-conviction) |

Sensor-dominant and feeler-dominant users now have at least one cross-card pattern that fires when its conditions match. Coverage doesn't yet match Ni's count of 4 — that's CC-036 (Tier 3) territory, where each function gets multiple discriminating-route patterns.

## How patterns are inserted

`MapSection.tsx` calls `detectCrossCardPatterns(...)` once per render and groups the results by `applicable_card`. Each ShapeCard is followed by a `<CrossCardPatternBlock>` that renders the patterns for that card when the card is expanded. The block is visually marked with an umber left rule + a "Pattern observation" kicker, distinguishing it from the card's Strength/Trap/Next move output.

The integration is purely additive — pattern prose appears alongside existing per-card outputs. Removing all patterns from the catalog leaves card rendering unchanged.

## Growth rule

The catalog adds new patterns over time as real-user testing surfaces gaps. Each new pattern lands as an entry in `CROSS_CARD_PATTERNS` with its own `detection` + `prose` functions. Existing patterns don't break when new ones land — patterns are independent.

When a new pattern is proposed:

1. Run the **composition check** (above) — does the pattern's framing compose with the source card's semantics?
2. Confirm the pattern is at the **right abstraction level** — too narrow reads as boilerplate; too broad fires for everyone and loses specificity.
3. Author the **detection rule** in terms of existing signals + topCompass / topGravity refs + LensStack + MetaSignals. New signals go through the derivation-layer (CC-NNN signal proposals), not the prose layer.
4. Author the **prose template**. Use `nameOrYour` for name interpolation. Honor the Five Dangers from `result-writing-canon.md`.
5. Add to the canonical catalog in this doc with detection + prose verbatim.
6. Smoke-test against synthetic sessions that should and shouldn't trigger.

## Cross-references

- `result-writing-canon.md` — the Five Dangers + protected lines that pattern prose must honor.
- `demographic-rules.md` Rule 4 amendment (2026-04-26) — the layer separation that permits demographic interpolation in pattern prose.
- `prompts/queued/Q-I3-restructure-notes.md` — the composition-check rule's origin.
- `lib/identityEngine.ts` `CROSS_CARD_PATTERNS` — the executable catalog.
