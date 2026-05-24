// CC-COUPLE-2 / CC-COUPLE-4 — Obvious-or-Oblivious item bank (Mode 1).
//
// Eight items. The first six are the canonical seed verbatim from
// docs/couple-module-mvp-spec.md §3 (sourced in turn from the project
// notes' Game Modes / Question Categories sections). The final two
// (items 7 + 8) are grounded in existing engine constructs
// (LoveFlavorKey, LoveRegisterKey) and introduce NO new measured
// construct. Every item carries a `sourceSignal`.
//
// CC-COUPLE-4 — Phase 1 of the redesign in docs/obvious-oblivious-game-spec.md:
//   - Predictor coverage expanded. Each item now tries Grip first, then
//     falls back to Lens / Love / Aim per the spec's "cleanly-mappable"
//     mappings. Honest nulls preserved for items where no defensible
//     projection exists.
//   - Adjacency sets declared per item (in ADJACENCY) so the 1-pt
//     "strong-adjacent in top-3" tier in lib/coupleReveal.ts works.
//   - Per-item warm-translation copy (ITEM_TRANSLATIONS) used by the
//     reveal screen to land "you weren't wrong — you saw the outer
//     behavior, the inner read was X."
//
// CoupleGameItemSpec lives in lib/coupleTypes.ts; the data model
// (CC-COUPLE-1) is unchanged. Adjacency + translation are parallel
// consts keyed by itemId rather than additions to the spec type.

import type { GripPatternKey } from "./gripPattern";
import type { CoupleGameItemSpec } from "./coupleTypes";
import type {
  CognitiveFunctionId,
  InnerConstitution,
  LoveRegisterKey,
} from "./types";

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-5 — Deck taxonomy.
//
// Six decks from docs/obvious-oblivious-game-spec.md §"Six decks". Each
// item is tagged with exactly one deck; the API's round selector draws
// a balanced spread (one item per deck → 6 items, optional extras up
// to a cap). Surface label is the public-facing string.
// ─────────────────────────────────────────────────────────────────────

export type CoupleDeck =
  | "obvious_to_me"
  | "oblivious_to_me"
  | "love_under_aim"
  | "love_under_grip"
  | "fight_weather"
  | "secretly_needed";

export const COUPLE_DECK_ORDER: readonly CoupleDeck[] = [
  "obvious_to_me",
  "oblivious_to_me",
  "love_under_aim",
  "love_under_grip",
  "fight_weather",
  "secretly_needed",
];

export const COUPLE_DECK_LABEL: Record<CoupleDeck, string> = {
  obvious_to_me: "Obvious to Me",
  oblivious_to_me: "Oblivious to Me",
  love_under_aim: "Love Under Aim",
  love_under_grip: "Love Under Grip",
  fight_weather: "Fight Weather",
  secretly_needed: "Secretly Needed",
};

// itemId → deck. Parallel to ADJACENCY / ITEM_TRANSLATIONS so
// CoupleGameItemSpec (in lib/coupleTypes.ts) stays untouched per the
// CC-COUPLE-4 data-model protection.
export const ITEM_DECK: Record<string, CoupleDeck> = {
  // CC-COUPLE-2/4 items
  under_pressure_become: "fight_weather",
  need_but_dont_say: "secretly_needed",
  grip_costs_you: "love_under_grip",
  aim_gives_you: "love_under_aim",
  the_thing_i_call_helping: "oblivious_to_me",
  under_pressure_most_need: "secretly_needed",
  you_know_partner_loves_you_when: "love_under_aim",
  how_you_show_love: "love_under_aim",
  // CC-COUPLE-5 additions
  what_they_protect_in_argument: "obvious_to_me",
  default_question_they_ask: "obvious_to_me",
  what_im_fine_means: "oblivious_to_me",
  love_distortion_when_fear: "love_under_grip",
  first_move_when_conflict_opens: "fight_weather",
  compliment_secretly_needed: "secretly_needed",
};

export function deckOf(itemId: string): CoupleDeck | null {
  return ITEM_DECK[itemId] ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Predictor source maps (Grip → option-id, Lens → option-id, etc.).
//
// Convention: every map has one entry per source key, and a `null`
// value is the explicit "no defensible projection" answer (never a
// silent omission). The wrapper helpers (`pickByGrip`, `pickByLens`,
// `pickByLove`) return null when the engine doesn't supply the source
// signal at all — that's distinct from the "unmapped" branch.
// ─────────────────────────────────────────────────────────────────────

type GripMap = Record<GripPatternKey, string | null>;
type LensMap = Record<CognitiveFunctionId, string | null>;
type LoveMap = Record<LoveRegisterKey, string | null>;

function pickByGrip(ic: InnerConstitution, map: GripMap): string | null {
  const bucket = ic.gripPattern?.bucket;
  if (!bucket) return null;
  return map[bucket];
}
function pickByLens(ic: InnerConstitution, map: LensMap): string | null {
  const fn = ic.lens_stack?.dominant;
  if (!fn) return null;
  return map[fn];
}
function pickByLove(ic: InnerConstitution, map: LoveMap): string | null {
  const top = ic.loveMap?.matches?.[0]?.register?.register_key;
  if (!top) return null;
  return map[top];
}
// Tries predictors in order — first non-null wins. The "honest nulls"
// rule (CC-COUPLE-2 + spec) says we only fabricate when EVERY layer
// returns null.
function firstHit(
  ...candidates: (string | null)[]
): string | null {
  for (const c of candidates) {
    if (c !== null) return c;
  }
  return null;
}

// ── Item 1: under_pressure_become ────────────────────────────────────
// Stress posture. Grip primary; lens fallback for unmapped grips.
const UNDER_PRESSURE_BECOME_BY_GRIP: GripMap = {
  safety: "more_avoidant",
  security: "more_controlling",
  belonging: "more_agreeable",
  worth: "more_productive",
  recognition: "more_intense",
  control: "more_controlling",
  purpose: "more_intense",
  unmapped: null,
};
const UNDER_PRESSURE_BECOME_BY_LENS: LensMap = {
  // Fe under pressure: helps / accommodates (relational pull).
  fe: "more_helpful",
  // Fi under pressure: withdraws into private process.
  fi: "more_quiet",
  // Ti under pressure: doubles down on logic / system.
  ti: "more_logical",
  // Te under pressure: clamps execution / drives outcomes.
  te: "more_controlling",
  // Ni under pressure: gets quiet + intense (internal compression).
  ni: "more_intense",
  // Ne under pressure: branches outward / activates.
  ne: "more_intense",
  // Si under pressure: returns to what worked (productive routine).
  si: "more_productive",
  // Se under pressure: acts in the moment, often visibly forceful.
  se: "more_controlling",
};

// ── Item 3: grip_costs_you ───────────────────────────────────────────
const GRIP_COSTS_YOU_BY_GRIP: GripMap = {
  safety: "freedom",
  security: "playfulness",
  belonging: "directness",
  worth: "rest",
  recognition: "playfulness",
  control: "freedom",
  purpose: "rest",
  unmapped: null,
};
const GRIP_COSTS_YOU_BY_LENS: LensMap = {
  // Fe lens under stress smooths → erases directness.
  fe: "directness",
  // Fi lens under stress gets quiet / private → costs clarity.
  fi: "clarity",
  // Ti lens under stress over-explains → costs momentum.
  ti: "momentum",
  // Te lens under stress drives → costs freedom.
  te: "freedom",
  // Ni lens under stress brood / over-pattern → costs peace.
  ni: "peace",
  // Ne lens under stress branches → costs momentum.
  ne: "momentum",
  // Si lens under stress reverts to plan → costs playfulness.
  si: "playfulness",
  // Se lens under stress reacts → costs emotional safety.
  se: "emotional_safety",
};

// ── Item 4: aim_gives_you ────────────────────────────────────────────
// Lens-shaped gift when at one's best. (No grip mapping — this is the
// Aim side of the axis. Aim score gates: if aim is very low we soften
// to null to avoid claiming a gift the data doesn't support.)
const AIM_GIVES_YOU_BY_LENS: LensMap = {
  fe: "warmth",       // relational warmth
  fi: "truth",        // values-rooted honesty
  ti: "clarity_for_truth", // not in option set — keep null mapping below
  te: "direction",
  ni: "direction",
  ne: "possibility",
  si: "stability",
  se: "courage",
};
// Two lens cases that don't map cleanly to a single option default to null:
const AIM_GIVES_YOU_OPTION_IDS = new Set([
  "stability", "possibility", "warmth", "truth", "courage",
  "direction", "freedom", "protection",
]);

// ── Item 5: the_thing_i_call_helping ─────────────────────────────────
const HELPING_BY_GRIP: GripMap = {
  safety: "preventing_failure",
  security: "controlling_the_outcome",
  belonging: "staying_needed",
  worth: "proving_worth",
  recognition: "staying_needed",
  control: "controlling_the_outcome",
  purpose: "creating_safety",
  unmapped: null,
};
const HELPING_BY_LENS: LensMap = {
  // Fe lens conflates help with maintaining the bond.
  fe: "staying_needed",
  // Fi lens helps to honor a value internal to self.
  fi: "proving_worth",
  // Ti lens helps to keep the system coherent.
  ti: "controlling_the_outcome",
  // Te lens helps by directing.
  te: "controlling_the_outcome",
  // Ni lens helps by foresight ("preventing failure I saw coming").
  ni: "preventing_failure",
  // Ne lens helps by activating, sometimes calming self.
  ne: "calming_yourself",
  // Si lens helps by securing what worked.
  si: "creating_safety",
  // Se lens helps by acting / intervening.
  se: "controlling_the_outcome",
};

// ── Item 6: under_pressure_most_need ─────────────────────────────────
const MOST_NEED_BY_GRIP: GripMap = {
  safety: "space",
  security: "a_plan",
  belonging: "reassurance",
  worth: "permission_to_stop_carrying_it",
  recognition: "someone_to_listen",
  control: "a_plan",
  purpose: "permission_to_stop_carrying_it",
  unmapped: null,
};
const MOST_NEED_BY_LENS: LensMap = {
  fe: "reassurance",
  fi: "someone_to_listen",
  ti: "a_plan",
  te: "help_solving_it",
  ni: "space",
  ne: "help_solving_it",
  si: "space",
  se: "help_solving_it",
};

// ── Item 7: you_know_partner_loves_you_when ─────────────────────────
// LoveRegisterKey → gesture that registers as love to a person of that
// register. Engine read of what THEY (the subject) likely need to FEEL
// loved (matches the prompt direction: "you know your partner loves
// you when they:").
const LOVED_BY_REGISTER: LoveMap = {
  devoted_partner: "show_up_reliably",
  parental_heart: "sit_with_you_in_hard_moments",
  chosen_family: "are_honest_with_you",
  companion: "sit_with_you_in_hard_moments",
  belonging_heart: "build_something_with_you",
  loyalist: "are_honest_with_you",
  open_heart: "make_space_for_you",
};

// ── Item 8: how_you_show_love ────────────────────────────────────────
const SHOW_LOVE_BY_REGISTER: LoveMap = {
  devoted_partner: "staying",
  parental_heart: "making_the_space",
  chosen_family: "naming_whats_true",
  companion: "sitting_with_them",
  belonging_heart: "building_together",
  loyalist: "following_through",
  open_heart: "cheering_them_on",
};

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-5 — Predictor maps for the new items.
// ─────────────────────────────────────────────────────────────────────

// ── Item: what_they_protect_in_argument (Obvious to Me, lens-driven) ─
// What the subject lights up to defend when conflict comes. Their lens
// answers what they will not let go of in the room.
const WHAT_THEY_PROTECT_BY_LENS: LensMap = {
  ti: "accuracy",
  te: "the_plan",
  fi: "the_principle",
  fe: "the_relationship",
  ni: "the_future",
  ne: "freedom",
  si: "loyalty",
  se: "peace_in_the_room",
};

// ── Item: default_question_they_ask (Obvious to Me, lens-driven) ─────
// The mind's first-question default — what question their lens always
// asks of a situation before any other.
const DEFAULT_QUESTION_BY_LENS: LensMap = {
  ti: "is_this_true",
  te: "does_this_work",
  fi: "is_this_who_i_am",
  fe: "is_everyone_okay",
  ni: "where_does_this_end_up",
  ne: "what_else_could_this_be",
  si: "what_has_worked_before",
  se: "what_is_actually_here_right_now",
};

// ── Item: what_im_fine_means (Oblivious to Me, grip-driven) ──────────
// What the partner's "I'm fine" actually means under that grip register.
const WHAT_FINE_MEANS_BY_GRIP: GripMap = {
  safety: "needing_space",
  security: "in_the_middle_of_fixing_something",
  belonging: "needing_reassurance_you_wont_push",
  worth: "processing",
  recognition: "running_through_the_script",
  control: "in_the_middle_of_fixing_something",
  purpose: "processing",
  unmapped: null,
};
const WHAT_FINE_MEANS_BY_LENS: LensMap = {
  fe: "needing_reassurance_you_wont_push",
  fi: "needing_to_be_left_alone",
  ti: "processing",
  te: "in_the_middle_of_fixing_something",
  ni: "processing",
  ne: "in_the_middle_of_fixing_something",
  si: "needing_space",
  se: "actually_fine",
};

// ── Item: love_distortion_when_fear (Love Under Grip, grip-driven) ───
// The shape love takes when fear is loud — per spec §6 grip register
// names. Verbatim from the spec's grip register list.
const LOVE_DISTORTION_BY_GRIP: GripMap = {
  safety: "withholding",
  security: "controlling",
  belonging: "over_sacrificing",
  worth: "proving",
  recognition: "approval_seeking",
  control: "controlling",
  purpose: "over_sacrificing",
  unmapped: null,
};
// Lens fallback so this fires for unmapped-grip users too. Honest lens
// drift under fear.
const LOVE_DISTORTION_BY_LENS: LensMap = {
  fe: "over_sacrificing",
  fi: "withdrawing",
  ti: "withholding",
  te: "controlling",
  ni: "withholding",
  ne: "defiant",
  si: "over_sacrificing",
  se: "controlling",
};

// ── Item: first_move_when_conflict_opens (Fight Weather, lens-driven) ─
const FIRST_MOVE_BY_LENS: LensMap = {
  te: "argue_the_logic",
  fe: "smooth_it_over",
  fi: "withdraw_to_think",
  ti: "name_the_inconsistency",
  ni: "go_quiet_then_reframe",
  ne: "branch_into_hypotheticals",
  si: "return_to_what_worked",
  se: "get_out_of_the_room",
};

// ── Item: compliment_secretly_needed (Secretly Needed, grip-driven) ──
// The line the grip wants permission to hear. Grip bucket → the
// compliment that releases the grip's load.
const COMPLIMENT_BY_GRIP: GripMap = {
  safety: "youre_free_to_choose",
  security: "youre_allowed_to_rest",
  belonging: "you_belong_here",
  worth: "youre_enough",
  recognition: "youre_seen",
  control: "youre_trusted",
  purpose: "you_dont_have_to_prove_yourself",
  unmapped: null,
};
const COMPLIMENT_BY_LENS: LensMap = {
  // Fe needs to hear they belong without earning it.
  fe: "you_belong_here",
  // Fi needs the permission of being-seen as themselves.
  fi: "youre_seen",
  // Ti needs trust in their read.
  ti: "youre_trusted",
  // Te needs permission to put the load down.
  te: "youre_allowed_to_rest",
  // Ni needs to be seen behind the surface.
  ni: "youre_seen",
  // Ne needs the freedom-to-choose validated.
  ne: "youre_free_to_choose",
  // Si needs the steadiness validated.
  si: "youre_enough",
  // Se needs to be trusted to read the room.
  se: "youre_trusted",
};

// ─────────────────────────────────────────────────────────────────────
// The bank (14 items, 6 decks).
// ─────────────────────────────────────────────────────────────────────

export const COUPLE_GAME_ITEMS: readonly CoupleGameItemSpec[] = [
  {
    itemId: "under_pressure_become",
    prompt: "When you are under pressure, you usually become:",
    promptAboutPartner: "When {S} is under pressure, {S_pron} usually becomes:",
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
    predict: (ic) =>
      firstHit(
        pickByGrip(ic, UNDER_PRESSURE_BECOME_BY_GRIP),
        pickByLens(ic, UNDER_PRESSURE_BECOME_BY_LENS)
      ),
  },
  {
    itemId: "need_but_dont_say",
    prompt:
      "When you are struggling, what you most want but may not ask for is:",
    promptAboutPartner:
      "When {S} is struggling, what {S_pron} most wants but may not ask for is:",
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
    // No defensible single-option engine read for "what you secretly want
    // but won't ask for" — this is a self-aware diagnostic, not an engine
    // measurement. Stays null per the "honest nulls" rule; surfaces as
    // "no strong read" rather than a fabricated mapping.
    predict: () => null,
  },
  {
    itemId: "grip_costs_you",
    prompt:
      "When your fear takes over, you probably cost your partner:",
    promptAboutPartner:
      "When {S_poss} fear takes over, {S_pron} probably costs you:",
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
    predict: (ic) =>
      firstHit(
        pickByGrip(ic, GRIP_COSTS_YOU_BY_GRIP),
        pickByLens(ic, GRIP_COSTS_YOU_BY_LENS)
      ),
  },
  {
    itemId: "aim_gives_you",
    prompt: "When you are at your best, you give your partner:",
    promptAboutPartner: "When {S} is at {S_poss} best, {S_pron} gives you:",
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
    predict: (ic) => {
      const lensPick = pickByLens(ic, AIM_GIVES_YOU_BY_LENS);
      // Some lens picks don't map onto the canonical option set (e.g.
      // Ti's "clarity_for_truth" placeholder). Filter out anything that
      // isn't a real option — better to return null than to surface a
      // bogus id the UI can't render.
      if (lensPick && AIM_GIVES_YOU_OPTION_IDS.has(lensPick)) return lensPick;
      return null;
    },
  },
  {
    itemId: "the_thing_i_call_helping",
    prompt:
      "When you say you are helping, you may actually be:",
    promptAboutPartner:
      "When {S} says {S_pron} is helping, {S_pron} may actually be:",
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
    predict: (ic) =>
      firstHit(
        pickByGrip(ic, HELPING_BY_GRIP),
        pickByLens(ic, HELPING_BY_LENS)
      ),
  },
  {
    itemId: "under_pressure_most_need",
    prompt: "When you are under pressure, you most need:",
    promptAboutPartner:
      "When {S} is under pressure, what {S_pron} most needs is:",
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
    predict: (ic) =>
      firstHit(
        pickByGrip(ic, MOST_NEED_BY_GRIP),
        pickByLens(ic, MOST_NEED_BY_LENS)
      ),
  },
  {
    itemId: "you_know_partner_loves_you_when",
    prompt: "You know your partner loves you when they:",
    // {S_obj} (object pronoun: her / him / them) — distinct from {S_pron}
    // (subject pronoun: she / he / they) because "love she" is broken English.
    promptAboutPartner: "{S} knows you love {S_obj} when you:",
    sourceSignal: "love_register",
    options: [
      { id: "remember_small_things", label: "remember small things", signalTag: "witnessing_recognition" },
      { id: "show_up_reliably", label: "show up reliably", signalTag: "commitment_loyalty" },
      { id: "make_space_for_you", label: "make space for you", signalTag: "tenderness_care" },
      { id: "champion_your_goals", label: "champion your goals", signalTag: "championing" },
      { id: "sit_with_you_in_hard_moments", label: "sit with you in hard moments", signalTag: "tenderness_care" },
      { id: "are_honest_with_you", label: "are honest with you", signalTag: "devotion_to_calling" },
      { id: "make_you_laugh", label: "make you laugh", signalTag: "fun_adventure" },
      { id: "build_something_with_you", label: "build something with you", signalTag: "building_construction" },
    ],
    predict: (ic) => pickByLove(ic, LOVED_BY_REGISTER),
  },
  {
    itemId: "how_you_show_love",
    prompt: "When love is steady in you, it shows up as you:",
    promptAboutPartner: "When love is steady in {S}, it shows up as {S_obj}:",
    sourceSignal: "love_register",
    options: [
      { id: "staying", label: "staying", signalTag: "commitment_loyalty" },
      { id: "following_through", label: "following through", signalTag: "commitment_loyalty" },
      { id: "making_the_space", label: "making the space", signalTag: "tenderness_care" },
      { id: "naming_whats_true", label: "naming what's true", signalTag: "devotion_to_calling" },
      { id: "cheering_them_on", label: "cheering them on", signalTag: "championing" },
      { id: "sitting_with_them", label: "sitting with them", signalTag: "tenderness_care" },
      { id: "playing", label: "playing", signalTag: "fun_adventure" },
      { id: "building_together", label: "building together", signalTag: "building_construction" },
    ],
    predict: (ic) => pickByLove(ic, SHOW_LOVE_BY_REGISTER),
  },
  // ── CC-COUPLE-5 additions ──────────────────────────────────────────
  {
    itemId: "what_they_protect_in_argument",
    prompt: "When you are in an argument, what you most protect is:",
    promptAboutPartner:
      "When {S} is in an argument, what {S_pron} most protects is:",
    sourceSignal: "lens_protection",
    options: [
      { id: "accuracy", label: "accuracy" },
      { id: "the_plan", label: "the plan" },
      { id: "the_principle", label: "the principle" },
      { id: "the_relationship", label: "the relationship" },
      { id: "the_future", label: "the future" },
      { id: "freedom", label: "freedom" },
      { id: "loyalty", label: "loyalty" },
      { id: "peace_in_the_room", label: "peace in the room" },
    ],
    predict: (ic) => pickByLens(ic, WHAT_THEY_PROTECT_BY_LENS),
  },
  {
    itemId: "default_question_they_ask",
    prompt: "The question your mind most often asks first is:",
    promptAboutPartner: "The question {S_poss} mind most often asks first is:",
    sourceSignal: "lens_default_question",
    options: [
      { id: "is_this_true", label: "is this true?" },
      { id: "does_this_work", label: "does this work?" },
      { id: "is_this_who_i_am", label: "is this who I am?" },
      { id: "is_everyone_okay", label: "is everyone okay?" },
      { id: "where_does_this_end_up", label: "where does this end up?" },
      { id: "what_else_could_this_be", label: "what else could this be?" },
      { id: "what_has_worked_before", label: "what has worked before?" },
      { id: "what_is_actually_here_right_now", label: "what is actually here right now?" },
    ],
    predict: (ic) => pickByLens(ic, DEFAULT_QUESTION_BY_LENS),
  },
  {
    itemId: "what_im_fine_means",
    prompt: "When you say \"I'm fine,\" what you usually mean is:",
    promptAboutPartner:
      "When {S} says \"I'm fine,\" what {S_pron} usually means is:",
    sourceSignal: "grip_register",
    options: [
      { id: "processing", label: "processing" },
      { id: "needing_space", label: "needing space" },
      { id: "needing_to_be_left_alone", label: "needing to be left alone" },
      { id: "needing_reassurance_you_wont_push", label: "needing reassurance you won't push" },
      { id: "in_the_middle_of_fixing_something", label: "in the middle of fixing something" },
      { id: "running_through_the_script", label: "running through the script" },
      { id: "actually_fine", label: "actually fine", valence: "generous" },
      { id: "overwhelmed_and_wont_say", label: "overwhelmed and won't say", valence: "critical" },
    ],
    predict: (ic) =>
      firstHit(
        pickByGrip(ic, WHAT_FINE_MEANS_BY_GRIP),
        pickByLens(ic, WHAT_FINE_MEANS_BY_LENS)
      ),
  },
  {
    itemId: "love_distortion_when_fear",
    prompt: "When fear is loud in you, your love turns into:",
    promptAboutPartner: "When fear is loud in {S}, {S_poss} love turns into:",
    sourceSignal: "grip_pattern",
    options: [
      { id: "controlling", label: "controlling", valence: "critical" },
      { id: "rescuing", label: "rescuing", valence: "neutral" },
      { id: "approval_seeking", label: "approval-seeking", valence: "critical" },
      { id: "withholding", label: "withholding", valence: "critical" },
      { id: "proving", label: "proving", valence: "critical" },
      { id: "over_sacrificing", label: "over-sacrificing", valence: "critical" },
      { id: "defiant", label: "defiant", valence: "critical" },
      { id: "withdrawing", label: "withdrawing", valence: "critical" },
    ],
    predict: (ic) =>
      firstHit(
        pickByGrip(ic, LOVE_DISTORTION_BY_GRIP),
        pickByLens(ic, LOVE_DISTORTION_BY_LENS)
      ),
  },
  {
    itemId: "first_move_when_conflict_opens",
    prompt: "When a real conflict opens, your first move is to:",
    promptAboutPartner: "When a real conflict opens, {S_poss} first move is to:",
    sourceSignal: "lens_conflict_move",
    options: [
      { id: "argue_the_logic", label: "argue the logic" },
      { id: "smooth_it_over", label: "smooth it over" },
      { id: "withdraw_to_think", label: "withdraw to think" },
      { id: "name_the_inconsistency", label: "name the inconsistency" },
      { id: "go_quiet_then_reframe", label: "go quiet, then reframe" },
      { id: "branch_into_hypotheticals", label: "branch into hypotheticals" },
      { id: "return_to_what_worked", label: "return to what worked" },
      { id: "get_out_of_the_room", label: "get out of the room" },
    ],
    predict: (ic) => pickByLens(ic, FIRST_MOVE_BY_LENS),
  },
  {
    itemId: "compliment_secretly_needed",
    prompt: "The compliment that secretly lands hardest for you is:",
    promptAboutPartner:
      "The compliment that secretly lands hardest for {S} is:",
    sourceSignal: "grip_pattern",
    options: [
      { id: "you_belong_here", label: "\"You belong here.\"" },
      { id: "youre_enough", label: "\"You're enough.\"" },
      { id: "youre_seen", label: "\"You're seen.\"" },
      { id: "youre_trusted", label: "\"You're trusted.\"" },
      { id: "youre_allowed_to_rest", label: "\"You're allowed to rest.\"" },
      { id: "youre_free_to_choose", label: "\"You're free to choose.\"" },
      { id: "you_dont_have_to_prove_yourself", label: "\"You don't have to prove yourself.\"" },
      { id: "i_see_how_hard_you_worked", label: "\"I see how hard you worked.\"" },
    ],
    predict: (ic) =>
      firstHit(
        pickByGrip(ic, COMPLIMENT_BY_GRIP),
        pickByLens(ic, COMPLIMENT_BY_LENS)
      ),
  },
];

export function getCoupleGameItem(itemId: string): CoupleGameItemSpec | null {
  return COUPLE_GAME_ITEMS.find((it) => it.itemId === itemId) ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-4 — Adjacency.
//
// For each item, a Record<predictedOptionId, optionId[]> where the value
// is the set of options considered "strong adjacent" to that prediction
// — guesses that land in that set (in top-3) earn the 1-pt tier in the
// resolver. Adjacency is per-prediction (not per-option) because what
// counts as "close to control" is different from what counts as "close
// to belonging."
//
// Two-sided closeness should be encoded twice (A adjacent to B AND B
// adjacent to A). The maps below are the seed set — easy to widen later
// once the cohort tells us where partner guesses cluster.
// ─────────────────────────────────────────────────────────────────────

export const ADJACENCY: Record<string, Record<string, string[]>> = {
  under_pressure_become: {
    more_controlling: ["more_productive", "more_intense"],
    more_productive: ["more_controlling", "more_intense"],
    more_intense: ["more_controlling", "more_productive", "more_quiet"],
    more_quiet: ["more_avoidant", "more_intense"],
    more_avoidant: ["more_quiet", "more_agreeable"],
    more_helpful: ["more_agreeable", "more_productive"],
    more_agreeable: ["more_helpful", "more_avoidant"],
    more_logical: ["more_quiet"],
  },
  grip_costs_you: {
    freedom: ["playfulness", "rest"],
    playfulness: ["freedom", "rest"],
    rest: ["peace", "playfulness"],
    peace: ["rest", "emotional_safety"],
    emotional_safety: ["peace", "directness"],
    directness: ["clarity", "emotional_safety"],
    clarity: ["directness", "momentum"],
    momentum: ["clarity", "freedom"],
  },
  the_thing_i_call_helping: {
    controlling_the_outcome: ["preventing_failure", "proving_worth"],
    preventing_failure: ["controlling_the_outcome", "creating_safety"],
    staying_needed: ["avoiding_conflict", "proving_worth", "calming_yourself"],
    avoiding_conflict: ["staying_needed", "calming_yourself"],
    proving_worth: ["controlling_the_outcome", "staying_needed"],
    creating_safety: ["preventing_failure", "controlling_the_outcome"],
    calming_yourself: ["avoiding_conflict", "staying_needed"],
    actually_helping: ["creating_safety", "preventing_failure"],
  },
  aim_gives_you: {
    stability: ["protection", "direction"],
    protection: ["stability", "courage"],
    direction: ["stability", "truth", "courage"],
    warmth: ["stability", "freedom"],
    truth: ["direction", "courage", "clarity"],
    courage: ["truth", "direction"],
    possibility: ["freedom", "courage"],
    freedom: ["possibility", "warmth"],
  },
  under_pressure_most_need: {
    space: ["permission_to_stop_carrying_it", "someone_to_listen"],
    reassurance: ["someone_to_listen", "permission_to_stop_carrying_it"],
    a_plan: ["help_solving_it"],
    help_solving_it: ["a_plan", "someone_to_listen"],
    someone_to_listen: ["reassurance", "space"],
    permission_to_stop_carrying_it: ["space", "reassurance"],
  },
  you_know_partner_loves_you_when: {
    show_up_reliably: ["sit_with_you_in_hard_moments", "build_something_with_you"],
    sit_with_you_in_hard_moments: ["show_up_reliably", "make_space_for_you"],
    are_honest_with_you: ["champion_your_goals", "make_space_for_you"],
    make_space_for_you: ["sit_with_you_in_hard_moments", "are_honest_with_you"],
    build_something_with_you: ["show_up_reliably", "champion_your_goals"],
    champion_your_goals: ["build_something_with_you", "are_honest_with_you"],
    make_you_laugh: ["champion_your_goals", "remember_small_things"],
    remember_small_things: ["sit_with_you_in_hard_moments", "make_you_laugh"],
  },
  how_you_show_love: {
    staying: ["following_through", "sitting_with_them"],
    following_through: ["staying", "building_together"],
    making_the_space: ["sitting_with_them", "staying"],
    naming_whats_true: ["cheering_them_on", "following_through"],
    cheering_them_on: ["naming_whats_true", "building_together"],
    sitting_with_them: ["staying", "making_the_space"],
    playing: ["cheering_them_on", "making_the_space"],
    building_together: ["following_through", "cheering_them_on"],
  },
  // ── CC-COUPLE-5 adjacency ─────────────────────────────────────────
  // Lens-driven items use cognitive-function neighbor logic: same-axis
  // siblings (Ti↔Te, Fi↔Fe, Ni↔Ne, Si↔Se), same-attitude introverts
  // (Ti/Fi/Ni/Si), and same-attitude extroverts (Te/Fe/Ne/Se). Adjacency
  // is then the items the neighboring functions predict.
  what_they_protect_in_argument: {
    accuracy: ["the_principle", "the_plan"],
    the_plan: ["accuracy", "loyalty"],
    the_principle: ["accuracy", "loyalty"],
    the_relationship: ["peace_in_the_room", "loyalty"],
    the_future: ["the_plan", "the_principle"],
    freedom: ["the_future", "peace_in_the_room"],
    loyalty: ["the_relationship", "the_plan"],
    peace_in_the_room: ["the_relationship", "freedom"],
  },
  default_question_they_ask: {
    is_this_true: ["does_this_work", "is_this_who_i_am"],
    does_this_work: ["is_this_true", "what_has_worked_before"],
    is_this_who_i_am: ["is_this_true", "is_everyone_okay"],
    is_everyone_okay: ["is_this_who_i_am", "what_is_actually_here_right_now"],
    where_does_this_end_up: ["what_else_could_this_be", "does_this_work"],
    what_else_could_this_be: ["where_does_this_end_up", "what_is_actually_here_right_now"],
    what_has_worked_before: ["does_this_work", "what_is_actually_here_right_now"],
    what_is_actually_here_right_now: ["what_has_worked_before", "is_everyone_okay"],
  },
  what_im_fine_means: {
    processing: ["needing_space", "in_the_middle_of_fixing_something"],
    needing_space: ["processing", "needing_to_be_left_alone"],
    needing_to_be_left_alone: ["needing_space", "overwhelmed_and_wont_say"],
    needing_reassurance_you_wont_push: ["needing_space", "overwhelmed_and_wont_say"],
    in_the_middle_of_fixing_something: ["processing", "running_through_the_script"],
    running_through_the_script: ["in_the_middle_of_fixing_something", "processing"],
    actually_fine: ["processing", "in_the_middle_of_fixing_something"],
    overwhelmed_and_wont_say: ["needing_to_be_left_alone", "needing_reassurance_you_wont_push"],
  },
  love_distortion_when_fear: {
    controlling: ["proving", "withholding"],
    rescuing: ["over_sacrificing", "approval_seeking"],
    approval_seeking: ["over_sacrificing", "rescuing"],
    withholding: ["withdrawing", "controlling"],
    proving: ["controlling", "approval_seeking"],
    over_sacrificing: ["rescuing", "approval_seeking"],
    defiant: ["withholding", "controlling"],
    withdrawing: ["withholding", "over_sacrificing"],
  },
  first_move_when_conflict_opens: {
    argue_the_logic: ["name_the_inconsistency", "branch_into_hypotheticals"],
    smooth_it_over: ["return_to_what_worked", "withdraw_to_think"],
    withdraw_to_think: ["go_quiet_then_reframe", "smooth_it_over"],
    name_the_inconsistency: ["argue_the_logic", "go_quiet_then_reframe"],
    go_quiet_then_reframe: ["withdraw_to_think", "name_the_inconsistency"],
    branch_into_hypotheticals: ["argue_the_logic", "get_out_of_the_room"],
    return_to_what_worked: ["smooth_it_over", "withdraw_to_think"],
    get_out_of_the_room: ["branch_into_hypotheticals", "smooth_it_over"],
  },
  compliment_secretly_needed: {
    you_belong_here: ["youre_seen", "youre_enough"],
    youre_enough: ["you_dont_have_to_prove_yourself", "you_belong_here"],
    youre_seen: ["you_belong_here", "i_see_how_hard_you_worked"],
    youre_trusted: ["youre_allowed_to_rest", "youre_free_to_choose"],
    youre_allowed_to_rest: ["youre_trusted", "you_dont_have_to_prove_yourself"],
    youre_free_to_choose: ["youre_trusted", "youre_allowed_to_rest"],
    you_dont_have_to_prove_yourself: ["youre_enough", "youre_allowed_to_rest"],
    i_see_how_hard_you_worked: ["youre_seen", "youre_enough"],
  },
};

export function adjacencyFor(itemId: string, predictedOptionId: string): string[] {
  return ADJACENCY[itemId]?.[predictedOptionId] ?? [];
}

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-4 — Per-item warm translation copy.
//
// Used by the reveal screen to complete:
//   "You weren't wrong — you saw the outer behavior. {translation}"
//
// One sentence per item, in voice. Engine-read framing ("the inner
// read was X") rather than judgmental framing. These are item-level
// (not per-predicted-option) because the inner-read frame is constant
// across that item's option set.
// ─────────────────────────────────────────────────────────────────────

export const ITEM_TRANSLATIONS: Record<string, string> = {
  under_pressure_become:
    "The engine reads the posture pressure puts them in — not the behavior anyone in the room would see first.",
  need_but_dont_say:
    "What people most want when they're struggling rarely matches what they ask for out loud.",
  grip_costs_you:
    "What fear takes from a partner is usually the opposite of what fear is trying to protect.",
  aim_gives_you:
    "What someone gives at their best is the gift their lens makes natural — even if neither of you has named it that way.",
  the_thing_i_call_helping:
    "Help under pressure is rarely just help; the engine reads what fear was hoping the helping would do.",
  under_pressure_most_need:
    "What we need most under pressure is the thing we're least likely to ask for cleanly.",
  you_know_partner_loves_you_when:
    "The gesture that registers as love depends on the love register a person already lives in.",
  how_you_show_love:
    "Love expresses through the shape someone already loves in — not always the shape they think they should.",
  // ── CC-COUPLE-5 translations ───────────────────────────────────────
  what_they_protect_in_argument:
    "What a person reaches for first in a fight is what their lens has named load-bearing — not always what they say they value.",
  default_question_they_ask:
    "Everyone runs a default first-question; it's the question a lens always asks before it asks anything else.",
  what_im_fine_means:
    "\"I'm fine\" rarely means fine — it means the register the grip is in when the word leaves the mouth.",
  love_distortion_when_fear:
    "Every distortion is a gift wearing the wrong clothes; the engine names the shape, not the verdict.",
  first_move_when_conflict_opens:
    "The first move in conflict is the lens choosing what to protect — before any conscious strategy fires.",
  compliment_secretly_needed:
    "Some compliments don't land — and one does. The one that lands is the one the grip has been waiting for permission to hear.",
};

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-5 — Round selection (deck-balanced spread).
//
// `selectRound(token, size)` deterministically picks `size` items spread
// across the six decks so a play session sees one of each (or close to
// it). Determinism is per-token: each couple gets a consistent round on
// reload, but two different couples see two different rounds.
//
// Hash: simple deterministic mix of the token's char codes. No
// crypto — we don't need it; we only need stability + variety across
// tokens. Tokens themselves are already crypto-strong upstream.
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_ROUND_SIZE = 8;

function hashToken(token: string): number {
  let h = 2166136261; // FNV-1a 32-bit offset basis
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function itemsByDeck(): Record<CoupleDeck, CoupleGameItemSpec[]> {
  const out: Record<CoupleDeck, CoupleGameItemSpec[]> = {
    obvious_to_me: [],
    oblivious_to_me: [],
    love_under_aim: [],
    love_under_grip: [],
    fight_weather: [],
    secretly_needed: [],
  };
  for (const item of COUPLE_GAME_ITEMS) {
    const deck = deckOf(item.itemId);
    if (deck) out[deck].push(item);
  }
  return out;
}

/**
 * Deterministically pick `size` items spread across the six decks for a
 * given couple-session token. The round always begins with one item per
 * deck (canonical deck order). Extra slots beyond the 6-deck minimum
 * are filled by rotating through decks that have additional items,
 * starting from the deck whose index is determined by the token hash.
 *
 * Falls back gracefully when a deck has zero items (skip) or when the
 * bank has fewer total items than `size` (return what we have).
 */
export function selectRound(
  token: string,
  size: number = DEFAULT_ROUND_SIZE
): CoupleGameItemSpec[] {
  const byDeck = itemsByDeck();
  const hash = hashToken(token);
  const picked = new Set<string>();
  const round: CoupleGameItemSpec[] = [];

  // Pass 1: one per deck, picking item index by hash rotation.
  for (let d = 0; d < COUPLE_DECK_ORDER.length; d++) {
    const deck = COUPLE_DECK_ORDER[d];
    const items = byDeck[deck];
    if (items.length === 0) continue;
    const idx = (hash + d * 31) % items.length;
    const item = items[idx];
    round.push(item);
    picked.add(item.itemId);
    if (round.length >= size) return round;
  }

  // Pass 2: fill remaining slots by rotating through decks (skip
  // already-picked items), starting from a hash-offset deck so the
  // extras vary per token.
  let cursor = hash % COUPLE_DECK_ORDER.length;
  let scanned = 0;
  while (round.length < size && scanned < COUPLE_DECK_ORDER.length * 4) {
    const deck = COUPLE_DECK_ORDER[cursor % COUPLE_DECK_ORDER.length];
    const remaining = byDeck[deck].filter((it) => !picked.has(it.itemId));
    if (remaining.length > 0) {
      const idx = (hash + scanned) % remaining.length;
      const item = remaining[idx];
      round.push(item);
      picked.add(item.itemId);
    }
    cursor += 1;
    scanned += 1;
  }
  return round;
}
