// CC-VO-FIXTURE-EXTRACTION helper
//
// Extracts answer arrays from the 7 named prod sessions and writes them
// as real-person calibration fixtures under tests/fixtures/cohort-real/.
//
// Per feedback_cohort_fixtures_two_functions.md:
//   - tests/fixtures/cohort/*.json = SHAPE-PATTERN diagnostics (synthetic
//     personas — paralysis-shame, si-tradition-steward, etc.)
//   - tests/fixtures/cohort-real/*.json = REAL-PERSON calibration anchors
//     (the 7 named cohort users with their actual saved prod answers)
//
// Usage:
//   DATABASE_URL='postgres://...prod-postgres-url...' \
//     npx tsx scripts/extractCohortRealFixtures.ts
//
// Output: 7 fixture files written to tests/fixtures/cohort-real/.
// No DB writes — read-only extraction.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import postgres from "postgres";

interface SessionRow {
  id: string;
  answers: unknown;
  created_at: Date;
}

// Demographics schema is variable across migrations; use Record to be resilient.
type DemographicsRow = Record<string, unknown>;

const COHORT_MAPPING: Array<{ uuid: string; filename: string; canonicalName: string }> = [
  { uuid: "3d3ddc5a-8b32-49c1-a90b-4e2d761a1913", filename: "jason-real.json", canonicalName: "JasonDMcG" },
  { uuid: "ccb4d74e-a9b2-4ec9-a21a-6fe679fb1fed", filename: "michele-real.json", canonicalName: "Michele" },
  { uuid: "d2e0fa2a-cd32-40f4-b73b-baad69f71f5f", filename: "daniel-real.json", canonicalName: "Daniel" },
  { uuid: "652a60c9-4d4c-42be-b8c4-9eff2a1de7db", filename: "cindy-real.json", canonicalName: "Cindy" },
  { uuid: "8a238ac3-8579-4ff2-b429-df0299c5d7bd", filename: "kevin-real.json", canonicalName: "Kevin" },
  { uuid: "ec5994e5-4176-4fea-95d7-576c91059440", filename: "harry-real.json", canonicalName: "Harry" },
  { uuid: "bbd5300a-7b57-4408-a787-67cea202e772", filename: "ashley-real.json", canonicalName: "Ashley" },
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL env var not set.");
    console.error("Usage: DATABASE_URL='postgres://...prod...' npx tsx scripts/extractCohortRealFixtures.ts");
    process.exit(1);
  }

  // Safety check: refuse to run against localhost (we want PROD)
  if (dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")) {
    console.error("ERROR: DATABASE_URL points to localhost. Real-person fixtures must come from PROD.");
    console.error("Re-run with the prod DATABASE_POSTGRES_URL from Vercel Storage.");
    process.exit(1);
  }

  const fixturesDir = join(process.cwd(), "tests", "fixtures", "cohort-real");
  if (!existsSync(fixturesDir)) {
    mkdirSync(fixturesDir, { recursive: true });
    console.log(`Created directory: tests/fixtures/cohort-real/`);
  }

  const sql = postgres(dbUrl, { ssl: "require", max: 1 });

  let written = 0;
  let skipped = 0;

  for (const entry of COHORT_MAPPING) {
    try {
      // Fetch session
      const sessionRows = await sql<SessionRow[]>`
        SELECT id, answers, created_at
        FROM sessions
        WHERE id = ${entry.uuid}
      `;

      if (sessionRows.length === 0) {
        console.warn(`  SKIP ${entry.canonicalName} (${entry.uuid}): session not found in DB`);
        skipped++;
        continue;
      }

      const session = sessionRows[0];

      if (!session.answers || !Array.isArray(session.answers)) {
        console.warn(`  SKIP ${entry.canonicalName} (${entry.uuid}): answers field empty or not an array`);
        skipped++;
        continue;
      }

      // Fetch demographics (optional — Daniel has none due to demographics-bug morning)
      // Schema is variable across migrations; SELECT * and strip PII at output time.
      let demographics: Record<string, unknown> | null = null;
      try {
        const demoRows = await sql<DemographicsRow[]>`
          SELECT * FROM demographics WHERE session_id = ${entry.uuid}
        `;
        if (demoRows.length > 0) {
          const d = demoRows[0];
          // Strip PII fields (contact_*, anything with "email" or "phone" or "mobile" in name)
          // and internal/audit fields (id, created_at, updated_at, *_id).
          const PII_FIELD_PATTERNS = /^(contact_|email|phone|mobile)/i;
          const INTERNAL_FIELD_PATTERNS = /^(id|session_id|created_at|updated_at|.*_id)$/i;
          demographics = {};
          for (const [key, value] of Object.entries(d)) {
            if (PII_FIELD_PATTERNS.test(key)) continue;
            if (INTERNAL_FIELD_PATTERNS.test(key)) continue;
            demographics[key] = value;
          }
        }
      } catch (demoErr) {
        // Demographics extraction is optional; continue without it.
        console.warn(`  WARN ${entry.canonicalName}: demographics fetch failed (${(demoErr as Error).message}). Continuing with answers only.`);
      }

      // Build fixture in the same shape as tests/fixtures/cohort/*.json
      const fixture = {
        label: `${entry.canonicalName} — real-person calibration anchor`,
        _source: `Extracted from prod session ${entry.uuid} on ${new Date().toISOString().slice(0, 10)}. ` +
                 `Real-person answers from the named cohort user. ` +
                 `Per feedback_cohort_fixtures_two_functions.md — this is a REAL-PERSON calibration anchor, ` +
                 `not a synthetic shape-pattern diagnostic.`,
        canonical_name: entry.canonicalName,
        prod_session_id: entry.uuid,
        extracted_at: new Date().toISOString(),
        answers: session.answers,
        demographics: demographics,
      };

      const filepath = join(fixturesDir, entry.filename);
      writeFileSync(filepath, JSON.stringify(fixture, null, 2) + "\n", "utf-8");
      console.log(`  OK   ${entry.canonicalName.padEnd(12)} → tests/fixtures/cohort-real/${entry.filename} (${(session.answers as unknown[]).length} answers)`);
      written++;
    } catch (err) {
      console.error(`  FAIL ${entry.canonicalName} (${entry.uuid}): ${(err as Error).message}`);
      skipped++;
    }
  }

  await sql.end();

  console.log("");
  console.log(`Wrote ${written}/${COHORT_MAPPING.length} fixtures. Skipped/failed: ${skipped}.`);

  if (written === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
