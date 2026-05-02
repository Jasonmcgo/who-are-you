# CC-035 — Belief Stress-Test Option Depth Expansion

**Type:** Question-bank expansion + signal addition + derivation-depth tuning. **No engine logic changes beyond a single signal-tag addition. No prose changes.**
**Goal:** Expand the belief stress-test surface (Q-I2 + Q-I3) from 3–4 options to 6 options each, so users have meaningful weight/conviction granularity when naming what could change their belief and what they'd risk losing for it. Adds a sixth concrete-loss item to Q-Stakes1 ("Time / autonomy") with a new `time_autonomy_stakes_priority` signal to enable Q-I3's expansion.
**Predecessors:** CC-024 (Keystone Block Restructure), CC-032 (v2.5 Q-X4/Q-I2 cascade). Both shipped pre-2026-04-29.
**Successor:** None hard-blocked.

---

## Why this CC

Real-user testing 2026-04-29 surfaces that the belief stress-test block undermeasures conviction depth:

- **Q-I2** (*"What or who could change your mind about this belief?"*) currently shows **4 options** — top 2 from Q-X3-cross + top 2 from Q-X4-cross via `derived_top_n_per_source: 2`. Trust sources beyond the top-2 of each cross-rank never enter Q-I2's option set, so users with broad trust portfolios lose the chance to register secondary trust pulls.
- **Q-I3** (*"What would you risk losing for this belief?"*) currently shows **3 options** — top 3 from Q-Stakes1 via `derived_top_n_per_source: 3`. Q-Stakes1 has 5 items today, so Q-I3 misses the bottom-2 entirely.

The fix is straightforward but bumps into a structural ceiling on Q-I3: even at `derived_top_n_per_source: 6`, Q-Stakes1's 5-item pool caps the option count at 5. To deliver a real 6 options on Q-I3, Q-Stakes1 needs a sixth item.

The chosen sixth item is **Time / autonomy** — a concrete loss domain that's distinct from the existing five (money, job, relationships, reputation, health), pairs cleanly with the cost-bearing register CC-024 established for Q-Stakes1, and compose with Q-I3's "would risk losing" verb. Time as autonomy is loseable, ranking-discoverable, and carries weight across temperaments without overlapping money (which buys time) or job (which constrains time but isn't time itself).

Q-Stakes1 expansion from 5 to 6 items also slightly improves the Compass-card concrete-stakes register, which CC-024 introduced as the second leg of the Compass measurement (abstract sacred values + concrete loss domains). A sixth item adds a discriminator without disturbing the existing five.

---

## Scope

Files modified:

1. `data/questions.ts` — Q-I2's `derived_top_n_per_source` 2→3; Q-Stakes1 gains a 6th item ("Time / autonomy"); Q-I3's `derived_top_n_per_source` 3→6.
2. `lib/identityEngine.ts` — `SIGNAL_DESCRIPTIONS` gets a new entry for `time_autonomy_stakes_priority`.
3. `lib/drive.ts` — `SIGNAL_DRIVE_TAGS` gets a new entry for `time_autonomy_stakes_priority` tagged `"compliance"` (rationale below).
4. `docs/canon/question-bank-v1.md` — Q-Stakes1 entry updated with 6th item; Q-I2 and Q-I3 entries updated with new derivation depth.
5. `docs/canon/signal-library.md` — new `time_autonomy_stakes_priority` entry.
6. `docs/canon/drive-framework.md` — input-signals table picks up the new signal with `compliance` tag.

Nothing else. No engine logic changes beyond the single tagging-table addition. No prose changes. No changes to the belief-tension heuristic in `lib/beliefHeuristics.ts` (it already handles variable option counts via the `Math.min(topN, parentAnswer.order.length)` clause).

---

## The decisions, locked

### Q-Stakes1 sixth item

- **id:** `time`
- **label:** "Time / autonomy"
- **gloss:** "How you spend your hours, control over your own life — not just having time, but being able to direct it."
- **signal:** `time_autonomy_stakes_priority`

Position: insert as the sixth (last) item in Q-Stakes1's items array, after `health`. Existing five items stay in their current order.

### `time_autonomy_stakes_priority` Drive tagging

Tagged `"compliance"` in `SIGNAL_DRIVE_TAGS`. Rationale: the loss-of-time / loss-of-autonomy register is risk-mitigation-class — protecting against the erosion of self-direction. Adjacent to `reputation_stakes_priority` (compliance) and `health_stakes_priority` (compliance), both of which capture domain-specific loss-aversion. NOT cost (cost is allocation/wealth-creation; time-as-resource is a different lens) and NOT multi-tagged (would require adjudication that adds complexity without payoff).

If browser smoke later reveals time-as-autonomy needs cost dimension, that's a successor CC, not this one.

### Derivation-depth changes

- **Q-I2:** `derived_top_n_per_source: 2 → 3`. Yields 6 options (3 from Q-X3-cross + 3 from Q-X4-cross). Both cross-ranks comfortably hold ≥3 items each (Q-X3-cross has 6+ items per CC-031; Q-X4-cross has 5 per CC-032).
- **Q-I3:** `derived_top_n_per_source: 3 → 6`. Yields 6 options after Q-Stakes1's expansion to 6 items. The `Math.min` clause in `summarizeMultiSelect` (`lib/beliefHeuristics.ts:366`) handles the cap gracefully — pre-Q-Stakes1-expansion saved sessions still cap at 5; post-expansion sessions hit 6.

### Helper text refresh

Q-I3's helper currently reads: *"Check all that apply. The model reads which concrete costs you'd bear for this belief."* No edit needed — applies equally well to 6 options.

Q-I2's helper currently reads: *"Check all that apply. The model reads which trust sources have power over this belief."* No edit needed.

---

## Steps

### 1. Q-Stakes1 — add 6th item in `data/questions.ts` (around line 434–446)

```ts
{
  question_id: "Q-Stakes1",
  card_id: "sacred",
  type: "ranking",
  text: "Rank these by importance to your life — what would hurt most to lose.",
  helper: "Drag to reorder. Top is most important; bottom is least.",
  items: [
    { id: "money",               label: "Money / Financial security", gloss: "Your money, savings, financial stability.",                                                       signal: "money_stakes_priority"               },
    { id: "job",                 label: "Job / Career",                gloss: "Your professional standing, your work.",                                                         signal: "job_stakes_priority"                 },
    { id: "close_relationships", label: "Close relationships",         gloss: "Partner, family, closest friends.",                                                              signal: "close_relationships_stakes_priority" },
    { id: "reputation",          label: "Reputation",                  gloss: "How others see you, your standing in your community.",                                           signal: "reputation_stakes_priority"          },
    { id: "health",              label: "Physical safety / Health",    gloss: "Your body, your safety.",                                                                        signal: "health_stakes_priority"              },
    { id: "time",                label: "Time / autonomy",             gloss: "How you spend your hours, control over your own life — not just having time, but being able to direct it.", signal: "time_autonomy_stakes_priority" },
  ],
},
```

### 2. Q-I2 — bump derivation depth (around line 510–529)

Change `derived_top_n_per_source: 2` to `derived_top_n_per_source: 3`. Leave everything else (text, helper, derived_from, none_option, other_option) verbatim.

### 3. Q-I3 — bump derivation depth (around line 537–546)

Change `derived_top_n_per_source: 3` to `derived_top_n_per_source: 6`. Leave everything else verbatim.

### 4. `lib/identityEngine.ts` — add `time_autonomy_stakes_priority` to `SIGNAL_DESCRIPTIONS`

Append after `health_stakes_priority` in the existing stakes-priority block:

```ts
time_autonomy_stakes_priority:
  "Treats time and autonomy — the ability to direct your own hours and life — as a concrete loss domain.",
```

### 5. `lib/drive.ts` — tag the new signal

In the `SIGNAL_DRIVE_TAGS` map, append after `health_stakes_priority` in the Q-Stakes1 block:

```ts
time_autonomy_stakes_priority: "compliance",
```

CC-035 amendment line at the top of the file noting the new tagging.

### 6. `docs/canon/question-bank-v1.md`

Update Q-Stakes1 entry to enumerate 6 items including Time / autonomy. Update Q-I2 entry to note `derived_top_n_per_source: 3` (yields 6 options). Update Q-I3 entry to note `derived_top_n_per_source: 6` (yields up-to-6 options bounded by Q-Stakes1). CC-035 amendment paragraph documenting the depth-expansion rationale.

### 7. `docs/canon/signal-library.md`

Append a `time_autonomy_stakes_priority` entry following the existing template (signal_id, description, primary_cards: [sacred], produced_by_questions: [Q-Stakes1], rank-aware: true, marked active). Position alphabetically or after `reputation_stakes_priority`, matching the file's existing convention.

### 8. `docs/canon/drive-framework.md`

In the input-signals table for the compliance bucket, add `time_autonomy_stakes_priority` (tag: compliance, source: Q-Stakes1, rank-aware). CC-035 amendment line documenting the addition.

### 9. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- Existing test suite passes. If a test hardcodes Q-Stakes1 having 5 items or Q-I3 yielding 3 options, update only that test.
- Manual: load a fresh session, advance to Q-Stakes1 → confirm 6 items render and rank cleanly. Advance to Q-I2 → confirm 6 derived options render. Advance to Q-I3 → confirm 6 derived options render after the user has ranked Q-Stakes1.

### 10. Browser smoke (Jason verifies after CC closes)

- Q-Stakes1 renders with 6 draggable items, including "Time / autonomy".
- Q-I2 renders with 6 derived options + None + Other (so 8 total checkboxes).
- Q-I3 renders with 6 derived options + None + Other (so 8 total checkboxes), drawing from the user's top-6 Q-Stakes1 ranking.
- Drive distribution on Path · Gait correctly absorbs `time_autonomy_stakes_priority` into the compliance bucket when the user ranks Time highly in Q-Stakes1.

---

## Acceptance

- `data/questions.ts` Q-Stakes1 has 6 items with the Time / autonomy item exactly as specified above. Q-I2 has `derived_top_n_per_source: 3`. Q-I3 has `derived_top_n_per_source: 6`.
- `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` contains `time_autonomy_stakes_priority`.
- `lib/drive.ts` `SIGNAL_DRIVE_TAGS` contains `time_autonomy_stakes_priority: "compliance"`.
- Canon docs updated as listed above.
- `git diff --stat` shows changes only in the named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- A fresh user-flow smoke confirms the three downstream effects above.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Adding additional Q-Stakes1 items** beyond the sixth (Time / autonomy). The 6-item ceiling is deliberate.
- **Multi-tagging `time_autonomy_stakes_priority`.** Single-tagged compliance.
- **Adding a second source for Q-I3** (e.g., Q-Stakes1 + Q-S1). Q-I3's CC-024 architecture is single-source from concrete-loss domains. Adding a sacred-values source would re-introduce the verb-mismatch CC-024 fixed.
- **Changing `derivedOptions` / `summarizeMultiSelect` logic in `lib/beliefHeuristics.ts`.** The existing `Math.min(topN, parentAnswer.order.length)` handles bounded derivation cleanly.
- **Editing helper text or question text** for Q-I2 / Q-I3 / Q-Stakes1.
- **Adding Q-Stakes1 cross-card patterns** that leverage `time_autonomy_stakes_priority`. Pattern-catalog work is CC-029 territory; CC-035 makes future patterns possible without authoring them.
- **Updating Mirror prose, Tension prose, or ShapeCard prose** to specifically name Time / autonomy. Engine-prose Round 3 is a separate CC.
- **Bumping any other question's `derived_top_n_per_source`.** Only Q-I2 and Q-I3 change in this CC.
- **Component edits** (`MapSection.tsx`, `QuestionShell.tsx`, the Ranking primitive, the Multiselect primitive). Both questions render via existing components without modification.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Don't pause. Canon-faithful interpretation on ambiguity. Don't edit files outside the Allowed-to-Modify list.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (smoke only)
- `git diff --stat`
- `git status`

## Read First (Required)

- `AGENTS.md`
- `data/questions.ts` lines 423–546 (Q-Stakes1, Q-3C1, Q-I1, Q-I2, Q-I3 surrounding context).
- `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` location and stakes-priority block.
- `lib/drive.ts` lines 57–138 (`SIGNAL_DRIVE_TAGS`); lines 354–358 (`HUMAN_LABELS`).
- `lib/beliefHeuristics.ts` lines 350–382 (`summarizeMultiSelect` — derivation logic; do not edit).
- `prompts/completed/CC-024-keystone-block-restructure.md` — context on Q-Stakes1's CC-024 origin.
- `prompts/completed/CC-032-v25-qx4-qi2-cascade.md` — context on Q-I2's v2.5 cross-rank derivation.

## Allowed to Modify

- `data/questions.ts`
- `lib/identityEngine.ts`
- `lib/drive.ts`
- `docs/canon/question-bank-v1.md`
- `docs/canon/signal-library.md`
- `docs/canon/drive-framework.md`

## Report Back

1. **Files modified** with line counts.
2. **Verification results** — tsc, lint, build outputs.
3. **Out-of-scope drift caught**.
4. **Browser smoke deferred to Jason**.
5. **Successor recommendations** — note whether CC-029 (pattern catalog) should consider `time_autonomy_stakes_priority` as a pattern signal candidate.

---

## Notes for the executing engineer

- The Time / autonomy item label, gloss, and signal id are locked. Don't substitute. The gloss explicitly distinguishes "having time" from "directing time" — that's the conviction-relevant register.
- The compliance tag for `time_autonomy_stakes_priority` is canon. Multi-tagging or moving to cost would require canon revision.
- Q-I3's `derived_top_n_per_source: 6` is safe even if Q-Stakes1 ever shrinks back to 5 items — the `Math.min` clause caps at parent length. Choose 6 over 5 because Q-Stakes1 is now 6 and forward compatibility favors the higher number.
- Q-I2's bump from 2 to 3 yields 6 options, not 4. Verify Q-X3-cross and Q-X4-cross both have ≥3 items (they do — Q-X3-cross has 6 institutional-trust items per CC-031, Q-X4-cross has 5 personal-trust items per CC-032). If either parent has fewer than 3 ranked items in a saved session, the option count gracefully degrades via the `Math.min` clause.
- Pre-CC-035 saved sessions don't have a Q-Stakes1 ranking with `time` — those sessions still render Q-I3 with up-to-5 options (the existing 5 stakes items). New sessions get the full 6. No migration needed.
- If a test fixture hardcodes the literal item count for Q-Stakes1, Q-I2, or Q-I3, update only the count expectation. Don't broaden the test's assertions.
