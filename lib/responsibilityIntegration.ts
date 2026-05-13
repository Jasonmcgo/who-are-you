// CC-AIM-REBUILD-MOVEMENT-LIMITER — Segment 1.3.
//
// ResponsibilityIntegration: stakes-bearing without defensive collapse.
// Rewards users who carry meaningful stakes AND haven't collapsed into
// defensive grip AND maintain non-trivial forward motion.
//
// Formula:
//   score = 100 × (stakesLoad/100) × (1 - defensiveGrip/100) × max(0.3, movement/100)
//
// The movement floor (0.3) prevents paralyzed-but-stakes-bearing users
// from scoring artificially high; some forward motion is required to
// count as "integrated responsibility."
//
// Pure data — no API calls, no SDK, no `node:*` imports.

export interface ResponsibilityIntegrationInputs {
  stakesLoad: number;
  defensiveGrip: number;
  movementStrength: number;
}

export interface ResponsibilityIntegrationReading {
  score: number;
  rationale: string;
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

const MOVEMENT_FLOOR = 0.3;

export function computeResponsibilityIntegration(
  inputs: ResponsibilityIntegrationInputs
): ResponsibilityIntegrationReading {
  const stakesEngagement = clamp(inputs.stakesLoad, 0, 100) / 100;
  const defensiveCollapse = clamp(inputs.defensiveGrip, 0, 100) / 100;
  const movement = clamp(inputs.movementStrength, 0, 100) / 100;
  const movementFactor = Math.max(MOVEMENT_FLOOR, movement);
  const raw =
    100 * stakesEngagement * (1 - defensiveCollapse) * movementFactor;
  const score = Math.round(clamp(raw, 0, 100) * 10) / 10;
  return {
    score,
    rationale: `ResponsibilityIntegration = 100 × ${stakesEngagement.toFixed(2)} (stakes) × ${(1 - defensiveCollapse).toFixed(2)} (1-defensive) × ${movementFactor.toFixed(2)} (movement, floor ${MOVEMENT_FLOOR}) = ${score.toFixed(1)}.`,
  };
}
