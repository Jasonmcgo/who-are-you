// CC-103-CHART-MIDPOINT-RECALIBRATION audit.
//
// 8 assertions per the CC spec. Verifies the trajectory chart's line
// origin shifts from absolute zero SVG (60, 224) to canonical midpoint
// SVG (160, 124), and that the engine math reading is byte-identical
// (render-only change).
//
//   1. chart-trajectory-line-anchored-at-midpoint
//      The potential-trajectory + usable-trajectory <line> elements
//      both have x1="160" y1="124".
//   2. chart-tolerance-cone-apex-at-midpoint
//      Both tolerance-cone-lower and tolerance-cone-upper start at
//      SVG (160, 124).
//   3. chart-jason-line-entirely-in-upper-right
//      Jason fixture's potential-trajectory endpoint is above and
//      right of the midpoint (Goal > 50, Soul > 50 → x > 160, y < 124).
//   4. chart-michele-line-entirely-in-upper-right
//      Synthetic Michele input (Goal 79 / Soul 97 per CC-103) — line
//      endpoint clean upper-right.
//   5. chart-midpoint-marker-rendered
//      SVG contains a circle element with
//      data-element="midpoint-baseline-marker".
//   6. chart-legend-references-baseline
//      Legend text contains "midpoint baseline".
//   7. chart-low-goal-fixture-projects-correctly
//      Synthetic Goal=30 / Soul=70 — endpoint sits upper-left of
//      midpoint (Love without Form quadrant).
//   8. chart-engine-math-unchanged
//      Jason fixture's Goal/Soul/Aim/Grip/Movement scores match the
//      regression anchor captured pre-CC-103. (CC-103 is render-
//      only, so these values must be byte-identical.)
//
// Hand-rolled. Invocation:
//   npx tsx tests/audit/chartMidpointRecalibration.audit.ts

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import {
  generateTrajectoryChartSvg,
  generateTrajectoryChartSvgFromConstitution,
} from "../../lib/trajectoryChart";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

// CC-103 canonical SVG midpoint coordinates (score (50/50) anchor).
const MID_X = 160;
const MID_Y = 124;

// Jason regression anchor (Goal/Soul/Aim/Grip/Movement) — captured
// pre-CC-103. The render-layer change must leave these untouched.
const JASON_ANCHOR = {
  Goal: 92,
  Soul: 59,
  Aim: 64.9 as number | null,
  Grip: 26.3,
  Movement: 77.28195132112025,
};

function loadConstitution(fixturePath: string): InnerConstitution {
  const raw = JSON.parse(readFileSync(fixturePath, "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
}

function findTag(svg: string, dataElement: string): string | null {
  const re = new RegExp(
    `<[a-zA-Z]+[^>]*data-element="${dataElement}"[^>]*\\/?>`,
    ""
  );
  const m = svg.match(re);
  return m ? m[0] : null;
}

function readAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`\\s${attr}="([^"]+)"`);
  const m = tag.match(re);
  return m ? m[1] : null;
}

function readNumAttr(tag: string, attr: string): number | null {
  const v = readAttr(tag, attr);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function syntheticChart(goal: number, soul: number): string {
  // Use sensible defaults so cone + drag marker render for visual
  // inspection of all chart elements, not just the line.
  return generateTrajectoryChartSvg({
    adjustedGoal: goal,
    adjustedSoul: soul,
    potentialMovement: Math.hypot(goal, soul),
    usableMovement: Math.hypot(goal, soul) * 0.75,
    toleranceDegrees: 9,
    gripScore: 25,
    gripDragModifier: 0.85,
    aimGovernorModifier: 0.92,
    primalPrimary: null,
    primalConfidence: null,
    quadrantLabel: "Giving / Presence",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: (Math.atan2(soul, goal) * 180) / Math.PI,
  });
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  const jasonConstitution = loadConstitution(
    join(FIXTURES, "ocean", "07-jason-real-session.json")
  );
  const jasonSvg = generateTrajectoryChartSvgFromConstitution(jasonConstitution);

  // ── 1. chart-trajectory-line-anchored-at-midpoint ───────────────────
  {
    const potentialTag = findTag(jasonSvg, "potential-trajectory");
    const usableTag = findTag(jasonSvg, "usable-trajectory");
    const px1 = potentialTag ? readNumAttr(potentialTag, "x1") : null;
    const py1 = potentialTag ? readNumAttr(potentialTag, "y1") : null;
    const ux1 = usableTag ? readNumAttr(usableTag, "x1") : null;
    const uy1 = usableTag ? readNumAttr(usableTag, "y1") : null;
    const ok =
      px1 === MID_X &&
      py1 === MID_Y &&
      // Usable line may be absent when ratio==1; only check if present.
      (usableTag === null || (ux1 === MID_X && uy1 === MID_Y));
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-trajectory-line-anchored-at-midpoint",
            detail: `potential=(${px1},${py1}) usable=${usableTag ? `(${ux1},${uy1})` : "absent"}`,
          }
        : {
            ok: false,
            assertion: "chart-trajectory-line-anchored-at-midpoint",
            detail: `expected x1=160 y1=124 on both lines; got potential=(${px1},${py1}) usable=${usableTag ? `(${ux1},${uy1})` : "absent"}`,
          }
    );
  }

  // ── 2. chart-tolerance-cone-apex-at-midpoint ────────────────────────
  {
    const lowerTag = findTag(jasonSvg, "tolerance-cone-lower");
    const upperTag = findTag(jasonSvg, "tolerance-cone-upper");
    if (!lowerTag || !upperTag) {
      results.push({
        ok: false,
        assertion: "chart-tolerance-cone-apex-at-midpoint",
        detail: `cone tags missing: lower=${!!lowerTag} upper=${!!upperTag}`,
      });
    } else {
      const lx1 = readNumAttr(lowerTag, "x1");
      const ly1 = readNumAttr(lowerTag, "y1");
      const ux1 = readNumAttr(upperTag, "x1");
      const uy1 = readNumAttr(upperTag, "y1");
      const ok = lx1 === MID_X && ly1 === MID_Y && ux1 === MID_X && uy1 === MID_Y;
      results.push(
        ok
          ? {
              ok: true,
              assertion: "chart-tolerance-cone-apex-at-midpoint",
              detail: `both arms emanate from (${MID_X}, ${MID_Y})`,
            }
          : {
              ok: false,
              assertion: "chart-tolerance-cone-apex-at-midpoint",
              detail: `expected (160, 124) on both arms; got lower=(${lx1},${ly1}) upper=(${ux1},${uy1})`,
            }
      );
    }
  }

  // ── 3. chart-jason-line-entirely-in-upper-right ─────────────────────
  {
    const potentialTag = findTag(jasonSvg, "potential-trajectory");
    const endX = potentialTag ? readNumAttr(potentialTag, "x2") : null;
    const endY = potentialTag ? readNumAttr(potentialTag, "y2") : null;
    const inUpperRight =
      endX !== null && endY !== null && endX > MID_X && endY < MID_Y;
    results.push(
      inUpperRight
        ? {
            ok: true,
            assertion: "chart-jason-line-entirely-in-upper-right",
            detail: `Jason endpoint (${endX}, ${endY}) is upper-right of midpoint (Goal>50, Soul>50)`,
          }
        : {
            ok: false,
            assertion: "chart-jason-line-entirely-in-upper-right",
            detail: `expected endX>160, endY<124; got (${endX}, ${endY})`,
          }
    );
  }

  // ── 4. chart-michele-line-entirely-in-upper-right ───────────────────
  // Michele's fixture has a pre-existing engine compute issue; per
  // CC-103 the assertion is specifically about Michele's known Goal=79,
  // Soul=97. Render via generateTrajectoryChartSvg with those exact
  // values to validate the chart's behavior for the Michele profile.
  {
    const micheleSvg = syntheticChart(79, 97);
    const potentialTag = findTag(micheleSvg, "potential-trajectory");
    const endX = potentialTag ? readNumAttr(potentialTag, "x2") : null;
    const endY = potentialTag ? readNumAttr(potentialTag, "y2") : null;
    const x1 = potentialTag ? readNumAttr(potentialTag, "x1") : null;
    const y1 = potentialTag ? readNumAttr(potentialTag, "y1") : null;
    const ok =
      x1 === MID_X &&
      y1 === MID_Y &&
      endX !== null &&
      endY !== null &&
      endX > MID_X &&
      endY < MID_Y;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-michele-line-entirely-in-upper-right",
            detail: `Michele (Goal=79/Soul=97) line: (${x1},${y1})→(${endX},${endY}) — upper-right of midpoint`,
          }
        : {
            ok: false,
            assertion: "chart-michele-line-entirely-in-upper-right",
            detail: `expected (160,124)→(>160, <124); got (${x1},${y1})→(${endX},${endY})`,
          }
    );
  }

  // ── 5. chart-midpoint-marker-rendered ───────────────────────────────
  {
    const markerTag = findTag(jasonSvg, "midpoint-baseline-marker");
    const cx = markerTag ? readNumAttr(markerTag, "cx") : null;
    const cy = markerTag ? readNumAttr(markerTag, "cy") : null;
    const ok = markerTag !== null && cx === MID_X && cy === MID_Y;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-midpoint-marker-rendered",
            detail: `midpoint dot present at (${cx}, ${cy})`,
          }
        : {
            ok: false,
            assertion: "chart-midpoint-marker-rendered",
            detail: `expected circle data-element="midpoint-baseline-marker" at (160, 124); got tag=${markerTag ? "present" : "missing"} cx=${cx} cy=${cy}`,
          }
    );
  }

  // ── 6. chart-legend-references-baseline ─────────────────────────────
  {
    const legendTag = findTag(jasonSvg, "legend-midpoint");
    const hasBaselinePhrase =
      legendTag !== null && /midpoint baseline/i.test(jasonSvg);
    results.push(
      hasBaselinePhrase
        ? {
            ok: true,
            assertion: "chart-legend-references-baseline",
            detail: `legend contains "midpoint baseline" + legend-midpoint entry`,
          }
        : {
            ok: false,
            assertion: "chart-legend-references-baseline",
            detail: `expected legend to reference "midpoint baseline" and emit a legend-midpoint entry; got legendTag=${legendTag ? "present" : "missing"}`,
          }
    );
  }

  // ── 7. chart-low-goal-fixture-projects-correctly ────────────────────
  // Goal=30 / Soul=70 — endpoint sits upper-left of midpoint
  // (Love without Form quadrant). In SVG: x<160, y<124.
  {
    const lowGoalSvg = syntheticChart(30, 70);
    const potentialTag = findTag(lowGoalSvg, "potential-trajectory");
    const x1 = potentialTag ? readNumAttr(potentialTag, "x1") : null;
    const y1 = potentialTag ? readNumAttr(potentialTag, "y1") : null;
    const endX = potentialTag ? readNumAttr(potentialTag, "x2") : null;
    const endY = potentialTag ? readNumAttr(potentialTag, "y2") : null;
    const ok =
      x1 === MID_X &&
      y1 === MID_Y &&
      endX !== null &&
      endY !== null &&
      endX < MID_X &&
      endY < MID_Y;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-low-goal-fixture-projects-correctly",
            detail: `Goal=30/Soul=70 line: (${x1},${y1})→(${endX},${endY}) — upper-left of midpoint (Love without Form)`,
          }
        : {
            ok: false,
            assertion: "chart-low-goal-fixture-projects-correctly",
            detail: `expected (160,124)→(<160, <124); got (${x1},${y1})→(${endX},${endY})`,
          }
    );
  }

  // ── 8. chart-engine-math-unchanged ──────────────────────────────────
  // Render-only CC. Jason's Goal/Soul/Aim/Grip/Movement scores must
  // be byte-identical to the pre-CC-103 anchor.
  {
    const dash = jasonConstitution.goalSoulMovement?.dashboard;
    const lim = dash?.movementLimiter;
    const observedGoal = dash?.goalScore ?? null;
    const observedSoul = dash?.soulScore ?? null;
    const observedAim = jasonConstitution.aimReading?.score ?? null;
    const observedGrip =
      jasonConstitution.gripReading?.score ?? dash?.grippingPull?.score ?? null;
    const observedMovement = dash?.movementStrength?.length ?? null;
    void lim;
    const mismatches: string[] = [];
    if (observedGoal !== JASON_ANCHOR.Goal)
      mismatches.push(`Goal=${observedGoal} (anchor ${JASON_ANCHOR.Goal})`);
    if (observedSoul !== JASON_ANCHOR.Soul)
      mismatches.push(`Soul=${observedSoul} (anchor ${JASON_ANCHOR.Soul})`);
    if (observedAim !== JASON_ANCHOR.Aim)
      mismatches.push(`Aim=${observedAim} (anchor ${JASON_ANCHOR.Aim})`);
    if (observedGrip !== JASON_ANCHOR.Grip)
      mismatches.push(`Grip=${observedGrip} (anchor ${JASON_ANCHOR.Grip})`);
    if (observedMovement !== JASON_ANCHOR.Movement)
      mismatches.push(
        `Movement=${observedMovement} (anchor ${JASON_ANCHOR.Movement})`
      );
    results.push(
      mismatches.length === 0
        ? {
            ok: true,
            assertion: "chart-engine-math-unchanged",
            detail: `Jason Goal=${observedGoal} Soul=${observedSoul} Aim=${observedAim} Grip=${observedGrip} Movement=${observedMovement} — byte-identical to pre-CC-103 anchor`,
          }
        : {
            ok: false,
            assertion: "chart-engine-math-unchanged",
            detail: `engine math drift: ${mismatches.join("; ")}`,
          }
    );
  }

  return results;
}

const results = runAudit();
const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
for (const r of results) {
  const tag = r.ok ? "[PASS]" : "[FAIL]";
  console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
}
console.log("");
console.log(
  `CC-103-CHART-MIDPOINT-RECALIBRATION: ${passed}/${results.length} assertions passing.`
);
if (failed > 0) process.exit(1);
