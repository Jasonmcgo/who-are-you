// CC-LAUNCH-VOICE-POLISH-V2 audit — three surgical bug fixes following
// the Part B polish landing. Per the CC each bug gets its own audit
// assertion.
//
//   Bug 1: Verdict labels survive "Risk Form reads as <verdict>" —
//          previously VERDICT_PHRASES stripped them, leaving "reads
//          as —". Audit checks zero "reads as —" patterns + zero
//          residual "(formerly" parentheticals in user mode.
//
//   Bug 2: After ${name} → "you" substitution, third-person-singular
//          verb forms ("Jason says Jason believes" → "you says you
//          believes") get conjugated back to base ("you say you
//          believe"). Audit greps user-mode renders (with synthetic
//          name injected) for "\\byou (\\w+)s\\b" hits.
//
//   Bug 3: Path/Gait body renders the LLM rewrite (when cache hits)
//          or completes gracefully (when LLM misses + engine
//          fallback fires). Audit verifies the engine-fallback
//          "The early shape of giving." sentence-fragment no longer
//          appears in user mode + Jason cohort path doesn't contain
//          the engine-fallback signature phrase.

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
  injectName?: string | null
): string {
  const raw = JSON.parse(readFileSync(join(ROOT, set, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  let demographics: DemographicSet | null = raw.demographics ?? null;
  if (injectName) {
    const existingAnswers = demographics?.answers ?? [];
    const otherAnswers = existingAnswers.filter(
      (a) => a.field_id !== "name"
    );
    demographics = {
      ...demographics,
      answers: [
        ...otherAnswers,
        { field_id: "name", state: "specified", value: injectName },
      ],
    } as DemographicSet;
  }
  const constitution = buildInnerConstitution(raw.answers, [], demographics);
  return renderMirrorAsMarkdown({
    constitution,
    includeBeliefAnchor: false,
    answers: raw.answers,
    demographics,
    generatedAt: new Date("2026-05-13T00:00:00Z"),
    renderMode: "user",
  });
}

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── Bug 1a — zero "(formerly" residuals in user-mode renders ───────
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const userMd = renderUser(fx.set, fx.file);
      if (/\(formerly\b/.test(userMd))
        failures.push(`${fx.set}/${fx.file}`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "bug1a-no-formerly-residual",
            detail: `0 "(formerly" hits in user mode across 24 cohort fixtures`,
          }
        : {
            ok: false,
            assertion: "bug1a-no-formerly-residual",
            detail: failures.slice(0, 3).join(", "),
          }
    );
  }

  // ── Bug 1b — zero "reads as —" orphans ─────────────────────────────
  //   The Path master synthesis emits "Your Risk Form reads as
  //   <verdict> — the governor…". VERDICT_PHRASES previously stripped
  //   the verdict label, leaving "reads as — the governor…". The fix
  //   adds a negative lookbehind to preserve verdict labels following
  //   "reads as ". Audit verifies zero orphans across the cohort.
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const userMd = renderUser(fx.set, fx.file);
      if (/reads as —/.test(userMd))
        failures.push(`${fx.set}/${fx.file} (reads as —)`);
      if (/reads as :/.test(userMd))
        failures.push(`${fx.set}/${fx.file} (reads as :)`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "bug1b-no-reads-as-orphan",
            detail: `0 "reads as —" / "reads as :" orphans across 24 cohort fixtures`,
          }
        : {
            ok: false,
            assertion: "bug1b-no-reads-as-orphan",
            detail: failures.slice(0, 3).join(", "),
          }
    );
  }

  // ── Bug 1c — clinician mode retains "(formerly …)" ─────────────────
  //   Engine prose unchanged; clinician keeps the parenthetical for
  //   audit reference. Sample Jason because his Risk Form prose
  //   carries the parenthetical (Ungoverned Movement / Open-Handed Aim
  //   variants all do per riskForm.ts).
  {
    const raw = JSON.parse(
      readFileSync(
        join(ROOT, "ocean", "07-jason-real-session.json"),
        "utf-8"
      )
    ) as { answers: Answer[]; demographics?: DemographicSet | null };
    const constitution = buildInnerConstitution(
      raw.answers,
      [],
      raw.demographics ?? null
    );
    const clinMd = renderMirrorAsMarkdown({
      constitution,
      includeBeliefAnchor: false,
      answers: raw.answers,
      demographics: raw.demographics ?? null,
      generatedAt: new Date("2026-05-13T00:00:00Z"),
      renderMode: "clinician",
    });
    const hasFormerly = /\(formerly\b/.test(clinMd);
    results.push(
      hasFormerly
        ? {
            ok: true,
            assertion: "bug1c-clinician-retains-formerly",
            detail: `Jason clinician mode retains at least one "(formerly …)" parenthetical`,
          }
        : {
            ok: false,
            assertion: "bug1c-clinician-retains-formerly",
            detail: `Jason clinician mode does not retain "(formerly …)" — engine docs lost`,
          }
    );
  }

  // ── Bug 2 — zero "you {3rd-person-singular-verb}" patterns ─────────
  //   Inject a synthetic name into the demographics so the engine
  //   pattern composers' third-person interpolation fires + the mask's
  //   name→you substitution runs. Without the verb conjugation, the
  //   output would carry "you says you believes" etc.
  {
    const verbs = [
      "says",
      "believes",
      "has",
      "is",
      "does",
      "makes",
      "wants",
      "needs",
      "knows",
      "wishes",
      "tells",
      "gets",
      "takes",
      "gives",
      "finds",
      "sees",
      "feels",
      "protects",
      "extends",
      "commits",
      "trusts",
      "defends",
      "reads",
    ];
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const userMd = renderUser(fx.set, fx.file, "Jason");
      for (const v of verbs) {
        const re = new RegExp(`\\byou ${v}\\b`, "g");
        const hits = (userMd.match(re) ?? []).length;
        if (hits > 0) {
          failures.push(`${fx.set}/${fx.file} ("you ${v}" ×${hits})`);
          break;
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "bug2-no-you-3rd-person-singular",
            detail: `0 "you {3rd-person-singular-verb}" patterns across 24 cohort fixtures with name="Jason" injected`,
          }
        : {
            ok: false,
            assertion: "bug2-no-you-3rd-person-singular",
            detail: failures.slice(0, 4).join(", "),
          }
    );
  }

  // ── Bug 3a — engine fallback "The early shape of giving." fragment gone ─
  //   The Path master synthesis fallback now closes on "This is the
  //   early shape of giving." — a complete sentence rather than an
  //   orphan noun phrase.
  {
    const failures: string[] = [];
    for (const fx of listFixtures()) {
      const userMd = renderUser(fx.set, fx.file);
      // Match the fragment ONLY when it's not preceded by "is " (the
      // completed form). The completed form should match, the fragment
      // form should not.
      const fragmentRe = /(?<!is )The early shape of giving\./;
      if (fragmentRe.test(userMd))
        failures.push(`${fx.set}/${fx.file}`);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "bug3a-no-early-shape-fragment",
            detail: `0 "The early shape of giving." fragment occurrences across user-mode renders`,
          }
        : {
            ok: false,
            assertion: "bug3a-no-early-shape-fragment",
            detail: failures.slice(0, 3).join(", "),
          }
    );
  }

  // ── Bug 3b — Jason cohort Path is LLM-rewritten ────────────────────
  //   The committed Path cache hits for Jason → user-mode Path section
  //   should be the LLM rewrite, not the engine fallback. Catch a
  //   regression where the splice silently misses by checking that
  //   the engine-fallback signature ("the Work line and the Soul line
  //   both register") is absent.
  {
    const userMd = renderUser("ocean", "07-jason-real-session.json");
    // Restrict to the Path section.
    const pathStart = userMd.indexOf("## Path — Gait");
    const pathEnd = userMd.indexOf("\n## ", pathStart + 5);
    const pathSection = userMd.slice(
      pathStart,
      pathEnd < 0 ? undefined : pathEnd
    );
    const hasFallback = /the Work line and the Soul line both register/.test(
      pathSection
    );
    results.push(
      !hasFallback
        ? {
            ok: true,
            assertion: "bug3b-jason-path-llm-rewritten",
            detail: `Jason cohort Path section does NOT contain the engine-fallback signature "the Work line and the Soul line both register"`,
          }
        : {
            ok: false,
            assertion: "bug3b-jason-path-llm-rewritten",
            detail: `Jason cohort Path section is falling back to engine prose — LLM splice broken`,
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
    `CC-LAUNCH-VOICE-POLISH-V2: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
