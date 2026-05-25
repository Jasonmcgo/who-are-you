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
