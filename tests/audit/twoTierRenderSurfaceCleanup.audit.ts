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
//   9b. guide-contains-expected-sections (CC-121) — replaces the
//       byte-hash `guide-mode-snapshot-stable` assertion. The byte-hash
//       check flapped at CC-116/119/120 (baseline written warm vs.
//       audit run cold). Structural check: the Guide render contains
//       every canonical top-level section + the clinician-only
//       scaffolding markers. Prose-content stability is now governed
//       by the per-section LLM rewrite prompts (CC-121) + the
//       `regen-cache.sh` runbook, not by a byte-snapshot audit.
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
//   9b. guide-contains-expected-sections — Guide carries the canonical
//       top-level sections + clinician-only scaffolding markers
//       (CC-121, replaces the prior byte-hash check).
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

  // ── 9a. individual-topics-covered-in-guide (CC-132 reframe) ─────────
  //   CC-132 rebuilt the Individual to the 11-section "50° Life" outline.
  //   Several new presentational structures (the four-forces table, the
  //   GRIP SAYS / AIM SAYS table, the eight one-line Body Cards) are
  //   net-new shapes that aren't byte-present in the Guide — the byte-
  //   subset check (the old guide-superset-of-individual assertion) would
  //   fail by design even when the warm prose itself is shared.
  //
  //   New shape: topic coverage. For every cohort fixture, every
  //   *finding* surfaced in the Individual (each of the 8 body card
  //   registers, each of the 4 forces, keystone, tensions, next moves,
  //   closing) must also be covered by name in the Guide render.
  //   Coverage is a substring presence check — the Guide's narrative
  //   form names the topic; the Individual's presentational form names
  //   the same topic in a different layout. Topics are checked against
  //   the masked Guide to neutralize jargon-strip / name-swap noise
  //   that isn't structural.
  {
    // Topics every Individual surfaces; every Guide must carry each by
    // name. The 8 body card names + the 4 forces + structural anchors.
    const REQUIRED_TOPICS_IN_GUIDE = [
      // 8 body card names (Guide emits them as section/card headers).
      "Lens", "Compass", "Hands", "Conviction", "Gravity", "Trust", "Weather", "Fire",
      // 4 forces (Guide emits as Movement metric bullets: **Goal:**, **Soul:**, **Aim:**, **Grip:**).
      "**Goal:**", "**Soul:**", "**Aim:**", "**Grip:**",
      // Structural anchors.
      "Keystone Reflection",
      "Open Tensions",
      "Next 3 Moves",
      "Closing Read",
    ];
    const failingSamples: string[] = [];
    let pairsChecked = 0;
    for (const dir of ["ocean", "goal-soul-give"]) {
      for (const f of readdirSync(join(ROOT, dir))
        .filter((x) => x.endsWith(".json"))
        .sort()) {
        const { individual, guide, userName } = renderPair(dir, f);
        const maskedGuide = applyUserModeMask(guide, userName);
        const missingTopics: string[] = [];
        for (const topic of REQUIRED_TOPICS_IN_GUIDE) {
          // Topic must appear in the Guide IF (and only if) it also
          // appears in the Individual. Conditional sections (e.g.,
          // Keystone when belief_under_tension is null; Open Tensions
          // when no tensions fire) drop from BOTH surfaces in lock-
          // step — the additive contract holds only on emitted topics.
          if (!individual.includes(topic)) continue;
          if (!guide.includes(topic) && !maskedGuide.includes(topic)) {
            missingTopics.push(topic);
          }
        }
        if (missingTopics.length > 0) {
          failingSamples.push(
            `${dir}/${f}: ${missingTopics.length} topic(s) absent from Guide; first: "${missingTopics[0]}"`
          );
        }
        pairsChecked += 1;
      }
    }
    results.push(
      failingSamples.length === 0
        ? {
            ok: true,
            assertion: "individual-topics-covered-in-guide",
            detail: `Guide carries every required Individual topic (${REQUIRED_TOPICS_IN_GUIDE.length} anchors) across ${pairsChecked} cohort fixtures`,
          }
        : {
            ok: false,
            assertion: "individual-topics-covered-in-guide",
            detail: failingSamples.slice(0, 5).join(" | "),
          }
    );
  }

  // ── 9b. guide-contains-expected-sections (CC-121) ──────────────────
  //   Structural regression check, replacing the CC-119 byte-hash
  //   `guide-mode-snapshot-stable` assertion. The byte-hash check
  //   pinned LLM-cached prose and flapped at CC-116/119/120 (baseline
  //   written warm vs. audit run cold; engine drift between commits
  //   shifting prose without changing length). The meaningful Guide
  //   guarantees are:
  //     (a) Guide ⊇ Individual at the line level → `guide-superset-of-
  //         individual` (9a), and
  //     (b) the Guide carries every canonical top-level section + the
  //         clinician-only scaffolding markers → THIS assertion.
  //   Prose-content stability inside a section is governed by the
  //   per-section LLM rewrite prompts (CC-121); regen via the
  //   `regen-cache.sh` runbook is the right place to re-pin warm prose,
  //   not a byte-snapshot audit.
  //
  //   The `twoTierBaseline.snapshot.json` file is intentionally left in
  //   place for forensic diff use during regen cycles; this assertion
  //   no longer reads it. The snapshot writer at
  //   `tests/audit/twoTierBaseline.snapshot.ts` remains callable and
  //   useful for that forensic comparison.
  {
    // Sections present in the Guide render of ALL 24 cohort fixtures
    // (verified empirically). Conditional sections — "## Your Grip"
    // (when grip taxonomy yields a renderable bucket), "## Keystone
    // Reflection" (when the user wrote a belief), "## A Synthesis"
    // (when summary parts emit), "## Next Moves" (when the engine
    // attached the release-mechanism prose) — are NOT required here
    // because they don't always emit. The four explicitly-Guide-only
    // sections (Disposition Signal Mix — header renamed by the user-
    // mask, Conflict Translation + Mirror-Types Seed + "What this is
    // good for" — gated to clinician by CC-120) are included in this
    // set and act as the Guide-only scaffolding markers; their
    // presence confirms the additive contract holds at the section
    // level.
    const REQUIRED_GUIDE_SECTIONS: string[] = [
      "## Closing Read",
      "## Conflict Translation", // Guide-only (CC-120)
      "## Core Signal Map",
      "## Disposition Signal Mix", // Guide-only (mask renames in user)
      "## Executive Read",
      "## Love Map",
      "## Map — go deeper",
      "## Mirror-Types Seed", // Guide-only (CC-120)
      "## Movement",
      "## Open Tensions",
      "## Path — Gait",
      "## What Others May Experience",
      "## What this is good for.", // Guide-only (CC-120)
      "## When the Load Gets Heavy",
      "## Work Map",
      "## Your Core Pattern",
      "## Your Next 3 Moves",
      "## Your Top Gifts and Growth Edges",
    ];

    const missingFails: string[] = [];
    for (const dir of ["ocean", "goal-soul-give"]) {
      for (const f of readdirSync(join(ROOT, dir))
        .filter((x) => x.endsWith(".json"))
        .sort()) {
        const md = renderClinician(dir, f);
        const missing: string[] = [];
        for (const header of REQUIRED_GUIDE_SECTIONS) {
          if (!md.includes(header)) missing.push(header);
        }
        if (missing.length > 0) {
          missingFails.push(
            `${dir}/${f}: missing ${missing.length} section(s); first: "${missing[0]}"`
          );
        }
      }
    }
    results.push(
      missingFails.length === 0
        ? {
            ok: true,
            assertion: "guide-contains-expected-sections",
            detail: `Guide render contains all ${REQUIRED_GUIDE_SECTIONS.length} canonical top-level sections (including the 4 Guide-only sections that act as additive-contract scaffolding markers) for every cohort fixture`,
          }
        : {
            ok: false,
            assertion: "guide-contains-expected-sections",
            detail: missingFails.slice(0, 5).join(" | "),
          }
    );
  }
  // CC-121 — the BASELINE constant + the createHash import + the
  // existsSync / readFileSync uses for the baseline file are now
  // unreachable here. They're left in place so the snapshot writer
  // (twoTierBaseline.snapshot.ts) and forensic regen-time diffs can
  // still consume them without an audit re-edit. Intentional dead
  // code in this file. (Flag for cleanup if the snapshot.ts file is
  // ever retired.)
  void BASELINE;
  void existsSync;
  void hash;

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
