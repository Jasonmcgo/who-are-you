// CC-GRIP-TAXONOMY — client hook for runtime LLM Grip paragraph fetch.
//
// Mirrors `lib/synthesis3LlmClient.ts`. Sibling hook to
// `useLlmMasterSynthesis`; both fire in parallel when the constitution
// arrives.
//
// Behavior:
//   1. If the constitution carries `gripParagraphLlm`, pass through.
//   2. If gripTaxonomy is absent or confidence === "low", pass through
//      (renderer emits engine fallback prose).
//   3. Otherwise fetch from `/api/grip/paragraph` (server-only API);
//      on success, splice the paragraph into a shallow-cloned
//      constitution.
//   4. On any failure, pass through unchanged → renderer falls back.

"use client";

import { useEffect, useRef, useState } from "react";
import type { InnerConstitution } from "./types";
import { deriveGripInputs } from "./gripTaxonomyInputs";

type GripOverride = {
  forConstitution: InnerConstitution;
  paragraph: string;
};

export function useGripParagraph(
  constitution: InnerConstitution | null
): InnerConstitution | null {
  const [override, setOverride] = useState<GripOverride | null>(null);
  const latestConstitutionRef = useRef<InnerConstitution | null>(null);

  useEffect(() => {
    latestConstitutionRef.current = constitution;
    if (!constitution) return;
    if (constitution.gripParagraphLlm) return;

    const inputs = deriveGripInputs(constitution);
    if (!inputs) return; // low-confidence cluster — engine fallback

    const ctrl = new AbortController();
    fetch("/api/grip/paragraph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : { paragraph: null }))
      .then((data: { paragraph: string | null }) => {
        if (ctrl.signal.aborted) return;
        if (latestConstitutionRef.current !== constitution) return;
        if (!data.paragraph) return;
        setOverride({
          forConstitution: constitution,
          paragraph: data.paragraph,
        });
      })
      .catch(() => {
        // Silent fall-back to mechanical render.
      });
    return () => ctrl.abort();
  }, [constitution]);

  if (!constitution) return null;
  if (!override || override.forConstitution !== constitution) {
    return constitution;
  }

  return {
    ...constitution,
    gripParagraphLlm: override.paragraph,
  };
}
