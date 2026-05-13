// CC-GRIP-TAXONOMY — server-only LLM API caller + cache persistence.
//
// Mirrors `lib/synthesis3LlmServer.ts`:
//   - Server-only (`typeof window !== "undefined"` guard at every entry).
//   - Dynamic SDK + node:fs imports — no client-bundle leakage.
//   - 10-second timeout on the API call.
//   - Cache writes to `lib/cache/grip-paragraphs.json`.

import {
  buildGripUserPrompt,
  gripInputsHash,
  GRIP_SYSTEM_PROMPT,
  readCachedGripParagraph,
  type GripParagraphInputs,
} from "./gripTaxonomyLlm";

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

export async function composeGripParagraph(
  inputs: GripParagraphInputs
): Promise<string | null> {
  if (typeof window !== "undefined") return null;
  const client = await loadAnthropicClient();
  if (!client) return null;

  const userPrompt = buildGripUserPrompt(inputs);
  try {
    const response = await withTimeout(
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 600,
        system: GRIP_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
      API_TIMEOUT_MS,
      "Anthropic API call (grip)"
    );
    const block = response.content.find((c) => c.type === "text");
    const text = (block?.text ?? "").trim();
    return text.length > 0 ? text : null;
  } catch (err) {
    console.warn(
      `[grip-taxonomy] API call failed: ${(err as Error).message}`
    );
    return null;
  }
}

export async function persistGripCache(
  inputs: GripParagraphInputs,
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
      "grip-paragraphs.json"
    );
    let current: Record<
      string,
      { paragraph: string; fixtureHint?: string; generatedAt?: string }
    > = {};
    try {
      const raw = fs.readFileSync(cacheFile, "utf-8");
      if (raw.trim()) current = JSON.parse(raw);
    } catch {
      // first write — file may not exist
    }
    const key = gripInputsHash(inputs);
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
    console.warn(
      `[grip-taxonomy] cache persist failed: ${(err as Error).message}`
    );
  }
}

export async function lookupOrComputeGripParagraph(
  inputs: GripParagraphInputs
): Promise<string | null> {
  // 1. Static cache lookup.
  const cached = readCachedGripParagraph(inputs);
  if (cached) return cached;

  // 2. Defensive: never run the API fallback in a browser bundle.
  if (typeof window !== "undefined") return null;
  if (!process.env.ANTHROPIC_API_KEY) return null;

  // 3. Cache miss + server env + key → call API.
  const paragraph = await composeGripParagraph(inputs);
  if (!paragraph) return null;

  // 4. Persist for future renders.
  await persistGripCache(inputs, paragraph);
  return paragraph;
}
