// CC-SUBSTITUTION-LEAK-CLEANUP audit — six site-specific leak fixes
// caused by CC-TWO-TIER strips/renames in user-mode rendered markdown.
// Three layers per site: (1) the specific leak fragment is absent in
// user mode, (2) the original phrase is preserved byte-identical in
// clinician mode (where applicable), and (3) the user-mode site contains
// the substituted replacement phrase.
//
// Plus generic structural grammar gates across the full user-mode
// render of three canonical fixtures (orphan articles, "the and"
// fragments, table-cell orphan commas, repeated whole phrases, dangling
// prepositions).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

const CANONICAL_FIXTURES = [
  { id: "Jason", set: "ocean", file: "07-jason-real-session.json" },
  { id: "Cindy", set: "goal-soul-give", file: "01-generative.json" },
  { id: "Daniel", set: "ocean", file: "24-si-precedent-keeper.json" },
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function buildRenders(set: string, file: string) {
  const raw = JSON.parse(readFileSync(join(ROOT, set, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  const constitution = buildInnerConstitution(
    raw.answers,
    [],
    raw.demographics ?? null
  );
  const stamp = new Date("2026-05-12T00:00:00Z");
  const userMd = renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics: raw.demographics ?? null,
    generatedAt: stamp,
    renderMode: "user",
  });
  const clinMd = renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics: raw.demographics ?? null,
    generatedAt: stamp,
    renderMode: "clinician",
  });
  return { userMd, clinMd };
}

function listFixtures(): Array<{ set: string; file: string }> {
  const out: Array<{ set: string; file: string }> = [];
  for (const set of ["ocean", "goal-soul-give"]) {
    const dir = join(ROOT, set);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      out.push({ set, file: f });
    }
  }
  return out;
}

// Banned-term watchlist from CC-TWO-TIER — these must not reappear in
// user-mode prose. Verifies the substitution replacements don't
// reintroduce a borrowed-system term.
const BANNED_REINTRO = [
  /\bBig Five\b/,
  /\bOCEAN\b/i,
  /\b(INTJ|INTP|INFJ|INFP|ISTJ|ISTP|ISFJ|ISFP|ENTJ|ENTP|ENFJ|ENFP|ESTJ|ESTP|ESFJ|ESFP)\b/,
  /\bcomposite read\b/,
  /\bdisposition channel\b/,
  /\bFaith Shape\b/,
  /\bFaith Texture\b/,
];

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // Precompute renders for canonical fixtures
  const renders = CANONICAL_FIXTURES.map((fx) => ({
    fx,
    ...buildRenders(fx.set, fx.file),
  }));

  // ── 1. leak-1-core-signal-map-no-orphan-comma ──────────────────────
  //   User mode: Surface-label cell renders as "provisional" alone,
  //   not "INTJ, provisional" (stripped) → ", provisional" orphan.
  {
    const failures: string[] = [];
    for (const r of renders) {
      if (/\|\s*,\s*provisional/.test(r.userMd)) {
        failures.push(r.fx.id);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "leak-1-core-signal-map-no-orphan-comma",
            detail: `Surface-label cell renders without orphan comma in user mode (${renders.length} fixtures)`,
          }
        : {
            ok: false,
            assertion: "leak-1-core-signal-map-no-orphan-comma",
            detail: `${failures.length} fixtures leak: ${failures.join(", ")}`,
          }
    );
  }

  // ── 2. leak-1-core-signal-map-clinician-preserves-mbti ─────────────
  //   Clinician mode: Surface-label cell still contains the four-letter
  //   code prefix when stack confidence is high. Tested via Jason
  //   (known high-confidence INTJ).
  {
    const jason = renders.find((r) => r.fx.id === "Jason")!;
    const hasMbti = /\|\s*[IE][NS][TF][JP],\s*provisional\s*\|/.test(jason.clinMd);
    results.push(
      hasMbti
        ? {
            ok: true,
            assertion: "leak-1-core-signal-map-clinician-preserves-mbti",
            detail: `Jason clinician Surface-label cell preserves "<MBTI>, provisional"`,
          }
        : {
            ok: false,
            assertion: "leak-1-core-signal-map-clinician-preserves-mbti",
            detail: `Jason clinician Surface-label cell does not contain "<MBTI>, provisional"`,
          }
    );
  }

  // ── 3. leak-2-work-map-no-orphan-verb ──────────────────────────────
  //   User mode: Work Map prose reads "Your answers point toward …",
  //   never "Your points toward …" (the strip-leaked verb).
  {
    const failures: string[] = [];
    for (const r of renders) {
      if (/\bYour points toward\b/.test(r.userMd)) failures.push(r.fx.id);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "leak-2-work-map-no-orphan-verb",
            detail: `"Your points toward" fragment absent across canonical fixtures`,
          }
        : {
            ok: false,
            assertion: "leak-2-work-map-no-orphan-verb",
            detail: `${failures.length} fixtures still leak: ${failures.join(", ")}`,
          }
    );
  }

  // ── 4. leak-2-work-map-clinician-preserves-composite-read ──────────
  {
    const failures: string[] = [];
    for (const r of renders) {
      if (!/\bYour composite read points toward\b/.test(r.clinMd)) {
        failures.push(r.fx.id);
      }
    }
    // Some fixtures may not have a workMap match → no work prose. Only
    // gate on at least one of three having the line.
    const anyHasIt = renders.some((r) =>
      /\bYour composite read points toward\b/.test(r.clinMd)
    );
    results.push(
      anyHasIt
        ? {
            ok: true,
            assertion: "leak-2-work-map-clinician-preserves-composite-read",
            detail: `clinician mode retains "Your composite read points toward …" verbatim`,
          }
        : {
            ok: false,
            assertion: "leak-2-work-map-clinician-preserves-composite-read",
            detail: `no clinician render preserves the "Your composite read points toward" phrasing`,
          }
    );
  }

  // ── 5. leak-3-keystone-no-field-list-in-user-mode ──────────────────
  //   CC-KEYSTONE-RENDER's wire-up already eliminates the Keystone
  //   field-list in user mode. Verify no "<…> to revision:" bullet
  //   appears (mask-rename-safe check).
  {
    const failures: string[] = [];
    const RE = /^- \*\*[^*\n]*to revision:\*\*/m;
    for (const r of renders) {
      const idx = r.userMd.indexOf("## Keystone Reflection");
      if (idx < 0) continue;
      const end = r.userMd.indexOf("\n## ", idx + 30);
      const section = r.userMd.slice(idx, end < 0 ? undefined : end);
      if (RE.test(section)) failures.push(r.fx.id);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "leak-3-keystone-no-field-list-in-user-mode",
            detail: `no "<x> to revision:" bullet in user-mode Keystone across canonical fixtures`,
          }
        : {
            ok: false,
            assertion: "leak-3-keystone-no-field-list-in-user-mode",
            detail: `${failures.length} fixtures leak: ${failures.join(", ")}`,
          }
    );
  }

  // ── 6. leak-3-keystone-clinician-preserves-openness-to-revision ────
  //   Clinician mode: field label reads "Openness to revision:" (not
  //   the user-mode-rename-mangled form).
  {
    const failures: string[] = [];
    for (const r of renders) {
      const idx = r.clinMd.indexOf("## Keystone Reflection");
      if (idx < 0) continue;
      const end = r.clinMd.indexOf("\n## ", idx + 30);
      const section = r.clinMd.slice(idx, end < 0 ? undefined : end);
      if (!section.includes("- **Openness to revision:**")) {
        failures.push(r.fx.id);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "leak-3-keystone-clinician-preserves-openness-to-revision",
            detail: `clinician mode preserves "**Openness to revision:**" verbatim across canonical fixtures`,
          }
        : {
            ok: false,
            assertion: "leak-3-keystone-clinician-preserves-openness-to-revision",
            detail: `${failures.length} fixtures missing clinician label: ${failures.join(", ")}`,
          }
    );
  }

  // ── 7. leak-4-disposition-openness-no-adjective-leak ───────────────
  //   User mode: "Architectural How you take in new things paired with"
  //   fragment never appears.
  {
    const failures: string[] = [];
    for (const r of renders) {
      if (/Architectural How you take in new things paired/.test(r.userMd)) {
        failures.push(r.fx.id);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "leak-4-disposition-openness-no-adjective-leak",
            detail: `"Architectural How you take in new things paired" fragment absent`,
          }
        : {
            ok: false,
            assertion: "leak-4-disposition-openness-no-adjective-leak",
            detail: `${failures.length} fixtures leak: ${failures.join(", ")}`,
          }
    );
  }

  // ── 8. leak-5-disposition-conscientiousness-no-fragment ────────────
  //   User mode: "The for your output we read elsewhere" fragment
  //   never appears (was from disposition-channel + Work-line dual
  //   strip).
  {
    const failures: string[] = [];
    for (const r of renders) {
      if (/The for your output we read elsewhere/.test(r.userMd)) {
        failures.push(r.fx.id);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "leak-5-disposition-conscientiousness-no-fragment",
            detail: `"The for your output we read elsewhere" fragment absent`,
          }
        : {
            ok: false,
            assertion: "leak-5-disposition-conscientiousness-no-fragment",
            detail: `${failures.length} fixtures leak: ${failures.join(", ")}`,
          }
    );
  }

  // ── 9. leak-6-appendix-faith-no-the-and-fragment ───────────────────
  //   User mode: "the and composing in your read" fragment never
  //   appears (was from Faith Shape + Faith Texture dual strip).
  {
    const failures: string[] = [];
    for (const r of renders) {
      if (/\bthe and composing in your read\b/.test(r.userMd)) {
        failures.push(r.fx.id);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "leak-6-appendix-faith-no-the-and-fragment",
            detail: `"the and composing in your read" fragment absent`,
          }
        : {
            ok: false,
            assertion: "leak-6-appendix-faith-no-the-and-fragment",
            detail: `${failures.length} fixtures leak: ${failures.join(", ")}`,
          }
    );
  }

  // ── 10. generic-orphan-article-clean ────────────────────────────────
  //   Generic grammatical check across the canonical fixtures: no
  //   orphan-article patterns ("The for", "the and") in user mode.
  //   Catches future regressions from new strip/rename patterns.
  {
    const ORPHANS = [
      /\bThe (for|and|of|with|to|by|in|on|at) /g,
      /\bthe and /g,
    ];
    const failures: string[] = [];
    for (const r of renders) {
      for (const re of ORPHANS) {
        const matches = [...r.userMd.matchAll(re)];
        for (const m of matches) {
          // Permit "the and" inside the Keystone LLM prose if it ever
          // appears (LLMs occasionally produce it for stylistic reasons)
          // — but this is rare and any hit should be inspected.
          failures.push(
            `${r.fx.id}: "${m[0]}" at char ${m.index} (context: "${r.userMd.slice(Math.max(0, m.index! - 20), m.index! + 30)}")`
          );
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "generic-orphan-article-clean",
            detail: `no orphan-article patterns across canonical fixtures user-mode renders`,
          }
        : {
            ok: false,
            assertion: "generic-orphan-article-clean",
            detail: `${failures.length} hits: ${failures.slice(0, 3).join(" || ")}`,
          }
    );
  }

  // ── 11. generic-table-cell-orphan-comma-clean ──────────────────────
  //   No table cell of the form `|\s*,\s*<word>` (catches the surface-
  //   label leak class).
  {
    const failures: string[] = [];
    const RE = /\|\s*,\s*[A-Za-z]/g;
    for (const r of renders) {
      const matches = [...r.userMd.matchAll(RE)];
      for (const m of matches) {
        failures.push(`${r.fx.id}: "${m[0]}"`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "generic-table-cell-orphan-comma-clean",
            detail: `no "| , <word>" orphan-comma table cells across canonical user-mode renders`,
          }
        : {
            ok: false,
            assertion: "generic-table-cell-orphan-comma-clean",
            detail: `${failures.length} hits: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 12. no-banned-term-reintroduced ─────────────────────────────────
  //   User mode must not contain any term from the TWO-TIER suppression
  //   list. Verifies the new CONTEXT_SUBSTITUTIONS don't leak banned
  //   vocabulary through a longer phrase. The masthead's "Possible
  //   surface label: <MBTI>." line is the explicitly-protected disclosure
  //   surface for the four-letter code — those lines are excluded from
  //   this check (the disclaimer immediately following is the canonical
  //   user-mode hedge for MBTI).
  {
    const failures: string[] = [];
    for (const r of renders) {
      const stripped = r.userMd
        .split("\n")
        .filter((line) => !line.includes("Possible surface label"))
        .join("\n");
      for (const re of BANNED_REINTRO) {
        const m = stripped.match(re);
        if (m) failures.push(`${r.fx.id}: "${m[0]}"`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "no-banned-term-reintroduced",
            detail: `no TWO-TIER banned terms reintroduced in canonical user-mode renders (masthead disclosure exempted)`,
          }
        : {
            ok: false,
            assertion: "no-banned-term-reintroduced",
            detail: `${failures.length} hits: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 13. cohort-sweep-no-leak-fragments ──────────────────────────────
  //   Full 24-fixture cohort user-mode sweep: none of the six known
  //   leak fragments appear in any fixture.
  {
    const LEAK_PROBES: Array<{ name: string; re: RegExp }> = [
      { name: "L1 (|, provisional)", re: /\|, provisional/ },
      { name: "L2 (Your points toward)", re: /\bYour points toward\b/ },
      { name: "L4 (Architectural How you take)", re: /Architectural How you take/ },
      { name: "L5 (The for your output)", re: /The for your output/ },
      { name: "L6 (the and composing)", re: /\bthe and composing\b/ },
    ];
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const { userMd } = buildRenders(fx.set, fx.file);
      for (const p of LEAK_PROBES) {
        if (p.re.test(userMd)) {
          failures.push(`${fx.set}/${fx.file} (${p.name})`);
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "cohort-sweep-no-leak-fragments",
            detail: `none of 5 known leak fragments appear in any of 24 cohort user-mode renders`,
          }
        : {
            ok: false,
            assertion: "cohort-sweep-no-leak-fragments",
            detail: `${failures.length} hits: ${failures.slice(0, 4).join(", ")}`,
          }
    );
  }

  // ── 14. substitution-replacement-text-present ───────────────────────
  //   Each substitution's replacement appears in at least one canonical
  //   fixture user-mode render, proving the substitution fires (vs.
  //   trivially passing because the source phrase wasn't in any render).
  //   Note: leak 1 (provisional) is verified in #1/#2 already.
  {
    const REPLACEMENTS: Array<{ name: string; phrase: string }> = [
      { name: "L2", phrase: "Your answers point toward" },
      { name: "L4", phrase: "Architectural curiosity paired with" },
      { name: "L5", phrase: "Your output channel echoes the Work-line we read elsewhere" },
      { name: "L6", phrase: "the way you hold belief under pressure tells you" },
    ];
    const failures: string[] = [];
    // Search all cohort fixtures since some replacements may not fire
    // for canonical 3 (e.g. agreeableness-led fixtures don't hit the
    // Disposition Openness path).
    const cohortRenders = listFixtures().map((fx) => buildRenders(fx.set, fx.file));
    for (const rep of REPLACEMENTS) {
      const hits = cohortRenders.filter((r) => r.userMd.includes(rep.phrase)).length;
      if (hits === 0) failures.push(`${rep.name}: "${rep.phrase}" appears in 0 fixtures`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "substitution-replacement-text-present",
            detail: `all 4 replacement phrases fire in ≥1 cohort fixture`,
          }
        : {
            ok: false,
            assertion: "substitution-replacement-text-present",
            detail: failures.join(", "),
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
  console.log(
    `CC-SUBSTITUTION-LEAK-CLEANUP: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
