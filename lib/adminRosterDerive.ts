// CC-169 — admin roster per-row constitution resolver. The roster
// summary in `app/admin/sessions/page.tsx` (server component) and
// `app/api/admin/sessions/route.ts` (API) both projected derived
// columns straight off the stored `inner_constitution` JSONB. The
// report page (`/report/[sessionId]`) re-derives via the stale-shape
// detector when the stored blob has drifted, so when a session's
// typing changed after the original save (follow-up clarifiers,
// engine improvements) the report's lead function disagreed with the
// roster's. Michele (Fe room-reader) and Ashley (Se present-tense)
// were the visible cases — both had follow-ups that re-typed them.
//
// This helper centralizes the same three-branch resolution the report
// uses, so the two roster surfaces can call one function and never
// drift from each other. Pure render-layer change — no engine math,
// no schema, no migration.
//
// Demographics intentionally pass `null` here even though the report
// uses the row's demographics: the lead function is answer-driven, so
// the lens dominant matches regardless. If a future derived column
// turns out demographics-sensitive, thread the row's demographics
// through this helper then.

import { buildInnerConstitution } from "./identityEngine";
import { detectStaleShape } from "./staleShape";
import type { Answer, InnerConstitution } from "./types";

export interface RosterRowForDerive {
  id: string;
  inner_constitution: unknown;
  engine_shape_version: number | null;
  answers: unknown;
}

export function deriveRosterConstitution(
  row: RosterRowForDerive
): InnerConstitution {
  const answers = (row.answers ?? []) as Answer[];
  const verdict = detectStaleShape({
    sessionId: row.id,
    engineShapeVersion: row.engine_shape_version,
    innerConstitution: row.inner_constitution,
    answers,
  });
  if (verdict.branch === "fresh") {
    return verdict.constitution;
  }
  if (verdict.branch === "re-derivable") {
    try {
      // Matches the /report/[sessionId] re-derivable branch. See
      // header comment for why demographics is null here.
      return buildInnerConstitution(answers, [], null);
    } catch {
      // Defensive fallback — if re-derive throws on an exotic
      // answer set, fall back to the stored blob rather than
      // failing the whole roster query.
      return row.inner_constitution as InnerConstitution;
    }
  }
  // un-rerenderable — answers missing or empty. Use the stored
  // constitution as the best available read.
  return row.inner_constitution as InnerConstitution;
}
