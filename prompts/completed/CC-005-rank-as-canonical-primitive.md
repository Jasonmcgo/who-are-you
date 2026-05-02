# CC-005 — Rank as Canonical Primitive

## Goal

Land the canonical foundation for ranking. Every subsequent CC (CC-006 Sacred ranked, CC-007 Institutional, CC-008 Responsibility, CC-009 Temperament Four Voices, plus design-system CCs) depends on this one. CC-005 is **canon-only** — six canon files change, **no code is touched**.

After CC-005 lands, the canon authorizes:

- A new question type `ranking` alongside the existing `forced` and `freeform`.
- A canonical mapping from ranking position to signal strength (position-1 → high, position-2 → medium, tail → low).
- A `rank` field on signals, and a `rank_aware` flag on signal-library entries.
- A `display_name` field on cards (so Temperament can present to the user as "Four Voices" while keeping its canon name).
- A `break` interstitial entry type for ambient-pause moments inside a card flow.
- A revised Temperament signal family — 8 rank-aware per-function signals replacing the previous 24-signal stack-position family.

No questions get added or migrated in CC-005. No tensions change. No engine logic changes. The point is to make the schema and rules ready so subsequent CCs have a target.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input. This prompt is self-contained.

If something is genuinely ambiguous, apply the most canon-faithful interpretation and flag the decision in the Risks / next-step recommendations section of the report-back — do not halt to ask.

If a prerequisite appears missing (a referenced file is absent, a check fails, a canon block has drifted since this prompt was written), attempt the canon-faithful equivalent, record the discrepancy in the report, and continue. Do not stop short.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

Canon (all six are in scope for edits, all must be read in full first):

- docs/canon/card-schema.md
- docs/canon/question-bank-v1.md
- docs/canon/signal-mapping-rule.md
- docs/canon/signal-and-tension-model.md
- docs/canon/signal-library.md
- docs/canon/temperament-framework.md

Reference (not edited, but the spec source for what's being canonized):

- docs/design-spec-v1.md
- docs/option-glosses-v1.md
- docs/temperament-voice-draft-v1.md
- docs/open-design-calls.md

---

## Context

The product is migrating from forced-choice questions to ranked-list questions for several of its hardest items: Sacred Values (Q-S1, Q-S2), Institutional Trust (Q-X3), Responsibility Attribution (Q-C4), and the entire Temperament card (Q-T1–Q-T8). The design lab's spec (`docs/design-spec-v1.md`) documents both the visual and interaction design and the data-shape implications.

CC-005 lands the canonical scaffolding for that migration. It does not add any ranked questions (those come in CC-006 through CC-009), and it does not change engine behavior (that comes in CC-010). It only updates the canon schemas and registration rules so the per-question CCs have a stable target to bind to.

The Temperament card's signal family changes the most. The previous design (per `temperament-framework.md` v1) emitted 24 stack-position signals (8 functions × 3 positions: dominant / present / inferior). Under the ranked design, each Temperament question emits per-function signals carrying rank metadata, and stack position is derived from aggregate rank across the four questions each function appears in. The new family is just 8 rank-aware function signals (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`).

---

## Requirements

### 1. Card schema — add ranking question type, display_name, and break interstitial

Edit `docs/canon/card-schema.md`:

a. **Question type union.** Wherever `card-schema.md` documents the question type as `forced | freeform`, expand to `forced | freeform | ranking`. Add a short paragraph defining `ranking`: a question that presents N items (canonically 4 or 5) and asks the user to order them. Each ranking question carries an `items` array; each item has an `id`, a `label`, and an optional `gloss` (or `voice` + `quote` in the Temperament-row variant). The user's answer is the ordered list of item ids.

b. **Item count cap.** Add a canonical rule: ranking questions may have **4 or 5 items only**. 6 or more items is forbidden — if a future question wants more options, it must split or use a different control. Verbatim addition acceptable: *"Ranking questions canonically present 4 or 5 items. 6+ items is not supported by the canonical interaction; questions wanting more must split or be redesigned."*

c. **`display_name` field on Card.** Add an optional `display_name?: string` field to the Card schema. Its purpose: a user-facing label that may differ from the canonical card name. The canonical name is used in canon (signal `from_card`, tension references, signal-library entries); the `display_name` is used by the UI when shown to the user. If `display_name` is absent, the UI uses the canonical card name. Add an example: Temperament card may have `display_name: "Four Voices"`.

d. **Break interstitial type.** Add a new entry type for ambient-pause moments inside a card's question flow. Schema:

```
type BreakInterstitial = {
  break_id: string;          // e.g. "B-T1"
  card_id: CardId;           // the card this break appears in
  type: "break";             // discriminator
  position_after: string;    // the question_id this break appears immediately after (e.g. "Q-T3")
  text: string;              // the prose shown (e.g. "pause. take a breath.")
  action_label: string;      // the button text (e.g. "ready")
};
```

A break is not a question. It produces no signals. It exists in the question flow to give the user a pause. The user may scroll past it freely; the action button advances the flow. The engine ignores breaks during signal derivation.

Position the schema additions in `card-schema.md` so the existing structure stays intact. Do not renumber, reorder, or re-style anything that's already in the file.

### 2. Question-bank — schema additions for ranking and break entries

Edit `docs/canon/question-bank-v1.md`:

a. **Schema preamble.** Wherever the file documents the question-entry shape (likely near the top), add a section showing the ranking-question shape:

```
## Q-X (example)

- card_id: <card>
- type: ranking
- question: <prompt text>
- helper: <optional one-line sub-prompt>
- items:
  - id: <stable item id>
    label: <user-facing short label>
    gloss: <one-line descriptor>
    signal: <signal_id this item carries>
  - ...
```

For Temperament-style ranking with voice quotes, document the variant:

```
- items:
  - id: <stable id>
    voice: <e.g. "Voice A">
    quote: <serif italic first-person statement>
    signal: <signal_id>
```

A ranking item must have either `label`+`gloss` or `voice`+`quote`. Both shapes are valid.

b. **Break-interstitial preamble.** Document the break entry shape:

```
## Break — B-X (example)

- card_id: <card>
- type: break
- position_after: <question_id>
- text: <prose shown to user>
- action_label: <button text>
```

c. **Do not add any actual ranking questions or break entries in CC-005.** Q-S1 stays as the existing forced version. Q-S2, Q-X3, Q-C4, Q-T1–Q-T8 are not added here. Their migration belongs in CC-006 through CC-009. CC-005 only adds the schema description.

### 3. Signal-mapping-rule — ranking position to signal strength

Edit `docs/canon/signal-mapping-rule.md`:

Add a new top-level section titled `## Ranking Question Signal Emission`. The section must document:

- A ranking question of N items emits N signals — one per item — each carrying a `rank: n` field where n ∈ {1, 2, …, N}.
- Position 1 emits the item's signal at strength `high`.
- Position 2 emits the item's signal at strength `medium`.
- Positions 3 through N emit the item's signal at strength `low`.
- For 5-item rankings specifically, positions 4 and 5 are additionally noted as "also present" — meaning the signal is recorded but should be treated as low-confidence by tension detection. This is a downstream-tension-author concern, not an engine flag.
- Tensions consuming rank-aware signals may read the `rank` field to make decisions (e.g. "fires when signal X has rank ≤ 2"). The current canonical tensions (T-001 through T-012) are not rewritten in CC-005; tension-side rank-awareness is a future CC.

Source: `docs/design-spec-v1.md` § 3.7 and § 8 (open call 3) authorize this strength model.

### 4. Signal-and-tension-model — rank field on Signal

Edit `docs/canon/signal-and-tension-model.md`:

a. **Signal schema.** Add an optional `rank?: number` field to the Signal shape. Document: present only on signals derived from ranking questions; absent on signals from forced or freeform questions.

b. **Rank-aware section.** Append a short section titled `## Rank-Aware Signals` explaining that some signals carry rank metadata, that the rank value records the position the underlying ranking item occupied, and that tensions may filter by rank when relevant. One paragraph is sufficient.

c. **Do not modify the existing Tension object schema** or any other prose. Append, do not restructure.

### 5. Signal-library — `rank_aware` field

Edit `docs/canon/signal-library.md`:

a. **Per-Signal Entry Schema.** Add `rank_aware: boolean` to the schema. Default value: `false`. Document: when `true`, signals of this id carry a `rank` field as described in `signal-and-tension-model.md`.

b. **Status definitions.** Add a clarifying note: a `rank_aware` signal is `active` if at least one canonical tension consumes the signal — at any rank — or if it strengthens a tension via a `Strengtheners:` field.

c. **Do not retroactively flag any existing signal entry** as `rank_aware` in CC-005. The signals that will become rank-aware (the Sacred `*_priority` family, the institutional family that Q-X3 will produce, the responsibility family Q-C4 will produce, and the eight Temperament function signals) all get re-registered with `rank_aware: true` in their respective per-question CCs (CC-006 through CC-009). CC-005 only adds the schema field and the supporting language.

d. **Append one informational note** at the top of the signal entries section (or wherever appropriate): "Signals destined for ranking questions (forthcoming Q-S1 ranked, Q-S2, Q-X3, Q-C4, Q-T1–Q-T8) will be re-registered as `rank_aware: true` in CC-006 through CC-009. Existing entries are unchanged in CC-005."

### 6. Temperament-framework — replace 24-signal family with 8 rank-aware functions

Edit `docs/canon/temperament-framework.md`. This is the heaviest edit in the CC.

a. **§6 Signal Family — full rewrite.** Replace the existing 24-signal family (`{function}_{position}` with position ∈ dominant/present/inferior) with the new rank-aware family:

The Temperament card emits 8 function signals: `ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`. Each is `rank_aware: true`. Each emits with a `rank` field and a `source_question` field naming the Q-T question that produced it. Across the 8 Q-T questions, each function appears in exactly 4 (per `docs/design-spec-v1.md` § 4 and the structure in `docs/temperament-voice-draft-v1.md`). Aggregate rank across the four appearances determines stack position.

Naming: signal id is just the lowercase function code (e.g. `ni`, `te`). No suffix.

Drop the previous 24-signal enumeration entirely from this section.

b. **§4 Function Stacks and Type Derivation — update.** The dominant function is the one with the lowest aggregate rank across its four perceiving questions (for Ni/Ne/Si/Se) or four judging questions (for Ti/Te/Fi/Fe). The auxiliary follows from the canonical stack table once the dominant is identified. The Canonical Stack Table itself stays unchanged.

c. **§5 Pressure Patterns — preserve, but reframe.** The inferior-grip patterns are still canonical theory. They are no longer probed by direct questions (the old Q-T11/Q-T12 inferior-grip block is dropped per `docs/open-design-calls.md` § 4 lock). The patterns now exist as canonical knowledge that the engine and tension authors may consult; they no longer correspond to dedicated probe questions. Update the section's framing to make this clear; preserve the eight grip descriptions verbatim.

d. **§7 Tension Hooks — update signal references.** Anywhere the old 24-signal family is referenced (e.g. "Ni-dominant signal" referring to `ni_dominant`), update to refer to the rank-aware signal (e.g. "Ni signal at low aggregate rank" or equivalent). Tension-detection rules using these signals will be authored in a later CC; CC-005 only updates the prose so it's consistent with the new family.

e. **§8 Question Design Principles — update.** All 8 Q-T questions are `type: ranking`. Each presents 4 voice-styled items per `docs/temperament-voice-draft-v1.md`. Update the question-construction guidance to reflect ranking, not forced choice. Remove or rewrite anything that assumed forced-choice probes.

f. **Display name.** Add a one-line note that the user-facing card label is "Four Voices" (set via the new `display_name` field on the card schema), while the canonical card_id remains `temperament`.

g. **Decision_friction.** The `decision_friction` signal previously canonicalized in this doc (per the Q-T9/Q-T10 dominant-probe block) is **deferred** in CC-005 — there are no dominant probes anymore. Flag in §6 that whether to allow a `decision_friction` opt-out on ranked Temperament questions is a CC-009 design call. Do not remove the signal from canon entirely; mark it as `unused` pending decision.

h. **Do not modify** the Canonical Rules section, the Eight Cognitive Functions descriptions in §3, the Canonical Stack Table itself, the Pressure Pattern grip descriptions, the Deferred Layers section, or any of the front-matter Purpose / Canonical Scope / Status Definitions material.

### 7. Cross-file consistency check

After all six edits, verify:

- Every reference to "ranking" question type in any of the six files uses the same lowercase token (`ranking`, not `Ranking` or `RANKING`).
- Every reference to the rank-strength mapping (high / medium / low for positions 1 / 2 / 3+) is consistent across `signal-mapping-rule.md` and any other file that mentions it.
- The 8 Temperament function signal ids (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) are spelled identically wherever they appear across the six files.
- The "Four Voices" display name appears only as `display_name` metadata, never as a card_id replacement.

If any inconsistency surfaces, fix it in the same edit pass.

---

## Allowed to Modify

- `docs/canon/card-schema.md` — add ranking type, display_name, break interstitial per §1
- `docs/canon/question-bank-v1.md` — add schema preambles per §2; do not add actual ranking questions
- `docs/canon/signal-mapping-rule.md` — add ranking-strength rule per §3
- `docs/canon/signal-and-tension-model.md` — add rank field + rank-aware section per §4
- `docs/canon/signal-library.md` — add rank_aware field + supporting language per §5
- `docs/canon/temperament-framework.md` — rewrite §6 Signal Family + supporting updates per §6

Do **not** modify:

- `docs/canon/tension-library-v1.md` (no tension changes in CC-005)
- `docs/canon/inner-constitution.md`
- `docs/canon/foundational-system.md`
- `docs/canon/freeform-signal-extraction.md`
- `docs/canon/freeform-extraction-prompt.md`
- `docs/canon/question-design-standard.md`
- `docs/canon/engine-building-blocks.md`
- `lib/types.ts` — code, defer to CC-006
- `lib/identityEngine.ts` — code, defer to CC-010
- `data/questions.ts` — code, defer to CC-009
- `app/page.tsx`
- Any file under `app/components/` or elsewhere in `app/`
- Any file under `prompts/`
- `docs/design-spec-v1.md`, `docs/open-design-calls.md`, `docs/option-glosses-v1.md`, `docs/temperament-voice-draft-v1.md` (these are the source documents; CC-005 reads from them, does not edit them)
- `docs/design-prototype/` and any contents
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, any other root-level file

---

## Out of Scope

- Adding any ranking question (Q-S1 ranked, Q-S2, Q-X3, Q-C4, Q-T1–Q-T8). Those land in CC-006 through CC-009.
- Adding any break interstitial entry (B-T1 / B-T2 for the Temperament pause pages). Those land in CC-009.
- Modifying any signal entry in `signal-library.md` to flag it as `rank_aware: true`. That happens per-question in CC-006 through CC-009.
- Engine code: `applyRanking` derivation, the ranking-pass, `RankingAnswer` type, etc. All in CC-010.
- UI code: ranking primitive component, question shell, tension card, Constitution layout. CC-006 / CC-007-CC-013.
- Tension rewrites — no tension's canonical rule changes in CC-005. T-009, T-012, etc. that depend on rank-aware signals will be updated in their own future CCs.
- New tensions — none in CC-005.
- New signals beyond what's already in canon — CC-005 only re-classifies the Temperament family from 24 signals to 8 rank-aware function signals; no signal ids outside that family are added.
- Removing `decision_friction` from canon entirely. CC-005 marks it as `unused` pending CC-009.
- Removing `balanced_responsibility` from canon. CC-008 will deprecate it as part of the Q-C4 ranking migration.
- Updates to `docs/design-spec-v1.md` itself. CC-005 reads from it; the spec is the source of truth and does not change here.
- Visual / typography / color tokens. Those are CC-007 (per the spec's CC slicing).
- Any change to existing forced-choice or freeform questions.
- Persistence (localStorage / autosave). The spec authorizes autosave UI but the persistence implementation is its own future CC.

---

## Acceptance Criteria

1. `docs/canon/card-schema.md` documents `ranking` as a valid question type alongside `forced` and `freeform`. The 4-or-5-items rule is stated. The `display_name?` field is added to the Card schema. The `break` interstitial type is documented with the schema in §1.d.
2. `docs/canon/question-bank-v1.md` contains schema preambles for both ranking-question entries (label/gloss and voice/quote variants) and break-interstitial entries. No actual ranking question or break entry is added in CC-005.
3. `docs/canon/signal-mapping-rule.md` contains a `## Ranking Question Signal Emission` section specifying position-1 → high, position-2 → medium, positions 3+ → low; with the additional "also present" note for positions 4 and 5 of 5-item rankings.
4. `docs/canon/signal-and-tension-model.md` Signal schema includes `rank?: number`, and a new `## Rank-Aware Signals` section appears at the end of the file.
5. `docs/canon/signal-library.md` Per-Signal Entry Schema includes `rank_aware: boolean` (default `false`). An informational note about forthcoming rank-aware re-registration in CC-006–CC-009 appears in the file. No existing entry is modified to flip its `rank_aware` flag.
6. `docs/canon/temperament-framework.md` §6 Signal Family is rewritten to register 8 rank-aware function signals (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`). The previous 24-signal `{function}_{position}` family is removed from §6. §4 type derivation, §5 pressure patterns, §7 tension hooks, and §8 question design principles are updated for consistency. The Canonical Stack Table in §4 is unchanged. The Eight Cognitive Functions descriptions in §3 are unchanged.
7. The "Four Voices" display name is documented in `temperament-framework.md` as a `display_name` value, not a card_id replacement.
8. `decision_friction` is marked as `unused` pending CC-009, not removed.
9. Cross-file consistency: `ranking`, `rank`, `rank_aware`, the strength mapping, the 8 function signal ids, and the "Four Voices" display name all spelled and used consistently across the six edited files.
10. No file outside the Allowed to Modify list has been edited. No code file has been touched. No file under `prompts/`, `app/`, `lib/`, `data/` has been touched.
11. The whole CC is canon-only; the running app's behavior is unchanged after CC-005.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — one bullet per file with a one-line description of the edit.
2. **Card schema deltas** — quote the new `ranking` question-type description, the `display_name` schema entry, and the `break` interstitial schema as written in `card-schema.md` after edit.
3. **Question-bank schema deltas** — quote the ranking-question and break-interstitial schema preambles as written in `question-bank-v1.md` after edit.
4. **Signal-mapping-rule deltas** — quote the new `## Ranking Question Signal Emission` section in full.
5. **Signal-and-tension-model deltas** — quote the new `## Rank-Aware Signals` section and the `rank?: number` addition to the Signal schema.
6. **Signal-library deltas** — quote the updated Per-Signal Entry Schema and the informational note about forthcoming rank-aware re-registration.
7. **Temperament-framework deltas** — quote the rewritten §6 Signal Family in full. Briefly summarize what changed in §4, §5, §7, §8, and what stayed the same.
8. **Cross-file consistency check** — confirm `ranking`, `rank`, `rank_aware`, the strength mapping, the 8 function signal ids, and "Four Voices" are consistent across all six files. Name any consistency issue found and how it was resolved.
9. **Scope-creep check** — explicit confirmation that:
   - No code file was modified.
   - No actual ranking question or break entry was added to `question-bank-v1.md`.
   - No existing `signal-library.md` entry had its `rank_aware` flag flipped.
   - No tension was modified in `tension-library-v1.md`.
   - No file outside the Allowed to Modify list was touched.
10. **Risks / next-step recommendations** — flag anything that surfaced during the edit pass that the next CC (CC-006 Sacred ranked) needs to know. In particular: any canonical reference in another (unedited) file that may need updating in a future CC because of CC-005's changes.
