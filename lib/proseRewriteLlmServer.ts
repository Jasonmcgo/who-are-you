// CC-LLM-PROSE-PASS-V1 — server-side composer for the prose rewrite
// layer. Wraps the Anthropic SDK. Server-only — must not be imported
// from the client bundle (uses `process.env.ANTHROPIC_API_KEY`).

import {
  buildProseRewriteUserPrompt,
  proseRewriteHash,
  PROSE_REWRITE_SYSTEM_PROMPT,
  readCachedRewrite,
  writeRuntimeRewrite,
  type ProseRewriteInputs,
} from "./proseRewriteLlm";
import {
  fingerprintBody,
  logCacheResolution,
  SessionLlmBudget,
} from "./cacheObservability";
import { bundleLookup, type LlmRewritesBundle } from "./llmRewritesBundle";

const CLAUDE_MODEL = "claude-sonnet-4-5";
const DEFAULT_API_TIMEOUT_MS = 60_000;
// CC-LIVE-SESSION-LLM-WIRING — live-session calls use a tighter 10s
// timeout so a slow API doesn't block the rendered report. Build-time
// cohort regen continues to use the default 60s budget.
export const LIVE_SESSION_TIMEOUT_MS = 10_000;

type AnthropicLikeClient = {
  messages: {
    create: (args: {
      model: string;
      max_tokens: number;
      temperature?: number;
      system: string;
      messages: Array<{ role: "user"; content: string }>;
    }) => Promise<{ content: Array<{ type: string; text?: string }> }>;
  };
};

async function getClient(): Promise<AnthropicLikeClient | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const mod = (await import("@anthropic-ai/sdk")) as {
      default: new (args: { apiKey: string }) => AnthropicLikeClient;
    };
    return new mod.default({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    return null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/**
 * composeProseRewrite — call Claude to rewrite a single scoped card.
 * Returns the rewrite string, or null on API failure / missing key.
 *
 * @param timeoutMs — optional override. Defaults to 60s for build-time
 * cohort regen; live-session callers pass LIVE_SESSION_TIMEOUT_MS (10s).
 */
export async function composeProseRewrite(
  inputs: ProseRewriteInputs,
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = await getClient();
  if (!client) return null;

  const userPrompt = buildProseRewriteUserPrompt(inputs);
  try {
    const response = await withTimeout(
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1200,
        temperature: 0,
        system: PROSE_REWRITE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      timeoutMs,
      "Anthropic API call (prose-rewrite)"
    );
    const block = response.content.find((c) => c.type === "text");
    const text = block?.text?.trim() ?? null;
    if (!text) return null;
    // Strip wrapping code fences if the model added them.
    return text
      .replace(/^```(?:markdown)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  } catch (e) {
    console.error(`[prose-rewrite] API call failed: ${(e as Error).message}`);
    return null;
  }
}

// CC-LIVE-SESSION-LLM-WIRING — on-demand resolver. Consults the cache
// first; on miss in a live session, calls the LLM under timeout +
// cost-guard budget and caches the result in the in-memory runtime
// cache. Cohort runs (`liveSession === false`) and audit/test paths fall
// through to the existing null-return contract.

export interface ProseLiveResolveOptions {
  liveSession: boolean;
  /** Per-session call budget. Required when liveSession is true. */
  budget?: SessionLlmBudget;
  /** Override the LLM timeout. Default: LIVE_SESSION_TIMEOUT_MS (10s). */
  timeoutMs?: number;
  /** Test seam — inject a mock composer. Production code leaves
   *  undefined to use the real `composeProseRewrite`. */
  composer?: (
    inputs: ProseRewriteInputs,
    timeoutMs: number
  ) => Promise<string | null>;
  /**
   * CC-LLM-REWRITES-PERSISTED-ON-SESSION — per-session rewrite bundle
   * loaded from `sessions.llm_rewrites`. Consulted in Step 2 (after
   * the committed-cache check, before the runtime gate). Null on
   * un-backfilled rows; the layer falls through to engine fallback
   * unless `LLM_REWRITE_RUNTIME=on`.
   */
  sessionLlmBundle?: LlmRewritesBundle | null;
}

/**
 * resolveProseRewriteLive — async cache-or-resolve for a scoped body
 * card. Hits return immediately; live misses trigger an on-demand LLM
 * call; cohort/audit misses preserve the existing engine-fallback
 * behavior (return null).
 */
export async function resolveProseRewriteLive(
  inputs: ProseRewriteInputs,
  options: ProseLiveResolveOptions
): Promise<string | null> {
  // 1. Committed-cache check (cohort + runtime caches). On hit, return
  //    immediately. On miss, `readCachedRewrite` emits a structured
  //    [cache-miss] log so the diagnostic surface is correct.
  const cached = readCachedRewrite(inputs);
  if (cached !== null) return cached;

  // 2. CC-LLM-REWRITES-PERSISTED-ON-SESSION — session bundle check.
  //    The bundle is loaded from `sessions.llm_rewrites` and threaded
  //    in by the live render entry points (api/render, api/report-
  //    cards). On hit, return the persisted rewrite — no API call,
  //    no engine fallback.
  const key = proseRewriteHash(inputs);
  const fromBundle = bundleLookup(
    options.sessionLlmBundle ?? null,
    "prose",
    key
  );
  if (fromBundle !== null) return fromBundle;

  // 3. Cohort/audit run — engine fallback. No LLM call.
  if (!options.liveSession) return null;

  // 4. CC-LLM-REWRITES-PERSISTED-ON-SESSION — runtime gate. Render
  //    path defaults to OFF; only `build*` scripts opt in by setting
  //    process.env.LLM_REWRITE_RUNTIME = "on" at script start. Any
  //    runtime call past this guard is intentional.
  if (process.env.LLM_REWRITE_RUNTIME !== "on") return null;

  const fingerprint = fingerprintBody(inputs.engineSectionBody);
  const namespace = "prose-rewrites";
  const section = inputs.cardId;

  // 5. Budget check.
  if (options.budget && !options.budget.tryConsume()) {
    logCacheResolution({
      namespace,
      section,
      cacheKey: key,
      fingerprint,
      outcome: "cost-guard-hit",
      latencyMs: 0,
      detail: `budget exhausted (cap=${options.budget.capacity()})`,
    });
    return null;
  }

  // 6. LLM call under timeout. The composer itself enforces the
  //    per-call timeout (real composer wraps `withTimeout`).
  const composer = options.composer ?? composeProseRewrite;
  const timeoutMs = options.timeoutMs ?? LIVE_SESSION_TIMEOUT_MS;
  const startedAt = Date.now();
  let rewrite: string | null = null;
  let errorDetail: string | undefined;
  try {
    rewrite = await composer(inputs, timeoutMs);
  } catch (e) {
    errorDetail = (e as Error).message;
  }
  const latencyMs = Date.now() - startedAt;

  if (rewrite === null) {
    logCacheResolution({
      namespace,
      section,
      cacheKey: key,
      fingerprint,
      outcome: errorDetail ? "error" : "timeout",
      latencyMs,
      detail: errorDetail,
    });
    return null;
  }

  // 7. Success. Cache in runtime + log resolution + return.
  writeRuntimeRewrite(inputs, rewrite);
  logCacheResolution({
    namespace,
    section,
    cacheKey: key,
    fingerprint,
    outcome: "success",
    latencyMs,
  });
  return rewrite;
}
