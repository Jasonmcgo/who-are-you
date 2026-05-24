// CC-COUPLE-2 — Reveal-type resolver for Obvious-or-Oblivious (Mode 1).
//
// Pure function. No I/O, no mutation. Implements the precedence laid out in
// docs/couple-module-mvp-spec.md §3 + CC-COUPLE-2 prompt §Context.
//
// The precedence is exposed as `REVEAL_PRECEDENCE` so future tuning (e.g.
// swapping Mirror Blind and Loving Misread when subject-knows-themselves
// becomes a strong signal) is one constant edit, not a rewrite.

import type {
  CoupleGameOption,
  OptionValence,
  RevealType,
} from "./coupleTypes";

export interface ResolveRevealInput {
  selfAnswer: string;
  partnerGuess: string;
  // Engine prediction for this subject + item. null when no defensible
  // mapping exists; the resolver will refuse to fire Mirror Blind / Hidden
  // Pattern in that case.
  enginePredicted: string | null;
  // The subject's claim about whether this is obvious about themselves.
  // Spec: Mirror Blind requires `selfKnows === false` (the strict literal
  // check — undefined does NOT trigger Mirror Blind).
  selfKnows?: boolean;
  // The item's option set. Required only to read `valence` for the
  // Loving Misread branch; if absent or if no option carries valence, the
  // Loving Misread branch is skipped and Oblivious wins.
  options?: readonly CoupleGameOption[];
}

/**
 * Documented precedence — index 0 wins. Tunable: swap or reorder entries
 * here to change resolver behavior without rewriting the function below.
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

  // 1. Obvious — exact match.
  if (partnerGuess === selfAnswer) {
    return "obvious";
  }

  // 2. Mirror Blind — engine + partner agree on a driver the subject
  //    explicitly denies seeing in themselves.
  if (
    enginePredicted !== null &&
    partnerGuess === enginePredicted &&
    selfAnswer !== enginePredicted &&
    selfKnows === false
  ) {
    return "mirror_blind";
  }

  // 3. Hidden Pattern — engine names a driver neither person picked.
  if (
    enginePredicted !== null &&
    selfAnswer !== enginePredicted &&
    partnerGuess !== enginePredicted
  ) {
    return "hidden_pattern";
  }

  // 4. Loving Misread — partner's guess is on a more generous option than
  //    the subject's actual self-read. Requires valence data on both
  //    options; if either is missing, fall through.
  const guessValence = lookupValence(options, partnerGuess);
  const selfValence = lookupValence(options, selfAnswer);
  if (
    guessValence !== null &&
    selfValence !== null &&
    VALENCE_RANK[guessValence] > VALENCE_RANK[selfValence]
  ) {
    return "loving_misread";
  }

  // 5. Oblivious — any remaining mismatch.
  return "oblivious";
}
