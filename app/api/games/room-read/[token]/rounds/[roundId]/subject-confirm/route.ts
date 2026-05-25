// CC-177 — Subject self-confirm route (public, token-as-auth).
//
// Path: `/api/games/room-read/[token]/rounds/[roundId]/subject-confirm`.
//
// POST body:
//   { subjectPlayerId: string; response: "yes" | "no" | "both"; note?: string }
//
// Writes `room_read_calibration_events.subject_self_confirm` for the
// matching (session, round) row — closing the calibration flywheel
// with the strongest single label (self-confirmation outranks peer
// guessing). The persistence layer enforces that `subjectPlayerId`
// matches the round's engine pick; this route validates the request
// shape + surfaces errors with appropriate HTTP statuses.

import { NextResponse, type NextRequest } from "next/server";

import { setSubjectSelfConfirm } from "../../../../../../../../lib/games/roomRead/persistence";

interface PostBody {
  subjectPlayerId?: unknown;
  response?: unknown;
  note?: unknown;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; roundId: string }> }
) {
  const { token, roundId } = await params;

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.subjectPlayerId !== "string" || !body.subjectPlayerId) {
    return NextResponse.json(
      { error: "subjectPlayerId is required" },
      { status: 400 }
    );
  }
  if (
    body.response !== "yes" &&
    body.response !== "no" &&
    body.response !== "both"
  ) {
    return NextResponse.json(
      { error: 'response must be one of "yes" | "no" | "both"' },
      { status: 400 }
    );
  }
  const note =
    typeof body.note === "string" && body.note.trim().length > 0
      ? body.note.trim().slice(0, 280)
      : undefined;

  try {
    const record = await setSubjectSelfConfirm({
      joinToken: token,
      roundId,
      subjectPlayerId: body.subjectPlayerId,
      response: body.response,
      note,
    });
    return NextResponse.json({ ok: true, record });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    let status = 500;
    if (message.includes("session not found")) status = 404;
    else if (message.includes("no calibration event")) status = 409;
    else if (message.includes("can only be written by")) status = 403;
    console.error(
      "[api/games/room-read/[token]/rounds/.../subject-confirm] failed",
      { token, roundId, subjectPlayerId: body.subjectPlayerId, error: message }
    );
    return NextResponse.json({ error: message }, { status });
  }
}
