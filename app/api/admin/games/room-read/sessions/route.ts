// CC-176 — Admin-gated route to mint a Room Read session.
//
// Path: `/api/admin/games/room-read/sessions`. Lives under
// `/api/admin/**` so the middleware (`middleware.ts`) gates it on the
// `wru_admin` cookie. The public token-as-auth routes for the same
// game live at `/api/games/room-read/[token]/...`.
//
// POST body:
//   { playerSessionIds: string[]; roundCount: number; mode?: "classic";
//     createdByAdmin?: string }
// Response (201): { sessionId, joinToken, joinUrl, rounds }
//
// Validation messages mirror `generateRoomReadGame` so a hand-rolled
// curl + the route surface the same shape error.

import { NextResponse, type NextRequest } from "next/server";

import {
  createRoomReadSession,
  ROOM_READ_LIMITS,
} from "../../../../../../lib/games/roomRead/persistence";
import type { RoomReadMode } from "../../../../../../lib/games/roomRead/types";

interface PostBody {
  playerSessionIds?: unknown;
  roundCount?: unknown;
  mode?: unknown;
  createdByAdmin?: unknown;
}

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate playerSessionIds.
  if (
    !Array.isArray(body.playerSessionIds) ||
    !body.playerSessionIds.every((x) => typeof x === "string")
  ) {
    return NextResponse.json(
      { error: "playerSessionIds must be a string array" },
      { status: 400 }
    );
  }
  const playerSessionIds = body.playerSessionIds as string[];

  // Validate roundCount.
  if (typeof body.roundCount !== "number" || !Number.isFinite(body.roundCount)) {
    return NextResponse.json(
      { error: "roundCount must be a number" },
      { status: 400 }
    );
  }
  const roundCount = body.roundCount;

  // Mode + admin label (both optional).
  const mode: RoomReadMode | undefined =
    body.mode === "classic" ? "classic" : undefined;
  const createdByAdmin =
    typeof body.createdByAdmin === "string" ? body.createdByAdmin : undefined;

  try {
    const created = await createRoomReadSession({
      playerSessionIds,
      roundCount,
      mode,
      createdByAdmin,
    });
    const baseUrl = new URL(req.url).origin;
    const joinUrl = `${baseUrl}/games/room-read/${created.joinToken}`;
    return NextResponse.json(
      {
        sessionId: created.sessionId,
        joinToken: created.joinToken,
        joinUrl,
        rounds: created.rounds,
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Validation-class errors → 400; everything else → 500.
    const isValidation =
      message.includes("out of range") ||
      message.includes("duplicates") ||
      message.includes("not found");
    const status = isValidation ? 400 : 500;
    console.error("[api/admin/games/room-read/sessions] create failed", {
      playerSessionIds,
      roundCount,
      limits: ROOM_READ_LIMITS,
      error: message,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
