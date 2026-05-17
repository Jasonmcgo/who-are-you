// CC-093 — Aim Drag Rate Canon guard.
//
// Locks the canonical "Aim contributes drag at ⅓ the rate of Grip" math
// against accidental drift. The drag formula in lib/movementLimiter.ts
// uses two ceiling constants:
//
//   MAX_GRIP_DRAG    = 0.45  → up to 45% reduction at Grip 100
//   MAX_AIM_GOVERNOR = 0.15  → up to 15% reduction at Aim 100
//
// Per the trajectory-model canon (filed 2026-05-10), Aim is a "light
// governor" — its drag rate must equal ⅓ of Grip's. This guard fails
// the build if anyone retunes the coefficients off-canon without also
// updating the canon. Cohort fixture spot-check verifies the engine's
// rendered usable-movement numbers match the formula byte-perfectly.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeUsableMovement,
  computeToleranceDegrees,
  MAX_GRIP_DRAG,
  MAX_AIM_GOVERNOR,
} from "../../lib/movementLimiter";
import { buildInnerConstitution } from "../../lib/identityEngine";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── 1. aim-grip-coefficient-ratio-is-one-third ─────────────────────
  //      Canonical invariant: AIM_COEFFICIENT / GRIP_COEFFICIENT = 1/3.
  {
    const ratio = MAX_AIM_GOVERNOR / MAX_GRIP_DRAG;
    const target = 1 / 3;
    const drift = Math.abs(ratio - target);
    results.push(
      drift < 0.01
        ? {
            ok: true,
            assertion: "aim-grip-coefficient-ratio-is-one-third",
            detail: `MAX_AIM_GOVERNOR (${MAX_AIM_GOVERNOR}) / MAX_GRIP_DRAG (${MAX_GRIP_DRAG}) = ${ratio.toFixed(4)} (canon: ${target.toFixed(4)})`,
          }
        : {
            ok: false,
            assertion: "aim-grip-coefficient-ratio-is-one-third",
            detail: `ratio drift: ${ratio.toFixed(4)} (canon: ${target.toFixed(4)}, |Δ|=${drift.toFixed(4)})`,
          }
    );
  }

  // ── 2. modifier-ceilings-match-canon ───────────────────────────────
  //      At Grip 100, gripDragModifier = 1 - 0.45 = 0.55 (45% drag).
  //      At Aim 100, aimGovernorModifier = 1 - 0.15 = 0.85 (15% drag).
  {
    const gripFloorReading = computeUsableMovement({
      potentialMovement: 100,
      grip: 100,
      aim: 0,
    });
    const aimFloorReading = computeUsableMovement({
      potentialMovement: 100,
      grip: 0,
      aim: 100,
    });
    const gripOk = Math.abs(gripFloorReading.gripDragModifier - 0.55) < 0.001;
    const aimOk = Math.abs(aimFloorReading.aimGovernorModifier - 0.85) < 0.001;
    results.push(
      gripOk && aimOk
        ? {
            ok: true,
            assertion: "modifier-ceilings-match-canon",
            detail: `Grip 100 → gripDragModifier=${gripFloorReading.gripDragModifier} (canon: 0.55); Aim 100 → aimGovernorModifier=${aimFloorReading.aimGovernorModifier} (canon: 0.85)`,
          }
        : {
            ok: false,
            assertion: "modifier-ceilings-match-canon",
            detail: `Grip 100 → gripDragModifier=${gripFloorReading.gripDragModifier} (canon: 0.55, ok=${gripOk}); Aim 100 → aimGovernorModifier=${aimFloorReading.aimGovernorModifier} (canon: 0.85, ok=${aimOk})`,
          }
    );
  }

  // ── 3. tolerance-cone-monotonic-in-aim ─────────────────────────────
  //      Higher Aim → narrower cone. Verify the function is monotonic
  //      non-increasing across the full 0-100 range.
  {
    const samples = Array.from({ length: 21 }, (_, i) => i * 5);
    const widths = samples.map(computeToleranceDegrees);
    const failures: string[] = [];
    for (let i = 1; i < widths.length; i++) {
      if (widths[i] > widths[i - 1]) {
        failures.push(
          `Aim ${samples[i - 1]} → ${widths[i - 1]}° but Aim ${samples[i]} → ${widths[i]}° (increased)`
        );
      }
    }
    const narrowAtTop = widths[widths.length - 1] < widths[0];
    results.push(
      failures.length === 0 && narrowAtTop
        ? {
            ok: true,
            assertion: "tolerance-cone-monotonic-in-aim",
            detail: `tolerance ${widths[0]}° (Aim 0) → ${widths[widths.length - 1]}° (Aim 100); monotonic non-increasing across 21 samples`,
          }
        : {
            ok: false,
            assertion: "tolerance-cone-monotonic-in-aim",
            detail:
              failures.length > 0
                ? failures.slice(0, 3).join("; ")
                : `range collapsed: Aim 0 → ${widths[0]}°, Aim 100 → ${widths[widths.length - 1]}°`,
          }
    );
  }

  // ── 4. cohort-engine-math-matches-formula ──────────────────────────
  //      For every cohort fixture with aim + grip + potential populated,
  //      the engine's rendered usableMovement matches a fresh recompute
  //      from the formula byte-perfectly. Guards against silent drift
  //      between movementLimiter.ts and downstream consumers.
  {
    const failures: string[] = [];
    let checked = 0;
    for (const dir of ["ocean", "goal-soul-give", "cohort"]) {
      const fullDir = join(ROOT, dir);
      if (!existsSync(fullDir)) continue;
      for (const f of readdirSync(fullDir)
        .filter((x) => x.endsWith(".json"))
        .sort()) {
        const raw = JSON.parse(readFileSync(join(fullDir, f), "utf-8")) as {
          answers: Answer[];
          demographics?: DemographicSet | null;
        };
        const c = buildInnerConstitution(
          raw.answers,
          [],
          raw.demographics ?? null
        );
        const aim = c.aimReading?.score;
        const grip = c.gripReading?.score;
        const potential =
          c.goalSoulMovement?.dashboard.movementStrength.length;
        if (
          typeof aim !== "number" ||
          typeof grip !== "number" ||
          typeof potential !== "number"
        ) {
          continue;
        }
        checked++;
        const u = computeUsableMovement({
          potentialMovement: potential,
          grip,
          aim,
        });
        const expectedGripMod = 1 - (grip / 100) * MAX_GRIP_DRAG;
        const expectedAimMod = 1 - (aim / 100) * MAX_AIM_GOVERNOR;
        const expectedUsable =
          Math.round(potential * expectedGripMod * expectedAimMod * 10) / 10;
        if (Math.abs(u.usableMovement - expectedUsable) > 0.05) {
          failures.push(
            `${dir}/${f}: engine usable=${u.usableMovement} but formula=${expectedUsable}`
          );
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "cohort-engine-math-matches-formula",
            detail: `${checked} cohort fixtures with aim+grip+potential — engine usable matches formula byte-perfectly`,
          }
        : {
            ok: false,
            assertion: "cohort-engine-math-matches-formula",
            detail: failures.slice(0, 3).join(" | "),
          }
    );
  }

  // ── Report ──────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(
    `CC-093 aim drag rate canon: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
