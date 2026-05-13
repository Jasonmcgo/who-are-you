// CC-JX — Jungian / OCEAN bridge diagnostic.
//
// Runs across all 20 fixtures (7 OCEAN + 13 goal-soul-give) and prints,
// per fixture: derived stack ordering with position weights, per-OCEAN-
// bucket Jungian contribution decomposition (which functions added what
// to which buckets), and the resulting weighted-sum + intensity. After
// all fixtures, prints aggregate stack-position histograms (which
// functions land at position 1 / 2 / 3 / 4 most frequently) and cohort
// spread metrics for each OCEAN bucket.
//
// Phase 1 of CC-JX: produces the load-bearing evidence for Phase 2
// position-weighting decisions.
//
// Usage: `npx tsx tests/audit/jungianOceanDiagnostic.ts`
//
// Kept as a permanent regression tool per CC-AS / CC-JX precedent.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { deriveSignals } from "../../lib/identityEngine";
import { computeJungianStack } from "../../lib/jungianStack";
import { computeOceanOutput, intensityBand } from "../../lib/ocean";
import type { Answer, CognitiveFunctionId, Signal } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const OCEAN_DIR = join(ROOT, "ocean");
const GSG_DIR = join(ROOT, "goal-soul-give");

type FixtureRecord = {
  set: "ocean" | "goal-soul-give";
  file: string;
  answers: Answer[];
};

function loadFixtures(): FixtureRecord[] {
  const out: FixtureRecord[] = [];
  for (const f of readdirSync(OCEAN_DIR)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const raw = JSON.parse(readFileSync(join(OCEAN_DIR, f), "utf-8")) as {
      answers: Answer[];
    };
    out.push({ set: "ocean", file: f, answers: raw.answers });
  }
  for (const f of readdirSync(GSG_DIR)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const raw = JSON.parse(readFileSync(join(GSG_DIR, f), "utf-8")) as {
      answers: Answer[];
    };
    out.push({ set: "goal-soul-give", file: f, answers: raw.answers });
  }
  return out;
}

// CC-JX bridge mapping — must match `lib/ocean.ts` PARENT_BRIDGE.
// Re-declared here for self-contained diagnostic readability; if the
// engine bridge ever drifts, the audit's `jx-no-jungian-to-e` etc.
// assertions surface the divergence.
const PARENT_BRIDGE_DOC: Record<
  CognitiveFunctionId,
  Partial<Record<"O" | "C" | "E" | "A" | "N", number>>
> = {
  ne: { O: 2.0 },
  ni: { O: 2.0 },
  si: { C: 1.0 },
  se: { O: 1.0 },
  te: { C: 1.0 },
  ti: { C: 1.0 },
  fe: { A: 0.7 },
  fi: { A: 0.7 },
};

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function fmt(n: number, w = 6, d = 2): string {
  return pad(n.toFixed(d), w);
}

type FixtureSummary = {
  set: "ocean" | "goal-soul-give";
  file: string;
  stack: Array<{
    function: CognitiveFunctionId;
    position: number;
    positionWeight: number;
    cumulativeRawWeight: number;
  }>;
  contributions: Record<"O" | "C" | "E" | "A" | "N", Array<{
    function: CognitiveFunctionId;
    contribution: number;
  }>>;
  totalContributions: Record<"O" | "C" | "E" | "A" | "N", number>;
  intensities: { O: number; C: number; E: number; A: number; N: number };
};

function summarizeFixture(rec: FixtureRecord): FixtureSummary {
  const signals: Signal[] = deriveSignals(rec.answers);
  const stack = computeJungianStack(signals);
  const contributions: FixtureSummary["contributions"] = {
    O: [],
    C: [],
    E: [],
    A: [],
    N: [],
  };
  const totals: FixtureSummary["totalContributions"] = {
    O: 0,
    C: 0,
    E: 0,
    A: 0,
    N: 0,
  };
  for (const entry of stack) {
    if (entry.positionWeight === 0) continue;
    const bridge = PARENT_BRIDGE_DOC[entry.function];
    if (!bridge) continue;
    for (const [bucket, coeff] of Object.entries(bridge)) {
      const b = bucket as "O" | "C" | "E" | "A" | "N";
      const contrib = entry.positionWeight * (coeff as number);
      contributions[b].push({ function: entry.function, contribution: contrib });
      totals[b] += contrib;
    }
  }
  const ocean = computeOceanOutput(signals, rec.answers);
  const ints = ocean?.dispositionSignalMix.intensities ?? {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    emotionalReactivity: 0,
  };
  return {
    set: rec.set,
    file: rec.file,
    stack,
    contributions,
    totalContributions: totals,
    intensities: {
      O: ints.openness,
      C: ints.conscientiousness,
      E: ints.extraversion,
      A: ints.agreeableness,
      N: ints.emotionalReactivity,
    },
  };
}

function printPerFixture(summaries: FixtureSummary[]): void {
  console.log("=== CC-JX — Jungian / OCEAN bridge diagnostic ===");
  console.log(`Fixtures: ${summaries.length}`);
  console.log("");
  for (const s of summaries) {
    const stackRepr = s.stack
      .map((e) => `${e.function}@${e.position}(pw=${fmt(e.positionWeight, 4, 1)})`)
      .join(" → ");
    console.log(
      `--- ${pad(s.set, 14)} ${pad(s.file, 45)} O=${String(s.intensities.O).padStart(3)} C=${String(s.intensities.C).padStart(3)} E=${String(s.intensities.E).padStart(3)} A=${String(s.intensities.A).padStart(3)} N=${String(s.intensities.N).padStart(3)} band(O/C/E/A/N)=${intensityBand(s.intensities.O)[0]}/${intensityBand(s.intensities.C)[0]}/${intensityBand(s.intensities.E)[0]}/${intensityBand(s.intensities.A)[0]}/${intensityBand(s.intensities.N)[0]} ---`
    );
    console.log(`  stack: ${stackRepr}`);
    for (const bucket of ["O", "C", "E", "A", "N"] as const) {
      const items = s.contributions[bucket];
      if (items.length === 0) continue;
      const breakdown = items
        .map((it) => `${it.function}=${fmt(it.contribution, 5, 2)}`)
        .join(" + ");
      console.log(
        `    ${bucket}-cog-contrib total=${fmt(s.totalContributions[bucket], 6, 2)}  [ ${breakdown} ]`
      );
    }
  }
}

function printStackPositionHistogram(summaries: FixtureSummary[]): void {
  console.log("");
  console.log("=== Stack position histogram (which function lands where) ===");
  const fns: CognitiveFunctionId[] = [
    "ne",
    "ni",
    "se",
    "si",
    "te",
    "ti",
    "fe",
    "fi",
  ];
  console.log(
    `${pad("function", 10)} pos1   pos2   pos3   pos4   pos5+`
  );
  for (const fn of fns) {
    const counts = [0, 0, 0, 0, 0];
    for (const s of summaries) {
      const entry = s.stack.find((e) => e.function === fn);
      if (!entry) continue;
      const p = Math.min(entry.position, 5);
      counts[p - 1]++;
    }
    console.log(
      `${pad(fn, 10)} ${pad(String(counts[0]), 6)} ${pad(String(counts[1]), 6)} ${pad(String(counts[2]), 6)} ${pad(String(counts[3]), 6)} ${counts[4]}`
    );
  }
}

function printCohortSpread(summaries: FixtureSummary[]): void {
  console.log("");
  console.log("=== Cohort spread per OCEAN bucket ===");
  for (const bucket of ["O", "C", "E", "A", "N"] as const) {
    const vals = summaries.map((s) => s.intensities[bucket]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance =
      vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const std = Math.sqrt(variance);
    const bands: Record<string, number> = {
      "under-detected": 0,
      low: 0,
      moderate: 0,
      "moderate-high": 0,
      high: 0,
    };
    for (const v of vals) bands[intensityBand(v)] = (bands[intensityBand(v)] ?? 0) + 1;
    console.log(
      `  ${bucket}: min=${min} max=${max} mean=${mean.toFixed(2)} std=${std.toFixed(2)} spread=${max - min}  bands=${JSON.stringify(bands)}`
    );
  }
}

function printJungianContributionStats(summaries: FixtureSummary[]): void {
  console.log("");
  console.log("=== Jungian contribution magnitude per OCEAN bucket ===");
  for (const bucket of ["O", "C", "E", "A", "N"] as const) {
    const vals = summaries.map((s) => s.totalContributions[bucket]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    console.log(
      `  ${bucket}: min=${min.toFixed(2)} max=${max.toFixed(2)} mean=${mean.toFixed(2)} (zero-contrib fixtures: ${vals.filter((v) => v === 0).length}/${vals.length})`
    );
  }
}

function main(): number {
  const records = loadFixtures();
  const summaries = records.map(summarizeFixture);
  printPerFixture(summaries);
  printStackPositionHistogram(summaries);
  printCohortSpread(summaries);
  printJungianContributionStats(summaries);
  return 0;
}

process.exit(main());
