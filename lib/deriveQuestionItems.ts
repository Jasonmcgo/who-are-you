// CC-170 — Shared resolvers for derived-question item lists.
//
// Three question types in `data/questions.ts` resolve their items at
// render time from the user's prior answers:
//   - ranking_derived       (parents = ranking)         → top-N of each
//   - multiselect_derived   (parents = ranking)         → top-N per source
//   - binary_pick_derived   (parents = binary_pick)     → the two picks
//
// These resolvers used to live inside `app/assessment/page.tsx` as
// local helpers. They were extracted here so the public follow-up page
// (`app/follow-up/[token]/page.tsx`) can reuse the same resolution
// logic when re-presenting derived clarifiers against a session's
// stored parent answers — see CC-170 for the why.
//
// Pure functions: input = parent IDs + the session's `answers` array;
// output = the items list (or `null` when parents lack the data the
// derived question needs, which the caller treats as cascade-skip).

import { questions } from "../data/questions";
import type { Answer, RankingItem } from "./types";

// Item shape returned by `deriveItemsForMultiSelect`. Carries the
// `source_question_id` so the assessment / follow-up flows can store
// the parent attribution on the resulting MultiSelectDerivedAnswer's
// `selections[i].source_question_id`.
export type DerivedItem = {
  id: string;
  label: string;
  gloss?: string;
  signal: string;
  source_question_id: string;
};

// CC-016 — derive items for a `ranking_derived` question from the
// top-N of its parent answers. Returns null if any parent doesn't
// have enough items (cascade-skip should fire in that case).
export function deriveItemsForCrossRank(
  derivedQuestionId: string,
  derivedFrom: string[],
  topN: number,
  answers: Answer[]
): {
  items: RankingItem[];
  sources: { id: string; signal: string; source_question_id: string }[];
} | null {
  const items: RankingItem[] = [];
  const sources: { id: string; signal: string; source_question_id: string }[] =
    [];
  for (const parentId of derivedFrom) {
    const parentAnswer = answers.find(
      (a) => a.question_id === parentId && a.type === "ranking"
    );
    if (!parentAnswer || parentAnswer.type !== "ranking") return null;
    if (parentAnswer.order.length < topN) return null;
    const parentQuestion = questions.find((q) => q.question_id === parentId);
    if (!parentQuestion || parentQuestion.type !== "ranking") return null;
    for (let i = 0; i < topN; i++) {
      const itemId = parentAnswer.order[i];
      const parentItem = parentQuestion.items.find((it) => it.id === itemId);
      if (!parentItem) return null;
      // Namespace the id so collisions across parents don't clobber.
      const namespacedId = `${parentId}:${parentItem.id}`;
      items.push({
        id: namespacedId,
        label: parentItem.label,
        gloss: parentItem.gloss,
        signal: parentItem.signal,
      });
      sources.push({
        id: namespacedId,
        signal: parentItem.signal,
        source_question_id: parentId,
      });
    }
  }
  void derivedQuestionId;
  return { items, sources };
}

// CC-017 — derive items for a `multiselect_derived` question from the
// top-N of each parent ranking answer. Same shape as
// deriveItemsForCrossRank but returns null only when ALL parents lack
// data (Q-I2 / Q-I3 can render with just one parent's items per spec);
// per-parent partial availability is OK.
export function deriveItemsForMultiSelect(
  derivedFrom: string[],
  topN: number,
  answers: Answer[]
): DerivedItem[] | null {
  const items: DerivedItem[] = [];
  let anyParentHadData = false;
  for (const parentId of derivedFrom) {
    const parentAnswer = answers.find(
      (a) => a.question_id === parentId && a.type === "ranking"
    );
    if (!parentAnswer || parentAnswer.type !== "ranking") continue;
    if (parentAnswer.order.length === 0) continue;
    const parentQuestion = questions.find((q) => q.question_id === parentId);
    if (!parentQuestion || parentQuestion.type !== "ranking") continue;
    anyParentHadData = true;
    const take = Math.min(topN, parentAnswer.order.length);
    for (let i = 0; i < take; i++) {
      const itemId = parentAnswer.order[i];
      const parentItem = parentQuestion.items.find((it) => it.id === itemId);
      if (!parentItem) continue;
      items.push({
        id: `${parentId}:${parentItem.id}`,
        label: parentItem.label,
        gloss: parentItem.gloss,
        signal: parentItem.signal,
        source_question_id: parentId,
      });
    }
  }
  return anyParentHadData ? items : null;
}

// CC-170 — derive items for a `binary_pick_derived` question. The two
// items come from the user's prior `binary_pick` picks named in
// `derivedFrom`. Returns null when fewer than 2 parent picks resolve
// (cascade-skip parity with the assessment's inline gate).
export function deriveItemsForBinaryPick(
  derivedFrom: string[],
  answers: Answer[]
): RankingItem[] | null {
  const items: RankingItem[] = [];
  for (const parentId of derivedFrom) {
    const parentAnswer = answers.find((a) => a.question_id === parentId);
    if (!parentAnswer || parentAnswer.type !== "single_pick") continue;
    const parentQuestion = questions.find((q) => q.question_id === parentId);
    if (!parentQuestion || parentQuestion.type !== "binary_pick") continue;
    const chosen = parentQuestion.items.find(
      (it) => it.id === parentAnswer.picked_id
    );
    if (chosen) items.push(chosen);
  }
  if (items.length < 2) return null;
  return items;
}
