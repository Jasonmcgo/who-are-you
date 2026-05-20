# CC-111 — Suppress the raw Grip diagnostic fields in user-mode markdown

## Execution mode

Proceed without pausing for permission dialogs. Complete this in a single
pass. Do not stop for confirmation between steps. On genuine ambiguity,
apply the canon-faithful interpretation, proceed, and flag it in the
Report Back. This session runs with permission bypass; the discipline
below is about scope, not about asking.

## Launch Directive

Launch with `claude --dangerously-skip-permissions`, or in-session
`/permissions` → bypass. The project `.claude/settings.local.json` already
sets `defaultMode: "bypassPermissions"`.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- Engine remains source of truth. This CC changes *which surface sees a
  block*, not the block's content or any derivation.
- Clinician output must remain byte-identical. User output loses only the
  raw diagnostic fields named below.
- On ambiguity, prefer the lowest-blast-radius option and record it.

## Context

`emitGripSection` (`lib/renderMirror.ts:174`) renders the Grip section in
two parts:

1. A **warm grip narrative** — the `gripParagraphLlm` blockquote when the
   LLM pass resolved (`> *…*`), or an engine-prose fallback (the
   `proseMode === "hedged"` paragraph, or the rendered-mode block).
2. An **unconditional raw-field block** (~L245–262), emitted in *all*
   modes:
   - `**Grip Pattern:** {label}`
   - `**Underlying Question:** {question}`
   - `**Named grips contributing to this read:** {list}`
   - `**Sub-register:** {value}`
   - `**Confidence:** {value}`

Part 2 is the most clinical block in the user-facing artifact —
"Sub-register: relational", "Confidence: medium", a labeled question/
contributing-grip dump. The **gold-standard reports do not show it**: in
the gold standard, grip lives as *prose* (woven into "When the Load Gets
Heavy", which is already covered by the launchPolishV3 rewrite), not as a
labeled field panel. The raw breakdown is a clinician/diagnostic artifact.

This CC gates Part 2 to clinician mode. User mode keeps the warm narrative
(Part 1) and drops the raw fields. `emitGripSection` does not currently
receive `renderMode`, so it must be threaded in.

This is the first "effectiveness" pass (after CC-110 wired the warm prose
into the export). It removes the loudest clinical block; the grip *meaning*
is preserved by the warm narrative + the V3 "When the Load Gets Heavy"
prose. Sibling clinical bleed (Movement grip-component bullets, Disposition
Signal Mix, Open Tensions voice) is explicitly out of scope — own CCs.

## Read First (Required)

- `lib/renderMirror.ts`:
  - `emitGripSection` (L174–263) — the full function, both parts.
  - the `emitGripSection(` **call site** (grep) — where it's invoked in
    `renderMirrorAsMarkdown`; confirm `renderMode` (hoisted at L726) is in
    scope there to pass through.
  - `isProtectedLine` (L519+) and `applyUserModeMask` (L575+) — confirm the
    grip raw fields are NOT currently among the mask's strip targets (so
    suppression must happen at emit time, not via the mask).
  - the clinician early-return (L1857) and the two-tier comment block.
- `tests/audit/twoTierRenderSurfaceCleanup*.ts` + the committed
  `twoTierBaseline.snapshot.json` — clinician byte-identity must hold.
- A gold-standard PDF (e.g. `Brad-InnerConstitution.pdf`) for the target:
  no labeled grip-field panel; grip as prose.

## Tasks

1. **Thread `renderMode` into `emitGripSection`.** Add a
   `renderMode: "user" | "clinician"` parameter (default `"user"` to match
   the rest of the file's convention) and pass the hoisted value at the
   call site.
2. **Gate the raw-field block (Part 2) to clinician mode.** In user mode,
   do not emit the `**Grip Pattern:**` / `**Underlying Question:**` /
   `**Named grips contributing to this read:**` / `**Sub-register:**` /
   `**Confidence:**` lines (and their separating blank lines). Clinician
   mode emits them exactly as today.
3. **Engine-fallback labels (Part 1, rendered-mode fallback only).** When
   there is no `gripParagraphLlm` and the rendered-mode fallback fires, it
   emits labeled lines (`Surface Grip:`, `Grip Pattern:`,
   `Underlying Question:`, `Distorted Strategy:`, `Healthy Gift:`). In user
   mode, these labeled `Field: value` lines are also clinical — reflow them
   into the existing engine prose sentence form, OR suppress the labels,
   so user mode shows grip as prose, not as fields. Clinician unchanged.
   If a clean reflow isn't available from existing engine text, suppress
   the labeled lines in user mode and flag it. (In production the LLM
   paragraph is present, so this path is the no-API fallback.)
4. Leave the warm grip narrative (LLM blockquote / hedged prose) untouched
   in both modes.

## Allowed to Modify (exhaustive)

- `lib/renderMirror.ts` (only `emitGripSection`, its signature, and its
  single call site).

Anything else is forbidden — no LLM server/prompt files, no
`identityEngine.ts`, no cache JSON, no test baseline, no other section.

## Out of Scope

- Movement grip-component bullets ("Reputation stakes elevated", "Limited
  openness signal", "Grips control under pressure", etc.) — sibling CC.
- Disposition Signal Mix panel suppression — sibling CC.
- Open Tensions "the user may" / audience-voice cleanup — sibling CC.
- Any change to the grip LLM prompt or the grip narrative content.
- Movement headline metrics, the trajectory chart, false-precision/
  decimals (the gold standard keeps one-decimal headline metrics — do not
  touch them).
- Voice / third-person, new sections, PDF.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- targeted run of the two-tier audit
- `grep` / `sed` / `rg` read-only verification
- a one-off node/ts script to render one fixture in both modes and diff the
  grip section (do not commit it)

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. **Clinician markdown byte-identical** to before for all cohort fixtures
   (`twoTierRenderSurfaceCleanup` passes). The raw-field block is unchanged
   in clinician mode.
3. **User-mode markdown for a fixture no longer contains** the grip
   raw-field lines: `**Sub-register:**`, `**Confidence:**`,
   `**Named grips contributing to this read:**`, `**Underlying Question:**`,
   `**Grip Pattern:**`. Prove via before/after on one fixture.
4. The **warm grip narrative still appears in user mode** (the LLM
   blockquote or engine prose is intact) — grip meaning is not lost, only
   the labeled fields.
5. No labeled `Field: value` grip lines remain in user mode (Task 3).
6. No file outside the Allowed-to-Modify list edited.

## Report Back

- The `emitGripSection` signature change + call-site line.
- Before/after grip section for one fixture in both modes (show the
  user-mode block lost the fields, clinician kept them).
- How the engine-fallback labels (Task 3) were handled — reflow vs.
  suppress — and why.
- Confirmation clinician is byte-identical (how verified).
- Any ambiguity decision.
- Confirm the three named siblings (Movement grip-component bullets,
  Disposition Signal Mix, Open Tensions voice) remain untouched.
