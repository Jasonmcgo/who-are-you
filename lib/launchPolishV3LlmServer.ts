// CC-LAUNCH-VOICE-POLISH-V3 — server-side composer + on-demand resolver.
// Mirrors lib/proseRewriteLlmServer.ts exactly. Server-only: imports the
// Anthropic SDK and reads ANTHROPIC_API_KEY. Pure data side (prompts +
// cache lookup + types) lives in lib/launchPolishV3Llm.ts.

import {
  buildV3UserPrompt,
  readCachedV3Rewrite,
  v3RewriteHash,
  V3_REWRITE_SYSTEM_PROMPT,
  writeRuntimeV3Rewrite,
  type V3RewriteInputs,
} from "./launchPolishV3Llm";
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

export async function composeV3Rewrite(
  inputs: V3RewriteInputs,
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = await getClient();
  if (!client) return null;

  const userPrompt = buildV3UserPrompt(inputs);
  try {
    const response = await withTimeout(
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1400,
        temperature: 0,
        system: V3_REWRITE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      timeoutMs,
      `Anthropic API call (v3-rewrite/${inputs.sectionId})`
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
      `[v3-rewrite/${inputs.sectionId}] API call failed: ${(e as Error).message}`
    );
    return null;
  }
}

export interface V3LiveResolveOptions {
  liveSession: boolean;
  budget?: SessionLlmBudget;
  timeoutMs?: number;
  composer?: (
    inputs: V3RewriteInputs,
    timeoutMs: number
  ) => Promise<string | null>;
  /**
   * CC-LLM-REWRITES-PERSISTED-ON-SESSION — per-session bundle from
   * `sessions.llm_rewrites`. Consulted after the committed-cache
   * check, before the runtime gate.
   */
  sessionLlmBundle?: LlmRewritesBundle | null;
}

export async function resolveV3RewriteLive(
  inputs: V3RewriteInputs,
  options: V3LiveResolveOptions
): Promise<string | null> {
  // 1. Committed-cache check.
  const cached = readCachedV3Rewrite(inputs);
  if (cached !== null) return cached;

  // 2. CC-LLM-REWRITES-PERSISTED-ON-SESSION — session bundle check.
  const key = v3RewriteHash(inputs);
  const fromBundle = bundleLookup(
    options.sessionLlmBundle ?? null,
    "launchPolishV3",
    key
  );
  if (fromBundle !== null) return fromBundle;

  // 3. Cohort/audit run — engine fallback.
  if (!options.liveSession) return null;

  // 4. CC-LLM-REWRITES-PERSISTED-ON-SESSION — runtime gate. Render
  //    path is off by default; only `build*` scripts opt in.
  if (process.env.LLM_REWRITE_RUNTIME !== "on") return null;

  const fingerprint = fingerprintBody(inputs.engineSectionBody);
  const namespace = "launch-polish-v3-rewrites";
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

  const composer = options.composer ?? composeV3Rewrite;
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

  writeRuntimeV3Rewrite(inputs, rewrite);
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
