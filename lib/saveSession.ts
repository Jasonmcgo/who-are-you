"use server";

// CC-019 — Server action for the opt-in Save flow. Writes a `sessions` row
// and a linked `demographics` row inside a single Drizzle transaction. The
// "use server" directive marks this module as server-only — Next.js will
// not bundle it onto the client. Callers in client components invoke it
// over Next's RPC bridge as if it were a regular async function.
//
// Lazy DB init via getDb() (see db/index.ts) — the connection only opens
// when this action actually runs, so the dev server boots cleanly when
// DATABASE_URL is unset.

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { sessions, demographics } from "../db/schema";
import type {
  Answer,
  BeliefUnderTension,
  DemographicAnswer,
  InnerConstitution,
  MetaSignal,
} from "./types";

type SaveSessionArgs = {
  answers: Answer[];
  innerConstitution: InnerConstitution;
  skippedQuestionIds: string[];
  metaSignals: MetaSignal[];
  allocationOverlays?: InnerConstitution["allocation_overlays"];
  beliefUnderTension?: BeliefUnderTension | null;
  demographicAnswers: DemographicAnswer[];
  // CC-HEADER-NAV-AND-EMAIL-GATE — contact fields. `contactEmail` is
  // required at the client gate; passed null when an older caller
  // omits it (existing flows continue to work without modification).
  contactEmail?: string | null;
  contactMobile?: string | null;
};

export async function saveSession(
  args: SaveSessionArgs
): Promise<{ sessionId: string }> {
  const db = getDb();
  return await db.transaction(async (tx) => {
    const [session] = await tx
      .insert(sessions)
      .values({
        answers: args.answers,
        inner_constitution: args.innerConstitution,
        skipped_question_ids: args.skippedQuestionIds,
        meta_signals: args.metaSignals,
        allocation_overlays: args.allocationOverlays ?? null,
        belief_under_tension: args.beliefUnderTension ?? null,
      })
      .returning({ id: sessions.id });

    const demoRow = buildDemographicsRow(session.id, args.demographicAnswers);
    // CC-HEADER-NAV-AND-EMAIL-GATE — contact fields live in the same
    // demographics row. Email is required at the UI gate; mobile is
    // optional. Both stored raw.
    demoRow.contact_email = args.contactEmail ?? null;
    demoRow.contact_mobile = args.contactMobile ?? null;
    await tx.insert(demographics).values(demoRow);

    return { sessionId: session.id };
  });
}

// ── buildDemographicsRow ────────────────────────────────────────────────
//
// Walks the answer list, sets the appropriate (value, state) columns per
// field_id. Unspecified fields default to ("", "not_answered"). The "other"
// case folds the user's other_text into the value column with an "Other:"
// prefix so the raw value is parseable in pgAdmin without joining against
// the field-definition table. Location is special-cased — it's a two-part
// freeform (country + region) joined by a delimiter in the value string;
// the renderer is responsible for splitting on display.

type DemographicsRow = typeof demographics.$inferInsert;

function buildDemographicsRow(
  sessionId: string,
  answers: DemographicAnswer[]
): DemographicsRow {
  const row: DemographicsRow = {
    session_id: sessionId,
  };
  for (const a of answers) {
    const valueForCol = renderValue(a);
    switch (a.field_id) {
      case "name":
        row.name_value = valueForCol;
        row.name_state = a.state;
        break;
      case "gender":
        row.gender_value = valueForCol;
        row.gender_state = a.state;
        break;
      case "age":
        row.age_decade = valueForCol;
        row.age_state = a.state;
        break;
      case "location": {
        // Location values come in as "country" or "country | region". Split
        // for storage; the renderer joins them back via the same delimiter
        // when reading from the DB.
        if (a.state === "specified" && a.value) {
          const [country, ...rest] = a.value.split("|").map((s) => s.trim());
          row.location_country = country || null;
          row.location_region = rest.length > 0 ? rest.join(" | ") : null;
        }
        row.location_state = a.state;
        break;
      }
      case "marital_status":
        row.marital_status_value = valueForCol;
        row.marital_status_state = a.state;
        break;
      case "education":
        row.education_value = valueForCol;
        row.education_state = a.state;
        break;
      case "political":
        row.political_value = valueForCol;
        row.political_state = a.state;
        break;
      case "religious":
        row.religious_value = valueForCol;
        row.religious_state = a.state;
        break;
      case "profession":
        row.profession_value = valueForCol;
        row.profession_state = a.state;
        break;
      // Unknown field_id — silently skip; row defaults handle the gap.
      default:
        break;
    }
  }
  return row;
}

function renderValue(a: DemographicAnswer): string | null {
  if (a.state !== "specified") return null;
  if (!a.value) return null;
  if (a.other_text && a.other_text.trim().length > 0) {
    return `Other: ${a.other_text.trim()}`;
  }
  return a.value;
}

// CC-053 — Admin answer review/edit. Updates a single answer within a saved
// session's `answers` JSONB column. Existing entries with matching
// `question_id` are replaced; entries without a match are appended (e.g.,
// admin updates a question the user originally skipped). The session's
// `inner_constitution` snapshot is intentionally NOT updated here — per
// CODEX-050's pattern, admin views re-derive on each load against the
// updated answer set, so the snapshot stays as the historical user-facing
// version.
//
// Server-action shape mirrors `saveSession`: callable from client
// components via Next.js's RPC bridge. No auth check inside the function
// itself — the `/admin` route is already gated, and admin-only API routes
// call this from server-only contexts.

export async function updateSessionAnswer(
  sessionId: string,
  questionId: string,
  newAnswer: Answer
): Promise<{ ok: true }> {
  const db = getDb();
  const rows = await db
    .select({ answers: sessions.answers })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (rows.length === 0) {
    throw new Error(`Session ${sessionId} not found`);
  }
  const existing = (rows[0].answers ?? []) as Answer[];
  const matched = existing.some((a) => a.question_id === questionId);
  const updated: Answer[] = matched
    ? existing.map((a) => (a.question_id === questionId ? newAnswer : a))
    : [...existing, newAnswer];

  await db
    .update(sessions)
    .set({ answers: updated, updated_at: new Date() })
    .where(eq(sessions.id, sessionId));

  return { ok: true };
}
