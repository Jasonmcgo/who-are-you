// CC-STALE-SHAPE-DETECTOR — file-shape + behavior audit.
//
// Six assertions per the CC §"Item 6":
//   1. lib/staleShape.ts exports the four required symbols.
//   2. db/schema.ts exports sessions.engine_shape_version.
//   3. db/migrations/0004_*.sql exists with the ADD COLUMN statement.
//   4. Three synthetic stale-shape fixtures (inline, not on disk) each
//      route through the detector and produce the expected branch
//      outcome: fresh, re-derivable, un-rerenderable.
//   5. app/report/[sessionId]/page.tsx does not call buildInnerConstitution
//      unconditionally — the detector check precedes the call.
//   6. lib/staleShape.ts contains no import from any lib/*LlmServer.ts
//      module (engine-only re-derivation).
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/staleShapeDetector.audit.ts`.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ENGINE_SHAPE_VERSION,
  detectStaleShape,
  hashEngineShape,
  isFreshConstitution,
} from "../../lib/staleShape";
import type { InnerConstitution } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1: lib/staleShape.ts exports required symbols ─────────────────
  const staleBody = readFile(join(REPO_ROOT, "lib", "staleShape.ts"));
  const requiredExports = [
    "ENGINE_SHAPE_VERSION",
    "hashEngineShape",
    "isFreshConstitution",
    "StaleShapeReason",
  ];
  const missingExports = requiredExports.filter((s) => {
    if (!staleBody) return true;
    return !new RegExp(`export\\s+(?:const|function|type|interface)\\s+${s}\\b`).test(
      staleBody
    );
  });
  results.push(
    staleBody !== null && missingExports.length === 0
      ? {
          ok: true,
          assertion: "stale-shape-module-exports-required-symbols",
          detail: `lib/staleShape.ts exports all 4 required symbols (${requiredExports.join(", ")})`,
        }
      : {
          ok: false,
          assertion: "stale-shape-module-exports-required-symbols",
          detail:
            staleBody === null
              ? "lib/staleShape.ts is missing"
              : `missing exports: ${missingExports.join(", ")}`,
        }
  );

  // ── 2: db/schema.ts exports sessions.engine_shape_version ────────
  const schemaBody = readFile(join(REPO_ROOT, "db", "schema.ts"));
  const hasColumn =
    schemaBody !== null &&
    /engine_shape_version:\s*integer\(\s*"engine_shape_version"\s*\)/.test(schemaBody);
  results.push(
    hasColumn
      ? {
          ok: true,
          assertion: "stale-shape-schema-column-present",
          detail: `db/schema.ts declares sessions.engine_shape_version as integer`,
        }
      : {
          ok: false,
          assertion: "stale-shape-schema-column-present",
          detail: `engine_shape_version column not found in db/schema.ts`,
        }
  );

  // ── 3: db/migrations/0004_*.sql ADD COLUMN ───────────────────────
  const migDir = join(REPO_ROOT, "db", "migrations");
  let migration0004: string | null = null;
  let migrationName = "";
  if (existsSync(migDir)) {
    const found = readdirSync(migDir).filter((f) => f.startsWith("0004_") && f.endsWith(".sql"));
    if (found.length > 0) {
      migrationName = found[0];
      migration0004 = readFile(join(migDir, migrationName));
    }
  }
  const migrationOk =
    migration0004 !== null &&
    /ALTER\s+TABLE\s+"sessions"\s+ADD\s+COLUMN\s+"engine_shape_version"\s+integer/i.test(
      migration0004
    );
  results.push(
    migrationOk
      ? {
          ok: true,
          assertion: "stale-shape-migration-add-column-present",
          detail: `db/migrations/${migrationName} contains the ADD COLUMN engine_shape_version statement`,
        }
      : {
          ok: false,
          assertion: "stale-shape-migration-add-column-present",
          detail:
            migration0004 === null
              ? `db/migrations/0004_*.sql not found`
              : `ADD COLUMN engine_shape_version statement not found in ${migrationName}`,
        }
  );

  // ── 4: three synthetic fixtures route to expected branches ──────
  // Fresh fixture: full bands + matching version. detectStaleShape
  // returns branch=fresh.
  const freshConstitution = {
    signals: [],
    lens_stack: { dominant: "ni", auxiliary: "te" },
    shape_outputs: { path: {} },
    mirror: { shapeInOneSentence: "fresh test" },
    meta_signals: [],
    ocean: {
      dispositionSignalMix: {
        bands: {
          openness: "high",
          conscientiousness: "high",
          extraversion: "moderate",
          agreeableness: "moderate-high",
          emotionalReactivity: "low",
        },
      },
    },
  } as unknown as InnerConstitution;
  const freshVerdict = detectStaleShape({
    sessionId: "fresh-test",
    engineShapeVersion: ENGINE_SHAPE_VERSION,
    innerConstitution: freshConstitution,
    answers: [],
  });
  // Re-derivable fixture: version null, missing bands, answers present.
  const staleConstitution = {
    signals: [],
    lens_stack: { dominant: "ni", auxiliary: "te" },
    shape_outputs: { path: {} },
    mirror: { shapeInOneSentence: "stale test" },
    meta_signals: [],
    ocean: { dispositionSignalMix: {} }, // bands missing
  } as unknown as InnerConstitution;
  // Audit answers shape uses ranking type for Q-E1-outward so the type checker is happy.
  const reDerivableVerdict = detectStaleShape({
    sessionId: "re-derivable-test",
    engineShapeVersion: null,
    innerConstitution: staleConstitution,
    answers: [
      {
        question_id: "Q-E1-outward",
        card_id: "sacred",
        question_text: "outward energy",
        type: "ranking",
        order: ["building", "solving", "restoring"],
      },
    ],
  });
  // Un-rerenderable fixture: version null, missing bands, no answers.
  const unRerenderableVerdict = detectStaleShape({
    sessionId: "un-rerenderable-test",
    engineShapeVersion: null,
    innerConstitution: staleConstitution,
    answers: [],
  });
  const branchExpectations = [
    { name: "fresh", actual: freshVerdict.branch, expected: "fresh" as const },
    { name: "re-derivable", actual: reDerivableVerdict.branch, expected: "re-derivable" as const },
    {
      name: "un-rerenderable",
      actual: unRerenderableVerdict.branch,
      expected: "un-rerenderable" as const,
    },
  ];
  const branchFailures = branchExpectations.filter(
    (b) => b.actual !== b.expected
  );
  results.push(
    branchFailures.length === 0
      ? {
          ok: true,
          assertion: "stale-shape-three-fixture-branch-routing",
          detail: `all three synthetic fixtures routed to expected branches (fresh / re-derivable / un-rerenderable)`,
        }
      : {
          ok: false,
          assertion: "stale-shape-three-fixture-branch-routing",
          detail: branchFailures
            .map((b) => `${b.name}: expected ${b.expected}, got ${b.actual}`)
            .join("; "),
        }
  );

  // ── 5: report route has detector check before engine call ───────
  const reportBody = readFile(
    join(REPO_ROOT, "app", "report", "[sessionId]", "page.tsx")
  );
  const reportOk =
    reportBody !== null &&
    /detectStaleShape\s*\(/.test(reportBody) &&
    // Specifically: the detector call MUST appear before the
    // buildInnerConstitution call in the file (DOM order check).
    (() => {
      const detectIdx = reportBody.indexOf("detectStaleShape(");
      const buildIdx = reportBody.indexOf("buildInnerConstitution(");
      return (
        detectIdx >= 0 && (buildIdx < 0 || detectIdx < buildIdx)
      );
    })();
  results.push(
    reportOk
      ? {
          ok: true,
          assertion: "stale-shape-report-route-has-detector-before-engine",
          detail: `app/report/[sessionId]/page.tsx calls detectStaleShape before any buildInnerConstitution invocation`,
        }
      : {
          ok: false,
          assertion: "stale-shape-report-route-has-detector-before-engine",
          detail: `detector check missing or comes after the engine call in the report route`,
        }
  );

  // ── 6: detector module contains no *LlmServer import ────────────
  const llmServerImport =
    staleBody !== null && /from\s+["'][^"']*LlmServer["']/.test(staleBody);
  results.push(
    !llmServerImport
      ? {
          ok: true,
          assertion: "stale-shape-no-llm-server-import",
          detail: `lib/staleShape.ts imports nothing from any *LlmServer module — re-derivation is engine-only`,
        }
      : {
          ok: false,
          assertion: "stale-shape-no-llm-server-import",
          detail: `forbidden *LlmServer import found in lib/staleShape.ts`,
        }
  );

  // ── Bonus: hashEngineShape is deterministic + schema-not-content ─
  // Verify two constitutions with identical structure but different
  // values hash identically; verify two with different structure
  // hash differently. Informational PASS (not in the CC's 6-assertion
  // list, but lock the schema-hash semantic).
  const sameSchemaA = hashEngineShape(freshConstitution);
  const sameSchemaB = hashEngineShape({
    ...freshConstitution,
    mirror: { shapeInOneSentence: "different value" },
  } as unknown as InnerConstitution);
  const diffSchema = hashEngineShape(staleConstitution);
  results.push(
    sameSchemaA === sameSchemaB && sameSchemaA !== diffSchema
      ? {
          ok: true,
          assertion: "stale-shape-hash-schema-not-content",
          detail: `hashEngineShape ignores values, hashes by keyset+type shape`,
        }
      : {
          ok: false,
          assertion: "stale-shape-hash-schema-not-content",
          detail: `hash semantics broken: sameSchemaA=${sameSchemaA.slice(0, 30)}… sameSchemaB=${sameSchemaB.slice(0, 30)}… diffSchema=${diffSchema.slice(0, 30)}…`,
        }
  );

  // ── Bonus: isFreshConstitution predicate spot-check ──────────────
  results.push(
    isFreshConstitution(freshConstitution) === true &&
      isFreshConstitution(staleConstitution) === false &&
      isFreshConstitution(null) === false &&
      isFreshConstitution("not an object") === false
      ? {
          ok: true,
          assertion: "stale-shape-predicate-spot-check",
          detail: `isFreshConstitution accepts the fresh fixture, rejects stale + null + non-object`,
        }
      : {
          ok: false,
          assertion: "stale-shape-predicate-spot-check",
          detail: `predicate misclassifies one or more of: fresh, stale-missing-bands, null, non-object`,
        }
  );

  return results;
}

function main(): number {
  console.log("CC-STALE-SHAPE-DETECTOR — file-shape + behavior audit");
  console.log("========================================================");
  const results = runAudit();
  let failures = 0;
  for (const r of results) {
    const status = r.ok ? "PASS" : "FAIL";
    const detail = r.detail ? ` — ${r.detail}` : "";
    console.log(`[${status}] ${r.assertion}${detail}`);
    if (!r.ok) failures++;
  }
  console.log("");
  if (failures > 0) {
    console.error(`AUDIT FAILED — ${failures} assertion failure(s).`);
    return 1;
  }
  console.log(
    "AUDIT PASSED — stale-shape detector module + schema column + migration + report-route gate + three-branch routing all in place."
  );
  return 0;
}

process.exit(main());
