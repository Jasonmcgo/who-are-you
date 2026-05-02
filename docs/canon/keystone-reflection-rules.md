# Keystone Reflection Rules

## Purpose

Codifies the architectural rules that govern the Keystone Reflection block (Q-I1 / Q-I1b / Q-I2 / Q-I3) — the canonical instance of *cross-card belief evaluation* in the model. After CC-017 + CC-024, the Keystone block operates as an **anchor + cross-card structured stress-test**: Q-I1 (or Q-I1b on skip) anchors a belief in the user's own words (Q-I1's text reframed by CC-024 to cost-bearing register); Q-I2 reads which trust sources from the Trust card could revise it; Q-I3 reads which **concrete stakes** from the Compass card's Q-Stakes1 ranking the user would bear losing for it.

The architectural shift codified here: the engine reads beliefs through **structured cross-card evidence**, not through text-mining the freeform belief content. Stated values are claims; the user's already-named portfolio of trust sources and concrete stakes, applied to a specific named belief, is the structural read.

This canon binds every CC that touches the Q-I block, the BeliefUnderTension type, the Keystone Reflection Mirror section, or the `multiselect_derived` question type. It is subordinate to `result-writing-canon.md` (which governs all user-facing prose) and to the *belief content rule* (CC-015c, also in result-writing-canon.md).

**CC-024 amendment (2026-04-26)**: Q-I1 reframed from social-differentiation register to cost-bearing register; Q-I3's derivation source moved from Q-S1+Q-S2 (sacred values) to Q-Stakes1 (concrete loss domains). Both changes resolve a verb-semantics composition error: a question's verb must compose with the source card's semantics or the block's purpose. Q-I1's old verb composed with controversial-opinion register, not cost-of-conviction; Q-I3's old verb (*"would risk losing"*) didn't compose with sacred-by-definition values. Per `prompts/queued/Q-I3-restructure-notes.md`'s composition-check rule, future cross-card derivations must pass the same check before being authored.

---

## Rule 1 — Anchor-only Q-I1

Q-I1 is freeform and stays freeform. Its content is **not** signal-extracted into `BeliefUnderTension`. Instead it serves two distinct purposes:

1. **Belief anchor.** The text is stored as the user's named belief and surfaced verbatim in the quoted-callout block above Q-I2 / Q-I3 and in the Mirror's Keystone Reflection section.
2. **Catalog-signal source.** The four catalog signals — `independent_thought_signal`, `epistemic_flexibility`, `conviction_under_cost`, `cost_awareness` — continue to fire from Q-I1 freeform content via `extractFreeformSignals` in `lib/identityEngine.ts`. These live on `Signal[]` and capture broad-abstraction observations distinct from the structured `BeliefUnderTension` shape. They are the v0 of belief-content extraction; preserved for v0 → v1 LLM-substitution continuity per the v2 memo's data-boundary rules.

The two surfaces are independent. The same Q-I1 freeform produces two output shapes for two different consumers.

---

## Rule 2 — Conditional unskippable Q-I1b on Q-I1 skip

Q-I1b is a conditional follow-up that renders **if-and-only-if** Q-I1 was skipped (i.e., a `question_skipped` MetaSignal exists for `Q-I1` in the answers state, OR Q-I1 has not been answered).

- Q-I1b's question text uses a softer threshold: *"Ok, maybe not most. How about a belief that at least half the people around you disagree with?"*
- Q-I1b is **the only non-skippable question in the bank.** The Skip button does not render. Continue is disabled until non-empty text is entered. Implemented via the `unskippable: true` flag on `ForcedFreeformQuestion`, gated in `app/components/QuestionShell.tsx` via the `skipVisible` predicate.
- If Q-I1 was answered with non-empty text, Q-I1b is hidden entirely — the question dispatcher in `app/page.tsx` advances past it on render.
- The belief anchor (used by Q-I2, Q-I3, and the Mirror Keystone section) is read from whichever of Q-I1 or Q-I1b was answered — Q-I1 first, Q-I1b as fallback.

The unskippable constraint is the deliberate "quiet pressure" — the half-the-people threshold is broad enough that anyone who can introspect can name something. Inability to name a belief becomes itself a meta-signal (separately, via the existing `question_skipped` MetaSignal which fires on Q-I1 in the cascade case where the user reaches Q-I1b without answering Q-I1, and conceptually via the absence of the anchor). **Future CCs must not relax the unskippable constraint; this is intentional, not a bug.**

---

## Rule 3 — Cross-card derivation for Q-I2 / Q-I3 (`multiselect_derived`)

Q-I2 and Q-I3 are no longer freeform. They are `multiselect_derived` — a new question type whose items populate dynamically at render time from the top-N answers of two parent ranking questions.

- **Q-I2** asks *"What or who could change your mind about this belief?"* — items are the top-2 from each of **Q-X3-cross** (institutional trust cross-rank) and **Q-X4-cross** (personal trust cross-rank), four items total *(top-2 from each of the two parent questions, composed).*  
  **CC-032 cascade (2026-04-28)**: source changed from `[Q-X3, Q-X4]` (legacy flat 5-item rankings, top-3 each = 6 items) to the v2.5 cross-ranks `[Q-X3-cross, Q-X4-cross]` (top-2 each = 4 items).  
  Cross-ranks already resolved priority across the wider domain — top-2 of a cross-rank is a sharper read than top-3 of a flat ranking. The user-visible win: Q-I2's revision-source space now potentially includes Social Media, Outside-expert, Government-Services, News-organizations — dimensions the legacy form averaged into bucket labels.
- **Q-I3** asks *"What would you risk losing for this belief?"* — items are the top-3 from Q-Stakes1 (concrete loss domains: Money / Job / Close relationships / Reputation / Health), three items total. **CC-024 (2026-04-26)**: source changed from `[Q-S1, Q-S2]` (sacred values, 6 items) to `[Q-Stakes1]` (concrete stakes, 3 items). Pre-CC-024 the verb (*"would risk losing"*) didn't compose with the answer space (*sacred values*) — sacred-by-definition means not-to-be-sacrificed. Post-CC-024 the verb composes with concrete losses, restoring coherence.
- Both questions render a **belief anchor block** above the question, displaying the user's verbatim Q-I1 / Q-I1b text in a quoted-callout style.
- Both questions render a **"None of these"** option (mutually exclusive with all derived items and with "Other") and an **"Other (please specify)"** option (compatible with derived items, with a freeform text addendum).

The architectural commitment: **the engine reads the user's belief through their own pre-named portfolio.** Trust sources and sacred drivers are already ranked elsewhere in the assessment; the Q-I2 / Q-I3 multiselects ask which of those pre-named drivers attach to the specific named belief. The relationship of the user's answers across cards is the signal — not the text content of any single answer.

---

## Rule 4 — Mutual-exclusion semantics for None-of-these

Within any `multiselect_derived` question:

- **"None of these"** is mutually exclusive with the derived items AND with "Other." Selecting "None" clears any other selections; selecting any derived item or "Other" clears "None."
- **"Other"** is compatible with derived items. The user can check several derived items plus "Other" with a freeform addendum.

When `none_selected: true`, the engine emits a MetaSignal:

- Q-I2 → `belief_impervious` (no trust source could change the user's mind about the belief — held without a revision path).
- Q-I3 → `belief_no_cost_named` (no concrete stake the user would bear losing for the belief — held without an articulated cost). **CC-024 (2026-04-26)**: same MetaSignal name; semantic now reads against concrete-stakes refusal, not sacred-driver refusal. The pre-CC-024 framing was incoherent (sacred-by-definition can't be sacrificed); the post-CC-024 framing reads cleanly as "the user marked None against the concrete stakes they themselves ranked highest."

These MetaSignals live on `InnerConstitution.meta_signals` and never feed shape derivation. They are descriptive of the user's belief structure, not a verdict.

---

## Rule 5 — Structured-source `BeliefUnderTension` (3 dimensions only)

`BeliefUnderTension` carries three structured-source dimensions plus the anchor metadata:

- **`belief_text`** — the verbatim Q-I1 or Q-I1b answer.
- **`belief_source_question_id`** — `"Q-I1"` or `"Q-I1b"`, indicating which question provided the anchor.
- **`value_domain`** — the user's top sacred value across Q-S1 + Q-S2 (lower rank wins). **CC-024 (2026-04-26)**: re-sourced from Q-S1/Q-S2 directly — pre-CC-024 it derived from Q-I3 selections (which were sacred-value drivers via Q-S1/Q-S2 derivation), but post-CC-024 Q-I3 carries concrete-stakes selections, not sacred-value drivers. The field's semantic meaning ("which sacred value the belief touches") is preserved; the derivation path now reads the user's Compass ranking directly. `unknown` only when both Q-S1 and Q-S2 are unanswered or shapeless.
- **`conviction_temperature`** — derived from Q-I2 + Q-I3 combined cardinality:
  - Q-I2 None + Q-I3 with selections → `high` (impervious-but-cost-bearing — held against the world for real cost).
  - Q-I2 with selections + Q-I3 None → `low` (revisable, low cost).
  - Q-I2 with selections + Q-I3 with selections → `moderate` (revisable but cost-aware).
  - Q-I2 None + Q-I3 None → `unknown` (held but no articulated cost or revision path).
- **`epistemic_posture`** — derived from Q-I2:
  - "None of these" → `rigid`.
  - 1–2 trust drivers selected → `reflective`.
  - 3+ trust drivers → `open`.
  - Only "Own counsel" (no Q-X3-cross selections) → `guarded`.  
    **CC-032 cascade (2026-04-28)**: the "guarded" check in `lib/beliefHeuristics.ts § deriveEpistemicPostureFromQI2` now reads `source_question_id === "Q-X3-cross"` / `"Q-X4-cross"` instead of the legacy `"Q-X3"` / `"Q-X4"`. The `own_counsel_trust_priority` signal itself is preserved through the Q-X4 multi-stage restructure (now produced by Q-X4-chosen), so the detection logic survives the cascade unchanged.

The CC-015c per-tag `*_confident` and `*_user_confirmed` flags are **deleted**. Structured-source confidence is implicit — the value either was derived from selections or it is `unknown`. Mirror prose renders firm; the Keystone confirmation panel still lets the user override the engine's read via the "Different" affordance, but the override stays in component-local state (not persisted on `BeliefUnderTension` itself in v1).

The retired CC-015c dimensions (`disagreement_context`, `social_cost`) and their enums are deleted from the type system.

---

## Rule 6 — Non-text-mined `other_text`

When the user checks "Other" on a `multiselect_derived` question and enters freeform text, that text is stored on the answer (`MultiSelectDerivedAnswer.other_text`) but the engine **never** text-mines it for signals or BeliefUnderTension dimensions. It exists for the user — to give them a place to say what didn't fit — and the engine treats it as commentary, not data.

This is a deliberate architectural commitment that mirrors the Q-I1 anchor preservation: the engine moves away from text-mining of belief content. The four catalog signals on Q-I1 are the only remaining text-mining surface in the Keystone block, and they are preserved for v0 continuity rather than expanded.

---

## Rule 7 — Cascade-skip when parents lack data

Q-I2 and Q-I3 are `multiselect_derived` — their items derive from parent rankings. Same cascade-skip behavior as CC-016's `ranking_derived` cross-ranks (Q-S3-cross / Q-E1-cross):

- If **neither** parent has been answered, the question cascade-skips automatically. A `derived_question_skipped` MetaSignal lands; the user does not see the question.
- If **exactly one** parent has been answered, the question renders with whatever items are available (post-CC-032: top-2 from one cross-rank = 2 items instead of 4 for Q-I2; for Q-I3 post-CC-024 there is one parent (Q-Stakes1), so the cascade-skip applies only when Q-Stakes1 itself is unanswered). **CC-032 cascade subtlety**: each Q-I2 parent is itself a `ranking_derived` cross-rank (Q-X3-cross, Q-X4-cross), so the cascade-skip is two layers deep — Q-I2 cascade-skips when neither Q-X3-cross nor Q-X4-cross was answered, and each cross-rank cascade-skips when both of its parent rankings (Q-X3-public + Q-X3-information-and-commercial, or Q-X4-relational + Q-X4-chosen) were unanswered.

The BeliefUnderTension shape handles missing data gracefully — when Q-I2 cascade-skipped, `epistemic_posture: "unknown"` and the Mirror prose omits the posture line. When Q-I3 cascade-skipped (Q-Stakes1 also unanswered post-CC-024), the citation prose omits its line and the closing protected line still anchors. **CC-024 (2026-04-26)**: `value_domain` is now sourced from Q-S1/Q-S2 directly, so it stays populated even when Q-I3 cascade-skips (provided Q-S1 or Q-S2 was answered). The value-opener degrades to the *"This belief sits inside what you protect, not outside them"* fallback only when both Q-S1 and Q-S2 are unanswered.

---

## Case A / Case B / Case C summary

The dispatcher must handle three cases correctly:

- **Case A — Q-I1 answered.** Q-I1b is hidden via `render_if_skipped`. Belief anchor = Q-I1 text. Q-I2 and Q-I3 render normally with the anchor displayed.
- **Case B — Q-I1 skipped, Q-I1b answered.** Q-I1b renders (predicate satisfies). User must enter non-empty text (unskippable). Belief anchor = Q-I1b text. Q-I2 and Q-I3 render normally.
- **Case C — Q-I1 skipped, Q-I1b not answered.** The session is incomplete — should not be reachable via the UI given Q-I1b's unskippable constraint, but is a defensive case. Q-I2 and Q-I3 cascade-skip; the Mirror's Keystone Reflection section renders the `noAnchorLine()` fallback: *"You did not name a belief in this session. The model leaves space for that — what you'd say here is your own."*

---

## What this canon does NOT govern

- The four catalog signals' detection logic — that lives in `signal-library.md` + `extractFreeformSignals` in `lib/identityEngine.ts` and is preserved unchanged.
- The Mirror prose templates themselves — those live in `lib/beliefHeuristics.ts` (`generateBeliefContextProse`, `noAnchorLine`) and inherit the result-writing canon's hedging vocabulary + protected lines.
- Tension detection — no T-013 / T-014 / T-015 changes; allocation tensions are governed by `allocation-rules.md`.
- The CC-014 second-pass mechanism — Q-I1b is a NEW conditional-render mechanism, distinct from second-pass routing.

This canon governs only the architectural rules that bind the Q-I block and the structured-source BeliefUnderTension extraction.

---

## Implementation surfaces

| Canonical rule | Code-level surface |
|---|---|
| Rule 1 (anchor-only Q-I1) | `data/questions.ts` Q-I1 entry; `extractFreeformSignals` in `lib/identityEngine.ts` |
| Rule 2 (conditional unskippable Q-I1b) | `data/questions.ts` Q-I1b entry; `render_if_skipped` + `unskippable` on `ForcedFreeformQuestion`; `app/page.tsx` conditional-render effect; `QuestionShell.tsx` `unskippable` prop |
| Rule 3 (cross-card derivation) | `MultiSelectDerivedQuestion` + `MultiSelectDerivedAnswer` in `lib/types.ts`; `deriveItemsForMultiSelect` + render branch in `app/page.tsx`; `app/components/MultiSelectDerived.tsx` |
| Rule 4 (mutual exclusion + None MetaSignals) | `MultiSelectDerived.tsx` toggle handlers; `collectMultiSelectMetaSignals` in `lib/identityEngine.ts` |
| Rule 5 (3-dimension BeliefUnderTension) | `lib/types.ts`; `lib/beliefHeuristics.ts` (`extractBeliefUnderTension`, `generateBeliefContextProse`); `KeystoneReflection.tsx` (3 tag rows) |
| Rule 6 (non-text-mined other_text) | `MultiSelectDerived.tsx` other-text input; `signalsFromMultiSelectDerived` in `lib/identityEngine.ts` (does not consume `other_text`) |
| Rule 7 (cascade-skip) | `app/page.tsx` multiselect_derived cascade-skip effect (parallel to CC-016's ranking_derived cascade-skip) |

---

## CC-025 — Mirror prose softening (added 2026-04-26)

CC-025 adds a *positive-read-first* softening to every closed-revision Keystone prose path. The architectural read (impervious + cost-bearing, or no-marked-revision-source) is unchanged; only the emotional register softens. The principle: when the engine detects something worth flagging, the structure is **"name the positive read, then the watch point,"** not "name the watch point alone."

### Locked softening text

When the closed-revision branch fires (Q-I2 None-selected, Q-I2 zero derived selections, or `epistemic_posture: "rigid"`), the following text appends after the architectural read sentence. The phrasing is locked at the canon layer:

> *That may reflect conviction, faithfulness, and spiritual stability. It may also be worth holding with awareness: when a belief is central enough to carry identity, it deserves not less care, but more humility in how it is expressed.*

### Branch-by-branch register adjustments

- **`temperatureLine` "high"** — was *"the belief reads as held against the world."* Now *"the belief reads as load-bearing in your shape, not provisional."* Same architectural read; less hostile register.
- **`postureLine` "rigid"** — was *"…the belief is held without a revision path."* Now ends with the locked softening sentence above.
- **`qi2CitationLine` `noneSelected`** — was *"The belief is held against the full revision space your answers themselves named as most credible."* Now ends with the locked softening sentence.
- **`qi2CitationLine` n=0 (no derived selections)** — was *"The belief reads as held against the revision space your own ranking surfaced."* Now ends with the locked softening sentence.

### Application rule

When future Keystone prose paths detect closed-revision (or analogous patterns where the engine flags a watch point), apply the same structure: the architectural sentence (what the engine read in the user's selections) stays; the closing line names the positive interpretation first, then the watch point. The CC-025 locked text is the canonical version when the branch is closed-revision specifically; analogous-but-distinct patterns may author analogous-but-distinct softening lines, but must follow the positive-read-first structure.

| Canonical rule | Code-level surface |
|---|---|
| CC-025 closed-revision softening | `lib/beliefHeuristics.ts` (`temperatureLine`, `postureLine`, `qi2CitationLine`); the locked text is also referenced in `result-writing-canon.md § CC-025`. |
