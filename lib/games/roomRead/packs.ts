// CC-187 — Room Read pack registry.
//
// A pack is a SAME-SKELETON-DIFFERENT-COSTUME bundle of cards: same
// engine mechanic (every card scores `Σ tag_weight × signal_strength`
// against the player roster, picking a target per round), same 8
// themes (Lens / Compass / Hands / Voice / Gravity / Trust / Fire /
// Path), same tag vocabulary — but the prompts wear a different aesthetic
// (academic-witty, holiday-movie, fantasy-school, etc.). Generation
// filters the candidate pool by an `allowedPacks` list resolved
// through `resolveAllowedPacks` (entitlements.ts) BEFORE the round
// loop runs; an entitlement-required pack cannot be drawn unless the
// purchaser holds the pass / per-pack entitlement.
//
// `KNOWN_PACKS` is the single source of truth for:
//   - the validator (`scripts/validateCardLibrary.ts`) — errors if a
//     card cites a pack not in this registry, prints per-pack counts,
//     warns when a pack doesn't span all 8 themes (a pack with a
//     theme hole can't field a full game on its own; see the
//     all-8-themes pre-check in `generate.ts`);
//   - the entitlement seam (`entitlements.ts`) — `requiresEntitlement`
//     drives whether `hasPackEntitlement` is consulted vs auto-allowed;
//   - any future store UI — reads `label` for the human-facing name.
//
// Adding a new pack means: (1) add an entry here; (2) ship cards with
// `"pack": "<new-id>"` in `cards.data.json`; (3) wire the entitlement
// gate (the seam in `entitlements.ts` is the one place real billing
// will land).

import type { PackId } from "./types";

export interface PackRegistryEntry {
  /** Stable id used in `RoomReadCard.pack` + `allowedPacks` lists. */
  id: PackId;
  /** Human-facing label for store UI / admin tooling. */
  label: string;
  /** When `true`, the pack is gated: `resolveAllowedPacks` only
   *  includes it when the purchaser holds the corresponding
   *  entitlement (annual pass for partner/family modes, or a per-pack
   *  purchase). The base `"academic"` pack is `false` — it ships
   *  with the assessment, no purchase required. */
  requiresEntitlement: boolean;
}

/**
 * The pack registry. To add a pack, append an entry and ship cards
 * tagged with the new id. The validator + the entitlement seam read
 * from this map; nothing else hard-codes pack ids.
 */
export const KNOWN_PACKS: Record<PackId, PackRegistryEntry> = {
  academic: {
    id: "academic",
    label: "Academic Wit",
    requiresEntitlement: false,
  },
  // Themed one-time pack — holiday-movie flavor, family-tuned. Same
  // engine skeleton as academic (all 8 themes, engine tag vocabulary);
  // only the prompt costume differs. Entitlement-gated: the owner/admin
  // is comped through the seam (see `hasPackEntitlement`); public play
  // stays gated until per-pack billing lands.
  holiday_family: {
    id: "holiday_family",
    label: "Holiday Movie Night (Family)",
    requiresEntitlement: true,
  },
};

/** Cheap lookup helper — used by the validator + generator
 *  preconditions. Returns `false` for any id not in `KNOWN_PACKS`. */
export function isKnownPack(id: PackId | undefined): boolean {
  return typeof id === "string" && id in KNOWN_PACKS;
}

/** CC-187 — the back-compat default. A card missing `pack` on the
 *  way through the loader is coerced to this id; the validator
 *  separately ERRORS on missing pack so a hand-edited card never
 *  silently ships with the default. */
export const DEFAULT_PACK_ID: PackId = "academic";
