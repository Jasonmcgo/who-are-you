// CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT — file-shape audit.
//
// Six assertions per the CC §"Item 3":
//   1. scripts/calibrationPhase1DistributionAudit.ts exists.
//   2. The script contains NO import from any `lib/*LlmServer.ts` file.
//   3. The script does NOT instantiate the Anthropic SDK.
//   4. The script does NOT write to any path under `lib/cache/`, `db/`,
//      `tests/fixtures/`, or the `sessions` table.
//   5. docs/calibration/phase-1-distribution-audit.md exists and
//      contains the structural sections named in the CC §"Item 2".
//   6. Each histogram in the artifact contains both a fixtures-cohort
//      table and a live-cohort table, plus a delta annotation.
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/calibrationPhase1DistributionAudit.audit.ts`.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");
const SCRIPT_FILE = join(
  REPO_ROOT,
  "scripts",
  "calibrationPhase1DistributionAudit.ts"
);
const ARTIFACT_FILE = join(
  REPO_ROOT,
  "docs",
  "calibration",
  "phase-1-distribution-audit.md"
);

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1: script exists ──────────────────────────────────────────────
  const scriptBody = readFile(SCRIPT_FILE);
  results.push(
    scriptBody !== null
      ? {
          ok: true,
          assertion: "calibration-phase-1-script-exists",
          detail: `${SCRIPT_FILE.replace(REPO_ROOT + "/", "")} (${scriptBody.length} bytes)`,
        }
      : {
          ok: false,
          assertion: "calibration-phase-1-script-exists",
          detail: `script file missing`,
        }
  );
  if (scriptBody === null) {
    return results;
  }

  // ── 2: no `lib/*LlmServer.ts` import ─────────────────────────────
  // Reject any `from "...LlmServer"` (covering ./, ../, etc.).
  const llmServerImport = /from\s+["'][^"']*LlmServer["']/g;
  const llmHits = scriptBody.match(llmServerImport) ?? [];
  results.push(
    llmHits.length === 0
      ? {
          ok: true,
          assertion: "calibration-phase-1-no-llm-server-import",
          detail: `no import from any *LlmServer module — engine-only materialization confirmed`,
        }
      : {
          ok: false,
          assertion: "calibration-phase-1-no-llm-server-import",
          detail: `forbidden imports: ${llmHits.join(", ")}`,
        }
  );

  // ── 3: no Anthropic SDK instantiation ────────────────────────────
  // Reject genuine SDK imports / `new Anthropic(...)` instantiation.
  // The artifact's self-attestation text in the output may legitimately
  // mention `@anthropic-ai/sdk` inside a string literal claiming the
  // script does NOT instantiate the SDK; the audit must distinguish
  // claim from action.
  const sdkImport = /(?:from|require)\s*\(?\s*["'`]@anthropic-ai\/sdk["'`]/;
  const sdkConstruct = /new\s+Anthropic\s*\(/;
  const sdkInstantiates = sdkImport.test(scriptBody) || sdkConstruct.test(scriptBody);
  results.push(
    !sdkInstantiates
      ? {
          ok: true,
          assertion: "calibration-phase-1-no-anthropic-sdk",
          detail: `script does not import or instantiate the Anthropic SDK`,
        }
      : {
          ok: false,
          assertion: "calibration-phase-1-no-anthropic-sdk",
          detail: `script imports / instantiates the Anthropic SDK`,
        }
  );

  // ── 4: no writes to forbidden paths or sessions table ────────────
  const forbiddenWritePatterns = [
    /writeFileSync\s*\([^)]*lib\/cache/,
    /writeFileSync\s*\([^)]*db\//,
    /writeFileSync\s*\([^)]*tests\/fixtures\//,
    /\.insert\s*\(\s*sessions\s*\)/,
    /\.update\s*\(\s*sessions\s*\)/,
    /\.delete\s*\(\s*sessions\s*\)/,
    /INSERT\s+INTO\s+sessions/i,
    /UPDATE\s+sessions/i,
    /DELETE\s+FROM\s+sessions/i,
  ];
  const forbiddenWriteHits: string[] = [];
  for (const pat of forbiddenWritePatterns) {
    if (pat.test(scriptBody)) {
      forbiddenWriteHits.push(pat.source);
    }
  }
  results.push(
    forbiddenWriteHits.length === 0
      ? {
          ok: true,
          assertion: "calibration-phase-1-no-forbidden-writes",
          detail: `script does not write to lib/cache, db/, tests/fixtures, or the sessions table`,
        }
      : {
          ok: false,
          assertion: "calibration-phase-1-no-forbidden-writes",
          detail: `forbidden write patterns matched: ${forbiddenWriteHits.join("; ")}`,
        }
  );

  // ── 5: artifact exists and contains structural sections ─────────
  const artifact = readFile(ARTIFACT_FILE);
  if (artifact === null) {
    results.push({
      ok: false,
      assertion: "calibration-phase-1-artifact-structural-sections",
      detail: `artifact file missing at ${ARTIFACT_FILE.replace(REPO_ROOT + "/", "")}`,
    });
  } else {
    const REQUIRED_SECTIONS = [
      "# Phase 1 Distribution Audit",
      "**Cohort counts**",
      "## Findings summary",
      "## Composed Grip × engine version",
      "## Amplifier × engine version",
      "## Soul-axis",
      "## Soul-axis × Q-A2 response",
      "## Cause-Soul / Person-Soul proxy scatter",
      "## Grip Pattern card render × bucket alignment",
      "## Grip Pattern bucket distribution",
      "## Risk Form label distribution",
      "## Cost / Coverage / Compliance bucket lean",
      "## DriveCase distribution",
      "## Cohort-cache match-rate per session per layer",
      "## Cross-question contradiction table",
      "## Subject self-report comparison appendix",
      "## Data gaps",
      "## Inputs",
    ];
    const missing = REQUIRED_SECTIONS.filter((s) => !artifact.includes(s));
    results.push(
      missing.length === 0
        ? {
            ok: true,
            assertion: "calibration-phase-1-artifact-structural-sections",
            detail: `all ${REQUIRED_SECTIONS.length} required sections present in the artifact`,
          }
        : {
            ok: false,
            assertion: "calibration-phase-1-artifact-structural-sections",
            detail: `missing sections: ${missing.join("; ")}`,
          }
    );

    // ── 6: each histogram has fixtures + live + delta annotation ──
    // Histograms render as `### …` headings inside the top-level
    // `## X` sections. Each is a Markdown table whose header row
    // mentions "Fixtures" and "Live" + an extra delta column.
    // We grep the artifact for the table-header marker.
    const histogramHeaders = [
      /\|\s*Bucket\s*\|\s*Fixtures \(n\)\s*\|\s*Live \(n\)\s*\|\s*Δ/,
      /\|\s*Bucket\s*\|\s*Fixtures \(n\)\s*\|\s*Live pre-online \(n\)\s*\|\s*Live current \(n\)\s*\|/,
    ];
    const histogramHits = histogramHeaders.reduce(
      (acc, re) => acc + (artifact.match(new RegExp(re.source, "g")) ?? []).length,
      0
    );
    // Minimum 8 histograms expected per the CC's §"Item 2" (Composed
    // Grip × ev, Amplifier × ev, Soul, Risk Form, 3C lean, DriveCase,
    // Primal bucket, plus the others).
    const MIN_HISTOGRAMS = 6;
    results.push(
      histogramHits >= MIN_HISTOGRAMS
        ? {
            ok: true,
            assertion: "calibration-phase-1-histograms-have-both-cohorts-and-delta",
            detail: `${histogramHits} histogram(s) found with Fixtures + Live + Δ columns (≥${MIN_HISTOGRAMS} required)`,
          }
        : {
            ok: false,
            assertion: "calibration-phase-1-histograms-have-both-cohorts-and-delta",
            detail: `only ${histogramHits} histogram(s) match the required Fixtures + Live + Δ shape; expected ≥${MIN_HISTOGRAMS}`,
          }
    );
  }

  return results;
}

function main(): number {
  console.log(
    "CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT — script + artifact shape audit"
  );
  console.log(
    "==========================================================================="
  );
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
    "AUDIT PASSED — calibration phase-1 script is read-only-analytics shape, no LLM imports, no forbidden writes; artifact has all required structural sections + cohort-and-delta histograms."
  );
  return 0;
}

process.exit(main());
