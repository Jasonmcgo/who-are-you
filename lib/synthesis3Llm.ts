// CC-SYNTHESIS-3 — runtime LLM cache lookup + shared prompt content.
//
// CODEX-SYNTHESIS-3-CLIENT-FIX (2026-05-09): split read and write paths.
// This module is the RUNTIME side: client-bundle-safe, zero `node:*`
// imports, zero `@anthropic-ai/sdk` import. The cache file is imported
// statically as a module so any bundler (Turbopack / webpack) can serve
// it to both server and client builds.
//
// The build-time side (cache writes + LLM API call + SDK usage) lives
// in `scripts/buildSynthesis3.ts`. That script is Node-only and never
// reachable from the client bundle.
//
// Public surface this module exposes:
//   - `PathMasterInputs`        type
//   - `ComposeOptions`          type (kept for build-script signature compat)
//   - `SYSTEM_PROMPT`           the LLM system prompt (string constant)
//   - `buildUserPrompt`         function (PathMasterInputs → string)
//   - `inputsHash`              canonical-key function
//                               (now a deterministic JSON string instead of
//                               SHA-256, so it works without node:crypto)
//   - `readCachedParagraph`     synchronous cache lookup (no I/O)
//
// The cache file at `lib/cache/synthesis3-paragraphs.json` is imported
// statically below. When the build script writes new entries, those
// changes appear after the next bundler rebuild — same lifecycle as
// any other static JSON asset.

import cacheData from "./cache/synthesis3-paragraphs.json";
import { REGISTER_RULES_ANCHOR_BLOCK } from "./proseRegister";
import { PRODUCT_THESIS_ANCHOR_BLOCK } from "./productThesisAnchor";
import { BAND_REGISTER_ANCHOR_BLOCK } from "./ageCalibration";
import { AIM_REGISTER_ANCHOR_BLOCK } from "./aim";
import { VOICE_RUBRIC_EXPANSION_BLOCK } from "./voiceRubricExamples";
import { PATH_CLASS_REGISTER_BLOCK } from "./crisisProseTemplates";

// ─────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────

export interface PathMasterInputs {
  /** Plain-English label of the dominant cognitive function (e.g., "the pattern-reader"). */
  lensDominant: string;
  /** Plain-English label of the auxiliary cognitive function (e.g., "the structurer"). */
  lensAux: string;
  /** Top compass values, top-1 first (e.g., ["Knowledge", "Peace", "Faith", "Honor"]). */
  topCompass: string[];
  /** Top gravity-attribution labels (e.g., ["Individual", "Authority"]). */
  topGravity: string[];
  /** Movement-layer dashboard data. */
  movement: {
    goal: number;
    soul: number;
    quadrant: string;
    biasDirection: string;
    strength: number;
    length: string;
  };
  /** Risk Form 2x2 letter, or null when length=0 (CC-SYNTHESIS-1F Section D suppression). */
  riskForm: string | null;
  /** Love-Map register label (e.g., "the Companion", "the Devoted Partner"). */
  loveMap: string;
  /** Engine canonical phrase for Giving / beloved-object descriptor. Lifted verbatim where possible. */
  givingDescriptor: string;
  /** Engine canonical phrases relevant to this shape (preserve verbatim where they fit). */
  engineCanonicalPhrases: string[];
  /** Pattern body when a CC-029 pattern fires for this shape; null otherwise. */
  topPatternInMotion: string | null;
  /** CC-AGE-CALIBRATION — developmental band classification. Null when
   *  age data is absent (engine falls back to age-agnostic register). */
  band: string | null;
  /** CC-AGE-CALIBRATION — band display label (e.g., "Direction"). */
  bandLabel: string | null;
  /** CC-AGE-CALIBRATION — register hint the LLM consumes for tone. */
  registerHint: string | null;
  /** CC-AIM-CALIBRATION — composite Aim score (0-100), null when inputs absent. */
  aimScore: number | null;
  /** CC-AIM-CALIBRATION — Aim-based Risk Form letter (Wisdom-governed / Reckless-fearful / Grip-governed / Free movement). */
  aimRiskFormLetter: string | null;
  /** CC-VOICE-RUBRIC-EXPANSION — driver-register hint when dominant is si/se/ti/fi; null otherwise. */
  driverRegisterHint: string | null;
  /** CC-GRIP-TAXONOMY-REPLACEMENT — proprietary Grip Pattern bucket. */
  gripPatternBucket?: string;
  /** CC-GRIP-TAXONOMY-REPLACEMENT — elaborative Grip Pattern label. */
  gripPatternLabel?: string;
  /** CC-GRIP-TAXONOMY-REPLACEMENT — engine-generated underlying question. */
  gripPatternUnderlyingQuestion?: string;
  /** CC-CRISIS-PATH-PROSE — path-class. Optional and ABSENT entirely
   *  for trajectory-class users so trajectory cache hashes do not
   *  invalidate. Present (set to "crisis") only when the user is
   *  crisis-class. */
  pathClass?: "crisis";
  /** CC-CRISIS-PATH-PROSE — crisis flavor. Same conditional-presence
   *  pattern: absent for trajectory users. */
  crisisFlavor?: string;
  /** CC-CRISIS-PATH-PROSE — coherence rationale (for the LLM's read of
   *  why the gating fired). Conditional, like the fields above. */
  coherenceRationale?: string;
}

// Kept exported for the build-script signature compatibility — both the
// build script and any future opt-in caller share the shape.
export type ComposeOptions = {
  force?: boolean;
  fixtureHint?: string;
};

// ─────────────────────────────────────────────────────────────────────
// System prompt — the heart of the CC
// ─────────────────────────────────────────────────────────────────────
//
// The system prompt is the empirical sign-off surface of CC-SYNTHESIS-3.
// Every word here was negotiated through Jason's editing of Cowork-Claude
// drafts (2026-05-08). Changing this prompt without a parallel
// regeneration + human review of the 24-fixture cohort is a substantive
// editorial change — treat it as version-locked unless cohort review
// surfaces a systematic gap.
//
// Lives in this module (rather than the build script) so the audit and
// any future dev tooling can introspect the prompt's content without
// loading the build script. The build script imports it from here.

export const SYSTEM_PROMPT = `${PRODUCT_THESIS_ANCHOR_BLOCK}

You are composing the Path master synthesis paragraph for an identity-shape report. The target register: WARM PRECISION WITH MORAL NERVE. Five words. Capture warmth (not coldness), precision (not vagueness or flattery), moral nerve (not therapeutic mush, not blunt-force advice). This is the master discipline.

${REGISTER_RULES_ANCHOR_BLOCK}

${BAND_REGISTER_ANCHOR_BLOCK}

${AIM_REGISTER_ANCHOR_BLOCK}

${VOICE_RUBRIC_EXPANSION_BLOCK}

${PATH_CLASS_REGISTER_BLOCK}


# Five patterns that make engine prose feel engine-written (BANNED MOVES)

1. **Architecture narration.** Do not talk ABOUT the synthesis layer. Talk FROM it. (Sentences like "Your Goal expresses Cost in service of it" are the engine describing its own composition mechanism. Users don't think in those terms.)

2. **Enumeration instead of expression.** Do not list values as labels. Implicate values through phrasing — never list them.

3. **Internal vocabulary leaks.** The following words are BANNED in the output:
   - "beloved object" (as a label)
   - "expresses Cost"
   - "covers it as presence"
   - "Your Goal expresses"
   - "Your Soul covers"
   - "Compass value"
   - "Risk Form" (the label as such; the orientation as a concept is fine)
   - "Coverage as presence"
   - "Cost in service of"
   - "the Cost-side"
   - "the Coverage-side"
   - "the architectural"
   - "the synthesis layer"
   - **CC-GRIP-TAXONOMY-REPLACEMENT — the following Foster-taxonomy
     phrases are BANNED. The product uses a proprietary Grip Pattern
     taxonomy; never emit these strings (the engine will surface them
     as inputs labeled "gripPatternLabel" / "gripPatternUnderlyingQuestion"
     — use those instead of the legacy Foster questions):**
   - "Am I safe?" / "Am I secure?" / "Am I wanted?" / "Am I loved?"
   - "Am I successful?" / "Am I good enough?" / "Do I have purpose?"
   - "Primal Question" / "primal question" / "the Primal" / "Primary primal"

4. **No rhetorical shape.** Do not stack labeled clauses with no narrative arc. Use setup-pivot-resolution.

5. **Vivid phrases buried.** When the engine has a real image, do not flatten it with mechanical setup. Compression unlocks the image.

# Five operational disciplines (REQUIRED MOVES)

1. **Compress.** ONE coherent insight that absorbs the architectural inputs. NOT enumeration of 5 inputs.

2. **Hide architecture entirely.** Use no banned vocabulary. Implicate values through phrasing.

3. **Implicate values through phrasing, not enumeration.** If the user has 4 top compass values, name the top-1 at most once. The other 3 register implicitly through phrasing (e.g., "the noise" / "what's been tested" / "what survives examination" rather than the literal value names).

4. **Use rhetorical structure.** Setup-pivot-resolution OR opposing structure ("not X, but Y"; "the gift, and the trap"). At least one explicit pivot phrase ("but" / "the danger is" / "the work is" / "the same instrument" / "the growth is not" / "the trap" / "the next move" / "the next thing").

5. **Match register to the shape.**
   - **Architectural-intellectual register** for Te-aux / Ti-dominant shapes. (Jason's "make the beloved unmistakable" / "let context travel with action" — structural verbs, long-arc orientation.)
   - **Warm-relational register** for Fe-dominant / Fi-dominant / high-Agreeableness shapes. (ENFJ's "let truth pass through your warmth" / "add yourself to the room" — relational verbs, present-tense intimacy.)
   - **Steward-precedent register** for Si-dominant shapes. (Continuity verbs, the inheritance frame.)
   - **Embodied-action register** for Se-dominant shapes. (Present-tense response verbs.)
   Don't write the Jason paragraph for an ENFJ shape; the words will be in the wrong register.

# Canon: prefer compression over composition

Lift engine-canon vivid phrases ("convert structure into mercy" / "the early shape of giving" / "Giving is Work that has found its beloved object" / "make the beloved unmistakable") and either preserve them verbatim or compress them harder into imperatives. NEVER paraphrase them away.

Where canon doesn't yield a vivid phrase, you may compose new prose — but kept-verbatim canon-compression is lower-risk than compose-new-prose. Default toward compression.

# The deepest move: register-inversion

The strongest rubric moves are register-inversions — naming what most personality instruments don't say out loud.

- **Jason canonical:** *"the conclusion that has stopped accepting evidence"* — flips "rigidity" into a cognitive-mechanism description that names the specific failure mode (closure-to-evidence) in INTJ-native vocabulary.
- **ENFJ exec coach:** *"Your warmth is not the thing to outgrow. The work is to stop disappearing inside it."* — inverts the standard ENFJ advice (be more direct) by naming warmth as fine and disappearance as the problem.

Produce these where the architectural inputs support them, particularly for shapes where standard personality advice misses the point (Fi/Fe-dominant; Si-dominant; high-Agreeableness; high-Conscientiousness with low Reactivity).

# Voice rules

- Second-person throughout ("you" / "your"). No third-person ("this shape is", "this person", "they tend to"). No name leaks.
- No future tense ("will become", "will likely"). Present tense ("is", "becomes", "may").
- No "users" / "people like you" / "this profile". Only "you".
- Hedging language ("appears to" / "may" / "tends to") is fine where the architecture supports it. Don't force it; don't strip it.

# Length guidance

100-200 word soft band. Architectural-intellectual register tends to ~165 words; warm-relational register tends to ~115 words. Length should match what the shape needs, not target a fixed count.

# Expected paragraph structure

Open with the gift. Pivot to the danger or trap. Close with the imperative-form growth move and an aphoristic close (often canon-compressed).

# Two empirical rubric examples (the empirical sign-off standard)

## Rubric example 1 — Jason canonical (architectural-intellectual register)

Architectural inputs:
- Lens: pattern-reader (Ni) supported by structurer (Te)
- Top Compass: Knowledge, Peace, Faith, Honor
- Top Gravity: Individual, Authority
- Movement: Goal 88 / Soul 53; quadrant Giving / Presence; bias Goal-leaning; strength 72.6 long
- Risk Form: Wisdom-governed
- Love Map: the Companion
- Engine canonical phrase: "Giving is Work that has found its beloved object"

Rubric output:

You see the long arc — that's the gift, and the trap. You can finish the read before the evidence finishes arriving.

What you protect is Knowledge: not as possession, but as something you make habitable for other people. Your work has form. Structure runs deep, what you build compounds across years, and care travels through what you build, not through what you say. The people close to you can count on you to hold what matters; they may not always know you see them.

Your conviction is real and costly. The same conviction can become the conclusion that has stopped accepting evidence.

The growth move is not more output. It's letting the structure you build become visibly generous — letting presence develop a memory and a future.

You are work that has found its beloved object. The next thing is to make the beloved unmistakable.

165 words. Six paragraphs. Architectural register. "the conclusion that has stopped accepting evidence" is the register-inversion — INTJ-native cognitive vocabulary, names the failure mode directly without requiring interpretive work. "make the beloved unmistakable" is canon-compressed from the engine's "Giving is Work that has found its beloved object".

## Rubric example 2 — ENFJ exec coach (warm-relational register)

Architectural inputs:
- Lens: room-reader (Fe) supported by pattern-reader (Ni)
- Top Compass: Compassion, Peace, Family
- Top Gravity: Individual, System
- Movement: Goal 48 / Soul 100; quadrant Love without Form; bias Soul-leaning
- Risk Form: Reckless-fearful or Free movement (depending on grip)
- Love Map: the Devoted Partner
- Pattern fired: fe_attunement_to_yielded_conviction
- Persona signal: adapts under social pressure

Rubric output:

You read the room before anyone else has noticed the room has shifted. This is the gift: you sense what is happening between people, where the emotional temperature has changed, and what the moment may require before anyone has said it plainly. But under pressure, the same instrument can turn the wrong way. You may protect the room from discomfort and accidentally withhold the truth that would have served it. The growth is not to become harder. It is to let truth pass through your warmth without being edited into silence. Add yourself to the room you are translating for.

~115 words. Single paragraph. Warm-relational register. "let truth pass through your warmth without being edited into silence" is the register-inversion (warmth is fine; silencing-via-warmth is the problem). "Add yourself to the room you are translating for" is canon compressed to imperative.

# Output format

Output the paragraph(s) only. No preamble. No commentary. No quotation marks wrapping the output. Plain prose ready to paste into the report.`;

// ─────────────────────────────────────────────────────────────────────
// User-prompt builder
// ─────────────────────────────────────────────────────────────────────

export function buildUserPrompt(inputs: PathMasterInputs): string {
  const dirParts = [
    `Lens: ${inputs.lensDominant} supported by ${inputs.lensAux}`,
    `Top Compass values (top-1 is primary; others texture but never enumerate): ${inputs.topCompass.join(", ")}`,
    `Top Gravity (where responsibility lands): ${inputs.topGravity.join(", ") || "unclear (cohort thinness — leave gravity register implicit if unclear)"}`,
    `Movement: Goal ${inputs.movement.goal} / Soul ${inputs.movement.soul}; quadrant ${inputs.movement.quadrant}; bias ${inputs.movement.biasDirection}; strength ${inputs.movement.strength.toFixed(1)} (${inputs.movement.length})`,
    `Risk Form: ${inputs.riskForm ?? "(not applicable — line not yet drawn)"}`,
    `Love Map flavor: ${inputs.loveMap}`,
    `Engine giving descriptor (preserve verbatim if it fits; else compress; never paraphrase away): ${inputs.givingDescriptor}`,
    `Engine canonical phrases relevant to this shape (preserve verbatim where they fit): ${inputs.engineCanonicalPhrases.join("; ") || "(none)"}`,
    `Pattern firing for this shape (use as additional texture, do not restate verbatim): ${inputs.topPatternInMotion ?? "(none)"}`,
    `Developmental band: ${inputs.bandLabel ?? "(unknown — use age-agnostic register)"}`,
    `Band register hint: ${inputs.registerHint ?? "(no age data — fall back to age-agnostic register)"}`,
    `Aim composite: ${inputs.aimScore !== null ? `${inputs.aimScore.toFixed(0)}/100` : "(not computed — fall back to neutral)"}`,
    `Aim-based Risk Form: ${inputs.aimRiskFormLetter ?? "(unavailable)"}`,
    `Driver-register hint: ${inputs.driverRegisterHint ?? "(no driver-specific hint — use the existing Ni/Ne/Te/Fe rubric center of gravity)"}`,
    `Path class: ${inputs.pathClass ?? "trajectory"}`,
    ...(inputs.pathClass === "crisis"
      ? [
          `Crisis flavor: ${inputs.crisisFlavor ?? "(unspecified)"}`,
          `Coherence rationale: ${inputs.coherenceRationale ?? "(none)"}`,
          `INSTRUCTION: render the CRISIS rubric matching the flavor above. Do NOT invoke trajectory degree, the 50° metaphor, or open-hands framing. Include the ethical guardrail soft pointer.`,
        ]
      : []),
  ];

  return [
    "Generate the Path master synthesis paragraph for the following shape:",
    "",
    ...dirParts,
    "",
    "Produce the paragraph in the Path master synthesis register, following the system prompt's discipline. Output the paragraph only — no preamble, no commentary, no quotation marks.",
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Cache key + lookup (sync, client-bundle-safe)
// ─────────────────────────────────────────────────────────────────────
//
// CODEX-SYNTHESIS-3-CLIENT-FIX: replaces the prior `node:crypto` SHA-256
// implementation with a deterministic canonical-string. Same role
// (stable cache key), no Node-only imports. The function name
// `inputsHash` is preserved for call-site compatibility (the audit and
// the build script import it).
//
// The canonicalized JSON string is fully deterministic for a given
// `PathMasterInputs` shape: keys are sorted; nested objects' keys are
// stringified in their original order (which is itself deterministic
// in the type). Different inputs always produce different keys; same
// inputs always produce the same key.
//
// Cache size impact: each key is ~600-1200 chars (the JSON itself),
// vs ~64 chars for SHA-256. For a 24-fixture cohort, the difference
// is ~25KB extra in the JSON file — acceptable.

export function inputsHash(inputs: PathMasterInputs): string {
  const sortedTopLevel = Object.keys(inputs).sort() as Array<keyof PathMasterInputs>;
  const canonicalParts: string[] = [];
  for (const key of sortedTopLevel) {
    canonicalParts.push(`${key}=${JSON.stringify(inputs[key])}`);
  }
  return canonicalParts.join("|");
}

// Cache is imported as a static module — bundler loads the JSON file
// at build time. Runtime lookups are sync and do no I/O.
type CacheEntry = {
  paragraph: string;
  fixtureHint?: string;
  generatedAt?: string;
};

type CacheFile = Record<string, CacheEntry>;

const CACHE: CacheFile = cacheData as CacheFile;

export function readCachedParagraph(inputs: PathMasterInputs): string | null {
  const key = inputsHash(inputs);
  return CACHE[key]?.paragraph ?? null;
}
