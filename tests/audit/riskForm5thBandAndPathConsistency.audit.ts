// CC-084 audit — Risk Form 5th band + Path card consistency.
//
// Five assertions per the CC spec:
//   1. The new band label "Lightly Governed Movement" is exported
//      from lib/riskForm.ts.
//   2. The classifier produces the new label for a synthetic input
//      (Aim 55, composedGrip 25) — inside the band window.
//   3. Across the cohort fixtures, no Movement-section label
//      contradicts the Path-card label (both must read from the
//      Aim-based classifier).
//   4. White-Knuckled Aim is still reachable (Daniel-anchor proxy —
//      the CC's anchor referenced a prod session, not a fixture; we
//      verify the band is still classifier-reachable via synthetic
//      probe).
//   5. Open-Handed Aim is still reached by at least one cohort fixture
//      (JasonDMcG-anchor proxy — the CC's anchor referenced a prod
//      session; the fixture-cohort substitute is whichever fixture
//      routes there today).

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeRiskFormFromAim,
  type RiskFormLetter,
  type RiskFormReading,
} from "../../lib/riskForm";
import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type { Answer, DemographicSet, InnerConstitution } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

interface CohortRow {
  set: string;
  file: string;
  constitution: InnerConstitution;
  answers: Answer[];
  demographics: DemographicSet | null;
}

function loadCohort(): CohortRow[] {
  const rows: CohortRow[] = [];
  const sets = ["cohort", "ocean", "goal-soul-give"];
  for (const set of sets) {
    const dir = join(REPO, "tests", "fixtures", set);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers?: Answer[];
        demographics?: DemographicSet | null;
      };
      const answers = raw.answers ?? [];
      const demographics = raw.demographics ?? null;
      try {
        const constitution = buildInnerConstitution(answers, [], demographics);
        rows.push({ set, file: f, constitution, answers, demographics });
      } catch {
        // skip fixtures that throw on materialization (none expected)
      }
    }
  }
  return rows;
}

// The 5 known Risk Form labels, in scan order (longest-first so the
// regex can't preferential-match a prefix when two labels share one).
const ALL_LETTERS: RiskFormLetter[] = [
  "Lightly Governed Movement",
  "Ungoverned Movement",
  "White-Knuckled Aim",
  "Open-Handed Aim",
  "Grip-Governed",
];

function pathRiskLine(md: string): RiskFormLetter | null {
  // The Path card synthesis prose includes a sentence of the shape
  // "Your Risk Form reads as <Label>" — possibly followed by
  // "(formerly X)" or ":" or "—". Find the SECOND occurrence (the
  // first is the Movement section's metric line; the second is the
  // Path card's narrative integration). When only one occurrence
  // exists (Movement section), return that letter — Path card was
  // suppressed (thin signal / no movement).
  const occurrences: RiskFormLetter[] = [];
  const re = /Your Risk Form reads as /g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const tail = md.slice(m.index + m[0].length);
    for (const letter of ALL_LETTERS) {
      if (tail.startsWith(letter)) {
        occurrences.push(letter);
        break;
      }
    }
  }
  if (occurrences.length === 0) return null;
  // Return the LAST occurrence — that's the Path card narrative line
  // (the Movement section emits its label as a metric bullet, not
  // wrapped in "Your Risk Form reads as").
  return occurrences[occurrences.length - 1] ?? null;
}

function movementRiskLabel(reading: RiskFormReading): string {
  return reading.letter;
}

function runAudit(): void {
  const results: AssertionResult[] = [];

  // ── 1. New band label exported ─────────────────────────────────────
  {
    const src = readFileSync(join(REPO, "lib", "riskForm.ts"), "utf-8");
    const inUnion = /\| "Lightly Governed Movement"/.test(src);
    const inProseMap = /"Lightly Governed Movement":\s*\n?\s*"Your Risk Form reads as Lightly Governed Movement/.test(
      src
    );
    results.push(
      inUnion && inProseMap
        ? {
            ok: true,
            assertion: "lightly-governed-movement-exported",
            detail: `lib/riskForm.ts exports the new label in the union + the PROSE map`,
          }
        : {
            ok: false,
            assertion: "lightly-governed-movement-exported",
            detail: `union=${inUnion} proseMap=${inProseMap}`,
          }
    );
  }

  // ── 2. Synthetic probe (Aim 55, Grip 25) → new band ───────────────
  {
    const reading = computeRiskFormFromAim(55, 25);
    results.push(
      reading.letter === "Lightly Governed Movement"
        ? {
            ok: true,
            assertion: "classifier-synthetic-probe-routes-to-new-band",
            detail: `Aim 55 + composedGrip 25 → ${reading.letter}`,
          }
        : {
            ok: false,
            assertion: "classifier-synthetic-probe-routes-to-new-band",
            detail: `Aim 55 + composedGrip 25 → ${reading.letter} (expected Lightly Governed Movement)`,
          }
    );
  }

  // ── 3. Cohort: no Movement / Path-card label contradiction ────────
  //   Render each cohort fixture's clinician markdown. The Movement
  //   section emits `Risk Form: <letter>` (from the Aim-based reading);
  //   the Path card emits a `Your Risk Form reads as <Label>` line
  //   (from the same classifier source after CC-084's fix to
  //   synthesis1Finish.ts). Mismatches are forbidden.
  {
    const cohort = loadCohort();
    const failures: string[] = [];
    for (const r of cohort) {
      const reading = r.constitution.riskFormFromAim ?? r.constitution.riskForm;
      if (!reading) continue; // thin signal — no Risk Form
      const md = renderMirrorAsMarkdown({
        constitution: r.constitution,
        includeBeliefAnchor: false,
        answers: r.answers,
        demographics: r.demographics,
        generatedAt: new Date("2026-05-13T00:00:00Z"),
        renderMode: "clinician",
      });
      const movementLabel = movementRiskLabel(reading);
      const pathLabel = pathRiskLine(md);
      if (pathLabel !== null && pathLabel !== movementLabel) {
        failures.push(
          `${r.set}/${r.file}: movement="${movementLabel}" vs path="${pathLabel}"`
        );
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "no-movement-path-contradiction-across-cohort",
            detail: `${cohort.length} cohort fixtures: 0 Movement/Path label contradictions`,
          }
        : {
            ok: false,
            assertion: "no-movement-path-contradiction-across-cohort",
            detail: failures.slice(0, 4).join(" | "),
          }
    );
  }

  // ── 4. White-Knuckled Aim still reachable (Daniel-anchor proxy) ───
  //   The CC's anchor referenced a prod session (Daniel, composed Grip
  //   55) that is not present in the fixture cohort. Substitute a
  //   classifier-reachability probe so the band's existence is still
  //   regression-tested.
  {
    const reading = computeRiskFormFromAim(75, 55);
    results.push(
      reading.letter === "White-Knuckled Aim"
        ? {
            ok: true,
            assertion: "white-knuckled-aim-still-reachable",
            detail: `Aim 75 + composedGrip 55 → White-Knuckled Aim (Daniel-anchor proxy: composed Grip 55 keeps the session out of the new 5th band)`,
          }
        : {
            ok: false,
            assertion: "white-knuckled-aim-still-reachable",
            detail: `Aim 75 + composedGrip 55 → ${reading.letter}; expected White-Knuckled Aim`,
          }
    );
  }

  // ── 5. Open-Handed Aim still reached by ≥ 1 cohort fixture ─────────
  //   The CC anchored on JasonDMcG (prod session). In the fixture
  //   cohort the goal-soul-give/01-generative + 09-mid-career-balance
  //   files route to Open-Handed Aim. Verify at least one such
  //   fixture still hits the label so the band hasn't been cannibalized
  //   by the new 5th band.
  {
    const cohort = loadCohort();
    const openHanded = cohort.filter(
      (r) =>
        (r.constitution.riskFormFromAim?.letter ?? r.constitution.riskForm?.letter) ===
        "Open-Handed Aim"
    );
    results.push(
      openHanded.length > 0
        ? {
            ok: true,
            assertion: "open-handed-aim-still-reached-by-cohort",
            detail: `${openHanded.length} cohort fixture(s) route to Open-Handed Aim: ${openHanded
              .slice(0, 3)
              .map((r) => `${r.set}/${r.file}`)
              .join(", ")}`,
          }
        : {
            ok: false,
            assertion: "open-handed-aim-still-reached-by-cohort",
            detail: `0 cohort fixtures route to Open-Handed Aim — JasonDMcG-anchor proxy broken`,
          }
    );
  }

  // ── Report ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(`CC-084: ${passed}/${results.length} assertions passing.`);
  if (failed > 0) process.exit(1);
}

runAudit();
