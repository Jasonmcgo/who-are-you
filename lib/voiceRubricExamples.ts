// CC-VOICE-RUBRIC-EXPANSION — Si/Se/Ti/Fi driver rubric examples for the
// LLM prose layer.
//
// The synthesis3 + grip prompts inherited a rubric library that was
// dominated by Ni/Te/Fe driver examples (Jason's INTJ canonical, the
// stewardship register, the room-reader register). When the LLM
// generates prose for an Si/Se/Ti/Fi-driver user, it averages toward
// those existing rubrics — the output is "almost right but feels off."
//
// This module supplies four canonical driver-register exemplars:
//   Si — precedent-keeper (continuity, what holds, what doesn't drift)
//   Se — present-tense (immediate competence, embodied action)
//   Ti — coherence-prober (internal consistency, precision as integrity)
//   Fi — inner-compass (authenticity, what stays itself under pressure)
//
// Each rubric is sourced from cohort-validated cache prose (ocean/24,
// ocean/25, ocean/26, goal-soul-give/01) — see source attributions
// inline. These are NOT newly drafted; they are register exemplars
// that already passed the wedding-readout test, the banned-vocab list,
// and the canon-phrases-preserved audit on a prior generation pass.
//
// Pure data — no API calls, no SDK, no `node:*` imports.

import type { CognitiveFunctionId } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Driver-register exemplars
// ─────────────────────────────────────────────────────────────────────

// Source: ocean/24-si-precedent-keeper.json (cached prose, post-CC-AGE-CALIBRATION).
// Register signature: precedent-checking, "the form that survives you,"
// continuity-as-care, "structure that holds when no one is watching."
export const SI_DRIVER_RUBRIC = `Inputs: Lens dominant Si (precedent-checker), Compass top Family/Stability/Faith/Honor, Movement Goal-leaning long, Risk Form Free movement.

Output:

You read the room and check the precedent — not because you hold the past as sacred, but because you're building what wasn't given. Family is not inheritance; it's construction. What you protect is continuity itself: the form that survives you, the structure that holds when no one is watching. This is love that becomes a reliable form others can count on.

The trap is that the same instrument can become the governor that never rests. The people close to you can count on the structure; they may not always know you see them inside it.

The work now is not more building. It is letting what you've built become visibly generous. Let presence develop a memory. The tradition you made hour by hour does not need you to keep making it. It needs you to name it, so the people inside it know what they've been given.

Why this lands as Si: continuity / precedent-checking / "the form that survives you" / reliable-form metaphor. NOT "long arc" / "foresight" / "the pattern" (those are Ni-flavored). The Si register reaches for what holds across repetition, not what reveals across pattern.`;

// Source: goal-soul-give/01-generative.json (cached prose).
// Register signature: present-tense responsiveness, "the hand extended,
// the meal made," embodied-action vocabulary, immediacy.
export const SE_DRIVER_RUBRIC = `Inputs: Lens dominant Se (present-tense self), Compass top Compassion/Family, Movement Generative quadrant.

Output:

You move through the world by feeling what is needed and meeting it directly. Care is not theoretical for you — it arrives as response: the hand extended, the meal made, the presence held steady when someone needs steadying. This is the early shape of giving, and it is real work even when it looks like instinct.

What you protect is Compassion, but the instrument that protects can also scatter. You sense what people need, and you answer. The danger is that care without boundaries becomes care without form — generous motion that exhausts itself because it never says no.

The growth is not to care less. It is to let care develop structure — concrete care with enough structure to last beyond the moment. The people who love you do not need you depleted. They need you present, which requires you to stay intact.

Why this lands as Se: present-tense ("arrives as response"), embodied-action ("the hand extended, the meal made"), immediacy of sensing-and-responding. NOT "the trajectory" / "strategic-architectural" framing (Te-flavored). The Se register reaches for what's actually happening right now, not what builds across time.`;

// Source: ocean/25-ti-coherence-prober.json (cached prose).
// Register signature: internal-consistency testing, "you don't borrow
// positions, you test them," coherence-as-discipline.
export const TI_DRIVER_RUBRIC = `Inputs: Lens dominant Ti (coherence-prober), Compass top Knowledge, Movement Goal-leaning, Risk Form Reckless-fearful → Grip-governed.

Output:

You build frameworks that make truth navigable — not softer, but more usable. The work is real: you don't borrow positions, you test them against internal coherence until they hold. What lands with you is Knowledge, and the structure you're building protects it from noise, keeps it from collapsing under sentiment or expedience. This is direction-establishing work; the Goal dominance is honest to the season.

The trap is that the coherence you're checking is mostly your own. The frameworks hold — but they may be holding against imagined objections rather than real ones. What's gripping you now is the need to be right before you've been tested.

The growth is not more rigor. It's exposing one conviction to the discipline of someone who'd disagree with it for reasons you respect. Let the framework meet resistance it can't predict.

Why this lands as Ti: internal-consistency vocabulary ("test them against internal coherence"), discipline-of-precision metaphor ("coherence you're checking"), the read earns its conclusion. NOT "excellence" / "consequence" / "achievement" framing (Te-flavored). The Ti register reaches for what holds up to scrutiny, not what produces visible result.`;

// Source: ocean/26-fi-inner-truth-anchor.json (cached prose).
// Register signature: weighed-personally, "tested, made your own,"
// authenticity-as-conviction, what stays itself under pressure.
export const FI_DRIVER_RUBRIC = `Inputs: Lens dominant Fi (inner compass), Compass top Compassion/Honor, Movement consolidated.

Output:

You move with conviction that has been weighed personally, and that changes the shape of what you're willing to carry. When the belief is yours — tested, made your own — you will bear real cost for it. When it travels through the group but hasn't passed through your own examination, the register reads more thinly. You know this about yourself, even if you haven't said it plainly yet.

What you protect is Compassion — not as feeling, but as concrete care with enough structure to last beyond the moment. You build for individuals, and you carry authority without needing to announce it.

The gift and the danger share the same root: you can move freely because conviction governs from the inside. The work now is not to choose between what you've built and what you carry underneath it. The work is to let the care that has always been present become visible in the structure itself — to weave Soul through the form so the people you serve can see both at once.

Why this lands as Fi: weighed-personally ("tested, made your own"), governs-from-the-inside metaphor, refusal-to-perform register, authenticity-under-pressure as the architectural anchor. NOT "what others experience" / "room-shaping" framing (Fe-flavored). The Fi register reaches for what stays itself when the room shifts, not what attunes to what the room needs.`;

// ─────────────────────────────────────────────────────────────────────
// Driver-register hints (passed through user prompts)
// ─────────────────────────────────────────────────────────────────────

const SI_HINT =
  "Driver register: Si (precedent-keeper). Lean toward continuity, reliable form, what holds. Avoid 'long arc' / 'foresight' (Ni vocabulary).";
const SE_HINT =
  "Driver register: Se (present-tense). Lean toward immediate competence, embodied action. Avoid strategic-architectural framing (Te vocabulary).";
const TI_HINT =
  "Driver register: Ti (coherence-prober). Lean toward internal consistency, precision as integrity. Avoid 'excellence' / 'consequence' framing (Te vocabulary).";
const FI_HINT =
  "Driver register: Fi (inner-compass). Lean toward authenticity, what stays itself under pressure. Avoid 'attunement' / 'room-shaping' framing (Fe vocabulary).";

export function driverRegisterHint(
  dominant: CognitiveFunctionId
): string | null {
  switch (dominant) {
    case "si":
      return SI_HINT;
    case "se":
      return SE_HINT;
    case "ti":
      return TI_HINT;
    case "fi":
      return FI_HINT;
    case "ni":
    case "ne":
    case "te":
    case "fe":
      return null;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Anchor block — assembled rubric expansion section for system prompts
// ─────────────────────────────────────────────────────────────────────
//
// The audit anchor token is "Driver-register rubric expansion" — both
// SYSTEM_PROMPTs must contain this header.

export const VOICE_RUBRIC_EXPANSION_BLOCK = `# Driver-register rubric expansion

The following rubric examples represent driver-function register variety. When the user's lens_stack.dominant matches one of these drivers, lean toward the register signature shown.

## Si driver — precedent-keeper register

${SI_DRIVER_RUBRIC}

## Se driver — present-tense register

${SE_DRIVER_RUBRIC}

## Ti driver — coherence-prober register

${TI_DRIVER_RUBRIC}

## Fi driver — inner-compass register

${FI_DRIVER_RUBRIC}

These registers are signatures, not strict vocabulary rules. Same warmth diagnostic, same wedding-readout test, same banned-phrase lists. The driver register changes WHAT the prose reaches for; the architectural framing (product thesis, religious register, age band, Aim register) stays.`;

// ─────────────────────────────────────────────────────────────────────
// Register-marker tokens (audit reference)
// ─────────────────────────────────────────────────────────────────────
//
// Canonical register markers per driver. The audit's cohort-shift
// assertion checks for the presence of at least one marker per
// driver-shape fixture. These are FUZZY signals — they catch whether
// the LLM reached for the right register, not whether it used a
// specific phrase.

export const SI_REGISTER_MARKERS: ReadonlyArray<string> = [
  "what holds",
  "doesn't drift",
  "doesn't drop",
  "reliable form",
  "continuity",
  "precedent",
  "the form that survives",
  "tradition",
];

export const SE_REGISTER_MARKERS: ReadonlyArray<string> = [
  "the hand extended",
  "what is needed",
  "meeting it directly",
  "arrives as response",
  "presence held steady",
  "right now",
  "the moment requires",
];

export const TI_REGISTER_MARKERS: ReadonlyArray<string> = [
  "internal coherence",
  "internal consistency",
  "earns its conclusion",
  "borrow positions",
  "test them",
  "doesn't round off",
  "precision",
];

export const FI_REGISTER_MARKERS: ReadonlyArray<string> = [
  "weighed personally",
  "made your own",
  "stays itself",
  "governs from the inside",
  "tested",
  "your own examination",
  "what is yours",
];
