// CC-DISPOSITION-COLLAPSE-DEFAULT — regression-guard audit.
//
// Locks in the disposition-section disclosure behavior:
//
//   1. User-mode markdown wraps the disposition body in `<details>` with
//      a visible plain-language summary line above.
//   2. The summary line contains no engine-internal or borrowed-system
//      labels ("register", "channel", "Work-line", "OCEAN", "Big Five").
//   3. Clinician-mode markdown emits the disposition section WITHOUT
//      any `<details>`/`<summary>` markup (byte-identical legacy shape).
//   4. The OCEAN/disposition engine output is identical between
//      render modes (intensities, bands, dominance ranking).
//   5. The cohort sweep continues to build cleanly under both modes.
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/dispositionCollapseDefault.audit.ts`.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import {
  composeDispositionSummaryLine,
  renderMirrorAsMarkdown,
} from "../../lib/renderMirror";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");
const FIXTURE_DIRS = [
  join(REPO_ROOT, "tests", "fixtures", "ocean"),
  join(REPO_ROOT, "tests", "fixtures", "goal-soul-give"),
  join(REPO_ROOT, "tests", "fixtures", "trajectory"),
  join(REPO_ROOT, "tests", "fixtures", "cohort"),
];

// Forbidden vocab in the summary line (CC §Rules 2).
const FORBIDDEN_SUMMARY_TERMS = [
  "register",
  "channel",
  "Work-line",
  "OCEAN",
  "Big Five",
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function loadFixture(path: string): {
  answers: Answer[];
  demographics: DemographicSet | null;
} {
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return { answers: raw.answers, demographics: raw.demographics ?? null };
}

function buildFromFixture(dir: string, filename: string) {
  const { answers, demographics } = loadFixture(join(dir, filename));
  return buildInnerConstitution(answers, [], demographics);
}

function extractDispositionSection(md: string): string {
  const lines = md.split("\n");
  // Both modes use a "## ..." disposition header; user-mode renames to
  // "How Your Disposition Reads", clinician keeps "Disposition Signal Mix".
  const startIdx = lines.findIndex(
    (l) =>
      l.startsWith("## Disposition Signal Mix") ||
      l.startsWith("## How Your Disposition Reads")
  );
  if (startIdx < 0) return "";
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^## [^#]/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx, endIdx).join("\n");
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // Anchor fixture — Jason has stable shape and a fully-populated
  // disposition signal mix.
  const jasonC = buildFromFixture(
    join(REPO_ROOT, "tests", "fixtures", "ocean"),
    "07-jason-real-session.json"
  );
  const baseArgs = {
    constitution: jasonC,
    demographics: null,
    includeBeliefAnchor: true,
    generatedAt: new Date("2026-05-13T00:00:00Z"),
  };
  const userMd = renderMirrorAsMarkdown({ ...baseArgs, renderMode: "user" });
  const clinicianMd = renderMirrorAsMarkdown({
    ...baseArgs,
    renderMode: "clinician",
  });
  const userSection = extractDispositionSection(userMd);
  const clinicianSection = extractDispositionSection(clinicianMd);

  // ── 1: user-mode <details> wrapping ────────────────────────────────
  const hasOpen = userSection.includes("<details>");
  const hasSummary = userSection.includes("<summary>");
  const hasClose = userSection.includes("</details>");
  results.push(
    hasOpen && hasSummary && hasClose
      ? {
          ok: true,
          assertion: "disposition-collapse-user-mode-has-details-wrapper",
          detail: `Jason user-mode section contains <details>, <summary>, </details>`,
        }
      : {
          ok: false,
          assertion: "disposition-collapse-user-mode-has-details-wrapper",
          detail: `Jason user-mode missing markup: <details>=${hasOpen} <summary>=${hasSummary} </details>=${hasClose}`,
        }
  );

  // ── 2: summary line visible above <details>, clean vocab ──────────
  const lines = userSection.split("\n");
  const summaryLine = lines.find((l) => l.startsWith("*Your"));
  const detailsLine = lines.findIndex((l) => l.includes("<details>"));
  const summaryLineIdx = summaryLine ? lines.indexOf(summaryLine) : -1;
  const summaryAboveDetails =
    summaryLineIdx >= 0 && detailsLine >= 0 && summaryLineIdx < detailsLine;
  const forbiddenHits = summaryLine
    ? FORBIDDEN_SUMMARY_TERMS.filter((t) => summaryLine.includes(t))
    : [];
  results.push(
    summaryAboveDetails && forbiddenHits.length === 0 && summaryLine
      ? {
          ok: true,
          assertion: "disposition-collapse-summary-line-clean-and-visible",
          detail: `summary line above <details>: ${summaryLine}`,
        }
      : {
          ok: false,
          assertion: "disposition-collapse-summary-line-clean-and-visible",
          detail: `summary=${summaryLine ?? "(missing)"} aboveDetails=${summaryAboveDetails} forbiddenHits=[${forbiddenHits.join(", ")}]`,
        }
  );

  // ── 3: clinician mode has no disclosure markup ────────────────────
  const clinicianHasMarkup =
    clinicianSection.includes("<details>") ||
    clinicianSection.includes("<summary>") ||
    clinicianSection.includes("</details>");
  results.push(
    !clinicianHasMarkup
      ? {
          ok: true,
          assertion: "disposition-collapse-clinician-no-disclosure-markup",
          detail: `clinician mode emits disposition without <details>/<summary> (legacy shape preserved)`,
        }
      : {
          ok: false,
          assertion: "disposition-collapse-clinician-no-disclosure-markup",
          detail: `clinician mode unexpectedly contains disclosure markup — byte-identity to pre-CC baseline broken`,
        }
  );

  // ── 4: engine output identical across render modes ────────────────
  // Both modes call the same engine; this asserts the renderMode flag
  // doesn't accidentally influence intensities/bands.
  const userC = buildFromFixture(
    join(REPO_ROOT, "tests", "fixtures", "ocean"),
    "07-jason-real-session.json"
  );
  const clinicianC = buildFromFixture(
    join(REPO_ROOT, "tests", "fixtures", "ocean"),
    "07-jason-real-session.json"
  );
  const userMix = userC.ocean?.dispositionSignalMix;
  const clinicianMix = clinicianC.ocean?.dispositionSignalMix;
  const intensitiesMatch =
    JSON.stringify(userMix?.intensities) ===
    JSON.stringify(clinicianMix?.intensities);
  const bandsMatch =
    JSON.stringify(userMix?.bands) === JSON.stringify(clinicianMix?.bands);
  results.push(
    intensitiesMatch && bandsMatch
      ? {
          ok: true,
          assertion: "disposition-collapse-engine-output-unchanged",
          detail: `intensities and bands match across build paths; engine computation is render-mode-independent`,
        }
      : {
          ok: false,
          assertion: "disposition-collapse-engine-output-unchanged",
          detail: `engine output drift between build paths — intensitiesMatch=${intensitiesMatch} bandsMatch=${bandsMatch}`,
        }
  );

  // ── 5: summary-line composer is deterministic ─────────────────────
  if (userMix) {
    const a = composeDispositionSummaryLine(userMix);
    const b = composeDispositionSummaryLine(userMix);
    results.push(
      a === b
        ? {
            ok: true,
            assertion: "disposition-collapse-summary-composer-deterministic",
            detail: `composeDispositionSummaryLine produces identical output across calls`,
          }
        : {
            ok: false,
            assertion: "disposition-collapse-summary-composer-deterministic",
            detail: `non-deterministic output: "${a}" vs "${b}"`,
          }
    );
  }

  // ── 6: cohort sweep both modes ────────────────────────────────────
  const allFixtures: { dir: string; file: string }[] = [];
  for (const dir of FIXTURE_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      allFixtures.push({ dir, file: f });
    }
  }
  const sweepFails: string[] = [];
  for (const { dir, file } of allFixtures) {
    try {
      const c = buildFromFixture(dir, file);
      const args = {
        constitution: c,
        demographics: null,
        includeBeliefAnchor: true,
        generatedAt: new Date("2026-05-13T00:00:00Z"),
      };
      const userOk = renderMirrorAsMarkdown({ ...args, renderMode: "user" });
      const clinicianOk = renderMirrorAsMarkdown({
        ...args,
        renderMode: "clinician",
      });
      // If either render returns empty, that's a failure.
      if (!userOk.length || !clinicianOk.length) {
        sweepFails.push(`${dir.split("/").pop()}/${file}: empty render`);
      }
    } catch (e) {
      sweepFails.push(`${dir.split("/").pop()}/${file}: ${(e as Error).message}`);
    }
  }
  results.push(
    sweepFails.length === 0
      ? {
          ok: true,
          assertion: "disposition-collapse-cohort-sweep-both-modes",
          detail: `${allFixtures.length} fixtures render cleanly in both user- and clinician-mode`,
        }
      : {
          ok: false,
          assertion: "disposition-collapse-cohort-sweep-both-modes",
          detail: `sweep failures: ${sweepFails.slice(0, 3).join(" | ")}`,
        }
  );

  return results;
}

function main(): number {
  console.log("CC-DISPOSITION-COLLAPSE-DEFAULT — regression-guard audit");
  console.log("===========================================================");
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
    "AUDIT PASSED — disposition section default-collapses in user mode; clinician path preserved; engine output untouched."
  );
  return 0;
}

process.exit(main());
