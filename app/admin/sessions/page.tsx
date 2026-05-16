// CC-021a — Sessions table view (server component). Reads searchParams for
// filter + sort state, calls the same data path as /api/admin/sessions, and
// renders the flat table HTML. The filter/sort UI is delegated to a small
// client subcomponent further down the file.
//
// Why call the data layer directly instead of fetching the API route: a
// server component running on the same server can read Postgres directly
// without paying for an HTTP round-trip. The /api route exists for the
// detail page's client-side actions (delete attachment, edit notes, etc.)
// and for any future external consumer.

import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  attachments as attachmentsTable,
  demographics as demographicsTable,
  sessions as sessionsTable,
} from "../../../db/schema";
import type {
  Answer,
  CognitiveFunctionId,
  EpistemicPosture,
  InnerConstitution,
  SessionSummary,
  ValueDomain,
} from "../../../lib/types";
import { detectStaleShape } from "../../../lib/staleShape";
import { DEMOGRAPHIC_FIELDS } from "../../../data/demographics";

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

const COMPASS_LABEL: Record<string, string> = {
  truth_priority: "Truth",
  freedom_priority: "Freedom",
  loyalty_priority: "Loyalty",
  justice_priority: "Justice",
  faith_priority: "Faith",
  stability_priority: "Stability",
  knowledge_priority: "Knowledge",
  family_priority: "Family",
};

const FUNCTION_LABEL: Record<CognitiveFunctionId, string> = {
  ni: "Ni (pattern-reader)",
  ne: "Ne (possibility-finder)",
  si: "Si (precedent-checker)",
  se: "Se (present-tense self)",
  ti: "Ti (coherence-checker)",
  te: "Te (structurer)",
  fi: "Fi (inner compass)",
  fe: "Fe (room-reader)",
};

const POSTURE_LABEL: Record<EpistemicPosture, string> = {
  open: "Open",
  rigid: "Rigid",
  reflective: "Reflective",
  guarded: "Guarded",
  unknown: "Unsure",
};

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

function deriveTopCompassSignalId(ic: InnerConstitution): string | null {
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

async function loadSessions(filters: {
  search: string;
  profession: string;
  lens: string;
  compass: string;
  sort: SortKey;
  dir: "asc" | "desc";
}): Promise<SessionSummary[]> {
  const db = getDb();
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
      contact_email: demographicsTable.contact_email,
    })
    .from(sessionsTable)
    .leftJoin(
      demographicsTable,
      eq(demographicsTable.session_id, sessionsTable.id)
    );

  const counts = await db
    .select({
      session_id: attachmentsTable.session_id,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(attachmentsTable)
    .groupBy(attachmentsTable.session_id);
  const countBySession = new Map<string, number>();
  for (const c of counts) countBySession.set(c.session_id, c.count);

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
      contact_email: r.contact_email,
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

  if (filters.search) {
    const q = filters.search.toLowerCase();
    summaries = summaries.filter((s) =>
      (s.name_value ?? "").toLowerCase().includes(q)
    );
  }
  if (filters.profession) {
    summaries = summaries.filter((s) => s.profession_value === filters.profession);
  }
  if (filters.lens) {
    summaries = summaries.filter((s) => s.dominant_function === filters.lens);
  }
  if (filters.compass) {
    summaries = summaries.filter((s) => s.top_compass === filters.compass);
  }

  const sign = filters.dir === "asc" ? 1 : -1;
  summaries.sort((a, b) => {
    const result = (() => {
      switch (filters.sort) {
        case "saved_at":
          return Date.parse(a.saved_at) - Date.parse(b.saved_at);
        case "name":
          return cmpNullable(a.name_value, b.name_value);
        case "age":
          return cmpNullable(a.age_decade, b.age_decade);
        case "profession":
          return cmpNullable(a.profession_value, b.profession_value);
        case "gender":
          return cmpNullable(a.gender_value, b.gender_value);
        case "lens":
          return cmpNullable(a.dominant_function, b.dominant_function);
        case "compass":
          return cmpNullable(a.top_compass, b.top_compass);
        case "conviction":
          return cmpNullable(a.conviction_posture, b.conviction_posture);
        case "allocations":
          return a.allocation_tensions_count - b.allocation_tensions_count;
        case "attachments":
          return a.attachments_count - b.attachments_count;
      }
    })();
    return sign * result;
  });

  return summaries;
}

function cmpNullable(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b);
}

// CC-STALE-SHAPE-DETECTOR — admin observability tally. Walks every
// row in `sessions` once, runs `detectStaleShape` against the stored
// bundle + answers + engine_shape_version, and returns per-branch
// counts for the header banner.
async function loadStaleShapeTally(): Promise<{
  total: number;
  fresh: number;
  reDerivable: number;
  unRerenderable: number;
} | null> {
  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return null;
  }
  let rows: Array<{
    id: string;
    engine_shape_version: number | null;
    inner_constitution: unknown;
    answers: unknown;
  }>;
  try {
    rows = (await db
      .select({
        id: sessionsTable.id,
        engine_shape_version: sessionsTable.engine_shape_version,
        inner_constitution: sessionsTable.inner_constitution,
        answers: sessionsTable.answers,
      })
      .from(sessionsTable)) as Array<{
      id: string;
      engine_shape_version: number | null;
      inner_constitution: unknown;
      answers: unknown;
    }>;
  } catch {
    return null;
  }
  const tally = { total: rows.length, fresh: 0, reDerivable: 0, unRerenderable: 0 };
  for (const r of rows) {
    const verdict = detectStaleShape({
      sessionId: r.id,
      engineShapeVersion: r.engine_shape_version,
      innerConstitution: r.inner_constitution,
      answers: (r.answers ?? []) as Answer[],
    });
    if (verdict.branch === "fresh") tally.fresh++;
    else if (verdict.branch === "re-derivable") tally.reDerivable++;
    else tally.unRerenderable++;
  }
  return tally;
}

function formatRelative(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const diffMs = Date.now() - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  return `${Math.floor(month / 12)}y ago`;
}

function formatStateValue(
  state: SessionSummary["name_state"],
  value: string | null,
  fallbackAnonymous: string = "Anonymous"
): { text: string; isItalic: boolean } {
  if (state === "specified" && value) return { text: value, isItalic: false };
  if (state === "prefer_not_to_say")
    return { text: "Prefer not to say", isItalic: true };
  return { text: fallbackAnonymous, isItalic: true };
}

const FUNCTION_IDS: CognitiveFunctionId[] = [
  "ni",
  "ne",
  "si",
  "se",
  "ti",
  "te",
  "fi",
  "fe",
];

const VALUE_DOMAIN_IDS: ValueDomain[] = [
  "truth",
  "freedom",
  "loyalty",
  "justice",
  "faith",
  "stability",
  "knowledge",
  "family",
];

const VALUE_DOMAIN_TO_SIGNAL: Record<string, string> = {
  truth: "truth_priority",
  freedom: "freedom_priority",
  loyalty: "loyalty_priority",
  justice: "justice_priority",
  faith: "faith_priority",
  stability: "stability_priority",
  knowledge: "knowledge_priority",
  family: "family_priority",
};

type SearchParamsRaw = { [key: string]: string | string[] | undefined };

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const sp = await searchParams;
  const search =
    typeof sp.name === "string" ? sp.name.trim() : "";
  const profession = typeof sp.profession === "string" ? sp.profession : "";
  const lens = typeof sp.lens === "string" ? sp.lens : "";
  const compass = typeof sp.compass === "string" ? sp.compass : "";
  const sortRaw = typeof sp.sort === "string" ? sp.sort : "saved_at";
  const sort: SortKey = VALID_SORT_KEYS.has(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : "saved_at";
  const dir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";

  let summaries: SessionSummary[] = [];
  let loadError: string | null = null;
  try {
    summaries = await loadSessions({
      search,
      profession,
      lens,
      compass,
      sort,
      dir,
    });
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Failed to load sessions.";
  }
  // CC-STALE-SHAPE-DETECTOR — render-time observability tally for the
  // header banner. Soft-fails to null if the DB is unreachable; the
  // banner then renders without counts rather than crashing the
  // sessions list.
  const staleTally = await loadStaleShapeTally();

  const professionField = DEMOGRAPHIC_FIELDS.find((f) => f.field_id === "profession");
  const professionOptions = professionField?.options ?? [];

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <header
        className="flex flex-row items-center justify-between"
        style={{
          padding: "20px 28px",
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
            Sessions
          </p>
          <p
            className="font-serif italic"
            style={{
              fontSize: 14,
              color: "var(--ink-soft)",
              margin: 0,
            }}
          >
            {summaries.length}{" "}
            {summaries.length === 1 ? "session" : "sessions"} saved
          </p>
          {staleTally ? (
            <p
              className="font-mono"
              data-stale-shape-counter
              style={{
                fontSize: 11,
                letterSpacing: "0.04em",
                color: "var(--ink-mute)",
                margin: 0,
                marginTop: 4,
              }}
            >
              Stale-shape sessions: {staleTally.reDerivable + staleTally.unRerenderable}{" "}
              (re-derived: {staleTally.reDerivable}, un-rerenderable: {staleTally.unRerenderable})
            </p>
          ) : null}
        </div>
        {/* Logout: a small form POSTing to the logout API which clears the
            cookie and redirects to /admin. No client-side JS needed. */}
        <form
          action="/api/admin/auth/logout"
          method="post"
          style={{ margin: 0 }}
        >
          <button
            type="submit"
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              background: "transparent",
              color: "var(--ink-mute)",
              border: "1px solid var(--rule)",
              padding: "8px 14px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </form>
      </header>

      <div style={{ padding: "20px 28px" }}>
        {/* Filter row — GET-form to /admin/sessions; submission updates the
            URL params which feed back into this server component. Sort
            params are preserved as hidden inputs. */}
        <form
          method="get"
          action="/admin/sessions"
          className="flex flex-row flex-wrap"
          style={{
            gap: 10,
            alignItems: "flex-end",
            paddingBottom: 16,
            borderBottom: "1px solid var(--rule-soft)",
          }}
        >
          {sort !== "saved_at" || dir !== "desc" ? (
            <>
              <input type="hidden" name="sort" value={sort} />
              <input type="hidden" name="dir" value={dir} />
            </>
          ) : null}
          <FilterInput name="name" label="Name search" defaultValue={search} />
          <FilterSelect
            name="profession"
            label="Profession"
            value={profession}
            options={professionOptions.map((o) => ({ id: o.id, label: o.label }))}
          />
          <FilterSelect
            name="lens"
            label="Lens dominant"
            value={lens}
            options={FUNCTION_IDS.map((id) => ({
              id,
              label: FUNCTION_LABEL[id],
            }))}
          />
          <FilterSelect
            name="compass"
            label="Compass top"
            value={compass}
            options={VALUE_DOMAIN_IDS.map((id) => ({
              id: VALUE_DOMAIN_TO_SIGNAL[id],
              label: COMPASS_LABEL[VALUE_DOMAIN_TO_SIGNAL[id]] ?? id,
            }))}
          />
          <button
            type="submit"
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              background: "var(--umber)",
              color: "var(--paper)",
              border: "1px solid var(--umber)",
              padding: "8px 14px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
          {(search || profession || lens || compass) ? (
            <Link
              href="/admin/sessions"
              data-focus-ring
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "var(--ink-mute)",
                textDecoration: "underline",
                alignSelf: "center",
                paddingBottom: 8,
              }}
            >
              clear
            </Link>
          ) : null}
        </form>

        {loadError ? (
          <p
            role="alert"
            className="font-serif italic"
            style={{
              fontSize: 14,
              color: "var(--umber)",
              padding: "16px 0",
            }}
          >
            {loadError}
          </p>
        ) : summaries.length === 0 ? (
          <div
            className="flex flex-col items-center"
            style={{
              gap: 8,
              padding: "60px 0",
              textAlign: "center",
            }}
          >
            <p
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "var(--ink-mute)",
                margin: 0,
              }}
            >
              No sessions yet
            </p>
            <p
              className="font-serif italic"
              style={{
                fontSize: 15,
                color: "var(--ink-soft)",
                margin: 0,
                lineHeight: 1.5,
                maxWidth: 480,
              }}
            >
              Take the test from the home page and click Save at the end. New
              sessions will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 20 }}>
            <table
              className="font-serif"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--paper-warm)",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  <SortableHeader label="Name" sortKey="name" current={sort} dir={dir} sp={sp} />
                  <th style={cellStyle}>Email</th>
                  <SortableHeader label="Saved" sortKey="saved_at" current={sort} dir={dir} sp={sp} />
                  <SortableHeader label="Age" sortKey="age" current={sort} dir={dir} sp={sp} />
                  <SortableHeader label="Profession" sortKey="profession" current={sort} dir={dir} sp={sp} />
                  <SortableHeader label="Gender" sortKey="gender" current={sort} dir={dir} sp={sp} />
                  <SortableHeader label="Lens" sortKey="lens" current={sort} dir={dir} sp={sp} />
                  <SortableHeader label="Compass top" sortKey="compass" current={sort} dir={dir} sp={sp} />
                  <SortableHeader label="Conviction" sortKey="conviction" current={sort} dir={dir} sp={sp} />
                  <SortableHeader label="Alloc." sortKey="allocations" current={sort} dir={dir} sp={sp} />
                  <SortableHeader label="Files" sortKey="attachments" current={sort} dir={dir} sp={sp} />
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => {
                  const name = formatStateValue(s.name_state, s.name_value, "Anonymous");
                  const age = formatStateValue(
                    s.age_state,
                    s.age_decade,
                    "—"
                  );
                  const prof = formatStateValue(
                    s.profession_state,
                    s.profession_value
                      ? professionOptions.find(
                          (o) => o.id === s.profession_value
                        )?.label ?? s.profession_value
                      : null,
                    "—"
                  );
                  const gender = formatStateValue(
                    s.gender_state,
                    s.gender_value,
                    "—"
                  );
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: "1px solid var(--rule-soft)",
                      }}
                    >
                      <td style={cellStyle}>
                        <span style={{ fontStyle: name.isItalic ? "italic" : "normal", color: name.isItalic ? "var(--ink-soft)" : "var(--ink)" }}>
                          {name.text}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        {s.contact_email ? (
                          <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                            {s.contact_email}
                          </span>
                        ) : (
                          <span style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>—</span>
                        )}
                      </td>
                      <td
                        style={cellStyle}
                        title={new Date(s.saved_at).toLocaleString()}
                      >
                        {formatRelative(s.saved_at)}
                      </td>
                      <td style={cellStyle}>
                        <span style={{ fontStyle: age.isItalic ? "italic" : "normal", color: age.isItalic ? "var(--ink-soft)" : "var(--ink)" }}>
                          {age.text}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{ fontStyle: prof.isItalic ? "italic" : "normal", color: prof.isItalic ? "var(--ink-soft)" : "var(--ink)" }}>
                          {prof.text}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{ fontStyle: gender.isItalic ? "italic" : "normal", color: gender.isItalic ? "var(--ink-soft)" : "var(--ink)" }}>
                          {gender.text}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        {s.dominant_function
                          ? FUNCTION_LABEL[s.dominant_function]
                          : "—"}
                      </td>
                      <td style={cellStyle}>
                        {s.top_compass
                          ? COMPASS_LABEL[s.top_compass] ?? s.top_compass
                          : "—"}
                      </td>
                      <td style={cellStyle}>
                        {s.conviction_posture
                          ? POSTURE_LABEL[s.conviction_posture]
                          : "—"}
                      </td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <Badge count={s.allocation_tensions_count} />
                      </td>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <Badge count={s.attachments_count} />
                      </td>
                      <td style={cellStyle}>
                        <Link
                          href={`/admin/sessions/${s.id}`}
                          className="font-mono uppercase"
                          style={{
                            fontSize: 10,
                            letterSpacing: "0.12em",
                            color: "var(--umber)",
                            textDecoration: "underline",
                          }}
                        >
                          view →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  verticalAlign: "top",
  borderBottom: "1px solid var(--rule-soft)",
};

function Badge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span style={{ color: "var(--ink-faint)", fontSize: 13 }}>0</span>
    );
  }
  return (
    <span
      className="font-mono"
      style={{
        background: "var(--umber-wash)",
        color: "var(--umber)",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {count}
    </span>
  );
}

type FilterOption = { id: string; label: string };

function FilterInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
        }}
      >
        {label}
      </span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        data-focus-ring
        className="font-serif"
        style={{
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          color: "var(--ink)",
          padding: "7px 10px",
          fontSize: 14,
          borderRadius: 6,
          minWidth: 180,
        }}
      />
    </label>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: FilterOption[];
}) {
  return (
    <label className="flex flex-col" style={{ gap: 4 }}>
      <span
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
        }}
      >
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        data-focus-ring
        className="font-serif"
        style={{
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          color: "var(--ink)",
          padding: "7px 10px",
          fontSize: 14,
          borderRadius: 6,
          minWidth: 160,
        }}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  sp,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: "asc" | "desc";
  sp: SearchParamsRaw;
}) {
  // Build the next sort URL: same-key click toggles dir; different-key
  // click resets dir to asc (more intuitive than "remember last dir").
  const isCurrent = sortKey === current;
  const nextDir: "asc" | "desc" = isCurrent
    ? dir === "asc"
      ? "desc"
      : "asc"
    : "asc";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "sort" || k === "dir") continue;
    if (typeof v === "string" && v.length > 0) params.set(k, v);
  }
  params.set("sort", sortKey);
  params.set("dir", nextDir);
  const arrow = isCurrent ? (dir === "asc" ? " ↑" : " ↓") : "";
  return (
    <th style={cellStyle}>
      <Link
        href={`/admin/sessions?${params.toString()}`}
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          textDecoration: "none",
        }}
      >
        {label}
        {arrow}
      </Link>
    </th>
  );
}
