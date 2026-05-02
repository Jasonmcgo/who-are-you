"use server";

// CC-057b — OpenAI adapter for the Humanity Rendering Layer.
//
// Fetch-based call against OpenAI's chat-completions API. No SDK
// dependency. Reads `OPENAI_API_KEY` from env. When the key is unset, the
// adapter returns a sentinel "no API key" failure so the polish layer can
// fall back to the engine baseline gracefully.
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

export type AdapterCallResult =
  | {
      ok: true;
      candidate: PolishedReport;
      cost: CostBreakdown;
    }
  | {
      ok: false;
      reason: string;
      cost: CostBreakdown;
    };

export async function callOpenAI(
  engineReport: EngineRenderedReport,
  config: PolishConfig
): Promise<AdapterCallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = resolveModel(config);
  if (!apiKey) {
    return {
      ok: false,
      reason: "OPENAI_API_KEY not set; polish layer cannot call OpenAI.",
      cost: {
        provider: "openai",
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
      "Apply the polish pass to this engine-rendered report per the system-prompt rules. Return JSON conforming to the same shape; do not edit the locked fields (derivations, lockedAnchors, lockedDisambiguation, numberedFacts, sectionHeadings).",
    engineReport,
  };

  let resp: Response;
  try {
    resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: POLISH_SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        response_format: { type: "json_object" },
      }),
    });
  } catch (e) {
    return {
      ok: false,
      reason: `OpenAI fetch threw: ${e instanceof Error ? e.message : String(e)}`,
      cost: {
        provider: "openai",
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
      reason: `OpenAI HTTP ${resp.status}: ${body.slice(0, 200)}`,
      cost: {
        provider: "openai",
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        usdCost: 0,
      },
    };
  }

  let data: {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  try {
    data = await resp.json();
  } catch (e) {
    return {
      ok: false,
      reason: `OpenAI JSON parse failed: ${e instanceof Error ? e.message : String(e)}`,
      cost: {
        provider: "openai",
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        usdCost: 0,
      },
    };
  }

  const promptTokens = data.usage?.prompt_tokens ?? 0;
  const completionTokens = data.usage?.completion_tokens ?? 0;
  const cost: CostBreakdown = {
    provider: "openai",
    model,
    promptTokens,
    completionTokens,
    totalTokens: data.usage?.total_tokens ?? promptTokens + completionTokens,
    usdCost: usdCostFor("openai", model, promptTokens, completionTokens),
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return {
      ok: false,
      reason: "OpenAI returned empty content",
      cost,
    };
  }

  let candidate: PolishedReport;
  try {
    candidate = JSON.parse(content);
  } catch (e) {
    return {
      ok: false,
      reason: `OpenAI returned non-JSON content: ${e instanceof Error ? e.message : String(e)}`,
      cost,
    };
  }

  return { ok: true, candidate, cost };
}
