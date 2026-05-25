// CC-176 — Public Room Read guess upsert (token-as-auth).
//
// Path: `/api/games/room-read/[token]/rounds/[roundId]/guess`.
//
// POST body — exactly one of:
//   { voterPlayerId: string; guessedPlayerId: string }
//   { voterPlayerId: string; guessedSpecial: "both" | "nobody" }
//
// UNIQUE(round_id, voter_player_id) enforces "one vote per voter per
// round" — the upsert lets a voter change their guess up until the
// round is revealed. After reveal the route returns 409.

import { NextResponse, type NextRequest } from "next/server";

import { submitGuess } from "../../../../../../../../lib/games/roomRead/persistence";

interface PostBody {
  voterPlayerId?: unknown;
  guessedPlayerId?: unknown;
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
  const guessedSpecial =
    body.guessedSpecial === "both" || body.guessedSpecial === "nobody"
      ? body.guessedSpecial
      : undefined;

  if (!guessedPlayerId && !guessedSpecial) {
    return NextResponse.json(
      { error: "guess requires guessedPlayerId or guessedSpecial" },
      { status: 400 }
    );
  }
  if (guessedPlayerId && guessedSpecial) {
    return NextResponse.json(
      { error: "guess accepts exactly one of guessedPlayerId / guessedSpecial" },
      { status: 400 }
    );
  }

  try {
    const ack = await submitGuess({
      joinToken: token,
      roundId,
      voterPlayerId,
      guessedPlayerId,
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
      message.includes("not open for voting")
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
