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
    const message = e instanceof Error ? e.message : "mint failed";
    // The mint helper's "session not found" message is the only thrown
    // case in MVP; route it as 404 so the caller can react.
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
