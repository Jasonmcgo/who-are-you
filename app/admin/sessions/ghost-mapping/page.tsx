// CC-DEMOGRAPHICS-SAVE-WIRING — admin ghost-mapping surface.
//
// Lists every session whose linked `demographics` row is null or has
// null name/email, alongside a session-answer fingerprint (Q-I1
// freeform, top Compass values, Q-GRIP1 top-3, Q-Stakes1 top-2, Q-A2
// response) that an admin can use to identify the anonymous user
// before manually attaching a name / email / etc.
//
// Auth: this page is under `/admin/*` which the existing admin gate
// covers. No new auth code introduced here. The `admin_label` field
// on the form is the only "who" the audit log captures — there's no
// authenticated identity yet on the admin route, and adding one is
// out of scope for this CC.
//
// **Critical constraint** (per CC §4): the page MUST NOT auto-match.
// Every mapping requires explicit admin click on a per-row submit
// button. The fingerprint display is decision support only.

import Link from "next/link";
import { isNull, or, eq, sql } from "drizzle-orm";

import { getDb } from "../../../../db";
import {
  demographics as demographicsTable,
  sessions as sessionsTable,
} from "../../../../db/schema";
import type {
  Answer,
  ForcedFreeformAnswer,
  RankingAnswer,
  SinglePickAnswer,
} from "../../../../lib/types";
import GhostMappingForm from "./GhostMappingForm";

const COMPASS_SACRED_IDS = new Set([
  "truth_priority",
  "freedom_priority",
  "loyalty_priority",
  "justice_priority",
  "faith_priority",
  "stability_priority",
  "knowledge_priority",
  "family_priority",
  "peace_priority",
  "honor_priority",
  "compassion_priority",
  "mercy_priority",
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
  peace_priority: "Peace",
  honor_priority: "Honor",
  compassion_priority: "Compassion",
  mercy_priority: "Mercy",
};

const GRIP_LABEL: Record<string, string> = {
  grips_control: "Control",
  grips_security: "Money or security",
  grips_reputation: "Reputation",
  grips_certainty: "Being right",
  grips_neededness: "Being needed",
  grips_comfort: "Comfort or escape",
  grips_old_plan: "A plan that used to work",
  grips_approval: "Approval of specific people",
};

const STAKE_LABEL: Record<string, string> = {
  close_relationships: "Close relationships",
  health: "Physical safety / Health",
  reputation: "Reputation",
  job: "Job / Career",
  money: "Money / Wealth",
};

type Fingerprint = {
  qI1Freeform: string | null;
  topCompass: string[];
  topGrip3: string[];
  topStake2: string[];
  qA2Response: string | null;
};

function isRanking(a: Answer): a is RankingAnswer {
  return "order" in a && Array.isArray((a as RankingAnswer).order);
}

function isForced(a: Answer): a is ForcedFreeformAnswer {
  return "response" in a && typeof (a as ForcedFreeformAnswer).response === "string";
}

function isSinglePick(a: Answer): a is SinglePickAnswer {
  return "picked_signal" in a;
}

function buildFingerprint(answers: Answer[]): Fingerprint {
  const fp: Fingerprint = {
    qI1Freeform: null,
    topCompass: [],
    topGrip3: [],
    topStake2: [],
    qA2Response: null,
  };

  for (const a of answers) {
    if (a.question_id === "Q-I1" || a.question_id === "Q-I1b") {
      const candidate =
        isForced(a) && a.response.length > 0
          ? a.response
          : "freeform_text" in a && typeof (a as { freeform_text?: string }).freeform_text === "string"
            ? (a as { freeform_text: string }).freeform_text
            : null;
      if (candidate && candidate.length > 0) fp.qI1Freeform = candidate;
    }
    if (a.question_id === "Q-A2" && isForced(a)) {
      fp.qA2Response = a.response;
    }
    if (a.question_id === "Q-GRIP1" && isRanking(a)) {
      fp.topGrip3 = a.order.slice(0, 3).map(String);
    }
    if (a.question_id === "Q-Stakes1" && isRanking(a)) {
      fp.topStake2 = a.order.slice(0, 2).map(String);
    }
  }

  // Compass top: walk every ranking answer, pick top-1 of each that
  // resolves to a *_priority signal id; aggregate across Q-S1 + Q-S2.
  // For ranking-answers the top-1 item id is `order[0]` keyed to the
  // option signal via the question bank; the saved Answer carries the
  // option id but not the resolved signal. The id form `<value>_priority`
  // matches Q-S1 / Q-S2 item ids in data/questions.ts.
  const compassHits = new Set<string>();
  for (const a of answers) {
    if (
      (a.question_id === "Q-S1" || a.question_id === "Q-S2") &&
      isRanking(a)
    ) {
      for (const item of a.order.slice(0, 2)) {
        const candidate = `${item}_priority`;
        if (COMPASS_SACRED_IDS.has(candidate)) {
          compassHits.add(item);
        }
      }
    }
    if (
      a.question_id === "Q-I3" &&
      isSinglePick(a) &&
      COMPASS_SACRED_IDS.has(a.picked_signal)
    ) {
      const stripped = a.picked_signal.replace(/_priority$/, "");
      compassHits.add(stripped);
    }
  }
  fp.topCompass = [...compassHits].slice(0, 4);
  return fp;
}

interface AnonymousRow {
  sessionId: string;
  createdAt: Date;
  fingerprint: Fingerprint;
  existing: {
    name: string | null;
    email: string | null;
    gender: string | null;
    age: string | null;
    profession: string | null;
  };
}

async function loadAnonymousRows(): Promise<AnonymousRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: sessionsTable.id,
      created_at: sessionsTable.created_at,
      answers: sessionsTable.answers,
      name_value: demographicsTable.name_value,
      contact_email: demographicsTable.contact_email,
      gender_value: demographicsTable.gender_value,
      age_decade: demographicsTable.age_decade,
      profession_value: demographicsTable.profession_value,
    })
    .from(sessionsTable)
    .leftJoin(
      demographicsTable,
      eq(sessionsTable.id, demographicsTable.session_id)
    )
    .where(
      or(
        isNull(demographicsTable.session_id),
        isNull(demographicsTable.name_value),
        isNull(demographicsTable.contact_email),
        // Empty string counts as anonymous too.
        sql`${demographicsTable.contact_email} = ''`
      )
    )
    .orderBy(sessionsTable.created_at);

  return rows.map((r) => ({
    sessionId: r.id,
    createdAt: r.created_at,
    fingerprint: buildFingerprint((r.answers ?? []) as Answer[]),
    existing: {
      name: r.name_value,
      email: r.contact_email,
      gender: r.gender_value,
      age: r.age_decade,
      profession: r.profession_value,
    },
  }));
}

function fingerprintLabel(fp: Fingerprint): string {
  const compass = fp.topCompass.length
    ? fp.topCompass.map((c) => COMPASS_LABEL[`${c}_priority`] ?? c).join(" / ")
    : "—";
  const grip = fp.topGrip3
    .map((g) => GRIP_LABEL[g] ?? g)
    .join(" / ");
  const stake = fp.topStake2
    .map((s) => STAKE_LABEL[s] ?? s)
    .join(" / ");
  return [
    fp.qA2Response ? `Q-A2: ${fp.qA2Response}` : null,
    `Compass: ${compass}`,
    grip ? `Grips: ${grip}` : null,
    stake ? `Stakes: ${stake}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
}

export default async function GhostMappingPage() {
  let rows: AnonymousRow[];
  try {
    rows = await loadAnonymousRows();
  } catch (e) {
    return (
      <main className="min-h-screen" style={{ padding: 40 }}>
        <h1>Ghost mapping</h1>
        <p style={{ color: "var(--danger, #a83a3a)" }}>
          Could not load sessions: {(e as Error).message}
        </p>
        <p>
          <Link href="/admin/sessions">← Back to sessions</Link>
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{
        padding: 40,
        background: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "var(--font-serif)",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <p
          className="font-mono uppercase"
          style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--ink-mute)" }}
        >
          Admin · ghost mapping
        </p>
        <h1 style={{ fontSize: 28, margin: "8px 0 16px" }}>
          Anonymous session reconciliation
        </h1>
        <p style={{ lineHeight: 1.55, maxWidth: 720, color: "var(--ink-soft)" }}>
          {rows.length === 0
            ? "No anonymous sessions — every session has a linked demographics row with name + email."
            : `${rows.length} session${rows.length === 1 ? "" : "s"} need a manual identity attach. Review the fingerprint, then fill in name / email / gender / age / profession and submit. Every write is logged to the ghost-mapping audit table.`}
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/admin/sessions">← Back to sessions</Link>
        </p>
      </header>

      {rows.map((row) => (
        <section
          key={row.sessionId}
          style={{
            border: "1px solid var(--rule-soft)",
            borderRadius: 4,
            padding: 24,
            marginBottom: 24,
            background: "var(--paper)",
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--ink-mute)",
              marginBottom: 8,
            }}
          >
            session {row.sessionId.slice(0, 8)} · created{" "}
            {row.createdAt.toISOString().slice(0, 10)}
          </div>
          {row.fingerprint.qI1Freeform ? (
            <p
              className="font-serif italic"
              style={{ marginBottom: 12, lineHeight: 1.5 }}
            >
              Q-I1: {row.fingerprint.qI1Freeform}
            </p>
          ) : (
            <p
              className="font-serif italic"
              style={{
                marginBottom: 12,
                color: "var(--ink-mute)",
                lineHeight: 1.5,
              }}
            >
              Q-I1: (no freeform recorded)
            </p>
          )}
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              marginBottom: 12,
              lineHeight: 1.55,
            }}
          >
            {fingerprintLabel(row.fingerprint)}
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-mute)",
              marginBottom: 16,
            }}
          >
            Existing — name: {row.existing.name ?? "—"} · email:{" "}
            {row.existing.email && row.existing.email.length > 0
              ? row.existing.email
              : "—"}{" "}
            · gender: {row.existing.gender ?? "—"} · age:{" "}
            {row.existing.age ?? "—"} · profession: {row.existing.profession ?? "—"}
          </p>
          <GhostMappingForm
            sessionId={row.sessionId}
            initial={{
              name: row.existing.name ?? "",
              email: row.existing.email ?? "",
              gender: row.existing.gender ?? "",
              age: row.existing.age ?? "",
              profession: row.existing.profession ?? "",
            }}
          />
        </section>
      ))}
    </main>
  );
}
