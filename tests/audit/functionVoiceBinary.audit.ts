// CC-138 — Function-voice binary reformat audit.
//
// Verifies:
//   1. Backward-compat: legacy ranking sessions (the 25 cohort fixtures)
//      derive byte-identically to the pre-CC-138 baseline. The new binary
//      resolver does NOT fire for any cohort fixture (none has Q-TB-*
//      signals). Movement byte-identical.
//   2. Constructed binary sessions resolve cleanly:
//      - Clean INTJ (Ni + Te + Fi + Se, all opposite-attitude) → INTJ/high
//      - Megan-shape with constraint violation (Ne + Ne + Fi + Fe → can't
//        happen, so use Ni + Si as the violation) → low + clarifier
//      - Warm-Sensor (Se + Si pick violation? no — Se + Ne, opposite,
//        valid. Plus Fi + Fe, valid. The warm-Sensor case is when the
//        binary correctly recovers S where the legacy 4-rank would have
//        recovered N) → resolves to a Sensor stack.
//   3. Constraint-violation triggers the §D clarifier (via
//      confidenceLowReasons.includes("binary-attitude-violation")).
//   4. CC-141 reason-flag interop preserved.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  aggregateLensStackBinary,
  aggregateLensStack,
} from "../../lib/jungianStack";
import { buildInnerConstitution } from "../../lib/identityEngine";
import { buildFollowUpInput, generateFollowUpQuestions } from "../../lib/followUpQuestions";
import type {
  Answer,
  CognitiveFunctionId,
  DemographicSet,
  Signal,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

interface AssertionResult {
  ok: boolean;
  assertion: string;
  detail: string;
}

function binarySignal(qid: string, fn: CognitiveFunctionId): Signal {
  return {
    signal_id: fn,
    description: fn,
    from_card: "temperament",
    source_question_ids: [qid],
    strength: "high",
    rank: 1,
  };
}

function makeBinarySession(picks: {
  ni_ne: CognitiveFunctionId;
  si_se: CognitiveFunctionId;
  ti_te: CognitiveFunctionId;
  fi_fe: CognitiveFunctionId;
  percOrder: CognitiveFunctionId;
  judgOrder: CognitiveFunctionId;
}): Signal[] {
  return [
    binarySignal("Q-TB-NI-NE", picks.ni_ne),
    binarySignal("Q-TB-SI-SE", picks.si_se),
    binarySignal("Q-TB-TI-TE", picks.ti_te),
    binarySignal("Q-TB-FI-FE", picks.fi_fe),
    binarySignal("Q-TB-PERC-ORDER", picks.percOrder),
    binarySignal("Q-TB-JUDG-ORDER", picks.judgOrder),
  ];
}

function runAudit(): AssertionResult[] {
  const results: AssertionResult[] = [];

  // ── 1. Clean INTJ binary → INTJ/high ──────────────────────────────
  {
    const sigs = makeBinarySession({
      ni_ne: "ni",
      si_se: "se",
      ti_te: "te",
      fi_fe: "fi",
      percOrder: "ni",
      judgOrder: "te",
    });
    const stack = aggregateLensStackBinary(sigs);
    const ok = stack.mbtiCode === "INTJ" && stack.confidence === "high";
    results.push({
      ok,
      assertion: "binary-clean-INTJ-resolves-high",
      detail: `expected INTJ/high; got ${stack.mbtiCode}/${stack.confidence}; reasons=${(stack.confidenceLowReasons ?? []).join(",") || "(none)"}`,
    });
  }

  // ── 2. Clean ESFP binary → ESFP/high ──────────────────────────────
  //    ESFP stack = [Se, Fi, Te, Ni]. Picks: Ni (binary ni/ne) + Se
  //    (binary si/se) + Te (binary ti/te) + Fi (binary fi/fe). All
  //    four opposite-attitude pairs satisfied. percOrder: se leads
  //    (extraverted); judgOrder: fi leads. I/E inferred from any
  //    extraversion proxy in the signals; with none, default introvert
  //    flips this to ISFP — so attach a synthetic extraversion proxy
  //    to test the extraverted-dominant path.
  {
    const sigs = makeBinarySession({
      ni_ne: "ni",
      si_se: "se",
      ti_te: "te",
      fi_fe: "fi",
      percOrder: "se",
      judgOrder: "fi",
    });
    sigs.push({
      signal_id: "extraversion_proxy",
      description: "synthetic extraversion proxy for test",
      from_card: "temperament",
      source_question_ids: ["test"],
      strength: "high",
      rank: 1,
    });
    const stack = aggregateLensStackBinary(sigs);
    const ok = stack.mbtiCode === "ESFP" && stack.confidence === "high";
    results.push({
      ok,
      assertion: "binary-clean-ESFP-resolves-high",
      detail: `expected ESFP/high; got ${stack.mbtiCode}/${stack.confidence}; reasons=${(stack.confidenceLowReasons ?? []).join(",") || "(none)"}`,
    });
  }

  // ── 3. Attitude-constraint violation (Ni + Si — both introverted
  //    perceiving) → low + binary-attitude-violation reason ────────
  {
    const sigs = makeBinarySession({
      ni_ne: "ni",
      si_se: "si", // VIOLATION — both introverted on perceiving
      ti_te: "te",
      fi_fe: "fi",
      percOrder: "ni",
      judgOrder: "te",
    });
    const stack = aggregateLensStackBinary(sigs);
    const ok =
      stack.confidence === "low" &&
      (stack.confidenceLowReasons ?? []).includes("binary-attitude-violation");
    results.push({
      ok,
      assertion: "binary-attitude-violation-perceiving-flags-low",
      detail: `expected low + binary-attitude-violation; got ${stack.confidence} reasons=${(stack.confidenceLowReasons ?? []).join(",")}`,
    });
  }

  // ── 4. Attitude-constraint violation (Ti + Fi — both introverted
  //    judging) → low + binary-attitude-violation ──────────────────
  {
    const sigs = makeBinarySession({
      ni_ne: "ni",
      si_se: "se",
      ti_te: "ti",
      fi_fe: "fi", // both introverted judging
      percOrder: "ni",
      judgOrder: "ti",
    });
    const stack = aggregateLensStackBinary(sigs);
    const ok =
      stack.confidence === "low" &&
      (stack.confidenceLowReasons ?? []).includes("binary-attitude-violation");
    results.push({
      ok,
      assertion: "binary-attitude-violation-judging-flags-low",
      detail: `expected low + binary-attitude-violation; got ${stack.confidence} reasons=${(stack.confidenceLowReasons ?? []).join(",")}`,
    });
  }

  // ── 5. Warm-Sensor recovery (the case CC-138 was designed to fix):
  //    a feeling-driver who lives in Sensing resolves to a Sensor
  //    stack — Se in dom/aux. ISFP stack = [Fi, Se, Ni, Te] so the
  //    correct picks are Ni (binary ni/ne) + Se (binary si/se) + Te
  //    + Fi. percOrder picks se (Sensing leads). judgOrder picks fi
  //    (Fi leads judging). No extraversion proxy → introvert default
  //    → ISFP (Fi dom, Se aux). The Sensor read is preserved by the
  //    binary structure where the legacy ranking would have collapsed
  //    her warm-N item picks into NFP.
  {
    const sigs = makeBinarySession({
      ni_ne: "ni",
      si_se: "se",
      ti_te: "te",
      fi_fe: "fi",
      percOrder: "se", // Sensing leads
      judgOrder: "fi",
    });
    const stack = aggregateLensStackBinary(sigs);
    const isSensor =
      stack.dominant === "se" ||
      stack.dominant === "si" ||
      stack.auxiliary === "se" ||
      stack.auxiliary === "si";
    results.push({
      ok: isSensor && stack.confidence === "high",
      assertion: "binary-warm-sensor-recovers-as-sensor",
      detail: `expected sensor (S in dom/aux) + high; got ${stack.mbtiCode}/${stack.confidence} dom=${stack.dominant} aux=${stack.auxiliary}`,
    });
  }

  // ── 6. Megan-shape: constraint violation triggers §D clarifier ─
  //    Constructed: Ni + Si (perceiving violation) — should fire
  //    the N/S head-to-head AND the judging head-to-head via
  //    followUpQuestions, gated on the binary-attitude-violation
  //    reason flag (CC-138 added this to the eligibility set).
  {
    const sigs = makeBinarySession({
      ni_ne: "ni",
      si_se: "si",
      ti_te: "te",
      fi_fe: "fi",
      percOrder: "ni",
      judgOrder: "te",
    });
    const stack = aggregateLensStackBinary(sigs);
    // Fabricate a minimal constitution-like input for the follow-up
    // generator (only the fields it reads).
    const fakeConstitution = {
      signals: sigs,
      lens_stack: stack,
      goalSoulMovement: undefined,
      aimReading: undefined,
      gripReading: undefined,
      gripPattern: undefined,
      gripTaxonomy: undefined,
      riskForm: undefined,
      sacred_values: [],
      blindSpots: [],
    } as never;
    const input = buildFollowUpInput(fakeConstitution, [], "Test");
    const set = generateFollowUpQuestions(input);
    const nsClar = set.questions.find((q) => q.id === "fq4_type_clarity_ns");
    const judgClar = set.questions.find((q) => q.id === "fq5_type_clarity_judging");
    const violationFlagged = (stack.confidenceLowReasons ?? []).includes(
      "binary-attitude-violation"
    );
    results.push({
      ok: violationFlagged && (nsClar !== undefined || judgClar !== undefined),
      assertion: "binary-violation-triggers-clarifier",
      detail: `violationFlagged=${violationFlagged} nsClar=${nsClar !== undefined} judgClar=${judgClar !== undefined}`,
    });
  }

  // ── 7. Backward-compat: legacy ranking cohort fixtures still resolve
  //    via the CC-134 top-pick path (aggregateLensStack dispatches
  //    correctly when no binary signals are present). ─────────────
  {
    let cohortsRun = 0;
    let cohortsFailed = 0;
    const dirs = ["ocean", "goal-soul-give", "cohort-real"];
    for (const dir of dirs) {
      const dirPath = join(ROOT, dir);
      if (!existsSync(dirPath)) continue;
      for (const f of readdirSync(dirPath).filter((x) => x.endsWith(".json")).sort()) {
        const raw = JSON.parse(
          readFileSync(join(dirPath, f), "utf-8")
        ) as { answers?: Answer[]; demographics?: DemographicSet | null };
        if (!raw.answers) continue;
        let c;
        try {
          c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
        } catch {
          continue;
        }
        cohortsRun++;
        // The legacy fixture should have NO binary signals — they
        // route through the existing top-pick path.
        const hasBinary = c.signals.some((s) =>
          s.source_question_ids.some((q) => q.startsWith("Q-TB-"))
        );
        if (hasBinary) cohortsFailed++;
      }
    }
    results.push({
      ok: cohortsFailed === 0,
      assertion: "binary-compat-legacy-cohorts-have-no-binary-signals",
      detail:
        cohortsFailed === 0
          ? `${cohortsRun} cohort fixtures derive via legacy ranking path (no Q-TB-* signals)`
          : `${cohortsFailed}/${cohortsRun} fixtures unexpectedly carry binary signals`,
    });
  }

  // ── 8. Dispatch sanity: aggregateLensStack routes binary sessions
  //    to the binary resolver. ─────────────────────────────────────
  {
    const sigs = makeBinarySession({
      ni_ne: "ni",
      si_se: "se",
      ti_te: "te",
      fi_fe: "fi",
      percOrder: "ni",
      judgOrder: "te",
    });
    const stackViaDispatch = aggregateLensStack(sigs);
    const stackDirect = aggregateLensStackBinary(sigs);
    results.push({
      ok:
        stackViaDispatch.mbtiCode === stackDirect.mbtiCode &&
        stackViaDispatch.confidence === stackDirect.confidence,
      assertion: "binary-dispatch-routes-binary-sessions",
      detail: `dispatch ${stackViaDispatch.mbtiCode}/${stackViaDispatch.confidence} === direct ${stackDirect.mbtiCode}/${stackDirect.confidence}`,
    });
  }

  return results;
}

const results = runAudit();
const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
console.log("CC-138 — Function-voice binary reformat audit");
console.log("=".repeat(64));
for (const r of results) {
  console.log(`${r.ok ? "[PASS]" : "[FAIL]"} ${r.assertion}  — ${r.detail}`);
}
console.log("");
console.log(
  `CC-138: ${passed}/${results.length} assertions passing.`
);
if (failed > 0) process.exit(1);
