// CC-SMALL-FIXES-BUNDLE audit — five targeted surface fixes:
//   1. Pronoun consistency (no 3rd-person names in user-mode prose body)
//   2. Hands template parity across Jason / Cindy / Daniel archetypes
//   3. Each archetype canon phrase appears ≤ 1× per user-mode report
//   4. No "the the" double-article typo anywhere
//   5. No disposition per-trait stutter "*how you X* — How you X —"

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
  {
    id: "Jason",
    set: "ocean",
    file: "07-jason-real-session.json",
    canon: "translate conviction into visible, revisable, present-tense structure",
  },
  {
    id: "Cindy",
    set: "goal-soul-give",
    file: "01-generative.json",
    canon: "let love become sustainable enough to last",
  },
  {
    id: "Daniel",
    set: "ocean",
    file: "24-si-precedent-keeper.json",
    canon: "let what has endured remain alive enough to update",
  },
];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function renderUser(set: string, file: string): {
  userMd: string;
  clinMd: string;
  name: string | null;
} {
  const raw = JSON.parse(readFileSync(join(ROOT, set, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  const constitution = buildInnerConstitution(
    raw.answers,
    [],
    raw.demographics ?? null
  );
  const stamp = new Date("2026-05-13T00:00:00Z");
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
  const name =
    raw.demographics?.answers?.find((a) => a.field_id === "name" && a.state === "specified")
      ?.value ?? null;
  return { userMd, clinMd, name };
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

function extractHandsSection(md: string): string | null {
  const idx = md.indexOf("### Hands — Work");
  if (idx < 0) return null;
  const next = md.indexOf("\n### ", idx + 5);
  return md.slice(idx, next < 0 ? undefined : next);
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── 1. fix-1-no-third-person-name ──────────────────────────────────
  //   Across the full 24-fixture cohort in user mode, the user's first
  //   name does NOT appear in any line OTHER than the masthead's
  //   "For: {name}" display. Tier A LLM rewrites + Tier C fallback +
  //   substitutions are all expected second-person.
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const { userMd, name } = renderUser(fx.set, fx.file);
      if (!name) continue;
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b`, "g");
      const stripped = userMd
        .split("\n")
        .filter((l) => !l.includes(`For: ${name}`))
        .join("\n");
      if (re.test(stripped)) {
        failures.push(`${fx.set}/${fx.file} (name="${name}")`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix-1-no-third-person-name",
            detail: `24 cohort fixtures: 0 third-person name leaks in user-mode prose`,
          }
        : {
            ok: false,
            assertion: "fix-1-no-third-person-name",
            detail: `${failures.length} fixtures leak name: ${failures.slice(0, 3).join(", ")}`,
          }
    );
  }

  // ── 2. fix-2-hands-template-consistency ────────────────────────────
  //   Each archetype's user-mode Hands card contains the full template:
  //   sub-header + italic opener + Strength/Growth/Under Pressure/Practice
  //   bold-dash lines + 3 italic lines below Practice (explanation, canon
  //   closing, italic Work Map distinction trail).
  {
    const failures: string[] = [];
    for (const fx of CANONICAL_FIXTURES) {
      const { userMd } = renderUser(fx.set, fx.file);
      const section = extractHandsSection(userMd);
      if (!section) {
        failures.push(`${fx.id} (no Hands section)`);
        continue;
      }
      const missing: string[] = [];
      if (!section.includes("### Hands — Work")) missing.push("section header");
      if (!section.includes("**What you build and carry**")) missing.push("sub-header");
      if (!/\*\*Strength\*\* — /.test(section)) missing.push("Strength");
      if (!/\*\*Growth Edge\*\* — /.test(section)) missing.push("Growth Edge");
      if (!/\*\*Under Pressure\*\* — /.test(section)) missing.push("Under Pressure");
      if (!/\*\*Practice\*\* — /.test(section)) missing.push("Practice");
      // Italic trail (italicized Work Map distinction line)
      if (
        !/\*Hands is what your life makes real\. Work Map is where that making may fit\.\*/.test(
          section
        )
      ) {
        missing.push("italic Work Map distinction line");
      }
      // ≥ 2 italic-only lines in the window between **Practice** and the trail
      // (italic explanation + italic canon closing).
      const trailIdx = section.indexOf(
        "*Hands is what your life makes real. Work Map is where that making may fit.*"
      );
      const practiceIdx = section.lastIndexOf("**Practice** —");
      if (practiceIdx >= 0 && trailIdx > practiceIdx) {
        const window = section.slice(practiceIdx, trailIdx);
        const italicLines = window.match(/^\*[^*\n]+\*\s*$/gm) ?? [];
        if (italicLines.length < 2)
          missing.push(
            `italic explanation+canon closing (found ${italicLines.length})`
          );
      }
      if (missing.length > 0) {
        failures.push(`${fx.id} missing: ${missing.join(", ")}`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix-2-hands-template-consistency",
            detail: `Jason/Cindy/Daniel Hands cards contain the full template structure`,
          }
        : {
            ok: false,
            assertion: "fix-2-hands-template-consistency",
            detail: failures.join(" || "),
          }
    );
  }

  // ── 3. fix-3-canon-line-scarcity ───────────────────────────────────
  //   Each archetype's canon phrase appears ≤ 1× in the user-mode
  //   rendered report.
  {
    const failures: string[] = [];
    for (const fx of CANONICAL_FIXTURES) {
      const { userMd } = renderUser(fx.set, fx.file);
      const re = new RegExp(
        fx.canon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      const count = (userMd.match(re) ?? []).length;
      if (count > 1) {
        failures.push(`${fx.id} canon appears ${count}×`);
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix-3-canon-line-scarcity",
            detail: `each archetype canon ≤1× in user-mode report (Jason/Cindy/Daniel)`,
          }
        : {
            ok: false,
            assertion: "fix-3-canon-line-scarcity",
            detail: failures.join(", "),
          }
    );
  }

  // ── 4. fix-4-no-the-the-typo ───────────────────────────────────────
  //   Zero `\bthe the\b` (case-insensitive) across all 24 cohort
  //   fixtures in user mode AND in clinician mode (the typo lived in
  //   the engine template, no reason to retain it anywhere).
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const { userMd, clinMd } = renderUser(fx.set, fx.file);
      if (/\bthe the\b/i.test(userMd))
        failures.push(`${fx.set}/${fx.file} (user)`);
      if (/\bthe the\b/i.test(clinMd))
        failures.push(`${fx.set}/${fx.file} (clinician)`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix-4-no-the-the-typo",
            detail: `0 "the the" hits across 24 fixtures × 2 modes`,
          }
        : {
            ok: false,
            assertion: "fix-4-no-the-the-typo",
            detail: failures.slice(0, 4).join(", "),
          }
    );
  }

  // ── 5. fix-5-no-disposition-stutter ────────────────────────────────
  //   Zero "*how you X* — How you X —" stutter pattern across all 24
  //   cohort fixtures in user mode.
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const { userMd } = renderUser(fx.set, fx.file);
      const re = /\*how you [^*]+\* — How you [^*]+ —/g;
      const hits = (userMd.match(re) ?? []).length;
      if (hits > 0) failures.push(`${fx.set}/${fx.file} (${hits} stutters)`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix-5-no-disposition-stutter",
            detail: `0 disposition-stutter occurrences across 24 cohort user-mode renders`,
          }
        : {
            ok: false,
            assertion: "fix-5-no-disposition-stutter",
            detail: failures.slice(0, 3).join(", "),
          }
    );
  }

  // ── 6. clinician-mode-canon-and-fieldlist-preserved ────────────────
  //   For each canonical fixture in clinician mode: the canon phrase
  //   still appears (≥ 1×; clinician keeps the engine prose
  //   verbatim) AND the Keystone field-list is intact.
  {
    const failures: string[] = [];
    for (const fx of CANONICAL_FIXTURES) {
      const { clinMd } = renderUser(fx.set, fx.file);
      const re = new RegExp(
        fx.canon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      const canonCount = (clinMd.match(re) ?? []).length;
      if (canonCount < 1)
        failures.push(`${fx.id}: canon missing in clinician (${canonCount})`);
      if (!/^- \*\*Likely value:\*\*/m.test(clinMd))
        failures.push(`${fx.id}: clinician Keystone field-list missing`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "clinician-mode-canon-and-fieldlist-preserved",
            detail: `clinician mode retains engine canon + Keystone field-list across canonical fixtures`,
          }
        : {
            ok: false,
            assertion: "clinician-mode-canon-and-fieldlist-preserved",
            detail: failures.join(" || "),
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
    `CC-SMALL-FIXES-BUNDLE: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
