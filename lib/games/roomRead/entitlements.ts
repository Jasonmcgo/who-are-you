// CC-187 — Room Read pack entitlement seam.
//
// The owner's product model (recorded here so this module is the one
// place real billing wiring will land):
//
//   • The assessment is FREE.
//   • The base `"academic"` pack is FREE (ships with the assessment;
//     `requiresEntitlement: false` in `packs.ts`).
//   • Partner + Family game MODES sit behind an ANNUAL PASS.
//   • Individual themed packs (holiday-movie, fantasy-school, etc.)
//     are ONE-TIME purchases that ADD that pack to the room's allowed
//     pool.
//
// This module ships the SEAM the billing system will plug into, plus a
// stub policy that is correct for today (academic is free; everything
// `requiresEntitlement: true` is currently denied). Stripe / payments /
// the store UI are explicitly OUT OF SCOPE for CC-187 — when billing
// arrives, the change is local: `hasPackEntitlement` consults the
// real entitlement record.
//
// Architectural contract:
//   • `resolveAllowedPacks` is the ONLY thing the admin route calls.
//   • `hasPackEntitlement` is the ONLY thing that touches the billing
//     system (today it consults a stub map).
//   • Generation NEVER calls into this module — the entitlement-
//     resolved list is passed THROUGH `createRoomReadSession` →
//     `generateRoomReadGame`, then persisted on the session row.

import { KNOWN_PACKS, DEFAULT_PACK_ID } from "./packs";
import type { PackId } from "./types";

/** Identity of the room's purchaser/creator at entitlement-resolution
 *  time. Today the admin route carries a `createdByAdmin` free-text
 *  label (matches `room_read_sessions.created_by_admin`). Once real
 *  accounts land, this widens to a `{ userId, accountId, ... }` shape;
 *  the seam absorbs the change without touching generation. */
export interface EntitlementContext {
  /** The free-text admin label that mints the session today. Mirrors
   *  `RoomReadSession.created_by_admin`. Optional because pre-CC-187
   *  flows didn't carry one — those callers see academic-only. */
  createdByAdmin?: string;
}

/**
 * CC-187 — the SINGLE source of truth for "does this purchaser hold
 * the pack?". Currently a stub that grants `academic` (the free
 * base) and denies everything else. When billing lands, this is the
 * ONE function that needs to read from the entitlement store
 * (Stripe subscription state, per-pack purchase record, owner-granted
 * comp, etc.) — every caller (`resolveAllowedPacks`, future store
 * UI gates, future "buy this pack" CTAs) routes through here.
 *
 * Stub policy:
 *   • `pack === DEFAULT_PACK_ID` (`"academic"`)  → always `true`
 *   • any pack with `requiresEntitlement: true`  → always `false`
 *   • unknown pack id                            → always `false`
 *
 * TODO(billing) — real wiring model:
 *   1. Annual pass: gates partner/family GAME MODES (a separate
 *      gate at session creation; not pack-level). Once active, the
 *      pass adds nothing here per se but does unlock the creation
 *      paths.
 *   2. Per-pack purchase: persists an entitlement row keyed on
 *      `(purchaser, packId)`. This function then becomes a single
 *      DB lookup against that table + an "always-true" branch for
 *      packs with `requiresEntitlement === false`.
 *   3. Owner comp / preview: an admin override (e.g. an
 *      `admin_entitlement_grant` row) that this function honors
 *      identically to a real purchase.
 */
export function hasPackEntitlement(
  context: EntitlementContext,
  pack: PackId
): boolean {
  // Always-allow the free base pack regardless of context.
  if (pack === DEFAULT_PACK_ID) return true;
  // Any pack with `requiresEntitlement: false` is part of the free
  // bundle too (currently only academic, but the registry can grow
  // additional free packs without changing this seam).
  const entry = KNOWN_PACKS[pack];
  if (entry && entry.requiresEntitlement === false) return true;
  // TODO(billing) #3 — owner comp / preview. The admin create route is
  // already admin-gated by middleware (the `wru_admin` cookie), and it
  // stamps every session it mints with a `createdByAdmin` label. Until
  // real per-pack billing ships, we honor that as an owner-comp grant:
  // an admin-created room may draw from any KNOWN pack. This is the ONE
  // branch that widens access; a context WITHOUT `createdByAdmin`
  // (public / token play) still falls through to denial below. When
  // billing lands, this narrows from "any admin context" to a real
  // `admin_entitlement_grant` lookup — the seam shape doesn't change.
  if (entry && typeof context.createdByAdmin === "string" && context.createdByAdmin.length > 0) {
    return true;
  }
  // Otherwise an entitlement-required pack is denied at the seam — a
  // session that tries to draw from one fails the all-8-themes
  // pre-check (or simply doesn't include it in `allowedPacks`).
  return false;
}

/**
 * CC-187 — resolve the pack list a Room Read session may draw from.
 * Always includes `DEFAULT_PACK_ID` (the free base) so a game can
 * never be created with an empty pool. Adds any
 * `requiresEntitlement: true` pack from `KNOWN_PACKS` that
 * `hasPackEntitlement` approves for this context.
 *
 * Called from the admin route BEFORE `createRoomReadSession`; the
 * generator never trusts a raw client list. An admin route MAY accept
 * an explicit `allowedPacks` override (for admin testing) but must
 * validate every id against `KNOWN_PACKS` AND against entitlement —
 * this function is the validator.
 */
export function resolveAllowedPacks(context: EntitlementContext): PackId[] {
  const out = new Set<PackId>();
  out.add(DEFAULT_PACK_ID);
  for (const packId of Object.keys(KNOWN_PACKS)) {
    if (hasPackEntitlement(context, packId)) {
      out.add(packId);
    }
  }
  return [...out];
}
