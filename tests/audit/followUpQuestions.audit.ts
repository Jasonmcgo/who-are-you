// CC-125 — Audit for `lib/followUpQuestions.ts`.
//
// Validates the 3-question follow-up generator against 8 synthetic
// `FollowUpInput` fixtures spanning the decision-tree branches and
// every family. Per CC-125 task F, asserts:
//   - exactly 3 questions per set
//   - each question has >= 5 options
//   - the three core purposes (grip_object + release_condition +
//     aim_replacement) are covered — release_condition either as a
//     dedicated Slot-2 question OR folded into a compression_check /
//     trait_vs_weather swap probe's options
//   - selectedFamilies populated, reasonForQuestions non-empty
//   - deterministic (same input twice → identical JSON)

import {
  generateFollowUpQuestions,
  type FollowUpInput,
  type FollowUpQuestionSet,
} from "../../lib/followUpQuestions";

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function makeInput(partial: Partial<FollowUpInput> & {
  personName?: string;
  family?: string;
}): FollowUpInput {
  // Build a baseline FollowUpInput; callers override the relevant slots.
  const family = partial.family ?? "worth_achievement";
  return {
    personName: partial.personName ?? "Test",
    lens: partial.lens ?? {
      typeLabel: "ENTJ",
      dom: "te",
      aux: "ni",
      confidence: "high",
    },
    movement: partial.movement ?? {
      goal: 70,
      soul: 55,
      directionDegrees: 38,
      usableMovement: 60,
      potentialMovement: 75,
      dragPercent: 20,
      aim: 65,
      grip: 40,
      gripWithStakes: 50,
      gripDelta: 10,
      amplifier: 1.25,
      riskForm: "W",
    },
    weather: partial.weather ?? { load: "moderate", stateCaveat: false },
    gripPattern: partial.gripPattern ?? {
      primary: family,
      stakesTriggers: [],
    },
    reportSignals: partial.reportSignals ?? {
      topValues: ["Honor", "Knowledge"],
      currentMode: "building",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Fixtures — 8 scenarios per CC-125 §F
// ─────────────────────────────────────────────────────────────────────

const FIXTURES: Array<{
  label: string;
  input: FollowUpInput;
  expectSlot2Purpose: "release_condition" | "compression_check" | "trait_vs_weather";
}> = [
  {
    // Trait grip — high baseline, low stakes delta → trait_vs_weather
    label: "trait grip (high grip, low delta)",
    input: makeInput({
      family: "control_mastery",
      movement: {
        goal: 85, soul: 50, directionDegrees: 30, usableMovement: 55,
        potentialMovement: 80, dragPercent: 31, aim: 60,
        grip: 75, gripWithStakes: 78, gripDelta: 3,
        amplifier: 1.04, riskForm: "W",
      },
      lens: { typeLabel: "INTJ", dom: "ni", aux: "te", confidence: "high" },
    }),
    expectSlot2Purpose: "trait_vs_weather",
  },
  {
    // Stakes-reactive — moderate baseline + high delta → release_condition
    label: "stakes-reactive (mod grip, high delta)",
    input: makeInput({
      family: "worth_achievement",
      movement: {
        goal: 72, soul: 48, directionDegrees: 34, usableMovement: 58,
        potentialMovement: 78, dragPercent: 26, aim: 62,
        grip: 45, gripWithStakes: 65, gripDelta: 20,
        amplifier: 1.44, riskForm: "W",
      },
    }),
    expectSlot2Purpose: "release_condition",
  },
  {
    // State-compression — high load, high delta, low confidence → compression_check
    label: "state-compression (high load, high delta, low conf)",
    input: makeInput({
      family: "control_mastery",
      weather: { load: "high", stateCaveat: true },
      lens: { typeLabel: "INTP", dom: "ti", aux: "ne", confidence: "low" },
      movement: {
        goal: 58, soul: 42, directionDegrees: 36, usableMovement: 38,
        potentialMovement: 70, dragPercent: 46, aim: 45,
        grip: 50, gripWithStakes: 65, gripDelta: 15,
        amplifier: 1.30, riskForm: "G",
      },
    }),
    expectSlot2Purpose: "compression_check",
  },
  {
    // Burden-no-grip — high load, low delta, low conf → release_condition
    label: "burden-no-grip (high load, low delta, low conf)",
    input: makeInput({
      family: "responsibility",
      weather: { load: "high", stateCaveat: true },
      lens: { typeLabel: "ISFJ", dom: "si", aux: "fe", confidence: "low" },
      movement: {
        goal: 50, soul: 70, directionDegrees: 54, usableMovement: 50,
        potentialMovement: 65, dragPercent: 23, aim: 48,
        grip: 35, gripWithStakes: 38, gripDelta: 3,
        amplifier: 1.08, riskForm: "B",
      },
      gripPattern: { primary: "responsibility", stakesTriggers: ["family obligation"] },
      reportSignals: { topValues: ["Family", "Loyalty"], currentMode: "maintaining" },
    }),
    // Note: family resolves to continuity due to Si-dominance override.
    expectSlot2Purpose: "release_condition",
  },
  {
    // Belonging/usefulness — standard mid-grip mid-delta
    label: "belonging/usefulness",
    input: makeInput({
      family: "belonging_usefulness",
      lens: { typeLabel: "ESFJ", dom: "fe", aux: "si", confidence: "high" },
      movement: {
        goal: 55, soul: 75, directionDegrees: 58, usableMovement: 65,
        potentialMovement: 80, dragPercent: 18, aim: 70,
        grip: 50, gripWithStakes: 60, gripDelta: 10,
        amplifier: 1.20, riskForm: "L",
      },
      reportSignals: { topValues: ["Family", "Loyalty"], currentMode: "maintaining" },
    }),
    expectSlot2Purpose: "release_condition",
  },
  {
    // Worth/achievement — Te-dominant, output-oriented
    label: "worth/achievement",
    input: makeInput({
      family: "worth_achievement",
      lens: { typeLabel: "ENTJ", dom: "te", aux: "ni", confidence: "high" },
      movement: {
        goal: 88, soul: 52, directionDegrees: 30, usableMovement: 72,
        potentialMovement: 85, dragPercent: 15, aim: 68,
        grip: 55, gripWithStakes: 68, gripDelta: 13,
        amplifier: 1.24, riskForm: "W",
      },
      reportSignals: { topValues: ["Honor", "Knowledge"], currentMode: "building" },
    }),
    expectSlot2Purpose: "release_condition",
  },
  {
    // Control/mastery — Ti-dominant, knowledge-protector
    label: "control/mastery",
    input: makeInput({
      family: "control_mastery",
      lens: { typeLabel: "INTP", dom: "ti", aux: "ne", confidence: "high" },
      movement: {
        goal: 70, soul: 55, directionDegrees: 38, usableMovement: 60,
        potentialMovement: 78, dragPercent: 23, aim: 64,
        grip: 50, gripWithStakes: 60, gripDelta: 10,
        amplifier: 1.20, riskForm: "W",
      },
      reportSignals: { topValues: ["Knowledge", "Honor"], currentMode: "building" },
    }),
    expectSlot2Purpose: "release_condition",
  },
  {
    // Continuity/Si — Si-dominant, precedent-keeper
    label: "continuity/Si",
    input: makeInput({
      family: "continuity",
      lens: { typeLabel: "ISTJ", dom: "si", aux: "te", confidence: "high" },
      movement: {
        goal: 65, soul: 58, directionDegrees: 41, usableMovement: 60,
        potentialMovement: 72, dragPercent: 17, aim: 60,
        grip: 50, gripWithStakes: 58, gripDelta: 8,
        amplifier: 1.16, riskForm: "S",
      },
      reportSignals: { topValues: ["Stability", "Family"], currentMode: "maintaining" },
    }),
    expectSlot2Purpose: "release_condition",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Assertion helpers
// ─────────────────────────────────────────────────────────────────────

function checkSet(set: FollowUpQuestionSet, label: string): AssertionResult[] {
  const results: AssertionResult[] = [];

  // 3 questions exactly
  results.push(
    set.questions.length === 3
      ? { ok: true, assertion: `${label}/three-questions` }
      : {
          ok: false,
          assertion: `${label}/three-questions`,
          detail: `expected 3, got ${set.questions.length}`,
        }
  );

  // Each question >= 5 options
  for (const q of set.questions) {
    results.push(
      q.options.length >= 5
        ? { ok: true, assertion: `${label}/${q.id}/min-options` }
        : {
            ok: false,
            assertion: `${label}/${q.id}/min-options`,
            detail: `expected >= 5 options, got ${q.options.length}`,
          }
    );
  }

  // 3 core purposes covered (release_condition relaxed: swap probes carry
  // folded release intent in their options, so accept either purpose).
  const purposes = set.questions.map((q) => q.purpose);
  const hasGripObject = purposes.includes("grip_object");
  const hasAimReplacement = purposes.includes("aim_replacement");
  const hasReleaseOrSwap =
    purposes.includes("release_condition") ||
    purposes.includes("compression_check") ||
    purposes.includes("trait_vs_weather");
  results.push(
    hasGripObject && hasAimReplacement && hasReleaseOrSwap
      ? { ok: true, assertion: `${label}/three-purposes-covered` }
      : {
          ok: false,
          assertion: `${label}/three-purposes-covered`,
          detail: `purposes=${purposes.join(",")}; need grip_object + aim_replacement + (release_condition|compression_check|trait_vs_weather)`,
        }
  );

  // selectedFamilies populated
  results.push(
    set.selectedFamilies.length > 0
      ? { ok: true, assertion: `${label}/selected-families-populated` }
      : {
          ok: false,
          assertion: `${label}/selected-families-populated`,
          detail: "selectedFamilies array is empty",
        }
  );

  // reasonForQuestions non-empty
  results.push(
    set.reasonForQuestions.trim().length > 0
      ? { ok: true, assertion: `${label}/reason-non-empty` }
      : {
          ok: false,
          assertion: `${label}/reason-non-empty`,
          detail: "reasonForQuestions empty",
        }
  );

  // Folded release intent on swap probes: when Slot 2 is a swap, at
  // least one option in that question must tag-include "release" or
  // similar release-flavored token.
  const slot2 = set.questions[1];
  if (
    slot2 &&
    (slot2.purpose === "compression_check" || slot2.purpose === "trait_vs_weather")
  ) {
    const hasReleaseFolded = slot2.options.some((o) =>
      o.tags.some((t) =>
        /release|softening|restore/i.test(t) ||
        /restore|soften|release/i.test(o.label)
      )
    );
    results.push(
      hasReleaseFolded
        ? { ok: true, assertion: `${label}/swap-probe-has-folded-release` }
        : {
            ok: false,
            assertion: `${label}/swap-probe-has-folded-release`,
            detail: `${slot2.purpose} options carry no release/restore/soften tag`,
          }
    );
  }

  return results;
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  for (const { label, input, expectSlot2Purpose } of FIXTURES) {
    const set = generateFollowUpQuestions(input);

    // Per-fixture invariants
    results.push(...checkSet(set, label));

    // Determinism: same input twice → identical JSON
    const setAgain = generateFollowUpQuestions(input);
    const jsonA = JSON.stringify(set);
    const jsonB = JSON.stringify(setAgain);
    results.push(
      jsonA === jsonB
        ? { ok: true, assertion: `${label}/deterministic` }
        : {
            ok: false,
            assertion: `${label}/deterministic`,
            detail: "same input produced different output",
          }
    );

    // Slot-2 purpose matches the decision-tree expectation. NB: fixture
    // #4 (burden-no-grip) carries Si-dominance so its family becomes
    // "continuity" via the override; the Slot-2 expectation here is
    // about the *purpose*, not the family.
    const slot2 = set.questions[1];
    results.push(
      slot2?.purpose === expectSlot2Purpose
        ? { ok: true, assertion: `${label}/slot2-purpose=${expectSlot2Purpose}` }
        : {
            ok: false,
            assertion: `${label}/slot2-purpose=${expectSlot2Purpose}`,
            detail: `slot2 was ${slot2?.purpose}`,
          }
    );
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────

console.log("CC-125 FOLLOW-UP-QUESTIONS audit");
console.log("=================================");

const results = runAudit();
let pass = 0;
let fail = 0;
for (const r of results) {
  if (r.ok) {
    pass++;
    // Only print successes summary at the end; keep noise low.
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
  console.log("AUDIT PASSED — all CC-125 follow-up-question assertions green.");
}
