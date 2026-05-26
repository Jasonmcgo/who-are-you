// CC-175 — Room Read engine matching.
//
// `scoreCardForPlayer` = Σ over `card.tags` of `weight × player.signals[tag]`
//   (missing tag on a player contributes 0).
//
// `rankPlayersForCard` returns the players sorted by score descending,
//   with a deterministic tiebreak on `playerId` so identical scores
//   never produce flaky order between runs.
//
// `getEnginePick` returns the top player + runner-up, a gap-based
//   confidence (high ≥ 0.12, medium ≥ 0.06, else low), the top-3
//   tags that contributed most to the top player's score, and a
//   human-readable reason for the UI surface.

import type {
  EnginePick,
  PlayerGameSignals,
  RoomReadCard,
  TagId,
} from "./types";

const HIGH_CONFIDENCE_GAP = 0.12;
const MEDIUM_CONFIDENCE_GAP = 0.06;
/** CC-175.1 / CC-ROOMREAD-CARD-FIT — split threshold. When the
 *  top-vs-runner-up gap falls BELOW this value, the engine is
 *  genuinely torn between the two players ("both, for different
 *  reasons"). Conceptually anchored at the lower edge of the
 *  "debatable" tension band (`TENSION_BAND_LO = 0.04` in
 *  `generate.ts`): a gap below the debatable band is a near-tie and
 *  surfaces as a split; a gap inside the band is a single pick with
 *  the runner-up tension bonus; a gap above is a clean blowout.
 *  Tighter than the `low`-confidence floor (0.06) so a split is a
 *  near dead-heat at the TOP, not merely "low confidence". The
 *  scoring layer pays a +3 split-read bonus to a player who reads
 *  the engine's split via the special "both" tile.
 *
 *  CC-ROOMREAD-CARD-FIT (2026-05-26) widened from 0.03 → 0.04 so
 *  splits fire on the cohort more often (live observation: confident
 *  single picks were landing where a split was warranted). */
export const SPLIT_EPS = 0.04;

export function scoreCardForPlayer(
  card: RoomReadCard,
  player: PlayerGameSignals
): number {
  let total = 0;
  for (const { tag, weight } of card.tags) {
    const v = player.signals[tag] ?? 0;
    total += weight * v;
  }
  return total;
}

/** The per-tag contribution `weight × signal` for one player on one
 *  card. Used to surface the top-3 matched tags on `EnginePick`. */
function contributionsForPlayer(
  card: RoomReadCard,
  player: PlayerGameSignals
): { tag: TagId; contribution: number }[] {
  const out: { tag: TagId; contribution: number }[] = [];
  for (const { tag, weight } of card.tags) {
    const v = player.signals[tag] ?? 0;
    const contribution = weight * v;
    if (contribution > 0) out.push({ tag, contribution });
  }
  out.sort((a, b) => b.contribution - a.contribution);
  return out;
}

export function rankPlayersForCard(
  card: RoomReadCard,
  players: PlayerGameSignals[]
): { player: PlayerGameSignals; score: number }[] {
  return players
    .map((player) => ({ player, score: scoreCardForPlayer(card, player) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Deterministic tiebreak so identical scores produce stable order.
      return a.player.playerId.localeCompare(b.player.playerId);
    });
}

export function getEnginePick(
  card: RoomReadCard,
  players: PlayerGameSignals[]
): EnginePick {
  if (players.length === 0) {
    throw new Error("getEnginePick: empty player list");
  }
  const ranked = rankPlayersForCard(card, players);
  const top = ranked[0];
  const runnerUp = ranked[1];

  const gap = runnerUp ? top.score - runnerUp.score : top.score;
  const confidence: EnginePick["confidence"] =
    gap >= HIGH_CONFIDENCE_GAP
      ? "high"
      : gap >= MEDIUM_CONFIDENCE_GAP
      ? "medium"
      : "low";
  // CC-175.1 — split signal. True only when a runner-up exists AND
  // the top-vs-runner-up gap is below `SPLIT_EPS`. A single-player
  // pick can never be split.
  const isSplit = runnerUp !== undefined && gap < SPLIT_EPS;

  const matchedTags = contributionsForPlayer(card, top.player).slice(0, 3);
  // Reason: "Alice — pattern_reader, deep_seeing" — UI-friendly, no
  // jargon shaping beyond what the tag IDs themselves carry. CC-177
  // can format / humanize further at render time.
  const reason =
    matchedTags.length > 0
      ? `${top.player.displayName} — ${matchedTags
          .map((m) => m.tag)
          .join(", ")}`
      : `${top.player.displayName}`;

  return {
    playerId: top.player.playerId,
    displayName: top.player.displayName,
    score: top.score,
    confidence,
    isSplit,
    matchedTags,
    reason,
    runnerUp: runnerUp
      ? {
          playerId: runnerUp.player.playerId,
          displayName: runnerUp.player.displayName,
          score: runnerUp.score,
        }
      : undefined,
  };
}
