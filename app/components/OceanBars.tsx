"use client";

// CC-037 — Horizontal bar chart for the OCEAN distribution on the Disposition
// Map page section. Editorial chart, paper background, ink stroke, umber-soft
// fill on the largest bar. The Neuroticism bar carries an explicit "estimated"
// subscript so the user reads the distribution as Big-5-derived without
// over-trusting the N axis (the instrument measures Neuroticism through proxy
// signals — formation history, current-context load, pressure-adaptation
// behavior — rather than directly).
//
// Visual register matches PieChart.tsx (the Drive distribution chart):
// SVG-based render, paper / ink / umber palette via CSS vars with hex
// fallbacks, mobile clamp via `min(${size}px, 80vw)` on the figure container.

import type { OceanBucket, OceanDistribution } from "../../lib/types";
import {
  OCEAN_BUCKET_LABEL_SHORT,
  OCEAN_BUCKET_ORDER,
} from "../../lib/ocean";

type OceanBarsProps = {
  distribution: OceanDistribution;
  width?: number;
};

export default function OceanBars({
  distribution,
  width = 480,
}: OceanBarsProps) {
  // Layout: each row carries a label (left), a bar body (center), and a
  // percentage label (right). The N row adds a small "estimated" subscript
  // below its bar.
  const rowHeight = 28;
  const rowGap = 18;
  const labelWidth = 150;
  const pctWidth = 48;
  const barX = labelWidth + 8;
  const barWidth = width - barX - pctWidth - 8;
  const totalRows = OCEAN_BUCKET_ORDER.length;
  // Add extra height below the N row for the "estimated" subscript.
  const subscriptExtra = 14;
  const totalHeight = totalRows * rowHeight + (totalRows - 1) * rowGap + subscriptExtra;

  // Largest bucket — gets the umber-soft accent.
  let largest: OceanBucket = OCEAN_BUCKET_ORDER[0];
  for (const b of OCEAN_BUCKET_ORDER) {
    if (distribution[b] > distribution[largest]) largest = b;
  }

  return (
    <figure
      style={{
        margin: 0,
        width: `min(${width}px, 80vw)`,
        height: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${totalHeight}`}
        width="100%"
        height="auto"
        role="img"
        aria-label="Disposition distribution: Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Reactivity"
      >
        {OCEAN_BUCKET_ORDER.map((bucket, i) => {
          const pct = distribution[bucket];
          const yTop = i * (rowHeight + rowGap);
          const yMid = yTop + rowHeight / 2;
          const fillWidth = (pct / 100) * barWidth;
          const isLargest = bucket === largest;
          const label = OCEAN_BUCKET_LABEL_SHORT[bucket];
          return (
            <g key={`bar-${bucket}`}>
              {/* Bucket label (left) */}
              <text
                x={labelWidth}
                y={yMid}
                textAnchor="end"
                dominantBaseline="middle"
                className="font-mono uppercase"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  fill: "var(--ink-mute, #6a5d40)",
                }}
              >
                {label}
              </text>

              {/* Bar background (paper, ink stroke) */}
              <rect
                x={barX}
                y={yTop}
                width={barWidth}
                height={rowHeight}
                fill="var(--paper, #f7f1e6)"
                stroke="var(--ink, #2b2417)"
                strokeWidth={1.25}
                strokeLinejoin="round"
              />

              {/* Bar fill (umber-soft on largest, ink-soft on others) */}
              {pct > 0 ? (
                <rect
                  x={barX}
                  y={yTop}
                  width={fillWidth}
                  height={rowHeight}
                  fill={
                    isLargest
                      ? "var(--umber-soft, #d8c8a8)"
                      : "var(--rule-soft, #e8dec8)"
                  }
                  stroke="var(--ink, #2b2417)"
                  strokeWidth={1.25}
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Percentage label (right) */}
              <text
                x={barX + barWidth + 8}
                y={yMid}
                textAnchor="start"
                dominantBaseline="middle"
                className="font-mono"
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 12,
                  fill: "var(--ink, #2b2417)",
                }}
              >
                {pct}%
              </text>

              {/* "estimated" subscript on the N row (load-bearing UX
                  element per CC-037; the instrument doesn't measure
                  Neuroticism directly, so the user gets visible signal
                  about the proxy nature). */}
              {bucket === "N" ? (
                <text
                  x={barX}
                  y={yTop + rowHeight + 11}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className="font-mono"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    fill: "var(--ink-mute, #6a5d40)",
                    fontStyle: "italic",
                  }}
                >
                  estimated — derived from proxy signals, not asked directly
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
