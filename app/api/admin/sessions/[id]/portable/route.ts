// CC-153 — GET /api/admin/sessions/[id]/portable
//
// Returns the session's portable JSON (answers + demographics + skipped
// IDs + meta signals + contact fields). Round-trips into
// /admin/sessions/import (creates a NEW session row).
//
// The response is an attachment so an `<a download>` link triggers a
// file save rather than a navigation. The filename is built from the
// demographics row (name + saved_at date) when available; falls back to
// the bare session id.

import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import {
  demographics as demographicsTable,
  sessions as sessionsTable,
} from "../../../../../../db/schema";
import {
  buildPortableSession,
  type PortableSession,
} from "../../../../../../lib/sessionPortable";
import type {
  Answer,
  DemographicAnswer,
  MetaSignal,
} from "../../../../../../lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let db;
  try {
    db = getDb();
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Database connection failed." },
      { status: 500 }
    );
  }

  const sessionRows = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, id))
    .limit(1);
  if (sessionRows.length === 0) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }
  const session = sessionRows[0];

  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, id))
    .limit(1);
  const demo = demoRows[0] ?? null;

  // Re-hydrate the DemographicAnswer[] view from the row's per-field
  // columns. Mirrors the inverse of `buildDemographicsRow` in
  // `lib/saveSession.ts`. `not_answered` rows are emitted so the import
  // re-creates the same state shape (vs. silently dropping fields).
  const demographicsList: DemographicAnswer[] = demo
    ? rowToDemographicAnswers(demo)
    : [];

  const portable: PortableSession = buildPortableSession({
    answers: (session.answers ?? []) as Answer[],
    skippedQuestionIds: (session.skipped_question_ids ?? []) as string[],
    metaSignals: (session.meta_signals ?? []) as MetaSignal[],
    demographics: demographicsList,
    contactEmail: demo?.contact_email ?? null,
    contactMobile: demo?.contact_mobile ?? null,
  });

  const json = JSON.stringify(portable, null, 2);
  const filename = buildFilename(demo, session.created_at, id);

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────

type DemoRow = typeof demographicsTable.$inferSelect;

function rowToDemographicAnswers(row: DemoRow): DemographicAnswer[] {
  const out: DemographicAnswer[] = [];
  const push = (
    field_id: string,
    state: DemographicAnswer["state"],
    value: string | null
  ) => {
    if (state === "specified" && value) {
      out.push({ field_id, state, value });
    } else {
      out.push({ field_id, state });
    }
  };

  push("name", row.name_state, row.name_value);
  push("gender", row.gender_state, row.gender_value);
  push("age", row.age_state, row.age_decade);

  // Location collapses (country, region) back into "country | region".
  // Matches `buildDemographicsRow`'s round-trip.
  if (row.location_state === "specified") {
    const parts = [row.location_country, row.location_region].filter(
      (s): s is string => !!s
    );
    out.push({
      field_id: "location",
      state: "specified",
      value: parts.join(" | "),
    });
  } else {
    out.push({ field_id: "location", state: row.location_state });
  }

  push("marital_status", row.marital_status_state, row.marital_status_value);
  push("education", row.education_state, row.education_value);
  push("political", row.political_state, row.political_value);
  push("religious", row.religious_state, row.religious_value);
  push("profession", row.profession_state, row.profession_value);
  return out;
}

function buildFilename(
  demo: DemoRow | null,
  savedAt: Date | null,
  fallbackId: string
): string {
  const stem =
    demo?.name_state === "specified" && demo.name_value
      ? slugify(demo.name_value)
      : fallbackId;
  const datePart = savedAt
    ? new Date(savedAt).toISOString().slice(0, 10)
    : "undated";
  return `${stem}-${datePart}-portable.json`;
}

function slugify(s: string): string {
  return (
    s
      .normalize("NFKD")
      .toLowerCase()
      // strip combining marks via category range
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "session"
  );
}
