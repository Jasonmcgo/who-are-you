// CC-057b — Humanity Rendering Layer types.
//
// EngineRenderedReport is the typed view the polish layer reads from the
// engine. PolishedReport is the same shape — the polish layer is a texture
// pass, not a transformation, so input and output share structure. Locked
// fields (derivations, lockedAnchors, lockedDisambiguation, numberedFacts,
// sectionHeadings) are validated for verbatim preservation; the
// `proseSlots` map is the licensed surface where the polish layer can
// substitute warmer prose.
//
// Architecture canon: docs/canon/humanity-rendering-layer.md (CC-057a).

export type PolishProvider = "openai" | "anthropic";

export type PolishConfig = {
  provider: PolishProvider;
  model: string;
  temperature: number;
  max_tokens: number;
  // Feature-flag default OFF for MVP launch per CC-057a operational stance.
  // The A/B harness route runs the polish call regardless of this flag
  // (admin tool; bypasses flag).
  enabled: boolean;
};

// Structural-claim strings the validator preserves verbatim. Examples:
// "driver_function: ni", "aux_pair: nite", "compass_top_5: peace,truth,knowledge,honor,mercy".
export type DerivationClaim = string;

export type EngineNumberedFacts = {
  topGiftsOrder: string[]; // gift NOUN_PHRASE labels in top-3 order
  compassTop5: string[]; // signal_id list, top-5
  drivePercentages: { cost: number; coverage: number; compliance: number };
  oceanBucketLabels: string[]; // ["Openness", "Conscientiousness", ...]
};

export type EngineRenderedReport = {
  // ── Substance — engine-owned, polish layer must preserve verbatim ──
  derivations: DerivationClaim[];
  numberedFacts: EngineNumberedFacts;
  lockedAnchors: string[];
  lockedDisambiguation: string[];
  sectionHeadings: string[];

  // ── Texture — polish layer is licensed to edit ──
  proseSlots: Record<string, string>;

  // ── Signal summary — read-only context the polish layer uses to anchor
  //    its texture additions (top dominant function, top compass values,
  //    drive bucket lean, OCEAN top dimension, agency aspiration, weather
  //    intensifier, fire register). The summary is not validated — it's
  //    input to the LLM only.
  signalSummary: SignalSummary;
};

export type SignalSummary = {
  driverFunction: string;
  auxiliaryFunction: string;
  auxPairKey: string | null;
  compassTopFive: string[];
  driveBucketLean: "cost" | "coverage" | "compliance" | "balanced" | "unstated";
  oceanTopDimension: string | null;
  agencyAspiration: string;
  weatherIntensifier: string;
  fireWillingToBearCost: boolean;
};

export type PolishedReport = EngineRenderedReport;

export type PolishValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
      failedCheck: "anchor" | "derivation" | "structural_assertion" | "numbered_fact";
    };

export type CostBreakdown = {
  provider: PolishProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  usdCost: number;
};

export type PolishRunResult = {
  report: PolishedReport;
  validation: PolishValidationResult;
  cost: CostBreakdown;
  // True when validation failed or the flag was off; the report field
  // carries the engine baseline rather than the polished output.
  fellBackToEngine: boolean;
};

export type ABRunResult = {
  engineBaseline: EngineRenderedReport;
  openai: PolishRunResult;
  anthropic: PolishRunResult;
};
