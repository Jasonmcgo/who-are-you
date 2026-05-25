// CC-175 — Room Read round-verdict mapping.
//
//   room consensus AND room == engine     → "obvious"
//   room consensus AND room != engine     → "human_override"
//   no room consensus (vote tie / empty)  → "identity_fog"
//
// The UI copy variants (e.g. "Engine Dissent" for human_override on
// strong-confidence picks) belong to CC-177 — this module just emits
// the categorical outcome.

import type { RoundVerdict } from "./types";

export function getVerdict(args: {
  roomWinnerPlayerId: string | undefined;
  enginePickPlayerId: string;
}): RoundVerdict {
  if (args.roomWinnerPlayerId === undefined) return "identity_fog";
  return args.roomWinnerPlayerId === args.enginePickPlayerId
    ? "obvious"
    : "human_override";
}
