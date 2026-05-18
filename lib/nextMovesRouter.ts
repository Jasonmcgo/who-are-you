// CC-104-NEXT-MOVES-SHAPE-AWARE — routing function for the
// Next Moves prose layer.
//
// Three registers (Load-Audit / Identity-Reframe / Build-Something).
// Routing is shape-aware: V/O × grip bucket × state-load × primal
// coherence. No engine math is modified — this module reads engine
// outputs + raw answers and returns a routing decision.

import type { Answer } from "./types";
import type { GripPatternKey } from "./gripPattern";

export type NextMovesRegister =
  | "load-audit"
  | "identity-reframe"
  | "build-something";

export interface NextMovesStateLoad {
  composite: number;
  signals: {
    qx1: string | null;
    qx2: string | null;
    qa1: string | null;
    qo2Top: string | null;
  };
}

export interface NextMovesRouterInput {
  vo: { score: number };
  stateLoad: NextMovesStateLoad;
  gripBucket: GripPatternKey;
  primalCoherence: "trajectory" | "crisis";
  aim: number | null;
}

export interface NextMovesRouterOutput {
  register: NextMovesRegister;
  confidence: "high" | "medium" | "low";
  reason: string;
}

const OWNER_ANCHORED_THRESHOLD = 80;
const VICTIM_THRESHOLD = 40;
const CRISIS_AIM_THRESHOLD = 35;
const STATE_LOAD_LOW = 0.5;
const STATE_LOAD_LOAD_AUDIT_MIN = 0.4;

const IDENTITY_FUSION_BUCKETS: ReadonlySet<GripPatternKey> = new Set([
  "worth",
  "recognition",
]);
const LOAD_AUDIT_BUCKETS: ReadonlySet<GripPatternKey> = new Set([
  "belonging",
  "security",
  "control",
  "recognition",
  "safety",
]);
const BUILD_SOMETHING_BUCKETS: ReadonlySet<GripPatternKey> = new Set([
  "control",
  "purpose",
]);

export function routeNextMovesRegister(
  input: NextMovesRouterInput
): NextMovesRouterOutput {
  const { vo, stateLoad, gripBucket, primalCoherence, aim } = input;

  // Rule 1 — Build-Something (Register C).
  if (primalCoherence === "crisis") {
    return {
      register: "build-something",
      confidence: "high",
      reason: "crisis-path: no frame to release into",
    };
  }
  if (
    aim !== null &&
    aim < CRISIS_AIM_THRESHOLD &&
    BUILD_SOMETHING_BUCKETS.has(gripBucket)
  ) {
    return {
      register: "build-something",
      confidence: "high",
      reason: `low Aim (${aim.toFixed(0)}) with ${gripBucket} grip — anchor first, release after`,
    };
  }

  // Rule 2 — Identity-Reframe (Register B).
  const atIdentityFusionPole =
    vo.score >= OWNER_ANCHORED_THRESHOLD || vo.score < VICTIM_THRESHOLD;
  if (
    atIdentityFusionPole &&
    IDENTITY_FUSION_BUCKETS.has(gripBucket) &&
    stateLoad.composite < STATE_LOAD_LOW
  ) {
    const fusionEdge =
      vo.score >= OWNER_ANCHORED_THRESHOLD ? "owner-fusion" : "victim-fusion";
    const borderline =
      Math.abs(vo.score - OWNER_ANCHORED_THRESHOLD) <= 3 ||
      Math.abs(vo.score - VICTIM_THRESHOLD) <= 3;
    return {
      register: "identity-reframe",
      confidence: borderline ? "medium" : "high",
      reason: `${fusionEdge} with ${gripBucket} grip and low state-load — identity-level claim, not load response`,
    };
  }

  // Rule 3 — Load-Audit (explicit).
  if (
    stateLoad.composite >= STATE_LOAD_LOAD_AUDIT_MIN &&
    LOAD_AUDIT_BUCKETS.has(gripBucket)
  ) {
    return {
      register: "load-audit",
      confidence: "high",
      reason: `state-load composite ${stateLoad.composite.toFixed(2)} with ${gripBucket} grip — owner trait under compression`,
    };
  }

  // Rule 4 — Fallback to Load-Audit.
  return {
    register: "load-audit",
    confidence: "low",
    reason: `fallback: no Register-B/C signature matched (vo=${vo.score}, bucket=${gripBucket}, stateLoad=${stateLoad.composite.toFixed(2)})`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// State-load composite from raw answers
// ─────────────────────────────────────────────────────────────────────

function findForcedResponse(answers: Answer[], qid: string): string | null {
  const a = answers.find((x) => x.question_id === qid);
  if (a && (a.type === "forced" || a.type === "freeform")) {
    return a.response ?? null;
  }
  return null;
}

function findRankingTop(answers: Answer[], qid: string): string | null {
  const a = answers.find((x) => x.question_id === qid);
  if (a && a.type === "ranking") {
    return a.order[0] ?? null;
  }
  return null;
}

export function computeStateLoad(answers: Answer[]): NextMovesStateLoad {
  const qx1 = findForcedResponse(answers, "Q-X1");
  const qx2 = findForcedResponse(answers, "Q-X2");
  const qa1 = findForcedResponse(answers, "Q-A1");
  const qo2Top = findRankingTop(answers, "Q-O2");

  let composite = 0;
  if (qx1 === "Overwhelming or stretched") composite += 0.3;
  if (qx2 === "A lot") composite += 0.25;
  if (qa1 === "Reacting to demands") composite += 0.25;
  if (qo2Top === "overwhelmed_functioning" || qo2Top === "anxious_reactivity") {
    composite += 0.2;
  }
  return {
    composite: Math.max(0, Math.min(1, composite)),
    signals: { qx1, qx2, qa1, qo2Top },
  };
}
