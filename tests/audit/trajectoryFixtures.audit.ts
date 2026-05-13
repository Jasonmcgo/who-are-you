// CC-TRAJECTORY-TEST-FIXTURES — fixture-validation audit.
//
// Verifies the 4 new `tests/fixtures/trajectory/` fixtures load cleanly,
// build through the engine, and hit the target signal combinations
// specified by docs/canon/trajectory-model-refinement.md §19. This CC's
// audits cover fixture SHAPE — strength-alignment audits live in
// CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT (Phase 1) and downstream phases.
//
// Hand-rolled. Invocation: `npx tsx tests/audit/trajectoryFixtures.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");
const FIXTURES_TRAJECTORY = join(REPO_ROOT, "tests", "fixtures", "trajectory");
const FIXTURES_OCEAN = join(REPO_ROOT, "tests", "fixtures", "ocean");
const FIXTURES_GSG = join(REPO_ROOT, "tests", "fixtures", "goal-soul-give");

const TRAJECTORY_FIXTURES = [
  "01-high-goal-high-cost-builder.json",
  "02-high-soul-high-coverage-caregiver.json",
  "03-high-compliance-wise-risk-steward.json",
  "04-high-stakes-low-defensive-grip-responsible-leader.json",
] as const;

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

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1: trajectory-fixtures-build-clean ───────────────────────────────
  const buildFails: string[] = [];
  const builtByFixture: Record<string, ReturnType<typeof buildInnerConstitution> | null> = {};
  for (const f of TRAJECTORY_FIXTURES) {
    try {
      builtByFixture[f] = buildFromFixture(FIXTURES_TRAJECTORY, f);
    } catch (e) {
      buildFails.push(`${f}: ${(e as Error).message}`);
      builtByFixture[f] = null;
    }
  }
  results.push(
    buildFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-fixtures-build-clean",
          detail: `all ${TRAJECTORY_FIXTURES.length} new fixtures built without throwing`,
        }
      : {
          ok: false,
          assertion: "trajectory-fixtures-build-clean",
          detail: `build errors: ${buildFails.join("; ")}`,
        }
  );

  // ── 2: trajectory-fixture-01-goal-high (Goal ≥ 75) ──────────────────
  const builder = builtByFixture["01-high-goal-high-cost-builder.json"];
  if (builder) {
    const goal = builder.goalSoulGive?.adjustedScores.goal ?? -1;
    const soul = builder.goalSoulGive?.adjustedScores.soul ?? -1;
    results.push(
      goal >= 75
        ? {
            ok: true,
            assertion: "trajectory-fixture-01-goal-high",
            detail: `goal=${goal} soul=${soul}`,
          }
        : {
            ok: false,
            assertion: "trajectory-fixture-01-goal-high",
            detail: `expected goal ≥ 75; got goal=${goal} (soul=${soul})`,
          }
    );
  } else {
    results.push({
      ok: false,
      assertion: "trajectory-fixture-01-goal-high",
      detail: "fixture 01 did not build (see trajectory-fixtures-build-clean)",
    });
  }

  // ── 3: trajectory-fixture-02-soul-high (Soul ≥ 75) ──────────────────
  const caregiver = builtByFixture["02-high-soul-high-coverage-caregiver.json"];
  if (caregiver) {
    const goal = caregiver.goalSoulGive?.adjustedScores.goal ?? -1;
    const soul = caregiver.goalSoulGive?.adjustedScores.soul ?? -1;
    results.push(
      soul >= 75
        ? {
            ok: true,
            assertion: "trajectory-fixture-02-soul-high",
            detail: `goal=${goal} soul=${soul}`,
          }
        : {
            ok: false,
            assertion: "trajectory-fixture-02-soul-high",
            detail: `expected soul ≥ 75; got soul=${soul} (goal=${goal})`,
          }
    );
  } else {
    results.push({
      ok: false,
      assertion: "trajectory-fixture-02-soul-high",
      detail: "fixture 02 did not build (see trajectory-fixtures-build-clean)",
    });
  }

  // ── 4: trajectory-fixture-03-conviction-high (belief.conviction_temperature === "high") ─
  const steward = builtByFixture["03-high-compliance-wise-risk-steward.json"];
  if (steward) {
    const belief = steward.belief_under_tension;
    const temp = belief?.conviction_temperature ?? "<missing>";
    results.push(
      temp === "high"
        ? {
            ok: true,
            assertion: "trajectory-fixture-03-conviction-high",
            detail: `conviction_temperature="high"`,
          }
        : {
            ok: false,
            assertion: "trajectory-fixture-03-conviction-high",
            detail: `expected conviction_temperature="high"; got "${temp}"`,
          }
    );
  } else {
    results.push({
      ok: false,
      assertion: "trajectory-fixture-03-conviction-high",
      detail: "fixture 03 did not build (see trajectory-fixtures-build-clean)",
    });
  }

  // ── 5: trajectory-fixture-04-stakes-heavy (Q-Stakes1 top-3 ⊇ {money, job, reputation}) ─
  const leader = builtByFixture["04-high-stakes-low-defensive-grip-responsible-leader.json"];
  if (leader) {
    const stakesSignals: Record<string, number> = {};
    for (const s of leader.signals) {
      if (
        s.source_question_ids.includes("Q-Stakes1") &&
        s.rank !== undefined &&
        ["money_stakes_priority", "job_stakes_priority", "reputation_stakes_priority"].includes(
          s.signal_id
        )
      ) {
        stakesSignals[s.signal_id] = s.rank;
      }
    }
    const moneyRank = stakesSignals.money_stakes_priority;
    const jobRank = stakesSignals.job_stakes_priority;
    const reputationRank = stakesSignals.reputation_stakes_priority;
    const allInTop3 =
      moneyRank !== undefined &&
      jobRank !== undefined &&
      reputationRank !== undefined &&
      moneyRank <= 3 &&
      jobRank <= 3 &&
      reputationRank <= 3;
    results.push(
      allInTop3
        ? {
            ok: true,
            assertion: "trajectory-fixture-04-stakes-heavy",
            detail: `money=${moneyRank} job=${jobRank} reputation=${reputationRank} (all ≤ 3)`,
          }
        : {
            ok: false,
            assertion: "trajectory-fixture-04-stakes-heavy",
            detail: `top-3 must include money, job, reputation; got money=${moneyRank ?? "?"} job=${jobRank ?? "?"} reputation=${reputationRank ?? "?"}`,
          }
    );
  } else {
    results.push({
      ok: false,
      assertion: "trajectory-fixture-04-stakes-heavy",
      detail: "fixture 04 did not build (see trajectory-fixtures-build-clean)",
    });
  }

  // ── 6: trajectory-fixtures-no-cohort-disruption ─────────────────────
  // The existing 24-fixture cohort (ocean/ + goal-soul-give/) continues
  // to build cleanly with no schema interference from the new fixtures.
  const cohortFails: string[] = [];
  let cohortCount = 0;
  for (const dir of [FIXTURES_OCEAN, FIXTURES_GSG]) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      cohortCount++;
      try {
        buildFromFixture(dir, f);
      } catch (e) {
        cohortFails.push(`${dir.split("/").pop()}/${f}: ${(e as Error).message}`);
      }
    }
  }
  results.push(
    cohortFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-fixtures-no-cohort-disruption",
          detail: `existing cohort (${cohortCount} fixtures) built cleanly`,
        }
      : {
          ok: false,
          assertion: "trajectory-fixtures-no-cohort-disruption",
          detail: `cohort build failures: ${cohortFails.join("; ")}`,
        }
  );

  return results;
}

function main(): number {
  console.log("CC-TRAJECTORY-TEST-FIXTURES — trajectory fixture-shape audit");
  console.log("==============================================================");
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
    "AUDIT PASSED — CC-TRAJECTORY-TEST-FIXTURES: all 4 new trajectory fixtures land on shape; cohort undisturbed."
  );
  return 0;
}

process.exit(main());
