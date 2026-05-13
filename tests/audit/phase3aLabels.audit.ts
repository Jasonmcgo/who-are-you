// CC-PHASE-3A-LABEL-LOGIC — engine label refinement audit.
//
// 10 assertions covering:
//   - Quadrant label union completeness (7 labels)
//   - Band-gated Giving / Presence (synthetic angles 35, 50, 65)
//   - Jason fixture quadrant classification
//   - Quadrant legacy-label collapse
//   - Risk Form letter union completeness (4 labels)
//   - Risk Form synthetic label-rename cases (4 quadrants)
//   - Jason fixture Risk Form classification
//   - Risk Form legacy-letter mapping
//   - Cohort distribution table (observational)
//   - Threshold calibration recommendation (informational)
//
// Hand-rolled. Invocation: `npx tsx tests/audit/phase3aLabels.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import {
  computeMovementQuadrant,
  LEGACY_QUADRANT_LABEL,
  type MovementQuadrantLabel,
} from "../../lib/movementQuadrant";
import {
  computeRiskFormFromAim,
  LEGACY_RISK_FORM_LABEL,
  RISK_FORM_HIGH_AIM,
  RISK_FORM_HIGH_GRIP,
  type RiskFormLetter,
} from "../../lib/riskForm";
import { generateTrajectoryChartSvgFromConstitution } from "../../lib/trajectoryChart";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

const ALL_QUADRANT_LABELS: MovementQuadrantLabel[] = [
  "Drift",
  "Gripping",
  "Work without Presence",
  "Love without Form",
  "Giving / Presence",
  "Goal-led Presence",
  "Soul-led Presence",
];

const ALL_RISK_FORM_LETTERS: RiskFormLetter[] = [
  "Open-Handed Aim",
  "White-Knuckled Aim",
  "Grip-Governed",
  "Ungoverned Movement",
];

type CohortRow = {
  set: string;
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

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const cohort = loadCohort();

  // ── 1. quadrant-label-union-completeness ────────────────────────────
  // Verify all 7 expected labels are reachable via computeMovementQuadrant
  // by exercising synthetic inputs.
  const seenLabels = new Set<MovementQuadrantLabel>();
  const probes: Array<{ g: number; s: number; angle: number; grip: boolean }> = [
    { g: 80, s: 80, angle: 50, grip: false }, // Giving / Presence
    { g: 80, s: 80, angle: 35, grip: false }, // Goal-led Presence
    { g: 80, s: 80, angle: 65, grip: false }, // Soul-led Presence
    { g: 80, s: 20, angle: 20, grip: false }, // Work without Presence
    { g: 20, s: 80, angle: 70, grip: false }, // Love without Form
    { g: 20, s: 20, angle: 40, grip: false }, // Drift
    { g: 20, s: 20, angle: 40, grip: true }, // Gripping
  ];
  for (const p of probes) {
    const r = computeMovementQuadrant({
      adjustedGoal: p.g,
      adjustedSoul: p.s,
      angleDegrees: p.angle,
      gripClusterFires: p.grip,
    });
    seenLabels.add(r.label);
  }
  const missingLabels = ALL_QUADRANT_LABELS.filter((l) => !seenLabels.has(l));
  results.push(
    missingLabels.length === 0
      ? {
          ok: true,
          assertion: "quadrant-label-union-completeness",
          detail: `all 7 quadrant labels reachable via synthetic probes`,
        }
      : {
          ok: false,
          assertion: "quadrant-label-union-completeness",
          detail: `missing labels: ${missingLabels.join(", ")}`,
        }
  );

  // ── 2. quadrant-giving-presence-band-gated ──────────────────────────
  const band50 = computeMovementQuadrant({
    adjustedGoal: 80,
    adjustedSoul: 80,
    angleDegrees: 50,
    gripClusterFires: false,
  });
  const band35 = computeMovementQuadrant({
    adjustedGoal: 80,
    adjustedSoul: 80,
    angleDegrees: 35,
    gripClusterFires: false,
  });
  const band65 = computeMovementQuadrant({
    adjustedGoal: 80,
    adjustedSoul: 80,
    angleDegrees: 65,
    gripClusterFires: false,
  });
  const bandFails: string[] = [];
  if (band50.label !== "Giving / Presence")
    bandFails.push(`angle=50 → ${band50.label}`);
  if (band35.label !== "Goal-led Presence")
    bandFails.push(`angle=35 → ${band35.label}`);
  if (band65.label !== "Soul-led Presence")
    bandFails.push(`angle=65 → ${band65.label}`);
  results.push(
    bandFails.length === 0
      ? {
          ok: true,
          assertion: "quadrant-giving-presence-band-gated",
          detail: "high-both axes split by angle band correctly",
        }
      : {
          ok: false,
          assertion: "quadrant-giving-presence-band-gated",
          detail: bandFails.join(" | "),
        }
  );

  // ── 3. quadrant-jason-fixture-classification ────────────────────────
  const jasonRow = cohort.find(
    (r) => r.set === "ocean" && r.file === "07-jason-real-session.json"
  );
  if (!jasonRow) {
    results.push({
      ok: false,
      assertion: "quadrant-jason-fixture-classification",
      detail: "Jason fixture not present",
    });
  } else {
    const q = jasonRow.constitution.movementQuadrant;
    const allowed = new Set<MovementQuadrantLabel>([
      "Goal-led Presence",
      "Work without Presence",
    ]);
    if (!q) {
      results.push({
        ok: false,
        assertion: "quadrant-jason-fixture-classification",
        detail: "Jason has no movementQuadrant reading",
      });
    } else {
      results.push(
        allowed.has(q.label)
          ? {
              ok: true,
              assertion: "quadrant-jason-fixture-classification",
              detail: `Jason quadrant=${q.label} (legacy=${q.legacyLabel}, goal=${q.goal.toFixed(0)}, soul=${q.soul.toFixed(0)}, angle=${q.angle.toFixed(1)}°)`,
            }
          : {
              ok: false,
              assertion: "quadrant-jason-fixture-classification",
              detail: `Jason quadrant=${q.label} (expected Goal-led Presence or Work without Presence)`,
            }
      );
    }
  }

  // ── 4. quadrant-legacy-label-collapse ───────────────────────────────
  const legacyCollapseFails: string[] = [];
  for (const probe of probes) {
    const r = computeMovementQuadrant({
      adjustedGoal: probe.g,
      adjustedSoul: probe.s,
      angleDegrees: probe.angle,
      gripClusterFires: probe.grip,
    });
    // Goal-led / Soul-led Presence collapse to Giving / Presence.
    // Gripping collapses to Drift (pre-Phase-3a there was no Gripping
    // label; the low-both case was Drift). Other labels pass through.
    let expectedLegacy: string;
    if (r.label === "Goal-led Presence" || r.label === "Soul-led Presence") {
      expectedLegacy = "Giving / Presence";
    } else if (r.label === "Gripping") {
      expectedLegacy = "Drift";
    } else {
      expectedLegacy = r.label;
    }
    if (r.legacyLabel !== expectedLegacy) {
      legacyCollapseFails.push(
        `${r.label}: legacyLabel=${r.legacyLabel} expected ${expectedLegacy}`
      );
    }
  }
  results.push(
    legacyCollapseFails.length === 0
      ? {
          ok: true,
          assertion: "quadrant-legacy-label-collapse",
          detail: "Goal-led/Soul-led Presence collapse to Giving / Presence; other labels pass through",
        }
      : {
          ok: false,
          assertion: "quadrant-legacy-label-collapse",
          detail: legacyCollapseFails.join(" | "),
        }
  );

  // Suppress unused-import warning.
  void LEGACY_QUADRANT_LABEL;

  // ── 5. risk-form-letter-union-completeness ──────────────────────────
  const riskProbes: Array<{ aim: number; grip: number; expected: RiskFormLetter }> = [
    { aim: 75, grip: 25, expected: "Open-Handed Aim" },
    { aim: 75, grip: 60, expected: "White-Knuckled Aim" },
    { aim: 35, grip: 60, expected: "Grip-Governed" },
    { aim: 35, grip: 25, expected: "Ungoverned Movement" },
  ];
  const seenLetters = new Set<RiskFormLetter>();
  for (const p of riskProbes) {
    const r = computeRiskFormFromAim(p.aim, p.grip);
    seenLetters.add(r.letter);
  }
  const missingLetters = ALL_RISK_FORM_LETTERS.filter(
    (l) => !seenLetters.has(l)
  );
  results.push(
    missingLetters.length === 0
      ? {
          ok: true,
          assertion: "risk-form-letter-union-completeness",
          detail: "all 4 Risk Form letters reachable via synthetic probes",
        }
      : {
          ok: false,
          assertion: "risk-form-letter-union-completeness",
          detail: `missing letters: ${missingLetters.join(", ")}`,
        }
  );

  // ── 6. risk-form-label-renames ──────────────────────────────────────
  const renameFails: string[] = [];
  for (const p of riskProbes) {
    const r = computeRiskFormFromAim(p.aim, p.grip);
    if (r.letter !== p.expected) {
      renameFails.push(
        `aim=${p.aim} grip=${p.grip} → ${r.letter} (expected ${p.expected})`
      );
    }
  }
  results.push(
    renameFails.length === 0
      ? {
          ok: true,
          assertion: "risk-form-label-renames",
          detail: "all 4 synthetic quadrants land on canonical refined labels",
        }
      : {
          ok: false,
          assertion: "risk-form-label-renames",
          detail: renameFails.join(" | "),
        }
  );

  // ── 7. risk-form-jason-fixture-classification ───────────────────────
  // Jason: Aim ~56, Grip ~21 — both below thresholds → Ungoverned Movement.
  if (!jasonRow) {
    results.push({
      ok: false,
      assertion: "risk-form-jason-fixture-classification",
      detail: "Jason fixture not present",
    });
  } else {
    const rf = jasonRow.constitution.riskFormFromAim;
    if (!rf) {
      results.push({
        ok: false,
        assertion: "risk-form-jason-fixture-classification",
        detail: "Jason has no riskFormFromAim reading",
      });
    } else {
      results.push(
        rf.letter === "Ungoverned Movement"
          ? {
              ok: true,
              assertion: "risk-form-jason-fixture-classification",
              detail: `Jason riskFormFromAim=${rf.letter} (aim=${rf.aimScore.toFixed(1)}, grip=${rf.gripScore.toFixed(1)}, legacy=${rf.legacyLetter})`,
            }
          : {
              ok: false,
              assertion: "risk-form-jason-fixture-classification",
              detail: `Jason riskFormFromAim=${rf.letter} expected Ungoverned Movement (aim=${rf.aimScore.toFixed(1)} (<${RISK_FORM_HIGH_AIM}), grip=${rf.gripScore.toFixed(1)} (<${RISK_FORM_HIGH_GRIP}))`,
            }
      );
    }
  }

  // ── 8. risk-form-legacy-letter-mapping ──────────────────────────────
  const expectedLegacy: Record<RiskFormLetter, string> = {
    "Open-Handed Aim": "Wisdom-governed",
    "White-Knuckled Aim": "Reckless-fearful",
    "Grip-Governed": "Grip-governed",
    "Ungoverned Movement": "Free movement",
  };
  const legacyMapFails: string[] = [];
  for (const letter of ALL_RISK_FORM_LETTERS) {
    if (LEGACY_RISK_FORM_LABEL[letter] !== expectedLegacy[letter]) {
      legacyMapFails.push(
        `${letter}: legacy=${LEGACY_RISK_FORM_LABEL[letter]} expected ${expectedLegacy[letter]}`
      );
    }
  }
  // Also verify every constitution's riskFormFromAim has legacyLetter set.
  for (const r of cohort) {
    const rf = r.constitution.riskFormFromAim;
    if (rf && rf.legacyLetter !== expectedLegacy[rf.letter]) {
      legacyMapFails.push(
        `${r.file}: legacyLetter=${rf.legacyLetter} expected ${expectedLegacy[rf.letter]} for letter=${rf.letter}`
      );
    }
  }
  results.push(
    legacyMapFails.length === 0
      ? {
          ok: true,
          assertion: "risk-form-legacy-letter-mapping",
          detail: "all 4 letters carry correct legacy alias",
        }
      : {
          ok: false,
          assertion: "risk-form-legacy-letter-mapping",
          detail: legacyMapFails.slice(0, 5).join(" | "),
        }
  );

  // ── 9. phase-3a-cohort-distribution (observational) ─────────────────
  const cohortRows: Array<{
    file: string;
    quadrant: string;
    legacyQuadrant: string;
    riskFormAim: string;
    legacyRiskForm: string;
    aim: number | null;
    grip: number | null;
  }> = [];
  const quadCounts: Record<string, number> = {};
  const riskCounts: Record<string, number> = {};
  for (const r of cohort) {
    const q = r.constitution.movementQuadrant;
    const rf = r.constitution.riskFormFromAim;
    const aim = r.constitution.aimReading?.score ?? null;
    const grip =
      r.constitution.goalSoulMovement?.dashboard.grippingPull.score ?? null;
    cohortRows.push({
      file: `${r.set}/${r.file}`,
      quadrant: q?.label ?? "(none)",
      legacyQuadrant: q?.legacyLabel ?? "(none)",
      riskFormAim: rf?.letter ?? "(none)",
      legacyRiskForm: rf?.legacyLetter ?? "(none)",
      aim,
      grip,
    });
    if (q) quadCounts[q.label] = (quadCounts[q.label] ?? 0) + 1;
    if (rf) riskCounts[rf.letter] = (riskCounts[rf.letter] ?? 0) + 1;
  }
  results.push({
    ok: true,
    assertion: "phase-3a-cohort-distribution",
    detail: `quadrant=${JSON.stringify(quadCounts)}; risk=${JSON.stringify(riskCounts)}`,
  });

  // ── 9.5. trajectory-chart-quadrant-labels-match-phase-3a-union ──────
  // Every quadrant label rendered into the chart for a cohort fixture
  // must belong to the Phase 3a label union. Confirms the render layer
  // never emits a label outside the canonical Phase 3a set (the Drift
  // legacy label is the only non-Phase-3a outcome and it IS in the union).
  const chartLabelUnion = new Set<string>(ALL_QUADRANT_LABELS);
  const chartLabelFails: string[] = [];
  for (const r of cohort) {
    const pathClass = r.constitution.coherenceReading?.pathClass ?? "trajectory";
    if (pathClass === "crisis") continue; // crisis suppresses quadrant labels
    const dash = r.constitution.goalSoulMovement?.dashboard;
    if (!dash || (dash.goalScore === 0 && dash.soulScore === 0)) continue;
    const svg = generateTrajectoryChartSvgFromConstitution(r.constitution);
    // Active label is rendered with font-weight="600" — grab those texts.
    const activeMatches = Array.from(
      svg.matchAll(/<text[^>]*font-weight="600"[^>]*>([^<]+)<\/text>/g)
    );
    for (const m of activeMatches) {
      const label = m[1];
      if (!chartLabelUnion.has(label)) {
        chartLabelFails.push(`${r.file}: active label '${label}' not in Phase 3a union`);
      }
    }
  }
  results.push(
    chartLabelFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-chart-quadrant-labels-match-phase-3a-union",
          detail: "chart active labels all belong to the Phase 3a label set",
        }
      : {
          ok: false,
          assertion: "trajectory-chart-quadrant-labels-match-phase-3a-union",
          detail: chartLabelFails.slice(0, 5).join(" | "),
        }
  );

  // ── 10. phase-3a-threshold-recommendation (informational) ───────────
  // Count cohort fixtures with new Aim ≥ 60 (would land Open-Handed Aim
  // if Grip is low). If the count is very high (e.g., >50% of cohort),
  // the threshold may be too lenient. If very low, may be too strict.
  let aimHigh = 0;
  let aimMid = 0;
  let aimLow = 0;
  for (const r of cohort) {
    const a = r.constitution.aimReading?.score;
    if (a === undefined) continue;
    if (a >= 60) aimHigh++;
    else if (a >= 40) aimMid++;
    else aimLow++;
  }
  results.push({
    ok: true,
    assertion: "phase-3a-threshold-recommendation",
    detail: `cohort Aim distribution (new formula): ≥60=${aimHigh}, 40-60=${aimMid}, <40=${aimLow}. Threshold review: ${
      aimHigh > cohort.length * 0.5
        ? "TOO LENIENT — over 50% land Open-Handed Aim"
        : aimHigh < 2
        ? "TOO STRICT — fewer than 2 fixtures cross threshold"
        : "appears calibrated; Hold at 60 for V1"
    }`,
  });

  // Diagnostic table.
  console.log(
    "\nCohort label table (new quadrant / legacy quadrant / new Risk / legacy Risk / Aim / Grip):"
  );
  console.log(
    "fixture | quadrant | legacy | risk | legacy | Aim | Grip"
  );
  console.log("---|---|---|---|---|---|---");
  for (const row of cohortRows) {
    console.log(
      `${row.file} | ${row.quadrant} | ${row.legacyQuadrant} | ${row.riskFormAim} | ${row.legacyRiskForm} | ${row.aim?.toFixed(1) ?? "—"} | ${row.grip?.toFixed(1) ?? "—"}`
    );
  }

  return results;
}

function main(): number {
  console.log("CC-PHASE-3A-LABEL-LOGIC — engine label refinement audit");
  console.log("==========================================================");
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
    "AUDIT PASSED — all CC-PHASE-3A-LABEL-LOGIC assertions green."
  );
  return 0;
}

process.exit(main());
