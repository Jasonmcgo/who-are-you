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
import {
  ENGINE_SHAPE_VERSION,
  detectStaleShape,
  diffShape,
  logStaleShapeReDerived,
} from "../../../lib/staleShape";
import { buildInnerConstitution } from "../../../lib/identityEngine";
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
  // CC-STALE-SHAPE-DETECTOR — populated when the detector falls into
  // the re-derivable branch. NULL in the fresh branch.
  staleShapeBranch: "fresh" | "re-derivable";
};

// CC-STALE-SHAPE-DETECTOR — branch-3 verdict surfaced to the page.
// When the detector says un-rerenderable (stale shape + missing
// answers), fetchSession returns this discriminated value instead of
// FetchedSession so the page can render the graceful-error card
// rather than throwing on the stale bundle.
type UnRerenderable = { kind: "un-rerenderable"; reason: string };

async function fetchSession(
  sessionId: string
): Promise<FetchedSession | UnRerenderable | null> {
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
    const demographics = rowToDemographicSet(demoRow);
    const answers = (row.answers ?? []) as Answer[];
    // CC-STALE-SHAPE-DETECTOR — three-branch render-path detector.
    // The detector inspects the stored bundle + engine_shape_version
    // and returns one of:
    //   - fresh: stored constitution matches the current engine
    //     shape; render directly.
    //   - re-derivable: shape drift (e.g., older row missing the
    //     `ocean.dispositionSignalMix.bands` field that the renderer
    //     now reads); re-derive via buildInnerConstitution from the
    //     stored `answers` and emit `[stale-shape:re-derived]`.
    //   - un-rerenderable: shape drift AND `answers` missing/empty;
    //     bubble up the graceful-error card. Never throw.
    const verdict = detectStaleShape({
      sessionId,
      engineShapeVersion: row.engine_shape_version,
      innerConstitution: row.inner_constitution,
      answers,
    });
    let constitution: InnerConstitution;
    let branch: "fresh" | "re-derivable";
    if (verdict.branch === "fresh") {
      constitution = verdict.constitution;
      branch = "fresh";
    } else if (verdict.branch === "re-derivable") {
      // Re-derive via the engine entry. Engine-only — no LLM path.
      try {
        constitution = buildInnerConstitution(answers, [], demographics);
      } catch {
        return {
          kind: "un-rerenderable",
          reason: "re-derivation-throw",
        };
      }
      const fieldDiffs = diffShape(verdict.storedConstitution, constitution);
      logStaleShapeReDerived({
        sessionId,
        storedVersion: row.engine_shape_version,
        currentVersion: ENGINE_SHAPE_VERSION,
        reason: verdict.reason,
        fieldDiffs,
      });
      branch = "re-derivable";
    } else {
      return { kind: "un-rerenderable", reason: verdict.reason };
    }
    return {
      sessionId,
      constitution,
      answers,
      demographics,
      metaSignals: (row.meta_signals ?? []) as MetaSignal[],
      createdAt: row.created_at,
      staleShapeBranch: branch,
    };
  } catch {
    // Query failed (DB unreachable, malformed JSONB). Treat as not-
    // found so the user sees a friendly page rather than a server
    // error.
    return null;
  }
}

function ReportRetakeRequired({ reason }: { reason: string }) {
  // CC-STALE-SHAPE-DETECTOR — branch (3) graceful-error card. Renders
  // when the stored bundle is stale-shape AND `answers` is missing/
  // incomplete (so re-derivation is impossible). User-facing copy is
  // soft; the diagnostic reason hides in a data-attribute for admin
  // inspection without leaking detail to the reader.
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
      data-stale-shape-reason={reason}
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
          Reading needs a refresh
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
          We can&apos;t render this report
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
          This report was saved against an older version of the model and
          can&apos;t be rebuilt from the stored answers. Please re-take the
          assessment to generate a fresh reading.
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
  if ("kind" in fetched && fetched.kind === "un-rerenderable") {
    return <ReportRetakeRequired reason={fetched.reason} />;
  }
  // Narrow to FetchedSession (branch-1 fresh / branch-2 re-derivable).
  const session = fetched as FetchedSession;
  return (
    <ReportView
      sessionId={session.sessionId}
      constitution={session.constitution}
      answers={session.answers}
      demographics={session.demographics}
      sessionDate={session.createdAt}
    />
  );
}
