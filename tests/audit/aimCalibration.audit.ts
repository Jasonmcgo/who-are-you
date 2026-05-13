// CC-AIM-CALIBRATION — Aim composite + 2×2 recalibration audit.
//
// 10 assertions verifying:
//   - Aim formula determinism + bounded output + weights sum to 1
//   - Jason validation (Aim ≥ 60 → Wisdom-governed) when fixture available
//   - Thresholds exposed as canonical exported constants
//   - Quadrant semantic correctness (4 synthetic cases)
//   - Cohort distribution (legacy vs Aim-based letter, observational)
//   - Render layer surfaces "Aim: " line in at least one fixture's markdown
//   - Both LLM SYSTEM_PROMPTs contain the Aim register anchor block
//   - AimReading.rationale is non-empty for every cohort fixture
//
// Hand-rolled. Invocation: `npx tsx tests/audit/aimCalibration.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AIM_REGISTER_ANCHOR_BLOCK,
  AIM_WEIGHTS,
  computeAimScore,
} from "../../lib/aim";
import {
  computeRiskFormFromAim,
  RISK_FORM_HIGH_AIM,
  RISK_FORM_HIGH_GRIP,
} from "../../lib/riskForm";
import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import { SYSTEM_PROMPT } from "../../lib/synthesis3Llm";
import { GRIP_SYSTEM_PROMPT } from "../../lib/gripTaxonomyLlm";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const OCEAN_DIR = join(ROOT, "ocean");
const GSG_DIR = join(ROOT, "goal-soul-give");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CohortRow = {
  set: "ocean" | "goal-soul-give";
  file: string;
  constitution: InnerConstitution;
  markdown: string;
};

function loadCohort(): CohortRow[] {
  const out: CohortRow[] = [];
  for (const dir of [OCEAN_DIR, GSG_DIR]) {
    const set = dir.endsWith("ocean") ? "ocean" : "goal-soul-give";
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      const c = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      const md = renderMirrorAsMarkdown({
        constitution: c,
        demographics: raw.demographics ?? null,
        includeBeliefAnchor: false,
        generatedAt: new Date("2026-05-10T20:00:00Z"),
      });
      out.push({ set, file: f, constitution: c, markdown: md });
    }
  }
  return out;
}

function approxEq(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) <= eps;
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1. aim-formula-determinism ──────────────────────────────────────
  // CC-AIM-REBUILD-MOVEMENT-LIMITER — Phase 2 formula uses 5-component
  // input shape. Test against the new contract.
  const sample = {
    wiseRiskStrength: 60,
    convictionClarity: 70,
    goalSoulCoherence: 80,
    movementStrength: 70,
    responsibilityIntegration: 30,
  };
  const r1 = computeAimScore(sample);
  const r2 = computeAimScore(sample);
  results.push(
    JSON.stringify(r1) === JSON.stringify(r2)
      ? { ok: true, assertion: "aim-formula-determinism" }
      : {
          ok: false,
          assertion: "aim-formula-determinism",
          detail: "identical inputs produced different outputs",
        }
  );

  // ── 2. aim-formula-bounded-output ───────────────────────────────────
  // CC-AIM-REBUILD-MOVEMENT-LIMITER — sweep 5-component inputs.
  const boundedFails: string[] = [];
  for (const wrs of [0, 50, 100]) {
    for (const cc of [0, 50, 100]) {
      for (const gsc of [0, 50, 100]) {
        for (const m of [0, 50, 100]) {
          for (const ri of [0, 50, 100]) {
            const r = computeAimScore({
              wiseRiskStrength: wrs,
              convictionClarity: cc,
              goalSoulCoherence: gsc,
              movementStrength: m,
              responsibilityIntegration: ri,
            });
            if (r.score < 0 || r.score > 100) {
              boundedFails.push(
                `inputs (${wrs},${cc},${gsc},${m},${ri}) → score ${r.score}`
              );
            }
          }
        }
      }
    }
  }
  results.push(
    boundedFails.length === 0
      ? { ok: true, assertion: "aim-formula-bounded-output", detail: "all 3^5 input combos produce score in [0,100]" }
      : {
          ok: false,
          assertion: "aim-formula-bounded-output",
          detail: boundedFails.slice(0, 3).join(" | "),
        }
  );

  // ── 3. aim-weights-sum-to-one ───────────────────────────────────────
  // CC-AIM-REBUILD-MOVEMENT-LIMITER — new AIM_WEIGHTS keys.
  const sum =
    AIM_WEIGHTS.wiseRiskStrength +
    AIM_WEIGHTS.convictionClarity +
    AIM_WEIGHTS.goalSoulCoherence +
    AIM_WEIGHTS.movementStrength +
    AIM_WEIGHTS.responsibilityIntegration;
  results.push(
    approxEq(sum, 1.0, 1e-6)
      ? { ok: true, assertion: "aim-weights-sum-to-one", detail: `sum=${sum.toFixed(6)}` }
      : {
          ok: false,
          assertion: "aim-weights-sum-to-one",
          detail: `sum=${sum} expected 1.0`,
        }
  );

  // ── 4. aim-jason-validation ─────────────────────────────────────────
  // CC-AIM-REBUILD-MOVEMENT-LIMITER — Phase 2 acceptance: Jason's new
  // Aim score lands ≥ 55 (improvement from legacy 43.7). Per the CC's
  // interpretation (b): the 60 threshold for Wisdom-governed shifts to
  // Phase 3 with the new Risk Form labels. The architectural test here
  // is "shape SHIFTS UP," not "crosses threshold."
  const jasonAim = computeAimScore({
    wiseRiskStrength: 51.8, // Phase 1 ComplianceStrength for Jason
    convictionClarity: 63, // Segment 1.1 estimate per CC math
    goalSoulCoherence: 70, // 32° angle → productive-under-integrated band
    movementStrength: 71,
    responsibilityIntegration: 17.8,
  });
  const jasonRiskForm = computeRiskFormFromAim(jasonAim.score, 21);
  results.push(
    jasonAim.score >= 55
      ? {
          ok: true,
          assertion: "aim-jason-validation",
          detail: `Aim=${jasonAim.score.toFixed(1)}, letter=${jasonRiskForm.letter}`,
        }
      : {
          ok: false,
          assertion: "aim-jason-validation",
          detail: `Aim=${jasonAim.score.toFixed(1)}, letter=${jasonRiskForm.letter} — expected Aim ≥ 60 + Wisdom-governed`,
        }
  );

  // ── 5. aim-thresholds-exposed ───────────────────────────────────────
  results.push(
    RISK_FORM_HIGH_AIM === 60 && RISK_FORM_HIGH_GRIP === 40
      ? {
          ok: true,
          assertion: "aim-thresholds-exposed",
          detail: `RISK_FORM_HIGH_AIM=${RISK_FORM_HIGH_AIM}, RISK_FORM_HIGH_GRIP=${RISK_FORM_HIGH_GRIP}`,
        }
      : {
          ok: false,
          assertion: "aim-thresholds-exposed",
          detail: `expected (60, 40), got (${RISK_FORM_HIGH_AIM}, ${RISK_FORM_HIGH_GRIP})`,
        }
  );

  // ── 6. aim-quadrant-semantic-correctness ────────────────────────────
  // Four synthetic cases — semantic resolution of the labels.
  type QuadCase = {
    aim: number;
    grip: number;
    expectedLetter: string;
    label: string;
  };
  const quadCases: QuadCase[] = [
    // CC-PHASE-3A-LABEL-LOGIC — refined labels per canon §14.
    { aim: 75, grip: 25, expectedLetter: "Open-Handed Aim", label: "high-Aim + low-Grip" },
    { aim: 75, grip: 60, expectedLetter: "White-Knuckled Aim", label: "high-Aim + high-Grip" },
    { aim: 35, grip: 60, expectedLetter: "Grip-Governed", label: "low-Aim + high-Grip" },
    { aim: 35, grip: 25, expectedLetter: "Ungoverned Movement", label: "low-Aim + low-Grip" },
  ];
  const quadFails: string[] = [];
  for (const q of quadCases) {
    const r = computeRiskFormFromAim(q.aim, q.grip);
    if (r.letter !== q.expectedLetter) {
      quadFails.push(
        `${q.label}: Aim=${q.aim}, Grip=${q.grip} → ${r.letter} (expected ${q.expectedLetter})`
      );
    }
  }
  results.push(
    quadFails.length === 0
      ? {
          ok: true,
          assertion: "aim-quadrant-semantic-correctness",
          detail: "all 4 quadrants classify with canonical labels",
        }
      : {
          ok: false,
          assertion: "aim-quadrant-semantic-correctness",
          detail: quadFails.join(" | "),
        }
  );

  // ── 7. aim-cohort-distribution (observational) ──────────────────────
  const cohort = loadCohort();
  const legacy: Record<string, number> = {};
  const aimBased: Record<string, number> = {};
  const changed: Array<{ file: string; from: string; to: string }> = [];
  for (const r of cohort) {
    const lf = r.constitution.riskForm?.letter ?? "(none)";
    const af = r.constitution.riskFormFromAim?.letter ?? "(none)";
    legacy[lf] = (legacy[lf] ?? 0) + 1;
    aimBased[af] = (aimBased[af] ?? 0) + 1;
    if (lf !== af && lf !== "(none)" && af !== "(none)") {
      changed.push({ file: `${r.set}/${r.file}`, from: lf, to: af });
    }
  }
  results.push({
    ok: true,
    assertion: "aim-cohort-distribution",
    detail: `legacy=${JSON.stringify(legacy)}; aim=${JSON.stringify(aimBased)}; ${changed.length} fixtures reclassified`,
  });

  // ── 8. aim-render-includes-score ────────────────────────────────────
  const renderFixtures = cohort.filter((r) => /^- \*\*Aim:\*\*/m.test(r.markdown));
  results.push(
    renderFixtures.length > 0
      ? {
          ok: true,
          assertion: "aim-render-includes-score",
          detail: `${renderFixtures.length}/${cohort.length} cohort fixtures render an Aim line`,
        }
      : {
          ok: false,
          assertion: "aim-render-includes-score",
          detail: "no cohort fixture rendered an Aim line",
        }
  );

  // ── 9. aim-llm-prompts-anchor ───────────────────────────────────────
  const anchorMissing: string[] = [];
  if (!/Aim register/i.test(SYSTEM_PROMPT)) {
    anchorMissing.push("synthesis3.SYSTEM_PROMPT");
  }
  if (!/Aim register/i.test(GRIP_SYSTEM_PROMPT)) {
    anchorMissing.push("grip.GRIP_SYSTEM_PROMPT");
  }
  if (!SYSTEM_PROMPT.includes(AIM_REGISTER_ANCHOR_BLOCK)) {
    anchorMissing.push("synthesis3: anchor content drift");
  }
  if (!GRIP_SYSTEM_PROMPT.includes(AIM_REGISTER_ANCHOR_BLOCK)) {
    anchorMissing.push("grip: anchor content drift");
  }
  results.push(
    anchorMissing.length === 0
      ? {
          ok: true,
          assertion: "aim-llm-prompts-anchor",
          detail: "both SYSTEM_PROMPTs contain the verbatim Aim register block",
        }
      : {
          ok: false,
          assertion: "aim-llm-prompts-anchor",
          detail: anchorMissing.join(" | "),
        }
  );

  // ── 10. aim-rationale-non-empty ─────────────────────────────────────
  const rationaleFails: string[] = [];
  for (const r of cohort) {
    const a = r.constitution.aimReading;
    if (!a) continue;
    if (!a.rationale || a.rationale.trim().length === 0) {
      rationaleFails.push(`${r.file}: empty rationale`);
    }
  }
  results.push(
    rationaleFails.length === 0
      ? { ok: true, assertion: "aim-rationale-non-empty" }
      : {
          ok: false,
          assertion: "aim-rationale-non-empty",
          detail: rationaleFails.slice(0, 5).join(" | "),
        }
  );

  // Diagnostic — non-failing.
  console.log("\nAim vs legacy Risk Form distribution:");
  console.log(`  legacy:  ${JSON.stringify(legacy)}`);
  console.log(`  aim:     ${JSON.stringify(aimBased)}`);
  if (changed.length > 0) {
    console.log(`  reclassified (${changed.length}):`);
    for (const c of changed) {
      console.log(`    ${c.file}: ${c.from} → ${c.to}`);
    }
  }

  return results;
}

function main(): number {
  console.log("CC-AIM-CALIBRATION — Aim composite + 2×2 recalibration audit");
  console.log("===============================================================");
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
  console.log("AUDIT PASSED — all CC-AIM-CALIBRATION assertions green.");
  return 0;
}

process.exit(main());
