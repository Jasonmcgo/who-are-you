// CC-SYNTHESIS-1-FINISH — synthesis-layer-collapse closing pass.
//
// Six sections in the parent prompt; this file ships the composers for
// Sections B (Trust Correction Channel), C (Weather State-vs-Shape
// qualifier), E (Movement Notes on 5 body cards), and F (Path master
// synthesis paragraph). Sections A (prose dedup) and D (thin-signal
// Risk Form suppression) are pure render-layer deletions/guards and
// don't need composers.
//
// All composers are mechanical templating from existing engine output.
// No new measurements, no new questions, no LLM calls, no new
// vocabulary beyond the per-card template strings the parent prompt
// names. Hedge density preserved (no additions, no removals).

import type {
  CognitiveFunctionId,
  EpistemicPosture,
  InnerConstitution,
  Signal,
  SignalId,
} from "./types";
import {
  COMPASS_LABEL,
  FUNCTION_VOICE,
  FUNCTION_VOICE_SHORT,
  GRAVITY_LABEL,
  composeClosingReadProse,
  getTopCompassValues,
  getTopGravityAttribution,
} from "./identityEngine";

// ─────────────────────────────────────────────────────────────────────
// Section B — Trust Correction Channel composer
// ─────────────────────────────────────────────────────────────────────

export type TrustCorrectionCategory =
  | "Expert correction"
  | "Partner correction"
  | "Community correction"
  | "Institutional correction"
  | "Evidence correction"
  | "Spiritual correction";

const CHANNEL_DESCRIPTIONS: Record<TrustCorrectionCategory, string> = {
  "Expert correction":
    "Expert correction names whoever has demonstrated competence in the domain at hand",
  "Partner correction":
    "Partner correction names the closest tie whose perspective you let interrupt your own",
  "Community correction":
    "Community correction names the wider circle — friends, religious community, cultural ties — that holds your read accountable",
  "Institutional correction":
    "Institutional correction names the formal bodies — education, journalism, government services — that you let revise your own conclusions",
  "Evidence correction":
    "Evidence correction names what gets weight when the source is your own counsel: tested data, lived results, verifiable fact",
  "Spiritual correction":
    "Spiritual correction names the religious authority, faith community, or sacred text that holds your read accountable beyond the human-only frame",
};

// Map each existing trust signal to a correction category. The mapping
// is conservative — when a single signal could belong to two categories,
// we pick the one most fitting to the engine's existing register.
const TRUST_SIGNAL_TO_CATEGORY: Partial<Record<SignalId, TrustCorrectionCategory>> = {
  // Institutional sources
  education_trust_priority: "Institutional correction",
  government_elected_trust_priority: "Institutional correction",
  government_services_trust_priority: "Institutional correction",
  nonprofits_trust_priority: "Institutional correction",
  journalism_trust_priority: "Institutional correction",
  news_organizations_trust_priority: "Institutional correction",
  small_business_trust_priority: "Institutional correction",
  large_companies_trust_priority: "Institutional correction",
  social_media_trust_priority: "Institutional correction",
  // Spiritual / religious
  religious_trust_priority: "Spiritual correction",
  // Relational sources
  partner_trust_priority: "Partner correction",
  family_trust_priority: "Partner correction",
  friend_trust_priority: "Community correction",
  mentor_trust_priority: "Expert correction",
  outside_expert_trust_priority: "Expert correction",
  // Self / evidence
  own_counsel_trust_priority: "Evidence correction",
};

function topTrustSignals(signals: Signal[], n = 4): Signal[] {
  return signals
    .filter(
      (s) =>
        TRUST_SIGNAL_TO_CATEGORY[s.signal_id] !== undefined &&
        s.rank !== undefined &&
        s.rank <= n
    )
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
}

// Map a trust signal id to a human-readable source label (for verbatim
// inclusion in the Correction channel paragraph). Engine-side
// vocabulary is canonical; we lift the same labels rendered elsewhere.
const TRUST_SIGNAL_LABEL: Partial<Record<SignalId, string>> = {
  education_trust_priority: "Education",
  government_elected_trust_priority: "Elected Government",
  government_services_trust_priority: "Government Services",
  nonprofits_trust_priority: "Non-Profits",
  journalism_trust_priority: "Journalism",
  news_organizations_trust_priority: "News Organizations",
  small_business_trust_priority: "Small Business",
  large_companies_trust_priority: "Large Companies",
  social_media_trust_priority: "Social Media",
  religious_trust_priority: "Religious Community",
  partner_trust_priority: "Partner",
  family_trust_priority: "Family",
  friend_trust_priority: "Friends",
  mentor_trust_priority: "Mentors",
  outside_expert_trust_priority: "Outside Experts",
  own_counsel_trust_priority: "Own Counsel",
};

// Cohort-thinness fallback for Trust. When the user has no ranked
// trust signals, the composer can't classify into a channel — but the
// audit (and the prompt) require a paragraph for every fixture. The
// fallback names the thinness honestly without inventing a channel.
const TRUST_FALLBACK =
  "**Correction channel.** Trust is not merely who you believe — it is who is allowed to interrupt your movement before it hardens. Your responses did not yet converge on a clear top-trust ranking, so the correction channels read as mixed. Notice whose voice you let interrupt yours when the read above lands close to a hard call — that's where your governor lives.";

export function composeTrustCorrectionChannel(
  constitution: InnerConstitution
): string {
  const top = topTrustSignals(constitution.signals);
  if (top.length === 0) return TRUST_FALLBACK;

  // Tally category counts; preserve first-encounter order for ties.
  const order: TrustCorrectionCategory[] = [];
  const counts = new Map<TrustCorrectionCategory, number>();
  const sourceLabels: string[] = [];
  for (const sig of top) {
    const cat = TRUST_SIGNAL_TO_CATEGORY[sig.signal_id];
    if (!cat) continue;
    if (!counts.has(cat)) order.push(cat);
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
    const label = TRUST_SIGNAL_LABEL[sig.signal_id];
    if (label && !sourceLabels.includes(label)) sourceLabels.push(label);
  }
  if (order.length === 0) return "";

  const channels = order.slice(0, 2);
  const channelPhrase =
    channels.length === 1
      ? channels[0]
      : `${channels[0]} and ${channels[1]}`;
  const description = CHANNEL_DESCRIPTIONS[channels[0]];
  // Cite at least one verbatim source label so the audit (and the
  // reader) can see where the channel categorization came from.
  const citationSuffix =
    sourceLabels.length > 0
      ? ` Your top-trust list includes ${sourceLabels.slice(0, 3).join(", ")}.`
      : "";

  return [
    `**Correction channel.** Trust is not merely who you believe — it is who is allowed to interrupt your movement before it hardens.`,
    `Your shape's primary correction channels appear to be ${channelPhrase}.`,
    `${description}.`,
    `When correction channels narrow, the governor more easily slips toward Grip; the narrower the channel, the more critical it becomes that the channels you have stay open.${citationSuffix}`,
  ].join(" ");
}

// ─────────────────────────────────────────────────────────────────────
// Section C — Weather State-vs-Shape qualifier composer
// ─────────────────────────────────────────────────────────────────────

const WEATHER_QUALIFIER_BY_LOAD: Record<"low" | "moderate" | "high", string> = {
  low:
    "Your current load reads as light. The shape this report describes is more likely to be your durable form than a season — the patterns above are most likely the patterns that hold when life isn't pressing. Read with that in mind.",
  moderate:
    "Your current load reads as moderate — enough to test the shape without overwhelming it. The patterns above are valid reads, but you're seeing them under some pressure; what reads as 'shape' may have a percent of state mixed in. Notice which patterns ease when the load eases — those are most likely durable.",
  high:
    "Your current load reads as high. Read everything above with caution: behaviors that look like personality may be adaptation to current pressure. Recovery and reading are not the same task. Honor what you're carrying first; the durable shape will be more visible when the load eases.",
};

// Engine WeatherLoad has a fourth value "high+" (high + high
// responsibility intensifier). For the qualifier, treat both "high"
// and "high+" as the same prose — they're variants of the same
// "read with caution" register.
function normalizedLoad(
  load: "low" | "moderate" | "high" | "high+"
): "low" | "moderate" | "high" {
  return load === "high+" ? "high" : load;
}

export function composeWeatherStateVsShape(
  constitution: InnerConstitution
): string {
  // The Weather card's currentLoad isn't on the SWOT card output
  // directly; we re-derive from signals using the same heuristic
  // assessWeatherLoad uses. Duplicating the read is cheaper than
  // re-plumbing the field through ShapeOutputs.
  const sigIds = new Set(constitution.signals.map((s) => s.signal_id));
  let load: "low" | "moderate" | "high" = "moderate";
  if (sigIds.has("high_pressure_context")) load = "high";
  else if (sigIds.has("moderate_load")) load = "moderate";
  else if (sigIds.has("stability_present")) load = "low";
  return `**State vs. shape.** ${WEATHER_QUALIFIER_BY_LOAD[normalizedLoad(load)]}`;
}

// ─────────────────────────────────────────────────────────────────────
// Section E — Movement Notes (5 cards)
// ─────────────────────────────────────────────────────────────────────

// CC-SYNTHESIS-1A Risk Form letters.
// CC-PHASE-3A-LABEL-LOGIC — labels refined per canon §14.
type RiskFormLetter =
  | "Open-Handed Aim"
  | "Grip-Governed"
  | "Ungoverned Movement"
  | "White-Knuckled Aim";

// ── Lens Movement Note: Cost as Work shape

const LENS_WORK_SHAPE: Record<CognitiveFunctionId, string> = {
  ni: "long-arc structures and frameworks that organize where things are heading",
  ne: "option creation, alternative paths, and connection between adjacent ideas",
  se: "immediate response, concrete action, and reading what's actually here",
  si: "continuity, tested forms, and the inheritance of what has worked",
  te: "systems, order, follow-through, and the architecture that makes plans work",
  ti: "vetted ideas, clarified claims, and the test for internal fit",
  fi: "authentic conviction made visible, the personal truth-test as a building principle",
  fe: "relational presence, consequence-aware action, and care expressed through attentiveness",
};

const LENS_DISTORTION: Record<CognitiveFunctionId, string> = {
  ni: "close the read too early, certain before evidence is in",
  ne: "multiply options past the point where any one can be chosen",
  se: "respond to immediacy without long enough context",
  si: "treat last decade's truth as this decade's command",
  te: "lock structure before the goal has been examined",
  ti: "trust internal coherence the world doesn't share",
  fi: "treat personal truth as universal mandate",
  fe: "preserve the room at the cost of saying the thing the room actually needs",
};

export function composeLensMovementNote(
  constitution: InnerConstitution
): string {
  const dom = constitution.lens_stack.dominant;
  const fn = FUNCTION_VOICE[dom]; // "the pattern-reader" form
  return `**Movement Note** — Your Work becomes healthiest when ${fn} is allowed to turn Cost into ${LENS_WORK_SHAPE[dom]}. Under load, this same function may ${LENS_DISTORTION[dom]}.`;
}

// ── Compass Movement Note: Beloved object names what Goal serves

const COMPASS_GIVING_DESCRIPTOR: Partial<Record<SignalId, string>> = {
  knowledge_priority:
    "building structures that make truth more usable, more humane, and less captive to noise",
  family_priority:
    "love that becomes a reliable form others can count on",
  compassion_priority:
    "concrete care with enough structure to last beyond the moment",
  peace_priority:
    "order rebuilt where order broke, durable conditions for flourishing",
  faith_priority:
    "belief made visible through faithful action across time",
  honor_priority:
    "integrity given a body, the kept promise as a form of work",
  freedom_priority:
    "space made for self and others to become without coercion",
  justice_priority:
    "accountable structures that make wrong things right",
  truth_priority:
    "saying clearly what is, in language the room can act on",
  loyalty_priority:
    "commitments that hold when costs arrive, not only when they don't",
  stability_priority:
    "predictable ground others can build on",
  mercy_priority:
    "care that doesn't hold the past against the present",
};

export function composeCompassMovementNote(
  constitution: InnerConstitution
): string {
  const top = getTopCompassValues(constitution.signals);
  if (top.length === 0) return "";
  const compassRef = top[0];
  const label = COMPASS_LABEL[compassRef.signal_id] ?? compassRef.signal_id;
  const heldInside = top
    .slice(1, 4)
    .map((ref) => COMPASS_LABEL[ref.signal_id] ?? ref.signal_id);
  const heldPhrase =
    heldInside.length === 0
      ? ""
      : heldInside.length === 1
      ? ` held inside ${heldInside[0]}`
      : heldInside.length === 2
      ? ` held inside ${heldInside[0]} and ${heldInside[1]}`
      : ` held inside ${heldInside[0]}, ${heldInside[1]}, and ${heldInside[2]}`;
  const descriptor =
    COMPASS_GIVING_DESCRIPTOR[compassRef.signal_id] ??
    "care given a durable form, the value made visible through how you build";
  return `**Movement Note** — Your beloved object is ${label}${heldPhrase}. Your Goal expresses Cost in service of it; your Soul covers it as presence. Your Giving is ${descriptor}.`;
}

// ── Conviction Movement Note: Speech-risk pattern under cost
//
// Maps existing belief_under_tension.epistemic_posture to one of four
// canonical readouts. "Truth weaponized" intentionally has no engine-
// posture mapping — it would require a stronger judgment than the
// engine's "rigid" categorical signals (rigid means held-as-identity,
// not held-as-weapon). When posture doesn't map cleanly, default to
// "Truth matured" per the prompt's safe-default rule.

const CONVICTION_NOTE: Record<
  "withheld" | "weaponized" | "overpaid" | "matured",
  string
> = {
  withheld:
    "**Movement Note** — Under cost, your conviction tends to soften before it speaks — your shape protects the room more readily than it protects the truth.",
  weaponized:
    "**Movement Note** — Under cost, your conviction tends to land sharper than the moment asks — accuracy without the relational care that lets it be heard.",
  overpaid:
    "**Movement Note** — Under cost, your conviction tends to accept too much weight too quickly — the willingness to bear cost outpaces the calibration of whether the cost is needed.",
  matured:
    "**Movement Note** — Under cost, your conviction tends to hold and stay revisable — clear about what's true, humble about what isn't yet known.",
};

function convictionReadoutKey(
  posture: EpistemicPosture | null | undefined
):
  | "withheld"
  | "weaponized"
  | "overpaid"
  | "matured" {
  if (!posture) return "matured";
  switch (posture) {
    case "guarded":
      return "withheld";
    case "rigid":
      return "overpaid";
    case "open":
    case "reflective":
    case "unknown":
    default:
      return "matured";
  }
}

export function composeConvictionMovementNote(
  constitution: InnerConstitution
): string {
  const posture =
    constitution.belief_under_tension?.epistemic_posture ?? null;
  return CONVICTION_NOTE[convictionReadoutKey(posture)];
}

// ── Gravity Movement Note: Burden pattern

const GRAVITY_DIRECTION: Partial<Record<SignalId, string>> = {
  individual_responsibility_priority:
    "naming accountability before structure",
  system_responsibility_priority:
    "aiming at structural repair",
  authority_responsibility_priority:
    "addressing whoever decided",
  nature_responsibility_priority:
    "making space for what couldn't be controlled",
  supernatural_responsibility_priority:
    "holding what cannot be named",
};

const GRAVITY_DISTORTION: Partial<Record<SignalId, string>> = {
  individual_responsibility_priority:
    "over-locating agency in the person and missing systemic causes",
  system_responsibility_priority:
    "moralizing every gap in the system as if it were intentional",
  authority_responsibility_priority:
    "conflating authority's responsibility with the structure they sit inside",
  nature_responsibility_priority:
    "excusing patterns that genuinely could change",
  supernatural_responsibility_priority:
    "using mystery as a way to release responsibility that's actually shared",
};

// Cohort-thinness fallback for Gravity. When the responsibility-
// attribution signals didn't converge on a clear top frame, the
// composer can't name a specific direction or distortion. The
// fallback acknowledges the thinness and leaves the read open for
// the user to confirm.
const GRAVITY_FALLBACK =
  "**Movement Note** — Your responsibility-attribution answers did not yet converge on a clear top frame, so this note runs lighter. Where your Giving will likely point depends on which lens — individual / system / authority / nature / mystery — emerges as the weighted attribution. Notice which feels most like a fit when you read the cards above.";

export function composeGravityMovementNote(
  constitution: InnerConstitution
): string {
  const top = getTopGravityAttribution(constitution.signals);
  if (top.length === 0) return GRAVITY_FALLBACK;
  const g1 = top[0];
  const g2 = top[1];
  const label1 = GRAVITY_LABEL[g1.signal_id] ?? g1.signal_id;
  const label2 = g2 ? GRAVITY_LABEL[g2.signal_id] ?? g2.signal_id : "";
  const direction = GRAVITY_DIRECTION[g1.signal_id] ?? "naming where the weight lands";
  const distortion =
    GRAVITY_DISTORTION[g1.signal_id] ??
    "letting one attribution lens absorb cases that belong to another";
  const ranking = label2 ? `${label1} and ${label2}` : label1;
  return `**Movement Note** — Because ${ranking} rank highest in your responsibility weighting, your Giving will likely point toward ${direction}. The risk is ${distortion}.`;
}

// ── Fire Movement Note: Risk Form's behavior under cost

const FIRE_NOTE_BY_LETTER: Record<RiskFormLetter, string> = {
  "Open-Handed Aim":
    "**Movement Note** — When cost arrives, your shape tends to weigh and aim. Aim is present, grip moderate. Your Risk reads as governor: the work it does is keep the cost honest without preventing the move.",
  "Grip-Governed":
    "**Movement Note** — When cost arrives, your shape tends to lock up before weighing. Aim is thin and grip has begun to dominate the governor. The work is to let Risk inform without becoming refusal.",
  "Ungoverned Movement":
    "**Movement Note** — When cost arrives, your shape tends to respond without much pause. Aim is thin, grip is thin. The motion is unimpeded; the work is to add enough pause that what gets risked is what's actually worth risking.",
  "White-Knuckled Aim":
    "**Movement Note** — When cost arrives, your shape tends to bear cost without the protection a paused look would give. Aim is present but grip has activated alongside it. The work is to let Risk become governor before grip takes its job.",
};

// CC-SYNTHESIS-1-FINISH Section D + E — return null when length=0 so
// the renderer can suppress the line on thin-signal / Drift fixtures
// (no movement for the governor to govern).
export function composeFireMovementNote(
  constitution: InnerConstitution
): string | null {
  if (
    !constitution.riskForm ||
    !constitution.goalSoulMovement ||
    constitution.goalSoulMovement.dashboard.movementStrength.length === 0
  ) {
    return null;
  }
  return FIRE_NOTE_BY_LETTER[constitution.riskForm.letter];
}

// ─────────────────────────────────────────────────────────────────────
// Section F — Path master synthesis paragraph
// ─────────────────────────────────────────────────────────────────────
//
// Composer integrates: bias direction, Work shape (Lens dominant), top
// Compass (beloved object), Love-Map flavor (loveMap.matches[0].label),
// Risk Form integration phrase, four-quadrant trajectory label, and
// the existing two-tier closing-phrase from CC-SYNTHESIS-1A.
//
// Structure (one paragraph):
//   1. Bias-direction sentence ("Your movement is Goal-leaning: the Work
//      line is strong, and the Soul line is forming.")
//   2. Work shape + beloved object ("Your Work shape is X, organized
//      around Y.")
//   3. Love shape ("Your Love shape is Z — descriptor.")
//   4. Risk-Form integration phrase (one concise sentence, distinct
//      from the Fire Movement Note's behavior read).
//   5. Next-move sentence ("The next movement is not more output. It is
//      to {next-move-descriptor}.")
//   6. Closing canonical phrase from composeClosingReadProse logic — the
//      same two-tier gate as CC-SYNTHESIS-1A. We don't reimplement the
//      gate; we read the composed Closing Read prose and substring out
//      the canonical phrase that fired (early-shape vs arrived).

const PATH_RISK_FORM_INTEGRATION: Record<RiskFormLetter, string> = {
  "Open-Handed Aim":
    "Your Risk Form reads as Open-Handed Aim — the governor is doing its work.",
  "Grip-Governed":
    "Your Risk Form reads as Grip-Governed — the governor has begun to lock motion rather than aim it.",
  "Ungoverned Movement":
    "Your Risk Form reads as Ungoverned Movement — motion runs unimpeded, calibration is the future asking.",
  "White-Knuckled Aim":
    "Your Risk Form reads as White-Knuckled Aim — Aim is present but grip has activated alongside it; engaged but not at peace.",
};

// Bias direction → "the {Work-or-Soul} line is strong, and the
// {complementary} line is {position descriptor}".
function biasDirectionSentence(
  direction: "Goal-leaning" | "balanced" | "Soul-leaning",
  goal: number,
  soul: number
): string {
  if (direction === "balanced") {
    return `Your movement is balanced: the Work line and the Soul line both register, neither dominating the other.`;
  }
  if (direction === "Goal-leaning") {
    const soulPos =
      soul < 30
        ? "still forming"
        : soul < 50
        ? "present but quieter"
        : "present alongside it";
    return `Your movement is Goal-leaning: the Work line is strong, and the Soul line is ${soulPos}.`;
  }
  // Soul-leaning
  const goalPos =
    goal < 30
      ? "still forming"
      : goal < 50
      ? "present but quieter"
      : "present alongside it";
  return `Your movement is Soul-leaning: the Soul line is strong, and the Work line is ${goalPos}.`;
}

// Next-move descriptor — derived from gap analysis. The gap is between
// the high axis (Goal or Soul) and the lower axis. When balanced, the
// next move is integration ("keep it honest as the seasons turn").
function nextMoveDescriptor(
  direction: "Goal-leaning" | "balanced" | "Soul-leaning",
  goal: number,
  soul: number
): string {
  if (direction === "balanced") {
    return "keep this shape honest as the seasons turn — what's integrated this month must stay integrated when the load shifts";
  }
  if (direction === "Goal-leaning" && soul < 50) {
    return "anchor the building in what you actually love — the people, the cause, or the calling that already claims you";
  }
  if (direction === "Soul-leaning" && goal < 50) {
    return "give your love a form the world can meet — the building, the structure, the visible work that lets the love land where it can be received";
  }
  // Default — both lines are present but one stronger; integration
  // task is the lesser-named line.
  return "let the lesser line catch up to the stronger, so that what you build and what you love are pulling in the same direction";
}

export function composePathMasterSynthesis(
  constitution: InnerConstitution
): string {
  const movement = constitution.goalSoulMovement;
  const compass = getTopCompassValues(constitution.signals);
  const loveMatch = constitution.loveMap?.matches?.[0];
  const dom = constitution.lens_stack.dominant;

  if (!movement || compass.length === 0 || !loveMatch) {
    // Fallback to keep render path safe for thin-signal fixtures —
    // never crash, prefer a minimal paragraph that still names the
    // shape without inventing claims. The synthesis still consumes
    // available fields and skips ones missing.
    const compassLabel =
      compass[0] && (COMPASS_LABEL[compass[0].signal_id] ?? compass[0].signal_id);
    const workShape = LENS_WORK_SHAPE[dom];
    const lensLabel = FUNCTION_VOICE_SHORT[dom];
    return `Your Work shape leans toward ${workShape} — the form ${lensLabel} naturally builds. ${
      compassLabel ? `It is organized around ${compassLabel}. ` : ""
    }The next movement is to keep this shape honest as the seasons turn.`;
  }

  const dash = movement.dashboard;
  const direction = dash.direction.descriptor; // "Goal-leaning" | "balanced" | "Soul-leaning"
  const goal = dash.goalScore;
  const soul = dash.soulScore;
  const compassRef = compass[0];
  const compassLabel = COMPASS_LABEL[compassRef.signal_id] ?? compassRef.signal_id;
  const workShape = LENS_WORK_SHAPE[dom];
  const loveLabel = loveMatch.register.register_label;
  const loveDescriptor = loveMatch.register.short_description;

  // Closing canonical phrase — pull from composeClosingReadProse so the
  // two-tier gate (early-shape vs arrived) applies here too. The
  // closing read's prose is paragraph-length; we extract whichever
  // canonical phrase fired.
  const closingProse = composeClosingReadProse(constitution);
  const arrivedPhrase = "Giving is Work that has found its beloved object";
  const earlyShapePhrase = "the early shape of giving";
  const closingPhrase = closingProse.includes(arrivedPhrase)
    ? arrivedPhrase
    : closingProse.includes(earlyShapePhrase)
    ? earlyShapePhrase
    : null;

  // Risk Form integration — concise Path-level reference only. Fire
  // keeps the longer behavior reading; Path must not duplicate it.
  const riskBehavior =
    constitution.riskForm && dash.movementStrength.length > 0
    ? ` ${PATH_RISK_FORM_INTEGRATION[constitution.riskForm.letter]}`
    : "";

  const parts: string[] = [];
  parts.push(biasDirectionSentence(direction, goal, soul));
  parts.push(
    `Your Work shape is ${workShape}, organized around ${compassLabel}.`
  );
  parts.push(`Your Love shape is ${loveLabel} — ${loveDescriptor}`);
  if (riskBehavior) parts.push(riskBehavior.trim());
  parts.push(
    `The next movement is not more output. It is to ${nextMoveDescriptor(direction, goal, soul)}.`
  );
  if (closingPhrase) {
    // Capitalize first letter for sentence head and add a period.
    const head = closingPhrase.charAt(0).toUpperCase() + closingPhrase.slice(1);
    parts.push(`${head}.`);
  }

  return parts.join(" ");
}
