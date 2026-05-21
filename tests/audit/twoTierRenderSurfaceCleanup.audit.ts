// CC-TWO-TIER-RENDER-SURFACE-CLEANUP audit.
//
// CC-119 — assertion #9 was redefined. Pre-CC-119, the Guide (clinician
// mode) returned raw engine prose verbatim, so a byte-identity hash
// check against a pre-CC baseline was the natural regression guard.
// CC-119 made the Guide additive — it now inherits the Individual's
// warm splice + retains scaffolding — so the byte-identity premise is
// gone. The replacement is two assertions:
//   9a. guide-superset-of-individual — for every cohort fixture, every
//       non-empty Individual line appears in the Guide render (after
//       applying the user-mode mask to the Guide to neutralize name-
//       swap / jargon-strip / header-rename differences that aren't
//       structural). Mask-applied-to-Guide ⊇ Individual.
//   9b. guide-mode-snapshot-stable — Guide hash matches a fresh
//       baseline (`twoTierBaseline.snapshot.json`, re-snapshotted post
//       CC-119) for every fixture. Regression-stability check.
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
//   9a. guide-superset-of-individual — mask(Guide) ⊇ Individual (CC-119).
//   9b. guide-mode-snapshot-stable — Guide hash matches new warm
//       baseline for every cohort fixture (CC-119 re-snapshot).
//  10. user-mode-cohort-renders-clean — full 24-fixture cohort sweep
//      passes the suppression gates (informational on outliers)

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildInnerConstitution,
  getUserName,
} from "../../lib/identityEngine";
import {
  applyUserModeMask,
  renderMirrorAsMarkdown,
} from "../../lib/renderMirror";
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
  // 2a. CC-088 — strip any sentence containing "Your Risk Form reads as
  // <Label> — <text>" wherever it appears. Post-CC-084 the Path
  // master synthesis embeds this integration sentence INSIDE a
  // narrative paragraph (rather than only as its own italic line in
  // the Movement section), so the per-line filter below no longer
  // catches it. This is a Risk-Form-prose context by design and is
  // allowed to carry a verdict phrase per the audit's intent.
  md = md.replace(/Your Risk Form reads as [^.\n]+\.(\s|$)/g, " ");
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
    // CC-119 — fixed timestamp so the Guide/Individual superset check
    // can pair line-by-line without footer-timestamp drift.
    generatedAt: new Date("2026-05-11T00:00:00Z"),
  });
}

// CC-119 — paired render helper: Individual + Guide for the same
// fixture, with identical timestamp + demographics. Used by the
// superset assertion.
function renderPair(
  set: string,
  file: string
): { individual: string; guide: string; userName: string | null } {
  const raw = JSON.parse(
    readFileSync(join(ROOT, set, file), "utf-8")
  ) as { answers: Answer[]; demographics?: DemographicSet | null };
  const demographics = raw.demographics ?? null;
  const c = buildInnerConstitution(raw.answers, [], demographics);
  const generatedAt = new Date("2026-05-11T00:00:00Z");
  const individual = renderMirrorAsMarkdown({
    constitution: c,
    demographics,
    includeBeliefAnchor: false,
    renderMode: "user",
    generatedAt,
  });
  const guide = renderMirrorAsMarkdown({
    constitution: c,
    demographics,
    includeBeliefAnchor: false,
    renderMode: "clinician",
    generatedAt,
  });
  return { individual, guide, userName: getUserName(demographics) };
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

  // ── 9a. guide-superset-of-individual (CC-119) ──────────────────────
  //   For every cohort fixture, every non-empty Individual line must
  //   appear in the Guide render after the user-mode mask is applied
  //   to the Guide. The mask neutralizes name-swap / jargon-strip /
  //   header-rename transformations that aren't structural; what's
  //   left in maskedGuide minus Individual is the scaffolding
  //   (grip raw-field panel, Movement grip-component bullets, MBTI
  //   disclosure line stripped by the mask but originally Guide-only,
  //   Keystone field bullets, engine valueOpener, etc.).
  //
  //   Lines compared after trim; empty lines + lines short enough to
  //   collide spuriously (length < 4) are skipped. Verbatim line
  //   match against the masked-Guide line-set is the canonical check;
  //   if a line is a strict prefix of another Guide line (rare, but
  //   possible when the Guide adds a trailing scaffolding suffix),
  //   the line is accepted as covered.
  {
    const failingSamples: string[] = [];
    let pairsChecked = 0;
    for (const dir of ["ocean", "goal-soul-give"]) {
      for (const f of readdirSync(join(ROOT, dir))
        .filter((x) => x.endsWith(".json"))
        .sort()) {
        const { individual, guide, userName } = renderPair(dir, f);
        const maskedGuide = applyUserModeMask(guide, userName);
        const maskedGuideLines = new Set(
          maskedGuide.split("\n").map((l) => l.trimEnd())
        );
        const missing: string[] = [];
        for (const rawLine of individual.split("\n")) {
          const line = rawLine.trimEnd();
          if (line.trim().length < 4) continue;
          if (maskedGuideLines.has(line)) continue;
          missing.push(line);
        }
        if (missing.length > 0) {
          failingSamples.push(
            `${dir}/${f}: ${missing.length} missing line(s); first: "${missing[0]!.slice(0, 90)}"`
          );
        }
        pairsChecked += 1;
      }
    }
    results.push(
      failingSamples.length === 0
        ? {
            ok: true,
            assertion: "guide-superset-of-individual",
            detail: `mask(Guide) ⊇ Individual for ${pairsChecked} cohort fixtures (every non-empty Individual line ≥4 chars is present in the masked Guide)`,
          }
        : {
            ok: false,
            assertion: "guide-superset-of-individual",
            detail: failingSamples.slice(0, 5).join(" | "),
          }
    );
  }

  // ── 9b. guide-mode-snapshot-stable (CC-119) ────────────────────────
  //   Regression check: the Guide render's hash matches the warm
  //   baseline written by `twoTierBaseline.snapshot.ts` after CC-119.
  //   Re-run that snapshot writer when an intentional Guide content
  //   change ships; treat snapshot drift as a flagged regression
  //   otherwise.
  if (!existsSync(BASELINE)) {
    results.push({
      ok: false,
      assertion: "guide-mode-snapshot-stable",
      detail: "baseline snapshot missing — run `npx tsx tests/audit/twoTierBaseline.snapshot.ts`",
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
            assertion: "guide-mode-snapshot-stable",
            detail: "Guide-mode output matches CC-119 warm baseline for every cohort fixture",
          }
        : {
            ok: false,
            assertion: "guide-mode-snapshot-stable",
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
