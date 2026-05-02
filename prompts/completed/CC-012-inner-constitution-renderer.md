# CC-012 — Inner Constitution Renderer

## Goal

Rebuild the result page in `app/page.tsx` so that after a user completes the assessment, they read a polished Inner Constitution — the editorial artifact that `inner-constitution.md` specifies — instead of the bare signals/tensions/sacred-values list that ships today. After CC-012, the user sees:

- A **Shape Summary** opening paragraph.
- **Eight Shape cards** rendered in canonical order (Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path) with their body-part metaphor (Eyes, Heart, Voice, Spine, Ears, Nervous system, Immune response, Gait), each card carrying its SWOT cells (Conviction is leaner; Path is directional).
- **Top Gifts** (3) and **Top Risks** (3) synthesized across cards.
- **Growth Path**, **Relationship Translation**, **Conflict Translation**, and **Mirror-Types Seed** paragraphs.
- **Confirmed Tensions** and **Open Tensions** sections, with each tension card carrying a "tell me more" provenance disclosure showing why the system surfaced it.
- An optional **MBTI 4-letter disclosure** affordance on the Lens card, gated on `lens_stack.confidence === "high"`, displayed only when the user clicks to reveal — never as a headline.

CC-012 is **rendering only**. It reads from the structured `InnerConstitution` object that CC-011 produces and turns it into the editorial document spec'd in `inner-constitution.md` and `design-spec-v2.md` § 10. No new derivation. No new engine logic. No canon edits. No new questions, signals, or tensions.

The visual register is the warm-paper-and-ink editorial document — closer to a thoughtful letter than a dashboard. The CC-D design tokens (paper / ink / umber / Source Serif / JetBrains Mono) flow through. The "Constitution is one document, not a results dashboard" non-negotiable from `design-spec-v2.md` § 4 / § 16 #6 is binding.

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

This CC touches `app/page.tsx` substantially (the result-page render block is rebuilt) plus adds three or four new components under `app/components/`. Per-edit approval prompts will defeat single-pass execution.

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

**Canon (read; do NOT edit any canon file):**

- `docs/canon/inner-constitution.md` — the rendering spec. § Top-Level Structure (lines 51–62), § The Eight Cards (lines 78–168) with per-card format spec, § 3–10 (Top Gifts / Top Risks / Growth Path / Relationship Translation / Conflict Translation / Mirror-Types Seed / Confirmed Tensions / Open Tensions). § Output Rules (lines 36–46) — eight rules binding on every rendered sentence. § Canonical Rules (lines 312–322) — thirteen rules. **Output Rule #6** ("Do not surface signal_ids, gift category labels, or any internal vocabulary verbatim to the user") and **Rule #8** ("Type labels appear only as optional disclosures behind a small affordance, never as headlines") are the most relevant for renderer choices.
- `docs/canon/shape-framework.md` — § The Eight Shape Cards table (lines 39–48 with product names + body parts), § Body analogy (lines 53–63), § Five Dangers to Avoid (lines 291–305) — every rendered sentence must respect them.
- `docs/canon/output-engine-rules.md` — context only; CC-011 implemented the rules. CC-012 just renders the output.
- `docs/canon/tension-library-v1.md` — for tension descriptions. Tension `description` and `user_prompt` fields on each tension entry are what the renderer displays.
- `docs/canon/signal-library.md` — for `SIGNAL_DESCRIPTIONS` lookup when rendering tension provenance.

**Design specifications (read; do NOT edit):**

- `docs/design-spec-v2.md` — § 5 visual identity (warm paper, ink, umber-only accent), § 9 tension cards with "tell me more" disclosure, § 10 Inner Constitution layout (suggested structure, design principles, "Avoid" / "Use" lists), § 11 tone and language rules, § 16 non-negotiables (especially #6 "the Inner Constitution is a document, not a dashboard," #7 "tensions are possibilities, not declarations," #8 "provenance disclosure is required," #9 "do not surface MBTI as the main product identity," #11 "do not let the UI promise saved state unless persistence exists").
- `docs/design-spec-v1.md` — § 1.3 spacing (8-unit grid), § 1.4 hairlines (1px solid `var(--rule-soft)` / `var(--rule)` for separators), § 6 the Inner Constitution layout draft (some details supersede v2).
- `docs/design-prototype/` — reference files if Claude Design Lab has delivered them; otherwise this directory is just a README.

**Existing code (read; will be edited):**

- `app/page.tsx` — the result-page render block (currently lines ~140–450 in the post-CC-D file) gets rebuilt. The question-flow logic, state management, tension confirmation flow, and Confirmation type stay as-is.
- `app/globals.css` — design tokens already in place from CC-D. CC-012 inherits.
- `app/layout.tsx` — fonts already loaded from CC-D. CC-012 inherits.
- `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx` — question-flow components, untouched by CC-012.
- `lib/types.ts` — `InnerConstitution` type with the four CC-011 additions (`shape_summary`, `lens_stack`, `shape_outputs`, `cross_card`). CC-012 reads from these.
- `lib/identityEngine.ts` — `buildInnerConstitution` produces the data CC-012 renders. `SIGNAL_DESCRIPTIONS` is needed for tension provenance disclosure. Both stay unchanged in CC-012.
- `data/questions.ts` — needed for tension provenance to show which question a signal came from.

---

## Context

After CC-011, the engine produces a complete `InnerConstitution` object with:

```ts
{
  // pre-CC-011 fields (still present)
  core_orientation: string;
  signals: Signal[];
  tensions: Tension[];
  sacred_values: string[];
  bridge_signals: string[];
  // CC-011 additions
  shape_summary: string;
  lens_stack: LensStack;
  shape_outputs: ShapeOutputs;     // 8 cards with SWOT cells
  cross_card: CrossCardSynthesis;  // top gifts, risks, growth path, etc.
}
```

But the result page in `app/page.tsx` currently renders only `core_orientation`, `signals`, `tensions`, `sacred_values`, and the `bridge_signals` placeholder. The four new fields are **invisible** even though they're populated and editorially complete.

CC-012 closes that gap. It rebuilds the result page to render the structured Inner Constitution per spec.

The user's session showed exactly what's at stake: 73 signals correctly fired, the engine produced a clean INTJ stack derivation, the per-card SWOT cells contain templated prose in canon voice — and the user saw a flat list of 73 signal-id strings and a misfiring T-007 instead of the editorial document the canon describes. CC-012 fixes that.

---

## Spec-Faithful Interpretation Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Component decomposition

Create the following new components. Each is a focused, single-purpose component:

- `app/components/InnerConstitutionPage.tsx` — top-level component for the result page. Takes the `InnerConstitution` object plus the existing `confirmations`, `setConfirmations`, `explainOpen`, `setExplainOpen` state from `app/page.tsx`. Lays out all sections in canonical order.
- `app/components/ShapeCard.tsx` — renders one Shape card. Variants by card type:
  - `variant: "full-swot"` — for Lens, Compass, Gravity, Trust, Weather, Fire (six cards). Renders all four cells.
  - `variant: "conviction"` — for Conviction. Renders Gift + Blind Spot + Posture only.
  - `variant: "path"` — for Path. Renders the directional paragraph only.
- `app/components/TensionCard.tsx` — renders one tension with confirmation buttons (Yes / Partially / No / Explain), a notes textarea (when Explain is open), and a "tell me more" provenance disclosure that expands to show why the system surfaced this tension.
- `app/components/MbtiDisclosure.tsx` — small toggle component that's hidden by default and reveals the MBTI 4-letter code when clicked. Only mounts when `lens_stack.confidence === "high"` AND `lens_stack.mbtiCode` is present.

In `app/page.tsx`, replace the result-page render block with `<InnerConstitutionPage ... />`. The question-flow logic above the result-page stays untouched.

### D-2: Top-level layout structure

The Inner Constitution page renders sections in this canonical order per `inner-constitution.md` § Top-Level Structure (lines 51–62):

1. **Page header** — small mono kicker `THE INNER CONSTITUTION` + serif italic subtitle `a possibility, not a verdict`. Centered. Hairline rule below.
2. **Shape Summary** — single paragraph from `constitution.shape_summary`. Drop-cap or subtle editorial opening treatment optional. Section rule below.
3. **The Eight Shape Cards** — Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path. Each rendered as a `<ShapeCard>` in long-scroll order (not tabs, not accordion). Section rule between major groups (Core Portrait / Belief Stance / Context Overlays / Developmental Direction per `shape-framework.md` § Card Types and Layered Architecture, but these are subtle visual cues, not loud headers).
4. **Top Gifts** — three labeled paragraph entries from `constitution.cross_card.topGifts`.
5. **Top Risks** — three labeled paragraph entries from `constitution.cross_card.topRisks`.
6. **Growth Path** — single paragraph from `constitution.cross_card.growthPath`.
7. **Relationship Translation** — paragraph from `constitution.cross_card.relationshipTranslation`.
8. **Conflict Translation** — paragraph from `constitution.cross_card.conflictTranslation`.
9. **Mirror-Types Seed** — paragraph from `constitution.cross_card.mirrorTypesSeed`. (Replaces the old "Bridge Signals" placeholder section.)
10. **Confirmed Tensions** — tensions where `confirmations[tension_id].status === "yes" | "partly"` rendered with full weight (no confirmation buttons; rendered as accepted readings). If no confirmed tensions, hide the section entirely (do not show an empty "Confirmed Tensions" header).
11. **Open Tensions** — tensions that haven't been confirmed yet (no entry in `confirmations`, OR confirmed `"unconfirmed"`). Each renders as a `<TensionCard>` with Yes / Partially / No / Explain affordances. Tensions confirmed `"no"` are hidden entirely (per Output Rule #7).
12. **Page footer** — small mono kicker `END OF DOCUMENT` or similar. Optional. No "save" / "share" / "download" buttons in v1 (per non-negotiable #11 — no fake persistence; no false promises of features that don't exist).

Container max-width: 720px desktop (slightly wider than the QuestionShell's 640px because this is a reading experience). Mobile: full-width with 24px side padding. Long scroll, not paginated.

### D-3: ShapeCard layout

Each card renders the structure from `inner-constitution.md` § Card structure (lines 82–100):

```
[Card name] · [Body part metaphor]              (mono kicker, small caps)
[Card header — one sentence]                    (serif italic, 15px)

Gift                                              (mono small caps kicker)
[2-3 sentences of templated prose]               (serif body)

Blind Spot                                        (mono small caps kicker)
[2-3 sentences of templated prose]

Growth Edge                                       (mono small caps kicker)
[2-3 sentences of templated prose]

Risk Under Pressure                               (mono small caps kicker)
[2-3 sentences of templated prose]
```

For Conviction (`variant: "conviction"`):

```
Conviction · Voice                              (mono kicker)
[Card header]                                    (serif italic)

Gift
[prose]

Blind Spot
[prose]

Conviction Posture                               (mono kicker)
[posture sentence — 1 long sentence]
```

For Path (`variant: "path"`):

```
Path · Gait                                      (mono kicker)
[directional paragraph — 4-8 sentences in serif body]
```

Visual treatment:

- Card kicker: JetBrains Mono, 11px, uppercase, tracking +0.08em, `var(--ink-mute)`.
- Card header: Source Serif italic, 15px desktop / 14px mobile, `var(--ink-soft)`.
- Cell label (Gift / Blind Spot / etc.): JetBrains Mono, 10px, uppercase, tracking +0.12em, `var(--ink-mute)`.
- Cell body: Source Serif, 15.5px desktop / 15px mobile, `var(--ink)`.
- Section padding: 32px vertical between cards on desktop, 24px on mobile.
- Hairline `var(--rule-soft)` between cards.
- Each cell has a small umber 2px-tall horizontal rule below the cell label, 24px wide, as quiet section emphasis. Ties cells visually to the umber accent system without becoming loud.

For the **Lens card specifically**, mount the `<MbtiDisclosure>` component below the Lens header, before the SWOT cells. See § D-4.

### D-4: MBTI disclosure affordance

The `<MbtiDisclosure>` component only mounts when both:

1. `constitution.lens_stack.confidence === "high"`, AND
2. `constitution.lens_stack.mbtiCode` is a non-empty string.

When mounted, it renders a small inline button:

```
+ optional type label
```

Mono caps, 10px, `var(--ink-mute)`, with a subtle hover state showing umber color change. When clicked, expands inline to show:

```
Possible surface label: INTJ.
Type labels are surface descriptions only — your shape is not reducible to a four-letter code. The Lens reading above is the actual interpretation.
```

The button toggles the disclosed text. Hidden by default (state: `useState(false)`).

The label "INTJ" is the only place the MBTI code appears in the entire rendered output. Per `inner-constitution.md` Canonical Rule #5 and Output Rule #8, the type code is **never a headline, never the page title, never bold, never large**.

### D-5: Tension card rendering and provenance disclosure

Each `<TensionCard>` carries:

- **Tension header** — `T-NNN · [Human Title]` in mono kicker style. Status indicator (umber dot) showing whether the tension is currently `unconfirmed`, `partly_confirmed`, etc.
- **Description** — serif body, the tension's `description` field from `tension-library-v1.md`.
- **User prompt** — serif italic body, the tension's `user_prompt` field. (e.g., "This pattern may be present: …. Does this feel accurate?")
- **Confirmation affordances** — three small buttons: `Yes`, `Partially`, `No`. Plus an `Explain` button that toggles a notes textarea where the user can write a free-form note. The buttons set `confirmations[tension_id].status` to `"yes" | "partly" | "no"`.
- **Provenance disclosure** — a small `tell me more` link/button at the bottom of the card. When clicked, expands inline to show **why the system surfaced this tension**.

The provenance disclosure renders prose from the tension's `signals_involved` field (an array of `{ signal_id, from_card }`). For each involved signal, look up its description from `SIGNAL_DESCRIPTIONS` (or fall back to a humanized version of the signal ID) and the question it came from. Render as a paragraph:

```
This tension was surfaced because:
• [signal description] (from Q-XX in [Card] card)
• [signal description] (from Q-YY in [Card] card)
[…]

The combination of these signals at high enough rank to fire the rule is what put this on the table. You are the final authority on whether it actually fits.
```

Use the existing `SIGNAL_DESCRIPTIONS` lookup from `lib/identityEngine.ts` (already exported, or add a getter if not). Use `data/questions.ts` to look up which question owns each signal (any item with `signal: signalId` in any question's `items[]` array). For tension cards where the signals all come from the same question (e.g., T-012 all-sacred from Q-S1 + Q-S2), naturally consolidate.

Avoid surfacing signal IDs verbatim in the disclosure (Output Rule #6). Use the description prose only.

For tensions in **Confirmed Tensions** (status "yes" or "partly"), do NOT show the confirmation buttons. The card renders the same content but without affordances — it's a reading, not a question. Show `Edit response` link to allow re-confirmation.

For tensions in **Open Tensions** (no confirmation yet, or status "unconfirmed"), show full affordances.

For tensions confirmed "no", do not render at all (Output Rule #7).

### D-6: Visual treatment — the editorial register

Per `design-spec-v2.md` § 10 and § 5:

**Use:**

- Serif prose throughout the body (Source Serif 4, 15.5px desktop / 15px mobile, `var(--ink)`).
- Mono metadata for IDs, kickers, provenance citations (JetBrains Mono).
- Section rules — `1px solid var(--rule-soft)` between major sections; thicker `1px solid var(--rule)` between cards.
- Drop cap on the Shape Summary first letter — Source Serif 4, 48px, line-height 1, `var(--umber)`, float-left, padding-right 8px.
- Subtle umber accent — left rule on tension cards (2px solid var(--umber-soft) on left side), small umber rules below cell labels in Shape cards, primary affordance buttons in umber.
- Generous vertical space — 48px between major sections, 32px between Shape cards on desktop, smaller on mobile.

**Avoid (per `design-spec-v2.md` § 10):**

- Big type-label hero. The page never says "INTJ" or any type code as a primary heading.
- Radar charts, percentile bars, score gauges. No quantitative visualizations anywhere.
- "Your score is…" language.
- Decorative card backgrounds or gradients.
- Confetti or celebration animations.
- Tabs / accordion to hide cards. The whole document scrolls.
- Bridge Signals placeholder. Remove from the rendered page entirely.

### D-7: Preserve question-flow state and confirmation logic

The existing question flow logic in `app/page.tsx` (the `<QuestionShell>` mounting, the `current` index state, the `answers` state, the `confirmations` state, the `explainOpen` state, the `submitResponse` function) **stays exactly as is**. CC-012 only changes the result-page render block.

The flow is:

1. User completes questions via `<QuestionShell>` → `answers` array fills.
2. Last question advanced → `setShowResult(true)`.
3. `useMemo` builds `constitution` via `buildInnerConstitution(answers)`.
4. **CC-012 changes**: instead of rendering the existing result-page block, render `<InnerConstitutionPage constitution={constitution} confirmations={confirmations} setConfirmations={setConfirmations} explainOpen={explainOpen} setExplainOpen={setExplainOpen} answers={answers} />`.

`InnerConstitutionPage` receives all the state it needs to render and update tension confirmations.

The Confirmation type, the `setConfirmations` setter, and the `explainOpen` toggle behavior all work the same as before. Only the visual treatment changes.

### D-8: Mobile responsiveness

Match CC-D's mobile-first approach with `md:` breakpoint at 768px. Key sizes:

- Shape Summary serif body: 16px mobile / 17px desktop.
- Card kicker (mono): 11px both.
- Card header (serif italic): 14px mobile / 15px desktop.
- Cell label (mono caps): 10px both.
- Cell body (serif): 15px mobile / 15.5px desktop.
- Tension prompt (serif italic): 16px mobile / 17px desktop.
- Provenance disclosure (mono): 11px both.

Typography size pairs use Tailwind arbitrary-value utilities (`text-[15px] md:text-[15.5px]`) to avoid the verbose `<span className="md:hidden">` / `<span className="hidden md:inline">` pattern from CC-D. CC-011's report flagged this as cleaner. Use it here.

Container: max-width 720px desktop, full-width mobile with 24px side padding. The footer "end of document" indicator (if added per § D-2 step 12) sits centered at the bottom.

### D-9: No persistence claims, no fake save

Per `design-spec-v2.md` § 16 #11 and CC-D's "DRAFT IN PROGRESS" footer pattern: persistence does not exist in v1. The Inner Constitution page must NOT include:

- A "Save your Constitution" button.
- A "Share" button (no sharing infrastructure in v1).
- A "Download as PDF" button (no export infrastructure in v1).
- An autosave indicator anywhere on the page.
- A "Your results are saved" message anywhere.
- A "Bookmark this page" suggestion (the URL is currently localhost:3003 with no session token).

If the user asks about persistence, the answer is "v2 / Postgres / future." No UI promises.

The page footer can include a small mono caps line such as `END OF DOCUMENT — RETURN ANYTIME` only if we genuinely support return-to-page (which we don't yet without persistence). Default: omit the footer or use a quiet "this is a draft. nothing is saved." mono caps line in `var(--ink-mute)`.

### D-10: Five Dangers compliance — already handled by CC-011

CC-011's templated prose already respects the Five Dangers. CC-012 is rendering, not generating. The renderer must NOT add any sentences of its own beyond the structural labels (kicker text, cell labels like "Gift" / "Blind Spot" / etc., section dividers).

The only renderer-authored text outside the engine output:

- Page header: `THE INNER CONSTITUTION` mono caps + `a possibility, not a verdict` serif italic subtitle.
- Section labels: `Top Gifts`, `Top Risks`, `Growth Path`, `Relationship Translation`, `Conflict Translation`, `Mirror-Types Seed`, `Confirmed Tensions`, `Open Tensions`. Mono caps section labels.
- Provenance disclosure preamble: `This tension was surfaced because:` (mono caps).
- Provenance closing: `The combination of these signals at high enough rank to fire the rule is what put this on the table. You are the final authority on whether it actually fits.` (serif italic).
- MBTI disclosure body: `Possible surface label: [code]. Type labels are surface descriptions only — your shape is not reducible to a four-letter code. The Lens reading above is the actual interpretation.` (serif italic).
- Footer (optional): `this is a draft. nothing is saved.` mono caps small.

These are the only renderer-authored strings. All other text comes from the engine output.

---

## Requirements

### 1. Create `app/components/InnerConstitutionPage.tsx`

Top-level component that receives the constitution and renders the full document per § D-2. Layout flows top-to-bottom: page header → Shape Summary (with drop cap) → eight `<ShapeCard>` instances → Top Gifts → Top Risks → Growth Path → Relationship Translation → Conflict Translation → Mirror-Types Seed → Confirmed Tensions section → Open Tensions section → optional footer.

The component is a single max-width container (~720px) centered with mobile-responsive side padding.

### 2. Create `app/components/ShapeCard.tsx`

Variant-driven component per § D-3. Accepts a discriminated union prop:

```ts
type ShapeCardProps =
  | { variant: "full-swot"; output: FullSwotOutput; mbtiSlot?: React.ReactNode }
  | { variant: "conviction"; output: ConvictionOutput }
  | { variant: "path"; output: PathOutput };
```

The `mbtiSlot` is rendered between the Lens card header and its cells; the parent passes `<MbtiDisclosure stack={constitution.lens_stack} />` for the Lens card, omits it for other cards.

Render kicker (`{cardName} · {bodyPart}` mono caps), card header (serif italic), then per-variant content. Use the design tokens throughout. Apply mobile-responsive typography per § D-8.

### 3. Create `app/components/TensionCard.tsx`

Per § D-5. Two display modes:

- `mode: "open"` — full affordances (Yes / Partially / No / Explain + notes textarea).
- `mode: "confirmed"` — no affordances; the tension's prose is rendered with full weight; an `Edit response` link is available to return the tension to "open" mode.

Both modes carry the `tell me more` provenance disclosure (collapsed by default, expanded inline on click).

Provenance prose generation per § D-5: look up signal descriptions via the existing `SIGNAL_DESCRIPTIONS` map from `lib/identityEngine.ts` (export it if not already exported); look up question metadata from `data/questions.ts` to identify which question each signal came from. Render as a bulleted list with the closing line.

### 4. Create `app/components/MbtiDisclosure.tsx`

Per § D-4. Small toggle component. Self-mounts only when both `confidence === "high"` and `mbtiCode` is non-empty. Initial state: collapsed.

### 5. Refactor `app/page.tsx` to use `<InnerConstitutionPage>`

Replace the existing result-page render block (everything inside `if (showResult && constitution)` after the Mini Inner Constitution kicker through the closing of the Constitution display) with a single mount of `<InnerConstitutionPage ... />`. Pass through `constitution`, `confirmations`, `setConfirmations`, `explainOpen`, `setExplainOpen`, and `answers` (needed for tension provenance question lookup).

The question-flow logic (everything outside the result-page render block) stays unchanged.

### 6. Export `SIGNAL_DESCRIPTIONS` from `lib/identityEngine.ts` if not already exported

The provenance disclosure in `<TensionCard>` needs to read the SIGNAL_DESCRIPTIONS map. If the constant is currently un-exported, add `export` to its declaration. No other change to `lib/identityEngine.ts`.

If a getter function is preferable (e.g., `export function describeSignal(id: SignalId): string`), use that pattern instead. Match the file's existing conventions.

### 7. Type-check and lint

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.

### 8. Verify in browser

After all edits, run `npm run dev` and confirm at `localhost:3003`:

- Complete the question flow (or replay a session if persistence somehow exists).
- The result page renders the full Inner Constitution, not the bare signals/tensions list.
- Page header reads `THE INNER CONSTITUTION` + `a possibility, not a verdict` subtitle.
- Shape Summary appears with drop cap on opening letter.
- Eight cards render in canonical order: Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path.
- Each card uses its body-part metaphor (Lens · Eyes; Compass · Heart; etc.).
- Conviction renders Gift + Blind Spot + Posture only (no Growth Edge / Risk cells).
- Path renders the directional paragraph only (no SWOT cells).
- Top Gifts, Top Risks, Growth Path, Relationship Translation, Conflict Translation, Mirror-Types Seed sections all render in canonical order.
- Tension cards show `tell me more` link; clicking expands inline to show provenance prose.
- For users whose `lens_stack.confidence === "high"`, the Lens card shows a `+ optional type label` button; clicking expands to reveal the MBTI 4-letter code in serif italic with the canonical "surface label only" caveat.
- For users whose `lens_stack.confidence === "low"`, the MBTI disclosure does NOT mount. The Lens card has no type-label affordance.
- Bridge Signals section is **removed entirely** from the rendered page.
- Mobile viewport (~390px) renders without horizontal scroll. Typography scales appropriately. Tension card affordances are thumb-reachable.
- Drag/keyboard interactions on the question flow are unchanged from CC-D / CC-007 (regression check — no broken interactions on the Ranking primitive).
- No "save" / "share" / "download" / "bookmark" buttons or autosave indicators anywhere on the page.

If browser smoke testing is performed by the user instead of the agent, the agent must clearly state in report-back that browser testing was deferred.

---

## Allowed to Modify

**Code:**

- `app/page.tsx` — replace the result-page render block with `<InnerConstitutionPage>`. Preserve question-flow logic, state management, and confirmation flow.
- `app/components/InnerConstitutionPage.tsx` — NEW.
- `app/components/ShapeCard.tsx` — NEW.
- `app/components/TensionCard.tsx` — NEW.
- `app/components/MbtiDisclosure.tsx` — NEW.
- `lib/identityEngine.ts` — only if `SIGNAL_DESCRIPTIONS` needs to be exported (or a `describeSignal` getter added). No other edits.

Do **NOT** modify:

- Any `docs/canon/*.md` file.
- `app/components/Ranking.tsx`, `app/components/QuestionShell.tsx`, `app/components/ProgressIndicator.tsx`.
- `app/globals.css`, `app/layout.tsx`.
- `data/questions.ts`.
- `lib/types.ts` — no type changes needed; CC-011 added everything CC-012 reads from.
- The question-flow logic in `app/page.tsx` (everything outside the result-page render block).
- `lib/identityEngine.ts` engine functions (`signalFromAnswer`, `signalsFromRankingAnswer`, `extractFreeformSignals`, `deriveSignals`, `detectTensions`, `applyStrengtheners`, `deriveCoreOrientation`, `deriveSacredValues`, `buildInnerConstitution`, `aggregateLensStack`, all per-card derivation functions, all cross-card synthesis functions, etc.).
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`, `postcss.config.mjs`.

---

## Out of Scope

This CC does not do any of the following. Each is a future-CC concern.

- **Persistence / autosave / localStorage / backend save.** Per `design-spec-v2.md` § 16 #11. Future Postgres CC.
- **Sharing / export functionality.** No PDF export, no email, no copy-link, no social sharing in v1. Future CC.
- **Print stylesheet.** Future CC.
- **New questions, signals, or tensions.** Out of scope.
- **Engine logic changes.** No changes to `buildInnerConstitution` or any derivation function. CC-012 reads what CC-011 produces.
- **Tension rule changes.** T-005 / T-007 / T-008 are already rank-aware from CC-011. Other tensions stay as-is.
- **Canon edits.** No `docs/canon/*` modifications.
- **Drop cap library.** If the drop cap requires custom CSS, write it inline. Do not add a dependency.
- **Animation / transition library.** No GSAP, no Framer Motion. v1 is calm; transitions are minimal (the existing 150ms ease-out from CC-007 / CC-D is already in place for ranking).
- **Internationalization.** v1 is English-only.
- **Light / dark theme toggle.** v1 is paper-on-ink only.
- **Accessibility audit beyond functional verification.** Use semantic HTML; preserve focus states; preserve keyboard navigation. No formal axe / WCAG audit.
- **Typography polish for the templated prose.** Voice-quote italics, smart quotes, en-dash spacing, etc. — accept what CC-011 produced. Future copy-polish CC.
- **MBTI disclosure for low-confidence stacks.** Per § D-4, low-confidence stacks don't show the affordance at all. Future CC may add a "shape unclear — see questions to refine" affordance, but not now.
- **Mirror-Types Seed substitution with LLM-generated prose.** Per CC-011's flagged risk. Future CC.
- **Path Card v2 (full SWOT for Path with dedicated Work / Love / Give / Empower questions).** Per `inner-constitution.md` § v1 vs v2 Scope. Future canon work.

---

## Acceptance Criteria

1. `app/components/InnerConstitutionPage.tsx` exists and renders the full Inner Constitution document in canonical section order per § D-2.
2. `app/components/ShapeCard.tsx` exists with three variants (`full-swot`, `conviction`, `path`) and renders per § D-3.
3. `app/components/TensionCard.tsx` exists with `open` and `confirmed` modes, the `tell me more` provenance disclosure per § D-5, and full Yes/Partially/No/Explain + notes affordances in open mode.
4. `app/components/MbtiDisclosure.tsx` exists, mounts only when `confidence === "high"` and `mbtiCode` is set, defaults to collapsed, and reveals the type code only in the canonical caveat language.
5. `app/page.tsx` mounts `<InnerConstitutionPage>` for the result-page render. Question-flow logic is unchanged.
6. The eight cards render in canonical order: Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path. Each uses its body-part metaphor (Lens · Eyes, etc.). Conviction is leaner; Path is directional.
7. Top Gifts (3) and Top Risks (3) render with their `label` and `paragraph` fields. Growth Path, Relationship Translation, Conflict Translation, Mirror-Types Seed render their respective string fields.
8. Tension cards show `tell me more` provenance disclosure that, when expanded, lists the source signals as descriptive prose (no signal IDs verbatim). Provenance closes with the canonical "you are the final authority" line.
9. MBTI affordance is gated on `confidence === "high"` AND `mbtiCode` non-empty. The label text appears only in the disclosed body, never as a headline.
10. Bridge Signals section is removed from the rendered page entirely.
11. No "save," "share," "download," "bookmark," or autosave language anywhere on the page.
12. Mobile viewport (~390px) renders without horizontal scroll. Typography sizes match § D-8.
13. Five Dangers compliance: every rendered sentence either comes from the engine (which is already compliant per CC-011) or is one of the renderer-authored strings explicitly listed in § D-10. No new sentences violating any of the five dangers.
14. The question flow at `localhost:3003` works exactly as it did post-CC-D / CC-010 / CC-011 (regression-free).
15. `npx tsc --noEmit` passes cleanly.
16. `npm run lint` passes cleanly.
17. No file outside the Allowed to Modify list has been edited.
18. No engine function in `lib/identityEngine.ts` is modified except the optional `SIGNAL_DESCRIPTIONS` export change (or `describeSignal` getter addition).
19. No canon file is touched.
20. The previously-existing result-page render (Core Orientation header, Signals Detected list, Possible Tensions confirmation cards, Sacred Values list, Bridge Signals placeholder) is fully replaced. No remnants of the old rendering remain in `app/page.tsx`.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description. Note any new files created.
2. **Component overview** — for each new component (`InnerConstitutionPage`, `ShapeCard`, `TensionCard`, `MbtiDisclosure`), one paragraph describing its responsibility and a 5–15 line excerpt showing the most important code (the structure / variant logic / provenance prose generator).
3. **`app/page.tsx` restructure** — quote the new result-page render block. Confirm the question-flow logic above it is byte-identical to its pre-CC-012 state.
4. **Tension provenance prose example** — quote the rendered provenance disclosure for one tension (e.g., T-012 Sacred Value Conflict if it fires for the smoke-test session). Show that signal IDs are NOT surfaced verbatim and that the canonical "you are the final authority" closing line is present.
5. **MBTI disclosure rendering** — quote the disclosed body text. Confirm gating logic on `confidence === "high"` and `mbtiCode` non-empty. Confirm the affordance does not mount for low-confidence stacks.
6. **Visual register notes** — confirm warm paper background, ink text, umber accents (rank rule on tension cards, primary buttons, drop cap, cell-label rules), serif body, mono kickers. Confirm no blues/greens/other accents introduced.
7. **Mobile responsiveness** — describe the breakpoint strategy. Confirm tested at ~390px viewport (or note if deferred). Confirm tension card affordances remain thumb-reachable.
8. **Smoke-test results** — state whether browser testing confirmed each of: cards render in canonical order, Conviction is leaner, Path is directional, top sections render, tension provenance disclosure works, MBTI affordance gates correctly, bridge signals removed, mobile viewport clean. If testing was deferred to the user, say so explicitly.
9. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
10. **Scope-creep check** — explicit confirmation that:
    - No canon file was modified.
    - No engine logic was changed.
    - `data/questions.ts` byte-identical.
    - `lib/types.ts` byte-identical.
    - The question-flow logic in `app/page.tsx` is byte-identical (everything outside the result-page render block).
    - No persistence claim, no fake save / share / download.
    - No new color introduced beyond the 12 design tokens.
    - No new dependency added.
    - No sentences that violate the Five Dangers.
11. **Risks / next-step recommendations** — anything that surfaced during execution. Specifically:
    - Tension provenance prose registration: how the agent handled signals where SIGNAL_DESCRIPTIONS lookup fell through, and any heuristics needed for "joining" signals from the same question.
    - Drop cap implementation: whether inline CSS, ::first-letter pseudo-element, or a manual span approach was used. Any visual quirks.
    - Confirmed vs Open tension display: whether the toggle from Open → Confirmed (after user clicks Yes/Partially) was tested, and whether the Edit response link works as a round-trip back to Open mode.
    - Low-confidence Lens stack rendering: whether the agent verified the Lens card displays cleanly without an MBTI affordance and without breaking layout.
    - Path directional paragraph length variability: whether short vs long paragraphs render acceptably; if the prose is sometimes too short to fill a card visually, flag for future polish.
    - Mirror-Types Seed visual treatment: this paragraph closes the editorial body before tensions begin; whether visual hierarchy gives it the right emphasis.
    - Any other observation worth surfacing.
