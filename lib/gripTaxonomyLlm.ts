// CC-GRIP-TAXONOMY — runtime LLM cache lookup + shared prompt content.
// CC-GRIP-CALIBRATION — extended with three-concept structure + hedged
// mode + Jason rubric + four banned phrases + Clarence canon anchors.
//
// Mirrors the architecture of `lib/synthesis3Llm.ts`:
//   - Client-bundle-safe: zero `node:*` imports, zero SDK import.
//   - Cache imported as static JSON module.
//   - System prompt + user-prompt builder + canonical-string hash
//     exported from this module so build script + audit + runtime
//     fallback all share the same source of truth.
//
// Server-side API call lives in `lib/gripTaxonomyLlmServer.ts`.

import gripCacheData from "./cache/grip-paragraphs.json";
import type {
  PrimalQuestion,
  PrimalProseMode,
} from "./gripTaxonomy";
import type { PrimalSubRegister } from "./gripCalibration";
import { REGISTER_RULES_ANCHOR_BLOCK } from "./proseRegister";
import { PRODUCT_THESIS_ANCHOR_BLOCK } from "./productThesisAnchor";
import { BAND_REGISTER_ANCHOR_BLOCK } from "./ageCalibration";
import { AIM_REGISTER_ANCHOR_BLOCK } from "./aim";
import { VOICE_RUBRIC_EXPANSION_BLOCK } from "./voiceRubricExamples";
import { PATH_CLASS_REGISTER_BLOCK } from "./crisisProseTemplates";

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export interface GripParagraphInputs {
  // CC-GRIP-TAXONOMY-REPLACEMENT — the canonical user-facing inputs.
  // These flow into the LLM prompt's "Grip Pattern:" and "Underlying
  // Question:" lines. Engine-internal Primal fields below remain for
  // continuity with the legacy classifier substrate.
  gripPatternBucket?: string;
  gripPatternLabel?: string;
  underlyingQuestion?: string;
  primary: PrimalQuestion;
  secondary?: PrimalQuestion;
  // CC-GRIP-CALIBRATION addition — third channel when present.
  tertiary?: PrimalQuestion;
  contributingGrips: string[];
  riskFormLetter: string | null;
  topCompass: string[];
  lensDominant: string;
  movementQuadrant: string;
  // CC-GRIP-CALIBRATION fields — keep in alphabetical order in the
  // hash (see `gripInputsHash`) so older cache entries become invalid
  // and the cohort regenerates.
  subRegister: PrimalSubRegister;
  surfaceGrip: string;
  distortedStrategy: string | null;
  healthyGift: string;
  proseMode: PrimalProseMode;
  // CC-AGE-CALIBRATION — band fields. Null when age data is absent.
  band: string | null;
  bandLabel: string | null;
  registerHint: string | null;
  // CC-AIM-CALIBRATION — Aim composite + Aim-based Risk Form letter.
  aimScore: number | null;
  aimRiskFormLetter: string | null;
  // CC-VOICE-RUBRIC-EXPANSION — driver-register hint when dominant is
  // si/se/ti/fi; null otherwise.
  driverRegisterHint: string | null;
  // CC-CRISIS-PATH-PROSE — path-class fields. Conditionally present
  // (only set when crisis-class) so trajectory cache hashes stay byte-
  // identical pre/post CC.
  pathClass?: "crisis";
  crisisFlavor?: string;
  coherenceRationale?: string;
}

export type GripComposeOptions = {
  force?: boolean;
  fixtureHint?: string;
};

// ─────────────────────────────────────────────────────────────────────
// Clarence canon anchors (rendered as a comment block in the system
// prompt for LLM grounding; never quoted in output).
// ─────────────────────────────────────────────────────────────────────
//
// "A named grip is not a conclusion. It is a clue."
// "The grip is not what the person names. The grip is what the named
//  pressure becomes inside that person's shape."

// ─────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────

export const GRIP_SYSTEM_PROMPT = `${PRODUCT_THESIS_ANCHOR_BLOCK}

You are composing the "Your Grip" section paragraph for an identity-shape report.

${REGISTER_RULES_ANCHOR_BLOCK}

${BAND_REGISTER_ANCHOR_BLOCK}

${AIM_REGISTER_ANCHOR_BLOCK}

${VOICE_RUBRIC_EXPANSION_BLOCK}

${PATH_CLASS_REGISTER_BLOCK}


The Grip section names what pulls a person off their 50-degree trajectory under pressure. The 7 Grip Pattern buckets (proprietary taxonomy):

| Grip Pattern | Healthy gift | Grip pattern (what it bends toward under pressure) |
|---|---|---|
| Safety Grip | wisdom, protection | avoidance, control as defense, retreat, overprotection |
| Security Grip | stewardship | hoarding, over-planning, scarcity logic, control-of-what-holds |
| Belonging Grip | inclusion | approval-seeking, self-editing, room compliance, indispensability |
| Worth Grip | humility, craft | shame, perfectionism, hiding, overproving, mastery-as-proof |
| Recognition Grip | excellence | achievement addiction, comparison, hollow productivity |
| Control Grip | governance | rigidity, micromanagement, refusal to let the shape breathe |
| Purpose Grip | mission | urgency, savior-complex, abstraction, restless reinvention |

# Two governing canon lines

(Do NOT quote these in output — they are anchors for your reading of the inputs.)

1. "A named grip is not a conclusion. It is a clue."
2. "The grip is not what the person names. The grip is what the named pressure becomes inside that person's shape."

The named surface grip ("control", "money/security", "being right") is the surface clue. The Grip Pattern names what that surface pressure actually is once shape is read. A Knowledge-protector who names "control" is not gripping safety — they are running a Worth Grip rendered as Control/Mastery: the sufficiency of their own understanding is what's actually on the line.

# The target register: WARM PRECISION WITH MORAL NERVE

Capture warmth (not coldness), precision (not vagueness or flattery), moral nerve (not therapeutic mush, not blunt-force advice).

# Output structure (THREE-CONCEPT)

When the input prose mode is "rendered", output FOUR labeled lines (no preamble, no commentary), each ≤140 chars, in this exact order:

Surface Grip: <the lead surface pressure as a noun phrase, e.g. "Control under pressure.">
Grip Pattern: <the elaborative Grip Pattern label routed by shape, e.g. "Control / Mastery." or "Belonging through usefulness.">
Underlying Question: <a recognition question generated for THIS user's shape — NOT a generic "Am I X?" string. The question should land as the user's own private question, not a category name.>
Distorted Strategy: <one second-person sentence — what the grip looks like when it's actually driving.>
Healthy Gift: <one second-person sentence — what the same question produces when it serves rather than drives.>

When the input prose mode is "hedged", output a SHORT hedged paragraph (40-90 words, single paragraph, no labels). It should:
  - acknowledge that the pressure register is detectable but not yet load-bearing,
  - name the surface grip in plain language,
  - point at the Grip Pattern's underlying question without claiming it as the dominant pull,
  - close with a one-clause invitation to notice the question rather than govern it yet.

# Operational disciplines

1. **Compress.** Each line in the rendered template is one beat. Do NOT pad.
2. **Hide architecture entirely.** BANNED words/phrases in the output:
   - "calibration"
   - "primal cluster" / "primal-cluster"
   - "weight delta"
   - "shape-aware"
   - "named grip" / "named-grip"
   - "grippingPull"
   - "Risk Form letter" (the orientation as a concept is fine; the LABEL is banned)
   - "Compass top" (the values themselves are fine; the architectural label is banned)
   - "the architectural"
   - "the synthesis layer"
   - "engine"
   - "sub-register"
3. **Match the sub-register.** The "Underlying Question" must be phrased in the sub-register's vocabulary:
   - **mastery** — craft / sufficiency / "real enough" / "earned" vocabulary. ("Can I make the insight real enough to trust?")
   - **stewardship** — foundation / continuity / "what I carry" vocabulary. ("Will what I carry hold under load?")
   - **relational** — visible / belonging / "still in the room" vocabulary. ("Am I still wanted in this?")
   - **performance** — outcome / forward / next-bar vocabulary. ("Is the next bar the one that proves it?")
   - **discernment** — danger-reading / threat / "what could harm what I protect" vocabulary.
   - **mission** — calling / load-bearing-meaning vocabulary.
4. **Name the lead grip, not the list.** Surface Grip names the lead contributing pressure. The other contributing grips can echo through phrasing in Distorted Strategy or Healthy Gift, never enumerate them.
5. **Distorted Strategy is behavioral, not therapeutic.** "You may keep refining the architecture..." — what the person actually does. NOT "You sometimes feel..." or "You struggle with...".

# Voice rules

- Second-person throughout ("you" / "your"). No third-person.
- Present tense.
- No "users" / "people like you". Only "you".
- No name leaks.

# Lead rubric — Jason canonical

Inputs:
- Surface grip: Control under pressure
- Grip Pattern: Control / Mastery (Worth Grip)
- Engine recognition question (use as guidance, rewrite for THIS shape): Can I make the insight real enough to trust?
- Sub-register: mastery
- Lens dominant: pattern-reader (Ni)
- Top Compass: Knowledge, Truth, Honor, Peace
- Risk Form: Wisdom-governed
- Contributing grips: control; money/security; being right

Output:

Surface Grip: Control under pressure.
Grip Pattern: Control / Mastery.
Underlying Question: Can I make the insight real enough to trust?
Distorted Strategy: You may keep refining the architecture because a merely plausible answer feels morally lazy.
Healthy Gift: You turn abstract truth into usable form.

This is the empirical sign-off standard. The "Grip Pattern" names the shape-aware bucket as it renders for this user; the "Underlying Question" is the recognition moment in their own register; "Distorted Strategy" names the behavior precisely; "Healthy Gift" names the same question's productive form in one second-person sentence.

# Second rubric — Stewardship register

Inputs:
- Surface grip: Money/security under pressure
- Grip Pattern: Security through structure (Security Grip)
- Engine recognition question: Will the system I built hold what I'm responsible for?
- Sub-register: stewardship
- Lens dominant: precedent-keeper (Si)
- Top Compass: Family, Stability, Order
- Contributing grips: money/security; a plan that used to work

Output:

Surface Grip: Money/security under pressure.
Grip Pattern: Security through structure.
Underlying Question: Will the system I built hold what I'm responsible for?
Distorted Strategy: You may over-plan the foundations because the people you carry must not feel them shake.
Healthy Gift: You keep things from falling apart that others would let slip.

# Third rubric — Relational register (hedged mode)

Inputs:
- Surface grip: Approval of specific people under pressure
- Grip Pattern: Belonging through usefulness (Belonging Grip)
- Engine recognition question: Will I still belong if I cannot meet what they need?
- Sub-register: relational
- Prose mode: hedged
- Single contributing grip; cohort thinness suspected

Output (hedged paragraph form, no labels):

The pressure register reads quietly here, not as the dominant pull. When you adjust toward what the room seems to want, the underlying recognition is whether your usefulness is what's holding the welcome — but the signal is thin enough that the question is worth noticing rather than governing. Sit with whether that question has been doing more work than you realized, before deciding it has.

# Output format

Output ONLY the four labeled lines (rendered) or the hedged paragraph (hedged). No preamble. No commentary. No quotation marks wrapping the output. Plain prose ready to paste into the report.`;

// ─────────────────────────────────────────────────────────────────────
// User-prompt builder
// ─────────────────────────────────────────────────────────────────────

export function buildGripUserPrompt(inputs: GripParagraphInputs): string {
  const lines: string[] = [
    `Prose mode: ${inputs.proseMode}`,
    `Surface grip: ${inputs.surfaceGrip}`,
  ];
  if (inputs.gripPatternLabel) {
    lines.push(`Grip Pattern: ${inputs.gripPatternLabel}`);
  }
  if (inputs.underlyingQuestion) {
    lines.push(
      `Engine recognition question (rewrite for THIS shape): ${inputs.underlyingQuestion}`
    );
  }
  lines.push(
    `Sub-register: ${inputs.subRegister ?? "(unset — default by primary)"}`
  );
  lines.push(`Healthy gift register: ${inputs.healthyGift}`);
  if (inputs.distortedStrategy) {
    lines.push(`Distorted-strategy seed (compose freely from this): ${inputs.distortedStrategy}`);
  }
  lines.push(
    `Contributing grips: ${inputs.contributingGrips.join("; ") || "(none)"}`
  );
  lines.push(`Risk Form orientation: ${inputs.riskFormLetter ?? "(line not yet drawn)"}`);
  lines.push(`Top Compass values: ${inputs.topCompass.join(", ")}`);
  lines.push(`Lens dominant: ${inputs.lensDominant}`);
  lines.push(`Movement quadrant: ${inputs.movementQuadrant}`);
  lines.push(
    `Developmental band: ${inputs.bandLabel ?? "(unknown — use age-agnostic register)"}`
  );
  lines.push(
    `Band register hint: ${inputs.registerHint ?? "(no age data — fall back to age-agnostic register)"}`
  );
  lines.push(
    `Aim composite: ${inputs.aimScore !== null ? `${inputs.aimScore.toFixed(0)}/100` : "(not computed)"}`
  );
  lines.push(
    `Aim-based Risk Form: ${inputs.aimRiskFormLetter ?? "(unavailable)"}`
  );
  lines.push(
    `Driver-register hint: ${inputs.driverRegisterHint ?? "(no driver-specific hint — use existing rubric center of gravity)"}`
  );
  lines.push(`Path class: ${inputs.pathClass ?? "trajectory"}`);
  if (inputs.pathClass === "crisis") {
    lines.push(`Crisis flavor: ${inputs.crisisFlavor ?? "(unspecified)"}`);
    lines.push(
      `Coherence rationale: ${inputs.coherenceRationale ?? "(none)"}`
    );
    lines.push(
      `INSTRUCTION: render the CRISIS rubric for the named flavor. Adopt crisis register; include the ethical guardrail soft pointer.`
    );
  }
  lines.push("");
  if (inputs.proseMode === "hedged") {
    lines.push(
      "Compose the HEDGED grip paragraph for this shape (40-90 words, single paragraph, no labels)."
    );
  } else {
    lines.push(
      "Compose the four-line three-concept Grip block for this shape (Surface Grip / Underlying Question / Distorted Strategy / Healthy Gift)."
    );
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Cache key + lookup (sync, client-bundle-safe)
// ─────────────────────────────────────────────────────────────────────

type CacheEntry = {
  paragraph: string;
  fixtureHint?: string;
  generatedAt?: string;
};

type CacheFile = Record<string, CacheEntry>;

const GRIP_CACHE: CacheFile = gripCacheData as CacheFile;

export function gripInputsHash(inputs: GripParagraphInputs): string {
  // CC-GRIP-CALIBRATION — alphabetical key order. Adding new fields
  // (subRegister, surfaceGrip, distortedStrategy, healthyGift,
  // proseMode, tertiary) extends the hash space, which intentionally
  // invalidates old cache entries on the first --force regeneration.
  const sortedKeys = Object.keys(inputs).sort() as Array<keyof GripParagraphInputs>;
  return sortedKeys
    .map((key) => `${key}=${JSON.stringify(inputs[key])}`)
    .join("|");
}

export function readCachedGripParagraph(
  inputs: GripParagraphInputs
): string | null {
  return GRIP_CACHE[gripInputsHash(inputs)]?.paragraph ?? null;
}
