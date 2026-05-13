// CC-PROSE-1 Layer 3b — Drive distribution donut chart.
//
// Promotes the Drive distribution from the existing text-only line
// ("Distribution: Building & wealth 33%, People, Service & Society 35%,
// Risk and uncertainty 32%") to a hand-rolled SVG donut chart with
// three labeled segments and a centered "Claimed #1: [bucket]"
// annotation. The existing prose narrative around the donut stays —
// the donut renders alongside it, not replacing it.
//
// No charting library — Recharts / Chart.js / D3 are not added (same
// canon as goalSoulDashboard.ts hand-rolled SVG). Three brown variants
// stay inside the existing cream + brown palette.
//
// Color binding (CC-PROSE-1 spec):
//   - Building & Wealth (cost):       #8b6f47 (existing dashboard accent brown)
//   - People, Service & Society (coverage): #a99372 (warm tan, lighter)
//   - Risk & Uncertainty (compliance): #7a6850 (muted dust, darker)

import type { DriveBucket } from "./types";

// ── Layout constants ────────────────────────────────────────────────────

const VIEWBOX_W = 280;
const VIEWBOX_H = 280;
const CENTER_X = 140;
const CENTER_Y = 140;
const OUTER_R = 90;
const INNER_R = 55;
// Outside-the-donut label radius — slightly outside OUTER_R so segment
// labels don't crowd the arcs.
const LABEL_R = 110;

const BUCKET_COLOR: Record<DriveBucket, string> = {
  cost: "#8b6f47",
  coverage: "#a99372",
  compliance: "#7a6850",
};

const BUCKET_LABEL: Record<DriveBucket, string> = {
  cost: "Building & Wealth",
  coverage: "People, Service & Society",
  compliance: "Risk & Uncertainty",
};

// ── SVG arc geometry ────────────────────────────────────────────────────
//
// SVG arcs use `A rx ry x-axis-rotation large-arc-flag sweep-flag x y`.
// We construct each donut segment as a closed path: outer arc → line in
// to inner radius → inner arc back → close. Angles are measured in
// radians; 0 rad sits at 3 o'clock and increments clockwise (we adjust
// to start at 12 o'clock for visual familiarity by subtracting π/2).

function polar(angleRad: number, radius: number): { x: number; y: number } {
  return {
    x: CENTER_X + radius * Math.cos(angleRad),
    y: CENTER_Y + radius * Math.sin(angleRad),
  };
}

function donutSegmentPath(
  startAngleRad: number,
  endAngleRad: number
): string {
  const largeArc = endAngleRad - startAngleRad > Math.PI ? 1 : 0;
  const outerStart = polar(startAngleRad, OUTER_R);
  const outerEnd = polar(endAngleRad, OUTER_R);
  const innerEnd = polar(endAngleRad, INNER_R);
  const innerStart = polar(startAngleRad, INNER_R);
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// ── Top-level render ────────────────────────────────────────────────────

export function renderDriveDistributionDonut(
  distribution: { cost: number; coverage: number; compliance: number },
  claimedTopBucket: DriveBucket | undefined
): string {
  const total =
    distribution.cost + distribution.coverage + distribution.compliance;
  // Defensive: empty/zero distribution → render a faint placeholder ring
  // so the slot is preserved without a misleading "100% something" arc.
  if (total <= 0) {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" width="100%" height="100%" role="img" aria-label="Drive distribution donut chart (no signal)" style="max-width:320px; aspect-ratio:1/1;">`,
      `  <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${OUTER_R}" fill="none" stroke="#cccccc" stroke-width="1" stroke-dasharray="3 3" />`,
      `  <text x="${CENTER_X}" y="${CENTER_Y}" font-size="11" font-family="system-ui, sans-serif" fill="#666" text-anchor="middle">no Drive signal</text>`,
      `</svg>`,
    ].join("\n");
  }

  // Three segments in canonical order: cost → coverage → compliance.
  // Start at 12 o'clock (-π/2) and sweep clockwise.
  const buckets: DriveBucket[] = ["cost", "coverage", "compliance"];
  const fractions: Record<DriveBucket, number> = {
    cost: distribution.cost / total,
    coverage: distribution.coverage / total,
    compliance: distribution.compliance / total,
  };

  const startBase = -Math.PI / 2;
  const segments: string[] = [];
  const labels: string[] = [];
  let cursor = startBase;
  for (const bucket of buckets) {
    const sweep = fractions[bucket] * 2 * Math.PI;
    if (sweep <= 0) {
      continue;
    }
    const segStart = cursor;
    const segEnd = cursor + sweep;
    const path = donutSegmentPath(segStart, segEnd);
    segments.push(
      `<path d="${path}" fill="${BUCKET_COLOR[bucket]}" stroke="#fff" stroke-width="1" />`
    );
    // Label at midpoint of arc, outside the donut.
    const midAngle = segStart + sweep / 2;
    const labelPt = polar(midAngle, LABEL_R);
    const pct =
      bucket === "cost"
        ? distribution.cost
        : bucket === "coverage"
        ? distribution.coverage
        : distribution.compliance;
    // Anchor the label based on which side of the donut it lands on.
    const anchor =
      labelPt.x < CENTER_X - 5
        ? "end"
        : labelPt.x > CENTER_X + 5
        ? "start"
        : "middle";
    labels.push(
      `<text x="${labelPt.x.toFixed(2)}" y="${labelPt.y.toFixed(2)}" font-size="10" font-family="system-ui, sans-serif" fill="#444" text-anchor="${anchor}">${BUCKET_LABEL[bucket]} ${pct}%</text>`
    );
    cursor = segEnd;
  }

  // Center label: "Claimed #1: [bucket]" — two lines, small font.
  const centerLines: string[] = [];
  if (claimedTopBucket) {
    centerLines.push(
      `<text x="${CENTER_X}" y="${CENTER_Y - 4}" font-size="10" font-family="system-ui, sans-serif" fill="#666" text-anchor="middle">Claimed #1</text>`
    );
    centerLines.push(
      `<text x="${CENTER_X}" y="${CENTER_Y + 12}" font-size="11" font-family="system-ui, sans-serif" fill="#222" text-anchor="middle" font-weight="600">${BUCKET_LABEL[claimedTopBucket]}</text>`
    );
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" width="100%" height="100%" role="img" aria-label="Drive distribution donut chart" style="max-width:320px; aspect-ratio:1/1;">`,
    ...segments.map((s) => `  ${s}`),
    ...labels.map((l) => `  ${l}`),
    ...centerLines.map((l) => `  ${l}`),
    `</svg>`,
  ].join("\n");
}
