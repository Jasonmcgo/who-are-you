// CC-131 Part C.1 — Cross-section polish: server-side composer +
// on-demand resolver. Mirrors lib/launchPolishV3LlmServer.ts. Server-
// only: imports the Anthropic SDK and reads ANTHROPIC_API_KEY. Pure
// data side (prompts + cache lookup + types) lives in
// lib/crossSectionPolishLlm.ts.
//
// **No-spend default.** `resolveCrossSectionPolishLive` returns null
// unless (a) the committed cache or the session bundle has an entry,
// (b) `liveSession` is true, AND (c) `LLM_REWRITE_RUNTIME === "on"`.
// The committed cache ships empty; render-path callers always pass
// `liveSession: false`, so the resolver short-circuits to null. The
// only path that ever reaches the composer is a `build*` script that
// opts into the runtime gate explicitly.

import {
  buildCrossSectionPolishUserPrompt,
  CROSS_SECTION_POLISH_SYSTEM_PROMPT,
  crossSectionPolishHash,
  readCachedCrossSectionPolish,
  writeRuntimeCrossSectionPolish,
  type CrossSectionPolishInputs,
} from "./crossSectionPolishLlm";
import {
  fingerprintBody,
  logCacheResolution,
  SessionLlmBudget,
} from "./cacheObservability";
import { bundleLookup, type LlmRewritesBundle } from "./llmRewritesBundle";

const CLAUDE_MODEL = "claude-sonnet-4-5";
const DEFAULT_API_TIMEOUT_MS = 60_000;
export const LIVE_SESSION_TIMEOUT_MS = 10_000;

type AnthropicLikeClient = {
  messages: {
    create: (args: {
      model: string;
      max_tokens: number;
      temperature?: number;
      system:
        | string
        | Array<{
            type: "text";
            text: string;
            cache_control: { type: "ephemeral" };
          }>;
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

export async function composeCrossSectionPolish(
  inputs: CrossSectionPolishInputs,
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = await getClient();
  if (!client) return null;

  const userPrompt = buildCrossSectionPolishUserPrompt(inputs);
  try {
    const response = await withTimeout(
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1400,
        temperature: 0,
        system: [
          {
            type: "text",
            text: CROSS_SECTION_POLISH_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userPrompt }],
      }),
      timeoutMs,
      `Anthropic API call (cross-section-polish/${inputs.sectionId})`
    );
    const block = response.content.find((c) => c.type === "text");
    const text = block?.text?.trim() ?? null;
    if (!text) return null;
    return text
      .replace(/^```(?:markdown)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  } catch (e) {
    console.error(
      `[cross-section-polish/${inputs.sectionId}] API call failed: ${(e as Error).message}`
    );
    return null;
  }
}

export interface CrossSectionPolishLiveResolveOptions {
  liveSession: boolean;
  budget?: SessionLlmBudget;
  timeoutMs?: number;
  composer?: (
    inputs: CrossSectionPolishInputs,
    timeoutMs: number
  ) => Promise<string | null>;
  /**
   * Per-session bundle from `sessions.llm_rewrites`. Consulted after
   * the committed-cache check, before the runtime gate. The bundle's
   * `crossSectionPolish` layer holds entries that were generated for
   * this session in a prior render.
   */
  sessionLlmBundle?: LlmRewritesBundle | null;
}

/**
 * Three-tier gate: committed cache → session bundle → runtime LLM.
 * Render path always passes `liveSession: false` and provides no
 * session bundle (until backfill scripts populate one), so the
 * resolver returns null and the upstream prose is used unchanged.
 */
export async function resolveCrossSectionPolishLive(
  inputs: CrossSectionPolishInputs,
  options: CrossSectionPolishLiveResolveOptions
): Promise<string | null> {
  // 1. Committed-cache check.
  const cached = readCachedCrossSectionPolish(inputs);
  if (cached !== null) return cached;

  // 2. Per-session bundle check.
  const key = crossSectionPolishHash(inputs);
  const fromBundle = bundleLookup(
    options.sessionLlmBundle ?? null,
    "crossSectionPolish",
    key
  );
  if (fromBundle !== null) return fromBundle;

  // 3. Cohort/audit run — engine fallback (no spend).
  if (!options.liveSession) return null;

  // 4. Runtime gate. Render path is off by default; only build* scripts
  //    opt in by setting LLM_REWRITE_RUNTIME=on.
  if (process.env.LLM_REWRITE_RUNTIME !== "on") return null;

  const fingerprint = fingerprintBody(inputs.targetSectionBody);
  const namespace = "cross-section-polish-rewrites";
  const section = inputs.sectionId;

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

  const composer = options.composer ?? composeCrossSectionPolish;
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

  writeRuntimeCrossSectionPolish(inputs, rewrite);
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
