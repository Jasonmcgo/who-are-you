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
  // Second-person prompt — rendered as either "When you are under pressure…"
  // (self answer) or "When your partner is under pressure…" (guess) by the
  // CC-COUPLE-3 UI layer.
  prompt: string;
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
