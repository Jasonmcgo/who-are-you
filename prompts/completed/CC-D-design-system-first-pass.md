# CC-D — Design System First Pass (Tokens, Typography, QuestionShell, Ranking Polish)

## Goal

Apply the canonical design system from `docs/design-spec-v2.md` to the running app — design tokens (warm paper, ink, umber accent), typography (Source Serif 4, JetBrains Mono, Inter Tight), a proper QuestionShell with header/body/footer regions, a ProgressIndicator with umber active segment, and visual polish on the Ranking primitive — so that the existing question flow (Q-S1, Q-S2, Q-X3, Q-X4, Q-C4, plus forced and freeform questions) renders into a polished editorial shell instead of the bare browser-default styling that ships today.
 
This is the **first** design pass. It is intentionally not a complete visual redesign of every screen. Tension cards and the Inner Constitution / result page get a baseline-coherent treatment for free (via global typography + paper background + ink text), but their full editorial polish ships in future CCs (CC-D2 tension card; CC-D3 Inner Constitution).

After CC-D, the running app at `localhost:3003` should:

- Render every question on warm paper (`#f6f2ea`) with ink text (`#1a1713`) and umber as the only accent (`#8a4a1f`).
- Use Source Serif 4 for prompts and body, JetBrains Mono for kickers / rank numerals / IDs / button labels, Inter Tight for utility microcopy only.
- Show a mono kicker (`CARD N · CARD NAME · Q-XX`) above each question.
- Show a segmented progress indicator at the top of the screen with one umber active segment.
- Show BACK and CONTINUE buttons in the footer; CONTINUE is the umber primary.
- **Not** show "SAVED · AUTOSAVE" or any persistence-claiming language until persistence actually exists. Use "DRAFT IN PROGRESS" or omit the indicator.
- Render the Ranking primitive with large mono umber numerals on the left, serif label + em-dash + gloss in the center, grip handle on the right (44pt touch target), umber-wash on the active row.
- Be mobile-responsive: comfortable one-handed use at ~390pt viewport width with the typography sizes from `design-spec-v2.md` § 5.3 (mobile column).

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode. The project's `.claude/settings.local.json` has `permissions.defaultMode: "bypassPermissions"` plus a broad allowlist; launches in this project should be quiet by default.

This CC touches multiple code files, runs multiple bash commands, and may need a single `npm install` for `next/font/google` font subsets if the build pipeline requires it. Per-edit or per-bash approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user; otherwise the user runs this themselves).
- `npm install <font-package-if-required>` — only if the chosen font loading path requires a new dependency. Prefer `next/font/google` (already a Next.js built-in, no install needed). Document any install in the report-back.
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff`, `awk`, `sed`, `head`, `tail`, `wc`.

The agent should not pause to ask permission for these.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input. This prompt is self-contained.

If something is genuinely ambiguous, apply the most spec-faithful interpretation and flag the decision in the Risks / next-step recommendations section of the report-back — do not halt to ask.

If a prerequisite appears missing (a referenced file is absent, a check fails), attempt the canon-faithful equivalent, record the discrepancy in the report, and continue. Do not stop short.

Do not truncate the work to request user review. Only the final report-back goes to the user.

---

## Read First (Required)

**Design specification (the brief — read in full):**

- `docs/design-spec-v2.md` — primary brief. § 5.2 color tokens, § 5.3 typography, § 6 ranking primitive, § 6.4 row anatomy, § 8 question shell (header/body/footer), § 16 non-negotiables (especially #4 umber-only and #11 no-fake-autosave).
- `docs/design-spec-v1.md` — older spec; v2 supersedes where they differ. v1's § 1.3 spacing (8-unit grid) and § 1.4 hairlines are still authoritative since v2 doesn't restate them.

**Canon (read; do not edit):**

- `docs/canon/shape-framework.md` — the eight Shape cards' product names and what each card answers. The mono kicker uses these names (e.g., `CARD 09 · SACRED VALUES · Q-S1`). Note: Sacred Values is the user-facing card name in canon; "Compass" is the Shape framework's interpretive umbrella.
- `docs/canon/card-schema.md` — the canonical `card_id` taxonomy (conviction / pressure / formation / context / agency / sacred). Used to map `card_id` → kicker label.
- `docs/canon/question-bank-v1.md` — current question texts (already wired through `data/questions.ts`).
- `docs/canon/inner-constitution.md` — for context on what the Result page eventually becomes (CC-D3 will redesign this; CC-D leaves it as-is with baseline coherence).

**Existing code (will be edited):**

- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/components/Ranking.tsx`

**Existing code (do NOT edit):**

- `lib/types.ts`
- `lib/identityEngine.ts`
- `data/questions.ts`
- Any `docs/canon/*.md` file.

---

## Context

The running app at `localhost:3003` currently renders:

- A bare body with system fonts and a white background.
- Question text in default browser styling (no margins, no padding, no max-width, no mobile responsiveness).
- The Ranking primitive renders with reasonable defaults (rank numerals on the left, label + gloss in the center, grip on the right) but no design tokens — no umber, no warm paper, no editorial typography.
- After all questions, a result page surfaces signals and tensions in plain markup.

CC-D's job is the *first* design pass: the foundation. Tokens, typography, the QuestionShell, ProgressIndicator, and Ranking polish. After CC-D, every CC-010-and-after canon-and-code CC will inherit the shell automatically.

CC-D does **not** redesign the Result page or tension confirmation cards in detail. Those get a baseline-coherent treatment from the global tokens (paper background, ink text, serif body, mono metadata) but their full editorial layout ships in CC-D2 (tension card) and CC-D3 (Inner Constitution), each scoped narrowly to its own concerns.

The Claude Design Lab is currently iterating on the prototype reference files (`Who Are You.html`, `components.jsx`, `styles.css`) for `docs/design-prototype/`, but those have not yet landed. CC-D draws from `design-spec-v2.md` directly, without the prototype reference. When the prototype files arrive, a follow-up CC may refine details that diverged.

---

## Spec-Faithful Interpretation Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Tailwind v4 setup, design tokens via `@theme`

The project uses Tailwind CSS v4 (per `package.json`: `"tailwindcss": "^4"`, `"@tailwindcss/postcss": "^4"`). Tailwind v4 reads design tokens from CSS via the `@theme` directive in globals.css; there is no `tailwind.config.js`. Set up tokens in `app/globals.css` with both:

1. Bare CSS custom properties on `:root` for direct CSS use (`var(--paper)` etc.).
2. The `@theme` directive that maps the same values into Tailwind's color / font scales (so `bg-paper`, `text-ink`, `text-umber`, `font-serif`, `font-mono` work as utility classes).

The exact 12 color tokens from `design-spec-v2.md` § 5.2 must be present:

```
--paper, --paper-warm, --paper-deep,
--ink, --ink-soft, --ink-mute, --ink-faint,
--rule, --rule-soft,
--umber, --umber-soft, --umber-wash
```

### D-2: Fonts via `next/font/google`

Replace the existing Geist + Geist Mono fonts in `app/layout.tsx` with:

- **Source Serif 4** (Google Fonts) — `--font-serif`. Body, prompts, Inner Constitution, Four Voices statements, ranking option labels, tension card body.
- **JetBrains Mono** (Google Fonts) — `--font-mono`. Card kickers, question IDs, rank numerals, tension IDs, button labels, progress metadata.
- **Inter Tight** (Google Fonts) — `--font-sans`. Reserved for utility microcopy. Most surfaces don't need it.

Use `next/font/google` (no install needed; built into Next.js). Pass each font's `variable` (`--font-serif`, etc.) to the `<html>` className so the variables are available globally. In globals.css the `@theme` directive should reference these variables in `--font-family-serif`, `--font-family-mono`, `--font-family-sans` so Tailwind's `font-serif` / `font-mono` / `font-sans` classes resolve correctly.

### D-3: QuestionShell wrapper component

Create `app/components/QuestionShell.tsx`. The component takes:

- `kicker` (string; e.g., `"CARD 09 · SACRED VALUES · Q-S1"`)
- `prompt` (string; the question text)
- `helper` (optional string; the question's helper text)
- `currentIndex` (number; for the progress indicator)
- `totalCount` (number; for the progress indicator)
- `onBack` (optional callback; back button hidden if undefined)
- `canContinue` (boolean; controls Continue button enabled state)
- `onContinue` (callback)
- `children` (the question body — Ranking, forced-choice buttons, or freeform textarea)

Layout per `design-spec-v2.md` § 8:

- **Header region:** ProgressIndicator + mono kicker. Hairline rule below (`var(--rule-soft)`).
- **Body region:** large serif prompt, optional helper subtitle (mono small caps tracking +0.04em), then `children`. Card padding 36px 40px desktop, 24px 22px mobile.
- **Footer region:** BACK button on the left (mono caps, secondary; hidden if `onBack` is undefined), draft-status text in the center (mono, ink-mute — see D-7), CONTINUE button on the right (mono caps, umber primary background, paper text). Hairline rule above.

The component should be a single max-width container (~640px desktop, full-width mobile with side padding) centered on the page.

### D-4: ProgressIndicator component

Create `app/components/ProgressIndicator.tsx`. Takes `currentIndex` (0-indexed) and `totalCount`. Renders `totalCount` segmented hairlines in a horizontal row. Each segment is a 2px-tall hairline; the active segment (the one matching `currentIndex`) is umber (`var(--umber)`); completed segments are ink-mute (`var(--ink-mute)`); future segments are ink-faint (`var(--ink-faint)`). Segment width is fluid; gap between segments is 4px.

This matches the design-lab mock-up structure but corrects the color from blue to umber.

### D-5: Ranking primitive visual polish

Edit `app/components/Ranking.tsx`. Do **not** modify the pointer-events drag logic, keyboard handling, screen-reader announcements, or any existing accessibility behavior. Apply visual styling only:

- **Index column.** Large mono umber numerals (22px desktop, 18px mobile, per § 5.3). 1px hairline rule between index column and label column using `var(--rule)`.
- **Label column.** Serif label (16px desktop, 14px mobile) + em-dash + serif gloss in the same row. The em-dash and gloss are `var(--ink-soft)`; the label itself is `var(--ink)`.
- **Active row (during drag or keyboard pickup).** Background `var(--umber-wash)` (`rgba(138,74,31,0.08)`); 1px solid umber outline; soft elevation via `box-shadow: 0 1px 2px var(--rule)`.
- **Grip column.** Right-aligned. The grip glyph (≡) at `var(--ink-mute)` color, 44pt touch hit area. Focus-visible state: 2px solid umber outline with 2px offset. Cursor `grab`; cursor `grabbing` during drag.
- **Row spacing.** 10px gap between rows (per § 5.3).
- **Row hover (desktop only, no-touch media query).** Subtle ink-faint outline (1px) — does not change layout.
- **Touch targets.** Whole row is the drop target; grip is the drag-pickup target with `touch-action: none` during drag.

Preserve all CC-007 functional behavior including the 6px drag threshold, 150ms ease-out snap on release, and screen-reader live region announcements.

### D-6: Forced-choice and freeform question types

These types have less detailed treatment in `design-spec-v2.md` than ranking, so apply consistent shell styling without redesigning the interaction:

- **Forced-choice:** the existing buttons get token-based styling. Each option button: full-width within the body region; serif text 16px; ink color; paper-warm background (`var(--paper-warm)`); 1px hairline border (`var(--rule)`). Hover (desktop, no-touch): umber-wash background. Selected/active: umber border + umber-wash background. Vertical stack with 10px gap (matches Ranking row spacing). Touch target ≥ 44pt.
- **Freeform:** the existing textarea gets token-based styling. Paper-warm background, ink text, serif font, 18px desktop / 16px mobile. 1px hairline border `var(--rule)`. Focus-visible: 2px umber outline. Generous internal padding (16px). Helper text below in mono small caps `var(--ink-mute)`.

These are the minimum changes to keep forced-choice and freeform visually consistent with the polished Ranking. Detailed redesign of these types is future-CC scope.

### D-7: Footer status text — NO fake autosave

Per `design-spec-v2.md` § 16 non-negotiable #11 and § 8 important rule: persistence does not exist in v1. The footer status indicator must NOT read "SAVED" or "AUTOSAVE" or any phrase that implies durable persistence. Use one of:

1. **Omit the indicator entirely** — simplest. Footer has BACK and CONTINUE only.
2. **"DRAFT IN PROGRESS"** — mono small caps, ink-mute. Honest about non-persistence.

Pick option (2) — it visually balances the footer (left BACK, center status, right CONTINUE) and matches the spec's hint that status microcopy is reserved for utility. Do NOT use option (1) unless implementation forces it.

### D-8: Mobile responsiveness

Apply the desktop / mobile typography sizes from `design-spec-v2.md` § 5.3 (note: the size table is in v1's § 1.2 since v2 omits the explicit size column; use v1's table):

| Role | Desktop | Mobile |
|---|---|---|
| Card kicker (mono) | 11px | 11px |
| Prompt (serif) | 22–24px | 18–20px |
| Helper / sub (serif or mono) | 15px | 14px |
| Rank index (mono) | 22px | 18px |
| Rank row text (serif) | 16px | 14px |

Use Tailwind's responsive prefix (`md:`) at the standard 768px breakpoint. Mobile is the default; desktop sizes scale up.

Container max-width: 640px on desktop. Mobile uses full-width with 24px side padding (per spec § 1.3 mobile card padding).

### D-9: Mono kicker labels — `card_id` to display name mapping

The kicker reads `CARD N · CARD NAME · Q-XX`. The display name is the **canon Shape card name** for the question's `card_id`. Mapping:

| `card_id` | Kicker name |
|---|---|
| `conviction` | CONVICTION |
| `pressure` | PRESSURE |
| `formation` | FORMATION |
| `context` | CONTEXT |
| `agency` | AGENCY |
| `sacred` | SACRED VALUES |

Note: `card_id: context` covers Q-X1, Q-X2 (Weather), Q-X3 / Q-X4 (Trust). Per `shape-framework.md` § Card 5, Trust is an interpretive Shape grouping above the canonical `card_id`. For v1 kicker labels, use the `card_id` mapping above (`CONTEXT` for Q-X3 and Q-X4) — it matches what canon stores. Future CC may refine to use the Shape card name where it's more user-facing.

The "CARD N" number can be derived from the question's position in `data/questions.ts` (1-indexed). This may not match the canonical card sequence (Conviction is `card_id: conviction` but its position in the array depends on order). Acceptable approximation for v1.

### D-10: No new dependencies (preferred)

Use only `next/font/google` for fonts. Do not add new npm packages unless strictly required. If a package is added, document it in report-back with justification.

---

## Requirements

### 1. Update `app/globals.css` with design tokens and Tailwind v4 setup

Replace the current bare body styling with:

- A `@theme` block (Tailwind v4 directive) declaring the 12 color tokens from § D-1 plus the three font-family tokens from § D-2.
- A `:root` block declaring the same tokens as plain CSS custom properties so direct `var(--umber)` etc. usage works.
- A base `body` rule: `background: var(--paper); color: var(--ink); font-family: var(--font-serif), serif;`
- A `*:focus, *:focus-visible { outline: none; }` reset followed by per-component focus-visible umber outlines (so we don't lose accessibility — focus ring is just rebuilt with the umber accent).

### 2. Update `app/layout.tsx` with the three Google fonts

Replace `Geist` and `Geist_Mono` imports with:

- `Source_Serif_4` (Google Fonts, weight `400` and `600` minimum, with `style: ["normal", "italic"]` for the italic Four Voices statements that land in CC-010)
- `JetBrains_Mono` (weight `400` and `500`)
- `Inter_Tight` (weight `400` and `500`)

Each font uses a `--font-serif`, `--font-mono`, `--font-sans` CSS variable respectively. Pass all three variables to the `<html>` className.

Also update `<title>` and `<meta name="description">` to "Who Are You? — Self-discovery, mapped" or similar (current "Create Next App" is the Next.js placeholder).

### 3. Create `app/components/ProgressIndicator.tsx`

New component per § D-4. Takes `currentIndex`, `totalCount`. Renders segmented hairlines.

### 4. Create `app/components/QuestionShell.tsx`

New component per § D-3. Wraps every question with header (progress + kicker), body (prompt + helper + children), footer (back / draft-status / continue).

### 5. Apply visual polish to `app/components/Ranking.tsx`

Per § D-5. Visual changes only — pointer-event drag logic, keyboard handling, screen reader announcements, drag threshold, snap timing, all preserved exactly.

### 6. Restructure `app/page.tsx` to use QuestionShell

The existing question flow at `app/page.tsx` already has branches for forced / freeform / ranking and a result page. CC-D restructures the question rendering to:

- Compute the kicker from `card_id` and question index per § D-9.
- Mount `<QuestionShell>` around the question body.
- Inside the shell, route to the appropriate inner component based on `question.type`:
  - `forced` → token-styled buttons (per § D-6)
  - `freeform` → token-styled textarea (per § D-6)
  - `ranking` → existing `<Ranking>` component (which now has D-5 polish)
- Result page and tension confirmation cards keep their existing markup but inherit global typography + paper background. No detailed redesign in CC-D.

### 7. Mobile responsiveness

Apply the breakpoints from § D-8. Test by resizing the browser to ~390px width and confirming:

- Mono kicker stays 11px (legible at small width).
- Prompt drops to 18–20px serif.
- Ranking rows have comfortable thumb height.
- Footer buttons remain reachable.
- No horizontal scroll.

### 8. Verify in browser

Run `npm run dev` and confirm at `localhost:3003`:

- Page background is warm paper, not white.
- Body text is ink (very dark warm gray), not pure black.
- Mono kicker (`CARD N · NAME · Q-XX`) appears above each question in JetBrains Mono.
- Progress indicator at top has umber active segment, not blue.
- Ranking rows show large umber numerals, serif label + gloss, grip on right.
- Active drag row shows umber-wash background, not solid color.
- Forced-choice buttons styled consistently with paper-warm + serif text.
- Freeform textarea styled consistently with paper-warm.
- BACK and CONTINUE buttons in footer; CONTINUE is umber primary; "DRAFT IN PROGRESS" mono caps in center.
- Mobile (~390px viewport) renders without horizontal scroll, with comfortable thumb-target sizes.
- Drag-to-reorder still works (CC-007 functional behavior preserved).
- Keyboard reorder still works.
- Screen reader announcements still fire (verify with browser devtools accessibility tree).

If browser smoke testing is performed by the user instead of the agent, the agent must clearly state in report-back that browser testing was deferred.

### 9. Type check and lint

- `npx tsc --noEmit` — passes cleanly.
- `npm run lint` — passes cleanly.

---

## Allowed to Modify

**Code:**

- `app/globals.css` — replace contents per § 1.
- `app/layout.tsx` — replace fonts and metadata per § 2.
- `app/page.tsx` — restructure question rendering to use QuestionShell per § 6. Preserve all existing flow logic, state, and routing — only change the rendering shell.
- `app/components/Ranking.tsx` — visual styling only per § D-5. Functional behavior unchanged.
- `app/components/QuestionShell.tsx` — NEW file.
- `app/components/ProgressIndicator.tsx` — NEW file.

**Optional / if needed:**

- `app/components/QuestionShell.module.css` or equivalent stylesheet, IF inline className strings or Tailwind utilities don't suffice. Prefer Tailwind utilities + the `var(--token)` direct usages.

Do **NOT** modify:

- Any file under `docs/canon/`. CC-D is a code-only CC. No canon edits.
- Any file under `docs/` outside `canon/` (the design specs are reference, not editable).
- `lib/types.ts`, `lib/identityEngine.ts`, `data/questions.ts` — engine and data are stable.
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`.
- `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, `.claude/settings.local.json` — unless `npm install` of a strictly-required new dependency forces a `package.json` update. Document any such change in the report-back with justification.

---

## Out of Scope

This CC does not do any of the following. Each is a future-CC concern.

- **Tension card redesign.** The result-page tension confirmation UI keeps its existing markup. It will inherit the paper background and serif typography globally, but no dedicated layout work for tension cards. CC-D2 territory.
- **Inner Constitution / result page redesign.** The result page renders signals + tensions in plain markup. It inherits global typography but no dedicated editorial polish. CC-D3 territory.
- **Persistence / autosave.** No localStorage, no cookies, no backend storage. Footer status reads "DRAFT IN PROGRESS" — honest about non-persistence.
- **New questions, new signals, new tensions.** No canon changes.
- **Engine logic changes.** `signalsFromRankingAnswer`, `signalFromAnswer`, `detectTensions`, `applyStrengtheners`, `buildInnerConstitution` — all unchanged.
- **`lib/types.ts` changes.** Type system unchanged.
- **Animations beyond the existing 150ms snap.** No page transitions, no fade-ins, no progress-indicator animations.
- **Drop cap, decorative editorial flourishes.** Reserved for the Inner Constitution layout (CC-D3).
- **Tension "tell me more" disclosure.** Future CC.
- **MBTI label disclosure affordance.** v1 deferred.
- **Multi-user / mirror-types comparison.** v2.
- **A11y testing beyond functional verification.** No formal axe / WCAG audit in CC-D.
- **Q-S2 gloss fork resolution** (between v2 design-spec and canon `question-bank-v1.md`). Separate decision.
- **Body-map iconography.** No body-part icons drawn or imported. The body-map metaphor is verbal only in v1.

---

## Acceptance Criteria

1. `app/globals.css` declares the 12 color tokens from § D-1 in both `:root` and `@theme`, plus the three font-family tokens. Body uses paper background + ink color + serif font.
2. `app/layout.tsx` uses Source Serif 4, JetBrains Mono, and Inter Tight via `next/font/google`. The Geist fonts are removed. CSS variables `--font-serif`, `--font-mono`, `--font-sans` are passed to `<html>`.
3. `app/components/ProgressIndicator.tsx` exists and renders segmented hairlines with one umber active segment.
4. `app/components/QuestionShell.tsx` exists and provides header (progress + kicker) / body (prompt + helper + children) / footer (BACK / "DRAFT IN PROGRESS" / CONTINUE).
5. `app/components/Ranking.tsx` has visual polish per § D-5. All CC-007 functional behavior preserved (drag threshold, snap timing, keyboard, screen reader, focus management).
6. `app/page.tsx` mounts `<QuestionShell>` around every question. Forced-choice, freeform, and ranking branches all render through the shell.
7. Mobile viewport (~390px) renders without horizontal scroll. Typography sizes match § D-8 mobile column.
8. Footer never shows "SAVED" or "AUTOSAVE" — uses "DRAFT IN PROGRESS" or omits.
9. Umber is the only accent color used for emphasis (rank numerals, active progress segment, primary button, focus rings, active row outline). No blues, greens, or other accents introduced.
10. Manual smoke test in a browser at `localhost:3003`: every question type renders cleanly through the shell; drag-to-reorder still works on Q-S1, Q-S2, Q-X3, Q-X4, Q-C4; keyboard reorder still works; mobile viewport is comfortable. (Or browser testing is explicitly deferred to the user.)
11. `npx tsc --noEmit` passes cleanly.
12. `npm run lint` passes cleanly.
13. No file outside the Allowed to Modify list has been edited (with the documented exception that a `package.json` update may occur if a strictly-required dependency is added).
14. No canon file has been touched. No engine logic has been changed. No question content has been changed.

---

## Report Back

Return a single markdown block with the following sections, in order:

1. **Files changed** — bullet per file with one-line description. Note any new files created.
2. **Tokens & fonts** — quote the new `app/globals.css` `@theme` and `:root` blocks (or summarize if long). Confirm all 12 color tokens and three font tokens are declared. Confirm the body uses paper + ink + serif.
3. **Font swap** — quote the relevant section of the new `app/layout.tsx` showing the three new fonts and how the variables flow to `<html>`. Confirm Geist + Geist Mono are removed.
4. **ProgressIndicator** — show the component code (or relevant excerpt). Confirm umber active segment.
5. **QuestionShell** — show the component code (or relevant excerpt). Confirm header / body / footer structure with kicker, prompt, helper, BACK, "DRAFT IN PROGRESS" status, CONTINUE.
6. **Ranking polish** — quote the styling changes (className strings or styled-block excerpts). Confirm umber rank numerals, umber-wash active row, grip styling. Confirm all CC-007 functional behavior preserved (cite the specific functions / refs that were left untouched).
7. **page.tsx restructure** — show how the QuestionShell is mounted and how `card_id` → kicker name mapping is implemented. Confirm forced / freeform / ranking branches all render through the shell.
8. **Mobile responsiveness** — describe the breakpoint strategy (Tailwind `md:` prefix, fluid typography, 24px side padding mobile, 640px max-width desktop). Confirm tested at ~390px viewport (or note if deferred).
9. **Smoke-test results** — state whether browser testing confirmed paper background, umber accents, mono kickers, polished ranking, mobile responsiveness. If testing was deferred to the user, say so explicitly.
10. **Type check and lint** — output of `npx tsc --noEmit` and `npm run lint`.
11. **Scope-creep check** — explicit confirmation that:
    - No canon file was modified.
    - No engine logic was changed (`lib/identityEngine.ts` byte-identical for the functions named in § D-5 paragraph 1).
    - No new questions were added; `data/questions.ts` byte-identical.
    - No tension card or Inner Constitution / result page redesign was attempted (those are future CC-D2/D3 scope).
    - No autosave language was used in the footer.
    - No new color was introduced beyond the 12 tokens (no blues, greens, etc.).
    - No npm package added (or, if one was added, named with justification).
12. **Risks / next-step recommendations** — anything that surfaced during execution. Specifically:
    - If the tension confirmation card or result page now looks visually inconsistent next to the polished question shell, flag for CC-D2/D3 prioritization.
    - If specific spec details from `design-spec-v2.md` were ambiguous (e.g., exact button radius, exact hairline width, exact progress-segment width) and the executing agent made a judgment call, name them and the choice made.
    - If Q-S2 / Q-X4 / Q-C4 helperless-row visual asymmetry (some rankings have helper text, some don't) creates a layout issue, flag for follow-up copy-polish CC.
    - If anything in the `next/font/google` setup required a workaround (font subset issues, italic loading, etc.), document.
    - Any other observation worth surfacing.
