// CC-089-HEDGED-LOW-CONFIDENCE-LENS — render + routing audit.
//
// Five assertions per the CC's Item 4:
//   1. renderMirror.ts reads `lens_stack.confidence` (source-level grep).
//   2. Hedged-prose marker present in renderer source.
//   3. Synthetic low-confidence fixture produces visibly hedged Lens
//      prose AND the ⚠ badge meta-line (runtime).
//   4. `pickGiftCategoryForCard` short-circuits the relational-shape
//      reorder when `stack.confidence === "low"` (source + runtime).
//   5. High-confidence cohort fixture render is unchanged — "leans
//      toward" Lens cardHeader appears AND the hedge marker does NOT
//      appear (regression anchor).
//
// Bonus assertions for the per-card routing tightening:
//   6. handsCard.ts honors `lensConfidence === "low"` (falls to
//      `unmappedType` template).
//   7. No LLM imports.
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/hedgedLowConfidenceLens.audit.ts`
//   (or `npm run audit:hedged-low-confidence-lens`).

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
  LensStack,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

// Canonical phrases load-bearing for the audit.
const BADGE_MARKER = "⚠ The engine's confidence in this Lens read is low.";
const HEDGE_MARKER = "engine's read of your cognitive pattern is uncertain";
// CC-168.1 — was "leans toward". CC-168.1 deliberately suppressed the
// "Your processing pattern leans toward X, supported by Y." line on
// both the Guide-side SWOT loop (renderMirror.ts) and the Body Cards
// path (fiftyDegreeIndividual.ts) because CC-168's rewritten Strength
// sentence ("you read through X and act through Y") restated the same
// dom/aux pair back-to-back. The anchor's job here is only to prove
// the high-conf render produced (so the hedge-absent + badge-absent
// checks below aren't trivially satisfied by an empty string); the
// Body Cards Lens question line "How you read reality" is stable
// across high-conf and low-conf shapes and survives CC-168.1.
const HIGH_CONF_MARKER = "How you read reality";

function loadCohortFixture(): {
  answers: Answer[];
  demographics: DemographicSet | null;
} {
  // Stable shape fixture with a clear dominant-driver signal so the
  // engine reliably produces `confidence: "high"` on the natural build.
  const fixturePath = join(
    REPO_ROOT,
    "tests",
    "fixtures",
    "cohort",
    "si-tradition-steward.json"
  );
  const raw = JSON.parse(readFileSync(fixturePath, "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return { answers: raw.answers, demographics: raw.demographics ?? null };
}

function renderConstitution(constitution: InnerConstitution): string {
  return renderMirrorAsMarkdown({
    constitution,
    demographics: null,
    includeBeliefAnchor: false,
    generatedAt: new Date("2026-05-17T00:00:00Z"),
    renderMode: "user",
  });
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  const renderMirrorBody = readFile(
    join(REPO_ROOT, "lib", "renderMirror.ts")
  );
  const identityEngineBody = readFile(
    join(REPO_ROOT, "lib", "identityEngine.ts")
  );
  const handsCardBody = readFile(join(REPO_ROOT, "lib", "handsCard.ts"));

  // ── 1: renderMirror reads lens_stack.confidence ─────────────────
  const renderReadsConfidence =
    renderMirrorBody !== null &&
    /constitution\.lens_stack\.confidence\s*===\s*"low"/.test(renderMirrorBody);
  results.push(
    renderReadsConfidence
      ? {
          ok: true,
          assertion: "render-reads-lens-stack-confidence",
          detail: `lib/renderMirror.ts reads lens_stack.confidence === "low"`,
        }
      : {
          ok: false,
          assertion: "render-reads-lens-stack-confidence",
          detail: `lib/renderMirror.ts does not branch on lens_stack.confidence === "low"`,
        }
  );

  // ── 2: hedged-prose marker present in renderer source ───────────
  const hedgeMarkerPresent =
    renderMirrorBody !== null &&
    renderMirrorBody.includes(HEDGE_MARKER);
  const badgeMarkerPresent =
    renderMirrorBody !== null && renderMirrorBody.includes(BADGE_MARKER);
  results.push(
    hedgeMarkerPresent && badgeMarkerPresent
      ? {
          ok: true,
          assertion: "hedge-prose-and-badge-markers-in-source",
          detail: `lib/renderMirror.ts contains hedge marker + ⚠ badge marker verbatim`,
        }
      : {
          ok: false,
          assertion: "hedge-prose-and-badge-markers-in-source",
          detail: !hedgeMarkerPresent
            ? `hedge marker missing in renderMirror.ts`
            : `badge marker missing in renderMirror.ts`,
        }
  );

  // ── 3: synthetic low-confidence fixture → hedged Lens prose ──────
  let lowConfidenceRender = "";
  let lowConfidenceErr: string | null = null;
  try {
    const { answers, demographics } = loadCohortFixture();
    const constitution = buildInnerConstitution(answers, [], demographics);
    // Force confidence="low" on the natural build to exercise the
    // hedge path. The renderer reads lens_stack.confidence at emit
    // time, so mutating before render is sufficient.
    const lowStack: LensStack = {
      ...constitution.lens_stack,
      confidence: "low",
    };
    const lowConstitution: InnerConstitution = {
      ...constitution,
      lens_stack: lowStack,
    };
    lowConfidenceRender = renderConstitution(lowConstitution);
  } catch (e) {
    lowConfidenceErr = e instanceof Error ? e.message : String(e);
  }
  const hedgeInLowOutput = lowConfidenceRender.includes(HEDGE_MARKER);
  const badgeInLowOutput = lowConfidenceRender.includes(BADGE_MARKER);
  results.push(
    lowConfidenceErr === null && hedgeInLowOutput && badgeInLowOutput
      ? {
          ok: true,
          assertion: "low-confidence-render-shows-hedge-and-badge",
          detail: `low-confidence Lens render contains hedge prose + ⚠ badge meta-line`,
        }
      : {
          ok: false,
          assertion: "low-confidence-render-shows-hedge-and-badge",
          detail:
            lowConfidenceErr !== null
              ? `render threw: ${lowConfidenceErr}`
              : !hedgeInLowOutput
                ? `hedge marker missing from low-conf render`
                : `badge marker missing from low-conf render`,
        }
  );

  // ── 4: pickGiftCategoryForCard short-circuits relational reorder
  //      when confidence is low (source-level proof — the branch
  //      `stack.confidence !== "low"` must guard the `isRelationalShape`
  //      reorder).
  const pickerShortCircuit =
    identityEngineBody !== null &&
    /stack\.confidence\s*!==\s*"low"\s*&&\s*isRelationalShape\s*\(/.test(
      identityEngineBody
    );
  results.push(
    pickerShortCircuit
      ? {
          ok: true,
          assertion: "pick-gift-category-skips-shape-reorder-on-low-confidence",
          detail: `pickGiftCategoryForCard guards the isRelationalShape reorder with stack.confidence !== "low"`,
        }
      : {
          ok: false,
          assertion: "pick-gift-category-skips-shape-reorder-on-low-confidence",
          detail: `expected short-circuit guard not found in identityEngine.ts`,
        }
  );

  // ── 5: high-confidence regression anchor — HIGH_CONF_MARKER (a
  //      stable, non-hedge substring from the Lens render — see the
  //      constant's comment for the CC-168.1 rationale) appears AND
  //      hedge marker absent in the cohort fixture's natural render.
  let highConfidenceRender = "";
  let highConfidenceConfidence: string = "";
  let highConfidenceErr: string | null = null;
  try {
    const { answers, demographics } = loadCohortFixture();
    const constitution = buildInnerConstitution(answers, [], demographics);
    highConfidenceConfidence = constitution.lens_stack.confidence;
    highConfidenceRender = renderConstitution(constitution);
  } catch (e) {
    highConfidenceErr = e instanceof Error ? e.message : String(e);
  }
  const highConfAnchorPresent =
    highConfidenceRender.includes(HIGH_CONF_MARKER);
  const hedgeAbsent = !highConfidenceRender.includes(HEDGE_MARKER);
  const badgeAbsent = !highConfidenceRender.includes(BADGE_MARKER);
  results.push(
    highConfidenceErr === null &&
      highConfidenceConfidence === "high" &&
      highConfAnchorPresent &&
      hedgeAbsent &&
      badgeAbsent
      ? {
          ok: true,
          assertion:
            "high-confidence-regression-anchor-unchanged",
          detail: `cohort fixture rendered with confidence=high, anchor "${HIGH_CONF_MARKER}" present, hedge + badge absent`,
        }
      : {
          ok: false,
          assertion:
            "high-confidence-regression-anchor-unchanged",
          detail:
            highConfidenceErr !== null
              ? `render threw: ${highConfidenceErr}`
              : highConfidenceConfidence !== "high"
                ? `cohort fixture natural confidence is "${highConfidenceConfidence}", expected "high"`
                : !highConfAnchorPresent
                  ? `anchor "${HIGH_CONF_MARKER}" missing in high-confidence render`
                  : !hedgeAbsent
                    ? `hedge marker leaked into high-confidence render`
                    : `badge marker leaked into high-confidence render`,
        }
  );

  // ── 6: handsCard honors lensConfidence === "low" (source proof) ──
  const handsConfidenceShortCircuit =
    handsCardBody !== null &&
    /lensConfidence\s*===\s*"low"/.test(handsCardBody) &&
    /return\s+"unmappedType"/.test(handsCardBody);
  results.push(
    handsConfidenceShortCircuit
      ? {
          ok: true,
          assertion: "hands-card-falls-to-unmapped-on-low-confidence",
          detail: `lib/handsCard.ts shortcircuits to "unmappedType" template when lensConfidence === "low"`,
        }
      : {
          ok: false,
          assertion: "hands-card-falls-to-unmapped-on-low-confidence",
          detail: `expected lensConfidence-low short-circuit not found in lib/handsCard.ts`,
        }
  );

  // ── 7: no LLM imports introduced by this CC ──────────────────────
  const noLlm =
    renderMirrorBody !== null &&
    identityEngineBody !== null &&
    handsCardBody !== null &&
    !/from\s+["'][^"']*LlmServer["']/.test(handsCardBody) &&
    !/@anthropic-ai\/sdk/.test(handsCardBody);
  results.push(
    noLlm
      ? {
          ok: true,
          assertion: "no-llm-server-imports-in-touched-files",
          detail: `lib/handsCard.ts contains no *LlmServer imports and no @anthropic-ai/sdk import`,
        }
      : {
          ok: false,
          assertion: "no-llm-server-imports-in-touched-files",
          detail: `forbidden LLM-server / sdk import found in lib/handsCard.ts`,
        }
  );

  return results;
}

function main(): number {
  console.log("CC-089-HEDGED-LOW-CONFIDENCE-LENS — render + routing audit");
  console.log("==========================================================");
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
  console.log(
    "AUDIT PASSED — low-confidence Lens reads render hedged + badged; routing tightens to neutral templates; high-confidence renders unchanged."
  );
  return 0;
}

process.exit(main());
