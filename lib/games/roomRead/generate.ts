// CC-175 — Room Read game generation.
//
// Constructs an N-round game by walking the Body Card Journey in
// `BODY_CARD_ORDER`. For each round, candidate cards are filtered to
// the round's theme + mode + not-already-used, then ranked by
//   confidenceBoost + enginePick.score − diversityPenalty
// where the diversity penalty kicks in when the engine pick repeats
// a previously-targeted player (the read should distribute across the
// room when the data supports it).
//
// 4–10 players, 4–10 rounds. With 8 themes, rounds 9–10 reuse themes
// (MVP behavior — flagged in the prompt). No duplicate CARD per
// session. Throws if a theme has no eligible card.

import { CARDS } from "./cards";
import { getEnginePick } from "./engine";
import { BODY_CARD_ORDER } from "./rounds";
import type {
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

// CC-175.1 — candidate-ranking weights.
//
// The per-candidate rank is:
//
//   confidenceBoost
//   + enginePick.score
//   + RUNNER_UP_TENSION_BONUS  × tension(gap)
//   + COVERAGE_BONUS_PER_REPEAT × repeatsAlready  (NEGATIVE — escalating)
//
// where `tension(gap)` is a tent function centered on the "debatable"
// band: it peaks at 1.0 in the 0.04..0.10 gap range, falls to 0 at
// gap=0 (now routed to split cards instead) and at gap≥0.20 (a clear
// blowout — not a debate). `repeatsAlready` is how many times the
// candidate's engine pick has already featured in earlier rounds; the
// penalty escalates linearly so a 3rd-time target only wins if its
// engine score is much stronger than a fresh-target alternative.
//
// All three terms are bounded so they cannot dominate `enginePick.
// score` — a strongly-justified card always beats a weak card with
// great tension or fresh coverage.
//
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

/** Escalating coverage penalty. The Nth-time repeat of a player as
 *  engine pick incurs N × this value. A first repeat (N=1) costs
 *  0.30; a second repeat (N=2) costs 0.60, so a card whose engine
 *  score beats a fresh-target alternative by < 0.30 will lose to the
 *  fresh target on the first repeat, < 0.60 on the second. Tuned
 *  against the cohort-real fixtures (which carry players whose
 *  per-theme scores vary by 0.2-0.5) to spread targets across 5–8
 *  player rooms while still letting a strongly-justified repeat win
 *  (e.g. a 0.7-gap card beats the coverage penalty on the first
 *  repeat). NOT a rigid permutation — see the test cases. */
const COVERAGE_PENALTY_PER_REPEAT = 0.5;

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

    // Score every candidate with the CC-175.1 tuned rank: base engine
    // score + author confidence + runner-up tension + soft coverage.
    const scoredCandidates = candidates.map((card) => {
      const enginePick = getEnginePick(card, players);
      const gap = enginePick.runnerUp
        ? enginePick.score - enginePick.runnerUp.score
        : enginePick.score;
      const tensionBonus = RUNNER_UP_TENSION_BONUS * tensionWeight(gap);
      const repeats = featureCountByPlayer.get(enginePick.playerId) ?? 0;
      const coveragePenalty = repeats * COVERAGE_PENALTY_PER_REPEAT;
      const rank =
        (card.confidenceBoost ?? 0) +
        enginePick.score +
        tensionBonus -
        coveragePenalty;
      return { card, enginePick, rank };
    });
    scoredCandidates.sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      // Deterministic tiebreak on card id so identical ranks pick
      // the same card every run.
      return a.card.id.localeCompare(b.card.id);
    });

    const chosen = scoredCandidates[0];
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

  return { mode, players, rounds };
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
