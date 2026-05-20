# CC-117 — Styled admin preview + port user-mode suppression into the React report

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
lowest-blast-radius interpretation, proceed, and flag it. Permission
bypass is on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- Two coordinated changes: (A) the admin preview renders the styled React
  report driven by the toggle, not raw markdown; (B) the styled React
  report honors `renderMode` so user mode actually suppresses the clinical
  grip/movement detail (mirroring the markdown CCs).

## Context — two problems, one root cause

1. **Admin preview shows raw markdown.** CC-113 added the Clinician/User
   toggle but rendered the preview as a raw `<pre>` markdown block
   (`app/admin/sessions/[id]/page.tsx:275`) because there was no markdown
   renderer. It's live in production on the admin tool and looks broken.
2. **The styled React report ignores the user-mode suppression.** The
   user-facing report (`InnerConstitutionPage`, rendered on `/report` and
   `/assessment`) renders the grip raw-field panel (Grip Pattern /
   `subRegister` / Confidence at `InnerConstitutionPage.tsx:~872–934`) and
   the Movement grip-component bullets (`grippingPull.signals` at
   `~694–700`) **unconditionally** — not gated by `renderMode`. So
   CC-111/114/115 (which only touched the *markdown* renderer) never
   reached the on-screen report. The styled report users see still shows
   the clinical grip panel and movement bullets.

Root cause: there are two renderers — the markdown (`renderMirrorAsMarkdown`,
where CC-111/114/115 live) and the React components (what users see). They
diverged. This CC brings the React report in line and points the admin
preview at it.

## Read First (Required)

- `app/admin/sessions/[id]/page.tsx` — `AdminExportPanel` (the `previewMode`
  state ~L109, `buildMarkdown`, the `<pre>` at L275, Copy/Download), and
  the `SessionDetailPage` render of `<InnerConstitutionPage … renderMode="clinician">`
  (~L502/584). Note the `// CC-REACT-USER-MODE-PARITY` comment promising
  "default to user mode (suppression on)" — this CC makes that true.
- `app/components/InnerConstitutionPage.tsx` — the Movement grip block
  (~L694–700, `grippingPull.signals`) and the Grip section (~L860–935:
  Grip Pattern / `subRegister` / Confidence `<dt>/<dd>`), and how the warm
  grip narrative (`gripParagraphLlm`) renders vs. the field panel.
- `lib/renderMirror.ts` — `emitGripSection` (CC-111 + CC-115) and the
  Movement `grippingPull.signals` gate (CC-114) as the reference behavior
  to mirror in React.
- `tests/audit/reactOnScreenLlmRender*.ts` — the React-surface audit;
  expect it may need an intentional update (flag, like prior baseline
  re-anchors).

## Tasks

### A. Admin preview → styled React, toggle-driven
1. Lift `previewMode` so it controls the styled `<InnerConstitutionPage>`
   preview's `renderMode` (clinician|user), not just the markdown build.
   (Lift the state from `AdminExportPanel` to `SessionDetailPage`, or share
   it — minimal refactor.)
2. **Remove the raw `<pre>` markdown preview.** Keep the Copy/Download
   Markdown buttons (still mode-aware via `buildMarkdown(previewMode)`) —
   they're the export affordance; the *preview* becomes the styled report.
3. The styled preview now flips Clinician↔User with the toggle and shows
   the real on-screen rendering (images, charts, cards).

### B. Port user-mode suppression into `InnerConstitutionPage`
4. Gate the **grip raw-field panel** (Grip Pattern / Sub-register /
   Confidence block) on `renderMode === "clinician"` — mirror CC-111. In
   user mode, keep the warm grip narrative; drop the labeled fields.
5. Gate the **Movement grip-component bullets** (`grippingPull.signals`
   list) on `renderMode === "clinician"` — mirror CC-114. User mode keeps
   the headline Grip metric, drops the component list.
6. If the React grip card can render empty in user mode when there's no
   warm narrative (the CC-115 case), apply the same prose fallback so it's
   never an empty section.
7. Confirm `renderMode` defaults to `"user"` on `/report` + `/assessment`
   (it does) so these suppressions are live for end users; clinician
   (admin) keeps the full detail.

## Allowed to Modify (exhaustive)

- `app/admin/sessions/[id]/page.tsx`
- `app/components/InnerConstitutionPage.tsx`
- `tests/audit/reactOnScreenLlmRender*.ts` (anchor refresh only, if the
  intentional React change breaks an assertion — flag it)

Nothing else. No markdown renderer dependency, no `renderMirror.ts`, no
engine/derivation change, no other component.

## Out of Scope

- Adding a markdown-rendering library.
- Any change to the markdown renderer or engine composers.
- The Disposition panel React collapse (separate; markdown already
  collapses it — note if it differs in React but do not change here).
- Consolidating the duplicated suppression logic between markdown and React
  into a shared mode-policy (worthwhile later; not this CC).
- CC-116 recitation work.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- `npm run dev` to smoke the admin page (toggle flips styled preview) and a
  user route
- the React-surface + two-tier audits
- `grep` / `rg` read-only verification

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. The admin export panel no longer renders a raw `<pre>` markdown block;
   the preview is the styled `<InnerConstitutionPage>` and flips
   Clinician↔User with the toggle. Copy/Download still emit mode-aware
   markdown.
3. In the styled report, **user mode** no longer shows the grip raw-field
   panel (no Sub-register / Confidence / Grip Pattern label rows) or the
   Movement grip-component bullets; **clinician mode** still shows them.
   Prove with both toggle states.
4. `/report` + `/assessment` (default user mode) render the suppressed
   (cleaner) styled report — verify the grip panel + movement bullets are
   gone there.
5. The markdown export path is unchanged (twoTier clinician byte-identity
   still holds — this CC doesn't touch `renderMirror.ts`).
6. No file outside the Allowed-to-Modify list edited.

## Report Back

- The state-lift + how the styled preview is driven by the toggle.
- Confirmation the raw `<pre>` is gone and Copy/Download still work per mode.
- Before/after of the grip + movement blocks in the styled report, both
  modes.
- Whether the React grip card needed the empty-section fallback.
- Any `reactOnScreenLlmRender` anchor change (flagged).
- Note for follow-up: the suppression logic now lives in BOTH the markdown
  renderer and the React components — recommend a shared mode-policy CC to
  prevent drift.
