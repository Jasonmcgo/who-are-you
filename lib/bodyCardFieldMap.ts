// CC-145 — single-source body-card + grip field mapping.
//
// Both the markdown composer (`composeBodyCards` /
// `composePatternAndGrip` in `lib/fiftyDegreeIndividual.ts`) and the
// React mirror (`BodyCards` / `PatternAndGrip` in
// `app/components/FiftyDegreeIndividualSection.tsx`) read per-card
// prose through this module. The "single source" rule prevents the
// drift that left the body cards thin pre-CC-145: the markdown and
// React surfaces both emitted divergent one-liners despite identical
// underlying data.
//
// Field convention mirrors the Guide's ShapeCard emit in
// `lib/renderMirror.ts` so the Individual cards match what the Guide
// shows:
//   Read (italic)      ← `cardHeader` / `openingLine` (Hands)
//   Strength           ← `gift.text` / `handsCard.strength`
//   Growth Edge        ← `blindSpot.text` / `handsCard.growthEdge`
//   Practice / Posture ← `SHAPE_CARD_PRACTICE_TEXT[source]` ?? `growthEdge.text`
//     · Conviction substitutes Posture for Practice (CC-025 spec).
//     · Hands uses `handsCard.practice` directly.
//
// **Warm-prose gate result:** the engine's `shape_outputs` carries the
// post-derivation prose (the substantive Strength / Growth Edge /
// Practice paragraphs). The four-card LLM splice
// (lens / compass / hands / path) replaces the *rendered guide
// markdown* body for those cards at render time, but never writes
// back into `shape_outputs`. Sourcing the Individual cards from
// `shape_outputs` therefore produces engine-prose for all 8 cards
// with zero drift between markdown and React surfaces — a strict
// improvement over the pre-CC-145 one-liners (`firstTwoSentences`).
// Polishing the 4 spliced cards on the Individual with the same warm
// LLM rewrite would require threading the 4 strings from
// `liveScopedRewrites` into `InnerConstitutionPage` →
// `FiftyDegreeIndividualSection` (out of scope for CC-145's
// Allowed-to-Modify list); a follow-up CC owns that thread.

import type { InnerConstitution } from "./types";
import type { ShapeCardId } from "./identityEngine";
import { SHAPE_CARD_QUESTION } from "./cardAssets";
import { SHAPE_CARD_PRACTICE_TEXT } from "./identityEngine";

export type BodyCardSource =
  | "lens"
  | "compass"
  | "hands"
  | "conviction"
  | "gravity"
  | "trust"
  | "weather"
  | "fire";

export interface BodyCardSpec {
  name: string;
  body: string;
  source: BodyCardSource;
}

/**
 * Eight cards in the Michele outline order. Lens through Fire follow
 * the body-map sequence; Hands is the 9th-card-as-body-card insertion
 * from CC-HANDS-CARD that the Individual treats as a first-class card.
 */
export const BODY_CARDS: BodyCardSpec[] = [
  { name: "Lens", body: "Eyes", source: "lens" },
  { name: "Compass", body: "Heart", source: "compass" },
  { name: "Hands", body: "Work", source: "hands" },
  { name: "Voice", body: "Conviction", source: "conviction" },
  { name: "Gravity", body: "Spine", source: "gravity" },
  { name: "Trust", body: "Ears", source: "trust" },
  { name: "Weather", body: "Nervous System", source: "weather" },
  { name: "Fire", body: "Immune Response", source: "fire" },
];

export interface BodyCardFields {
  /** Canonical purpose-of-this-card line (italic, above the lede). */
  question: string;
  /** User-specific Read line (italic) — `cardHeader` or `openingLine`. */
  readLede: string;
  /** Strength prose paragraph. */
  strength: string;
  /** Growth Edge prose paragraph. */
  growthEdge: string;
  /** Practice (most cards) or Posture (Conviction) prose. */
  practice: string;
  /** Label for the third block ("Practice" or "Posture"). */
  practiceLabel: "Practice" | "Posture";
}

/**
 * Question line per card. Hands uses its own canon line; the other 7
 * map 1:1 to `SHAPE_CARD_QUESTION`.
 */
export function bodyCardQuestionFor(source: BodyCardSource): string {
  if (source === "hands") return "What you build and carry";
  return SHAPE_CARD_QUESTION[source as ShapeCardId];
}

/**
 * Read the per-card field payload from the constitution. Returns
 * `null` when the underlying card data is absent (silently omitted
 * cards skip rendering rather than emit empty blocks).
 */
export function bodyCardFieldsFor(
  source: BodyCardSource,
  constitution: InnerConstitution
): BodyCardFields | null {
  const question = bodyCardQuestionFor(source);
  if (source === "hands") {
    const h = constitution.handsCard;
    if (!h) return null;
    return {
      question,
      readLede: h.openingLine,
      strength: h.strength,
      growthEdge: h.growthEdge,
      practice: h.practice,
      practiceLabel: "Practice",
    };
  }
  if (source === "conviction") {
    const c = constitution.shape_outputs?.conviction;
    if (!c) return null;
    return {
      question,
      readLede: c.cardHeader,
      strength: c.gift.text,
      growthEdge: c.blindSpot.text,
      practice: c.posture,
      practiceLabel: "Posture",
    };
  }
  const card = constitution.shape_outputs?.[source];
  if (!card) return null;
  const practiceText =
    SHAPE_CARD_PRACTICE_TEXT[source as ShapeCardId] ?? card.growthEdge.text;
  return {
    question,
    readLede: card.cardHeader,
    strength: card.gift.text,
    growthEdge: card.blindSpot.text,
    practice: practiceText,
    practiceLabel: "Practice",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Grip block — single-source payload for the Individual's Grip section
// ─────────────────────────────────────────────────────────────────────

/**
 * Full Grip block fields, sourced from `gripPattern` + `gripTaxonomy`.
 * Mirrors the Guide's ## Your Grip emit in `lib/renderMirror.ts` so
 * the Individual carries the same shape (de-duplicated — the Guide
 * emits Grip Pattern + Underlying Question twice; the Individual
 * presents each field once).
 */
export interface GripBlockFields {
  /** Warm narrative paragraph (LLM if cached, engine-fallback otherwise). */
  narrative: string;
  surfaceGrip: string;
  patternLabel: string;
  underlyingQuestion: string;
  /** Engine-derived distorted strategy sentence; "" when not derived. */
  distortedStrategy: string;
  /** Full second-person Healthy Gift sentence (or raw register fallback). */
  healthyGift: string;
  contributingGrips: string[];
  subRegister: string | null;
  /** Confidence band: "high" | "medium" | "low". */
  confidence: string;
}

// ── Engine-fallback helpers duplicated from renderMirror.ts so the
//    Individual can render the full block when the LLM cache is cold.
//    The renderMirror.ts originals stay the source of truth for the
//    Guide; these mirrors stay byte-equal so the two surfaces speak
//    the same grip fallback. The audit asserts byte-equality.

// Byte-equal duplicate of lib/renderMirror.ts:140-155. Audited.
const PRIMAL_FALLBACK_COST: Record<string, string> = {
  "Am I safe?":
    "avoidance, control, retreat, or overprotection",
  "Am I secure?":
    "hoarding, over-planning, or scarcity logic",
  "Am I loved?":
    "emotional dependency, testing, overgiving, or withdrawal",
  "Am I wanted?":
    "approval-seeking, self-editing, or room compliance",
  "Am I successful?":
    "achievement addiction, comparison, or hollow productivity",
  "Am I good enough?":
    "shame, perfectionism, hiding, or overproving",
  "Do I have purpose?":
    "urgency, savior-complex, abstraction, or restless reinvention",
};

function formatHealthyGiftFallback(
  primary: string,
  healthyGift: string
): string {
  // The engine fallback can't compose the LLM's polished sentence; it
  // emits a workable second-person line keyed to the gift register so
  // the four-line block remains coherent even when the API path is
  // unavailable.
  switch (primary) {
    case "Am I safe?":
      return "You read what could harm what you protect before others have noticed the risk.";
    case "Am I secure?":
      return "You keep things from falling apart that others would let slip.";
    case "Am I loved?":
      return "You hold what others entrust to you with steady, attentive care.";
    case "Am I wanted?":
      return "You read what the room needs and respond before others have noticed it shifting.";
    case "Am I successful?":
      return "You finish what you start at a standard others can rely on.";
    case "Am I good enough?":
      return "You turn unfinished thinking into form that earns its keep.";
    case "Do I have purpose?":
      return "You make the work mean something past the work itself.";
    default:
      return `You carry the gift of ${healthyGift}.`;
  }
}

// Byte-equal duplicate of lib/renderMirror.ts:164-173. Audited.
const FOSTER_PHRASES = [
  "Am I safe?",
  "Am I secure?",
  "Am I wanted?",
  "Am I loved?",
  "Am I successful?",
  "Am I good enough?",
  "Do I have purpose?",
  "Primal Question",
];

function scrubFosterVocab(
  prose: string,
  underlyingQuestion: string | undefined
): string {
  let out = prose;
  const replacement = underlyingQuestion ?? "this same question";
  for (const phrase of FOSTER_PHRASES) {
    out = out.split(phrase).join(replacement);
  }
  return out;
}

/**
 * Read the full Grip block payload from the constitution. Returns
 * `null` when neither classifier has anything to render (mirrors the
 * Guide's omit gate in `emitGripSection`).
 */
export function bodyGripBlockFor(
  constitution: InnerConstitution
): GripBlockFields | null {
  const grip = constitution.gripTaxonomy;
  if (!grip || !grip.primary) return null;
  const gripPattern = constitution.gripPattern;
  const hasRenderableGripPattern =
    gripPattern !== undefined &&
    gripPattern.bucket !== "unmapped" &&
    (gripPattern.confidence === "high" || gripPattern.confidence === "medium");
  if (grip.proseMode === "omitted" && !hasRenderableGripPattern) return null;

  const patternLabel = gripPattern?.renderedLabel ?? "Grip Pattern";
  const underlyingQuestion =
    gripPattern?.underlyingQuestion ??
    "What is this pressure asking of me that I have not yet named?";

  // Narrative paragraph — prefer the LLM rewrite (warm), fall through
  // to the engine-fallback prose. Same branching as the Guide.
  let narrative: string;
  const llmParagraph = constitution.gripParagraphLlm;
  if (llmParagraph) {
    narrative = scrubFosterVocab(llmParagraph, underlyingQuestion);
  } else if (grip.proseMode === "hedged") {
    const cost =
      PRIMAL_FALLBACK_COST[grip.primary] ??
      "the grip pattern that follows the question";
    narrative = `The pressure register reads quietly here. The surface clue is ${grip.surfaceGrip.toLowerCase()}; the underlying recognition may be "${underlyingQuestion}" — but the signal is thin enough that the question is worth noticing rather than governing. Under pressure this can pull toward ${cost}; for now, sit with whether the question has been doing more work than you realized.`;
  } else {
    const distorted =
      grip.distortedStrategy?.text ??
      `Under pressure, this question can pull you toward ${PRIMAL_FALLBACK_COST[grip.primary] ?? "the patterns that follow the question"}.`;
    const healthy = formatHealthyGiftFallback(grip.primary, grip.healthyGift);
    narrative = `Under pressure the surface clue is ${grip.surfaceGrip.toLowerCase()}; underneath it runs a quieter question — *${underlyingQuestion}* ${distorted} At its steadier, the same instrument turns the other way. ${healthy}`;
  }

  const distortedField = grip.distortedStrategy?.text ?? "";
  const healthyGiftField = formatHealthyGiftFallback(
    grip.primary,
    grip.healthyGift
  );

  return {
    narrative,
    surfaceGrip: grip.surfaceGrip,
    patternLabel,
    underlyingQuestion,
    distortedStrategy: distortedField,
    healthyGift: healthyGiftField,
    contributingGrips: grip.contributingGrips ?? [],
    subRegister: grip.subRegister ?? null,
    confidence: gripPattern?.confidence ?? grip.confidence,
  };
}
