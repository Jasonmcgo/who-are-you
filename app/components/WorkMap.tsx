"use client";

// CC-042 — Work Map page section. Renders 1–2 matching work registers with
// register label, short description, and italic anchors line. Editorial
// register matches OceanBars.tsx — paper background, ink rule, mono labels,
// serif body. Falls back to silent omission via the parent guard when
// `workMap` is undefined or `matches.length === 0`.
//
// Visual register: no chart. The register-name + description + anchors
// list-line is the read; the section gets its texture from typography
// rather than from a graphical primitive. This keeps the Work Map distinct
// from PieChart (Drive) and OceanBars (OCEAN) at the page level.

import type { WorkMapOutput } from "../../lib/types";

type WorkMapProps = {
  workMap: WorkMapOutput;
};

export default function WorkMap({ workMap }: WorkMapProps) {
  const { matches } = workMap;
  if (matches.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {matches.map((match) => (
        <div
          key={match.register.register_key}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingLeft: 12,
            borderLeft: "2px solid var(--rule, #d4c8a8)",
          }}
        >
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.10em",
              color: "var(--ink, #2b2417)",
              margin: 0,
            }}
          >
            {match.register.register_label}
          </p>
          <p
            className="font-serif"
            style={{
              fontSize: 15,
              color: "var(--ink, #2b2417)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {match.register.short_description}
          </p>
          <p
            className="font-serif italic"
            style={{
              fontSize: 13.5,
              color: "var(--ink-soft, #5a4f38)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Examples: {match.register.example_anchors.join("; ")}.
          </p>
        </div>
      ))}
    </div>
  );
}
