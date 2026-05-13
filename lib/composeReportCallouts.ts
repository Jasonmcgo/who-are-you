// CC-PROSE-1B Layer 5 — Pulled-Forward Callouts composer.
//
// Three callouts at three report depths:
//   5A — One-Sentence Summary    (after Top Gifts/Edges table, before
//                                 "What Others May Experience")
//   5B — Most Useful Line        (inside Synthesis section, after the
//                                 parallel-line tercet)
//   5C — Final Line              (end of report, after Closing Read)
//
// Single-source-of-truth rule (CC-PROSE-1B method discipline):
//   • 5A.summary           = composeThesisLine(constitution)        (verbatim)
//   • 5B.mostUsefulLine    = composeGiftDangerLine(constitution)    (verbatim)
//   • 5C.finalLine         = mechanical recombination of the thesis
//                            shapeDescriptor + structuralY, with a
//                            connector word and an -ing→infinitive
//                            transformation. NO new vocabulary. Returns
//                            null when the mechanical transformation
//                            doesn't yield a clean imperative.
//
// HARD GUARDRAIL on Final Line: do NOT fabricate. Do NOT hand-roll
// per-shape strings. The composer is one mechanical function across all
// shapes; it returns null where the recombination is ambiguous so the
// gap surfaces honestly rather than as a generic phrase.

import {
  composeGiftDangerLine,
  composeThesisLine,
  getThesisComponents,
} from "./identityEngine";
import type { InnerConstitution } from "./types";

export type ReportCallouts = {
  summary: string;
  mostUsefulLine: string;
  finalLine: string | null;
};

// CC-PROSE-1B Layer 5C — closed connector set. The composer picks the
// most coherent connector for each shape based on the imperative head's
// register. Default is ". The work is to " (works for the broadest set
// of structuralY phrasings). Future tuning may re-route specific dom
// keys to alternative connectors; for v1, single connector for
// uniformity + audit-deterministic output.
const FINAL_LINE_CONNECTOR = "The work is to ";

// CC-PROSE-1B Layer 5C — mechanical -ing → infinitive transformation.
// The thesis structuralY values in identityEngine.ts are uniformly cast
// in present-participle voice ("translating ...", "letting ...",
// "saying ...", "naming ...", "authoring ...", "communicating ...",
// "examining ...", "borrowing ...", "holding ...", "letting ...").
//
// Mechanical rule:
//   1. Take the first whitespace-separated token of structuralY.
//   2. If it ends in "ying" (e.g., "saying"), drop "ying" → "y" + "say"
//      yields "say". General rule: "ying" → "y" only when stem ends in
//      "y" before "-ing"; otherwise "ying" → "y" doesn't apply (no such
//      cases in our template set). Fall through to rule 3.
//   3. If it ends in "ing", drop "ing" and reattach the rest of the
//      sentence. Pattern matches: "translating" → "translate",
//      "letting" → "let" (double-consonant-ing — handled below),
//      "saying" → "say", "examining" → "examine" (silent-e restoration —
//      handled below), "naming" → "name", "authoring" → "author",
//      "communicating" → "communicate" (silent-e), "borrowing" →
//      "borrow", "holding" → "hold".
//   4. Doubled-consonant restoration: when stem ends in a doubled
//      consonant before "-ing" (e.g., "letting" / "stopping"), drop one
//      letter → "let" / "stop". The structuralY templates use "letting"
//      and (rarely) "putting"; both are the doubled-consonant case.
//   5. Silent-e restoration: a tiny dictionary (DROP_E_VERBS) of -ate /
//      -ute / -ine bases that lose their final "e" when -ing is added.
//      Re-attach the "e" after stripping "ing".
//   6. If transformation produces an empty stem or a stem that doesn't
//      look like a verb infinitive (heuristic: shorter than 3 chars,
//      ends in unusual letter combos), return null and let the caller
//      surface the gap.
// Bases that drop trailing "e" before -ing; restore the "e" after
// stripping "ing".
const DROP_E_VERBS = new Set<string>([
  // From structuralY templates:
  "translate",
  "examine",
  "communicate",
  "name",
  "use",
  "make",
  "take",
  "have",
]);

function imperativeFromIngStem(participleHead: string): string | null {
  if (!participleHead) return null;
  const lower = participleHead.toLowerCase();
  if (lower.length < 4) return null;
  if (!lower.endsWith("ing")) return null;

  const stem = lower.slice(0, -3); // drop "ing"

  // Rule 4 — doubled-consonant restoration. Only "letting" in v1; the
  // table catches it explicitly so we don't false-positive on
  // "wrestling" or similar non-doubled "tting" tails.
  if (lower === "letting") return "let";
  if (lower === "putting") return "put";
  if (lower === "stopping") return "stop";

  // Rule 5 — silent-e restoration. Stem + "e" is the canonical form
  // when the result is in DROP_E_VERBS. We add a heuristic for -ate /
  // -ute / -ine stems beyond the explicit list.
  const stemPlusE = stem + "e";
  if (DROP_E_VERBS.has(stemPlusE)) return stemPlusE;
  if (
    stem.endsWith("at") ||
    stem.endsWith("ut") ||
    stem.endsWith("in") ||
    stem.endsWith("ic") ||
    stem.endsWith("us") ||
    stem.endsWith("ot") ||
    stem.endsWith("ag") ||
    stem.endsWith("os") ||
    stem.endsWith("am") ||
    stem.endsWith("ar")
  ) {
    return stemPlusE;
  }

  // Rule 3 — plain stem (saying → say, naming → name (handled by silent-e),
  // authoring → author, holding → hold, borrowing → borrow).
  if (stem.length < 2) return null;
  return stem;
}

// Mechanical -ing → imperative for the FULL structuralY phrase: rebuild
// the phrase with the head transformed.
export function structuralYAsImperative(structuralY: string): string | null {
  const trimmed = structuralY.trim();
  if (!trimmed) return null;

  // Split on first whitespace; everything after is the rest of the phrase.
  const firstSpaceIdx = trimmed.search(/\s/);
  const head = firstSpaceIdx === -1 ? trimmed : trimmed.slice(0, firstSpaceIdx);
  const rest = firstSpaceIdx === -1 ? "" : trimmed.slice(firstSpaceIdx);

  const imperativeHead = imperativeFromIngStem(head);
  if (!imperativeHead) return null;

  return imperativeHead + rest;
}

export function composeReportCallouts(
  constitution: InnerConstitution
): ReportCallouts {
  // 5A — One-Sentence Summary. Identical to Executive Read sentence #3.
  const summary = composeThesisLine(constitution);

  // 5B — Most Useful Line. Identical to Executive Read sentences #1+#2.
  const mostUsefulLine = composeGiftDangerLine(constitution);

  // 5C — Final Line. Mechanical recombination; null if it doesn't yield
  // a clean imperative.
  const components = getThesisComponents(constitution);
  const imperativeY = structuralYAsImperative(components.structuralY);
  let finalLine: string | null = null;
  if (imperativeY) {
    // Cap at 200 chars for the closing-of-the-closing — anything longer
    // becomes a paragraph rather than a carry-away line. The current
    // template set produces lines comfortably under this cap.
    const candidate = `You are a ${components.shapeDescriptor}. ${FINAL_LINE_CONNECTOR}${imperativeY}.`;
    if (candidate.length <= 220) {
      finalLine = candidate;
    }
  }

  return { summary, mostUsefulLine, finalLine };
}
