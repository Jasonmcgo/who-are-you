// CC-SYNTHESIS-3 + CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — client hook
// for the runtime LLM Path master synthesis fallback.
//
// Why this hook exists:
//   - The static cache (built by `scripts/buildSynthesis3.ts`) only
//     covers the 24 fixture inputs. Live sessions compute slightly
//     different input shapes (Risk Form, topGravity, Soul values
//     differing by 1, etc.), so their inputs hash misses the cache.
//   - The renderer would then fall back to the mechanical paragraph,
//     which loses the warmth lift the live user actually needs.
//
// What this hook does:
//   1. Reads the constitution. If the static cache already produced a
//      paragraph (`shape_outputs.path.masterSynthesisLlm` is set), no
//      fetch is needed — pass through unchanged.
//   2. On cache miss, POSTs the PathMasterInputs to
//      `/api/synthesis3/master-paragraph` (server-only endpoint with
//      access to `ANTHROPIC_API_KEY`).
//   3. On success, returns a shallow-cloned constitution with the
//      paragraph spliced into `shape_outputs.path.masterSynthesisLlm`.
//   4. On any failure (network error, missing API key on server,
//      timeout), returns the constitution unchanged — renderer falls
//      back to the mechanical paragraph.
//
// UX consequence: first render of a new shape shows the mechanical
// paragraph for 2-5 seconds while the API call resolves, then the
// component re-renders with the LLM paragraph swapped in. Subsequent
// visits to the same shape (same inputs hash) hit the cache and
// render the LLM paragraph immediately.

"use client";

import { useEffect, useRef, useState } from "react";
import type { InnerConstitution } from "./types";
import { deriveSynthesis3Inputs } from "./synthesis3Inputs";

type LlmOverride = {
  // The constitution reference this override was computed for. Used to
  // discard stale overrides when the constitution changes mid-fetch.
  forConstitution: InnerConstitution;
  paragraph: string;
};

export function useLlmMasterSynthesis(
  constitution: InnerConstitution | null
): InnerConstitution | null {
  // Override state only updates from inside the fetch's resolution
  // callback (the "external source" the effect is syncing). No synchronous
  // setState at the top of the effect — that would cascade renders per
  // react-hooks/set-state-in-effect.
  const [override, setOverride] = useState<LlmOverride | null>(null);
  // Tracks the latest constitution the effect saw, so async fetch
  // callbacks can self-discard if the constitution moved on.
  const latestConstitutionRef = useRef<InnerConstitution | null>(null);

  useEffect(() => {
    latestConstitutionRef.current = constitution;
    if (!constitution) return;
    // Static cache already produced a paragraph — nothing to fetch.
    if (constitution.shape_outputs.path.masterSynthesisLlm) return;

    const inputs = deriveSynthesis3Inputs(constitution);
    const ctrl = new AbortController();
    fetch("/api/synthesis3/master-paragraph", {
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
        // Network/abort error — silently fall back to mechanical render.
      });
    return () => ctrl.abort();
  }, [constitution]);

  if (!constitution) return null;
  // Discard stale overrides — the constitution changed since the
  // override was computed. Renderer falls back until a new fetch lands.
  if (!override || override.forConstitution !== constitution) {
    return constitution;
  }

  return {
    ...constitution,
    shape_outputs: {
      ...constitution.shape_outputs,
      path: {
        ...constitution.shape_outputs.path,
        masterSynthesisLlm: override.paragraph,
      },
    },
  };
}
