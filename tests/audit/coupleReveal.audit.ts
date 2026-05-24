// CC-COUPLE-2 — Audit for the reveal-type resolver.
//
// Hand-rolled. Asserts:
//   (a) all five RevealType values are reachable from a crafted input;
//   (b) the precedence boundary holds — an input that satisfies both
//       Mirror Blind and Loving Misread resolves to Mirror Blind;
//   (c) the precedence boundary holds — an input that satisfies both
//       Hidden Pattern and Loving Misread resolves to Hidden Pattern;
//   (d) when enginePredicted === null, the result is only ever Obvious /
//       Loving Misread / Oblivious — never Mirror Blind / Hidden Pattern;
//   (e) when selfKnows !== false (true or undefined), a partner-guess
//       that matches enginePredicted does NOT trigger Mirror Blind.
//
// Invocation:
//   `npx tsx tests/audit/coupleReveal.audit.ts`

import type { CoupleGameOption, RevealType } from "../../lib/coupleTypes";
import {
  REVEAL_PRECEDENCE,
  resolveReveal,
  type ResolveRevealInput,
} from "../../lib/coupleReveal";

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

const results: AssertionResult[] = [];

function assert(
  ok: boolean,
  assertion: string,
  detail: string
): void {
  results.push(ok ? { ok: true, assertion, detail } : { ok: false, assertion, detail });
}

// Option set with a real generous/critical valence delta (mirrors the
// `the_thing_i_call_helping` item's valence pattern).
const VALENCED_OPTIONS: CoupleGameOption[] = [
  { id: "controlling_the_outcome", label: "controlling the outcome", valence: "critical" },
  { id: "proving_worth", label: "proving worth", valence: "critical" },
  { id: "preventing_failure", label: "preventing failure", valence: "neutral" },
  { id: "actually_helping", label: "actually helping", valence: "generous" },
];

// Option set with no valence at all (mirrors `under_pressure_become`).
const UNVALENCED_OPTIONS: CoupleGameOption[] = [
  { id: "more_logical", label: "more logical" },
  { id: "more_quiet", label: "more quiet" },
  { id: "more_controlling", label: "more controlling" },
  { id: "more_avoidant", label: "more avoidant" },
];

// ─────────────────────────────────────────────────────────────────────
// (a) All five reveal types reachable.
// ─────────────────────────────────────────────────────────────────────

const TABLE: Array<{ name: string; input: ResolveRevealInput; expect: RevealType }> = [
  {
    name: "Obvious — exact match",
    input: {
      selfAnswer: "more_quiet",
      partnerGuess: "more_quiet",
      enginePredicted: "more_controlling",
      options: UNVALENCED_OPTIONS,
    },
    expect: "obvious",
  },
  {
    name: "Mirror Blind — engine+partner agree, self denies it",
    input: {
      selfAnswer: "more_logical",
      partnerGuess: "more_controlling",
      enginePredicted: "more_controlling",
      selfKnows: false,
      options: UNVALENCED_OPTIONS,
    },
    expect: "mirror_blind",
  },
  {
    name: "Hidden Pattern — engine names a driver neither person picked",
    input: {
      selfAnswer: "more_logical",
      partnerGuess: "more_quiet",
      enginePredicted: "more_controlling",
      options: UNVALENCED_OPTIONS,
    },
    expect: "hidden_pattern",
  },
  {
    name: "Loving Misread — partner guess is more generous than self answer",
    input: {
      selfAnswer: "controlling_the_outcome",
      partnerGuess: "actually_helping",
      enginePredicted: null,
      options: VALENCED_OPTIONS,
    },
    expect: "loving_misread",
  },
  {
    name: "Oblivious — plain mismatch, no engine, no valence delta",
    input: {
      selfAnswer: "more_quiet",
      partnerGuess: "more_logical",
      enginePredicted: null,
      options: UNVALENCED_OPTIONS,
    },
    expect: "oblivious",
  },
];

const reached = new Set<RevealType>();
for (const row of TABLE) {
  const got = resolveReveal(row.input);
  reached.add(got);
  assert(
    got === row.expect,
    `(a) row "${row.name}"`,
    `expected=${row.expect} got=${got}`
  );
}
for (const expected of REVEAL_PRECEDENCE) {
  assert(
    reached.has(expected),
    `(a) all five reachable — ${expected}`,
    reached.has(expected) ? "ok" : `${expected} never produced`
  );
}

// ─────────────────────────────────────────────────────────────────────
// (b) Mirror Blind outranks Loving Misread at the boundary.
// Input satisfies BOTH: engine+partner agree (mirror_blind),
// partner-guess valence is more generous than self valence (loving_misread).
// ─────────────────────────────────────────────────────────────────────

{
  const got = resolveReveal({
    selfAnswer: "controlling_the_outcome", // critical
    partnerGuess: "actually_helping",       // generous
    enginePredicted: "actually_helping",    // engine + partner agree
    selfKnows: false,                       // satisfies Mirror Blind
    options: VALENCED_OPTIONS,
  });
  assert(
    got === "mirror_blind",
    "(b) Mirror Blind beats Loving Misread at boundary",
    `expected=mirror_blind got=${got}`
  );
}

// ─────────────────────────────────────────────────────────────────────
// (c) Hidden Pattern outranks Loving Misread at the boundary.
// Input: engine names something neither picked, AND partner guess is
// more generous than self.
// ─────────────────────────────────────────────────────────────────────

{
  const got = resolveReveal({
    selfAnswer: "controlling_the_outcome",  // critical
    partnerGuess: "preventing_failure",      // neutral (more generous than critical)
    enginePredicted: "proving_worth",        // engine picks something neither chose
    options: VALENCED_OPTIONS,
  });
  assert(
    got === "hidden_pattern",
    "(c) Hidden Pattern beats Loving Misread at boundary",
    `expected=hidden_pattern got=${got}`
  );
}

// ─────────────────────────────────────────────────────────────────────
// (d) enginePredicted === null guarantee: never Mirror Blind / Hidden Pattern.
// Sweep across self/partner answer pairs.
// ─────────────────────────────────────────────────────────────────────

const NULL_ENGINE_CASES: ResolveRevealInput[] = [
  { selfAnswer: "more_quiet", partnerGuess: "more_quiet", enginePredicted: null, options: UNVALENCED_OPTIONS },
  { selfAnswer: "more_quiet", partnerGuess: "more_logical", enginePredicted: null, options: UNVALENCED_OPTIONS },
  { selfAnswer: "controlling_the_outcome", partnerGuess: "actually_helping", enginePredicted: null, options: VALENCED_OPTIONS },
  { selfAnswer: "more_quiet", partnerGuess: "more_logical", enginePredicted: null, selfKnows: false, options: UNVALENCED_OPTIONS },
  { selfAnswer: "controlling_the_outcome", partnerGuess: "proving_worth", enginePredicted: null, options: VALENCED_OPTIONS },
];

for (const input of NULL_ENGINE_CASES) {
  const got = resolveReveal(input);
  assert(
    got !== "mirror_blind" && got !== "hidden_pattern",
    `(d) null engine ⇒ not engine-informed reveal`,
    `self=${input.selfAnswer} guess=${input.partnerGuess} got=${got}`
  );
}

// ─────────────────────────────────────────────────────────────────────
// (e) selfKnows !== false ⇒ Mirror Blind does NOT fire even when
// partner+engine agree. Should route to Oblivious (no valence delta).
// ─────────────────────────────────────────────────────────────────────

{
  const got = resolveReveal({
    selfAnswer: "more_logical",
    partnerGuess: "more_controlling",
    enginePredicted: "more_controlling",
    // selfKnows omitted (undefined)
    options: UNVALENCED_OPTIONS,
  });
  assert(
    got !== "mirror_blind",
    "(e) selfKnows undefined ⇒ no Mirror Blind",
    `got=${got}`
  );
}
{
  const got = resolveReveal({
    selfAnswer: "more_logical",
    partnerGuess: "more_controlling",
    enginePredicted: "more_controlling",
    selfKnows: true,
    options: UNVALENCED_OPTIONS,
  });
  assert(
    got !== "mirror_blind",
    "(e) selfKnows=true ⇒ no Mirror Blind",
    `got=${got}`
  );
}

// ─────────────────────────────────────────────────────────────────────
// Report.
// ─────────────────────────────────────────────────────────────────────

console.log("\nInput → reveal table:");
console.log("─".repeat(72));
for (const row of TABLE) {
  const got = resolveReveal(row.input);
  const mark = got === row.expect ? "✓" : "✗";
  console.log(`  ${mark}  ${row.name.padEnd(60)} → ${got}`);
}
console.log("─".repeat(72));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} assertions passed.`);
if (failed.length > 0) {
  console.log("\nFAILURES:");
  for (const f of failed) {
    console.log(`  ✗ ${f.assertion}`);
    console.log(`     ${f.detail}`);
  }
  process.exit(1);
}
console.log("\nALL ASSERTIONS PASSED.");
process.exit(0);
