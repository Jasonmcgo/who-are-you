# CC-PROSE-1B — Prose Architecture Lift, Layers 4-6 (Core Signal Map + Pulled-Forward Callouts + Top Gifts/Edges Table)

**Origin:** CC-PROSE-1 (Layers 1-3) shipped 2026-05-08 — Executive Read + per-card Question prefix + Movement halo + Drive donut. CC-PROSE-1A (coherence pass) shipped 2026-05-08 — Executive Read callout treatment, Question bold/small-caps, halo bump to 28, Synthesis composer (`generateSimpleSummary`) voice cleanup, "Pattern observation" → "Pattern in motion" rename. CC-PROSE-1B closes the original CC-PROSE-1 spec by landing the three deferred layers: Core Signal Map (12-cell at-a-glance grid), Pulled-Forward Callouts (3 callouts at different report depths), and Top Gifts + Growth Edges as a unified table. Plus it absorbs three open follow-ups from CC-PROSE-1's Report Back: (a) decision on PieChart vs donut redundancy in PathExpanded, (b) mobile viewport verification across the new visualizations, (c) optional halo escalation to 32 contingent on visual review.

**Method discipline:** Engine prose, not LLM at production time. Three structural lifts of existing engine content into more usable formats — every cell, every callout, every table row sources from existing composer outputs. The signal-grounding canon ("every claim grounded in signals; engine-words forbidden in user-facing prose") stays load-bearing. The deferred LLM-prose layer (per `feedback_marble_statue_humanity_gap`) remains deferred. CC-PROSE-1B does not cross into LLM territory.

**Highest editorial-judgment surface in this CC: Layer 5C (Final Line callout).** The engine doesn't currently produce a "closing-of-the-closing" synthesis natively. The Final Line composer must mechanically recombine existing components (GIFT_DANGER_LINES + thesisFor structuralY) without inventing new vocabulary. Where a shape doesn't yield a clean carry-away line through mechanical recombination, the composer must surface the gap rather than fabricate. This is the load-bearing guardrail for the entire CC.

**Scope frame:** Three new layers + three open follow-ups absorbed. Touches new `lib/coreSignalMap.ts` composer, new `lib/composeReportCallouts.ts` composer, possibly new React components, the markdown render path, and PathExpanded's PieChart-vs-donut decision. ~6-8 hours executor time. CC-scale because of the editorial judgment in Layer 5C, the visual design choices in Layer 4's grid, and the pairing-rule verification in Layer 6.

**Project memory context:** `project_cc_prose_track_status.md` (CC-PROSE-1 + 1A shipped state, six open follow-ups for 1B); `feedback_marble_statue_humanity_gap` (LLM-prose layer deferred); `feedback_coherence_over_cleverness` (CC-PROSE-1A closed coherence gaps; 1B builds on a clean foundation); `feedback_hedge_density_in_engine_prose` (current rate 30-47 hedges per fixture against a 3-floor — do NOT add hedges in callouts); `feedback_synthesis_over_contradiction` (prefer coherence reads where evidence supports them — Final Line should lean toward synthesis, not contradiction); `feedback_minimal_questions_maximum_output` (Layer 4 + 6 derive new dimensions from existing signals — pattern-catalog over new measurement); `feedback_codex_vs_cc_prompt_naming` (CC-PROSE-N sub-track convention).

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass with three coordinated layers + three follow-ups.

**Layer 4 (Core Signal Map):** new composer at `lib/coreSignalMap.ts`; consumed by markdown render and React. Renders a 12-cell HTML grid (3×4 or 4×3, executor's call based on visual fit) immediately after the Executive Read, before "How to Read This." Each cell sources directly from existing engine outputs — no synthesis, no new vocabulary. Italic line below the grid: `The useful question is not whether the read is final. It is whether it helps you become more grounded, more legible, and more free.` (second-person; canonical engine close).

**Layer 5 (Pulled-Forward Callouts):** new composer at `lib/composeReportCallouts.ts` returning `{summary, mostUsefulLine, finalLine}`. Three callouts at three report depths:
- **5A — One-Sentence Summary**: wraps the thesis line in a callout block, rendered after Top Gifts (or after Top Gifts + Growth Edges table once Layer 6 collapses them).
- **5B — Most Useful Line**: wraps the gift/danger one-liner in a callout block, rendered inside the Synthesis section, after the parallel-line tercet.
- **5C — Final Line**: closing-of-the-closing, mechanically recombined from GIFT_DANGER_LINES + thesisFor structuralY; rendered at the end of the report after Closing Read.

All three callouts reuse CC-PROSE-1A's Executive Read callout visual treatment (border-left 3px var(--umber) + bg var(--umber-wash) + padding 14px 18px + border-radius 2) for visual consistency. Markdown form for all three: blockquote (`> *...*`).

**Layer 6 (Top Gifts + Growth Edges unified table):** replaces the separate "Top 3 Gifts" and "Top 3 Growth Edges" lists with a 3-row × 3-column table. Columns: Gift name / What it means / Growth edge. Pairing rule: `topGifts[i]` paired with `topRisks[i]` from `cross_card` — matching the parallel-line close in `generateSimpleSummary`. The "What it means" column lifts the first descriptive sentence of the gift's existing prose. Markdown renders as a table; React renders as a styled HTML table that stacks rows on mobile (<600px viewport).

**Follow-ups absorbed:**
- **PieChart vs donut decision in PathExpanded.tsx:** make a deliberate call. Default recommendation: keep both (PieChart's per-slice rank badges add information the donut's center-label doesn't replicate). Document the decision in a code comment so it doesn't get re-litigated.
- **Mobile viewport verification:** Layer 4's grid + Layer 5's three callouts + Layer 6's table all rendered through a mobile viewport (<600px) during `npm run dev` verification. Each must degrade gracefully.
- **Halo escalation contingent:** if visual review of the canonical Jason fixture's halo (grip=21) at MOVEMENT_GRIP_HALO_MAX = 28 still reads too subtle, bump to 32 (cap). If it reads acceptably at 28, leave alone. Flag the chosen value in Report Back.

Both render paths (markdown / React) stay synchronized. Shared composers in `lib/`, consumed by both renderers.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npm run dev` (visual verification — desktop AND mobile viewport)
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/identityEngine.ts` — confirm `composeExecutiveRead` (CC-PROSE-1 canon, second-person 2-sentence distillation), `generateSimpleSummary` (CC-PROSE-1A coherence canon, second-person Synthesis composer), `thesisFor` / THESIS_TEMPLATES (the source of `shapeDescriptor`, `assumedX`, `structuralY` strings — Layer 5A and 5C lift from these), `GIFT_DANGER_LINES[dom]` (the source of "Your gift is X. Your danger is Y." one-liners — Layer 5B and 5C lift from these). Confirm the exact data shape via grep before composing.
2. `lib/cardAssets.ts` — `SHAPE_CARD_QUESTION` map (Layer 4 references). `SHAPE_CARD_PRACTICE_TEXT` (existing card-closer Practice text canon).
3. `lib/renderMirror.ts` — markdown render path. Identify where Layer 4 (Core Signal Map) inserts (after Executive Read blockquote, before "How to Read This"). Identify where Layer 5A inserts (after Top Gifts / Top Growth Edges table). Identify where Layer 5B inserts (inside Synthesis section, after parallel-line tercet). Identify where Layer 5C inserts (end of report, after Closing Read). Identify Top 3 Gifts + Top 3 Growth Edges current rendering — Layer 6 replaces both.
4. `app/components/MirrorSection.tsx` — React render path; CC-PROSE-1A's Executive Read callout block lives here. Layers 4 + 5 + 6 React components are siblings.
5. `app/components/ShapeCard.tsx` — confirm the post-CC-PROSE-1A CardQuestion (font-mono uppercase) treatment is unchanged by 1B.
6. `app/components/MapSection.tsx` — confirm "Pattern in motion" label per CC-PROSE-1A is unchanged by 1B.
7. `app/components/PathExpanded.tsx` — current PieChart + donut both render. Layer 1B follow-up: make a deliberate call.
8. `lib/oceanDashboard.ts` — palette reference (`--umber`, `--umber-wash`, `--ink`, `--ink-soft`, `--ink-mute` CSS variable names; or hex values where used). Layer 4 + 5 + 6 must use the existing palette.
9. The InnerConstitutionOutput type definition — likely in `lib/types.ts`. Confirm the exact field names for `lens_stack.dominant`, `lens_stack.auxiliary`, `topCompass`, `topGravity`, `mbtiCode`, `workMap.matches[0]`, `loveMap.matches[0]`, `grippingPull.signals`, `goalSoulMovement.{goal,soul,direction,strength,grippingPull}`, `cross_card.topGifts`, `cross_card.topRisks` — Layer 4 cells lift from these; Layer 6 pairing rule depends on `cross_card`.
10. `tests/audit/proseArchitecture.audit.ts` — existing CC-PROSE-1 + CC-PROSE-1A audit harness; CC-PROSE-1B adds new `prose-1b-*` assertions to the same file.

## Allowed to Modify

### Layer 4 — Core Signal Map (12-cell grid)

**New file:** `lib/coreSignalMap.ts` (composer).
**New file (recommended):** `app/components/CoreSignalMap.tsx` (React component).
**Files modified:** `lib/renderMirror.ts` (markdown insertion); `app/components/MirrorSection.tsx` (React insertion).

**Composer signature:**

```ts
export interface CoreSignalCell {
  label: string;
  value: string;
}

export function buildCoreSignalCells(output: InnerConstitutionOutput): CoreSignalCell[];
// returns 12 cells in canonical order (see below)

export function renderCoreSignalMapMarkdown(output: InnerConstitutionOutput): string;
// returns markdown table or fenced HTML grid

export function CoreSignalMap(props: { output: InnerConstitutionOutput }): JSX.Element;
// React component (in app/components/CoreSignalMap.tsx)
```

**Twelve canonical cells (in this order):**

| # | Cell label | Source field | Example value |
|---|---|---|---|
| 1 | Driver | `output.lens_stack.dominant` (cognitive function name, human-readable) | "Pattern-reader" |
| 2 | Support | `output.lens_stack.auxiliary` | "Structurer" |
| 3 | Protected value | `output.topCompass[0]` | "Knowledge" |
| 4 | First blame lens | `output.topGravity[0]` | "Individual" |
| 5 | Surface label | `output.mbtiCode + ", provisional"` | "INTJ, provisional" |
| 6 | Work map | `output.workMap.matches[0].label` | "Strategic / Architectural" |
| 7 | Love map | `output.loveMap.matches[0].label` | "the Companion" |
| 8 | Pressure pull | `output.grippingPull.signals.slice(0,3).join(", ")` | "control, money / security, being right" |
| 9 | Movement | `Goal ${goal} / Soul ${soul}` | "Goal 88 / Soul 53" |
| 10 | Direction | `${direction}°, ${leaning}` | "31°, Goal-leaning" |
| 11 | Strength | `${strength}, ${length}` | "72.6, long" |
| 12 | Grip | `${grippingPull.score} / 100` | "21 / 100" |

**Empty-value handling:** If a source field is empty (e.g., `loveMap.matches` is empty for some shape), render the cell with the label and a blank value rather than skipping the cell. Audit assertion verifies all 12 cells render unconditionally. The grid must remain visually balanced even if a cell is empty.

**Visual design (React):**

- HTML grid (semantic `<dl>` or CSS grid `<div role="list">` — executor's call) for accessibility. Not SVG.
- 4 columns × 3 rows OR 3 columns × 4 rows — executor picks based on visual fit at desktop and mobile widths. Cell aspect ratio approximately 2:1 (wider than tall).
- Each cell: thin brown border (1px var(--umber-soft) or equivalent), cream interior (var(--umber-wash) or var(--cream)), label at top in font-mono uppercase small-caps (mirrors CC-PROSE-1A's CardQuestion treatment), value below in serif at ~14px.
- Label font: ~10px, letter-spacing 0.1em, color var(--ink-mute).
- Value font: ~14px, color var(--ink).
- Mobile (<600px): collapses to 2 columns × 6 rows; if that's still too cramped, 1 column × 12 rows is acceptable as the floor.
- Italic line below the grid (centered, second-person, canonical engine close):
  > *The useful question is not whether the read is final. It is whether it helps you become more grounded, more legible, and more free.*

**Visual design (markdown):** Render as a markdown table:

```
| Driver | Support | Protected value | First blame lens |
|--------|---------|-----------------|------------------|
| Pattern-reader | Structurer | Knowledge | Individual |

| Surface label | Work map | Love map | Pressure pull |
|---------------|----------|----------|---------------|
| INTJ, provisional | Strategic / Architectural | the Companion | control, money / security, being right |

| Movement | Direction | Strength | Grip |
|----------|-----------|----------|------|
| Goal 88 / Soul 53 | 31°, Goal-leaning | 72.6, long | 21 / 100 |
```

(Or a single 12-cell table with row breaks — executor chooses; the audit verifies all 12 cells render.)

Below the table: `*The useful question is not whether the read is final. It is whether it helps you become more grounded, more legible, and more free.*`

**Render position:** Insert immediately after the Executive Read callout, before "How to Read This." This establishes the visual flow: masthead → Executive Read callout → Core Signal Map grid → "How to Read This" → body of the report.

### Layer 5 — Pulled-Forward Callouts (three callouts)

**New file:** `lib/composeReportCallouts.ts`.
**Files modified:** `lib/renderMirror.ts` (markdown insertion at three positions); `app/components/MirrorSection.tsx` (React insertion at three positions).

**Composer signature:**

```ts
export interface ReportCallouts {
  summary: string;        // Layer 5A: one-sentence shape descriptor (second-person)
  mostUsefulLine: string; // Layer 5B: gift/danger one-liner (second-person)
  finalLine: string | null; // Layer 5C: closing-of-the-closing (second-person), or null if shape can't produce one
}

export function composeReportCallouts(output: InnerConstitutionOutput): ReportCallouts;
```

**Layer 5A — One-Sentence Summary:**

Lifts from `thesisFor(...)` / THESIS_TEMPLATES — composed as: `"You are a ${shapeDescriptor} whose growth edge is not ${assumedX}, but ${structuralY}."` — exactly the third sentence of the Executive Read.

**Source-of-truth rule:** Reuse the same template logic that produces the Executive Read's third sentence. If `composeExecutiveRead` already exposes a helper that returns just the thesis sentence (e.g., `composeThesisLine(output)`), call that. If it doesn't, extract the thesis-line-only logic into a shared helper so both `composeExecutiveRead` and `composeReportCallouts.summary` consume the same single source of truth. Do NOT duplicate the template strings.

**Render position (markdown):** After the Top Gifts / Top Growth Edges table (Layer 6 below — the table replaces the prior two separate lists). Before "What Others May Experience." Wrapped in a callout blockquote (`> *...*`).

**Render position (React):** Same logical position, wrapped in a callout block matching CC-PROSE-1A's Executive Read styling.

**Layer 5B — Most Useful Line:**

Lifts from `GIFT_DANGER_LINES[dom]` — composed as: `"Your gift is ${gift}. Your danger is ${danger}."` Exactly the first two sentences of the Executive Read.

**Source-of-truth rule:** Reuse `GIFT_DANGER_LINES[dom]` directly; do not duplicate. If `composeExecutiveRead` already exposes the gift/danger line as a helper, reuse it.

**Render position (markdown):** Inside the Synthesis section, after the parallel-line tercet ("To keep a [gift] without [growth edge]..." × 3), before the section's closing thesis sentence. Wrapped in a callout blockquote.

**Render position (React):** Same logical position; same callout styling.

**Layer 5C — Final Line (THE EDITORIAL-JUDGMENT SURFACE):**

Closing-of-the-closing. Mechanically recombines existing components from THESIS_TEMPLATES + GIFT_DANGER_LINES. The composer constructs a 1-2 sentence carry-away line using ONLY:

- `shapeDescriptor` (from `thesisFor`)
- `structuralY` (from `thesisFor`)
- a connector word selected from a tiny closed set: `". Your growth path is to "` / `". The work is to "` / `". Your next move is to "` (executor picks the most coherent connector for each shape; not all three are valid for every shape).

**Canonical Final Line template:**

```
You are a ${shapeDescriptor}. ${connector}${structuralY-as-imperative}.
```

Where `structuralY-as-imperative` is a mechanical transformation of `structuralY` from declarative to imperative voice — e.g., "translating conviction into visible, revisable, present-tense structure" → "translate conviction into visible, revisable, present-tense structure" (drop the "-ing" → infinitive). This is a string transformation, not a rewrite. The composer must do this transformation programmatically, not via case-by-case rewriting.

**HARD GUARDRAIL:** If the shape's `structuralY` does NOT yield a clean imperative through this mechanical transformation (e.g., the structuralY is malformed for the imperative cast, or the resulting sentence reads awkwardly), the composer returns `null` for `finalLine`, and the Final Line callout is skipped for that shape. The render path must handle `null` gracefully (render no final callout). Document gaps where shapes can't produce a clean line in Report Back. **Do NOT fabricate. Do NOT hand-roll per-shape strings. Do NOT add new vocabulary.**

**Source-of-truth rule:** No new strings beyond the closed-set connector words and the mechanical -ing→infinitive transformation. The Final Line is a derivation of existing engine output, not a new authored string.

**Render position (markdown):** End of report, after the existing Closing Read section, after Movement / Disposition / Work Map / Love Map / body cards / Path / Growth Path / Conflict Translation / Mirror-Types Seed / Open Tensions / "What this is good for". Wrapped in a callout blockquote. (Practically: inserted just before the trailing `Generated...` timestamp.)

**Render position (React):** Same logical position; same callout styling. If `finalLine` is null, no callout renders.

**Visual treatment for all three callouts:** Reuse CC-PROSE-1A's Executive Read callout styling — `border-left 3px var(--umber) + bg var(--umber-wash) + padding 14px 18px + border-radius 2` in React; blockquote (`> *...*`) in markdown. Consistent visual language across all callouts in the report.

### Layer 6 — Top Gifts + Growth Edges unified table

**Files modified:** `lib/renderMirror.ts` (replace two existing lists with one table); `app/components/MirrorSection.tsx` (or wherever Top 3 Gifts / Top 3 Growth Edges currently render in React).
**New file (optional):** `app/components/TopGiftsGrowthEdgesTable.tsx` if the table treatment is heavy enough to warrant a dedicated component.

**Replaces:** The current "## Your Top 3 Gifts" + "## Your Top 3 Growth Edges" two-list format.

**New structure: one table:**

| Gift | What it means | Growth edge |
|---|---|---|
| [topGifts[0].label] | [first sentence of topGifts[0].prose] | [topRisks[0].label] |
| [topGifts[1].label] | [first sentence of topGifts[1].prose] | [topRisks[1].label] |
| [topGifts[2].label] | [first sentence of topGifts[2].prose] | [topRisks[2].label] |

**Pairing rule:** `topGifts[i]` paired with `topRisks[i]` from `output.cross_card`. This matches the existing `generateSimpleSummary` parallel-line close pattern ("To keep a discernment gift without integrity becoming rigidity. To keep a pattern-discernment gift without pattern certainty becoming private fact. To keep a costly-conviction gift without conviction becoming over-sacrifice.") — gift index pairs with risk index.

**Audit assertion:** for each fixture, verify that the table's gift→growth-edge pairings match the parallel-line close's pairings exactly. If `cross_card.topGifts` and `cross_card.topRisks` arrays don't pair index-for-index in the existing engine output, surface the gap in Report Back; do NOT invent pairings.

**"What it means" column source:** lift the first descriptive sentence of the gift's existing prose (`output.cross_card.topGifts[i].prose` or equivalent). Compress only if needed for column width — but compression must not introduce new vocabulary; truncate at sentence boundary instead.

**Render style (markdown):** standard markdown table.

**Render style (React):** styled HTML `<table>`. Mobile (<600px): stacks rows vertically — each row collapses to a stacked card showing Gift / What it means / Growth edge as three labeled fields.

**Render position:** Same position the prior two lists occupied combined — after "## Your Core Pattern" and before "## What Others May Experience" (or wherever the prior position was — confirm via the current renderMirror.ts).

**Section heading for the new table:** `## Your Top Gifts and Growth Edges` (replaces `## Your Top 3 Gifts` and `## Your Top 3 Growth Edges`). Possessive form preserved for consistency with neighboring headings ("Your Core Pattern", "Your Next 3 Moves", "Your Top 3 Growth Edges").

**Lens-flavor augmentation line — preserve and reposition.** The current render contains an italic free-floating line BETWEEN the Top 3 Gifts and Top 3 Growth Edges sections for shapes where a Lens-flavor composer fires (e.g., for Ni-dominant shapes: `*Your Lens has an architect quality: you appear to see the future shape first, then look for the practical structures that could carry it.*`). This line is shape-specific engine output produced by a separate Lens-flavor composer; it does not fire for every shape. Layer 6 collapses the two list sections that surrounded it, so the line needs a new position. Render it directly BELOW the unified table (italic, centered if the design system supports it; left-aligned italic otherwise), BEFORE the Layer 5A One-Sentence Summary callout. Do NOT modify the Lens-flavor composer itself; only its rendering position changes.

**Audit assertion for the Lens-flavor line:** add `prose-1b-lens-flavor-line-preserved` — for fixtures where the existing engine output (pre-1B) contained the Lens-flavor italic line between the two lists, the post-1B render must contain that same line below the unified table, before the Layer 5A callout. Verifiable by snapshotting pre-1B output and matching post-1B placement.

### Layer 7 — Three follow-ups absorbed

**Follow-up A: PieChart vs donut decision in PathExpanded.tsx.**

Make a deliberate call in `app/components/PathExpanded.tsx`:

- **Option (a) Keep both** (recommended default): the PieChart's per-slice rank badges add information the donut's center-label doesn't replicate. Document in a code comment why both render.
- **Option (b) Consolidate to donut-only**: remove PieChart; ensure rank badges (or equivalent) render somewhere — possibly inside the donut center-label as a small "1·2·3" sequence, or as separate text below the donut.
- **Option (c) Merge features into one viz**: extend the donut SVG to include rank badges around each segment. More work; only if executor sees a clean implementation.

Document chosen option + rationale in a code comment AND in Report Back. Default to (a) unless the executor sees a strong reason for (b) or (c).

**Follow-up B: Mobile viewport verification.**

During `npm run dev` visual verification, render the canonical Jason fixture's report through both desktop (1440×900) and mobile (375×667 — iPhone 13 mini portrait, the conservative floor) viewports. Confirm:

- Layer 4 Core Signal Map grid degrades to 2 columns × 6 rows (or 1×12 floor) on mobile without horizontal scroll.
- Layer 5 callouts (all three) render readably without overflow on mobile.
- Layer 6 table stacks rows vertically on mobile without horizontal scroll.
- Existing Drive donut viewBox 280×280 with max-width:320px aspect-ratio:1/1 renders correctly.
- Movement chart with halo renders correctly.

Document any visual issues in Report Back. If a mobile breakpoint adjustment is needed, allowed scope here.

**Follow-up C: Halo escalation contingent.**

Visual review the canonical Jason fixture's Movement chart (grip=21) at the current `MOVEMENT_GRIP_HALO_MAX = 28` (post CC-PROSE-1A). If the halo reads acceptably proportional, leave at 28. If still too subtle, bump to 32 (cap). Document the chosen value in Report Back.

### Layer 8 — Audit assertions

**File:** `tests/audit/proseArchitecture.audit.ts`. Add CC-PROSE-1B assertion block:

- `prose-1b-core-signal-map-rendered`: For each fixture, the rendered output contains the Core Signal Map (grid or table) immediately after the Executive Read, before "How to Read This."
- `prose-1b-core-signal-map-12-cells`: For each fixture, the Core Signal Map renders all 12 canonical cells (Driver, Support, Protected value, First blame lens, Surface label, Work map, Love map, Pressure pull, Movement, Direction, Strength, Grip). Empty values render the cell with a blank value rather than skipping.
- `prose-1b-core-signal-map-italic-line`: For each fixture, the canonical italic line ("The useful question is not whether the read is final...") renders below the grid in second-person register.
- `prose-1b-callout-summary-present`: For each fixture, the Layer 5A One-Sentence Summary callout renders after Top Gifts/Edges table, before "What Others May Experience." Second-person register.
- `prose-1b-callout-summary-from-thesis`: The Layer 5A summary is identical to (or a substring of) the Executive Read's third sentence. Confirms single-source-of-truth.
- `prose-1b-callout-most-useful-line-present`: For each fixture, the Layer 5B Most Useful Line callout renders inside the Synthesis section, after the parallel-line tercet. Second-person register.
- `prose-1b-callout-most-useful-line-from-gift-danger`: The Layer 5B callout is identical to (or a substring of) the Executive Read's first two sentences. Confirms single-source-of-truth.
- `prose-1b-callout-final-line-present-or-null`: For each fixture, EITHER the Layer 5C Final Line callout renders at the end of the report (after Closing Read), OR the composer returned null (gap surfaced) for that fixture. Both outcomes are valid.
- `prose-1b-callout-final-line-no-new-vocabulary`: For each fixture where Layer 5C renders, the final line's words are all derivable from the fixture's `shapeDescriptor` + `structuralY` + the closed connector set. No new lexemes introduced. (Implementation hint: tokenize the final line; assert each non-stopword token appears in `shapeDescriptor + structuralY + connectors`.)
- `prose-1b-callouts-second-person`: All three callouts (5A, 5B, 5C where present) use "You" / "Your" voice. No name leaks; no third-person ("this shape is").
- `prose-1b-callouts-visual-consistency`: All three callouts render with the CC-PROSE-1A Executive Read callout treatment (markdown blockquote `>` form; React callout block class).
- `prose-1b-gifts-edges-table-rendered`: For each fixture, the Top Gifts and Growth Edges table renders as a 3-row × 3-column table replacing the prior two separate lists.
- `prose-1b-gifts-edges-table-pairings`: For each fixture, the table's row[i] gift label matches `cross_card.topGifts[i].label` and row[i] growth-edge label matches `cross_card.topRisks[i].label`. Verifies pairing consistency with the parallel-line close.
- `prose-1b-gifts-edges-table-what-it-means-from-prose`: For each fixture and each row, the "What it means" column is a substring (or first-sentence prefix) of the gift's existing prose. Confirms no invented vocabulary.
- `prose-1b-gifts-edges-table-replaces-lists`: For each fixture, the rendered output does NOT contain the prior "## Your Top 3 Gifts" or "## Your Top 3 Growth Edges" headings. The new "## Top Gifts and Growth Edges" heading is present.
- `prose-1b-engine-phrase-preservation`: For each fixture, the engine's canonical phrases preserved by CC-PROSE-1 ("convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read", "let context travel with action", etc., where applicable) still render verbatim post-CC-PROSE-1B. No silent paraphrases.

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, intensity math, or composite consumption.** `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, `computeGoalSoulGive`, `computeMovement`, `computeDriveOutput`, `computeLoveMapOutput` — all untouched.
2. **Do NOT modify CC-PROSE-1 or CC-PROSE-1A canon.** `composeExecutiveRead`, `SHAPE_CARD_QUESTION`, `MOVEMENT_GRIP_HALO_MAX` (except the contingent escalation to 32 in Follow-up C), `generateSimpleSummary` voice, `Pattern in motion` label, callout visual treatment — all stay untouched. CC-PROSE-1B builds on top.
3. **Do NOT remove or compress** Open Tensions, Conflict Translation, Mirror-Types Seed, "What this is good for", body cards (Lens / Compass / Gravity / Trust / Weather / Fire / Conviction / Path), Movement chart, Disposition Signal Mix bar chart, Drive donut, Closing Read. All preserved.
4. **Do NOT remove the engine's hedging language.** "Appears to" / "may" / "tends to" / "suggests" / "likely" — preserved across all card prose. Per `feedback_hedge_density_in_engine_prose`, do NOT add hedges in callouts either; current rate is already 30-47/fixture against a 3-floor.
5. **Do NOT invent new claims.** Layer 4 cells lift from existing engine output (12 source fields named); Layer 5 callouts lift from existing composers (`composeExecutiveRead` thesis line, `GIFT_DANGER_LINES`, mechanical -ing→infinitive transformation); Layer 6 table lifts from existing `cross_card.topGifts` and `cross_card.topRisks`. If a shape doesn't yield clean output, surface the gap rather than fabricate.
6. **Do NOT hand-roll per-shape Final Line strings.** The Layer 5C Final Line composer must be a single mechanical function that works across all 20 fixtures, returning null where the shape doesn't yield a clean recombination. No `if (dom === "Ni") return "..."` cases.
7. **Do NOT introduce new vocabulary in callouts.** All callout text must derive from existing engine output. Audit assertion `prose-1b-callout-final-line-no-new-vocabulary` will catch violations.
8. **Do NOT over-rewrite or paraphrase load-bearing engine phrases.** The "What it means" column in Layer 6 lifts existing prose; truncation at sentence boundary is allowed; rewording is not. Same for Layer 4 cell values — exact-text lifts only.
9. **Do NOT add LLM calls or API integrations.** Engine produces the prose; CC-PROSE-1B is structural / template / visualization work, not LLM territory.
10. **Do NOT modify the masthead** ("a possibility, not a verdict") or "How to Read This" framing.
11. **Do NOT modify section ordering beyond the explicit insertions specified above.** Core Signal Map slots between Executive Read and "How to Read This"; Layer 5 callouts slot at three named positions; Layer 6 table replaces the two existing list sections in place. All other section ordering preserved.
12. **Do NOT change the SVG color palette or design system tokens.** Existing palette (`--umber`, `--umber-wash`, `--ink`, `--ink-soft`, `--ink-mute`, `--cream`, etc.) is canon for everything.
13. **Do NOT modify** the question bank (`data/questions.ts`), fixture files, `MEMORY.md`, `AGENTS.md`, `docs/canon/`, `docs/goal-soul-give-spec.md`, `docs/ocean-disposition-spec.md`, or any spec memo. Surface drift in Report Back.
14. **Do NOT install dependencies.** Layer 4 grid uses native CSS / HTML primitives. Layer 5 callouts reuse CC-PROSE-1A's existing callout component / class. Layer 6 table uses native markdown table syntax / native HTML `<table>`.
15. **Do NOT modify band thresholds, calibration constants beyond the contingent halo escalation, or any architectural piece from CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087.**
16. **Do NOT touch CC-PROSE-1 or CC-PROSE-1A audit assertions.** Existing `prose-1-*` and `prose-1a-*` assertions stay green; CC-PROSE-1B adds new `prose-1b-*` assertions to the same file.
17. **Do NOT modify body card prose (Strength / Growth Edge / Practice / Pattern Note text).** Layer 6 table only touches Top 3 Gifts / Top 3 Growth Edges sections, not the body cards' internal Strength/Growth Edge content.
18. **Do NOT remove the existing Drive distribution prose narrative** ("Your distribution is unusually balanced..." / "You claim X as your top drive..."). The donut renders alongside the narrative, not replacing it (per CC-PROSE-1 canon).
19. **Do NOT change the Synthesis section's parallel-line tercet structure.** Layer 5B inserts a callout AFTER the tercet, not in place of it. The tercet remains canonical engine output.
20. **Do NOT remove or rename the Pattern in motion / Pattern Note distinction** (CC-PROSE-1A canon).

## Acceptance Criteria

1. Layer 4 Core Signal Map renders for every fixture with all 12 canonical cells populated (or empty-with-label for the rare empty source field). Italic line ("The useful question...") below the grid present in second-person register.
2. Layer 5A One-Sentence Summary callout renders for every fixture after the Top Gifts/Edges table, before "What Others May Experience." Second-person; identical to or substring of Executive Read's third sentence.
3. Layer 5B Most Useful Line callout renders for every fixture inside the Synthesis section, after the parallel-line tercet. Second-person; identical to or substring of Executive Read's first two sentences.
4. Layer 5C Final Line callout renders for fixtures where the mechanical recombination yields a clean line; returns null and skips for fixtures that don't. Second-person; no new vocabulary.
5. All three Layer 5 callouts use the CC-PROSE-1A Executive Read callout visual treatment (blockquote in markdown; bordered+tinted block in React).
6. Layer 6 Top Gifts and Growth Edges table renders as 3-row × 3-column. Pairings match `cross_card.topGifts[i]` ↔ `cross_card.topRisks[i]`. "What it means" column lifts from existing gift prose. Replaces the prior two separate list sections.
7. Layer 6 table mobile-stacks rows vertically below 600px viewport without horizontal scroll.
8. Follow-up A: PathExpanded.tsx PieChart vs donut decision documented in code comment AND Report Back. Default to keep both; alternative options allowed if executor sees clean rationale.
9. Follow-up B: Mobile viewport verification completed during `npm run dev`. Layer 4 grid + Layer 5 callouts + Layer 6 table + existing Drive donut + Movement chart all degrade gracefully on mobile.
10. Follow-up C: `MOVEMENT_GRIP_HALO_MAX` value chosen and documented in Report Back (28 retained or escalated to 32).
11. All 17 new CC-PROSE-1B audit assertions pass (16 layer assertions + Lens-flavor line preservation).
12. Existing CC-PROSE-1 + CC-PROSE-1A audit assertions all pass (regression — Layer 1-3 + 1A coherence pass canon preserved).
13. Existing OCEAN audit assertions pass (regression).
14. Existing Goal/Soul/Give audit assertions pass (regression).
15. CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression: all assertions still pass.
16. `npx tsc --noEmit` exits 0.
17. `npm run lint` exits 0.
18. `npm run audit:ocean` exits 0.
19. `npm run audit:goal-soul-give` exits 0.
20. `npx tsx tests/audit/proseArchitecture.audit.ts` exits 0 (CC-PROSE-1 + 1A + 1B assertions all green).
21. `npm run dev` renders correctly on desktop AND mobile viewport.
22. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. **Summary** in 5-8 sentences. State whether all three layers landed cleanly. Name how many of the 20 fixtures yielded a clean Layer 5C Final Line vs how many returned null (gaps surfaced). Name the chosen PieChart-vs-donut option for PathExpanded. Name the chosen `MOVEMENT_GRIP_HALO_MAX` value (28 retained or 32 escalated).

2. **Core Signal Map render samples** — show the rendered 12-cell grid for at least 3 different fixture shapes (canonical Jason / pattern-reader-Knowledge; Soul-leaning fixture e.g., 11-retirement-longing or Michele equivalent; one Goal-leaning balanced fixture). Confirm all 12 cells populated; italic line below the grid present; visual fits the existing palette.

3. **Layer 5 callout render samples** — for at least 3 fixtures, show the rendered text of all three callouts (5A Summary / 5B Most Useful Line / 5C Final Line). Confirm second-person register, no invented claims, sourced from existing composers. For Layer 5C, name fixtures where it rendered vs returned null.

4. **Layer 5C gap analysis** — explicit list of fixtures where Final Line returned null. For each, name what made the mechanical recombination fail (e.g., "structuralY for Ti-dominant shapes ends in a noun phrase that doesn't cast cleanly as imperative"). This is the load-bearing editorial-judgment surface; the gap surface tells us whether the Final Line concept is shippable across the cohort or whether it should be scoped down.

5. **Layer 6 table render samples** — show the rendered table for at least 2 fixtures. Confirm 3-row × 3-column structure, canonical gift→growth-edge pairings match the parallel-line close. For one fixture, confirm mobile stacking renders correctly via mobile-viewport `npm run dev` screenshot or HTML excerpt.

6. **Visual treatment consistency** — confirm Layer 5's three callouts use the CC-PROSE-1A Executive Read callout styling. If executor chose to differentiate any callout's treatment, name which and why.

7. **PathExpanded PieChart vs donut decision** — name chosen option; show the rationale in 2-3 sentences; confirm decision documented as a code comment in PathExpanded.tsx.

8. **Halo calibration final value** — confirm `MOVEMENT_GRIP_HALO_MAX` chosen value. If escalated to 32, name the visual evidence that 28 was insufficient.

9. **Mobile viewport verification notes** — observations from `npm run dev` mobile-viewport rendering. Anything that looks subtly wrong (Core Signal Map cell overflow, callout text wrap awkwardness, table stacking issues, donut size on small screens, Movement chart label overlap) gets named here.

10. **Audit pass/fail breakdown** — including all 16 new CC-PROSE-1B assertions, CC-PROSE-1 + 1A regression (all `prose-1-*` and `prose-1a-*` assertions), CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression, OCEAN + Goal/Soul/Give regression.

11. **Hedging audit** — confirm hedge counts post-1B are within the 30-47/fixture range observed post-CC-PROSE-1. New callouts and table do not add hedges. Do not artificially reduce hedges either; that's a future LLM-prose-layer tuning surface.

12. **React/markdown parity check** — confirm both render paths produce identical Core Signal Map, Layer 5 callouts (3), and Layer 6 table content. Single source of truth via `lib/coreSignalMap.ts` and `lib/composeReportCallouts.ts`.

13. **Engine phrase preservation regression** — confirm canonical engine phrases ("convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read", "let context travel with action", etc.) still render verbatim where they fired pre-1B.

14. **Out-of-scope verification** — git status; explicit confirmation that signal pool, intensity math, composite consumption, fixture data, calibration constants beyond the contingent halo escalation, masthead, body card prose, hedging language, CC-PROSE-1 / CC-PROSE-1A canon, question bank, and spec memos are all untouched.

15. **Spec ↔ code drift** — if `docs/goal-soul-give-spec.md` or `docs/ocean-disposition-spec.md` reference section ordering or render structure that's now stale post-CC-PROSE-1B (Core Signal Map insertion + Layer 6 list-to-table change), flag for a future spec-sync CODEX. Do not edit the specs.

16. **Recommendations for what comes after CC-PROSE-1B** — the Prose track has now closed the original CC-PROSE-1 spec. Potential next moves to flag if cohort feedback after this lands suggests them: (a) the deferred LLM-prose layer per `feedback_marble_statue_humanity_gap` if structural rewrite + visualization upgrades didn't substantially close the warmth gap; (b) hedge-density tuning per `feedback_hedge_density_in_engine_prose` if the 30-47/fixture rate continues to feel clinical; (c) spec-sync CODEX to canonize post-PROSE section ordering. Recommend one as the primary next move based on what the cohort says, or recommend a pause for cohort feedback before queueing further prose work.
