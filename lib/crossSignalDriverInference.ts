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
  // Pre-CC-067 / pre-CC-070 saved sessions don't carry goalSoulMovement.
  // Default to zero buckets so the related score components stay neutral.
  const movement = constitution.goalSoulMovement;
  if (!movement) {
    return {
      building_and_wealth: 0,
      people_service_society: 0,
      risk_and_uncertainty: 0,
    };
  }
  // The bucket label vocabulary on the dashboard payload varies by CC.
  // We look up by canonical label substrings, lowercase-insensitive.
  const dashboard = movement.dashboard as unknown as {
    driveDistribution?: { bucketScores?: Record<string, number> };
  };
  const buckets = dashboard?.driveDistribution?.bucketScores ?? {};
  function lookup(...needles: string[]): number {
    for (const [key, value] of Object.entries(buckets)) {
      const k = key.toLowerCase();
      if (needles.some((n) => k.includes(n))) return value;
    }
    return 0;
  }
  const total = Object.values(buckets).reduce((s, v) => s + v, 0);
  const norm = total > 0 ? (v: number) => v / total : (v: number) => v;
  return {
    building_and_wealth: norm(lookup("building", "wealth", "system")),
    people_service_society: norm(lookup("people", "service", "society")),
    risk_and_uncertainty: norm(lookup("risk", "uncertainty", "freedom")),
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

const TRUST_LABEL_BY_SIGNAL: Record<string, string> = {
  trust_religious: "Religious",
  trust_small_business: "Small Business",
  trust_mentor: "mentor",
  trust_education: "Education",
  trust_journalism: "Journalism",
  trust_government: "Government",
  trust_corporate: "Corporate",
  trust_own_counsel: "own counsel",
  trust_family: "Family",
  trust_friends: "Friends",
};

function extractTrustTopLabels(
  constitution: InnerConstitution
): string[] {
  const labels: string[] = [];
  for (const s of constitution.signals) {
    if (s.signal_id.startsWith("trust_") && (s.rank ?? 99) <= 3) {
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
  return {
    D: weightedSum([
      { signal: signals.functionSignalStrength.te, weight: 0.35 },
      { signal: goalOrientationProxy, weight: 0.25 },
      { signal: 100 - signals.oceanAgreeableness, weight: 0.15 },
      { signal: signals.oceanExtraversion, weight: 0.15 },
      { signal: signals.distribution.building_and_wealth * 100, weight: 0.10 },
    ]),
    i: weightedSum([
      { signal: signals.functionSignalStrength.fe, weight: 0.30 },
      { signal: signals.functionSignalStrength.ne, weight: 0.20 },
      { signal: signals.oceanExtraversion, weight: 0.20 },
      { signal: signals.oceanAgreeableness, weight: 0.15 },
      { signal: signals.distribution.people_service_society * 100, weight: 0.15 },
    ]),
    S: weightedSum([
      { signal: signals.functionSignalStrength.si, weight: 0.30 },
      { signal: signals.functionSignalStrength.fe, weight: 0.25 },
      { signal: signals.oceanAgreeableness, weight: 0.20 },
      { signal: 100 - signals.oceanOpenness, weight: 0.15 },
      { signal: Math.min(100, signals.costSurfaceCount * 10), weight: 0.10 },
    ]),
    C: weightedSum([
      { signal: signals.functionSignalStrength.ti, weight: 0.25 },
      { signal: signals.functionSignalStrength.ni, weight: 0.20 },
      { signal: signals.oceanConscientiousness, weight: 0.25 },
      { signal: compassKnowOrTruth ? 100 : 0, weight: 0.15 },
      { signal: signals.oceanOpenness, weight: 0.15 },
    ]),
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
    { fires: s.oceanOpenness >= 75, weight: 10, label: "ni: openness>=75" },
    {
      fires: s.oceanConscientiousness >= 90,
      weight: 10,
      label: "ni: conscientiousness>=90",
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
      fires: s.oceanOpenness >= 75 && s.oceanConscientiousness >= 80,
      weight: 15,
      label: "ne: openness>=75 && conscientiousness>=80",
    },
    {
      fires: s.costSurfaceCount <= 3,
      weight: 15,
      label: "ne: cost_surface<=3",
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
      fires:
        compassContains(s.compassLabels, "Faith") &&
        (compassContains(s.compassLabels, "Honor") ||
          compassContains(s.compassLabels, "Loyalty")),
      weight: 25,
      label: "si: compass∈{Faith}+(Honor|Loyalty)",
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
      fires:
        s.workMapRegisterKey?.includes("embodied") === true ||
        s.workMapRegisterKey?.includes("craft") === true,
      weight: 25,
      label: "se: workMap=EmbodiedCraft",
    },
    {
      fires: s.subRegister === "relational",
      weight: 20,
      label: "se: subRegister=relational",
    },
    {
      fires:
        compassContains(s.compassLabels, "Family") &&
        !compassContains(s.compassLabels, "Knowledge") &&
        !compassContains(s.compassLabels, "Truth"),
      weight: 15,
      label: "se: compass=Family && !Knowledge && !Truth",
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
      fires:
        compassContains(s.compassLabels, "Freedom") &&
        (compassContains(s.compassLabels, "Truth") ||
          compassContains(s.compassLabels, "Justice")),
      weight: 20,
      label: "fi: compass=Freedom+(Truth|Justice)",
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
