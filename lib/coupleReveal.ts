// CC-COUPLE-2 + CC-COUPLE-4 — Reveal scoring for Obvious-or-Oblivious (Mode 1).
//
// Two layers live here:
//   1. The legacy binary resolver (`resolveReveal`) preserved verbatim
//      for the CC-COUPLE-2 audit (`tests/audit/coupleReveal.audit.ts`)
//      and any downstream code still on the single-pick contract.
//   2. The CC-COUPLE-4 partial-credit scorer (`scoreRankedGuess`) — the
//      new canonical scorer for ranked-top-3 guesses per
//      docs/obvious-oblivious-game-spec.md. Tiers: 5 (#1 hit) / 3
//      (correct in top 3) / 1 (strong adjacent in top 3) / 0 ("comic
//      badge"). Engine-unscored items return `tier: "unscored"`.
//
// Pure functions. No I/O, no mutation. No randomness.

import type {
  CoupleGameOption,
  OptionValence,
  RevealType,
} from "./coupleTypes";

// ─────────────────────────────────────────────────────────────────────
// Legacy binary resolver — kept for back-compat with the CC-COUPLE-2
// audit. Not used by the new ranked flow.
// ─────────────────────────────────────────────────────────────────────

export interface ResolveRevealInput {
  selfAnswer: string;
  partnerGuess: string;
  enginePredicted: string | null;
  selfKnows?: boolean;
  options?: readonly CoupleGameOption[];
}

/**
 * Documented precedence — index 0 wins. Preserved verbatim from
 * CC-COUPLE-2 so the existing audit continues to pass.
 */
export const REVEAL_PRECEDENCE: readonly RevealType[] = [
  "obvious",
  "mirror_blind",
  "hidden_pattern",
  "loving_misread",
  "oblivious",
];

const VALENCE_RANK: Record<OptionValence, number> = {
  critical: 0,
  neutral: 1,
  generous: 2,
};

function lookupValence(
  options: readonly CoupleGameOption[] | undefined,
  optionId: string
): OptionValence | null {
  if (!options) return null;
  const found = options.find((o) => o.id === optionId);
  return found?.valence ?? null;
}

export function resolveReveal(input: ResolveRevealInput): RevealType {
  const { selfAnswer, partnerGuess, enginePredicted, selfKnows, options } =
    input;

  if (partnerGuess === selfAnswer) return "obvious";

  if (
    enginePredicted !== null &&
    partnerGuess === enginePredicted &&
    selfAnswer !== enginePredicted &&
    selfKnows === false
  ) {
    return "mirror_blind";
  }

  if (
    enginePredicted !== null &&
    selfAnswer !== enginePredicted &&
    partnerGuess !== enginePredicted
  ) {
    return "hidden_pattern";
  }

  const guessValence = lookupValence(options, partnerGuess);
  const selfValence = lookupValence(options, selfAnswer);
  if (
    guessValence !== null &&
    selfValence !== null &&
    VALENCE_RANK[guessValence] > VALENCE_RANK[selfValence]
  ) {
    return "loving_misread";
  }

  return "oblivious";
}

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-4 — Partial-credit scorer for ranked-top-3 guesses.
// ─────────────────────────────────────────────────────────────────────

/**
 * Per-item scoring tier.
 *   - clean    : engine answer ranked #1 (5 pts).
 *   - close    : engine answer in top-3 (not #1) (3 pts).
 *   - adjacent : a strong-adjacent option ranked in top-3 (1 pt).
 *   - off      : none of the above; "confidently wrong → comic badge".
 *   - unscored : engine had no defensible prediction for this item.
 */
export type RankedRevealTier =
  | "clean"
  | "close"
  | "adjacent"
  | "off"
  | "unscored";

export interface ScoreRankedGuessInput {
  /** Engine's predicted option id for this item + subject. null = unscored. */
  enginePredicted: string | null;
  /**
   * Partner's ranked guess — only the top-3 entries are scored; longer
   * arrays are truncated for tier resolution. An empty array = "no guess
   * recorded" and yields `tier: "off"` for scored items, `unscored` when
   * the engine itself is null.
   */
  rankedGuess: readonly string[];
  /**
   * Strong-adjacent option ids for this item's engine prediction.
   * Caller is responsible for looking these up (see
   * `lib/coupleGameItems.ts#adjacencyFor`).
   */
  adjacency: readonly string[];
}

export interface ScoreRankedGuessResult {
  tier: RankedRevealTier;
  points: number;
}

/**
 * Documented tier order (highest → lowest priority). Tier resolution
 * picks the first tier whose condition is satisfied; ties cannot occur
 * because `clean` requires #1 and `close` excludes #1.
 */
export const RANKED_TIER_ORDER: readonly RankedRevealTier[] = [
  "clean",
  "close",
  "adjacent",
  "off",
  "unscored",
];

export const RANKED_POINTS: Record<RankedRevealTier, number> = {
  clean: 5,
  close: 3,
  adjacent: 1,
  off: 0,
  unscored: 0,
};

export function scoreRankedGuess(
  input: ScoreRankedGuessInput
): ScoreRankedGuessResult {
  const { enginePredicted, rankedGuess, adjacency } = input;

  if (enginePredicted === null) {
    return { tier: "unscored", points: 0 };
  }

  const top3 = rankedGuess.slice(0, 3);
  if (top3.length === 0) {
    return { tier: "off", points: RANKED_POINTS.off };
  }

  if (top3[0] === enginePredicted) {
    return { tier: "clean", points: RANKED_POINTS.clean };
  }
  if (top3.includes(enginePredicted)) {
    return { tier: "close", points: RANKED_POINTS.close };
  }
  const adjacentSet = new Set(adjacency);
  if (top3.some((id) => adjacentSet.has(id))) {
    return { tier: "adjacent", points: RANKED_POINTS.adjacent };
  }
  return { tier: "off", points: RANKED_POINTS.off };
}

// ─────────────────────────────────────────────────────────────────────
// Helpers for the rolled-up "warm total" the reveal screen displays.
// ─────────────────────────────────────────────────────────────────────

export interface WarmTotal {
  /** Items scored at the `clean` tier. */
  clean: number;
  /** Items scored at the `close` tier. */
  close: number;
  /** Items scored at the `adjacent` tier. */
  adjacent: number;
  /** Items scored at the `off` tier (got a guess, not close, no adjacency). */
  off: number;
  /** Items the engine had no confident prediction for. */
  unscored: number;
  /** Sum of points across all scored items. */
  totalPoints: number;
  /** Maximum points possible across scored items (count × 5). */
  maxPoints: number;
  /**
   * "You read {name} clearly on X of Y" — X is `clean + close`, Y is the
   * number of items the engine could score. Surfaces a warm count, not
   * a percentage.
   */
  clearlyRead: number;
  clearlyOf: number;
}

export function summarizeWarmTotal(
  results: readonly ScoreRankedGuessResult[]
): WarmTotal {
  let clean = 0;
  let close = 0;
  let adjacent = 0;
  let off = 0;
  let unscored = 0;
  let totalPoints = 0;
  for (const r of results) {
    switch (r.tier) {
      case "clean": clean += 1; break;
      case "close": close += 1; break;
      case "adjacent": adjacent += 1; break;
      case "off": off += 1; break;
      case "unscored": unscored += 1; break;
    }
    totalPoints += r.points;
  }
  const scoredCount = clean + close + adjacent + off;
  return {
    clean,
    close,
    adjacent,
    off,
    unscored,
    totalPoints,
    maxPoints: scoredCount * RANKED_POINTS.clean,
    clearlyRead: clean + close,
    clearlyOf: scoredCount,
  };
}
