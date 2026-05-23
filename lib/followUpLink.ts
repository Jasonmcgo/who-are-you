// CC-126 — Follow-up link mint helper.
//
// `mintFollowUpLink(sessionId)` inserts a new row into the
// `follow_up_links` table with an unguessable token and returns the
// public URL the admin will copy/paste/email.
//
// Token: 24 random bytes encoded as base64url → 32 chars. Crypto-strong
// (`crypto.randomBytes`), unguessable, URL-safe. Stored as the primary
// key on `follow_up_links` so token-collision is checked by the
// database, not by application code (in practice 2^192 → effectively
// never).

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { followUpLinks, sessions } from "../db/schema";

/**
 * URL shape: `/follow-up/{token}` (public, outside the /api/admin gate).
 * The corresponding page route at `/follow-up/[token]/page.tsx` is the
 * CC-127 surface; for CC-126 the API endpoint at
 * `/api/follow-up/[token]` is what consumes the token.
 */
const PUBLIC_PATH = "/follow-up";

export interface MintedFollowUpLink {
  token: string;
  url: string;
}

/**
 * Generate an unguessable token, persist a `follow_up_links` row tying
 * it to `sessionId`, and return the token + the public URL. Errors when
 * the session doesn't exist (caller's responsibility to check upstream;
 * we double-check here so the FK fails cleanly).
 */
export async function mintFollowUpLink(
  sessionId: string,
  options: { baseUrl?: string } = {}
): Promise<MintedFollowUpLink> {
  const db = getDb();

  // Sanity: refuse to mint a link for a non-existent session.
  const sessionRow = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (sessionRow.length === 0) {
    throw new Error(`mintFollowUpLink: session ${sessionId} not found`);
  }

  const token = generateUnguessableToken();
  await db.insert(followUpLinks).values({ token, session_id: sessionId });

  const base = options.baseUrl ?? "";
  return { token, url: `${base}${PUBLIC_PATH}/${token}` };
}

/**
 * 24-byte random → base64url → 32 chars. Exposed for tests / scripts.
 */
export function generateUnguessableToken(): string {
  return randomBytes(24).toString("base64url");
}
