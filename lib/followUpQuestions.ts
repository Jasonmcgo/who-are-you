// CC-125 — Post-test follow-up question generator (deterministic).
//
// Purpose: from an existing `InnerConstitution` + the user's answers, produce
// exactly three follow-up questions that surface (1) what the Grip is
// protecting (grip_object), (2) what would make release feel safe
// (release_condition), and (3) what Aim could replace the Grip without
// betraying the gift (aim_replacement). Slot 2 may swap to a `compression_check`
// or `trait_vs_weather` probe per the decision tree, but the three core
// purposes still appear across the set (the swap folds the release-condition
// intent into its options).
//
// This module is rules + a seed-bank — no LLM. Same input → identical output.
// Architectural precedent: `CROSS_CARD_PATTERNS` in `lib/identityEngine.ts`
// (detection-fn-on-signals → templated prose). Mirrors that shape.
//
// Adapter signature note: the prompt's table specifies
// `buildFollowUpInput(constitution): FollowUpInput`. `weather.load` derives
// from the engine's `computeStateLoad(answers)` (`lib/nextMovesRouter.ts:148`),
// which reads Q-X1 / Q-X2 / Q-A1 / Q-O2 — those are NOT on the
// `InnerConstitution`. So `buildFollowUpInput` here takes
// `(constitution, answers)` to read state-load + currentMode. The constitution
// alone is insufficient for `weather.load`. Flagged in the CC report.

import type { Answer, CognitiveFunctionId, InnerConstitution } from "./types";
import { computeStateLoad } from "./nextMovesRouter";
import {
  topPickCountFor,
  TOP_PICK_CONVERGENCE_MARGIN,
  JUDGING_COOCCURRENCE_THRESHOLD,
} from "./jungianStack";

// ─────────────────────────────────────────────────────────────────────
// Types — verbatim from CC-125 task A
// ─────────────────────────────────────────────────────────────────────

export type FollowUpInput = {
  personName: string;
  lens?: {
    typeLabel?: string;
    dom?: string;
    aux?: string;
    confidence?: "low" | "medium" | "high";
    ambiguityNotes?: string[];
    // CC-134 Part D §D.1 — top-pick leaders per perceiving sub-axis,
    // resolved from Q-T signals. Populated when an N/S head-to-head
    // clarifier should fire (Lens confidence is `low` OR the N/S split
    // is suspect per the §C.6 valence guard). When set, the generator
    // appends a `type_clarity` question that pairs `nsLeaderN` against
    // `nsLeaderS` head-to-head.
    nsLeaderN?: CognitiveFunctionId;
    nsLeaderS?: CognitiveFunctionId;
    nsHeadToHeadTrigger?: "low_confidence" | "ns_split_suspect";
    // CC-134.1 §Task 3 — judging-axis head-to-head. Fires when both
    // members of an impossible same-attitude judging pair (Ti & Fi, or
    // Te & Fe) accumulate ≥ JUDGING_COOCCURRENCE_THRESHOLD top-picks —
    // a canonical stack can't hold both, so the picks are warm-Ti-
    // pulls-Fi (or warm-Te-pulls-Fe) contamination. The clarifier pits
    // the two head-to-head so the perceiving call is resolved by
    // explicit pick.
    judgingHeadToHeadA?: CognitiveFunctionId;
    judgingHeadToHeadB?: CognitiveFunctionId;
    judgingHeadToHeadTrigger?: "ti_fi_cooccurrence" | "te_fe_cooccurrence";
  };
  // CC-134 Part D §D.2 — large-gap blind spots whose underlying input
  // is suspect (untouched ranking heuristic or low-confidence Lens).
  // When non-empty, the generator emits one `blindspot_confirm`
  // question per entry instead of letting the engine assert the gap
  // as a hypocrisy finding. Capped to two clarifiers to respect the
  // second-pass budget.
  blindspotsToConfirm?: Array<{
    /** Compass value label (e.g. "Honor"). Surfaced verbatim in the
     *  clarifier prompt as "you named X highest." */
    valueLabel: string;
    /** Short engine read of what the week pays for instead — surfaced
     *  in the second half of the clarifier ("…your week reads Y"). */
    weekReadsAs: string;
  }>;
  movement: {
    goal: number;
    soul: number;
    directionDegrees: number;
    usableMovement: number;
    potentialMovement: number;
    dragPercent: number;
    aim: number;
    grip: number;
    gripWithStakes: number;
    gripDelta: number;
    amplifier?: number;
    riskForm: string;
  };
  weather: {
    load: "low" | "moderate" | "high";
    stateCaveat?: boolean;
  };
  gripPattern?: {
    primary?: string;
    secondary?: string[];
    stakesTriggers?: string[];
  };
  reportSignals?: {
    workShape?: string;
    loveShape?: string;
    topValues?: string[];
    currentMode?: string;
    keyPhrases?: string[];
  };
};

export type FollowUpOption = {
  label: string;
  text: string;
  tags: string[];
  interpretation: string;
};

export type FollowUpPurpose =
  | "grip_object"
  | "release_condition"
  | "aim_replacement"
  | "compression_check"
  | "trait_vs_weather"
  | "type_clarity";

export type FollowUpQuestion = {
  id: string;
  purpose: FollowUpPurpose;
  question: string;
  responseMode: "choose_one" | "rank_top_2" | "rank_top_3";
  options: FollowUpOption[];
};

export type FollowUpQuestionSet = {
  personName: string;
  selectedFamilies: string[];
  reasonForQuestions: string;
  questions: FollowUpQuestion[];
};

// ─────────────────────────────────────────────────────────────────────
// Family taxonomy (derived from `gripPattern.bucket × gripTaxonomy.subRegister`)
// ─────────────────────────────────────────────────────────────────────

export type FollowUpFamily =
  | "control_mastery"
  | "belonging_usefulness"
  | "worth_achievement"
  | "continuity"
  | "security"
  | "responsibility";

const ALL_FAMILIES: FollowUpFamily[] = [
  "control_mastery",
  "belonging_usefulness",
  "worth_achievement",
  "continuity",
  "security",
  "responsibility",
];

// ─────────────────────────────────────────────────────────────────────
// Seed-bank — pool of 8–10 options per family per purpose.
// Each option is authored in priority order so deterministic top-N
// selection lands on the best content even when no boost matches.
// `boost` tags lift the option when present in the person's `topValues`
// / `stakesTriggers` / dom-function pool. Filtering = stable sort by
// boost-count then by authored index; pick first 6.
// ─────────────────────────────────────────────────────────────────────

type SeedOption = {
  label: string;
  text: string;
  tags: string[];
  interpretation: string;
  /** Tokens that, if matched in the person's signal pool, lift this option. */
  boost?: string[];
};

type FamilySeedBank = {
  gripObject: SeedOption[];
  releaseCondition: SeedOption[];
  aimReplacement: SeedOption[];
};

const FAMILY_SEED_BANKS: Record<FollowUpFamily, FamilySeedBank> = {
  control_mastery: {
    gripObject: [
      { label: "Mastery", text: "Craft sufficient that nothing about the work surprises me.", tags: ["mastery", "control"], interpretation: "Grip-as-skill-sovereignty.", boost: ["Knowledge", "ti"] },
      { label: "Authorship", text: "Outcomes I can fully attribute to my own hand.", tags: ["authorship", "control"], interpretation: "Grip-as-attribution.", boost: ["Honor"] },
      { label: "Inner certainty", text: "Internal certainty before public commitment.", tags: ["certainty", "control"], interpretation: "Grip on knowing-before-saying." },
      { label: "Standing scrutiny", text: "The work standing under outside scrutiny.", tags: ["standing", "control"], interpretation: "Grip-as-defensible-outcome." },
      { label: "Avoiding misread", text: "Not being read as incompetent or unprepared.", tags: ["competence", "fear-misread"], interpretation: "Grip = avoiding the perceptual cost." },
      { label: "Model holding", text: "The model I built holding under stress.", tags: ["model", "control"], interpretation: "Grip-as-framework-validation.", boost: ["ni", "ti"] },
      { label: "No surprises", text: "Knowledge thorough enough that no question lands cold.", tags: ["preparedness", "control"], interpretation: "Grip-as-anticipation." },
      { label: "Quiet competence", text: "Being someone the room defers to without asking.", tags: ["recognized-competence"], interpretation: "Grip-as-implicit-authority." },
    ],
    releaseCondition: [
      { label: "Competent hands", text: "Other competent hands proving load-bearing in the same domain.", tags: ["delegation", "release"], interpretation: "Release through visible peer-competence." },
      { label: "Recoveries logged", text: "A track record of recoveries from being wrong landing without consequence.", tags: ["iteration", "release"], interpretation: "Release through reversibility." },
      { label: "Low-stakes public", text: "Stakes low enough to learn in public without it costing.", tags: ["low-stakes", "release"], interpretation: "Release through cost-bounded exposure." },
      { label: "Sharper peer", text: "A peer who shows up sharper than me on something I care about.", tags: ["peer-sharpening"], interpretation: "Release through being shown up gracefully." },
      { label: "Public miss", text: "A public miss landing without my standing collapsing.", tags: ["mistake-test", "release"], interpretation: "Release through standing surviving error." },
      { label: "Time to iterate", text: "Time that doesn't punish iteration as indecision.", tags: ["iteration"], interpretation: "Release through pace-tolerance." },
      { label: "Held by structure", text: "A structure that catches my mistakes before they reach anyone.", tags: ["structure", "release"], interpretation: "Release through scaffolding." },
      { label: "Trust the inputs", text: "Trusting the inputs I didn't author personally.", tags: ["delegation"], interpretation: "Release through letting go of attribution." },
    ],
    aimReplacement: [
      { label: "Ships under feedback", text: "Craft that ships under feedback, not under perfection.", tags: ["shipping", "aim"], interpretation: "Aim = pace + responsiveness." },
      { label: "Public iteration", text: "Public iteration as the practice itself.", tags: ["iteration", "aim"], interpretation: "Aim names the loop." },
      { label: "Mastery as service", text: "Mastery measured by what it lets others do.", tags: ["service", "aim"], interpretation: "Aim = downstream enablement." },
      { label: "Next revision", text: "Authorship of the next revision instead of the final answer.", tags: ["revision", "aim"], interpretation: "Aim = an evolving series." },
      { label: "Held lightly", text: "Skill held lightly because the next version exists.", tags: ["humility", "aim"], interpretation: "Aim = succession-aware competence." },
      { label: "Recoveries on record", text: "Recoveries logged as part of the record, not hidden.", tags: ["transparency", "aim"], interpretation: "Aim = mistakes-as-data." },
      { label: "Stewardship of craft", text: "Stewardship of a craft someone else will inherit.", tags: ["inheritance", "aim"], interpretation: "Aim = pass-it-on register." },
      { label: "Curiosity over certainty", text: "Curiosity holding more weight than certainty in how I work.", tags: ["curiosity", "aim"], interpretation: "Aim shifts from defense to inquiry." },
    ],
  },

  belonging_usefulness: {
    gripObject: [
      { label: "Being the one who arrives", text: "Being the one who reliably arrives when needed.", tags: ["presence", "usefulness"], interpretation: "Grip-as-show-up.", boost: ["Family", "Loyalty", "fe"] },
      { label: "Useful role", text: "The role of useful presence in the lives of people I love.", tags: ["role", "usefulness"], interpretation: "Grip-as-function." },
      { label: "Continuity", text: "Continuity others can count on, even when I'm tired.", tags: ["continuity", "belonging"], interpretation: "Grip-as-reliability." },
      { label: "Reading the room", text: "Knowing what each person needs before they ask.", tags: ["attunement"], interpretation: "Grip-as-anticipatory-care.", boost: ["fe"] },
      { label: "Kept in", text: "Being kept inside the circle by the work I do for it.", tags: ["earning-belonging"], interpretation: "Grip = belonging-as-currency." },
      { label: "What I make possible", text: "What I make possible for the people I love.", tags: ["enablement"], interpretation: "Grip-as-downstream-care." },
      { label: "Not being a burden", text: "Avoiding ever being the one who needs.", tags: ["self-erasure"], interpretation: "Grip = care-without-receiving." },
      { label: "Being needed", text: "Being needed by the people I'd carry anything for.", tags: ["being-needed"], interpretation: "Grip-as-indispensability." },
    ],
    releaseCondition: [
      { label: "Stay without orchestrating", text: "Proof that someone stays without me orchestrating it.", tags: ["unearned-belonging"], interpretation: "Release through non-conditional bond." },
      { label: "Hand offered first", text: "A reciprocal hand offered to me before I ask.", tags: ["reciprocity"], interpretation: "Release through being held first." },
      { label: "Received tired", text: "Being received warmly when I show up tired.", tags: ["received-as-self"], interpretation: "Release through non-performative reception." },
      { label: "Ask without performing", text: "Permission to ask for something without performing the need.", tags: ["asking"], interpretation: "Release through unguarded ask." },
      { label: "Absence doesn't end it", text: "Evidence that my absence doesn't end the bond.", tags: ["secure-distance"], interpretation: "Release through proven continuity-without-me." },
      { label: "Named, not used", text: "Being named for who I am, not what I do.", tags: ["seen", "identity"], interpretation: "Release through ontological recognition." },
      { label: "Slow week, still in", text: "Being kept in the circle on a slow week.", tags: ["non-conditional"], interpretation: "Release through low-output reception." },
      { label: "Held while needing", text: "Someone holding the load while I need.", tags: ["receiving"], interpretation: "Release through being-the-one-cared-for." },
    ],
    aimReplacement: [
      { label: "Presence, not function", text: "Belonging as presence, not function.", tags: ["being", "aim"], interpretation: "Aim shifts from doing to being." },
      { label: "Care includes me", text: "Care that explicitly includes me as a recipient.", tags: ["self-care", "aim"], interpretation: "Aim names self-care as part of love." },
      { label: "Past the role", text: "The relationship past the role.", tags: ["beyond-role", "aim"], interpretation: "Aim = identity beyond function." },
      { label: "Receive without repay", text: "Receiving without paying back.", tags: ["receiving", "aim"], interpretation: "Aim = gift-economy register." },
      { label: "Known by name", text: "Being known by name, not job description.", tags: ["named", "aim"], interpretation: "Aim = ontological belonging." },
      { label: "Continuity past me", text: "Continuity that survives my absence.", tags: ["secure-bond", "aim"], interpretation: "Aim = bond stronger than function." },
      { label: "Care with form", text: "Care that has structure so it doesn't drain me.", tags: ["sustainable-care", "aim"], interpretation: "Aim = bounded generosity." },
      { label: "Mutual carry", text: "Carrying and being carried in the same relationships.", tags: ["mutuality", "aim"], interpretation: "Aim = balanced reciprocity." },
    ],
  },

  worth_achievement: {
    gripObject: [
      { label: "The next visible win", text: "The next visible win on the public ledger.", tags: ["achievement"], interpretation: "Grip-as-ledger.", boost: ["Honor", "te"] },
      { label: "Substantial output", text: "Output the world reads as substantial.", tags: ["legibility"], interpretation: "Grip-as-perceived-weight." },
      { label: "Peer standing", text: "Standing measured against people I respect.", tags: ["peer-comparison"], interpretation: "Grip-as-relative-position." },
      { label: "The minimum standard", text: "The standard I won't allow myself to drop below.", tags: ["floor", "control"], interpretation: "Grip-as-floor-defense." },
      { label: "Justifying the cost", text: "Achievement that justifies the cost of what I gave up.", tags: ["compensation"], interpretation: "Grip-as-cost-justification." },
      { label: "Belonging in the room", text: "Evidence I belong in the room I'm in.", tags: ["legitimacy"], interpretation: "Grip-as-credential." },
      { label: "Identity is the work", text: "Identity that fuses with the work itself.", tags: ["work-identity"], interpretation: "Grip-as-self-equals-output." },
      { label: "Stopping looks like falling", text: "Avoiding the pause that would feel like falling behind.", tags: ["momentum-fear"], interpretation: "Grip = motion-as-defense." },
    ],
    releaseCondition: [
      { label: "Recognition when idle", text: "Recognition that lands when I've stopped chasing it.", tags: ["unearned-recognition"], interpretation: "Release through non-pursuit." },
      { label: "Approval from someone i've stopped needing", text: "Approval from someone whose approval I've stopped requiring.", tags: ["approval-graduation"], interpretation: "Release through outgrowing the audience." },
      { label: "Worth named idle", text: "Worth named when I'm idle, not productive.", tags: ["non-productive-worth"], interpretation: "Release through being-not-doing." },
      { label: "Peers as peers", text: "Peers who treat me as a peer regardless of my output.", tags: ["unconditional-peerage"], interpretation: "Release through unranked belonging." },
      { label: "Slow week, seen", text: "Being seen as worth on a slow week.", tags: ["seen-idle"], interpretation: "Release through visibility-without-output." },
      { label: "Praise that doesn't catch", text: "Praise that doesn't catch on me — i can hear it without needing more.", tags: ["receiving-praise"], interpretation: "Release through ungrasped affirmation." },
      { label: "Pause without falling", text: "A pause that doesn't feel like falling behind.", tags: ["pause-tolerance"], interpretation: "Release through rest-as-rest." },
      { label: "Failure that survives", text: "A failure where my standing survives.", tags: ["mistake-tolerance"], interpretation: "Release through fail-safe standing." },
    ],
    aimReplacement: [
      { label: "Includes maintenance", text: "Worth that includes the maintenance work, not just the peaks.", tags: ["sustained", "aim"], interpretation: "Aim = baseline-inclusive worth." },
      { label: "Against past self", text: "Standard set against my own previous version.", tags: ["internal-yardstick", "aim"], interpretation: "Aim = self-referential growth." },
      { label: "Scaled to needed", text: "Achievement scaled to the work that's actually needed.", tags: ["right-size", "aim"], interpretation: "Aim = fit-for-purpose." },
      { label: "Quiet register", text: "Quietness as a register I can occupy without losing standing.", tags: ["rest", "aim"], interpretation: "Aim = stillness is also work." },
      { label: "Sustained over peak", text: "Sustained competence over peak performance.", tags: ["durability", "aim"], interpretation: "Aim = long-arc stamina." },
      { label: "Worth past output", text: "Worth named in domains output can't reach.", tags: ["being", "aim"], interpretation: "Aim = ontological worth." },
      { label: "Cost named", text: "Naming the cost of the wins openly.", tags: ["transparency", "aim"], interpretation: "Aim = pricing-honest." },
      { label: "Building under-name", text: "Building things I won't sign.", tags: ["anonymity", "aim"], interpretation: "Aim = unattributed contribution." },
    ],
  },

  continuity: {
    gripObject: [
      { label: "What's worked before", text: "What's worked before, especially in the lineage that taught me.", tags: ["precedent"], interpretation: "Grip-as-precedent.", boost: ["si", "Stability"] },
      { label: "The familiar shape", text: "The familiar shape under uncertainty.", tags: ["familiar", "continuity"], interpretation: "Grip-as-known-form." },
      { label: "The institution I'd preserve", text: "The institution, relationship, or discipline I'd preserve.", tags: ["preservation"], interpretation: "Grip-as-custodianship." },
      { label: "Their way of doing it", text: "The way it was done by people who taught me.", tags: ["lineage"], interpretation: "Grip-as-honoring-source." },
      { label: "Proven pattern", text: "The pattern that's already proven its keep.", tags: ["proven"], interpretation: "Grip-as-tested-method." },
      { label: "The handoff intact", text: "Handing on what I received without losing it.", tags: ["handoff"], interpretation: "Grip-as-transmission-fidelity." },
      { label: "Avoid the new fad", text: "Avoiding the cost of betting on what hasn't proven itself yet.", tags: ["unproven-aversion"], interpretation: "Grip-as-risk-floor." },
      { label: "Hold the long arc", text: "Holding the long arc together when others would drop it.", tags: ["long-arc"], interpretation: "Grip-as-time-binding." },
    ],
    releaseCondition: [
      { label: "Update that doesn't betray", text: "An update that doesn't betray what came before.", tags: ["faithful-update"], interpretation: "Release through reverent revision." },
      { label: "Small change held", text: "A small change tested and held.", tags: ["incremental"], interpretation: "Release through bounded experiment." },
      { label: "Permission to revise", text: "Permission to revise something I'm faithful to.", tags: ["permission"], interpretation: "Release through authorized change." },
      { label: "Trusted hands", text: "Trusted hands holding what I'd usually carry.", tags: ["delegation", "trust"], interpretation: "Release through co-stewardship." },
      { label: "New doesn't lose old", text: "Evidence the new way doesn't lose the old way's gift.", tags: ["non-erasure"], interpretation: "Release through additive change." },
      { label: "Ancestors would approve", text: "A change that those who taught me would have made themselves.", tags: ["lineage-permission"], interpretation: "Release through imagined consent." },
      { label: "One precedent broken", text: "Breaking one precedent and seeing the world keep working.", tags: ["test-revision"], interpretation: "Release through small-stakes break." },
      { label: "Time for the new to prove", text: "Time for the new pattern to prove itself.", tags: ["patience"], interpretation: "Release through observation-window." },
    ],
    aimReplacement: [
      { label: "Stewardship lets things update", text: "Stewardship that lets things update without losing them.", tags: ["evolving-faith", "aim"], interpretation: "Aim = living-tradition register." },
      { label: "Faith as discipline", text: "Faithfulness as an evolving discipline.", tags: ["dynamic-fidelity", "aim"], interpretation: "Aim = practice over preservation." },
      { label: "Revision as honoring", text: "Continuity that admits revision as honoring.", tags: ["revision-honors", "aim"], interpretation: "Aim = change-as-respect." },
      { label: "Held lightly", text: "Tradition held lightly enough to last.", tags: ["supple-faith", "aim"], interpretation: "Aim = grip-by-not-gripping." },
      { label: "Next chapter same voice", text: "The next chapter named in the same voice as the last.", tags: ["voice-continuity", "aim"], interpretation: "Aim = continuity through voice not form." },
      { label: "Care for past survives change", text: "Care for the past that survives the change.", tags: ["caretaking", "aim"], interpretation: "Aim = memory + motion." },
      { label: "Inheritance with edits", text: "Inheritance handed on with my own honest edits.", tags: ["honest-edit", "aim"], interpretation: "Aim = generative stewardship." },
      { label: "Tradition that breathes", text: "A tradition that breathes — moves with the season.", tags: ["adaptive", "aim"], interpretation: "Aim = living rather than embalmed." },
    ],
  },

  security: {
    gripObject: [
      { label: "Margin against worst", text: "Margin against the worst case.", tags: ["margin", "security"], interpretation: "Grip-as-buffer.", boost: ["Stability"] },
      { label: "Foundations don't fail", text: "Foundations others can't pull out from under me.", tags: ["foundation"], interpretation: "Grip-as-bedrock." },
      { label: "No-surprise plan", text: "Plans with no surprise edges.", tags: ["predictability"], interpretation: "Grip-as-completeness." },
      { label: "Floor under what I love", text: "A floor under the people and things I love.", tags: ["protective-floor"], interpretation: "Grip = floor-for-others.", boost: ["Family"] },
      { label: "Money / structure that holds", text: "Money or structure that doesn't fail when tested.", tags: ["material-security"], interpretation: "Grip-as-resource-buffer." },
      { label: "Not at someone's mercy", text: "Not being at someone else's mercy for what I need.", tags: ["autonomy", "security"], interpretation: "Grip-as-independence." },
      { label: "Knowing where it is", text: "Knowing where every important thing is, today.", tags: ["accounting"], interpretation: "Grip-as-inventory." },
      { label: "Hedge the unknown", text: "Hedging against what I can't predict.", tags: ["hedging"], interpretation: "Grip-as-anti-uncertainty." },
    ],
    releaseCondition: [
      { label: "Safety net named", text: "A safety net I can name and trust by name.", tags: ["named-net"], interpretation: "Release through identifiable backup." },
      { label: "Stakes without losing ground", text: "Stakes I can lose without losing the ground.", tags: ["floor-preserved"], interpretation: "Release through bounded loss." },
      { label: "People who'd catch me", text: "People who'd catch me before I fell.", tags: ["caught-by-others"], interpretation: "Release through trusted hands." },
      { label: "One risk allowed", text: "Margin enough to take one calculated risk.", tags: ["risk-budget"], interpretation: "Release through risk-affordability." },
      { label: "Vigilance can rest", text: "Evidence my security doesn't require constant vigilance.", tags: ["non-vigilant-safety"], interpretation: "Release through trustworthy structure." },
      { label: "Loss survivable", text: "A real loss that I survived intact.", tags: ["proven-resilience"], interpretation: "Release through tested-resilience." },
      { label: "Others share the load", text: "Others sharing the load of keeping things safe.", tags: ["distributed-security"], interpretation: "Release through co-protection." },
      { label: "Enough is enough", text: "A clear sense that what I have is enough.", tags: ["sufficiency"], interpretation: "Release through enoughness." },
    ],
    aimReplacement: [
      { label: "Stewardship over hoarding", text: "Stewardship of resources rather than hoarding them.", tags: ["stewardship", "aim"], interpretation: "Aim = circulation-not-accumulation." },
      { label: "Quiet floor, not fence", text: "Security as a quiet floor, not a fence around the day.", tags: ["floor-not-wall", "aim"], interpretation: "Aim = supportive-not-defensive." },
      { label: "Generosity from margin", text: "Generosity made possible by the margin.", tags: ["generosity", "aim"], interpretation: "Aim = abundance-from-buffer." },
      { label: "Structure that holds without me", text: "Trust that the structure holds without my constant tending.", tags: ["systemic-trust", "aim"], interpretation: "Aim = systemic over personal." },
      { label: "Stability shared", text: "Stability shared with others, not just kept.", tags: ["shared", "aim"], interpretation: "Aim = collective-floor." },
      { label: "Enough as the read", text: "Naming enough as the actual read, not the prelude.", tags: ["enoughness", "aim"], interpretation: "Aim = sufficiency-claimed." },
      { label: "Risk as practice", text: "Calculated risk as part of the practice, not the threat.", tags: ["healthy-risk", "aim"], interpretation: "Aim = risk-integrated." },
      { label: "Safety extended outward", text: "The safety I built extending out beyond my own life.", tags: ["outward-safety", "aim"], interpretation: "Aim = protection-as-gift." },
    ],
  },

  responsibility: {
    gripObject: [
      { label: "What others count on", text: "What others are counting on me to carry.", tags: ["others-counting"], interpretation: "Grip-as-promise.", boost: ["Loyalty", "Family"] },
      { label: "Role no one else takes", text: "The role no one else is taking up.", tags: ["filling-gap"], interpretation: "Grip-as-default-volunteer." },
      { label: "Weight I picked up", text: "The weight I picked up and didn't put down.", tags: ["accumulated-load"], interpretation: "Grip-as-uncleared-debt." },
      { label: "Silent promise", text: "The promise I made silently and won't break.", tags: ["unspoken-vow"], interpretation: "Grip-as-tacit-contract." },
      { label: "Maintenance unseen", text: "The maintenance work no one else sees.", tags: ["invisible-labor"], interpretation: "Grip-as-hidden-stewardship." },
      { label: "Caretaker by default", text: "Becoming the caretaker because someone had to.", tags: ["default-caretaker"], interpretation: "Grip-as-assumed-duty." },
      { label: "Putting them first", text: "Putting them first because no one else will.", tags: ["protective-priority"], interpretation: "Grip-as-prioritization." },
      { label: "Not letting it fall", text: "Not letting the structure fall on my watch.", tags: ["watch-keeping"], interpretation: "Grip-as-watch-duty." },
    ],
    releaseCondition: [
      { label: "Hands take a piece", text: "Hands that take a piece of the load without dropping it.", tags: ["competent-handoff"], interpretation: "Release through proven co-bearer." },
      { label: "Permission to say no", text: "Permission to say no to one obligation without consequence.", tags: ["no-without-cost"], interpretation: "Release through bounded refusal." },
      { label: "Clean handoff", text: "A clean handoff of one thing I've been holding.", tags: ["clean-transfer"], interpretation: "Release through transfer-not-abandonment." },
      { label: "World keeps working", text: "Time off where the world keeps working without me.", tags: ["non-essentialness"], interpretation: "Release through proven dispensability." },
      { label: "Someone else carries a week", text: "Someone else carrying my weight for a week.", tags: ["substitution"], interpretation: "Release through felt-relief." },
      { label: "Permission from the source", text: "Permission from the person I'm carrying for.", tags: ["original-permission"], interpretation: "Release through source-authorized rest." },
      { label: "Asked, not assumed", text: "Being asked to carry it, not assuming I should.", tags: ["asked"], interpretation: "Release through explicit-invitation." },
      { label: "Care for me named", text: "Someone naming care for me as part of the system.", tags: ["self-included"], interpretation: "Release through being-cared-for." },
    ],
    aimReplacement: [
      { label: "Shared, not solo", text: "Responsibility shared, not held solo.", tags: ["shared-duty", "aim"], interpretation: "Aim = distributed care." },
      { label: "No as discipline", text: "The discipline of saying no as part of the duty.", tags: ["bounded-yes", "aim"], interpretation: "Aim = saying-no-is-care." },
      { label: "Self-maintenance included", text: "Maintenance that includes self-maintenance.", tags: ["self-care", "aim"], interpretation: "Aim = self-inclusive duty." },
      { label: "Relay, not solo race", text: "Stewardship as a relay, not a solo race.", tags: ["relay", "aim"], interpretation: "Aim = succession-thinking." },
      { label: "Care delegated", text: "Care delegated without being abandoned.", tags: ["delegated-not-abandoned", "aim"], interpretation: "Aim = trust the next hands." },
      { label: "Chosen, not conscripted", text: "The weight as something I choose, not something I'm conscripted to.", tags: ["chosen", "aim"], interpretation: "Aim = volitional service." },
      { label: "Receiving in the cycle", text: "Receiving care as part of the cycle of giving it.", tags: ["receiving-too", "aim"], interpretation: "Aim = mutuality." },
      { label: "Discharge complete", text: "Being able to mark a duty discharged and walk forward.", tags: ["completion", "aim"], interpretation: "Aim = finite duty." },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────
// Swap probes — compression_check and trait_vs_weather. Each has its
// own question stem + a fixed option pool that folds the
// release_condition intent into its options (per CC-125 task E).
// ─────────────────────────────────────────────────────────────────────

// CC-125 — swap pools. The first option in each pool carries the
// folded release intent so it always lands in the top-N picked by
// `rankAndPick`. Per CC-125 task E, when a swap probe replaces the
// Slot-2 release_condition slot, the release intent must be present
// in the options (not dropped).
const COMPRESSION_CHECK_OPTIONS: SeedOption[] = [
  { label: "What would restore", text: "What would restore me first: one signal that the stakes are over.", tags: ["release-signal", "restore", "compression"], interpretation: "Folded release: stakes-end signal." },
  { label: "Voice / pace", text: "My voice and pace tighten — i speak faster and shorter.", tags: ["voice-tighten", "compression"], interpretation: "Compression shows as register-shift." },
  { label: "What I notice", text: "What I notice narrows — I see only the threat, not the room.", tags: ["attention-narrow", "compression"], interpretation: "Compression shows as perceptual-narrowing." },
  { label: "Body", text: "My body holds — shoulders, jaw, breath.", tags: ["somatic", "compression"], interpretation: "Compression shows as held-tension." },
  { label: "Trust", text: "I stop trusting other people's read of the situation.", tags: ["trust-narrowing", "compression"], interpretation: "Compression shows as control-takeover." },
  { label: "Time", text: "Time shrinks — I act on the next 60 seconds, not the next month.", tags: ["short-horizon", "compression"], interpretation: "Compression shows as horizon-collapse." },
  { label: "Listening", text: "I stop listening for what's true and listen for what's threatening.", tags: ["threat-listening", "compression"], interpretation: "Compression shows as defensive-attending." },
  { label: "Who I become", text: "I become someone slightly different — more directive, less curious.", tags: ["self-shift", "compression"], interpretation: "Compression shows as character-shift." },
];

const TRAIT_VS_WEATHER_OPTIONS: SeedOption[] = [
  { label: "What would soften it", text: "What would soften it: one season where nothing is at stake.", tags: ["release-condition", "softening"], interpretation: "Folded release: low-stakes interval." },
  { label: "Always been this way", text: "This has been my shape since before I can remember.", tags: ["trait", "lifetime"], interpretation: "Trait read." },
  { label: "Last few years", text: "This sharpened in the last few years — a season, not the bones.", tags: ["weather", "recent"], interpretation: "Weather read." },
  { label: "Since the load", text: "Since the load came on — the specific event or arc — it's been like this.", tags: ["weather", "load-onset"], interpretation: "Weather read tied to onset." },
  { label: "Always like this under stress", text: "Always like this under stress, otherwise different.", tags: ["stress-pattern", "trait-conditional"], interpretation: "Trait-under-load." },
  { label: "Became normal", text: "It became normal so gradually I stopped noticing.", tags: ["normalized", "weather"], interpretation: "Slow normalization." },
  { label: "Inherited", text: "I learned this from someone I lived with.", tags: ["inherited", "trait-lineage"], interpretation: "Inherited register." },
  { label: "Choice that hardened", text: "A choice I made once that hardened into how I do everything.", tags: ["chosen-hardened"], interpretation: "Choice-to-trait drift." },
];

// ─────────────────────────────────────────────────────────────────────
// Adapter — buildFollowUpInput(constitution, answers)
// ─────────────────────────────────────────────────────────────────────

/**
 * Map an engine `InnerConstitution` (+ the raw answers; needed for
 * state-load + currentMode which the constitution doesn't carry) to a
 * `FollowUpInput`. Returns a deterministic, normalized projection.
 */
export function buildFollowUpInput(
  constitution: InnerConstitution,
  answers: Answer[],
  personName: string = "You"
): FollowUpInput {
  const ls = constitution.lens_stack;
  const dash = constitution.goalSoulMovement?.dashboard;
  const lim = dash?.movementLimiter;
  const grip = constitution.gripReading;
  const defensive = grip?.components.defensiveGrip ?? 0;
  const score = grip?.score ?? 0;
  const stateLoad = computeStateLoad(answers);
  const load: "low" | "moderate" | "high" =
    stateLoad.composite >= 0.55
      ? "high"
      : stateLoad.composite >= 0.3
      ? "moderate"
      : "low";

  // CC-134 Part D §D.1 — when Lens confidence is low (post-Part C
  // top-pick + N/S valence guard), pull the per-pool top-pick leaders
  // so the generator can build an N-vs-S head-to-head clarifier. The
  // leaders are the function with the most rank-1 picks in each sub-
  // axis (Ni/Ne for N; Si/Se for S). Ties resolve alphabetically by
  // function id to keep the resolver deterministic.
  let nsLeaderN: CognitiveFunctionId | undefined;
  let nsLeaderS: CognitiveFunctionId | undefined;
  let nsHeadToHeadTrigger: "low_confidence" | "ns_split_suspect" | undefined;
  if (ls?.confidence === "low") {
    const nCandidates: CognitiveFunctionId[] = ["ni", "ne"];
    const sCandidates: CognitiveFunctionId[] = ["si", "se"];
    const pickLeader = (
      pool: CognitiveFunctionId[]
    ): CognitiveFunctionId | undefined => {
      const ranked = pool
        .map((fn) => ({ fn, topPicks: topPickCountFor(constitution.signals, fn) }))
        .sort((a, b) => b.topPicks - a.topPicks || a.fn.localeCompare(b.fn));
      if (ranked[0].topPicks === 0) return undefined;
      return ranked[0].fn;
    };
    nsLeaderN = pickLeader(nCandidates);
    nsLeaderS = pickLeader(sCandidates);
    if (nsLeaderN && nsLeaderS) {
      const nTop = topPickCountFor(constitution.signals, nsLeaderN);
      const sTop = topPickCountFor(constitution.signals, nsLeaderS);
      nsHeadToHeadTrigger =
        Math.abs(nTop - sTop) < TOP_PICK_CONVERGENCE_MARGIN
          ? "ns_split_suspect"
          : "low_confidence";
    }
  }

  // CC-134.1 §Task 3 — judging-axis head-to-head detection. When both
  // members of an impossible same-attitude judging pair carry meaningful
  // top-picks (≥ JUDGING_COOCCURRENCE_THRESHOLD each), surface a
  // clarifier so the user explicitly picks one. The §C.6 guard already
  // flipped confidence to `low` for this case in jungianStack; this
  // pulls the leaders forward for the clarifier builder.
  let judgingHeadToHeadA: CognitiveFunctionId | undefined;
  let judgingHeadToHeadB: CognitiveFunctionId | undefined;
  let judgingHeadToHeadTrigger:
    | "ti_fi_cooccurrence"
    | "te_fe_cooccurrence"
    | undefined;
  if (ls?.confidence === "low") {
    const tiTop = topPickCountFor(constitution.signals, "ti");
    const fiTop = topPickCountFor(constitution.signals, "fi");
    const teTop = topPickCountFor(constitution.signals, "te");
    const feTop = topPickCountFor(constitution.signals, "fe");
    if (
      tiTop >= JUDGING_COOCCURRENCE_THRESHOLD &&
      fiTop >= JUDGING_COOCCURRENCE_THRESHOLD
    ) {
      judgingHeadToHeadA = "ti";
      judgingHeadToHeadB = "fi";
      judgingHeadToHeadTrigger = "ti_fi_cooccurrence";
    } else if (
      teTop >= JUDGING_COOCCURRENCE_THRESHOLD &&
      feTop >= JUDGING_COOCCURRENCE_THRESHOLD
    ) {
      judgingHeadToHeadA = "te";
      judgingHeadToHeadB = "fe";
      judgingHeadToHeadTrigger = "te_fe_cooccurrence";
    }
  }

  // CC-134 Part D §D.2 — blind-spots-to-confirm. The CC's principle:
  // if a large-gap blind spot is detected AND its input was untouched
  // or low-confidence, surface a confirm clarifier instead of
  // asserting hypocrisy. Without per-question touched flags on
  // historical sessions, the proxy here is: a `large_gap` blind spot
  // is enough to warrant a confirm clarifier (the gap is by
  // definition large enough that the user should be asked rather than
  // told). Capped to 2 to respect the second-pass budget.
  const blindspotsToConfirm: NonNullable<FollowUpInput["blindspotsToConfirm"]> = [];
  for (const b of constitution.blindSpots ?? []) {
    if (b.magnitude !== "large_gap") continue;
    if (blindspotsToConfirm.length >= 2) break;
    blindspotsToConfirm.push({
      valueLabel: b.compass_label,
      weekReadsAs: firstSentenceOf(b.prose) ?? "your week reads differently",
    });
  }

  return {
    personName,
    lens: {
      typeLabel: ls?.mbtiCode,
      dom: ls?.dominant,
      aux: ls?.auxiliary,
      // `LensStack.confidence` is only "high" | "low" on the type; map
      // through unchanged. The FollowUpInput type accepts "medium" for
      // fixture flexibility but the adapter never emits it.
      confidence: ls?.confidence,
      nsLeaderN,
      nsLeaderS,
      nsHeadToHeadTrigger,
      judgingHeadToHeadA,
      judgingHeadToHeadB,
      judgingHeadToHeadTrigger,
    },
    blindspotsToConfirm: blindspotsToConfirm.length > 0 ? blindspotsToConfirm : undefined,
    movement: {
      goal: dash?.goalScore ?? 0,
      soul: dash?.soulScore ?? 0,
      directionDegrees: dash?.direction?.angle ?? 0,
      usableMovement: lim?.usableMovement ?? 0,
      potentialMovement: lim?.potentialMovement ?? 0,
      dragPercent: lim?.dragPercent ?? 0,
      aim: constitution.aimReading?.score ?? 0,
      grip: defensive,
      gripWithStakes: score,
      gripDelta: score - defensive,
      amplifier: grip?.components.amplifier,
      riskForm: constitution.riskForm?.legacyLetter ?? "",
    },
    weather: {
      load,
      stateCaveat: load === "high",
    },
    gripPattern: {
      primary: derivePrimaryFamily(constitution),
      secondary: undefined,
      stakesTriggers: constitution.gripTaxonomy?.contributingGrips,
    },
    reportSignals: {
      topValues: constitution.sacred_values,
      currentMode: deriveCurrentMode(answers),
    },
  };
}

/**
 * Derive the FollowUpFamily key from `gripPattern.bucket` × `gripTaxonomy.subRegister`
 * (+ Si-dominance override) per CC-125 task B. Returns the family string
 * (undefined when neither bucket nor Si-override applies).
 */
function derivePrimaryFamily(c: InnerConstitution): FollowUpFamily | undefined {
  // Si-dominance overrides toward continuity.
  if (c.lens_stack?.dominant === "si") return "continuity";

  const bucket = c.gripPattern?.bucket;
  const sub = c.gripTaxonomy?.subRegister;
  switch (bucket) {
    case "worth":
      return sub === "mastery" ? "control_mastery" : "worth_achievement";
    case "belonging":
      return sub === "relational"
        ? "belonging_usefulness"
        : sub === "stewardship"
        ? "responsibility"
        : "belonging_usefulness";
    case "security":
    case "safety":
      return "security";
    case "control":
      return "control_mastery";
    case "recognition":
      return "worth_achievement";
    case "purpose":
      return "responsibility";
    case "unmapped":
    case undefined:
    default:
      return undefined;
  }
}

function deriveCurrentMode(answers: Answer[]): string | undefined {
  const a = answers.find((x) => x.question_id === "Q-A1");
  if (!a) return undefined;
  if (a.type === "forced" || a.type === "freeform") {
    const r = (a as { response?: string }).response ?? "";
    if (/build|creat|making/i.test(r)) return "building";
    if (/maintain/i.test(r)) return "maintaining";
    if (/react/i.test(r)) return "reacting";
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────
// Generator
// ─────────────────────────────────────────────────────────────────────

function familyOrDefault(f: string | undefined): FollowUpFamily {
  if (f && (ALL_FAMILIES as string[]).includes(f)) return f as FollowUpFamily;
  // Default fallback when grip is unmapped. Choose the family most likely
  // to produce a useful question (worth_achievement reads cleanly against
  // most shapes — output-oriented but not exclusively so).
  return "worth_achievement";
}

function buildBoostPool(input: FollowUpInput): Set<string> {
  const pool: string[] = [];
  for (const v of input.reportSignals?.topValues ?? []) pool.push(v);
  for (const t of input.gripPattern?.stakesTriggers ?? []) pool.push(t);
  if (input.lens?.dom) pool.push(input.lens.dom);
  if (input.lens?.aux) pool.push(input.lens.aux);
  if (input.reportSignals?.currentMode) pool.push(input.reportSignals.currentMode);
  return new Set(pool);
}

/**
 * Stable filter: rank options by boost-count (descending), then by their
 * authored index (ascending). Pick the first 6.
 */
function rankAndPick(pool: SeedOption[], boostPool: Set<string>, n = 6): FollowUpOption[] {
  const ranked = pool
    .map((opt, idx) => {
      const boosts = (opt.boost ?? []).filter((b) => boostPool.has(b)).length;
      return { opt, idx, boosts };
    })
    .sort((a, b) => (b.boosts - a.boosts) || (a.idx - b.idx))
    .slice(0, n)
    .map(({ opt }) => ({
      label: opt.label,
      text: opt.text,
      tags: opt.tags,
      interpretation: opt.interpretation,
    }));
  return ranked;
}

const GRIP_OBJECT_STEM: Record<FollowUpFamily, string> = {
  control_mastery: "When you imagine the work being out of your hands — handed off, finished by someone else, beyond your reach to revise — which of these feels most like what you're protecting?",
  belonging_usefulness: "When you imagine being present to the people you love without doing anything for them — which of these feels most like what your usefulness is protecting?",
  worth_achievement: "When you imagine a season with no visible win, no public ledger, no new title — which of these feels most like what the achievement is protecting?",
  continuity: "When you imagine the lineage you carry being updated or revised — which of these feels most like what your faithfulness is protecting?",
  security: "When you imagine the floor you've built being unnecessary — surplus, untested, just there — which of these feels most like what the security is protecting?",
  responsibility: "When you imagine someone else carrying the weight you've been holding — clean, no drop — which of these feels most like what your taking-it-on is protecting?",
};

const RELEASE_CONDITION_STEM: Record<FollowUpFamily, string> = {
  control_mastery: "What would actually make it feel safe to loosen your grip on the work?",
  belonging_usefulness: "What would actually make it feel safe to stop arranging your usefulness so carefully?",
  worth_achievement: "What would actually make it feel safe to slow the next achievement down?",
  continuity: "What would actually make it feel safe to revise something you've been faithful to?",
  security: "What would actually make it feel safe to spend down some of the margin you've stored?",
  responsibility: "What would actually make it feel safe to set down a piece of what you've been carrying?",
};

const AIM_REPLACEMENT_STEM: Record<FollowUpFamily, string> = {
  control_mastery: "If the Grip on mastery softened, what could the same instrument be aimed at instead?",
  belonging_usefulness: "If the Grip on being-useful softened, what could the same instrument be aimed at instead?",
  worth_achievement: "If the Grip on the next win softened, what could the same instrument be aimed at instead?",
  continuity: "If the Grip on continuity softened, what could the same instrument be aimed at instead?",
  security: "If the Grip on the margin softened, what could the same instrument be aimed at instead?",
  responsibility: "If the Grip on what-others-need softened, what could the same instrument be aimed at instead?",
};

const COMPRESSION_CHECK_STEM =
  "When stakes rise — when something matters and the outcome is in question — what's the first thing that changes about you?";

const TRAIT_VS_WEATHER_STEM =
  "Looking at the way you've been moving recently — the grip, the load, the watchfulness — when did this become the normal shape of things?";

/**
 * Decision tree — which Slot-2 probe fits, and what reason we give.
 */
function selectSlot2(
  input: FollowUpInput,
  family: FollowUpFamily
): {
  purpose: FollowUpPurpose;
  reason: string;
} {
  const conf = input.lens?.confidence;
  const load = input.weather.load;
  const grip = input.movement.grip;
  const delta = input.movement.gripDelta;

  // 1. low confidence × high load × meaningful delta → compression_check
  if (conf === "low" && load === "high" && delta >= 10) {
    return {
      purpose: "compression_check",
      reason:
        "Low Lens confidence under high load with a meaningful stakes-amplifier — the read may be showing compression rather than shape; probe what changes first under pressure.",
    };
  }
  // 2. high baseline grip + low delta → trait_vs_weather
  if (grip >= 65 && delta <= 5) {
    return {
      purpose: "trait_vs_weather",
      reason:
        "Grip is high at baseline (low stakes-amplifier delta) — the question is whether this is a long-running shape or a recent compression that became normal.",
    };
  }
  // 3. low-baseline grip + high delta → stakes-reactive release_condition
  if (grip < 65 && delta >= 10) {
    return {
      purpose: "release_condition",
      reason:
        "Grip activates under stakes (low baseline + meaningful amplifier delta) — the release-condition probe asks what would make stakes feel survivable.",
    };
  }
  // 4. high load + low delta + low confidence → burden/restoration release_condition
  if (load === "high" && delta < 7 && conf === "low") {
    return {
      purpose: "release_condition",
      reason:
        "High load with little stakes-reactivity and low Lens confidence — the burden looks like state, not trait; probe what would actually restore.",
    };
  }
  // Default: standard release_condition keyed to family
  return {
    purpose: "release_condition",
    reason: `Standard release-condition probe keyed to the ${family.replace(
      "_",
      "/"
    )} family — explores what would make loosening the grip feel safe.`,
  };
}

/**
 * Main generator. Same input → identical output (deterministic).
 */
export function generateFollowUpQuestions(input: FollowUpInput): FollowUpQuestionSet {
  const family = familyOrDefault(input.gripPattern?.primary);
  const boostPool = buildBoostPool(input);
  const bank = FAMILY_SEED_BANKS[family];

  const slot1: FollowUpQuestion = {
    id: "fq1_grip_object",
    purpose: "grip_object",
    question: GRIP_OBJECT_STEM[family],
    responseMode: "rank_top_3",
    options: rankAndPick(bank.gripObject, boostPool, 6),
  };

  const { purpose: slot2Purpose, reason } = selectSlot2(input, family);
  let slot2: FollowUpQuestion;
  if (slot2Purpose === "compression_check") {
    slot2 = {
      id: "fq2_compression_check",
      purpose: "compression_check",
      question: COMPRESSION_CHECK_STEM,
      responseMode: "rank_top_2",
      options: rankAndPick(COMPRESSION_CHECK_OPTIONS, boostPool, 6),
    };
  } else if (slot2Purpose === "trait_vs_weather") {
    slot2 = {
      id: "fq2_trait_vs_weather",
      purpose: "trait_vs_weather",
      question: TRAIT_VS_WEATHER_STEM,
      responseMode: "choose_one",
      options: rankAndPick(TRAIT_VS_WEATHER_OPTIONS, boostPool, 6),
    };
  } else {
    slot2 = {
      id: "fq2_release_condition",
      purpose: "release_condition",
      question: RELEASE_CONDITION_STEM[family],
      responseMode: "rank_top_2",
      options: rankAndPick(bank.releaseCondition, boostPool, 6),
    };
  }

  const slot3: FollowUpQuestion = {
    id: "fq3_aim_replacement",
    purpose: "aim_replacement",
    question: AIM_REPLACEMENT_STEM[family],
    responseMode: "rank_top_3",
    options: rankAndPick(bank.aimReplacement, boostPool, 6),
  };

  // CC-134 Part D §D.1 — append a head-to-head `type_clarity`
  // clarifier when Lens confidence is low AND we have an N-vs-S
  // top-pick pair to compare. The clarifier pits the two leading
  // voices head-to-head so the perceiving dominant resolves by
  // explicit pick rather than warm-N-vs-blunt-S item valence noise.
  // Always second-pass-capped (single extra question).
  const extras: FollowUpQuestion[] = [];
  if (input.lens?.nsLeaderN && input.lens?.nsLeaderS) {
    extras.push(
      buildTypeClarityHeadToHead(input.lens.nsLeaderN, input.lens.nsLeaderS)
    );
  }

  // CC-134.1 §Task 3 — judging-axis head-to-head. Fires when the
  // jungianStack co-occurrence guard detected Ti+Fi or Te+Fe both
  // exceeding the threshold. The clarifier pits the two head-to-head
  // (deliberately equal warmth) so the judging dominant resolves by
  // explicit pick.
  if (input.lens?.judgingHeadToHeadA && input.lens?.judgingHeadToHeadB) {
    extras.push(
      buildJudgingClarityHeadToHead(
        input.lens.judgingHeadToHeadA,
        input.lens.judgingHeadToHeadB
      )
    );
  }

  // CC-134 Part D §D.2 — append `blindspot_confirm` clarifiers for
  // any large-gap blind spots whose input is suspect (current proxy:
  // the gap was large enough to mark `large_gap`). Each clarifier
  // converts an assertion ("Honor is a blind spot") into a confirm
  // question ("you named Honor highest; your week reads … — which is
  // truer right now?"). Capped at 2 in buildFollowUpInput already.
  if (input.blindspotsToConfirm) {
    for (const b of input.blindspotsToConfirm) {
      extras.push(buildBlindspotConfirm(b));
    }
  }

  // Hard invariant — if Slot 2 swapped away from release_condition, the
  // swap-probe options carry a folded release intent (see swap pools).
  // We still attest the three core purposes are covered: grip_object via
  // Slot 1, aim_replacement via Slot 3, release_condition via either
  // Slot 2 release-options OR the folded release-signal option present
  // in the compression_check / trait_vs_weather pools.
  return {
    personName: input.personName,
    selectedFamilies: [family],
    reasonForQuestions: reason,
    questions: [slot1, slot2, slot3, ...extras],
  };
}

// ─────────────────────────────────────────────────────────────────────
// CC-134 Part D — clarifier builders
// ─────────────────────────────────────────────────────────────────────

const PERCEIVING_VOICE: Record<CognitiveFunctionId, { framing: string; texture: string }> = {
  ni: { framing: "the long arc lands first", texture: "I notice patterns forming before they finish — the trajectory is what I read first, even when the data is incomplete." },
  ne: { framing: "possibilities branch first", texture: "I see the openings before they're named — a single input fans out into adjacent ideas I want to chase." },
  si: { framing: "the precedent lands first", texture: "I notice what's different from how it has gone before — the felt continuity is the anchor, and any deviation registers immediately." },
  se: { framing: "what's right here lands first", texture: "I notice what's actually in the room — the texture, the tempo, the move available now. The present is more vivid than the projection." },
  // Judging functions included to keep the record exhaustive; never
  // emitted by the N/S head-to-head clarifier.
  ti: { framing: "the logic lands first", texture: "I work out whether the pieces hold together internally before I commit." },
  te: { framing: "the structure lands first", texture: "I look for the most efficient ordering and run the plan." },
  fi: { framing: "the value lands first", texture: "I check whether this aligns with what I most deeply care about." },
  fe: { framing: "the room lands first", texture: "I read what the people present need and respond to it." },
};

function buildTypeClarityHeadToHead(
  nLeader: CognitiveFunctionId,
  sLeader: CognitiveFunctionId
): FollowUpQuestion {
  const nVoice = PERCEIVING_VOICE[nLeader];
  const sVoice = PERCEIVING_VOICE[sLeader];
  return {
    id: "fq4_type_clarity_ns",
    purpose: "type_clarity",
    question:
      "On a Tuesday afternoon, the first read you make of a situation lands more like which of these?",
    responseMode: "choose_one",
    options: [
      {
        label: nLeader.toUpperCase(),
        text: `${nVoice.framing} — ${nVoice.texture}`,
        tags: [nLeader, "perceiving", "type_clarity"],
        interpretation: `Confirms ${nLeader.toUpperCase()}-led perceiving (intuitive).`,
      },
      {
        label: sLeader.toUpperCase(),
        text: `${sVoice.framing} — ${sVoice.texture}`,
        tags: [sLeader, "perceiving", "type_clarity"],
        interpretation: `Confirms ${sLeader.toUpperCase()}-led perceiving (sensing). Note: written with equal warmth to the N option per the §C.6 valence guard — so the pick is the choice, not the temperature.`,
      },
    ],
  };
}

/**
 * CC-134.1 §Task 3 — judging-axis head-to-head clarifier. Mirrors
 * `buildTypeClarityHeadToHead` for the Ti vs Fi (or Te vs Fe)
 * disambiguation. Same equal-warmth principle as §C.6: the framings
 * are written with parallel affect so the pick reflects which
 * judgment-process actually leads — not which option reads warmer.
 */
function buildJudgingClarityHeadToHead(
  aLeader: CognitiveFunctionId,
  bLeader: CognitiveFunctionId
): FollowUpQuestion {
  const aVoice = PERCEIVING_VOICE[aLeader];
  const bVoice = PERCEIVING_VOICE[bLeader];
  return {
    id: "fq5_type_clarity_judging",
    purpose: "type_clarity",
    question:
      "When you have to make a hard call, which of these is closer to how the decision actually settles inside you?",
    responseMode: "choose_one",
    options: [
      {
        label: aLeader.toUpperCase(),
        text: `${aVoice.framing} — ${aVoice.texture}`,
        tags: [aLeader, "judging", "type_clarity"],
        interpretation: `Confirms ${aLeader.toUpperCase()}-led judging.`,
      },
      {
        label: bLeader.toUpperCase(),
        text: `${bVoice.framing} — ${bVoice.texture}`,
        tags: [bLeader, "judging", "type_clarity"],
        interpretation: `Confirms ${bLeader.toUpperCase()}-led judging. (CC-134.1 §Task 3: pair surfaced because both ${aLeader.toUpperCase()} & ${bLeader.toUpperCase()} accumulated significant top-picks — a canonical stack cannot hold both, so this pick resolves the contamination.)`,
      },
    ],
  };
}

function buildBlindspotConfirm(b: {
  valueLabel: string;
  weekReadsAs: string;
}): FollowUpQuestion {
  return {
    id: `fq_blindspot_confirm_${b.valueLabel.toLowerCase().replace(/\s+/g, "_")}`,
    purpose: "type_clarity",
    question: `You named ${b.valueLabel} highest, but your week reads as protecting ${b.weekReadsAs} — which is truer right now?`,
    responseMode: "choose_one",
    options: [
      {
        label: "Named version is truer",
        text: `${b.valueLabel} really is what I'd protect when it counts — my week just hasn't caught up to it yet.`,
        tags: ["blindspot_confirm", "named_truer"],
        interpretation:
          "User confirms the stated value; the gap is execution drag, not a hidden priority.",
      },
      {
        label: "Week reading is truer",
        text: `Honestly, what my week reads as ranks higher in practice — I named ${b.valueLabel} because it sounded right, not because it's what I actually protect.`,
        tags: ["blindspot_confirm", "week_truer"],
        interpretation:
          "User confirms the gap; the named value was aspirational. Treat as a re-ranking signal, not a hypocrisy assertion.",
      },
      {
        label: "Both are partially true",
        text: `Both are true in different contexts — I protect ${b.valueLabel} in one register and the other thing in another.`,
        tags: ["blindspot_confirm", "context_dependent"],
        interpretation:
          "User reports a context-dependent split; the engine should NOT collapse this into a single hypocrisy.",
      },
    ],
  };
}

/** Helper — first sentence of a string, used by buildFollowUpInput to
 *  trim blind-spot prose into a one-line clarifier hook. */
function firstSentenceOf(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const idx = s.search(/[.!?](\s|$)/);
  return idx < 0 ? s.trim() : s.slice(0, idx + 1).trim();
}
