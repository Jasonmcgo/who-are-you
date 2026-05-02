# CC-028 — Compass Values Expansion (Q-S1 / Q-S2 4 → 6 items)

**Type:** Question-bank surgery + signal-catalog additions. **No engine logic changes, no component edits, no new questions.**
**Goal:** Expand Q-S1 and Q-S2 from 4 items each to 6 items each. Adds four new sacred values — Peace, Honor, Compassion, Mercy — distributed two per question to match each question's existing register. Adds four new `*_priority` signals.
**Predecessors:** CC-024 (Keystone Block Restructure), CC-027 (Post-CC-024 Housekeeping). Both shipped 2026-04-27.
**Successor:** CC-025 (Engine Prose Tuning Round 2) waits on CC-028 because Round 2 prose tuning hits a quality ceiling without Compass differentiation upstream.

---

## Why this CC

Real-user testing has now confirmed across four sessions (Madison, Jason, Michele, LaCinda) that the existing 8-item sacred-value pool produces top-3-universal compression: every user's top three Compass values come from the same handful — typically Family / Freedom / Loyalty plus one discriminator (Faith or Knowledge). The compression is structural, not coincidental. With only 4 items in a single ranking, the gradient between top and bottom is too thin to differentiate users from one another at the Compass card.

Two downstream effects of the upstream pool size:

1. **Compass card output reads undifferentiated** across users — every report's Compass section names roughly the same four values in slightly different orders.
2. **T-014 (Sacred Words vs Spent Energy) fires for nearly every user** because Family is always in the top sacred pool (because the pool is too small to avoid Family), but real-life energy rarely flows primarily to family-care. T-014 is informative once and noise after that.

Expanding Q-S1 and Q-S2 to 6 items each — adding 4 new sacred values total — fixes both at once. Top-3 selection becomes a real choice across 12 items rather than a forced selection from 8.

The additions are sacred-value-class items (nouns of value), not contribution-verb-class items. Per `feedback_sacred_vs_contribution_register.md` in memory: contribution verbs (Teaching, Leading, Supporting) belong on Path/Gravity, not Compass — those are a separate future measurement, not this CC.

---

## Scope

This CC modifies a focused set of files:

1. `data/questions.ts` — Q-S1 expanded from 4 to 6 items; Q-S2 expanded from 4 to 6 items.
2. `lib/identityEngine.ts` — `SIGNAL_DESCRIPTIONS` gets 4 new `*_priority` entries; `SACRED_PRIORITY_SIGNAL_IDS` array extended to include the 4 new signal IDs (so they're recognized as sacred-priority signals in compass ranking computations).
3. `docs/canon/question-bank-v1.md` — Q-S1 and Q-S2 entries updated with the new items; CC-028 amendment paragraph documenting the expansion rationale.
4. `docs/canon/signal-library.md` — 4 new `*_priority` signal entries appended after `faith_priority` (or in the appropriate alphabetical position).
5. `docs/canon/shape-framework.md` — Compass card section updated if it enumerates the canonical sacred values; expansion noted in the Compass framing.

Nothing else. No engine logic changes, no component edits, no new questions, no changes to existing questions other than Q-S1 and Q-S2 items, no Mirror prose changes, no new cross-card patterns leveraging the new signals.

---

## The four new values — distribution and rationale

### Q-S1 — *"Order these by what you'd protect first when something has to give."*

The Q-S1 register is **embodied / qualities-of-self values** — things you protect because they are how you stand. Existing items: Freedom, Truth, Stability, Loyalty.

Add to Q-S1:

- **Peace** — *"interior groundedness — the calm that holds even when conditions don't."*
- **Honor** — *"keeping faith with your word, even when no one would notice the breach."*

Both compose cleanly with the protect register. Peace pairs naturally with Stability (both are interior states); Honor pairs naturally with Truth (both are quality-of-self commitments).

### Q-S2 — *"Order these by which has the strongest claim on you."*

The Q-S2 register is **external pulls / orientations toward others** — things that claim you because of what they are or who they are. Existing items: Family, Knowledge, Justice, Faith.

Add to Q-S2:

- **Compassion** — *"being moved by what hurts in others, and not turning away."*
- **Mercy** — *"softening the verdict, even when the verdict was fair."*

Both compose with the claim register. The suffering of others claims compassion; the imperfection of others claims mercy. Mercy pairs naturally with Justice (the justice/mercy axis); Compassion pairs naturally with Family (relational orientation).

### Why these four (not others)

Considered and rejected:

- **Service / Teaching / Leading / Supporting** — contribution verbs, not sacred values. Belong on Path/Gravity per the verb-noun composition rule (`feedback_sacred_vs_contribution_register.md`). The verb-noun check fails: you don't "protect Teaching first when something has to give"; you teach as a way of contributing.
- **Wisdom** — risks semantic overlap with Knowledge already in Q-S2.
- **Devotion** — risks semantic overlap with Faith already in Q-S2.
- **Integrity** — risks semantic overlap with Truth already in Q-S1.
- **Beauty** — sacred-class noun and defensible, but less common in Western moral vocabulary; deferred to a future expansion if Compass differentiation still feels thin after 12 items.

The four chosen — Peace, Honor, Compassion, Mercy — each carry distinct semantic territory not covered by existing items, and each composes cleanly with its question's verb register.

---

## Steps

### 1. Expand Q-S1 in `data/questions.ts` (around line 156)

```ts
{
  question_id: "Q-S1",
  card_id: "sacred",
  type: "ranking",
  text: "Order these by what you'd protect first when something has to give.",
  helper: "Six of your own. Rank by which holds first when two of them pull apart.",
  items: [
    { id: "freedom",   label: "Freedom",   gloss: "the ability to act without needing permission.",                         signal: "freedom_priority"   },
    { id: "truth",     label: "Truth",     gloss: "what's actually so, even when it costs.",                                 signal: "truth_priority"     },
    { id: "stability", label: "Stability", gloss: "steady ground, for you and the people who rely on you.",                  signal: "stability_priority" },
    { id: "loyalty",   label: "Loyalty",   gloss: "staying with your people through what comes.",                            signal: "loyalty_priority"   },
    { id: "peace",     label: "Peace",     gloss: "interior groundedness — the calm that holds even when conditions don't.", signal: "peace_priority"     },
    { id: "honor",     label: "Honor",     gloss: "keeping faith with your word, even when no one would notice the breach.", signal: "honor_priority"     },
  ],
},
```

Note the helper string update: *"Four of your own"* → *"Six of your own"*. Keep the rest of the helper sentence as-is.

### 2. Expand Q-S2 in `data/questions.ts` (around line 169)

```ts
{
  question_id: "Q-S2",
  card_id: "sacred",
  type: "ranking",
  text: "Order these by which has the strongest claim on you.",
  items: [
    { id: "family",      label: "Family",     gloss: "the people who are yours, and to whom you are theirs.",        signal: "family_priority"     },
    { id: "knowledge",   label: "Knowledge",  gloss: "what's actually known, and the discipline of seeking more.",   signal: "knowledge_priority"  },
    { id: "justice",     label: "Justice",    gloss: "fair weight, even when it costs you to give it.",              signal: "justice_priority"    },
    { id: "faith",       label: "Faith",      gloss: "trust in what's larger than you, however you frame it.",       signal: "faith_priority"      },
    { id: "compassion",  label: "Compassion", gloss: "being moved by what hurts in others, and not turning away.",   signal: "compassion_priority" },
    { id: "mercy",       label: "Mercy",      gloss: "softening the verdict, even when the verdict was fair.",       signal: "mercy_priority"      },
  ],
},
```

Q-S2 has no helper today; leaving that alone is fine. The 6-item count is small enough that the question reads cleanly without one.

### 3. Add signal descriptions in `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS`

Append after `faith_priority` (around line 132–133), keeping the same style/voice as existing entries:

```ts
peace_priority:
  "Holds peace — interior groundedness, the calm that holds even when conditions don't — as a sacred value.",
honor_priority:
  "Holds honor — keeping faith with your word and your standing, even when the breach would go unnoticed — as a sacred value.",
compassion_priority:
  "Holds compassion — being moved by what hurts in others — as a sacred value.",
mercy_priority:
  "Holds mercy — softening what justice would let you claim — as a sacred value.",
```

### 4. Extend `SACRED_PRIORITY_SIGNAL_IDS` in `lib/identityEngine.ts` (around line 214)

```ts
const SACRED_PRIORITY_SIGNAL_IDS: SignalId[] = [
  "freedom_priority",
  "truth_priority",
  "stability_priority",
  "loyalty_priority",
  "family_priority",
  "knowledge_priority",
  "justice_priority",
  "faith_priority",
  "peace_priority",       // CC-028
  "honor_priority",       // CC-028
  "compassion_priority",  // CC-028
  "mercy_priority",       // CC-028
];
```

This makes the new signals participate in `compassRanksTop()` computations and any other code path that filters on sacred-priority signals.

### 5. Update `docs/canon/question-bank-v1.md`

Find the Q-S1 entry. Update the items list to include the 6 items (existing 4 + Peace + Honor). Find the Q-S2 entry. Update the items list to include the 6 items (existing 4 + Compassion + Mercy). Add a CC-028 amendment paragraph at the top of the Q-S1 / Q-S2 section (or inside each entry) explaining the expansion rationale — four-user-confirmed top-3 compression problem; 12-item pool restores meaningful gradient.

### 6. Update `docs/canon/signal-library.md`

Add 4 new signal entries following the existing template (signal_id, description, primary_cards: [sacred], produced_by_questions: [Q-S1] for Peace/Honor or [Q-S2] for Compassion/Mercy, rank-aware, marked active). Position alphabetically or after `faith_priority`, whichever matches the file's existing convention.

### 7. Update `docs/canon/shape-framework.md`

If the Compass card section enumerates the canonical sacred values list, update to include the four new items. If the file describes the size of each ranking, update from 4-item to 6-item. CC-028 amendment paragraph documenting the expansion's purpose (resolve top-3 universal compression).

### 8. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- Run the existing test suite if present. Update fixtures only if a test fails for a reason directly tied to this CC (e.g., a test that hardcodes Q-S1 having 4 items will need updating to 6 items). Don't broaden test scope.

### 9. Browser smoke (Jason's verification, not engine-verifiable)

After the CC ships, run a fresh session through Q-S1 and Q-S2:

- Both questions render 6 items, draggable, all glosses visible.
- The Compass card output names the user's top-ranked items (which now have a real chance of NOT being Family/Freedom/Faith/Loyalty for some users).
- Cross-card patterns that read sacred signals (`family_vs_money_allocation`, `justice_vs_system`, `freedom_vs_order`, `knowledge_vs_education_trust`, etc.) continue to fire correctly when their conditions are met. The new signals don't break existing patterns.

---

## Acceptance

- Q-S1 in `data/questions.ts` has 6 items (Freedom / Truth / Stability / Loyalty / Peace / Honor) with correct glosses and signal IDs.
- Q-S2 in `data/questions.ts` has 6 items (Family / Knowledge / Justice / Faith / Compassion / Mercy) with correct glosses and signal IDs.
- `SIGNAL_DESCRIPTIONS` in `lib/identityEngine.ts` contains the 4 new `*_priority` entries.
- `SACRED_PRIORITY_SIGNAL_IDS` array includes the 4 new signal IDs.
- `docs/canon/question-bank-v1.md`, `docs/canon/signal-library.md`, and `docs/canon/shape-framework.md` are updated.
- `git diff --stat` shows changes only in the named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- A fresh user-flow smoke confirms both questions render with 6 items and ranking commits cleanly.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Adding contribution verbs** (Teaching, Leading, Supporting, Influencing, Encouraging) to Compass. Verb-noun composition rule rules these out for sacred. Future Path question.
- **A third sacred-value ranking question** (Q-S2b or similar). Violates `feedback_minimal_questions_maximum_output.md`.
- **Expanding to 8 items per question** instead of 6. UX cost rises sharply at 8+ items in a drag-rank; 6 is the deliberate ceiling.
- **Authoring new cross-card patterns** that leverage the new signals (Mercy + Justice pair, etc.). That's CC-029 territory (pattern catalog expansion). Adding signals here makes that future work possible; the patterns themselves are a separate CC.
- **Updating Mirror prose** to specifically mention the new sacred values. CC-025 (Engine Prose Tuning Round 2) is the prose-side CC; CC-028 ends at the data + signal layer.
- **Updating allocation-question canon docs** (Q-S3-close, Q-S3-wider, Q-S3-cross, Q-E1-* family). Those questions are unchanged. They sit on the Compass card alongside the expanded sacred rankings but their structure isn't touched.
- **Renaming or removing any existing sacred value.** Freedom, Truth, Stability, Loyalty, Family, Knowledge, Justice, Faith all stay.
- **Engine logic changes** beyond the two trivial additions to `SIGNAL_DESCRIPTIONS` and `SACRED_PRIORITY_SIGNAL_IDS`. No new functions, no changes to ranking-derivation logic, no changes to compass-ranking computations, no changes to `summarizeQI3Selections` or `summarizeQI2Selections`.
- **Component edits.** `MapSection.tsx`, `QuestionShell.tsx`, `ShapeCard.tsx`, `app/page.tsx`, and the Ranking primitive should all be untouched. The 6-item rendering is handled by the existing Ranking component without modification.

---

## Notes for the executing engineer

- The 4 new values are locked: **Peace** and **Honor** on Q-S1; **Compassion** and **Mercy** on Q-S2. Don't substitute. The selection rationale (verb-noun composition + semantic non-overlap) is documented above.
- The glosses are also locked. They're written to match the voice of the existing eight glosses. If a gloss reads awkwardly during browser smoke, surface it as a follow-up; don't silently rewrite during this CC.
- Helper string update on Q-S1 ("Four of your own" → "Six of your own") is small but easy to miss. Don't skip.
- Existing cross-card patterns (`family_vs_money_allocation`, `justice_vs_system`, `freedom_vs_order`, etc.) reference specific sacred-priority signals by name. Adding 4 new signals does not break any existing pattern's condition. The new signals can be referenced in future patterns (CC-029), not this CC.
- The 4 new signals must be added to `SACRED_PRIORITY_SIGNAL_IDS`. Without that, the new signals fire from the ranking but aren't recognized as sacred-priority signals in compass ranking computations — the Compass output prose would silently treat them as missing.
- Browser smoke required after this CC closes — engine checks confirm the wiring compiles and the data renders, but the Compass differentiation gain (does a user's top-3 actually look different now?) needs Jason's eyes across multiple sessions.
- Saved-session compatibility: pre-CC-028 saved sessions store rankings of 4 items each. Loading those sessions post-CC-028 will render rankings as 4 items because the saved data only has 4 items recorded. The Compass output will function as before for those sessions. New sessions get the 6-item experience. No migration needed.
