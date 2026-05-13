// CC-SHAPE-AWARE-PROSE-ROUTING — three-profile canon classifier.
//
// Routes prose-template selection through one of three canonical
// archetypes (jason-type / cindy-type / daniel-type) plus an explicit
// `unmappedType` fallback. Each archetype carries a canonical line, a
// gift-label set, a growth-edge set, a Closing Read template, and a
// surface-grip framing — the prose modules consume the archetype to
// pick the right template instead of defaulting to architect language.
//
// Inputs are existing constitution fields — no new measurements.
// Pure derivation; no API calls.

import type {
  CognitiveFunctionId,
  FunctionPairKey,
  Signal,
} from "./types";
import type { MovementQuadrantLabel } from "./movementQuadrant";

export type ProfileArchetype =
  | "jasonType" // long-arc architect
  | "cindyType" // present-tense caregiver
  | "danielType" // faithful steward
  | "unmappedType"; // explicit fallback

export interface ArchetypeReading {
  primary: ProfileArchetype;
  confidence: "high" | "medium" | "low";
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────────
// Canonical archetype anchor lines + label sets
// ─────────────────────────────────────────────────────────────────────

export const ARCHETYPE_CANONICAL_LINE: Record<ProfileArchetype, string> = {
  jasonType:
    "The work is to translate conviction into visible, revisable, present-tense structure.",
  cindyType:
    "The work is not to care less. It is to let love become sustainable enough to last.",
  danielType:
    "The work is not to abandon what has endured. It is to let what has endured remain alive enough to update.",
  unmappedType:
    "The work is to keep the shape honest as the seasons turn.",
};

export interface ArchetypeGiftLabel {
  label: string;
  growthEdge: string;
}

export const GIFT_LABELS_BY_ARCHETYPE: Record<
  ProfileArchetype,
  ArchetypeGiftLabel[]
> = {
  jasonType: [
    { label: "architectural openness", growthEdge: "structure becoming verdict" },
    { label: "structural mastery", growthEdge: "mastery becoming over-refinement" },
    { label: "long-arc pattern reading", growthEdge: "long-arc believing too early" },
  ],
  cindyType: [
    { label: "present-tense care", growthEdge: "responsiveness becoming reactivity" },
    { label: "protective loyalty", growthEdge: "loyalty becoming self-erasure" },
    { label: "embodied steadiness", growthEdge: "being needed becoming being gripped" },
  ],
  danielType: [
    { label: "stewardship", growthEdge: "continuity becoming control" },
    { label: "faithful responsibility", growthEdge: "responsibility becoming non-delegation" },
    { label: "operational trust", growthEdge: "precedent becoming verdict" },
  ],
  unmappedType: [
    // Per CC out-of-scope #11: keep the existing Te/Ti-coded labels as
    // the fallback so unmapped shapes still get usable prose.
    { label: "clarifying precision", growthEdge: "precision becoming weaponized correctness" },
    { label: "building instinct", growthEdge: "building becoming control" },
    { label: "advocacy", growthEdge: "advocacy becoming combativeness" },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// Driver / Compass / Movement match tables
// ─────────────────────────────────────────────────────────────────────

// Driver pairs (dominant + auxiliary) per archetype. Only the canonical
// 16 FunctionPairKey cells are valid; non-canonical stacks fall back
// to unmappedType.
const DRIVERS_BY_ARCHETYPE: Record<
  Exclude<ProfileArchetype, "unmappedType">,
  Set<FunctionPairKey>
> = {
  // Long-arc architect — Ni-dominant with Te/Fe instrument, or Ti
  // dominant with Ne instrument.
  jasonType: new Set<FunctionPairKey>(["NiTe", "NiFe", "TiNe"]),
  // Present-tense caregiver — Se/Fe dominant + Fi/Si auxiliary in
  // viable Jung-stack pairs.
  cindyType: new Set<FunctionPairKey>(["SeFi", "FiSe", "FeSi"]),
  // Faithful steward — Si dominant + Te/Fe auxiliary, or Te dominant
  // + Si auxiliary.
  danielType: new Set<FunctionPairKey>(["SiTe", "SiFe", "TeSi"]),
};

// Compass signal_ids matching each archetype's named values.
const COMPASS_BY_ARCHETYPE: Record<
  Exclude<ProfileArchetype, "unmappedType">,
  Set<string>
> = {
  jasonType: new Set(["knowledge_priority", "honor_priority", "peace_priority"]),
  cindyType: new Set(["family_priority", "mercy_priority", "loyalty_priority"]),
  danielType: new Set(["faith_priority", "honor_priority", "stability_priority"]),
};

const MOVEMENT_AFFINITY_BY_ARCHETYPE: Record<
  Exclude<ProfileArchetype, "unmappedType">,
  Set<MovementQuadrantLabel>
> = {
  jasonType: new Set([
    "Goal-led Presence",
    "Giving / Presence",
    "Driven Output",
    "Work without Presence",
    "Strained Integration",
  ]),
  cindyType: new Set([
    "Soul-led Presence",
    "Giving / Presence",
    "Love without Form",
    "Anxious Caring",
    "Burdened Care",
    "Strained Integration",
  ]),
  danielType: new Set([
    "Work without Presence",
    "Pressed Output",
    "Goal-led Presence",
    "Driven Output",
    "Giving / Presence",
  ]),
};

// Cognitive-function pair from dominant + auxiliary. Mirrors the
// FunctionPairKey convention used elsewhere (`NiTe` = dominant Ni + aux Te).
function pairKeyFromStack(
  dominant: CognitiveFunctionId,
  auxiliary: CognitiveFunctionId
): FunctionPairKey | null {
  const key = `${dominant[0].toUpperCase()}${dominant[1]}${auxiliary[0].toUpperCase()}${auxiliary[1]}` as FunctionPairKey;
  const allowed: ReadonlyArray<FunctionPairKey> = [
    "NeTi", "NeFi", "NiTe", "NiFe",
    "SeTi", "SeFi", "SiTe", "SiFe",
    "TeNi", "TeSi", "TiNe", "TiSe",
    "FeNi", "FeSi", "FiNe", "FiSe",
  ];
  return allowed.includes(key) ? key : null;
}

// ─────────────────────────────────────────────────────────────────────
// Classifier
// ─────────────────────────────────────────────────────────────────────

export interface ArchetypeInputs {
  dominant: CognitiveFunctionId | null;
  auxiliary: CognitiveFunctionId | null;
  compassSignalIds: string[]; // top-4 Compass signal_ids in rank order
  movementQuadrantLabel: MovementQuadrantLabel | null;
}

export function computeArchetype(inputs: ArchetypeInputs): ArchetypeReading {
  const { dominant, auxiliary, compassSignalIds, movementQuadrantLabel } = inputs;
  const driverPair =
    dominant && auxiliary ? pairKeyFromStack(dominant, auxiliary) : null;

  // Match each candidate archetype on three axes:
  //   1. driver pair matches
  //   2. compass overlap count (top-4)
  //   3. movement quadrant affinity
  type Score = {
    archetype: Exclude<ProfileArchetype, "unmappedType">;
    driverMatch: boolean;
    compassOverlap: number;
    movementMatch: boolean;
  };
  const candidates: Score[] = (
    ["jasonType", "cindyType", "danielType"] as const
  ).map((archetype) => ({
    archetype,
    driverMatch: !!driverPair && DRIVERS_BY_ARCHETYPE[archetype].has(driverPair),
    compassOverlap: compassSignalIds.filter((id) =>
      COMPASS_BY_ARCHETYPE[archetype].has(id)
    ).length,
    movementMatch:
      !!movementQuadrantLabel &&
      MOVEMENT_AFFINITY_BY_ARCHETYPE[archetype].has(movementQuadrantLabel),
  }));

  // Score each: driver=3 if match, compassOverlap raw count, movement=1.
  const ranked = candidates
    .map((c) => ({
      ...c,
      score:
        (c.driverMatch ? 3 : 0) +
        c.compassOverlap +
        (c.movementMatch ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  // Confidence ladder per the CC §A spec:
  //   high   = driver match + ≥2 compass overlap + movement match
  //   medium = driver match + ≥1 compass overlap (any movement)
  //   low    = driver match alone OR ≥3 compass overlap alone
  //   else   = unmappedType
  if (!top.driverMatch && top.compassOverlap < 3) {
    return {
      primary: "unmappedType",
      confidence: "low",
      rationale: `no driver match; top compass overlap=${top.compassOverlap} (<3); driverPair=${driverPair ?? "none"}`,
    };
  }
  let confidence: ArchetypeReading["confidence"];
  if (top.driverMatch && top.compassOverlap >= 2 && top.movementMatch) {
    confidence = "high";
  } else if (top.driverMatch && top.compassOverlap >= 1) {
    confidence = "medium";
  } else {
    confidence = "low";
  }
  return {
    primary: top.archetype,
    confidence,
    rationale: `driverPair=${driverPair ?? "none"} (match=${top.driverMatch}), compassOverlap=${top.compassOverlap}, movement=${movementQuadrantLabel ?? "?"} (match=${top.movementMatch}), score=${top.score}`,
  };
}

// Convenience: derive ArchetypeInputs from a constitution. Imported
// at the engine attachment site.
export function archetypeInputsFromConstitution(constitution: {
  lens_stack?: { dominant: CognitiveFunctionId; auxiliary: CognitiveFunctionId };
  signals: Signal[];
  movementQuadrant?: { label: MovementQuadrantLabel };
}): ArchetypeInputs {
  const dominant = constitution.lens_stack?.dominant ?? null;
  const auxiliary = constitution.lens_stack?.auxiliary ?? null;
  // Top-4 Compass priorities by rank.
  const compass = (constitution.signals ?? [])
    .filter(
      (s) =>
        s.from_card === "sacred" &&
        s.source_question_ids.some((q) => q === "Q-S1" || q === "Q-S2")
    )
    .map((s) => ({ id: s.signal_id, rank: s.rank ?? 99 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4)
    .map((s) => s.id);
  const movementQuadrantLabel =
    constitution.movementQuadrant?.label ?? null;
  return {
    dominant,
    auxiliary,
    compassSignalIds: compass,
    movementQuadrantLabel,
  };
}
