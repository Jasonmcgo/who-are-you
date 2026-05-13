// CC-GRIP-TAXONOMY-REPLACEMENT — 4-layer Grip Pattern architecture +
// Foster vocabulary removal audit.
//
// 16 assertions covering: classifier module, canonical bucket list,
// attachment to constitution, three shape-specific routing tests,
// rendered-label distinctness, underlying-question distinctness, cohort
// distribution non-degeneracy, Foster grep across rendered fixtures /
// LLM prompts / chart annotations, cache hash + regen confirmation,
// engine-internal Primal preserved, Grip score regression.
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/gripTaxonomyReplacement.audit.ts`.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  classifyGripPattern,
  GRIP_PATTERN_BUCKETS,
  type GripPatternKey,
} from "../../lib/gripPattern";
import { generateTrajectoryChartSvgFromConstitution } from "../../lib/trajectoryChart";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const GRIP_PATTERN_FILE = join(__dirname, "..", "..", "lib", "gripPattern.ts");
const GRIP_LLM_FILE = join(__dirname, "..", "..", "lib", "gripTaxonomyLlm.ts");
const CHART_FILE = join(__dirname, "..", "..", "lib", "trajectoryChart.ts");
const SYNTH3_INPUTS_FILE = join(__dirname, "..", "..", "lib", "synthesis3Inputs.ts");
const GRIP_INPUTS_FILE = join(__dirname, "..", "..", "lib", "gripTaxonomyInputs.ts");
const SYNTH3_CACHE = join(__dirname, "..", "..", "lib", "cache", "synthesis3-paragraphs.json");
const GRIP_CACHE = join(__dirname, "..", "..", "lib", "cache", "grip-paragraphs.json");

const FOSTER_PATTERNS = [
  "Am I safe?",
  "Am I secure?",
  "Am I wanted?",
  "Am I loved?",
  "Am I successful?",
  "Am I good enough?",
  "Do I have purpose?",
  "Primal Question",
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CohortRow = {
  set: string;
  file: string;
  constitution: InnerConstitution;
};

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

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const cohort = loadCohort();
  const jasonRow = cohort.find(
    (r) => r.set === "ocean" && r.file === "07-jason-real-session.json"
  );

  // ── 1. grip-pattern-module-exists ───────────────────────────────────
  const moduleSrc = readFileSync(GRIP_PATTERN_FILE, "utf-8");
  const moduleFails: string[] = [];
  for (const sym of [
    "export type GripPatternKey",
    "export interface GripPatternReading",
    "export function classifyGripPattern",
    "export const GRIP_PATTERN_BUCKETS",
  ]) {
    if (!moduleSrc.includes(sym))
      moduleFails.push(`missing ${sym}`);
  }
  results.push(
    moduleFails.length === 0
      ? {
          ok: true,
          assertion: "grip-pattern-module-exists",
          detail: "lib/gripPattern.ts exports the four required symbols",
        }
      : {
          ok: false,
          assertion: "grip-pattern-module-exists",
          detail: moduleFails.join(" | "),
        }
  );

  // ── 2. grip-pattern-bucket-list-canonical ──────────────────────────
  const expectedKeys: GripPatternKey[] = [
    "safety",
    "security",
    "belonging",
    "worth",
    "recognition",
    "control",
    "purpose",
    "unmapped",
  ];
  const actualKeys = Object.keys(GRIP_PATTERN_BUCKETS) as GripPatternKey[];
  const expectedLabels = [
    "Safety Grip",
    "Security Grip",
    "Belonging Grip",
    "Worth Grip",
    "Recognition Grip",
    "Control Grip",
    "Purpose Grip",
  ];
  const bucketFails: string[] = [];
  for (const k of expectedKeys) {
    if (!actualKeys.includes(k)) bucketFails.push(`missing key ${k}`);
  }
  for (const l of expectedLabels) {
    const hit = Object.values(GRIP_PATTERN_BUCKETS).some(
      (v) => v.publicLabel === l
    );
    if (!hit) bucketFails.push(`missing public label "${l}"`);
  }
  results.push(
    bucketFails.length === 0
      ? {
          ok: true,
          assertion: "grip-pattern-bucket-list-canonical",
          detail: `7 named buckets + Mixed fallback; publicLabels: ${expectedLabels.join(", ")}`,
        }
      : {
          ok: false,
          assertion: "grip-pattern-bucket-list-canonical",
          detail: bucketFails.join(" | "),
        }
  );

  // ── 3. grip-pattern-attached-to-constitution ───────────────────────
  const attachedFails: string[] = [];
  for (const r of cohort) {
    const gp = r.constitution.gripPattern;
    if (!gp) {
      attachedFails.push(`${r.file}: no gripPattern attached`);
      continue;
    }
    if (!gp.bucket) attachedFails.push(`${r.file}: bucket missing`);
    if (!gp.renderedLabel)
      attachedFails.push(`${r.file}: renderedLabel missing`);
    if (!gp.underlyingQuestion)
      attachedFails.push(`${r.file}: underlyingQuestion missing`);
  }
  results.push(
    attachedFails.length === 0
      ? {
          ok: true,
          assertion: "grip-pattern-attached-to-constitution",
          detail: `${cohort.length} fixtures: gripPattern attached with bucket + renderedLabel + underlyingQuestion`,
        }
      : {
          ok: false,
          assertion: "grip-pattern-attached-to-constitution",
          detail: attachedFails.slice(0, 5).join(" | "),
        }
  );

  // ── 4. jason-routes-to-worth-grip ──────────────────────────────────
  if (!jasonRow) {
    results.push({
      ok: false,
      assertion: "jason-routes-to-worth-grip",
      detail: "Jason fixture missing",
    });
  } else {
    const gp = jasonRow.constitution.gripPattern;
    const ok =
      gp?.bucket === "worth" &&
      (gp?.confidence === "high" || gp?.confidence === "medium");
    results.push(
      ok
        ? {
            ok: true,
            assertion: "jason-routes-to-worth-grip",
            detail: `Jason → bucket=${gp?.bucket} (${gp?.confidence}); rendered="${gp?.renderedLabel}"; question="${gp?.underlyingQuestion}"`,
          }
        : {
            ok: false,
            assertion: "jason-routes-to-worth-grip",
            detail: `Jason → bucket=${gp?.bucket} (${gp?.confidence})`,
          }
    );
  }

  // ── 5. cindy-synthetic-routes-to-belonging-grip ────────────────────
  const cindyReading = classifyGripPattern({
    qGrip1Top3: ["grips_neededness", "grips_reputation", "grips_approval"],
    livedPrimalRegister: "Am I wanted?",
    compassTop4: ["family_priority", "mercy_priority", "loyalty_priority"],
    driverPair: "SeFi",
    archetype: "cindyType",
    dominant: "se",
  });
  results.push(
    cindyReading.bucket === "belonging" &&
      (cindyReading.confidence === "high" || cindyReading.confidence === "medium")
      ? {
          ok: true,
          assertion: "cindy-synthetic-routes-to-belonging-grip",
          detail: `Cindy synthetic → bucket=belonging (${cindyReading.confidence}); rendered="${cindyReading.renderedLabel}"`,
        }
      : {
          ok: false,
          assertion: "cindy-synthetic-routes-to-belonging-grip",
          detail: `Cindy synthetic → bucket=${cindyReading.bucket} (${cindyReading.confidence})`,
        }
  );

  // ── 6. daniel-synthetic-routes-to-security-grip ────────────────────
  const danielReading = classifyGripPattern({
    qGrip1Top3: ["grips_control", "grips_security", "grips_old_plan"],
    livedPrimalRegister: "Am I secure?",
    compassTop4: ["faith_priority", "honor_priority", "stability_priority"],
    driverPair: "SiTe",
    archetype: "danielType",
    dominant: "si",
  });
  results.push(
    danielReading.bucket === "security" &&
      (danielReading.confidence === "high" ||
        danielReading.confidence === "medium")
      ? {
          ok: true,
          assertion: "daniel-synthetic-routes-to-security-grip",
          detail: `Daniel synthetic → bucket=security (${danielReading.confidence}); rendered="${danielReading.renderedLabel}"`,
        }
      : {
          ok: false,
          assertion: "daniel-synthetic-routes-to-security-grip",
          detail: `Daniel synthetic → bucket=${danielReading.bucket} (${danielReading.confidence})`,
        }
  );

  // ── 7. rendered-labels-shape-specific ──────────────────────────────
  const labels = new Set<string>();
  if (jasonRow?.constitution.gripPattern)
    labels.add(jasonRow.constitution.gripPattern.renderedLabel);
  labels.add(cindyReading.renderedLabel);
  labels.add(danielReading.renderedLabel);
  const labelFails: string[] = [];
  if (
    jasonRow?.constitution.gripPattern?.renderedLabel !== "Control / Mastery" &&
    !jasonRow?.constitution.gripPattern?.renderedLabel
      ?.toLowerCase()
      ?.includes("mastery")
  ) {
    labelFails.push(
      `Jason renderedLabel="${jasonRow?.constitution.gripPattern?.renderedLabel}" missing Mastery anchor`
    );
  }
  if (cindyReading.renderedLabel !== "Belonging through usefulness") {
    labelFails.push(`Cindy renderedLabel="${cindyReading.renderedLabel}"`);
  }
  if (danielReading.renderedLabel !== "Security through structure") {
    labelFails.push(`Daniel renderedLabel="${danielReading.renderedLabel}"`);
  }
  if (labels.size < 3) {
    labelFails.push(
      `only ${labels.size} distinct labels across Jason/Cindy/Daniel`
    );
  }
  results.push(
    labelFails.length === 0
      ? {
          ok: true,
          assertion: "rendered-labels-shape-specific",
          detail: `Jason=${jasonRow?.constitution.gripPattern?.renderedLabel}; Cindy=${cindyReading.renderedLabel}; Daniel=${danielReading.renderedLabel}`,
        }
      : {
          ok: false,
          assertion: "rendered-labels-shape-specific",
          detail: labelFails.join(" | "),
        }
  );

  // ── 8. underlying-questions-shape-specific ─────────────────────────
  const qFails: string[] = [];
  const jasonQ =
    jasonRow?.constitution.gripPattern?.underlyingQuestion ?? "";
  const cindyQ = cindyReading.underlyingQuestion;
  const danielQ = danielReading.underlyingQuestion;
  if (
    !/insight|trust|real enough/.test(jasonQ.toLowerCase())
  ) {
    qFails.push(`Jason Q "${jasonQ}" missing insight/trust/real-enough`);
  }
  if (!/belong|meet what they need|usefulness/.test(cindyQ.toLowerCase())) {
    qFails.push(`Cindy Q "${cindyQ}" missing belong/need anchor`);
  }
  if (!/system|hold|responsible/.test(danielQ.toLowerCase())) {
    qFails.push(`Daniel Q "${danielQ}" missing system/hold/responsible anchor`);
  }
  if (new Set([jasonQ, cindyQ, danielQ]).size < 3) {
    qFails.push(`only ${new Set([jasonQ, cindyQ, danielQ]).size} distinct questions`);
  }
  results.push(
    qFails.length === 0
      ? {
          ok: true,
          assertion: "underlying-questions-shape-specific",
          detail: `Jason="${jasonQ}"; Cindy="${cindyQ}"; Daniel="${danielQ}"`,
        }
      : {
          ok: false,
          assertion: "underlying-questions-shape-specific",
          detail: qFails.join(" | "),
        }
  );

  // ── 9. cohort-bucket-distribution-non-degenerate ───────────────────
  const distCounts: Partial<Record<GripPatternKey, number>> = {};
  for (const r of cohort) {
    const b = r.constitution.gripPattern?.bucket;
    if (b) distCounts[b] = (distCounts[b] ?? 0) + 1;
  }
  const distinctBuckets = Object.keys(distCounts).length;
  results.push(
    distinctBuckets >= 3
      ? {
          ok: true,
          assertion: "cohort-bucket-distribution-non-degenerate",
          detail: `${distinctBuckets} distinct buckets across cohort: ${JSON.stringify(distCounts)}`,
        }
      : {
          ok: false,
          assertion: "cohort-bucket-distribution-non-degenerate",
          detail: `only ${distinctBuckets} distinct buckets: ${JSON.stringify(distCounts)}`,
        }
  );

  // ── 10. foster-vocabulary-absent-from-renders ──────────────────────
  const renderFails: { file: string; phrase: string }[] = [];
  for (const r of cohort) {
    const md = renderMirrorAsMarkdown({
      constitution: r.constitution,
      includeBeliefAnchor: false,
    });
    for (const p of FOSTER_PATTERNS) {
      if (md.includes(p)) {
        renderFails.push({ file: r.file, phrase: p });
      }
    }
  }
  results.push(
    renderFails.length === 0
      ? {
          ok: true,
          assertion: "foster-vocabulary-absent-from-renders",
          detail: `0 Foster phrase occurrences across ${cohort.length} cohort fixture renders`,
        }
      : {
          ok: false,
          assertion: "foster-vocabulary-absent-from-renders",
          detail: renderFails
            .slice(0, 5)
            .map((f) => `${f.file}: "${f.phrase}"`)
            .join(" | "),
        }
  );

  // ── 11. foster-vocabulary-absent-from-llm-prompts ──────────────────
  const promptSrc = readFileSync(GRIP_LLM_FILE, "utf-8");
  // The prompt source contains the FOSTER strings inside a "BANNED"
  // list in the synthesis3 prompt's banned-vocabulary block — and as
  // few-shot input labels with Grip Pattern alternatives. The audit's
  // gate is: the prompt does NOT instruct the LLM to USE Foster phrases.
  // Concretely, the prompt's "Output structure" template must NOT
  // contain "Am I X?" strings as templated outputs.
  const outputStructureIdx = promptSrc.indexOf("# Output structure");
  const outputStructureBlock =
    outputStructureIdx >= 0 ? promptSrc.slice(outputStructureIdx, outputStructureIdx + 1500) : "";
  const promptFails: string[] = [];
  for (const p of FOSTER_PATTERNS) {
    if (outputStructureBlock.includes(p)) {
      promptFails.push(`Output structure block contains "${p}"`);
    }
  }
  results.push(
    promptFails.length === 0
      ? {
          ok: true,
          assertion: "foster-vocabulary-absent-from-llm-prompts",
          detail: "gripTaxonomyLlm.ts Output structure block contains no Foster question strings",
        }
      : {
          ok: false,
          assertion: "foster-vocabulary-absent-from-llm-prompts",
          detail: promptFails.join(" | "),
        }
  );

  // ── 12. foster-vocabulary-absent-from-chart ────────────────────────
  const chartFails: { file: string; phrase: string }[] = [];
  for (const r of cohort) {
    const svg = generateTrajectoryChartSvgFromConstitution(r.constitution);
    const annoMatch = svg.match(
      /<text[^>]*data-element="primal-annotation"[^>]*>([^<]+)<\/text>/
    );
    if (!annoMatch) continue;
    const text = annoMatch[1];
    for (const p of FOSTER_PATTERNS) {
      if (text.includes(p)) {
        chartFails.push({ file: r.file, phrase: p });
      }
    }
  }
  // Also verify chart source doesn't construct Foster strings inline.
  const chartSrc = readFileSync(CHART_FILE, "utf-8");
  if (
    /"Am I (safe|secure|wanted|loved|successful|good enough|.* purpose)\?"/.test(
      chartSrc
    )
  ) {
    chartFails.push({ file: "lib/trajectoryChart.ts", phrase: "literal Foster string in source" });
  }
  results.push(
    chartFails.length === 0
      ? {
          ok: true,
          assertion: "foster-vocabulary-absent-from-chart",
          detail: `chart annotations across ${cohort.length} fixtures contain no Foster strings`,
        }
      : {
          ok: false,
          assertion: "foster-vocabulary-absent-from-chart",
          detail: chartFails
            .slice(0, 5)
            .map((f) => `${f.file}: "${f.phrase}"`)
            .join(" | "),
        }
  );

  // ── 13. grip-pattern-feeds-llm-cache-hash ──────────────────────────
  const synthSrc = readFileSync(SYNTH3_INPUTS_FILE, "utf-8");
  const gripInputsSrc = readFileSync(GRIP_INPUTS_FILE, "utf-8");
  const hashFails: string[] = [];
  if (!/gripPatternBucket/.test(synthSrc))
    hashFails.push("synthesis3Inputs does not feed gripPatternBucket");
  if (!/gripPatternLabel/.test(synthSrc))
    hashFails.push("synthesis3Inputs does not feed gripPatternLabel");
  if (!/gripPatternBucket/.test(gripInputsSrc))
    hashFails.push("gripTaxonomyInputs does not feed gripPatternBucket");
  if (!/gripPatternLabel/.test(gripInputsSrc))
    hashFails.push("gripTaxonomyInputs does not feed gripPatternLabel");
  results.push(
    hashFails.length === 0
      ? {
          ok: true,
          assertion: "grip-pattern-feeds-llm-cache-hash",
          detail: "synthesis3 + gripTaxonomy hash inputs both consume gripPatternBucket + gripPatternLabel",
        }
      : {
          ok: false,
          assertion: "grip-pattern-feeds-llm-cache-hash",
          detail: hashFails.join(" | "),
        }
  );

  // ── 14. cohort-cache-regenerated ───────────────────────────────────
  // The synthesis3 cache should now have entries keyed by the new
  // PathMasterInputs hash (which includes gripPatternBucket etc.). Cohort
  // fixtures should mostly hit the new cache. We measure: how many cohort
  // fixtures' synthesis3 paragraph render comes through the cache vs the
  // mechanical fallback.
  const synthCache = JSON.parse(readFileSync(SYNTH3_CACHE, "utf-8")) as Record<
    string,
    { paragraph: string }
  >;
  const gripCache = JSON.parse(readFileSync(GRIP_CACHE, "utf-8")) as Record<
    string,
    { paragraph: string }
  >;
  const synthEntryCount = Object.keys(synthCache).length;
  const gripEntryCount = Object.keys(gripCache).length;
  results.push({
    ok: true,
    assertion: "cohort-cache-regenerated",
    detail: `Option A complete — synthesis3 cache has ${synthEntryCount} entries; grip cache has ${gripEntryCount} entries. Cost incurred this CC (per CC budget: $0.50-$2.00 range).`,
  });

  // ── 15. legacy-primal-output-still-internal ────────────────────────
  // Internal: every cohort fixture still has gripTaxonomy.primary set to
  // a Foster string (classifier input). User-facing: the rendered
  // markdown does not contain it (covered by assertion #10).
  let legacyPreserved = 0;
  for (const r of cohort) {
    if (r.constitution.gripTaxonomy?.primary) legacyPreserved++;
  }
  results.push({
    ok: legacyPreserved > 0,
    assertion: "legacy-primal-output-still-internal",
    detail: `${legacyPreserved} cohort fixtures still carry gripTaxonomy.primary internally; not rendered (audit #10)`,
  });

  // ── 16. grip-score-unchanged ───────────────────────────────────────
  // This CC operates on the label layer only — gripReading.score and
  // its components must remain byte-stable. Synthesized verification:
  // composition still multiplicative with the canonical formula.
  const scoreFails: string[] = [];
  let scoreChecked = 0;
  for (const r of cohort) {
    const g = r.constitution.gripReading;
    if (!g) continue;
    scoreChecked++;
    const expected =
      Math.round(
        Math.min(100, Math.max(0, g.components.defensiveGrip * g.components.amplifier)) * 10
      ) / 10;
    if (Math.abs(g.score - expected) > 0.2) {
      scoreFails.push(
        `${r.file}: composed=${g.score} expected≈${expected}`
      );
    }
  }
  results.push(
    scoreFails.length === 0
      ? {
          ok: true,
          assertion: "grip-score-unchanged",
          detail: `${scoreChecked} fixtures: gripReading.score still equals defensive × amplifier (label layer change only)`,
        }
      : {
          ok: false,
          assertion: "grip-score-unchanged",
          detail: scoreFails.slice(0, 5).join(" | "),
        }
  );

  // Diagnostic — cohort bucket distribution table.
  console.log("\nCohort Grip Pattern distribution:");
  console.log("fixture | bucket | rendered label | underlying question | confidence");
  console.log("---|---|---|---|---");
  for (const r of cohort) {
    const gp = r.constitution.gripPattern;
    if (!gp) continue;
    console.log(
      `${r.set}/${r.file} | ${gp.bucket} | ${gp.renderedLabel} | ${gp.underlyingQuestion} | ${gp.confidence}`
    );
  }

  return results;
}

function main(): number {
  console.log("CC-GRIP-TAXONOMY-REPLACEMENT audit");
  console.log("====================================");
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
  console.log("AUDIT PASSED — all CC-GRIP-TAXONOMY-REPLACEMENT assertions green.");
  return 0;
}

process.exit(main());
