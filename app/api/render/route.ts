// CC-PRODUCTION-RENDER-PATH-WIRING — server-side endpoint that produces
// the user-mode markdown report through `renderMirrorAsMarkdownLive`.
// Live client handlers (Copy / Download markdown in
// `InnerConstitutionPage`) POST raw answers + demographics here; the
// route rebuilds the constitution server-side and invokes the async
// live wrapper. The live wrapper consults the committed cache, then
// the process-scoped runtime cache, then triggers on-demand LLM
// resolution under a per-request `SessionLlmBudget`. The render is
// returned as `{ markdown }`.
//
// Admin paths, scripts, audits, and any code that wants the legacy
// synchronous fallback continue to import `renderMirrorAsMarkdown`
// from `lib/renderMirror` directly — they never reach this endpoint.

import { NextResponse } from "next/server";

import { buildInnerConstitution } from "../../../lib/identityEngine";
import { renderMirrorAsMarkdownLive } from "../../../lib/renderMirrorLive";
import { loadSessionLlmBundle } from "../../../lib/sessionLlmBundleStore";
import type {
  Answer,
  DemographicSet,
  MetaSignal,
} from "../../../lib/types";

export const runtime = "nodejs";

interface RenderRequestBody {
  answers?: Answer[];
  demographics?: DemographicSet | null;
  metaSignals?: MetaSignal[];
  includeBeliefAnchor?: boolean;
  // CC-LLM-REWRITES-PERSISTED-ON-SESSION — when present, the route
  // loads the per-session rewrite bundle from `sessions.llm_rewrites`
  // and threads it into the live renderer. Live renders served from
  // a saved session use this to bypass any runtime LLM call.
  sessionId?: string;
}

function isRenderRequestBody(v: unknown): v is RenderRequestBody {
  if (!v || typeof v !== "object") return false;
  const b = v as Record<string, unknown>;
  // Minimal validation: `answers` must be present and array-shaped.
  return Array.isArray(b.answers);
}

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 }
    );
  }
  if (!isRenderRequestBody(payload)) {
    return NextResponse.json(
      { error: "missing or malformed `answers` array" },
      { status: 400 }
    );
  }
  const answers = payload.answers ?? [];
  const demographics = payload.demographics ?? null;
  const metaSignals = payload.metaSignals ?? [];
  const includeBeliefAnchor = payload.includeBeliefAnchor ?? false;

  const sessionId = payload.sessionId ?? null;

  try {
    const constitution = buildInnerConstitution(
      answers,
      metaSignals,
      demographics
    );
    // CC-LLM-REWRITES-PERSISTED-ON-SESSION — load the per-session
    // bundle when sessionId is present. Null on un-backfilled rows.
    const sessionLlmBundle = sessionId
      ? await loadSessionLlmBundle(sessionId)
      : null;
    // CC-LIVE-SESSION-LLM-WIRING semantics: the async wrapper pre-
    // resolves the four scoped body cards + Keystone before invoking
    // the synchronous user-mode renderer. Hits / runtime-cached
    // resolutions / Tier C fallback are all handled transparently.
    const markdown = await renderMirrorAsMarkdownLive(
      {
        constitution,
        answers,
        demographics,
        includeBeliefAnchor,
      },
      { sessionLlmBundle }
    );
    return NextResponse.json({ markdown });
  } catch (e) {
    console.error(`[api/render] failure: ${(e as Error).message}`);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
