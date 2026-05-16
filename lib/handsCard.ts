// CC-HANDS-CARD — 9th body card: Hands / Work.
//
// Canon (2026-05-11): "Hands is what your life makes real. Work Map is
// where that making may fit."
//
// Hands is the existential Goal-axis card. Distinct from the Work Map
// vocational appendix. Composes from 8 input sources:
//   1. Goal score / Goal drivers   (primary substrate)
//   2. CostStrength                (substance of building register)
//   3. Q-A1 / Q-A2                 (activity + energy allocation)
//   4. Q-GS1                       (what makes effort feel worth it)
//   5. Q-V1                        (work-meaning signals)
//   6. Gift category               (kind of building)
//   7. Lens driver                 (how building happens)
//   8. Grip interaction            (dual-mode read: health vs pressure)
//
// Dual-mode read is the novel feature: every Hands reading carries
// `underPressure.healthRegister` AND `underPressure.pressureRegister`
// as distinct prose. The other 8 body cards have single-register
// reads; Hands names the difference between what builds in health
// and what builds under stress.
//
// V1 is deterministic / templated. Future CC may add LLM enhancement.
// Pure data — no API calls, no `node:*` imports.

import type { GiftCategory } from "./types";
import type { ProfileArchetype } from "./profileArchetype";
import type { GripPatternKey } from "./gripPattern";

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export interface HandsCardReading {
  /** Opening line — health register, shape-specific. */
  openingLine: string;
  /** What they naturally build (Strength block). */
  strength: string;
  /** Where building overshoots (Growth Edge block). */
  growthEdge: string;
  /** Dual-mode read: health vs pressure prose. */
  underPressure: {
    healthRegister: string;
    pressureRegister: string;
    integrationLine: string;
  };
  /** Concrete next move. */
  practice: string;
  /** How Hands relates to Goal/Soul/Aim/Grip for this shape. */
  movementNote: string;
  /** Path-style closing proverb. */
  closingLine: string;
  /** Diagnostic — which inputs fired. */
  rationale: string;
}

export interface HandsCardInputs {
  archetype: ProfileArchetype;
  gripPatternBucket: GripPatternKey;
  goalScore: number;
  costStrength: number;
  topGiftCategory: GiftCategory | null;
  lensDriver: string;
  qA1Activity: string | null;
  qA2EnergyDirection: string | null;
  qGS1TopReward: string | null;
  qV1TopMeaning: string | null;
  // CC-086 Site 1 — Compass signal ids (top-N priority labels) used
  // by the driver/archetype consistency check as a secondary signal.
  // Optional so pre-CC callers continue to compile; absent when
  // omitted, the override falls back to driver-only routing.
  topCompassSignalIds?: string[];
}

// ─────────────────────────────────────────────────────────────────────
// Archetype-routed template families
// ─────────────────────────────────────────────────────────────────────

type Template = {
  opening: string;
  strength: string;
  growthEdge: string;
  healthRegister: string;
  pressureRegister: string;
  integrationLine: string;
  practice: string;
  movementNote: string;
  closing: string;
};

const TEMPLATES: Record<ProfileArchetype, Template> = {
  jasonType: {
    opening:
      "You tend to build structural frameworks that hold what you've seen — the long-arc systems that turn pattern into form.",
    strength:
      "Your hands make architecture. You see the structure before others have named the problem, and the building you do is the form your insight takes. The work is not output for its own sake — it's the conviction made revisable.",
    growthEdge:
      "The architect's risk is mastery becoming a refusal to ship. Structure that won't update, refinement that won't release. When the building becomes a proof of sufficiency, the structure starts serving the question instead of the work.",
    healthRegister:
      "In health, you build to make truth more usable. The structure is a vehicle, not a verdict — you let what you've made be revised by what you discover next.",
    pressureRegister:
      "Under pressure, the building becomes mastery-as-control. The structure won't ship until perfect, and \"perfect\" keeps moving. The work stays in your hands because letting it go feels like letting the question go unanswered.",
    integrationLine:
      "The difference is whether the structure is in service of what you're carrying, or whether you're carrying the structure to keep the question from arriving.",
    practice:
      "Pick one structure you've been refining past usefulness and ship it in its current state. Let revision happen in the open, after release, rather than under your hand alone.",
    movementNote:
      "Hands sits on the Goal axis; for an architect shape, high Goal substance + high Aim produces the building that lasts. Grip drag here looks like over-refinement; the corrective is shipping into feedback.",
    closing:
      "The work is to translate conviction into visible, revisable, present-tense structure.",
  },
  cindyType: {
    opening:
      "You tend to build the relational continuity that lets people feel kept — care made concrete through repeated presence.",
    strength:
      "Your hands make continuity. You build the day-by-day form that lets the people in your life feel held: meals, calls, the room arranged so what they need is already there. The building is love made operationally durable.",
    growthEdge:
      "The caregiver's risk is care becoming self-erasure. The structure runs even when no one's asking it to. When being needed becomes the only register where you feel real, the building starts protecting you from a question you haven't asked yourself.",
    healthRegister:
      "In health, you build care that is sustainable enough to last — care with a spine, not care that collapses you into the form. The continuity is something you can step back from without it falling.",
    pressureRegister:
      "Under pressure, the building becomes responsiveness-as-collapse. You over-extend; structures keep running even when no one's asking; presence becomes the place where your own shape disappears. The making continues because stopping would feel like withdrawal.",
    integrationLine:
      "The difference is whether the care has a body that can rest, or whether the care has become the only body you let yourself have.",
    practice:
      "Name one thing you currently keep running for others that has become a shape you can't step out of. Practice letting it lapse for a defined window and seeing what holds.",
    movementNote:
      "Hands sits on the Goal axis; for a caregiver shape, high Soul-substance funnels into Goal-axis output through service. Grip drag here looks like care-as-self-erasure; the corrective is letting love become sustainable enough to last.",
    closing:
      "The work is not to care less. It is to let love become sustainable enough to last.",
  },
  danielType: {
    opening:
      "You tend to build operational systems that hold across time — the precedent and structure that keeps the institution working.",
    strength:
      "Your hands make stewardship. You build what others can step into and find functioning — the standard followed, the precedent honored, the system that doesn't ask you to invent it every morning. The building is faithful continuity made operational.",
    growthEdge:
      "The steward's risk is governance becoming non-delegation. Continuity becomes control; precedent becomes verdict; the system you carry becomes one you can't let anyone else touch. When the stewardship can't update, the building starts protecting the past instead of serving the present.",
    healthRegister:
      "In health, you build structures that hold what was given you to keep — and you let what you've built remain alive enough to update. The continuity is in service of what's worth carrying forward, not of the carrying itself.",
    pressureRegister:
      "Under pressure, the building becomes responsibility-as-non-delegation. The standard tightens; the precedent calcifies; the load stays on your shoulders because letting others touch it feels like betraying what was entrusted. The structure can no longer move.",
    integrationLine:
      "The difference is whether what has endured is being kept alive, or whether the keeping has become its own justification.",
    practice:
      "Pick one operational structure you currently steward alone and identify one specific update or delegation that has been deferred. Make the update or hand off the delegation; let the system show whether it can hold.",
    movementNote:
      "Hands sits on the Goal axis; for a steward shape, high Goal substance + Faith-anchored Compass produces durable institutional building. Grip drag here looks like rigidity; the corrective is letting what has endured remain alive enough to update.",
    closing:
      "The work is not to abandon what has endured. It is to let what has endured remain alive enough to update.",
  },
  unmappedType: {
    opening:
      "What you build is a specific shape — the form your effort takes when it has somewhere to land.",
    strength:
      "Your hands make something real. The exact register depends on which gift fires for you most often and which question your work is answering — but the substance is there, and the building does happen.",
    growthEdge:
      "The risk of any building register is the work becoming a stand-in for the question underneath it. When output starts answering something it cannot actually answer, the building becomes a protection rather than an expression.",
    healthRegister:
      "In health, your building serves what you actually value — the work is a way of making the inside legible to the world.",
    pressureRegister:
      "Under pressure, the same building can become defensive output: producing to prove rather than producing to express. The activity is the same; the register is different.",
    integrationLine:
      "The difference is whether you are working toward something or away from something.",
    practice:
      "Notice the next time you start building under load. Ask whether the work is moving toward what you want it to mean, or away from what would happen if you stopped.",
    movementNote:
      "Hands sits on the Goal axis. The interaction with Soul, Aim, and Grip shapes whether the building integrates with the rest of the life or becomes the place where pressure shows up first.",
    closing:
      "Hands is what your life makes real. Work Map is where that making may fit.",
  },
};

// ─────────────────────────────────────────────────────────────────────
// Composer
// ─────────────────────────────────────────────────────────────────────

// CC-086 Site 1 — driver/archetype consistency check.
//
// The Hands card TEMPLATES are keyed by ProfileArchetype, but the
// archetype router occasionally lands sessions whose driver function
// disagrees with the archetype's coded template (Kevin: Se driver +
// Faith compass routed to cindyType caregiver in prod). When the
// driver-shape and archetype-shape disagree, the driver-aligned
// `unmappedType` general template is more honest than asserting a
// caregiver/steward/architect frame the dominant function doesn't
// support.
//
// Caregiver template (cindyType) is driver-coded for Fe + Fi (relational
// presence); steward template (danielType) is driver-coded for Si
// (continuity-of-form); architect template (jasonType) is driver-coded
// for Ni + Te + Ti (long-arc / structure / systems). When archetype
// asserts one of these but the driver isn't on its list, fall through
// to the unmapped template.
const CAREGIVER_DRIVERS = new Set(["fe", "fi"]);
const STEWARD_DRIVERS = new Set(["si"]);
const ARCHITECT_DRIVERS = new Set(["ni", "te", "ti"]);
// Compass anchors that, when present in the user's top Compass, keep
// the caregiver template valid even with a non-caregiver driver. The
// CC's example: Cindy-shape sessions with Se driver + Family compass
// SHOULD stay on the caregiver template (it's the Compass alignment
// that makes caregiver correct). Kevin's Se driver + Faith compass
// has no caregiver-compass alignment, so it falls through to unmapped.
const CAREGIVER_COMPASS_ANCHORS = new Set([
  "family_priority",
  "compassion_priority",
  "mercy_priority",
  "loyalty_priority",
]);
const STEWARD_COMPASS_ANCHORS = new Set([
  "stability_priority",
  "honor_priority",
  "faith_priority",
]);
const ARCHITECT_COMPASS_ANCHORS = new Set([
  "knowledge_priority",
  "truth_priority",
]);

function compassSupportsArchetype(
  archetype: ProfileArchetype,
  topCompassSignalIds: string[] | undefined
): boolean {
  if (!topCompassSignalIds || topCompassSignalIds.length === 0) return false;
  const set =
    archetype === "cindyType"
      ? CAREGIVER_COMPASS_ANCHORS
      : archetype === "danielType"
        ? STEWARD_COMPASS_ANCHORS
        : archetype === "jasonType"
          ? ARCHITECT_COMPASS_ANCHORS
          : null;
  if (!set) return false;
  return topCompassSignalIds.some((s) => set.has(s));
}

function resolveTemplateArchetype(
  archetype: ProfileArchetype,
  lensDriver: string,
  topCompassSignalIds: string[] | undefined
): ProfileArchetype {
  const d = lensDriver.toLowerCase();
  const driverSet =
    archetype === "cindyType"
      ? CAREGIVER_DRIVERS
      : archetype === "danielType"
        ? STEWARD_DRIVERS
        : archetype === "jasonType"
          ? ARCHITECT_DRIVERS
          : null;
  if (driverSet === null) return archetype;
  if (driverSet.has(d)) return archetype;
  // Driver disagrees with archetype. Per CC-086 Site 1: keep the
  // archetype template when the Compass top supports it (lived
  // pattern signals align even when the driver doesn't); fall back
  // to unmapped when neither driver nor compass supports the
  // archetype's coded template.
  if (compassSupportsArchetype(archetype, topCompassSignalIds)) {
    return archetype;
  }
  return "unmappedType";
}

export function computeHandsCard(inputs: HandsCardInputs): HandsCardReading {
  const {
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
  } = inputs;
  const templateArchetype = resolveTemplateArchetype(
    archetype,
    lensDriver,
    inputs.topCompassSignalIds
  );
  const t = TEMPLATES[templateArchetype] ?? TEMPLATES.unmappedType;

  // Diagnostic rationale — names the inputs that fired.
  const rationaleParts = [
    `archetype=${archetype}`,
    `templateArchetype=${templateArchetype}`,
    `gripPattern=${gripPatternBucket}`,
    `goalScore=${goalScore.toFixed(0)}`,
    `costStrength=${costStrength.toFixed(0)}`,
    `gift=${topGiftCategory ?? "(none)"}`,
    `lens=${lensDriver}`,
    `Q-A1=${qA1Activity ?? "(unset)"}`,
    `Q-A2=${qA2EnergyDirection ?? "(unset)"}`,
    `Q-GS1=${qGS1TopReward ?? "(unset)"}`,
    `Q-V1=${qV1TopMeaning ?? "(unset)"}`,
  ];

  return {
    openingLine: t.opening,
    strength: t.strength,
    growthEdge: t.growthEdge,
    underPressure: {
      healthRegister: t.healthRegister,
      pressureRegister: t.pressureRegister,
      integrationLine: t.integrationLine,
    },
    practice: t.practice,
    movementNote: t.movementNote,
    closingLine: t.closing,
    rationale: rationaleParts.join("; "),
  };
}
