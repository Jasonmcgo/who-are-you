# CODEX-CC-105-COMPLETE

> Cowork-chat informal CODEX, 2026-05-18.
> Supersedes the separate drafts CODEX-CC-105B-CHART-VISUAL-CLEANUP
> and CODEX-CC-105-FINALIZE. Runs both phases in one fire so the
> executor doesn't need a round-trip between them.
>
> Per `feedback_codex_llm_editorial_review.md`: if cache regen
> triggers in Phase 3, editorial review is required before declaring
> complete.
>
> Per `feedback_cache_regen_ordering.md`: synthesis3 must run before
> proseRewrites if cache regen fires.

## Why this CODEX exists

CC-105 substantively closed with chart radial geometry and Soul
direct-bonus trim. Local visual review surfaced three chart-render
issues + the substantive close deferred baseline regen and full
audit suite. This CODEX:

- **Phase 1:** Replaces the broken Grip arc with a shaded triangle,
  removes midpoint gridline noise, converts potential trajectory to
  solid-low-opacity.
- **Phase 2:** Regenerates baseline snapshots that drift from CC-105
  chart byte shifts.
- **Phase 3:** Runs the full audit suite. If LLM cache reds appear,
  regenerates the rewrite caches in canonical order with editorial
  review.
- **Phase 4:** Final verification + engine math byte-identical
  check.

After this closes green, the bundle (CC-105 + this CODEX) is
push-ready.

---

## Phase 1 — Chart visual cleanup

### Replace Grip arc with shaded triangle

In `lib/trajectoryChart.ts`:

- Remove the quarter-circle `svgGripThresholdArc` function entirely.
- Add `svgGripTriangle` rendering a filled `<polygon>` with three
  vertices in score space: (0, 0), (50, 0), (0, 50). Use existing
  score→SVG coordinate mapping.
- Fill: low-opacity warm tone, suggest `fill="#c9a474"` with
  `opacity="0.15"`. No stroke needed (fill alone communicates the
  zone).
- Always render — same lifecycle as the previous arc.

### Remove midpoint gridline cross

Delete the two `<line>` elements with `data-element="midpoint-
gridline-vertical"` and `data-element="midpoint-gridline-
horizontal"`. The radial-origin geometry doesn't anchor at midpoint,
so these gridlines no longer serve a navigational purpose and add
visual noise.

### Convert potential-trajectory line to solid low-opacity

Currently `<line ... stroke-dasharray="2 2" data-element="potential-
trajectory" />`. Change to: `stroke-width="1" opacity="0.45"` (no
dasharray). Reads as "lighter than usable" via opacity, no longer
adds a dashed element.

### Legend updates

- Drop "Midpoint dot" legend entry (already removed in CC-105 — verify
  absent).
- Update Grip-threshold legend entry text from "Dashed arc: Grip
  threshold — your starting box" to "Shaded triangle: Grip Zone —
  the FUD area near origin".
- Update Grip-threshold legend icon from dashed-arc preview to a
  filled triangle preview.
- Update potential-trajectory legend icon from dashed preview to
  solid-low-opacity preview.

### Final visual hierarchy after Phase 1

- Solid full-opacity dark line: Usable trajectory
- Solid low-opacity gray line: Potential trajectory
- Solid red short marker: Grip drag arrow
- Solid filled triangle (low-opacity warm tone): Grip Zone in SW
  corner
- Dashed fan: Tolerance cone (only dashed element remaining)

### Audit updates for Phase 1

- `tests/audit/chartMidpointRecalibration.audit.ts` — update the
  Grip-threshold assertion: was checking for arc path; now check
  for `<polygon>` with three points matching the score→SVG mapping
  of (0,0), (50,0), (0,50). Verify no midpoint-gridline cross
  elements rendered.
- `tests/audit/trajectoryChart.audit.ts` — update any midpoint-
  gridline or arc references.
- `tests/audit/aimRebuild.audit.ts` — update assertion 24.5 if it
  references arc-or-midpoint-gridline behavior.

---

## Phase 2 — Baseline snapshot regeneration

Run baseline regen scripts. Likely entry points:

```bash
npx tsx tests/audit/twoTierBaseline.snapshot.ts
npx tsx tests/audit/handsCardBaseline.snapshot.ts
```

If those entry points don't exist as runnable scripts, search for
the regeneration mechanism:

```bash
grep -rn "writeFileSync.*Baseline.snapshot.json" tests/audit/ scripts/
grep -rn "baseline.*regen\|regen.*baseline" package.json
```

Expected: both snapshot JSON files updated. Chart SVG section bytes
shift across all 24 fixtures (radial geometry + triangle Grip Zone +
no midpoint marker + solid potential line).

---

## Phase 3 — Full audit suite

Run every audit under `tests/audit/`. Report green/red count and
total runtime.

**If unexpected reds appear, classify each:**

- **Baseline drift** — snapshot stale due to CC-105 / 105B byte
  shifts. Fix: regenerate that specific baseline.
- **Cache miss** — section body hash changed; LLM rewrite cache
  doesn't cover a fixture. Fix: run cache regen in Phase 3a.
- **Real behavior regression** — engine math or render code broke.
  STOP and flag for triage. Do not auto-fix.

### Phase 3a — Cache regen (IF Phase 3 reveals cache reds)

Per `feedback_cache_regen_ordering.md`, run in dependency order:

```bash
npx tsx scripts/buildSynthesis3.ts
npx tsx scripts/buildProseRewrites.ts
npx tsx scripts/buildKeystoneRewrites.ts
npx tsx scripts/buildGripTaxonomy.ts
npx tsx scripts/buildLaunchPolishV3.ts
```

Expected cost: $1-3 LLM. Stop and flag if cost exceeds $5.

### Phase 3b — Editorial review (REQUIRED if Phase 3a ran)

Per `feedback_codex_llm_editorial_review.md`. For each newly-
generated entry, report:

- Hedge count (target ≤3)
- Shape-routing leak check (no architect-coded vocabulary in
  cindyType/danielType/unmapped entries — the CC-105 shape-aware
  prompt amendment should hold)
- Voice consistency with prior renderings of the same archetype

Report first 2-3 sentences of each new entry.

### Phase 3c — Re-run full audit suite after cache regen

Confirm full suite green count matches expected.

---

## Phase 4 — Final verification

### Engine math byte-identical check

Run engine output for `tests/fixtures/ocean/07-jason-real-session.json`
and report:

- Goal
- Soul (will differ from pre-CC-105 — expected, this is the trim)
- Aim
- Grip
- Movement Potential
- Movement Usable
- Direction angle

Compare against CC-105 Phase 2 expected: Jason Soul ≈ 75 (down from
~79). Everything else should be byte-identical.

### Type + lint

- `npx tsc --noEmit` clean
- `npm run lint` clean (pre-existing `PathExpanded.tsx` warning OK)

---

## Files allowed to modify

- `lib/trajectoryChart.ts` (Phase 1)
- `tests/audit/chartMidpointRecalibration.audit.ts` (Phase 1)
- `tests/audit/trajectoryChart.audit.ts` (Phase 1)
- `tests/audit/aimRebuild.audit.ts` (Phase 1)
- `tests/audit/twoTierBaseline.snapshot.json` (Phase 2)
- `tests/audit/handsCardBaseline.snapshot.json` (Phase 2)
- Any other `tests/audit/*.snapshot.json` that drifts (Phase 3)
- `lib/cache/*.json` (Phase 3a, IF needed)

## Do NOT

- Modify engine code: V/O, Goal/Soul, Aim, Grip, Movement, Quadrant,
  Risk Form, Next Moves, Grip Pattern.
- Modify Soul direct bonuses (Phase 2 of CC-105 stays as shipped).
- Modify Goal weights, Vulnerability-axis weights, or asymmetric-lift
  coefficients.
- Modify chart axes, viewBox, or score→SVG coordinate mapping.
- Modify trajectory direction formula (`atan2(Soul, Goal)`).
- Modify cohort-real fixtures, ocean fixtures, or goal-soul-give
  fixtures.
- Make commits or push (Cowork-chat handles after this CODEX returns
  green).
- Skip editorial review if Phase 3a fires.
- Auto-fix audit failures classified as "real behavior regression" —
  STOP and flag.

## Expected runtime

~30-50 min total:

- Phase 1 (visual cleanup): ~15 min
- Phase 2 (baseline regen): ~5 min
- Phase 3 (full audit): ~5 min
- Phase 3a (cache regen, IF needed): ~10-15 min + ~$1-3 LLM
- Phase 3b (editorial review, IF Phase 3a ran): ~5 min
- Phase 3c (full audit re-run): ~5 min
- Phase 4 (engine math + tsc + lint): ~5 min

## Cost

$0 if no cache regen needed. ~$1-3 if Phase 3a fires. Stop and flag
if cost exceeds $5.

## Report back

- Phase 1: files modified, final legend text, one-line visual
  description.
- Phase 2: baseline files regenerated, byte sizes before/after.
- Phase 3: full audit count, classification of any reds.
- Phase 3a / 3b (if fired): cache regen runs, editorial review
  notes.
- Phase 3c (if Phase 3a fired): final full audit count.
- Phase 4: Jason engine math values, tsc + lint status.
- Total LLM cost observed.

## Next after this closes green

1. Jason re-verifies locally (pull report, check: triangle in SW
   corner, only tolerance cone dashed, no midpoint cross, no
   amoeba arc).
2. If approved, Cowork-chat commits CC-105 + this CODEX as one
   bundle, pushes.
3. Vercel deploy verification on prod renders.
4. Fire CODEX-LLM-LIVE-SESSION-COVERAGE for Jason's live-session
   prose backfill (against post-deploy engine state).
