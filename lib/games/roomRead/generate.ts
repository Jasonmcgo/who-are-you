// CC-175 + CC-ROOMREAD-EVEN-DISTRIBUTION — Room Read game generation.
//
// Constructs an N-round game by walking the Body Card Journey in
// `BODY_CARD_ORDER`. For each round, candidate cards are filtered to
// the round's theme + mode + not-already-used, then selected by a
// two-stage rule:
//
//   1. EVEN-DISTRIBUTION QUOTA (CC-ROOMREAD-EVEN-DISTRIBUTION).
//      With P players and R rounds, the per-player engine-pick cap is
//      `ceil(R/P)`. Each round prefers candidate cards whose engine
//      pick targets a player in the current minimum-feature-count
//      tier (the under-served players). Players at the cap are
//      INELIGIBLE. The remainder (`R mod P` extra slots) falls out
//      naturally to whoever wins the quality rank in the later rounds.
//      This replaces CC-175.1's soft additive penalty
//      (`COVERAGE_PENALTY_PER_REPEAT = 0.5`), which a dominant profile
//      could out-score — the new rule is a HARD QUOTA, not a nudge.
//
//   2. QUALITY RANK (CC-175.1, retained intact).
//      Within the eligible (under-served) set, the existing rank wins:
//        confidenceBoost + enginePick.score + RUNNER_UP_TENSION_BONUS × tension(gap)
//      This keeps the "best debatable card" picker; CC-ROOMREAD only
//      constrains WHO it can target.
//
// Fallback: if no candidate card in the round's theme can target an
// under-served player (the card library lacks variety for that theme),
// the round picks the least-repeated eligible target and records the
// event in `RoomReadGame.fallbackEvents` for follow-up analysis. The
// fallback never throws; with ~5 cards/theme there's usually enough
// variety.
//
// 4–10 players, 4–10 rounds. With 8 themes, rounds 9–10 reuse themes
// (MVP behavior — flagged in the prompt). No duplicate CARD per
// session. Throws if a theme has no eligible card AT ALL.

import { CARDS } from "./cards";
import { getEnginePick } from "./engine";
import { BODY_CARD_ORDER } from "./rounds";
import type {
  BodyCardTheme,
  PlayerGameSignals,
  RoomReadCard,
  RoomReadGame,
  RoomReadMode,
  RoomReadRound,
} from "./types";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 10;
const MIN_ROUNDS = 4;
const MAX_ROUNDS = 10;

// CC-175.1 — candidate-ranking weights. The quality rank (used WITHIN
// the eligible quota tier — see CC-ROOMREAD-EVEN-DISTRIBUTION) is:
//
//   confidenceBoost + enginePick.score + RUNNER_UP_TENSION_BONUS × tension(gap)
//
// where `tension(gap)` is a tent function centered on the "debatable"
// band: it peaks at 1.0 in the 0.04..0.10 gap range, falls to 0 at
// gap=0 (now routed to split cards instead) and at gap≥0.20 (a clear
// blowout — not a debate).
//
// Both terms are bounded so they cannot dominate `enginePick.score` —
// a strongly-justified card always beats a weak card with great
// tension, WITHIN the same quota tier.

/** Maximum tension bonus added to a candidate's rank. Tuned so a
 *  perfectly-debatable card (gap in 0.04..0.10) tips ~one ranking
 *  position against an otherwise-equal card with a 0.0 gap or a
 *  blowout 0.20+ gap. */
const RUNNER_UP_TENSION_BONUS = 0.10;
/** Boundaries of the "debatable" tension band. Inside → bonus = 1.0;
 *  outside → bonus tapers linearly to 0 at the OUTER edges below. */
const TENSION_BAND_LO = 0.04;
const TENSION_BAND_HI = 0.10;
/** Outer edges where tension bonus reaches 0. Inside `(0, TENSION_BAND_LO]`
 *  the bonus ramps up; inside `[TENSION_BAND_HI, TENSION_BAND_FAR]` it
 *  ramps down. Below the inner edge the gap is a near-tie (split-card
 *  territory anyway); above the outer edge the gap is a clear blowout. */
const TENSION_FAR = 0.20;

/**
 * CC-ROOMREAD-CARD-FIT — weak-fit floor for the engine's top score.
 *
 * Cards are scored as `Σ weight × player.signal[tag]`. With weights
 * typically 0.4–1.0 and signals normalized 0..1, a "strong match"
 * scores ≥ ~0.4 (a player with mid signal on the dominant tag plus a
 * smaller contribution from a second tag). Below this floor, even the
 * top player barely fits — the card has no real target in the sub-pool.
 *
 * When a candidate's `enginePick.score < WEAK_FIT_FLOOR`, the card is
 * demoted in the ranking (sorted AFTER all strong-fit candidates),
 * irrespective of its `qualityRank` — so a card that fits someone in
 * the sub-pool always beats a weak-fit card that happens to have a
 * higher tension/confidence bonus. If EVERY candidate is weak-fit
 * (the canonical Si-flavored-card-in-a-room-with-no-Si-player case),
 * the round still picks the best of the weak-fit options and records
 * a `weak-fit-no-strong-match` fallback event so the operator can
 * narrow the card library or grow the room.
 */
export const WEAK_FIT_FLOOR = 0.25;

export interface GenerateRoomReadGameArgs {
  players: PlayerGameSignals[];
  roundCount: number;
  mode: RoomReadMode;
}

export function generateRoomReadGame(
  args: GenerateRoomReadGameArgs
): RoomReadGame {
  const { players, roundCount, mode } = args;

  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(
      `generateRoomReadGame: player count ${players.length} out of range [${MIN_PLAYERS}, ${MAX_PLAYERS}]`
    );
  }
  if (roundCount < MIN_ROUNDS || roundCount > MAX_ROUNDS) {
    throw new Error(
      `generateRoomReadGame: roundCount ${roundCount} out of range [${MIN_ROUNDS}, ${MAX_ROUNDS}]`
    );
  }

  const usedCardIds = new Set<string>();
  const featureCountByPlayer = new Map<string, number>();
  const rounds: RoomReadRound[] = [];
  // CC-ROOMREAD-EVEN-DISTRIBUTION — per-player cap. With P players
  // and R rounds, each player is targeted at most `ceil(R/P)` times,
  // and the natural floor is `floor(R/P)` — never "one player twice
  // while another is zero." This is a HARD quota, not a tunable
  // penalty.
  const cap = Math.ceil(roundCount / players.length);
  const fallbackEvents: Array<{
    roundNumber: number;
    theme: BodyCardTheme;
    targetPlayerId: string;
    reason: "all-eligible-targets-at-cap" | "weak-fit-no-strong-match";
  }> = [];

  for (let i = 0; i < roundCount; i++) {
    const theme = BODY_CARD_ORDER[i % BODY_CARD_ORDER.length];
    const candidates = CARDS.filter(
      (c) =>
        c.theme === theme &&
        c.modes.includes(mode) &&
        !usedCardIds.has(c.id)
    );
    if (candidates.length === 0) {
      throw new Error(
        `generateRoomReadGame: no eligible card for theme=${theme} on round ${i + 1} (mode=${mode}; used=${[...usedCardIds].join(",")})`
      );
    }

    // CC-ROOMREAD-EVEN-DISTRIBUTION — two-stage target selection.
    //
    // Stage 1 — eligible pool: players still BELOW the cap. A player
    // who has hit `ceil(R/P)` is ineligible until the game ends.
    // Stage 2 — under-served sub-pool: within the eligible pool, only
    // players in the current MIN feature-count tier. This is the
    // quota: every round prefers the under-served players, so picks
    // distribute floor(R/P)..ceil(R/P) without one player sweeping.
    //
    // The engine pick is then computed AGAINST THE SUB-POOL via
    // `getEnginePick(card, subPool)`. This is the load-bearing piece:
    // without restricting the player list, a dominant profile (one
    // player with high signals on every theme) would win every card's
    // pick regardless of count — making the soft-penalty equivalent
    // of CC-175.1 unavoidable. By recomputing the pick against the
    // sub-pool, we keep "best debatable card within the eligible
    // set" as the per-round quality rule.
    //
    // The eligible pool is guaranteed non-empty during round
    // selection: total cap capacity = P × ceil(R/P) ≥ R, so we never
    // run out of eligible players before the last round. The
    // fallback below is a belt-and-suspenders for defensive
    // edge-cases (e.g. a future change that makes engine picks
    // unstable mid-round); it records to `fallbackEvents` and never
    // throws.
    const targetCount = (id: string) => featureCountByPlayer.get(id) ?? 0;
    const eligiblePool = players.filter((p) => targetCount(p.playerId) < cap);
    let subPool: PlayerGameSignals[];
    let usedFallback = false;
    if (eligiblePool.length > 0) {
      const minCount = Math.min(
        ...eligiblePool.map((p) => targetCount(p.playerId))
      );
      subPool = eligiblePool.filter(
        (p) => targetCount(p.playerId) === minCount
      );
    } else {
      // Defensive: should never fire (see invariant above). Falls back
      // to the full player pool + records the event so a future
      // regression surfaces loudly.
      subPool = players;
      usedFallback = true;
    }

    // CC-175.1 quality rank — base engine score + author confidence +
    // runner-up tension. Score is computed against the SUB-POOL so the
    // engine pick (and its runner-up, gap, tension) reflect the
    // eligible set. NO coverage penalty here; CC-ROOMREAD's hard
    // quota controls distribution via the sub-pool filter above.
    const scoredCandidates = candidates.map((card) => {
      const enginePick = getEnginePick(card, subPool);
      const gap = enginePick.runnerUp
        ? enginePick.score - enginePick.runnerUp.score
        : enginePick.score;
      const tensionBonus = RUNNER_UP_TENSION_BONUS * tensionWeight(gap);
      const qualityRank =
        (card.confidenceBoost ?? 0) +
        enginePick.score +
        tensionBonus;
      // CC-ROOMREAD-CARD-FIT — weak-fit flag. A card whose engine top
      // score for the sub-pool is below the floor has no strong match
      // in the room; demote it below all strong-fit candidates so a
      // card that fits SOMEONE wins. Tension/confidenceBoost can't
      // rescue a weak-fit card.
      const weakFit = enginePick.score < WEAK_FIT_FLOOR;
      return { card, enginePick, qualityRank, weakFit };
    });

    scoredCandidates.sort((a, b) => {
      // CC-ROOMREAD-CARD-FIT — strong-fit candidates always beat
      // weak-fit candidates, regardless of qualityRank. Within each
      // group, the existing qualityRank order applies.
      if (a.weakFit !== b.weakFit) return a.weakFit ? 1 : -1;
      if (b.qualityRank !== a.qualityRank) return b.qualityRank - a.qualityRank;
      // Deterministic tiebreak on card id so identical ranks pick
      // the same card every run.
      return a.card.id.localeCompare(b.card.id);
    });

    const chosen = scoredCandidates[0];
    if (usedFallback) {
      fallbackEvents.push({
        roundNumber: i + 1,
        theme,
        targetPlayerId: chosen.enginePick.playerId,
        reason: "all-eligible-targets-at-cap",
      });
    }
    // CC-ROOMREAD-CARD-FIT — chosen card is weak-fit (means: EVERY
    // candidate in this theme/sub-pool was weak-fit, otherwise a
    // strong-fit candidate would have sorted above). Log so the
    // operator sees which themes have no real target in the room.
    if (chosen.weakFit) {
      fallbackEvents.push({
        roundNumber: i + 1,
        theme,
        targetPlayerId: chosen.enginePick.playerId,
        reason: "weak-fit-no-strong-match",
      });
    }
    usedCardIds.add(chosen.card.id);
    featureCountByPlayer.set(
      chosen.enginePick.playerId,
      (featureCountByPlayer.get(chosen.enginePick.playerId) ?? 0) + 1
    );
    rounds.push({
      roundNumber: i + 1,
      theme,
      card: chosen.card,
      enginePick: chosen.enginePick,
    });
  }

  return {
    mode,
    players,
    rounds,
    // Only attach when non-empty — keeps the field absent on the
    // expected steady state (no library-variety gaps).
    fallbackEvents: fallbackEvents.length > 0 ? fallbackEvents : undefined,
  };
}

/** Tent function: 1.0 inside the debatable band (`[TENSION_BAND_LO,
 *  TENSION_BAND_HI]`), linear ramps to 0 at gap=0 and gap=TENSION_FAR.
 *  Exported for tests. */
export function tensionWeight(gap: number): number {
  if (gap <= 0) return 0;
  if (gap >= TENSION_FAR) return 0;
  if (gap < TENSION_BAND_LO) return gap / TENSION_BAND_LO; // ramp up
  if (gap <= TENSION_BAND_HI) return 1.0; // peak band
  // ramp down from 1.0 at TENSION_BAND_HI to 0 at TENSION_FAR
  return 1.0 - (gap - TENSION_BAND_HI) / (TENSION_FAR - TENSION_BAND_HI);
}

/** Exposed for testing — lets a test confirm the validation bounds
 *  match the spec without re-importing constants. */
export const ROOM_READ_LIMITS = {
  MIN_PLAYERS,
  MAX_PLAYERS,
  MIN_ROUNDS,
  MAX_ROUNDS,
} as const;

/** Defensive re-export so `cards.ts` consumers can ask "is this card
 *  loaded?" without a manual `find`. CC-176's API layer will use it. */
export function findCardById(cardId: string): RoomReadCard | undefined {
  return CARDS.find((c) => c.id === cardId);
}
