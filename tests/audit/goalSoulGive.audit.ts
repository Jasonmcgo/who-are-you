// CC-067 / CC-068 — Goal/Soul/Give audit harness.
//
// Runs the six (and optional seventh) fixture sessions through deriveSignals
// + computeGoalSoulGive. Two layers of assertion run on each fixture:
//
//   - CC-067 quadrant-placement assertions (per-case): defined as part of
//     the AuditCase definition. Failures go to stdout.
//   - CC-068 prose-quality assertions (every fixture): defined in
//     `proseQualityAssertions(prose, fixtureName, quadrant)`. Failures go
//     to stderr in the spec §AC-16 format
//     `[FAIL] <fixture> — <assertion>: <detail>`.
//
// Hand-rolled — no Jest / Vitest / external runner. Invocation:
//
//   npm run audit:goal-soul-give
//
// Exits 0 only when every required fixture passes both assertion layers.
// Exits 1 on any failure across either layer.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { deriveSignals } from "../../lib/identityEngine";
import {
  computeGoalSoulGive,
  grippingClusterFires,
} from "../../lib/goalSoulGive";
import type {
  Answer,
  GoalSoulGiveOutput,
  GoalSoulQuadrant,
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
    fixtureFile: "02-parallel-lives.json",
    label: "Parallel Lives (high G + high S, low V)",
    required: true,
    assertions: [
      assertDefined(),
      assertQuadrantEquals("parallel_lives"),
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
];

// ── Runner ───────────────────────────────────────────────────────────────

function loadFixture(filename: string): Answer[] {
  const path = join(FIXTURES_DIR, filename);
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Answer[];
}

function runCase(c: AuditCase): {
  pass: boolean;
  failures: string[];
  output: GoalSoulGiveOutput | undefined;
} {
  const answers = loadFixture(c.fixtureFile);
  const signals = deriveSignals(answers);
  const output = computeGoalSoulGive(signals, answers);
  const failures: string[] = [];
  for (const a of c.assertions) {
    const f = a(output);
    if (f) failures.push(f);
  }
  return { pass: failures.length === 0, failures, output };
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

  console.log("CC-067 / CC-068 audit — Goal/Soul/Give derivation + prose polish");
  console.log("-----------------------------------------------------------------");

  let requiredFailures = 0;
  let optionalFailures = 0;

  for (const c of CASES) {
    const { pass, failures, output } = runCase(c);
    const quadrantLabel = output ? output.quadrant : "<undefined>";
    const goalScore = output ? output.scores.goal : NaN;
    const soulScore = output ? output.scores.soul : NaN;
    const vulnScore = output ? output.scores.vulnerability : NaN;
    const confidence = output ? output.evidence.confidence : "n/a";

    // CC-068 prose-quality assertions run against the same output. They only
    // run when the output is defined; an undefined output is already a fixture
    // failure caught by the existing assertions.
    let proseFailures = 0;
    if (output) {
      const proseResults = proseQualityAssertions(
        output.prose,
        c.fixtureFile,
        output.quadrant
      );
      for (const r of proseResults) {
        if (!r.ok) {
          // Spec §AC-16 stderr format.
          console.error(
            `[FAIL] ${c.fixtureFile} — ${r.assertion}: ${r.detail}`
          );
          console.error(`         prose: ${output.prose}`);
          proseFailures++;
        }
      }
    }

    const overallPass = pass && proseFailures === 0;
    const status = overallPass
      ? "PASS"
      : c.required
      ? "FAIL"
      : "FAIL (optional)";
    console.log(
      `[${status}] ${c.label}  →  quadrant='${quadrantLabel}'  G=${goalScore} S=${soulScore} V=${vulnScore} conf=${confidence}  prose-failures=${proseFailures}`
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

  // Sanity check: grippingClusterFires can be evaluated directly. Re-run on
  // 05-steward-not-gripper to assert false; on 07-true-gripping to assert true.
  console.log("");
  console.log("grippingClusterFires direct-call sanity:");
  const stewardAnswers = loadFixture("05-steward-not-gripper.json");
  const stewardSignals = deriveSignals(stewardAnswers);
  const stewardOutput = computeGoalSoulGive(stewardSignals, stewardAnswers);
  const stewardCluster = grippingClusterFires(
    stewardSignals,
    stewardOutput?.scores.vulnerability ?? -100
  );
  console.log(
    `  steward-not-gripper: cluster=${stewardCluster} (expect false): ${
      stewardCluster === false ? "PASS" : "FAIL"
    }`
  );
  if (stewardCluster !== false) requiredFailures++;

  const grippingAnswers = loadFixture("07-true-gripping.json");
  const grippingSignals = deriveSignals(grippingAnswers);
  const grippingOutput = computeGoalSoulGive(grippingSignals, grippingAnswers);
  const grippingCluster = grippingClusterFires(
    grippingSignals,
    grippingOutput?.scores.vulnerability ?? 100
  );
  console.log(
    `  true-gripping:       cluster=${grippingCluster} (expect true):  ${
      grippingCluster === true ? "PASS" : "FAIL"
    }`
  );
  // Note: optional fixture's cluster is not a required failure — the case
  // is itself optional. Track but don't count toward exit.

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
