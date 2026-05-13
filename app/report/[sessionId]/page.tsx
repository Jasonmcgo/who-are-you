// CC-REPORT-PERMALINK — user-facing permalink route.
//
// Server component: fetches the saved session from Postgres by ID, then
// hands the data to the <ReportView /> client wrapper which holds the
// React state (confirmations / explainOpen) the InnerConstitutionPage
// requires. On miss (invalid sessionId, deleted row, malformed UUID,
// or DB unreachable) we render a friendly in-voice not-found page —
// NOT a 404 — so users who paste a bad link see something legible
// instead of a server-error chrome.
//
// SiteHeader auto-renders via `app/layout.tsx` (no per-route wiring).
//
// The `/api/report-cards` LLM-rewrite chain runs from inside the
// InnerConstitutionPage useEffect, identical to the assessment-flow
// render. Engine prose is the immediate render; LLM augments swap in
// silently when the fetch resolves.

import Link from "next/link";
import { eq } from "drizzle-orm";

import { getDb } from "../../../db";
import { sessions as sessionsTable, demographics as demographicsTable } from "../../../db/schema";
import type {
  Answer,
  DemographicAnswer,
  DemographicSet,
  InnerConstitution,
  MetaSignal,
} from "../../../lib/types";
import ReportView from "./ReportView";

// UUID v4 canonical shape — the saved session IDs are uuid().defaultRandom()
// per db/schema.ts, so we reject anything that isn't UUID-shaped before
// touching the DB.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DemographicsRow = {
  name_state: DemographicAnswer["state"];
  name_value: string | null;
  gender_state: DemographicAnswer["state"];
  gender_value: string | null;
  age_state: DemographicAnswer["state"];
  age_decade: string | null;
  location_state: DemographicAnswer["state"];
  location_country: string | null;
  location_region: string | null;
  marital_status_state: DemographicAnswer["state"];
  marital_status_value: string | null;
  education_state: DemographicAnswer["state"];
  education_value: string | null;
  political_state: DemographicAnswer["state"];
  political_value: string | null;
  religious_state: DemographicAnswer["state"];
  religious_value: string | null;
  profession_state: DemographicAnswer["state"];
  profession_value: string | null;
};

// Mirrors `toDemographicSet` in app/admin/sessions/[id]/page.tsx. Kept
// inline (rather than imported) because admin's helper takes the API
// route's SessionDetailDemographics shape (which is one transformation
// removed from the DB row); here we already have the raw DB row, so the
// adapter is a touch simpler.
function rowToDemographicSet(row: DemographicsRow | null): DemographicSet | null {
  if (!row) return null;
  const answers: DemographicAnswer[] = [];
  function pushSimple(
    field_id: string,
    state: DemographicAnswer["state"],
    value: string | null
  ): void {
    if (state === "specified" && value) {
      answers.push({ field_id, state, value });
    } else if (state === "prefer_not_to_say") {
      answers.push({ field_id, state });
    } else {
      answers.push({ field_id, state: "not_answered" });
    }
  }
  pushSimple("name", row.name_state, row.name_value);
  pushSimple("gender", row.gender_state, row.gender_value);
  pushSimple("age", row.age_state, row.age_decade);
  const locValue =
    row.location_state === "specified"
      ? row.location_region
        ? `${row.location_country ?? ""} | ${row.location_region}`.trim()
        : row.location_country ?? null
      : null;
  pushSimple("location", row.location_state, locValue);
  pushSimple(
    "marital_status",
    row.marital_status_state,
    row.marital_status_value
  );
  pushSimple("education", row.education_state, row.education_value);
  pushSimple("political", row.political_state, row.political_value);
  pushSimple("religious", row.religious_state, row.religious_value);
  pushSimple("profession", row.profession_state, row.profession_value);
  return { answers };
}

type FetchedSession = {
  sessionId: string;
  constitution: InnerConstitution;
  answers: Answer[];
  demographics: DemographicSet | null;
  metaSignals: MetaSignal[];
  createdAt: Date;
};

async function fetchSession(
  sessionId: string
): Promise<FetchedSession | null> {
  if (!UUID_RE.test(sessionId)) return null;
  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    // DATABASE_URL missing — surface as not-found rather than 500.
    return null;
  }
  try {
    const sessionRows = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .limit(1);
    if (sessionRows.length === 0) return null;
    const row = sessionRows[0];
    const demoRows = await db
      .select()
      .from(demographicsTable)
      .where(eq(demographicsTable.session_id, sessionId))
      .limit(1);
    const demoRow = (demoRows[0] ?? null) as DemographicsRow | null;
    return {
      sessionId,
      constitution: row.inner_constitution as InnerConstitution,
      answers: row.answers as Answer[],
      demographics: rowToDemographicSet(demoRow),
      metaSignals: (row.meta_signals ?? []) as MetaSignal[],
      createdAt: row.created_at,
    };
  } catch {
    // Query failed (DB unreachable, schema drift, malformed JSONB).
    // Treat as not-found so the user sees a friendly page.
    return null;
  }
}

function ReportNotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div
        className="flex flex-col items-center"
        style={{ gap: 16, maxWidth: 520, padding: 32, textAlign: "center" }}
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
          Reading not found
        </p>
        <h1
          className="font-serif"
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          This reading wasn&apos;t found
        </h1>
        <p
          className="font-serif italic"
          style={{
            fontSize: 16,
            color: "var(--ink-soft)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          The link may be incorrect, or this reading may have been deleted.
          Take a new assessment from the home page.
        </p>
        <Link
          href="/"
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--umber, var(--ink))",
            textDecoration: "underline",
            marginTop: 12,
          }}
        >
          Take the assessment →
        </Link>
      </div>
    </main>
  );
}

export default async function ReportPermalinkPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const fetched = await fetchSession(sessionId);
  if (!fetched) {
    return <ReportNotFound />;
  }
  return (
    <ReportView
      sessionId={fetched.sessionId}
      constitution={fetched.constitution}
      answers={fetched.answers}
      demographics={fetched.demographics}
      sessionDate={fetched.createdAt}
    />
  );
}
