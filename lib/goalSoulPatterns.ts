// CC-070 — Cross-card pattern catalog (heuristic, no new signals).
//
// Three patterns sit above CC-067's quadrant placement, each gated by an
// existing-signal heuristic that approximates the spec §9 conditions
// without the `building_motive_*` signals (CC-B is still deferred).
//
//   1. Parallel Lives — fires when goalSoulGive.quadrant === 'parallel_lives'.
//      The kicker is the empty string because the existing Closing Read
//      template (CC-068 polish) already names the gap and the bridge; this
//      catalog entry exists for downstream consumers (analytics, future
//      pattern catalogs) but renders nothing additional.
//
//   2. Defensive Builder (heuristic) — fires only inside the Striving
//      quadrant when (a) compliance_drive ranks top-1 OR top-2 in Q-3C1,
//      (b) the Gripping cluster fires, (c) Vulnerability is net-negative,
//      AND (d) Soul score is thin (< 35). Spec §9 names a richer set of
//      conditions involving `building_motive_protective` /
//      `building_motive_control`; the heuristic narrows to the existing
//      signal pattern that is closest in shape — Compliance-as-protection +
//      Gripping cluster + thin Soul. The audit pass tells us how well the
//      approximation works against the fixtures.
//
//   3. Generative Builder (heuristic) — fires only inside the Give
//      quadrant when (a) goal ≥ 70 AND soul ≥ 70, (b) vulnerability ≥ 20,
//      (c) Q-E1 outward + inward both surface a generative+caring top-1,
//      AND (d) Q-S2 + Q-Ambition1 align (a Soul-line value sitting top-2
//      with a Goal-line ambition sitting top-2). Spec §9 names
//      `building_motive_present` / `building_motive_expressive` — the
//      heuristic uses the cross-axis alignment those motives would surface.
//
// Architectural rules (canon-locked):
//   - Pattern detectors are pure functions of the InnerConstitution; no
//     side effects, no I/O.
//   - Pattern kicker prose contains no engine vocabulary (Goal / Soul /
//     Vulnerability) and no engine-internal pattern names (Defensive
//     Builder / Generative Builder / Gripper / Parallel Lives).
//   - Patterns and Movement read are independent renders (spec §13.9);
//     they do not compose.

import type {
  CrossCardPattern,
  GoalSoulPatterns,
  InnerConstitution,
  Signal,
} from "./types";
import { grippingClusterFires } from "./goalSoulGive";

// ── Kicker prose constants (CC-070 placeholder; tunable) ────────────────

// Defensive Builder kicker — appended at render time as the final sentence
// of the Striving Closing Read. Stays in-register with CC-068's polish:
// "the work" / "name" register; no engine words; no engine-internal pattern
// names; soft "right now" framing per spec §9 ("a season rather than a
// shape"); ≤ 1 sentence per acceptance §AC-9.
export const DEFENSIVE_BUILDER_KICKER_PROSE =
  "Right now, building appears to be one of the ways you're holding what feels under threat — not all of why you build, but enough to name.";

// Generative Builder kicker — renders on the Path · Gait shape card. The
// Give Closing Read already lands warm (CC-068); this kicker sits on the
// card body to reinforce the synthesis read without doubling the closing.
// ≤ 1 sentence per acceptance §AC-11.
export const GENERATIVE_BUILDER_KICKER_PROSE =
  "What you build appears to be in service of who you love — the early shape of giving at scale.";

// ── Helpers ──────────────────────────────────────────────────────────────

function hasSignalAtRank(
  signals: Signal[],
  id: string,
  maxRank: number
): boolean {
  return signals.some(
    (s) =>
      s.signal_id === id && s.rank !== undefined && s.rank <= maxRank
  );
}

function rankOfSignalFromQuestion(
  signals: Signal[],
  id: string,
  questionId: string
): number | undefined {
  const s = signals.find(
    (sig) =>
      sig.signal_id === id &&
      sig.source_question_ids.includes(questionId)
  );
  return s?.rank;
}

// ── Detectors (exported for direct audit testing) ───────────────────────
//
// CC-071 — `detectParallelLives` removed. Parallel Lives is no longer a
// pattern; the asymmetric lift suppresses adjusted_soul before quadrant
// placement so the compartmentalized case lands in SE Goal-leaning, with
// the integration gap surfaced via Gripping Pull on the dashboard.

export function detectDefensiveBuilderHeuristic(
  constitution: InnerConstitution
): boolean {
  const gsg = constitution.goalSoulGive;
  if (!gsg) return false;
  if (gsg.quadrant !== "striving") return false;
  // (b) compliance_drive ranked top-1 or top-2 in Q-3C1.
  const complianceTop2 = hasSignalAtRank(
    constitution.signals,
    "compliance_drive",
    2
  );
  if (!complianceTop2) return false;
  // (c) Gripping cluster fires. The cluster uses raw Vulnerability (the
  // engine-internal score), not the post-lift adjusted value.
  if (
    !grippingClusterFires(
      constitution.signals,
      gsg.rawScores.vulnerability
    )
  ) {
    return false;
  }
  // (d) Vulnerability net-negative — raw Vulnerability composite.
  if (gsg.rawScores.vulnerability >= 0) return false;
  // (e) Soul thin — raw Soul, not adjusted (the raw value is what surfaces
  // the integration gap; the lift would otherwise mask it).
  if (gsg.rawScores.soul >= 35) return false;
  return true;
}

export function detectGenerativeBuilderHeuristic(
  constitution: InnerConstitution
): boolean {
  const gsg = constitution.goalSoulGive;
  if (!gsg) return false;
  if (gsg.quadrant !== "give") return false;
  // CC-071 — Generative Builder reads ADJUSTED Goal/Soul (post-lift). A
  // user with thin Vulnerability won't reach the give quadrant in the
  // first place; if they did, their adjusted scores would reflect that.
  if (gsg.adjustedScores.goal < 70) return false;
  if (gsg.adjustedScores.soul < 70) return false;
  // Vulnerability is the engine-internal raw composite (no adjusted form
  // exists — Vulnerability is the lift factor itself).
  if (gsg.rawScores.vulnerability < 20) return false;

  // Cross-axis Q-E1 alignment: caring top-1 in Q-E1-inward AND
  // (building OR solving) top-1 in Q-E1-outward.
  const caringTop1Inward = constitution.signals.some(
    (s) =>
      s.signal_id === "caring_energy_priority" &&
      s.rank === 1 &&
      s.source_question_ids.includes("Q-E1-inward")
  );
  if (!caringTop1Inward) return false;
  const outwardTop1Generative =
    constitution.signals.some(
      (s) =>
        (s.signal_id === "building_energy_priority" ||
          s.signal_id === "solving_energy_priority") &&
        s.rank === 1 &&
        s.source_question_ids.includes("Q-E1-outward")
    );
  if (!outwardTop1Generative) return false;

  // Cross-axis Q-S2 + Q-Ambition1 alignment: a Soul-line value (compassion /
  // mercy / family / faith) ranks top-2 in Q-S2 AND a Goal-line ambition
  // (success / legacy) ranks top-2 in Q-Ambition1.
  const soulValueTop2 = (
    [
      "compassion_priority",
      "mercy_priority",
      "family_priority",
      "faith_priority",
    ] as const
  ).some((id) => {
    const r = rankOfSignalFromQuestion(constitution.signals, id, "Q-S2");
    return r !== undefined && r <= 2;
  });
  if (!soulValueTop2) return false;
  const goalAmbitionTop2 = (
    ["success_priority", "legacy_priority"] as const
  ).some((id) => hasSignalAtRank(constitution.signals, id, 2));
  if (!goalAmbitionTop2) return false;

  return true;
}

// ── Top-level: returns GoalSoulPatterns or undefined ────────────────────

export function detectGoalSoulPatterns(
  constitution: InnerConstitution
): GoalSoulPatterns | undefined {
  if (!constitution.goalSoulGive) return undefined;
  const fired: CrossCardPattern[] = [];

  // CC-071 — Parallel Lives detection removed. The compartmentalized case
  // is now captured by the asymmetric lift (lib/goalSoulGive.ts) suppressing
  // adjusted_soul, with the dashboard's Gripping Pull score surfacing the
  // remaining integration gap.

  if (detectDefensiveBuilderHeuristic(constitution)) {
    fired.push({
      id: "defensive_builder",
      kickerProse: DEFENSIVE_BUILDER_KICKER_PROSE,
      renderTarget: "closing_read_suffix",
    });
  }
  if (detectGenerativeBuilderHeuristic(constitution)) {
    fired.push({
      id: "generative_builder",
      kickerProse: GENERATIVE_BUILDER_KICKER_PROSE,
      renderTarget: "path_gait_card",
    });
  }

  return { fired };
}

// Helper to filter the fired list by an internal id. Exported because the
// renderMirror layer reads patterns by id when composing the Striving
// Closing Read suffix.
export function findFiredPattern(
  patterns: GoalSoulPatterns | undefined,
  id: CrossCardPattern["id"]
): CrossCardPattern | undefined {
  if (!patterns) return undefined;
  return patterns.fired.find((p) => p.id === id);
}
