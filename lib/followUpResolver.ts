// CC-126 — Follow-up resolver.
//
// `resolveFollowUps(sessionKey, constitution, answers)`:
//   - If a hand-authored set is keyed in `data/cohortFollowUps.ts` for
//     `sessionKey`, return it verbatim (override path).
//   - Else, run the CC-125 deterministic generator against the
//     constitution + answers.
//
// **sessionKey convention:** canonical lowercase first name. See the
// rationale in `data/cohortFollowUps.ts`. The API route passes the
// session's `demographics.name_value` (if available) as the key; an
// empty / missing name falls through to the generator path.

import type { Answer, InnerConstitution } from "./types";
import {
  buildFollowUpInput,
  generateFollowUpQuestions,
  type FollowUpQuestionSet,
} from "./followUpQuestions";
import { cohortFollowUpForName } from "../data/cohortFollowUps";

/**
 * Resolve a follow-up question set for a session.
 *
 * @param sessionKey  Canonical lowercase first name (or any identifier
 *                    keyed in the cohort override map). Pass null/empty
 *                    to skip the override and go straight to the
 *                    generator.
 * @param constitution The session's current `InnerConstitution`.
 * @param answers      The session's `Answer[]`. Needed by the adapter
 *                     for state-load + currentMode derivation.
 * @param personName   The display name to thread into the set (defaults
 *                     to "You" inside the generator path).
 */
export function resolveFollowUps(
  sessionKey: string | null | undefined,
  constitution: InnerConstitution,
  answers: Answer[],
  personName: string = "You"
): FollowUpQuestionSet {
  const override = cohortFollowUpForName(sessionKey);
  if (override) return override;
  const input = buildFollowUpInput(constitution, answers, personName);
  return generateFollowUpQuestions(input);
}
