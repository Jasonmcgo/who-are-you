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
import { resolveAllowedPacks } from "../../../../../../lib/games/roomRead/entitlements";
import { isKnownPack } from "../../../../../../lib/games/roomRead/packs";
import type {
  PackId,
  RoomReadMode,
} from "../../../../../../lib/games/roomRead/types";

interface PostBody {
  playerSessionIds?: unknown;
  roundCount?: unknown;
  mode?: unknown;
  createdByAdmin?: unknown;
  // CC-187 — admin override: an explicit pack list (validated against
  // `KNOWN_PACKS`). Omitted → packs are resolved through the
  // entitlement seam. NEVER trusts raw entries — any id not in
  // `KNOWN_PACKS` is dropped (entitlement is then also enforced).
  allowedPacks?: unknown;
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

  // CC-187 — resolve the allowed packs. The entitlement seam decides
  // what the purchaser/admin holds; an explicit admin-side override
  // (POST body `allowedPacks`) is validated against `KNOWN_PACKS`
  // AND intersected with the entitlement-resolved set so a client
  // can never trick the seam by sending a raw pack id.
  const entitlementContext = { createdByAdmin };
  const entitled = new Set(resolveAllowedPacks(entitlementContext));
  let allowedPacks: PackId[] | undefined;
  if (Array.isArray(body.allowedPacks)) {
    const overrideIds = body.allowedPacks.filter(
      (x): x is string => typeof x === "string" && isKnownPack(x)
    );
    // Intersect with entitlement — never trust a raw client list.
    allowedPacks = overrideIds.filter((id) => entitled.has(id));
    if (allowedPacks.length === 0) {
      return NextResponse.json(
        {
          error:
            "allowedPacks override is empty after entitlement check — every requested pack is either unknown or not entitled for this admin",
        },
        { status: 403 }
      );
    }
  } else {
    // No override → use the full entitled set.
    allowedPacks = [...entitled];
  }

  try {
    const created = await createRoomReadSession({
      playerSessionIds,
      roundCount,
      mode,
      createdByAdmin,
      allowedPacks,
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
      message.includes("not found") ||
      // CC-187 — coverage-fail error from generate.ts's all-8-themes
      // pre-check. Surface as 400 (admin/operator can fix by widening
      // allowedPacks) rather than 500.
      message.includes("don't cover theme");
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
