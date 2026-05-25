// CC-175 — Player signal builder.
//
// LOAD-BEARING. The seed brief shipped a `signals.ts` keyed against
// invented constitution field paths (e.g. `player.engine.lens.
// patternReaderScore`) — none of which exist. If we re-used it, every
// tag would default to 0, every card would score 0 for everyone, and
// the engine pick would degenerate to "whoever sorts first." Every
// field path read below was confirmed in `lib/identityEngine.ts` /
// `lib/types.ts` on 2026-05-25 against the cohort-real fixtures
// (Jason/Harry/Daniel/Keith/Ashley).
//
// Verified sources (the CC-175 prompt is the source-of-truth for the
// mapping table; this file is the runtime implementation):
//   A. Cognitive-function scores — call `inferDriverFromCrossSignals`.
//   B. OCEAN intensities — `constitution.ocean?.dispositionSignalMix.
//      intensities.{openness, conscientiousness, extraversion,
//      agreeableness, emotionalReactivity}`.
//   C. Grip ids — `constitution.goalSoulGive?.grippingPull.signals[].id`
//      (NOTE: this field IS `id`, NOT `signal_id` — differs from the
//      top-level `constitution.signals[]`).
//   D. Compass values — top-level `constitution.signals[]`, matched by
//      `signal_id` (string equality), graded by `strength`
//      (high→1.0, medium→0.6, low→0.3).
//   E. Trajectory + responsibility — `.aimReading.score`,
//      `.coherenceReading.pathClass`, `.goalSoulMovement.dashboard.
//      movementStrength.descriptor`, `.responsibilityIntegration.score`,
//      `.convictionClarity.score`.

import { inferDriverFromCrossSignals } from "../../crossSignalDriverInference";
import type { InnerConstitution, Signal } from "../../types";
import type { PlayerGameSignals, TagId } from "./types";

const STRENGTH_WEIGHT: Record<Signal["strength"], number> = {
  high: 1.0,
  medium: 0.6,
  low: 0.3,
};

/** Clamp helper. Every signal in the returned vector is 0..1. */
function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/** Look up a Compass/Sacred signal by signal_id and grade by strength.
 *  Returns 0 when the signal isn't present in the constitution. */
function compassByStrength(
  constitution: InnerConstitution,
  targetSignalId: string
): number {
  const match = (constitution.signals ?? []).find(
    (s) => s.signal_id === targetSignalId
  );
  if (!match) return 0;
  return STRENGTH_WEIGHT[match.strength] ?? 0;
}

/** True iff a grip with the given id fired (curated list on
 *  `goalSoulGive.grippingPull.signals[]`). */
function gripFired(constitution: InnerConstitution, gripId: string): boolean {
  const list = constitution.goalSoulGive?.grippingPull?.signals ?? [];
  return list.some((entry) => entry.id === gripId);
}

/** Per-bucket grip credit. 0.8 when the grip id fired (curated list);
 *  +0.25 (clamp 1.0) if the chosen `gripPattern.bucket` matches the
 *  grip's canonical bucket. */
function gripCredit(
  constitution: InnerConstitution,
  gripId: string,
  bucketMatch: string
): number {
  const base = gripFired(constitution, gripId) ? 0.8 : 0;
  const bucketBonus =
    constitution.gripPattern?.bucket === bucketMatch ? 0.25 : 0;
  return clamp01(base + bucketBonus);
}

/** Movement strength descriptor → 0..1. The cohort only exercises
 *  full/long, but the mapping handles all four levels for forward-
 *  compatibility. */
function movementIntensity(descriptor: string | undefined): number {
  switch (descriptor) {
    case "full":
      return 1.0;
    case "long":
      return 0.75;
    case "moderate":
      return 0.5;
    case "short":
      return 0.25;
    default:
      return 0;
  }
}

/** Build the per-player signal vector consumed by the engine. Every
 *  entry is clamped 0..1; a tag with no measurable source is absent
 *  from the returned map (NOT set to 0) so the scorer can distinguish
 *  unmeasured from measured-low.
 *
 *  `displayName` is supplied by the caller (CC-176 will read it from
 *  the room's player roster); falls back to "Player" so unit tests can
 *  pass a raw playerId. */
export function buildPlayerGameSignals(
  constitution: InnerConstitution,
  args: { playerId: string; displayName?: string }
): PlayerGameSignals {
  const signals: Record<TagId, number> = {};
  const set = (tag: TagId, value: number) => {
    const clamped = clamp01(value);
    if (clamped > 0) signals[tag] = clamped;
  };

  // ── A. Cognitive-function scores ────────────────────────────────────
  // `inferDriverFromCrossSignals` is a pure function over the
  // constitution; it does not mutate. Throws on totally-degenerate
  // input, which we swallow → defaults all functions to 0 (no signals
  // set). Production sessions always populate enough to avoid this.
  let ni = 0,
    ne = 0,
    si = 0,
    se = 0,
    ti = 0,
    te = 0,
    fi = 0,
    fe = 0;
  try {
    const cs = inferDriverFromCrossSignals(constitution);
    ni = cs.scores.ni / 100;
    ne = cs.scores.ne / 100;
    si = cs.scores.si / 100;
    se = cs.scores.se / 100;
    ti = cs.scores.ti / 100;
    te = cs.scores.te / 100;
    fi = cs.scores.fi / 100;
    fe = cs.scores.fe / 100;
  } catch {
    // Thin-signal fallback — all function scores stay 0.
  }

  set("pattern_reader", ni);
  set("deep_seeing", ni);
  set("possibility_finder", ne);
  set("future_awareness", ne);
  set("precedent_memory", si);
  set("improviser", se);
  set("emotional_perception", se);
  set("technical_reasoning", ti);
  set("structurer", te);
  set("connector", fe);

  // ── B. OCEAN intensities ────────────────────────────────────────────
  const intensities =
    constitution.ocean?.dispositionSignalMix?.intensities ?? null;
  const openness = intensities ? intensities.openness / 100 : 0;
  const conscientiousness = intensities
    ? intensities.conscientiousness / 100
    : 0;
  const extraversion = intensities ? intensities.extraversion / 100 : 0;
  const agreeableness = intensities ? intensities.agreeableness / 100 : 0;
  const emotionalReactivity = intensities
    ? intensities.emotionalReactivity / 100
    : 0;

  // meaning_making + verbal_processing are derived after we have both
  // function scores and OCEAN intensities.
  set("meaning_making", Math.max(ni, fi));
  set("verbal_processing", Math.max(fe, extraversion));

  set("high_conscientiousness", conscientiousness);
  set("practical_order", conscientiousness);
  set("faithful_reliability", conscientiousness);
  set("perfection_pressure", conscientiousness);
  set("high_openness", openness);
  set("risk_tolerance", openness);
  set("protective_care", agreeableness);
  set("service_orientation", agreeableness);
  set("high_agreeableness_spine", Math.max(fe, agreeableness));
  set("social_warmth", extraversion);

  // ── C. Grip signals ────────────────────────────────────────────────
  set(
    "control_mastery_grip",
    gripCredit(constitution, "grips_control", "control")
  );
  set(
    "control_certainty_grip",
    gripCredit(constitution, "grips_certainty", "control")
  );
  // PROXY — no `grips_containment` exists; the "containment" register
  // overlaps strongly with `grips_control` so we reuse it. Refine later.
  set(
    "control_containment_grip",
    gripCredit(constitution, "grips_control", "control")
  );
  set("security_grip", gripCredit(constitution, "grips_security", "security"));
  set(
    "being_needed_grip",
    gripCredit(constitution, "grips_neededness", "belonging")
  );
  set(
    "belonging_approval_grip",
    gripCredit(constitution, "grips_approval", "belonging")
  );

  // ── D. Compass values / belief ─────────────────────────────────────
  set("truth_teller", compassByStrength(constitution, "truth_priority"));
  set("loyalty", compassByStrength(constitution, "loyalty_priority"));
  set("freedom_grip", compassByStrength(constitution, "freedom_priority"));
  const convictionScore =
    (constitution.convictionClarity?.score ?? 0) / 100;
  set("conviction", convictionScore);
  set("cost_bearing", convictionScore);
  const valueDomain = constitution.belief_under_tension?.value_domain ?? null;
  set(
    "faith_truth_loyalty",
    valueDomain === "truth" ||
      valueDomain === "faith" ||
      valueDomain === "loyalty"
      ? 0.8
      : 0.2
  );

  // ── E. Trajectory + responsibility ─────────────────────────────────
  set("aim_governance", (constitution.aimReading?.score ?? 0) / 100);
  set(
    "crisis_action",
    constitution.coherenceReading?.pathClass === "crisis" ? 1 : 0
  );
  set(
    "intensity",
    movementIntensity(
      constitution.goalSoulMovement?.dashboard.movementStrength.descriptor
    )
  );
  const responsibilityScore =
    (constitution.responsibilityIntegration?.score ?? 0) / 100;
  set("responsibility_load", responsibilityScore);
  // PROXY — `burden_responsibility_grip` has no clean grip id; we
  // combine responsibility load with the being_needed grip presence.
  set(
    "burden_responsibility_grip",
    responsibilityScore + (gripFired(constitution, "grips_neededness") ? 0.2 : 0)
  );

  // ── F. Proxy tags (no clean source — rough, refine later) ──────────
  // long_arc_thinking — PROXY — rough, refine later
  set("long_arc_thinking", ni);
  // discernment — PROXY — rough, refine later
  set("discernment", Math.max(ti, si));
  // emotional_containment / calm_containment — PROXY — rough, refine later.
  // CAVEAT: emotionalReactivity is a flat 59 for 4/5 cohort anchors so
  // this barely discriminates. Acceptable for MVP; flag for refinement.
  const calmness = clamp01(1 - emotionalReactivity);
  set("emotional_containment", calmness);
  set("calm_containment", calmness);
  // steadiness — PROXY — rough, refine later
  set("steadiness", (si + conscientiousness) / 2);
  // quiet_sacrifice / useful_devotion — PROXY — rough, refine later
  set("quiet_sacrifice", agreeableness);
  set("useful_devotion", agreeableness);
  // competence_mask — PROXY — rough, refine later
  set(
    "competence_mask",
    conscientiousness +
      (gripFired(constitution, "grips_control") ? 0.2 : 0)
  );
  // hidden_burden — PROXY — rough, refine later
  set("hidden_burden", gripFired(constitution, "grips_neededness") ? 0.7 : 0.2);
  // relational_repair — PROXY — rough, refine later
  set("relational_repair", Math.max(fe, agreeableness));
  // boundary_awareness — PROXY — rough, refine later
  set("boundary_awareness", ti);
  // mission_permission_grip — PROXY — rough, refine later
  set(
    "mission_permission_grip",
    constitution.gripPattern?.bucket === "purpose" ? 0.7 : 0.2
  );

  // ── G. humor_deflection — INTENTIONALLY UNMAPPED ───────────────────
  // No behavioral humor signal exists in the engine. Per the CC-175
  // prompt, the one card that originally leaned on this tag has been
  // re-tagged in `cards.ts` (its dominant tag is now `connector` —
  // room-reader register). This signals.ts NEVER sets `humor_deflection`;
  // if a future card mistakenly relies on it, the
  // `assert-no-tag-uniformly-zero` test will catch it. See `cards.ts`
  // for the resolution note.

  return {
    playerId: args.playerId,
    displayName: args.displayName ?? "Player",
    signals,
  };
}
