"use server";

// CC-057b — Humanity Rendering Layer entry point.
//
// `polish(engineReport, config)` orchestrates the provider call, runs the
// validation pass, and falls back to the engine baseline on any failure
// (flag off, missing API key, fetch error, malformed response, validation
// failure). The user always gets a report.

import { callAnthropic } from "./providers/anthropicAdapter";
import { callOpenAI } from "./providers/openaiAdapter";
import { validatePolish } from "./validation";
import type {
  EngineRenderedReport,
  PolishConfig,
  PolishRunResult,
} from "./types";

export async function polish(
  engineReport: EngineRenderedReport,
  config: PolishConfig
): Promise<PolishRunResult> {
  // Flag off → engine baseline. Cost is zero (no API call made).
  if (!config.enabled) {
    return {
      report: engineReport,
      validation: { ok: true },
      cost: {
        provider: config.provider,
        model: config.model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        usdCost: 0,
      },
      fellBackToEngine: true,
    };
  }

  const adapterResult =
    config.provider === "openai"
      ? await callOpenAI(engineReport, config)
      : await callAnthropic(engineReport, config);

  if (!adapterResult.ok) {
    // Adapter-level failure (no API key, HTTP error, malformed response).
    // Log the reason server-side and return engine baseline.
    console.warn(
      `[humanityRendering] polish provider=${config.provider} failed: ${adapterResult.reason}`
    );
    return {
      report: engineReport,
      validation: {
        ok: false,
        reason: adapterResult.reason,
        failedCheck: "structural_assertion",
      },
      cost: adapterResult.cost,
      fellBackToEngine: true,
    };
  }

  // Run the four-check validation pass on the candidate.
  const validation = validatePolish(engineReport, adapterResult.candidate);
  if (!validation.ok) {
    console.warn(
      `[humanityRendering] polish provider=${config.provider} validation failed (${validation.failedCheck}): ${validation.reason}`
    );
    return {
      report: engineReport,
      validation,
      cost: adapterResult.cost,
      fellBackToEngine: true,
    };
  }

  return {
    report: adapterResult.candidate,
    validation,
    cost: adapterResult.cost,
    fellBackToEngine: false,
  };
}
