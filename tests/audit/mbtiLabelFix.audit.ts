// CODEX-MBTI-LABEL-FIX — canonical Jung-pair + margin-aware confidence audit.
//
// Invocation: `npx tsx tests/audit/mbtiLabelFix.audit.ts`

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildCoreSignalCells } from "../../lib/coreSignalMap";
import { buildInnerConstitution } from "../../lib/identityEngine";
import {
  aggregateLensStack,
  JUNGIAN_ALL_FUNCTIONS,
  JUNGIAN_MBTI_LOOKUP,
  JUNGIAN_STACK_TABLE,
  JUNGIAN_VALID_AUX_BY_DOMINANT,
  MBTI_TIE_MARGIN,
} from "../../lib/jungianStack";
import type {
  Answer,
  CognitiveFunctionId,
  DemographicSet,
  Signal,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const FIXTURE_DIRS = [
  join(ROOT, "ocean"),
  join(ROOT, "goal-soul-give"),
];

type FixtureRecord = {
  id: string;
  answers: Answer[];
  demographics: DemographicSet | null;
};

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type FunctionRank = {
  fn: CognitiveFunctionId;
  avg: number;
};

function loadFixtures(): FixtureRecord[] {
  return FIXTURE_DIRS.flatMap((dir) => {
    const set = dir.endsWith("ocean") ? "ocean" : "goal-soul-give";
    return readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => {
        const raw = JSON.parse(readFileSync(join(dir, file), "utf-8")) as {
          answers: Answer[];
          demographics?: DemographicSet | null;
        };
        return {
          id: `${set}/${file}`,
          answers: raw.answers,
          demographics: raw.demographics ?? null,
        };
      });
  });
}

function avgRank(signals: Signal[], fn: CognitiveFunctionId): number {
  const matches = signals.filter(
    (s) => s.signal_id === fn && s.rank !== undefined
  );
  if (matches.length === 0) return Number.POSITIVE_INFINITY;
  return matches.reduce((sum, s) => sum + (s.rank ?? 0), 0) / matches.length;
}

function sortedFunctionRanks(signals: Signal[]): FunctionRank[] {
  return JUNGIAN_ALL_FUNCTIONS.map((fn) => ({
    fn,
    avg: avgRank(signals, fn),
  })).sort((a, b) => {
    if (a.avg !== b.avg) return a.avg - b.avg;
    const perceiving = ["ni", "ne", "si", "se"] as CognitiveFunctionId[];
    const aPerceiving = perceiving.includes(a.fn);
    const bPerceiving = perceiving.includes(b.fn);
    if (aPerceiving !== bPerceiving) return aPerceiving ? -1 : 1;
    return a.fn.localeCompare(b.fn);
  });
}

function isCanonicalPair(
  dominant: CognitiveFunctionId,
  auxiliary: CognitiveFunctionId
): boolean {
  return Boolean(JUNGIAN_STACK_TABLE[`${dominant}|${auxiliary}`]);
}

function expectedConfidence(signals: Signal[]): "high" | "low" {
  const allRanks = sortedFunctionRanks(signals);
  const perceiving = ["ni", "ne", "si", "se"] as CognitiveFunctionId[];
  const judging = ["ti", "te", "fi", "fe"] as CognitiveFunctionId[];
  const perceivingRanks = perceiving
    .map((fn) => ({ fn, avg: avgRank(signals, fn) }))
    .sort((a, b) => a.avg - b.avg || a.fn.localeCompare(b.fn));
  const judgingRanks = judging
    .map((fn) => ({ fn, avg: avgRank(signals, fn) }))
    .sort((a, b) => a.avg - b.avg || a.fn.localeCompare(b.fn));
  const dominant =
    perceivingRanks[0].avg <= judgingRanks[0].avg
      ? perceivingRanks[0]
      : judgingRanks[0];
  if (!dominant || !isFinite(dominant.avg)) return "low";
  const validAux = JUNGIAN_VALID_AUX_BY_DOMINANT[dominant.fn];
  const auxRanks = validAux
    .map((fn) => ({ fn, avg: avgRank(signals, fn) }))
    .sort((a, b) => a.avg - b.avg || a.fn.localeCompare(b.fn));
  const auxiliary = auxRanks[0];
  const dominantPool = perceiving.includes(dominant.fn) ? perceiving : judging;
  const dominantRunnerUp = allRanks.find(
    (candidate) =>
      candidate.fn !== dominant.fn && dominantPool.includes(candidate.fn)
  );
  const auxRunnerUp = auxRanks[1];
  const dominantTooTight =
    dominantRunnerUp !== undefined &&
    dominantRunnerUp.avg - dominant.avg < MBTI_TIE_MARGIN;
  const auxTooTight =
    !isFinite(auxiliary.avg) ||
    (auxRunnerUp !== undefined &&
      auxRunnerUp.avg - auxiliary.avg < MBTI_TIE_MARGIN);
  return dominantTooTight || auxTooTight ? "low" : "high";
}

// Pre-CODEX behavior: top perceiver + top judger, with exact-tie confidence.
function legacyStack(signals: Signal[]): {
  pair: string;
  labelVisible: boolean;
  mbtiCode: string;
} {
  const perceiving = ["ni", "ne", "si", "se"] as CognitiveFunctionId[];
  const judging = ["ti", "te", "fi", "fe"] as CognitiveFunctionId[];
  const pr = perceiving
    .map((fn) => ({ fn, avg: avgRank(signals, fn) }))
    .sort((a, b) => a.avg - b.avg || a.fn.localeCompare(b.fn));
  const jr = judging
    .map((fn) => ({ fn, avg: avgRank(signals, fn) }))
    .sort((a, b) => a.avg - b.avg || a.fn.localeCompare(b.fn));
  if (!isFinite(pr[0].avg) || !isFinite(jr[0].avg)) {
    return { pair: "ni|te", labelVisible: false, mbtiCode: "" };
  }
  const confidenceLow =
    (pr[1] !== undefined && pr[1].avg === pr[0].avg) ||
    (jr[1] !== undefined && jr[1].avg === jr[0].avg);
  const perceivingFirst = pr[0].avg <= jr[0].avg;
  const pair = perceivingFirst
    ? `${pr[0].fn}|${jr[0].fn}`
    : `${jr[0].fn}|${pr[0].fn}`;
  const mbtiCode = JUNGIAN_MBTI_LOOKUP[pair] ?? "";
  return { pair, labelVisible: Boolean(!confidenceLow && mbtiCode), mbtiCode };
}

function signal(fn: CognitiveFunctionId, rank: number): Signal {
  return {
    signal_id: fn,
    description: `${fn} synthetic rank ${rank}`,
    from_card: "temperament",
    source_question_ids: ["synthetic"],
    strength: "high",
    rank,
  };
}

function syntheticStack(ranks: Partial<Record<CognitiveFunctionId, number>>) {
  const signals = Object.entries(ranks).map(([fn, rank]) =>
    signal(fn as CognitiveFunctionId, rank)
  );
  return aggregateLensStack(signals);
}

function runAudit(): AssertionResult[] {
  const fixtures = loadFixtures();
  const rows = fixtures.map((fixture) => {
    const constitution = buildInnerConstitution(
      fixture.answers,
      [],
      fixture.demographics
    );
    const legacy = legacyStack(constitution.signals);
    const cells = buildCoreSignalCells(constitution);
    const surface =
      cells.find((cell) => cell.label === "Surface label")?.value ?? "";
    return { fixture, constitution, legacy, surface };
  });

  const results: AssertionResult[] = [];

  const nonCanonical = rows.filter(
    (row) =>
      !isCanonicalPair(
        row.constitution.lens_stack.dominant,
        row.constitution.lens_stack.auxiliary
      )
  );
  results.push(
    nonCanonical.length === 0
      ? { ok: true, assertion: "mbti-fix-canonical-pair-only" }
      : {
          ok: false,
          assertion: "mbti-fix-canonical-pair-only",
          detail: nonCanonical
            .map(
              (row) =>
                `${row.fixture.id}: ${row.constitution.lens_stack.dominant}|${row.constitution.lens_stack.auxiliary}`
            )
            .join(", "),
        }
  );

  const confidenceMismatches = rows.filter(
    (row) =>
      row.constitution.lens_stack.confidence !==
      expectedConfidence(row.constitution.signals)
  );
  results.push(
    confidenceMismatches.length === 0
      ? {
          ok: true,
          assertion: "mbti-fix-confidence-correctly-gated",
          detail: `margin=${MBTI_TIE_MARGIN}`,
        }
      : {
          ok: false,
          assertion: "mbti-fix-confidence-correctly-gated",
          detail: confidenceMismatches
            .map(
              (row) =>
                `${row.fixture.id}: got ${row.constitution.lens_stack.confidence}, expected ${expectedConfidence(row.constitution.signals)}`
            )
            .join(" | "),
        }
  );

  const mbtiMismatches = rows.filter((row) => {
    const stack = row.constitution.lens_stack;
    if (stack.confidence !== "high") return false;
    return (
      (JUNGIAN_MBTI_LOOKUP[`${stack.dominant}|${stack.auxiliary}`] ?? "") !==
      stack.mbtiCode
    );
  });
  results.push(
    mbtiMismatches.length === 0
      ? { ok: true, assertion: "mbti-fix-mbticode-matches-stack" }
      : {
          ok: false,
          assertion: "mbti-fix-mbticode-matches-stack",
          detail: mbtiMismatches.map((row) => row.fixture.id).join(", "),
        }
  );

  const lowSurfaceLeaks = rows.filter(
    (row) => row.constitution.lens_stack.confidence === "low" && row.surface
  );
  results.push(
    lowSurfaceLeaks.length === 0
      ? { ok: true, assertion: "mbti-fix-mbticode-empty-when-low" }
      : {
          ok: false,
          assertion: "mbti-fix-mbticode-empty-when-low",
          detail: lowSurfaceLeaks
            .map((row) => `${row.fixture.id}: ${row.surface}`)
            .join(", "),
        }
  );

  const beforeVisible = rows.filter((row) => row.legacy.labelVisible);
  const afterVisible = rows.filter((row) => row.surface);
  const lost = beforeVisible.filter(
    (before) => !afterVisible.some((after) => after.fixture.id === before.fixture.id)
  );
  results.push(
    lost.length === 0
      ? {
          ok: true,
          assertion: "mbti-fix-cohort-regression-no-spurious-labels",
          detail: `legacy=${beforeVisible.length}/${rows.length}; current=${afterVisible.length}/${rows.length}`,
        }
      : {
          ok: false,
          assertion: "mbti-fix-cohort-regression-no-spurious-labels",
          detail: lost.map((row) => row.fixture.id).join(", "),
        }
  );

  const jason = rows.find(
    (row) => row.fixture.id === "ocean/07-jason-real-session.json"
  );
  const jasonOk =
    jason?.constitution.lens_stack.dominant === "ni" &&
    jason?.constitution.lens_stack.auxiliary === "te" &&
    jason?.constitution.lens_stack.mbtiCode === "INTJ" &&
    jason?.constitution.lens_stack.confidence === "high" &&
    jason?.surface === "INTJ, provisional";
  results.push(
    jasonOk
      ? {
          ok: true,
          assertion: "mbti-fix-jason-fixture-now-labels",
          detail: "ocean/07-jason-real-session.json => INTJ, provisional",
        }
      : {
          ok: false,
          assertion: "mbti-fix-jason-fixture-now-labels",
          detail: JSON.stringify(jason?.constitution.lens_stack),
        }
  );

  const niTi = syntheticStack({ ni: 1, ti: 1, te: 2, fe: 4, ne: 3, si: 4, se: 5 });
  const neTe = syntheticStack({ ne: 1, te: 1, ti: 2, fi: 3, ni: 3, se: 4 });
  const niNeTie = syntheticStack({ ni: 1, ne: 1, te: 2, fe: 4, ti: 3, fi: 5 });
  const syntheticOk =
    niTi.dominant === "ni" &&
    niTi.auxiliary === "te" &&
    neTe.dominant === "ne" &&
    ["ti", "fi"].includes(neTe.auxiliary) &&
    niNeTie.confidence === "low";
  results.push(
    syntheticOk
      ? {
          ok: true,
          assertion: "mbti-fix-non-canonical-rejected",
          detail: `Ni/Ti->${niTi.dominant}|${niTi.auxiliary}; Ne/Te->${neTe.dominant}|${neTe.auxiliary}; Ni/Ne tie confidence=${niNeTie.confidence}`,
        }
      : {
          ok: false,
          assertion: "mbti-fix-non-canonical-rejected",
          detail: `Ni/Ti=${JSON.stringify(niTi)} Ne/Te=${JSON.stringify(neTe)} Ni/Ne=${JSON.stringify(niNeTie)}`,
        }
  );

  const changedPairs = rows.filter((row) => {
    const stack = row.constitution.lens_stack;
    return row.legacy.pair !== `${stack.dominant}|${stack.auxiliary}`;
  });
  console.log("CODEX-MBTI-LABEL-FIX — cohort summary");
  console.log("======================================");
  console.log(`Fixtures: ${rows.length}`);
  console.log(`Legacy visible labels: ${beforeVisible.length}/${rows.length}`);
  console.log(`Current visible labels: ${afterVisible.length}/${rows.length}`);
  console.log(
    `Gained labels: ${afterVisible
      .filter(
        (after) =>
          !beforeVisible.some((before) => before.fixture.id === after.fixture.id)
      )
      .map((row) => `${row.fixture.id}=${row.surface}`)
      .join(", ") || "none"}`
  );
  console.log(`Lost labels: ${lost.map((row) => row.fixture.id).join(", ") || "none"}`);
  console.log(
    `Changed pairs: ${changedPairs
      .map(
        (row) =>
          `${row.fixture.id}: ${row.legacy.pair} -> ${row.constitution.lens_stack.dominant}|${row.constitution.lens_stack.auxiliary}`
      )
      .join(", ") || "none"}`
  );
  console.log("");

  return results;
}

function main(): number {
  const results = runAudit();
  let failures = 0;
  for (const result of results) {
    const detail = result.detail ? ` — ${result.detail}` : "";
    console.log(`[${result.ok ? "PASS" : "FAIL"}] ${result.assertion}${detail}`);
    if (!result.ok) failures++;
  }
  console.log("");
  if (failures > 0) {
    console.error(`AUDIT FAILED — ${failures} failure(s).`);
    return 1;
  }
  console.log("AUDIT PASSED — all MBTI label-fix assertions green.");
  return 0;
}

process.exit(main());
