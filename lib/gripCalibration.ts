// CC-GRIP-CALIBRATION — shape-aware calibration over the deterministic
// Primal cluster floor.
//
// CC-GRIP-TAXONOMY shipped a deterministic NAMED_GRIP_TO_PRIMAL table.
// That table did the math correctly but was the architectural error: a
// Knowledge-protector + thinking-driver who answers Q-GRIP1 with
// "control / money/security / being right" should land on
// mastery / craft (Am I good enough? / Am I successful?), not on
// safety / foundation (Am I secure?).
//
// This calibration pass adds a second deterministic layer on top of the
// floor: 12 rules R1–R12 read the rest of the shape (Lens dominant,
// Lens auxiliary, top Compass, Risk Form, Goal/Soul, OCEAN, vulnerability)
// and emit per-primal score deltas + sub-register routing. The sum of
// deltas plus the floor scores produces the final cluster.
//
// Pure derivation — no new measurement, no signal-pool changes, no API
// call. Client-bundle-safe (no `node:*`, no SDK).
//
// Two Clarence canon anchors govern the design:
//   1. "A named grip is not a conclusion. It is a clue."
//   2. "The grip is not what the person names. The grip is what the
//       named pressure becomes inside that person's shape."

import type { PrimalQuestion } from "./gripTaxonomy";
import type { CognitiveFunctionId } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export type PrimalSubRegister =
  | "mastery"      // craft, technical sufficiency, Knowledge-protector route
  | "stewardship"  // foundation, money-as-care, Stability-protector route
  | "relational"   // belonging, attunement, Fe / high-A route
  | "performance"  // visible achievement, Goal-leaning route
  | "discernment"  // wisdom, threat-reading, defensive-but-governed route
  | "mission"      // purpose, calling
  | null;

export interface DistortedStrategyTemplate {
  text: string;              // ≤ 120 chars; second-person, behavioral
  triggerNote?: string;      // optional rationale for the audit trail
}

export interface AppliedCalibrationRule {
  id: string;                // R1 ... R12
  rationale: string;         // short human-readable
  deltas: Partial<Record<PrimalQuestion, number>>;
  subRegisterCandidate?: PrimalSubRegister;
  hedgeMarker?: boolean;     // R12 only
}

export interface CalibrationContext {
  contributingGrips: string[];
  // Lens
  lensDominant: CognitiveFunctionId;
  lensAuxiliary: CognitiveFunctionId;
  // Top Compass labels (sorted strongest-first; e.g., ["Knowledge","Truth","Honor","Peace"])
  topCompass: string[];
  // Risk Form letter (CC-SYNTHESIS-1A; CC-PHASE-3A-LABEL-LOGIC renames)
  // — null for thin-signal sessions. The CC-GRIP-CALIBRATION rules
  // R6/R7 read this letter, so the union now mirrors the new
  // `RiskFormLetter` from `lib/riskForm.ts`.
  riskFormLetter:
    | "Open-Handed Aim"
    | "White-Knuckled Aim"
    | "Grip-Governed"
    | "Ungoverned Movement"
    | null;
  // OCEAN intensities (CC-072), 0-100. null when OCEAN derivation absent.
  oceanAgreeableness: number | null;
  oceanConscientiousness: number | null;
  // Movement scores (CC-070), 0-100. null when goalSoulMovement absent.
  goalScore: number | null;
  soulScore: number | null;
  // Engine-internal vulnerability (CC-071), -50..+50. null when absent.
  vulnerability: number | null;
}

export interface CalibrationOutput {
  baseScores: Record<PrimalQuestion, number>;
  finalScores: Record<PrimalQuestion, number>;
  deltas: Record<PrimalQuestion, number>;
  appliedRules: AppliedCalibrationRule[];
  subRegister: PrimalSubRegister;
  distortedStrategy: DistortedStrategyTemplate | null;
  hedgeMarker: boolean;
  surfaceGrip: string;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const ALL_PRIMALS: PrimalQuestion[] = [
  "Am I safe?",
  "Am I secure?",
  "Am I loved?",
  "Am I wanted?",
  "Am I successful?",
  "Am I good enough?",
  "Do I have purpose?",
];

const KNOWLEDGE_PROTECTOR_VALUES = new Set([
  "Knowledge",
  "Truth",
  "Wisdom",
  "Honor",
]);

const STABILITY_PROTECTOR_VALUES = new Set([
  "Stability",
  "Family",
  "Order",
]);

function isKnowledgeProtector(topCompass: string[]): boolean {
  return topCompass
    .slice(0, 4)
    .some((v) => KNOWLEDGE_PROTECTOR_VALUES.has(v));
}

function isStabilityProtector(topCompass: string[]): boolean {
  return topCompass
    .slice(0, 4)
    .some((v) => STABILITY_PROTECTOR_VALUES.has(v));
}

function isThinkingDriver(
  dom: CognitiveFunctionId,
  aux: CognitiveFunctionId
): boolean {
  // Lens leans on a thinking function — either as the dominant or the
  // immediate instrument. Ni-Te / Ti-* / Te-* / Ni-Ti all qualify.
  return [dom, aux].some((f) => f === "ti" || f === "te");
}

// ─────────────────────────────────────────────────────────────────────
// Distorted-strategy table
// ─────────────────────────────────────────────────────────────────────
//
// Keyed by `${primary}::${subRegister}`. Each line ≤120 chars. Second-
// person. Names what the grip looks like when it's actually driving —
// not therapy, not flattery, behaviorally specific.

const DISTORTED_STRATEGY_TABLE: Record<string, DistortedStrategyTemplate> = {
  "Am I safe?::discernment": {
    text:
      "You may shrink the field of action to keep yourself outside reach of what could harm what you protect.",
  },
  "Am I safe?::mastery": {
    text:
      "You may rebuild every system from first principles because trusting an inherited form feels exposed.",
  },
  "Am I secure?::stewardship": {
    text:
      "You may over-plan and over-defend because the people you carry must not feel the foundation shake.",
  },
  "Am I secure?::mastery": {
    text:
      "You may translate every uncertainty into a system because trusting unstructured outcomes feels reckless.",
  },
  "Am I loved?::relational": {
    text:
      "You may keep extending care that wasn't asked for because withdrawing it feels like losing the thread.",
  },
  "Am I wanted?::relational": {
    text:
      "You may edit yourself for the room because being out of step feels like losing your place in it.",
  },
  "Am I successful?::performance": {
    text:
      "You may chase the next visible outcome because pausing makes the part of you that runs on motion feel exposed.",
  },
  "Am I successful?::mastery": {
    text:
      "You may set the bar where ordinary excellence cannot reach because anything less feels like coasting.",
  },
  "Am I good enough?::mastery": {
    text:
      "You may keep refining the architecture because a merely plausible answer feels morally lazy.",
  },
  "Am I good enough?::relational": {
    text:
      "You may carry small failures privately because exposing them risks the standing the work earned you.",
  },
  "Am I good enough?::performance": {
    text:
      "You may treat every output as proof because the question of sufficiency hasn't been answered yet.",
  },
  "Do I have purpose?::mission": {
    text:
      "You may treat every project as load-bearing for meaning because slack time feels like drift.",
  },
};

// Fallback when no specific (primal, sub-register) entry exists.
const FALLBACK_STRATEGY: Record<PrimalQuestion, DistortedStrategyTemplate> = {
  "Am I safe?": {
    text:
      "You may narrow your field of action to stay clear of what could harm the people or work you protect.",
  },
  "Am I secure?": {
    text:
      "You may over-plan and over-stockpile because the foundations under what you carry must not slip.",
  },
  "Am I loved?": {
    text:
      "You may absorb what others should carry because letting it sit feels like losing connection.",
  },
  "Am I wanted?": {
    text:
      "You may shape yourself toward the room's signal because being plainly visible feels too costly.",
  },
  "Am I successful?": {
    text:
      "You may keep moving toward the next visible win because the pause itself reads as losing.",
  },
  "Am I good enough?": {
    text:
      "You may keep proving the work is sound because the question of sufficiency hasn't yet rested.",
  },
  "Do I have purpose?": {
    text:
      "You may make every effort load-bearing for meaning because untethered time reads as drift.",
  },
};

// Sub-register precedence — higher value wins when multiple rules fire.
// Mastery and relational override stewardship; performance / discernment /
// mission are softer markers.
const SUB_REGISTER_PRECEDENCE: Record<NonNullable<PrimalSubRegister>, number> = {
  mastery: 5,
  relational: 5,
  stewardship: 4,
  performance: 3,
  discernment: 2,
  mission: 2,
};

// ─────────────────────────────────────────────────────────────────────
// The 12 calibration rules
// ─────────────────────────────────────────────────────────────────────

type Rule = {
  id: string;
  apply(ctx: CalibrationContext): AppliedCalibrationRule | null;
};

function hasGrip(ctx: CalibrationContext, grip: string): boolean {
  return ctx.contributingGrips.includes(grip);
}

const RULES: Rule[] = [
  // R1 — Mastery override on control (Knowledge-protector + thinking-driver)
  {
    id: "R1",
    apply(ctx) {
      if (!hasGrip(ctx, "Grips control under pressure")) return null;
      if (!isKnowledgeProtector(ctx.topCompass)) return null;
      if (!isThinkingDriver(ctx.lensDominant, ctx.lensAuxiliary)) return null;
      return {
        id: "R1",
        rationale:
          "Control + Knowledge-protector + thinking-driver routes to mastery, not safety.",
        deltas: {
          "Am I safe?": -1.0,
          "Am I secure?": -0.3,
          "Am I good enough?": 0.8,
          "Am I successful?": 0.5,
        },
        subRegisterCandidate: "mastery",
      };
    },
  },
  // R2 — Stewardship confirmation on money/security (Stability-protector)
  {
    id: "R2",
    apply(ctx) {
      if (!hasGrip(ctx, "Grips money / security under pressure")) return null;
      if (!isStabilityProtector(ctx.topCompass)) return null;
      return {
        id: "R2",
        rationale:
          "Money/security + Stability-protector confirms stewardship register.",
        deltas: { "Am I secure?": 0.5 },
        subRegisterCandidate: "stewardship",
      };
    },
  },
  // R3 — Mastery override on money/security (Knowledge-protector without Stability)
  {
    id: "R3",
    apply(ctx) {
      if (!hasGrip(ctx, "Grips money / security under pressure")) return null;
      if (!isKnowledgeProtector(ctx.topCompass)) return null;
      if (isStabilityProtector(ctx.topCompass)) return null;
      return {
        id: "R3",
        rationale:
          "Money/security + Knowledge-protector without Stability routes to mastery.",
        deltas: {
          "Am I secure?": -1.0,
          "Am I good enough?": 0.8,
          "Am I successful?": 0.4,
        },
        subRegisterCandidate: "mastery",
      };
    },
  },
  // R4 — Relational override on being right (Fe driver / high-A / not Knowledge)
  {
    id: "R4",
    apply(ctx) {
      if (!hasGrip(ctx, "Grips being right under pressure")) return null;
      const fePresent =
        ctx.lensDominant === "fe" || ctx.lensAuxiliary === "fe";
      const highA =
        ctx.oceanAgreeableness !== null && ctx.oceanAgreeableness >= 70;
      if (!fePresent && !highA) return null;
      if (isKnowledgeProtector(ctx.topCompass)) return null;
      return {
        id: "R4",
        rationale:
          "Being right + Fe/high-A + non-Knowledge protector routes to relational.",
        deltas: {
          "Am I good enough?": -0.6,
          "Am I wanted?": 0.6,
          "Am I loved?": 0.4,
        },
        subRegisterCandidate: "relational",
      };
    },
  },
  // R5 — Craft confirmation on being right (Knowledge-protector / thinking-driver)
  {
    id: "R5",
    apply(ctx) {
      if (!hasGrip(ctx, "Grips being right under pressure")) return null;
      const knowledgeProtector = isKnowledgeProtector(ctx.topCompass);
      const thinkingDriver = isThinkingDriver(
        ctx.lensDominant,
        ctx.lensAuxiliary
      );
      if (!knowledgeProtector && !thinkingDriver) return null;
      return {
        id: "R5",
        rationale:
          "Being right + Knowledge-protector or thinking-driver confirms craft register.",
        deltas: { "Am I good enough?": 0.5 },
        subRegisterCandidate: "mastery",
      };
    },
  },
  // R6 — Wisdom-governed dampens defensive primals
  {
    id: "R6",
    apply(ctx) {
      // CC-PHASE-3A-LABEL-LOGIC — was "Wisdom-governed"; refined to
      // "Open-Handed Aim".
      if (ctx.riskFormLetter !== "Open-Handed Aim") return null;
      return {
        id: "R6",
        rationale:
          "Wisdom-governed shape — defensive primals are governed, not driving.",
        deltas: { "Am I safe?": -0.4, "Am I secure?": -0.4 },
        subRegisterCandidate: "discernment",
      };
    },
  },
  // R7 — Reckless-fearful / Grip-governed amplifies defensive
  {
    id: "R7",
    apply(ctx) {
      // CC-PHASE-3A-LABEL-LOGIC — was "Grip-governed" / "Reckless-fearful";
      // refined to "Grip-Governed" / "White-Knuckled Aim".
      if (
        ctx.riskFormLetter !== "Grip-Governed" &&
        ctx.riskFormLetter !== "White-Knuckled Aim"
      ) {
        return null;
      }
      return {
        id: "R7",
        rationale:
          "Grip-governed or Reckless-fearful shape — defensive primals are actively driving.",
        deltas: { "Am I safe?": 0.3, "Am I secure?": 0.3 },
      };
    },
  },
  // R8 — Si driver confirms security / stewardship
  {
    id: "R8",
    apply(ctx) {
      if (ctx.lensDominant !== "si") return null;
      return {
        id: "R8",
        rationale: "Si dominant — precedent-keeper; stewardship register confirms.",
        deltas: { "Am I secure?": 0.4 },
        subRegisterCandidate: "stewardship",
      };
    },
  },
  // R9 — Fe driver shifts to relational
  {
    id: "R9",
    apply(ctx) {
      if (ctx.lensDominant !== "fe") return null;
      return {
        id: "R9",
        rationale:
          "Fe dominant — relational sensing primary; loved/wanted register confirms.",
        deltas: { "Am I loved?": 0.3, "Am I wanted?": 0.3 },
        subRegisterCandidate: "relational",
      };
    },
  },
  // R10 — Goal-leaning + low-Soul amplifies success/good-enough
  {
    id: "R10",
    apply(ctx) {
      if (ctx.goalScore === null || ctx.soulScore === null) return null;
      const gap = ctx.goalScore - ctx.soulScore;
      if (gap < 25) return null;
      if (ctx.soulScore >= 50) return null;
      return {
        id: "R10",
        rationale:
          "Goal-leaning with thin Soul — performance / craft pull is active.",
        deltas: { "Am I successful?": 0.3, "Am I good enough?": 0.2 },
        subRegisterCandidate: "performance",
      };
    },
  },
  // R11 — High vulnerability amplifies relational
  {
    id: "R11",
    apply(ctx) {
      if (ctx.vulnerability === null) return null;
      if (ctx.vulnerability < 25) return null;
      return {
        id: "R11",
        rationale: "High vulnerability — relational primals surface.",
        deltas: { "Am I loved?": 0.3, "Am I wanted?": 0.3 },
        subRegisterCandidate: "relational",
      };
    },
  },
  // R12 — Single-signal hedge marker
  {
    id: "R12",
    apply(ctx) {
      if (ctx.contributingGrips.length > 1) return null;
      return {
        id: "R12",
        rationale: "Single-signal cluster — confidence ceiling lowered.",
        deltas: {},
        hedgeMarker: true,
      };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────
// Public entrypoint
// ─────────────────────────────────────────────────────────────────────

function emptyDeltaMap(): Record<PrimalQuestion, number> {
  const out: Partial<Record<PrimalQuestion, number>> = {};
  for (const p of ALL_PRIMALS) out[p] = 0;
  return out as Record<PrimalQuestion, number>;
}

function chooseSubRegister(
  applied: AppliedCalibrationRule[],
  primary: PrimalQuestion | null
): PrimalSubRegister {
  let best: PrimalSubRegister = null;
  let bestScore = -1;
  for (const r of applied) {
    const sub = r.subRegisterCandidate;
    if (!sub) continue;
    const prec = SUB_REGISTER_PRECEDENCE[sub];
    if (prec > bestScore) {
      best = sub;
      bestScore = prec;
    }
  }
  if (best) return best;
  // Fallback by primary identity.
  if (!primary) return null;
  switch (primary) {
    case "Am I safe?":
      return "discernment";
    case "Am I secure?":
      return "stewardship";
    case "Am I loved?":
    case "Am I wanted?":
      return "relational";
    case "Am I successful?":
      return "performance";
    case "Am I good enough?":
      return "mastery";
    case "Do I have purpose?":
      return "mission";
    default:
      return null;
  }
}

function pickDistortedStrategy(
  primary: PrimalQuestion | null,
  subRegister: PrimalSubRegister
): DistortedStrategyTemplate | null {
  if (!primary) return null;
  const key = `${primary}::${subRegister}`;
  return DISTORTED_STRATEGY_TABLE[key] ?? FALLBACK_STRATEGY[primary] ?? null;
}

// CC-SHAPE-AWARE-PROSE-ROUTING — surface grip routes through the
// Primal so non-stakes Primals don't have money/reputation/approval
// signals leading the headline. The routing is exported and applied
// at RENDER time (lib/renderMirror.ts / app components) rather than
// at engine-attach time, because the engine-attached `surfaceGrip`
// flows into the gripTaxonomy cache hash key and must stay byte-
// stable per the CC's cache-stability strategy (Option B).
export const PRIMAL_ROUTED_SURFACE: Partial<Record<string, string>> = {
  "Am I wanted?": "Belonging through usefulness",
  "Am I loved?": "Earning love through performance",
  "Am I good enough?": "Proving worth through output",
  "Am I secure?": "Security through control",
};

/**
 * routeSurfaceGripByPrimal — render-time helper. Returns the Primal-
 * routed surface grip when the cluster's primary is one of the
 * relational/identity Primals AND stakes-coded contributing signals
 * fire. Otherwise returns the engine-attached `surfaceGrip` unchanged.
 */
export function routeSurfaceGripByPrimal(
  legacySurfaceGrip: string,
  contributingGrips: string[],
  primary: string | null
): string {
  if (primary && PRIMAL_ROUTED_SURFACE[primary]) {
    const hasStakesCoded = contributingGrips.some((g) =>
      /money|reputation|approval|control|security/i.test(g)
    );
    if (hasStakesCoded) {
      return PRIMAL_ROUTED_SURFACE[primary]!;
    }
  }
  return legacySurfaceGrip;
}

function deriveSurfaceGrip(contributingGrips: string[]): string {
  if (contributingGrips.length === 0) return "Pressure read absent";
  // Strip "Grips ", " under pressure" tokens for a cleaner surface label.
  const lead = contributingGrips[0];
  const stripped = lead
    .replace(/^Grips\s+/i, "")
    .replace(/\s+under pressure$/i, "")
    .replace(/^([a-z])/, (m) => m.toUpperCase());
  return `${stripped} under pressure`;
}

export function calibratePrimalCluster(
  baseScores: Record<PrimalQuestion, number>,
  ctx: CalibrationContext
): CalibrationOutput {
  const deltas = emptyDeltaMap();
  const applied: AppliedCalibrationRule[] = [];

  for (const rule of RULES) {
    const result = rule.apply(ctx);
    if (!result) continue;
    applied.push(result);
    for (const [primal, delta] of Object.entries(result.deltas) as Array<
      [PrimalQuestion, number]
    >) {
      deltas[primal] = (deltas[primal] ?? 0) + delta;
    }
  }

  const finalScores: Record<PrimalQuestion, number> = emptyDeltaMap();
  for (const p of ALL_PRIMALS) {
    // Calibration cannot drive a primal below zero — the floor is the
    // deterministic grip-mapping floor; calibration redistributes weight
    // but never invents a negative pressure.
    finalScores[p] = Math.max(0, baseScores[p] + deltas[p]);
  }

  // Pick primary from finalScores (top, > 0).
  const ranked = ALL_PRIMALS.filter((p) => finalScores[p] > 0).sort(
    (a, b) => finalScores[b] - finalScores[a]
  );
  const primary = ranked[0] ?? null;

  const subRegister = chooseSubRegister(applied, primary);
  const distortedStrategy = pickDistortedStrategy(primary, subRegister);
  const hedgeMarker = applied.some((r) => r.hedgeMarker === true);
  const surfaceGrip = deriveSurfaceGrip(ctx.contributingGrips);
  // Primary is no longer consumed here; routing happens at render time.
  void primary;

  return {
    baseScores,
    finalScores,
    deltas,
    appliedRules: applied,
    subRegister,
    distortedStrategy,
    hedgeMarker,
    surfaceGrip,
  };
}

// Test seam — exposed for the audit's rule-uniqueness check.
export const __ALL_RULE_IDS = RULES.map((r) => r.id);
