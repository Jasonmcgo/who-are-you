// CC-126 — Audit for the follow-up collection backend (no DB).
//
// Validates the pure-function pieces of CC-126:
//   - `missingQuestionIds` returns unanswered bank questions in order
//   - `resolveFollowUps` falls through to the generator on miss, returns
//     the hand-authored set on hit
//   - `mintFollowUpLink`'s helper `generateUnguessableToken` produces
//     unguessable distinct tokens of the expected shape
//   - The follow-up payload → Answer merge produces signals that flow
//     through `deriveSignals` (the inline-signal path) and the
//     constitution changes after re-derive — proving the merged answer
//     reaches the engine
//
// DB-touching paths (the GET/POST route handlers) are not exercised
// here; they require a live DATABASE_URL + a Postgres instance. The
// route handlers are thin wrappers over the pure helpers tested here.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { missingQuestionIds } from "../../lib/missingQuestions";
import { resolveFollowUps } from "../../lib/followUpResolver";
import { generateUnguessableToken } from "../../lib/followUpLink";
import { buildInnerConstitution, deriveSignals } from "../../lib/identityEngine";
import { questions } from "../../data/questions";
import type {
  Answer,
  RankingDerivedAnswer,
  SinglePickAnswer,
} from "../../lib/types";

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

const ROOT = join(__dirname, "..", "fixtures");

function loadFixture(rel: string) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as {
    answers: Answer[];
  };
}

// ─────────────────────────────────────────────────────────────────────
// Assertion runners
// ─────────────────────────────────────────────────────────────────────

function checkMissingQuestionIds(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // Fixture with the full survey answered: nothing missing.
  const jason = loadFixture("ocean/07-jason-real-session.json");
  const missing = missingQuestionIds(jason.answers);
  // Allow some legitimate gaps (e.g. some sessions skipped optional
  // questions); the strong claim is that the IDs returned are NOT in
  // the answers, and the IDs in the answers are NOT in the returned set.
  const answeredSet = new Set(jason.answers.map((a) => a.question_id));
  const overlap = missing.filter((id) => answeredSet.has(id));
  results.push(
    overlap.length === 0
      ? { ok: true, assertion: "missing-disjoint-from-answers" }
      : {
          ok: false,
          assertion: "missing-disjoint-from-answers",
          detail: `missing set overlapped answered ids: ${overlap.slice(0, 3).join(", ")}`,
        }
  );

  // Empty answer list → every question in the bank is "missing" EXCEPT
  // derived questions whose parents are also unanswered.
  const allMissingForEmpty = missingQuestionIds([]);
  const nonDerived = questions.filter(
    (q) => q.type !== "ranking_derived" && q.type !== "multiselect_derived"
  );
  // Every non-derived question should be in the missing set for an
  // empty answer list.
  const missingMissingIds = nonDerived
    .map((q) => q.question_id)
    .filter((id) => !allMissingForEmpty.includes(id));
  results.push(
    missingMissingIds.length === 0
      ? { ok: true, assertion: "empty-answers-yields-all-non-derived" }
      : {
          ok: false,
          assertion: "empty-answers-yields-all-non-derived",
          detail: `${missingMissingIds.length} non-derived questions absent from result: ${missingMissingIds.slice(0, 3).join(", ")}`,
        }
  );

  // Derived question presence requires its parents. With empty answers,
  // derived questions should NOT be in the missing set.
  const derivedInMissing = questions
    .filter(
      (q) => q.type === "ranking_derived" || q.type === "multiselect_derived"
    )
    .filter((q) => allMissingForEmpty.includes(q.question_id));
  results.push(
    derivedInMissing.length === 0
      ? { ok: true, assertion: "derived-omitted-when-parents-missing" }
      : {
          ok: false,
          assertion: "derived-omitted-when-parents-missing",
          detail: `${derivedInMissing.length} derived qs appeared with empty parents: ${derivedInMissing.map((q) => q.question_id).join(", ")}`,
        }
  );

  return results;
}

function checkResolverFallback(): AssertionResult[] {
  const results: AssertionResult[] = [];

  const fx = loadFixture("ocean/07-jason-real-session.json");
  const c = buildInnerConstitution(fx.answers, [], null);

  // Unknown key → generator path.
  const generated = resolveFollowUps("__no_such_session__", c, fx.answers, "Test");
  const matchesGeneratorShape =
    generated.questions.length === 3 &&
    generated.questions[0].purpose === "grip_object" &&
    generated.questions[2].purpose === "aim_replacement";
  results.push(
    matchesGeneratorShape
      ? { ok: true, assertion: "resolver-falls-through-to-generator" }
      : {
          ok: false,
          assertion: "resolver-falls-through-to-generator",
          detail: `expected 3-question generator set; got ${generated.questions.length} (purposes=${generated.questions.map((q) => q.purpose).join(",")})`,
        }
  );

  // Hand-authored key "michele" → override path (Michele's set is the
  // 1 worked example shipped in CC-126).
  const overridden = resolveFollowUps("michele", c, fx.answers, "Michele");
  const isHandAuthored =
    overridden.personName === "Michele" &&
    overridden.reasonForQuestions.startsWith("Hand-authored set for Michele");
  results.push(
    isHandAuthored
      ? { ok: true, assertion: "resolver-uses-cohort-override" }
      : {
          ok: false,
          assertion: "resolver-uses-cohort-override",
          detail: `expected Michele hand-authored set; got personName="${overridden.personName}", reason="${overridden.reasonForQuestions.slice(0, 60)}…"`,
        }
  );

  // Case-insensitive matching.
  const caseTest = resolveFollowUps("MICHELE", c, fx.answers, "Michele");
  results.push(
    caseTest.reasonForQuestions === overridden.reasonForQuestions
      ? { ok: true, assertion: "resolver-key-case-insensitive" }
      : {
          ok: false,
          assertion: "resolver-key-case-insensitive",
          detail: "MICHELE did not resolve to the same override as michele",
        }
  );

  return results;
}

function checkTokenShape(): AssertionResult[] {
  const results: AssertionResult[] = [];
  const tokens = new Set<string>();
  let allWellShaped = true;
  let badShape: string | null = null;
  for (let i = 0; i < 1000; i++) {
    const t = generateUnguessableToken();
    if (!/^[A-Za-z0-9_-]{32}$/.test(t)) {
      allWellShaped = false;
      badShape = t;
      break;
    }
    tokens.add(t);
  }
  results.push(
    allWellShaped
      ? { ok: true, assertion: "token-shape-base64url-32-chars" }
      : {
          ok: false,
          assertion: "token-shape-base64url-32-chars",
          detail: `bad token shape: "${badShape}"`,
        }
  );
  results.push(
    tokens.size === 1000
      ? { ok: true, assertion: "token-unguessable-no-collision" }
      : {
          ok: false,
          assertion: "token-unguessable-no-collision",
          detail: `collision: ${1000 - tokens.size} of 1000 tokens duplicated`,
        }
  );
  return results;
}

function checkFollowUpSignalsReachEngine(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // Take Jason. Synthesize a follow-up answer with `picked_signal:
  // "follow_up_test_signal_xyz"` (a unique, never-otherwise-emitted
  // signal). Merge it into the answer list. Re-derive. Confirm the
  // signal landed in the resulting constitution's `signals[]` — proof
  // the inline-signal Answer path reaches the engine.
  const fx = loadFixture("ocean/07-jason-real-session.json");

  const followUpSinglePick: SinglePickAnswer = {
    question_id: "fq_test_signal_flow",
    card_id: "pressure",
    question_text: "Synthetic follow-up — does the inline signal land?",
    type: "single_pick",
    picked_id: "test_option",
    picked_signal: "follow_up_test_signal_xyz",
  };
  const merged: Answer[] = [...fx.answers, followUpSinglePick];

  const baseConstitution = buildInnerConstitution(fx.answers, [], null);
  const reDerived = buildInnerConstitution(merged, [], null);

  // Sanity: the constitutions must differ (the test signal injects a
  // new signal entry, which downstream derivations may or may not
  // reflect — but signals[] definitely changes).
  const baseHasTest = baseConstitution.signals.some(
    (s) => s.signal_id === "follow_up_test_signal_xyz"
  );
  const reDerivedHasTest = reDerived.signals.some(
    (s) => s.signal_id === "follow_up_test_signal_xyz"
  );
  results.push(
    !baseHasTest && reDerivedHasTest
      ? {
          ok: true,
          assertion: "follow-up-single-pick-signal-flows-to-engine",
        }
      : {
          ok: false,
          assertion: "follow-up-single-pick-signal-flows-to-engine",
          detail: `base had test signal: ${baseHasTest}; re-derived had test signal: ${reDerivedHasTest}`,
        }
  );

  // Also verify the RankingDerivedAnswer path.
  const followUpRanked: RankingDerivedAnswer = {
    question_id: "fq_test_ranked_flow",
    card_id: "agency",
    question_text: "Synthetic ranked follow-up.",
    type: "ranking_derived",
    order: ["a", "b"],
    derived_item_sources: [
      {
        id: "a",
        signal: "follow_up_test_ranked_a",
        source_question_id: "fq_test_ranked_flow",
      },
      {
        id: "b",
        signal: "follow_up_test_ranked_b",
        source_question_id: "fq_test_ranked_flow",
      },
    ],
  };
  const signalsFromRanked = deriveSignals([followUpRanked]);
  const rankedSignalIds = signalsFromRanked.map((s) => s.signal_id);
  const hasA = rankedSignalIds.includes("follow_up_test_ranked_a");
  const hasB = rankedSignalIds.includes("follow_up_test_ranked_b");
  results.push(
    hasA && hasB
      ? { ok: true, assertion: "follow-up-ranking-derived-signals-flow" }
      : {
          ok: false,
          assertion: "follow-up-ranking-derived-signals-flow",
          detail: `ranked signals reaching engine: a=${hasA} b=${hasB}; got ${rankedSignalIds.join(",")}`,
        }
  );

  // Idempotency: re-deriving with the same merged answers twice yields
  // the same signals[] (no double-append, no nondeterminism in the
  // engine's signal extraction).
  const reDerivedAgain = buildInnerConstitution(merged, [], null);
  const sigCountA = reDerived.signals.filter(
    (s) => s.signal_id === "follow_up_test_signal_xyz"
  ).length;
  const sigCountB = reDerivedAgain.signals.filter(
    (s) => s.signal_id === "follow_up_test_signal_xyz"
  ).length;
  results.push(
    sigCountA === 1 && sigCountB === 1
      ? { ok: true, assertion: "follow-up-merge-deterministic" }
      : {
          ok: false,
          assertion: "follow-up-merge-deterministic",
          detail: `expected exactly 1 emission per derive; got ${sigCountA} / ${sigCountB}`,
        }
  );

  return results;
}

// ─────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];
  results.push(...checkMissingQuestionIds());
  results.push(...checkResolverFallback());
  results.push(...checkTokenShape());
  results.push(...checkFollowUpSignalsReachEngine());
  return results;
}

console.log("CC-126 FOLLOW-UP-BACKEND audit");
console.log("================================");

const results = runAudit();
let pass = 0;
let fail = 0;
for (const r of results) {
  if (r.ok) {
    pass++;
  } else {
    fail++;
    console.log(`[FAIL] ${r.assertion} — ${r.detail}`);
  }
}
console.log(`\n${pass}/${pass + fail} assertions passing.`);
if (fail > 0) {
  console.log("AUDIT FAILED.");
  process.exit(1);
} else {
  console.log("AUDIT PASSED — all CC-126 follow-up-backend assertions green.");
}
