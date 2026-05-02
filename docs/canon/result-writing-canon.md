# Result-Writing Canon

## Purpose

Codifies the editorial discipline rules that govern user-facing prose generation in the Inner Constitution and (eventually) the Mirror. Every CC that authors or modifies user-facing prose templates must read this file first and respect every rule in it.

This canon governs only the editorial layer — *how the engine's structured output gets turned into user-facing prose.* It does not govern what gets derived (that is `output-engine-rules.md`), what gets rendered structurally (`inner-constitution.md`), or the underlying framework (`shape-framework.md`). It governs voice, register, repetition, and variation.

The product's failure mode without this canon: results that read as a *sophisticated psychological profile* — intellectually complete but emotionally heavy, full of clinical jargon, with the same blind spot phrased identically across two adjacent cards. The product's success mode with this canon: results that feel *written rather than assembled*, voiced in plain English, with each repeated theme rendered in a different register so the reader hears recognition instead of redundancy.

---

## The Seven Rules (Clarence's framing)

1. **Default output begins with a short Mirror section, not the full diagnostic.** The Inner Constitution's ten-section depth is a reference document; what most users want first is a brief, recognizable read of who they appear to be. The Mirror is the answer to *"what do I sound like, on first read?"* — the diagnostic is the answer to *"why?"* *[CC-015b implements this rule structurally; CC-015a does not yet enforce.]*

2. **Card diagnostics are secondary / expandable.** Once Mirror exists, each card becomes an inline accordion: collapsed by default, expanded by curiosity. The eight cards do not vanish — they retreat behind the Mirror, available without competing with it for the reader's first attention. *[CC-015b implements this rule structurally; CC-015a does not yet enforce.]*

3. **Avoid repeating the same blind spot across cards unless each instance adds a distinct expression.** The CC-011b cap allows a gift category to appear in at most two cards in a single rendering. When two cards do share a category, the second card must use a different blind-spot phrasing — not the same sentence pasted twice. *[CC-015a enforces this rule via per-category variant pools (`BLIND_SPOT_TEXT_VARIANTS`) selected by per-card position.]*

4. **No placeholder labels may surface to the user, including "{card}-card risk under pressure."** Editorial fallback labels exist for every card; the renderer never falls through to debug-style placeholders. *[CC-015a enforces this rule via `TOP_RISK_CARD_FALLBACK`.]*

5. **Replace clinical Jungian language with lived-language first; put function labels in small secondary text.** Body prose speaks in voices (the pattern-reader, the structurer, the inner compass). Function codes (Ni, Te, Fi, …) appear only in the optional MBTI disclosure body, never as the headline language of the document. *[CC-015a enforces this rule via `FUNCTION_VOICE` and `FUNCTION_VOICE_SHORT`; the per-card derivation and cross-card synthesis functions reference voices, not function codes.]*

6. **Each result must include: one-sentence shape summary, top 3 gifts, top 3 traps, relationship translation, pressure translation, 3 next moves.** The Mirror's structural skeleton is fixed; the prose inside each section varies by user. *[CC-015b's Mirror generator implements this rule.]*

7. **The result should feel written, not assembled.** Editorial north star. No template that surfaces to the reader as obvious template. The repetition rules, the variation rules, the voice substitution table — all of them serve this single test.

---

## Voice descriptor table (canonical mapping)

Each cognitive function code maps to one plain-language voice descriptor (used in body prose) and a short form (used when grammatical context demands). These are the only legal references to each function in user-facing prose; the function codes themselves are reserved for the MBTI disclosure.

| Code | Voice descriptor | Short form |
|------|------------------|-----------|
| Ni   | the pattern-reader      | pattern-reader      |
| Ne   | the possibility-finder  | possibility-finder  |
| Si   | the precedent-checker   | precedent-checker   |
| Se   | the present-tense self  | present-tense self  |
| Ti   | the coherence-checker   | coherence-checker   |
| Te   | the structurer          | structurer          |
| Fi   | the inner compass       | inner compass       |
| Fe   | the room-reader         | room-reader         |

The table is implemented in `lib/identityEngine.ts` as `FUNCTION_VOICE` and `FUNCTION_VOICE_SHORT`. Future CCs that need to reference a cognitive function in prose use these constants — never `FUNCTION_NAME` (the two-letter code) and never `FUNCTION_PHRASE` (the older clinical descriptors). Those two earlier constants are preserved as engine-internal API but are not legal in body prose.

---

## Protected lines

The following lines are product-quality and may NOT be modified by any future CC without an explicit revision to this canon file. They have earned their place through the editorial pass that produced them; a future CC that paraphrases or replaces one of them is making a substantive editorial regression, not an improvement.

- *"a possibility, not a verdict"*
- *"the final authority on what fits is yours"*
- *"Private interpretation may settle into private fact before evidence is in."*
- *"Standing alone starts to feel like the only way to stand."*
- *"When detecting bad faith becomes assuming bad faith."*
- *"The translation is rarely about doing less of yourself — it is usually about being more legible."*
- *"None of these is who you are; each is who you may become if the load is not eased."*
- *"The mature version of this shape does both: it builds the bridge and still notices the person standing in the rain."*
- *"That gives people a way to follow you before they have to decide whether to trust the verdict."*

Future CCs may use these lines verbatim in templated prose. They may not paraphrase, abbreviate, replace, or wrap them in a way that buries them. If a CC needs to reference one of them inline, quote it.

---

## Repetition rules

These rules govern how often a given prose unit (category, sentence, full paragraph) may surface inside a single rendered Inner Constitution.

- **Same gift category may appear in at most two cards** in any single rendering. (Per CC-011b's cap; preserved unchanged.)
- **Identical Blind Spot phrase in at most two cards.** When two cards share a gift category, the second card must use a different variant from `BLIND_SPOT_TEXT_VARIANTS`. (Per CC-015a; the variant pools currently carry 3 entries each for `Discernment` and `Pattern` — the two categories where verbatim duplication was observed in real-user output — and a single canonical entry for the other ten.)
- **Identical Growth Edge phrase in at most one card** when the gift category is also the Discernment-on-Conviction host card; the second occurrence uses the Discernment alternate phrase per CC-011b's existing `growthEdgeFor` selector.
- **Identical full sentence appears at most once across the entire rendered output.** A sentence used in a per-card cell may not be re-used verbatim in a cross-card synthesis section. (CC-015a's prose templates respect this; future CCs must check.)
- **Variant pools provide alternates when the cap is hit.** `BLIND_SPOT_TEXT_VARIANTS` and the existing CC-011b stem pools (`GIFT_STEM_POOL`, `GROWTH_EDGE_STEM_POOL`, `RISK_STEM_POOL`, `RISK_STEM_HIGH_POOL`, `TOP_GIFTS_CLOSING_POOL`) are the deterministic source of variation.

---

## Variation rules

These rules govern how the engine should vary phrasing across multiple call sites in a single rendering, so that a recurrent reference (e.g., the user's top values list) does not read as a copy-paste.

- **Value-list phrasing varies across call sites** per `valueListPhrase(topCompass, variantIndex)`. The same user always gets the same output (deterministic on `variantIndex`); but across the rendering, the phrasing rotates through the verbatim list, *"your top values,"* *"what you protect,"* and *"the N values you ranked highest."* Each call site passes a deterministic `variantIndex` (typically the card position, 0–7, or a section index in cross-card synthesis).
- **Per-process under-pressure behaviors** (`UNDER_PRESSURE_BEHAVIOR[fn]`) replace abstract function-code pressure language wherever it appears in per-card Risk Under Pressure cells. Each function carries one canonical sentence describing how that voice may distort under pressure (e.g., *"the pattern-reader narrows the lens until certainty starts to feel like fact"*). These are the only legal under-pressure prose templates for function-code-driven pressure language; cards with card-specific pressure language (e.g., Compass's *"defended absolutes"*) keep their card-specific text.
- **All variant selections are deterministic.** Same input answers must produce the same output. Card position index (0–7) and entry position (0–N) are the seeds; `Math.random()` is forbidden inside the prose-template layer.

---

## What this canon does NOT govern

- **Question text, gloss text, voice quotes** — those are governed by `question-bank-v1.md` (and updated via question-bank-revision CCs).
- **Signal definitions** — `signal-library.md`.
- **Tension definitions** — `tension-library-v1.md`.
- **Per-card derivation rules** — `output-engine-rules.md`.
- **The body-map metaphor or card names** — `shape-framework.md`.
- **The cognitive-function descriptions themselves** — `temperament-framework.md`. (The voice descriptor table here is the editorial *rendering* of those functions; the canonical *behavioral* descriptions live in temperament-framework.)

This canon governs only the editorial layer.

---

## Relationship to other canon files

- **Sits above `inner-constitution.md`** (which describes *what to render*) and **below `output-engine-rules.md`** (which describes *how to derive*). This file describes **how the rendering should sound.**
- Future Mirror-generator work (CC-015b) reads this file as its tone-and-discipline reference.
- Future content CCs that author user-visible prose templates (e.g., expanding the variant pools, adding alternate Compass posture sentences, authoring Path's growth-direction prose for v2) read this file first.
- The Five Dangers from `shape-framework.md § Five Dangers to Avoid` remain binding on every prose variant; this canon does not relax them — it operationalizes them at the editorial layer.

---

## Implementation map (CC-015a)

For traceability, here is which constants in `lib/identityEngine.ts` operationalize which canonical rule:

| Canonical rule | Code-level surface |
|---|---|
| Voice substitution (Rule 5) | `FUNCTION_VOICE`, `FUNCTION_VOICE_SHORT` |
| Per-process pressure behavior (Variation rule 2) | `UNDER_PRESSURE_BEHAVIOR` |
| Top Risks fallback (Rule 4) | `TOP_RISK_CARD_FALLBACK` |
| Value-list variation (Variation rule 1) | `valueListPhrase()` helper |
| Blind-spot variant pools (Repetition rule 2) | `BLIND_SPOT_TEXT_VARIANTS`, `blindSpotFor()` selector |
| Determinism (Variation rule 3) | All variant selections seeded by `cardPos` (0–7) or `usedCategories` count |

Future CCs that add new variant pools or call sites add rows to this table.

---

## Belief content rule (CC-015c)

Freeform belief questions do not directly score the user by content. The model does not judge whether the stated belief is correct, admirable, fashionable, or morally acceptable. The model interprets only the role the belief plays in the user's shape: what value it may protect, what cost it carries, what community it strains, and what evidence or experience could revise it. The user's stated belief surfaces only verbatim or with minimal paraphrase. Any tagging produced by heuristic extraction is structural metadata about the belief's role, not a verdict on its content.

This rule binds every CC that touches Keystone Reflection prose (the user-facing surface for Q-I1 / Q-I2 / Q-I3). Heuristic extraction may produce tag candidates (`likely_value_domain`, `disagreement_context`, `conviction_temperature`, `social_cost`, `epistemic_posture`); the user is the final authority on whether each tag is right. Confirmed tags drive contextual prose firmly. Confident-but-unconfirmed tags hedge. Low-confidence-unconfirmed tags are omitted from rendered prose entirely.

| Canonical rule | Code-level surface |
|---|---|
| Belief content rule (this section) | `lib/beliefHeuristics.ts` (extractor + dictionaries + prose generator), `app/components/KeystoneReflection.tsx` (verbatim block + per-tag confirmation panel) |

---

## Allocation rules (CC-016)

The allocation layer (Q-S3 money, Q-E1 energy) is governed by a separate canon doc — `docs/canon/allocation-rules.md` — which codifies four rules: stated-vs-spent values, direction-not-quality, current-vs-aspirational tension, and non-accusatory interpretation.

The allocation rules are subordinate to the result-writing canon's existing rules: hedging vocabulary, protected lines, no moralization, no clinical implication. Where the allocation rules and the result-writing canon disagree, the result-writing canon wins.

| Canonical rule | Code-level surface |
|---|---|
| Allocation rules (CC-016) | `lib/identityEngine.ts` (`signalsFromDerivedRanking`, `detectAllocationOverlayTensions`, T-013/T-014/T-015 detection blocks); `app/components/Ranking.tsx` (per-category three-state overlay UI); `app/components/MirrorSection.tsx` (Allocation Gaps section) |

---

## BeliefUnderTension simplification (CC-017)

The Keystone Reflection block (Q-I1 / Q-I1b / Q-I2 / Q-I3) was restructured in CC-017 from a freeform belief stress-test with heuristic text-mining into an **anchor + cross-card structured stress-test**. See `docs/canon/keystone-reflection-rules.md` for the full architectural rules. The result-writing canon updates that affect prose generation:

- **`BeliefUnderTension` simplifies from five dimensions to three** — `value_domain` (derived from Q-I3 selections), `epistemic_posture` (derived from Q-I2 selections), `conviction_temperature` (derived from Q-I2 + Q-I3 combined cardinality). The CC-015c heuristic-derived `disagreement_context` and `social_cost` dimensions are retired; structured-source confidence is implicit so the per-tag `*_confident` and `*_user_confirmed` flags are deleted.
- **Mirror prose for Keystone Reflection renders shorter** — three populated lines (or fewer when a dimension is `unknown` because its source question was skipped) instead of the prior five hedged lines. Confidence is implicit in the structured source, so the *"the wording suggests"* hedging shifts to *"your selections place this belief inside …"* register. The CC-015c protected closing lines stay verbatim.
- **Case C fallback prose** — when neither Q-I1 nor Q-I1b was answered, the Mirror's Keystone section renders a single line: *"You did not name a belief in this session. The model leaves space for that — what you'd say here is your own."* This degenerate case should not be reachable through normal UI flow given Q-I1b's unskippable constraint, but the engine handles it defensively. Implemented as `noAnchorLine()` in `lib/beliefHeuristics.ts`.
- **The four catalog signals from Q-I1 freeform content** (`independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness`) **continue to fire unchanged** via `extractFreeformSignals`. They live on `Signal[]` — a different abstraction layer from `BeliefUnderTension`. Both surfaces consume the same Q-I1 content for different shapes. Preserved for v0 → v1 LLM-substitution continuity.

| Canonical rule | Code-level surface |
|---|---|
| BeliefUnderTension three-dimension shape (CC-017) | `lib/types.ts` (`BeliefUnderTension` type); `lib/beliefHeuristics.ts` (`extractBeliefUnderTension`, `generateBeliefContextProse`, `noAnchorLine`); `app/components/KeystoneReflection.tsx` (3 tag rows panel) |
| Q-I1b unskippable conditional (CC-017) | `lib/types.ts` (`render_if_skipped` + `unskippable` on `ForcedFreeformQuestion`); `app/page.tsx` (conditional-render effect); `app/components/QuestionShell.tsx` (`unskippable` prop gates `skipVisible`) |

---

## CC-022b prose primitives (added 2026-04-26)

CC-022b extends the prose-generation layer with five new primitives. All are additive — the protected lines from earlier CCs stay verbatim. Each primitive consumes the user's demographics where appropriate (per the amended `demographic-rules.md` Rule 4) and falls back gracefully when demographics are absent.

### Primitive 1 — Name threading

The user's specified name is woven into anchor sentences in Mirror prose and Map card prose. Implementation: `nameOrYour(demographics, asSubject?)` and `getUserName(demographics)` helpers in `lib/identityEngine.ts`. Conservative substitution helpers `nameThreadFirstYour(text, d)` and `nameThreadFirstYou(text, d)` apply at render time to anchor sentences (Core Pattern opener, What Others Experience, When the Load Gets Heavy).

**Frequency target**: ~1-2 name uses per Mirror section, ~3-4 per Map card. Over-saturation reads as forced; under-use leaves the read impersonal.

**Fallback rule**: every name-threaded sentence MUST read cleanly when `getUserName` returns null. The threading helpers are no-ops on null name; the resulting prose uses the original *"Your"* / *"You"* form.

### Primitive 2 — Demographic interpolation

Profession, marital status, and age decade interpolate into already-relevant prose surfaces:

- **Profession in Path · Gait Work** (highest-impact). `professionWorkHook(demographics, dom)` returns a sentence keyed by profession option + dominant Lens function. 12 professions × 8 functions; per-function trail completions are pre-authored.
- **Marital status in Path · Gait Love** (lighter touch). `maritalStatusLoveHook(demographics)` returns a sentence for `married` / `partnered` / `single`; skips for `divorced` / `widowed` unless prose is already structurally about the relational past.
- **Age decade in Weather** (lightest touch). `ageWeatherHook(demographics)` references the formation context.

**Hard rules**: interpolation reflects user-supplied facts; never infers; never asserts cultural-archetype claims; respects field state (only `specified` permits interpolation).

### Primitive 3 — Keystone Reflection selection citation

`generateBeliefContextProse(belief, valuesPhrase, answers?, demographics?)` extends the CC-017 three-dimension prose with **selection-citation paragraphs** when the user's Q-I2 / Q-I3 answers are available. The user sees their own self-named priorities reflected back by source-question label (their top-3 trust sources from Q-X3 + top-3 from Q-X4; their top-3 sacred drivers from Q-S1 + top-3 from Q-S2).

`summarizeQI2Selections(answers)` and `summarizeQI3Selections(answers)` (in `lib/beliefHeuristics.ts`) walk the saved `Answer[]` and produce `SelectionSummary` objects with `selectedLabels`, `noneSelected`, `topAvailable`, `hasOther`.

**Q-I3 None-selected prose** (post-CC-024): when the user marks None on Q-I3, the prose reads cleanly because Q-I3 now derives from Q-Stakes1's concrete loss domains (not from sacred values). The prose acknowledges the refusal as informative — *"the belief sits inside what your answers protect, not what they would willingly trade."* The pre-CC-024 structural-acknowledgment hedge (*"sacred values, by definition, are not things you would freely sacrifice"*) was retired by CC-024 (shipped 2026-04-27) and is no longer needed; the verb-noun composition is now coherent.

**Backward compatibility**: when `answers` is omitted (older sessions, callers without context), the function falls back to the CC-017 generic dimension-label posture line. Older saved sessions render cleanly.

### Primitive 4 — Cross-card patterns

A new prose-layer registry. See `cross-card-patterns.md` for the architectural primitive, the initial 12-pattern catalog, and the composition-check rule. Patterns are detected at prose-generation time via `detectCrossCardPatterns(...)` and rendered by `MapSection.tsx` as per-card "Pattern observation" blocks.

### Primitive 5 — Simple Summary

`generateSimpleSummary(constitution, demographics?)` in `lib/identityEngine.ts` produces a closing synthesis section at the end of the Mirror. Three structural closing patterns:

#### A. *"To keep X without Y"* parallel lines

3-4 lines drawn from per-card outputs (Top 3 Gifts × Top 3 Traps). The parallel structure makes each gift/trap pair land as a single observation rather than two separate items. Implementation: `buildKeepWithoutLines(constitution)`.

#### B. *"{Name's} gift is X. {Name's} danger is X {temporal}"* compression

Same-noun compression keyed to the user's dominant Lens function. The capability is gift and danger; only a temporal qualifier ("too early," "for too long," "without testing," "instead of...") creates the inversion. The reader cannot disagree with the gift without disagreeing with the danger — they're the same machinery viewed at different moments.

Per-function templates (8 lines, one per cognitive function) live in `GIFT_DANGER_LINES` in `lib/identityEngine.ts`. Examples:

- **Ni dominant**: *"Your gift is the long read. Your danger is believing the long read too early."*
- **Te dominant**: *"Your gift is operational clarity. Your danger is operational clarity before the goal has been examined."*
- **Fe dominant**: *"Your gift is attunement. Your danger is attunement instead of authorship."*

The compression must feel earned. Generic *"your gift is X / your trap is unrelated Y"* does not carry the same weight. The template is **gift-and-failure-of-the-same-machinery**, not gift-then-unrelated-trap.

#### C. *"Not X, but Y"* one-line thesis

Final beat. Captures the user's shape + the growth-edge inversion in compressed form. The X is what the user might assume the answer is (*"care more,"* *"speak up more,"* *"try harder"*); the Y is the more specific structural answer drawn from cross-card patterns + per-card outputs.

The *"not X, but Y"* construction names what the user might assume the answer is and corrects it. That's what gives the line weight. Most personality writing says *"your growth move is to be more legible."* This construction says *"the growth edge is not caring more, but translating."* The inversion is what lands.

Templates live in `THESIS_TEMPLATES` (keyed by dominant function × top compass signal_id) with per-function fallbacks in `THESIS_FALLBACK_BY_FUNCTION`. Pre-authored 16+ specific (function, compass) combinations; falls back to the per-function template when no specific pairing matches.

### Architectural separation reminder

All five primitives run at **render time**, not at derivation time. The InnerConstitution stored in the database remains demographic-blind (acceptance criterion #8: two sessions with identical answers + different demographics produce byte-identical InnerConstitution structures). Two users with identical answers see the same Map card outputs, the same Mirror sections, the same tensions — and only the surface threading (name, demographic interpolation, cross-card patterns, Simple Summary) differs.

This separation is structural and load-bearing for the canon. Future additions to the prose layer should preserve it.

---

## CC-025 — 4-Section ShapeCard Architecture (added 2026-04-26)

CC-025 restructures every ShapeCard from 3 sections to 4 (Strength / Growth Edge / Practice / Pattern Note), softens Mirror + Tension prose, and adds a "How to Read This" preamble. The 4-section change solves the per-card duplication problem at architecture rather than at variant count: when each card carries a card-register-specific Practice and a distinctive Pattern Note keyed to its body-part metaphor, identical body text across two cards becomes structurally impossible regardless of which gift category the user landed in.

### Section labels

The Map card body now reads in this order:

1. **Strength** — unchanged from prior CC.
2. **Growth Edge** — was *Trap*. Same body text source; renamed for editorial register only.
3. **Practice** — was *Next move*. Replaced with a per-card register-keyed template (see table below).
4. **Pattern Note** — new. Aphoristic closing line keyed to each card's body-part metaphor; rendered with `aphorism` variant styling (italic, slightly smaller, em-dash separator above; visually distinct from body cells).

The Conviction card has no Practice slot — *Posture* occupies that position because it does the equivalent register work. Path is name-narrative-shaped; its Pattern Note appends to the existing PathExpanded body.

### Canonical Practice text per card

Fixed templates, no signal interpolation. Locked at the canon layer:

| Card | Practice text |
|---|---|
| **Lens · Eyes** | *"Before acting, ask: What is this moment connected to? What happened before, and what will this choice create next?"* |
| **Compass · Heart** | *"When values collide, say the tradeoff out loud: I am trying to protect both of these goods, but this moment requires an order."* |
| **Conviction · Voice** | *(Posture occupies this slot.)* |
| **Gravity · Spine** | *"Ask: What part is mine? What part belongs to another person? What part belongs to circumstance, system, limitation, or mystery?"* |
| **Trust · Ears** | *"Separate three questions: Who do I trust for facts? Who do I trust for wisdom? Who do I trust because they love me?"* |
| **Weather · Nervous System** | *"Notice which patterns remain when the load eases. Those are more likely to be shape. The others may be weather."* |
| **Fire · Immune Response** | *"Before paying a price, ask: Is this the right cost, for the right value, in the right way, at the right time?"* |
| **Path · Gait** | *"Choose one long-arc commitment that protects what matters most without depending on urgency: a recurring conversation, a standing act of generosity, a weekly planning ritual, or a relationship practice that continues when no one is asking."* |

### Canonical Pattern Note text per card

Aphoristic closing line per card, keyed to each card's architectural truth. Locked at the canon layer:

| Card | Pattern Note |
|---|---|
| **Lens · Eyes** | *"Your growth is not to abandon action. It is to let context travel with action."* |
| **Compass · Heart** | *"Your values are strongest when they remain chosen priorities, not defended reflexes."* |
| **Conviction · Voice** | *"Conviction becomes more beautiful when it is strong enough to speak plainly and humble enough to listen carefully."* |
| **Gravity · Spine** | *"A strong spine does not carry every load. It carries the right load."* |
| **Trust · Ears** | *"Discernment improves when trusted voices have different jobs rather than equal authority over everything."* |
| **Weather · Nervous System** | *"This card protects the whole report from overclaiming. State is not the same as self."* |
| **Fire · Immune Response** | *"Courage with calibration is stronger than courage alone."* |
| **Path · Gait** | *"Your growth path is not to become less present. It is to let presence develop a memory and a future."* |

These solve the per-card duplication problem at architecture: Lens's Pattern Note ("let context travel with action") cannot collide with Trust's ("trusted voices have different jobs") because each is keyed to its body-part metaphor, not to a gift category. Adding more gift categories or new variants does not reintroduce the collision.

### Per-card register-aware Growth Edge variants

Where the existing `BLIND_SPOT_TEXT_VARIANTS[gift-category]` produces wrong-register text on a specific card, a card-keyed override is added inside the relevant `derive*Output` function. The named case from CC-025:

- **Conviction Growth Edge for action-class gifts** uses *"The risk is that deeply held belief can become less available for conversation. When conviction has already chosen its room, it may stop checking whether the door should remain open."* — not the action-momentum variant.

The pattern (override at the derive function, not at the variant table) follows CC-023's `BLIND_SPOT_TEXT_VARIANTS.Advocacy` shape but applies a single targeted override rather than a per-card variant pool. Future register-fix cases follow the same shape.

### "How to Read This" preamble

A small framing paragraph at the top of every Mirror, between the lead and Core Pattern. Sets reader disposition before any specific claim. Same paragraph for every report — no interpolation. Locked text:

> *"This profile is not meant to define you from the outside. It is meant to give language to a pattern your answers suggest: how you notice reality, what you protect, who you trust, where responsibility tends to land, and how your gifts behave when life puts pressure on them.*
>
> *The model proposes. You confirm. The most useful reading is not the one that flatters you or corners you. It is the one that helps you become more grounded, more honest, more legible, and more free inside the person you already are."*

### Mirror header rename

*"Your Top 3 Traps"* → *"Your Top 3 Growth Edges"*. Body content unchanged. The body source is still `mirror.topTraps` on the InnerConstitution; only the surface label changes.

### Pronoun register

Mirror body sections (Core Pattern, What Others May Experience, When the Load Gets Heavy) pin to second-person throughout. Name-threading is reserved for the Synthesis section, where the parallel-line close benefits from naming the user. Map card body prose (Path, Compass, etc.) keeps name-threading where existing CC-022b primitives already wove it in.

### Path · Gait Love compression

Each Path Love subsection ends with a one-line compression closer keyed to the user's dominant cognitive function:

> *"For you, love may mature through {distillation}."*

Per-shape distillation map (`PATH_LOVE_DISTILLATION` in `lib/identityEngine.ts`):

| Dominant | Distillation |
|---|---|
| Ni | expression |
| Ne | staying |
| Si | responsiveness |
| Se | continuity |
| Ti | warmth |
| Te | stillness |
| Fi | constancy |
| Fe | self-disclosure |

CC-025 ships Love only. Work + Give compression closers are queued for a follow-up CC.

### Implementation map (CC-025)

| Canonical rule | Code-level surface |
|---|---|
| 4-section card architecture | `lib/types.ts` (`patternNote` on `FullSwotOutput` / `ConvictionOutput` / `PathOutput`); `lib/identityEngine.ts` (`SHAPE_CARD_PRACTICE_TEXT`, `SHAPE_CARD_PATTERN_NOTE` maps + per-derive-function wiring); `app/components/ShapeCard.tsx` (4 cells per `full-swot` body, aphorism variant Cell); `lib/renderMirror.ts` (4-section markdown export) |
| Per-card register-aware Growth Edge | `lib/identityEngine.ts` (`deriveConvictionOutput` action-register override) |
| "How to Read This" preamble | `app/components/MirrorSection.tsx`; `lib/renderMirror.ts` |
| Top 3 Growth Edges rename | `app/components/MirrorSection.tsx`; `lib/renderMirror.ts` |
| Allocation Gap softened template | `lib/identityEngine.ts` (T-013/T-014/T-015 `user_prompt` strings); `app/components/MirrorSection.tsx` (`whiteSpace: pre-line` on allocation prose); `app/components/TensionCard.tsx` (`whiteSpace: pre-line` on `user_prompt`) |
| Keystone closed-revision softening | `lib/beliefHeuristics.ts` (`temperatureLine`, `postureLine`, `qi2CitationLine`) |
| Open Tensions named-not-numbered | `app/components/TensionCard.tsx` (header T-### removed); `lib/renderMirror.ts` (Open Tensions heading uses `t.type` only); `lib/identityEngine.ts` (T-012 / T-014 / T-015 `type` strings updated to descriptive UI names) |
| T-015 collapse threshold (2+) | `lib/identityEngine.ts` (`detectAllocationOverlayTensions` synthesis path triggers at length ≥ 2) |
| Pronoun register pin | `app/components/MirrorSection.tsx` (`nameThreadFirstYour` / `nameThreadFirstYou` removed from body sections) |
| Path Love compression | `lib/identityEngine.ts` (`PATH_LOVE_DISTILLATION` map + `generatePathExpansion` Love closer) |

---

## Report Calibration Canon (CC-048, added 2026-04-29)

Real-user calibration on the 2026-04-29 report (Clarence's review) surfaced ten authoring rules that, taken together, name the discipline distinguishing a *directional mirror* from a *precision instrument*. The architecture (Lens / Compass / Drive / OCEAN / aux-pair register / Work Map / Love Map / Giving Map) was validated as accurate; the *furniture* (label specificity, generic gift phrasing, reusable growth-edge phrases, cautious allocation prose, framework-as-section-label visibility) was identified as the calibration gap.

These ten rules are the canon authority for prose-rewrite work. The audit at `docs/audits/report-calibration-audit-2026-04-29.md` flags specific code-level violations; subsequent prose-rewrite CCs (CC-049+) inherit the audit findings clustered by rule.

**Architecture-vs-furniture protection.** These rules are about *furniture*. The architecture (8 ShapeCards, three layered registers Mirror / Map / Path, the Disposition / Work / Love / Giving Maps as derivation outputs) stays. If a rule seems to push toward architectural change, surface as a workshop question rather than committing.

### Rule 1 — Frameworks behind the scenes

**Rule:** *"Jungian"*, *"OCEAN"*, *"3 C's"*, *"aux-pair register"*, *"Pauline framing"*, *"Greek bond types"* never surface as section labels or as named references in user-facing prose. The user sees the Mirror / Map / Path layers; frameworks inform the prose without naming themselves.

**Rationale:** The user is not taking a personality test about cognitive function theory. They are taking an instrument that proposes who they appear to be. Surfacing framework names turns the report into *"a graduate seminar wearing a personality-test costume"* (Clarence's phrase). The frameworks do their work as backend; the user reads sentences, not labels.

**Violation example:** A section header reading *"OCEAN Disposition Map"* or prose containing *"Your Big-5 profile shows..."* or *"In Jungian terms, you are a pattern-reader..."*.

**Adherence example:** Section header *"Disposition Map"* (without OCEAN reference) — or better, integrate the disposition reads into Mirror prose without the chart having its own section header. Prose: *"Your appetite for ambiguity shows up in the kinds of frames you build"* (high-O behavioral anchor) instead of *"Your high openness (38%) suggests..."*.

**Scope of application:** Every section header in the rendered report. Every prose template in `lib/identityEngine.ts`, `lib/freeformProse.ts`, `lib/workMap.ts`, `lib/loveMap.ts`, `lib/ocean.ts`. The rule explicitly governs whether OCEAN appears as a standalone section (Disposition Map) or weaves through other sections — see Rule 6 for the resolution.

**CC-065 amendment (2026-05-02) — OCEAN Rule 1 closure.** Three user-facing OCEAN surfaces shipped with framework-name leaks per the CC-048 audit (Rule 1 cluster in `lib/ocean.ts`, `app/components/OceanBars.tsx`, `app/components/InnerConstitutionPage.tsx`). CC-065 strips all three:

- `app/components/InnerConstitutionPage.tsx` Disposition Map framing paragraph: *"Big-5 personality dimensions, derived from how you answered other questions in this instrument. No single answer determines a dimension..."* → *"Disposition tendencies, derived from how you answered other questions in this instrument. No single answer determines a tendency..."* (substitutions: *"Big-5 personality dimensions"* → *"Disposition tendencies"*; *"determines a dimension"* → *"determines a tendency"*).
- `app/components/OceanBars.tsx` aria-label: *"Big-5 disposition distribution: ..."* → *"Disposition distribution: ..."* (drops *"Big-5"*; screen-reader announcement now matches the visible *"Disposition Map"* register).
- `lib/ocean.ts` n-elevated case prose: *"...signals that often correlate with Big-5 Neuroticism. Treat this as an estimate; the instrument measures these dimensions indirectly..."* → *"...signals worth treating as an estimate, since the instrument measures this register indirectly..."* (closes the framework-name leak; preserves the load-bearing *"estimated"* caveat in compressed form; *"strongest dimension"* → *"strongest tendency"*).

Section structure unchanged — the Rule 6 render-position relocation (Disposition Map → into Mirror layer) and the percentage-anchoring rework remain queued for the future OCEAN-as-Texture CC. The `(estimated)` parenthetical on the N axis subscript per CC-037 canon is unchanged (load-bearing per `feedback_minimal_questions_maximum_output.md`). Other OCEAN case prose (single-dominant / two-dominant / balanced at `lib/ocean.ts:309-313`) remains untouched — those carry Rule 6 violations (percentage anchoring + framework-architecture meta-prose), not Rule 1 leaks. Developer-facing comments in `lib/ocean.ts:1-30, 243` and `OceanBars.tsx:5-7, 142` and `InnerConstitutionPage.tsx:288` preserve the framework references per the Rule 1 carve-out for code comments. The 3 OCEAN Rule 1 audit findings are marked RESOLVED in `docs/audits/report-calibration-audit-2026-04-29.md`.

**CC-059 amendment (2026-05-01) — Love Map closure.** The 7 `characteristic_distortion` fields and 2 `short_description` fields in `lib/loveMap.ts` § `LOVE_REGISTERS` shipped with framework-name leaks at CC-044 (literal *"Pauline diagnostic: ..."* trailers and *"Fi-driver"* / *"Ne-driver"* typological codenames). CC-059 ships 9 locked plain-language replacements that paraphrase the Pauline qualities without naming the framework and rename the typological references as register-shape descriptions. The aux-pair register's cognitive-function routing stays in canon docs (`function-pair-registers.md`) and engine code (the `composes_naturally_with` field on each `LoveRegister`); user-facing string content is now framework-clean. The locked Pauline-frame paragraph above the Love Map render at `app/components/InnerConstitutionPage.tsx:457` is unchanged — already framework-clean per CC-044's design. Inline developer-facing comments in `lib/loveMap.ts` (lines 19-44) preserve canonical Pauline references per the Rule 1 carve-out for canon docs and code comments. See `docs/canon/love-map.md § CC-059 amendment` for the full rewrite list.

### Rule 2 — Generic gifts need user-specific second sentences

**Rule:** Every gift-category description in user-facing prose must include a second sentence that anchors the generic gift to the user's actual signal pattern. The first sentence names the category; the second sentence names *what this user's version of it does*.

**Rationale:** Generic gift labels (Discernment, Pattern, Integrity) flatter without informing. Most users would accept *"You have discernment"* as plausible; the report needs to earn the assertion by naming the discriminating signal pattern. *"Anomaly-detection across moral, strategic, and linguistic patterns when truth_priority and knowledge_priority both rank top-3"* is observation; *"Discernment"* alone is horoscope.

**Violation example:** *"A discernment gift. — You tend to detect what doesn't add up before it surfaces openly."* (Generic; reusable for any user with any Discernment route.)

**Adherence example:** *"A discernment gift. — You tend to detect what doesn't add up before it surfaces openly. For your shape, this expresses as anomaly-detection across moral, strategic, and linguistic patterns — noticing when language doesn't match reality, when an incentive doesn't match a stated objective, when a structure can't produce a promised outcome."* (Anchored to truth + knowledge + responsibility-attribution + structural-thinking signals.)

**Scope of application:** The 12 entries in `GIFT_DESCRIPTION` (`lib/identityEngine.ts:2114-2127`). Each entry's prose composition needs a per-user second sentence keyed to the user's signal pattern. The composition logic lives wherever Top 3 Gifts are rendered; the second sentence draws from whatever signals fired the gift category for this user.

**CC-052 amendment (2026-04-30) — GIFT_DESCRIPTION Rule 2 implementation shipped.** The 12 GIFT_DESCRIPTION entries now compose with a user-specific Sentence 2 anchor selected by the `getGiftSpecificity` selector function in `lib/identityEngine.ts`. Each category carries 2-4 candidate Sentence 2 conditions in priority order (most-specific signal-pattern condition first, no-discriminator fallback last). The composition pattern is `[generic register-naming first sentence]. For your shape, this expresses as [user-specific anchor].` The *"For your shape, this expresses as "* prefix is canonical and locked. Future Rule 2 implementations on other surfaces (`THESIS_FALLBACK`, `lib/workMap.ts`, `lib/loveMap.ts`) follow the same architectural pattern with surface-specific Sentence 2 candidate logic. The audit document at `docs/audits/report-calibration-audit-2026-04-29.md` marks the 12 `GIFT_DESCRIPTION` findings as resolved by CC-052; the other 20 Rule 2 violations remain open for follow-on rewrite CCs.

### Rule 3 — Generic growth edges need user-specific second sentences

**Rule:** Every growth-edge phrase in user-facing prose must include a second sentence that anchors the generic edge to the user's actual signal pattern. *"Integrity becoming rigidity"* alone is reusable; the report needs the second sentence that names what *this user's* rigidity looks like.

**Rationale:** Growth-edge phrases are even more reusable than gift labels. *"Cynicism"*, *"pre-judgment"*, *"weather mistaken for shape"*, *"integrity becoming rigidity"* could appear in nearly any report. The second sentence is what makes them earn their place in this report.

**Violation example:** *"Pattern certainty becoming private fact. — Under ordinary pressure, the pattern-reader narrows the lens until certainty starts to feel like fact, while the present-tense self surfaces in cruder form."* (Generic; reusable for any pattern-reader user.)

**Adherence example:** *"Pattern certainty becoming private fact. — Rigidity for your shape isn't merely stubbornness. It's when a long-range read becomes morally fused before the room has caught up — the pattern feels obvious to you and premature to them, and you arrive at the conclusion before others can see the bridge you crossed."* (Anchored to long-arc reading + structural-thinking + holds_internal_conviction signals.)

**Scope of application:** The 12 entries in `GROWTH_EDGE_TEXT` (`lib/identityEngine.ts:2129-2142`). The 12 entries in `BLIND_SPOT_TEXT_VARIANTS`. Possibly the per-card Growth Edge sentences in the eight ShapeCard outputs.

**CC-061 amendment (2026-05-01) — `GROWTH_EDGE_TEXT` + `BLIND_SPOT_TEXT_VARIANTS` Rule 3 implementation shipped.** `getBlindSpotSpecificity` in `lib/identityEngine.ts` returns user-specific Sentence 2 anchors keyed to dominant-function + Compass / Gravity / agency / aux-pair signal patterns. The selector walks 12 GiftCategory branches; each branch tests 2 priority-ordered conditions and falls through to a no-discriminator fallback. The composition pattern is `[generic Sentence 1] [Sentence 2 with locked PREFIX]`. The live locked prefix is *"For your shape, this blind spot expresses as "* — exported from `lib/identityEngine.ts` and consumed by `lib/humanityRendering/contract.ts § extractBlindSpotAnchorsFromText` so anchors lift into `lockedAnchors[]` for polish round-trip validation. Per CODEX-058b, conditions do not gate on `gift_category` (the entry is itself routed by category); they gate on `dom`, Compass top-5 membership, Gravity-set membership, `agency.current === "creator"`, and PascalCase `pair_key` (e.g., `NiTe`). The 24 audit findings on `GROWTH_EDGE_TEXT` (12) and `BLIND_SPOT_TEXT_VARIANTS` (12) remain marked RESOLVED because the user-facing "Growth Edge" cell is the blind-spot composition path per CC-025's ShapeCard field inversion. The 8 `SHAPE_CARD_PRACTICE_TEXT` and 6 `GIFT_DANGER_LINES` Rule 3 findings remain open for follow-on CCs per the audit's CC-051 split.

**CODEX-061b amendment (2026-05-01) — dead growth-edge half stripped per workshop Path β.** CC-061 originally shipped a parallel `getGrowthEdgeSpecificity` selector and 36 additional locked anchors under the prefix *"For your shape, this growth edge expresses as "*, but CC-025's architecture voids `growthText` on every card path and renders `output.growthEdge.text` as the user-visible Practice cell via `SHAPE_CARD_PRACTICE_TEXT`. Those 36 anchors were dead code. CODEX-061b removes the dead half and preserves the live half: 36 user-facing blind-spot anchors continue to close the 12 `GROWTH_EDGE_TEXT` and 12 `BLIND_SPOT_TEXT_VARIANTS` Rule 3 findings through the user-visible "Growth Edge" cell. Path β locked by Jason on 2026-05-01.

**CC-061 surface-flow note (post-CODEX-061b).** The blind-spot composition flows end-to-end: each card's `blindSpot.text` now reads as `[Sentence 1 from BLIND_SPOT_TEXT_VARIANTS] [Sentence 2 anchor]`, rendered in `ShapeCard.tsx`'s "Growth Edge" cell (which CC-025 wired to `output.blindSpot.text`) and in `lib/renderMirror.ts`'s **Growth Edge** markdown line. `growthEdge.text` remains the per-card `SHAPE_CARD_PRACTICE_TEXT` surface, and `growthText` remains voided in every card path per CC-025. CODEX-061b strips the dead growth-edge-specificity half rather than carrying forward-prepared hidden anchors against the voided field.

### Rule 4 — Allocation-gap names the 3C's-specific question

**Rule:** The allocation-gap section in user-facing prose names the sharper 3C's-specific question rather than retreating to *"this may or may not mean anything."* The question varies by which bucket the user leans toward: cost-leaning users get the maintenance-vs-creation question; coverage-leaning users get the relational-presence question; compliance-leaning users get the protection-vs-paralysis question.

**Rationale:** The current allocation-gap prose is too cautious. Multiple disclaimers (*"this may or may not mean anything"*, *"the model cannot know motive"*, *"it could mean exhaustion, a difficult season..."*) make the section feel like it's apologizing for itself. The 3C's framework is one of the instrument's strongest differentiators; the prose should honor that with a sharp question rather than diluted hedging.

**Violation example:** *"You named Knowledge as among your most sacred values. Your money appears to flow mostly to family and yourself. That does not mean hypocrisy. The model cannot know motive. It could mean: exhaustion, a difficult season, needed self-care, social bonding, old habits, or a real gap between stated priority and lived allocation. The only fair question is: does this feel true, partially true, or not true at all?"* (Three sentences of disclaimer, one sentence of question.)

**Adherence example (cost-leaning user):** *"You named Knowledge as among your most sacred values. Your money flows mostly to family and yourself; your protected hours flow mostly to maintenance. The 3 C's question for your shape is sharper than 'do you donate enough to Knowledge causes?' It is whether your protected hours, creative output, and strategic attention are moving toward the future you say matters — or whether maintenance is consuming the life that was supposed to build it. Does this feel true, partially true, or not true at all?"*

**Scope of application:** The Allocation Gaps section composition (`lib/identityEngine.ts` or `lib/freeformProse.ts`; locate via grep on *"allocation"* or the literal current text). The composition needs to read which Drive bucket the user leans toward and select the matching sharp question.

**CC-060 amendment (2026-05-01) — Rule 4 implementation shipped.** The selector function `getAllocationSharpQuestion(tensionId, valueLabel, driveOutput)` in `lib/identityEngine.ts` returns one of 12 locked sharp-question templates (3 tensions × 4 bucket cases) selected by the user's Drive bucket lean. Wired at all three allocation-tension call sites: T-013 (Sacred Words vs Sacred Spending, money-flow), T-014 (Words and Energy, energy-flow), and T-015 (Current vs Aspirational Allocation — both the synthesis-collapse case and the per-instance case in `detectAllocationOverlayTensions`). Each call site now composes prefix + bucket-keyed sharp question + close (3-state question for T-013/T-015; embedded candidate-move close for T-014). The multi-disclaimer hedging block (*"That does not mean hypocrisy. The model cannot know motive. It could mean: exhaustion..."*) is removed across all three; `grep "That does not mean hypocrisy" lib/identityEngine.ts` returns zero hits.

**Drive case-key resolution (CC-060 implementation note).** The original CC-060 prompt assumed `DriveCase` emitted `cost-leaning / coverage-leaning / compliance-leaning / balanced` strings. The actual `DriveCase` type in `lib/types.ts` emits matrix-tension cases (`aligned / inverted-small / inverted-big / partial-mismatch / balanced / unstated`), which represent the claimed-vs-revealed relationship per CC-026, not the bucket lean. CC-060 therefore implemented `classifyAllocationBucket(driveOutput)` to read `driveOutput.distribution.cost / coverage / compliance` percentages directly — the same pattern `lib/workMap.ts § isCostLeaning` and `lib/loveMap.ts § isCostLeaning` use. Threshold ≥ 38% with max-bucket-wins; balanced fallback when no bucket clears the threshold or when `driveOutput` is undefined.

**The 12 locked sharp-question templates** ship verbatim in `lib/identityEngine.ts § ALLOCATION_SHARP_QUESTIONS`. Tonal calibration tweaks land in a follow-on (CC-060-prose) only if browser-smoke surfaces a specific landing problem.

### Rule 5 — Every report includes at least one uncomfortable-but-true sentence

**Rule:** Every report contains at least one observation the reader recognizes as probably true but doesn't enjoy reading. Prevents the report from sliding into pure flattery.

**Rationale:** Clarence's review: *"every report needs at least one sentence the user may not enjoy reading but recognizes as probably true."* Without this, the report becomes a *"flattering enough to share"* artifact rather than a tool for self-knowledge. The uncomfortable-but-true sentence is what distinguishes the instrument from a horoscope.

**Violation example:** A report with no observation that lands as a corner the reader didn't enjoy. The Jason0429 report on 2026-04-29 was flagged as flattering-throughout by Clarence; its closest approach to uncomfortable-but-true is the growth-edge section, but those phrases are too reusable to register as personal correction.

**Adherence example (for a long-arc-pattern-reader user):** *"You can confuse having absorbed more context with having earned more authority to conclude."* Or: *"You sometimes treat translation as optional because the pattern feels obvious to you."* (Both Clarence's examples for the Jason0429 read.)

**Scope of application:** A new structural slot in the Mirror layer — likely adjacent to the golden sentence ("Your gift is the long read. Your danger is believing it too early"). Each user gets a per-user uncomfortable-but-true sentence composed from their strongest tension between aspiration and current state. The composition logic is its own follow-on (CC-053 in the prose-rewrite track).

**CC-058 amendment (2026-05-01) — Rule 5 implementation shipped.** The selector function `getUncomfortableButTrue(constitution, ctx)` in `lib/identityEngine.ts` returns one of 8 locked sentences keyed by tension class, or `null` (silent — render no slot) when no condition matches. **Silence is the canonical fallback;** the report ships no generic-fallback sentence rather than risk a horoscope reading. Wired into `MirrorOutput` via the new optional field `uncomfortableButTrue?: string | null`; rendered in `app/components/MirrorSection.tsx` immediately after the golden sentence (italic + ink-mute), and in `lib/renderMirror.ts` as an italic-wrapped single paragraph in the markdown export. Joined to the polish layer's `lockedAnchors` array via `lib/humanityRendering/contract.ts § buildEngineRenderedReport` so the sentence survives polish round-trips verbatim per the Path C contract (CC-057a).

**CODEX-058b amendment (2026-05-01) — gift_category gates dropped from 6 of 8 conditions.**

Workshop review of CC-058's ship-report surfaced that 6 conditions gated on `gift_category` (an aux-pair-routed label), which over-narrowed selection. `gift_category` is derived from FUNCTION_PAIR_REGISTER and may not match the dominant-function register a condition tests for — concrete: Jason0429 is Ni-dom + knowledge_priority + truth_priority (the canonical context-vs-authority user-shape) but his NiTe aux-pair routes to `gift_category: "Builder"`, which failed condition 1's `Pattern || Discernment` gate. CODEX-058b drops the `gift_category` clause from conditions 1, 4, 5, 6, 7, 8. Conditions 2 and 3 had no `gift_category` gate and are untouched. Each condition's design intent is preserved: select on dominant function + cross-signal Compass / energy / Drive discriminator alone. Locked sentences ship verbatim across the workshop fix.

**The 8 locked tension classes + sentences** (verbatim canon):

| # | Class | Condition (post-CODEX-058b) | Locked sentence (unchanged) |
|---|---|---|---|
| 1 | `context_vs_authority` | Ni-dom + (knowledge OR truth in Compass top 5) | *"You can confuse having absorbed more context with having earned more authority to conclude."* |
| 2 | `pattern_vs_translation` | (Ne OR Ni) + (freedom in top 5 OR learning_energy rank ≤ 2) AND condition 1 didn't match | *"You sometimes treat translation as optional because the pattern feels obvious to you."* |
| 3 | `claim_vs_allocation` | Drive case ∈ {inverted-small, inverted-big} OR allocation-tension firing (T-013/T-014/T-015) | *"You can claim what you haven't yet allocated toward — and the gap between what you name and what your week actually pays for is part of your shape, not a verdict against it."* |
| 4 | `conviction_vs_rigidity` | Fi-dom + (holds_internal_conviction firing OR truth_priority in Compass top 3) | *"You can confuse what feels true to you with what is true — and the conviction that protects you from social weather is the same conviction that, in the wrong moment, refuses the correction you'd otherwise welcome."* |
| 5 | `builder_vs_pause` | Te-dom + (creator-agency firing OR system_responsibility_priority in Compass top 5) | *"You can build past the point where the structure has stopped serving the people inside it — and momentum can feel like rightness when it is sometimes just inertia."* |
| 6 | `caretaker_vs_self` | Fe-dom + (family_priority in Compass top 5 OR caring_energy rank ≤ 2) | *"You can carry the room until the people in it stop seeing what carrying it costs you — and your read of what others need can quietly displace your read of what you need."* |
| 7 | `action_vs_direction` | Se-dom + (freedom_priority in Compass top 5 OR restoring_energy rank ≤ 2) | *"You can mistake speed for direction — the body knows the situation by being in it, and that knowing can sometimes outrun the question of whether the situation is worth being in."* |
| 8 | `stewardship_vs_stagnation` | Si-dom + (stability_priority OR honor_priority in Compass top 5) | *"You can mistake guarding what you've kept for refusing what you'd grow into — and continuity, which is your real gift, can quietly become the reason a needed change doesn't happen."* |

**Tone register canon** (locked alongside the sentences themselves):

- Observational, not condemning. *"You can…"* / *"You sometimes…"* — names the pattern's failure mode without indicting the user.
- Adjacent to the gift, not opposite to it. Per `shape-framework.md`'s anchor line: *"Your blind spot is not the opposite of your gift. It is your gift without balance."*
- One sentence, one breath. Length capped at ~25 words.
- Second-person consistent. Never *"<username> can confuse…"* — always *"You can…"* per Rule 7.

### Rule 6 — OCEAN reads as texture, not as standalone section

**Rule:** OCEAN observations weave into Mirror / Map / Path prose anchored to behavioral specifics. The Disposition Map either (a) keeps the bar chart as a quiet visual inside the Mirror layer with reframed copy that names behavior rather than percentages, or (b) deprecates as a standalone section entirely with OCEAN reads threading through other sections. **Per CC-048, decision is option (a): keep chart as quiet Mirror-internal visual; reframe copy from "here are your Big-5 percentages" to "here is how those traits show up."**

**Rationale:** The current Disposition Map (CC-037 standalone section between Mirror and Compass) reads as the report announcing its own personality-test infrastructure. Clarence's review: *"OCEAN can add nuance, but I would not make it the star unless users already understand Big Five."* The bar chart still has informational value; the framing around it should be behavioral rather than psychometric.

**Violation example:** Section header *"DISPOSITION MAP"* with the framing paragraph *"Big-5 personality dimensions, derived from how you answered other questions in this instrument..."* — too explicit about the framework.

**Adherence example:** Section moves into Mirror layer (after Top 3 Gifts, before the Map opens) with reframed copy: *"How these tendencies show up in your week"* rather than *"Big-5 derived dimensions"*. The bar chart stays. OCEAN observations also weave into Mirror gift descriptions (*"Your appetite for ambiguity..."*) and Path mode prose (*"Your structuring instinct..."*).

**Scope of application:** `app/components/InnerConstitutionPage.tsx` (or whatever component assembles the report) — Disposition Map's render position and surrounding framing. `lib/ocean.ts` — `generateOceanProse` templates need reframed copy. `app/components/OceanBars.tsx` — the *(estimated)* subscript on N stays; section header context changes.

### Rule 7 — Display name vs narrative name separation

**Rule:** Two distinct fields. *Report label* preserves user-entered username (e.g., *"Jason0429"*) and appears in the report's metadata header. *Narrative name* is what prose uses — first name when detected, *"you"* / *"your"* otherwise. Username-pattern (digit suffix, underscore, all-lowercase) never appears as a third-person possessive in prose.

**Rationale:** *"Jason0429's gift is the long read"* fights the report's tone. *"Your gift is the long read"* lands. The username serves report identity (so a user can find their report later); the narrative name serves prose register.

**Violation example:** *"Jason0429's gift is the long read. Jason0429's danger is believing the long read too early. For Jason0429's shape, the meaningful allocation gap may not be..."* — username treated as first name throughout.

**Adherence example:** Report header: *"For: Jason0429"*. Prose: *"Your gift is the long read. Your danger is believing the long read too early. For your shape, the meaningful allocation gap..."*.

**Scope of application:** CC-047 implements the username-pattern fallback in `getUserName`. CC-048 codifies it as canon and verifies the rule applies across every prose surface. Audit verifies no remaining literal-username-as-name uses.

### Rule 8 — Trust nuance: conditional framing, not categorical

**Rule:** Trust prose names the *condition* under which the user's trust extends rather than asserting a categorical label. Replace *"You trust non-profits and small business"* with *"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions."*

**Rationale:** Clarence's review: *"You do not seem to trust non-profits as a category naively. You may trust mission-driven organizations in theory, but only when they retain integrity and competence."* The categorical framing makes the user sound naive about institutional capture. The conditional framing names what the user is actually testing for.

**Violation example:** *"For hard truth, you appear to turn first toward your own counsel and a spouse or partner. Your top-trusted sources (Non-Profits, Small / Private Business, and your own counsel) are who you appear to weight most when truth is at stake."*

**Adherence example:** *"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, Non-Profits and Small / Private Business sit highest — likely because they tend to hold those proximities better than larger, more abstracted forms. For relational truth, your own counsel and your spouse or partner are where you turn first."*

**Scope of application:** Trust card prose in `lib/identityEngine.ts` (search for *"trust"* / *"trusted source"* prose). Path · Gait composite where trust feeds into the synthesis.

**CC-064 amendment (2026-05-02) — T-016 Value vs Institutional Trust Gap tension class shipped.** A new tension class `T-016` fires in Open Tensions when a sacred value ranks Compass top-3 while its analog institutional-trust signal does NOT rank in the user's top-3 trusted institutions. Six locked (value → institution) pairs in `lib/identityEngine.ts § VALUE_INSTITUTION_TRUST_PAIRS`: Knowledge → Education, Truth → Journalism, Justice → Government (elected), Stability → Government Services, Compassion → Non-Profits, Mercy → Religious institutions. Each fired pair carries a distinct `type` label (e.g. *"Value vs Institutional Trust Gap (Knowledge)"*) so multi-firings render as distinct Open Tensions sections. Locked `user_prompt` per pair shares a four-part structure: prefix names the value → middle names the institutional gap → reframe normalizes the tension and names the productive question (*"where do you locate {value} if not in {institution}'s institutional form?"*) → 3-state question close. The detection helper `detectValueInstitutionalTrustGap(signals)` is wired into `buildInnerConstitution` immediately after `detectAllocationOverlayTensions`. **Faith exclusion is canonical:** `faith_priority` is intentionally NOT in the pair set because CC-054's Faith Shape composer already produces a per-user Faith register prose block in the Compass card from `(faith_priority + religious_trust_priority + adjacent signals)`; adding Faith to T-016 would duplicate. Decision deferred — future CC may revisit if browser smoke surfaces the prose-level treatment as insufficient. Polish-layer integration is automatic: CODEX-062's `buildEngineRenderedReport` already pushes every fired tension's `user_prompt` onto `lockedAnchors[]`, so T-016 prompts inherit polish round-trip protection without a contract edit. T-016 is documented in `docs/canon/tension-library-v1.md` and noted in `docs/audits/report-calibration-audit-2026-04-29.md` as a coverage extension (not a Rule-violation closure).

**CC-063 amendment (2026-05-01) — Trust cardHeader Rule 8 implementation shipped.** The Trust card's `cardHeader` composition in `deriveTrustOutput` (`lib/identityEngine.ts`) now renders as a four-case composition keyed to `instLabels` / `personalLabels` presence. Cases A and B (institutions populated) prepend the locked Rule-8 prefix *"You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions."* and follow with the locked institutions clause *"…likely because they tend to hold those proximities better than larger, more abstracted forms."* Case A appends the locked relational-truth clause *"For relational truth, ${personalLabels} are where you turn first."*; Case C uses only the relational-truth clause; Case D preserves the prior empty-trust fallback. Number agreement is enforced via `.length === 1` ternaries (*sits/sit*, *is/are*). Per-user `instLabels` and `personalLabels` interpolation preserved across all four cases. The cardHeader-line Rule 8 finding (line 2911) is marked RESOLVED in `docs/audits/report-calibration-audit-2026-04-29.md`; the body-prose Rule 8 findings (line 2919 trusted-sources sentence; line 2931 risk-under-pressure prose) remain open for follow-on per CC-063's cardHeader-only scope.

### Rule 9 — Responsibility nuance: accountable actors inside systems

**Rule:** Responsibility-attribution prose names *"accountable actors inside systems"* rather than *"individual responsibility vs system blame"* binary. Preserves the user's structural-thinking dimension without making them sound reductionist.

**Rationale:** Clarence's review: *"You do seem to resist vague system-blame. But you also spend a lot of time thinking structurally. So you are not simply an 'individual responsibility' person. The better read: you look for the accountable actor inside the system, not instead of the system."* The categorical framing flattens what's actually a structural-with-accountability stance.

**Violation example:** *"When something goes wrong, you appear to look first toward Individual and Authority."*

**Adherence example:** *"When something goes wrong, you appear to look first for the accountable actor inside the system — Individual and Authority rank highest in your responsibility weighting because they name *who* had agency, who made the decision, who failed to act. That doesn't mean you skip the system; it means you locate where the system became personal."*

**Scope of application:** Gravity card prose (`lib/identityEngine.ts` Gravity composition). The Synthesis section's responsibility framing.

**CC-063 amendment (2026-05-01) — Gravity cardHeader Rule 9 implementation shipped.** The Gravity card's `cardHeader` composition in `deriveGravityOutput` (`lib/identityEngine.ts`) now renders the locked accountable-actor framing: *"When something goes wrong, you appear to look first for the accountable actor inside the system — ${joinList(labels)} ${ranks/rank} highest in your responsibility weighting because they name who had agency, who made the decision, who failed to act. That doesn't mean you skip the system; it means you locate where the system became personal."* Number agreement is enforced via `labels.length === 1` ternary (*ranks* singular / *rank* plural). Per-user `labels` interpolation preserved. The empty-labels fallback (*"Your responsibility-attribution answers did not yet converge on a clear top frame."*) is unchanged. The cardHeader-line Rule 9 finding (line 2858) is marked RESOLVED in `docs/audits/report-calibration-audit-2026-04-29.md`; the body-prose Rule 9 findings (line 2867 giftText conditional; line 2877 risk-under-pressure prose) remain open for follow-on per CC-063's cardHeader-only scope.

### Rule 10 — Peace disambiguation via cross-signals

**Rule:** When `peace_priority` ranks in a user's Compass top, the prose composes the user's specific peace-meaning from cross-signal pattern: moral peace (with truth + knowledge + honor) / structural peace (with system_responsibility + stability + restoring_energy) / relational peace (with family + caring_energy + close_relationships_stakes) / surface peace (with adapts_under_social_pressure + holds_internal_conviction low).

**Rationale:** *"Peace"* is overloaded as a value-label. Different users mean different things by it. The instrument's existing signal portfolio can disambiguate without asking a new question — cross-signal interpretation is the canonical resolution. Per Jason 2026-04-29: *"Comfort is the enemy of Peace"* names the moral-peace register; the prose should be able to render this without conflating with surface-peace.

**Violation example:** *"You named Peace as among your most sacred values."* — flat, no disambiguation, leaves the user's actual peace-meaning unread.

**Adherence example (moral-peace pattern):** *"You named Peace among your most sacred values — and your other rankings suggest you mean it in the metaphysical / moral register rather than the conflict-avoidance register: Truth and Honor compose with Peace in your top values, and your willingness to bear cost suggests you'd disturb surface ease to protect durable order. For your shape, peace is what comfort sometimes obstructs."*

**Scope of application:** Compass card prose where `peace_priority` is read. Path · Gait composite where peace_priority feeds the synthesis. New cross-signal interpretation rule in `lib/identityEngine.ts` or wherever Compass composition happens.

**CC-054 amendment (2026-05-01) — Peace disambiguation Rule 10 implementation shipped.** The selector function `getPeaceRegister` in `lib/identityEngine.ts` returns one of 4 locked prose templates (moral peace / structural peace / relational peace / surface peace) selected by cross-signal pattern. A 5th fallback template renders when peace ranks top but no register condition matched. The function returns `null` (silent) when `peace_priority` is not in the user's Compass top 5. Wired into `deriveCompassOutput`'s output via the new optional `peace_register_prose` field on `FullSwotOutput`; rendered in `app/components/MapSection.tsx` adjacent to the Compass ShapeCard's existing prose blocks, gated on `expanded.compass`. The audit document at `docs/audits/report-calibration-audit-2026-04-29.md` marks Rule 10 findings as resolved by CC-054.

**The 4 locked Peace prose templates** (verbatim canon):

- **Moral peace** (peace + truth/knowledge/honor + willingToBearCost): *"You named Peace among your most sacred values — and your other rankings suggest you mean it in the metaphysical / moral register rather than the conflict-avoidance register..."*
- **Structural peace** (peace + system_responsibility/restoring_energy/stability): *"...durable structural order rather than surface calm..."*
- **Relational peace** (peace + family/caring_energy/close_relationships_stakes): *"...preserved bonds rather than absent conflict..."*
- **Surface peace** (peace + adapts_under_social_pressure OR no holds_internal_conviction): gentle-flag tone *"Worth noticing whether peace, for you, is an integrity-preserving register or a friction-avoiding one."*

The Surface peace template is the canonical instance of Rule 5's *uncomfortable-but-true* register applied at the disambiguation surface — it surfaces a calibration question rather than asserting a verdict.

---

### Rule 11 — Faith Composite Disambiguation (CC-054, added 2026-05-01)

**Rule:** When `faith_priority` ranks in a user's Compass top 5, the prose composes a **two-layer read** — *Shape* (what kind of faith the user carries, derived from cross-signal pattern across Q-C4 attribution + Q-X3 institutional trust + Q-X4 personal trust) plus *Texture* (how faith operates, derived from 5 register-class disambiguators: moral architecture / resistance to nihilism / hope in reconciliation / living tension / institutional loyalty).

**Rationale:** Faith varies on two axes the instrument already measures separately — *what the user has faith in* (attribution) AND *how faith operates* (texture). Treating `faith_priority` as a single Compass value flattens both. The two-layer composite read names the user's specific faith pattern from existing measurement surfaces without adding new questions.

**The two-layer architecture:**

- **Layer 1 — Shape** (composite read): names *what kind of faith* by composing three sub-prose components selected per signal pattern.
  - **Faith-of-attribution** (Q-C4): supernatural / individual / system / authority / natural / mixed-individual-authority sub-prose options.
  - **Faith-of-institution** (Q-X3): religious / mission-driven / civic / knowledge / business sub-prose options.
  - **Faith-of-relationship** (Q-X4): family-partner-friend / chosen-mentor / outside-expert / self-reliant (own_counsel) / mixed-own-counsel-partner sub-prose options.
  - Composition template: *"You named Faith among your most sacred values. Your other answers shape what kind of faith you carry: [attribution prose]. [institutional prose]. [relational prose]."*

- **Layer 2 — Texture** (5 register-class disambiguators): names *how faith operates* by reading additional cross-signals. Top 1-2 textures fire; if 3+ match, render top 2 in priority order (moral architecture > living tension > hope > resistance to nihilism > institutional loyalty).
  - **Moral architecture** (faith + truth + honor): *"the framework that makes ethical decisions possible rather than the comfort that makes them feel right."*
  - **Living tension / burden** (faith + holds_internal_conviction + truth + willingToBearCost): *"living tension as much as comfort — what you carry, not just what you believe."*
  - **Hope in reconciliation** (faith + compassion + mercy): *"hope in eventual reconciliation — that what's broken will not stay broken."*
  - **Resistance to nihilism** (faith + supernatural moderate + knowledge/honor): *"the claim that meaning, work, love, and giving are not accidental."*
  - **Institutional loyalty** (faith + religious_trust + nonprofits_religious_spending): *"belonging — anchored in religious community, expressed through participation."*

**Composition rule:** The combined prose renders as two paragraphs — Shape in paragraph 1, Texture in paragraph 2 — joined by a blank line. The `whiteSpace: pre-line` style on the render preserves the paragraph break. When 2 textures fire, they join with *", with notes of"*. The moral_architecture + living_tension pair has a special-cased phrasing matching the Jason0429 worked example.

**Silent unless ranked top:** When `faith_priority` is not in the user's Compass top 5, the entire faith block returns `null` and the render layer omits it. Users who didn't rank Faith highly see no faith-prose imposed on them.

**Framework names canon-only:** *"Layer 1"*, *"Layer 2"*, *"Shape"*, *"Texture"*, *"faith-of-attribution"* never appear in user-facing prose. The architecture lives in this canon doc and code comments only. User prose is plain language.

**Scope of application:** `lib/identityEngine.ts` exports `getFaithShape`, `getFaithTexture`, `composeFaithProse`. The composer wires into `deriveCompassOutput`'s output via the optional `faith_register_prose` field on `FullSwotOutput`. Rendered in `app/components/MapSection.tsx` adjacent to the Compass ShapeCard, gated on `expanded.compass`. Same render position as the Peace block.

**Worked example (Jason0429 pattern — NiTe + Individual+Authority responsibility + nonprofits + small-business + own_counsel + partner + truth + honor + holds_internal_conviction + willingToBearCost):**

> *"You named Faith among your most sacred values. Your other answers shape what kind of faith you carry: when something goes wrong, you locate cause in human agency — Individual and Authority — more than in supernatural intervention or systemic causation. Your institutional faith lands in mission-driven organizations and close-to-the-consequence businesses — places where responsibility, consequence, and mission stay close to the people making decisions. Your personal faith lands in your own counsel and your spouse / partner — chosen-relational and self-anchored, not deferential."*
>
> *"For your shape, faith operates as moral architecture, with notes of living tension — what you carry, not just what you believe."*

### Audit + rewrite track

The audit at `docs/audits/report-calibration-audit-2026-04-29.md` walks the prose-emitting code with these ten rules in hand and flags specific violations with file:line + rule + current text + issue + fix direction. The rewrite track (CC-049+) takes clustered subsets of the audit's findings and authors per-user-specific replacements. CC-048 itself rewrites nothing; it codifies the canon and produces the audit.

---

## § Humanity Rendering Layer (Path C)

The marble-statue critique surfaced post-CC-052 — *"the report is structurally accurate but missing humor / family attachment / grief / beauty / lived absurdity"* — is resolved architecturally by the Humanity Rendering Layer (Path C), an LLM polish stage that runs downstream of the engine's structural read. The polish layer adds texture; it does not change substance. See `humanity-rendering-layer.md` for the full architectural canon.

The rewrite-track rules (Rule 1-10 above) remain the engine's canonical constraints regardless of polish-layer status. When the polish flag is off, the engine-rendered report ships as-is. When the polish flag is on, the polish layer composes texture on top of engine output without violating any rewrite-track rule.

**Sentence 2 anchors (Rule 2 implementation per CC-052/CC-052b) and the Peace/Faith disambiguation prose (Rule 10/Rule 11 per CC-054) are engine-owned. The polish layer cannot edit them, even when adding sentences before or after them.**

## § Markdown Export Parity (procedural — CODEX-066, 2026-05-02)

Every CC that adds, removes, or restructures an on-page report surface in `app/components/InnerConstitutionPage.tsx` or its child components MUST also update `lib/renderMirror.ts` to maintain markdown export parity. Markdown is the canonical handoff format for downstream LLM review (per the manual A/B workflow), share-without-account flow (per `project_mvp_product_vision.md`), and any future PDF generation pipeline. Drift between on-page and markdown invalidates the comparison surface.

CODEX-066 closed the accumulated drift since CC-022c — Disposition Map (CC-037), Work Map (CC-042), Love Map (CC-044), Peace + Faith disambiguation (CC-054), Open Tensions iteration (CC-064), removal of standalone Allocation Gaps (CODEX-051). The sequencing failure was avoidable; new CCs should include renderMirror.ts updates in their scope from the start.
