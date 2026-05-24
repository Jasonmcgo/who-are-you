// CC-COUPLE-2 — Obvious-or-Oblivious item bank (Mode 1).
//
// Eight items. The first six are the canonical seed verbatim from
// docs/couple-module-mvp-spec.md §3 (sourced in turn from the project
// notes' Game Modes / Question Categories sections). The final two
// (items 7 + 8) are grounded in existing engine constructs
// (LoveFlavorKey, LoveRegisterKey) and introduce NO new measured
// construct. Every item carries a `sourceSignal`.
//
// Predictors are intentionally honest about what the individual engine
// can defensibly project for this item. Three items return a real
// engine-derived option (the two grip_pattern items + the stress_posture
// item, all sourced from `InnerConstitution.gripPattern.bucket` =
// GripPatternKey). The rest return null — the resolver in
// `lib/coupleReveal.ts` routes those mismatches to Oblivious /
// Loving Misread rather than fabricating a Mirror Blind / Hidden
// Pattern read.

import type { GripPatternKey } from "./gripPattern";
import type { CoupleGameItemSpec } from "./coupleTypes";
import type { InnerConstitution } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Grip-bucket → option-id maps for the three real predictors.
//
// Source: GripPatternKey ∈ {safety, security, belonging, worth,
// recognition, control, purpose, unmapped} — computed by
// `lib/gripPattern.ts#classifyGripPattern`, surfaced on
// `InnerConstitution.gripPattern.bucket`. The maps below are the
// minimum-defensible projection of bucket → game option. Each entry
// is documented with the bucket-to-option reasoning that came from
// the bucket's `axisDistorted` / `defaultHealthyGift` definitions
// in `GRIP_PATTERN_BUCKETS` and the `renderElaborativeLabel` cases.
// `unmapped` returns null in every map — we never fabricate a
// prediction for the unmapped bucket.
// ─────────────────────────────────────────────────────────────────────

// `under_pressure_become` — Grip's posture under pressure. Each bucket
// has a characteristic stress shape that maps onto one of the eight
// posture options.
const UNDER_PRESSURE_BECOME_BY_BUCKET: Record<GripPatternKey, string | null> = {
  // safety: avoidance register (per gripPattern.ts `grips_comfort` → safety
  // routing comment: "avoidance, not collapse").
  safety: "more_avoidant",
  // security: clamps onto structure / plan / what worked.
  security: "more_controlling",
  // belonging: smooths to keep the connection intact.
  belonging: "more_agreeable",
  // worth: produce more to be worth the space. (For jasonType-rendered
  // Worth-as-Control/Mastery the answer would be "more_controlling"; the
  // generic worth read is the productivity register, so we pick the
  // bucket-level default.)
  worth: "more_productive",
  // recognition: visibility/performance pressure pushes intensity.
  recognition: "more_intense",
  // control: the bucket's name is the answer.
  control: "more_controlling",
  // purpose: mission-load shows up as intensity.
  purpose: "more_intense",
  // unmapped: no confident projection.
  unmapped: null,
};

// `grip_costs_you` — what the grip takes from the partner. Critical-leaning
// across the board (the prompt names a cost).
const GRIP_COSTS_YOU_BY_BUCKET: Record<GripPatternKey, string | null> = {
  // safety/vigilance contracts the partner's freedom.
  safety: "freedom",
  // security/structure constrains the partner's playfulness.
  security: "playfulness",
  // belonging/smoothing erases directness.
  belonging: "directness",
  // worth/always-producing churn costs the partner rest.
  worth: "rest",
  // recognition/performance pressure costs playfulness.
  recognition: "playfulness",
  // control: the partner loses freedom.
  control: "freedom",
  // purpose/mission-weight costs rest.
  purpose: "rest",
  unmapped: null,
};

// `the_thing_i_call_helping` — the thing the grip mislabels as helping.
const HELPING_BY_BUCKET: Record<GripPatternKey, string | null> = {
  // safety: rehearsing/preventing the bad outcome.
  safety: "preventing_failure",
  // security: keeping the plan intact.
  security: "controlling_the_outcome",
  // belonging: staying useful so the bond holds.
  belonging: "staying_needed",
  // worth: proving worth via the help.
  worth: "proving_worth",
  // recognition: staying visibly indispensable.
  recognition: "staying_needed",
  // control: the bucket's own register.
  control: "controlling_the_outcome",
  // purpose: building the safe container for the mission.
  purpose: "creating_safety",
  unmapped: null,
};

function readGripBucket(ic: InnerConstitution): GripPatternKey | null {
  const bucket = ic.gripPattern?.bucket;
  return bucket ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// The eight items.
// ─────────────────────────────────────────────────────────────────────

export const COUPLE_GAME_ITEMS: readonly CoupleGameItemSpec[] = [
  {
    itemId: "under_pressure_become",
    prompt: "When you are under pressure, you usually become:",
    sourceSignal: "stress_posture",
    options: [
      { id: "more_logical", label: "more logical" },
      { id: "more_quiet", label: "more quiet" },
      { id: "more_helpful", label: "more helpful" },
      { id: "more_controlling", label: "more controlling" },
      { id: "more_agreeable", label: "more agreeable" },
      { id: "more_avoidant", label: "more avoidant" },
      { id: "more_intense", label: "more intense" },
      { id: "more_productive", label: "more productive" },
    ],
    predict: (ic) => {
      const bucket = readGripBucket(ic);
      return bucket ? UNDER_PRESSURE_BECOME_BY_BUCKET[bucket] : null;
    },
  },
  {
    itemId: "need_but_dont_say",
    prompt:
      "When you are struggling, what you most want but may not ask for is:",
    sourceSignal: "hidden_need",
    options: [
      { id: "reassurance", label: "reassurance" },
      { id: "space", label: "space" },
      { id: "practical_help", label: "practical help" },
      { id: "a_plan", label: "a plan" },
      { id: "warmth", label: "warmth" },
      { id: "permission_to_stop", label: "permission to stop" },
      { id: "truth_told_gently", label: "truth told gently" },
      { id: "to_not_have_to_explain", label: "to not have to explain" },
    ],
    // No confident engine mapping yet — `hidden_need` is not a measured
    // construct on InnerConstitution.
    predict: () => null,
  },
  {
    itemId: "grip_costs_you",
    prompt:
      "When your fear takes over, you probably cost your partner:",
    sourceSignal: "grip_pattern",
    options: [
      { id: "peace", label: "peace", valence: "critical" },
      { id: "freedom", label: "freedom", valence: "critical" },
      { id: "clarity", label: "clarity", valence: "critical" },
      { id: "emotional_safety", label: "emotional safety", valence: "critical" },
      { id: "momentum", label: "momentum", valence: "critical" },
      { id: "playfulness", label: "playfulness", valence: "critical" },
      { id: "directness", label: "directness", valence: "critical" },
      { id: "rest", label: "rest", valence: "critical" },
    ],
    predict: (ic) => {
      const bucket = readGripBucket(ic);
      return bucket ? GRIP_COSTS_YOU_BY_BUCKET[bucket] : null;
    },
  },
  {
    itemId: "aim_gives_you",
    prompt: "When you are at your best, you give your partner:",
    sourceSignal: "aim",
    options: [
      { id: "stability", label: "stability", valence: "generous" },
      { id: "possibility", label: "possibility", valence: "generous" },
      { id: "warmth", label: "warmth", valence: "generous" },
      { id: "truth", label: "truth", valence: "generous" },
      { id: "courage", label: "courage", valence: "generous" },
      { id: "direction", label: "direction", valence: "generous" },
      { id: "freedom", label: "freedom", valence: "generous" },
      { id: "protection", label: "protection", valence: "generous" },
    ],
    // `aimReading.score` is a 0–100 composite, not a categorical map onto
    // these eight options. No defensible projection yet — null.
    predict: () => null,
  },
  {
    itemId: "the_thing_i_call_helping",
    prompt:
      "When you say you are helping, you may actually be:",
    sourceSignal: "grip_pattern",
    options: [
      { id: "calming_yourself", label: "calming yourself", valence: "critical" },
      { id: "preventing_failure", label: "preventing failure", valence: "neutral" },
      { id: "staying_needed", label: "staying needed", valence: "critical" },
      { id: "avoiding_conflict", label: "avoiding conflict", valence: "critical" },
      { id: "proving_worth", label: "proving worth", valence: "critical" },
      { id: "creating_safety", label: "creating safety", valence: "neutral" },
      { id: "controlling_the_outcome", label: "controlling the outcome", valence: "critical" },
      { id: "actually_helping", label: "actually helping", valence: "generous" },
    ],
    predict: (ic) => {
      const bucket = readGripBucket(ic);
      return bucket ? HELPING_BY_BUCKET[bucket] : null;
    },
  },
  {
    itemId: "under_pressure_most_need",
    prompt: "When you are under pressure, you most need:",
    sourceSignal: "hidden_need",
    options: [
      { id: "space", label: "space" },
      { id: "reassurance", label: "reassurance" },
      { id: "a_plan", label: "a plan" },
      { id: "someone_to_listen", label: "someone to listen" },
      { id: "help_solving_it", label: "help solving it" },
      {
        id: "permission_to_stop_carrying_it",
        label: "permission to stop carrying it",
      },
    ],
    predict: () => null,
  },
  {
    itemId: "you_know_partner_loves_you_when",
    prompt: "You know your partner loves you when they:",
    // Grounded in LoveFlavorKey (existing engine construct). Options track
    // the flavor enum one-to-one; predictor stays null because the engine
    // measures the SUBJECT'S love flavor, which projects onto how the
    // subject EXPRESSES love (item 8), not which gestures land for them.
    sourceSignal: "love_flavor",
    options: [
      {
        id: "remember_small_things",
        label: "remember small things",
        signalTag: "witnessing_recognition",
      },
      {
        id: "show_up_reliably",
        label: "show up reliably",
        signalTag: "commitment_loyalty",
      },
      {
        id: "make_space_for_you",
        label: "make space for you",
        signalTag: "tenderness_care",
      },
      {
        id: "champion_your_goals",
        label: "champion your goals",
        signalTag: "championing",
      },
      {
        id: "sit_with_you_in_hard_moments",
        label: "sit with you in hard moments",
        signalTag: "tenderness_care",
      },
      {
        id: "are_honest_with_you",
        label: "are honest with you",
        signalTag: "devotion_to_calling",
      },
      {
        id: "make_you_laugh",
        label: "make you laugh",
        signalTag: "fun_adventure",
      },
      {
        id: "build_something_with_you",
        label: "build something with you",
        signalTag: "building_construction",
      },
    ],
    predict: () => null,
  },
  {
    itemId: "how_you_show_love",
    prompt: "When love is steady in you, it shows up as you:",
    // Same grounding (LoveFlavorKey). Predictor is null even though the
    // engine has a top flavor — `loveMap.flavors[0].score` is a soft
    // composite, not a single-option projection. We avoid the
    // multi-option ties + score-margin guessing this would require.
    sourceSignal: "love_flavor",
    options: [
      { id: "staying", label: "staying", signalTag: "commitment_loyalty" },
      {
        id: "following_through",
        label: "following through",
        signalTag: "commitment_loyalty",
      },
      {
        id: "making_the_space",
        label: "making the space",
        signalTag: "tenderness_care",
      },
      {
        id: "naming_whats_true",
        label: "naming what's true",
        signalTag: "devotion_to_calling",
      },
      {
        id: "cheering_them_on",
        label: "cheering them on",
        signalTag: "championing",
      },
      {
        id: "sitting_with_them",
        label: "sitting with them",
        signalTag: "tenderness_care",
      },
      { id: "playing", label: "playing", signalTag: "fun_adventure" },
      {
        id: "building_together",
        label: "building together",
        signalTag: "building_construction",
      },
    ],
    predict: () => null,
  },
];

export function getCoupleGameItem(itemId: string): CoupleGameItemSpec | null {
  return COUPLE_GAME_ITEMS.find((it) => it.itemId === itemId) ?? null;
}
