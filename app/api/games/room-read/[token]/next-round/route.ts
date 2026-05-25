// CC-176 — Public Room Read next-round advance (token-as-auth).
//
// Path: `/api/games/room-read/[token]/next-round`.
//
// POST → opens the next pending round (if all prior rounds are
// revealed) or marks the session `complete` when the final round has
// been revealed. Idempotent on the complete state: a POST after
// completion returns `{ sessionStatus: "complete" }` without error.

import { NextResponse, type NextRequest } from "next/server";

import { advanceToNextRound } from "../../../../../../lib/games/roomRead/persistence";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const result = await advanceToNextRound({ joinToken: token });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    let status = 500;
    if (message.includes("not found")) status = 404;
    else if (message.includes("not yet revealed")) status = 409;
    console.error("[api/games/room-read/[token]/next-round] failed", {
      token,
      error: message,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
