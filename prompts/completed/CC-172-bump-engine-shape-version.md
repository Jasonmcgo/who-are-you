# CC-172-BUMP-ENGINE-SHAPE-VERSION

> Cowork-chat CC, 2026-05-24. The typing fixes (CC-171 Harry/Keith, and
> CC-134/159/161 before) changed the engine's OUTPUT but never bumped
> `ENGINE_SHAPE_VERSION`. So `detectStaleShape` treats stored constitutions at
> the current version as "fresh" and serves them verbatim — meaning the fixes
> don't reach the live surfaces (report, roster) for already-saved sessions.
> This bumps the version so stored constitutions re-derive and pick up the
> current typing.

## The bug

`detectStaleShape` (lib/staleShape.ts) decides per session:
- **fresh** — stored `engine_shape_version` matches `ENGINE_SHAPE_VERSION` →
  use the STORED constitution verbatim (no re-derive).
- **re-derivable** — version drift (or recoverable structural drift) →
  re-run `buildInnerConstitution`.
- **un-rerenderable** — drift + missing answers → graceful card.

Both the report (`/report/[sessionId]`) and the roster (CC-169 via
`deriveRosterConstitution`) use this. `ENGINE_SHAPE_VERSION` is currently `1`,
and the typing CCs (CC-134, CC-159, CC-161, **CC-171**) changed the lens
typing *output* without bumping it. Result: any session whose stored
constitution is at version 1 is "fresh" → served STALE. Keith shows his old
**Fe-dominant** stored read on the roster (and report) instead of the CC-171
**Si**; the fix only reaches sessions that are already version-stale.

This is exactly the propagation mechanism `ENGINE_SHAPE_VERSION` exists for —
it was simply not bumped when the engine output changed.

## The fix

1. **Bump `ENGINE_SHAPE_VERSION` 1 → 2** in `lib/staleShape.ts`. This flags
   every stored-v1 constitution as drifted → `re-derivable` → the report and
   roster re-derive via `buildInnerConstitution` and reflect the current typing
   (Harry→Si, Keith→Si, and any other CC-134/159/161/171 corrections).
2. **Add the discipline** as a comment at the `ENGINE_SHAPE_VERSION` declaration:
   "Bump this whenever an engine change alters constitution OUTPUT (typing,
   scores, derived fields) so stored bundles re-derive. Prose-only changes do
   NOT require a bump." (The prior typing CCs missing this is the lesson.)
3. **Confirm the re-derivable path is sound for the cohort.** After the bump,
   every cohort-real anchor should re-derive cleanly (no `un-rerenderable`
   surprises — they all carry answers). Spot-check that the report + roster now
   agree for Keith (Si) and Harry (Si), and the controls (Ashley Ni, Daniel Si,
   Jason Ni) are unchanged.

### Perf note (decide, don't ignore)
Bumping makes ALL stored sessions re-derive on every render until they're
re-saved. At the current cohort scale (~20-30) that's negligible (CC-169
measured ~1ms/row; the report already re-derives one session). If the session
count grows large, the durable move is a **one-time re-save migration**
(re-derive + persist `inner_constitution` + set `engine_shape_version = 2` for
every row), after which sessions are "fresh" again at the new version and skip
re-derive. Recommend: bump now (fixes the live surfaces immediately); optionally
follow with the re-save script if per-render cost ever matters.

## Do NOT

- Change any typing logic, scores, or prose — this is purely the version gate.
- Bump for prose-only reasons in future (only OUTPUT changes warrant it).
- Commit or push (Cowork-chat handles the commit).

## Acceptance

- `tsc --noEmit` clean.
- `detectStaleShape` now classifies a version-1 stored constitution as
  `re-derivable` (add/extend a staleShapeDetector audit assertion for the
  version-2 boundary).
- Report + roster agree for the cohort: Keith=Si, Harry=Si, Ashley=Ni,
  Daniel=Si, Jason=Ni (this is the CC-171 cohortRealLensCanon set — should stay
  green AND now match the live surfaces).
- `staleShapeDetector.audit.ts` green; full suite green at close.

## Report back

- The version bump + the discipline comment.
- Confirmation that Keith + Harry now re-derive to Si on BOTH report and roster
  (and controls unchanged).
- Whether you also ran the optional re-save (and if so, row count updated).
- Audit results.

## Confirm first (one data point)

Before firing, worth confirming the diagnosis from Keith's live row:
`engine_shape_version` + `inner_constitution.lens_stack.dominant`. Expected:
version = 1 (or null) and dominant = `fe` (the stale stored read). If so, the
bump is exactly right. (If his stored version is already > 1 or dominant is
already `si`, the cause is different and we re-diagnose.)
