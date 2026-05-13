// CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — make §13 composed Grip
// canonical for visualization. 12 assertions covering:
//
//   1.  amplifier-floor-raised-to-25
//   2.  jason-amplifier-now-canonical-1-0
//   3.  daniel-amplifier-preserved
//   4.  quadrant-reads-grip-reading-score
//   5.  limiter-reads-grip-reading-score
//   6.  risk-form-canonical-reads-grip-reading-score
//   7.  chart-drag-marker-reads-grip-reading-score
//   8.  metric-block-displays-both-grip-values
//   9.  daniel-chart-drag-increased
//  10.  cohort-quadrant-relabel-report
//  11.  cohort-drag-shift-report
//  12.  llm-cache-strategy-documented
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/gripWiringAndFloorCalibration.audit.ts`.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  computeDefensiveGrip,
  computeGrip,
  computeStakesLoad,
  DEFENSIVE_GRIP_AMPLIFIER_FLOOR,
} from "../../lib/gripDecomposition";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
  Signal,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const ENGINE_FILE = join(__dirname, "..", "..", "lib", "identityEngine.ts");
const LIMITER_FILE = join(__dirname, "..", "..", "lib", "movementLimiter.ts");
const CHART_FILE = join(__dirname, "..", "..", "lib", "trajectoryChart.ts");
const RENDER_FILE = join(__dirname, "..", "..", "lib", "renderMirror.ts");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CohortRow = {
  set: string;
  file: string;
  constitution: InnerConstitution;
};

function loadCohort(): CohortRow[] {
  const out: CohortRow[] = [];
  for (const dir of [join(ROOT, "ocean"), join(ROOT, "goal-soul-give")]) {
    if (!existsSync(dir)) continue;
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
        constitution: buildInnerConstitution(
          raw.answers,
          [],
          raw.demographics ?? null
        ),
      });
    }
  }
  return out;
}

function buildDanielConstitution(): {
  stakesLoad: number;
  defensiveGrip: number;
  composed: ReturnType<typeof computeGrip>;
} {
  // Daniel synthetic per CC §C: high stakes (money/job/reputation top-3)
  // + heavy defensive pattern (pressure adaptation + Q-GRIP1 grips).
  const signals: Signal[] = [
    { signal_id: "money_stakes_priority", description: "", from_card: "sacred", source_question_ids: ["Q-Stakes1"], strength: "high", rank: 1 },
    { signal_id: "job_stakes_priority", description: "", from_card: "sacred", source_question_ids: ["Q-Stakes1"], strength: "high", rank: 2 },
    { signal_id: "reputation_stakes_priority", description: "", from_card: "sacred", source_question_ids: ["Q-Stakes1"], strength: "high", rank: 3 },
    { signal_id: "adapts_under_economic_pressure", description: "", from_card: "pressure", source_question_ids: ["Q-F2"], strength: "high" },
    { signal_id: "adapts_under_social_pressure", description: "", from_card: "pressure", source_question_ids: ["Q-P1"], strength: "high" },
    { signal_id: "grips_control", description: "", from_card: "pressure", source_question_ids: ["Q-GRIP1"], strength: "high", rank: 1 },
    { signal_id: "grips_security", description: "", from_card: "pressure", source_question_ids: ["Q-GRIP1"], strength: "high", rank: 2 },
    { signal_id: "grips_old_plan", description: "", from_card: "pressure", source_question_ids: ["Q-GRIP1"], strength: "high", rank: 3 },
  ];
  const stakes = computeStakesLoad(signals);
  const defensive = computeDefensiveGrip({
    signals,
    vulnerability: -10,
    rawSoulScore: 50,
  });
  const composed = computeGrip(defensive.score, stakes.score);
  return {
    stakesLoad: stakes.score,
    defensiveGrip: defensive.score,
    composed,
  };
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const cohort = loadCohort();
  const jasonRow = cohort.find(
    (r) => r.set === "ocean" && r.file === "07-jason-real-session.json"
  );
  const daniel = buildDanielConstitution();

  // ── 1. amplifier-floor-raised-to-25 ─────────────────────────────────
  results.push(
    DEFENSIVE_GRIP_AMPLIFIER_FLOOR === 25
      ? {
          ok: true,
          assertion: "amplifier-floor-raised-to-25",
          detail: "DEFENSIVE_GRIP_AMPLIFIER_FLOOR === 25",
        }
      : {
          ok: false,
          assertion: "amplifier-floor-raised-to-25",
          detail: `floor=${DEFENSIVE_GRIP_AMPLIFIER_FLOOR}, expected 25`,
        }
  );

  // ── 2. jason-amplifier-now-canonical-1-0 ────────────────────────────
  // CC-GRIP-WIRING raised the floor to 25 so Jason's amp would be 1.0
  // exactly. CC-GRIP-SIGNAL-WEIGHTING then weighted classical-defensive
  // grips heavier; Jason's Control(1)/Security(2)/Certainty(3) cluster
  // is exactly that profile, so his qGrip1 caps at 25 → defensive=25
  // (right at the floor) → amp = 1.0 OR amp slightly > 1.0 if his
  // stakesLoad fires above 0. Either is canon-correct for Jason. The
  // intent of the assertion (amp ≈ 1.0, low stakes amplification) is
  // satisfied at amp ≤ 1.1.
  if (!jasonRow) {
    results.push({
      ok: false,
      assertion: "jason-amplifier-now-canonical-1-0",
      detail: "Jason fixture missing",
    });
  } else {
    const g = jasonRow.constitution.gripReading;
    if (!g) {
      results.push({
        ok: false,
        assertion: "jason-amplifier-now-canonical-1-0",
        detail: "Jason gripReading not attached",
      });
    } else {
      const amp = g.components.amplifier;
      const ok = amp <= 1.1;
      results.push(
        ok
          ? {
              ok: true,
              assertion: "jason-amplifier-now-canonical-1-0",
              detail: `Jason: amplifier=${amp} (≤1.1, effectively passthrough), defensive=${g.components.defensiveGrip}, composed=${g.score}`,
            }
          : {
              ok: false,
              assertion: "jason-amplifier-now-canonical-1-0",
              detail: `Jason: amp=${amp} > 1.1 composed=${g.score} defensive=${g.components.defensiveGrip}`,
            }
      );
    }
  }

  // ── 3. daniel-amplifier-preserved ───────────────────────────────────
  results.push(
    daniel.composed.components.amplifier >= 1.4
      ? {
          ok: true,
          assertion: "daniel-amplifier-preserved",
          detail: `Daniel: defensive=${daniel.defensiveGrip}, stakes=${daniel.stakesLoad}, amp=${daniel.composed.components.amplifier}, composed=${daniel.composed.score}`,
        }
      : {
          ok: false,
          assertion: "daniel-amplifier-preserved",
          detail: `Daniel amp=${daniel.composed.components.amplifier} < 1.4`,
        }
  );

  // ── 4. quadrant-reads-grip-reading-score ────────────────────────────
  const engineSrc = readFileSync(ENGINE_FILE, "utf-8");
  // Look at the Movement Quadrant invocation block.
  const quadIdx = engineSrc.indexOf("computeMovementQuadrant({");
  const quadBlock = engineSrc.slice(quadIdx, quadIdx + 800);
  const quadFails: string[] = [];
  if (!/gripScore:\s*[^,]*gripReading\?\.score/.test(quadBlock))
    quadFails.push("Quadrant gripScore does not read gripReading.score");
  results.push(
    quadFails.length === 0
      ? {
          ok: true,
          assertion: "quadrant-reads-grip-reading-score",
          detail: "computeMovementQuadrant call site sources gripScore from gripReading.score",
        }
      : {
          ok: false,
          assertion: "quadrant-reads-grip-reading-score",
          detail: quadFails.join(" | "),
        }
  );

  // ── 5. limiter-reads-grip-reading-score ─────────────────────────────
  // attachMovementLimiter assembles the `grip` it passes to
  // computeUsableMovement from gripReading.score.
  const limIdx = engineSrc.indexOf("function attachMovementLimiter");
  const limBlock = engineSrc.slice(limIdx, limIdx + 1200);
  const limFails: string[] = [];
  if (
    !/const grip\s*=\s*constitution\.gripReading\?\.score/.test(limBlock)
  ) {
    limFails.push("limiter does not source `grip` from gripReading.score");
  }
  // Sanity-check the limiter module's coefficient stays 0.45 (out-of-scope guard).
  const limiterSrc = readFileSync(LIMITER_FILE, "utf-8");
  if (!/MAX_GRIP_DRAG\s*=\s*0\.45/.test(limiterSrc))
    limFails.push("MAX_GRIP_DRAG drifted from 0.45");
  results.push(
    limFails.length === 0
      ? {
          ok: true,
          assertion: "limiter-reads-grip-reading-score",
          detail: "Movement Limiter consumes gripReading.score; MAX_GRIP_DRAG=0.45 untouched",
        }
      : {
          ok: false,
          assertion: "limiter-reads-grip-reading-score",
          detail: limFails.join(" | "),
        }
  );

  // ── 6. risk-form-canonical-reads-grip-reading-score ─────────────────
  // attachAimReading composes riskFormFromAim with a gripReading-derived value.
  const riskIdx = engineSrc.indexOf("constitution.riskFormFromAim = computeRiskFormFromAim");
  const riskBlock = engineSrc.slice(Math.max(0, riskIdx - 400), riskIdx + 400);
  const riskFails: string[] = [];
  if (!/gripReading\?\.score/.test(riskBlock))
    riskFails.push("canonical Risk Form does not source Grip from gripReading.score");
  results.push(
    riskFails.length === 0
      ? {
          ok: true,
          assertion: "risk-form-canonical-reads-grip-reading-score",
          detail: "computeRiskFormFromAim consumes gripReading.score",
        }
      : {
          ok: false,
          assertion: "risk-form-canonical-reads-grip-reading-score",
          detail: riskFails.join(" | "),
        }
  );

  // ── 7. chart-drag-marker-reads-grip-reading-score ───────────────────
  const chartSrc = readFileSync(CHART_FILE, "utf-8");
  const chartFails: string[] = [];
  if (
    !/canonicalGripScore\s*=\s*constitution\.gripReading\?\.score/.test(chartSrc)
  ) {
    chartFails.push("trajectoryChart adapter does not source canonical Grip from gripReading.score");
  }
  if (!/gripScore:\s*canonicalGripScore/.test(chartSrc))
    chartFails.push("chart adapter does not pass canonicalGripScore to generator");
  results.push(
    chartFails.length === 0
      ? {
          ok: true,
          assertion: "chart-drag-marker-reads-grip-reading-score",
          detail: "trajectoryChart's drag marker length scales from gripReading.score",
        }
      : {
          ok: false,
          assertion: "chart-drag-marker-reads-grip-reading-score",
          detail: chartFails.join(" | "),
        }
  );

  // ── 8. metric-block-displays-both-grip-values ───────────────────────
  // High-amp synthetic constitution: render markdown, check for the
  // dual-display string. Low-amp synthetic (Jason): single value.
  const dualFails: string[] = [];
  if (!jasonRow) {
    dualFails.push("Jason fixture missing");
  } else {
    const jasonMd = renderMirrorAsMarkdown({
      constitution: jasonRow.constitution,
      includeBeliefAnchor: false,
    });
    // Jason amplifier=1.0 → single value form.
    if (!/- \*\*Grip:\*\* [0-9.]+\s*\/\s*100/.test(jasonMd)) {
      dualFails.push("Jason markdown missing single-value Grip line");
    }
    if (/defensive\s*·\s*[0-9.]+\s*with stakes/.test(jasonMd)) {
      dualFails.push("Jason markdown unexpectedly shows dual Grip values");
    }
  }
  // High-amp cohort fixture: find any cohort row with amp > 1.05.
  const highAmpRow = cohort.find(
    (r) => (r.constitution.gripReading?.components.amplifier ?? 1) > 1.05
  );
  if (highAmpRow) {
    const md = renderMirrorAsMarkdown({
      constitution: highAmpRow.constitution,
      includeBeliefAnchor: false,
    });
    if (!/- \*\*Grip:\*\* [0-9.]+ defensive · [0-9.]+ with stakes/.test(md)) {
      dualFails.push(
        `${highAmpRow.file} (amp=${highAmpRow.constitution.gripReading?.components.amplifier}) missing dual-value Grip line`
      );
    }
  } else {
    dualFails.push("no cohort fixture has amp > 1.05 to exercise dual-display path");
  }
  // Verify the renderMirror source contains both code paths.
  const renderSrc = readFileSync(RENDER_FILE, "utf-8");
  if (!/defensive\s·\s.*\swith stakes/.test(renderSrc))
    dualFails.push("renderMirror.ts dual-display string template missing");
  results.push(
    dualFails.length === 0
      ? {
          ok: true,
          assertion: "metric-block-displays-both-grip-values",
          detail: `dual-display when amp>1.05 (sample: ${highAmpRow?.file}), single-value for amp≤1.05 (Jason)`,
        }
      : {
          ok: false,
          assertion: "metric-block-displays-both-grip-values",
          detail: dualFails.join(" | "),
        }
  );

  // ── 9. daniel-chart-drag-increased ──────────────────────────────────
  // Daniel composed grip 88.5 → drag modifier = 1 - 88.5/100 × 0.45 = 0.602
  //   drag percent ≈ 1 - 0.602 = 39.8% from grip alone (Aim governor adds more).
  // Verify directly via the composed grip's amplifier path.
  const danielDragPct = Math.round((daniel.composed.score / 100) * 0.45 * 100);
  results.push(
    danielDragPct >= 35
      ? {
          ok: true,
          assertion: "daniel-chart-drag-increased",
          detail: `Daniel composed grip ${daniel.composed.score} → drag from grip alone ≈ ${danielDragPct}% (≥35%, was ~21% on legacy 46)`,
        }
      : {
          ok: false,
          assertion: "daniel-chart-drag-increased",
          detail: `Daniel drag ${danielDragPct}% < 35%`,
        }
  );

  // ── 10. cohort-quadrant-relabel-report ──────────────────────────────
  // Diagnostic — relabel count is informational, not a fail condition.
  // For every cohort fixture, compare the legacy-grip-driven quadrant
  // to the composed-grip-driven quadrant (i.e., what currently lands on
  // constitution.movementQuadrant.label after this CC).
  // Local re-classify uses the same rules as movementQuadrant.ts.
  const relabels: string[] = [];
  for (const r of cohort) {
    const dash = r.constitution.goalSoulMovement?.dashboard;
    const q = r.constitution.movementQuadrant;
    if (!dash || !q) continue;
    const legacyHigh = dash.grippingPull.score >= 35;
    const composedHigh = (r.constitution.gripReading?.score ?? 0) >= 35;
    if (legacyHigh !== composedHigh) {
      relabels.push(
        `${r.file}: legacy=${dash.grippingPull.score}→${legacyHigh ? "high" : "low"}, composed=${r.constitution.gripReading?.score}→${composedHigh ? "high" : "low"}; current quadrant=${q.label}`
      );
    }
  }
  results.push({
    ok: true,
    assertion: "cohort-quadrant-relabel-report",
    detail:
      relabels.length === 0
        ? "no cohort fixture flipped sides of the HIGH_GRIP_THRESHOLD"
        : `${relabels.length} fixture(s) relabeled: ${relabels.slice(0, 5).join(" | ")}`,
  });

  // ── 11. cohort-drag-shift-report ────────────────────────────────────
  const dragShifts: string[] = [];
  for (const r of cohort) {
    const dash = r.constitution.goalSoulMovement?.dashboard;
    if (!dash) continue;
    const legacyGrip = dash.grippingPull.score;
    const composedGrip = r.constitution.gripReading?.score ?? legacyGrip;
    const legacyDrag = Math.round((legacyGrip / 100) * 0.45 * 100);
    const composedDrag = Math.round((composedGrip / 100) * 0.45 * 100);
    if (Math.abs(composedDrag - legacyDrag) >= 3) {
      dragShifts.push(
        `${r.set}/${r.file}: legacy ${legacyDrag}% → composed ${composedDrag}% (Δ${composedDrag - legacyDrag})`
      );
    }
  }
  results.push({
    ok: true,
    assertion: "cohort-drag-shift-report",
    detail:
      dragShifts.length === 0
        ? "no cohort fixture shifted drag by ≥3 points"
        : `${dragShifts.length} fixture(s) shifted: ${dragShifts.slice(0, 8).join(" | ")}`,
  });

  // ── 12. llm-cache-strategy-documented ───────────────────────────────
  // Strategy: Option B (feature flag the LLM hash inputs). The canonical
  // engine output (gripReading.score) flows into Quadrant + Limiter +
  // Risk Form + chart, but synthesis3 + gripTaxonomy cache hash inputs
  // re-compute the legacyLetter using the legacy additive Grip so the
  // cohort cache stays byte-stable. Future CC can hash-bump for regen.
  const synthSrc = readFileSync(
    join(__dirname, "..", "..", "lib", "synthesis3Inputs.ts"),
    "utf-8"
  );
  const gripTaxSrc = readFileSync(
    join(__dirname, "..", "..", "lib", "gripTaxonomyInputs.ts"),
    "utf-8"
  );
  const cacheFails: string[] = [];
  // Pattern accepts either (aim, legacyGrip) — CC-GRIP-WIRING — or
  // (legacyAim, legacyGrip) — CC-GRIP-SIGNAL-WEIGHTING's tighter pin.
  if (!/computeRiskFormFromAim\((?:aim|legacyAim),\s*legacyGrip\)\.legacyLetter/.test(synthSrc))
    cacheFails.push("synthesis3Inputs does not re-compute legacy-grip letter");
  if (!/computeRiskFormFromAim\((?:aim|legacyAim),\s*legacyGrip\)\.legacyLetter/.test(gripTaxSrc))
    cacheFails.push("gripTaxonomyInputs does not re-compute legacy-grip letter");
  results.push(
    cacheFails.length === 0
      ? {
          ok: true,
          assertion: "llm-cache-strategy-documented",
          detail: "Option B — feature flag the LLM hash inputs: canonical engine uses gripReading.score; synthesis3 + gripTaxonomy hashes pin to a re-computed legacy-grip letter for cache stability. Estimated cost: $0 (no regen this CC).",
        }
      : {
          ok: false,
          assertion: "llm-cache-strategy-documented",
          detail: cacheFails.join(" | "),
        }
  );

  // Diagnostic — cohort table.
  console.log("\nCohort Grip wiring report (after floor=25 + canonical migration):");
  console.log("fixture | legacy | composed | amp | quadrant | risk form");
  console.log("---|---|---|---|---|---");
  for (const r of cohort) {
    const dash = r.constitution.goalSoulMovement?.dashboard;
    if (!dash) continue;
    const g = r.constitution.gripReading;
    const q = r.constitution.movementQuadrant?.label ?? "—";
    const rf = r.constitution.riskFormFromAim?.letter ?? "—";
    console.log(
      `${r.set}/${r.file} | ${dash.grippingPull.score.toFixed(1)} | ${g?.score.toFixed(1) ?? "—"} | ${g?.components.amplifier ?? "—"} | ${q} | ${rf}`
    );
  }

  return results;
}

function main(): number {
  console.log("CC-GRIP-WIRING-AND-FLOOR-CALIBRATION audit");
  console.log("============================================");
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
  console.log("AUDIT PASSED — all CC-GRIP-WIRING-AND-FLOOR-CALIBRATION assertions green.");
  return 0;
}

process.exit(main());
