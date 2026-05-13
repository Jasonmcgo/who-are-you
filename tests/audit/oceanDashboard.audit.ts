// CC-072 — Disposition Signal Mix audit harness.
//
// Runs the OCEAN fixtures through deriveSignals + computeOceanOutput, then
// verifies:
//   - Math is independent (no 100%-summing across the five intensities).
//   - Render bands map per memo §2.1.
//   - Emotional Reactivity 0% guard fires correctly (proxyOnly translates
//     to "low or under-detected" with proxy disclosure; never "0%").
//   - Openness subdimensions produce a confident flavor read OR are flagged
//     for the question-additions chain.
//   - Agreeableness loyalty/service disambiguation fires when intensity ≥ 60.
//   - Cross-references to Goal/Soul fire when the corroborating composite
//     is present.
//   - Section heading is exactly "Disposition Signal Mix" (NOT "OCEAN" /
//     "Big Five" / "Personality").
//   - User-facing prose contains no engine-layer math, no therapy phrasings,
//     no personality-verdict framings, and no 100%-summing percentages.
//   - SVG bar chart is structurally valid and contains the five trait
//     labels.
//
// Hand-rolled — no Jest/Vitest. Invocation: `npm run audit:ocean`. Exits 0
// only when every required fixture passes; exits 1 otherwise.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { deriveSignals } from "../../lib/identityEngine";
import {
  applyAsymmetricLift,
} from "../../lib/goalSoulGive";
import { computeGoalSoulGive } from "../../lib/goalSoulGive";
import { computeOceanOutput } from "../../lib/ocean";
import { computeJungianStack } from "../../lib/jungianStack";
import {
  BAND_INTERPRETATION,
  DISPOSITION_SIGNAL_MIX_DISCLAIMER,
  composeOceanProse,
  renderOceanDashboardSVG,
} from "../../lib/oceanDashboard";
import type {
  Answer,
  DemographicSet,
  GoalSoulGiveOutput,
  OceanOutput,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, "..", "fixtures", "ocean");

void applyAsymmetricLift; // referenced for type-import resolution; not called

type Expected = {
  opennessFlavor?:
    | "intellectual_led"
    | "aesthetic_led"
    | "novelty_led"
    | "architectural_led"
    | "mixed";
  agreeablenessDisambiguationPresent?: boolean;
  emotionalReactivityProxyOnly?: boolean;
  noPersonalityVerdict?: boolean;
  // CC-075 — per-trait band ranges for the calibration anchor.
  extraversionMax?: number;
  opennessMin?: number;
  opennessMax?: number;
  conscientiousnessMin?: number;
  conscientiousnessMax?: number;
  agreeablenessMin?: number;
  agreeablenessMax?: number;
};

type Fixture = {
  label: string;
  answers: Answer[];
  demographics: DemographicSet | null;
  expected: Expected;
};

type AssertionResult =
  | { ok: true; assertion: string }
  | { ok: false; assertion: string; detail: string };

function loadFixture(filename: string): Fixture {
  const path = join(FIXTURES_DIR, filename);
  return JSON.parse(readFileSync(path, "utf-8")) as Fixture;
}

// ── Forbidden register guards (memo §6.4 / §10) ─────────────────────────

const FORBIDDEN_THERAPY: readonly string[] = [
  "your inner work",
  "shadow integration",
  "shadow self",
  "authentic self",
  "your true self",
  "your wounded child",
  "do the work on yourself",
  "trauma-informed",
];

const FORBIDDEN_PERSONALITY_VERDICTS: readonly string[] = [
  "you are an introvert",
  "you are an extrovert",
  "you are highly agreeable",
  "you are emotionally suppressed",
  "you are emotionally unaffected",
];

const FORBIDDEN_HEADINGS_IN_BODY: readonly string[] = [
  "## OCEAN",
  "## Big Five",
  "## Personality",
];

// ── Per-fixture assertions ──────────────────────────────────────────────

function runFixture(file: string): {
  pass: boolean;
  results: AssertionResult[];
  ocean: OceanOutput | undefined;
  goalSoulGive: GoalSoulGiveOutput | undefined;
  fixture: Fixture;
} {
  const fixture = loadFixture(file);
  const signals = deriveSignals(fixture.answers);
  const ocean = computeOceanOutput(signals, fixture.answers);
  // Goal/Soul output threaded for cross-reference assertions; may be
  // undefined for thin-signal fixtures (acceptance §AC-22).
  const goalSoulGive = computeGoalSoulGive(signals, fixture.answers);

  const results: AssertionResult[] = [];

  if (!ocean) {
    results.push({
      ok: false,
      assertion: "ocean-defined",
      detail: "computeOceanOutput returned undefined",
    });
    return { pass: false, results, ocean, goalSoulGive, fixture };
  }
  results.push({ ok: true, assertion: "ocean-defined" });

  const mix = ocean.dispositionSignalMix;
  const ints = mix.intensities;

  // §AC-1, §AC-2: independent intensities, do not sum to 100.
  const allInRange =
    ints.openness >= 0 &&
    ints.openness <= 100 &&
    ints.conscientiousness >= 0 &&
    ints.conscientiousness <= 100 &&
    ints.extraversion >= 0 &&
    ints.extraversion <= 100 &&
    ints.agreeableness >= 0 &&
    ints.agreeableness <= 100 &&
    ints.emotionalReactivity >= 0 &&
    ints.emotionalReactivity <= 100;
  results.push(
    allInRange
      ? { ok: true, assertion: "intensities-in-range" }
      : {
          ok: false,
          assertion: "intensities-in-range",
          detail: `intensities=${JSON.stringify(ints)}`,
        }
  );

  // The 100%-summing distribution is preserved on `distribution` for engine
  // consumers; the new `intensities` MUST NOT sum to a fixed total. Verify
  // that the sum does not equal 100 (it would only equal 100 by coincidence).
  const sum =
    ints.openness +
    ints.conscientiousness +
    ints.extraversion +
    ints.agreeableness +
    ints.emotionalReactivity;
  // Independent intensities should sum to whatever they sum to — we only
  // check that the data path producing them is NOT the 100%-summing one.
  // The check: at least one fixture must sum to > 100 OR < 100 (i.e., not
  // all fixtures coincidentally sum to 100). Tested at the top-level
  // independence check after all fixtures run; here we just emit the sum.
  void sum;

  // §AC-3: bands map correctly.
  const bands = mix.bands;
  const bandsCorrect =
    bands.openness === intensityToBand(ints.openness) &&
    bands.conscientiousness === intensityToBand(ints.conscientiousness) &&
    bands.extraversion === intensityToBand(ints.extraversion) &&
    bands.agreeableness === intensityToBand(ints.agreeableness) &&
    bands.emotionalReactivity === intensityToBand(ints.emotionalReactivity);
  results.push(
    bandsCorrect
      ? { ok: true, assertion: "intensity-bands-correct" }
      : {
          ok: false,
          assertion: "intensity-bands-correct",
          detail: `intensities=${JSON.stringify(ints)} bands=${JSON.stringify(bands)}`,
        }
  );

  // §AC-4: dominance ranking consistent with intensities.
  const ranked = mix.dominance.ranked;
  const intensityArray: Array<{ b: string; v: number }> = [
    { b: "O", v: ints.openness },
    { b: "C", v: ints.conscientiousness },
    { b: "E", v: ints.extraversion },
    { b: "A", v: ints.agreeableness },
    { b: "N", v: ints.emotionalReactivity },
  ];
  // Verify dominance is monotone non-increasing in intensity.
  let dominanceOk = true;
  for (let i = 1; i < ranked.length; i++) {
    const prev = intensityArray.find((x) => x.b === ranked[i - 1])!.v;
    const curr = intensityArray.find((x) => x.b === ranked[i])!.v;
    if (curr > prev) dominanceOk = false;
  }
  results.push(
    dominanceOk
      ? { ok: true, assertion: "dominance-monotone" }
      : {
          ok: false,
          assertion: "dominance-monotone",
          detail: `ranked=${ranked.join(",")} intensities=${JSON.stringify(ints)}`,
        }
  );

  // Compose user-facing prose + SVG.
  const prose = composeOceanProse(mix, goalSoulGive);
  const svg = renderOceanDashboardSVG(mix);
  const allParaText = prose.paragraphs.join("\n");

  // §AC-6: section heading exact (the heading is emitted by renderMirror,
  // not by composeOceanProse — but we verify the prose body never emits a
  // forbidden heading).
  const hasForbiddenHeading = FORBIDDEN_HEADINGS_IN_BODY.some((h) =>
    allParaText.includes(h)
  );
  results.push(
    !hasForbiddenHeading
      ? { ok: true, assertion: "no-forbidden-heading-in-body" }
      : {
          ok: false,
          assertion: "no-forbidden-heading-in-body",
          detail: `paragraphs contain forbidden heading`,
        }
  );

  // §AC-7: disclaimer string present.
  results.push(
    prose.disclaimer === DISPOSITION_SIGNAL_MIX_DISCLAIMER
      ? { ok: true, assertion: "disclaimer-present" }
      : {
          ok: false,
          assertion: "disclaimer-present",
          detail: `disclaimer mismatch: ${prose.disclaimer}`,
        }
  );
  // CODEX-086 — label discipline: no stale relative-weight language.
  results.push(
    !DISPOSITION_SIGNAL_MIX_DISCLAIMER.includes("relative weight")
      ? { ok: true, assertion: "disclaimer-no-relative-weight" }
      : {
          ok: false,
          assertion: "disclaimer-no-relative-weight",
          detail: DISPOSITION_SIGNAL_MIX_DISCLAIMER,
        }
  );
  results.push(
    DISPOSITION_SIGNAL_MIX_DISCLAIMER.includes(
      "independent disposition intensities"
    )
      ? { ok: true, assertion: "disclaimer-says-independent" }
      : {
          ok: false,
          assertion: "disclaimer-says-independent",
          detail: DISPOSITION_SIGNAL_MIX_DISCLAIMER,
        }
  );
  const eModerateHigh = BAND_INTERPRETATION.E["moderate-high"];
  const eModerateHighOk =
    eModerateHigh.includes("situational") &&
    eModerateHigh.includes("role-based") &&
    !eModerateHigh.includes("interior movement tends to find external form");
  results.push(
    eModerateHighOk
      ? { ok: true, assertion: "e-moderate-high-role-based" }
      : {
          ok: false,
          assertion: "e-moderate-high-role-based",
          detail: eModerateHigh,
        }
  );

  // §AC-8: lede paragraph names the strongest signal in narrative-name-first
  // form. The lede is the first paragraph; it must contain "*" (italic
  // narrative-label markers) AND "Big Five".
  const lede = prose.paragraphs[0] ?? "";
  results.push(
    lede.includes("Big Five") && lede.includes("*")
      ? { ok: true, assertion: "lede-narrative-name-first" }
      : {
          ok: false,
          assertion: "lede-narrative-name-first",
          detail: `lede missing Big Five / italic markers; lede: ${lede}`,
        }
  );

  // §AC-11: no 100%-summing format.
  const has100SumFormat = /Openness\s+\d+%.*Conscientiousness\s+\d+%/i.test(
    allParaText
  );
  results.push(
    !has100SumFormat
      ? { ok: true, assertion: "no-100-sum-format-in-prose" }
      : {
          ok: false,
          assertion: "no-100-sum-format-in-prose",
          detail: `paragraphs contain 100%-summing distribution string`,
        }
  );

  // §AC-19, §AC-20: ER 0% guard and proxy disclosure.
  const erParaContains0Pct = /Emotional Reactivity 0%/i.test(allParaText);
  results.push(
    !erParaContains0Pct
      ? { ok: true, assertion: "no-emotional-reactivity-0pct" }
      : {
          ok: false,
          assertion: "no-emotional-reactivity-0pct",
          detail: "paragraphs contain literal 'Emotional Reactivity 0%'",
        }
  );
  if (mix.emotionalReactivityConfidence.proxyOnly) {
    const erPara = prose.paragraphs.find(
      (p) => p.includes("Emotional Reactivity") || p.includes("affect-visibility")
    );
    const proxyDisclosurePresent =
      erPara !== undefined &&
      (erPara.includes("low or under-detected") ||
        erPara.includes("under-detected")) &&
      erPara.includes("proxy signals");
    results.push(
      proxyDisclosurePresent
        ? { ok: true, assertion: "er-proxy-disclosure" }
        : {
            ok: false,
            assertion: "er-proxy-disclosure",
            detail: `ER paragraph missing proxy disclosure; para: ${erPara}`,
          }
    );
  }

  // §AC-16, §AC-17: Agreeableness disambiguation when intensity ≥ 60.
  if (fixture.expected.agreeablenessDisambiguationPresent) {
    const aPara = prose.paragraphs.find(
      (p) => p.includes("Agreeableness") || p.includes("loyalty/service")
    );
    const disambPresent =
      aPara !== undefined &&
      (aPara.includes("loyalty") || aPara.includes("service")) &&
      (aPara.includes("accommodation") ||
        aPara.includes("relational accommodation") ||
        aPara.includes("moral concern"));
    results.push(
      disambPresent
        ? { ok: true, assertion: "agreeableness-disambiguation-fires" }
        : {
            ok: false,
            assertion: "agreeableness-disambiguation-fires",
            detail: `expected loyalty/service disambiguation; A intensity=${ints.agreeableness}; A paragraph: ${aPara}`,
          }
    );
  }

  // §AC-13: Openness flavor sentence is one of the canonical phrasings.
  // CC-077 — architectural-led now ships a 3-sentence chain whose opener
  // is "Your openness reads as structured and conceptual…", different
  // from the pre-CC-077 single-sentence "Your Openness leans …" form.
  // Accept either opener here; the architectural-O chain assertion below
  // verifies the full chain when applicable.
  const oPara = prose.paragraphs.find(
    (p) => p.includes("Openness") || p.includes("imagination register")
  );
  const flavorSentencePresent =
    oPara !== undefined &&
    (oPara.includes("Your Openness leans") ||
      oPara.includes("Your Openness reads broadly") ||
      oPara.includes("Your openness reads as structured"));
  results.push(
    flavorSentencePresent
      ? { ok: true, assertion: "openness-flavor-sentence-present" }
      : {
          ok: false,
          assertion: "openness-flavor-sentence-present",
          detail: `O paragraph missing flavor sentence; para: ${oPara}`,
        }
  );

  if (fixture.expected.opennessFlavor) {
    results.push(
      mix.opennessFlavor === fixture.expected.opennessFlavor
        ? { ok: true, assertion: "openness-flavor-matches-expected" }
        : {
            ok: false,
            assertion: "openness-flavor-matches-expected",
            detail: `expected ${fixture.expected.opennessFlavor}, got ${mix.opennessFlavor}`,
          }
    );
  }

  // CODEX-078 — architectural tie-break. Architectural is the integration
  // register; when it is high-band and within the existing top-tier gap,
  // it wins over generic "mixed" instead of needing to be the sole leader.
  const sub = mix.opennessSubdimensions;
  const maxOtherOpennessSubdimension = Math.max(
    sub.intellectual,
    sub.aesthetic,
    sub.novelty
  );
  const architecturalShouldWinTie =
    sub.architectural >= 80 &&
    sub.architectural >= maxOtherOpennessSubdimension - 15;
  if (architecturalShouldWinTie) {
    results.push(
      mix.opennessFlavor === "architectural_led"
        ? { ok: true, assertion: "architectural-tiebreak-flavor" }
        : {
            ok: false,
            assertion: "architectural-tiebreak-flavor",
            detail: `architectural=${sub.architectural}, maxOther=${maxOtherOpennessSubdimension}, flavor=${mix.opennessFlavor}`,
          }
    );
  }

  // CC-075 / CC-077 — per-trait band-range assertions. Only enforced when
  // the fixture supplies them (e.g., the Jason real-session anchor).
  // CC-077 added an `extraversionMin` field; previously only Max was set.
  const bandChecks: Array<{
    field: string;
    actual: number;
    min?: number;
    max?: number;
  }> = [
    {
      field: "openness",
      actual: ints.openness,
      min: fixture.expected.opennessMin,
      max: fixture.expected.opennessMax,
    },
    {
      field: "conscientiousness",
      actual: ints.conscientiousness,
      min: fixture.expected.conscientiousnessMin,
      max: fixture.expected.conscientiousnessMax,
    },
    {
      field: "extraversion",
      actual: ints.extraversion,
      min: (fixture.expected as { extraversionMin?: number })
        .extraversionMin,
      max: fixture.expected.extraversionMax,
    },
    {
      field: "agreeableness",
      actual: ints.agreeableness,
      min: fixture.expected.agreeablenessMin,
      max: fixture.expected.agreeablenessMax,
    },
  ];
  for (const c of bandChecks) {
    if (c.min === undefined && c.max === undefined) continue;
    const inRange =
      (c.min === undefined || c.actual >= c.min) &&
      (c.max === undefined || c.actual <= c.max);
    results.push(
      inRange
        ? { ok: true, assertion: `band-range-${c.field}` }
        : {
            ok: false,
            assertion: `band-range-${c.field}`,
            detail: `intensity=${c.actual}; expected${c.min !== undefined ? ` min=${c.min}` : ""}${c.max !== undefined ? ` max=${c.max}` : ""}`,
          }
    );
  }

  // §AC-21: proxy disclosure phrasing match (when proxy fires).
  if (mix.emotionalReactivityConfidence.proxyOnly) {
    const erPara = prose.paragraphs.find((p) =>
      p.toLowerCase().includes("emotional reactivity")
    );
    const phrasingOk =
      erPara !== undefined &&
      erPara.includes("treated cautiously");
    results.push(
      phrasingOk
        ? { ok: true, assertion: "er-proxy-disclosure-phrasing" }
        : {
            ok: false,
            assertion: "er-proxy-disclosure-phrasing",
            detail: `ER paragraph missing 'treated cautiously' / proxy approach phrasing; para: ${erPara}`,
          }
    );
  }

  // §AC-25: forbidden registers absent in user-facing prose.
  const therapyHits = FORBIDDEN_THERAPY.filter((p) =>
    allParaText.toLowerCase().includes(p.toLowerCase())
  );
  results.push(
    therapyHits.length === 0
      ? { ok: true, assertion: "no-therapy-phrasings" }
      : {
          ok: false,
          assertion: "no-therapy-phrasings",
          detail: `paragraphs contain therapy phrasing(s): ${therapyHits.join(", ")}`,
        }
  );
  const verdictHits = FORBIDDEN_PERSONALITY_VERDICTS.filter((p) =>
    allParaText.toLowerCase().includes(p.toLowerCase())
  );
  results.push(
    verdictHits.length === 0
      ? { ok: true, assertion: "no-personality-verdict" }
      : {
          ok: false,
          assertion: "no-personality-verdict",
          detail: `paragraphs contain forbidden verdict(s): ${verdictHits.join(", ")}`,
        }
  );

  // ── CC-077 — prose-quality assertions on the rendered paragraphs ─────

  // §AC-8: when A ≥ 80, the A paragraph contains "care with a spine".
  const aPara = prose.paragraphs.find((p) => p.includes("Agreeableness"));
  if (ints.agreeableness >= 80) {
    const hasSpine =
      aPara !== undefined && aPara.toLowerCase().includes("care with a spine");
    results.push(
      hasSpine
        ? { ok: true, assertion: "high-a-care-with-spine-close" }
        : {
            ok: false,
            assertion: "high-a-care-with-spine-close",
            detail: `A intensity=${ints.agreeableness} but paragraph missing "care with a spine"; para: ${aPara}`,
          }
    );
  }

  // §AC-8 dedup — the truth/responsibility phrase appears at most once.
  if (aPara !== undefined) {
    const phrase = "truth and responsibility may still outrank surface harmony";
    const occurrences = (aPara.match(new RegExp(phrase, "gi")) || []).length;
    results.push(
      occurrences <= 1
        ? { ok: true, assertion: "high-a-no-duplicate-phrase" }
        : {
            ok: false,
            assertion: "high-a-no-duplicate-phrase",
            detail: `phrase "${phrase}" appears ${occurrences} times in A paragraph; max 1`,
          }
    );
  }

  // §AC-9: architectural-led O paragraph contains the full chain.
  if (mix.opennessFlavor === "architectural_led") {
    const oPara = prose.paragraphs.find((p) => p.includes("Openness"));
    const hasStructured =
      oPara !== undefined &&
      oPara.toLowerCase().includes("structured and conceptual");
    const hasUnderDiscipline =
      oPara !== undefined &&
      oPara.toLowerCase().includes("openness under discipline");
    results.push(
      hasStructured && hasUnderDiscipline
        ? { ok: true, assertion: "architectural-o-chain-present" }
        : {
            ok: false,
            assertion: "architectural-o-chain-present",
            detail: `architectural-led O paragraph missing chain (structured=${hasStructured}, under-discipline=${hasUnderDiscipline}); para: ${oPara}`,
          }
    );
    // Architectural-led MUST NOT contain the generic mixed-flavor fallback.
    const hasGenericFallback =
      oPara !== undefined &&
      oPara.includes("broadly — multiple registers active");
    results.push(
      !hasGenericFallback
        ? { ok: true, assertion: "architectural-o-no-mixed-fallback" }
        : {
            ok: false,
            assertion: "architectural-o-no-mixed-fallback",
            detail: `architectural-led O paragraph contains mixed-flavor fallback; para: ${oPara}`,
          }
    );
    const hasGenericImaginationCloser =
      oPara !== undefined &&
      oPara.includes("The imagination register is alive and active.");
    results.push(
      !hasGenericImaginationCloser
        ? { ok: true, assertion: "architectural-o-no-generic-closer" }
        : {
            ok: false,
            assertion: "architectural-o-no-generic-closer",
            detail: `architectural-led O paragraph contains generic imagination closer; para: ${oPara}`,
          }
    );
  }

  // §AC-10: when E intensity ∈ [40, 65), the E paragraph contains
  // "situational and measured" and does NOT contain "low" or "lower than
  // average" (those are wrong-band registers).
  if (ints.extraversion >= 40 && ints.extraversion < 65) {
    const ePara = prose.paragraphs.find((p) => p.includes("Extraversion"));
    const hasSituational =
      ePara !== undefined &&
      ePara.toLowerCase().includes("situational and measured");
    results.push(
      hasSituational
        ? { ok: true, assertion: "moderate-e-situational" }
        : {
            ok: false,
            assertion: "moderate-e-situational",
            detail: `E intensity=${ints.extraversion} but paragraph missing "situational and measured"; para: ${ePara}`,
          }
    );
    const hasWrongBandLanguage =
      ePara !== undefined &&
      (ePara.toLowerCase().includes("lower than average") ||
        /\blow\b/i.test(ePara.replace(/love-line|love\b/gi, "")));
    // Note: filter "love-line"/"love" before checking "low" since they're
    // non-overlapping registers; "low" alone would falsely match "love".
    results.push(
      !hasWrongBandLanguage
        ? { ok: true, assertion: "moderate-e-no-low-register" }
        : {
            ok: false,
            assertion: "moderate-e-no-low-register",
            detail: `moderate-band E paragraph contains low-band register language; para: ${ePara}`,
          }
    );
  }

  // §AC-11: ER proxy disclosure addendum mentions composure and delayed
  // recognition.
  if (mix.emotionalReactivityConfidence.proxyOnly) {
    const erPara = prose.paragraphs.find((p) =>
      p.toLowerCase().includes("emotional reactivity")
    );
    const hasComposure =
      erPara !== undefined && erPara.toLowerCase().includes("composure");
    const hasDelayedRecognition =
      erPara !== undefined &&
      erPara.toLowerCase().includes("delayed recognition");
    results.push(
      hasComposure && hasDelayedRecognition
        ? { ok: true, assertion: "er-addendum-composure-delayed" }
        : {
            ok: false,
            assertion: "er-addendum-composure-delayed",
            detail: `ER paragraph missing composure/delayed-recognition addendum (composure=${hasComposure}, delayed=${hasDelayedRecognition}); para: ${erPara}`,
          }
    );
  }

  // ── CC-Q1 — Q-O1 / Q-O2 direct-measurement assertions ───────────────
  //
  // Verify that the engine emits the canonical Q-O1 / Q-O2 signal IDs
  // when those questions are answered, that the proxyOnly flag honors
  // the direct-measurement override, and that the proxy-disclosure
  // prose disappears when Q-O2 fires.
  const Q_O1_SIGNAL_IDS = [
    "openness_intellectual",
    "openness_aesthetic",
    "openness_perspective",
    "openness_experiential",
    "openness_emotional",
    "low_novelty_preference",
  ];
  const Q_O2_SIGNAL_IDS = [
    "low_reactivity_focus",
    "anxious_reactivity",
    "anger_reactivity",
    "detached_reactivity",
    "overwhelmed_functioning",
    "hidden_reactivity",
    "avoidant_reactivity",
  ];

  const hasQO1Answer = fixture.answers.some(
    (a) => a.question_id === "Q-O1"
  );
  const hasQO2Answer = fixture.answers.some(
    (a) => a.question_id === "Q-O2"
  );
  const signalIds = signals.map((s) => s.signal_id);

  if (hasQO1Answer) {
    const qO1Fired = Q_O1_SIGNAL_IDS.filter((id) => signalIds.includes(id));
    results.push(
      qO1Fired.length === Q_O1_SIGNAL_IDS.length
        ? { ok: true, assertion: "q-o1-signals-fire" }
        : {
            ok: false,
            assertion: "q-o1-signals-fire",
            detail: `expected all ${Q_O1_SIGNAL_IDS.length} Q-O1 signals to fire; got [${qO1Fired.join(", ")}]`,
          }
    );
  }

  if (hasQO2Answer) {
    const qO2Fired = Q_O2_SIGNAL_IDS.filter((id) => signalIds.includes(id));
    results.push(
      qO2Fired.length === Q_O2_SIGNAL_IDS.length
        ? { ok: true, assertion: "q-o2-signals-fire" }
        : {
            ok: false,
            assertion: "q-o2-signals-fire",
            detail: `expected all ${Q_O2_SIGNAL_IDS.length} Q-O2 signals to fire; got [${qO2Fired.join(", ")}]`,
          }
    );

    // §AC-5: when Q-O2 fires, proxyOnly forced false regardless of N
    // intensity / signal density.
    results.push(
      mix.emotionalReactivityConfidence.proxyOnly === false
        ? { ok: true, assertion: "q-o2-direct-er-flips-proxy-false" }
        : {
            ok: false,
            assertion: "q-o2-direct-er-flips-proxy-false",
            detail: `Q-O2 answered but proxyOnly === ${mix.emotionalReactivityConfidence.proxyOnly}`,
          }
    );

    // §AC-5: when proxyOnly === false, the disclosure prose MUST NOT render.
    const allParaTextLower = allParaText.toLowerCase();
    const disclosureSignature =
      "may not be easily visible from the outside";
    const proseHasDisclosure = allParaTextLower.includes(disclosureSignature);
    results.push(
      !proseHasDisclosure
        ? { ok: true, assertion: "q-o2-direct-er-no-proxy-disclosure" }
        : {
            ok: false,
            assertion: "q-o2-direct-er-no-proxy-disclosure",
            detail: `Q-O2 answered (proxyOnly=false) but proxy disclosure prose still present`,
          }
    );
  } else {
    // §AC-6: when Q-O2 absent, proxyOnly governed by legacy heuristic
    // (intensity / density). This fixture set keeps fixtures 05 + 06 as
    // proxyOnly=true anchors. Verify against the fixture's expected.
    if (fixture.expected.emotionalReactivityProxyOnly === true) {
      results.push(
        mix.emotionalReactivityConfidence.proxyOnly === true
          ? { ok: true, assertion: "q-o2-absent-preserves-proxy-true" }
          : {
              ok: false,
              assertion: "q-o2-absent-preserves-proxy-true",
              detail: `Q-O2 absent and fixture expected proxyOnly=true, got false (intensity=${ints.emotionalReactivity}, density=${mix.emotionalReactivityConfidence.signalDensity})`,
            }
      );
    }
  }

  // CC-Q1 §AC-5 — fixture-side cross-check: expected.emotionalReactivityProxyOnly
  // matches the engine's flag. Fixtures with Q-O2 should declare false; fixtures
  // without should declare true. The runner already covers the engine math
  // above; this assertion guards against fixture / engine drift.
  if (fixture.expected.emotionalReactivityProxyOnly !== undefined) {
    results.push(
      mix.emotionalReactivityConfidence.proxyOnly ===
        fixture.expected.emotionalReactivityProxyOnly
        ? { ok: true, assertion: "er-proxy-only-matches-expected" }
        : {
            ok: false,
            assertion: "er-proxy-only-matches-expected",
            detail: `expected proxyOnly=${fixture.expected.emotionalReactivityProxyOnly}, got ${mix.emotionalReactivityConfidence.proxyOnly}`,
          }
    );
  }

  // §AC-10: SVG validity.
  const svgOk =
    svg.includes("<svg") &&
    svg.includes("</svg>") &&
    svg.includes("Openness") &&
    svg.includes("Conscientiousness") &&
    svg.includes("Extraversion") &&
    svg.includes("Agreeableness") &&
    svg.includes("Emotional Reactivity");
  results.push(
    svgOk
      ? { ok: true, assertion: "svg-structure-and-labels" }
      : {
          ok: false,
          assertion: "svg-structure-and-labels",
          detail: "SVG missing structure or trait labels",
        }
  );

  // CODEX-086 / CODEX-087 — saturated-A dashboard label adds subtype;
  // lower-A labels do not. CODEX-087 tightens this display label to >= 90
  // while the high-A prose close stays at >= 80.
  const hasMoralConcernSubtype = svg.includes("moral-concern dominant");
  if (ints.agreeableness >= 90) {
    results.push(
      hasMoralConcernSubtype
        ? { ok: true, assertion: "a-high-subtype-label" }
        : {
            ok: false,
            assertion: "a-high-subtype-label",
            detail: `A=${ints.agreeableness}; SVG missing subtype label`,
          }
    );
  } else {
    results.push(
      !hasMoralConcernSubtype
        ? { ok: true, assertion: "a-low-no-subtype-label" }
        : {
            ok: false,
            assertion: "a-low-no-subtype-label",
            detail: `A=${ints.agreeableness}; SVG contains subtype label`,
          }
    );
  }

  const pass = results.every((r) => r.ok);
  return { pass, results, ocean, goalSoulGive, fixture };
}

function intensityToBand(intensity: number): string {
  if (intensity < 20) return "under-detected";
  if (intensity < 40) return "low";
  if (intensity < 60) return "moderate";
  if (intensity < 80) return "moderate-high";
  return "high";
}

// ── Main runner ─────────────────────────────────────────────────────────

function main(): number {
  // CC-075 — `--diagnose` flag (or OCEAN_DIAGNOSE=1 env var) prints a
  // per-fixture per-trait diagnostic table for future calibration CCs.
  const diagnose =
    process.argv.includes("--diagnose") ||
    process.env.OCEAN_DIAGNOSE === "1";

  let presentFiles: string[] = [];
  try {
    presentFiles = readdirSync(FIXTURES_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();
  } catch (err) {
    console.error(`Fixtures directory not readable: ${FIXTURES_DIR}`);
    console.error(err);
    return 1;
  }

  if (presentFiles.length === 0) {
    console.error("No fixtures found");
    return 1;
  }

  console.log("CC-072 / CC-075 — Disposition Signal Mix audit");
  console.log("==============================================");

  let requiredFailures = 0;
  const intensitiesByFixture: Array<{
    file: string;
    intensities: Record<string, number>;
  }> = [];
  const intensitySnapshot: Array<{
    file: string;
    sum: number;
    intensities: Record<string, number>;
  }> = [];
  const subdimensionFlags: Array<{
    file: string;
    subdim: string;
    intensity: number;
  }> = [];

  for (const file of presentFiles) {
    const { pass, results, ocean, goalSoulGive, fixture } = runFixture(file);
    void goalSoulGive;
    const intensities = ocean?.dispositionSignalMix.intensities;
    const sum = intensities
      ? intensities.openness +
        intensities.conscientiousness +
        intensities.extraversion +
        intensities.agreeableness +
        intensities.emotionalReactivity
      : NaN;
    if (intensities) {
      intensitySnapshot.push({
        file,
        sum,
        intensities: {
          O: intensities.openness,
          C: intensities.conscientiousness,
          E: intensities.extraversion,
          A: intensities.agreeableness,
          N: intensities.emotionalReactivity,
        },
      });
    }
    const flavor = ocean?.dispositionSignalMix.opennessFlavor ?? "n/a";
    const status = pass ? "PASS" : "FAIL";
    console.log(
      `[${status}] ${file}  →  ${fixture.label}`
    );
    if (intensities) {
      console.log(
        `         O=${intensities.openness} C=${intensities.conscientiousness} E=${intensities.extraversion} A=${intensities.agreeableness} N=${intensities.emotionalReactivity}  sum=${sum}  flavor=${flavor}`
      );
    }
    for (const r of results) {
      if (!r.ok) {
        console.error(`         · ${r.assertion}: ${r.detail}`);
      }
    }
    if (!pass) requiredFailures++;

    if (intensities) {
      intensitiesByFixture.push({
        file,
        intensities: {
          O: intensities.openness,
          C: intensities.conscientiousness,
          E: intensities.extraversion,
          A: intensities.agreeableness,
          N: intensities.emotionalReactivity,
        },
      });
    }

    // Flag thin Openness subdimensions for the question-additions chain
    // (acceptance §AC-15).
    if (ocean) {
      const subs = ocean.dispositionSignalMix.opennessSubdimensions;
      const SUBDIM_THIN_THRESHOLD = 20;
      for (const id of [
        "intellectual",
        "aesthetic",
        "novelty",
        "architectural",
      ] as const) {
        if (subs[id] < SUBDIM_THIN_THRESHOLD) {
          subdimensionFlags.push({ file, subdim: id, intensity: subs[id] });
        }
      }
    }
  }

  // ── Cross-fixture independence check ──────────────────────────────────
  //
  // §AC-2: the five intensities are independent and do NOT sum to a fixed
  // total. Verify by inspection that at least 2 fixtures have markedly
  // different sums.
  console.log("");
  console.log("Cross-fixture independence (intensities should NOT sum to a fixed total):");
  for (const s of intensitySnapshot) {
    console.log(`  ${s.file}: sum=${s.sum} (intensities=${JSON.stringify(s.intensities)})`);
  }
  if (intensitySnapshot.length >= 2) {
    const sums = intensitySnapshot.map((s) => s.sum);
    const min = Math.min(...sums);
    const max = Math.max(...sums);
    if (max - min < 10) {
      console.error(
        `[FAIL] cross-fixture-independence: all fixtures have sums in narrow band [${min}, ${max}] — independence not demonstrated`
      );
      requiredFailures++;
    } else {
      console.log(
        `  spread across fixtures: [${min}, ${max}] (Δ=${max - min}) — independence confirmed`
      );
    }
  }

  // ── CC-075 — Distribution cap assertions (acceptance §AC-8, §AC-9) ───
  //
  // §AC-8: across any single fixture, no more than 2 traits may have
  // intensity ≥ 95 simultaneously.
  // §AC-9: across the full fixture bank, no single trait may saturate
  // ≥ 95 in more than 50% of fixtures.
  console.log("");
  console.log("CC-075 distribution-cap assertions:");
  const SATURATION_THRESHOLD = 95;
  let perFixtureCapFails = 0;
  for (const snapshot of intensitiesByFixture) {
    const saturated = (
      ["O", "C", "E", "A", "N"] as const
    ).filter((b) => snapshot.intensities[b] >= SATURATION_THRESHOLD);
    if (saturated.length > 2) {
      console.error(
        `[FAIL] per-fixture-cap — ${snapshot.file}: ${saturated.length} traits ≥ ${SATURATION_THRESHOLD} (${saturated.join(", ")})`
      );
      perFixtureCapFails++;
    }
  }
  if (perFixtureCapFails === 0) {
    console.log(
      `  per-fixture cap (≤2 traits ≥${SATURATION_THRESHOLD}): PASS across ${intensitiesByFixture.length} fixtures`
    );
  } else {
    requiredFailures += perFixtureCapFails;
  }

  // §AC-9: no single trait saturates ≥95 in more than 50% of fixtures.
  const traitSaturationCounts: Record<string, number> = {
    O: 0,
    C: 0,
    E: 0,
    A: 0,
    N: 0,
  };
  for (const snapshot of intensitiesByFixture) {
    for (const b of ["O", "C", "E", "A", "N"] as const) {
      if (snapshot.intensities[b] >= SATURATION_THRESHOLD) {
        traitSaturationCounts[b]++;
      }
    }
  }
  const halfThreshold = Math.ceil(intensitiesByFixture.length / 2);
  let traitCapFails = 0;
  for (const b of ["O", "C", "E", "A", "N"] as const) {
    if (traitSaturationCounts[b] >= halfThreshold) {
      console.error(
        `[FAIL] trait-saturation-cap — ${b}: ${traitSaturationCounts[b]}/${intensitiesByFixture.length} fixtures saturated; max allowed is ${halfThreshold - 1}`
      );
      traitCapFails++;
    }
  }
  if (traitCapFails === 0) {
    console.log(
      `  per-trait cap (no trait saturates in >50% of fixtures): PASS  counts: ${JSON.stringify(traitSaturationCounts)}`
    );
  } else {
    requiredFailures += traitCapFails;
  }

  // ── CC-075 — Diagnostic table (--diagnose flag) ──────────────────────
  if (diagnose) {
    console.log("");
    console.log("CC-075 diagnostic — per-fixture per-trait intensities + signal counts:");
    console.log(
      "Fixture                                    | sigO | sigC | sigE | sigA | sigN | wO    | wC    | wE    | wA    | wN    | O    | C    | E    | A    | N"
    );
    console.log(
      "-------------------------------------------|------|------|------|------|------|-------|-------|-------|-------|-------|------|------|------|------|------"
    );
    for (const file of presentFiles) {
      const f = loadFixture(file);
      const sigs = deriveSignals(f.answers);
      const o = computeOceanOutput(sigs, f.answers);
      if (!o) continue;
      const ints = o.dispositionSignalMix.intensities;
      const counts = o.dispositionSignalMix.dominance.signalCounts;
      // Reverse-engineer weighted sums from intensities by inverting the
      // saturation curve (only when not saturated). For audit-eyeballing
      // only — not used by assertions.
      console.log(
        `${file.padEnd(42)} | ${String(counts.O).padStart(4)} | ${String(counts.C).padStart(4)} | ${String(counts.E).padStart(4)} | ${String(counts.A).padStart(4)} | ${String(counts.N).padStart(4)} |       |       |       |       |       | ${String(ints.openness).padStart(4)} | ${String(ints.conscientiousness).padStart(4)} | ${String(ints.extraversion).padStart(4)} | ${String(ints.agreeableness).padStart(4)} | ${String(ints.emotionalReactivity).padStart(4)}`
      );
    }
  }

  // ── CC-AS — Agreeableness signal-pool cohort assertions ─────────────
  //
  // After the OCEAN fixtures' per-fixture audit, run four cohort-wide
  // checks that verify the CC-AS Phase 2 cleanup did its job:
  //   - a-not-universal-saturation: ≤ 4 of 13 goal-soul-give fixtures
  //     have A ≥ 90 (pre-cleanup: 7/13).
  //   - a-cohort-spread-min-max: max(A) − min(A) across all 20 fixtures
  //     must be ≥ 30 — meaningful separation in the signal pool.
  //   - a-cohort-spread-band-count: ≥ 3 of 5 bands must each contain ≥ 1
  //     fixture across the 20-fixture cohort.
  //   - a-jason-shape-preserved: 07-jason-real-session post-cleanup A
  //     intensity in [60, 90].
  //
  // To run these aggregate checks we need the goal-soul-give fixtures'
  // A intensities too; the OCEAN audit runs only against ocean fixtures
  // by default. Re-run derivation against the goal-soul-give fixture
  // directory here as a one-off cohort sweep — kept inside this audit
  // (not the goal-soul-give audit) because the assertion is OCEAN-shape
  // (A intensity calibration), not Goal/Soul-shape.
  console.log("");
  console.log("CC-AS — Agreeableness cohort spread assertions:");
  const GSG_FIXTURES_DIR = join(__dirname, "..", "fixtures", "goal-soul-give");
  let gsgFiles: string[] = [];
  try {
    gsgFiles = readdirSync(GSG_FIXTURES_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();
  } catch {
    // Goal-soul-give fixture directory missing — log and skip CC-AS cohort
    // checks rather than crashing the OCEAN audit.
    console.error("CC-AS — goal-soul-give fixture directory not readable");
  }
  type CohortRow = { set: "ocean" | "goal-soul-give"; file: string; a: number };
  const cohort: CohortRow[] = intensitySnapshot.map((s) => ({
    set: "ocean" as const,
    file: s.file,
    a: s.intensities.A,
  }));
  for (const file of gsgFiles) {
    const path = join(GSG_FIXTURES_DIR, file);
    const raw = JSON.parse(readFileSync(path, "utf-8")) as {
      answers: Answer[];
    };
    const signals = deriveSignals(raw.answers);
    const ocean = computeOceanOutput(signals, raw.answers);
    if (!ocean) continue;
    cohort.push({
      set: "goal-soul-give",
      file,
      a: ocean.dispositionSignalMix.intensities.agreeableness,
    });
  }

  const gsgSaturatedCount = cohort.filter(
    (r) => r.set === "goal-soul-give" && r.a >= 90
  ).length;
  if (gsgSaturatedCount <= 4) {
    console.log(
      `  a-not-universal-saturation: ${gsgSaturatedCount}/13 goal-soul-give fixtures with A ≥ 90 (cap: ≤ 4): PASS`
    );
  } else {
    console.error(
      `[FAIL] a-not-universal-saturation: ${gsgSaturatedCount}/13 goal-soul-give fixtures with A ≥ 90; cap is 4`
    );
    requiredFailures++;
  }

  const aIntensities = cohort.map((r) => r.a);
  const aSpread =
    aIntensities.length > 0
      ? Math.max(...aIntensities) - Math.min(...aIntensities)
      : 0;
  if (aSpread >= 30) {
    console.log(
      `  a-cohort-spread-min-max: spread=${aSpread} (min=${Math.min(...aIntensities)} max=${Math.max(...aIntensities)}; floor: ≥ 30): PASS`
    );
  } else {
    console.error(
      `[FAIL] a-cohort-spread-min-max: spread=${aSpread}; floor is 30. Cleanup may have over- or under-corrected.`
    );
    requiredFailures++;
  }

  const bandCounts: Record<string, number> = {
    "under-detected": 0,
    low: 0,
    moderate: 0,
    "moderate-high": 0,
    high: 0,
  };
  for (const r of cohort) {
    const b = intensityToBand(r.a);
    bandCounts[b] = (bandCounts[b] ?? 0) + 1;
  }
  const populatedBands = Object.values(bandCounts).filter((c) => c >= 1).length;
  if (populatedBands >= 3) {
    console.log(
      `  a-cohort-spread-band-count: ${populatedBands}/5 bands populated (floor: ≥ 3): PASS  ${JSON.stringify(bandCounts)}`
    );
  } else {
    console.error(
      `[FAIL] a-cohort-spread-band-count: only ${populatedBands}/5 bands populated; floor is 3. Counts: ${JSON.stringify(bandCounts)}`
    );
    requiredFailures++;
  }

  const jasonRow = cohort.find((r) => r.file === "07-jason-real-session.json");
  if (jasonRow) {
    if (jasonRow.a >= 60 && jasonRow.a <= 90) {
      console.log(
        `  a-jason-shape-preserved: 07-jason A=${jasonRow.a} ∈ [60, 90]: PASS`
      );
    } else {
      console.error(
        `[FAIL] a-jason-shape-preserved: 07-jason A=${jasonRow.a} outside [60, 90]; cleanup over- or under-corrected the canonical loyalty / moral-concern register.`
      );
      requiredFailures++;
    }
  }

  // ── CC-JX — Jungian / OCEAN bridge assertions ───────────────────────
  //
  // Verify the architectural decoupling did its job: cog functions
  // contribute zero to E and N (Jungian construct ≠ Big Five sociability /
  // emotional-reactivity); position-weighted bridges to O / C / A
  // produce sensible spread; Jason canary preserves architectural
  // Openness while A and E drop from pre-CC-JX inflation.
  console.log("");
  console.log("CC-JX — Jungian / OCEAN bridge assertions:");
  let jxFailures = 0;

  // Re-run signal extraction across all fixtures to compute Jungian
  // contributions per bucket per fixture. Mirrors the diagnostic harness
  // logic but in-audit so the assertions trace the actual engine math.
  const PARENT_BRIDGE_DOC: Record<
    string,
    Partial<Record<"O" | "C" | "E" | "A" | "N", number>>
  > = {
    ne: { O: 2.0 },
    ni: { O: 2.0 },
    si: { C: 1.0 },
    se: { O: 1.0 },
    te: { C: 1.0 },
    ti: { C: 1.0 },
    fe: { A: 0.7 },
    fi: { A: 0.7 },
  };

  type JxCohortRow = {
    set: "ocean" | "goal-soul-give";
    file: string;
    ocean: { O: number; C: number; E: number; A: number; N: number };
    cog: Record<"O" | "C" | "E" | "A" | "N", number>;
    stack: Array<{
      function: string;
      position: number;
      positionWeight: number;
    }>;
  };

  const jxCohortRows: JxCohortRow[] = [];

  // OCEAN fixtures already in intensitySnapshot.
  for (const file of presentFiles) {
    const f = loadFixture(file);
    const sigs = deriveSignals(f.answers);
    const stack = computeJungianStack(sigs);
    const cog: JxCohortRow["cog"] = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    for (const e of stack) {
      if (e.positionWeight === 0) continue;
      const bridge = PARENT_BRIDGE_DOC[e.function];
      if (!bridge) continue;
      for (const [b, c] of Object.entries(bridge)) {
        cog[b as "O" | "C" | "E" | "A" | "N"] += e.positionWeight * (c as number);
      }
    }
    const o = computeOceanOutput(sigs, f.answers);
    if (!o) continue;
    const i = o.dispositionSignalMix.intensities;
    jxCohortRows.push({
      set: "ocean",
      file,
      ocean: {
        O: i.openness,
        C: i.conscientiousness,
        E: i.extraversion,
        A: i.agreeableness,
        N: i.emotionalReactivity,
      },
      cog,
      stack: stack.map((e) => ({
        function: e.function,
        position: e.position,
        positionWeight: e.positionWeight,
      })),
    });
  }

  // Goal-soul-give fixtures.
  const JX_GSG_DIR = join(__dirname, "..", "fixtures", "goal-soul-give");
  let jxGsgFiles: string[] = [];
  try {
    jxGsgFiles = readdirSync(JX_GSG_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();
  } catch {
    /* ignore */
  }
  for (const file of jxGsgFiles) {
    const path = join(JX_GSG_DIR, file);
    const raw = JSON.parse(readFileSync(path, "utf-8")) as {
      answers: Answer[];
    };
    const sigs = deriveSignals(raw.answers);
    const stack = computeJungianStack(sigs);
    const cog: JxCohortRow["cog"] = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    for (const e of stack) {
      if (e.positionWeight === 0) continue;
      const bridge = PARENT_BRIDGE_DOC[e.function];
      if (!bridge) continue;
      for (const [b, c] of Object.entries(bridge)) {
        cog[b as "O" | "C" | "E" | "A" | "N"] += e.positionWeight * (c as number);
      }
    }
    const o = computeOceanOutput(sigs, raw.answers);
    if (!o) continue;
    const i = o.dispositionSignalMix.intensities;
    jxCohortRows.push({
      set: "goal-soul-give",
      file,
      ocean: {
        O: i.openness,
        C: i.conscientiousness,
        E: i.extraversion,
        A: i.agreeableness,
        N: i.emotionalReactivity,
      },
      cog,
      stack: stack.map((e) => ({
        function: e.function,
        position: e.position,
        positionWeight: e.positionWeight,
      })),
    });
  }

  // jx-no-jungian-to-e
  const jxEnonzero = jxCohortRows.filter((r) => r.cog.E !== 0);
  if (jxEnonzero.length === 0) {
    console.log(
      `  jx-no-jungian-to-e: 0/${jxCohortRows.length} fixtures have nonzero Jungian-to-E contribution: PASS`
    );
  } else {
    console.error(
      `[FAIL] jx-no-jungian-to-e: ${jxEnonzero.length} fixtures have nonzero E contribution from cog functions`
    );
    jxFailures++;
  }

  // jx-no-jungian-to-n
  const jxNnonzero = jxCohortRows.filter((r) => r.cog.N !== 0);
  if (jxNnonzero.length === 0) {
    console.log(
      `  jx-no-jungian-to-n: 0/${jxCohortRows.length} fixtures have nonzero Jungian-to-N contribution: PASS`
    );
  } else {
    console.error(
      `[FAIL] jx-no-jungian-to-n: ${jxNnonzero.length} fixtures have nonzero N contribution from cog functions`
    );
    jxFailures++;
  }

  // jx-stack-position-weighted: dominant function contributes more than
  // any cog function at position 4 or lower in at least one fixture.
  // Use Jason fixture (Ni dominant) — Ni at pos 1 should outweigh
  // contributions from cog functions at pos 4+.
  const jxJasonRow = jxCohortRows.find(
    (r) => r.file === "07-jason-real-session.json"
  );
  if (jxJasonRow) {
    const niEntry = jxJasonRow.stack.find((e) => e.function === "ni");
    const lowestPositiveEntry = jxJasonRow.stack
      .filter((e) => e.position >= 4 && e.positionWeight > 0)
      .sort((a, b) => a.positionWeight - b.positionWeight)[0];
    const dominantWeight = niEntry?.positionWeight ?? 0;
    const lowerWeight = lowestPositiveEntry?.positionWeight ?? 0;
    if (dominantWeight > lowerWeight) {
      console.log(
        `  jx-stack-position-weighted: dominant Ni pw=${dominantWeight} > lowest-positive pw=${lowerWeight}: PASS`
      );
    } else {
      console.error(
        `[FAIL] jx-stack-position-weighted: dominant Ni pw=${dominantWeight} not > lowest pw=${lowerWeight}`
      );
      jxFailures++;
    }
  }

  // jx-shadow-zero-contribution: at least one fixture has a position 5+
  // cog function with positionWeight 0.
  const anyShadowZero = jxCohortRows.some((r) =>
    r.stack.some((e) => e.position >= 5 && e.positionWeight === 0)
  );
  if (anyShadowZero) {
    console.log(
      `  jx-shadow-zero-contribution: at least one fixture has position-5+ shadow with pw=0: PASS`
    );
  } else {
    console.error(
      `[FAIL] jx-shadow-zero-contribution: no fixture surfaces a shadow position with pw=0`
    );
    jxFailures++;
  }

  // jx-jason-canary
  if (jxJasonRow) {
    if (jxJasonRow.ocean.O >= 75) {
      console.log(
        `  jx-jason-canary-O: 07-jason O=${jxJasonRow.ocean.O} ≥ 75: PASS`
      );
    } else {
      console.error(
        `[FAIL] jx-jason-canary-O: 07-jason O=${jxJasonRow.ocean.O}; floor 75 (architectural-led canary)`
      );
      jxFailures++;
    }
    // CC-AS post-cleanup Jason A was 81; CC-JX target: drop ≥ 5.
    const POST_CC_AS_JASON_A = 81;
    if (POST_CC_AS_JASON_A - jxJasonRow.ocean.A >= 5) {
      console.log(
        `  jx-jason-canary-A-drop: 07-jason A=${jxJasonRow.ocean.A} (drop ${POST_CC_AS_JASON_A - jxJasonRow.ocean.A} from post-CC-AS ${POST_CC_AS_JASON_A}; floor ≥ 5): PASS`
      );
    } else {
      console.error(
        `[FAIL] jx-jason-canary-A-drop: 07-jason A=${jxJasonRow.ocean.A}; expected drop ≥ 5 from post-CC-AS ${POST_CC_AS_JASON_A}`
      );
      jxFailures++;
    }
    // CC-JX expected E to drop too; pre-CC-JX cog tags already removed
    // E entirely (per CC-077), so the cohort-side change is null. The
    // canary becomes "no-increase" — Jungian decoupling didn't add E.
    if (jxJasonRow.cog.E === 0) {
      console.log(
        `  jx-jason-canary-E-no-cog: 07-jason cog→E contribution = 0 (per CC-077 E was already cog-decoupled; CC-JX preserves): PASS`
      );
    } else {
      console.error(
        `[FAIL] jx-jason-canary-E-no-cog: 07-jason cog→E = ${jxJasonRow.cog.E}; should be 0`
      );
      jxFailures++;
    }
  }

  // jx-architectural-flavor-preserved
  if (jxJasonRow) {
    const f = loadFixture("07-jason-real-session.json");
    const sigs = deriveSignals(f.answers);
    const ocean = computeOceanOutput(sigs, f.answers);
    const flavor = ocean?.dispositionSignalMix.opennessFlavor;
    if (flavor === "architectural_led") {
      console.log(
        `  jx-architectural-flavor-preserved: 07-jason flavor=architectural_led: PASS`
      );
    } else {
      console.error(
        `[FAIL] jx-architectural-flavor-preserved: 07-jason flavor=${flavor}; expected architectural_led`
      );
      jxFailures++;
    }
  }

  // jx-cohort-e-spread + jx-cohort-a-spread (informational; the stricter
  // CC-AS cohort-spread assertion already runs above).
  const jxESpread = (() => {
    const vals = jxCohortRows.map((r) => r.ocean.E);
    return Math.max(...vals) - Math.min(...vals);
  })();
  const jxASpread = (() => {
    const vals = jxCohortRows.map((r) => r.ocean.A);
    return Math.max(...vals) - Math.min(...vals);
  })();
  console.log(
    `  jx-cohort-e-spread: ${jxESpread} (informational — Jungian-decoupled E now reflects Big-Five-canonical signal pool only)`
  );
  console.log(
    `  jx-cohort-a-spread: ${jxASpread} (informational — A spread post-CC-JX vs post-CC-AS comparison)`
  );

  if (jxFailures > 0) {
    requiredFailures += jxFailures;
  }

  // ── CC-ES — Extraversion signal-pool cohort assertions ───────────────
  //
  // Mirrors CC-AS pattern. After CC-ES Phase 2 cleanup:
  //   - e-not-universal-saturation: ≤ 4 of 13 goal-soul-give fixtures
  //     with E ≥ 80.
  //   - e-cohort-spread-min-max: max(E) − min(E) ≥ 30 across 20 fixtures.
  //   - e-cohort-spread-band-count: ≥ 3 of 5 bands populated.
  //   - e-jason-shape-preserved: 07-jason E intensity ∈ [40, 65]
  //     (moderate band — situational/role-based register).
  //   - e-jungian-still-zero: cog-function contribution to E = 0
  //     (CC-JX architectural rule preserved).
  console.log("");
  console.log("CC-ES — Extraversion cohort assertions:");
  let esFailures = 0;

  type EsCohortRow = { set: "ocean" | "goal-soul-give"; file: string; e: number };
  const esCohort: EsCohortRow[] = [];
  for (const s of intensitySnapshot) {
    esCohort.push({ set: "ocean", file: s.file, e: s.intensities.E });
  }
  const ES_GSG_DIR = join(__dirname, "..", "fixtures", "goal-soul-give");
  let esGsgFiles: string[] = [];
  try {
    esGsgFiles = readdirSync(ES_GSG_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();
  } catch {
    /* ignore */
  }
  for (const file of esGsgFiles) {
    const path = join(ES_GSG_DIR, file);
    const raw = JSON.parse(readFileSync(path, "utf-8")) as {
      answers: Answer[];
    };
    const sigs = deriveSignals(raw.answers);
    const ocean = computeOceanOutput(sigs, raw.answers);
    if (!ocean) continue;
    esCohort.push({
      set: "goal-soul-give",
      file,
      e: ocean.dispositionSignalMix.intensities.extraversion,
    });
  }

  const esGsgSaturated = esCohort.filter(
    (r) => r.set === "goal-soul-give" && r.e >= 80
  ).length;
  if (esGsgSaturated <= 4) {
    console.log(
      `  e-not-universal-saturation: ${esGsgSaturated}/13 goal-soul-give fixtures with E ≥ 80 (cap: ≤ 4): PASS`
    );
  } else {
    console.error(
      `[FAIL] e-not-universal-saturation: ${esGsgSaturated}/13 goal-soul-give fixtures with E ≥ 80; cap is 4`
    );
    esFailures++;
  }

  const eVals = esCohort.map((r) => r.e);
  const eSpread =
    eVals.length > 0 ? Math.max(...eVals) - Math.min(...eVals) : 0;
  if (eSpread >= 30) {
    console.log(
      `  e-cohort-spread-min-max: spread=${eSpread} (min=${Math.min(...eVals)} max=${Math.max(...eVals)}; floor ≥ 30): PASS`
    );
  } else {
    console.error(
      `[FAIL] e-cohort-spread-min-max: spread=${eSpread}; floor 30`
    );
    esFailures++;
  }

  const eBandCounts: Record<string, number> = {
    "under-detected": 0,
    low: 0,
    moderate: 0,
    "moderate-high": 0,
    high: 0,
  };
  for (const r of esCohort) {
    const b = intensityToBand(r.e);
    eBandCounts[b] = (eBandCounts[b] ?? 0) + 1;
  }
  const eBandsPopulated = Object.values(eBandCounts).filter((c) => c >= 1).length;
  if (eBandsPopulated >= 3) {
    console.log(
      `  e-cohort-spread-band-count: ${eBandsPopulated}/5 bands populated (floor ≥ 3): PASS  ${JSON.stringify(eBandCounts)}`
    );
  } else {
    console.error(
      `[FAIL] e-cohort-spread-band-count: only ${eBandsPopulated}/5 bands populated; floor 3. Counts: ${JSON.stringify(eBandCounts)}`
    );
    esFailures++;
  }

  const esJason = esCohort.find((r) => r.file === "07-jason-real-session.json");
  if (esJason) {
    if (esJason.e >= 40 && esJason.e <= 65) {
      console.log(
        `  e-jason-shape-preserved: 07-jason E=${esJason.e} ∈ [40, 65] (moderate band): PASS`
      );
    } else {
      console.error(
        `[FAIL] e-jason-shape-preserved: 07-jason E=${esJason.e}; expected moderate band [40, 65]`
      );
      esFailures++;
    }
  }

  // e-jungian-still-zero: re-use jxCohortRows (already computed above via
  // computeJungianStack + PARENT_BRIDGE_DOC). The CC-JX assertion
  // jx-no-jungian-to-e already verified this; the CC-ES assertion is
  // a duplicate guard with a CC-ES-specific failure message so a future
  // calibration drift fires both alarms.
  const esJungianE = jxCohortRows.filter((r) => r.cog.E !== 0);
  if (esJungianE.length === 0) {
    console.log(
      `  e-jungian-still-zero: 0/${jxCohortRows.length} fixtures have nonzero Jungian → E (CC-JX rule preserved): PASS`
    );
  } else {
    console.error(
      `[FAIL] e-jungian-still-zero: ${esJungianE.length} fixtures have nonzero Jungian → E; CC-JX rule violated`
    );
    esFailures++;
  }

  if (esFailures > 0) {
    requiredFailures += esFailures;
  }

  // ── Subdimension thinness report (acceptance §AC-15) ──────────────────
  console.log("");
  console.log("Openness subdimension thinness (Q-O1 evidence for question-additions chain):");
  if (subdimensionFlags.length === 0) {
    console.log("  no thin subdimensions across fixtures");
  } else {
    for (const f of subdimensionFlags) {
      console.log(`  ${f.file} — ${f.subdim}: intensity=${f.intensity}`);
    }
  }

  console.log("");
  if (requiredFailures > 0) {
    console.error(`AUDIT FAILED — ${requiredFailures} fixture failure(s).`);
    return 1;
  }
  console.log("AUDIT PASSED — all fixtures green.");
  return 0;
}

process.exit(main());
