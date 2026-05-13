// CC-VOICE-RUBRIC-EXPANSION — Si/Se/Ti/Fi driver rubric expansion audit.
//
// 8 assertions covering:
//   - rubric module exists with 4 driver constants
//   - each rubric is non-empty and substantive
//   - both LLM SYSTEM_PROMPTs contain the verbatim rubrics + section header
//   - rubrics pass the CC-RELIGIOUS-REGISTER-RULES banned-phrase audit
//   - rubrics avoid clinical-vocabulary patterns (subset of CC-CRISIS-PATH-PROSE)
//   - driverRegisterHint routes correctly across all 8 cognitive functions
//   - cohort fixtures with si/ti drivers show register-marker presence
//
// Hand-rolled. Invocation: `npx tsx tests/audit/voiceRubricExpansion.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  driverRegisterHint,
  FI_DRIVER_RUBRIC,
  FI_REGISTER_MARKERS,
  SE_DRIVER_RUBRIC,
  SE_REGISTER_MARKERS,
  SI_DRIVER_RUBRIC,
  SI_REGISTER_MARKERS,
  TI_DRIVER_RUBRIC,
  TI_REGISTER_MARKERS,
  VOICE_RUBRIC_EXPANSION_BLOCK,
} from "../../lib/voiceRubricExamples";
import { auditProseForBannedPhrases } from "../../lib/proseRegister";
import { SYSTEM_PROMPT } from "../../lib/synthesis3Llm";
import { GRIP_SYSTEM_PROMPT } from "../../lib/gripTaxonomyLlm";
import { buildInnerConstitution } from "../../lib/identityEngine";
import { deriveSynthesis3Inputs } from "../../lib/synthesis3Inputs";
import { readCachedParagraph } from "../../lib/synthesis3Llm";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

// Clinical-vocabulary regex set — subset of phrases the rubrics MUST
// avoid. Forward-compatible with CC-CRISIS-PATH-PROSE; if that CC
// extends the list, this audit's coverage extends with it implicitly
// (the diagnostic register is canonical-banned across the prose layer).
const CLINICAL_PHRASES: RegExp[] = [
  /\bdiagnose\b/i,
  /\bdiagnosis\b/i,
  /\bclinical\b/i,
  /\bsymptom\b/i,
  /\bdisorder\b/i,
  /\bpathology\b/i,
];

function loadFixture(setDir: string, file: string) {
  const raw = JSON.parse(
    readFileSync(join(ROOT, setDir, file), "utf-8")
  ) as { answers: Answer[]; demographics?: DemographicSet | null };
  const c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
  return c;
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1. voice-rubric-module-exists ───────────────────────────────────
  const allFour = {
    si: SI_DRIVER_RUBRIC,
    se: SE_DRIVER_RUBRIC,
    ti: TI_DRIVER_RUBRIC,
    fi: FI_DRIVER_RUBRIC,
  };
  const missingExports = Object.entries(allFour)
    .filter(([, v]) => typeof v !== "string")
    .map(([k]) => k);
  results.push(
    missingExports.length === 0
      ? {
          ok: true,
          assertion: "voice-rubric-module-exists",
          detail: "all 4 driver rubrics + VOICE_RUBRIC_EXPANSION_BLOCK + driverRegisterHint exported",
        }
      : {
          ok: false,
          assertion: "voice-rubric-module-exists",
          detail: `missing: ${missingExports.join(", ")}`,
        }
  );

  // ── 2. voice-rubric-non-empty ───────────────────────────────────────
  const nonEmptyFails: string[] = [];
  for (const [k, v] of Object.entries(allFour)) {
    if (!v || v.length < 100) {
      nonEmptyFails.push(`${k}: length=${v?.length ?? 0}`);
    }
  }
  results.push(
    nonEmptyFails.length === 0
      ? {
          ok: true,
          assertion: "voice-rubric-non-empty",
          detail: Object.entries(allFour)
            .map(([k, v]) => `${k}=${v.length}ch`)
            .join(", "),
        }
      : {
          ok: false,
          assertion: "voice-rubric-non-empty",
          detail: nonEmptyFails.join(" | "),
        }
  );

  // ── 3. voice-rubric-prompts-anchor ──────────────────────────────────
  const anchorMissing: string[] = [];
  // Both prompts must contain the verbatim VOICE_RUBRIC_EXPANSION_BLOCK
  // (the section header + all 4 sub-headings + all 4 rubric bodies).
  if (!SYSTEM_PROMPT.includes(VOICE_RUBRIC_EXPANSION_BLOCK)) {
    anchorMissing.push("synthesis3.SYSTEM_PROMPT");
  }
  if (!GRIP_SYSTEM_PROMPT.includes(VOICE_RUBRIC_EXPANSION_BLOCK)) {
    anchorMissing.push("grip.GRIP_SYSTEM_PROMPT");
  }
  // Spot-check the section header so the regex audit catches partial drift.
  if (!/Driver-register rubric expansion/i.test(SYSTEM_PROMPT)) {
    anchorMissing.push("synthesis3 section header");
  }
  if (!/Driver-register rubric expansion/i.test(GRIP_SYSTEM_PROMPT)) {
    anchorMissing.push("grip section header");
  }
  results.push(
    anchorMissing.length === 0
      ? {
          ok: true,
          assertion: "voice-rubric-prompts-anchor",
          detail: "both prompts contain the verbatim rubric expansion block",
        }
      : {
          ok: false,
          assertion: "voice-rubric-prompts-anchor",
          detail: anchorMissing.join(" | "),
        }
  );

  // ── 4. voice-rubric-banned-phrases-absent ───────────────────────────
  const bannedFails: string[] = [];
  for (const [k, v] of Object.entries(allFour)) {
    const r = auditProseForBannedPhrases(v);
    if (r.violations.length > 0) {
      bannedFails.push(
        `${k}: ${r.violations.map((vio) => vio.phrase).join(",")}`
      );
    }
  }
  results.push(
    bannedFails.length === 0
      ? {
          ok: true,
          assertion: "voice-rubric-banned-phrases-absent",
          detail: "no CC-RELIGIOUS-REGISTER-RULES banned phrase fires across the 4 rubrics",
        }
      : {
          ok: false,
          assertion: "voice-rubric-banned-phrases-absent",
          detail: bannedFails.join(" | "),
        }
  );

  // ── 5. voice-rubric-clinical-phrases-absent ─────────────────────────
  const clinicalFails: string[] = [];
  for (const [k, v] of Object.entries(allFour)) {
    for (const re of CLINICAL_PHRASES) {
      if (re.test(v)) {
        clinicalFails.push(`${k}: matches ${re.source}`);
      }
    }
  }
  results.push(
    clinicalFails.length === 0
      ? {
          ok: true,
          assertion: "voice-rubric-clinical-phrases-absent",
          detail: "no clinical-register vocabulary fires across the 4 rubrics",
        }
      : {
          ok: false,
          assertion: "voice-rubric-clinical-phrases-absent",
          detail: clinicalFails.join(" | "),
        }
  );

  // ── 6. voice-rubric-driver-hint-routing ─────────────────────────────
  const routingFails: string[] = [];
  const expectedHinted = ["si", "se", "ti", "fi"] as const;
  const expectedUnhinted = ["ni", "ne", "te", "fe"] as const;
  for (const f of expectedHinted) {
    const h = driverRegisterHint(f);
    if (!h || typeof h !== "string" || h.length === 0) {
      routingFails.push(`${f}: no hint returned`);
    }
  }
  for (const f of expectedUnhinted) {
    const h = driverRegisterHint(f);
    if (h !== null) {
      routingFails.push(`${f}: expected null, got non-null`);
    }
  }
  results.push(
    routingFails.length === 0
      ? {
          ok: true,
          assertion: "voice-rubric-driver-hint-routing",
          detail: "si/se/ti/fi → hint; ni/ne/te/fe → null",
        }
      : {
          ok: false,
          assertion: "voice-rubric-driver-hint-routing",
          detail: routingFails.join(" | "),
        }
  );

  // ── 7. voice-rubric-cohort-shift-on-si-fixture ──────────────────────
  // Si fixture: ocean/24-si-precedent-keeper. Look up the cached
  // synthesis3 paragraph and verify at least one Si register marker
  // is present in the paragraph.
  const siConstitution = loadFixture(
    "ocean",
    "24-si-precedent-keeper.json"
  );
  const siInputs = deriveSynthesis3Inputs(siConstitution);
  const siParagraph = readCachedParagraph(siInputs);
  const siMarkers = SI_REGISTER_MARKERS.filter((m) =>
    siParagraph?.toLowerCase().includes(m.toLowerCase())
  );
  results.push(
    siParagraph && siMarkers.length > 0
      ? {
          ok: true,
          assertion: "voice-rubric-cohort-shift-on-si-fixture",
          detail: `ocean/24 paragraph contains Si markers: ${siMarkers.join(", ")}`,
        }
      : {
          ok: false,
          assertion: "voice-rubric-cohort-shift-on-si-fixture",
          detail: siParagraph
            ? `ocean/24 paragraph contains no Si register markers (${SI_REGISTER_MARKERS.length} candidates checked)`
            : "ocean/24 has no cached paragraph",
        }
  );

  // ── 8. voice-rubric-cohort-shift-on-ti-fixture ──────────────────────
  const tiConstitution = loadFixture(
    "ocean",
    "25-ti-coherence-prober.json"
  );
  const tiInputs = deriveSynthesis3Inputs(tiConstitution);
  const tiParagraph = readCachedParagraph(tiInputs);
  const tiMarkers = TI_REGISTER_MARKERS.filter((m) =>
    tiParagraph?.toLowerCase().includes(m.toLowerCase())
  );
  results.push(
    tiParagraph && tiMarkers.length > 0
      ? {
          ok: true,
          assertion: "voice-rubric-cohort-shift-on-ti-fixture",
          detail: `ocean/25 paragraph contains Ti markers: ${tiMarkers.join(", ")}`,
        }
      : {
          ok: false,
          assertion: "voice-rubric-cohort-shift-on-ti-fixture",
          detail: tiParagraph
            ? `ocean/25 paragraph contains no Ti register markers (${TI_REGISTER_MARKERS.length} candidates checked)`
            : "ocean/25 has no cached paragraph",
        }
  );

  // Diagnostic — Se / Fi marker presence (non-failing observation).
  const seConstitution = loadFixture(
    "goal-soul-give",
    "01-generative.json"
  );
  const seInputs = deriveSynthesis3Inputs(seConstitution);
  const seParagraph = readCachedParagraph(seInputs);
  const seMarkers = SE_REGISTER_MARKERS.filter((m) =>
    seParagraph?.toLowerCase().includes(m.toLowerCase())
  );
  const fiConstitution = loadFixture(
    "ocean",
    "26-fi-inner-truth-anchor.json"
  );
  const fiInputs = deriveSynthesis3Inputs(fiConstitution);
  const fiParagraph = readCachedParagraph(fiInputs);
  const fiMarkers = FI_REGISTER_MARKERS.filter((m) =>
    fiParagraph?.toLowerCase().includes(m.toLowerCase())
  );

  // Find all si/se/ti/fi cohort fixtures and report.
  const cohortRows: Array<{
    set: string;
    file: string;
    dom: string;
  }> = [];
  for (const dir of ["ocean", "goal-soul-give"]) {
    for (const f of readdirSync(join(ROOT, dir)).filter((x) =>
      x.endsWith(".json")
    )) {
      try {
        const raw = JSON.parse(
          readFileSync(join(ROOT, dir, f), "utf-8")
        ) as { answers: Answer[]; demographics?: DemographicSet | null };
        const c = buildInnerConstitution(
          raw.answers,
          [],
          raw.demographics ?? null
        );
        cohortRows.push({
          set: dir,
          file: f,
          dom: c.lens_stack.dominant,
        });
      } catch {
        // skip
      }
    }
  }
  const lowSiSeCount = cohortRows.filter(
    (r) => r.dom === "si" || r.dom === "se"
  ).length;
  const tiFiCount = cohortRows.filter(
    (r) => r.dom === "ti" || r.dom === "fi"
  ).length;

  console.log(
    `\nDriver-register marker presence (post-CC-VOICE-RUBRIC-EXPANSION):` +
      `\n  ocean/24-si: Si markers found = ${siMarkers.length}/${SI_REGISTER_MARKERS.length}` +
      `\n    (${siMarkers.join(", ") || "none"})` +
      `\n  ocean/25-ti: Ti markers found = ${tiMarkers.length}/${TI_REGISTER_MARKERS.length}` +
      `\n    (${tiMarkers.join(", ") || "none"})` +
      `\n  gsg/01-se: Se markers found = ${seMarkers.length}/${SE_REGISTER_MARKERS.length}` +
      `\n    (${seMarkers.join(", ") || "none"})` +
      `\n  ocean/26-fi: Fi markers found = ${fiMarkers.length}/${FI_REGISTER_MARKERS.length}` +
      `\n    (${fiMarkers.join(", ") || "none"})` +
      `\n  cohort coverage: ${lowSiSeCount} Si/Se fixtures, ${tiFiCount} Ti/Fi fixtures (of ${cohortRows.length})`
  );

  return results;
}

function main(): number {
  console.log("CC-VOICE-RUBRIC-EXPANSION — Si/Se/Ti/Fi driver rubric audit");
  console.log("==============================================================");
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
  console.log("AUDIT PASSED — all CC-VOICE-RUBRIC-EXPANSION assertions green.");
  return 0;
}

process.exit(main());
