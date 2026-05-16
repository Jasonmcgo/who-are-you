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
  // CC-SYNTHESIS-3 — LLM-articulated Path master synthesis paragraph,
  // pulled from `lib/cache/synthesis3-paragraphs.json` at engine-build
  // time. When present, the renderer prefers this paragraph over the
  // mechanical CC-SYNTHESIS-1F composer output (`composePathMasterSynthesis`).
  // Null when no cached paragraph exists for the fixture's input hash —
  // renderer falls back to the mechanical version.
  masterSynthesisLlm?: string | null;
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

/**
 * DriveMix — Cost/Coverage/Compliance as relative emphasis, summing to 100.
 *
 * Used for: pie-chart rendering ("you're 40% Cost, 35% Coverage, 25%
 * Compliance"). NOT used for interpretive math, lean classifiers, or
 * Aim composition — those consume `DriveStrengths` (independent 0-100
 * substance scores) per canon §10.
 *
 * Per canon — `docs/canon/trajectory-model-refinement.md` §10.
 */
export type DriveMix = {
  cost: number; // 0–100, summing with coverage + compliance to 100
  coverage: number;
  compliance: number;
  rankAware: boolean;
  inputCount: { cost: number; coverage: number; compliance: number };
};

/**
 * Backward-compat alias — preserved until consumers migrate. Per canon
 * §10 the canonical name is `DriveMix`.
 */
export type DriveDistribution = DriveMix;

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
  // CC-3CS-STRENGTH-MIX-AXIS-ALIGNMENT — independent 0-100 substance
  // scores for the three buckets. Cost couples to Goal-axis substance,
  // Coverage to Soul-axis, Compliance to wise-risk substance. Optional
  // because the field is attached AFTER the existing Drive computation
  // (which runs before goalSoulGive) — pre-CC saved sessions don't
  // carry the field.
  strengths?: DriveStrengths;
};

/**
 * DriveStrengths — independent 0-100 substance scores. Do not sum to 100.
 *
 * Used for: interpretive math (lean classifiers, Aim composition,
 * Risk Form thresholds). Distinct from `DriveMix`, which is a
 * 100%-summing emphasis ratio used for pie-chart language only.
 *
 * Per canon §10 / §11. The §11 reframing names the third Strength
 * "wise risk" (governance, discernment, restraint — not timid
 * rule-following). The field `compliance` is preserved for backward
 * compatibility; new code should read `wiseRisk` (always === compliance).
 */
export type DriveStrengths = {
  cost: number; // 0-100 — Goal-axis substance (work, output, craft, building)
  coverage: number; // 0-100 — Soul-axis substance (love, care, presence)
  compliance: number; // 0-100 — wise-risk substance (governance, discernment, restraint)
  /** CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT §11 — forward-facing alias
   *  for `compliance`. Always equal to `compliance`. New code should
   *  prefer `wiseRisk` to reinforce the §11 semantic reframing. */
  wiseRisk: number;
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

// CC-072 — Disposition Signal Mix (post-CC-037 reframe per
// docs/ocean-disposition-spec.md). The pre-CC-072 `distribution`
// (100%-summing across O/C/E/A/N) is misleading: Big Five traits are
// independent dimensions, not slices of a fixed pie. CC-072 introduces
// independent per-trait intensities (each 0–100, no cross-normalization),
// plus a separate dominance ranking, four Openness subdimensions, and a
// proxy-only flag for Emotional Reactivity. The legacy 100%-summing field
// is retained as `signalShareLegacy` for one CC of backward-compat and
// scheduled for removal in a follow-up CODEX (acceptance §AC-5).

export type OceanIntensity = number; // 0..100

export type OceanIntensityBand =
  | "under-detected" // 0–19
  | "low" // 20–39
  | "moderate" // 40–59
  | "moderate-high" // 60–79
  | "high"; // 80–100

export type OceanIntensities = {
  openness: OceanIntensity;
  conscientiousness: OceanIntensity;
  extraversion: OceanIntensity;
  agreeableness: OceanIntensity;
  emotionalReactivity: OceanIntensity;
};

export type OceanIntensityBands = {
  openness: OceanIntensityBand;
  conscientiousness: OceanIntensityBand;
  extraversion: OceanIntensityBand;
  agreeableness: OceanIntensityBand;
  emotionalReactivity: OceanIntensityBand;
};

// Dominance rank order across the five traits, with a per-trait signal
// count for tie-breaking and audit transparency. `ranked[0]` is the
// strongest signal; `ranked[4]` is the weakest.
export type OceanDominance = {
  ranked: OceanBucket[];
  signalCounts: Record<OceanBucket, number>;
};

// CC-072 — Openness subdimensions (memo §3). Re-tagged from existing
// signals; no new SignalIds added. The `flavor` field carries the
// dashboard's lead-with-flavor sentence selector per memo §3.5.
export type OpennessSubdimensionId =
  | "intellectual"
  | "aesthetic"
  | "novelty"
  | "architectural";

export type OpennessSubdimensions = Record<OpennessSubdimensionId, OceanIntensity>;

export type OpennessFlavor =
  | "intellectual_led"
  | "aesthetic_led"
  | "novelty_led"
  | "architectural_led"
  | "mixed";

// CC-072 — Emotional Reactivity proxy disclosure (memo §5). When the
// computed intensity is exactly 0 OR signal density is below threshold,
// `proxyOnly` is true and the user-facing render translates to "low or
// under-detected" with the §5.2 disclosure.
export type EmotionalReactivityConfidence = {
  proxyOnly: boolean;
  signalDensity: number; // count of contributing signals
};

// The dashboard payload — assembled from the OCEAN computations and
// rendered by lib/oceanDashboard.ts.
export type DispositionSignalMix = {
  intensities: OceanIntensities;
  bands: OceanIntensityBands;
  dominance: OceanDominance;
  opennessSubdimensions: OpennessSubdimensions;
  opennessFlavor: OpennessFlavor;
  emotionalReactivityConfidence: EmotionalReactivityConfidence;
};

export type OceanOutput = {
  // CC-072 — `distribution` is the pre-CC-072 100%-summing field. Kept on
  // the type for backward-compat with engine-internal consumers
  // (lib/workMap.ts cross-checks, admin pages); marked deprecated for
  // user-facing surfaces (acceptance §AC-5). The user-facing render no
  // longer emits this field — see `dispositionSignalMix` below.
  /** @deprecated CC-072: render `dispositionSignalMix` instead. Field retained for engine-internal cross-references; scheduled for removal in a follow-up CODEX. */
  distribution: OceanDistribution;
  case: OceanCase;
  prose: string;
  // CC-072 — Disposition Signal Mix (independent intensities, dominance,
  // subdimensions, ER proxy-only flag).
  dispositionSignalMix: DispositionSignalMix;
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

// CC-067 — Goal/Soul/Give derivation layer (CC-A of the chain in
// docs/goal-soul-give-spec.md). Engine-level read of coherence between
// outward-form (Goal) and inward-love (Soul). Vulnerability is computed
// engine-internally and applied as an asymmetric lift on Goal/Soul (CC-071);
// it is NOT a third axis the user sees and NOT exposed as a numeric score on
// any user-facing surface (spec §12.3, §13.4a).
//
// CC-071 quadrant union: `parallel_lives` is removed entirely. The
// compartmentalized high-G + high-S + thin-V case is captured by the
// asymmetric lift suppressing `adjustedScores.soul` rather than by a
// separate quadrant label. Spec §9 / §12.11.
export type GoalSoulQuadrant =
  | "give"
  | "striving"
  | "longing"
  | "gripping"
  | "neutral";

// CC-067 — engine-internal raw composite scores. Goal and Soul are the
// 0–100 sums of the §7 weighted predicates; vulnerability is the
// engine-internal Z-score (clamped to [-50, +50]).
export type GoalSoulRawScores = {
  goal: number;          // 0-100
  soul: number;          // 0-100
  vulnerability: number; // -50 to +50; engine-internal only
};

// CC-071 — adjusted scores after the asymmetric lift (spec §7). These are
// the Goal/Soul values the user sees on the dashboard and the values
// quadrant placement reads.
export type GoalSoulAdjustedScores = {
  goal: number; // 0-100, post-lift
  soul: number; // 0-100, post-lift
};

export type GoalSoulEvidence = {
  goalDrivers: string[];
  soulDrivers: string[];
  vulnerabilityDrivers: string[];
  grippingClusterFires: boolean;
  confidence: "high" | "medium" | "low";
};

// CC-071 — Gripping Pull score (spec §7). Independent of quadrant placement.
// A user can have moderate Gripping Pull (e.g., 30–50) without being in the
// SW Gripping quadrant — they're not stuck, but the cluster is partially
// active. Surfaced on the dashboard as a 0–100 score plus a named-signal
// list of which signals contributed.
export type GrippingPullSignal = {
  id: string;          // engine-internal signal identifier
  humanReadable: string; // user-facing plain-English label
};

export type GrippingPull = {
  score: number; // 0..100 — LEGACY additive composition (preserved for backward compat)
  signals: GrippingPullSignal[]; // non-empty when score > 0
  // CC-AIM-REBUILD-MOVEMENT-LIMITER Segment 3 — Stakes ≠ Grip split.
  // All optional because the fields are attached post-goalSoulGive in
  // the engine chain; pre-CC saved sessions don't carry them.
  stakesLoad?: number; // 0-100 — objective stakes (what's on the line)
  defensiveGrip?: number; // 0-100 — subjective collapse (how stakes hijack)
  gripAmplifier?: number; // 1.0-1.5 multiplier
  gripFromDefensive?: number; // 0-100 — canonical multiplicative Grip
};

export type GoalSoulGiveOutput = {
  // CC-071 — `rawScores` and `adjustedScores` replace the pre-CC-071 single
  // `scores` field. Raw scores are preserved for audit/debug; adjusted
  // scores are what the dashboard displays and what quadrant placement
  // reads. The asymmetric lift mapping lives in lib/goalSoulGive.ts.
  rawScores: GoalSoulRawScores;
  adjustedScores: GoalSoulAdjustedScores;
  quadrant: GoalSoulQuadrant;
  evidence: GoalSoulEvidence;
  prose: string;
  // CC-071 — Gripping Pull is a separate dashboard read, computed alongside
  // (not from) the adjusted scores. Always present (score may be 0; signals
  // empty when score is 0).
  grippingPull: GrippingPull;
};

// CC-070 — Cross-card pattern catalog (heuristic). Three patterns ride on
// top of CC-067's quadrant placement: Parallel Lives (already rendered by
// the Closing Read template, kicker exists for downstream consumers but
// renders nothing additional); Defensive Builder (heuristic, kicker
// appended to the Striving Closing Read at render time); Generative
// Builder (heuristic, kicker on the Path · Gait shape card). All three
// are derivation-only — they read existing signals, never new measurement.
// Q-Purpose-Building / `building_motive_*` signals from spec §9 are
// deferred to CC-B; CC-070 approximates the firing conditions with
// existing-signal heuristics.
// CC-071 — `parallel_lives` removed from the union. The compartmentalized
// case is now captured by the asymmetric lift in lib/goalSoulGive.ts.
export type CrossCardPatternId =
  | "defensive_builder"
  | "generative_builder";

export type CrossCardPattern = {
  id: CrossCardPatternId;
  kickerProse: string; // empty string when the pattern carries no kicker
  renderTarget:
    | "closing_read_suffix"
    | "path_gait_card"
    | "closing_read_body";
};

export type GoalSoulPatterns = {
  fired: CrossCardPattern[];
};

// CC-070 — Movement layer (static read for MVP, trajectory read deferred).
// Polar transform of the Goal/Soul plane produces an angle (posture) and a
// length (scale). The user-facing prose mixes geometric / motion / warmer
// vocabulary registers per spec §13.6, with the geometric register as the
// primary anchor in MVP. Demographics gate guidance language only — they
// have ZERO impact on angle / length math (canon § demographic-rules.md
// Rule 4). Engine vocabulary (Goal / Soul / Vulnerability) never appears
// in `prose`; the audit enforces.
export type MovementVocabularyRegister = "geometric" | "motion" | "warmer";

export type LifeStageGate =
  | "early_career"
  | "mid_career"
  | "entrepreneur"
  | "late_career"
  | "retirement"
  | "unknown";

// CC-071 — Movement Dashboard surface (spec §13.4a). The dashboard renders
// the user-facing engine-vocabulary fields (Goal, Soul, Direction, Movement
// Strength, Quadrant, Gripping Pull) above the narrative prose. Each field
// is precomputed here so renderMirror.ts and lib/goalSoulDashboard.ts can
// emit text + SVG without re-computing.
export type DirectionDescriptor = "Goal-leaning" | "balanced" | "Soul-leaning";
export type MovementStrengthDescriptor = "short" | "moderate" | "long" | "full";
export type DashboardQuadrantLabel = "Giving" | "Gripping" | null;

export type MovementDashboard = {
  goalScore: number; // adjustedScores.goal
  soulScore: number; // adjustedScores.soul
  direction: {
    angle: number; // 0..90 degrees
    descriptor: DirectionDescriptor; // computed from angle band
  };
  movementStrength: {
    length: number; // 0..100
    descriptor: MovementStrengthDescriptor;
  };
  // Quadrant label is "Giving" (NE), "Gripping" (SW), or null (SE/NW
  // unlabeled). Per spec §13.4a / acceptance §AC-19, no other label is
  // emitted (no "Goal-leaning" / "Striving" as a label — those are
  // descriptors, not categorical labels).
  quadrantLabel: DashboardQuadrantLabel;
  grippingPull: GrippingPull;
  // CC-AIM-REBUILD-MOVEMENT-LIMITER Segment 4 — Movement Limiter.
  // Attached post-Aim-computation. Optional because pre-CC saved
  // sessions don't carry it.
  movementLimiter?: import("./movementLimiter").UsableMovementReading;
};

export type MovementOutput = {
  angle: number; // 0..90 degrees (mirrors dashboard.direction.angle)
  length: number; // 0..100 normalized (mirrors dashboard.movementStrength.length)
  anchorRegister: MovementVocabularyRegister;
  prose: string; // narrative prose only — does NOT restate dashboard numbers
  evidence: {
    lifeStageGate: LifeStageGate;
    confidence: "high" | "medium" | "low";
  };
  // CC-071 — dashboard surface. Always populated; renderMirror.ts emits
  // both the dashboard text block and the SVG plot from this object.
  dashboard: MovementDashboard;
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
  // CC-067 addition — Goal/Soul/Give derivation. Optional because pre-CC-067
  // saved sessions don't carry the field; `computeGoalSoulGive` returns
  // undefined when input signals are insufficient.
  goalSoulGive?: GoalSoulGiveOutput;
  // CC-070 addition — cross-card pattern catalog (heuristic, no new signals).
  // Optional; `detectGoalSoulPatterns` returns undefined when no quadrant
  // is available or no pattern fires.
  goalSoulPatterns?: GoalSoulPatterns;
  // CC-070 addition — Movement layer (polar geometry off Goal/Soul scores
  // with life-stage-gated guidance). Optional; `computeMovement` returns
  // undefined when no goalSoulGive is available.
  goalSoulMovement?: MovementOutput;
  // CC-SYNTHESIS-1A Addition 1 — Risk Form 2x2 reading. Cross-tabulates
  // Drive distribution.compliance bucket against grippingPull score.
  // Optional because pre-CC-SYNTHESIS-1A saved sessions don't carry the
  // field, and computation is silently skipped when goalSoulMovement is
  // unavailable (no grip score to read).
  riskForm?: import("./riskForm").RiskFormReading;
  // CC-SYNTHESIS-1A Addition 2 — four-quadrant Movement label. Replaces
  // the prior `goalSoulMovement.dashboard.quadrantLabel` two-state
  // ("Giving" / "Gripping" / null) on the user-facing Quadrant line with
  // one of four canonical labels keyed off the (Goal, Soul) plane.
  // Optional for the same backward-compat reason.
  movementQuadrant?: import("./movementQuadrant").MovementQuadrantReading;
  // CC-GRIP-TAXONOMY — Primal cluster derivation. Maps the named grips
  // in `goalSoulMovement.dashboard.grippingPull.signals` onto the 7
  // Primal Questions (Am I safe / secure / loved / wanted / successful
  // / good enough / have purpose). Optional because pre-CC saved
  // sessions don't carry the field, AND because zero-grip users get a
  // low-confidence cluster with `primary: null`.
  gripTaxonomy?: import("./gripTaxonomy").PrimalCluster;
  // CC-GRIP-TAXONOMY — LLM-articulated Grip section paragraph from the
  // build-time cache. Same lifecycle as `path.masterSynthesisLlm`:
  // populated when the input hash matches a cache entry; runtime
  // fallback fills via `/api/grip/paragraph` when the static cache
  // misses (server-only API call). Null on any failure → renderer
  // falls back to the engine's generic prose.
  gripParagraphLlm?: string | null;
  // CC-PRIMAL-COHERENCE — two-path framework gating. Computes the gap
  // between the user's actual Goal/Soul scores and the expected profile
  // for their dominant Primal Question, then classifies path as
  // `trajectory` (50° framework holds) or `crisis` (frame breaks).
  // Optional because: (1) pre-CC saved sessions don't carry the field,
  // and (2) computation requires both gripTaxonomy + goalSoulMovement,
  // so thin-signal sessions silently fall through.
  coherenceReading?: import("./primalCoherence").CoherenceReading;
  // CC-AGE-CALIBRATION — developmental-band reading. Optional: null when
  // age data is missing or below the 14-year-old floor.
  bandReading?: import("./ageCalibration").BandReading | null;
  // CC-AGE-CALIBRATION — flag set when age < 14 (instrument is not
  // appropriate). Future render-layer CC may surface a different report.
  tooYoungForInstrument?: boolean;
  // CC-AIM-CALIBRATION — Aim composite (0-100) and the Aim-based Risk
  // Form reading. Both optional because: (1) pre-CC saved sessions don't
  // carry the fields; (2) Aim requires drive + movement + conviction
  // inputs, which may be absent on thin-signal sessions.
  aimReading?: import("./aim").AimReading;
  riskFormFromAim?: import("./riskForm").RiskFormReading;
  // CC-AIM-REBUILD-MOVEMENT-LIMITER Segment 1 — Phase 2 derivations.
  // Each optional; thin-signal fixtures may not have the prerequisite
  // inputs (e.g., missing goalSoulMovement for coherence).
  convictionClarity?: import("./convictionClarity").ConvictionClarityReading;
  goalSoulCoherence?: import("./goalSoulCoherence").GoalSoulCoherenceReading;
  responsibilityIntegration?: import("./responsibilityIntegration").ResponsibilityIntegrationReading;
  // CC-AIM-REBUILD-MOVEMENT-LIMITER Segment 2 — legacy Aim reading
  // preserved for cohort comparison. Phase 3 will switch downstream
  // consumers to the new Aim formula.
  aimReadingLegacy?: import("./aim").AimReadingLegacy;
  // CC-STRENGTH-MIGRATION-AND-STAKES-SPLIT §13 — canonical multiplicative
  // Grip reading. score = defensiveGrip × StakesAmplifier (gated by the
  // defensive-grip floor). Distinct from the legacy additive
  // `grippingPull.score`, which is preserved for backward compatibility.
  gripReading?: import("./gripDecomposition").GripReading;
  // CC-SHAPE-AWARE-PROSE-ROUTING — three-profile canon classification
  // (jasonType / cindyType / danielType / unmappedType). Routes prose
  // template selection so non-architect shapes get appropriate
  // appendix / Closing Read / gift labels / growth edges.
  profileArchetype?: import("./profileArchetype").ArchetypeReading;
  // CC-GRIP-TAXONOMY-REPLACEMENT — proprietary Grip Pattern reading.
  // Replaces Foster's "Primal Question" framework in user-facing prose.
  // The engine-internal Primal computation on `gripTaxonomy.primary`
  // remains for cache stability + as a classifier input; this field is
  // what renders.
  gripPattern?: import("./gripPattern").GripPatternReading;
  // CC-HANDS-CARD — 9th body card: Hands / Work. Existential Goal-axis
  // expression with a dual-mode read (health register vs pressure
  // register). Distinct from the Work Map vocational appendix.
  handsCard?: import("./handsCard").HandsCardReading;
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
  // CC-HEADER-NAV-AND-EMAIL-GATE — contact_email surfaced on the admin
  // list so admins can spot anonymous-vs-identified rows at a glance.
  // null when no demographics row exists or email was never collected.
  contact_email: string | null;
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
