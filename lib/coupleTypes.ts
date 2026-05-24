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
