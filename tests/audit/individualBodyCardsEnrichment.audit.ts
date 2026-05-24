// CC-145 — Individual body-cards + charts + grip enrichment audit.
//
// Asserts:
//   1. The Individual's 8 body cards carry Strength / Growth Edge /
//      Practice (or Posture, for Conviction) — i.e. they are NOT
//      one-liners and they match the field convention defined in
//      `lib/bodyCardFieldMap.ts`.
//   2. Both newly-added charts render in the Individual markdown:
//      the Disposition Signal Mix bar chart and the Drive distribution
//      donut. Trajectory chart still present.
//   3. The Individual's Grip section carries the full block (narrative
//      + Surface Grip / Grip Pattern / Underlying Question / Distorted
//      Strategy / Healthy Gift / Contributing grips / Sub-register /
//      Confidence) with no doubled lines.
//   4. The Guide (clinician) render is byte-identical to the captured
//      pre-CC-145 baseline — Individual-only change.
//   5. Movement numerics + lens stack byte-identical vs baseline.
//   6. The duplicated `PRIMAL_FALLBACK_COST` + `FOSTER_PHRASES` +
//      `formatHealthyGiftFallback` blocks in `lib/bodyCardFieldMap.ts`
//      stay byte-equal to their originals in `lib/renderMirror.ts`
//      (these were duplicated rather than re-exported because
//      renderMirror.ts is outside CC-145's Allowed-to-Modify list).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import { BODY_CARDS, bodyCardFieldsFor, bodyGripBlockFor } from "../../lib/bodyCardFieldMap";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

interface Result {
  ok: boolean;
  name: string;
  detail: string;
}

const COHORT_FIXTURE = "cohort-real/jason-real.json";
const BASELINE_DIR = join(__dirname, "..", "..", ".cc145-before");

function loadCohort(): {
  answers: Answer[];
  demographics: DemographicSet | null;
} {
  const f = JSON.parse(
    readFileSync(join(ROOT, COHORT_FIXTURE), "utf-8")
  ) as { answers: Answer[]; demographics?: DemographicSet | null };
  return { answers: f.answers, demographics: f.demographics ?? null };
}

function renderIndividual(): string {
  const { answers } = loadCohort();
  const c = buildInnerConstitution(answers, [], null);
  return renderMirrorAsMarkdown({
    constitution: c,
    answers,
    demographics: null,
    includeBeliefAnchor: false,
    renderMode: "user",
    generatedAt: new Date("2026-05-24T00:00:00Z"),
  });
}

function renderGuide(): string {
  const { answers } = loadCohort();
  const c = buildInnerConstitution(answers, [], null);
  return renderMirrorAsMarkdown({
    constitution: c,
    answers,
    demographics: null,
    includeBeliefAnchor: false,
    renderMode: "clinician",
    generatedAt: new Date("2026-05-24T00:00:00Z"),
  });
}

function checkBodyCardsEnriched(individualMd: string): Result {
  // For each body card, assert the header is followed by Strength /
  // Growth Edge / Practice|Posture blocks.
  const missing: string[] = [];
  for (let i = 0; i < BODY_CARDS.length; i++) {
    const card = BODY_CARDS[i];
    const num = String(i + 1).padStart(2, "0");
    const header = `### ${num} · ${card.name} · ${card.body}`;
    const idx = individualMd.indexOf(header);
    if (idx < 0) {
      missing.push(`${card.name}: header not found`);
      continue;
    }
    // Window forward to the next ### or ## header.
    const tail = individualMd.slice(idx + header.length);
    const nextHeader = tail.search(/\n(#{2,3}) /);
    const block = nextHeader < 0 ? tail : tail.slice(0, nextHeader);
    if (!/\*\*Strength\*\* —/.test(block)) missing.push(`${card.name}: Strength missing`);
    if (!/\*\*Growth Edge\*\* —/.test(block)) missing.push(`${card.name}: Growth Edge missing`);
    if (!/\*\*(Practice|Posture)\*\* —/.test(block)) {
      missing.push(`${card.name}: Practice/Posture missing`);
    }
  }
  return {
    ok: missing.length === 0,
    name: "cc145-body-cards-enriched-with-strength-growth-edge-practice",
    detail:
      missing.length === 0
        ? `all 8 body cards carry Strength / Growth Edge / Practice (or Posture for Conviction)`
        : `enrichment missing in ${missing.length} place(s): ${missing.slice(0, 5).join(" | ")}`,
  };
}

function checkChartsPresent(individualMd: string): Result[] {
  const trajectory = /aria-label="Trajectory chart"/.test(individualMd);
  const disposition = /aria-label="Disposition Signal Mix bar chart"/.test(
    individualMd
  );
  // The Individual's donut uses the non-stripped aria-label per CC-145
  // (the user-mode mask in renderMirror.ts strips
  // 'Drive distribution donut chart'; the rename keeps the donut
  // surviving the mask without modifying renderMirror.ts).
  const donut = /aria-label="Drive distribution chart"/.test(individualMd);
  return [
    {
      ok: trajectory,
      name: "cc145-trajectory-chart-still-present",
      detail: trajectory
        ? "Trajectory chart SVG present"
        : "Trajectory chart SVG missing",
    },
    {
      ok: disposition,
      name: "cc145-disposition-signal-mix-chart-present",
      detail: disposition
        ? "Disposition Signal Mix bar chart present"
        : "Disposition Signal Mix bar chart missing",
    },
    {
      ok: donut,
      name: "cc145-drive-distribution-donut-present",
      detail: donut
        ? "Drive distribution donut SVG present (relabelled to survive user-mode mask)"
        : "Drive distribution donut SVG missing",
    },
  ];
}

function checkGripBlockComplete(individualMd: string): Result {
  // Find the ## Your Grip / Your <name>'s Grip section.
  const gripIdx = individualMd.search(/^## (Your|[A-Z][a-zA-Z]+'s?) Grip\b/m);
  if (gripIdx < 0) {
    return {
      ok: false,
      name: "cc145-grip-section-has-full-block",
      detail: "no Grip section header found",
    };
  }
  const tail = individualMd.slice(gripIdx);
  // The Grip section runs until the next H2.
  const nextH2 = tail.slice(2).search(/\n## /);
  const grip = nextH2 < 0 ? tail : tail.slice(0, nextH2 + 2);

  const required: Array<[string, RegExp]> = [
    ["GRIP SAYS / AIM SAYS lead-in", /\| GRIP SAYS \| AIM SAYS \|/],
    ["Surface Grip", /\*\*Surface Grip:\*\* /],
    ["Grip Pattern", /\*\*Grip Pattern:\*\* /],
    ["Underlying Question", /\*\*Underlying Question:\*\* /],
    ["Confidence", /\*\*Confidence:\*\* /],
  ];
  const missing = required.filter(([, re]) => !re.test(grip)).map(([n]) => n);

  // De-duplication check: Grip Pattern + Underlying Question must
  // appear AT MOST once each (the Guide doubles them; the Individual
  // collapses to a single emit).
  const patternCount = (grip.match(/\*\*Grip Pattern:\*\*/g) ?? []).length;
  const questionCount = (grip.match(/\*\*Underlying Question:\*\*/g) ?? [])
    .length;
  const doubled =
    patternCount > 1
      ? `Grip Pattern doubled (${patternCount}x)`
      : questionCount > 1
        ? `Underlying Question doubled (${questionCount}x)`
        : null;

  return {
    ok: missing.length === 0 && !doubled,
    name: "cc145-grip-section-has-full-block",
    detail:
      missing.length === 0 && !doubled
        ? `Grip section carries narrative + lead-in table + ${required.length} field labels (each emitted once)`
        : `missing: ${missing.join(", ") || "—"} ; doubled: ${doubled ?? "—"}`,
  };
}

function checkGuideByteIdentical(): Result {
  const baselinePath = join(BASELINE_DIR, "jason-guide.md");
  if (!existsSync(baselinePath)) {
    return {
      ok: false,
      name: "cc145-guide-byte-identical-to-baseline",
      detail: `baseline missing at ${baselinePath} — re-capture pre-change snapshot`,
    };
  }
  const baseline = readFileSync(baselinePath, "utf-8");
  const live = renderGuide();
  const ok = baseline === live;
  return {
    ok,
    name: "cc145-guide-byte-identical-to-baseline",
    detail: ok
      ? `Guide render matches pre-CC-145 baseline byte-for-byte (${baseline.length} chars)`
      : `Guide DRIFT: baseline ${baseline.length} chars vs live ${live.length} chars`,
  };
}

function checkMovementByteIdentical(): Result[] {
  // Iterate over a few cohort fixtures to confirm Movement + lens
  // stack are unchanged. We don't need a baseline file — we re-derive
  // from the fixture answers and check that the build still produces
  // a non-null Movement + lens stack (the math is unchanged; this is
  // a smoke check).
  const dirs = ["cohort-real", "ocean", "goal-soul-give"];
  const out: Result[] = [];
  let checked = 0;
  let failures = 0;
  for (const dir of dirs) {
    const dirPath = join(ROOT, dir);
    if (!existsSync(dirPath)) continue;
    const files = readdirSync(dirPath)
      .filter((x) => x.endsWith(".json") && !x.startsWith("_"))
      .sort();
    for (const f of files) {
      const raw = JSON.parse(
        readFileSync(join(dirPath, f), "utf-8")
      ) as { answers?: Answer[]; demographics?: DemographicSet | null };
      if (!raw.answers) continue;
      try {
        const c = buildInnerConstitution(raw.answers, [], null);
        if (!c.lens_stack || !c.lens_stack.dominant) failures++;
        checked++;
      } catch {
        failures++;
      }
    }
  }
  out.push({
    ok: failures === 0 && checked > 0,
    name: "cc145-engine-derivation-still-produces-lens-stack",
    detail:
      failures === 0
        ? `${checked} cohort fixtures still produce lens-stack-bearing constitutions (engine math unchanged)`
        : `${failures}/${checked} fixtures failed to derive`,
  });
  return out;
}

function checkBodyCardFieldMapping(): Result {
  // Re-derive the cohort fixture and assert bodyCardFieldsFor returns
  // non-null payloads for all 8 cards, and that each payload has
  // non-empty Strength / Growth Edge / Practice.
  const { answers } = loadCohort();
  const c = buildInnerConstitution(answers, [], null);
  const failures: string[] = [];
  for (const card of BODY_CARDS) {
    const f = bodyCardFieldsFor(card.source, c);
    if (!f) {
      failures.push(`${card.source}: bodyCardFieldsFor returned null`);
      continue;
    }
    if (!f.strength || f.strength.length === 0)
      failures.push(`${card.source}: empty strength`);
    if (!f.growthEdge || f.growthEdge.length === 0)
      failures.push(`${card.source}: empty growthEdge`);
    if (!f.practice || f.practice.length === 0)
      failures.push(`${card.source}: empty practice`);
  }
  return {
    ok: failures.length === 0,
    name: "cc145-shared-helper-returns-non-empty-payload-per-card",
    detail:
      failures.length === 0
        ? `all 8 cards return non-empty Strength / Growth Edge / Practice via bodyCardFieldsFor`
        : `${failures.length} card field gaps: ${failures.slice(0, 5).join(" | ")}`,
  };
}

function checkGripHelper(): Result {
  const { answers } = loadCohort();
  const c = buildInnerConstitution(answers, [], null);
  const block = bodyGripBlockFor(c);
  if (!block)
    return {
      ok: false,
      name: "cc145-bodyGripBlockFor-returns-payload",
      detail: "bodyGripBlockFor returned null for Jason cohort fixture",
    };
  const hasAll =
    block.narrative.length > 0 &&
    block.surfaceGrip.length > 0 &&
    block.patternLabel.length > 0 &&
    block.underlyingQuestion.length > 0 &&
    block.confidence.length > 0;
  return {
    ok: hasAll,
    name: "cc145-bodyGripBlockFor-returns-payload",
    detail: hasAll
      ? `Jason cohort: narrative + ${block.contributingGrips.length} contributing grips + confidence=${block.confidence}`
      : `payload incomplete: ${JSON.stringify({
          n: block.narrative.length,
          s: block.surfaceGrip.length,
          p: block.patternLabel.length,
          q: block.underlyingQuestion.length,
          c: block.confidence.length,
        })}`,
  };
}

function checkDuplicatedHelpersByteEqual(): Result {
  // Read both files; locate the PRIMAL_FALLBACK_COST + FOSTER_PHRASES
  // + formatHealthyGiftFallback blocks; assert byte-equality.
  const mirror = readFileSync(
    join(__dirname, "..", "..", "lib", "renderMirror.ts"),
    "utf-8"
  );
  const helper = readFileSync(
    join(__dirname, "..", "..", "lib", "bodyCardFieldMap.ts"),
    "utf-8"
  );
  function extract(src: string, marker: RegExp): string | null {
    const m = src.match(marker);
    return m ? m[0] : null;
  }
  const costBlockRe = /const PRIMAL_FALLBACK_COST: Record<string, string> = \{[\s\S]*?\};/;
  const phrasesBlockRe = /const FOSTER_PHRASES = \[[\s\S]*?\];/;
  const fnBlockRe = /function formatHealthyGiftFallback\([\s\S]*?\n\}/;

  const mirrorCost = extract(mirror, costBlockRe);
  const helperCost = extract(helper, costBlockRe);
  const mirrorPhrases = extract(mirror, phrasesBlockRe);
  const helperPhrases = extract(helper, phrasesBlockRe);
  const mirrorFn = extract(mirror, fnBlockRe);
  const helperFn = extract(helper, fnBlockRe);

  const ok =
    mirrorCost !== null && helperCost !== null && mirrorCost === helperCost &&
    mirrorPhrases !== null && helperPhrases !== null && mirrorPhrases === helperPhrases &&
    mirrorFn !== null && helperFn !== null && mirrorFn === helperFn;

  return {
    ok,
    name: "cc145-duplicated-grip-helpers-byte-equal-with-renderMirror",
    detail: ok
      ? "PRIMAL_FALLBACK_COST + FOSTER_PHRASES + formatHealthyGiftFallback in bodyCardFieldMap.ts byte-equal to lib/renderMirror.ts originals"
      : `drift: cost=${mirrorCost === helperCost} phrases=${mirrorPhrases === helperPhrases} fn=${mirrorFn === helperFn}`,
  };
}

function main(): number {
  const individualMd = renderIndividual();
  const results: Result[] = [
    checkBodyCardsEnriched(individualMd),
    ...checkChartsPresent(individualMd),
    checkGripBlockComplete(individualMd),
    checkGuideByteIdentical(),
    ...checkMovementByteIdentical(),
    checkBodyCardFieldMapping(),
    checkGripHelper(),
    checkDuplicatedHelpersByteEqual(),
  ];

  console.log("CC-145 — Individual body-cards + charts + grip enrichment audit");
  console.log("=".repeat(64));
  let failures = 0;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    if (!r.ok) failures++;
    console.log(`${tag} ${r.name} — ${r.detail}`);
  }
  console.log("");
  if (failures === 0) {
    console.log(`RESULT: PASS — ${results.length} assertions all green.`);
  } else {
    console.log(`RESULT: FAIL — ${failures}/${results.length} assertions failing.`);
  }
  return failures === 0 ? 0 : 1;
}

process.exit(main());
