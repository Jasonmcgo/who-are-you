# CC-011 — Output Engine Derivation (Per-Card SWOT + Cross-Card Synthesis + Tension Rank-Awareness)

## Goal

Turn the running app's 73 raw signals into the structured Inner Constitution data that `inner-constitution.md` specifies — per-card Gift / Blind Spot / Growth Edge / Risk Under Pressure for the six full-SWOT cards (Lens, Compass, Gravity, Trust, Weather, Fire), the leaner Conviction output (Gift + Blind Spot + Posture sentence), the Path directional paragraph, and the cross-card synthesis (Top 3 Gifts, Top 3 Risks, Growth Path, Relationship Translation, Conflict Translation, Mirror-Types Seed). Plus: fix T-005 / T-007 / T-008 detection rules so they correctly require rank ≤ 2 thresholds on their consumed signals (currently they misfire for users whose Compass values are not actually in the top 2). After CC-011, `buildInnerConstitution` returns a structured object containing every output that `inner-constitution.md` specifies for v1, and tension surfacing matches the canonical rank-aware contract.

This CC is **engine and minimal canon**. No UI changes. The result page in `app/page.tsx` continues to render whatever fields it currently renders; the new fields land in the `InnerConstitution` type but are not yet displayed. CC-012 (Inner Constitution renderer) is the follow-up that displays them.

The user's actual session showed the v1 thinness clearly: 73 signals fired correctly, but the output page surfaces only `core_orientation`, raw `signals`, raw `tensions`, and a flat `sacred_values` list. There is no Lens stack derived, no per-card SWOT, no Top Gifts, no Mirror-Types Seed. CC-011 closes that gap on the engine side. The same session also surfaced T-007 firing against a user whose Family ranked #4 in Q-S2 (last) — a misfire because T-007's detection rule does not yet check rank. CC-011 corrects the three rank-unaware tension rules (T-005, T-007, T-008) at the same time so that CC-012's polished renderer doesn't display the misfires more visibly than v1's bare shell currently does.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

This is the largest engine CC since CC-001. It touches `lib/types.ts` substantially (new sub-types) and `lib/identityEngine.ts` substantially (new aggregation + derivation functions). Per-edit approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff`, `awk`, `sed`, `head`, `tail`, `wc`.

The agent should not pause to ask permission for these.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input.

If something is genuinely ambiguous, apply the most canon-faithful interpretation and flag the decision in Risks / next-step recommendations. Do not halt.

If a prerequisite appears missing, attempt the canon-faithful equivalent, record the discrepancy, and continue.

---

## Read First (Required)

**Canon (read in full first; do NOT edit any canon file):**

- `docs/canon/output-engine-rules.md` — the six derivation rules verbatim (Gift = Lens + Path; Blind Spot = Gift overused under Weather; Conviction Posture = Compass × Fire; Conflict Style = Compass + Fire + Lens; Growth Edge = Blind Spot balanced by missing value/process; Risk Under Pressure = Gift × Fire × Weather load). The 12 gift vocabulary categories. The Gift-to-Blind-Spot pairing table. Signal-to-category mappings.
- `docs/canon/inner-constitution.md` — per-card SWOT spec (lines 82–100), per-card format specs for each of the eight cards (lines 104–168), Top Gifts / Top Risks / Growth Path / Relationship Translation / Conflict Translation / Mirror-Types Seed sections (lines 172–253). **Use the example prose blocks in this file as the voice register for templated sentence generation.** The product voice is set there: "appears to," "may suggest," "tends to," "leans toward," "in the moments when," "you may notice yourself."
- `docs/canon/shape-framework.md` — the eight cards and what each answers. § Five Dangers to Avoid is binding on every generated sentence (don't claim Jungian validation; don't equate stress with revelation; don't moralize trust/values; don't drift into clinical implication; don't treat all eight cards as the same kind of measurement).
- `docs/canon/temperament-framework.md` — § 4 Canonical Stack Table for MBTI 4-letter inference from dominant + auxiliary functions. § 3 cognitive-function descriptions for Gift / Blind Spot / Growth Edge / Risk language on the Lens card.
- `docs/canon/signal-mapping-rule.md` — rank-to-strength rules.
- `docs/canon/signal-and-tension-model.md` — rank-aware signal contract.
- `docs/canon/signal-library.md` — the 73 signals and what each represents.
- `docs/canon/research-mapping-v1.md` — the academic grounding per card. Useful for keeping output language honest.
- `docs/canon/tension-library-v1.md` — T-005, T-007, T-008 entries. These three will be edited in this CC to add rank ≤ 2 thresholds to their `Signals:` blocks. Read them carefully before editing. T-009 stays as-is (canon-blocked per CC-009; rewrite is a separate future CC).

**Existing code (read; will be edited):**

- `lib/types.ts` — `InnerConstitution` type currently has five fields (`core_orientation`, `signals`, `tensions`, `sacred_values`, `bridge_signals`). Will be extended substantially.
- `lib/identityEngine.ts` — `buildInnerConstitution` currently returns the five-field placeholder. Will be extended with new aggregation and derivation functions; existing functions (`signalFromAnswer`, `signalsFromRankingAnswer`, `extractFreeformSignals`, `deriveSignals`, `detectTensions`, `applyStrengtheners`, `deriveCoreOrientation`, `deriveSacredValues`) are unchanged.

**Existing code (do NOT edit):**

- `app/page.tsx` — result page rendering stays as-is in CC-011. CC-012 will rebuild it. **Critical:** CC-011 must not break the existing rendering. The new fields land in the `InnerConstitution` object; the existing fields stay populated as they are now.
- `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts`.
- Any `docs/canon/*.md` file.

---

## Context

The product's data plumbing is complete: 73 signals fire across 8 cards. The canon specifies a rich Inner Constitution output (per-card SWOT + cross-card synthesis), but the engine currently produces only a placeholder dump. CC-011 implements the missing layer.

The user's recent session illustrates exactly what's needed: their Lens signals showed `ni` ranked first in every Q-T1–T4 and `te` ranked first in every Q-T5–T8 — a textbook INTJ stack — but the output page didn't synthesize this. The signal data is correct; the derivation is missing.

CC-011 is the derivation. CC-012 is the renderer. T-005 / T-007 / T-008 rank-aware tension fixes are a small follow-up CC (CC-009b). Each is scoped narrowly. CC-011 stays focused on the engine.

---

## Canon-Faithful Interpretation Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Lens stack derivation

Each function (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) is ranked four times across Q-T1–Q-T8: each perceiving function (Ni, Ne, Si, Se) appears once in each of Q-T1–Q-T4; each judging function (Ti, Te, Fi, Fe) appears once in each of Q-T5–Q-T8.

For each function, **average its rank across its four appearances.** Lower average rank = more dominant.

- **Dominant perceiving function** = perceiving function with lowest average rank across Q-T1–Q-T4 (`ni`, `ne`, `si`, `se`).
- **Dominant judging function** = judging function with lowest average rank across Q-T5–Q-T8 (`ti`, `te`, `fi`, `fe`).

The full stack (dominant / auxiliary / tertiary / inferior) is determined by **lookup against `temperament-framework.md` § 4 Canonical Stack Table.** Match (dominant_perceiving, dominant_judging) to one of the 16 MBTI types; the table gives the full stack. Example: dominant Ni + dominant Te → INTJ stack (Ni-Te-Fi-Se).

The matched MBTI 4-letter code is recorded in the output as `mbtiCode` for **optional disclosure only** — per `inner-constitution.md` Output Rule #8 and Canonical Rule #5, MBTI codes are never headlines and may appear only behind a small affordance. CC-012 (renderer) will gate this; CC-011 just records it.

If no clean match exists (e.g., both perceiving functions tie for dominance), select the function with the lowest single-question rank as a tiebreaker; if still tied, pick alphabetically and flag as `lensStack.confidence: "low"`. Tie cases are likely uncommon but worth handling.

### D-2: Top-N priority extraction across cards

For each rank-aware signal family, compute the top-N items by rank ≤ 2:

- **Compass top values** = sacred-value signals with `rank ≤ 2` from Q-S1 + Q-S2. Up to 4 entries (2 from each question if all are at rank ≤ 2). Order by ascending rank, then alphabetically.
- **Gravity top attribution** = responsibility signals with `rank ≤ 2` from Q-C4. Up to 2 entries.
- **Trust institutional top** = institutional trust signals with `rank ≤ 2` from Q-X3. Up to 2 entries.
- **Trust personal top** = personal trust signals with `rank ≤ 2` from Q-X4. Up to 2 entries.

These top-N lists feed the per-card Gift sentences and the cross-card synthesis.

### D-3: Weather load assessment

Aggregate Weather signals into a single `load: "low" | "moderate" | "high"` value:

- `high_pressure_context` (Q-X1) → load = "high"
- `moderate_load` (Q-X1) → load = "moderate"
- `stability_present` (Q-X1) → load = "low"

Plus a responsibility intensifier from Q-X2:

- `high_responsibility` → intensifier = "high"
- `moderate_responsibility` → intensifier = "moderate"
- `low_responsibility` → intensifier = "low"

If both `load` and `intensifier` are "high", combined load is **"high+"** (used in Risk Under Pressure templates as "heavy current load"). Otherwise the load itself drives output language.

Formation context (Q-F1, Q-F2) feeds the Weather Card output but does not modify current-load classification.

### D-4: Fire pattern signature

Aggregate Fire signals into a `firePattern` shape with three booleans / counts:

- `willingToBearCost` — true if `high_conviction_under_risk` (Q-P2) OR `conviction_under_cost` (Q-I3 freeform).
- `adapts` — true if `adapts_under_social_pressure` (Q-P1) OR `adapts_under_economic_pressure` (Q-P2).
- `concealsUnderThreat` — true if `hides_belief` (Q-P1 or Q-P2).
- `holdsInternalConviction` — true if `holds_internal_conviction` (Q-P2) OR `moderate_social_expression` (Q-P1).

These boolean shapes feed the Fire SWOT and the Conviction Posture sentence. Multiple may be true simultaneously (a user can both adapt socially AND bear economic cost — different pressures).

### D-5: Twelve gift vocabulary categories

Per `output-engine-rules.md` § 12-vocabulary, the categories are: **Pattern, Precision, Stewardship, Action, Harmony, Integrity, Builder, Advocacy, Meaning, Endurance, Discernment, Generativity.**

Each category has a signal-pattern signature. Read `output-engine-rules.md` for the canonical mappings. As an authoritative summary (the canon prevails on conflict):

- **Pattern** — Ni or Ne dominant in Lens; reinforced by Knowledge in top Compass.
- **Precision** — Ti dominant; reinforced by Truth or Knowledge in top Compass.
- **Stewardship** — Si dominant; reinforced by Stability or Family in top Compass; reinforced by `high_responsibility` in Weather.
- **Action** — Se dominant; reinforced by Freedom in top Compass; reinforced by `proactive_creator` in Path.
- **Harmony** — Fe dominant; reinforced by Family or Faith in top Compass.
- **Integrity** — Fi dominant; reinforced by `truth_priority_high` (Voice) and any sacred value at rank 1.
- **Builder** — Te dominant; reinforced by `proactive_creator` and System or Authority in top Gravity.
- **Advocacy** — Ne dominant or Justice at rank 1 in Compass; reinforced by Individual + System in top Gravity.
- **Meaning** — Ni dominant + Faith in top Compass; reinforced by `freedom_priority` (Voice).
- **Endurance** — Si in stack + `high_responsibility` + Stability in top Compass.
- **Discernment** — `high_conviction_under_risk` + Truth in top Compass + Ti or Ni in stack.
- **Generativity** — Path signals (`relational_investment`, `stability_restoration`, `exploration_drive`) + Ne or Te in stack.

A user may match multiple categories. The per-card Gift assigns one primary category; cross-card Top Gifts can pick up to 3.

### D-6: Per-card SWOT cell generation — voice register

Use the example prose blocks in `inner-constitution.md` as the voice register. Specifically:

- Lines 78–82 (Shape Summary example)
- Lines 175–185 (Top Gifts example)
- Lines 196–202 (Top Risks example)
- Lines 209–214 (Growth Path example)
- Lines 224–227 (Relationship Translation example)
- Lines 236–238 (Conflict Translation example)
- Lines 248–252 (Mirror-Types Seed example)

Generated sentences use canonical hedging: "appears to," "may suggest," "tends to," "leans toward," "in the moments when," "you may notice yourself," "may." Avoid: "you are," "you always," "your type is," "all [type] people," "you cannot."

For each per-card cell, generate **2–3 sentences** of templated prose. Sentence templates may be authored as JavaScript template literals or as a small lookup table keyed by signal pattern. Either approach works — the prose is what matters.

### D-7: Conviction is leaner; Path is directional

Per `inner-constitution.md` lines 120–126: Conviction in v1 produces **Gift + Blind Spot + Conviction Posture sentence only** (no Growth Edge, no Risk Under Pressure cells in v1). Conviction Posture = Compass × Fire (Rule 3).

Per `inner-constitution.md` lines 162–168: Path in v1 produces a **directional paragraph** (4–8 sentences) drawn interpretively from Compass + Lens + Gravity + Agency signals. Not a four-cell SWOT in v1.

Type definitions and engine output reflect this asymmetry.

### D-8: Cross-card synthesis

After per-card SWOT cells are generated:

1. **Top Gifts (3).** Pick the three highest-strength gifts across cards. "Strength" combines the gift category's signal-pattern reinforcement count (more reinforcing signals = stronger gift) and the dominance of the underlying signal (rank 1 > rank 2 > rank 3+). Output as a list of three labeled paragraph entries (`label: string` + `paragraph: string`), label embedded in prose per `inner-constitution.md` Output Rule #6.
2. **Top Risks (3).** Three risks under current load × Fire pressure. Drawn from per-card Risk Under Pressure cells, ranked by current Weather load + Fire signature severity.
3. **Growth Path (paragraph).** 4–8 sentences. Input: top Compass + Lens stack + top Gravity + Path signals. Voice: directional, hopeful but honest, names what work / love / giving will likely feel meaningful for this Shape.
4. **Relationship Translation (paragraph).** 2–4 sentences. Input: dominant Lens + top Compass + Fire pattern. Names how others (especially with different dominant Lens or top Compass) may experience this Shape.
5. **Conflict Translation (paragraph).** 2–4 sentences. Input: dominant Lens + top Compass + Fire. Suggests how to engage across difference, particularly Lens / Compass differences.
6. **Mirror-Types Seed (paragraph).** 3–5 sentences. Input: top Compass value at rank 1 × dominant Lens function. Names how the user's top sacred value may show up differently in others (e.g., "your Truth-shape leans toward verified precedent — someone whose Truth-shape leans toward logical precision will sound nothing like you and still share your deepest commitment").

### D-9: Bridge Signals stays as-is

The current placeholder for `bridge_signals: string[]` (returning `[]`) stays the same in CC-011. The Mirror-Types Seed paragraph supersedes the old "Bridge Signals (Human Constants)" concept per `inner-constitution.md` line 252. CC-012 will hide / remove the Bridge Signals section in the renderer.

### D-10: Five Dangers compliance

Every generated sentence must respect `shape-framework.md` § Five Dangers to Avoid:

1. Don't claim Jungian functions are validated. Use *"your processing pattern leans toward Ni"* not *"you are confirmed INTJ."*
2. Don't treat all eight cards as the same kind of measurement. Core Portrait (Lens, Compass, Gravity, Trust) outputs may carry the most weight. Conviction is hedged. Weather and Fire are conditional. Path is directional.
3. Don't equate stress with revelation. Fire output uses *"under heavy load and high-stakes pressure, your shape may express as X"* — never *"this is who you really are."*
4. Don't moralize. Low institutional trust isn't automatically wisdom or pathology. Strong sacred values aren't automatically integrity or fanaticism.
5. Don't drift into clinical implication. Weather and Trust outputs especially must hedge confidence and avoid diagnostic language.

### D-11: Build the type system before the function bodies

Land all the new types in `lib/types.ts` first, then write the engine functions against the types. This catches misalignments early and keeps the prompt-back report quotable.

### D-12: Rank-aware tension rules for T-005, T-007, T-008

The three tensions whose detection rules are currently rank-unaware get fixed in this CC. Update both the canon (`docs/canon/tension-library-v1.md` Signals: blocks) and the code (`detectTensions` in `lib/identityEngine.ts`) so they match. T-009 stays as-is (canon-blocked); T-012 is already rank-aware from CC-007. Other tensions whose signals are not rank-aware (e.g., T-006 Creator vs Maintainer, which uses forced-choice signals from Q-A1 / Q-A2) are unchanged.

**T-005 Stability vs Freedom — new rule:**

```
Signals:
- stability_priority (rank ≤ 2)
- freedom_priority (rank ≤ 2)
```

Fires only when **both** stability_priority is at rank ≤ 2 (top 2 in Q-S1) AND freedom_priority is at rank ≤ 2 (top 2 in Q-S1). The `freedom_priority` signal also has a rank-less producer (Q-C3, forced) — for T-005, the rank ≤ 2 filter applies to the rank-aware producer (Q-S1) only; if `freedom_priority` is present without rank metadata, it does NOT satisfy this branch.

**T-007 Family vs Truth — new rule:**

```
Signals:
- family_priority (rank ≤ 2)
- truth_priority (rank ≤ 2) OR truth_priority_high
```

Fires only when family_priority is at rank ≤ 2 (top 2 in Q-S2) AND either (truth_priority is at rank ≤ 2 in Q-S1) OR (truth_priority_high is present from forced Q-C1, which has no rank). The `truth_priority_high` branch keeps the old detection working for users who picked the high-conviction option in Q-C1; the rank-aware branch picks up users with Truth as a top sacred value in Q-S1.

**T-008 Order vs Reinvention — new rule:**

```
Signals:
- stability_priority (rank ≤ 2)
- freedom_priority (rank ≤ 2) OR proactive_creator
```

Fires only when stability_priority is at rank ≤ 2 AND either (freedom_priority is at rank ≤ 2 in Q-S1) OR (proactive_creator is present from forced Q-A2). T-005 and T-008 are intentionally permitted to fire from the same signal pattern — they are different interpretive readings of the stability-freedom tension and both are honest to surface.

**Implementation note for `detectTensions`:**

In `lib/identityEngine.ts`, the existing T-005 / T-007 / T-008 detection blocks need a rank check helper. Reuse the existing pattern from T-012 (CC-007): filter the relevant `*_priority` signals to those with `rank !== undefined && rank <= 2`. For mixed branches (e.g., T-007's `truth_priority OR truth_priority_high`), the rank filter applies only to `truth_priority`; `truth_priority_high` is a forced-choice signal and counts as present without rank check.

**Why this matters:** the user's recent session ranked Family at #4 in Q-S2 (low strength signal). The current T-007 rule fires on signal presence regardless of rank, so it surfaced *"Family vs Truth"* as if the user had Family as a top sacred value when in fact they explicitly de-prioritized it. The corrected rule respects the canonical "compromising it feels like betraying yourself" definition of sacred — only top-2 sacred values trigger sacred-value tensions.

---

## Requirements

### 1. Extend `lib/types.ts` with Inner Constitution sub-types

Add these new types. Existing types unchanged.

```ts
export type CognitiveFunctionId = "ni" | "ne" | "si" | "se" | "ti" | "te" | "fi" | "fe";

export type LensStack = {
  dominant: CognitiveFunctionId;
  auxiliary: CognitiveFunctionId;
  tertiary: CognitiveFunctionId;
  inferior: CognitiveFunctionId;
  mbtiCode?: string;       // optional, disclosure-only
  confidence: "high" | "low";
};

export type GiftCategory =
  | "Pattern" | "Precision" | "Stewardship" | "Action"
  | "Harmony" | "Integrity" | "Builder" | "Advocacy"
  | "Meaning" | "Endurance" | "Discernment" | "Generativity";

export type SwotCell = {
  category?: GiftCategory;  // optional; cells often carry a category for renderer use
  text: string;             // 2-3 sentence templated prose
};

export type FullSwotOutput = {
  cardName: string;       // user-facing label, e.g. "Lens", "Compass"
  bodyPart: string;       // "Eyes", "Heart", etc.
  cardHeader: string;     // one-sentence card header for renderer
  gift: SwotCell;
  blindSpot: SwotCell;
  growthEdge: SwotCell;
  riskUnderPressure: SwotCell;
};

export type ConvictionOutput = {
  cardName: "Conviction";
  bodyPart: "Voice";
  cardHeader: string;
  gift: SwotCell;
  blindSpot: SwotCell;
  posture: string;        // Conviction Posture sentence (Compass × Fire)
};

export type PathOutput = {
  cardName: "Path";
  bodyPart: "Gait";
  directionalParagraph: string;  // 4-8 sentences interpretive
};

export type ShapeOutputs = {
  lens: FullSwotOutput;
  compass: FullSwotOutput;
  conviction: ConvictionOutput;
  gravity: FullSwotOutput;
  trust: FullSwotOutput;
  weather: FullSwotOutput;
  fire: FullSwotOutput;
  path: PathOutput;
};

export type TopGiftEntry = {
  label: string;          // short label, e.g. "A pattern-discernment gift."
  paragraph: string;      // 1-3 sentences
};

export type TopRiskEntry = {
  label: string;
  paragraph: string;
};

export type CrossCardSynthesis = {
  topGifts: TopGiftEntry[];        // exactly 3 in v1
  topRisks: TopRiskEntry[];         // exactly 3 in v1
  growthPath: string;               // single paragraph, 4-8 sentences
  relationshipTranslation: string;  // 2-4 sentences
  conflictTranslation: string;      // 2-4 sentences
  mirrorTypesSeed: string;          // 3-5 sentences
};
```

Then **extend** `InnerConstitution`:

```ts
export type InnerConstitution = {
  core_orientation: string;
  signals: Signal[];
  tensions: Tension[];
  sacred_values: string[];
  bridge_signals: string[];
  // NEW IN CC-011:
  shape_summary: string;            // single-paragraph synthesis
  lens_stack: LensStack;
  shape_outputs: ShapeOutputs;
  cross_card: CrossCardSynthesis;
};
```

Existing five fields preserved verbatim.

### 2. Build aggregation helpers in `lib/identityEngine.ts`

Add these helper functions (or equivalents). Each takes the Signal array and returns a structured input for the derivation rules.

- `aggregateLensStack(signals: Signal[]): LensStack` — implements § D-1.
- `getTopCompassValues(signals: Signal[], n?: number): SignalRef[]` — implements § D-2 for Compass.
- `getTopGravityAttribution(signals: Signal[]): SignalRef[]` — implements § D-2 for Gravity.
- `getTopTrustInstitutional(signals: Signal[]): SignalRef[]` — implements § D-2 for Q-X3.
- `getTopTrustPersonal(signals: Signal[]): SignalRef[]` — implements § D-2 for Q-X4.
- `assessWeatherLoad(signals: Signal[]): { load: "low" | "moderate" | "high" | "high+"; intensifier: "low" | "moderate" | "high" }` — implements § D-3.
- `inferFirePattern(signals: Signal[]): FirePattern` — implements § D-4.

`SignalRef` is a small helper type if useful (e.g., `{ signal_id: SignalId; rank?: number; strength: SignalStrength }`).

### 3. Build per-card derivation functions in `lib/identityEngine.ts`

One function per card. Each takes the aggregated inputs and returns the appropriate output type.

- `deriveLensOutput(stack, weather, fire, path): FullSwotOutput`
- `deriveCompassOutput(topCompass, lens, weather, fire): FullSwotOutput`
- `deriveConvictionOutput(topCompass, fire, lens): ConvictionOutput`
- `deriveGravityOutput(topGravity, lens, weather): FullSwotOutput`
- `deriveTrustOutput(topInstitutional, topPersonal, lens, weather): FullSwotOutput`
- `deriveWeatherOutput(weatherLoad, formation, lens, fire): FullSwotOutput`
- `deriveFireOutput(firePattern, topCompass, weather, lens): FullSwotOutput`
- `derivePathOutput(topCompass, lens, topGravity, agency, weather): PathOutput`

Each function applies the relevant derivation rule(s) per § D-5 / § D-6 / § D-7 and produces templated prose. Sentence generation lives inline (template strings) — no external library.

### 4. Build cross-card synthesis functions in `lib/identityEngine.ts`

- `synthesizeTopGifts(shapeOutputs, signals): TopGiftEntry[]` — picks 3 strongest gifts across cards.
- `synthesizeTopRisks(shapeOutputs, weatherLoad, firePattern): TopRiskEntry[]` — picks 3 most pressing risks under current state.
- `generateGrowthPath(topCompass, lens, topGravity, agencySignals, path): string` — directional paragraph.
- `generateRelationshipTranslation(lens, topCompass, fire): string` — paragraph.
- `generateConflictTranslation(lens, topCompass, fire): string` — paragraph.
- `generateMirrorTypesSeed(topCompass, lens): string` — paragraph rooted in user's top Compass × dominant Lens.
- `generateShapeSummary(stack, topCompass, topGravity, weather, path): string` — single-paragraph synthesis (3-5 sentences) used as the Inner Constitution opener.

All output sentences must respect § D-10 Five Dangers compliance.

### 5. Update `buildInnerConstitution` in `lib/identityEngine.ts`

The function returns the extended `InnerConstitution`. Pseudocode shape:

```ts
export function buildInnerConstitution(answers: Answer[]): InnerConstitution {
  const signals = deriveSignals(answers);
  let tensions = detectTensions(signals);
  tensions = applyStrengtheners(tensions, signals);

  // CC-011 additions:
  const stack = aggregateLensStack(signals);
  const topCompass = getTopCompassValues(signals);
  const topGravity = getTopGravityAttribution(signals);
  const topInst = getTopTrustInstitutional(signals);
  const topPersonal = getTopTrustPersonal(signals);
  const weather = assessWeatherLoad(signals);
  const fire = inferFirePattern(signals);

  const shape_outputs: ShapeOutputs = {
    lens: deriveLensOutput(stack, weather, fire, /* path inputs */),
    compass: deriveCompassOutput(topCompass, stack, weather, fire),
    conviction: deriveConvictionOutput(topCompass, fire, stack),
    gravity: deriveGravityOutput(topGravity, stack, weather),
    trust: deriveTrustOutput(topInst, topPersonal, stack, weather),
    weather: deriveWeatherOutput(weather, /* formation */, stack, fire),
    fire: deriveFireOutput(fire, topCompass, weather, stack),
    path: derivePathOutput(topCompass, stack, topGravity, /* agency */, weather),
  };

  const cross_card: CrossCardSynthesis = {
    topGifts: synthesizeTopGifts(shape_outputs, signals),
    topRisks: synthesizeTopRisks(shape_outputs, weather, fire),
    growthPath: generateGrowthPath(topCompass, stack, topGravity, /* agency */, /* path */),
    relationshipTranslation: generateRelationshipTranslation(stack, topCompass, fire),
    conflictTranslation: generateConflictTranslation(stack, topCompass, fire),
    mirrorTypesSeed: generateMirrorTypesSeed(topCompass, stack),
  };

  const shape_summary = generateShapeSummary(stack, topCompass, topGravity, weather, /* path */);

  return {
    core_orientation: deriveCoreOrientation(signals),
    signals,
    tensions,
    sacred_values: deriveSacredValues(answers),
    bridge_signals: [],
    shape_summary,
    lens_stack: stack,
    shape_outputs,
    cross_card,
  };
}
```

The five existing fields are populated exactly as before. The four new fields are added.

### 6. Canon: update T-005, T-007, T-008 Signals: blocks in `docs/canon/tension-library-v1.md`

Per § D-12, edit each of the three tension entries' `Signals:` blocks to include `(rank ≤ 2)` thresholds where applicable. Quote the new entries verbatim in report-back.

The rest of each tension entry (description, user_prompt, etc.) stays unchanged. Do not modify any tension other than T-005, T-007, T-008. T-009 is canon-blocked and stays as-is. T-001, T-002, T-003, T-004, T-006, T-010, T-011, T-012 stay as currently authored.

### 7. Code: update `detectTensions` in `lib/identityEngine.ts` for T-005, T-007, T-008 rank checks

Per § D-12, the three existing detection blocks for T-005, T-007, T-008 in `detectTensions` need to filter their consumed rank-aware signals on `rank !== undefined && rank <= 2`. Reuse the existing pattern from T-012 (CC-007) for consistency.

Mixed branches (e.g., T-007's `truth_priority OR truth_priority_high`) apply the rank filter only to the rank-aware signal. The forced-choice branch (`truth_priority_high`, `proactive_creator`) counts as present without rank check.

Do not modify the detection blocks for any other tension (T-001 through T-004, T-006, T-010, T-011, T-012). T-012 is already rank-aware from CC-007 and stays as-is. T-009 detection is not in code (canon-only) and stays absent.

### 8. Type-check, lint, and verify

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.
- The existing result page in `app/page.tsx` continues to render. The new fields are present in the returned object but the renderer doesn't display them (CC-012 will).
- Light browser smoke at `localhost:3003`: complete a full session, confirm no runtime errors, confirm the existing result page (Core Orientation, Signals Detected, Possible Tensions, Sacred Values, Bridge Signals) still renders. Optionally inspect the new fields via `console.log(constitution)` in the result page.
- Tension regression test: simulate (or rerun) a session where Family ranks #4 in Q-S2 and verify T-007 does NOT fire. Simulate a session where stability_priority and freedom_priority both rank #1 / #2 in Q-S1 and verify T-005 and T-008 both fire. Document outcomes in report-back.

---

## Allowed to Modify

**Canon (narrow set — three tension entries only):**

- `docs/canon/tension-library-v1.md` — update the `Signals:` blocks for T-005, T-007, T-008 only per § 6 / § D-12. No other tension entry modified. No other field of the three modified entries (description, user_prompt, etc.) modified.

**Code:**

- `lib/types.ts` — add the new sub-types and extend `InnerConstitution` per § 1. Preserve all existing types verbatim.
- `lib/identityEngine.ts` — add new aggregation, derivation, and synthesis functions per §§ 2–4. Update `buildInnerConstitution` per § 5. Update the T-005, T-007, T-008 detection blocks in `detectTensions` per § 7. Preserve all other existing functions and constants verbatim (`signalFromAnswer`, `signalsFromRankingAnswer`, `extractFreeformSignals`, `deriveSignals`, `applyStrengtheners`, `deriveCoreOrientation`, `deriveSacredValues`, `toAnswer`, `toRankingAnswer`, `strengthForRank`, helpers like `has`, `hasFromQuestion`, `cardFor`, `ref`, all SIGNAL_DESCRIPTIONS, `SACRED_PRIORITY_SIGNAL_IDS`, `STRENGTHENERS`, the T-001 / T-002 / T-003 / T-004 / T-006 / T-010 / T-011 / T-012 detection blocks).

Do **NOT** modify:

- Any other `docs/canon/*.md` file. Specifically: `shape-framework.md`, `inner-constitution.md`, `output-engine-rules.md`, `signal-library.md`, `signal-mapping-rule.md`, `signal-and-tension-model.md`, `card-schema.md`, `temperament-framework.md`, `research-mapping-v1.md`, `validation-roadmap-v1.md`, `question-bank-v1.md`. Canon edits are limited to the three tension `Signals:` blocks listed above.
- `app/page.tsx`, `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx`, `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts`.
- The detection blocks for T-001, T-002, T-003, T-004, T-006, T-010, T-011, T-012 in `detectTensions`.
- Any signal definition (signal-library.md or SIGNAL_DESCRIPTIONS in identityEngine.ts).
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`, `postcss.config.mjs`.

---

## Out of Scope

This CC does not do any of the following. Each is a future-CC concern.

- **UI rendering of the new InnerConstitution fields.** CC-012 (Inner Constitution renderer) renders shape_summary, shape_outputs, cross_card, and lens_stack. CC-011 only makes them available.
- **T-009 rewrite.** Stays canon-blocked per CC-009. The deprecated `individual_responsibility` / `systemic_responsibility` / `balanced_responsibility` references are not migrated to the rank-aware successors in CC-011. Future CC.
- **Tension rule rewrites for tensions other than T-005 / T-007 / T-008.** T-001, T-002, T-003, T-004, T-006, T-010, T-011 stay as currently authored. T-012 stays as authored in CC-007 (already rank-aware). Only T-005 / T-007 / T-008 are corrected for rank-awareness in this CC.
- **Break interstitials** ("pause. take a breath." after Q-T3 / Q-T6). Future small CC.
- **Output-engine-rules.md edits.** Canon stays as-is. CC-011 implements the canonical rules; it does not refine them.
- **MBTI 4-letter disclosure UI.** `mbtiCode` is recorded in `LensStack` but not displayed. CC-012 builds the disclosure affordance.
- **Persistence / autosave / localStorage.** Out of scope.
- **New questions, signals, or tensions.** Out of scope.
- **Engine optimization.** Functional correctness is the bar; performance tuning is later.

---

## Acceptance Criteria

1. `lib/types.ts` declares all new types per § 1 (`CognitiveFunctionId`, `LensStack`, `GiftCategory`, `SwotCell`, `FullSwotOutput`, `ConvictionOutput`, `PathOutput`, `ShapeOutputs`, `TopGiftEntry`, `TopRiskEntry`, `CrossCardSynthesis`). `InnerConstitution` extended with `shape_summary`, `lens_stack`, `shape_outputs`, `cross_card`. All existing types and the five existing `InnerConstitution` fields preserved verbatim.
2. `lib/identityEngine.ts` contains the seven aggregation helpers per § 2.
3. `lib/identityEngine.ts` contains the eight per-card derivation functions per § 3 (one each for lens / compass / conviction / gravity / trust / weather / fire / path).
4. `lib/identityEngine.ts` contains the seven cross-card synthesis functions per § 4 (`synthesizeTopGifts`, `synthesizeTopRisks`, `generateGrowthPath`, `generateRelationshipTranslation`, `generateConflictTranslation`, `generateMirrorTypesSeed`, `generateShapeSummary`).
5. `buildInnerConstitution` returns the extended `InnerConstitution` with all four new fields populated.
6. The Lens stack derivation matches the canonical Stack Table for the 16 MBTI types. A user with `ni` averaging rank 1 across Q-T1–Q-T4 and `te` averaging rank 1 across Q-T5–Q-T8 produces `LensStack { dominant: "ni", auxiliary: "te", tertiary: "fi", inferior: "se", mbtiCode: "INTJ", confidence: "high" }`.
7. Per-card SWOT cells contain templated prose in the canonical voice ("appears to," "tends to," "may"), 2–3 sentences per cell. Conviction has Gift + Blind Spot + Posture only (no Growth Edge / Risk cells). Path has a directional paragraph (no SWOT cells).
8. Cross-card synthesis: `topGifts.length === 3`, `topRisks.length === 3`. `growthPath`, `relationshipTranslation`, `conflictTranslation`, `mirrorTypesSeed` are non-empty strings.
9. Mirror-Types Seed is rooted in the user's actual top Compass value × dominant Lens function — not a generic paragraph.
10. Five Dangers compliance: no generated sentence violates the five rules from `shape-framework.md`. Specifically: no "you are [MBTI type]" headline; no "this is who you really are under stress"; no moralizing on trust / values; no clinical implication on Weather or Trust output; the four card layers (Core Portrait / Belief Stance / Context Overlay / Developmental Direction) are honored in tone.
11. T-005 `Signals:` block in `tension-library-v1.md` reads `stability_priority (rank ≤ 2)` AND `freedom_priority (rank ≤ 2)`. T-007 `Signals:` reads `family_priority (rank ≤ 2)` AND (`truth_priority (rank ≤ 2)` OR `truth_priority_high`). T-008 `Signals:` reads `stability_priority (rank ≤ 2)` AND (`freedom_priority (rank ≤ 2)` OR `proactive_creator`). T-009 unchanged. T-001, T-002, T-003, T-004, T-006, T-010, T-011, T-012 unchanged.
12. The `detectTensions` blocks for T-005, T-007, T-008 in `lib/identityEngine.ts` apply the canonical rank ≤ 2 filter on rank-aware signals. The detection blocks for all other tensions in `detectTensions` are byte-identical to their pre-CC-011 state.
13. Regression check: a synthetic test session where Family ranks #4 in Q-S2 (low strength, rank 4) does NOT cause T-007 to fire. A synthetic session where Family ranks #1 in Q-S2 AND Truth ranks #1 in Q-S1 DOES cause T-007 to fire.
14. `npx tsc --noEmit` passes cleanly.
15. `npm run lint` passes cleanly.
16. `app/page.tsx` continues to render. The result page shows Core Orientation, Signals Detected, Possible Tensions, Sacred Values, Bridge Signals as before.
17. No file outside the Allowed to Modify list has been edited.
18. No canon file other than `tension-library-v1.md` (T-005, T-007, T-008 entries only) was modified.
19. No detection block other than T-005, T-007, T-008 was modified in `detectTensions`.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description.
2. **Type system additions** — quote the new sub-types verbatim from `lib/types.ts`. Confirm the five existing `InnerConstitution` fields are preserved and the four new fields are added.
3. **Aggregation helpers** — quote `aggregateLensStack` verbatim. Quote one of the top-N functions verbatim. Quote `assessWeatherLoad` and `inferFirePattern` verbatim.
4. **Per-card derivation — Lens example** — quote `deriveLensOutput` in full, including the templated prose strings used for Gift / Blind Spot / Growth Edge / Risk Under Pressure. This is the most important card; the agent's voice register choices for Lens drive the tone of every other card.
5. **Per-card derivation — other cards** — quote one full templated cell (Gift or Blind Spot) from each of compass / conviction / gravity / trust / weather / fire / path so the voice register is verifiable across cards.
6. **Cross-card synthesis** — quote `synthesizeTopGifts`, `generateGrowthPath`, and `generateMirrorTypesSeed` verbatim (these are the three most editorial of the seven).
7. **`buildInnerConstitution` updated** — quote the full updated function body. Confirm the five existing fields are populated identically to before and the four new fields are correctly assembled.
8. **Sample output** — pick a synthetic test case (e.g., "user with INTJ stack, top Compass [Truth, Knowledge], top Gravity [Individual, System], moderate Weather load, willing to bear cost in Fire") and quote what the resulting `InnerConstitution` looks like. JSON-style. This is the biggest verification artifact — it demonstrates that the engine produces reasonable output end-to-end.
9. **Five Dangers compliance check** — explicit confirmation that no generated sentence violates the five rules. Cite specific places where the agent intentionally hedged (e.g., "Fire output uses 'under heavy load and high-stakes pressure' rather than 'this is who you really are'").
10. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
11. **Tension rank-awareness updates** — quote the updated `Signals:` blocks for T-005, T-007, T-008 from `tension-library-v1.md` verbatim. Quote the updated detection blocks for T-005, T-007, T-008 from `detectTensions` verbatim. Confirm regression test outcomes: Family-#4 session does not fire T-007; Family-#1 + Truth-#1 session does fire T-007.
12. **Smoke-test results** — state whether `npm run dev` was run and the existing result page continued to render. Confirm new fields are present in the InnerConstitution object via console inspection or test output. If browser testing was deferred to the user, say so.
13. **Scope-creep check** — explicit confirmation that:
    - No canon file other than `tension-library-v1.md` (T-005, T-007, T-008 entries only) was modified.
    - No `app/` file was modified.
    - No `data/questions.ts` modification.
    - No tension detection rule other than T-005, T-007, T-008 was modified.
    - No signal definition was modified.
    - No new questions / signals / tensions were authored.
    - The existing five `InnerConstitution` fields are preserved verbatim.
    - All existing functions in `lib/identityEngine.ts` are preserved verbatim except `buildInnerConstitution` and the three updated detection blocks in `detectTensions`.
13. **Risks / next-step recommendations** — anything that surfaced during execution. Specifically:
    - The agent's experience with the templated-prose voice register: which cells were hardest to write in canon voice, and whether the inner-constitution.md examples were sufficient guidance.
    - Whether the 12-vocabulary gift category mappings in § D-5 felt complete, or whether some signal patterns didn't map cleanly to a category.
    - Whether the Lens stack derivation produced a clean MBTI lookup for representative test cases or whether tie-breaking was awkward.
    - Confidence in the Mirror-Types Seed paragraph being genuinely user-specific rather than generic — flag if the prose feels boilerplate.
    - Whether T-007 / T-005 / T-008 misfires would be exposed more visibly once CC-012 renders the polished Inner Constitution. (Yes, expected; CC-009b fixes this.)
    - Any other observation worth surfacing.
