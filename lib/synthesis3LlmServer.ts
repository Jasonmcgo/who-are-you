// CC-SYNTHESIS-3 + CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — server-only LLM
// API caller + cache persistence.
//
// CODEX-SYNTHESIS-3-CLIENT-FIX (2026-05-09 morning) split read and write
// paths so `lib/synthesis3Llm.ts` is client-bundle-safe. This file
// (CODEX-SYNTHESIS-3-RUNTIME-FALLBACK, 2026-05-09 mid-day) holds the
// server-only API + cache-write code that the runtime fallback needs.
//
// The split:
//   - `lib/synthesis3Llm.ts`        — client-safe; cache READS only (static JSON import)
//   - `lib/synthesis3LlmServer.ts`  — server-only; cache WRITES + Anthropic SDK + API
//   - `app/api/synthesis3/master-paragraph/route.ts` — public surface for client fetches
//   - `scripts/buildSynthesis3.ts`  — build-time cohort runner (also server-only)
//
// Defensive guards:
//   - Every function checks `typeof window !== "undefined"` and returns
//     null/no-op in browser environments.
//   - `@anthropic-ai/sdk` and `node:fs` are dynamically imported INSIDE
//     guarded functions so a bundler that includes this file in a
//     client bundle will tree-shake the dynamic imports and emit no
//     references to the optional dependency.
//   - The API call has a 10-second timeout (per CODEX-SYNTHESIS-3-
//     RUNTIME-FALLBACK Out-of-Scope #10).

import {
  buildUserPrompt,
  inputsHash,
  readCachedParagraph,
  SYSTEM_PROMPT,
  type PathMasterInputs,
} from "./synthesis3Llm";
import { bundleLookup, type LlmRewritesBundle } from "./llmRewritesBundle";

const CLAUDE_MODEL = "claude-sonnet-4-5";
const API_TIMEOUT_MS = 60_000;

type AnthropicLikeClient = {
  messages: {
    create: (args: {
      model: string;
      max_tokens: number;
      system: string;
      messages: { role: "user"; content: string }[];
    }) => Promise<{
      content: Array<{ type: string; text?: string }>;
    }>;
  };
};

// Dynamically import the Anthropic SDK so static analyzers don't pull
// it into client bundles. The ts-expect-error gates the optional dep
// — the SDK may not be installed in some build contexts.
async function loadAnthropicClient(): Promise<AnthropicLikeClient | null> {
  if (typeof window !== "undefined") return null;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const mod = (await import("@anthropic-ai/sdk")) as {
      default: new (config: { apiKey: string }) => AnthropicLikeClient;
    };
    return new mod.default({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    return null;
  }
}

// Wrap a promise with a timeout — reject after API_TIMEOUT_MS so a
// hung API call doesn't block the render forever.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    p.then(
      (value) => {
        clearTimeout(t);
        resolve(value);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────
// Composer (server-only)
// ─────────────────────────────────────────────────────────────────────
//
// Calls Anthropic API with the SYSTEM_PROMPT + user prompt; returns the
// generated paragraph or null on any failure (missing key, SDK absent,
// API error, timeout). Never throws — the runtime fallback callers
// rely on null-on-failure semantics.

export async function composePathMasterSynthesisLlm(
  inputs: PathMasterInputs
): Promise<string | null> {
  if (typeof window !== "undefined") return null;
  const client = await loadAnthropicClient();
  if (!client) return null;

  const userPrompt = buildUserPrompt(inputs);
  try {
    const response = await withTimeout(
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      API_TIMEOUT_MS,
      "Anthropic API call"
    );
    const block = response.content.find((c) => c.type === "text");
    const text = (block?.text ?? "").trim();
    return text.length > 0 ? text : null;
  } catch (err) {
    console.warn(
      `[synthesis3] API call failed: ${(err as Error).message}`
    );
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Cache write (server-only)
// ─────────────────────────────────────────────────────────────────────
//
// Persists a runtime-generated entry to the same JSON file the build
// script writes. Concurrent writes risk last-wins; both writes are
// correct, so the race is benign. Per CODEX-SYNTHESIS-3-RUNTIME-FALLBACK
// Out-of-Scope #9, we don't add Redis/in-memory layers.
//
// `node:fs` and `node:path` are dynamically imported inside the
// `typeof window` guard so client bundles don't statically reference
// them.

export async function persistToCache(
  inputs: PathMasterInputs,
  paragraph: string,
  fixtureHint = "runtime-generated"
): Promise<void> {
  if (typeof window !== "undefined") return;
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const cacheFile = path.join(
      process.cwd(),
      "lib",
      "cache",
      "synthesis3-paragraphs.json"
    );
    let current: Record<
      string,
      { paragraph: string; fixtureHint?: string; generatedAt?: string }
    > = {};
    try {
      const raw = fs.readFileSync(cacheFile, "utf-8");
      if (raw.trim()) current = JSON.parse(raw);
    } catch {
      // First write — file may not exist; we'll create it.
    }
    const key = inputsHash(inputs);
    current[key] = {
      paragraph,
      fixtureHint,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(
      cacheFile,
      JSON.stringify(current, null, 2) + "\n",
      "utf-8"
    );
  } catch (err) {
    // Best-effort persistence; render succeeds even if write fails.
    console.warn(
      `[synthesis3] cache persist failed: ${(err as Error).message}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Runtime fallback wrapper
// ─────────────────────────────────────────────────────────────────────
//
// 1. Try the static cache (client-safe, sync).
// 2. On miss, server-only: call API, persist result, return paragraph.
// 3. On any failure (missing key, browser env, API error), return null
//    so the renderer falls back to the mechanical paragraph.

export async function lookupOrComputePathSynthesis(
  inputs: PathMasterInputs,
  sessionLlmBundle: LlmRewritesBundle | null = null
): Promise<string | null> {
  // 1. Static cache lookup.
  const cached = readCachedParagraph(inputs);
  if (cached) return cached;

  // 2. CC-LLM-REWRITES-PERSISTED-ON-SESSION — session bundle check.
  //    Render path threads `sessions.llm_rewrites` in here; on hit the
  //    persisted paragraph is served without an API call.
  const key = inputsHash(inputs);
  const fromBundle = bundleLookup(sessionLlmBundle, "synthesis3", key);
  if (fromBundle !== null) return fromBundle;

  // 3. Defensive: never run the API fallback in a browser bundle.
  if (typeof window !== "undefined") return null;

  // 4. CC-LLM-REWRITES-PERSISTED-ON-SESSION — runtime gate. The
  //    render path defaults to OFF; only `build*` scripts opt in.
  if (process.env.LLM_REWRITE_RUNTIME !== "on") return null;
  if (!process.env.ANTHROPIC_API_KEY) return null;

  // 5. Cache miss + runtime opt-in + key present → call API.
  const paragraph = await composePathMasterSynthesisLlm(inputs);
  if (!paragraph) return null;

  // 6. Persist for future renders. Best-effort; doesn't gate the return.
  await persistToCache(inputs, paragraph);
  return paragraph;
}
