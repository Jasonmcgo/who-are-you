// CC-COUPLE-1 — Couple module types.
//
// Game tuple shape for Obvious-or-Oblivious (Mode 1) per
// docs/couple-module-mvp-spec.md §3. Stored as JSONB on
// `couple_sessions.game_results`, never merged into either partner's
// `sessions.answers`.
//
// `sourceSignal` is load-bearing: it ties each item back to an engine signal
// (e.g. love_register, grip_pattern, ns_valence) so partner-guess disagreements
// can later feed the calibration/accuracy surface (CC-COUPLE-5).

import type { InnerConstitution } from "./types";

export type CoupleGameDirection = "a_guesses_b" | "b_guesses_a";

export interface CoupleGameItem {
  itemId: string;
  direction: CoupleGameDirection;
  selfAnswer: string;
  partnerGuess: string;
  selfKnows?: boolean;
  sourceSignal: string;
}

export interface CoupleGameResults {
  items: CoupleGameItem[];
  playedAt: string;
}

export type CoupleSessionStatus = "invited" | "b_joined" | "completed";

export const COUPLE_SESSION_STATUS: Record<
  Uppercase<CoupleSessionStatus>,
  CoupleSessionStatus
> = {
  INVITED: "invited",
  B_JOINED: "b_joined",
  COMPLETED: "completed",
};

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-2 — game item bank + reveal-resolver types.
// ─────────────────────────────────────────────────────────────────────

export type RevealType =
  | "obvious"
  | "oblivious"
  | "mirror_blind"
  | "hidden_pattern"
  | "loving_misread";

export type OptionValence = "generous" | "neutral" | "critical";

export interface CoupleGameOption {
  id: string;
  label: string;
  // CC-COUPLE-PRONOUN-FIX — partner-mode template for the same option.
  // Populated ONLY for options whose `label` contains "you/your/yourself"
  // referring to the BELOVED (the assessed partner). Uses the same role
  // tokens as `CoupleGameItemSpec.promptAboutPartner` ({S} / {S_pron} /
  // {S_obj} / {S_poss} / {S_refl}); the API resolves them through the
  // same substitution. Absent for options that already read correctly
  // about a third person (abstract nouns, guesser-referring "you", and
  // quoted direct-address compliments).
  labelAboutPartner?: string;
  // Present only on items where a generous/critical reading genuinely
  // exists (e.g. `grip_costs_you`, `the_thing_i_call_helping`). Absent
  // when all options are the same valence — Loving Misread requires a
  // valence delta to fire.
  valence?: OptionValence;
  // Which engine signal this specific option expresses, if any. Optional;
  // present for the items where the option-level mapping is clean.
  signalTag?: string;
}

export interface CoupleGameItemSpec {
  itemId: string;
  // Self-answer form — first-person ("When you are under pressure…"). Used by
  // the symmetric self-pass (Phase 3). NOT the string rendered to the
  // guessing partner; see `promptAboutPartner` below.
  prompt: string;
  // CC-COUPLE-6 — guess-about-subject template. Authored with explicit
  // role tokens so subject vs guesser references never collide:
  //   {S}      → subject first name (or "your partner" when no name on file)
  //   {S_pron} → she / he / they
  //   {S_poss} → her / his / their
  //   {S_refl} → herself / himself / themselves
  // Guesser refs are literal "you" / "your" — never substituted.
  // The server (`/api/couple/[token]/route.ts`) resolves these into the
  // final string before shipping to the client; the client only renders.
  promptAboutPartner: string;
  options: CoupleGameOption[];
  // Engine signal this whole item maps to. Load-bearing for CC-COUPLE-5
  // calibration: disagreements on items tagged to a fragile signal are
  // training examples for that signal's typing accuracy.
  sourceSignal: string;
  // Returns the option id the engine expects for this subject, or null when
  // the engine has no confident prediction for this item. Pure read of
  // individual output — no I/O, no mutation. Honest nulls beat invented
  // mappings: when an item has no defensible engine projection, predict
  // returns null and the resolver correctly routes mismatches to
  // Oblivious / Loving Misread (never to a fabricated Mirror Blind /
  // Hidden Pattern).
  predict: (ic: InnerConstitution) => string | null;
}

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-8 — Two-direction results bundle.
//
// When both partners are assessed (Mode 2), the bond stores one
// `CoupleGameResults` per direction. The stored shape on
// `couple_sessions.game_results` is one of:
//
//   - Legacy bare CoupleGameResults (Mode 1 from CC-COUPLE-1/3/4 — the
//     bundle key was implicit "b_guesses_a"). New writes don't produce
//     this shape, but existing completed bonds in dev/prod have it.
//   - CoupleGameResultsBundle (Mode 2 + new Mode 1 writes): either or
//     both direction keys populated.
//
// Readers normalize via `normalizeGameResultsBundle` so the reveal /
// compare layer only ever sees the bundle shape.
// ─────────────────────────────────────────────────────────────────────

export interface CoupleGameResultsBundle {
  a_guesses_b?: CoupleGameResults;
  b_guesses_a?: CoupleGameResults;
}

export function isCoupleGameResultsBundle(
  value: unknown
): value is CoupleGameResultsBundle {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  // A bundle is recognized by having direction keys at the top level
  // (legacy bare CoupleGameResults has `items` + `playedAt`, not these).
  if (!("a_guesses_b" in v) && !("b_guesses_a" in v)) return false;
  if (v.a_guesses_b !== undefined && !isCoupleGameResults(v.a_guesses_b)) {
    return false;
  }
  if (v.b_guesses_a !== undefined && !isCoupleGameResults(v.b_guesses_a)) {
    return false;
  }
  return true;
}

/**
 * Normalize `couple_sessions.game_results` (which may be null, a legacy
 * bare `CoupleGameResults`, or a `CoupleGameResultsBundle`) into the
 * bundle shape. Legacy bare maps to `{ b_guesses_a: bare }` — Mode 1's
 * implicit direction.
 *
 * Returns null only when the input is null/undefined or completely
 * unrecognized. The reveal layer treats null as "no completed
 * directions yet" (intro state).
 */
export function normalizeGameResultsBundle(
  raw: unknown
): CoupleGameResultsBundle | null {
  if (raw === null || raw === undefined) return null;
  if (isCoupleGameResultsBundle(raw)) return raw;
  if (isCoupleGameResults(raw)) {
    // Legacy bare CoupleGameResults — wrap into the implicit b_guesses_a
    // slot so the reveal layer's per-direction code path works.
    return { b_guesses_a: raw };
  }
  return null;
}

export function isCoupleGameResults(value: unknown): value is CoupleGameResults {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.playedAt !== "string") return false;
  if (!Array.isArray(v.items)) return false;
  for (const raw of v.items) {
    if (!raw || typeof raw !== "object") return false;
    const item = raw as Record<string, unknown>;
    if (typeof item.itemId !== "string") return false;
    if (item.direction !== "a_guesses_b" && item.direction !== "b_guesses_a") {
      return false;
    }
    if (typeof item.selfAnswer !== "string") return false;
    if (typeof item.partnerGuess !== "string") return false;
    if (typeof item.sourceSignal !== "string") return false;
    if (item.selfKnows !== undefined && typeof item.selfKnows !== "boolean") {
      return false;
    }
  }
  return true;
}
