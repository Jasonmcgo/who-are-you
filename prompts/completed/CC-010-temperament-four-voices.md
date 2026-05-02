# CC-010 — Temperament (Four Voices) Q-T1 through Q-T8: Canon, Code, and Voice/Quote Rendering

## Goal

Land the **Lens (Temperament) card** as eight rank-aware questions on the running app — Q-T1 through Q-T4 (perceiving block: Ni / Ne / Si / Se) and Q-T5 through Q-T8 (judging block: Ti / Te / Fi / Fe), each presenting four voice-styled first-person statements that the user ranks by self-recognition. After CC-010, the running app at `localhost:3003` collects all eight Temperament rankings, the engine emits 32 rank-aware function signals across the session (one per ranked option × eight questions), and the Ranking primitive renders the voice/quote two-line treatment that the Temperament canon requires.

This is the heaviest canon-and-code CC remaining for v1. Three things land together:

1. **Canon.** Promote eight Q-T questions from `docs/temperament-voice-draft-v1.md` into `docs/canon/question-bank-v1.md` byte-for-byte (the draft is the source of truth, with the soft-spot flags carried forward as known v1 state). Register eight cognitive-function signals (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) in `docs/canon/signal-library.md` as `rank_aware: true` and `implementation_status: unused`. Update Active / Pending / Unused / Deprecated summary counts.

2. **Code.** Add eight new ranking question entries to `data/questions.ts` carrying `voice` and `quote` fields (the existing `gloss` field is unused for Temperament). Add eight new `SIGNAL_DESCRIPTIONS` entries to `lib/identityEngine.ts`.

3. **Ranking primitive extension.** Update `app/components/Ranking.tsx` so that when an item carries `voice` and `quote` fields, the row renders the voice as a mono kicker on the first line (small caps tracking +0.08em, `var(--ink-mute)`) and the quote as a serif italic body on the second line. The existing label + em-dash + gloss inline path continues to render for Sacred / Trust / Gravity / Conviction items unchanged. Same drag interaction, same keyboard handling, same screen-reader announcements.

**Out of scope** for CC-010 (each is a follow-up CC):

- **Break interstitials** ("pause. take a breath." cards after Q-T3 and Q-T6 per `temperament-framework.md` § 8). The eight Q-T questions ship back-to-back. Break interstitials get their own small CC that adds a `break` question type to `lib/types.ts` and a corresponding render branch in `app/page.tsx`.
- **Function-stack aggregation logic.** Aggregating rank across four questions per function to identify dominance, calling the canonical Stack Table to derive an MBTI 4-letter inferred label, etc. CC-011 or later (output engine derivation) territory.
- **Tensions consuming Temperament signals.** The four hooks named in `temperament-framework.md` § 7 (Temperament × Pressure inferior grip; Temperament × Agency native vs. current; Temperament × Context tempo vs. load; Temperament × Role) are deferred to later canon CCs.
- **Voice quote authoring or editing.** CC-010 ships the draft quotes from `docs/temperament-voice-draft-v1.md` verbatim, including the five known soft spots flagged in the draft (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te). Iteration on quotes is a separate copy-polish CC.
- **MBTI 4-letter disclosure affordance** in the result page. Deferred per `inner-constitution.md` § Output Rules #8.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode. The project's `.claude/settings.local.json` has `permissions.defaultMode: "bypassPermissions"` plus a broad allowlist; launches in this project should be quiet by default.

This CC touches multiple canon and code files and runs multiple bash commands. Per-edit or per-bash approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff`, `awk`, `sed`, `head`, `tail`, `wc`.

The agent should not pause to ask permission for these.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input. This prompt is self-contained.

If something is genuinely ambiguous, apply the most canon-faithful interpretation and flag the decision in the Risks / next-step recommendations section of the report-back — do not halt to ask.

If a prerequisite appears missing (a referenced file is absent, a check fails, a canon block has drifted since this prompt was written), attempt the canon-faithful equivalent, record the discrepancy in the report, and continue. Do not stop short.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

**Canon (read in full first; canon edits are scoped per § Allowed to Modify):**

- `docs/canon/temperament-framework.md` — the full theoretical model. § 3 cognitive functions, § 4 Canonical Stack Table, § 8 question design (the Temperament card's `display_name: "Four Voices"`, the eight-question structure with perceiving/judging blocks, the `voice` + `quote` + `signal` item anatomy, and the break-interstitial commitment that this CC defers), § 9 Canonical Rules.
- `docs/canon/question-bank-v1.md` — Q-T1 through Q-T8 are absent; this CC adds them.
- `docs/canon/signal-library.md` — eight cognitive-function signal IDs (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) are absent; this CC adds them. Also note the Active / Pending / Unused / Deprecated summary counts that need updating.
- `docs/canon/signal-mapping-rule.md` — § Ranking Question Signal Emission already specifies position 1 → high, position 2 → medium, positions 3+ → low; this rule applies to the four-item Q-T rankings without modification.
- `docs/canon/signal-and-tension-model.md` — § Rank-Aware Signals.
- `docs/canon/card-schema.md` — `card_id: temperament` is canonically defined and authorizes `display_name: "Four Voices"` plus the ranking question type with voice/quote item anatomy.
- `docs/canon/tension-library-v1.md` — no tensions consume Temperament signals in v1; do not author any.

**Reference (do NOT edit):**

- `docs/temperament-voice-draft-v1.md` — **the source of truth for the voice quotes.** All eight questions and all 32 voice quotes come from this file verbatim. Do not author new quotes; do not paraphrase; do not "fix" the five soft-spot quotes flagged in the draft (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te). Soft spots ship with a known-state flag in report-back.
- `docs/option-glosses-v1.md` § Q-T1–Q-T8 — flagged in the file as already-covered-by-temperament-voice-draft. Read for completeness; the Temperament voice quotes do not need a separate gloss treatment.
- `docs/design-spec-v2.md` § 7.5 — Four Voices design constraints. Voice quotes should sound competent and plausible; signal comes from priority, not from making three options weaker.

**Existing code (read; will be edited):**

- `lib/types.ts` — already defines `RankingItem` with optional `voice?: string` and `quote?: string` fields per CC-007. Verify those fields are present; add if missing.
- `lib/identityEngine.ts` — `SIGNAL_DESCRIPTIONS` will gain eight new entries. `signalsFromRankingAnswer` does not need modification (it already emits one signal per item with rank metadata regardless of the item's other fields).
- `data/questions.ts` — eight new ranking entries get appended.
- `app/components/Ranking.tsx` — render path needs extension to handle voice + quote two-line layout.

**Reference (do NOT edit):**

- `app/page.tsx` — already routes `type: "ranking"` to `<Ranking>`. No changes needed; Q-T1–Q-T8 are ranking questions and inherit the existing routing.
- `app/components/QuestionShell.tsx` — kicker mapping uses `card_id: temperament` → `"FOUR VOICES"` (this mapping was added in CC-D). Verify.

---

## Context

The Temperament Card is the Lens Shape card's question implementation. Per `shape-framework.md` § Card 1 (Lens), the user-facing label is "Four Voices" rather than "Lens" or "Temperament" — the body-part and Shape-card names are interpretive umbrellas; Four Voices is what the user reads on the screen.

`temperament-framework.md` was authored in CC-005 with a rank-aware design from the start. CC-005a aligned the Canonical Rules section to that design (rules 1, 2, and 5 specifically). The eight-question structure, the four-perceiving-plus-four-judging block layout, the voice/quote/signal item anatomy, the eight cognitive-function signals as a canonical signal family, and the rank-aware emission semantics are all already canonical — CC-010 is a *promotion* CC, not a design CC. The draft voice quotes in `temperament-voice-draft-v1.md` are proposed but their broad shape is set; what's pending is final wording resolution on five flagged statements.

The Ranking primitive built in CC-007 and polished in CC-D supports four-item and five-item rankings with pointer-events drag, keyboard reorder, screen-reader announcements, and umber visual treatment. What it does *not* yet support is rendering items that carry `voice` and `quote` fields instead of `label` and `gloss`. CC-010 extends the render path to handle the voice/quote case while preserving the label/gloss path for Sacred / Trust / Gravity / Conviction items.

The Temperament card's user experience is the most typographically demanding in the product. The voice quotes are first-person serif italic statements written in the register of one cognitive function each. Source Serif 4 italic was loaded in CC-D specifically for this content. Q-T questions will be the first place users feel the editorial register of the product — the voice register is what makes Temperament land or feel like a personality test.

---

## Canon-Faithful Interpretation Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Signal naming convention

The eight new rank-aware signals follow the naming locked in `temperament-framework.md` § 9 Canonical Rule 1:

- `ni`, `ne`, `si`, `se` (perceiving functions; produced by Q-T1 through Q-T4)
- `ti`, `te`, `fi`, `fe` (judging functions; produced by Q-T5 through Q-T8)

Each is two characters lowercase. Each is `rank_aware: true`. Each is `implementation_status: unused` because no v1 tension consumes them — the four tension hooks named in `temperament-framework.md` § 7 are all deferred.

### D-2: Voice quotes — verbatim from `docs/temperament-voice-draft-v1.md`

Use byte-for-byte. Do **not** author new voice quotes, paraphrase existing ones, or "fix" the five soft-spot quotes flagged in the draft. The five soft spots — Q-T1 Se ("carelessness read"), Q-T2 Ne ("scatter risk"), Q-T3 Si ("authority-deference read"), Q-T6 Fi ("sit with it"), Q-T8 Ti/Te (distinction) — ship as drafted. CC-010 report-back must list them as known v1 state.

For each Q-T question, the four items carry:

- `id` — kebab-style short ID (see § D-3).
- `label` — the voice token (e.g., `"Voice A"`, `"Voice B"`, `"Voice C"`, `"Voice D"`). This is the mono kicker that renders above each quote.
- `gloss` — **omitted.** Temperament items use `quote` instead of `gloss`. Do not include a `gloss` field for Temperament items.
- `voice` — same as `label` for Temperament; supports backward-compatible rendering (the Ranking component will look for `voice` first, falling back to `label` if absent).
- `quote` — the serif italic first-person statement, byte-for-byte from `temperament-voice-draft-v1.md`.
- `signal` — the cognitive-function signal id (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`).

Voice token assignment per question is **alphabetical by reading order**, not by function. Voice A is always the first option as the user reads down the list; the function it carries varies by question. This is a deliberate canon decision per `temperament-framework.md` § 8 — the user does not see "Ni" or "Ti" labels; they see Voice A / Voice B / Voice C / Voice D.

### D-3: Item IDs

Each item's `id` field uses the function code the option carries:

- Q-T1 through Q-T4: `id: "ni"`, `id: "ne"`, `id: "si"`, `id: "se"` (in the reading order specified by the draft for each question).
- Q-T5 through Q-T8: `id: "ti"`, `id: "te"`, `id: "fi"`, `id: "fe"` (in the reading order specified by the draft for each question).

The reading order in `temperament-voice-draft-v1.md` may not be alphabetical by function code; preserve the draft's reading order. Voice A / Voice B / Voice C / Voice D maps to position 1 / 2 / 3 / 4 in the draft.

### D-4: Question text

Each Q-T question has a **scenario header** per `temperament-voice-draft-v1.md` (e.g., "When you're working on a hard problem"). Use the draft's scenario header as the question's `text` field, byte-for-byte.

The eight scenario headers must be quoted in this prompt for verifiability. The executing agent should re-read `temperament-voice-draft-v1.md` and confirm the eight headers in report-back. Authorial expectation:

- Q-T1: "When you're working on a hard problem"
- Q-T2 through Q-T8: each has its own scenario header in the draft.

If the draft's scenario headers differ from the expected pattern, use the draft's text and flag the discrepancy in report-back.

### D-5: Helper text

Q-T questions do not have helpers. The QuestionShell's helper region remains hidden when the question's `helper` field is undefined, matching the existing behavior for Q-S2, Q-X4, and Q-C4.

### D-6: card_id

All eight Q-T questions use `card_id: "temperament"`. This is a NEW `card_id` for `data/questions.ts` — no prior question used it. Verify `card_id: "temperament"` is in the `CardId` type union in `lib/types.ts`. If it is not, **do not add it as part of CC-010** — flag in report-back. (It should already be there per `card-schema.md`'s authorization, but if `lib/types.ts` was authored before Temperament was canonized, the type may need extending. Treat as a discovered prerequisite.)

The kicker for Q-T questions reads `CARD N · FOUR VOICES · Q-TN` — the `CARD_KICKER_NAME` map in `app/page.tsx` (added in CC-D) already maps `temperament` → `"FOUR VOICES"`. Verify.

### D-7: SIGNAL_DESCRIPTIONS for the eight new signals

Each cognitive-function signal description is a single sentence in the SIGNAL_DESCRIPTIONS voice register already established in `lib/identityEngine.ts`. Use these (or near-identical paraphrases of the descriptions in `temperament-framework.md` § 3):

- `ni`: *"Pattern synthesis directed inward — consolidating disparate inputs over time into a single convergent interpretation of where something is going."*
- `ne`: *"Pattern generation directed outward — surfacing multiple parallel possibilities and connections from a single input."*
- `si`: *"Sensory recall directed inward — referencing prior verified experience and precedent before acting."*
- `se`: *"Sensory engagement directed outward — taking in the present concrete situation and acting on what's available now."*
- `ti`: *"Logical analysis directed inward — testing reasoning against an internal framework of consistency and definition."*
- `te`: *"Logical organization directed outward — structuring effort and evidence against external proof and operational result."*
- `fi`: *"Value discernment directed inward — testing options against personal moral authenticity and integrity."*
- `fe`: *"Value calibration directed outward — sensing relational and social register and what the situation asks of those present."*

Each description is a single sentence and avoids the cartoonish framings the design spec § 7.5 prohibits ("Ni is not mystical," "Te is not sociopathic," etc.).

### D-8: Ranking primitive extension — voice/quote two-line render path

Update `app/components/Ranking.tsx` to detect items with both `voice` and `quote` fields and render them differently from items with `label` and `gloss`. The detection check is `item.voice && item.quote`.

**Voice/quote render path** (Temperament):

```
[index column]   VOICE A
                 "Once I see how the pieces are going to land, the rest is mostly execution. I'm looking for the pattern that would explain everything else."
[grip column]
```

Two lines stacked vertically inside the label column:

- **Line 1 — the voice kicker.** Mono caps, 11px, tracking +0.08em, `var(--ink-mute)`. Same typography as the QuestionShell kicker.
- **Line 2 — the quote.** Serif italic, 14px mobile / 16px desktop, `var(--ink)` (slightly darker than the gloss usage; the quote is the main content). Wraps naturally; no enclosing quote marks rendered around the body (the draft text already has them per the file).

**Label/gloss render path** (Sacred / Trust / Gravity / Conviction; CC-010 preserves this verbatim):

```
[index]   Freedom — the ability to act without needing permission.
```

Inline as built in CC-D.

The detection is per-item, not per-question. If a question's items mix voice/quote and label/gloss (which no canonical question currently does, but the type system permits), each item renders by its own field set.

The rest of the Ranking component — pointer drag, keyboard reorder, screen-reader announcements, drag threshold, snap timing, focus management, umber active row, grip handle styling — is **unchanged**.

### D-9: Strength mapping for four-item Q-T rankings

Per `signal-mapping-rule.md` § Ranking Question Signal Emission and per CC-006 / CC-007 implementation: position 1 → `high`, position 2 → `medium`, positions 3+ → `low`. The eight Q-T questions all rank four items, so the mapping is identical to Sacred (Q-S1, Q-S2). No code changes required to `signalsFromRankingAnswer` or `strengthForRank`.

### D-10: Across all eight questions, each function appears exactly four times

Per `temperament-framework.md` § 8 line 207: "across the eight questions, each function appears in exactly four — once per question within its block." The four perceiving functions (Ni, Ne, Si, Se) appear once each in Q-T1, Q-T2, Q-T3, Q-T4 — so each function gets ranked four times across the perceiving block. Same for the four judging functions across Q-T5–Q-T8. Verify in `temperament-voice-draft-v1.md` that this is true; flag in report-back if it isn't.

This means a single user session emits 32 cognitive-function signal instances (8 questions × 4 ranked items), with each of the eight function signals appearing four times at varying ranks.

### D-11: Promotion notes in question-bank-v1.md

For each Q-T question's canon entry, include a one-line authoring note pointing back to the draft source:

> "Q-TN scenario X. Voice quotes promoted from `docs/temperament-voice-draft-v1.md` § Q-TN (locked in CC-010). Five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted; iteration on quote wording is a separate copy-polish CC."

This makes the lineage visible in canon for future authors.

---

## Requirements

### 1. Canon: add Q-T1 through Q-T8 entries to `docs/canon/question-bank-v1.md`

Append eight new question entries in a new "Temperament Card" subsection (or wherever the existing Conviction / Pressure / Formation / Context / Agency / Sacred subsections naturally lead, with Temperament as a new section). Use the existing question-entry voice and structure (match Q-S1 / Q-S2 / Q-X3 / Q-X4 / Q-C4).

Each entry must contain:

- `question_id: Q-TN` (N = 1 through 8)
- `card_id: temperament`
- `display_name: Four Voices` (per `temperament-framework.md` § 8 line 188)
- `type: ranking` (4 items)
- `question:` text — the scenario header from `temperament-voice-draft-v1.md` byte-for-byte
- `items:` list — four items, each with `id`, `label`, `voice`, `quote`, and `signal` per § D-2 / § D-3
- An authoring note per § D-11

Reading order of items per question is preserved from the draft. Voice tokens (Voice A / B / C / D) follow reading order.

### 2. Canon: register eight new function signals in `docs/canon/signal-library.md`

Add a new "Temperament Card" subsection with eight signal entries. Each follows the per-entry schema from the file:

```
#### <signal_id>

- signal_id: <signal_id>
- description: <D-7 description>
- primary_cards: [temperament]
- produced_by_questions: [Q-T1, Q-T2, Q-T3, Q-T4]   ← for perceiving functions Ni/Ne/Si/Se
  OR [Q-T5, Q-T6, Q-T7, Q-T8]                       ← for judging functions Ti/Te/Fi/Fe
- used_by_tensions: —
- rank_aware: true
- implementation_status: unused
- notes: Introduced in CC-010 from `temperament-framework.md` § 9 Canonical Rule 1. Rank-aware: emitted with `rank` metadata per `signal-mapping-rule.md` § Ranking Question Signal Emission. Each function appears across four Q-T questions in its block (perceiving for Ni/Ne/Si/Se; judging for Ti/Te/Fi/Fe). No tension consumes this signal in v1; the four hooks named in `temperament-framework.md` § 7 (Temperament × Pressure inferior grip; Temperament × Agency native vs. current; Temperament × Context; Temperament × Role) are deferred. Function-stack aggregation logic is also deferred to a future CC.
```

Eight entries total (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`).

### 3. Canon: update Active / Pending / Unused / Deprecated summary sections in `docs/canon/signal-library.md`

After CC-010, the per-entry registrations imply these new counts:

- **Active Signals.** Stays at **26**. No active signal is added or removed.
- **Pending Signals.** Stays at **4**.
- **Unused Signals.** Currently 32 (post-CC-009). Add the eight new function signals. New count: **40**. Add eight bullet lines:
  - `ni` — produced by Q-T1, Q-T2, Q-T3, Q-T4 (rank-aware).
  - `ne` — produced by Q-T1, Q-T2, Q-T3, Q-T4 (rank-aware).
  - `si` — produced by Q-T1, Q-T2, Q-T3, Q-T4 (rank-aware).
  - `se` — produced by Q-T1, Q-T2, Q-T3, Q-T4 (rank-aware).
  - `ti` — produced by Q-T5, Q-T6, Q-T7, Q-T8 (rank-aware).
  - `te` — produced by Q-T5, Q-T6, Q-T7, Q-T8 (rank-aware).
  - `fi` — produced by Q-T5, Q-T6, Q-T7, Q-T8 (rank-aware).
  - `fe` — produced by Q-T5, Q-T6, Q-T7, Q-T8 (rank-aware).
- **Deprecated Signals.** Stays at **3**.

### 4. Code: add Q-T1 through Q-T8 to `data/questions.ts`

Append eight new ranking entries to the questions array. Place them after Q-A2 (or wherever Agency-card questions end) and before any I-questions (freeform Q-I1, Q-I2, Q-I3) — Temperament conventionally sits between core ranking cards and the freeform insight set.

Each entry follows the `RankingQuestion` shape from `lib/types.ts`. The four `items` per question carry `id`, `label` (= voice token), `voice`, `quote`, `signal`. Do **not** include `gloss` or `helper`.

Example (Q-T1 only, illustrative — final entries use the byte-for-byte draft quotes):

```ts
{
  question_id: "Q-T1",
  card_id: "temperament",
  type: "ranking",
  text: "When you're working on a hard problem,",
  items: [
    {
      id: "ni",
      label: "Voice A",
      voice: "Voice A",
      quote: "Once I see how the pieces are going to land, the rest is mostly execution. I'm looking for the pattern that would explain everything else.",
      signal: "ni",
    },
    {
      id: "ne",
      label: "Voice B",
      voice: "Voice B",
      quote: "There are at least four interesting angles here. I want to spend time on each before deciding which one fits.",
      signal: "ne",
    },
    {
      id: "si",
      label: "Voice C",
      voice: "Voice C",
      quote: "What's worked in similar situations before? There's usually precedent worth checking before reinventing.",
      signal: "si",
    },
    {
      id: "se",
      label: "Voice D",
      voice: "Voice D",
      quote: "Let me start moving and see what surfaces. I'll know what I'm dealing with once I'm actually working on it.",
      signal: "se",
    },
  ],
},
```

The reading order for each Q-T question and the function-to-voice-token mapping must come from `temperament-voice-draft-v1.md` byte-for-byte. The order shown above for Q-T1 (Ni / Ne / Si / Se) is illustrative and may differ from the draft's actual reading order. **Use the draft's reading order, not this example's order.**

### 5. Code: add eight new SIGNAL_DESCRIPTIONS entries to `lib/identityEngine.ts`

Add the eight entries to the existing `SIGNAL_DESCRIPTIONS` constant per § D-7. Place them at the end of the constant, after the last entry from CC-009.

Do not modify any existing SIGNAL_DESCRIPTIONS entries. Do not modify `signalsFromRankingAnswer`, `strengthForRank`, `signalFromAnswer`, or `detectTensions`. The ranking emission logic from CC-007 already handles four-item rankings with rank metadata correctly.

### 6. Code: extend `app/components/Ranking.tsx` with voice/quote two-line render path

Per § D-8. The existing label/gloss inline render path is preserved unchanged. A new branch detects `item.voice && item.quote` and renders the two-line voice-kicker + serif-italic-quote layout.

Implementation guidance:

- The detection branch lives inside the row's label column (between the index column and the grip column). Vertical stacking with a small gap (4–6px) between the voice kicker and the quote.
- The voice kicker uses the same Tailwind / inline-style approach as the QuestionShell kicker (mono, 11px, uppercase, tracking +0.08em, `var(--ink-mute)`).
- The quote uses serif italic (`font-style: italic`), 14px mobile / 16px desktop, `var(--ink)`. No enclosing quote marks rendered programmatically — the draft text already includes them.
- Mobile and desktop typography pairs follow the same `<span className="md:hidden">` / `<span className="hidden md:inline">` pattern CC-D used elsewhere in the component.
- Active row (drag or keyboard pickup) treatment — `var(--umber-wash)` background, umber outline — applies regardless of which render path the row uses.

All other Ranking primitive behavior — pointer drag, keyboard reorder, screen-reader announcements, the 6px drag threshold, the 150ms snap, the keyboard pickup state, the focus management — is unchanged. Quote the relevant unchanged code regions in report-back to confirm.

### 7. Code: type system

Verify `lib/types.ts` `RankingItem` already declares optional `voice?: string` and `quote?: string` fields per CC-007. If they are present, no type-system change is required. If they are **missing** (e.g., CC-007 only stubbed them in comments), add them:

```ts
export type RankingItem = {
  id: RankingItemId;
  label: string;
  gloss?: string;
  voice?: string;
  quote?: string;
  signal: SignalId;
};
```

Do not modify any other type. `SignalId = string` accepts the eight new function signal IDs without enumeration.

Verify `CardId` includes `"temperament"`. Per `card-schema.md` it should, but if it does not, **add it**:

```ts
export type CardId =
  | "conviction"
  | "pressure"
  | "formation"
  | "context"
  | "agency"
  | "sacred"
  | "temperament";   // ← add if missing
```

### 8. Verify in browser

After all edits, run `npm run dev` and confirm in a real browser at `localhost:3003`:

- Q-T1 through Q-T8 render in sequence after the existing question flow.
- Each Q-T question shows the QuestionShell kicker `CARD N · FOUR VOICES · Q-TN`.
- Each Q-T question's prompt is the scenario header from the draft (e.g., "When you're working on a hard problem,").
- Each Q-T question shows four ranked items, each with a mono kicker `VOICE A / B / C / D` on the first line and a serif italic quote on the second line.
- Drag-to-reorder works. Index numerals (1–4) update on release.
- Keyboard reorder works (Tab to grip, Space to pick up, arrows to move, Space to drop).
- Source Serif 4 italic loads correctly for the quote text. Quotes render as italic serif, not roman.
- After completing all eight Q-T questions, the engine emits 32 function signals (4 per question × 8 questions) at appropriate ranks. Signal inspection (via `console.log` or whatever inspection mechanism exists) shows each of `ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe` appearing four times across the session at varying ranks.
- The result page surfaces the function signals (no tensions consume them in v1, so no Temperament tension fires — expected).
- Mobile viewport (~390px) renders without horizontal scroll. Voice quotes wrap naturally; the two-line layout (kicker + quote) reads cleanly at thumb width.

If browser smoke testing is performed by the user instead of the agent, the agent must clearly state in report-back that browser testing was deferred.

### 9. Type check and lint

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.

---

## Allowed to Modify

**Canon:**

- `docs/canon/question-bank-v1.md` — append Q-T1 through Q-T8 entries only; do not modify existing question entries.
- `docs/canon/signal-library.md` — register eight new function signals; update Active / Pending / Unused / Deprecated summary counts; do not modify existing signal entries; do not delete or alter any signal.

**Code:**

- `data/questions.ts` — append Q-T1 through Q-T8 entries only; do not modify existing question entries.
- `lib/identityEngine.ts` — add eight new entries to `SIGNAL_DESCRIPTIONS`; do not modify any existing function or constant.
- `lib/types.ts` — verify `RankingItem.voice` and `RankingItem.quote` are present; verify `CardId` includes `"temperament"`. Add if missing. Do not modify any other type.
- `app/components/Ranking.tsx` — add voice/quote two-line render path; preserve all other functional and visual behavior.

Do **not** modify:

- Any other file under `docs/canon/`. Specifically: `shape-framework.md`, `tension-library-v1.md`, `inner-constitution.md`, `output-engine-rules.md`, `signal-mapping-rule.md`, `signal-and-tension-model.md`, `card-schema.md`, `temperament-framework.md`, `research-mapping-v1.md`, `validation-roadmap-v1.md`. Canon edits are limited to the two listed above.
- `docs/temperament-voice-draft-v1.md` — reference only.
- `docs/option-glosses-v1.md` — reference only.
- `docs/design-spec-v2.md` — reference only.
- `app/components/QuestionShell.tsx` — already handles `card_id: temperament` via the `CARD_KICKER_NAME` map added in CC-D.
- `app/components/ProgressIndicator.tsx`.
- `app/page.tsx` — already routes `type: "ranking"` to `<Ranking>`. No changes needed.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts` entries other than the new Q-T1 through Q-T8.
- `lib/identityEngine.ts` functions, constants, or existing SIGNAL_DESCRIPTIONS entries other than the eight new additions.
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`.

---

## Out of Scope

This CC does not do any of the following. Each is a future-CC concern.

- **Break interstitials** ("pause. take a breath." after Q-T3 and Q-T6 per `temperament-framework.md` § 8). Requires adding a `break` question type to `lib/types.ts` and a corresponding render branch in `app/page.tsx`. Future small CC.
- **Function-stack aggregation logic.** Aggregating rank across the four perceiving questions to identify the user's dominant perceiving function, same for judging, then matching against the canonical Stack Table to derive an inferred MBTI 4-letter label. CC-011 or later.
- **MBTI 4-letter disclosure affordance.** Per `inner-constitution.md` § Output Rules #8, MBTI codes appear only as optional disclosures behind a small affordance, never as headlines. The affordance UI is future-CC scope.
- **Tensions consuming Temperament signals.** The four hooks (Temperament × Pressure inferior grip; Temperament × Agency; Temperament × Context; Temperament × Role) are deferred per `temperament-framework.md` § 7.
- **Voice quote authoring or editing.** Use the draft verbatim, including the five known soft-spot quotes. Iteration is a separate copy-polish CC.
- **Inferior-grip pressure pattern detection.** The grid in `temperament-framework.md` § 5 is canonical theory; encoding it as tensions is a future CC.
- **Function-pair tensions** (e.g., Te-vs-Fi conflict, Ni-vs-Se grip pattern). Same as above.
- **Voice token alternative naming.** Stays as Voice A / B / C / D per `temperament-framework.md` § 8.
- **Question reordering.** Append-only. Do not reorder existing questions.
- **Card schema changes.** `card_id: "temperament"` already exists per `card-schema.md`.
- **Helper text for Q-T questions.** Per § D-5, no helpers.
- **Inner Constitution rendering.** No changes to how results are displayed. CC-010 ships the data plumbing for Lens (Temperament); the Lens SWOT renderer is a future CC.
- **Output engine derivation rules.** No changes to `output-engine-rules.md` or any signal-to-SWOT logic.
- **Persistence / autosave / localStorage.** Out of scope.
- **Design polish beyond the voice/quote render path.** No new design-token additions, no new component files. CC-010 inherits the CC-D shell.
- **Q-S2 gloss fork** between v2 design-spec and canon — separate decision; do not touch.

---

## Acceptance Criteria

1. `docs/canon/question-bank-v1.md` contains eight new Q-T entries (Q-T1 through Q-T8) under a new Temperament Card section, each as a 4-item ranking question on `card_id: temperament` with `display_name: Four Voices`, scenario-header text from the draft, four items carrying `id` / `label` / `voice` / `quote` / `signal`, and an authoring note per § D-11.
2. Each item's `voice` and `quote` fields are byte-for-byte from `docs/temperament-voice-draft-v1.md` for the corresponding question. No paraphrases. The five soft-spot quotes (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) ship as drafted.
3. Across the eight questions, each function (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) appears in exactly four items: Ni/Ne/Si/Se in Q-T1–Q-T4 (one each per question); Ti/Te/Fi/Fe in Q-T5–Q-T8.
4. `docs/canon/signal-library.md` contains eight new signal entries (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`), each with `rank_aware: true`, `implementation_status: unused`, and the per-entry schema from § 2.
5. `docs/canon/signal-library.md` summary counts updated: Active 26 (unchanged), Pending 4 (unchanged), Unused 27 → 40 (eight new function signals added; was 32 post-CC-009, but verify the actual current count in the file and add eight to it), Deprecated 3 (unchanged).
6. `data/questions.ts` contains eight new `RankingQuestion` entries (Q-T1 through Q-T8), each on `card_id: "temperament"`, with four `items` carrying `id` / `label` / `voice` / `quote` / `signal`. No `gloss` field on Temperament items. No `helper` field.
7. `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` contains the eight new entries with descriptions matching § D-7.
8. `lib/types.ts` `RankingItem` has optional `voice?: string` and `quote?: string` fields. `CardId` includes `"temperament"`. If either was missing pre-CC-010, the addition is documented in report-back.
9. `app/components/Ranking.tsx` detects items with `voice` and `quote` fields and renders them in a two-line layout (mono kicker + serif italic quote). Items with `label` and `gloss` (no voice/quote) continue to render in the existing inline `label — gloss` layout. All CC-007 functional behavior preserved (drag threshold, snap timing, keyboard, screen reader, focus management).
10. Manual smoke test in a browser at `localhost:3003`: Q-T1 through Q-T8 render with correct kickers (`CARD N · FOUR VOICES · Q-TN`), voice/quote two-line rows, drag and keyboard reorder. After completing all Q-T questions, the engine emits 32 function signals at appropriate ranks. (Or browser testing is explicitly deferred to the user.)
11. `npx tsc --noEmit` passes cleanly.
12. `npm run lint` passes cleanly.
13. No file outside the Allowed to Modify list has been edited.
14. No tension was authored. No tensions consume Temperament signals in v1.
15. Break interstitials are NOT implemented. No `break` question type in `lib/types.ts`. No `break` render branch in `app/page.tsx`.
16. Function-stack aggregation logic is NOT implemented. No new functions in `lib/identityEngine.ts` for aggregating Temperament signals or deriving MBTI labels.
17. Voice quotes are NOT authored or edited. All 32 quotes match `docs/temperament-voice-draft-v1.md` byte-for-byte.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description.
2. **Canon: question-bank-v1.md Q-T entries** — quote one full Q-T entry verbatim (Q-T1 is fine) and confirm the structure of all eight. Confirm that the voice quotes match `docs/temperament-voice-draft-v1.md` byte-for-byte. Confirm that across the eight questions, each function appears in exactly four items.
3. **Canon: signal-library.md Temperament Card section** — quote the eight new signal entries verbatim. Confirm each is `rank_aware: true` and `implementation_status: unused`.
4. **Canon: signal-library.md summary updates** — quote the updated Active / Pending / Unused / Deprecated headers and counts. Confirm Unused gained the eight function signals.
5. **Code: data/questions.ts** — quote one full Q-T entry verbatim (Q-T1) and confirm the structure of all eight. Confirm placement (after Q-A2 / before Q-I1 or wherever Temperament naturally sits).
6. **Code: lib/identityEngine.ts** — quote the eight new SIGNAL_DESCRIPTIONS entries verbatim. Confirm no existing entries or functions were modified.
7. **Type system** — confirm `RankingItem` has `voice?: string` and `quote?: string`. Confirm `CardId` includes `"temperament"`. Document any addition that was needed.
8. **Ranking primitive extension** — quote the new voice/quote render branch. Confirm the label/gloss inline path is preserved verbatim. Confirm pointer-event drag, keyboard handling, screen-reader announcements, drag threshold, snap timing, and focus management are all unchanged (cite the specific functions and refs).
9. **Smoke-test results** — state whether browser testing confirmed Q-T rendering with correct kickers, voice/quote two-line rows, drag/keyboard reorder, and 32 function signals firing across a session. If browser testing was deferred to the user, say so explicitly.
10. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
11. **Scope-creep check** — explicit confirmation that:
    - No canon file outside `question-bank-v1.md` and `signal-library.md` was modified.
    - `temperament-framework.md`, `tension-library-v1.md`, `inner-constitution.md`, `output-engine-rules.md` were not modified.
    - No new tensions were authored.
    - No break interstitials were implemented.
    - No function-stack aggregation logic was added.
    - No MBTI label derivation was attempted.
    - Voice quotes are byte-for-byte from the draft (no edits, no paraphrases).
    - The five known soft-spot quotes ship as drafted.
    - `app/page.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx` were not modified.
    - `app/globals.css`, `app/layout.tsx` were not modified.
12. **Risks / next-step recommendations** — anything that surfaced during execution. Specifically:
    - List the five known soft-spot quotes that shipped (Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te) so they're visible for the next copy-polish CC.
    - Flag the break-interstitial deferral as the most user-visible follow-up — the eight Q-T questions in a row without breaks may feel heavier than canon intends.
    - Flag the function-stack aggregation deferral. The 32 function signals fire correctly but the Inner Constitution can't yet say anything about them. Same v1 thinness pattern as Q-X3 / Q-X4 / Q-C4.
    - If `lib/types.ts` required `RankingItem.voice` / `RankingItem.quote` or `CardId.temperament` to be added, document the change.
    - If the Ranking primitive's mobile rendering of the quote line wraps awkwardly (some quotes are long), flag for potential typography polish.
    - If Source Serif 4 italic does not load as expected for the quote text, flag for follow-up.
    - Helper-text asymmetry now extends to all eight Q-T questions (no helpers). Same flag as before.
    - Any other observation worth surfacing.
