# CC-CHART-LABEL-LEGIBILITY-AND-TOLERANCE-SMOOTHING — Trajectory Chart Render Fixes

**Origin:** Three rendered fixtures (Jason, Cindy, Michele) surfaced consistent legibility issues in the trajectory chart shipped by CC-TRAJECTORY-VISUALIZATION:

1. **Right-edge label clipping** — "Pulling: Am I gc[ood enough?]", "Goal-led Presenc[e]", "Work without Presenc[e]" all cut off on the right edge
2. **Left-edge label clipping** — "[L]ove without Form" cut off on the left edge (Michele's render)
3. **Stacked label collisions** near plot point (potential length "70.8" + "usable 59.2" + Primal annotation + drag marker all crowding)
4. **Tolerance cone has no legend** — dashed umber lines fan out but user can't tell what they mean
5. **Tolerance cone bands are piecewise-stepped at intervals that feel coarse** — 10° (Aim 55-69), 15° (Aim 40-54), 20° (Aim <40). Jumping +5° per band creates visible discontinuity around the boundaries.

This CC fixes the layout problems and smooths the tolerance cone band function.

**Method discipline:** Pure SVG layout + the tolerance-band function in `lib/movementLimiter.ts`. No engine math changes elsewhere. No LLM prompt changes. No cohort cache regen.

**Scope frame:** ~1-2 hours executor time. CC-standard scale. Two work segments — chart layout fixes + tolerance band smoothing.

**Cost surface:** Zero LLM. Pure code + visual.

---

## Embedded context

### Observed legibility issues (3 cohort fixtures rendered)

| Fixture | Issue |
|---|---|
| Jason (angle 32°) | Right-clip: "Goal-led Presenc", "Pulling: Am I gc"; quadrant labels overlap axis labels |
| Cindy (angle 56°) | Right-clip: "Giving / Presenc[e]"; "Pulling: Am I wanted?" overlaps Giving / Presence quadrant label |
| Michele (angle 63°) | Left-clip: "ove without Form"; potential and usable length labels collide near plot point |

### Tolerance cone band concern (canon §6)

Current piecewise function:
```ts
if (aim >= 85) return 4;
if (aim >= 70) return 7;
if (aim >= 55) return 10;
if (aim >= 40) return 15;
return 20;
```

Jumps: 4→7 (+3°), 7→10 (+3°), 10→15 (+5°), 15→20 (+5°). The 10→15 jump at Aim 55 boundary is visible — a user at Aim 54 sees ±15° while Aim 55 sees ±10°. The 50% change at a single boundary feels arbitrary.

Smoothed bands (Jason validated previously):
```ts
if (aim >= 85) return 3;
if (aim >= 70) return 6;
if (aim >= 55) return 9;
if (aim >= 45) return 12;   // NEW intermediate band
if (aim >= 35) return 15;
return 18;
```

Jumps: 3→6, 6→9, 9→12, 12→15, 15→18 — each step is +3°. Same total range (3°-18°), smoother transitions.

For Jason (Aim 51.5): currently lands ±15° → would land ±12° under smoothing.
For Cindy (Aim 59.8): currently lands ±10° → would land ±9° under smoothing.
For Michele (Aim 47.1): currently lands ±15° → would land ±12° under smoothing.

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/trajectoryChart.ts` | MODIFY | Fix label clipping (both edges); move Primal annotation to a legend below the chart; consolidate length labels; add tolerance-cone legend item |
| `lib/movementLimiter.ts` | MODIFY | Smooth `computeToleranceDegrees` band function (6 bands instead of 5; smaller per-band step) |
| `tests/audit/trajectoryChart.audit.ts` | EXTEND | +5 new assertions covering legibility + cone smoothing |

### Segment 1: Chart layout fixes

#### 1.1 Widen SVG viewBox to give labels breathing room

Current viewBox is too tight. Expand horizontally by ~80px on each side (160px total horizontal headroom) to accommodate quadrant labels and Primal annotation without clipping. Maintain aspect ratio if needed.

#### 1.2 Right-edge label clamping

For labels that anchor at the right side (Goal-led Presence in top-right quadrant, Work without Presence in bottom-right):
- Use `text-anchor="end"` with x-coordinate set near the right edge
- OR: shorten labels to use first 1-2 words when space is constrained (e.g., "Goal-led" / "Work-only")

For the Primal annotation ("Pulling: Am I [primal]?"), move it OUT of the chart proper:
- Below the chart, as a legend item: *"Pulling: Am I good enough? — high confidence"*
- Frees up the plot-point region for the drag marker + length labels

#### 1.3 Left-edge label clamping

For labels that anchor at the left side (Love without Form in top-left quadrant):
- Use `text-anchor="start"` with x-coordinate set near the left edge of the chart, AFTER the Soul axis label
- Ensure no overflow beyond the SVG bounds

#### 1.4 Consolidate length labels near plot point

Current renders show two stacked text elements near the plot point: "70.8" (potential) and "usable 59.2" (usable). They overlap each other and with the drag marker.

Consolidate to a single readout positioned ABOVE the plot point (not below):
```
Potential 70.8 → Usable 59.2 (-16% drag)
```

For Cindy: `Potential 85.1 → Usable 62.9 (-26% drag)`
For Michele: `Potential 67.7 → Usable 52.5 (-22% drag)`

Use small font, italic, color `var(--ink-mute)`. Position 8-12px above the potential line endpoint.

#### 1.5 Add tolerance cone legend

Below the chart, add a small legend block listing:
- *"Solid line: trajectory (potential)"* (with a short solid-line swatch)
- *"Inner line: usable movement after Grip drag + Aim governance"* (with a shorter solid-line swatch)
- *"Dashed fan: tolerance cone (±{N}°, derived from Aim)"* (with dashed-line swatch; N populated dynamically from the actual tolerance value)
- *"Red marker: Grip drag — what's pulling movement back"* (with red arrow swatch)
- *"Pulling: {Primal} — {confidence}"* (only when a Primal annotation applies)

Style: small, monospace, `var(--ink-mute)`, single column. Total height ~80px.

#### 1.6 Reposition angle label

The "32°" / "56°" / "63°" angle label currently sits at the origin, sometimes overlapping the "Drift" quadrant label. Move it to:
- Above the line at the midpoint of the potential trajectory
- Or: as part of the consolidated length readout (e.g., `32° · Potential 70.8 → Usable 59.2`)

### Segment 2: Tolerance cone band smoothing

#### 2.1 Update `computeToleranceDegrees` in `lib/movementLimiter.ts`

Replace the existing 5-band piecewise function with the 6-band smoother:

```ts
export function computeToleranceDegrees(aim: number): number {
  if (aim >= 85) return 3;
  if (aim >= 70) return 6;
  if (aim >= 55) return 9;
  if (aim >= 45) return 12;
  if (aim >= 35) return 15;
  return 18;
}
```

Total range narrowed slightly (3°-18° vs 4°-20°), with smaller +3° per-band step. The narrowing at the high-Aim end (3° vs 4° at Aim 85+) makes high-Aim users visually "more precise"; the narrowing at the low-Aim end (18° vs 20° at Aim <35) keeps the cone from dominating the chart when Aim is very thin.

#### 2.2 Verify against cohort

After the change, verify across cohort:
- Jason (Aim 51.5): cone 12° (was 15°) — visible narrowing
- Cindy (Aim 59.8): cone 9° (was 10°) — minor narrowing
- Michele (Aim 47.1): cone 12° (was 15°) — visible narrowing
- High-Aim fixture (Aim 80+): cone 6° (was 7°) — minor narrowing
- Low-Aim fixture (Aim 25): cone 18° (was 20°) — minor narrowing

No fixture's cone classification should jump multiple bands; the smoothing is intentional smoothing, not a redefinition.

---

## Audit assertions (8 NEW)

In `tests/audit/trajectoryChart.audit.ts` extension:

1. **`chart-no-label-clipping-right`** — for cohort fixtures with quadrant labels in the right column (Giving / Presence, Goal-led Presence, Work without Presence), the rendered label is NOT truncated (regex check on rendered SVG strings).

2. **`chart-no-label-clipping-left`** — for cohort fixtures with quadrant labels in the left column (Love without Form), the rendered label is NOT truncated.

3. **`chart-primal-annotation-in-legend-not-chart`** — when Primal annotation applies, the SVG contains the "Pulling: ..." text in the legend region (below the chart axes), NOT inside the chart plot area.

4. **`chart-consolidated-length-readout`** — the chart contains ONE consolidated length readout (regex: "Potential .* → Usable .*"), NOT two separate length labels.

5. **`chart-tolerance-cone-legend-present`** — for cohort fixtures with a tolerance cone rendered, the SVG legend block contains a "Dashed fan: tolerance cone" entry with the dynamic ±N° value.

6. **`tolerance-cone-band-smoothing-correct`** — synthetic test cases:
   - aim=90 → 3°
   - aim=75 → 6°
   - aim=60 → 9°
   - aim=50 → 12°
   - aim=40 → 15°
   - aim=20 → 18°

7. **`tolerance-cone-no-jump-greater-than-3-degrees`** — testing all integer Aim values 0-100, no two adjacent Aim values produce tolerance values differing by more than 3°.

8. **`trajectory-chart-render-test-on-all-cohort-fixtures`** — every cohort fixture (28+ total) produces a chart with no rendering errors, no label overflow, no overlapping primary elements. Observational audit, surfaces any unexpected layout failures.

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify the engine math.** Goal/Soul/Aim/Grip/Movement Strength calculations stay as Phase 2 shipped them.
2. **Do NOT modify Quadrant label logic.** The Goal-led / Soul-led / Giving / Presence determinations are Phase 3a; CC-MOMENTUM-HONESTY handles Quadrant refinement.
3. **Do NOT modify Risk Form label logic.** Phase 3a's letter labels stay.
4. **Do NOT modify LLM prompts.** No prose register changes.
5. **Do NOT regenerate cohort cache.** Chart is render-layer; cache is LLM-output.
6. **Do NOT add new chart elements beyond legend items.** No new visualizations (per-Primal direction differentiation, age curve, etc.) — those are separate CCs.
7. **Do NOT change colors or palette tokens.** Use existing `--ink`, `--ink-soft`, `--ink-mute`, `--umber-soft`, etc.
8. **Do NOT modify the per-quadrant prose templates in `lib/movementQuadrant.ts`.** Only the SVG label rendering changes.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npx tsx tests/audit/trajectoryChart.audit.ts` — extended; all 12+8 = 20 assertions pass
- [ ] All other existing audits remain green
- [ ] Visual check on Jason, Cindy, Michele fixtures: no clipped labels; legend visible; tolerance cone correctly labeled; consolidated length readout positioned cleanly

---

## Report-back format

1. **Summary** — files modified, line-count delta, audit pass count.
2. **Updated `computeToleranceDegrees` function paste** — confirm 6-band formula.
3. **Chart layout changes paste** — show key SVG fragments (legend block, consolidated readout, label positioning).
4. **Cohort tolerance cone validation table** — for Jason / Cindy / Michele and 3 cohort fixtures spanning the Aim range, show old cone vs new cone.
5. **Audit pass/fail breakdown** — every assertion from the verification checklist.
6. **Out-of-scope verification** — confirm none of the 8 DO-NOT items were touched.

---

**Architectural test:** Jason's, Cindy's, and Michele's renders all display:
- All quadrant labels fully visible (no clipping)
- Primal annotation in a legend below the chart (not crowding the plot point)
- A single consolidated length readout ("Potential X → Usable Y (-Z% drag)")
- A tolerance cone legend item showing the actual ±N° derived from their Aim
- Smoothed tolerance cone (Jason: 12° down from 15°; Michele: 12° down from 15°; Cindy: 9° down from 10°)
