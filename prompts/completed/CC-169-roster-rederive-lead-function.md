# CC-169-ROSTER-REDERIVE-LEAD-FUNCTION

> Cowork-chat CC, 2026-05-24. Admin-only fix. The roster shows STALE lead
> functions (and stale Alloc. counts) because it reads the frozen stored
> constitution; the report re-derives live. Make the roster re-derive the
> same way so its columns agree with the report. No engine math, no schema,
> no migration. Render/query layer only.

## The bug (root cause confirmed)

The roster summary builds its derived columns from the **stored**
`inner_constitution` JSONB:
- `app/admin/sessions/page.tsx` ~L180: `const ic = r.inner_constitution as InnerConstitution;`
- `app/api/admin/sessions/route.ts` ~L160: same.

`dominant_function`, `top_compass`, `conviction_posture`, and
`allocation_tensions_count` all derive from that frozen `ic`. The
`/report/[sessionId]` page, by contrast, RE-DERIVES via the stale-shape
detector (`detectStaleShape` → `buildInnerConstitution` when drifted). So
when a session's typing changed since it was saved (follow-up clarifiers,
engine improvements), the report shows the new lead but the roster still shows
the frozen one. Michele (Fe room-reader) and Ashley (Se present-tense) are the
visible cases — both have follow-ups that re-typed them.

The fix is to route the roster's per-row `ic` through the SAME re-derivation
the report uses. The machinery already exists in `page.tsx`:
`detectStaleShape` is imported and used by `loadStaleShapeTally` (~L263).

## The fix — both roster paths

Apply to BOTH the server component (`app/admin/sessions/page.tsx`, the
rendered roster) and the API (`app/api/admin/sessions/route.ts`, used for
client refetch/filter) so they stay consistent.

### 1. Select the inputs the re-derivation needs

Add to each roster summary query's `.select({...})`:
- `answers: sessionsTable.answers`
- `engine_shape_version: sessionsTable.engine_shape_version`
(`inner_constitution` stays — it's the fresh-branch value + the fallback.)

### 2. Re-derive `ic` per row via the stale-shape detector

Replace `const ic = r.inner_constitution as InnerConstitution;` with the
report's branch logic (only re-derives DRIFTED rows, so fresh rows stay cheap):

```ts
const answers = (r.answers ?? []) as Answer[];
const verdict = detectStaleShape({
  sessionId: r.id,
  engineShapeVersion: r.engine_shape_version,
  innerConstitution: r.inner_constitution,
  answers,
});
let ic: InnerConstitution;
if (verdict.branch === "fresh") {
  ic = verdict.constitution;                 // stored == current
} else if (verdict.branch === "re-derivable") {
  try {
    ic = buildInnerConstitution(answers, [], null);  // matches the report's re-derive
  } catch {
    ic = r.inner_constitution as InnerConstitution;  // defensive fallback
  }
} else {
  ic = r.inner_constitution as InnerConstitution;     // un-rerenderable: best available
}
```

Then derive `dominant_function`, `top_compass`, `conviction_posture`, and
`allocation_tensions_count` from THAT `ic` (unchanged code below — it already
reads from `ic`). This fixes all four columns at once, since they all sourced
from the frozen blob.

Notes:
- Pass `[]` for metaSignals and `null` for demographics, matching the report's
  re-derivable branch (`buildInnerConstitution(answers, [], demographics)` — the
  report uses demographics, but the **lens dominant** is answer-driven so the
  lead function will match regardless; if a future column proves
  demographics-sensitive, thread the row's demographics then). The reported
  bug is the lead function, which this resolves exactly.
- `detectStaleShape` / `buildInnerConstitution` are already imported in
  `page.tsx`; add the imports to `route.ts` if missing.

### 3. Optional shared helper

`page.tsx` and `route.ts` now have identical per-row derivation. If clean, lift
it into one small exported helper (e.g. `deriveRosterConstitution(row)`) and
call from both — but a duplicated block is acceptable if extracting adds churn.

## Do NOT

- Change engine math, the stale-shape detector, or `buildInnerConstitution`.
- Touch the report page (it's already correct — this makes the roster match it).
- Re-derive on EVERY row unconditionally if it's slow — gate on the
  `re-derivable` branch so fresh rows use the stored value (they're equal).
- Commit or push.

## Acceptance

- `tsc --noEmit` clean; lint clean.
- Roster lead function now MATCHES each person's report. Spot-check Michele and
  Ashley specifically — their roster lead should equal what their
  `/report/[sessionId]` shows (the previously-stale cases).
- Fresh sessions unchanged (Cindy/Daniel/etc. — stored == re-derived).
- Alloc. count + top compass + conviction also reflect the re-derived shape.
- Admin roster renders without a noticeable slowdown for the current cohort
  (~20-30 rows). Note the per-row re-derive cost; if it ever matters at scale,
  a precomputed column is the future move.
- Full suite green at close.

## Report back

- Files modified; the per-row branch as implemented (and whether a shared
  helper was extracted).
- Confirm Michele + Ashley roster lead now equals their report lead, with the
  before/after function for each.
- Roster render timing sanity (rough).
- Audit results.
