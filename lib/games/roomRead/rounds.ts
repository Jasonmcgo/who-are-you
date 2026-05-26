// CC-175 — Body Card round order. Matches the live Journey order from
// `web/index.html` (CC-174 added Hands at position 03; the rest renumbered
// accordingly). Weather/Grip/Aim/Goal/Soul are intentionally NOT rounds
// — Weather is context, Grip is pressure distortion, Aim is governance,
// Goal/Soul are trajectory forces; they may inform tags but never become
// round themes.

import type { BodyCardTheme } from "./types";

export const BODY_CARD_ORDER: readonly BodyCardTheme[] = [
  "lens",
  "compass",
  "hands",
  "voice",
  "gravity",
  "trust",
  "fire",
  "path",
] as const;

export const BODY_CARD_LABELS: Record<BodyCardTheme, string> = {
  lens: "Lens · Eyes",
  compass: "Compass · Heart",
  hands: "Hands · Craft",
  voice: "Voice · Speak",
  gravity: "Gravity · Spine",
  trust: "Trust · Ears",
  fire: "Fire · Immune Response",
  path: "Path · Gait",
};

// CC-ROOMREAD-CARD-GRAPHIC — public-path map from round theme to its
// body-card art. Pre-CC the Room Read round screens rendered the
// prompt text in a bare box; the owner expected each round to read
// as a CARD with the Lens / Compass / Hands / etc. graphic above the
// prompt. The assets already lived in public/cards/; this map just
// makes them reachable from the round renderers.
//
// Numbered filenames match the Body Card Journey order on the
// homepage (lens=01, compass=02, voice=03, gravity=04, trust=05,
// weather=06 [intentionally NOT a round theme], fire=07, path=08,
// hands=09). `hands` is a PNG; the rest are SVG.
//
// Weather is excluded by construction — `BodyCardTheme` carries only
// the 8 round themes, so `Record<BodyCardTheme, string>` cannot
// accidentally include weather.
export const BODY_CARD_ASSET: Record<BodyCardTheme, string> = {
  lens: "/cards/01-lens-eyes.svg",
  compass: "/cards/02-compass-heart.svg",
  voice: "/cards/03-conviction-voice.svg",
  gravity: "/cards/04-gravity-spine.svg",
  trust: "/cards/05-trust-ears.svg",
  fire: "/cards/07-fire-immune-response.svg",
  path: "/cards/08-path-gait.svg",
  hands: "/cards/09-craft-hands.png",
};
