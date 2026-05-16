// CC-085 audit — Grip Pattern card renders for every cohort fixture,
// including mixed-bucket sessions that previously fell to "low"
// confidence + legacy "omitted" proseMode.
//
// Five assertions per the CC spec:
//   1. Every cohort fixture under tests/fixtures/cohort/ produces a
//      non-null gripPattern on the materialized constitution.
//   2. Daniel-anchor proxy — at least one cohort fixture with the
//      danielType archetype routes to bucket "security" (the CC's
//      anchor refers to a prod session, not a fixture; the cohort
//      substitutes are si-tradition-steward + withdrawal-movement-
//      collapse).
//   3. Cindy-anchor proxy — at least one cohort fixture with the
//      cindyType archetype routes to bucket "belonging" (prod-Cindy
//      isn't in the fixture cohort; fi-quiet-resister is the
//      cindyType-archetype substitute).
//   4. At least 3 cohort fixtures route to medium-confidence — proves
//      the disambiguator chain (Primal/driver/compass) fires.
//   5. Render output for medium-confidence cases is non-empty — the
//      "## Your Grip" section + "**Grip Pattern:**" + "**Underlying
//      Question:**" lines all appear in the rendered markdown.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = join(__dirname, "..", "..");
const COHORT_DIR = join(REPO, "tests", "fixtures", "cohort");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

interface MaterializedFixture {
  file: string;
  constitution: InnerConstitution;
  rendered: string;
}

function loadCohort(): MaterializedFixture[] {
  const out: MaterializedFixture[] = [];
  for (const f of readdirSync(COHORT_DIR)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const raw = JSON.parse(readFileSync(join(COHORT_DIR, f), "utf-8")) as {
      answers?: Answer[];
      demographics?: DemographicSet | null;
    };
    const answers = raw.answers ?? [];
    const demographics = raw.demographics ?? null;
    const constitution = buildInnerConstitution(answers, [], demographics);
    const rendered = renderMirrorAsMarkdown({
      constitution,
      answers,
      demographics,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-13T00:00:00Z"),
      renderMode: "clinician",
    });
    out.push({ file: f, constitution, rendered });
  }
  return out;
}

function runAudit(): void {
  const results: AssertionResult[] = [];
  const cohort = loadCohort();

  // ── 1. Every cohort fixture has a non-null gripPattern ────────────
  {
    const missing = cohort.filter((c) => !c.constitution.gripPattern);
    results.push(
      missing.length === 0
        ? {
            ok: true,
            assertion: "every-cohort-fixture-has-grip-pattern",
            detail: `${cohort.length} cohort fixtures: every one has a non-null gripPattern`,
          }
        : {
            ok: false,
            assertion: "every-cohort-fixture-has-grip-pattern",
            detail: `missing on: ${missing.map((c) => c.file).join(", ")}`,
          }
    );
  }

  // ── 2. Daniel-anchor proxy: danielType archetype → bucket=security ─
  {
    const danielish = cohort.filter(
      (c) =>
        c.constitution.profileArchetype?.primary === "danielType" &&
        c.constitution.gripPattern?.bucket === "security"
    );
    results.push(
      danielish.length >= 1
        ? {
            ok: true,
            assertion: "daniel-anchor-proxy-security",
            detail: `${danielish.length} danielType cohort fixture(s) route to bucket=security: ${danielish.map((c) => c.file).join(", ")}`,
          }
        : {
            ok: false,
            assertion: "daniel-anchor-proxy-security",
            detail: `no danielType fixture routes to bucket=security`,
          }
    );
  }

  // ── 3. Cindy-anchor proxy: cindyType archetype → bucket=belonging ──
  {
    const cindyish = cohort.filter(
      (c) =>
        c.constitution.profileArchetype?.primary === "cindyType" &&
        c.constitution.gripPattern?.bucket === "belonging"
    );
    results.push(
      cindyish.length >= 1
        ? {
            ok: true,
            assertion: "cindy-anchor-proxy-belonging",
            detail: `${cindyish.length} cindyType cohort fixture(s) route to bucket=belonging: ${cindyish.map((c) => c.file).join(", ")}`,
          }
        : {
            ok: false,
            assertion: "cindy-anchor-proxy-belonging",
            detail: `no cindyType fixture routes to bucket=belonging`,
          }
    );
  }

  // ── 4. At least 3 cohort fixtures route to medium confidence ──────
  {
    const medium = cohort.filter(
      (c) => c.constitution.gripPattern?.confidence === "medium"
    );
    results.push(
      medium.length >= 3
        ? {
            ok: true,
            assertion: "at-least-three-medium-confidence-routes",
            detail: `${medium.length} cohort fixtures at medium confidence: ${medium.map((c) => c.file).join(", ")}`,
          }
        : {
            ok: false,
            assertion: "at-least-three-medium-confidence-routes",
            detail: `${medium.length}/3 cohort fixtures at medium confidence (need ≥3)`,
          }
    );
  }

  // ── 5. Render output for medium-confidence cases is non-empty ─────
  //   For every medium-confidence fixture, the rendered clinician
  //   markdown must contain the "## Your Grip" section header AND a
  //   "**Grip Pattern:**" line AND a "**Underlying Question:**" line.
  {
    const medium = cohort.filter(
      (c) => c.constitution.gripPattern?.confidence === "medium"
    );
    const failures: string[] = [];
    for (const c of medium) {
      const hasSection = c.rendered.includes("## Your Grip");
      const hasPattern = c.rendered.includes("**Grip Pattern:**");
      const hasQuestion = c.rendered.includes("**Underlying Question:**");
      if (!hasSection || !hasPattern || !hasQuestion) {
        failures.push(
          `${c.file} (section=${hasSection} pattern=${hasPattern} question=${hasQuestion})`
        );
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "medium-confidence-renders-non-empty",
            detail: `${medium.length} medium-confidence fixtures all emit "## Your Grip" + "**Grip Pattern:**" + "**Underlying Question:**"`,
          }
        : {
            ok: false,
            assertion: "medium-confidence-renders-non-empty",
            detail: failures.join(" | "),
          }
    );
  }

  // ── Report ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(`CC-085: ${passed}/${results.length} assertions passing.`);
  if (failed > 0) process.exit(1);
}

runAudit();
