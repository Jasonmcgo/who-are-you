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
import {
  sessions,
  demographics,
  ghostMappingAudit,
} from "../db/schema";
import { ENGINE_SHAPE_VERSION } from "./staleShape";
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
        // CC-STALE-SHAPE-DETECTOR — stamp the engine schema version
        // every new row was produced against. The render path's
        // `detectStaleShape` predicate reads this column and falls
        // into the re-derivable branch when it doesn't match
        // `ENGINE_SHAPE_VERSION`. NULL is reserved for pre-CC rows.
        engine_shape_version: ENGINE_SHAPE_VERSION,
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

// CC-DEMOGRAPHICS-SAVE-WIRING — ghost-mapping admin action. Upserts the
// demographics row for an existing session and writes a single audit-log
// entry capturing what was changed and who changed it.
//
// Idempotent — re-running for the same session updates the existing
// row rather than inserting a duplicate (the `demographics.session_id`
// column carries a unique constraint, so we explicitly upsert).
//
// Auth: the caller is the `/admin/sessions/ghost-mapping` page, which
// is already gated server-side; this action stays open the same way
// `updateSessionAnswer` does.

export interface AttachDemographicsToSessionArgs {
  sessionId: string;
  demographicAnswers: DemographicAnswer[];
  contactEmail: string | null;
  contactMobile: string | null;
  adminLabel: string;
  note?: string;
}

export async function attachDemographicsToSession(
  args: AttachDemographicsToSessionArgs
): Promise<{ ok: true; created: boolean }> {
  const db = getDb();
  return await db.transaction(async (tx) => {
    const existingRows = await tx
      .select({
        session_id: demographics.session_id,
        name_value: demographics.name_value,
        contact_email: demographics.contact_email,
        gender_value: demographics.gender_value,
        age_decade: demographics.age_decade,
        profession_value: demographics.profession_value,
      })
      .from(demographics)
      .where(eq(demographics.session_id, args.sessionId))
      .limit(1);
    const before = existingRows[0] ?? null;

    const demoRow = buildDemographicsRow(
      args.sessionId,
      args.demographicAnswers
    );
    demoRow.contact_email = args.contactEmail;
    demoRow.contact_mobile = args.contactMobile;

    let created = false;
    if (before === null) {
      await tx.insert(demographics).values(demoRow);
      created = true;
    } else {
      // Upsert via UPDATE — session_id stays unique. Only overwrite
      // columns the admin actually provided; defaults handle the gaps.
      await tx
        .update(demographics)
        .set({
          name_value: demoRow.name_value ?? before.name_value,
          name_state: demoRow.name_state ?? "specified",
          gender_value: demoRow.gender_value ?? before.gender_value,
          gender_state: demoRow.gender_state ?? "specified",
          age_decade: demoRow.age_decade ?? before.age_decade,
          age_state: demoRow.age_state ?? "specified",
          marital_status_value: demoRow.marital_status_value,
          marital_status_state: demoRow.marital_status_state ?? "not_answered",
          education_value: demoRow.education_value,
          education_state: demoRow.education_state ?? "not_answered",
          political_value: demoRow.political_value,
          political_state: demoRow.political_state ?? "not_answered",
          religious_value: demoRow.religious_value,
          religious_state: demoRow.religious_state ?? "not_answered",
          profession_value:
            demoRow.profession_value ?? before.profession_value,
          profession_state: demoRow.profession_state ?? "specified",
          location_country: demoRow.location_country,
          location_region: demoRow.location_region,
          location_state: demoRow.location_state ?? "not_answered",
          contact_email: demoRow.contact_email,
          contact_mobile: demoRow.contact_mobile,
        })
        .where(eq(demographics.session_id, args.sessionId));
    }

    await tx.insert(ghostMappingAudit).values({
      session_id: args.sessionId,
      admin_label: args.adminLabel,
      note: args.note ?? null,
      before_snapshot: before
        ? {
            name_value: before.name_value,
            contact_email: before.contact_email,
            gender_value: before.gender_value,
            age_decade: before.age_decade,
            profession_value: before.profession_value,
          }
        : null,
      after_snapshot: {
        name_value: demoRow.name_value ?? null,
        contact_email: demoRow.contact_email ?? null,
        gender_value: demoRow.gender_value ?? null,
        age_decade: demoRow.age_decade ?? null,
        profession_value: demoRow.profession_value ?? null,
      },
    });

    return { ok: true, created };
  });
}
