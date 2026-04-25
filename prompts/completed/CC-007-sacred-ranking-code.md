# CC-007 — Sacred Ranking Code (Testable UI)

## Goal

Land the **first piece of working code under the rank-aware design.** After CC-007, the running app at `localhost:3003` shows ranked Q-S1 (Freedom / Truth / Stability / Loyalty) and ranked Q-S2 (Family / Knowledge / Justice / Faith) in the browser, with drag-to-reorder interaction, and the engine derives rank-aware sacred signals that feed T-012 Sacred Value Conflict detection.

This CC translates the locked canon (CC-006) and the design lab spec (`docs/design-spec-v1.md`) into running code. It is the testable-UI move — the user wants to feel the ranking experience in the browser today.

Scope is intentionally narrow:

- A `ranking` question type added to the code's type system.
- A pointer-events drag-to-reorder React component (the ranking primitive).
- Engine derivation that emits rank-aware signals from ranking answers.
- `data/questions.ts` migrated: existing forced-choice Q-S1 replaced with ranked Q-S1; new Q-S2 added.
- Q-S1 and Q-S2 render correctly in the existing question flow.

**Out of scope** for this CC: the full design-system tokens (warm paper, umber accent, serif typography), the redesigned QuestionShell with autosave chip, the tension card with `tell me more` provenance, the Inner Constitution layout, Q-X3 institutional ranking, Q-X4 personal trust ranking, Q-C4 attribution ranking, Temperament Q-T1–Q-T8. Each lands in a later CC.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.** The Execution Directive below tells the executing agent not to pause for confirmation; the launch flag prevents the CC tool itself from prompting the user to approve every file edit AND every bash command.

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode. The project also has `.claude/settings.local.json` with `defaultMode: "bypassPermissions"`, so launches in this project should be quiet by default.

The work here touches multiple files and runs multiple bash commands. Per-edit or per-bash approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves and reports back).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff` for verification.
- Standard `npm install` if a drag-utility dependency is added (see Risks).

The agent should not pause to ask permission for these. They are pre-authorized by this CC and the project's permission settings.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input. This prompt is self-contained.

If something is genuinely ambiguous, apply the most canon-faithful interpretation and flag the decision in the Risks / next-step recommendations section of the report-back — do not halt to ask.

If a prerequisite appears missing (a referenced file is absent, a check fails, a canon block has drifted since this prompt was written), attempt the canon-faithful equivalent, record the discrepancy in the report, and continue. Do not stop short.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

Canon (read in full first; do not edit):

- docs/canon/shape-framework.md
- docs/canon/card-schema.md (post-CC-005; documents the `ranking` question type)
- docs/canon/question-bank-v1.md (post-CC-006; contains the locked Q-S1 and Q-S2 definitions)
- docs/canon/signal-library.md (post-CC-006; eight rank-aware sacred signals registered)
- docs/canon/signal-mapping-rule.md (rank-to-strength mapping)
- docs/canon/signal-and-tension-model.md (rank-aware signal convention)
- docs/canon/tension-library-v1.md (T-012 Sacred Value Conflict, rank-aware)
- docs/design-spec-v1.md (§ 3 the ranking primitive, § 7 data shapes)

Existing code (read; will be edited):

- lib/types.ts
- lib/identityEngine.ts
- data/questions.ts
- app/page.tsx

Reference (do not edit):

- docs/canon/inner-constitution.md
- docs/canon/output-engine-rules.md
- docs/option-glosses-v1.md (the Q-S1 and Q-S2 glosses are byte-for-byte copies of what's already in question-bank-v1.md; use question-bank-v1.md as the source)

---

## Context

Canon says ranked Q-S1 and Q-S2 exist (CC-006 landed yesterday). The running app at `data/questions.ts` still has the old forced-choice Q-S1. CC-007 closes that gap.

The design spec (`docs/design-spec-v1.md` § 3) specifies the ranking primitive in detail: pointer-events drag (not HTML5 drag-and-drop), 6px move threshold, 44pt touch grip target, the index column carries rank (large mono numerals), keyboard support via Tab + Space + arrows. CC-007 implements that spec.

The engine currently derives signals from forced-choice answers via `signalFromAnswer` in `lib/identityEngine.ts`. CC-007 adds a parallel path for ranking answers — `signalsFromRankingAnswer` — that emits one signal per item in the ranked order, with rank metadata and strength derived per `signal-mapping-rule.md` § Ranking Question Signal Emission (position 1 → high, position 2 → medium, positions 3+ → low).

T-012 Sacred Value Conflict already has its rewritten detection rule in canon (CC-006). CC-007 implements the rule in `detectTensions`: T-012 fires when at least two distinct rank-aware sacred `*_priority` signals are present at rank ≤ 2.

---

## Requirements

### 1. Add `ranking` to the question and answer types in `lib/types.ts`

Add the `ranking` variant to the `Question` union and define `RankingItem`, plus the matching `Answer` variant. Preserve existing types (`forced`, `freeform`) verbatim.

Target shape additions:

```ts
export type RankingItemId = string;

export type RankingItem = {
  id: RankingItemId;
  label: string;
  gloss?: string;
  voice?: string;     // Temperament-only; not used in CC-007
  quote?: string;     // Temperament-only; not used in CC-007
  signal: SignalId;
};

export type RankingQuestion = {
  question_id: string;
  card_id: CardId;
  type: "ranking";
  text: string;
  helper?: string;
  items: RankingItem[];
};

// Add `ranking` to the existing Answer union:
export type RankingAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "ranking";
  order: RankingItemId[]; // position 0 = ranked first
};
```

The existing `Question` type union must include `RankingQuestion`. The existing `Answer` type union must include `RankingAnswer`. The existing `Signal` type must accept an optional `rank?: number` field (per `signal-and-tension-model.md` § Rank-Aware Signals — already canonical, may not yet be in code).

Do not modify existing `Question`, `Answer`, or `Signal` field types. Add only what's needed.

### 2. Build the ranking primitive component

Create `app/components/Ranking.tsx`. Implementation requirements per `docs/design-spec-v1.md` § 3:

- **Pointer events**, not HTML5 drag-and-drop. Works identically on mouse and touch.
- 6px move threshold before drag initiates (prevents accidental drag from a misread tap).
- During drag: held row gets soft elevation (`box-shadow` + 1px umber outline); other rows reflow live. Drop position is wherever the held row's vertical center sits when released.
- Release: 150ms ease-out snap. Index numerals update **on release**, not during drag.
- **Index column carries rank.** Three columns: left = mono index (1, 2, 3, ...), center = serif row content (label + em-dash + gloss), right = grip handle (≡ icon).
- 44pt touch hit area on grip.
- `touch-action: manipulation` on row, `touch-action: none` on grip during drag.
- `-webkit-tap-highlight-color: transparent`.
- **Keyboard support:** Tab focuses grip, Space picks up, arrow up/down moves, Space drops, Escape cancels and restores. Visible focus ring on grip only (2px umber outline).
- **Pre-populated order.** Component receives `items: RankingItem[]` in canon order; user's first move is what starts movement. No initial-paint animation.
- **Continue logic.** Component exposes an `onChange(order: string[])` callback whenever the user reorders. Parent component decides when to enable Continue. Per the spec, Continue is enabled the moment the user makes any move OR after a 4-second idle timer surfaces a small "this order is right" pill that, when tapped, enables Continue. The pill is a v1 nice-to-have; if implementation is tight, ship without it and Continue is enabled after any drag (the parent still tracks the answer separately).
- **Screen reader support.** Each row announces "Item N of M: [label]. Press space to reorder" on focus. Position changes announce verbally on each arrow press.

The component does not need full design-system styling (warm paper, umber accent, Source Serif typography) — that's CC-D in the design spec slicing and ships in a later CC. CC-007 ships **functional ranking with reasonable default styling.** The styling polish lands when the design tokens drop.

### 3. Wire ranking questions into `app/page.tsx`

The existing `app/page.tsx` renders forced-choice and freeform questions. Add a branch for `type: "ranking"` that mounts the `Ranking` component, passes the items, captures the user's order via `onChange`, and stores the result as a `RankingAnswer` in the existing answers state.

Preserve existing forced-choice and freeform rendering. Do not refactor the page beyond what's needed to add the ranking branch.

### 4. Engine: derive rank-aware signals from ranking answers

Edit `lib/identityEngine.ts`. Add a new function `signalsFromRankingAnswer(answer: RankingAnswer): Signal[]` that:

- Looks up the corresponding `RankingQuestion` from `questions` by `question_id`.
- For each item in the user's `order` array, emits one Signal with:
  - `signal_id` = the item's `signal` field
  - `description` = lookup in `SIGNAL_DESCRIPTIONS` (add new entries as needed; see §6)
  - `from_card` = question's `card_id`
  - `source_question_ids` = `[question_id]`
  - `rank` = position + 1 (1-indexed; position 0 in `order` → rank 1)
  - `strength` = `"high"` if rank ≤ 1, `"medium"` if rank ≤ 2, `"low"` otherwise

Update `deriveSignals(answers: Answer[])` to dispatch ranking answers to `signalsFromRankingAnswer` and forced/freeform answers to their existing handlers.

### 5. Update T-012 detection in `detectTensions`

The existing T-012 detection block (currently empty or referencing the old four-required-signals rule) must be updated to the rank-aware rule per `tension-library-v1.md` post-CC-006:

T-012 fires when at least two distinct sacred `*_priority` signals are present at rank ≤ 2. The eight sacred signals: `freedom_priority`, `truth_priority`, `stability_priority`, `loyalty_priority`, `family_priority`, `knowledge_priority`, `justice_priority`, `faith_priority`.

Pseudocode:

```ts
const sacredSignals = signals.filter(s =>
  ["freedom_priority","truth_priority","stability_priority","loyalty_priority",
   "family_priority","knowledge_priority","justice_priority","faith_priority"]
   .includes(s.signal_id)
  && (s.rank !== undefined && s.rank <= 2)
);
if (new Set(sacredSignals.map(s => s.signal_id)).size >= 2) {
  tensions.push({
    tension_id: "T-012",
    type: "Sacred Value Conflict",
    description: "The user may hold multiple sacred values that cannot always be protected at the same time.",
    user_prompt: "This pattern may be present: some of your deepest values may come into conflict when life forces a tradeoff. Does this feel accurate?",
    signals_involved: sacredSignals.slice(0, 4).map(s => ({
      signal_id: s.signal_id,
      from_card: s.from_card,
    })),
    confidence: "medium",
    status: "unconfirmed",
    strengthened_by: [],
  });
}
```

Description and user_prompt strings byte-for-byte match `tension-library-v1.md` T-012.

### 6. Migrate `data/questions.ts`

Replace the existing forced-choice Q-S1 entry with the ranked version. Add Q-S2 immediately after.

Target Q-S1:

```ts
{
  question_id: "Q-S1",
  card_id: "sacred",
  type: "ranking",
  text: "Order these by what you'd protect first when something has to give.",
  helper: "Four of your own. Rank by which holds first when two of them pull apart.",
  items: [
    { id: "freedom",   label: "Freedom",   gloss: "the ability to act without needing permission.",        signal: "freedom_priority"   },
    { id: "truth",     label: "Truth",     gloss: "what's actually so, even when it costs.",                signal: "truth_priority"     },
    { id: "stability", label: "Stability", gloss: "steady ground, for you and the people who rely on you.", signal: "stability_priority" },
    { id: "loyalty",   label: "Loyalty",   gloss: "staying with your people through what comes.",           signal: "loyalty_priority"   },
  ],
},
```

Target Q-S2:

```ts
{
  question_id: "Q-S2",
  card_id: "sacred",
  type: "ranking",
  text: "Order these by which has the strongest claim on you.",
  items: [
    { id: "family",    label: "Family",    gloss: "the people who are yours, and to whom you are theirs.",      signal: "family_priority"    },
    { id: "knowledge", label: "Knowledge", gloss: "what's actually known, and the discipline of seeking more.", signal: "knowledge_priority" },
    { id: "justice",   label: "Justice",   gloss: "fair weight, even when it costs you to give it.",            signal: "justice_priority"   },
    { id: "faith",     label: "Faith",     gloss: "trust in what's larger than you, however you frame it.",     signal: "faith_priority"     },
  ],
},
```

Glosses byte-for-byte from `question-bank-v1.md` post-CC-006 and `docs/option-glosses-v1.md`.

Family is no longer in Q-S1 (removed per CC-006). Loyalty is in Q-S1. The previous forced-choice Q-S1 entry is removed entirely.

### 7. Add SIGNAL_DESCRIPTIONS entries for the new signals

In `lib/identityEngine.ts`, add description entries for the three new sacred signals introduced in CC-006:

```ts
knowledge_priority: "Holds knowledge — what's actually known and the discipline of seeking more — as a sacred value.",
justice_priority:   "Holds justice — fair weight, even when it costs to give it — as a sacred value.",
faith_priority:     "Holds faith — trust in what's larger than you, however framed — as a sacred value.",
```

Existing sacred signal descriptions (`freedom_priority`, `truth_priority`, `stability_priority`, `loyalty_priority`, `family_priority`) stay as written.

### 8. Verify in browser

After all edits, run `npm run dev` and confirm in a real browser at `localhost:3003`:

- Q-S1 renders with four ranked items (Freedom, Truth, Stability, Loyalty), the prompt text, the helper line.
- Drag-to-reorder works on mouse. Index numerals update on release.
- Q-S2 renders after Q-S1 with four ranked items (Family, Knowledge, Justice, Faith).
- Continue button advances after at least one move.
- After completing both rankings plus the existing forced and freeform questions, the result page surfaces T-012 Sacred Value Conflict (since both Q-S1 and Q-S2 always emit two signals at rank ≤ 2).

Touch testing on a mobile viewport (390pt wide) is a nice-to-have but not blocking for v1.

### 9. Type check and lint

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.

---

## Allowed to Modify

- `lib/types.ts` (add ranking types, optional `rank` on Signal)
- `lib/identityEngine.ts` (add rank-aware signal derivation, add new signal descriptions, update T-012 detection)
- `data/questions.ts` (replace Q-S1, add Q-S2; do not modify other questions)
- `app/page.tsx` (add ranking branch; preserve existing forced and freeform branches)
- `app/components/Ranking.tsx` (new file)
- `app/components/Ranking.module.css` or equivalent styling file (new, optional — inline styles also acceptable for v1)

Do **not** modify:

- Any file under `docs/canon/` — canon stays exactly as written; this CC only translates canon to code.
- Any other file under `app/` (no QuestionShell rebuild, no Inner Constitution redesign, no tension card redesign — those are later CCs).
- `docs/option-glosses-v1.md`, `docs/design-spec-v1.md`, `docs/temperament-voice-draft-v1.md`, `docs/design-prototype/` — reference only.
- Any file under `prompts/`.
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json` (unless package.json must add a single drag-utility dependency — see Risks; if so, document in report).

---

## Out of Scope

- Q-X3 institutional ranking, Q-X4 personal-trust ranking, Q-C4 attribution ranking, Q-T1–Q-T8 Temperament. Each lands in its own later CC.
- The full design-system tokens (warm paper, umber accent, Source Serif typography, JetBrains Mono kickers). CC-007 ships functional ranking with reasonable default styling; design polish lands in CC-D-equivalent.
- The redesigned QuestionShell (head with progress dashes / autosave chip, foot with back/continue at proper styling). CC-007 wires ranking into the **existing** page shell.
- The redesigned tension card with `tell me more` provenance disclosure. The existing tension confirmation UI continues to be used.
- Inner Constitution rendering changes (the eight-card SWOT output spec). The existing Inner Constitution rendering continues to be used; T-012 surfaces in whatever shell already exists.
- The "this order is right" 4-second-idle pill. Optional v1 nice-to-have; ship without it if implementation is tight.
- Multi-user mirror-types comparison.
- Persistence (localStorage / autosave). The existing in-memory state continues.
- Any change to canon files.

---

## Acceptance Criteria

1. `lib/types.ts` contains `RankingQuestion`, `RankingAnswer`, `RankingItem`, `RankingItemId` types. Existing `Question` and `Answer` unions include the new variants. `Signal` accepts an optional `rank?: number` field.
2. `app/components/Ranking.tsx` exists and implements pointer-events drag-to-reorder per § 2 of this CC. Keyboard support is functional (Tab focuses grip, Space picks up, arrow up/down moves, Space drops, Escape cancels).
3. `app/page.tsx` renders ranking questions correctly in the existing question flow.
4. `lib/identityEngine.ts` `signalsFromRankingAnswer` exists and emits one Signal per item with correct `rank` and `strength` per the canonical mapping (position 1 → high, position 2 → medium, positions 3+ → low).
5. `lib/identityEngine.ts` `detectTensions` correctly fires T-012 when at least two distinct sacred `*_priority` signals at rank ≤ 2 are present. Description and user_prompt strings byte-for-byte match `tension-library-v1.md` T-012.
6. `data/questions.ts` Q-S1 is the ranked version (Freedom / Truth / Stability / Loyalty); Q-S2 ranked is added (Family / Knowledge / Justice / Faith). Family is no longer in Q-S1. The previous forced-choice Q-S1 is removed.
7. New SIGNAL_DESCRIPTIONS entries for `knowledge_priority`, `justice_priority`, `faith_priority` are added in `lib/identityEngine.ts`.
8. Manual smoke test in a browser at `localhost:3003`: Q-S1 and Q-S2 render with drag-to-reorder; T-012 surfaces after both are completed.
9. `npx tsc --noEmit` passes cleanly.
10. `npm run lint` passes cleanly.
11. No file outside the Allowed to Modify list has been edited.
12. No canon file has been touched.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description.
2. **Type system deltas** — quote the new type definitions in `lib/types.ts`. Confirm the `Signal` type accepts `rank?: number`.
3. **Ranking component overview** — describe the implementation of `app/components/Ranking.tsx`. Pointer-events strategy, keyboard support, screen-reader announcements, styling approach (inline / module CSS / other). One paragraph plus a 5-10 line excerpt of the most important code (the drag-handle event handlers or the keyboard handler).
4. **Engine deltas** — quote `signalsFromRankingAnswer` verbatim. Quote the updated T-012 detection block verbatim. Confirm Description and user_prompt strings match `tension-library-v1.md` byte-for-byte.
5. **`data/questions.ts` deltas** — show the new Q-S1 and Q-S2 entries verbatim. Confirm the old forced-choice Q-S1 was removed (not just commented out).
6. **Smoke-test results** — state whether browser testing confirmed Q-S1, Q-S2, and T-012 surfacing. If browser testing was skipped, say so.
7. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
8. **Scope-creep check** — explicit confirmation that:
   - No canon file was modified.
   - No other question in `data/questions.ts` was modified.
   - No other file under `app/` outside `page.tsx` and the new `components/Ranking.*` was modified.
   - No other tension besides T-012 was modified.
   - The "this order is right" pill was either implemented or explicitly skipped (state which).
9. **Risks / next-step recommendations** — anything that surfaced during execution. Specifically:
   - If a npm package was added (e.g., for drag utilities), name it and justify.
   - If browser styling defaults look obviously wrong (no design tokens yet), flag for the design-system CC that comes next.
   - Note that Q-S2's helper line is missing (deliberately not specified in canon); ask whether a helper should be added for Q-S2 in a future CC.
   - Any other observation worth surfacing.
