# Path · Gait — 3C's Allocation Question (Architecture Notes)

*Surfaced 2026-04-26 by Jason. Captured for a future structural CC. Not in scope for CC-024 (Keystone Block Restructure); separate architectural addition.*

*Probable label: **CC-026 — Path 3C's Allocation** (or whatever number is free at draft time).*

*Sequenced AFTER CC-024 lands and after a real-user soak window confirms the Compass-Stakes addition feels right.*

---

## The framework — Jason's 3C's of priorities

Three meta-categories that govern resource allocation across a life:

- **Cost** — wealth, money, things, material accumulation, financial protection.
- **Compliance** — risk posture, what conventions you'll follow or break, what you're willing to risk.
- **Coverage** — time and care for the mission and people most important to you.

The forced-allocation mechanism: distribute 9 points across the three categories. Sum must equal 9. Surfaces tradeoffs that ranking alone can't — the user has to pull from one to give to another. That's a different measurement primitive than ranking and produces sharper signal.

Sample readings:

- **(8, 1, 0)** — wealth-dominant; no risk; no time for mission/people.
- **(1, 4, 4)** — light material; balanced risk and time-for-mission.
- **(3, 3, 3)** — balanced; no extreme.
- **(0, 9, 0)** — pure risk-tolerance; indifferent to wealth or relational time.
- **(4, 4, 1)** — wealth + risk-tolerance + minimal coverage (e.g., startup founder shape).
- **(1, 1, 7)** — heavy coverage; light on wealth and risk (caregiver / teacher / mission-driven).

There are 28 distinct (a, b, c) tuples summing to 9 with non-negative integers. Combined with the existing measurement surfaces, this produces a meaningful expansion of discriminating power.

## Why Path · Gait is the right home

Walked through all 7 enrichable cards (Lens already rich):

- **Compass** — already growing to three registers in CC-024 (sacred values + allocation + stakes); adding 3C's makes it four. Heavy.
- **Conviction** — belief-specific 3C's would force the framing onto cost-of-conviction; Jason's framing is broader (ongoing life-allocation).
- **Gravity** — about responsibility/attribution; doesn't naturally hold 3C's.
- **Trust** — about input channels; doesn't hold 3C's.
- **Weather** — about felt context; not active allocation.
- **Fire** — reactive, not allocative.
- **Path · Gait** — best fit. Gait is *the rhythm of how you spend your steps through life*; 3C's is exactly that.

Path is also currently the **most under-measured** card. Rich narrative output (Work / Love / Give / Growth move) but zero direct measurement input — prose is synthesized from other cards' signals. Adding Q-3C1 gives Path its own measurement primitive and rebalances the architecture (Path moves from "no direct measurement" to "medium measurement").

## Proposed Q-3C1 (NEW — Path card)

```
question_id: Q-3C1
card_id: path
type: forced_allocation        # NEW question type — see below
question: "If you had to distribute 9 points across these three priorities —
           based on how you actually spend your time and resources, not how
           you think you should — how would you allocate them?"
helper:   "Allocate 9 points. The numbers must sum to 9."
items:
  - id: cost
    label: Cost
    gloss: wealth, money, things, material accumulation, financial protection.
    signal: cost_priority
  - id: compliance
    label: Compliance
    gloss: risk posture, what conventions you'll follow or break, what you're willing to risk.
    signal: compliance_priority
  - id: coverage
    label: Coverage
    gloss: time and care for the mission and people most important to you.
    signal: coverage_priority
constraint: sum_to_9
```

## New question type — `forced_allocation`

The existing question types (`forced`, `freeform`, `ranking`, `ranking_derived`, `multiselect_derived`, `single_pick`) don't natively handle a sum-to-N point allocation. CC-026 introduces a new type:

```ts
export type ForcedAllocationQuestion = {
  question_id: string;
  card_id: CardId;
  type: "forced_allocation";
  text: string;
  helper?: string;
  items: { id: string; label: string; gloss: string; signal: SignalId }[];
  total: number;                  // e.g., 9
};

export type ForcedAllocationAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "forced_allocation";
  allocations: Record<string, number>;   // item_id → points
};
```

Each item emits a signal at strength derived from its allocation:
- 0 → not emitted (or emitted with `cardinality: zero` flag for cross-card patterns).
- 1-2 → strength `low`.
- 3-5 → strength `medium`.
- 6-7 → strength `high`.
- 8-9 → strength `dominant` (or just `high` with a special flag — design decision at CC time).

## UI primitive

A new `<ForcedAllocation>` component renders three sliders or +/- counters with a running total at the top ("X of 9 points allocated"). Continue is disabled until total === 9.

Touch-friendly + keyboard-friendly: sliders work for pointer; arrow keys + tab work for keyboard; screen reader announces "Cost: 4 of 9 points." Per CC-022a's accessibility patterns.

## Cross-card patterns the 3C's unlocks

Initial catalog candidates (would join the existing `cross-card-patterns.md` registry on CC-026 ship):

1. **Cost-dominant + Low Coverage** — wealth-pursuit at the expense of time for the people the user named as sacred.
   - Detection: `cost_priority` ≥ 6 AND `coverage_priority` ≤ 2.
   - Prose: *"The resources flow toward acquisition while the people {nameOrYour} named as central wait."*
2. **High Compliance + Low Coverage** — risk-aversion + little time for mission.
   - Detection: `compliance_priority` ≥ 5 AND `coverage_priority` ≤ 2.
   - Prose: *"Life organized around what won't go wrong rather than what's worth giving time to."*
3. **High Coverage + Low Cost** — caregiver / teacher / mission-driven.
   - Detection: `coverage_priority` ≥ 6 AND `cost_priority` ≤ 2.
   - Prose: *"Resources flow toward people and meaning; wealth-accumulation is structurally not the metric."*
4. **Balanced (3,3,3) or (4,3,2)** — no extreme.
   - Detection: max(cost, compliance, coverage) ≤ 4.
   - Prose: *"The three axes are held in tension; no single axis dominates."*
5. **Coverage = 0** — pattern that shows up rarely but loudly.
   - Detection: `coverage_priority` === 0.
   - Prose: *"The people-and-mission axis is at zero. The model surfaces this as observation, not verdict — consider whether this is season, exhaustion, ambition, or shape."*

Plus cross-card patterns combining 3C's with other cards:

6. **Q-Stakes1 ranks Money high + Q-3C1 has low Cost** — fears losing wealth more than they pursue it.
   - Detection: `money_stakes_priority` rank 1 AND `cost_priority` ≤ 2.
   - Prose: *"{NameOrYour, true} fears losing wealth more than {nameOrYour} pursue it. That gap is informative — anxiety about scarcity without active accumulation behavior is its own pattern."*
7. **High Compliance + Faith-protective Compass** — risk-averse with strong sacred-value protection.
   - Detection: `compliance_priority` ≥ 5 AND `faith_priority` rank 1.
   - Prose: *"{NameOrYour, true} faith and {nameOrYour} risk-aversion reinforce each other — sacred conviction held with structural caution."*
8. **High Coverage + Family in top sacred** — "named what matters and lives it."
   - Detection: `coverage_priority` ≥ 6 AND `family_priority` rank ≤ 2.
   - Prose: *"{NameOrYour, true} stated values and {nameOrYour} actual time-allocation align around family — a coherence read; rare and worth naming."*

These would join CC-022b's existing 12-pattern catalog when CC-026 ships.

## Implementation surface (CC-026)

- `data/questions.ts` — add Q-3C1 to the Path card's question set.
- `lib/types.ts` — add `ForcedAllocationQuestion` and `ForcedAllocationAnswer` types; extend `Question` and `Answer` unions; add 3 new signal IDs (`cost_priority`, `compliance_priority`, `coverage_priority`).
- `lib/identityEngine.ts` — `signalsFromForcedAllocation` extraction function; dispatch in `deriveSignals`; add 6+ new cross-card patterns to `CROSS_CARD_PATTERNS` registry.
- `app/components/ForcedAllocation.tsx` — NEW component with sliders, running total, accessible interaction.
- `app/page.tsx` — render branch for `forced_allocation` question type; canContinue logic gates on `sum === 9`.
- `app/components/QuestionShell.tsx` — possibly accommodate the new render branch (likely no changes needed if the standard primary-action pattern works).
- `docs/canon/question-bank-v1.md` — Q-3C1 entry.
- `docs/canon/signal-library.md` — 3 new signals.
- `docs/canon/cross-card-patterns.md` — append the new patterns.
- `docs/canon/shape-framework.md` — Path card framing extension (Path now has both narrative output AND measurement input).

Position in test flow: Q-3C1 lives within the Path · Gait card. Path · Gait sits late in the flow today (one of the last cards before second-pass and Keystone). Q-3C1 fits naturally near the start of Path's questions — before the user reaches the synthesis surface that Path's narrative produces.

Suggested position: after Q-A2 (Agency / aspirational energy) and before any other Path-card questions. The Agency card already measures direction-of-energy; Q-3C1 measures resource-allocation across the three meta-categories. Together they form a richer measurement of life-orientation.

Or position Q-3C1 even earlier — alongside Q-X1, Q-X2 (current life context). The 3C's is fundamentally about current life-allocation, which is context-card territory. But putting it on Path is more architecturally coherent given Path's gait metaphor.

## Sequencing

CC-026 lands AFTER:

1. **CC-024** (Keystone Block Restructure with Q-Stakes1) ships and is verified.
2. **Real-user soak window** — 3-5 sessions through CC-024's Compass-Stakes addition. Confirms the architectural pattern is felt-correct before expanding to Path.

If real-user testing of Q-Stakes1 surfaces *"this is too much measurement on Compass"* feedback, that's a signal to compress some Compass surfaces before adding more elsewhere. If the Q-Stakes1 feels right, CC-026 fires next.

Probable timeline: CC-026 drafts ~2-3 sessions of CC-024 testing after CC-024 lands. Possibly CC-026 lands before the Engine Prose Tuning Round 2 (CC-025) since the new measurement produces signals that Round 2's prose work would benefit from.

## What this does to the body-map measurement balance

Pre-CC-024:
- Lens: heavy (Q-T1-T8)
- Compass: medium-heavy (Q-S1, Q-S2, Q-S3 family)
- Conviction: medium (Q-C1-C4, Q-I block)
- Trust: medium (Q-X3, Q-X4)
- Gravity: light-medium (Q-C4 partial overlap)
- Weather: light (Q-X1, Q-X2, Q-F1, Q-F2)
- Fire: light (derived from Q-P)
- Path: zero direct measurement

Post-CC-024:
- Compass: heavy (sacred values + allocation + stakes)
- Path: still zero direct measurement

Post-CC-026:
- Compass: heavy
- Path: medium (Q-3C1 forced allocation)

The architecture rebalances. No single card grows past Lens; Path catches up. Future enrichment work targets the still-light cards (Weather, Fire) where appropriate.

## Standing design rule (per Jason 2026-04-26)

**The relationship between responses is more important than the responses themselves.**

Every new measurement-adding CC must include a *"relationships unlocked"* section as a first-class deliverable. Adding a measurement without a corresponding cross-card pattern catalog growth is incomplete work. The architecture is the relationships; measurements are inputs to those relationships.

This applies to:
- Q-Stakes1 (CC-024) — must add cross-card patterns combining stakes with sacred values, allocation, trust, conviction.
- Q-3C1 (CC-026) — already drafted with 8 candidate cross-card patterns above.
- Any future Q-X / Q-T / Q-F enrichments.
- Any new question type (e.g., the proposed `forced_allocation` primitive in CC-026).

When drafting future CCs, the cross-card pattern catalog grows alongside the measurement, not lags behind it.

---

## Architectural stance (refined 2026-04-26 per Jason / extended brief)

**Path owns the measurement. The body map owns the meaning.**

The 3C's signal lives on Path · Gait (Q-3C1 is asked there), but the *interpretation* echoes across all 7 enrichable cards (Heart, Fire, Voice, Weather, Gravity, Trust, plus Path itself). The cross-card patterns aren't a consequence of the placement — they're the *purpose* of the placement.

This makes Q-3C1 a **global interpretive primitive**, not a Path-only measurement. The output `(cost_priority, compliance_priority, coverage_priority)` flows into:

- Heart's read of named-vs-lived value alignment.
- Fire's read of which cost-type triggers folding.
- Voice's read of which silencing-pressure dominates.
- Weather's read of which load-type is currently overwhelming.
- Gravity's read of which failure-type the user attributes first.
- Trust's read of who is trusted by domain.

## Canonical lines (candidates for `result-writing-canon.md`)

Two lines from the extended brief deserve canon protection:

**The body-map compression** — names the structural purpose of each card in one parallel-grammar line:

> *"Heart names the sacred. Path shows the spending. Fire shows the cost. Voice shows what gets said. Weather shows what is overloaded."*

(Add Gravity and Trust if a 7-clause version is wanted, but the 5-clause form lands more cleanly.)

**The product principle** — the standing design rule in compressed form:

> *"Every new measurement earns its place by the relationships it unlocks."*

**Target prose example** — the Weather-3C's compression that names the prose ceiling for cross-card pattern output:

> *"You are not merely tired. You are over-distributed."*

That's the kind of two-sentence reframe — generic register (tired) into specific structural read (over-distributed) — that the engine should be able to produce when 3C's load-pattern + Weather-card-load combine.

## Per-card integration sketches (from the extended brief)

When CC-026 drafts, each card's prose generator extends to consume the 3C's allocation. Quick-reference for each card:

### Path · Gait — Primary home

The card's central prose registers shift based on dominant axis:

- **Cost-led**: *"Your gait appears Cost-led. You may experience responsibility through provision, protection, and material stability. In health, this creates security and options. Under pressure, it can become acquisition without presence — the belief that if the resources are handled, the relationship has been covered."*
- **Coverage-led**: *"Your gait appears Coverage-led. You may experience responsibility through care, time, mission, and presence. In health, this creates belonging and human repair. Under pressure, it can become compassion without boundaries — the belief that because someone needs you, you must spend yourself."*
- **Compliance-led**: *"Your gait appears Compliance-led. You may experience responsibility through duty, risk management, rules, boundaries, and consequence awareness. In health, this creates integrity and stability. Under pressure, it can become safety without life — the belief that if nothing goes wrong, something meaningful has happened."*
- **Balanced**: *"Your gait appears balanced across Cost, Coverage, and Compliance. That may reflect mature integration: provision, presence, and prudence held together. But balance can also hide conflict. The sharper question is which axis you protect first when the week becomes expensive."*

### Heart · Compass — Alignment between named values and lived allocation

Use the 3C's result to interpret named-vs-lived gaps:

- *"You named Family as sacred, but your allocation is Cost-heavy and Coverage-light. That may mean you protect family through provision more than presence. This may be noble. It may also be a place where loved ones experience a gap."*
- *"You named Freedom as sacred, but your allocation is Compliance-heavy. You may admire freedom while organizing life around risk control."*

### Fire · Immune Response — Which cost-type triggers folding

The 3C's specifies the pressure-type:

- **Cost-sensitive Fire**: *"I'll speak, but not if it threatens income."*
- **Coverage-sensitive Fire**: *"I'll speak, but not if it threatens belonging."*
- **Compliance-sensitive Fire**: *"I'll speak, but not if it violates the rule, role, or duty."*

### Voice · Conviction — Which silencing-pressure dominates

- **Cost silencing**: *"I believe this, but I cannot afford to say it."*
- **Coverage silencing**: *"I believe this, but I do not want to lose closeness."*
- **Compliance silencing**: *"I believe this, but saying it would break the rule, role, or identity contract."*

### Weather · Nervous System — Which load is currently overwhelming

- **Cost load**: money, provision, debt, insecurity.
- **Coverage load**: caregiving, emotional labor, relational demand.
- **Compliance load**: risk, obligation, rule pressure, reputation, legal/moral exposure.

The reframing line: *"You are not merely tired. You are over-distributed."*

### Gravity · Spine — Which failure-type is attributed first

Two users can both blame "the individual" but mean structurally different things:

- **Cost failure**: *"They wasted the money."*
- **Coverage failure**: *"They failed to show up."*
- **Compliance failure**: *"They broke the rule."*

The Gravity card's prose extends to differentiate which failure-frame the user reaches for.

### Trust · Ears — Who is trusted by domain

| Domain | Possible trusted source |
|---|---|
| Cost | spouse, advisor, employer, self, parent |
| Coverage | spouse, close friend, therapist, pastor |
| Compliance | lawyer, institution, religious authority, government, self |

Trust extends from "who do you trust" to "who do you trust *for what kind of truth*."

## Extended cross-card pattern catalog (from the brief)

Replacing the 8 candidate patterns with the brief's richer 8 patterns + Lens × 3C's combinations:

### 8 axis-pattern reads

1. **High Cost / Low Coverage** — *Provision without presence*
2. **High Coverage / Low Cost** — *Care without capital*
3. **High Compliance / Low Coverage** — *Safety without intimacy*
4. **High Coverage / Low Compliance** — *Compassion without boundaries*
5. **High Cost / Low Compliance** — *Ambition without guardrails*
6. **High Compliance / Low Cost** — *Duty without provision*
7. **Balanced (3,3,3 or 4,3,2)** — *Held tension*
8. **Coverage = 0** — *No one is being covered*

Each renders as a small templated paragraph in Path's prose with full report-language per the brief.

### Lens × 3C's — disambiguating the same Lens function

Same Lens function, very different person:

- **Ne + Coverage** — *"You generate options so people have a way through."*
- **Ne + Cost** — *"You generate options so no door becomes the only door."*
- **Ne + Compliance** — *"You generate options because something might go wrong."*

Same disambiguation pattern available for Ni / Si / Se / Ti / Te / Fi / Fe each crossed with the 3 axes — produces 24 combinations of cognitive-function × resource-orientation. Don't author all 24 at first ship; author 8 (one per dominant function) for the most-frequent function-axis combinations and let real-user testing surface which others to add.

### Conviction × 3C's — what kind of cost silences belief

- *"You may hold conviction internally, but become strategic when income or opportunity is threatened."* (Cost-sensitive)
- *"You may hold conviction internally, but soften it when closeness or belonging is at risk."* (Coverage-sensitive)
- *"You may hold conviction internally, but hesitate when saying it would violate role, rule, or duty."* (Compliance-sensitive)

### Sacred Value × 3C's

- **Family high + Coverage low** — *"You name Family as sacred, but your allocation suggests the family may be protected more by provision or duty than by presence."*
- **Freedom high + Compliance high** — *"You name Freedom as sacred, but your life appears strongly organized around risk management. This may be wisdom. It may also mean freedom is admired more than practiced."*
- **Truth high + Coverage high** — *"You value truth, but your high Coverage pattern may cause truth to soften when belonging feels threatened."*

### Weather load × 3C's

- *"Your stress may not be general. It may be relational overextension."* (Moderate load + high Coverage)
- *"Your stress may be less about busyness than provision pressure."* (Moderate load + high Cost)
- *"Your stress may come from consequence management — the sense that one wrong move carries too much weight."* (Moderate load + high Compliance)

## Acceptance Criteria draft (per the brief — ready to lift into CC-026)

```
CC-026 — Path 3C Allocation

Goal:
Add a forced-allocation 3C measurement to Path · Gait so the model can measure
how users allocate finite resources across Cost, Coverage, and Compliance.

Acceptance Criteria:
1. Add Q-3C1 to Path · Gait.
2. Q-3C1 requires allocation of exactly 9 points across Cost, Coverage, Compliance.
3. UI prevents submission unless total = 9.
4. Store raw numeric values for Cost, Coverage, Compliance.
5. Derive dominant-axis (cost_led / coverage_led / compliance_led / balanced) and
   low-axis flags (low_cost / low_coverage / low_compliance).
6. Add Path prose variants for Cost-led, Coverage-led, Compliance-led, balanced.
7. Add at least 5 cross-card pattern hooks:
   - Sacred value vs 3C allocation
   - Stakes vs 3C allocation
   - Lens vs 3C allocation
   - Conviction vs 3C allocation
   - Weather/load vs 3C allocation
8. Add report-language guardrail: 3C output must be framed as allocation pattern,
   not moral judgment.
9. Add "relationships unlocked" section to the CC spec.
10. Do not alter Compass question structure in this pass.
```

## Out of scope for v1 of the 3C's CC

- Full 3C subtest (multiple 3C questions across different domains).
- Heavy scoring theory (factor analysis, percentile bands).
- Moralized language (no "you should be more X").
- Financial / relationship advice outputs.

Keep it small and sharp. The 3C's measurement value is in the cross-card patterns, not in measurement-volume.

---

## Open architectural questions for CC-026 draft

1. **Position in test flow** — within Path's questions, OR earlier (alongside Q-X1/X2 context)? Probable: within Path.
2. **UI primitive** — three sliders, three +/- counters, or three drop-target areas? Probable: sliders for the main interaction, +/- for fine tuning.
3. **Accessibility** — how does keyboard interaction work? Tab between sliders, arrow keys to adjust, live announce of running total. Per CC-022a patterns.
4. **Validation** — Continue gates on `sum === 9`. What if the user gets stuck at 8 or 10? Provide a clear hint ("you need 1 more point" / "too many — reduce by 1").
5. **Signal strength mapping** — do we use cardinal strength (0-9 → low/medium/high/dominant) or just the raw allocation value? Probable: emit signals at strength from the raw value, but also store the raw value on each signal for cross-card patterns.
6. **Cross-card patterns** — author the initial 5-8 patterns described above; add to `cross-card-patterns.md`.
