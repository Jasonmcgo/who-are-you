// CC-057b — Default provider configurations. Locked content per the CC.
//
// Both default to `enabled: false`. The MVP launch ships with the polish
// layer wired but disabled. The A/B harness route runs the polish call
// regardless of the flag (admin tool; bypasses flag).
//
// Models are overridable via env (POLISH_OPENAI_MODEL,
// POLISH_ANTHROPIC_MODEL). The hard-coded defaults are starting points;
// CC-057c may revise after the A/B comparison.
//
// Cost rate-cards in `usdCostFor` are starting estimates; refresh per
// provider's current pricing before any production decision.

import type { CostBreakdown, PolishConfig, PolishProvider } from "../types";

export const DEFAULT_OPENAI_CONFIG: PolishConfig = {
  provider: "openai",
  model: "gpt-4-turbo",
  temperature: 0.4,
  max_tokens: 4096,
  enabled: false,
};

export const DEFAULT_ANTHROPIC_CONFIG: PolishConfig = {
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  temperature: 0.4,
  max_tokens: 4096,
  enabled: false,
};

// Resolve the actual model from env override (when set) or fall back to
// the default-config model. Used by both adapters.
export function resolveModel(config: PolishConfig): string {
  const envOverride =
    config.provider === "openai"
      ? process.env.POLISH_OPENAI_MODEL
      : process.env.POLISH_ANTHROPIC_MODEL;
  return envOverride && envOverride.trim().length > 0 ? envOverride : config.model;
}

// ── Cost rate-card constants ──────────────────────────────────────────
//
// USD per 1M tokens, prompt and completion broken out separately.
// **TODO (refresh per provider's current pricing):** these are starting
// estimates as of CC-057b authoring. The A/B harness should display the
// computed cost prominently so Jason + Clarence can sanity-check against
// the actual provider invoice.
//
// Sources to refresh against: openai.com/pricing and anthropic.com/pricing.

const RATE_CARDS: Record<
  PolishProvider,
  Record<string, { promptPer1M: number; completionPer1M: number }>
> = {
  openai: {
    "gpt-4-turbo": { promptPer1M: 10.0, completionPer1M: 30.0 },
    "gpt-4o": { promptPer1M: 2.5, completionPer1M: 10.0 },
    // Add new entries when models change. Unknown models fall back to a
    // conservative high estimate so cost doesn't silently underreport.
    default: { promptPer1M: 30.0, completionPer1M: 60.0 },
  },
  anthropic: {
    "claude-sonnet-4-6": { promptPer1M: 3.0, completionPer1M: 15.0 },
    "claude-opus-4-7": { promptPer1M: 15.0, completionPer1M: 75.0 },
    "claude-haiku-4-5-20251001": { promptPer1M: 0.8, completionPer1M: 4.0 },
    default: { promptPer1M: 15.0, completionPer1M: 75.0 },
  },
};

export function usdCostFor(
  provider: PolishProvider,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const card = RATE_CARDS[provider][model] ?? RATE_CARDS[provider]["default"];
  const promptCost = (promptTokens / 1_000_000) * card.promptPer1M;
  const completionCost = (completionTokens / 1_000_000) * card.completionPer1M;
  return Number((promptCost + completionCost).toFixed(6));
}

export function emptyCost(
  provider: PolishProvider,
  model: string
): CostBreakdown {
  return {
    provider,
    model,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    usdCost: 0,
  };
}
