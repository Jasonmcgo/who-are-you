// CC-175 / CC-175.1 / CC-184 — Room Read per-round scoring + room-vote tally.
//
// SCORING RULES (CC-184 rewrite):
//
//   NORMAL round (`enginePick.isSplit === false`)
//     +2  guess == engine pick (single-player guess only)
//     +2  guess == room winner
//     +1  perfect read (guess == engine == room)
//     CC-184 anti-hedge guard: a PAIR guess on a normal round earns
//       0 engine credit (no commit) — room-match may still apply if
//       either named player matches the room winner.
//     A "nobody" tile vote scores 0 on both engine and room.
//     Max: 5.
//
//   SPLIT round (`enginePick.isSplit === true`)
//     Targets = { enginePick.playerId, enginePick.runnerUp.playerId }.
//     Engine = number of correctly-named targets, plus a +1 bonus
//       when BOTH are named:
//         0 correct  → 0
//         1 correct  → +1
//         2 correct  → +2 + 1 bonus = 3
//     Room  = +2 when any named player equals the room winner.
//     "nobody" tile vote scores 0.
//     A single-player guess that hits one target also scores +1
//       (single-id guesses are valid on splits; the pair-guess +1
//       bonus only fires when BOTH are named via `guessedPlayerIds`).
//     Max: 3 + 2 = 5.
//
// PRE-CC-184: a blind `guessedSpecial="both"` paid +3 on a split. That
// path is gone — voters now name the two via `guessedPlayerIds`.
// Legacy persistence rows with `guessed_special="both"` and no player
// ids load as zero-info guesses (0 points) by CC-184 design.
//
// `getRoomWinner` (CC-184) tallies per PLAYER: a single guess = 1 vote
// for the named player; a pair guess = 1 vote for EACH named player;
// "nobody" is ignored. Top-voted player wins; tie → undefined
// (Identity Fog). The pre-CC `ROOM_WINNER_BOTH_SENTINEL` bucket is
// retired.

import type { RoundGuessInputs, RoundScoreBreakdown } from "./types";

export function calculateCardScores(
  inputs: RoundGuessInputs
): RoundScoreBreakdown {
  const {
    guessedPlayerId,
    guessedPlayerIds,
    guessedSpecial,
    roomWinnerPlayerId,
    enginePick,
  } = inputs;

  // Normalize the voter's named players into an ordered list of ids.
  // - single guess → [id]
  // - pair guess   → [id1, id2]
  // - "nobody" / nothing → []
  const namedPlayerIds: readonly string[] =
    guessedPlayerIds && guessedPlayerIds.length === 2
      ? guessedPlayerIds
      : guessedPlayerId
      ? [guessedPlayerId]
      : [];

  if (enginePick.isSplit) {
    // ── Split card — name-the-two scoring ──────────────────────────
    const target1 = enginePick.playerId;
    const target2 = enginePick.runnerUp?.playerId;
    const targets = new Set<string>([target1]);
    if (target2) targets.add(target2);

    // De-duplicate the named players against the targets so two
    // identical ids in `guessedPlayerIds` (the submitGuess validator
    // forbids it, but defensive) can't double-count one target.
    const correctlyNamed = new Set<string>();
    for (const id of namedPlayerIds) {
      if (targets.has(id)) correctlyNamed.add(id);
    }
    const splitNamedCorrect = correctlyNamed.size;
    // +1 bonus iff BOTH targets named correctly via a pair guess.
    // The bonus is gated on BOTH targets being present (covered by
    // splitNamedCorrect === 2) AND there actually being two targets
    // to name (a degenerate split with no runner-up shouldn't ever
    // ship, but the gate is defensive).
    const namedBoth = splitNamedCorrect === 2 && targets.size === 2;
    const enginePoints = splitNamedCorrect + (namedBoth ? 1 : 0);

    // Room match: any named player equals the room's plurality winner.
    const matchedRoom =
      roomWinnerPlayerId !== undefined &&
      namedPlayerIds.includes(roomWinnerPlayerId);

    return {
      matchedEngine: splitNamedCorrect > 0,
      matchedRoom,
      perfectRead: false,
      splitRead: namedBoth,
      splitNamedCorrect,
      points: enginePoints + (matchedRoom ? 2 : 0),
    };
  }

  // ── Normal card ────────────────────────────────────────────────
  // A "nobody" tile vote on a non-split card scores 0 — no engine
  // signal to match against.
  if (guessedSpecial === "nobody") {
    return {
      matchedEngine: false,
      matchedRoom: false,
      perfectRead: false,
      splitRead: false,
      points: 0,
    };
  }

  // CC-184 anti-hedge guard: a pair guess on a NORMAL (single-pick)
  // round earns 0 engine credit — the voter didn't commit to the
  // one answer. Room-match may still apply if either named player
  // matches the room winner.
  if (guessedPlayerIds && guessedPlayerIds.length === 2) {
    const matchedRoom =
      roomWinnerPlayerId !== undefined &&
      namedPlayerIds.includes(roomWinnerPlayerId);
    return {
      matchedEngine: false,
      matchedRoom,
      perfectRead: false,
      splitRead: false,
      points: matchedRoom ? 2 : 0,
    };
  }

  // Single-player guess on a normal round — pre-CC-184 path, intact.
  const matchedEngine = guessedPlayerId === enginePick.playerId;
  const matchedRoom =
    roomWinnerPlayerId !== undefined &&
    guessedPlayerId === roomWinnerPlayerId;
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

/** Per-voter guess shape consumed by `getRoomWinner`.
 *
 *  CC-184 — the `"both"` special is gone; voters name the two via
 *  the new `pair` kind. A pair contributes 1 vote for EACH named
 *  player; a single contributes 1 for one player; `"nobody"` is
 *  ignored.
 */
export type RoomGuess =
  | { kind: "player"; playerId: string }
  | { kind: "pair"; playerIds: readonly [string, string] }
  | { kind: "special"; value: "nobody" };

/** Compute the plurality winner across a list of guesses. Returns:
 *    - a real player id (a player won the plurality outright),
 *    - `undefined` when no clear plurality exists:
 *        * no guesses submitted,
 *        * only "nobody" abstain votes,
 *        * the top two candidates are tied (Identity Fog).
 *
 *  CC-184 — pair guesses contribute 1 vote to EACH named player. A
 *  player named in two different ballots (e.g. by Alice's single
 *  guess + Bob's pair) accumulates 2 votes. "nobody" votes are
 *  votable for UX but DO NOT count toward the plurality (no engine
 *  signal it maps to in MVP).
 *
 *  Backward-compatible string-array input: `string[]` is still
 *  accepted and treated as player-id votes; pre-CC-184 tests use
 *  this shape.
 */
export function getRoomWinner(
  guesses: readonly RoomGuess[] | readonly string[]
): string | undefined {
  if (guesses.length === 0) return undefined;

  const counts = new Map<string, number>();
  const bump = (playerId: string): void => {
    counts.set(playerId, (counts.get(playerId) ?? 0) + 1);
  };
  for (const g of guesses) {
    if (typeof g === "string") {
      bump(g);
      continue;
    }
    if (g.kind === "player") {
      bump(g.playerId);
    } else if (g.kind === "pair") {
      bump(g.playerIds[0]);
      bump(g.playerIds[1]);
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
