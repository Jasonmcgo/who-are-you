// CC-SYNTHESIS-1A Addition 1 — Risk Form 2x2 classifier.
// CC-PHASE-3A-LABEL-LOGIC — labels refined per canon §14:
//   Wisdom-governed   → "Open-Handed Aim"
//   Reckless-fearful  → "White-Knuckled Aim"
//   Grip-governed     → "Grip-Governed" (capitalization formalized)
//   Free movement     → "Ungoverned Movement"
//
// The legacy four-letter union is preserved as `legacyLetter` on every
// reading so transitional prose can render either form. Phase 3b will
// migrate prose templates and drop the legacy aliases.
//
// Per Jason canon (project_synthesis_layer_collapse): "Risk is not Grip.
// Risk becomes Grip when the governor starts preventing movement instead
// of aiming it." This classifier operationalizes that distinction.
//
// Pure derivation — no new measurement, no signal-pool changes, no
// engine math changes. Inputs are existing engine outputs:
//   - drive.distribution.compliance (legacy classifier only)
//   - aimReading.score (Aim-based classifier)
//   - movement.dashboard.grippingPull.score (legacy additive Grip)
//
// Thresholds are exposed as constants so cohort feedback can tune
// without touching the classifier logic.

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export type RiskFormLetter =
  | "Open-Handed Aim"
  | "White-Knuckled Aim"
  | "Grip-Governed"
  | "Ungoverned Movement";

// Legacy label aliases — used by transitional prose templates and by
// the audit's `legacyLetter` mapping.
export const LEGACY_RISK_FORM_LABEL: Record<RiskFormLetter, string> = {
  "Open-Handed Aim": "Wisdom-governed",
  "White-Knuckled Aim": "Reckless-fearful",
  "Grip-Governed": "Grip-governed",
  "Ungoverned Movement": "Free movement",
};

export interface RiskFormReading {
  letter: RiskFormLetter;
  /** CC-PHASE-3A-LABEL-LOGIC — legacy label string for transitional prose. */
  legacyLetter: string;
  /** Aim score that produced this reading. Phase 3a renames from
   *  `riskBucketPct` (which was Phase 2's overload of the field). */
  aimScore: number;
  gripScore: number;
  prose: string;
  /** Kept for backward-compat with existing render code that reads
   *  `riskBucketPct`. Phase 3b can drop after render migration. */
  riskBucketPct: number;
}

// ─────────────────────────────────────────────────────────────────────
// Thresholds
// ─────────────────────────────────────────────────────────────────────

// CC-SYNTHESIS-1A — risk-bucket "high enough to function as a governor".
// Legacy classifier only.
//
// CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT §10 note — the canonical
// classifier is `computeRiskFormFromAim` (Aim + Grip substrate), which
// does NOT consume Drive Mix. This legacy `computeRiskForm` is retained
// only for cohort comparison and continues to read the Drive Mix
// `compliance` (emphasis %) substrate so the synthesis3 cohort cache
// hash key (`constitution.riskForm.legacyLetter`) stays byte-stable.
// Strength-substrate interpretive math lives in workMap/loveMap lean
// classifiers and in the canonical Aim formula.
export const RISK_FORM_HIGH_BUCKET = 30;

// CC-SYNTHESIS-1A — grip "starts dominating the chart" at 40.
export const RISK_FORM_HIGH_GRIP = 40;

// CC-AIM-CALIBRATION — Aim composite threshold. Phase 3a preserves at 60
// pending cohort calibration review (per CC's "Recommendation: Hold the
// 60 threshold for V1").
export const RISK_FORM_HIGH_AIM = 60;

// ─────────────────────────────────────────────────────────────────────
// PROSE map — written against the NEW canonical labels. Includes the
// legacy label parenthetically for the transitional window so existing
// readers see continuity.
// ─────────────────────────────────────────────────────────────────────

const PROSE: Record<RiskFormLetter, string> = {
  "Open-Handed Aim":
    "Your Risk Form reads as Open-Handed Aim (formerly Wisdom-governed): Aim is present, Grip is moderate. The governor appears to aim movement rather than prevent it.",
  "White-Knuckled Aim":
    "Your Risk Form reads as White-Knuckled Aim (formerly Reckless-fearful): Aim is present, but Grip has activated alongside it. The engine is running and the brakes are also on — engaged but not at peace.",
  "Grip-Governed":
    "Your Risk Form reads as Grip-Governed: Aim is thin, Grip is high. Movement is constrained by what's gripping rather than aimed by what's worth pursuing.",
  "Ungoverned Movement":
    "Your Risk Form reads as Ungoverned Movement (formerly Free movement): Aim is thin, Grip is thin. Motion appears unimpeded — but without strong governance, calibration may be a future asking.",
};

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function readingFor(
  letter: RiskFormLetter,
  aimScore: number,
  gripScore: number
): RiskFormReading {
  return {
    letter,
    legacyLetter: LEGACY_RISK_FORM_LABEL[letter],
    aimScore,
    gripScore,
    prose: PROSE[letter],
    riskBucketPct: aimScore, // backward-compat
  };
}

// ─────────────────────────────────────────────────────────────────────
// Legacy classifier (compliance-bucket axis) — preserved for audit
// comparison. Emits the NEW labels but uses the LEGACY classifier
// inputs (compliance bucket %).
// ─────────────────────────────────────────────────────────────────────

export function computeRiskForm(
  driveDistribution: { cost: number; coverage: number; compliance: number },
  grippingPullScore: number
): RiskFormReading {
  // Legacy classifier — reads Drive Mix .compliance (emphasis %).
  // See module header note re: hash stability vs canonical substrate.
  const riskBucketPct = driveDistribution.compliance;
  const gripScore = grippingPullScore;
  const highBucket = riskBucketPct >= RISK_FORM_HIGH_BUCKET;
  const highGrip = gripScore >= RISK_FORM_HIGH_GRIP;

  let letter: RiskFormLetter;
  if (highBucket && !highGrip) letter = "Open-Handed Aim";
  else if (highBucket && highGrip) letter = "Grip-Governed";
  else if (!highBucket && !highGrip) letter = "Ungoverned Movement";
  else letter = "White-Knuckled Aim";

  const reading = readingFor(letter, riskBucketPct, gripScore);
  reading.riskBucketPct = riskBucketPct;
  return reading;
}

// ─────────────────────────────────────────────────────────────────────
// Canonical Aim-based classifier (Phase 2 + Phase 3a)
// ─────────────────────────────────────────────────────────────────────

export function computeRiskFormFromAim(
  aimScore: number,
  grippingPullScore: number
): RiskFormReading {
  const highAim = aimScore >= RISK_FORM_HIGH_AIM;
  const highGrip = grippingPullScore >= RISK_FORM_HIGH_GRIP;

  let letter: RiskFormLetter;
  if (highAim && !highGrip) letter = "Open-Handed Aim";
  else if (highAim && highGrip) letter = "White-Knuckled Aim";
  else if (!highAim && highGrip) letter = "Grip-Governed";
  else letter = "Ungoverned Movement";

  return readingFor(letter, aimScore, grippingPullScore);
}
