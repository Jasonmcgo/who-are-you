# CC-103-CHART-MIDPOINT-RECALIBRATION

## Objective

Recalibrate the Goal/Soul trajectory chart so the trajectory line
anchors at the **canonical midpoint (50/50)** instead of the
absolute-zero origin (0/0). The midpoint is the canonical baseline;
movement beyond the midpoint = progress; movement below the midpoint
on either axis = direction of work needed.

Per `feedback_chart_as_feedback_engine.md`:

> The trajectory chart is the user's feedback engine — the visual
> instrument they return to as they work on themselves. Take
> assessment → see chart → identify grip → release grip → re-take →
> see line grow. The chart must support that loop.

The current "from origin" rendering misrepresents users above the
midpoint: their line transits through Drift territory before reaching
their endpoint in Giving/Presence. Re-anchoring to (50/50) makes the
visual semantic match the data: above midpoint = clearly in
Giving/Presence; below midpoint on either axis = direction of work.

## Read First

- `feedback_chart_as_feedback_engine.md` — canon (user-journey vision)
- `feedback_50_degree_journey_canon.md` — Goal/Soul/Aim/Grip spine
- `feedback_trajectory_model_refinement_canon.md` — current trajectory
  composition (Aim governance, Grip drag, tolerance cone)
- `lib/renderMirror.ts` OR wherever the trajectory chart SVG is
  generated (grep for `data-element="usable-trajectory"` and
  `data-element="potential-trajectory"` to find the renderer)
- `lib/movementLimiter.ts` — Usable Movement calculation (chart
  reads from this)
- `lib/aim.ts` — Aim score (chart's tolerance-cone source)
- `tests/audit/twoTierBaseline.snapshot.json` and similar — baseline
  snapshots that capture current chart bytes (will drift; refresh
  is in scope)

## Canon constraints (locked)

- **Render-layer change only.** No engine math changes. Goal, Soul,
  Aim, Grip, Movement scores all untouched. Only the chart SVG's
  trajectory line origin shifts from (0,0) to (50,50). Tolerance
  cone apex follows the line origin.
- **All cohort fixture engine outputs byte-identical post-CC.**
  Goal/Soul/Aim/Grip/Movement numbers are identical pre- and
  post-CC. Only the SVG bytes change.
- **Backward-compat on existing chart consumers.** If any code reads
  trajectory chart SVG bytes (e.g., LLM rewrites that hash on
  chart prose), the change is expected and the chart-bytes-drift
  baseline refresh is in scope for this CC.
- **The chart legend must update to reflect the new semantic.** The
  solid line legend currently says "usable movement (what's
  actually available)" — should now also reference that the line
  origin is the canonical baseline (50/50 midpoint). Concrete
  wording in Item 2c.
- **Zero Wave 1 persistence file changes.** Standard list:
  `lib/staleShape.ts`, `lib/llmRewritesBundle.ts`,
  `lib/sessionLlmBundleStore.ts`, `lib/*LlmServer.ts` untouched.
- **No LLM calls, no cache file edits, no commits, no pushes.**

## Scope — Phase 1: Trajectory line origin recalibration

### Item 1a — Move trajectory line origin from (0,0) to (50,50)

Find the trajectory chart SVG renderer (grep
`data-element="usable-trajectory"` to locate). Current line:

```
M [origin-x] [origin-y] L [endpoint-x] [endpoint-y]
```

where `origin-x` and `origin-y` are the SVG coordinates of score
(0/0) and `endpoint-x`/`endpoint-y` are the SVG coordinates of the
user's score.

Change `origin-x` and `origin-y` to the SVG coordinates of score
(50/50). In the existing chart's coordinate system (viewBox
"0 0 320 320", with axes spanning roughly x=60..260 and y=24..224):

```
midpoint_x = 60 + (50/100) * (260 - 60) = 60 + 100 = 160
midpoint_y = 224 - (50/100) * (224 - 24) = 224 - 100 = 124
```

So the trajectory line should start at SVG (160, 124).

Apply the same recalibration to the `potential-trajectory` line
(faint line showing trajectory before grip+aim drag) — also anchored
at (50,50).

### Item 1b — Tolerance cone apex follows line origin

The tolerance cone (`tolerance-cone-lower` and `tolerance-cone-upper`
dashed fan lines) currently emanates from the line origin.
After Item 1a, the cone apex should be at SVG (160, 124) — the
midpoint — not (60, 224).

Cone math remains the same (±9° from line direction, scaled to
match line length). The apex position is the only change.

### Item 1c — Grip drag marker positioning

The grip drag marker (red arrow with `data-element="grip-drag-marker"`
and `grip-drag-arrowhead`) currently points along the line vector
showing where grip pulls trajectory back. After Item 1a, the marker's
end-position scales with the new shorter line (from midpoint to
endpoint) instead of the old longer line (from origin to endpoint).

The marker should still visually represent the drag amount, but
because the line is shorter, the marker is also proportionally
shorter. This preserves the "what fraction of your trajectory is
drag" semantic.

### Item 1d — Edge case: users with Goal < 50 OR Soul < 50

For users below the midpoint on either axis, the line projects
from (160, 124) into the appropriate other quadrant:

- Low Goal + high Soul → line projects UP-LEFT into "Love without Form"
- High Goal + low Soul → line projects DOWN-RIGHT into "Work without Presence"
- Low Goal + low Soul → line projects DOWN-LEFT into "Drift"

This is the canonical "direction of work needed" visualization.
The line magnitude indicates how far from baseline. The angle
indicates which axis needs work.

## Scope — Phase 2: Chart legend update

### Item 2a — Add midpoint baseline marker

Add a small visual marker at the midpoint (160, 124) — e.g., a
subtle dot or small cross — to make the canonical baseline visible.
Use the existing `#c9a474` or similar muted color so it doesn't
compete with the trajectory line.

### Item 2b — Update midpoint cross dashed lines

The chart already has dashed cross-lines at the midpoint (the 50/50
gridlines). Verify they're still visible after Phase 1 and
strengthen their emphasis slightly (e.g., increase opacity from
0.5 to 0.7) so the midpoint baseline reads clearly.

### Item 2c — Legend wording

Update the legend entries to reflect the new semantic:

Current:
```
Solid line: usable movement (what's actually available)
Faint line: potential trajectory before Grip drag + Aim governance
Dashed fan: tolerance cone (±9°, derived from Aim)
Red marker: Grip drag — what's pulling movement back
```

New:
```
Solid line: usable movement from midpoint baseline (what's actually available)
Faint line: potential trajectory before Grip drag + Aim governance
Dashed fan: tolerance cone (±9°, derived from Aim)
Red marker: Grip drag — what's pulling movement back
Midpoint dot: canonical baseline (50/50) — above = progress; below on either axis = direction of work
```

## Scope — Phase 3: Cohort baseline refresh

After Phase 1-2 land, the SVG bytes for every cohort fixture will
have changed (trajectory line + cone apex + grip marker + midpoint
marker all redrawn). This will fail any audit that hashes chart
SVG bytes.

### Item 3a — Identify affected baselines

Grep `tests/audit/*.snapshot.json` for chart-related hashes. Likely
candidates:
- `tests/audit/twoTierBaseline.snapshot.json`
- `tests/audit/handsCardBaseline.snapshot.json` (if it includes
  chart bytes)
- Others as discovered

### Item 3b — Regenerate baselines

Run the existing baseline-regeneration scripts (e.g.,
`tests/audit/twoTierBaseline.snapshot.ts` if it's a regen entry
point — same pattern as CC-088's baseline refresh).

Baseline drift in this CC is EXPECTED and PART OF SCOPE, unlike
prior CCs where baseline-refresh was explicitly deferred. The
chart change is the entire point; baselines must follow.

### Item 3c — Document drift magnitude

In the executor report, document:
- Which baseline files regenerated
- Per-baseline byte delta (number of fixtures changed, magnitude
  of each)
- Confirm no other baseline-content drifted (engine math should be
  byte-identical)

## Scope — Phase 4: Audit assertions

### Item 4a — New audit `audit:chart-midpoint-recalibration`

Assertions:

- `chart-trajectory-line-anchored-at-midpoint` — for any cohort
  fixture, grep the rendered SVG for `M 160 124` (or near-equivalent
  with floating-point precision) as the trajectory line origin.
- `chart-tolerance-cone-apex-at-midpoint` — tolerance cone start
  coordinates match midpoint SVG (160, 124).
- `chart-jason-line-entirely-in-upper-right` — Jason (Goal 94 / Soul 79)
  trajectory line endpoint is at upper-right; line from (160, 124)
  to endpoint is entirely above and right of midpoint.
- `chart-michele-line-entirely-in-upper-right` — Michele (Goal 79 /
  Soul 97) similarly clean upper-right.
- `chart-midpoint-marker-rendered` — SVG contains the new midpoint
  dot/cross visual element.
- `chart-legend-references-baseline` — legend text includes
  "midpoint baseline" or equivalent phrasing.
- `chart-low-goal-fixture-projects-correctly` — synthetic fixture
  with Goal=30 / Soul=70 has line projecting from midpoint into
  upper-left quadrant (Love without Form).
- `chart-engine-math-unchanged` — Goal/Soul/Aim/Grip/Movement
  scores byte-identical pre- and post-CC for all 6 named cohort
  fixtures (regression anchor).

## Acceptance criteria

1. `npx tsc --noEmit` clean
2. lint clean (no new warnings)
3. `audit:chart-midpoint-recalibration` exits 0 with 100% PASS
4. `audit:twoTierBaseline` and other baseline audits PASS after
   regeneration in Phase 3
5. Wave 1 audits all pass
6. CC-084 through CC-102 audits all pass (engine math unchanged)
7. All 6 named cohort fixtures' Goal/Soul/Aim/Grip/Movement scores
   byte-identical pre- and post-CC
8. Trajectory chart SVG bytes drift for all cohort fixtures
   (expected per scope)
9. Zero engine math file changes
10. Zero Wave 1 persistence file changes
11. Zero LLM calls
12. Zero cache file modifications
13. Zero commits / pushes — left dirty for review

## Allowed to modify

- `lib/renderMirror.ts` OR wherever trajectory chart SVG is generated
  (single file likely)
- `tests/audit/chartMidpointRecalibration.audit.ts` (new file)
- `tests/audit/twoTierBaseline.snapshot.json` (regenerate)
- `tests/audit/handsCardBaseline.snapshot.json` (regenerate if it
  contains chart bytes)
- Other baseline JSONs as needed for Phase 3
- `package.json` — new `audit:chart-midpoint-recalibration` script
- `prompts/active/CC-103-CHART-MIDPOINT-RECALIBRATION.md` →
  `prompts/completed/`

Nothing else.

## Out of scope (defer to later CCs)

- **CC-101-VO-WIRING** — V/O score → Aim/Grip/Movement engine math.
  CC-103 and CC-101 are independent (render-layer vs engine math).
  Can fire in either order; both safe.
- **"Track over time" multi-trajectory rendering.** Future feature
  — show user's trajectory line evolution across multiple
  assessments. Out of scope for CC-103.
- **Grip drag marker visual enhancement.** The marker stays current
  red-arrow style. Future CC could make it more obvious / clickable
  for "what to release" explanation.
- **Movement bar UI promotion.** Currently buried in metric text;
  future CC could promote to a canonical progress surface. Out
  of scope.
- **"Release grip" how-to companion.** Surface-level "to release
  control: try X this week" prose. Future CC.

## Estimated

30-45 min (render-layer only, single file likely + baseline
regeneration per `feedback_cc_executor_time_estimates_5x_too_high.md`).

## Notes for executor

- **Render-layer only.** Do not touch engine math files. Grip/Aim/
  Movement scores must be byte-identical pre- and post-CC.
- **Baseline regeneration is part of scope this time** (unlike
  most prior CCs where it was deferred). The chart change IS the
  point; baselines must follow.
- **Verify the line ORIGIN, not just the endpoint.** Many users
  have Goal/Soul both >50; the visible difference is in line
  STARTING POSITION, not endpoint. Audit assertions check the
  origin coordinates.
- **The tolerance cone apex must follow the line origin.** If
  the line starts at (160, 124) but the cone still emanates from
  (60, 224), the chart looks broken. Both must move together.
- Per `feedback_chart_as_feedback_engine.md`: the user-journey
  vision is "release grip → see line grow." Verify that after
  the recalibration, the visual relationship between grip drag
  and line length remains intuitive — a user reducing their grip
  should see a visibly longer trajectory line.
- Per AGENTS.md canon-faithful interpretation: if the SVG renderer
  has structural reasons the (50,50) anchor can't be applied
  cleanly (e.g., the cone math depends on line vector calculated
  from origin), document the constraint and propose an alternative
  approach in the report rather than forcing the change.
