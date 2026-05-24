// CC-136 Part A — answer-history archive helpers.
//
// Thin typed wrapper over the `answer_history` table. The CC's reset
// flow (`resetSessionAnswer`) calls `archiveAnswers` BEFORE removing
// the live answer(s) from `sessions.answers` — so a Reset never causes
// data loss.
//
// Architecture: append-only. The archive is the source of truth for
// "what did the user say at this past point in time, before we asked
// again." CC-136 itself does NOT read this archive in derivation — the
// engine continues to consume only `sessions.answers`. CC-137 will be
// the layer that surfaces longitudinal deltas + versioned "passes"
// from this store.

import type { PgTransaction } from "drizzle-orm/pg-core";
import { answerHistory } from "../db/schema";
import { getDb } from "../db";
import type { Answer } from "./types";

export type ArchiveReason =
  | "admin_reset"
  | "cascade_reset"
  | "rebalance_recollect"
  | "periodic_remeasure";

// ─────────────────────────────────────────────────────────────────────
// CC-136 Part D — "always-collect" hook (STUBBED — flagged)
// ─────────────────────────────────────────────────────────────────────
//
// **Status: STUB.** The CC permits stubbing this hook if wiring it
// adds meaningful complexity, which it does — the follow-up route
// (`app/api/follow-up/[token]/route.ts`) is in CC-134's Part D edit
// scope, and threading an `alwaysCollect` set through `missing
// Questions` ∪ `alwaysCollect` reshapes the route's response contract.
// To keep CC-136 admin-only and not collide with CC-134, the
// always-collect constant is defined here as the future hook surface
// but is NOT yet consulted by the route.
//
// **Future wiring (one-line, when CC-134 has landed):** in the
// follow-up route's GET handler, after the `missingQuestions(answers)`
// call, union in the `ALWAYS_COLLECT_QUESTION_IDS` entries by mapping
// them through the bank's `questions` array and merging into the
// returned `missingQuestions` set. Re-collected entries flow into
// `answers[]` via the existing POST path; the prior values get
// archived here via `archiveAnswers` with reason
// `"rebalance_recollect"` or `"periodic_remeasure"` as appropriate.
//
// **Default: empty.** No question is force-collected on every link.
// Owner can append `question_id`s here when a re-collection campaign
// is intentional (CC-135's rebalanced Q-T1–T4 are the prototype
// candidates).
export const ALWAYS_COLLECT_QUESTION_IDS: readonly string[] = [
  // Example (commented out — owner enables when ready):
  // "Q-T1", "Q-T2", "Q-T3", "Q-T4",   // CC-135 N/S item rebalance re-collect
];

export interface ArchiveEntry {
  questionId: string;
  answer: Answer;
  reason: ArchiveReason;
}

type DrizzleClient = ReturnType<typeof getDb>;
// Drizzle's transaction handle is structurally compatible with the
// top-level client for the `.insert(...)` surface we use here; pass
// either as `client`.
type ClientOrTx = DrizzleClient | PgTransaction<any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Insert one row per entry into `answer_history`. Pure I/O — caller is
 * responsible for ordering this BEFORE the corresponding removal from
 * `sessions.answers` so a crash mid-reset can't lose user data.
 *
 * The `client` parameter accepts either the top-level db handle or a
 * transaction handle; `resetSessionAnswer` calls this inside a
 * transaction so the archive + the sessions.answers removal land
 * atomically.
 */
export async function archiveAnswers(
  client: ClientOrTx,
  sessionId: string,
  entries: ArchiveEntry[]
): Promise<void> {
  if (entries.length === 0) return;
  await client.insert(answerHistory).values(
    entries.map((e) => ({
      session_id: sessionId,
      question_id: e.questionId,
      answer: e.answer as unknown as object,
      reason: e.reason,
    }))
  );
}
