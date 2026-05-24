// CC-COUPLE-1 / CC-COUPLE-7 — Couple invite-link mint helper.
//
// `mintCoupleInviteLink(partnerASessionId, options)` inserts a new row
// into `couple_sessions` with an unguessable token and returns the
// public URL the bond plays from. Token scheme is the SAME as
// `lib/followUpLink.ts` — we import `generateUnguessableToken` from
// there to avoid duplicating crypto.
//
// CC-COUPLE-7: the helper now supports both shapes:
//   - **Legacy one-sided invite** (`mintCoupleInviteLink(aSessionId)`):
//     status `"invited"`, B fields null. Back-compat for the report-page
//     "share" button (CC-COUPLE-3) and any other caller still on the
//     single-argument form.
//   - **Two-sided bond** (`mintCoupleInviteLink(aSessionId, {
//     partnerBSessionId, partnerAName, partnerBName })`): status
//     `"b_joined"` (reusing the existing status — no enum change), bond
//     names stored. Verifies B's session exists too.

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { coupleSessions, sessions } from "../db/schema";
import { generateUnguessableToken } from "./followUpLink";
import { COUPLE_SESSION_STATUS } from "./coupleTypes";

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

export interface MintCoupleInviteLinkOptions {
  /** Origin prefix for the returned URL (e.g. `http://localhost:3003`). */
  baseUrl?: string;
  /**
   * CC-COUPLE-7 — when provided, the row is minted as a complete bond
   * (status `b_joined`) tying both partners. Must reference an existing
   * `sessions.id`, else mint throws a clear error.
   */
  partnerBSessionId?: string;
  /**
   * CC-COUPLE-7 — sender-confirmed display name for Partner A. Trimmed
   * before insert; empty/whitespace stores as null so the game-route's
   * name-precedence chain falls through to demographics.
   */
  partnerAName?: string;
  /**
   * CC-COUPLE-7 — sender-confirmed display name for Partner B. Same
   * trim-to-null treatment as `partnerAName`.
   */
  partnerBName?: string;
}

function normalizeName(name: string | undefined): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Generate an unguessable token, persist a `couple_sessions` row tying
 * it to `partnerASessionId` (and optionally `partnerBSessionId` + bond
 * names), and return the token + the public URL.
 *
 * Throws with a descriptive error when either referenced session is
 * missing — the `/api/couple/mint` route's CC-154 wrapper turns that
 * into a generic 404 user-facing message.
 */
export async function mintCoupleInviteLink(
  partnerASessionId: string,
  options: MintCoupleInviteLinkOptions = {}
): Promise<MintedCoupleInviteLink> {
  const db = getDb();

  const aRow = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.id, partnerASessionId))
    .limit(1);
  if (aRow.length === 0) {
    throw new Error(
      `mintCoupleInviteLink: partner A session ${partnerASessionId} not found`
    );
  }

  // CC-COUPLE-7 — bond mode. When B is provided, verify it exists too
  // so the FK fails cleanly with a descriptive error rather than a raw
  // constraint violation. Self-bonds (A === B) are blocked here so the
  // invariant lives next to the only mint path that can violate it.
  const partnerBSessionId = options.partnerBSessionId;
  if (partnerBSessionId) {
    if (partnerBSessionId === partnerASessionId) {
      throw new Error(
        "mintCoupleInviteLink: partner A and partner B must be different sessions"
      );
    }
    const bRow = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.id, partnerBSessionId))
      .limit(1);
    if (bRow.length === 0) {
      throw new Error(
        `mintCoupleInviteLink: partner B session ${partnerBSessionId} not found`
      );
    }
  }

  const partnerAName = normalizeName(options.partnerAName);
  const partnerBName = normalizeName(options.partnerBName);

  const token = generateUnguessableToken();
  await db.insert(coupleSessions).values({
    invite_token: token,
    partner_a_session_id: partnerASessionId,
    partner_b_session_id: partnerBSessionId ?? null,
    partner_a_name: partnerAName,
    partner_b_name: partnerBName,
    // Reuse the existing status enum — `b_joined` already means "both
    // partners present"; no migration change needed.
    status: partnerBSessionId
      ? COUPLE_SESSION_STATUS.B_JOINED
      : COUPLE_SESSION_STATUS.INVITED,
  });

  const base = options.baseUrl ?? "";
  return { token, url: `${base}${PUBLIC_PATH}/${token}` };
}
