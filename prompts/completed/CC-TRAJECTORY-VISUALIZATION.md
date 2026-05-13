# CC-TRAJECTORY-VISUALIZATION — Render the 4-Element Trajectory Chart

**Origin:** Canon `docs/canon/trajectory-model-refinement.md` §15. Phase 2 (CC-AIM-REBUILD-MOVEMENT-LIMITER) shipped `movementLimiter` on every constitution — usableMovement, gripDragModifier, aimGovernorModifier, toleranceDegrees are all computed and available. Phase 3a (CC-PHASE-3A-LABEL-LOGIC) shipped new quadrant + Risk Form labels. **The data exists; the chart hasn't been upgraded to show it.**

Jason's concern (2026-05-10): *"I believe Grip (and AIM to a certain degree) should be dragging the momentum plot further down."* — exactly correct, and this CC closes the gap.

The current chart renders only **potential movement** (the raw Goal/Soul vector length). This CC adds the three missing elements: **usable movement** (after drag + governor), **tolerance cone** (Aim-derived precision), and **Grip drag marker** (visible pullback indicator). Plus quadrant label refinement to consume Phase 3a's new labels.

**Method discipline:** Engine + render layer. Pure SVG generation from existing constitution fields. No new measurements, no new engine math, no LLM prompt changes, no cohort cache regen. Editorial judgment in visual design choices.

**Scope frame:** ~3-4 hours executor time. CC-mega scale because of the SVG design work + ensuring the chart degrades gracefully across edge cases (crisis path, zero movement, near-axis angles).

**Cost surface:** Zero LLM. Pure code + visual.

---

## Embedded context (CC executor environments don't see Cowork memory)

### Canon reference (§15)

> The trajectory chart should show at least four elements:
>
> 1. **Potential trajectory** — full raw Goal/Soul vector
> 2. **Usable trajectory** — shorter solid line after Aim + Grip effects
> 3. **Dotted tolerance cone** — derived primarily from Aim
> 4. **Grip drag marker** — visible pullback or drag indicator
>
> **Important visual correction:** do NOT render "Gripping" as a large lower-left label unless the user is actually in the Grip quadrant. Low Grip should show a small drag marker, not a competing region label.

### What's currently rendered (the gap)

The existing SVG (per Jason's rendered MD report):

```
- Solid line from origin to plot point at (Goal, Soul)
- Dashed quadrant dividers at Goal=50, Soul=50
- Quadrant labels (Gripping at lower-left, Giving at upper-right)
- Angle label (e.g., 32°)
- Length label (e.g., 70.8)
```

What's missing:
- Usable movement (shorter line)
- Tolerance cone (dotted ±N° fan)
- Grip drag marker (visible pullback)
- New labels (Goal-led Presence / Soul-led Presence / etc. per Phase 3a)
- Crisis-path differential treatment (per canon: trajectory framework doesn't apply for crisis users)

### Data available on every constitution

```ts
constitution.goalSoulGive.adjustedGoal           // 0-100 (used for X-axis)
constitution.goalSoulGive.adjustedSoul           // 0-100 (used for Y-axis)
constitution.goalSoulMovement.dashboard.movementStrength.length            // potentialMovement
constitution.goalSoulMovement.dashboard.movementLimiter.potentialMovement  // same value (redundant — pick one canonical)
constitution.goalSoulMovement.dashboard.movementLimiter.usableMovement     // post-drag-and-governor
constitution.goalSoulMovement.dashboard.movementLimiter.gripDragModifier   // 0.55-1.0
constitution.goalSoulMovement.dashboard.movementLimiter.aimGovernorModifier // 0.85-1.0
constitution.goalSoulMovement.dashboard.movementLimiter.toleranceDegrees   // 4-20
constitution.aimReading.score                    // new Aim 0-100
constitution.goalSoulGive.grippingPull.score     // legacy Grip 0-100 (what Risk Form consumes)
constitution.gripTaxonomy?.primary               // Primal Question label OR undefined
constitution.gripTaxonomy?.confidence            // "high" | "medium-high" | "medium" | "low"
constitution.movementQuadrant.label              // "Goal-led Presence" / "Giving / Presence" / etc.
constitution.riskFormFromAim?.letter             // "Open-Handed Aim" / "Ungoverned Movement" / etc.
constitution.coherenceReading?.pathClass         // "trajectory" | "crisis"
```

### Visual design (the four-element chart)

**Coordinate system:** Goal on X-axis (right →), Soul on Y-axis (up ↑). Both 0-100. SVG viewBox approximately 240 wide × 240 tall (square), with padding for labels.

#### Element 1: Potential trajectory line (existing, refined)

- Solid line from origin (0, 0) to plot point at (adjustedGoal, adjustedSoul)
- Color: dark ink (e.g., `#222` or `var(--ink)`)
- Stroke width: 2px

#### Element 2: Usable trajectory line (NEW)

- Solid line from origin to a point at the SAME angle but shorter — calculated from usableMovement
- The line should be on top of (or alongside) the potential line, ending earlier
- Color: same as potential, but slightly muted (e.g., `#444` or `var(--ink-soft)`)
- Stroke width: 2px
- Label: small "usable: 59.6" at the endpoint OR in a legend

**Geometric computation:**
```ts
const potentialEnd = { x: adjustedGoal, y: adjustedSoul };  // plot coords
const lengthRatio = usableMovement / potentialMovement;  // 0-1
const usableEnd = {
  x: adjustedGoal * lengthRatio,
  y: adjustedSoul * lengthRatio,
};
```

#### Element 3: Tolerance cone (NEW)

- Dotted/dashed lines forming a fan around the trajectory at ±toleranceDegrees
- For Jason (Aim ~47 → tolerance ±15°): fan spans 17° to 47° (a 30° wedge)
- The cone visually communicates "the trajectory read is approximate by this much"
- Color: light umber (e.g., `#c9a474` with opacity 0.5)
- Stroke: dashed (3 3 dash pattern), thin (1px)

**Geometric computation:**
```ts
const angle = atan2(adjustedSoul, adjustedGoal) * 180 / Math.PI;  // 0-90°
const lowerAngle = max(0, angle - toleranceDegrees);
const upperAngle = min(90, angle + toleranceDegrees);
// Render two dotted lines from origin at lowerAngle and upperAngle, ending at the same length as potential
const lowerEndX = potentialMovement * cos(lowerAngle * π/180);
const lowerEndY = potentialMovement * sin(lowerAngle * π/180);
// Similar for upper
```

#### Element 4: Grip drag marker (NEW)

- Small red arrow or curve near the plot point, indicating pullback
- Size proportional to Grip score: small at Grip < 20, medium at Grip 20-50, large at Grip > 50
- The marker should visually communicate "energy is being pulled back from here"
- Color: muted red (e.g., `#a83a3a` or `var(--red-mute)`)
- For Jason (Grip 21): small marker — visible but not dominant

**V1 simple approach:** a small filled arrow pointing back from the plot point toward the origin, with length proportional to (gripDragModifier-deficit) × marker-base-size. E.g., gripDrag 0.9 → 10% of base, gripDrag 0.6 → 40% of base.

**Aspirational future:** per-Primal direction differentiation (Am I safe? → backward, Am I successful? → past-line-hollow, etc.). NOT in V1 scope; document as follow-on.

#### Element 5 (bonus): Primal annotation

- When `gripTaxonomy.primary` exists AND confidence is high or medium-high, render a small text label near the drag marker: e.g., *"Pulling: Am I good enough?"*
- For low/medium confidence: just render the generic drag marker without Primal annotation
- Color: same muted red as drag marker

### Quadrant labels (refinement per Phase 3a)

Update the quadrant label rendering to consume Phase 3a's new labels:

- Upper-right region (high Goal + high Soul): label depends on angle band
  - In band (42-58°): "Giving / Presence"
  - Below band (< 42°): "Goal-led Presence"
  - Above band (> 58°): "Soul-led Presence"
- Upper-left region (low Goal, high Soul): "Love without Form"
- Lower-right region (high Goal, low Soul): "Work without Presence"
- Lower-left region (low Goal, low Soul):
  - If gripClusterFires: "Gripping"
  - Else: "Drift"

The chart should label the USER'S quadrant prominently (using `constitution.movementQuadrant.label`) and de-emphasize other quadrants (smaller text, lighter color).

**Important canon correction (§15):** if user is NOT in the Gripping quadrant, do NOT render "Gripping" as a large label at lower-left. It should be either absent OR very subtle. The chart shouldn't visually suggest the user is gripping when they're not.

### Crisis-path differential treatment

When `constitution.coherenceReading?.pathClass === "crisis"`, the trajectory framework doesn't apply (per canon §13 + CC-CRISIS-PATH-PROSE):

- Render the chart at REDUCED OPACITY (e.g., 50%)
- Replace the angle/length labels with a hedge: "*This read is one possible map. See Path section for more.*"
- Suppress the quadrant label
- Render the Grip drag marker but at slightly elevated visibility (since crisis = grip is doing significant work)

The intent: crisis-path users still see their data, but the chart visually communicates "this framework is held loosely for your shape right now."

### Tolerance cone for crisis path

For crisis-path users, the tolerance cone should be ESPECIALLY wide (because the trajectory framework's confidence is lower). Either:
- Render cone at 2× the normal toleranceDegrees
- Or render as a very-dashed/very-light cone with separate visual treatment

### Edge cases

1. **Goal = 0 AND Soul = 0 (zero movement):**
   - Don't render trajectory lines
   - Show "Movement Strength: 0" centered in the chart
   - Suppress tolerance cone, Grip drag marker
   - May render a hedge: *"Movement isn't registering yet. The trajectory map will populate as your answers surface more direction."*

2. **Near-axis angles (angle < 5° or angle > 85°):**
   - Render normally; cone may extend past axis
   - Clamp cone to chart boundaries

3. **Crisis path + high Grip:**
   - Combination of reduced opacity (crisis) + visible Grip marker (high)
   - Net effect: chart is muted but Grip is foregrounded — communicates "the framework doesn't fully apply, but the grip is real"

### Color palette (warm, paper-like aesthetic per existing report styles)

```css
:root {
  --chart-paper: var(--cream, #f6f1e6);
  --chart-axis: var(--ink-mute, #999);
  --chart-line: var(--ink, #222);           /* potential trajectory */
  --chart-usable: var(--ink-soft, #555);    /* usable trajectory */
  --chart-cone: #c9a474;                     /* tolerance cone (dotted) */
  --chart-drag: #a83a3a;                     /* Grip drag marker (red) */
  --chart-quadrant-active: var(--umber-deep, #6b3f1a);  /* user's quadrant */
  --chart-quadrant-passive: #a89b85;        /* other quadrants */
}
```

---

## Architecture

### File map

| File | Action | Purpose |
|---|---|---|
| `lib/trajectoryChart.ts` | NEW | Pure SVG-generation function. Reads constitution fields, returns SVG markup string. Single source of truth for both markdown and React rendering. |
| `lib/renderMirror.ts` | MODIFY | Replace inline SVG with `import { generateTrajectoryChartSvg } from "./trajectoryChart"` |
| `app/components/InnerConstitutionPage.tsx` | MODIFY | Same — consume the shared SVG generator |
| `tests/audit/trajectoryChart.audit.ts` | NEW | Audit assertions: SVG output is well-formed, all 4 elements present, edge cases handled |

### Discovery phase

Before implementing, the executor should:

1. **Read the existing SVG generation code** in `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx`. Understand the canonical structure, viewBox dimensions, label positioning, axis rendering.
2. **Verify field paths** on the constitution match the documented `movementLimiter` shape from Phase 2.
3. **Confirm the existing chart's coordinate system** (origin at lower-left, Y-axis up, etc.) before introducing new elements.

### Single-source-of-truth pattern

Per CC-PRODUCT-THESIS-CANON's `lib/productThesisAnchor.ts` precedent: the trajectory chart's SVG generation should live in ONE module exported as a function:

```ts
// lib/trajectoryChart.ts

export interface TrajectoryChartInputs {
  adjustedGoal: number;
  adjustedSoul: number;
  potentialMovement: number;
  usableMovement: number;
  toleranceDegrees: number;
  gripScore: number;
  gripDragModifier: number;
  aimGovernorModifier: number;
  primalPrimary: string | null;
  primalConfidence: "high" | "medium-high" | "medium" | "low" | null;
  quadrantLabel: string;
  pathClass: "trajectory" | "crisis";
  // optional: viewport size hint for responsive rendering
  viewportSize?: "mobile" | "desktop";
}

export function generateTrajectoryChartSvg(inputs: TrajectoryChartInputs): string;
```

Both consumers (markdown emit + React render) call this function. The SVG output is identical whether rendered in markdown or React.

### Composition rules

1. **The chart always renders, regardless of path class.** Crisis-path users get reduced-opacity treatment, not chart suppression.
2. **The chart degrades gracefully for missing fields.** If `gripTaxonomy.primary` is undefined, skip the Primal annotation. If `movementLimiter.usableMovement` is undefined (older constitutions), fall back to potential-only rendering.
3. **The chart's pixel dimensions are responsive.** viewBox-based SVG scales to container width; minimum sensible size ~200px wide.

---

## Audit assertions (12 NEW)

In `tests/audit/trajectoryChart.audit.ts`:

1. **`trajectory-chart-svg-well-formed`** — generated SVG passes basic well-formedness check (balanced tags, valid attributes).
2. **`trajectory-chart-four-elements-present`** — for a high-Aim+low-Grip fixture, the SVG contains all four canon §15 elements (regex check for potential line, usable line, tolerance cone path, drag marker).
3. **`trajectory-chart-jason-fixture-renders`** — Jason fixture's chart renders without errors; potential line, usable line, tolerance cone, drag marker all present.
4. **`trajectory-chart-jason-usable-shorter-than-potential`** — for Jason, the SVG's usable line endpoint coordinates are mathematically shorter than potential (specifically, ratio ≈ 0.84 → 0.85).
5. **`trajectory-chart-jason-tolerance-cone-correct`** — for Jason (toleranceDegrees ≈ 15), the cone's upper and lower angle bounds are 17° and 47° (within ±2° tolerance).
6. **`trajectory-chart-quadrant-label-active-prominence`** — the user's actual quadrant (e.g., "Goal-led Presence" for Jason) is rendered with `--chart-quadrant-active` color OR larger font size than other quadrant labels.
7. **`trajectory-chart-no-gripping-label-for-non-gripping-user`** — for fixtures where `gripClusterFires === false`, the chart does NOT render "Gripping" as a large lower-left label. (Per canon §15 visual correction.)
8. **`trajectory-chart-crisis-path-reduced-opacity`** — for any crisis-path fixture (e.g., trajectory/02-crisis-longing-without-build), the SVG includes opacity reduction OR alternate styling indicating the framework's reduced applicability.
9. **`trajectory-chart-zero-movement-edge-case`** — for fixtures with Goal=0 AND Soul=0 (e.g., ocean/06-thin-signal, gsg/06-neutral), the chart suppresses trajectory lines and renders a "movement isn't registering" hedge.
10. **`trajectory-chart-primal-annotation-high-confidence`** — for fixtures with high-confidence Primal cluster, the SVG includes the Primal Question name near the drag marker.
11. **`trajectory-chart-primal-annotation-suppressed-low-confidence`** — for fixtures with low-confidence Primal cluster, the SVG does NOT include a Primal annotation.
12. **`trajectory-chart-no-prose-changes`** — confirm that no LLM prompts or rubric examples were modified (`lib/synthesis3Llm.ts`, `lib/gripTaxonomyLlm.ts`, prose anchor blocks all unchanged).

In `tests/audit/aimRebuild.audit.ts` extension:
- 1 new assertion: chart elements render the new Aim-derived tolerance cone correctly across the cohort.

In `tests/audit/phase3aLabels.audit.ts` extension:
- 1 new assertion: chart quadrant labels match Phase 3a's new label union (Goal-led Presence, Soul-led Presence, etc.).

---

## Out-of-scope guardrails (DO NOT)

1. **Do NOT modify any LLM system prompts.** No prompt anchor blocks, no rubric examples, no PATH_CLASS_REGISTER_BLOCK.
2. **Do NOT modify the engine math.** `movementLimiter`, `aimReading`, `grippingPull` all stay as Phase 2 shipped them.
3. **Do NOT regenerate cohort cache.** The chart is HTML/SVG, not LLM-cached.
4. **Do NOT add new Risk Form / quadrant labels beyond Phase 3a's union.** Render existing labels; don't introduce new categories.
5. **Do NOT implement per-Primal directional differentiation for the Grip drag marker in V1.** Use a single shape with size proportional to Grip score. Per-Primal differentiation is a follow-on CC (CC-PRIMAL-GRIP-VECTORS).
6. **Do NOT add an age-trajectory canonical line to the chart.** That's a separate visualization (CC-AGE-CURVE-RENDER, not yet drafted) — depends on the user's age + the canonical age curve from CC-AGE-CALIBRATION.
7. **Do NOT add longitudinal / lifeline rendering (multi-session plot).** That's a major future feature (CC-LIFELINE-VISUALIZATION) requiring session-over-time data which isn't built yet.
8. **Do NOT modify CC-PRIMAL-COHERENCE / CC-CRISIS-PATH-PROSE / CC-AIM-REBUILD-MOVEMENT-LIMITER code.** Compose alongside.
9. **Do NOT introduce JavaScript animations or interactivity.** The chart is static SVG. Hovers, tooltips, click handlers — all out of scope.
10. **Do NOT introduce external chart libraries (D3, Chart.js, Recharts).** Hand-crafted SVG only; matches existing report aesthetic.
11. **Do NOT modify body cards or other prose render sections.** Only the trajectory chart in the Movement section changes.

---

## Verification checklist

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `npx tsx tests/audit/trajectoryChart.audit.ts` — all 12 assertions pass
- [ ] All other existing audits remain green
- [ ] Visual check on Jason fixture: render the chart manually and confirm it shows:
  - Solid line at 70.8 (potential)
  - Shorter solid line at ~59.6 (usable)
  - Dotted ±15° fan around the trajectory
  - Small red drag marker near plot point
  - "Goal-led Presence" prominently labeled (Jason's quadrant)
  - "Pulling: Am I good enough?" annotation near drag marker (if high confidence)
- [ ] Visual check on crisis fixture (e.g., trajectory/02-crisis-longing-without-build): reduced opacity, no degree label
- [ ] Visual check on zero-movement fixture (ocean/06-thin-signal): no trajectory lines, hedge message rendered

---

## Report-back format

1. **Summary** — files added/modified, line-count delta, audit pass count.
2. **`generateTrajectoryChartSvg` function signature + structure** — show the public interface, paste key geometric computations.
3. **Single-source-of-truth confirmation** — confirm both `lib/renderMirror.ts` and `app/components/InnerConstitutionPage.tsx` consume the shared module.
4. **Jason fixture SVG output paste** — the actual SVG string for Jason's chart. Should be human-readable enough to verify the four elements are present.
5. **Crisis fixture SVG output paste** — for one crisis-path fixture, show the reduced-opacity / alternate styling.
6. **Zero-movement fixture SVG output paste** — show the "movement isn't registering" hedge rendering.
7. **Quadrant label coverage** — confirm all 7 MovementQuadrantLabel values (Drift / Gripping / Work without Presence / Love without Form / Giving / Presence / Goal-led Presence / Soul-led Presence) render correctly in their respective chart positions.
8. **Audit pass/fail breakdown** — every audit listed in the verification checklist.
9. **Out-of-scope verification** — confirm none of the 11 DO-NOT items were touched.
10. **Recommendations for follow-on work** — including:
    - Whether per-Primal directional drag markers are worth a follow-on CC (would visually differentiate Am-I-safe? backward-pull vs Am-I-successful? ungrounded-extension etc.)
    - Whether the age-trajectory canonical line should be added in a separate CC
    - Any visual element that proved difficult to render legibly at mobile viewport (suggests responsive refinement)

---

## Architectural test for this CC

After landing, Jason's rendered MD report should show:

- A trajectory chart with **two solid lines** (potential at 70.8, usable at ~59.6) — the gap between them is the visible cost of Grip + Aim governor
- A **dotted ±15° cone** around the trajectory — visible imprecision matching his moderate Aim
- A **small red drag marker** near the plot point — proportional to his Grip 21 (small, but present)
- **"Goal-led Presence"** as his quadrant label (prominent), with other quadrants subtle
- Optional: **"Pulling: Am I good enough?"** annotation if Primal confidence is high

If Jason sees all of this on his next render, the visualization upgrade is complete and the *"Grip should be dragging momentum further down"* concern is empirically addressed.

---

**The architectural rule for this CC:** the chart is the front door of the report (per Product Thesis Canon — *"the trajectory image should be the front door"*). It must accurately render the math the engine is already computing. Today's gap is purely a render-layer gap; this CC closes it.
