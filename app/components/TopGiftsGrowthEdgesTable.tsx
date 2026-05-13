"use client";

// CC-PROSE-1B Layer 6 — unified Top Gifts and Growth Edges table.
//
// Replaces the prior two separate "Top 3 Gifts" + "Top 3 Growth Edges"
// list sections with a single 3-row × 3-column table. Each row pairs
// `gifts[i]` with `traps[i]` per the canonical generateSimpleSummary
// parallel-line close pattern.
//
// Pairing rule (canon): cross_card.topGifts[i] ↔ cross_card.topRisks[i].
// "What it means" column: first descriptive sentence of the gift's
// existing prose (no new vocabulary; truncate at sentence boundary
// instead of rewording).
//
// Mobile (<600px): collapses to stacked cards (each row becomes a
// labeled card showing Gift / What it means / Growth edge as three
// fields). 600px breakpoint matches CoreSignalMap's mobile rule.

import type { MirrorTopGift, MirrorTopTrap } from "../../lib/types";
import { firstSentence } from "../../lib/topGiftsEdgesTable";

type Props = {
  gifts: MirrorTopGift[];
  traps: MirrorTopTrap[];
};

export default function TopGiftsGrowthEdgesTable({ gifts, traps }: Props) {
  const rowCount = Math.min(gifts.length, traps.length, 3);
  if (rowCount === 0) return null;

  const rows = Array.from({ length: rowCount }, (_, i) => ({
    gift: gifts[i],
    trap: traps[i],
  }));

  return (
    <div role="region" aria-label="Top gifts and growth edges">
      <table
        className="prose-1b-gifts-edges-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            <th style={headStyle("22%")}>Gift</th>
            <th style={headStyle("56%")}>What it means</th>
            <th style={headStyle("22%")}>Growth edge</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`tge-${i}`} style={{ verticalAlign: "top" }}>
              <td style={cellStyle({ bold: true })}>{row.gift.label}</td>
              <td style={cellStyle({})}>{firstSentence(row.gift.paragraph)}</td>
              <td style={cellStyle({ bold: true })}>{row.trap.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mobile: stack as cards. Hides the desktop table; renders a
          parallel stacked-card list. The two trees stay structurally
          identical — same data, different layout. */}
      <div className="prose-1b-gifts-edges-stack" style={{ display: "none" }}>
        {rows.map((row, i) => (
          <div
            key={`tge-card-${i}`}
            className="flex flex-col"
            style={{
              gap: 6,
              padding: "12px 14px",
              border: "1px solid var(--rule-soft)",
              borderRadius: 4,
              marginBottom: 12,
            }}
          >
            <StackedField label="Gift" value={row.gift.label} bold />
            <StackedField
              label="What it means"
              value={firstSentence(row.gift.paragraph)}
            />
            <StackedField label="Growth edge" value={row.trap.label} bold />
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 600px) {
          .prose-1b-gifts-edges-table { display: none !important; }
          .prose-1b-gifts-edges-stack { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function headStyle(width: string): React.CSSProperties {
  return {
    width,
    textAlign: "left",
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "var(--ink-mute)",
    padding: "8px 10px 6px",
    borderBottom: "1px solid var(--rule-soft)",
    fontWeight: 500,
  };
}

function cellStyle({ bold }: { bold?: boolean }): React.CSSProperties {
  return {
    fontFamily: "var(--font-serif)",
    fontSize: 14.5,
    color: "var(--ink)",
    lineHeight: 1.55,
    padding: "10px 10px",
    borderBottom: "1px solid var(--rule-soft)",
    fontWeight: bold ? 600 : 400,
  };
}

function StackedField({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 2 }}>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.1em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        className="font-serif"
        style={{
          fontSize: 14.5,
          color: "var(--ink)",
          lineHeight: 1.55,
          margin: 0,
          fontWeight: bold ? 600 : 400,
        }}
      >
        {value}
      </p>
    </div>
  );
}
