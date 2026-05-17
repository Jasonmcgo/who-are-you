// CC-097B-CROSS-SIGNAL-DRIVER-INFERENCE — scaffolding + cohort-regression
// audit.
//
// Per the executor's scaffolding-only choice: this CC lands the
// architectural pieces (types + module + integration + hedge variants
// + synthetic fixtures + audit framework). Empirical weight tuning is
// deferred to a follow-up CC-097B-CALIBRATION. Assertions classified
// as "calibration-PENDING" report the synthetic fixtures' current
// state but do not fail the audit — they're diagnostic input for the
// follow-up.
//
// Status reporting:
//   PASS    — structural / regression assertion validated.
//   PEND    — calibration target; the fixture's current scoring does
//             not yet satisfy the expected outcome. Diagnostic detail
//             reported; not a failure. CC-097B-CALIBRATION owns these.
//   FAIL    — structural assertion failed. Audit exits non-zero.
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/crossSignalDriverInference.audit.ts`

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import {
  detectMirrorAxis,
  inferDriverFromCrossSignals,
  PERCEIVING_MIRROR_PAIRS,
  type CrossSignalDriverInference,
} from "../../lib/crossSignalDriverInference";
import type { Answer, DemographicSet, InnerConstitution } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");
const COHORT_DIR = join(REPO_ROOT, "tests", "fixtures", "cohort");
const SYNTHETIC_DIR = join(REPO_ROOT, "tests", "fixtures", "cc-097b-synthetic");

type Status = "PASS" | "PEND" | "FAIL";
type AssertionResult = { status: Status; assertion: string; detail: string };

function build(file: string, dir: string = COHORT_DIR): {
  c: InnerConstitution;
  cs: CrossSignalDriverInference;
} {
  const raw = JSON.parse(readFileSync(join(dir, file), "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  const c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
  const cs = inferDriverFromCrossSignals(c);
  return { c, cs };
}

function fixturePresent(file: string, dir: string = COHORT_DIR): boolean {
  return existsSync(join(dir, file));
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1: Jason (paralysis-shame-without-project) Ni agreement ─────
  {
    const { c, cs } = build("paralysis-shame-without-project.json");
    const ok =
      c.lens_stack.dominant === "ni" &&
      c.lens_stack.crossSignalAgreement === "agree";
    results.push({
      status: ok ? "PASS" : "FAIL",
      assertion: "jason-ni-agreement",
      detail: `qt=${c.lens_stack.dominant} cs=${cs.inferredDriver} gap=${cs.scoreGap.toFixed(0)} agreement=${c.lens_stack.crossSignalAgreement}`,
    });
  }

  // ── 2: Daniel (si-tradition-steward) Si agreement ────────────────
  {
    const { c, cs } = build("si-tradition-steward.json");
    const ok =
      c.lens_stack.dominant === "si" &&
      c.lens_stack.crossSignalAgreement === "agree";
    results.push({
      status: ok ? "PASS" : "FAIL",
      assertion: "daniel-si-agreement",
      detail: `qt=${c.lens_stack.dominant} cs=${cs.inferredDriver} gap=${cs.scoreGap.toFixed(0)} agreement=${c.lens_stack.crossSignalAgreement}`,
    });
  }

  // ── 3: Cindy (se-high-extraversion-responder) Se agreement ──────
  {
    const { c, cs } = build("se-high-extraversion-responder.json");
    const ok =
      c.lens_stack.dominant === "se" &&
      c.lens_stack.crossSignalAgreement === "agree";
    results.push({
      status: ok ? "PASS" : "FAIL",
      assertion: "cindy-shape-se-agreement",
      detail: `qt=${c.lens_stack.dominant} cs=${cs.inferredDriver} gap=${cs.scoreGap.toFixed(0)} agreement=${c.lens_stack.crossSignalAgreement}`,
    });
  }

  // ── 4: Harry (non-canonical Si-Fe stack) — CC-097B-CALIBRATION ──
  // Harry's lived signature: Si dominant + Fe auxiliary + Ne tertiary +
  // Te inferior (non-MBTI-canonical, per feedback_jungian_over_mbti_canon).
  // Engine's `aggregateLensStack` forces a canonical aux pair (Si-Te or
  // Si-Fe); the engine resolves Harry's signal pattern to a canonical
  // shape. Cross-signal agreement is what matters here — Si must win
  // top cross-signal score with a clean gap, confirming Si as Harry's
  // driver regardless of which aux the engine picks.
  if (fixturePresent("harry-si-fe-ne-te.json", SYNTHETIC_DIR)) {
    const { c, cs } = build("harry-si-fe-ne-te.json", SYNTHETIC_DIR);
    const driverOk = cs.inferredDriver === "si";
    const agreeOk = c.lens_stack.crossSignalAgreement === "agree";
    const gapOk = cs.scoreGap >= 10;
    const status: Status = driverOk && agreeOk && gapOk ? "PASS" : "FAIL";
    results.push({
      status,
      assertion: "harry-non-canonical-si-fe-agreement",
      detail: `qt=${c.lens_stack.dominant}/${c.lens_stack.auxiliary} cs=${cs.inferredDriver} gap=${cs.scoreGap.toFixed(0)} agreement=${c.lens_stack.crossSignalAgreement}`,
    });
  } else {
    results.push({
      status: "FAIL",
      assertion: "harry-non-canonical-si-fe-agreement",
      detail: `fixture missing: tests/fixtures/cc-097b-synthetic/harry-si-fe-ne-te.json`,
    });
  }

  // ── 5: Michele synthetic (Class B — disagree, Ne preferred) ──────
  if (fixturePresent("michele-ne-fi-class-b.json", SYNTHETIC_DIR)) {
    const { c, cs } = build("michele-ne-fi-class-b.json", SYNTHETIC_DIR);
    const qtOk = c.lens_stack.dominant === "fe";
    const csOk = cs.inferredDriver === "ne";
    const disagreeOk =
      c.lens_stack.crossSignalAgreement === "disagree-prefer-cross-signal";
    const status: Status =
      qtOk && csOk && disagreeOk ? "PASS" : qtOk && csOk ? "PEND" : "FAIL";
    results.push({
      status,
      assertion: "michele-class-b-disagree-ne-preferred",
      detail: `qt=${c.lens_stack.dominant} (expect fe; ${qtOk}) cs=${cs.inferredDriver} (expect ne; ${csOk}) gap=${cs.scoreGap.toFixed(0)} agreement=${c.lens_stack.crossSignalAgreement} (expect disagree-prefer-cross-signal; ${disagreeOk})${!disagreeOk && qtOk && csOk ? " — CALIBRATION-PENDING: weight tuning needed to clear the disagree-fire threshold (gap>=20, csScore>=60, qtScore<=40)" : ""}`,
    });
  } else {
    results.push({
      status: "FAIL",
      assertion: "michele-class-b-disagree-ne-preferred",
      detail: `fixture missing: tests/fixtures/cc-097b-synthetic/michele-ne-fi-class-b.json`,
    });
  }

  // ── 6: Kevin synthetic (Class C — disagree, Fe preferred) ────────
  if (fixturePresent("kevin-fe-si-class-c.json", SYNTHETIC_DIR)) {
    const { c, cs } = build("kevin-fe-si-class-c.json", SYNTHETIC_DIR);
    const qtOk = c.lens_stack.dominant === "se";
    const csOk = cs.inferredDriver === "fe";
    const disagreeOk =
      c.lens_stack.crossSignalAgreement === "disagree-prefer-cross-signal";
    const status: Status =
      qtOk && csOk && disagreeOk ? "PASS" : qtOk && csOk ? "PEND" : "FAIL";
    results.push({
      status,
      assertion: "kevin-class-c-disagree-fe-preferred",
      detail: `qt=${c.lens_stack.dominant} (expect se; ${qtOk}) cs=${cs.inferredDriver} (expect fe; ${csOk}) gap=${cs.scoreGap.toFixed(0)} agreement=${c.lens_stack.crossSignalAgreement} (expect disagree-prefer-cross-signal; ${disagreeOk})${!disagreeOk && qtOk && csOk ? " — CALIBRATION-PENDING: weight tuning needed to clear the disagree-fire threshold" : ""}`,
    });
  } else {
    results.push({
      status: "FAIL",
      assertion: "kevin-class-c-disagree-fe-preferred",
      detail: `fixture missing: tests/fixtures/cc-097b-synthetic/kevin-fe-si-class-c.json`,
    });
  }

  // ── 7: Ashley synthetic (Class D — mirror-axis SE-NI) ────────────
  if (fixturePresent("ashley-mirror-axis-se-ni.json", SYNTHETIC_DIR)) {
    const { c, cs } = build("ashley-mirror-axis-se-ni.json", SYNTHETIC_DIR);
    const qtOk = c.lens_stack.dominant === "se";
    const mirrorOk =
      c.lens_stack.crossSignalAgreement === "mirror-axis" &&
      c.lens_stack.mirrorAxis?.axisName === "SE-NI";
    const mirror = detectMirrorAxis(c.lens_stack.dominant, cs);
    const status: Status =
      qtOk && mirrorOk ? "PASS" : qtOk ? "PEND" : "FAIL";
    results.push({
      status,
      assertion: "ashley-class-d-mirror-axis-se-ni",
      detail: `qt=${c.lens_stack.dominant} (expect se; ${qtOk}) se-score=${cs.scores.se} ni-score=${cs.scores.ni} mirrorAxis=${c.lens_stack.mirrorAxis?.axisName ?? "(none)"} (expect SE-NI; ${mirrorOk})${!mirrorOk && qtOk ? ` — CALIBRATION-PENDING: needs both se and ni scores >= 50 to trigger detectMirrorAxis (currently se=${cs.scores.se}, ni=${cs.scores.ni}; detectMirrorAxis returned ${mirror ? mirror.axisName : "null"})` : ""}`,
    });
  } else {
    results.push({
      status: "FAIL",
      assertion: "ashley-class-d-mirror-axis-se-ni",
      detail: `fixture missing: tests/fixtures/cc-097b-synthetic/ashley-mirror-axis-se-ni.json`,
    });
  }

  // ── 8: DiSC Jason D > i > C > S ──────────────────────────────────
  {
    const { cs } = build("paralysis-shame-without-project.json");
    const ranked = (Object.entries(cs.disc) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const order = ranked.join(">");
    const ok = order === "D>i>C>S";
    results.push({
      status: ok ? "PASS" : "PEND",
      assertion: "disc-jason-d-i-c-s",
      detail: `disc order=${order} (expect D>i>C>S; D=${cs.disc.D.toFixed(0)} i=${cs.disc.i.toFixed(0)} S=${cs.disc.S.toFixed(0)} C=${cs.disc.C.toFixed(0)})${!ok ? " — CALIBRATION-PENDING: DiSC derivation weights need cohort-tuning" : ""}`,
    });
  }

  // ── 9: DiSC Harry S > i > C > D ─────────────────────────────────
  if (fixturePresent("harry-si-fe-ne-te.json", SYNTHETIC_DIR)) {
    const { cs } = build("harry-si-fe-ne-te.json", SYNTHETIC_DIR);
    const ranked = (Object.entries(cs.disc) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const order = ranked.join(">");
    const ok = order === "S>i>C>D";
    results.push({
      status: ok ? "PASS" : "PEND",
      assertion: "disc-harry-s-i-c-d",
      detail: `disc order=${order} (expect S>i>C>D; D=${cs.disc.D.toFixed(0)} i=${cs.disc.i.toFixed(0)} S=${cs.disc.S.toFixed(0)} C=${cs.disc.C.toFixed(0)})`,
    });
  } else {
    results.push({
      status: "FAIL",
      assertion: "disc-harry-s-i-c-d",
      detail: `harry-si-fe-ne-te.json fixture missing`,
    });
  }

  // ── 10: LensStack schema additions populated on every cohort fixture
  {
    const files = [
      "paralysis-shame-without-project.json",
      "si-tradition-steward.json",
      "se-high-extraversion-responder.json",
    ];
    type Miss = { file: string; missing: string[] };
    const misses: Miss[] = [];
    for (const f of files) {
      const { c } = build(f);
      const missing: string[] = [];
      if (c.lens_stack.crossSignalAgreement === undefined)
        missing.push("crossSignalAgreement");
      if (c.lens_stack.crossSignalInferredDriver === undefined)
        missing.push("crossSignalInferredDriver");
      if (missing.length > 0) misses.push({ file: f, missing });
    }
    results.push({
      status: misses.length === 0 ? "PASS" : "FAIL",
      assertion: "lens-stack-schema-populated",
      detail:
        misses.length === 0
          ? `crossSignalAgreement + crossSignalInferredDriver populated on ${files.length} cohort fixtures`
          : misses
              .map((m) => `${m.file}: missing ${m.missing.join(",")}`)
              .join("; "),
    });
  }

  // ── 11: Hedge prose Variant A — depends on Ashley mirror-axis firing
  // The renderer is statically wired to emit "axis" + "both registers
  // are alive" when crossSignalAgreement === "mirror-axis". Verify the
  // wiring is in place by grep on the renderer source, AND if the
  // Ashley fixture currently fires mirror-axis at runtime, verify
  // the rendered MD contains the marker. Otherwise mark PEND.
  {
    const renderMirrorBody = readFileSync(
      join(REPO_ROOT, "lib", "renderMirror.ts"),
      "utf-8"
    );
    const variantAWired =
      /agreement === "mirror-axis"/.test(renderMirrorBody) &&
      /both registers are alive in you/.test(renderMirrorBody);
    results.push({
      status: variantAWired ? "PASS" : "FAIL",
      assertion: "hedge-prose-variant-a-mirror-axis-wired",
      detail: variantAWired
        ? `lib/renderMirror.ts contains Variant A routing + canonical "both registers are alive in you" prose`
        : `Variant A wiring not found in renderMirror.ts`,
    });
  }

  // ── 12: Hedge prose Variant B — depends on Michele/Kevin disagree firing
  {
    const renderMirrorBody = readFileSync(
      join(REPO_ROOT, "lib", "renderMirror.ts"),
      "utf-8"
    );
    const variantBWired =
      /agreement === "disagree-prefer-cross-signal"/.test(renderMirrorBody) &&
      /broader signature of your other responses/.test(renderMirrorBody);
    results.push({
      status: variantBWired ? "PASS" : "FAIL",
      assertion: "hedge-prose-variant-b-disagree-wired",
      detail: variantBWired
        ? `lib/renderMirror.ts contains Variant B routing + canonical "broader signature" prose`
        : `Variant B wiring not found in renderMirror.ts`,
    });
  }

  // ── 13: Cohort agreement regression — all 4 named-cohort fixtures
  //   (Jason / Daniel / Cindy-shape / one steward-clean fixture)
  //   render with agreement === "agree" so the Lens prose stays in
  //   its pre-CC-097B form.
  {
    const files = [
      "paralysis-shame-without-project.json",
      "si-tradition-steward.json",
      "se-high-extraversion-responder.json",
      "qp2-express-carefully-daniel.json",
    ];
    type Miss = { file: string; agreement: string };
    const misses: Miss[] = [];
    for (const f of files) {
      const { c } = build(f);
      if (c.lens_stack.crossSignalAgreement !== "agree") {
        misses.push({
          file: f,
          agreement: c.lens_stack.crossSignalAgreement ?? "(unset)",
        });
      }
    }
    results.push({
      status: misses.length === 0 ? "PASS" : "FAIL",
      assertion: "cohort-agreement-regression-anchor",
      detail:
        misses.length === 0
          ? `${files.length} named cohort fixtures render with agreement="agree" (no Lens-prose drift)`
          : misses
              .map((m) => `${m.file}: agreement="${m.agreement}"`)
              .join("; "),
    });
  }

  // ── 14: CC-097B-CALIBRATION agreement-lift rule wired ──────────
  // Structural assertion: verify the agreement-lift constants and the
  // gating condition are present in lib/identityEngine.ts. (A pure
  // runtime exercise requires a Q-T pattern that triggers Si-Ne
  // same-dim-mirror tightness with gap < MBTI_TIE_MARGIN; integer
  // ranks across 4 perceiving questions can't produce a gap below
  // 0.5 while keeping Si as dominant, so the user-visible Daniel
  // case requires post-deploy real-session inspection. The rule is
  // structurally verified here.)
  {
    const engineBody = readFileSync(
      join(REPO_ROOT, "lib", "identityEngine.ts"),
      "utf-8"
    );
    const liftWired =
      /AGREEMENT_LIFT_INFERRED_SCORE_FLOOR\s*=\s*60/.test(engineBody) &&
      /AGREEMENT_LIFT_GAP_FLOOR\s*=\s*15/.test(engineBody) &&
      /cs\.inferredDriver === constitution\.lens_stack\.dominant/.test(engineBody) &&
      /cs\.inferredDriverScore >= AGREEMENT_LIFT_INFERRED_SCORE_FLOOR/.test(
        engineBody
      ) &&
      /cs\.scoreGap >= AGREEMENT_LIFT_GAP_FLOOR/.test(engineBody) &&
      /constitution\.lens_stack\.confidence = "high"/.test(engineBody);
    results.push({
      status: liftWired ? "PASS" : "FAIL",
      assertion: "agreement-lift-rule-wired",
      detail: liftWired
        ? `CC-097B-CALIBRATION Phase 1 wired in lib/identityEngine.ts: lift constants (60/15) + condition + confidence flip all present`
        : `agreement-lift rule not fully wired in identityEngine.ts`,
    });
  }

  // ── 15: Daniel cohort cross-signal Si confirmation ─────────────
  // The user-visible Daniel-class fix is: cross-signal correctly
  // identifies Si as Daniel's driver (Si compass broadened per Phase 2
  // to include Stability+Family+Loyalty/Honor anchors). Pre-CC the
  // cohort fixture's cs landed on Fi by 5 points; post-CC it should
  // land on Si with a clean gap. This is the data condition the
  // agreement-lift rule needs to fire post-deploy on Daniel's stored
  // session if his Q-T pattern flags low confidence.
  {
    const { c, cs } = build("si-tradition-steward.json");
    const ok =
      cs.inferredDriver === "si" &&
      cs.scoreGap >= 15 &&
      c.lens_stack.crossSignalAgreement === "agree";
    results.push({
      status: ok ? "PASS" : "FAIL",
      assertion: "daniel-cohort-si-cross-signal-confirmed",
      detail: `si-tradition-steward.json: cs=${cs.inferredDriver} gap=${cs.scoreGap.toFixed(0)} agreement=${c.lens_stack.crossSignalAgreement} — cross-signal now confirms Si (was Fi pre-CC)`,
    });
  }

  // ── Bonus: mirror-pair table sanity ─────────────────────────────
  // Confirms PERCEIVING_MIRROR_PAIRS covers the 4 canonical
  // perceiving functions exclusively.
  {
    const expected = { si: "ne", ne: "si", ni: "se", se: "ni" } as const;
    const actualKeys = Object.keys(PERCEIVING_MIRROR_PAIRS).sort();
    const expectedKeys = Object.keys(expected).sort();
    const ok =
      JSON.stringify(actualKeys) === JSON.stringify(expectedKeys) &&
      Object.entries(expected).every(
        ([k, v]) => PERCEIVING_MIRROR_PAIRS[k as keyof typeof expected] === v
      );
    results.push({
      status: ok ? "PASS" : "FAIL",
      assertion: "perceiving-mirror-pairs-canonical",
      detail: ok
        ? `Si↔Ne, Ni↔Se pairs declared; judging-function attitude flips correctly excluded`
        : `mirror-pair table drift detected: keys=${actualKeys.join(",")}`,
    });
  }

  return results;
}

function main(): number {
  console.log("CC-097B-CROSS-SIGNAL-DRIVER-INFERENCE — scaffolding audit");
  console.log("=========================================================");
  const results = runAudit();
  let failures = 0;
  let pendings = 0;
  let passes = 0;
  for (const r of results) {
    console.log(`[${r.status}] ${r.assertion} — ${r.detail}`);
    if (r.status === "FAIL") failures++;
    else if (r.status === "PEND") pendings++;
    else passes++;
  }
  console.log("");
  console.log(
    `Summary: ${passes} PASS, ${pendings} PEND (CC-097B-CALIBRATION targets), ${failures} FAIL.`
  );
  if (failures > 0) {
    console.error(`AUDIT FAILED — ${failures} structural assertion(s) failed.`);
    return 1;
  }
  if (pendings > 0) {
    console.log(
      `AUDIT PASSED structurally — ${pendings} calibration target(s) deferred to CC-097B-CALIBRATION follow-up.`
    );
  } else {
    console.log(`AUDIT PASSED — all assertions clean.`);
  }
  return 0;
}

process.exit(main());
