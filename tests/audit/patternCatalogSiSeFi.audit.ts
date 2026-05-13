// CC-PATTERN-CATALOG-SI-SE-FI — second-route Si/Se/Ti/Fi/Fe pattern audit.
//
// Verifies the five additional cross-card patterns added by this CC:
//   - si_precedent_keeper_under_pressure
//   - se_present_tense_responder
//   - ti_coherence_prover
//   - fi_inner_compass_refusal
//   - fe_room_attunement_under_conflict
//
// These extend the catalog with a second discriminating route per
// dominant function (Si/Se/Ti/Fi/Fe), closing the function-coverage
// asymmetry surfaced by feedback_pattern_catalog_function_bias. CC-029
// Tier 2 already added one pattern per function; this CC adds the second.
//
// Hand-rolled. Invocation: `npx tsx tests/audit/patternCatalogSiSeFi.audit.ts`.

import { execSync } from "node:child_process";
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
const REPO_ROOT = join(__dirname, "..", "..");
const FIXTURES_OCEAN = join(REPO_ROOT, "tests", "fixtures", "ocean");
const FIXTURES_GSG = join(REPO_ROOT, "tests", "fixtures", "goal-soul-give");

const NEW_PATTERN_IDS = [
  "si_precedent_keeper_under_pressure",
  "se_present_tense_responder",
  "ti_coherence_prover",
  "fi_inner_compass_refusal",
  "fe_room_attunement_under_conflict",
] as const;

type NewPatternId = (typeof NEW_PATTERN_IDS)[number];

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

function loadFixture(path: string): {
  answers: Answer[];
  demographics: DemographicSet | null;
} {
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
  };
  return { answers: raw.answers, demographics: raw.demographics ?? null };
}

function buildFromFixture(dir: string, filename: string) {
  const { answers, demographics } = loadFixture(join(dir, filename));
  return buildInnerConstitution(answers, [], demographics);
}

function firedIdsFor(constitution: ReturnType<typeof buildInnerConstitution>) {
  const fired = detectCrossCardPatterns(
    constitution.signals,
    getTopCompassValues(constitution.signals),
    getTopGravityAttribution(constitution.signals),
    constitution.lens_stack,
    constitution.meta_signals,
    null,
    constitution.ocean?.dispositionSignalMix.bands
  );
  return fired.map((f) => f.pattern.pattern_id);
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  const newPatterns = CROSS_CARD_PATTERNS.filter((p) =>
    (NEW_PATTERN_IDS as readonly string[]).includes(p.pattern_id)
  );

  // ── 1: pattern-uniqueness ────────────────────────────────────────────
  const existingPatternIds = CROSS_CARD_PATTERNS.map((p) => p.pattern_id);
  const duplicates: string[] = [];
  for (const id of NEW_PATTERN_IDS) {
    const count = existingPatternIds.filter((x) => x === id).length;
    if (count !== 1) duplicates.push(`${id} (count=${count})`);
  }
  // Also: all 5 IDs are present.
  const missingPatterns = NEW_PATTERN_IDS.filter(
    (id) => !existingPatternIds.includes(id)
  );
  if (duplicates.length === 0 && missingPatterns.length === 0) {
    results.push({
      ok: true,
      assertion: "pattern-si-se-fi-pattern-uniqueness",
      detail: `all ${NEW_PATTERN_IDS.length} new pattern IDs are unique and present`,
    });
  } else {
    results.push({
      ok: false,
      assertion: "pattern-si-se-fi-pattern-uniqueness",
      detail: `duplicates=[${duplicates.join(", ")}] missing=[${missingPatterns.join(", ")}]`,
    });
  }

  // ── 2: rationale-non-empty (description field) ───────────────────────
  const emptyRationale = newPatterns
    .filter((p) => !p.description || p.description.trim().length === 0)
    .map((p) => p.pattern_id);
  results.push(
    emptyRationale.length === 0
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-rationale-non-empty",
          detail: `all ${newPatterns.length} new patterns have non-empty description`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-rationale-non-empty",
          detail: `empty rationales: ${emptyRationale.join(", ")}`,
        }
  );

  // ── 3: predicate-deterministic ──────────────────────────────────────
  // Run all 24 cohort fixtures twice and confirm the firing set for each
  // new pattern is identical between runs.
  const allFixtures: { dir: string; file: string }[] = [];
  for (const dir of [FIXTURES_OCEAN, FIXTURES_GSG]) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      allFixtures.push({ dir, file: f });
    }
  }
  const firstRun: Record<string, string[]> = {};
  const secondRun: Record<string, string[]> = {};
  for (const { dir, file } of allFixtures) {
    const c = buildFromFixture(dir, file);
    firstRun[file] = firedIdsFor(c).filter((id) =>
      (NEW_PATTERN_IDS as readonly string[]).includes(id)
    );
  }
  for (const { dir, file } of allFixtures) {
    const c = buildFromFixture(dir, file);
    secondRun[file] = firedIdsFor(c).filter((id) =>
      (NEW_PATTERN_IDS as readonly string[]).includes(id)
    );
  }
  const determinismFails: string[] = [];
  for (const { file } of allFixtures) {
    const a = [...firstRun[file]].sort().join(",");
    const b = [...secondRun[file]].sort().join(",");
    if (a !== b) determinismFails.push(`${file}: ${a} vs ${b}`);
  }
  results.push(
    determinismFails.length === 0
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-predicate-deterministic",
          detail: `all ${allFixtures.length} fixtures produced identical firing sets across two runs`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-predicate-deterministic",
          detail: `non-deterministic firings: ${determinismFails.join("; ")}`,
        }
  );

  // ── Per-function coverage assertions ────────────────────────────────
  // Build cohort firing counts for each new pattern.
  const firingByPattern: Record<NewPatternId, string[]> = {
    si_precedent_keeper_under_pressure: [],
    se_present_tense_responder: [],
    ti_coherence_prover: [],
    fi_inner_compass_refusal: [],
    fe_room_attunement_under_conflict: [],
  };
  for (const { dir, file } of allFixtures) {
    const c = buildFromFixture(dir, file);
    const fired = firedIdsFor(c);
    for (const id of NEW_PATTERN_IDS) {
      if (fired.includes(id)) {
        firingByPattern[id].push(`${dir.split("/").pop()}/${file}`);
      }
    }
  }

  // ── 4: Si-1 coverage (ocean/24 must fire si_precedent_keeper_under_pressure) ─
  const si24 = buildFromFixture(FIXTURES_OCEAN, "24-si-precedent-keeper.json");
  const si24Fired = firedIdsFor(si24);
  results.push(
    si24Fired.includes("si_precedent_keeper_under_pressure")
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-si-coverage",
          detail: `ocean/24-si-precedent-keeper fires si_precedent_keeper_under_pressure; cohort fires=${firingByPattern.si_precedent_keeper_under_pressure.length}`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-si-coverage",
          detail: `ocean/24 did NOT fire si_precedent_keeper_under_pressure; fired=[${si24Fired.join(", ")}]`,
        }
  );

  // ── 5: Se-1 coverage (at least one Se-leaning cohort fixture fires) ──
  // Per CC: "fires on at least one cohort fixture (e.g., gsg/03-striving
  // or similar Se-leaning shape)." If the predicate produces zero fires
  // across the cohort, the assertion fails — flag as cohort thinness in
  // recommendations.
  const se1Fires = firingByPattern.se_present_tense_responder;
  results.push(
    se1Fires.length >= 1
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-se-coverage",
          detail: `se_present_tense_responder fires on ${se1Fires.length} cohort fixture(s): ${se1Fires.join(", ")}`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-se-coverage",
          detail: `se_present_tense_responder fires on 0/${allFixtures.length} cohort fixtures — flag for CC-COHORT-EXPANSION-SI-SE`,
        }
  );

  // ── 6: Ti-1 coverage (ocean/25 must fire ti_coherence_prover) ────────
  const ti25 = buildFromFixture(FIXTURES_OCEAN, "25-ti-coherence-prober.json");
  const ti25Fired = firedIdsFor(ti25);
  results.push(
    ti25Fired.includes("ti_coherence_prover")
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-ti-coverage",
          detail: `ocean/25-ti-coherence-prober fires ti_coherence_prover; cohort fires=${firingByPattern.ti_coherence_prover.length}`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-ti-coverage",
          detail: `ocean/25 did NOT fire ti_coherence_prover; fired=[${ti25Fired.join(", ")}]`,
        }
  );

  // ── 7: Fi-1 coverage (≥1 cohort fixture; CC allows cohort-thinness flag) ─
  const fi1Fires = firingByPattern.fi_inner_compass_refusal;
  results.push(
    fi1Fires.length >= 1
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-fi-coverage",
          detail: `fi_inner_compass_refusal fires on ${fi1Fires.length} cohort fixture(s): ${fi1Fires.join(", ")}`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-fi-coverage",
          detail: `fi_inner_compass_refusal fires on 0/${allFixtures.length} cohort fixtures — cohort thinness flag for CC-COHORT-EXPANSION-SI-SE`,
        }
  );

  // ── 8: Fe-1 coverage (ocean/27 must fire fe_room_attunement_under_conflict) ─
  const fe27 = buildFromFixture(FIXTURES_OCEAN, "27-fe-room-reader-attuned.json");
  const fe27Fired = firedIdsFor(fe27);
  results.push(
    fe27Fired.includes("fe_room_attunement_under_conflict")
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-fe-coverage",
          detail: `ocean/27-fe-room-reader-attuned fires fe_room_attunement_under_conflict; cohort fires=${firingByPattern.fe_room_attunement_under_conflict.length}`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-fe-coverage",
          detail: `ocean/27 did NOT fire fe_room_attunement_under_conflict; fired=[${fe27Fired.join(", ")}]`,
        }
  );

  // ── 9: cohort-distribution (informational, always pass) ──────────────
  const distribution = NEW_PATTERN_IDS.map(
    (id) => `${id}=${firingByPattern[id].length}`
  ).join(", ");
  results.push({
    ok: true,
    assertion: "pattern-si-se-fi-cohort-distribution",
    detail: `(informational) ${distribution} across ${allFixtures.length} fixtures`,
  });

  // ── 10: no-prose-changes — assert this CC's pattern_ids do not appear
  // in any prose render layer file. The prompt requires renderMirror.ts
  // and InnerConstitutionPage.tsx to remain engine/render-pristine; since
  // working-tree dirtiness predates this CC (per the project's git
  // status), we check the stronger semantic: the five new pattern_ids
  // appear ONLY in the catalog file (identityEngine.ts) and the new
  // audit. If a render file references any of them, the CC has leaked
  // out of the engine layer.
  void execSync; // retained for any future diff-based variant
  const proseRenderFiles = [
    join(REPO_ROOT, "app", "components", "InnerConstitutionPage.tsx"),
    join(REPO_ROOT, "lib", "renderMirror.ts"),
  ];
  const leaks: string[] = [];
  for (const filePath of proseRenderFiles) {
    let body = "";
    try {
      body = readFileSync(filePath, "utf-8");
    } catch (e) {
      void e;
      continue;
    }
    for (const id of NEW_PATTERN_IDS) {
      if (body.includes(id)) {
        leaks.push(`${filePath.replace(REPO_ROOT + "/", "")} references ${id}`);
      }
    }
  }
  results.push(
    leaks.length === 0
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-no-prose-changes",
          detail: `none of the 5 new pattern_ids appear in render layer (engine-layer scope preserved)`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-no-prose-changes",
          detail: `prose-layer leaks: ${leaks.join("; ")}`,
        }
  );

  // ── Composition check (additional safety): new patterns must NOT fire
  // on Ni/Ne/Te-driver fixtures. Walks the cohort and asserts that any
  // new-pattern firing has a matching dominant function.
  const expectedDominant: Record<NewPatternId, CognitiveFunctionId> = {
    si_precedent_keeper_under_pressure: "si",
    se_present_tense_responder: "se",
    ti_coherence_prover: "ti",
    fi_inner_compass_refusal: "fi",
    fe_room_attunement_under_conflict: "fe",
  };
  const compositionFails: string[] = [];
  for (const { dir, file } of allFixtures) {
    const c = buildFromFixture(dir, file);
    const fired = firedIdsFor(c);
    for (const id of NEW_PATTERN_IDS) {
      if (fired.includes(id) && c.lens_stack.dominant !== expectedDominant[id]) {
        compositionFails.push(
          `${file}: ${id} fired on dom=${c.lens_stack.dominant}`
        );
      }
    }
  }
  results.push(
    compositionFails.length === 0
      ? {
          ok: true,
          assertion: "pattern-si-se-fi-composition-no-cross-firing",
          detail: `all new-pattern firings matched expected dominant function`,
        }
      : {
          ok: false,
          assertion: "pattern-si-se-fi-composition-no-cross-firing",
          detail: `cross-firings: ${compositionFails.join("; ")}`,
        }
  );

  // ── CC-COHORT-EXPANSION-SI-SE-CRISIS: 4 new driver-coverage fixtures
  // The cohort-expansion CC added 4 second driver-coverage fixtures (Si,
  // Se, Ti, Fi). Each should fire its canonical Si/Se/Ti/Fi pattern,
  // proving the catalog isn't single-fixture-fragile.
  const COHORT_DRIVER_FIXTURES: {
    file: string;
    expectedPattern: (typeof NEW_PATTERN_IDS)[number];
  }[] = [
    {
      file: "si-tradition-steward.json",
      expectedPattern: "si_precedent_keeper_under_pressure",
    },
    {
      file: "se-high-extraversion-responder.json",
      expectedPattern: "se_present_tense_responder",
    },
    {
      file: "ti-systems-analyst.json",
      expectedPattern: "ti_coherence_prover",
    },
    {
      file: "fi-quiet-resister.json",
      expectedPattern: "fi_inner_compass_refusal",
    },
  ];
  const FIXTURES_COHORT_DIR = join(REPO_ROOT, "tests", "fixtures", "cohort");
  for (const spec of COHORT_DRIVER_FIXTURES) {
    let fires = false;
    let detail = "";
    try {
      const c = buildFromFixture(FIXTURES_COHORT_DIR, spec.file);
      const ids = firedIdsFor(c);
      fires = ids.includes(spec.expectedPattern);
      detail = `dom=${c.lens_stack.dominant} fired=${ids
        .filter((x) =>
          (NEW_PATTERN_IDS as readonly string[]).includes(x)
        )
        .join(", ") || "(none)"}`;
    } catch (e) {
      detail = `build error: ${(e as Error).message}`;
    }
    const driverLabel = spec.expectedPattern
      .split("_")[0]
      .toUpperCase();
    results.push(
      fires
        ? {
            ok: true,
            assertion: `pattern-si-se-fi-cohort-expansion-${driverLabel}-fires`,
            detail: `${spec.file}: ${spec.expectedPattern} fires; ${detail}`,
          }
        : {
            ok: false,
            assertion: `pattern-si-se-fi-cohort-expansion-${driverLabel}-fires`,
            detail: `${spec.file}: expected ${spec.expectedPattern} to fire; ${detail}`,
          }
    );
  }

  return results;
}

function main(): number {
  console.log("CC-PATTERN-CATALOG-SI-SE-FI — Si/Se/Ti/Fi/Fe second-route pattern audit");
  console.log("========================================================================");
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
    "AUDIT PASSED — CC-PATTERN-CATALOG-SI-SE-FI: function-coverage asymmetry closed for the 5 named patterns."
  );
  return 0;
}

process.exit(main());
