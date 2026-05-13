// CC-ES — Extraversion signal-pool diagnostic.
//
// Mirrors CC-AS / CC-JX harness pattern. Runs across all 20 available
// fixtures (13 goal-soul-give + 7 OCEAN) and prints, per fixture, every
// E-tagged signal that fires plus its weight contribution. After all
// fixtures, prints an aggregate fire-rate table (which signals fire
// universally vs distinctively) and cohort-spread metrics (min / max /
// mean / std + per-band histogram for E intensity).
//
// Phase 1 of CC-ES: produces the load-bearing evidence for the Phase 2
// per-signal cleanup decisions.
//
// Usage: `npx tsx tests/audit/extraversionSignalPoolDiagnostic.ts`
//
// Kept as a permanent regression tool per CC-AS / CC-JX precedent.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { deriveSignals } from "../../lib/identityEngine";
import {
  INTENSITY_K,
  SIGNAL_OCEAN_TAGS,
  computeOceanOutput,
  intensityBand,
  intensityFromWeight,
} from "../../lib/ocean";
import { weightFor } from "../../lib/drive";
import type { Answer, Signal } from "../../lib/types";

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
  for (const f of readdirSync(OCEAN_DIR).filter((x) => x.endsWith(".json")).sort()) {
    const raw = JSON.parse(readFileSync(join(OCEAN_DIR, f), "utf-8")) as {
      answers: Answer[];
    };
    out.push({ set: "ocean", file: f, answers: raw.answers });
  }
  for (const f of readdirSync(GSG_DIR).filter((x) => x.endsWith(".json")).sort()) {
    const raw = JSON.parse(readFileSync(join(GSG_DIR, f), "utf-8")) as {
      answers: Answer[];
    };
    out.push({ set: "goal-soul-give", file: f, answers: raw.answers });
  }
  return out;
}

// Per-signal E weight contribution. Mirrors `computeRawWeights`: a signal
// at rank r contributes `weightFor(sig)` to each tagged bucket, divided
// by the number of tags.
function eWeightContribution(sig: Signal): number {
  const tags = SIGNAL_OCEAN_TAGS[sig.signal_id];
  if (!tags || !tags.includes("E")) return 0;
  const w = weightFor(sig);
  return w / tags.length;
}

type PerSignalRow = {
  signal_id: string;
  contribution: number;
  source_question_ids: string[];
  rank: number | undefined;
};

type FixtureSummary = {
  set: "ocean" | "goal-soul-give";
  file: string;
  rows: PerSignalRow[];
  weightedSum: number;
  intensity: number;
  band: string;
};

function summarizeFixture(record: FixtureRecord): FixtureSummary {
  const signals = deriveSignals(record.answers);
  const rows: PerSignalRow[] = [];
  let weightedSum = 0;
  for (const sig of signals) {
    const contrib = eWeightContribution(sig);
    if (contrib <= 0) continue;
    rows.push({
      signal_id: sig.signal_id,
      contribution: contrib,
      source_question_ids: sig.source_question_ids,
      rank: sig.rank,
    });
    weightedSum += contrib;
  }
  rows.sort((a, b) => b.contribution - a.contribution);
  const intensity = intensityFromWeight("E", weightedSum);
  const band = intensityBand(intensity);
  return {
    set: record.set,
    file: record.file,
    rows,
    weightedSum,
    intensity,
    band,
  };
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function padNum(n: number, w = 8, decimals = 2): string {
  return pad(n.toFixed(decimals), w);
}

function printPerFixture(summaries: FixtureSummary[]): void {
  console.log("=== CC-ES — Extraversion signal-pool diagnostic ===");
  console.log(`E INTENSITY_K = ${INTENSITY_K.E}`);
  console.log(`Fixtures: ${summaries.length}`);
  console.log("");
  for (const s of summaries) {
    console.log(
      `--- ${s.set.padEnd(15)} ${pad(s.file, 45)} weighted_sum=${padNum(s.weightedSum, 6)} intensity=${String(s.intensity).padStart(3)} band=${s.band} ---`
    );
    if (s.rows.length === 0) {
      console.log("  (no E-tagged signals fired)");
      continue;
    }
    for (const r of s.rows) {
      const src = r.source_question_ids.join(",");
      const rk = r.rank === undefined ? "—" : String(r.rank);
      console.log(
        `  ${pad(r.signal_id, 40)} contribution=${padNum(r.contribution, 6)}  rank=${rk.padStart(2)}  source=[${src}]`
      );
    }
  }
}

type AggregateRow = {
  signal_id: string;
  fixturesFiringIn: number;
  totalContribution: number;
  meanRank: number | null;
};

function printAggregate(summaries: FixtureSummary[]): void {
  const total = summaries.length;
  const counts: Record<string, AggregateRow> = {};
  for (const s of summaries) {
    for (const r of s.rows) {
      if (!counts[r.signal_id]) {
        counts[r.signal_id] = {
          signal_id: r.signal_id,
          fixturesFiringIn: 0,
          totalContribution: 0,
          meanRank: 0,
        };
      }
      counts[r.signal_id].fixturesFiringIn++;
      counts[r.signal_id].totalContribution += r.contribution;
      if (r.rank !== undefined && counts[r.signal_id].meanRank !== null) {
        counts[r.signal_id].meanRank! += r.rank;
      } else if (r.rank === undefined) {
        counts[r.signal_id].meanRank = null;
      }
    }
  }
  const rows = Object.values(counts).map((r) => {
    if (r.meanRank !== null && r.fixturesFiringIn > 0) {
      r.meanRank = r.meanRank / r.fixturesFiringIn;
    }
    return r;
  });
  rows.sort((a, b) => b.fixturesFiringIn - a.fixturesFiringIn);
  console.log("");
  console.log("=== Aggregate fire-rate (descending) ===");
  console.log(
    `${pad("signal_id", 40)} ${pad("fired/total", 14)} ${pad("fire_rate", 10)} ${pad("total_contrib", 14)} mean_rank  flag`
  );
  for (const r of rows) {
    const rate = (r.fixturesFiringIn / total) * 100;
    const flag = rate >= 70 ? "UNIVERSAL" : rate >= 40 ? "common" : "distinctive";
    const meanRankStr =
      r.meanRank === null ? "(unranked)" : r.meanRank.toFixed(2);
    console.log(
      `${pad(r.signal_id, 40)} ${pad(`${r.fixturesFiringIn}/${total}`, 14)} ${pad(`${rate.toFixed(1)}%`, 10)} ${pad(r.totalContribution.toFixed(2), 14)} ${meanRankStr.padEnd(10)} ${flag}`
    );
  }
}

function printSpread(summaries: FixtureSummary[]): void {
  const intensities = summaries.map((s) => s.intensity);
  const min = Math.min(...intensities);
  const max = Math.max(...intensities);
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const variance =
    intensities.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) /
    intensities.length;
  const std = Math.sqrt(variance);
  const bands: Record<string, number> = {
    "under-detected": 0,
    low: 0,
    moderate: 0,
    "moderate-high": 0,
    high: 0,
  };
  for (const s of summaries) bands[s.band] = (bands[s.band] ?? 0) + 1;
  console.log("");
  console.log("=== Cohort spread metrics ===");
  console.log(
    `min=${min} max=${max} mean=${mean.toFixed(2)} std=${std.toFixed(2)} spread=${max - min}`
  );
  console.log(
    `bands: under-detected=${bands["under-detected"]} low=${bands.low} moderate=${bands.moderate} moderate-high=${bands["moderate-high"]} high=${bands.high}`
  );
  const saturated = summaries.filter((s) => s.intensity >= 80).length;
  const saturatedGSG = summaries.filter(
    (s) => s.intensity >= 80 && s.set === "goal-soul-give"
  ).length;
  console.log(
    `E intensity ≥ 80: ${saturated}/${summaries.length} total | ${saturatedGSG}/13 goal-soul-give`
  );
}

function main(): number {
  const records = loadFixtures();
  // Sanity check the diagnostic against the engine: the diagnostic's
  // per-signal E weighted-sum must match the engine's E weighted-sum
  // (modulo the position-weighted Jungian bridge — which contributes
  // ZERO to E per CC-JX, so the harness's SIGNAL_OCEAN_TAGS-only path
  // is exhaustive for E).
  for (const r of records) {
    const engineSignals = deriveSignals(r.answers);
    const o = computeOceanOutput(engineSignals, r.answers);
    if (!o) continue;
    const engineE = o.dispositionSignalMix.intensities.extraversion;
    const diagE = summarizeFixture(r).intensity;
    if (Math.abs(engineE - diagE) > 1) {
      console.error(
        `diagnostic-vs-engine E mismatch on ${r.file}: engine=${engineE}, diagnostic=${diagE}`
      );
      return 1;
    }
  }
  const summaries = records.map(summarizeFixture);
  printPerFixture(summaries);
  printAggregate(summaries);
  printSpread(summaries);
  return 0;
}

process.exit(main());
