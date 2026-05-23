// CC-131 Part C.1 — Cross-section polish layer.
//
// **Purpose.** Even after Parts A (engine-side dedup) and B (clinician
// gating) and C.2 (per-section archetype-imagery rotation), the V3 and
// prose layers can still emit verbatim cross-section repetition when
// (a) the engine source body for two sections shares a stock phrase, or
// (b) the LLM rewriter independently lands on the same vivid image
// across two unrelated rewrites (the "strategy memo nobody asked for"
// problem at scale).
//
// The polish layer runs AFTER the existing rewrite layers. Its only
// job is: given a section's current prose + the rendered prose of every
// OTHER section in the report, rewrite the target section to remove
// any verbatim phrase repetition (≥6 consecutive words) while
// preserving the engine read, the canon-line scarcity rules, and the
// per-section voice the prior layers established.
//
// **No-spend wiring (per CC).** The committed cache ships empty;
// `readCachedCrossSectionPolish` returns null until entries are
// authored. The render path treats null as "use the upstream prose
// unchanged" — no fallback prose, no engine regeneration, no API
// spend. Only `build*` scripts that opt into
// `LLM_REWRITE_RUNTIME=on` and provide an `ANTHROPIC_API_KEY` will ever
// reach the composer.
//
// **Cache key.** The polish output depends on the target section body
// AND the union of other-section bodies (since the polish must avoid
// duplicating phrases the OTHER sections use). The other-section
// bodies are concatenated in a canonical sort order so the key is
// byte-stable across re-renders that produce the same prose.

import cacheData from "./cache/cross-section-polish-rewrites.json";

import type { ProfileArchetype } from "./profileArchetype";
import { fingerprintBody, logCacheMiss } from "./cacheObservability";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

/** Section identifier the polish run is targeting. Free-form string so
 *  both V3 sectionIds (executiveRead, corePattern, …) and prose-card
 *  ids (lens, compass, hands, path) can be polished without coupling
 *  this module to either enum. */
export type CrossSectionPolishSectionId = string;

export interface CrossSectionPolishInputs {
  /** The section being polished (drives the cache key per-section). */
  sectionId: CrossSectionPolishSectionId;
  /** Archetype — passed through to the polish prompt for voice
   *  continuity. Same value the upstream V3/prose layer saw. */
  archetype: ProfileArchetype;
  /** The current rendered prose for THIS section — i.e. whatever the
   *  upstream layer (V3 rewrite, prose rewrite, or engine fallback)
   *  produced. The polish run rewrites this string. */
  targetSectionBody: string;
  /** Every OTHER section's rendered prose, keyed by sectionId. The
   *  polish must avoid duplicating any verbatim ≥6-word phrase that
   *  appears in any of these. Canonical-sort by sectionId for cache
   *  stability — handled inside {@link crossSectionPolishHash}. */
  otherSectionBodies: Record<CrossSectionPolishSectionId, string>;
}

// ─────────────────────────────────────────────────────────────────────
// System + user prompts
// ─────────────────────────────────────────────────────────────────────

export const CROSS_SECTION_POLISH_SYSTEM_PROMPT = `You are polishing one section of an identity-shape report to remove cross-section repetition. The report has multiple sections; each has been independently rewritten by a prior LLM layer. The independent rewrites sometimes land on the SAME vivid phrasing or imagery in multiple sections, which reads as parroting to the user.

Your job: rewrite the target section so it preserves the engine read, preserves the section's voice, and avoids any verbatim ≥6-word phrase that already appears in another section.

# Rules

1. Preserve the engine read. Do NOT change WHAT the section says — only HOW it says repeated phrases.
2. Preserve voice / register / sentence shapes outside the repeated phrases.
3. Preserve bold field labels, blockquote pull-quotes, and any structural markdown (lists, callouts) the upstream rewrite emitted.
4. Replace each repeated ≥6-word phrase with a paraphrase that says the SAME thing differently. The paraphrase MUST be a meaningful re-statement — synonym swaps are not enough.
5. If the repeated phrase is a canonical archetype-imagery hook (e.g. "writing the strategy memo nobody asked for"), replace it with a different concrete image from the same archetype's imagery register. The new image must read as a scene the user would recognize from their own week.
6. If a phrase HAS to repeat (proper nouns, the user's protected values, structural anchors), it may — repetition is only a problem for vivid descriptive prose.
7. Output the polished section markdown ONLY. No preamble. No commentary. No "Here is the polished section" framing.`;

export function buildCrossSectionPolishUserPrompt(
  inputs: CrossSectionPolishInputs
): string {
  const lines: string[] = [
    `Section: ${inputs.sectionId}`,
    `Archetype: ${inputs.archetype}`,
    "",
    "Other sections in this report (avoid verbatim ≥6-word phrase overlap with any of these):",
    "",
  ];
  const otherKeys = Object.keys(inputs.otherSectionBodies).sort();
  for (const key of otherKeys) {
    lines.push(`--- ${key} ---`);
    lines.push(inputs.otherSectionBodies[key]);
    lines.push("");
  }
  lines.push(`Target section to polish (rewrite this; preserve voice + read):`);
  lines.push("```");
  lines.push(inputs.targetSectionBody);
  lines.push("```");
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Cache key + lookup
// ─────────────────────────────────────────────────────────────────────

export function crossSectionPolishHash(
  inputs: CrossSectionPolishInputs
): string {
  const otherKeys = Object.keys(inputs.otherSectionBodies).sort();
  const sortedOthers: Record<string, string> = {};
  for (const key of otherKeys) sortedOthers[key] = inputs.otherSectionBodies[key];
  const sorted = {
    archetype: inputs.archetype,
    otherSectionBodies: sortedOthers,
    sectionId: inputs.sectionId,
    targetSectionBody: inputs.targetSectionBody,
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

/**
 * Render-path lookup. Returns the committed polish (if cached), then
 * the runtime polish (filled in by build* scripts), else null. The
 * render path treats null as "use the upstream prose unchanged" — no
 * fallback, no engine regeneration, no API spend.
 */
export function readCachedCrossSectionPolish(
  inputs: CrossSectionPolishInputs
): string | null {
  const key = crossSectionPolishHash(inputs);
  const committedHit = CACHE[key]?.rewrite ?? null;
  if (committedHit !== null) return committedHit;
  const runtimeHit = RUNTIME_CACHE.get(key) ?? null;
  if (runtimeHit !== null) return runtimeHit;
  logCacheMiss({
    namespace: "cross-section-polish-rewrites",
    section: inputs.sectionId,
    cacheKey: key,
    fingerprint: fingerprintBody(inputs.targetSectionBody),
  });
  return null;
}

export function writeRuntimeCrossSectionPolish(
  inputs: CrossSectionPolishInputs,
  rewrite: string
): void {
  const key = crossSectionPolishHash(inputs);
  RUNTIME_CACHE.set(key, rewrite);
}

export function _clearRuntimeCrossSectionPolishCacheForTests(): void {
  RUNTIME_CACHE.clear();
}
