// CC-AIM-REBUILD-MOVEMENT-LIMITER — Segment 3.
//
// Splits the legacy additive `grippingPull.score` into two independent
// substrates:
//
//   StakesLoad     — objective stakes (what is actually on the line)
//   DefensiveGrip  — subjective collapse (how the stakes hijack the
//                    person)
//
// And composes the canonical multiplicative Grip:
//
//   Grip = DefensiveGrip × StakesAmplifier(StakesLoad)
//
// Per canon (docs/canon/trajectory-model-refinement.md §13):
// "high stakes amplify Grip ONLY when defensive signals are also
// present. Stakes alone are not fear."
//
// The legacy `grippingPull.score` (additive) remains unchanged for
// backward compatibility; this module produces additional fields that
// downstream consumers can switch to in a future CC.
//
// Pure data — no API calls, no SDK, no `node:*` imports.

import type { Signal, SignalId } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

export const MAX_STAKES_AMPLIFICATION = 0.5;

const HEAVY_STAKES: SignalId[] = [
  "money_stakes_priority",
  "job_stakes_priority",
  "reputation_stakes_priority",
];

const PRESSURE_ADAPTATION_IDS: SignalId[] = [
  "hides_belief",
  "adapts_under_economic_pressure",
  "adapts_under_social_pressure",
  "chaos_exposure",
];

const Q_GRIP1_IDS: SignalId[] = [
  "grips_control",
  "grips_security",
  "grips_reputation",
  "grips_certainty",
  "grips_old_plan",
  "grips_comfort",
  "grips_approval",
  "grips_neededness",
];

// CC-GRIP-SIGNAL-WEIGHTING — Segment A. Per canon §13, classically
// defensive grips (control / certainty / money-as-fear / pattern-
// rigidity) weight heavier than relational/avoidance grips (being-
// needed / approval / reputation / comfort). Identity of the named
// grip drives DefensiveGrip — not just position. Relational grips
// also route partly to StakesLoad (Segment B) so their composed-grip
// contribution flows through stakes amplification rather than the
// defensive-register substrate.
export const Q_GRIP1_DEFENSIVE_WEIGHTS: Record<SignalId, number> = {
  grips_control: 1.5, // classical defensive — highest
  grips_certainty: 1.4, // being-right under pressure
  grips_security: 1.3, // money-as-fear (money-as-stake lives in StakesLoad)
  grips_old_plan: 1.2, // pattern-rigidity under pressure
  grips_comfort: 0.6, // avoidance, not defensive collapse
  grips_neededness: 0.7, // relational — partly stakes (Segment B)
  grips_approval: 0.6, // relational — partly stakes (Segment B)
  grips_reputation: 0.5, // almost entirely stakes register
};

// CC-GRIP-SIGNAL-WEIGHTING — Segment B. Relational grips name
// relational stakes (being-needed = social belonging on the line).
// Per canon §13 they belong to the StakesLoad substrate alongside
// heavy material stakes. Bumps are scaled by rank in Q-GRIP1 top-3.
export const RELATIONAL_GRIP_STAKES_BUMP: Record<SignalId, number> = {
  grips_neededness: 12, // being-needed @ rank 1
  grips_approval: 10, // approval @ rank 1
  grips_reputation: 8, // reputation @ rank 1 (already partly in HEAVY_STAKES)
};

// CC-GRIP-SIGNAL-WEIGHTING — Segment C. Q-3C2 rank-1 channels into
// Grip composition per the option's classical-vs-stakes register.
// Money/margin protects-first reads classical defensive AND a stake;
// safety/rules reads classical defensive; reputation / dependents /
// building-progress route to stakes; rest/health does not contribute.
export const Q3C2_GRIP_CHANNEL: Record<
  SignalId,
  "defensive" | "stakes" | "both" | "none"
> = {
  revealed_cost_priority: "both", // Money / margin / financial options
  revealed_compliance_priority: "defensive", // Safety / rules / risk control
  revealed_reputation_priority: "stakes", // Reputation / standing
  revealed_coverage_priority: "stakes", // Time / presence with dependents
  revealed_goal_priority: "stakes", // Progress on building
  revealed_recovery_priority: "none", // Rest / health
};

export const Q3C2_GRIP_BUMP_POINTS = 5;

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function hasSignal(signals: Signal[], id: SignalId): boolean {
  return signals.some((s) => s.signal_id === id);
}

function rankOfSignalFromQuestion(
  signals: Signal[],
  signalId: SignalId,
  questionId: string
): number | undefined {
  const hit = signals.find(
    (s) =>
      s.signal_id === signalId && s.source_question_ids.includes(questionId)
  );
  return hit?.rank;
}

// ─────────────────────────────────────────────────────────────────────
// StakesLoad
// ─────────────────────────────────────────────────────────────────────

export interface StakesLoadReading {
  score: number;
  topStakes: string[];
  rationale: string;
}

export function computeStakesLoad(signals: Signal[]): StakesLoadReading {
  let score = 0;
  const top: { id: SignalId; rank: number }[] = [];
  for (const id of HEAVY_STAKES) {
    const rank = rankOfSignalFromQuestion(signals, id, "Q-Stakes1");
    if (rank !== undefined) top.push({ id, rank });
  }
  top.sort((a, b) => a.rank - b.rank);
  if (top.length >= 1 && top[0].rank === 1) score += 50;
  else if (top.length >= 1 && top[0].rank === 2) score += 30;
  if (top.length >= 2 && top[1].rank <= 3) score += 30;
  // A third heavy stake in top-3 contributes lightly.
  if (top.length >= 3 && top[2].rank <= 3) score += 10;
  // Other stakes outside HEAVY_STAKES — close_relationships_stakes_priority
  // at top-1 reads as an emotionally-heavy stake that nudges the load.
  const closeRel = rankOfSignalFromQuestion(
    signals,
    "close_relationships_stakes_priority",
    "Q-Stakes1"
  );
  if (closeRel === 1) score += 10;

  // CC-GRIP-SIGNAL-WEIGHTING — Segment B. Relational grips in Q-GRIP1
  // top-3 augment StakesLoad: being-needed / approval / reputation
  // name relational stakes that belong to the stakes substrate.
  const relationalBumps: string[] = [];
  let relationalStakesBump = 0;
  for (const id of [
    "grips_neededness",
    "grips_approval",
    "grips_reputation",
  ] as const) {
    const rank = rankOfSignalFromQuestion(signals, id, "Q-GRIP1");
    if (rank === undefined) continue;
    const base = RELATIONAL_GRIP_STAKES_BUMP[id] ?? 0;
    const rankScale =
      rank === 1 ? 1.0 : rank === 2 ? 0.6 : rank === 3 ? 0.3 : 0;
    const contribution = base * rankScale;
    if (contribution > 0) {
      relationalStakesBump += contribution;
      relationalBumps.push(`${id}@${rank}=${contribution.toFixed(1)}`);
    }
  }
  score += relationalStakesBump;

  // CC-GRIP-SIGNAL-WEIGHTING — Segment C. Q-3C2 rank-1 channels: when
  // the option routes to "stakes" or "both", bump StakesLoad.
  let q3c2StakesBump = 0;
  let q3c2StakesId: string | null = null;
  for (const [id, channel] of Object.entries(Q3C2_GRIP_CHANNEL) as Array<
    [SignalId, "defensive" | "stakes" | "both" | "none"]
  >) {
    if (channel !== "stakes" && channel !== "both") continue;
    const rank = rankOfSignalFromQuestion(signals, id, "Q-3C2");
    if (rank !== 1) continue;
    q3c2StakesBump = Q3C2_GRIP_BUMP_POINTS;
    q3c2StakesId = id;
    break;
  }
  score += q3c2StakesBump;

  const finalScore = Math.round(clamp(score, 0, 100) * 10) / 10;
  const parts = [
    `heavy stakes top-3 (${top.map((t) => `${t.id}@${t.rank}`).join(", ") || "none"})`,
  ];
  if (relationalStakesBump > 0)
    parts.push(`relational-grip bump=${relationalStakesBump.toFixed(1)} (${relationalBumps.join(", ")})`);
  if (q3c2StakesBump > 0)
    parts.push(`Q-3C2-stakes bump=${q3c2StakesBump} (${q3c2StakesId})`);
  return {
    score: finalScore,
    topStakes: top.slice(0, 3).map((t) => t.id),
    rationale: `StakesLoad=${finalScore.toFixed(1)} from ${parts.join("; ")}.`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// DefensiveGrip
// ─────────────────────────────────────────────────────────────────────

export interface DefensiveGripReading {
  score: number;
  components: {
    pressureAdaptation: number;
    vulnerabilityNegative: number;
    thinSoul: number;
    qGrip1: number;
    qGS1ProvingProof: number;
    qV1PerformanceIdentity: number;
    /** CC-GRIP-SIGNAL-WEIGHTING — Segment C. Q-3C2 rank-1 defensive bump
     *  (0 or `Q3C2_GRIP_BUMP_POINTS` when rank-1 routes to defensive/both). */
    q3c2Defensive: number;
  };
  rationale: string;
}

export function computeDefensiveGrip(inputs: {
  signals: Signal[];
  vulnerability: number;
  rawSoulScore: number;
}): DefensiveGripReading {
  const { signals, vulnerability, rawSoulScore } = inputs;

  const pressureCount = PRESSURE_ADAPTATION_IDS.filter((id) =>
    hasSignal(signals, id)
  ).length;
  const pressureAdaptation = Math.min(30, pressureCount * 10);

  const vulnerabilityNegative = vulnerability < 0 ? 25 : 0;
  const thinSoul = rawSoulScore < 35 ? 20 : 0;

  // CC-GRIP-SIGNAL-WEIGHTING — Segment A. Position score × identity
  // weight per signal. Classical-defensive grips weight up; relational
  // grips weight down (they route through StakesLoad — Segment B).
  let qGrip1Raw = 0;
  const qGrip1Trace: string[] = [];
  for (const id of Q_GRIP1_IDS) {
    const rank = rankOfSignalFromQuestion(signals, id, "Q-GRIP1");
    if (rank === undefined) continue;
    const weight = Q_GRIP1_DEFENSIVE_WEIGHTS[id] ?? 1.0;
    let positionScore: number;
    if (rank === 1) positionScore = 8;
    else if (rank === 2) positionScore = 5;
    else if (rank === 3) positionScore = 3;
    else positionScore = 1;
    const contribution = positionScore * weight;
    qGrip1Raw += contribution;
    qGrip1Trace.push(
      `${id}@${rank}(${positionScore}×${weight}=${contribution.toFixed(1)})`
    );
  }
  const qGrip1 = Math.min(25, Math.round(qGrip1Raw * 10) / 10);

  const gripProofRank = rankOfSignalFromQuestion(
    signals,
    "gripping_proof_signal",
    "Q-GS1"
  );
  const qGS1ProvingProof =
    gripProofRank === 1 ? 5 : gripProofRank && gripProofRank <= 3 ? 2 : 0;

  const perfIdRank = rankOfSignalFromQuestion(
    signals,
    "performance_identity",
    "Q-V1"
  );
  const qV1PerformanceIdentity =
    perfIdRank === 1 ? 4 : perfIdRank === 2 ? 2 : 0;

  // CC-GRIP-SIGNAL-WEIGHTING — Segment C. Q-3C2 rank-1 defensive channel.
  let q3c2Defensive = 0;
  let q3c2DefensiveId: string | null = null;
  for (const [id, channel] of Object.entries(Q3C2_GRIP_CHANNEL) as Array<
    [SignalId, "defensive" | "stakes" | "both" | "none"]
  >) {
    if (channel !== "defensive" && channel !== "both") continue;
    const rank = rankOfSignalFromQuestion(signals, id, "Q-3C2");
    if (rank !== 1) continue;
    q3c2Defensive = Q3C2_GRIP_BUMP_POINTS;
    q3c2DefensiveId = id;
    break;
  }

  const raw =
    pressureAdaptation +
    vulnerabilityNegative +
    thinSoul +
    qGrip1 +
    qGS1ProvingProof +
    qV1PerformanceIdentity +
    q3c2Defensive;
  const score = Math.round(clamp(raw, 0, 100) * 10) / 10;

  const parts = [
    `pressure=${pressureAdaptation}`,
    `vulnNeg=${vulnerabilityNegative}`,
    `thinSoul=${thinSoul}`,
    `qGrip1=${qGrip1} [${qGrip1Trace.join(", ") || "none"}]`,
    `gripProof=${qGS1ProvingProof}`,
    `perfId=${qV1PerformanceIdentity}`,
  ];
  if (q3c2Defensive > 0) parts.push(`q3c2-defensive=${q3c2Defensive} (${q3c2DefensiveId})`);

  return {
    score,
    components: {
      pressureAdaptation,
      vulnerabilityNegative,
      thinSoul,
      qGrip1,
      qGS1ProvingProof,
      qV1PerformanceIdentity,
      q3c2Defensive,
    },
    rationale: `DefensiveGrip=${score.toFixed(1)} (${parts.join(", ")}).`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Multiplicative Grip composition
// ─────────────────────────────────────────────────────────────────────

// CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT — §13 defensive-floor gate.
// CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — floor raised from 20 → 25 so
// the canonical low-defensive shape (Jason, defensiveGrip 21) cleanly
// produces amplifier === 1.0 rather than 1.05. Canon §13 intent: low
// defensive register implies no stakes amplification at all.
export const DEFENSIVE_GRIP_AMPLIFIER_FLOOR = 25;

export function computeStakesAmplifier(
  stakesLoad: number,
  defensiveGrip: number = 100
): number {
  if (defensiveGrip < DEFENSIVE_GRIP_AMPLIFIER_FLOOR) return 1.0;
  const clamped = clamp(stakesLoad, 0, 100);
  return 1 + (clamped / 100) * MAX_STAKES_AMPLIFICATION;
}

export interface GripFromDefensiveReading {
  grip: number;
  amplifier: number;
  rationale: string;
}

export function computeGripFromDefensive(
  defensiveGrip: number,
  stakesLoad: number
): GripFromDefensiveReading {
  const amplifier = computeStakesAmplifier(stakesLoad, defensiveGrip);
  const raw = defensiveGrip * amplifier;
  const grip = Math.round(clamp(raw, 0, 100) * 10) / 10;
  return {
    grip,
    amplifier: Math.round(amplifier * 1000) / 1000,
    rationale: `Grip = DefensiveGrip ${defensiveGrip.toFixed(1)} × amplifier ${amplifier.toFixed(3)} (from StakesLoad ${stakesLoad.toFixed(1)}, defensive-floor=${DEFENSIVE_GRIP_AMPLIFIER_FLOOR}) = ${grip.toFixed(1)}.`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Canonical GripReading — §13 multiplicative composition exposed as a
// single integrated reading.
// ─────────────────────────────────────────────────────────────────────

export interface GripReading {
  /** Composed multiplicative Grip = defensiveGrip × amplifier, clamped. */
  score: number;
  components: {
    defensiveGrip: number; // 0-100
    stakesLoad: number; // 0-100
    amplifier: number; // [1.0, 1.5]
  };
  rationale: string;
}

/** computeGrip — canonical §13 reading. Accepts the pre-computed
 *  decomposed components (DefensiveGrip + StakesLoad) and returns the
 *  composed multiplicative Grip. */
export function computeGrip(
  defensiveGrip: number,
  stakesLoad: number
): GripReading {
  const amplifier = computeStakesAmplifier(stakesLoad, defensiveGrip);
  const score = Math.round(clamp(defensiveGrip * amplifier, 0, 100) * 10) / 10;
  return {
    score,
    components: {
      defensiveGrip,
      stakesLoad,
      amplifier: Math.round(amplifier * 1000) / 1000,
    },
    rationale: `Grip ${score.toFixed(1)} = DefensiveGrip ${defensiveGrip.toFixed(1)} × amplifier ${amplifier.toFixed(3)} (StakesLoad ${stakesLoad.toFixed(1)}; floor=${DEFENSIVE_GRIP_AMPLIFIER_FLOOR}).`,
  };
}
