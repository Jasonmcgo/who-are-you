// CC-LAUNCH-VOICE-POLISH-V3 — render-time LLM rewrite layer for the
// seven Part A sections deferred from CC-LAUNCH-VOICE-POLISH (Part B
// only). Mirrors the proseRewriteLlm.ts pattern but consolidated across
// all seven sections into a single module:
//
//   1. executiveRead       — bold pull-quote + 2-3 sustained paragraphs
//   2. corePattern         — declarative value-at-center read
//   3. whatOthersMayExperience — perception-gap second-person prose
//   4. whenTheLoadGetsHeavy    — pressure-mode failure-shape prose
//   5. synthesis           — one paragraph cross-card synthesis
//   6. closingRead         — archetype-appropriate last word
//   7. pathTriptych        — Work / Love / Give triptych rewrite
//
// Pure data — no `node:*`, no SDK. The server-side composer lives in
// `lib/launchPolishV3LlmServer.ts`; this module exports the types, the
// system prompt, the user-prompt builder, the cache key, and the
// runtime lookup (client-bundle-safe).

import cacheData from "./cache/launch-polish-v3-rewrites.json";

import type { ProfileArchetype } from "./profileArchetype";
import { fingerprintBody, logCacheMiss } from "./cacheObservability";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export type V3SectionId =
  | "executiveRead"
  | "corePattern"
  | "whatOthersMayExperience"
  | "whenTheLoadGetsHeavy"
  | "synthesis"
  | "closingRead"
  | "pathTriptych";

export const V3_SECTION_IDS: V3SectionId[] = [
  "executiveRead",
  "corePattern",
  "whatOthersMayExperience",
  "whenTheLoadGetsHeavy",
  "synthesis",
  "closingRead",
  "pathTriptych",
];

export interface V3RewriteInputs {
  sectionId: V3SectionId;
  archetype: ProfileArchetype;
  /** The engine-rendered section body. The LLM rewrites this. */
  engineSectionBody: string;
  /** Top compass value labels (e.g., ["Knowledge","Truth"]) — used by
   *  the rewriter to ground value-at-center prose without re-inventing
   *  the engine's compass read. */
  topCompassValueLabels: string[];
  /** Canon lines reserved elsewhere in the report — the LLM must NOT
   *  echo any of these to preserve canon-line scarcity (Rules §4). */
  reservedCanonLines: string[];
}

// ─────────────────────────────────────────────────────────────────────
// Archetype voice library (matches proseRewriteLlm.ts's ARCHETYPE_VOICE
// register so V3 sections sound continuous with the existing 5).
// ─────────────────────────────────────────────────────────────────────

const ARCHETYPE_VOICE: Record<ProfileArchetype, string> = {
  jasonType:
    "Long-arc, architectural, knowledge-protective, mastery-controlled. Sentences land hard; structure is the texture. Concrete imagery: writing the strategy memo nobody asked for; building the model that explains the noise; refining a structure past usefulness; holding a conclusion until it can be revised in public.",
  cindyType:
    "Present-tense, relational, family-protective, belonging-through-usefulness. The room reads first. Concrete imagery: noticing what the room needs before anyone names it; the recurring meal, the standing call; the structural fix that removes a recurring strain on someone you love; staying close when the work would be easier from a distance.",
  danielType:
    "Precedent-bound, structural, faith-protective, security-through-structure. What endures gets named. Concrete imagery: the standard followed when no one is watching; the precedent honored across decades; the system that doesn't ask to be reinvented every morning; the quiet faithfulness that institutions only notice in its absence.",
  unmappedType:
    "Plain-language, shape-aware. Speak from the user's specific shape without leaning on a named archetype. Concrete imagery should be drawn from what their engine read names.",
};

// ─────────────────────────────────────────────────────────────────────
// Per-section target prose guidance (CC §"Scope — expand LLM rewrite").
// Each entry names the section's shape + target voice. Fed into the
// user prompt so the LLM knows what the rewrite should land on.
// ─────────────────────────────────────────────────────────────────────

const V3_SECTION_TARGETS: Record<V3SectionId, string> = {
  executiveRead:
    "Section: Executive Read. The bold-italic pull-quote line at the TOP of the engine output stays VERBATIM as the first line. BELOW it, add 2-3 sustained-prose paragraphs that develop the read: paragraph 1 opens with a confident 'You are…' or equivalent declarative framing; paragraph 2 names the growth edge with concrete texture; paragraph 3 (optional) lands the directional verb. Do NOT paraphrase the pull-quote — keep the engine line at the top and write fresh prose underneath.",
  corePattern:
    "Section: Your Core Pattern. Declarative voice that opens with the value-at-center idea (e.g., 'Faith sits at the center of your shape.') and delivers it with confidence and texture across 1-2 paragraphs. Name the value at center in the user's protective vocabulary, then state what it is NOT (decoration / sentimental softness / abstract preference) and what it IS (load-bearing posture). Same shape per archetype with archetype-appropriate substance.",
  whatOthersMayExperience:
    "Section: What Others May Experience. Committed second-person prose that names the perception gap honestly, capped at ≤2 hedges. CRITICAL — the engine version for this section is SHAPE-BLIND TEMPLATE PROSE (it reads roughly 'Others experience the [driver] as clarity when they trust you and as judgment when they do not. Your willingness to bear cost reads as steadiness to people who trust your shape and as rigidity to people who don't yet.' across all fixtures). Do NOT paraphrase it. Do NOT mirror its sentence shapes. Ignore the engine text entirely for STRUCTURE — use it only to confirm what conclusion the engine reached. Write from scratch in the archetype's voice. The perception gap is ARCHETYPE-SPECIFIC, and every archetype must produce structurally DIFFERENT prose — different opening sentence shape, different concrete imagery, different named-gap. Architect: open with concrete behavior the room sees in present tense — e.g. 'Walk into a working meeting and the first thing the room notices is…' or 'The structure shows up before the warmth does.' Anchor in clarity-reads-as-correction, structure-reads-as-coldness, long-arc steadiness reads-as-remoteness. Gap: between people who experience your structure as a gift and people who experience it as a verdict. Caregiver: open with the felt arrival or the textured noticing — e.g. 'There is a way you arrive in a room that some people lean toward and some people quietly back away from.' or 'The first time someone receives your care, two things happen…'. Anchor in care-reads-as-smothering, presence-reads-as-enmeshment, loyalty-reads-as-self-erasure. Gap: between people who feel held by your continuity and people who feel kept inside it. Steward: open with a time-anchored frame — e.g. 'Over years, the people around you learn…' or 'Sit with you long enough and a pattern surfaces…' or 'What the room reads in you on day one and what it reads on year ten are different reads.' Anchor in faithfulness-reads-as-rigidity, slow-yes-reads-as-no, maintenance-reads-as-resistance-to-change. Gap: between people who feel safe inside what you preserve and people who feel constrained by it. Unmapped: open with the user's specific shape from their engine read in plain language; do not borrow archetype language. FORBIDDEN PHRASES (these are from the engine template — replace with archetype-voice prose): 'Others experience the X as clarity when they trust you', 'reads as steadiness to the people inside your circle', 'as withholding to people outside it', 'people who trust your shape and as rigidity to people who don't yet', 'the translation is rarely about doing less of yourself'. Two archetypes given the same engine reference must produce structurally divergent prose — not the same scaffold with value-name swaps.",
  whenTheLoadGetsHeavy:
    "Section: When the Load Gets Heavy. Textured second-person prose that names the failure-mode shapes specifically — name them as nouns or short images (the 'private-fact closure', the 'responsiveness-as-collapse', the 'mastery as locked door'). The engine output is procedural; your version is alive.",
  synthesis:
    "Section: A Synthesis. ONE paragraph cross-card synthesis that genuinely synthesizes — names what the cards together say that no single card says alone. Compass + Lens + Hands together produce a read the user has not yet seen in the report. End the paragraph; DO NOT include the 'To keep X without Y' parallel-line close — that part is rendered deterministically by the engine and concatenated after your output.",
  closingRead:
    "Section: Closing Read. 2-3 sentences of context that EARN the archetype canon line, then the canon line itself as the closing beat. The user prompt names which canon line is yours (architect / caregiver / steward variant). Land with 'Keep this shape honest as the seasons turn.' as the final sentence — preserve that verbatim.",
  pathTriptych:
    "Section: Path triptych (Work / Love / Give). Three paragraphs, one per facet, in archetype voice. Same three-section structure (each opens with a bold field label) but the prose inside each section reads as written for the user's specific shape, not as templated. Preserve the field labels and the closing growth-path line if present.",
};

// ─────────────────────────────────────────────────────────────────────
// System prompt — shared across all 7 V3 sections. The hedge cap is
// Rules §2 from the CC; banlist is Rules §3; canon-line scarcity is
// Rules §4. The user prompt layers section-specific targets on top.
// ─────────────────────────────────────────────────────────────────────

export const V3_REWRITE_SYSTEM_PROMPT = `You are rewriting one section of an identity-shape report. Your job is to land the engine's read in human-quality interpretive prose. The engine has already established WHAT the read says; your work is HOW it sounds.

# Target register

WARM PRECISION WITH MORAL NERVE. Capture warmth (not coldness), precision (not vagueness or flattery), moral nerve (not therapeutic mush, not blunt-force advice). The reader is the subject of the report. Speak to them directly, second person.

# Rules (HARD)

1. **Hedge cap.** The section may use at most TWO softening phrases across the entire output ("may", "appears", "tends", "likely", "leans toward"). Prefer section-level humility framing over sentence-level hedging. Do not stack hedges. Bad: "Your pattern leans toward X. When this is operating, you tend to read..." Better: "You read the situation through X. That sequence is most of how this shape moves through a week."

2. **Engine-language BANLIST.** Zero occurrences of any of:
   - composite read
   - disposition channel
   - signal cluster
   - the model detects
   - reinforces the Work-line
   - substrate
   - canonical (as a user-facing word)
   - register used technically
   - "3 C's" (proprietary internal label)
   - "Faith Shape" / "Faith Texture"
   - "Primal Question"
   - "driver" / "support" outside Core Signal Map context

3. **Canon-line scarcity.** The user prompt names canon phrases that are landing elsewhere in the report — your section must NOT echo any of them. Preserve the scarcity contract: each archetype canon line appears at most twice across the full report.

4. **Speak from inside the conclusion.** The prose should commit. Bad: "Your composite read points toward..." Better: "You are built for work where..." Speak in declaratives. Hedge only via the masthead's already-established "a possibility, not a verdict" frame.

5. **Shape-specific texture.** Include at least one concrete image or behavior drawn from the archetype's life. The user prompt names archetype-specific imagery examples; lift the texture, do not copy verbatim.

6. **Preserve meaning.** Same read, more alive. Do NOT make the prose more flattering, more clinical, or more dramatic. Do NOT invent confidence the engine didn't claim. If the engine read a tension, name the tension; do not soften it.

7. **Voice differentiation.** Each archetype sounds DIFFERENT. Not one template with swapped nouns. Jason architectural; Cindy relational; Daniel precedent-bound. Sentence shapes vary across archetypes.

# Output

Output ONLY the rewritten section body. Match the structure the engine specified (bold field labels, blockquote pull-quotes, italic helpers) — your task is to rewrite the PROSE inside that structure, not to restructure the section. No preamble, no commentary, no wrapping code fences.

# Length

Match the engine's section length within ±25%. The point is COMPRESSION + TEXTURE, not expansion.`;

// ─────────────────────────────────────────────────────────────────────
// User-prompt builder
// ─────────────────────────────────────────────────────────────────────

export function buildV3UserPrompt(inputs: V3RewriteInputs): string {
  const lines: string[] = [
    `Section: ${inputs.sectionId}`,
    `Archetype: ${inputs.archetype}`,
    "",
    `Section target: ${V3_SECTION_TARGETS[inputs.sectionId]}`,
    "",
    `Voice / imagery for this archetype: ${ARCHETYPE_VOICE[inputs.archetype]}`,
    "",
  ];
  if (inputs.topCompassValueLabels.length > 0) {
    lines.push(
      `Top protected values (use these as the grounding for value-at-center prose): ${inputs.topCompassValueLabels.join(", ")}`
    );
    lines.push("");
  }
  if (inputs.reservedCanonLines.length > 0) {
    lines.push(
      "Reserved canon phrases (DO NOT include any of these — they are landing elsewhere in the report):"
    );
    for (const c of inputs.reservedCanonLines) {
      lines.push(`  - "${c}"`);
    }
    lines.push("");
  }
  lines.push(
    "Engine-rendered section to rewrite (preserve the read, rewrite the voice):"
  );
  lines.push("```");
  lines.push(inputs.engineSectionBody);
  lines.push("```");
  lines.push("");
  lines.push(
    "Output the rewritten section markdown ONLY. No preamble. No commentary. Preserve any bold field labels and blockquote pull-quotes the engine emitted."
  );
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Cache key + lookup
// ─────────────────────────────────────────────────────────────────────

export function v3RewriteHash(inputs: V3RewriteInputs): string {
  const sorted = {
    archetype: inputs.archetype,
    engineSectionBody: inputs.engineSectionBody,
    reservedCanonLines: [...inputs.reservedCanonLines].sort(),
    sectionId: inputs.sectionId,
    topCompassValueLabels: [...inputs.topCompassValueLabels].sort(),
  };
  return JSON.stringify(sorted);
}

type CacheEntry = {
  rewrite: string;
  fixtureHint?: string;
  generatedAt?: string;
};

type CacheFile = Record<string, CacheEntry>;

const CACHE: CacheFile = cacheData as CacheFile;

const RUNTIME_CACHE = new Map<string, string>();

export function readCachedV3Rewrite(inputs: V3RewriteInputs): string | null {
  const key = v3RewriteHash(inputs);
  const committedHit = CACHE[key]?.rewrite ?? null;
  if (committedHit !== null) return committedHit;
  const runtimeHit = RUNTIME_CACHE.get(key) ?? null;
  if (runtimeHit !== null) return runtimeHit;
  logCacheMiss({
    namespace: "launch-polish-v3-rewrites",
    section: inputs.sectionId,
    cacheKey: key,
    fingerprint: fingerprintBody(inputs.engineSectionBody),
  });
  return null;
}

export function writeRuntimeV3Rewrite(
  inputs: V3RewriteInputs,
  rewrite: string
): void {
  const key = v3RewriteHash(inputs);
  RUNTIME_CACHE.set(key, rewrite);
}

export function _clearRuntimeV3CacheForTests(): void {
  RUNTIME_CACHE.clear();
}
