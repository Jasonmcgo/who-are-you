// CC-GRIP-TAXONOMY — engine-side Primal cluster derivation.
// CC-GRIP-CALIBRATION — extended with shape-aware calibration pass.
//
// Maps the engine's named-grips (`grippingPull.signals[].humanReadable`)
// onto the 7 Primal Questions taxonomy:
//
//   - Am I safe?            (gift: wisdom)
//   - Am I secure?          (gift: stewardship)
//   - Am I loved?           (gift: tenderness)
//   - Am I wanted?          (gift: belonging)
//   - Am I successful?      (gift: excellence)
//   - Am I good enough?     (gift: humility, craft)
//   - Do I have purpose?    (gift: mission)
//
// The primal question is not bad. The grip is what happens when the
// question starts driving.
//
// CC-GRIP-CALIBRATION reframes the deterministic floor table as a clue,
// not a conclusion. Two Clarence canon anchors:
//
//   1. "A named grip is not a conclusion. It is a clue."
//   2. "The grip is not what the person names. The grip is what the
//       named pressure becomes inside that person's shape."
//
// Pure derivation — no new measurement, no signal-pool changes. Inputs
// are existing engine outputs (named grips, Lens stack, Compass top,
// Risk Form, OCEAN, Movement, vulnerability). Client-bundle-safe (no
// `node:*`, no SDK).

import type {
  AppliedCalibrationRule,
  CalibrationContext,
  DistortedStrategyTemplate,
  PrimalSubRegister,
} from "./gripCalibration";
import { calibratePrimalCluster } from "./gripCalibration";

export type PrimalQuestion =
  | "Am I safe?"
  | "Am I secure?"
  | "Am I loved?"
  | "Am I wanted?"
  | "Am I successful?"
  | "Am I good enough?"
  | "Do I have purpose?";

// CC-GRIP-CALIBRATION — four-level confidence ladder. Replaces the
// pre-CC binary high|low. `medium-high` and `medium` give the renderer
// a hedged-prose path without forcing complete omission.
export type PrimalConfidence = "high" | "medium-high" | "medium" | "low";

// CC-GRIP-CALIBRATION — prose mode the renderer reads. Derived from
// confidence + hedge marker.
export type PrimalProseMode = "rendered" | "hedged" | "omitted";

export interface PrimalCluster {
  primary: PrimalQuestion | null;
  secondary?: PrimalQuestion;
  // CC-GRIP-CALIBRATION addition — names the next-strongest primal when
  // the cluster carries three live channels (e.g., Jason's case where
  // good-enough wins but successful and secure both register).
  tertiary?: PrimalQuestion;
  confidence: PrimalConfidence;
  contributingGrips: string[];
  giftRegister: string;
  // CC-GRIP-CALIBRATION — alias for `giftRegister` keyed to the rubric
  // vocabulary ("Healthy Gift"). Same value; named field for the
  // three-concept render.
  healthyGift: string;
  // CC-GRIP-TAXONOMY — debug-only score map. Each Primal category and
  // its weighted score from the named-grip mapping. Useful for the
  // audit's confidence-rules check + for diagnostic transparency in the
  // rendered Grip section.
  scores: Record<PrimalQuestion, number>;
  // CC-GRIP-CALIBRATION transparency fields ─────────────────────────
  baseScores: Record<PrimalQuestion, number>;
  calibrationDeltas: Record<PrimalQuestion, number>;
  appliedRules: AppliedCalibrationRule[];
  subRegister: PrimalSubRegister;
  distortedStrategy: DistortedStrategyTemplate | null;
  surfaceGrip: string;
  proseMode: PrimalProseMode;
}

export const PRIMAL_GIFT_REGISTER: Record<PrimalQuestion, string> = {
  "Am I safe?": "wisdom",
  "Am I secure?": "stewardship",
  "Am I loved?": "tenderness",
  "Am I wanted?": "belonging",
  "Am I successful?": "excellence",
  "Am I good enough?": "humility, craft",
  "Do I have purpose?": "mission",
};

// ── Mapping table ───────────────────────────────────────────────────
//
// Every named-grip humanReadable string the engine emits is mapped to
// a primary Primal Question (and optional secondary). The strings here
// are the EXACT humanReadable values produced by `lib/goalSoulGive.ts`
// when grippingPull fires. Audit asserts every emitted string maps.
//
// Some entries (formation/diagnostic signals) are intentionally
// unmapped — they're environmental context, not Primal grips. Those
// are listed in NON_PRIMAL_NAMED_GRIPS so the audit's coverage check
// distinguishes "missing mapping" from "intentionally non-Primal".

export const NAMED_GRIP_TO_PRIMAL: Record<
  string,
  { primary: PrimalQuestion; secondary?: PrimalQuestion }
> = {
  // Q-GRIP1 direct grip-target signals (the load-bearing list).
  "Grips control under pressure": {
    primary: "Am I safe?",
    secondary: "Am I secure?",
  },
  "Grips money / security under pressure": {
    primary: "Am I secure?",
  },
  "Grips reputation under pressure": {
    primary: "Am I successful?",
    secondary: "Am I good enough?",
  },
  "Grips being right under pressure": {
    primary: "Am I good enough?",
    secondary: "Am I successful?",
  },
  "Grips being needed under pressure": {
    primary: "Am I loved?",
    secondary: "Am I wanted?",
  },
  "Grips comfort or escape under pressure": {
    primary: "Am I safe?",
  },
  "Grips a plan that used to work under pressure": {
    primary: "Am I secure?",
  },
  "Grips approval of specific people under pressure": {
    primary: "Am I wanted?",
    secondary: "Am I loved?",
  },
  // Q-Stakes1-derived signals.
  "Money/wealth stakes elevated": {
    primary: "Am I secure?",
  },
  "Job/career stakes elevated": {
    primary: "Am I successful?",
    secondary: "Am I secure?",
  },
  "Reputation stakes elevated": {
    primary: "Am I successful?",
    secondary: "Am I good enough?",
  },
  // Pressure-adaptation signals.
  "Conviction concealment under pressure": {
    primary: "Am I wanted?",
    secondary: "Am I loved?",
  },
  "Pressure adaptation under economic stress": {
    primary: "Am I secure?",
  },
  "Pressure adaptation under social stress": {
    primary: "Am I wanted?",
  },
  // Capability / performance register signals (Q-V1 / Q-Ambition1).
  "Proving-capability register active": {
    primary: "Am I good enough?",
    secondary: "Am I successful?",
  },
  "Proving-capability register present": {
    primary: "Am I good enough?",
    secondary: "Am I successful?",
  },
  "Performance-identity register active": {
    primary: "Am I successful?",
    secondary: "Am I good enough?",
  },
  "Performance-identity register present": {
    primary: "Am I successful?",
    secondary: "Am I good enough?",
  },
};

// Named-grips that are explicitly NOT mapped to a Primal Question —
// they're environmental context (formation), diagnostic (thin signal),
// or scope-of-measurement notes, not pressure-driven grips.
export const NON_PRIMAL_NAMED_GRIPS: ReadonlySet<string> = new Set([
  "Formation in chaotic conditions",
  "Limited openness signal",
  "Thin love-line evidence",
]);

// ── Derivation function ─────────────────────────────────────────────

const ALL_PRIMALS: PrimalQuestion[] = [
  "Am I safe?",
  "Am I secure?",
  "Am I loved?",
  "Am I wanted?",
  "Am I successful?",
  "Am I good enough?",
  "Do I have purpose?",
];

function emptyScores(): Record<PrimalQuestion, number> {
  const out: Partial<Record<PrimalQuestion, number>> = {};
  for (const p of ALL_PRIMALS) out[p] = 0;
  return out as Record<PrimalQuestion, number>;
}

function deriveProseMode(
  confidence: PrimalConfidence,
  primary: PrimalQuestion | null
): PrimalProseMode {
  if (!primary) return "omitted";
  if (confidence === "high" || confidence === "medium-high") return "rendered";
  if (confidence === "medium") return "hedged";
  return "omitted";
}

// CC-GRIP-CALIBRATION — accepts an optional CalibrationContext. When
// omitted the function falls back to the pre-calibration deterministic
// floor (used by tests / harness paths that don't have full shape data
// available); the engine's runtime always passes a full context.
export function derivePrimalCluster(
  namedGrips: string[],
  ctx?: CalibrationContext
): PrimalCluster {
  const baseScores = emptyScores();
  const contributing: string[] = [];

  for (const grip of namedGrips) {
    if (NON_PRIMAL_NAMED_GRIPS.has(grip)) continue;
    const mapping = NAMED_GRIP_TO_PRIMAL[grip];
    if (!mapping) continue; // unmapped — audit catches via mapping-coverage check
    baseScores[mapping.primary] += 1.0;
    if (mapping.secondary) baseScores[mapping.secondary] += 0.5;
    contributing.push(grip);
  }

  // Run calibration. If no context was provided, calibrate against an
  // empty context so the rule pipeline is idempotent (no rules fire).
  const calibrationCtx: CalibrationContext = ctx ?? {
    contributingGrips: contributing,
    lensDominant: "ni",
    lensAuxiliary: "te",
    topCompass: [],
    riskFormLetter: null,
    oceanAgreeableness: null,
    oceanConscientiousness: null,
    goalScore: null,
    soulScore: null,
    vulnerability: null,
  };
  const calibration = calibratePrimalCluster(baseScores, calibrationCtx);

  // Sort categories by final score (desc). Ranks are computed off the
  // calibrated finalScores so the chosen primary reflects the shape-
  // aware route, not the raw floor.
  const ranked = ALL_PRIMALS
    .map((p) => ({ primal: p, score: calibration.finalScores[p] }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  // Zero-grip user — no signals to cluster.
  if (ranked.length === 0) {
    const empty: PrimalCluster = {
      primary: null,
      confidence: "low",
      contributingGrips: [],
      giftRegister: "",
      healthyGift: "",
      scores: calibration.finalScores,
      baseScores: calibration.baseScores,
      calibrationDeltas: calibration.deltas,
      appliedRules: calibration.appliedRules,
      subRegister: calibration.subRegister,
      distortedStrategy: calibration.distortedStrategy,
      surfaceGrip: calibration.surfaceGrip,
      proseMode: "omitted",
    };
    return empty;
  }

  const top = ranked[0];
  const second = ranked[1];
  const third = ranked[2];

  // Confidence ladder (CC-GRIP-CALIBRATION):
  //   high        — gap ≥ 1.5x AND ≥3 contributing grips AND no hedge marker
  //   medium-high — gap ≥ 1.2x AND ≥2 contributing grips
  //   medium      — primary present but borderline OR single-signal
  //   low         — ambiguous (within 0.2 abs)
  let confidence: PrimalConfidence;
  let secondary: PrimalQuestion | undefined;
  let tertiary: PrimalQuestion | undefined;
  if (!second) {
    // Only one primal scored above zero.
    confidence = calibration.hedgeMarker ? "medium" : "medium-high";
  } else {
    const gap = top.score - second.score;
    const ratio = second.score === 0 ? Infinity : top.score / second.score;
    if (ratio < 1.2 && gap < 0.2) {
      confidence = "low";
    } else if (ratio < 1.2) {
      confidence = "medium";
      secondary = second.primal;
    } else if (ratio < 1.5 || contributing.length < 3) {
      confidence = "medium-high";
      secondary = second.primal;
    } else {
      confidence = "high";
      // Surface secondary only when it's still meaningfully present.
      if (ratio < 2.0) secondary = second.primal;
    }
    if (calibration.hedgeMarker && confidence === "high") {
      confidence = "medium-high";
    } else if (calibration.hedgeMarker && confidence === "medium-high") {
      confidence = "medium";
    }
  }
  if (third && third.score > 0 && (confidence === "high" || confidence === "medium-high")) {
    tertiary = third.primal;
  }

  const proseMode = deriveProseMode(confidence, top.primal);

  return {
    primary: top.primal,
    secondary,
    tertiary,
    confidence,
    contributingGrips: contributing,
    giftRegister: PRIMAL_GIFT_REGISTER[top.primal],
    healthyGift: PRIMAL_GIFT_REGISTER[top.primal],
    scores: calibration.finalScores,
    baseScores: calibration.baseScores,
    calibrationDeltas: calibration.deltas,
    appliedRules: calibration.appliedRules,
    subRegister: calibration.subRegister,
    distortedStrategy: calibration.distortedStrategy,
    surfaceGrip: calibration.surfaceGrip,
    proseMode,
  };
}
