// CC-COUPLE-3 / CC-COUPLE-7 — Mint a couple-invite link or a two-sided bond.
//
// Body shapes:
//   Legacy one-sided (CC-COUPLE-3, report page button):
//     POST { sessionId: string }
//   Two-sided bond (CC-COUPLE-7, admin "Create couple game"):
//     POST { partnerASessionId: string, partnerBSessionId: string,
//            partnerAName?: string, partnerBName?: string }
//
// `partnerASessionId` and `sessionId` are accepted aliases for the same
// field; the legacy report-page mint button (only sends `{ sessionId }`)
// must keep working unchanged.
//
// `mintCoupleInviteLink` validates both sessions exist and throws a
// descriptive error on miss — the CC-154 wrapper logs the real cause
// server-side and returns a generic message to the client.

import { NextResponse, type NextRequest } from "next/server";
import { mintCoupleInviteLink } from "../../../../lib/coupleInviteLink";

interface PostBody {
  /** CC-COUPLE-7 — preferred field name for Partner A. */
  partnerASessionId?: string;
  /** CC-COUPLE-3 — legacy alias (report-page mint button still sends this). */
  sessionId?: string;
  /** CC-COUPLE-7 — when provided, mint as a two-sided bond. */
  partnerBSessionId?: string;
  /** CC-COUPLE-7 — sender-confirmed bond display names. */
  partnerAName?: string;
  partnerBName?: string;
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

  // Accept either `partnerASessionId` (CC-COUPLE-7) or `sessionId`
  // (CC-COUPLE-3 legacy) — the report-page button must keep working.
  const partnerASessionId =
    typeof body.partnerASessionId === "string"
      ? body.partnerASessionId
      : typeof body.sessionId === "string"
      ? body.sessionId
      : "";
  if (!partnerASessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  const partnerBSessionId =
    typeof body.partnerBSessionId === "string" && body.partnerBSessionId
      ? body.partnerBSessionId
      : undefined;
  const partnerAName =
    typeof body.partnerAName === "string" ? body.partnerAName : undefined;
  const partnerBName =
    typeof body.partnerBName === "string" ? body.partnerBName : undefined;

  const baseUrl = new URL(req.url).origin;
  try {
    const minted = await mintCoupleInviteLink(partnerASessionId, {
      baseUrl,
      partnerBSessionId,
      partnerAName,
      partnerBName,
    });
    return NextResponse.json(minted);
  } catch (e) {
    // CC-154 T2 — log the real cause server-side with context for
    // diagnosis; return only the generic copy to the client.
    const rawMessage = e instanceof Error ? e.message : String(e);
    console.error("[api/couple/mint] mint failed", {
      partnerASessionId,
      partnerBSessionId,
      error: rawMessage,
    });
    const status = rawMessage.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: GENERIC_MINT_ERROR }, { status });
  }
}
