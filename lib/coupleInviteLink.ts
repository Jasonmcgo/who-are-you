// CC-COUPLE-1 — Couple invite-link mint helper.
//
// `mintCoupleInviteLink(partnerASessionId)` inserts a new row into
// `couple_sessions` with an unguessable token and returns the public URL
// Partner A will share with Partner B. Token scheme is the SAME as
// `lib/followUpLink.ts` — we import `generateUnguessableToken` from there
// to avoid duplicating crypto.

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { coupleSessions, sessions } from "../db/schema";
import { generateUnguessableToken } from "./followUpLink";

/**
 * URL shape: `/couple/{token}`. The corresponding page route is the
 * CC-COUPLE-3 surface; CC-COUPLE-1 only mints the token + persists
 * the row — no route file is added in this CC.
 */
const PUBLIC_PATH = "/couple";

export interface MintedCoupleInviteLink {
  token: string;
  url: string;
}

/**
 * Generate an unguessable token, persist a `couple_sessions` row tying
 * it to `partnerASessionId`, and return the token + the public URL.
 * Verifies the A session exists first so the FK fails cleanly with a
 * descriptive error rather than a raw DB constraint message.
 */
export async function mintCoupleInviteLink(
  partnerASessionId: string,
  options: { baseUrl?: string } = {}
): Promise<MintedCoupleInviteLink> {
  const db = getDb();

  const sessionRow = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.id, partnerASessionId))
    .limit(1);
  if (sessionRow.length === 0) {
    throw new Error(
      `mintCoupleInviteLink: partner A session ${partnerASessionId} not found`
    );
  }

  const token = generateUnguessableToken();
  await db
    .insert(coupleSessions)
    .values({ invite_token: token, partner_a_session_id: partnerASessionId });

  const base = options.baseUrl ?? "";
  return { token, url: `${base}${PUBLIC_PATH}/${token}` };
}
