// CC-SYNTHESIS-1A — synthesis-layer-collapse first-pass audit.
//
// Three structural additions over the existing engine outputs:
//   1. Risk Form 2x2 (Drive risk-bucket × grippingPull-score)
//   2. Four-Quadrant Movement label (Goal × Soul plane)
//   3. Two-Tier Closing-Phrase logic (default vs arrived)
//
// Ten assertions across the 20-fixture cohort.
//
// Hand-rolled. Invocation: `npx tsx tests/audit/synthesis1a.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";
import type { RiskFormLetter } from "../../lib/riskForm";
import type { MovementQuadrantLabel } from "../../lib/movementQuadrant";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const OCEAN_DIR = join(ROOT, "ocean");
const GSG_DIR = join(ROOT, "goal-soul-give");

type FixtureRecord = {
  set: "ocean" | "goal-soul-give";
  file: string;
  answers: Answer[];
  demographics: DemographicSet | null;
};

function loadFixtures(): FixtureRecord[] {
  const out: FixtureRecord[] = [];
  for (const dir of [OCEAN_DIR, GSG_DIR]) {
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
        answers: raw.answers,
        demographics: raw.demographics ?? null,
      });
    }
  }
  return out;
}

// CC-PHASE-3A-LABEL-LOGIC — refined Risk Form + quadrant labels.
const RISK_FORM_LETTERS: readonly RiskFormLetter[] = [
  "Open-Handed Aim",
  "Grip-Governed",
  "Ungoverned Movement",
  "White-Knuckled Aim",
];

const QUADRANT_LABELS: readonly MovementQuadrantLabel[] = [
  "Drift",
  "Gripping",
  "Work without Presence",
  "Pressed Output",
  "Love without Form",
  "Anxious Caring",
  "Giving / Presence",
  "Strained Integration",
  "Goal-led Presence",
  "Driven Output",
  "Soul-led Presence",
  "Burdened Care",
];

const ARRIVED_PHRASE = "Giving is Work that has found its beloved object";
const DEFAULT_PHRASE = "the early shape of giving";
const ARRIVED_STRENGTH_FLOOR = 70;

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function meetsArrivedConditions(constitution: InnerConstitution): boolean {
  // CC-PHASE-3A-LABEL-LOGIC — "arrived" requires the canonical in-band
  // integration quadrant (Goal-led/Soul-led Presence are out-of-band
  // variants) + Open-Handed Aim risk form.
  const quadOk = constitution.movementQuadrant?.label === "Giving / Presence";
  const riskOk = constitution.riskForm?.letter === "Open-Handed Aim";
  const len = constitution.goalSoulMovement?.dashboard.movementStrength.length ?? 0;
  const strengthOk = len >= ARRIVED_STRENGTH_FLOOR;
  return quadOk && riskOk && strengthOk;
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const fixtures = loadFixtures();

  // Per-fixture compute pass. Capture all the data we need for the
  // distribution / coverage / mutual-exclusion assertions in one walk.
  type Row = {
    file: string;
    set: string;
    constitution: InnerConstitution;
    markdown: string;
    riskFormLetter: RiskFormLetter | null;
    quadrantLabel: MovementQuadrantLabel | null;
    arrivedConditionsHold: boolean;
    closingMentionsArrived: boolean;
    closingMentionsDefault: boolean;
    riskFormProsePresent: boolean;
    quadrantLineLabels: MovementQuadrantLabel[]; // labels detected in Quadrant line
    biasDirectionPresent: boolean;
  };
  const rows: Row[] = [];

  for (const fix of fixtures) {
    const c = buildInnerConstitution(fix.answers, [], fix.demographics);
    const md = renderMirrorAsMarkdown({
      constitution: c,
      demographics: fix.demographics,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-08T12:00:00Z"),
    });

    // Quadrant line detection: rendered as `- **Quadrant:** {label}`.
    const quadLineMatch = md.match(/^- \*\*Quadrant:\*\* (.+)$/m);
    const quadLineText = quadLineMatch?.[1] ?? "";
    const quadrantLineLabels = QUADRANT_LABELS.filter((l) =>
      quadLineText.includes(l)
    );

    // Bias direction lives on the Direction line: `- **Direction:** Nº (descriptor)`.
    const biasDirectionPresent =
      /^- \*\*Direction:\*\*[^\n]*\b(Goal-leaning|Soul-leaning|balanced)\b/m.test(
        md
      );

    // Risk Form prose: italic line below the bullet list.
    // CC-AIM-CALIBRATION — the renderer prefers `riskFormFromAim.prose`
    // when present (canonical source); accept either reading's prose.
    //
    // CC-LAUNCH-VOICE-POLISH B2 — user-mode strips "(formerly X)"
    // parentheticals from the rendered output, so the engine prose
    // (`renderedProse`) won't match the user-mode markdown verbatim
    // when it carries a parenthetical. Apply the same strip to the
    // expected text before doing the inclusion check.
    const renderedProse = c.riskFormFromAim?.prose ?? c.riskForm?.prose;
    const renderedProseUserMode = renderedProse?.replace(
      /\s*\(formerly [^)]+\)/g,
      ""
    );
    const riskFormProsePresent =
      c.riskForm || c.riskFormFromAim
        ? renderedProseUserMode !== undefined &&
          md.includes(renderedProseUserMode)
        : true;

    rows.push({
      file: fix.file,
      set: fix.set,
      constitution: c,
      markdown: md,
      riskFormLetter: c.riskForm?.letter ?? null,
      quadrantLabel: c.movementQuadrant?.label ?? null,
      arrivedConditionsHold: meetsArrivedConditions(c),
      closingMentionsArrived: md.includes(ARRIVED_PHRASE),
      closingMentionsDefault: md.includes(DEFAULT_PHRASE),
      riskFormProsePresent,
      quadrantLineLabels,
      biasDirectionPresent,
    });
  }

  // 1 — synth-1a-risk-form-letter-present
  const missingLetter = rows.filter(
    (r) =>
      r.constitution.shape_outputs.path.drive &&
      r.constitution.goalSoulMovement &&
      !r.riskFormLetter
  );
  const invalidLetter = rows.filter(
    (r) => r.riskFormLetter && !RISK_FORM_LETTERS.includes(r.riskFormLetter)
  );
  results.push(
    missingLetter.length === 0 && invalidLetter.length === 0
      ? { ok: true, assertion: "synth-1a-risk-form-letter-present" }
      : {
          ok: false,
          assertion: "synth-1a-risk-form-letter-present",
          detail: `missing=${missingLetter.length} invalid=${invalidLetter.length}`,
        }
  );

  // 2 — synth-1a-risk-form-coverage (visibility — pass if all 4 cells
  // are represented; if not, surface the gap honestly without failing).
  const riskFormCounts: Record<RiskFormLetter, number> = {
    "Open-Handed Aim": 0,
    "Grip-Governed": 0,
    "Ungoverned Movement": 0,
    "White-Knuckled Aim": 0,
  };
  for (const r of rows) {
    if (r.riskFormLetter) riskFormCounts[r.riskFormLetter]++;
  }
  const cellsCovered = RISK_FORM_LETTERS.filter(
    (l) => riskFormCounts[l] > 0
  ).length;
  results.push({
    ok: true,
    assertion: "synth-1a-risk-form-coverage",
    detail: `${cellsCovered}/4 cells represented; counts ${RISK_FORM_LETTERS.map(
      (l) => `${l}=${riskFormCounts[l]}`
    ).join(", ")}`,
  });

  // 3 — synth-1a-risk-form-prose-rendered. CC-SYNTHESIS-1-FINISH
  // Section D suppression: when `movementStrength.length === 0`, the
  // Risk Form line is intentionally not rendered (no movement for the
  // governor to govern). Skip the prose-rendered check for those
  // fixtures; require it for the rest.
  const proseFails = rows.filter((r) => {
    if (!r.constitution.riskForm) return false;
    const len =
      r.constitution.goalSoulMovement?.dashboard.movementStrength.length ?? 0;
    if (len === 0) return false; // CC-SYNTHESIS-1-FINISH Section D
    // CC-CRISIS-PATH-PROSE — Risk Form line + prose are intentionally
    // suppressed for crisis-class users (the trajectory framework
    // doesn't apply); skip the prose-rendered check for them.
    if (r.constitution.coherenceReading?.pathClass === "crisis") return false;
    return !r.riskFormProsePresent;
  });
  results.push(
    proseFails.length === 0
      ? { ok: true, assertion: "synth-1a-risk-form-prose-rendered" }
      : {
          ok: false,
          assertion: "synth-1a-risk-form-prose-rendered",
          detail: `Risk Form prose missing in ${proseFails.length} fixture render(s): ${proseFails.map((r) => r.file).join(", ")}`,
        }
  );

  // 4 — synth-1a-quadrant-label-present
  const missingQuadrant = rows.filter(
    (r) => r.constitution.goalSoulMovement && !r.quadrantLabel
  );
  const invalidQuadrant = rows.filter(
    (r) => r.quadrantLabel && !QUADRANT_LABELS.includes(r.quadrantLabel)
  );
  results.push(
    missingQuadrant.length === 0 && invalidQuadrant.length === 0
      ? { ok: true, assertion: "synth-1a-quadrant-label-present" }
      : {
          ok: false,
          assertion: "synth-1a-quadrant-label-present",
          detail: `missing=${missingQuadrant.length} invalid=${invalidQuadrant.length}`,
        }
  );

  // 5 — synth-1a-quadrant-coverage (visibility line; passes by default).
  const quadCounts: Record<MovementQuadrantLabel, number> = {
    Drift: 0,
    Gripping: 0,
    "Work without Presence": 0,
    "Pressed Output": 0,
    "Love without Form": 0,
    "Anxious Caring": 0,
    "Giving / Presence": 0,
    "Strained Integration": 0,
    "Goal-led Presence": 0,
    "Driven Output": 0,
    "Soul-led Presence": 0,
    "Burdened Care": 0,
  };
  for (const r of rows) {
    if (r.quadrantLabel) quadCounts[r.quadrantLabel]++;
  }
  const quadCovered = QUADRANT_LABELS.filter((l) => quadCounts[l] > 0).length;
  results.push({
    ok: true,
    assertion: "synth-1a-quadrant-coverage",
    detail: `${quadCovered}/4 quadrants represented; counts ${QUADRANT_LABELS.map(
      (l) => `${l}=${quadCounts[l]}`
    ).join(", ")}`,
  });

  // 6 — synth-1a-quadrant-replaces-old. Every fixture's Movement section
  // contains exactly one of the four canonical quadrant labels in the
  // Quadrant line (when one renders). The pre-1A "Early Giving" /
  // "Goal-leaning"-as-quadrant composite must NOT appear. The pre-1A
  // labels were "Giving" / "Gripping" — those bare strings should not
  // appear on the Quadrant line itself.
  const quadrantReplaceFails: string[] = [];
  for (const r of rows) {
    if (!r.constitution.movementQuadrant) continue;
    if (r.quadrantLineLabels.length !== 1) {
      quadrantReplaceFails.push(
        `${r.file}: ${r.quadrantLineLabels.length} canonical labels on Quadrant line`
      );
    }
    // The pre-1A composite "Early Giving" or "Goal-leaning" on the
    // Quadrant line is forbidden (bias direction belongs on the
    // Direction line, not Quadrant).
    if (/^- \*\*Quadrant:\*\* [^\n]*Early Giving/m.test(r.markdown)) {
      quadrantReplaceFails.push(`${r.file}: pre-1A "Early Giving" composite still present on Quadrant line`);
    }
  }
  results.push(
    quadrantReplaceFails.length === 0
      ? { ok: true, assertion: "synth-1a-quadrant-replaces-old" }
      : {
          ok: false,
          assertion: "synth-1a-quadrant-replaces-old",
          detail: quadrantReplaceFails.join(" | "),
        }
  );

  // 7 — synth-1a-bias-direction-preserved. The Direction line still
  // names the bias direction (Goal-leaning / Soul-leaning / balanced).
  // CC-CRISIS-PATH-PROSE — Direction line is intentionally suppressed
  // for crisis-class users (the trajectory framework doesn't apply);
  // skip them.
  const biasFails = rows.filter(
    (r) =>
      r.constitution.goalSoulMovement &&
      r.constitution.coherenceReading?.pathClass !== "crisis" &&
      !r.biasDirectionPresent
  );
  results.push(
    biasFails.length === 0
      ? { ok: true, assertion: "synth-1a-bias-direction-preserved" }
      : {
          ok: false,
          assertion: "synth-1a-bias-direction-preserved",
          detail: `bias direction missing in ${biasFails.length} fixture(s): ${biasFails.map((r) => r.file).join(", ")}`,
        }
  );

  // 8 — synth-1a-closing-phrase-default. Fixtures NOT meeting the three
  // arrived conditions must render the default phrase verbatim — but
  // ONLY when the Closing Read GIVE-quadrant template is the one
  // actually emitted (the default phrase only lives in PROSE_TEMPLATES.give).
  const defaultFails: string[] = [];
  for (const r of rows) {
    if (r.arrivedConditionsHold) continue;
    // The default phrase only appears in the "give" quadrant prose
    // template. Other quadrants don't carry the phrase at all.
    if (r.constitution.goalSoulGive?.quadrant === "give") {
      if (!r.closingMentionsDefault) {
        defaultFails.push(
          `${r.file}: GIVE quadrant + arrived conditions unmet, but default phrase missing`
        );
      }
    }
  }
  results.push(
    defaultFails.length === 0
      ? { ok: true, assertion: "synth-1a-closing-phrase-default" }
      : {
          ok: false,
          assertion: "synth-1a-closing-phrase-default",
          detail: defaultFails.join(" | "),
        }
  );

  // 9 — synth-1a-closing-phrase-arrived. Fixtures meeting all three
  // arrived conditions render the arrived phrase verbatim.
  const arrivedFails: string[] = [];
  let arrivedFireCount = 0;
  const arrivedFixtures: string[] = [];
  for (const r of rows) {
    if (!r.arrivedConditionsHold) continue;
    arrivedFireCount++;
    arrivedFixtures.push(r.file);
    if (!r.closingMentionsArrived) {
      arrivedFails.push(`${r.file}: conditions met but arrived phrase missing`);
    }
  }
  results.push(
    arrivedFails.length === 0
      ? {
          ok: true,
          assertion: "synth-1a-closing-phrase-arrived",
          detail: `arrived phrase fired in ${arrivedFireCount}/${rows.length} fixture(s)${arrivedFixtures.length > 0 ? `: ${arrivedFixtures.join(", ")}` : ""}`,
        }
      : {
          ok: false,
          assertion: "synth-1a-closing-phrase-arrived",
          detail: arrivedFails.join(" | "),
        }
  );

  // 10 — synth-1a-closing-phrase-mutually-exclusive. No fixture renders
  // both phrases — substitution is an in-place replacement, not an
  // addition.
  const mutualExFails = rows.filter(
    (r) => r.closingMentionsArrived && r.closingMentionsDefault
  );
  results.push(
    mutualExFails.length === 0
      ? { ok: true, assertion: "synth-1a-closing-phrase-mutually-exclusive" }
      : {
          ok: false,
          assertion: "synth-1a-closing-phrase-mutually-exclusive",
          detail: `both phrases rendered in ${mutualExFails.length} fixture(s): ${mutualExFails.map((r) => r.file).join(", ")}`,
        }
  );

  return results;
}

function main(): number {
  console.log("CC-SYNTHESIS-1A — synthesis-layer-collapse first-pass audit");
  console.log("============================================================");
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
    "AUDIT PASSED — all CC-SYNTHESIS-1A assertions green across cohort."
  );
  return 0;
}

process.exit(main());
