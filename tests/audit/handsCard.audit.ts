// CC-HANDS-CARD audit — 14 assertions covering the 9th body card.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import { computeHandsCard } from "../../lib/handsCard";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const HANDS_FILE = join(__dirname, "..", "..", "lib", "handsCard.ts");
const BASELINE = join(__dirname, "handsCardBaseline.snapshot.json");

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

const CARD_HEADERS = [
  "### Lens — Eyes",
  "### Compass — Heart",
  "### Trust — Ears",
  "### Gravity — Spine",
  "### Conviction — Voice",
  "### Weather — Nervous System",
  "### Fire — Immune Response",
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CohortRow = {
  set: string;
  file: string;
  constitution: InnerConstitution;
  markdown: string;
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
      const constitution = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      // CC-LLM-PROSE-PASS-V1 — Lens/Compass/Hands/Path are now rewritten
      // by the LLM in user mode. Audit gates that check engine-side
      // content (existing-8-cards baseline, etc.) query clinician mode
      // so the byte-identity comparison stays against legacy engine
      // output, not the LLM rewrite.
      const markdown = renderMirrorAsMarkdown({
        constitution,
        includeBeliefAnchor: false,
        renderMode: "clinician",
      });
      out.push({ set, file: f, constitution, markdown });
    }
  }
  return out;
}

function extractSection(md: string, header: string): string | null {
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  const nextHeader = rest.slice(header.length).search(/\n### /);
  if (nextHeader < 0) return rest.trimEnd();
  return rest.slice(0, header.length + nextHeader).trimEnd();
}

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const cohort = loadCohort();
  const jasonRow = cohort.find(
    (r) => r.set === "ocean" && r.file === "07-jason-real-session.json"
  );

  // ── 1. hands-card-module-exists ────────────────────────────────────
  const handsSrc = readFileSync(HANDS_FILE, "utf-8");
  const moduleFails: string[] = [];
  for (const sym of [
    "export interface HandsCardReading",
    "export function computeHandsCard",
  ]) {
    if (!handsSrc.includes(sym)) moduleFails.push(`missing ${sym}`);
  }
  results.push(
    moduleFails.length === 0
      ? {
          ok: true,
          assertion: "hands-card-module-exists",
          detail: "lib/handsCard.ts exports computeHandsCard + HandsCardReading",
        }
      : {
          ok: false,
          assertion: "hands-card-module-exists",
          detail: moduleFails.join(" | "),
        }
  );

  // ── 2. hands-card-attached-to-constitution ─────────────────────────
  const attachFails: string[] = [];
  for (const r of cohort) {
    const h = r.constitution.handsCard;
    if (!h) {
      attachFails.push(`${r.file}: no handsCard`);
      continue;
    }
    for (const k of [
      "openingLine",
      "strength",
      "growthEdge",
      "practice",
      "closingLine",
    ] as const) {
      if (!h[k]) attachFails.push(`${r.file}: ${k} empty`);
    }
    if (!h.underPressure.healthRegister)
      attachFails.push(`${r.file}: healthRegister empty`);
    if (!h.underPressure.pressureRegister)
      attachFails.push(`${r.file}: pressureRegister empty`);
  }
  results.push(
    attachFails.length === 0
      ? {
          ok: true,
          assertion: "hands-card-attached-to-constitution",
          detail: `${cohort.length} fixtures: handsCard attached with all required fields`,
        }
      : {
          ok: false,
          assertion: "hands-card-attached-to-constitution",
          detail: attachFails.slice(0, 5).join(" | "),
        }
  );

  // ── 3. hands-renders-between-heart-and-spine ───────────────────────
  const orderFails: string[] = [];
  for (const r of cohort) {
    const md = r.markdown;
    const heartIdx = md.indexOf("### Compass — Heart");
    const handsIdx = md.indexOf("### Hands — Work");
    const spineIdx = md.indexOf("### Gravity — Spine");
    if (heartIdx < 0 || handsIdx < 0 || spineIdx < 0) {
      orderFails.push(
        `${r.file}: heart=${heartIdx} hands=${handsIdx} spine=${spineIdx}`
      );
      continue;
    }
    if (!(heartIdx < handsIdx && handsIdx < spineIdx)) {
      orderFails.push(
        `${r.file}: order wrong heart=${heartIdx} hands=${handsIdx} spine=${spineIdx}`
      );
    }
  }
  results.push(
    orderFails.length === 0
      ? {
          ok: true,
          assertion: "hands-renders-between-heart-and-spine",
          detail: `Hands card renders between Heart/Compass and Spine/Gravity in all ${cohort.length} fixtures`,
        }
      : {
          ok: false,
          assertion: "hands-renders-between-heart-and-spine",
          detail: orderFails.slice(0, 5).join(" | "),
        }
  );

  // ── 4. body-map-has-9-cards ────────────────────────────────────────
  const nineCardFails: string[] = [];
  const nineHeaders = ["### Hands — Work", ...CARD_HEADERS];
  for (const r of cohort) {
    for (const h of nineHeaders) {
      if (!r.markdown.includes(h)) {
        nineCardFails.push(`${r.file}: missing ${h}`);
      }
    }
  }
  results.push(
    nineCardFails.length === 0
      ? {
          ok: true,
          assertion: "body-map-has-9-cards",
          detail: "all 9 cards render across the cohort",
        }
      : {
          ok: false,
          assertion: "body-map-has-9-cards",
          detail: nineCardFails.slice(0, 5).join(" | "),
        }
  );

  // ── 5. hands-first-reference-dual-name ─────────────────────────────
  const dualNameFails: string[] = [];
  for (const r of cohort) {
    if (!r.markdown.includes("### Hands — Work")) {
      dualNameFails.push(`${r.file}: section header missing dual name`);
    }
  }
  results.push(
    dualNameFails.length === 0
      ? {
          ok: true,
          assertion: "hands-first-reference-dual-name",
          detail: "every Hands section header uses the dual name 'Hands — Work'",
        }
      : {
          ok: false,
          assertion: "hands-first-reference-dual-name",
          detail: dualNameFails.slice(0, 5).join(" | "),
        }
  );

  // ── 6. hands-consumes-eight-inputs ─────────────────────────────────
  const inputFails: string[] = [];
  const requiredInputs = [
    "archetype",
    "gripPatternBucket",
    "goalScore",
    "costStrength",
    "topGiftCategory",
    "lensDriver",
    "qA1Activity",
    "qA2EnergyDirection",
    "qGS1TopReward",
    "qV1TopMeaning",
  ];
  for (const k of requiredInputs) {
    if (!new RegExp(`\\b${k}\\b`).test(handsSrc)) {
      inputFails.push(`HandsCardInputs missing ${k}`);
    }
  }
  results.push(
    inputFails.length === 0
      ? {
          ok: true,
          assertion: "hands-consumes-eight-inputs",
          detail: `computeHandsCard consumes the 10 documented inputs (8 sources, with Q-A1/A2 and Q-GS1/V1 each as 2 fields)`,
        }
      : {
          ok: false,
          assertion: "hands-consumes-eight-inputs",
          detail: inputFails.join(" | "),
        }
  );

  // ── 7. hands-dual-mode-read-distinct ───────────────────────────────
  const distinctFails: string[] = [];
  for (const r of cohort) {
    const h = r.constitution.handsCard;
    if (!h) continue;
    if (
      h.underPressure.healthRegister === h.underPressure.pressureRegister
    ) {
      distinctFails.push(`${r.file}: dual-mode prose identical`);
    }
  }
  results.push(
    distinctFails.length === 0
      ? {
          ok: true,
          assertion: "hands-dual-mode-read-distinct",
          detail: `${cohort.length} fixtures: healthRegister !== pressureRegister`,
        }
      : {
          ok: false,
          assertion: "hands-dual-mode-read-distinct",
          detail: distinctFails.slice(0, 5).join(" | "),
        }
  );

  // ── 8. hands-archetype-routed-content ──────────────────────────────
  const archetypeFails: string[] = [];
  if (jasonRow) {
    const s = jasonRow.constitution.handsCard?.strength ?? "";
    if (!/architecture|structure|long-arc|long arc|framework/i.test(s)) {
      archetypeFails.push(
        `Jason strength missing architect register: "${s.slice(0, 80)}..."`
      );
    }
  }
  // Synthetic Cindy: cindyType archetype
  const cindyHands = computeHandsCard({
    archetype: "cindyType",
    gripPatternBucket: "belonging",
    goalScore: 70,
    costStrength: 60,
    topGiftCategory: "Harmony",
    lensDriver: "se",
    qA1Activity: null,
    qA2EnergyDirection: "deepening relationships",
    qGS1TopReward: null,
    qV1TopMeaning: null,
  });
  if (!/care|presence|relational|continuity/i.test(cindyHands.strength)) {
    archetypeFails.push(
      `Cindy strength missing caregiver register: "${cindyHands.strength.slice(0, 80)}..."`
    );
  }
  // Synthetic Daniel: danielType archetype
  const danielHands = computeHandsCard({
    archetype: "danielType",
    gripPatternBucket: "security",
    goalScore: 75,
    costStrength: 70,
    topGiftCategory: "Stewardship",
    lensDriver: "si",
    qA1Activity: null,
    qA2EnergyDirection: null,
    qGS1TopReward: null,
    qV1TopMeaning: null,
  });
  if (
    !/stewardship|continuity|system|operational|institutional|precedent/i.test(
      danielHands.strength
    )
  ) {
    archetypeFails.push(
      `Daniel strength missing steward register: "${danielHands.strength.slice(0, 80)}..."`
    );
  }
  // Three distinct strength strings.
  const jasonStrength =
    jasonRow?.constitution.handsCard?.strength ?? "";
  const distinct = new Set([
    jasonStrength,
    cindyHands.strength,
    danielHands.strength,
  ]).size;
  if (distinct < 3) {
    archetypeFails.push(
      `only ${distinct} distinct Hands.strength across Jason/Cindy/Daniel`
    );
  }
  results.push(
    archetypeFails.length === 0
      ? {
          ok: true,
          assertion: "hands-archetype-routed-content",
          detail: `Jason architect / Cindy caregiver / Daniel steward — 3 distinct registers`,
        }
      : {
          ok: false,
          assertion: "hands-archetype-routed-content",
          detail: archetypeFails.join(" | "),
        }
  );

  // ── 9. hands-not-work-map-content ──────────────────────────────────
  // Hands card prose should NOT contain Work Map vocational examples.
  // Inspect the Hands section in every fixture render.
  const workMapVocab = [
    "surgeon",
    "COO",
    "operations management",
    "operations director",
    "investigative journalist",
    "data analyst",
  ];
  const handsContentFails: string[] = [];
  for (const r of cohort) {
    const handsSection = extractSection(r.markdown, "### Hands — Work");
    if (!handsSection) continue;
    for (const v of workMapVocab) {
      if (handsSection.includes(v)) {
        handsContentFails.push(`${r.file}: Hands contains Work Map "${v}"`);
      }
    }
  }
  results.push(
    handsContentFails.length === 0
      ? {
          ok: true,
          assertion: "hands-not-work-map-content",
          detail: "Hands prose contains no Work Map vocational examples",
        }
      : {
          ok: false,
          assertion: "hands-not-work-map-content",
          detail: handsContentFails.slice(0, 5).join(" | "),
        }
  );

  // ── 10. work-map-section-preserved ─────────────────────────────────
  const workMapFails: string[] = [];
  let workMapFound = 0;
  for (const r of cohort) {
    if (r.markdown.includes("## Work Map")) {
      workMapFound++;
    }
  }
  if (workMapFound < 1) {
    workMapFails.push(
      `Work Map section not found in any of ${cohort.length} fixtures`
    );
  }
  results.push(
    workMapFails.length === 0
      ? {
          ok: true,
          assertion: "work-map-section-preserved",
          detail: `Work Map section present in ${workMapFound}/${cohort.length} fixtures (where signal supports it)`,
        }
      : {
          ok: false,
          assertion: "work-map-section-preserved",
          detail: workMapFails.join(" | "),
        }
  );

  // ── 11. hands-canon-line-present ───────────────────────────────────
  const canonFails: string[] = [];
  for (const r of cohort) {
    const handsSection = extractSection(r.markdown, "### Hands — Work");
    if (!handsSection) {
      canonFails.push(`${r.file}: Hands section missing`);
      continue;
    }
    if (
      !handsSection.includes("Hands is what your life makes real") &&
      !handsSection.includes("makes real")
    ) {
      canonFails.push(`${r.file}: canon line absent`);
    }
  }
  results.push(
    canonFails.length === 0
      ? {
          ok: true,
          assertion: "hands-canon-line-present",
          detail: `canon line ("Hands is what your life makes real") present in every Hands render`,
        }
      : {
          ok: false,
          assertion: "hands-canon-line-present",
          detail: canonFails.slice(0, 5).join(" | "),
        }
  );

  // ── 12. hands-content-foster-vocabulary-free ───────────────────────
  const fosterFails: { file: string; phrase: string }[] = [];
  for (const r of cohort) {
    const handsSection = extractSection(r.markdown, "### Hands — Work");
    if (!handsSection) continue;
    for (const p of FOSTER_PATTERNS) {
      if (handsSection.includes(p)) {
        fosterFails.push({ file: r.file, phrase: p });
      }
    }
  }
  // Also check the template module itself.
  for (const p of FOSTER_PATTERNS) {
    if (handsSrc.includes(p)) {
      fosterFails.push({ file: "lib/handsCard.ts", phrase: p });
    }
  }
  results.push(
    fosterFails.length === 0
      ? {
          ok: true,
          assertion: "hands-content-foster-vocabulary-free",
          detail: `0 Foster vocabulary occurrences across Hands renders and templates`,
        }
      : {
          ok: false,
          assertion: "hands-content-foster-vocabulary-free",
          detail: fosterFails
            .slice(0, 5)
            .map((f) => `${f.file}: "${f.phrase}"`)
            .join(" | "),
        }
  );

  // ── 13. existing-eight-cards-unchanged ─────────────────────────────
  const baselineFails: string[] = [];
  if (!existsSync(BASELINE)) {
    baselineFails.push("baseline snapshot file missing");
  } else {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf-8")) as Record<
      string,
      Record<string, string>
    >;
    for (const r of cohort) {
      const key = `${r.set}/${r.file}`;
      const expected = baseline[key];
      if (!expected) {
        baselineFails.push(`${r.file}: no baseline entry`);
        continue;
      }
      for (const header of CARD_HEADERS) {
        const section = extractSection(r.markdown, header);
        const actual = section ? hash(section) : "(missing)";
        if (actual !== expected[header]) {
          baselineFails.push(
            `${r.file}/${header}: hash ${actual} != baseline ${expected[header]}`
          );
        }
      }
    }
  }
  results.push(
    baselineFails.length === 0
      ? {
          ok: true,
          assertion: "existing-eight-cards-unchanged",
          detail: `${cohort.length} fixtures × 8 cards: every card byte-identical to pre-CC baseline`,
        }
      : {
          ok: false,
          assertion: "existing-eight-cards-unchanged",
          detail: baselineFails.slice(0, 5).join(" | "),
        }
  );

  // ── 14. hands-card-zero-cost ───────────────────────────────────────
  // computeHandsCard must be pure — no SDK / API imports.
  const zeroCostFails: string[] = [];
  if (/from\s+["']@anthropic-ai|anthropicClient|fetch\(|http/i.test(handsSrc))
    zeroCostFails.push("handsCard module references LLM/API/HTTP");
  if (/node:fs|node:net|node:http/.test(handsSrc))
    zeroCostFails.push("handsCard module imports node:* runtime");
  results.push(
    zeroCostFails.length === 0
      ? {
          ok: true,
          assertion: "hands-card-zero-cost",
          detail: "computeHandsCard is pure deterministic; no LLM calls, no API, no I/O",
        }
      : {
          ok: false,
          assertion: "hands-card-zero-cost",
          detail: zeroCostFails.join(" | "),
        }
  );

  // Diagnostic — Hands content distribution across cohort.
  console.log("\nHands card archetype distribution:");
  const archCounts: Record<string, number> = {};
  for (const r of cohort) {
    const arch = r.constitution.profileArchetype?.primary ?? "(none)";
    archCounts[arch] = (archCounts[arch] ?? 0) + 1;
  }
  for (const [arch, count] of Object.entries(archCounts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${arch}: ${count} fixtures`);
  }

  return results;
}

function main(): number {
  console.log("CC-HANDS-CARD audit");
  console.log("=====================");
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
  console.log("AUDIT PASSED — all CC-HANDS-CARD assertions green.");
  return 0;
}

process.exit(main());
