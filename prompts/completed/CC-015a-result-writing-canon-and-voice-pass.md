# CC-015a — Result-Writing Canon + Editorial Voice Pass

## Goal

Two things land together: (1) a new canon doc — `docs/canon/result-writing-canon.md` — that codifies the editorial discipline rules every future CC must follow when generating user-facing prose; (2) an editorial voice pass over `lib/identityEngine.ts` that replaces clinical Jungian function-code references in body prose with plain-language voice descriptors, varies repeated value-list phrasing, fixes the *"Fire-card risk under pressure"* fallback wart, and addresses the remaining cross-card repetition surfaces (`Cynicism` and `Over-reading the future` verbatim duplicates).

After CC-015a, the same INTJ session that previously read as *"Your shape may express as the Ni instinct grasping for control while the inferior Se surfaces in cruder form"* reads instead as *"When pressure rises, you may tighten around the pattern you already see and lose patience with what is happening right in front of you."* Same content, plain English, no function codes in body prose.

This CC is **engine + canon only.** No renderer changes. No structural changes (cell-label rename and pressure consolidation are CC-015b territory). No new types. The Inner Constitution still renders in its current shape; only the prose reads cleaner.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

This CC touches `lib/identityEngine.ts` substantially (per-card derivation functions, cross-card synthesis functions, voice lookup tables, prose templates) plus creates one new canon file. Per-edit approval prompts will defeat single-pass execution.

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

**Canon (read; canon edits are limited to creating one new file per § Allowed to Modify):**

- `docs/canon/shape-framework.md` — § Card-by-Card (the eight cards), § Five Dangers to Avoid (binding on every prose variant). The body-map metaphor and the eight cards remain canon. CC-015a does not modify them.
- `docs/canon/inner-constitution.md` — § Output Rules (lines 36–46). The hedging vocabulary (*"appears to," "may suggest," "tends to," "leans toward"*) governs every prose variant.
- `docs/canon/output-engine-rules.md` — the six derivation rules and the 12-vocabulary gift categories. CC-011 implemented these; CC-015a does not change the rules. The engine still uses function codes internally; only the user-facing prose changes.
- `docs/canon/temperament-framework.md` — § 3 cognitive function descriptions. The plain-language voice descriptors in § D-1 below honor each function's canonical character.
- `docs/canon/signal-library.md`, `docs/canon/signal-mapping-rule.md`, `docs/canon/signal-and-tension-model.md`, `docs/canon/tension-library-v1.md` — reference only.

**Existing code (read; will be edited):**

- `lib/identityEngine.ts` — per-card derivation functions (`deriveLensOutput`, `deriveCompassOutput`, `deriveConvictionOutput`, `deriveGravityOutput`, `deriveTrustOutput`, `deriveWeatherOutput`, `deriveFireOutput`, `derivePathOutput`); cross-card synthesis functions (`synthesizeTopGifts`, `synthesizeTopRisks`, `generateGrowthPath`, `generateRelationshipTranslation`, `generateConflictTranslation`, `generateMirrorTypesSeed`, `generateShapeSummary`); voice/phrase lookup tables (`FUNCTION_NAME`, `FUNCTION_PHRASE`, `BLIND_SPOT_TEXT`, etc.); helpers (`compassLabels`, `joinList`, etc.).

**Existing code (do NOT edit):**

- `lib/types.ts` — no type changes in CC-015a.
- `data/questions.ts` — no question changes.
- Any file under `app/` — renderer is unchanged.
- Any tension detection block.
- Any signal definition (`SIGNAL_DESCRIPTIONS`, `SACRED_PRIORITY_SIGNAL_IDS`, `STRENGTHENERS`, `STACK_TABLE`, `MBTI_LOOKUP`).
- The aggregation helpers (`aggregateLensStack`, `getTopCompassValues`, `getTopGravityAttribution`, `getTopTrustInstitutional`, `getTopTrustPersonal`, `assessWeatherLoad`, `inferFirePattern`, `inferFormationContext`, `inferAgencyPattern`).
- Any other `docs/canon/*.md` file (only the new `result-writing-canon.md` is created).

---

## Context

The product's current Inner Constitution reads as *"a sophisticated psychological profile"* — intellectually complete but emotionally heavy. Real-user testing surfaced two failure modes:

1. **Function codes in body prose.** Phrases like *"the Ni instinct,"* *"Se-shaped expectations,"* *"Te-shaped follow-through"* read as clinical jargon for users who haven't pre-loaded MBTI vocabulary. The function codes belong behind the optional MBTI disclosure (already implemented in CC-012), not as the headline language of the document.
2. **Repetition that escapes the CC-011b cap.** The cap allowed up to 2 cards with the same blind-spot phrase; for the canonical Gift-to-Blind-Spot pairings (Discernment → Cynicism; Pattern → Over-reading the future), this produced verbatim duplication across pairs of cards in real-user output. Plus the *"{Card}-card risk under pressure"* fallback in `synthesizeTopRisks` still surfaces when an editorial label is already taken by an earlier card.

The fix is editorial discipline at the prose-template layer plus a small canonical rule-book that future CCs read first.

The user (Jason) has been iterating on this with Clarence (the human business partner). Clarence's contributions baked into CC-015a:

- Eight plain-language voice descriptors per § D-1 (Clarence's framing replaces my earlier sketches).
- Per-process under-pressure behaviors per § D-3.
- The protected-lines list per § D-9 (the eight lines that are product-quality and must survive any future editorial CC).
- The result-writing canon's seven rules per § D-7.

CC-015a does **not** include the Mirror generator (CC-015b), the Map restructure / inline accordion (CC-015b), the cell-label rename (Strength / Trap / Next move — applied in CC-015b's renderer), the pressure consolidation into a cross-card section (CC-015b), or the per-card process inflection architecture (CC-016 / v2 — substantial new work that would balloon scope here).

---

## Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Plain-language voice descriptors

Each cognitive function code maps to a plain-language voice descriptor used in body prose. Function codes (`Ni`, `Ne`, `Si`, `Se`, `Ti`, `Te`, `Fi`, `Fe`) appear in body prose **only** through these voices.

| Code | Voice descriptor | Short form (when grammatical context demands) |
|---|---|---|
| Ni | the pattern-reader | pattern-reader |
| Ne | the possibility-finder | possibility-finder |
| Si | the precedent-checker | precedent-checker |
| Se | the present-tense self | present-tense self |
| Ti | the coherence-checker | coherence-checker |
| Te | the structurer | structurer |
| Fi | the inner compass | inner compass |
| Fe | the room-reader | room-reader |

Add a new constant to `lib/identityEngine.ts`:

```ts
export const FUNCTION_VOICE: Record<CognitiveFunctionId, string> = {
  ni: "the pattern-reader",
  ne: "the possibility-finder",
  si: "the precedent-checker",
  se: "the present-tense self",
  ti: "the coherence-checker",
  te: "the structurer",
  fi: "the inner compass",
  fe: "the room-reader",
};

export const FUNCTION_VOICE_SHORT: Record<CognitiveFunctionId, string> = {
  ni: "pattern-reader",
  ne: "possibility-finder",
  si: "precedent-checker",
  se: "present-tense self",
  ti: "coherence-checker",
  te: "structurer",
  fi: "inner compass",
  fe: "room-reader",
};
```

The existing `FUNCTION_NAME` and `FUNCTION_PHRASE` constants stay in place but are referenced **only** by:

1. The MBTI disclosure body (in `MbtiDisclosure.tsx` — not touched by CC-015a but the disclosure language stays as-is).
2. Internal engine logic (lookups, stack derivation, etc.).
3. Voice-quote authoring in Q-T questions (the canonical voice quotes in `data/questions.ts` — not touched).

`FUNCTION_NAME` and `FUNCTION_PHRASE` should NOT appear in body prose templates after CC-015a. The agent finds every reference to them inside per-card derivation functions and cross-card synthesis functions and replaces with `FUNCTION_VOICE` or `FUNCTION_VOICE_SHORT` as grammar requires.

### D-2: Specific prose substitutions

These are the most common phrasings to substitute. Not exhaustive — the agent should grep for any remaining function-code references and apply analogous substitutions.

| Current phrasing | New phrasing |
|---|---|
| `"leans toward ${FUNCTION_NAME[dom]}"` | `"leans toward ${FUNCTION_VOICE[dom]}"` |
| `"Your processing pattern leans toward Ni (convergent pattern synthesis)"` | `"Your processing pattern leans toward the pattern-reader"` (drop the parenthetical function-name expansion in body prose; the disclosed MBTI affordance is where the technical label belongs) |
| `"${FUNCTION_NAME[dom]}-shaped insight"` | `"${FUNCTION_VOICE_SHORT[dom]}-shaped insight"` (e.g., *"pattern-reader-shaped insight"* — or restructure as *"the insight your pattern-reader gives you"*) |
| `"the ${FUNCTION_NAME[dom]} instinct"` | `"the ${FUNCTION_VOICE_SHORT[dom]}'s instinct"` (e.g., *"the pattern-reader's instinct"*) |
| `"In ${FUNCTION_NAME[dom]}-dominant shapes"` | `"In shapes led by ${FUNCTION_VOICE[dom]}"` |
| `"borrowing from ${FUNCTION_NAME[inf]}"` | `"borrowing from ${FUNCTION_VOICE[inf]}"` |
| `"${FUNCTION_NAME[dom]}-${FUNCTION_NAME[aux]} shape"` | `"your shape"` (when context allows; or `"${FUNCTION_VOICE_SHORT[dom]}–${FUNCTION_VOICE_SHORT[aux]} shape"` when the named pairing matters) |
| `"${FUNCTION_NAME[inf]} — your inferior, the function least trusted"` | `"${FUNCTION_VOICE[inf]} — the voice you trust least"` |

Where the existing template grammar awkwardly bolts the voice descriptor in, the agent should rewrite the sentence rather than substitute mechanically. The goal is plain conversational English.

### D-3: Per-process under-pressure prose templates

The current under-pressure prose templates in per-card Risk Under Pressure cells use abstract function-code language (*"the Ni instinct grasping for control while the inferior Se surfaces in cruder form"*). Replace with per-process behavioral templates per Clarence's framing. Each function gets a one-sentence behavioral pattern under pressure:

| Function | Under-pressure behavior |
|---|---|
| Ni | the pattern-reader narrows the lens until certainty starts to feel like fact |
| Ne | the possibility-finder keeps adding angles until no angle gets weight |
| Si | the precedent-checker begins replaying old experience as if it were the only data |
| Se | the present-tense self acts before the meaning has had time to land |
| Ti | the coherence-checker begins cross-examining instead of clarifying |
| Te | the structurer turns people into roles rather than presences |
| Fi | the inner compass hardens into private verdict |
| Fe | the room-reader smooths the surface while the truth stays unsaid |

Add:

```ts
export const UNDER_PRESSURE_BEHAVIOR: Record<CognitiveFunctionId, string> = {
  ni: "the pattern-reader narrows the lens until certainty starts to feel like fact",
  ne: "the possibility-finder keeps adding angles until no angle gets weight",
  si: "the precedent-checker begins replaying old experience as if it were the only data",
  se: "the present-tense self acts before the meaning has had time to land",
  ti: "the coherence-checker begins cross-examining instead of clarifying",
  te: "the structurer turns people into roles rather than presences",
  fi: "the inner compass hardens into private verdict",
  fe: "the room-reader smooths the surface while the truth stays unsaid",
};
```

Use these in per-card Risk Under Pressure prose where the existing template references function-code-based pressure behavior. Example rewrite:

- **Current** (Lens Risk Under Pressure): *"Under ordinary pressure, your shape may express as the Ni instinct grasping for control while the inferior Se surfaces in cruder form."*
- **New**: *"When pressure rises, ${UNDER_PRESSURE_BEHAVIOR[dom]}, while ${FUNCTION_VOICE[inf]} surfaces in cruder form."* — substitutes to: *"When pressure rises, the pattern-reader narrows the lens until certainty starts to feel like fact, while the present-tense self surfaces in cruder form."*

The agent applies these per-process behaviors to per-card Risk Under Pressure cells where function-code pressure language currently lives. Where the cell's pressure behavior was authored card-specific (e.g., *"defended absolutes"* on Compass), keep the card-specific language; only substitute where function-code pressure language is currently used.

### D-4: Top Risks editorial fallback labels — kill *"{Card}-card risk under pressure"*

In `synthesizeTopRisks` in `lib/identityEngine.ts`, when the gift-category-to-risk-label table produces a label already used by an earlier card (collision), the current fallback emits *"{Card}-card risk under pressure"* — a debug-style label. Replace with per-card editorial fallback labels:

```ts
export const TOP_RISK_CARD_FALLBACK: Record<string, string> = {
  lens:       "Pattern certainty becoming private fact",
  compass:    "Integrity becoming rigidity",
  conviction: "Conviction-cost hardening into stance",
  gravity:    "Where you place blame becoming where you keep it",
  trust:      "Trust narrowing into capture or paranoia",
  weather:    "State patterns calcifying into universal patterns",
  fire:       "Conviction becoming over-sacrifice",
  path:       "Building outpacing becoming",
};
```

The fallback path in `synthesizeTopRisks` looks up `TOP_RISK_CARD_FALLBACK[cardKey]` when the gift-category editorial label is already used. The label is paired with the existing card-specific risk paragraph (which already exists in per-card derivation output).

### D-5: Vary value-list phrasing across the rendered output

The phrase listing the user's top values (e.g., *"Knowledge, Truth, Faith, Freedom"*) currently appears verbatim 5+ times in a typical INTJ session output. Vary using a deterministic per-call-site selection.

Add a helper function:

```ts
export function valueListPhrase(
  topCompass: SignalRef[],
  variantIndex: number  // 0-N, deterministic per call site
): string {
  const labels = compassLabels(topCompass);
  if (labels.length === 0) return "what you protect";
  const verbatim = joinList(labels);
  switch (variantIndex % 4) {
    case 0: return verbatim;                                    // "Knowledge, Truth, Faith, and Freedom"
    case 1: return "your top values";                            // "your top values"
    case 2: return "what you protect";                            // "what you protect"
    case 3: return `the ${labels.length} values you ranked highest`; // "the 4 values you ranked highest"
    default: return verbatim;
  }
}
```

Each call site that currently interpolates the verbatim list passes a deterministic `variantIndex` (e.g., card position 0–7, or section index in cross-card synthesis). The same user always gets the same output (no randomness); but across multiple call sites in one rendering, the phrasing varies.

### D-6: Add 3rd variants to address verbatim cross-card duplications

Two specific blind-spot prose strings repeat verbatim across two cards in current output:

1. *"Cynicism. The same instinct that detects falsehood may begin reading bad faith into honest difference."* — appears in both Conviction and Gravity Blind Spots when both carry `Discernment` gift category.
2. *"Over-reading the future. The pattern you see clearly may stop being tested, and private interpretation may settle into private fact before evidence is in."* — appears in both Lens and Trust Blind Spots when both carry `Pattern` gift category.

Per the canonical Gift-to-Blind-Spot pairing table (in `BLIND_SPOT_TEXT` constant), each gift category maps to a single blind-spot string. Add 3rd variants for `Discernment` and `Pattern`:

```ts
export const BLIND_SPOT_TEXT_VARIANTS: Record<GiftCategory, string[]> = {
  Discernment: [
    "Cynicism. The same instinct that detects falsehood may begin reading bad faith into honest difference.",
    "Pre-judgment. The eye that catches what doesn't add up may start declaring the verdict before the evidence has fully arrived.",
    "Suspicion as default. The discernment that protects accuracy may begin reading every difference as deception.",
  ],
  Pattern: [
    "Over-reading the future. The pattern you see clearly may stop being tested, and private interpretation may settle into private fact before evidence is in.",
    "Closing the read too soon. The pattern that lands first may shut out the patterns that need a longer look.",
    "Trusting the synthesis over the data. The shape you see may begin to feel realer than the messy specifics that shaped it.",
  ],
  // ... other categories: keep existing single-string entries; convert to single-element arrays for type uniformity
};
```

Selection per card uses card-position-based deterministic indexing (similar to D-5):

- First card to use the category: variant 0.
- Second card: variant 1.
- Third card (if cap-of-2 is loosened in some future CC; currently the cap holds at 2): variant 2.

Modify `BLIND_SPOT_TEXT` (the existing single-value lookup) to be replaced or wrapped by `BLIND_SPOT_TEXT_VARIANTS` plus a per-card-position selector. All other gift categories retain their current single canonical blind-spot phrase as variant 0; their variants array has just that one entry, OR is extended with 1–2 alternates for editorial richness if the agent wishes (optional for this CC; the must-fix is `Discernment` and `Pattern`).

### D-7: Result-writing canon document

Create `docs/canon/result-writing-canon.md`. Structure (the agent fills in prose; below is the section list and what each must contain):

```markdown
# Result-Writing Canon

## Purpose
Codifies the editorial discipline rules that govern user-facing prose generation in the Inner Constitution and Mirror. Every CC that authors or modifies user-facing prose templates must read this file first and respect every rule.

## The Seven Rules (Clarence's framing)

1. **Default output begins with a short Mirror section, not the full diagnostic.** [CC-015b implements; CC-015a does not yet enforce.]
2. **Card diagnostics are secondary / expandable.** [CC-015b implements; CC-015a does not yet enforce.]
3. **Avoid repeating the same blind spot across cards unless each instance adds a distinct expression.** [CC-015a enforces via per-category variant pools and the cap from CC-011b.]
4. **No placeholder labels may surface to the user, including "{card}-card risk under pressure."** [CC-015a enforces via TOP_RISK_CARD_FALLBACK.]
5. **Replace clinical Jungian language with lived-language first; put function labels in small secondary text.** [CC-015a enforces via FUNCTION_VOICE; function codes appear only in MBTI disclosure body.]
6. **Each result must include: one-sentence shape summary, top 3 gifts, top 3 traps, relationship translation, pressure translation, 3 next moves.** [CC-015b's Mirror generator implements this.]
7. **The result should feel written, not assembled.** [Editorial north star; informs every CC.]

## Voice descriptor table (canonical mapping)

[Table from § D-1 of CC-015a — the 8 voices.]

## Protected lines

The following lines are product-quality and may NOT be modified by any future CC without explicit canon revision to this file:

- "a possibility, not a verdict"
- "the final authority on what fits is yours"
- "Private interpretation may settle into private fact before evidence is in."
- "Standing alone starts to feel like the only way to stand."
- "When detecting bad faith becomes assuming bad faith."
- "The translation is rarely about doing less of yourself — it is usually about being more legible."
- "None of these is who you are; each is who you may become if the load is not eased."
- "The mature version of this shape does both: it builds the bridge and still notices the person standing in the rain."
- "That gives people a way to follow you before they have to decide whether to trust the verdict."

Future CCs may use these lines verbatim in templated prose. They may not paraphrase, abbreviate, or replace.

## Repetition rules

- The same gift category may appear in at most **two** cards in any single rendering. (Per CC-011b's cap; preserved.)
- Identical Blind Spot phrase in at most **two** cards.
- Identical Growth Edge phrase in at most **one** card.
- Identical full sentence appears at most **once** across the entire rendered output.
- Variant pools (per § D-2 of result-writing-canon, mapped from CC-015a's implementation) provide alternates when the cap is hit.

## Variation rules

- Value-list phrasing varies across call sites per § D-5 of CC-015a. Same user gets the same output (deterministic); same rendering varies the phrasing across multiple references.
- Per-process under-pressure behaviors (§ D-3 of CC-015a) replace abstract function-code pressure language wherever it appears.

## What this canon does NOT govern

- Question text, gloss text, voice quotes (those are governed by `question-bank-v1.md`).
- Signal definitions (`signal-library.md`).
- Tension definitions (`tension-library-v1.md`).
- Per-card derivation rules (`output-engine-rules.md`).
- The body-map metaphor or card names (`shape-framework.md`).

This canon governs only the editorial layer — how the engine's structured output gets turned into user-facing prose.

## Relationship to other canon files

- Sits above `inner-constitution.md` (which describes what to render) and below `output-engine-rules.md` (which describes how to derive). This file describes **how the rendering should sound.**
- Future Mirror-generator work (CC-015b) reads this file as its tone-and-discipline reference.
```

The agent writes this file. The seven rules go in verbatim with light prose around each. The voice descriptor table is reproduced. The protected lines list is reproduced. The repetition / variation rules are stated as canonical rules.

### D-8: Five Dangers compliance for new prose

Every new prose variant introduced by CC-015a — voice descriptors, under-pressure behaviors, fallback labels, Cynicism / Pattern variants, value-list variants, the result-writing-canon prose — must respect `shape-framework.md` § Five Dangers:

1. No "you are [type]" framings.
2. No stress-as-revelation language.
3. No moralizing on trust, values, or contact profiles.
4. No clinical implication.
5. No type-label headlines.

The under-pressure behaviors in particular must read as *"this is what may happen under pressure"* not *"this is who you really are when stressed."* Conditional, not declarative.

### D-9: Determinism preserved

All variant selections must be deterministic — same input answers must produce the same output. Use card position index (0–7) and entry position (0–N) as the seeds, not random values. (Same rule as CC-011b's variant pools; preserved.)

---

## Requirements

### 1. Create `docs/canon/result-writing-canon.md` per § D-7

Single new canon file. Structure per § D-7. Agent writes prose around the section list.

### 2. Add `FUNCTION_VOICE` and `FUNCTION_VOICE_SHORT` constants to `lib/identityEngine.ts` per § D-1

Two new exported constants. Existing `FUNCTION_NAME` and `FUNCTION_PHRASE` preserved.

### 3. Add `UNDER_PRESSURE_BEHAVIOR` constant to `lib/identityEngine.ts` per § D-3

One new exported constant.

### 4. Add `TOP_RISK_CARD_FALLBACK` constant to `lib/identityEngine.ts` per § D-4

One new exported constant. Used by `synthesizeTopRisks` when collision causes label fallback.

### 5. Add `valueListPhrase` helper to `lib/identityEngine.ts` per § D-5

One new exported helper function. Variant index passed by call sites.

### 6. Convert `BLIND_SPOT_TEXT` to `BLIND_SPOT_TEXT_VARIANTS` per § D-6

Existing constant `BLIND_SPOT_TEXT` either replaced by `BLIND_SPOT_TEXT_VARIANTS` (the new variant-array structure), OR retained alongside as a backward-compat alias pointing to variant 0. Either approach works — agent picks the one that produces minimal diff.

For `Discernment` and `Pattern` categories, three variants each per § D-6. Other gift categories may have 1, 2, or 3 variants — at minimum, all 12 categories have at least 1 (their existing canonical blind-spot phrase).

### 7. Update per-card derivation functions to use voice descriptors

In each of the eight per-card derivation functions, find every reference to `FUNCTION_NAME[fn]` or `FUNCTION_PHRASE[fn]` in body prose templates. Replace with `FUNCTION_VOICE[fn]` or `FUNCTION_VOICE_SHORT[fn]` per § D-2.

Where the existing template grammar awkwardly bolts the voice descriptor in (e.g., *"Ni-Te shape"*), restructure the sentence rather than substitute mechanically. The goal is plain conversational English.

For Risk Under Pressure cells specifically, integrate `UNDER_PRESSURE_BEHAVIOR[dom]` and `UNDER_PRESSURE_BEHAVIOR[inf]` per § D-3.

### 8. Update cross-card synthesis functions to use voice descriptors

Same treatment for `synthesizeTopGifts`, `synthesizeTopRisks`, `generateGrowthPath`, `generateRelationshipTranslation`, `generateConflictTranslation`, `generateMirrorTypesSeed`, `generateShapeSummary`. Replace function-code references with voices.

For `synthesizeTopRisks` specifically, integrate `TOP_RISK_CARD_FALLBACK` per § D-4. The fallback path produces a per-card editorial label instead of *"{Card}-card risk under pressure"*.

### 9. Apply `valueListPhrase` across call sites

Find every place where `compassLabels(topCompass)` is interpolated as a verbatim list. Replace with `valueListPhrase(topCompass, variantIndex)` where `variantIndex` is a deterministic call-site identifier (e.g., card position, section index).

### 10. Apply `BLIND_SPOT_TEXT_VARIANTS` per-card selection

Per-card derivation functions that look up the blind-spot text by gift category should track which variant index applies for THIS card (based on whether this is the first or second card with the category). Pass card-position info into the lookup.

### 11. Type-check and lint

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.

### 12. Manual smoke test

Re-run the synthetic INTJ + Knowledge-priority test session and confirm:

- No function codes (Ni, Ne, Si, Se, Ti, Te, Fi, Fe) appear in body prose. (They may still appear in the MBTI disclosure body and in internal logging — those are acceptable.)
- Voice descriptors (`pattern-reader`, `structurer`, etc.) appear naturally in per-card and cross-card prose.
- Per-card Risk Under Pressure cells use the per-process behavior templates from § D-3.
- *"Fire-card risk under pressure"* (and any other `{Card}-card risk under pressure`) does NOT appear in Top Risks.
- The value list (e.g., *"Knowledge, Truth, Faith, Freedom"*) appears in varied phrasings — at most 1–2 verbatim, others via variant phrasings.
- *"Cynicism..."* and *"Over-reading the future..."* each appear in at most 2 cards, and when two cards share the category, the SECOND card uses a different variant phrasing per § D-6.
- All eight per-card derivation outputs still produce non-empty cells.
- Top Gifts, Top Risks, Watch For, Growth Path, Relationship Translation, Conflict Translation, Mirror-Types Seed all still produce non-empty output.
- Five Dangers compliance maintained on every variant.

If browser smoke testing is performed by the user instead of the agent, the agent must clearly state in report-back that browser testing was deferred.

---

## Allowed to Modify

**Canon (one new file only):**

- `docs/canon/result-writing-canon.md` — NEW per § D-7.

**Code:**

- `lib/identityEngine.ts` — add constants per §§ 2–4, add helper per § 5, modify existing constant per § 6, update per-card derivation functions per § 7, update cross-card synthesis functions per § 8, apply helper per §§ 9–10. Preserve all existing engine functions, aggregation helpers, signal definitions, and rules verbatim.

Do **NOT** modify:

- Any other file under `docs/canon/`. Specifically: `shape-framework.md`, `inner-constitution.md`, `output-engine-rules.md`, `tension-library-v1.md`, `signal-library.md`, `signal-mapping-rule.md`, `signal-and-tension-model.md`, `card-schema.md`, `temperament-framework.md`, `research-mapping-v1.md`, `validation-roadmap-v1.md`, `question-bank-v1.md`. Canon edits are limited to creating the one new file listed above.
- `lib/types.ts` — no type changes.
- `data/questions.ts` — no question changes.
- Any file under `app/` — renderer is unchanged.
- Any tension detection rule.
- Any signal definition (`SIGNAL_DESCRIPTIONS`, `SACRED_PRIORITY_SIGNAL_IDS`, `STRENGTHENERS`, `STACK_TABLE`, `MBTI_LOOKUP`).
- Any aggregation helper (`aggregateLensStack`, `getTopCompassValues`, etc.) — these stay byte-identical.
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`, `postcss.config.mjs`.

---

## Out of Scope

CC-015a does NOT do any of the following. Each is CC-015b, CC-016, or v2 territory.

- **Mirror generator.** New `MirrorOutput` type, `generateMirror()` function, per-shape move-vocabulary for *Next 3 Moves* — all CC-015b.
- **Renderer changes.** Map cards as inline accordion, Mirror at top of result page, cell-label rename (Strength / Trap / Next move), pressure consolidation into a single cross-card section — all CC-015b.
- **Per-card process inflection architecture** (Clarence's deeper integration: Heart-as-Fi-or-Fe, Listen-as-Si-or-Te-or-Ti-or-Fe, etc.). Substantial new architecture — CC-016 / v2.
- **Body-part metaphor revisions.** User is still iterating on Gait specifically and the broader body-part adjective set. CC-015a does not rename body parts.
- **Path-as-process-integration framing** (the missing-counterweight reading: strong Ni needs Se, etc.) — folds into CC-015b's Path expansion (Work / Love / Give + growth).
- **New questions, signals, tensions, or canon docs** beyond `result-writing-canon.md`.
- **Engine derivation rule changes.** No changes to the six rules from `output-engine-rules.md`.
- **Tension detection rule changes.** All 12 tensions stay as-is.
- **MBTI disclosure body changes.** The optional MBTI disclosure component (`MbtiDisclosure.tsx`) is unchanged. Function codes still appear there.
- **Persistence / autosave / sharing.**
- **Always-on rank-or-pick channel** (V1.5 for CC-014).

---

## Acceptance Criteria

1. `docs/canon/result-writing-canon.md` exists with the structure per § D-7. The seven rules, the voice descriptor table, the protected-lines list, the repetition rules, the variation rules are all present.
2. `lib/identityEngine.ts` has new exports: `FUNCTION_VOICE`, `FUNCTION_VOICE_SHORT`, `UNDER_PRESSURE_BEHAVIOR`, `TOP_RISK_CARD_FALLBACK`, `valueListPhrase`. `BLIND_SPOT_TEXT` either replaced by or coexists with `BLIND_SPOT_TEXT_VARIANTS`.
3. Per-card derivation functions (`deriveLensOutput` through `derivePathOutput`) reference `FUNCTION_VOICE` / `FUNCTION_VOICE_SHORT` in body prose, not `FUNCTION_NAME` / `FUNCTION_PHRASE`. Risk Under Pressure cells use `UNDER_PRESSURE_BEHAVIOR`.
4. Cross-card synthesis functions reference `FUNCTION_VOICE` / `FUNCTION_VOICE_SHORT` in body prose. `synthesizeTopRisks` uses `TOP_RISK_CARD_FALLBACK` for collision fallback.
5. Smoke test confirms: no function codes in body prose; per-process under-pressure behaviors appear in Risk Under Pressure cells; *"Fire-card risk under pressure"* (and any other `{Card}-card risk under pressure`) does not appear; value-list phrasing varies across the rendered output.
6. *"Cynicism..."* and *"Over-reading the future..."* each appear in at most 2 cards; when 2 cards share, the SECOND card uses a different variant.
7. All Five Dangers compliance maintained.
8. Determinism preserved — same answers always produce same output.
9. `npx tsc --noEmit` passes cleanly.
10. `npm run lint` passes cleanly.
11. No file outside the Allowed to Modify list has been edited.
12. No type changes (`lib/types.ts` byte-identical).
13. No tension detection block modified.
14. No signal definition modified.
15. No question modified.
16. Renderer unchanged (`app/` byte-identical).
17. The protected-lines list in `result-writing-canon.md` includes all 9 protected lines from § D-7.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description.
2. **Result-writing canon** — quote the seven rules section verbatim from the new `result-writing-canon.md`. Quote the voice descriptor table. Quote the protected lines list. Confirm the file exists and is well-formed.
3. **Voice descriptors** — quote `FUNCTION_VOICE` and `FUNCTION_VOICE_SHORT` constants verbatim. Confirm the eight mappings.
4. **Under-pressure behaviors** — quote `UNDER_PRESSURE_BEHAVIOR` constant verbatim. Show one before/after of a Risk Under Pressure cell rewrite.
5. **Top Risks fallback** — quote `TOP_RISK_CARD_FALLBACK` and the updated `synthesizeTopRisks` fallback logic.
6. **Value-list variation** — quote `valueListPhrase` helper. Show one example call site update.
7. **Blind-spot variants** — quote `BLIND_SPOT_TEXT_VARIANTS` for `Discernment` and `Pattern` (the two with required 3-variant pools). Quote the per-card selection logic showing how the second card with the same category gets variant 1.
8. **Per-card derivation update — Lens example** — quote the updated `deriveLensOutput` body. Show that no function codes (`Ni`, `Te`, etc.) appear in the Gift / Blind Spot / Growth Edge / Risk Under Pressure templates. Confirm voice descriptors flow naturally.
9. **Per-card derivation update — other cards** — quote one updated cell from each of `deriveCompassOutput`, `deriveConvictionOutput`, `deriveGravityOutput`, `deriveTrustOutput`, `deriveWeatherOutput`, `deriveFireOutput`, `derivePathOutput`. Confirm voice register.
10. **Cross-card synthesis update — Mirror Seed** — quote the updated `generateMirrorTypesSeed`. Confirm voice descriptors used; confirm protected lines preserved verbatim.
11. **Smoke-test results** — re-run the synthetic INTJ + Knowledge-priority session. Confirm: zero function codes in body prose; varied value-list phrasing; killed *"Fire-card risk under pressure"*; second occurrences of `Cynicism` and `Over-reading the future` use variant phrasings; all eight cards still produce non-empty output. If browser smoke testing was deferred to the user, say so explicitly.
12. **Five Dangers compliance** — explicit confirmation that no new variant violates any of the five dangers.
13. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
14. **Scope-creep check** — explicit confirmation that:
    - Only `docs/canon/result-writing-canon.md` was added under `docs/canon/`.
    - Only `lib/identityEngine.ts` was modified.
    - No tension detection block, signal definition, or aggregation helper was modified.
    - No file under `app/`, `data/`, or any other production directory was touched.
    - `lib/types.ts` byte-identical.
    - The Mirror generator, Map restructure, cell-label rename, pressure consolidation are all NOT in this CC.
    - Per-card process inflection architecture (Clarence's deeper integration) is NOT in this CC.
    - Body-part metaphor revisions are NOT in this CC.
15. **Risks / next-step recommendations** — anything that surfaced. Specifically:
    - Whether any per-card prose template required substantial restructuring (vs. simple substitution) to integrate voice descriptors. Flag any sentence that read awkwardly after substitution and would benefit from further polish.
    - Whether the under-pressure behavior templates produced naturally for all eight cards' Risk Under Pressure cells, or whether some cards' contexts required adaptation.
    - Whether `TOP_RISK_CARD_FALLBACK` labels read as editorial (vs. mechanical) — flag any that feel weak.
    - Whether the *Cynicism* and *Over-reading the future* second-variant phrasings are sufficient or whether more variants would help.
    - Confidence that CC-015b's Mirror generator can build on the cleaned voice register without re-authoring substantial prose. (Should be high — CC-015a is the prerequisite, not the duplicate work.)
    - Any other observation worth surfacing.
