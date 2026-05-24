# CC-147 — Fix drive-distribution donut label clipping

> Owner-flagged: "the donut isn't right — words being chopped off." The segment
> labels overflow the viewBox and get clipped left/right ("Building & W…",
> "…ainty 33%").

## Execution mode

Proceed without pausing. Single pass. On ambiguity, apply the codebase-faithful
interpretation, proceed, and flag it.

## Launch Directive

`claude --dangerously-skip-permissions`. Independent of CC-146/CC-148. This is a
single shared SVG generator + a re-snapshot. No engine-math change.

## Context — verified root cause

`lib/driveDistributionChart.ts` (`renderDriveDistributionDonut`):
- `VIEWBOX_W = VIEWBOX_H = 280`, `CENTER_X = CENTER_Y = 140`, `OUTER_R = 90`,
  `LABEL_R = 110`.
- Segment labels are placed at radius 110 with `text-anchor` `start` (right side)
  or `end` (left side) and contain long strings + a percentage, e.g.
  "Building & Wealth 24%", "People, Service & Society 41%", "Risk & Uncertainty
  33%" (`BUCKET_LABEL` L39-43).
- A right-side label anchored `start` at x≈215 runs off the 280-wide viewBox; a
  left-side label anchored `end` ending at x≈65 starts at a negative x. Both clip.
  (The bottom "middle"-anchored label is fine.)

This is the **shared** generator the Guide uses (clinician-mode donut) and the
Individual now uses (CC-145, via a call-site aria-label `.replace()`). Fixing it
here fixes both surfaces. It WILL change the SVG string → re-snapshot required.

## Task

Make the three segment labels fit fully inside the viewBox without clipping, in
the existing cream/brown style. Choose the cleanest approach (executor's call,
but prefer minimal visual disruption):

- **Preferred:** widen the horizontal viewBox (e.g. `viewBox="0 0 380 280"` or a
  symmetric left/right pad) and recenter the chart so left/right labels have room;
  keep the donut itself the same size and the `style="max-width:…"` sensible so it
  still renders ~square-ish. OR
- Put the percentage on a second `<text>` line under the label (shorter lines), OR
- Reduce `LABEL_R` and/or font-size and clamp label x so text stays within bounds.

Whatever the approach: the top/right and left labels must not clip, the center
"Claimed #1 / [bucket]" annotation must stay centered and legible, and the
no-signal placeholder branch (L88-95) must stay visually consistent (same
viewBox).

Sanity-check against the longest label set (all three buckets present, two-digit
percentages) — that's the worst case.

## Allowed to modify

- `lib/driveDistributionChart.ts`
- `tests/audit/twoTierBaseline.snapshot.json` (cold re-snapshot LAST)

Do NOT touch `renderMirror.ts`, `fiftyDegreeIndividual.ts`, the CC-145 call-site
`.replace()` (it only renames the aria-label and must keep working), or any
engine file.

## Acceptance criteria

1. Render the donut for a fixture with all three buckets present (e.g. Jason or
   Megan: cost/coverage/compliance ≈ 24/41/35). Confirm "Building & Wealth NN%",
   "People, Service & Society NN%", and "Risk & Uncertainty NN%" are each fully
   inside the viewBox (compute label x ± rendered text extent, or rasterize and
   eyeball) — no clipping on any side.
2. Center "Claimed #1 / [bucket]" annotation unchanged and centered.
3. The aria-label string the Guide's user-mode mask targets
   ("Drive distribution donut chart") is unchanged in this generator, so
   `renderMirror.ts`'s strip and CC-145's `.replace()` both still match.
4. Two-tier re-snapshotted LAST; the only baseline diff is the donut SVG geometry
   for fixtures that render it. `tsc` clean.

## Flag in report

- Which approach was taken and the resulting viewBox/dimensions.
- Confirm the Individual donut (post CC-145 `.replace()`) and the Guide clinician
  donut both render un-clipped.
