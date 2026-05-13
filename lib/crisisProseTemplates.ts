// CC-CRISIS-PATH-PROSE — differential prose rendering for crisis-path users.
//
// Canon (Jason 2026-05-10):
//   "Sometimes the grip is not what's pulling you off course. It's what
//    you're reaching for because there is no course yet. The work isn't
//    to loosen — the work is to build something for the hand to hold."
//
// This module supplies:
//   - The six per-flavor rubric exemplars embedded in LLM system prompts
//   - The deterministic engine-fallback templates for each flavor (used
//     when the LLM API is unavailable; structurally correct without
//     LLM warmth)
//   - The ethical-guardrail soft-pointer constant (mandatory in every
//     crisis paragraph)
//   - The path-class register switching block (the system-prompt anchor)
//   - The clinical banned-phrase list for crisis-class audit gating
//
// Method discipline:
//   - Engine for truth. The engine has already classified path-class
//     and crisis-flavor. This module supplies only the prose-layer
//     register; it does not classify.
//   - The crisis prose is the highest-stakes language the instrument
//     writes. Wrong tone, false-clinical claims, helpline injection
//     all do real harm.
//   - The instrument is a mirror, not a clinician. Every crisis
//     paragraph closes with the soft pointer to professional support
//     without prescribing specific resources.
//
// Pure data — no API calls, no SDK, no `node:*` imports.

import type { CrisisFlavor } from "./primalCoherence";

// ─────────────────────────────────────────────────────────────────────
// Ethical guardrail — mandatory soft pointer
// ─────────────────────────────────────────────────────────────────────
//
// Every crisis-path paragraph must end with this canonical sentence
// (or near-verbatim equivalent). The audit's anchor token is
// "If this read lands hard".

export const CRISIS_ETHICAL_GUARDRAIL =
  "If this read lands hard, consider talking to someone — a therapist, a friend who knows you well. The instrument is a mirror, not a clinician; some kinds of weight need company to carry.";

// Standing reminder appended at the end of crisis-class reports —
// elevated visible treatment. Same content as the per-paragraph guard,
// re-stated as a general standing note.
export const CRISIS_STANDING_REMINDER =
  "This report is a mirror, not a clinical assessment. If anything in it lands hard, please talk with a therapist or someone who knows you well. Some kinds of weight need company to carry.";

// Body-card top-of-section hedge for crisis-class users.
export const CRISIS_BODY_CARD_HEDGE =
  "These cards describe shape characteristics that may not feel applicable in a hard season. Hold them lightly.";

// Movement section hedge — replaces the trajectory-degree line.
export const CRISIS_MOVEMENT_HEDGE =
  "The trajectory framework the report normally uses doesn't fully apply to this read. See the Path/Gait section for what the read is naming.";

// ─────────────────────────────────────────────────────────────────────
// Banned clinical phrases — hard-fail in crisis prose
// ─────────────────────────────────────────────────────────────────────

export interface BannedClinicalRule {
  pattern: RegExp;
  reason: string;
}

export const BANNED_CLINICAL_PHRASES: ReadonlyArray<BannedClinicalRule> = [
  { pattern: /\bdepression\b/i, reason: "clinical diagnosis" },
  { pattern: /\bdepressed\b/i, reason: "clinical diagnosis" },
  { pattern: /\banxiety\b/i, reason: "clinical diagnosis" },
  { pattern: /\btrauma\b/i, reason: "clinical diagnosis" },
  { pattern: /\bPTSD\b/, reason: "clinical diagnosis" },
  { pattern: /\bdissociation\b/i, reason: "clinical diagnosis" },
  { pattern: /\bdissociating\b/i, reason: "clinical diagnosis" },
  { pattern: /\bburnout\b/i, reason: "clinical-sense burnout" },
  { pattern: /\bmental health crisis\b/i, reason: "clinical claim" },
  { pattern: /\bsuicidal\b/i, reason: "clinical claim" },
  { pattern: /\bsuicidal ideation\b/i, reason: "clinical claim" },
];

// Open-hands / grip-loosening framing — banned in crisis prose because
// it presupposes there's a hand-holding the right thing. Crisis prose
// names that the hand may not be holding the right thing yet.
export const BANNED_OPEN_HANDS_PHRASES: ReadonlyArray<BannedClinicalRule> = [
  { pattern: /\bloosen the grip\b/i, reason: "open-hands framing inappropriate to crisis register" },
  { pattern: /\bopen hand\b/i, reason: "open-hands framing inappropriate to crisis register" },
  { pattern: /\brelease the grip\b/i, reason: "open-hands framing inappropriate to crisis register" },
  { pattern: /\blet go of the grip\b/i, reason: "open-hands framing inappropriate to crisis register" },
];

// Hedging-language detection — every crisis paragraph must contain at
// least one of these or equivalent.
export const HEDGING_PATTERNS: ReadonlyArray<RegExp> = [
  /\bone possible map\b/i,
  /\bnot a verdict\b/i,
  /\bif it doesn['']t fit\b/i,
  /\bpossible map\b/i,
  /\bif this doesn['']t land\b/i,
  /\bif this read doesn['']t fit\b/i,
];

// ─────────────────────────────────────────────────────────────────────
// Per-flavor rubric exemplars (embedded in system prompts)
// ─────────────────────────────────────────────────────────────────────
//
// These match the canonical rubric prose from the CC prompt verbatim.
// Each exemplar names the pattern without diagnosing, refuses the
// trajectory framework, offers a real (small) next move, and closes
// with the ethical guardrail.

export const CRISIS_RUBRIC_LONGING_WITHOUT_BUILD = `Sometimes the grip is not what's pulling you off course. It's what you're reaching for because there is no course yet. The shape your answers describe is a system asking *Am I successful?* — wanting to land, wanting consequence, wanting the work to mean something. But the work-line in the read is thin right now: the building hasn't compounded into the shape the question is asking after.

This is not a verdict. It's a possible map. If it lands, the work isn't to loosen the grip — there's nothing yet to loosen onto. The work is to start with the smallest piece of the work that matters, and let it matter. Smaller than feels reasonable. The grip will quiet when there's something for it to hold.

${CRISIS_ETHICAL_GUARDRAIL}`;

export const CRISIS_RUBRIC_GRASP_WITHOUT_SUBSTANCE = `The shape your answers describe is a system asking *Am I loved?* — or *Am I wanted?* — and the relational line under the question is thinner than the question is asking after. The grip is reaching for a closeness the shape isn't yet supporting. That's not a failing of the asking; it's the asking happening before the line that would answer it has filled.

This is not a verdict. It's one possible map. If it lands, the work isn't to ask less. The work is to let one relationship be received before you ask it to prove itself. Let the smaller exchange land first. The grip will quiet when something has been actually let in.

${CRISIS_ETHICAL_GUARDRAIL}`;

export const CRISIS_RUBRIC_PARALYSIS = `The shape your answers describe is a system asking *Am I good enough?* — but the building the shame would discipline isn't there to be disciplined. The grip is real; the project the grip is for hasn't found you yet, or you haven't found your way back to it.

This read is one possible map. If it doesn't fit, the read is the wrong aim. If it does, the next move isn't a new plan. The next move is rest, or asking for help, before any new plan. The shame will reorganize when there's a smaller thing for it to attend to.

${CRISIS_ETHICAL_GUARDRAIL}`;

export const CRISIS_RUBRIC_WITHDRAWAL = `The shape your answers describe is a system asking *Am I safe?* — wanting the world to be quieter than it is. The trajectory framework the report normally uses asks where you're heading; right now the more honest read is that the line hasn't yet engaged. That's not failure. That's the shape of a season where re-engagement is the work.

This is one possible map. If it doesn't land, the read is the wrong aim. If it does, the next move is not refinement. It's re-engagement, smaller than feels reasonable. One real conversation. One commitment kept. One day where you do less and let yourself notice.

${CRISIS_ETHICAL_GUARDRAIL}`;

export const CRISIS_RUBRIC_RESTLESS_WITHOUT_ANCHOR = `The shape your answers describe is a system asking *Do I have purpose?* — and the search has stayed restless because no commitment has yet been small enough to stay with. The grip is purpose-shaped; the anchoring hasn't landed.

This is one possible map. If it lands, the work isn't to find the right calling first. The work is to commit to a smaller thing and let it teach you what the larger one would have asked. The reinvention loop quiets when something has been finished, not when something has been chosen.

${CRISIS_ETHICAL_GUARDRAIL}`;

export const CRISIS_RUBRIC_WORKING_WITHOUT_PRESENCE = `The shape your answers describe is a system asking *Am I good enough?* — and the answer your shape has been giving is more output, more building, more proving. The work-line is at full speed. The relational and soul-line haven't been able to keep up — or haven't been allowed to. This is the recognizable shape of a season where the answer to the question is "do more" and yet the question keeps firing, which is the read's way of telling you that output isn't the answer it's asking for.

This is one possible map. If it lands, the work isn't to slow the building down — that may not be available to you yet. The work is to find one place where being received matters more than being effective. One conversation. One small offering. The next move is asking, not producing.

${CRISIS_ETHICAL_GUARDRAIL}`;

// ─────────────────────────────────────────────────────────────────────
// Engine-fallback templates (deterministic, no LLM)
// ─────────────────────────────────────────────────────────────────────
//
// When the LLM API is unavailable, these templates produce a paragraph
// that is structurally correct (named flavor, refused trajectory frame,
// real next move, ethical guardrail) without the LLM's warmth.

const FALLBACK_TEMPLATES: Record<CrisisFlavor, string> = {
  "longing-without-build": `The read points at a hard pattern: the grip is reaching for consequence, and the work-line hasn't yet built the shape the question is asking after. This is not a verdict; it's one possible map. If it lands, the work is not to loosen the grip — there is nothing yet to loosen onto. The work is to start with the smallest piece of the work that matters, and let it matter. Smaller than feels reasonable.\n\n${CRISIS_ETHICAL_GUARDRAIL}`,
  "grasp-without-substance": `The read points at a hard pattern: the grip is reaching for closeness or recognition, and the relational line hasn't yet filled the shape the question is asking after. This is not a verdict; it's one possible map. If it lands, the work is to let one relationship be received before you ask it to prove itself. Let the smaller exchange land first.\n\n${CRISIS_ETHICAL_GUARDRAIL}`,
  paralysis: `The read points at a hard pattern: the grip is real, but the project the shame would discipline isn't there to be disciplined. This read is one possible map. If it doesn't fit, the read is the wrong aim. If it does, the next move isn't a new plan. The next move is rest, or asking for help, before any new plan.\n\n${CRISIS_ETHICAL_GUARDRAIL}`,
  withdrawal: `The read points at a hard pattern: the line hasn't yet engaged. This is not a verdict; it's one possible map of where you may be now. If it lands, the next move is not refinement. It's re-engagement, smaller than feels reasonable. One real conversation. One commitment kept. One day where you do less and let yourself notice.\n\n${CRISIS_ETHICAL_GUARDRAIL}`,
  "restless-without-anchor": `The read points at a hard pattern: the grip is purpose-shaped, and no commitment has yet been small enough to stay with. This is one possible map. If it lands, the work is not to find the right calling first. The work is to commit to a smaller thing and let it teach you what the larger one would have asked.\n\n${CRISIS_ETHICAL_GUARDRAIL}`,
  "working-without-presence": `The read points at a hard pattern: the work-line is at full speed, and the relational and soul-line haven't been able to keep up. The grip is being answered with more output, and yet the question keeps firing — diagnostic signature that output is the wrong answer. This is one possible map. If it lands, the work is to find one place where being received matters more than being effective. The next move is asking, not producing.\n\n${CRISIS_ETHICAL_GUARDRAIL}`,
};

export function crisisFallbackParagraph(flavor: CrisisFlavor): string {
  return FALLBACK_TEMPLATES[flavor];
}

// ─────────────────────────────────────────────────────────────────────
// Per-flavor closing-imperative tokens (for audit verification)
// ─────────────────────────────────────────────────────────────────────
//
// Each flavor's prose closes with an imperative that fits the flavor's
// register. The audit checks that the actual paragraph contains the
// canonical imperative or a near-verbatim equivalent.

export const FLAVOR_CLOSING_IMPERATIVE_TOKENS: Record<CrisisFlavor, ReadonlyArray<RegExp>> = {
  "longing-without-build": [
    /smallest piece of the work/i,
    /smaller than feels reasonable/i,
  ],
  "grasp-without-substance": [
    /let one relationship be received/i,
    /smaller exchange land first/i,
  ],
  paralysis: [
    /rest, or asking for help/i,
    /before any new plan/i,
  ],
  withdrawal: [
    /re-engagement/i,
    /smaller than feels reasonable/i,
  ],
  "restless-without-anchor": [
    /commit to a smaller thing/i,
  ],
  "working-without-presence": [
    /asking, not producing/i,
    /being received matters more than being effective/i,
  ],
};

// ─────────────────────────────────────────────────────────────────────
// Path-class register switching anchor block (for system prompts)
// ─────────────────────────────────────────────────────────────────────
//
// Anchor token: "Path-class register switching" — the audit checks both
// SYSTEM_PROMPTs contain this header verbatim.

export const PATH_CLASS_REGISTER_BLOCK = `# Path-class register switching

The user's report carries a \`pathClass\` of either "trajectory" or "crisis".

- TRAJECTORY: render the existing rubric — gift, growth-edge, practice, closing imperative, integrated paragraph. Use trajectory degree, age-band register, open-hands grip-loosening framing. The user is moving; the work is to refine aim.

- CRISIS: render the crisis rubric. Banned: trajectory degree-reading, open-hands framing ("loosen the grip", "open hand"), "growth edge" vocabulary, age-band trajectory work descriptions, clinical diagnostic terms ("depression," "anxiety," "trauma," "PTSD," "dissociation," "burnout"). Required: pattern naming without diagnosing, explicit hedging ("this is one possible map" / "not a verdict"), per-flavor closing imperative, ethical guardrail block ("If this read lands hard, consider talking to someone — a therapist, a friend who knows you well. The instrument is a mirror, not a clinician; some kinds of weight need company to carry.").

Crisis flavors and their registers:

- longing-without-build: the grip is reaching for consequence; the work isn't to loosen — it's to build. Closing: "smallest piece of the work that matters, smaller than feels reasonable."
- grasp-without-substance: the grip is reaching for love; the work is to find the source of the gap. Closing: "let one relationship be received before you ask it to prove itself."
- paralysis: shame without a project. Closing: "the next move is rest, or asking for help, before any new plan."
- withdrawal: movement collapse; the work is re-engagement, smaller than feels reasonable. Closing: "one real conversation. one commitment kept. one day where you do less and let yourself notice."
- restless-without-anchor: reinvention loop; commit to a smaller thing first. Closing: "commit to a smaller thing and let it teach you what the larger one would have asked."
- working-without-presence: Goal-pinned/Soul-collapsed; output is the wrong answer. Closing: "the next move is asking, not producing."

When \`pathClass === "crisis"\`, the trajectory framework does NOT apply. Do not render trajectory degree, do not use the 50° metaphor, do not invoke age-band trajectory work descriptions. The user is in a different framework; honor it.

The four-register flexibility on purpose still applies. Crisis prose still serves the "Why am I here?" question — it just answers it from a place where the user is asking a more foundational version of the question.

# Crisis-rubric exemplars

## longing-without-build

${CRISIS_RUBRIC_LONGING_WITHOUT_BUILD}

## grasp-without-substance

${CRISIS_RUBRIC_GRASP_WITHOUT_SUBSTANCE}

## paralysis

${CRISIS_RUBRIC_PARALYSIS}

## withdrawal

${CRISIS_RUBRIC_WITHDRAWAL}

## restless-without-anchor

${CRISIS_RUBRIC_RESTLESS_WITHOUT_ANCHOR}

## working-without-presence

${CRISIS_RUBRIC_WORKING_WITHOUT_PRESENCE}`;
