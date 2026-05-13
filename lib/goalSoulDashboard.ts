// CC-071 — Goal/Soul Dashboard SVG render.
//
// Hand-rolled SVG (~80 lines target). No charting library — Recharts /
// Chart.js / D3 are overkill for one line + axis pair + four corner
// labels (CC-071 OOS §18). 1:1 aspect ratio. The 90° quadrant is the
// first quadrant of the (Goal, Soul) plane: x ∈ [0, 100] horizontal
// right, y ∈ [0, 100] vertical up.
//
// Visual recipe (spec §13.4a + §13.10):
//   - Square viewBox 0 0 200 200 (caller scales via CSS aspect-ratio).
//   - Inner plot area inset by `MARGIN` for axis labels.
//   - Light dashed quadrant guides at goal=50 and soul=50 (the cross-hairs
//     that produce the 2×2).
//   - Solid axis lines along x=0 and y=0 of the inner plot.
//   - Quadrant corner labels: "Giving" (NE), "Gripping" (SW). SE/NW
//     unlabeled per spec §13.4a.
//   - User's line: from origin (inner-plot 0,0) to (adjusted_goal,
//     adjusted_soul). A small filled circle marks the endpoint.
//   - Direction label (e.g., "29°") near the angle's apex at origin.
//   - Movement Strength label (e.g., "65") near the line's endpoint.
//   - Special render for length === 0: dot at origin, no line, no labels
//     overlapping the dot. The dashboard text supplies the
//     "Movement Strength: 0 — the line has not yet been drawn" line.
//
// Output is a self-contained SVG string, ready to embed inline in
// markdown (renderMirror.ts) or in JSX (the on-page report). No external
// stylesheet dependency — all styling inline.

import type { MovementDashboard } from "./types";

// ── Layout constants ────────────────────────────────────────────────────

const VIEWBOX_SIZE = 200;
const MARGIN = 24; // space for axis labels around the inner plot
const PLOT_SIZE = VIEWBOX_SIZE - MARGIN * 2;
const ORIGIN_X = MARGIN;
const ORIGIN_Y = VIEWBOX_SIZE - MARGIN; // SVG y is inverted (down = +)
const PLOT_RIGHT = MARGIN + PLOT_SIZE;
const PLOT_TOP = MARGIN;

// Map a (goal, soul) ∈ [0, 100]² point onto the inner plot's SVG coords.
function mapToSvg(goal: number, soul: number): { x: number; y: number } {
  const x = ORIGIN_X + (goal / 100) * PLOT_SIZE;
  const y = ORIGIN_Y - (soul / 100) * PLOT_SIZE; // invert y for SVG
  return { x, y };
}

// ── SVG builders ────────────────────────────────────────────────────────

function svgAxes(): string {
  return [
    // X axis (horizontal, along bottom of plot).
    `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${PLOT_RIGHT}" y2="${ORIGIN_Y}" stroke="#999" stroke-width="1" />`,
    // Y axis (vertical, along left of plot).
    `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${ORIGIN_X}" y2="${PLOT_TOP}" stroke="#999" stroke-width="1" />`,
  ].join("\n  ");
}

function svgQuadrantGuides(): string {
  // Dashed cross-hairs at goal=50 / soul=50. Cosmetic — the 2×2 is
  // visually present without these but the guides make Giving/Gripping
  // corners read at a glance.
  const mid = mapToSvg(50, 50);
  return [
    `<line x1="${mid.x}" y1="${ORIGIN_Y}" x2="${mid.x}" y2="${PLOT_TOP}" stroke="#ccc" stroke-width="0.5" stroke-dasharray="3 3" />`,
    `<line x1="${ORIGIN_X}" y1="${mid.y}" x2="${PLOT_RIGHT}" y2="${mid.y}" stroke="#ccc" stroke-width="0.5" stroke-dasharray="3 3" />`,
  ].join("\n  ");
}

function svgCornerLabels(): string {
  // Spec §13.4a / acceptance §AC-20: only Giving (NE) and Gripping (SW).
  // SE and NW corners stay unlabeled — the line's location communicates
  // the descriptor (Goal-leaning / Soul-leaning).
  const ne = mapToSvg(85, 90);
  const sw = mapToSvg(15, 10);
  return [
    `<text x="${ne.x}" y="${ne.y}" font-size="11" font-family="system-ui, sans-serif" fill="#444" text-anchor="middle">Giving</text>`,
    `<text x="${sw.x}" y="${sw.y}" font-size="11" font-family="system-ui, sans-serif" fill="#444" text-anchor="middle">Gripping</text>`,
  ].join("\n  ");
}

function svgAxisLabels(): string {
  // Engine-vocabulary on the dashboard surface (carve-out per spec §12.7):
  // Work axis horizontal, love-line vertical. The dashboard is allowed to
  // use "Goal" and "Soul" as axis labels since this is the engine surface,
  // but the spec §13.4a illustrative chart uses Work / Love-line; matching.
  return [
    `<text x="${PLOT_RIGHT}" y="${ORIGIN_Y + MARGIN * 0.6}" font-size="10" font-family="system-ui, sans-serif" fill="#666" text-anchor="end">Goal →</text>`,
    `<text x="${ORIGIN_X - MARGIN * 0.4}" y="${PLOT_TOP + 4}" font-size="10" font-family="system-ui, sans-serif" fill="#666" text-anchor="start">Soul ↑</text>`,
  ].join("\n  ");
}

// CC-PROSE-1 Layer 3a — Gripping Pull dashed-circle halo.
//
// When grippingPull > 0, render a dashed circle centered on the line's
// endpoint with radius scaled to grip magnitude. Visually encodes drag
// without requiring the reader to consult a separate text bullet. The
// circle is drawn BEFORE the line + endpoint dot so the line/dot stay
// crisp on top.
//
// Calibration (per CC-PROSE-1 spec, recalibrated CC-PROSE-1A Fix 2):
//   - Linear scale: radius = (grippingPull / 100) * MOVEMENT_GRIP_HALO_MAX.
//   - MOVEMENT_GRIP_HALO_MAX = 28 svg-units (bumped from 20).
//     CC-PROSE-1's 20-unit cap rendered the grip=21 halo as a ~4-unit
//     ring — visually negligible against the line-width of the user line.
//     28 maps grip=21 → ~6 units, grip=35 → ~10 units, grip=80 → ~22
//     units; in the 200x200 viewBox with ~152 svg-unit plot, a radius-22
//     halo is ~14% of the plot diameter — substantial without dominating.
const MOVEMENT_GRIP_HALO_MAX = 28;

function svgGripHalo(
  goal: number,
  soul: number,
  grippingPull: number
): string {
  if (grippingPull <= 0) return "";
  if (goal === 0 && soul === 0) return "";
  const endpoint = mapToSvg(goal, soul);
  const radius = (grippingPull / 100) * MOVEMENT_GRIP_HALO_MAX;
  if (radius <= 0) return "";
  return `<circle cx="${endpoint.x}" cy="${endpoint.y}" r="${radius.toFixed(1)}" fill="none" stroke="#8b6f47" stroke-width="1" stroke-dasharray="3 3" opacity="0.5" />`;
}

function svgUserLine(
  goal: number,
  soul: number,
  angle: number,
  length: number
): string {
  // Special-case zero-origin: dot at origin only.
  if (goal === 0 && soul === 0) {
    return `<circle cx="${ORIGIN_X}" cy="${ORIGIN_Y}" r="3" fill="#222" />`;
  }
  const endpoint = mapToSvg(goal, soul);
  const midpoint = mapToSvg(goal / 2, soul / 2);

  const elements: string[] = [
    // The line itself — origin to (goal, soul).
    `<line x1="${ORIGIN_X}" y1="${ORIGIN_Y}" x2="${endpoint.x}" y2="${endpoint.y}" stroke="#222" stroke-width="2" />`,
    // Endpoint marker.
    `<circle cx="${endpoint.x}" cy="${endpoint.y}" r="3" fill="#222" />`,
    // Direction label near origin (~5 svg-units along the line, offset
    // perpendicular so the text doesn't sit on the line).
    `<text x="${ORIGIN_X + 6}" y="${ORIGIN_Y - 6}" font-size="10" font-family="system-ui, sans-serif" fill="#222">${Math.round(angle)}°</text>`,
    // Movement Strength label near midpoint, offset outward.
    `<text x="${midpoint.x + 4}" y="${midpoint.y - 4}" font-size="10" font-family="system-ui, sans-serif" fill="#222">${length.toFixed(1)}</text>`,
  ];
  return elements.join("\n  ");
}

// ── Top-level render ────────────────────────────────────────────────────

export function renderGoalSoulDashboardSVG(
  dashboard: MovementDashboard
): string {
  const goal = dashboard.goalScore;
  const soul = dashboard.soulScore;
  const angle = dashboard.direction.angle;
  const length = dashboard.movementStrength.length;
  const grip = dashboard.grippingPull?.score ?? 0;

  // CC-PROSE-1 Layer 3a — emit grip halo BEFORE line + endpoint dot so the
  // dot/line render crisp on top of the dashed circle. Halo is silent
  // (empty string) when grip === 0.
  const halo = svgGripHalo(goal, soul, grip);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" width="100%" height="100%" role="img" aria-label="Goal/Soul movement chart" style="max-width:400px; aspect-ratio:1/1;">`,
    `  ${svgAxes()}`,
    `  ${svgQuadrantGuides()}`,
    `  ${svgCornerLabels()}`,
    `  ${svgAxisLabels()}`,
    halo.length > 0 ? `  ${halo}` : "",
    `  ${svgUserLine(goal, soul, angle, length)}`,
    `</svg>`,
  ].filter((s) => s.length > 0).join("\n");
}
