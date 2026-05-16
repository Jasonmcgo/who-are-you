// CC-GRIP-TAXONOMY-REPLACEMENT — 4-layer Grip Pattern architecture.
//
// Replaces Foster's "7 Primal Questions" framework in all user-facing
// surfaces. The engine-internal Primal computation may continue to run
// for cache stability + as a classifier input, but the constitution's
// rendered output speaks the proprietary Grip Pattern taxonomy.
//
// Per canon `feedback_clarence_report_architecture_rulings.md`:
//
//   Layer 1 — Classifier (shape-aware)
//   Layer 2 — Canonical bucket (Safety / Security / Belonging / Worth /
//             Recognition / Control / Purpose) + Mixed fallback
//   Layer 3 — Renderer (shape-specific elaborative label)
//   Layer 4 — Underlying-question prose (engine-generated, recognition
//             moment — never a fixed Foster string)
//
// Pure derivation — no API calls, no new measurements.

import type { CognitiveFunctionId, FunctionPairKey, SignalId } from "./types";
import type { ProfileArchetype } from "./profileArchetype";

// ─────────────────────────────────────────────────────────────────────
// Layer 2 — canonical buckets
// ─────────────────────────────────────────────────────────────────────

export type GripPatternKey =
  | "safety"
  | "security"
  | "belonging"
  | "worth"
  | "recognition"
  | "control"
  | "purpose"
  | "unmapped";

export const GRIP_PATTERN_BUCKETS: Record<
  GripPatternKey,
  {
    publicLabel: string;
    axisDistorted: string;
    defaultHealthyGift: string;
  }
> = {
  safety: {
    publicLabel: "Safety Grip",
    axisDistorted: "Aim",
    defaultHealthyGift: "wisdom, protection",
  },
  security: {
    publicLabel: "Security Grip",
    axisDistorted: "Goal/Aim",
    defaultHealthyGift: "stewardship",
  },
  belonging: {
    publicLabel: "Belonging Grip",
    axisDistorted: "Soul",
    defaultHealthyGift: "inclusion",
  },
  worth: {
    publicLabel: "Worth Grip",
    axisDistorted: "Soul/Grip",
    defaultHealthyGift: "humility, craft",
  },
  recognition: {
    publicLabel: "Recognition Grip",
    axisDistorted: "Goal",
    defaultHealthyGift: "excellence",
  },
  control: {
    publicLabel: "Control Grip",
    axisDistorted: "Aim",
    defaultHealthyGift: "governance",
  },
  purpose: {
    publicLabel: "Purpose Grip",
    axisDistorted: "Goal/Soul",
    defaultHealthyGift: "mission",
  },
  unmapped: {
    publicLabel: "Mixed Grip",
    axisDistorted: "—",
    defaultHealthyGift: "—",
  },
};

export interface GripPatternReading {
  bucket: GripPatternKey;
  renderedLabel: string;
  underlyingQuestion: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────────
// Classifier inputs + helpers
// ─────────────────────────────────────────────────────────────────────

export interface GripPatternInputs {
  qGrip1Top3: SignalId[];
  livedPrimalRegister: string | null;
  compassTop4: string[];
  driverPair: FunctionPairKey | null;
  archetype: ProfileArchetype;
  dominant: CognitiveFunctionId | null;
}

// Compass anchor predicates per the canon disambiguation tables.
function hasAny(arr: string[], targets: string[]): boolean {
  return arr.some((a) => targets.includes(a));
}

function isClassicalDefensiveSurface(top: SignalId | undefined): boolean {
  return (
    top === "grips_control" ||
    top === "grips_security" ||
    top === "grips_certainty" ||
    top === "grips_old_plan"
  );
}

function isRelationalSurface(top: SignalId | undefined): boolean {
  return (
    top === "grips_neededness" ||
    top === "grips_approval" ||
    top === "grips_reputation"
  );
}

const KNOWLEDGE_ANCHORS = [
  "knowledge_priority",
  "honor_priority",
  "peace_priority",
  "truth_priority",
];
const FAITH_ANCHORS = [
  "faith_priority",
  "stability_priority",
  "loyalty_priority",
];
const FAMILY_ANCHORS = [
  "family_priority",
  "mercy_priority",
  "compassion_priority",
];
const SAFETY_ANCHORS = ["health_priority", "stability_priority"];
const RECOGNITION_ANCHORS = ["fame_priority", "success_priority"];
const PURPOSE_ANCHORS = [
  "justice_priority",
  "freedom_priority",
  "system_responsibility_priority",
];

// ─────────────────────────────────────────────────────────────────────
// Layer 3 — Renderer (shape-specific elaborative label)
// ─────────────────────────────────────────────────────────────────────

export function renderElaborativeLabel(
  bucket: GripPatternKey,
  archetype: ProfileArchetype,
  surfaceTop: SignalId | undefined
): string {
  // Archetype + surface combine to produce the most-specific label.
  // Falls through to the canonical bucket label when no specific
  // pairing matches.
  if (bucket === "worth") {
    if (archetype === "jasonType" && isClassicalDefensiveSurface(surfaceTop)) {
      return "Control / Mastery";
    }
    if (archetype === "cindyType") return "Worth through service";
    return "Worth through achievement";
  }
  if (bucket === "belonging") {
    if (archetype === "cindyType" && surfaceTop === "grips_neededness") {
      return "Belonging through usefulness";
    }
    if (archetype === "cindyType") return "Belonging through care";
    if (surfaceTop === "grips_control")
      return "Control as protective overreach";
    if (surfaceTop === "grips_approval") return "Belonging through approval";
    return "Belonging Grip";
  }
  if (bucket === "security") {
    if (archetype === "danielType") return "Security through structure";
    if (surfaceTop === "grips_old_plan") return "Security through what worked";
    return "Security Grip";
  }
  if (bucket === "safety") {
    if (surfaceTop === "grips_control") return "Control as protection";
    return "Safety Grip";
  }
  if (bucket === "recognition") {
    if (surfaceTop === "grips_reputation") return "Recognition through standing";
    if (surfaceTop === "grips_neededness")
      return "Visibility through indispensability";
    return "Recognition Grip";
  }
  if (bucket === "control") {
    if (archetype === "jasonType") return "Control / Mastery";
    return "Control Grip";
  }
  if (bucket === "purpose") {
    return "Purpose Grip";
  }
  return "Mixed Grip";
}

// ─────────────────────────────────────────────────────────────────────
// Layer 4 — Underlying-question generator
// ─────────────────────────────────────────────────────────────────────

// Templates are 3-4 per bucket, selected by archetype + surface. The
// engine-generated recognition prose is what the user sees as their
// "Underlying Question:" line; it is NOT a Foster string.
export function generateUnderlyingQuestion(
  bucket: GripPatternKey,
  archetype: ProfileArchetype,
  surfaceTop: SignalId | undefined
): string {
  if (bucket === "worth") {
    if (archetype === "jasonType")
      return "Can I make the insight real enough to trust?";
    if (archetype === "cindyType")
      return "Am I doing enough for them to feel cared for?";
    if (archetype === "danielType")
      return "Have I done what was given me to do?";
    return "Can I produce enough to be worth the space I take?";
  }
  if (bucket === "belonging") {
    if (archetype === "cindyType" && surfaceTop === "grips_neededness")
      return "Will I still belong if I cannot meet what they need?";
    if (archetype === "cindyType")
      return "Am I still welcome when I have nothing left to give?";
    if (archetype === "jasonType")
      return "Will I be welcome if I bring this whole thing into the room?";
    if (archetype === "danielType")
      return "Will the people I serve still trust me if I let down the standard?";
    return "Will I still belong if the usefulness runs out?";
  }
  if (bucket === "security") {
    if (archetype === "danielType")
      return "Will the system I built hold what I'm responsible for?";
    if (archetype === "cindyType")
      return "Will the people who depend on me be safe if I let go?";
    if (archetype === "jasonType")
      return "Will the structure I'm carrying still stand if I rest?";
    return "Will what I've built hold without my constant attention?";
  }
  if (bucket === "safety") {
    if (surfaceTop === "grips_control")
      return "Can I keep this contained enough to be safe?";
    return "Can I read what's coming before it reaches us?";
  }
  if (bucket === "recognition") {
    if (surfaceTop === "grips_reputation")
      return "Will the right people see this and recognize it for what it is?";
    return "Am I still being seen for what I bring?";
  }
  if (bucket === "control") {
    if (archetype === "jasonType")
      return "Can I shape this outcome cleanly enough to trust it?";
    return "Can I hold the shape of this without it slipping?";
  }
  if (bucket === "purpose") {
    return "Is what I'm carrying actually mine to carry?";
  }
  return "What is this pressure asking of me that I have not yet named?";
}

// ─────────────────────────────────────────────────────────────────────
// Layer 1 — Classifier
// ─────────────────────────────────────────────────────────────────────

// CC-085 — disambiguator chain. When the surface-based classifier
// would return "low" confidence (mixed-bucket surface grips or
// no archetype/compass anchor), consult this chain to confirm or
// override the bucket assignment and promote confidence to "medium".
//
// Canon order (most-to-least authoritative):
//   1. Lived Primal cluster (`livedPrimalRegister`) — when present,
//      the engine-internal Primal question is the shape-aware truth.
//   2. Driver function (`dominant`) — Ni/Ne/Fi → Worth, Si/Te →
//      Security, Se/Fe → Belonging, Ti → Control.
//   3. Compass top (`compassTop4`) — Family/Compassion → Belonging,
//      Honor/Faith → Security, Truth/Knowledge → Worth.
//
// Returns a bucket the disambiguator chain suggests, or `null` when
// no rule resolves. Per CC-085 spec, the classifier promotes "low"
// → "medium" only when the chain produces SOME bucket (confirming
// the surface bucket OR replacing it). When the chain stays silent
// (no signals), confidence stays "low" rather than fabricating an
// answer.
function disambiguateBucket(
  inputs: GripPatternInputs
): GripPatternKey | null {
  const { livedPrimalRegister, dominant, compassTop4 } = inputs;

  // 1. Lived Primal cluster.
  if (livedPrimalRegister) {
    const p = livedPrimalRegister.toLowerCase();
    if (p.includes("safe")) return "safety";
    if (p.includes("secure")) return "security";
    if (p.includes("wanted") || p.includes("loved")) return "belonging";
    if (p.includes("good enough")) return "worth";
    if (p.includes("successful")) return "recognition";
    if (p.includes("purpose")) return "purpose";
  }

  // 2. Driver function.
  if (dominant) {
    switch (dominant) {
      case "ni":
      case "ne":
      case "fi":
        return "worth";
      case "si":
      case "te":
        return "security";
      case "se":
      case "fe":
        return "belonging";
      case "ti":
        return "control";
    }
  }

  // 3. Compass top — canonical anchor mapping. The order below mirrors
  // the existing `*_ANCHORS` predicates so the chain stays internally
  // consistent with the rest of the classifier.
  if (hasAny(compassTop4, FAMILY_ANCHORS)) return "belonging";
  if (hasAny(compassTop4, FAITH_ANCHORS)) return "security";
  if (hasAny(compassTop4, KNOWLEDGE_ANCHORS)) return "worth";
  if (hasAny(compassTop4, RECOGNITION_ANCHORS)) return "recognition";
  if (hasAny(compassTop4, PURPOSE_ANCHORS)) return "purpose";
  if (hasAny(compassTop4, SAFETY_ANCHORS)) return "safety";

  return null;
}

export function classifyGripPattern(
  inputs: GripPatternInputs
): GripPatternReading {
  const { qGrip1Top3, compassTop4, archetype } = inputs;
  const top1 = qGrip1Top3[0];

  const hasKnowledge = hasAny(compassTop4, KNOWLEDGE_ANCHORS);
  const hasFaith = hasAny(compassTop4, FAITH_ANCHORS);
  const hasFamily = hasAny(compassTop4, FAMILY_ANCHORS);
  const hasSafety = hasAny(compassTop4, SAFETY_ANCHORS);
  const hasRecognition = hasAny(compassTop4, RECOGNITION_ANCHORS);
  const hasPurpose = hasAny(compassTop4, PURPOSE_ANCHORS);

  // The classifier's confidence ladder:
  //   high   = surface + compass + archetype all consistent
  //   medium = surface + (compass OR archetype) consistent
  //   low    = surface only, or no clear archetype/compass anchor
  const decide = (
    bucket: GripPatternKey,
    confidence: "high" | "medium" | "low",
    rationaleParts: string[]
  ): GripPatternReading => ({
    bucket,
    renderedLabel: renderElaborativeLabel(bucket, archetype, top1),
    underlyingQuestion: generateUnderlyingQuestion(bucket, archetype, top1),
    confidence,
    rationale: rationaleParts.join("; "),
  });

  // CC-085 — wrap every `decide()` call so "low" confidence reads
  // get one more shape-aware pass through the disambiguator chain
  // before being returned. When the chain agrees with the
  // surface-routed bucket, confidence promotes to "medium" (the
  // render gate widens to render at medium). When the chain
  // disagrees, the disambiguator's bucket wins and confidence is
  // "medium" (the chain is more authoritative than the
  // no-archetype-no-anchor fallback that produced the "low" in the
  // first place). When the chain produces no result at all,
  // confidence stays "low" — the surface signal is genuinely
  // ambiguous and there's nothing better to assert.
  const decideWithDisambiguator = (
    bucket: GripPatternKey,
    confidence: "high" | "medium" | "low",
    rationaleParts: string[]
  ): GripPatternReading => {
    if (confidence !== "low" || bucket === "unmapped") {
      return decide(bucket, confidence, rationaleParts);
    }
    const disambiguatorBucket = disambiguateBucket(inputs);
    if (disambiguatorBucket === null) {
      return decide(bucket, confidence, rationaleParts);
    }
    if (disambiguatorBucket === bucket) {
      return decide(bucket, "medium", [
        ...rationaleParts,
        `disambiguator confirms ${bucket} via Primal/driver/compass chain`,
      ]);
    }
    return decide(disambiguatorBucket, "medium", [
      ...rationaleParts,
      `surface routed to ${bucket}; disambiguator chain (Primal/driver/compass) overrides → ${disambiguatorBucket}`,
    ]);
  };

  // No surface signal — explicit unmapped fallback.
  if (!top1) {
    return decideWithDisambiguator("unmapped", "low", [
      "no Q-GRIP1 top-1 signal",
    ]);
  }

  // ── Classical-defensive surface (Control / Security / Certainty /
  //    Old-plan) ──────────────────────────────────────────────────
  // Archetype takes priority over compass-only signals: the canon Jason
  // case has both Knowledge AND Family in his top-4, but he is a
  // jasonType architect and must route to Worth Grip rendered as
  // Control/Mastery. The classifier checks archetype FIRST, then falls
  // back to compass-only signals when archetype is unmappedType.
  if (isClassicalDefensiveSurface(top1)) {
    if (archetype === "jasonType") {
      return decide("worth", hasKnowledge ? "high" : "medium", [
        `surface=${top1} (classical-defensive)`,
        `archetype=jasonType`,
        `compass knowledge=${hasKnowledge}`,
        "Jason-canon: Worth Grip rendered as Control/Mastery",
      ]);
    }
    if (archetype === "danielType") {
      return decide("security", hasFaith ? "high" : "medium", [
        `surface=${top1} (classical-defensive)`,
        `archetype=danielType`,
        `compass faith=${hasFaith}`,
      ]);
    }
    if (archetype === "cindyType") {
      return decide("belonging", hasFamily ? "high" : "medium", [
        `surface=${top1} (classical-defensive)`,
        `archetype=cindyType`,
        `compass family=${hasFamily}`,
        "rendered as control-as-protective-overreach",
      ]);
    }
    // Unmapped archetype — fall through to compass-only routing.
    if (hasFaith && !hasKnowledge) {
      return decide("security", "medium", [
        `surface=${top1} (classical-defensive)`,
        `compass: faith=${hasFaith} knowledge=${hasKnowledge}`,
      ]);
    }
    if (hasFamily && !hasKnowledge) {
      return decide("belonging", "medium", [
        `surface=${top1} (classical-defensive)`,
        `compass family=${hasFamily}`,
        "rendered as control-as-protective-overreach",
      ]);
    }
    if (hasSafety && !hasKnowledge && !hasFaith) {
      return decide("safety", "medium", [
        `surface=${top1}`,
        `compass safety-anchored`,
      ]);
    }
    if (hasKnowledge) {
      return decide("worth", "medium", [
        `surface=${top1} (classical-defensive)`,
        `compass knowledge=${hasKnowledge}`,
        "Worth Grip rendered as Control/Mastery",
      ]);
    }
    return decideWithDisambiguator("control", "low", [
      `surface=${top1}`,
      "no anchor → default Control",
    ]);
  }

  // ── Relational surface (Needed / Approval / Reputation) ────────
  if (isRelationalSurface(top1)) {
    if (hasRecognition && top1 === "grips_reputation") {
      return decide("recognition", "medium", [
        `surface=${top1}`,
        `compass recognition-anchored`,
      ]);
    }
    if (archetype === "cindyType" || hasFamily) {
      return decide(
        "belonging",
        archetype === "cindyType" && hasFamily ? "high" : "medium",
        [
          `surface=${top1} (relational)`,
          `archetype=${archetype}`,
          `compass family=${hasFamily}`,
        ]
      );
    }
    if (archetype === "jasonType" && (hasKnowledge || top1 === "grips_neededness")) {
      return decide("worth", "medium", [
        `surface=${top1}`,
        `architect routes relational surface to Worth-through-service`,
      ]);
    }
    if (hasRecognition) {
      return decide("recognition", "medium", [
        `surface=${top1}`,
        `compass recognition-anchored`,
      ]);
    }
    return decideWithDisambiguator("belonging", "low", [
      `surface=${top1} (relational)`,
      "no archetype/compass anchor",
    ]);
  }

  // ── Comfort surface → Safety (avoidance register) ──────────────
  if (top1 === "grips_comfort") {
    return decideWithDisambiguator("safety", "low", [
      `surface=grips_comfort (avoidance, not collapse)`,
    ]);
  }

  // ── Approval — handled in relational branch above; explicit ────
  // catch any miscellaneous unhandled cases.
  if (hasPurpose) {
    return decideWithDisambiguator("purpose", "low", [
      `surface=${top1}`,
      `compass purpose-anchored`,
    ]);
  }

  return decideWithDisambiguator("unmapped", "low", [
    `surface=${top1}`,
    "no routing rule matched",
  ]);
}
