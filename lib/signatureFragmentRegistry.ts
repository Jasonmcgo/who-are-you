// CC-131 Part A.1 — Signature-fragment registry.
//
// **Purpose.** Several engine composers (notably the per-card
// gift/blind-spot specificity composers in `lib/identityEngine.ts`)
// are pure functions that return the same string for the same
// (category × shape) tuple. When a category fires in multiple cards
// (e.g. Discernment showing up in Top Gifts AND Trust — Ears AND
// Conviction — Voice), the same fragment lands verbatim in every
// card body — the "exceptionally repetitive" reader feedback that
// motivated CC-131.
//
// **Approach.** Each well-known reused fragment is keyed by a
// `FragmentFamily` identifier. The registry holds a small pool of
// phrasing variants per family — the first call within a single
// `buildInnerConstitution` render returns the canonical phrasing
// (`variants[0]`); the Nth call returns `variants[(N - 1) % L]`,
// wrapping or back-referencing once the pool exhausts. State lives
// on the `BuildContext.usedFragmentFamilies` map so the registry is
// pure-given-context (same inputs → same outputs).
//
// **Not a god module.** The registry only owns the variant POOLS and
// the deterministic pick logic. The COMPOSERS still own which fragment
// to emit; they call `pickFragmentVariant(ctx, family)` instead of
// hard-coding the canonical string. New reused fragments can be added
// to `FRAGMENT_VARIANT_POOLS` without touching the composers — and
// vice versa.

import type { BuildContext } from "./identityEngine";

/** Well-known reused fragment families. Add a key here + a variant
 *  pool below when a new repeated string is identified. The string
 *  value of the enum is what appears as the canonical first emission;
 *  registry consumers refer to the family by its TypeScript key. */
export type FragmentFamily =
  // Discernment gift, generic fallback (was: composeGiftSpecificity
  // L4853 of identityEngine.ts pre-CC-131).
  | "discernment_gift_generic"
  // Discernment blind spot, Ni-led with faith/honor priority (was
  // composeBlindSpotSpecificity L5003 pre-CC-131).
  | "discernment_blindspot_ni_faith"
  // Top-level GIFT_DESCRIPTION fallback for Discernment (the "you
  // tend to detect what doesn't add up before it surfaces openly"
  // table entry — surfaced by composers that pull GIFT_DESCRIPTION
  // directly).
  | "discernment_gift_description";

/**
 * Variant pool per family. `variants[0]` is the canonical phrasing —
 * what the report read pre-CC-131. Subsequent entries are
 * phrasing alternatives that preserve meaning (the "same finding"
 * read differently). When the pool exhausts, the registry wraps and
 * returns the canonical again — but in practice each family lands ≤
 * 3 times in one render, so the wrap rarely fires.
 *
 * **Variant authoring rules.** Every variant must (1) carry the same
 * semantic finding as variant[0], (2) be a complete sentence-tail
 * usable after `"For your shape, this expresses as "` (the engine's
 * PREFIX), and (3) read fresh — not a synonym swap of variant[0].
 */
const FRAGMENT_VARIANT_POOLS: Record<FragmentFamily, string[]> = {
  discernment_gift_generic: [
    "the eye for what doesn't add up — catching the mismatch before it surfaces in language.",
    "the noticing that registers what's off-key — the read that arrives before the inconsistency has a name.",
    "the radar for the unspoken mismatch — the kind of attention that hears the gap between what's said and what's actually being claimed.",
  ],
  discernment_blindspot_ni_faith: [
    "the long-arc read pre-judging — the pattern your shape has been reaching for becomes more visible than the patterns actually present.",
    "the long view foreclosing on present evidence — the read you've been carrying toward begins to filter out what would update it.",
    "anticipation harden into verdict — what started as foresight calcifies into a conclusion the present data isn't allowed to disturb.",
  ],
  discernment_gift_description: [
    "you tend to detect what doesn't add up before it surfaces openly",
    "you read the gap between what's said and what's actually in play",
    "you notice the inconsistencies that others walk past unnamed",
  ],
};

/**
 * Pick the next variant for a fragment family within the current
 * build context. Deterministic on `ctx.usedFragmentFamilies` — no
 * RNG. Side-effect: increments the per-family usage counter on
 * `ctx`. When `ctx` is undefined (callers that don't yet thread the
 * context), returns the canonical variant and emits nothing — old
 * behavior preserved.
 */
export function pickFragmentVariant(
  ctx: BuildContext | undefined,
  family: FragmentFamily
): string {
  const pool = FRAGMENT_VARIANT_POOLS[family];
  if (!ctx) return pool[0];
  const used = ctx.usedFragmentFamilies.get(family) ?? 0;
  const variant = pool[used % pool.length];
  ctx.usedFragmentFamilies.set(family, used + 1);
  return variant;
}

/**
 * Read-only test helper: how many times has `family` been consumed
 * in this build context? Used by the CC-131 dedup audit to assert no
 * family overflows its pool size in a single fixture render.
 */
export function fragmentFamilyUsageCount(
  ctx: BuildContext,
  family: FragmentFamily
): number {
  return ctx.usedFragmentFamilies.get(family) ?? 0;
}

/** Exposed so callers (or audits) can inspect the pool size and
 *  catalogue verbatim variants for grep-based assertions. */
export function fragmentVariantPool(family: FragmentFamily): string[] {
  return FRAGMENT_VARIANT_POOLS[family];
}
