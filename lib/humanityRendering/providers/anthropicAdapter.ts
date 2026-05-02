"use server";

// CC-057b — Anthropic adapter for the Humanity Rendering Layer.
//
// Fetch-based call against Anthropic's Messages API. No SDK dependency.
// Reads `ANTHROPIC_API_KEY` from env. When the key is unset, the adapter
// returns a sentinel "no API key" failure so the polish layer can fall
// back to the engine baseline gracefully.
//
// Returns a candidate PolishedReport plus token usage. The caller
// (`polish()` in index.ts) runs validation on the candidate before
// surfacing it.

import { resolveModel, usdCostFor } from "./defaults";
import { POLISH_SYSTEM_PROMPT } from "../prompt";
import type {
  CostBreakdown,
  EngineRenderedReport,
  PolishConfig,
  PolishedReport,
} from "../types";
import type { AdapterCallResult } from "./openaiAdapter";

export async function callAnthropic(
  engineReport: EngineRenderedReport,
  config: PolishConfig
): Promise<AdapterCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = resolveModel(config);
  if (!apiKey) {
    return {
      ok: false,
      reason: "ANTHROPIC_API_KEY not set; polish layer cannot call Anthropic.",
      cost: {
        provider: "anthropic",
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        usdCost: 0,
      },
    };
  }

  const userPayload = {
    instruction:
      "Apply the polish pass to this engine-rendered report per the system-prompt rules. Return JSON conforming to the same shape; do not edit the locked fields (derivations, lockedAnchors, lockedDisambiguation, numberedFacts, sectionHeadings). Output ONLY the JSON object — no preamble, no commentary.",
    engineReport,
  };

  let resp: Response;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        system: POLISH_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
    });
  } catch (e) {
    return {
      ok: false,
      reason: `Anthropic fetch threw: ${e instanceof Error ? e.message : String(e)}`,
      cost: {
        provider: "anthropic",
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        usdCost: 0,
      },
    };
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    return {
      ok: false,
      reason: `Anthropic HTTP ${resp.status}: ${body.slice(0, 200)}`,
      cost: {
        provider: "anthropic",
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        usdCost: 0,
      },
    };
  }

  let data: {
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  try {
    data = await resp.json();
  } catch (e) {
    return {
      ok: false,
      reason: `Anthropic JSON parse failed: ${e instanceof Error ? e.message : String(e)}`,
      cost: {
        provider: "anthropic",
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        usdCost: 0,
      },
    };
  }

  const promptTokens = data.usage?.input_tokens ?? 0;
  const completionTokens = data.usage?.output_tokens ?? 0;
  const cost: CostBreakdown = {
    provider: "anthropic",
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    usdCost: usdCostFor("anthropic", model, promptTokens, completionTokens),
  };

  // Anthropic's response shape: content is an array of content blocks; the
  // text block carries the JSON. Find the first text block.
  const textBlock = (data.content ?? []).find((c) => c.type === "text");
  const text = textBlock?.text;
  if (!text) {
    return {
      ok: false,
      reason: "Anthropic returned no text content block",
      cost,
    };
  }

  // Anthropic sometimes prepends/appends commentary even when asked not to.
  // Defensive: extract the first {...} balanced JSON object from the text.
  const candidate = parseFirstJsonObject(text);
  if (!candidate) {
    return {
      ok: false,
      reason: `Anthropic returned content without parseable JSON: "${text.slice(0, 200)}"`,
      cost,
    };
  }

  return { ok: true, candidate, cost };
}

function parseFirstJsonObject(text: string): PolishedReport | null {
  // Find the first { ... matching } — naive but adequate. Properly balanced
  // brace-matching that ignores braces inside strings.
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.substring(start, i + 1);
        try {
          return JSON.parse(candidate) as PolishedReport;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
