"use client";

import type { LensStack } from "../../lib/types";

type Props = {
  stack: LensStack;
  // CC-REACT-USER-MODE-PARITY — render-mode gate matching the markdown
  // export's user/clinician split. User-facing surfaces suppress the
  // borrowed-system MBTI disclosure line; clinician/admin keeps it.
  renderMode?: "user" | "clinician";
};

export default function MbtiDisclosure({ stack, renderMode }: Props) {
  // CC-REACT-USER-MODE-PARITY — default to "user" so any surface that
  // hasn't been explicitly opted into clinician mode hides the MBTI
  // disclosure line. Admin/clinician must pass renderMode="clinician".
  const mode = renderMode ?? "user";
  if (mode === "user") return null;
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
