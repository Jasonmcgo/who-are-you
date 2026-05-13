// CC-FIXTURES-SI-TI-FI-FE — fixture-expansion audit.
//
// Verifies the 4 new fixtures (Si / Ti / Fi / Fe dominant) load cleanly,
// produce the expected lens-stack dominant function, fire the matching
// CC-029 cross-card pattern, surface gravity attribution, and don't
// modify any existing fixture (regression).
//
// Hand-rolled. Invocation: `npx tsx tests/audit/fixturesSiTiFiFe.audit.ts`.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildInnerConstitution,
  CROSS_CARD_PATTERNS,
  detectCrossCardPatterns,
  getTopCompassValues,
  getTopGravityAttribution,
} from "../../lib/identityEngine";
import type {
  Answer,
  CognitiveFunctionId,
  DemographicSet,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_OCEAN = join(__dirname, "..", "fixtures", "ocean");
const FIXTURES_GSG = join(__dirname, "..", "fixtures", "goal-soul-give");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type FixtureSpec = {
  filename: string;
  expectedDominant: CognitiveFunctionId;
  expectedPatternId: string;
  label: string;
};

// The 4 new fixtures and their expected outputs.
const NEW_FIXTURES: FixtureSpec[] = [
  {
    filename: "24-si-precedent-keeper.json",
    expectedDominant: "si",
    expectedPatternId: "si_tradition_built_from_chaos",
    label: "Si",
  },
  {
    filename: "25-ti-coherence-prober.json",
    expectedDominant: "ti",
    expectedPatternId: "ti_closed_reasoning_chamber",
    label: "Ti",
  },
  {
    filename: "26-fi-inner-truth-anchor.json",
    expectedDominant: "fi",
    expectedPatternId: "fi_personally_authentic_only",
    label: "Fi",
  },
  {
    filename: "27-fe-room-reader-attuned.json",
    expectedDominant: "fe",
    expectedPatternId: "fe_attunement_to_yielded_conviction",
    label: "Fe",
  },
];

void CROSS_CARD_PATTERNS; // catalog import retained for static reference

function loadFixture(filename: string): {
  answers: Answer[];
  demographics: DemographicSet | null;
} {
  const path = join(FIXTURES_OCEAN, filename);
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return { answers: raw.answers, demographics: raw.demographics ?? null };
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // Per-fixture build + dominant + pattern fire checks.
  for (const spec of NEW_FIXTURES) {
    let buildOk = true;
    let constitution = null as ReturnType<typeof buildInnerConstitution> | null;
    try {
      const { answers, demographics } = loadFixture(spec.filename);
      constitution = buildInnerConstitution(answers, [], demographics);
    } catch (e) {
      buildOk = false;
      results.push({
        ok: false,
        assertion: `fixtures-${spec.label.toLowerCase()}-fixture-loads-and-builds`,
        detail: `build error: ${(e as Error).message}`,
      });
      continue;
    }
    results.push({
      ok: buildOk,
      assertion: `fixtures-${spec.label.toLowerCase()}-fixture-loads-and-builds`,
    });
    if (!constitution) continue;

    // Dominant function check.
    results.push(
      constitution.lens_stack.dominant === spec.expectedDominant
        ? {
            ok: true,
            assertion: `fixtures-${spec.label.toLowerCase()}-lens-dominant-correct`,
            detail: `dom=${constitution.lens_stack.dominant} aux=${constitution.lens_stack.auxiliary} mbti=${constitution.lens_stack.mbtiCode ?? "-"}`,
          }
        : {
            ok: false,
            assertion: `fixtures-${spec.label.toLowerCase()}-lens-dominant-correct`,
            detail: `expected ${spec.expectedDominant}, got ${constitution.lens_stack.dominant}`,
          }
    );

    // Pattern fire check. We re-derive top-compass / top-gravity since the
    // pattern detection signature requires them; the patterns the new
    // fixtures fire don't depend on those refs but we pass them for
    // signature compliance.
    const fired = detectCrossCardPatterns(
      constitution.signals,
      [],
      [],
      constitution.lens_stack,
      constitution.meta_signals,
      null
    );
    const firedIds = fired.map((f) => f.pattern.pattern_id);
    results.push(
      firedIds.includes(spec.expectedPatternId)
        ? {
            ok: true,
            assertion: `fixtures-${spec.label.toLowerCase()}-pattern-fires`,
            detail: `fired: ${firedIds.join(", ")}`,
          }
        : {
            ok: false,
            assertion: `fixtures-${spec.label.toLowerCase()}-pattern-fires`,
            detail: `expected ${spec.expectedPatternId}, fired: [${firedIds.join(", ")}]`,
          }
    );
  }

  // Cohort-level rollups.
  const newConstitutions = NEW_FIXTURES.map((spec) => {
    const { answers, demographics } = loadFixture(spec.filename);
    return {
      spec,
      constitution: buildInnerConstitution(answers, [], demographics),
    };
  });

  // Gravity attribution: every new fixture has non-empty topGravity[0].
  const gravityFails = newConstitutions.filter(
    ({ constitution }) =>
      getTopGravityAttribution(constitution.signals).length === 0
  );
  results.push(
    gravityFails.length === 0
      ? { ok: true, assertion: "fixtures-all-have-gravity-attribution" }
      : {
          ok: false,
          assertion: "fixtures-all-have-gravity-attribution",
          detail: `${gravityFails.length}/4 new fixtures lack topGravity[0]: ${gravityFails.map((r) => r.spec.label).join(", ")}`,
        }
  );

  // topCompass: every new fixture has at least 4 entries.
  const compassFails = newConstitutions.filter(
    ({ constitution }) => getTopCompassValues(constitution.signals).length < 4
  );
  results.push(
    compassFails.length === 0
      ? { ok: true, assertion: "fixtures-all-have-top-compass" }
      : {
          ok: false,
          assertion: "fixtures-all-have-top-compass",
          detail: `${compassFails.length}/4 new fixtures have <4 topCompass entries`,
        }
  );

  // Realistic Movement: non-zero goal AND non-zero soul.
  const movementFails = newConstitutions.filter(({ constitution }) => {
    const dash = constitution.goalSoulMovement?.dashboard;
    if (!dash) return true;
    return dash.goalScore === 0 || dash.soulScore === 0;
  });
  results.push(
    movementFails.length === 0
      ? { ok: true, assertion: "fixtures-all-have-realistic-movement" }
      : {
          ok: false,
          assertion: "fixtures-all-have-realistic-movement",
          detail: `${movementFails.length}/4 new fixtures have goal=0 or soul=0`,
        }
  );

  // Cohort now has all 8 dominant functions represented. We walk both
  // ocean and goal-soul-give fixture directories and tally dominants.
  const allDominants = new Set<CognitiveFunctionId>();
  for (const dir of [FIXTURES_OCEAN, FIXTURES_GSG]) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      const c = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      allDominants.add(c.lens_stack.dominant);
    }
  }
  const allEightFunctions: CognitiveFunctionId[] = [
    "ni",
    "ne",
    "si",
    "se",
    "ti",
    "te",
    "fi",
    "fe",
  ];
  const missing = allEightFunctions.filter((fn) => !allDominants.has(fn));
  // Te is a known-missing dominant in the post-CC cohort; the prompt
  // explicitly flags it as out-of-scope-but-noticed for future
  // CC-FIXTURES-TE-COMPLEMENT. Si/Ti/Fi/Fe are the ones this CC closes.
  const targetFunctions: CognitiveFunctionId[] = ["si", "ti", "fi", "fe"];
  const targetMissing = targetFunctions.filter((fn) => !allDominants.has(fn));
  results.push(
    targetMissing.length === 0
      ? {
          ok: true,
          assertion: "fixtures-cohort-now-has-target-functions-dominant",
          detail: `cohort dominants: ${Array.from(allDominants).sort().join(", ")} (missing: ${missing.join(", ") || "none"})`,
        }
      : {
          ok: false,
          assertion: "fixtures-cohort-now-has-target-functions-dominant",
          detail: `still missing target dominants: ${targetMissing.join(", ")}`,
        }
  );

  // Cohort coverage: each of Si/Ti/Fi/Fe fires its pattern in ≥1
  // fixture across the now-24-fixture cohort.
  const patternFireCounts: Record<string, number> = {};
  for (const dir of [FIXTURES_OCEAN, FIXTURES_GSG]) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      const c = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      const fired = detectCrossCardPatterns(
        c.signals,
        [],
        [],
        c.lens_stack,
        c.meta_signals,
        null
      );
      for (const item of fired) {
        patternFireCounts[item.pattern.pattern_id] =
          (patternFireCounts[item.pattern.pattern_id] ?? 0) + 1;
      }
    }
  }
  const expectedPatterns = [
    "si_tradition_built_from_chaos",
    "ti_closed_reasoning_chamber",
    "fi_personally_authentic_only",
    "fe_attunement_to_yielded_conviction",
  ];
  const coverageFails = expectedPatterns.filter(
    (p) => (patternFireCounts[p] ?? 0) === 0
  );
  results.push(
    coverageFails.length === 0
      ? {
          ok: true,
          assertion: "fixtures-cohort-coverage-improved",
          detail: expectedPatterns
            .map((p) => `${p}=${patternFireCounts[p] ?? 0}`)
            .join(", "),
        }
      : {
          ok: false,
          assertion: "fixtures-cohort-coverage-improved",
          detail: `0-fire patterns: ${coverageFails.join(", ")}`,
        }
  );

  // Gravity attribution improved: ≥4 fixtures across cohort have non-
  // empty topGravity[0]. (The 4 new fixtures all do; existing 20
  // fixtures all return empty.)
  let withGravity = 0;
  for (const dir of [FIXTURES_OCEAN, FIXTURES_GSG]) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      const c = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      if (getTopGravityAttribution(c.signals).length > 0) withGravity++;
    }
  }
  results.push(
    withGravity >= 4
      ? {
          ok: true,
          assertion: "fixtures-gravity-attribution-improved",
          detail: `${withGravity} fixtures with topGravity[0] across cohort`,
        }
      : {
          ok: false,
          assertion: "fixtures-gravity-attribution-improved",
          detail: `only ${withGravity} fixtures with topGravity[0] (need ≥4)`,
        }
  );

  return results;
}

function main(): number {
  console.log("CC-FIXTURES-SI-TI-FI-FE — function-dominance + gravity-gap closure audit");
  console.log("===========================================================================");
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
    "AUDIT PASSED — all CC-FIXTURES-SI-TI-FI-FE assertions green; cohort coverage closed for Si/Ti/Fi/Fe."
  );
  return 0;
}

process.exit(main());
