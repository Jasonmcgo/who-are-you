// CC-175 / CC-184 — Room Read round-verdict mapping.
//
// CC-184 — when the engine was torn (`isSplit === true`) the round is
// fundamentally a "name the two" call, not an "obvious vs override"
// call. We emit a dedicated `"split"` verdict so the UI never says
// "Obvious" on a split round just because the room's plurality
// happened to land on the engine's top pick.
//
//   isSplit                                 → "split"
//   room consensus AND room == engine       → "obvious"
//   room consensus AND room != engine       → "human_override"
//   no room consensus (vote tie / empty)    → "identity_fog"
//
// The UI copy variants ("Engine Dissent" etc.) belong to CC-177/CC-184
// — this module just emits the categorical outcome.

import type { RoundVerdict } from "./types";

export function getVerdict(args: {
  roomWinnerPlayerId: string | undefined;
  enginePickPlayerId: string;
  /**
   * CC-184 — when the engine's pick was a split (`enginePick.isSplit`),
   * the round always emits `"split"` regardless of room outcome. The
   * scoring path is name-the-two; the verdict reflects that.
   */
  isSplit?: boolean;
}): RoundVerdict {
  if (args.isSplit) return "split";
  if (args.roomWinnerPlayerId === undefined) return "identity_fog";
  return args.roomWinnerPlayerId === args.enginePickPlayerId
    ? "obvious"
    : "human_override";
}
