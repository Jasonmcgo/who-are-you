// CC-AIM-CALIBRATION — Aim as first-class composite score.
// CC-AIM-REBUILD-MOVEMENT-LIMITER — Phase 2: rebuilt 5-component
// composition on Phase 1's Strength substrate. Legacy 4-component
// formula preserved as `computeAimScoreLegacy` for cohort comparison.
//
// Aim is positive, forward-focused, governed risk-orientation. The
// willingness to move toward something costly because it's worth it.
//
// Phase 2 composition (canon §12):
//   Aim = WiseRiskStrength       × 0.40   (Phase 1 ComplianceStrength)
//       + ConvictionClarity      × 0.20   (Segment 1.1)
//       + GoalSoulCoherence      × 0.20   (Segment 1.2)
//       + MovementStrength       × 0.10
//       + ResponsibilityIntegration × 0.10 (Segment 1.3)
//
// Pure data — no API calls, no SDK, no `node:*` imports.

import type { ConvictionTemperature } from "./types";

// ─────────────────────────────────────────────────────────────────────
// New weights (Phase 2 canonical)
// ─────────────────────────────────────────────────────────────────────

export const AIM_WEIGHTS = {
  wiseRiskStrength: 0.40,
  convictionClarity: 0.20,
  goalSoulCoherence: 0.20,
  movementStrength: 0.10,
  responsibilityIntegration: 0.10,
} as const;

// ─────────────────────────────────────────────────────────────────────
// Legacy weights (preserved for cohort comparison; Phase 1 of the
// trajectory model refinement used these weights against the Drive Mix
// substrate. The new formula above uses Strength substrate directly.)
// ─────────────────────────────────────────────────────────────────────

export const AIM_WEIGHTS_LEGACY = {
  compliance: 0.30,
  cost: 0.30,
  conviction: 0.20,
  movementStrength: 0.20,
} as const;

// ─────────────────────────────────────────────────────────────────────
// Conviction temperature → 0-100 mapping (used by legacy formula AND
// by the new ConvictionClarity module as fallback when direct signals
// are thin).
// ─────────────────────────────────────────────────────────────────────

export const CONVICTION_TEMP_TO_SCORE: Record<ConvictionTemperature, number> = {
  high: 80,
  moderate: 50,
  low: 25,
  unknown: 50,
};

export function convictionScoreFromTemperature(
  temp: ConvictionTemperature | null | undefined
): number {
  if (!temp) return 50;
  return CONVICTION_TEMP_TO_SCORE[temp];
}

// ─────────────────────────────────────────────────────────────────────
// New types (Phase 2)
// ─────────────────────────────────────────────────────────────────────

export interface AimScoreInputs {
  /** From Phase 1 drive.strengths.compliance — wise-risk substrate, 0-100. */
  wiseRiskStrength: number;
  /** From Segment 1.1 ConvictionClarityReading.score, 0-100. */
  convictionClarity: number;
  /** From Segment 1.2 GoalSoulCoherenceReading.score, 0-100. */
  goalSoulCoherence: number;
  /** From goalSoulMovement.dashboard.movementStrength.length, 0-100. */
  movementStrength: number;
  /** From Segment 1.3 ResponsibilityIntegrationReading.score, 0-100. */
  responsibilityIntegration: number;
  /**
   * CC-101-VO-WIRING Phase 1 — Victim/Owner score (0-100; 100 = full
   * owner-anchored). Optional for backward-compat: pre-CC-100 saved
   * sessions and any caller that doesn't pass it gets the pre-V/O
   * Aim score verbatim. When provided, owner-side (score > 50)
   * receives a gradient boost (max +15 at score=100). Victim-side
   * (score < 50) contributes zero to Aim — victim weight is wired
   * into Grip + Movement (Phases 2/3), not Aim.
   */
  victimOwnerScore?: number;
}

export interface AimComponents {
  wiseRiskStrength: number;
  convictionClarity: number;
  goalSoulCoherence: number;
  movementStrength: number;
  responsibilityIntegration: number;
}

export interface AimReading {
  score: number;
  components: AimComponents;
  weights: typeof AIM_WEIGHTS;
  rationale: string;
  /**
   * CC-101-VO-WIRING Phase 1 — Aim baseline before owner-boost
   * application. `score` carries the post-boost value (canonical for
   * downstream consumers). Optional/undefined when no V/O score was
   * threaded (backward-compat).
   */
  scoreBeforeVictimOwner?: number;
  /**
   * CC-101-VO-WIRING Phase 1 — additive contribution from V/O owner-
   * register. 0 when V/O undefined or score ≤ 50; max +15 at
   * owner-anchored score=100.
   */
  victimOwnerBoost?: number;
}

// ─────────────────────────────────────────────────────────────────────
// Legacy types (preserved for cohort comparison)
// ─────────────────────────────────────────────────────────────────────

export interface AimScoreInputsLegacy {
  complianceBucket: number;
  costBucket: number;
  convictionScore: number;
  movementStrength: number;
}

export interface AimReadingLegacy {
  score: number;
  components: {
    compliance: number;
    cost: number;
    conviction: number;
    movementStrength: number;
  };
  weights: typeof AIM_WEIGHTS_LEGACY;
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function clamp01(v: number, max = 100): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > max) return max;
  return v;
}

// ─────────────────────────────────────────────────────────────────────
// computeAimScore — Phase 2 canonical
// ─────────────────────────────────────────────────────────────────────

// CC-101-VO-WIRING Phase 1 — max owner-side Aim boost. Per
// feedback_victim_owner_axis_gsag.md: owner-anchored shapes receive
// a strong Aim contribution. Gradient-weighted from 0 (balanced
// score=50) to +15 (owner-anchored score=100). Victim-side
// contributes 0 to Aim — victim weight wires into Grip + Movement
// (CC-101 Phases 2/3), not Aim.
export const VICTIM_OWNER_AIM_BOOST_MAX = 15;

export function computeAimScore(inputs: AimScoreInputs): AimReading {
  const wrs = clamp01(inputs.wiseRiskStrength);
  const cc = clamp01(inputs.convictionClarity);
  const gsc = clamp01(inputs.goalSoulCoherence);
  const ms = clamp01(inputs.movementStrength);
  const ri = clamp01(inputs.responsibilityIntegration);

  const weighted =
    wrs * AIM_WEIGHTS.wiseRiskStrength +
    cc * AIM_WEIGHTS.convictionClarity +
    gsc * AIM_WEIGHTS.goalSoulCoherence +
    ms * AIM_WEIGHTS.movementStrength +
    ri * AIM_WEIGHTS.responsibilityIntegration;
  const baseScore = Math.round(weighted * 10) / 10;

  // CC-101-VO-WIRING Phase 1 — owner-boost. Backward-compat: when no
  // V/O score is threaded, victimOwnerBoost is 0 and Aim is the base
  // score verbatim. Pre-V/O callers, legacy fixtures, and sessions
  // that haven't re-rendered all keep their original Aim numbers.
  const vo = inputs.victimOwnerScore;
  const ownerBoost =
    typeof vo === "number" && vo > 50
      ? ((vo - 50) / 50) * VICTIM_OWNER_AIM_BOOST_MAX
      : 0;
  const score = Math.round(Math.min(100, baseScore + ownerBoost) * 10) / 10;

  const components: AimComponents = {
    wiseRiskStrength: wrs,
    convictionClarity: cc,
    goalSoulCoherence: gsc,
    movementStrength: ms,
    responsibilityIntegration: ri,
  };

  const rationale =
    `Aim = ${wrs.toFixed(1)}×${AIM_WEIGHTS.wiseRiskStrength} (wise-risk) ` +
    `+ ${cc.toFixed(1)}×${AIM_WEIGHTS.convictionClarity} (conviction) ` +
    `+ ${gsc.toFixed(1)}×${AIM_WEIGHTS.goalSoulCoherence} (G/S coherence) ` +
    `+ ${ms.toFixed(1)}×${AIM_WEIGHTS.movementStrength} (movement) ` +
    `+ ${ri.toFixed(1)}×${AIM_WEIGHTS.responsibilityIntegration} (responsibility) ` +
    `= ${baseScore.toFixed(1)}` +
    (ownerBoost > 0
      ? ` + ${ownerBoost.toFixed(1)} (V/O owner-boost, score=${vo}) = ${score.toFixed(1)}.`
      : `.`);

  return {
    score,
    components,
    weights: AIM_WEIGHTS,
    rationale,
    scoreBeforeVictimOwner: baseScore,
    victimOwnerBoost: ownerBoost,
  };
}

// ─────────────────────────────────────────────────────────────────────
// computeAimScoreLegacy — preserved for cohort comparison
// ─────────────────────────────────────────────────────────────────────

export function computeAimScoreLegacy(
  inputs: AimScoreInputsLegacy
): AimReadingLegacy {
  const compliance = clamp01(inputs.complianceBucket);
  const cost = clamp01(inputs.costBucket);
  const conviction = clamp01(inputs.convictionScore);
  const movementStrength = clamp01(inputs.movementStrength);

  const weighted =
    compliance * AIM_WEIGHTS_LEGACY.compliance +
    cost * AIM_WEIGHTS_LEGACY.cost +
    conviction * AIM_WEIGHTS_LEGACY.conviction +
    movementStrength * AIM_WEIGHTS_LEGACY.movementStrength;
  const score = Math.round(weighted * 10) / 10;

  return {
    score,
    components: { compliance, cost, conviction, movementStrength },
    weights: AIM_WEIGHTS_LEGACY,
    rationale:
      `[Legacy] Aim = ${compliance.toFixed(0)}×${AIM_WEIGHTS_LEGACY.compliance} (compliance) ` +
      `+ ${cost.toFixed(0)}×${AIM_WEIGHTS_LEGACY.cost} (cost) ` +
      `+ ${conviction.toFixed(0)}×${AIM_WEIGHTS_LEGACY.conviction} (conviction) ` +
      `+ ${movementStrength.toFixed(0)}×${AIM_WEIGHTS_LEGACY.movementStrength} (movement) ` +
      `= ${score.toFixed(1)}.`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// LLM register-hint anchor block (preserved unchanged — Phase 3 will
// update the per-quadrant register hints as labels evolve).
// ─────────────────────────────────────────────────────────────────────

export const AIM_REGISTER_ANCHOR_BLOCK = `# Aim register (anchor — adjusts trajectory-class register)

The user's report includes an Aim composite score (0-100) and a Risk Form letter derived from Aim × Grip.

- HIGH AIM (>=60) + LOW GRIP (<40): Wisdom-governed register. The user is moving with internal governance. Frame as "the governor that aims movement rather than prevents it."
- HIGH AIM (>=60) + HIGH GRIP (>=40): Reckless-fearful register. The user is driven AND gripping — chaotic motion. Frame as "engaged but not at peace; the engine is running, the brakes are also on."
- LOW AIM (<60) + HIGH GRIP (>=40): Grip-governed (FUD) register. Fear is driving more than direction. Frame as "movement constrained by what's gripping rather than aimed by what's worth pursuing."
- LOW AIM (<60) + LOW GRIP (<40): Free movement / Drift register. The user is moving without strong governance. Frame as "motion appears unimpeded, but without strong governance, calibration may be a future asking."

These registers compose with the path-class register (trajectory vs crisis) and the developmental band register. Crisis-class users do not consume Aim register hints (the trajectory framework doesn't apply).`;
