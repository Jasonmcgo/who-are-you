// CC-094 — Q-P2 Gradient Refinement audit.
//
// Five assertions per the CC spec:
//   1. Q-P2 in `data/questions.ts` exposes the 4 revised gradient
//      options in the documented highest-integrity → lowest order.
//   2. Q-P2 in `data/questions.ts` no longer carries the two pre-CC
//      labels ("Hide it from work" + "Don't volunteer it") that were
//      indistinguishable in users' heads.
//   3. Legacy Q-P2 answer strings ("Hide it from work" / "Don't
//      volunteer it") are still accepted by the engine and emit the
//      same signals they did pre-CC (backward compatibility — no DB
//      migration required).
//   4. New synthetic fixture (qp2-express-carefully-daniel) — Daniel-
//      shape with Q-P2 = "Express it carefully at work" — emits the
//      `holds_internal_conviction` signal and routes its Conviction
//      card to an Integrity-supported GiftCategory (not the relational
//      Harmony fallback).
//   5. Regression: same Daniel-shape base with Q-P2 = "Accept the
//      risk" still routes Conviction = Integrity. Confirms the
//      relabel + legacy remap didn't disturb the canonical high-
//      conviction path.
//
// Per CC-094 Item 3 (canon-faithful interpretation flagged in the
// CC report): the four Q-P2 signals (high_conviction_under_risk /
// holds_internal_conviction / hides_belief / adapts_under_economic_
// pressure) are PRESERVED, not consolidated. The audit therefore
// verifies that the gradient is surfaced via labels alone — engine
// math is unchanged.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// CC-138.2 — audit operates on the full bank including legacy Q-T defs.
import { allQuestions as questions } from "../../data/questions";
import {
  buildInnerConstitution,
  deriveSignals,
  pickGiftCategoryForCard,
} from "../../lib/identityEngine";
import type {
  Answer,
  DemographicSet,
  GiftCategory,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = join(__dirname, "..", "..");
const FIXTURE_PATH = join(
  REPO,
  "tests",
  "fixtures",
  "cohort",
  "qp2-express-carefully-daniel.json"
);

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

const EXPECTED_QP2_OPTIONS: ReadonlyArray<{ label: string; signal: string }> = [
  { label: "Accept the risk", signal: "high_conviction_under_risk" },
  { label: "Express it carefully at work", signal: "holds_internal_conviction" },
  { label: "Keep it quiet at work", signal: "hides_belief" },
  { label: "Change your position", signal: "adapts_under_economic_pressure" },
];

const LEGACY_LABELS_THAT_SHOULD_BE_GONE: ReadonlyArray<string> = [
  "Hide it from work",
  "Don't volunteer it",
];

function findQP2() {
  const q = questions.find((q) => q.question_id === "Q-P2");
  if (!q || q.type !== "forced") {
    throw new Error("Q-P2 not found or not a forced-choice question");
  }
  return q;
}

function loadFixture(): { answers: Answer[]; demographics: DemographicSet | null } {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8")) as {
    answers?: Answer[];
    demographics?: DemographicSet | null;
  };
  return {
    answers: raw.answers ?? [],
    demographics: raw.demographics ?? null,
  };
}

function findConvictionGift(constitution: InnerConstitution): GiftCategory | null {
  return constitution.shape_outputs.conviction.gift.category ?? null;
}

function runAudit(): void {
  const results: AssertionResult[] = [];

  // ── 1. Q-P2 has the 4 revised options in canonical gradient order ──
  {
    const q = findQP2();
    if (q.type !== "forced") {
      results.push({
        ok: false,
        assertion: "qp2-has-four-gradient-options-in-order",
        detail: "Q-P2 is not a forced question",
      });
    } else {
      const actual = q.options.map((o) => ({
        label: o.label,
        signal: o.signal ?? "",
      }));
      const ok =
        actual.length === EXPECTED_QP2_OPTIONS.length &&
        actual.every(
          (a, i) =>
            a.label === EXPECTED_QP2_OPTIONS[i].label &&
            a.signal === EXPECTED_QP2_OPTIONS[i].signal
        );
      results.push(
        ok
          ? {
              ok: true,
              assertion: "qp2-has-four-gradient-options-in-order",
              detail: `Q-P2 options match canonical order: ${actual.map((a) => a.label).join(" | ")}`,
            }
          : {
              ok: false,
              assertion: "qp2-has-four-gradient-options-in-order",
              detail: `expected ${JSON.stringify(EXPECTED_QP2_OPTIONS)}, got ${JSON.stringify(actual)}`,
            }
      );
    }
  }

  // ── 2. Q-P2 no longer carries both legacy labels ───────────────────
  {
    const q = findQP2();
    if (q.type !== "forced") {
      results.push({
        ok: false,
        assertion: "qp2-consolidated-legacy-labels-removed",
        detail: "Q-P2 is not a forced question",
      });
    } else {
      const labels = new Set(q.options.map((o) => o.label));
      const stillPresent = LEGACY_LABELS_THAT_SHOULD_BE_GONE.filter((l) =>
        labels.has(l)
      );
      results.push(
        stillPresent.length === 0
          ? {
              ok: true,
              assertion: "qp2-consolidated-legacy-labels-removed",
              detail: `legacy labels removed from Q-P2 options: ${LEGACY_LABELS_THAT_SHOULD_BE_GONE.join(", ")}`,
            }
          : {
              ok: false,
              assertion: "qp2-consolidated-legacy-labels-removed",
              detail: `Q-P2 still carries legacy labels: ${stillPresent.join(", ")}`,
            }
      );
    }
  }

  // ── 3. Legacy Q-P2 responses still derive the canonical signals ────
  //      Pre-CC-094 sessions stored "Hide it from work" and "Don't
  //      volunteer it" verbatim in Answer.response. The legacy-remap
  //      in signalFromAnswer must translate these to the new labels
  //      so the same signals (hides_belief, holds_internal_conviction)
  //      continue to fire.
  {
    const legacyCases: Array<{ response: string; expectedSignal: string }> = [
      { response: "Hide it from work", expectedSignal: "hides_belief" },
      { response: "Don't volunteer it", expectedSignal: "holds_internal_conviction" },
      // Sanity: the two unchanged labels still resolve.
      { response: "Accept the risk", expectedSignal: "high_conviction_under_risk" },
      { response: "Change your position", expectedSignal: "adapts_under_economic_pressure" },
      // And the new middle stop resolves.
      { response: "Express it carefully at work", expectedSignal: "holds_internal_conviction" },
      { response: "Keep it quiet at work", expectedSignal: "hides_belief" },
    ];
    const failures: string[] = [];
    for (const c of legacyCases) {
      const answers: Answer[] = [
        {
          question_id: "Q-P2",
          card_id: "pressure",
          question_text: "belief at job risk",
          type: "forced",
          response: c.response,
        } as Answer,
      ];
      const signals = deriveSignals(answers);
      const found = signals.find((s) => s.signal_id === c.expectedSignal);
      if (!found) {
        failures.push(
          `response="${c.response}" expected signal "${c.expectedSignal}" missing (got: ${signals.map((s) => s.signal_id).join(", ") || "none"})`
        );
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "legacy-qp2-responses-still-derive-canonical-signals",
            detail: `${legacyCases.length}/${legacyCases.length} response strings (legacy + new + unchanged) derive the canonical signal`,
          }
        : {
            ok: false,
            assertion: "legacy-qp2-responses-still-derive-canonical-signals",
            detail: failures.join(" | "),
          }
    );
  }

  // ── 4. Daniel-shape + "Express it carefully at work" → Integrity ───
  //      Routes Conviction-card GiftCategory to Integrity (or another
  //      Integrity-supported, non-relational-fallback category).
  {
    const { answers, demographics } = loadFixture();
    const constitution = buildInnerConstitution(answers, [], demographics);
    const conviction = findConvictionGift(constitution);
    const signals = deriveSignals(answers);
    const hasHoldsInternal = signals.some(
      (s) => s.signal_id === "holds_internal_conviction"
    );
    const ok = hasHoldsInternal && conviction === "Integrity";
    results.push(
      ok
        ? {
            ok: true,
            assertion: "express-carefully-daniel-routes-conviction-integrity",
            detail: `fixture emits holds_internal_conviction; Conviction → ${conviction}`,
          }
        : {
            ok: false,
            assertion: "express-carefully-daniel-routes-conviction-integrity",
            detail: `holds_internal_conviction emitted=${hasHoldsInternal}; Conviction → ${conviction ?? "null"} (expected Integrity)`,
          }
    );
  }

  // ── 5. Regression: same shape with Q-P2 = "Accept the risk" ────────
  //      The pre-existing canonical high-conviction path must remain
  //      stable. We mutate the fixture in-memory to set Q-P2 →
  //      "Accept the risk" and verify Conviction still routes to
  //      Integrity.
  {
    const { answers, demographics } = loadFixture();
    const mutated: Answer[] = answers.map((a) =>
      a.question_id === "Q-P2"
        ? ({ ...a, response: "Accept the risk" } as Answer)
        : a
    );
    const constitution = buildInnerConstitution(mutated, [], demographics);
    const conviction = findConvictionGift(constitution);
    const signals = deriveSignals(mutated);
    const hasHighRisk = signals.some(
      (s) => s.signal_id === "high_conviction_under_risk"
    );
    const ok = hasHighRisk && conviction === "Integrity";
    results.push(
      ok
        ? {
            ok: true,
            assertion: "accept-the-risk-daniel-routes-conviction-integrity",
            detail: `fixture emits high_conviction_under_risk; Conviction → ${conviction}`,
          }
        : {
            ok: false,
            assertion: "accept-the-risk-daniel-routes-conviction-integrity",
            detail: `high_conviction_under_risk emitted=${hasHighRisk}; Conviction → ${conviction ?? "null"} (expected Integrity)`,
          }
    );
  }

  // ── Report ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(`CC-094 Q-P2 gradient refinement: ${passed}/${results.length} assertions passing.`);
  // Suppress unused-import warning for pickGiftCategoryForCard until
  // we want to add a direct-picker probe in a follow-up CC.
  void pickGiftCategoryForCard;
  if (failed > 0) process.exit(1);
}

runAudit();
