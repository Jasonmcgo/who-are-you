// CC-176 — Public Room Read reveal (token-as-auth).
//
// Path: `/api/games/room-read/[token]/rounds/[roundId]/reveal`.
//
// POST → computes `getRoomWinner` over the round's guesses, runs
// `calculateCardScores` per voter, computes the `getVerdict`,
// persists `room_read_scores`, flips the round to `revealed`, and
// (CRITICAL) writes EXACTLY ONE `room_read_calibration_events` row.
// The calibration log is the engine-tuning flywheel — every reveal
// MUST produce one event, otherwise the aggregator's downstream
// attribution buckets misread the data.

import { NextResponse, type NextRequest } from "next/server";

import { revealRound } from "../../../../../../../../lib/games/roomRead/persistence";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; roundId: string }> }
) {
  const { token, roundId } = await params;

  // CC-ROOMREAD-CADENCE — optional `force: true` flag bypasses the
  // server's all-submitted gate. Body is optional (auto-reveal still
  // POSTs an empty body); a malformed JSON or missing body is fine.
  let force = false;
  try {
    const body = (await req.json()) as { force?: unknown };
    if (body && typeof body === "object" && body.force === true) {
      force = true;
    }
  } catch {
    // No body / not JSON → no force. The auto-reveal path.
  }

  try {
    const payload = await revealRound({
      joinToken: token,
      roundId,
      force,
    });
    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    let status = 500;
    if (message.includes("already revealed")) status = 409;
    else if (message.includes("not found")) status = 404;
    // CC-ROOMREAD-CADENCE — "reveal blocked" is a client gate, not a
    // server fault. 409 (Conflict) is the closest HTTP semantic for
    // "the round state isn't ready for this action."
    else if (message.includes("reveal blocked")) status = 409;
    console.error("[api/games/room-read/[token]/rounds/.../reveal] failed", {
      token,
      roundId,
      error: message,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
