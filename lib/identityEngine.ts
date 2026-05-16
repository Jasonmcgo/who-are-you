import type {
  Answer,
  CardId,
  CognitiveFunctionId,
  ConvictionOutput,
  CrossCardSynthesis,
  DemographicSet,
  DriveOutput,
  FullSwotOutput,
  FunctionPairKey,
  FunctionPairRegister,
  GiftCategory,
  InnerConstitution,
  LensStack,
  MetaSignal,
  MirrorOutput,
  MirrorTopGift,
  MirrorTopTrap,
  NextMove,
  OceanIntensityBands,
  PathOutput,
  ShapeCardId,
  ShapeOutputs,
  Signal,
  SignalId,
  SinglePickAnswer,
  Tension,
  TopGiftEntry,
  TopRiskEntry,
  UncomfortableButTrueClass,
} from "./types";
import { questions } from "../data/questions";
import { extractBeliefUnderTension } from "./beliefHeuristics";
import { buildDriveTension, computeDriveOutput } from "./drive";
import { computeOceanOutput } from "./ocean";
import { computeWorkMapOutput } from "./workMap";
import { computeLoveMapOutput } from "./loveMap";
import { computeGoalSoulGive } from "./goalSoulGive";
import { detectGoalSoulPatterns } from "./goalSoulPatterns";
import { computeMovement } from "./goalSoulMovement";
import { computeRiskForm } from "./riskForm";
import { computeMovementQuadrant } from "./movementQuadrant";
import {
  archetypeInputsFromConstitution,
  computeArchetype,
  GIFT_LABELS_BY_ARCHETYPE,
} from "./profileArchetype";
// CC-SYNTHESIS-3 — runtime cache lookup for LLM-articulated Path master
// synthesis paragraph. The composer module (synthesis3Llm) and the
// inputs-derivation module (synthesis3Inputs) are imported lazily after
// the constitution is otherwise complete so the LLM cache lookup can't
// affect any other engine output.

// CC-022a Item 1 helpers — name threading. Provided here as the engine-
// layer primitives so prose generators (CC-022b consumers) can substitute
// the user's name into sentences that currently use "You" / "Your", with
// a clean fallback when the name is missing.
//
// Per the amended demographic-rules.md Rule 4 (2026-04-26), demographic
// interpolation is permitted at the prose-generation layer only. The
// derivation layer (signal extraction, tension detection, per-card
// derivation) remains demographic-blind: getUserName is callable from
// derivation code but MUST NOT be used to gate signal or tension logic.

export function getUserName(
  demographics?: DemographicSet | null
): string | null {
  if (!demographics) return null;
  const name = demographics.answers.find((a) => a.field_id === "name");
  if (!name || name.state !== "specified") return null;
  const trimmed = name.value?.trim();
  if (!trimmed || trimmed.length === 0) return null;
  if (isLikelyUsername(trimmed)) return null;
  return trimmed;
}

function isLikelyUsername(name: string | undefined | null): boolean {
  if (!name) return false; // empty/null is "no name", not "username"
  if (/\d/.test(name)) return true; // digit suffix or embedded digit
  if (/[_\-\.]/.test(name)) return true; // underscore, hyphen, or period
  if (name.length > 20) return true; // unreasonably long for a first name
  if (name === name.toLowerCase() && name.length > 2) return true; // all-lowercase non-initial
  return false;
}

// Returns the user's name (proper noun) when available, or the second-
// person pronoun fallback. The `capitalized` flag controls sentence-
// initial casing for the pronoun branch ("You" vs "your"). For the name
// branch, capitalization is intrinsic to the proper noun; the flag also
// controls whether to append "'s" possessive — useful at sentence-
// construction time:
//
//   `${nameOrYour(d)} pattern lives inside…`        → "Madison's pattern…" / "your pattern…"
//   `${nameOrYour(d, true)} appear to protect…`     → "Madison appears to protect…" / "You appear to protect…"
//
// (The verb agreement difference between "Madison appears" and "You
// appear" is the caller's responsibility; the helper supplies the
// subject only.)
export function nameOrYour(
  demographics?: DemographicSet | null,
  asSubject = false
): string {
  const name = getUserName(demographics);
  if (name) return asSubject ? name : `${name}'s`;
  return asSubject ? "You" : "your";
}

export const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  truth_priority_high: "Appears to prioritize truth over social comfort.",
  belonging_priority_high:
    "Appears to weight belonging heavily when truth is socially costly.",
  freedom_priority: "Tends to favor freedom to act.",
  order_priority: "Tends to favor order and structure.",
  adapts_under_social_pressure:
    "May soften or withhold belief when relationships are at risk.",
  moderate_social_expression:
    "Tends to express belief carefully under social pressure.",
  high_conviction_expression:
    "Tends to state belief directly even under social cost.",
  adapts_under_economic_pressure:
    "May change position when economic security is at risk.",
  hides_belief: "May keep belief private when livelihood is exposed.",
  holds_internal_conviction:
    "Appears to retain internal conviction while limiting expression.",
  high_conviction_under_risk:
    "Appears willing to accept economic risk for belief.",
  authority_trust_high:
    "Early experience of authority as protective may shape trust in institutions.",
  authority_skepticism_moderate:
    "Early experience of authority as flawed may produce measured skepticism.",
  authority_distrust:
    "Early experience of authority as unfair may produce durable skepticism.",
  stability_baseline_high:
    "Formed in stability, which may set an internal expectation of predictability.",
  moderate_stability: "Formed in a mix of stability and uncertainty.",
  chaos_exposure:
    "Formed in uncertainty, which may shape later preferences for control or order.",
  stability_present: "Current context appears stable and manageable.",
  moderate_load: "Current context appears busy but controlled.",
  high_pressure_context:
    "Current context appears stretched or overloaded.",
  low_responsibility:
    "Few external dependents at present.",
  moderate_responsibility:
    "Some external dependents at present.",
  high_responsibility:
    "Many others depend on the user at present.",
  proactive_creator:
    "Tends to spend time building or creating.",
  responsibility_maintainer:
    "Tends to spend time maintaining existing responsibilities.",
  reactive_operator:
    "Tends to spend time reacting to incoming demands.",
  relational_investment:
    "Energy would flow toward deepening relationships and care if freed.",
  stability_restoration:
    "Energy would flow toward restoring order and stability if freed.",
  exploration_drive:
    "Energy would flow toward exploring, learning, or wandering if freed.",
  family_priority: "Holds family as a sacred value.",
  truth_priority: "Holds truth as a sacred value.",
  stability_priority: "Holds stability as a sacred value.",
  loyalty_priority: "Tends to prioritize loyalty to people over abstract commitment to truth.",
  knowledge_priority:
    "Holds knowledge — what's actually known and the discipline of seeking more — as a sacred value.",
  justice_priority:
    "Holds justice — fair weight, even when it costs to give it — as a sacred value.",
  faith_priority:
    "Holds faith — trust in what's larger than you, however framed — as a sacred value.",
  // CC-028 — Q-S1 / Q-S2 expansion signals (4 new sacred values). Resolves
  // the top-3-universal compression real-user testing surfaced; the 12-item
  // pool restores meaningful gradient across users at the Compass card.
  peace_priority:
    "Holds peace — interior groundedness, the calm that holds even when conditions don't — as a sacred value.",
  honor_priority:
    "Holds honor — keeping faith with your word and your standing, even when the breach would go unnoticed — as a sacred value.",
  compassion_priority:
    "Holds compassion — being moved by what hurts in others — as a sacred value.",
  mercy_priority:
    "Holds mercy — softening what justice would let you claim — as a sacred value.",
  // CC-024 — Q-Stakes1 ranking signals (Compass card extension). Concrete
  // loss domains the user fears losing most. Pairs with the abstract sacred
  // values above to give Compass two registers — what the heart loves
  // abstractly + what the heart fears losing concretely.
  money_stakes_priority:
    "Ranks money / financial security as among the most important things to protect from loss.",
  job_stakes_priority:
    "Ranks job / career as among the most important things to protect from loss.",
  close_relationships_stakes_priority:
    "Ranks close relationships — partner, family, closest friends — as among the most important things to protect from loss.",
  reputation_stakes_priority:
    "Ranks reputation — how others see you, your standing in your community — as among the most important things to protect from loss.",
  health_stakes_priority:
    "Ranks physical safety / health as among the most important things to protect from loss.",
  // CC-026 — Q-3C1 Drive ranking signals (Path · Gait extension). The
  // "claimed" half of the claimed-vs-revealed why-axis. *Not* added to
  // SACRED_PRIORITY_SIGNAL_IDS or SACRED_IDS — drive is its own register and
  // conflating with sacred-value math would corrupt compass-ranking
  // computations.
  cost_drive:
    "Claims protecting financial security — money, savings, accumulated resources — as the drive that most often guides decisions.",
  coverage_drive:
    "Claims caring for those closest — people, relationships, commitments — as the drive that most often guides decisions.",
  compliance_drive:
    "Claims managing risk and uncertainty — guarding against loss, protecting what could be taken — as the drive that most often guides decisions.",
  // CC-031 — Q-X3 multi-stage signal catalog. Four legacy signals
  // (government_trust_priority, press_trust_priority, companies_trust_priority,
  // nonprofits_religious_trust_priority) retired; nine new signals replace
  // them across two parent rankings (Q-X3-public + Q-X3-information-and-
  // commercial). education_trust_priority is preserved unchanged.
  government_elected_trust_priority:
    "Ranks elected representatives, legislatures, and the political apparatus as a trusted public-mission institutional source.",
  government_services_trust_priority:
    "Ranks the on-the-ground services of government — public schools, DMV, water, sanitation, local police — as a trusted public-mission institutional source.",
  education_trust_priority:
    "Ranks schools, colleges, and credentialing institutions as a trusted public-mission institutional source.",
  nonprofits_trust_priority:
    "Ranks charities, NGOs, and voluntary missions outside religious frame as a trusted public-mission institutional source.",
  religious_trust_priority:
    "Ranks churches, faith communities, and explicitly religious missions as a trusted public-mission institutional source.",
  journalism_trust_priority:
    "Ranks individual journalists and the discipline of journalistic craft as a trusted information-and-commercial institutional source.",
  news_organizations_trust_priority:
    "Ranks newsrooms, outlets, and the institutions that distribute and shape journalism as a trusted information-and-commercial institutional source.",
  social_media_trust_priority:
    "Ranks social media platforms — algorithmic and influence-mediated information surfaces — as a trusted information-and-commercial institutional source.",
  small_business_trust_priority:
    "Ranks small, private, closely-held businesses as a trusted information-and-commercial institutional source.",
  large_companies_trust_priority:
    "Ranks large, public, publicly-traded companies as a trusted information-and-commercial institutional source.",
  partner_trust_priority:
    "Ranks a spouse or partner as a trusted personal source for hard truth.",
  friend_trust_priority:
    "Ranks a close friend as a trusted personal source for hard truth.",
  family_trust_priority:
    "Ranks family — parents, siblings, or chosen kin — as a trusted personal source for hard truth.",
  mentor_trust_priority:
    "Ranks a mentor or advisor as a trusted personal source for hard truth.",
  // CC-032 — Q-X4 multi-stage adds the missing trusted-professional category.
  outside_expert_trust_priority:
    "Ranks an outside expert — therapist, doctor, lawyer, coach, financial advisor, or clergy member — as a trusted personal source for hard truth.",
  own_counsel_trust_priority:
    "Ranks own judgment as the trusted source when no other source feels right.",
  individual_responsibility_priority:
    "Ranks the individual — the person who acted — as the locus of responsibility when things go wrong.",
  system_responsibility_priority:
    "Ranks the system — structures and incentives — as the locus of responsibility when things go wrong.",
  nature_responsibility_priority:
    "Ranks nature — chance, biology, the way things just are — as the locus of responsibility when things go wrong.",
  supernatural_responsibility_priority:
    "Ranks the supernatural — divine will, fate, or what's beyond human reach — as the locus of responsibility when things go wrong.",
  authority_responsibility_priority:
    "Ranks authority — the people in charge of the system, not the system itself — as the locus of responsibility when things go wrong.",
  ni: "Pattern synthesis directed inward — consolidating disparate inputs over time into a single convergent interpretation of where something is going.",
  ne: "Pattern generation directed outward — surfacing multiple parallel possibilities and connections from a single input.",
  si: "Sensory recall directed inward — referencing prior verified experience and precedent before acting.",
  se: "Sensory engagement directed outward — taking in the present concrete situation and acting on what's available now.",
  ti: "Logical analysis directed inward — testing reasoning against an internal framework of consistency and definition.",
  te: "Logical organization directed outward — structuring effort and evidence against external proof and operational result.",
  fi: "Value discernment directed inward — testing options against personal moral authenticity and integrity.",
  fe: "Value calibration directed outward — sensing relational and social register and what the situation asks of those present.",

  // CC-016 — allocation signals (Compass extension). Direction, not quality.
  self_spending_priority:
    "Allocates discretionary money primarily toward themselves — needs, comforts, savings, well-being.",
  family_spending_priority:
    "Allocates discretionary money primarily toward family — kin, partners, children, parents, chosen kin.",
  friends_spending_priority:
    "Allocates discretionary money primarily toward chosen friends — people they've selected as close.",
  social_spending_priority:
    "Allocates discretionary money primarily toward social experiences — leisure, dining, travel, entertainment.",
  nonprofits_religious_spending_priority:
    "Allocates discretionary money primarily toward civil society and faith communities — charities, NGOs, churches, missions.",
  companies_spending_priority:
    "Allocates discretionary money primarily toward businesses — whether owned, employed by, invested in, or transacted with.",
  building_energy_priority:
    "Allocates discretionary energy primarily toward building or creating — making something new.",
  solving_energy_priority:
    "Allocates discretionary energy primarily toward solving problems — removing dysfunction, debugging, repairing.",
  restoring_energy_priority:
    "Allocates discretionary energy primarily toward restoring order — organizing, maintaining, preserving what works.",
  caring_energy_priority:
    "Allocates discretionary energy primarily toward caring for people — attention, presence, emotional labor.",
  learning_energy_priority:
    "Allocates discretionary energy primarily toward learning — taking in, studying, exploring, making sense.",
  enjoying_energy_priority:
    "Allocates discretionary energy primarily toward enjoying experience — savoring, presence, rest, pleasure.",
  // CC-033 — Q-Ambition1 ranking signals (Path · Gait, Drive cost-bucket
  // refinements). Pursuit-orientation drivers for what success looks like.
  // All four tag "cost" in lib/drive.ts SIGNAL_DRIVE_TAGS. Intentionally NOT
  // added to SACRED_PRIORITY_SIGNAL_IDS — they are Drive-bucket signals,
  // not sacred-value signals.
  success_priority:
    "Pulls toward success — hitting the goals you set, accomplishing what you set out to do — when imagining what winning looks like.",
  fame_priority:
    "Pulls toward fame — recognition, attention, reach beyond the immediate circle — when imagining what winning looks like.",
  wealth_priority:
    "Pulls toward wealth — accumulation as an end, money and assets built and held — when imagining what winning looks like.",
  legacy_priority:
    "Pulls toward legacy — lasting impact, what outlives you in the world or in others — when imagining what winning looks like.",
  // CC-Q1 — Q-O1 ranking signals (direct Openness subtype measurement). Each
  // item maps to one Openness subdimension (intellectual / aesthetic / novelty
  // / aesthetic-emotional facet) plus a low-novelty-preference register that
  // negatively contributes to the Novelty subdim. None tag into Drive
  // distribution per the spec memo §4 binding.
  openness_intellectual:
    "Pulls toward new ideas, models, theories, or frameworks — the intellectual register of openness.",
  openness_aesthetic:
    "Pulls toward new beauty, music, design, language, or atmosphere — the aesthetic register of openness.",
  openness_perspective:
    "Pulls toward new people, cultures, or perspectives — the cross-cutting perspective register of openness.",
  openness_experiential:
    "Pulls toward new experiences, places, tools, or methods — the experiential / novelty register of openness.",
  openness_emotional:
    "Pulls toward new emotional honesty or self-understanding — the inner-feelings register of aesthetic openness.",
  low_novelty_preference:
    "Prefers what is tested, familiar, and proven over novel directions — indexes negatively into the Novelty subdimension and positively into Conscientiousness.",
  // CC-Q1 — Q-O2 ranking signals (direct Emotional Reactivity measurement).
  // When any of these fire, the engine sets `proxyOnly = false` on the ER
  // confidence flag — the proxy disclosure prose stops rendering because
  // direct measurement is now available. The seven items map onto the four
  // canonical reactivity processing modes (composure / analytical / acting-
  // out / avoidant) plus the named-affect registers anxiety and anger.
  low_reactivity_focus:
    "Reports a sharpening / focusing inner state when stakes rise — the low-band emotional-reactivity register, registered as direct measurement rather than proxy.",
  anxious_reactivity:
    "Reports an anxious or restless inner state when stakes rise — the active-worry register of high emotional reactivity.",
  anger_reactivity:
    "Reports an angry or reactive inner state when stakes rise — the outward-charge register of high emotional reactivity.",
  detached_reactivity:
    "Reports a numb, analytical, or detached inner state when stakes rise — the cool-distanced processing register, often proxy-coded for suppression.",
  overwhelmed_functioning:
    "Reports an overwhelmed-but-functional inner state when stakes rise — load-bearing through pressure with the reactivity active.",
  hidden_reactivity:
    "Reports surface composure with intense inner state when stakes rise — the private-reactivity register; affect-channel active but not externally visible.",
  avoidant_reactivity:
    "Reports active avoidance — distraction, escape — when stakes rise; reactivity expressed as motion away from the stakes.",
  // CC-Q2 — Q-GS1 Goal/Soul calibration signals. Direct measurement of
  // what makes a successful effort feel worth it. Each signal feeds Goal
  // composite, Soul composite, Vulnerability composite, or Gripping Pull
  // per spec memo §3 wiring. None tag Drive directly except
  // `security_freedom_signal` (multi-tagged cost+compliance via
  // SIGNAL_DRIVE_TAGS in lib/drive.ts).
  goal_completion_signal:
    "Names the goal being reached — the metric you set, the result you aimed at — as what makes effort feel most worth it.",
  soul_people_signal:
    "Names helping people you care about as what makes effort feel most worth it.",
  soul_calling_signal:
    "Names serving something larger than yourself as what makes effort feel most worth it.",
  gripping_proof_signal:
    "Names proving capability — settling a question about your own capacity — as what makes effort feel most worth it.",
  security_freedom_signal:
    "Names creating security or freedom — financial cushion, optionality, room to choose — as what makes effort feel most worth it.",
  creative_truth_signal:
    "Names expressing something true that needed form — giving structure to something already real inside — as what makes effort feel most worth it.",
  durable_creation_signal:
    "Names creating something beautiful, useful, or durable — the made thing that now exists in the world — as what makes effort feel most worth it.",
  // CC-Q2 — Q-V1 Vulnerability / open-hand register signals. Direct
  // measurement of the user's posture when asked why work matters.
  goal_logic_explanation:
    "Reaches for logic, model, or structure when asked why work matters — the explaining-not-naming register, mild Vulnerability suppression.",
  soul_beloved_named:
    "Names the person, people, or cause served when asked why work matters — strong direct Soul lift; naming-as-vulnerability also lifts Vulnerability composite.",
  vulnerability_open_uncertainty:
    "Stays with open uncertainty when asked why work matters — direct Vulnerability composite lift (not-yet-resolved register).",
  vulnerability_deflection:
    "Deflects the why-question because it feels too personal — direct Vulnerability composite suppression.",
  performance_identity:
    "Points at output rather than naming the why — performance-identity register; suppresses Vulnerability and contributes mildly to Gripping Pull.",
  sacred_belief_connection:
    "Connects work to a belief you'd bear cost to protect — direct Vulnerability composite lift.",
  // CC-Q2 — Q-GRIP1 direct Gripping Pull self-report signals. Each item
  // names a specific thing the user grips under pressure. All eight feed
  // Gripping Pull score + signal list as PRIMARY direct measurement; the
  // existing cluster-fires check stays as a backstop.
  grips_control:
    "Reports gripping control — schedules, decisions, the field — under pressure.",
  grips_security:
    "Reports gripping money or security — moving toward the financial cushion or safer path — under pressure.",
  grips_reputation:
    "Reports gripping reputation — managing standing, optics, position — under pressure.",
  grips_certainty:
    "Reports gripping being right — holding to the answer even when challenged — under pressure.",
  grips_neededness:
    "Reports gripping the role of indispensability — being needed by others — under pressure.",
  grips_comfort:
    "Reports gripping comfort or escape — moving toward the soft register, distraction — under pressure.",
  grips_old_plan:
    "Reports gripping a plan that used to work — running the previously-validated playbook past its season — under pressure.",
  grips_approval:
    "Reports gripping the approval of specific others — tracking the read of people whose disappointment costs — under pressure.",
  // CC-Q3 — Q-3C2 revealed Drive priority signals. Direct measurement of
  // what behavior protects first when life gets crowded. Pairs with Q-3C1
  // (claimed Drive). Drive bucket tags live in lib/drive.ts SIGNAL_DRIVE_TAGS
  // (CC-Q3 extends the table per spec memo §4).
  revealed_cost_priority:
    "Protects money, margin, and financial options first when life gets crowded — revealed Cost-bucket Drive register.",
  revealed_coverage_priority:
    "Protects time and presence with people who depend on you first when life gets crowded — revealed Coverage-bucket Drive register.",
  revealed_compliance_priority:
    "Protects safety, rules, risk control, and avoiding exposure first when life gets crowded — revealed Compliance-bucket Drive register.",
  revealed_goal_priority:
    "Protects progress on the thing you are building first when life gets crowded — revealed Goal-coded direction (split-tagged Cost+Coverage in Drive).",
  revealed_recovery_priority:
    "Protects rest, health, and recovery first when life gets crowded — revealed self-restoration register (split-tagged Compliance+Coverage in Drive).",
  revealed_reputation_priority:
    "Protects reputation or standing with important people first when life gets crowded — revealed Reputation register (asymmetric Cost 75% + Compliance 25% in Drive).",
  // CC-Q4 — Q-L1 Love translation signals. Direct measurement of how the
  // user's love becomes visible to the people closest to them. Pairs with
  // Q-S1 + Q-S2 (sacred-value abstractions); Q-L1 captures the
  // expression-style register that the existing flavor matchers
  // previously inferred from Q-S2 / Q-S3 / Q-X4 indirect signals. Per
  // spec memo §3 wiring, the 7 signals feed existing Love Map flavor
  // predicates as PRIMARY direct measurement.
  love_presence:
    "Names staying present over time — the durability register; love-as-showing-up — as how the people closest to you know you love them.",
  love_problem_solving:
    "Names solving problems that burden them — the practical register; love as removing the heavy thing — as how the people closest to you know you love them.",
  love_verbal_expression:
    "Names saying what they mean to you — the spoken register; love as direct verbal naming — as how the people closest to you know you love them.",
  love_protection:
    "Names protecting them from risk or harm — the guardian register; love as standing-between — as how the people closest to you know you love them.",
  love_co_construction:
    "Names building conditions where they can flourish — the co-construction register; love as ground-making — as how the people closest to you know you love them.",
  love_quiet_sacrifice:
    "Names sacrificing quietly without making it visible — the silent register; love as cost-borne-unnamed — as how the people closest to you know you love them.",
  love_shared_experience:
    "Names creating beauty, humor, or shared experience — the shared-aliveness register; love as moments-alive-together — as how the people closest to you know you love them.",
};

const SACRED_PRIORITY_SIGNAL_IDS: SignalId[] = [
  "freedom_priority",
  "truth_priority",
  "stability_priority",
  "loyalty_priority",
  "family_priority",
  "knowledge_priority",
  "justice_priority",
  "faith_priority",
  "peace_priority", // CC-028
  "honor_priority", // CC-028
  "compassion_priority", // CC-028
  "mercy_priority", // CC-028
];

function strengthForRank(rank: number): "high" | "medium" | "low" {
  if (rank <= 1) return "high";
  if (rank <= 2) return "medium";
  return "low";
}

// Mirrors the `Strengtheners:` field declared in docs/canon/tension-library-v1.md.
// Only freeform signals are eligible in CC-004. See docs/canon/signal-and-tension-model.md § Strengtheners.
const STRENGTHENERS: Record<string, SignalId[]> = {
  "T-001": ["conviction_under_cost"],
  "T-002": ["conviction_under_cost"],
};

function signalFromAnswer(a: Answer): Signal | null {
  if (a.type !== "forced") return null;
  const q = questions.find((q) => q.question_id === a.question_id);
  if (!q || q.type !== "forced") return null;
  const opt = q.options.find((o) => o.label === a.response);
  if (!opt || !opt.signal) return null;
  return {
    signal_id: opt.signal,
    description: SIGNAL_DESCRIPTIONS[opt.signal] ?? opt.signal,
    from_card: q.card_id,
    source_question_ids: [q.question_id],
    strength: "medium",
  };
}

export function signalsFromRankingAnswer(answer: Answer): Signal[] {
  if (answer.type !== "ranking") return [];
  const q = questions.find((q) => q.question_id === answer.question_id);
  if (!q || q.type !== "ranking") return [];
  const out: Signal[] = [];
  answer.order.forEach((itemId, position) => {
    const item = q.items.find((i) => i.id === itemId);
    if (!item || !item.signal) return;
    const rank = position + 1;
    out.push({
      signal_id: item.signal,
      description: SIGNAL_DESCRIPTIONS[item.signal] ?? item.signal,
      from_card: q.card_id,
      source_question_ids: [q.question_id],
      strength: strengthForRank(rank),
      rank,
    });
  });
  return out;
}

export function extractFreeformSignals(answer: Answer): Signal[] {
  if (answer.type !== "freeform") return [];
  const text = answer.response.toLowerCase();
  const signals: Signal[] = [];

  if (text.includes("disagree") || text.includes("people around me")) {
    signals.push({
      signal_id: "independent_thought_signal",
      description: "tends to hold beliefs that differ from those around them",
      from_card: answer.card_id,
      source_question_ids: [answer.question_id],
      strength: "medium",
    });
  }

  if (
    text.includes("change my mind") ||
    text.includes("evidence") ||
    text.includes("proof")
  ) {
    signals.push({
      signal_id: "epistemic_flexibility",
      description: "open to changing beliefs when presented with evidence",
      from_card: answer.card_id,
      source_question_ids: [answer.question_id],
      strength: "medium",
    });
  }

  if (
    text.includes("lost") ||
    text.includes("cost") ||
    text.includes("risk") ||
    text.includes("job") ||
    text.includes("friends")
  ) {
    signals.push({
      signal_id: "conviction_under_cost",
      description: "has experienced cost for holding a belief",
      from_card: answer.card_id,
      source_question_ids: [answer.question_id],
      strength: "medium",
    });
  }

  return signals;
}

// CC-016 — emit signals from a derived (cross-rank) ranking. Each item
// emits one Signal carrying:
//   - signal_id: same id as the parent ranking would have produced
//   - cross_rank: the cross-rank position (1, 2, 3, or 4)
//   - rank: undefined (cross-ranks don't have within-domain rank)
//   - source_question_ids: [parentQuestionId, derivedQuestionId]
//   - strength: high if cross_rank ≤ 1, medium if ≤ 2, low otherwise
export function signalsFromDerivedRanking(answer: Answer): Signal[] {
  if (answer.type !== "ranking_derived") return [];
  const out: Signal[] = [];
  answer.order.forEach((itemId, position) => {
    const source = answer.derived_item_sources.find((s) => s.id === itemId);
    if (!source) return;
    const crossRank = position + 1;
    const strength =
      crossRank <= 1 ? "high" : crossRank <= 2 ? "medium" : "low";
    out.push({
      signal_id: source.signal,
      description: SIGNAL_DESCRIPTIONS[source.signal] ?? source.signal,
      from_card: answer.card_id,
      source_question_ids: [source.source_question_id, answer.question_id],
      strength,
      cross_rank: crossRank,
    });
  });
  return out;
}

// CC-017 — emit signals from a multi-select derived answer (Q-I2 / Q-I3).
// Each user-selected derived item emits one Signal carrying:
//   - signal_id: the original signal_id from the source question's item
//   - source_question_ids: [source_question_id, answer.question_id]
//   - from_card: the answer's card_id
//   - strength: medium (selection is a structural fact, not a ranked weight)
// "None" and "other" sentinels do NOT emit content signals — they emit
// MetaSignals via collectMultiSelectMetaSignals (called from
// buildInnerConstitution). Other-text is stored on the answer but NEVER
// text-mined; the architectural commitment is that the engine moves away
// from text-mining of belief content.
export function signalsFromMultiSelectDerived(answer: Answer): Signal[] {
  if (answer.type !== "multiselect_derived") return [];
  const out: Signal[] = [];
  for (const sel of answer.selections) {
    if (!sel.signal || !sel.source_question_id) continue; // skip "none"/"other"
    out.push({
      signal_id: sel.signal,
      description: SIGNAL_DESCRIPTIONS[sel.signal] ?? sel.signal,
      from_card: answer.card_id,
      source_question_ids: [sel.source_question_id, answer.question_id],
      strength: "medium",
    });
  }
  return out;
}

export function signalFromSinglePick(answer: SinglePickAnswer): Signal {
  return {
    signal_id: answer.picked_signal,
    description:
      SIGNAL_DESCRIPTIONS[answer.picked_signal] ?? answer.picked_signal,
    from_card: answer.card_id,
    source_question_ids: [answer.question_id],
    strength: "high",
    rank: 1,
  };
}

export function deriveSignals(answers: Answer[]): Signal[] {
  const out: Signal[] = [];
  for (const a of answers) {
    if (a.type === "ranking") {
      out.push(...signalsFromRankingAnswer(a));
      continue;
    }
    if (a.type === "freeform") {
      if (a.response.trim().length > 0) {
        out.push(...extractFreeformSignals(a));
      }
      continue;
    }
    if (a.type === "single_pick") {
      out.push(signalFromSinglePick(a));
      continue;
    }
    if (a.type === "ranking_derived") {
      out.push(...signalsFromDerivedRanking(a));
      continue;
    }
    if (a.type === "multiselect_derived") {
      out.push(...signalsFromMultiSelectDerived(a));
      continue;
    }
    const s = signalFromAnswer(a);
    if (s) out.push(s);
  }
  return out;
}

function has(signals: Signal[], id: SignalId): boolean {
  return signals.some((s) => s.signal_id === id);
}

function hasFromQuestion(
  signals: Signal[],
  id: SignalId,
  question_id: string
): boolean {
  return signals.some(
    (s) =>
      s.signal_id === id && s.source_question_ids.includes(question_id)
  );
}

function hasAtRank(
  signals: Signal[],
  id: SignalId,
  maxRank: number
): boolean {
  return signals.some(
    (s) =>
      s.signal_id === id && s.rank !== undefined && s.rank <= maxRank
  );
}

// CC-016 — true when at least one signal with this id was emitted from the
// given derived/cross-rank question at cross_rank ≤ maxCrossRank.
function hasAtCrossRank(
  signals: Signal[],
  id: SignalId,
  fromQuestionId: string,
  maxCrossRank: number
): boolean {
  return signals.some(
    (s) =>
      s.signal_id === id &&
      s.cross_rank !== undefined &&
      s.cross_rank <= maxCrossRank &&
      s.source_question_ids.includes(fromQuestionId)
  );
}

// CC-016 — list ids that are present in the cross-rank with cross_rank ≤ N
// from the given derived question.
function topCrossRankIds(
  signals: Signal[],
  fromQuestionId: string,
  maxCrossRank: number
): SignalId[] {
  const ids: SignalId[] = [];
  for (const s of signals) {
    if (
      s.cross_rank !== undefined &&
      s.cross_rank <= maxCrossRank &&
      s.source_question_ids.includes(fromQuestionId) &&
      !ids.includes(s.signal_id)
    ) {
      ids.push(s.signal_id);
    }
  }
  return ids;
}

function cardFor(signals: Signal[], id: SignalId): CardId | undefined {
  return signals.find((s) => s.signal_id === id)?.from_card;
}

function ref(signals: Signal[], id: SignalId, fallback: CardId) {
  return { signal_id: id, from_card: cardFor(signals, id) ?? fallback };
}

// ── CC-060 — Allocation Gap 3C's bucket-keyed sharp questions (Rule 4) ──
//
// Per CC-048 Rule 4, allocation tension prompts (T-013/T-014/T-015) must
// name the sharper 3C's-specific question rather than retreating to multi-
// disclaimer hedging. The selector reads the user's Drive bucket lean and
// composes one of 4 locked sharp questions per tension (cost / coverage /
// compliance / balanced).
//
// Drive case-key verification note (CC-060 deviation flagged in Report
// Back): the engine's `DriveCase` type emits matrix-tension cases
// (aligned / inverted-* / partial-mismatch / balanced / unstated), NOT
// the bucket-lean cases the CC-060 prompt assumed (cost-leaning / etc.).
// `classifyAllocationBucket` therefore reads `drive.distribution`
// percentages directly — same pattern `lib/workMap.ts § isCostLeaning`
// and `lib/loveMap.ts § isCostLeaning` use. Threshold ≥ 38% with
// max-bucket-wins, balanced fallback when no bucket clears the threshold
// or when drive is undefined.

type AllocationTensionId = "T-013" | "T-014" | "T-015";
type AllocationBucketCase = "cost" | "coverage" | "compliance" | "balanced";

const ALLOCATION_BUCKET_LEAN_THRESHOLD = 38;

function classifyAllocationBucket(
  driveOutput: DriveOutput | undefined
): AllocationBucketCase {
  if (!driveOutput) return "balanced";
  const d = driveOutput.distribution;
  if (
    d.cost >= d.coverage &&
    d.cost >= d.compliance &&
    d.cost >= ALLOCATION_BUCKET_LEAN_THRESHOLD
  ) {
    return "cost";
  }
  if (
    d.coverage >= d.cost &&
    d.coverage >= d.compliance &&
    d.coverage >= ALLOCATION_BUCKET_LEAN_THRESHOLD
  ) {
    return "coverage";
  }
  if (
    d.compliance >= d.cost &&
    d.compliance >= d.coverage &&
    d.compliance >= ALLOCATION_BUCKET_LEAN_THRESHOLD
  ) {
    return "compliance";
  }
  return "balanced";
}

const ALLOCATION_SHARP_QUESTIONS: Record<
  AllocationTensionId,
  Record<AllocationBucketCase, string>
> = {
  "T-013": {
    cost: "The question for your shape is sharper than 'do you donate enough to ${value} causes.' It is whether your protected hours, creative output, and strategic attention are moving toward what ${value} would actually require — or whether maintenance is consuming the resources that were supposed to build that.",
    coverage: "The question for your shape is sharper than 'do you give enough to ${value} causes.' It is whether the people through whom ${value} actually shows up — the ones you spend relational presence on, the ones whose lives your money lands inside — are the people ${value} would name if it could choose for itself, or whether the relational gravity has settled somewhere else.",
    compliance: "The question for your shape is sharper than 'do you donate enough to ${value} causes.' It is whether the risks you actually protect against, and the protections you actually fund, are aligned with what ${value} says is worth losing sleep over — or whether your risk register has drifted toward the threats your shape is wired to over-rate.",
    balanced: "The question for your shape is whether ${value}, named as one of your most sacred values, is actually getting any meaningful share of the resources that compose a life — money, time, attention, presence — or whether it sits in the named-but-unfunded register that almost every adult life has, and that almost every adult life regrets in the long arc.",
  },
  "T-014": {
    cost: "The question for your shape is sharper than 'are you spending energy on the right cause.' It is whether your best hours — the ones where attention compounds — are moving toward ${value}, or whether ${value} is what you intend to get to once the maintenance load lets up. The candidate move: give ${value} a scheduled claim on the best hour you reliably control, not only the leftover hour.",
    coverage: "The question for your shape is sharper than 'are you spending energy on the right cause.' It is whether the relational presence ${value} would actually require — sustained attention to specific people whose lives ${value} would have you tend — is what your discretionary energy lands on, or whether it lands on the broader-but-thinner register of being-near-many. The candidate move: name one specific person ${value} would have you give your best energy to this season, and check whether that person actually gets it.",
    compliance: "The question for your shape is sharper than 'are you spending energy on the right cause.' It is whether the watchful, protective, holding-against-bad-outcomes work that ${value} would have you do is where your discretionary energy actually lands, or whether it lands on lower-stakes vigilance that the same wiring also rewards. The candidate move: ask which protection ${value} most wants from you this season, and give it the best of what you have.",
    balanced: "The question for your shape is whether ${value}, named as central, is getting any of your best energy at all — or whether the energy ${value} is supposed to organize is getting absorbed by everything else and arriving to ${value} in whatever shape leftover allows. The candidate move: give ${value} a scheduled claim on your best energy, not only your leftover energy.",
  },
  "T-015": {
    cost: "The question for your shape, across multiple allocation domains, is sharper than 'are your stated and lived priorities aligned.' It is whether the protected hours, creative output, and strategic attention you control are moving toward the kind of life you'd build if you were building it on purpose — or whether maintenance, obligation, and inertia are consuming the resources that were supposed to build that. Does this feel true, partially true, or not true at all?",
    coverage: "The question for your shape, across multiple allocation domains, is sharper than 'are your stated and lived priorities aligned.' It is whether the people, communities, and relationships you actually invest in are the ones a life-built-on-purpose would invest in — or whether the relational gravity has settled onto people the present demands rather than people the future would have you stay close to. Does this feel true, partially true, or not true at all?",
    compliance: "The question for your shape, across multiple allocation domains, is sharper than 'are your stated and lived priorities aligned.' It is whether the protections you fund, the risks you actually mitigate, and the threats you actually hold against are calibrated to the life you'd build on purpose — or whether your risk register is shaped more by the threats your wiring over-rates than by the threats a clear-eyed read would actually flag. Does this feel true, partially true, or not true at all?",
    balanced: "The question for your shape, across multiple allocation domains, is whether the lived shape of your week — money, time, attention, relational presence, risk-protection — is the shape of the life you'd build if you were building it on purpose, or whether it's the shape that emerged from a long sequence of adjacent reasonable choices. The honest read is rarely all-aligned and rarely all-misaligned; it's specific. Does this feel true, partially true, or not true at all?",
  },
};

export function getAllocationSharpQuestion(
  tensionId: AllocationTensionId,
  valueLabel: string,
  driveOutput: DriveOutput | undefined
): string {
  const bucket = classifyAllocationBucket(driveOutput);
  const template = ALLOCATION_SHARP_QUESTIONS[tensionId][bucket];
  return template.replace(/\$\{value\}/g, valueLabel);
}

export function detectTensions(
  signals: Signal[],
  driveOutput?: DriveOutput
): Tension[] {
  const tensions: Tension[] = [];

  if (has(signals, "truth_priority_high") && has(signals, "adapts_under_social_pressure")) {
    tensions.push({
      tension_id: "T-001",
      type: "Truth vs Belonging",
      description:
        "The user values truth, but may soften or withhold it when relationships are at risk.",
      signals_involved: [
        ref(signals, "truth_priority_high", "conviction"),
        ref(signals, "adapts_under_social_pressure", "pressure"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: you value truth, but adapt when social cost is high. Does this feel accurate?",
    });
  }

  const hasConvictionLeft =
    has(signals, "truth_priority_high") || has(signals, "strong_independent_conviction");
  const hasEconomicAdapt =
    has(signals, "adapts_under_economic_pressure") || has(signals, "hides_belief");
  if (hasConvictionLeft && hasEconomicAdapt) {
    tensions.push({
      tension_id: "T-002",
      type: "Conviction vs Economic Security",
      description:
        "The user may hold strong beliefs internally while limiting expression when financial security is at risk.",
      signals_involved: [
        has(signals, "truth_priority_high")
          ? ref(signals, "truth_priority_high", "conviction")
          : ref(signals, "strong_independent_conviction", "conviction"),
        has(signals, "adapts_under_economic_pressure")
          ? ref(signals, "adapts_under_economic_pressure", "pressure")
          : ref(signals, "hides_belief", "pressure"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: your convictions may remain intact internally, but become more private when economic risk rises. Does this feel accurate?",
    });
  }

  if (
    hasAtRank(signals, "stability_priority", 2) &&
    hasAtRank(signals, "freedom_priority", 2)
  ) {
    tensions.push({
      tension_id: "T-005",
      type: "Stability vs Freedom",
      description:
        "The user values freedom, but current responsibilities or stability needs may constrain how freely they can act.",
      signals_involved: [
        ref(signals, "stability_priority", "sacred"),
        ref(signals, "freedom_priority", "sacred"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: you value freedom, but your responsibilities or need for stability may limit how much freedom you can actually choose. Does this feel accurate?",
    });
  }

  const aspirationCreator = hasFromQuestion(signals, "proactive_creator", "Q-A2");
  const currentMaintainer = hasFromQuestion(
    signals,
    "responsibility_maintainer",
    "Q-A1"
  );
  const currentReactive = hasFromQuestion(signals, "reactive_operator", "Q-A1");
  if (aspirationCreator && (currentMaintainer || currentReactive)) {
    const rightId = currentMaintainer
      ? "responsibility_maintainer"
      : "reactive_operator";
    tensions.push({
      tension_id: "T-006",
      type: "Creator vs Maintainer",
      description:
        "The user may see themselves as a builder or creator, while current life demands keep them in maintenance or reaction mode.",
      signals_involved: [
        ref(signals, "proactive_creator", "agency"),
        ref(signals, rightId, "agency"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: part of you wants to build, but much of your life may be spent maintaining or reacting. Does this feel accurate?",
    });
  }

  if (
    hasAtRank(signals, "family_priority", 2) &&
    (hasAtRank(signals, "truth_priority", 2) ||
      has(signals, "truth_priority_high"))
  ) {
    const rightId = has(signals, "truth_priority_high")
      ? "truth_priority_high"
      : "truth_priority";
    const rightCard: CardId =
      rightId === "truth_priority_high" ? "conviction" : "sacred";
    tensions.push({
      tension_id: "T-007",
      type: "Family vs Truth",
      description:
        "The user may experience tension when protecting family conflicts with speaking or pursuing truth.",
      signals_involved: [
        ref(signals, "family_priority", "sacred"),
        ref(signals, rightId, rightCard),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: family and truth both matter deeply to you, and there may be moments where protecting one feels like risking the other. Does this feel accurate?",
    });
  }

  const t008Right =
    hasAtRank(signals, "freedom_priority", 2) ||
    has(signals, "proactive_creator");
  if (hasAtRank(signals, "stability_priority", 2) && t008Right) {
    const rightId = hasAtRank(signals, "freedom_priority", 2)
      ? "freedom_priority"
      : "proactive_creator";
    const rightCard: CardId =
      rightId === "freedom_priority" ? "sacred" : "agency";
    tensions.push({
      tension_id: "T-008",
      type: "Order vs Reinvention",
      description:
        "The user may value order and stability while also wanting freedom to create or reinvent.",
      signals_involved: [
        ref(signals, "stability_priority", "sacred"),
        ref(signals, rightId, rightCard),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: you may want stable structures, but also resist structures that prevent reinvention. Does this feel accurate?",
    });
  }

  if (
    has(signals, "stability_baseline_high") &&
    (has(signals, "high_pressure_context") || has(signals, "reactive_operator"))
  ) {
    const rightId = has(signals, "high_pressure_context")
      ? "high_pressure_context"
      : "reactive_operator";
    const rightCard: CardId =
      rightId === "high_pressure_context" ? "context" : "agency";
    tensions.push({
      tension_id: "T-010",
      type: "Inherited Stability vs Present Chaos",
      description:
        "The user may have been formed in stability but currently lives under pressure, overload, or constant reaction.",
      signals_involved: [
        ref(signals, "stability_baseline_high", "formation"),
        ref(signals, rightId, rightCard),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: you may have a strong internal expectation for stability, while your current life feels more pressured or reactive. Does this feel accurate?",
    });
  }

  if (
    has(signals, "chaos_exposure") &&
    (has(signals, "order_priority") || has(signals, "stability_priority"))
  ) {
    const rightId = has(signals, "order_priority")
      ? "order_priority"
      : "stability_priority";
    const rightCard: CardId = rightId === "order_priority" ? "conviction" : "sacred";
    tensions.push({
      tension_id: "T-011",
      type: "Chaos Formation vs Control Need",
      description:
        "The user may value order or stability partly because early life felt uncertain or chaotic.",
      signals_involved: [
        ref(signals, "chaos_exposure", "formation"),
        ref(signals, rightId, rightCard),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: your desire for order may be connected to earlier experiences of uncertainty. Does this feel accurate?",
    });
  }

  const topSacred = signals.filter(
    (s) =>
      SACRED_PRIORITY_SIGNAL_IDS.includes(s.signal_id) &&
      s.rank !== undefined &&
      s.rank <= 2
  );
  const distinctTopSacredIds = Array.from(
    new Set(topSacred.map((s) => s.signal_id))
  );
  if (distinctTopSacredIds.length >= 2) {
    const seen = new Set<string>();
    const involved = topSacred.filter((s) => {
      if (seen.has(s.signal_id)) return false;
      seen.add(s.signal_id);
      return true;
    });
    tensions.push({
      tension_id: "T-012",
      // CC-025 Step 2.5A — descriptive UI name per spec table.
      type: "Sacred Values in Conflict",
      description:
        "The user may hold multiple sacred values that cannot always be protected at the same time.",
      signals_involved: involved.slice(0, 4).map((s) => ({
        signal_id: s.signal_id,
        from_card: s.from_card,
      })),
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt:
        "This pattern may be present: some of your deepest values may come into conflict when life forces a tradeoff. Does this feel accurate?",
    });
  }

  // ── CC-016 — Allocation tensions (T-013, T-014, T-015) ────────────────
  // Bound by docs/canon/allocation-rules.md: direction not quality, non-
  // accusatory framing, hedging vocabulary, gap descriptive not prescriptive.

  // Value → spending mapping (T-013). Approximate; surface in prose as such.
  const VALUE_TO_SPENDING: Record<string, SignalId[]> = {
    family_priority: ["family_spending_priority"],
    faith_priority: ["nonprofits_religious_spending_priority"],
    justice_priority: [
      "nonprofits_religious_spending_priority",
      "social_spending_priority",
    ],
    knowledge_priority: [
      "social_spending_priority",
      "companies_spending_priority",
    ],
  };

  for (const [valueSignal, spendingMatches] of Object.entries(
    VALUE_TO_SPENDING
  )) {
    if (!hasAtRank(signals, valueSignal, 1)) continue;
    const matchingInTop2 = spendingMatches.some((sp) =>
      hasAtCrossRank(signals, sp, "Q-S3-cross", 2)
    );
    const crossRankExists = signals.some(
      (s) => s.source_question_ids.includes("Q-S3-cross") && s.cross_rank !== undefined
    );
    if (!crossRankExists) continue; // can't evaluate gap if user skipped allocation flow
    if (matchingInTop2) continue;
    const topSpending = topCrossRankIds(signals, "Q-S3-cross", 2);
    tensions.push({
      tension_id: "T-013",
      type: "Sacred Words vs Sacred Spending",
      description:
        "The model reads a gap between a top sacred value and where discretionary money appears to flow.",
      signals_involved: [
        ref(signals, valueSignal, "sacred"),
        ...topSpending.map((id) => ref(signals, id, "sacred")),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      // CC-060 — Rule 4 closure. Replaces the CC-025 multi-disclaimer block
      // with a bucket-keyed sharp question (cost / coverage / compliance /
      // balanced) composed via getAllocationSharpQuestion. Prefix preserved
      // verbatim; 3-state question close preserved verbatim.
      user_prompt: `You named ${VALUE_LABEL_HUMAN[valueSignal] ?? valueSignal} as among your most sacred values. Your money appears to flow mostly to ${humanizeSignalIds(topSpending) || "categories the model couldn't read confidently"}.\n\n${getAllocationSharpQuestion("T-013", VALUE_LABEL_HUMAN[valueSignal] ?? valueSignal, driveOutput)}\n\nDoes this feel true, partially true, or not true at all?`,
    });
    break; // one T-013 instance per session
  }

  // T-014 — Sacred Words vs Spent Energy. Looser mapping.
  const VALUE_TO_ENERGY: Record<string, SignalId[]> = {
    truth_priority: ["learning_energy_priority", "solving_energy_priority"],
    family_priority: ["caring_energy_priority"],
    justice_priority: ["solving_energy_priority", "caring_energy_priority"],
    knowledge_priority: [
      "learning_energy_priority",
      "building_energy_priority",
    ],
    freedom_priority: ["building_energy_priority", "enjoying_energy_priority"],
    stability_priority: [
      "restoring_energy_priority",
      "caring_energy_priority",
    ],
  };

  for (const [valueSignal, energyMatches] of Object.entries(
    VALUE_TO_ENERGY
  )) {
    if (!hasAtRank(signals, valueSignal, 1)) continue;
    const matchingInTop2 = energyMatches.some((sp) =>
      hasAtCrossRank(signals, sp, "Q-E1-cross", 2)
    );
    const crossRankExists = signals.some(
      (s) => s.source_question_ids.includes("Q-E1-cross") && s.cross_rank !== undefined
    );
    if (!crossRankExists) continue;
    if (matchingInTop2) continue;
    const topEnergy = topCrossRankIds(signals, "Q-E1-cross", 2);
    tensions.push({
      tension_id: "T-014",
      // CC-025 Step 2.5A — descriptive UI name "Words and Energy" per spec.
      type: "Words and Energy",
      description:
        "The model reads a gap between a top sacred value and where discretionary energy appears to flow.",
      signals_involved: [
        ref(signals, valueSignal, "sacred"),
        ...topEnergy.map((id) => ref(signals, id, "sacred")),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      // CC-060 — Rule 4 closure. Replaces the CC-025 multi-disclaimer block
      // with a bucket-keyed sharp question (cost / coverage / compliance /
      // balanced) composed via getAllocationSharpQuestion. Each T-014
      // template embeds its own "The candidate move:" close (T-014 is the
      // one tension that ends with a candidate move rather than the 3-state
      // question), so no separate close is appended here. Prefix preserved
      // verbatim.
      user_prompt: `You named ${VALUE_LABEL_HUMAN[valueSignal] ?? valueSignal} as among your most sacred values. Your discretionary energy appears to flow mostly to ${humanizeSignalIds(topEnergy) || "categories the model couldn't read confidently"}.\n\n${getAllocationSharpQuestion("T-014", VALUE_LABEL_HUMAN[valueSignal] ?? valueSignal, driveOutput)}`,
    });
    break;
  }

  // T-015 detection moved to detectAllocationOverlayTensions; see below.

  return tensions;
}

// CC-016 — humanize a list of signal ids using the descriptive labels.
const VALUE_LABEL_HUMAN: Record<string, string> = {
  truth_priority: "Truth",
  freedom_priority: "Freedom",
  loyalty_priority: "Loyalty",
  justice_priority: "Justice",
  faith_priority: "Faith",
  stability_priority: "Stability",
  knowledge_priority: "Knowledge",
  family_priority: "Family",
};

const SPENDING_ENERGY_LABEL_HUMAN: Record<string, string> = {
  self_spending_priority: "yourself",
  family_spending_priority: "family",
  friends_spending_priority: "friends",
  social_spending_priority: "social experiences",
  nonprofits_religious_spending_priority: "non-profits and religious communities",
  companies_spending_priority: "companies",
  building_energy_priority: "building",
  solving_energy_priority: "solving problems",
  restoring_energy_priority: "restoring order",
  caring_energy_priority: "caring for people",
  learning_energy_priority: "learning",
  enjoying_energy_priority: "enjoying experience",
};

function humanizeSignalIds(ids: SignalId[]): string {
  const labels = ids.map((id) => SPENDING_ENERGY_LABEL_HUMAN[id] ?? id);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

// CC-016 — T-015: Current vs Aspirational Allocation. Detected from the
// per-category overlay markers (the overlay isn't a Signal, it lives on the
// answer object). This runs as a separate pass over answers in
// buildInnerConstitution. Returns 0+ T-015 tensions, one per parent ranking
// where ≥2 of the 3 items have a non-`right` overlay.
// CC-016 — surface the per-allocation-ranking overlays into the
// InnerConstitution so the renderer can read them without re-walking answers.
function collectAllocationOverlays(
  answers: Answer[]
): InnerConstitution["allocation_overlays"] {
  const out: NonNullable<InnerConstitution["allocation_overlays"]> = {};
  for (const a of answers) {
    if (a.type !== "ranking" || !a.overlay) continue;
    if (a.question_id === "Q-S3-close") out.money_close = a.overlay;
    else if (a.question_id === "Q-S3-wider") out.money_wider = a.overlay;
    else if (a.question_id === "Q-E1-outward") out.energy_outward = a.overlay;
    else if (a.question_id === "Q-E1-inward") out.energy_inward = a.overlay;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

// CC-016b — synthesis labels for the T-015 multi-fire collapse. When 3+
// rankings trigger T-015 in one session, we emit a single synthesis tension
// that names the broader pattern instead of repeating the per-ranking framing.
const T015_RANKING_LABELS: Record<string, string> = {
  "Q-S3-close": "your discretionary money among the people closest to you",
  "Q-S3-wider": "your discretionary money beyond your immediate circle",
  "Q-E1-outward": "your outward, generative energy",
  "Q-E1-inward": "your inward, relational energy",
};

const T015_SYNTHESIS_LABELS: Record<string, string> = {
  "Q-S3-close": "how money flows close to home",
  "Q-S3-wider": "where your money goes beyond your immediate circle",
  "Q-E1-outward": "where your outward energy lands",
  "Q-E1-inward": "where your inward energy lands",
};

function joinSynthesisLabels(qids: string[]): string {
  const labels = qids
    .map((q) => T015_SYNTHESIS_LABELS[q])
    .filter((l): l is string => !!l);
  if (labels.length === 0) return "multiple allocation domains";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

// CC-017 — emit per-question "None of these" MetaSignals from multi-select
// derived answers. Q-I2 with `none_selected: true` → belief_impervious;
// Q-I3 with `none_selected: true` → belief_no_cost_named.
function collectMultiSelectMetaSignals(answers: Answer[]): MetaSignal[] {
  const out: MetaSignal[] = [];
  for (const a of answers) {
    if (a.type !== "multiselect_derived") continue;
    if (!a.none_selected) continue;
    if (a.question_id === "Q-I2") {
      out.push({
        type: "belief_impervious",
        question_id: a.question_id,
        card_id: a.card_id,
        recorded_at: Date.now(),
      });
    } else if (a.question_id === "Q-I3") {
      out.push({
        type: "belief_no_cost_named",
        question_id: a.question_id,
        card_id: a.card_id,
        recorded_at: Date.now(),
      });
    }
  }
  return out;
}

function detectAllocationOverlayTensions(
  answers: Answer[],
  driveOutput?: DriveOutput
): Tension[] {
  // Pass 1 — collect the rankings that would each fire a per-instance T-015.
  const triggeringQids: string[] = [];
  for (const a of answers) {
    if (a.type !== "ranking") continue;
    if (!a.overlay) continue;
    if (!T015_RANKING_LABELS[a.question_id]) continue;
    const nonRight = Object.entries(a.overlay).filter(
      ([, v]) => v === "wish_less" || v === "wish_more"
    );
    if (nonRight.length < 2) continue;
    triggeringQids.push(a.question_id);
  }

  if (triggeringQids.length === 0) return [];

  // CC-016b + CC-025 Step 2.5B — synthesis/collapse path: when 2+ rankings
  // trigger, emit one T-015 naming the broader pattern instead of repeating
  // per-ranking prose. Below CC-025 the threshold was 3+; the dual T-015
  // (outward + inward) entries that collided in real-user output are now
  // collapsed at the engine layer rather than the render layer.
  if (triggeringQids.length >= 2) {
    return [
      {
        tension_id: "T-015",
        type: "Current and Aspirational Allocation",
        description:
          "Two or more allocation rankings carried the user's own non-`right` overlay markers — the gap between current and aspirational lives across multiple domains rather than one.",
        signals_involved: triggeringQids.map((q) => ({
          signal_id: q,
          from_card: "sacred",
        })),
        confidence: "medium",
        status: "unconfirmed",
        strengthened_by: [],
        // CC-060 — Rule 4 closure (synthesis variant). T-015 templates do not
        // interpolate ${value}; pass empty string. 3-state question close is
        // embedded in each locked T-015 template, so no separate close.
        user_prompt: `Across multiple allocation domains, you marked categories where the current flow doesn't match what you wish. The gap shows up in ${joinSynthesisLabels(triggeringQids)}.\n\n${getAllocationSharpQuestion("T-015", "", driveOutput)}`,
      },
    ];
  }

  // Single-instance path — one T-015 per single triggering ranking. With the
  // collapse threshold at 2+, this only fires when exactly one allocation
  // ranking carried the non-`right` overlay markers.
  return triggeringQids.map((qid) => {
    const label = T015_RANKING_LABELS[qid];
    return {
      tension_id: "T-015",
      // CC-025 Step 2.5A — descriptive name aligned across per-instance and
      // synthesis variants ("Current and Aspirational Allocation").
      type: "Current and Aspirational Allocation",
      description:
        "The user marked at least two categories within a single allocation ranking where the current flow doesn't match what they wish.",
      signals_involved: [],
      confidence: "high",
      status: "unconfirmed",
      strengthened_by: [],
      // CC-060 — Rule 4 closure (per-instance variant). Same pattern as the
      // synthesis variant above; T-015 templates do not interpolate ${value}.
      // 3-state question close is embedded in each locked T-015 template.
      user_prompt: `When you ranked ${label}, you marked at least two categories where the current flow doesn't match what you wish.\n\n${getAllocationSharpQuestion("T-015", "", driveOutput)}`,
    };
  });
}

// ── CC-064 — T-016 Value vs Institutional Trust Gap ─────────────────────
//
// Fires when a sacred value ranks Compass top-3 while its analog
// institutional-trust signal does NOT rank in the user's top-3 trusted
// institutions. Each fired pair produces a distinct T-016 instance so the
// Open Tensions UI can render each gap independently. Faith is excluded
// per CC-054's Faith Shape coverage; the (faith_priority +
// religious_trust_priority) gap is handled prose-side in deriveCompassOutput.
//
// Locked content per the CC-064 prompt; tonal calibration is a separate
// authorship pass.

type ValueInstitutionTrustPair = {
  value_signal: SignalId;
  value_label: string;
  institution_signal: SignalId;
  institution_label: string;
  locked_user_prompt: string;
};

const VALUE_INSTITUTION_TRUST_PAIRS: ValueInstitutionTrustPair[] = [
  {
    value_signal: "knowledge_priority",
    value_label: "Knowledge",
    institution_signal: "education_trust_priority",
    institution_label: "Education",
    locked_user_prompt:
      "You named Knowledge among your most sacred values, yet Education does not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that claim to embody it. The tension may be: where do you locate Knowledge if not in education's institutional form, and what does that ask of you in how you keep the value alive? Does this feel true, partially true, or not true at all?",
  },
  {
    value_signal: "truth_priority",
    value_label: "Truth",
    institution_signal: "journalism_trust_priority",
    institution_label: "Journalism",
    locked_user_prompt:
      "You named Truth among your most sacred values, yet Journalism does not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that publicly claim its mantle. The tension may be: who do you actually turn to when truth is at stake, and what does it mean that the institutions named for it didn't earn your trust? Does this feel true, partially true, or not true at all?",
  },
  {
    value_signal: "justice_priority",
    value_label: "Justice",
    institution_signal: "government_elected_trust_priority",
    institution_label: "Government",
    locked_user_prompt:
      "You named Justice among your most sacred values, yet Government does not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that claim to deliver it. The tension may be: where do you locate Justice if not in the government's institutional form, and what does that ask of you in how you live the value? Does this feel true, partially true, or not true at all?",
  },
  {
    value_signal: "stability_priority",
    value_label: "Stability",
    institution_signal: "government_services_trust_priority",
    institution_label: "Government Services",
    locked_user_prompt:
      "You named Stability among your most sacred values, yet Government Services do not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the structures meant to provide it. The tension may be: where do you locate Stability if not in the institutions named for it, and what does that ask of you in how you build it for yourself and the people closest to you? Does this feel true, partially true, or not true at all?",
  },
  {
    value_signal: "compassion_priority",
    value_label: "Compassion",
    institution_signal: "nonprofits_trust_priority",
    institution_label: "Non-Profits",
    locked_user_prompt:
      "You named Compassion among your most sacred values, yet Non-Profits do not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that organize themselves around it. The tension may be: where do you locate Compassion as a lived practice when the institutional forms haven't earned the trust the value would require? Does this feel true, partially true, or not true at all?",
  },
  {
    value_signal: "mercy_priority",
    value_label: "Mercy",
    institution_signal: "religious_trust_priority",
    institution_label: "Religious institutions",
    locked_user_prompt:
      "You named Mercy among your most sacred values, yet Religious institutions do not appear among the institutions you trust most. That's not a contradiction — but it's worth naming. You may hold the value sacred while distrusting the institutions that publicly claim it. The tension may be: where do you locate Mercy when the institutions that name it haven't earned the trust the value would require, and what does that ask of you in how the value gets lived rather than only believed? Does this feel true, partially true, or not true at all?",
  },
];

export function detectValueInstitutionalTrustGap(signals: Signal[]): Tension[] {
  const out: Tension[] = [];
  for (const pair of VALUE_INSTITUTION_TRUST_PAIRS) {
    const valuePresent = signals.some((s) => s.signal_id === pair.value_signal);
    const trustPresent = signals.some(
      (s) => s.signal_id === pair.institution_signal
    );
    if (!valuePresent || !trustPresent) continue;
    const valueHigh = hasAtRank(signals, pair.value_signal, 3);
    if (!valueHigh) continue;
    const trustHigh = hasAtRank(signals, pair.institution_signal, 3);
    if (trustHigh) continue; // not a gap — trust is also high
    out.push({
      tension_id: "T-016",
      type: `Value vs Institutional Trust Gap (${pair.value_label})`,
      description: `User ranks ${pair.value_label} as a sacred value but does not rank ${pair.institution_label} among most-trusted institutions.`,
      signals_involved: [
        ref(signals, pair.value_signal, "sacred"),
        ref(signals, pair.institution_signal, "context"),
      ],
      confidence: "medium",
      status: "unconfirmed",
      strengthened_by: [],
      user_prompt: pair.locked_user_prompt,
    });
  }
  return out;
}

export function applyStrengtheners(
  tensions: Tension[],
  signals: Signal[]
): Tension[] {
  return tensions.map((t) => {
    const ids = STRENGTHENERS[t.tension_id];
    if (!ids || ids.length === 0) return t;
    const matching = signals.filter((s) => ids.includes(s.signal_id));
    if (matching.length === 0) return t;
    return { ...t, confidence: "high", strengthened_by: matching };
  });
}

export function deriveCoreOrientation(signals: Signal[]): string {
  const parts: string[] = [];

  if (has(signals, "truth_priority_high")) {
    parts.push("appears to prioritize truth, even when it creates social distance");
  } else if (has(signals, "belonging_priority_high")) {
    parts.push("appears to weigh belonging heavily when beliefs are contested");
  }

  if (has(signals, "freedom_priority") && !has(signals, "order_priority")) {
    parts.push("tends to value freedom to act");
  } else if (has(signals, "order_priority") && !has(signals, "freedom_priority")) {
    parts.push("tends to value order and structure");
  }

  if (has(signals, "high_conviction_under_risk")) {
    parts.push("may accept real risk rather than suppress belief");
  } else if (has(signals, "hides_belief") || has(signals, "adapts_under_economic_pressure")) {
    parts.push("may hold belief privately when livelihood is exposed");
  }

  if (has(signals, "high_pressure_context") || has(signals, "high_responsibility")) {
    parts.push("currently appears to carry significant responsibility or load");
  }

  if (has(signals, "proactive_creator")) {
    parts.push("tends to spend time building or creating");
  } else if (has(signals, "responsibility_maintainer")) {
    parts.push("tends to spend time maintaining what exists");
  } else if (has(signals, "reactive_operator")) {
    parts.push("tends to spend time reacting to demands");
  }

  if (parts.length === 0) {
    return "The available answers do not yet suggest a clear orientation. More inputs may sharpen the picture.";
  }

  return "This configuration " + parts.join("; ") + ".";
}

export function deriveSacredValues(answers: Answer[]): string[] {
  const out: string[] = [];
  for (const qid of ["Q-S1", "Q-S2"] as const) {
    const a = answers.find((x) => x.question_id === qid);
    if (!a) continue;
    if (a.type === "ranking") {
      const q = questions.find((q) => q.question_id === qid);
      if (!q || q.type !== "ranking") continue;
      for (const itemId of a.order) {
        const item = q.items.find((i) => i.id === itemId);
        if (item) out.push(item.label);
      }
    } else if (a.type === "forced") {
      if (a.response) out.push(a.response);
    }
  }
  return out;
}

export function buildInnerConstitution(
  answers: Answer[],
  metaSignals: MetaSignal[] = [],
  // CC-070 — optional demographics for life-stage-gated Movement guidance.
  // Pre-CC-070 callers passing 1-2 args continue to work; the Movement
  // layer falls back to `lifeStageGate: 'unknown'` when demographics is
  // omitted. Demographics has zero impact on derivation (canon §
  // demographic-rules.md Rule 4); it only shapes the Movement guidance
  // sentence.
  demographics?: DemographicSet | null
): InnerConstitution {
  const signals = deriveSignals(answers);
  // CC-060 — compute Drive output up-front so it can be threaded into the
  // tension detection functions for bucket-keyed sharp-question composition
  // (T-013 / T-014 / T-015 user_prompt strings). Pre-CC-060 the Drive
  // computation lived later in the pipeline; moving it up has no
  // behavioral cost (computeDriveOutput is a pure function of signals +
  // answers, both already in scope) and gives Rule 4 closure.
  const driveOutput = computeDriveOutput(signals, answers);
  let tensions = detectTensions(signals, driveOutput);
  tensions = applyStrengtheners(tensions, signals);
  // CC-016 — T-015 detection from per-category aspirational overlays.
  tensions = [...tensions, ...detectAllocationOverlayTensions(answers, driveOutput)];
  // CC-064 — T-016 detection for value-vs-institutional-trust gap. Faith
  // intentionally excluded; CC-054's Faith Shape covers the
  // (faith_priority + religious_trust_priority) gap prose-side.
  tensions = [...tensions, ...detectValueInstitutionalTrustGap(signals)];

  // CC-011 derivation pipeline.
  const stack = aggregateLensStack(signals);
  const topCompass = getTopCompassValues(signals);
  const topGravity = getTopGravityAttribution(signals);
  const topInst = getTopTrustInstitutional(signals);
  const topPersonal = getTopTrustPersonal(signals);
  const weather = assessWeatherLoad(signals);
  const fire = inferFirePattern(signals);
  const formation = inferFormationContext(signals);
  const agency = inferAgencyPattern(signals);

  const ctx = newBuildContext();
  const lens = deriveLensOutput(stack, weather, fire, agency, topCompass, topGravity, ctx);
  const compass = deriveCompassOutput(topCompass, stack, weather, fire, topGravity, agency, ctx, signals, answers);
  const conviction = deriveConvictionOutput(topCompass, fire, stack, topGravity, agency, weather, ctx);
  const gravity = deriveGravityOutput(topGravity, stack, weather, topCompass, agency, fire, ctx);
  const trust = deriveTrustOutput(topInst, topPersonal, stack, weather, topCompass, topGravity, agency, fire, ctx);
  const weatherOut = deriveWeatherOutput(weather, formation, stack, fire, topCompass, topGravity, agency, ctx);
  const fireOut = deriveFireOutput(fire, topCompass, weather, stack, topGravity, agency, ctx);
  const path = derivePathOutput(topCompass, stack, topGravity, agency, weather);

  // CC-026 — Drive (claimed-vs-revealed why-axis). The revealed distribution
  // is now computed up-front (above) so CC-060's allocation tension
  // composers can read it. Here we attach to Path and append T-D1 to
  // tensions when the case classifier fires inverted-small or
  // inverted-big. driveOutput is undefined when no tagged input landed
  // (degenerate sessions); the Distribution subsection then doesn't render.
  if (driveOutput) {
    path.drive = driveOutput;
    const driveTension = buildDriveTension(driveOutput);
    if (driveTension) tensions = [...tensions, driveTension];
  }

  // CC-037 — OCEAN derivation (Big-5 Disposition Map). Parallel to Drive:
  // tagging table over existing signals, rank-aware weighted distribution,
  // page-section render between Mirror and Compass. Returns undefined when
  // no tagged input landed (pre-CC-037 sessions or thin-signal degenerate
  // cases); the Disposition Map then doesn't render.
  const oceanOutput = computeOceanOutput(signals, answers);

  // CC-042 — Work Map derivation. Composes Lens aux-pair register, Drive
  // distribution, OCEAN distribution, Q-E1 energy allocation, Compass values,
  // Q-Ambition1, and Path agency aspiration into 1–2 work registers the
  // user is structurally aligned to. Returns undefined when no register
  // fires above the threshold floor; the page section then silently omits.
  const workMapOutput = computeWorkMapOutput(
    signals,
    answers,
    stack,
    driveOutput,
    oceanOutput,
    agency.aspiration
  );

  // CC-044 — Love Map derivation. Composes the same input portfolio into 1–2
  // love registers + top 1–3 flavors + a Resource Balance diagnostic. The
  // Resource Balance diagnostic surfaces independently of register matching;
  // a user with no strong register match but distorted balance still gets
  // the diagnostic. Returns undefined only when both register matching is
  // empty AND Resource Balance is healthy.
  const loveMapOutput = computeLoveMapOutput(
    signals,
    answers,
    stack,
    driveOutput,
    oceanOutput,
    agency
  );

  // CC-067 — Goal/Soul/Give derivation. Composes existing signals into Goal,
  // Soul, and Vulnerability composites; places into one of six named regions
  // (Give / Striving / Longing / Gripping / Parallel-Lives / Neutral).
  // Returns undefined when fewer than 8 signals are present or when neither
  // Q-E1 ranking was answered. The Mirror render layer guards on presence
  // and emits a "## Closing Read" section when populated.
  const goalSoulGiveOutput = computeGoalSoulGive(signals, answers);

  const shape_outputs: ShapeOutputs = {
    lens, compass, conviction, gravity, trust,
    weather: weatherOut, fire: fireOut, path,
  };

  const cross_card: CrossCardSynthesis = {
    topGifts: synthesizeTopGifts(shape_outputs, stack, topCompass, topGravity, agency, weather, fire),
    topRisks: synthesizeTopRisks(shape_outputs, weather, fire),
    growthPath: generateGrowthPath(topCompass, stack, topGravity, agency),
    relationshipTranslation: generateRelationshipTranslation(stack, topCompass, fire),
    conflictTranslation: generateConflictTranslation(stack, topCompass, fire),
    mirrorTypesSeed: generateMirrorTypesSeed(topCompass, stack),
  };

  const shape_summary = generateShapeSummary(stack, topCompass, topGravity, weather);
  const watch_for = generateWatchFor(shape_outputs, weather, fire);

  const baseConstitution: InnerConstitution = {
    core_orientation: deriveCoreOrientation(signals),
    signals,
    tensions,
    sacred_values: deriveSacredValues(answers),
    bridge_signals: [],
    shape_summary,
    lens_stack: stack,
    shape_outputs,
    cross_card,
    watch_for,
    // CC-017 — augment meta_signals with belief_impervious / belief_no_cost_named
    // emitted by Q-I2 / Q-I3 multi-select "None of these" selections.
    meta_signals: [...metaSignals, ...collectMultiSelectMetaSignals(answers)],
    // CC-015b — mirror populated below with generator that reads cross_card data.
    mirror: {
      shapeInOneSentence: "",
      corePattern: "",
      topGifts: [],
      topTraps: [],
      whatOthersMayExperience: "",
      whenTheLoadGetsHeavy: "",
      yourNext3Moves: [],
    },
    // CC-015c — heuristic-derived Belief Under Tension. Null if Q-I1 unanswered.
    belief_under_tension: extractBeliefUnderTension(answers),
    // CC-016 — collect per-allocation-ranking overlays from answers.
    allocation_overlays: collectAllocationOverlays(answers),
    // CC-037 — OCEAN derivation. Optional; computeOceanOutput returns
    // undefined for thin-signal sessions. Render layer guards on presence.
    ocean: oceanOutput,
    // CC-042 — Work Map derivation. Optional; computeWorkMapOutput returns
    // undefined when no register fires above the threshold floor.
    workMap: workMapOutput,
    // CC-044 — Love Map derivation. Optional; computeLoveMapOutput returns
    // undefined only when both register matching is empty AND Resource
    // Balance is healthy. Resource Balance distortion alone fires the field.
    loveMap: loveMapOutput,
    // CC-067 — Goal/Soul/Give derivation. Optional; computeGoalSoulGive
    // returns undefined for thin-signal sessions or when no Q-E1 evidence
    // exists. The render layer guards on presence.
    goalSoulGive: goalSoulGiveOutput,
  };

  baseConstitution.mirror = generateMirror(baseConstitution, {
    topCompass, topGravity, agency, weather, fire, stack,
  });

  // CC-070 — pattern catalog (heuristic) + Movement layer. Both run after
  // the rest of the constitution is assembled so detectors can read the
  // final goalSoulGive output. Demographics threads through Movement only
  // (per §13.7); patterns are pure functions of signals + goalSoulGive.
  baseConstitution.goalSoulPatterns = detectGoalSoulPatterns(baseConstitution);
  baseConstitution.goalSoulMovement = computeMovement(
    goalSoulGiveOutput,
    demographics ?? null,
    oceanOutput?.dispositionSignalMix.intensities,
    signals
  );

  // CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT — Foundation Phase 1.
  // Compute and attach 3C Strengths to the Drive output. Strengths are
  // independent 0-100 substance scores (Cost ≡ Goal-axis, Coverage ≡
  // Soul-axis, Compliance fresh from conviction + Conscientiousness +
  // Mix.compliance). The existing Drive Mix is preserved verbatim.
  // Runs AFTER computeGoalSoulGive (which produces Goal/Soul scores)
  // and AFTER computeOceanOutput (which produces Conscientiousness).
  attachDriveStrengths(baseConstitution);

  // CC-SYNTHESIS-1A Addition 1 — Risk Form 2x2 reading. The legacy
  // classifier reads the Drive Mix `compliance` bucket against
  // grippingPull score. Canonical interpretive classification lives in
  // `computeRiskFormFromAim` (Aim + Grip substrate); this call is
  // retained for cohort comparison + synthesis3 cache hash stability
  // (per CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT §10 note).
  if (
    baseConstitution.shape_outputs.path.drive &&
    baseConstitution.goalSoulMovement
  ) {
    baseConstitution.riskForm = computeRiskForm(
      baseConstitution.shape_outputs.path.drive.distribution,
      baseConstitution.goalSoulMovement.dashboard.grippingPull.score
    );
  }

  // CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — Grip decomposition must
  // attach BEFORE Movement Quadrant so the Quadrant twin gating can
  // read the canonical §13 composed Grip (constitution.gripReading.score)
  // rather than the legacy additive value.
  attachGripDecomposition(baseConstitution);

  // CC-SYNTHESIS-1A Addition 2 — Four-Quadrant Movement label keyed off
  // the (Goal, Soul) plane.
  // CC-PHASE-3A-LABEL-LOGIC — now takes angle + gripClusterFires.
  // CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — gripScore migrated from the
  // legacy additive `grippingPull.score` to the canonical multiplicative
  // `gripReading.score` (DefensiveGrip × StakesAmplifier).
  if (baseConstitution.goalSoulMovement) {
    const dash = baseConstitution.goalSoulMovement.dashboard;
    baseConstitution.movementQuadrant = computeMovementQuadrant({
      adjustedGoal: dash.goalScore,
      adjustedSoul: dash.soulScore,
      angleDegrees: dash.direction.angle,
      gripClusterFires:
        baseConstitution.goalSoulGive?.evidence.grippingClusterFires ?? false,
      gripScore:
        baseConstitution.gripReading?.score ?? dash.grippingPull.score,
    });
  }

  // CC-SHAPE-AWARE-PROSE-ROUTING — classify the user into one of the
  // three canonical profile archetypes (jasonType / cindyType / danielType)
  // OR an explicit unmappedType fallback. This runs AFTER Movement
  // Quadrant + Lens stack are populated, both of which the classifier
  // consumes. Downstream prose modules route template selection through
  // `constitution.profileArchetype.primary`.
  baseConstitution.profileArchetype = computeArchetype(
    archetypeInputsFromConstitution(baseConstitution)
  );

  // CC-SHAPE-AWARE-PROSE-ROUTING — overlay archetype-canonical gift /
  // growth-edge labels onto cross_card.topGifts and cross_card.topRisks
  // for the named archetypes (cindyType / danielType). This routes the
  // labels to downstream consumers (gifts-and-edges table, "To keep X
  // without Y" growth-path lines, etc.) so the entire prose surface
  // speaks in the archetype's register rather than the Te/Ti-coded
  // defaults. jasonType + unmappedType keep their existing labels per
  // CC out-of-scope guard #11.
  const archetypeKey = baseConstitution.profileArchetype.primary;
  if (archetypeKey === "cindyType" || archetypeKey === "danielType") {
    const overlay = GIFT_LABELS_BY_ARCHETYPE[archetypeKey];
    const n = Math.min(
      overlay.length,
      baseConstitution.cross_card.topGifts.length,
      baseConstitution.cross_card.topRisks.length
    );
    for (let i = 0; i < n; i++) {
      baseConstitution.cross_card.topGifts[i] = {
        ...baseConstitution.cross_card.topGifts[i],
        label: overlay[i].label,
      };
      baseConstitution.cross_card.topRisks[i] = {
        ...baseConstitution.cross_card.topRisks[i],
        label: overlay[i].growthEdge,
      };
    }
  }

  // CC-AGE-CALIBRATION — developmental-band classification from the
  // age demographic. Pure deterministic age → band mapping; the LLM
  // prose layer reads `bandReading.registerHint` to adjust tone.
  // MUST run BEFORE attachLlmPathMasterSynthesis and
  // attachLlmGripParagraph because those cache-key derivations read
  // bandReading from the constitution.
  attachBandReading(baseConstitution, demographics ?? null);

  // CC-AIM-REBUILD-MOVEMENT-LIMITER — Phase 2 derivation pipeline.
  // Order is load-bearing per the CC's "Orchestration" section:
  //   3-4. Grip decomposition (moved earlier per CC-GRIP-WIRING-AND-FLOOR-CALIBRATION
  //        so Quadrant routing can read gripReading.score).
  //   7.   ConvictionClarity
  //   8.   GoalSoulCoherence
  //   9.   ResponsibilityIntegration (depends on grip decomposition)
  //  10.   computeAimScore (new 5-component formula) — depends on
  //        ConvictionClarity, GoalSoulCoherence, ResponsibilityIntegration
  //  11.   Movement Limiter (depends on Aim + canonical Grip)
  attachConvictionClarity(baseConstitution);
  attachGoalSoulCoherence(baseConstitution);
  attachResponsibilityIntegration(baseConstitution);
  attachAimReading(baseConstitution);
  attachMovementLimiter(baseConstitution);

  // CC-GRIP-TAXONOMY — derive Primal cluster from the named-grips that
  // fired in goalSoulMovement. Pure deterministic mapping; no LLM.
  // MUST run BEFORE attachPrimalCoherence (which reads gripTaxonomy)
  // and BEFORE attachLlmPathMasterSynthesis / attachLlmGripParagraph
  // (which read coherenceReading via the inputs builder).
  attachGripTaxonomy(baseConstitution);

  // CC-GRIP-TAXONOMY-REPLACEMENT — classify into the 4-layer Grip
  // Pattern taxonomy. Runs AFTER gripTaxonomy + profileArchetype so the
  // classifier can read the engine-internal Primal register, the
  // archetype, the Compass top-4, and the Q-GRIP1 surface cluster.
  attachGripPattern(baseConstitution);

  // CC-HANDS-CARD — 9th body card. Runs AFTER archetype + gripPattern
  // + drive.strengths because Hands composes from all three (plus
  // Q-A1/A2/GS1/V1 signals + gift category + Lens driver).
  attachHandsCard(baseConstitution);

  // CC-PRIMAL-COHERENCE — two-path framework gating. Reads the Primal
  // cluster + Goal/Soul scores, classifies path as trajectory vs
  // crisis. CC-CRISIS-PATH-PROSE consumes the resulting `pathClass`
  // and `crisisFlavor` fields via the LLM input contracts; therefore
  // this attachment MUST run BEFORE attachLlmPathMasterSynthesis and
  // attachLlmGripParagraph so the cache hash reflects the path class.
  attachPrimalCoherence(baseConstitution);

  // CC-SYNTHESIS-3 — attach LLM-articulated Path master synthesis
  // paragraph from the static cache when present. Pure cache lookup;
  // never calls the API at runtime (per CC-SYNTHESIS-3 Out-of-Scope #4).
  // Falls through to null when the cache file doesn't have an entry
  // for this fixture's input hash; renderer falls back to the
  // mechanical CC-SYNTHESIS-1F Path master synthesis composer.
  attachLlmPathMasterSynthesis(baseConstitution);

  // CC-GRIP-TAXONOMY — LLM-articulated Grip paragraph cache lookup.
  // Runs after attachGripTaxonomy + attachPrimalCoherence so its
  // input contract sees both gripTaxonomy and coherenceReading.
  attachLlmGripParagraph(baseConstitution);

  return baseConstitution;
}

function attachHandsCard(constitution: InnerConstitution): void {
  // CC-HANDS-CARD — derive the 9th body card. Pure deterministic
  // templated composition; no LLM calls. Reads archetype + gripPattern
  // + drive.strengths + Q-A1/A2/GS1/V1 surface signals.
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { computeHandsCard } = requireFn(
      "./handsCard"
    ) as typeof import("./handsCard");
    const archetype =
      constitution.profileArchetype?.primary ?? "unmappedType";
    const gripPatternBucket =
      constitution.gripPattern?.bucket ?? "unmapped";
    const goalScore =
      constitution.goalSoulMovement?.dashboard.goalScore ?? 0;
    const costStrength =
      constitution.shape_outputs.path.drive?.strengths?.cost ?? 0;
    // TopGiftEntry doesn't carry a category field; fall back to the
    // shape_outputs.lens gift category as the user's primary gift.
    const topGiftCategory =
      constitution.shape_outputs?.lens?.gift?.category ?? null;
    const lensDriver =
      constitution.lens_stack?.dominant
        ? constitution.lens_stack.dominant
        : "unknown";
    const surfaceById = (id: string, qid: string): string | null => {
      const hit = constitution.signals.find(
        (s) =>
          s.signal_id === id && s.source_question_ids.includes(qid)
      );
      return hit ? hit.signal_id : null;
    };
    const qA1Activity = (() => {
      const hit = constitution.signals.find((s) =>
        s.source_question_ids.includes("Q-A1")
      );
      return hit?.signal_id ?? null;
    })();
    const qA2EnergyDirection = (() => {
      const hit = constitution.signals.find((s) =>
        s.source_question_ids.includes("Q-A2")
      );
      return hit?.signal_id ?? null;
    })();
    const qGS1TopReward = (() => {
      const hits = constitution.signals
        .filter((s) => s.source_question_ids.includes("Q-GS1"))
        .map((s) => ({ id: s.signal_id, rank: s.rank ?? 99 }))
        .sort((a, b) => a.rank - b.rank);
      return hits[0]?.id ?? null;
    })();
    const qV1TopMeaning = (() => {
      const hits = constitution.signals
        .filter((s) => s.source_question_ids.includes("Q-V1"))
        .map((s) => ({ id: s.signal_id, rank: s.rank ?? 99 }))
        .sort((a, b) => a.rank - b.rank);
      return hits[0]?.id ?? null;
    })();
    void surfaceById;
    // CC-086 Site 1 — surface top Compass priority labels so the
    // driver/archetype consistency override can check Compass support
    // as a secondary signal (Family/Compassion compass keeps caregiver
    // template valid even with Se driver).
    const topCompassSignalIds = getTopCompassValues(constitution.signals).map(
      (r) => r.signal_id
    );
    constitution.handsCard = computeHandsCard({
      archetype,
      gripPatternBucket,
      goalScore,
      costStrength,
      topGiftCategory,
      lensDriver,
      qA1Activity,
      qA2EnergyDirection,
      qGS1TopReward,
      qV1TopMeaning,
      topCompassSignalIds,
    });
  } catch {
    // Silent fallback — handsCard stays undefined.
  }
}

function attachGripPattern(constitution: InnerConstitution): void {
  // CC-GRIP-TAXONOMY-REPLACEMENT — classify the user into one of the
  // 7 canonical Grip Pattern buckets + an unmapped fallback. Inputs:
  // Q-GRIP1 surface cluster (top-3), engine-internal Primal register
  // (cache stability proxy), Compass top-4, driver pair, archetype.
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { classifyGripPattern } = requireFn(
      "./gripPattern"
    ) as typeof import("./gripPattern");
    const qGrip1Top3 = constitution.signals
      .filter(
        (s) =>
          s.source_question_ids.includes("Q-GRIP1") &&
          s.signal_id.startsWith("grips_")
      )
      .map((s) => ({ id: s.signal_id, rank: s.rank ?? 99 }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3)
      .map((s) => s.id);
    const compassTop4 = constitution.signals
      .filter(
        (s) =>
          s.from_card === "sacred" &&
          s.source_question_ids.some((q) => q === "Q-S1" || q === "Q-S2")
      )
      .map((s) => ({ id: s.signal_id, rank: s.rank ?? 99 }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 4)
      .map((s) => s.id);
    const driverPair = ((): import("./types").FunctionPairKey | null => {
      const dom = constitution.lens_stack?.dominant;
      const aux = constitution.lens_stack?.auxiliary;
      if (!dom || !aux) return null;
      const key = `${dom[0].toUpperCase()}${dom[1]}${aux[0].toUpperCase()}${aux[1]}` as import("./types").FunctionPairKey;
      const allowed = new Set<import("./types").FunctionPairKey>([
        "NeTi", "NeFi", "NiTe", "NiFe",
        "SeTi", "SeFi", "SiTe", "SiFe",
        "TeNi", "TeSi", "TiNe", "TiSe",
        "FeNi", "FeSi", "FiNe", "FiSe",
      ]);
      return allowed.has(key) ? key : null;
    })();
    constitution.gripPattern = classifyGripPattern({
      qGrip1Top3,
      livedPrimalRegister: constitution.gripTaxonomy?.primary ?? null,
      compassTop4,
      driverPair,
      archetype: constitution.profileArchetype?.primary ?? "unmappedType",
      dominant: constitution.lens_stack?.dominant ?? null,
    });
  } catch {
    // Silent fallback — gripPattern stays undefined.
  }
}

function attachGripTaxonomy(constitution: InnerConstitution): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { derivePrimalCluster } = requireFn(
      "./gripTaxonomy"
    ) as typeof import("./gripTaxonomy");
    const namedGrips =
      constitution.goalSoulMovement?.dashboard.grippingPull.signals.map(
        (s) => s.humanReadable
      ) ?? [];
    // CC-GRIP-CALIBRATION — read full shape into the calibration
    // context. Each field has a graceful fallback when the
    // prerequisite layer didn't populate (thin-signal sessions).
    const topCompassRefs = getTopCompassValues(constitution.signals).slice(
      0,
      4
    );
    const topCompassLabels = topCompassRefs.map(
      (r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id
    );
    const oceanIntensities =
      constitution.ocean?.dispositionSignalMix.intensities;
    const ctx = {
      // The calibration rules read the same named-grip list the
      // deterministic floor uses; passing it through directly keeps the
      // two layers in lock-step.
      contributingGrips: namedGrips,
      lensDominant: constitution.lens_stack.dominant,
      lensAuxiliary: constitution.lens_stack.auxiliary,
      topCompass: topCompassLabels,
      riskFormLetter: constitution.riskForm?.letter ?? null,
      oceanAgreeableness: oceanIntensities?.agreeableness ?? null,
      oceanConscientiousness: oceanIntensities?.conscientiousness ?? null,
      goalScore: constitution.goalSoulMovement?.dashboard.goalScore ?? null,
      soulScore: constitution.goalSoulMovement?.dashboard.soulScore ?? null,
      vulnerability:
        constitution.goalSoulGive?.rawScores.vulnerability ?? null,
    };
    constitution.gripTaxonomy = derivePrimalCluster(namedGrips, ctx);
  } catch {
    // Silent fallback — gripTaxonomy stays undefined.
  }
}

function attachDriveStrengths(constitution: InnerConstitution): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { computeDriveStrengths } = requireFn(
      "./threeCStrength"
    ) as typeof import("./threeCStrength");
    const drive = constitution.shape_outputs.path.drive;
    const goalSoul = constitution.goalSoulGive;
    if (!drive || !goalSoul) return;
    const oceanIntensities =
      constitution.ocean?.dispositionSignalMix.intensities ?? null;
    const convictionTemp =
      constitution.belief_under_tension?.conviction_temperature ?? null;
    drive.strengths = computeDriveStrengths({
      goalScore: goalSoul.adjustedScores.goal,
      soulScore: goalSoul.adjustedScores.soul,
      driveMixCompliance: drive.distribution.compliance,
      convictionTemperature: convictionTemp,
      oceanIntensities,
    });
  } catch {
    // Silent fallback — drive.strengths stays undefined.
  }
}

function attachGripDecomposition(constitution: InnerConstitution): void {
  // CC-AIM-REBUILD-MOVEMENT-LIMITER Segment 3.
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const {
      computeStakesLoad,
      computeDefensiveGrip,
      computeGripFromDefensive,
      computeGrip,
    } = requireFn("./gripDecomposition") as typeof import("./gripDecomposition");
    const grippingPull = constitution.goalSoulGive?.grippingPull;
    const rawScores = constitution.goalSoulGive?.rawScores;
    if (!grippingPull || !rawScores) return;
    const stakes = computeStakesLoad(constitution.signals);
    const defensive = computeDefensiveGrip({
      signals: constitution.signals,
      vulnerability: rawScores.vulnerability,
      rawSoulScore: rawScores.soul,
    });
    const composed = computeGripFromDefensive(defensive.score, stakes.score);
    grippingPull.stakesLoad = stakes.score;
    grippingPull.defensiveGrip = defensive.score;
    grippingPull.gripAmplifier = composed.amplifier;
    grippingPull.gripFromDefensive = composed.grip;
    // CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT §13 — surface the canonical
    // multiplicative reading on the constitution. Distinct from the
    // legacy additive `grippingPull.score`, which is preserved.
    constitution.gripReading = computeGrip(defensive.score, stakes.score);
  } catch {
    // Silent fallback
  }
}

function attachConvictionClarity(constitution: InnerConstitution): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { computeConvictionClarity } = requireFn(
      "./convictionClarity"
    ) as typeof import("./convictionClarity");
    const signals = constitution.signals;
    const hasSignal = (id: string): boolean =>
      signals.some((s) => s.signal_id === id);
    const rankFrom = (id: string, q: string): number | null => {
      const hit = signals.find(
        (s) => s.signal_id === id && s.source_question_ids.includes(q)
      );
      return hit?.rank ?? null;
    };
    const oceanIntensities =
      constitution.ocean?.dispositionSignalMix.intensities;
    constitution.convictionClarity = computeConvictionClarity({
      highConvictionExpression: hasSignal("high_conviction_expression"),
      highConvictionUnderRisk: hasSignal("high_conviction_under_risk"),
      convictionUnderCost: hasSignal("conviction_under_cost"),
      vulnerabilityOpenUncertaintyRank: rankFrom(
        "vulnerability_open_uncertainty",
        "Q-V1"
      ),
      sacredBeliefConnectionRank: rankFrom("sacred_belief_connection", "Q-V1"),
      performanceIdentityRank: rankFrom("performance_identity", "Q-V1"),
      goalLogicExplanationRank: rankFrom("goal_logic_explanation", "Q-V1"),
      beliefUnderTensionTemperature:
        constitution.belief_under_tension?.conviction_temperature ?? null,
      conscientiousness: oceanIntensities?.conscientiousness ?? null,
    });
  } catch {
    // Silent fallback
  }
}

function attachGoalSoulCoherence(constitution: InnerConstitution): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { computeGoalSoulCoherence } = requireFn(
      "./goalSoulCoherence"
    ) as typeof import("./goalSoulCoherence");
    const angle = constitution.goalSoulMovement?.dashboard.direction.angle;
    if (angle === undefined) return;
    constitution.goalSoulCoherence = computeGoalSoulCoherence({
      angleDegrees: angle,
    });
  } catch {
    // Silent fallback
  }
}

function attachResponsibilityIntegration(
  constitution: InnerConstitution
): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { computeResponsibilityIntegration } = requireFn(
      "./responsibilityIntegration"
    ) as typeof import("./responsibilityIntegration");
    const grip = constitution.goalSoulGive?.grippingPull;
    const dashboard = constitution.goalSoulMovement?.dashboard;
    if (!grip || !dashboard) return;
    if (grip.stakesLoad === undefined || grip.defensiveGrip === undefined)
      return;
    constitution.responsibilityIntegration = computeResponsibilityIntegration({
      stakesLoad: grip.stakesLoad,
      defensiveGrip: grip.defensiveGrip,
      movementStrength: dashboard.movementStrength.length,
    });
  } catch {
    // Silent fallback
  }
}

function attachAimReading(constitution: InnerConstitution): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const {
      computeAimScore,
      computeAimScoreLegacy,
      convictionScoreFromTemperature,
    } = requireFn("./aim") as typeof import("./aim");
    const { computeRiskFormFromAim } = requireFn(
      "./riskForm"
    ) as typeof import("./riskForm");
    const driveStrengths = constitution.shape_outputs.path.drive?.strengths;
    const driveDistribution =
      constitution.shape_outputs.path.drive?.distribution;
    const movement = constitution.goalSoulMovement?.dashboard;
    if (!driveStrengths || !driveDistribution || !movement) return;

    const aimReading = computeAimScore({
      wiseRiskStrength: driveStrengths.compliance,
      convictionClarity: constitution.convictionClarity?.score ?? 50,
      goalSoulCoherence: constitution.goalSoulCoherence?.score ?? 50,
      movementStrength: movement.movementStrength.length,
      responsibilityIntegration:
        constitution.responsibilityIntegration?.score ?? 0,
    });
    constitution.aimReading = aimReading;

    // CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT §D — the legacy Aim is no
    // longer canonical. It is still computed and attached because the
    // cohort cache hash in `synthesis3Inputs.ts:aimScore` consumes it
    // for hash stability per the prior CC-AIM-REBUILD-MOVEMENT-LIMITER
    // decision ("the LLM cache hash uses the LEGACY Aim score so
    // existing cached paragraphs remain valid"). The §D intent is met
    // at the render layer: no render path consumes `aimReadingLegacy`
    // (verified by the audit), so users never see it. A future CC may
    // migrate the cache hash off the legacy Aim and drop attachment.
    const convictionTemp =
      constitution.belief_under_tension?.conviction_temperature ?? null;
    constitution.aimReadingLegacy = computeAimScoreLegacy({
      complianceBucket: driveDistribution.compliance,
      costBucket: driveDistribution.cost,
      convictionScore: convictionScoreFromTemperature(convictionTemp),
      movementStrength: movement.movementStrength.length,
    });

    // CC-PHASE-3A-LABEL-LOGIC — switch riskFormFromAim to consume the
    // NEW Aim formula.
    // CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — canonical Grip substrate
    // is now `gripReading.score` (§13 DefensiveGrip × StakesAmplifier),
    // not the legacy additive `grippingPull.score`. Cache hash stability
    // is preserved in synthesis3Inputs / gripTaxonomyInputs by
    // re-computing a legacy-grip-based letter for the hash key only.
    const canonicalGripForRisk =
      constitution.gripReading?.score ?? movement.grippingPull.score;
    constitution.riskFormFromAim = computeRiskFormFromAim(
      aimReading.score,
      canonicalGripForRisk
    );
  } catch {
    // Silent fallback
  }
}

function attachMovementLimiter(constitution: InnerConstitution): void {
  // CC-AIM-REBUILD-MOVEMENT-LIMITER Segment 4.
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { computeUsableMovement } = requireFn(
      "./movementLimiter"
    ) as typeof import("./movementLimiter");
    const dashboard = constitution.goalSoulMovement?.dashboard;
    const aimScore = constitution.aimReading?.score;
    if (!dashboard || aimScore === undefined) return;
    // CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — drag computation now
    // reads the canonical §13 composed Grip (constitution.gripReading.score)
    // directly. Falls back to gripFromDefensive (same value, attached on
    // the dashboard for back-compat) then to legacy additive only if the
    // decomposition didn't attach.
    const grip =
      constitution.gripReading?.score ??
      dashboard.grippingPull.gripFromDefensive ??
      dashboard.grippingPull.score;
    dashboard.movementLimiter = computeUsableMovement({
      potentialMovement: dashboard.movementStrength.length,
      grip,
      aim: aimScore,
    });
  } catch {
    // Silent fallback
  }
}

function attachBandReading(
  constitution: InnerConstitution,
  demographics: DemographicSet | null
): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const {
      classifyDevelopmentalBand,
      extractAgeFromDemographics,
      TOO_YOUNG_AGE,
    } = requireFn("./ageCalibration") as typeof import("./ageCalibration");
    const extracted = extractAgeFromDemographics(demographics);
    if (!extracted) {
      // Missing age — leave bandReading undefined and tooYoungForInstrument
      // unset. Prose layer falls back to age-agnostic register.
      return;
    }
    if (extracted.age < TOO_YOUNG_AGE) {
      constitution.bandReading = null;
      constitution.tooYoungForInstrument = true;
      return;
    }
    const reading = classifyDevelopmentalBand(extracted.age, {
      fromDecadeMidpoint: extracted.fromDecadeMidpoint,
    });
    constitution.bandReading = reading;
  } catch {
    // Silent fallback — bandReading stays undefined.
  }
}

function attachPrimalCoherence(constitution: InnerConstitution): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { computePrimalCoherence } = requireFn(
      "./primalCoherence"
    ) as typeof import("./primalCoherence");
    const cluster = constitution.gripTaxonomy;
    const dashboard = constitution.goalSoulMovement?.dashboard;
    if (!cluster || !dashboard) return;
    constitution.coherenceReading = computePrimalCoherence(
      cluster,
      dashboard.goalScore,
      dashboard.soulScore
    );
  } catch {
    // Silent fallback — coherenceReading stays undefined.
  }
}

function attachLlmGripParagraph(constitution: InnerConstitution): void {
  try {
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { deriveGripInputs } = requireFn(
      "./gripTaxonomyInputs"
    ) as typeof import("./gripTaxonomyInputs");
    const { readCachedGripParagraph } = requireFn(
      "./gripTaxonomyLlm"
    ) as typeof import("./gripTaxonomyLlm");
    const inputs = deriveGripInputs(constitution);
    if (!inputs) return;
    const paragraph = readCachedGripParagraph(inputs);
    if (paragraph) constitution.gripParagraphLlm = paragraph;
  } catch {
    // Silent fallback — gripParagraphLlm stays undefined.
  }
}

// CC-SYNTHESIS-3 helper — runtime-only cache read. Imported lazily so
// the engine module compiles in environments where the cache file or
// composer module isn't available (e.g., browser bundle, where node:fs
// isn't available). On any error the engine silently falls back —
// `masterSynthesisLlm` stays undefined and the renderer uses the
// mechanical paragraph.
function attachLlmPathMasterSynthesis(constitution: InnerConstitution): void {
  try {
    // Dynamic require to avoid loading node:fs in browser builds.
    // Both modules are pure-data on the runtime path (no API calls).
    // The require() is wrapped in a function so a static analyzer
    // doesn't try to bundle the cache file as a build asset.
    const requireFn: NodeJS.Require | undefined =
      typeof require === "function" ? require : undefined;
    if (!requireFn) return;
    const { deriveSynthesis3Inputs } = requireFn(
      "./synthesis3Inputs"
    ) as typeof import("./synthesis3Inputs");
    const { readCachedParagraph } = requireFn(
      "./synthesis3Llm"
    ) as typeof import("./synthesis3Llm");
    const inputs = deriveSynthesis3Inputs(constitution);
    const paragraph = readCachedParagraph(inputs);
    if (paragraph) {
      constitution.shape_outputs.path.masterSynthesisLlm = paragraph;
    }
  } catch {
    // Silent fallback. The renderer reads the field as nullable.
  }
}

export function toRankingAnswer(
  question_id: string,
  order: string[]
): Answer | null {
  const q = questions.find((q) => q.question_id === question_id);
  if (!q || q.type !== "ranking") return null;
  return {
    question_id,
    card_id: q.card_id,
    question_text: q.text,
    type: "ranking",
    order,
  };
}

export function toAnswer(
  question_id: string,
  response: string
): Answer | null {
  const q = questions.find((q) => q.question_id === question_id);
  if (
    !q ||
    q.type === "ranking" ||
    q.type === "ranking_derived" ||
    q.type === "multiselect_derived"
  )
    return null;
  return {
    question_id,
    card_id: q.card_id,
    question_text: q.text,
    response,
    type: q.type,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// CC-011 — Output Engine Derivation
//
// Aggregates raw signals into structured Inner Constitution sub-types.
// Pattern-matched templated prose follows the canonical hedging vocabulary
// from inner-constitution.md (appears to / may suggest / tends to / leans
// toward) and respects the Five Dangers from shape-framework.md § Five
// Dangers (no MBTI headlines, no stress-as-revelation, no moralizing, no
// clinical implication, layered card register).
// ──────────────────────────────────────────────────────────────────────────

// ── Aggregation helpers ──────────────────────────────────────────────────
//
// CC-JX — `aggregateLensStack` moved to lib/jungianStack.ts as the single
// source of truth for cog-function stack resolution. Both Lens
// classification (this file) and OCEAN bridges (lib/ocean.ts) read from
// the shared resolver. Re-exported here so existing import sites that
// `from "./identityEngine"` keep working bit-for-bit.
import { aggregateLensStack } from "./jungianStack";
export { aggregateLensStack };

export type SignalRef = {
  signal_id: SignalId;
  rank?: number;
  strength: "low" | "medium" | "high";
};

function topRankAware(
  signals: Signal[],
  ids: SignalId[],
  maxRank: number,
  cap: number
): SignalRef[] {
  return signals
    .filter(
      (s) =>
        ids.includes(s.signal_id) && s.rank !== undefined && s.rank <= maxRank
    )
    .sort(
      (a, b) =>
        (a.rank ?? 99) - (b.rank ?? 99) || a.signal_id.localeCompare(b.signal_id)
    )
    .slice(0, cap)
    .map((s) => ({ signal_id: s.signal_id, rank: s.rank, strength: s.strength }));
}

const SACRED_IDS: SignalId[] = [
  "freedom_priority", "truth_priority", "stability_priority", "loyalty_priority",
  "family_priority", "knowledge_priority", "justice_priority", "faith_priority",
  // CC-028 — added so the new sacred-priority signals participate in
  // getTopCompassValues / topRankAware computations (the surface that
  // feeds the Mirror's Compass output prose). Without this, the new
  // values would fire from Q-S1 / Q-S2 but get filtered out before
  // reaching the user-facing top-compass list.
  "peace_priority", "honor_priority", "compassion_priority", "mercy_priority",
];
const RESPONSIBILITY_IDS: SignalId[] = [
  "individual_responsibility_priority", "system_responsibility_priority",
  "nature_responsibility_priority", "supernatural_responsibility_priority",
  "authority_responsibility_priority",
];
// CC-031 — institutional trust signal catalog post Q-X3 multi-stage. Five
// public-mission signals + five information-and-commercial signals = 10
// total (vs. 5 in the legacy flat Q-X3).
const INSTITUTIONAL_TRUST_IDS: SignalId[] = [
  "government_elected_trust_priority", "government_services_trust_priority",
  "education_trust_priority", "nonprofits_trust_priority", "religious_trust_priority",
  "journalism_trust_priority", "news_organizations_trust_priority",
  "social_media_trust_priority", "small_business_trust_priority",
  "large_companies_trust_priority",
];
// CC-032 — personal trust signal catalog post Q-X4 multi-stage. Six total:
// three relational (preserved) + three chosen (mentor + outside_expert + own
// counsel). Outside_expert is the new signal CC-032 adds.
const PERSONAL_TRUST_IDS: SignalId[] = [
  "partner_trust_priority", "friend_trust_priority", "family_trust_priority",
  "mentor_trust_priority", "outside_expert_trust_priority",
  "own_counsel_trust_priority",
];

export function getTopCompassValues(signals: Signal[], n = 4): SignalRef[] {
  return topRankAware(signals, SACRED_IDS, 2, n);
}

export function getTopGravityAttribution(signals: Signal[]): SignalRef[] {
  return topRankAware(signals, RESPONSIBILITY_IDS, 2, 2);
}

export function getTopTrustInstitutional(signals: Signal[]): SignalRef[] {
  return topRankAware(signals, INSTITUTIONAL_TRUST_IDS, 2, 2);
}

export function getTopTrustPersonal(signals: Signal[]): SignalRef[] {
  return topRankAware(signals, PERSONAL_TRUST_IDS, 2, 2);
}

export type WeatherLoad = {
  load: "low" | "moderate" | "high" | "high+";
  intensifier: "low" | "moderate" | "high";
};

export function assessWeatherLoad(signals: Signal[]): WeatherLoad {
  let load: "low" | "moderate" | "high" = "moderate";
  if (has(signals, "high_pressure_context")) load = "high";
  else if (has(signals, "moderate_load")) load = "moderate";
  else if (has(signals, "stability_present")) load = "low";

  let intensifier: "low" | "moderate" | "high" = "moderate";
  if (has(signals, "high_responsibility")) intensifier = "high";
  else if (has(signals, "moderate_responsibility")) intensifier = "moderate";
  else if (has(signals, "low_responsibility")) intensifier = "low";

  const combined: WeatherLoad["load"] =
    load === "high" && intensifier === "high" ? "high+" : load;
  return { load: combined, intensifier };
}

export type FormationContext = {
  authority: "trusted" | "skeptical" | "distrusted" | "unknown";
  childhood: "stable" | "mixed" | "chaotic" | "unknown";
};

function inferFormationContext(signals: Signal[]): FormationContext {
  let authority: FormationContext["authority"] = "unknown";
  if (has(signals, "authority_trust_high")) authority = "trusted";
  else if (has(signals, "authority_skepticism_moderate")) authority = "skeptical";
  else if (has(signals, "authority_distrust")) authority = "distrusted";
  let childhood: FormationContext["childhood"] = "unknown";
  if (has(signals, "stability_baseline_high")) childhood = "stable";
  else if (has(signals, "moderate_stability")) childhood = "mixed";
  else if (has(signals, "chaos_exposure")) childhood = "chaotic";
  return { authority, childhood };
}

export type FirePattern = {
  willingToBearCost: boolean;
  adapts: boolean;
  concealsUnderThreat: boolean;
  holdsInternalConviction: boolean;
};

export function inferFirePattern(signals: Signal[]): FirePattern {
  return {
    willingToBearCost:
      has(signals, "high_conviction_under_risk") ||
      has(signals, "conviction_under_cost"),
    adapts:
      has(signals, "adapts_under_social_pressure") ||
      has(signals, "adapts_under_economic_pressure"),
    concealsUnderThreat: has(signals, "hides_belief"),
    holdsInternalConviction:
      has(signals, "holds_internal_conviction") ||
      has(signals, "moderate_social_expression"),
  };
}

export type AgencyPattern = {
  current: "creator" | "maintainer" | "reactive" | "unknown";
  aspiration: "creator" | "relational" | "stability" | "exploration" | "unknown";
};

function inferAgencyPattern(signals: Signal[]): AgencyPattern {
  let current: AgencyPattern["current"] = "unknown";
  if (hasFromQuestion(signals, "proactive_creator", "Q-A1")) current = "creator";
  else if (hasFromQuestion(signals, "responsibility_maintainer", "Q-A1")) current = "maintainer";
  else if (hasFromQuestion(signals, "reactive_operator", "Q-A1")) current = "reactive";
  let aspiration: AgencyPattern["aspiration"] = "unknown";
  if (hasFromQuestion(signals, "proactive_creator", "Q-A2")) aspiration = "creator";
  else if (has(signals, "relational_investment")) aspiration = "relational";
  else if (has(signals, "stability_restoration")) aspiration = "stability";
  else if (has(signals, "exploration_drive")) aspiration = "exploration";
  return { current, aspiration };
}

// ── Vocabulary helpers ───────────────────────────────────────────────────

// CC-PROSE-1B Layer 4 — exported for `lib/coreSignalMap.ts` to map a top
// compass / top gravity SignalRef to a single human-readable label.
// Internal callers continue to use `valueListPhrase` (which composes a
// joined phrase across multiple refs); the Core Signal Map needs a single
// label per cell, so it consumes COMPASS_LABEL / GRAVITY_LABEL directly.
export const COMPASS_LABEL: Partial<Record<SignalId, string>> = {
  freedom_priority: "Freedom",
  truth_priority: "Truth",
  stability_priority: "Stability",
  loyalty_priority: "Loyalty",
  family_priority: "Family",
  knowledge_priority: "Knowledge",
  justice_priority: "Justice",
  faith_priority: "Faith",
  peace_priority: "Peace",            // CC-046 — was missing since CC-028
  honor_priority: "Honor",            // CC-046 — was missing since CC-028
  compassion_priority: "Compassion",  // CC-046 — was missing since CC-028
  mercy_priority: "Mercy",            // CC-046 — was missing since CC-028
};

export const GRAVITY_LABEL: Partial<Record<SignalId, string>> = {
  individual_responsibility_priority: "Individual",
  system_responsibility_priority: "System",
  nature_responsibility_priority: "Nature",
  supernatural_responsibility_priority: "Supernatural",
  authority_responsibility_priority: "Authority",
};

// CC-031 — institutional-trust display labels post Q-X3 multi-stage. Five
// public-mission + five information-and-commercial = 10 total.
const INST_LABEL: Partial<Record<SignalId, string>> = {
  government_elected_trust_priority: "Government — Elected",
  government_services_trust_priority: "Government — Services",
  education_trust_priority: "Education",
  nonprofits_trust_priority: "Non-Profits",
  religious_trust_priority: "Religious",
  journalism_trust_priority: "Journalism",
  news_organizations_trust_priority: "News organizations",
  social_media_trust_priority: "Social Media",
  small_business_trust_priority: "Small / Private Business",
  large_companies_trust_priority: "Large / Public Companies",
};

// CC-032 — personal-trust display labels post Q-X4 multi-stage. Outside-
// expert added; the other five labels are preserved.
const PERSONAL_LABEL: Partial<Record<SignalId, string>> = {
  partner_trust_priority: "a spouse or partner",
  friend_trust_priority: "a close friend",
  family_trust_priority: "family",
  mentor_trust_priority: "a mentor or advisor",
  outside_expert_trust_priority: "an outside expert",
  own_counsel_trust_priority: "your own counsel",
};

// CC-015a — preserved as part of the public engine API. No longer referenced
// in body prose; the MBTI disclosure surfaces stack.mbtiCode directly. Kept
// available so future consumers (e.g., a canonical-mapping documentation
// page) can read the technical function-code labels without re-deriving them.
export const FUNCTION_PHRASE: Record<CognitiveFunctionId, string> = {
  ni: "convergent pattern synthesis",
  ne: "divergent possibility-mapping",
  si: "precedent-aware grounding",
  se: "present-moment responsiveness",
  ti: "internal logical refinement",
  te: "external goal-driven execution",
  fi: "value-rooted authenticity",
  fe: "relational and group attunement",
};

export const FUNCTION_NAME: Record<CognitiveFunctionId, string> = {
  ni: "Ni", ne: "Ne", si: "Si", se: "Se",
  ti: "Ti", te: "Te", fi: "Fi", fe: "Fe",
};

// CC-015a — plain-language voice descriptors. These replace FUNCTION_NAME and
// FUNCTION_PHRASE in body prose. Function codes (Ni, Ne, …) live behind the
// MBTI disclosure; the body of the Inner Constitution speaks in voices.
export const FUNCTION_VOICE: Record<CognitiveFunctionId, string> = {
  ni: "the pattern-reader",
  ne: "the possibility-finder",
  si: "the precedent-checker",
  se: "the present-tense self",
  ti: "the coherence-checker",
  te: "the structurer",
  fi: "the inner compass",
  fe: "the room-reader",
};

export const FUNCTION_VOICE_SHORT: Record<CognitiveFunctionId, string> = {
  ni: "pattern-reader",
  ne: "possibility-finder",
  si: "precedent-checker",
  se: "present-tense self",
  ti: "coherence-checker",
  te: "structurer",
  fi: "inner compass",
  fe: "room-reader",
};

// CC-038 — Function-pair register map. Sixteen canonical Jung function-stack
// pairs (8 dominants × 2 viable auxiliaries: perceiver-dominants pair with
// judging auxiliaries and vice versa, introvert-dominants pair with extravert
// auxiliaries and vice versa). Each entry carries a v1-placeholder analog
// label, a gift-category route, and a short description capturing the
// register's cognitive shape.
//
// Architectural rules:
//   - Aux-pair routing is *cognitive-structure* discrimination, distinct
//     from CC-036's signal-condition discrimination. Both layers cooperate.
//   - In pickGiftCategory, aux-pair routes fire AFTER existing condition-
//     driven routes and CC-036 secondary routes, BEFORE the Ne/Ni→Pattern
//     baseline and CC-034 function-specific fallbacks. Non-canonical Lens
//     stacks (e.g., Si dominant + Ne auxiliary, possible when Q-T1–T8
//     detection produces unusual orderings) do not match any entry; they
//     fall through to the existing fallback ladder.
//   - The pair_key and gift_category fields are canonical and lock with
//     CC-038. The analog_label and short_description fields are v1
//     placeholders subject to editorial refinement in CC-038-prose.
//   - This is *not* MBTI integration. The engine surfaces the register
//     analog ("the framework-prober") rather than the typological label
//     ("ENTP"). The register analog is body-of-work language.
// CC-038-prose — v3 locked content. 16 entries × 8 fields each. The
// pair_key, gift_category, and driver/instrument fields are canonical and
// locked. analog_label is the v3 single-word (or simple-compound) label.
// short_description carries the specifying weight that v1's compound labels
// were doing. healthy_expression / distorted_expression compose as the gift→
// risk dynamic. product_safe_sentence is the locked Mirror template:
// "Your Lens has a [analog] quality: you appear to ..."
//
// Mirror-pair asymmetry preserved: NiTe/TeNi, NiFe/FeNi, NeTi/TiNe (and the
// other dom/aux flips) share gift_category but diverge in analog_label and
// short_description so the prose layer can surface the asymmetry. See
// docs/canon/function-pair-registers.md § Mirror-pair asymmetry canon.
export const FUNCTION_PAIR_REGISTER: Record<FunctionPairKey, FunctionPairRegister> = {
  NeTi: {
    pair_key: "NeTi",
    driver: "Ne",
    instrument: "Ti",
    analog_label: "the prober",
    gift_category: "Discernment",
    short_description:
      "Possibility-generation disciplined by internal-logical structure. Pattern-matches across many frames AND tests each match against a coherent framework — anomaly-detection by triangulation.",
    healthy_expression:
      "Generates many possible explanations for what's happening, then disciplines the field by testing each explanation against a coherent logical structure.",
    distorted_expression:
      "Endless probing without commitment — possibilities multiply faster than coherence can settle, and the testing register starts disqualifying rather than discriminating.",
    product_safe_sentence:
      "Your Lens has a prober quality: you appear to generate alternative explanations across many frames, then test each one against the same disciplined internal logic.",
    body_map_route: { from: "path", to: "lens" },
  },
  NeFi: {
    pair_key: "NeFi",
    driver: "Ne",
    instrument: "Fi",
    analog_label: "the catalyst",
    gift_category: "Generativity",
    short_description:
      "Possibility-generation oriented by personal-values authentication. Sees what someone or something could become, then offers the invitation in a way that honors the values anchor.",
    healthy_expression:
      "Reads what's becoming possible in another person or situation and frames the invitation in a way that the person can recognize as their own real opportunity.",
    distorted_expression:
      "Possibility-naming runs ahead of the relational ground — the catalyst sees what could become true and pushes the invitation before the person is ready to receive it.",
    product_safe_sentence:
      "Your Lens has a catalyst quality: you appear to see what someone or something could become, and to frame the invitation in a way that honors what feels true to them.",
    body_map_route: { from: "path", to: "compass" },
  },
  NiTe: {
    pair_key: "NiTe",
    driver: "Ni",
    instrument: "Te",
    analog_label: "the architect",
    gift_category: "Builder",
    short_description:
      "Depth-of-vision in service of operational execution. Holds the long arc and translates it into the structure the next phase requires.",
    healthy_expression:
      "Sees the future shape that's not yet visible to others, then builds the operational architecture that will be needed to carry it when it arrives.",
    distorted_expression:
      "The architecture gets ahead of the present — the long-arc vision becomes a constraint on what people can actually do today, and the structure overtakes the situation it was meant to serve.",
    product_safe_sentence:
      "Your Lens has an architect quality: you appear to see the future shape first, then look for the practical structures that could carry it.",
    body_map_route: { from: "path", to: "conviction" },
  },
  NiFe: {
    pair_key: "NiFe",
    driver: "Ni",
    instrument: "Fe",
    analog_label: "the seer",
    gift_category: "Meaning",
    short_description:
      "Depth-of-vision in service of relational-meaning. Reads what someone could become and tends the becoming through patient relational presence.",
    healthy_expression:
      "Holds an unhurried sense of who someone is becoming and tends that becoming with the kind of presence that doesn't require the person to see it yet.",
    distorted_expression:
      "The seeing turns prescriptive — the register starts holding people to the version of themselves the seer has glimpsed, before the person has had the chance to choose it.",
    product_safe_sentence:
      "Your Lens has a seer quality: you appear to read what someone could become over the long arc and to tend that becoming through patient relational presence.",
    body_map_route: { from: "path", to: "trust" },
  },
  SeTi: {
    pair_key: "SeTi",
    driver: "Se",
    instrument: "Ti",
    analog_label: "the surgeon",
    gift_category: "Precision",
    short_description:
      "Somatic engagement disciplined by internal-logical structure. The hand that knows which cut to make in the moment because the framework is already internalized.",
    healthy_expression:
      "Reads the situation by being inside it, applies a precise intervention learned from internalized framework, and trusts the body to know which move is the right move.",
    distorted_expression:
      "The framework hardens into reflex — the precision register starts cutting before the situation has finished revealing itself, and intervention runs ahead of diagnosis.",
    product_safe_sentence:
      "Your Lens has a surgeon quality: you appear to enter the situation directly, read what's actually happening, and act with precision learned from prior framework.",
    body_map_route: { from: "fire", to: "lens" },
  },
  SeFi: {
    pair_key: "SeFi",
    driver: "Se",
    instrument: "Fi",
    analog_label: "the artist",
    gift_category: "Action",
    short_description:
      "Somatic engagement oriented by personal-values authentication. Embodiment as expression — the value made visible through how the moment is met.",
    healthy_expression:
      "Discovers what matters through direct contact with the moment and expresses the discovery through how the body shows up — taste, courage, refusal, presence.",
    distorted_expression:
      "Expression replaces examination — the values feel known through performance rather than tested against difficulty, and the artist's certainty about what's true outpaces the contact that earned it.",
    product_safe_sentence:
      "Your Lens has an artist quality: you appear to discover and express value through direct contact with the present moment — embodiment as expression.",
    body_map_route: { from: "fire", to: "compass" },
  },
  SiTe: {
    pair_key: "SiTe",
    driver: "Si",
    instrument: "Te",
    analog_label: "the keeper",
    gift_category: "Stewardship",
    short_description:
      "Preservation across time disciplined by operational execution. Maintains the institution AND extends it — turns memory into standards that hold up over years.",
    healthy_expression:
      "Holds the long memory of what has actually worked and translates it into the standards, systems, and routines that let the institution continue to work.",
    distorted_expression:
      "Preservation becomes precedent-tyranny — what worked before becomes what must work now, and the keeper starts protecting the institution from its own next form.",
    product_safe_sentence:
      "Your Lens has a keeper quality: you appear to preserve what has endured, then turn that memory into standards and systems others can rely on.",
    body_map_route: { from: "gravity", to: "conviction" },
  },
  SiFe: {
    pair_key: "SiFe",
    driver: "Si",
    instrument: "Fe",
    analog_label: "the family-tender",
    gift_category: "Harmony",
    short_description:
      "Preservation across time oriented by relational attunement. Holds the fabric of who-belongs-to-whom and tends it through small, consistent acts of remembered care.",
    healthy_expression:
      "Notices the small ritual acts that hold a community's fabric in place — birthdays, check-ins, the dish someone always brings — and continues them so the belonging continues.",
    distorted_expression:
      "The tending becomes silent obligation — the family-tender carries the fabric without being seen carrying it, and resentment starts to grow under the surface of the consistent care.",
    product_safe_sentence:
      "Your Lens has a family-tender quality: you appear to notice and protect the small consistent acts that help a community feel held over time.",
    // CC-038-body-map — deliberate asymmetry. Si is the driver, but the
    // route starts from Heart (compass) rather than Gravity (where Si
    // typically lives). Reading: SiFe holds remembered care as a sacred-
    // values commitment (Heart) and expresses it through relational
    // presence (Listen). Driver's natural body-position is implicit in
    // the *kind* of Heart held; the active movement is sacred-care →
    // relational-attention. Documented in canon; do not retag to gravity/trust.
    body_map_route: { from: "compass", to: "trust" },
  },
  TeNi: {
    pair_key: "TeNi",
    driver: "Te",
    instrument: "Ni",
    analog_label: "the strategist",
    gift_category: "Builder",
    short_description:
      "Operational execution informed by depth-of-vision. Builds the system the long arc requires, not the system the present demands.",
    healthy_expression:
      "Reads the long-arc objective and aims the present operational force directly at it — the resources, the structure, and the deadlines all point at the same horizon.",
    distorted_expression:
      "The strategy outruns the people executing it — the long-arc objective remains crisp in the strategist's head while the team is asked to carry a plan they can no longer see the reasons for.",
    product_safe_sentence:
      "Your Lens has a strategist quality: you appear to aim operational force toward a long-range objective and to build the system the long arc requires.",
    body_map_route: { from: "conviction", to: "path" },
  },
  TeSi: {
    pair_key: "TeSi",
    driver: "Te",
    instrument: "Si",
    analog_label: "the operator",
    gift_category: "Stewardship",
    short_description:
      "Operational execution informed by preservation-across-time. Runs what must keep working through standards, precedent, duty, and operational trust.",
    healthy_expression:
      "Keeps the institution running with the eye of someone who knows both what it does today and what it has done before — operations that respect their own history.",
    distorted_expression:
      "The operations become ritual — the operator runs the system because the system runs, and what was once stewardship hardens into resistance to any change at all.",
    product_safe_sentence:
      "Your Lens has an operator quality: you appear to run what must keep working through standards, precedent, and operational trust.",
    body_map_route: { from: "conviction", to: "gravity" },
  },
  TiNe: {
    pair_key: "TiNe",
    driver: "Ti",
    instrument: "Ne",
    analog_label: "the questioner",
    gift_category: "Discernment",
    short_description:
      "Internal-logical structure-building informed by possibility-generation. Tests systems by imagining alternatives — finds truth by asking what else could explain the pattern.",
    healthy_expression:
      "Holds the system being claimed and tests it against the systems that could have been claimed instead — coherence earned by surviving real alternatives.",
    distorted_expression:
      "The questioning becomes solvent — every system gets tested against alternatives until none of them survive, and the questioner ends up holding nothing because everything could have been otherwise.",
    product_safe_sentence:
      "Your Lens has a questioner quality: you appear to test every system by imagining alternatives — finding truth by asking what else could explain the pattern.",
    body_map_route: { from: "lens", to: "path" },
  },
  TiSe: {
    pair_key: "TiSe",
    driver: "Ti",
    instrument: "Se",
    analog_label: "the troubleshooter",
    gift_category: "Precision",
    short_description:
      "Internal-logical structure-building informed by somatic engagement. Diagnoses by entering the broken thing — precision earned from logic under direct contact.",
    healthy_expression:
      "Enters the system that's not working, applies a logical map to what's actually present, and locates the failure where the abstract framework meets the concrete situation.",
    distorted_expression:
      "Diagnosis without resolution — the troubleshooter can name what's broken with precision but the contact-based mode resists the longer-arc work of building what would actually replace it.",
    product_safe_sentence:
      "Your Lens has a troubleshooter quality: you appear to diagnose by entering the broken thing — precision learned from logic in direct contact with the failure.",
    body_map_route: { from: "lens", to: "fire" },
  },
  FeNi: {
    pair_key: "FeNi",
    driver: "Fe",
    instrument: "Ni",
    analog_label: "the pastor",
    gift_category: "Meaning",
    short_description:
      "Relational attunement informed by depth-of-vision. Holds what the person could become and orchestrates the room toward letting that becoming happen.",
    healthy_expression:
      "Reads the room with an unhurried sense of who each person is becoming, and arranges the conditions — attention, timing, witness — so that the becoming has room.",
    distorted_expression:
      "The pastoral register starts moving people — the seeing of what could be becomes a quiet pressure for it to be, and the orchestration crosses into authoring lives that aren't the pastor's to author.",
    product_safe_sentence:
      "Your Lens has a pastor quality: you appear to read the room through a sense of who people could become, and to arrange the conditions for that becoming to have room.",
    body_map_route: { from: "trust", to: "path" },
  },
  FeSi: {
    pair_key: "FeSi",
    driver: "Fe",
    instrument: "Si",
    analog_label: "the kinkeeper",
    gift_category: "Harmony",
    short_description:
      "Relational attunement informed by preservation-across-time. Maintains the connective tissue of community through ritual, presence, and small consistent acts.",
    healthy_expression:
      "Holds the network of who's connected to whom and tends the connections through ritual and small consistent presence — the work that keeps a community a community.",
    distorted_expression:
      "The kinkeeping becomes the only role — the kinkeeper holds the community's threads but loses the parts of self that don't serve the threading, and resentment grows where individuation should have.",
    product_safe_sentence:
      "Your Lens has a kinkeeper quality: you appear to maintain the connective tissue of community through ritual, presence, and small consistent acts of relational care.",
    body_map_route: { from: "trust", to: "compass" },
  },
  FiNe: {
    pair_key: "FiNe",
    driver: "Fi",
    instrument: "Ne",
    analog_label: "the imaginer",
    gift_category: "Integrity",
    short_description:
      "Personal-values authentication informed by possibility-generation. Holds what's true to the self AND what could become true — the values-driven explorer.",
    healthy_expression:
      "Tests possibilities against the inner compass first — what's worth imagining is what could become true while remaining true to the values the self is anchored in.",
    distorted_expression:
      "The imagining stays inward — the values-driven explorer never leaves the conditional mode, and the possibilities accumulate without being made real because none of them is fully tested against the world.",
    product_safe_sentence:
      "Your Lens has an imaginer quality: you appear to explore what could be while testing whether each possibility remains true to your inner compass.",
    body_map_route: { from: "compass", to: "path" },
  },
  FiSe: {
    pair_key: "FiSe",
    driver: "Fi",
    instrument: "Se",
    analog_label: "the witness",
    gift_category: "Integrity",
    short_description:
      "Personal-values authentication informed by somatic engagement. Doesn't argue the values — performs them, in the moment, in body and presence.",
    healthy_expression:
      "Makes the values visible through how the body meets the moment — refusal, taste, presence, embodied conviction that doesn't require explanation to be felt.",
    distorted_expression:
      "The witnessing stays mute — the values are visible through stance but the witness never names them, and the people around the witness have to read the body for what could have been said.",
    product_safe_sentence:
      "Your Lens has a witness quality: you appear to make conviction visible through action and presence rather than argument — the values lived rather than explained.",
    body_map_route: { from: "compass", to: "fire" },
  },
};

// CC-038 — Resolve a LensStack to its canonical function-pair register.
// Returns undefined when (a) the stack lacks a dominant or auxiliary, or
// (b) the dominant+auxiliary combination is not one of the 16 canonical
// Jung pairs (e.g., Si + Ne, possible when Q-T1–T8 detection produces
// unusual orderings). Downstream consumers (Mirror prose, future cross-
// reference logic) handle undefined gracefully.
export function getFunctionPairRegister(
  stack: LensStack
): FunctionPairRegister | undefined {
  if (!stack.dominant || !stack.auxiliary) return undefined;
  // Capitalize first letter to match FunctionPairKey format ("NeTi" not "neti").
  const dom = stack.dominant.charAt(0).toUpperCase() + stack.dominant.slice(1);
  const aux = stack.auxiliary.charAt(0).toUpperCase() + stack.auxiliary.slice(1);
  const key = `${dom}${aux}` as FunctionPairKey;
  return FUNCTION_PAIR_REGISTER[key];
}

export const UNDER_PRESSURE_BEHAVIOR: Record<CognitiveFunctionId, string> = {
  ni: "the pattern-reader narrows the lens until certainty starts to feel like fact",
  ne: "the possibility-finder keeps adding angles until no angle gets weight",
  si: "the precedent-checker begins replaying old experience as if it were the only data",
  se: "the present-tense self acts before the meaning has had time to land",
  ti: "the coherence-checker begins cross-examining instead of clarifying",
  te: "the structurer turns people into roles rather than presences",
  fi: "the inner compass hardens into private verdict",
  fe: "the room-reader smooths the surface while the truth stays unsaid",
};

// Editorial fallback labels for synthesizeTopRisks when the gift-category-to-
// risk-label table produces a label already used by an earlier card. Replaces
// the prior "{Card}-card risk under pressure" debug-style fallback.
export const TOP_RISK_CARD_FALLBACK: Record<CardKey, string> = {
  lens:       "Pattern certainty becoming private fact.",
  compass:    "Integrity becoming rigidity.",
  conviction: "Conviction-cost hardening into stance.",
  gravity:    "Where you place blame becoming where you keep it.",
  trust:      "Trust narrowing into capture or paranoia.",
  weather:    "State patterns calcifying into universal patterns.",
  fire:       "Conviction becoming over-sacrifice.",
  path:       "Building outpacing becoming.",
};

// CC-015a — vary value-list phrasing across call sites. Same user gets the
// same output (deterministic on variantIndex), but across the rendering the
// phrasing rotates so the same labels do not repeat verbatim 5+ times.
export function valueListPhrase(
  topCompass: SignalRef[],
  variantIndex: number
): string {
  const labels = compassLabels(topCompass);
  if (labels.length === 0) return "what you protect";
  const verbatim = joinList(labels);
  switch (variantIndex % 4) {
    case 0:
      return verbatim;
    case 1:
      return "your top values";
    case 2:
      return "what you protect";
    case 3:
      return `the ${labels.length} values you ranked highest`;
    default:
      return verbatim;
  }
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

function compassLabels(top: SignalRef[]): string[] {
  return top.map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id);
}

// ── Gift category selection ───────────────────────────────────────────────

function pickGiftCategory(
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern
): GiftCategory {
  const dom = stack.dominant;
  const compassIds = topCompass.map((r) => r.signal_id);
  const gravityIds = topGravity.map((r) => r.signal_id);
  const has = (id: SignalId) => compassIds.includes(id);
  const hasG = (id: SignalId) => gravityIds.includes(id);

  // Heuristic priority order — first match wins.
  if (dom === "ni" && has("faith_priority")) return "Meaning";
  if (dom === "ti" && (has("truth_priority") || has("knowledge_priority"))) return "Precision";
  if ((dom === "ti" || dom === "ni") && fire.willingToBearCost && has("truth_priority")) return "Discernment";
  if (dom === "te" && (agency.current === "creator" || agency.aspiration === "creator")
      && (hasG("system_responsibility_priority") || hasG("authority_responsibility_priority"))) return "Builder";
  if ((dom === "fi" || dom === "fe") && has("justice_priority")
      && hasG("individual_responsibility_priority") && hasG("system_responsibility_priority")) return "Advocacy";
  if (dom === "fi" && (has("truth_priority") || has("faith_priority"))) return "Integrity";
  if (dom === "fe" && (has("family_priority") || has("faith_priority"))) return "Harmony";
  if (dom === "si" && (has("stability_priority") || has("family_priority"))) return "Stewardship";
  if (dom === "si" && weather.intensifier === "high") return "Endurance";
  if (dom === "se" && has("freedom_priority")) return "Action";
  // CC-036 — secondary conditional routes for Si / Se / Ti / Te.
  // Each route is more specific than the function's default fallback below;
  // it fires when the discriminating signal matches and otherwise defers to
  // the CC-034 fallback.
  if (dom === "si" && (has("truth_priority") || has("knowledge_priority"))) return "Discernment";
  if (dom === "se" && has("justice_priority")) return "Advocacy";
  if (dom === "se" && (agency.current === "creator" || hasG("system_responsibility_priority"))) return "Builder";
  if (dom === "ti" && (agency.current === "creator" || hasG("system_responsibility_priority"))) return "Builder";
  if (dom === "te" && (has("truth_priority") || has("knowledge_priority"))) return "Precision";
  // CC-038 — Aux-pair routing layer. Sixteen canonical Jung function-stack
  // pairs each route to a gift category that composes with the register's
  // cognitive shape (NeTi → Discernment, NeFi → Generativity, etc.).
  // Routes fire only when no more-specific condition above has matched;
  // canonical Ne/Ni stacks narrow from the generic Pattern fallback below
  // to the aux-pair-specific category. Non-canonical Lens stacks (e.g.,
  // Si + Ne) return undefined from getFunctionPairRegister and fall
  // through to the Ne/Ni Pattern line and CC-034 fallbacks below.
  const auxPairRegister = getFunctionPairRegister(stack);
  if (auxPairRegister) return auxPairRegister.gift_category;
  if (dom === "ne" || dom === "ni") return "Pattern";
  if ((agency.aspiration === "relational" || agency.aspiration === "stability"
       || agency.aspiration === "exploration") && dom === "te") return "Generativity";
  // CC-034 — function-specific fallbacks before the generic Pattern default.
  // Pre-CC-034, every non-Ne/Ni dominant function fell through to the generic
  // `return "Pattern"` line below when no conditional route's predicate
  // matched. Combined with `categoryHasSupport`'s Ne/Ni-only Pattern filter,
  // this left Si/Se/Ti/Te/Fi/Fe Mirror prose either reading as intuitive-
  // function Pattern text or, in the per-card path, getting filtered out
  // entirely. Each dominant function now lands on a category whose prose
  // reads naturally as that function's canonical mode (Stewardship for Si's
  // preservation-across-time register, Action for Se's present-tense move,
  // Precision for Ti's clarification register, Generativity for Te's help-
  // others-become-more-capable mode, Integrity for Fi's values-driven
  // authenticity, Harmony for Fe's relational attunement). Categories
  // themselves are unchanged; only the routing now guarantees a function-
  // specific landing.
  if (dom === "si") return "Stewardship";
  if (dom === "se") return "Action";
  if (dom === "ti") return "Precision";
  if (dom === "te") return "Generativity";
  if (dom === "fi") return "Integrity";
  if (dom === "fe") return "Harmony";
  return "Pattern";
}

// ── CC-011b editorial discipline: per-card category preferences,
//    prose-variant pools, repetition cap, Watch For templates ─────────────

export type CardKey =
  | "lens" | "compass" | "conviction" | "gravity"
  | "trust" | "weather" | "fire" | "path";

const CARD_POSITION: Record<CardKey, number> = {
  lens: 0, compass: 1, conviction: 2, gravity: 3,
  trust: 4, weather: 5, fire: 6, path: 7,
};

const CARD_PREFERENCES: Record<CardKey, GiftCategory[]> = {
  lens: ["Pattern", "Precision", "Discernment", "Meaning"],
  compass: ["Integrity", "Meaning", "Stewardship", "Endurance", "Advocacy"],
  conviction: ["Discernment", "Precision", "Integrity", "Pattern"],
  gravity: ["Builder", "Advocacy", "Discernment", "Endurance"],
  trust: ["Discernment", "Harmony", "Stewardship", "Pattern"],
  weather: ["Endurance", "Stewardship", "Harmony"],
  fire: ["Integrity", "Action", "Endurance", "Pattern"],
  path: ["Generativity", "Builder", "Advocacy", "Action"],
};

const PREFERENCE_WEIGHTS = [1.0, 0.7, 0.5, 0.35, 0.25];

export type BuildContext = {
  usedCategories: Map<GiftCategory, number>;
  usedSentences: Set<string>;
  cardCategoryByCard: Partial<Record<CardKey, GiftCategory>>;
  discernmentGrowthHostCard: CardKey | null;
};

function newBuildContext(): BuildContext {
  return {
    usedCategories: new Map(),
    usedSentences: new Set(),
    cardCategoryByCard: {},
    discernmentGrowthHostCard: null,
  };
}

function categoryHasSupport(
  cat: GiftCategory,
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern
): boolean {
  const dom = stack.dominant;
  const compassIds = new Set(topCompass.map((r) => r.signal_id));
  const gravityIds = new Set(topGravity.map((r) => r.signal_id));
  const inCompass = (id: SignalId) => compassIds.has(id);
  const inGravity = (id: SignalId) => gravityIds.has(id);
  switch (cat) {
    case "Pattern":
      return dom === "ni" || dom === "ne";
    case "Precision":
      // CC-034 — Ti always supports Precision as its fallback. Existing
      // condition (Ti with truth/knowledge) reads as the discriminating
      // route; the function-only clause is the operative fallback support.
      return (dom === "ti" && (inCompass("truth_priority") || inCompass("knowledge_priority"))) ||
        dom === "ti" ||
        (dom === "te" && (inCompass("truth_priority") || inCompass("knowledge_priority"))) || // CC-036 — Te clarification register.
        dom === "se"; // CC-038 — SeTi aux-pair (the surgeon-mind) routes to Precision.
    case "Stewardship":
      // CC-034 — Si always supports Stewardship as its fallback. Existing
      // condition (Si or Fe with stability/family) reads as the
      // discriminating route.
      return ((dom === "si" || dom === "fe") &&
        (inCompass("stability_priority") || inCompass("family_priority"))) ||
        dom === "si" ||
        dom === "te"; // CC-038 — TeSi aux-pair (the operational-leader) routes to Stewardship.
    case "Action":
      // CC-034 — Se always supports Action as its fallback. Existing
      // condition (Se or Te with freedom/justice/creator) reads as the
      // discriminating route.
      return ((dom === "se" || dom === "te") &&
        (inCompass("freedom_priority") || inCompass("justice_priority") || agency.current === "creator")) ||
        dom === "se";
    case "Harmony":
      return dom === "fe" || (dom === "fi" && inCompass("family_priority")) ||
        dom === "si"; // CC-038 — SiFe aux-pair (the family-tender) routes to Harmony.
    case "Integrity":
      return dom === "fi" || (fire.willingToBearCost && (inCompass("truth_priority") || inCompass("faith_priority")));
    case "Builder":
      return dom === "te" && (agency.current === "creator" || agency.aspiration === "creator" ||
        inGravity("system_responsibility_priority") || inGravity("authority_responsibility_priority")) ||
        ((dom === "se" || dom === "ti") &&
          (agency.current === "creator" || inGravity("system_responsibility_priority"))) || // CC-036 — Se/Ti as system-builders.
        dom === "ni"; // CC-038 — NiTe aux-pair (the long-arc-architect) routes to Builder.
    case "Advocacy":
      return inCompass("justice_priority") ||
        (inGravity("individual_responsibility_priority") && inGravity("system_responsibility_priority")) ||
        (dom === "se" && inCompass("justice_priority")); // CC-036 — Se somatic-justice register.
    case "Meaning":
      return (dom === "ni" && (inCompass("faith_priority") || inCompass("knowledge_priority"))) ||
        dom === "ni" || // CC-038 — NiFe aux-pair (the seer-of-people) routes to Meaning; broaden Ni support.
        dom === "fe";   // CC-038 — FeNi aux-pair (the pastoral-mind) routes to Meaning.
    case "Endurance":
      return weather.intensifier === "high" || dom === "si" ||
        (inCompass("stability_priority") && weather.load !== "low");
    case "Discernment":
      return (dom === "ti" || dom === "ni") &&
        (inCompass("truth_priority") || inCompass("knowledge_priority") || fire.willingToBearCost) ||
        (dom === "si" && (inCompass("truth_priority") || inCompass("knowledge_priority"))) || // CC-036 — Si pattern-matches subtle anomalies.
        dom === "ne"; // CC-038 — NeTi aux-pair (the framework-prober) routes to Discernment.
    case "Generativity":
      // CC-034 — Te always supports Generativity as its fallback. Existing
      // aspiration-driven conditions read as the discriminating route.
      return agency.aspiration === "relational" || agency.aspiration === "stability" ||
        agency.aspiration === "exploration" ||
        dom === "te" ||
        dom === "ne"; // CC-038 — NeFi aux-pair (the meaning-catalyst) routes to Generativity.
  }
}

// CC-086 Sites 4-6 — shape-aware preference reordering for non-Hands
// cards. When the dominant function is relational/present-tense
// (Se/Fe/Fi/Si) AND the Compass cluster is relational
// (family/loyalty/peace/compassion), the Trust/Gravity/Conviction
// cards' Strength prose should prefer Action / Harmony / Stewardship /
// Integrity rather than Builder / Precision / Pattern (which were
// authored as architect/strategist-coded text in `GIFT_NOUN_PHRASE`).
//
// The tables `GIFT_NOUN_PHRASE` + `GIFT_DESCRIPTION` are untouched —
// only the upstream route to them shape-aligns. Jason-shape (Ni +
// Faith Compass) and Daniel-shape (Si + Faith Compass) routing is
// preserved because neither matches the relational-shape predicate.
const SHAPE_REORDER_CARDS: ReadonlySet<CardKey> = new Set([
  "trust",
  "gravity",
  "conviction",
]);
const RELATIONAL_DRIVERS: ReadonlySet<CognitiveFunctionId> = new Set([
  "se",
  "fe",
  "fi",
  "si",
]);
const RELATIONAL_COMPASS_ANCHORS: ReadonlySet<string> = new Set([
  "family_priority",
  "loyalty_priority",
  "peace_priority",
  "compassion_priority",
]);
// CC-086 — Si is the steward driver: route to Stewardship first.
// Se/Fe/Fi are the relational/present-tense drivers: route to Harmony
// (relational attunement) or Action (in-the-moment) first.
//
// CC-086 FOLLOWUP (2026-05-16 — Daniel/Harry workshop) — the steward
// shape splits by AUXILIARY function. Same dominant (Si), same compass
// (Faith), but the auxiliary determines the secondary GiftCategory
// thread:
//
//   - Si + Te = Daniel-shape (steward-builder). Built the family
//     business; took the risk his brothers wouldn't. Drive contributes
//     to goal. Builder secondary, not Advocacy.
//   - Si + Fe = Harry-shape (steward-with-harmony). Faithful continuity
//     in service of relationship. Softens to keep the room intact.
//     Harmony on Conviction, Advocacy on Gravity, not Builder.
//   - Si + Ti = principled-precision steward. Stewardship + Discernment.
//   - Si + Fi = inner-compass steward. Stewardship + Integrity.
//
// Until this CC, `pickGiftCategoryForCard` consumed only `stack.dominant`
// and threw away the auxiliary signal — even though `stack.auxiliary` is
// derived from Q-T1–T8 and IS available on the constitution. The 8
// ranking questions earned their keep at the data layer; the routing
// layer wasn't using them. This CC closes that gap by branching the
// preferred order + downweight set by `stack.auxiliary` for Si-dominant
// shapes.
const STEWARD_PREFERRED: ReadonlyArray<GiftCategory> = [
  "Stewardship",
  "Integrity",
  "Harmony",
  "Action",
];
// Si-Te (Daniel-shape) — keep Builder in the preferred set; he built
// the business and took the risk. Builder is canonical secondary.
const STEWARD_TE_PREFERRED: ReadonlyArray<GiftCategory> = [
  "Stewardship",
  "Builder",
  "Integrity",
  "Discernment",
];
// Si-Fe (Harry-shape) — keep faith with people via continuity. Advocacy
// + Harmony as the relational expression of stewardship.
const STEWARD_FE_PREFERRED: ReadonlyArray<GiftCategory> = [
  "Stewardship",
  "Advocacy",
  "Harmony",
  "Integrity",
];
// Si-Ti — principled clarity through tested form. Discernment +
// Precision as the cognitive expression of stewardship.
const STEWARD_TI_PREFERRED: ReadonlyArray<GiftCategory> = [
  "Stewardship",
  "Discernment",
  "Precision",
  "Integrity",
];
// Si-Fi — inner-compass steward. Integrity + Advocacy lead.
const STEWARD_FI_PREFERRED: ReadonlyArray<GiftCategory> = [
  "Stewardship",
  "Integrity",
  "Advocacy",
  "Harmony",
];
const RELATIONAL_PREFERRED: ReadonlyArray<GiftCategory> = [
  "Harmony",
  "Action",
  "Integrity",
  "Stewardship",
];
const RELATIONAL_DOWNWEIGHTED: ReadonlySet<GiftCategory> = new Set<GiftCategory>([
  "Builder",
  "Precision",
  "Pattern",
]);
// Si-Te (Daniel-shape) — Builder is CANONICAL, not downweighted. Only
// Pattern stays downweighted (it's the Ni signature, not Si).
const STEWARD_TE_DOWNWEIGHTED: ReadonlySet<GiftCategory> = new Set<GiftCategory>([
  "Pattern",
]);
// Si-Ti — Precision is CANONICAL for Ti-aux. Only Builder + Pattern
// stay downweighted.
const STEWARD_TI_DOWNWEIGHTED: ReadonlySet<GiftCategory> = new Set<GiftCategory>([
  "Builder",
  "Pattern",
]);

function selectStewardPreferences(
  aux: CognitiveFunctionId
): {
  preferred: ReadonlyArray<GiftCategory>;
  downweighted: ReadonlySet<GiftCategory>;
} {
  switch (aux) {
    case "te":
      return { preferred: STEWARD_TE_PREFERRED, downweighted: STEWARD_TE_DOWNWEIGHTED };
    case "fe":
      return { preferred: STEWARD_FE_PREFERRED, downweighted: RELATIONAL_DOWNWEIGHTED };
    case "ti":
      return { preferred: STEWARD_TI_PREFERRED, downweighted: STEWARD_TI_DOWNWEIGHTED };
    case "fi":
      return { preferred: STEWARD_FI_PREFERRED, downweighted: RELATIONAL_DOWNWEIGHTED };
    default:
      return { preferred: STEWARD_PREFERRED, downweighted: RELATIONAL_DOWNWEIGHTED };
  }
}

function isRelationalShape(
  stack: LensStack,
  topCompass: SignalRef[]
): boolean {
  if (!RELATIONAL_DRIVERS.has(stack.dominant)) return false;
  return topCompass.some((r) => RELATIONAL_COMPASS_ANCHORS.has(r.signal_id));
}

function reorderPreferencesForRelationalShape(
  card: CardKey,
  stack: LensStack,
  prefs: GiftCategory[]
): GiftCategory[] {
  if (!SHAPE_REORDER_CARDS.has(card)) return prefs;
  // Si dominant → steward preference order, AUX-AWARE:
  //   - Si-Te (Daniel) → Stewardship + Builder primary
  //   - Si-Fe (Harry)  → Stewardship + Advocacy + Harmony primary
  //   - Si-Ti          → Stewardship + Discernment + Precision
  //   - Si-Fi          → Stewardship + Integrity
  // Se/Fe/Fi dominant → relational preference order (Cindy/Michele:
  // Harmony/Action).
  let preferredOrder: ReadonlyArray<GiftCategory>;
  let downweightedSet: ReadonlySet<GiftCategory>;
  if (stack.dominant === "si") {
    const params = selectStewardPreferences(stack.auxiliary);
    preferredOrder = params.preferred;
    downweightedSet = params.downweighted;
  } else {
    preferredOrder = RELATIONAL_PREFERRED;
    downweightedSet = RELATIONAL_DOWNWEIGHTED;
  }
  const preferred = preferredOrder.filter((c) => prefs.includes(c));
  const carriedRelational = prefs.filter(
    (c) => !preferredOrder.includes(c) && !downweightedSet.has(c)
  );
  const downweighted = prefs.filter((c) => downweightedSet.has(c));
  return [...preferred, ...carriedRelational, ...downweighted];
}

export function pickGiftCategoryForCard(
  card: CardKey,
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern,
  context?: BuildContext
): GiftCategory {
  const basePrefs = CARD_PREFERENCES[card];
  // CC-086 — if the shape is relational AND this is a non-Hands card
  // whose default preferences lead with Builder/Precision/Pattern,
  // reorder the prefs so Harmony/Action/Stewardship/Integrity win
  // before the architect-coded categories get the first scoring slot.
  // Hands has its own card composer (lib/handsCard.ts) and never
  // passes through this picker, so reordering Hands is a no-op
  // regardless.
  const prefs = isRelationalShape(stack, topCompass)
    ? reorderPreferencesForRelationalShape(card, stack, [...basePrefs])
    : basePrefs;
  type Scored = { cat: GiftCategory; score: number };
  const scored: Scored[] = [];
  prefs.forEach((cat, idx) => {
    if (!categoryHasSupport(cat, stack, topCompass, topGravity, agency, weather, fire)) return;
    const w = PREFERENCE_WEIGHTS[Math.min(idx, PREFERENCE_WEIGHTS.length - 1)];
    let score = w;
    if (context) {
      const used = context.usedCategories.get(cat) ?? 0;
      // CC-086 FOLLOWUP — cap raised 2 → 3 so canonical-shape categories
      // (e.g., Stewardship for Si-dominant Daniel/Harry shapes) can land
      // on 3 cards (Compass + Weather + Trust) before the cap triggers.
      // Previously the cap zeroed Stewardship after Compass+Weather
      // (2 uses), leaving Harmony or Advocacy to win Trust by score-
      // weight default — which produced the Daniel-shape misrouting
      // ("a relational-attunement gift" on Trust where canon is "a
      // stewardship gift"). Raised to 3 to give the canonical primary
      // room to express on its 3 native cards before the picker rotates.
      if (used >= 3) score = 0;
    }
    scored.push({ cat, score });
  });
  scored.sort((a, b) => b.score - a.score);
  // CC-086 Sites 4-6 — relational-shape fallback override. When no
  // preference has support AND the shape is relational AND the card
  // is Trust/Gravity/Conviction, force the fallback to Harmony rather
  // than letting `pickGiftCategory()` route through to Builder/Precision
  // via the Se+creator / Si+stability heuristics. Architect/steward
  // shapes' fallback paths are unchanged.
  const isRelationalFallback =
    SHAPE_REORDER_CARDS.has(card) && isRelationalShape(stack, topCompass);
  const winner =
    scored.length > 0 && scored[0].score > 0
      ? scored[0].cat
      : isRelationalFallback
        ? "Harmony"
        : pickGiftCategory(stack, topCompass, topGravity, agency, weather, fire);
  if (context) {
    context.usedCategories.set(winner, (context.usedCategories.get(winner) ?? 0) + 1);
    context.cardCategoryByCard[card] = winner;
    if (winner === "Discernment" && context.discernmentGrowthHostCard === null) {
      context.discernmentGrowthHostCard = card;
    }
  }
  return winner;
}

function pickVariant(
  pool: string[],
  position: number,
  context?: BuildContext
): string {
  for (let i = 0; i < pool.length; i++) {
    const idx = (position + i) % pool.length;
    const candidate = pool[idx];
    if (!context || !context.usedSentences.has(candidate)) {
      if (context) context.usedSentences.add(candidate);
      return candidate;
    }
  }
  return pool[position % pool.length];
}

const GIFT_STEM_POOL: string[] = [
  "{NP} shows up here:",
  "What this card surfaces is your tendency toward {NP_LOWER}:",
  "{CAT_LABEL} is part of how this card lands:",
  "In its native register, this card carries {NP_LOWER}:",
];

const GROWTH_EDGE_STEM_POOL: string[] = [
  "The growth move on this card involves",
  "What stretches you here looks like",
  "Growth here tends to show up as",
  "The next move on this card is",
];

const RISK_STEM_POOL: string[] = [
  "Under ordinary pressure",
  "Under the load most weeks bring",
  "At ordinary stress levels",
  "When stakes are present but moderate",
  "Under sustained but not extreme pressure",
];

const RISK_STEM_HIGH_POOL: string[] = [
  "Under heavy current load and high-stakes pressure",
  "At the edges of what your shape can carry",
  "When the load is at the high end of what most weeks bring",
];

const TOP_GIFTS_CLOSING_POOL: string[] = [
  "It appears across multiple cards, which is why it surfaces here as a top gift rather than a single-card strength.",
  "This shape supports it from more than one angle.",
  "More than one card surfaces this; here is the synthesized read.",
];

const TOP_RISK_LABEL_FOR_CATEGORY: Record<GiftCategory, string> = {
  Discernment: "Cynicism becoming default.",
  Pattern: "Pattern certainty becoming private fact.",
  Precision: "Precision becoming weaponized correctness.",
  Stewardship: "Stewardship becoming fear of disruption.",
  Action: "Action becoming impatience with reflection.",
  Harmony: "Harmony becoming conflict avoidance.",
  Integrity: "Integrity becoming rigidity.",
  Builder: "Building becoming control.",
  Advocacy: "Advocacy becoming combativeness.",
  Meaning: "Meaning becoming overinterpretation.",
  Endurance: "Endurance becoming silent suffering.",
  Generativity: "Generativity becoming over-extension.",
};

const WATCH_FOR_TEMPLATES: Record<GiftCategory, string[]> = {
  Pattern: [
    "When 'I see the pattern' becomes 'I no longer need to test the pattern.'",
  ],
  Precision: [
    "When clarity stops asking whether the moment is asking for it.",
    "When truth becomes more important than timing.",
  ],
  Stewardship: [
    "When stability becomes the only acceptable shape of safety.",
  ],
  Action: [
    "When momentum becomes the substitute for direction.",
  ],
  Harmony: [
    "When keeping the room calm becomes more important than naming what's not working.",
  ],
  Integrity: [
    "When standing alone starts to feel like the only way to stand.",
  ],
  Builder: [
    "When making it work becomes the only reading of whether it's worth making.",
  ],
  Advocacy: [
    "When the cause becomes the proof of your goodness.",
  ],
  Meaning: [
    "When the long view stops checking whether the short view needs you here, now.",
  ],
  Endurance: [
    "When carrying the weight stops being noticed by you, and so stops being noticed by anyone.",
  ],
  Discernment: [
    "When detecting bad faith becomes assuming bad faith.",
  ],
  Generativity: [
    "When giving outward becomes losing track of yourself inward.",
  ],
};

const DISCERNMENT_GROWTH_PRIMARY =
  "leaving room for honest difference and ordinary error, not only for bad-faith pattern";
const DISCERNMENT_GROWTH_ALTERNATE =
  "letting in honest difference without re-classifying it as bad faith";

function buildGiftStem(
  cat: GiftCategory,
  cardPos: number,
  context?: BuildContext
): string {
  const template = pickVariant(GIFT_STEM_POOL, cardPos, context);
  const np = GIFT_NOUN_PHRASE[cat];
  return template
    .replace("{NP_LOWER}", np)
    .replace("{NP}", capitalize(np))
    .replace("{CAT_LABEL}", cat);
}

function buildGrowthStem(cardPos: number, context?: BuildContext): string {
  return pickVariant(GROWTH_EDGE_STEM_POOL, cardPos, context);
}

function buildRiskStem(
  cardPos: number,
  weather: WeatherLoad,
  context?: BuildContext
): string {
  const pool = weather.load === "high+" ? RISK_STEM_HIGH_POOL : RISK_STEM_POOL;
  return pickVariant(pool, cardPos, context);
}

// CC-023 Item 3 — per-card variant pool for growth-edge prose. Mirrors the
// BLIND_SPOT_TEXT_VARIANTS use-count pattern: when the same gift category
// surfaces on a second card (e.g., both Compass and Gravity pick Advocacy),
// the second card's growth edge renders in its own register. Categories
// without an entry here fall back to the canonical GROWTH_EDGE_TEXT[cat]
// single string. Discernment keeps its host-card branch (separate
// architecture, not affected here).
const GROWTH_EDGE_TEXT_VARIANTS: Partial<Record<GiftCategory, string[]>> = {
  Advocacy: [
    // First-occurrence variant — Compass register.
    "The growth move is leaving room for ignorance, complexity, and partial responsibility before reaching for the moral frame.",
    // Second-occurrence variant — Gravity register (where responsibility lives).
    "The growth move is asking, before you absorb the next responsibility, whether it is actually yours to carry — letting others hold what they are equipped to hold.",
  ],
};

function growthEdgeFor(
  cat: GiftCategory,
  card: CardKey,
  context?: BuildContext
): string {
  let sentence1: string;
  if (cat === "Discernment") {
    const isHost = context?.discernmentGrowthHostCard === card;
    const phrase = isHost ? DISCERNMENT_GROWTH_PRIMARY : DISCERNMENT_GROWTH_ALTERNATE;
    sentence1 = `The growth move is ${phrase}.`;
  } else {
    // CC-023 Item 3 — when a variant pool exists for this category, pick by
    // the per-category use-count (same selector logic as blindSpotFor).
    const variants = GROWTH_EDGE_TEXT_VARIANTS[cat];
    if (variants && variants.length > 1) {
      const usedCount = context?.usedCategories.get(cat) ?? 1;
      const idx = Math.max(0, Math.min(usedCount - 1, variants.length - 1));
      sentence1 = variants[idx];
    } else {
      sentence1 = GROWTH_EDGE_TEXT[cat];
    }
  }
  return sentence1;
}

// Short Lens summary phrase for inline reference (Path generator etc.).
// CC-015a: function codes removed from body prose; voice descriptors used.
export function lensSummaryPhrase(stack: LensStack): string {
  if (stack.confidence !== "high") return "your processing shape";
  return `your ${FUNCTION_VOICE_SHORT[stack.dominant]}–${FUNCTION_VOICE_SHORT[stack.auxiliary]} shape`;
}

// CC-015a — variant pools for blind-spot text. Discernment and Pattern were
// the two categories that hit verbatim cross-card duplication when both cards
// in a CC-011b cap-of-2 pair shared the gift category; each now carries a
// 3-deep pool so the second occurrence renders in a different register. Other
// categories carry their canonical phrase as a single-element array.
export const BLIND_SPOT_TEXT_VARIANTS: Record<GiftCategory, string[]> = {
  Pattern: [
    "Over-reading the future. The pattern you see clearly may stop being tested, and private interpretation may settle into private fact before evidence is in.",
    "Closing the read too soon. The pattern that lands first may shut out the patterns that need a longer look.",
    "Trusting the synthesis over the data. The shape you see may begin to feel realer than the messy specifics that shaped it.",
  ],
  Precision: [
    "Weaponized correctness. The same instinct that clarifies what is true may land as relational tone-deafness, especially when timing or care is what the moment is asking for.",
  ],
  Stewardship: [
    "Mistaking familiarity for truth. What has worked before is not always what's needed now, and protecting continuity may close off the disruption that a moment requires.",
  ],
  Action: [
    "Ignoring patterns and precedent. The instinct to move can outrun the situation, and momentum may become its own justification.",
  ],
  Harmony: [
    "Avoiding necessary truth. The instinct to keep the room intact may delay the conversation that would actually repair it.",
  ],
  Integrity: [
    "Private moral certainty. The conscience that holds the line may also become hard to reach when others need to be heard before they can be moved.",
  ],
  Builder: [
    "Instrumentalizing people. The instinct to ship may quietly reorganize others as means to outcomes, especially under deadline.",
  ],
  Advocacy: [
    // First-occurrence variant — fits the Compass register (what you protect).
    "Moral suspicion. The instinct to defend what's owed may begin to read disagreement itself as moral failure.",
    // CC-023 Item 3 — second-occurrence variant — fits the Gravity register
    // (where responsibility lives). When both Compass and Gravity surface
    // Advocacy, the second card now reads in its own metaphor rather than
    // duplicating the first.
    "Carrying what is not yours to carry. The instinct to locate responsibility may quietly extend to taking on the load of every harm you can see, until accountability for others becomes its own burden.",
  ],
  Meaning: [
    "Over-spiritualizing practical problems. What asks for a workable next step may be answered with a deeper interpretation instead.",
  ],
  Endurance: [
    "Carrying what is not yours. Capacity to hold weight may quietly absorb load that belongs to others, until carrying becomes identity.",
  ],
  Discernment: [
    "Cynicism. The same instinct that detects falsehood may begin reading bad faith into honest difference.",
    "Pre-judgment. The eye that catches what doesn't add up may start declaring the verdict before the evidence has fully arrived.",
    "Suspicion as default. The discernment that protects accuracy may begin reading every difference as deception.",
  ],
  Generativity: [
    "Controlling others 'for their own good.' The instinct to help may organize itself around what others ought to want.",
  ],
};

// Per-card blind-spot selector. Reads the BuildContext's per-category use
// counter to pick variant 0 for the first card with the category, variant 1
// for the second, etc. Falls back to variant 0 when no context is provided.
function blindSpotFor(
  cat: GiftCategory,
  context?: BuildContext,
  signalCtx?: {
    stack: LensStack;
    topCompass: SignalRef[];
    topGravity: SignalRef[];
    agency: AgencyPattern;
    weather: WeatherLoad;
    fire: FirePattern;
  }
): string {
  const variants = BLIND_SPOT_TEXT_VARIANTS[cat];
  const usedCount = context?.usedCategories.get(cat) ?? 1;
  const variantIdx = Math.max(0, Math.min(usedCount - 1, variants.length - 1));
  const sentence1 = variants[variantIdx];
  // CC-061 — compose Sentence 1 + Sentence 2 anchor when signal context is
  // available. Without signalCtx (legacy callers), return Sentence 1 alone.
  if (!signalCtx) return sentence1;
  const sentence2 = getBlindSpotSpecificity(
    cat,
    signalCtx.stack,
    signalCtx.topCompass,
    signalCtx.topGravity,
    signalCtx.agency,
    signalCtx.weather,
    signalCtx.fire
  );
  return `${sentence1} ${sentence2}`;
}

const GIFT_NOUN_PHRASE: Record<GiftCategory, string> = {
  Pattern: "a pattern-discernment gift",
  Precision: "a clarifying-precision gift",
  Stewardship: "a stewardship gift",
  Action: "an in-the-moment action gift",
  Harmony: "a relational-attunement gift",
  Integrity: "a costly-conviction gift",
  Builder: "a builder's gift",
  Advocacy: "an advocacy gift",
  Meaning: "a meaning-making gift",
  Endurance: "an endurance gift",
  Discernment: "a discernment gift",
  Generativity: "a generative gift",
};

const GIFT_DESCRIPTION: Record<GiftCategory, string> = {
  Pattern: "you tend to see the deeper shape of a problem before it becomes obvious to others",
  Precision: "you tend to clarify what's actually being claimed before the conversation moves",
  Stewardship: "you tend to preserve what matters across time, especially when others are looking past it",
  Action: "you tend to move when others freeze, and to learn by engaging the situation as it actually is",
  Harmony: "you tend to read the room and tend to what the moment is asking of those present",
  Integrity: "you tend to refuse compromises that would betray your own sense of what's right",
  Builder: "you tend to turn ideas into working systems and to push past friction toward a result",
  Advocacy: "you tend to notice what's owed and to protect those who can't protect themselves",
  Meaning: "you tend to connect what's happening to what it might mean over the longer arc",
  Endurance: "you tend to keep functioning under load that would unseat others",
  Discernment: "you tend to detect what doesn't add up before it surfaces openly",
  Generativity: "you tend to help others become more capable rather than more dependent",
};

// ── CC-052 — Gift Specificity (Rule 2 of CC-048 Report Calibration Canon) ─
//
// Each GIFT_DESCRIPTION entry composes with a user-specific *Sentence 2*
// anchor that names how the generic gift expresses for *this* user's signal
// pattern. The selector walks candidate conditions in priority order; the
// first match fires. The no-discriminator fallback per category is the
// safety net — every user landing on a gift category gets *some* anchor.
//
// Composition rule (canonical): `[Sentence 1, no leading qualifier]
// [Sentence 2, prefixed with "For your shape, this expresses as "]`.
//
// The "For your shape, this expresses as " prefix is locked. Future Rule 2
// implementations on other surfaces (THESIS_FALLBACK, lib/workMap.ts,
// lib/loveMap.ts) follow the same prefix pattern.

export function getGiftSpecificity(
  category: GiftCategory,
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern
): string {
  const dom = stack.dominant;
  const aux = stack.auxiliary;
  const has = (id: SignalId) => topCompass.some((r) => r.signal_id === id);
  const hasG = (id: SignalId) => topGravity.some((r) => r.signal_id === id);
  const PREFIX = "For your shape, this expresses as ";

  switch (category) {
    case "Pattern":
      if (dom === "ni" && (has("faith_priority") || has("knowledge_priority"))) {
        return PREFIX + "long-arc anticipation — reading where this is heading three years out, not three weeks.";
      }
      if (dom === "ne" && (has("freedom_priority") || has("learning_energy_priority"))) {
        return PREFIX + "breadth-of-frame — pattern-matching across many possibilities, finding the connection others didn't think to look for.";
      }
      return PREFIX + "the seeing-before-naming move — the sense that a structure is forming before you can fully articulate why.";

    case "Precision":
      if (dom === "ti" && (has("truth_priority") || has("knowledge_priority"))) {
        return PREFIX + "definitional discipline — refusing the comfortable fuzz of words that mean different things to different people.";
      }
      if (dom === "ti" && (agency.current === "creator" || hasG("system_responsibility_priority"))) {
        return PREFIX + "system-level diagnosis — locating the load-bearing claim that the rest of the structure depends on.";
      }
      return PREFIX + "the clarity-before-action instinct — the sense that an unclear claim is worse than no claim at all.";

    case "Stewardship":
      if (dom === "si" && (has("family_priority") || has("loyalty_priority"))) {
        return PREFIX + "keeping faith with the people and commitments that have earned your continuity.";
      }
      if (dom === "si" && (has("stability_priority") || has("honor_priority"))) {
        return PREFIX + "guarding the standards that hold even when conditions change — the patterns that earned their persistence.";
      }
      return PREFIX + "the long memory of what has actually worked, applied to what's being asked of you now.";

    case "Action":
      if (dom === "se" && has("freedom_priority")) {
        return PREFIX + "the refusal to wait for permission — moving toward the live edge of the situation rather than rehearsing the meta.";
      }
      if (dom === "se" && (agency.current === "creator" || has("justice_priority"))) {
        return PREFIX + "embodied advocacy — showing up physically for what's owed, not just naming it.";
      }
      return PREFIX + "the body-as-instrument move — knowing the situation by being in it, not above it.";

    case "Harmony":
      if (dom === "fe" && (has("family_priority") || has("faith_priority"))) {
        return PREFIX + "the keeper of the connective tissue — noticing what holds the people you love together and tending it before it frays.";
      }
      if (dom === "fe" && (has("compassion_priority") || has("mercy_priority"))) {
        return PREFIX + "soft strength — the patience to hold someone where they are while believing in who they're becoming.";
      }
      return PREFIX + "relational attunement — the sense that the room is asking something specific, even when no one is naming it.";

    case "Integrity":
      if (dom === "fi" && (has("truth_priority") || has("honor_priority"))) {
        return PREFIX + "the unflinching anchor — values lived through quiet refusals rather than declarations.";
      }
      if (dom === "fi" && (has("faith_priority") || has("justice_priority"))) {
        return PREFIX + "costly conviction — willing to bear the price for what your inner compass calls true.";
      }
      if (dom !== "fi" && (has("truth_priority") || has("honor_priority"))) {
        return PREFIX + "conviction earned through examination — what survives your testing becomes worth defending, even when the defense is socially costly.";
      }
      return PREFIX + "the inner compass that doesn't bend to social weather — what's true to you stays true regardless of who's in the room.";

    case "Builder":
      if (dom === "te" && agency.current === "creator" && aux === "ni") {
        return PREFIX + "the long-arc architect — building the structure the future shape requires, not the structure the present demands.";
      }
      if (dom === "te" && agency.current === "creator" && aux === "si") {
        return PREFIX + "the institutional builder — running what must keep working through standards, precedent, and operational trust.";
      }
      if (dom === "te" && hasG("system_responsibility_priority")) {
        return PREFIX + "the system-level fix — locating the layer of the structure where intervention will hold and applying it there.";
      }
      if (getFunctionPairRegister(stack)?.pair_key === "NiTe") {
        return PREFIX + "the long-arc architect — building the structure the future shape requires, not the structure the present demands.";
      }
      return PREFIX + "the move-toward-shipped instinct — friction is information, not a stop sign.";

    case "Advocacy":
      if (
        has("justice_priority") &&
        hasG("system_responsibility_priority") &&
        hasG("individual_responsibility_priority")
      ) {
        return PREFIX + "structural-with-accountability — looking for the accountable actor inside the system, not instead of the system.";
      }
      if (has("justice_priority") && (dom === "fi" || dom === "fe")) {
        return PREFIX + "the values-rooted defense — what's owed is felt before it's argued, and the argument follows the felt sense.";
      }
      return PREFIX + "the noticing-what's-missing instinct — seeing the absent voice in the room before others realize it's absent.";

    case "Meaning":
      if (dom === "ni" && has("faith_priority")) {
        return PREFIX + "the orienting trust — faith that doesn't replace agency but oriented the agency you exercise.";
      }
      if (dom === "ni" && aux === "fe" && (has("family_priority") || has("loyalty_priority"))) {
        return PREFIX + "the seer of becoming — holding what someone or something is growing into, not just what it is now.";
      }
      return PREFIX + "the long-arc read — the sense that this moment is connected to a longer pattern that hasn't fully revealed itself.";

    case "Endurance":
      if (dom === "si" && weather.intensifier === "high") {
        return PREFIX + "the carrier-of-load — staying functional in conditions that would have broken a different shape, often without naming the cost.";
      }
      if (has("stability_priority") && weather.load !== "low") {
        return PREFIX + "the steady-presence move — what others read as resilience is often the discipline of not flinching when flinching would help.";
      }
      return PREFIX + "continuity-under-pressure — the move that keeps the load distributed across time so it doesn't crack the shape carrying it.";

    case "Discernment":
      if (
        (dom === "ti" || dom === "ni") &&
        has("truth_priority") &&
        fire.willingToBearCost
      ) {
        return PREFIX + "anomaly-detection across moral, strategic, and linguistic patterns — noticing when language doesn't match reality, when an incentive doesn't match a stated objective, when a structure can't produce a promised outcome.";
      }
      if (dom === "ti" && (has("truth_priority") || has("knowledge_priority"))) {
        return PREFIX + "logical-coherence checking — the move that asks whether the system being claimed is actually consistent with itself.";
      }
      if (dom === "ni" && aux === "ne") {
        return PREFIX + "triangulation across many frames — pattern-matching that holds multiple possibilities at once and tests each against the one being claimed.";
      }
      return PREFIX + "the eye for what doesn't add up — catching the mismatch before it surfaces in language.";

    case "Generativity":
      if (dom === "te" && agency.aspiration === "relational") {
        return PREFIX + "the developer of others — taking on someone's growth as part of your own work, expecting them to outgrow your scaffolding.";
      }
      if (dom === "ne" && aux === "fi") {
        return PREFIX + "the inviter — naming what someone could become and offering the invitation in a way that honors what's true to them.";
      }
      if (
        dom === "te" &&
        (agency.aspiration === "stability" || agency.aspiration === "exploration")
      ) {
        return PREFIX + "the equipping move — making others more capable in the registers they choose, not the registers you'd choose for them.";
      }
      return PREFIX + "the capacity-builder instinct — measuring your contribution by who walks out more able than they walked in.";
  }
}

// ── CC-061 — Growth Edge + Blind Spot Specificity (Rule 3 of CC-048) ────
//
// Each generic Sentence 1 in GROWTH_EDGE_TEXT and BLIND_SPOT_TEXT_VARIANTS
// composes with a user-specific Sentence 2 anchor naming how the generic
// landing-shape expresses for *this* user's signal pattern. Same
// architecture as CC-052's getGiftSpecificity. Per CODEX-058b, do not gate
// on `gift_category` — entry is already routed by category. Gate on
// dominant function + Compass / Gravity / agency / weather / fire patterns.
//
// Composition rule: `[Sentence 1] [Sentence 2 with locked PREFIX]`.
// Locked prefixes are exported so contract.ts/extractAnchors can pull the
// embedded anchors back out for polish-layer round-trip validation.

export const SECOND_SENTENCE_PREFIX_BLIND_SPOT =
  "For your shape, this blind spot expresses as ";

export function getBlindSpotSpecificity(
  category: GiftCategory,
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern
): string {
  const dom = stack.dominant;
  const has = (id: SignalId) => inCompassTop(topCompass, id, 5);
  const hasG = (id: SignalId) => topGravity.some((r) => r.signal_id === id);
  const pairKey = getFunctionPairRegister(stack)?.pair_key;
  void topGravity;
  void agency;
  void weather;
  void fire;
  const PREFIX = SECOND_SENTENCE_PREFIX_BLIND_SPOT;

  switch (category) {
    case "Pattern":
      if (dom === "ni" && (has("knowledge_priority") || has("truth_priority"))) {
        return PREFIX + "the long-arc certainty that closes early — what you've been reading toward becomes the thing you stop letting evidence touch.";
      }
      if (dom === "ne" && (has("freedom_priority") || has("learning_energy_priority"))) {
        return PREFIX + "the breadth that loses the depth — the lateral connection feels like progress when staying with one would have produced the actual move.";
      }
      return PREFIX + "the read-that-stops-being-tested — the pattern lands, and the part of you that landed it stops asking whether it's still right.";

    case "Precision":
      if (dom === "ti" && (has("truth_priority") || has("knowledge_priority"))) {
        return PREFIX + "correctness that costs the room — the moment can't tell whether you're sharpening the claim or sharpening yourself against the claim's holder.";
      }
      if (dom === "ti" && (hasG("system_responsibility_priority") || agency.current === "creator")) {
        return PREFIX + "the system-diagnostic that ignores the system's people — the load-bearing claim is correctly named; the people who hold it are not.";
      }
      return PREFIX + "accuracy at the cost of audience — being right and being heard sometimes require different moves.";

    case "Stewardship":
      if (dom === "si" && (has("stability_priority") || has("honor_priority"))) {
        return PREFIX + "continuity-as-default — the pattern that earned its persistence sometimes outlasts the conditions that earned it, and continuing it becomes the reason a needed change doesn't happen.";
      }
      if (dom === "si" && (has("family_priority") || has("loyalty_priority"))) {
        return PREFIX + "faith-with-people-as-they-were — keeping faith with someone's earlier shape sometimes makes it harder to recognize the shape they've actually grown into.";
      }
      return PREFIX + "the long memory's drag — what has worked before is not always what's needed now, and the memory of working can quietly close off the disruption a moment requires.";

    case "Action":
      if (dom === "se" && has("freedom_priority")) {
        return PREFIX + "movement-without-read — the body's certainty about being-in-the-situation can outrun the question of whether the situation is the right one to be in.";
      }
      if (dom === "se" && (agency.current === "creator" || has("justice_priority"))) {
        return PREFIX + "embodied advocacy without precedent-check — showing up physically for what's owed sometimes runs past what's actually owed.";
      }
      return PREFIX + "the speed that becomes its own justification — momentum in service of nothing in particular still feels like motion forward.";

    case "Harmony":
      if (dom === "fe" && (has("family_priority") || has("faith_priority"))) {
        return PREFIX + "preserving-instead-of-repairing — the keeper of the room sometimes holds the room together at the cost of the conversation that would actually repair it.";
      }
      if (dom === "fe" && (has("compassion_priority") || has("mercy_priority"))) {
        return PREFIX + "soft-strength as withholding — patience sometimes lets damage compound that a harder kindness would have interrupted.";
      }
      return PREFIX + "the friction-deferred — the conversation kept comfortable now is the conversation that becomes resentment later.";

    case "Integrity":
      if (dom === "fi" && (has("truth_priority") || has("honor_priority"))) {
        return PREFIX + "private moral certainty — the conscience that doesn't bend to weather is also the conscience that's hard to reach when others need to be heard before they can be moved.";
      }
      if (dom !== "fi" && has("truth_priority") && has("honor_priority")) {
        return PREFIX + "conviction-as-conclusion — what survived your testing becomes hard to revisit even when new evidence would warrant the reopening.";
      }
      return PREFIX + "the inner anchor that closes the question — values that don't bend under social pressure also don't bend when honest reconsideration would be the right move.";

    case "Builder":
      if (dom === "te" && (agency.current === "creator" || hasG("system_responsibility_priority"))) {
        return PREFIX + "instrumentalizing under deadline — the people inside the system quietly become means to the structure rather than the reason for the structure.";
      }
      if (pairKey === "NiTe") {
        return PREFIX + "the long-arc structure ignoring the present arc's signal — the future shape you're building toward sometimes obscures what the people in front of you are actually telling you now.";
      }
      return PREFIX + "the ship-instinct's overreach — the part of you that completes structures sometimes rearranges the people around the structure as if they were part of it.";

    case "Advocacy":
      if (dom === "fi" && (has("justice_priority") || has("truth_priority"))) {
        return PREFIX + "the moral suspicion reflex — disagreement reads as moral failure before the disagreement has had its hearing.";
      }
      if (dom === "fe" && (has("compassion_priority") || has("mercy_priority"))) {
        return PREFIX + "champion-fatigue projected onto others — the load you're carrying for them gets read into them as their being unable to carry it themselves.";
      }
      return PREFIX + "the moral frame applied past its useful range — not every wrong is a war; not every gap is a betrayal.";

    case "Meaning":
      if (dom === "ni" && (has("faith_priority") || has("knowledge_priority"))) {
        return PREFIX + "deeper-interpretation as deflection — what asks for a workable next step gets answered with a frame that postpones the step indefinitely.";
      }
      if (dom === "fi" && (has("faith_priority") || has("honor_priority"))) {
        return PREFIX + "devotion-as-disengagement — the meaning that organizes your life sometimes sits at a register the actual living can't reach.";
      }
      return PREFIX + "over-spiritualizing the practical — the move asked for is sometimes the ordinary one, and meaning can crowd it out by being the more impressive answer.";

    case "Endurance":
      if (dom === "fe" && (has("family_priority") || has("caring_energy_priority"))) {
        return PREFIX + "load-creep — the weights of the people you love quietly become your weights without anyone making the choice for you.";
      }
      if (dom === "te" && (hasG("system_responsibility_priority") || agency.current === "creator")) {
        return PREFIX + "system-load-absorption — what the structure was supposed to distribute settles onto you because you're the one who'll carry it without complaint.";
      }
      return PREFIX + "carrying becoming identity — capacity is real, but capacity that never sets a load down stops being able to tell which loads are actually yours.";

    case "Discernment":
      if (dom === "ti" && (has("truth_priority") || has("knowledge_priority"))) {
        return PREFIX + "anomaly-projection — the eye that catches what doesn't add up starts catching anomalies that aren't there.";
      }
      if (dom === "ni" && (has("faith_priority") || has("honor_priority"))) {
        return PREFIX + "the long-arc read pre-judging — the pattern your shape has been reaching for becomes more visible than the patterns actually present.";
      }
      return PREFIX + "suspicion as default — discernment that protects accuracy slowly tilts into reading every difference as deception.";

    case "Generativity":
      if (dom === "fe" && (has("family_priority") || has("caring_energy_priority"))) {
        return PREFIX + "care-as-direction — wanting what's good for the people you tend slides into wanting them to want it the way you do.";
      }
      if (dom === "ne" && (has("freedom_priority") || has("learning_energy_priority"))) {
        return PREFIX + "the catalyst's overreach — the spark you keep providing was the gift; continuing to provide it sometimes prevents the fire from becoming self-sustaining.";
      }
      return PREFIX + "the helping-instinct organized around what others ought to want — capability doesn't always grow on the directed path; sometimes it needs the undirected one.";
  }
}

const GROWTH_EDGE_TEXT: Record<GiftCategory, string> = {
  Pattern: "The growth move is keeping the test alive — letting the pattern remain a hypothesis longer than the part of you that already sees it would prefer.",
  Precision: "The growth move is borrowing from relational care — letting timing and tone serve the truth rather than be sacrificed to it.",
  Stewardship: "The growth move is letting in disruption when the moment is structurally different from what came before.",
  Action: "The growth move is checking precedent and pattern before committing — momentum is a tool, not a verdict.",
  Harmony: "The growth move is naming the friction earlier than feels comfortable, so that repair can begin before resentment.",
  Integrity: "The growth move is letting other people in — sharing the weighing process rather than only the verdict.",
  Builder: "The growth move is checking that the people inside the system are still being seen as people, especially under deadline.",
  Advocacy: "The growth move is leaving room for ignorance, complexity, and partial responsibility before reaching for the moral frame.",
  Meaning: "The growth move is honoring the workable-next-step register, especially when meaning would otherwise crowd it out.",
  Endurance: "The growth move is asking which weight is actually yours, and letting some of it be carried by others or set down.",
  Discernment: "The growth move is leaving room for honest difference and ordinary error, not only for bad-faith pattern.",
  Generativity: "The growth move is letting others want what they want, and trusting that capability grows without your direction.",
};

// ── CC-025 — 4-Section ShapeCard Architecture ───────────────────────────
//
// Each card now closes with two card-register-specific sections beyond
// Strength + Growth Edge:
//   Practice — a card-keyed move the user can apply (replaces the
//     gift-category-keyed growthEdge.text on each card; Conviction skips
//     this slot because Posture occupies it).
//   Pattern Note — a closing aphorism keyed to the card's body-part
//     metaphor (rendered as italic / aphorism style in the UI).
//
// Both maps are fixed templates per spec — no signal interpolation in v1.
// The architecture is what solves the per-card duplication problem at
// scale: two cards with the same gift category (the case CC-023 hotfixed
// for Advocacy) cannot converge on the same Practice or Pattern Note
// because both keys are card-id-based, not category-based.
export const SHAPE_CARD_PRACTICE_TEXT: Partial<Record<ShapeCardId, string>> = {
  lens:
    "Before acting, ask: What is this moment connected to? What happened before, and what will this choice create next?",
  compass:
    "When values collide, say the tradeoff out loud: I am trying to protect both of these goods, but this moment requires an order.",
  // Conviction skips this slot — its Posture line occupies the equivalent
  // architectural position. See deriveConvictionOutput.
  gravity:
    "Ask: What part is mine? What part belongs to another person? What part belongs to circumstance, system, limitation, or mystery?",
  trust:
    "Separate three questions: Who do I trust for facts? Who do I trust for wisdom? Who do I trust because they love me?",
  weather:
    "Notice which patterns remain when the load eases. Those are more likely to be shape. The others may be weather.",
  fire:
    "Before paying a price, ask: Is this the right cost, for the right value, in the right way, at the right time?",
  path:
    "Choose one long-arc commitment that protects what matters most without depending on urgency: a recurring conversation, a standing act of generosity, a weekly planning ritual, or a relationship practice that continues when no one is asking.",
};

export const SHAPE_CARD_PATTERN_NOTE: Record<ShapeCardId, string> = {
  lens:
    "Your growth is not to abandon action. It is to let context travel with action.",
  compass:
    "Your values are strongest when they remain chosen priorities, not defended reflexes.",
  conviction:
    "Conviction becomes more beautiful when it is strong enough to speak plainly and humble enough to listen carefully.",
  gravity:
    "A strong spine does not carry every load. It carries the right load.",
  trust:
    "Discernment improves when trusted voices have different jobs rather than equal authority over everything.",
  weather:
    "This card protects the whole report from overclaiming. State is not the same as self.",
  fire:
    "Courage with calibration is stronger than courage alone.",
  path:
    "Your growth path is not to become less present. It is to let presence develop a memory and a future.",
};

// ── Per-card derivations ─────────────────────────────────────────────────

function lensCardHeader(stack: LensStack): string {
  return `Your processing pattern leans toward ${FUNCTION_VOICE[stack.dominant]}, supported by ${FUNCTION_VOICE[stack.auxiliary]}.`;
}

export function deriveLensOutput(
  stack: LensStack,
  weather: WeatherLoad,
  fire: FirePattern,
  agency: AgencyPattern,
  topCompass: SignalRef[] = [],
  topGravity: SignalRef[] = [],
  context?: BuildContext
): FullSwotOutput {
  const dom = stack.dominant;
  const aux = stack.auxiliary;
  const inf = stack.inferior;
  const cardPos = CARD_POSITION.lens;
  const cat = pickGiftCategoryForCard(
    "lens", stack, topCompass, topGravity, agency, weather, fire, context
  );
  const stem = buildGiftStem(cat, cardPos, context);

  const giftText =
    `${stem} your processing pattern leans toward ${FUNCTION_VOICE[dom]}. ` +
    `When this is operating in its native register, you tend to read the situation through ${FUNCTION_VOICE[dom]} and execute through ${FUNCTION_VOICE[aux]} — a combination that gives the shape its characteristic move. ` +
    `In health, this looks like the insight ${FUNCTION_VOICE[dom]} gives you, followed through by ${FUNCTION_VOICE[aux]}.`;

  // CC-086 Site 3 — driver-keyed Lens growth-edge anchor. Pre-CC the
  // Lens card's Sentence 2 came from `blindSpotFor` keyed by
  // GiftCategory; for Se / Fi / Fe / Si dominants whose Lens routed to
  // Precision / Pattern / Builder, the anchor used Ti/Te-coded language
  // ("accuracy at the cost of audience"). The driver-keyed override
  // below names each dominant's actual Lens-card growth edge — the
  // shape's own "this lens, overused, becomes that" — so the prose
  // matches the driver function instead of the category route.
  const LENS_GROWTH_EDGE_BY_DRIVER: Record<CognitiveFunctionId, string> = {
    ni: "long-arc certainty that closes early — what you've read toward becomes the thing you stop letting evidence touch.",
    ne: "possibility becoming evasion — the lateral connection feels like progress when staying with one would have produced the actual move.",
    si: "continuity becoming control — what worked before keeps doing duty past the conditions that made it work.",
    se: "responsiveness becoming reactivity — the in-the-moment move runs past the moment that asked for it.",
    ti: "precision becoming relational bluntness — being right and being heard sometimes require different moves.",
    te: "structure becoming non-delegation — the system you built becomes one you can't let anyone else carry.",
    fi: "conviction becoming over-sacrifice — the inner truth-test stops checking whether the cost is needed.",
    fe: "tending becoming self-erasure — the room's weather becomes yours, and your own register goes quiet.",
  };
  const PREFIX = SECOND_SENTENCE_PREFIX_BLIND_SPOT;
  const driverAnchor = LENS_GROWTH_EDGE_BY_DRIVER[dom];
  const blindText =
    `${capitalize(FUNCTION_VOICE[dom])}'s instinct, overused, can collapse into a smaller version of itself. ` +
    (driverAnchor
      ? `${BLIND_SPOT_TEXT_VARIANTS[cat][0]} ${PREFIX}${driverAnchor}`
      : `${blindSpotFor(cat, context, { stack, topCompass, topGravity, agency, weather, fire })}`);

  const growthStem = buildGrowthStem(cardPos, context);
  const growthText =
    `${growthStem} borrowing from ${FUNCTION_VOICE[inf]} — the voice you trust least. ` +
    `In shapes led by ${FUNCTION_VOICE[dom]}, that often looks like letting ${FUNCTION_VOICE[inf]} in for short, deliberate moments rather than waiting for it to be forced.`;

  const riskStem = buildRiskStem(cardPos, weather, context);
  const riskText =
    `${riskStem}, ${UNDER_PRESSURE_BEHAVIOR[dom]}, while ${FUNCTION_VOICE[inf]} surfaces in cruder form. ` +
    (fire.willingToBearCost
      ? `You appear willing to bear cost when belief is on the line — under heavy load that willingness may also harden.`
      : fire.adapts
      ? `You tend to adapt under social or economic pressure — under heavy load that adaptation may quietly silence the read ${FUNCTION_VOICE[dom]} is actually giving you.`
      : `Pressure can clarify; pressure can also distort. Both are real.`);

  // CC-025 — growthEdge.text replaced by the per-card Practice template
  // (locked, card-register-keyed). The old gift-category-keyed growthText
  // is retained in the variable above for any downstream consumer that
  // still wants the gift-category gloss; the cell that the user reads is
  // now the Practice template.
  void growthText;
  return {
    cardName: "Lens",
    bodyPart: "Eyes",
    cardHeader: lensCardHeader(stack),
    gift: { category: cat, text: giftText },
    blindSpot: { text: blindText },
    growthEdge: { text: SHAPE_CARD_PRACTICE_TEXT.lens! },
    patternNote: { text: SHAPE_CARD_PATTERN_NOTE.lens },
    riskUnderPressure: { text: riskText },
  };
}

// ── CC-054 — Peace + Faith cross-signal disambiguation ──────────────────
//
// Cross-signal interpretation rules that disambiguate `peace_priority` and
// `faith_priority` in user-facing prose. Both values are overloaded — peace
// can mean moral coherence / structural order / relational continuity /
// conflict-avoidance; faith varies on what the user has faith in (Q-C4
// attribution) AND how faith operates (cross-signal texture). The engine
// already measures both axes — these helpers compose the user's specific
// meaning from existing signals, with no question or signal additions.
//
// Architectural rules (do not relax without canon revision; see
// docs/canon/result-writing-canon.md § Rule 10 + § Faith Composite):
//   - Silent unless ranked top: helpers return `null` when peace_priority /
//     faith_priority is not in the user's Compass top 5. Render layer omits
//     the corresponding prose block in that case.
//   - Framework names canon-only: "Layer 1", "Shape", "Texture",
//     "faith-of-attribution" never appear in user-facing prose. Plain
//     language only.
//   - The locked prose templates are content; predicate logic is
//     workshop-tunable.

function inCompassTop(
  topCompass: SignalRef[],
  id: SignalId,
  n: number
): boolean {
  return topCompass.slice(0, n).some((r) => r.signal_id === id);
}

function signalRankAtMost(
  signals: Signal[],
  id: SignalId,
  max: number
): boolean {
  const s = signals.find((sig) => sig.signal_id === id);
  return s !== undefined && s.rank !== undefined && s.rank <= max;
}

function signalRankBetween(
  signals: Signal[],
  id: SignalId,
  min: number,
  max: number
): boolean {
  const s = signals.find((sig) => sig.signal_id === id);
  return (
    s !== undefined &&
    s.rank !== undefined &&
    s.rank >= min &&
    s.rank <= max
  );
}

export function getPeaceRegister(
  topCompass: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  fire: FirePattern,
  signals: Signal[]
): string | null {
  void agency;
  void weather;
  if (!inCompassTop(topCompass, "peace_priority", 5)) return null;

  // 1. Moral peace
  const moralValueGate =
    inCompassTop(topCompass, "truth_priority", 5) ||
    inCompassTop(topCompass, "knowledge_priority", 5) ||
    inCompassTop(topCompass, "honor_priority", 5);
  if (moralValueGate && fire.willingToBearCost) {
    return "You named Peace among your most sacred values — and your other rankings suggest you mean it in the metaphysical / moral register rather than the conflict-avoidance register. Truth and Honor compose with Peace in your top values, and your willingness to bear cost suggests you'd disturb surface ease to protect durable order. For your shape, peace is what comfort sometimes obstructs.";
  }

  // 2. Structural peace
  const structuralGate =
    signalRankAtMost(signals, "system_responsibility_priority", 2) ||
    signalRankAtMost(signals, "restoring_energy_priority", 2) ||
    inCompassTop(topCompass, "stability_priority", 5);
  if (structuralGate) {
    return "You named Peace among your most sacred values — and your other rankings suggest you mean it as durable structural order rather than surface calm. Your attribution patterns favor system-level fixes; your energy register leans toward restoring; stability ranks high. For your shape, peace is the result of fixing the system so recurring conflict stops, not avoiding the recurring conflict.";
  }

  // 3. Relational peace
  const relationalGate =
    inCompassTop(topCompass, "family_priority", 5) ||
    signalRankAtMost(signals, "caring_energy_priority", 2) ||
    signalRankAtMost(signals, "close_relationships_stakes_priority", 2);
  if (relationalGate) {
    return "You named Peace among your most sacred values — and your other rankings suggest you mean it as preserved bonds rather than absent conflict. Family ranks high in your sacred values; your caring energy is invested; close relationships sit at the top of what you'd hate to lose. For your shape, peace is the integrity of the connections you've built — sometimes worth disturbance, never worth severance.";
  }

  // 4. Surface peace (gentle-flag tone)
  const adaptsUnderSocial = signals.some(
    (s) => s.signal_id === "adapts_under_social_pressure"
  );
  const holdsConviction = signals.some(
    (s) => s.signal_id === "holds_internal_conviction"
  );
  if (adaptsUnderSocial || !holdsConviction) {
    return "You named Peace among your most sacred values, but your pressure-block patterns suggest you may sometimes equate peace with conflict-avoidance — yielding under social pressure, holding internal conviction less firmly than your other answers would suggest. For your shape, surface peace may sometimes substitute for the deeper coherence the Compass would name as your real protection. Worth noticing whether peace, for you, is an integrity-preserving register or a friction-avoiding one.";
  }

  // 5. Fallback
  return "You named Peace among your most sacred values. The instrument doesn't yet have enough cross-signal pattern to disambiguate which register of peace operates for you — moral coherence, structural order, relational continuity, or low-friction harmony. Read the Compass card's other registers for context.";
}

// Faith Shape — composite read across Q-C4 + Q-X3 + Q-X4 surfaces.
// Returns the locked Shape paragraph (or null if faith not in top 5).
export function getFaithShape(
  topCompass: SignalRef[],
  signals: Signal[],
  answers: Answer[]
): string | null {
  void answers;
  if (!inCompassTop(topCompass, "faith_priority", 5)) return null;

  // Attribution sub-prose (Q-C4) — pick by signal pattern. Mixed variant
  // fires when Individual AND Authority are both rank ≤ 2.
  const individualTop = signalRankAtMost(
    signals,
    "individual_responsibility_priority",
    2
  );
  const authorityTop = signalRankAtMost(
    signals,
    "authority_responsibility_priority",
    2
  );
  const supernaturalTop = signalRankAtMost(
    signals,
    "supernatural_responsibility_priority",
    2
  );
  const systemTop = signalRankAtMost(
    signals,
    "system_responsibility_priority",
    2
  );
  const naturalTop = signalRankAtMost(
    signals,
    "nature_responsibility_priority",
    2
  );

  let attributionProse: string;
  if (individualTop && authorityTop) {
    attributionProse =
      "when something goes wrong, you locate cause in human agency — Individual and Authority — more than in supernatural intervention or systemic causation";
  } else if (supernaturalTop) {
    attributionProse =
      "when something goes wrong, you locate cause in supernatural agency more than in human or systemic causation";
  } else if (individualTop) {
    attributionProse =
      "when something goes wrong, you locate cause in human agency — Individual responsibility — more than in supernatural intervention or systemic causation";
  } else if (systemTop) {
    attributionProse =
      "when something goes wrong, you locate cause in systemic structure more than in individual agency or supernatural intervention";
  } else if (authorityTop) {
    attributionProse =
      "when something goes wrong, you locate cause in those who hold authority — leaders, decision-makers, the people in charge of the systems";
  } else if (naturalTop) {
    attributionProse =
      "when something goes wrong, you locate cause in natural / material order — chance, biology, the way things just are";
  } else {
    attributionProse =
      "your attribution patterns sit between the available registers without a clear leading frame";
  }

  // Institutional sub-prose (Q-X3). Priority order: religious > mission >
  // civic > knowledge > business > none.
  const religiousInst = signalRankAtMost(signals, "religious_trust_priority", 2);
  const nonprofitsInst = signalRankAtMost(signals, "nonprofits_trust_priority", 2);
  const smallBusinessInst = signalRankAtMost(
    signals,
    "small_business_trust_priority",
    2
  );
  const largeBusinessInst = signalRankAtMost(
    signals,
    "large_companies_trust_priority",
    2
  );
  const govElectedInst = signalRankAtMost(
    signals,
    "government_elected_trust_priority",
    2
  );
  const govServicesInst = signalRankAtMost(
    signals,
    "government_services_trust_priority",
    2
  );
  const educationInst = signalRankAtMost(signals, "education_trust_priority", 2);
  const journalismInst = signalRankAtMost(signals, "journalism_trust_priority", 2);

  let institutionalProse: string;
  if (religiousInst) {
    institutionalProse =
      "Your institutional faith lands in religious organizations and faith communities";
  } else if (nonprofitsInst && (smallBusinessInst || largeBusinessInst)) {
    institutionalProse =
      "Your institutional faith lands in mission-driven organizations and close-to-the-consequence businesses — places where responsibility, consequence, and mission stay close to the people making decisions";
  } else if (nonprofitsInst) {
    institutionalProse =
      "Your institutional faith lands in mission-driven organizations and faith communities — places where responsibility, consequence, and mission stay close to the people making decisions";
  } else if (govElectedInst || govServicesInst) {
    institutionalProse =
      "Your institutional faith lands in civic and governance institutions";
  } else if (educationInst || journalismInst) {
    institutionalProse =
      "Your institutional faith lands in knowledge institutions — education, journalism, professional expertise";
  } else if (smallBusinessInst || largeBusinessInst) {
    institutionalProse =
      "Your institutional faith lands in close-to-the-consequence businesses — small/private over large/public";
  } else {
    institutionalProse =
      "Your institutional faith does not yet land cleanly in any single category of organization";
  }

  // Relational sub-prose (Q-X4). Mixed variant when own_counsel + partner
  // both top.
  const ownCounselTop = signalRankAtMost(signals, "own_counsel_trust_priority", 2);
  const partnerTrustTop = signalRankAtMost(signals, "partner_trust_priority", 2);
  const familyTrustTop = signalRankAtMost(signals, "family_trust_priority", 2);
  const friendTrustTop = signalRankAtMost(signals, "friend_trust_priority", 2);
  const mentorTrustTop = signalRankAtMost(signals, "mentor_trust_priority", 2);
  const outsideExpertTop = signalRankAtMost(
    signals,
    "outside_expert_trust_priority",
    2
  );

  let relationalProse: string;
  if (ownCounselTop && partnerTrustTop) {
    relationalProse =
      "Your personal faith lands in your own counsel and your spouse / partner — chosen-relational and self-anchored, not deferential";
  } else if (ownCounselTop) {
    relationalProse =
      "Your personal faith lands in your own counsel before any other person — chosen-self-reliant, not deferential";
  } else if (partnerTrustTop || familyTrustTop || friendTrustTop) {
    relationalProse =
      "Your personal faith lands in your family / partner / closest people first";
  } else if (mentorTrustTop) {
    relationalProse =
      "Your personal faith lands in chosen mentors and advisors";
  } else if (outsideExpertTop) {
    relationalProse =
      "Your personal faith lands in chosen professional advisors — therapists, clergy, lawyers, doctors, coaches";
  } else {
    relationalProse =
      "Your personal faith does not yet show a clear top-trust anchor among the relational sources the instrument measures";
  }

  return `You named Faith among your most sacred values. Your other answers shape what kind of faith you carry: ${attributionProse}. ${institutionalProse}. ${relationalProse}.`;
}

// Faith Texture — 5 register-class disambiguators. Returns the composed
// Texture paragraph (or null if faith not in top 5). Top 1-2 fire; if 3+
// match, render top 2 in the priority order documented below.
export function getFaithTexture(
  topCompass: SignalRef[],
  signals: Signal[]
): string | null {
  if (!inCompassTop(topCompass, "faith_priority", 5)) return null;

  const fireWillingToBearCost =
    signals.some((s) => s.signal_id === "high_conviction_under_risk") ||
    signals.some((s) => s.signal_id === "conviction_under_cost");
  const holdsConviction = signals.some(
    (s) => s.signal_id === "holds_internal_conviction"
  );
  const highConvictionUnderRisk = signals.some(
    (s) => s.signal_id === "high_conviction_under_risk"
  );

  // Priority order (when 3+ fire, render top 2 in this order):
  // moral architecture > living tension > hope > resistance to nihilism >
  // institutional loyalty.
  type Texture = { key: string; prose: string };
  const fired: Texture[] = [];

  // 1. Moral architecture
  if (
    inCompassTop(topCompass, "truth_priority", 5) &&
    inCompassTop(topCompass, "honor_priority", 5)
  ) {
    fired.push({
      key: "moral_architecture",
      prose:
        "moral architecture — the framework that makes ethical decisions possible rather than the comfort that makes them feel right",
    });
  }

  // 2. Living tension / burden
  if (
    holdsConviction &&
    inCompassTop(topCompass, "truth_priority", 5) &&
    (highConvictionUnderRisk || fireWillingToBearCost)
  ) {
    fired.push({
      key: "living_tension",
      prose:
        "living tension as much as comfort — what you carry, not just what you believe. The cost of belief is part of the belief",
    });
  }

  // 3. Hope in ultimate reconciliation
  if (
    inCompassTop(topCompass, "compassion_priority", 5) &&
    inCompassTop(topCompass, "mercy_priority", 5)
  ) {
    fired.push({
      key: "hope_reconciliation",
      prose:
        "hope in eventual reconciliation — that what's broken will not stay broken; that mercy and justice converge somewhere beyond what's currently visible",
    });
  }

  // 4. Resistance to nihilism
  if (
    signalRankBetween(signals, "supernatural_responsibility_priority", 3, 4) &&
    (inCompassTop(topCompass, "knowledge_priority", 5) ||
      inCompassTop(topCompass, "honor_priority", 5))
  ) {
    fired.push({
      key: "resistance_nihilism",
      prose:
        "resistance to nihilism — the claim that meaning, work, love, and giving are not accidental, even when the evidence is mixed",
    });
  }

  // 5. Institutional loyalty
  if (
    signalRankAtMost(signals, "religious_trust_priority", 2) &&
    signalRankAtMost(signals, "nonprofits_religious_spending_priority", 2)
  ) {
    fired.push({
      key: "institutional_loyalty",
      prose:
        "belonging — anchored in religious community, expressed through participation, doctrinal alignment, and shared practice",
    });
  }

  if (fired.length === 0) {
    return "For your shape, faith operates as a settled value — neither carried tension nor public belonging dominates the read.";
  }
  if (fired.length === 1) {
    return `For your shape, faith operates as ${fired[0].prose}.`;
  }
  // 2 or more: take top 2 in priority order (the array is already in
  // priority order because it was built in that sequence).
  const primary = fired[0];
  const secondary = fired[1];
  // Special-case the moral_architecture + living_tension pair to match the
  // canonical worked example wording; other pairings use the generic
  // ", with notes of" join.
  if (
    primary.key === "moral_architecture" &&
    secondary.key === "living_tension"
  ) {
    return "For your shape, faith operates as moral architecture, with notes of living tension — what you carry, not just what you believe.";
  }
  return `For your shape, faith operates as ${primary.prose}, with notes of ${secondary.prose}.`;
}

// Compose Faith Shape + Faith Texture into the canonical two-paragraph
// rendered prose. Returns null if faith not in top 5.
export function composeFaithProse(
  topCompass: SignalRef[],
  signals: Signal[],
  answers: Answer[]
): string | null {
  const shape = getFaithShape(topCompass, signals, answers);
  if (shape === null) return null;
  const texture = getFaithTexture(topCompass, signals);
  if (texture === null) return shape;
  return `${shape}\n\n${texture}`;
}

export function deriveCompassOutput(
  topCompass: SignalRef[],
  stack: LensStack,
  weather: WeatherLoad,
  fire: FirePattern,
  topGravity: SignalRef[] = [],
  agency: AgencyPattern = { current: "unknown", aspiration: "unknown" },
  context?: BuildContext,
  // CC-054 — signals + answers threaded so getPeaceRegister /
  // composeFaithProse can read cross-signal patterns from Q-C4 / Q-X3 /
  // Q-X4 / Q-Stakes1 / etc. Optional with empty defaults so existing
  // callers without disambiguation interest don't break (the helpers
  // gracefully return `null` when the top-of-Compass guard fails or
  // signals are empty).
  signals: Signal[] = [],
  answers: Answer[] = []
): FullSwotOutput {
  const cardPos = CARD_POSITION.compass;
  const cardHeader =
    topCompass.length === 0
      ? "Your sacred-value answers did not yet name a clear top priority."
      : `When something has to give, you appear to protect ${valueListPhrase(topCompass, 0)} first.`;

  const cat = pickGiftCategoryForCard(
    "compass", stack, topCompass, topGravity, agency, weather, fire, context
  );
  const stem = buildGiftStem(cat, cardPos, context);
  // CC-052 — append user-specific Sentence 2 anchor (Rule 2 implementation).
  const compassSpecificity = getGiftSpecificity(cat, stack, topCompass, topGravity, agency, weather, fire);
  const giftText =
    topCompass.length === 0
      ? "Your Compass output is thin in this session — the sacred-value rankings did not converge on a clear top."
      : `${stem} ${GIFT_DESCRIPTION[cat]}. ${compassSpecificity} ` +
        `Your top-ranked values (${valueListPhrase(topCompass, 0)}) are the structure that strength is built around.`;

  const blindText = blindSpotFor(cat, context, { stack, topCompass, topGravity, agency, weather, fire });
  const growthText = growthEdgeFor(cat, "compass", context);

  const riskStem = buildRiskStem(cardPos, weather, context);
  const fireFlavor = fire.willingToBearCost
    ? "You appear willing to absorb real cost for what you protect — under load, the same willingness may sharpen into rigidity."
    : fire.adapts
    ? "You tend to adapt under pressure — under load, that adaptation may begin to soften your top values into negotiable preferences."
    : "Under load, sacred values may begin to compete with each other in ways the ranking did not have to make explicit.";
  const riskText = `${riskStem}, your top values may express as defended absolutes rather than chosen priorities. ${fireFlavor}`;

  // CC-025 — Practice template replaces growthEdge.text per card.
  void growthText;

  // CC-054 — Peace + Faith cross-signal disambiguation. Both helpers return
  // null (silent) when the corresponding sacred value isn't in the user's
  // Compass top 5. The render layer guards on presence.
  const peaceProse = getPeaceRegister(topCompass, agency, weather, fire, signals);
  const faithProse = composeFaithProse(topCompass, signals, answers);

  return {
    cardName: "Compass",
    bodyPart: "Heart",
    cardHeader,
    gift: { category: cat, text: giftText },
    blindSpot: { text: blindText },
    growthEdge: { text: SHAPE_CARD_PRACTICE_TEXT.compass! },
    patternNote: { text: SHAPE_CARD_PATTERN_NOTE.compass },
    riskUnderPressure: { text: riskText },
    peace_register_prose: peaceProse ?? undefined,
    faith_register_prose: faithProse ?? undefined,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function deriveConvictionOutput(
  topCompass: SignalRef[],
  fire: FirePattern,
  stack: LensStack,
  topGravity: SignalRef[] = [],
  agency: AgencyPattern = { current: "unknown", aspiration: "unknown" },
  weather: WeatherLoad = { load: "moderate", intensifier: "moderate" },
  context?: BuildContext
): ConvictionOutput {
  const dom = stack.dominant;
  const cardPos = CARD_POSITION.conviction;

  let postureLabel = "considered";
  if (fire.willingToBearCost && (dom === "fi" || dom === "ni")) postureLabel = "principled";
  else if (fire.adapts && (dom === "fe" || dom === "fi")) postureLabel = "relational";
  else if ((dom === "te" || dom === "ti") && !fire.willingToBearCost) postureLabel = "evidence-driven";
  else if (dom === "fi") postureLabel = "identity-driven";
  else if (dom === "te" && fire.adapts) postureLabel = "pragmatic";
  else if (dom === "ni" && fire.willingToBearCost) postureLabel = "prophetic";

  const cardHeader = `You appear to hold belief in a ${postureLabel} register.`;

  const cat = pickGiftCategoryForCard(
    "conviction", stack, topCompass, topGravity, agency, weather, fire, context
  );
  const stem = buildGiftStem(cat, cardPos, context);
  // CC-052 — append user-specific Sentence 2 anchor (Rule 2 implementation).
  const convictionSpecificity = getGiftSpecificity(cat, stack, topCompass, topGravity, agency, weather, fire);
  const giftText =
    `${stem} ${GIFT_DESCRIPTION[cat]}. ${convictionSpecificity} ` +
    `In the moments when belief becomes expensive, that gift is what you tend to lean on.`;
  // CC-025 Step 1.4 — Conviction-register Growth Edge override. The
  // gift-category-keyed BLIND_SPOT_TEXT_VARIANTS pool produces an
  // action-register trap for Action-class gifts ("Ignoring patterns and
  // precedent. The instinct to move can outrun the situation...") which
  // composes wrong on the Conviction (Voice) card. When Conviction
  // happens to score Action-class, override with a conviction-register
  // variant. LaCinda's session was the named test case.
  const blindTextRaw = blindSpotFor(cat, context, { stack, topCompass, topGravity, agency, weather, fire });
  const blindText =
    cat === "Action"
      ? "The risk is that deeply held belief can become less available for conversation. When conviction has already chosen its room, it may stop checking whether the door should remain open."
      : blindTextRaw;

  let postureSentence: string;
  if (fire.willingToBearCost) {
    // CC-015b — drop the literal `the ${...} you protect` wrapper that produced
    // "the your top values you protect" when valueListPhrase returned a pre-
    // articled phrase. Use a plural-subject framing that works for every variant
    // returned by valuesPlural; reserve the singular fallback for the no-Compass
    // case.
    postureSentence =
      topCompass.length > 0
        ? `Under cost, your belief tends to hold — ${valuesPlural(topCompass, 1)} appear to outlast inconvenience. That is not the same as never updating; it is the shape of a conviction that won't be cheaply purchased.`
        : `Under cost, your belief tends to hold — what you protect appears to outlast inconvenience. That is not the same as never updating; it is the shape of a conviction that won't be cheaply purchased.`;
  } else if (fire.concealsUnderThreat) {
    postureSentence =
      `Under threat, your belief tends to go private rather than public. The conviction may remain, but it learns to hold its tongue — there are situations where that is wisdom and situations where it is a quiet erosion of the thing protected.`;
  } else if (fire.adapts) {
    postureSentence =
      `Under social or economic pressure, your belief tends to adapt — to soften, to find expression others can hear, sometimes to give ground. That adaptation may protect the relationship the belief lives inside of, and it may also negotiate the belief itself away.`;
  } else {
    postureSentence =
      `Your conviction posture is held internally — visible to you, less visible to others. Under pressure, the shape of belief tends to remain stable while its expression varies by audience.`;
  }

  return {
    cardName: "Conviction",
    bodyPart: "Voice",
    cardHeader,
    gift: { category: cat, text: giftText },
    blindSpot: { text: blindText },
    posture: postureSentence,
    // CC-025 — Conviction has no Practice slot; its Posture sentence
    // occupies the equivalent architectural position. Pattern Note appends.
    patternNote: SHAPE_CARD_PATTERN_NOTE.conviction,
  };
}

export function deriveGravityOutput(
  topGravity: SignalRef[],
  stack: LensStack,
  weather: WeatherLoad,
  topCompass: SignalRef[] = [],
  agency: AgencyPattern = { current: "unknown", aspiration: "unknown" },
  fire: FirePattern = { willingToBearCost: false, adapts: false, concealsUnderThreat: false, holdsInternalConviction: false },
  context?: BuildContext
): FullSwotOutput {
  const labels = topGravity.map((r) => GRAVITY_LABEL[r.signal_id] ?? r.signal_id);
  const cardPos = CARD_POSITION.gravity;
  // CC-063 — Rule 9 accountable-actor framing replaces the prior categorical
  // attribution-list reading. Locked content; ships verbatim from the CC-063
  // prompt's adherence example.
  const cardHeader =
    labels.length === 0
      ? "Your responsibility-attribution answers did not yet converge on a clear top frame."
      : `When something goes wrong, you appear to look first for the accountable actor inside the system — ${joinList(labels)} ${labels.length === 1 ? "ranks" : "rank"} highest in your responsibility weighting because they name who had agency, who made the decision, who failed to act. That doesn't mean you skip the system; it means you locate where the system became personal.`;

  const cat = pickGiftCategoryForCard(
    "gravity", stack, topCompass, topGravity, agency, weather, fire, context
  );
  const stem = buildGiftStem(cat, cardPos, context);
  const giftText =
    labels.length === 0
      ? "The Gravity output is thin in this session — no clear attribution frame surfaced."
      : `${stem} you tend to weigh ${joinList(labels)} as the locus where responsibility actually sits. That is the lens that protects accountability — your shape is unlikely to drift into vague blame.`;

  const blindText = blindSpotFor(cat, context, { stack, topCompass, topGravity, agency, weather, fire });
  const growthText = growthEdgeFor(cat, "gravity", context);

  const riskStem = buildRiskStem(cardPos, weather, context);
  const loadHint = weather.load === "high" || weather.load === "high+"
    ? "Under heavy current load, the same lens may begin to assign blame faster than it tests it."
    : "Under pressure, attribution that is usually careful may begin to harden.";
  const riskText =
    `${riskStem}, your responsibility frame is a strength when applied with care; under cost, it can become the only frame you reach for. ${loadHint}`;

  // CC-025 — Practice template replaces growthEdge.text per card.
  void growthText;
  return {
    cardName: "Gravity",
    bodyPart: "Spine",
    cardHeader,
    gift: { category: cat, text: giftText },
    blindSpot: { text: blindText },
    growthEdge: { text: SHAPE_CARD_PRACTICE_TEXT.gravity! },
    patternNote: { text: SHAPE_CARD_PATTERN_NOTE.gravity },
    riskUnderPressure: { text: riskText },
  };
}

export function deriveTrustOutput(
  topInst: SignalRef[],
  topPersonal: SignalRef[],
  stack: LensStack,
  weather: WeatherLoad,
  topCompass: SignalRef[] = [],
  topGravity: SignalRef[] = [],
  agency: AgencyPattern = { current: "unknown", aspiration: "unknown" },
  fire: FirePattern = { willingToBearCost: false, adapts: false, concealsUnderThreat: false, holdsInternalConviction: false },
  context?: BuildContext
): FullSwotOutput {
  const instLabels = topInst.map((r) => INST_LABEL[r.signal_id] ?? r.signal_id);
  const personalLabels = topPersonal.map((r) => PERSONAL_LABEL[r.signal_id] ?? r.signal_id);
  const cardPos = CARD_POSITION.trust;

  // CC-063 — Rule 8 conditional-framing replaces the prior categorical
  // institutional/personal trust reading. Locked content per the CC-063
  // prompt's four-case composition (both / inst-only / personal-only /
  // neither). The Rule-8 prefix renders verbatim in Cases A and B;
  // Cases C and D drop it because the institutional read is thin (no read
  // to condition).
  const cardHeader = (() => {
    if (instLabels.length === 0 && personalLabels.length === 0) {
      // Case D — both empty.
      return "Your trust answers did not yet converge on clear top sources.";
    }
    if (instLabels.length > 0 && personalLabels.length > 0) {
      // Case A — both populated (most common).
      return `You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, ${joinList(instLabels)} ${instLabels.length === 1 ? "sits" : "sit"} highest — likely because they tend to hold those proximities better than larger, more abstracted forms. For relational truth, ${joinList(personalLabels)} ${personalLabels.length === 1 ? "is" : "are"} where you turn first.`;
    }
    if (instLabels.length > 0) {
      // Case B — institutions only.
      return `You tend to trust institutions when responsibility, consequence, and mission stay close to the people making decisions. Among the institutions in your top-trust ranking, ${joinList(instLabels)} ${instLabels.length === 1 ? "sits" : "sit"} highest — likely because they tend to hold those proximities better than larger, more abstracted forms. Your personal trust answers did not yet converge on a clear top source.`;
    }
    // Case C — personals only.
    return `Your institutional trust answers did not yet converge on clear top sources. For relational truth, ${joinList(personalLabels)} ${personalLabels.length === 1 ? "is" : "are"} where you turn first.`;
  })();

  const cat = pickGiftCategoryForCard(
    "trust", stack, topCompass, topGravity, agency, weather, fire, context
  );
  const stem = buildGiftStem(cat, cardPos, context);
  // CC-052 — append user-specific Sentence 2 anchor (Rule 2 implementation).
  const trustSpecificity = getGiftSpecificity(cat, stack, topCompass, topGravity, agency, weather, fire);
  const giftText =
    `${stem} ${GIFT_DESCRIPTION[cat]}. ${trustSpecificity} ` +
    `Your top-trusted sources (${joinList([...instLabels, ...personalLabels].slice(0, 3))}) are who you appear to weight most when truth is at stake.`;
  const blindText = blindSpotFor(cat, context, { stack, topCompass, topGravity, agency, weather, fire });

  const growthStem = buildGrowthStem(cardPos, context);
  const growthText =
    `${growthStem} widening discernment without losing it — letting in voices currently weighted lower without flattening every source into the same plane.`;

  const riskStem = buildRiskStem(cardPos, weather, context);
  const loadCue = weather.load === "high" || weather.load === "high+"
    ? "Under heavy current load, the temptation to consolidate trust into one source — or to pull all trust inward — tends to grow."
    : "Worth checking when stakes rise.";
  const riskText =
    `${riskStem}, trust can collapse two ways: capture (over-trusting one source) or paranoia (under-trusting all sources). ${loadCue}`;

  // CC-025 — Practice template replaces growthEdge.text per card.
  void growthText;
  return {
    cardName: "Trust",
    bodyPart: "Ears",
    cardHeader,
    gift: { category: cat, text: giftText },
    blindSpot: { text: blindText },
    growthEdge: { text: SHAPE_CARD_PRACTICE_TEXT.trust! },
    patternNote: { text: SHAPE_CARD_PATTERN_NOTE.trust },
    riskUnderPressure: { text: riskText },
  };
}

export function deriveWeatherOutput(
  weather: WeatherLoad,
  formation: FormationContext,
  stack: LensStack,
  fire: FirePattern,
  topCompass: SignalRef[] = [],
  topGravity: SignalRef[] = [],
  agency: AgencyPattern = { current: "unknown", aspiration: "unknown" },
  context?: BuildContext
): FullSwotOutput {
  const formationPhrase =
    formation.childhood === "stable" ? "a relatively stable early environment"
    : formation.childhood === "chaotic" ? "an early environment that ran on uncertainty"
    : formation.childhood === "mixed" ? "an early environment that mixed stability with uncertainty"
    : "an early environment your answers did not yet describe";
  const authorityPhrase =
    formation.authority === "trusted" ? "early authority that read as protective"
    : formation.authority === "distrusted" ? "early authority that read as arbitrary or unfair"
    : formation.authority === "skeptical" ? "early authority that read as necessary but flawed"
    : "an early authority pattern your answers did not yet describe";
  const loadPhrase =
    weather.load === "high+" ? "high current load with heavy responsibility weight"
    : weather.load === "high" ? "high current load"
    : weather.load === "moderate" ? "moderate current load"
    : "low current load";

  const cardHeader = `You appear to be operating under ${loadPhrase}, formed in ${formationPhrase}, with ${authorityPhrase}.`;

  const cardPos = CARD_POSITION.weather;
  const cat = pickGiftCategoryForCard(
    "weather", stack, topCompass, topGravity, agency, weather, fire, context
  );

  const giftText =
    `Weather is context, not trait — but the way you have adapted to ${formationPhrase.replace(/^a /, "").replace(/^an /, "")} tends to show up as durable instinct. ` +
    `In health, that adaptation reads as ${formation.childhood === "chaotic" ? "preparedness for disruption" : formation.childhood === "stable" ? "an internal expectation of order" : "balanced sensitivity to context"}.`;

  const blindText =
    `Weather instincts may be mistaken for shape. Under ${loadPhrase}, behaviors that look like personality (cold, disorganized, anxious) may actually be adaptation to current pressure rather than your durable form.`;

  const growthStem = buildGrowthStem(cardPos, context);
  const growthText =
    `${growthStem} distinguishing state from shape: noticing when current load is doing the talking. This may suggest periodic checks of which patterns hold when load eases.`;

  const riskStem = buildRiskStem(cardPos, weather, context);
  const riskTail =
    weather.load === "high+" || weather.load === "high"
      ? "adaptive patterns may calcify into identity. The risk is mistaking what you have learned to do under pressure for what you actually are."
      : "the shape that has worked may stop working. The risk is treating context-stable patterns as universal patterns.";
  const riskText = `${riskStem}, ${riskTail}`;

  // CC-025 — Practice template replaces growthEdge.text per card.
  void growthText;
  return {
    cardName: "Weather",
    bodyPart: "Nervous System",
    cardHeader,
    gift: { category: cat, text: giftText },
    blindSpot: { text: blindText },
    growthEdge: { text: SHAPE_CARD_PRACTICE_TEXT.weather! },
    patternNote: { text: SHAPE_CARD_PATTERN_NOTE.weather },
    riskUnderPressure: { text: riskText },
  };
}

export function deriveFireOutput(
  fire: FirePattern,
  topCompass: SignalRef[],
  weather: WeatherLoad,
  stack: LensStack,
  topGravity: SignalRef[] = [],
  agency: AgencyPattern = { current: "unknown", aspiration: "unknown" },
  context?: BuildContext
): FullSwotOutput {
  const valuesPhrase =
    topCompass.length > 0
      ? valueListPhrase(topCompass, 6)
      : "the values your answers point toward";
  const cardPos = CARD_POSITION.fire;

  const fireSummary =
    fire.willingToBearCost && fire.adapts ? "you appear willing to bear cost on some axes and to adapt on others"
    : fire.willingToBearCost ? "you appear willing to bear real cost when belief is at stake"
    : fire.adapts && fire.concealsUnderThreat ? "you appear to adapt to social pressure and to hide belief under economic threat"
    : fire.adapts ? "you appear to adapt to social or economic pressure"
    : fire.holdsInternalConviction ? "you appear to hold conviction internally while expressing it carefully"
    : "your pressure-response pattern is mixed";

  const cardHeader = `Under conditions that cost you something, ${fireSummary}.`;

  const cat = pickGiftCategoryForCard(
    "fire", stack, topCompass, topGravity, agency, weather, fire, context
  );

  const giftText =
    `In the moments when ${valuesPhrase} are tested, your shape may be able to preserve what you protect — particularly when the cost is anticipated rather than ambushed. This is conditional, not declarative: pressure can clarify, and pressure can distort.`;

  const blindText =
    fire.adapts
      ? `What you may sacrifice too quickly under social or economic cost is the version of your truth that requires conflict to hold. Adaptation has a survival logic; it can also negotiate the thing protected away.`
      : fire.concealsUnderThreat
      ? `What you may sacrifice too quickly is visibility — the internal conviction may remain intact while the public expression of it learns to vanish.`
      : `What you may sacrifice too quickly under cost is calibration — when the willingness to bear cost stops registering whether the cost is needed.`;

  const growthStem = buildGrowthStem(cardPos, context);
  const growthText =
    `${growthStem} courage with calibration: distinguishing the costs worth bearing from the costs worth absorbing differently. Under heavy load, that distinction may need to be made out loud rather than only internally.`;

  const riskStem = buildRiskStem(cardPos, weather, context);
  const riskText =
    `${riskStem}, your shape may express as a smaller version of itself: the gift hardens into stance, the willingness becomes righteousness, the adaptation becomes silence. None of these is who you are; each is who you may become if the load is not eased.`;

  // CC-025 — Practice template replaces growthEdge.text per card.
  void growthText;
  return {
    cardName: "Fire",
    bodyPart: "Immune Response",
    cardHeader,
    gift: { category: cat, text: giftText },
    blindSpot: { text: blindText },
    growthEdge: { text: SHAPE_CARD_PRACTICE_TEXT.fire! },
    patternNote: { text: SHAPE_CARD_PATTERN_NOTE.fire },
    riskUnderPressure: { text: riskText },
  };
}

export function derivePathOutput(
  topCompass: SignalRef[],
  stack: LensStack,
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad
): PathOutput {
  const dom = stack.dominant;
  const gravityLabels = topGravity.map((r) => GRAVITY_LABEL[r.signal_id] ?? r.signal_id);

  const valuesClause =
    topCompass.length > 0
      ? `your top values (${valueListPhrase(topCompass, 7)})`
      : "what your answers point toward as protected";
  const lensShort = lensSummaryPhrase(stack);
  const gravityClause = gravityLabels.length > 0
    ? `you tend to locate responsibility around ${joinList(gravityLabels)}`
    : "your responsibility frame is still resolving";
  const agencyClause = agency.aspiration === "creator"
    ? "your aspirational energy tends to flow toward building"
    : agency.aspiration === "relational"
    ? "your aspirational energy tends to flow toward deepening relationships"
    : agency.aspiration === "stability"
    ? "your aspirational energy tends to flow toward restoring order"
    : agency.aspiration === "exploration"
    ? "your aspirational energy tends to flow toward exploration"
    : "your aspirational direction is still resolving";
  const loadHint =
    weather.load === "high" || weather.load === "high+"
      ? "Under current load, that direction may feel constrained — that constraint is not the verdict on the direction itself, only on the present capacity to follow it."
      : "Under current ordinary load, that direction is approachable in small consistent steps rather than dramatic shifts.";

  const directionalParagraph =
    `Your shape suggests work that lets you exercise ${FUNCTION_VOICE[dom]} will likely feel right; work that demands modes you reach for less easily — particularly the ones ${FUNCTION_VOICE[stack.inferior]} would have to lead — will drain you, even when the work itself is honorable. ` +
    `Love, for you, may be expressed more as the steady presence of ${valuesClause} than as easy verbal warmth — that does not make it less love, but it can leave the people closest to you wondering whether you see them. ` +
    `Your giving impulse, given that ${gravityClause}, will likely feel most meaningful when it addresses the structural shape of a problem rather than only its symptom. ` +
    `${capitalize(agencyClause)}, which suggests the next move is less about doing more and more about translating what you already do — letting ${lensShort} become more legible to the people who depend on it. ` +
    `${loadHint}`;

  // CC-015b — populate Path's expanded body subsections.
  const expansion = generatePathExpansion({
    topCompass, topGravity, agency, weather, stack,
    fire: { willingToBearCost: false, adapts: false, concealsUnderThreat: false, holdsInternalConviction: false },
  });

  return {
    cardName: "Path",
    bodyPart: "Gait",
    directionalParagraph,
    work: expansion.work,
    love: expansion.love,
    give: expansion.give,
    // CC-025 — Practice template replaces growthCounterweight (the
    // equivalent "next-move" slot in PathExpanded's narrative). The
    // legacy expansion.growthCounterweight is preserved as a void
    // reference for any downstream consumer; the Path Pattern Note
    // appends as a separate aphorism line at render time.
    growthCounterweight: SHAPE_CARD_PRACTICE_TEXT.path!,
    patternNote: SHAPE_CARD_PATTERN_NOTE.path,
  };
}

// ── Cross-card synthesis ─────────────────────────────────────────────────

// CC-023 Item 2 — fallback ladder for the Top 3 Gifts pad step. When the
// per-card candidates yield fewer than 3 distinct gift categories, pad
// from this ladder (in order, skipping any already in `out`). Order
// reflects the engine's preference for which "next" category reads as a
// sensible third gift when structural reads are thin. Pattern leads
// because it's the engine's most-frequent cross-card synthesis; the
// ladder fans out from there to cover every GiftCategory so the pad
// loop can always reach 3 distinct entries.
const TOP_GIFTS_FALLBACK_LADDER: GiftCategory[] = [
  "Pattern",
  "Discernment",
  "Endurance",
  "Integrity",
  "Stewardship",
  "Harmony",
  "Action",
  "Builder",
  "Advocacy",
  "Meaning",
  "Precision",
  "Generativity",
];

export function synthesizeTopGifts(
  shape: ShapeOutputs,
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  agency: AgencyPattern,
  weather: WeatherLoad,
  // CC-052 — fire threaded so getGiftSpecificity can fire the
  // willingToBearCost discriminator on Discernment + Integrity.
  fire: FirePattern
): TopGiftEntry[] {
  // Collect candidate gifts from cards that have category-tagged gifts.
  const candidates: { category: GiftCategory; source: string }[] = [];
  if (shape.lens.gift.category) candidates.push({ category: shape.lens.gift.category, source: "Lens" });
  if (shape.compass.gift.category) candidates.push({ category: shape.compass.gift.category, source: "Compass" });
  if (shape.conviction.gift.category) candidates.push({ category: shape.conviction.gift.category, source: "Conviction" });
  if (shape.gravity.gift.category) candidates.push({ category: shape.gravity.gift.category, source: "Gravity" });
  if (shape.trust.gift.category) candidates.push({ category: shape.trust.gift.category, source: "Trust" });

  // Add a synthesized cross-card gift candidate.
  const cross = pickGiftCategory(stack, topCompass, topGravity, agency, weather, {
    willingToBearCost: false, adapts: false, concealsUnderThreat: false, holdsInternalConviction: false,
  });
  candidates.push({ category: cross, source: "Cross-Card" });

  // Score: more sources for the same category = stronger synthesized gift.
  const counts = new Map<GiftCategory, number>();
  for (const c of candidates) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);

  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  // Fill to 3 with distinct categories. If fewer than 3 distinct, pad from ordered candidates.
  const out: GiftCategory[] = [];
  for (const cat of ranked) if (!out.includes(cat) && out.length < 3) out.push(cat);
  for (const c of candidates) if (!out.includes(c.category) && out.length < 3) out.push(c.category);
  // CC-023 Item 2 — pad from a category-aware ladder rather than blindly
  // pushing "Pattern". The previous `while (out.length < 3) out.push("Pattern")`
  // produced duplicate "A pattern-discernment gift" entries when "Pattern"
  // was already in `out` (Michele's case: Lens + Cross-Card both produced
  // Pattern, then the pad pushed Pattern a third time).
  for (const cat of TOP_GIFTS_FALLBACK_LADDER) {
    if (out.length >= 3) break;
    if (!out.includes(cat)) out.push(cat);
  }

  return out.map((cat, i) => {
    const closing = TOP_GIFTS_CLOSING_POOL[i % TOP_GIFTS_CLOSING_POOL.length];
    // CC-052 — append user-specific Sentence 2 anchor (Rule 2 implementation).
    const specificity = getGiftSpecificity(cat, stack, topCompass, topGravity, agency, weather, fire);
    return {
      label: capitalize(GIFT_NOUN_PHRASE[cat]) + ".",
      paragraph: capitalize(GIFT_DESCRIPTION[cat]) + ". " + specificity + " " + closing,
    };
  });
}

export function synthesizeTopRisks(
  shape: ShapeOutputs,
  weather: WeatherLoad,
  fire: FirePattern
): TopRiskEntry[] {
  const candidates: { source: string; cardKey: CardKey; category?: GiftCategory; text: string }[] = [
    { source: "Lens", cardKey: "lens", category: shape.lens.gift.category, text: shape.lens.riskUnderPressure.text },
    { source: "Compass", cardKey: "compass", category: shape.compass.gift.category, text: shape.compass.riskUnderPressure.text },
    { source: "Gravity", cardKey: "gravity", category: shape.gravity.gift.category, text: shape.gravity.riskUnderPressure.text },
    { source: "Trust", cardKey: "trust", category: shape.trust.gift.category, text: shape.trust.riskUnderPressure.text },
    { source: "Weather", cardKey: "weather", category: shape.weather.gift.category, text: shape.weather.riskUnderPressure.text },
    { source: "Fire", cardKey: "fire", category: shape.fire.gift.category, text: shape.fire.riskUnderPressure.text },
  ];

  // Prioritize Fire and Weather risks when load is high; Lens and Compass otherwise.
  const ordered =
    weather.load === "high+" || weather.load === "high"
      ? ["Fire", "Weather", "Lens", "Compass", "Gravity", "Trust"]
      : fire.willingToBearCost
      ? ["Compass", "Lens", "Fire", "Gravity", "Trust", "Weather"]
      : ["Lens", "Compass", "Gravity", "Trust", "Fire", "Weather"];
  const sorted = ordered
    .map((src) => candidates.find((c) => c.source === src))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  // Dedup labels: if the gift-category-derived editorial label collides with
  // an earlier card's label, fall back to TOP_RISK_CARD_FALLBACK[cardKey] —
  // an editorial per-card line, never the debug-style "{Card}-card risk
  // under pressure" placeholder.
  const usedLabels = new Set<string>();
  return sorted.slice(0, 3).map((c) => {
    const editorial = c.category ? TOP_RISK_LABEL_FOR_CATEGORY[c.category] : undefined;
    let label = editorial ?? TOP_RISK_CARD_FALLBACK[c.cardKey];
    if (usedLabels.has(label)) {
      label = TOP_RISK_CARD_FALLBACK[c.cardKey];
    }
    usedLabels.add(label);
    return { label, paragraph: c.text };
  });
}

export function generateGrowthPath(
  topCompass: SignalRef[],
  stack: LensStack,
  topGravity: SignalRef[],
  agency: AgencyPattern
): string {
  const gravityLabels = topGravity.map((r) => GRAVITY_LABEL[r.signal_id] ?? r.signal_id);
  const valuesClause = valueListPhrase(topCompass, 8);
  const dom = stack.dominant;
  const inf = stack.inferior;
  const aux = stack.auxiliary;
  const agencyMove = agency.aspiration === "creator"
    ? "letting yourself build"
    : agency.aspiration === "relational"
    ? "letting yourself invest in the people closest to you"
    : agency.aspiration === "stability"
    ? "letting yourself restore the order you keep meaning to fix"
    : agency.aspiration === "exploration"
    ? "letting yourself wander into the territory you keep meaning to learn"
    : "letting your aspiration become specific";
  const gravityMove = gravityLabels.length > 0
    ? `naming where ${joinList(gravityLabels)} actually does and does not do the work`
    : "letting your sense of where responsibility sits become more specific";

  return (
    `Your shape suggests work built around ${FUNCTION_VOICE[dom]}, with ${FUNCTION_VOICE[aux]} carrying the follow-through, will feel meaningful in a way work in other registers will not. ` +
    `Love is likely to be expressed in your shape more as durable presence around ${valuesClause} than as easy verbal warmth — and the people closest to you will read that more clearly the more you let ${FUNCTION_VOICE[inf]} stay open in small, deliberate ways. ` +
    `Giving, for your shape, points toward ${gravityMove}; symptomatic relief may feel less satisfying than structural repair, but small mercies are not negligible. ` +
    `The next move is less about doing more and more about ${agencyMove} — translating the shape that already is into a register the people who depend on you can read. ` +
    `None of this is fixed; the directional reading here is what your answers pointed toward, not what you must do.`
  );
}

export function generateRelationshipTranslation(
  stack: LensStack,
  topCompass: SignalRef[],
  fire: FirePattern
): string {
  const labels = compassLabels(topCompass);
  const dom = stack.dominant;
  const valueClause = labels.length > 0 ? joinList(labels.slice(0, 2)) : "what you protect";

  const fireFlavor = fire.willingToBearCost
    ? "Your willingness to bear cost may read as steadiness to people who trust your shape and as rigidity to people who don't yet."
    : fire.adapts
    ? "Your tendency to adapt under pressure may read as relational care to people who trust your shape and as capitulation to people who don't yet."
    : "Your conviction posture may read as principled to people who trust your shape and as opaque to people who don't yet.";

  return (
    `Others may experience ${FUNCTION_VOICE[dom]} as clarity when they trust you and as judgment when they do not. ` +
    `The way you carry ${valueClause} reads as steadiness to the people inside your circle and may read as withholding to people outside it. ` +
    `${fireFlavor} ` +
    `The translation is rarely about doing less of yourself — it is usually about being more legible.`
  );
}

export function generateConflictTranslation(
  stack: LensStack,
  topCompass: SignalRef[],
  fire: FirePattern
): string {
  const labels = compassLabels(topCompass);
  const dom = stack.dominant;
  const valueClause = labels.length > 0 ? labels[0] : "what you protect";

  const fireMove = fire.willingToBearCost
    ? "lead with the relational stake before delivering the corrective truth"
    : fire.adapts
    ? "name the actual disagreement before reaching for the soft language that usually keeps the room intact"
    : "show that you have weighed the cost on both sides before delivering the verdict";

  return (
    `When speaking with people whose Lens differs from the read ${FUNCTION_VOICE[dom]} gives you, ${fireMove}. ` +
    `When speaking with people whose top Compass value differs from your ${valueClause}, name what their value protects before insisting on what yours protects. ` +
    `The repeating shape: lead with what's shared before what's contested, and let your shape be visible without being deployed.`
  );
}

// CC-SHAPE-AWARE-PROSE-ROUTING — Mirror-Types contrast pool. Each cell
// holds the user-facing register name AND a one-clause protect-by
// gloss. The active dominant's row is filtered out of the contrast
// list so the user never sees their own register in the alternatives.
const MIRROR_TYPES_REGISTERS: Record<
  CognitiveFunctionId,
  { name: string; protectClause: (label: string) => string }
> = {
  ti: { name: "logical precision", protectClause: () => `getting the reasoning right` },
  ni: { name: "convergent insight", protectClause: () => `holding the long-arc interpretation` },
  fi: { name: "personal authenticity", protectClause: () => `refusing to participate in what feels false` },
  te: { name: "operational clarity", protectClause: () => `holding to what can be measured and shipped` },
  si: { name: "verified precedent", protectClause: () => `holding to what's been tested` },
  se: { name: "present-tense honesty", protectClause: () => `naming what is actually happening in the room` },
  ne: { name: "open exploration", protectClause: () => `keeping the alternative reads alive` },
  fe: { name: "relational attunement", protectClause: () => `reading the room and saying what serves` },
};

export function generateMirrorTypesSeed(
  topCompass: SignalRef[],
  stack: LensStack
): string {
  if (topCompass.length === 0) {
    return (
      `Your top sacred values did not yet name a clear primary — once they do, the mirror-types reading sharpens. ` +
      `In the meantime: people who share what you protect may organize around it in registers very different from the one ${FUNCTION_VOICE[stack.dominant]} gives you. ` +
      `Different shape, same commitment.`
    );
  }
  const top = topCompass[0];
  const label = COMPASS_LABEL[top.signal_id] ?? top.signal_id;
  const dom = stack.dominant;
  const ownRegister = MIRROR_TYPES_REGISTERS[dom];
  const lensExpression = `${ownRegister.name} — protecting ${label} by ${ownRegister.protectClause(label)}`;

  // CC-SHAPE-AWARE-PROSE-ROUTING — pick two contrast registers that
  // are NOT the user's own. Prefer canonically distant shapes (fi/si
  // pair, the original contrast example) but fall through to other
  // shapes when the user's dom IS fi or si.
  const candidatePairs: Array<[CognitiveFunctionId, CognitiveFunctionId]> = [
    ["fi", "si"],
    ["se", "ni"],
    ["ne", "te"],
    ["fe", "ti"],
    ["fi", "te"],
    ["si", "ne"],
  ];
  const pair =
    candidatePairs.find(([a, b]) => a !== dom && b !== dom) ?? ["fi", "ne"];
  const [a, b] = pair;
  const aReg = MIRROR_TYPES_REGISTERS[a];
  const bReg = MIRROR_TYPES_REGISTERS[b];

  return (
    `Your ${label}-shape leans toward ${lensExpression}. ` +
    `People who organize around ${label} differently may sound nothing like you and still share your deepest commitment. ` +
    `Someone whose ${label}-shape leans toward ${aReg.name} will protect ${label} by ${aReg.protectClause(label)}; someone whose ${label}-shape leans toward ${bReg.name} will protect ${label} by ${bReg.protectClause(label)}. ` +
    `They may strike you as sentimental, or rigid, or impractical — and they may be protecting the same thing you are, in a register you don't speak.`
  );
}

export function generateWatchFor(
  shape: ShapeOutputs,
  weather: WeatherLoad,
  fire: FirePattern
): string[] {
  // Pull a single Watch-For trigger from each card category that surfaced,
  // in canonical card order, with dedup. Augment with conditional triggers
  // tied to weather/fire load when present. Cap at 6, floor at 4 by padding
  // from category templates not yet drawn.
  const orderedCards: { key: CardKey; cat?: GiftCategory }[] = [
    { key: "lens", cat: shape.lens.gift.category },
    { key: "compass", cat: shape.compass.gift.category },
    { key: "conviction", cat: shape.conviction.gift.category },
    { key: "gravity", cat: shape.gravity.gift.category },
    { key: "trust", cat: shape.trust.gift.category },
    { key: "weather", cat: shape.weather.gift.category },
    { key: "fire", cat: shape.fire.gift.category },
  ];

  const out: string[] = [];
  const seenSentences = new Set<string>();
  const seenCats = new Set<GiftCategory>();

  for (const { key, cat } of orderedCards) {
    if (!cat) continue;
    if (seenCats.has(cat)) continue;
    const templates = WATCH_FOR_TEMPLATES[cat];
    if (!templates || templates.length === 0) continue;
    const idx = CARD_POSITION[key] % templates.length;
    const sentence = templates[idx];
    if (seenSentences.has(sentence)) continue;
    out.push(sentence);
    seenSentences.add(sentence);
    seenCats.add(cat);
    if (out.length >= 6) break;
  }

  // Conditional triggers — only added if not duplicative.
  const weatherTrigger =
    weather.load === "high+" || weather.load === "high"
      ? "When operating-under-load stops being a temporary state and starts being read as the shape itself."
      : null;
  if (weatherTrigger && !seenSentences.has(weatherTrigger) && out.length < 6) {
    out.push(weatherTrigger);
    seenSentences.add(weatherTrigger);
  }

  const fireTrigger =
    fire.willingToBearCost
      ? "When willingness to bear cost stops checking whether the cost is needed."
      : fire.adapts
      ? "When the adaptation that protects the relationship begins quietly to cost the conviction it was built to carry."
      : fire.concealsUnderThreat
      ? "When holding belief privately starts to feel like the only safe place for it to live."
      : null;
  if (fireTrigger && !seenSentences.has(fireTrigger) && out.length < 6) {
    out.push(fireTrigger);
    seenSentences.add(fireTrigger);
  }

  // Floor at 4: pad from any category templates not yet drawn, in canonical order.
  if (out.length < 4) {
    const padOrder: GiftCategory[] = [
      "Pattern", "Precision", "Discernment", "Stewardship", "Action",
      "Harmony", "Integrity", "Builder", "Advocacy", "Meaning",
      "Endurance", "Generativity",
    ];
    for (const cat of padOrder) {
      if (out.length >= 4) break;
      if (seenCats.has(cat)) continue;
      const templates = WATCH_FOR_TEMPLATES[cat];
      const sentence = templates[0];
      if (!sentence || seenSentences.has(sentence)) continue;
      out.push(sentence);
      seenSentences.add(sentence);
      seenCats.add(cat);
    }
  }

  return out.slice(0, 6);
}

export function generateShapeSummary(
  stack: LensStack,
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  weather: WeatherLoad
): string {
  const gravityLabels = topGravity.map((r) => GRAVITY_LABEL[r.signal_id] ?? r.signal_id);
  const dom = stack.dominant;
  const aux = stack.auxiliary;
  const valuesClause =
    topCompass.length > 0
      ? `protect ${valueListPhrase(topCompass, 9)}`
      : "have not yet converged on a clear top value";
  const gravityClause = gravityLabels.length > 0 ? `attribute responsibility primarily to ${joinList(gravityLabels)}` : "are still resolving where you locate responsibility";
  const loadClause =
    weather.load === "high+" ? "carry heavy current load with high responsibility weight"
    : weather.load === "high" ? "carry significant current load"
    : weather.load === "moderate" ? "carry ordinary current load"
    : "are operating under relatively low current load";

  return (
    `Your shape appears to ${valuesClause}, process through ${FUNCTION_VOICE[dom]} supported by ${FUNCTION_VOICE[aux]}, ${gravityClause}, and ${loadClause}. ` +
    `What follows is a description of that shape — its likely strengths, its characteristic distortions, the moves that may extend it, and the patterns that may surface when load is heavy. ` +
    `It is a possibility, not a verdict; the final authority on what fits is yours.`
  );
}

// ── CC-015b: Mirror generator + Path expansion ──────────────────────────
//
// Authoring scope choice: per spec § D-7 / § D-6, the 8-dominant-function
// fallback is used (rather than full 16 MBTI archetypes). Each per-function
// template is parameterized by topCompass / topGravity / agency / weather,
// and the auxiliary-function shapes one move per archetype where it
// meaningfully changes the read. The full 16-archetype expansion can land
// in a follow-up CC.
//
// Voice register: every prose template here respects `result-writing-canon.md`
// (no function codes in body prose; voice descriptors via FUNCTION_VOICE/_SHORT;
// hedging vocabulary preserved; protected lines used verbatim).

type GeneratorContext = {
  topCompass: SignalRef[];
  topGravity: SignalRef[];
  agency: AgencyPattern;
  weather: WeatherLoad;
  fire: FirePattern;
  stack: LensStack;
};

function topCompassLabel(topCompass: SignalRef[]): string {
  if (topCompass.length === 0) return "what you protect";
  return COMPASS_LABEL[topCompass[0].signal_id] ?? topCompass[0].signal_id;
}

function valuesPlural(topCompass: SignalRef[], variantIdx: number): string {
  // Returns the values list pre-articled, suitable as a plural subject:
  // "Knowledge, Truth, …" / "your top values" / "the values you protect" /
  // "the N values you ranked highest". Avoids the doubled-determiner glitch
  // by never accepting a literal "the " in the surrounding template.
  if (topCompass.length === 0) return "what you protect";
  const labels = compassLabels(topCompass);
  switch (variantIdx % 4) {
    case 0:  return joinList(labels);
    case 1:  return "your top values";
    case 2:  return "the values you protect";
    case 3:  return `the ${labels.length} values you ranked highest`;
    default: return joinList(labels);
  }
}

// ── Per-shape Next 3 Moves vocabulary (8 dominant-function fallback) ────

type MoveTemplate = (ctx: GeneratorContext) => { label: string; paragraph: string };

const NEXT_MOVES_BY_DOM: Record<CognitiveFunctionId, MoveTemplate[]> = {
  ni: [
    (ctx) => ({
      label: "Show the weighing process.",
      paragraph: `Don't just deliver the verdict — let people see the steps. The reasoning, the cost considered, the alternatives ruled out. Trust grows in the visible distance between insight and conclusion${ctx.topCompass.length > 0 ? ", especially when " + topCompassLabel(ctx.topCompass) + " is what you're protecting" : ""}.`,
    }),
    (ctx) => ({
      label: "Let the present interrupt the theory.",
      paragraph: `Briefly and deliberately. The pattern you see clearly is not always the pattern in the room right now. Make small space for what's actually here — ${ctx.stack.auxiliary === "te" ? "the deliverable that's overdue, the meeting that ran long" : "the body you're in, the conversation you're inside"}.`,
    }),
    (ctx) => ({
      label: "Reserve protected time for creation.",
      paragraph: `Maintenance can swallow your week. The shape that builds atrophies in pure reaction. One page, one model, one structural fix per week — even when no one's asking, especially when ${ctx.weather.load === "high+" || ctx.weather.load === "high" ? "the load is heavy and creation feels indulgent" : "ordinary days make it easy to defer"}.`,
    }),
  ],
  ne: [
    (ctx) => ({
      label: "Close one loop before opening three more.",
      paragraph: `Your generation rate outpaces your finishing rate. Pick the option that's already 60% of the way there and ship it before the next angle pulls you sideways${ctx.topCompass.length > 0 ? "; the value you're really serving (" + topCompassLabel(ctx.topCompass) + ") is in the finishing, not the seeing" : ""}.`,
    }),
    () => ({
      label: "Let the boring path teach you.",
      paragraph: `The unglamorous version of the work — the iteration that does not generate new ideas — is where the actual skill sits. Stay with one approach long enough to see what only repetition shows.`,
    }),
    (ctx) => ({
      label: "Externalize the map.",
      paragraph: `What lives easily in your head as a web of possibilities lives badly in others' heads. Write the three options down before you propose them. ${ctx.stack.auxiliary === "fi" ? "What feels obvious to your inner read is not obvious to anyone else." : "The structure you skip becomes the structure they invent — usually wrong."}`,
    }),
  ],
  si: [
    (ctx) => ({
      label: "Notice when 'we tried this' is doing the deciding.",
      paragraph: `Past precedent is good data, not a verdict. Once a week, ask whether the situation is structurally similar enough to the past one for the precedent to apply${ctx.weather.load === "high+" ? ", especially under current load" : ""}.`,
    }),
    () => ({
      label: "Let in one disruption per month.",
      paragraph: `Deliberately. Pick something the established way says you don't need — a tool, a process, a person's framing — and try it for a contained window. Most of the time you'll come back. The point is the practice of staying open.`,
    }),
    (ctx) => ({
      label: "Name the why behind the what.",
      paragraph: `You know the right way; others don't always know why it's right. When you protect ${topCompassLabel(ctx.topCompass)}, say what would be lost if you didn't. The verdict travels further when its reasoning travels with it.`,
    }),
  ],
  se: [
    () => ({
      label: "Give the meaning a beat.",
      paragraph: `Before you respond to what's in front of you, ask once: what is this actually about? The action you're already mid-way to making is usually right; the one-second pause makes sure it's right for the right reason.`,
    }),
    (ctx) => ({
      label: "Let pattern do half the work.",
      paragraph: `Your read of the present moment is sharp; the read of how this moment connects to last month's moment is what you reach for less. Spend ten minutes a week looking at the trajectory, not the snapshot${ctx.weather.load === "high+" ? "; under load, that ten minutes is the difference between adapting and reacting" : ""}.`,
    }),
    (ctx) => ({
      label: "Anchor at least one commitment to the long arc.",
      paragraph: `Most of your week is responsive — that is the gift. Pick one thing — a habit, a project, a relationship investment — that you keep doing whether the present-moment pull endorses it or not. ${ctx.topCompass.length > 0 ? "Let " + topCompassLabel(ctx.topCompass) + " be what makes that anchor non-negotiable." : "Let your values, not the day, decide whether it gets done."}`,
    }),
  ],
  ti: [
    () => ({
      label: "Speak the working framework, not just the conclusion.",
      paragraph: `Others can't replicate your reasoning if you only show them the answer. Spend a sentence or two on the categorization that made the answer obvious to you. That is most of what generosity costs you.`,
    }),
    (ctx) => ({
      label: "Let timing serve the truth.",
      paragraph: `Precision is right; precision delivered at the wrong moment lands as correction. Notice the room before the framework comes out${ctx.stack.auxiliary === "ne" ? " — your auxiliary already does this faster than you trust it to" : ""}.`,
    }),
    () => ({
      label: "Test one assumption you're sure about.",
      paragraph: `Once a week. Pick the proposition that feels most settled and look for the case that breaks it. The internal-coherence engine is already strong; the move is to keep it from settling into private fact.`,
    }),
  ],
  te: [
    (ctx) => ({
      label: "Slow the optimization for the people in the system.",
      paragraph: `The plan is right; the people inside it have a different timing. One check-in per cycle that is not a status update — what does this feel like to carry — keeps the system you're building from quietly hollowing out${ctx.weather.load === "high+" ? ", especially under load" : ""}.`,
    }),
    () => ({
      label: "Let one thing stay un-shipped on purpose.",
      paragraph: `Your bias is to close the loop. Pick something that is genuinely unfinished and let it sit — a question, a decision, a relationship dynamic. The discomfort is the practice. Not everything has to convert to a deliverable.`,
    }),
    (ctx) => ({
      label: "Name the goal you're actually optimizing for.",
      paragraph: `You move fast because the target is clear. When ${topCompassLabel(ctx.topCompass)} and the goal-as-metricked diverge, the goal usually wins by default. Make the divergence explicit before it decides anything.`,
    }),
  ],
  fi: [
    () => ({
      label: "Let people in earlier than feels safe.",
      paragraph: `Your inner sense of right is private by default; that privacy can read as withholding. One sentence about what you're weighing, before you've reached the verdict, gives others a way to be with you in the work — not just receive its result.`,
    }),
    (ctx) => ({
      label: "Test the conviction against ordinary error.",
      paragraph: `What feels morally clear inside is not always being violated outside. Before reading bad faith, run the read past someone whose Lens differs from yours${ctx.topCompass.length > 0 ? " — especially when " + topCompassLabel(ctx.topCompass) + " is what feels at stake" : ""}.`,
    }),
    () => ({
      label: "Build a way to stay when staying is hard.",
      paragraph: `Your shape can leave fast when integrity feels at stake. Pick one relationship or project where the right move is to stay through the hard middle. The discipline is in the staying, not the leaving.`,
    }),
  ],
  fe: [
    () => ({
      label: "Name the thing you've been smoothing over.",
      paragraph: `You read the room well; the read can become a reason to delay the conversation that would actually repair it. Pick one place where keeping the surface calm is costing the underneath, and bring the underneath into the room.`,
    }),
    (ctx) => ({
      label: "Make space for your own read to land.",
      paragraph: `Your attention goes outward by default. Once a week, ask what you actually think — not what would land well, not what would harmonize. ${ctx.topCompass.length > 0 ? topCompassLabel(ctx.topCompass) + " has a specific shape inside you; let it speak in your own voice before it reaches the room." : "Let the read live in your own voice before it adapts to anyone else's."}`,
    }),
    () => ({
      label: "Distinguish care from custody.",
      paragraph: `Tending to the room is a gift. Carrying the room's emotional weight as if it were yours to fix is a different thing. Notice which one you're doing — the pattern of the one becoming the other is where the cost lives.`,
    }),
  ],
};

export function generateNextMoves(ctx: GeneratorContext): NextMove[] {
  const templates = NEXT_MOVES_BY_DOM[ctx.stack.dominant];
  return templates.map((t) => t(ctx));
}

// ── Per-shape Path expansion vocabulary (8 dominant-function fallback) ──

type PathSubsectionTemplate = (ctx: GeneratorContext) => string;

const PATH_WORK_BY_DOM: Record<CognitiveFunctionId, PathSubsectionTemplate> = {
  ni: (ctx) => {
    const v = topCompassLabel(ctx.topCompass);
    return (
      `Work, for this shape, is rarely just labor. It is translation — converting a long-arc read of how things are likely to land into something the people around you can actually act on. ` +
      `You are likely to feel most engaged when work lets you make hidden structure visible: the frame nobody is naming, the model that would explain why the surface is what it is, the strategy that holds three years out instead of three weeks. ` +
      `Good fits tend to share a quiet feature: they reward time spent thinking before acting, and they leave room for the read to mature without demanding constant deliverable proof of it. Bad fits usually announce themselves the same way — pure reactivity, optimization against metrics that miss the point, work that requires you to keep restating the obvious. ` +
      `On a Tuesday afternoon, the work that lights this shape up looks like: writing the strategy memo nobody asked for, naming the structural problem behind the symptom everyone is treating, designing the system that won't have to be redesigned in eighteen months. ${ctx.topCompass.length > 0 ? `When ${v} is what you're protecting, the engagement deepens — work becomes a way of keeping ${v} structurally in the world.` : ""}`
    );
  },
  ne: (ctx) => {
    const v = topCompassLabel(ctx.topCompass);
    return (
      `Work, for this shape, runs on possibility. The good days are the ones where a single conversation generates four directions worth chasing; the hard days are the ones where the deliverable demands you commit to one before you've finished mapping the rest. ` +
      `You're likely to do your best work in environments that reward exploration and tolerate unfinished thinking — places where the question is open, the constraints are real but not crushing, and what you bring is the unexpected combination nobody else saw. ` +
      `Bad fits are environments that punish the divergence: rigid process, narrow goals, performance metrics that count finished output but not the new direction your half-finished output revealed. ` +
      `On a Tuesday afternoon, this shape thrives on connecting things — the article that links to the project, the project that links to the conversation, the conversation that opens a new field. ${ctx.topCompass.length > 0 ? `When ${v} grounds the exploration, the work has somewhere to land; without that grounding, the possibilities can keep multiplying past the point of usefulness.` : ""}`
    );
  },
  si: (ctx) => {
    const v = topCompassLabel(ctx.topCompass);
    return (
      `Work, for this shape, is continuity. The good work is the work that builds on what came before — refining a craft, maintaining a system, holding institutional memory while others rotate through. ` +
      `You're likely to be most engaged where the standards are clear, the lineage matters, and the results compound. Stewardship reads as boring from the outside and quietly profound from the inside; this shape knows that the second kind is the truer one. ` +
      `Bad fits are environments that prize novelty for its own sake, demand reinvention without cause, or treat your accumulated knowledge as inertia to overcome. ` +
      `On a Tuesday afternoon, this work looks like: making sure the thing that worked last quarter still works this quarter, training the new person in what experience already taught you, noticing the small drift in quality before it becomes a problem. ${ctx.topCompass.length > 0 ? `When ${v} is what you're protecting, the work becomes a kind of guardianship — you keep the part of the institution that matters from being quietly forgotten.` : ""}`
    );
  },
  se: (ctx) => {
    const v = topCompassLabel(ctx.topCompass);
    return (
      `Work, for this shape, is engagement with what's actually here. The work that energizes you is responsive, tactile, immediate — the situation in front of you that needs to be handled, the room that needs to be read, the moment that needs the right move now. ` +
      `You're likely to do best where action is visible, feedback is fast, and the work itself is the conversation. Operational work, performance work, work that rewards being present and adaptive — these are your registers. ` +
      `Bad fits are environments built for long planning cycles, abstract metrics, and the kind of meeting where nothing is actually happening. The disengagement is fast and physical when the work loses its present-tense pulse. ` +
      `On a Tuesday afternoon, this shape's work looks like: closing the deal that's already in motion, fixing the thing that broke this morning, being the one who reads the room and adjusts before anyone else has noticed the room has shifted. ${ctx.topCompass.length > 0 ? `When ${v} animates that responsiveness, the work has integrity — it's not just reactivity, it's care expressed in real time.` : ""}`
    );
  },
  ti: (ctx) => {
    const v = topCompassLabel(ctx.topCompass);
    return (
      `Work, for this shape, is precision. The work that engages you is the work that has a right answer hiding inside an unclear question — the framework that doesn't quite hold, the definition that almost works, the system whose internal logic is two assumptions away from coherent. ` +
      `You're likely to do your best work where you have the time to think it through properly, and where someone else cares whether the framework actually holds. Quick-and-dirty environments waste your gift; the gift is in the second pass that catches what the first pass missed. ` +
      `Bad fits are environments that demand decisions before the reasoning has settled, or that treat your need to clarify the categories as resistance to moving. ` +
      `On a Tuesday afternoon, this shape's work looks like: writing the document that says exactly what is meant, debugging the system whose surface symptom is misleading, asking the question that breaks the false consensus. ${ctx.topCompass.length > 0 ? `When ${v} sits underneath the precision, the work matters in a way pure puzzle-solving doesn't — you're refining the framework so that it can carry weight, not just hold up.` : ""}`
    );
  },
  te: (ctx) => {
    const v = topCompassLabel(ctx.topCompass);
    return (
      `Work, for this shape, is execution. The work that engages you is the work that converts intention into outcome — the project that needs to ship, the team that needs to be coordinated, the system that needs to be built. ` +
      `You're likely to feel most alive where the goal is clear, the resources are real, and the outcome is measurable. The satisfaction is in the ${ctx.agency.aspiration === "creator" ? "thing built" : "loop closed"}. ` +
      `Bad fits are environments where the goal is perpetually being re-negotiated, where progress can't be measured, or where the work requires sitting with ambiguity longer than the deliverable allows. ` +
      `On a Tuesday afternoon, this shape's work looks like: running the meeting that ends with three concrete decisions, building the dashboard that shows whether the strategy is working, restructuring the org so the right people are doing the right things. ${ctx.topCompass.length > 0 ? `When ${v} grounds the optimization, the work has direction beyond the metric — the system gets built to serve something, not just to move.` : ""}`
    );
  },
  fi: (ctx) => {
    const v = topCompassLabel(ctx.topCompass);
    return (
      `Work, for this shape, is alignment. The work that engages you is the work whose underlying purpose is congruent with what you actually believe — the project you would do whether or not it paid, the role that lets you bring the part of you that doesn't perform. ` +
      `You're likely to do your best work in places where authenticity is not just allowed but required, and where the ${ctx.topCompass.length > 0 ? v + " you protect is" : "values you protect are"} part of why the work exists at all. ` +
      `Bad fits are environments that ask you to perform a version of yourself that doesn't match — the smile that isn't yours, the enthusiasm that isn't real, the political work that requires you to stop being the person who notices. ` +
      `On a Tuesday afternoon, this shape's work looks like: the conversation where you say the thing the meeting agreed not to say, the project carried because it matters even when it isn't optimal, the small refusal that protects the thing the institution would otherwise quietly compromise. ${ctx.topCompass.length > 0 ? `When ${v} is the through-line, work becomes a place where integrity gets practiced rather than performed.` : ""}`
    );
  },
  fe: (ctx) => {
    const v = topCompassLabel(ctx.topCompass);
    return (
      `Work, for this shape, is relational. The work that engages you is the work that happens through people — coordinating the team, holding the room, making sure the human side of the system is getting the attention the system itself can't give it. ` +
      `You're likely to do your best work where care is visible, where collective outcomes matter as much as individual deliverables, and where the relational layer is treated as part of the work rather than overhead. ` +
      `Bad fits are environments that prize individual performance at the cost of relationship, or that treat the work of holding people together as soft, optional, or insufficiently strategic. ` +
      `On a Tuesday afternoon, this shape's work looks like: the one-on-one that catches the resignation three weeks before it would have happened, the meeting facilitation that gets the quiet voice into the room, the celebration that reminds the team why they're doing what they're doing. ${ctx.topCompass.length > 0 ? `When ${v} animates the care, the work isn't just maintenance — it's an act of building the conditions in which good work becomes possible.` : ""}`
    );
  },
};

const PATH_LOVE_BY_DOM: Record<CognitiveFunctionId, PathSubsectionTemplate> = {
  ni: (ctx) => (
    `Love, for this shape, is more often expressed as durable presence than as easy verbal warmth. You may not narrate care the way some people do; you tend to demonstrate it through the quiet construction of conditions in which the people you love can flourish — the read that anticipates a need before it's voiced, the structural fix that removes a recurring strain, the long view that holds the relationship across seasons. ` +
    `What this can leave unsaid: that you see the people you love. The internal read is constant; the external sign of it can be sparse. Saying the obvious thing — *I notice this is hard for you* — does not feel like new information to you, but it lands like new information to them. ` +
    `${ctx.topCompass.length > 0 ? `When ${topCompassLabel(ctx.topCompass)} grounds your loving, the durability of your presence becomes a specific kind of safety: the people you love can count on you to hold what matters, even when the surface conditions get noisy.` : "The growth move in love for this shape is rarely to do more — it is to make what you're already doing visible."}`
  ),
  ne: () => (
    `Love, for this shape, is generative — you tend to bring more energy, more possibility, more curiosity into the relationships that matter to you than is strictly required. The downside of that abundance is that it can read as restless: the next idea, the next adventure, the next angle on what you've been together. ` +
    `What love asks of this shape is the willingness to stay, when staying means choosing not to follow the next interesting branch. The depth of this shape's love is real; the discipline is in not letting the breadth dilute it. ` +
    `On a Tuesday afternoon, love for this shape might look like: actually finishing the conversation you started before the next idea pulled you sideways, returning to the unresolved thing you'd both rather not return to, sitting with one feeling long enough for it to teach you something instead of generating four interpretations of it. The work is in the staying.`
  ),
  si: () => (
    `Love, for this shape, is built across time. Repetition, ritual, the small gesture that becomes the same gesture next month and next year — these are not redundant for you; they are how love accumulates into something that holds. ` +
    `What this shape's love offers: a kind of safety that comes from knowing what to expect. What it can miss: the moment when the person you love is asking for something different from what tradition has made habitual. ` +
    `The growth move is asking, on the days when something feels off: is what I usually do still what's needed here, or has the situation shifted in a way the routine hasn't caught up to yet? Love that updates is not less love; it's love that stays alive through the change.`
  ),
  se: () => (
    `Love, for this shape, is present-tense. You tend to express care through what's actually happening in the room — the touch, the meal, the moment of attention that isn't being mediated through interpretation. The intimacy is in the immediacy. ` +
    `What this shape's love offers: vivid presence — being with someone in a way that does not require them to perform anything to deserve it. What it can miss: the part of love that lives in continuity, the carrying of someone's reality across the days you're not in the same room. ` +
    `The growth move involves letting love extend past the moment — the text that says *thinking of you* on a Wednesday, the remembered thing brought up next week, the small acknowledgment that the relationship exists between the encounters, not just inside them.`
  ),
  ti: () => (
    `Love, for this shape, often shows up as accuracy of attention — really seeing the person, understanding the actual structure of who they are rather than projecting onto them, refusing the lazy version of caring that doesn't bother to get them right. ` +
    `What this shape's love offers: a quality of being seen that is rare and real. What it can miss: the part of love that is not analytical — the warmth that doesn't require getting it right first, the affection that doesn't have to pass through a framework before it lands. ` +
    `The growth move involves letting some loving be inarticulate. The words can come later. Sometimes the right move is the one that isn't checked against the framework first — just the squeeze of the hand, the *me too*, the willingness to be wrong about what they need rather than withhold action until you're sure.`
  ),
  te: (ctx) => (
    `Love, for this shape, is often expressed through doing — handling the logistics, fixing the broken thing, removing the obstacle so the person you love can breathe. The competence is the care. ` +
    `What this shape's love offers: a kind of partnership in which problems do not stay problems for long. What it can miss: the moment when the person you love does not want the problem solved — they want to be sat with inside it. ` +
    `The growth move asks for restraint of the fix-it instinct. ${ctx.stack.auxiliary === "ni" || ctx.stack.auxiliary === "si" ? "Sometimes the help is to be present without converting the difficulty into a project." : "Sometimes love looks like not asking what needs to be done — just being there while it doesn't get done."} The discipline is in the slowing, not the moving.`
  ),
  fi: (ctx) => (
    `Love, for this shape, is rooted in alignment — you tend to love most fully where the relationship lets you be the version of yourself that doesn't perform. Authenticity is the medium; without it, love can feel hollow even when the form looks right. ` +
    `What this shape's love offers: a depth of regard that is unmistakably real. What it can miss: the part of love that requires staying through the times when the alignment isn't perfect — when the person you love is being inconsistent with their own values, when the relationship is in a season that asks for tolerance you haven't quite arrived at. ` +
    `The growth move is the discipline of staying: trusting that the love is real even when the surface conditions don't match what your inner sense says love should look like.${ctx.topCompass.length > 0 ? ` When ${topCompassLabel(ctx.topCompass)} is the through-line, the staying becomes its own form of integrity — not betraying the relationship to protect the value, but holding both at once.` : ""}`
  ),
  fe: () => (
    `Love, for this shape, is attentive and active. You tend to read what the people you love need almost before they articulate it, and to offer it without being asked. The care is felt because it is constant. ` +
    `What this shape's love offers: a relational environment that the people inside it experience as held. What it can miss: the version of love that includes your own needs visibly — that lets the people you love see what you're carrying instead of only what you're tending to. ` +
    `The growth move involves letting your own internal state become part of the relational picture, rather than a private weight you carry to keep the room intact. The people who love you want to know what you need; the asking-to-be-cared-for is its own act of intimacy.`
  ),
};

const PATH_GIVE_BY_DOM: Record<CognitiveFunctionId, PathSubsectionTemplate> = {
  ni: (ctx) => (
    `Giving, for this shape, tends to point toward structural repair rather than symptomatic relief. The donation that funds the underlying mechanism, the time spent fixing the thing that keeps causing the problem, the long-arc investment that won't pay off this quarter — these feel meaningful in a way that quick fixes don't. ` +
    `${ctx.topGravity.length > 0 ? `Your sense of where responsibility lives (${ctx.topGravity.map((r) => GRAVITY_LABEL[r.signal_id] ?? r.signal_id).join(", ")}) shapes the giving — you tend to direct your generosity at the layer of the system you believe is most load-bearing. ` : ""}` +
    `What this can miss: small mercies. The instinct to fix the structure can underweight the value of the immediate kindness — the meal brought, the call returned, the presence offered to one specific person on one specific Tuesday. Both matter. The growth move is letting symptomatic relief feel as real as structural repair, even when your shape's preference would skip past it.`
  ),
  ne: () => (
    `Giving, for this shape, often takes the form of opening doors. You tend to give people what they didn't know they needed — the introduction to someone who'll change their year, the framing that reorients their problem, the unexpected option that makes the whole frame they were stuck in fall away. ` +
    `What this shape's giving offers: catalytic energy. What it can miss: the steady, predictable form of generosity that keeps showing up in the same way over time. The exciting gift can sometimes substitute for the durable one. ` +
    `The growth move is committing to a small set of recurring acts of generosity that don't require novelty — the same friend you check on every month, the same cause you support every year, the same way of being a brother or partner that doesn't have to keep reinventing itself to feel real.`
  ),
  si: () => (
    `Giving, for this shape, tends to be reliable and recurring. You're likely to be the person who shows up the same way over many years — the regular volunteer, the steady donor, the one who remembers the birthdays. The generosity compounds because it doesn't require occasion. ` +
    `What this shape's giving offers: the kind of presence that builds trust over time. What it can miss: the moment when novel generosity is what's actually called for — when the situation has shifted enough that the usual gift isn't quite the right gift anymore. ` +
    `The growth move is listening for when the steady form needs an update. Not abandoning the consistency — building on it, so the long-running care can flex to meet what's actually being asked for now.`
  ),
  se: () => (
    `Giving, for this shape, is responsive — you tend to give what's needed in the moment that it's needed, with whatever's at hand. The check that gets written same-day, the favor that gets done before anyone has to ask twice, the ride to the airport that you offered before the request fully landed. ` +
    `What this shape's giving offers: speed and presence. What it can miss: the form of generosity that is structural rather than situational — the recurring commitment, the long-term investment in someone's capacity rather than their immediate need. ` +
    `The growth move is choosing one or two recurring forms of giving that don't depend on you being there to see the moment — the standing donation, the long-arc mentorship, the role you play across years rather than minutes.`
  ),
  ti: (ctx) => (
    `Giving, for this shape, tends to be precise. You're likely to give what's actually useful — the framework that solves the problem, the question that unsticks the thinking, the help that's calibrated to what the person actually needs rather than what would feel generous to provide. ` +
    `What this shape's giving offers: clarity and competence. What it can miss: the part of generosity that isn't optimized — the presence that is just presence, the gift that isn't strategically the right one but is given because it's wanted. ` +
    `The growth move is letting some giving be inefficient. ${ctx.topCompass.length > 0 ? "Especially when " + topCompassLabel(ctx.topCompass) + " would say the right move is rigor; sometimes the right move is simply showing up." : "Sometimes showing up is the gift, regardless of whether the showing up converts to a measurable result."}`
  ),
  te: (ctx) => (
    `Giving, for this shape, is operational. You're likely to give in the form of organizing the help — running the GoFundMe, coordinating the meal train, making sure the systems around the person in need actually deliver what's promised. ` +
    `What this shape's giving offers: things that wouldn't otherwise happen at scale. What it can miss: the personal gift, given person-to-person, that doesn't pass through a system. ` +
    `The growth move is occasionally giving outside the structure you're so good at building. ${ctx.weather.load === "high+" || ctx.weather.load === "high" ? "Especially under load, when the impulse will be to delegate the giving to a system you've set up." : "The hand-written card, the unmediated time, the gift that doesn't optimize anything."}`
  ),
  fi: () => (
    `Giving, for this shape, follows conviction. You're likely to give where you actually believe in the cause — fully, not strategically — and to feel a quiet falseness about giving where the cause doesn't match. The integrity is the engine. ` +
    `What this shape's giving offers: a kind of generosity that the recipient feels as real because it is. What it can miss: the form of giving that is generous to people whose values you don't share, in situations where your sense of right wouldn't have led you to give. ` +
    `The growth move is occasionally giving past your own alignment — the help offered to the person whose worldview you find suspect, the support given to the cause you're not entirely sure about. The reach is the practice.`
  ),
  fe: () => (
    `Giving, for this shape, is woven through everyday relating. You give attention, time, emotional labor, the holding of other people's processes — much of it without registering it as giving at all. The constancy is the gift. ` +
    `What this shape's giving offers: relational continuity that the people in your circle rely on. What it can miss: the moment when your own reservoir is empty and you keep giving anyway, until the giving stops being generosity and starts being depletion. ` +
    `The growth move is naming when the giving is starting to cost more than it's giving you back. Not stopping — recalibrating. Real care for others is sustainable; performative care isn't, and the difference between the two is whether you're still in the picture.`
  ),
};

const PATH_GROWTH_BY_DOM: Record<CognitiveFunctionId, PathSubsectionTemplate> = {
  ni: () => (
    `Your shape's growth move tends to involve borrowing from the present-tense self — the voice you trust least — for short, deliberate moments. Not abstractly: in the form of letting the room interrupt your read of the room, or letting fatigue speak before strategy does. The stretch isn't to become someone different; it's to let the function you reach for last get a small turn at the front.`
  ),
  ne: () => (
    `Your shape's growth move tends to involve borrowing from the precedent-checker — the voice you trust least. Not by suppressing the generation of new directions, but by letting one of those directions become a thing actually carried through to completion. The stretch is in the staying, the second pass, the willingness to find that the seventh refinement of the same idea is more valuable than the seven different ideas.`
  ),
  si: () => (
    `Your shape's growth move tends to involve borrowing from the possibility-finder — the voice you trust least. Not by abandoning what's worked, but by deliberately running one experiment per season that the established way says you don't need. The stretch is the discomfort of holding precedent and divergence at once, long enough to see which is right for now.`
  ),
  se: () => (
    `Your shape's growth move tends to involve borrowing from the pattern-reader — the voice you trust least. Not by leaving the present moment, but by letting one part of your week be reserved for thinking about the long arc instead of acting on the short one. The stretch is in the patience, the willingness to let interpretation matter when responsiveness is your native register.`
  ),
  ti: () => (
    `Your shape's growth move tends to involve borrowing from the room-reader — the voice you trust least. Not by softening the precision, but by letting the relational read precede the framework occasionally. The stretch is in the order — letting tone serve truth rather than be subordinate to it.`
  ),
  te: () => (
    `Your shape's growth move tends to involve borrowing from the inner compass — the voice you trust least. Not by stopping the optimization, but by occasionally checking whether the goal you're optimizing for is still the one you actually believe in. The stretch is in pausing the execution long enough to feel whether the destination has quietly drifted.`
  ),
  fi: () => (
    `Your shape's growth move tends to involve borrowing from the structurer — the voice you trust least. Not by silencing the inner read, but by letting structure carry some weight the conviction can't carry alone. The stretch is in the trust that good systems can serve good values, instead of the suspicion that systems necessarily compromise them.`
  ),
  fe: () => (
    `Your shape's growth move tends to involve borrowing from the coherence-checker — the voice you trust least. Not by stopping the relational tending, but by giving the framework some authority alongside the room's mood. The stretch is in trusting that some friction is structurally needed, even when smoothing it would feel kinder in the moment.`
  ),
};

// CC-025 Step 2.7 — per-shape one-word distillation for the Love closer.
// Each word is the next-iteration of the dominant function's love-prose
// growth move (ni → make the internal read visible; ne → stay through the
// next branch; etc.). Work + Give closers are queued for a follow-up CC.
const PATH_LOVE_DISTILLATION: Record<CognitiveFunctionId, string> = {
  ni: "expression",
  ne: "staying",
  si: "responsiveness",
  se: "continuity",
  ti: "warmth",
  te: "stillness",
  fi: "constancy",
  fe: "self-disclosure",
};

export function generatePathExpansion(
  ctx: GeneratorContext
): { work: string; love: string; give: string; growthCounterweight: string } {
  const baseLove = PATH_LOVE_BY_DOM[ctx.stack.dominant](ctx);
  const distillation = PATH_LOVE_DISTILLATION[ctx.stack.dominant];
  // Closer flows as the final sentence of the Love paragraph rather than a
  // forced visual break — PathExpanded's <p> render doesn't preserve newlines,
  // and the existing Love templates already chain multiple sentences in one
  // paragraph. Markdown export retains the same single-paragraph shape.
  const loveWithCloser = `${baseLove} For you, love may mature through ${distillation}.`;
  return {
    work: PATH_WORK_BY_DOM[ctx.stack.dominant](ctx),
    love: loveWithCloser,
    give: PATH_GIVE_BY_DOM[ctx.stack.dominant](ctx),
    growthCounterweight: PATH_GROWTH_BY_DOM[ctx.stack.dominant](ctx),
  };
}

// ── Pressure consolidation ───────────────────────────────────────────────

export function generatePressureSection(ctx: GeneratorContext): string {
  const dom = ctx.stack.dominant;
  const inf = ctx.stack.inferior;
  const valuesPhrase =
    ctx.topCompass.length > 0
      ? `The values you protect (${valuesPlural(ctx.topCompass, 0)}) may begin to express as defended absolutes rather than chosen priorities. `
      : "";
  const fireFlavor = ctx.fire.willingToBearCost
    ? "The willingness to bear cost may sharpen into rigidity — the conviction stays, but it stops checking whether the cost is needed. "
    : ctx.fire.adapts
    ? "The instinct to adapt may begin to negotiate the thing you were trying to protect — the bend that usually keeps the relationship intact starts costing the truth instead. "
    : ctx.fire.concealsUnderThreat
    ? "Belief may go private, learning to hold its tongue in rooms where it should still speak. "
    : "";
  return (
    `When the load gets heavy, your shape may tighten in two directions at once. ${capitalize(UNDER_PRESSURE_BEHAVIOR[dom])}, while ${FUNCTION_VOICE[inf]} surfaces in cruder form — the move you'd usually slow down on becomes the move you make first. ` +
    `${valuesPhrase}${fireFlavor}` +
    `None of these is who you are; each is who you may become if the load is not eased.`
  );
}

// ── Mirror generator ─────────────────────────────────────────────────────

function shapeInOneSentence(ctx: GeneratorContext): string {
  const dom = ctx.stack.dominant;
  const aux = ctx.stack.auxiliary;
  const valueTop = ctx.topCompass.length > 0 ? topCompassLabel(ctx.topCompass) : null;
  const gravityFirst =
    ctx.topGravity.length > 0
      ? GRAVITY_LABEL[ctx.topGravity[0].signal_id] ?? ctx.topGravity[0].signal_id
      : null;
  const valueClause = valueTop ? `protects ${valueTop}` : "is still resolving what it most protects";
  const gravityClause = gravityFirst ? `, and looks first toward ${gravityFirst} when something goes wrong` : "";
  return (
    `Yours is a shape led by ${FUNCTION_VOICE[dom]}, supported by ${FUNCTION_VOICE[aux]} — one that ${valueClause}${gravityClause}.`
  );
}

function corePatternForMirror(ctx: GeneratorContext): string {
  const dom = ctx.stack.dominant;
  const aux = ctx.stack.auxiliary;
  const valueLine =
    ctx.topCompass.length > 0
      ? `The pattern you keep living inside has ${topCompassLabel(ctx.topCompass)} at its center: when something has to give, that is what you protect first. `
      : "The pattern you keep living inside has not yet named a single thing you'd protect first; the rest of this reading sharpens once it does. ";
  const loadLine =
    ctx.weather.load === "high+" || ctx.weather.load === "high"
      ? "You're carrying a heavier-than-usual load right now; some of what shows up below may be the load talking, not the shape underneath."
      : ctx.weather.load === "moderate"
      ? "The load you're carrying is ordinary — enough to test the shape without overwhelming it."
      : "The load you're carrying is light at the moment, which makes this a good time to read what your shape looks like at rest.";
  return (
    valueLine +
    `${capitalize(FUNCTION_VOICE[dom])} reads the situation; ${FUNCTION_VOICE[aux]} carries the follow-through. That sequence is most of how this shape moves through a week. ` +
    loadLine
  );
}

function whatOthersMayExperienceForMirror(
  constitution: InnerConstitution,
  ctx: GeneratorContext
): string {
  // CC-015b reuses the existing relationship-translation prose as the Mirror's
  // "What Others May Experience" body. This keeps the protected line at the
  // close intact and avoids a second round of editorial rewrites.
  void ctx;
  return constitution.cross_card.relationshipTranslation;
}

function topGiftsForMirror(constitution: InnerConstitution): MirrorTopGift[] {
  return constitution.cross_card.topGifts.map((g) => ({
    label: g.label,
    paragraph: g.paragraph,
  }));
}

function topTrapsForMirror(constitution: InnerConstitution): MirrorTopTrap[] {
  return constitution.cross_card.topRisks.map((r) => ({
    label: r.label,
    paragraph: r.paragraph,
  }));
}

// ── CC-058 — Mirror Layer Uncomfortable-but-True Slot (CC-048 Rule 5) ──
//
// Per CC-048 Rule 5, every report needs at least one observation the user
// recognizes as probably true but doesn't enjoy reading — the slot that
// distinguishes the instrument from a "flattering enough to share"
// artifact. Composed from the user's strongest aspiration-vs-current
// tension; selected from 8 locked candidate sentences keyed to tension
// class. **Silence (null) is the canonical fallback** when no condition
// matches — better silence than flat horoscope.
//
// Locked content per the CC-058 prompt body. Tone register is locked
// alongside the sentences themselves: observational, not condemning;
// adjacent to the gift, not opposite to it; one breath; "you can…" /
// "you sometimes…" framing per Rule 7.
//
// Polish layer (CC-057a/b) is licensed to add adjacent prose but cannot
// edit the locked sentence — `buildEngineRenderedReport` lifts the
// emitted sentence into `lockedAnchors`, and the validation pass catches
// any drift.

export const UNCOMFORTABLE_BUT_TRUE_TEMPLATES: Record<
  UncomfortableButTrueClass,
  string
> = {
  context_vs_authority:
    "You can confuse having absorbed more context with having earned more authority to conclude.",
  pattern_vs_translation:
    "You sometimes treat translation as optional because the pattern feels obvious to you.",
  claim_vs_allocation:
    "You can claim what you haven't yet allocated toward — and the gap between what you name and what your week actually pays for is part of your shape, not a verdict against it.",
  conviction_vs_rigidity:
    "You can confuse what feels true to you with what is true — and the conviction that protects you from social weather is the same conviction that, in the wrong moment, refuses the correction you'd otherwise welcome.",
  builder_vs_pause:
    "You can build past the point where the structure has stopped serving the people inside it — and momentum can feel like rightness when it is sometimes just inertia.",
  caretaker_vs_self:
    "You can carry the room until the people in it stop seeing what carrying it costs you — and your read of what others need can quietly displace your read of what you need.",
  action_vs_direction:
    "You can mistake speed for direction — the body knows the situation by being in it, and that knowing can sometimes outrun the question of whether the situation is worth being in.",
  stewardship_vs_stagnation:
    "You can mistake guarding what you've kept for refusing what you'd grow into — and continuity, which is your real gift, can quietly become the reason a needed change doesn't happen.",
};

// Allocation tension fires when any of T-013 / T-014 / T-015 (the
// CC-016/CC-024 allocation-gap tension series) appears in
// `constitution.tensions`. The tension_ids are stable canon.
function allocationTensionFiring(tensions: InnerConstitution["tensions"]): boolean {
  return tensions.some(
    (t) =>
      t.tension_id === "T-013" ||
      t.tension_id === "T-014" ||
      t.tension_id === "T-015"
  );
}

// Drive `claimed_vs_revealed` (T-D1) fires strongly when the Drive case
// classifies as "inverted-small" or "inverted-big" — the existing
// CC-026 threshold mechanism. Reading `path.drive.case` directly (the
// engine's already-computed classifier output) avoids re-deriving.
function driveClaimedVsRevealedFiring(
  constitution: InnerConstitution
): boolean {
  const drive = constitution.shape_outputs.path?.drive;
  if (!drive) return false;
  return drive.case === "inverted-small" || drive.case === "inverted-big";
}

export function getUncomfortableButTrue(
  constitution: InnerConstitution,
  ctx: GeneratorContext
): string | null {
  const stack = constitution.lens_stack;
  const dom = stack.dominant;
  const topCompass = ctx.topCompass;
  const tensions = constitution.tensions;
  const signals = constitution.signals;

  // Helper: signal presence (unranked OK).
  const has = (id: string) => signals.some((s) => s.signal_id === id);

  // 1. Context-vs-authority — Ni-dominant, long-arc-pattern-reader.
  if (
    dom === "ni" &&
    (inCompassTop(topCompass, "knowledge_priority", 5) ||
      inCompassTop(topCompass, "truth_priority", 5))
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.context_vs_authority;
  }

  // 2. Pattern-vs-translation — Ne or Ni + breadth-of-frame; condition 1
  //    didn't fire (priority order: condition 1 is more specific and wins
  //    when both could match, which the spec confirms).
  if (
    (dom === "ne" || dom === "ni") &&
    (inCompassTop(topCompass, "freedom_priority", 5) ||
      signalRankAtMost(signals, "learning_energy_priority", 2))
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.pattern_vs_translation;
  }

  // 3. Claim-vs-allocation — Drive claimed_vs_revealed firing strongly OR
  //    any Allocation-class tension (T-013/T-014/T-015) firing.
  if (
    driveClaimedVsRevealedFiring(constitution) ||
    allocationTensionFiring(tensions)
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.claim_vs_allocation;
  }

  // 4. Conviction-vs-rigidity — Fi-dominant + Integrity.
  if (
    dom === "fi" &&
    (has("holds_internal_conviction") ||
      inCompassTop(topCompass, "truth_priority", 3))
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.conviction_vs_rigidity;
  }

  // 5. Builder-vs-pause — Te-dominant + Builder. The "creator-agency
  //    firing" condition is read from the AgencyPattern in ctx (current
  //    or aspiration === "creator").
  const creatorAgency =
    ctx.agency.current === "creator" || ctx.agency.aspiration === "creator";
  if (
    dom === "te" &&
    (creatorAgency ||
      inCompassTop(topCompass, "system_responsibility_priority", 5))
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.builder_vs_pause;
  }

  // 6. Caretaker-vs-self — Fe-dominant + Harmony.
  if (
    dom === "fe" &&
    (inCompassTop(topCompass, "family_priority", 5) ||
      signalRankAtMost(signals, "caring_energy_priority", 2))
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.caretaker_vs_self;
  }

  // 7. Action-vs-direction — Se-dominant + Action.
  if (
    dom === "se" &&
    (inCompassTop(topCompass, "freedom_priority", 5) ||
      signalRankAtMost(signals, "restoring_energy_priority", 2))
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.action_vs_direction;
  }

  // 8. Stewardship-vs-stagnation — Si-dominant + Stewardship.
  if (
    dom === "si" &&
    (inCompassTop(topCompass, "stability_priority", 5) ||
      inCompassTop(topCompass, "honor_priority", 5))
  ) {
    return UNCOMFORTABLE_BUT_TRUE_TEMPLATES.stewardship_vs_stagnation;
  }

  // No condition matched — silent. Per the canon, silence is the fallback.
  return null;
}

export function generateMirror(constitution: InnerConstitution, ctx: GeneratorContext): MirrorOutput {
  return {
    shapeInOneSentence: shapeInOneSentence(ctx),
    corePattern: corePatternForMirror(ctx),
    topGifts: topGiftsForMirror(constitution),
    topTraps: topTrapsForMirror(constitution),
    whatOthersMayExperience: whatOthersMayExperienceForMirror(constitution, ctx),
    whenTheLoadGetsHeavy: generatePressureSection(ctx),
    yourNext3Moves: generateNextMoves(ctx),
    // CC-058 — uncomfortable-but-true slot (CC-048 Rule 5).
    uncomfortableButTrue: getUncomfortableButTrue(constitution, ctx),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CC-022b — Engine Prose v2: render-time enhancements
//
// Everything below this line runs at render time, not derivation time, and
// may consume demographics for prose interpolation per the amended Rule 4.
// The InnerConstitution stored in the database remains demographic-blind
// (acceptance criterion #8: two sessions with identical answers + different
// demographics produce byte-identical InnerConstitution structures).
// ═══════════════════════════════════════════════════════════════════════════

// ── Item 2 — Demographic interpolation hooks ─────────────────────────────

const PROFESSION_PROSE_HOOKS: Record<string, string> = {
  knowledge: "knowledge work — research, analysis, writing, code, strategy",
  skilled_trades: "skilled-trade work — building, repairing, making with hands",
  service: "service work — direct interaction with people who need something",
  public_safety:
    "public-safety work — protection, response, emergency, accountability",
  medical:
    "medical work — caring for bodies, minds, and the lives wrapped around them",
  education:
    "educational work — formation, transmission, the long work of teaching",
  laborer: "physical labor — sustained effort that the body remembers",
  creative:
    "creative or artistic work — making something that didn't exist before you saw it",
  entrepreneur:
    "self-employment or entrepreneurship — building from your own conviction",
  retired:
    "the post-work register — life organized around what you choose, not what you must",
  military: "military work — discipline, duty, structures larger than self",
  religious_work: "religious or ministry work — formation, care, sacred trust",
};

// Pattern-keyed completions for the trailing phrase of the profession hook.
// Pulled by the dominant Lens function; the Compass-keyed fallbacks handle
// the rest.
const PROFESSION_TRAIL_BY_FUNCTION: Partial<Record<CognitiveFunctionId, string>> = {
  ni: "where the long-arc pattern reads against the immediate need",
  ne: "where the next angle is always one or two thoughts ahead",
  si: "where what's worked before earns its place against what's being tried now",
  se: "where the moment in front of you is the truest data you have",
  te: "where structure becomes the way care moves through the day",
  ti: "where the inner consistency of the work is its own kind of integrity",
  fi: "where named values become the test of every interaction",
  fe: "where the room itself is part of what the work is for",
};

const PROFESSION_TRAIL_DEFAULT =
  "where the shape of the work matches the shape of the person doing it";

function findDemographicValue(
  demographics: DemographicSet | null | undefined,
  field_id: string
): { value: string | null; state: string; otherText?: string } {
  if (!demographics) return { value: null, state: "not_answered" };
  const a = demographics.answers.find((x) => x.field_id === field_id);
  if (!a) return { value: null, state: "not_answered" };
  return {
    value: a.value ?? null,
    state: a.state,
    otherText: a.other_text,
  };
}

export function professionWorkHook(
  demographics: DemographicSet | null | undefined,
  dom: CognitiveFunctionId
): string | null {
  const prof = findDemographicValue(demographics, "profession");
  if (prof.state !== "specified" || !prof.value) return null;
  const trail = PROFESSION_TRAIL_BY_FUNCTION[dom] ?? PROFESSION_TRAIL_DEFAULT;
  if (prof.value === "other") {
    if (!prof.otherText || prof.otherText.trim().length === 0) return null;
    const other = prof.otherText.trim();
    return `This shape sits inside ${other}, ${trail}.`;
  }
  const hook = PROFESSION_PROSE_HOOKS[prof.value];
  if (!hook) return null;
  return `This shape sits inside ${hook}, ${trail}.`;
}

export function maritalStatusLoveHook(
  demographics: DemographicSet | null | undefined
): string | null {
  const m = findDemographicValue(demographics, "marital_status");
  if (m.state !== "specified" || !m.value) return null;
  switch (m.value) {
    case "married":
    case "partnered":
      return "A long-term partnership amplifies the steady-presence pattern this shape carries into love.";
    case "single":
      return "In single life, the love-shape this card surfaces shows up in friendships, family, and chosen kin more than in romantic pairing.";
    case "divorced":
    case "widowed":
      // Per spec — tread carefully. Skip by default to avoid leading prose
      // about the relational past when the structural read isn't already
      // about it.
      return null;
    default:
      return null;
  }
}

export function ageWeatherHook(
  demographics: DemographicSet | null | undefined
): string | null {
  const a = findDemographicValue(demographics, "age");
  if (a.state !== "specified" || !a.value) return null;
  // The age option ids are decade strings like "1980s". Use them directly
  // in the prose; if the value isn't shaped that way, skip rather than
  // emit an awkward sentence.
  if (!/^\d{4}s$/.test(a.value)) return null;
  return `Someone shaped in the ${a.value} read against a particular cultural baseline — the formation patterns that produced steadiness or unsteadiness in that era.`;
}

// ── Item 1 — Render-time name threading helpers ──────────────────────────
//
// Conservative substitution: replace the FIRST sentence-initial "Your"
// with "{Name}'s" only. Avoids whole-text replacement that would over-
// thread the name (spec calls for ~1-2 uses per Mirror section, not every
// sentence). When name is null, the text passes through unchanged.

export function nameThreadFirstYour(
  text: string,
  demographics?: DemographicSet | null
): string {
  const name = getUserName(demographics);
  if (!name) return text;
  // Match "Your " at start of string OR after a sentence-ending punctuation
  // + whitespace. Replace only the first occurrence.
  return text.replace(/(^|[.!?]\s+)Your\s+/, (_m, lead) => `${lead}${name}'s `);
}

export function nameThreadFirstYou(
  text: string,
  demographics?: DemographicSet | null
): string {
  const name = getUserName(demographics);
  if (!name) return text;
  // Match "You " at start of string OR after a sentence-ending punctuation
  // + whitespace, where the next character is lowercase (i.e., "You appear"
  // — a verb following). Replace only the first occurrence. Skip
  // possessive-pronoun positions; nameThreadFirstYour handles those.
  return text.replace(/(^|[.!?]\s+)You\s+(?=[a-z])/, (_m, lead) => `${lead}${name} `);
}

// ── Item 4 — Cross-card pattern catalog ──────────────────────────────────
//
// Each pattern is a (detection, prose) pair plus an `applicable_card`
// pointer that tells MapSection where to insert the pattern's prose.
// Detection runs against derived signals + topCompass / topGravity refs
// — never against demographics (per Rule 4). Prose is templated and may
// substitute the user's name via nameOrYour for personalization.
//
// Patterns are additive: when a pattern fires for a card, its prose
// appears alongside the card's existing Strength / Trap / Next move; it
// does not replace any existing output. Adding new patterns over time is
// just appending to the CROSS_CARD_PATTERNS array.

// CC-038-body-map — ShapeCardId was originally defined here; moved to
// lib/types.ts so FunctionPairRegister can reference it on the
// body_map_route field without circular type imports. Re-exported here to
// preserve the legacy import path (cardAssets.ts, renderMirror.ts,
// ShapeCard.tsx, MapSection.tsx all import ShapeCardId from "./identityEngine").
export type { ShapeCardId } from "./types";

export type CrossCardPattern = {
  pattern_id: string;
  name: string;
  description: string;
  applicable_card: ShapeCardId;
  // CC-PATTERN-CATALOG-SI-SE-FI — `oceanBands` is an optional 6th argument
  // threaded through `detectCrossCardPatterns`. Pre-existing patterns
  // (CC-029 Tier 1/2 and earlier) defined their detection with 5 params;
  // they remain assignable because TypeScript allows a function with fewer
  // parameters to satisfy a slot expecting more (extra args are ignored).
  // Only the Si/Se/Ti/Fi/Fe-1 patterns added by this CC consume the new arg.
  detection: (
    signals: Signal[],
    topCompass: SignalRef[],
    topGravity: SignalRef[],
    lensStack: LensStack,
    metaSignals: MetaSignal[],
    oceanBands?: OceanIntensityBands
  ) => boolean;
  prose: (
    signals: Signal[],
    topCompass: SignalRef[],
    topGravity: SignalRef[],
    lensStack: LensStack,
    demographics?: DemographicSet | null
  ) => string;
};

function compassRanksTop(
  topCompass: SignalRef[],
  signal_id: SignalId,
  maxRank = 2
): boolean {
  const ref = topCompass.find((r) => r.signal_id === signal_id);
  return ref !== undefined && (ref.rank ?? 99) <= maxRank;
}

function gravityRanksTop(
  topGravity: SignalRef[],
  signal_id: SignalId,
  maxRank = 2
): boolean {
  const ref = topGravity.find((r) => r.signal_id === signal_id);
  return ref !== undefined && (ref.rank ?? 99) <= maxRank;
}

export const CROSS_CARD_PATTERNS: CrossCardPattern[] = [
  // 1 — Faith ↔ Supernatural distinction
  {
    pattern_id: "faith_vs_supernatural",
    name: "Faith ↔ Supernatural distinction",
    description:
      "High Faith priority paired with low supernatural-responsibility attribution — faith functions as orienting trust, not as an escape from human responsibility.",
    applicable_card: "compass",
    detection: (signals, topCompass) =>
      compassRanksTop(topCompass, "faith_priority", 2) &&
      !hasAtRank(signals, "supernatural_responsibility_priority", 2),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const subj = getUserName(demographics) ?? "You";
      const verb = getUserName(demographics) ? "may believe" : "may believe";
      return `Faith appears to function less as an escape hatch from responsibility and more as an orienting trust. ${subj} ${verb} in what is beyond human control without using it to excuse what remains within human responsibility.`;
    },
  },

  // 2 — Justice ↔ System attribution
  {
    pattern_id: "justice_vs_system",
    name: "Justice ↔ System attribution",
    description:
      "High Justice priority paired with system-responsibility attribution — the user's justice frame operates against structures more than against individuals.",
    applicable_card: "gravity",
    detection: (signals, topCompass) =>
      compassRanksTop(topCompass, "justice_priority", 2) &&
      hasAtRank(signals, "system_responsibility_priority", 2),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      return `${capitalize(possessive)} sense of justice operates against the structures more than against the individuals — this often shows up as advocacy work, systemic critique, or the kind of attention that seeks the source of the harm rather than the surface of it.`;
    },
  },

  // 3 — Truth ↔ private-under-threat
  {
    pattern_id: "truth_vs_private_threat",
    name: "Truth ↔ private-under-threat Conviction",
    description:
      "High Truth priority paired with concealing/private Conviction posture — truth held inwardly more than visibly.",
    applicable_card: "conviction",
    detection: (signals, topCompass) =>
      compassRanksTop(topCompass, "truth_priority", 2) &&
      (has(signals, "conceals_under_threat") ||
        has(signals, "guarded_in_public")),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      return `${capitalize(possessive)} commitment to truth coexists with caution about expressing it publicly. The truth ${subj} protect${getUserName(demographics) ? "s" : ""} may live inwardly more than visibly — a conviction kept rather than declared.`;
    },
  },

  // 4 — Freedom ↔ Order tension
  {
    pattern_id: "freedom_vs_order",
    name: "Freedom ↔ Order tension",
    description:
      "High Freedom priority paired with high Order or Stability priority — both held, often in tension.",
    applicable_card: "compass",
    detection: (_signals, topCompass) =>
      compassRanksTop(topCompass, "freedom_priority", 2) &&
      (compassRanksTop(topCompass, "order_priority", 2) ||
        compassRanksTop(topCompass, "stability_priority", 2)),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const subj = getUserName(demographics) ?? "You";
      const verb = getUserName(demographics) ? "appears" : "appear";
      const verb2 = getUserName(demographics) ? "holds" : "hold";
      return `${subj} ${verb} to protect both freedom and order — these often live in tension. The shape of how ${subj.toLowerCase() === "you" ? "you" : subj} ${verb2} both is one of the more telling things this card surfaces.`;
    },
  },

  // 5 — Family ↔ Money allocation gap (Compass-side reflection of T-013)
  {
    pattern_id: "family_vs_money_allocation",
    name: "Family ↔ Money allocation gap",
    description:
      "High Family priority but Family low in the Q-S3-cross top-2. The Compass-side reflection of the same gap T-013 surfaces in Allocation Gaps; both can render.",
    applicable_card: "compass",
    detection: (signals, topCompass) => {
      if (!compassRanksTop(topCompass, "family_priority", 2)) return false;
      // Family low in the cross-rank if the Q-S3-cross signals don't put
      // family_spending_priority in the top 2.
      const familySpend = signals.find(
        (s) =>
          s.signal_id === "family_spending_priority" &&
          s.cross_rank !== undefined
      );
      return !familySpend || (familySpend.cross_rank ?? 99) > 2;
    },
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const name = getUserName(demographics);
      const subj = name ?? "You";
      const verbed = name ? "named" : "named";
      const possessive = nameOrYour(demographics);
      return `${subj} ${verbed} Family as among ${possessive} most sacred values. The allocation card surfaces a gap between that ranking and where ${possessive} discretionary money currently flows — a gap the model surfaces but does not adjudicate.`;
    },
  },

  // 6 — Knowledge ↔ Education trust
  {
    pattern_id: "knowledge_vs_education_trust",
    name: "Knowledge ↔ Education trust",
    description:
      "High Knowledge priority paired with high Education trust — sacred ranking and trust ranking align.",
    applicable_card: "trust",
    detection: (signals, topCompass) =>
      compassRanksTop(topCompass, "knowledge_priority", 2) &&
      hasAtRank(signals, "education_trust_priority", 2),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      const s = getUserName(demographics) ? "s" : "";
      return `${capitalize(possessive)} trust in education aligns with ${possessive} sacred ranking of knowledge — the institutions ${subj} trust${s} most are the ones whose work matches what ${subj} protect${s}.`;
    },
  },

  // 7 — Loyalty ↔ Family / Partner trust
  {
    pattern_id: "loyalty_vs_close_trust",
    name: "Loyalty ↔ Family/Partner trust",
    description:
      "High Loyalty priority paired with high Family or Partner trust — value and trust mode reinforce each other.",
    applicable_card: "trust",
    detection: (signals, topCompass) =>
      compassRanksTop(topCompass, "loyalty_priority", 2) &&
      (hasAtRank(signals, "family_trust_priority", 2) ||
        hasAtRank(signals, "partner_trust_priority", 2)),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const subj = getUserName(demographics) ?? "you";
      const s = getUserName(demographics) ? "s" : "";
      return `Loyalty operates as both a sacred value ${subj} protect${s} AND the kind of trust ${subj} extend${s} most readily — these reinforce each other in the shape of how ${subj} commit${s}.`;
    },
  },

  // 8 — Stability ↔ Chaos formation
  {
    pattern_id: "stability_vs_chaos_formation",
    name: "Stability ↔ Chaos formation",
    description:
      "High Stability priority paired with chaos exposure in formation — the stability protected now may be a deliberate response to early uncertainty.",
    applicable_card: "weather",
    detection: (signals, topCompass) =>
      compassRanksTop(topCompass, "stability_priority", 2) &&
      has(signals, "chaos_exposure"),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const subj = getUserName(demographics) ?? "you";
      const s = getUserName(demographics) ? "s" : "";
      return `The stability ${subj} protect${s} now may be a deliberate response to early uncertainty. What ${subj} protect${s} is sometimes shaped by what ${subj} didn't have.`;
    },
  },

  // 9 — Pattern-reader Lens ↔ low present-tense action
  {
    pattern_id: "pattern_reader_vs_paralysis",
    name: "Pattern-reader Lens ↔ low present-tense action",
    description:
      "Dominant Ni or Ne paired with reactive_operator from Q-A1 — the pattern-reader gift can produce paralysis when patterns multiply faster than action.",
    applicable_card: "lens",
    detection: (signals, _tc, _tg, lensStack) =>
      (lensStack.dominant === "ni" || lensStack.dominant === "ne") &&
      hasFromQuestion(signals, "reactive_operator", "Q-A1"),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const subj = getUserName(demographics) ?? "You";
      return `The pattern-reader gift can produce paralysis when the patterns multiply faster than action. ${subj} may need to choose ground that's good enough rather than waiting for the optimal pattern to land.`;
    },
  },

  // 10 — Costly conviction without revision
  {
    pattern_id: "costly_conviction_without_revision",
    name: "Costly conviction without revision",
    description:
      "Internal-conviction signal paired with belief_impervious MetaSignal — the willingness to bear cost coexists with a closed revision path.",
    applicable_card: "conviction",
    detection: (signals, _tc, _tg, _ls, metaSignals) =>
      has(signals, "holds_internal_conviction") &&
      metaSignals.some((m) => m.type === "belief_impervious"),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      return `${capitalize(possessive)} willingness to bear cost for belief comes paired with a closed revision path — neither alone is the full shape; together they describe a conviction that has chosen its room and may stop testing whether the room was rightly chosen.`;
    },
  },

  // 11 — Builder ↔ Maintenance allocation gap (Item 6 from queue file)
  {
    pattern_id: "builder_vs_maintenance",
    name: "Builder ↔ Maintenance allocation gap",
    description:
      "Pattern-reader Lens + structurer Te aux + reactive_operator/responsibility_maintainer + structural sacred value (Faith/Truth/Knowledge/Justice) in top-2. The allocation gap that matters for builder-shapes is creative output / protected hours / strategic attention vs maintenance load — a more mature framing than the standard money-toward-charity question.",
    applicable_card: "path",
    detection: (signals, topCompass, _tg, lensStack) => {
      const isPatternReader =
        lensStack.dominant === "ni" || lensStack.dominant === "ne";
      const isStructurerAux = lensStack.auxiliary === "te";
      if (!isPatternReader || !isStructurerAux) return false;
      const isMaintaining =
        hasFromQuestion(signals, "reactive_operator", "Q-A1") ||
        hasFromQuestion(signals, "responsibility_maintainer", "Q-A1");
      if (!isMaintaining) return false;
      const hasStructuralSacred = (
        ["faith_priority", "truth_priority", "knowledge_priority", "justice_priority"] as SignalId[]
      ).some((sid) => compassRanksTop(topCompass, sid, 2));
      return hasStructuralSacred;
    },
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      const s = getUserName(demographics) ? "s" : "";
      return `For ${possessive} shape, the meaningful allocation gap may not be the standard money-toward-charity question. The sharper question is whether ${possessive} creative output, ${possessive} protected hours, and ${possessive} strategic attention are moving toward the future ${subj} say${s} ${subj} believe${s} in — or whether maintenance is consuming the time that was supposed to build it.`;
    },
  },

  // 12 — Endurance under low present load
  {
    pattern_id: "endurance_under_low_load",
    name: "Endurance under low present load",
    description:
      "Internal-conviction (an endurance proxy) paired with low/moderate current Weather load — the endurance pattern shows up best at low load.",
    applicable_card: "weather",
    detection: (signals) => {
      // Weather load isn't directly on Signal[]; we proxy via the
      // canonical "low load" indicators. Endurance proxy is
      // holds_internal_conviction.
      if (!has(signals, "holds_internal_conviction")) return false;
      const lowLoad =
        has(signals, "stability_present") || !has(signals, "high_pressure_context");
      return lowLoad;
    },
    prose: (_s, _tc, _tg, _ls, demographics) => {
      void demographics;
      return `The endurance pattern this shape carries shows up best at low load — when there's nothing acute to absorb. The shape's gift may be the reserve that gets called on when load arrives, not the visible carrying that load already requires.`;
    },
  },

  // ── CC-029 — Pattern Catalog Expansion (Tier 2) ────────────────────────
  // Five patterns extending cross-card coverage to Si / Se / Ti / Fi / Fe.
  // All five compose a dominant function with an existing signal that already
  // fires in v0/v1; no new signals or questions are introduced. Follows
  // CC-034 (Tier 1: floor — function-specific gift-category fallbacks); CC-036
  // (Tier 3: ceiling — secondary discriminating routes per function) is the
  // queued successor.

  // 13 — Si tradition built from chaos
  {
    pattern_id: "si_tradition_built_from_chaos",
    name: "Si — tradition built from chaos",
    description:
      "Si dominant + chaos_exposure formation — Si's preservation register paired with childhood in uncertain ground reads as actively building tradition the user wasn't given, not as nostalgia for what was.",
    applicable_card: "weather",
    detection: (signals, _tc, _tg, lensStack) =>
      lensStack.dominant === "si" && has(signals, "chaos_exposure"),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      const s = getUserName(demographics) ? "s" : "";
      return `Your sensing register doesn't read as nostalgia for what was — it reads as construction of what wasn't given. ${capitalize(possessive)} formation in uncertain ground tends to produce people who build the tradition they didn't inherit, hour by hour, choice by choice. The continuity others took for granted is something ${subj} make${s}.`;
    },
  },

  // 14 — Se crisis-alive, planning-strain
  {
    pattern_id: "se_crisis_alive_planning_strain",
    name: "Se — alive in crisis, strained on the long arc",
    description:
      "Se dominant + reactive_operator agency (Q-A1 'Reacting to demands') — Se's somatic-engagement strength becomes a planning gap when sustained over a long arc. The pattern names the gift→risk dynamic without judging the reactive mode.",
    applicable_card: "path",
    detection: (signals, _tc, _tg, lensStack) =>
      lensStack.dominant === "se" &&
      hasFromQuestion(signals, "reactive_operator", "Q-A1"),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      return `${capitalize(possessive)} sensing register is most alive in the present — engaged with what's actually here, responsive to what changes. The same register that makes you effective in crisis can struggle with the long arc, where the gift of immediacy doesn't carry. The growth move isn't to dampen the immediacy. It's to choose one long-arc commitment and protect it on a different rhythm.`;
    },
  },

  // 15 — Ti closed reasoning chamber
  {
    pattern_id: "ti_closed_reasoning_chamber",
    name: "Ti — closed reasoning chamber",
    description:
      "Ti dominant + holds_internal_conviction + Te not in dominant/auxiliary — Ti's framework-building can become a closed chamber when Te (external proof, system-level testing) is low. The user's reasoning is sharp but rarely stress-tested against the world.",
    applicable_card: "conviction",
    detection: (signals, _tc, _tg, lensStack) =>
      lensStack.dominant === "ti" &&
      has(signals, "holds_internal_conviction") &&
      // Te-low check: dominant is already Ti so dominant !== "te" is
      // automatic; the operative clause is auxiliary !== "te". This is the
      // canonical equivalent of the spec's `!stack.top2.includes("te")` since
      // LensStack exposes dominant/auxiliary separately rather than a top2 array.
      lensStack.auxiliary !== "te",
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      return `${capitalize(possessive)} reasoning is internally consistent and well-formed — the frameworks you hold are real frameworks, not slogans. The risk in this configuration is testing those frameworks mostly against your own internal coherence rather than against external proof. The growth move is exposing one held position to the discipline of someone who'd disagree with it for reasons you respect.`;
    },
  },

  // 16 — Fi personally-authentic only
  {
    pattern_id: "fi_personally_authentic_only",
    name: "Fi — willing to bear cost only for personally-authentic conviction",
    description:
      "Fi dominant + high_conviction_under_risk (Q-P2 'Accept the risk') — Fi's authenticity-driven cost-bearing is real when the conviction is the user's own; the same register reads more thinly when the belief is shared by the user's group but hasn't been weighed personally. The pattern surfaces the boundary as honest, not as failure.",
    applicable_card: "fire",
    detection: (signals, _tc, _tg, lensStack) =>
      lensStack.dominant === "fi" &&
      has(signals, "high_conviction_under_risk"),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      return `When ${possessive} conviction is personally authentic — when you've weighed it and made it your own — you will bear cost for it. The same register reads more thinly when the belief is shared by your group but hasn't been weighed personally. The growth move is naming this distinction out loud — both to yourself and to the people who count on you.`;
    },
  },

  // 17 — Fe attunement → yielded conviction
  {
    pattern_id: "fe_attunement_to_yielded_conviction",
    name: "Fe — attunement turning into yielded conviction under social pressure",
    description:
      "Fe dominant + adapts_under_social_pressure (Q-P1 'Stay silent' or 'Soften it') — Fe's relational attunement is a real gift; the same register can become yielding under social pressure. The pattern names the gift→risk gradient without pathologizing the attunement.",
    applicable_card: "fire",
    detection: (signals, _tc, _tg, lensStack) =>
      lensStack.dominant === "fe" &&
      has(signals, "adapts_under_social_pressure"),
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      return `${capitalize(possessive)} attunement to others is real — you read what the moment is asking and respond to what's needed. The same register, under social pressure, can yield more than you intend. The gift and the risk are the same instrument; the question is whether you're attending to what others need or attending to what you need to keep your place with them.`;
    },
  },

  // ── CC-PATTERN-CATALOG-SI-SE-FI — Si / Se / Ti / Fi / Fe second-route patterns
  // Five additional patterns that close the function-coverage asymmetry
  // (feedback_pattern_catalog_function_bias). CC-029 Tier 2 already added
  // one pattern per Si/Se/Ti/Fi/Fe; this CC adds a second discriminating
  // route per function so the engine has more to compose against for
  // those shapes. All five gate on `lensStack.dominant` alone — no
  // accidental firings on Ni/Ne/Te shapes. Pure engine layer; no prose
  // render changes; no new questions or signals.

  // 18 — Si precedent-keeper under pressure
  {
    pattern_id: "si_precedent_keeper_under_pressure",
    name: "Si — precedent-keeper under pressure",
    description:
      "Si dominant + Conscientiousness moderate-high or high + Stability / Loyalty / Family / Honor in the top-2 sacred-value ranking. The shape that defends what holds when pressure rises — distinct from 'control' (Ni-flavored) and from 'money/security' (Drive-bucket-flavored). Captures Si's preservation register as active defense, not nostalgia.",
    applicable_card: "weather",
    detection: (_signals, topCompass, _tg, lensStack, _ms, oceanBands) => {
      if (lensStack.dominant !== "si") return false;
      if (!oceanBands) return false;
      const cDisciplined =
        oceanBands.conscientiousness === "high" ||
        oceanBands.conscientiousness === "moderate-high";
      if (!cDisciplined) return false;
      const protectClass: SignalId[] = [
        "stability_priority",
        "loyalty_priority",
        "family_priority",
        "honor_priority",
      ];
      return protectClass.some((sid) => compassRanksTop(topCompass, sid, 2));
    },
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      const s = getUserName(demographics) ? "s" : "";
      return `When pressure rises, ${subj} defend${s} what holds — the kept commitment, the precedent, the people and structures whose continuity ${possessive} care is bound up with. The risk is reading every disruption as a threat to what's worth keeping; not every change is an erosion. The growth move is naming which precedents are load-bearing and which are inherited furniture.`;
    },
  },

  // 19 — Se present-tense responder
  {
    pattern_id: "se_present_tense_responder",
    name: "Se — present-tense responder",
    description:
      "Se dominant + observable outward engagement (Extraversion moderate-high/high) OR Conscientiousness high. Captures the shape that responds to what's actually in the room rather than working a long-range plan. Distinct from se_crisis_alive_planning_strain (which gates on Q-A1 reactive_operator); this pattern surfaces the same gift in disciplined-presence form — present-tense engagement carried by either outward energy or strong self-direction.",
    applicable_card: "path",
    detection: (_signals, _tc, _tg, lensStack, _ms, oceanBands) => {
      if (lensStack.dominant !== "se") return false;
      if (!oceanBands) return false;
      const eForward =
        oceanBands.extraversion === "high" ||
        oceanBands.extraversion === "moderate-high";
      const cHigh = oceanBands.conscientiousness === "high";
      return eForward || cHigh;
    },
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      return `${capitalize(possessive)} sensing register is most alive in what's actually here — the conversation in the room, the work in ${possessive} hands, the move that's available now. The same register that makes ${subj} effective in the present can under-invest in the long arc, where today's responsiveness doesn't carry. The growth move isn't to dampen the immediacy; it's to choose one long-arc commitment and protect it on a different rhythm than the day's demands set.`;
    },
  },

  // 20 — Ti coherence prover
  {
    pattern_id: "ti_coherence_prover",
    name: "Ti — coherence prover",
    description:
      "Ti dominant + Truth or Knowledge in the top-2 sacred-value ranking. Captures the shape that needs the read to be internally consistent before committing. Distinct from ti_closed_reasoning_chamber (which gates on holds_internal_conviction + Te-low) and from Te-flavored 'being right' externalism — this pattern names the protect-class commitment to coherence itself.",
    applicable_card: "conviction",
    detection: (_signals, topCompass, _tg, lensStack) => {
      if (lensStack.dominant !== "ti") return false;
      return (
        compassRanksTop(topCompass, "truth_priority", 2) ||
        compassRanksTop(topCompass, "knowledge_priority", 2)
      );
    },
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      const s = getUserName(demographics) ? "s" : "";
      return `${capitalize(possessive)} read of a situation has to be internally coherent before ${subj} commit${s} to it — the frame has to hold together, not just sound right. This is different from needing to be right externally; ${subj} ${getUserName(demographics) ? "is" : "are"} testing whether the model is consistent with itself. The risk is delaying action until coherence is total, when many real moves are made on partial models the world keeps revising.`;
    },
  },

  // 21 — Fi inner-compass refusal
  {
    pattern_id: "fi_inner_compass_refusal",
    name: "Fi — inner-compass refusal",
    description:
      "Fi dominant + low/moderate Agreeableness band OR conviction_under_cost signal present. Captures the shape that refuses to perform agreement when the inner compass disagrees. Distinct from fi_personally_authentic_only (which gates on Q-P2 high_conviction_under_risk) and from Fe-flavored approval-seeking or Te-flavored 'being right' — this pattern names the spine that doesn't soften under social cost.",
    applicable_card: "fire",
    detection: (signals, _tc, _tg, lensStack, _ms, oceanBands) => {
      if (lensStack.dominant !== "fi") return false;
      const aLowOrModerate =
        oceanBands?.agreeableness === "low" ||
        oceanBands?.agreeableness === "moderate";
      const bearsCost = has(signals, "conviction_under_cost");
      return aLowOrModerate || bearsCost;
    },
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      return `When ${possessive} inner compass disagrees with the room, ${subj} won't perform agreement to keep the peace — the cost of pretending registers higher than the cost of being the one who didn't fold. The risk is reading every soft moment as a test of spine; not every accommodation is a betrayal of self. The growth move is distinguishing the moments that require ${possessive} refusal from the moments that just ask for ${possessive} patience.`;
    },
  },

  // 22 — Fe room-attunement under conflict
  {
    pattern_id: "fe_room_attunement_under_conflict",
    name: "Fe — room-attunement under conflict",
    description:
      "Fe dominant + Extraversion moderate or higher + one of Compassion / Peace / Family / Loyalty / Mercy in the top-2 sacred-value ranking. Captures the shape that reads the room's tension before naming the user's own. Distinct from fe_attunement_to_yielded_conviction (which gates on Q-P1 adapts_under_social_pressure) and from gripCalibration's 'approval of specific people' (which is Primal-mapping) — this is pre-Primal pattern detection of relational-values attunement.",
    applicable_card: "fire",
    detection: (_signals, topCompass, _tg, lensStack, _ms, oceanBands) => {
      if (lensStack.dominant !== "fe") return false;
      if (!oceanBands) return false;
      const eObservable =
        oceanBands.extraversion === "high" ||
        oceanBands.extraversion === "moderate-high" ||
        oceanBands.extraversion === "moderate";
      if (!eObservable) return false;
      const relational: SignalId[] = [
        "compassion_priority",
        "peace_priority",
        "family_priority",
        "loyalty_priority",
        "mercy_priority",
      ];
      return relational.some((sid) => compassRanksTop(topCompass, sid, 2));
    },
    prose: (_s, _tc, _tg, _ls, demographics) => {
      const possessive = nameOrYour(demographics);
      const subj = getUserName(demographics) ?? "you";
      const s = getUserName(demographics) ? "s" : "";
      return `When tension surfaces, ${subj} read${s} the room before ${subj} read${s} ${possessive} own position — the relational stakes register first, the personal stakes second. This is real gift in the rooms that need someone tracking what's between people. The risk is that ${possessive} own position gets less attention than ${possessive} read of everyone else's, and the cost of that gap shows up later, in private.`;
    },
  },
];

export function detectCrossCardPatterns(
  signals: Signal[],
  topCompass: SignalRef[],
  topGravity: SignalRef[],
  lensStack: LensStack,
  metaSignals: MetaSignal[],
  demographics?: DemographicSet | null,
  oceanBands?: OceanIntensityBands
): { pattern: CrossCardPattern; prose: string }[] {
  const out: { pattern: CrossCardPattern; prose: string }[] = [];
  for (const p of CROSS_CARD_PATTERNS) {
    if (
      p.detection(signals, topCompass, topGravity, lensStack, metaSignals, oceanBands)
    ) {
      out.push({
        pattern: p,
        prose: p.prose(signals, topCompass, topGravity, lensStack, demographics),
      });
    }
  }
  return out;
}

// ── Item 5 — Simple Summary closing section ──────────────────────────────
//
// 4-7 synthesizing sentences + three structured closing patterns:
//   A. "To keep X without Y" parallel lines (3-4)
//   B. "{Name's} gift is X. {Name's} danger is X {temporal}" — same-noun
//      compression keyed to dominant Lens function.
//   C. "{Name} is a {shape descriptor} whose growth edge is not X, but Y"
//      — "not X, but Y" thesis that names what the user might assume the
//      answer is and corrects it.

const GIFT_DANGER_LINES: Record<
  CognitiveFunctionId,
  { gift: string; danger: string }
> = {
  ni: { gift: "the long read", danger: "believing the long read too early" },
  ne: { gift: "room-reading", danger: "room-reading instead of saying" },
  si: {
    gift: "durable memory",
    danger: "durable memory of what no longer applies",
  },
  se: {
    gift: "present-tense response",
    danger: "present-tense response without long enough context",
  },
  te: {
    gift: "operational clarity",
    danger: "operational clarity before the goal has been examined",
  },
  ti: {
    gift: "internal coherence",
    danger: "internal coherence the world doesn't share",
  },
  fi: {
    gift: "moral seriousness",
    danger: "moral seriousness without curiosity",
  },
  fe: {
    gift: "attunement",
    danger: "attunement instead of authorship",
  },
};

// "Not X, but Y" thesis templates keyed by (dominant function, top compass
// signal_id). Pre-authored common combinations; falls back to a generic
// (function-only) template when no specific pairing is matched.
type ThesisTemplate = { shapeDescriptor: string; assumedX: string; structuralY: string };

const THESIS_TEMPLATES: Record<string, ThesisTemplate> = {
  // Pattern-reader (Ni) × structural compass values
  "ni|knowledge_priority": {
    shapeDescriptor: "long-arc pattern reader and builder",
    assumedX: "caring more",
    structuralY:
      "translating conviction into visible, revisable, present-tense structure",
  },
  "ni|truth_priority": {
    shapeDescriptor: "long-arc truth-seeker",
    assumedX: "speaking up more",
    structuralY:
      "saying what's seen in a register the room can act on",
  },
  "ni|faith_priority": {
    shapeDescriptor: "long-arc pattern reader with steady faith",
    assumedX: "trying harder",
    structuralY:
      "letting the steady belief become visible to the people who'd be carried by it",
  },
  "ni|justice_priority": {
    shapeDescriptor: "long-arc systemic-justice reader",
    assumedX: "fighting harder",
    structuralY:
      "naming the structural pattern in language the room you're in can use",
  },
  "ni|family_priority": {
    shapeDescriptor: "long-arc pattern reader anchored in family",
    assumedX: "loving harder",
    structuralY:
      "letting the people you carry feel the read you've already done of them",
  },
  // Possibility-finder (Ne)
  "ne|knowledge_priority": {
    shapeDescriptor: "possibility-driven knowledge-seeker",
    assumedX: "trying harder",
    structuralY:
      "letting one direction become a finished thing before another opens",
  },
  "ne|family_priority": {
    shapeDescriptor: "possibility-driven caregiver",
    assumedX: "doing more",
    structuralY:
      "letting one direction become a finished thing for the people you mean it for",
  },
  // Coherence-checker (Ti)
  "ti|truth_priority": {
    shapeDescriptor: "coherence-checking truth-seeker",
    assumedX: "finding the right answer",
    structuralY:
      "communicating the answer in a register the room can use",
  },
  "ti|knowledge_priority": {
    shapeDescriptor: "coherence-checking knowledge-builder",
    assumedX: "knowing more",
    structuralY:
      "letting what's known move from internal model into shared structure",
  },
  // Structurer (Te)
  "te|justice_priority": {
    shapeDescriptor: "structuring justice-seeker",
    assumedX: "more conviction",
    structuralY:
      "translating conviction into systems the room is already inside",
  },
  "te|family_priority": {
    shapeDescriptor: "structuring caregiver",
    assumedX: "doing more for them",
    structuralY:
      "letting structure become the way care reaches them, instead of effort",
  },
  // Inner compass (Fi)
  "fi|truth_priority": {
    shapeDescriptor: "interior truth-keeper",
    assumedX: "speaking up more",
    structuralY:
      "letting the interior position translate into a register others can meet",
  },
  "fi|loyalty_priority": {
    shapeDescriptor: "interior loyalty-keeper",
    assumedX: "loving harder",
    structuralY:
      "letting the people you carry know the weight you carry for them",
  },
  // Room-reader (Fe)
  "fe|family_priority": {
    shapeDescriptor: "room-reading caregiver",
    assumedX: "tuning in more",
    structuralY:
      "letting your own voice land in the room you've spent years tuning",
  },
  "fe|loyalty_priority": {
    shapeDescriptor: "room-reading loyalty-keeper",
    assumedX: "more attunement",
    structuralY:
      "authoring rather than only attending",
  },
};

// Per-function fallback when no (function, compass) pair matches.
const THESIS_FALLBACK_BY_FUNCTION: Record<
  CognitiveFunctionId,
  ThesisTemplate
> = {
  ni: {
    shapeDescriptor: "long-arc pattern reader",
    assumedX: "caring more",
    structuralY:
      "translating what you see into language and structure the room can use",
  },
  ne: {
    shapeDescriptor: "possibility-finding shape",
    assumedX: "trying harder",
    structuralY:
      "letting one direction become a finished thing",
  },
  si: {
    shapeDescriptor: "precedent-anchored shape",
    assumedX: "remembering more",
    structuralY:
      "letting precedent inform — not decide — what's next",
  },
  se: {
    shapeDescriptor: "present-tense shape",
    assumedX: "thinking more",
    structuralY:
      "holding the long read alongside the immediate one",
  },
  te: {
    shapeDescriptor: "structuring shape",
    assumedX: "moving faster",
    structuralY:
      "examining the goal before locking the structure that serves it",
  },
  ti: {
    shapeDescriptor: "coherence-checking shape",
    assumedX: "finding the right answer",
    structuralY:
      "communicating the answer in a register the room can use",
  },
  fi: {
    shapeDescriptor: "interior-compass shape",
    assumedX: "feeling more",
    structuralY:
      "letting the interior position translate outward",
  },
  fe: {
    shapeDescriptor: "room-reading shape",
    assumedX: "tuning in more",
    structuralY:
      "authoring as well as attending",
  },
};

function thesisFor(
  lensStack: LensStack,
  topCompass: SignalRef[]
): ThesisTemplate {
  const compassTop = topCompass[0]?.signal_id;
  const key = compassTop ? `${lensStack.dominant}|${compassTop}` : "";
  return THESIS_TEMPLATES[key] ?? THESIS_FALLBACK_BY_FUNCTION[lensStack.dominant];
}

// CC-PROSE-1 Layer 1 — Executive Read.
//
// 2-sentence top-of-report distillation rendered immediately after the
// masthead block (drop-cap shapeInOneSentence + uncomfortableButTrue +
// MBTI disclosure) and before "How to Read This." Lifts directly from
// the existing Synthesis composer's two load-bearing one-liners:
//   1. The gift/danger parallel-line close (GIFT_DANGER_LINES keyed to
//      Lens dominant function).
//   2. The "not X, but Y" thesis line (thesisFor — keyed to dominant
//      function + top Compass value).
//
// Second-person register throughout (per engine canon). No invented
// claims — every word lifts from existing engine maps. The drop-cap
// already shows shapeInOneSentence so Executive Read does not duplicate
// that line; it surfaces the gift/danger and growth-task headlines that
// previously lived only inside the late-report Synthesis section.
// CC-SYNTHESIS-1A Addition 3 — Two-Tier Closing-Phrase logic.
//
// The pre-1A Closing Read prose for the GIVE quadrant contains the
// phrase "the early shape of giving" mid-paragraph (in
// goalSoulGive.PROSE_TEMPLATES.give). 1A gates whether that phrase
// stays as the default OR gets substituted with the canonical-arrived
// phrase "Giving is Work that has found its beloved object."
//
// The arrived phrase fires only when ALL three conditions hold:
//   1. movementQuadrant.label === "Giving / Presence"
//      (high Goal AND high Soul, both ≥ MOVEMENT_QUADRANT_HIGH_THRESHOLD)
//   2. riskForm.letter === "Wisdom-governed"
//      (risk-orientation present AND grip moderate)
//   3. movementStrength.length ≥ 70
//      (longer than the engine's "long" threshold floor of 60; cap below
//      "full" which fires at 85 — reserves the canonical close for shapes
//      whose movement is strong-and-sustained rather than just past the
//      "long" boundary)
//
// Per Jason canon: "the canonical close is reserved for arrived shapes;
// default to early-shape-of-giving for ambiguous or transitional shapes."
// Render rule: only the embedded phrase changes; the surrounding
// sentence is unchanged. Substitution happens at composition time so
// renderMirror.ts and the React render path share one source of truth.
const CLOSING_PHRASE_DEFAULT = "the early shape of giving";
const CLOSING_PHRASE_ARRIVED = "Giving is Work that has found its beloved object";
const CLOSING_PHRASE_ARRIVED_STRENGTH_FLOOR = 70;

// CC-SHAPE-AWARE-PROSE-ROUTING — archetype-routed Closing Read prose for
// the GIVE quadrant. Each archetype carries its canonical line (see
// `ARCHETYPE_CANONICAL_LINE` in lib/profileArchetype.ts). Non-GIVE
// quadrants keep the legacy templates because they describe formation
// states (Striving / Longing / Drift) that don't yet have an archetype
// signature.
const CLOSING_READ_GIVE_BY_ARCHETYPE: Record<
  "jasonType" | "cindyType" | "danielType",
  string
> = {
  jasonType:
    "Your verbs and your nouns appear to be pulling in the same direction — the long-arc structure you build is in service of the truth you keep returning to. The instrument reads this as the early shape of giving — work taking the form of love, love taking the form of work. The work is to translate conviction into visible, revisable, present-tense structure. Keep this shape honest as the seasons turn.",
  cindyType:
    "Your life appears organized around love made concrete. You do not merely value Family; you act as if Family is something that must be held, fed, defended, and kept. The instrument reads this as the early shape of giving — work taking the form of love, love taking the form of work. The work is not to care less. It is to let love become sustainable enough to last.",
  danielType:
    "Your life appears organized around faithful continuity: belief made visible through repeated action, responsibility carried across time, and love expressed as reliability. The instrument reads this as the early shape of giving — work taking the form of love, love taking the form of work. The work is not to abandon what has endured. It is to let what has endured remain alive enough to update.",
};

export function composeClosingReadProse(
  constitution: InnerConstitution
): string {
  const goalSoulGive = constitution.goalSoulGive;
  if (!goalSoulGive || !goalSoulGive.prose) return "";
  let prose = goalSoulGive.prose;

  // CC-SHAPE-AWARE-PROSE-ROUTING — route the GIVE-quadrant prose
  // through the user's archetype. unmappedType / non-GIVE quadrants
  // keep the legacy template.
  if (goalSoulGive.quadrant === "give") {
    const archetype = constitution.profileArchetype?.primary;
    if (
      archetype === "jasonType" ||
      archetype === "cindyType" ||
      archetype === "danielType"
    ) {
      prose = CLOSING_READ_GIVE_BY_ARCHETYPE[archetype];
    }
  }

  // CC-070 wrap-compat — when the Defensive Builder pattern fires inside
  // the Striving quadrant, append its kicker prose. (Mirrored from
  // renderMirror.ts so the kicker stays attached to the closing read
  // regardless of which composer caller emits the prose.)
  if (goalSoulGive.quadrant === "striving") {
    const fired = constitution.goalSoulPatterns?.fired ?? [];
    const dbKicker = fired.find(
      (p) => p.id === "defensive_builder" && p.kickerProse
    );
    if (dbKicker) {
      prose = `${prose} ${dbKicker.kickerProse}`;
    }
  }

  // Two-tier substitution: only fires for the GIVE quadrant template
  // (the only template containing CLOSING_PHRASE_DEFAULT). Conditions
  // are independently AND'd; any single condition unmet → keep default.
  const quadrantArrived =
    constitution.movementQuadrant?.label === "Giving / Presence";
  // CC-PHASE-3A-LABEL-LOGIC — riskForm.letter is the legacy-classifier
  // reading, which now emits the new labels ("Open-Handed Aim"). The
  // canonical "arrived" condition is high-Aim + low-Grip.
  const riskWisdom =
    constitution.riskForm?.letter === "Open-Handed Aim";
  const strengthLong =
    (constitution.goalSoulMovement?.dashboard.movementStrength.length ?? 0) >=
    CLOSING_PHRASE_ARRIVED_STRENGTH_FLOOR;
  if (
    quadrantArrived &&
    riskWisdom &&
    strengthLong &&
    prose.includes(CLOSING_PHRASE_DEFAULT)
  ) {
    prose = prose.replace(CLOSING_PHRASE_DEFAULT, CLOSING_PHRASE_ARRIVED);
  }

  return prose;
}

// CC-PROSE-1B Layer 5 — extracted helpers so composeReportCallouts can
// reuse the exact same thesis-line and gift/danger-line construction the
// Executive Read uses. Single source of truth: when these helpers change
// (e.g., template phrasing tweaks), the Executive Read AND Layer 5 callouts
// stay in lockstep automatically. No new strings introduced — both helpers
// lift verbatim from existing engine maps.
export function composeGiftDangerLine(constitution: InnerConstitution): string {
  const dom = constitution.lens_stack.dominant;
  const gd = GIFT_DANGER_LINES[dom];
  return `Your gift is ${gd.gift}. Your danger is ${gd.danger}.`;
}

export function composeThesisLine(constitution: InnerConstitution): string {
  const topCompass = getTopCompassValues(constitution.signals);
  const thesis = thesisFor(constitution.lens_stack, topCompass);
  return `You are a ${thesis.shapeDescriptor} whose growth edge is not ${thesis.assumedX}, but ${thesis.structuralY}.`;
}

export function composeExecutiveRead(constitution: InnerConstitution): string {
  return `${composeGiftDangerLine(constitution)} ${composeThesisLine(constitution)}`;
}

// CC-PROSE-1B Layer 5C — surface the thesis components individually so
// the Final Line composer can mechanically recombine `shapeDescriptor` +
// `structuralY` (with an imperative-cast transformation on the latter)
// without re-parsing the composed thesis sentence.
export function getThesisComponents(constitution: InnerConstitution): {
  shapeDescriptor: string;
  assumedX: string;
  structuralY: string;
} {
  const topCompass = getTopCompassValues(constitution.signals);
  const t = thesisFor(constitution.lens_stack, topCompass);
  return {
    shapeDescriptor: t.shapeDescriptor,
    assumedX: t.assumedX,
    structuralY: t.structuralY,
  };
}

function buildKeepWithoutLines(
  constitution: InnerConstitution
): string[] {
  const lines: string[] = [];
  const gifts = constitution.cross_card.topGifts;
  const traps = constitution.cross_card.topRisks;
  const n = Math.min(3, Math.min(gifts.length, traps.length));
  for (let i = 0; i < n; i++) {
    const g = stripTrailingPeriod(gifts[i].label);
    const t = stripTrailingPeriod(traps[i].label);
    if (!g || !t) continue;
    lines.push(`To keep ${lowerInitial(g)} without ${lowerInitial(t)}.`);
  }
  return lines;
}

function stripTrailingPeriod(s: string): string {
  return s.replace(/\.+$/, "").trim();
}

function lowerInitial(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// CC-PROSE-1B Layer 5B — expose the Synthesis composer's structural
// parts so the markdown / React render layers can interleave the Most
// Useful Line callout between the parallel-line tercet and the closing
// thesis sentence without duplicating the gift/danger content.
//
// Pre-1B: generateSimpleSummary returned a single \n\n-joined string
// (intro + tercet + giftDanger + thesis). Post-1B: the same composer
// is also available as discrete parts; generateSimpleSummary returns
// the joined form for any caller that wants the legacy single-string
// shape.
export type SimpleSummaryParts = {
  intro: string;
  tercet: string | null;
  giftDanger: string;
  thesis: string;
};

export function getSimpleSummaryParts(
  constitution: InnerConstitution
): SimpleSummaryParts {
  const lensStack = constitution.lens_stack;
  const dom = lensStack.dominant;
  const topCompass = getTopCompassValues(constitution.signals);

  // Synthesizing sentences (intro paragraph). Pulls from the existing
  // constitution outputs rather than re-deriving — the synthesis should
  // match what the user has already read in the cards above.
  const synthesisLines: string[] = [];
  synthesisLines.push(
    `Your shape reads as ${FUNCTION_VOICE[dom]} supported by ${FUNCTION_VOICE[lensStack.auxiliary]} — the way you process the world before any single read settles.`
  );
  if (topCompass.length > 0) {
    synthesisLines.push(
      `What you protect clusters around ${valueListPhrase(topCompass, 0)} — the values the rest of the read is organized around.`
    );
  }
  if (constitution.belief_under_tension) {
    const but = constitution.belief_under_tension;
    if (but.epistemic_posture !== "unknown") {
      const postureWord =
        but.epistemic_posture === "open"
          ? "openness to revision"
          : but.epistemic_posture === "rigid"
          ? "a closed revision posture"
          : but.epistemic_posture === "guarded"
          ? "a privately-held conviction"
          : "an actively wrestling posture";
      synthesisLines.push(
        `The Keystone Reflection surfaced ${postureWord} around the belief you named — held in a way that's part of the shape, not separate from it.`
      );
    }
  }
  if (constitution.tensions.length > 0) {
    synthesisLines.push(
      `The tensions the engine surfaced are not failures of your shape — they are the shape's edges, where one strength meets the world that doesn't always reward it.`
    );
  }
  synthesisLines.push(
    `The growth path is not to become someone else; it is to become more grounded, more legible, and more free inside the person you already are.`
  );

  const keepLines = buildKeepWithoutLines(constitution);
  const tercet = keepLines.length > 0 ? keepLines.join("\n") : null;

  // Closing patterns B + C — share source of truth with Executive Read +
  // Layer 5 callouts (CC-PROSE-1B).
  const giftDanger = composeGiftDangerLine(constitution);
  const thesis = composeThesisLine(constitution);

  return {
    intro: synthesisLines.join(" "),
    tercet,
    giftDanger,
    thesis,
  };
}

export function generateSimpleSummary(
  constitution: InnerConstitution,
  // CC-PROSE-1A Fix 3 — `_demographics` is no longer read inside the
  // composer (the voice is locked to second-person regardless of name
  // presence). The parameter stays for call-site signature compatibility
  // with pre-Fix-3 callers and for any future re-introduction of
  // name-aware prose that doesn't violate the second-person register;
  // the leading underscore signals intentionally unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _demographics?: DemographicSet | null
): string {
  // CC-PROSE-1B Layer 5B — delegate to getSimpleSummaryParts so the
  // joined-string and parts shapes share one composer. CC-PROSE-1A
  // second-person voice is preserved unchanged inside the parts builder.
  const parts = getSimpleSummaryParts(constitution);
  const sections: string[] = [parts.intro];
  if (parts.tercet) sections.push(parts.tercet);
  sections.push(parts.giftDanger);
  sections.push(parts.thesis);
  return sections.join("\n\n");
}

void gravityRanksTop; // Reserved for future patterns; suppress unused-binding lint.
