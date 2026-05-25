// CC-175 / CC-175.1 — Room Read per-round scoring + room-vote tally.
//
// Scoring rules (CC-175.1 adds the split-card / Both-tile path):
//
//   NORMAL round (`enginePick.isSplit === false`)
//     +2  guess == engine pick
//     +2  guess == room winner
//     +1  perfect read (guess == engine == room)
//     A `guessedSpecial` vote ("both" / "nobody") scores 0 — the
//     engine had a clear pick to match against.
//     Max: 5.
//
//   SPLIT round (`enginePick.isSplit === true`)
//     +3  `guessedSpecial === "both"` (`splitRead = true`) — the
//         player correctly read that the engine itself is torn.
//     +2  room match (when the room's plurality is also the "both"
//         tile — see `ROOM_WINNER_BOTH_SENTINEL` below).
//     There is no single engine pick on a split card, so the +2
//     engine-match and +1 perfect-read paths do not apply.
//     `guessedSpecial === "nobody"` and player-id guesses score 0.
//     Max: 5 (3 + 2).
//
// `getRoomWinner` returns the plurality winner across all guesses
// (player ids OR the "both" sentinel). Tie → `undefined` (Identity
// Fog). "nobody" votes are ignored — they're votable for UX but carry
// no engine signal in MVP and don't influence the plurality.

import {
  ROOM_WINNER_BOTH_SENTINEL,
  type RoundGuessInputs,
  type RoundScoreBreakdown,
} from "./types";

export function calculateCardScores(
  inputs: RoundGuessInputs
): RoundScoreBreakdown {
  const { guessedPlayerId, guessedSpecial, roomWinnerPlayerId, enginePick } =
    inputs;

  if (enginePick.isSplit) {
    // ── Split card ───────────────────────────────────────────────
    const isBothGuess = guessedSpecial === "both";
    const roomAlsoBoth = roomWinnerPlayerId === ROOM_WINNER_BOTH_SENTINEL;
    const splitRead = isBothGuess;
    const matchedRoom = isBothGuess && roomAlsoBoth;
    // No engine-match path on a split — there is no single engine pick.
    // perfect-read (+1) does not stack on a split (engine-match doesn't
    // apply) — explicitly leave the breakdown's `perfectRead` false.
    const points = (splitRead ? 3 : 0) + (matchedRoom ? 2 : 0);
    return {
      matchedEngine: false,
      matchedRoom,
      perfectRead: false,
      splitRead,
      points,
    };
  }

  // ── Normal card ────────────────────────────────────────────────
  // A special-tile vote ("both" / "nobody") on a non-split card scores
  // 0 — the engine had a clear pick and the voter didn't choose any
  // real player. Falling through to the player-id comparisons would
  // never match (special sentinels aren't real player ids), but the
  // explicit early-return makes the intent local-readable.
  if (guessedSpecial !== undefined) {
    return {
      matchedEngine: false,
      matchedRoom: false,
      perfectRead: false,
      splitRead: false,
      points: 0,
    };
  }

  const matchedEngine = guessedPlayerId === enginePick.playerId;
  const matchedRoom =
    roomWinnerPlayerId !== undefined &&
    roomWinnerPlayerId !== ROOM_WINNER_BOTH_SENTINEL &&
    guessedPlayerId === roomWinnerPlayerId;
  // Perfect read: guess == engine AND guess == room. When the room
  // had no consensus, perfect-read cannot fire (matchedRoom is false).
  const perfectRead = matchedEngine && matchedRoom;

  const points =
    (matchedEngine ? 2 : 0) +
    (matchedRoom ? 2 : 0) +
    (perfectRead ? 1 : 0);

  return {
    matchedEngine,
    matchedRoom,
    perfectRead,
    splitRead: false,
    points,
  };
}

/** Per-voter guess shape consumed by `getRoomWinner`. Either a real
 *  player id OR the special "both" / "nobody" tile. */
export type RoomGuess =
  | { kind: "player"; playerId: string }
  | { kind: "special"; value: "both" | "nobody" };

/** Compute the plurality winner across a list of guesses. Returns:
 *    - a real player id (a player won the plurality outright),
 *    - `ROOM_WINNER_BOTH_SENTINEL` ("both" tile won the plurality),
 *    - `undefined` when no clear plurality exists:
 *        * no guesses submitted, OR
 *        * the top two candidates are tied (Identity Fog).
 *
 *  "nobody" votes are votable for UX (CC-177 surfaces it as a tile)
 *  but DO NOT count toward the plurality in MVP — there's no engine
 *  signal it maps to. They're filtered out before counting.
 *
 *  Backward-compatible string-array input: `string[]` is still
 *  accepted and treated as player-id votes. CC-175's tests rely on
 *  this shape; the richer `RoomGuess[]` shape is the path the
 *  CC-176 API layer will use. */
export function getRoomWinner(
  guesses: readonly RoomGuess[] | readonly string[]
): string | undefined {
  if (guesses.length === 0) return undefined;

  const counts = new Map<string, number>();
  for (const g of guesses) {
    if (typeof g === "string") {
      counts.set(g, (counts.get(g) ?? 0) + 1);
      continue;
    }
    if (g.kind === "player") {
      counts.set(g.playerId, (counts.get(g.playerId) ?? 0) + 1);
    } else if (g.value === "both") {
      counts.set(
        ROOM_WINNER_BOTH_SENTINEL,
        (counts.get(ROOM_WINNER_BOTH_SENTINEL) ?? 0) + 1
      );
    }
    // "nobody" — intentionally ignored for plurality (see header note).
  }

  if (counts.size === 0) return undefined;

  let topCount = -1;
  for (const c of counts.values()) {
    if (c > topCount) topCount = c;
  }
  const winners: string[] = [];
  for (const [key, c] of counts.entries()) {
    if (c === topCount) winners.push(key);
  }
  if (winners.length !== 1) return undefined; // tie → Identity Fog
  return winners[0];
}
