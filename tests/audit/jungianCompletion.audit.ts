// CC-JUNGIAN-COMPLETION — pattern-catalog function-coverage audit.
//
// Background: `project_pattern_catalog_function_bias` (memory) noted that
// only 3 of 8 cognitive functions had cross-card pattern coverage and
// queued 5 candidate patterns leveraging si/se/ti/fi/fe. CC-029 (Pattern
// Catalog Expansion, Tier 2) shipped exactly those 5 patterns —
// si_tradition_built_from_chaos / se_crisis_alive_planning_strain /
// ti_closed_reasoning_chamber / fi_personally_authentic_only /
// fe_attunement_to_yielded_conviction — closing the gap the memory
// described. This audit locks that coverage in as regression protection.
//
// CC-JUNGIAN-COMPLETION's gating directive said to scope down when the
// audit shows existing coverage. With all 5 functions covered by CC-029
// patterns, no new patterns are authored here; the audit ships as the
// load-bearing artifact so any future refactor that silently drops a
// function from the catalog fails fast.
//
// Eight assertions:
//   - jungian-completion-{si,se,ti,fi,fe}-pattern-present (5 functions)
//   - jungian-completion-cohort-coverage (visibility, no pass/fail)
//   - jungian-completion-no-hedge-density-spike (delta against canon)
//   - jungian-completion-pattern-renders-as-pattern-in-motion (CC-PROSE-1A
//     "Pattern in motion" footer renders for fixtures that fire any of
//     the 5 function-tagged patterns)
//
// Hand-rolled. Invocation: `npx tsx tests/audit/jungianCompletion.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildInnerConstitution,
  CROSS_CARD_PATTERNS,
  detectCrossCardPatterns,
} from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type {
  Answer,
  CognitiveFunctionId,
  DemographicSet,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const OCEAN_DIR = join(ROOT, "ocean");
const GSG_DIR = join(ROOT, "goal-soul-give");

type FixtureRecord = {
  set: "ocean" | "goal-soul-give";
  file: string;
  answers: Answer[];
  demographics: DemographicSet | null;
};

function loadFixtures(): FixtureRecord[] {
  const out: FixtureRecord[] = [];
  for (const dir of [OCEAN_DIR, GSG_DIR]) {
    const set = dir.endsWith("ocean") ? "ocean" : "goal-soul-give";
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      out.push({
        set,
        file: f,
        answers: raw.answers,
        demographics: raw.demographics ?? null,
      });
    }
  }
  return out;
}

// Hedge phrase set mirrors CC-PROSE-1's audit canon. Used only for the
// no-spike assertion so a future pattern addition that injects hedge
// language fails fast.
const HEDGE_PHRASES: readonly string[] = [
  "appears to",
  "may ",
  "tends to",
  "suggests",
  "likely",
  "this is conditional",
  "could ",
];

// ── Assertion 1-5: per-function pattern-present check ───────────────────
//
// We grep each pattern's source `detection` function string for the
// canonical lensStack-function-id reference (e.g., `lensStack.dominant ===
// "si"`). Auxiliary references (`lensStack.auxiliary === "si"`) also
// count. This is a static check — does the catalog itself reference the
// function? — independent of cohort-firing data.

function patternMentionsFunction(
  pattern: (typeof CROSS_CARD_PATTERNS)[number],
  fn: CognitiveFunctionId
): boolean {
  const src = pattern.detection.toString();
  // Match either dominant or auxiliary equality on the function id.
  // The id is always lowercase (canonical CognitiveFunctionId shape).
  return (
    src.includes(`dominant === "${fn}"`) ||
    src.includes(`auxiliary === "${fn}"`) ||
    // Defensive: also accept array-style membership checks for forward
    // compatibility (e.g., `["si","se"].includes(lensStack.dominant)`).
    new RegExp(`["']${fn}["']`).test(src)
  );
}

function functionHasPattern(fn: CognitiveFunctionId): {
  ok: boolean;
  ids: string[];
} {
  const ids: string[] = [];
  for (const p of CROSS_CARD_PATTERNS) {
    if (patternMentionsFunction(p, fn)) ids.push(p.pattern_id);
  }
  return { ok: ids.length > 0, ids };
}

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function runAssertions(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // 1-5 — per-function pattern-present.
  const targetFunctions: CognitiveFunctionId[] = [
    "si",
    "se",
    "ti",
    "fi",
    "fe",
  ];
  for (const fn of targetFunctions) {
    const { ok, ids } = functionHasPattern(fn);
    results.push(
      ok
        ? {
            ok: true,
            assertion: `jungian-completion-${fn}-pattern-present`,
            detail: `pattern ids: ${ids.join(", ")}`,
          }
        : {
            ok: false,
            assertion: `jungian-completion-${fn}-pattern-present`,
            detail: `no pattern in CROSS_CARD_PATTERNS references ${fn} via lensStack.dominant or lensStack.auxiliary`,
          }
    );
  }

  // 6 — Cohort coverage (visibility, no pass/fail). For each of the 5
  // functions, count how many of the 20 fixtures fire AT LEAST ONE
  // pattern that mentions that function.
  const fixtures = loadFixtures();
  const cohortByFunction: Record<CognitiveFunctionId, number> = {
    ni: 0,
    ne: 0,
    si: 0,
    se: 0,
    ti: 0,
    te: 0,
    fi: 0,
    fe: 0,
  };
  let totalFiredAnyTargetPattern = 0;
  let totalHedgeCount = 0;
  let renderedAnyTargetMotion = 0;
  let renderedAnyTargetMotionExpected = 0;

  for (const fix of fixtures) {
    const c = buildInnerConstitution(fix.answers, [], fix.demographics);
    const fired = detectCrossCardPatterns(
      c.signals,
      [],
      [],
      c.lens_stack,
      c.meta_signals,
      fix.demographics
    );
    // Per-function firing — count fixture once per function whose
    // pattern fired. Use a Set to avoid double-counting if multiple
    // function-tagged patterns fire for the same fixture and function.
    const firedFns = new Set<CognitiveFunctionId>();
    for (const f of fired) {
      for (const fn of targetFunctions) {
        if (patternMentionsFunction(f.pattern, fn)) firedFns.add(fn);
      }
    }
    for (const fn of firedFns) cohortByFunction[fn]++;
    if (firedFns.size > 0) totalFiredAnyTargetPattern++;

    // Hedge count — sum across the entire rendered markdown for the
    // density delta assertion. We use a fixed generatedAt so the date
    // string contributions to the render are deterministic.
    const md = renderMirrorAsMarkdown({
      constitution: c,
      demographics: fix.demographics,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-08T12:00:00Z"),
    });
    for (const phrase of HEDGE_PHRASES) {
      const matches = md.match(new RegExp(phrase, "gi"));
      totalHedgeCount += matches?.length ?? 0;
    }

    // Pattern-in-motion render check: when at least one CC-029 target
    // pattern fired, the rendered markdown MUST contain the
    // "**Pattern in motion** —" footer per CC-PROSE-1A canon.
    if (firedFns.size > 0) {
      renderedAnyTargetMotionExpected++;
      if (/\*\*Pattern in motion\*\* — /.test(md)) {
        renderedAnyTargetMotion++;
      }
    }
  }

  results.push({
    ok: true,
    assertion: "jungian-completion-cohort-coverage",
    detail: targetFunctions
      .map((fn) => `${fn}=${cohortByFunction[fn]}/${fixtures.length}`)
      .join(", "),
  });

  // 7 — Hedge density delta. Pre-CC-PROSE-1B audits report 30-47 hedges
  // per fixture (per `feedback_hedge_density_in_engine_prose`). We
  // capture the average and assert it stays inside that band — this CC
  // adds NO prose, so the average is the post-CC-029 rate verbatim and
  // should not move from one run to the next. A bound of [25, 60]
  // catches both unexpected adds (a future pattern that injects hedge
  // language) and unexpected removes (a refactor that strips hedges).
  const avgHedge = totalHedgeCount / fixtures.length;
  const HEDGE_FLOOR = 25;
  const HEDGE_CEIL = 60;
  results.push(
    avgHedge >= HEDGE_FLOOR && avgHedge <= HEDGE_CEIL
      ? {
          ok: true,
          assertion: "jungian-completion-no-hedge-density-spike",
          detail: `avg hedges/fixture = ${avgHedge.toFixed(1)} ∈ [${HEDGE_FLOOR}, ${HEDGE_CEIL}]`,
        }
      : {
          ok: false,
          assertion: "jungian-completion-no-hedge-density-spike",
          detail: `avg hedges/fixture = ${avgHedge.toFixed(1)} outside [${HEDGE_FLOOR}, ${HEDGE_CEIL}]; hedge density shifted unexpectedly`,
        }
  );

  // 8 — Pattern-in-motion render verification.
  results.push(
    renderedAnyTargetMotionExpected === 0 ||
      renderedAnyTargetMotion === renderedAnyTargetMotionExpected
      ? {
          ok: true,
          assertion: "jungian-completion-pattern-renders-as-pattern-in-motion",
          detail: `${renderedAnyTargetMotion}/${renderedAnyTargetMotionExpected} fixtures with target-function patterns also rendered the **Pattern in motion** footer`,
        }
      : {
          ok: false,
          assertion: "jungian-completion-pattern-renders-as-pattern-in-motion",
          detail: `${renderedAnyTargetMotion}/${renderedAnyTargetMotionExpected} fixtures rendered the footer; expected all`,
        }
  );

  // Summary diagnostic line (not a numbered assertion — visibility only).
  console.log(
    `\nCohort summary: ${totalFiredAnyTargetPattern}/${fixtures.length} fixtures fire ≥1 of the 5 function-tagged patterns.\n`
  );

  return results;
}

function main(): number {
  console.log("CC-JUNGIAN-COMPLETION — pattern-catalog function-coverage audit");
  console.log("================================================================");
  const results = runAssertions();
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
    "AUDIT PASSED — all CC-JUNGIAN-COMPLETION assertions green; CC-029 function coverage locked in."
  );
  return 0;
}

process.exit(main());
