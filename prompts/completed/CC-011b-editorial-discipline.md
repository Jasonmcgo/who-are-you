# CC-011b — Editorial Discipline (Per-Card Category Disambiguation, Phrase Variation, Watch For Section, Bug Fixes)

## Goal

Tighten the templated prose CC-011 produces so each Inner Constitution reads as authored rather than assembled. The engine's logic is correct — gifts, blind spots, derivation rules, cross-card synthesis all derive cleanly. But the prose currently has three failure modes that surfaced in real-user output:

1. **Same gift category fires across multiple cards.** Compass / Gravity / Trust all got *Discernment* in the smoke-test session, with near-identical prose three times. Each card should pick from a card-native preference set.
2. **Repeated sentence stems across cards.** Phrases like *"A discernment gift shows up here,"* *"The growth move is leaving room for honest difference and ordinary error,"* *"Under ordinary pressure,"* and *"This appears across multiple cards in your shape"* surface multiple times verbatim. Each prose template needs a small pool of stem variants selected deterministically per card.
3. **Specific bugs.** Mirror seed hardcodes *"protecting truth"* regardless of the user's actual top Compass value; Path paragraph contains a *"your your"* duplication and an awkward Lens-header injection; Top Risks labels are debug-style (*"Risk surfaced from Compass"*) rather than editorial like Top Gifts (*"A discernment gift"*).

Plus one new structural addition that Clarence's review surfaced: a **Watch For** section between Top Risks and Growth Path, rendering 4–6 concrete behavioral triggers in *"When X becomes Y"* format, derived from the user's per-card Risk Under Pressure cells.

After CC-011b, the same INTJ session that previously read as repetitive reads as a coherent document with each card showing a different angle on the user's shape.

This is **editorial discipline**, not new architecture. No new questions. No new signals. No new tensions. No structural change to the eight-card SWOT format. The card cell count stays at four for full-SWOT cards (Gift / Blind Spot / Growth Edge / Risk Under Pressure); the lean Conviction and directional Path stay as-is.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

This CC touches `lib/identityEngine.ts` substantially (per-card category logic, prose-variant pools, new Watch For generator), plus `lib/types.ts` (Watch For type), plus `app/components/InnerConstitutionPage.tsx` (new render slot), plus a small canon edit to `docs/canon/inner-constitution.md` (insert Watch For in the canonical section order). Per-edit approval prompts will defeat single-pass execution.

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

If something is genuinely ambiguous, apply the most spec-faithful interpretation and flag the decision in Risks / next-step recommendations. Do not halt.

If a prerequisite appears missing, attempt the canon-faithful equivalent, record the discrepancy, and continue.

---

## Read First (Required)

**Canon (read; do not edit except where listed in § Allowed to Modify):**

- `docs/canon/inner-constitution.md` — § Top-Level Structure (lines 51–62). CC-011b inserts a new step "Watch For" between Top Risks (step 4) and Growth Path (step 5). The full top-level structure becomes 11 sections instead of 10. § Output Rules and § Canonical Rules are binding — every new prose variant must respect them.
- `docs/canon/output-engine-rules.md` — § 12-vocabulary (Pattern, Precision, Stewardship, Action, Harmony, Integrity, Builder, Advocacy, Meaning, Endurance, Discernment, Generativity). § Gift-to-Blind-Spot pairing table. CC-011b adds **per-card category preference lists** consistent with this vocabulary; the canon's signal-pattern signatures stay authoritative.
- `docs/canon/shape-framework.md` — § Five Dangers to Avoid (lines 291–305). Every new prose variant must pass these.
- `docs/canon/temperament-framework.md` — § 4 Canonical Stack Table (already used by CC-011's `aggregateLensStack`). No changes.
- `docs/canon/signal-library.md`, `docs/canon/signal-mapping-rule.md`, `docs/canon/signal-and-tension-model.md`, `docs/canon/tension-library-v1.md`, `docs/canon/research-mapping-v1.md`, `docs/canon/validation-roadmap-v1.md` — reference only.

**Existing code (read; will be edited):**

- `lib/identityEngine.ts` — `aggregateLensStack`, `getTopCompassValues`, `getTopGravityAttribution`, `getTopTrustInstitutional`, `getTopTrustPersonal`, `assessWeatherLoad`, `inferFirePattern`, `inferFormationContext`, `inferAgencyPattern` stay unchanged. The eight per-card derivation functions (`deriveLensOutput`, `deriveCompassOutput`, `deriveConvictionOutput`, `deriveGravityOutput`, `deriveTrustOutput`, `deriveWeatherOutput`, `deriveFireOutput`, `derivePathOutput`) get internal updates: per-card category picker + prose-variant pool selection. The seven cross-card synthesis functions get updates: `synthesizeTopRisks` produces editorial labels; `generateWatchFor` is new; `generateMirrorTypesSeed` parameterizes the protected value; `generatePathDirectionalParagraph` (or whatever CC-011 named the Path generator inside `derivePathOutput`) fixes the "your your" duplication and Lens-header injection. `buildInnerConstitution` adds one new field assignment (`watch_for`).
- `lib/types.ts` — `InnerConstitution` gains one new field: `watch_for: string[]`. No other type changes.
- `app/components/InnerConstitutionPage.tsx` — adds one new render slot for Watch For between Top Risks and Growth Path. No other layout changes.

**Existing code (do NOT edit):**

- `app/page.tsx`, `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx`, `app/components/ShapeCard.tsx`, `app/components/TensionCard.tsx`, `app/components/MbtiDisclosure.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts`.
- Any `docs/canon/*.md` file other than `inner-constitution.md`.
- Any tension detection block in `lib/identityEngine.ts`.
- Any signal definition (SIGNAL_DESCRIPTIONS, SACRED_PRIORITY_SIGNAL_IDS, STRENGTHENERS, STACK_TABLE, MBTI_LOOKUP).
- The pre-CC-011b structure of every existing per-card derivation function (the function signatures and overall control flow stay; only the prose generation and category picker logic inside changes).

---

## Context

CC-011 produced a structurally complete Inner Constitution: every signal flows through aggregation → derivation → cross-card synthesis. CC-012 rendered it as the editorial document the spec calls for. The result is *good* — the body-map architecture, the per-card SWOT structure, the cross-card synthesis (Top Gifts, Top Risks, Growth Path, Relationship Translation, Conflict Translation, Mirror-Types Seed) all read as proper editorial prose for most cells.

Where it falls short is **editorial discipline at the prose-template layer**:

- The same gift category fires verbatim across multiple cards because `pickGiftCategory` uses a single global heuristic and several cards happen to satisfy the same canonical signature (Discernment requires Truth/Knowledge in top Compass + Ti or Ni in stack — that signature is satisfied by Compass, Gravity, *and* Trust readings for an Ni-Te-leaning user with Truth in top values).
- The prose templates inside per-card derivation functions are single fixed strings, so when the same category fires for three cards, the same sentence reads three times.
- Two prose-generation bugs (Mirror seed value-hardcoding, Path paragraph templating) escape user-facing output.
- Top Risks labels were left as debug-style strings while Top Gifts received editorial labels.

CC-011b fixes the prose-template layer without touching the engine's signal-derivation correctness. The fix has four parts:

1. **Per-card gift category preference lists.** Each card prefers categories native to its semantic domain. Lens prefers Pattern / Precision / Discernment. Compass prefers Integrity / Meaning / Stewardship / Endurance. Etc. Cards still fall back to whatever category the user's signal pattern supports, but the preference list disambiguates when multiple categories qualify.

2. **Prose-variant pools.** Each prose-template that previously returned a single fixed string returns one of 3–4 variants, selected deterministically per card position so the same user gets consistent output but different cards see different stems.

3. **Specific bug fixes.** Mirror seed value-parameterization. Path paragraph "your your" + Lens-header injection. Top Risks editorial labels. Section-label varies for Top Gifts.

4. **New Watch For section.** Between Top Risks and Growth Path. Renders 4–6 concrete *"When X becomes Y"* triggers derived from per-card Risk Under Pressure cells.

---

## Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Per-card gift category preference lists

Each per-card derivation function uses a card-specific category-picker. The picker consults a preference list, scoring each category by both the user's signal-pattern support (per the canonical signatures in `output-engine-rules.md` § 12-vocabulary) AND the card-native preference. The highest-scoring category wins.

Per-card preferences:

- **Lens** (eyes / how you see): `["Pattern", "Precision", "Discernment", "Meaning"]`
- **Compass** (heart / what you protect): `["Integrity", "Meaning", "Stewardship", "Endurance", "Advocacy"]`
- **Conviction** (voice / belief under cost): `["Discernment", "Precision", "Integrity", "Pattern"]`
- **Gravity** (spine / responsibility attribution): `["Builder", "Advocacy", "Discernment", "Endurance"]`
- **Trust** (ears / receptivity to sources): `["Discernment", "Harmony", "Stewardship", "Pattern"]`
- **Weather** (nervous system / adaptation): `["Endurance", "Stewardship", "Harmony"]`
- **Fire** (immune response / under cost): `["Integrity", "Action", "Endurance", "Pattern"]`
- **Path** (gait / direction): `["Generativity", "Builder", "Advocacy", "Action"]`

Scoring rule: for each category in the card's preference list, check whether the user's signal pattern satisfies the canonical signature for that category (per `output-engine-rules.md` § 12-vocabulary). If yes, score = `signal_strength_match * preference_position_weight`. If no, skip. The category with the highest score wins. Preference position weight: index 0 → 1.0, index 1 → 0.7, index 2 → 0.5, index 3 → 0.35.

If no category in the preference list is satisfied by signal pattern, fall back to the global `pickGiftCategory` (the existing CC-011 logic) so the card still produces output. Edge case unlikely but possible for sparse sessions.

**Acceptance constraint:** in any single Inner Constitution rendering, no more than **two** cards may carry the same gift category. If `pickGiftCategoryForCard` for a card would produce a category already used by two other cards, the picker selects the next-best preference for that card. This caps the multi-card collision.

### D-2: Prose-variant pools

Each prose template that previously returned a single fixed string is rewritten as a small pool. The number of variants per template is **3 minimum, 5 maximum**. Selection is deterministic per call site:

- For per-card cells, use the card's position in canonical order (Lens=0, Compass=1, Conviction=2, Gravity=3, Trust=4, Weather=5, Fire=6, Path=7) modulo the pool size to pick a variant.
- For cross-card synthesis cells (Top Gifts entries, Top Risks entries, Watch For triggers), use the entry's position in the list (entry 0, 1, 2) modulo pool size.

Specific templates to expand into pools (this list is exhaustive for CC-011b — do not add variants for templates not listed here):

**Per-card Gift cell stem.** Currently the stem reads *"A {category} gift shows up here:"* or *"A {category} gift appears here:"*. Expand to 4 variants:

1. *"A {category} gift shows up here:"*
2. *"What this card surfaces is your tendency toward {category}:"*
3. *"{category} is part of how this card lands:"*
4. *"In its native register, this card carries {category}:"*

Cards pick by `cardPosition % 4`. The label `{category}` substitutes the gift-category as a noun phrase ("a discernment gift" / "discernment" / etc.). The full sentence is followed by the user-specific descriptor ("you tend to...") that already exists in the templates.

**Per-card Growth Edge cell stem.** Currently *"The growth move is leaving room for honest difference and ordinary error..."*. Expand to 4 variants:

1. *"The growth move on this card involves..."*
2. *"What stretches you here looks like..."*
3. *"Growth here tends to show up as..."*
4. *"The next move on this card is..."*

Each variant is followed by the card-specific growth content that already exists in the templates. The phrase *"leaving room for honest difference and ordinary error, not only for bad-faith pattern"* is itself a Discernment-specific growth move and may appear at most once in any rendered output (deterministic — pick the card with the strongest Discernment signal to host it; other Discernment-leaning cards use a different growth phrasing from a per-category-growth-pool).

**Per-card Risk Under Pressure cell stem.** Currently *"Under ordinary pressure"* or *"Under the kind of pressure most weeks bring"* or *"Under sustained pressure"*. Expand to 5 variants:

1. *"Under ordinary pressure"*
2. *"Under the load most weeks bring"*
3. *"At ordinary stress levels"*
4. *"When stakes are present but moderate"*
5. *"Under sustained but not extreme pressure"*

For users with `weather.load === "high+"`, an alternate pool kicks in:

1. *"Under heavy current load and high-stakes pressure"*
2. *"At the edges of what your shape can carry"*
3. *"When the load is at the high end of what most weeks bring"*

Cards pick by `cardPosition % poolSize`. Within each card's Risk cell, the stem opens the sentence; the rest is the existing card-specific content.

**Top Gifts paragraph closing.** The phrase *"This appears across multiple cards in your shape, which is why it surfaces here as a top gift rather than a single-card strength"* currently fires for all three Top Gifts entries. Replace with one of three closings, picked by entry position (0, 1, 2):

1. *"It appears across multiple cards, which is why it surfaces here as a top gift rather than a single-card strength."* (entry 0)
2. *"This shape supports it from more than one angle."* (entry 1)
3. *"More than one card surfaces this; here is the synthesized read."* (entry 2)

### D-3: Specific bug fixes

**Mirror seed value-parameterization.** The current `generateMirrorTypesSeed` produces:

> *"Your Knowledge-shape leans toward convergent insight — protecting truth by holding the long-arc interpretation."*

The hardcoded "truth" must become the user's actual top Compass value. Fix in two places:

1. The `lensExpression` function (or inline lookup) currently returns expressions that reference "truth" generically. Rewrite to receive the protected value as a parameter and return phrases that use that value.
2. The contrast sentences ("Someone whose X-shape leans toward authenticity..." / "...verified precedent...") should also reference the user's actual top value, not a hardcoded one.

After fix, an INTJ user with Knowledge top should read:

> *"Your Knowledge-shape leans toward convergent insight — protecting Knowledge by holding the long-arc interpretation. People who organize around Knowledge differently may sound nothing like you and still share your deepest commitment. Someone whose Knowledge-shape leans toward authenticity will protect Knowledge by refusing to participate in what feels false; someone whose Knowledge-shape leans toward verified precedent will protect Knowledge by holding to what's been tested."*

The lens-expression-per-function lookup table (Ni → "convergent insight," Ti → "logical precision," Fi → "personal authenticity," etc.) stays intact; only the value-name parameter changes.

**Path paragraph templating bug.** The current Path generator produces:

> *"...letting your your processing pattern leans toward convergent pattern synthesis supported by Te become more legible to the people who depend on it."*

Two problems: (a) the *"your your"* duplication suggests a `${user_phrase}` placeholder appended an extra "your"; (b) the Lens card-header sentence is being injected into a position where a shorter phrase is needed.

Fix: introduce a `lensSummaryPhrase` derived from `LensStack` that returns short forms suitable for inline reference. For an INTJ stack: *"your Ni-Te shape"* or *"your convergent-pattern reading"* or simply *"your shape"*. The Path generator references this short phrase, not the Lens card-header sentence. The "your your" becomes a single "your."

**Top Risks editorial labels.** Currently:

- *"Risk surfaced from Compass."*
- *"Risk surfaced from Lens."*
- *"Risk surfaced from Fire."*

Replace with editorial labels matching Top Gifts' shape. For each top risk, derive a named label from the gift category that produced the risk (per the Gift-to-Blind-Spot pairing table in `output-engine-rules.md`):

- Discernment → "Cynicism becoming default."
- Pattern → "Pattern certainty becoming private fact."
- Precision → "Precision becoming weaponized correctness."
- Stewardship → "Stewardship becoming fear of disruption."
- Action → "Action becoming impatience with reflection."
- Harmony → "Harmony becoming conflict avoidance."
- Integrity → "Integrity becoming rigidity."
- Builder → "Building becoming control."
- Advocacy → "Advocacy becoming combativeness."
- Meaning → "Meaning becoming overinterpretation."
- Endurance → "Endurance becoming silent suffering."
- Generativity → "Generativity becoming over-extension."

Each label is a *"X becoming Y"* phrase that names the risk concretely. The label appears as the bold opening of each Top Risk entry, followed by the card-specific risk paragraph.

### D-4: Watch For section — new cross-card synthesis output

Between Top Risks and Growth Path, render a new section: **Watch For**. Renders 4–6 concrete behavioral triggers in *"When X becomes Y"* format, derived from per-card Risk Under Pressure cells.

**Type addition** (extend `InnerConstitution`):

```ts
export type InnerConstitution = {
  // existing fields preserved
  ...
  watch_for: string[];  // 4-6 trigger sentences
};
```

**New generator function** in `lib/identityEngine.ts`:

```ts
export function generateWatchFor(
  shapeOutputs: ShapeOutputs,
  topCompass: SignalRef[],
  stack: LensStack,
  weather: WeatherLoad,
  fire: FirePattern
): string[] {
  // Generate 4-6 trigger sentences based on per-card gift categories,
  // top compass values, and fire signature.
  // Each trigger is a "When X becomes Y" sentence.
}
```

**Trigger templates per gift category** (the agent authors the templates from this guide). Each gift category has 1–2 trigger templates that translate the gift's overuse pattern into a "When X becomes Y" sentence:

- **Pattern**: *"When 'I see the pattern' becomes 'I no longer need to test the pattern.'"*
- **Precision**: *"When clarity stops asking whether the moment is asking for it."* / *"When truth becomes more important than timing."*
- **Stewardship**: *"When stability becomes the only acceptable shape of safety."*
- **Action**: *"When momentum becomes the substitute for direction."*
- **Harmony**: *"When keeping the room calm becomes more important than naming what's not working."*
- **Integrity**: *"When standing alone starts to feel like the only way to stand."*
- **Builder**: *"When making it work becomes the only reading of whether it's worth making."*
- **Advocacy**: *"When the cause becomes the proof of your goodness."*
- **Meaning**: *"When the long view stops checking whether the short view needs you here, now."*
- **Endurance**: *"When carrying the weight stops being noticed by you, and so stops being noticed by anyone."*
- **Discernment**: *"When detecting bad faith becomes assuming bad faith."*
- **Generativity**: *"When giving outward becomes losing track of yourself inward."*

Plus 2–3 cross-shape templates rooted in Fire pattern + Compass:

- If `fire.willingToBearCost`: *"When bearing cost becomes proof of righteousness."*
- If top Compass includes Truth: *"When silence feels noble but functions as withdrawal."* (Conviction-related)
- If top Gravity includes both Individual + System: *"When structural repair makes small mercy feel beneath you."*

The generator picks 4–6 triggers total: at least one per top-gift category that surfaced in `topGifts`, plus 1–2 cross-shape if the user's signature supports them. Deduplicate identical triggers across sources.

**Render in `app/components/InnerConstitutionPage.tsx`:**

Insert a new section between Top Risks and Growth Path. Header: `Watch For` (mono caps, same treatment as other section labels). Subtitle: serif italic, *"the early forms of distortion this shape may produce — small enough to catch before they take over"* (one line, `var(--ink-soft)`). Then a bulleted list of the trigger sentences in serif body, 15.5px desktop / 15px mobile, with 8px vertical spacing between bullets. Each bullet starts with a small umber bullet glyph (`•`).

**Canon edit to `docs/canon/inner-constitution.md`** § Top-Level Structure (lines 51–62): insert "Watch For" as a new step 5, renumbering subsequent steps. Add a brief description to § Watch For somewhere appropriate (3–5 sentences, defining what the section is and how it derives from per-card Risk Under Pressure cells).

### D-5: Five Dangers compliance for new prose

Every new prose variant — gift-cell stems, growth-edge stems, risk-cell stems, top-gifts closings, top-risks labels, mirror-seed parameterized prose, path paragraph fix, watch-for triggers — must respect `shape-framework.md` § Five Dangers. Specifically:

- No declarative "you are" framings.
- No stress-as-revelation language; trigger sentences use "When X becomes Y" not "this shows who you really are."
- No moralizing on trust, values, or contact profiles.
- No clinical implication.
- No type-label headlines.

Watch For triggers in particular must read as **possibilities to notice**, not verdicts. The subtitle *"the early forms of distortion this shape may produce — small enough to catch before they take over"* sets the conditional frame; the triggers themselves stay in the *"When X becomes Y"* shape rather than the declarative *"You will become Y"*.

### D-6: Repetition cap

Across the full rendered Inner Constitution, the same identical sentence (after variant selection) may appear at most **once**. If a deterministic variant pick would produce a duplicate (rare but possible when two cards land on the same category and their pool selection happens to pick the same variant), the second card picks the next variant in the pool.

The same gift category may appear in at most **two** cards (per § D-1). Identical Blind Spot phrases may appear in at most **two** cards. Identical Growth Edge phrases may appear in at most **one** card.

Implementation: track previously-used sentences/categories within a single `buildInnerConstitution` call. The collision check runs after each per-card derivation; if the result duplicates a prior card, re-pick from the next preference / next variant.

### D-7: Deterministic seeding

All variant selections must be deterministic — the same input answers must produce the same output. Use card position index (0–7) and entry position (0–N) as the seeds, not random values. This ensures that re-rendering an existing user's Inner Constitution always produces the same prose.

---

## Requirements

### 1. Add `watch_for: string[]` to `InnerConstitution` type in `lib/types.ts`

Single field addition. Existing fields preserved.

### 2. Implement `pickGiftCategoryForCard(card, ...)` in `lib/identityEngine.ts`

Per § D-1. Replaces (or wraps) the existing `pickGiftCategory` for per-card use. The cross-card synthesis (`synthesizeTopGifts`) continues to use a global picker that aggregates across cards.

The eight per-card derivation functions update to call `pickGiftCategoryForCard("lens", ...)` etc., with the card-specific preference list passed in.

### 3. Implement prose-variant pools in per-card derivation functions

Per § D-2. Each per-card derivation function gains internal pool definitions for Gift stem, Growth Edge stem, Risk stem. The pools are constants keyed by card position. Selection is deterministic per § D-7.

### 4. Implement specific bug fixes

Per § D-3. Three discrete fixes:

- `generateMirrorTypesSeed` parameterized to use the user's actual top Compass value name throughout.
- Path paragraph generator (whatever CC-011 named the function inside `derivePathOutput`) updated: introduce `lensSummaryPhrase`, fix "your your" duplication, replace Lens-header injection with the short summary phrase.
- `synthesizeTopRisks` updated to produce editorial labels per the gift-category-to-risk-label table. Top Gifts paragraph closings vary per § D-2.

### 5. Implement `generateWatchFor` and add to `buildInnerConstitution`

Per § D-4. New cross-card synthesis function. Returns 4–6 trigger sentences. `buildInnerConstitution` populates `constitution.watch_for` from this function's output.

### 6. Add Watch For render slot in `app/components/InnerConstitutionPage.tsx`

Per § D-4. Single new section between Top Risks and Growth Path. Mono-caps header, serif italic subtitle, bulleted list with umber bullet glyphs.

### 7. Edit `docs/canon/inner-constitution.md` to add Watch For

Per § D-4. Insert "Watch For" as step 5 in § Top-Level Structure, renumber subsequent steps. Add a brief § Watch For description block somewhere appropriate (between § 4 Top Risks spec and § 5 Growth Path spec).

### 8. Verify

- `npx tsc --noEmit` passes cleanly.
- `npm run lint` passes cleanly.
- Re-run the synthetic INTJ session that surfaced the issues and confirm:
  - Mirror seed says *"protecting Knowledge"* (not "protecting truth") for an INTJ session with Knowledge as top Compass.
  - Path paragraph has no *"your your"* duplication and uses a short Lens summary phrase.
  - Top Risks labels are editorial, not debug-style.
  - Compass / Gravity / Trust each carry a different gift category (no three-way Discernment collision).
  - The Discernment growth-move phrase appears at most once in the rendered output.
  - Watch For section renders 4–6 triggers in *"When X becomes Y"* format.
  - All eight cards still produce non-empty Gift / Blind Spot / Growth Edge cells. Conviction still has Gift + Blind Spot + Posture only. Path still has the directional paragraph only.
- Browser smoke at `localhost:3003`: full session through the result page renders cleanly with the new Watch For section visible between Top Risks and Growth Path.

---

## Allowed to Modify

**Canon (narrow):**

- `docs/canon/inner-constitution.md` — § Top-Level Structure renumbering and § Watch For description block. No other changes to the file.

**Code:**

- `lib/types.ts` — single field addition to `InnerConstitution`. All other types preserved.
- `lib/identityEngine.ts` — per-card category pickers, prose-variant pools, generator updates, new `generateWatchFor`, `buildInnerConstitution` extension. All other functions and constants preserved.
- `app/components/InnerConstitutionPage.tsx` — new render slot for Watch For. All other layout preserved.

Do **NOT** modify:

- Any other `docs/canon/*.md` file. `output-engine-rules.md`, `shape-framework.md`, `temperament-framework.md`, `signal-library.md`, `signal-mapping-rule.md`, `signal-and-tension-model.md`, `card-schema.md`, `tension-library-v1.md`, `research-mapping-v1.md`, `validation-roadmap-v1.md`, `question-bank-v1.md` — all unchanged.
- `app/page.tsx`, `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx`, `app/components/ShapeCard.tsx`, `app/components/TensionCard.tsx`, `app/components/MbtiDisclosure.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts`.
- `lib/identityEngine.ts` engine functions other than the per-card derivation functions, `synthesizeTopGifts`, `synthesizeTopRisks`, `generateMirrorTypesSeed`, the Path generator, and `buildInnerConstitution`. Specifically: `signalFromAnswer`, `signalsFromRankingAnswer`, `extractFreeformSignals`, `deriveSignals`, `detectTensions`, `applyStrengtheners`, `deriveCoreOrientation`, `deriveSacredValues`, `aggregateLensStack`, `getTopCompassValues`, `getTopGravityAttribution`, `getTopTrustInstitutional`, `getTopTrustPersonal`, `assessWeatherLoad`, `inferFirePattern`, `inferFormationContext`, `inferAgencyPattern`, `toAnswer`, `toRankingAnswer`, `strengthForRank`, `has`, `hasFromQuestion`, `hasAtRank`, `cardFor`, `ref`, all SIGNAL_DESCRIPTIONS, SACRED_PRIORITY_SIGNAL_IDS, STRENGTHENERS, STACK_TABLE, MBTI_LOOKUP — all preserved verbatim.
- Any tension detection block.
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`, `postcss.config.mjs`.

---

## Out of Scope

This CC does not do any of the following. Each is a future-CC concern.

- **Card-cell compression from 4 to 3.** Clarence's "tightened output model" suggests Gift / Distortion / Growth move per card with Risk consolidated to Top Risks across cards. That's a structural change touching `inner-constitution.md`, `output-engine-rules.md`, `shape-framework.md`, types, all eight per-card derivation functions, and the renderer. Substantial blast radius. Deserves its own CC (call it CC-011c) with explicit canon revision. Explicitly deferred from CC-011b.
- **"Next 3 moves" practical-action section.** Clarence's suggested final practical translation section ("Work translation / Love translation / Conflict translation / Next 3 moves"). The first three already exist; "Next 3 moves" is new editorial work that requires per-shape concrete-action templating. Future CC.
- **LLM substitution for templated paragraphs.** Mirror-Types Seed contrast sentences, Conviction Posture mixed-Fire branch, Path directional paragraph for sparse-Agency users. Future CC.
- **Tension provenance prose polish.** Could be improved (e.g., consolidating signals from the same question into a single bullet) but is functioning adequately. Future copy-polish CC.
- **TensionStatus naming alignment** (`yes / partly / no` in spec vs `confirmed / partially_confirmed / rejected` in code). Type-only cleanup. Future CC.
- **Break interstitials** after Q-T3 / Q-T6. Deferred from CC-010. Future CC.
- **T-009 rewrite.** Canon-blocked since CC-009. Future CC.
- **Persistence / autosave / localStorage.** Future CC.
- **Sharing / export.** Future CC.
- **Print stylesheet.** Future CC.
- **New questions, signals, or tensions.** Out of scope.
- **Engine logic correctness changes.** No changes to derivation rules, signal aggregation, tension detection, or any function not explicitly listed in § Allowed to Modify.

---

## Acceptance Criteria

1. `lib/types.ts` `InnerConstitution` has a new `watch_for: string[]` field. All existing fields preserved verbatim.
2. `pickGiftCategoryForCard` (or equivalent per-card category picker) exists in `lib/identityEngine.ts` and is consulted by all eight per-card derivation functions. Per-card preference lists per § D-1.
3. Prose-variant pools per § D-2 are implemented in per-card derivation functions. Each Gift cell stem has 4 variants. Each Growth Edge cell stem has 4 variants. Each Risk cell stem has 5 variants (3 for high+ load). Top Gifts closings have 3 variants. Top Risks labels are editorial per the gift-category-to-risk-label table in § D-3.
4. `generateMirrorTypesSeed` parameterized: an INTJ session with Knowledge as top Compass produces *"Your Knowledge-shape leans toward convergent insight — protecting Knowledge by holding the long-arc interpretation"* (not "protecting truth").
5. Path paragraph generator: no *"your your"* duplication. The Lens-header sentence is replaced by a short summary phrase (e.g., "your Ni-Te shape" or equivalent).
6. `generateWatchFor` exists and produces 4–6 trigger sentences per § D-4. `buildInnerConstitution` populates `constitution.watch_for` from this function.
7. `app/components/InnerConstitutionPage.tsx` renders a Watch For section between Top Risks and Growth Path with the spec'd visual treatment.
8. `docs/canon/inner-constitution.md` § Top-Level Structure includes Watch For as step 5, with subsequent steps renumbered. § Watch For description block exists.
9. Repetition cap per § D-6 holds: same gift category in at most 2 cards; identical Blind Spot phrase in at most 2 cards; identical Growth Edge phrase in at most 1 card; identical full sentence appears at most once.
10. Deterministic seeding per § D-7: re-running the same answers produces the same Inner Constitution.
11. Five Dangers compliance per § D-5: no new prose violates any of the five dangers.
12. `npx tsc --noEmit` passes cleanly.
13. `npm run lint` passes cleanly.
14. Smoke test: re-run the INTJ session that previously had the three-way Discernment collision and confirm that Compass / Gravity / Trust now each carry a different gift category. Confirm Mirror seed says *"protecting Knowledge"*. Confirm Path has no "your your". Confirm Top Risks labels are editorial. Confirm Watch For renders 4–6 triggers.
15. No file outside the Allowed to Modify list has been edited.
16. No engine logic was modified beyond what is explicitly authorized.
17. No tension detection rule was modified.
18. No new questions, signals, or tensions were authored.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description.
2. **Per-card category pickers** — quote `pickGiftCategoryForCard` (or equivalent) verbatim. Show the per-card preference lists. Confirm the scoring rule and the global fallback path.
3. **Prose-variant pools** — quote the four Gift-stem variants, four Growth-Edge stem variants, five Risk-stem variants (plus 3 high+-load variants), three Top-Gifts-closing variants, and the gift-category-to-risk-label table. Confirm deterministic selection.
4. **Mirror seed parameterization** — quote the updated `generateMirrorTypesSeed` body. Show the lens-expression-per-function lookup taking the value name as a parameter. Quote the new INTJ-session-with-Knowledge output.
5. **Path paragraph fix** — quote the `lensSummaryPhrase` helper. Show the corrected paragraph for an INTJ session (no "your your", no Lens-header injection).
6. **Top Risks editorial labels** — quote `synthesizeTopRisks` updated body. Show the new INTJ-session top-risks output with editorial labels.
7. **Watch For** — quote `generateWatchFor` verbatim. Show the trigger templates per gift category. Quote a sample Watch For output for the INTJ smoke-test session (4–6 triggers).
8. **Watch For render** — quote the new render slot in `InnerConstitutionPage.tsx`. Confirm placement between Top Risks and Growth Path.
9. **Canon edit** — quote the updated § Top-Level Structure section in `inner-constitution.md`. Quote the new § Watch For description block.
10. **Repetition cap verification** — quote the implementation of the cap (the "previously used categories / sentences" tracking logic). Confirm the cap holds in the smoke-test session.
11. **Five Dangers compliance** — explicit confirmation that no new prose violates any of the five dangers.
12. **Smoke-test results** — re-run the INTJ session and confirm: Mirror seed correct, Path correct, Top Risks editorial, no three-way category collision, Watch For renders. Confirm browser visual smoke if performed.
13. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
14. **Scope-creep check** — explicit confirmation that:
    - No canon file other than `inner-constitution.md` was modified.
    - No engine logic was changed beyond per-card category pickers, prose-variant pools, and the named generators.
    - No tension detection rule was modified.
    - No new questions / signals / tensions were authored.
    - The card-cell count per card is unchanged (4 cells for full-SWOT, 3 for Conviction, paragraph for Path).
    - No "Next 3 moves" section was added.
    - `app/page.tsx` and components other than `InnerConstitutionPage.tsx` are byte-identical.
15. **Risks / next-step recommendations** — anything that surfaced during execution. Specifically:
    - Whether the per-card preference lists felt complete or whether some signal patterns produced unexpected categories for a given card.
    - Whether any deterministic variant selection produced an awkward sentence that would benefit from a future polish CC.
    - Whether the Watch For triggers feel concrete enough or whether some land as generic.
    - Whether the cap logic ever triggered a fallback (collision avoidance) and whether the fallback prose reads cleanly.
    - Whether the Mirror seed's contrast-sentence phrasing for non-Truth top values reads as natural.
    - Whether Clarence's deferred suggestions (4-cell → 3-cell card compression; "Next 3 moves" section) feel like they should be the next CC after CC-011b, or whether other priorities surface.
    - Any other observation worth surfacing.
