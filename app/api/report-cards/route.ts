// CC-REACT-ON-SCREEN-LLM-RENDER — server endpoint that returns the
// LLM-resolved per-section markdown for the four scoped body cards +
// Keystone as structured JSON. The on-screen React render
// (`InnerConstitutionPage`) fetches this on mount and threads each
// section's markdown down to its card component. Engine prose remains
// the default render; LLM prose substitutes in when a section's
// rewrite returns from the resolver.
//
// Same architecture as `/api/render`:
//   - server-only (Node runtime; requires ANTHROPIC_API_KEY for LLM)
//   - per-request SessionLlmBudget (default cap = 8)
//   - committed cache → runtime cache → on-demand LLM → Tier C nulls
//   - never throws; returns valid JSON in all failure modes
//
// Differs only in output shape — no markdown splicing.

import { NextResponse } from "next/server";

import { buildInnerConstitution } from "../../../lib/identityEngine";
import {
  resolveScopedRewritesLive,
  type ScopedRewritesResult,
} from "../../../lib/resolveScopedRewritesLive";
import { loadSessionLlmBundle } from "../../../lib/sessionLlmBundleStore";
import type {
  Answer,
  DemographicSet,
  MetaSignal,
} from "../../../lib/types";

export const runtime = "nodejs";

interface ReportCardsRequestBody {
  answers?: Answer[];
  demographics?: DemographicSet | null;
  metaSignals?: MetaSignal[];
  // CC-LLM-REWRITES-PERSISTED-ON-SESSION — when present, the route
  // loads the per-session rewrite bundle from `sessions.llm_rewrites`
  // and threads it into the resolver. Live sessions whose row has
  // been backfilled serve every layer from the bundle.
  sessionId?: string;
}

function isReportCardsRequestBody(v: unknown): v is ReportCardsRequestBody {
  if (!v || typeof v !== "object") return false;
  const b = v as Record<string, unknown>;
  return Array.isArray(b.answers);
}

const EMPTY_RESULT: ScopedRewritesResult = {
  lens: null,
  compass: null,
  hands: null,
  path: null,
  keystone: null,
  // CC-LAUNCH-VOICE-POLISH-V3 — seven additional sections.
  executiveRead: null,
  corePattern: null,
  whatOthersMayExperience: null,
  whenTheLoadGetsHeavy: null,
  synthesis: null,
  closingRead: null,
  pathTriptych: null,
};

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body", ...EMPTY_RESULT },
      { status: 400 }
    );
  }
  if (!isReportCardsRequestBody(payload)) {
    return NextResponse.json(
      { error: "missing or malformed `answers` array", ...EMPTY_RESULT },
      { status: 400 }
    );
  }
  const answers = payload.answers ?? [];
  const demographics = payload.demographics ?? null;
  const metaSignals = payload.metaSignals ?? [];
  const sessionId = payload.sessionId ?? null;

  try {
    const constitution = buildInnerConstitution(
      answers,
      metaSignals,
      demographics
    );
    // CC-LLM-REWRITES-PERSISTED-ON-SESSION — bundle load + thread.
    const sessionLlmBundle = sessionId
      ? await loadSessionLlmBundle(sessionId)
      : null;
    const rewrites = await resolveScopedRewritesLive(
      {
        constitution,
        answers,
        demographics,
      },
      { sessionLlmBundle }
    );
    return NextResponse.json(rewrites);
  } catch (e) {
    console.error(`[api/report-cards] failure: ${(e as Error).message}`);
    // CC contract: never 500 on resolver/budget failures. Return the
    // null-shaped result so the client falls back to engine prose.
    return NextResponse.json(EMPTY_RESULT, { status: 200 });
  }
}
