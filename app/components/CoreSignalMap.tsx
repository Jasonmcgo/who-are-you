"use client";

// CC-PROSE-1B Layer 4 — React render of the Core Signal Map.
//
// CSS grid: 4 columns × 3 rows on desktop, collapses to 2 columns × 6
// rows below 600px. Each cell renders the canonical label in font-mono
// uppercase small-caps (mirrors CC-PROSE-1A's CardQuestion treatment so
// the at-a-glance grid reads as label-tier typography) and the value
// below in serif at ~14px. Empty values render as an em-dash so the cell
// stays visually balanced.

import {
  buildCoreSignalCells,
  CORE_SIGNAL_MAP_FOOTER,
} from "../../lib/coreSignalMap";
import type { InnerConstitution } from "../../lib/types";

type Props = {
  constitution: InnerConstitution;
  // CC-REACT-USER-MODE-PARITY — mirror the markdown `renderCore
  // SignalMapMarkdown` user/clinician split so the "Surface label"
  // cell doesn't leak the MBTI four-letter code on the user surface.
  // User mode replaces the cell value with "provisional" (same as
  // markdown user-mode behavior); clinician keeps the full "<MBTI>,
  // provisional" form for audit.
  renderMode?: "user" | "clinician";
};

export default function CoreSignalMap({ constitution, renderMode }: Props) {
  const mode = renderMode ?? "user";
  const cells = buildCoreSignalCells(constitution);
  if (mode === "user") {
    for (const cell of cells) {
      if (cell.label === "Surface label" && cell.value.length > 0) {
        cell.value = "provisional";
      }
    }
  }

  return (
    <div
      role="group"
      aria-label="Core Signal Map"
      className="flex flex-col"
      style={{ gap: 14 }}
    >
      <div
        className="core-signal-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {cells.map((cell, i) => (
          <div
            key={`csm-${i}`}
            className="flex flex-col"
            style={{
              gap: 6,
              padding: "10px 12px",
              border: "1px solid var(--umber-soft)",
              background: "var(--umber-wash)",
              borderRadius: 2,
              minHeight: 56,
            }}
          >
            <p
              className="font-mono uppercase"
              style={{
                fontSize: 9.5,
                letterSpacing: "0.1em",
                color: "var(--ink-mute)",
                margin: 0,
              }}
            >
              {cell.label}
            </p>
            <p
              className="font-serif"
              style={{
                fontSize: 14,
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {cell.value || "—"}
            </p>
          </div>
        ))}
      </div>
      <p
        className="font-serif italic text-[14px] md:text-[14.5px]"
        style={{
          color: "var(--ink-soft)",
          textAlign: "center",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {CORE_SIGNAL_MAP_FOOTER}
      </p>
      {/* Mobile collapse: 4 columns is too cramped below ~600px; drop to
          2 columns × 6 rows. globals.css owns the breakpoint via the
          .core-signal-grid class so the rule is co-located with other
          layout breakpoints. */}
      <style>{`
        @media (max-width: 600px) {
          .core-signal-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
