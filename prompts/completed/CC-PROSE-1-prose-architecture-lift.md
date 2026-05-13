# CC-PROSE-1 — Prose Architecture Lift (Executive Read + Card Format + Viz Upgrades)

**Origin:** Three independent LLM rewrites of engine output (Jason 2026-05-07; JDrew 2026-05-07; Michele 2026-05-08) converged on the same set of prose-architecture improvements over the engine's current render. The patterns survive across three very different shapes (long-arc pattern-reader; present-tense room-reader; possibility-driven caregiver), which is the empirical confirmation that the improvements generalize rather than fitting one user. CC-PROSE-1 lifts the three patterns that earned their keep across all three rewrites into engine prose templates, while preserving the differentiated features (Tensions, Conflict Translation, Mirror-Types Seed, What This Is Good For) that the LLM rewrites consistently dropped because they're scaffolding for *living with* the read over time, not for *reading it once*.

**Method discipline:** Engine prose, not LLM at production time. The signal-grounding canon ("every claim grounded in signals; engine-words forbidden in user-facing prose") stays load-bearing. CC-PROSE-1 is structural / template / visualization work — not LLM-rewrite-as-render-layer. The deferred LLM-prose layer (per `feedback_marble_statue_humanity_gap`) remains deferred until cohort + signal-foundation work fully closes; this CC moves the engine prose closer to that target without crossing into LLM territory.

**Scope frame:** Six positive refactors + three preservation rules. Touches React (`app/components/`) and the markdown render path. ~6-8 hours executor time. CC-scale because there's editorial judgment in the question-framing canon, the callout selection, and visualization design choices.

**Update note:** v1 of this CC named three positive refactors. After review of JDrew's PDF rewrite (third LLM data point), three additional patterns were folded in: Core Signal Map (6-cell grid), Pulled-Forward Callouts (three short callout blocks at different depths), and Top Gifts + Growth Edges as a unified table. All six refactors are structural lifts of existing engine content into more usable formats — no new claims are introduced.

**Project memory context:** `feedback_marble_statue_humanity_gap` (warmth gap deferred to LLM layer); `project_engine_prose_round_2_evidence` (CC-025 evidence base on ShapeCard structure); `feedback_coherence_over_cleverness` (post-architecture priority); `feedback_minimal_questions_maximum_output` (do more with existing signals); `feedback_synthesis_over_contradiction` (synthesis reads where evidence supports them).

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass with three coordinated layers. **Layer 1 (Executive Read):** new top-of-report block lifted from the existing Synthesis composer; surfaces forward in both markdown and React. **Layer 2 (Body Card refactor):** each ShapeCard adopts the Question / Read / Strength / Growth Edge / Practice structure; the `question` field becomes a per-card load-bearing element. **Layer 3 (Visualization upgrades):** Movement chart gets a dashed-circle Gripping Pull encoding around the endpoint; Drive distribution promotes from text-only to a donut SVG.

Both render paths (markdown / React) must stay synchronized — adopt the CODEX-073 / CODEX-074 lesson: shared composers in `lib/`, consumed by both renderers. Don't inline-edit strings in two places.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `npm run dev` (visual verification only)
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `app/components/InnerConstitutionPage.tsx` — the React render path. Confirm the section ordering and how the markdown sibling renderer (likely in `lib/`) is structured. CODEX-073 / CODEX-074 added Closing Read + Movement + Disposition Signal Mix React parity — follow that pattern.
2. `app/components/ShapeCard.tsx` — current body-card component. Identify the type signature; this is the load-bearing target for Layer 2.
3. `lib/goalSoulMovement.ts` — current Movement chart SVG renderer. Layer 3 first half lives here.
4. `lib/drive.ts` — Drive distribution computation. Locate the current text rendering of distribution; Layer 3 second half lives here (or a new `lib/driveDistributionChart.ts`).
5. `lib/identityEngine.ts` — `buildInnerConstitution` and the Synthesis composer. Layer 1 lifts text from the Synthesis section's parallel-line close.
6. Wherever the markdown render path lives (likely `lib/render.ts`, `lib/composeReport.ts`, or similar — confirm via grep for "## Core Pattern" or "Synthesis" string fragments).
7. Three reference rewrites: `Jason_Inner_Constitution_Report` (productive-NE Goal-leaning), `JDrew_Inner_Constitution_Report` (balanced Goal-leaning), `Michele_Inner_Constitution_Report` (Soul-leaning). Files may be in `prompts/` or attached to the conversation; if not present, the three patterns are documented inline below. Used as design references for the three lifts.
8. `docs/goal-soul-give-spec.md` and `docs/ocean-disposition-spec.md` — confirm any spec language that constrains the Executive Read or Question-framing canon.

## Allowed to Modify

### 1. Layer 1 — Executive Read block

**File:** `lib/identityEngine.ts` (or `lib/composeReport.ts` / equivalent — wherever the report sequence is composed). Plus consumer in markdown render and `app/components/InnerConstitutionPage.tsx`.

**What:** A new top-of-report section, rendered immediately after the masthead ("a possibility, not a verdict") and before "How to Read This." Contains 2–3 sentences distilling the entire report. Sources from the existing Synthesis section's load-bearing one-liners (the "Your gift is X. Your danger is Y." parallel-line close, plus the synthesizing one-line shape description).

**Composer signature:**

```ts
function composeExecutiveRead(output: InnerConstitutionOutput): string {
  // Returns 2-3 sentences. Pulls from:
  //   - The Synthesis section's parallel-line close (gift / danger one-liner).
  //   - The shape's one-line characteristic move
  //     (e.g., "led by the pattern-reader, supported by the structurer").
  //   - The growth-task headline (single sentence; what the next move is).
}
```

**Render rule:** The Executive Read uses second-person register (per existing engine canon — "your gift is the long read" not "Jason's gift is the long read"). Keep all existing engine hedging language ("may" / "appears to" / "tends to" / "suggests"). Do NOT invent new claims; lift from existing composer outputs. If the synthesis composer doesn't currently produce a clean one-liner for a given shape, surface the gap in Report Back rather than inventing.

**Example (Jason shape, illustrative — do not hardcode):**

> *Yours is a long-arc pattern-reader supported by a structurer, organized around Knowledge. Your gift is the long read; your danger is believing the long read too early. The next move is not more output — it is letting the structure you build become visibly generous.*

### 2. Layer 2 — Body Card structure refactor (Question / Read / Strength / Growth Edge / Practice)

**Files:** `app/components/ShapeCard.tsx`; the `ShapeCardOutput` (or equivalent) type in `lib/types.ts`; the markdown card composer.

**What:** Each ShapeCard adopts a refined structure with the **Question** as a leading element. Existing fields (Strength / Growth Edge / Practice / Pattern observation) are preserved; the Read is promoted out of the Strength prose and given its own line; the Question becomes the card's stated purpose.

**New ShapeCard structure:**

```
[Card Name] — [Body Part]
Question: [How you read reality / What you protect first / etc.]
Read: [The user-specific shape line]
Strength: [Existing strength text]
Growth Edge: [Existing growth-edge text]
Practice: [Existing practice text]
[Pattern observation, if present]
```

**Canonical Question strings (per card):**

| Card | Question |
|---|---|
| Lens — Eyes | *How you read reality* |
| Compass — Heart | *What you protect first* |
| Gravity — Spine | *Where responsibility lands* |
| Trust — Ears | *Whose truth gets weight* |
| Weather — Nervous System | *Current load and formation context* |
| Fire — Immune Response | *Pressure response* |
| Conviction — Voice | *How belief behaves under cost* |
| Path — Gait | *Work, love, and giving direction* |

**Render style:** "Question:" prefix renders as italicized subhead under the card title (not as a literal "Question:" label — that's clinical). Markdown renders as `*How you read reality*` directly under the card heading. React renders with appropriate styling.

**Read line:** Lifted from the existing card's first descriptive sentence. For Lens: "Possibility-finder, supported by the room-reader" or "Pattern-reader, supported by the structurer." Tight, present-tense. The Read is the card's user-specific answer to the Question — should fit on one line.

### 3. Layer 3a — Movement chart Gripping Pull dashed circle

**File:** `lib/goalSoulMovement.ts` (or wherever `renderMovementSVG` lives).

**What:** When `grippingPull > 0`, the Movement chart renders a dashed circle centered on the line's endpoint, with radius scaled to gripping pull magnitude. Visually encodes drag without requiring the reader to consult a separate text bullet.

**Implementation:**

- Radius formula: `radius = grippingPull / 100 * MOVEMENT_DASHED_CIRCLE_MAX` where `MOVEMENT_DASHED_CIRCLE_MAX` is calibrated so a Gripping Pull of 35 (Michele) renders a visually-meaningful circle but doesn't dominate the chart, and Gripping Pull of 80 renders a clearly oversized drag halo.
- Stroke style: `stroke-dasharray="3 3"` (matching existing reference dashes); same #8b6f47 brown as the line; opacity ~0.5 so it reads as a halo not a competing element.
- Render order: circle drawn AFTER the line and endpoint dot so it overlays; or BEFORE so the dot/line are crisp on top — whichever renders cleaner visually.
- Skip when `grippingPull === 0` (e.g., JDrew's render — no circle, clean line).

**Existing Gripping Pull text bullets stay** (e.g., "Grips control under pressure"). The chart visualization is additive, not replacing the named-grips list.

### 4. Layer 4 — Core Signal Map (6-cell grid)

**File:** `lib/coreSignalMap.ts` (new) for the composer; consumed by markdown render and React.

**What:** A high-density at-a-glance visual that renders immediately after the masthead and Executive Read. Twelve labeled cells in a 3x4 (or 4x3) grid, each containing one short label. The reader sees the entire shape's skeleton — cognitive, value, motivational, and movement — in one image before reading prose.

**Twelve cells (canonical):**

| Cell | Source | Example value |
|---|---|---|
| Driver | Lens dominant function (cognitive style label) | "Pattern-reader" / "Present-tense self" / "Possibility-finder" |
| Support | Lens auxiliary function (the carrier) | "Structurer" / "Room-reader" |
| Protected value | Top-1 Compass value | "Knowledge" / "Compassion" / "Family" |
| First blame lens | Top-1 Gravity weighting | "Individual" / "System" / "Authority" |
| Surface label | MBTI / type label, marked provisional | "INTJ, provisional" / "ENFP, provisional" |
| Work map | Work Map composite label | "Strategic / Architectural" / "Caring / Direct-Service" |
| Love map | Love Map flavor label | "The Companion" / "The Devoted Partner" / "The Parental Heart" |
| Pressure pull | Top 3 Gripping Pull named grips | "Control, security, being right" |
| Movement | Goal / Soul tuple | "Goal 88 / Soul 53" |
| Direction | Angle + leaning label | "31°, Goal-leaning" |
| Strength | Movement Strength + length descriptor | "72.6, long" |
| Grip | Gripping Pull score | "21 / 100" |

**Composer signature:**

```ts
function renderCoreSignalMap(output: InnerConstitutionOutput): string;
```

Returns SVG (or HTML grid for accessibility — pick whichever renders cleaner across both render paths). Must be readable at standard report width and degrade gracefully on mobile.

**Visual design:** Use the existing cream + brown palette. Each cell has a thin brown border, cream interior, label-on-top style. Cell label small font (e.g., 11px); value larger font (e.g., 14px). Render under the Executive Read, before "How to Read This."

**Below the grid:** A single italic line, also lifted from existing engine output: "The useful question is not whether the read is final. It is whether it helps [you] become more grounded, more legible, and more free." (Second-person register; engine canon.)

### 5. Layer 5 — Pulled-Forward Callouts (3 callout blocks)

**Files:** Multiple — each callout sits in a different existing section. New helper `composeReportCallouts(output)` returns the three strings; consumed by the markdown render and React in the appropriate sections.

**Three callouts, distinct jobs:**

**Callout A — One-Sentence Summary.** Renders inside a new "Executive Summary" wrapper block (not the Executive Read at top — this is mid-report, after Top Gifts). Single sentence describing the user's shape with growth-edge frame:

> *Example (Jason): "[You are] a long-arc pattern reader and builder whose growth edge is not caring more, but translating conviction into visible, revisable, present-tense structure."*

> *Example (JDrew): "[You are] a present-tense, compassion-protecting builder whose growth edge is not thinking more, but holding the long read beside the immediate one."*

This is the Synthesis composer's *one-sentence* shape descriptor. The engine already produces these; surface them in a callout.

**Callout B — Most Useful Line.** Renders inside the Synthesis section as a highlighted block, after the parallel-line tercet. The literal gift/danger one-liner:

> *Example (Jason): "Your gift is the long read. Your danger is believing the long read too early."*

> *Example (JDrew): "Your gift is present-tense response. Your danger is present-tense response without long enough context."*

The engine's parallel-line close already produces this; promote it from inline prose into a callout.

**Callout C — Final Line.** Renders at the very end of the report, after Closing Read, in a callout block. Distillation-of-the-distillation:

> *Example (JDrew): "[You are] a present-tense, compassion-protecting builder. Your growth path is to keep the immediacy, but give it enough context to become wisdom."*

This is the closing-of-the-closing: a single sentence (sometimes two) that the reader can carry away. Sourced from the existing Closing Read and Synthesis composers.

**Render rule:** All three callouts are second-person ("you" / "your") matching the rest of the report. The callout block visual style is consistent across all three (e.g., a thin border or background tint that distinguishes from body prose without being decorative). React and markdown render paths use the same composer.

**Source-of-truth rule:** The callouts lift from existing composer outputs. If a particular shape's existing engine prose doesn't yield a clean one-liner for a given callout, surface the gap in Report Back; do NOT invent.

### 6. Layer 6 — Top Gifts + Growth Edges as a unified table

**Files:** Markdown render path; `app/components/InnerConstitutionPage.tsx`; possibly a new component like `TopGiftsGrowthEdgesTable.tsx`.

**What:** Replace the current "Top 3 Gifts" + "Top 3 Growth Edges" two-list format with a unified 3-row × 3-column table. Each row pairs a gift with its growth-edge cousin and adds a "what it means" middle column.

**Table structure:**

| Gift | What it means | Growth edge |
|---|---|---|
| [Gift name 1] | [Short prose explaining the gift in lived terms] | [Paired growth-edge phrase] |
| [Gift name 2] | [Short prose] | [Paired growth-edge phrase] |
| [Gift name 3] | [Short prose] | [Paired growth-edge phrase] |

**Pairing rule:** The engine currently produces the gifts and growth edges separately, both from the synthesis layer. The pairing should match the existing gift→growth-edge mapping the parallel-line close already uses (e.g., "discernment gift → integrity becoming rigidity"; "pattern-discernment gift → pattern certainty becoming private fact"; "costly-conviction gift → conviction becoming over-sacrifice"). If the existing mapping isn't 1:1 explicit in the engine, surface the gap; do NOT invent pairings.

**What it means column:** Lifted from the existing gift prose's first descriptive sentence. For example, a "discernment gift" with prose "You tend to detect what doesn't add up before it surfaces openly" — the "what it means" column reads "She/he detects mismatch before it surfaces openly: the sentence that does not fit, the motive that is slightly off." Use existing prose; compress only if needed for column width.

**Render style:** Markdown table. React renders as a styled HTML table. Width: full report column. Mobile graceful: stacks rows vertically below ~600px viewport.

**Source-of-truth rule:** Lift from existing gift + growth-edge composers. If a gift doesn't have a paired growth edge in the engine output, document the gap; don't invent.

### 3b. Drive distribution donut chart

**File:** New `lib/driveDistributionChart.ts` for the SVG composer; consumed by markdown render and React.

**What:** Promote the Drive distribution from a text-only "Distribution: Building & wealth 33%, People, Service & Society 35%, Risk and uncertainty 32%" to a donut chart with three labeled segments and a centered "Claimed #1: [bucket]" annotation.

**Composer signature:**

```ts
function renderDriveDistributionDonut(
  distribution: { cost: number; coverage: number; compliance: number },
  claimedTopBucket: "cost" | "coverage" | "compliance"
): string;
```

**Visual design:**

- SVG donut, ~280x280 viewBox.
- Three segments, color-coded:
  - Building & Wealth (cost): brown `#8b6f47` (matches existing dashboard accent).
  - People, Service & Society (coverage): warm tan `#a99372` (lighter brown, harmonious with the design palette).
  - Risk & Uncertainty (compliance): muted dust `#7a6850` (darker brown).
- Each segment labeled with its bucket name + percentage outside the donut.
- Center label: "Claimed #1: [bucket name]" in two lines, small font.
- All colors must fit the existing cream + brown design system (see `lib/oceanDashboard.ts` for palette reference).

**Existing distribution text bullet stays** (the engine's prose narrative around the donut is load-bearing). Donut renders alongside the existing narrative ("Your distribution is unusually balanced..." or "You claim X as your top drive, and your revealed distribution agrees..."), not replacing it.

### 4. Audit assertions

**File:** `tests/audit/oceanDashboard.audit.ts` and/or `tests/audit/goalSoulGive.audit.ts` (whichever covers the render path tested).

Add CC-PROSE-1 assertion block:

- `prose-1-executive-read-present`: For at least 3 fixtures (Jason, JDrew/equivalent, Michele/equivalent shapes), the rendered report contains an Executive Read block immediately after the masthead, before "How to Read This."
- `prose-1-executive-read-second-person`: Executive Read uses second-person register ("your" / "you"); does NOT contain the user's literal name.
- `prose-1-card-question-prefix`: For each of the 8 body cards, the rendered output contains the canonical Question string in italics under the card heading.
- `prose-1-card-read-line-present`: Each body card has a "Read:" line (or italicized first-line equivalent) before Strength.
- `prose-1-movement-grip-circle`: For fixtures where `grippingPull > 0`, the Movement SVG output contains a `<circle ... stroke-dasharray=...>` element. For fixtures where `grippingPull === 0`, no dashed circle is rendered.
- `prose-1-drive-donut-rendered`: Path/Drive section of the report contains the donut chart SVG. Donut SVG includes 3 segments and a "Claimed #1" center label.
- `prose-1-tensions-preserved`: Open Tensions section is still present in the rendered output (regression — not removed).
- `prose-1-conflict-translation-preserved`: Conflict Translation section is still present.
- `prose-1-mirror-types-preserved`: Mirror-Types Seed section is still present.
- `prose-1-use-cases-preserved`: "What this is good for" section with the 10 use-cases is still present.
- `prose-1-hedging-preserved`: Sample 5 random fixtures' rendered prose; assert each contains at least 3 instances of hedging language ("appears to" / "may" / "tends to" / "suggests" / "likely"). Confirms declarative-overstatement creep is absent.
- `prose-1-react-markdown-parity`: The React render path's `InnerConstitutionPage.tsx` renders the same Executive Read block, same Question prefix on cards, same Movement chart with grip circle, same Drive donut. Single source of truth (composers in `lib/`); both consumers should produce identical content.
- `prose-1-core-signal-map-rendered`: Report contains a 6-cell Core Signal Map block under the Executive Read, with all six cells (Driver / Instrument / Protects / Responsibility / Work Map / Love Map) populated with non-empty values. Italic line below the grid present.
- `prose-1-callout-one-sentence-summary`: Report contains an Executive Summary wrapper block with a single-sentence shape descriptor in second-person register.
- `prose-1-callout-most-useful-line`: Synthesis section contains the gift/danger one-liner in a callout block.
- `prose-1-callout-final-line`: Report ends with a Final Line callout after Closing Read; second-person register; lifted from Closing Read or Synthesis composer.
- `prose-1-callouts-no-invented-claims`: For each callout, the rendered text is verifiable against existing composer output. (Implementation hint: the composers should expose the source string they lifted from; the audit confirms the callout is a substring or near-paraphrase.)
- `prose-1-gifts-growth-edges-table`: Top Gifts and Growth Edges renders as a 3-row × 3-column table (or stacked equivalent on mobile) instead of two separate lists. Each row pairs a gift with its growth edge and includes a "what it means" middle column.
- `prose-1-gifts-table-pairings-canonical`: The gift→growth-edge pairings in the table match the parallel-line close's existing pairings (e.g., "discernment gift" pairs with "integrity becoming rigidity"). Audit verifies pairing consistency.
- `prose-1-engine-phrase-preservation`: For each fixture, sample the rendered output for the engine's canonical phrases that should be preserved verbatim ("convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read", "let context travel with action", etc., per which fire for that fixture). Each canonical phrase that the pre-CC-PROSE-1 render contained must still be present verbatim post-CC-PROSE-1. No silent paraphrases.
- `prose-1-core-signal-map-12-cells`: Core Signal Map renders all 12 canonical cells (Driver / Support / Protected value / First blame lens / Surface label / Work map / Love map / Pressure pull / Movement / Direction / Strength / Grip). Empty values render the cell with blank value rather than skipping the cell.

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, intensity math, or composite consumption.** This is pure prose / template / visualization work. `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, `computeGoalSoulGive`, `computeMovement`, `computeDriveOutput`, `computeLoveMapOutput` all stay untouched.
2. **Do NOT remove or compress** the Open Tensions, Conflict Translation, Mirror-Types Seed, or "What this is good for" sections. The LLM rewrites compressed these because they were optimizing for read-once narrative; the engine's job is read-and-return-to. All four stay verbatim, in their existing positions.
3. **Do NOT remove the engine's hedging language.** "Appears to" / "may" / "tends to" / "suggests" / "likely" / "this is conditional, not declarative" — these protect the user from over-identifying with the read and protect the report from overclaiming. The masthead's "a possibility, not a verdict" framing depends on this hedging. If a refactored card prose loses hedge words, restore them.
4. **Do NOT invent new claims.** The Executive Read pulls from the existing Synthesis composer; the Read line on each card lifts from existing card prose. If the existing engine output for a given shape doesn't contain a clean one-liner that fits the Executive Read role, document the gap in Report Back; do NOT have the engine fabricate.
4b. **Do NOT over-rewrite or paraphrase load-bearing engine phrases.** When the engine's existing prose contains a canonical phrase ("convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read", "let context travel with action", etc.), CC-PROSE-1 preserves that phrase verbatim. The discipline cuts both ways: do not invent new prose, AND do not substitute paraphrases for engine-canon phrases. Promotion (lifting a phrase out of inline prose into a callout) is allowed and encouraged; rewording is not.
5. **Do NOT rewrite the engine's existing card prose.** Strength, Growth Edge, Practice, Pattern observation stay verbatim. The refactor is structural (adding Question + Read on top, repositioning) — not editorial.
6. **Do NOT introduce LLM calls or API integrations.** Per Jason's stated preference, no production-time LLM. The engine produces the prose; this CC just restructures and visualizes it better.
7. **Do NOT modify band thresholds, `INTENSITY_K`, calibration constants, or any architectural piece from CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087.** Those are canon; this CC builds on top.
8. **Do NOT modify the question bank** (`data/questions.ts`).
9. **Do NOT install dependencies.** Use existing SVG primitives for the donut and dashed circle — no chart libraries (Recharts, Chart.js, D3, Plotly are NOT to be added). Hand-rolled SVG matches the existing engine convention.
10. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, `docs/canon/`, `docs/goal-soul-give-spec.md`, `docs/ocean-disposition-spec.md`, or any spec memo. Document drift in Report Back.
11. **Do NOT touch fixture files.** Visualization changes affect render output, not fixture inputs.
12. **Do NOT change the masthead** ("a possibility, not a verdict") or "How to Read This" framing. The Executive Read block sits between them.
13. **Do NOT change the section ordering** beyond inserting the Executive Read block. Existing sequence (Core Pattern → Top 3 Gifts → Top 3 Growth Edges → What Others May Experience → When the Load Gets Heavy → Your Next 3 Moves → Keystone Reflection → Synthesis → Closing Read → Movement → Disposition Signal Mix → Work Map → Love Map → Body Cards → Path → Growth Path → Conflict Translation → Mirror-Types Seed → Open Tensions → What this is good for) stays intact.
14. **Do NOT change the SVG color palette** beyond the donut chart's three brown variants. The existing brown `#8b6f47` and cream `#ede4d3` stay canon for everything else.

## Acceptance Criteria

1. Executive Read block renders at the top of every report, immediately after the masthead, before "How to Read This." Contains 2–3 sentences in second-person register, sourced from the existing Synthesis composer. Does NOT invent claims.
2. Each of the 8 body cards renders with the canonical Question string italicized under the card title.
3. Each body card has a Read line (lifted from existing prose) before the Strength block.
4. Strength / Growth Edge / Practice / Pattern observation prose stays verbatim across all cards (regression — only structure refactored, not content).
5. Movement chart SVG renders a dashed circle around the endpoint when `grippingPull > 0`, sized proportionally to grip magnitude. No circle when `grippingPull === 0`.
6. Drive distribution renders a donut SVG with 3 color-coded segments and a centered "Claimed #1: [bucket]" label, in addition to the existing prose narrative.
7. Open Tensions, Conflict Translation, Mirror-Types Seed, and "What this is good for" all still render in their existing positions.
8. React (`InnerConstitutionPage.tsx`) and markdown render paths produce identical Executive Read, body card structure, Movement chart, and Drive donut content (single-source-of-truth via `lib/` composers).
9. Hedging language preserved across all card prose; sample audit confirms ≥3 hedge phrases per 5-fixture sample.
10. All 12 new CC-PROSE-1 audit assertions pass.
11. Existing OCEAN audit assertions pass (regression — math fundamentals untouched).
12. Existing Goal/Soul/Give audit assertions pass (regression — composite consumption untouched).
13. CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression: all assertions still pass.
14. `npx tsc --noEmit` exits 0.
15. `npm run lint` exits 0.
16. `npm run audit:ocean` exits 0.
17. `npm run audit:goal-soul-give` exits 0.
18. `npm run dev` renders a visually-correct report (manual visual verification step; not automatable but should be confirmed).
19. `git status --short` shows only Allowed-to-Modify files.
20. Core Signal Map renders for every fixture with all six cells populated; italic line below the grid present.
21. Three callouts (One-Sentence Summary / Most Useful Line / Final Line) render in their canonical positions for every fixture; all three in second-person register; all three sourced from existing composers (no invented claims).
22. Top Gifts and Growth Edges renders as a unified table with canonical gift→growth-edge pairings; mobile stacking works correctly.

## Report Back

1. **Summary** in 5–8 sentences. State whether all three layers landed cleanly or whether any required scope adjustment.
2. **Executive Read examples** — show the rendered Executive Read for at least 3 different shapes (Jason productive-NE, Michele Soul-leaning, JDrew/equivalent balanced). Confirm second-person, no invented claims, hedge language preserved. If any shape's Synthesis composer didn't yield a clean one-liner for the Executive Read role, name which shape and what the gap looks like.
3. **Body card structure samples** — show the rendered output for 2 cards (e.g., Lens and Compass) for one fixture. Confirm Question / Read / Strength / Growth Edge / Practice format with hedge language preserved.
4. **Movement chart screenshots / SVG snippets** — for one fixture with grippingPull > 0 (Michele or Jason) and one with grippingPull === 0 (JDrew or equivalent). Visually confirm the dashed circle behaves correctly.
5. **Drive donut SVG snippet** — show the rendered donut for one fixture. Confirm three segments, color-coded, centered "Claimed #1" label.
6. **React / markdown parity check** — confirm both render paths produce identical content for the four new structural pieces. If parity required refactoring shared composers into `lib/`, list which files moved.
7. **Preservation regression** — explicit confirmation that Tensions, Conflict Translation, Mirror-Types Seed, and "What this is good for" all render in their existing positions for sample fixtures. Sample one per shape (3 total).
8. **Hedging audit** — sample 5 fixtures' card prose; report the count of hedge phrases per fixture. Floor: ≥3.
9. **Audit pass/fail breakdown** — including all 12 new CC-PROSE-1 assertions, CC-AS / CC-JX / CC-ES regression, CODEX-086 / CODEX-087 regression, existing OCEAN + Goal/Soul/Give regression.
10. **Visual verification notes** — observations from `npm run dev` rendering. Anything that looks subtly wrong (donut color clash, dashed circle too large/small, Executive Read overflow on mobile, etc.) gets named here.
11. **Spec ↔ code drift** — if `docs/goal-soul-give-spec.md` or `docs/ocean-disposition-spec.md` reference section ordering or render structure that's now stale post-CC-PROSE-1, flag for spec-sync CODEX. Do not edit the specs.
12. **Out-of-scope verification** — git status; explicit confirmation that signal pool, intensity math, composite consumption, fixture data, calibration constants, masthead, and section ordering (beyond Executive Read insertion) are all untouched.
13. **Core Signal Map render samples** — for at least 3 different fixture shapes, show the rendered 6-cell grid. Confirm all six cells populated; italic line under the grid present; visual fits the existing palette.
14. **Callout render samples** — for at least 3 fixtures, show the rendered text of all three callouts (One-Sentence Summary / Most Useful Line / Final Line). Confirm second-person register, no invented claims, sourced from existing composers.
15. **Top Gifts table render sample** — show the rendered table for at least 2 fixtures. Confirm 3-row × 3-column structure, canonical gift→growth-edge pairings match the parallel-line close, mobile stacking renders correctly.
16. **Recommendations for CC-PROSE-2 (if warranted)** — if cohort feedback after this lands suggests further prose moves (e.g., the LLM-prose layer per `feedback_marble_statue_humanity_gap`), name the specific candidates and why. If CC-PROSE-1 substantially closes the warmth gap, name that as the empirical case for the deferred LLM layer staying deferred.
