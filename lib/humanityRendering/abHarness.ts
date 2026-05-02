"use server";

// CC-057b — A/B testing harness for the Humanity Rendering Layer.
//
// `runAB(engineReport, configs)` runs both providers (OpenAI + Anthropic)
// against the same engine report and returns both polished outputs +
// per-provider cost breakdowns. The harness *always* runs both providers
// regardless of the `enabled` flag in config — admin tooling bypasses the
// flag (the flag governs production user-facing rendering, not admin
// comparison work).
//
// Used by `/admin/polish-ab/[id]/page.tsx` for Jason + Clarence's manual
// tonal-calibration review.

import { polish } from "./index";
import {
  DEFAULT_ANTHROPIC_CONFIG,
  DEFAULT_OPENAI_CONFIG,
} from "./providers/defaults";
import type { ABRunResult, EngineRenderedReport, PolishConfig } from "./types";

export async function runAB(
  engineReport: EngineRenderedReport,
  overrides?: { openai?: Partial<PolishConfig>; anthropic?: Partial<PolishConfig> }
): Promise<ABRunResult> {
  // Force `enabled: true` for the harness call regardless of the default.
  // The harness bypasses the production flag — its purpose is the
  // comparison itself.
  const openaiConfig: PolishConfig = {
    ...DEFAULT_OPENAI_CONFIG,
    ...(overrides?.openai ?? {}),
    enabled: true,
  };
  const anthropicConfig: PolishConfig = {
    ...DEFAULT_ANTHROPIC_CONFIG,
    ...(overrides?.anthropic ?? {}),
    enabled: true,
  };

  // Run both in parallel — the providers are independent and the harness
  // is admin-side, so latency is not a critical-path concern but parallel
  // is still polite.
  const [openaiResult, anthropicResult] = await Promise.all([
    polish(engineReport, openaiConfig),
    polish(engineReport, anthropicConfig),
  ]);

  return {
    engineBaseline: engineReport,
    openai: openaiResult,
    anthropic: anthropicResult,
  };
}
