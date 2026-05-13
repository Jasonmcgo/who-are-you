// CC-TRAJECTORY-VISUALIZATION — four-element trajectory chart audit.
//
// 12 assertions covering:
//   1. SVG well-formedness (parseable, single <svg> root, balanced tags)
//   2. Four canonical elements present (potential, usable, cone, drag)
//   3. Jason fixture renders (no throw, all elements present)
//   4. Jason: usable line shorter than potential
//   5. Jason: tolerance cone bounds (lower ≈ 17°, upper ≈ 47°, ±2°)
//   6. Active quadrant label rendered with prominence (size 12, weight 600)
//   7. "Gripping" label not rendered for non-Gripping users
//   8. Crisis-path SVG carries reduced opacity wrapper
//   9. Zero-movement edge case (origin dot + hedge text)
//  10. Primal annotation rendered for high-confidence Primal
//  11. Primal annotation suppressed for low-confidence Primal
//  12. No prose-layer change (no LLM prompt files touched)
//
// Hand-rolled. Invocation: `npx tsx tests/audit/trajectoryChart.audit.ts`.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { computeToleranceDegrees } from "../../lib/movementLimiter";
import {
  generateTrajectoryChartSvg,
  generateTrajectoryChartSvgFromConstitution,
  type TrajectoryChartInputs,
} from "../../lib/trajectoryChart";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const TRAJECTORY_FILE = join(
  __dirname,
  "..",
  "..",
  "lib",
  "trajectoryChart.ts"
);
const PROMPT_DIRS = [
  join(__dirname, "..", "..", "lib", "prompts"),
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CohortRow = {
  set: string;
  file: string;
  constitution: InnerConstitution;
};

function loadJasonRow(): CohortRow | null {
  const dir = join(ROOT, "ocean");
  const file = "07-jason-real-session.json";
  const path = join(dir, file);
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return {
    set: "ocean",
    file,
    constitution: buildInnerConstitution(
      raw.answers,
      [],
      raw.demographics ?? null
    ),
  };
}

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

// Parse the `x2="..."` attribute from a single <line> tag.
function readAttrNum(tag: string, attr: string): number | null {
  const re = new RegExp(`${attr}="([0-9.\\-]+)"`);
  const m = tag.match(re);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

// Find the first <line> tag that has `data-element="<id>"`.
function findElementTag(svg: string, dataElement: string): string | null {
  const re = new RegExp(
    `<[a-zA-Z]+[^>]*data-element="${dataElement}"[^>]*\\/?>`,
    ""
  );
  const m = svg.match(re);
  return m ? m[0] : null;
}

// Chart origin per CC-CHART-LABEL-LEGIBILITY-AND-TOLERANCE-SMOOTHING.
// Plot area starts at (60, 24) and extends 200×200 to (260, 224).
const CHART_ORIGIN_X = 60;
const CHART_ORIGIN_Y = 224;
const CHART_VIEWBOX_HEIGHT = 320;
const LEGEND_START_Y = 246;

// Compute angle from chart origin to (x, y) in degrees in the
// Goal/Soul plane. Goal is +x from origin; Soul is -y from origin
// (svg y grows downward). atan2(soulDelta, goalDelta).
function svgPointToAngle(x: number, y: number): number {
  const goalDelta = x - CHART_ORIGIN_X;
  const soulDelta = CHART_ORIGIN_Y - y;
  if (goalDelta === 0 && soulDelta === 0) return 0;
  const rad = Math.atan2(soulDelta, goalDelta);
  return (rad * 180) / Math.PI;
}

function distanceFromOrigin(x: number, y: number): number {
  return Math.hypot(x - CHART_ORIGIN_X, y - CHART_ORIGIN_Y);
}

// Extract `y` from a `y="..."` or `y2="..."` attribute on a tag.
function readAnyY(tag: string): number | null {
  const re = /\sy="([0-9.\-]+)"|\sy2="([0-9.\-]+)"/;
  const m = tag.match(re);
  if (!m) return null;
  const v = m[1] ?? m[2];
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const jasonRow = loadJasonRow();
  const cohort = loadCohort();

  // ── 1. trajectory-chart-svg-well-formed ─────────────────────────────
  // Render a synthetic chart and verify it has exactly one <svg> root,
  // closes correctly, and contains an xmlns attribute.
  const syntheticSvg = generateTrajectoryChartSvg({
    adjustedGoal: 70,
    adjustedSoul: 60,
    potentialMovement: 65,
    usableMovement: 55,
    toleranceDegrees: 10,
    gripScore: 30,
    gripDragModifier: 0.85,
    aimGovernorModifier: 0.95,
    primalPrimary: null,
    primalConfidence: null,
    quadrantLabel: "Giving / Presence",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 40,
  });
  const wellFormedFails: string[] = [];
  const openSvgs = syntheticSvg.match(/<svg[\s>]/g) ?? [];
  const closeSvgs = syntheticSvg.match(/<\/svg>/g) ?? [];
  if (openSvgs.length !== 1)
    wellFormedFails.push(`open <svg> count=${openSvgs.length}`);
  if (closeSvgs.length !== 1)
    wellFormedFails.push(`close </svg> count=${closeSvgs.length}`);
  if (!syntheticSvg.includes(`xmlns="http://www.w3.org/2000/svg"`))
    wellFormedFails.push("missing xmlns");
  if (!syntheticSvg.includes("viewBox="))
    wellFormedFails.push("missing viewBox");
  results.push(
    wellFormedFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-chart-svg-well-formed",
          detail: `synthetic chart: 1× <svg>, 1× </svg>, xmlns + viewBox present`,
        }
      : {
          ok: false,
          assertion: "trajectory-chart-svg-well-formed",
          detail: wellFormedFails.join(" | "),
        }
  );

  // ── 2. trajectory-chart-four-elements-present ───────────────────────
  const elementFails: string[] = [];
  if (!syntheticSvg.includes(`data-element="potential-trajectory"`))
    elementFails.push("missing potential-trajectory");
  if (!syntheticSvg.includes(`data-element="usable-trajectory"`))
    elementFails.push("missing usable-trajectory");
  if (!syntheticSvg.includes(`data-element="tolerance-cone-lower"`))
    elementFails.push("missing tolerance-cone-lower");
  if (!syntheticSvg.includes(`data-element="tolerance-cone-upper"`))
    elementFails.push("missing tolerance-cone-upper");
  if (!syntheticSvg.includes(`data-element="grip-drag-marker"`))
    elementFails.push("missing grip-drag-marker");
  results.push(
    elementFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-chart-four-elements-present",
          detail: "potential + usable + cone (lower/upper) + drag marker all present",
        }
      : {
          ok: false,
          assertion: "trajectory-chart-four-elements-present",
          detail: elementFails.join(" | "),
        }
  );

  // ── 3. trajectory-chart-jason-fixture-renders ───────────────────────
  if (!jasonRow) {
    results.push({
      ok: false,
      assertion: "trajectory-chart-jason-fixture-renders",
      detail: "Jason fixture not present",
    });
  } else {
    let jasonSvg = "";
    let renderErr: string | null = null;
    try {
      jasonSvg = generateTrajectoryChartSvgFromConstitution(jasonRow.constitution);
    } catch (e) {
      renderErr = (e as Error).message;
    }
    const renderFails: string[] = [];
    if (renderErr) renderFails.push(`threw: ${renderErr}`);
    else {
      if (!jasonSvg.includes(`data-element="potential-trajectory"`))
        renderFails.push("missing potential-trajectory");
      if (!jasonSvg.includes(`data-element="usable-trajectory"`))
        renderFails.push("missing usable-trajectory");
      if (!jasonSvg.includes(`data-element="tolerance-cone-lower"`))
        renderFails.push("missing tolerance-cone-lower");
      if (!jasonSvg.includes(`data-element="tolerance-cone-upper"`))
        renderFails.push("missing tolerance-cone-upper");
    }
    results.push(
      renderFails.length === 0
        ? {
            ok: true,
            assertion: "trajectory-chart-jason-fixture-renders",
            detail: `Jason chart renders cleanly with all 4 canonical elements`,
          }
        : {
            ok: false,
            assertion: "trajectory-chart-jason-fixture-renders",
            detail: renderFails.join(" | "),
          }
    );
  }

  // ── 4. trajectory-chart-jason-usable-shorter-than-potential ─────────
  if (!jasonRow) {
    results.push({
      ok: false,
      assertion: "trajectory-chart-jason-usable-shorter-than-potential",
      detail: "Jason fixture not present",
    });
  } else {
    const svg = generateTrajectoryChartSvgFromConstitution(jasonRow.constitution);
    const potentialTag = findElementTag(svg, "potential-trajectory");
    const usableTag = findElementTag(svg, "usable-trajectory");
    const potX = potentialTag ? readAttrNum(potentialTag, "x2") : null;
    const potY = potentialTag ? readAttrNum(potentialTag, "y2") : null;
    const usaX = usableTag ? readAttrNum(usableTag, "x2") : null;
    const usaY = usableTag ? readAttrNum(usableTag, "y2") : null;
    if (potX === null || potY === null || usaX === null || usaY === null) {
      results.push({
        ok: false,
        assertion: "trajectory-chart-jason-usable-shorter-than-potential",
        detail: `couldn't parse endpoints (pot=${potX},${potY}; usa=${usaX},${usaY})`,
      });
    } else {
      const potLen = distanceFromOrigin(potX, potY);
      const usaLen = distanceFromOrigin(usaX, usaY);
      results.push(
        usaLen < potLen
          ? {
              ok: true,
              assertion: "trajectory-chart-jason-usable-shorter-than-potential",
              detail: `usable ${usaLen.toFixed(1)} < potential ${potLen.toFixed(1)} (ratio ${(usaLen / potLen).toFixed(2)})`,
            }
          : {
              ok: false,
              assertion: "trajectory-chart-jason-usable-shorter-than-potential",
              detail: `usable ${usaLen.toFixed(1)} not shorter than potential ${potLen.toFixed(1)}`,
            }
      );
    }
  }

  // ── 5. trajectory-chart-jason-tolerance-cone-correct ────────────────
  // Jason: Aim ~52 → tolerance 15°; angle ~33° → lower 18°, upper 48° (±2°).
  if (!jasonRow) {
    results.push({
      ok: false,
      assertion: "trajectory-chart-jason-tolerance-cone-correct",
      detail: "Jason fixture not present",
    });
  } else {
    const svg = generateTrajectoryChartSvgFromConstitution(jasonRow.constitution);
    const lowerTag = findElementTag(svg, "tolerance-cone-lower");
    const upperTag = findElementTag(svg, "tolerance-cone-upper");
    const dash = jasonRow.constitution.goalSoulMovement?.dashboard;
    const limiter = dash?.movementLimiter;
    const aim = jasonRow.constitution.aimReading?.score ?? null;
    const angle = dash?.direction.angle ?? null;
    const tolerance = limiter?.toleranceDegrees ?? null;
    if (!lowerTag || !upperTag || aim === null || angle === null || tolerance === null) {
      results.push({
        ok: false,
        assertion: "trajectory-chart-jason-tolerance-cone-correct",
        detail: `missing data — lowerTag=${!!lowerTag} upperTag=${!!upperTag} aim=${aim} angle=${angle} tol=${tolerance}`,
      });
    } else {
      const lowerX = readAttrNum(lowerTag, "x2") ?? 0;
      const lowerY = readAttrNum(lowerTag, "y2") ?? 0;
      const upperX = readAttrNum(upperTag, "x2") ?? 0;
      const upperY = readAttrNum(upperTag, "y2") ?? 0;
      const lowerAngle = svgPointToAngle(lowerX, lowerY);
      const upperAngle = svgPointToAngle(upperX, upperY);
      const expectedLower = Math.max(0, angle - tolerance);
      const expectedUpper = Math.min(90, angle + tolerance);
      const lowerOk = Math.abs(lowerAngle - expectedLower) <= 2;
      const upperOk = Math.abs(upperAngle - expectedUpper) <= 2;
      results.push(
        lowerOk && upperOk
          ? {
              ok: true,
              assertion: "trajectory-chart-jason-tolerance-cone-correct",
              detail: `cone: lower ${lowerAngle.toFixed(1)}° (expected ${expectedLower.toFixed(1)}°), upper ${upperAngle.toFixed(1)}° (expected ${expectedUpper.toFixed(1)}°), tolerance=${tolerance}°`,
            }
          : {
              ok: false,
              assertion: "trajectory-chart-jason-tolerance-cone-correct",
              detail: `cone bounds off — lower ${lowerAngle.toFixed(1)}° vs ${expectedLower.toFixed(1)}° (±2), upper ${upperAngle.toFixed(1)}° vs ${expectedUpper.toFixed(1)}° (±2)`,
            }
      );
    }
  }

  // ── 6. trajectory-chart-quadrant-label-active-prominence ────────────
  // The active quadrant label should render with font-size=12 + weight 600.
  // Passive labels render with font-size=9 + weight 400.
  const activeProminence = generateTrajectoryChartSvg({
    adjustedGoal: 80,
    adjustedSoul: 80,
    potentialMovement: 90,
    usableMovement: 75,
    toleranceDegrees: 7,
    gripScore: 20,
    gripDragModifier: 0.9,
    aimGovernorModifier: 0.95,
    primalPrimary: null,
    primalConfidence: null,
    quadrantLabel: "Goal-led Presence",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 40,
  });
  // Look for a <text> with the active label and confirm font-size="12".
  const activeRe = /<text[^>]*font-size="12"[^>]*font-weight="600"[^>]*>Goal-led Presence<\/text>/;
  const passiveRe = /<text[^>]*font-size="9"[^>]*opacity="0\.6"[^>]*>Work without Presence<\/text>/;
  const promFails: string[] = [];
  if (!activeRe.test(activeProminence))
    promFails.push("active label 'Goal-led Presence' not rendered at size 12 / weight 600");
  if (!passiveRe.test(activeProminence))
    promFails.push("passive label 'Work without Presence' not rendered at size 9 / opacity 0.6");
  results.push(
    promFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-chart-quadrant-label-active-prominence",
          detail: "active label rendered large/bold, passive labels rendered small/muted",
        }
      : {
          ok: false,
          assertion: "trajectory-chart-quadrant-label-active-prominence",
          detail: promFails.join(" | "),
        }
  );

  // ── 7. trajectory-chart-no-gripping-label-for-non-gripping-user ─────
  // When gripClusterFires=false AND the active quadrant ≠ "Gripping",
  // no "Gripping" text node should be rendered.
  const nonGripping = generateTrajectoryChartSvg({
    adjustedGoal: 80,
    adjustedSoul: 80,
    potentialMovement: 90,
    usableMovement: 75,
    toleranceDegrees: 7,
    gripScore: 20,
    gripDragModifier: 0.9,
    aimGovernorModifier: 0.95,
    primalPrimary: null,
    primalConfidence: null,
    quadrantLabel: "Goal-led Presence",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 40,
  });
  const hasGrippingLabel = />Gripping</.test(nonGripping);
  results.push(
    !hasGrippingLabel
      ? {
          ok: true,
          assertion: "trajectory-chart-no-gripping-label-for-non-gripping-user",
          detail: "no 'Gripping' label rendered when gripClusterFires=false and user is not in Gripping quadrant",
        }
      : {
          ok: false,
          assertion: "trajectory-chart-no-gripping-label-for-non-gripping-user",
          detail: "'Gripping' label leaked into SVG for a non-Gripping user",
        }
  );

  // ── 8. trajectory-chart-crisis-path-reduced-opacity ─────────────────
  // Crisis-path chart should carry opacity < 1.0 on the wrapper +
  // suppress quadrant labels + render a hedge.
  const crisisSvg = generateTrajectoryChartSvg({
    adjustedGoal: 60,
    adjustedSoul: 40,
    potentialMovement: 55,
    usableMovement: 40,
    toleranceDegrees: 15,
    gripScore: 50,
    gripDragModifier: 0.78,
    aimGovernorModifier: 0.92,
    primalPrimary: null,
    primalConfidence: null,
    quadrantLabel: "Work without Presence",
    gripClusterFires: false,
    pathClass: "crisis",
    angleDegrees: 30,
  });
  const crisisFails: string[] = [];
  const opacityMatch = crisisSvg.match(/opacity:([0-9.]+)/);
  const wrapperOpacity = opacityMatch ? Number(opacityMatch[1]) : 1;
  if (wrapperOpacity >= 1.0) crisisFails.push(`wrapper opacity=${wrapperOpacity}, expected <1`);
  if (!crisisSvg.includes(`data-element="crisis-hedge"`))
    crisisFails.push("missing crisis-hedge text");
  if (crisisSvg.includes(">Work without Presence<"))
    crisisFails.push("quadrant label not suppressed in crisis path");
  results.push(
    crisisFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-chart-crisis-path-reduced-opacity",
          detail: `crisis wrapper opacity=${wrapperOpacity}, hedge present, quadrant labels suppressed`,
        }
      : {
          ok: false,
          assertion: "trajectory-chart-crisis-path-reduced-opacity",
          detail: crisisFails.join(" | "),
        }
  );

  // ── 9. trajectory-chart-zero-movement-edge-case ─────────────────────
  const zeroSvg = generateTrajectoryChartSvg({
    adjustedGoal: 0,
    adjustedSoul: 0,
    potentialMovement: 0,
    usableMovement: null,
    toleranceDegrees: null,
    gripScore: 0,
    gripDragModifier: null,
    aimGovernorModifier: null,
    primalPrimary: null,
    primalConfidence: null,
    quadrantLabel: "Drift",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 0,
  });
  const zeroFails: string[] = [];
  if (!zeroSvg.includes(`data-element="zero-origin-dot"`))
    zeroFails.push("missing zero-origin-dot");
  if (!zeroSvg.includes(`data-element="zero-movement-hedge"`))
    zeroFails.push("missing zero-movement-hedge text");
  // Should NOT contain trajectory lines.
  if (zeroSvg.includes(`data-element="potential-trajectory"`))
    zeroFails.push("zero-movement should not render potential-trajectory line");
  results.push(
    zeroFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-chart-zero-movement-edge-case",
          detail: "zero-movement renders origin dot + hedge text, no trajectory line",
        }
      : {
          ok: false,
          assertion: "trajectory-chart-zero-movement-edge-case",
          detail: zeroFails.join(" | "),
        }
  );

  // ── 10. trajectory-chart-primal-annotation-high-confidence ──────────
  const primalHigh = generateTrajectoryChartSvg({
    adjustedGoal: 80,
    adjustedSoul: 30,
    potentialMovement: 70,
    usableMovement: 55,
    toleranceDegrees: 10,
    gripScore: 60,
    gripDragModifier: 0.73,
    aimGovernorModifier: 0.92,
    primalPrimary: "Am I good enough?",
    primalConfidence: "high",
    quadrantLabel: "Work without Presence",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 20,
  });
  // Annotation must appear in the legend region (y ≥ LEGEND_START_Y),
  // not in the plot area — CC-CHART-LABEL-LEGIBILITY moved it out of
  // the plot so it stops colliding with the drag marker.
  const primalAnnoTag = findElementTag(primalHigh, "primal-annotation");
  const primalAnnoY = primalAnnoTag ? readAnyY(primalAnnoTag) : null;
  results.push(
    primalHigh.includes(`data-element="primal-annotation"`) &&
      primalHigh.includes("Pulling: Am I good enough?") &&
      primalAnnoY !== null &&
      primalAnnoY >= LEGEND_START_Y
      ? {
          ok: true,
          assertion: "trajectory-chart-primal-annotation-high-confidence",
          detail: `'Pulling: Am I good enough?' rendered in legend (y=${primalAnnoY?.toFixed(0)} ≥ ${LEGEND_START_Y})`,
        }
      : {
          ok: false,
          assertion: "trajectory-chart-primal-annotation-high-confidence",
          detail: `Primal annotation missing or not in legend region (y=${primalAnnoY})`,
        }
  );

  // ── 11. trajectory-chart-primal-annotation-suppressed-low-confidence ─
  const primalLow = generateTrajectoryChartSvg({
    adjustedGoal: 80,
    adjustedSoul: 30,
    potentialMovement: 70,
    usableMovement: 55,
    toleranceDegrees: 10,
    gripScore: 60,
    gripDragModifier: 0.73,
    aimGovernorModifier: 0.92,
    primalPrimary: "Am I good enough?",
    primalConfidence: "low",
    quadrantLabel: "Work without Presence",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 20,
  });
  results.push(
    !primalLow.includes(`data-element="primal-annotation"`) &&
      !primalLow.includes("Pulling:")
      ? {
          ok: true,
          assertion: "trajectory-chart-primal-annotation-suppressed-low-confidence",
          detail: "Primal annotation suppressed when confidence='low'",
        }
      : {
          ok: false,
          assertion: "trajectory-chart-primal-annotation-suppressed-low-confidence",
          detail: "Primal annotation leaked into low-confidence chart",
        }
  );

  // ── 12. trajectory-chart-no-prose-changes ───────────────────────────
  // The trajectory chart module + its callers must not import any LLM
  // prompt file, and no prompt files in lib/prompts/ should reference
  // generateTrajectoryChartSvg.
  const proseFails: string[] = [];
  const trajectorySource = readFileSync(TRAJECTORY_FILE, "utf-8");
  if (
    trajectorySource.includes("/prompts/") ||
    trajectorySource.includes('from "./prompts')
  ) {
    proseFails.push("trajectoryChart.ts references a prompt module");
  }
  for (const promptDir of PROMPT_DIRS) {
    if (!existsSync(promptDir)) continue;
    for (const f of readdirSync(promptDir)) {
      if (!f.endsWith(".ts") && !f.endsWith(".md")) continue;
      const content = readFileSync(join(promptDir, f), "utf-8");
      if (content.includes("generateTrajectoryChartSvg")) {
        proseFails.push(`prompt file ${f} references trajectory chart`);
      }
    }
  }
  results.push(
    proseFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-chart-no-prose-changes",
          detail: "trajectoryChart module is render-only; no LLM prompt files reference it",
        }
      : {
          ok: false,
          assertion: "trajectory-chart-no-prose-changes",
          detail: proseFails.join(" | "),
        }
  );

  // ──────────────────────────────────────────────────────────────────────
  // CC-CHART-LABEL-LEGIBILITY-AND-TOLERANCE-SMOOTHING — 8 new assertions.
  // ──────────────────────────────────────────────────────────────────────

  // ── 13. chart-no-label-clipping-right ──────────────────────────────
  // Right-column quadrant labels (Giving / Presence, Goal-led Presence,
  // Work without Presence) must render as the full string anchored at
  // the right plot edge with text-anchor=end. No truncation, no overflow.
  const rightLabelFails: string[] = [];
  const rightLabelProbes: Array<{ label: string; goal: number; soul: number; angle: number }> = [
    { label: "Giving / Presence", goal: 80, soul: 80, angle: 50 },
    { label: "Goal-led Presence", goal: 80, soul: 80, angle: 35 },
    { label: "Work without Presence", goal: 80, soul: 20, angle: 20 },
  ];
  for (const p of rightLabelProbes) {
    const svg = generateTrajectoryChartSvg({
      adjustedGoal: p.goal,
      adjustedSoul: p.soul,
      potentialMovement: 70,
      usableMovement: 60,
      toleranceDegrees: 9,
      gripScore: 20,
      gripDragModifier: 0.9,
      aimGovernorModifier: 0.95,
      primalPrimary: null,
      primalConfidence: null,
      quadrantLabel: p.label,
      gripClusterFires: false,
      pathClass: "trajectory",
      angleDegrees: p.angle,
    });
    const re = new RegExp(
      `<text[^>]*text-anchor="end"[^>]*>${p.label.replace(/[/]/g, "\\/")}</text>`
    );
    if (!re.test(svg)) {
      rightLabelFails.push(`'${p.label}' not anchored at right edge`);
    }
  }
  results.push(
    rightLabelFails.length === 0
      ? {
          ok: true,
          assertion: "chart-no-label-clipping-right",
          detail: "right-column quadrant labels render full + anchored end",
        }
      : {
          ok: false,
          assertion: "chart-no-label-clipping-right",
          detail: rightLabelFails.join(" | "),
        }
  );

  // ── 14. chart-no-label-clipping-left ───────────────────────────────
  const leftLabelFails: string[] = [];
  const leftSvg = generateTrajectoryChartSvg({
    adjustedGoal: 20,
    adjustedSoul: 80,
    potentialMovement: 65,
    usableMovement: 55,
    toleranceDegrees: 9,
    gripScore: 20,
    gripDragModifier: 0.9,
    aimGovernorModifier: 0.95,
    primalPrimary: null,
    primalConfidence: null,
    quadrantLabel: "Love without Form",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 70,
  });
  if (!/<text[^>]*text-anchor="start"[^>]*>Love without Form<\/text>/.test(leftSvg))
    leftLabelFails.push("'Love without Form' not anchored at left edge");
  // Drift in SW (gripClusterFires=false) — also left-anchored.
  const driftSvg = generateTrajectoryChartSvg({
    adjustedGoal: 20,
    adjustedSoul: 20,
    potentialMovement: 25,
    usableMovement: 20,
    toleranceDegrees: 15,
    gripScore: 20,
    gripDragModifier: 0.9,
    aimGovernorModifier: 0.95,
    primalPrimary: null,
    primalConfidence: null,
    quadrantLabel: "Drift",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 40,
  });
  if (!/<text[^>]*text-anchor="start"[^>]*>Drift<\/text>/.test(driftSvg))
    leftLabelFails.push("'Drift' not anchored at left edge");
  results.push(
    leftLabelFails.length === 0
      ? {
          ok: true,
          assertion: "chart-no-label-clipping-left",
          detail: "left-column quadrant labels render full + anchored start",
        }
      : {
          ok: false,
          assertion: "chart-no-label-clipping-left",
          detail: leftLabelFails.join(" | "),
        }
  );

  // ── 15. chart-primal-annotation-in-legend-not-chart ────────────────
  const primalCheck = generateTrajectoryChartSvg({
    adjustedGoal: 80,
    adjustedSoul: 30,
    potentialMovement: 70,
    usableMovement: 55,
    toleranceDegrees: 12,
    gripScore: 60,
    gripDragModifier: 0.73,
    aimGovernorModifier: 0.92,
    primalPrimary: "Am I good enough?",
    primalConfidence: "high",
    quadrantLabel: "Work without Presence",
    gripClusterFires: false,
    pathClass: "trajectory",
    angleDegrees: 20,
  });
  const primalTag = findElementTag(primalCheck, "primal-annotation");
  const primalY = primalTag ? readAnyY(primalTag) : null;
  const primalInLegend =
    primalTag !== null &&
    primalY !== null &&
    primalY >= LEGEND_START_Y &&
    primalY <= CHART_VIEWBOX_HEIGHT;
  // Also confirm "Pulling: …" text only occurs in the legend region.
  const pullingMatches = Array.from(
    primalCheck.matchAll(/<text[^>]*y="([0-9.\-]+)"[^>]*>Pulling:[^<]*<\/text>/g)
  );
  const pullingOutsideLegend = pullingMatches.filter(
    (m) => Number(m[1]) < LEGEND_START_Y
  );
  results.push(
    primalInLegend && pullingOutsideLegend.length === 0
      ? {
          ok: true,
          assertion: "chart-primal-annotation-in-legend-not-chart",
          detail: `'Pulling:' annotation rendered in legend (y=${primalY?.toFixed(0)}), zero plot-area occurrences`,
        }
      : {
          ok: false,
          assertion: "chart-primal-annotation-in-legend-not-chart",
          detail: `inLegend=${primalInLegend}, plot-area occurrences=${pullingOutsideLegend.length}`,
        }
  );

  // ── 16. chart-consolidated-length-readout ──────────────────────────
  // A single text node carries both numbers. CC-MOMENTUM-HONESTY
  // inverted the phrasing so Usable leads ("Usable X of potential Y
  // (-Z% drag)") — both leading-Usable and the older leading-Potential
  // forms are accepted to keep the assertion robust across future
  // wording shifts.
  const consolidatedRe = /<text[^>]*data-element="length-readout"[^>]*>[^<]*(?:Potential [^<]*→ Usable|Usable [^<]+ of potential)[^<]*<\/text>/;
  const hasConsolidated = consolidatedRe.test(primalCheck);
  // The legacy stacked-label format ("usable XX") must NOT appear.
  const legacyUsableRe = /<text[^>]*>usable\s+[0-9]/;
  const hasLegacyUsable = legacyUsableRe.test(primalCheck);
  results.push(
    hasConsolidated && !hasLegacyUsable
      ? {
          ok: true,
          assertion: "chart-consolidated-length-readout",
          detail: "single 'Potential X → Usable Y' readout; legacy 'usable XX' label removed",
        }
      : {
          ok: false,
          assertion: "chart-consolidated-length-readout",
          detail: `hasConsolidated=${hasConsolidated}, hasLegacyUsable=${hasLegacyUsable}`,
        }
  );

  // ── 17. chart-tolerance-cone-legend-present ────────────────────────
  // For every cohort fixture with a tolerance cone rendered, the SVG
  // legend must contain a "Dashed fan: tolerance cone (±N°)" entry
  // with the dynamic N populated from limiter.toleranceDegrees.
  const legendFails: string[] = [];
  let legendChecked = 0;
  for (const r of cohort) {
    const dash = r.constitution.goalSoulMovement?.dashboard;
    const limiter = dash?.movementLimiter;
    if (!dash || !limiter) continue;
    if (dash.goalScore === 0 && dash.soulScore === 0) continue;
    const svg = generateTrajectoryChartSvgFromConstitution(r.constitution);
    const tol = limiter.toleranceDegrees;
    const re = new RegExp(
      `data-element="legend-tolerance-cone"[^>]*>Dashed fan: tolerance cone \\(±${tol}°`
    );
    if (!re.test(svg)) {
      legendFails.push(`${r.file}: legend missing ±${tol}° entry`);
      continue;
    }
    legendChecked++;
  }
  results.push(
    legendFails.length === 0
      ? {
          ok: true,
          assertion: "chart-tolerance-cone-legend-present",
          detail: `${legendChecked} fixtures: tolerance legend renders with dynamic ±N°`,
        }
      : {
          ok: false,
          assertion: "chart-tolerance-cone-legend-present",
          detail: legendFails.slice(0, 5).join(" | "),
        }
  );

  // ── 18. tolerance-cone-band-smoothing-correct ──────────────────────
  // The *new* 6-band formula (3°/6°/9°/12°/15°/18°).
  const bandCases: Array<{ aim: number; expected: number }> = [
    { aim: 90, expected: 3 },
    { aim: 75, expected: 6 },
    { aim: 60, expected: 9 },
    { aim: 50, expected: 12 },
    { aim: 40, expected: 15 },
    { aim: 20, expected: 18 },
  ];
  const bandFails: string[] = [];
  for (const c of bandCases) {
    const got = computeToleranceDegrees(c.aim);
    if (got !== c.expected) {
      bandFails.push(`aim=${c.aim} → ${got} (expected ${c.expected})`);
    }
  }
  results.push(
    bandFails.length === 0
      ? {
          ok: true,
          assertion: "tolerance-cone-band-smoothing-correct",
          detail: "all 6 smoothed-band thresholds match (3°/6°/9°/12°/15°/18°)",
        }
      : {
          ok: false,
          assertion: "tolerance-cone-band-smoothing-correct",
          detail: bandFails.join(" | "),
        }
  );

  // ── 19. tolerance-cone-no-jump-greater-than-3-degrees ──────────────
  // Sweep every integer Aim 0-100; adjacent values must differ by ≤3°.
  const jumpFails: string[] = [];
  let prev = computeToleranceDegrees(0);
  for (let aim = 1; aim <= 100; aim++) {
    const cur = computeToleranceDegrees(aim);
    if (Math.abs(cur - prev) > 3) {
      jumpFails.push(
        `aim ${aim - 1}→${aim}: ${prev}°→${cur}° (jump ${Math.abs(cur - prev)}°)`
      );
    }
    prev = cur;
  }
  results.push(
    jumpFails.length === 0
      ? {
          ok: true,
          assertion: "tolerance-cone-no-jump-greater-than-3-degrees",
          detail: "every adjacent integer Aim differs by ≤3° in tolerance",
        }
      : {
          ok: false,
          assertion: "tolerance-cone-no-jump-greater-than-3-degrees",
          detail: jumpFails.slice(0, 5).join(" | "),
        }
  );

  // ── 20. trajectory-chart-render-test-on-all-cohort-fixtures ────────
  // Every cohort fixture renders cleanly (no throw, full SVG present,
  // no leftover legacy "usable XX" labels in any output).
  const cohortRenderFails: string[] = [];
  let cohortRendered = 0;
  for (const r of cohort) {
    try {
      const svg = generateTrajectoryChartSvgFromConstitution(r.constitution);
      if (!svg.includes("<svg") || !svg.includes("</svg>")) {
        cohortRenderFails.push(`${r.file}: SVG malformed`);
        continue;
      }
      if (/<text[^>]*>usable\s+[0-9]/.test(svg)) {
        cohortRenderFails.push(`${r.file}: legacy 'usable XX' label leaked`);
        continue;
      }
      cohortRendered++;
    } catch (e) {
      cohortRenderFails.push(`${r.file}: threw ${(e as Error).message}`);
    }
  }
  results.push(
    cohortRenderFails.length === 0
      ? {
          ok: true,
          assertion: "trajectory-chart-render-test-on-all-cohort-fixtures",
          detail: `${cohortRendered}/${cohort.length} cohort fixtures render cleanly with no legacy artifacts`,
        }
      : {
          ok: false,
          assertion: "trajectory-chart-render-test-on-all-cohort-fixtures",
          detail: cohortRenderFails.slice(0, 5).join(" | "),
        }
  );

  // Diagnostic — cohort chart-renderability sweep.
  let rendered = 0;
  let failed = 0;
  for (const r of cohort) {
    try {
      const svg = generateTrajectoryChartSvgFromConstitution(r.constitution);
      if (svg.includes("<svg")) rendered++;
      else failed++;
    } catch {
      failed++;
    }
  }
  console.log(
    `\nCohort chart-renderability sweep: ${rendered}/${cohort.length} rendered cleanly (${failed} failed).`
  );

  // Suppress unused-import warnings.
  void ({} as TrajectoryChartInputs);

  return results;
}

function main(): number {
  console.log("CC-TRAJECTORY-VISUALIZATION — four-element chart audit");
  console.log("========================================================");
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
    "AUDIT PASSED — all CC-TRAJECTORY-VISUALIZATION assertions green."
  );
  return 0;
}

process.exit(main());
