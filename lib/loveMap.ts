// CC-044 — Love Map Derivation Framework.
//
// Composes existing measurements (Lens aux-pair register, Drive distribution,
// OCEAN, Compass values, Q-X4 trust portfolio, Q-S3 money allocation, Q-E1
// energy allocation, Q-Stakes1, Q-Ambition1, Path agency aspiration) into a
// structured Love output with three layers:
//   1. Register match (1–2 of 7 character-types, with thresholds)
//   2. Flavors (top 1–3 of 7 functional modes)
//   3. Resource Balance diagnostic (4 cases; surfaces only when distorted)
//
// The user is never asked love-specific questions; the Love Map is pure
// derivation per the project's standing rule (`feedback_minimal_questions_
// maximum_output`).
//
// Architectural rules (do not relax without canon revision; see
// docs/canon/love-map.md):
//   - Derivation only — no claimed-vs-revealed split, no new questions, no
//     new signals.
//   - The 7 register identities (`register_key`), 7 flavor identities
//     (`flavor_key`), Resource Balance case classifier (4 cases), threshold
//     constants, and Pauline-frame + Resource Balance prose templates are
//     canonical at CC-044. Labels, descriptions, characteristic distortions,
//     and flavor labels/descriptions are v1 placeholders refined in
//     CC-044-prose.
//   - Pauline reference (1 Corinthians 13) lives in canon and informs the
//     characteristic_distortion vocabulary; user-facing prose paraphrases
//     the Pauline frame in plain language via the locked framing paragraph.
//   - Resource Balance is independent of register matching. A user with no
//     strong register match but distorted Resource Balance still sees the
//     diagnostic. A user with a strong register match AND healthy balance
//     sees register prose without a balance line.
//   - The 7-register taxonomy explicitly does NOT include Pleasure/Eros
//     (deferred to Layer 5 bond-type, CC-045+) or Provision/Stability /
//     Truth-Telling (candidate flavors not in v1).
//   - Philautia (self-love) is handled at Layer 6 Resource Balance, not as
//     a separate register or bond-type.
//
// CC-059 (2026-05-01) — Pauline-prefix references stripped from every
// `characteristic_distortion` field. The Pauline reference (1 Corinthians 13)
// remains the architectural source for distortion-diagnostic vocabulary
// per `docs/canon/love-map.md`; user-facing prose paraphrases it in plain
// language. Per Rule 1, the framework name itself never surfaces in
// user-visible field content. Developer-facing context comments (this
// block, the canon doc) preserve the framework reference per the Rule 1
// canon carve-out for code comments.

import type {
  Answer,
  DriveOutput,
  FunctionPairKey,
  LensStack,
  LoveFlavor,
  LoveFlavorKey,
  LoveFlavorMatch,
  LoveMapOutput,
  LoveRegister,
  LoveRegisterKey,
  LoveRegisterMatch,
  OceanOutput,
  ResourceBalance,
  ResourceBalanceCase,
  Signal,
  SignalId,
} from "./types";
import type { AgencyPattern } from "./identityEngine";

// ── Threshold constants (named for visible tuning) ──────────────────────

export const LOVE_REGISTER_TOP1_THRESHOLD = 0.7;
export const LOVE_REGISTER_TOP2_FLOOR = 0.5;
export const LOVE_REGISTER_FLOOR = 0.4;
export const LOVE_FLAVOR_FLOOR = 0.5;
export const RESOURCE_BALANCE_DELTA_THRESHOLD = 0.25;
export const RESOURCE_BALANCE_HEALTHY_DELTA_THRESHOLD = 0.20;
export const RESOURCE_BALANCE_THIN_FLOOR = 0.30;

// ── Predicate inputs ─────────────────────────────────────────────────────

export type LoveMapInputs = {
  signals: Signal[];
  answers: Answer[];
  lensStack: LensStack;
  driveOutput: DriveOutput | undefined;
  oceanOutput: OceanOutput | undefined;
  agency: AgencyPattern;
};

// ── Helpers ──────────────────────────────────────────────────────────────

function hasSignal(signals: Signal[], id: SignalId): boolean {
  return signals.some((s) => s.signal_id === id);
}

function rankOf(signals: Signal[], id: SignalId): number | undefined {
  const s = signals.find((sig) => sig.signal_id === id);
  return s?.rank;
}

// True when the named signal is present and ranked at or above `topN`
// (rank 1 = highest). Unranked presence does not count for "top-N" tests.
function rankAtMost(signals: Signal[], id: SignalId, topN: number): boolean {
  const r = rankOf(signals, id);
  return r !== undefined && r <= topN;
}

function lensPairKey(stack: LensStack): FunctionPairKey | undefined {
  if (!stack.dominant || !stack.auxiliary) return undefined;
  const dom = stack.dominant.charAt(0).toUpperCase() + stack.dominant.slice(1);
  const aux = stack.auxiliary.charAt(0).toUpperCase() + stack.auxiliary.slice(1);
  return `${dom}${aux}` as FunctionPairKey;
}

function lensInPairs(stack: LensStack, pairs: FunctionPairKey[]): boolean {
  const key = lensPairKey(stack);
  return key !== undefined && pairs.includes(key);
}

function driverIs(stack: LensStack, fns: string[]): boolean {
  return fns.includes(stack.dominant);
}

function instrumentIs(stack: LensStack, fns: string[]): boolean {
  return fns.includes(stack.auxiliary);
}

// CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT §10 — union read of Strength
// (canon-§10 substrate) and Mix (legacy substrate, retained for
// cohort cache stability). Matches the workMap classifier exactly.
const STRENGTH_LEAN_THRESHOLD = 55;
const MIX_LEAN_THRESHOLD = 38;

function isCoverageLeaning(drive: DriveOutput | undefined): boolean {
  if (!drive) return false;
  const s = drive.strengths;
  const strengthLean =
    !!s &&
    s.coverage >= s.cost &&
    s.coverage >= s.compliance &&
    s.coverage >= STRENGTH_LEAN_THRESHOLD;
  const d = drive.distribution;
  const mixLean =
    d.coverage >= d.cost &&
    d.coverage >= d.compliance &&
    d.coverage >= MIX_LEAN_THRESHOLD;
  return strengthLean || mixLean;
}

// CC-Q4 — Q-L1 direct-measurement lift. When any of the named love_*
// signals ranks top-1 in Q-L1, the predicate gets a strong lift; top-2
// gets a moderate lift; rank ≥ 3 contributes nothing. The lift is
// returned as a 0–1 value so callers can multiply by their flavor-
// specific weight (typical: 0.3 × directLift). Pre-Q-L1 fixtures get 0
// from this helper (no signal source from Q-L1) and rely on the existing
// inferred-from-Q-S2/Q-X4 components — backward-compatible.
const Q_L1_LIFT_TOP1 = 1.0;
const Q_L1_LIFT_TOP2 = 0.55;

function loveDirectLift(signals: Signal[], ids: SignalId[]): number {
  let max = 0;
  for (const id of ids) {
    const sig = signals.find(
      (s) =>
        s.signal_id === id &&
        s.source_question_ids.includes("Q-L1") &&
        s.rank !== undefined
    );
    if (!sig || sig.rank === undefined) continue;
    let lift = 0;
    if (sig.rank === 1) lift = Q_L1_LIFT_TOP1;
    else if (sig.rank === 2) lift = Q_L1_LIFT_TOP2;
    if (lift > max) max = lift;
  }
  return max;
}

// ── Register definitions (v1 placeholder content — locked structure) ────

const PAIR_BONDER_LENSES: FunctionPairKey[] = [
  "NiTe", "NiFe", "TeNi", "FeNi", "TeSi", "SiTe",
  "SiFe", "FeSi", "FiSe", "SeFi", "TiSe", "SeTi",
];

const CHOSEN_FAMILY_PREFERRED: FunctionPairKey[] = [
  "FeSi", "SiFe", "FeNi", "FiSe",
];

export const LOVE_REGISTERS: readonly LoveRegister[] = [
  {
    register_key: "devoted_partner",
    register_label: "the Devoted Partner",
    short_description:
      "Love as long-arc commitment to one chosen person; pair-bond continuity; the steady architecture of a shared life.",
    composes_naturally_with: PAIR_BONDER_LENSES,
    characteristic_distortion:
      "Pair-bond commitment hardening into accountancy — a quiet ledger of who's owed what, who broke faith first, what hasn't been forgiven. The distortion is when love starts keeping books love wasn't meant to keep.",
  },
  {
    register_key: "parental_heart",
    register_label: "the Parental Heart",
    short_description:
      "Love as protective cultivation of what's becoming; the patient tending of someone or something growing into its own form.",
    composes_naturally_with: ["FeSi", "SiFe", "NiFe", "FeNi", "FiSe", "SeFi"],
    characteristic_distortion:
      "Cultivation tipping into control — tending what's becoming until the becoming has to match the tender's image of it. The distortion is when the act of tending starts requiring the tended to be the kind of thing the tender wanted them to become.",
  },
  {
    register_key: "chosen_family",
    register_label: "the Chosen Family",
    short_description:
      "Love as the self-selected web of close ties held through ritual and faithful presence; many-held-together rather than one-held-deeply.",
    composes_naturally_with: CHOSEN_FAMILY_PREFERRED,
    characteristic_distortion:
      "Web-keeping turning into performance — the connections held for the sake of being-the-keeper, not for the people inside them. The distortion is when the connective work starts being its own audience, and the ties that were supposed to hold the people start holding the keeper's identity instead.",
  },
  {
    register_key: "companion",
    register_label: "the Companion",
    short_description:
      "Love as steady presence beside, friend-as-witness; the quiet alongside that doesn't try to lift, fix, or claim — just stays.",
    composes_naturally_with: [
      "TiNe", "NeTi", "SiTe", "TeSi", "FiNe", "NeFi", "FiSe", "SeFi",
    ],
    characteristic_distortion:
      "Presence-without-presence — steady but disengaged; the companion who's there but not engaged enough to interrupt drift. The distortion is when staying close becomes a substitute for caring enough to interrupt — the loyal silence that lets a life go quietly off course.",
  },
  {
    register_key: "belonging_heart",
    register_label: "the Belonging Heart",
    short_description:
      "Love as belonging-to-something-larger; community, faith, civic membership — the love of being-part-of, not just being-with.",
    composes_naturally_with: ["FeSi", "SiFe", "FeNi", "NiFe", "SiTe", "TeSi"],
    characteristic_distortion:
      "Tribal coding — love of belonging hardening into in-group loyalty plus out-group dismissal. The distortion is when 'we' becomes load-bearing in a way that requires a 'they' to fail; when the love of being-part-of starts feeding on what it isn't part of.",
  },
  {
    register_key: "loyalist",
    register_label: "the Loyalist",
    short_description:
      "Love as the unflinching anchor for what matters most; values-rooted devotion that doesn't require performance, that holds whether or not anyone is watching.",
    composes_naturally_with: ["FiNe", "FiSe"],
    characteristic_distortion:
      "Values-loyalty hardening into rigidity; the anchor becomes the verdict. The distortion is when devotion to what's true starts collecting evidence against everyone who fell short of it — when conviction turns into grievance and the loyalty itself becomes the indictment.",
  },
  {
    register_key: "open_heart",
    register_label: "the Open Heart",
    short_description:
      "Love as continuous invitation toward becoming, distributed across many; the catalyst's love — breadth of attention rather than depth of bond, but not less real for being wide.",
    composes_naturally_with: ["NeTi", "NeFi"],
    characteristic_distortion:
      "Distributed attention failing to follow through; the invitation extended without the staying-with that makes it real. The distortion is when the open hand never closes around anything for long enough — when love-as-invitation becomes a register without a residence.",
  },
];

// ── Flavor definitions (v1 placeholder content — locked structure) ─────

export const LOVE_FLAVORS: readonly LoveFlavor[] = [
  {
    flavor_key: "commitment_loyalty",
    flavor_label: "Commitment / Loyalty",
    short_description:
      "Love expressed as durability — staying through difficulty; the form love takes when fidelity is the load-bearing virtue.",
  },
  {
    flavor_key: "fun_adventure",
    flavor_label: "Fun / Adventure / Living Life",
    short_description:
      "Love expressed as vitality — shared aliveness; the form love takes when 'with' means moving through experience together.",
  },
  {
    flavor_key: "building_construction",
    flavor_label: "Building / Co-construction",
    short_description:
      "Love expressed as practical co-construction — building a life, a home, a project, a future; the form love takes when the work itself is the medium.",
  },
  {
    flavor_key: "championing",
    flavor_label: "Championing",
    short_description:
      "Love expressed as goal-support — naming what someone could become and helping them become it; the form love takes when belief is the primary gift.",
  },
  {
    flavor_key: "tenderness_care",
    flavor_label: "Tenderness / Care",
    short_description:
      "Love expressed as comfort and attentive presence — soft attention to what's needed; the form love takes when the gift is the noticing itself.",
  },
  {
    flavor_key: "witnessing_recognition",
    flavor_label: "Witnessing / Recognition",
    short_description:
      "Love expressed as being-seen — naming what is true about someone in a way only deep attention could surface; the form love takes when recognition is the gift.",
  },
  {
    flavor_key: "devotion_to_calling",
    flavor_label: "Devotion to a Calling",
    short_description:
      "Love expressed as passion-as-identity — the lifelong commitment to a craft, idea, or cause that organizes the loving energy itself.",
  },
];

// ── Register predicates ──────────────────────────────────────────────────
//
// Each predicate combines boolean gates (signal presence, lens membership,
// agency aspiration) with normalized soft components. Returns 0..1 score.
// The locked-content section in CC-044 / docs/canon/love-map.md describes
// the *intent* of each predicate; the implementation here uses weighted
// averages of presence checks so partial matches degrade gracefully.

type RegisterPredicate = (inp: LoveMapInputs) => number;

const devotedPartnerPredicate: RegisterPredicate = (inp) => {
  const { signals, lensStack, driveOutput } = inp;
  const partnerTrust = rankAtMost(signals, "partner_trust_priority", 1) ? 1 : 0;
  const valueGate =
    rankAtMost(signals, "loyalty_priority", 3) ||
    rankAtMost(signals, "family_priority", 3)
      ? 1
      : 0;
  const familySpending = rankAtMost(signals, "family_spending_priority", 2) ? 1 : 0;
  const closeStakes = rankAtMost(signals, "close_relationships_stakes_priority", 2)
    ? 1
    : 0;
  const lensOk = lensInPairs(lensStack, PAIR_BONDER_LENSES) ? 1 : 0;
  const coverageBoost = isCoverageLeaning(driveOutput) ? 0.2 : 0;
  // Weighted: partner-trust gate is the strongest single signal (0.30); the
  // four AND-conjuncts contribute remaining weight; coverage adds a soft boost.
  return Math.min(
    1,
    partnerTrust * 0.3 +
      valueGate * 0.2 +
      familySpending * 0.15 +
      closeStakes * 0.15 +
      lensOk * 0.1 +
      coverageBoost
  );
};

const parentalHeartPredicate: RegisterPredicate = (inp) => {
  const { signals, driveOutput } = inp;
  const family = rankAtMost(signals, "family_priority", 3) ? 1 : 0;
  const caringEnergy = rankAtMost(signals, "caring_energy_priority", 2) ? 1 : 0;
  const familySpending = rankAtMost(signals, "family_spending_priority", 2) ? 1 : 0;
  const closeStakes = rankAtMost(signals, "close_relationships_stakes_priority", 2)
    ? 1
    : 0;
  const coverageDrive = isCoverageLeaning(driveOutput) ? 1 : 0;
  return Math.min(
    1,
    family * 0.25 +
      caringEnergy * 0.2 +
      familySpending * 0.2 +
      closeStakes * 0.2 +
      coverageDrive * 0.15
  );
};

const chosenFamilyPredicate: RegisterPredicate = (inp) => {
  const { signals, lensStack } = inp;
  const friendTrust = rankAtMost(signals, "friend_trust_priority", 2) ? 1 : 0;
  const friendsSpending = rankAtMost(signals, "friends_spending_priority", 2) ? 1 : 0;
  const socialSpending = rankAtMost(signals, "social_spending_priority", 2) ? 1 : 0;
  const loyalty = rankAtMost(signals, "loyalty_priority", 3) ? 1 : 0;
  const lensPreferred = lensInPairs(lensStack, CHOSEN_FAMILY_PREFERRED) ? 1 : 0;
  return Math.min(
    1,
    friendTrust * 0.25 +
      friendsSpending * 0.2 +
      socialSpending * 0.2 +
      loyalty * 0.2 +
      lensPreferred * 0.15
  );
};

const companionPredicate: RegisterPredicate = (inp) => {
  const { signals } = inp;
  const friendTrust = rankAtMost(signals, "friend_trust_priority", 2) ? 1 : 0;
  const partnerTrust = rankAtMost(signals, "partner_trust_priority", 2) ? 1 : 0;
  // The "moderate-balanced" intent: both ranked top-2 but neither dominates
  // (no rank-1 dominance from either). Reward the overlap rather than a
  // single rank-1 outlier; rank 1 of *either* contributes less than both at
  // ranks 1 + 2 because the register is steadiness-beside, not pair-bond.
  const balanceBonus =
    friendTrust && partnerTrust && rankOf(signals, "friend_trust_priority") !== 1
      ? 0.15
      : 0;
  const caringEnergyModerate = hasSignal(signals, "caring_energy_priority") ? 0.5 : 0;
  // Caring rank 1 is *too much* for the Companion register — the register is
  // steadiness-beside, not active care. Cap at the "moderate" level.
  const caringRank = rankOf(signals, "caring_energy_priority");
  const caringFit = caringRank === undefined
    ? 0
    : caringRank === 1
    ? 0.3 // present but maybe stronger fit for Parental Heart
    : caringRank <= 3
    ? 1
    : 0.5;
  const valueGate =
    rankAtMost(signals, "freedom_priority", 3) ||
    rankAtMost(signals, "truth_priority", 3)
      ? 1
      : 0;
  return Math.min(
    1,
    friendTrust * 0.25 +
      partnerTrust * 0.2 +
      caringFit * 0.15 +
      valueGate * 0.2 +
      caringEnergyModerate * 0.05 +
      balanceBonus
  );
};

const belongingHeartPredicate: RegisterPredicate = (inp) => {
  const { signals, driveOutput } = inp;
  const faithOrReligious =
    rankAtMost(signals, "faith_priority", 3) ||
    rankAtMost(signals, "religious_trust_priority", 2)
      ? 1
      : 0;
  const nonprofitsReligiousSpending = rankAtMost(
    signals,
    "nonprofits_religious_spending_priority",
    2
  )
    ? 1
    : 0;
  const family = rankAtMost(signals, "family_priority", 3) ? 1 : 0;
  const coverageDrive = isCoverageLeaning(driveOutput) ? 1 : 0;
  return Math.min(
    1,
    faithOrReligious * 0.35 +
      nonprofitsReligiousSpending * 0.25 +
      family * 0.2 +
      coverageDrive * 0.2
  );
};

const loyalistPredicate: RegisterPredicate = (inp) => {
  const { signals, lensStack } = inp;
  const fiDriver = lensInPairs(lensStack, ["FiNe", "FiSe"]) ? 1 : 0;
  const valueGate =
    rankAtMost(signals, "justice_priority", 3) ||
    rankAtMost(signals, "truth_priority", 3)
      ? 1
      : 0;
  const convictionFires =
    hasSignal(signals, "holds_internal_conviction") ||
    hasSignal(signals, "high_conviction_under_risk")
      ? 1
      : 0;
  const closeStakes = rankAtMost(signals, "close_relationships_stakes_priority", 3)
    ? 1
    : 0;
  return Math.min(
    1,
    fiDriver * 0.35 +
      valueGate * 0.25 +
      convictionFires * 0.25 +
      closeStakes * 0.15
  );
};

const openHeartPredicate: RegisterPredicate = (inp) => {
  const { signals, lensStack } = inp;
  const neDriver = lensInPairs(lensStack, ["NeTi", "NeFi"]) ? 1 : 0;
  const freedom = rankAtMost(signals, "freedom_priority", 3) ? 1 : 0;
  const learningEnergy = rankAtMost(signals, "learning_energy_priority", 2) ? 1 : 0;
  const enjoyingEnergy = rankAtMost(signals, "enjoying_energy_priority", 2) ? 1 : 0;
  const socialSpending = rankAtMost(signals, "social_spending_priority", 2) ? 1 : 0;
  return Math.min(
    1,
    neDriver * 0.3 +
      freedom * 0.2 +
      learningEnergy * 0.15 +
      enjoyingEnergy * 0.15 +
      socialSpending * 0.2
  );
};

const REGISTER_PREDICATES: Record<LoveRegisterKey, RegisterPredicate> = {
  devoted_partner: devotedPartnerPredicate,
  parental_heart: parentalHeartPredicate,
  chosen_family: chosenFamilyPredicate,
  companion: companionPredicate,
  belonging_heart: belongingHeartPredicate,
  loyalist: loyalistPredicate,
  open_heart: openHeartPredicate,
};

// ── Flavor predicates ────────────────────────────────────────────────────

type FlavorPredicate = (inp: LoveMapInputs) => number;

const commitmentLoyaltyPredicate: FlavorPredicate = (inp) => {
  const { signals } = inp;
  const loyalty = rankAtMost(signals, "loyalty_priority", 3) ? 1 : 0;
  const conviction =
    hasSignal(signals, "holds_internal_conviction") ||
    hasSignal(signals, "high_conviction_under_risk")
      ? 1
      : 0;
  const trust =
    rankAtMost(signals, "partner_trust_priority", 2) ||
    rankAtMost(signals, "family_trust_priority", 2)
      ? 1
      : 0;
  const family = rankAtMost(signals, "family_priority", 5) ? 1 : 0;
  // CC-Q4 — Q-L1 direct lift. love_presence (durability) and
  // love_protection (guardian) anchor to the commitment / loyalty
  // register; love_quiet_sacrifice contributes lightly because
  // unspoken sacrifice composes with fidelity.
  const directLift = loveDirectLift(signals, [
    "love_presence",
    "love_protection",
    "love_quiet_sacrifice",
  ]);
  const inferred = loyalty * 0.3 + conviction * 0.25 + trust * 0.25 + family * 0.2;
  return Math.min(1, inferred + directLift * 0.3);
};

const funAdventurePredicate: FlavorPredicate = (inp) => {
  const { signals } = inp;
  const enjoyingEnergy = rankAtMost(signals, "enjoying_energy_priority", 2) ? 1 : 0;
  const freedom = rankAtMost(signals, "freedom_priority", 3) ? 1 : 0;
  const socialSpending = rankAtMost(signals, "social_spending_priority", 2) ? 1 : 0;
  const learningEnergy = rankAtMost(signals, "learning_energy_priority", 2) ? 1 : 0;
  // CC-Q4 — love_shared_experience (creating beauty / humor / shared
  // moments) is the canonical Q-L1 anchor for Fun / Adventure / Living-Life.
  const directLift = loveDirectLift(signals, ["love_shared_experience"]);
  const inferred =
    enjoyingEnergy * 0.3 + freedom * 0.25 + socialSpending * 0.2 + learningEnergy * 0.25;
  return Math.min(1, inferred + directLift * 0.3);
};

const buildingConstructionPredicate: FlavorPredicate = (inp) => {
  const { signals, agency } = inp;
  const buildingEnergy = rankAtMost(signals, "building_energy_priority", 2) ? 1 : 0;
  const familySpending = rankAtMost(signals, "family_spending_priority", 2) ? 1 : 0;
  const aspirationFit =
    agency.aspiration === "creator" || agency.aspiration === "stability" ? 1 : 0;
  const successAndFamily =
    rankAtMost(signals, "success_priority", 3) &&
    rankAtMost(signals, "family_priority", 3)
      ? 1
      : 0;
  // CC-Q4 — love_problem_solving (practical / removing burden) and
  // love_co_construction (build conditions for flourishing) both anchor
  // the Building / Co-construction register directly.
  const directLift = loveDirectLift(signals, [
    "love_problem_solving",
    "love_co_construction",
  ]);
  const inferred =
    buildingEnergy * 0.3 +
    familySpending * 0.2 +
    aspirationFit * 0.25 +
    successAndFamily * 0.25;
  return Math.min(1, inferred + directLift * 0.3);
};

const championingPredicate: FlavorPredicate = (inp) => {
  const { signals } = inp;
  const caringRank = rankOf(signals, "caring_energy_priority");
  const caringModerate = caringRank !== undefined && caringRank <= 3 ? 1 : 0;
  const mentorTrust = rankAtMost(signals, "mentor_trust_priority", 2) ? 1 : 0;
  const ambitionFit =
    rankAtMost(signals, "success_priority", 2) ||
    rankAtMost(signals, "legacy_priority", 2)
      ? 1
      : 0;
  const individualResponsibility = rankAtMost(
    signals,
    "individual_responsibility_priority",
    2
  )
    ? 1
    : 0;
  // CC-Q4 — love_co_construction (build conditions for their flourishing)
  // is the Q-L1 composite that anchors Championing alongside Building.
  const directLift = loveDirectLift(signals, ["love_co_construction"]);
  const inferred =
    caringModerate * 0.25 +
    mentorTrust * 0.25 +
    ambitionFit * 0.25 +
    individualResponsibility * 0.25;
  return Math.min(1, inferred + directLift * 0.3);
};

const tendernessCarePredicate: FlavorPredicate = (inp) => {
  const { signals, lensStack } = inp;
  const caringEnergy = rankAtMost(signals, "caring_energy_priority", 2) ? 1 : 0;
  const compassionMercy =
    rankAtMost(signals, "compassion_priority", 5) &&
    rankAtMost(signals, "mercy_priority", 5)
      ? 1
      : 0;
  const feInLens = driverIs(lensStack, ["fe"]) || instrumentIs(lensStack, ["fe"]) ? 1 : 0;
  const family = rankAtMost(signals, "family_priority", 3) ? 1 : 0;
  // CC-Q4 — love_quiet_sacrifice (silent-care register) and love_presence
  // (showing-up as gift) both anchor Tenderness / Care.
  const directLift = loveDirectLift(signals, [
    "love_quiet_sacrifice",
    "love_presence",
  ]);
  const inferred =
    caringEnergy * 0.3 + compassionMercy * 0.25 + feInLens * 0.2 + family * 0.25;
  return Math.min(1, inferred + directLift * 0.3);
};

const witnessingRecognitionPredicate: FlavorPredicate = (inp) => {
  const { signals, lensStack } = inp;
  const fiDriver = driverIs(lensStack, ["fi"]) ? 1 : 0;
  const truthAndFamily =
    rankAtMost(signals, "truth_priority", 5) &&
    rankAtMost(signals, "family_priority", 5)
      ? 1
      : 0;
  const conviction = hasSignal(signals, "holds_internal_conviction") ? 1 : 0;
  const trustBoth =
    rankAtMost(signals, "partner_trust_priority", 2) &&
    rankAtMost(signals, "friend_trust_priority", 2)
      ? 1
      : 0;
  // CC-Q4 — love_verbal_expression (saying what they mean to you) is the
  // canonical Q-L1 anchor for Witnessing / Recognition (naming as gift).
  const directLift = loveDirectLift(signals, ["love_verbal_expression"]);
  const inferred =
    fiDriver * 0.3 + truthAndFamily * 0.25 + conviction * 0.2 + trustBoth * 0.25;
  return Math.min(1, inferred + directLift * 0.3);
};

const devotionToCallingPredicate: FlavorPredicate = (inp) => {
  const { signals } = inp;
  const legacy = rankAtMost(signals, "legacy_priority", 2) ? 1 : 0;
  const buildingEnergy = rankAtMost(signals, "building_energy_priority", 2) ? 1 : 0;
  const valueGate =
    rankAtMost(signals, "knowledge_priority", 3) ||
    rankAtMost(signals, "honor_priority", 3)
      ? 1
      : 0;
  // Non-personal love-object proxy — strong building_energy paired with weak
  // caring_energy reads as work-as-love rather than person-as-love.
  const caringRank = rankOf(signals, "caring_energy_priority");
  const nonPersonalProxy =
    rankAtMost(signals, "building_energy_priority", 1) &&
    (caringRank === undefined || caringRank > 2)
      ? 1
      : 0;
  // CC-Q4 — Devotion to a Calling has no canonical Q-L1 anchor (Q-L1
  // captures love-expression toward the people closest to you, while
  // Devotion to a Calling is the calling-as-love register). Predicate
  // unchanged — Q-L1 contributes 0 here, by design.
  return legacy * 0.3 + buildingEnergy * 0.25 + valueGate * 0.2 + nonPersonalProxy * 0.25;
};

const FLAVOR_PREDICATES: Record<LoveFlavorKey, FlavorPredicate> = {
  commitment_loyalty: commitmentLoyaltyPredicate,
  fun_adventure: funAdventurePredicate,
  building_construction: buildingConstructionPredicate,
  championing: championingPredicate,
  tenderness_care: tendernessCarePredicate,
  witnessing_recognition: witnessingRecognitionPredicate,
  devotion_to_calling: devotionToCallingPredicate,
};

// ── Resource Balance diagnostic ──────────────────────────────────────────
//
// Computes self-investment vs other-investment from spending, energy,
// stakes, Compass, and trust signals. Each signal contributes a normalized
// rank-aware weight (rank 1 = 3, rank 2 = 2, rank 3 = 1, present-unranked = 1).
// Self and other scores are normalized to 0..1 by dividing by the maximum
// theoretical contribution. Case classifier follows the locked thresholds.

const SELF_SIGNALS: SignalId[] = [
  "self_spending_priority",
  "enjoying_energy_priority",
  "learning_energy_priority",
  "freedom_priority",
  "success_priority",
  "fame_priority",
  "wealth_priority",
  "legacy_priority",
];

const OTHER_SIGNALS: SignalId[] = [
  "family_spending_priority",
  "friends_spending_priority",
  "social_spending_priority",
  "nonprofits_religious_spending_priority",
  "caring_energy_priority",
  "family_priority",
  "loyalty_priority",
  "compassion_priority",
  "mercy_priority",
  "family_trust_priority",
  "partner_trust_priority",
  "friend_trust_priority",
  "mentor_trust_priority",
];

function rankWeight(signal: Signal | undefined): number {
  if (!signal) return 0;
  if (signal.rank === undefined) return 1;
  if (signal.rank === 1) return 3;
  if (signal.rank === 2) return 2;
  if (signal.rank === 3) return 1;
  return 0.5;
}

function scoreSignals(signals: Signal[], ids: SignalId[]): number {
  let total = 0;
  for (const id of ids) {
    const s = signals.find((sig) => sig.signal_id === id);
    total += rankWeight(s);
  }
  // Theoretical max: every signal at rank 1 → weight 3 each.
  const maxTotal = ids.length * 3;
  return maxTotal > 0 ? total / maxTotal : 0;
}

const RESOURCE_BALANCE_PROSE: Record<ResourceBalanceCase, string> = {
  healthy: "",
  inward_heavy:
    "Your love map shows strong self-investment relative to other-investment — your money, energy, and stakes weight noticeably toward yourself. Self-care matters as the substrate for loving others, but if the balance stays heavily inward over time, the love-orientation outward may stay underdeveloped. The question isn't whether you should care for yourself; it's whether the care for yourself is making room for caring for others, or replacing it.",
  outward_depleted:
    "Your love map shows minimal self-investment relative to other-investment — your resources are flowing outward without much returning to keep the source full. Selfless love is real, but a love that empties the lover eventually has nothing left to give. Self-care isn't selfishness; it's the resource-base from which sustainable other-directed love operates. The question isn't whether you should give less; it's whether you're giving in a way that's still possible to keep giving.",
  thin_overall:
    "Your love map shows light investment in both self and others. This may simply be a season — life-stage, capacity, attention all elsewhere — or it may be that love-orientation hasn't yet had the chance to settle into form. Either way, the map below describes the shape your love would tend to take if it were more fully developed; the shape is real even when the practice is still arriving.",
};

export function computeResourceBalance(inp: LoveMapInputs): ResourceBalance {
  const selfScore = scoreSignals(inp.signals, SELF_SIGNALS);
  const otherScore = scoreSignals(inp.signals, OTHER_SIGNALS);
  const delta = selfScore - otherScore;
  let balanceCase: ResourceBalanceCase;
  if (
    Math.abs(delta) <= RESOURCE_BALANCE_HEALTHY_DELTA_THRESHOLD &&
    selfScore > RESOURCE_BALANCE_THIN_FLOOR &&
    otherScore > RESOURCE_BALANCE_THIN_FLOOR
  ) {
    balanceCase = "healthy";
  } else if (delta > RESOURCE_BALANCE_DELTA_THRESHOLD) {
    balanceCase = "inward_heavy";
  } else if (
    -delta > RESOURCE_BALANCE_DELTA_THRESHOLD &&
    selfScore < RESOURCE_BALANCE_THIN_FLOOR
  ) {
    balanceCase = "outward_depleted";
  } else if (
    selfScore < RESOURCE_BALANCE_THIN_FLOOR &&
    otherScore < RESOURCE_BALANCE_THIN_FLOOR
  ) {
    balanceCase = "thin_overall";
  } else {
    balanceCase = "healthy";
  }
  return {
    case: balanceCase,
    selfScore,
    otherScore,
    prose: RESOURCE_BALANCE_PROSE[balanceCase],
  };
}

// ── Composite prose generator ────────────────────────────────────────────
//
// v1 placeholder: composes register × top flavor × characteristic_distortion
// reference into a single paragraph. CC-044-prose refines per register.

export function generateLoveProse(
  matches: LoveRegisterMatch[],
  flavors: LoveFlavorMatch[],
  balance: ResourceBalance
): string {
  if (matches.length === 0) {
    // Resource Balance carries the read on its own when no register matched.
    return balance.case === "healthy" ? "" : balance.prose;
  }
  const primary = matches[0];
  const flavorClause =
    flavors.length === 0
      ? ""
      : flavors.length === 1
      ? `Expressed primarily through ${flavors[0].flavor.flavor_label}.`
      : flavors.length === 2
      ? `Expressed primarily through ${flavors[0].flavor.flavor_label} and ${flavors[1].flavor.flavor_label}.`
      : `Expressed primarily through ${flavors[0].flavor.flavor_label} and ${flavors[1].flavor.flavor_label}, with notes of ${flavors[2].flavor.flavor_label}.`;
  if (matches.length === 1) {
    return `Your love map points toward ${primary.register.register_label}. ${primary.register.short_description} ${flavorClause}`.trim();
  }
  const secondary = matches[1];
  return `Your love map points toward ${primary.register.register_label} as the strongest register, with ${secondary.register.register_label} as a near-second. ${primary.register.short_description} ${flavorClause}`.trim();
}

// ── Top-level compute ───────────────────────────────────────────────────

export function computeLoveMapOutput(
  signals: Signal[],
  answers: Answer[],
  lensStack: LensStack,
  driveOutput: DriveOutput | undefined,
  oceanOutput: OceanOutput | undefined,
  agency: AgencyPattern
): LoveMapOutput | undefined {
  const inputs: LoveMapInputs = {
    signals,
    answers,
    lensStack,
    driveOutput,
    oceanOutput,
    agency,
  };

  const registerScores: LoveRegisterMatch[] = LOVE_REGISTERS.map((register) => ({
    register,
    score: REGISTER_PREDICATES[register.register_key](inputs),
  }));
  registerScores.sort((a, b) => b.score - a.score);

  const flavorScores: LoveFlavorMatch[] = LOVE_FLAVORS.map((flavor) => ({
    flavor,
    score: FLAVOR_PREDICATES[flavor.flavor_key](inputs),
  }));
  flavorScores.sort((a, b) => b.score - a.score);

  const resourceBalance = computeResourceBalance(inputs);

  const top = registerScores[0];
  let matchedRegisters: LoveRegisterMatch[];
  if (top && top.score > LOVE_REGISTER_TOP1_THRESHOLD) {
    matchedRegisters = [top];
  } else if (
    top &&
    registerScores[1] &&
    top.score > LOVE_REGISTER_TOP2_FLOOR &&
    registerScores[1].score > LOVE_REGISTER_TOP2_FLOOR
  ) {
    matchedRegisters = [top, registerScores[1]];
  } else if (top && top.score > LOVE_REGISTER_FLOOR) {
    matchedRegisters = [top];
  } else {
    matchedRegisters = [];
  }

  const matchedFlavors = flavorScores
    .filter((f) => f.score > LOVE_FLAVOR_FLOOR)
    .slice(0, 3);

  if (matchedRegisters.length === 0 && resourceBalance.case === "healthy") {
    return undefined;
  }

  return {
    matches: matchedRegisters,
    flavors: matchedFlavors,
    resourceBalance,
    prose: generateLoveProse(matchedRegisters, matchedFlavors, resourceBalance),
  };
}
