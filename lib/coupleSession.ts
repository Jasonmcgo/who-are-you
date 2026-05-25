// CC-COUPLE-1 — Couple-session data-access helpers.
//
// Thin, typed wrappers around the `couple_sessions` table. No business
// logic, no engine reads — just lookup + state transitions + JSONB write.
// State strings come from `lib/coupleTypes.ts` (COUPLE_SESSION_STATUS).

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { coupleSessions } from "../db/schema";
import {
  COUPLE_SESSION_STATUS,
  isCoupleGameResults,
  normalizeGameResultsBundle,
  type CoupleGameDirection,
  type CoupleGameResults,
  type CoupleGameResultsBundle,
  type CoupleSessionStatus,
} from "./coupleTypes";

export interface CoupleSessionRow {
  id: string;
  invite_token: string;
  partner_a_session_id: string;
  partner_b_session_id: string | null;
  // CC-COUPLE-7 — bond display names. Null on legacy one-sided rows
  // and on rows where the sender left a name blank.
  partner_a_name: string | null;
  partner_b_name: string | null;
  status: CoupleSessionStatus;
  game_results: CoupleGameResults | null;
  created_at: Date;
  updated_at: Date;
}

function castRow(
  raw: typeof coupleSessions.$inferSelect
): CoupleSessionRow {
  return {
    id: raw.id,
    invite_token: raw.invite_token,
    partner_a_session_id: raw.partner_a_session_id,
    partner_b_session_id: raw.partner_b_session_id,
    partner_a_name: raw.partner_a_name,
    partner_b_name: raw.partner_b_name,
    status: raw.status as CoupleSessionStatus,
    game_results: raw.game_results as CoupleGameResults | null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export async function getCoupleSessionByToken(
  token: string
): Promise<CoupleSessionRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(coupleSessions)
    .where(eq(coupleSessions.invite_token, token))
    .limit(1);
  if (rows.length === 0) return null;
  return castRow(rows[0]);
}

/**
 * Attach partner B's session id to the couple row identified by `token`,
 * and flip `status` to `"b_joined"`. Transactional so the read + write
 * (used to surface a clean "not found" error) commit atomically.
 */
export async function attachPartnerB(
  token: string,
  partnerBSessionId: string
): Promise<CoupleSessionRow> {
  const db = getDb();
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(coupleSessions)
      .where(eq(coupleSessions.invite_token, token))
      .limit(1);
    if (existing.length === 0) {
      throw new Error(`attachPartnerB: couple session for token not found`);
    }
    const updated = await tx
      .update(coupleSessions)
      .set({
        partner_b_session_id: partnerBSessionId,
        status: COUPLE_SESSION_STATUS.B_JOINED,
        updated_at: new Date(),
      })
      .where(eq(coupleSessions.invite_token, token))
      .returning();
    return castRow(updated[0]);
  });
}

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-8 — Per-direction save (Mode 2-aware).
//
// Writes a single direction's `CoupleGameResults` into a
// `CoupleGameResultsBundle` stored on `game_results`. Normalizes any
// existing legacy bare-shape row into the bundle on read, so callers
// don't have to special-case the legacy path.
//
// Status flow:
//   - `markCompleted: true` → status becomes `"completed"`. In Mode 1
//     (B not assessed) the caller passes true on the first (only)
//     direction save. In Mode 2 the caller passes true only when BOTH
//     directions are present after this write.
//   - `markCompleted: false` → status stays at the existing intermediate
//     ("b_joined"). Used in Mode 2 when only one direction is done.
// ─────────────────────────────────────────────────────────────────────
export async function saveDirectionResults(
  token: string,
  direction: CoupleGameDirection,
  results: CoupleGameResults,
  options: { markCompleted: boolean }
): Promise<CoupleSessionRow> {
  if (!isCoupleGameResults(results)) {
    throw new Error(
      `saveDirectionResults: payload is not a well-formed CoupleGameResults`
    );
  }
  const db = getDb();
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(coupleSessions)
      .where(eq(coupleSessions.invite_token, token))
      .limit(1);
    if (existing.length === 0) {
      throw new Error(
        `saveDirectionResults: couple session for token not found`
      );
    }
    // Normalize whatever shape is in game_results (null / legacy bare
    // / bundle) into a bundle so the write is uniform.
    const currentBundle: CoupleGameResultsBundle =
      normalizeGameResultsBundle(existing[0].game_results) ?? {};
    const nextBundle: CoupleGameResultsBundle = {
      ...currentBundle,
      [direction]: results,
    };
    const updated = await tx
      .update(coupleSessions)
      .set({
        game_results: nextBundle,
        status: options.markCompleted
          ? COUPLE_SESSION_STATUS.COMPLETED
          : COUPLE_SESSION_STATUS.B_JOINED,
        updated_at: new Date(),
      })
      .where(eq(coupleSessions.invite_token, token))
      .returning();
    return castRow(updated[0]);
  });
}

/**
 * Write the Obvious-or-Oblivious game payload to the couple row and flip
 * `status` to `"completed"`. Validates the payload shape before writing
 * (we never want a malformed game result silently persisted to JSONB).
 *
 * CC-COUPLE-8 NOTE: this is the LEGACY save path that writes the bare
 * `CoupleGameResults` shape directly to `game_results`. Preserved so
 * `tests/audit/coupleFlow.audit.ts` and `scripts/_scratch_couple1_*`
 * keep working. New Mode-1 and Mode-2 writes from the route layer go
 * through `saveDirectionResults` instead.
 */
export async function saveGameResults(
  token: string,
  results: CoupleGameResults
): Promise<CoupleSessionRow> {
  if (!isCoupleGameResults(results)) {
    throw new Error(
      `saveGameResults: payload is not a well-formed CoupleGameResults`
    );
  }
  const db = getDb();
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(coupleSessions)
      .where(eq(coupleSessions.invite_token, token))
      .limit(1);
    if (existing.length === 0) {
      throw new Error(`saveGameResults: couple session for token not found`);
    }
    const updated = await tx
      .update(coupleSessions)
      .set({
        game_results: results,
        status: COUPLE_SESSION_STATUS.COMPLETED,
        updated_at: new Date(),
      })
      .where(eq(coupleSessions.invite_token, token))
      .returning();
    return castRow(updated[0]);
  });
}
