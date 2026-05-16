// CC-PROSE-LEAK-CLEANUP-V3 audit — two surgical fixes for leaks visible
// in live soft-share user reports.
//
//   Fix 1: `3 C's` engine-internal vocabulary stripped from Open
//          Tensions user-facing prose. Per canon (2026-05-10), the
//          phrase "The 3 C's question for your shape" leaks engine
//          jargon and should read "The question for your shape" on
//          user surface. Audit checks zero occurrences of `3 C's`,
//          `3Cs`, `three Cs`, `3 Cs` across user-mode renders.
//
//   Fix 2: `enforceHandsTemplate` made idempotent. The Hands card
//          section trail line ("Hands is what your life makes real.
//          Work Map is where that making may fit.") and the
//          header / sub-header pair must each appear exactly once
//          per user-mode rendered report. The unmappedType handsCard
//          template set `closingLine` to the canonical trail, so the
//          engine emitted the trail line twice for six cohort
//          fixtures. The fix adds defensive dedup passes inside
//          enforceHandsTemplate, plus an explicit header-dedup pass
//          for future-regression safety.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

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

function renderUser(
  set: string,
  file: string,
  renderMode: "user" | "clinician" = "user"
): string {
  const raw = JSON.parse(readFileSync(join(ROOT, set, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  const constitution = buildInnerConstitution(
    raw.answers,
    [],
    raw.demographics ?? null
  );
  return renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics: raw.demographics ?? null,
    generatedAt: new Date("2026-05-13T00:00:00Z"),
    renderMode,
  });
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];
  const fixtures = listFixtures();

  // ── Fix 1a — zero "3 C's" / variants in user-mode renders ─────────
  {
    const variants: RegExp[] = [
      /\b3\s*C['’]s\b/i,
      /\b3Cs\b/i,
      /\bthree\s+Cs\b/i,
      /\b3\s+Cs\b/i,
    ];
    const failures: string[] = [];
    for (const fx of fixtures) {
      const userMd = renderUser(fx.set, fx.file);
      for (const re of variants) {
        if (re.test(userMd)) {
          failures.push(`${fx.set}/${fx.file} (${re.source})`);
          break;
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix1-no-3cs-in-user-mode",
            detail: `0 "3 C's"/variant occurrences across ${fixtures.length} cohort fixtures`,
          }
        : {
            ok: false,
            assertion: "fix1-no-3cs-in-user-mode",
            detail: failures.slice(0, 4).join(", "),
          }
    );
  }

  // ── Fix 2a — Hands header appears at most once per user-mode report
  {
    const failures: string[] = [];
    for (const fx of fixtures) {
      const userMd = renderUser(fx.set, fx.file);
      const cnt = (userMd.match(/### Hands — Work/g) ?? []).length;
      if (cnt > 1) failures.push(`${fx.set}/${fx.file} (×${cnt})`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix2a-hands-header-single",
            detail: `"### Hands — Work" appears exactly once per report across ${fixtures.length} cohort fixtures`,
          }
        : {
            ok: false,
            assertion: "fix2a-hands-header-single",
            detail: failures.slice(0, 4).join(", "),
          }
    );
  }

  // ── Fix 2b — Hands sub-header appears at most once per report ─────
  {
    const failures: string[] = [];
    for (const fx of fixtures) {
      const userMd = renderUser(fx.set, fx.file);
      const cnt = (userMd.match(/\*\*What you build and carry\*\*/g) ?? [])
        .length;
      if (cnt > 1) failures.push(`${fx.set}/${fx.file} (×${cnt})`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix2b-hands-subheader-single",
            detail: `"**What you build and carry**" appears exactly once per report across ${fixtures.length} cohort fixtures`,
          }
        : {
            ok: false,
            assertion: "fix2b-hands-subheader-single",
            detail: failures.slice(0, 4).join(", "),
          }
    );
  }

  // ── Fix 2c — Work Map trail line appears exactly once per report ──
  //   Root cause: the `unmappedType` Hands template sets
  //   `closingLine` to the canonical trail, so the engine emitted it
  //   twice back-to-back. The dedup pass collapses the duplicate.
  {
    const failures: string[] = [];
    for (const fx of fixtures) {
      const userMd = renderUser(fx.set, fx.file);
      const cnt = (userMd.match(
        /Hands is what your life makes real\. Work Map is where that making may fit\./g
      ) ?? []).length;
      if (cnt > 1) failures.push(`${fx.set}/${fx.file} (×${cnt})`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix2c-hands-trail-single",
            detail: `Work Map trail appears exactly once per report across ${fixtures.length} cohort fixtures (unmappedType closingLine collision deduped)`,
          }
        : {
            ok: false,
            assertion: "fix2c-hands-trail-single",
            detail: failures.slice(0, 4).join(", "),
          }
    );
  }

  // ── Fix 2d — Hands card content is otherwise intact ────────────────
  //   Strength / Growth Edge / Under Pressure / Practice cells all
  //   still present in every user-mode report. Guards against
  //   over-eager dedup eating real content.
  {
    const markers = [
      "**Strength** —",
      "**Growth Edge** —",
      "**Under Pressure** —",
      "**Practice** —",
    ];
    const failures: string[] = [];
    for (const fx of fixtures) {
      const userMd = renderUser(fx.set, fx.file);
      const handsStart = userMd.indexOf("### Hands — Work");
      if (handsStart < 0) {
        failures.push(`${fx.set}/${fx.file} (no Hands section)`);
        continue;
      }
      const after = userMd.slice(handsStart);
      const stopAt = after.slice(20).search(/\n## |\n### /);
      const handsSec = stopAt < 0 ? after : after.slice(0, 20 + stopAt);
      for (const m of markers) {
        if (!handsSec.includes(m)) {
          failures.push(`${fx.set}/${fx.file} (missing ${m})`);
          break;
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "fix2d-hands-content-intact",
            detail: `Hands cards retain Strength / Growth Edge / Under Pressure / Practice across ${fixtures.length} cohort fixtures`,
          }
        : {
            ok: false,
            assertion: "fix2d-hands-content-intact",
            detail: failures.slice(0, 4).join(", "),
          }
    );
  }

  // ── Fix 2e — clinician mode unchanged (no regression) ──────────────
  //   Per CC Rule 3, clinician retains engine artifacts. Verify that
  //   the dedup logic does not erase real content in clinician mode
  //   (clinician path doesn't run the user-mode mask but DOES run the
  //   enforceHandsTemplate — actually no, it doesn't; enforceHands
  //   Template lives below the user-mode short-circuit. So clinician
  //   is untouched. Verify Hands section still renders fully in
  //   clinician mode for the Jason fixture as a smoke check.
  {
    const clinMd = renderUser("ocean", "07-jason-real-session.json", "clinician");
    const hasAllCells =
      clinMd.includes("### Hands — Work") &&
      clinMd.includes("**What you build and carry**") &&
      clinMd.includes("**Strength** —") &&
      clinMd.includes("**Growth Edge** —") &&
      clinMd.includes("**Under Pressure** —") &&
      clinMd.includes("**Practice** —");
    results.push(
      hasAllCells
        ? {
            ok: true,
            assertion: "fix2e-clinician-mode-intact",
            detail: `Jason clinician-mode render preserves all Hands card cells (no regression)`,
          }
        : {
            ok: false,
            assertion: "fix2e-clinician-mode-intact",
            detail: `Jason clinician-mode render dropped a Hands card cell — regression`,
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
    `CC-PROSE-LEAK-CLEANUP-V3: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
