// CC-176 / CC-184 — Public Room Read guess upsert (token-as-auth).
//
// Path: `/api/games/room-read/[token]/rounds/[roundId]/guess`.
//
// POST body — exactly one of:
//   { voterPlayerId: string; guessedPlayerId: string }                   // single
//   { voterPlayerId: string; guessedPlayerIds: [string, string] }        // CC-184 pair
//   { voterPlayerId: string; guessedSpecial: "nobody" }                  // abstain
//
// CC-184 — the blind `guessedSpecial: "both"` shape is RETIRED. The
// pick-two UI sends `guessedPlayerIds`; the route rejects "both" with
// a clear migration error.
//
// UNIQUE(round_id, voter_player_id) enforces "one vote per voter per
// round" — the upsert lets a voter change their guess up until the
// round is revealed. After reveal the route returns 409.

import { NextResponse, type NextRequest } from "next/server";

import { submitGuess } from "../../../../../../../../lib/games/roomRead/persistence";

interface PostBody {
  voterPlayerId?: unknown;
  guessedPlayerId?: unknown;
  guessedPlayerIds?: unknown;
  guessedSpecial?: unknown;
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

  if (typeof body.voterPlayerId !== "string" || !body.voterPlayerId) {
    return NextResponse.json(
      { error: "voterPlayerId is required" },
      { status: 400 }
    );
  }
  const voterPlayerId = body.voterPlayerId;

  const guessedPlayerId =
    typeof body.guessedPlayerId === "string" ? body.guessedPlayerId : undefined;

  // CC-184 — accept the new pair shape. Coerce to a length-2 tuple of
  // strings; anything else falls through as undefined and triggers the
  // "exactly one of" validation below.
  let guessedPlayerIds: [string, string] | undefined;
  if (
    Array.isArray(body.guessedPlayerIds) &&
    body.guessedPlayerIds.length === 2 &&
    typeof body.guessedPlayerIds[0] === "string" &&
    typeof body.guessedPlayerIds[1] === "string"
  ) {
    guessedPlayerIds = [body.guessedPlayerIds[0], body.guessedPlayerIds[1]];
  }

  // CC-184 — reject the retired "both" special with a migration-clear
  // error message rather than silently dropping it.
  if (body.guessedSpecial === "both") {
    return NextResponse.json(
      {
        error:
          "guessedSpecial 'both' is retired (CC-184). Send guessedPlayerIds: [id1, id2] to name the two on a split card.",
      },
      { status: 400 }
    );
  }
  const guessedSpecial =
    body.guessedSpecial === "nobody" ? body.guessedSpecial : undefined;

  const supplied =
    (guessedPlayerId ? 1 : 0) +
    (guessedPlayerIds ? 1 : 0) +
    (guessedSpecial ? 1 : 0);
  if (supplied === 0) {
    return NextResponse.json(
      {
        error:
          "guess requires guessedPlayerId, guessedPlayerIds, or guessedSpecial",
      },
      { status: 400 }
    );
  }
  if (supplied > 1) {
    return NextResponse.json(
      {
        error:
          "guess accepts exactly one of guessedPlayerId / guessedPlayerIds / guessedSpecial",
      },
      { status: 400 }
    );
  }

  try {
    const ack = await submitGuess({
      joinToken: token,
      roundId,
      voterPlayerId,
      guessedPlayerId,
      guessedPlayerIds,
      guessedSpecial,
    });
    return NextResponse.json(ack);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    let status = 500;
    if (message.includes("already revealed")) status = 409;
    else if (message.includes("not found")) status = 404;
    else if (
      message.includes("not a player") ||
      message.includes("not in this game") ||
      message.includes("requires") ||
      message.includes("accepts exactly one") ||
      message.includes("not open for voting") ||
      message.includes("two DIFFERENT players") ||
      message.includes("length-2 tuple")
    ) {
      status = 400;
    }
    console.error("[api/games/room-read/[token]/rounds/.../guess] failed", {
      token,
      roundId,
      voterPlayerId,
      error: message,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
