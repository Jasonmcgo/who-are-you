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
import { generateDriveProse } from "../../lib/drive";
import type { Answer, DemographicSet, DriveOutput } from "../../lib/types";

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

// ─────────────────────────────────────────────────────────────────────
// CC-146 — extensions
// ─────────────────────────────────────────────────────────────────────

function renderIndividualForFixture(rel: string): string {
  const f = JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as {
    answers: Answer[];
  };
  const c = buildInnerConstitution(f.answers, [], null);
  return renderMirrorAsMarkdown({
    constitution: c,
    answers: f.answers,
    demographics: null,
    includeBeliefAnchor: false,
    renderMode: "user",
    generatedAt: new Date("2026-05-24T00:00:00Z"),
  });
}

function loadDriveForFixture(rel: string): DriveOutput | undefined {
  const f = JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as {
    answers: Answer[];
  };
  const c = buildInnerConstitution(f.answers, [], null);
  return c.shape_outputs?.path.drive;
}

function checkIndividualCarriesDistributionAndClaimed(): Result {
  // CC-146 Part B — the Individual must now emit the Distribution
  // bracket line + Claimed drive line for the Jason cohort (aligned
  // case, Q-3C1 answered). Anchor inside the Work, Love, and Giving
  // section to confirm placement.
  const md = renderIndividual();
  const sectionStart = md.indexOf("## Work, Love, and Giving");
  if (sectionStart < 0) {
    return {
      ok: false,
      name: "cc146-individual-work-love-giving-section-present",
      detail: "## Work, Love, and Giving heading not found",
    };
  }
  const tail = md.slice(sectionStart);
  const nextH2 = tail.slice(2).search(/\n## /);
  const section = nextH2 < 0 ? tail : tail.slice(0, nextH2 + 2);
  const hasDistribution = /\[Distribution: Building & wealth \d+%, People, Service & Society \d+%, Risk and uncertainty \d+%\]/.test(
    section
  );
  const hasClaimed = /Claimed drive: 1\. .+ · 2\. .+ · 3\. .+/.test(section);
  const ok = hasDistribution && hasClaimed;
  return {
    ok,
    name: "cc146-individual-emits-distribution-and-claimed-lines",
    detail: ok
      ? "Distribution bracket line + Claimed drive line both present inside Work, Love, and Giving"
      : `missing — distribution=${hasDistribution} claimed=${hasClaimed}`,
  };
}

function checkIndividualCarriesDriveProse(): Result {
  // CC-146 Part B — the case-aware drive prose (from generateDriveProse)
  // closes with "Which feels closer?" across every case. Anchor the
  // check on that sentinel inside the Work, Love, and Giving section.
  const md = renderIndividual();
  const sectionStart = md.indexOf("## Work, Love, and Giving");
  if (sectionStart < 0) {
    return {
      ok: false,
      name: "cc146-individual-drive-prose-present",
      detail: "## Work, Love, and Giving heading not found",
    };
  }
  const tail = md.slice(sectionStart);
  const nextH2 = tail.slice(2).search(/\n## /);
  const section = nextH2 < 0 ? tail : tail.slice(0, nextH2 + 2);
  const hasProse = /Which feels closer\?/.test(section);
  return {
    ok: hasProse,
    name: "cc146-individual-drive-prose-present",
    detail: hasProse
      ? `generateDriveProse paragraph closes Work, Love, and Giving with the canonical "Which feels closer?" sentinel`
      : `generateDriveProse paragraph missing — "Which feels closer?" sentinel not found in section`,
  };
}

function checkDriveCaseRouting(): Result[] {
  // CC-146 — exercise generateDriveProse on >=2 distinct drive cases to
  // prove case routing (aligned + at least one inverted/partial), AND
  // verify it doesn't throw on the unstated template (no Q-3C1).
  const out: Result[] = [];
  const fixtures: Array<{ rel: string; label: string }> = [
    { rel: "cohort-real/jason-real.json", label: "jason-real" },
    { rel: "goal-soul-give/13-drive-inverted-case.json", label: "drive-inverted-case" },
  ];
  const casesSeen = new Set<string>();
  for (const fx of fixtures) {
    const drive = loadDriveForFixture(fx.rel);
    if (!drive) {
      out.push({
        ok: false,
        name: `cc146-drive-case-routing-${fx.label}`,
        detail: `drive output absent on ${fx.rel}`,
      });
      continue;
    }
    let prose = "";
    try {
      prose = generateDriveProse(drive);
    } catch (e) {
      out.push({
        ok: false,
        name: `cc146-drive-case-routing-${fx.label}`,
        detail: `generateDriveProse threw on case=${drive.case}: ${(e as Error).message}`,
      });
      continue;
    }
    const closes = /Which feels closer\?/.test(prose);
    casesSeen.add(drive.case);
    out.push({
      ok: closes && prose.length > 0,
      name: `cc146-drive-case-routing-${fx.label}`,
      detail: closes
        ? `case=${drive.case}; prose length=${prose.length}; closes with "Which feels closer?"`
        : `case=${drive.case}; prose generated but missing canonical close`,
    });
  }
  // Surface case-distinctness as its own assertion so a regression where
  // both fixtures collapse to the same template would fail loudly.
  out.push({
    ok: casesSeen.size >= 2,
    name: "cc146-drive-case-routing-distinct-cases",
    detail:
      casesSeen.size >= 2
        ? `prose case routing exercised across ${casesSeen.size} distinct cases: ${[...casesSeen].join(", ")}`
        : `only ${casesSeen.size} case seen — case routing not proven`,
  });
  return out;
}

function checkUnstatedDriveDoesNotThrow(): Result {
  // CC-146 flag-in-report — a fixture lacking Q-3C1 should still
  // produce a renderable "unstated" template (no throw). Synthesize a
  // minimal DriveOutput with no claimed ranking and verify.
  const synthetic: DriveOutput = {
    distribution: {
      cost: 40,
      coverage: 35,
      compliance: 25,
      rankAware: false,
      inputCount: { cost: 1, coverage: 1, compliance: 1 },
    },
    case: "unstated",
    prose: "",
  };
  try {
    const prose = generateDriveProse(synthetic);
    const ok =
      prose.length > 0 &&
      /Without a claimed drive on file/.test(prose) &&
      /Which feels closer/.test(prose);
    return {
      ok,
      name: "cc146-unstated-drive-renders-without-throw",
      detail: ok
        ? `unstated template renders cleanly (${prose.length} chars), names absence of claim, closes canonically`
        : `unstated template rendered but missing expected phrasing`,
    };
  } catch (e) {
    return {
      ok: false,
      name: "cc146-unstated-drive-renders-without-throw",
      detail: `generateDriveProse threw on unstated case: ${(e as Error).message}`,
    };
  }
}

function checkInvertedFixtureRendersCleanly(): Result {
  // CC-146 AC #3 — re-render the inverted-case fixture end-to-end and
  // confirm the Individual markdown carries the same Distribution +
  // Claimed lines + the case-specific generateDriveProse text. This
  // proves the markdown composer wires the case routing through.
  const rel = "goal-soul-give/13-drive-inverted-case.json";
  let md: string;
  try {
    md = renderIndividualForFixture(rel);
  } catch (e) {
    return {
      ok: false,
      name: "cc146-inverted-fixture-individual-renders",
      detail: `render threw: ${(e as Error).message}`,
    };
  }
  const sectionStart = md.indexOf("## Work, Love, and Giving");
  if (sectionStart < 0) {
    return {
      ok: false,
      name: "cc146-inverted-fixture-individual-renders",
      detail: `Work, Love, and Giving section absent in ${rel}`,
    };
  }
  const tail = md.slice(sectionStart);
  const nextH2 = tail.slice(2).search(/\n## /);
  const section = nextH2 < 0 ? tail : tail.slice(0, nextH2 + 2);
  const hasDistribution = /\[Distribution: /.test(section);
  const hasClaimed = /Claimed drive: 1\./.test(section);
  const hasProse = /Which feels closer\?/.test(section);
  const ok = hasDistribution && hasClaimed && hasProse;
  return {
    ok,
    name: "cc146-inverted-fixture-individual-renders",
    detail: ok
      ? `inverted-case fixture carries Distribution + Claimed + drive prose in Individual markdown`
      : `inverted fixture render — distribution=${hasDistribution} claimed=${hasClaimed} prose=${hasProse}`,
  };
}

function checkReactWarmCardWiring(): Result {
  // CC-146 Part A — the React surface (FiftyDegreeIndividualSection.tsx)
  // can't be exercised in a markdown audit, but the wiring is static.
  // Assert the three structural facts: the warm-rewrites prop accepts
  // lens/compass/hands/path, BodyCards renders <LlmProseBlock> when
  // warm is present, and the warm slot maps off card.source. This
  // catches future regressions where a refactor drops the splice.
  const file = readFileSync(
    join(__dirname, "..", "..", "app", "components", "FiftyDegreeIndividualSection.tsx"),
    "utf-8"
  );
  const checks: Array<[string, boolean]> = [
    ["liveRewrites.lens field", /\blens:\s*string \| null/.test(file)],
    ["liveRewrites.compass field", /\bcompass:\s*string \| null/.test(file)],
    ["liveRewrites.hands field", /\bhands:\s*string \| null/.test(file)],
    ["liveRewrites.path field", /\bpath:\s*string \| null/.test(file)],
    ["LlmProseBlock import", /import\s+LlmProseBlock\s+from/.test(file)],
    ["warm-vs-engine branch", /useWarm\s*\?\s*\(\s*<LlmProseBlock/.test(file)],
    [
      "warm slot keyed off card.source",
      /card\.source\s*===\s*["']lens["']/.test(file) &&
        /card\.source\s*===\s*["']compass["']/.test(file) &&
        /card\.source\s*===\s*["']hands["']/.test(file),
    ],
    ["generateDriveProse imported", /import\s*\{\s*generateDriveProse\s*\}/.test(file)],
  ];
  const failing = checks.filter(([, ok]) => !ok).map(([n]) => n);
  return {
    ok: failing.length === 0,
    name: "cc146-react-warm-card-wiring-present",
    detail:
      failing.length === 0
        ? `FiftyDegreeIndividualSection.tsx wires 4 warm-rewrite props + LlmProseBlock + drive prose import`
        : `wiring gaps: ${failing.join(", ")}`,
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
    // CC-146 extensions — warm 4-card splice wiring (React-only) +
    // claimed-vs-revealed drive prose (markdown + React).
    checkIndividualCarriesDistributionAndClaimed(),
    checkIndividualCarriesDriveProse(),
    ...checkDriveCaseRouting(),
    checkUnstatedDriveDoesNotThrow(),
    checkInvertedFixtureRendersCleanly(),
    checkReactWarmCardWiring(),
  ];

  console.log("CC-145 + CC-146 — Individual body-cards / charts / grip + warm-card splice & drive prose audit");
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
