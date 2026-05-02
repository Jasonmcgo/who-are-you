"use client";

// CC-026 — three-slice pie chart for the Drive distribution on Path · Gait.
// Editorial chart, not dashboard: paper background, ink slice strokes, umber
// accent on the largest slice. When `rank` is provided (the user's claimed
// drive from Q-3C1), each slice gets a quiet 1 / 2 / 3 badge so the reader
// can see claimed-vs-revealed at a glance.
//
// Vocabulary: framework terms (cost / coverage / compliance) never surface.
// Slice labels render the canonical human-language phrases.
//
// CC-033 amendment — the cost-bucket label was renamed from "Financial
// security" to "Building & wealth" (the prior phrase conflated cost-as-
// ambition with compliance-as-security; security already lives in its own
// bucket). Slice labels also moved from a single line ("Label X%") to two
// `<tspan>` lines (label / percentage), and the SVG viewBox grew on all
// four sides so labels at slice edges no longer clip when they spill
// outside the pie's bounding circle. The TypeScript codename `cost` is
// canon-locked and unchanged.
//
// CC-040 amendment — the coverage-bucket label was renamed from "People
// you love" to "People, Service & Society" (the prior label only covered
// the intimate-circle dimension while the bucket actually measures the
// full other-directed register: intimate-care + active service + civic
// belonging). Mirrors the CC-033 architectural pattern: relabel without
// re-tagging when the human label undersells what the bucket measures.
// The TypeScript codename `coverage` is canon-locked and unchanged.

import type { DriveRanking, DriveBucket } from "../../lib/types";

type PieChartProps = {
  cost: number;       // 0..100
  coverage: number;   // 0..100
  compliance: number; // 0..100
  rank?: DriveRanking;
  size?: number;
};

const HUMAN_LABEL: Record<DriveBucket, string> = {
  cost: "Building & wealth",
  coverage: "People, Service & Society",
  compliance: "Risk and uncertainty",
};

// Polar → Cartesian. Angle in degrees, 0° at 12 o'clock, increasing clockwise.
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

type Slice = {
  bucket: DriveBucket;
  pct: number;
  startAngle: number;
  endAngle: number;
};

function buildSlices(cost: number, coverage: number, compliance: number): Slice[] {
  const order: DriveBucket[] = ["cost", "coverage", "compliance"];
  const pct: Record<DriveBucket, number> = { cost, coverage, compliance };
  let cursor = 0;
  return order.map((bucket) => {
    const sweep = (pct[bucket] / 100) * 360;
    const slice: Slice = {
      bucket,
      pct: pct[bucket],
      startAngle: cursor,
      endAngle: cursor + sweep,
    };
    cursor += sweep;
    return slice;
  });
}

function sliceMidpoint(cx: number, cy: number, r: number, slice: Slice) {
  const mid = (slice.startAngle + slice.endAngle) / 2;
  return polar(cx, cy, r, mid);
}

function rankFor(slice: Slice, rank?: DriveRanking): 1 | 2 | 3 | null {
  if (!rank) return null;
  if (rank.first === slice.bucket) return 1;
  if (rank.second === slice.bucket) return 2;
  if (rank.third === slice.bucket) return 3;
  return null;
}

export default function PieChart({
  cost,
  coverage,
  compliance,
  rank,
  size = 240,
}: PieChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.85;
  const labelR = (size / 2) * 0.55;
  const badgeR = (size / 2) * 1.05;
  const slices = buildSlices(cost, coverage, compliance);

  const largest = slices.reduce<Slice>(
    (best, s) => (s.pct > best.pct ? s : best),
    slices[0]
  );

  return (
    <figure
      style={{
        margin: 0,
        width: `min(${size}px, 80vw)`,
        height: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <svg
        viewBox={`${-size * 0.15} ${-size * 0.08} ${size * 1.3} ${size * 1.16}`}
        width="100%"
        height="auto"
        role="img"
        aria-label="Drive distribution: building & wealth, people service and society, risk and uncertainty"
      >
        {slices.map((slice) => {
          if (slice.pct <= 0) return null;
          const isLargest = slice.bucket === largest.bucket;
          // Single-slice edge case: render as a full circle to avoid a
          // degenerate arc path when one bucket holds 100%.
          const isFull = slice.pct >= 100;
          const path = isFull
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
            : arcPath(cx, cy, r, slice.startAngle, slice.endAngle);
          return (
            <path
              key={slice.bucket}
              d={path}
              fill={isLargest ? "var(--umber-soft, #d8c8a8)" : "var(--paper, #f7f1e6)"}
              stroke="var(--ink, #2b2417)"
              strokeWidth={1.25}
              strokeLinejoin="round"
            />
          );
        })}
        {slices.map((slice) => {
          if (slice.pct < 8) return null;
          const mid = sliceMidpoint(cx, cy, labelR, slice);
          const label = HUMAN_LABEL[slice.bucket];
          // CC-033 — split label and percentage onto two tspan lines so long
          // phrases ("Risk and uncertainty 35%") no longer overflow the
          // slice midpoint horizontally. Combined with the padded viewBox,
          // this keeps long labels visible without moving them outward to
          // leader-line placement.
          return (
            <text
              key={`label-${slice.bucket}`}
              x={mid.x}
              y={mid.y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: Math.max(10, size * 0.05),
                fill: "var(--ink, #2b2417)",
              }}
            >
              <tspan x={mid.x} dy="-0.5em">{label}</tspan>
              <tspan x={mid.x} dy="1.1em">{slice.pct}%</tspan>
            </text>
          );
        })}
        {rank
          ? slices.map((slice) => {
              if (slice.pct <= 0) return null;
              const r1 = rankFor(slice, rank);
              if (r1 === null) return null;
              const mid = sliceMidpoint(cx, cy, badgeR, slice);
              return (
                <g key={`badge-${slice.bucket}`}>
                  <circle
                    cx={mid.x}
                    cy={mid.y}
                    r={Math.max(10, size * 0.045)}
                    fill="var(--paper, #f7f1e6)"
                    stroke="var(--umber, #8a6f3a)"
                    strokeWidth={1.25}
                  />
                  <text
                    x={mid.x}
                    y={mid.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: Math.max(10, size * 0.045),
                      fill: "var(--ink, #2b2417)",
                    }}
                  >
                    {r1}
                  </text>
                </g>
              );
            })
          : null}
      </svg>
      {rank ? (
        <figcaption
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute, #6a5d40)",
            margin: 0,
          }}
        >
          1 · 2 · 3 mark your claimed ranking
        </figcaption>
      ) : null}
    </figure>
  );
}
