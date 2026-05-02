// CC-021a — GET /api/admin/sessions — list all saved sessions, with derived
// columns surfaced for the table view (lens dominant, top compass value,
// allocation tension count, attachments count). Filter / sort happen
// server-side; the page reads the response as a flat array.
//
// Querying strategy: we issue three queries (sessions LEFT JOIN
// demographics, then a COUNT(*) GROUP BY for attachments). We deliberately
// do NOT push lens/compass/posture filters into SQL — those values live
// inside the inner_constitution JSONB and the dataset is small enough that
// in-Node filtering is the simpler architecture for a single-user tool.
// Cloud-scale would warrant GIN indexes or a denormalized columns layer;
// flagged in CC-021a's report risks list.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  attachments as attachmentsTable,
  demographics as demographicsTable,
  sessions as sessionsTable,
} from "../../../../db/schema";
import type {
  CognitiveFunctionId,
  EpistemicPosture,
  InnerConstitution,
  SessionSummary,
} from "../../../../lib/types";

const ALLOCATION_TENSION_IDS = new Set(["T-013", "T-014", "T-015"]);

const COMPASS_SACRED_IDS = new Set([
  "truth_priority",
  "freedom_priority",
  "loyalty_priority",
  "justice_priority",
  "faith_priority",
  "stability_priority",
  "knowledge_priority",
  "family_priority",
]);

function deriveTopCompassSignalId(ic: InnerConstitution): string | null {
  // Mirrors the engine's getTopCompassValues idea: the highest-rank Sacred
  // signal across the user's signal set. We don't need the full rank-aware
  // tie-breaker logic for a flat table — first-by-rank is sufficient for
  // sorting and filtering.
  let bestRank = Number.POSITIVE_INFINITY;
  let best: string | null = null;
  for (const s of ic.signals) {
    if (!COMPASS_SACRED_IDS.has(s.signal_id)) continue;
    const r = s.rank ?? 99;
    if (r < bestRank) {
      bestRank = r;
      best = s.signal_id;
    }
  }
  return best;
}

function countAllocationTensions(ic: InnerConstitution): number {
  return ic.tensions.filter((t) => ALLOCATION_TENSION_IDS.has(t.tension_id))
    .length;
}

type SortKey =
  | "saved_at"
  | "name"
  | "age"
  | "profession"
  | "gender"
  | "lens"
  | "compass"
  | "conviction"
  | "allocations"
  | "attachments";

const VALID_SORT_KEYS = new Set<SortKey>([
  "saved_at",
  "name",
  "age",
  "profession",
  "gender",
  "lens",
  "compass",
  "conviction",
  "allocations",
  "attachments",
]);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("name")?.trim().toLowerCase() ?? "";
  const profession = url.searchParams.get("profession") ?? "";
  const lens = url.searchParams.get("lens") ?? "";
  const compass = url.searchParams.get("compass") ?? "";
  const sortParam = url.searchParams.get("sort") ?? "saved_at";
  const sort: SortKey = VALID_SORT_KEYS.has(sortParam as SortKey)
    ? (sortParam as SortKey)
    : "saved_at";
  const dir = url.searchParams.get("dir") === "asc" ? "asc" : "desc";

  let db;
  try {
    db = getDb();
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Database connection failed.",
      },
      { status: 500 }
    );
  }

  // 1) sessions LEFT JOIN demographics — one row per session.
  const rows = await db
    .select({
      id: sessionsTable.id,
      saved_at: sessionsTable.created_at,
      inner_constitution: sessionsTable.inner_constitution,
      name_state: demographicsTable.name_state,
      name_value: demographicsTable.name_value,
      age_state: demographicsTable.age_state,
      age_decade: demographicsTable.age_decade,
      profession_state: demographicsTable.profession_state,
      profession_value: demographicsTable.profession_value,
      gender_state: demographicsTable.gender_state,
      gender_value: demographicsTable.gender_value,
    })
    .from(sessionsTable)
    .leftJoin(
      demographicsTable,
      eq(demographicsTable.session_id, sessionsTable.id)
    );

  // 2) Counts per session_id.
  const counts = await db
    .select({
      session_id: attachmentsTable.session_id,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(attachmentsTable)
    .groupBy(attachmentsTable.session_id);
  const countBySession = new Map<string, number>();
  for (const c of counts) countBySession.set(c.session_id, c.count);

  // 3) Project to SessionSummary shape with derived columns.
  let summaries: SessionSummary[] = rows.map((r) => {
    const ic = r.inner_constitution as InnerConstitution;
    return {
      id: r.id,
      saved_at: r.saved_at.toISOString(),
      name_state: (r.name_state ?? "not_answered") as SessionSummary["name_state"],
      name_value: r.name_value,
      age_state: (r.age_state ?? "not_answered") as SessionSummary["age_state"],
      age_decade: r.age_decade,
      profession_state:
        (r.profession_state ?? "not_answered") as SessionSummary["profession_state"],
      profession_value: r.profession_value,
      gender_state:
        (r.gender_state ?? "not_answered") as SessionSummary["gender_state"],
      gender_value: r.gender_value,
      dominant_function: (ic.lens_stack?.dominant ?? null) as
        | CognitiveFunctionId
        | null,
      top_compass: deriveTopCompassSignalId(ic),
      conviction_posture:
        (ic.belief_under_tension?.epistemic_posture ?? null) as
          | EpistemicPosture
          | null,
      allocation_tensions_count: countAllocationTensions(ic),
      attachments_count: countBySession.get(r.id) ?? 0,
    };
  });

  // 4) In-Node filtering.
  if (search) {
    summaries = summaries.filter((s) =>
      (s.name_value ?? "").toLowerCase().includes(search)
    );
  }
  if (profession) {
    summaries = summaries.filter((s) => s.profession_value === profession);
  }
  if (lens) {
    summaries = summaries.filter((s) => s.dominant_function === lens);
  }
  if (compass) {
    summaries = summaries.filter((s) => s.top_compass === compass);
  }

  // 5) In-Node sort.
  summaries.sort((a, b) => cmp(a, b, sort, dir));

  return NextResponse.json({ sessions: summaries });
}

function cmp(
  a: SessionSummary,
  b: SessionSummary,
  key: SortKey,
  dir: "asc" | "desc"
): number {
  const sign = dir === "asc" ? 1 : -1;
  switch (key) {
    case "saved_at":
      return sign * (Date.parse(a.saved_at) - Date.parse(b.saved_at));
    case "name":
      return sign * compareNullable(a.name_value, b.name_value);
    case "age":
      return sign * compareNullable(a.age_decade, b.age_decade);
    case "profession":
      return sign * compareNullable(a.profession_value, b.profession_value);
    case "gender":
      return sign * compareNullable(a.gender_value, b.gender_value);
    case "lens":
      return sign * compareNullable(a.dominant_function, b.dominant_function);
    case "compass":
      return sign * compareNullable(a.top_compass, b.top_compass);
    case "conviction":
      return sign * compareNullable(a.conviction_posture, b.conviction_posture);
    case "allocations":
      return sign * (a.allocation_tensions_count - b.allocation_tensions_count);
    case "attachments":
      return sign * (a.attachments_count - b.attachments_count);
  }
}

function compareNullable(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b);
}
