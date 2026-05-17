// CC-090 — Blind Spots Panel (hypocrisy-as-shape-feature) audit.
//
// Verifies that the stated-vs-lived gap detections (formerly rendered as
// question-marked Open Tensions) have been promoted into a first-class
// "## Blind Spots" section sitting directly after the Gifts + Growth
// Edges table, with:
//
//   1. Section presence on cohort fixtures + synthetic shapes.
//   2. Detection extending beyond the legacy four Compass values
//      (Faith / Knowledge / Justice / Compassion) to at least five
//      additional values (Honor / Loyalty / Stability / Freedom /
//      Peace / Mercy / Truth).
//   3. Gradient grading producing ≥3 distinct levels across the cohort
//      (aligned / small_gap / meaningful_gap / large_gap).
//   4. Canonical "shape, not verdict" framing preserved verbatim.
//   5. Daniel-shape regression anchor: Faith named top + Q-S3-wider
//      Religious giving low produces a meaningful_gap Faith entry.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildInnerConstitution,
  detectBlindSpots,
  deriveSignals,
} from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type {
  Answer,
  BlindSpot,
  DemographicSet,
  InnerConstitution,
} from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

type CohortRow = {
  set: string;
  file: string;
  constitution: InnerConstitution;
  userMd: string;
  blindSpots: BlindSpot[];
};

function loadCohort(): CohortRow[] {
  const out: CohortRow[] = [];
  for (const dir of [
    join(ROOT, "ocean"),
    join(ROOT, "goal-soul-give"),
    join(ROOT, "cohort"),
  ]) {
    if (!existsSync(dir)) continue;
    const set = dir.endsWith("ocean")
      ? "ocean"
      : dir.endsWith("goal-soul-give")
        ? "goal-soul-give"
        : "cohort";
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      const constitution = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      const userMd = renderMirrorAsMarkdown({
        constitution,
        includeBeliefAnchor: false,
        answers: raw.answers,
        demographics: raw.demographics ?? null,
        generatedAt: new Date("2026-05-17T00:00:00Z"),
        renderMode: "user",
      });
      out.push({
        set,
        file: f,
        constitution,
        userMd,
        blindSpots: constitution.blindSpots ?? [],
      });
    }
  }
  return out;
}

// ── Synthetic shape fixtures — built directly as Answer[] rather than as
// JSON files because the prompt's reference shapes (Daniel-Faith-gap,
// fully-aligned, multi-misaligned) are not represented in the existing
// cohort. These exercise the detection paths without churning the
// fixture corpus or perturbing baselines.

function danielFaithGapAnswers(): Answer[] {
  // Faith top + Q-S3-wider Religious giving last; Q-X3-public skipped so
  // only the allocation check evaluates → 1-of-1 misaligned → meaningful_gap.
  // Matches the prompt's canonical example for the Faith probe.
  return [
    {
      question_id: "Q-S2",
      card_id: "sacred",
      question_text: "Q-S2",
      type: "ranking",
      order: ["faith", "compassion", "family", "mercy", "knowledge", "justice"],
    },
    {
      question_id: "Q-S3-wider",
      card_id: "sacred",
      question_text: "Q-S3-wider",
      type: "ranking",
      order: ["social", "companies", "nonprofits_religious"],
    },
  ];
}

function alignedShapeAnswers(): Answer[] {
  // Knowledge top + Education in top-3 trust + learning energy at rank 1 →
  // both Knowledge checks aligned → no Blind Spot entry for Knowledge.
  return [
    {
      question_id: "Q-S2",
      card_id: "sacred",
      question_text: "Q-S2",
      type: "ranking",
      order: ["knowledge", "family", "justice", "faith", "compassion", "mercy"],
    },
    {
      question_id: "Q-X3-public",
      card_id: "context",
      question_text: "Q-X3-public",
      type: "ranking",
      order: [
        "education",
        "nonprofits",
        "government_services",
        "religious",
        "government_elected",
      ],
    },
    {
      question_id: "Q-E1-inward",
      card_id: "sacred",
      question_text: "Q-E1-inward",
      type: "ranking",
      order: ["learning", "caring", "enjoying"],
    },
  ];
}

function largeGapAnswers(): Answer[] {
  // Compassion top + Non-profits outside top-3 trust + caring energy NOT
  // at rank 1 → both Compassion cross-checks misaligned → all-checks-
  // misaligned with total=2 → large_gap.
  return [
    {
      question_id: "Q-S2",
      card_id: "sacred",
      question_text: "Q-S2",
      type: "ranking",
      order: ["compassion", "family", "knowledge", "faith", "mercy", "justice"],
    },
    {
      question_id: "Q-X3-public",
      card_id: "context",
      question_text: "Q-X3-public",
      type: "ranking",
      // Non-profits at rank 4 — outside top-3.
      order: [
        "education",
        "government_services",
        "government_elected",
        "nonprofits",
        "religious",
      ],
    },
    {
      question_id: "Q-E1-inward",
      card_id: "sacred",
      question_text: "Q-E1-inward",
      type: "ranking",
      // Caring at rank 2 — not first.
      order: ["learning", "caring", "enjoying"],
    },
  ];
}

function smallGapAnswers(): Answer[] {
  // Honor top + reputation in top-3 of Q-3C2 → aligned on the single
  // Honor check, so no Honor entry. Pair with Loyalty: yourself
  // first in Q-S3-close + partner first in Q-X4-relational → only
  // one check misaligned of two → small_gap on Loyalty.
  return [
    {
      question_id: "Q-S1",
      card_id: "sacred",
      question_text: "Q-S1",
      type: "ranking",
      order: ["loyalty", "honor", "freedom", "truth", "peace", "stability"],
    },
    {
      question_id: "Q-S3-close",
      card_id: "sacred",
      question_text: "Q-S3-close",
      type: "ranking",
      // Self-spending first — misalignment.
      order: ["yourself", "family", "friends"],
    },
    {
      question_id: "Q-X4-relational",
      card_id: "context",
      question_text: "Q-X4-relational",
      type: "ranking",
      // Partner first — aligned.
      order: ["partner", "family", "friend"],
    },
  ];
}

async function runAudit(): Promise<void> {
  const cohort = loadCohort();
  const results: AssertionResult[] = [];

  // Synthetic shapes
  const daniel = buildInnerConstitution(danielFaithGapAnswers(), [], null);
  const danielBs = daniel.blindSpots ?? [];
  const aligned = buildInnerConstitution(alignedShapeAnswers(), [], null);
  const alignedBs = aligned.blindSpots ?? [];
  const large = buildInnerConstitution(largeGapAnswers(), [], null);
  const largeBs = large.blindSpots ?? [];
  const small = buildInnerConstitution(smallGapAnswers(), [], null);
  const smallBs = small.blindSpots ?? [];

  // ── 1. section-present — the "## Blind Spots" header appears in user-mode
  //      rendered output for every synthetic shape that has at least one
  //      Blind Spot entry, and never for the fully-aligned shape.
  {
    const failures: string[] = [];
    const checks: Array<[string, Answer[], boolean]> = [
      ["daniel-faith-gap", danielFaithGapAnswers(), true],
      ["aligned-shape", alignedShapeAnswers(), false],
      ["large-gap", largeGapAnswers(), true],
      ["small-gap", smallGapAnswers(), true],
    ];
    for (const [label, ans, expectSection] of checks) {
      const c = buildInnerConstitution(ans, [], null);
      const md = renderMirrorAsMarkdown({
        constitution: c,
        includeBeliefAnchor: false,
        answers: ans,
        demographics: null,
        generatedAt: new Date("2026-05-17T00:00:00Z"),
        renderMode: "user",
      });
      const hasSection = md.includes("## Blind Spots");
      if (hasSection !== expectSection) {
        failures.push(
          `${label}: expected section=${expectSection}, got ${hasSection}`
        );
      }
      // Position check: when present, section must sit between the Gifts
      // table and the cards/downstream content.
      if (hasSection) {
        const giftsIdx = md.indexOf("## Your Top Gifts and Growth Edges");
        const blindIdx = md.indexOf("## Blind Spots");
        const cardsIdx = md.indexOf("## Map — go deeper");
        if (giftsIdx < 0 || blindIdx <= giftsIdx) {
          failures.push(`${label}: Blind Spots not placed after Gifts table`);
        }
        if (cardsIdx > 0 && blindIdx > cardsIdx) {
          failures.push(`${label}: Blind Spots not placed before Map cards`);
        }
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "section-present-and-positioned",
            detail:
              "Blind Spots section renders only when entries fire, and sits between Gifts and Map sections",
          }
        : {
            ok: false,
            assertion: "section-present-and-positioned",
            detail: failures.join("; "),
          }
    );
  }

  // ── 2. detection-coverage — the probe table covers at least 5 additional
  //      Compass values beyond the legacy four. Probed by constructing
  //      one Answer[] per value with the value at Q-S1/Q-S2 rank 1 and
  //      cross-questions answered such that a Blind Spot fires.
  {
    type Probe = { label: string; answers: Answer[] };
    const probes: Probe[] = [
      // Honor — top-1 of Q-S1 + reputation at bottom of Q-3C2.
      {
        label: "Honor",
        answers: [
          {
            question_id: "Q-S1",
            card_id: "sacred",
            question_text: "Q-S1",
            type: "ranking",
            order: [
              "honor",
              "truth",
              "freedom",
              "loyalty",
              "peace",
              "stability",
            ],
          },
          {
            question_id: "Q-3C2",
            card_id: "role",
            question_text: "Q-3C2",
            type: "ranking",
            order: [
              "cost_priority",
              "coverage_priority",
              "compliance_priority",
              "goal_priority",
              "recovery_priority",
              "reputation_priority",
            ],
          },
        ],
      },
      // Loyalty — yourself first + partner first → 1 misaligned of 2.
      { label: "Loyalty", answers: smallGapAnswers() },
      // Stability — Q-X1 overwhelming.
      {
        label: "Stability",
        answers: [
          {
            question_id: "Q-S1",
            card_id: "sacred",
            question_text: "Q-S1",
            type: "ranking",
            order: [
              "stability",
              "truth",
              "freedom",
              "loyalty",
              "peace",
              "honor",
            ],
          },
          {
            question_id: "Q-X1",
            card_id: "context",
            question_text: "Q-X1",
            type: "forced",
            response: "Overwhelming or stretched",
          },
        ],
      },
      // Freedom — Q-A1 maintaining + Q-3C2 compliance at top.
      {
        label: "Freedom",
        answers: [
          {
            question_id: "Q-S1",
            card_id: "sacred",
            question_text: "Q-S1",
            type: "ranking",
            order: [
              "freedom",
              "truth",
              "stability",
              "loyalty",
              "peace",
              "honor",
            ],
          },
          {
            question_id: "Q-A1",
            card_id: "agency",
            question_text: "Q-A1",
            type: "forced",
            response: "Maintaining responsibilities",
          },
          {
            question_id: "Q-3C2",
            card_id: "role",
            question_text: "Q-3C2",
            type: "ranking",
            order: [
              "compliance_priority",
              "cost_priority",
              "coverage_priority",
              "goal_priority",
              "recovery_priority",
              "reputation_priority",
            ],
          },
        ],
      },
      // Peace — Q-O2 angry/anxious at top.
      {
        label: "Peace",
        answers: [
          {
            question_id: "Q-S1",
            card_id: "sacred",
            question_text: "Q-S1",
            type: "ranking",
            order: [
              "peace",
              "truth",
              "freedom",
              "loyalty",
              "honor",
              "stability",
            ],
          },
          {
            question_id: "Q-O2",
            card_id: "temperament",
            question_text: "Q-O2",
            type: "ranking",
            order: [
              "anger_reactivity",
              "anxious_reactivity",
              "low_reactivity_focus",
              "detached_reactivity",
              "overwhelmed_functioning",
              "hidden_reactivity",
              "avoidant_reactivity",
            ],
          },
        ],
      },
      // Truth — Q-P1 stay silent + Q-P2 hide.
      {
        label: "Truth",
        answers: [
          {
            question_id: "Q-S1",
            card_id: "sacred",
            question_text: "Q-S1",
            type: "ranking",
            order: [
              "truth",
              "freedom",
              "honor",
              "loyalty",
              "peace",
              "stability",
            ],
          },
          {
            question_id: "Q-P1",
            card_id: "pressure",
            question_text: "Q-P1",
            type: "forced",
            response: "Stay silent",
          },
          {
            question_id: "Q-P2",
            card_id: "pressure",
            question_text: "Q-P2",
            type: "forced",
            response: "Hide it from work",
          },
        ],
      },
      // Mercy — reputation top of Q-Stakes1 + performance_identity on Q-V1.
      {
        label: "Mercy",
        answers: [
          {
            question_id: "Q-S2",
            card_id: "sacred",
            question_text: "Q-S2",
            type: "ranking",
            order: [
              "mercy",
              "compassion",
              "family",
              "knowledge",
              "justice",
              "faith",
            ],
          },
          {
            question_id: "Q-Stakes1",
            card_id: "sacred",
            question_text: "Q-Stakes1",
            type: "ranking",
            order: ["reputation", "money", "job", "close_relationships", "health"],
          },
          {
            question_id: "Q-V1",
            card_id: "conviction",
            question_text: "Q-V1",
            type: "ranking",
            order: [
              "performance_identity",
              "goal_logic_explanation",
              "vulnerability_open_uncertainty",
              "sacred_belief_connection",
              "soul_beloved_named",
              "vulnerability_deflection",
            ],
          },
        ],
      },
    ];

    const firedLabels = new Set<string>();
    for (const probe of probes) {
      const signals = deriveSignals(probe.answers);
      const bs = detectBlindSpots(signals);
      const hit = bs.find((b) => b.compass_label === probe.label);
      if (hit) firedLabels.add(probe.label);
    }
    const extendedCount = firedLabels.size;
    results.push(
      extendedCount >= 5
        ? {
            ok: true,
            assertion: "detection-coverage-extended",
            detail: `${extendedCount} additional Compass values fire Blind Spot detection: ${[...firedLabels].join(", ")}`,
          }
        : {
            ok: false,
            assertion: "detection-coverage-extended",
            detail: `only ${extendedCount} additional values fire (need ≥5): ${[...firedLabels].join(", ")}`,
          }
    );
  }

  // ── 3. gradient-distribution — Blind Spots produce at least 3 distinct
  //      magnitude levels across cohort + synthetic shapes.
  {
    const observed = new Set<string>();
    const all = [...cohort.flatMap((c) => c.blindSpots)];
    all.push(...danielBs, ...largeBs, ...smallBs);
    for (const b of all) observed.add(b.magnitude);
    // "aligned" is suppressed (never surfaces as an entry); count distinct
    // surfaced magnitudes. We need at least 3 of {small_gap, meaningful_gap,
    // large_gap}.
    const surfaced = [...observed].filter((m) => m !== "aligned");
    results.push(
      surfaced.length >= 3
        ? {
            ok: true,
            assertion: "gradient-distribution",
            detail: `${surfaced.length} distinct magnitudes across cohort + synthetic: ${surfaced.join(", ")}`,
          }
        : {
            ok: false,
            assertion: "gradient-distribution",
            detail: `only ${surfaced.length} distinct magnitudes surfaced: ${surfaced.join(", ")} (need 3 of small_gap/meaningful_gap/large_gap)`,
          }
    );
  }

  // ── 4. canonical-framing — every rendered Blind Spots section contains
  //      the load-bearing canon phrase "part of your shape, not a verdict."
  {
    const failures: string[] = [];
    let checked = 0;
    const checks: Array<[string, Answer[]]> = [
      ["daniel-faith-gap", danielFaithGapAnswers()],
      ["large-gap", largeGapAnswers()],
    ];
    for (const [label, ans] of checks) {
      const c = buildInnerConstitution(ans, [], null);
      const md = renderMirrorAsMarkdown({
        constitution: c,
        includeBeliefAnchor: false,
        answers: ans,
        demographics: null,
        generatedAt: new Date("2026-05-17T00:00:00Z"),
        renderMode: "user",
      });
      const blindIdx = md.indexOf("## Blind Spots");
      if (blindIdx < 0) {
        failures.push(`${label}: missing Blind Spots section`);
        continue;
      }
      const rest = md.slice(blindIdx);
      const stopRel = rest.slice(20).search(/\n## /);
      const section = stopRel < 0 ? rest : rest.slice(0, 20 + stopRel);
      checked++;
      if (!section.includes("part of your shape, not a verdict")) {
        failures.push(
          `${label}: missing canonical "part of your shape, not a verdict" phrase`
        );
      }
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "canonical-framing-preserved",
            detail: `canonical "shape, not verdict" framing present in all ${checked} surfaced sections`,
          }
        : {
            ok: false,
            assertion: "canonical-framing-preserved",
            detail: failures.join("; "),
          }
    );
  }

  // ── 5. daniel-faith-regression-anchor — synthetic Daniel-shape (Faith
  //      top + Religious giving low) produces a Faith Blind Spot at
  //      meaningful_gap magnitude.
  {
    const faithEntry = danielBs.find((b) => b.compass_label === "Faith");
    if (!faithEntry) {
      results.push({
        ok: false,
        assertion: "daniel-faith-regression-anchor",
        detail: "Daniel-shape input produced no Faith Blind Spot entry",
      });
    } else if (faithEntry.magnitude !== "meaningful_gap") {
      results.push({
        ok: false,
        assertion: "daniel-faith-regression-anchor",
        detail: `Faith entry at magnitude=${faithEntry.magnitude} (expected meaningful_gap)`,
      });
    } else {
      results.push({
        ok: true,
        assertion: "daniel-faith-regression-anchor",
        detail: `Faith named top + Q-S3-wider Religious giving low → meaningful_gap (evidence: ${faithEntry.misaligned_signals[0]})`,
      });
    }
    // Aligned shape sanity-check: Knowledge fixture produces zero entries.
    if (alignedBs.length !== 0) {
      results.push({
        ok: false,
        assertion: "daniel-faith-regression-anchor-sanity",
        detail: `aligned-shape produced ${alignedBs.length} Blind Spot entries (expected 0): ${alignedBs.map((b) => b.compass_label).join(", ")}`,
      });
    }
  }

  // ── Report ──────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(`CC-090 hypocrisy panel: ${passed}/${results.length} assertions passing.`);
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
