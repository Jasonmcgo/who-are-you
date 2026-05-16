// CC-KEYSTONE-RENDER — server-side composer for the Keystone Reflection
// rewrite. Wraps the Anthropic SDK. Server-only — must not be imported
// from the client bundle (uses `process.env.ANTHROPIC_API_KEY`).

import {
  buildKeystoneRewriteUserPrompt,
  keystoneRewriteHash,
  KEYSTONE_REWRITE_SYSTEM_PROMPT,
  readCachedKeystoneRewrite,
  writeRuntimeKeystoneRewrite,
  type KeystoneRewriteInputs,
} from "./keystoneRewriteLlm";
import {
  fingerprintBody,
  logCacheResolution,
  SessionLlmBudget,
} from "./cacheObservability";
import { bundleLookup, type LlmRewritesBundle } from "./llmRewritesBundle";

const CLAUDE_MODEL = "claude-sonnet-4-5";
const DEFAULT_API_TIMEOUT_MS = 60_000;
// CC-LIVE-SESSION-LLM-WIRING — live-session timeout (see twin in
// proseRewriteLlmServer.ts).
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
 * composeKeystoneRewrite — call Claude to write the Keystone Reflection
 * body. Returns the rewrite string, or null on API failure / missing key.
 *
 * @param timeoutMs — optional override. Defaults to 60s for build-time
 * cohort regen; live-session callers pass LIVE_SESSION_TIMEOUT_MS (10s).
 */
export async function composeKeystoneRewrite(
  inputs: KeystoneRewriteInputs,
  timeoutMs: number = DEFAULT_API_TIMEOUT_MS
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = await getClient();
  if (!client) return null;

  const userPrompt = buildKeystoneRewriteUserPrompt(inputs);
  try {
    const response = await withTimeout(
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        temperature: 0,
        system: KEYSTONE_REWRITE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      timeoutMs,
      "Anthropic API call (keystone-rewrite)"
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
    console.error(`[keystone-rewrite] API call failed: ${(e as Error).message}`);
    return null;
  }
}

// CC-LIVE-SESSION-LLM-WIRING — on-demand Keystone resolver (twin of
// resolveProseRewriteLive in proseRewriteLlmServer.ts).

export interface KeystoneLiveResolveOptions {
  liveSession: boolean;
  budget?: SessionLlmBudget;
  timeoutMs?: number;
  composer?: (
    inputs: KeystoneRewriteInputs,
    timeoutMs: number
  ) => Promise<string | null>;
  /**
   * CC-LLM-REWRITES-PERSISTED-ON-SESSION — per-session bundle from
   * `sessions.llm_rewrites`. Consulted after the committed-cache
   * check, before the runtime gate.
   */
  sessionLlmBundle?: LlmRewritesBundle | null;
}

export async function resolveKeystoneRewriteLive(
  inputs: KeystoneRewriteInputs,
  options: KeystoneLiveResolveOptions
): Promise<string | null> {
  // 1. Committed-cache check.
  const cached = readCachedKeystoneRewrite(inputs);
  if (cached !== null) return cached;

  // 2. CC-LLM-REWRITES-PERSISTED-ON-SESSION — session bundle check.
  const key = keystoneRewriteHash(inputs);
  const fromBundle = bundleLookup(
    options.sessionLlmBundle ?? null,
    "keystone",
    key
  );
  if (fromBundle !== null) return fromBundle;

  // 3. Cohort/audit run — engine fallback.
  if (!options.liveSession) return null;

  // 4. CC-LLM-REWRITES-PERSISTED-ON-SESSION — runtime gate. Render
  //    path is off by default; only `build*` scripts opt in.
  if (process.env.LLM_REWRITE_RUNTIME !== "on") return null;

  const fingerprint = fingerprintBody(inputs.beliefText);
  const namespace = "keystone-rewrites";
  const section = "keystone";

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

  const composer = options.composer ?? composeKeystoneRewrite;
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

  writeRuntimeKeystoneRewrite(inputs, rewrite);
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
