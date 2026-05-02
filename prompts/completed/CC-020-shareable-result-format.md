# CC-020 — Shareable Result Format (Print + Markdown Export)

## Launch Directive

You are executing CC-020. This CC adds two shareable output formats to the Inner Constitution result page: **print-friendly view** (rendered as PDF via the browser's native print dialog) and **Markdown export** (copyable to clipboard or downloadable as `.md` file). No engine logic changes. No database changes. No new dependencies. Pure rendering layer.

The motivation is real-user-driven: after a session is taken, the user (or a researcher running interviews) needs to send the result to the test-taker for review and confirmation on their own device. Today the result lives only in the browser tab where it was generated; the UX gap is *"my daughter just took the test, I want her to read this carefully on her phone, but there's no clean way to share it."*

This CC ships the smallest viable surface to close that gap: native print + Markdown text. Live-share URLs (a `/sessions/[uuid]` route rendering a saved result) are explicitly deferred to CC-021 (deployment) — they don't make sense while the project is local-only.

Sequenced after CC-019 (persistence) lands. Independent of v2.5 / v2 architectural work; can ship in any order alongside them.

## Bash Authorized

Yes. Use the shell for `tsc`, `eslint`, dev-server smoke runs. No new package installs needed for this CC; surface in the report if you find one is genuinely required.

## Execution Directive

### Item 1 — "Share this reading" UI block

Add a new block to `app/components/InnerConstitutionPage.tsx` (or wherever the result currently renders), positioned **below** the existing Save block from CC-019. Visual register: same as the Save block — italic label, small button row, subtle separation from the body content.

**Block text:**

> *"Share this reading. Print or export to send to whoever should see it."*

**Three buttons:**

1. **Print** — opens the browser's native print dialog (calls `window.print()`).
2. **Copy as Markdown** — copies the rendered Mirror as a Markdown string to the user's clipboard via `navigator.clipboard.writeText()`. Brief inline confirmation appears: *"Copied to clipboard"* (fades after ~2 seconds).
3. **Download Markdown** — triggers a browser download of the same Markdown content as a `.md` file. Filename pattern below.

**Belief-anchor toggle** below the buttons:

A small checkbox: *"Include belief anchor text"* (default checked). When unchecked, the markdown export and the print version both omit the Q-I1 / Q-I1b freeform text but keep the structural Keystone Reflection summary. Rationale: the belief anchor is the user's most personal freeform — some users may want to share the result with a third party but omit the specific belief they named. Default on (the user owns their own data); toggleable for cases where they don't want it included.

The toggle state lives in component-local React state. Both the markdown export and the print CSS read from it.

**Filename pattern for downloads:**

```
inner-constitution-{name-slug}-{date}.md
```

- `{name-slug}` — kebab-case slug from `demographics.name_value` if specified, lowercased. If name is `prefer_not_to_say` or `not_answered`, omit this segment entirely.
- `{date}` — `YYYY-MM-DD` from the session's `created_at` (or the current date if no saved session, falling back to a fresh render).

Examples:

- `inner-constitution-claire-2026-04-26.md` (with name)
- `inner-constitution-2026-04-26.md` (without name)

### Item 2 — Markdown rendering

Create `lib/renderMirror.ts` exporting a function:

```ts
export function renderMirrorAsMarkdown(args: {
  constitution: InnerConstitution;
  demographics?: DemographicSet | null;
  includeBeliefAnchor: boolean;
}): string;
```

The function consumes the existing `InnerConstitution` shape (already produced by `buildInnerConstitution` in `lib/identityEngine.ts`) and produces a structured Markdown document. Walk the structure section by section and emit clean Markdown.

**Section order in the output**, matching the Mirror's rendered order:

1. **Header** — title (`# The Inner Constitution`), italic subtitle (`*a possibility, not a verdict*`), optional name line (`### For: {name}` if demographics specified a name).
2. **Core Pattern** (`## Your Core Pattern`) — the existing prose paragraph.
3. **Top 3 Gifts** (`## Your Top 3 Gifts`) — numbered list.
4. **Top 3 Traps** (`## Your Top 3 Traps`) — numbered list.
5. **What Others May Experience** (`## What Others May Experience`) — prose paragraph.
6. **When the Load Gets Heavy** (`## When the Load Gets Heavy`) — prose paragraph.
7. **Allocation Gaps** (`## Allocation Gaps`) — italic subtitle, then one paragraph per fired allocation tension (T-013, T-014, T-015 instances). Render only if any of them fired; omit the entire section if not.
8. **Your Next 3 Moves** (`## Your Next 3 Moves`) — numbered list.
9. **Keystone Reflection** (`## Keystone Reflection`) — italic subtitle, then:
   - Belief anchor (`> {anchor text}` as blockquote) — only if `includeBeliefAnchor === true` AND a belief anchor exists.
   - The three structured-source dimensions: Likely value, Wording temperature, Openness to revision — rendered as a small bulleted list.
   - The contextual prose paragraph from `generateBeliefContextProse`.
   - Skip the entire Keystone section if no belief anchor exists (Case C from CC-017).
10. **Map** (`## Map — go deeper`) — italic subtitle, then **all eight cards expanded**, each as `### Lens — Eyes` etc., with the Strength / Trap / Next move sub-sections rendered as `**Strength**`, `**Trap**`, `**Next move**` headings + their prose. The Conviction card includes a `**Posture**` sub-section.
11. **Path · Gait** (`## Path — Gait`) — italic subtitle, then Work / Love / Give / Growth move sub-sections.
12. **Growth Path** (`## Growth Path`) — prose paragraph.
13. **Conflict Translation** (`## Conflict Translation`) — prose paragraph.
14. **Mirror-Types Seed** (`## Mirror-Types Seed`) — prose paragraph.
15. **Open Tensions** (`## Open Tensions`) — list of fired tensions, each as `### {tension_id} — {type}` heading + the user_prompt prose. Skip the interactive Yes/Partially/No affordance entirely (this is read-only export).
16. **Footer** — small italic line: `*Generated {YYYY-MM-DD HH:MM}. The model proposes — you confirm.*`

**Markdown formatting rules:**

- Use proper heading levels (`#`, `##`, `###`).
- Use Markdown list syntax (`1.`, `-`).
- Use blockquote (`>`) for belief anchor.
- Use bold (`**text**`) sparingly — for sub-section headers within the Map cards.
- Use italic (`*text*`) for the subtitle lines (matches the rendered HTML's italic register).
- Avoid HTML tags — pure Markdown only, so the output renders cleanly in any Markdown viewer (GitHub, Notion, email clients, plaintext).
- Insert a blank line between paragraphs and between heading and body for proper Markdown line-break handling.

**Dual-T-015 rendering:** if multiple T-015 instances fire (per CC-016b), render each as its own paragraph in the Allocation Gaps section. Use the `signals_involved` or the prompt text to differentiate which domain (money-wider vs energy-inward) — render with subheadings like `### Allocation Gap — Money (Wider Circle)` and `### Allocation Gap — Energy (Inward)` so the export doesn't look like a duplicate render error. (This is a small UX polish that also benefits the live page; whether to also apply it to the on-screen rendering is a CC-020a item — out of scope here. Just make the markdown clean.)

### Item 3 — Print CSS

Add a `@media print` block to `app/globals.css`. Print CSS overrides:

**Hide:**

- The Save block (`[data-print-hide="save"]` or similar selector).
- The Share block (`[data-print-hide="share"]`).
- All interactive button rows on tensions (Yes / Partially / No / Explain — the affordances).
- The Keystone confirmation panel's Yes / Different / Skip rows.
- The "tell me more" buttons on tensions.
- The "save →" and "start over" buttons.
- The Inner Constitution Page Header's nav controls if any.

**Expand:**

- All eight Map cards — override any `display: none`, `max-height: 0`, or `aria-expanded="false"` styling that hides collapsed panel content. The print version shows everything.
- Any conditionally-hidden prose sections.

**Restyle:**

- Background → white.
- Body text → black, slightly smaller font (12pt) for paper readability.
- Headings stay font-serif but at slightly reduced sizes for paper.
- Insert page breaks (`page-break-before: always` or `break-before: page`) before each major H2 heading so each major section starts on a fresh page if there's room — but use `page-break-inside: avoid` on shorter blocks (the Top 3 Gifts/Traps/Moves lists) to keep them from splitting awkwardly.
- Hide page-fixed UI elements (the floating bottom CTA bar, any sticky headers).

**Add `data-print-hide` attributes** to the relevant blocks in the React components so the print CSS has clean selectors. Use a small set of canonical values:

- `data-print-hide="save"` — Save block.
- `data-print-hide="share"` — Share block.
- `data-print-hide="interactive"` — interactive buttons that should not appear in print (tension Yes/Partially/No, Keystone Yes/Different/Skip, etc.).

**Add `data-print-expand` to collapsed Map cards** so the print CSS knows to override their collapse state.

**`@media print { @page { margin: 1in; } }`** for sensible paper margins.

**Belief anchor in print:** when the toggle is unchecked, the React component conditionally renders the belief anchor block with `data-print-hide="belief-anchor"` (or omits it entirely). Print CSS hides it via the same mechanism.

### Item 4 — Clipboard + download mechanics

Two button handlers in the Share block:

**Copy:**

```tsx
async function handleCopyMarkdown() {
  const md = renderMirrorAsMarkdown({ constitution, demographics, includeBeliefAnchor });
  await navigator.clipboard.writeText(md);
  setCopiedFlash(true);
  setTimeout(() => setCopiedFlash(false), 2000);
}
```

**Download:**

```tsx
function handleDownloadMarkdown() {
  const md = renderMirrorAsMarkdown({ constitution, demographics, includeBeliefAnchor });
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename(demographics, sessionDate);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

`buildFilename` is a small helper in `lib/renderMirror.ts` that produces the filename per the pattern in Item 1.

**Print:**

```tsx
function handlePrint() {
  window.print();
}
```

The browser's native print dialog handles the rest. The user picks "Save as PDF" or "Print to printer" from there.

### Item 5 — Behavior independent of save state

The Share block renders **regardless of whether the user has clicked Save**. A user who has not saved can still print or export their result; the export reflects the current rendered InnerConstitution from React state. A user who has saved sees the same Share buttons; no change.

The save flow and the share flow are independent. Saving writes to Postgres; sharing produces a portable copy. They don't depend on each other.

If `demographics` is `null` (user hasn't gone through the Identity & Context page), the markdown export still works — it just omits the name in the header and uses the no-name filename pattern.

## Allowed-to-Modify

- `app/components/InnerConstitutionPage.tsx` — add the Share block below the Save block. Add `data-print-hide` attributes to the Save and Share blocks. Wire the three buttons. Manage the `includeBeliefAnchor` toggle state.
- `app/components/MapSection.tsx` (or wherever the eight Map cards render) — add `data-print-expand` attributes to collapsed cards so print CSS can force-expand them. Do not modify the cards' on-screen behavior.
- `app/components/TensionCard.tsx` — add `data-print-hide="interactive"` to the Yes/Partially/No/Explain button row.
- `app/components/KeystoneReflection.tsx` — add `data-print-hide="interactive"` to the Yes/Different/Skip rows.
- `app/globals.css` — add the `@media print { ... }` block. Existing styles untouched.
- `lib/renderMirror.ts` — NEW file containing `renderMirrorAsMarkdown` and `buildFilename`.
- `lib/types.ts` — no new types needed (consumes existing `InnerConstitution` and `DemographicSet`).

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify any engine logic — `lib/identityEngine.ts`, `lib/beliefHeuristics.ts`, signal extraction, tension detection, per-card derivation, prose generation. Read-only.
- **Do not** modify any database schema, migration, or save logic.
- **Do not** modify any question definition in `data/questions.ts` or any demographic field in `data/demographics.ts`.
- **Do not** modify any canon file under `docs/canon/`.
- **Do not** introduce a `/sessions/[uuid]` route or any live-share URL feature. That's CC-021 territory (deployment + privacy + URL access).
- **Do not** introduce email integration, social-share buttons (Twitter/Facebook/etc.), or any third-party sharing service. The browser-native Print + clipboard + download triggers are the entire scope.
- **Do not** introduce any new npm dependency. Use browser-native APIs (Blob, URL, clipboard, document.execCommand fallback if needed).
- **Do not** modify the on-screen Mirror prose — only the **print** version restyles it. The live page renders identically before and after this CC.
- **Do not** modify any tension detection block or the dual-T-015 rendering on the live page (the differentiated subheadings are markdown-export-only in this CC).
- **Do not** persist the `includeBeliefAnchor` toggle — it's session-local React state. No database column.
- **Do not** add analytics or telemetry on Print / Copy / Download events.
- **Do not** modify build configuration files or AGENTS.md / CLAUDE.md / README.

## Acceptance Criteria

1. **Share block renders** below the Save block on the result page. Three buttons visible (Print, Copy as Markdown, Download Markdown). Toggle for "Include belief anchor text" visible below buttons (default checked).
2. **Print** button opens the browser's native print dialog. The print preview shows: clean white background, hidden Save/Share blocks, hidden interactive button rows, all eight Map cards expanded, sensible page breaks before major sections, no orphan-list issues.
3. **Copy as Markdown** copies a complete structured Markdown document to the clipboard. Inline confirmation flashes briefly. Pasting into a Markdown viewer (GitHub README preview, Notion, etc.) renders cleanly.
4. **Download Markdown** triggers a `.md` file download with the spec'd filename pattern. Open the file in any text editor; it should be readable as plaintext and render properly when viewed as Markdown.
5. **Filename pattern** correct: `inner-constitution-{name-slug}-{YYYY-MM-DD}.md` when name is specified; `inner-constitution-{YYYY-MM-DD}.md` when name is `prefer_not_to_say` / `not_answered`. Verify with a smoke session of each.
6. **Belief anchor toggle works**: when checked, the markdown export includes the Q-I1 / Q-I1b text as a blockquote in the Keystone section; when unchecked, the blockquote is omitted but the structural three-dimension summary remains. Same for the print version.
7. **Section order in markdown matches Item 2** spec verbatim. Every section that's rendered on screen appears in the markdown (when applicable).
8. **Dual T-015 differentiated** in the markdown export — render each instance with a domain-specific subheading. The live page may still show them un-differentiated; the export is the only required differentiation in this CC.
9. **No save dependency** — Print / Copy / Download all work whether or not the user has clicked Save. Verify: walk a session to result, ignore Save, click Download — file downloads with the current date and no-name filename.
10. **Demographics included when available** — name appears in the markdown header line if demographics specified a name. Other demographic fields do not appear in the export by default (they're for research, not for the user's own copy).
11. **Print CSS does not affect screen rendering** — the live page looks identical before and after this CC. Verify by viewing the result page in a browser after CC-020 lands; nothing should look different until you click Print.
12. **TSC clean.** `npx tsc --noEmit` exits 0 with no output.
13. **Lint clean.** `npm run lint` exits 0 with no warnings.
14. **No file outside the Allowed-to-Modify list is modified.**
15. **Existing flow regressions clean** — Save flow, demographics page, save transaction, all CC-016/016b/017/018/019 features work identically.

## Report Back

1. **Files changed** — file-by-file summary.
2. **Markdown export sample** — paste the full markdown output for a smoke session covering all sections (engine produces all sections; allocation gaps fire; belief anchor exists). Include the version with `includeBeliefAnchor: true` and the version with `includeBeliefAnchor: false` so the diff is visible.
3. **Print CSS smoke** — describe (or screenshot if you have visual capture) the print preview rendering. Confirm: hidden interactive elements, expanded Map cards, page breaks present, white background, no sticky/floating UI in the print view.
4. **Filename pattern verification** — paste two examples: one with a specified name, one without.
5. **Belief anchor toggle verification** — confirm the markdown export changes when the toggle is flipped, and confirm the print CSS hides the anchor block when the toggle is unchecked.
6. **Save independence** — confirm the Share block and its buttons work for an unsaved session.
7. **Dual T-015 rendering in markdown** — paste the markdown segment for a smoke session where two T-015 instances fire, showing the differentiated subheadings.
8. **No screen-render regression** — confirm the live page looks identical to before this CC. Walking a session to result and visually comparing is enough; if you noticed any visual change in the on-screen UI, surface it.
9. **TSC + lint** — exit codes.
10. **Scope-creep check** — confirm only allowed files were modified.
11. **Risks / next-step recommendations** — anything you noticed during the work that warrants a follow-up CC. Specifically: any rendering edge case for sessions with very few signals, any print-CSS quirk on Safari vs Chrome, any clipboard API issue on Firefox.

## Notes for the executing engineer

- The `renderMirrorAsMarkdown` function should be **pure** — no side effects, no DOM access, no fetching. Pass in the InnerConstitution + demographics + toggle, get back a string. Easy to test in isolation.
- Print CSS is famously tricky across browsers. Aim for clean rendering on **Chrome and Safari first** (the user's primary browsers); Firefox is secondary. If you find any browser produces awkward output, flag in the report.
- The clipboard API requires a secure context (HTTPS or localhost). Localhost dev should work fine; cloud deploy in CC-021 will work over HTTPS. No fallback to `document.execCommand("copy")` needed for this stage.
- The `data-print-hide` and `data-print-expand` attribute pattern is preferred over inline class additions because it keeps the print-specific concerns separable from the on-screen styling. Use the attributes consistently across the components you modify.
- The dual T-015 differentiation is a cleanup that came up during real-user testing of CC-019 — Jason's daughter's result rendered two T-015 instances that visually looked like duplicates. The differentiated subheadings (`Money (Wider Circle)` / `Energy (Inward)`) are the markdown-export's contribution to that fix; the on-screen rendering stays as-is for CC-020 and may be polished in a future CC.
- **Browser smoke deferred to Jason.** Your smoke testing should cover: markdown rendering (paste output verbatim), filename generation, belief-anchor toggle, save-independence, TSC + lint, no-screen-regression. UX/visual verification of the print preview is Jason's; produce the changes that should make the print preview clean and let him verify.
