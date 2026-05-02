"use client";

// CC-044 — Love Map page section. Renders 1–2 matched love registers, the
// top 1–3 flavors as an italic line, and the Resource Balance diagnostic
// (when distorted). Editorial register matches WorkMap.tsx — typography-
// driven, no chart, paper / ink / umber palette via CSS vars with hex
// fallbacks.
//
// Render rules:
//   - Skip register block entirely when matches.length === 0.
//   - Skip flavor line when flavors.length === 0.
//   - Skip Resource Balance prose when case === "healthy" (prose is "" in
//     that case anyway).
//   - The Pauline-frame paragraph and the derivation-not-prescription
//     footnote are owned by InnerConstitutionPage — they wrap this
//     component, not embed in it.

import type { LoveMapOutput } from "../../lib/types";

type LoveMapProps = {
  loveMap: LoveMapOutput;
};

export default function LoveMap({ loveMap }: LoveMapProps) {
  const { matches, flavors, resourceBalance } = loveMap;
  const hasRegisterContent = matches.length > 0;
  const hasBalanceProse = resourceBalance.prose.length > 0;
  if (!hasRegisterContent && !hasBalanceProse) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {hasRegisterContent
        ? matches.map((match) => (
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
            </div>
          ))
        : null}
      {flavors.length > 0 ? (
        <p
          className="font-serif italic"
          style={{
            fontSize: 14,
            color: "var(--ink-soft, #5a4f38)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {flavors.length === 1
            ? `Expressed primarily through ${flavors[0].flavor.flavor_label}.`
            : flavors.length === 2
            ? `Expressed primarily through ${flavors[0].flavor.flavor_label} and ${flavors[1].flavor.flavor_label}.`
            : `Expressed primarily through ${flavors[0].flavor.flavor_label} and ${flavors[1].flavor.flavor_label}, with notes of ${flavors[2].flavor.flavor_label}.`}
        </p>
      ) : null}
      {hasBalanceProse ? (
        <p
          className="font-serif"
          style={{
            fontSize: 15,
            color: "var(--ink, #2b2417)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {resourceBalance.prose}
        </p>
      ) : null}
    </div>
  );
}
