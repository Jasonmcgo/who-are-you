// CC-SYNTHESIS-3 + CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — server-only
// API endpoint for the runtime LLM Path master synthesis fallback.
//
// Why this endpoint exists:
//   - Client components can't import the Anthropic SDK (it would leak
//     the API key into the browser bundle).
//   - `app/page.tsx` and the admin session pages are client components
//     (they need React state for confirmations, accordion expansion,
//     etc.).
//   - This endpoint runs server-side, has access to `ANTHROPIC_API_KEY`
//     and the local filesystem, and returns just the paragraph string.
//
// Contract:
//   - POST /api/synthesis3/master-paragraph
//   - Body: PathMasterInputs JSON (per `lib/synthesis3Llm.ts`)
//   - Response: { paragraph: string | null }
//   - 200 on success (paragraph may be null when API key absent or API
//     fails — client falls back to mechanical paragraph)
//   - 400 on malformed body
//
// Cache flow: the underlying composer reads the static cache first; on
// cache hit, returns immediately (no API call). On miss, calls Anthropic
// + persists the new entry to disk so subsequent requests for the same
// inputs hit the cache.

import { NextResponse } from "next/server";
import type { PathMasterInputs } from "../../../../lib/synthesis3Llm";
import { lookupOrComputePathSynthesis } from "../../../../lib/synthesis3LlmServer";

// Force Node.js runtime — this endpoint reads/writes the local
// filesystem cache and uses the Anthropic SDK. Edge runtime would
// reject `node:fs` imports.
export const runtime = "nodejs";

function isPathMasterInputs(value: unknown): value is PathMasterInputs {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.lensDominant === "string" &&
    typeof v.lensAux === "string" &&
    Array.isArray(v.topCompass) &&
    Array.isArray(v.topGravity) &&
    typeof v.movement === "object" &&
    v.movement !== null &&
    typeof v.loveMap === "string" &&
    typeof v.givingDescriptor === "string" &&
    Array.isArray(v.engineCanonicalPhrases)
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 }
    );
  }

  if (!isPathMasterInputs(body)) {
    return NextResponse.json(
      { error: "body does not match PathMasterInputs shape" },
      { status: 400 }
    );
  }

  const paragraph = await lookupOrComputePathSynthesis(body);
  return NextResponse.json({ paragraph });
}
