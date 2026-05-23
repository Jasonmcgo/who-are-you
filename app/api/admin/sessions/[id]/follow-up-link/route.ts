// CC-127 — POST /api/admin/sessions/[id]/follow-up-link
//
// Admin-gated mint endpoint. The Copy-link button in the admin sessions
// list calls this; it returns the public URL the operator pastes into
// email. Underlying mint logic + token persistence is from CC-126's
// `mintFollowUpLink`; this route is just the HTTP surface.
//
// Auth: lives under `/api/admin/**` so middleware.ts gates it on
// `wru_admin` cookie. Unauthorized callers get 401 from the middleware
// before they reach this handler.

import { NextResponse, type NextRequest } from "next/server";
import { mintFollowUpLink } from "../../../../../../lib/followUpLink";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Resolve the base URL from the request. The minted link is a full
  // URL the operator will paste into email; relative URLs wouldn't
  // be useful. We use the request's origin so this works in dev /
  // staging / prod without configuration.
  const baseUrl = new URL(req.url).origin;

  try {
    const minted = await mintFollowUpLink(id, { baseUrl });
    return NextResponse.json(minted);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Mint failed";
    const status = /session .* not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
