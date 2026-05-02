// CC-021a — GET /api/admin/sessions/[id] — full session detail. Returns
// the saved InnerConstitution, the demographics row (or null if no save
// included demographics), and the attachments list. The detail page reads
// this and renders the existing InnerConstitutionPage with the saved
// constitution.

import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getDb } from "../../../../../db";
import {
  attachments as attachmentsTable,
  demographics as demographicsTable,
  sessions as sessionsTable,
} from "../../../../../db/schema";
import type {
  Answer,
  Attachment,
  InnerConstitution,
  SessionDetail,
  SessionDetailDemographics,
} from "../../../../../lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let db;
  try {
    db = getDb();
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Database connection failed.",
      },
      { status: 500 }
    );
  }

  const sessionRows = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, id))
    .limit(1);
  if (sessionRows.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const session = sessionRows[0];

  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, id))
    .limit(1);
  const demoRow = demoRows[0];
  const demographics: SessionDetailDemographics | null = demoRow
    ? {
        name_state: demoRow.name_state,
        name_value: demoRow.name_value,
        gender_state: demoRow.gender_state,
        gender_value: demoRow.gender_value,
        age_state: demoRow.age_state,
        age_decade: demoRow.age_decade,
        location_state: demoRow.location_state,
        location_country: demoRow.location_country,
        location_region: demoRow.location_region,
        marital_status_state: demoRow.marital_status_state,
        marital_status_value: demoRow.marital_status_value,
        education_state: demoRow.education_state,
        education_value: demoRow.education_value,
        political_state: demoRow.political_state,
        political_value: demoRow.political_value,
        religious_state: demoRow.religious_state,
        religious_value: demoRow.religious_value,
        profession_state: demoRow.profession_state,
        profession_value: demoRow.profession_value,
      }
    : null;

  const attachmentRows = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.session_id, id))
    .orderBy(asc(attachmentsTable.uploaded_at));
  const attachments: Attachment[] = attachmentRows.map((a) => ({
    id: a.id,
    session_id: a.session_id,
    uploaded_at: a.uploaded_at.toISOString(),
    filename: a.filename,
    mime_type: a.mime_type,
    size_bytes: a.size_bytes,
    storage_path: a.storage_path,
    label: a.label,
    notes: a.notes,
  }));

  const detail: SessionDetail = {
    id: session.id,
    saved_at: session.created_at.toISOString(),
    inner_constitution: session.inner_constitution as InnerConstitution,
    // CC-022b — surface the saved Answer[] so the admin detail page can
    // feed the Keystone Reflection's selection-citation prose.
    answers: session.answers as Answer[],
    demographics,
    attachments,
  };

  return NextResponse.json(detail);
}
