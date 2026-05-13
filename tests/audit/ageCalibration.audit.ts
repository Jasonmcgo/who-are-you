// CC-AGE-CALIBRATION — developmental-band classification audit.
//
// 8 assertions verifying:
//   - bands cover ages 14 → ~200 with no gaps / overlaps
//   - classification is deterministic
//   - edge-detection flags fire at band boundaries
//   - too-young flag fires for ages < 14
//   - missing-age handling is graceful
//   - both LLM SYSTEM_PROMPTs contain the band-register anchor block
//   - LLM input contracts pass band/label/registerHint through
//   - cohort fixtures classify cleanly (observational distribution)
//
// Hand-rolled. Invocation: `npx tsx tests/audit/ageCalibration.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BAND_REGISTER_ANCHOR_BLOCK,
  classifyDevelopmentalBand,
  DEVELOPMENTAL_BANDS,
  extractAgeFromDemographics,
  TOO_YOUNG_AGE,
  type DevelopmentalBand,
} from "../../lib/ageCalibration";
import { buildInnerConstitution } from "../../lib/identityEngine";
import { SYSTEM_PROMPT, buildUserPrompt } from "../../lib/synthesis3Llm";
import { GRIP_SYSTEM_PROMPT, buildGripUserPrompt } from "../../lib/gripTaxonomyLlm";
import { deriveSynthesis3Inputs } from "../../lib/synthesis3Inputs";
import { deriveGripInputs } from "../../lib/gripTaxonomyInputs";
import type { Answer, DemographicSet, InnerConstitution } from "../../lib/types";

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
  demographics: DemographicSet | null;
  constitution: InnerConstitution;
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
      out.push({
        set,
        file: f,
        demographics: raw.demographics ?? null,
        constitution: c,
      });
    }
  }
  return out;
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1. age-calibration-bands-cover-range ────────────────────────────
  // No gaps and no overlaps for ages 14 through the upper bound.
  const sorted = [...DEVELOPMENTAL_BANDS].sort(
    (a, b) => a.ageRange.min - b.ageRange.min
  );
  const coverFails: string[] = [];
  if (sorted[0].ageRange.min !== 14) {
    coverFails.push(`first band starts at ${sorted[0].ageRange.min}, expected 14`);
  }
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.ageRange.max !== cur.ageRange.min) {
      coverFails.push(
        `gap/overlap: ${prev.label} ends ${prev.ageRange.max}, ${cur.label} starts ${cur.ageRange.min}`
      );
    }
  }
  if (sorted[sorted.length - 1].ageRange.max < 100) {
    coverFails.push(
      `last band ends at ${sorted[sorted.length - 1].ageRange.max}; needs open-ended upper bound (>= 100)`
    );
  }
  results.push(
    coverFails.length === 0
      ? {
          ok: true,
          assertion: "age-calibration-bands-cover-range",
          detail: `${sorted.length} bands cover ages 14 → ${sorted[sorted.length - 1].ageRange.max}`,
        }
      : {
          ok: false,
          assertion: "age-calibration-bands-cover-range",
          detail: coverFails.join(" | "),
        }
  );

  // ── 2. age-calibration-deterministic-classification ─────────────────
  const sampleAges = [16, 25, 35, 50, 60, 75];
  const detFails: string[] = [];
  for (const a of sampleAges) {
    const r1 = classifyDevelopmentalBand(a);
    const r2 = classifyDevelopmentalBand(a);
    if (JSON.stringify(r1) !== JSON.stringify(r2)) {
      detFails.push(`age ${a}: r1 != r2`);
    }
  }
  results.push(
    detFails.length === 0
      ? {
          ok: true,
          assertion: "age-calibration-deterministic-classification",
          detail: "same input → same output across all sample ages",
        }
      : {
          ok: false,
          assertion: "age-calibration-deterministic-classification",
          detail: detFails.join(" | "),
        }
  );

  // ── 3. age-calibration-edge-detection ───────────────────────────────
  const edgeChecks: Array<{
    age: number;
    expectedBand: DevelopmentalBand;
    expectedLowerEdge: boolean;
    expectedUpperEdge: boolean;
  }> = [
    // Age 22 — entering Direction (lower edge of Direction)
    { age: 22, expectedBand: "direction", expectedLowerEdge: true, expectedUpperEdge: false },
    // Age 31 — late Direction (upper edge)
    { age: 31, expectedBand: "direction", expectedLowerEdge: false, expectedUpperEdge: true },
    // Age 33 — early Integration (lower edge)
    { age: 33, expectedBand: "integration", expectedLowerEdge: true, expectedUpperEdge: false },
    // Age 50 — middle of Purpose Consolidation (no edge)
    { age: 50, expectedBand: "purpose-consolidation", expectedLowerEdge: false, expectedUpperEdge: false },
    // Age 60 — middle of Stewardship (no edge)
    { age: 60, expectedBand: "stewardship", expectedLowerEdge: false, expectedUpperEdge: false },
  ];
  const edgeFails: string[] = [];
  for (const c of edgeChecks) {
    const reading = classifyDevelopmentalBand(c.age);
    if (!reading) {
      edgeFails.push(`age ${c.age}: classifier returned null`);
      continue;
    }
    if (reading.band !== c.expectedBand) {
      edgeFails.push(`age ${c.age}: band=${reading.band} expected ${c.expectedBand}`);
    }
    if (reading.ageOnLowerEdge !== c.expectedLowerEdge) {
      edgeFails.push(
        `age ${c.age}: lowerEdge=${reading.ageOnLowerEdge} expected ${c.expectedLowerEdge}`
      );
    }
    if (reading.ageOnUpperEdge !== c.expectedUpperEdge) {
      edgeFails.push(
        `age ${c.age}: upperEdge=${reading.ageOnUpperEdge} expected ${c.expectedUpperEdge}`
      );
    }
  }
  results.push(
    edgeFails.length === 0
      ? { ok: true, assertion: "age-calibration-edge-detection" }
      : {
          ok: false,
          assertion: "age-calibration-edge-detection",
          detail: edgeFails.slice(0, 5).join(" | "),
        }
  );

  // ── 4. age-calibration-too-young-flag ───────────────────────────────
  // Build a synthetic constitution with a "2010s" decade (age ~11 in 2026).
  const tooYoungAnswers: Answer[] = [];
  const tooYoungDemo: DemographicSet = {
    answers: [
      { field_id: "age", state: "specified", value: "2010s" },
    ],
  };
  const tooYoungConstitution = buildInnerConstitution(
    tooYoungAnswers,
    [],
    tooYoungDemo
  );
  const tooYoungOk =
    tooYoungConstitution.bandReading === null &&
    tooYoungConstitution.tooYoungForInstrument === true;
  results.push(
    tooYoungOk
      ? {
          ok: true,
          assertion: "age-calibration-too-young-flag",
          detail: "decade=2010s → bandReading=null, tooYoungForInstrument=true",
        }
      : {
          ok: false,
          assertion: "age-calibration-too-young-flag",
          detail: `bandReading=${tooYoungConstitution.bandReading}, tooYoungForInstrument=${tooYoungConstitution.tooYoungForInstrument}`,
        }
  );
  // Sanity check: directly classify age 11.
  const direct11 = classifyDevelopmentalBand(11);
  if (direct11 !== null) {
    results.push({
      ok: false,
      assertion: "age-calibration-too-young-flag (direct)",
      detail: `classifyDevelopmentalBand(11) returned non-null: ${JSON.stringify(direct11)}`,
    });
  }

  // ── 5. age-calibration-missing-age-graceful ─────────────────────────
  // No demographics → bandReading undefined, no error.
  const missingDemoConstitution = buildInnerConstitution([], [], null);
  const missingOk =
    missingDemoConstitution.bandReading === undefined ||
    missingDemoConstitution.bandReading === null;
  // Also check direct extraction returns null on no demographics.
  const noExtract = extractAgeFromDemographics(null);
  results.push(
    missingOk && noExtract === null
      ? {
          ok: true,
          assertion: "age-calibration-missing-age-graceful",
          detail: "missing demographics → bandReading absent, extractAge returns null",
        }
      : {
          ok: false,
          assertion: "age-calibration-missing-age-graceful",
          detail: `bandReading=${missingDemoConstitution.bandReading}, extractAge=${JSON.stringify(noExtract)}`,
        }
  );

  // ── 6. age-calibration-llm-prompts-anchor ───────────────────────────
  const anchorMissing: string[] = [];
  if (!/Developmental band register/i.test(SYSTEM_PROMPT)) {
    anchorMissing.push("synthesis3.SYSTEM_PROMPT");
  }
  if (!/Developmental band register/i.test(GRIP_SYSTEM_PROMPT)) {
    anchorMissing.push("grip.GRIP_SYSTEM_PROMPT");
  }
  // Also confirm both prompts contain the verbatim BAND_REGISTER_ANCHOR_BLOCK.
  if (!SYSTEM_PROMPT.includes(BAND_REGISTER_ANCHOR_BLOCK)) {
    anchorMissing.push("synthesis3: anchor block content drift");
  }
  if (!GRIP_SYSTEM_PROMPT.includes(BAND_REGISTER_ANCHOR_BLOCK)) {
    anchorMissing.push("grip: anchor block content drift");
  }
  results.push(
    anchorMissing.length === 0
      ? {
          ok: true,
          assertion: "age-calibration-llm-prompts-anchor",
          detail: "both prompts contain the band-register anchor block",
        }
      : {
          ok: false,
          assertion: "age-calibration-llm-prompts-anchor",
          detail: anchorMissing.join(" | "),
        }
  );

  // ── 7. age-calibration-llm-input-passes-band ────────────────────────
  // Construct a fixture with a known age and verify both input builders
  // surface band/label/registerHint into the rendered user prompts.
  const sampleConstitution = buildInnerConstitution(
    [],
    [],
    {
      answers: [
        { field_id: "age", state: "specified", value: "1990s" },
      ],
    }
  );
  const synthInputs = deriveSynthesis3Inputs(sampleConstitution);
  const gripInputs = deriveGripInputs(sampleConstitution);
  const inputFails: string[] = [];
  if (!synthInputs.band || !synthInputs.bandLabel || !synthInputs.registerHint) {
    inputFails.push(
      `synth inputs missing band fields (band=${synthInputs.band}, label=${synthInputs.bandLabel}, hint=${synthInputs.registerHint})`
    );
  }
  const synthUserPrompt = buildUserPrompt(synthInputs);
  if (!/Developmental band:/i.test(synthUserPrompt)) {
    inputFails.push("synth user prompt missing 'Developmental band:' line");
  }
  if (!/Band register hint:/i.test(synthUserPrompt)) {
    inputFails.push("synth user prompt missing 'Band register hint:' line");
  }
  if (gripInputs) {
    if (!gripInputs.band || !gripInputs.bandLabel || !gripInputs.registerHint) {
      inputFails.push(
        `grip inputs missing band fields (band=${gripInputs.band}, label=${gripInputs.bandLabel}, hint=${gripInputs.registerHint})`
      );
    }
    const gripUserPrompt = buildGripUserPrompt(gripInputs);
    if (!/Developmental band:/i.test(gripUserPrompt)) {
      inputFails.push("grip user prompt missing 'Developmental band:' line");
    }
    if (!/Band register hint:/i.test(gripUserPrompt)) {
      inputFails.push("grip user prompt missing 'Band register hint:' line");
    }
  }
  results.push(
    inputFails.length === 0
      ? {
          ok: true,
          assertion: "age-calibration-llm-input-passes-band",
          detail: `synth + grip inputs/prompts pass band fields through; sample band=${synthInputs.bandLabel}`,
        }
      : {
          ok: false,
          assertion: "age-calibration-llm-input-passes-band",
          detail: inputFails.join(" | "),
        }
  );

  // ── 8. age-calibration-cohort-classification (observational) ────────
  const cohort = loadCohort();
  const distribution: Record<string, number> = {};
  let cohortAged = 0;
  let cohortMissing = 0;
  for (const r of cohort) {
    const cr = r.constitution.bandReading;
    if (cr) {
      distribution[cr.label] = (distribution[cr.label] ?? 0) + 1;
      cohortAged++;
    } else {
      cohortMissing++;
    }
  }
  results.push({
    ok: true,
    assertion: "age-calibration-cohort-classification",
    detail: `${cohortAged}/${cohort.length} fixtures have age data; distribution=${JSON.stringify(distribution)}; missing=${cohortMissing}`,
  });

  // Diagnostic — non-failing.
  console.log(
    `\nDevelopmental band reference (age=${TOO_YOUNG_AGE}+ → first band):`
  );
  for (const cfg of DEVELOPMENTAL_BANDS) {
    console.log(
      `  ${cfg.label.padEnd(22)} | ${cfg.ageRange.min}–${cfg.ageRange.max === 200 ? "70+" : cfg.ageRange.max - 1}`
    );
  }

  return results;
}

function main(): number {
  console.log("CC-AGE-CALIBRATION — developmental-band classification audit");
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
  console.log("AUDIT PASSED — all CC-AGE-CALIBRATION assertions green.");
  return 0;
}

process.exit(main());
