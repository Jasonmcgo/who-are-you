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
  type CoupleGameResults,
  type CoupleSessionStatus,
} from "./coupleTypes";

export interface CoupleSessionRow {
  id: string;
  invite_token: string;
  partner_a_session_id: string;
  partner_b_session_id: string | null;
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

/**
 * Write the Obvious-or-Oblivious game payload to the couple row and flip
 * `status` to `"completed"`. Validates the payload shape before writing
 * (we never want a malformed game result silently persisted to JSONB).
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
