# CC-024 — Keystone Block Restructure (Q-I1 reframe + Q-Stakes1 + Q-I3 redefinition)

**Type:** Question-bank surgery + engine derivation update.
**Goal:** Resolve the Keystone block's verb-semantics composition error by reframing Q-I1, introducing a new ranking question (Q-Stakes1) on the Compass card that ranks concrete loss domains, and re-deriving Q-I3 from Q-Stakes1 instead of from sacred values (Q-S1 / Q-S2).
**Predecessor:** CC-022a (second-pass trigger relocation) and CC-023 (loop hotfix). Both shipped.
**Successor:** CC-025 (engine prose tuning Round 2) will extend Compass output prose to incorporate stakes; CC-026 (Path 3C's Allocation) is queued separately.
**Architecture spec:** `prompts/queued/Q-I3-restructure-notes.md`. Read that file first — it captures the "why" in detail. This CC is the implementation lift.

---

## Why this CC

Two parallel structural errors exist in the Keystone block today, both rooted in the same architectural rule: **a question's verb must compose with the source card's semantics (or the block's purpose).**

1. **Q-I1** asks *"What is something you believe that most people around you disagree with?"* The verb composes with **social-differentiation register** — "controversial opinions" — instead of the block's intended **cost-of-conviction register**. Real-user testing (Madison, Jason, Michele) confirmed users drift toward differentiated takes rather than costly held beliefs.

2. **Q-I3** asks *"What would you risk losing for this belief?"* with sacred values (Q-S1 / Q-S2 top-3) as the answer space. *Sacred-by-definition* means *not-to-be-sacrificed* — asking a user to rank-order their sacred values by sacrificiability is incoherent. Honest answer is "I wouldn't want to lose any of those for anything," which is also a refusal of the question.

The fix (Path C in the notes, decided 2026-04-26):
- Reframe Q-I1 to cost-bearing register.
- Introduce **Q-Stakes1** on the Compass card — a 5-item ranking of concrete loss domains.
- Re-derive Q-I3 from Q-Stakes1 top-3, plus None and Other.

The Compass card extension is itself responsive to a separate observation Jason has flagged: that the Compass output is undifferentiated across users (everyone gets the same 4 items in different order: Family, Freedom, Faith, Loyalty). Q-Stakes1 adds a second register on Compass (concrete stakes alongside abstract sacred values), giving the card more measurement surface.

---

## Scope

This CC modifies a focused set of files:

1. `data/questions.ts` — reframe Q-I1, insert Q-Stakes1 between Q-E1-cross and Q-I1, redefine Q-I3.
2. `lib/types.ts` — add 5 new SignalIds for Q-Stakes1; no other type changes.
3. `lib/identityEngine.ts` — update BeliefUnderTension construction to pull `cost_dimensions` from Q-Stakes1 + Q-I3 instead of Q-S1 / Q-S2.
4. `lib/beliefHeuristics.ts` — update `summarizeQI3Selections` to read from Q-Stakes1-derived items.
5. `docs/canon/question-bank-v1.md` — Q-Stakes1 entry; Q-I1 / Q-I3 updates.
6. `docs/canon/signal-library.md` — 5 new signals registered.
7. `docs/canon/keystone-reflection-rules.md` — BeliefUnderTension cost-dimensions update.
8. `docs/canon/shape-framework.md` — Compass card extension paragraph (concrete stakes alongside abstract values).

Nothing else. No `app/page.tsx` changes (the second-pass trigger uses `questions.findIndex(q => q.question_id === "Q-I1")`, so `Q_I1_INDEX` auto-shifts when we insert Q-Stakes1 before it). No component changes. No `MapSection` / `QuestionShell` edits. No `lib/renderMirror.ts` edits.

---

## Steps

### 1. Q-I1 reframe (`data/questions.ts`)

Change Q-I1's `text` from:

```
"What is something you believe that most people around you disagree with?"
```

to:

```
"What is a belief you'd bear real cost to keep?"
```

Update Q-I1b's `text` from:

```
"Ok, maybe not most. How about a belief that at least half the people around you disagree with?"
```

to:

```
"Ok, maybe not a heavy cost. How about a belief you'd defend even when it makes things harder?"
```

Both stay `card_id: "conviction"`, `type: "freeform"`. Q-I1b stays `unskippable: true` and `render_if_skipped: "Q-I1"`.

The catalog of signals fired from these freeforms via `extractFreeformSignals` (independent_thought_signal, epistemic_flexibility, conviction_under_cost, cost_awareness) continues to fire as before — extractor is text-content-driven, not question-text-driven. Signal *quality* will likely improve because users will write more cost-shaped content; that's a desired side-effect, not a separate change.

### 2. Q-Stakes1 insertion (`data/questions.ts`)

Insert between Q-E1-cross (around line 334) and the Keystone block comment (around line 341). Definition:

```ts
{
  // CC-024 — Q-Stakes1. Compass card extension: concrete stakes ranking.
  // Pairs with Q-S1/Q-S2 (abstract sacred values) to give Compass a second
  // register — what the heart loves abstractly + what the heart fears
  // losing concretely. Feeds Q-I3's derivation (replacing Q-S1/Q-S2 as
  // the source) so Q-I3 asks about cost-bearing in coherent terms.
  question_id: "Q-Stakes1",
  card_id: "compass",
  type: "ranking",
  text: "Rank these by importance to your life — what would hurt most to lose.",
  helper: "Drag to reorder. Top is most important; bottom is least.",
  items: [
    {
      id: "money",
      label: "Money / Financial security",
      gloss: "Your money, savings, financial stability.",
      signal: "money_stakes_priority",
    },
    {
      id: "job",
      label: "Job / Career",
      gloss: "Your professional standing, your work.",
      signal: "job_stakes_priority",
    },
    {
      id: "close_relationships",
      label: "Close relationships",
      gloss: "Partner, family, closest friends.",
      signal: "close_relationships_stakes_priority",
    },
    {
      id: "reputation",
      label: "Reputation",
      gloss: "How others see you, your standing in your community.",
      signal: "reputation_stakes_priority",
    },
    {
      id: "health",
      label: "Physical safety / Health",
      gloss: "Your body, your safety.",
      signal: "health_stakes_priority",
    },
  ],
},
```

The 5 items are the canonical list decided in the architecture notes. The order shown above is canonical (matches the notes' list); the user reorders via drag.

### 3. Q-I3 redefinition (`data/questions.ts`)

Update Q-I3's `derived_from` and `derived_top_n_per_source`, and revise the helper to match the new answer space:

```ts
{
  // CC-024 — Q-I3 re-derived. Was multiselect_derived from Q-S1+Q-S2 (sacred
  // values) — incoherent because sacred-by-definition means not-to-be-sacrificed.
  // Now derives from Q-Stakes1 top-3 (concrete loss domains), so the verb
  // "would risk losing" composes with the answer space.
  question_id: "Q-I3",
  card_id: "pressure",
  type: "multiselect_derived",
  derived_from: ["Q-Stakes1"],
  derived_top_n_per_source: 3,
  text: "What would you risk losing for this belief?",
  helper: "Check all that apply. The model reads which concrete costs you'd bear for this belief.",
  none_option: { id: "none", label: "None of these" },
  other_option: { id: "other", label: "Other (please specify)", allows_text: true },
},
```

`card_id` stays `"pressure"` (Q-I3 reads cost-bearing under pressure; Fire/immune-response register — unchanged by the source-of-derivation shift).

`text` stays the same — it composes cleanly with concrete loss domains. Only the helper changes, replacing "sacred drivers" with "concrete costs."

### 4. SignalId union (`lib/types.ts`)

Add 5 new signal IDs to the `SignalId` union (or to the catalog the engine uses, depending on how it's structured today — engineer's call on placement, but the names are fixed):

```
money_stakes_priority
job_stakes_priority
close_relationships_stakes_priority
reputation_stakes_priority
health_stakes_priority
```

These follow the same `*_priority` shape used by other ranking-derived priority signals. `signalsFromRankingAnswer` (or whatever generic ranking-handler exists in `lib/identityEngine.ts`) should auto-handle Q-Stakes1 via the items' `signal` field; no new function needed.

### 5. BeliefUnderTension cost-dimensions update (`lib/identityEngine.ts`)

Find where BeliefUnderTension is constructed (search for `cost_dimensions` or `BeliefUnderTension`). Update the derivation so `cost_dimensions` is sourced from Q-Stakes1 + Q-I3 selections, not from Q-S1 / Q-S2. The shape of `cost_dimensions` may stay the same (string array of selected item ids); only the source array changes.

If the field name `cost_dimensions` no longer cleanly describes the new content (it's now concrete cost categories the user would bear, not sacred drivers they'd risk), consider whether a rename is warranted. **If unsure, keep the existing name** — rename is a separate concern and risks scope creep.

### 6. `summarizeQI3Selections` update (`lib/beliefHeuristics.ts`)

This helper currently reads Q-I3 selections in terms of "sacred drivers." Update it to read in terms of "concrete costs" — the function logic is the same (count selections, classify None vs. specified vs. Other), only the framing strings in the prose output change. If the function is called by Mirror prose generation, ensure the surrounding sentences read coherently with the new framing.

### 7. Canon docs

- `docs/canon/question-bank-v1.md` — add Q-Stakes1 entry; update Q-I1 and Q-I3 entries to reflect new text / derivation.
- `docs/canon/signal-library.md` — register the 5 new `*_stakes_priority` signals with one-line descriptions.
- `docs/canon/keystone-reflection-rules.md` — update the rule that describes BeliefUnderTension construction to reflect the new derivation source.
- `docs/canon/shape-framework.md` — extend the Compass card framing with a paragraph noting that Compass holds two registers: abstract sacred values (Q-S1/Q-S2) and concrete stakes (Q-Stakes1). Architectural truth: *"what the heart loves abstractly + what the heart fears losing concretely."*

### 8. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- Run the existing test suite (`npm test` if present); update fixtures only if a test fails for a reason directly tied to this CC's changes (Q-I3 source array, Q-Stakes1 presence). Don't broaden test scope.
- The second-pass trigger still fires when `nextIdx === Q_I1_INDEX`. Because `Q_I1_INDEX` is dynamically computed via `findIndex`, no constant edit is required — but verify by reading the surrounding code in `app/page.tsx` (around line 45 and 359) and confirming the boundary holds.

### 9. Browser smoke (out of scope but flag)

Engine checks won't catch register / coherence issues. Jason will smoke this manually after the CC ships:
- Q-I1 prompts cost-bearing language (not "controversial opinions").
- Q-Stakes1 renders as a normal ranking question on the Compass card surface.
- Q-I3 shows the user's top-3 stakes (from Q-Stakes1) as checkbox items, plus None and Other.
- Mirror / Map output for the Keystone block reads coherently with the new derivation.

If anything reads off in smoke, fix in a CC-024-fix; don't try to anticipate it here.

---

## Acceptance

- Q-I1 text reads *"What is a belief you'd bear real cost to keep?"*; Q-I1b updated to matching cost-bearing register.
- Q-Stakes1 exists between Q-E1-cross and Q-I1 in `data/questions.ts`, with the 5 canonical items and `card_id: "compass"`, `type: "ranking"`.
- Q-I3 has `derived_from: ["Q-Stakes1"]`, `derived_top_n_per_source: 3`, and the updated helper.
- 5 new `*_stakes_priority` signals registered in the SignalId union and the canon signal library.
- BeliefUnderTension's `cost_dimensions` derives from Q-Stakes1 + Q-I3.
- `summarizeQI3Selections` reads in terms of concrete costs, not sacred drivers.
- Canon docs updated: question-bank-v1.md, signal-library.md, keystone-reflection-rules.md, shape-framework.md.
- `git diff --stat` shows only the named files modified; no app/component edits, no `MapSection` / `QuestionShell` edits, no `app/page.tsx` edits.
- Build, type-check, and lint all pass.

---

## Out of scope

- **Compass output prose extension** — extending the Compass ShapeCard's report-time prose to mention stakes alongside sacred values is queue work for **CC-025 (engine prose tuning Round 2)**. CC-024 ends at the data layer + canon updates; the Compass card's report output continues to read as today until CC-025 lands.
- **Path 3C's Allocation** — that's CC-026, queued separately. Notes at `prompts/queued/path-3cs-allocation-notes.md`.
- **Compass card icon work** — CC-022e (Map) and CC-022f (QuestionShell) own card SVG rendering.
- **Renaming `cost_dimensions`** — even if the new content makes the existing field name slightly off-register, a rename is a separate concern. Leave the field name alone unless it produces a type or compile error.
- **Mirror / Keystone prose tuning beyond the helper-string fix in `summarizeQI3Selections`** — bigger prose work belongs to CC-025.
- **Inner Constitution artifact updates** — separate CC, tied to spec §10.
- **LLM substitution path** — irrelevant to CC-024; the engine path is what changes.

If you find yourself editing anything outside the eight named files, stop and flag.

---

## Notes for the executing engineer

- Read `prompts/queued/Q-I3-restructure-notes.md` before starting. The notes file is the architectural spec; this CC is the implementation lift. If the notes and this CC disagree on a detail, the notes win — flag the discrepancy back rather than silently choosing.
- The 5 stakes items are the canonical list. Don't add a 7th (Citizenship was considered and deferred to a v2 of this question — see notes §"Considered and deferred to v2"). Don't subtract.
- `Q_I1_INDEX` in `app/page.tsx` is dynamically computed via `questions.findIndex`. After Q-Stakes1 inserts, the index value shifts by one but the boundary check still works — that's the whole point of the dynamic lookup. No `app/page.tsx` edits should be required. If you find yourself editing it, double-check whether the change is actually necessary.
- The Q-I1b text proposed above (*"Ok, maybe not a heavy cost. How about a belief you'd defend even when it makes things harder?"*) is the engineer's chance to push back if it reads awkwardly. The architectural rule it satisfies: Q-I1b's softer fallback must stay in cost-bearing register; otherwise the whole Q-I1 reframe is undermined when users skip Q-I1. If the proposed text doesn't land, propose a better one in the same register.
- Browser smoke is required after this CC closes. Engine checks confirm the wiring compiles and the derivations type-check; the question-text register and Mirror coherence need Jason's eyes.
