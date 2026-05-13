// CC-LLM-PROSE-PASS-V1 — render-time LLM rewrite layer for the four
// scoped body cards (Lens / Compass / Hands / Path). The engine
// produces structured reads + canon-line inventory + don't-cross
// constraints; the LLM compresses, removes hedge stacking, and lands
// shape-specific texture per archetype. The engine remains the source
// of truth for WHAT is said; the LLM rewrites HOW it's said.
//
// Pure data — no `node:*`, no SDK. The server-side composer lives in
// `lib/proseRewriteLlmServer.ts`; this module exports the types, the
// system prompt, the user-prompt builder, the cache key, and the
// runtime lookup (client-bundle-safe).

import cacheData from "./cache/prose-rewrites.json";

import type { ProfileArchetype } from "./profileArchetype";
import { fingerprintBody, logCacheMiss } from "./cacheObservability";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export type ProseCardId = "lens" | "compass" | "hands" | "path";

export interface ProseRewriteInputs {
  cardId: ProseCardId;
  archetype: ProfileArchetype;
  /** The engine-rendered section body. The LLM rewrites this. */
  engineSectionBody: string;
  /** Canon lines the LLM must NOT repeat (already used elsewhere in the
   *  report) — passed in for canon-line scarcity enforcement. */
  reservedCanonLines: string[];
}

// ─────────────────────────────────────────────────────────────────────
// Voice / imagery libraries per archetype + card
// ─────────────────────────────────────────────────────────────────────

const ARCHETYPE_VOICE: Record<ProfileArchetype, string> = {
  jasonType:
    "Long-arc, architectural, knowledge-protective, mastery-controlled. An architect's read of an architect. Sentences land hard; structure is the texture. Concrete imagery: writing the strategy memo nobody asked for; building the model that explains the noise; refining a structure past usefulness; holding a conclusion until it can be revised in public.",
  cindyType:
    "Present-tense, relational, family-protective, belonging-through-usefulness. A caregiver's read of a caregiver. The room reads first. Concrete imagery: noticing what the room needs before anyone names it; the recurring meal, the standing call; the structural fix that removes a recurring strain on someone you love; staying close when the work would be easier from a distance.",
  danielType:
    "Precedent-bound, structural, faith-protective, security-through-structure. A steward's read of a steward. What endures gets named. Concrete imagery: the standard followed when no one is watching; the precedent honored across decades; the system that doesn't ask to be reinvented every morning; the quiet faithfulness that institutions only notice in its absence.",
  unmappedType:
    "Plain-language, shape-aware. Speak from the user's specific shape without leaning on a named archetype. Concrete imagery should be drawn from what their engine read names.",
};

const CARD_GUIDANCE: Record<ProseCardId, string> = {
  lens:
    "Eyes / Lens — how the user reads reality. Their cognitive register and what it sees first. Open with what the world looks like to them, not with a category label.",
  compass:
    "Heart / Compass — what the user protects. The sacred-value cluster expressed through the kind of decisions they're willing to bear cost for. Stay specific to their named protections, not abstract value-language.",
  hands:
    "Hands / Work — what the user's life makes real. Existential Goal-axis: the building, the carrying, the structural fix made operational. Includes the dual-mode read (health vs pressure).",
  path:
    "Gait / Path — how the user moves through a season. The directional reading of their next move — what to keep, what to update, what the shape is asking next. Land on a directional verb.",
};

// ─────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────

export const PROSE_REWRITE_SYSTEM_PROMPT = `You are rewriting one section of an identity-shape report. Your job is to land the engine's read in human-quality interpretive prose. The engine has already established WHAT the read says; your work is HOW it sounds.

# Target register

WARM PRECISION WITH MORAL NERVE. Capture warmth (not coldness), precision (not vagueness or flattery), moral nerve (not therapeutic mush, not blunt-force advice). The reader is the subject of the report. Speak to them directly, second person.

# Rules (HARD)

1. **Hedge cap.** The section may use at most ONE softening phrase across the entire output ("may", "appears", "tends", "likely", "leans toward"). Prefer one section-level humility framing over sentence-level hedging. Do not stack hedges. Bad: "Your pattern leans toward X. When this is operating, you tend to read..." Better: "You read the situation through X. That sequence is most of how this shape moves through a week."

2. **Engine-language BANLIST.** Zero occurrences of any of:
   - composite read
   - disposition channel
   - signal cluster
   - derived from
   - the model detects
   - reinforces the Work-line
   - substrate
   - canonical (as a user-facing word)
   - "Big Five" / OCEAN
   - "Faith Shape" / "Faith Texture" / "Primal Question"
   - "Am I X?" Foster-style recognition questions
   - register used technically (as a label suffix like "long-arc-architect register"; proprietary translations like "the pattern-reader" stay)

3. **Canon-line scarcity.** Phrases reserved for the Executive Read MUST NOT appear in body cards. The user prompt will name reserved phrases; do not echo any of them.

4. **Speak from inside the conclusion.** The prose should commit. Bad: "Your composite read points toward..." Better: "You are built for work where..." Speak in declaratives. Hedge only via the masthead's already-established "a possibility, not a verdict" frame.

5. **Shape-specific texture.** Include at least one concrete image or behavior that reads as if drawn from the archetype's actual life. The user prompt will name archetype-specific imagery examples; lift their texture, do not copy them verbatim.

6. **Preserve meaning.** Same read, more alive. Do NOT make the prose more flattering, more clinical, or more dramatic. Do NOT invent confidence the engine didn't claim. If the engine read a tension, name the tension; do not soften it.

7. **Voice differentiation.** Each archetype sounds DIFFERENT. Not one template with swapped nouns. Jason should sound architectural; Cindy should sound relational; Daniel should sound precedent-bound. Sentence shapes vary across archetypes, not just adjectives.

# Output

Output ONLY the rewritten section body. Preserve the section header line ("### {Card} — {Bodypart}") and the bold field labels ("**Strength** — ...") that the engine emits — your task is to rewrite the prose INSIDE those labels, not to restructure the card. Keep the body fields the engine specified:
- For Lens / Compass: **Strength** / **Growth Edge** / **Practice** + the italic Pattern Note close.
- For Hands: **Strength** / **Growth Edge** / **Under Pressure** / **Practice** + the Movement Note + closing line.
- For Path: the existing structure (Direction / Practice / closing line).

Do NOT add or remove field labels. Do NOT change numeric values. Do NOT add commentary, preamble, or wrapping quotes. Pure plain markdown ready to paste into the report.

# Length

Match the engine's section length within ±25%. The point is COMPRESSION + TEXTURE, not expansion.`;

// ─────────────────────────────────────────────────────────────────────
// User-prompt builder
// ─────────────────────────────────────────────────────────────────────

export function buildProseRewriteUserPrompt(
  inputs: ProseRewriteInputs
): string {
  const lines: string[] = [
    `Card: ${inputs.cardId}`,
    `Archetype: ${inputs.archetype}`,
    "",
    `Card guidance: ${CARD_GUIDANCE[inputs.cardId]}`,
    "",
    `Voice / imagery for this archetype: ${ARCHETYPE_VOICE[inputs.archetype]}`,
    "",
  ];
  if (inputs.reservedCanonLines.length > 0) {
    lines.push(
      "Reserved canon phrases (DO NOT include any of these — they are landing elsewhere in the report):"
    );
    for (const c of inputs.reservedCanonLines) {
      lines.push(`  - "${c}"`);
    }
    lines.push("");
  }
  lines.push("Engine-rendered section to rewrite (preserve the read, rewrite the voice):");
  lines.push("```");
  lines.push(inputs.engineSectionBody);
  lines.push("```");
  lines.push("");
  lines.push(
    "Output the rewritten section markdown ONLY. No preamble. No commentary. Preserve the section header line + bold field labels."
  );
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Cache key + lookup
// ─────────────────────────────────────────────────────────────────────

/** Deterministic canonical-string hash of inputs. */
export function proseRewriteHash(inputs: ProseRewriteInputs): string {
  const sorted = {
    archetype: inputs.archetype,
    cardId: inputs.cardId,
    engineSectionBody: inputs.engineSectionBody,
    reservedCanonLines: [...inputs.reservedCanonLines].sort(),
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

// CC-LIVE-SESSION-LLM-WIRING — process-scoped runtime cache that holds
// on-demand LLM resolutions from live sessions. NOT persisted to the
// committed lib/cache/prose-rewrites.json file. Entries survive only
// for the lifetime of the Node process / serverless invocation. The
// committed cohort cache is consulted FIRST; runtime cache fills in
// gaps for non-fixture live inputs.
const RUNTIME_CACHE = new Map<string, string>();

export function readCachedRewrite(inputs: ProseRewriteInputs): string | null {
  const key = proseRewriteHash(inputs);
  const committedHit = CACHE[key]?.rewrite ?? null;
  if (committedHit !== null) return committedHit;
  const runtimeHit = RUNTIME_CACHE.get(key) ?? null;
  if (runtimeHit !== null) return runtimeHit;
  // CC-CACHE-MISS-LOUDFAIL — emit a structured warning so live-session
  // misses surface in dev terminals + aggregated logs. Return value
  // unchanged; splice still falls through to engine prose.
  logCacheMiss({
    namespace: "prose-rewrites",
    section: inputs.cardId,
    cacheKey: key,
    fingerprint: fingerprintBody(inputs.engineSectionBody),
  });
  return null;
}

/** CC-LIVE-SESSION-LLM-WIRING — write a freshly-resolved on-demand LLM
 *  rewrite into the runtime cache so subsequent calls in the same process
 *  hit without re-calling the API. Used by `resolveProseRewriteLive` in
 *  the server module. */
export function writeRuntimeRewrite(
  inputs: ProseRewriteInputs,
  rewrite: string
): void {
  const key = proseRewriteHash(inputs);
  RUNTIME_CACHE.set(key, rewrite);
}

/** Test-only — clear the runtime cache between assertions. Production
 *  code never calls this. */
export function _clearRuntimeRewriteCacheForTests(): void {
  RUNTIME_CACHE.clear();
}
