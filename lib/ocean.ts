// CC-037 — OCEAN Derivation Framework.
//
// Big-5 personality dimensions (Openness / Conscientiousness / Extraversion /
// Agreeableness / Neuroticism) derived from existing signals. No new questions;
// the instrument's measurement footprint is unchanged. This file is the
// canonical home for the five-bucket OCEAN framework and the tagging table
// over existing signals.
//
// Architectural rules (do not relax without canon revision; see
// docs/canon/ocean-framework.md):
//   - Derivation only — no claimed vs revealed split. The user is never asked
//     to rank themselves on OCEAN.
//   - User-facing prose uses Big-5 terminology with one substitution: "N"
//     renders as "Emotional Reactivity (estimated)" rather than "Neuroticism."
//     The clinical-pejorative baggage of "Neuroticism" doesn't match the
//     instrument's tone (per result-writing-canon.md precedent — frame names
//     describe register, not pathologize).
//   - Neuroticism is shipped with explicit "estimated" framing because its
//     proxy signals are state/history-derived rather than trait-level. The
//     instrument doesn't directly measure trait-level emotional reactivity.
//   - Multi-tag splits divide weighted contribution 1/N across tagged buckets.
//   - Rank-aware weighting re-uses lib/drive.ts:weightFor for consistency. A
//     future tuning change to the ladder propagates to both frameworks at once.
//   - The Neuroticism-floor architecture is "weak floor": signals that should
//     read as low-N (stability_*, holds_internal_conviction, etc.) are tagged
//     C rather than as anti-N. The absence of positive-N signals lets low N
//     emerge organically, avoiding the math complexity of negative tags.

import type {
  Answer,
  OceanBucket,
  OceanCase,
  OceanDistribution,
  OceanOutput,
  Signal,
} from "./types";
import { weightFor } from "./drive";

// ── Canonical bucket order ──────────────────────────────────────────────
//
// Used for iteration and for deterministic tie-breaking on the largest-bucket
// rounding-drift correction.
const ORDER: OceanBucket[] = ["O", "C", "E", "A", "N"];

// ── Distribution-shape thresholds (named constants for visible tuning) ──

export const SINGLE_DOMINANT_PCT_THRESHOLD = 30;
export const SINGLE_DOMINANT_GAP_THRESHOLD_PP = 10;
export const TWO_DOMINANT_FLOOR_PCT = 22;
export const TWO_DOMINANT_GAP_THRESHOLD_PP = 5;
export const BALANCED_SPREAD_THRESHOLD_PP = 12;
export const N_ELEVATED_THRESHOLD_PCT = 22;

// ── Tagging table — SignalId → OCEAN bucket(s) ──────────────────────────
//
// Multi-tagged signals split-weight 1/N across their buckets at compute time.
// Empty arrays are deliberate "ambivalent on OCEAN" tags — they're the
// canonical equivalent of opting a signal out without leaving the omission
// implicit. See docs/canon/ocean-framework.md for per-signal rationale.

const SIGNAL_OCEAN_TAGS: Record<string, OceanBucket[]> = {
  // ── Lens (cognitive functions, Q-T1–T8) ──────────────────────────────
  ni: ["O"],
  ne: ["O", "E"],
  si: ["C"],
  se: ["E", "O"],
  ti: ["O", "C"],
  te: ["C", "E"],
  fi: ["A"],
  fe: ["A", "E"],

  // ── Compass: sacred values (Q-S1, Q-S2, post-CC-028) ─────────────────
  freedom_priority: ["O"],
  truth_priority: ["O", "C"],
  stability_priority: ["C"],
  loyalty_priority: ["A", "C"],
  peace_priority: ["A"],
  honor_priority: ["C"],
  family_priority: ["A"],
  knowledge_priority: ["O"],
  justice_priority: ["C", "A"],
  faith_priority: ["C"],
  compassion_priority: ["A"],
  mercy_priority: ["A"],

  // ── Compass: concrete stakes (Q-Stakes1, post-CC-043) ────────────────
  money_stakes_priority: ["C"],
  job_stakes_priority: ["C"],
  close_relationships_stakes_priority: ["A"],
  reputation_stakes_priority: ["E", "C"],
  health_stakes_priority: ["C"],

  // ── Allocation: money flow (Q-S3-close, Q-S3-wider) ──────────────────
  self_spending_priority: [], // intentionally untagged — direction-neutral on OCEAN
  family_spending_priority: ["A"],
  friends_spending_priority: ["E", "A"],
  social_spending_priority: ["E"],
  nonprofits_religious_spending_priority: ["A"],
  companies_spending_priority: ["C"],

  // ── Allocation: energy flow (Q-E1-outward, Q-E1-inward) ──────────────
  building_energy_priority: ["C", "O"],
  solving_energy_priority: ["C"],
  restoring_energy_priority: ["C"],
  caring_energy_priority: ["A"],
  learning_energy_priority: ["O"],
  enjoying_energy_priority: ["O", "E"],

  // ── Drive: claimed (Q-3C1) ───────────────────────────────────────────
  cost_drive: ["C"],
  coverage_drive: ["A"],
  compliance_drive: ["C"],

  // ── Drive: ambition (Q-Ambition1, post-CC-033) ───────────────────────
  success_priority: ["C", "E"],
  fame_priority: ["E"],
  wealth_priority: ["C"],
  legacy_priority: ["C", "O"],

  // ── Trust: institutional (Q-X3, post-CC-031) ─────────────────────────
  // Institutional trust generally indexes rule-following / order-orientation
  // (Conscientiousness). Untagged where the trust signal is too ambivalent
  // to commit a direction.
  government_elected_trust_priority: ["C"],
  government_services_trust_priority: ["C"],
  education_trust_priority: ["O", "C"],
  nonprofits_trust_priority: ["A"],
  religious_trust_priority: ["C"],
  journalism_trust_priority: ["O"],
  news_organizations_trust_priority: ["C"],
  social_media_trust_priority: [], // ambivalent
  small_business_trust_priority: ["C"],
  large_companies_trust_priority: ["C"],

  // ── Trust: personal (Q-X4, post-CC-032) ──────────────────────────────
  family_trust_priority: ["A"],
  friend_trust_priority: ["A", "E"],
  partner_trust_priority: ["A"],
  mentor_trust_priority: ["O", "A"],
  outside_expert_trust_priority: ["O"],
  own_counsel_trust_priority: [], // ambivalent

  // ── Conviction (Q-C1, Q-C3, Q-C4) ────────────────────────────────────
  truth_priority_high: ["O", "C"],
  belonging_priority_high: ["A"],
  order_priority: ["C"],
  individual_responsibility_priority: ["C"],
  system_responsibility_priority: ["O"],
  nature_responsibility_priority: ["O"],
  supernatural_responsibility_priority: ["C"],
  authority_responsibility_priority: ["C"],

  // ── Pressure (Q-P1, Q-P2) ────────────────────────────────────────────
  adapts_under_social_pressure: ["A", "N"],
  adapts_under_economic_pressure: ["N"],
  hides_belief: ["N"],
  holds_internal_conviction: ["C"],
  high_conviction_under_risk: ["C"],
  high_conviction_expression: ["E"],
  moderate_social_expression: [], // ambivalent

  // ── Formation (Q-F1, Q-F2) ───────────────────────────────────────────
  authority_trust_high: ["A", "C"],
  authority_skepticism_moderate: [], // ambivalent
  authority_distrust: ["O"],
  stability_baseline_high: ["C"], // high baseline stability indexes Conscientiousness
  moderate_stability: [],
  chaos_exposure: ["N"],

  // ── Context (Q-X1, Q-X2) ─────────────────────────────────────────────
  stability_present: ["C"],
  moderate_load: [],
  high_pressure_context: ["N"],

  // ── Belief-under-tension (Q-I1 freeform extraction) ──────────────────
  // The four catalog signals from extractFreeformSignals.
  independent_thought_signal: ["O"],
  epistemic_flexibility: ["O", "A"],
  conviction_under_cost: ["C"],
  // cost_awareness is canonically declared but no extractor emits it as of
  // 2026-04-29; the tag is forward-looking and harmless until the extractor
  // wires up.
  cost_awareness: ["C"],
};

// ── Distribution computation ────────────────────────────────────────────

export function computeOceanDistribution(
  signals: Signal[],
  // answers parameter reserved for future per-answer extensions (none in v1;
  // matches Drive's signature for consistency).
  answers: Answer[]
): OceanDistribution {
  void answers;
  const totals: Record<OceanBucket, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const counts: Record<OceanBucket, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };

  for (const signal of signals) {
    const tags = SIGNAL_OCEAN_TAGS[signal.signal_id];
    if (!tags || tags.length === 0) continue;
    const w = weightFor(signal);
    const splitWeight = w / tags.length;
    for (const bucket of tags) {
      totals[bucket] += splitWeight;
      counts[bucket] += 1;
    }
  }

  const sum = ORDER.reduce((acc, b) => acc + totals[b], 0);
  const pct: Record<OceanBucket, number> =
    sum > 0
      ? {
          O: Math.round((totals.O / sum) * 100),
          C: Math.round((totals.C / sum) * 100),
          E: Math.round((totals.E / sum) * 100),
          A: Math.round((totals.A / sum) * 100),
          N: Math.round((totals.N / sum) * 100),
        }
      : { O: 0, C: 0, E: 0, A: 0, N: 0 };

  // Correct rounding drift on the largest bucket. Deterministic tie-breaking
  // by canonical ORDER (first occurrence of the max wins).
  const pctSum = ORDER.reduce((acc, b) => acc + pct[b], 0);
  if (pctSum !== 100 && sum > 0) {
    let largest: OceanBucket = ORDER[0];
    for (const b of ORDER) {
      if (pct[b] > pct[largest]) largest = b;
    }
    pct[largest] += 100 - pctSum;
  }

  return {
    ...pct,
    rankAware: signals.some((s) => s.rank !== undefined),
    inputCount: counts,
    neuroticismEstimated: true,
  };
}

// ── Case classifier ─────────────────────────────────────────────────────
//
// n-elevated takes precedence over the dominant-shape cases — when N clears
// the threshold, the user gets the Neuroticism-specific prose regardless of
// whether O/C/E/A also has a single-dominant or two-dominant pattern. The
// n-elevated prose composes the two reads into one paragraph.

export function classifyOceanCase(d: OceanDistribution): OceanCase {
  if (d.N >= N_ELEVATED_THRESHOLD_PCT) return "n-elevated";

  const sorted = ORDER.slice().sort((a, b) => d[b] - d[a]);
  const top = sorted[0];
  const second = sorted[1];
  const max = d[top];
  const min = d[sorted[sorted.length - 1]];

  if (
    max >= SINGLE_DOMINANT_PCT_THRESHOLD &&
    max - d[second] >= SINGLE_DOMINANT_GAP_THRESHOLD_PP
  ) {
    return "single-dominant";
  }
  if (
    d[top] >= TWO_DOMINANT_FLOOR_PCT &&
    d[second] >= TWO_DOMINANT_FLOOR_PCT &&
    d[top] - d[second] <= TWO_DOMINANT_GAP_THRESHOLD_PP
  ) {
    return "two-dominant";
  }
  if (max - min < BALANCED_SPREAD_THRESHOLD_PP) return "balanced";
  return "single-dominant"; // sensible default when distribution lands between
}

// ── Bucket labels ───────────────────────────────────────────────────────

const BUCKET_LABEL: Record<OceanBucket, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Reactivity (estimated)",
};

const BUCKET_LABEL_SHORT: Record<OceanBucket, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Reactivity",
};

// ── Prose generation ────────────────────────────────────────────────────
//
// Four locked templates per case. Don't substitute. If a template reads off-
// tone in browser smoke, surface for follow-up CC.

export function generateOceanProse(output: OceanOutput): string {
  const d = output.distribution;
  // For non-N-elevated cases we want the top dimension among O/C/E/A/N. For
  // n-elevated we name N first explicitly and then the top non-N dimension.
  const sorted = ORDER.slice().sort((a, b) => d[b] - d[a]);
  const top = sorted[0];
  const second = sorted[1];
  const topLabel = BUCKET_LABEL_SHORT[top];
  const secondLabel = BUCKET_LABEL_SHORT[second];

  switch (output.case) {
    case "single-dominant":
      return `Your strongest disposition reads as ${topLabel} (${d[top]}%). The instrument detects this through patterns across your sacred values, allocation rankings, and lens-block answers — not from any single question.`;
    case "two-dominant":
      return `Your disposition is shaped by ${topLabel} (${d[top]}%) and ${secondLabel} (${d[second]}%) in roughly equal weight. Two strong dimensions can integrate well or pull against each other depending on context.`;
    case "balanced":
      return `Your disposition is unusually balanced — no single dimension dominates. This often shows up as adaptability across registers, or as a system that draws on whichever dimension the moment is asking for.`;
    case "n-elevated": {
      // Find the top non-N bucket so the prose names it after the N callout.
      const sortedNonN = (["O", "C", "E", "A"] as OceanBucket[]).slice().sort(
        (a, b) => d[b] - d[a]
      );
      const topNonN = sortedNonN[0];
      const topNonNLabel = BUCKET_LABEL_SHORT[topNonN];
      return `Your distribution shows elevated emotional-reactivity proxies (${d.N}%) — formation, context, or pressure-adaptation signals worth treating as an estimate, since the instrument measures this register indirectly rather than asking about it. Outside of Reactivity, your strongest tendency reads as ${topNonNLabel} (${d[topNonN]}%).`;
    }
    default:
      return `Your disposition map shows ${topLabel} as the strongest dimension at ${d[top]}%.`;
  }
}

// ── Top-level: full OceanOutput, or undefined when no inputs landed ─────

export function computeOceanOutput(
  signals: Signal[],
  answers: Answer[]
): OceanOutput | undefined {
  const distribution = computeOceanDistribution(signals, answers);
  const total = ORDER.reduce((acc, b) => acc + distribution[b], 0);
  if (total === 0) return undefined;
  const oceanCase = classifyOceanCase(distribution);
  const partial: OceanOutput = {
    distribution,
    case: oceanCase,
    prose: "",
  };
  partial.prose = generateOceanProse(partial);
  return partial;
}

// ── Exports for renderer + canon-doc cross-reference ────────────────────

export const OCEAN_BUCKET_LABEL = BUCKET_LABEL;
export const OCEAN_BUCKET_LABEL_SHORT = BUCKET_LABEL_SHORT;
export const OCEAN_BUCKET_ORDER: readonly OceanBucket[] = ORDER;
