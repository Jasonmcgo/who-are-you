# CC-164-TRAJECTORY-TARGET-ZONE

> Cowork-chat CC, 2026-05-24.
> Add a shaded GREEN "Target Zone" to the trajectory chart — the
> conceptual opposite of the Grip Zone. Where the Grip Zone (warm,
> SW corner, near origin) marks the stuck-in-FUD region, the Target
> Zone marks the 50° integration band the reader is aiming for, so the
> chart shows a clear destination, not just a clear hazard.
> Render-layer only. Engine math unchanged.

## Why this CC exists

Jason's note on the Individual report: the trajectory chart shades the
Grip/FUD hazard zone but gives no visual answer to "where am I trying to
get?" The chart should show the target as plainly as it shows the trap.

Canon already defines the destination: the **50° integration band,
42–58°** (`lib/goalSoulCoherence.ts`, canon §2 — `classifyBand`: `<42`
productive-under-integrated, `42–58` integration, `>58` soul-heavy).
That angular corridor IS the target. We shade it green so the reader
sees the lane they want their trajectory line to fall inside, far from
origin.

The Grip Zone is a low-magnitude wedge hugging the origin (all angles).
The Target Zone is an angle-bounded corridor (42–58°) that runs OUT from
origin toward the NE — they share only the origin point, so they don't
visually fight.

## What "the target zone" is, geometrically

Score space is the existing 0–100 × 0–100 plot. `mapToSvg(goal, soul)`
maps Goal→x (right) and Soul→y (up). The trajectory angle is measured
from the Goal (x) axis upward toward Soul, so 0° = pure Goal, 90° = pure
Soul; the 42–58° band straddles 50° (slightly Soul-leaning of 45°), and
the NE corner (100,100) sits at 45° — inside the band.

The Target Zone is the wedge between the **42° ray** and the **58° ray**
from origin, clipped to the [0,100]² box. Do **not** hardcode the exit
points — compute each ray's exit from the band-edge degrees so the wedge
stays correct if the band constants ever change:

For a ray at angle θ from origin, the exit point on the box is the
smaller-t intersection of `x = t·cosθ` / `y = t·sinθ` with `x = 100` and
`y = 100`:
- 42° ray exits the **right edge** at score `(100, 100·tan42°)` ≈
  `(100, 90.0)`.
- 58° ray exits the **top edge** at score `(100/tan58°, 100)` ≈
  `(62.5, 100)`.
- The NE corner `(100, 100)` lies between the two rays, so it is a
  vertex of the wedge.

Polygon vertices, score space, in order:
`(0,0)` → `(100, 100·tan42°)` → `(100, 100)` → `(100/tan58°, 100)` →
close to `(0,0)`.

Map each vertex through the existing `mapToSvg` and emit a `<polygon>`.

## Changes — all in `lib/trajectoryChart.ts`

### 1. Constants (near the Grip Zone constants, ~line 48)

```ts
// CC-164 — Target Zone wedge. The 42–58° integration band (canon §2,
// mirrors lib/goalSoulCoherence.ts classifyBand) shaded as the
// destination corridor. Conceptual opposite of the Grip Zone.
const TARGET_ZONE_LOWER_DEG = 42;
const TARGET_ZONE_UPPER_DEG = 58;
const TARGET_ZONE_FILL = "#3f8f5f";   // muted green, distinct from warm CONE_COLOR
const TARGET_ZONE_OPACITY = 0.12;     // same visual weight as GRIP_ZONE_OPACITY (0.15) but cooler
```

(If you prefer to import `42`/`58` from `goalSoulCoherence.ts` rather
than restate them, only do so if it adds no import cycle — the chart is
a pure function with no `node:*`/SDK imports and must stay that way. A
local restatement with the cross-reference comment is acceptable and is
the safer default.)

### 2. New builder `svgTargetZoneWedge()`

Mirror the shape of `svgGripTriangle()`. Compute the two ray exit points
from `TARGET_ZONE_LOWER_DEG` / `TARGET_ZONE_UPPER_DEG` (helper that, given
θ in degrees, returns the box-exit in score space per the formula above),
build the 4-vertex polygon `(0,0)`, lower-ray-exit, `(100,100)`,
upper-ray-exit, map each through `mapToSvg`, and return:

```
<polygon points="..." fill="${TARGET_ZONE_FILL}" opacity="${TARGET_ZONE_OPACITY}" data-element="target-zone-wedge" />
```

No stroke (fill alone communicates the zone, matching the Grip Zone).

### 3. Render it in BOTH assembly branches

The Grip Zone is an always-on orientation element rendered right after
the axes in both the zero-movement branch and the normal branch. The
Target Zone is the same kind of orientation element — add it in both,
**immediately after `svgGripTriangle()`** so both zones sit behind the
axis labels, tolerance cone, trajectory lines, drag marker, and legend
(z-order = source order in SVG):

- Zero-movement branch (~line 521): insert `  ${svgTargetZoneWedge()}`
  right after the `svgGripTriangle()` line.
- Normal branch (~line 569): compute `const targetZone = svgTargetZoneWedge();`
  alongside `const gripTriangle = svgGripTriangle();` and insert
  `  ${targetZone}` right after `  ${gripTriangle}` in the returned array.

Crisis path: leave as-is. The whole SVG is dimmed via `wrapperOpacity`
(0.55); the Target Zone dims with it, which is correct — the destination
is still worth showing on a crisis map.

### 4. Legend entry

Add one row to `svgLegend` directly below the Grip Zone row, using a
small green polygon swatch (mirror the grip-zone swatch at line ~451 but
with `TARGET_ZONE_FILL` / `TARGET_ZONE_OPACITY`):

- Text: `"Shaded green wedge: Target Zone — the 50° integration band you're aiming for"`
- `data-element="legend-target-zone"`

The legend block grows by one line. Verify the added row still fits
inside the viewBox (legend starts at `LEGEND_START_Y = 246`, viewBox
height 320, `LEGEND_LINE_HEIGHT = 14`). Count current legend rows: if
adding one row pushes past ~318, reduce inter-row spacing for the legend
only or tighten as needed — but do NOT change `VIEWBOX_HEIGHT` or the
plot geometry. Report the final legend row count + lowest y used.

## Files to modify

- `lib/trajectoryChart.ts` — constants, `svgTargetZoneWedge()`, both
  assembly branches, legend row.
- `tests/audit/trajectoryChart.audit.ts` — add an assertion that the SVG
  contains `data-element="target-zone-wedge"` with a 4-point polygon
  whose mapped vertices match `mapToSvg` of `(0,0)`, `(100,100·tan42°)`,
  `(100,100)`, `(100/tan58°,100)` (allow ±0.5 svg-unit rounding). Add a
  legend assertion for `data-element="legend-target-zone"`.
- `tests/audit/chartMidpointRecalibration.audit.ts` (or whatever the
  current chart-geometry audit is named) — only touch if it asserts an
  exact element count or exact legend-row count that the new row breaks;
  update that count, don't weaken the assertion.

## What stays unchanged

- Engine math — Goal, Soul, Aim, Grip, Movement, angle — all untouched.
- `mapToSvg`, viewBox, plot bounds, axes, axis labels.
- Grip Zone triangle (geometry, color, opacity, legend) — unchanged.
- Tolerance cone, trajectory lines, drag marker, quadrant labels,
  consolidated readout, crisis hedge, zero-movement hedge.
- Goal/Soul coherence band logic in `goalSoulCoherence.ts` — read-only
  reference; do not edit.

## Do NOT

- Change any engine number or the angle convention.
- Hardcode the wedge exit points as literals — compute them from the
  band-edge degrees (the whole point is single-source-of-truth with
  canon §2).
- Change `VIEWBOX_HEIGHT`, `PLOT_SIZE`, margins, or the score→SVG mapping.
- Reuse the warm `CONE_COLOR` for the Target Zone — it must read as a
  distinct (green/cool) zone so reader doesn't confuse target with grip.
- Make commits or push (Cowork-chat handles after Jason's local visual
  re-verification).

## Audit acceptance

- `tsc --noEmit` clean; lint clean.
- Chart audits green (with the new assertions).
- Full audit suite at same green count as pre-CC (or +0; this is
  additive render-layer only) — run the full suite at close per the
  "full suite after bundle" rule, not just the chart audit.

## Cost

$0. Pure render-layer change, no engine math, no LLM.

## Report back

- Files modified.
- The exact 4 polygon points (svg units) emitted for a sample render.
- Final legend text + total legend row count + lowest y used (confirm
  ≤ viewBox 320).
- Audit results (chart audits + full-suite green count).
- One-line description of the visual change for Jason's review.

## Next after this closes

Jason local visual re-verification: pull an Individual report, confirm a
green corridor runs out toward the upper-right between ~42° and ~58°,
behind the trajectory line, distinct from the warm SW Grip Zone, with a
matching green legend row. If approved, this rides the next push.
