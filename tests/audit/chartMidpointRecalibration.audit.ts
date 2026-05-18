// CC-105-CHART-GEOMETRY-AND-SOUL-SYMMETRY chart audit (was CC-103
// midpoint-recalibration; renamed in spirit, file path retained for
// npm-script stability).
//
// 8 assertions per the CC-105 spec. Verifies the trajectory chart's
// line origin is restored to score (0, 0) (SVG 60, 224), and that
// engine math reads (Goal/Soul/Aim/Grip/Movement) for Jason are
// unchanged.
//
//   1. chart-trajectory-line-anchored-at-origin
//      The potential-trajectory + usable-trajectory <line> elements
//      both start at SVG (60, 224).
//   2. chart-tolerance-cone-apex-at-origin
//      Both tolerance-cone-lower and tolerance-cone-upper start at
//      SVG (60, 224).
//   3. chart-jason-endpoint-in-upper-right-plot
//      Jason fixture's potential-trajectory endpoint is to the upper-
//      right of the origin (Goal > 0, Soul > 0 → x > 60, y < 224).
//   4. chart-michele-endpoint-in-upper-right-plot
//      Synthetic Goal=79 / Soul=97 — endpoint clean upper-right of
//      origin.
//   5. chart-grip-zone-triangle-rendered
//      SVG contains a polygon element with data-element="grip-zone-triangle"
//      at score vertices (0,0), (50,0), (0,50). Old arc + midpoint
//      gridlines are absent.
//   6. chart-legend-references-grip-zone
//      Legend text contains "Shaded triangle: Grip Zone" and NO
//      "Grip threshold" / "midpoint baseline" phrasing.
//   7. chart-low-goal-fixture-projects-correctly
//      Synthetic Goal=30 / Soul=70 — endpoint sits in the upper-left
//      half of the plot (x < midpoint at 160; y < midpoint at 124).
//   8. chart-engine-math-unchanged
//      Jason fixture's Goal/Soul/Aim/Grip/Movement scores match the
//      regression anchor. Phase 2 Soul trim doesn't affect Jason
//      (his Soul wasn't saturated pre-CC-105).
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

// CC-105 canonical SVG origin coordinates (score (0,0) anchor).
const ORIGIN_X = 60;
const ORIGIN_Y = 224;
// CC-105 — midpoint retained for plot-half projection assertions only
// (orientation, not anchor).
const MID_X = 160;
const MID_Y = 124;
// CC-105B — Grip Zone triangle, score vertices (0,0), (50,0), (0,50).
const GRIP_TRIANGLE_POINTS = `${ORIGIN_X},${ORIGIN_Y} ${MID_X},${ORIGIN_Y} ${ORIGIN_X},${MID_Y}`;

// Jason regression anchor (Goal/Soul/Aim/Grip/Movement). Phase 2
// Soul trim doesn't affect Jason (Soul=59 wasn't saturated).
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

  // ── 1. chart-trajectory-line-anchored-at-origin ─────────────────
  {
    const potentialTag = findTag(jasonSvg, "potential-trajectory");
    const usableTag = findTag(jasonSvg, "usable-trajectory");
    const px1 = potentialTag ? readNumAttr(potentialTag, "x1") : null;
    const py1 = potentialTag ? readNumAttr(potentialTag, "y1") : null;
    const ux1 = usableTag ? readNumAttr(usableTag, "x1") : null;
    const uy1 = usableTag ? readNumAttr(usableTag, "y1") : null;
    const ok =
      px1 === ORIGIN_X &&
      py1 === ORIGIN_Y &&
      (usableTag === null || (ux1 === ORIGIN_X && uy1 === ORIGIN_Y));
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-trajectory-line-anchored-at-origin",
            detail: `potential=(${px1},${py1}) usable=${usableTag ? `(${ux1},${uy1})` : "absent"}`,
          }
        : {
            ok: false,
            assertion: "chart-trajectory-line-anchored-at-origin",
            detail: `expected x1=${ORIGIN_X} y1=${ORIGIN_Y} on both lines; got potential=(${px1},${py1}) usable=${usableTag ? `(${ux1},${uy1})` : "absent"}`,
          }
    );
  }

  // ── 2. chart-tolerance-cone-apex-at-origin ──────────────────────
  {
    const lowerTag = findTag(jasonSvg, "tolerance-cone-lower");
    const upperTag = findTag(jasonSvg, "tolerance-cone-upper");
    if (!lowerTag || !upperTag) {
      results.push({
        ok: false,
        assertion: "chart-tolerance-cone-apex-at-origin",
        detail: `cone tags missing: lower=${!!lowerTag} upper=${!!upperTag}`,
      });
    } else {
      const lx1 = readNumAttr(lowerTag, "x1");
      const ly1 = readNumAttr(lowerTag, "y1");
      const ux1 = readNumAttr(upperTag, "x1");
      const uy1 = readNumAttr(upperTag, "y1");
      const ok =
        lx1 === ORIGIN_X &&
        ly1 === ORIGIN_Y &&
        ux1 === ORIGIN_X &&
        uy1 === ORIGIN_Y;
      results.push(
        ok
          ? {
              ok: true,
              assertion: "chart-tolerance-cone-apex-at-origin",
              detail: `both arms emanate from (${ORIGIN_X}, ${ORIGIN_Y})`,
            }
          : {
              ok: false,
              assertion: "chart-tolerance-cone-apex-at-origin",
              detail: `expected (${ORIGIN_X}, ${ORIGIN_Y}) on both arms; got lower=(${lx1},${ly1}) upper=(${ux1},${uy1})`,
            }
      );
    }
  }

  // ── 3. chart-jason-endpoint-in-upper-right-plot ─────────────────
  {
    const potentialTag = findTag(jasonSvg, "potential-trajectory");
    const endX = potentialTag ? readNumAttr(potentialTag, "x2") : null;
    const endY = potentialTag ? readNumAttr(potentialTag, "y2") : null;
    // Jason Goal=92 Soul=59 → endpoint at score (92, 59) → SVG
    // (60+184, 224-118) = (244, 106). Far upper-right of origin.
    const inUpperRight =
      endX !== null && endY !== null && endX > ORIGIN_X && endY < ORIGIN_Y;
    results.push(
      inUpperRight
        ? {
            ok: true,
            assertion: "chart-jason-endpoint-in-upper-right-plot",
            detail: `Jason endpoint (${endX}, ${endY}) — upper-right of origin (Goal=${JASON_ANCHOR.Goal}, Soul=${JASON_ANCHOR.Soul})`,
          }
        : {
            ok: false,
            assertion: "chart-jason-endpoint-in-upper-right-plot",
            detail: `expected endX>${ORIGIN_X}, endY<${ORIGIN_Y}; got (${endX}, ${endY})`,
          }
    );
  }

  // ── 4. chart-michele-endpoint-in-upper-right-plot ───────────────
  {
    const micheleSvg = syntheticChart(79, 97);
    const potentialTag = findTag(micheleSvg, "potential-trajectory");
    const endX = potentialTag ? readNumAttr(potentialTag, "x2") : null;
    const endY = potentialTag ? readNumAttr(potentialTag, "y2") : null;
    const x1 = potentialTag ? readNumAttr(potentialTag, "x1") : null;
    const y1 = potentialTag ? readNumAttr(potentialTag, "y1") : null;
    const ok =
      x1 === ORIGIN_X &&
      y1 === ORIGIN_Y &&
      endX !== null &&
      endY !== null &&
      endX > ORIGIN_X &&
      endY < ORIGIN_Y;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-michele-endpoint-in-upper-right-plot",
            detail: `Michele synthetic (Goal=79/Soul=97) line: (${x1},${y1})→(${endX},${endY}) — upper-right of origin`,
          }
        : {
            ok: false,
            assertion: "chart-michele-endpoint-in-upper-right-plot",
            detail: `expected (${ORIGIN_X},${ORIGIN_Y})→(>${ORIGIN_X}, <${ORIGIN_Y}); got (${x1},${y1})→(${endX},${endY})`,
          }
    );
  }

  // ── 5. chart-grip-zone-triangle-rendered ────────────────────────
  // Shaded triangle inscribing the SW score box: (0,0), (50,0), (0,50).
  // Also verifies the old dashed arc and midpoint gridlines are gone.
  {
    const triangleTag = findTag(jasonSvg, "grip-zone-triangle");
    const oldArcTag = findTag(jasonSvg, "grip-threshold-arc");
    const oldMidpointMarker = findTag(jasonSvg, "midpoint-baseline-marker");
    const oldMidpointVertical = findTag(jasonSvg, "midpoint-gridline-vertical");
    const oldMidpointHorizontal = findTag(jasonSvg, "midpoint-gridline-horizontal");
    const points = triangleTag ? readAttr(triangleTag, "points") : null;
    const ok =
      triangleTag !== null &&
      points === GRIP_TRIANGLE_POINTS &&
      oldArcTag === null &&
      oldMidpointMarker === null &&
      oldMidpointVertical === null &&
      oldMidpointHorizontal === null;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-grip-zone-triangle-rendered",
            detail: `triangle points=${points}; old arc + midpoint gridlines correctly absent`,
          }
        : {
            ok: false,
            assertion: "chart-grip-zone-triangle-rendered",
            detail: `expected points="${GRIP_TRIANGLE_POINTS}"; got triangle=${triangleTag ? "present" : "missing"} points="${points ?? "n/a"}" oldArc=${oldArcTag ? "STILL PRESENT" : "absent"} midpointMarker=${oldMidpointMarker ? "STILL PRESENT" : "absent"} midpointV=${oldMidpointVertical ? "STILL PRESENT" : "absent"} midpointH=${oldMidpointHorizontal ? "STILL PRESENT" : "absent"}`,
          }
    );
  }

  // ── 6. chart-legend-references-grip-zone ────────────────────────
  {
    const legendTag = findTag(jasonSvg, "legend-grip-zone");
    const hasGripZonePhrase = /Shaded triangle: Grip Zone/i.test(jasonSvg);
    const hasGripThresholdPhrase = /Grip threshold/i.test(jasonSvg);
    const hasMidpointBaselinePhrase = /midpoint baseline/i.test(jasonSvg);
    const ok =
      legendTag !== null &&
      hasGripZonePhrase &&
      !hasGripThresholdPhrase &&
      !hasMidpointBaselinePhrase;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-legend-references-grip-zone",
            detail: `legend contains "Shaded triangle: Grip Zone"; old threshold/midpoint phrasing removed`,
          }
        : {
            ok: false,
            assertion: "chart-legend-references-grip-zone",
            detail: `expected legend-grip-zone + "Shaded triangle: Grip Zone" present + old phrasing absent; got legend=${legendTag ? "present" : "missing"} grip-zone=${hasGripZonePhrase} grip-threshold=${hasGripThresholdPhrase ? "STILL PRESENT" : "absent"} midpoint-baseline=${hasMidpointBaselinePhrase ? "STILL PRESENT" : "absent"}`,
          }
    );
  }

  // ── 7. chart-low-goal-fixture-projects-correctly ────────────────
  // Goal=30 / Soul=70 — endpoint in upper-left half of plot
  // (Love without Form quadrant). In SVG: x < midpoint-x=160; y <
  // midpoint-y=124.
  {
    const lowGoalSvg = syntheticChart(30, 70);
    const potentialTag = findTag(lowGoalSvg, "potential-trajectory");
    const x1 = potentialTag ? readNumAttr(potentialTag, "x1") : null;
    const y1 = potentialTag ? readNumAttr(potentialTag, "y1") : null;
    const endX = potentialTag ? readNumAttr(potentialTag, "x2") : null;
    const endY = potentialTag ? readNumAttr(potentialTag, "y2") : null;
    const ok =
      x1 === ORIGIN_X &&
      y1 === ORIGIN_Y &&
      endX !== null &&
      endY !== null &&
      endX < MID_X &&
      endY < MID_Y;
    results.push(
      ok
        ? {
            ok: true,
            assertion: "chart-low-goal-fixture-projects-correctly",
            detail: `Goal=30/Soul=70 line: (${x1},${y1})→(${endX},${endY}) — upper-left half (Love without Form quadrant; x<${MID_X}, y<${MID_Y})`,
          }
        : {
            ok: false,
            assertion: "chart-low-goal-fixture-projects-correctly",
            detail: `expected (${ORIGIN_X},${ORIGIN_Y})→(<${MID_X}, <${MID_Y}); got (${x1},${y1})→(${endX},${endY})`,
          }
    );
  }

  // ── 8. chart-engine-math-unchanged ──────────────────────────────
  {
    const dash = jasonConstitution.goalSoulMovement?.dashboard;
    const observedGoal = dash?.goalScore ?? null;
    const observedSoul = dash?.soulScore ?? null;
    const observedAim = jasonConstitution.aimReading?.score ?? null;
    const observedGrip =
      jasonConstitution.gripReading?.score ?? dash?.grippingPull?.score ?? null;
    const observedMovement = dash?.movementStrength?.length ?? null;
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
            detail: `Jason Goal=${observedGoal} Soul=${observedSoul} Aim=${observedAim} Grip=${observedGrip} Movement=${observedMovement} — byte-identical to anchor`,
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
  `CC-105-CHART-GEOMETRY: ${passed}/${results.length} assertions passing.`
);
if (failed > 0) process.exit(1);
