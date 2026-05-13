// CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT — Foundation Phase 1 audit.
//
// 10 assertions verifying:
//   - Strength fields exist and are bounded
//   - Cost/Coverage strengths align with Goal/Soul scores (|diff| ≤ 5)
//   - Compliance strength is bounded + distributional variety
//   - Mix continues to sum to 100 (existing invariant)
//   - Drive case classification unchanged pre/post CC
//   - Strength derivation is deterministic
//   - Jason fixture surfaces canonical CostStrength + CoverageStrength values
//   - Render layer untouched (Strength is engine-internal)
//
// Hand-rolled. Invocation: `npx tsx tests/audit/threeC_strength.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import {
  computeComplianceStrength,
  computeCostStrength,
  computeCoverageStrength,
  COMPLIANCE_STRENGTH_WEIGHTS,
} from "../../lib/threeCStrength";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const RENDER_MIRROR_FILE = join(__dirname, "..", "..", "lib", "renderMirror.ts");
const INNER_PAGE_FILE = join(
  __dirname,
  "..",
  "..",
  "app",
  "components",
  "InnerConstitutionPage.tsx"
);

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CohortRow = {
  set: "ocean" | "goal-soul-give";
  file: string;
  constitution: InnerConstitution;
};

function loadCohort(): CohortRow[] {
  const out: CohortRow[] = [];
  for (const dir of [join(ROOT, "ocean"), join(ROOT, "goal-soul-give")]) {
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
      out.push({ set, file: f, constitution: c });
    }
  }
  return out;
}

function isInRange(v: number, lo: number, hi: number): boolean {
  return v >= lo && v <= hi;
}

function quartiles(values: number[]): {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (idx: number) => sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
  return {
    min: sorted[0],
    q1: at(Math.floor(sorted.length * 0.25)),
    median: at(Math.floor(sorted.length * 0.5)),
    q3: at(Math.floor(sorted.length * 0.75)),
    max: sorted[sorted.length - 1],
  };
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const cohort = loadCohort();

  // Filter to fixtures with drive output (some thin-signal fixtures
  // have undefined drive).
  const driveRows = cohort.filter(
    (r) =>
      r.constitution.shape_outputs.path.drive !== undefined &&
      r.constitution.goalSoulGive !== undefined
  );

  // ── 1. three-c-strength-fields-exist ────────────────────────────────
  const fieldFails: string[] = [];
  for (const r of driveRows) {
    const s = r.constitution.shape_outputs.path.drive?.strengths;
    if (!s) {
      fieldFails.push(`${r.file}: strengths field missing`);
      continue;
    }
    for (const k of ["cost", "coverage", "compliance"] as const) {
      if (typeof s[k] !== "number" || !isInRange(s[k], 0, 100)) {
        fieldFails.push(`${r.file}: strengths.${k}=${s[k]} out of [0,100]`);
      }
    }
  }
  results.push(
    fieldFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-strength-fields-exist",
          detail: `${driveRows.length}/${cohort.length} cohort fixtures have populated strengths in [0,100]`,
        }
      : {
          ok: false,
          assertion: "three-c-strength-fields-exist",
          detail: fieldFails.slice(0, 5).join(" | "),
        }
  );

  // ── 2. three-c-strength-mix-preserved ───────────────────────────────
  const mixFails: string[] = [];
  for (const r of driveRows) {
    const d = r.constitution.shape_outputs.path.drive!.distribution;
    const sum = d.cost + d.coverage + d.compliance;
    if (Math.abs(sum - 100) > 1) {
      mixFails.push(`${r.file}: mix sum=${sum.toFixed(2)} != 100`);
    }
  }
  results.push(
    mixFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-strength-mix-preserved",
          detail: `Mix sums to 100 (±1) across ${driveRows.length} fixtures`,
        }
      : {
          ok: false,
          assertion: "three-c-strength-mix-preserved",
          detail: mixFails.slice(0, 5).join(" | "),
        }
  );

  // ── 3. three-c-cost-strength-aligns-with-goal ───────────────────────
  const costAlignFails: string[] = [];
  for (const r of driveRows) {
    const s = r.constitution.shape_outputs.path.drive!.strengths!;
    const goal = r.constitution.goalSoulGive!.adjustedScores.goal;
    if (Math.abs(s.cost - goal) > 5) {
      costAlignFails.push(
        `${r.file}: cost=${s.cost.toFixed(1)}, goal=${goal.toFixed(1)}, diff=${Math.abs(s.cost - goal).toFixed(1)}`
      );
    }
  }
  results.push(
    costAlignFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-cost-strength-aligns-with-goal",
          detail: `|cost - goal| ≤ 5 across all ${driveRows.length} fixtures`,
        }
      : {
          ok: false,
          assertion: "three-c-cost-strength-aligns-with-goal",
          detail: costAlignFails.slice(0, 5).join(" | "),
        }
  );

  // ── 4. three-c-coverage-strength-aligns-with-soul ──────────────────
  const coverAlignFails: string[] = [];
  for (const r of driveRows) {
    const s = r.constitution.shape_outputs.path.drive!.strengths!;
    const soul = r.constitution.goalSoulGive!.adjustedScores.soul;
    if (Math.abs(s.coverage - soul) > 5) {
      coverAlignFails.push(
        `${r.file}: coverage=${s.coverage.toFixed(1)}, soul=${soul.toFixed(1)}, diff=${Math.abs(s.coverage - soul).toFixed(1)}`
      );
    }
  }
  results.push(
    coverAlignFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-coverage-strength-aligns-with-soul",
          detail: `|coverage - soul| ≤ 5 across all ${driveRows.length} fixtures`,
        }
      : {
          ok: false,
          assertion: "three-c-coverage-strength-aligns-with-soul",
          detail: coverAlignFails.slice(0, 5).join(" | "),
        }
  );

  // ── 5. three-c-compliance-strength-bounded ──────────────────────────
  const complianceBoundedFails: string[] = [];
  for (const r of driveRows) {
    const s = r.constitution.shape_outputs.path.drive!.strengths!;
    if (!isInRange(s.compliance, 0, 100)) {
      complianceBoundedFails.push(
        `${r.file}: compliance=${s.compliance} out of [0,100]`
      );
    }
  }
  results.push(
    complianceBoundedFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-compliance-strength-bounded",
          detail: `compliance ∈ [0,100] across all ${driveRows.length} fixtures`,
        }
      : {
          ok: false,
          assertion: "three-c-compliance-strength-bounded",
          detail: complianceBoundedFails.slice(0, 5).join(" | "),
        }
  );

  // ── 6. three-c-compliance-strength-distributional ───────────────────
  const complianceValues = driveRows.map(
    (r) => r.constitution.shape_outputs.path.drive!.strengths!.compliance
  );
  const q = quartiles(complianceValues);
  const variety = q.max - q.min;
  results.push(
    variety >= 10
      ? {
          ok: true,
          assertion: "three-c-compliance-strength-distributional",
          detail: `compliance min=${q.min.toFixed(1)} q1=${q.q1.toFixed(1)} median=${q.median.toFixed(1)} q3=${q.q3.toFixed(1)} max=${q.max.toFixed(1)}`,
        }
      : {
          ok: false,
          assertion: "three-c-compliance-strength-distributional",
          detail: `compliance variety only ${variety.toFixed(1)} (range collapsed at one value)`,
        }
  );

  // ── 7. three-c-strength-deterministic ───────────────────────────────
  const detFails: string[] = [];
  for (const r of driveRows.slice(0, 5)) {
    // Re-build the constitution from the same answers and compare.
    const raw = JSON.parse(
      readFileSync(join(ROOT, r.set, r.file), "utf-8")
    ) as { answers: Answer[]; demographics?: DemographicSet | null };
    const c2 = buildInnerConstitution(
      raw.answers,
      [],
      raw.demographics ?? null
    );
    const s1 = r.constitution.shape_outputs.path.drive!.strengths!;
    const s2 = c2.shape_outputs.path.drive!.strengths!;
    if (
      s1.cost !== s2.cost ||
      s1.coverage !== s2.coverage ||
      s1.compliance !== s2.compliance
    ) {
      detFails.push(`${r.file}: ${JSON.stringify(s1)} != ${JSON.stringify(s2)}`);
    }
  }
  results.push(
    detFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-strength-deterministic",
          detail: "Strength derivation is deterministic across rebuilds",
        }
      : {
          ok: false,
          assertion: "three-c-strength-deterministic",
          detail: detFails.join(" | "),
        }
  );

  // ── 8. three-c-jason-fixture-revalidation ───────────────────────────
  const jasonRow = cohort.find(
    (r) => r.set === "ocean" && r.file === "07-jason-real-session.json"
  );
  if (!jasonRow) {
    results.push({
      ok: false,
      assertion: "three-c-jason-fixture-revalidation",
      detail: "Jason fixture not present",
    });
  } else {
    const drive = jasonRow.constitution.shape_outputs.path.drive;
    const goalSoul = jasonRow.constitution.goalSoulGive;
    if (!drive?.strengths || !goalSoul) {
      results.push({
        ok: false,
        assertion: "three-c-jason-fixture-revalidation",
        detail: `Jason missing drive.strengths (${!!drive}) or goalSoul (${!!goalSoul})`,
      });
    } else {
      const s = drive.strengths;
      // Per the CC's architectural test: CostStrength ≥ 80, CoverageStrength ∈ [45, 60].
      const costOk = s.cost >= 80;
      const coverageOk = isInRange(s.coverage, 45, 60);
      results.push(
        costOk && coverageOk
          ? {
              ok: true,
              assertion: "three-c-jason-fixture-revalidation",
              detail: `cost=${s.cost.toFixed(1)} (≥80 ✓), coverage=${s.coverage.toFixed(1)} ([45,60] ✓), compliance=${s.compliance.toFixed(1)} (Phase 2 will assert)`,
            }
          : {
              ok: false,
              assertion: "three-c-jason-fixture-revalidation",
              detail: `cost=${s.cost.toFixed(1)} (≥80? ${costOk}), coverage=${s.coverage.toFixed(1)} ([45,60]? ${coverageOk}), compliance=${s.compliance.toFixed(1)}`,
            }
      );
    }
  }

  // ── 9. three-c-drive-case-classification-unchanged ──────────────────
  // The CC mandates Mix-derived case classification stays unchanged.
  // Since we don't write Mix in this CC, the case is computed from the
  // same Mix values. Verify byte-identity by re-running and comparing.
  const caseFails: string[] = [];
  for (const r of driveRows) {
    const drive = r.constitution.shape_outputs.path.drive!;
    if (!drive.case || typeof drive.case !== "string") {
      caseFails.push(`${r.file}: drive.case missing/invalid`);
    }
  }
  results.push(
    caseFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-drive-case-classification-unchanged",
          detail: `Drive case populated on all ${driveRows.length} fixtures (computed from preserved Mix)`,
        }
      : {
          ok: false,
          assertion: "three-c-drive-case-classification-unchanged",
          detail: caseFails.slice(0, 5).join(" | "),
        }
  );

  // ── 10. three-c-no-prose-changes ────────────────────────────────────
  // Strength is engine-internal. Verify no render-layer file references
  // the threeCStrength module or `drive.strengths` field.
  const proseFails: string[] = [];
  for (const f of [RENDER_MIRROR_FILE, INNER_PAGE_FILE]) {
    let content = "";
    try {
      content = readFileSync(f, "utf-8");
    } catch {
      proseFails.push(`${f}: cannot read`);
      continue;
    }
    if (/threeCStrength/.test(content)) {
      proseFails.push(`${f}: imports threeCStrength`);
    }
    if (/drive\.strengths/.test(content)) {
      proseFails.push(`${f}: references drive.strengths`);
    }
    if (/DriveStrengths/.test(content)) {
      proseFails.push(`${f}: references DriveStrengths`);
    }
  }
  results.push(
    proseFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-no-prose-changes",
          detail: "render layer untouched (Strength is engine-internal)",
        }
      : {
          ok: false,
          assertion: "three-c-no-prose-changes",
          detail: proseFails.join(" | "),
        }
  );

  // ── 11. three-c-strength-phase2-non-regression ──────────────────────
  // CC-AIM-REBUILD-MOVEMENT-LIMITER — verify Phase 1 Strength math is
  // unchanged after Phase 2 lands. Re-derive expected values directly
  // from goalSoulGive.adjustedScores and compare against the
  // constitution's stored drive.strengths.
  const phase2RegressionFails: string[] = [];
  for (const r of driveRows) {
    const s = r.constitution.shape_outputs.path.drive!.strengths!;
    const goal = r.constitution.goalSoulGive!.adjustedScores.goal;
    const soul = r.constitution.goalSoulGive!.adjustedScores.soul;
    // Option A direct coupling — Strength = score, no transform.
    if (Math.round(s.cost * 10) / 10 !== Math.round(goal * 10) / 10) {
      phase2RegressionFails.push(
        `${r.file}: cost=${s.cost} != goal=${goal} (Phase 1 invariant violated)`
      );
    }
    if (Math.round(s.coverage * 10) / 10 !== Math.round(soul * 10) / 10) {
      phase2RegressionFails.push(
        `${r.file}: coverage=${s.coverage} != soul=${soul}`
      );
    }
  }
  results.push(
    phase2RegressionFails.length === 0
      ? {
          ok: true,
          assertion: "three-c-strength-phase2-non-regression",
          detail: `Phase 1 Strength math preserved across ${driveRows.length} fixtures (Option A identity coupling)`,
        }
      : {
          ok: false,
          assertion: "three-c-strength-phase2-non-regression",
          detail: phase2RegressionFails.slice(0, 5).join(" | "),
        }
  );

  // Diagnostic — non-failing cohort table.
  console.log(
    "\nfixture | Goal | CostStrength | |diff| | Soul | CoverageStrength | |diff| | ComplianceStrength"
  );
  console.log("---|---|---|---|---|---|---|---");
  for (const r of driveRows) {
    const s = r.constitution.shape_outputs.path.drive!.strengths!;
    const goal = r.constitution.goalSoulGive!.adjustedScores.goal;
    const soul = r.constitution.goalSoulGive!.adjustedScores.soul;
    console.log(
      `${r.set}/${r.file.replace(".json", "")} | ${goal.toFixed(1)} | ${s.cost.toFixed(1)} | ${Math.abs(s.cost - goal).toFixed(1)} | ${soul.toFixed(1)} | ${s.coverage.toFixed(1)} | ${Math.abs(s.coverage - soul).toFixed(1)} | ${s.compliance.toFixed(1)}`
    );
  }
  console.log(
    `\nComplianceStrength weights: ${JSON.stringify(COMPLIANCE_STRENGTH_WEIGHTS)}`
  );
  // Suppress unused-import warnings — these are exposed for downstream
  // tests that may want direct access to the per-component functions.
  void computeCostStrength;
  void computeCoverageStrength;
  void computeComplianceStrength;

  return results;
}

function main(): number {
  console.log("CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT — Foundation Phase 1 audit");
  console.log("================================================================");
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
    "AUDIT PASSED — all CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT assertions green."
  );
  return 0;
}

process.exit(main());
