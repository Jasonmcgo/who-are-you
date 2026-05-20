# CC-113 — Admin Clinician/User markdown toggle (review instrument)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On genuine ambiguity, apply the
lowest-blast-radius interpretation, proceed, and flag it in the Report Back.
Permission bypass is on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or in-session `/permissions` →
bypass. `.claude/settings.local.json` already sets bypass by default.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- UI-only change on the admin session page. No engine, no render-logic, no
  content changes — the markdown renderer already honors `renderMode`.

## Context

The admin session page (`app/admin/sessions/[id]/page.tsx`) currently shows:

1. An **export panel** (`ExportPanel`, ~L87–235) with "Copy as Markdown" /
   "Download Markdown". Its `buildMarkdown()` (L106) calls
   `renderMirrorAsMarkdown({...})` **without** a `renderMode` arg, so it
   defaults to `"user"`. There is no mode control.
2. A **report preview** below — the React `<InnerConstitutionPage … />`
   pinned to `renderMode="clinician"` (L502).

The owner wants to review the **Clinician vs User** reports side-by-side.
The important nuance: all recent effectiveness work (CC-110 warm V3 prose,
CC-111 grip suppression, CC-112 interpretation-over-recitation) lives in the
**markdown** path (`renderMirrorAsMarkdown`). The React preview is a
*separate* render path and does NOT reflect those markdown changes. So a
useful review toggle must operate on the **markdown export**, not the React
component.

This CC adds a Clinician | User toggle to the export panel that (a) controls
which mode `buildMarkdown` produces (so Copy/Download honor it) and (b)
renders a live preview of the selected-mode markdown, so the owner can flip
and see exactly what each surface emits.

## Read First (Required)

- `app/admin/sessions/[id]/page.tsx` — `ExportPanel` (L87–235:
  `buildMarkdown` L106, `handleCopyMarkdown`, `handleDownloadMarkdown`,
  `buildFilename`), the JSX (L160–214), and the main render passing
  `renderMode="clinician"` (L502).
- `lib/renderMirror.ts` — confirm `renderMirrorAsMarkdown` accepts
  `renderMode: "user" | "clinician"` (it does; default user).
- `package.json` — check whether a markdown renderer is already a
  dependency (e.g. `react-markdown`, `marked`, `markdown-it`). **Do not add
  one.** If none exists, render the preview as a styled monospace `<pre>`
  (raw markdown is fully adequate for review).

## Tasks

1. **Toggle state.** Add a `previewMode: "clinician" | "user"` state to
   `ExportPanel` (default `"clinician"` — the admin's primary reference).
   Render a small two-option toggle styled consistently with the existing
   mono/umber admin controls.
2. **Mode-aware build.** Change `buildMarkdown()` to take the mode and pass
   `renderMode: previewMode` to `renderMirrorAsMarkdown`. Copy/Download use
   the selected mode. Append the mode to the download filename (e.g.
   `…-clinician.md` / `…-user.md`) so saved files are distinguishable.
3. **Live preview.** Render the selected-mode markdown in the panel below
   the buttons so flipping the toggle visibly changes the output. Use an
   existing markdown renderer only if already present; otherwise a styled
   `<pre>` (wrap, readable serif/mono, bounded max-height with scroll).
4. **Leave the React `<InnerConstitutionPage>` preview untouched** — it is a
   separate render path (out of scope; note it in the Report Back).

## Allowed to Modify (exhaustive)

- `app/admin/sessions/[id]/page.tsx`

Nothing else. No engine, no `renderMirror.ts`, no new dependency, no other
component.

## Out of Scope

- The React `<InnerConstitutionPage>` preview render path / its renderMode.
- Any change to `renderMirrorAsMarkdown` or engine logic.
- Adding a markdown-rendering dependency.
- PDF / print.
- Third-person voice work.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- `npm run dev` to smoke the page
- `grep` / `rg` read-only verification

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. The export panel shows a Clinician | User toggle.
3. With **Clinician** selected, Copy/Download/preview contain clinician-only
   markers (e.g. the raw Grip field panel `**Sub-register:**` /
   `**Confidence:**`, the full Disposition panel, the metadata bullets).
   With **User** selected, those are absent and the warm/interpreted prose
   shows. Prove with a before/after of the two preview states for one
   session.
4. Download filename reflects the selected mode.
5. The React `<InnerConstitutionPage>` preview is unchanged.
6. No file outside the Allowed-to-Modify list edited.

## Report Back

- The toggle implementation + where preview renders.
- Whether a markdown renderer existed or a `<pre>` was used.
- Clinician-vs-User preview proof (the differing markers).
- Confirmation the React preview path is untouched.
- Any ambiguity decision.
