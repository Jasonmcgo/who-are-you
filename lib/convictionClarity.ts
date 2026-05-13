// CC-AIM-REBUILD-MOVEMENT-LIMITER — Segment 1.1.
//
// ConvictionClarity is a continuous 0-100 conviction score derived from
// rich signal: Q-P1 / Q-P2 / Q-V1 ranks + BeliefUnderTension fallback +
// a light Conscientiousness lift. Replaces the 4-level temperature
// mapping for the new Aim formula.
//
// Per Phase 2 canon (docs/canon/trajectory-model-refinement.md §12):
// the legacy ComplianceStrength weighted conviction at 30% from the
// 4-level BeliefUnderTension.conviction_temperature, which defaulted
// Jason's fixture to 50 ("unknown" temperature). ConvictionClarity
// reads richer signal so Jason's high Q-P1/Q-P2 fire even when the
// belief-tension layer reads "unknown."
//
// Pure data — no API calls, no SDK, no `node:*` imports.

import type { ConvictionTemperature } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export interface ConvictionClarityInputs {
  /** Q-P1 — high_conviction_expression signal present. */
  highConvictionExpression: boolean;
  /** Q-P2 — high_conviction_under_risk signal present. */
  highConvictionUnderRisk: boolean;
  /** Q-I1 substantive freeform OR conviction_under_cost signal. */
  convictionUnderCost: boolean;
  /** Q-V1 ranks (1-indexed). null when not in Q-V1 or absent. */
  vulnerabilityOpenUncertaintyRank: number | null;
  sacredBeliefConnectionRank: number | null;
  performanceIdentityRank: number | null;
  goalLogicExplanationRank: number | null;
  /** BeliefUnderTension fallback when direct signals are thin. */
  beliefUnderTensionTemperature: ConvictionTemperature | null;
  /** OCEAN Conscientiousness, 0-100. null when absent. */
  conscientiousness: number | null;
}

export interface ConvictionClarityComponents {
  p1_p2_signal: number;
  qv1_positive: number;
  qv1_penalty: number;
  belief_tension_fallback: number;
  conscientiousness_lift: number;
}

export interface ConvictionClarityReading {
  score: number;
  components: ConvictionClarityComponents;
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function rankPositive(rank: number | null, top1: number, top2: number): number {
  if (rank === 1) return top1;
  if (rank === 2) return top2;
  return 0;
}

const BELIEF_TENSION_SCORE: Record<ConvictionTemperature, number> = {
  high: 20,
  moderate: 12,
  low: 5,
  unknown: 0,
};

// ─────────────────────────────────────────────────────────────────────
// Public function
// ─────────────────────────────────────────────────────────────────────

export function computeConvictionClarity(
  inputs: ConvictionClarityInputs
): ConvictionClarityReading {
  const p1_p2_signal =
    (inputs.highConvictionExpression ? 20 : 0) +
    (inputs.highConvictionUnderRisk ? 20 : 0);

  const qv1_positive_raw =
    rankPositive(inputs.vulnerabilityOpenUncertaintyRank, 15, 8) +
    rankPositive(inputs.sacredBeliefConnectionRank, 10, 5);
  const qv1_positive = clamp(qv1_positive_raw, 0, 30);

  const qv1_penalty_raw =
    rankPositive(inputs.performanceIdentityRank, 8, 4) +
    rankPositive(inputs.goalLogicExplanationRank, 5, 2);
  const qv1_penalty = clamp(qv1_penalty_raw, 0, 15);

  // Belief-tension fallback only fires when direct signal is thin.
  const directSignal = p1_p2_signal + qv1_positive;
  const belief_tension_fallback =
    directSignal < 20 && inputs.beliefUnderTensionTemperature
      ? BELIEF_TENSION_SCORE[inputs.beliefUnderTensionTemperature]
      : 0;

  // Conscientiousness lift fires only above C=70.
  const c = inputs.conscientiousness ?? 50;
  const conscientiousness_lift = clamp(((c - 70) / 30) * 10, 0, 10);

  const raw =
    p1_p2_signal +
    qv1_positive -
    qv1_penalty +
    belief_tension_fallback +
    conscientiousness_lift;
  const score = Math.round(clamp(raw, 0, 100) * 10) / 10;

  const components: ConvictionClarityComponents = {
    p1_p2_signal,
    qv1_positive,
    qv1_penalty,
    belief_tension_fallback,
    conscientiousness_lift,
  };

  // Mark convictionUnderCost as consumed (currently lit-only for future
  // weighting work — not yet a numeric contributor; reserved for V2).
  void inputs.convictionUnderCost;

  const rationale =
    `ConvictionClarity = ${p1_p2_signal} (Q-P1/Q-P2) + ${qv1_positive.toFixed(0)} (Q-V1+) - ${qv1_penalty.toFixed(0)} (Q-V1 penalty) + ${belief_tension_fallback} (belief-tension fallback) + ${conscientiousness_lift.toFixed(1)} (C lift) = ${score.toFixed(1)}.`;

  return { score, components, rationale };
}
