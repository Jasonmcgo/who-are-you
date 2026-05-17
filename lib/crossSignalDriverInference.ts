// CC-097B-CROSS-SIGNAL-DRIVER-INFERENCE — parallel driver-function read
// from cross-signal evidence (Compass top values + OCEAN intensities +
// keystone belief register + cost surface count + Trust register + Drive
// distribution + DiSC-derived signals). Layered AFTER `aggregateLensStack`
// runs; the existing Q-T direct read remains in `LensStack.dominant`.
// This module's output lives in the parallel new fields
// `crossSignalAgreement`, `crossSignalInferredDriver`, `mirrorAxis`.
//
// Architectural contract:
//   1. PARALLEL, not REPLACEMENT. The Q-T direct stack is preserved
//      verbatim in dominant/auxiliary/tertiary/inferior. This module
//      only writes to the new optional fields.
//   2. SCORING WEIGHTS ARE CANON-AS-WRITTEN per CC-097B's Phase 1
//      table. Empirical adjustments (per the CC's "canon-first,
//      empirical-validate-second" rule) are documented inline and
//      flagged in the executor report.
//   3. DiSC IS DERIVED, NOT MEASURED. No new survey questions.
//      `feedback_minimal_questions_maximum_output.md`.
//
// Pure data — no API calls, no `node:*` imports.

import type { CognitiveFunctionId, InnerConstitution } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export type CrossSignalFunctionId = CognitiveFunctionId;

export interface CrossSignalScores {
  ni: number;
  ne: number;
  si: number;
  se: number;
  ti: number;
  te: number;
  fi: number;
  fe: number;
}

export interface DiSCScores {
  D: number;
  i: number;
  S: number;
  C: number;
}

export interface CrossSignalDriverInference {
  /** Highest-scoring driver from cross-signal evidence. */
  inferredDriver: CrossSignalFunctionId;
  /** Score of the inferred driver (0–100 by construction of the
   *  individual weights summing to 100). */
  inferredDriverScore: number;
  /** Score gap to second-highest function (confidence proxy). */
  scoreGap: number;
  /** Full scoring matrix for downstream consumers (mirror-axis,
   *  prose composer, audit). */
  scores: CrossSignalScores;
  /** Derived DiSC distribution; exposed so downstream consumers
   *  (and the audit) can read the four-letter ordering without
   *  re-deriving. */
  disc: DiSCScores;
  /** Free-text trace of which inputs fired each score component.
   *  Audit-friendly; never user-facing. */
  evidenceTrace: string[];
}

// ─────────────────────────────────────────────────────────────────────
// Mirror pairs — perceiving functions only
// ─────────────────────────────────────────────────────────────────────
//
// Per `feedback_mirror_axis_canon.md`: Mirror axes apply specifically to
// perceiving functions (Si↔Ne, Ni↔Se). Judging-function attitude flips
// (Ti↔Te, Fi↔Fe) are NOT mirror axes in the same sense and do not enter
// the mirror-axis routing.

export const PERCEIVING_MIRROR_PAIRS: Partial<
  Record<CrossSignalFunctionId, CrossSignalFunctionId>
> = {
  si: "ne",
  ne: "si",
  ni: "se",
  se: "ni",
};

export function isPerceivingMirrorPair(
  a: CrossSignalFunctionId,
  b: CrossSignalFunctionId
): boolean {
  return PERCEIVING_MIRROR_PAIRS[a] === b;
}

// ─────────────────────────────────────────────────────────────────────
// Compass-label vocabulary (Q-S1 / Q-S2 surface labels)
// ─────────────────────────────────────────────────────────────────────
//
// The cross-signal weights are spec'd against capitalized compass
// labels ("Knowledge", "Truth", "Faith", "Honor", "Loyalty", "Family",
// "Compassion", "Freedom", "Justice", "Stability"). The engine's
// signal-id form is `<lowercase>_priority` (e.g., "knowledge_priority").
// The extractor strips the suffix and capitalizes.

function compassLabelsFromTopCompass(
  topCompass: { signal_id: string }[]
): string[] {
  return topCompass.map((r) => {
    const stripped = r.signal_id.replace(/_priority$/, "");
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  });
}

function compassContains(labels: string[], target: string): boolean {
  return labels.some((l) => l.toLowerCase() === target.toLowerCase());
}

// ─────────────────────────────────────────────────────────────────────
// Cohort signal extractors
// ─────────────────────────────────────────────────────────────────────
//
// Each helper pulls one named signal out of the constitution. Returns
// `null` when the field is missing (pre-CC saved sessions) so the
// scorer can apply zero weight for that component without throwing.

// CC-097B-CALIBRATION-V2 Phase 3b — blame-lens key (Q-C4 top-1
// attribution). Per feedback_blame_lens_disc_mapping.md (2026-05-17),
// Q-C4 top-1 contributes to DiSC dimensions:
//   Individual    → +D (strong)
//   Authority     → +C (some +D)
//   System        → +C
//   Nature        → +i (low weight)
//   Supernatural  → +S
// Cohort canon-anchors (Jason=Individual→+D, Harry=Supernatural→+S,
// Daniel=Individual→+D, Michele=System→+C, Cindy=Individual→+D,
// Ashley=System→+C).
export type BlameLensTop = "individual" | "authority" | "system" | "nature" | "supernatural" | null;

interface ExtractedSignals {
  compassLabels: string[];
  oceanOpenness: number; // 0–100
  oceanConscientiousness: number;
  oceanExtraversion: number;
  oceanAgreeableness: number;
  oceanEmotionalReactivity: number;
  workMapRegisterKey: string | null;
  distribution: {
    building_and_wealth: number; // 0–1 fraction
    people_service_society: number;
    risk_and_uncertainty: number;
  };
  costSurfaceCount: number;
  keystoneRegister: KeystoneRegisterKey | null;
  trustTopLabels: string[];
  subRegister: SubRegisterKey | null;
  agreeablenessRegister: AgreeablenessRegisterKey | null;
  // CC-097B-CALIBRATION-V2 Phase 3b — blame-lens top-1 attribution
  // (Q-C4). Populated when the user ranked Q-C4; null when absent.
  blameLensTop: BlameLensTop;
  // Per-function Q-T signal strengths (0–100, scaled), surfaced
  // separately so the DiSC derivation can consume them.
  functionSignalStrength: Record<CrossSignalFunctionId, number>;
}

// ── Keystone register classification ────────────────────────────────
//
// The CC's Phase 1 table references keystone_register values like
// "long-arc-pattern-bearing", "humanist-universal-essence",
// "belief-held-close-tradition-anchored", "individual-conscience-
// autonomy", "logical-coherence-bearing". These don't exist on the
// constitution as enums; they're CC-097B-introduced classification
// labels. The classifier maps `belief_under_tension` + compass + signals
// onto the canon register names. When the input is too thin for any
// register to fire, returns null and the related score components don't
// contribute.

export type KeystoneRegisterKey =
  | "long-arc-pattern-bearing"
  | "humanist-universal-essence"
  | "belief-held-close-tradition-anchored"
  | "individual-conscience-autonomy"
  | "logical-coherence-bearing"
  | null;

function classifyKeystoneRegister(
  constitution: InnerConstitution,
  compassLabels: string[]
): KeystoneRegisterKey {
  const belief = constitution.belief_under_tension?.belief_text?.toLowerCase() ?? "";
  if (!belief) return null;
  // Long-arc pattern: Knowledge/Truth heavy + words like "pattern",
  // "long arc", "see ahead", "structure".
  if (
    (compassContains(compassLabels, "Knowledge") ||
      compassContains(compassLabels, "Truth")) &&
    /(pattern|long arc|see ahead|structure|architecture|trajectory)/i.test(
      belief
    )
  ) {
    return "long-arc-pattern-bearing";
  }
  // Humanist universal essence: Freedom-anchored + universalist language
  // ("everyone", "people are essentially", "no one is").
  if (
    compassContains(compassLabels, "Freedom") &&
    /(everyone|people are|no one is|all of us|universally|each person)/i.test(
      belief
    )
  ) {
    return "humanist-universal-essence";
  }
  // Belief-held-close tradition: Faith + lineage / inheritance language.
  if (
    compassContains(compassLabels, "Faith") &&
    /(inherit|tradition|came before|carried forward|kept|continuity|lineage)/i.test(
      belief
    )
  ) {
    return "belief-held-close-tradition-anchored";
  }
  // Individual conscience: "I", "my own", "what I believe", autonomy
  // language; cost-surface narrowness reinforces.
  if (/(my own|i believe|i refuse|i won't|i can't compromise)/i.test(belief)) {
    return "individual-conscience-autonomy";
  }
  // Logical coherence: framework / principle / coherence language.
  if (/(framework|principle|coherence|consistent|logically|the rule)/i.test(belief)) {
    return "logical-coherence-bearing";
  }
  return null;
}

// ── Sub-register classification ─────────────────────────────────────
//
// The CC references sub_register values "relational" / "protective" /
// "mastery". The closest existing engine surface is `workMap.flavor` or
// the Path/Trust prose. CC-097B introduces a derivation that reads the
// constitution's primary register signals.

export type SubRegisterKey =
  | "relational"
  | "protective"
  | "mastery"
  | null;

function classifySubRegister(
  constitution: InnerConstitution
): SubRegisterKey {
  const wm = constitution.workMap;
  if (!wm) return null;
  const top = wm.matches?.[0];
  const label =
    `${top?.register?.register_key ?? ""} ${top?.register?.register_label ?? ""}`.toLowerCase();
  if (/relational|attunement|caring|pastoral|harmoniz/i.test(label)) {
    return "relational";
  }
  if (/protect|advocacy|guardian|safety/i.test(label)) {
    return "protective";
  }
  if (/mastery|craft|excellence|expertise|operational/i.test(label)) {
    return "mastery";
  }
  return null;
}

// ── Agreeableness register classification ───────────────────────────
//
// "moral-concern-dominant" is the CC's named flavor for Fe-protector
// register AND Fi-conviction register Agreeableness expression. The
// engine doesn't carry this as an enum; we classify by inspecting
// OCEAN agreeableness signals' source signal_ids for moral-concern
// content (compassion, justice, mercy, loyalty).

export type AgreeablenessRegisterKey =
  | "moral-concern-dominant"
  | "warmth-dominant"
  | "agreeable-easy"
  | null;

function classifyAgreeablenessRegister(
  constitution: InnerConstitution,
  compassLabels: string[]
): AgreeablenessRegisterKey {
  const agreeableness =
    constitution.ocean?.dispositionSignalMix?.intensities?.agreeableness ?? 0;
  if (agreeableness < 60) return null;
  const moralCompassHit =
    compassContains(compassLabels, "Compassion") ||
    compassContains(compassLabels, "Justice") ||
    compassContains(compassLabels, "Mercy") ||
    compassContains(compassLabels, "Loyalty");
  if (moralCompassHit) return "moral-concern-dominant";
  if (agreeableness >= 80) return "warmth-dominant";
  return "agreeable-easy";
}

// ── Distribution bucket extraction ──────────────────────────────────
//
// CC weights reference `distribution["building_and_wealth"]` /
// `distribution["people_service_society"]` /
// `distribution["risk_and_uncertainty"]` as fractions of total drive
// allocation. The engine's `goalSoulMovement.dashboard.driveDistribution`
// shape exposes per-bucket scores; we normalize to 0–1.

function extractDistribution(
  constitution: InnerConstitution
): {
  building_and_wealth: number;
  people_service_society: number;
  risk_and_uncertainty: number;
} {
  // CC-097B-CALIBRATION-V2 Phase 1b — distribution extraction fixed.
  // Pre-V2 code read `goalSoulMovement.dashboard.driveDistribution.bucketScores`
  // which doesn't exist on the engine output. The actual canonical
  // distribution lives at `shape_outputs.path.drive.distribution`
  // (type `DriveDistribution` per lib/types.ts:504) with three
  // buckets: `cost`, `coverage`, `compliance` (each 0-100 summing to
  // 100, per docs/canon/trajectory-model-refinement.md §10).
  //
  // Canonical bucket mapping per the cohort calibration:
  //   cost       → building & wealth   (the building/financial outcomes axis)
  //   coverage   → people, service, society (the relational/civic axis)
  //   compliance → risk & uncertainty   (the risk-aware reading per CC-SYNTHESIS-1A)
  // Values are normalized to 0-1 fractions (divided by 100) since the
  // scoring weights downstream compare against thresholds like 0.30.
  const drive = constitution.shape_outputs?.path?.drive;
  if (!drive?.distribution) {
    return {
      building_and_wealth: 0,
      people_service_society: 0,
      risk_and_uncertainty: 0,
    };
  }
  const d = drive.distribution;
  return {
    building_and_wealth: d.cost / 100,
    people_service_society: d.coverage / 100,
    risk_and_uncertainty: d.compliance / 100,
  };
}

// ── Cost surface count extraction ───────────────────────────────────
//
// Q-I1 freeform belief response paragraph length is a proxy for cost
// surface count: longer = more surfaces. We use the cross_card.topRisks
// length OR the constitution.tensions length as the cost-surface
// proxy. Per CC weights: count <= 3 favors Ne/Fi (selective); count
// >= 4 favors Si/Fe/Se (broader carrying).

function extractCostSurfaceCount(constitution: InnerConstitution): number {
  return (
    (constitution.tensions ?? []).length +
    (constitution.cross_card?.topRisks ?? []).length
  );
}

// ── Trust register top labels ───────────────────────────────────────
//
// Trust register is keyed off Q-X3/Q-X4 institutional/personal trust
// answers. The engine's `getTopTrustInstitutional` /
// `getTopTrustPersonal` surfaces ranked refs. We map signal_ids back
// to user-facing labels via a small vocabulary.

// CC-097B-CALIBRATION-V2 Phase 1a — trust signal_ids fixed.
// Pre-V2 keys were `trust_religious` / `trust_mentor` / etc. — these
// never matched the engine's actual signal_ids emitted at
// lib/identityEngine.ts:217-251 (`religious_trust_priority` etc.),
// so extractTrustTopLabels returned (none) for every fixture and the
// trust-weighted Si/Fe/Fi scoring components zero-fired across the
// matrix. V2 fixes the keys; downstream Si/Fe/Fi scoring is now
// empirically grounded.
const TRUST_LABEL_BY_SIGNAL: Record<string, string> = {
  // Institutional (Q-X3)
  religious_trust_priority: "Religious",
  small_business_trust_priority: "Small Business",
  large_companies_trust_priority: "Corporate",
  education_trust_priority: "Education",
  journalism_trust_priority: "Journalism",
  news_organizations_trust_priority: "News",
  social_media_trust_priority: "Social Media",
  government_elected_trust_priority: "Government",
  government_services_trust_priority: "Government",
  nonprofits_trust_priority: "Non-Profits",
  // Personal (Q-X4)
  partner_trust_priority: "Partner",
  friend_trust_priority: "Friend",
  family_trust_priority: "Family",
  mentor_trust_priority: "mentor",
  outside_expert_trust_priority: "Outside Expert",
  own_counsel_trust_priority: "own counsel",
};

function extractTrustTopLabels(
  constitution: InnerConstitution
): string[] {
  // CC-097B-CALIBRATION-V2 Phase 1a — read top-3 trust signals by rank.
  // Engine emits trust signals as `*_trust_priority` (see
  // lib/identityEngine.ts:217-251). We collect every signal whose id
  // ends in `_trust_priority` and is rank <= 3, then map to display
  // label via TRUST_LABEL_BY_SIGNAL.
  const labels: string[] = [];
  for (const s of constitution.signals) {
    if (
      s.signal_id.endsWith("_trust_priority") &&
      (s.rank ?? 99) <= 3
    ) {
      const label = TRUST_LABEL_BY_SIGNAL[s.signal_id];
      if (label) labels.push(label);
    }
  }
  return labels;
}

function trustRegisterIncludes(labels: string[], needle: string): boolean {
  return labels.some((l) => l.toLowerCase() === needle.toLowerCase());
}

function trustRegisterIncludesRelational(labels: string[]): boolean {
  return labels.some((l) =>
    /family|friend|mentor|religious|community|caring/i.test(l)
  );
}

// ── Per-function Q-T signal strength ────────────────────────────────
//
// The cumulative Q-T signal strengths the engine already computes are
// surfaced by `lib/jungianStack.ts:computeJungianStack` via
// `cumulativeRawWeight`. Here we map them onto a 0–100 scale per
// function so the DiSC derivation (which uses te_signal_strength etc.)
// can reference them. Falls back to zero when signals are thin.

function extractFunctionSignalStrengths(
  constitution: InnerConstitution
): Record<CrossSignalFunctionId, number> {
  const out: Record<CrossSignalFunctionId, number> = {
    ni: 0,
    ne: 0,
    si: 0,
    se: 0,
    ti: 0,
    te: 0,
    fi: 0,
    fe: 0,
  };
  const fnIds: CrossSignalFunctionId[] = ["ni", "ne", "si", "se", "ti", "te", "fi", "fe"];
  for (const fn of fnIds) {
    // Q-T signals carry signal_ids equal to the function id itself.
    const matching = constitution.signals.filter((s) => s.signal_id === fn);
    if (matching.length === 0) continue;
    // Average rank → strength score. Rank 1 = strongest = 100; rank 4 = 25.
    const avgRank =
      matching
        .map((s) => s.rank ?? 4)
        .reduce((a, b) => a + b, 0) / matching.length;
    out[fn] = Math.max(0, 100 - (avgRank - 1) * 25);
  }
  return out;
}

// ── Blame-lens (Q-C4) top-1 attribution extraction ───────────────
//
// CC-097B-CALIBRATION-V2 Phase 3b — Q-C4 top-1 by signal_id.
// The engine emits signals from Q-C4 as `*_attribution_priority`
// (e.g., `individual_attribution_priority`); we read the rank-1
// signal and map to one of the five canon attribution categories.
// Returns null when Q-C4 wasn't ranked or rank-1 isn't recognizable.

// Engine emits Q-C4 ranking as `*_responsibility_priority` signals
// (see lib/identityEngine.ts:250,252,3221,3222). Map the canon names
// onto the engine's actual signal_ids.
const BLAME_LENS_BY_SIGNAL: Record<string, BlameLensTop> = {
  individual_responsibility_priority: "individual",
  authority_responsibility_priority: "authority",
  system_responsibility_priority: "system",
  nature_responsibility_priority: "nature",
  supernatural_responsibility_priority: "supernatural",
};

function extractBlameLensTop(
  constitution: InnerConstitution
): BlameLensTop {
  const candidates = constitution.signals
    .filter((s) => s.signal_id.endsWith("_responsibility_priority"))
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const top = candidates[0];
  if (!top) return null;
  return BLAME_LENS_BY_SIGNAL[top.signal_id] ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Top-level extractor
// ─────────────────────────────────────────────────────────────────────

function extractAllSignals(
  constitution: InnerConstitution
): ExtractedSignals {
  const topCompass = (constitution.signals ?? [])
    .filter(
      (s) =>
        s.from_card === "sacred" &&
        s.source_question_ids?.some((q) => q === "Q-S1" || q === "Q-S2")
    )
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 4)
    .map((s) => ({ signal_id: s.signal_id }));
  const compassLabels = compassLabelsFromTopCompass(topCompass);
  const intensities =
    constitution.ocean?.dispositionSignalMix?.intensities ?? {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      emotionalReactivity: 0,
    };
  return {
    compassLabels,
    oceanOpenness: intensities.openness,
    oceanConscientiousness: intensities.conscientiousness,
    oceanExtraversion: intensities.extraversion,
    oceanAgreeableness: intensities.agreeableness,
    oceanEmotionalReactivity: intensities.emotionalReactivity,
    workMapRegisterKey:
      constitution.workMap?.matches?.[0]?.register?.register_key ?? null,
    distribution: extractDistribution(constitution),
    costSurfaceCount: extractCostSurfaceCount(constitution),
    keystoneRegister: classifyKeystoneRegister(constitution, compassLabels),
    trustTopLabels: extractTrustTopLabels(constitution),
    subRegister: classifySubRegister(constitution),
    agreeablenessRegister: classifyAgreeablenessRegister(
      constitution,
      compassLabels
    ),
    blameLensTop: extractBlameLensTop(constitution),
    functionSignalStrength: extractFunctionSignalStrengths(constitution),
  };
}

// ─────────────────────────────────────────────────────────────────────
// DiSC derivation
// ─────────────────────────────────────────────────────────────────────
//
// Weighted sum of existing signals — no new survey questions per
// `feedback_minimal_questions_maximum_output.md`. Weights are CANON
// per CC-097B's Phase 1 table; empirical adjustments documented inline.

interface WeightedComponent {
  signal: number; // 0–100
  weight: number; // 0–1
}

function weightedSum(components: WeightedComponent[]): number {
  const total = components.reduce((s, c) => s + c.signal * c.weight, 0);
  return Math.max(0, Math.min(100, total));
}

export function deriveDiSC(
  signals: ExtractedSignals,
  goalOrientationProxy: number
): DiSCScores {
  const compassKnowOrTruth =
    compassContains(signals.compassLabels, "Knowledge") ||
    compassContains(signals.compassLabels, "Truth");
  // CC-097B-CALIBRATION-V2 Phase 3a — DiSC weight rebalance.
  // Pre-V2 Jason produced C>i>S>D (target: D>i>C>S). Two issues:
  //  (1) C overweighted via ni_signal_strength (0.20) — Ni-driver
  //      shapes (Jason) read as C-coded when Ni is also a D-coded
  //      function via Te-aux executive register. Dropped to 0.10.
  //  (2) C overweighted compass=Knowledge||Truth (0.15) — same
  //      cluster fires for both D-coded and C-coded shapes; dropped
  //      to 0.10.
  //  (3) D under-weighted te_signal_strength (0.35) — Te is the
  //      direct D-driver function; raised to 0.45.
  // Net: Jason C drops ~10 points, D rises ~10 points → D-highest
  // ordering should emerge for D-coded Ni-Te / Te-Ni patterns while
  // Harry (Si-Fe non-D) stays S-highest.
  //
  // Phase 3b — blame-lens (Q-C4) contribution added to each
  // dimension per feedback_blame_lens_disc_mapping.md.
  const blameD = signals.blameLensTop === "individual" ? 20 : 0;
  const blameDFromAuthority =
    signals.blameLensTop === "authority" ? 10 : 0;
  const blameCFromAuthority =
    signals.blameLensTop === "authority" ? 15 : 0;
  const blameCFromSystem =
    signals.blameLensTop === "system" ? 20 : 0;
  const blameIFromNature =
    signals.blameLensTop === "nature" ? 15 : 0;
  const blameSFromSupernatural =
    signals.blameLensTop === "supernatural" ? 20 : 0;
  return {
    D: Math.min(
      100,
      weightedSum([
        { signal: signals.functionSignalStrength.te, weight: 0.45 },
        { signal: goalOrientationProxy, weight: 0.20 },
        { signal: 100 - signals.oceanAgreeableness, weight: 0.15 },
        { signal: signals.oceanExtraversion, weight: 0.10 },
        { signal: signals.distribution.building_and_wealth * 100, weight: 0.10 },
      ]) +
        blameD +
        blameDFromAuthority
    ),
    i: Math.min(
      100,
      weightedSum([
        { signal: signals.functionSignalStrength.fe, weight: 0.30 },
        { signal: signals.functionSignalStrength.ne, weight: 0.20 },
        { signal: signals.oceanExtraversion, weight: 0.20 },
        { signal: signals.oceanAgreeableness, weight: 0.15 },
        { signal: signals.distribution.people_service_society * 100, weight: 0.15 },
      ]) + blameIFromNature
    ),
    S: Math.min(
      100,
      weightedSum([
        { signal: signals.functionSignalStrength.si, weight: 0.30 },
        { signal: signals.functionSignalStrength.fe, weight: 0.25 },
        { signal: signals.oceanAgreeableness, weight: 0.20 },
        { signal: 100 - signals.oceanOpenness, weight: 0.15 },
        { signal: Math.min(100, signals.costSurfaceCount * 10), weight: 0.10 },
      ]) + blameSFromSupernatural
    ),
    C: Math.min(
      100,
      weightedSum([
        { signal: signals.functionSignalStrength.ti, weight: 0.25 },
        { signal: signals.functionSignalStrength.ni, weight: 0.10 },
        { signal: signals.oceanConscientiousness, weight: 0.25 },
        { signal: compassKnowOrTruth ? 100 : 0, weight: 0.10 },
        // CC-097B-CALIBRATION-V2 Phase 3a — Openness's C-contribution
        // dropped from 0.15 to 0.10. High openness reads as
        // analytical-curious (C-coded) but also as Ni-architectural
        // (D-coded via Te-aux executive register). Pre-V2 Jason
        // (O=81, Ni-Te) had C inflated 3 points above D; trim here
        // restores canon D-highest ordering. Effect on cohort:
        // Ashley C-67→64 (still well below D=82); Michele C-61→58
        // (still i-dominant); negligible for low-O fixtures.
        { signal: signals.oceanOpenness, weight: 0.10 },
      ]) +
        blameCFromSystem +
        blameCFromAuthority
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Per-function scoring
// ─────────────────────────────────────────────────────────────────────
//
// CANON-AS-WRITTEN per CC-097B's Phase 1 table. Each weight component
// fires a binary 0/1 indicator multiplied by its weight; total caps at
// 100. The component-by-component breakdown lands in `evidenceTrace`
// for downstream audit transparency.

type Component = { fires: boolean; weight: number; label: string };

function scoreFromComponents(components: Component[]): {
  score: number;
  trace: string[];
} {
  let score = 0;
  const trace: string[] = [];
  for (const c of components) {
    if (c.fires) {
      score += c.weight;
      trace.push(`+${c.weight} ${c.label}`);
    }
  }
  return { score, trace };
}

function scoreNi(s: ExtractedSignals): { score: number; trace: string[] } {
  return scoreFromComponents([
    {
      fires: compassContains(s.compassLabels, "Knowledge"),
      weight: 25,
      label: "ni: compass=Knowledge",
    },
    {
      fires: compassContains(s.compassLabels, "Truth"),
      weight: 20,
      label: "ni: compass=Truth",
    },
    {
      fires: s.keystoneRegister === "long-arc-pattern-bearing",
      weight: 15,
      label: "ni: keystone=long-arc-pattern-bearing",
    },
    {
      fires: s.distribution.building_and_wealth >= 0.3,
      weight: 15,
      label: "ni: distribution.building_and_wealth>=0.30",
    },
    {
      // CC-097B-CALIBRATION-V2 — lowered Ni openness threshold 75→65
      // per feedback_se_fi_attractor_canon.md. Ashley's INFJ-latent
      // architecture-seeking signature has O=67 — canon-correct Ni
      // pattern but below pre-V2 75-floor. Effect: Ashley Ni +10
      // (fires mirror-axis); Jason already fires (O=81); Daniel
      // O=46 doesn't fire; Cindy O=69 +10 but Ni score stays well
      // below Se=80; Harry O=54 doesn't fire.
      fires: s.oceanOpenness >= 65,
      weight: 10,
      label: "ni: openness>=65",
    },
    {
      // CC-097B-CALIBRATION-V2 — lowered Ni C threshold 90→85.
      // Ashley C=88 — meets canon Ni-architecture pattern but
      // below pre-V2 90-floor. Effect: Ashley Ni +10; Jason fires
      // (C=88); Daniel doesn't (C=96 wait — Daniel fires); Cindy
      // C=86 fires +10 but Ni well below Se=80; Michele C=81
      // doesn't fire; Kevin C=82 doesn't fire; Harry C=98 fires.
      fires: s.oceanConscientiousness >= 85,
      weight: 10,
      label: "ni: conscientiousness>=85",
    },
    {
      fires: s.workMapRegisterKey?.includes("strategic") === true ||
        s.workMapRegisterKey?.includes("architect") === true,
      weight: 5,
      label: "ni: workMap=Strategic/Architectural",
    },
  ]);
}

function scoreNe(s: ExtractedSignals): { score: number; trace: string[] } {
  return scoreFromComponents([
    {
      fires: compassContains(s.compassLabels, "Freedom"),
      weight: 25,
      label: "ne: compass=Freedom",
    },
    {
      fires: s.keystoneRegister === "humanist-universal-essence",
      weight: 20,
      label: "ne: keystone=humanist-universal-essence",
    },
    {
      // CC-097B-CALIBRATION-V2 — lowered openness threshold from 75
      // to 70 per feedback_se_fi_attractor_canon.md. Michele's lived
      // Ne-driver pattern has O=74 (canon-correct for Ne but just
      // below the pre-V2 75-floor). Empirical cohort effect: fires
      // Michele Ne (+15), preserves Jason/Daniel/Cindy/Kevin/Harry
      // (Daniel/Harry O<70; Cindy/Kevin O<70 → no fire; Jason O=81
      // already fired pre-V2).
      fires: s.oceanOpenness >= 70 && s.oceanConscientiousness >= 80,
      weight: 15,
      label: "ne: openness>=70 && conscientiousness>=80",
    },
    {
      // CC-097B-CALIBRATION-V2 — loosened cost-surface ceiling from
      // <=3 to <=4 per feedback_se_fi_attractor_canon.md. Michele's
      // narrow-selective cost-surface pattern lands at 4 (just above
      // the pre-V2 3-ceiling). Empirical cohort effect: fires
      // Michele/Cindy Ne (cost=4 each); preserves Jason/Daniel/Harry
      // (cost=5).
      fires: s.costSurfaceCount <= 4,
      weight: 15,
      label: "ne: cost_surface<=4",
    },
    {
      fires: s.distribution.risk_and_uncertainty >= 0.3,
      weight: 10,
      label: "ne: distribution.risk_and_uncertainty>=0.30",
    },
    {
      fires:
        compassContains(s.compassLabels, "Knowledge") ||
        compassContains(s.compassLabels, "Truth"),
      weight: 10,
      label: "ne: compass∈{Knowledge,Truth}",
    },
    {
      fires:
        trustRegisterIncludes(s.trustTopLabels, "Education") ||
        trustRegisterIncludes(s.trustTopLabels, "Journalism"),
      weight: 5,
      label: "ne: trust∈{Education,Journalism}",
    },
  ]);
}

function scoreSi(s: ExtractedSignals): { score: number; trace: string[] } {
  return scoreFromComponents([
    {
      // CC-097B-CALIBRATION Phase 2 — broadened Si compass condition.
      // Pre-CC required `Faith && (Honor||Loyalty)`. Daniel cohort fixture's
      // top-4 compass is [Loyalty, Family, Stability, Justice] (Faith falls
      // to rank 4-5 — outside top-4 by tie-break, even though Faith
      // ranks high on Q-S2). The steward Si signature is anchored as
      // much in Stability as in Faith; Honor/Loyalty/Family all carry
      // the steward register. Broader condition fires Daniel's Si
      // without regressing Cindy (Freedom-anchored, no Stability/Faith),
      // Kevin (no Stability/Faith), Michele (Freedom+Truth+Compassion+
      // Justice, no Stability/Faith), Jason (Knowledge+Truth+Honor+
      // Justice, no Stability/Faith), Ashley (no Stability/Faith).
      fires:
        (compassContains(s.compassLabels, "Faith") ||
          compassContains(s.compassLabels, "Stability")) &&
        (compassContains(s.compassLabels, "Honor") ||
          compassContains(s.compassLabels, "Loyalty") ||
          compassContains(s.compassLabels, "Family")),
      weight: 25,
      label: "si: compass∈{Faith,Stability}+(Honor|Loyalty|Family)",
    },
    {
      fires:
        trustRegisterIncludes(s.trustTopLabels, "Religious") ||
        trustRegisterIncludes(s.trustTopLabels, "Small Business") ||
        trustRegisterIncludes(s.trustTopLabels, "mentor"),
      weight: 20,
      label: "si: trust∈{Religious,SmallBusiness,mentor}",
    },
    {
      fires: s.keystoneRegister === "belief-held-close-tradition-anchored",
      weight: 15,
      label: "si: keystone=belief-held-close-tradition-anchored",
    },
    {
      fires: s.oceanConscientiousness >= 90,
      weight: 15,
      label: "si: conscientiousness>=90",
    },
    {
      fires:
        s.workMapRegisterKey?.includes("operational") === true ||
        s.workMapRegisterKey?.includes("steward") === true,
      weight: 10,
      label: "si: workMap=Operational/Stewardship",
    },
    {
      fires: s.costSurfaceCount >= 4,
      weight: 10,
      label: "si: cost_surface>=4",
    },
    {
      fires:
        s.distribution.building_and_wealth +
          s.distribution.people_service_society >=
        0.65,
      weight: 5,
      label: "si: building+people>=0.65",
    },
  ]);
}

function scoreSe(s: ExtractedSignals): { score: number; trace: string[] } {
  return scoreFromComponents([
    {
      // CC-097B-CALIBRATION-V2 — added Agreeableness gate to Se's
      // EmbodiedCraft attractor per feedback_se_fi_attractor_canon.md.
      // The Se Class-C attractor (Kevin's case) routed Fe-driver
      // users to Se because both share the EmbodiedCraft workMap.
      // Genuine Se-drivers (Cindy A=75, Ashley A=80) have moderate
      // Agreeableness; Fe-driver-misread-as-Se patterns (Kevin A=91)
      // have very high Agreeableness — that's the discriminator.
      // Gate: only fire when A<=85. Empirical effect: Kevin Se drops
      // 25 (fe=85 vs se=55 → gap=30 ✓ disagree fires); Cindy/Ashley
      // unaffected.
      fires:
        (s.workMapRegisterKey?.includes("embodied") === true ||
          s.workMapRegisterKey?.includes("craft") === true) &&
        s.oceanAgreeableness <= 85,
      weight: 25,
      label: "se: workMap=EmbodiedCraft + agreeableness<=85",
    },
    {
      fires: s.subRegister === "relational",
      weight: 20,
      label: "se: subRegister=relational",
    },
    {
      // CC-097B-CALIBRATION-V2 — added Agreeableness gate to Se's
      // Family-compass attractor. The Class C Fe-driver-misread-as-Se
      // pattern (Kevin) has very-high Agreeableness (≥90) — Fe
      // protector territory, not Se present-engagement. Cindy's
      // genuine Se A=75 and Ashley's A=80 both stay below the
      // 85 gate; only Kevin (A=91) loses this +15, which combined
      // with the EmbodiedCraft gate above drops his Se from 80 to 40
      // — clearing the disagree-classifier's qt-ceiling of 40.
      fires:
        compassContains(s.compassLabels, "Family") &&
        !compassContains(s.compassLabels, "Knowledge") &&
        !compassContains(s.compassLabels, "Truth") &&
        s.oceanAgreeableness <= 85,
      weight: 15,
      label: "se: compass=Family && !Knowledge && !Truth && agreeableness<=85",
    },
    {
      fires: s.distribution.people_service_society >= 0.4,
      weight: 15,
      label: "se: distribution.people_service_society>=0.40",
    },
    { fires: s.oceanOpenness <= 75, weight: 10, label: "se: openness<=75" },
    {
      fires: s.oceanConscientiousness <= 95,
      weight: 10,
      label: "se: conscientiousness<=95",
    },
    {
      fires: s.costSurfaceCount >= 4,
      weight: 5,
      label: "se: cost_surface>=4",
    },
  ]);
}

function scoreFe(s: ExtractedSignals): { score: number; trace: string[] } {
  return scoreFromComponents([
    {
      fires:
        compassContains(s.compassLabels, "Family") &&
        (compassContains(s.compassLabels, "Compassion") ||
          compassContains(s.compassLabels, "Loyalty")),
      weight: 25,
      label: "fe: compass=Family+(Compassion|Loyalty)",
    },
    {
      fires:
        s.oceanAgreeableness >= 90 &&
        s.agreeablenessRegister === "moral-concern-dominant",
      weight: 20,
      label: "fe: agreeableness>=90 && moral-concern-dominant",
    },
    {
      fires:
        s.workMapRegisterKey?.includes("pastoral") === true ||
        s.workMapRegisterKey?.includes("counselor") === true ||
        s.workMapRegisterKey?.includes("embodied") === true,
      weight: 15,
      label: "fe: workMap∈{Pastoral,Counselor,EmbodiedCraft}",
    },
    {
      fires:
        s.subRegister === "relational" || s.subRegister === "protective",
      weight: 15,
      label: "fe: subRegister∈{relational,protective}",
    },
    {
      fires: trustRegisterIncludesRelational(s.trustTopLabels),
      weight: 10,
      label: "fe: trust includes relational labels",
    },
    {
      fires: s.costSurfaceCount >= 4,
      weight: 10,
      label: "fe: cost_surface>=4",
    },
    {
      fires: s.distribution.people_service_society >= 0.4,
      weight: 5,
      label: "fe: distribution.people_service_society>=0.40",
    },
  ]);
}

function scoreFi(s: ExtractedSignals): { score: number; trace: string[] } {
  return scoreFromComponents([
    {
      fires: s.keystoneRegister === "individual-conscience-autonomy",
      weight: 25,
      label: "fi: keystone=individual-conscience-autonomy",
    },
    {
      // CC-097B-CALIBRATION-V2 — narrowed Fi Freedom-anchored condition.
      // Pre-V2 fired on any compass=Freedom+(Truth|Justice). This was
      // over-triggering for Ne-driver humanist users (Michele:
      // Freedom+Truth+Justice all top-4, but her Fi is aux not driver
      // and her keystone is humanist-universal not individual-
      // conscience). Per feedback_se_fi_attractor_canon.md the Fi-
      // driver signature requires the conscience-autonomy keystone
      // explicitly; without it, Freedom+Truth/Justice is the Ne-
      // humanist pattern. Adding the keystone guard suppresses
      // Michele's accidental Fi co-firing (-20) while preserving Fi-
      // drivers (whose keystone IS individual-conscience-autonomy).
      fires:
        s.keystoneRegister === "individual-conscience-autonomy" &&
        compassContains(s.compassLabels, "Freedom") &&
        (compassContains(s.compassLabels, "Truth") ||
          compassContains(s.compassLabels, "Justice")),
      weight: 20,
      label: "fi: keystone=individual-conscience-autonomy + compass=Freedom+(Truth|Justice)",
    },
    {
      fires: s.costSurfaceCount <= 3,
      weight: 15,
      label: "fi: cost_surface<=3",
    },
    {
      fires:
        s.oceanAgreeableness >= 80 &&
        s.agreeablenessRegister === "moral-concern-dominant",
      weight: 15,
      label: "fi: agreeableness>=80 && moral-concern-dominant",
    },
    {
      fires: compassContains(s.compassLabels, "Compassion"),
      weight: 10,
      label: "fi: compass=Compassion",
    },
    {
      fires: trustRegisterIncludes(s.trustTopLabels, "own counsel"),
      weight: 10,
      label: "fi: trust includes own counsel",
    },
    {
      fires:
        s.workMapRegisterKey?.includes("pastoral") === true ||
        s.workMapRegisterKey?.includes("counselor") === true,
      weight: 5,
      label: "fi: workMap=Pastoral/Counselor",
    },
  ]);
}

function scoreTe(
  s: ExtractedSignals,
  disc: DiSCScores
): { score: number; trace: string[] } {
  const dHighest = disc.D === Math.max(disc.D, disc.i, disc.S, disc.C);
  const sLowest = disc.S === Math.min(disc.D, disc.i, disc.S, disc.C);
  return scoreFromComponents([
    { fires: dHighest, weight: 25, label: "te: DiSC D-highest" },
    {
      fires:
        s.workMapRegisterKey?.includes("strategic") === true ||
        s.workMapRegisterKey?.includes("architect") === true ||
        s.workMapRegisterKey?.includes("operational") === true ||
        s.workMapRegisterKey?.includes("steward") === true,
      weight: 20,
      label: "te: workMap∈{Strategic,Architectural,Operational,Stewardship}",
    },
    {
      fires:
        compassContains(s.compassLabels, "Knowledge") ||
        compassContains(s.compassLabels, "Honor"),
      weight: 15,
      label: "te: compass∈{Knowledge,Honor}",
    },
    {
      fires:
        s.oceanExtraversion >= 60 && s.oceanConscientiousness >= 90,
      weight: 15,
      label: "te: extraversion>=60 && conscientiousness>=90",
    },
    {
      fires: s.distribution.building_and_wealth >= 0.25,
      weight: 10,
      label: "te: distribution.building_and_wealth>=0.25",
    },
    { fires: sLowest, weight: 10, label: "te: DiSC S-low" },
    {
      fires: s.subRegister === "mastery",
      weight: 5,
      label: "te: subRegister=mastery",
    },
  ]);
}

function scoreTi(
  s: ExtractedSignals,
  disc: DiSCScores
): { score: number; trace: string[] } {
  const dLow = disc.D <= Math.max(disc.D, disc.i, disc.S, disc.C) * 0.65;
  const cHigh = disc.C === Math.max(disc.D, disc.i, disc.S, disc.C);
  return scoreFromComponents([
    {
      fires:
        compassContains(s.compassLabels, "Knowledge") &&
        compassContains(s.compassLabels, "Truth"),
      weight: 20,
      label: "ti: compass=Knowledge+Truth",
    },
    {
      fires:
        s.oceanOpenness >= 75 &&
        s.oceanConscientiousness >= 80 &&
        s.oceanAgreeableness <= 75,
      weight: 20,
      label: "ti: openness>=75 && conscientiousness>=80 && agreeableness<=75",
    },
    {
      fires:
        s.workMapRegisterKey?.includes("strategic") === true ||
        s.workMapRegisterKey?.includes("architect") === true,
      weight: 15,
      label: "ti: workMap=Strategic/Architectural",
    },
    {
      fires: s.costSurfaceCount <= 3,
      weight: 15,
      label: "ti: cost_surface<=3",
    },
    {
      fires: s.keystoneRegister === "logical-coherence-bearing",
      weight: 10,
      label: "ti: keystone=logical-coherence-bearing",
    },
    {
      fires: dLow && cHigh,
      weight: 10,
      label: "ti: DiSC D-low && C-high",
    },
    {
      fires: s.oceanAgreeableness <= 75,
      weight: 5,
      label: "ti: agreeableness<=75",
    },
  ]);
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

export function inferDriverFromCrossSignals(
  constitution: InnerConstitution
): CrossSignalDriverInference {
  const signals = extractAllSignals(constitution);
  // Goal-orientation proxy for DiSC: use distribution.building_and_wealth
  // mapped to 0–100. Placeholder until a Goal score is exposed
  // first-class — keeps the function pure rather than reaching into
  // multi-cycle Goal computation.
  const goalOrientationProxy = signals.distribution.building_and_wealth * 100;
  const disc = deriveDiSC(signals, goalOrientationProxy);

  const ni = scoreNi(signals);
  const ne = scoreNe(signals);
  const si = scoreSi(signals);
  const se = scoreSe(signals);
  const fe = scoreFe(signals);
  const fi = scoreFi(signals);
  const te = scoreTe(signals, disc);
  const ti = scoreTi(signals, disc);

  const scores: CrossSignalScores = {
    ni: ni.score,
    ne: ne.score,
    si: si.score,
    se: se.score,
    ti: ti.score,
    te: te.score,
    fi: fi.score,
    fe: fe.score,
  };

  const ranked = (Object.entries(scores) as [CrossSignalFunctionId, number][])
    .sort((a, b) => b[1] - a[1]);
  const inferredDriver = ranked[0][0];
  const inferredDriverScore = ranked[0][1];
  const scoreGap = ranked[0][1] - ranked[1][1];

  // Compose the evidence trace — top-3 scoring functions' contributing
  // components plus the global signal extraction summary.
  const evidenceTrace: string[] = [
    `compass=${signals.compassLabels.join(",") || "(none)"}`,
    `ocean.O=${signals.oceanOpenness.toFixed(0)} C=${signals.oceanConscientiousness.toFixed(0)} E=${signals.oceanExtraversion.toFixed(0)} A=${signals.oceanAgreeableness.toFixed(0)}`,
    `workMap=${signals.workMapRegisterKey ?? "(null)"}`,
    `keystone=${signals.keystoneRegister ?? "(null)"}`,
    `sub=${signals.subRegister ?? "(null)"} agreeReg=${signals.agreeablenessRegister ?? "(null)"}`,
    `costSurface=${signals.costSurfaceCount}`,
    `trustTop=${signals.trustTopLabels.join(",") || "(none)"}`,
    `dist.bw=${signals.distribution.building_and_wealth.toFixed(2)} pss=${signals.distribution.people_service_society.toFixed(2)} risk=${signals.distribution.risk_and_uncertainty.toFixed(2)}`,
    `DiSC D=${disc.D.toFixed(0)} i=${disc.i.toFixed(0)} S=${disc.S.toFixed(0)} C=${disc.C.toFixed(0)}`,
    `scores: ${ranked.map(([fn, sc]) => `${fn}=${sc}`).join(" ")}`,
    ...ranked.slice(0, 3).flatMap(([fn]) => {
      const tracesByFn: Record<CrossSignalFunctionId, string[]> = {
        ni: ni.trace,
        ne: ne.trace,
        si: si.trace,
        se: se.trace,
        fe: fe.trace,
        fi: fi.trace,
        te: te.trace,
        ti: ti.trace,
      };
      return tracesByFn[fn].map((t) => `[${fn}] ${t}`);
    }),
  ];

  return {
    inferredDriver,
    inferredDriverScore,
    scoreGap,
    scores,
    disc,
    evidenceTrace,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Mirror-axis detection
// ─────────────────────────────────────────────────────────────────────

const MIRROR_AXIS_FLOOR = 50; // both partners must score >= 50

export function detectMirrorAxis(
  qtDirectDriver: CrossSignalFunctionId,
  crossSignal: CrossSignalDriverInference
): {
  axisName: string;
  primary: CrossSignalFunctionId;
  secondary: CrossSignalFunctionId;
  primaryScore: number;
  secondaryScore: number;
} | null {
  const mirror = PERCEIVING_MIRROR_PAIRS[qtDirectDriver];
  if (!mirror) return null;
  if (mirror !== crossSignal.inferredDriver) return null;
  const qtScore = crossSignal.scores[qtDirectDriver];
  const csScore = crossSignal.scores[mirror];
  if (qtScore < MIRROR_AXIS_FLOOR || csScore < MIRROR_AXIS_FLOOR) return null;
  return {
    axisName: `${qtDirectDriver.toUpperCase()}-${mirror.toUpperCase()}`,
    primary: qtDirectDriver,
    secondary: mirror,
    primaryScore: qtScore,
    secondaryScore: csScore,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Agreement classifier — runs at the integration site
// ─────────────────────────────────────────────────────────────────────

export type CrossSignalAgreementResult =
  | {
      agreement: "agree";
      crossSignalInferredDriver: CrossSignalFunctionId;
    }
  | {
      agreement: "disagree-prefer-cross-signal";
      crossSignalInferredDriver: CrossSignalFunctionId;
    }
  | {
      agreement: "mirror-axis";
      crossSignalInferredDriver: CrossSignalFunctionId;
      mirrorAxis: {
        axisName: string;
        primary: CrossSignalFunctionId;
        secondary: CrossSignalFunctionId;
        primaryScore: number;
        secondaryScore: number;
      };
    };

// Thresholds for the disagree path. The CC-097B-CALIBRATION follow-up
// is expected to refine these against the synthetic Class B/C fixtures;
// for now they're set conservatively so the existing cohort's gradient
// agreement cases (where the cross-signal scoring is approximate and
// the Q-T-direct driver scores in the second tier) stay classified as
// "agree" — preventing the integration from regressing the cohort's
// rendered Lens prose. The mirror-axis path is gated separately by
// `detectMirrorAxis`'s floor (both partners >= 50).
const DISAGREE_INFERRED_SCORE_FLOOR = 60;
const DISAGREE_GAP_FLOOR = 20;
const DISAGREE_QT_DRIVER_CEILING = 40;

export function classifyAgreement(
  qtDirectDriver: CrossSignalFunctionId,
  crossSignal: CrossSignalDriverInference
): CrossSignalAgreementResult {
  if (crossSignal.inferredDriver === qtDirectDriver) {
    return {
      agreement: "agree",
      crossSignalInferredDriver: crossSignal.inferredDriver,
    };
  }
  // Mirror-axis takes precedence over disagree when the partners are
  // canonical perceiving pairs and both score >= 50.
  const mirror = detectMirrorAxis(qtDirectDriver, crossSignal);
  if (mirror) {
    return {
      agreement: "mirror-axis",
      crossSignalInferredDriver: crossSignal.inferredDriver,
      mirrorAxis: mirror,
    };
  }
  // Conservative disagree-fire gate. Requires:
  //   - Cross-signal inferred driver score >= 60 (strong positive evidence)
  //   - Gap to second-place function >= 20 (unambiguous winner)
  //   - Q-T direct driver's own cross-signal score <= 40 (the surface
  //     read isn't well-supported by other signals).
  // When ANY of these fail, we stay in "agree" mode rather than
  // overriding the Q-T direct read on a thin cross-signal margin.
  const qtCrossSignalScore = crossSignal.scores[qtDirectDriver];
  const strongDisagreeEvidence =
    crossSignal.inferredDriverScore >= DISAGREE_INFERRED_SCORE_FLOOR &&
    crossSignal.scoreGap >= DISAGREE_GAP_FLOOR &&
    qtCrossSignalScore <= DISAGREE_QT_DRIVER_CEILING;
  if (!strongDisagreeEvidence) {
    return {
      agreement: "agree",
      crossSignalInferredDriver: crossSignal.inferredDriver,
    };
  }
  return {
    agreement: "disagree-prefer-cross-signal",
    crossSignalInferredDriver: crossSignal.inferredDriver,
  };
}
