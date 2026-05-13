// CC-KEYSTONE-USER-MODE-UNCONDITIONAL — Tier C deterministic fallback.
//
// When the LLM cache misses AND the on-demand resolver (CC-LIVE-SESSION-
// LLM-WIRING) doesn't succeed either, user-mode Keystone must still emit
// human prose, never the engine field-list or engine valueOpener
// paragraph. This module composes a tight 2-3 sentence fallback from
// the same structural inputs the LLM uses, with no engine artifacts.
//
// Structural guarantees (mirror the audit gates):
//   - Opens with the user's verbatim belief text as a blockquote.
//   - Plain prose paragraph(s); NO `- **<label>:**` bullets.
//   - No "Unsure" literal.
//   - No "with X as the value most directly at risk for it" tail (the
//     engine `valueOpener` signature).
//   - No qi2/qi3 citation phrasings from the engine prose.

import type { KeystoneRewriteInputs } from "./keystoneRewriteLlm";
import type { ProfileArchetype } from "./profileArchetype";

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const ARCHETYPE_CLOSING: Record<ProfileArchetype, string> = {
  jasonType:
    "The shape this points to is a belief held inside what you protect, not outside it.",
  cindyType:
    "The shape this points to is a belief held close to the people it names, not at a distance.",
  danielType:
    "The shape this points to is a belief that holds across time, not against it.",
  unmappedType:
    "The shape this points to is a belief held inside what you protect, not outside it.",
};

function valueClusterSentence(inputs: KeystoneRewriteInputs): string {
  const labels: string[] = [];
  // Compose the cluster from the engine-derived top compass values, with
  // the BeliefUnderTension.value_domain as a tiebreaker if not already
  // present and the cluster isn't empty.
  for (const v of inputs.topCompassValueLabels) {
    if (!labels.includes(v)) labels.push(v);
  }
  if (labels.length === 0) {
    return "This belief sits inside the values your selections protect.";
  }
  // NOTE — we drop the engine's "with X as the value most directly at
  // risk for it" suffix on purpose. That phrase is the engine
  // `valueOpener` signature and the CC explicitly forbids it in user
  // mode.
  return `Your selections place this belief inside ${joinList(labels)}.`;
}

function costSurfaceSentence(inputs: KeystoneRewriteInputs): string | null {
  if (inputs.costSurfaceNoneSelected) {
    return "You marked none of the offered stakes as something you would trade for it — the refusal is informative on its own.";
  }
  const cs = inputs.costSurfaceLabels.filter((s) => s.length > 0);
  if (cs.length === 0) return null;
  if (cs.length === 1) {
    return `You marked ${cs[0]} as a concrete cost you would bear for it — a single named price.`;
  }
  if (cs.length === 2) {
    return `You marked ${cs[0]} and ${cs[1]} as concrete costs you would bear for it.`;
  }
  return `You marked ${joinList(cs)} as concrete costs you would bear for it — a wide cost surface.`;
}

/**
 * composeKeystoneFallback — Tier C deterministic Keystone body.
 * Output starts with the verbatim belief blockquote and continues with
 * one paragraph of plain prose. Safe in user mode regardless of LLM
 * cache state; never emits engine field-list or `valueOpener` prose.
 */
export function composeKeystoneFallback(
  inputs: KeystoneRewriteInputs
): string {
  const lines: string[] = [];
  // Verbatim belief quote (Rule 4 — present in every tier).
  const beliefLines = inputs.beliefText.split(/\r?\n/);
  for (const bl of beliefLines) {
    lines.push(`> ${bl}`);
  }
  lines.push("");
  const sentences: string[] = [];
  sentences.push(valueClusterSentence(inputs));
  const cs = costSurfaceSentence(inputs);
  if (cs) sentences.push(cs);
  sentences.push(ARCHETYPE_CLOSING[inputs.archetype]);
  lines.push(sentences.join(" "));
  return lines.join("\n");
}
