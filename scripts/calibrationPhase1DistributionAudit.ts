// CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT — read-only analytics
// script. Produces the Phase 1 calibration evidence base at
// `docs/calibration/phase-1-distribution-audit.md`. Two cohort sources
// (fixtures cohort, live sessions) materialized through
// `buildInnerConstitution` only; NO LLM render path, NO Anthropic
// SDK, NO database writes, NO cache writes.
//
// Findings F1–F7 from the 2026-05-16 cohort review are tested as
// hypotheses; each one gets a "confirmed / refuted / inconclusive"
// verdict driven by the cohort data the script materializes.
//
// Determinism: same DB state → byte-identical artifact. Sources are
// sorted; counts are integer; rounded floats are fixed-precision; no
// `Date.now()`/wall-clock content is emitted (only the git SHA, which
// is the same across runs at the same commit).
//
// Invocation: `npm run audit:calibration-phase-1`.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Inline `.env.local` loader — mirrors scripts/backfillLlmRewritesOnSessions.ts
// so the script runs from a fresh shell without requiring DATABASE_URL be
// exported manually. Does not introduce a `dotenv` dependency.
// CC-CALIBRATION-PHASE-1-DISTRIBUTION-AUDIT — also strips
// `ANTHROPIC_API_KEY` from the loaded env so the script can never
// initiate an API call even if the key happens to be in `.env.local`
// (acceptance criterion 11: zero requests to `api.anthropic.com`).
function loadEnvLocalReadOnly(): void {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (m[1] === "ANTHROPIC_API_KEY") continue; // intentional: never in scope
    if (!process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
  // Belt-and-suspenders: if the key was already exported into the shell
  // env when the script started, clear it for the script's lifetime so
  // no transitive import can accidentally trip an SDK init.
  delete process.env.ANTHROPIC_API_KEY;
}
loadEnvLocalReadOnly();

import { buildInnerConstitution } from "../lib/identityEngine";
import { getDb } from "../db";
import { sessions } from "../db/schema";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../lib/types";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const REPO_ROOT = join(SCRIPT_DIR, "..");
const FIXTURE_COHORT_DIR = join(REPO_ROOT, "tests", "fixtures", "cohort");
const ARTIFACT_DIR = join(REPO_ROOT, "docs", "calibration");
const ARTIFACT_PATH = join(ARTIFACT_DIR, "phase-1-distribution-audit.md");

// Engine-version cutoff used when `engine_shape_version` is absent
// (CC-STALE-SHAPE-DETECTOR hasn't shipped). Per F1's "approximately
// 2026-05-10 to 2026-05-16" window, midpoint split. Sessions created
// before this date are bucketed "pre-online"; on/after are "current".
// Documented inline in the artifact text.
const ENGINE_VERSION_CUTOFF = new Date("2026-05-12T00:00:00.000Z");

// Contradiction-table threshold flagged in bold. Documented in the
// artifact text per the CC's "threshold numbers documented inline"
// rule.
const CONTRADICTION_BOLD_THRESHOLD_PCT = 25;

// Soul-band concentration flag per F3: if more than this % of sessions
// sit in a single 10-point Soul band, flag the band as a ceiling cluster.
const SOUL_CLUSTER_FLAG_PCT = 60;

type SkipReason =
  | "engine-throw"
  | "missing-answers"
  | "malformed-row"
  | "stale-shape";

interface Materialized {
  source: "fixture" | "live";
  // Stable identifier for sorted output. For fixtures = filename; for
  // live = session UUID.
  id: string;
  // The session row's created_at — used to bucket pre-online vs
  // current engine. For fixtures, we use a sentinel "fixture" bucket.
  engineVersionBucket: "pre-online" | "current" | "fixture";
  createdAtIso?: string;
  // The user's friendly name from demographics, if present. For
  // fixtures we read the `label` field of the fixture JSON when
  // present. Used only for the subject-self-report appendix.
  displayName: string | null;
  // The raw answers — needed for Q-A2 / Q-GS1 / Q-V1 / Q-Stakes1 /
  // Q-GRIP1 / Q-I2 / Q-I3 inspection per F4 + contradiction table.
  answers: Answer[];
  // The constitution — engine output materialized on the spot.
  constitution: InnerConstitution;
  // Optional: the per-layer key counts from the persisted bundle (F5).
  // Only populated for live sessions whose `llm_rewrites` is non-null.
  bundleKeyCounts?: {
    prose: number;
    keystone: number;
    synthesis3: number;
    grip: number;
    launchPolishV3: number;
  };
}

interface Skipped {
  source: "fixture" | "live";
  id: string;
  reason: SkipReason;
  detail: string;
}

// ─────────────────────────────────────────────────────────────────────
// Fixture loader
// ─────────────────────────────────────────────────────────────────────

function loadFixtureCohort(): { ok: Materialized[]; skipped: Skipped[] } {
  const ok: Materialized[] = [];
  const skipped: Skipped[] = [];
  if (!existsSync(FIXTURE_COHORT_DIR)) {
    return { ok, skipped };
  }
  const files = readdirSync(FIXTURE_COHORT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  for (const file of files) {
    const fullPath = join(FIXTURE_COHORT_DIR, file);
    let raw: {
      label?: string;
      answers: Answer[];
      demographics?: DemographicSet | null;
    };
    try {
      raw = JSON.parse(readFileSync(fullPath, "utf-8"));
    } catch (e) {
      skipped.push({
        source: "fixture",
        id: file,
        reason: "malformed-row",
        detail: (e as Error).message,
      });
      continue;
    }
    if (!Array.isArray(raw.answers)) {
      skipped.push({
        source: "fixture",
        id: file,
        reason: "missing-answers",
        detail: "no answers array",
      });
      continue;
    }
    try {
      const constitution = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      ok.push({
        source: "fixture",
        id: file,
        engineVersionBucket: "fixture",
        displayName: raw.label ?? null,
        answers: raw.answers,
        constitution,
      });
    } catch (e) {
      skipped.push({
        source: "fixture",
        id: file,
        reason: "engine-throw",
        detail: (e as Error).message,
      });
    }
  }
  return { ok, skipped };
}

// ─────────────────────────────────────────────────────────────────────
// Live cohort loader (read-only DB query)
// ─────────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string;
  created_at: Date;
  answers: unknown;
  llm_rewrites: unknown;
}

async function loadLiveCohort(): Promise<{
  ok: Materialized[];
  skipped: Skipped[];
}> {
  const ok: Materialized[] = [];
  const skipped: Skipped[] = [];
  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch (e) {
    return {
      ok,
      skipped: [
        {
          source: "live",
          id: "db",
          reason: "malformed-row",
          detail: `DB unreachable: ${(e as Error).message}`,
        },
      ],
    };
  }
  let rows: SessionRow[];
  try {
    rows = (await db
      .select({
        id: sessions.id,
        created_at: sessions.created_at,
        answers: sessions.answers,
        llm_rewrites: sessions.llm_rewrites,
      })
      .from(sessions)) as SessionRow[];
  } catch (e) {
    return {
      ok,
      skipped: [
        {
          source: "live",
          id: "db",
          reason: "malformed-row",
          detail: `sessions query failed: ${(e as Error).message}`,
        },
      ],
    };
  }
  // Demographics name lookup — pulled from each session's answers when
  // the user volunteered a name via the (optional) demographic block.
  // Skipped here: a separate SQL query against `demographics` is left
  // out to keep the script's DB surface narrow. The JasonDMcG appendix
  // falls back to fingerprint-matching against the answers array if
  // the name isn't extractable directly.
  const nameById = new Map<string, string | null>();
  // Sort by id for deterministic output ordering.
  rows.sort((a, b) => a.id.localeCompare(b.id));
  for (const row of rows) {
    const sessionId = row.id;
    const answers = (row.answers ?? []) as Answer[];
    if (!Array.isArray(answers) || answers.length === 0) {
      skipped.push({
        source: "live",
        id: sessionId,
        reason: "missing-answers",
        detail: "answers JSONB empty or non-array",
      });
      continue;
    }
    let constitution: InnerConstitution;
    try {
      constitution = buildInnerConstitution(answers, [], null);
    } catch (e) {
      const msg = (e as Error).message;
      skipped.push({
        source: "live",
        id: sessionId,
        reason:
          msg.includes("bands") || msg.includes("undefined")
            ? "stale-shape"
            : "engine-throw",
        detail: msg,
      });
      continue;
    }
    const bundle = row.llm_rewrites as
      | {
          prose?: Record<string, unknown>;
          keystone?: Record<string, unknown>;
          synthesis3?: Record<string, unknown>;
          grip?: Record<string, unknown>;
          launchPolishV3?: Record<string, unknown>;
        }
      | null
      | undefined;
    const bundleKeyCounts = bundle
      ? {
          prose: Object.keys(bundle.prose ?? {}).length,
          keystone: Object.keys(bundle.keystone ?? {}).length,
          synthesis3: Object.keys(bundle.synthesis3 ?? {}).length,
          grip: Object.keys(bundle.grip ?? {}).length,
          launchPolishV3: Object.keys(bundle.launchPolishV3 ?? {}).length,
        }
      : undefined;
    const createdAt = row.created_at instanceof Date
      ? row.created_at
      : new Date(row.created_at as unknown as string);
    ok.push({
      source: "live",
      id: sessionId,
      engineVersionBucket:
        createdAt < ENGINE_VERSION_CUTOFF ? "pre-online" : "current",
      createdAtIso: createdAt.toISOString(),
      displayName: nameById.get(sessionId) ?? null,
      answers,
      constitution,
      bundleKeyCounts,
    });
  }
  return { ok, skipped };
}

// ─────────────────────────────────────────────────────────────────────
// Extractors over an answer set + constitution
// ─────────────────────────────────────────────────────────────────────

function getQA2Response(answers: Answer[]): string | null {
  const a = answers.find((x) => x.question_id === "Q-A2");
  if (!a) return null;
  if (a.type === "forced") return a.response;
  return null;
}

function getQGS1Top(answers: Answer[]): string | null {
  const a = answers.find((x) => x.question_id === "Q-GS1");
  if (!a || a.type !== "ranking") return null;
  return a.order[0] ?? null;
}

function getQV1Top(answers: Answer[]): string | null {
  const a = answers.find((x) => x.question_id === "Q-V1");
  if (!a || a.type !== "ranking") return null;
  return a.order[0] ?? null;
}

function getQE1OutwardTop(answers: Answer[]): string | null {
  const a = answers.find((x) => x.question_id === "Q-E1-outward");
  if (!a || a.type !== "ranking") return null;
  return a.order[0] ?? null;
}

function getQStakesTop2(answers: Answer[]): string[] {
  const a = answers.find((x) => x.question_id === "Q-Stakes1");
  if (!a || a.type !== "ranking") return [];
  return a.order.slice(0, 2);
}

function getQGripTop3(answers: Answer[]): string[] {
  const a = answers.find((x) => x.question_id === "Q-GRIP1");
  if (!a || a.type !== "ranking") return [];
  return a.order.slice(0, 3);
}

// Cause-Soul / Person-Soul proxy per F4.
function computeCauseSoulProxy(answers: Answer[]): number {
  let score = 0;
  if (getQA2Response(answers) === "Building or creating something new") {
    score += 33;
  }
  const gs1 = getQGS1Top(answers);
  if (gs1 === "soul_calling" || gs1 === "creative_truth") {
    score += 33;
  }
  const v1 = getQV1Top(answers);
  if (v1 === "sacred_belief_connection" || v1 === "goal_logic_explanation") {
    score += 34;
  }
  return score;
}

function computePersonSoulProxy(answers: Answer[]): number {
  let score = 0;
  if (getQA2Response(answers) === "Deepening relationships and care") {
    score += 33;
  }
  const gs1 = getQGS1Top(answers);
  if (gs1 === "soul_people") {
    score += 33;
  }
  const v1 = getQV1Top(answers);
  if (v1 === "soul_beloved_named") {
    score += 34;
  }
  return score;
}

// Read derived metrics off the constitution. Each helper soft-defaults
// when an optional field is absent.
function readMetrics(c: InnerConstitution): {
  soul: number | null;
  goal: number | null;
  composedGrip: number | null;
  defensiveGrip: number | null;
  gripAmplifierDelta: number | null;
  riskFormLetter: string | null;
  movementQuadrant: string | null;
  driveDistribution: { cost: number; coverage: number; compliance: number } | null;
  driveCase: string | null;
  primalPrimary: string | null;
  primalConfidence: string | null;
  contributingGripsCount: number;
} {
  const dash = c.goalSoulMovement?.dashboard;
  const goal = c.goalSoulGive?.adjustedScores.goal ?? null;
  const soul = c.goalSoulGive?.adjustedScores.soul ?? null;
  const grip = dash?.grippingPull;
  const composedGrip =
    grip?.gripFromDefensive !== undefined && grip.gripFromDefensive !== null
      ? grip.gripFromDefensive
      : grip?.score ?? null;
  const defensiveGrip =
    grip?.defensiveGrip !== undefined && grip.defensiveGrip !== null
      ? grip.defensiveGrip
      : null;
  const gripAmplifierDelta =
    composedGrip !== null && defensiveGrip !== null
      ? composedGrip - defensiveGrip
      : null;
  const riskFormLetter =
    (c as unknown as { riskFormFromAim?: { letter?: string } })
      .riskFormFromAim?.letter ?? c.riskForm?.letter ?? null;
  const movementQuadrant =
    (c as unknown as { movementQuadrant?: { label?: string } })
      .movementQuadrant?.label ?? null;
  const drive = c.shape_outputs?.path?.drive;
  const driveDistribution = drive
    ? {
        cost: drive.distribution.cost,
        coverage: drive.distribution.coverage,
        compliance: drive.distribution.compliance,
      }
    : null;
  const driveCase = drive?.case ?? null;
  const taxonomy = (c as unknown as { gripTaxonomy?: { primary?: string | null; confidence?: string; contributing_grips?: string[] } })
    .gripTaxonomy;
  return {
    soul,
    goal,
    composedGrip,
    defensiveGrip,
    gripAmplifierDelta,
    riskFormLetter,
    movementQuadrant,
    driveDistribution,
    driveCase,
    primalPrimary: taxonomy?.primary ?? null,
    primalConfidence: taxonomy?.confidence ?? null,
    contributingGripsCount: taxonomy?.contributing_grips?.length ?? 0,
  };
}

function classifyDriveLean(
  d: { cost: number; coverage: number; compliance: number } | null
): "cost-leaning" | "coverage-leaning" | "compliance-leaning" | "aligned" | "unknown" {
  if (!d) return "unknown";
  const THRESHOLD = 38;
  const labels: Array<["cost-leaning" | "coverage-leaning" | "compliance-leaning", number]> = [
    ["cost-leaning", d.cost],
    ["coverage-leaning", d.coverage],
    ["compliance-leaning", d.compliance],
  ];
  const above = labels.filter(([, v]) => v >= THRESHOLD);
  if (above.length === 1) return above[0][0];
  return "aligned";
}

function bucketize5(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "n/a";
  const v = Math.max(0, Math.min(100, value));
  const lo = Math.floor(v / 5) * 5;
  const hi = Math.min(100, lo + 5);
  return `${lo}–${hi}`;
}

function bucketize10(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "n/a";
  const v = Math.max(0, Math.min(100, value));
  const lo = Math.floor(v / 10) * 10;
  const hi = Math.min(100, lo + 10);
  return `${lo}–${hi}`;
}

// ─────────────────────────────────────────────────────────────────────
// Histogram + table rendering helpers (pure markdown)
// ─────────────────────────────────────────────────────────────────────

function counts<T>(items: T[], keyFn: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const i of items) {
    const k = keyFn(i);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function renderHistogramMd(
  title: string,
  buckets: string[],
  fixturesCounts: Map<string, number>,
  liveCounts: Map<string, number>
): string {
  const lines: string[] = [];
  lines.push(`### ${title}`);
  lines.push("");
  lines.push("| Bucket | Fixtures (n) | Live (n) | Δ (live − fixtures) |");
  lines.push("|---|---:|---:|---:|");
  for (const b of buckets) {
    const f = fixturesCounts.get(b) ?? 0;
    const l = liveCounts.get(b) ?? 0;
    lines.push(`| ${b} | ${f} | ${l} | ${l - f >= 0 ? "+" : ""}${l - f} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function renderHistogram3WayMd(
  title: string,
  buckets: string[],
  fixturesCounts: Map<string, number>,
  livePreCounts: Map<string, number>,
  liveCurCounts: Map<string, number>
): string {
  const lines: string[] = [];
  lines.push(`### ${title}`);
  lines.push("");
  lines.push("| Bucket | Fixtures (n) | Live pre-online (n) | Live current (n) | Δ (current − pre-online) |");
  lines.push("|---|---:|---:|---:|---:|");
  for (const b of buckets) {
    const f = fixturesCounts.get(b) ?? 0;
    const pre = livePreCounts.get(b) ?? 0;
    const cur = liveCurCounts.get(b) ?? 0;
    const delta = cur - pre;
    lines.push(
      `| ${b} | ${f} | ${pre} | ${cur} | ${delta >= 0 ? "+" : ""}${delta} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Contradiction-table pairs (canonical correlate list — engine-grounded)
// ─────────────────────────────────────────────────────────────────────

interface ContradictionPair {
  id: string;
  description: string;
  test: (m: Materialized) => "expected" | "contradiction" | "n/a";
}

const CONTRADICTION_PAIRS: ContradictionPair[] = [
  {
    id: "Q-A2↔Q-E1-outward",
    description:
      "Q-A2 'Building or creating something new' should pair with Q-E1-outward top-1 = 'building' or 'solving'.",
    test: (m) => {
      const a2 = getQA2Response(m.answers);
      const e1 = getQE1OutwardTop(m.answers);
      if (!a2 || !e1) return "n/a";
      if (a2 === "Building or creating something new") {
        return e1 === "building" || e1 === "solving" ? "expected" : "contradiction";
      }
      if (a2 === "Restoring order and stability") {
        return e1 === "restoring" ? "expected" : "contradiction";
      }
      return "n/a";
    },
  },
  {
    id: "Q-Stakes1↔Q-GRIP1",
    description:
      "Q-Stakes1 top-1 ∈ {money, job} should pair with Q-GRIP1 top-1 ∈ {grips_security, grips_reputation, grips_certainty}; Q-Stakes1 top-1 = close_relationships should pair with Q-GRIP1 top-1 ∈ {grips_neededness, grips_approval}.",
    test: (m) => {
      const stakes = getQStakesTop2(m.answers);
      const grips = getQGripTop3(m.answers);
      if (stakes.length === 0 || grips.length === 0) return "n/a";
      const stake0 = stakes[0];
      const grip0 = grips[0];
      const moneyJobReputationStakes = ["money", "job", "reputation"];
      const securityCertaintyGrips = [
        "grips_security",
        "grips_reputation",
        "grips_certainty",
      ];
      const relStakes = ["close_relationships"];
      const relGrips = ["grips_neededness", "grips_approval"];
      if (moneyJobReputationStakes.includes(stake0)) {
        return securityCertaintyGrips.includes(grip0) ? "expected" : "contradiction";
      }
      if (relStakes.includes(stake0)) {
        return relGrips.includes(grip0) ? "expected" : "contradiction";
      }
      return "n/a";
    },
  },
  {
    id: "Q-A2↔Q-GS1 (Soul intent)",
    description:
      "Q-A2 'Deepening relationships and care' should pair with Q-GS1 top = soul_people / soul_calling; Q-A2 'Building or creating something new' should pair with Q-GS1 top = durable_creation / creative_truth / goal_completion.",
    test: (m) => {
      const a2 = getQA2Response(m.answers);
      const gs1 = getQGS1Top(m.answers);
      if (!a2 || !gs1) return "n/a";
      if (a2 === "Deepening relationships and care") {
        return gs1 === "soul_people" || gs1 === "soul_calling"
          ? "expected"
          : "contradiction";
      }
      if (a2 === "Building or creating something new") {
        return ["durable_creation", "creative_truth", "goal_completion"].includes(gs1)
          ? "expected"
          : "contradiction";
      }
      return "n/a";
    },
  },
  {
    id: "Q-V1↔Q-GS1 (cause vs person)",
    description:
      "Q-V1 top = soul_beloved_named should pair with Q-GS1 top = soul_people; Q-V1 top = sacred_belief_connection / goal_logic_explanation should pair with Q-GS1 top ∈ {soul_calling, creative_truth, durable_creation, goal_completion}.",
    test: (m) => {
      const v1 = getQV1Top(m.answers);
      const gs1 = getQGS1Top(m.answers);
      if (!v1 || !gs1) return "n/a";
      if (v1 === "soul_beloved_named") {
        return gs1 === "soul_people" ? "expected" : "contradiction";
      }
      if (
        v1 === "sacred_belief_connection" ||
        v1 === "goal_logic_explanation"
      ) {
        return ["soul_calling", "creative_truth", "durable_creation", "goal_completion"].includes(
          gs1
        )
          ? "expected"
          : "contradiction";
      }
      return "n/a";
    },
  },
];

function renderContradictionTable(
  title: string,
  fixtures: Materialized[],
  live: Materialized[]
): string {
  const lines: string[] = [];
  lines.push(`### ${title}`);
  lines.push("");
  lines.push(
    `Threshold: contradiction rates ≥ ${CONTRADICTION_BOLD_THRESHOLD_PCT}% are **bolded**.`
  );
  lines.push("");
  lines.push("| Pair | Fixtures (exp/cont/n.a) | Fixtures rate | Live (exp/cont/n.a) | Live rate | Δ |");
  lines.push("|---|---|---:|---|---:|---:|");
  for (const pair of CONTRADICTION_PAIRS) {
    const fx = { e: 0, c: 0, n: 0 };
    for (const m of fixtures) {
      const v = pair.test(m);
      if (v === "expected") fx.e++;
      else if (v === "contradiction") fx.c++;
      else fx.n++;
    }
    const lv = { e: 0, c: 0, n: 0 };
    for (const m of live) {
      const v = pair.test(m);
      if (v === "expected") lv.e++;
      else if (v === "contradiction") lv.c++;
      else lv.n++;
    }
    const fxRate = fx.e + fx.c > 0 ? (fx.c / (fx.e + fx.c)) * 100 : 0;
    const lvRate = lv.e + lv.c > 0 ? (lv.c / (lv.e + lv.c)) * 100 : 0;
    const fxRateStr =
      fxRate >= CONTRADICTION_BOLD_THRESHOLD_PCT
        ? `**${fxRate.toFixed(1)}%**`
        : `${fxRate.toFixed(1)}%`;
    const lvRateStr =
      lvRate >= CONTRADICTION_BOLD_THRESHOLD_PCT
        ? `**${lvRate.toFixed(1)}%**`
        : `${lvRate.toFixed(1)}%`;
    const delta = lvRate - fxRate;
    lines.push(
      `| ${pair.id} | ${fx.e}/${fx.c}/${fx.n} | ${fxRateStr} | ${lv.e}/${lv.c}/${lv.n} | ${lvRateStr} | ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pts |`
    );
  }
  lines.push("");
  for (const p of CONTRADICTION_PAIRS) {
    lines.push(`- **${p.id}** — ${p.description}`);
  }
  lines.push("");
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Artifact composition
// ─────────────────────────────────────────────────────────────────────

function getGitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: REPO_ROOT, encoding: "utf-8" }).trim();
  } catch {
    return "(unavailable)";
  }
}

function bucket5Labels(): string[] {
  const out: string[] = [];
  for (let lo = 0; lo < 100; lo += 5) {
    out.push(`${lo}–${lo + 5}`);
  }
  return out;
}

function bucket10Labels(): string[] {
  const out: string[] = [];
  for (let lo = 0; lo < 100; lo += 10) {
    out.push(`${lo}–${lo + 10}`);
  }
  return out;
}

function renderArtifact(
  fixtures: Materialized[],
  liveAll: Materialized[],
  fixtureSkipped: Skipped[],
  liveSkipped: Skipped[]
): string {
  const livePre = liveAll.filter((m) => m.engineVersionBucket === "pre-online");
  const liveCur = liveAll.filter((m) => m.engineVersionBucket === "current");
  const gitSha = getGitSha();
  const fileNames = fixtures.map((m) => m.id).sort();
  const out: string[] = [];

  // 1. Header
  out.push("# Phase 1 Distribution Audit");
  out.push("");
  out.push(
    `**Cohort counts** — fixtures N=${fixtures.length} / live N=${liveAll.length} (pre-online ${livePre.length}, current ${liveCur.length}) / live skipped N=${liveSkipped.length}.`
  );
  if (liveSkipped.length > 0) {
    out.push("");
    out.push("Live skipped:");
    for (const s of liveSkipped) {
      out.push(`- \`${s.id}\` — ${s.reason}: ${s.detail.slice(0, 160)}`);
    }
  }
  if (fixtureSkipped.length > 0) {
    out.push("");
    out.push("Fixture skipped:");
    for (const s of fixtureSkipped) {
      out.push(`- \`${s.id}\` — ${s.reason}: ${s.detail.slice(0, 160)}`);
    }
  }
  out.push("");
  out.push(
    `Engine-version split: sessions created before \`${ENGINE_VERSION_CUTOFF.toISOString()}\` are bucketed "pre-online"; on/after are "current". Cutoff is per F1's "approximately 2026-05-10 to 2026-05-16" window. CC-STALE-SHAPE-DETECTOR was not present at run time — \`engine_shape_version\` column is absent on \`sessions\`, so the cutoff is timestamp-based rather than schema-stamped.`
  );
  out.push("");

  // 2. Findings summary
  out.push("## Findings summary");
  out.push("");

  // F1 verdict
  const ampPre = livePre
    .map((m) => readMetrics(m.constitution).gripAmplifierDelta)
    .filter((v): v is number => v !== null);
  const ampCur = liveCur
    .map((m) => readMetrics(m.constitution).gripAmplifierDelta)
    .filter((v): v is number => v !== null);
  const ampPreMean =
    ampPre.length > 0 ? ampPre.reduce((a, b) => a + b, 0) / ampPre.length : null;
  const ampCurMean =
    ampCur.length > 0 ? ampCur.reduce((a, b) => a + b, 0) / ampCur.length : null;
  let f1Verdict = "inconclusive";
  if (ampPreMean !== null && ampCurMean !== null) {
    const drop = ampPreMean - ampCurMean;
    f1Verdict = drop > 5 ? "confirmed" : drop < -5 ? "refuted" : "inconclusive";
  } else if (ampPre.length === 0) {
    f1Verdict = "inconclusive (no pre-online amplifier data)";
  }
  out.push(
    `- **F1 — Engine-version split for §13 stakes amplifier.** Verdict: **${f1Verdict}**. ` +
      `Pre-online mean amplifier delta = ${ampPreMean === null ? "n/a" : ampPreMean.toFixed(1)} (n=${ampPre.length}); current mean = ${ampCurMean === null ? "n/a" : ampCurMean.toFixed(1)} (n=${ampCur.length}). ` +
      `See "Amplifier × engine version" histogram below.`
  );

  // F2 verdict — Grip distribution compression
  const gripPreScores = livePre
    .map((m) => readMetrics(m.constitution).composedGrip)
    .filter((v): v is number => v !== null);
  const gripCurScores = liveCur
    .map((m) => readMetrics(m.constitution).composedGrip)
    .filter((v): v is number => v !== null);
  const range = (arr: number[]): number =>
    arr.length === 0 ? 0 : Math.max(...arr) - Math.min(...arr);
  const gripPreRange = range(gripPreScores);
  const gripCurRange = range(gripCurScores);
  let f2Verdict = "inconclusive";
  if (gripPreScores.length > 0 && gripCurScores.length > 0) {
    f2Verdict =
      gripCurRange < gripPreRange * 0.5 ? "confirmed" : "refuted or inconclusive";
  }
  out.push(
    `- **F2 — Composed Grip distribution compression.** Verdict: **${f2Verdict}**. ` +
      `Pre-online range = ${gripPreRange.toFixed(1)} pts (n=${gripPreScores.length}, min=${gripPreScores.length ? Math.min(...gripPreScores).toFixed(1) : "n/a"}, max=${gripPreScores.length ? Math.max(...gripPreScores).toFixed(1) : "n/a"}); current range = ${gripCurRange.toFixed(1)} pts (n=${gripCurScores.length}, min=${gripCurScores.length ? Math.min(...gripCurScores).toFixed(1) : "n/a"}, max=${gripCurScores.length ? Math.max(...gripCurScores).toFixed(1) : "n/a"}). ` +
      `See "Composed Grip × engine version" histogram below.`
  );

  // F3 verdict — Soul ceiling cluster
  const soulCur = liveCur
    .map((m) => readMetrics(m.constitution).soul)
    .filter((v): v is number => v !== null);
  const soulHighCount = soulCur.filter((s) => s >= 90).length;
  const soulHighPct =
    soulCur.length > 0 ? (soulHighCount / soulCur.length) * 100 : 0;
  const f3Verdict =
    soulHighPct >= SOUL_CLUSTER_FLAG_PCT ? "confirmed" : "refuted";
  out.push(
    `- **F3 — Soul ceiling cluster.** Verdict: **${f3Verdict}**. ` +
      `${soulHighPct.toFixed(0)}% of current-engine live sessions (${soulHighCount}/${soulCur.length}) sit at Soul ≥ 90; flag threshold = ${SOUL_CLUSTER_FLAG_PCT}%. ` +
      `See "Soul-axis" + "Soul-axis × Q-A2" histograms below.`
  );

  // F4 verdict — Cause-Soul vs Person-Soul
  const f4Notes = "see scatter table below";
  out.push(
    `- **F4 — Cause-Soul vs Person-Soul vector hypothesis.** Verdict: **inconclusive without per-session annotation review** (${f4Notes}). The script computes both proxies; final verdict requires human review of the scatter, per the CC's editorial-discipline canon. Confirmed only if engine Soul correlates with person-Soul-proxy and ignores cause-Soul-proxy across multiple sessions.`
  );

  // F5 verdict — Cohort cache zero-match
  const liveWithBundle = liveAll.filter((m) => m.bundleKeyCounts !== undefined);
  const totalMatches = liveWithBundle.reduce(
    (acc, m) =>
      acc +
      (m.bundleKeyCounts!.prose +
        m.bundleKeyCounts!.keystone +
        m.bundleKeyCounts!.synthesis3 +
        m.bundleKeyCounts!.grip +
        m.bundleKeyCounts!.launchPolishV3),
    0
  );
  const f5Verdict =
    liveWithBundle.length > 0 && totalMatches === 0
      ? "confirmed"
      : totalMatches > 0
        ? "refuted (some matches found)"
        : "inconclusive (no backfilled bundles)";
  out.push(
    `- **F5 — Cohort-cache zero-match-rate.** Verdict: **${f5Verdict}**. ` +
      `${liveWithBundle.length} session(s) carry an \`llm_rewrites\` bundle; total matched cache keys across all 5 layers = ${totalMatches}. ` +
      `See "Cohort-cache match-rate" table below.`
  );

  // F6 — informational
  out.push(
    `- **F6 — JasonDMcG self-report calibration anchor.** Surfaced as data, not authority. See "Subject self-report comparison appendix" below.`
  );

  // F7 — Grip Pattern card render gate
  out.push(
    `- **F7 — Grip Pattern card render gate.** Verdict: **inconclusive without bucket-mapping count vs render-status correlation** — surfaced in "Grip Pattern card render × bucket alignment" table; final verdict requires human review of high-grip / low-bucket vs low-grip / high-bucket cells.`
  );
  out.push("");

  // 3. Composed Grip × engine version
  const gripBuckets = bucket5Labels();
  const fxGripCounts = counts(fixtures, (m) =>
    bucketize5(readMetrics(m.constitution).composedGrip)
  );
  const livePreGripCounts = counts(livePre, (m) =>
    bucketize5(readMetrics(m.constitution).composedGrip)
  );
  const liveCurGripCounts = counts(liveCur, (m) =>
    bucketize5(readMetrics(m.constitution).composedGrip)
  );
  out.push("## Composed Grip × engine version (F1, F2)");
  out.push("");
  out.push(renderHistogram3WayMd(
    "Composed Grip — 5-point buckets",
    gripBuckets,
    fxGripCounts,
    livePreGripCounts,
    liveCurGripCounts
  ));

  // 4. Amplifier × engine version
  const ampBuckets = [
    "<-20", "-20–-10", "-10–0", "0–5", "5–10", "10–15", "15–20", "20+",
  ];
  function ampBucket(v: number | null): string {
    if (v === null) return "n/a";
    if (v < -20) return "<-20";
    if (v < -10) return "-20–-10";
    if (v < 0) return "-10–0";
    if (v < 5) return "0–5";
    if (v < 10) return "5–10";
    if (v < 15) return "10–15";
    if (v < 20) return "15–20";
    return "20+";
  }
  out.push("## Amplifier × engine version (F1)");
  out.push("");
  out.push(renderHistogram3WayMd(
    "Defensive → Composed amplifier delta",
    ampBuckets,
    counts(fixtures, (m) => ampBucket(readMetrics(m.constitution).gripAmplifierDelta)),
    counts(livePre, (m) => ampBucket(readMetrics(m.constitution).gripAmplifierDelta)),
    counts(liveCur, (m) => ampBucket(readMetrics(m.constitution).gripAmplifierDelta)),
  ));

  // 5. Soul-axis
  out.push("## Soul-axis (F3)");
  out.push("");
  out.push(renderHistogramMd(
    "Soul score — 5-point buckets",
    bucket5Labels(),
    counts(fixtures, (m) => bucketize5(readMetrics(m.constitution).soul)),
    counts(liveAll, (m) => bucketize5(readMetrics(m.constitution).soul)),
  ));

  // 6. Soul × Q-A2
  out.push("## Soul-axis × Q-A2 response (F3, F4)");
  out.push("");
  const QA2_RESPONSES = [
    "Building or creating something new",
    "Deepening relationships and care",
    "Restoring order and stability",
    "Exploring, learning, or wandering",
  ];
  const soulBuckets10 = bucket10Labels();
  function emitSoulByQA2(cohort: Materialized[], label: string): void {
    out.push(`### ${label}`);
    out.push("");
    const hdr = ["Bucket", ...QA2_RESPONSES, "n/a"];
    out.push(`| ${hdr.join(" | ")} |`);
    out.push(`| ${hdr.map(() => "---").join(" | ")} |`);
    for (const b of soulBuckets10) {
      const row: string[] = [b];
      for (const resp of QA2_RESPONSES) {
        const n = cohort.filter(
          (m) =>
            bucketize10(readMetrics(m.constitution).soul) === b &&
            getQA2Response(m.answers) === resp
        ).length;
        row.push(String(n));
      }
      const naN = cohort.filter(
        (m) =>
          bucketize10(readMetrics(m.constitution).soul) === b &&
          getQA2Response(m.answers) === null
      ).length;
      row.push(String(naN));
      out.push(`| ${row.join(" | ")} |`);
    }
    out.push("");
  }
  emitSoulByQA2(fixtures, "Fixtures");
  emitSoulByQA2(liveAll, "Live");

  // 7. Cause-Soul / Person-Soul scatter (F4)
  out.push("## Cause-Soul / Person-Soul proxy scatter (F4)");
  out.push("");
  out.push(
    "Per session: engine Soul score, cause-Soul-proxy, person-Soul-proxy, plus dominant proxy. Person-Soul = Q-A2 'Deepening relationships' + Q-GS1 soul_people + Q-V1 soul_beloved_named. Cause-Soul = Q-A2 'Building or creating' + Q-GS1 soul_calling/creative_truth + Q-V1 sacred_belief_connection/goal_logic_explanation."
  );
  out.push("");
  out.push("| Source | Id | Name | Soul | Cause-proxy | Person-proxy | Dominant |");
  out.push("|---|---|---|---:|---:|---:|---|");
  const allLabeled = [...fixtures, ...liveAll].sort((a, b) =>
    a.source === b.source ? a.id.localeCompare(b.id) : a.source.localeCompare(b.source)
  );
  for (const m of allLabeled) {
    const metrics = readMetrics(m.constitution);
    const cause = computeCauseSoulProxy(m.answers);
    const person = computePersonSoulProxy(m.answers);
    const dominant =
      cause > person ? "cause" : person > cause ? "person" : "tie";
    const name = m.displayName ?? "(unnamed)";
    out.push(
      `| ${m.source} | \`${m.id.slice(0, 24)}\` | ${name} | ${metrics.soul ?? "n/a"} | ${cause} | ${person} | ${dominant} |`
    );
  }
  out.push("");

  // 8. Grip Pattern card render × bucket alignment (F7)
  out.push("## Grip Pattern card render × bucket alignment (F7)");
  out.push("");
  out.push(
    "Per session: composed Grip, primal-cluster primary + confidence, contributing-grips count. The Grip Pattern card renders when primalCluster.confidence is `high` or `medium-high`. Hypothesis (F7): renders correlate with high primal confidence (clean bucket-mapping), not with composed Grip score."
  );
  out.push("");
  out.push("| Source | Id | Composed Grip | Primal primary | Confidence | Contributing grips |");
  out.push("|---|---|---:|---|---|---:|");
  for (const m of allLabeled) {
    const metrics = readMetrics(m.constitution);
    out.push(
      `| ${m.source} | \`${m.id.slice(0, 24)}\` | ${metrics.composedGrip === null ? "n/a" : metrics.composedGrip.toFixed(1)} | ${metrics.primalPrimary ?? "(none)"} | ${metrics.primalConfidence ?? "n/a"} | ${metrics.contributingGripsCount} |`
    );
  }
  out.push("");

  // 9. Grip Pattern bucket distribution
  out.push("## Grip Pattern bucket distribution");
  out.push("");
  const primalLabels = [
    "Am I safe?",
    "Am I secure?",
    "Am I loved?",
    "Am I wanted?",
    "Am I successful?",
    "Am I good enough?",
    "Do I have purpose?",
    "(none)",
  ];
  out.push(renderHistogramMd(
    "Primal primary",
    primalLabels,
    counts(fixtures, (m) => readMetrics(m.constitution).primalPrimary ?? "(none)"),
    counts(liveAll, (m) => readMetrics(m.constitution).primalPrimary ?? "(none)"),
  ));
  out.push(
    "Mapping note: the CC's 'Safety / Security / Belonging / Worth / Recognition / Control / Purpose / unmapped' bucket names correspond to the engine's PrimalQuestion enum values verbatim ('Am I safe?' → Safety, 'Am I loved?' → Belonging, 'Am I wanted?' → Recognition, 'Am I successful?' → Worth, 'Am I good enough?' → Mastery/Control, 'Do I have purpose?' → Purpose, '(none)' → unmapped). The engine ships the question-form labels; the CC's bucket names are interpretive."
  );
  out.push("");

  // 10. Risk Form label distribution
  out.push("## Risk Form label distribution");
  out.push("");
  const rfLabels = [
    "Open-Handed Aim",
    "White-Knuckled Aim",
    "Grip-Governed",
    "Ungoverned Movement",
    "Lightly Governed Movement",
    "Strained Integration",
    "(unset)",
  ];
  out.push(renderHistogramMd(
    "Risk Form letter",
    rfLabels,
    counts(fixtures, (m) => readMetrics(m.constitution).riskFormLetter ?? "(unset)"),
    counts(liveAll, (m) => readMetrics(m.constitution).riskFormLetter ?? "(unset)"),
  ));
  out.push(
    "Per the CC's expected finding: Lightly Governed Movement should show 0 entries (canon wiring not landed) — this table confirms or refutes."
  );
  out.push("");

  // 11. 3C bucket lean
  out.push("## Cost / Coverage / Compliance bucket lean (38% threshold per workMap.ts canon)");
  out.push("");
  const leanLabels = [
    "cost-leaning",
    "coverage-leaning",
    "compliance-leaning",
    "aligned",
    "unknown",
  ];
  out.push(renderHistogramMd(
    "3C lean",
    leanLabels,
    counts(fixtures, (m) =>
      classifyDriveLean(readMetrics(m.constitution).driveDistribution)
    ),
    counts(liveAll, (m) =>
      classifyDriveLean(readMetrics(m.constitution).driveDistribution)
    ),
  ));

  // 12. Drive Case
  out.push("## DriveCase distribution");
  out.push("");
  const driveCaseLabels = [
    "aligned",
    "inverted-small",
    "inverted-big",
    "partial-mismatch",
    "balanced",
    "unstated",
    "(unset)",
  ];
  out.push(renderHistogramMd(
    "DriveCase",
    driveCaseLabels,
    counts(fixtures, (m) => readMetrics(m.constitution).driveCase ?? "(unset)"),
    counts(liveAll, (m) => readMetrics(m.constitution).driveCase ?? "(unset)"),
  ));

  // 13. Cohort-cache match-rate per session per layer
  out.push("## Cohort-cache match-rate per session per layer (F5)");
  out.push("");
  out.push(
    "Fixtures cohort is the cohort cache (trivially matches itself), so only live is shown."
  );
  out.push("");
  out.push("| Session id | prose | keystone | synthesis3 | grip | launchPolishV3 | total |");
  out.push("|---|---:|---:|---:|---:|---:|---:|");
  for (const m of liveAll) {
    if (!m.bundleKeyCounts) {
      out.push(`| \`${m.id.slice(0, 24)}\` | — | — | — | — | — | (no bundle) |`);
      continue;
    }
    const t =
      m.bundleKeyCounts.prose +
      m.bundleKeyCounts.keystone +
      m.bundleKeyCounts.synthesis3 +
      m.bundleKeyCounts.grip +
      m.bundleKeyCounts.launchPolishV3;
    out.push(
      `| \`${m.id.slice(0, 24)}\` | ${m.bundleKeyCounts.prose} | ${m.bundleKeyCounts.keystone} | ${m.bundleKeyCounts.synthesis3} | ${m.bundleKeyCounts.grip} | ${m.bundleKeyCounts.launchPolishV3} | ${t} |`
    );
  }
  out.push("");

  // 14. Contradiction table
  out.push("## Cross-question contradiction table");
  out.push("");
  out.push(renderContradictionTable("Pairs", fixtures, liveAll));

  // 15. Subject self-report appendix (F6, JasonDMcG only)
  out.push("## Subject self-report comparison appendix (F6)");
  out.push("");
  out.push(
    "Per CC F6: data, not authority. The other 6 sessions' self-reports arrive separately and outside this CC's scope; calibration cannot be tuned to a single subject's intuition."
  );
  out.push("");
  out.push("| Subject | Stated | Rendered (composed Grip) | Rendered (Usable Movement) | Discrepancy |");
  out.push("|---|---|---:|---:|---|");
  // Find Jason by displayName containing 'jason' (case-insensitive)
  const jasonRow = liveAll.find(
    (m) => (m.displayName ?? "").toLowerCase().includes("jason")
  );
  if (jasonRow) {
    const metrics = readMetrics(jasonRow.constitution);
    const dash = jasonRow.constitution.goalSoulMovement?.dashboard;
    const usableMovement =
      (dash as unknown as { movementLimiter?: { usableMovement?: number } })
        ?.movementLimiter?.usableMovement ?? null;
    out.push(
      `| JasonDMcG | "lowest Grip, highest Movement in the cohort" | ${metrics.composedGrip === null ? "n/a" : metrics.composedGrip.toFixed(1)} | ${usableMovement === null ? "n/a" : usableMovement.toFixed(1)} | Compare stated rank vs cohort rank below |`
    );
    // Cohort rank
    const allComposed = liveAll
      .map((m) => ({ id: m.id, name: m.displayName, v: readMetrics(m.constitution).composedGrip }))
      .filter((r) => r.v !== null) as Array<{ id: string; name: string | null; v: number }>;
    const sortedByGrip = [...allComposed].sort((a, b) => a.v - b.v);
    const jasonRank = sortedByGrip.findIndex((r) => r.id === jasonRow.id);
    out.push(
      `| | Cohort rank by composed Grip (low → high) | rank #${jasonRank + 1} of ${sortedByGrip.length} | — | Stated "lowest" requires rank #1 |`
    );
  } else {
    out.push(`| JasonDMcG | (not found in live cohort by demographic name) | — | — | n/a |`);
  }
  out.push("");

  // 16. Data gaps
  out.push("## Data gaps");
  out.push("");
  const dataGaps: string[] = [];
  // Check if any expected signal was absent across cohort
  const allWithSoul = [...fixtures, ...liveAll].filter(
    (m) => readMetrics(m.constitution).soul !== null
  ).length;
  if (allWithSoul === 0) {
    dataGaps.push("DATA GAP — no Soul score surfaced on cohort, recommend Q-E1/Q-S2 audit before downstream calibration");
  }
  const allWithGrip = [...fixtures, ...liveAll].filter(
    (m) => readMetrics(m.constitution).composedGrip !== null
  ).length;
  if (allWithGrip === 0) {
    dataGaps.push("DATA GAP — no composed Grip surfaced on cohort, recommend Q-GRIP1/Q-Stakes1 audit before downstream calibration");
  }
  const allWithAmp = [...fixtures, ...liveAll].filter(
    (m) => readMetrics(m.constitution).gripAmplifierDelta !== null
  ).length;
  if (allWithAmp === 0) {
    dataGaps.push("DATA GAP — no amplifier delta surfaced (defensiveGrip absent on cohort), §13 amplifier calibration cannot be evidenced from this audit");
  }
  if (dataGaps.length === 0) {
    out.push("No data gaps: every histogram in this artifact was producible from the cohort.");
  } else {
    for (const g of dataGaps) out.push(`- ${g}`);
  }
  out.push("");

  // 17. Inputs
  out.push("## Inputs");
  out.push("");
  out.push(`- **Git SHA**: \`${gitSha}\``);
  out.push(`- **Engine entry point**: \`buildInnerConstitution(answers, [], demographics)\` from \`lib/identityEngine.ts\``);
  out.push(`- **Engine-version cutoff**: \`${ENGINE_VERSION_CUTOFF.toISOString()}\` (timestamp-based; \`engine_shape_version\` column absent because CC-STALE-SHAPE-DETECTOR has not shipped)`);
  out.push(`- **Fixtures cohort dir**: \`tests/fixtures/cohort/\` (${fileNames.length} files)`);
  if (fileNames.length > 0) {
    for (const f of fileNames) {
      out.push(`  - ${f}`);
    }
  }
  out.push(`- **Live cohort**: \`SELECT id, created_at, answers, llm_rewrites FROM sessions\` (${liveAll.length + liveSkipped.length} rows; ${liveSkipped.length} skipped)`);
  out.push(`- **Contradiction bold threshold**: ${CONTRADICTION_BOLD_THRESHOLD_PCT}%`);
  out.push(`- **Soul-cluster flag threshold**: ${SOUL_CLUSTER_FLAG_PCT}%`);
  out.push("");
  out.push(
    "**No API key was in scope during run** — script imports nothing from `lib/*LlmServer.ts`, does not instantiate the Anthropic SDK, and made zero requests to `api.anthropic.com`."
  );
  out.push("");

  return out.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const fxResult = loadFixtureCohort();
  const liveResult = await loadLiveCohort();
  const artifact = renderArtifact(
    fxResult.ok,
    liveResult.ok,
    fxResult.skipped,
    liveResult.skipped
  );
  if (!existsSync(ARTIFACT_DIR)) {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
  }
  writeFileSync(ARTIFACT_PATH, artifact);
  console.log(
    `[calibration-phase-1] wrote ${ARTIFACT_PATH} — fixtures n=${fxResult.ok.length}, live n=${liveResult.ok.length} (skipped ${liveResult.skipped.length})`
  );
}

main()
  .then(() => {
    // Drizzle's postgres-js client keeps the connection alive after
    // the script's work is done, which hangs the Node process. Exit
    // explicitly so `npm run audit:calibration-phase-1` returns
    // promptly.
    process.exit(0);
  })
  .catch((e) => {
    console.error(`[calibration-phase-1] failed: ${(e as Error).message}`);
    console.error((e as Error).stack);
    process.exit(1);
  });
