# CC-119 — Make the Guide render additive (inherit the Individual's warm prose)

## Execution mode

Proceed without pausing for permission dialogs. Complete in a single pass.
Do not stop for confirmation between steps. On ambiguity, apply the
canon-faithful interpretation, proceed, and flag it. Permission bypass is
on; the discipline below is scope.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.

## Execution Directive

- One pass, no mid-task confirmation prompts.
- This **intentionally changes the Guide (clinician) render** — it will no
  longer be byte-identical to the old raw-engine baseline. The two-tier
  audit's premise changes (see Tasks). Engine derivation/prose is unchanged;
  what changes is *which prose the Guide shows*.

## Context

Per `docs/canon/guide-individual-model.md` (CC-118): the Guide must be a
strict **superset** of the Individual — the same warm read, plus scaffolding.

Today it's the opposite. In `renderMirrorAsMarkdown`, the clinician path
hits `if (renderMode === "clinician") return raw;` **before** the warm-prose
splice (the four body-card rewrites + the seven launchPolishV3 sections +
keystone). So:

- **Guide (clinician)** = cold engine prose + all scaffolding.
- **Individual (user)** = warm rewrites + suppression mask.

The warm prose investments never reach the Guide. This CC flips it so both
views share the warm prose and the Guide simply *retains* the scaffolding
the Individual suppresses.

## Target architecture

- Run the warm splice (prose cards + V3 + keystone) for **both** modes.
- **Individual** = warm prose + `applyUserModeMask` (suppression: strips
  jargon/labels, gates off the grip raw-field panel, movement component
  bullets, MBTI/surface label, collapses Disposition, etc.).
- **Guide** = warm prose **without** the suppression mask (retains all
  scaffolding in place). Guide = Individual's exact warm prose + scaffolding.
- Net invariant: **every line the Individual emits also appears in the
  Guide.** The Guide differs only by *additional* scaffolding lines.

## Read First (Required)

- `docs/canon/guide-individual-model.md` (CC-118) — the additive contract.
- `lib/renderMirror.ts` — the tail of `renderMirrorAsMarkdown`: the
  `if (renderMode === "clinician") return raw;` early-return, the four-card
  splice loop, the CC-110 V3 splice loop, `enforceHandsTemplate`, and the
  final `applyUserModeMask(...)`. Also the mode-gated scaffolding blocks
  added by CC-111/114/115 (`emitGripSection`, the movement grip-component
  bullets, the disposition `<details>` collapse, the MBTI/preamble
  suppression in `applyUserModeMask`).
- `lib/renderMirrorLive.ts` — the live wrapper that pre-resolves rewrites;
  confirm both modes get the warm cache warmed.
- `app/components/InnerConstitutionPage.tsx` — the React Guide/Individual
  gating (CC-117) must follow the same additive rule.
- `tests/audit/twoTierRenderSurfaceCleanup.audit.ts` + baseline — the
  premise changes from "clinician = raw engine" to "Guide ⊇ Individual".

## Tasks

1. **Run the warm splice in both modes.** Remove the cold
   `if (renderMode === "clinician") return raw;` early-return so the
   four-card + V3 + keystone splices apply regardless of mode. The Guide
   now shows the same warm rewrites as the Individual.
2. **Mask only the Individual.** Apply `applyUserModeMask` (and the
   user-mode suppressions) only when `renderMode === "user"`. In Guide mode,
   skip the mask so scaffolding (grip raw-field panel, movement component
   bullets, MBTI/surface label, Disposition full panel, engine-internal
   labels) is retained — but on top of the *warm* prose, not cold engine
   prose.
3. **Verify the superset invariant.** Add/extend an assertion: for every
   cohort fixture, every non-empty line of the Individual render appears in
   the Guide render (Guide is a superset). The only Guide-exclusive lines
   are scaffolding.
4. **Rebaseline + redefine the two-tier audit.** The
   `clinician-mode-byte-identical-to-baseline` assertion no longer reflects
   reality (Guide is now warm). Replace its intent with: (a) Guide ⊇
   Individual (superset, task 3), and (b) a fresh snapshot of the new Guide
   output for regression stability. Re-snapshot
   `twoTierBaseline.snapshot.json` AFTER the cache is warm (run order
   matters — snapshot last). Flag the audit redefinition.
5. **Mirror in React.** Ensure `InnerConstitutionPage` follows the same
   additive rule (Guide = Individual + scaffolding, same warm prose), not a
   separate cold path.

## Allowed to Modify (exhaustive)

- `lib/renderMirror.ts`
- `lib/renderMirrorLive.ts` (only if needed so Guide-mode warms the cache)
- `app/components/InnerConstitutionPage.tsx`
- `tests/audit/twoTierRenderSurfaceCleanup.audit.ts` (redefine per task 4)
- `tests/audit/twoTierBaseline.snapshot.ts` (if the snapshot writer needs to
  capture both modes for the superset check)
- `tests/audit/twoTierBaseline.snapshot.json` (re-snapshot, last)

Nothing else. No engine/derivation change, no prose content change, no LLM
prompt change.

## Out of Scope

- Tightening / de-duplicating the Individual (the user-feedback length fix —
  separate CC, now unblocked by this one).
- The grammar guard on rewrite prompts (separate CC).
- Renaming internal `renderMode` values.

## Bash Commands Authorized

- `npx tsc --noEmit`, `npm run lint`
- the two-tier + react-surface audits
- `grep` / `sed` / `rg` + a one-off render of both modes for a fixture to
  diff (confirm Guide = Individual + scaffolding)

## Acceptance Criteria

1. `npx tsc --noEmit` clean; `npm run lint` clean (pre-existing warnings ok).
2. Guide (clinician) render now contains the **warm** Executive Read / Core
   Pattern / etc. (the same rewrites the Individual shows) — not the old
   cold engine prose. Prove with before/after on a fixture.
3. **Superset invariant holds**: for every cohort fixture, every non-empty
   line of the Individual render is present in the Guide render. Guide-only
   lines are scaffolding.
4. Individual render is unchanged from its current output (this CC adds warm
   prose to the Guide; it must not alter the Individual).
5. Two-tier audit redefined + green; baseline re-snapshotted last (warm).
6. React surface follows the same additive rule.
7. No file outside the Allowed-to-Modify list edited.

## Report Back

- The early-return removal + where the mask now gates on `"user"` only.
- Before/after Guide render for a fixture (cold→warm prose; scaffolding
  retained).
- Superset-invariant evidence (which fixture, line-coverage check).
- Confirmation the Individual output is byte-identical to pre-CC.
- The two-tier audit redefinition + new baseline scope.
- Any ambiguity decision.
- Follow-up: the Individual length/repetition tightening pass is now
  unblocked (the Guide retains anything cut).
