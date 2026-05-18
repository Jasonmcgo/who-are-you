# CODEX-CC-105B-CHART-VISUAL-CLEANUP

> Cowork-chat informal CODEX, 2026-05-18.
> Visual-cleanup amendment to CC-105 Phase 1, fired pre-push after
> local visual review surfaced three issues. Engine math unchanged.

## Why this CODEX exists

CC-105 substantively closed with chart geometry restored to radial
origin and a Grip-threshold quarter-circle arc at score-space
radius 50. Local visual review revealed three issues:

1. The Grip arc is drawn with wrong curvature direction — bulges
   outward instead of hugging the SW corner.
2. The arc shape itself is harder to read than a simple triangle
   inscribed in the (0,0)-(50,50) SW box.
3. The chart has too many dashed elements (tolerance cone +
   potential trajectory + Grip arc + midpoint gridlines = 4 distinct
   dashed visuals), creating visual noise.

This CODEX replaces the arc with a shaded triangle and reduces the
dashed-element count.

## Changes

### 1. Replace `svgGripThresholdArc` with `svgGripTriangle`

Remove the quarter-circle arc geometry entirely. Replace with a
filled triangle:

- Vertices in SCORE space: (0, 0), (50, 0), (0, 50)
- Hypotenuse: straight line from (50, 0) to (0, 50), 45° to both
  axes, slope -1
- Fill: low-opacity warm tone (suggest `#c9a474` at opacity 0.15,
  matching existing tolerance-cone color family)
- No stroke needed (the fill alone communicates the zone)

Use SVG `<polygon>` element with three points. Converted to SVG
coordinates with existing score→SVG mapping.

Rename: `svgGripThresholdArc` → `svgGripTriangle` (or `svgFudTriangle`
if you prefer "FUD" branding internally — keep external label as
"Grip Zone").

### 2. Remove midpoint gridlines

Delete the dashed cross at score (50, 50):

```
<line ... data-element="midpoint-gridline-vertical" />
<line ... data-element="midpoint-gridline-horizontal" />
```

The radial-origin model doesn't anchor anything at midpoint, so the
gridlines no longer serve navigation. They added visual noise without
informational value.

### 3. Convert potential-trajectory line to solid low-opacity

Currently the potential line uses `stroke-dasharray="2 2"`. Change to
solid stroke at low opacity (suggest `stroke-width="1" opacity="0.45"`,
no dasharray). This:
- Reduces dashed-element count by one
- Still reads as "lighter than usable" because of opacity
- Is more legible than a dashed line at small sizes

### 4. Legend updates

Drop the "Midpoint dot" legend entry (already removed in CC-105 but
verify).

Update the Grip-threshold legend entry:
- Before: "Dashed arc: Grip threshold — cross outward to leave Grip
  territory"
- After: "Shaded triangle: Grip Zone — the stuck-in-FUD area near
  origin"

Update the potential-trajectory legend entry:
- Before: "Faint line: potential trajectory before Grip drag + Aim
  governance" (dashed icon)
- After: same text, solid-low-opacity icon

## Final visual hierarchy (target state)

- **Solid full-opacity dark line:** Usable trajectory
- **Solid low-opacity gray line:** Potential trajectory
- **Solid red short marker:** Grip drag arrow
- **Solid filled triangle (low-opacity warm tone):** Grip Zone in SW
  corner
- **Dashed fan:** Tolerance cone (one dashed element only)

Five distinct visuals, only one dashed.

## Files to modify

- `lib/trajectoryChart.ts` — replace `svgGripThresholdArc` function
  with `svgGripTriangle`; remove midpoint-gridline rendering;
  convert potential-line dasharray to solid+opacity; legend updates.

- `tests/audit/chartMidpointRecalibration.audit.ts` (or renamed) —
  update the Grip-threshold assertion: was checking for arc path at
  radius 100 SVG; now check for `<polygon>` with three points
  matching the score→SVG mapping of (0,0), (50,0), (0,50). Remove
  any midpoint-gridline assertions (they should be absent now).

- `tests/audit/trajectoryChart.audit.ts` — update if it references
  the midpoint gridlines or the arc shape.

- `tests/audit/aimRebuild.audit.ts` — update assertion 24.5 if it
  references arc-or-midpoint-gridline behavior.

## What stays unchanged

- Trajectory line origin at score (0, 0) — confirmed correct.
- Line endpoint formulas (Usable / Potential).
- Tolerance cone geometry (apex at origin, fan around trajectory
  angle, dashed).
- Grip drag arrow position and direction.
- Chart 100×100 axis bounds, viewBox, score→SVG coordinate mapping.
- Engine math — Goal, Soul, Aim, Grip, Movement formulas all
  unchanged.
- Soul direct bonuses (Phase 2 of CC-105 stays as shipped).

## Audit acceptance

- Chart-related audits all green:
  - `chartMidpointRecalibration` (or renamed)
  - `trajectoryChart`
  - `aimRebuild`
- Full audit suite remains at same green count as CC-105 close (or
  improved if midpoint-gridline removal closes any incidental drift).
- `tsc --noEmit` clean.
- `lint` clean.

## Do NOT

- Modify engine math (V/O, Goal, Soul, Aim, Grip, Movement).
- Modify Phase 2 Soul direct-bonus values (left at CC-105 values).
- Modify chart axes, viewBox, or score→SVG mapping.
- Touch Next Moves prose, Grip Pattern, or any non-chart engine
  surface.
- Make commits or push (Cowork-chat handles after local visual
  re-verification).

## Expected runtime

~15-20 minutes:
- Triangle replacement + dashed-line cleanup: ~10 min.
- Audit assertion updates: ~5 min.
- Local audit run: ~5 min.

## Cost

$0. Pure render-layer change, no engine math, no LLM.

## Report back

- Files modified.
- Final chart legend text.
- Audit run results (chart audits + full suite count if convenient).
- One-line description of visual change for review.

## Next after this closes

Local visual re-verification by Jason (pull report, confirm:
triangle shaded in SW corner, no midpoint gridline cross, potential
line solid-faint not dashed, only the tolerance cone remains
dashed). If approved, fire CODEX-CC-105-FINALIZE (baselines + full
audit + maybe cache regen) and push the bundle.
