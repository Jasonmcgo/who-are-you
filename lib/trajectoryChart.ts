// CC-TRAJECTORY-VISUALIZATION → CC-CHART-LABEL-LEGIBILITY-AND-TOLERANCE-SMOOTHING.
//
// Per canon `docs/canon/trajectory-model-refinement.md` §15, the chart
// renders:
//
//   1. Potential trajectory  — full raw Goal/Soul vector (solid line)
//   2. Usable trajectory     — shorter solid line after Aim governor + Grip drag
//   3. Tolerance cone        — dotted ±toleranceDegrees fan around trajectory
//   4. Grip drag marker      — visible pullback indicator near plot point
//
// Plus a legend block below the plot that explains every element +
// surfaces the Primal annotation (moved out of the plot region per
// CC-CHART-LABEL-LEGIBILITY-AND-TOLERANCE-SMOOTHING to stop the
// "Pulling: …" text from colliding with the drag marker).
//
// Layout — viewBox is 320×320. Plot occupies x:60..260, y:24..224
// (200×200 square). Legend occupies y:246..320. The 60-px horizontal
// margins on each side give quadrant labels and the consolidated
// length readout enough room to render without clipping on either edge.
//
// Pure function: no API calls, no SDK, no `node:*` imports. Single
// source of truth for both `renderMirror.ts` (markdown emit) and
// `InnerConstitutionPage.tsx` (React render).

// ─────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 320;
const PLOT_SIZE = 200;
const MARGIN_LEFT = 60;
const MARGIN_TOP = 24;
const ORIGIN_X = MARGIN_LEFT;             // 60
const ORIGIN_Y = MARGIN_TOP + PLOT_SIZE;  // 224
const PLOT_RIGHT = MARGIN_LEFT + PLOT_SIZE; // 260
const PLOT_TOP = MARGIN_TOP;              // 24

// Legend block (below plot area).
const LEGEND_START_Y = ORIGIN_Y + 22;     // 246
const LEGEND_LINE_HEIGHT = 14;
const LEGEND_SWATCH_X1 = 22;
const LEGEND_SWATCH_X2 = 42;
const LEGEND_TEXT_X = 48;

// Drag-marker base size (in svg-units). Scales by gripDragModifier
// deficit; at full drag, marker length = MAX.
const DRAG_MARKER_MAX_LENGTH = 18;

const CONE_COLOR = "#c9a474";
const DRAG_COLOR = "#a83a3a";
// CC-MOMENTUM-HONESTY — the chart's primary line is now Usable (dark,
// solid). Potential becomes a ghosted reference (faint, slightly
// translucent) so the line the user *sees* matches the line they
// can actually USE.
const POTENTIAL_LINE_COLOR = "#bcbcbc";
const USABLE_LINE_COLOR = "#222";
const ACTIVE_QUADRANT_COLOR = "#6b3f1a";
const PASSIVE_QUADRANT_COLOR = "#a89b85";
const INK_MUTE = "#777";
const AXIS_COLOR = "#999";

// ─────────────────────────────────────────────────────────────────────
// Inputs + helpers
// ─────────────────────────────────────────────────────────────────────

export interface TrajectoryChartInputs {
  adjustedGoal: number;
  adjustedSoul: number;
  potentialMovement: number;
  usableMovement: number | null;
  toleranceDegrees: number | null;
  gripScore: number;
  gripDragModifier: number | null;
  aimGovernorModifier: number | null;
  primalPrimary: string | null;
  primalConfidence: "high" | "medium-high" | "medium" | "low" | null;
  /** Active quadrant label per Phase 3a (e.g., "Goal-led Presence"). */
  quadrantLabel: string;
  /** Whether the Grip cluster fired (controls "Gripping" passive label). */
  gripClusterFires: boolean;
  pathClass: "trajectory" | "crisis";
  /** Angle in degrees (0-90). */
  angleDegrees: number;
}

function mapToSvg(goal: number, soul: number): { x: number; y: number } {
  const x = ORIGIN_X + (goal / 100) * PLOT_SIZE;
  const y = ORIGIN_Y - (soul / 100) * PLOT_SIZE;
  return { x, y };
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────────────
// SVG element builders
// ─────────────────────────────────────────────────────────────────────

function svgAxes(): string {
  return [
    `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${PLOT_RIGHT}" y2="${ORIGIN_Y}" stroke="${AXIS_COLOR}" stroke-width="1" />`,
    `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${ORIGIN_X}" y2="${PLOT_TOP}" stroke="${AXIS_COLOR}" stroke-width="1" />`,
  ].join("\n  ");
}

function svgQuadrantGuides(): string {
  const mid = mapToSvg(50, 50);
  return [
    `<line x1="${mid.x}" y1="${ORIGIN_Y}" x2="${mid.x}" y2="${PLOT_TOP}" stroke="#ccc" stroke-width="0.5" stroke-dasharray="3 3" />`,
    `<line x1="${ORIGIN_X}" y1="${mid.y}" x2="${PLOT_RIGHT}" y2="${mid.y}" stroke="#ccc" stroke-width="0.5" stroke-dasharray="3 3" />`,
  ].join("\n  ");
}

function svgAxisLabels(): string {
  return [
    `<text x="${PLOT_RIGHT}" y="${ORIGIN_Y + 14}" font-size="10" font-family="system-ui, sans-serif" fill="#666" text-anchor="end">Goal →</text>`,
    `<text x="${ORIGIN_X - 10}" y="${PLOT_TOP + 4}" font-size="10" font-family="system-ui, sans-serif" fill="#666" text-anchor="start">Soul ↑</text>`,
  ].join("\n  ");
}

// Quadrant corner labels. Each label is anchored at the appropriate
// plot edge (text-anchor=start for left column, text-anchor=end for
// right column) so the text never overflows the viewBox.
function svgCornerLabels(
  activeLabel: string,
  gripClusterFires: boolean
): string {
  // Resolve which canonical label appears in the NE corner — Goal-led
  // Presence / Soul-led Presence / Giving / Presence are mutually
  // exclusive renderings of the high-both quadrant.
  let neLabel = "Giving / Presence";
  if (
    activeLabel === "Goal-led Presence" ||
    activeLabel === "Soul-led Presence" ||
    activeLabel === "Giving / Presence"
  ) {
    neLabel = activeLabel;
  }
  const swLabel = gripClusterFires ? "Gripping" : "Drift";

  // Position anchors:
  //   NE — anchor=end at (PLOT_RIGHT - 4, PLOT_TOP + 14)
  //   NW — anchor=start at (ORIGIN_X + 4, PLOT_TOP + 14)
  //   SE — anchor=end at (PLOT_RIGHT - 4, ORIGIN_Y - 6)
  //   SW — anchor=start at (ORIGIN_X + 4, ORIGIN_Y - 6)
  const items: Array<{
    label: string;
    anchor: "start" | "end";
    x: number;
    y: number;
  }> = [
    { label: neLabel, anchor: "end", x: PLOT_RIGHT - 4, y: PLOT_TOP + 14 },
    { label: "Love without Form", anchor: "start", x: ORIGIN_X + 4, y: PLOT_TOP + 14 },
    { label: "Work without Presence", anchor: "end", x: PLOT_RIGHT - 4, y: ORIGIN_Y - 6 },
    { label: swLabel, anchor: "start", x: ORIGIN_X + 4, y: ORIGIN_Y - 6 },
  ];

  return items
    .map((p) => {
      // Skip "Gripping" SW label unless the user is actually in that
      // quadrant — canon §15 visual correction.
      if (p.label === "Gripping" && activeLabel !== "Gripping") return "";
      const isActive = p.label === activeLabel;
      const fontSize = isActive ? 12 : 9;
      const fill = isActive ? ACTIVE_QUADRANT_COLOR : PASSIVE_QUADRANT_COLOR;
      const weight = isActive ? "600" : "400";
      const opacity = isActive ? 1 : 0.6;
      return `<text x="${p.x}" y="${p.y}" font-size="${fontSize}" font-family="system-ui, sans-serif" fill="${fill}" text-anchor="${p.anchor}" font-weight="${weight}" opacity="${opacity}">${escapeXml(p.label)}</text>`;
    })
    .filter((s) => s.length > 0)
    .join("\n  ");
}

// Element 3: tolerance cone. Renders two dotted lines from origin at
// (angle - tolerance) and (angle + tolerance), clamped to [0, 90].
// Length matches potential — the cone visualizes directional
// uncertainty at the trajectory's full reach.
function svgToleranceCone(
  angle: number,
  toleranceDegrees: number,
  potentialMovement: number,
  isCrisis: boolean
): string {
  if (toleranceDegrees <= 0 || potentialMovement <= 0) return "";
  const effectiveTolerance = isCrisis
    ? toleranceDegrees * 2
    : toleranceDegrees;
  const lowerAngle = Math.max(0, angle - effectiveTolerance);
  const upperAngle = Math.min(90, angle + effectiveTolerance);
  const r = potentialMovement;
  const lowerGoal = r * Math.cos((lowerAngle * Math.PI) / 180);
  const lowerSoul = r * Math.sin((lowerAngle * Math.PI) / 180);
  const upperGoal = r * Math.cos((upperAngle * Math.PI) / 180);
  const upperSoul = r * Math.sin((upperAngle * Math.PI) / 180);
  const lowerEnd = mapToSvg(lowerGoal, lowerSoul);
  const upperEnd = mapToSvg(upperGoal, upperSoul);
  const opacity = isCrisis ? 0.35 : 0.55;
  return [
    `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${lowerEnd.x.toFixed(1)}" y2="${lowerEnd.y.toFixed(1)}" stroke="${CONE_COLOR}" stroke-width="1" stroke-dasharray="3 3" opacity="${opacity}" data-element="tolerance-cone-lower" />`,
    `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${upperEnd.x.toFixed(1)}" y2="${upperEnd.y.toFixed(1)}" stroke="${CONE_COLOR}" stroke-width="1" stroke-dasharray="3 3" opacity="${opacity}" data-element="tolerance-cone-upper" />`,
  ].join("\n  ");
}

// Elements 1 + 2: potential trajectory line and usable trajectory line.
// The two lines share the same angle but the usable line ends at a
// shorter point (scaled by usableMovement / potentialMovement).
// A single consolidated readout appears above the plot endpoint:
//   "<angle>° · Potential <X> → Usable <Y> (-<Z>% drag)"
// replacing the two stacked length labels of the legacy chart.
function svgTrajectoryLines(
  goal: number,
  soul: number,
  angle: number,
  potentialLength: number,
  usableLength: number | null
): string {
  if (goal === 0 && soul === 0) {
    return `<circle cx="${ORIGIN_X}" cy="${ORIGIN_Y}" r="3" fill="${POTENTIAL_LINE_COLOR}" data-element="zero-origin-dot" />`;
  }
  const potentialEnd = mapToSvg(goal, soul);
  // CC-MOMENTUM-HONESTY — Potential renders as a faint/ghosted reference
  // line; Usable renders bold as the primary line. The endpoint open
  // circle moves to the Usable endpoint when a limiter reading exists.
  const elements: string[] = [
    `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${potentialEnd.x}" y2="${potentialEnd.y}" stroke="${POTENTIAL_LINE_COLOR}" stroke-width="1" stroke-dasharray="2 2" opacity="0.7" data-element="potential-trajectory" />`,
  ];
  let primaryEnd = potentialEnd;
  let hasUsableLine = false;
  if (usableLength !== null && potentialLength > 0) {
    const ratio = clamp(usableLength / potentialLength, 0, 1);
    if (ratio < 1) {
      const usableGoal = goal * ratio;
      const usableSoul = soul * ratio;
      const usableEnd = mapToSvg(usableGoal, usableSoul);
      hasUsableLine = true;
      primaryEnd = usableEnd;
      elements.push(
        `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${usableEnd.x.toFixed(1)}" y2="${usableEnd.y.toFixed(1)}" stroke="${USABLE_LINE_COLOR}" stroke-width="3" data-element="usable-trajectory" />`
      );
      elements.push(
        `<circle cx="${potentialEnd.x}" cy="${potentialEnd.y}" r="2" fill="none" stroke="${POTENTIAL_LINE_COLOR}" stroke-width="1" opacity="0.6" data-element="potential-endpoint" />`
      );
      elements.push(
        `<circle cx="${usableEnd.x.toFixed(1)}" cy="${usableEnd.y.toFixed(1)}" r="3" fill="${USABLE_LINE_COLOR}" data-element="usable-endpoint" />`
      );
    }
  }
  if (!hasUsableLine) {
    // No limiter / ratio==1 — Potential IS the primary, render its
    // endpoint marker with the usable styling so the chart is still
    // legible for legacy sessions.
    elements.push(
      `<circle cx="${potentialEnd.x}" cy="${potentialEnd.y}" r="3" fill="${USABLE_LINE_COLOR}" data-element="potential-endpoint" />`
    );
  }
  void primaryEnd;

  // Consolidated readout above the endpoint. Position is clamped to the
  // viewBox so the readout never clips. The angle replaces the legacy
  // in-chart angle label (which sometimes overlapped Drift in the SW).
  if (potentialLength > 0) {
    // CC-MOMENTUM-HONESTY — readout leads with Usable (the line the
    // user actually has), with Potential as the trailing reference.
    const dragPercent =
      usableLength !== null && potentialLength > 0
        ? Math.max(0, Math.round((1 - usableLength / potentialLength) * 100))
        : null;
    const readout =
      usableLength !== null && dragPercent !== null
        ? `${Math.round(angle)}° · Usable ${usableLength.toFixed(1)} of potential ${potentialLength.toFixed(1)} (-${dragPercent}% drag)`
        : `${Math.round(angle)}° · Potential ${potentialLength.toFixed(1)}`;
    // Approximate half-width for clamping (italic 9px font, ~5px/char).
    const halfWidth = Math.min(120, readout.length * 2.6);
    const clampedX = clamp(
      potentialEnd.x,
      4 + halfWidth,
      VIEWBOX_WIDTH - 4 - halfWidth
    );
    const clampedY = clamp(potentialEnd.y - 10, PLOT_TOP + 28, ORIGIN_Y - 4);
    elements.push(
      `<text x="${clampedX.toFixed(1)}" y="${clampedY.toFixed(1)}" font-size="9" font-style="italic" font-family="system-ui, sans-serif" fill="${INK_MUTE}" text-anchor="middle" data-element="length-readout">${escapeXml(readout)}</text>`
    );
  }
  return elements.join("\n  ");
}

// Element 4: Grip drag marker. A small filled arrowhead pointing from
// the plot point back toward the origin, with length proportional to
// the Grip drag deficit. Renders only when Grip > 0 and movement > 0.
function svgGripDragMarker(
  goal: number,
  soul: number,
  gripScore: number,
  gripDragModifier: number | null
): string {
  if (gripScore <= 0) return "";
  if (goal === 0 && soul === 0) return "";
  const dragDeficit = gripDragModifier !== null ? 1 - gripDragModifier : gripScore / 100;
  const markerLen = clamp(dragDeficit * DRAG_MARKER_MAX_LENGTH * 2.2, 4, DRAG_MARKER_MAX_LENGTH);
  const endpoint = mapToSvg(goal, soul);
  const dx = ORIGIN_X - endpoint.x;
  const dy = ORIGIN_Y - endpoint.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= 0) return "";
  const ux = dx / dist;
  const uy = dy / dist;
  const startX = endpoint.x + ux * 5;
  const startY = endpoint.y + uy * 5;
  const endX = startX + ux * markerLen;
  const endY = startY + uy * markerLen;
  const perpX = -uy;
  const perpY = ux;
  const headWidth = 3;
  const a = { x: endX + perpX * headWidth, y: endY + perpY * headWidth };
  const b = { x: endX - perpX * headWidth, y: endY - perpY * headWidth };
  const c = { x: endX + ux * 4, y: endY + uy * 4 };
  return [
    `<line x1="${startX.toFixed(1)}" y1="${startY.toFixed(1)}" x2="${endX.toFixed(1)}" y2="${endY.toFixed(1)}" stroke="${DRAG_COLOR}" stroke-width="2" data-element="grip-drag-marker" />`,
    `<polygon points="${a.x.toFixed(1)},${a.y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}" fill="${DRAG_COLOR}" data-element="grip-drag-arrowhead" />`,
  ].join("\n  ");
}

// Legend block below the plot. Explains each chart element + surfaces
// the Primal annotation when present. The Primal annotation moved out
// of the plot area to stop "Pulling: <Primal>" from colliding with the
// drag marker / length readout near the endpoint.
function svgLegend(opts: {
  hasTolerance: boolean;
  toleranceDegrees: number | null;
  hasGripDrag: boolean;
  primalPrimary: string | null;
  primalConfidence: TrajectoryChartInputs["primalConfidence"];
}): string {
  const entries: string[] = [];
  let row = 0;
  const rowY = () => LEGEND_START_Y + row * LEGEND_LINE_HEIGHT;

  // 1. Solid (primary) line: usable movement — CC-MOMENTUM-HONESTY
  //    inverted the emphasis so the bold line is what the user has.
  entries.push(
    `<line x1="${LEGEND_SWATCH_X1}" y1="${rowY()}" x2="${LEGEND_SWATCH_X2}" y2="${rowY()}" stroke="${USABLE_LINE_COLOR}" stroke-width="3" />`
  );
  entries.push(
    `<text x="${LEGEND_TEXT_X}" y="${rowY() + 3}" font-size="8" font-family="system-ui, sans-serif" fill="${INK_MUTE}" data-element="legend-usable">Solid line: usable movement (what's actually available)</text>`
  );
  row++;

  // 2. Dashed/faint line: potential trajectory — context reference.
  entries.push(
    `<line x1="${LEGEND_SWATCH_X1}" y1="${rowY()}" x2="${LEGEND_SWATCH_X2}" y2="${rowY()}" stroke="${POTENTIAL_LINE_COLOR}" stroke-width="1" stroke-dasharray="2 2" opacity="0.7" />`
  );
  entries.push(
    `<text x="${LEGEND_TEXT_X}" y="${rowY() + 3}" font-size="8" font-family="system-ui, sans-serif" fill="${INK_MUTE}" data-element="legend-potential">Faint line: potential trajectory before Grip drag + Aim governance</text>`
  );
  row++;

  // 3. Tolerance cone (only when present)
  if (opts.hasTolerance && opts.toleranceDegrees !== null) {
    entries.push(
      `<line x1="${LEGEND_SWATCH_X1}" y1="${rowY()}" x2="${LEGEND_SWATCH_X2}" y2="${rowY()}" stroke="${CONE_COLOR}" stroke-width="1" stroke-dasharray="3 3" opacity="0.7" />`
    );
    entries.push(
      `<text x="${LEGEND_TEXT_X}" y="${rowY() + 3}" font-size="8" font-family="system-ui, sans-serif" fill="${INK_MUTE}" data-element="legend-tolerance-cone">Dashed fan: tolerance cone (±${opts.toleranceDegrees}°, derived from Aim)</text>`
    );
    row++;
  }

  // 4. Red marker: Grip drag (only when grip > 0)
  if (opts.hasGripDrag) {
    const swatchY = rowY();
    entries.push(
      `<line x1="${LEGEND_SWATCH_X1}" y1="${swatchY}" x2="${LEGEND_SWATCH_X2 - 4}" y2="${swatchY}" stroke="${DRAG_COLOR}" stroke-width="2" />`
    );
    entries.push(
      `<polygon points="${LEGEND_SWATCH_X2 - 4},${swatchY - 2} ${LEGEND_SWATCH_X2 - 4},${swatchY + 2} ${LEGEND_SWATCH_X2},${swatchY}" fill="${DRAG_COLOR}" />`
    );
    entries.push(
      `<text x="${LEGEND_TEXT_X}" y="${swatchY + 3}" font-size="8" font-family="system-ui, sans-serif" fill="${INK_MUTE}" data-element="legend-grip-drag">Red marker: Grip drag — what's pulling movement back</text>`
    );
    row++;
  }

  // 5. Primal annotation (only when high or medium-high confidence).
  if (
    opts.primalPrimary &&
    (opts.primalConfidence === "high" || opts.primalConfidence === "medium-high")
  ) {
    const confidenceLabel =
      opts.primalConfidence === "high" ? "high confidence" : "medium-high confidence";
    entries.push(
      `<text x="${LEGEND_SWATCH_X1}" y="${rowY() + 3}" font-size="8" font-family="system-ui, sans-serif" font-style="italic" fill="${DRAG_COLOR}" data-element="primal-annotation">Pulling: ${escapeXml(opts.primalPrimary)} — ${confidenceLabel}</text>`
    );
    row++;
  }

  return entries.join("\n  ");
}

// Zero-movement edge case — replaces the full chart with a dot + hedge.
function svgZeroMovement(): string {
  const cx = ORIGIN_X + PLOT_SIZE / 2;
  const cy = PLOT_TOP + PLOT_SIZE / 2;
  return [
    `<circle cx="${ORIGIN_X}" cy="${ORIGIN_Y}" r="3" fill="${POTENTIAL_LINE_COLOR}" data-element="zero-origin-dot" />`,
    `<text x="${cx}" y="${cy}" font-size="9" font-family="system-ui, sans-serif" fill="#666" text-anchor="middle" data-element="zero-movement-hedge">Movement isn't registering yet.</text>`,
    `<text x="${cx}" y="${cy + 14}" font-size="8" font-family="system-ui, sans-serif" fill="#999" text-anchor="middle">The trajectory map will populate</text>`,
    `<text x="${cx}" y="${cy + 26}" font-size="8" font-family="system-ui, sans-serif" fill="#999" text-anchor="middle">as more direction surfaces.</text>`,
  ].join("\n  ");
}

// Crisis-path hedge — replaces the angle/length numeric labels with a
// soft pointer to the Path section.
function svgCrisisHedge(): string {
  return `<text x="${VIEWBOX_WIDTH / 2}" y="${ORIGIN_Y + 14}" font-size="8" font-family="system-ui, sans-serif" fill="#888" text-anchor="middle" font-style="italic" data-element="crisis-hedge">One possible map — see Path section.</text>`;
}

// ─────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────

export function generateTrajectoryChartSvg(
  inputs: TrajectoryChartInputs
): string {
  const {
    adjustedGoal: goal,
    adjustedSoul: soul,
    potentialMovement,
    usableMovement,
    toleranceDegrees,
    gripScore,
    gripDragModifier,
    primalPrimary,
    primalConfidence,
    quadrantLabel,
    gripClusterFires,
    pathClass,
    angleDegrees,
  } = inputs;
  const isCrisis = pathClass === "crisis";
  const isZeroMovement = goal === 0 && soul === 0;
  const wrapperOpacity = isCrisis ? 0.55 : 1.0;
  const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" width="100%" height="100%" role="img" aria-label="Trajectory chart" style="max-width:480px; aspect-ratio:${VIEWBOX_WIDTH}/${VIEWBOX_HEIGHT}; opacity:${wrapperOpacity};" data-path-class="${pathClass}">`;
  const svgClose = `</svg>`;

  if (isZeroMovement) {
    return [
      svgOpen,
      `  ${svgAxes()}`,
      `  ${svgQuadrantGuides()}`,
      `  ${svgAxisLabels()}`,
      `  ${svgZeroMovement()}`,
      svgClose,
    ].join("\n");
  }

  const cornerLabels = isCrisis
    ? "" // crisis suppresses quadrant labels per canon §13
    : svgCornerLabels(quadrantLabel, gripClusterFires);
  const cone =
    toleranceDegrees !== null
      ? svgToleranceCone(angleDegrees, toleranceDegrees, potentialMovement, isCrisis)
      : "";
  const lines = svgTrajectoryLines(
    goal,
    soul,
    angleDegrees,
    potentialMovement,
    usableMovement
  );
  const drag = svgGripDragMarker(goal, soul, gripScore, gripDragModifier);
  const hedge = isCrisis ? svgCrisisHedge() : "";
  const legend = svgLegend({
    hasTolerance: toleranceDegrees !== null,
    toleranceDegrees,
    hasGripDrag: gripScore > 0,
    primalPrimary,
    primalConfidence,
  });

  // aimGovernorModifier is reported through the limiter rationale text,
  // not the chart itself — it's surfaced in the consolidated readout's
  // "(-N% drag)" combined figure (drag + governor).
  void gripDragModifier;

  return [
    svgOpen,
    `  ${svgAxes()}`,
    `  ${svgQuadrantGuides()}`,
    `  ${svgAxisLabels()}`,
    cornerLabels.length > 0 ? `  ${cornerLabels}` : "",
    cone.length > 0 ? `  ${cone}` : "",
    `  ${lines}`,
    drag.length > 0 ? `  ${drag}` : "",
    hedge.length > 0 ? `  ${hedge}` : "",
    `  ${legend}`,
    svgClose,
  ]
    .filter((s) => s.length > 0)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Convenience adapter — builds TrajectoryChartInputs from a constitution
// ─────────────────────────────────────────────────────────────────────

import type { InnerConstitution } from "./types";

export function generateTrajectoryChartSvgFromConstitution(
  constitution: InnerConstitution
): string {
  const dash = constitution.goalSoulMovement?.dashboard;
  if (!dash) {
    return generateTrajectoryChartSvg({
      adjustedGoal: 0,
      adjustedSoul: 0,
      potentialMovement: 0,
      usableMovement: null,
      toleranceDegrees: null,
      gripScore: 0,
      gripDragModifier: null,
      aimGovernorModifier: null,
      primalPrimary: null,
      primalConfidence: null,
      quadrantLabel: "Drift",
      gripClusterFires: false,
      pathClass: "trajectory",
      angleDegrees: 0,
    });
  }
  const limiter = dash.movementLimiter;
  const grip = constitution.gripTaxonomy;
  // CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — the chart's Grip-drag marker
  // length now scales from the canonical §13 composed Grip
  // (constitution.gripReading.score = DefensiveGrip × StakesAmplifier),
  // not the legacy additive value. Falls back to legacy when the
  // decomposition didn't attach.
  const canonicalGripScore =
    constitution.gripReading?.score ?? dash.grippingPull.score;
  return generateTrajectoryChartSvg({
    adjustedGoal: dash.goalScore,
    adjustedSoul: dash.soulScore,
    potentialMovement: dash.movementStrength.length,
    usableMovement: limiter?.usableMovement ?? null,
    toleranceDegrees: limiter?.toleranceDegrees ?? null,
    gripScore: canonicalGripScore,
    gripDragModifier: limiter?.gripDragModifier ?? null,
    aimGovernorModifier: limiter?.aimGovernorModifier ?? null,
    // CC-GRIP-TAXONOMY-REPLACEMENT — the annotation now shows the
    // proprietary Grip Pattern elaborative label, never a Foster
    // "Am I X?" string. Falls through to the engine-internal Primal
    // register only if gripPattern wasn't attached (legacy fallback,
    // also Foster-free after the renderer's downstream substitution).
    primalPrimary:
      constitution.gripPattern?.renderedLabel ?? grip?.primary ?? null,
    primalConfidence: grip?.confidence ?? null,
    quadrantLabel: constitution.movementQuadrant?.label ?? "Drift",
    gripClusterFires:
      constitution.goalSoulGive?.evidence.grippingClusterFires ?? false,
    pathClass: constitution.coherenceReading?.pathClass ?? "trajectory",
    angleDegrees: dash.direction.angle,
  });
}
