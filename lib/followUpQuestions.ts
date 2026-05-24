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
//
// CC-149 — plain-language rubric for option `text` (the sentence
// rendered as the visible option per `FollowUpBlock`'s mapping in
// `app/follow-up/[token]/page.tsx`). The eight `control_mastery`
// `aimReplacement` texts below were owner-rewritten and define the
// target register; CC-150 will apply the same rubric to the remaining
// ~40 aim options and the `gripObject` / `releaseCondition` banks
// across families.
//
// Rubric:
//   - Say what the person would actually DO or EXPERIENCE, concretely.
//   - No insider nouns the report hasn't defined for a cold reader
//     ("recoveries", "stewardship-as-register", "instrument",
//     "downstream enablement"). The sentence must stand alone without
//     the `label`.
//   - Second person where natural; a single plain sentence; no
//     nominalization that needs unpacking.
//   - `label`, `tags`, `interpretation`, and `boost` remain the
//     internal write-back contract — only `text` is the cold-reader
//     surface and must follow this rubric.
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
      { label: "Mastery", text: "Knowing the work well enough that nothing about it can catch you off guard.", tags: ["mastery", "control"], interpretation: "Grip-as-skill-sovereignty.", boost: ["Knowledge", "ti"] },
      { label: "Authorship", text: "Getting outcomes you can clearly point to as your own doing.", tags: ["authorship", "control"], interpretation: "Grip-as-attribution.", boost: ["Honor"] },
      { label: "Inner certainty", text: "Being completely sure inside before you say anything out loud.", tags: ["certainty", "control"], interpretation: "Grip on knowing-before-saying." },
      { label: "Standing scrutiny", text: "Knowing the work would hold up if anyone looked closely.", tags: ["standing", "control"], interpretation: "Grip-as-defensible-outcome." },
      { label: "Avoiding misread", text: "Not being read as someone who doesn't know what they're doing.", tags: ["competence", "fear-misread"], interpretation: "Grip = avoiding the perceptual cost." },
      { label: "Model holding", text: "Seeing your plan hold up when things go wrong.", tags: ["model", "control"], interpretation: "Grip-as-framework-validation.", boost: ["ni", "ti"] },
      { label: "No surprises", text: "Knowing the material so well that no question can catch you flat-footed.", tags: ["preparedness", "control"], interpretation: "Grip-as-anticipation." },
      { label: "Quiet competence", text: "Being the person other people quietly defer to without having to ask.", tags: ["recognized-competence"], interpretation: "Grip-as-implicit-authority." },
    ],
    releaseCondition: [
      { label: "Competent hands", text: "Seeing other capable people handle the same kind of work well.", tags: ["delegation", "release"], interpretation: "Release through visible peer-competence." },
      { label: "Recoveries logged", text: "Having a history of being wrong and recovering, with no real damage done.", tags: ["iteration", "release"], interpretation: "Release through reversibility." },
      { label: "Low-stakes public", text: "Stakes low enough that you can learn out in the open without anything being lost.", tags: ["low-stakes", "release"], interpretation: "Release through cost-bounded exposure." },
      { label: "Sharper peer", text: "A peer doing the thing you care about better than you, and being okay with that.", tags: ["peer-sharpening"], interpretation: "Release through being shown up gracefully." },
      { label: "Public miss", text: "Missing something in front of people and finding your standing still intact.", tags: ["mistake-test", "release"], interpretation: "Release through standing surviving error." },
      { label: "Time to iterate", text: "Having time to revise without it being read as not making up your mind.", tags: ["iteration"], interpretation: "Release through pace-tolerance." },
      { label: "Held by structure", text: "Working inside a system that catches your mistakes before anyone else sees them.", tags: ["structure", "release"], interpretation: "Release through scaffolding." },
      { label: "Trust the inputs", text: "Trusting work you didn't do yourself.", tags: ["delegation"], interpretation: "Release through letting go of attribution." },
    ],
    aimReplacement: [
      // CC-149 — `text` rewritten to the owner-locked plain-language
      // wording (see rubric above). `label` / `tags` /
      // `interpretation` unchanged — `label` remains the write-back
      // key the POST handler matches on.
      { label: "Ships under feedback", text: "Putting work out before it's perfect and improving it from real feedback.", tags: ["shipping", "aim"], interpretation: "Aim = pace + responsiveness." },
      { label: "Public iteration", text: "Improving the work in the open, where people can watch it evolve.", tags: ["iteration", "aim"], interpretation: "Aim names the loop." },
      { label: "Mastery as service", text: "Measuring your skill by what it lets other people do — not by how good you are.", tags: ["service", "aim"], interpretation: "Aim = downstream enablement." },
      { label: "Next revision", text: "Aiming for the next good version instead of one final, perfect answer.", tags: ["revision", "aim"], interpretation: "Aim = an evolving series." },
      { label: "Held lightly", text: "Holding your skill loosely, because there's always a next version.", tags: ["humility", "aim"], interpretation: "Aim = succession-aware competence." },
      { label: "Recoveries on record", text: "Being open about your mistakes and how you fixed them, instead of hiding them.", tags: ["transparency", "aim"], interpretation: "Aim = mistakes-as-data." },
      { label: "Stewardship of craft", text: "Tending a craft you'll hand down to someone after you.", tags: ["inheritance", "aim"], interpretation: "Aim = pass-it-on register." },
      { label: "Curiosity over certainty", text: "Letting curiosity matter more than being certain.", tags: ["curiosity", "aim"], interpretation: "Aim shifts from defense to inquiry." },
    ],
  },

  belonging_usefulness: {
    gripObject: [
      { label: "Being the one who arrives", text: "Being the person who always shows up when someone needs you.", tags: ["presence", "usefulness"], interpretation: "Grip-as-show-up.", boost: ["Family", "Loyalty", "fe"] },
      { label: "Useful role", text: "Being the useful one in the lives of the people you love.", tags: ["role", "usefulness"], interpretation: "Grip-as-function." },
      { label: "Continuity", text: "Being someone people can count on even on days you're worn out.", tags: ["continuity", "belonging"], interpretation: "Grip-as-reliability." },
      { label: "Reading the room", text: "Knowing what each person needs before they have to ask.", tags: ["attunement"], interpretation: "Grip-as-anticipatory-care.", boost: ["fe"] },
      { label: "Kept in", text: "Earning your place in the group through the work you do for it.", tags: ["earning-belonging"], interpretation: "Grip = belonging-as-currency." },
      { label: "What I make possible", text: "What you make possible for the people you love.", tags: ["enablement"], interpretation: "Grip-as-downstream-care." },
      { label: "Not being a burden", text: "Never being the one who has needs of your own.", tags: ["self-erasure"], interpretation: "Grip = care-without-receiving." },
      { label: "Being needed", text: "Being needed by the people you'd do anything for.", tags: ["being-needed"], interpretation: "Grip-as-indispensability." },
    ],
    releaseCondition: [
      { label: "Stay without orchestrating", text: "Seeing someone stay close without you having to arrange it.", tags: ["unearned-belonging"], interpretation: "Release through non-conditional bond." },
      { label: "Hand offered first", text: "Someone offering you help before you've asked for it.", tags: ["reciprocity"], interpretation: "Release through being held first." },
      { label: "Received tired", text: "Being met warmly even on a day you show up tired and depleted.", tags: ["received-as-self"], interpretation: "Release through non-performative reception." },
      { label: "Ask without performing", text: "Being able to ask for something without first proving you really need it.", tags: ["asking"], interpretation: "Release through unguarded ask." },
      { label: "Absence doesn't end it", text: "Knowing the relationship survives even when you're not around.", tags: ["secure-distance"], interpretation: "Release through proven continuity-without-me." },
      { label: "Named, not used", text: "Being known for who you are, not for what you do for people.", tags: ["seen", "identity"], interpretation: "Release through ontological recognition." },
      { label: "Slow week, still in", text: "Still being part of the circle on a week when you don't bring much.", tags: ["non-conditional"], interpretation: "Release through low-output reception." },
      { label: "Held while needing", text: "Letting someone carry things for you while you're the one who needs.", tags: ["receiving"], interpretation: "Release through being-the-one-cared-for." },
    ],
    aimReplacement: [
      { label: "Presence, not function", text: "Belonging because you're there, not because of what you do.", tags: ["being", "aim"], interpretation: "Aim shifts from doing to being." },
      { label: "Care includes me", text: "Care that includes you as one of the people it covers.", tags: ["self-care", "aim"], interpretation: "Aim names self-care as part of love." },
      { label: "Past the role", text: "Being in the relationship past whatever role you've been playing.", tags: ["beyond-role", "aim"], interpretation: "Aim = identity beyond function." },
      { label: "Receive without repay", text: "Letting someone do something for you without needing to pay them back.", tags: ["receiving", "aim"], interpretation: "Aim = gift-economy register." },
      { label: "Known by name", text: "Being known for who you are, not the function you serve.", tags: ["named", "aim"], interpretation: "Aim = ontological belonging." },
      { label: "Continuity past me", text: "Relationships that hold together even when you step away for a while.", tags: ["secure-bond", "aim"], interpretation: "Aim = bond stronger than function." },
      { label: "Care with form", text: "Caring for people in ways that don't drain you dry.", tags: ["sustainable-care", "aim"], interpretation: "Aim = bounded generosity." },
      { label: "Mutual carry", text: "Carrying others, and being carried, inside the same relationships.", tags: ["mutuality", "aim"], interpretation: "Aim = balanced reciprocity." },
    ],
  },

  worth_achievement: {
    gripObject: [
      { label: "The next visible win", text: "Getting the next visible win other people can see.", tags: ["achievement"], interpretation: "Grip-as-ledger.", boost: ["Honor", "te"] },
      { label: "Substantial output", text: "Putting out work the world treats as substantial.", tags: ["legibility"], interpretation: "Grip-as-perceived-weight." },
      { label: "Peer standing", text: "Where you rank against the people you most respect.", tags: ["peer-comparison"], interpretation: "Grip-as-relative-position." },
      { label: "The minimum standard", text: "The line you won't let yourself fall below.", tags: ["floor", "control"], interpretation: "Grip-as-floor-defense." },
      { label: "Justifying the cost", text: "Wins big enough to make up for what you gave up to get them.", tags: ["compensation"], interpretation: "Grip-as-cost-justification." },
      { label: "Belonging in the room", text: "Proof that you belong in the room you're sitting in.", tags: ["legitimacy"], interpretation: "Grip-as-credential." },
      { label: "Identity is the work", text: "Being the kind of person who's defined by what you make.", tags: ["work-identity"], interpretation: "Grip-as-self-equals-output." },
      { label: "Stopping looks like falling", text: "Never stopping, because stopping would feel like falling behind.", tags: ["momentum-fear"], interpretation: "Grip = motion-as-defense." },
    ],
    releaseCondition: [
      { label: "Recognition when idle", text: "Getting recognized when you've stopped chasing recognition.", tags: ["unearned-recognition"], interpretation: "Release through non-pursuit." },
      { label: "Approval from someone i've stopped needing", text: "Getting approval from someone whose approval no longer matters to you.", tags: ["approval-graduation"], interpretation: "Release through outgrowing the audience." },
      { label: "Worth named idle", text: "Being told you matter on a day you're producing nothing.", tags: ["non-productive-worth"], interpretation: "Release through being-not-doing." },
      { label: "Peers as peers", text: "Peers treating you as one of them no matter what you're producing.", tags: ["unconditional-peerage"], interpretation: "Release through unranked belonging." },
      { label: "Slow week, seen", text: "Being seen as valuable on a slow week.", tags: ["seen-idle"], interpretation: "Release through visibility-without-output." },
      { label: "Praise that doesn't catch", text: "Hearing praise and just letting it land — not needing more of it.", tags: ["receiving-praise"], interpretation: "Release through ungrasped affirmation." },
      { label: "Pause without falling", text: "Taking a pause that doesn't feel like falling behind.", tags: ["pause-tolerance"], interpretation: "Release through rest-as-rest." },
      { label: "Failure that survives", text: "Failing at something and finding your standing intact afterward.", tags: ["mistake-tolerance"], interpretation: "Release through fail-safe standing." },
    ],
    aimReplacement: [
      { label: "Includes maintenance", text: "Counting the quiet maintenance work as part of what you're worth, not just the high points.", tags: ["sustained", "aim"], interpretation: "Aim = baseline-inclusive worth." },
      { label: "Against past self", text: "Measuring yourself against who you used to be, not against other people.", tags: ["internal-yardstick", "aim"], interpretation: "Aim = self-referential growth." },
      { label: "Scaled to needed", text: "Doing what the work actually needs, no more and no less.", tags: ["right-size", "aim"], interpretation: "Aim = fit-for-purpose." },
      { label: "Quiet register", text: "Being quiet sometimes without it costing you standing.", tags: ["rest", "aim"], interpretation: "Aim = stillness is also work." },
      { label: "Sustained over peak", text: "Showing up steady over a long stretch instead of spiking.", tags: ["durability", "aim"], interpretation: "Aim = long-arc stamina." },
      { label: "Worth past output", text: "Mattering in parts of life that have nothing to do with what you produce.", tags: ["being", "aim"], interpretation: "Aim = ontological worth." },
      { label: "Cost named", text: "Being open about what each win actually cost you.", tags: ["transparency", "aim"], interpretation: "Aim = pricing-honest." },
      { label: "Building under-name", text: "Making things you won't put your name on.", tags: ["anonymity", "aim"], interpretation: "Aim = unattributed contribution." },
    ],
  },

  continuity: {
    gripObject: [
      { label: "What's worked before", text: "What's worked before, especially from the people who taught you.", tags: ["precedent"], interpretation: "Grip-as-precedent.", boost: ["si", "Stability"] },
      { label: "The familiar shape", text: "The shape you already know when everything else is uncertain.", tags: ["familiar", "continuity"], interpretation: "Grip-as-known-form." },
      { label: "The institution I'd preserve", text: "The institution, relationship, or practice you'd most want to keep alive.", tags: ["preservation"], interpretation: "Grip-as-custodianship." },
      { label: "Their way of doing it", text: "The way the people who taught you did it.", tags: ["lineage"], interpretation: "Grip-as-honoring-source." },
      { label: "Proven pattern", text: "The way of doing it that's already proven itself over time.", tags: ["proven"], interpretation: "Grip-as-tested-method." },
      { label: "The handoff intact", text: "Passing on what you received without losing any of it.", tags: ["handoff"], interpretation: "Grip-as-transmission-fidelity." },
      { label: "Avoid the new fad", text: "Not betting on something new that hasn't proven itself yet.", tags: ["unproven-aversion"], interpretation: "Grip-as-risk-floor." },
      { label: "Hold the long arc", text: "Holding a long arc together when other people would let it drop.", tags: ["long-arc"], interpretation: "Grip-as-time-binding." },
    ],
    releaseCondition: [
      { label: "Update that doesn't betray", text: "Changing something in a way that doesn't betray what came before it.", tags: ["faithful-update"], interpretation: "Release through reverent revision." },
      { label: "Small change held", text: "Trying a small change and watching it hold.", tags: ["incremental"], interpretation: "Release through bounded experiment." },
      { label: "Permission to revise", text: "Being given permission to revise something you've been faithful to.", tags: ["permission"], interpretation: "Release through authorized change." },
      { label: "Trusted hands", text: "Trusted hands carrying what you usually carry.", tags: ["delegation", "trust"], interpretation: "Release through co-stewardship." },
      { label: "New doesn't lose old", text: "Seeing that the new way doesn't lose what the old way was good at.", tags: ["non-erasure"], interpretation: "Release through additive change." },
      { label: "Ancestors would approve", text: "Making a change the people who taught you would have made themselves.", tags: ["lineage-permission"], interpretation: "Release through imagined consent." },
      { label: "One precedent broken", text: "Breaking one piece of tradition and watching the world keep working.", tags: ["test-revision"], interpretation: "Release through small-stakes break." },
      { label: "Time for the new to prove", text: "Giving a new way enough time to prove itself.", tags: ["patience"], interpretation: "Release through observation-window." },
    ],
    aimReplacement: [
      { label: "Stewardship lets things update", text: "Tending what you've been given in a way that lets it change without losing what mattered.", tags: ["evolving-faith", "aim"], interpretation: "Aim = living-tradition register." },
      { label: "Faith as discipline", text: "Being faithful as an ongoing practice, not as a fixed object.", tags: ["dynamic-fidelity", "aim"], interpretation: "Aim = practice over preservation." },
      { label: "Revision as honoring", text: "Treating careful revision as a way of honoring what came before.", tags: ["revision-honors", "aim"], interpretation: "Aim = change-as-respect." },
      { label: "Held lightly", text: "Holding tradition loosely enough that it can keep going.", tags: ["supple-faith", "aim"], interpretation: "Aim = grip-by-not-gripping." },
      { label: "Next chapter same voice", text: "Keeping the same spirit as you carry something into a new form.", tags: ["voice-continuity", "aim"], interpretation: "Aim = continuity through voice not form." },
      { label: "Care for past survives change", text: "Caring for the past in a way that survives when things change.", tags: ["caretaking", "aim"], interpretation: "Aim = memory + motion." },
      { label: "Inheritance with edits", text: "Passing on what you received, with your own honest edits in it.", tags: ["honest-edit", "aim"], interpretation: "Aim = generative stewardship." },
      { label: "Tradition that breathes", text: "A tradition that breathes — that moves with the season instead of being frozen.", tags: ["adaptive", "aim"], interpretation: "Aim = living rather than embalmed." },
    ],
  },

  security: {
    gripObject: [
      { label: "Margin against worst", text: "Having a cushion in case the worst case happens.", tags: ["margin", "security"], interpretation: "Grip-as-buffer.", boost: ["Stability"] },
      { label: "Foundations don't fail", text: "Foundations no one else can pull out from under you.", tags: ["foundation"], interpretation: "Grip-as-bedrock." },
      { label: "No-surprise plan", text: "Plans with no surprises hiding at the edges.", tags: ["predictability"], interpretation: "Grip-as-completeness." },
      { label: "Floor under what I love", text: "A solid base under the people and things you love.", tags: ["protective-floor"], interpretation: "Grip = floor-for-others.", boost: ["Family"] },
      { label: "Money / structure that holds", text: "Money or structure that holds when it gets tested.", tags: ["material-security"], interpretation: "Grip-as-resource-buffer." },
      { label: "Not at someone's mercy", text: "Not having to depend on anyone else for what you need.", tags: ["autonomy", "security"], interpretation: "Grip-as-independence." },
      { label: "Knowing where it is", text: "Knowing exactly where every important thing is, today.", tags: ["accounting"], interpretation: "Grip-as-inventory." },
      { label: "Hedge the unknown", text: "Hedging against what you can't predict.", tags: ["hedging"], interpretation: "Grip-as-anti-uncertainty." },
    ],
    releaseCondition: [
      { label: "Safety net named", text: "A backup plan you can name out loud and actually trust.", tags: ["named-net"], interpretation: "Release through identifiable backup." },
      { label: "Stakes without losing ground", text: "Stakes you could lose without losing the ground under you.", tags: ["floor-preserved"], interpretation: "Release through bounded loss." },
      { label: "People who'd catch me", text: "People who would catch you before you hit bottom.", tags: ["caught-by-others"], interpretation: "Release through trusted hands." },
      { label: "One risk allowed", text: "Enough cushion to take one calculated risk without it being reckless.", tags: ["risk-budget"], interpretation: "Release through risk-affordability." },
      { label: "Vigilance can rest", text: "Seeing that your security doesn't need you watching it constantly.", tags: ["non-vigilant-safety"], interpretation: "Release through trustworthy structure." },
      { label: "Loss survivable", text: "Surviving a real loss and finding you're still intact.", tags: ["proven-resilience"], interpretation: "Release through tested-resilience." },
      { label: "Others share the load", text: "Other people sharing the work of keeping things safe.", tags: ["distributed-security"], interpretation: "Release through co-protection." },
      { label: "Enough is enough", text: "A clear sense that what you already have is enough.", tags: ["sufficiency"], interpretation: "Release through enoughness." },
    ],
    aimReplacement: [
      { label: "Stewardship over hoarding", text: "Tending what you have so it can circulate, instead of just stockpiling it.", tags: ["stewardship", "aim"], interpretation: "Aim = circulation-not-accumulation." },
      { label: "Quiet floor, not fence", text: "Security as something quiet that you stand on, not a fence built around your day.", tags: ["floor-not-wall", "aim"], interpretation: "Aim = supportive-not-defensive." },
      { label: "Generosity from margin", text: "Being generous because you've built up enough room to give from.", tags: ["generosity", "aim"], interpretation: "Aim = abundance-from-buffer." },
      { label: "Structure that holds without me", text: "Trusting the structure to hold without you tending it every minute.", tags: ["systemic-trust", "aim"], interpretation: "Aim = systemic over personal." },
      { label: "Stability shared", text: "Sharing your stability with other people instead of just keeping it for yourself.", tags: ["shared", "aim"], interpretation: "Aim = collective-floor." },
      { label: "Enough as the read", text: "Naming what you have as actually enough, not just a step on the way to more.", tags: ["enoughness", "aim"], interpretation: "Aim = sufficiency-claimed." },
      { label: "Risk as practice", text: "Taking calculated risks as part of how you work, not as the enemy.", tags: ["healthy-risk", "aim"], interpretation: "Aim = risk-integrated." },
      { label: "Safety extended outward", text: "Letting the safety you've built reach past your own life into other people's.", tags: ["outward-safety", "aim"], interpretation: "Aim = protection-as-gift." },
    ],
  },

  responsibility: {
    gripObject: [
      { label: "What others count on", text: "What other people are counting on you to carry.", tags: ["others-counting"], interpretation: "Grip-as-promise.", boost: ["Loyalty", "Family"] },
      { label: "Role no one else takes", text: "The job no one else is stepping up to do.", tags: ["filling-gap"], interpretation: "Grip-as-default-volunteer." },
      { label: "Weight I picked up", text: "The load you picked up at some point and never put down.", tags: ["accumulated-load"], interpretation: "Grip-as-uncleared-debt." },
      { label: "Silent promise", text: "The promise you made without saying it out loud, and won't break.", tags: ["unspoken-vow"], interpretation: "Grip-as-tacit-contract." },
      { label: "Maintenance unseen", text: "The upkeep work no one else notices.", tags: ["invisible-labor"], interpretation: "Grip-as-hidden-stewardship." },
      { label: "Caretaker by default", text: "Becoming the caretaker because someone had to be.", tags: ["default-caretaker"], interpretation: "Grip-as-assumed-duty." },
      { label: "Putting them first", text: "Putting them first because no one else is going to.", tags: ["protective-priority"], interpretation: "Grip-as-prioritization." },
      { label: "Not letting it fall", text: "Not letting the thing fall apart on your watch.", tags: ["watch-keeping"], interpretation: "Grip-as-watch-duty." },
    ],
    releaseCondition: [
      { label: "Hands take a piece", text: "Someone taking a piece of the load and not dropping it.", tags: ["competent-handoff"], interpretation: "Release through proven co-bearer." },
      { label: "Permission to say no", text: "Saying no to one obligation and finding nothing bad happens.", tags: ["no-without-cost"], interpretation: "Release through bounded refusal." },
      { label: "Clean handoff", text: "Handing off one thing you've been carrying, cleanly.", tags: ["clean-transfer"], interpretation: "Release through transfer-not-abandonment." },
      { label: "World keeps working", text: "Taking time off and watching the world keep working without you.", tags: ["non-essentialness"], interpretation: "Release through proven dispensability." },
      { label: "Someone else carries a week", text: "Someone else carrying your weight for a week, and you feeling the relief of it.", tags: ["substitution"], interpretation: "Release through felt-relief." },
      { label: "Permission from the source", text: "Hearing from the person you're carrying for that you can step back.", tags: ["original-permission"], interpretation: "Release through source-authorized rest." },
      { label: "Asked, not assumed", text: "Being asked to carry something, instead of just assuming you had to.", tags: ["asked"], interpretation: "Release through explicit-invitation." },
      { label: "Care for me named", text: "Someone naming care for you as part of how this works.", tags: ["self-included"], interpretation: "Release through being-cared-for." },
    ],
    aimReplacement: [
      { label: "Shared, not solo", text: "Responsibility carried with other people, not alone.", tags: ["shared-duty", "aim"], interpretation: "Aim = distributed care." },
      { label: "No as discipline", text: "Treating saying no as part of doing the job well.", tags: ["bounded-yes", "aim"], interpretation: "Aim = saying-no-is-care." },
      { label: "Self-maintenance included", text: "Maintenance that includes looking after yourself, too.", tags: ["self-care", "aim"], interpretation: "Aim = self-inclusive duty." },
      { label: "Relay, not solo race", text: "Carrying things like a relay where you hand off, not a solo race.", tags: ["relay", "aim"], interpretation: "Aim = succession-thinking." },
      { label: "Care delegated", text: "Letting someone else carry the care, without it being abandoned.", tags: ["delegated-not-abandoned", "aim"], interpretation: "Aim = trust the next hands." },
      { label: "Chosen, not conscripted", text: "Carrying the weight because you chose it, not because you were drafted.", tags: ["chosen", "aim"], interpretation: "Aim = volitional service." },
      { label: "Receiving in the cycle", text: "Receiving care as part of the same cycle that gives it.", tags: ["receiving-too", "aim"], interpretation: "Aim = mutuality." },
      { label: "Discharge complete", text: "Being able to mark a duty done and walk away from it.", tags: ["completion", "aim"], interpretation: "Aim = finite duty." },
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
  { label: "What would restore", text: "What would help you first: one clear sign that the pressure is over.", tags: ["release-signal", "restore", "compression"], interpretation: "Folded release: stakes-end signal." },
  { label: "Voice / pace", text: "Your voice and pace tighten — you speak faster and shorter than usual.", tags: ["voice-tighten", "compression"], interpretation: "Compression shows as register-shift." },
  { label: "What I notice", text: "Your attention narrows — you see only the threat, not the rest of the room.", tags: ["attention-narrow", "compression"], interpretation: "Compression shows as perceptual-narrowing." },
  { label: "Body", text: "Your body holds tight — shoulders, jaw, breath.", tags: ["somatic", "compression"], interpretation: "Compression shows as held-tension." },
  { label: "Trust", text: "You stop trusting other people's read of the situation.", tags: ["trust-narrowing", "compression"], interpretation: "Compression shows as control-takeover." },
  { label: "Time", text: "Your time horizon shrinks — you act on the next sixty seconds, not the next month.", tags: ["short-horizon", "compression"], interpretation: "Compression shows as horizon-collapse." },
  { label: "Listening", text: "You stop listening for what's true and start listening for what's threatening.", tags: ["threat-listening", "compression"], interpretation: "Compression shows as defensive-attending." },
  { label: "Who I become", text: "You become someone a little different — more directive, less curious.", tags: ["self-shift", "compression"], interpretation: "Compression shows as character-shift." },
];

const TRAIT_VS_WEATHER_OPTIONS: SeedOption[] = [
  { label: "What would soften it", text: "What would soften it: one stretch where nothing is on the line.", tags: ["release-condition", "softening"], interpretation: "Folded release: low-stakes interval." },
  { label: "Always been this way", text: "This has been the way you are for as long as you can remember.", tags: ["trait", "lifetime"], interpretation: "Trait read." },
  { label: "Last few years", text: "This got sharper in the last few years — it feels like a season, not who you are.", tags: ["weather", "recent"], interpretation: "Weather read." },
  { label: "Since the load", text: "Since a specific event or arc started — that's when it's been like this.", tags: ["weather", "load-onset"], interpretation: "Weather read tied to onset." },
  { label: "Always like this under stress", text: "Always like this when you're stressed, but different the rest of the time.", tags: ["stress-pattern", "trait-conditional"], interpretation: "Trait-under-load." },
  { label: "Became normal", text: "It became normal so slowly that you stopped noticing it was happening.", tags: ["normalized", "weather"], interpretation: "Slow normalization." },
  { label: "Inherited", text: "You learned this from someone you lived with.", tags: ["inherited", "trait-lineage"], interpretation: "Inherited register." },
  { label: "Choice that hardened", text: "A choice you made once that hardened into the way you do everything.", tags: ["chosen-hardened"], interpretation: "Choice-to-trait drift." },
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

  // CC-141 §C — clarifier triggers read the PRE-LIFT axis reason
  // flags, NOT the (possibly lifted) `confidence` value. CC-097B's
  // cross-signal lift can flip the displayed confidence from low to
  // high when the dominant is corroborated — but if the reason for
  // the original low was axis contamination (`ns-valence` /
  // `judging-cooccurrence`) or thin floor, the contamination is still
  // there and the clarifier must still fire. "Ask the question" is
  // decoupled from "show high." Reasons are populated by
  // `aggregateLensStack` (see CC-141 §A); when CC-097B lifts, the
  // reasons remain attached for this exact reading.
  const reasons = ls?.confidenceLowReasons ?? [];
  const nsValenceReason = reasons.includes("ns-valence");
  const thinFloorReason = reasons.includes("thin-floor");
  const judgingCooccurrenceReason = reasons.includes("judging-cooccurrence");
  // CC-138 — binary-format constraint violations also surface the
  // head-to-head clarifiers. `binary-attitude-violation` can fire on
  // either axis; without per-axis specificity the eligibility goes to
  // both clarifiers — the generator emits both (whichever the user
  // actually picks both leaders on resolves the violation).
  // `binary-dominance-ambiguous` is a near-tie ordering, which CC-138
  // also routes to the §D clarifier per the canon's "near-tie
  // ordering" rule.
  const binaryAttitudeViolation = reasons.includes(
    "binary-attitude-violation"
  );
  const binaryDominanceAmbiguous = reasons.includes(
    "binary-dominance-ambiguous"
  );
  // The clarifier-eligible state for the N/S head-to-head is: the
  // lens layer flagged an N/S contamination OR thin-floor + a real
  // N-vs-S top-pick split. CC-134.1's clarifier originally gated on
  // `confidence === "low"`; CC-141 widens the gate to the reasons so
  // a Megan-shape (lifted to high on a corroborated Fi dominant +
  // contaminated N/S) still gets asked. CC-138 adds the binary flags.
  const nsClarifierEligible =
    nsValenceReason ||
    thinFloorReason ||
    binaryAttitudeViolation ||
    binaryDominanceAmbiguous;
  const judgingClarifierEligible =
    judgingCooccurrenceReason ||
    binaryAttitudeViolation ||
    binaryDominanceAmbiguous;

  // CC-134 Part D §D.1 — pull the per-pool top-pick leaders so the
  // generator can build an N-vs-S head-to-head clarifier. The leaders
  // are the function with the most rank-1 picks in each sub-axis
  // (Ni/Ne for N; Si/Se for S). Ties resolve alphabetically by
  // function id to keep the resolver deterministic.
  let nsLeaderN: CognitiveFunctionId | undefined;
  let nsLeaderS: CognitiveFunctionId | undefined;
  let nsHeadToHeadTrigger: "low_confidence" | "ns_split_suspect" | undefined;
  if (nsClarifierEligible) {
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

  // CC-134.1 §Task 3 — judging-axis head-to-head detection. CC-141 §C
  // — triggers on the `judging-cooccurrence` reason flag rather than
  // the (possibly lifted) `confidence` value, so the warm-Ti-pulls-Fi
  // (or warm-Te-pulls-Fe) clarifier still fires when cross-signal
  // lift raised display confidence.
  let judgingHeadToHeadA: CognitiveFunctionId | undefined;
  let judgingHeadToHeadB: CognitiveFunctionId | undefined;
  let judgingHeadToHeadTrigger:
    | "ti_fi_cooccurrence"
    | "te_fe_cooccurrence"
    | undefined;
  if (judgingClarifierEligible) {
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

// CC-149 — the aim-replacement stem previously opened "If the Grip on X
// softened, what could the same instrument be aimed at instead?" The
// "same instrument" was a pronoun pointing at nothing the reader could
// picture (it silently meant "the same drive/energy you've been
// gripping with"). Owner read-through confirmed the stem was opaque.
// Rewrite: open with the eased *fear* (concrete, named) and replace
// "the same instrument" with a referent the reader can name — "that
// same drive / care / strength / faithfulness." This is a concreteness
// fix, not a vocabulary scrub: "grip" and "aim" remain allowed in this
// product (the report has a `## Your Grip` section; the
// release-condition stems use "loosen your grip on the work" verbatim
// — see RELEASE_CONDITION_STEM).
//
// `control_mastery` is owner-locked to the exact wording below. The
// other five families follow the same parallel structure.
const AIM_REPLACEMENT_STEM: Record<FollowUpFamily, string> = {
  control_mastery: "If being 'not good enough' felt less dangerous, where could that same drive point instead?",
  belonging_usefulness: "If your place didn't depend on being useful, where could that same care point instead?",
  worth_achievement: "If your worth didn't depend on the next win, where could that same drive point instead?",
  continuity: "If keeping everything the way it's been felt less urgent, where could that same faithfulness point instead?",
  security: "If the floor already felt solid enough, where could that same care point instead?",
  responsibility: "If you didn't have to carry it all yourself, where could that same strength point instead?",
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
  // CC-141 §D — neutral "Voice A / Voice B" labels match the bank's
  // `data/questions.ts` convention (Q-T1–T8 hide function codes
  // behind "Voice A–D" so the reader can't game which voice maps to
  // which function). Function id lives in `tags[0]` so the resolver
  // still maps the pick back correctly (it joins on label = picked_id
  // and reads the function from the option's tags).
  return {
    id: "fq4_type_clarity_ns",
    purpose: "type_clarity",
    question:
      "On a Tuesday afternoon, the first read you make of a situation lands more like which of these?",
    responseMode: "choose_one",
    options: [
      {
        label: "Voice A",
        text: `${nVoice.framing} — ${nVoice.texture}`,
        tags: [nLeader, "perceiving", "type_clarity"],
        interpretation: `Confirms ${nLeader.toUpperCase()}-led perceiving (intuitive).`,
      },
      {
        label: "Voice B",
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
  // CC-141 §D — neutral "Voice A / Voice B" labels (see comment on
  // buildTypeClarityHeadToHead). Function id stays in `tags[0]`.
  return {
    id: "fq5_type_clarity_judging",
    purpose: "type_clarity",
    question:
      "When you have to make a hard call, which of these is closer to how the decision actually settles inside you?",
    responseMode: "choose_one",
    options: [
      {
        label: "Voice A",
        text: `${aVoice.framing} — ${aVoice.texture}`,
        tags: [aLeader, "judging", "type_clarity"],
        interpretation: `Confirms ${aLeader.toUpperCase()}-led judging.`,
      },
      {
        label: "Voice B",
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
