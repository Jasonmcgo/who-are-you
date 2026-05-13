// CC-KEYSTONE-RENDER — render-time LLM rewrite for the Keystone
// Reflection section. The engine measures the belief structurally
// (value_domain / conviction_temperature / epistemic_posture). The
// LLM produces the human interpretive paragraph that engages the
// user's exact wording, places the belief inside the value cluster,
// names the marked cost surface, and lands a growth edge about HOW
// the belief is carried.
//
// Pure data — no `node:*`, no SDK. The server-side composer lives
// in `lib/keystoneRewriteLlmServer.ts`; this module exports the types,
// the system prompt, the user-prompt builder, the cache key, and the
// runtime lookup (client-bundle-safe).

import cacheData from "./cache/keystone-rewrites.json";

import type { ProfileArchetype } from "./profileArchetype";
import type {
  ConvictionTemperature,
  EpistemicPosture,
  ValueDomain,
} from "./types";
import { fingerprintBody, logCacheMiss } from "./cacheObservability";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export interface KeystoneRewriteInputs {
  archetype: ProfileArchetype;
  /** The user's exact belief wording (Q-I1 or Q-I1b freeform). Verbatim. */
  beliefText: string;
  /** Engine-derived value cluster the belief sits inside. */
  valueDomain: ValueDomain;
  /** Top compass value labels (e.g. ["Knowledge", "Peace", "Honor"]). */
  topCompassValueLabels: string[];
  /** Q-I3 cost-surface labels the user marked (e.g. ["Close relationships", "Money / Wealth"]). */
  costSurfaceLabels: string[];
  /** Q-I3 None-selected flag. */
  costSurfaceNoneSelected: boolean;
  /** Q-I2 correction-channel labels the user marked. */
  correctionChannelLabels: string[];
  /** Q-I2 None-selected flag. */
  correctionChannelNoneSelected: boolean;
  convictionTemperature: ConvictionTemperature;
  epistemicPosture: EpistemicPosture;
}

// ─────────────────────────────────────────────────────────────────────
// Archetype voice per CC §6 register
// ─────────────────────────────────────────────────────────────────────

const ARCHETYPE_VOICE: Record<ProfileArchetype, string> = {
  jasonType:
    "Long-arc, architectural, knowledge-protective. A thoughtful friend who reads sentence-construction itself. Sentences land hard; the texture is in what the wording reveals. No flourish, no preaching.",
  cindyType:
    "Present-tense, relational, family-protective. A thoughtful friend who reads how a belief sits with the people it touches. Warmth without softening the point.",
  danielType:
    "Precedent-bound, structural, faith-formed. A thoughtful friend who reads how a belief sits inside what has endured. Quiet seriousness without devotional cadence.",
  unmappedType:
    "Plain-language, shape-aware. A thoughtful friend reading the specific belief the user wrote, without leaning on a named archetype.",
};

// ─────────────────────────────────────────────────────────────────────
// System prompt — implements the 8 rules from CC-KEYSTONE-RENDER
// ─────────────────────────────────────────────────────────────────────

export const KEYSTONE_REWRITE_SYSTEM_PROMPT = `You are writing one section of an identity-shape report: the Keystone Reflection. This is the moment the report engages the user's exact belief statement. The engine has measured the belief structurally; your job is to write the human interpretive paragraph.

# Target register
WARM PRECISION. Closer to a thoughtful friend's read than a clinician's note. No devotional cadences ("blessed," "sacred journey," "faith journey," "spiritual walk"), no clinical hedging ("the subject's belief structure"), no flattery ("what a profound belief"). Speak to the user directly, second person.

# Rules (HARD)

1. **Anchor on the user's exact wording.** The paragraph OPENS with the user's belief statement quoted verbatim on its own line as a markdown blockquote ("> ..."). No paraphrase substitution. The quote is the load-bearing artifact.

2. **Engage the wording itself.** Name what the wording reveals — its tone, its theological or moral register, what it suggests about HOW the user holds the belief. Notice specific words and what they imply. Do NOT say "this is doctrine" or "this is sentiment." Read the actual sentence the user wrote.

3. **Place inside the value cluster.** Name the values the engine placed the belief inside. Fold them into the prose; do not list them as a metadata row.

4. **Engage the cost surface.** The user marked specific stakes (close relationships, money, reputation, career, health) as concrete costs they'd bear for this belief. Name those specific costs in plain language. Land the point: the belief is not decorative; it belongs to the part of the user that would pay a price. If the user marked NONE, name that refusal: the belief sits inside what the user would not trade.

5. **Name the growth edge specifically.** Not "you should weaken the belief." Not "you should hold it more loosely." Engage HOW the user carries the belief — humility in expression, openness to revision, the relationship between centrality and tone. Often: keep the way of carrying as humble as the sentence itself.

6. **Do not evaluate the belief.** Do NOT judge whether the belief is true, correct, profound, or wise. Do NOT editorialize about the religion, tradition, or ideology the wording draws from. The engine reads STRUCTURAL ROLE, not content.

7. **Length.** One paragraph, or two short paragraphs. The Keystone is a moment of warmth and precision, not a long-form essay. Roughly 90-160 words after the opening quote.

8. **Banlist.** Zero occurrences of any of: "faith journey," "spiritual walk," "blessed," "sacred journey," "deep convictions" (as a flatter), "profound belief," "the subject," "the user," "the model detects," "composite read," "Likely value," "Wording temperature," "Openness to revision," "Unsure" (as metadata), "Big Five," "OCEAN," "register" (as a technical suffix). Do NOT include the metadata row format ("- **Likely value:** ..." etc.) — that lives in clinician mode only.

# Output structure

Output ONLY the section body (no header). Format exactly:

> [user's belief text, quoted verbatim, on its own blockquote line]

[one paragraph engaging the wording, placing inside values, naming costs]

[optional second short paragraph naming the growth edge in how the belief is carried]

No preamble, no commentary, no wrapping quotes around the whole output. Just the blockquote followed by the prose.`;

// ─────────────────────────────────────────────────────────────────────
// User-prompt builder
// ─────────────────────────────────────────────────────────────────────

function joinHumanList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const VALUE_DOMAIN_LABEL: Record<ValueDomain, string> = {
  truth: "Truth",
  freedom: "Freedom",
  loyalty: "Loyalty",
  justice: "Justice",
  faith: "Faith",
  stability: "Stability",
  knowledge: "Knowledge",
  family: "Family",
  unknown: "(no clear sacred-value anchor)",
};

const TEMPERATURE_PLAIN: Record<ConvictionTemperature, string> = {
  high: "held deeply",
  moderate: "held with conviction but not emphatic about it",
  low: "held provisionally",
  unknown: "held with an unclear temperature",
};

const POSTURE_PLAIN: Record<EpistemicPosture, string> = {
  open: "open to revision when good evidence arrives",
  reflective: "actively wrestling with the belief",
  guarded: "held privately rather than openly",
  rigid: "held as identity rather than hypothesis",
  unknown: "with no articulated revision path",
};

export function buildKeystoneRewriteUserPrompt(
  inputs: KeystoneRewriteInputs
): string {
  const valueClusterParts: string[] = [];
  if (inputs.valueDomain !== "unknown") {
    valueClusterParts.push(VALUE_DOMAIN_LABEL[inputs.valueDomain]);
  }
  for (const v of inputs.topCompassValueLabels) {
    if (!valueClusterParts.includes(v)) valueClusterParts.push(v);
  }

  const costPhrase = inputs.costSurfaceNoneSelected
    ? "The user marked NONE of the offered stakes as something they would bear losing for this belief. This is a refusal-to-trade — the belief sits inside what they protect."
    : inputs.costSurfaceLabels.length > 0
      ? `Concrete costs the user marked as willing to bear for this belief: ${joinHumanList(inputs.costSurfaceLabels)}.`
      : "The user did not mark a clear cost surface for this belief.";

  const correctionPhrase = inputs.correctionChannelNoneSelected
    ? "The user marked NONE of the offered correction channels as capable of revising this belief."
    : inputs.correctionChannelLabels.length > 0
      ? `Correction channels the user marked as potentially capable of revising this belief: ${joinHumanList(inputs.correctionChannelLabels)}.`
      : "The user did not mark a clear correction channel for this belief.";

  const lines: string[] = [
    `Archetype: ${inputs.archetype}`,
    "",
    `Voice for this archetype: ${ARCHETYPE_VOICE[inputs.archetype]}`,
    "",
    "The user's exact belief statement (anchor the paragraph on this verbatim quote):",
    "```",
    inputs.beliefText,
    "```",
    "",
    `Value cluster the engine placed the belief inside: ${
      valueClusterParts.length > 0 ? joinHumanList(valueClusterParts) : "no clear cluster"
    }.`,
    "",
    costPhrase,
    "",
    correctionPhrase,
    "",
    `Engine structural read (do NOT echo these labels — convert to plain prose if relevant): the belief is ${TEMPERATURE_PLAIN[inputs.convictionTemperature]}, ${POSTURE_PLAIN[inputs.epistemicPosture]}.`,
    "",
    "Write the Keystone Reflection section body now. Open with the verbatim blockquote, then one paragraph (or one + a short second paragraph). Engage the wording, place inside the value cluster, name the marked cost surface, name the growth edge in HOW the belief is carried. Plain warm precision. No preamble.",
  ];
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Cache key + lookup
// ─────────────────────────────────────────────────────────────────────

/** Deterministic canonical-string hash of inputs. */
export function keystoneRewriteHash(inputs: KeystoneRewriteInputs): string {
  const sorted = {
    archetype: inputs.archetype,
    beliefText: inputs.beliefText,
    convictionTemperature: inputs.convictionTemperature,
    correctionChannelLabels: [...inputs.correctionChannelLabels].sort(),
    correctionChannelNoneSelected: inputs.correctionChannelNoneSelected,
    costSurfaceLabels: [...inputs.costSurfaceLabels].sort(),
    costSurfaceNoneSelected: inputs.costSurfaceNoneSelected,
    epistemicPosture: inputs.epistemicPosture,
    topCompassValueLabels: [...inputs.topCompassValueLabels].sort(),
    valueDomain: inputs.valueDomain,
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

// CC-LIVE-SESSION-LLM-WIRING — process-scoped runtime cache (see the
// twin in proseRewriteLlm.ts).
const RUNTIME_CACHE = new Map<string, string>();

export function readCachedKeystoneRewrite(
  inputs: KeystoneRewriteInputs
): string | null {
  const key = keystoneRewriteHash(inputs);
  const committedHit = CACHE[key]?.rewrite ?? null;
  if (committedHit !== null) return committedHit;
  const runtimeHit = RUNTIME_CACHE.get(key) ?? null;
  if (runtimeHit !== null) return runtimeHit;
  // CC-CACHE-MISS-LOUDFAIL — emit a structured warning so live-session
  // Keystone misses surface in dev terminals + aggregated logs. Return
  // value unchanged; splice still falls through to engine prose +
  // legacy metadata bullets.
  logCacheMiss({
    namespace: "keystone-rewrites",
    section: "keystone",
    cacheKey: key,
    fingerprint: fingerprintBody(inputs.beliefText),
  });
  return null;
}

/** CC-LIVE-SESSION-LLM-WIRING — write a freshly-resolved Keystone rewrite
 *  into the runtime cache so subsequent calls in the same process hit
 *  without re-calling the API. */
export function writeRuntimeKeystoneRewrite(
  inputs: KeystoneRewriteInputs,
  rewrite: string
): void {
  const key = keystoneRewriteHash(inputs);
  RUNTIME_CACHE.set(key, rewrite);
}

/** Test-only — clear runtime cache between assertions. */
export function _clearRuntimeKeystoneCacheForTests(): void {
  RUNTIME_CACHE.clear();
}
