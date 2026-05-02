"use client";

import type { LensStack } from "../../lib/types";

type Props = { stack: LensStack };

export default function MbtiDisclosure({ stack }: Props) {
  // Gating: only mount when the stack is high-confidence AND a code is present.
  if (stack.confidence !== "high" || !stack.mbtiCode) return null;

  return (
    <p
      className="font-serif italic"
      style={{
        color: "var(--ink-soft)",
        fontSize: 14,
        lineHeight: 1.55,
        margin: 0,
        paddingLeft: 12,
        borderLeft: "2px solid var(--rule-soft)",
      }}
    >
      Possible surface label: {stack.mbtiCode}. Type labels are surface
      descriptions only — your shape is not reducible to a four-letter
      code. The Lens reading above is the actual interpretation.
    </p>
  );
}
