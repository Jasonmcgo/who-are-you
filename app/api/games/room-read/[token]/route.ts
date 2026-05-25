// CC-176 — Public Room Read state GET (token-as-auth).
//
// Path: `/api/games/room-read/[token]`. Lives outside `/api/admin/**`
// so the admin middleware does NOT gate it; the unguessable token in
// the URL path segment is the auth credential — same model as
// `/api/follow-up/[token]` and `/api/couple/[token]`.
//
// Returns players (id + displayName only — never any answer payload),
// the current round (theme + card prompt + status, but NEVER the
// engine pick unless the round is `revealed`), and the running
// scoreboard.

import { NextResponse, type NextRequest } from "next/server";

import { getRoomReadByToken } from "../../../../../lib/games/roomRead/persistence";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const state = await getRoomReadByToken(token);
    if (!state) {
      return NextResponse.json({ error: "Room Read not found" }, { status: 404 });
    }
    return NextResponse.json(state);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/games/room-read/[token]] GET failed", {
      token,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
