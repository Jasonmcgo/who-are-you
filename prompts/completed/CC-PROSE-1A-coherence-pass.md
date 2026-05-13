# CC-PROSE-1A — Prose Track Coherence Pass

**Origin:** CC-PROSE-1 (Layers 1-3) shipped 2026-05-08 — Executive Read + per-card Question prefix + Movement halo + Drive donut. Cohort visual review of the rendered output (canonical Jason and present-tense Jason fixtures) surfaced four coherence gaps that should close before CC-PROSE-1B (Layers 4-6: Core Signal Map / Pulled-Forward Callouts / Gifts+Edges table) builds on them. Per `feedback_coherence_over_cleverness`: close coherence first.

**Four gaps:**
1. **Visual distinctness** — Executive Read renders as just-another-italic-`##`-section; per-card Question line is italic and visually collides with the italic user-specific Read line directly below it. The structural change from CC-PROSE-1 is mechanically present but the visual signal is too subtle to register on first read.
2. **Halo calibration too conservative** — at the canonical Jason's grip=21, halo radius is ~3% of plot diameter with `MOVEMENT_GRIP_HALO_MAX = 20`. Effectively invisible.
3. **Synthesis composer voice drift** — Synthesis closes with "this shape is..." (third-person) where Executive Read says "you are..." (second-person). In some fixtures, Synthesis prose leaks the user's literal name ("Jason's shape reads as...", "What Jason protects..."). Two voice modes in the same composer slot, eight inches apart on the page.
4. **"Pattern Note" vs "Pattern observation" label collision** — both fire on cards (Lens, Compass, Path-body) and the labels are similar enough to read as variants of the same thing rather than as distinct outputs from CC-022 (canonical card-closer) and CC-029 (pattern catalog).

**Method discipline:** Mechanical to light-judgment work. No new claims, no new layers, no new composers. Visual-wrapper changes (CSS / markdown formatting) + a calibration-constant bump + a composer voice fix + a label rename. The signal-grounding canon stays load-bearing — content unchanged, only how it's wrapped/labelled changes.

**Scope frame:** Four targeted fixes. ~2-3 hours executor time. CC-scale because the visual treatment carries some judgment, not because the work is architecturally heavy.

**Project memory context:** `project_cc_prose_track_status.md` (Layers 4-6 queued; three open follow-ups identified during CC-PROSE-1); `feedback_coherence_over_cleverness` (close coherence gaps before stacking cleverness); `feedback_marble_statue_humanity_gap` (warmth gap deferred to LLM layer); `feedback_hedge_density_in_engine_prose.md` (hedge rate currently 30-47 per fixture against 3-floor — do not add hedges).

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass with four targeted fixes.

**Fix 1 (visual distinctness):** Treat Executive Read as a summary callout (blockquote in markdown; bordered/tinted block in React) — not another italic `##` section. Treat per-card Question line as visually distinct from the italic Read line below it (bold-non-italic in markdown; non-italic small-caps or uppercase-tracked in React).

**Fix 2 (halo calibration):** Bump `MOVEMENT_GRIP_HALO_MAX` from 20 to 28. Verify visual proportion at grip=21 / 35 / 80 via `npm run dev`. If 28 still reads too subtle for grip=21, escalate to 32 (cap).

**Fix 3 (Synthesis voice cleanup):** The Synthesis composer's prose must use second-person consistently. Eliminate any branch that produces `"${name}'s shape reads as..."`, `"What ${name} protects..."`, `"${name} is a..."`, or `"This shape is a..."`. Replace with `"Your shape..."`, `"What you protect..."`, `"You are a..."`. The Executive Read (`composeExecutiveRead` from CC-PROSE-1) is already second-person; Synthesis must match.

**Fix 4 (label rename):** Rename the CC-029 pattern catalog output's user-facing label from "Pattern observation" to a distinct string (recommend "Pattern in motion", "Lived pattern", "Pattern at work", or "Shape in practice" — executor picks, document choice). Preserve "Pattern Note" as the existing CC-022 canonical card-closer label.

Both render paths (markdown / React) stay synchronized. Shared composers in `lib/`, consumed by both renderers.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npm run dev` (visual verification)
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/identityEngine.ts` — confirm `composeExecutiveRead` (Layer 1 canon from CC-PROSE-1). Identify the Synthesis composer (likely `composeSynthesisSection`, `synthesizeFor`, `synthesisFor`, or similar — confirm via grep on "Your shape reads as" / "shape reads as" / "This shape is"). Both compositions live here; the Synthesis composer is what's drifting voice. Note: per `project_name_resolver_import_cycle`, name resolution may go through `getUserName` or `findName` — be aware of which helper is in play in each composer.
2. `lib/renderMirror.ts` — markdown render path for Executive Read (per CC-PROSE-1) and per-card Question prefix. Identify how the Question prefix is currently emitted (italic via `*...*`).
3. `lib/cardAssets.ts` — `SHAPE_CARD_QUESTION` map. Strings stay verbatim; only the rendering wrapper changes.
4. `app/components/MirrorSection.tsx` — React Executive Read block (per CC-PROSE-1).
5. `app/components/ShapeCard.tsx` — React `<CardQuestion>` component (per CC-PROSE-1) and the existing italic Read line (the user-specific `cardHeader` text).
6. `lib/goalSoulDashboard.ts` — `MOVEMENT_GRIP_HALO_MAX` constant (currently 20).
7. CC-029 pattern catalog: grep for `"Pattern observation"` to locate the composer that emits this label. The composer (likely `lib/patternCatalog.ts` or a similar path) is the rename target. Confirm whether the label is a single hardcoded string or pulled from a constant.
8. `tests/audit/proseArchitecture.audit.ts` — existing CC-PROSE-1 audit harness; CC-PROSE-1A adds new `prose-1a-*` assertions to this file.

## Allowed to Modify

### Fix 1 — Visual distinctness (Executive Read + per-card Question)

**Files:** `lib/renderMirror.ts` (markdown); `app/components/MirrorSection.tsx` (Executive Read React); `app/components/ShapeCard.tsx` (Question React).

**What — Executive Read:**

- **Markdown:** Wrap the prose in a blockquote (`>`) with the existing italics inside, so the block is visually offset from neighboring prose:
  ```
  ## Executive Read
  
  > *Your gift is the long read. Your danger is believing the long read too early. You are a long-arc pattern reader and builder whose growth edge is not caring more, but translating conviction into visible, revisable, present-tense structure.*
  ```
- **React:** Wrap the Executive Read prose in a callout block — `border-l-4 border-amber-900/30` + `bg-amber-50/50` (or palette equivalent matching the existing cream + brown design system; verify via `lib/oceanDashboard.ts` palette references). Italic stays inside. The visual cue is "this is a callout, not body prose."

**What — per-card Question:**

- **Markdown:** Change the Question prefix from `*How you read reality*` (italic) to `**How you read reality**` (bold-non-italic). The italic Read line directly below remains italic. Reader sees: bold subhead → italic user-specific answer.
- **React:** Change the `<CardQuestion>` component's CSS from italic to non-italic small-caps or uppercase-tracked treatment, e.g., `text-xs font-semibold uppercase tracking-wider text-amber-900/70` (or palette equivalent). Read line below remains italic. Visual cue: "Question is the card's stated job; Read is the user-specific answer."

**Render rule:** Canonical strings in `SHAPE_CARD_QUESTION` and the prose composed by `composeExecutiveRead` stay verbatim. CC-PROSE-1A is purely the visual wrapper, not the content.

### Fix 2 — Halo calibration bump

**File:** `lib/goalSoulDashboard.ts`.

**What:** Bump `MOVEMENT_GRIP_HALO_MAX` from 20 to 28. Recalibrated targets in the 200×200 viewBox (152-unit plot):

- grip=21 (Jason canonical): r ≈ 5.9 svg-units (~3.9% plot diameter — visible but proportional)
- grip=35 (mid-grip): r ≈ 9.8 svg-units (~6.4% — clearly visible)
- grip=80 (heavy drag): r ≈ 22.4 svg-units (~14.7% — clearly oversized halo)
- grip=100 (theoretical max): r = 28 svg-units (~18.4%)

If `npm run dev` visual verification at 28 still reads too subtle for grip=21, escalate to 32 (cap — beyond which the halo dominates the chart at high grip). Document the chosen value in Report Back.

**Out-of-scope for this fix:** halo stroke style (`stroke-dasharray="3 3"`), opacity (~0.5), and color (existing `#8b6f47`) all stay verbatim. Only the radius constant changes.

### Fix 3 — Synthesis composer voice cleanup

**File:** `lib/identityEngine.ts` (or wherever the Synthesis composer lives — confirm via grep before modifying).

**What:** The Synthesis composer's prose must produce second-person voice consistently. Eliminate any branch that produces:

- `"${name}'s shape reads as..."` → produce `"Your shape reads as..."`
- `"What ${name} protects..."` → produce `"What you protect..."`
- `"${name} is a long-arc..."` / `"${name} is a present-tense..."` → produce `"You are a long-arc..."` / `"You are a present-tense..."`
- `"This shape is a..."` → produce `"You are a..."`
- `"${name}'s gift is..."` / `"${name}'s danger is..."` → produce `"Your gift is..."` / `"Your danger is..."`

The Executive Read (`composeExecutiveRead` from CC-PROSE-1) is already second-person and stays unchanged. The Synthesis closer must match that voice.

**Audit signal:** The Synthesis section's rendered prose, sampled across all 20 fixtures, must contain no instance of the user's literal name (per the `getUserName(input)` helper used elsewhere) and no instance of "this shape is" (case-insensitive). The "Your shape" / "You are" patterns are canonical.

**Out-of-scope for this fix:** prose content (gift names, value lists, parallel-line tercet structure, the engine's canonical phrases like "convert structure into mercy" / "Your gift is the long read") all stays verbatim. Only the voice/pronoun choice changes.

### Fix 4 — Pattern Note vs Pattern observation rename

**Files:** Locate the CC-029 pattern catalog composer via grep `"Pattern observation"`; likely in `lib/patternCatalog.ts` or similar. Plus any consumers in `lib/renderMirror.ts` and `app/components/ShapeCard.tsx`.

**What:** Rename the CC-029 pattern catalog output's user-facing label from "Pattern observation" to a distinct string. Recommended candidates (executor picks; document choice in Report Back):

- "Pattern in motion"
- "Lived pattern"
- "Pattern at work"
- "Shape in practice"

Preserve **"Pattern Note"** as the existing CC-022 canonical card-closer label — it is unchanged.

**Render rule:** The label change is internal (the bold-italic prefix on the line); the prose content of the pattern catalog output stays verbatim. No new claims, no rewriting.

### Fix 5 — Audit assertions

**File:** `tests/audit/proseArchitecture.audit.ts`. Add CC-PROSE-1A assertion block (all assertions run across the 20-fixture cohort):

- `prose-1a-executive-read-callout-markdown`: Executive Read prose renders inside a markdown blockquote (line begins with `>`).
- `prose-1a-card-question-non-italic-markdown`: For each card, the Question prefix renders as bold (`**...**`), not italic (`*...*`). Italic Read line directly below remains italic.
- `prose-1a-halo-calibration-bumped`: `MOVEMENT_GRIP_HALO_MAX` constant in `lib/goalSoulDashboard.ts` is ≥28.
- `prose-1a-synthesis-no-name-leak`: For each fixture, the rendered Synthesis section contains no instance of the user's literal name (per `getUserName(input)`).
- `prose-1a-synthesis-no-this-shape-is`: For each fixture, the rendered Synthesis section contains no instance of "this shape is" or "This shape is" (case-insensitive).
- `prose-1a-synthesis-second-person-anchored`: For each fixture, the Synthesis section contains "Your shape" or "You are" — second-person voice anchor present.
- `prose-1a-pattern-label-distinct`: For each fixture's rendered output, the strings "Pattern Note" and "Pattern observation" do NOT both appear. The CC-022 "Pattern Note" string remains; the CC-029 catalog output uses the new chosen label. (Audit assertion form: rendered output must not contain "Pattern observation" verbatim; the chosen replacement label appears instead.)

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, intensity math, or composite consumption.** `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, `computeGoalSoulGive`, `computeMovement`, `computeDriveOutput`, `computeLoveMapOutput` — all untouched.
2. **Do NOT rewrite engine prose content.** Strength / Growth Edge / Practice / Pattern Note text stays verbatim. Question / Read line content stays verbatim. Executive Read prose content stays verbatim. CC-PROSE-1A is visual-treatment + voice-cleanup + label-rename only.
3. **Do NOT introduce new layers, callouts, tables, or visualizations.** Those are CC-PROSE-1B's territory (Core Signal Map / Pulled-Forward Callouts / Gifts+Edges table).
4. **Do NOT remove the engine's hedging language.** "Appears to" / "may" / "tends to" / "suggests" / "likely" — preserved verbatim. Per `feedback_hedge_density_in_engine_prose.md`, do NOT add hedges either; current rate is 30-47 per fixture against the 3-floor.
5. **Do NOT invent new claims.** No new prose generation. Visual treatment is wrapper-only; voice cleanup is pronoun substitution only; label rename is a string change only.
6. **Do NOT over-rewrite or paraphrase load-bearing engine phrases** in the Synthesis composer voice cleanup. Canonical phrases stay verbatim ("Your gift is the long read", "convert structure into mercy", "care with a spine", "the early shape of giving", "let context travel with action", etc.). Pronoun substitution is the only allowed change to Synthesis prose.
7. **Do NOT add LLM calls or API integrations.** Engine produces the prose; CC-PROSE-1A only changes how it's rendered/labelled.
8. **Do NOT modify the masthead** ("a possibility, not a verdict") or "How to Read This" framing.
9. **Do NOT modify section ordering.** Executive Read sits where CC-PROSE-1 placed it (between masthead and "How to Read This"). All other sections in their existing positions.
10. **Do NOT change the SVG color palette.** Halo color stays `#8b6f47`; donut palette unchanged; Disposition Signal Mix bar palette unchanged.
11. **Do NOT modify** the question bank (`data/questions.ts`), fixture files, `MEMORY.md`, `AGENTS.md`, `docs/canon/`, `docs/goal-soul-give-spec.md`, `docs/ocean-disposition-spec.md`, or any spec memo. Surface drift in Report Back.
12. **Do NOT install dependencies.** Visual distinctness uses existing Tailwind utilities (or whatever the React tree uses) and existing markdown primitives. No new chart/UI libraries.
13. **Do NOT modify band thresholds, calibration constants beyond `MOVEMENT_GRIP_HALO_MAX`, or any architectural piece from CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087.** Those are canon.
14. **Do NOT touch CC-PROSE-1's audit assertions.** Existing `prose-1-*` assertions stay green; CC-PROSE-1A adds new `prose-1a-*` assertions to the same file.
15. **Do NOT rewrite `composeExecutiveRead` or `SHAPE_CARD_QUESTION`.** Both are CC-PROSE-1 canon; CC-PROSE-1A only changes how their output is wrapped/styled, not what they produce.
16. **Do NOT modify `composeReportCallouts`, `renderCoreSignalMap`, or any other CC-PROSE-1B-scope composer if it exists yet.** Those belong to CC-PROSE-1B.
17. **Do NOT modify the body card prose (Strength / Growth Edge / Practice / Pattern Note bodies)** as part of the Pattern Note vs Pattern observation rename. Only the label that prefixes the CC-029 catalog output changes.
18. **Do NOT change React's existing `cardHeader` Read line styling.** The Read line stays italic; only the Question prefix above it changes treatment.

## Acceptance Criteria

1. Executive Read renders as a blockquote in markdown and a visually distinct callout block in React (border + background tint, palette-consistent). Prose content unchanged from CC-PROSE-1.
2. Per-card Question line renders as bold (markdown) and non-italic small-caps or uppercase-tracked (React) — visually distinct from the italic Read line directly below it.
3. `MOVEMENT_GRIP_HALO_MAX` bumped to 28 (or 32 if visual verification at 28 still reads too subtle). Halo at grip=21 (Jason canonical) is visibly proportional, not vestigial.
4. Synthesis composer produces second-person voice for every fixture: no name leaks, no "this shape is" branches; "Your shape" / "You are" anchored throughout.
5. CC-029 pattern catalog output renders with a distinct label (chosen from candidates above; documented in Report Back). "Pattern Note" preserved as the CC-022 card-closer label. The two labels never co-occur on the same card.
6. All 7 new CC-PROSE-1A audit assertions pass.
7. All existing CC-PROSE-1 audit assertions still pass (regression — Layer 1-3 prose preserved verbatim).
8. Existing OCEAN audit assertions pass (regression — math fundamentals untouched).
9. Existing Goal/Soul/Give audit assertions pass (regression — composite consumption untouched).
10. CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression: all assertions still pass.
11. `npx tsc --noEmit` exits 0.
12. `npm run lint` exits 0.
13. `npm run audit:ocean` exits 0.
14. `npm run audit:goal-soul-give` exits 0.
15. `npx tsx tests/audit/proseArchitecture.audit.ts` exits 0 (CC-PROSE-1 + CC-PROSE-1A assertions all green).
16. `npm run dev` renders the visual changes correctly (manual visual verification).
17. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. **Summary** in 4-6 sentences. Confirm all four fixes landed cleanly. Name the chosen "Pattern observation" replacement label and the chosen `MOVEMENT_GRIP_HALO_MAX` value (28 or 32).

2. **Visual distinctness samples** — rendered HTML/markdown excerpts showing:
   - Executive Read in markdown (blockquote treatment) and React (callout block) for the canonical Jason fixture.
   - Per-card Question line in markdown (bold) and React (small-caps or non-italic) for at least 2 cards (Lens + Compass) on the canonical Jason fixture.

3. **Halo calibration verification** — for fixtures with grip=21 (Jason canonical), grip=35 (or closest available, e.g., Michele), and grip=80+ (or closest available), confirm halo radius reads as proportional. Note the chosen `MOVEMENT_GRIP_HALO_MAX` value and rationale (28 sufficient, or escalated to 32?).

4. **Synthesis voice cleanup verification** — sample rendered Synthesis prose for at least 4 fixtures spanning the cohort:
   - Jason canonical (pattern-reader / Knowledge top)
   - Present-tense Jason / equivalent (Soul-leaning Compassion top)
   - Soul-leaning fixture (e.g., 11-retirement-longing or Michele equivalent)
   - One Goal-leaning balanced fixture (e.g., JDrew equivalent)
   
   Confirm each renders second-person; no name leaks; no "this shape is" branches.

5. **Pattern label rename verification** — confirm "Pattern Note" still renders on cards where the CC-022 closer fires; the renamed label renders on cards where the CC-029 catalog fires; both never collide on the same card. Show samples on at least 2 cards (Lens + Path body) for one fixture.

6. **Audit pass/fail breakdown** — including all 7 new CC-PROSE-1A assertions, CC-PROSE-1 regression (all `prose-1-*` assertions), CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression, OCEAN + Goal/Soul/Give regression.

7. **React/markdown parity check** — confirm both render paths produce equivalent visual treatment for Executive Read and per-card Question. Note any per-platform divergences (e.g., markdown can't replicate React's small-caps directly — bold-non-italic is the markdown equivalent; that's expected and intentional).

8. **Out-of-scope verification** — git status; explicit confirmation that signal pool, intensity math, composite consumption, fixture data, calibration constants beyond `MOVEMENT_GRIP_HALO_MAX`, masthead, section ordering, engine prose content, hedging language, `composeExecutiveRead`, `SHAPE_CARD_QUESTION`, body card prose, and all CC-PROSE-1B-scope composers are untouched.

9. **Recommendations for CC-PROSE-1B** — if any of the four fixes surfaced incidental findings that affect Layer 4-6 design (Core Signal Map / Pulled-Forward Callouts / Gifts+Edges table), name them. Specifically:
   - Does the visual-distinctness treatment chosen for the Executive Read (callout block) generalize cleanly to the three Pulled-Forward Callouts in Layer 5?
   - Does the Synthesis voice cleanup expose any composer that the Final Line callout (Layer 5C) would lift from?
   - Any other coherence findings worth queueing for CC-PROSE-1B's prompt-drafting session.
   
   Otherwise: confirm CC-PROSE-1B can proceed against the now-coherent CC-PROSE-1 + CC-PROSE-1A foundation.
