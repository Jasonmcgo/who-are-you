// CC-COUPLE-3 — Mint a couple-invite link from A's report page.
//
// POST { sessionId } → { token, url }
// Validates the body shape; `mintCoupleInviteLink` (CC-COUPLE-1) double-checks
// the session exists and throws a clear error if not. We surface that as 404.

import { NextResponse, type NextRequest } from "next/server";
import { mintCoupleInviteLink } from "../../../../lib/coupleInviteLink";

interface PostBody {
  sessionId?: string;
}

// CC-154 T2 — single generic user-facing failure copy. The real cause
// is logged server-side (console.error with context) and never echoed
// back to the client.
const GENERIC_MINT_ERROR =
  "We couldn't create your invite link just now. Please try again in a moment.";

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  // Mint helper builds the path; the origin comes from the inbound request
  // so this works in dev / staging / prod without configuration.
  const baseUrl = new URL(req.url).origin;
  try {
    const minted = await mintCoupleInviteLink(sessionId, { baseUrl });
    return NextResponse.json(minted);
  } catch (e) {
    // CC-154 T2 — log the real cause server-side with context for
    // diagnosis; return only the generic copy to the client. The
    // raw error (e.g. `relation "couple_sessions" does not exist`,
    // or `mintCoupleInviteLink: partner A session ... not found`)
    // must never leak through the JSON body.
    const rawMessage = e instanceof Error ? e.message : String(e);
    console.error("[api/couple/mint] mint failed", {
      sessionId,
      error: rawMessage,
    });
    // Preserve the 404 status distinction so the client/network layer
    // can react meaningfully, but the body stays generic.
    const status = rawMessage.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: GENERIC_MINT_ERROR }, { status });
  }
}
