// CC-067 — Goal/Soul/Give Derivation Layer.
//
// Engine-level synthesis: compose existing signals into Goal-axis (outward
// form), Soul-axis (inward love), and an orthogonal Vulnerability/Openness
// vector. Place into one of six named regions and emit warm placeholder prose
// for the closing Mirror section. Source-of-truth: docs/goal-soul-give-spec.md.
//
// Architectural rules (do not relax without a canon revision):
//   - Derivation only — no new questions, no new signals, no new pattern-
//     catalog entries (those are CC-B and CC-C scope).
//   - Engine vocabulary (Goal / Soul / Vulnerability) appears only in the
//     evidence object and audit logs. User-facing prose speaks Work / Love /
//     Give plus the six named regions (Purpose, Striving, Longing, Gripping,
//     the Parallel-Lives diagnostic, or the Neutral fallback).
//   - Soul anchor is Love, not Presence. Avoid therapy-coded phrasings (no
//     "Soul becoming present in the world", "your inner work", "shadow",
//     "authentic self"). Spec §2, §12.3.
//   - Gripping cluster is gated; low-Goal + low-Soul defaults to Neutral
//     unless the cluster (Stakes-money/job/reputation top-1/2 + ≥2 pressure-
//     adaptation signals + Vulnerability-low + thin Soul) fires. Compliance
//     drive on its own is NOT a Gripping signal — high-Compliance + active
//     Soul reads as stewardship. Spec §4, §12.1.
//   - Vulnerability is a separate Z-score with its own evidence list.
//     Collapsing it into Soul makes the Parallel Lives branch unreachable.
//     Spec §12.2.
//
// Composite weights below are illustrative starting points from the spec §7,
// not canon. The audit pass tunes them; future CCs may revise. The 50/100
// thresholds for Goal-high / Soul-high are spec defaults; once cohort data
// exists, percentile-of-cohort cuts are a candidate alternative (spec §
// "Open Questions").

import type {
  Answer,
  GoalSoulAdjustedScores,
  GoalSoulEvidence,
  GoalSoulGiveOutput,
  GoalSoulQuadrant,
  GoalSoulRawScores,
  GrippingPull,
  GrippingPullSignal,
  Signal,
  SignalId,
} from "./types";

// ── Composite weight tables (spec §7 starting values, tunable) ──────────
//
// Goal weights (sum to 100): outward-form energy is the heaviest single
// driver, with Drive/Ambition and Q-A1 agency next, and a Q-T te/se
// component as a softer execution-disposition lift.
export const GOAL_WEIGHTS = {
  e1OutwardTopBuildingSolvingRestoring: 25,
  qa1ProactiveOrMaintainer: 15,
  qa2GoalCoded: 10, // proactive_creator | exploration_drive | stability_restoration
  q3c1CostTop1or2: 15,
  qAmbition1AchieveTop2: 15, // success | legacy | wealth in top-2
  qtTeSeNormalized: 10, // execution-temperament proxy across Q-T rankings
  qs1StabilityTop2: 5,
  highConvictionEither: 5, // high_conviction_under_risk | high_conviction_expression
} as const;

// Soul weights (sum to 100). Q-E1-inward "caring" top-1 is the heaviest
// single driver; sacred-value nouns + relational trust are next.
export const SOUL_WEIGHTS = {
  e1InwardCaringTop1: 25,
  qa2RelationalInvestment: 15,
  qs2CompassionMercyFamilyFaithTop2: 20,
  qs1PeaceLoyaltyTop2: 10,
  qx4RelationalPartnerFamilyFriendTop1: 10,
  qtFeFiNormalized: 10,
  s3CloseNonSelfTop1OrWiderNonprofits: 10,
} as const;

// Vulnerability weights — sum to 85 of positive contribution; -15 floor on
// the inverse penalty (capped). Computed as a Z-score in the [-50, +50]
// range after normalization.
export const VULNERABILITY_WEIGHTS = {
  qi1SubstantiveCostOrConvictionUnderCost: 20,
  qp1HighConvictionExpression: 15,
  qp2HighConvictionUnderRisk: 15,
  qx4ChosenNotOwnCounselFirst: 15,
  oceanOpennessAboveMedian: 20,
  inversePenalty: 15, // subtracted, capped at this magnitude
} as const;

// ── CC-Q2 — Direct-measurement weights (Q-GS1 / Q-V1 / Q-GRIP1) ────────
//
// Q-GS1 / Q-V1 / Q-GRIP1 add direct measurement to the composites that
// CC-067/CC-068/CC-077 derived from indirect signals. These constants
// govern how strongly each direct signal lifts (or suppresses) its
// composite. Values chosen so a single direct signal moves intensity by
// "small but visible" amounts; full top-3 / top-2 ranking moves
// composites by a meaningful but not dominating fraction. Per spec
// Out-of-Scope §4 the asymmetric lift constants (GOAL_LIFT_BASE etc.)
// stay canon-locked; the new signals add inputs to raw_goal / raw_soul /
// vulnerability, not change the curve.
export const DIRECT_GOAL_BONUS = {
  // Q-GS1 direct goal-coded items.
  goalCompletionTop1: 6,
  goalCompletionTop3: 3,
  durableCreationTop1: 5,
  durableCreationTop3: 2,
  // Q-V1 — explaining-not-naming reads as a mild Goal lift (logic register).
  goalLogicExplanationTop1: 3,
  goalLogicExplanationTop2: 1,
} as const;

export const DIRECT_SOUL_BONUS = {
  // Q-GS1 direct soul-coded items.
  soulPeopleTop1: 6,
  soulPeopleTop3: 3,
  soulCallingTop1: 6,
  soulCallingTop3: 3,
  creativeTruthTop1: 4,
  creativeTruthTop3: 2,
  // Q-GS1 durable_creation also lifts Soul (synthesis with Goal).
  durableCreationTop1: 3,
  durableCreationTop3: 1,
  // Q-V1 strong direct lift — naming the beloved is the canonical Soul tell.
  soulBelovedNamedTop1: 10,
  soulBelovedNamedTop2: 6,
} as const;

export const DIRECT_VULNERABILITY_BONUS = {
  // Q-V1 positive register.
  vulnerabilityOpenUncertaintyTop1: 12,
  vulnerabilityOpenUncertaintyTop2: 7,
  sacredBeliefConnectionTop1: 8,
  sacredBeliefConnectionTop2: 4,
  // Naming-as-vulnerability — soul_beloved_named lifts Vulnerability mildly
  // alongside its strong Soul lift.
  soulBelovedNamedTop1: 5,
  soulBelovedNamedTop2: 2,
  // Q-V1 negative register (suppression).
  vulnerabilityDeflectionTop1: -10,
  vulnerabilityDeflectionTop2: -5,
  performanceIdentityTop1: -6,
  performanceIdentityTop2: -3,
  goalLogicExplanationTop1: -3,
  goalLogicExplanationTop2: -1,
} as const;

export const DIRECT_GRIPPING_PULL_BONUS = {
  // Each Q-GRIP1 grips_* signal contributes per rank tier; total capped
  // at `gripsCap` so a user gripping every option doesn't saturate.
  gripsTop1: 8,
  gripsTop2: 5,
  gripsTop3: 3,
  gripsRank4Plus: 1,
  gripsCap: 25,
  // Q-GS1 gripping_proof_signal — the proving-capability register feeds
  // the Gripping cluster mildly.
  grippingProofTop1: 5,
  grippingProofTop2OrTop3: 2,
  // Q-V1 performance_identity — points-at-output reads as a mild grip.
  performanceIdentityTop1: 4,
  performanceIdentityTop2: 2,
} as const;

// ── Threshold constants ─────────────────────────────────────────────────

export const GOAL_HIGH_THRESHOLD = 50;
export const SOUL_HIGH_THRESHOLD = 50;
// CC-067 used VULNERABILITY_SUFFICIENT_THRESHOLD = 0 to gate quadrant
// placement (NE Give vs Parallel Lives). CC-071 removes parallel_lives;
// the asymmetric lift (below) handles the gating implicitly. Constant
// kept for `grippingClusterFires` which still uses it as a "Vulnerability
// net-negative" sentinel.
export const VULNERABILITY_SUFFICIENT_THRESHOLD = 0;
export const MIN_SIGNALS_FOR_OUTPUT = 8;
export const HIGH_CONFIDENCE_SIGNAL_COUNT = 12;

// ── CC-071 — Asymmetric lift constants (spec §7) ────────────────────────
//
// Vulnerability lifts and suppresses Goal and Soul ASYMMETRICALLY. Soul
// gets a much larger lift coefficient than Goal — this encodes the canon
// that Vulnerability gates the love-line more than it gates productive
// motion. A high-output builder with thin Vulnerability keeps a strong
// Goal score; their Soul score reflects the integration gap.
//
// Tunables. The 0.85/0.30 (Goal) and 0.60/0.80 (Soul) constants are
// exported so downstream calibration CCs can re-validate them against
// real cohort data; the asymmetry itself is canon-locked. At
// vulnerability_composite = 0 (neutral), both lift factors equal 1 and
// adjusted == raw (acceptance §AC-7).

export const GOAL_LIFT_BASE = 0.85;
export const GOAL_LIFT_RANGE = 0.30; // multiplied by vulnerability_normalized
export const SOUL_LIFT_BASE = 0.60;
export const SOUL_LIFT_RANGE = 0.80;

// vulnerability_normalized = (vulnerability_composite + 50) / 100, clamped
// to [0, 1]. Helper for both lift application and audit.
export function normalizeVulnerability(vulnerability: number): number {
  const raw = (vulnerability + 50) / 100;
  return Math.max(0, Math.min(1, raw));
}

export function applyAsymmetricLift(
  rawGoal: number,
  rawSoul: number,
  vulnerability: number
): GoalSoulAdjustedScores {
  const vNorm = normalizeVulnerability(vulnerability);
  const goalLift = GOAL_LIFT_BASE + GOAL_LIFT_RANGE * vNorm;
  const soulLift = SOUL_LIFT_BASE + SOUL_LIFT_RANGE * vNorm;
  return {
    goal: Math.round(Math.max(0, Math.min(100, rawGoal * goalLift))),
    soul: Math.round(Math.max(0, Math.min(100, rawSoul * soulLift))),
  };
}

// ── Helper: signal lookup by id ─────────────────────────────────────────

function findSignals(signals: Signal[], id: SignalId): Signal[] {
  return signals.filter((s) => s.signal_id === id);
}

function hasSignal(signals: Signal[], id: SignalId): boolean {
  return signals.some((s) => s.signal_id === id);
}

function hasSignalAtRank(
  signals: Signal[],
  id: SignalId,
  maxRank: number
): boolean {
  return signals.some(
    (s) => s.signal_id === id && s.rank !== undefined && s.rank <= maxRank
  );
}

function rankOfSignalFromQuestion(
  signals: Signal[],
  id: SignalId,
  questionId: string
): number | undefined {
  const s = signals.find(
    (sig) =>
      sig.signal_id === id &&
      sig.source_question_ids.includes(questionId)
  );
  return s?.rank;
}

// ── Q-E1 evidence guard (spec §AC-4) ────────────────────────────────────
//
// `computeGoalSoulGive` returns undefined when there is no Q-E1 evidence on
// either axis. Q-E1-outward emits {building, solving, restoring}_energy_priority;
// Q-E1-inward emits {caring, learning, enjoying}_energy_priority. We require
// at least one signal from each parent ranking (rank present on either, with
// source_question_ids referencing Q-E1-outward or Q-E1-inward).

const E1_OUTWARD_SIGNAL_IDS: SignalId[] = [
  "building_energy_priority",
  "solving_energy_priority",
  "restoring_energy_priority",
];
const E1_INWARD_SIGNAL_IDS: SignalId[] = [
  "caring_energy_priority",
  "learning_energy_priority",
  "enjoying_energy_priority",
];

function hasE1Evidence(signals: Signal[]): boolean {
  const outward = signals.some(
    (s) =>
      E1_OUTWARD_SIGNAL_IDS.includes(s.signal_id) &&
      s.source_question_ids.includes("Q-E1-outward")
  );
  const inward = signals.some(
    (s) =>
      E1_INWARD_SIGNAL_IDS.includes(s.signal_id) &&
      s.source_question_ids.includes("Q-E1-inward")
  );
  return outward || inward;
}

// ── Goal composite ──────────────────────────────────────────────────────

function computeGoalScore(
  signals: Signal[],
  answers: Answer[]
): { score: number; drivers: string[] } {
  void answers;
  const drivers: string[] = [];
  let score = 0;

  // (1) Q-E1-outward top-1 in {building, solving, restoring}.
  const outwardTop1 = E1_OUTWARD_SIGNAL_IDS.find((id) =>
    signals.some(
      (s) =>
        s.signal_id === id &&
        s.rank === 1 &&
        s.source_question_ids.includes("Q-E1-outward")
    )
  );
  if (outwardTop1) {
    score += GOAL_WEIGHTS.e1OutwardTopBuildingSolvingRestoring;
    drivers.push(`Q-E1-outward top-1: ${outwardTop1}`);
  }

  // (2) Q-A1 = proactive_creator OR responsibility_maintainer.
  if (
    hasSignal(signals, "proactive_creator") &&
    findSignals(signals, "proactive_creator").some((s) =>
      s.source_question_ids.includes("Q-A1")
    )
  ) {
    score += GOAL_WEIGHTS.qa1ProactiveOrMaintainer;
    drivers.push("Q-A1: proactive_creator");
  } else if (hasSignal(signals, "responsibility_maintainer")) {
    score += GOAL_WEIGHTS.qa1ProactiveOrMaintainer;
    drivers.push("Q-A1: responsibility_maintainer");
  }

  // (3) Q-A2 Goal-coded options. proactive_creator can come from Q-A1 or
  // Q-A2; here we require source = Q-A2.
  const qa2Goal = ["proactive_creator", "exploration_drive", "stability_restoration"]
    .find((id) =>
      signals.some(
        (s) =>
          s.signal_id === id &&
          s.source_question_ids.includes("Q-A2")
      )
    );
  if (qa2Goal) {
    score += GOAL_WEIGHTS.qa2GoalCoded;
    drivers.push(`Q-A2: ${qa2Goal}`);
  }

  // (4) Q-3C1 cost_drive top-1 OR top-2.
  if (hasSignalAtRank(signals, "cost_drive", 2)) {
    score += GOAL_WEIGHTS.q3c1CostTop1or2;
    drivers.push("Q-3C1: cost_drive top-1/2");
  }

  // (5) Q-Ambition1 success_priority OR legacy_priority OR wealth_priority
  // ranked in top-2.
  const ambitionTop2 = ["success_priority", "legacy_priority", "wealth_priority"]
    .find((id) => hasSignalAtRank(signals, id, 2));
  if (ambitionTop2) {
    score += GOAL_WEIGHTS.qAmbition1AchieveTop2;
    drivers.push(`Q-Ambition1 top-2: ${ambitionTop2}`);
  }

  // (6) te + se signals in top-2 across any Q-T ranking. Normalized:
  // count distinct (signal_id, source_question_id) pairs at rank ≤ 2
  // for te or se, divide by 4 (heuristic ceiling — most users will land
  // 1-2 such top-2 placements when te/se features in their stack).
  const teSeTop2 = signals.filter(
    (s) =>
      (s.signal_id === "te" || s.signal_id === "se") &&
      s.rank !== undefined &&
      s.rank <= 2
  ).length;
  const teSeFraction = Math.min(1, teSeTop2 / 4);
  if (teSeFraction > 0) {
    score += GOAL_WEIGHTS.qtTeSeNormalized * teSeFraction;
    drivers.push(`Q-T te/se top-2 count: ${teSeTop2}`);
  }

  // (7) Q-S1 stability_priority in top-2.
  if (
    rankOfSignalFromQuestion(signals, "stability_priority", "Q-S1") !==
      undefined &&
    (rankOfSignalFromQuestion(signals, "stability_priority", "Q-S1") ?? 99) <= 2
  ) {
    score += GOAL_WEIGHTS.qs1StabilityTop2;
    drivers.push("Q-S1: stability_priority top-2");
  }

  // (8) high_conviction_under_risk OR high_conviction_expression present.
  if (
    hasSignal(signals, "high_conviction_under_risk") ||
    hasSignal(signals, "high_conviction_expression")
  ) {
    score += GOAL_WEIGHTS.highConvictionEither;
    drivers.push("Q-P1/P2: high conviction");
  }

  // (9) CC-Q2 — Q-GS1 direct goal-coded signals.
  const goalCompletionRank = rankOfSignalFromQuestion(
    signals,
    "goal_completion_signal",
    "Q-GS1"
  );
  if (goalCompletionRank !== undefined) {
    if (goalCompletionRank === 1) {
      score += DIRECT_GOAL_BONUS.goalCompletionTop1;
      drivers.push("Q-GS1: goal_completion_signal top-1");
    } else if (goalCompletionRank <= 3) {
      score += DIRECT_GOAL_BONUS.goalCompletionTop3;
      drivers.push(`Q-GS1: goal_completion_signal rank ${goalCompletionRank}`);
    }
  }
  const durableCreationGoalRank = rankOfSignalFromQuestion(
    signals,
    "durable_creation_signal",
    "Q-GS1"
  );
  if (durableCreationGoalRank !== undefined) {
    if (durableCreationGoalRank === 1) {
      score += DIRECT_GOAL_BONUS.durableCreationTop1;
      drivers.push("Q-GS1: durable_creation_signal top-1 (goal lift)");
    } else if (durableCreationGoalRank <= 3) {
      score += DIRECT_GOAL_BONUS.durableCreationTop3;
      drivers.push(
        `Q-GS1: durable_creation_signal rank ${durableCreationGoalRank} (goal lift)`
      );
    }
  }
  // (10) CC-Q2 — Q-V1 mild Goal lift on goal_logic_explanation. The
  // explaining-not-naming register reads as logic-register Goal-coded.
  const goalLogicRank = rankOfSignalFromQuestion(
    signals,
    "goal_logic_explanation",
    "Q-V1"
  );
  if (goalLogicRank === 1) {
    score += DIRECT_GOAL_BONUS.goalLogicExplanationTop1;
    drivers.push("Q-V1: goal_logic_explanation top-1");
  } else if (goalLogicRank === 2) {
    score += DIRECT_GOAL_BONUS.goalLogicExplanationTop2;
    drivers.push("Q-V1: goal_logic_explanation top-2");
  }

  return { score: Math.round(Math.min(100, Math.max(0, score))), drivers };
}

// ── Soul composite ──────────────────────────────────────────────────────

function computeSoulScore(
  signals: Signal[],
  answers: Answer[]
): { score: number; drivers: string[] } {
  void answers;
  const drivers: string[] = [];
  let score = 0;

  // (1) Q-E1-inward top-1 = caring_energy_priority.
  if (
    signals.some(
      (s) =>
        s.signal_id === "caring_energy_priority" &&
        s.rank === 1 &&
        s.source_question_ids.includes("Q-E1-inward")
    )
  ) {
    score += SOUL_WEIGHTS.e1InwardCaringTop1;
    drivers.push("Q-E1-inward top-1: caring");
  }

  // (2) Q-A2 = relational_investment.
  if (
    signals.some(
      (s) =>
        s.signal_id === "relational_investment" &&
        s.source_question_ids.includes("Q-A2")
    )
  ) {
    score += SOUL_WEIGHTS.qa2RelationalInvestment;
    drivers.push("Q-A2: relational_investment");
  }

  // (3) Q-S2 top-2 ∩ {compassion, mercy, family, faith}. Score the highest
  // matching rank — full credit on top-1; half on top-2 to avoid double-
  // counting if both top-1 and top-2 are in the set.
  const qs2SoulIds: SignalId[] = [
    "compassion_priority",
    "mercy_priority",
    "family_priority",
    "faith_priority",
  ];
  let qs2Best: { id: SignalId; rank: number } | null = null;
  for (const id of qs2SoulIds) {
    const r = rankOfSignalFromQuestion(signals, id, "Q-S2");
    if (r !== undefined && r <= 2) {
      if (!qs2Best || r < qs2Best.rank) qs2Best = { id, rank: r };
    }
  }
  if (qs2Best) {
    const factor = qs2Best.rank === 1 ? 1.0 : 0.6;
    score += SOUL_WEIGHTS.qs2CompassionMercyFamilyFaithTop2 * factor;
    drivers.push(`Q-S2: ${qs2Best.id} rank ${qs2Best.rank}`);
  }

  // (4) Q-S1 top-2 ∩ {peace, loyalty}.
  const qs1SoulIds: SignalId[] = ["peace_priority", "loyalty_priority"];
  const qs1Best = qs1SoulIds.find((id) => {
    const r = rankOfSignalFromQuestion(signals, id, "Q-S1");
    return r !== undefined && r <= 2;
  });
  if (qs1Best) {
    score += SOUL_WEIGHTS.qs1PeaceLoyaltyTop2;
    drivers.push(`Q-S1: ${qs1Best} top-2`);
  }

  // (5) Q-X4-relational top-1 ∈ {partner, family, friend}.
  const qx4RelTop1Ids: SignalId[] = [
    "partner_trust_priority",
    "family_trust_priority",
    "friend_trust_priority",
  ];
  const qx4RelTop1 = qx4RelTop1Ids.find((id) =>
    signals.some(
      (s) =>
        s.signal_id === id &&
        s.rank === 1 &&
        s.source_question_ids.includes("Q-X4-relational")
    )
  );
  if (qx4RelTop1) {
    score += SOUL_WEIGHTS.qx4RelationalPartnerFamilyFriendTop1;
    drivers.push(`Q-X4-relational top-1: ${qx4RelTop1}`);
  }

  // (6) fe + fi signals in top-2 across Q-T rankings, normalized like te/se.
  const feFiTop2 = signals.filter(
    (s) =>
      (s.signal_id === "fe" || s.signal_id === "fi") &&
      s.rank !== undefined &&
      s.rank <= 2
  ).length;
  const feFiFraction = Math.min(1, feFiTop2 / 4);
  if (feFiFraction > 0) {
    score += SOUL_WEIGHTS.qtFeFiNormalized * feFiFraction;
    drivers.push(`Q-T fe/fi top-2 count: ${feFiTop2}`);
  }

  // (7) Q-S3-close non-self top-1 OR Q-S3-wider nonprofits_religious top-1.
  const s3CloseTop1NonSelf = ["family_spending_priority", "friends_spending_priority"]
    .find((id) =>
      signals.some(
        (s) =>
          s.signal_id === id &&
          s.rank === 1 &&
          s.source_question_ids.includes("Q-S3-close")
      )
    );
  const s3WiderNonprofitsTop1 = signals.some(
    (s) =>
      s.signal_id === "nonprofits_religious_spending_priority" &&
      s.rank === 1 &&
      s.source_question_ids.includes("Q-S3-wider")
  );
  if (s3CloseTop1NonSelf || s3WiderNonprofitsTop1) {
    score += SOUL_WEIGHTS.s3CloseNonSelfTop1OrWiderNonprofits;
    drivers.push(
      s3CloseTop1NonSelf
        ? `Q-S3-close top-1: ${s3CloseTop1NonSelf}`
        : "Q-S3-wider top-1: nonprofits_religious"
    );
  }

  // (8) CC-Q2 — Q-GS1 direct soul-coded signals.
  const soulPeopleRank = rankOfSignalFromQuestion(
    signals,
    "soul_people_signal",
    "Q-GS1"
  );
  if (soulPeopleRank === 1) {
    score += DIRECT_SOUL_BONUS.soulPeopleTop1;
    drivers.push("Q-GS1: soul_people_signal top-1");
  } else if (soulPeopleRank !== undefined && soulPeopleRank <= 3) {
    score += DIRECT_SOUL_BONUS.soulPeopleTop3;
    drivers.push(`Q-GS1: soul_people_signal rank ${soulPeopleRank}`);
  }
  const soulCallingRank = rankOfSignalFromQuestion(
    signals,
    "soul_calling_signal",
    "Q-GS1"
  );
  if (soulCallingRank === 1) {
    score += DIRECT_SOUL_BONUS.soulCallingTop1;
    drivers.push("Q-GS1: soul_calling_signal top-1");
  } else if (soulCallingRank !== undefined && soulCallingRank <= 3) {
    score += DIRECT_SOUL_BONUS.soulCallingTop3;
    drivers.push(`Q-GS1: soul_calling_signal rank ${soulCallingRank}`);
  }
  const creativeTruthRank = rankOfSignalFromQuestion(
    signals,
    "creative_truth_signal",
    "Q-GS1"
  );
  if (creativeTruthRank === 1) {
    score += DIRECT_SOUL_BONUS.creativeTruthTop1;
    drivers.push("Q-GS1: creative_truth_signal top-1");
  } else if (creativeTruthRank !== undefined && creativeTruthRank <= 3) {
    score += DIRECT_SOUL_BONUS.creativeTruthTop3;
    drivers.push(`Q-GS1: creative_truth_signal rank ${creativeTruthRank}`);
  }
  const durableCreationSoulRank = rankOfSignalFromQuestion(
    signals,
    "durable_creation_signal",
    "Q-GS1"
  );
  if (durableCreationSoulRank === 1) {
    score += DIRECT_SOUL_BONUS.durableCreationTop1;
    drivers.push("Q-GS1: durable_creation_signal top-1 (soul lift)");
  } else if (
    durableCreationSoulRank !== undefined &&
    durableCreationSoulRank <= 3
  ) {
    score += DIRECT_SOUL_BONUS.durableCreationTop3;
    drivers.push(
      `Q-GS1: durable_creation_signal rank ${durableCreationSoulRank} (soul lift)`
    );
  }
  // (9) CC-Q2 — Q-V1 strong direct Soul lift on soul_beloved_named.
  const belovedNamedRank = rankOfSignalFromQuestion(
    signals,
    "soul_beloved_named",
    "Q-V1"
  );
  if (belovedNamedRank === 1) {
    score += DIRECT_SOUL_BONUS.soulBelovedNamedTop1;
    drivers.push("Q-V1: soul_beloved_named top-1");
  } else if (belovedNamedRank === 2) {
    score += DIRECT_SOUL_BONUS.soulBelovedNamedTop2;
    drivers.push("Q-V1: soul_beloved_named top-2");
  }

  return { score: Math.round(Math.min(100, Math.max(0, score))), drivers };
}

// ── Vulnerability composite ─────────────────────────────────────────────
//
// Z-score in [-50, +50]. Positive contributions sum to up to ~85; the
// inverse penalty subtracts up to 15; the result is centered by a -50
// shift so that "no Vulnerability evidence at all" lands near -50 / 0
// rather than always at +0. Spec §7 expresses this as a [-50, +50] range
// "Z-score"; we read that as a soft re-centering rather than a true Z.

function computeVulnerabilityScore(
  signals: Signal[],
  answers: Answer[]
): { score: number; drivers: string[] } {
  const drivers: string[] = [];
  let positive = 0;
  let penalty = 0;

  // (1) Q-I1 substantive freeform, evidenced by either conviction_under_cost
  // (the extractor that fires for cost/loss/risk language) or a non-empty
  // Q-I1 freeform answer that clears the substantive bar (≥ 40 chars).
  // cost_awareness is in the spec's signal inventory but no extractor in
  // CC-067-readable code emits it; spec §6 calls this out as forward-looking.
  const qi1Answer = answers.find(
    (a) => a.question_id === "Q-I1" && a.type === "freeform"
  );
  const qi1Substantive =
    qi1Answer && qi1Answer.type === "freeform"
      ? qi1Answer.response.trim().length >= 40
      : false;
  if (qi1Substantive || hasSignal(signals, "conviction_under_cost")) {
    positive += VULNERABILITY_WEIGHTS.qi1SubstantiveCostOrConvictionUnderCost;
    drivers.push("Q-I1: substantive freeform (cost/conviction)");
  }

  // (2) high_conviction_expression from Q-P1.
  if (hasSignal(signals, "high_conviction_expression")) {
    positive += VULNERABILITY_WEIGHTS.qp1HighConvictionExpression;
    drivers.push("Q-P1: high_conviction_expression");
  }

  // (3) high_conviction_under_risk from Q-P2.
  if (hasSignal(signals, "high_conviction_under_risk")) {
    positive += VULNERABILITY_WEIGHTS.qp2HighConvictionUnderRisk;
    drivers.push("Q-P2: high_conviction_under_risk");
  }

  // (4) Q-X4-chosen does NOT rank own_counsel first. The Q-X4-chosen signal
  // own_counsel_trust_priority emits with rank from that ranking; if rank
  // is 2 or 3 (or absent), this fires. If own_counsel is rank-1, this
  // does NOT fire (that's the closed-counsel posture).
  const ownCounselRank = rankOfSignalFromQuestion(
    signals,
    "own_counsel_trust_priority",
    "Q-X4-chosen"
  );
  const qx4ChosenAnswered = signals.some((s) =>
    s.source_question_ids.includes("Q-X4-chosen")
  );
  if (qx4ChosenAnswered && ownCounselRank !== 1) {
    positive += VULNERABILITY_WEIGHTS.qx4ChosenNotOwnCounselFirst;
    drivers.push("Q-X4-chosen: own_counsel not first");
  }

  // (5) OCEAN Openness above median proxy. Without a true cohort we use a
  // local proxy: the count of openness-keyed signals in the user's bank.
  // Openness-keyed signals (per OCEAN tagging table): freedom_priority,
  // truth_priority, knowledge_priority, learning_energy_priority,
  // building_energy_priority, ne, ni, se, education_trust_priority,
  // mentor_trust_priority, outside_expert_trust_priority,
  // independent_thought_signal, epistemic_flexibility, journalism_trust_priority,
  // legacy_priority, authority_distrust, enjoying_energy_priority.
  // Count distinct present; fire the lift if ≥ 4.
  const opennessKeyed: SignalId[] = [
    "freedom_priority",
    "truth_priority",
    "knowledge_priority",
    "learning_energy_priority",
    "ne",
    "ni",
    "independent_thought_signal",
    "epistemic_flexibility",
    "outside_expert_trust_priority",
    "mentor_trust_priority",
    "authority_distrust",
    "education_trust_priority",
  ];
  const opennessCount = opennessKeyed.filter((id) =>
    hasSignal(signals, id)
  ).length;
  if (opennessCount >= 4) {
    positive += VULNERABILITY_WEIGHTS.oceanOpennessAboveMedian;
    drivers.push(`Openness proxy count: ${opennessCount}`);
  }

  // (6) Inverse penalty — capped. hides_belief, adapts_under_economic_pressure,
  // adapts_under_social_pressure each contribute up to the cap.
  const inversePresent = [
    "hides_belief",
    "adapts_under_economic_pressure",
    "adapts_under_social_pressure",
  ].filter((id) => hasSignal(signals, id));
  if (inversePresent.length > 0) {
    penalty = Math.min(
      VULNERABILITY_WEIGHTS.inversePenalty,
      inversePresent.length * 7
    );
    drivers.push(`Pressure-adaptation penalty: ${inversePresent.join(", ")}`);
  }

  // (7) CC-Q2 — Q-V1 direct Vulnerability register signals.
  const openUncertaintyRank = rankOfSignalFromQuestion(
    signals,
    "vulnerability_open_uncertainty",
    "Q-V1"
  );
  if (openUncertaintyRank === 1) {
    positive += DIRECT_VULNERABILITY_BONUS.vulnerabilityOpenUncertaintyTop1;
    drivers.push("Q-V1: vulnerability_open_uncertainty top-1");
  } else if (openUncertaintyRank === 2) {
    positive += DIRECT_VULNERABILITY_BONUS.vulnerabilityOpenUncertaintyTop2;
    drivers.push("Q-V1: vulnerability_open_uncertainty top-2");
  }
  const sacredBeliefRank = rankOfSignalFromQuestion(
    signals,
    "sacred_belief_connection",
    "Q-V1"
  );
  if (sacredBeliefRank === 1) {
    positive += DIRECT_VULNERABILITY_BONUS.sacredBeliefConnectionTop1;
    drivers.push("Q-V1: sacred_belief_connection top-1");
  } else if (sacredBeliefRank === 2) {
    positive += DIRECT_VULNERABILITY_BONUS.sacredBeliefConnectionTop2;
    drivers.push("Q-V1: sacred_belief_connection top-2");
  }
  // soul_beloved_named lifts Vulnerability mildly (naming is a vulnerability act).
  const belovedNamedVRank = rankOfSignalFromQuestion(
    signals,
    "soul_beloved_named",
    "Q-V1"
  );
  if (belovedNamedVRank === 1) {
    positive += DIRECT_VULNERABILITY_BONUS.soulBelovedNamedTop1;
    drivers.push("Q-V1: soul_beloved_named top-1 (vulnerability lift)");
  } else if (belovedNamedVRank === 2) {
    positive += DIRECT_VULNERABILITY_BONUS.soulBelovedNamedTop2;
    drivers.push("Q-V1: soul_beloved_named top-2 (vulnerability lift)");
  }
  // Negative register — deflection / performance / explaining-not-naming.
  const deflectionRank = rankOfSignalFromQuestion(
    signals,
    "vulnerability_deflection",
    "Q-V1"
  );
  if (deflectionRank === 1) {
    positive += DIRECT_VULNERABILITY_BONUS.vulnerabilityDeflectionTop1;
    drivers.push("Q-V1: vulnerability_deflection top-1 (suppression)");
  } else if (deflectionRank === 2) {
    positive += DIRECT_VULNERABILITY_BONUS.vulnerabilityDeflectionTop2;
    drivers.push("Q-V1: vulnerability_deflection top-2 (suppression)");
  }
  const perfIdentityRank = rankOfSignalFromQuestion(
    signals,
    "performance_identity",
    "Q-V1"
  );
  if (perfIdentityRank === 1) {
    positive += DIRECT_VULNERABILITY_BONUS.performanceIdentityTop1;
    drivers.push("Q-V1: performance_identity top-1 (suppression)");
  } else if (perfIdentityRank === 2) {
    positive += DIRECT_VULNERABILITY_BONUS.performanceIdentityTop2;
    drivers.push("Q-V1: performance_identity top-2 (suppression)");
  }
  const goalLogicVRank = rankOfSignalFromQuestion(
    signals,
    "goal_logic_explanation",
    "Q-V1"
  );
  if (goalLogicVRank === 1) {
    positive += DIRECT_VULNERABILITY_BONUS.goalLogicExplanationTop1;
    drivers.push("Q-V1: goal_logic_explanation top-1 (mild suppression)");
  } else if (goalLogicVRank === 2) {
    positive += DIRECT_VULNERABILITY_BONUS.goalLogicExplanationTop2;
    drivers.push("Q-V1: goal_logic_explanation top-2 (mild suppression)");
  }

  // Re-center: positive sums to up to ~85; subtract penalty (≤15); subtract
  // 35 to slide the midpoint so that "neutral evidence" lands at 0. Clamp
  // to [-50, +50].
  const raw = positive - penalty - 35;
  const score = Math.max(-50, Math.min(50, raw));
  return { score: Math.round(score), drivers };
}

// ── Gripping cluster (spec §4) ──────────────────────────────────────────
//
// Exported as a pure helper so the audit script can test it directly.
// Required cluster:
//   1. Q-Stakes1 weighted high on money/job/reputation (top-1 OR top-2)
//      AND close_relationships NOT top-1 (legitimate-stakes guard).
//   2. ≥ 2 of (hides_belief, adapts_under_economic_pressure,
//      adapts_under_social_pressure, chaos_exposure).
//   3. Vulnerability score < threshold (net-closed: < 0).
//   4. Thin Soul-line — Q-E1-inward "caring" NOT top-1 AND Q-S2 top-2
//      contains none of {compassion, mercy, family, faith}.

export function grippingClusterFires(
  signals: Signal[],
  vulnerabilityScore: number
): boolean {
  // (1) Stakes condition.
  const stakesIds: SignalId[] = [
    "money_stakes_priority",
    "job_stakes_priority",
    "reputation_stakes_priority",
  ];
  const stakesTop12 = stakesIds.some((id) => hasSignalAtRank(signals, id, 2));
  const closeRelTop1 = signals.some(
    (s) =>
      s.signal_id === "close_relationships_stakes_priority" &&
      s.rank === 1 &&
      s.source_question_ids.includes("Q-Stakes1")
  );
  if (!stakesTop12 || closeRelTop1) return false;

  // (2) Pressure-adaptation cluster ≥ 2.
  const pressureIds: SignalId[] = [
    "hides_belief",
    "adapts_under_economic_pressure",
    "adapts_under_social_pressure",
    "chaos_exposure",
  ];
  const pressureCount = pressureIds.filter((id) => hasSignal(signals, id)).length;
  if (pressureCount < 2) return false;

  // (3) Vulnerability negative.
  if (vulnerabilityScore >= VULNERABILITY_SUFFICIENT_THRESHOLD) return false;

  // (4) Thin Soul-line.
  const caringTop1 = signals.some(
    (s) =>
      s.signal_id === "caring_energy_priority" &&
      s.rank === 1 &&
      s.source_question_ids.includes("Q-E1-inward")
  );
  if (caringTop1) return false;
  const qs2SoulIds: SignalId[] = [
    "compassion_priority",
    "mercy_priority",
    "family_priority",
    "faith_priority",
  ];
  const qs2SoulInTop2 = qs2SoulIds.some((id) => {
    const r = rankOfSignalFromQuestion(signals, id, "Q-S2");
    return r !== undefined && r <= 2;
  });
  if (qs2SoulInTop2) return false;

  return true;
}

// ── Quadrant placement (CC-071 — parallel_lives removed) ───────────────
//
// Reads ADJUSTED goal/soul (post-asymmetric-lift). The compartmentalized
// high-G + high-S + thin-V case used to fork to a "Parallel Lives" branch;
// with the asymmetric lift in place, low Vulnerability suppresses
// adjusted_soul before this comparison reaches `soul_high`, so the user
// lands in SE Goal-leaning instead of falsely scoring NE Giving. The math
// captures the diagnostic; no separate label needed (spec §7, §9, §12.11).

function placeQuadrant(
  adjustedGoal: number,
  adjustedSoul: number,
  clusterFires: boolean,
  confidence: GoalSoulEvidence["confidence"]
): GoalSoulQuadrant {
  // Low-confidence sessions fall through to Neutral copy regardless of
  // numeric quadrant placement (spec §AC-10 from CC-067).
  if (confidence === "low") return "neutral";

  const goalHigh = adjustedGoal >= GOAL_HIGH_THRESHOLD;
  const soulHigh = adjustedSoul >= SOUL_HIGH_THRESHOLD;

  if (goalHigh && soulHigh) return "give";
  if (goalHigh && !soulHigh) return "striving";
  if (!goalHigh && soulHigh) return "longing";
  if (clusterFires) return "gripping";
  return "neutral";
}

// ── CC-071 — Gripping Pull (spec §7, dashboard-visible) ─────────────────
//
// Independent of quadrant placement. Names the strength of the defensive-
// cluster signals firing for this user (0–100), with a human-readable
// signal list. A user can have moderate Gripping Pull (e.g., 30–50)
// without being in the SW Gripping quadrant — they're not stuck, but the
// cluster is partially active.
//
// Formula:
//   25 × (Q-Stakes1 money | job | reputation in top-1)
// + 15 × (Q-Stakes1 money | job | reputation in top-2 but not top-1)
// + 10 × each pressure-adaptation signal firing (capped at 30)
// + 25 × (vulnerability_composite < 0)
// + 20 × (raw_soul < 35)
// → clamped to [0, 100]

export const GRIPPING_PULL_WEIGHTS = {
  stakesTop1: 25,
  stakesTop2NotTop1: 15,
  pressureAdaptationPerSignal: 10,
  pressureAdaptationCap: 30,
  vulnerabilityNegative: 25,
  thinSoul: 20,
  thinSoulThreshold: 35, // raw_soul < this triggers the +20
} as const;

export function computeGrippingPull(
  signals: Signal[],
  vulnerabilityScore: number,
  rawSoulScore: number
): GrippingPull {
  const firedSignals: GrippingPullSignal[] = [];
  let score = 0;

  // Stakes — the loss-aversion register. Top-1 weighs more than top-2.
  const stakesIds: SignalId[] = [
    "money_stakes_priority",
    "job_stakes_priority",
    "reputation_stakes_priority",
  ];
  const STAKES_HUMAN: Record<string, string> = {
    money_stakes_priority: "Money/wealth stakes elevated",
    job_stakes_priority: "Job/career stakes elevated",
    reputation_stakes_priority: "Reputation stakes elevated",
  };
  // Find each top-N stakes signal individually so the named-signal list
  // names the specific stake, not the generic category.
  let stakesTop1Counted = false;
  let stakesTop2Counted = false;
  for (const id of stakesIds) {
    if (
      signals.some(
        (s) =>
          s.signal_id === id &&
          s.rank === 1 &&
          s.source_question_ids.includes("Q-Stakes1")
      )
    ) {
      if (!stakesTop1Counted) {
        score += GRIPPING_PULL_WEIGHTS.stakesTop1;
        stakesTop1Counted = true;
      }
      firedSignals.push({ id, humanReadable: STAKES_HUMAN[id] });
    } else if (
      signals.some(
        (s) =>
          s.signal_id === id &&
          s.rank === 2 &&
          s.source_question_ids.includes("Q-Stakes1")
      )
    ) {
      if (!stakesTop1Counted && !stakesTop2Counted) {
        score += GRIPPING_PULL_WEIGHTS.stakesTop2NotTop1;
        stakesTop2Counted = true;
      }
      firedSignals.push({ id, humanReadable: STAKES_HUMAN[id] });
    }
  }

  // Pressure-adaptation cluster. Each firing signal contributes; total
  // capped at 30.
  const pressureMap: Array<{ id: SignalId; humanReadable: string }> = [
    { id: "hides_belief", humanReadable: "Conviction concealment under pressure" },
    {
      id: "adapts_under_economic_pressure",
      humanReadable: "Pressure adaptation under economic stress",
    },
    {
      id: "adapts_under_social_pressure",
      humanReadable: "Pressure adaptation under social stress",
    },
    { id: "chaos_exposure", humanReadable: "Formation in chaotic conditions" },
  ];
  let pressureContribution = 0;
  for (const p of pressureMap) {
    if (hasSignal(signals, p.id)) {
      pressureContribution += GRIPPING_PULL_WEIGHTS.pressureAdaptationPerSignal;
      firedSignals.push({ id: p.id, humanReadable: p.humanReadable });
    }
  }
  score += Math.min(
    GRIPPING_PULL_WEIGHTS.pressureAdaptationCap,
    pressureContribution
  );

  // Vulnerability net-negative.
  if (vulnerabilityScore < 0) {
    score += GRIPPING_PULL_WEIGHTS.vulnerabilityNegative;
    firedSignals.push({
      id: "vulnerability_negative",
      humanReadable: "Limited openness signal",
    });
  }

  // Thin Soul-line (raw, not adjusted — the gap is what's measured here).
  if (rawSoulScore < GRIPPING_PULL_WEIGHTS.thinSoulThreshold) {
    score += GRIPPING_PULL_WEIGHTS.thinSoul;
    firedSignals.push({
      id: "raw_soul_thin",
      humanReadable: "Thin love-line evidence",
    });
  }

  // CC-Q2 — Q-GRIP1 direct grip-target signals. Each ranked grips_* signal
  // contributes per rank tier; total Q-GRIP1 contribution capped at
  // `gripsCap` so a user gripping every option doesn't saturate. The
  // human-readable form names the specific grip ("Grips control under
  // pressure", "Grips approval", etc.) so the dashboard surface is
  // diagnostic, not just numeric.
  const GRIPS_HUMAN: Record<string, string> = {
    grips_control: "Grips control under pressure",
    grips_security: "Grips money / security under pressure",
    grips_reputation: "Grips reputation under pressure",
    grips_certainty: "Grips being right under pressure",
    grips_neededness: "Grips being needed under pressure",
    grips_comfort: "Grips comfort or escape under pressure",
    grips_old_plan: "Grips a plan that used to work under pressure",
    grips_approval: "Grips approval of specific people under pressure",
  };
  let gripsContribution = 0;
  for (const id of Object.keys(GRIPS_HUMAN) as SignalId[]) {
    const r = rankOfSignalFromQuestion(signals, id, "Q-GRIP1");
    if (r === undefined) continue;
    let weight = 0;
    if (r === 1) weight = DIRECT_GRIPPING_PULL_BONUS.gripsTop1;
    else if (r === 2) weight = DIRECT_GRIPPING_PULL_BONUS.gripsTop2;
    else if (r === 3) weight = DIRECT_GRIPPING_PULL_BONUS.gripsTop3;
    else weight = DIRECT_GRIPPING_PULL_BONUS.gripsRank4Plus;
    gripsContribution += weight;
    // Surface only top-3 grips on the named signal list; deeper ranks
    // contribute small numerical weight but stay off the dashboard label
    // line so the user-facing list stays readable.
    if (r <= 3) {
      firedSignals.push({ id, humanReadable: GRIPS_HUMAN[id] });
    }
  }
  score += Math.min(
    DIRECT_GRIPPING_PULL_BONUS.gripsCap,
    gripsContribution
  );

  // CC-Q2 — Q-GS1 gripping_proof_signal (proving-capability register).
  const grippingProofRank = rankOfSignalFromQuestion(
    signals,
    "gripping_proof_signal",
    "Q-GS1"
  );
  if (grippingProofRank === 1) {
    score += DIRECT_GRIPPING_PULL_BONUS.grippingProofTop1;
    firedSignals.push({
      id: "gripping_proof_signal",
      humanReadable: "Proving-capability register active",
    });
  } else if (grippingProofRank !== undefined && grippingProofRank <= 3) {
    score += DIRECT_GRIPPING_PULL_BONUS.grippingProofTop2OrTop3;
    firedSignals.push({
      id: "gripping_proof_signal",
      humanReadable: "Proving-capability register present",
    });
  }

  // CC-Q2 — Q-V1 performance_identity. Pointing at output rather than
  // naming the why reads as a mild grip on the performance register.
  const perfIdentityGripRank = rankOfSignalFromQuestion(
    signals,
    "performance_identity",
    "Q-V1"
  );
  if (perfIdentityGripRank === 1) {
    score += DIRECT_GRIPPING_PULL_BONUS.performanceIdentityTop1;
    firedSignals.push({
      id: "performance_identity",
      humanReadable: "Performance-identity register active",
    });
  } else if (perfIdentityGripRank === 2) {
    score += DIRECT_GRIPPING_PULL_BONUS.performanceIdentityTop2;
    firedSignals.push({
      id: "performance_identity",
      humanReadable: "Performance-identity register present",
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    signals: firedSignals,
  };
}

// ── Closing prose templates (spec §10, post-CC-071 reframe) ─────────────
//
// Five distinct templates (CC-071 removed `parallel_lives` per spec §9 /
// §12.11 — the asymmetric lift now suppresses adjusted_soul, so the
// compartmentalized case lands in the SE region with the dashboard's
// Soul-score reading the integration gap).
//
// User-facing register: Work / Love / Give plus the named regions Giving
// (NE) and Gripping (SW). SE and NW are described with the *Work-leaning*
// / *Love-leaning* descriptors per spec §12.7 — *Striving* and *Longing*
// remain engine-internal labels and never appear in user-facing prose
// (CC-071 OOS §8). Engine vocabulary (Goal / Soul / Vulnerability) does not
// appear anywhere in these templates; "the instrument" over "the model";
// "giving" over "generativity"; each template names a bridge.
//
// Word count and bridge-phrase presence are enforced by the audit
// (tests/audit/goalSoulGive.audit.ts).

const PROSE_TEMPLATES: Record<GoalSoulQuadrant, string> = {
  give:
    "Your verbs and your nouns appear to be pulling in the same direction. " +
    "What you build, who you serve, and what you protect are not living in three different rooms. " +
    "The instrument reads this as the early shape of giving — work taking the form of love, love taking the form of work. " +
    "Whatever you're moving toward next, the conditions are here for it to mean what you want it to mean. " +
    "The work is to keep this shape honest as the seasons turn.",

  // CC-068 wrap-compat — first sentence and last sentence are written as
  // self-contained register frames, so a future Defensive Builder kicker
  // can prefix the opener or suffix the closer without breaking the read.
  // The middle three sentences carry the load-bearing observation + bridge.
  // CC-071 reframe — replaces "Striving is capable but unfinished" with
  // "This is a Work-leaning shape, capable but unfinished" per spec §12.7
  // (Striving remains engine-internal; the user-facing register is the
  // Work-leaning descriptor).
  striving:
    "Your form is strong; your purpose is still forming. " +
    "The instrument sees consistent productive motion — building, solving, executing — without yet a clear love-line connecting it to what you protect. " +
    "This is a Work-leaning shape: capable but unfinished, and the work is not more output. " +
    "The completion is to anchor the output in what you actually love: to let the people, the cause, or the calling that already claims you become the reason the building is happening at all. " +
    "The next move is rarely to push harder — it is to find that anchor.",

  // CC-071 reframe — replaces "Longing is not weakness" with "This is a
  // Love-leaning shape — love-line ahead of form" per spec §12.7.
  longing:
    "What you love is clear. The form is still forming. " +
    "The instrument sees deep relational and moral signal without yet the structure or motion that would let it land in the world for someone other than you. " +
    "This is a Love-leaning shape — love-line ahead of form, not weakness, but love that hasn't yet been incarnated. " +
    "The completion is form: the structure, habit, work, or commitment that lets what you love become real to a person other than yourself. " +
    "The next move is to give that love a body.",

  gripping:
    "The instrument is reading defensive pressure right now. " +
    "What you're holding appears to be held against loss more than for love or motion. " +
    "This may be a season rather than a shape — that posture rarely names a person; more often it names a moment they're inside. " +
    "The way out is rarely more holding. " +
    "The next move, when there is energy for it, is to find one place where a slightly more open hand produces less collapse, not more.",

  neutral:
    "The signal here is quiet. " +
    "That is not a verdict — sometimes the instrument is reading a season of rest, recovery, or transition rather than a settled shape. " +
    "The body-map cards above still hold. " +
    "The synthesis read may become more useful after another pass, or after the season changes. " +
    "The next move is not to force a verdict where the evidence is thin — it is to let the picture clarify on its own time.",
};

// Exported for inspection / acceptance criterion #13.
export const GOAL_SOUL_GIVE_PROSE_TEMPLATES = PROSE_TEMPLATES;

function generateProse(quadrant: GoalSoulQuadrant): string {
  return PROSE_TEMPLATES[quadrant];
}

// ── Top-level: full GoalSoulGiveOutput, or undefined when insufficient ──

export function computeGoalSoulGive(
  signals: Signal[],
  answers: Answer[]
): GoalSoulGiveOutput | undefined {
  // Insufficiency guards (CC-067 acceptance §AC-4).
  if (signals.length < MIN_SIGNALS_FOR_OUTPUT) return undefined;
  if (!hasE1Evidence(signals)) return undefined;

  const goal = computeGoalScore(signals, answers);
  const soul = computeSoulScore(signals, answers);
  const vulnerability = computeVulnerabilityScore(signals, answers);

  const totalDriverCount =
    goal.drivers.length +
    soul.drivers.length +
    vulnerability.drivers.length;
  let confidence: GoalSoulEvidence["confidence"];
  if (totalDriverCount >= HIGH_CONFIDENCE_SIGNAL_COUNT) confidence = "high";
  else if (totalDriverCount >= MIN_SIGNALS_FOR_OUTPUT) confidence = "medium";
  else confidence = "low";

  // CC-071 — asymmetric lift. Quadrant placement reads ADJUSTED scores;
  // raw scores are preserved for audit/debug (acceptance §AC-1, §AC-11).
  const rawScores: GoalSoulRawScores = {
    goal: goal.score,
    soul: soul.score,
    vulnerability: vulnerability.score,
  };
  const adjustedScores = applyAsymmetricLift(
    rawScores.goal,
    rawScores.soul,
    rawScores.vulnerability
  );

  const clusterFires = grippingClusterFires(signals, vulnerability.score);

  const quadrant = placeQuadrant(
    adjustedScores.goal,
    adjustedScores.soul,
    clusterFires,
    confidence
  );

  // CC-071 — Gripping Pull is computed alongside the quadrant. Always
  // present; score may be 0 with empty signal list.
  const grippingPull = computeGrippingPull(
    signals,
    rawScores.vulnerability,
    rawScores.soul
  );

  const evidence: GoalSoulEvidence = {
    goalDrivers: goal.drivers,
    soulDrivers: soul.drivers,
    vulnerabilityDrivers: vulnerability.drivers,
    grippingClusterFires: clusterFires,
    confidence,
  };

  return {
    rawScores,
    adjustedScores,
    quadrant,
    evidence,
    prose: generateProse(quadrant),
    grippingPull,
  };
}
