# CC-114 — Gate the Movement grip-component bullets to clinician mode

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- User-mode presentation change only. Clinician output stays
  byte-identical. No engine/derivation change.

## Context

In the Movement section of the markdown render (`lib/renderMirror.ts`,
inside the `goalSoulMovement` block), the Grip metric line is followed by a
list of raw grip-component bullets:

```
- **Grip:** 60.5 / 100
  - Reputation stakes elevated
  - Limited openness signal
  - Grips control under pressure
  - Grips money / security under pressure
  - Grips a plan that used to work under pressure
```

Source (~L1230–1234):

```ts
if (dash.grippingPull.signals.length > 0) {
  for (const sig of dash.grippingPull.signals) {
    out.push(`  - ${sig.humanReadable}`);
  }
}
```

These component bullets render in **both** modes. The gold-standard reports
show Grip as a single clean headline metric (e.g. "Grip 78.2 / 100") with no
component enumeration — the grip *meaning* is carried in the warm "When the
Load Gets Heavy" prose (CC-110) and the Grip narrative, not as a raw signal
list. This CC gates the component bullets to clinician mode; user mode keeps
the single `**Grip:**` metric line.

Note: the **Disposition Signal Mix** panel is already user-collapsed by
`CC-DISPOSITION-COLLAPSE-DEFAULT` (L1304–1330) and is **out of scope** here.
The raw Grip *field panel* (`Sub-register` / `Confidence` etc.) was already
gated by CC-111. This CC is only the Movement grip-component bullets.

## Read First (Required)

- `lib/renderMirror.ts`:
  - the Movement section, esp. the Grip metric line (~L1220–1228) and the
    `dash.grippingPull.signals` bullet loop (~L1230–1234).
  - `renderMode` hoist (L726) — confirm it's in scope at this block.
  - `isProtectedLine` (L519+) — these indented `  - …` bullets are not
    metric label lines, so confirm whether the mask touches them (it does
    not; suppression must happen at emit time).
- `tests/audit/twoTierRenderSurfaceCleanup*.ts` + `twoTierBaseline.snapshot.json`
  — clinician byte-identity must hold (this CC must NOT change the baseline).

## Tasks

1. Wrap the `dash.grippingPull.signals` bullet loop (~L1230–1234) in
   `if (renderMode === "clinician") { … }`. User mode emits only the single
   `**Grip:** …` metric line; clinician mode is unchanged.
2. Verify the `**Grip:**` metric line itself remains in BOTH modes (only the
   indented component bullets under it are gated).

## Allowed to Modify (exhaustive)

- `lib/renderMirror.ts` (only the Movement grip-component bullet loop).

Nothing else. No baseline snapshot change (clinician stays identical), no
Disposition code, no Grip metric line change, no other section.

## Out of Scope

- Disposition Signal Mix (already user-collapsed).
- The raw Grip field panel (already CC-111).
- Headline Movement metrics and their decimals (gold standard keeps them).
- The trajectory chart, the Grip narrative, the `**Grip:**` line itself.
- Voice / third-person, toggle, PDF.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier audit
- `grep` / `sed` / `rg` read-only verification
- a one-off render of one fixture in both modes to diff the Movement block

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. **Clinician markdown byte-identical** for all cohort fixtures
   (`twoTierRenderSurfaceCleanup` passes; baseline NOT regenerated).
3. **User-mode markdown** no longer contains the grip-component bullet lines
   (e.g. the indented `  - Reputation stakes elevated` family). Prove via
   before/after on a fixture whose `grippingPull.signals` is non-empty.
4. The `**Grip:** … / 100` metric line is still present in BOTH modes.
5. No file outside the Allowed-to-Modify list edited; baseline untouched.

## Report Back

- The exact lines wrapped + the guard.
- Before/after Movement block for one fixture, both modes (user lost the
  component bullets, clinician kept them, Grip metric line present in both).
- Confirmation the clinician baseline is byte-identical (how verified).
- Any ambiguity decision.
