// CODEX-PROSE-CORRELATION — empirical validation of the 3C / Goal-Soul
// collapse across the 20-fixture cohort.
//
// Hand-rolled audit. Invocation:
//   npx tsx tests/audit/proseCorrelation.audit.ts

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURE_DIRS = [
  join(__dirname, "..", "fixtures", "goal-soul-give"),
  join(__dirname, "..", "fixtures", "ocean"),
];
const LEAN_THRESHOLD = 38;
const QUADRANT_THRESHOLD = 50;

type Fixture = {
  label?: string;
  answers: Answer[];
  demographics?: DemographicSet | null;
};

type Observation = {
  file: string;
  cost: number;
  coverage: number;
  compliance: number;
  goal: number;
  soul: number;
  grip: number;
};

type Support = "STRONG SUPPORT" | "WEAK SUPPORT" | "NO SUPPORT";

function loadFixtures(): Observation[] {
  return FIXTURE_DIRS.flatMap((dir) =>
    readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => {
        const fixture = JSON.parse(
          readFileSync(join(dir, file), "utf-8")
        ) as Fixture;
        const constitution = buildInnerConstitution(
          fixture.answers,
          [],
          fixture.demographics ?? null
        );
        const drive = constitution.shape_outputs.path.drive;
        const movement = constitution.goalSoulMovement;

        if (!drive) {
          throw new Error(`${file}: missing drive output`);
        }
        if (!movement) {
          throw new Error(`${file}: missing Goal/Soul Movement output`);
        }

        return {
          file,
          cost: drive.distribution.cost,
          coverage: drive.distribution.coverage,
          compliance: drive.distribution.compliance,
          goal: movement.dashboard.goalScore,
          soul: movement.dashboard.soulScore,
          grip: movement.dashboard.grippingPull.score,
        };
      })
  );
}

function pearson(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length === 0) {
    throw new Error("Pearson inputs must be paired and non-empty");
  }

  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? 0 : numerator / denominator;
}

function supportFor(r: number): Support {
  if (r > 0.5) return "STRONG SUPPORT";
  if (r > 0.3) return "WEAK SUPPORT";
  return "NO SUPPORT";
}

function wholeVerdict(supports: Support[]): Support {
  if (supports.every((support) => support === "STRONG SUPPORT")) {
    return "STRONG SUPPORT";
  }
  if (supports.every((support) => support !== "NO SUPPORT")) {
    return "WEAK SUPPORT";
  }
  return "NO SUPPORT";
}

function fmt(r: number): string {
  return r.toFixed(2);
}

const observations = loadFixtures();
const costGoal = pearson(
  observations.map((obs) => obs.cost),
  observations.map((obs) => obs.goal)
);
const coverageSoul = pearson(
  observations.map((obs) => obs.coverage),
  observations.map((obs) => obs.soul)
);
const complianceGrip = pearson(
  observations.map((obs) => obs.compliance),
  observations.map((obs) => obs.grip)
);
const supports = [
  supportFor(costGoal),
  supportFor(coverageSoul),
  supportFor(complianceGrip),
];

const leans = {
  cost: observations.filter((obs) => obs.cost >= LEAN_THRESHOLD).length,
  coverage: observations.filter((obs) => obs.coverage >= LEAN_THRESHOLD)
    .length,
  compliance: observations.filter((obs) => obs.compliance >= LEAN_THRESHOLD)
    .length,
};

const quadrants = {
  drift: observations.filter(
    (obs) => obs.goal < QUADRANT_THRESHOLD && obs.soul < QUADRANT_THRESHOLD
  ).length,
  workWithoutPresence: observations.filter(
    (obs) => obs.goal >= QUADRANT_THRESHOLD && obs.soul < QUADRANT_THRESHOLD
  ).length,
  loveWithoutForm: observations.filter(
    (obs) => obs.goal < QUADRANT_THRESHOLD && obs.soul >= QUADRANT_THRESHOLD
  ).length,
  givingPresence: observations.filter(
    (obs) => obs.goal >= QUADRANT_THRESHOLD && obs.soul >= QUADRANT_THRESHOLD
  ).length,
};

const grip = {
  zero: observations.filter((obs) => obs.grip === 0).length,
  low: observations.filter((obs) => obs.grip > 0 && obs.grip <= 30).length,
  mid: observations.filter((obs) => obs.grip > 30 && obs.grip <= 70).length,
  high: observations.filter((obs) => obs.grip > 70 && obs.grip <= 100).length,
};

console.log(`=== CODEX-PROSE-CORRELATION ===

Correlation A (cost ↔ goal):       r = ${fmt(costGoal)} → ${supports[0]}
Correlation B (coverage ↔ soul):   r = ${fmt(coverageSoul)} → ${supports[1]}
Correlation C (compliance ↔ grip): r = ${fmt(complianceGrip)} → ${supports[2]}

VERDICT: ${wholeVerdict(supports)}

=== Cohort distribution ===
Cost-bucket lean (≥${LEAN_THRESHOLD}%): ${leans.cost} / ${observations.length}
Coverage-bucket lean: ${leans.coverage} / ${observations.length}
Compliance-bucket lean: ${leans.compliance} / ${observations.length}

Quadrants (Goal>=${QUADRANT_THRESHOLD}, Soul>=${QUADRANT_THRESHOLD}):
  Drift (low/low): ${quadrants.drift}
  Work without Presence (high/low): ${quadrants.workWithoutPresence}
  Love without Form (low/high): ${quadrants.loveWithoutForm}
  Giving Presence (high/high): ${quadrants.givingPresence}

Grip distribution:
  grip = 0: ${grip.zero}
  grip 1-30: ${grip.low}
  grip 31-70: ${grip.mid}
  grip 71-100: ${grip.high}`);
