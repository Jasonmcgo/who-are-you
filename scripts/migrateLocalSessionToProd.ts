// scripts/migrateLocalSessionToProd.ts
//
// Imports a named session + its demographics from local DB into prod DB.
// Bypasses the assessment UI entirely — useful when a user completed the
// assessment locally but a production form bug (e.g., the MOBILE_RE
// period-rejection bug from 2026-05-16) would force them to retake.
//
// Usage (from project root):
//
//   DATABASE_URL_LOCAL='postgresql://...@localhost:5432/who_are_you' \
//   DATABASE_URL_PROD='<paste prod DATABASE_POSTGRES_URL>' \
//   npx tsx scripts/migrateLocalSessionToProd.ts <name>
//
// What it does:
//   1. Connects to LOCAL DB, finds the session whose demographics
//      name_value matches <name> (case-insensitive, unique match required)
//   2. Reads the session row + linked demographics row
//   3. Connects to PROD DB
//   4. INSERTs a new session row (new UUID via defaultRandom; preserves
//      answers + inner_constitution + meta_signals + skipped_question_ids
//      + allocation_overlays + belief_under_tension + engine_shape_version)
//   5. INSERTs a demographics row linked to the new prod session UUID,
//      preserving every demographic field value + state including
//      contact_email + contact_mobile
//   6. INSERTs a ghost_mapping_audit row capturing the migration for
//      traceability ("why does this prod session have these details?")
//   7. Reports the new prod session UUID for verification
//
// Read-only against local DB. Insert-only against prod DB. No deletes,
// no updates, no schema changes. llm_rewrites is intentionally NOT copied
// — prod will render via engine prose until a future backfill warms the
// cache for this session.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, ilike } from "drizzle-orm";
import {
  sessions,
  demographics,
  ghostMappingAudit,
} from "../db/schema";

const NAME = process.argv[2];
if (!NAME) {
  console.error("Usage: tsx scripts/migrateLocalSessionToProd.ts <name>");
  process.exit(1);
}

const LOCAL_URL = process.env.DATABASE_URL_LOCAL;
const PROD_URL = process.env.DATABASE_URL_PROD;

if (!LOCAL_URL || !PROD_URL) {
  console.error(
    "Both DATABASE_URL_LOCAL and DATABASE_URL_PROD must be set in env."
  );
  console.error("Example:");
  console.error(
    "  DATABASE_URL_LOCAL='postgresql://...@localhost:5432/who_are_you' \\"
  );
  console.error("  DATABASE_URL_PROD='<prod-postgres-url>' \\");
  console.error("  npx tsx scripts/migrateLocalSessionToProd.ts Cindy");
  process.exit(1);
}

// Sanity check: LOCAL_URL must contain "localhost" or "127.0.0.1" to
// prevent accidentally using a prod URL as the source (which would
// duplicate prod data into prod with new UUIDs — not destructive but
// definitely not intended).
if (
  !LOCAL_URL.includes("localhost") &&
  !LOCAL_URL.includes("127.0.0.1")
) {
  console.error(
    "DATABASE_URL_LOCAL does not point at localhost/127.0.0.1. " +
      "Refusing to run — set DATABASE_URL_LOCAL to your local Postgres URL."
  );
  process.exit(1);
}

const localClient = postgres(LOCAL_URL, { max: 1 });
const prodClient = postgres(PROD_URL, { max: 1 });
const localDb = drizzle(localClient);
const prodDb = drizzle(prodClient);

async function main() {
  // 1) Find local session by name (case-insensitive on name_value)
  const demoMatches = await localDb
    .select()
    .from(demographics)
    .where(ilike(demographics.name_value, NAME));

  if (demoMatches.length === 0) {
    console.error(`[local] no session with name_value matching '${NAME}'`);
    await cleanup();
    process.exit(1);
  }
  if (demoMatches.length > 1) {
    console.error(
      `[local] multiple sessions match '${NAME}'. Please disambiguate:`
    );
    demoMatches.forEach((m) => {
      console.error(
        `  session_id=${m.session_id}  name_value=${m.name_value ?? ""}`
      );
    });
    await cleanup();
    process.exit(1);
  }

  const localDemo = demoMatches[0];
  const localSessionId = localDemo.session_id;

  const sessionMatches = await localDb
    .select()
    .from(sessions)
    .where(eq(sessions.id, localSessionId));

  if (sessionMatches.length !== 1) {
    console.error(
      `[local] expected exactly one session row for ${localSessionId}, found ${sessionMatches.length}`
    );
    await cleanup();
    process.exit(1);
  }

  const localSession = sessionMatches[0];
  console.log(
    `[local] found session ${localSessionId}  name='${localDemo.name_value}'  email='${localDemo.contact_email ?? "(none)"}'`
  );

  // 2) Insert into prod — new UUID via defaultRandom
  const [newSession] = await prodDb
    .insert(sessions)
    .values({
      answers: localSession.answers,
      inner_constitution: localSession.inner_constitution,
      skipped_question_ids: localSession.skipped_question_ids,
      meta_signals: localSession.meta_signals,
      allocation_overlays: localSession.allocation_overlays,
      belief_under_tension: localSession.belief_under_tension,
      engine_shape_version: localSession.engine_shape_version,
      // llm_rewrites intentionally NOT copied — prod renders via engine
      // prose on first read, optionally warmed later via a backfill pass.
    })
    .returning({ id: sessions.id });

  const prodSessionId = newSession.id;
  console.log(`[prod] inserted session ${prodSessionId}`);

  // 3) Insert demographics linked to new prod session UUID
  await prodDb.insert(demographics).values({
    session_id: prodSessionId,
    name_value: localDemo.name_value,
    name_state: localDemo.name_state,
    gender_value: localDemo.gender_value,
    gender_state: localDemo.gender_state,
    age_decade: localDemo.age_decade,
    age_state: localDemo.age_state,
    location_country: localDemo.location_country,
    location_region: localDemo.location_region,
    location_state: localDemo.location_state,
    marital_status_value: localDemo.marital_status_value,
    marital_status_state: localDemo.marital_status_state,
    education_value: localDemo.education_value,
    education_state: localDemo.education_state,
    political_value: localDemo.political_value,
    political_state: localDemo.political_state,
    religious_value: localDemo.religious_value,
    religious_state: localDemo.religious_state,
    profession_value: localDemo.profession_value,
    profession_state: localDemo.profession_state,
    contact_email: localDemo.contact_email,
    contact_mobile: localDemo.contact_mobile,
  });

  console.log(`[prod] inserted demographics row linked to ${prodSessionId}`);

  // 4) Audit log — single row capturing what was done
  await prodDb.insert(ghostMappingAudit).values({
    session_id: prodSessionId,
    admin_label: "migrateLocalSessionToProd",
    note: `Migrated from local session ${localSessionId} via scripts/migrateLocalSessionToProd.ts (workaround for MOBILE_RE period-rejection bug 2026-05-16)`,
    before_snapshot: null,
    after_snapshot: {
      name: localDemo.name_value,
      email: localDemo.contact_email,
      mobile: localDemo.contact_mobile,
      gender: localDemo.gender_value,
      age: localDemo.age_decade,
      profession: localDemo.profession_value,
      source_local_session_id: localSessionId,
    },
  });

  console.log(`[prod] audit row recorded`);

  console.log("");
  console.log("=================================================");
  console.log(`SUCCESS — '${NAME}' migrated to prod`);
  console.log(`  local  session UUID: ${localSessionId}`);
  console.log(`  prod   session UUID: ${prodSessionId}`);
  console.log("=================================================");
  console.log(
    "Verify by loading https://www.the50degreelife.com/admin/sessions"
  );

  await cleanup();
}

async function cleanup() {
  await localClient.end({ timeout: 5 });
  await prodClient.end({ timeout: 5 });
}

main().catch(async (e) => {
  console.error("Migration failed:", e);
  await cleanup();
  process.exit(1);
});
