// CC-042 — Work Map Derivation Framework.
//
// Composes existing measurements (Lens aux-pair register, Drive distribution,
// OCEAN, Q-E1 energy allocation, Compass values + concrete stakes,
// Q-Ambition1, Path agency aspiration) into 1–2 work registers the user is
// structurally aligned to. The user is never asked vocation-specific
// questions; the Work Map is pure derivation per the project's standing rule
// (`feedback_minimal_questions_maximum_output`).
//
// Architectural rules (do not relax without canon revision; see
// docs/canon/work-map.md):
//   - Derivation only — no claimed-vs-revealed split, no new questions, no
//     new signals.
//   - The 8 register identities (`register_key`) and predicate-input
//     structure are canonical. Labels, descriptions, anchors, and the
//     `composes_naturally_with` lists are v1 placeholders subject to a
//     future workshop CC.
//   - Predicates return 0..1 fit scores. Top-1 if score > 0.7; else top-2 if
//     both > 0.5; else single weak match if > 0.4; else undefined (the page
//     section gracefully omits).
//   - Predicates combine boolean gates (Lens register membership, agency
//     aspiration) with normalized soft components (Drive percentages, OCEAN
//     percentages, signal-presence checks). The intent is locked; the
//     implementation choice is workshop-tunable. Threshold values are named
//     constants.
//   - The Work Map is a sibling of the Disposition Map (CC-037). The
//     architectural pattern transfers to CC-043 (Love Map) and CC-044
//     (Giving Map); avoid coupling the framework to vocation-specific
//     primitives.

import type {
  Answer,
  DriveOutput,
  FunctionPairKey,
  LensStack,
  OceanOutput,
  Signal,
  SignalId,
  WorkMapMatch,
  WorkMapOutput,
  WorkRegister,
  WorkRegisterKey,
} from "./types";

// ── Thresholds (named constants for visible tuning) ─────────────────────

export const TOP_ONE_SCORE_THRESHOLD = 0.7; // top-1 alone if score above this
export const TOP_TWO_FLOOR_THRESHOLD = 0.5; // both must clear for top-2
export const SINGLE_WEAK_MATCH_THRESHOLD = 0.4; // floor for single weak match

// ── Predicate inputs ─────────────────────────────────────────────────────

export type WorkMapInputs = {
  signals: Signal[];
  answers: Answer[];
  lensStack: LensStack;
  driveOutput: DriveOutput | undefined;
  oceanOutput: OceanOutput | undefined;
  // Inferred agency aspiration from existing engine code (Q-A1 / Q-A2).
  // Optional; predicates degrade gracefully when absent.
  agencyAspiration?: "creator" | "relational" | "stability" | "exploration" | "unknown";
};

// ── Helpers ──────────────────────────────────────────────────────────────

function hasSignal(signals: Signal[], id: SignalId): boolean {
  return signals.some((s) => s.signal_id === id);
}

function topRankSignals(signals: Signal[], topN: number): SignalId[] {
  // Return signal_ids that landed in the top-N rank slots of any ranking.
  // Used to test "in Compass top 3", "high in Q-E1", etc.
  const ids: SignalId[] = [];
  for (const s of signals) {
    if (s.rank !== undefined && s.rank <= topN) ids.push(s.signal_id);
  }
  return ids;
}

function isCostLeaning(drive: DriveOutput | undefined): boolean {
  if (!drive) return false;
  const d = drive.distribution;
  return d.cost >= d.coverage && d.cost >= d.compliance && d.cost >= 38;
}

function isCoverageLeaning(drive: DriveOutput | undefined): boolean {
  if (!drive) return false;
  const d = drive.distribution;
  return d.coverage >= d.cost && d.coverage >= d.compliance && d.coverage >= 38;
}

function isBalancedDrive(drive: DriveOutput | undefined): boolean {
  if (!drive) return false;
  const d = drive.distribution;
  const max = Math.max(d.cost, d.coverage, d.compliance);
  const min = Math.min(d.cost, d.coverage, d.compliance);
  return max - min <= 12;
}

function lensDriverIs(stack: LensStack, fns: string[]): boolean {
  return fns.includes(stack.dominant);
}

function lensInstrumentIs(stack: LensStack, fns: string[]): boolean {
  return fns.includes(stack.auxiliary);
}

function lensPairKey(stack: LensStack): FunctionPairKey | undefined {
  if (!stack.dominant || !stack.auxiliary) return undefined;
  const dom = stack.dominant.charAt(0).toUpperCase() + stack.dominant.slice(1);
  const aux = stack.auxiliary.charAt(0).toUpperCase() + stack.auxiliary.slice(1);
  return `${dom}${aux}` as FunctionPairKey;
}

function lensInPairs(stack: LensStack, pairs: FunctionPairKey[]): boolean {
  const key = lensPairKey(stack);
  return key !== undefined && pairs.includes(key);
}

// Saturating soft-score over a 0..100 percentage. Maps a target percentage to
// a 0..1 contribution that ramps once the bucket clears `floor` and saturates
// at `ceiling`. Keeps the predicate continuous so small movements in inputs
// produce small movements in scores.
function ramp(value: number, floor: number, ceiling: number): number {
  if (value <= floor) return 0;
  if (value >= ceiling) return 1;
  return (value - floor) / (ceiling - floor);
}

// ── 8 work registers — locked structure, v1 placeholder content ─────────

const STRATEGIC_LENSES: FunctionPairKey[] = ["NiTe", "TeNi", "TiNe"];
const ANALYTICAL_LENSES: FunctionPairKey[] = ["TiNe", "TiSe", "NeTi", "SiTe"];
const EMBODIED_LENSES: FunctionPairKey[] = ["SeTi", "SeFi", "TiSe"];
const PASTORAL_LENSES: FunctionPairKey[] = ["NiFe", "FeNi", "FiNe"];
const ADVOCACY_LENSES: FunctionPairKey[] = ["FiNe", "FeNi", "NeFi", "TiNe"];
const STEWARDSHIP_LENSES: FunctionPairKey[] = ["TeSi", "SiTe", "SiFe"];

export const WORK_REGISTERS: readonly WorkRegister[] = [
  {
    register_key: "strategic_architectural",
    register_label: "Strategic / Architectural Work",
    short_description:
      "Work that requires holding the long arc and building the structure to realize it. Time horizons matter; the work compounds across years rather than weeks. Composes with the architect, the strategist, and the long-arc minds.",
    example_anchors: [
      "research lab leadership / R&D direction",
      "strategic planning, architectural practice",
      "founder roles, academic department leadership",
    ],
    composes_naturally_with: STRATEGIC_LENSES,
  },
  {
    register_key: "analytical_investigative",
    register_label: "Analytical / Investigative Work",
    short_description:
      "Work that rewards precision-thinking and the discipline of testing what is actually claimed. The texture is depth-of-understanding, not breadth-of-output.",
    example_anchors: [
      "research scientist, data analyst",
      "investigative journalist, archivist",
      "technical writer",
    ],
    composes_naturally_with: ANALYTICAL_LENSES,
  },
  {
    register_key: "embodied_craft",
    register_label: "Embodied Craft Work",
    short_description:
      "Work that lives in the body — skill expressed through hands, presence, timing, contact. The framework is internalized; the doing is precise because the body knows.",
    example_anchors: [
      "surgeon, technician, master craftsperson",
      "performer / athlete",
      "chef, instrument-maker",
    ],
    composes_naturally_with: EMBODIED_LENSES,
  },
  {
    register_key: "caring_service",
    register_label: "Caring / Direct-Service Work",
    short_description:
      "Work that lives in attending to people in concrete need. The texture is presence with another's experience; the reward is the relational continuity itself.",
    example_anchors: [
      "nurse, hospice worker, social worker",
      "therapist, counselor",
      "teacher, midwife, hospice chaplain",
    ],
    composes_naturally_with: ["FiSe", "FeSi", "SeFi"],
  },
  {
    register_key: "pastoral_counselor",
    register_label: "Pastoral / Counselor Work",
    short_description:
      "Work that holds an unhurried sense of who someone is becoming and tends that becoming through patient relational presence. Long-arc relational, not direct-care urgent.",
    example_anchors: [
      "psychotherapist, spiritual director",
      "coach, mentor, advisor",
      "clergy, pastoral counselor",
    ],
    composes_naturally_with: PASTORAL_LENSES,
  },
  {
    register_key: "civic_advocacy",
    register_label: "Civic / Advocacy Work",
    short_description:
      "Work that names what is owed and protects those who can't protect themselves. Values-driven public action; the texture is structural-ethical.",
    example_anchors: [
      "lawyer (public-interest, civil rights)",
      "activist, organizer, nonprofit leadership",
      "public servant, policy advisor",
    ],
    composes_naturally_with: ADVOCACY_LENSES,
  },
  {
    register_key: "generative_creative",
    register_label: "Generative / Creative Work",
    short_description:
      "Work that turns possibilities into invitations. The texture is values-as-expression; the gift is naming what could become true so others can see it.",
    example_anchors: [
      "writer, artist, designer",
      "teacher (creative subjects), filmmaker",
      "marketing/brand, copywriter, performer",
    ],
    composes_naturally_with: ["NeFi", "FiNe", "SeFi", "NeTi"],
  },
  {
    register_key: "operational_stewardship",
    register_label: "Operational / Stewardship Work",
    short_description:
      "Work that keeps systems running through standards, precedent, duty, and operational trust. The texture is reliability over years; the gift is making the institution continue to work.",
    example_anchors: [
      "operations management, COO",
      "institutional administration",
      "military / police leadership, project / program management",
    ],
    composes_naturally_with: STEWARDSHIP_LENSES,
  },
];

// ── Predicates ───────────────────────────────────────────────────────────
//
// Each predicate receives the full `WorkMapInputs` and returns a 0..1 fit
// score. The locked content section in CC-042 / docs/canon/work-map.md
// describes the *intent* of each predicate; the implementation here combines
// boolean gates with soft ramps so small input movements produce small
// score movements.

type Predicate = (inputs: WorkMapInputs) => number;

const strategicArchitectural: Predicate = (inp) => {
  const lensFit = lensInPairs(inp.lensStack, STRATEGIC_LENSES) ? 1 : 0;
  const driveFit =
    isCostLeaning(inp.driveOutput) || inp.agencyAspiration === "creator"
      ? 1
      : 0;
  const oFit = inp.oceanOutput ? ramp(inp.oceanOutput.distribution.O, 18, 30) : 0;
  const cFit = inp.oceanOutput ? ramp(inp.oceanOutput.distribution.C, 18, 30) : 0;
  // Weighted: lens 0.35, drive/aspiration 0.25, openness 0.2, conscientiousness 0.2.
  return lensFit * 0.35 + driveFit * 0.25 + oFit * 0.2 + cFit * 0.2;
};

const analyticalInvestigative: Predicate = (inp) => {
  const lensInPair = lensInPairs(inp.lensStack, ANALYTICAL_LENSES) ? 1 : 0;
  const driverFit =
    lensDriverIs(inp.lensStack, ["ti", "ni"]) || lensInstrumentIs(inp.lensStack, ["ti"])
      ? 1
      : 0;
  const top3 = topRankSignals(inp.signals, 3);
  const truthOrKnowledge =
    top3.includes("truth_priority") || top3.includes("knowledge_priority")
      ? 1
      : hasSignal(inp.signals, "truth_priority_high")
      ? 0.7
      : 0;
  const oFit = inp.oceanOutput ? ramp(inp.oceanOutput.distribution.O, 18, 32) : 0;
  // Lens fit can fire from either a direct pair match or a Ti/Ni driver
  // combined with a value match. Avoid double-counting by taking the max.
  const lensComponent = Math.max(lensInPair, driverFit * 0.7);
  return lensComponent * 0.4 + truthOrKnowledge * 0.3 + oFit * 0.3;
};

const embodiedCraft: Predicate = (inp) => {
  const lensFit = lensInPairs(inp.lensStack, EMBODIED_LENSES) ? 1 : 0;
  const energyFit =
    hasSignal(inp.signals, "building_energy_priority") ||
    hasSignal(inp.signals, "restoring_energy_priority") ||
    hasSignal(inp.signals, "solving_energy_priority")
      ? 1
      : 0;
  const cFit = inp.oceanOutput ? ramp(inp.oceanOutput.distribution.C, 18, 30) : 0;
  return lensFit * 0.5 + energyFit * 0.25 + cFit * 0.25;
};

const caringService: Predicate = (inp) => {
  const driverOrInstrumentFiFe =
    lensDriverIs(inp.lensStack, ["fi", "fe"]) ||
    lensInstrumentIs(inp.lensStack, ["fi", "fe"])
      ? 1
      : 0;
  const driveFit = isCoverageLeaning(inp.driveOutput) ? 1 : 0;
  const caringEnergy = hasSignal(inp.signals, "caring_energy_priority") ? 1 : 0;
  const top3 = topRankSignals(inp.signals, 3);
  const compassionOrFamily =
    top3.includes("compassion_priority") || top3.includes("family_priority")
      ? 1
      : 0;
  const aFit = inp.oceanOutput ? ramp(inp.oceanOutput.distribution.A, 22, 35) : 0;
  return (
    driverOrInstrumentFiFe * 0.3 +
    driveFit * 0.2 +
    caringEnergy * 0.15 +
    compassionOrFamily * 0.15 +
    aFit * 0.2
  );
};

const pastoralCounselor: Predicate = (inp) => {
  const lensFit = lensInPairs(inp.lensStack, PASTORAL_LENSES) ? 1 : 0;
  const driveFit = isCoverageLeaning(inp.driveOutput) ? 1 : 0;
  const top3 = topRankSignals(inp.signals, 3);
  const valueFit =
    top3.includes("faith_priority") ||
    top3.includes("mercy_priority") ||
    top3.includes("family_priority")
      ? 1
      : 0;
  const aFit = inp.oceanOutput ? ramp(inp.oceanOutput.distribution.A, 18, 32) : 0;
  const ambitionFit =
    hasSignal(inp.signals, "legacy_priority") ||
    hasSignal(inp.signals, "success_priority")
      ? 1
      : 0;
  return (
    lensFit * 0.3 +
    driveFit * 0.2 +
    valueFit * 0.2 +
    aFit * 0.15 +
    ambitionFit * 0.15
  );
};

const civicAdvocacy: Predicate = (inp) => {
  const top3 = topRankSignals(inp.signals, 3);
  const justiceFit = top3.includes("justice_priority") ? 1 : 0;
  const responsibilityFit =
    hasSignal(inp.signals, "individual_responsibility_priority") &&
    hasSignal(inp.signals, "system_responsibility_priority")
      ? 1
      : hasSignal(inp.signals, "individual_responsibility_priority") ||
        hasSignal(inp.signals, "system_responsibility_priority")
      ? 0.5
      : 0;
  const driveFit =
    isCoverageLeaning(inp.driveOutput) || isBalancedDrive(inp.driveOutput) ? 1 : 0;
  const lensFit = lensInPairs(inp.lensStack, ADVOCACY_LENSES) ? 1 : 0;
  return justiceFit * 0.4 + responsibilityFit * 0.25 + driveFit * 0.15 + lensFit * 0.2;
};

const generativeCreative: Predicate = (inp) => {
  const driverFit =
    lensDriverIs(inp.lensStack, ["ne", "fi"]) ||
    lensInstrumentIs(inp.lensStack, ["ne", "fi"])
      ? 1
      : 0;
  const oFit = inp.oceanOutput ? ramp(inp.oceanOutput.distribution.O, 22, 38) : 0;
  const energyFit =
    hasSignal(inp.signals, "learning_energy_priority") ||
    hasSignal(inp.signals, "enjoying_energy_priority")
      ? 1
      : 0;
  // Drive is intentionally weak here — generative work can be cost- or
  // coverage-leaning. Don't gate on a single bucket.
  const driveFit = inp.driveOutput ? 0.5 : 0;
  return driverFit * 0.35 + oFit * 0.3 + energyFit * 0.25 + driveFit * 0.1;
};

const operationalStewardship: Predicate = (inp) => {
  const lensFit = lensInPairs(inp.lensStack, STEWARDSHIP_LENSES) ? 1 : 0;
  const cFit = inp.oceanOutput ? ramp(inp.oceanOutput.distribution.C, 22, 35) : 0;
  const top3 = topRankSignals(inp.signals, 3);
  const valueFit =
    top3.includes("stability_priority") || top3.includes("honor_priority") ? 1 : 0;
  const energyFit =
    hasSignal(inp.signals, "restoring_energy_priority") ||
    hasSignal(inp.signals, "solving_energy_priority")
      ? 1
      : 0;
  return lensFit * 0.35 + cFit * 0.25 + valueFit * 0.2 + energyFit * 0.2;
};

const PREDICATES: Record<WorkRegisterKey, Predicate> = {
  strategic_architectural: strategicArchitectural,
  analytical_investigative: analyticalInvestigative,
  embodied_craft: embodiedCraft,
  caring_service: caringService,
  pastoral_counselor: pastoralCounselor,
  civic_advocacy: civicAdvocacy,
  generative_creative: generativeCreative,
  operational_stewardship: operationalStewardship,
};

// ── Prose generation ─────────────────────────────────────────────────────
//
// Top-1 single match: name the register and quote its short_description.
// Top-2 dual match: name both registers in priority order; the prose surfaces
// the overlap as a register *spread*, not a contradiction. The framing
// paragraph + footnote in the render layer carry the derivation-not-
// prescription register; the prose generated here stays observational.

export function generateWorkProse(matches: WorkMapMatch[]): string {
  if (matches.length === 0) return "";
  if (matches.length === 1) {
    const m = matches[0];
    return `Your composite read points toward ${m.register.register_label.toLowerCase()}. ${m.register.short_description}`;
  }
  const primary = matches[0];
  const secondary = matches[1];
  return `Your composite read points toward ${primary.register.register_label.toLowerCase()} as the strongest register, with ${secondary.register.register_label.toLowerCase()} as a near-second. The two registers can compose — the work that fits you may carry the texture of both at once — or they can pull against each other, and the practice is to notice which register the moment is asking for.`;
}

// ── Top-level: full WorkMapOutput, or undefined when no register fires ──

export function computeWorkMapOutput(
  signals: Signal[],
  answers: Answer[],
  lensStack: LensStack,
  driveOutput: DriveOutput | undefined,
  oceanOutput: OceanOutput | undefined,
  agencyAspiration?: WorkMapInputs["agencyAspiration"]
): WorkMapOutput | undefined {
  const inputs: WorkMapInputs = {
    signals,
    answers,
    lensStack,
    driveOutput,
    oceanOutput,
    agencyAspiration,
  };

  const scored: WorkMapMatch[] = WORK_REGISTERS.map((register) => ({
    register,
    score: PREDICATES[register.register_key](inputs),
  }));
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top) return undefined;

  if (top.score > TOP_ONE_SCORE_THRESHOLD) {
    return { matches: [top], prose: generateWorkProse([top]) };
  }
  const second = scored[1];
  if (
    second &&
    top.score > TOP_TWO_FLOOR_THRESHOLD &&
    second.score > TOP_TWO_FLOOR_THRESHOLD
  ) {
    return {
      matches: [top, second],
      prose: generateWorkProse([top, second]),
    };
  }
  if (top.score > SINGLE_WEAK_MATCH_THRESHOLD) {
    return { matches: [top], prose: generateWorkProse([top]) };
  }
  return undefined;
}
