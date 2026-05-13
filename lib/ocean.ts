// CC-037 — OCEAN Derivation Framework. CC-072 — Disposition Signal Mix
// reframe: independent per-trait intensities (0–100 each, NOT 100%-summing),
// dominance ranking, Openness subdimensions, Emotional Reactivity 0% guard.
// Source of truth: `docs/ocean-disposition-spec.md`.
//
// Big-5 personality dimensions (Openness / Conscientiousness / Extraversion /
// Agreeableness / Emotional Reactivity) derived from existing signals. No
// new questions; the instrument's measurement footprint is unchanged. The
// canonical home for the five-bucket OCEAN framework and the tagging table
// over existing signals.
//
// Architectural rules (canon-locked per memo §10):
//   - Derivation only — no claimed-vs-revealed split. The user is never
//     asked to rank themselves on OCEAN.
//   - INDEPENDENT trait intensities. Each trait stands alone on a 0–100
//     scale; the five values do NOT sum to 100. A user can be high on
//     multiple traits simultaneously (memo §2.1). The pre-CC-072
//     100%-summing distribution is preserved as `signalShareLegacy` for
//     backward-compat but never rendered to user-facing surfaces.
//   - User-facing prose uses Big-5 terminology with one substitution: "N"
//     renders as "Emotional Reactivity" rather than "Neuroticism" — the
//     clinical-pejorative baggage doesn't match the instrument's tone.
//   - Emotional Reactivity 0% guard (memo §5.1): when computed intensity
//     is 0 OR signal density is below threshold, `proxyOnly: true` is set
//     and the rendered prose translates to "low or under-detected" with
//     the §5.2 proxy disclosure. The string "Emotional Reactivity 0%"
//     never appears in user-facing prose.
//   - Multi-tag splits divide weighted contribution 1/N across tagged
//     buckets. Rank-aware weighting reuses `lib/drive.ts:weightFor`.
//   - Re-tag existing signals to populate Openness subdimensions
//     (Intellectual / Aesthetic / Novelty / Architectural per memo §3.4).
//     Architectural Openness is a Jason-specific extension to standard
//     NEO; it captures disciplined imagination that resolves into
//     structure. No new SignalIds added (memo §3.6 binding).

import type {
  Answer,
  CognitiveFunctionId,
  DispositionSignalMix,
  EmotionalReactivityConfidence,
  OceanBucket,
  OceanCase,
  OceanDistribution,
  OceanDominance,
  OceanIntensities,
  OceanIntensity,
  OceanIntensityBand,
  OceanIntensityBands,
  OceanOutput,
  OpennessFlavor,
  OpennessSubdimensionId,
  OpennessSubdimensions,
  Signal,
} from "./types";
import { weightFor } from "./drive";
// CC-JX — shared cog-function stack resolver. Both Lens and OCEAN bridges
// read from `computeJungianStack` so the layered architecture's intent
// (separate Jungian + Big-Five measurement models) matches the math.
import { computeJungianStack } from "./jungianStack";

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

// CC-AS — exported so the agreeableness signal-pool diagnostic
// (tests/audit/agreeablenessSignalPoolDiagnostic.ts) can inspect per-
// signal A tags without re-deriving the canon table.
export const SIGNAL_OCEAN_TAGS: Record<string, OceanBucket[]> = {
  // ── Lens (cognitive functions, Q-T1–T8) ──────────────────────────────
  // CC-077 — secondary E split removed from ne/se/te/fe. Pre-CC-077, each
  // of these tagged into both its native trait AND E. With 8 Q-T questions
  // ranking 4 cog functions each, an INTJ/INTP fired te/ne/se/fe at varying
  // ranks and accumulated 15+ fractional E weighted-sum points before any
  // direct E signal (high_conviction_expression, fame_priority,
  // friends_spending_priority, etc.) fired. The cumulative over-tag
  // produced false high-E for genuinely-introverted Lens stacks; CC-075's
  // saturation curve mitigated but couldn't fix it. Per CC-077 Allowed §1
  // and the §3.4 spec drift report, each cog function now tags only its
  // native bucket: ne→O, se→O, te→C, fe→A. Direct E signals continue to
  // feed E unchanged.
  // CC-JX — All cog-function entries emptied. Pre-CC-JX, each Q-T block
  // emission of a cog-function signal contributed via SIGNAL_OCEAN_TAGS,
  // accumulating across blocks (e.g., Ni firing in 4 Q-T blocks at rank 1
  // contributed 12 to O-weighted-sum). This produced the universal A and
  // E inflation Jason flagged on 2026-05-08: every MBTI type carries 2
  // extraverted + 2 introverted functions, so the Q-T cumulative summed
  // both sides into OCEAN-A and OCEAN-E without subtracting.
  //
  // Post-CC-JX, cog functions contribute via the position-weighted
  // jungianContributionsToOcean helper instead — each function gets ONE
  // contribution per fixture, weighted by stack position
  // (dominant=3.0 / aux=2.0 / tertiary=1.0 / inferior=0.5 / shadow=0.0)
  // and bucket-specific bridge coefficient. E and N receive ZERO Jungian
  // contribution; O / C / A receive position-weighted contributions per
  // the canonical Jungian → Big Five bridges.
  ni: [],
  ne: [],
  si: [],
  se: [],
  ti: [],
  te: [],
  fi: [],
  fe: [],

  // ── Compass: sacred values (Q-S1, Q-S2, post-CC-028) ─────────────────
  // CC-AS — Phase 2 cleanup. The 9-fixtures-in-13 (≥90 saturation) cohort-
  // wide A inflation Jason flagged (cohort preview + son + Jason canary)
  // traced empirically to universal-firing Compass-side A tags.
  // Removed: peace_priority (interior groundedness, not A canon),
  // family_priority (people-relational-default; CC-077 already removed
  // family_trust_priority for same reason), justice_priority A (justice
  // is C-anchored fair-weight register, the A read was double-counting).
  // Kept: loyalty / compassion / mercy — these three are the canonical
  // A-register names per spec memo §4 ("loyalty / moral-concern /
  // protective-care / cause-driven-service"); their universal-firing
  // pattern is mitigated by rank-aware weighting (mean rank 3.30 for
  // compassion, 4.30 for mercy → contribution drops with rank).
  freedom_priority: ["O"],
  truth_priority: ["O", "C"],
  stability_priority: ["C"],
  loyalty_priority: ["A", "C"], // CC-AS kept: canonical A register name (spec §4 names "loyalty" first); fired 20/20 fixtures, mean rank 4.20; rank-aware spread handles distinction.
  peace_priority: [], // CC-AS removed (was ["A"]): fired 20/20 fixtures, mean rank 3.15. Peace measures interior groundedness register; aesthetic subdim still reads it; A canonical register is loyalty / moral-concern / protective-care / cause-driven-service, not interior-calm.
  honor_priority: ["C"],
  family_priority: [], // CC-AS removed (was ["A"]): fired 20/20 fixtures, mean rank 2.00 (top-2 universally). Q-S2 family is the people-relational-default-tag pattern; Soul composite reads it via qs2CompassionMercyFamilyFaithTop2; CC-077 already removed family_trust_priority for the same canon reason.
  knowledge_priority: ["O"],
  justice_priority: ["C"], // CC-AS removed A (was ["C", "A"]): fired 20/20 fixtures, mean rank 3.90. Justice is C-anchored fair-weight register ("fair weight even when it costs you"); the A read was double-counting.
  faith_priority: ["C"],
  compassion_priority: ["A"], // CC-AS kept: canonical moral-concern register (spec §4); fired 20/20 fixtures, mean rank 3.30. The universal-presence is by design (Q-S2 emits all items); the rank-aware weighting (rank 1 = 3, rank 5-6 = 0.5) is what carries the discrimination — high-A users rank compassion top-2, moderate-A users rank it bottom-half.
  mercy_priority: ["A"], // CC-AS kept: canonical protective-care register (spec §4 — softening the verdict, mercy as care); fired 20/20 fixtures, mean rank 4.30. Universal-firing but tail-weighted (mean rank 4+ → typical contribution 0.5–1.0); rank distinguishes mercy-foregrounders.

  // ── Compass: concrete stakes (Q-Stakes1, post-CC-043) ────────────────
  money_stakes_priority: ["C"],
  job_stakes_priority: ["C"],
  // CC-077 — A tag removed. Soul composite (lib/goalSoulGive.ts) reads
  // close_relationships_stakes_priority directly; the OCEAN A tag was
  // double-counting the love-line. Signal continues to fire and feed Soul
  // exactly as before. See §AC-2 / §3.4 spec drift report.
  close_relationships_stakes_priority: [],
  reputation_stakes_priority: ["C"], // CC-ES removed E (was ["E", "C"]): fired 17/20 fixtures (85%), mean rank 4.06. Reputation is visible-role stake-naming — naming reputation as a thing-you'd-hate-to-lose ≠ broadcast / outward-charge. The C tag captures the loss-mitigation register; the E tag was double-counting via ambition-miscoded-as-social pattern.
  health_stakes_priority: ["C"],

  // ── Allocation: money flow (Q-S3-close, Q-S3-wider) ──────────────────
  self_spending_priority: [], // intentionally untagged — direction-neutral on OCEAN
  family_spending_priority: ["A"],
  friends_spending_priority: ["E", "A"], // CC-ES kept: fired 12/20 fixtures (60%), mean rank 2.00. Discretionary spending toward friends measures social-appetite-via-allocation register; rank-aware contribution distinguishes (rank 1 = w 3, rank 3 = w 1). Borderline universal-default but the rank distribution shows real spread.
  social_spending_priority: ["E"], // CC-ES kept: fired 4/20 fixtures (20%, distinctive); mean rank 1.75. Discretionary spending toward social experiences is the canonical social-appetite signal — direct measurement of "do you fund social-life as a priority?". The 20% fire-rate confirms it distinguishes social-appetite users from non-social-appetite users.
  nonprofits_religious_spending_priority: ["A"],
  companies_spending_priority: ["C"],

  // ── Allocation: energy flow (Q-E1-outward, Q-E1-inward) ──────────────
  building_energy_priority: ["C", "O"],
  solving_energy_priority: ["C"],
  restoring_energy_priority: ["C"],
  caring_energy_priority: ["A"], // CC-AS kept: fired in 20/20 fixtures (100%); mean rank 1.85; total contribution 43 (highest single A-tagged signal). Q-E1-inward "caring" rank distinguishes (caring rank 1 = weight 3; caring rank 3 = weight 1). The signal IS the canonical protective-care register; the spread is rank-aware, not universal-presence.
  learning_energy_priority: ["O"],
  enjoying_energy_priority: ["O", "E"], // CC-ES kept E: fired 20/20 fixtures (100%), mean rank 2.30. Borderline call — ranking enjoyment-allocation top-2 of three energy items (caring / learning / enjoying) is the closest direct measurement of social-appetite-via-energy in the existing bank. Removing the E tag drops cohort post-cleanup E spread below canary floor and pushes Jason to low band (E=39); keeping preserves Jason at moderate (E=43). Cohort impact: ranks 1-2 contribute meaningfully (1.5-3.0 weight) while ranks 3 contribute moderately (0.5).

  // ── Drive: claimed (Q-3C1) ───────────────────────────────────────────
  cost_drive: ["C"],
  // CC-077 — A tag removed. coverage_drive measures the love-line claim
  // (Soul-composite consumer, via Q-3C1 + Drive distribution). The OCEAN
  // A tag double-counted Soul-line content. Signal continues to feed
  // Drive distribution and Soul derivation unchanged.
  coverage_drive: [],
  compliance_drive: ["C"],

  // ── Drive: ambition (Q-Ambition1, post-CC-033) ───────────────────────
  success_priority: ["C"], // CC-ES removed E (was ["C", "E"]): fired 11/20 fixtures (55%), mean rank 1.36 (top-1 universally when present). Success is ambition register — "ambition signals miscoded as social-appetite" per spec memo. Ambition can be entirely interior; visible role-based output ≠ social-energy. C tag (achievement/discipline) is canonically right.
  fame_priority: ["E"], // CC-ES kept: fired 11/20 fixtures (55%), mean rank 3.73. Fame is the canonical broadcast register — "being known beyond your immediate circle" literally measures interior-moving-outward at scale. Distinguishes broadcast-appetite users (rank top-2) from legacy/wealth-appetite users (rank fame bottom).
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
  // CC-077 — A tags removed from love-line trust (family/partner only;
  // friend_trust_priority is NOT in the four-signal love-line cleanup
  // list per CC-077 OOS §12 and retains its original A+E tags). Soul
  // composite reads family_trust_priority and partner_trust_priority
  // directly via Q-X4-relational top-1 check; the OCEAN A tag was
  // double-counting Soul.
  family_trust_priority: [],
  friend_trust_priority: ["A", "E"], // CC-ES kept: fired 13/20 fixtures (65%), mean rank 2.69. Ranking a chosen friend (vs partner / family) as a top trust source indexes friendly-engagement appetite — high-E users gravitate toward chosen ties, where moderate-E users default to entangled ties. Borderline universal-default but the rank-1 placement is meaningfully distinguishing.
  partner_trust_priority: [],
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
  high_conviction_expression: ["E"], // CC-ES kept: fired 8/20 fixtures (40%, common); forced-choice "Say it directly" under social pressure. Direct measurement of outward-charge — interior-moving-outward in high-charge mode. Distinctive — only fires when user picks the most-direct option in Q-P1.
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

  // ── CC-Q1 — Q-O1 direct Openness subtype signals ─────────────────────
  // All five novelty-leaning items tag O. low_novelty_preference indexes
  // C (preference for tested / familiar / proven) instead of O. The
  // subdimension routing lives in SIGNAL_OPENNESS_SUBDIMENSION_TAGS below.
  openness_intellectual: ["O"],
  openness_aesthetic: ["O"],
  openness_perspective: ["O"],
  openness_experiential: ["O"],
  openness_emotional: ["O"],
  low_novelty_preference: ["C"],

  // ── CC-Q1 — Q-O2 direct Emotional Reactivity signals ────────────────
  // Five of the seven items tag N (anxious / anger / overwhelmed / hidden /
  // avoidant — all forms of active reactivity). The two cool-register items
  // (low_reactivity_focus, detached_reactivity) are intentionally untagged:
  // low_reactivity_focus is a low-N register; detached_reactivity is
  // proxy-coded suppression. Both still flip `proxyOnly` to false via the
  // `directERSignalCount` check in `emotionalReactivityConfidence` — the
  // ER channel was directly measured, just on its low or suppressed end.
  low_reactivity_focus: [],
  anxious_reactivity: ["N"],
  anger_reactivity: ["N"],
  detached_reactivity: [],
  overwhelmed_functioning: ["N"],
  hidden_reactivity: ["N"],
  avoidant_reactivity: ["N"],
};

// CC-Q1 — direct ER signal IDs. When any of these fire, the engine flips
// `proxyOnly` to false regardless of N intensity / signal density. The
// disclosure prose stops rendering because the ER channel was measured
// directly via Q-O2 ranking.
export const DIRECT_ER_SIGNAL_IDS: ReadonlySet<string> = new Set([
  "low_reactivity_focus",
  "anxious_reactivity",
  "anger_reactivity",
  "detached_reactivity",
  "overwhelmed_functioning",
  "hidden_reactivity",
  "avoidant_reactivity",
]);

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

// ── CC-072 / CC-075 — Independent intensity computation ────────────────
//
// Each trait's raw weighted sum is computed identically to the legacy
// distribution (the SIGNAL_OCEAN_TAGS table is unchanged), then mapped to
// an independent 0–100 intensity via a per-trait saturation curve.
//
// CC-075 reframe — the linear `weighted_sum × multiplier` math saturated
// real-cohort sessions to 100 across multiple traits simultaneously
// (Jason's 2026-05-07 17:50 session: O=100/C=100/E=74/A=100, with the E
// reading contradicting the same report's body-map cards). Path B
// saturation curve replaces it:
//
//   intensity = 100 × (1 − exp(−k × weighted_sum))
//
// The curve compresses the high end so dense signal pools rarely saturate.
// Per-trait k values are tuned against the 6 designed fixtures + the
// 07-jason real-cohort anchor; the calibration anchors Jason at honest
// bands (E ≤ 40, O ∈ [40,80], C ∈ [55,85], A ∈ [40,75]) per CC-075
// acceptance §AC-6. Some designed fixtures shifted bands as a trade-off;
// see CC-075 report for the regression list.
//
// Tunables. Per-trait k. Future calibration CCs (real-cohort percentile
// fits) re-tune; the curve shape itself is a CC-075 architectural fix.

export const INTENSITY_K: Record<OceanBucket, number> = {
  // CC-077 retune — signal-pool cleanup removed E-secondary tags from
  // ne/se/te/fe and A-tags from the four love-line signals. Weighted sums
  // dropped accordingly; k constants re-tuned so Jason and designed
  // fixtures land in honest bands. The Extraversion target is now
  // moderate-situational [40, 65] (was ≤40 in CC-075); body-map cards
  // continue to read default-introvert posture, while OCEAN E reflects
  // full activation capacity. See CC-077 §3 / spec §6 drift report.
  O: 0.030, // Jason wO≈37 → 67; designed fixtures land 27–32 (low band)
  C: 0.050, // Jason wC≈47 → 91; 02 wC≈33 → 80 (high band recovered)
  E: 0.140, // Jason wE≈5 → 53 (moderate); cleaned pool means even moderate-E users have small weighted sums, so k is much larger than CC-075's 0.034
  A: 0.100, // Jason wA≈22 → 89; 04 wA≈25 → 92; cleaner pool concentrates A on direct accommodation-coded signals
  N: 0.20,  // unchanged — N signal pool small and proxy-dominated
};

// CC-075 — legacy multiplier constants kept for backward-compat reference;
// not consulted by the new curve. Future CCs may delete after audit lands.
export const INTENSITY_MULTIPLIER_LEGACY_CC072: Record<OceanBucket, number> = {
  O: 3.5,
  C: 3.0,
  E: 5.0,
  A: 4.0,
  N: 6.0,
};

function computeRawWeights(signals: Signal[]): {
  weights: Record<OceanBucket, number>;
  counts: Record<OceanBucket, number>;
} {
  const weights: Record<OceanBucket, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const counts: Record<OceanBucket, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  for (const signal of signals) {
    const tags = SIGNAL_OCEAN_TAGS[signal.signal_id];
    if (!tags || tags.length === 0) continue;
    const w = weightFor(signal);
    const splitWeight = w / tags.length;
    for (const bucket of tags) {
      weights[bucket] += splitWeight;
      counts[bucket] += 1;
    }
  }
  return { weights, counts };
}

// ── CC-JX — Jungian → OCEAN bridge mapping ───────────────────────────────
//
// Position-weighted contribution from cog-function stack to OCEAN parent
// buckets and Openness subdimensions. Replaces the pre-CC-JX
// SIGNAL_OCEAN_TAGS path which summed every Q-T cog-function emission
// equally — that produced universal A and E inflation because every MBTI
// type carries 2 extraverted + 2 introverted functions.
//
// **Bridges (parent OCEAN buckets):**
//   - Ne / Ni → O  (1.0)
//   - Se      → O  (0.5; sensory-engagement aesthetic mild)
//   - Si / Te / Ti → C  (1.0)
//   - Fe / Fi → A  (1.0)
//   - **E and N**: ZERO Jungian contribution. Big Five Extraversion
//     measures sociability / external-stimulation-seeking; Jung's
//     extraverted-function orientation is energy-direction (different
//     construct). Big Five N has no canonical Jungian bridge — Q-O2
//     direct ER signals are the canonical N pool (CC-Q1).
//
// **Bridges (Openness subdimensions):**
//   - Ne → Novelty (1.0) + Intellectual (0.3, mild)
//   - Ni → Intellectual (1.0) + Architectural (0.5)
//   - Si → Novelty NEGATIVE (-0.5)  ← only anti-bridge in v1
//   - Se → Novelty (0.5) + Aesthetic (0.5)
//   - Te → Intellectual (0.5) + Architectural (0.5)
//   - Ti → Intellectual (0.5)
//   - Fi → Aesthetic (0.3)
//   - Fe → none
//
// Position weight (from lib/jungianStack.ts) governs magnitude; bridge
// coefficient governs direction and proportion. A function at position
// 5+ (shadow) contributes 0 regardless of bridge.

// CC-JX bridge coefficient calibration (v1):
//   - O parents bumped to 2.0 because Openness signal pool is sparse
//     post-CC-AS (most direct O signals come from Q-O1 Bundle 1) and
//     the Jungian decoupling otherwise drops Jason's O below the
//     architectural-led canary [O ≥ 75].
//   - A parents at 0.6 — lower than spec's 1.0 — because Fi tertiary
//     in INTJ-shape stacks (Jason) is the load-bearing A inflater pre-
//     CC-JX cumulative; capping the A bridge at 0.6 preserves the
//     architectural intent (cog functions contribute SOMETHING to A
//     since Fi/Fe canonically map there) while satisfying Jason's
//     A-drop canary.
//   - C and Si parents at spec's 1.0 — Conscientiousness signal pool
//     is dense enough that the position-weighted contribution lands
//     correctly without scaling.
//   - Se → O at 0.5 (per spec; sensory-engagement aesthetic mild).
const PARENT_BRIDGE: Record<CognitiveFunctionId, Partial<Record<OceanBucket, number>>> = {
  ne: { O: 2.0 },
  ni: { O: 2.0 },
  si: { C: 1.0 },
  se: { O: 1.0 },
  te: { C: 1.0 },
  ti: { C: 1.0 },
  fe: { A: 0.7 },
  fi: { A: 0.7 },
};

const SUBDIM_BRIDGE: Record<
  CognitiveFunctionId,
  Partial<Record<OpennessSubdimensionId, number>>
> = {
  ne: { novelty: 1.0, intellectual: 0.3 },
  ni: { intellectual: 1.0, architectural: 0.5 },
  si: { novelty: -0.5 }, // anti-bridge: tested-and-proven preference subtracts from Novelty
  se: { novelty: 0.5, aesthetic: 0.5 },
  te: { intellectual: 0.5, architectural: 0.5 },
  ti: { intellectual: 0.5 },
  fe: {},
  fi: { aesthetic: 0.3 },
};

// CC-JX — apply position-weighted Jungian contributions to weights/counts.
// Mutates the provided records in-place. Each cog function with non-zero
// position weight contributes once per bucket per fixture; the cumulative
// raw Q-T weight is consumed only for stack ordering, not for OCEAN
// magnitude.
function applyJungianBridgeToParent(
  signals: Signal[],
  weights: Record<OceanBucket, number>,
  counts: Record<OceanBucket, number>
): void {
  const stack = computeJungianStack(signals);
  for (const entry of stack) {
    if (entry.positionWeight === 0) continue;
    const bridge = PARENT_BRIDGE[entry.function];
    if (!bridge) continue;
    for (const [bucket, coeff] of Object.entries(bridge)) {
      const b = bucket as OceanBucket;
      weights[b] += entry.positionWeight * (coeff as number);
      counts[b] += 1;
    }
  }
}

// CC-075 — saturation curve replaces the linear multiplier. The curve
// shape is exposed for diagnostic auditing; the audit's `--diagnose` flag
// dumps weighted_sum and intensity per trait per fixture so future
// calibration CCs can re-tune k values against real-cohort data.
export function intensityFromWeight(
  bucket: OceanBucket,
  weightedSum: number
): OceanIntensity {
  const k = INTENSITY_K[bucket];
  const raw = 100 * (1 - Math.exp(-k * weightedSum));
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function computeOceanIntensities(
  signals: Signal[]
): {
  intensities: OceanIntensities;
  counts: Record<OceanBucket, number>;
  weights: Record<OceanBucket, number>;
} {
  const { weights, counts } = computeRawWeights(signals);
  // CC-JX — fold position-weighted Jungian contributions into the
  // weighted-sum BEFORE the saturation curve. E and N receive zero
  // contribution; O / C / A receive position × bridge.
  applyJungianBridgeToParent(signals, weights, counts);
  return {
    intensities: {
      openness: intensityFromWeight("O", weights.O),
      conscientiousness: intensityFromWeight("C", weights.C),
      extraversion: intensityFromWeight("E", weights.E),
      agreeableness: intensityFromWeight("A", weights.A),
      emotionalReactivity: intensityFromWeight("N", weights.N),
    },
    counts,
    weights,
  };
}

// ── CC-072 — Intensity bands (memo §2.1) ────────────────────────────────

export function intensityBand(intensity: OceanIntensity): OceanIntensityBand {
  if (intensity < 20) return "under-detected";
  if (intensity < 40) return "low";
  if (intensity < 60) return "moderate";
  if (intensity < 80) return "moderate-high";
  return "high";
}

export function computeIntensityBands(
  intensities: OceanIntensities
): OceanIntensityBands {
  return {
    openness: intensityBand(intensities.openness),
    conscientiousness: intensityBand(intensities.conscientiousness),
    extraversion: intensityBand(intensities.extraversion),
    agreeableness: intensityBand(intensities.agreeableness),
    emotionalReactivity: intensityBand(intensities.emotionalReactivity),
  };
}

// ── CC-072 — Dominance ranking (memo §2.2) ──────────────────────────────
//
// Rank order across the five traits. Tie-breaking on signal density
// (larger signalCount wins). The dashboard's lede sentence names the
// strongest one or two traits.

export function computeOceanDominance(
  intensities: OceanIntensities,
  counts: Record<OceanBucket, number>
): OceanDominance {
  const indexed: Array<{ bucket: OceanBucket; intensity: number; count: number }> =
    [
      { bucket: "O", intensity: intensities.openness, count: counts.O },
      {
        bucket: "C",
        intensity: intensities.conscientiousness,
        count: counts.C,
      },
      { bucket: "E", intensity: intensities.extraversion, count: counts.E },
      { bucket: "A", intensity: intensities.agreeableness, count: counts.A },
      {
        bucket: "N",
        intensity: intensities.emotionalReactivity,
        count: counts.N,
      },
    ];
  indexed.sort((a, b) => {
    if (b.intensity !== a.intensity) return b.intensity - a.intensity;
    return b.count - a.count;
  });
  return {
    ranked: indexed.map((x) => x.bucket),
    signalCounts: counts,
  };
}

// ── CC-072 — Openness subdimensions (memo §3.4) ─────────────────────────
//
// Re-tagging existing signals into the four subdimensions: Intellectual,
// Aesthetic, Novelty, Architectural. No new SignalIds (memo §3.6).
// Architectural Openness is the Jason-specific extension that captures
// disciplined imagination resolving into structure.

const SIGNAL_OPENNESS_SUBDIMENSION_TAGS: Record<
  string,
  OpennessSubdimensionId[]
> = {
  // Intellectual — curiosity about ideas, abstract thinking.
  independent_thought_signal: ["intellectual"],
  epistemic_flexibility: ["intellectual"],
  truth_priority: ["intellectual"],
  knowledge_priority: ["intellectual"],
  truth_priority_high: ["intellectual"],
  // CC-JX — cog-function subdim tags emptied. Pre-CC-JX, `ti`, `te`,
  // `fi`, `ne`, `se`, `ni` each tagged into Openness subdimensions via
  // this table. Post-CC-JX, cog-function contributions to subdims come
  // via the position-weighted helper in `computeOpennessSubdimensions`.
  ti: [],
  te: [],
  education_trust_priority: ["intellectual"],
  // Aesthetic — sensitivity to beauty, mood, sensory richness.
  compassion_priority: ["aesthetic"],
  mercy_priority: ["aesthetic"],
  peace_priority: ["aesthetic"],
  enjoying_energy_priority: ["aesthetic"],
  fi: [],
  // Novelty — experimentation, spontaneity, change.
  exploration_drive: ["novelty"],
  freedom_priority: ["novelty"],
  high_conviction_expression: ["novelty"],
  ne: [],
  se: [],
  journalism_trust_priority: ["novelty"],
  authority_distrust: ["novelty"],
  // Architectural — disciplined imagination resolving into structure.
  building_energy_priority: ["architectural"],
  proactive_creator: ["novelty", "architectural"], // creates either novel or structured
  legacy_priority: ["architectural"],
  ni: [],
  conviction_under_cost: ["architectural"], // structured belief that pays a price
  system_responsibility_priority: ["architectural"],
  cost_drive: ["architectural"],
  coverage_drive: ["architectural"],
  solving_energy_priority: ["architectural"],
  stability_priority: ["architectural"],

  // CC-Q1 — Q-O1 direct openness subdimension tags. Per spec memo §2 +
  // Allowed-to-Modify §4: intellectual feeds Intellectual; aesthetic and
  // emotional feed Aesthetic (the latter is the inner-feelings facet);
  // perspective and experiential feed Novelty (direct measurement
  // replacing the prior proxy-only reads). low_novelty_preference is
  // handled separately via SIGNAL_OPENNESS_SUBDIMENSION_NEGATIVE_TAGS so
  // the negative direction is explicit.
  openness_intellectual: ["intellectual"],
  openness_aesthetic: ["aesthetic"],
  openness_perspective: ["novelty"],
  openness_experiential: ["novelty"],
  openness_emotional: ["aesthetic"],
};

// CC-Q1 — negative subdimension tags. Signals tagged here SUBTRACT from the
// named subdimension's weighted sum (intensity floor at 0). The negative
// surface is intentionally narrow — only `low_novelty_preference` because
// it is the only Q-O1 / Q-O2 signal the spec memo §2 calls "NEGATIVE" on
// a subdimension. New negative tags require explicit canon review.
const SIGNAL_OPENNESS_SUBDIMENSION_NEGATIVE_TAGS: Record<
  string,
  OpennessSubdimensionId[]
> = {
  low_novelty_preference: ["novelty"],
};

// Same multiplier as the per-trait Openness intensity. This means the
// four subdimension intensities sum approximately to the parent Openness
// intensity (modulo per-signal multi-tagging into multiple subdimensions);
// the audit's `subdimension-coherence` check confirms the rough equality.
const OPENNESS_SUBDIMENSION_MULTIPLIER = 5.0;

export function computeOpennessSubdimensions(
  signals: Signal[]
): { subdimensions: OpennessSubdimensions; counts: Record<OpennessSubdimensionId, number> } {
  const weights: Record<OpennessSubdimensionId, number> = {
    intellectual: 0,
    aesthetic: 0,
    novelty: 0,
    architectural: 0,
  };
  const counts: Record<OpennessSubdimensionId, number> = {
    intellectual: 0,
    aesthetic: 0,
    novelty: 0,
    architectural: 0,
  };
  for (const signal of signals) {
    const w = weightFor(signal);
    const tags = SIGNAL_OPENNESS_SUBDIMENSION_TAGS[signal.signal_id];
    if (tags && tags.length > 0) {
      const splitWeight = w / tags.length;
      for (const sub of tags) {
        weights[sub] += splitWeight;
        counts[sub] += 1;
      }
    }
    // CC-Q1 — apply NEGATIVE subdim tags (e.g., low_novelty_preference
    // subtracts from Novelty). The signal-density count still increments
    // because the channel was measured; only the direction is negative.
    const negTags = SIGNAL_OPENNESS_SUBDIMENSION_NEGATIVE_TAGS[signal.signal_id];
    if (negTags && negTags.length > 0) {
      const splitWeight = w / negTags.length;
      for (const sub of negTags) {
        weights[sub] -= splitWeight;
        counts[sub] += 1;
      }
    }
  }
  // CC-JX — fold position-weighted Jungian subdim contributions. Only
  // top-4 stack positions contribute (positionWeight > 0); shadow
  // positions contribute zero. Si → Novelty NEGATIVE is the v1
  // anti-bridge.
  const stack = computeJungianStack(signals);
  for (const entry of stack) {
    if (entry.positionWeight === 0) continue;
    const bridge = SUBDIM_BRIDGE[entry.function];
    if (!bridge) continue;
    for (const [sub, coeff] of Object.entries(bridge)) {
      const s = sub as OpennessSubdimensionId;
      weights[s] += entry.positionWeight * (coeff as number);
      counts[s] += 1;
    }
  }
  const scale = (n: number): OceanIntensity =>
    Math.max(0, Math.min(100, Math.round(n * OPENNESS_SUBDIMENSION_MULTIPLIER)));
  return {
    subdimensions: {
      intellectual: scale(weights.intellectual),
      aesthetic: scale(weights.aesthetic),
      novelty: scale(weights.novelty),
      architectural: scale(weights.architectural),
    },
    counts,
  };
}

// CC-072 — Openness flavor selector (memo §3.5). Picks the dominant
// subdimension; if no clear leader (top two within 15 points) → mixed.
const OPENNESS_FLAVOR_GAP_THRESHOLD = 15;
const OPENNESS_FLAVOR_FLOOR = 20; // below this, no subdimension fires confidently
const ARCHITECTURAL_FLAVOR_TIEBREAK_FLOOR = 80;

export function selectOpennessFlavor(
  subdimensions: OpennessSubdimensions
): OpennessFlavor {
  const entries: Array<{ id: OpennessSubdimensionId; intensity: number }> = (
    ["intellectual", "aesthetic", "novelty", "architectural"] as const
  ).map((id) => ({ id, intensity: subdimensions[id] }));
  entries.sort((a, b) => b.intensity - a.intensity);
  const top = entries[0];
  const second = entries[1];
  if (top.intensity < OPENNESS_FLAVOR_FLOOR) return "mixed";
  // CODEX-078 — architectural is the integration register: disciplined
  // imagination resolving into structure. When it is high-band and within
  // the same top tier as the leading flavor, it wins the tie instead of
  // falling to generic "mixed." This is intentionally asymmetric and does
  // not create equivalent tie-breaks for the other subdimensions.
  if (
    subdimensions.architectural >= ARCHITECTURAL_FLAVOR_TIEBREAK_FLOOR &&
    subdimensions.architectural >=
      Math.max(
        subdimensions.intellectual,
        subdimensions.aesthetic,
        subdimensions.novelty
      ) -
        OPENNESS_FLAVOR_GAP_THRESHOLD
  ) {
    return "architectural_led";
  }
  if (top.intensity - second.intensity < OPENNESS_FLAVOR_GAP_THRESHOLD) {
    return "mixed";
  }
  switch (top.id) {
    case "intellectual":
      return "intellectual_led";
    case "aesthetic":
      return "aesthetic_led";
    case "novelty":
      return "novelty_led";
    case "architectural":
      return "architectural_led";
  }
}

// ── CC-072 — Emotional Reactivity 0% guard (memo §5) ────────────────────

const ER_PROXY_ONLY_INTENSITY_THRESHOLD = 20;
const ER_PROXY_ONLY_SIGNAL_DENSITY = 2;

export function emotionalReactivityConfidence(
  intensity: OceanIntensity,
  signalCount: number,
  // CC-Q1 — when any direct ER signal (Q-O2 ranking) fires, proxyOnly
  // is forced to false regardless of intensity / signal density. The
  // disclosure prose stops rendering because the affect channel was
  // measured directly. When `directERSignalCount === 0`, the legacy
  // proxy heuristic governs (intensity threshold + signal-density
  // floor) — backward-compatible for fixtures that skip Q-O2.
  directERSignalCount: number = 0
): EmotionalReactivityConfidence {
  if (directERSignalCount > 0) {
    return { proxyOnly: false, signalDensity: signalCount };
  }
  const proxyOnly =
    intensity === 0 ||
    intensity < ER_PROXY_ONLY_INTENSITY_THRESHOLD ||
    signalCount < ER_PROXY_ONLY_SIGNAL_DENSITY;
  return { proxyOnly, signalDensity: signalCount };
}

// ── Case classifier (CC-072 — operates on independent intensities) ──────

const SINGLE_DOMINANT_INTENSITY = 60;
const SINGLE_DOMINANT_GAP = 15;
const TWO_DOMINANT_FLOOR_INTENSITY = 50;
const TWO_DOMINANT_GAP = 10;
const BALANCED_SPREAD = 25;
const N_ELEVATED_INTENSITY = 40;

export function classifyOceanCase(intensities: OceanIntensities): OceanCase {
  if (intensities.emotionalReactivity >= N_ELEVATED_INTENSITY) {
    return "n-elevated";
  }
  const sorted = (
    ["openness", "conscientiousness", "extraversion", "agreeableness"] as const
  )
    .map((k) => intensities[k])
    .sort((a, b) => b - a);
  const max = sorted[0];
  const second = sorted[1];
  const min = sorted[sorted.length - 1];
  if (max >= SINGLE_DOMINANT_INTENSITY && max - second >= SINGLE_DOMINANT_GAP) {
    return "single-dominant";
  }
  if (
    max >= TWO_DOMINANT_FLOOR_INTENSITY &&
    second >= TWO_DOMINANT_FLOOR_INTENSITY &&
    max - second <= TWO_DOMINANT_GAP
  ) {
    return "two-dominant";
  }
  if (max - min < BALANCED_SPREAD) return "balanced";
  return "single-dominant";
}

// ── Bucket labels ───────────────────────────────────────────────────────

const BUCKET_LABEL: Record<OceanBucket, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Reactivity",
};

const BUCKET_LABEL_SHORT: Record<OceanBucket, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Reactivity",
};

// ── Top-level: full OceanOutput, or undefined when no inputs landed ─────

export function computeOceanOutput(
  signals: Signal[],
  answers: Answer[]
): OceanOutput | undefined {
  // Legacy 100%-summing distribution preserved per acceptance §AC-5.
  // Engine-internal consumers (lib/workMap.ts, admin views) still read the
  // pre-CC-072 field; user-facing render uses `dispositionSignalMix`.
  const distribution = computeOceanDistribution(signals, answers);
  const total = ORDER.reduce((acc, b) => acc + distribution[b], 0);
  if (total === 0) return undefined;

  // CC-072 — independent per-trait intensities (memo §2.1).
  const { intensities, counts } = computeOceanIntensities(signals);
  const bands = computeIntensityBands(intensities);
  const dominance = computeOceanDominance(intensities, counts);
  const oceanCase = classifyOceanCase(intensities);

  // CC-072 — Openness subdimensions (memo §3).
  const { subdimensions: opennessSubdimensions } =
    computeOpennessSubdimensions(signals);
  const opennessFlavor = selectOpennessFlavor(opennessSubdimensions);

  // CC-072 — Emotional Reactivity 0% guard (memo §5).
  // CC-Q1 — count direct Q-O2 ER signals; when ≥1, proxyOnly is forced
  // false (direct measurement available, disclosure prose suppressed).
  const directERSignalCount = signals.filter((s) =>
    DIRECT_ER_SIGNAL_IDS.has(s.signal_id)
  ).length;
  const erConfidence = emotionalReactivityConfidence(
    intensities.emotionalReactivity,
    counts.N,
    directERSignalCount
  );

  const dispositionSignalMix: DispositionSignalMix = {
    intensities,
    bands,
    dominance,
    opennessSubdimensions,
    opennessFlavor,
    emotionalReactivityConfidence: erConfidence,
  };

  return {
    distribution,
    case: oceanCase,
    // CC-072 — `prose` is now composed by lib/oceanDashboard.ts at render
    // time (composeOceanProse). The engine stores an empty string here;
    // renderMirror.ts pulls the dashboard payload via dispositionSignalMix
    // and assembles the user-facing paragraphs there.
    prose: "",
    dispositionSignalMix,
  };
}

// ── Exports for renderer + canon-doc cross-reference ────────────────────

export const OCEAN_BUCKET_LABEL = BUCKET_LABEL;
export const OCEAN_BUCKET_LABEL_SHORT = BUCKET_LABEL_SHORT;
export const OCEAN_BUCKET_ORDER: readonly OceanBucket[] = ORDER;
