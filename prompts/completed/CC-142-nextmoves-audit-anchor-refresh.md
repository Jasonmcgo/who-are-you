# CC-142 — Refresh the nextMovesShapeAware audit anchors (stale after CC-120 + CC-132)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Audit-only.** No product/engine/render change. Updates one audit's stale
anchors to the current render contract.

## Context

`tests/audit/nextMovesShapeAware.audit.ts` (CC-104) fails on its **user-mode**
assertions — and it's a **stale anchor, not a bug.** Investigation (verified in
`lib/renderMirror.ts`):

- The register-based **"## Next Moves"** section is **clinician-only** —
  `line 1805: if (nextMoves && renderMode === "clinician") out.push("## Next Moves")`.
  CC-120 gated it to the Guide (it duplicated "Your Next 3 Moves" and exposed
  question-IDs).
- **User mode short-circuits to the 50° outline** —
  `line 807: if (renderMode === "user" …) … composeFiftyDegreeIndividual(…)`.
  CC-132 reformatted the Individual; its Next-Moves section is
  **"## Your Next Three Moves — From Grip to Aim"**, not "## Next Moves", and
  there is no "## Path" / "Grip Pattern" header in the old positions.

So assertions **8** (`prose-no-engine-vocabulary-leak`) and **9**
(`render-section-emits-after-grip-before-path`) do `indexOf("## Next Moves")`
on `renderMode: "user"` → `-1` → `bodyLen=0` → fail. The functionality is
intact: router/prose (1–7), the clinician register section + caption (10),
user-mode caption omission (11), and engine math (12) are all correct.

This CC realigns the audit to reality. **Do not "fix" the render** — the render
is correct; the audit is stale.

## Tasks (only `tests/audit/nextMovesShapeAware.audit.ts`)

1. **Assertion 8 — no-engine-vocab-leak.** Point the leak check at where the
   register prose actually lives: the **clinician** `## Next Moves` body (slice
   between `## Next Moves` and the next `## ` header in `renderMode: "clinician"`).
   Assert `bodyLen > 0` there and zero banlist hits. Optionally ALSO assert the
   **user-mode** 50° Next-Moves section (`## Your Next Three Moves — From Grip
   to Aim`, sliced to the next `## `) has `bodyLen > 0` and no leak — the
   user-facing section that replaced the old one.
2. **Assertion 9 — section ordering.** Replace the obsolete user-mode
   `grip < "## Next Moves" < "## Path"` check with the **current** contract:
   - clinician: `## Next Moves` appears (after the Grip section, before Path/the
     downstream sections), OR
   - user (50°): `## Your Grip` / `## Your Trajectory` ordering vs
     `## Your Next Three Moves — From Grip to Aim` vs `## Closing Read` per the
     CC-132 outline.
   Pick whichever the executor verifies matches the live render; the intent is
   "the Next-Moves section emits in the right place," updated to current headers.
3. **Assertions 1–7, 10, 11, 12 — keep.** They should still pass (router/prose
   are unchanged; clinician caption + user-mode omission hold; engine math
   anchor unchanged). If assertion 12's `JASON_ANCHOR` numbers no longer match
   the ocean/07 fixture (they should — CC-134/134.1/141 kept Movement
   byte-identical), refresh the anchor and flag it loudly (that would be a real
   signal, not an anchor typo).
4. Update the audit's header comment to note the CC-120 (clinician-gate) +
   CC-132 (50° user reformat) realignment.

## Read First (Required)

- `tests/audit/nextMovesShapeAware.audit.ts` (the 12 assertions).
- `lib/renderMirror.ts` ~L807 (user short-circuit) + ~L1805 (clinician
  `## Next Moves` + `_Register:` caption).
- `lib/fiftyDegreeIndividual.ts` (the 50° `## Your Next Three Moves — From Grip
  to Aim` composer + the surrounding section headers/order).

## Allowed to Modify (exhaustive)

- `tests/audit/nextMovesShapeAware.audit.ts`.

Nothing else. No render/engine change. No snapshot change. No cache regen.

## Out of Scope

- Any product/render/engine change — the render is correct as-is.
- The derived gap-fill coverage gap (Q-I2/Q-I3) — separate follow-up.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run audit:next-moves-shape-aware` (the target)
- a one-off cold render of ocean/07 in both modes to confirm the headers the
  new anchors target
- `grep` / `rg`

## Acceptance Criteria

1. `npx tsc --noEmit` clean.
2. `nextMovesShapeAware` passes **12/12** against the current render, with the
   user-mode assertions realigned to the 50° headers / clinician-gated section.
3. No render/engine/snapshot/cache change — proven by `git diff` touching only
   the audit file.
4. If `JASON_ANCHOR` needed updating, that's flagged explicitly (with the
   before/after numbers) rather than silently changed.

## Report Back

- Which assertions were realigned and to what headers.
- Confirmation the render was NOT touched (audit-only diff).
- Whether `JASON_ANCHOR` matched (it should) or needed a flagged refresh.
- Confirm 12/12 green.
