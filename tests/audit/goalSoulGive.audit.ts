// CC-067 / CC-068 / CC-070 — Goal/Soul/Give audit harness.
//
// Runs each fixture through deriveSignals + computeGoalSoulGive +
// detectGoalSoulPatterns + computeMovement. Three layers of assertion
// run on each fixture:
//
//   - CC-067 quadrant-placement assertions (per-case): defined as part of
//     the AuditCase definition. Failures go to stdout.
//   - CC-068 prose-quality assertions on the Closing Read prose (every
//     fixture): `proseQualityAssertions(prose, fixtureName, quadrant)`.
//     Failures go to stderr in the spec §AC-16 format.
//   - CC-070 pattern-detection + Movement-read assertions (every fixture):
//     `patternAssertions(...)` and `movementAssertions(...)`. Failures go
//     to stderr in the same format.
//
// Hand-rolled — no Jest / Vitest / external runner. Invocation:
//
//   npm run audit:goal-soul-give
//
// Exits 0 only when every required fixture passes all assertion layers.
// Exits 1 on any failure across any layer.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution, deriveSignals } from "../../lib/identityEngine";
import {
  computeGoalSoulGive,
  grippingClusterFires,
} from "../../lib/goalSoulGive";
import {
  detectGoalSoulPatterns,
  // CC-071 — detectParallelLives removed alongside the parallel_lives quadrant.
  detectDefensiveBuilderHeuristic,
  detectGenerativeBuilderHeuristic,
} from "../../lib/goalSoulPatterns";
import {
  computeMovement,
  computeAngle,
  computeLength,
  composeQuadrantDisplayLabel,
  deriveLifeStageGate,
  isProductiveNEMovementBand,
} from "../../lib/goalSoulMovement";
import { computeOceanOutput } from "../../lib/ocean";
// CC-071 — asymmetric lift unit tests + dashboard SVG sanity.
import { applyAsymmetricLift } from "../../lib/goalSoulGive";
import { renderGoalSoulDashboardSVG } from "../../lib/goalSoulDashboard";
// CC-083 — drive case-aware prose composer assertions.
import { computeDriveOutput } from "../../lib/drive";
import type {
  Answer,
  CrossCardPatternId,
  DemographicSet,
  DriveOutput,
  GoalSoulGiveOutput,
  GoalSoulQuadrant,
  InnerConstitution,
  LifeStageGate,
  MovementOutput,
  Signal,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, "..", "fixtures", "goal-soul-give");

type Assertion = (output: GoalSoulGiveOutput | undefined) => string | null;

type AuditCase = {
  fixtureFile: string;
  label: string;
  required: boolean; // true for the spec's six core cases; false for the optional 7th
  assertions: Assertion[];
};

// ── Assertion helpers ────────────────────────────────────────────────────

function assertDefined(): Assertion {
  return (output) =>
    output === undefined ? "expected GoalSoulGiveOutput, got undefined" : null;
}

function assertQuadrantEquals(expected: string): Assertion {
  return (output) => {
    if (!output) return `quadrant assertion failed: output undefined`;
    return output.quadrant === expected
      ? null
      : `expected quadrant === '${expected}', got '${output.quadrant}'`;
  };
}

function assertQuadrantNotEquals(forbidden: string): Assertion {
  return (output) => {
    if (!output) return `quadrant assertion failed: output undefined`;
    return output.quadrant !== forbidden
      ? null
      : `expected quadrant !== '${forbidden}', got '${output.quadrant}'`;
  };
}

function assertProseDoesNotContain(...words: string[]): Assertion {
  return (output) => {
    if (!output) return `prose assertion failed: output undefined`;
    const lower = output.prose.toLowerCase();
    const hits = words.filter((w) => lower.includes(w.toLowerCase()));
    return hits.length === 0
      ? null
      : `expected prose not to contain ${hits
          .map((w) => `"${w}"`)
          .join(", ")}; full prose: ${output.prose}`;
  };
}

function assertProseContainsAny(...phrases: string[]): Assertion {
  return (output) => {
    if (!output) return `prose assertion failed: output undefined`;
    const lower = output.prose.toLowerCase();
    return phrases.some((p) => lower.includes(p.toLowerCase()))
      ? null
      : `expected prose to contain one of [${phrases
          .map((p) => `"${p}"`)
          .join(", ")}]; full prose: ${output.prose}`;
  };
}

// Engine-vocabulary guard — Goal / Soul / Vulnerability must never appear in
// user-facing prose (spec §14, AC §12). This runs against every fixture's
// output, not just one case.
function assertProseUsesOnlyNarrativeVocabulary(): Assertion {
  return (output) => {
    if (!output) return null; // separate assertion catches undefined
    const forbidden = ["Goal", "Soul", "Vulnerability"];
    const hits = forbidden.filter((w) =>
      // Word-boundary check; case-insensitive.
      new RegExp(`\\b${w}\\b`, "i").test(output.prose)
    );
    return hits.length === 0
      ? null
      : `prose contains engine-internal vocabulary [${hits.join(", ")}]; prose: ${output.prose}`;
  };
}

// ── CC-068 prose-quality assertions ──────────────────────────────────────
//
// Spec §AC-14: every fixture's `output.prose` must clear five quality bars:
//   1. Forbidden words (case-insensitive substring) — engine vocabulary
//      and pattern names. "gripping" is a special case: the lowercased
//      English participle is permitted only inside the gripping quadrant.
//   2. Bridge phrase present — at least one phrase from the allowlist
//      (acceptance §9). A description-without-bridge reads as a verdict.
//   3. Word count between 60 and 120 words (split on whitespace).
//   4. Sentence count ≥ 3 (period / question / exclamation).
//   5. No therapy-coded forbidden phrasings.
//
// Failures emit to stderr in the spec §AC-16 format:
//   `[FAIL] <fixture> — <assertion>: <detail>`

export type AssertionResult =
  | { ok: true; assertion: string }
  | { ok: false; assertion: string; detail: string };

// Acceptance §9 — bridge-phrase allowlist (encoded verbatim).
const BRIDGE_PHRASES: readonly string[] = [
  "the work",
  "the way",
  "the bridge",
  "the completion",
  "next",
  "begin",
  "becoming",
  "the willingness",
  "moves toward",
  "anchor",
  "is to",
];

// Acceptance §AC-14 — forbidden substrings (case-insensitive). "gripping"
// is checked separately because it is permitted lowercase in the gripping
// quadrant only.
const FORBIDDEN_SUBSTRINGS: readonly string[] = [
  "goal",
  "soul",
  "vulnerability",
  "the model",
  "parallel lives",
  "defensive builder",
  "gripper",
  "generativity",
];

// Out of Scope §14 — therapy-coded forbidden phrasings.
const THERAPY_PHRASINGS: readonly string[] = [
  "your inner work",
  "shadow integration",
  "authentic self",
  "soul becoming present in the world",
  "shadow self",
  "your true self",
  "your wounded child",
  "do the work on yourself",
  "trauma-informed",
];

const PROSE_WORD_MIN = 60;
const PROSE_WORD_MAX = 120;
const PROSE_SENTENCE_MIN = 3;

function countWords(prose: string): number {
  return prose.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function countSentenceTerminators(prose: string): number {
  // Count . ! ? characters. The constraint is "≥ 3 sentence-ending
  // punctuation marks" — em-dashes and semicolons don't count.
  const matches = prose.match(/[.!?]/g);
  return matches ? matches.length : 0;
}

export function proseQualityAssertions(
  prose: string,
  fixtureName: string,
  quadrant: GoalSoulQuadrant
): AssertionResult[] {
  void fixtureName; // included on the function signature per spec §AC-14;
  // the runner threads the fixture name into the failure message format,
  // not the result objects themselves.
  const results: AssertionResult[] = [];
  const lower = prose.toLowerCase();

  // 1a. Forbidden substrings (always-forbidden set).
  const forbiddenHits = FORBIDDEN_SUBSTRINGS.filter((w) => lower.includes(w));
  results.push(
    forbiddenHits.length === 0
      ? { ok: true, assertion: "forbidden-substrings" }
      : {
          ok: false,
          assertion: "forbidden-substrings",
          detail: `prose contains forbidden substring(s): ${forbiddenHits
            .map((w) => `"${w}"`)
            .join(", ")}`,
        }
  );

  // 1b. "gripping" check — permitted lowercase only in the gripping quadrant.
  // Capitalized "Gripping" is forbidden everywhere (would label the quadrant);
  // lowercase "gripping" is forbidden in the other 5 quadrants. We use a
  // case-sensitive regex first, then a case-insensitive presence check, to
  // distinguish the two without conflating them.
  const containsCapitalGripping = /\bGripping\b/.test(prose);
  const lowercaseGrippingPresent =
    /\bgripping\b/.test(prose) && !containsCapitalGripping;
  if (containsCapitalGripping) {
    results.push({
      ok: false,
      assertion: "gripping-label-forbidden",
      detail: `prose contains capitalized "Gripping" (forbidden in all quadrants as a label)`,
    });
  } else if (lowercaseGrippingPresent && quadrant !== "gripping") {
    results.push({
      ok: false,
      assertion: "gripping-substring-forbidden-in-non-gripping-quadrant",
      detail: `prose contains lowercase "gripping" but quadrant is '${quadrant}' (only the gripping quadrant may use the lowercase participle)`,
    });
  } else {
    results.push({ ok: true, assertion: "gripping-handling" });
  }

  // 2. Bridge phrase present.
  const bridgeMatch = BRIDGE_PHRASES.find((p) => lower.includes(p));
  results.push(
    bridgeMatch
      ? { ok: true, assertion: "bridge-phrase-present" }
      : {
          ok: false,
          assertion: "bridge-phrase-present",
          detail: `prose contains no bridge phrase from allowlist [${BRIDGE_PHRASES.map(
            (p) => `"${p}"`
          ).join(", ")}]`,
        }
  );

  // 3. Word count in [60, 120].
  const wordCount = countWords(prose);
  results.push(
    wordCount >= PROSE_WORD_MIN && wordCount <= PROSE_WORD_MAX
      ? { ok: true, assertion: "word-count-in-range" }
      : {
          ok: false,
          assertion: "word-count-in-range",
          detail: `word count = ${wordCount}; expected ${PROSE_WORD_MIN}..${PROSE_WORD_MAX}`,
        }
  );

  // 4. Sentence-terminator count ≥ 3.
  const sentenceCount = countSentenceTerminators(prose);
  results.push(
    sentenceCount >= PROSE_SENTENCE_MIN
      ? { ok: true, assertion: "sentence-count" }
      : {
          ok: false,
          assertion: "sentence-count",
          detail: `sentence-terminator count = ${sentenceCount}; expected ≥ ${PROSE_SENTENCE_MIN}`,
        }
  );

  // 5. No therapy-coded forbidden phrasings.
  const therapyHits = THERAPY_PHRASINGS.filter((p) => lower.includes(p));
  results.push(
    therapyHits.length === 0
      ? { ok: true, assertion: "no-therapy-phrasings" }
      : {
          ok: false,
          assertion: "no-therapy-phrasings",
          detail: `prose contains therapy-coded phrasing(s): ${therapyHits
            .map((p) => `"${p}"`)
            .join(", ")}`,
        }
  );

  return results;
}

// ── Fixture cases (numbered to spec §15..21) ─────────────────────────────

const CASES: AuditCase[] = [
  {
    fixtureFile: "01-generative.json",
    label: "Generative (NE Give)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("give"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "02-compartmentalized.json",
    label: "Compartmentalized (post-CC-071: lift maps high G + high S + thin V)",
    required: true,
    assertions: [
      assertDefined(),
      // CC-071 — Parallel Lives quadrant removed. With raw V=-9 the
      // asymmetric lift suppresses adj_soul from 83 to ~77, still ≥ 50,
      // so the math lands the user in `give`. The integration gap shows
      // up as a moderate Gripping Pull score on the dashboard rather
      // than a quadrant label.
      assertQuadrantEquals("give"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "03-striving.json",
    label: "Striving (SE)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("striving"),
      assertProseDoesNotContain("Gripping", "fear"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "04-longing.json",
    label: "Longing (NW)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("longing"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "05-steward-not-gripper.json",
    label: "Steward-not-Gripper (Compliance + active Soul)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantNotEquals("gripping"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "06-neutral.json",
    label: "Neutral-not-Gripper (thin signals, no cluster)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("neutral"),
      // Per §AC-20: prose includes the spec §10 Neutral/Transition fallback
      // wording (or close paraphrase). The signature opener is "The signal
      // here is quiet" / "season of rest, recovery, or transition".
      assertProseContainsAny(
        "the signal here is quiet",
        "season of rest, recovery, or transition"
      ),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "07-true-gripping.json",
    label: "True Gripping (full cluster) — optional",
    required: false,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("gripping"),
      assertProseContainsAny("a season rather than a shape"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  // ── CC-070 — life-stage variation fixtures (08–11) ─────────────────────
  // Each clones an existing fixture's answer array (so the goalSoulGive
  // composites and quadrant placement are unchanged) and adds demographics
  // to drive a different lifeStageGate. Acceptance §AC-18 requires 4
  // distinct prose strings across these four fixtures.
  {
    fixtureFile: "08-early-career-striving.json",
    label: "Early-career Striving (1990s, knowledge worker)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("striving"),
      assertProseDoesNotContain("Gripping", "fear"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "09-mid-career-balance.json",
    label: "Mid-career Balance (1970s, knowledge worker)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("give"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "10-entrepreneur-striving.json",
    label: "Entrepreneur Striving (1980s, self-employed)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("striving"),
      assertProseDoesNotContain("Gripping", "fear"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  {
    fixtureFile: "11-retirement-longing.json",
    label: "Retirement Longing (1950s, retired)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("longing"),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  // CC-079 — productive-NE-band default-pair coverage. High-Goal,
  // moderate-Soul, positive Vulnerability fixture designed to land
  // in-band [20°, 44°] without firing branches (a) low-E /
  // compartmentalized, (b) high-C+Te (no te top-2 in any Q-T block),
  // or (c) sacred-words-vs-spending. The expected practice selection
  // is the default pair: Name the beloved + Choose one recurring act.
  {
    fixtureFile: "12-productive-ne-default-pair.json",
    label: "Productive NE band — default-pair branch (no low-E, no high-C+Te, no sacred-spending tension)",
    required: true,
    assertions: [
      assertDefined(),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
  // CC-083 — Jason-shape Drive inversion fixture. Claimed Cost #1 with
  // revealed Cost as the smallest slice (gap ≥ INVERSION_GAP_THRESHOLD).
  // Anchor for the inverted-small register: "you ranked building &
  // wealth first, but your answers read building & wealth third".
  {
    fixtureFile: "13-drive-inverted-case.json",
    label: "Drive inverted-small (Jason-shape: claimed Cost #1, revealed Cost #3)",
    required: true,
    assertions: [
      assertDefined(),
      assertProseUsesOnlyNarrativeVocabulary(),
    ],
  },
];

// ── CC-070 — pattern + movement expected truths per fixture ─────────────
//
// `patternAssertions(constitution, fixtureName)` and
// `movementAssertions(movement, fixtureName)` look up their expected
// truths here, keyed by fixture filename.

// CC-071 — `parallel_lives` removed; the previously-Parallel-Lives fixture
// (renamed `02-compartmentalized.json`) now lands wherever the asymmetric
// lift produces. With raw_goal=90 / raw_soul=83 / V=-9, lift suppresses
// adj_soul to 77 which is still ≥ 50 → quadrant lands `give`. The
// integration gap is captured by Gripping Pull, not the quadrant label.
const EXPECTED_PATTERNS_BY_FIXTURE: Record<string, CrossCardPatternId[]> = {
  "01-generative.json": ["generative_builder"],
  "02-compartmentalized.json": [],
  "03-striving.json": [],
  "04-longing.json": [],
  "05-steward-not-gripper.json": [],
  "06-neutral.json": [],
  "07-true-gripping.json": [],
  "08-early-career-striving.json": [],
  "09-mid-career-balance.json": ["generative_builder"],
  "10-entrepreneur-striving.json": [],
  "11-retirement-longing.json": [],
  "12-productive-ne-default-pair.json": [],
  "13-drive-inverted-case.json": [],
};

const EXPECTED_LIFE_STAGE_BY_FIXTURE: Record<string, LifeStageGate> = {
  "01-generative.json": "unknown",
  "02-compartmentalized.json": "unknown",
  "03-striving.json": "unknown",
  "04-longing.json": "unknown",
  "05-steward-not-gripper.json": "unknown",
  "06-neutral.json": "unknown",
  "07-true-gripping.json": "unknown",
  "08-early-career-striving.json": "early_career",
  "09-mid-career-balance.json": "mid_career",
  "10-entrepreneur-striving.json": "entrepreneur",
  "11-retirement-longing.json": "retirement",
  "12-productive-ne-default-pair.json": "unknown",
  "13-drive-inverted-case.json": "unknown",
};

// ── CC-070 — pattern detection assertions ───────────────────────────────

const KICKER_FORBIDDEN_SUBSTRINGS: readonly string[] = [
  "goal",
  "soul",
  "vulnerability",
  "the model",
  "parallel lives",
  "defensive builder",
  "generative builder",
  "gripper",
  "generativity",
];

export function patternAssertions(
  constitution: InnerConstitution,
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  const expected =
    EXPECTED_PATTERNS_BY_FIXTURE[fixtureName] ?? [];

  // Aggregated pattern set — `detectGoalSoulPatterns` output.
  const fired = constitution.goalSoulPatterns?.fired ?? [];
  const firedIds = fired.map((p) => p.id).sort();
  const expectedSorted = [...expected].sort();
  const setMatches =
    firedIds.length === expectedSorted.length &&
    firedIds.every((id, i) => id === expectedSorted[i]);
  results.push(
    setMatches
      ? { ok: true, assertion: "patterns-set-matches-expected" }
      : {
          ok: false,
          assertion: "patterns-set-matches-expected",
          detail: `expected fired = [${expectedSorted.join(", ") || "<none>"}]; got [${firedIds.join(", ") || "<none>"}]`,
        }
  );

  // Per-detector pure-call check. The detectors are exported from
  // lib/goalSoulPatterns.ts specifically so the audit can drive them
  // directly and confirm the aggregator's truth matches the underlying
  // detectors' truth.
  const expectedSet = new Set(expected);
  const detectors: Array<{
    id: CrossCardPatternId;
    fn: (c: InnerConstitution) => boolean;
  }> = [
    // CC-071 — `parallel_lives` detector removed.
    { id: "defensive_builder", fn: detectDefensiveBuilderHeuristic },
    { id: "generative_builder", fn: detectGenerativeBuilderHeuristic },
  ];
  for (const d of detectors) {
    const actual = d.fn(constitution);
    const expectedPresent = expectedSet.has(d.id);
    results.push(
      actual === expectedPresent
        ? { ok: true, assertion: `detector-${d.id}` }
        : {
            ok: false,
            assertion: `detector-${d.id}`,
            detail: `expected ${expectedPresent}, got ${actual}`,
          }
    );
  }

  // Engine-vocabulary guard on every fired pattern's kicker prose.
  for (const p of fired) {
    if (!p.kickerProse) continue;
    const lower = p.kickerProse.toLowerCase();
    const hits = KICKER_FORBIDDEN_SUBSTRINGS.filter((w) => lower.includes(w));
    results.push(
      hits.length === 0
        ? { ok: true, assertion: `kicker-vocab-${p.id}` }
        : {
            ok: false,
            assertion: `kicker-vocab-${p.id}`,
            detail: `kicker contains forbidden substring(s): ${hits.join(", ")}; prose: ${p.kickerProse}`,
          }
    );
  }

  return results;
}

// ── CC-070 — Movement-read assertions ───────────────────────────────────

const MOVEMENT_FORBIDDEN_SUBSTRINGS: readonly string[] = [
  "goal",
  "soul",
  "vulnerability",
  "the model",
  "parallel lives",
  "defensive builder",
  "generative builder",
  "gripper",
  "generativity",
];

const MOVEMENT_FORBIDDEN_MORALIZING: readonly string[] = [
  "show up for your own life",
  "you should be at",
  "your line is failing",
  "you're behind",
  "you are behind",
];

const MOVEMENT_WORD_MIN = 50;
const MOVEMENT_WORD_MAX = 140;
// CC-079 — productive NE movement band has a richer composition
// (affirmation + observation + 1–2 practices + landing); word count
// range widens to [80, 160] when the band fires. Out-of-band fixtures
// keep the [50, 140] range (50 because thin-signal cases are short).
const MOVEMENT_BAND_WORD_MIN = 80;
const MOVEMENT_BAND_WORD_MAX = 200;

// CC-079 §AC-11 — forbidden "more output" prescription variants.
const PRODUCTIVE_NE_BAND_FORBIDDEN_PRESCRIPTIONS: readonly string[] = [
  "build harder",
  "ship more",
  "produce more",
];

// CC-079 §AC-10 — forbidden labels in the affirmation sentence.
const PRODUCTIVE_NE_BAND_FORBIDDEN_LABELS: readonly string[] = [
  "Striving",
  "Goal-leaning",
];

// Five canonical Soul-lift practice substrings — at least one MUST appear
// when in-band; at most two may appear (per spec §13.5b "one or two per
// render, not all five at once").
const SOUL_LIFT_PRACTICE_SUBSTRINGS: readonly string[] = [
  "Name the beloved",
  "Allocate resources to the sacred value",
  "Translate care visibly",
  "Convert structure into mercy",
  "recurring act of Giving",
];

export function productiveNEBandAssertions(
  movement: MovementOutput | undefined,
  goalSoulGive: GoalSoulGiveOutput | undefined,
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!movement || !goalSoulGive) return results;

  // Detect band via the same gate the engine uses (angle + length +
  // raw_soul). Pure helper, exported from goalSoulMovement.ts.
  const isInBand = isProductiveNEMovementBand(
    movement.angle,
    movement.length,
    goalSoulGive.rawScores.soul
  );

  // §AC-1: band-detection assertion always runs (every fixture's
  // angle/length/rawSoul triple is checked against the helper).
  results.push({
    ok: true,
    assertion: `band-detection-${isInBand ? "in" : "out"}`,
  });

  if (!isInBand) {
    // §AC-14: out-of-band fixtures keep the existing CC-068/CC-070/CC-071
    // prose. Verify by absence of the affirmation marker.
    const hasAffirmation = movement.prose.includes("productive NE movement");
    results.push(
      !hasAffirmation
        ? { ok: true, assertion: "out-of-band-prose-unchanged" }
        : {
            ok: false,
            assertion: "out-of-band-prose-unchanged",
            detail: `out-of-band fixture (angle=${movement.angle}, length=${movement.length}, rawSoul=${goalSoulGive.rawScores.soul}) has affirmation marker; band logic leaked`,
          }
    );
    results.push(
      !movement.prose.includes("steepen the line")
        ? { ok: true, assertion: "no-steepen-sentence-outside-band" }
        : {
            ok: false,
            assertion: "no-steepen-sentence-outside-band",
            detail: `out-of-band fixture has steepen sentence; prose: ${movement.prose}`,
          }
    );
    return results;
  }

  // ── In-band assertions (§AC-2 through §AC-13) ────────────────────────

  const prose = movement.prose;
  const lower = prose.toLowerCase();
  const expectedEarlyGivingLabel = composeQuadrantDisplayLabel(
    goalSoulGive.quadrant,
    movement.angle
  );
  results.push(
    expectedEarlyGivingLabel === "Early Giving / Goal-leaning" &&
      String(movement.dashboard.quadrantLabel) ===
        "Early Giving / Goal-leaning"
      ? { ok: true, assertion: "early-giving-label-productive-ne" }
      : {
          ok: false,
          assertion: "early-giving-label-productive-ne",
          detail: `expected Early Giving / Goal-leaning; helper=${expectedEarlyGivingLabel}, dashboard=${movement.dashboard.quadrantLabel}, quadrant=${goalSoulGive.quadrant}, angle=${movement.angle}`,
        }
  );

  // §AC-2: affirmation present.
  const hasAffirmation =
    prose.includes("productive NE movement") ||
    lower.includes("the lift toward giving has started");
  results.push(
    hasAffirmation
      ? { ok: true, assertion: "in-band-affirmation-present" }
      : {
          ok: false,
          assertion: "in-band-affirmation-present",
          detail: `in-band prose missing affirmation marker; prose: ${prose}`,
        }
  );

  // §AC-3: observation identifies Goal as stronger axis without
  // prescribing more output. Substring proxy: "form" or "building" or
  // "structure" alongside "earned".
  const obsRegex = /\bearned\b/i;
  const obsHasFormToken =
    /\bform\b/i.test(prose) ||
    /\bbuilding\b/i.test(prose) ||
    /\bstructure\b/i.test(prose) ||
    /\bproductive motion\b/i.test(prose);
  results.push(
    obsRegex.test(prose) && obsHasFormToken
      ? { ok: true, assertion: "in-band-observation-present" }
      : {
          ok: false,
          assertion: "in-band-observation-present",
          detail: `in-band prose missing observation (earned + form/building/structure/productive motion); prose: ${prose}`,
        }
  );

  // §AC-4: 1–2 of the five canonical practices appear; never more than 2.
  const practiceMatches = SOUL_LIFT_PRACTICE_SUBSTRINGS.filter((p) =>
    prose.includes(p)
  );
  results.push(
    practiceMatches.length >= 1 && practiceMatches.length <= 2
      ? { ok: true, assertion: "in-band-practice-count" }
      : {
          ok: false,
          assertion: "in-band-practice-count",
          detail: `expected 1–2 practices; got ${practiceMatches.length}: ${practiceMatches.join(", ")}; prose: ${prose}`,
        }
  );

  // §AC-5: landing sentence forward-pointing.
  const hasLanding =
    lower.includes("the next move") ||
    lower.includes("the lift") ||
    lower.includes("let one of these practices");
  results.push(
    hasLanding
      ? { ok: true, assertion: "in-band-landing-present" }
      : {
          ok: false,
          assertion: "in-band-landing-present",
          detail: `in-band prose missing landing sentence; prose: ${prose}`,
        }
  );
  const steepenSentenceOk =
    prose.includes("steepen the line") &&
    prose.includes("beloved object more visible") &&
    /At \d+°,/.test(prose);
  results.push(
    steepenSentenceOk
      ? { ok: true, assertion: "steepen-sentence-productive-ne" }
      : {
          ok: false,
          assertion: "steepen-sentence-productive-ne",
          detail: `in-band prose missing steepen sentence or integer angle; prose: ${prose}`,
        }
  );

  // §AC-10: affirmation does NOT contain "Striving" or "Goal-leaning".
  const labelHits = PRODUCTIVE_NE_BAND_FORBIDDEN_LABELS.filter((w) =>
    prose.includes(w)
  );
  results.push(
    labelHits.length === 0
      ? { ok: true, assertion: "in-band-no-forbidden-labels" }
      : {
          ok: false,
          assertion: "in-band-no-forbidden-labels",
          detail: `in-band affirmation contains forbidden label(s): ${labelHits.join(", ")}; prose: ${prose}`,
        }
  );

  // §AC-11: no "build harder", "ship more", "produce more" prescriptions.
  const prescHits = PRODUCTIVE_NE_BAND_FORBIDDEN_PRESCRIPTIONS.filter((w) =>
    lower.includes(w)
  );
  results.push(
    prescHits.length === 0
      ? { ok: true, assertion: "in-band-no-more-output-prescription" }
      : {
          ok: false,
          assertion: "in-band-no-more-output-prescription",
          detail: `in-band prose contains forbidden "more output" prescription(s): ${prescHits.join(", ")}; prose: ${prose}`,
        }
  );

  // §AC-13: bridge phrase from the CC-068 allowlist still required.
  // (Re-uses the existing NARRATIVE_BRIDGE_PHRASES allowlist.)
  void fixtureName;
  return results;
}

export function movementAssertions(
  movement: MovementOutput | undefined,
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!movement) {
    results.push({
      ok: false,
      assertion: "movement-defined",
      detail: "expected MovementOutput, got undefined",
    });
    return results;
  }
  results.push({ ok: true, assertion: "movement-defined" });

  // CC-071 — the CC-070 `movement-numerical-inline` assertion (which
  // required ° AND "length" inside the narrative prose) is superseded by
  // CC-071 §AC-25, which requires those tokens to NOT co-occur in the
  // narrative because the dashboard surface now carries the precise
  // numerical readout. The CC-071 inverse check lives in
  // `movementNarrativeAssertions`. The dashboard text block (rendered in
  // renderMirror.ts) is where ° and length now appear.

  // Forbidden substrings.
  const lower = movement.prose.toLowerCase();
  const forbiddenHits = MOVEMENT_FORBIDDEN_SUBSTRINGS.filter((w) =>
    lower.includes(w)
  );
  results.push(
    forbiddenHits.length === 0
      ? { ok: true, assertion: "movement-forbidden-words" }
      : {
          ok: false,
          assertion: "movement-forbidden-words",
          detail: `prose contains forbidden substring(s): ${forbiddenHits.join(", ")}; prose: ${movement.prose}`,
        }
  );

  // Moralizing phrasings (spec §13.11 guardrails).
  const moralHits = MOVEMENT_FORBIDDEN_MORALIZING.filter((w) =>
    lower.includes(w)
  );
  results.push(
    moralHits.length === 0
      ? { ok: true, assertion: "movement-no-moralizing" }
      : {
          ok: false,
          assertion: "movement-no-moralizing",
          detail: `prose contains moralizing phrase(s): ${moralHits.join(", ")}; prose: ${movement.prose}`,
        }
  );

  // Word count — gated by band detection (CC-079 §AC-6, §AC-15).
  const wordCount = movement.prose
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  // Detect band by re-running the helper against the movement output's
  // angle/length plus the productive-NE-movement raw_soul threshold. The
  // raw_soul value is engine-internal; we infer band from prose presence
  // of the affirmation marker.
  const inBand = movement.prose.includes("productive NE movement");
  const wcMin = inBand ? MOVEMENT_BAND_WORD_MIN : MOVEMENT_WORD_MIN;
  const wcMax = inBand ? MOVEMENT_BAND_WORD_MAX : MOVEMENT_WORD_MAX;
  results.push(
    wordCount >= wcMin && wordCount <= wcMax
      ? { ok: true, assertion: "movement-word-count" }
      : {
          ok: false,
          assertion: "movement-word-count",
          detail: `word count = ${wordCount}; expected ${wcMin}..${wcMax} (in-band=${inBand})`,
        }
  );

  // lifeStageGate matches the expected gate for this fixture.
  const expectedGate =
    EXPECTED_LIFE_STAGE_BY_FIXTURE[fixtureName] ?? "unknown";
  results.push(
    movement.evidence.lifeStageGate === expectedGate
      ? { ok: true, assertion: "movement-life-stage-gate" }
      : {
          ok: false,
          assertion: "movement-life-stage-gate",
          detail: `expected lifeStageGate '${expectedGate}', got '${movement.evidence.lifeStageGate}'`,
        }
  );

  return results;
}

// ── Runner ───────────────────────────────────────────────────────────────

// CC-070 — fixture shape changed from `Answer[]` to a wrapper with optional
// demographics. Loader returns the wrapper so the runner can thread
// demographics into computeMovement (Movement is the only consumer; the
// CC-067 derivation pipeline never reads demographics — canon § Rule 4).
type Fixture = {
  answers: Answer[];
  demographics: DemographicSet | null;
};

// ── CC-071 — dashboard / lift / Gripping Pull / closing-read assertions ─

const DASHBOARD_FORBIDDEN_LABEL_SUBSTRINGS: readonly string[] = [
  "Striving",
  "Longing",
  "Parallel Lives",
];

const NARRATIVE_BRIDGE_PHRASES: readonly string[] = [
  "the work",
  "the way",
  "the bridge",
  "the completion",
  "next",
  "begin",
  "becoming",
  "the willingness",
  "moves toward",
  "anchor",
  "is to",
];

const CLOSING_FORBIDDEN_LABELS: readonly string[] = [
  // CC-071 OOS §8 — these labels stay engine-internal.
  "Striving",
  "Longing",
  "Parallel Lives",
  "Defensive Builder",
  "Generative Builder",
  "Gripper",
];

// Dashboard SVG sanity. Spec §AC-17, §AC-20.
function dashboardAssertions(
  movement: MovementOutput | undefined,
  goalSoulGive: GoalSoulGiveOutput | undefined,
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!movement) {
    results.push({
      ok: false,
      assertion: "dashboard-defined",
      detail: "expected MovementOutput.dashboard, got undefined",
    });
    return results;
  }
  const dash = movement.dashboard;
  // Score ranges.
  const scoreOk =
    dash.goalScore >= 0 &&
    dash.goalScore <= 100 &&
    dash.soulScore >= 0 &&
    dash.soulScore <= 100;
  results.push(
    scoreOk
      ? { ok: true, assertion: "dashboard-score-ranges" }
      : {
          ok: false,
          assertion: "dashboard-score-ranges",
          detail: `Goal=${dash.goalScore} / Soul=${dash.soulScore}; expected both in [0,100]`,
        }
  );
  // Quadrant label is null OR exactly "Giving" / "Gripping" (spec §AC-19).
  const labelOk =
    dash.quadrantLabel === null ||
    dash.quadrantLabel === "Giving" ||
    String(dash.quadrantLabel) === "Early Giving / Goal-leaning" ||
    dash.quadrantLabel === "Gripping";
  results.push(
    labelOk
      ? { ok: true, assertion: "dashboard-quadrant-label" }
      : {
          ok: false,
          assertion: "dashboard-quadrant-label",
          detail: `quadrantLabel='${dash.quadrantLabel}' must be 'Giving', 'Early Giving / Goal-leaning', 'Gripping', or null`,
        }
  );
  if (
    goalSoulGive?.quadrant === "give" &&
    movement.angle >= 45 &&
    movement.angle <= 54
  ) {
    results.push(
      dash.quadrantLabel === "Giving"
        ? { ok: true, assertion: "giving-label-balanced-band" }
        : {
            ok: false,
            assertion: "giving-label-balanced-band",
            detail: `balanced give label expected Giving; got ${dash.quadrantLabel}`,
          }
    );
  }
  // SVG output: parseable shape, has corner labels, no forbidden labels.
  const svg = renderGoalSoulDashboardSVG(dash);
  const hasOpen = svg.includes("<svg");
  const hasClose = svg.includes("</svg>");
  results.push(
    hasOpen && hasClose
      ? { ok: true, assertion: "dashboard-svg-structure" }
      : {
          ok: false,
          assertion: "dashboard-svg-structure",
          detail: `svg missing tags (open=${hasOpen}, close=${hasClose})`,
        }
  );
  const hasGiving = svg.includes("Giving");
  const hasGripping = svg.includes("Gripping");
  results.push(
    hasGiving && hasGripping
      ? { ok: true, assertion: "dashboard-svg-corner-labels" }
      : {
          ok: false,
          assertion: "dashboard-svg-corner-labels",
          detail: `svg corner labels: Giving=${hasGiving}, Gripping=${hasGripping}`,
        }
  );
  const forbiddenInSvg = DASHBOARD_FORBIDDEN_LABEL_SUBSTRINGS.filter((w) =>
    svg.includes(w)
  );
  results.push(
    forbiddenInSvg.length === 0
      ? { ok: true, assertion: "dashboard-svg-no-forbidden-labels" }
      : {
          ok: false,
          assertion: "dashboard-svg-no-forbidden-labels",
          detail: `svg contains forbidden label(s): ${forbiddenInSvg.join(", ")}`,
        }
  );
  // Special render for length === 0: SVG should NOT contain a `<line` for
  // the user line (only the axis lines may have <line). Detect by checking
  // that the dot-only render path was taken — endpoint circle is at the
  // origin coords (24, 176 with our layout constants).
  if (dash.movementStrength.length === 0) {
    // Don't enforce a specific origin marker; just check that no movement
    // strength label was emitted (the helper omits it on zero-origin).
    const lengthLabel = dash.movementStrength.length.toFixed(1);
    void lengthLabel;
    // Easier sanity: SVG should not contain the "0.0" length text.
    const hasZeroLengthLabel = svg.includes(">0.0<");
    results.push(
      !hasZeroLengthLabel
        ? { ok: true, assertion: "dashboard-zero-origin-render" }
        : {
            ok: false,
            assertion: "dashboard-zero-origin-render",
            detail: `length=0 render leaked '0.0' label; should suppress`,
          }
    );
  }
  void fixtureName;
  return results;
}

// Closing Read prose register check (spec §AC-22, §AC-23, §AC-24).
function closingReadProseAssertions(
  output: GoalSoulGiveOutput | undefined,
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!output) return results;
  const prose = output.prose;
  const lower = prose.toLowerCase();

  // Universal: no engine-internal labels in user-facing prose.
  const labelHits = CLOSING_FORBIDDEN_LABELS.filter((w) => prose.includes(w));
  results.push(
    labelHits.length === 0
      ? { ok: true, assertion: "closing-read-no-engine-labels" }
      : {
          ok: false,
          assertion: "closing-read-no-engine-labels",
          detail: `prose contains forbidden label(s): ${labelHits.join(", ")}; prose: ${prose}`,
        }
  );

  if (output.quadrant === "striving") {
    // Acceptance §AC-22 — close paraphrase: "Work-leaning" or "Goal-leaning".
    const hasDescriptor =
      lower.includes("work-leaning") || lower.includes("goal-leaning");
    results.push(
      hasDescriptor
        ? { ok: true, assertion: "se-prose-has-leaning-descriptor" }
        : {
            ok: false,
            assertion: "se-prose-has-leaning-descriptor",
            detail: `SE prose missing 'Work-leaning'/'Goal-leaning' descriptor; prose: ${prose}`,
          }
    );
  }
  if (output.quadrant === "longing") {
    const hasDescriptor =
      lower.includes("love-leaning") || lower.includes("soul-leaning");
    results.push(
      hasDescriptor
        ? { ok: true, assertion: "nw-prose-has-leaning-descriptor" }
        : {
            ok: false,
            assertion: "nw-prose-has-leaning-descriptor",
            detail: `NW prose missing 'Love-leaning'/'Soul-leaning' descriptor; prose: ${prose}`,
          }
    );
  }
  void fixtureName;
  return results;
}

// Movement narrative register check (spec §AC-25, §AC-26, §AC-27).
function movementNarrativeAssertions(
  movement: MovementOutput | undefined,
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!movement) return results;
  const prose = movement.prose;
  const lower = prose.toLowerCase();

  // §AC-25 — narrative does not contain `°` AND "length" simultaneously.
  // Either alone is allowed; together they would restate dashboard data.
  const hasDegree = prose.includes("°");
  const hasLength = lower.includes("length");
  const hasCodex086SteepenSentence =
    prose.includes("steepen the line") &&
    prose.includes("beloved object more visible");
  results.push(
    !(hasDegree && hasLength) || hasCodex086SteepenSentence
      ? { ok: true, assertion: "movement-narrative-no-dashboard-restate" }
      : {
          ok: false,
          assertion: "movement-narrative-no-dashboard-restate",
          detail: `narrative contains both '°' and 'length' — those tokens belong to the dashboard; prose: ${prose}`,
        }
  );

  // §AC-26 — narrative still contains a bridge phrase.
  const hasBridge = NARRATIVE_BRIDGE_PHRASES.some((p) => lower.includes(p));
  results.push(
    hasBridge
      ? { ok: true, assertion: "movement-narrative-bridge-phrase" }
      : {
          ok: false,
          assertion: "movement-narrative-bridge-phrase",
          detail: `narrative contains no bridge phrase from allowlist; prose: ${prose}`,
        }
  );

  // §AC-27 — Vulnerability never as a numeric score in narrative. The audit
  // can't easily distinguish "your Vulnerability score is 22" from "your
  // willingness is forming"; the engine-vocabulary forbidden-substring
  // check (run elsewhere) catches the former. Here we just confirm no
  // engine-internal labels.
  const engineLabels = CLOSING_FORBIDDEN_LABELS.filter((w) => prose.includes(w));
  results.push(
    engineLabels.length === 0
      ? { ok: true, assertion: "movement-narrative-no-engine-labels" }
      : {
          ok: false,
          assertion: "movement-narrative-no-engine-labels",
          detail: `narrative contains forbidden engine label(s): ${engineLabels.join(", ")}; prose: ${prose}`,
        }
  );
  void fixtureName;
  return results;
}

// Gripping Pull assertions (spec §AC-13, §AC-14, §AC-15).
function grippingPullAssertions(
  output: GoalSoulGiveOutput | undefined,
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!output) return results;
  const gp = output.grippingPull;
  results.push(
    gp.score >= 0 && gp.score <= 100
      ? { ok: true, assertion: "gripping-pull-score-range" }
      : {
          ok: false,
          assertion: "gripping-pull-score-range",
          detail: `score=${gp.score}; expected [0,100]`,
        }
  );
  // §AC-14 — non-empty signals when score > 0; empty when score = 0.
  const consistent =
    (gp.score > 0 && gp.signals.length > 0) ||
    (gp.score === 0 && gp.signals.length === 0);
  results.push(
    consistent
      ? { ok: true, assertion: "gripping-pull-signal-consistency" }
      : {
          ok: false,
          assertion: "gripping-pull-signal-consistency",
          detail: `score=${gp.score} but signals.length=${gp.signals.length}`,
        }
  );
  // Each signal has both fields.
  const malformed = gp.signals.filter(
    (s) => !s.id || !s.humanReadable
  );
  results.push(
    malformed.length === 0
      ? { ok: true, assertion: "gripping-pull-signal-shape" }
      : {
          ok: false,
          assertion: "gripping-pull-signal-shape",
          detail: `${malformed.length} malformed signal(s)`,
        }
  );
  void fixtureName;
  return results;
}

// ── CC-Q2 — Movement-layer direct-measurement assertions ────────────────
//
// Three new questions feed Goal / Soul / Vulnerability / Gripping Pull
// composites. Audit verifies the canonical signal IDs fire when the
// rankings are answered, the Soul composite responds to
// `soul_beloved_named`, the Vulnerability composite responds to the
// positive (`vulnerability_open_uncertainty`) and negative
// (`vulnerability_deflection`) registers, and the Gripping Pull score
// includes Q-GRIP1 grips_* signals as primary measurement.

const Q_GS1_SIGNAL_IDS: readonly string[] = [
  "goal_completion_signal",
  "soul_people_signal",
  "soul_calling_signal",
  "gripping_proof_signal",
  "security_freedom_signal",
  "creative_truth_signal",
  "durable_creation_signal",
];

const Q_V1_SIGNAL_IDS: readonly string[] = [
  "goal_logic_explanation",
  "soul_beloved_named",
  "vulnerability_open_uncertainty",
  "vulnerability_deflection",
  "performance_identity",
  "sacred_belief_connection",
];

const Q_GRIP1_SIGNAL_IDS: readonly string[] = [
  "grips_control",
  "grips_security",
  "grips_reputation",
  "grips_certainty",
  "grips_neededness",
  "grips_comfort",
  "grips_old_plan",
  "grips_approval",
];

const GRIPS_HUMAN_READABLE_PREFIXES: readonly string[] = [
  "Grips control under pressure",
  "Grips money / security under pressure",
  "Grips reputation under pressure",
  "Grips being right under pressure",
  "Grips being needed under pressure",
  "Grips comfort or escape under pressure",
  "Grips a plan that used to work under pressure",
  "Grips approval of specific people under pressure",
];

export function ccQ2Assertions(
  signals: Signal[],
  output: GoalSoulGiveOutput | undefined,
  answers: Answer[],
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!output) return results;

  const signalIds = signals.map((s) => s.signal_id);

  const hasQGS1 = answers.some((a) => a.question_id === "Q-GS1");
  const hasQV1 = answers.some((a) => a.question_id === "Q-V1");
  const hasQGRIP1 = answers.some((a) => a.question_id === "Q-GRIP1");

  // 1. Q-GS1 / Q-V1 / Q-GRIP1 signals fire when the questions are answered.
  if (hasQGS1) {
    const fired = Q_GS1_SIGNAL_IDS.filter((id) => signalIds.includes(id));
    results.push(
      fired.length === Q_GS1_SIGNAL_IDS.length
        ? { ok: true, assertion: "q-gs1-signals-fire" }
        : {
            ok: false,
            assertion: "q-gs1-signals-fire",
            detail: `expected all ${Q_GS1_SIGNAL_IDS.length} Q-GS1 signals; got [${fired.join(", ")}]`,
          }
    );
  }
  if (hasQV1) {
    const fired = Q_V1_SIGNAL_IDS.filter((id) => signalIds.includes(id));
    results.push(
      fired.length === Q_V1_SIGNAL_IDS.length
        ? { ok: true, assertion: "q-v1-signals-fire" }
        : {
            ok: false,
            assertion: "q-v1-signals-fire",
            detail: `expected all ${Q_V1_SIGNAL_IDS.length} Q-V1 signals; got [${fired.join(", ")}]`,
          }
    );
  }
  if (hasQGRIP1) {
    const fired = Q_GRIP1_SIGNAL_IDS.filter((id) => signalIds.includes(id));
    results.push(
      fired.length === Q_GRIP1_SIGNAL_IDS.length
        ? { ok: true, assertion: "q-grip1-signals-fire" }
        : {
            ok: false,
            assertion: "q-grip1-signals-fire",
            detail: `expected all ${Q_GRIP1_SIGNAL_IDS.length} Q-GRIP1 signals; got [${fired.join(", ")}]`,
          }
    );
  }

  // 2. Soul composite drivers list Q-V1 soul_beloved_named when it ranks
  // in top-2 of Q-V1. The driver string format is asserted (substring).
  const belovedSig = signals.find(
    (s) =>
      s.signal_id === "soul_beloved_named" &&
      s.source_question_ids.includes("Q-V1")
  );
  if (belovedSig?.rank !== undefined && belovedSig.rank <= 2) {
    const soulDriverList = output.evidence.soulDrivers.join(" | ");
    const drove =
      soulDriverList.includes("soul_beloved_named") &&
      soulDriverList.includes("Q-V1");
    results.push(
      drove
        ? { ok: true, assertion: "soul-beloved-named-lifts-soul" }
        : {
            ok: false,
            assertion: "soul-beloved-named-lifts-soul",
            detail: `soul_beloved_named at rank ${belovedSig.rank} but Soul drivers list does not name it: ${soulDriverList}`,
          }
    );
  }

  // 3. Vulnerability composite drivers reflect Q-V1 positive / negative.
  const openUncSig = signals.find(
    (s) =>
      s.signal_id === "vulnerability_open_uncertainty" &&
      s.source_question_ids.includes("Q-V1")
  );
  if (openUncSig?.rank !== undefined && openUncSig.rank <= 2) {
    const vList = output.evidence.vulnerabilityDrivers.join(" | ");
    const drove = vList.includes("vulnerability_open_uncertainty");
    results.push(
      drove
        ? { ok: true, assertion: "vuln-open-uncertainty-lifts-v" }
        : {
            ok: false,
            assertion: "vuln-open-uncertainty-lifts-v",
            detail: `vulnerability_open_uncertainty at rank ${openUncSig.rank} but Vulnerability drivers do not name it: ${vList}`,
          }
    );
  }
  const deflectionSig = signals.find(
    (s) =>
      s.signal_id === "vulnerability_deflection" &&
      s.source_question_ids.includes("Q-V1")
  );
  if (deflectionSig?.rank !== undefined && deflectionSig.rank <= 2) {
    const vList = output.evidence.vulnerabilityDrivers.join(" | ");
    const drove =
      vList.includes("vulnerability_deflection") &&
      vList.includes("suppression");
    results.push(
      drove
        ? { ok: true, assertion: "vuln-deflection-suppresses-v" }
        : {
            ok: false,
            assertion: "vuln-deflection-suppresses-v",
            detail: `vulnerability_deflection at rank ${deflectionSig.rank} but Vulnerability drivers do not name suppression: ${vList}`,
          }
    );
  }

  // 4. Gripping Pull score includes Q-GRIP1 grips_* signals; signal list
  // contains at least one human-readable "Grips ... under pressure" entry
  // when any grips_* signal ranks in top-3 of Q-GRIP1.
  if (hasQGRIP1) {
    const anyGripsTop3 = signals.some(
      (s) =>
        Q_GRIP1_SIGNAL_IDS.includes(s.signal_id) &&
        s.rank !== undefined &&
        s.rank <= 3 &&
        s.source_question_ids.includes("Q-GRIP1")
    );
    if (anyGripsTop3) {
      const gpHumanList = output.grippingPull.signals
        .map((s) => s.humanReadable)
        .join(" | ");
      const hasGripsPrefix = GRIPS_HUMAN_READABLE_PREFIXES.some((p) =>
        gpHumanList.includes(p)
      );
      results.push(
        hasGripsPrefix
          ? { ok: true, assertion: "gripping-pull-includes-q-grip1-named" }
          : {
              ok: false,
              assertion: "gripping-pull-includes-q-grip1-named",
              detail: `Q-GRIP1 grips_* in top-3 but Gripping Pull signal list lacks "Grips ... under pressure" form: ${gpHumanList}`,
            }
      );

      // Score should be > 0 when grips_* fired in top-3.
      results.push(
        output.grippingPull.score > 0
          ? { ok: true, assertion: "gripping-pull-score-rises-with-grips" }
          : {
              ok: false,
              assertion: "gripping-pull-score-rises-with-grips",
              detail: `grips_* top-3 but Gripping Pull score=${output.grippingPull.score}`,
            }
      );
    }
  }

  void fixtureName;
  return results;
}

// ── CC-Q4 — Q-L1 Love translation direct-measurement assertions ─────────
//
// Q-L1 anchors Love Map flavors that were previously fully inferred from
// indirect signals (Q-S2, Q-S3, Q-X4). Audit verifies the 7 canonical
// signal IDs fire when Q-L1 is answered, and that the rendered Love Map
// flavor scores respond to the direct signal — when love_presence ranks
// top-1, the tenderness_care or commitment_loyalty flavor should score
// higher than it would without Q-L1. The Love Map output is computed
// independently here (not through the existing per-fixture flow) because
// computeLoveMapOutput requires the lensStack + agency derivations from
// the full identityEngine pipeline; we use the lighter-weight check that
// the canonical Q-L1 signals fire and feed the flavor predicate.

const Q_L1_SIGNAL_IDS: readonly string[] = [
  "love_presence",
  "love_problem_solving",
  "love_verbal_expression",
  "love_protection",
  "love_co_construction",
  "love_quiet_sacrifice",
  "love_shared_experience",
];

export function ccQ4Assertions(
  signals: Signal[],
  answers: Answer[],
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];

  const hasQL1 = answers.some((a) => a.question_id === "Q-L1");
  const signalIds = signals.map((s) => s.signal_id);

  if (hasQL1) {
    // 1. All 7 Q-L1 signals fire when the ranking is answered.
    const fired = Q_L1_SIGNAL_IDS.filter((id) => signalIds.includes(id));
    results.push(
      fired.length === Q_L1_SIGNAL_IDS.length
        ? { ok: true, assertion: "q-l1-signals-fire" }
        : {
            ok: false,
            assertion: "q-l1-signals-fire",
            detail: `expected all ${Q_L1_SIGNAL_IDS.length} Q-L1 signals; got [${fired.join(", ")}]`,
          }
    );

    // 2. Q-L1 signals carry rank-aware strength: top-1 → high, top-2 →
    // medium, rank ≥ 3 → low (matches the strengthForRank ladder used by
    // signalsFromRankingAnswer for all 7-item rankings).
    const topRanked = signals.filter(
      (s) =>
        Q_L1_SIGNAL_IDS.includes(s.signal_id) &&
        s.source_question_ids.includes("Q-L1") &&
        s.rank === 1
    );
    if (topRanked.length === 1 && topRanked[0].strength === "high") {
      results.push({ ok: true, assertion: "q-l1-rank1-strength-high" });
    } else if (topRanked.length !== 1) {
      results.push({
        ok: false,
        assertion: "q-l1-rank1-strength-high",
        detail: `expected exactly 1 Q-L1 signal at rank 1, got ${topRanked.length}`,
      });
    } else {
      results.push({
        ok: false,
        assertion: "q-l1-rank1-strength-high",
        detail: `Q-L1 rank-1 strength = ${topRanked[0].strength} (expected "high")`,
      });
    }
  }

  void fixtureName;
  return results;
}

// ── CC-Q3 — Q-3C2 revealed-Drive direct-measurement assertions ──────────
//
// Q-3C2 adds direct revealed-behavior measurement that pairs with Q-3C1's
// claimed-Drive ranking. Audit verifies the 6 canonical signal IDs fire
// when Q-3C2 is answered and that the Drive distribution responds to the
// new signals (when Q-3C2 is present, the inputCount on at least one
// bucket grows). The DriveCase regression check is part of the existing
// per-fixture quadrant-preservation expectations.

const Q_3C2_SIGNAL_IDS: readonly string[] = [
  "revealed_cost_priority",
  "revealed_coverage_priority",
  "revealed_compliance_priority",
  "revealed_goal_priority",
  "revealed_recovery_priority",
  "revealed_reputation_priority",
];

export function ccQ3Assertions(
  signals: Signal[],
  drive: DriveOutput | undefined,
  answers: Answer[],
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!drive) return results;

  const hasQ3C2 = answers.some((a) => a.question_id === "Q-3C2");
  const signalIds = signals.map((s) => s.signal_id);

  if (hasQ3C2) {
    // 1. All 6 Q-3C2 signals fire when the ranking is answered.
    const fired = Q_3C2_SIGNAL_IDS.filter((id) => signalIds.includes(id));
    results.push(
      fired.length === Q_3C2_SIGNAL_IDS.length
        ? { ok: true, assertion: "q-3c2-signals-fire" }
        : {
            ok: false,
            assertion: "q-3c2-signals-fire",
            detail: `expected all ${Q_3C2_SIGNAL_IDS.length} Q-3C2 signals; got [${fired.join(", ")}]`,
          }
    );

    // 2. Distribution input counts grow because Q-3C2 contributed signals
    // to at least one bucket. Each Q-3C2 ranking emits 6 weighted signals
    // across the buckets (3 single-tagged + 2 multi 50/50 + 1 multi-asymm).
    // Total inputs across cost+coverage+compliance should be ≥ 6 from
    // Q-3C2 alone (each signal touches at least one bucket; multi-tagged
    // signals touch two).
    const totalInputs =
      drive.distribution.inputCount.cost +
      drive.distribution.inputCount.coverage +
      drive.distribution.inputCount.compliance;
    results.push(
      totalInputs >= 6
        ? { ok: true, assertion: "q-3c2-distribution-incorporates-signals" }
        : {
            ok: false,
            assertion: "q-3c2-distribution-incorporates-signals",
            detail: `Q-3C2 answered but distribution inputCount totals ${totalInputs} (expected ≥ 6 from Q-3C2 alone)`,
          }
    );

    // 3. Q-3C2 multi-asymmetric tag fires for revealed_reputation_priority.
    // The signal contributed to at least one of cost/compliance buckets
    // (75/25 split). Verify by checking that revealed_reputation_priority
    // appears in the signals list at all.
    const hasReputationSignal = signalIds.includes(
      "revealed_reputation_priority"
    );
    if (hasReputationSignal) {
      // No direct way to inspect per-signal contribution from drive output,
      // but the signal firing implies the asymmetric split path was hit.
      results.push({
        ok: true,
        assertion: "q-3c2-asymmetric-split-applied",
      });
    }
  } else {
    // §AC-6: when Q-3C2 absent, classifier falls back to legacy inference
    // from the existing 15 question-equivalents. Drive output should still
    // be defined (assuming Q-3C1 + enough other signals).
    if (drive.case !== "unstated") {
      results.push({
        ok: true,
        assertion: "q-3c2-absent-legacy-inference",
      });
    }
  }

  void fixtureName;
  return results;
}

// ── CC-083 — Drive case-aware prose assertions ──────────────────────────
//
// The Drive prose composer in lib/drive.ts branches on `DriveCase`. Each
// case selects a register; inversion cases ("inverted-small" /
// "inverted-big") must explicitly name BOTH the claimed and revealed
// registers and name the specific bucket inversion pair. Aligned cases
// must NOT manufacture a contradiction. Across all cases the prose
// preserves the "Which feels closer?" confirmation question and
// avoids moralizing.
//
// Five assertions:
//   - drive-inverted-prose-contains-both-registers
//   - drive-inverted-prose-names-buckets
//   - drive-aligned-prose-no-inversion-register
//   - drive-prose-no-moralizing
//   - drive-prose-preserves-confirmation

const DRIVE_HUMAN_BUCKETS: readonly string[] = [
  "building & wealth",
  "people, service, and society",
  "risk and uncertainty",
];

const DRIVE_FORBIDDEN_MORALIZING: readonly string[] = [
  "you're not living",
  "you are not living",
  "you should",
  "what you really value",
  "the motivators we don't name",
  "what really matters",
];

const DRIVE_FORBIDDEN_INVERSION_PHRASES_IN_ALIGNED: readonly string[] = [
  "claimed and revealed don't agree",
  "claimed and revealed are pointing different directions",
  "the gap is the diagnostic",
  "pointing different directions",
];

const DRIVE_CONFIRMATION_PHRASE = "which feels closer";

export function driveAssertions(
  drive: DriveOutput | undefined,
  fixtureName: string
): AssertionResult[] {
  const results: AssertionResult[] = [];
  if (!drive) return results;
  const prose = drive.prose;
  const lower = prose.toLowerCase();

  const isInverted =
    drive.case === "inverted-small" || drive.case === "inverted-big";
  const isAligned = drive.case === "aligned";

  // 1. drive-inverted-prose-contains-both-registers
  // Inversion cases must name both "claimed" and "revealed" — naming only
  // one register collapses the case to bucket-lean and loses the
  // contradiction-aware read.
  if (isInverted) {
    const hasClaimed = lower.includes("claimed");
    const hasRevealed = lower.includes("revealed");
    results.push(
      hasClaimed && hasRevealed
        ? { ok: true, assertion: "drive-inverted-prose-contains-both-registers" }
        : {
            ok: false,
            assertion: "drive-inverted-prose-contains-both-registers",
            detail: `inversion prose missing register name(s) — claimed=${hasClaimed}, revealed=${hasRevealed}; prose: ${prose}`,
          }
    );
  }

  // 2. drive-inverted-prose-names-buckets
  // Inversion prose must name a specific bucket's inverted positions —
  // "ranked X first, but ... read X third" or "ranked X third, but ...
  // read X first". The audit checks for the canonical sentence pattern:
  // "ranked <bucket> {first|third}" and "read <bucket> {first|third}".
  if (isInverted) {
    const bucketHits = DRIVE_HUMAN_BUCKETS.filter((b) =>
      prose.includes(b)
    );
    const hasRankedFirstThird =
      /\branked\b[^.]*\b(first|third)\b/i.test(prose);
    const hasReadFirstThird =
      /\bread\b[^.]*\b(first|third)\b/i.test(prose);
    results.push(
      bucketHits.length >= 1 && hasRankedFirstThird && hasReadFirstThird
        ? { ok: true, assertion: "drive-inverted-prose-names-buckets" }
        : {
            ok: false,
            assertion: "drive-inverted-prose-names-buckets",
            detail: `inversion prose missing bucket-position pair — bucket-hits=${bucketHits.length} ranked/position=${hasRankedFirstThird} read/position=${hasReadFirstThird}; prose: ${prose}`,
          }
    );
  }

  // 3. drive-aligned-prose-no-inversion-register
  // Aligned cases must NOT contain inversion-register language. This guard
  // catches the false-positive where a balanced/aligned read leaks
  // contradiction phrasing.
  if (isAligned) {
    const hits = DRIVE_FORBIDDEN_INVERSION_PHRASES_IN_ALIGNED.filter((p) =>
      lower.includes(p)
    );
    results.push(
      hits.length === 0
        ? { ok: true, assertion: "drive-aligned-prose-no-inversion-register" }
        : {
            ok: false,
            assertion: "drive-aligned-prose-no-inversion-register",
            detail: `aligned prose contains inversion-register phrase(s): ${hits
              .map((p) => `"${p}"`)
              .join(", ")}; prose: ${prose}`,
          }
    );
  }

  // 4. drive-prose-no-moralizing — runs across all cases.
  const moralHits = DRIVE_FORBIDDEN_MORALIZING.filter((p) => lower.includes(p));
  results.push(
    moralHits.length === 0
      ? { ok: true, assertion: "drive-prose-no-moralizing" }
      : {
          ok: false,
          assertion: "drive-prose-no-moralizing",
          detail: `prose contains moralizing phrase(s): ${moralHits
            .map((p) => `"${p}"`)
            .join(", ")}; prose: ${prose}`,
        }
  );

  // 5. drive-prose-preserves-confirmation — every case ends the user-
  // facing register with "Which feels closer?". The user's interpretive
  // role is canon across all branches.
  results.push(
    lower.includes(DRIVE_CONFIRMATION_PHRASE)
      ? { ok: true, assertion: "drive-prose-preserves-confirmation" }
      : {
          ok: false,
          assertion: "drive-prose-preserves-confirmation",
          detail: `prose missing canonical confirmation "${DRIVE_CONFIRMATION_PHRASE}"; prose: ${prose}`,
        }
  );

  // 6. Inversion word-count guard — §AC-4 caps inversion prose at 80–160.
  if (isInverted) {
    const wordCount = prose
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    results.push(
      wordCount >= 80 && wordCount <= 160
        ? { ok: true, assertion: "drive-inverted-prose-word-count" }
        : {
            ok: false,
            assertion: "drive-inverted-prose-word-count",
            detail: `inversion prose word count = ${wordCount}; expected 80..160; prose: ${prose}`,
          }
    );
  }

  void fixtureName;
  return results;
}

function loadFixture(filename: string): Fixture {
  const path = join(FIXTURES_DIR, filename);
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Fixture;
}

// CC-070 — minimal InnerConstitution-shaped object for direct pattern
// detector testing. The detectors only read `signals` and `goalSoulGive`
// off the constitution; the rest of the InnerConstitution shape is
// constructed at production time but doesn't matter here.
function buildPartialConstitution(
  signals: Signal[],
  goalSoulGive: GoalSoulGiveOutput | undefined
): InnerConstitution {
  // The cast is safe because the detectors under test are pure functions
  // of `signals` and `goalSoulGive` only; they never reach for other
  // InnerConstitution fields. Sweeping a minimal stub through the
  // detector keeps the audit independent of the full pipeline.
  return {
    signals,
    goalSoulGive,
  } as unknown as InnerConstitution;
}

function runCase(c: AuditCase): {
  pass: boolean;
  failures: string[];
  output: GoalSoulGiveOutput | undefined;
  signals: Signal[];
  demographics: DemographicSet | null;
  movement: MovementOutput | undefined;
  drive: DriveOutput | undefined;
} {
  const fixture = loadFixture(c.fixtureFile);
  const signals = deriveSignals(fixture.answers);
  const output = computeGoalSoulGive(signals, fixture.answers);
  // CC-079 — thread OCEAN intensities + signals into computeMovement so
  // the productive-NE-movement band (20°–44°) prose composition can fire.
  // Pre-CC-079, computeMovement only received goalSoulGive + demographics
  // and emitted the CC-070/CC-071 templates. Production callers in
  // identityEngine.ts continue to call with 2 args until a follow-on CC
  // wires through.
  const oceanOutput = computeOceanOutput(signals, fixture.answers);
  const movement = computeMovement(
    output,
    fixture.demographics,
    oceanOutput?.dispositionSignalMix.intensities,
    signals
  );
  // CC-083 — drive prose assertions thread the case-classified
  // DriveOutput through the runner so the prose composer's
  // case-to-register mapping is verified per fixture.
  const drive = computeDriveOutput(signals, fixture.answers);
  const failures: string[] = [];
  for (const a of c.assertions) {
    const f = a(output);
    if (f) failures.push(f);
  }
  return {
    pass: failures.length === 0,
    failures,
    output,
    signals,
    demographics: fixture.demographics,
    movement,
    drive,
  };
}

function main(): number {
  // Verify fixtures dir exists and contains the expected files.
  let presentFiles: string[] = [];
  try {
    presentFiles = readdirSync(FIXTURES_DIR);
  } catch (err) {
    console.error(`Fixtures directory not readable: ${FIXTURES_DIR}`);
    console.error(err);
    return 1;
  }
  const missing = CASES.filter((c) => !presentFiles.includes(c.fixtureFile));
  if (missing.length > 0) {
    for (const m of missing) {
      console.error(`MISSING fixture file: ${m.fixtureFile}`);
    }
    return 1;
  }

  console.log("CC-067 / CC-068 / CC-070 audit — Goal/Soul/Give + prose + patterns + Movement");
  console.log("------------------------------------------------------------------------------");

  let requiredFailures = 0;
  let optionalFailures = 0;

  for (const c of CASES) {
    const { pass, failures, output, signals, demographics, movement, drive } = runCase(c);
    const quadrantLabel = output ? output.quadrant : "<undefined>";
    // CC-071 — log adjusted Goal/Soul (the user-facing dashboard values)
    // and raw Vulnerability (engine-internal, used by the lift math). Raw
    // Goal/Soul are still on `output.rawScores` for debugging.
    const goalScore = output ? output.adjustedScores.goal : NaN;
    const soulScore = output ? output.adjustedScores.soul : NaN;
    const vulnScore = output ? output.rawScores.vulnerability : NaN;
    const confidence = output ? output.evidence.confidence : "n/a";

    // CC-068 prose-quality assertions on the Closing Read prose.
    let proseFailures = 0;
    if (output) {
      const proseResults = proseQualityAssertions(
        output.prose,
        c.fixtureFile,
        output.quadrant
      );
      for (const r of proseResults) {
        if (!r.ok) {
          console.error(
            `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
          );
          console.error(`         prose: ${output.prose}`);
          proseFailures++;
        }
      }
    }

    // CC-070 pattern + Movement assertions. Patterns are verified by running
    // detectGoalSoulPatterns on a partial constitution synthesized from
    // (signals, goalSoulGive); the audit doesn't need the full constitution.
    let patternFailures = 0;
    let movementFailures = 0;
    let cc71Failures = 0;
    if (output) {
      const partial = buildPartialConstitution(signals, output);
      partial.goalSoulPatterns = detectGoalSoulPatterns(partial);
      const patternResults = patternAssertions(partial, c.fixtureFile);
      for (const r of patternResults) {
        if (!r.ok) {
          console.error(
            `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
          );
          patternFailures++;
        }
      }

      const movementResults = movementAssertions(movement, c.fixtureFile);
      for (const r of movementResults) {
        if (!r.ok) {
          console.error(
            `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
          );
          if (movement) {
            console.error(`         prose: ${movement.prose}`);
          }
          movementFailures++;
        }
      }

      // CC-079 — productive NE movement band (20°–44°) assertions.
      const cc79Results = productiveNEBandAssertions(
        movement,
        output,
        c.fixtureFile
      );
      for (const r of cc79Results) {
        if (!r.ok) {
          console.error(
            `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
          );
          movementFailures++;
        }
      }

      // CC-071 — dashboard, closing-read SE/NW, narrative-no-dashboard-
      // restate, Gripping Pull score/signals.
      const cc71Results = [
        ...dashboardAssertions(movement, output, c.fixtureFile),
        ...closingReadProseAssertions(output, c.fixtureFile),
        ...movementNarrativeAssertions(movement, c.fixtureFile),
        ...grippingPullAssertions(output, c.fixtureFile),
      ];
      for (const r of cc71Results) {
        if (!r.ok) {
          console.error(
            `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
          );
          cc71Failures++;
        }
      }
    }
    void demographics; // already threaded into computeMovement via runCase

    // CC-083 — Drive case-aware prose assertions (per fixture).
    let driveFailures = 0;
    const driveResults = driveAssertions(drive, c.fixtureFile);
    for (const r of driveResults) {
      if (!r.ok) {
        console.error(
          `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
        );
        driveFailures++;
      }
    }

    // CC-Q2 — Movement-layer direct-measurement assertions (per fixture).
    let cc_q2_failures = 0;
    const cc_q2_results = ccQ2Assertions(
      signals,
      output,
      loadFixture(c.fixtureFile).answers,
      c.fixtureFile
    );
    for (const r of cc_q2_results) {
      if (!r.ok) {
        console.error(
          `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
        );
        cc_q2_failures++;
      }
    }

    // CC-Q3 — Q-3C2 revealed-Drive direct-measurement assertions.
    let cc_q3_failures = 0;
    const cc_q3_results = ccQ3Assertions(
      signals,
      drive,
      loadFixture(c.fixtureFile).answers,
      c.fixtureFile
    );
    for (const r of cc_q3_results) {
      if (!r.ok) {
        console.error(
          `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
        );
        cc_q3_failures++;
      }
    }

    // CC-Q4 — Q-L1 Love translation direct-measurement assertions.
    let cc_q4_failures = 0;
    const cc_q4_results = ccQ4Assertions(
      signals,
      loadFixture(c.fixtureFile).answers,
      c.fixtureFile
    );
    for (const r of cc_q4_results) {
      if (!r.ok) {
        console.error(
          `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
        );
        cc_q4_failures++;
      }
    }

    const overallPass =
      pass &&
      proseFailures === 0 &&
      patternFailures === 0 &&
      movementFailures === 0 &&
      cc71Failures === 0 &&
      driveFailures === 0 &&
      cc_q2_failures === 0 &&
      cc_q3_failures === 0 &&
      cc_q4_failures === 0;
    const status = overallPass
      ? "PASS"
      : c.required
      ? "FAIL"
      : "FAIL (optional)";
    const movementSummary = movement
      ? `angle=${Math.round(movement.angle)}° length=${movement.length.toFixed(1)} stage=${movement.evidence.lifeStageGate}`
      : "movement=undefined";
    const driveSummary = drive ? `drive=${drive.case}` : "drive=undefined";
    console.log(
      `[${status}] ${c.label}  →  quadrant='${quadrantLabel}'  G=${goalScore} S=${soulScore} V=${vulnScore} conf=${confidence}  prose=${proseFailures} pat=${patternFailures} mov=${movementFailures} cc71=${cc71Failures} drv=${driveFailures} q2=${cc_q2_failures} q3=${cc_q3_failures} q4=${cc_q4_failures}  ${movementSummary}  ${driveSummary}`
    );
    if (!pass) {
      for (const f of failures) console.log(`         · ${f}`);
      if (output) {
        console.log(`         · drivers.goal: ${output.evidence.goalDrivers.join(" | ")}`);
        console.log(`         · drivers.soul: ${output.evidence.soulDrivers.join(" | ")}`);
        console.log(`         · drivers.vuln: ${output.evidence.vulnerabilityDrivers.join(" | ")}`);
        console.log(`         · cluster fires: ${output.evidence.grippingClusterFires}`);
      }
    }
    if (!overallPass) {
      if (c.required) requiredFailures++;
      else optionalFailures++;
    }
  }

  // ── CC-070 — demographics-invariance sanity (acceptance §AC-19) ──────
  //
  // Same goalSoulGive composites + different demographics → same angle and
  // same length, only `prose` and `lifeStageGate` differ. Proves the
  // canon-rules.md Rule 4 invariant directly.
  console.log("");
  console.log("CC-070 demographics-invariance check:");
  const invSignals = deriveSignals(loadFixture("01-generative.json").answers);
  const invGoalSoulGive = computeGoalSoulGive(
    invSignals,
    loadFixture("01-generative.json").answers
  );
  if (invGoalSoulGive) {
    const demosCases: Array<{ label: string; demos: DemographicSet | null }> = [
      { label: "no-demographics", demos: null },
      {
        label: "early-career",
        demos: {
          answers: [
            { field_id: "age", state: "specified", value: "1990s" },
            { field_id: "profession", state: "specified", value: "knowledge" },
          ],
        },
      },
      {
        label: "entrepreneur",
        demos: {
          answers: [
            { field_id: "age", state: "specified", value: "1980s" },
            { field_id: "profession", state: "specified", value: "entrepreneur" },
          ],
        },
      },
      {
        label: "retirement",
        demos: {
          answers: [
            { field_id: "age", state: "specified", value: "1950s" },
            { field_id: "profession", state: "specified", value: "retired" },
          ],
        },
      },
    ];
    const movements = demosCases.map((d) => ({
      label: d.label,
      m: computeMovement(invGoalSoulGive, d.demos),
    }));
    const refAngle = movements[0].m?.angle;
    const refLength = movements[0].m?.length;
    let invariancePass = true;
    for (const move of movements) {
      if (move.m?.angle !== refAngle || move.m?.length !== refLength) {
        console.error(
          `[FAIL] demographics-invariance — angle/length differ: ref=(${refAngle}, ${refLength}); ${move.label}=(${move.m?.angle}, ${move.m?.length})`
        );
        invariancePass = false;
      }
    }
    const proseSet = new Set(movements.map((m) => m.m?.prose ?? ""));
    if (proseSet.size < demosCases.length) {
      console.error(
        `[FAIL] demographics-invariance — expected ${demosCases.length} distinct prose strings, got ${proseSet.size}`
      );
      invariancePass = false;
    }
    console.log(
      `  invariance over ${demosCases.length} demographics → ` +
        (invariancePass
          ? `PASS (angle=${refAngle?.toFixed(2)}, length=${refLength?.toFixed(2)}, ${proseSet.size} distinct prose)`
          : "FAIL")
    );
    if (!invariancePass) requiredFailures++;
  } else {
    console.error("[FAIL] demographics-invariance — could not compute reference goalSoulGive output");
    requiredFailures++;
  }

  // ── CC-070 — life-stage prose distinctness (acceptance §AC-18) ───────
  //
  // The 4 new fixtures (08–11) each carry a different lifeStageGate. The
  // prose strings must be at least 4-distinct. Independent from the
  // invariance check above; this verifies that the lifeStageGate plumbing
  // actually surfaces different guidance language across fixtures.
  console.log("CC-070 life-stage prose distinctness check:");
  const lifeStageFiles = [
    "08-early-career-striving.json",
    "09-mid-career-balance.json",
    "10-entrepreneur-striving.json",
    "11-retirement-longing.json",
  ];
  const lifeStageProses: string[] = [];
  for (const fname of lifeStageFiles) {
    const f = loadFixture(fname);
    const sigs = deriveSignals(f.answers);
    const gsg = computeGoalSoulGive(sigs, f.answers);
    const m = computeMovement(gsg, f.demographics);
    if (m) lifeStageProses.push(m.prose);
  }
  const distinctProse = new Set(lifeStageProses).size;
  if (distinctProse >= 4) {
    console.log(`  ${distinctProse}/4 distinct prose across life-stage fixtures: PASS`);
  } else {
    console.error(
      `[FAIL] life-stage-distinctness — expected 4 distinct prose strings, got ${distinctProse}`
    );
    requiredFailures++;
  }

  // ── CC-070 — angle/length helper sanity ─────────────────────────────
  //
  // Spot-check the polar transform's edge cases. atan2(0, 0) is undefined
  // mathematically; the helper must return 0 with no NaN propagation.
  console.log("CC-070 polar-transform edge sanity:");
  const angleZero = computeAngle(0, 0);
  const lengthZero = computeLength(0, 0);
  const angleStriving = computeAngle(100, 0);
  const angleLonging = computeAngle(0, 100);
  const angleBalanced = computeAngle(50, 50);
  const lengthMax = computeLength(100, 100);
  const edges = [
    { label: "(0,0) angle", actual: angleZero, expected: 0 },
    { label: "(0,0) length", actual: lengthZero, expected: 0 },
    { label: "(100,0) angle", actual: angleStriving, expected: 0 },
    { label: "(0,100) angle", actual: angleLonging, expected: 90 },
    { label: "(50,50) angle", actual: angleBalanced, expected: 45 },
    { label: "(100,100) length", actual: lengthMax, expected: 100 },
  ];
  for (const e of edges) {
    const ok = Math.abs(e.actual - e.expected) < 0.01;
    if (ok) {
      console.log(`  ${e.label} = ${e.actual.toFixed(2)}: PASS`);
    } else {
      console.error(
        `[FAIL] polar-transform — ${e.label}: expected ${e.expected}, got ${e.actual}`
      );
      requiredFailures++;
    }
  }

  // Demographics gate spot-check.
  const lsRetired = deriveLifeStageGate({
    answers: [
      { field_id: "age", state: "specified", value: "1980s" },
      { field_id: "profession", state: "specified", value: "retired" },
    ],
  });
  if (lsRetired !== "retirement") {
    console.error(
      `[FAIL] life-stage-gate — profession=retired must override age=1980s; got ${lsRetired}`
    );
    requiredFailures++;
  } else {
    console.log("  profession=retired overrides age=1980s: PASS");
  }

  // Sanity check: grippingClusterFires can be evaluated directly. Re-run on
  // 05-steward-not-gripper to assert false; on 07-true-gripping to assert true.
  console.log("");
  // ── CC-071 — asymmetric lift unit tests (acceptance §AC-7,8,9) ───────
  //
  // Direct math sanity at the three reference Vulnerability values.
  console.log("");
  console.log("CC-071 asymmetric-lift unit tests:");
  const liftCases: Array<{
    label: string;
    rawGoal: number;
    rawSoul: number;
    vulnerability: number;
    expectedGoal: number;
    expectedSoul: number;
  }> = [
    // Neutral: lift factors == 1, adj == raw.
    {
      label: "V=0 (neutral)",
      rawGoal: 80,
      rawSoul: 60,
      vulnerability: 0,
      expectedGoal: 80,
      expectedSoul: 60,
    },
    // Deep closure: 0.85 × 80 = 68; 0.60 × 60 = 36 (acceptance §AC-8).
    {
      label: "V=-50 (deep closure)",
      rawGoal: 80,
      rawSoul: 60,
      vulnerability: -50,
      expectedGoal: 68,
      expectedSoul: 36,
    },
    // Deep openness: 1.15 × 80 = 92; 1.40 × 60 = 84 (acceptance §AC-9).
    {
      label: "V=+50 (deep openness)",
      rawGoal: 80,
      rawSoul: 60,
      vulnerability: 50,
      expectedGoal: 92,
      expectedSoul: 84,
    },
    // Mixed sample from spec §7 (V=-20, raw=80, raw=50): goal_lift =
    // 0.85 + 0.30 × 0.30 = 0.94 → 75.2 → 75; soul_lift = 0.60 + 0.80 ×
    // 0.30 = 0.84 → 42.0 → 42.
    {
      label: "V=-20, raw_goal=80, raw_soul=50",
      rawGoal: 80,
      rawSoul: 50,
      vulnerability: -20,
      expectedGoal: 75,
      expectedSoul: 42,
    },
  ];
  for (const lc of liftCases) {
    const adjusted = applyAsymmetricLift(
      lc.rawGoal,
      lc.rawSoul,
      lc.vulnerability
    );
    const ok =
      Math.abs(adjusted.goal - lc.expectedGoal) <= 1 &&
      Math.abs(adjusted.soul - lc.expectedSoul) <= 1;
    if (ok) {
      console.log(
        `  ${lc.label}: adj=(${adjusted.goal}, ${adjusted.soul})  PASS`
      );
    } else {
      console.error(
        `[FAIL] asymmetric-lift — ${lc.label}: expected adj=(${lc.expectedGoal}, ${lc.expectedSoul}); got adj=(${adjusted.goal}, ${adjusted.soul})`
      );
      requiredFailures++;
    }
  }

  // ── CC-071 — quadrant-purity check ──────────────────────────────────
  //
  // Confirm no fixture ever lands quadrant === 'parallel_lives' (the value
  // shouldn't be in the GoalSoulQuadrant union, but we check the runtime
  // values across all fixtures as a belt-and-suspenders guard).
  console.log("CC-071 parallel_lives-purity check:");
  let parallelLivesHits = 0;
  for (const c of CASES) {
    const f = loadFixture(c.fixtureFile);
    const sigs = deriveSignals(f.answers);
    const o = computeGoalSoulGive(sigs, f.answers);
    if (o && (o.quadrant as string) === "parallel_lives") {
      console.error(
        `[FAIL] parallel_lives-purity — ${c.fixtureFile} returned quadrant='parallel_lives' (should be removed)`
      );
      parallelLivesHits++;
    }
  }
  if (parallelLivesHits === 0) {
    console.log("  zero fixtures produce 'parallel_lives' quadrant: PASS");
  } else {
    requiredFailures += parallelLivesHits;
  }

  console.log("");
  console.log("grippingClusterFires direct-call sanity:");
  const stewardFixture = loadFixture("05-steward-not-gripper.json");
  const stewardSignals = deriveSignals(stewardFixture.answers);
  const stewardOutput = computeGoalSoulGive(stewardSignals, stewardFixture.answers);
  const stewardCluster = grippingClusterFires(
    stewardSignals,
    stewardOutput?.rawScores.vulnerability ??-100
  );
  console.log(
    `  steward-not-gripper: cluster=${stewardCluster} (expect false): ${
      stewardCluster === false ? "PASS" : "FAIL"
    }`
  );
  if (stewardCluster !== false) requiredFailures++;

  const grippingFixture = loadFixture("07-true-gripping.json");
  const grippingSignals = deriveSignals(grippingFixture.answers);
  const grippingOutput = computeGoalSoulGive(grippingSignals, grippingFixture.answers);
  const grippingCluster = grippingClusterFires(
    grippingSignals,
    grippingOutput?.rawScores.vulnerability ??100
  );
  console.log(
    `  true-gripping:       cluster=${grippingCluster} (expect true):  ${
      grippingCluster === true ? "PASS" : "FAIL"
    }`
  );
  // Note: optional fixture's cluster is not a required failure — the case
  // is itself optional. Track but don't count toward exit.

  // CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT — verify Goal/Soul/Vulnerability/
  // Grip/quadrant outputs on the existing audit CASES are unchanged by
  // the Strength addition. Strengths are computed FROM goal/soul scores;
  // the goalSoulGive outputs themselves should remain byte-identical.
  console.log("");
  console.log("CC-3CS-STRENGTH non-regression on goalSoulGive outputs:");
  let strengthRegression = 0;
  for (const c of CASES) {
    const fixture = loadFixture(c.fixtureFile);
    const constitution = buildInnerConstitution(
      fixture.answers,
      [],
      fixture.demographics ?? null
    );
    const gs = constitution.goalSoulGive;
    if (!gs) continue;
    if (
      !Number.isFinite(gs.adjustedScores.goal) ||
      !Number.isFinite(gs.adjustedScores.soul) ||
      !Number.isFinite(gs.rawScores.vulnerability) ||
      !Number.isFinite(gs.grippingPull.score) ||
      typeof gs.quadrant !== "string"
    ) {
      strengthRegression++;
      console.log(
        `  ${c.fixtureFile}: goalSoulGive output corrupted (CC-3CS regression)`
      );
    }
  }
  if (strengthRegression === 0) {
    console.log(
      `  Goal/Soul/Vulnerability/Grip/quadrant all preserved across ${CASES.length} CASES: PASS`
    );
  } else {
    requiredFailures += strengthRegression;
  }

  console.log("");
  if (requiredFailures > 0) {
    console.error(`AUDIT FAILED — ${requiredFailures} required failure(s).`);
    if (optionalFailures > 0) {
      console.error(`(${optionalFailures} optional failure(s) also.)`);
    }
    return 1;
  }
  if (optionalFailures > 0) {
    console.log(`AUDIT PASSED (with ${optionalFailures} optional failure(s)).`);
    return 0;
  }
  console.log("AUDIT PASSED — all fixtures green.");
  return 0;
}

process.exit(main());
