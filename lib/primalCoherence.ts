// CC-PRIMAL-COHERENCE — two-path framework gating (trajectory vs crisis).
//
// Architectural anchor (Jason validated 2026-05-10, embedded as canon for
// the gating logic; NOT user-facing prose — that's CC-CRISIS-PATH-PROSE):
//
// "Sometimes the grip is not what's pulling you off course. It's what
//  you're reaching for because there is no course yet. The work isn't
//  to loosen — the work is to build something for the hand to hold."
//
// The 50° trajectory framework assumes the user's Primal cluster aligns
// with their Goal/Soul shape. When a user's Primal cluster INVERTS
// against that shape (high "Am I successful?" with low Goal score; high
// "Am I loved?" with low Soul score), the trajectory frame breaks.
// Telling that user "your trajectory is 32° Goal-leaning at strength 71"
// is technically correct AND functionally cruel — it confirms a shape
// they're not actually inhabiting.
//
// This module computes the gap between a user's actual Goal/Soul scores
// and the expected profile for their dominant Primal Question, and
// classifies the path as `trajectory` (frame works) or `crisis` (frame
// breaks). The classification is purely deterministic: rule-driven over
// existing engine outputs. No LLM, no new measurement.
//
// Method discipline (canon):
//   - Engine for truth. LLM for reception.
//   - The classification is ONE-WAY — once flagged crisis, no later
//     signal flips back to trajectory (no classification thrash).
//   - Conservative by default: low-confidence Primal clusters fall back
//     to trajectory rather than miscall someone into crisis on thin
//     evidence.
//   - Fully transparent: every CoherenceReading carries inputs, expected
//     ranges, gap math, path class, flavor, and a rationale string.
//   - The expected-profile table is the calibration surface — when
//     cohort testing requires tightening or loosening a range, this is
//     the only file to edit.
//
// Pure data — no API calls, no SDK, no `node:*` imports. Client-bundle-safe.

import type { PrimalCluster, PrimalQuestion } from "./gripTaxonomy";

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export type PathClass = "trajectory" | "crisis";

export type CrisisFlavor =
  | "longing-without-build"
  | "grasp-without-substance"
  | "paralysis"
  | "withdrawal"
  | "restless-without-anchor"
  // CC-PRIMAL-COHERENCE-EXTENSION — Goal-pinned/Soul-collapsed shape:
  // Goal at maximum, Soul collapsed under the work. The grip is real;
  // output IS happening at maximum; output is the wrong answer to the
  // question being asked. Detected by an override path BEFORE the
  // standard concern-rule classifier.
  | "working-without-presence";

export type ConcernRule =
  | { kind: "additive"; threshold: number }
  | { kind: "both-axes"; goalGapMin: number; soulGapMin: number };

export interface PrimalExpectedProfile {
  primary: PrimalQuestion;
  goalRange: { min: number; max: number };
  soulRange: { min: number; max: number };
  concernRule: ConcernRule;
  crisisFlavorWhenInverted: CrisisFlavor;
  // Optional special-case predicate. When defined and returns non-null,
  // its return value overrides `crisisFlavorWhenInverted`. Used for
  // Primals that have a primary inversion flavor + a special-case flavor
  // (e.g., Do I have purpose? → restless-without-anchor when both axes
  // are below 30, paralysis otherwise).
  crisisFlavorOverride?: (goal: number, soul: number) => CrisisFlavor | null;
}

export interface CoherenceReading {
  // Inputs (preserved for transparency).
  primalPrimary: PrimalQuestion | null;
  primalConfidence: PrimalCluster["confidence"];
  actualGoalScore: number;
  actualSoulScore: number;
  expectedGoalRange: { min: number; max: number } | null;
  expectedSoulRange: { min: number; max: number } | null;
  // Derived.
  goalGap: number;
  soulGap: number;
  totalGap: number;
  pathClass: PathClass;
  crisisFlavor: CrisisFlavor | null;
  // Transparency.
  rationale: string;
  appliedOverride: boolean;
  primalConfidenceTooLow: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Per-Primal expected Goal/Soul profile (the calibration surface).
// ─────────────────────────────────────────────────────────────────────
//
// Ranges are starting heuristics. Tighten/loosen here as cohort data
// accumulates. Every PrimalQuestion MUST have an entry — the audit
// enforces completeness.

export const PRIMAL_EXPECTED_PROFILE: Record<
  PrimalQuestion,
  PrimalExpectedProfile
> = {
  "Am I safe?": {
    primary: "Am I safe?",
    goalRange: { min: 25, max: 100 },
    soulRange: { min: 25, max: 100 },
    // Defensive baseline — only flag when both axes show extreme
    // withdrawal (movement collapse).
    concernRule: { kind: "both-axes", goalGapMin: 5, soulGapMin: 5 },
    crisisFlavorWhenInverted: "withdrawal",
    crisisFlavorOverride: (goal, soul) => {
      // Withdrawal flavor only fires when both axes are below 20.
      if (goal < 20 && soul < 20) return "withdrawal";
      return null;
    },
  },
  "Am I secure?": {
    primary: "Am I secure?",
    goalRange: { min: 40, max: 100 },
    soulRange: { min: 20, max: 100 },
    // Stewardship — concerning when Goal is far below the line; Soul is
    // not the load-bearing axis here.
    concernRule: { kind: "additive", threshold: 10 },
    crisisFlavorWhenInverted: "longing-without-build",
  },
  "Am I loved?": {
    primary: "Am I loved?",
    goalRange: { min: 15, max: 100 },
    soulRange: { min: 40, max: 100 },
    // Tenderness — concerning when Soul is far below the line.
    concernRule: { kind: "additive", threshold: 10 },
    crisisFlavorWhenInverted: "grasp-without-substance",
  },
  "Am I wanted?": {
    primary: "Am I wanted?",
    goalRange: { min: 15, max: 100 },
    soulRange: { min: 35, max: 100 },
    // Outward-Soul (room-shaped). Soul-axis primary; flag on Soul gap.
    concernRule: { kind: "additive", threshold: 10 },
    crisisFlavorWhenInverted: "grasp-without-substance",
  },
  "Am I successful?": {
    primary: "Am I successful?",
    goalRange: { min: 55, max: 100 },
    soulRange: { min: 15, max: 100 },
    // Strongly Goal-leaning. Jason's "ouch" case: high success-grip
    // with low Goal score is the longing-without-build pattern.
    // CC-PRIMAL-COHERENCE-EXTENSION — threshold tuned 15 → 12 so
    // gsg/07-true-gripping (Goal 42, Soul 17, totalGap=13) tips to
    // crisis. The Am-I-successful? Goal floor is the highest in the
    // table (55), so even moderate gaps below the floor justify a
    // crisis read.
    concernRule: { kind: "additive", threshold: 12 },
    crisisFlavorWhenInverted: "longing-without-build",
  },
  "Am I good enough?": {
    primary: "Am I good enough?",
    goalRange: { min: 40, max: 100 },
    soulRange: { min: 25, max: 100 },
    // Craft requires both axes — concerning only when BOTH are low.
    concernRule: { kind: "both-axes", goalGapMin: 10, soulGapMin: 5 },
    crisisFlavorWhenInverted: "paralysis",
  },
  "Do I have purpose?": {
    primary: "Do I have purpose?",
    goalRange: { min: 35, max: 100 },
    soulRange: { min: 35, max: 100 },
    // Purpose integrates work and giving — concerning only when both
    // are below the line.
    concernRule: { kind: "both-axes", goalGapMin: 5, soulGapMin: 5 },
    crisisFlavorWhenInverted: "paralysis",
    crisisFlavorOverride: (goal, soul) => {
      // Restless-without-anchor flavor when both axes are below 30 —
      // the reinvention loop register.
      if (goal < 30 && soul < 30) return "restless-without-anchor";
      return null;
    },
  },
};

// ─────────────────────────────────────────────────────────────────────
// computePrimalCoherence
// ─────────────────────────────────────────────────────────────────────

function classifyConcern(
  rule: ConcernRule,
  goalGap: number,
  soulGap: number
): boolean {
  if (rule.kind === "additive") {
    return goalGap + soulGap >= rule.threshold;
  }
  // both-axes
  return goalGap >= rule.goalGapMin && soulGap >= rule.soulGapMin;
}

// CC-PRIMAL-COHERENCE-EXTENSION — Goal-pinned/Soul-collapsed override.
// Fires BEFORE the standard concern-rule path so high-Goal/low-Soul
// shapes don't fall through to trajectory classification.
//
// Trigger conditions (all must hold):
//   - confidence ≠ "low" (don't flag on thin Primal signal)
//   - primary ∈ {Am I good enough?, Am I successful?}
//   - goalScore ≥ 80
//   - soulScore ≤ 20
function checkWorkingWithoutPresence(
  primalCluster: PrimalCluster,
  goalScore: number,
  soulScore: number
): { fires: boolean; rationale: string } {
  if (primalCluster.confidence === "low") {
    return { fires: false, rationale: "" };
  }
  if (
    primalCluster.primary !== "Am I good enough?" &&
    primalCluster.primary !== "Am I successful?"
  ) {
    return { fires: false, rationale: "" };
  }
  if (goalScore < 80) return { fires: false, rationale: "" };
  if (soulScore > 20) return { fires: false, rationale: "" };
  return {
    fires: true,
    rationale: `Goal score ${goalScore} pinned at maximum (≥80) with Soul score ${soulScore} collapsed (≤20). Work-line is doing maximum work; relational/soul-line has collapsed under the work. The grip ("${primalCluster.primary}") is being answered with maximum output, yet the question is still firing — diagnostic signature that output is the wrong answer.`,
  };
}

export function computePrimalCoherence(
  primalCluster: PrimalCluster,
  goalScore: number,
  soulScore: number
): CoherenceReading {
  const primary = primalCluster.primary;
  const confidence = primalCluster.confidence;

  // Confidence gate — low confidence (or null primary) defaults to
  // trajectory. Conservative: better to under-flag crisis than over-flag.
  if (!primary || confidence === "low") {
    return {
      primalPrimary: primary,
      primalConfidence: confidence,
      actualGoalScore: goalScore,
      actualSoulScore: soulScore,
      expectedGoalRange: null,
      expectedSoulRange: null,
      goalGap: 0,
      soulGap: 0,
      totalGap: 0,
      pathClass: "trajectory",
      crisisFlavor: null,
      rationale: !primary
        ? "No primary Primal Question identified — coherence read defaults to trajectory."
        : "Low-confidence Primal cluster — coherence read defaults to trajectory.",
      appliedOverride: false,
      primalConfidenceTooLow: true,
    };
  }

  const profile = PRIMAL_EXPECTED_PROFILE[primary];

  // CC-PRIMAL-COHERENCE-EXTENSION — Goal-pinned/Soul-collapsed override.
  // Fires BEFORE the standard concern-rule path. Standard gap math
  // doesn't apply here (Goal is over the floor), so we synthesize the
  // reading directly.
  const wwp = checkWorkingWithoutPresence(primalCluster, goalScore, soulScore);
  if (wwp.fires) {
    return {
      primalPrimary: primary,
      primalConfidence: confidence,
      actualGoalScore: goalScore,
      actualSoulScore: soulScore,
      expectedGoalRange: profile.goalRange,
      expectedSoulRange: profile.soulRange,
      goalGap: 0,
      soulGap: Math.max(0, profile.soulRange.min - soulScore),
      totalGap: 0,
      pathClass: "crisis",
      crisisFlavor: "working-without-presence",
      rationale: wwp.rationale,
      appliedOverride: true,
      primalConfidenceTooLow: false,
    };
  }

  const goalGap = Math.max(0, profile.goalRange.min - goalScore);
  const soulGap = Math.max(0, profile.soulRange.min - soulScore);
  const totalGap = goalGap + soulGap;

  const isCrisis = classifyConcern(profile.concernRule, goalGap, soulGap);

  if (!isCrisis) {
    const ruleDescription =
      profile.concernRule.kind === "additive"
        ? `additive threshold ${profile.concernRule.threshold} not met (totalGap=${totalGap})`
        : `both-axes thresholds not met (goalGap=${goalGap} < ${profile.concernRule.goalGapMin} or soulGap=${soulGap} < ${profile.concernRule.soulGapMin})`;
    return {
      primalPrimary: primary,
      primalConfidence: confidence,
      actualGoalScore: goalScore,
      actualSoulScore: soulScore,
      expectedGoalRange: profile.goalRange,
      expectedSoulRange: profile.soulRange,
      goalGap,
      soulGap,
      totalGap,
      pathClass: "trajectory",
      crisisFlavor: null,
      rationale: `Primal "${primary}" coheres with current Goal/Soul shape — ${ruleDescription}.`,
      appliedOverride: false,
      primalConfidenceTooLow: false,
    };
  }

  // Crisis path — derive flavor.
  const overrideFlavor = profile.crisisFlavorOverride?.(goalScore, soulScore);
  const crisisFlavor: CrisisFlavor =
    overrideFlavor ?? profile.crisisFlavorWhenInverted;
  const appliedOverride = overrideFlavor !== null && overrideFlavor !== undefined;

  const confidenceNote =
    confidence === "medium"
      ? " (medium-confidence Primal — register hint: tentative)"
      : "";

  const ruleDescription =
    profile.concernRule.kind === "additive"
      ? `totalGap=${totalGap} ≥ threshold ${profile.concernRule.threshold}`
      : `goalGap=${goalGap} ≥ ${profile.concernRule.goalGapMin} AND soulGap=${soulGap} ≥ ${profile.concernRule.soulGapMin}`;

  return {
    primalPrimary: primary,
    primalConfidence: confidence,
    actualGoalScore: goalScore,
    actualSoulScore: soulScore,
    expectedGoalRange: profile.goalRange,
    expectedSoulRange: profile.soulRange,
    goalGap,
    soulGap,
    totalGap,
    pathClass: "crisis",
    crisisFlavor,
    rationale: `Primal "${primary}" inverts against current Goal/Soul shape: ${ruleDescription}. Flavor: ${crisisFlavor}${appliedOverride ? " (override)" : ""}${confidenceNote}.`,
    appliedOverride,
    primalConfidenceTooLow: false,
  };
}
