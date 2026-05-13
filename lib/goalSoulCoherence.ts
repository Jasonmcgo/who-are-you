// CC-AIM-REBUILD-MOVEMENT-LIMITER — Segment 1.2.
//
// GoalSoulCoherence measures closeness to the 50° integration band
// (42-58° per canon §2). Score = 100 inside the band, decays at 3
// points per degree outside.
//
// Per canon §2 band classification:
//   0-30°  → low-arc
//   30-42° → productive-under-integrated
//   42-58° → integration
//   58-70° → soul-heavy
//   70-90° → vertical-longing
//
// Pure data — no API calls, no SDK, no `node:*` imports.

export type GoalSoulCoherenceBand =
  | "low-arc"
  | "productive-under-integrated"
  | "integration"
  | "soul-heavy"
  | "vertical-longing";

export interface GoalSoulCoherenceInputs {
  /** Movement angle in degrees, 0-90. */
  angleDegrees: number;
}

export interface GoalSoulCoherenceReading {
  score: number;
  band: GoalSoulCoherenceBand;
  bandDescription: string;
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

export const GOAL_SOUL_COHERENCE_DECAY = 3; // score points per degree outside band
const HALF_BAND_WIDTH = 8; // 42-58 → ±8 around 50
const INTEGRATION_CENTER = 50;

const BAND_DESCRIPTIONS: Record<GoalSoulCoherenceBand, string> = {
  "low-arc":
    "Trajectory pulls strongly toward goal-output without yet integrating soul-line care.",
  "productive-under-integrated":
    "Productive trajectory; integration band still ahead. Soul-line is registering but not yet woven through.",
  integration:
    "Inside the 50° integration band — goal and soul axes are pulling together.",
  "soul-heavy":
    "Trajectory leans Soul over Goal — the relational line carries the read more than the work-line.",
  "vertical-longing":
    "Trajectory pulls toward soul/relational longing with thin goal-line counterweight.",
};

function classifyBand(angle: number): GoalSoulCoherenceBand {
  if (angle < 30) return "low-arc";
  if (angle < 42) return "productive-under-integrated";
  if (angle <= 58) return "integration";
  if (angle <= 70) return "soul-heavy";
  return "vertical-longing";
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// ─────────────────────────────────────────────────────────────────────
// Public function
// ─────────────────────────────────────────────────────────────────────

export function computeGoalSoulCoherence(
  inputs: GoalSoulCoherenceInputs
): GoalSoulCoherenceReading {
  const angle = clamp(inputs.angleDegrees, 0, 90);
  const distanceFromBand = Math.max(
    0,
    Math.abs(angle - INTEGRATION_CENTER) - HALF_BAND_WIDTH
  );
  const score =
    Math.round(
      clamp(100 - GOAL_SOUL_COHERENCE_DECAY * distanceFromBand, 0, 100) * 10
    ) / 10;
  const band = classifyBand(angle);
  return {
    score,
    band,
    bandDescription: BAND_DESCRIPTIONS[band],
    rationale: `angle=${angle.toFixed(1)}° → band=${band}; distance from 42-58 band = ${distanceFromBand.toFixed(1)}°; score = 100 - ${GOAL_SOUL_COHERENCE_DECAY}×${distanceFromBand.toFixed(1)} = ${score.toFixed(1)}.`,
  };
}
