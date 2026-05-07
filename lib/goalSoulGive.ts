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
  GoalSoulEvidence,
  GoalSoulGiveOutput,
  GoalSoulQuadrant,
  GoalSoulScores,
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

// ── Threshold constants ─────────────────────────────────────────────────

export const GOAL_HIGH_THRESHOLD = 50;
export const SOUL_HIGH_THRESHOLD = 50;
export const VULNERABILITY_SUFFICIENT_THRESHOLD = 0;
export const MIN_SIGNALS_FOR_OUTPUT = 8;
export const HIGH_CONFIDENCE_SIGNAL_COUNT = 12;

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

// ── Quadrant placement ──────────────────────────────────────────────────

function placeQuadrant(
  goalScore: number,
  soulScore: number,
  vulnerabilityScore: number,
  clusterFires: boolean,
  confidence: GoalSoulEvidence["confidence"]
): GoalSoulQuadrant {
  // Low-confidence sessions fall through to Neutral copy regardless of
  // numeric quadrant placement (spec §AC-10).
  if (confidence === "low") return "neutral";

  const goalHigh = goalScore >= GOAL_HIGH_THRESHOLD;
  const soulHigh = soulScore >= SOUL_HIGH_THRESHOLD;
  const vulnSufficient =
    vulnerabilityScore >= VULNERABILITY_SUFFICIENT_THRESHOLD;

  if (goalHigh && soulHigh && vulnSufficient) return "give";
  if (goalHigh && soulHigh && !vulnSufficient) return "parallel_lives";
  if (goalHigh && !soulHigh) return "striving";
  if (!goalHigh && soulHigh) return "longing";
  if (clusterFires) return "gripping";
  return "neutral";
}

// ── Closing prose templates (spec §10, polished CC-068) ─────────────────
//
// Six distinct templates. User-facing register: Work / Love / Give plus the
// named regions Striving / Longing / Purpose. Engine vocabulary (Goal /
// Soul / Vulnerability) NEVER appears. Engine-internal pattern names
// ("Parallel Lives", "Defensive Builder", "Gripper", "Gripping" capitalized
// as a label) do NOT appear either; the gripping quadrant uses "defensive
// pressure" plus "a season rather than a shape" to soften the verdict.
// Spec §10 register guidance: "the instrument" over "the model"; "giving"
// over "generativity". Each template names a bridge — the work, the way,
// the bridge, the completion, the next move, or the willingness — so the
// closing reads as honest companionship rather than a verdict.
//
// Word count and bridge-phrase presence are enforced by the audit
// (tests/audit/goalSoulGive.audit.ts); see acceptance §AC-2, §AC-9, §AC-14.

const PROSE_TEMPLATES: Record<GoalSoulQuadrant, string> = {
  give:
    "Your verbs and your nouns appear to be pulling in the same direction. " +
    "What you build, who you serve, and what you protect are not living in three different rooms. " +
    "The instrument reads this as the early shape of giving — work taking the form of love, love taking the form of work. " +
    "Whatever you're moving toward next, the conditions are here for it to mean what you want it to mean. " +
    "The work is to keep this shape honest as the seasons turn.",

  // CC-068 wrap-compat — first sentence ("Your form is strong; your purpose
  // is still forming.") and last sentence ("The next move is rarely to push
  // harder — it is to find that anchor.") are intentionally written as
  // self-contained register frames, so a future CC-C Defensive Builder
  // kicker can prefix the opener or suffix the closer without breaking the
  // read. The middle three sentences carry the load-bearing observation +
  // bridge; do not edit those without a paired audit-fixture pass.
  striving:
    "Your form is strong; your purpose is still forming. " +
    "The instrument sees consistent productive motion — building, solving, executing — without yet a clear love-line connecting it to what you protect. " +
    "Striving is capable but unfinished, and the work is not more output. " +
    "The completion is to anchor the output in what you actually love: to let the people, the cause, or the calling that already claims you become the reason the building is happening at all. " +
    "The next move is rarely to push harder — it is to find that anchor.",

  longing:
    "What you love is clear. The form is still forming. " +
    "The instrument sees deep relational and moral signal without yet the structure or motion that would let it land in the world for someone other than you. " +
    "Longing is not weakness — it is love that hasn't yet been incarnated. " +
    "The completion is form: the structure, habit, work, or commitment that lets what you love become real to a person other than yourself. " +
    "The next move is to give that love a body.",

  gripping:
    "The instrument is reading defensive pressure right now. " +
    "What you're holding appears to be held against loss more than for love or motion. " +
    "This may be a season rather than a shape — that posture rarely names a person; more often it names a moment they're inside. " +
    "The way out is rarely more holding. " +
    "The next move, when there is energy for it, is to find one place where a slightly more open hand produces less collapse, not more.",

  parallel_lives:
    "What you build and who you love both come through clearly — but the two appear to live in different rooms. " +
    "The verbs are strong. The nouns are strong. They don't yet inhabit the same space. " +
    "The bridge to giving isn't more building or more loving. " +
    "The bridge is the willingness to let the two halves of your life see each other — to let what you love watch what you build, and what you build serve what you love.",

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
  // Insufficiency guards (spec §AC-4).
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

  const clusterFires = grippingClusterFires(signals, vulnerability.score);

  const quadrant = placeQuadrant(
    goal.score,
    soul.score,
    vulnerability.score,
    clusterFires,
    confidence
  );

  const scores: GoalSoulScores = {
    goal: goal.score,
    soul: soul.score,
    vulnerability: vulnerability.score,
  };

  const evidence: GoalSoulEvidence = {
    goalDrivers: goal.drivers,
    soulDrivers: soul.drivers,
    vulnerabilityDrivers: vulnerability.drivers,
    grippingClusterFires: clusterFires,
    confidence,
  };

  return {
    scores,
    quadrant,
    evidence,
    prose: generateProse(quadrant),
  };
}
