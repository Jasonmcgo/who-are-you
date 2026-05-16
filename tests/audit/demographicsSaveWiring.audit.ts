// CC-DEMOGRAPHICS-SAVE-WIRING audit — five structural + smoke
// assertions covering the demographics save path and the ghost-mapping
// admin tool.
//
//   1. New submission round-trip: saveSession writes a demographics
//      row with every field populated (name / gender / age /
//      profession / contact_email / contact_mobile).
//   2. Idempotency: attachDemographicsToSession run twice on the same
//      session updates the existing row instead of inserting a
//      duplicate (demographics.session_id is unique by FK + Drizzle
//      semantics).
//   3. FK integrity: every demographics row in the audit-run scope
//      has a valid session_id pointing at sessions.id.
//   4. Ghost-mapping page exists and exports a default async server
//      component. The default-export is the page renderer; we
//      static-grep the file rather than render it (rendering would
//      require a Next.js server harness).
//   5. Ghost-mapping audit-log write: a call to
//      attachDemographicsToSession inserts a row in ghost_mapping_audit
//      with timestamp + before/after snapshots.
//
// The audit runs against the local Postgres. It inserts a temporary
// session for assertions 1/2/5, then deletes it (cascade clears the
// demographics + ghost_mapping_audit rows). Production DB is not
// touched.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Inline env loader so the audit can run from a fresh shell.
function loadEnvLocal(): void {
  if (process.env.DATABASE_URL) return;
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}
loadEnvLocal();

import { eq } from "drizzle-orm";

import { getDb } from "../../db";
import {
  demographics as demographicsTable,
  ghostMappingAudit as ghostMappingAuditTable,
  sessions as sessionsTable,
} from "../../db/schema";
import {
  saveSession,
  attachDemographicsToSession,
} from "../../lib/saveSession";
import type { DemographicAnswer, InnerConstitution } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

// Bare-minimum constitution shape for the smoke test — saveSession
// just stores the JSONB blob without inspecting it.
const STUB_CONSTITUTION = {
  __test_only: true,
} as unknown as InnerConstitution;

const FULL_DEMO: DemographicAnswer[] = [
  { field_id: "name", state: "specified", value: "AuditUser" },
  { field_id: "gender", state: "specified", value: "other" },
  { field_id: "age", state: "specified", value: "30s" },
  { field_id: "profession", state: "specified", value: "auditor" },
];

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];
  const createdSessionIds: string[] = [];
  const db = getDb();

  try {
    // ── 1. saveSession round-trip ──────────────────────────────────
    {
      const { sessionId } = await saveSession({
        answers: [],
        innerConstitution: STUB_CONSTITUTION,
        skippedQuestionIds: [],
        metaSignals: [],
        demographicAnswers: FULL_DEMO,
        contactEmail: "audit+save@example.test",
        contactMobile: "555-0100",
      });
      createdSessionIds.push(sessionId);

      const rows = await db
        .select()
        .from(demographicsTable)
        .where(eq(demographicsTable.session_id, sessionId));
      if (rows.length !== 1) {
        results.push({
          ok: false,
          assertion: "save-roundtrip-fills-demographics",
          detail: `expected 1 demographics row, got ${rows.length}`,
        });
      } else {
        const r = rows[0];
        const missing: string[] = [];
        if (r.name_value !== "AuditUser") missing.push("name");
        if (r.gender_value !== "other") missing.push("gender");
        if (r.age_decade !== "30s") missing.push("age");
        if (r.profession_value !== "auditor") missing.push("profession");
        if (r.contact_email !== "audit+save@example.test")
          missing.push("contact_email");
        if (r.contact_mobile !== "555-0100") missing.push("contact_mobile");
        results.push(
          missing.length === 0
            ? {
                ok: true,
                assertion: "save-roundtrip-fills-demographics",
                detail: `name / gender / age / profession / contact_email / contact_mobile all populated`,
              }
            : {
                ok: false,
                assertion: "save-roundtrip-fills-demographics",
                detail: `missing column(s): ${missing.join(", ")}`,
              }
        );
      }
    }

    // ── 2. Idempotency via attachDemographicsToSession ─────────────
    {
      const sessionId = createdSessionIds[0]!;
      // First call — should update (row already exists from save).
      const r1 = await attachDemographicsToSession({
        sessionId,
        demographicAnswers: [
          { field_id: "name", state: "specified", value: "AuditUserUpdate1" },
        ],
        contactEmail: "audit+update1@example.test",
        contactMobile: null,
        adminLabel: "test:audit",
        note: "first idempotency call",
      });
      // Second call — should also update, not insert a duplicate.
      const r2 = await attachDemographicsToSession({
        sessionId,
        demographicAnswers: [
          { field_id: "name", state: "specified", value: "AuditUserUpdate2" },
        ],
        contactEmail: "audit+update2@example.test",
        contactMobile: null,
        adminLabel: "test:audit",
        note: "second idempotency call",
      });
      const rows = await db
        .select({ id: demographicsTable.id })
        .from(demographicsTable)
        .where(eq(demographicsTable.session_id, sessionId));
      if (
        rows.length === 1 &&
        r1.created === false &&
        r2.created === false
      ) {
        results.push({
          ok: true,
          assertion: "attach-is-idempotent",
          detail: `two consecutive attach calls produced 1 demographics row (created=false on both)`,
        });
      } else {
        results.push({
          ok: false,
          assertion: "attach-is-idempotent",
          detail: `expected 1 demographics row + both created=false; got rows=${rows.length} created=${r1.created},${r2.created}`,
        });
      }
    }

    // ── 3. FK integrity ────────────────────────────────────────────
    {
      // Query every demographics row and verify each has a matching
      // sessions row. The DB-level FK already enforces this; the audit
      // surfaces a soft-check so a future schema change doesn't drop
      // the constraint silently.
      const rows = await db
        .select({
          dSession: demographicsTable.session_id,
          sId: sessionsTable.id,
        })
        .from(demographicsTable)
        .leftJoin(
          sessionsTable,
          eq(demographicsTable.session_id, sessionsTable.id)
        );
      const orphans = rows.filter((r) => r.sId === null);
      results.push(
        orphans.length === 0
          ? {
              ok: true,
              assertion: "fk-integrity-demographics-to-sessions",
              detail: `every demographics row has a valid session_id (${rows.length} rows checked)`,
            }
          : {
              ok: false,
              assertion: "fk-integrity-demographics-to-sessions",
              detail: `${orphans.length} demographics rows have no matching session`,
            }
      );
    }

    // ── 4. Ghost-mapping page exists ──────────────────────────────
    {
      const pagePath = join(
        REPO,
        "app",
        "admin",
        "sessions",
        "ghost-mapping",
        "page.tsx"
      );
      const formPath = join(
        REPO,
        "app",
        "admin",
        "sessions",
        "ghost-mapping",
        "GhostMappingForm.tsx"
      );
      const pageOk = existsSync(pagePath);
      const formOk = existsSync(formPath);
      if (!pageOk || !formOk) {
        results.push({
          ok: false,
          assertion: "ghost-mapping-page-exists",
          detail: `page=${pageOk} form=${formOk}`,
        });
      } else {
        const pageSrc = readFileSync(pagePath, "utf-8");
        const hasDefault = /export default async function GhostMappingPage/.test(
          pageSrc
        );
        const importsForm = /from\s+["'].*GhostMappingForm["']/.test(pageSrc);
        const importsAction = /attachDemographicsToSession/.test(
          readFileSync(formPath, "utf-8")
        );
        if (hasDefault && importsForm && importsAction) {
          results.push({
            ok: true,
            assertion: "ghost-mapping-page-exists",
            detail: `page exports GhostMappingPage, imports GhostMappingForm; form imports the server action`,
          });
        } else {
          results.push({
            ok: false,
            assertion: "ghost-mapping-page-exists",
            detail: `default=${hasDefault} importsForm=${importsForm} importsAction=${importsAction}`,
          });
        }
      }
    }

    // ── 5. Audit-log write fires ──────────────────────────────────
    {
      const sessionId = createdSessionIds[0]!;
      // Count audit-log rows BEFORE — there will be 2 from the
      // idempotency assertion. Add one more attach call, confirm
      // the count goes up by 1, and verify the snapshot fields land.
      const beforeRows = await db
        .select({ id: ghostMappingAuditTable.id })
        .from(ghostMappingAuditTable)
        .where(eq(ghostMappingAuditTable.session_id, sessionId));

      await attachDemographicsToSession({
        sessionId,
        demographicAnswers: [
          {
            field_id: "name",
            state: "specified",
            value: "AuditUserAuditLog",
          },
        ],
        contactEmail: "audit+auditlog@example.test",
        contactMobile: null,
        adminLabel: "test:audit-log-assertion",
        note: "fingerprint clinch: Q-I1 freeform AND top compass",
      });

      const afterRows = await db
        .select({
          id: ghostMappingAuditTable.id,
          admin_label: ghostMappingAuditTable.admin_label,
          note: ghostMappingAuditTable.note,
          before_snapshot: ghostMappingAuditTable.before_snapshot,
          after_snapshot: ghostMappingAuditTable.after_snapshot,
          recorded_at: ghostMappingAuditTable.recorded_at,
        })
        .from(ghostMappingAuditTable)
        .where(eq(ghostMappingAuditTable.session_id, sessionId));

      const newRow = afterRows.find(
        (r) => r.admin_label === "test:audit-log-assertion"
      );
      if (
        afterRows.length === beforeRows.length + 1 &&
        newRow &&
        newRow.note &&
        newRow.note.includes("Q-I1 freeform") &&
        newRow.before_snapshot !== null &&
        newRow.after_snapshot !== null &&
        newRow.recorded_at instanceof Date
      ) {
        results.push({
          ok: true,
          assertion: "audit-log-records-write",
          detail: `ghost_mapping_audit row count grew by 1; new row has admin_label + note + before/after snapshots + recorded_at`,
        });
      } else {
        results.push({
          ok: false,
          assertion: "audit-log-records-write",
          detail: `before=${beforeRows.length} after=${afterRows.length} newRow=${newRow ? "present" : "missing"}`,
        });
      }
    }
  } finally {
    // Clean up test rows — cascade clears demographics + audit-log.
    for (const sid of createdSessionIds) {
      try {
        await db.delete(sessionsTable).where(eq(sessionsTable.id, sid));
      } catch (e) {
        console.warn(`[audit-cleanup] failed to delete ${sid}: ${(e as Error).message}`);
      }
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(
    `CC-DEMOGRAPHICS-SAVE-WIRING: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
