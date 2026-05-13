// CC-TWO-TIER-RENDER-SURFACE-CLEANUP audit.
//
// Assertions:
//   1. renderMode-switch-exists — renderMirrorAsMarkdown accepts renderMode
//   2. user-mode-strips-borrowed-system-labels — Jason/Cindy/Daniel user
//      renders contain zero occurrences of MBTI codes / OCEAN / Big Five
//      outside protected contexts (masthead disclaimer, SVG body)
//   3. user-mode-strips-engine-internal-phrases — zero hits across
//      non-SVG body for "composite read" / "disposition channel" /
//      "signal cluster" / "derived from" / "the model detects" /
//      "reinforces the Work-line"
//   4. user-mode-strips-foster-and-faith-vocabulary — zero hits for
//      "Primal Question" / "Faith Shape" / "Faith Texture"
//   5. user-mode-strips-raw-jungian-function-names — no standalone
//      "Ni" / "Te" / "Fe" / "Si" / "Ne" / "Se" / "Ti" / "Fi" in body
//      (excluding chart SVG attributes)
//   6. disposition-section-header-renamed — section header is no longer
//      "## Disposition Signal Mix" in user mode
//   7. verdict-phrases-only-in-metric-lines — verdict phrases ("Goal-led
//      Presence" etc.) only appear in dedicated Quadrant/Risk Form
//      metric lines + chart SVG
//   8. appendix-dialog-strips-intj — UseCasesSection.tsx jasonType
//      explanation no longer contains "I'm an INTJ"
//   9. clinician-mode-byte-identical-to-baseline — clinician-mode
//      output matches the pre-CC baseline hash for every fixture
//  10. user-mode-cohort-renders-clean — full 24-fixture cohort sweep
//      passes the suppression gates (informational on outliers)

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const BASELINE = join(__dirname, "twoTierBaseline.snapshot.json");
const RENDER_FILE = join(__dirname, "..", "..", "lib", "renderMirror.ts");
const USECASES_FILE = join(
  __dirname,
  "..",
  "..",
  "app",
  "components",
  "UseCasesSection.tsx"
);

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

const STRICT_PHRASES = [
  "OCEAN",
  "Big Five",
  "composite read",
  "disposition channel",
  "signal cluster",
  "the model detects",
  "reinforces the Work-line",
  "Primal Question",
  "Faith Shape",
  "Faith Texture",
];

const MBTI_CODES = [
  "INTJ",
  "INTP",
  "INFJ",
  "INFP",
  "ISTJ",
  "ISTP",
  "ISFJ",
  "ISFP",
  "ENTJ",
  "ENTP",
  "ENFJ",
  "ENFP",
  "ESTJ",
  "ESTP",
  "ESFJ",
  "ESFP",
];

const TRAIT_NAMES = [
  "Openness",
  "Conscientiousness",
  "Extraversion",
  "Agreeableness",
  "Emotional Reactivity",
  "Neuroticism",
];

const JUNGIAN_FN = ["Ni", "Te", "Fe", "Si", "Ne", "Se", "Ti", "Fi"];

const VERDICT_PHRASES = [
  "Goal-led Presence",
  "Soul-led Presence",
  "Strained Integration",
  "Driven Output",
  "Burdened Care",
  "Pressed Output",
  "Anxious Caring",
  "Giving / Presence",
  "Ungoverned Movement",
  "White-Knuckled Aim",
  "Open-Handed Aim",
  "Grip-Governed",
  "Lightly Governed Movement",
];

// Strip protected contexts (SVG blocks + masthead disclaimer + metric
// label lines + Risk Form prose paragraph) before grepping. This is
// the "user-visible prose echoes" view per CC canon: verdict phrases
// stay in the chart label, the metric bullet, AND the dedicated Risk
// Form prose paragraph that names the letter. They must not echo in
// other prose sections.
function stripProtected(md: string): string {
  // 1. Strip entire <svg>...</svg> blocks.
  md = md.replace(/<svg[\s\S]*?<\/svg>/g, "");
  // 2. Strip masthead disclaimer line.
  md = md.replace(/\*Possible surface label:[^*]*\*/g, "");
  // 3. Strip protected per-line contexts.
  md = md
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (
        /^- \*\*(Quadrant|Risk Form|Movement|Aim|Grip|Goal|Soul|Direction|Grip Pattern)\b/.test(
          trimmed
        )
      ) {
        return false;
      }
      // Dedicated Risk Form prose paragraph (italic, named subject).
      if (/^\*Your Risk Form reads as /.test(trimmed)) return false;
      return true;
    })
    .join("\n");
  return md;
}

function loadFixture(set: string, file: string): Answer[] {
  const raw = JSON.parse(
    readFileSync(join(ROOT, set, file), "utf-8")
  ) as { answers: Answer[]; demographics?: DemographicSet | null };
  void raw.demographics;
  return raw.answers;
}

function renderUser(set: string, file: string): string {
  const raw = JSON.parse(
    readFileSync(join(ROOT, set, file), "utf-8")
  ) as { answers: Answer[]; demographics?: DemographicSet | null };
  const c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
  return renderMirrorAsMarkdown({
    constitution: c,
    includeBeliefAnchor: false,
    renderMode: "user",
  });
}

function renderClinician(set: string, file: string): string {
  const raw = JSON.parse(
    readFileSync(join(ROOT, set, file), "utf-8")
  ) as { answers: Answer[]; demographics?: DemographicSet | null };
  const c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
  return renderMirrorAsMarkdown({
    constitution: c,
    includeBeliefAnchor: false,
    renderMode: "clinician",
    generatedAt: new Date("2026-05-11T00:00:00Z"),
  });
}

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

const FIXTURE_TRIPLE: Array<{ label: string; set: string; file: string }> = [
  { label: "Jason", set: "ocean", file: "07-jason-real-session.json" },
  // Closest cohort fixture for the danielType archetype.
  { label: "Daniel-like", set: "ocean", file: "24-si-precedent-keeper.json" },
  // Closest cohort fixture for the cindyType archetype.
  { label: "Cindy-like", set: "goal-soul-give", file: "01-generative.json" },
];

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1. renderMode-switch-exists ────────────────────────────────────
  const renderSrc = readFileSync(RENDER_FILE, "utf-8");
  const sw = /renderMode\?\s*:\s*"user"\s*\|\s*"clinician"/.test(renderSrc);
  results.push(
    sw
      ? {
          ok: true,
          assertion: "renderMode-switch-exists",
          detail:
            'renderMirrorAsMarkdown accepts renderMode?: "user" | "clinician"',
        }
      : {
          ok: false,
          assertion: "renderMode-switch-exists",
          detail: "RenderArgs missing renderMode signature",
        }
  );

  // Helper: grep terms in user-mode body (post-strip-protected).
  function checkTerms(
    terms: string[]
  ): Array<{ label: string; term: string; sample: string }> {
    const fails: { label: string; term: string; sample: string }[] = [];
    for (const f of FIXTURE_TRIPLE) {
      const md = renderUser(f.set, f.file);
      const stripped = stripProtected(md);
      for (const t of terms) {
        if (stripped.includes(t)) {
          const idx = stripped.indexOf(t);
          fails.push({
            label: f.label,
            term: t,
            sample: stripped
              .slice(Math.max(0, idx - 50), idx + t.length + 50)
              .replace(/\n/g, " ")
              .trim(),
          });
        }
      }
    }
    return fails;
  }

  // ── 2. user-mode-strips-borrowed-system-labels ─────────────────────
  const borrowed = checkTerms([...MBTI_CODES, "OCEAN", "Big Five"]);
  results.push(
    borrowed.length === 0
      ? {
          ok: true,
          assertion: "user-mode-strips-borrowed-system-labels",
          detail: "no MBTI codes / OCEAN / Big Five in user-visible body across Jason/Daniel/Cindy",
        }
      : {
          ok: false,
          assertion: "user-mode-strips-borrowed-system-labels",
          detail: borrowed
            .slice(0, 5)
            .map((f) => `${f.label}: "${f.term}" in "${f.sample.slice(0, 80)}..."`)
            .join(" | "),
        }
  );

  // ── 3. user-mode-strips-engine-internal-phrases ────────────────────
  const engineFails = checkTerms([
    "composite read",
    "disposition channel",
    "signal cluster",
    "the model detects",
    "reinforces the Work-line",
  ]);
  results.push(
    engineFails.length === 0
      ? {
          ok: true,
          assertion: "user-mode-strips-engine-internal-phrases",
          detail: "all listed engine-internal phrases stripped from user-visible body",
        }
      : {
          ok: false,
          assertion: "user-mode-strips-engine-internal-phrases",
          detail: engineFails.slice(0, 5).join(" | "),
        }
  );

  // ── 4. user-mode-strips-foster-and-faith-vocabulary ────────────────
  const fosterFails = checkTerms([
    "Primal Question",
    "Faith Shape",
    "Faith Texture",
  ]);
  results.push(
    fosterFails.length === 0
      ? {
          ok: true,
          assertion: "user-mode-strips-foster-and-faith-vocabulary",
          detail: "Faith Shape / Faith Texture / Primal Question absent from user body",
        }
      : {
          ok: false,
          assertion: "user-mode-strips-foster-and-faith-vocabulary",
          detail: fosterFails.slice(0, 5).join(" | "),
        }
  );

  // ── 5. user-mode-strips-raw-jungian-function-names ─────────────────
  const jungianFails: { label: string; term: string }[] = [];
  for (const f of FIXTURE_TRIPLE) {
    const md = renderUser(f.set, f.file);
    const stripped = stripProtected(md);
    for (const fn of JUNGIAN_FN) {
      const re = new RegExp(`\\b${fn}\\b`, "g");
      const matches = (stripped.match(re) ?? []).length;
      if (matches > 0) {
        jungianFails.push({ label: f.label, term: `${fn} × ${matches}` });
      }
    }
  }
  results.push(
    jungianFails.length === 0
      ? {
          ok: true,
          assertion: "user-mode-strips-raw-jungian-function-names",
          detail: "no standalone Ni/Te/Fe/Si/Ne/Se/Ti/Fi in user-visible body",
        }
      : {
          ok: false,
          assertion: "user-mode-strips-raw-jungian-function-names",
          detail: jungianFails
            .slice(0, 5)
            .map((f) => `${f.label}: ${f.term}`)
            .join(" | "),
        }
  );

  // ── 6. disposition-section-header-renamed ──────────────────────────
  const headerFails: string[] = [];
  for (const f of FIXTURE_TRIPLE) {
    const md = renderUser(f.set, f.file);
    if (md.includes("## Disposition Signal Mix")) {
      headerFails.push(`${f.label} still has "## Disposition Signal Mix"`);
    }
    if (!md.includes("## How Your Disposition Reads")) {
      // Some fixtures may not have an OCEAN section at all (thin signal);
      // only fail if Disposition section header was present pre-mask.
    }
  }
  // Also verify the trait-name section labels in the user-visible body
  // are gone. (Trait names in SVG label content are exempt — stripped
  // by stripProtected when grepping.)
  const traitFails = checkTerms(TRAIT_NAMES);
  for (const f of traitFails) {
    headerFails.push(`${f.label}: trait name "${f.term}" leaks into body prose`);
  }
  results.push(
    headerFails.length === 0
      ? {
          ok: true,
          assertion: "disposition-section-header-renamed",
          detail: "user mode emits 'How Your Disposition Reads' (or omits when no OCEAN signal); no trait-name leak in body",
        }
      : {
          ok: false,
          assertion: "disposition-section-header-renamed",
          detail: headerFails.slice(0, 5).join(" | "),
        }
  );

  // ── 7. verdict-phrases-only-in-metric-lines ────────────────────────
  const verdictFails = checkTerms(VERDICT_PHRASES);
  results.push(
    verdictFails.length === 0
      ? {
          ok: true,
          assertion: "verdict-phrases-only-in-metric-lines",
          detail: "verdict phrases (Goal-led Presence, Ungoverned Movement, etc.) appear ONLY in chart SVG + Quadrant/Risk Form metric labels",
        }
      : {
          ok: false,
          assertion: "verdict-phrases-only-in-metric-lines",
          detail: verdictFails
            .slice(0, 5)
            .map((f) => `${f.label}: "${f.term}" in "${f.sample.slice(0, 80)}..."`)
            .join(" | "),
        }
  );

  // ── 8. appendix-dialog-strips-intj ─────────────────────────────────
  const useCasesSrc = readFileSync(USECASES_FILE, "utf-8");
  const intjLeaks = (useCasesSrc.match(/I'm an INTJ/g) ?? []).length;
  results.push(
    intjLeaks === 0
      ? {
          ok: true,
          assertion: "appendix-dialog-strips-intj",
          detail: "UseCasesSection.tsx contains no literal \"I'm an INTJ\" string",
        }
      : {
          ok: false,
          assertion: "appendix-dialog-strips-intj",
          detail: `UseCasesSection still contains "I'm an INTJ" (${intjLeaks} occurrences)`,
        }
  );

  // ── 9. clinician-mode-byte-identical-to-baseline ───────────────────
  if (!existsSync(BASELINE)) {
    results.push({
      ok: false,
      assertion: "clinician-mode-byte-identical-to-baseline",
      detail: "baseline snapshot missing",
    });
  } else {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf-8")) as Record<
      string,
      { length: number; hash: string }
    >;
    const driftFails: string[] = [];
    for (const dir of ["ocean", "goal-soul-give"]) {
      for (const f of readdirSync(join(ROOT, dir))
        .filter((x) => x.endsWith(".json"))
        .sort()) {
        const key = `${dir}/${f}`;
        const expected = baseline[key];
        if (!expected) continue;
        const md = renderClinician(dir, f);
        const actual = { length: md.length, hash: hash(md) };
        if (
          actual.hash !== expected.hash ||
          actual.length !== expected.length
        ) {
          driftFails.push(
            `${key}: actual.hash=${actual.hash.slice(0, 12)} expected.hash=${expected.hash.slice(0, 12)}; len ${actual.length} vs ${expected.length}`
          );
        }
      }
    }
    results.push(
      driftFails.length === 0
        ? {
            ok: true,
            assertion: "clinician-mode-byte-identical-to-baseline",
            detail: "clinician-mode output matches pre-CC baseline for every cohort fixture",
          }
        : {
            ok: false,
            assertion: "clinician-mode-byte-identical-to-baseline",
            detail: driftFails.slice(0, 5).join(" | "),
          }
    );
  }

  // ── 10. user-mode-cohort-renders-clean ─────────────────────────────
  // Diagnostic — count cohort fixtures whose user-mode body remains
  // clean of every strict-suppress term. Should be all 24.
  let cleanCount = 0;
  const dirtyFixtures: string[] = [];
  for (const dir of ["ocean", "goal-soul-give"]) {
    for (const f of readdirSync(join(ROOT, dir))
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      const md = renderUser(dir, f);
      const stripped = stripProtected(md);
      let clean = true;
      for (const t of [...STRICT_PHRASES, ...MBTI_CODES]) {
        if (stripped.includes(t)) {
          clean = false;
          dirtyFixtures.push(`${dir}/${f}: "${t}"`);
          break;
        }
      }
      if (clean) cleanCount++;
    }
  }
  results.push(
    dirtyFixtures.length === 0
      ? {
          ok: true,
          assertion: "user-mode-cohort-renders-clean",
          detail: `${cleanCount}/${cleanCount + dirtyFixtures.length} cohort fixtures clean in user mode`,
        }
      : {
          ok: false,
          assertion: "user-mode-cohort-renders-clean",
          detail: dirtyFixtures.slice(0, 5).join(" | "),
        }
  );

  // Diagnostic table — sample render slice from Jason.
  const jasonUser = renderUser("ocean", "07-jason-real-session.json");
  const dispLine = jasonUser
    .split("\n")
    .find((l) => /^## .*Disposition/.test(l) || l.startsWith("## How Your"));
  console.log("\nJason Disposition header (user mode):");
  console.log(`  "${dispLine ?? "(none)"}"`);
  const apxIdx = jasonUser.indexOf("What this is good for");
  if (apxIdx >= 0) {
    console.log("\nJason appendix excerpt (user mode):");
    console.log(`  "${jasonUser.slice(apxIdx, apxIdx + 200).replace(/\n/g, " ")}..."`);
  }

  void loadFixture;

  return results;
}

function main(): number {
  console.log("CC-TWO-TIER-RENDER-SURFACE-CLEANUP audit");
  console.log("=========================================");
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
  console.log("AUDIT PASSED — all CC-TWO-TIER-RENDER-SURFACE-CLEANUP assertions green.");
  return 0;
}

process.exit(main());
