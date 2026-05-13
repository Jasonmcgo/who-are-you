// CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT — Foundation Phase 1.
// CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT — §11 semantic reframing.
//
// 3C Strengths are independent 0-100 substance scores for the three
// trajectory components, distinct from the existing 100%-summing 3C Mix
// (which is preserved verbatim). Per Jason + Clarence canon
// (docs/canon/trajectory-model-refinement.md §10–11):
//
//   Cost       — work, effort, output, craft, building, responsibility
//                — Goal-axis substance
//   Coverage   — love, care, presence, mercy, family, belovedness
//                — Soul-axis substance
//   Compliance — wise risk, discernment, governance, restraint, and
//                trajectory calibration — NOT timid rule-following.
//                The §11 forward-facing name is `wiseRisk`; the
//                `compliance` field name is preserved as a backward-
//                compat alias and always carries the same value.
//
// Substrate-alignment principle: CostStrength shares signal substrate
// with Goal score; CoverageStrength with Soul score; ComplianceStrength
// is a fresh derivation drawing on conviction temperature, OCEAN
// Conscientiousness, and the Mix.compliance bucket.
//
// Implementation choice (Option A from the CC prompt): direct coupling
// for Cost/Coverage to Goal/Soul scores. This is the tightest coupling
// possible and is easiest to validate. ComplianceStrength is composed
// fresh from existing signals.
//
// Pure data — no API calls, no SDK, no `node:*` imports.

import type {
  ConvictionTemperature,
  DriveDistribution,
  DriveStrengths,
  OceanIntensities,
} from "./types";

// ─────────────────────────────────────────────────────────────────────
// Calibration constants
// ─────────────────────────────────────────────────────────────────────

export const COMPLIANCE_STRENGTH_WEIGHTS = {
  conscientiousness: 0.40, // discipline backbone
  conviction: 0.30, // governed conviction (held-belief register)
  driveMixCompliance: 0.30, // emphasis on compliance behavior in Drive Mix
} as const;

const CONVICTION_TEMP_TO_SCORE: Record<ConvictionTemperature, number> = {
  high: 80,
  moderate: 50,
  low: 25,
  unknown: 50,
};

function clamp01(v: number, max = 100): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > max) return max;
  return v;
}

// ─────────────────────────────────────────────────────────────────────
// Public functions
// ─────────────────────────────────────────────────────────────────────

/**
 * CostStrength — Goal-axis substance.
 *
 * Option A direct coupling: identical to the goal score (clamped). The
 * coupling is justified by the canon (§11): Cost ≡ Goal-axis substance.
 * Audit asserts |costStrength - goalScore| ≤ 5 across cohort; identity
 * obviously satisfies that.
 */
export function computeCostStrength(goalScore: number): number {
  return clamp01(goalScore);
}

/**
 * CoverageStrength — Soul-axis substance.
 *
 * Option A direct coupling: identical to the soul score (clamped).
 */
export function computeCoverageStrength(soulScore: number): number {
  return clamp01(soulScore);
}

/**
 * ComplianceStrength — wise-risk / governance / discernment substance.
 *
 * Composed fresh from:
 *   - OCEAN Conscientiousness (discipline / restraint backbone)
 *   - Conviction temperature (high → governed conviction)
 *   - Drive Mix.compliance (existing compliance bucket emphasis)
 *
 * The result is a 0-100 score where high = strong wise-risk substance
 * (governed, discerning, restrained without rigid) and low = thin
 * wise-risk substance (impulsive or chaotic).
 *
 * Calibration target: Jason fixture (C=94, conviction=high≈80,
 * driveMix.compliance=22) should land at roughly 60+, which gives
 * Phase 2's Aim formula room to land him at canonical Wisdom-governed.
 *
 *   ComplianceStrength = 94*0.40 + 80*0.30 + 22*0.30 = 67.6
 */
export function computeComplianceStrength(inputs: {
  conscientiousness: number | null;
  convictionTemperature: ConvictionTemperature | null;
  driveMixCompliance: number;
}): number {
  const c = clamp01(inputs.conscientiousness ?? 50);
  const conv = inputs.convictionTemperature
    ? CONVICTION_TEMP_TO_SCORE[inputs.convictionTemperature]
    : 50;
  const mix = clamp01(inputs.driveMixCompliance);
  const w = COMPLIANCE_STRENGTH_WEIGHTS;
  const raw =
    c * w.conscientiousness + conv * w.conviction + mix * w.driveMixCompliance;
  return Math.round(clamp01(raw) * 10) / 10;
}

/**
 * computeDriveStrengths — convenience wrapper that computes all three.
 *
 * Caller supplies Goal/Soul scores (already computed by goalSoulGive),
 * the existing Drive Mix.compliance bucket, conviction temperature,
 * and OCEAN intensities. Returns a fully populated DriveStrengths.
 */
export function computeDriveStrengths(inputs: {
  goalScore: number;
  soulScore: number;
  driveMixCompliance: number;
  convictionTemperature: ConvictionTemperature | null;
  oceanIntensities: OceanIntensities | null;
}): DriveStrengths {
  const compliance = computeComplianceStrength({
    conscientiousness: inputs.oceanIntensities?.conscientiousness ?? null,
    convictionTemperature: inputs.convictionTemperature,
    driveMixCompliance: inputs.driveMixCompliance,
  });
  return {
    cost: computeCostStrength(inputs.goalScore),
    coverage: computeCoverageStrength(inputs.soulScore),
    compliance,
    // CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT §11 — `wiseRisk` is the
    // canonical forward-facing name. Always === compliance.
    wiseRisk: compliance,
  };
}

/**
 * Compatibility helper — exposed for tests.
 */
export function driveDistributionToMixCompliance(
  distribution: DriveDistribution
): number {
  return distribution.compliance;
}
