// CC-022e — SVG asset paths for the eight body-map ShapeCards. The files
// were dropped by CC-022d at /public/cards/<NN>-<slug>.svg; this module
// is the single source of truth that maps a ShapeCardId to its public URL.
//
// Why a dedicated module: the path prefix + naming scheme is a small but
// real contract between CC-022d (file landing zone) and any consumer that
// renders the SVGs. Centralizing it here means a future bundle drop (v3,
// v4) only needs to update one constant if the path scheme ever shifts —
// callers stay untouched.

import type { CardId } from "./types";
import type { ShapeCardId } from "./identityEngine";

// Map of shape card → public-path to the body-map SVG. Filenames match
// the canonical numeric order used in docs/canon/ shape framework.
export const SHAPE_CARD_SVG_PATHS: Record<ShapeCardId, string> = {
  lens: "/cards/01-lens-eyes.svg",
  compass: "/cards/02-compass-heart.svg",
  conviction: "/cards/03-conviction-voice.svg",
  gravity: "/cards/04-gravity-spine.svg",
  trust: "/cards/05-trust-ears.svg",
  weather: "/cards/06-weather-nervous-system.svg",
  fire: "/cards/07-fire-immune-response.svg",
  path: "/cards/08-path-gait.svg",
};

// Display sizing for the Map render. The bundle README is explicit:
// 140-280px on screen with breathing room; "don't shrink below 96px —
// the line work falls apart." 200px sits center-band with margin for
// both larger and smaller phones.
export const SHAPE_CARD_MAP_SIZE_PX = 200;

// CC-022f — Survey-time card_id (used in data/questions.ts) → body-map
// shape card id (the 8 ShapeCards on the report). Mapping rationale:
//
//   conviction    → conviction  Voice card; direct.
//   pressure      → fire        Immune-response: stress / heat / pressure.
//   formation     → weather     Climate-of-formation: the weather you grew up in.
//                               (Engine-feeds-Lens-stack adjacency is real but
//                               the survey-screen icon's metaphor must match
//                               the question, not the engine pathway. Pre-CC-027
//                               this routed to lens; the eye image didn't
//                               compose with "what was the climate around you
//                               while you were forming.")
//   context       → weather     External conditions = weather card.
//   agency        → gravity     Locus of control / standing = spine.
//   sacred        → compass     Sacred values are a Compass output.
//   temperament   → lens        Four Voices / Jungian functions = perception.
//   role          → path        Role / profession lives on Path · Gait.
//   contradiction → conviction  Contradictions surface in Voice (Keystone block).
//
// Two survey ids map to `weather` (formation, context) post-CC-027. That's
// architecturally consistent — both probe external conditions; formation =
// past climate, context = present climate. `role` and `contradiction` are
// reserved CardId values not currently used in data/questions.ts; the
// entries are present for completeness so future questions don't silently
// fall through.
export const SURVEY_CARD_TO_SHAPE_CARD: Record<CardId, ShapeCardId> = {
  conviction: "conviction",
  pressure: "fire",
  formation: "weather",
  context: "weather",
  agency: "gravity",
  sacred: "compass",
  temperament: "lens",
  role: "path",
  contradiction: "conviction",
};

// CC-022f — Kicker-icon target size on survey screens. Below the README's
// 96px floor — deliberate, eyes-open trade-off (mobile-first reality: a
// 96px icon doesn't fit alongside a kicker on a 360-400px phone). Mobile
// clamp applied at the render site so narrow viewports scale down further.
// If v1 SVGs visibly degrade at this size, the fix is a parallel small-
// pictogram set, not a sizing tweak.
export const SHAPE_CARD_KICKER_ICON_SIZE_PX = 64;

// CC-022f — Resolve a survey card_id to its body-map SVG path. Defensive
// null return: the SURVEY_CARD_TO_SHAPE_CARD table is exhaustive over the
// CardId union today, but a future CardId addition without a mapping
// update would render no icon rather than crash.
export function getSurveyKickerIcon(cardId: CardId): string | null {
  const shapeId = SURVEY_CARD_TO_SHAPE_CARD[cardId];
  if (!shapeId) return null;
  return SHAPE_CARD_SVG_PATHS[shapeId] ?? null;
}
