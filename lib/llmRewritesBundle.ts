// CC-LLM-REWRITES-PERSISTED-ON-SESSION — per-session LLM rewrite bundle.
//
// The bundle is the render-path cache that replaces runtime Anthropic
// calls. A session row carries:
//   - `llm_rewrites` — a `LlmRewritesBundle` JSON blob, keyed by layer
//   - `llm_rewrites_engine_hash` — a deterministic hash of the engine
//     inputs that produced the rewrites. Render path compares against
//     a freshly-computed hash before serving the bundle.
//
// Architecture (after this CC lands):
//
//   ┌─────────────────────────────────────────────────────┐
//   │ render path (page / api/render / api/report-cards)  │
//   │   1. committed cache check  (lib/cache/*.json)      │
//   │   2. session bundle check   (this module)           │
//   │   3. runtime guard          (LLM_REWRITE_RUNTIME)   │
//   │   4. runtime LLM call       (build* scripts only)   │
//   └─────────────────────────────────────────────────────┘
//
// The runtime LLM branch is reachable only when
// `process.env.LLM_REWRITE_RUNTIME === "on"` AND `ANTHROPIC_API_KEY` is
// present. Build scripts opt into this branch by setting the env var at
// the top of the script. The render path leaves it off, so a missing
// bundle deterministically falls through to engine prose — no API spend.

import { createHash } from "node:crypto";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "./types";

/**
 * Per-layer cache shape. Each key is the same canonical-string hash the
 * existing readCached* functions use (`proseRewriteHash`,
 * `keystoneRewriteHash`, `inputsHash`, `gripInputsHash`,
 * `v3RewriteHash`). The render path reuses those key-builders so the
 * lookup is deterministic without re-deriving any hash logic here.
 *
 * `bundleVersion` is bumped if the bundle shape ever changes in a way
 * that requires migration; readers should fail-safe (treat unknown
 * versions as null) rather than guess.
 */
export interface LlmRewritesBundle {
  prose: Record<string, { rewrite: string }>;
  keystone: Record<string, { rewrite: string }>;
  synthesis3: Record<string, { paragraph: string }>;
  grip: Record<string, { paragraph: string }>;
  launchPolishV3: Record<string, { rewrite: string }>;
  generatedAt: string;
  bundleVersion: 1;
}

export const CURRENT_BUNDLE_VERSION = 1 as const;

/**
 * `emptyLlmRewritesBundle` — construct a fresh empty bundle. Used by
 * the backfill script when a session row has no matching cache keys
 * (still a valid bundle; the renderer just falls through to engine
 * prose for every layer).
 */
export function emptyLlmRewritesBundle(): LlmRewritesBundle {
  return {
    prose: {},
    keystone: {},
    synthesis3: {},
    grip: {},
    launchPolishV3: {},
    generatedAt: new Date().toISOString(),
    bundleVersion: CURRENT_BUNDLE_VERSION,
  };
}

/**
 * `bundleLookup` — typed accessor for a single layer + cache-key lookup.
 * Returns the cached rewrite/paragraph string or null when the bundle
 * is null, the layer is missing, or the key is not present.
 *
 * Callers use this from the five LlmServer modules' Step 2 (the
 * session-bundle check that runs BETWEEN committed-cache miss and the
 * runtime gate). Centralising the lookup ensures every layer uses the
 * same null-safe contract.
 */
export function bundleLookup(
  bundle: LlmRewritesBundle | null,
  layer: keyof Omit<LlmRewritesBundle, "generatedAt" | "bundleVersion">,
  key: string
): string | null {
  if (!bundle) return null;
  if (bundle.bundleVersion !== CURRENT_BUNDLE_VERSION) return null;
  const layerMap = bundle[layer];
  const entry = layerMap[key];
  if (!entry) return null;
  if ("rewrite" in entry) return entry.rewrite;
  if ("paragraph" in entry) return entry.paragraph;
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Engine-hash helper
// ─────────────────────────────────────────────────────────────────────

/**
 * `hashEngineForLlmBundle` — deterministic hash of the engine inputs
 * that drive every layer's cache key. The hash is written to
 * `sessions.llm_rewrites_engine_hash` alongside the bundle and is
 * compared by the render path before serving the bundle. A mismatch
 * means the engine has moved on (signal weights changed, archetype
 * router updated, etc.) and the bundle is stale.
 *
 * Stability requirements (per CC):
 *   - Sort all inputs canonically before serialising.
 *   - Include exactly the fields any of the five rewrite layers
 *     consume as input.
 *   - Byte-stable across re-runs.
 *
 * The five layers' inputs trace back to:
 *   - prose            archetype + cardId + engineSectionBody +
 *                      reservedCanonLines (from clinician markdown)
 *   - keystone         archetype + belief_text + value_domain +
 *                      top compass labels + cost/correction surfaces +
 *                      conviction_temperature + epistemic_posture
 *   - synthesis3       PathMasterInputs (constitution-derived)
 *   - grip             GripParagraphInputs (constitution-derived)
 *   - launchPolishV3   archetype + sectionId + engineSectionBody +
 *                      topCompassValueLabels + reservedCanonLines
 *
 * The common dependency chain is: `InnerConstitution` + `Answer[]` +
 * `DemographicSet`. The clinician-mode rendered markdown is the
 * downstream artefact every per-section `engineSectionBody` is sliced
 * from — including it in the hash captures any engine prose change.
 * Hashing the rendered clinician markdown directly would be the safest
 * proxy, but the render call is heavy; we hash the canonical
 * constitution fields the renderer depends on plus the archetype +
 * profile keys directly, and accept that engine prose-template
 * tweaks may invalidate the bundle. That trade-off is intentional —
 * stale prose is preferable to spurious LLM calls.
 */
export function hashEngineForLlmBundle(
  innerConstitution: InnerConstitution,
  answers: Answer[],
  demographics: DemographicSet | null
): string {
  // Build a canonical input record. Answer ordering depends on the
  // session, so sort by question_id; demographics answers also sort.
  const sortedAnswers = [...answers].sort((a, b) =>
    a.question_id.localeCompare(b.question_id)
  );
  const sortedDemographics = demographics
    ? {
        ...demographics,
        answers: demographics.answers
          ? [...demographics.answers].sort((a, b) =>
              a.field_id.localeCompare(b.field_id)
            )
          : [],
      }
    : null;

  // Pull out the engine-derived fields that compose every layer's
  // cache key. profileArchetype.primary drives every per-layer hash;
  // lens_stack + signals + belief_under_tension drive keystone +
  // synthesis3 + grip; handsCard + mirror prose-blocks drive prose
  // rewrites via the clinician markdown.
  const canonicalConstitution = {
    archetype: innerConstitution.profileArchetype?.primary ?? "unmappedType",
    lensStack: innerConstitution.lens_stack,
    signals: innerConstitution.signals,
    beliefUnderTension: innerConstitution.belief_under_tension ?? null,
    handsCard: innerConstitution.handsCard ?? null,
    // mirror prose lines are template-driven; including them ensures
    // any template edit invalidates the bundle.
    mirror: innerConstitution.mirror,
  };

  const canonical = {
    constitution: canonicalConstitution,
    answers: sortedAnswers,
    demographics: sortedDemographics,
    // engineSchemaVersion lets us bump every backfilled bundle at once
    // by changing the constant. Keep at 1 until a breaking change
    // ships in the constitution shape.
    engineSchemaVersion: 1,
  };

  const json = JSON.stringify(canonical);
  return createHash("sha256").update(json).digest("hex");
}
