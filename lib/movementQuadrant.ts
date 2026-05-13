// CC-SYNTHESIS-1A Addition 2 — Four-Quadrant Movement chart rename.
// CC-PHASE-3A-LABEL-LOGIC — band-gated "Giving / Presence" + new
// Goal-led Presence / Soul-led Presence labels per canon §3.
// CC-MOMENTUM-HONESTY — Grip-aware label gating so high-Grip users at
// the integration angle don't get a label that contradicts their
// Risk Form. Five new labels (Strained Integration / Driven Output /
// Burdened Care / Pressed Output / Anxious Caring) reconcile the
// engine's two registers (observable axes vs. defensive register).
//
// The (Goal, Soul) plane produces 12 possible labels:
//   Drift                  — low Goal + low Soul, no grip cluster
//   Gripping               — low Goal + low Soul, grip cluster fires
//   Work without Presence  — high Goal + low Soul, grip below threshold
//   Pressed Output         — high Goal + low Soul, grip above threshold
//   Love without Form      — low Goal + high Soul, grip below threshold
//   Anxious Caring         — low Goal + high Soul, grip above threshold
//   Giving / Presence      — high both + angle in 42-58° band + grip below
//   Strained Integration   — high both + angle in 42-58° band + grip above
//   Goal-led Presence      — high both + angle <42° + grip below
//   Driven Output          — high both + angle <42° + grip above
//   Soul-led Presence      — high both + angle >58° + grip below
//   Burdened Care          — high both + angle >58° + grip above
//
// Grip is read from `dash.grippingPull.score` (the legacy/displayed
// Grip) — same input used by riskFormFromAim. HIGH_GRIP_THRESHOLD = 35
// chosen against cohort review; calibration knob exposed for future
// retunes.
//
// Pure derivation — no new measurement, no signal-pool changes.

export type MovementQuadrantLabel =
  | "Drift"
  | "Gripping"
  | "Work without Presence"
  | "Pressed Output"
  | "Love without Form"
  | "Anxious Caring"
  | "Giving / Presence"
  | "Strained Integration"
  | "Goal-led Presence"
  | "Driven Output"
  | "Soul-led Presence"
  | "Burdened Care";

// CC-PHASE-3A-LABEL-LOGIC — legacy label aliases for transitional prose.
// CC-MOMENTUM-HONESTY — five new defensive-register labels collapse to
// their non-defensive Phase 3a counterparts so prose templates that
// reference legacy labels continue to render meaningfully and the cache
// hash inputs stay byte-stable.
export const LEGACY_QUADRANT_LABEL: Partial<
  Record<MovementQuadrantLabel, string>
> = {
  "Goal-led Presence": "Giving / Presence",
  "Soul-led Presence": "Giving / Presence",
  "Strained Integration": "Giving / Presence",
  "Driven Output": "Giving / Presence",
  "Burdened Care": "Giving / Presence",
  "Pressed Output": "Work without Presence",
  "Anxious Caring": "Love without Form",
  // Pre-CC-PHASE-3A the low-both-axes case always emitted "Drift" — no
  // "Gripping" label existed. Map back for cache-hash stability.
  Gripping: "Drift",
};

export interface MovementQuadrantReading {
  label: MovementQuadrantLabel;
  /** CC-PHASE-3A-LABEL-LOGIC — legacy collapse for transitional prose. */
  legacyLabel: string;
  goal: number;
  soul: number;
  angle: number;
  gripClusterFires: boolean;
  /** CC-MOMENTUM-HONESTY — defensive-register signal that drove gating. */
  gripScore: number;
  rationale: string;
}

// CC-SYNTHESIS-1A — natural midpoint of the 0-100 axis.
export const MOVEMENT_QUADRANT_HIGH_THRESHOLD = 50;

// CC-PHASE-3A-LABEL-LOGIC — integration band per canon §2 / §3.
export const INTEGRATION_BAND_MIN = 42;
export const INTEGRATION_BAND_MAX = 58;

// CC-MOMENTUM-HONESTY — Grip threshold that flips a quadrant label to
// its defensive-register variant. 35 chosen against cohort review:
// users at Grip 21 (Jason) read as below-threshold; users at Grip 46
// (Cindy-shape) read as above-threshold. See audit
// `grip-threshold-calibration-reported` for distribution at 30/35/40.
export const HIGH_GRIP_THRESHOLD = 35;

export interface MovementQuadrantInputs {
  adjustedGoal: number;
  adjustedSoul: number;
  /** CC-PHASE-3A-LABEL-LOGIC — angle in degrees (0-90), for band gating. */
  angleDegrees: number;
  /** CC-PHASE-3A-LABEL-LOGIC — feeds the low-Goal/low-Soul split
   *  between Drift and Gripping. */
  gripClusterFires: boolean;
  /** CC-MOMENTUM-HONESTY — legacy/displayed Grip (0-100). Used to gate
   *  defensive-register label variants. Defaults to 0 if omitted (which
   *  preserves Phase-3a behavior for legacy callers). */
  gripScore?: number;
}

export function computeMovementQuadrant(
  inputs: MovementQuadrantInputs
): MovementQuadrantReading {
  const {
    adjustedGoal: goal,
    adjustedSoul: soul,
    angleDegrees: angle,
    gripClusterFires,
    gripScore = 0,
  } = inputs;
  const highGoal = goal >= MOVEMENT_QUADRANT_HIGH_THRESHOLD;
  const highSoul = soul >= MOVEMENT_QUADRANT_HIGH_THRESHOLD;
  const inBand =
    angle >= INTEGRATION_BAND_MIN && angle <= INTEGRATION_BAND_MAX;
  const highGrip = gripScore >= HIGH_GRIP_THRESHOLD;

  let label: MovementQuadrantLabel;
  if (highGoal && highSoul) {
    if (inBand) {
      label = highGrip ? "Strained Integration" : "Giving / Presence";
    } else if (angle < INTEGRATION_BAND_MIN) {
      label = highGrip ? "Driven Output" : "Goal-led Presence";
    } else {
      label = highGrip ? "Burdened Care" : "Soul-led Presence";
    }
  } else if (highGoal && !highSoul) {
    label = highGrip ? "Pressed Output" : "Work without Presence";
  } else if (!highGoal && highSoul) {
    label = highGrip ? "Anxious Caring" : "Love without Form";
  } else {
    // Low-both is unchanged — the existing Gripping/Drift split already
    // reflects defensive register.
    label = gripClusterFires ? "Gripping" : "Drift";
  }

  const legacyLabel = LEGACY_QUADRANT_LABEL[label] ?? label;

  const rationale =
    `Goal=${goal.toFixed(1)} (high=${highGoal}), Soul=${soul.toFixed(1)} (high=${highSoul}), ` +
    `angle=${angle.toFixed(1)}° (inBand=${inBand}), grip=${gripScore.toFixed(1)} (high=${highGrip}), ` +
    `gripCluster=${gripClusterFires} → ${label}` +
    `${legacyLabel !== label ? ` (legacy: ${legacyLabel})` : ""}.`;

  return {
    label,
    legacyLabel,
    goal,
    soul,
    angle,
    gripClusterFires,
    gripScore,
    rationale,
  };
}
