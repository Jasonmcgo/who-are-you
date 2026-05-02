// CC-019 — Demographic answer shape, captured by the Identity & Context page
// after the user opts in via the Save flow on the result page. Each field
// carries a state ("specified" / "prefer_not_to_say" / "not_answered") per
// docs/canon/demographic-rules.md Rule 1 — opt-out is data, distinct from
// missing data. Re-exports FieldState from data/demographics.ts (the source
// of truth) so consumers can import everything from lib/types.
export type { FieldState } from "../data/demographics";
import type { FieldState as _FieldState } from "../data/demographics";

export type DemographicAnswer = {
  field_id: string;
  state: _FieldState;
  value?: string; // present iff state === "specified"
  other_text?: string; // present iff value names an "Other" option with allows_text
};

export type DemographicSet = {
  answers: DemographicAnswer[];
};

export type CardId =
  | "formation"
  | "context"
  | "role"
  | "temperament"
  | "conviction"
  | "pressure"
  | "contradiction"
  | "agency"
  | "sacred";

export type SignalId = string;

export type TensionId = string;

export type QuestionOption = {
  label: string;
  signal: SignalId | null;
};

export type RankingItemId = string;

export type RankingItem = {
  id: RankingItemId;
  label: string;
  gloss?: string;
  voice?: string;
  quote?: string;
  example?: string;
  signal: SignalId;
};

export type ForcedFreeformQuestion = {
  question_id: string;
  card_id: CardId;
  type: "forced" | "freeform";
  text: string;
  options: QuestionOption[];
  // CC-017 — Q-I1b uses these to render conditionally and disable Skip.
  // `render_if_skipped`: question only appears when the named question_id
  // was skipped (q_skipped MetaSignal present) or unanswered.
  // `unskippable`: when true, Skip button does not render and Continue
  // requires non-empty content.
  render_if_skipped?: string;
  unskippable?: boolean;
};

export type RankingQuestion = {
  question_id: string;
  card_id: CardId;
  type: "ranking";
  text: string;
  helper?: string;
  options?: never;
  items: RankingItem[];
};

// CC-016 — derived ranking. Items populate at render time from the top-N
// answers of the questions named in `derived_from`. First use case: the
// allocation cross-ranks (Q-S3-cross, Q-E1-cross).
export type DerivedRankingQuestion = {
  question_id: string;
  card_id: CardId;
  type: "ranking_derived";
  derived_from: string[];
  derived_top_n?: number; // defaults to 2
  text: string;
  helper?: string;
};

// CC-017 — multi-select question whose items populate at render time from the
// top-N of two parent rankings. First use case: Q-I2 (trust drivers from
// Q-X3 + Q-X4) and Q-I3 (sacred drivers from Q-S1 + Q-S2). Always carries
// a "None of these" and "Other" option.
export type MultiSelectDerivedQuestion = {
  question_id: string;
  card_id: CardId;
  type: "multiselect_derived";
  derived_from: string[];
  derived_top_n_per_source?: number; // defaults to 3
  text: string;
  helper?: string;
  none_option?: { id: string; label: string };
  other_option?: { id: string; label: string; allows_text?: boolean };
};

export type Question =
  | ForcedFreeformQuestion
  | RankingQuestion
  | DerivedRankingQuestion
  | MultiSelectDerivedQuestion;

export type ForcedFreeformAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "forced" | "freeform";
  response: string;
};

// CC-016 — three-state aspirational overlay attached to allocation rankings.
// Captures the gap between current allocation and aspirational allocation.
export type AspirationalOverlay = "wish_less" | "right" | "wish_more";

export type RankingAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "ranking";
  order: RankingItemId[];
  // CC-016 — populated only for the four allocation parent rankings
  // (Q-S3-close, Q-S3-wider, Q-E1-outward, Q-E1-inward). Other rankings
  // leave this undefined.
  overlay?: Record<RankingItemId, AspirationalOverlay>;
};

// CC-016 — derived-ranking answer. The user ranks items that were populated
// at render time from the top-N of two parent rankings.
export type RankingDerivedAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "ranking_derived";
  order: RankingItemId[];
  derived_item_sources: {
    id: RankingItemId;
    signal: SignalId;
    source_question_id: string;
  }[];
};

export type SinglePickAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "single_pick";
  picked_id: RankingItemId;
  picked_signal: SignalId;
};

// CC-017 — multi-select check-all-that-apply answer. Each `selections`
// entry is one selected item. `none_selected: true` is mutually exclusive
// with any selections (the engine treats this as a strong meta-pattern
// signal — see belief_impervious / belief_no_cost_named MetaSignals).
// `other_text` carries the user's freeform "Other" addendum but the engine
// treats it as commentary, never text-mining it for signals.
export type MultiSelectDerivedAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "multiselect_derived";
  selections: {
    id: string;
    signal: SignalId | null; // null for the "none" and "other" sentinels
    source_question_id?: string; // the parent question_id for derived items
  }[];
  none_selected: boolean;
  other_text?: string;
};

export type Answer =
  | ForcedFreeformAnswer
  | RankingAnswer
  | RankingDerivedAnswer
  | MultiSelectDerivedAnswer
  | SinglePickAnswer;

export type MetaSignalType =
  | "question_skipped"
  | "question_double_skipped"
  | "derived_question_skipped"
  // CC-017 — emitted when Q-I2's `none_selected: true` (no trust source could
  // change the user's mind about the named belief).
  | "belief_impervious"
  // CC-017 — emitted when Q-I3's `none_selected: true` (no sacred driver the
  // user would risk for the named belief).
  | "belief_no_cost_named";

export type MetaSignal = {
  type: MetaSignalType;
  question_id: string;
  card_id: CardId;
  recorded_at: number;
};

export type SignalStrength = "low" | "medium" | "high";

export type Signal = {
  signal_id: SignalId;
  description: string;
  from_card: CardId;
  source_question_ids: string[];
  strength: SignalStrength;
  rank?: number;
  // CC-016 — set when the signal comes from a derived (cross-rank) ranking.
  // The engine uses this to distinguish "resolved-hierarchy" signals
  // (cross-ranked between two domains) from within-domain rank signals.
  cross_rank?: number;
};

export type TensionConfidence = "low" | "medium" | "high";

export type TensionStatus =
  | "unconfirmed"
  | "confirmed"
  | "partially_confirmed"
  | "rejected";

export type TensionSignalRef = {
  signal_id: SignalId;
  from_card: CardId;
};

export type Tension = {
  tension_id: TensionId;
  type: string;
  description: string;
  signals_involved: TensionSignalRef[];
  confidence: TensionConfidence;
  status: TensionStatus;
  user_prompt: string;
  strengthened_by: Signal[];
};

export type CognitiveFunctionId =
  | "ni"
  | "ne"
  | "si"
  | "se"
  | "ti"
  | "te"
  | "fi"
  | "fe";

export type LensStack = {
  dominant: CognitiveFunctionId;
  auxiliary: CognitiveFunctionId;
  tertiary: CognitiveFunctionId;
  inferior: CognitiveFunctionId;
  mbtiCode?: string;
  confidence: "high" | "low";
};

export type GiftCategory =
  | "Pattern"
  | "Precision"
  | "Stewardship"
  | "Action"
  | "Harmony"
  | "Integrity"
  | "Builder"
  | "Advocacy"
  | "Meaning"
  | "Endurance"
  | "Discernment"
  | "Generativity";

// CC-038 — Function-pair register (auxiliary as cognitive-structure routing
// axis). Sixteen canonical Jung function-stack pairs; perceiver-dominants
// pair with judging auxiliaries and vice versa, introvert-dominants pair
// with extravert auxiliaries and vice versa (8 dominants × 2 viable
// auxiliaries = 16 cells). Non-canonical Lens stacks (e.g., Si dominant +
// Ne auxiliary) do not match any FunctionPairKey and fall through to
// CC-034 fallbacks at the routing layer.
//
// This is *not* MBTI integration. The engine surfaces the register analog
// (e.g., "the framework-prober") rather than the typological label. Analog
// labels are body-of-work language; v1 placeholders subject to CC-038-prose
// editorial refinement.
export type FunctionPairKey =
  | "NeTi" | "NeFi" | "NiTe" | "NiFe"
  | "SeTi" | "SeFi" | "SiTe" | "SiFe"
  | "TeNi" | "TeSi" | "TiNe" | "TiSe"
  | "FeNi" | "FeSi" | "FiNe" | "FiSe";

// CC-038-prose — driver / instrument are capitalized voice codenames matching
// the first/last halves of FunctionPairKey (NeTi = Ne driver + Ti instrument).
// Distinct from the lowercase `CognitiveFunctionId` used in `LensStack`.
// Driver supplies the center of gravity; instrument supplies the supporting
// method. The pair describes how the Lens carries values, trust, responsibility,
// pressure, and growth direction through the world. The pair is a movement,
// not a type — see docs/canon/function-pair-registers.md.
export type LensFunctionVoice =
  | "Ne" | "Ni" | "Se" | "Si"
  | "Te" | "Ti" | "Fe" | "Fi";

// CC-038-body-map — `ShapeCardId` was defined in `lib/identityEngine.ts` until
// CC-038-body-map. Moved here so `FunctionPairRegister` can reference it on
// the `body_map_route` field without creating a circular type-import edge
// (types.ts must remain a leaf in the type-dependency graph). identityEngine.ts
// re-exports `ShapeCardId` from this file, so existing import sites keep
// working unchanged.
export type ShapeCardId =
  | "lens"
  | "compass"
  | "conviction"
  | "gravity"
  | "trust"
  | "weather"
  | "fire"
  | "path";

export type FunctionPairRegister = {
  pair_key: FunctionPairKey;
  // CC-038-prose — driver/instrument metadata. The driver is always the first
  // voice in the pair; the instrument is always the second.
  driver: LensFunctionVoice;
  instrument: LensFunctionVoice;
  // CC-038-prose — v3 locked label. Single-word inhabited identity (or simple
  // compound where the compound names a real distinction the description
  // can't carry). Body-of-work language; never the typological code.
  analog_label: string;
  // canonical and locked at CC-038
  gift_category: GiftCategory;
  // CC-038-prose — refined to carry the specifying weight that v1's compound
  // labels were doing.
  short_description: string;
  // CC-038-prose — three editorial expression fields. healthy and distorted
  // pair as a gift→risk dynamic; product_safe_sentence is the locked Mirror
  // template ("Your Lens has a [analog] quality: you appear to ...").
  healthy_expression: string;
  distorted_expression: string;
  product_safe_sentence: string;
  // CC-038-body-map — cognitive movement through the 8-card body model.
  // Engine-side metadata; user-facing prose composes metaphor[from] →
  // metaphor[to] (e.g., "Path → Lens" for NeTi). The translation table
  // between user-facing metaphor and ShapeCardId codename is canonical at
  // docs/canon/function-pair-registers.md § translation table.
  body_map_route: { from: ShapeCardId; to: ShapeCardId };
};

export type SwotCell = {
  category?: GiftCategory;
  text: string;
};

export type FullSwotOutput = {
  cardName: string;
  bodyPart: string;
  cardHeader: string;
  gift: SwotCell;
  blindSpot: SwotCell;
  growthEdge: SwotCell;
  // CC-025 — aphoristic closing per card. Card-register-specific; keyed
  // to the body-part metaphor rather than the gift category, so two
  // cards with the same gift category never converge on the same line.
  // Optional in the type for backward compatibility with pre-CC-025
  // saved sessions whose JSONB shape lacks the field — the render
  // layer (ShapeCard) falls back to a per-card canonical map at read
  // time when this field is missing.
  patternNote?: SwotCell;
  riskUnderPressure: SwotCell;
  // CC-054 — Compass-specific cross-signal disambiguation prose. Populated
  // by `deriveCompassOutput` only when peace_priority / faith_priority
  // rank in the user's Compass top 5; absent (silent) otherwise. The
  // render layer guards on presence and renders a small prose block in
  // the Compass card body. Other ShapeCards leave these fields undefined.
  peace_register_prose?: string;
  faith_register_prose?: string;
};

export type ConvictionOutput = {
  cardName: "Conviction";
  bodyPart: "Voice";
  cardHeader: string;
  gift: SwotCell;
  blindSpot: SwotCell;
  posture: string;
  // CC-025 — aphoristic closing. Optional for pre-CC-025 backward compat;
  // ShapeCard's conviction variant falls back to canonical text when missing.
  patternNote?: string;
};

export type PathOutput = {
  cardName: "Path";
  bodyPart: "Gait";
  directionalParagraph: string;
  // CC-015b additions — Path's expanded body subsections:
  work: string;
  love: string;
  give: string;
  growthCounterweight: string;
  // CC-025 — aphoristic closing appended at the end of PathExpanded.
  // Optional for pre-CC-025 backward compat.
  patternNote?: string;
  // CC-026 — Drive distribution (the claimed-vs-revealed why-axis). Optional;
  // present when the engine has at least one tagged input from the 15-input
  // signal map. Pre-CC-026 saved sessions that lack Q-3C1 still render the
  // distribution from existing inputs (case will be "unstated").
  drive?: DriveOutput;
};

// CC-026 — Drive framework (claimed-vs-revealed why-axis).
//
// Drive is the model's first explicit why-measurement. *Energy* is the
// resource (already measured by Q-E1-* / Q-A2); Drive is what motivates the
// exertion of energy. The three drive buckets — Cost (financial security),
// Coverage (relational care), Compliance (risk-mitigation) — compete for
// the user's energy expenditure.
//
// Vocabulary discipline: "Drive", "claimed", "revealed", and the bucket names
// (cost / coverage / compliance) live in canon docs and engineer-facing
// surfaces. User-facing prose uses human-language phrases — "financial
// security" / "the people you love" / "risk and uncertainty" — and never
// the framework terms themselves.
export type DriveBucket = "cost" | "coverage" | "compliance";

export type DriveRanking = {
  first: DriveBucket;
  second: DriveBucket;
  third: DriveBucket;
};

export type DriveDistribution = {
  cost: number; // 0–100, summing with coverage + compliance to 100
  coverage: number;
  compliance: number;
  rankAware: boolean;
  inputCount: { cost: number; coverage: number; compliance: number };
};

export type DriveCase =
  | "aligned"
  | "inverted-small"
  | "inverted-big"
  | "partial-mismatch"
  | "balanced"
  | "unstated";

export type DriveOutput = {
  distribution: DriveDistribution; // revealed drive
  claimed?: DriveRanking; // present when Q-3C1 was answered
  case: DriveCase;
  prose: string; // case-specific interpretation paragraph
};

// CC-037 — OCEAN Derivation framework (Big-5 dimensions derived from existing
// signals). No new questions; the instrument's measurement footprint is
// unchanged. Internal codenames are the canonical Big-5 single-letter
// abbreviations; user-facing label for "N" is "Emotional Reactivity
// (estimated)" rather than "Neuroticism" (clinical-pejorative baggage). The
// framework is derivation-only — there is no claimed-vs-revealed split (the
// user is never asked to rank themselves on OCEAN).
export type OceanBucket = "O" | "C" | "E" | "A" | "N";

export type OceanDistribution = {
  O: number; // 0-100, sum across O+C+E+A+N is 100
  C: number;
  E: number;
  A: number;
  N: number;
  rankAware: boolean;
  inputCount: { O: number; C: number; E: number; A: number; N: number };
  // Always true. Flag exists so the render layer + prose layer can call out
  // the proxy nature of N without re-deriving the rule from elsewhere.
  neuroticismEstimated: true;
};

export type OceanCase =
  | "single-dominant"
  | "two-dominant"
  | "balanced"
  | "n-elevated";

export type OceanOutput = {
  distribution: OceanDistribution;
  case: OceanCase;
  prose: string;
};

// CC-042 — Work Map Derivation framework. Composes existing measurements
// (Lens aux-pair register, Drive distribution, OCEAN, Q-E1 energy allocation,
// Compass values, Q-Ambition1, Path agency aspiration) into 1–2 work
// registers the user is structurally aligned to. Derivation only; no new
// questions, no new signals. The 8 register identities (`register_key`) and
// predicate logic structure are canonical. Labels, descriptions, and example
// anchors are v1 placeholders subject to a future workshop CC. Sibling
// outputs (Love Map / Giving Map) follow the same architectural pattern.
export type WorkRegisterKey =
  | "strategic_architectural"
  | "analytical_investigative"
  | "embodied_craft"
  | "caring_service"
  | "pastoral_counselor"
  | "civic_advocacy"
  | "generative_creative"
  | "operational_stewardship";

export type WorkRegister = {
  register_key: WorkRegisterKey;
  register_label: string;
  short_description: string;
  example_anchors: string[];
  composes_naturally_with: FunctionPairKey[];
};

export type WorkMapMatch = {
  register: WorkRegister;
  score: number; // 0..1
};

export type WorkMapOutput = {
  matches: WorkMapMatch[]; // 1-2 entries
  prose: string;
};

// CC-044 — Love Map Derivation framework (Love registers + Flavors + Resource
// Balance diagnostic). Composes existing measurements (Lens aux-pair register,
// Drive distribution, OCEAN, Compass values, Q-X4 trust portfolio, Q-S3 money
// allocation, Q-E1 energy allocation, Q-Stakes1, Q-Ambition1, Path agency
// aspiration) into a structured Love output. Derivation only; no new
// questions, no new signals. The 7 register identities (`register_key`) and 7
// flavor identities (`flavor_key`), the Resource Balance case classifier
// (4 cases), and the locked Pauline-frame + Resource-Balance prose templates
// are canonical at CC-044. Register labels, descriptions, characteristic
// distortions, and flavor labels/descriptions are v1 placeholders subject to
// CC-044-prose editorial polish. Sibling output: CC-045 Giving Map.
export type LoveRegisterKey =
  | "devoted_partner"
  | "parental_heart"
  | "chosen_family"
  | "companion"
  | "belonging_heart"
  | "loyalist"
  | "open_heart";

export type LoveFlavorKey =
  | "commitment_loyalty"
  | "fun_adventure"
  | "building_construction"
  | "championing"
  | "tenderness_care"
  | "witnessing_recognition"
  | "devotion_to_calling";

export type LoveRegister = {
  register_key: LoveRegisterKey;
  register_label: string;
  short_description: string;
  composes_naturally_with: FunctionPairKey[];
  characteristic_distortion: string;
};

export type LoveFlavor = {
  flavor_key: LoveFlavorKey;
  flavor_label: string;
  short_description: string;
};

export type LoveRegisterMatch = {
  register: LoveRegister;
  score: number;
};

export type LoveFlavorMatch = {
  flavor: LoveFlavor;
  score: number;
};

export type ResourceBalanceCase =
  | "healthy"
  | "inward_heavy"
  | "outward_depleted"
  | "thin_overall";

export type ResourceBalance = {
  case: ResourceBalanceCase;
  selfScore: number;  // 0..1
  otherScore: number; // 0..1
  prose: string;      // empty for "healthy"; locked text for distortion cases
};

export type LoveMapOutput = {
  matches: LoveRegisterMatch[]; // 0-2 entries
  flavors: LoveFlavorMatch[];   // 0-3 entries
  resourceBalance: ResourceBalance;
  prose: string;
};

export type ShapeOutputs = {
  lens: FullSwotOutput;
  compass: FullSwotOutput;
  conviction: ConvictionOutput;
  gravity: FullSwotOutput;
  trust: FullSwotOutput;
  weather: FullSwotOutput;
  fire: FullSwotOutput;
  path: PathOutput;
};

export type TopGiftEntry = {
  label: string;
  paragraph: string;
};

export type TopRiskEntry = {
  label: string;
  paragraph: string;
};

export type CrossCardSynthesis = {
  topGifts: TopGiftEntry[];
  topRisks: TopRiskEntry[];
  growthPath: string;
  relationshipTranslation: string;
  conflictTranslation: string;
  mirrorTypesSeed: string;
};

// CC-017 — Keystone Reflection / Belief Under Tension. Three structured-source
// dimensions derived from the user's Q-I2 (trust drivers that could change
// their mind) and Q-I3 (sacred drivers they'd risk for the belief) selections,
// anchored by Q-I1 (or Q-I1b on Q-I1 skip) freeform text. Confidence is
// implicit: high when both Q-I2 and Q-I3 were answered; medium when one
// cascade-skipped; unknown when both cascade-skipped. The two CC-015c
// heuristic-derived dimensions (`disagreement_context`, `social_cost`) are
// retired in CC-017; the user-confirmation/confidence flags are gone since
// confidence is no longer heuristic.
export type ValueDomain =
  | "truth"
  | "freedom"
  | "loyalty"
  | "justice"
  | "faith"
  | "stability"
  | "knowledge"
  | "family"
  | "unknown";

export type ConvictionTemperature = "low" | "moderate" | "high" | "unknown";

export type EpistemicPosture =
  | "open"
  | "guarded"
  | "rigid"
  | "reflective"
  | "unknown";

export type BeliefUnderTension = {
  belief_text: string;
  belief_source_question_id: "Q-I1" | "Q-I1b";
  value_domain: ValueDomain;
  conviction_temperature: ConvictionTemperature;
  epistemic_posture: EpistemicPosture;
};

// CC-015b — Mirror output. Short, beautiful, useful read at top of result page.
export type MirrorTopGift = {
  label: string;
  paragraph: string;
};

export type MirrorTopTrap = {
  label: string;
  paragraph: string;
};

export type NextMove = {
  label: string;
  paragraph: string;
};

// CC-058 — Mirror layer uncomfortable-but-true tension class. Names the
// 8 candidate cross-signal patterns the engine selects between. Per the
// canon (CC-048 Rule 5), every report carries at most one
// uncomfortable-but-true sentence; silence (`null`) is the canonical
// fallback when no condition matches a locked candidate.
export type UncomfortableButTrueClass =
  | "context_vs_authority"
  | "pattern_vs_translation"
  | "claim_vs_allocation"
  | "conviction_vs_rigidity"
  | "builder_vs_pause"
  | "caretaker_vs_self"
  | "action_vs_direction"
  | "stewardship_vs_stagnation";

export type MirrorOutput = {
  shapeInOneSentence: string;
  corePattern: string;
  topGifts: MirrorTopGift[];
  topTraps: MirrorTopTrap[];
  whatOthersMayExperience: string;
  whenTheLoadGetsHeavy: string;
  yourNext3Moves: NextMove[];
  // CC-058 — uncomfortable-but-true sentence (CC-048 Rule 5). Engine-owned
  // locked anchor; the polish layer (CC-057a/b) preserves it verbatim.
  // `null` (or undefined for pre-CC-058 saved sessions) → render no slot.
  uncomfortableButTrue?: string | null;
};

export type InnerConstitution = {
  core_orientation: string;
  signals: Signal[];
  tensions: Tension[];
  sacred_values: string[];
  bridge_signals: string[];
  // CC-011 additions:
  shape_summary: string;
  lens_stack: LensStack;
  shape_outputs: ShapeOutputs;
  cross_card: CrossCardSynthesis;
  // CC-011b addition:
  watch_for: string[];
  // CC-014 addition: engagement-only data, never feeds derivation.
  meta_signals: MetaSignal[];
  // CC-015b addition — Mirror is the default-visible top section.
  mirror: MirrorOutput;
  // CC-015c addition — Keystone Reflection (null if no Q-I1 answer).
  belief_under_tension: BeliefUnderTension | null;
  // CC-016 addition — per-allocation-ranking three-state aspirational overlays.
  allocation_overlays?: {
    money_close?: Record<string, AspirationalOverlay>;
    money_wider?: Record<string, AspirationalOverlay>;
    energy_outward?: Record<string, AspirationalOverlay>;
    energy_inward?: Record<string, AspirationalOverlay>;
  };
  // CC-037 addition — OCEAN derivation. Optional because pre-CC-037 saved
  // sessions don't carry the field; the render layer guards on presence.
  ocean?: OceanOutput;
  // CC-042 addition — Work Map derivation. Optional because pre-CC-042 saved
  // sessions don't carry the field, and `computeWorkMapOutput` returns
  // undefined when no register fires above the threshold floor.
  workMap?: WorkMapOutput;
  // CC-044 addition — Love Map derivation. Optional because pre-CC-044 saved
  // sessions don't carry the field, and `computeLoveMapOutput` returns
  // undefined when no register fires AND the Resource Balance is healthy.
  loveMap?: LoveMapOutput;
};

// CC-021a — Admin-surface types for the researcher UI. These describe API
// payloads, not engine input. They live here so both the server routes and
// the admin React pages share one schema.

export type Attachment = {
  id: string;
  session_id: string;
  uploaded_at: string; // ISO 8601 — serialized over the wire as a string
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  label: string | null;
  notes: string | null;
};

// One row in the sessions table view. Pre-computed columns (dominant
// function, top compass value, allocation tension count, etc.) are derived
// server-side from the saved JSONB so the page can render flat HTML.
export type SessionSummary = {
  id: string;
  saved_at: string; // ISO 8601
  // Demographics — null when no demographics row exists; otherwise carries
  // the (state, value) pair for the columns the table surfaces.
  name_state: _FieldState;
  name_value: string | null;
  age_state: _FieldState;
  age_decade: string | null;
  profession_state: _FieldState;
  profession_value: string | null;
  gender_state: _FieldState;
  gender_value: string | null;
  // Derived from inner_constitution.
  dominant_function: CognitiveFunctionId | null;
  top_compass: ValueDomain | string | null;
  conviction_posture: EpistemicPosture | null;
  allocation_tensions_count: number;
  attachments_count: number;
};

// Full session detail returned to the detail page. The InnerConstitution
// shape is reused as-is; demographics and attachments are surfaced
// alongside it.
export type SessionDetailDemographics = {
  name_state: _FieldState;
  name_value: string | null;
  gender_state: _FieldState;
  gender_value: string | null;
  age_state: _FieldState;
  age_decade: string | null;
  location_state: _FieldState;
  location_country: string | null;
  location_region: string | null;
  marital_status_state: _FieldState;
  marital_status_value: string | null;
  education_state: _FieldState;
  education_value: string | null;
  political_state: _FieldState;
  political_value: string | null;
  religious_state: _FieldState;
  religious_value: string | null;
  profession_state: _FieldState;
  profession_value: string | null;
};

export type SessionDetail = {
  id: string;
  saved_at: string;
  inner_constitution: InnerConstitution;
  // CC-022b — the saved Answer[] (raw test responses). Used by the admin
  // detail view to feed the Keystone Reflection's selection-citation
  // prose (Q-I2 / Q-I3 selections cited back by source-question label).
  // Optional in the type so older callers/payloads stay compatible; the
  // route surfaces it when the column is populated.
  answers?: Answer[];
  demographics: SessionDetailDemographics | null;
  attachments: Attachment[];
};
