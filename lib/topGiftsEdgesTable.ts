// CC-PROSE-1B Layer 6 — shared helpers for the Top Gifts + Growth Edges
// unified table. Used by both `renderMirrorAsMarkdown` and the React
// `TopGiftsGrowthEdgesTable` component so the two surfaces produce
// identical "What it means" column content (single source of truth, no
// re-derivation, audit-checkable).

// First-sentence extractor for the "What it means" column. Lifts only
// the first descriptive sentence from the gift paragraph — no rewording,
// no compression beyond the sentence-boundary truncation. The audit
// asserts that the rendered "What it means" cell is a substring of the
// original paragraph (no invented vocabulary).
//
// Sentence-boundary heuristic:
//   1. Find the earliest period followed by either end-of-string or a
//      whitespace + capital letter.
//   2. If no boundary is found, fall back to the full paragraph (rare —
//      gift paragraphs in the engine canon are multi-sentence).
//   3. Trim trailing whitespace; preserve the terminal period.
export function firstSentence(paragraph: string): string {
  const trimmed = paragraph.trim();
  if (!trimmed) return "";

  // Match: a period that's followed by space + uppercase letter, OR by
  // end-of-string. Avoid false-positives on common abbreviations by
  // requiring the next character (after the optional whitespace) to
  // start a new sentence (capital letter).
  const match = trimmed.match(/^([\s\S]*?\.)(\s+[A-Z]|$)/);
  if (!match) return trimmed;

  return match[1].trim();
}
