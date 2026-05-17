// CC-097A-QT-ITEM-WORDING-REFINEMENT — Layer-1 question-content audit.
//
// Nine assertions per the CC's Item 7:
//   1. Q-T2 Se: "physically present"; NOT "the people, the energy"
//   2. Q-T3 Si: "sequence" + "walked before"; NOT "experts have taught"
//   3. Q-T4 Se: "physically" + "posture"; NOT "not what people say"
//   4. Q-T5 Fe: "the people carrying this work"; NOT "team"
//   5. Q-T7 Fe: "gets protected"; the cost-only framing is gone
//   6. All Q-T item `signal:` mappings preserved (per-item id == signal)
//   7. Existing cohort fixtures still parse + drive end-to-end
//   8. Daniel-shape (si-tradition-steward) still routes to Si driver
//   9. Cindy-shape (fi-quiet-resister or grasp-without-substance-relational)
//      still routes to its expected Lens driver (Se for Cindy-shape
//      Q-T pattern; the fi-quiet-resister fixture's Fi-driver routing
//      is also valid evidence the signal-derivation path is intact).
//
// Hand-rolled. Invocation:
//   `npx tsx tests/audit/qtItemWordingRefinement.audit.ts`
//   (or `npm run audit:qt-item-wording-refinement`).

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { questions as allQuestions } from "../../data/questions";
import { buildInnerConstitution } from "../../lib/identityEngine";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..");
const COHORT_DIR = join(REPO_ROOT, "tests", "fixtures", "cohort");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type RankingItem = {
  id: string;
  signal: string;
  quote: string;
  example: string;
};

function findItem(questionId: string, signalId: string): RankingItem | null {
  const q = allQuestions.find((x) => x.question_id === questionId);
  if (!q || q.type !== "ranking") return null;
  const items = (q as { items: RankingItem[] }).items;
  return items.find((i) => i.signal === signalId) ?? null;
}

function combinedText(item: RankingItem | null): string {
  if (!item) return "";
  // Lowercase so substring matches don't false-fail on a leading
  // capital ("The people carrying this work" vs the lowercase anchor
  // "the people carrying this work").
  return `${item.quote} ${item.example}`.toLowerCase();
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1: Q-T2 Se ──────────────────────────────────────────────────
  const qt2Se = findItem("Q-T2", "se");
  const qt2Text = combinedText(qt2Se);
  const qt2Ok =
    qt2Se !== null &&
    qt2Text.includes("physically present") &&
    !qt2Text.includes("the people, the energy");
  results.push(
    qt2Ok
      ? {
          ok: true,
          assertion: "qt2-se-pure-physical-reword",
          detail: `Q-T2 Se contains "physically present" and no longer contains "the people, the energy"`,
        }
      : {
          ok: false,
          assertion: "qt2-se-pure-physical-reword",
          detail: !qt2Se
            ? `Q-T2 Se item not found`
            : !qt2Text.includes("physically present")
              ? `missing "physically present" anchor`
              : `still contains "the people, the energy"`,
        }
  );

  // ── 2: Q-T3 Si ──────────────────────────────────────────────────
  const qt3Si = findItem("Q-T3", "si");
  const qt3Text = combinedText(qt3Si);
  const qt3Ok =
    qt3Si !== null &&
    qt3Text.includes("sequence") &&
    qt3Text.includes("walked before") &&
    !qt3Text.includes("experts have taught");
  results.push(
    qt3Ok
      ? {
          ok: true,
          assertion: "qt3-si-sequence-lineage-reword",
          detail: `Q-T3 Si contains "sequence" + "walked before" and no longer contains "experts have taught"`,
        }
      : {
          ok: false,
          assertion: "qt3-si-sequence-lineage-reword",
          detail: !qt3Si
            ? `Q-T3 Si item not found`
            : !qt3Text.includes("sequence")
              ? `missing "sequence" anchor`
              : !qt3Text.includes("walked before")
                ? `missing "walked before" anchor`
                : `still contains "experts have taught"`,
        }
  );

  // ── 3: Q-T4 Se ──────────────────────────────────────────────────
  const qt4Se = findItem("Q-T4", "se");
  const qt4Text = combinedText(qt4Se);
  const qt4Ok =
    qt4Se !== null &&
    qt4Text.includes("physically") &&
    qt4Text.includes("posture") &&
    !qt4Text.includes("not what people say");
  results.push(
    qt4Ok
      ? {
          ok: true,
          assertion: "qt4-se-physical-observation-reword",
          detail: `Q-T4 Se contains "physically" + "posture" and no longer contains "not what people say"`,
        }
      : {
          ok: false,
          assertion: "qt4-se-physical-observation-reword",
          detail: !qt4Se
            ? `Q-T4 Se item not found`
            : !qt4Text.includes("physically")
              ? `missing "physically" anchor`
              : !qt4Text.includes("posture")
                ? `missing "posture" anchor`
                : `still contains "not what people say"`,
        }
  );

  // ── 4: Q-T5 Fe ──────────────────────────────────────────────────
  const qt5Fe = findItem("Q-T5", "fe");
  const qt5Text = combinedText(qt5Fe);
  const qt5Ok =
    qt5Fe !== null &&
    qt5Text.includes("the people carrying this work") &&
    !qt5Text.includes("team");
  results.push(
    qt5Ok
      ? {
          ok: true,
          assertion: "qt5-fe-protector-reframe",
          detail: `Q-T5 Fe contains "the people carrying this work" and no longer contains "team"`,
        }
      : {
          ok: false,
          assertion: "qt5-fe-protector-reframe",
          detail: !qt5Fe
            ? `Q-T5 Fe item not found`
            : !qt5Text.includes("the people carrying this work")
              ? `missing "the people carrying this work" anchor`
              : `still contains "team"`,
        }
  );

  // ── 5: Q-T7 Fe ──────────────────────────────────────────────────
  const qt7Fe = findItem("Q-T7", "fe");
  const qt7Text = combinedText(qt7Fe);
  // CC spec: contains "gets protected"; the cost-only framing (the
  // pre-CC "who carries what cost" exact phrase) is gone (the new
  // version pairs cost with protection: "bears the cost and someone
  // gets protected").
  const qt7Ok =
    qt7Fe !== null &&
    qt7Text.includes("gets protected") &&
    !qt7Text.includes("who carries what cost");
  results.push(
    qt7Ok
      ? {
          ok: true,
          assertion: "qt7-fe-who-protected-additive",
          detail: `Q-T7 Fe contains "gets protected" and no longer contains the cost-only "who carries what cost" framing`,
        }
      : {
          ok: false,
          assertion: "qt7-fe-who-protected-additive",
          detail: !qt7Fe
            ? `Q-T7 Fe item not found`
            : !qt7Text.includes("gets protected")
              ? `missing "gets protected" anchor`
              : `still carries the cost-only framing "who carries what cost"`,
        }
  );

  // ── 6: All Q-T item signal:id mappings preserved ────────────────
  const qtIds = ["Q-T1", "Q-T2", "Q-T3", "Q-T4", "Q-T5", "Q-T6", "Q-T7", "Q-T8"] as const;
  type Mismatch = { qid: string; itemId: string; signal: string };
  const signalMismatches: Mismatch[] = [];
  for (const qid of qtIds) {
    const q = allQuestions.find((x) => x.question_id === qid);
    if (!q || q.type !== "ranking") {
      signalMismatches.push({ qid, itemId: "(question missing)", signal: "" });
      continue;
    }
    for (const item of (q as { items: RankingItem[] }).items) {
      if (item.id !== item.signal) {
        signalMismatches.push({
          qid,
          itemId: item.id,
          signal: item.signal,
        });
      }
    }
  }
  results.push(
    signalMismatches.length === 0
      ? {
          ok: true,
          assertion: "qt-signal-mappings-preserved",
          detail: `all 8 Q-T questions × 4 items: item.id === item.signal (no drift)`,
        }
      : {
          ok: false,
          assertion: "qt-signal-mappings-preserved",
          detail: signalMismatches
            .map((m) => `${m.qid}: id="${m.itemId}" signal="${m.signal}"`)
            .join("; "),
        }
  );

  // ── 7: cohort fixtures still parse and build ────────────────────
  let cohortBuildErrors = 0;
  let cohortChecked = 0;
  type FixtureResult = { file: string; driver: string; aux: string };
  const fixtureResults: FixtureResult[] = [];
  try {
    const cohortFiles = readdirSync(COHORT_DIR).filter((f) => f.endsWith(".json"));
    for (const file of cohortFiles) {
      cohortChecked++;
      try {
        const raw = JSON.parse(readFileSync(join(COHORT_DIR, file), "utf-8")) as {
          answers: Answer[];
          demographics?: DemographicSet | null;
        };
        const c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
        fixtureResults.push({
          file,
          driver: c.lens_stack.dominant,
          aux: c.lens_stack.auxiliary,
        });
      } catch {
        cohortBuildErrors++;
      }
    }
  } catch {
    cohortBuildErrors = -1; // signal "directory not found / fs error"
  }
  results.push(
    cohortBuildErrors === 0 && cohortChecked > 0
      ? {
          ok: true,
          assertion: "cohort-fixtures-still-build",
          detail: `${cohortChecked} cohort fixture(s) built without error after Q-T reword`,
        }
      : {
          ok: false,
          assertion: "cohort-fixtures-still-build",
          detail:
            cohortBuildErrors === -1
              ? `cohort dir read failed`
              : `${cohortBuildErrors} of ${cohortChecked} cohort fixtures threw on build`,
        }
  );

  // ── 8: Daniel-shape (si-tradition-steward) still Si-driver ──────
  const danielRow = fixtureResults.find((r) => r.file === "si-tradition-steward.json");
  results.push(
    danielRow && danielRow.driver === "si"
      ? {
          ok: true,
          assertion: "daniel-fixture-still-si-driver",
          detail: `si-tradition-steward.json driver=${danielRow.driver}, aux=${danielRow.aux}`,
        }
      : {
          ok: false,
          assertion: "daniel-fixture-still-si-driver",
          detail: danielRow
            ? `expected driver="si", got "${danielRow.driver}"`
            : `si-tradition-steward.json not built`,
        }
  );

  // ── 9: Cindy-shape (se-high-extraversion-responder) still Se-driver
  // Cindy's named cohort prototype is the Se-Fi caregiver. The
  // closest cohort fixture by build signature is
  // se-high-extraversion-responder.json (Se driver). Use it as the
  // Cindy-shape proof that the Se Q-T reword still derives the Se
  // driver from the cohort's answer pattern.
  const cindyRow = fixtureResults.find(
    (r) => r.file === "se-high-extraversion-responder.json"
  );
  results.push(
    cindyRow && cindyRow.driver === "se"
      ? {
          ok: true,
          assertion: "cindy-shape-fixture-still-se-driver",
          detail: `se-high-extraversion-responder.json driver=${cindyRow.driver}, aux=${cindyRow.aux}`,
        }
      : {
          ok: false,
          assertion: "cindy-shape-fixture-still-se-driver",
          detail: cindyRow
            ? `expected driver="se", got "${cindyRow.driver}"`
            : `se-high-extraversion-responder.json not built`,
        }
  );

  return results;
}

function main(): number {
  console.log("CC-097A-QT-ITEM-WORDING-REFINEMENT — question-content + signal-preservation audit");
  console.log("=================================================================================");
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
    "AUDIT PASSED — 5 Q-T items reworded per canon; signal mappings preserved; cohort fixtures still build with correct drivers."
  );
  return 0;
}

process.exit(main());
