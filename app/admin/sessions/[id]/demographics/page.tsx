// CC-087-ADMIN-DEMOGRAPHIC-EDIT — admin per-field demographic edit surface.
//
// Sibling to `/admin/sessions/[id]/answers`. Renders one row per
// demographic field (and the two contact fields), each with an EDIT
// button that swaps the row into an inline form. Saves call the
// `updateSessionDemographicField` server action, which writes one
// surgical (value, state) column-pair update and one `ghost_mapping_audit`
// entry per click.
//
// Server component because the page reads the demographics row + the
// session header (name display) directly from Postgres — no need to
// route through the existing /api/admin/sessions/[id] payload, whose
// `SessionDetailDemographics` type doesn't carry `contact_email` /
// `contact_mobile`. A direct DB query also keeps the page-load cost
// to a single SELECT per route hit.
//
// The client form receives the current snapshot as a prop, and re-fetches
// nothing — it relies on `router.refresh()` after each save so the next
// EDIT sees the freshly-persisted snapshot.
//
// Coexists with `/admin/sessions/ghost-mapping` (the standalone triage
// list); does NOT replace it. The triage list is still the fastest way
// to see "which sessions are anonymous"; this page is the per-session
// surgical edit surface.
//
// SECURITY POSTURE: same as the rest of `/admin/*` — the route is gated
// upstream. The `adminLabel` field in the form (free text) is the only
// "who" the audit log captures, matching the ghost-mapping page.

import Link from "next/link";
import { eq } from "drizzle-orm";

import { getDb } from "../../../../../db";
import {
  demographics as demographicsTable,
  sessions as sessionsTable,
} from "../../../../../db/schema";
import { DEMOGRAPHIC_FIELDS } from "../../../../../data/demographics";
import DemographicEditForm, { type DemographicsSnapshot } from "./DemographicEditForm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LoadResult =
  | { kind: "missing-id" }
  | { kind: "db-unavailable" }
  | { kind: "session-not-found" }
  | {
      kind: "ok";
      displayName: string;
      snapshot: DemographicsSnapshot;
    };

async function loadSnapshot(sessionId: string): Promise<LoadResult> {
  if (!UUID_RE.test(sessionId)) return { kind: "missing-id" };
  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return { kind: "db-unavailable" };
  }

  const sessionRows = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);
  if (sessionRows.length === 0) return { kind: "session-not-found" };

  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, sessionId))
    .limit(1);
  const row = demoRows[0] ?? null;

  const snapshot: DemographicsSnapshot = row
    ? {
        name: { state: row.name_state, value: row.name_value },
        gender: { state: row.gender_state, value: row.gender_value },
        age: { state: row.age_state, value: row.age_decade },
        location: {
          state: row.location_state,
          country: row.location_country,
          region: row.location_region,
        },
        marital_status: {
          state: row.marital_status_state,
          value: row.marital_status_value,
        },
        education: {
          state: row.education_state,
          value: row.education_value,
        },
        political: {
          state: row.political_state,
          value: row.political_value,
        },
        religious: {
          state: row.religious_state,
          value: row.religious_value,
        },
        profession: {
          state: row.profession_state,
          value: row.profession_value,
        },
        contact_email: row.contact_email,
        contact_mobile: row.contact_mobile,
      }
    : emptySnapshot();

  const displayName =
    row?.name_state === "specified" && row.name_value
      ? row.name_value
      : row?.name_state === "prefer_not_to_say"
      ? "Prefer not to say"
      : "Anonymous";

  return { kind: "ok", displayName, snapshot };
}

function emptySnapshot(): DemographicsSnapshot {
  return {
    name: { state: "not_answered", value: null },
    gender: { state: "not_answered", value: null },
    age: { state: "not_answered", value: null },
    location: { state: "not_answered", country: null, region: null },
    marital_status: { state: "not_answered", value: null },
    education: { state: "not_answered", value: null },
    political: { state: "not_answered", value: null },
    religious: { state: "not_answered", value: null },
    profession: { state: "not_answered", value: null },
    contact_email: null,
    contact_mobile: null,
  };
}

export default async function AdminDemographicsEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await loadSnapshot(id);

  if (result.kind !== "ok") {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <div
          className="flex flex-col items-center"
          style={{ gap: 12, maxWidth: 480, padding: 24, textAlign: "center" }}
        >
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            {result.kind === "session-not-found"
              ? "Session not found"
              : result.kind === "db-unavailable"
              ? "Database unavailable"
              : "Bad session id"}
          </p>
          <Link
            href="/admin/sessions"
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--umber)",
              textDecoration: "underline",
              marginTop: 8,
            }}
          >
            ← back to sessions
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <header
        className="flex flex-row items-center justify-between"
        style={{
          padding: "16px 28px",
          borderBottom: "1px solid var(--rule)",
          gap: 16,
        }}
      >
        <div className="flex flex-col" style={{ gap: 4 }}>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            Admin Demographic Edit · {result.displayName}
          </p>
          <p
            className="font-serif italic"
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              margin: 0,
            }}
          >
            per-field edits. Each save writes one demographics column-pair
            update and one ghost-mapping audit row.
          </p>
        </div>
        <Link
          href={`/admin/sessions/${id}`}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            textDecoration: "underline",
          }}
        >
          ← back to session detail
        </Link>
      </header>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "20px 28px 48px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <DemographicEditForm
          sessionId={id}
          initial={result.snapshot}
          fields={DEMOGRAPHIC_FIELDS}
        />
      </div>
    </main>
  );
}
