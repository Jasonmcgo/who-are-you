// CC-175 — Room Read starter card library. ≥5 cards per Body Card
// theme, 40 cards total. Prompt copy is the product voice — kept
// verbatim from the card-seed brief. Tag sets only reference tags the
// signal builder produces (see `signals.ts`); the
// `assert-no-tag-uniformly-zero` test in `tests/games/roomRead/` is
// the runtime guard.
//
// `humor_deflection` resolution (per CC-175 §G): the engine has no
// behavioral humor signal. The single card that originally leaned on
// it (`voice_wrong_time_joke`) has been re-tagged with `connector`
// as the dominant signal (room-reader register: the read-the-room
// gift to deflect or land a beat). This is flagged in the card's
// inline comment so a future CC can refine if a real humor signal
// arrives.

import type { RoomReadCard } from "./types";

export const CARDS: RoomReadCard[] = [
  // ── LENS · Eyes (5) ───────────────────────────────────────────────
  {
    id: "lens_history_quality_control",
    theme: "lens",
    modes: ["classic"],
    prompt:
      "When the team ships, this person is checking it against every previous version of itself.",
    tags: [
      { tag: "precedent_memory", weight: 1.0 },
      { tag: "discernment", weight: 0.5 },
      { tag: "steadiness", weight: 0.4 },
    ],
  },
  {
    id: "lens_problem_behind_problem",
    theme: "lens",
    modes: ["classic"],
    prompt:
      "Whoever sees what the actual problem is — not the one being discussed.",
    tags: [
      { tag: "pattern_reader", weight: 1.0 },
      { tag: "deep_seeing", weight: 0.6 },
      { tag: "long_arc_thinking", weight: 0.4 },
    ],
  },
  {
    id: "lens_signal_in_the_noise",
    theme: "lens",
    modes: ["classic"],
    prompt:
      "Reads the room a beat before everyone else — and almost never says what they saw.",
    tags: [
      { tag: "deep_seeing", weight: 0.9 },
      { tag: "emotional_containment", weight: 0.5 },
      { tag: "boundary_awareness", weight: 0.4 },
    ],
  },
  {
    id: "lens_future_branches",
    theme: "lens",
    modes: ["classic"],
    prompt:
      "Has already lived through three possible versions of this conversation before it started.",
    tags: [
      { tag: "possibility_finder", weight: 1.0 },
      { tag: "future_awareness", weight: 0.7 },
      { tag: "long_arc_thinking", weight: 0.3 },
    ],
  },
  {
    id: "lens_present_moment",
    theme: "lens",
    modes: ["classic"],
    prompt:
      "Notices the actual chair, actual coffee, actual person — while everyone else is in their head.",
    tags: [
      { tag: "improviser", weight: 0.9 },
      { tag: "emotional_perception", weight: 0.6 },
    ],
  },

  // ── COMPASS · Heart (5) ───────────────────────────────────────────
  {
    id: "compass_loyalty_keeper",
    theme: "compass",
    modes: ["classic"],
    prompt:
      "Will show up for the same people for the next thirty years without renegotiating the terms.",
    tags: [
      { tag: "loyalty", weight: 1.0 },
      { tag: "steadiness", weight: 0.6 },
      { tag: "faithful_reliability", weight: 0.5 },
    ],
  },
  {
    id: "compass_truth_teller",
    theme: "compass",
    modes: ["classic"],
    prompt:
      "Will say the uncomfortable thing in the room, even when nobody asked.",
    tags: [
      { tag: "truth_teller", weight: 1.0 },
      { tag: "conviction", weight: 0.7 },
      { tag: "cost_bearing", weight: 0.4 },
    ],
  },
  {
    id: "compass_freedom_anchor",
    theme: "compass",
    modes: ["classic"],
    prompt:
      "Would rather be misunderstood and free than understood and obligated.",
    tags: [
      { tag: "freedom_grip", weight: 1.0 },
      { tag: "high_openness", weight: 0.4 },
      { tag: "boundary_awareness", weight: 0.3 },
    ],
  },
  {
    id: "compass_faith_truth_loyalty",
    theme: "compass",
    modes: ["classic"],
    prompt:
      "Carries one big idea that the rest of life arranges itself around.",
    tags: [
      { tag: "faith_truth_loyalty", weight: 1.0 },
      { tag: "conviction", weight: 0.6 },
      { tag: "long_arc_thinking", weight: 0.3 },
    ],
  },
  {
    id: "compass_protective_care",
    theme: "compass",
    modes: ["classic"],
    prompt:
      "Has a private list of people they are quietly responsible for, and it gets longer every year.",
    tags: [
      { tag: "protective_care", weight: 1.0 },
      { tag: "useful_devotion", weight: 0.5 },
      { tag: "quiet_sacrifice", weight: 0.4 },
    ],
  },

  // ── HANDS · Craft (5) ─────────────────────────────────────────────
  {
    id: "hands_makes_the_thing",
    theme: "hands",
    modes: ["classic"],
    prompt:
      "The one who actually builds the thing while the rest of the room is still arguing about whether to build it.",
    tags: [
      { tag: "practical_order", weight: 1.0 },
      { tag: "high_conscientiousness", weight: 0.6 },
      { tag: "structurer", weight: 0.4 },
    ],
  },
  {
    id: "hands_hides_in_the_work",
    theme: "hands",
    modes: ["classic"],
    prompt:
      "When the rest of life gets heavy, this is the one who quietly disappears into the work.",
    tags: [
      { tag: "competence_mask", weight: 1.0 },
      { tag: "hidden_burden", weight: 0.6 },
      { tag: "control_mastery_grip", weight: 0.4 },
    ],
  },
  {
    id: "hands_useful_devotion",
    theme: "hands",
    modes: ["classic"],
    prompt:
      "Their love language is showing up at 7am to help you move the couch.",
    tags: [
      { tag: "useful_devotion", weight: 1.0 },
      { tag: "protective_care", weight: 0.5 },
      { tag: "faithful_reliability", weight: 0.4 },
    ],
  },
  {
    id: "hands_mission_permission",
    theme: "hands",
    modes: ["classic"],
    prompt:
      "Only feels rested when the work has a real reason. Hobbies make them itchy.",
    tags: [
      { tag: "mission_permission_grip", weight: 1.0 },
      { tag: "conviction", weight: 0.4 },
      { tag: "perfection_pressure", weight: 0.3 },
    ],
  },
  {
    id: "hands_perfection_pressure",
    theme: "hands",
    modes: ["classic"],
    prompt:
      "Has rewritten the email at least four times before sending it.",
    tags: [
      { tag: "perfection_pressure", weight: 1.0 },
      { tag: "high_conscientiousness", weight: 0.6 },
      { tag: "competence_mask", weight: 0.4 },
    ],
  },

  // ── VOICE · Speak (5) ─────────────────────────────────────────────
  {
    id: "voice_will_say_it",
    theme: "voice",
    modes: ["classic"],
    prompt:
      "If the room is collectively avoiding a sentence, this is the one who eventually says it out loud.",
    tags: [
      { tag: "truth_teller", weight: 1.0 },
      { tag: "conviction", weight: 0.6 },
      { tag: "cost_bearing", weight: 0.5 },
    ],
  },
  {
    id: "voice_translator",
    theme: "voice",
    modes: ["classic"],
    prompt:
      "Can re-state what someone meant better than they said it themselves.",
    tags: [
      { tag: "connector", weight: 0.9 },
      { tag: "verbal_processing", weight: 0.6 },
      { tag: "relational_repair", weight: 0.4 },
    ],
  },
  {
    id: "voice_wrong_time_joke",
    theme: "voice",
    modes: ["classic"],
    prompt:
      "Will land the exact right joke at the exact wrong moment — and somehow it's the right call.",
    // CC-175 §G — `humor_deflection` has no behavioral signal in the
    // engine. Re-tagged: `connector` (room-reader register —
    // reading the moment, landing the beat) replaces what would have
    // been the missing humor dimension. social_warmth as supporting
    // signal. Flagged for a future refinement pass if a real humor
    // signal arrives.
    tags: [
      { tag: "connector", weight: 1.0 },
      { tag: "social_warmth", weight: 0.5 },
      { tag: "improviser", weight: 0.4 },
    ],
  },
  {
    id: "voice_holds_silence",
    theme: "voice",
    modes: ["classic"],
    prompt:
      "The one whose silence in a meeting actually means something — and everyone waits for it.",
    tags: [
      { tag: "emotional_containment", weight: 1.0 },
      { tag: "boundary_awareness", weight: 0.5 },
      { tag: "discernment", weight: 0.4 },
    ],
  },
  {
    id: "voice_repair_first",
    theme: "voice",
    modes: ["classic"],
    prompt:
      "Will go fix the relationship before they fix who was right.",
    tags: [
      { tag: "relational_repair", weight: 1.0 },
      { tag: "connector", weight: 0.6 },
      { tag: "high_agreeableness_spine", weight: 0.4 },
    ],
  },

  // ── GRAVITY · Spine (5) ───────────────────────────────────────────
  {
    id: "gravity_carries_it",
    theme: "gravity",
    modes: ["classic"],
    prompt:
      "When something breaks and nobody owns it, this is the one who picks it up without being asked.",
    tags: [
      { tag: "responsibility_load", weight: 1.0 },
      { tag: "faithful_reliability", weight: 0.5 },
      { tag: "high_conscientiousness", weight: 0.4 },
    ],
  },
  {
    id: "gravity_quiet_sacrifice",
    theme: "gravity",
    modes: ["classic"],
    prompt:
      "Made a sacrifice this year that nobody else in the room knows about.",
    tags: [
      { tag: "quiet_sacrifice", weight: 1.0 },
      { tag: "responsibility_load", weight: 0.6 },
      { tag: "hidden_burden", weight: 0.4 },
    ],
  },
  {
    id: "gravity_burden_grip",
    theme: "gravity",
    modes: ["classic"],
    prompt:
      "Their grip on being needed is doing more of the work than they'd admit.",
    tags: [
      { tag: "burden_responsibility_grip", weight: 1.0 },
      { tag: "being_needed_grip", weight: 0.6 },
      { tag: "hidden_burden", weight: 0.4 },
    ],
  },
  {
    id: "gravity_spine_for_others",
    theme: "gravity",
    modes: ["classic"],
    prompt:
      "Will hold the line for someone else who can't hold it for themselves.",
    tags: [
      { tag: "high_agreeableness_spine", weight: 1.0 },
      { tag: "protective_care", weight: 0.5 },
      { tag: "responsibility_load", weight: 0.4 },
    ],
  },
  {
    id: "gravity_competence_mask",
    theme: "gravity",
    modes: ["classic"],
    prompt:
      "Looks like they've got it handled — and the cost of that look is invisible.",
    tags: [
      { tag: "competence_mask", weight: 1.0 },
      { tag: "hidden_burden", weight: 0.6 },
      { tag: "control_mastery_grip", weight: 0.4 },
    ],
  },

  // ── TRUST · Ears (5) ──────────────────────────────────────────────
  {
    id: "trust_inner_compass",
    theme: "trust",
    modes: ["classic"],
    prompt:
      "When the experts disagree, they go back to what they already know to be true.",
    tags: [
      { tag: "conviction", weight: 1.0 },
      { tag: "precedent_memory", weight: 0.5 },
      { tag: "faith_truth_loyalty", weight: 0.4 },
    ],
  },
  {
    id: "trust_authority_skeptic",
    theme: "trust",
    modes: ["classic"],
    prompt:
      "Doesn't believe what an institution says until they've watched it deliver across a decade.",
    tags: [
      { tag: "discernment", weight: 1.0 },
      { tag: "long_arc_thinking", weight: 0.5 },
      { tag: "boundary_awareness", weight: 0.4 },
    ],
  },
  {
    id: "trust_trusted_few",
    theme: "trust",
    modes: ["classic"],
    prompt:
      "Has a list of five people whose read they trust over their own — and the list almost never changes.",
    tags: [
      { tag: "loyalty", weight: 0.8 },
      { tag: "faithful_reliability", weight: 0.6 },
      { tag: "discernment", weight: 0.5 },
    ],
  },
  {
    id: "trust_security_grip",
    theme: "trust",
    modes: ["classic"],
    prompt:
      "Trusts the budget more than the vision. Pays attention to who actually has runway.",
    tags: [
      { tag: "security_grip", weight: 1.0 },
      { tag: "practical_order", weight: 0.5 },
      { tag: "discernment", weight: 0.4 },
    ],
  },
  {
    id: "trust_approval_grip",
    theme: "trust",
    modes: ["classic"],
    prompt:
      "Their compass is calibrated by one or two people whose approval still moves the dial.",
    tags: [
      { tag: "belonging_approval_grip", weight: 1.0 },
      { tag: "high_agreeableness_spine", weight: 0.5 },
      { tag: "connector", weight: 0.4 },
    ],
  },

  // ── FIRE · Immune Response (5) ────────────────────────────────────
  {
    id: "fire_attack_dog",
    theme: "fire",
    modes: ["classic"],
    prompt:
      "When the team is threatened, this is the one who shows up with teeth.",
    tags: [
      { tag: "protective_care", weight: 1.0 },
      { tag: "conviction", weight: 0.5 },
      { tag: "cost_bearing", weight: 0.4 },
    ],
  },
  {
    id: "fire_calm_in_storm",
    theme: "fire",
    modes: ["classic"],
    prompt:
      "When the room is in chaos, their pulse stays at 68.",
    tags: [
      { tag: "calm_containment", weight: 1.0 },
      { tag: "emotional_containment", weight: 0.6 },
      { tag: "steadiness", weight: 0.4 },
    ],
  },
  {
    id: "fire_burns_for_truth",
    theme: "fire",
    modes: ["classic"],
    prompt:
      "Will lose the relationship over the thing they cannot say untrue.",
    tags: [
      { tag: "conviction", weight: 1.0 },
      { tag: "cost_bearing", weight: 0.7 },
      { tag: "truth_teller", weight: 0.5 },
    ],
  },
  {
    id: "fire_crisis_mover",
    theme: "fire",
    modes: ["classic"],
    prompt:
      "Quiet most of the time. Loud the day everything goes wrong.",
    tags: [
      { tag: "crisis_action", weight: 1.0 },
      { tag: "improviser", weight: 0.5 },
      { tag: "structurer", weight: 0.4 },
    ],
  },
  {
    id: "fire_old_plan_grip",
    theme: "fire",
    modes: ["classic"],
    prompt:
      "Under pressure, returns to whatever has worked for them before — even when the situation is new.",
    tags: [
      { tag: "control_certainty_grip", weight: 1.0 },
      { tag: "precedent_memory", weight: 0.5 },
      { tag: "steadiness", weight: 0.4 },
    ],
  },

  // ── PATH · Gait (5) ───────────────────────────────────────────────
  {
    id: "path_governed_by_aim",
    theme: "path",
    modes: ["classic"],
    prompt:
      "Has a long, quiet arc that the rest of life arranges itself around.",
    tags: [
      { tag: "aim_governance", weight: 1.0 },
      { tag: "long_arc_thinking", weight: 0.5 },
      { tag: "conviction", weight: 0.4 },
    ],
  },
  {
    id: "path_high_intensity",
    theme: "path",
    modes: ["classic"],
    prompt:
      "Their pace is the load-bearing weather in any room they're in.",
    tags: [
      { tag: "intensity", weight: 1.0 },
      { tag: "high_openness", weight: 0.4 },
      { tag: "future_awareness", weight: 0.3 },
    ],
  },
  {
    id: "path_steady_pace",
    theme: "path",
    modes: ["classic"],
    prompt:
      "The pace is the message: same week-after-week steadiness for fifteen years.",
    tags: [
      { tag: "steadiness", weight: 1.0 },
      { tag: "faithful_reliability", weight: 0.6 },
      { tag: "high_conscientiousness", weight: 0.4 },
    ],
  },
  {
    id: "path_meaning_making",
    theme: "path",
    modes: ["classic"],
    prompt:
      "Whatever they're doing this year is connected to a meaning they don't usually narrate.",
    tags: [
      { tag: "meaning_making", weight: 1.0 },
      { tag: "long_arc_thinking", weight: 0.5 },
      { tag: "conviction", weight: 0.4 },
    ],
  },
  {
    id: "path_risk_tolerance",
    theme: "path",
    modes: ["classic"],
    prompt:
      "Comfortable jumping before they're certain — and would rather be wrong than waiting.",
    tags: [
      { tag: "risk_tolerance", weight: 1.0 },
      { tag: "improviser", weight: 0.5 },
      { tag: "high_openness", weight: 0.4 },
    ],
  },
];
