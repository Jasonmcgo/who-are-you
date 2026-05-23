// CC-126 — Missing-question diff.
//
// Returns the question_ids (and full Question objects) from the current
// `data/questions.ts` bank that are NOT present in a session's `answers[]`.
// Excludes derived questions whose parent rankings haven't been answered
// (the derived question can't be presented to the user until its parents
// exist).
//
// Used by the follow-up flow's GET endpoint to populate the "gap-fill"
// section of the public answer page. Gap-fill answers are first-class
// `data/questions.ts` answers; the engine consumes them through the
// normal `signalsFromRankingAnswer` / `signalFromAnswer` paths once
// merged back via the POST handler. (Follow-up answers — distinct from
// gap-fill — carry inline signals; see `lib/followUpResolver.ts`.)

import { questions } from "../data/questions";
import type { Answer, Question } from "./types";

/**
 * Return the `question_id`s from the canonical bank that the session
 * has not answered. Results are returned in bank order. Derived
 * questions (multi-select / derived-ranking) are skipped when their
 * declared parent question(s) have no answer — they can't be rendered
 * without parent ranking content.
 */
export function missingQuestionIds(answers: Answer[]): string[] {
  const answered = new Set(answers.map((a) => a.question_id));
  const result: string[] = [];
  for (const q of questions) {
    if (answered.has(q.question_id)) continue;
    if (!isReady(q, answered)) continue;
    result.push(q.question_id);
  }
  return result;
}

/**
 * Full `Question` objects for the unanswered set — same ordering as
 * `missingQuestionIds`. The UI consumes this to render the gap-fill
 * section of the follow-up page.
 */
export function missingQuestions(answers: Answer[]): Question[] {
  const answered = new Set(answers.map((a) => a.question_id));
  const result: Question[] = [];
  for (const q of questions) {
    if (answered.has(q.question_id)) continue;
    if (!isReady(q, answered)) continue;
    result.push(q);
  }
  return result;
}

/**
 * A question is "ready" to ask iff all of its declared dependencies
 * are answered (or it has none). Derived rankings + multi-select
 * derived questions declare their parents via `derived_from`. Other
 * question types have no dependencies.
 */
function isReady(q: Question, answered: Set<string>): boolean {
  if (q.type === "ranking_derived" || q.type === "multiselect_derived") {
    const parents = q.derived_from ?? [];
    for (const p of parents) {
      if (!answered.has(p)) return false;
    }
  }
  return true;
}
