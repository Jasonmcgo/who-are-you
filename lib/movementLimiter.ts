// CC-AIM-REBUILD-MOVEMENT-LIMITER — Segment 4.
//
// The Movement Limiter composes three derived modifiers on top of the
// raw goalSoulMovement vector length:
//
//   - Tolerance Cone (canon §6) — Aim determines the ± degrees of
//     direction certainty.
//   - Grip Drag (canon §7) — Grip drags movement down by up to 45%.
//   - Aim Governor (canon §8) — high Aim slightly governs raw motion
//     (max 15% reduction).
//
// Composite: usableMovement = potential × gripDragModifier × aimGovernorModifier.
//
// Canon line: "Grip is waste. Aim is cost."
// A car's brakes (grip-drag — reactive) ≠ a flat tire (aim-governor —
// the cost of moving with care).
//
// Pure data — no API calls, no SDK, no `node:*` imports.

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

export const MAX_GRIP_DRAG = 0.45;
export const MAX_AIM_GOVERNOR = 0.15;

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// ─────────────────────────────────────────────────────────────────────
// Individual modifiers
// ─────────────────────────────────────────────────────────────────────

/**
 * Tolerance cone in degrees. High-Aim users have a narrow directional
 * certainty cone; low-Aim users have a wide one (the read is more
 * tentative).
 *
 * Per canon §6 — CC-CHART-LABEL-LEGIBILITY-AND-TOLERANCE-SMOOTHING
 * smoothed to 6 bands with uniform +3° per-band steps (was 5 bands
 * with mixed +3°/+5° steps creating a visible 50% boundary jump at
 * Aim 55). Total range narrowed slightly (3°-18° vs 4°-20°): high
 * Aim looks more precise, low Aim no longer dominates the chart.
 *
 *   aim ≥ 85 → 3°
 *   aim ≥ 70 → 6°
 *   aim ≥ 55 → 9°
 *   aim ≥ 45 → 12°
 *   aim ≥ 35 → 15°
 *   else      → 18°
 */
export function computeToleranceDegrees(aim: number): number {
  const a = clamp(aim, 0, 100);
  if (a >= 85) return 3;
  if (a >= 70) return 6;
  if (a >= 55) return 9;
  if (a >= 45) return 12;
  if (a >= 35) return 15;
  return 18;
}

/**
 * Grip drag — multiplicative reduction of usable movement. Max 45%
 * reduction at Grip 100.
 */
export function computeGripDragModifier(grip: number): number {
  return 1 - (clamp(grip, 0, 100) / 100) * MAX_GRIP_DRAG;
}

/**
 * Aim governor — multiplicative reduction representing the cost of
 * moving with care. Max 15% reduction at Aim 100. Higher Aim = slightly
 * slower motion but more accurate direction.
 */
export function computeAimGovernorModifier(aim: number): number {
  return 1 - (clamp(aim, 0, 100) / 100) * MAX_AIM_GOVERNOR;
}

// ─────────────────────────────────────────────────────────────────────
// Composite reading
// ─────────────────────────────────────────────────────────────────────

export interface UsableMovementInputs {
  potentialMovement: number; // 0-100, from goalSoulMovement.movementStrength.length
  grip: number;              // 0-100, canonical (gripFromDefensive)
  aim: number;               // 0-100, from new Aim formula
}

export interface UsableMovementReading {
  potentialMovement: number;
  gripDragModifier: number;
  aimGovernorModifier: number;
  usableMovement: number;
  toleranceDegrees: number;
  /** CC-MOMENTUM-HONESTY — Usable-anchored descriptor. Reserved for
   *  render-layer headline. The legacy Potential-anchored descriptor on
   *  `dashboard.movementStrength.descriptor` stays unchanged for cache
   *  hash stability. */
  usableDescriptor:
    | "short"
    | "moderate"
    | "long"
    | "high"
    | "high, well-governed";
  /** CC-MOMENTUM-HONESTY — drag percentage (Potential→Usable). */
  dragPercent: number;
  rationale: string;
}

export function computeUsableMovement(
  inputs: UsableMovementInputs
): UsableMovementReading {
  const potential = clamp(inputs.potentialMovement, 0, 100);
  const grip = clamp(inputs.grip, 0, 100);
  const aim = clamp(inputs.aim, 0, 100);

  const gripDragModifier = computeGripDragModifier(grip);
  const aimGovernorModifier = computeAimGovernorModifier(aim);
  const usableMovement =
    Math.round(potential * gripDragModifier * aimGovernorModifier * 10) / 10;
  const toleranceDegrees = computeToleranceDegrees(aim);
  const dragPercent =
    potential > 0
      ? Math.round((1 - usableMovement / potential) * 100)
      : 0;

  // CC-MOMENTUM-HONESTY — Usable-anchored descriptor.
  let usableDescriptor:
    | "short"
    | "moderate"
    | "long"
    | "high"
    | "high, well-governed";
  if (usableMovement < 30) usableDescriptor = "short";
  else if (usableMovement < 50) usableDescriptor = "moderate";
  else if (usableMovement < 65) usableDescriptor = "long";
  else if (usableMovement < 80) usableDescriptor = "high";
  else if (aim >= 60 && grip <= 30) usableDescriptor = "high, well-governed";
  else usableDescriptor = "high";

  return {
    potentialMovement: Math.round(potential * 10) / 10,
    gripDragModifier: Math.round(gripDragModifier * 1000) / 1000,
    aimGovernorModifier: Math.round(aimGovernorModifier * 1000) / 1000,
    usableMovement,
    toleranceDegrees,
    usableDescriptor,
    dragPercent,
    rationale: `usable = potential ${potential.toFixed(1)} × gripDrag ${gripDragModifier.toFixed(3)} (Grip ${grip.toFixed(1)}) × aimGovernor ${aimGovernorModifier.toFixed(3)} (Aim ${aim.toFixed(1)}) = ${usableMovement.toFixed(1)} (${usableDescriptor}, ${dragPercent}% drag); tolerance ±${toleranceDegrees}°.`,
  };
}
