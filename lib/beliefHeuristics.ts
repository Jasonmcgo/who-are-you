// CC-017 — Keystone Reflection / Belief Under Tension structured-source extractor.
//
// Architectural shift from CC-015c: the engine no longer text-mines the freeform
// content of Q-I1 / Q-I2 / Q-I3 to derive BeliefUnderTension. Instead it reads
// the user's structured selections in the multiselect_derived Q-I2 (trust drivers
// that could revise the belief) and Q-I3 (sacred drivers the user would risk for
// the belief), with Q-I1 (or Q-I1b on Q-I1 skip) supplying the freeform belief
// anchor for verbatim display only.
//
// The four catalog signals (independent_thought_signal, epistemic_flexibility,
// conviction_under_cost, cost_awareness) STILL fire from Q-I1 freeform content
// via extractFreeformSignals in identityEngine.ts. They live on the Signal[]
// array — a different abstraction layer from BeliefUnderTension. Both surfaces
// run on the same Q-I1 content but produce different shapes for different
// consumers. See CC-017 § Item 1.
//
// Bound by the "do not score belief content" rule (result-writing-canon.md):
//   - The model does not judge whether the belief is correct.
//   - The model only reads the structural role the belief plays in the user's shape.
//   - The user's verbatim text surfaces; the model's interpretation is structural.

import type {
  Answer,
  BeliefUnderTension,
  ConvictionTemperature,
  DemographicSet,
  EpistemicPosture,
  MultiSelectDerivedAnswer,
  ValueDomain,
} from "./types";
// CC-138.2 — heuristic analysis of saved answers must see every
// question def including legacy entries; use `allQuestions`.
import { allQuestions as questions } from "../data/questions";

// ── Anchor + Q-I2 / Q-I3 lookup helpers ──────────────────────────────────

type AnchorResult = {
  text: string;
  source: "Q-I1" | "Q-I1b" | null;
};

function findBeliefAnchor(answers: Answer[]): AnchorResult {
  const qi1 = answers.find((a) => a.question_id === "Q-I1");
  if (qi1 && qi1.type === "freeform" && qi1.response.trim().length > 0) {
    return { text: qi1.response.trim(), source: "Q-I1" };
  }
  const qi1b = answers.find((a) => a.question_id === "Q-I1b");
  if (qi1b && qi1b.type === "freeform" && qi1b.response.trim().length > 0) {
    return { text: qi1b.response.trim(), source: "Q-I1b" };
  }
  return { text: "", source: null };
}

function findMultiSelect(
  answers: Answer[],
  questionId: string
): MultiSelectDerivedAnswer | null {
  const a = answers.find((x) => x.question_id === questionId);
  if (!a || a.type !== "multiselect_derived") return null;
  return a;
}

// ── value_domain — derived from the user's sacred-value rankings ─────────
//
// CC-024: pre-CC-024, value_domain derived from Q-I3 selections (which were
// sacred-value drivers via Q-S1/Q-S2 derivation). Q-I3 now derives from
// Q-Stakes1 (concrete loss domains), so its selections no longer carry
// sacred-value semantics. value_domain is now sourced directly from the
// user's top sacred value across Q-S1 + Q-S2 — preserving the field's
// meaning ("which sacred value the belief touches") while disconnecting it
// from Q-I3's now-stakes-shaped output. The cost-bearing data Q-I3 carries
// flows through summarizeQI3Selections to the prose layer.

const SIGNAL_TO_VALUE_DOMAIN: Record<string, ValueDomain> = {
  truth_priority: "truth",
  freedom_priority: "freedom",
  loyalty_priority: "loyalty",
  stability_priority: "stability",
  family_priority: "family",
  knowledge_priority: "knowledge",
  justice_priority: "justice",
  faith_priority: "faith",
};

function deriveValueDomainFromSacredRanking(
  answers: Answer[]
): ValueDomain {
  // Walk Q-S1 + Q-S2 in source order; pick the user's top-ranked item across
  // both. Q-S1 / Q-S2 item ids are already ValueDomain-shaped strings
  // ("truth", "family", "freedom", etc.) — the existing convention from
  // CC-017 below.
  let best: ValueDomain | null = null;
  let bestRank = Number.POSITIVE_INFINITY;
  for (const a of answers) {
    if (a.type !== "ranking") continue;
    if (a.question_id !== "Q-S1" && a.question_id !== "Q-S2") continue;
    a.order.forEach((itemId, idx) => {
      const vd = itemId as ValueDomain;
      // Guard against unexpected item ids by checking the priority-signal
      // map — same defensive check the prior implementation used.
      if (!SIGNAL_TO_VALUE_DOMAIN[`${vd}_priority`]) return;
      // idx + 1 is rank within the ranking; lower wins. When the same
      // ValueDomain appears in both rankings, the lower rank wins.
      if (idx + 1 < bestRank) {
        best = vd;
        bestRank = idx + 1;
      }
    });
  }
  return best ?? "unknown";
}

// ── epistemic_posture — derived from Q-I2 selections ─────────────────────
//
// None of these → rigid
// Q-X4-cross "Own counsel" only (and no Q-X3-cross selections) → guarded
// 1-2 trust drivers → reflective
// 3+ trust drivers → open
//
// CC-032 cascade: Q-I2 now derives from Q-X3-cross + Q-X4-cross (the
// v2.5 multi-stage cross-ranks) instead of the legacy flat Q-X3 + Q-X4.
// `source_question_id` on each Q-I2 selection accordingly references the
// cross-rank parents. own_counsel_trust_priority itself is preserved by
// the Q-X4 restructure, so the "guarded" check survives the cascade.

function deriveEpistemicPostureFromQI2(
  qi2: MultiSelectDerivedAnswer | null
): EpistemicPosture {
  if (!qi2) return "unknown";
  if (qi2.none_selected) return "rigid";

  // Count derived selections (excluding "other" sentinel).
  const derivedSelections = qi2.selections.filter(
    (s) => s.signal !== null && s.source_question_id !== undefined
  );
  if (derivedSelections.length === 0) return "unknown";

  // "Guarded" check: only "Own counsel" selected from Q-X4-cross, with no
  // Q-X3-cross institutional source selected.
  const fromX3 = derivedSelections.filter(
    (s) => s.source_question_id === "Q-X3-cross"
  );
  const fromX4 = derivedSelections.filter(
    (s) => s.source_question_id === "Q-X4-cross"
  );
  if (
    fromX3.length === 0 &&
    fromX4.length === 1 &&
    fromX4[0].signal === "own_counsel_trust_priority"
  ) {
    return "guarded";
  }

  if (derivedSelections.length >= 3) return "open";
  return "reflective";
}

// ── conviction_temperature — derived from Q-I2 + Q-I3 combined cardinality ─
//
// Q-I2 None  + Q-I3 with selections → high   (impervious-but-cost-bearing)
// Q-I2 with  + Q-I3 None             → low    (revisable, low cost)
// Q-I2 with  + Q-I3 with             → moderate (revisable but cost-aware)
// Q-I2 None  + Q-I3 None             → unknown (held but no articulated cost or revision path)

function deriveConvictionTemperature(
  qi2: MultiSelectDerivedAnswer | null,
  qi3: MultiSelectDerivedAnswer | null
): ConvictionTemperature {
  const qi2Has =
    qi2 != null &&
    !qi2.none_selected &&
    qi2.selections.some((s) => s.signal !== null);
  const qi3Has =
    qi3 != null &&
    !qi3.none_selected &&
    qi3.selections.some((s) => s.signal !== null);
  const qi2None = qi2 != null && qi2.none_selected;
  const qi3None = qi3 != null && qi3.none_selected;

  if (qi2None && qi3Has) return "high";
  if (qi2Has && qi3None) return "low";
  if (qi2Has && qi3Has) return "moderate";
  if (qi2None && qi3None) return "unknown";
  return "unknown";
}

// ── Top-level extractor ─────────────────────────────────────────────────

export function extractBeliefUnderTension(
  answers: Answer[]
): BeliefUnderTension | null {
  const anchor = findBeliefAnchor(answers);
  if (anchor.source === null) return null;

  const qi2 = findMultiSelect(answers, "Q-I2");
  const qi3 = findMultiSelect(answers, "Q-I3");

  return {
    belief_text: anchor.text,
    belief_source_question_id: anchor.source,
    // CC-024 — value_domain now sourced from Q-S1/Q-S2 directly (the user's
    // top sacred value), not from Q-I3 (which post-CC-024 carries concrete-
    // stakes selections, not sacred-value drivers).
    value_domain: deriveValueDomainFromSacredRanking(answers),
    conviction_temperature: deriveConvictionTemperature(qi2, qi3),
    epistemic_posture: deriveEpistemicPostureFromQI2(qi2),
  };
}

// ── Contextual prose generator (3-dim, structured-source) ───────────────
//
// CC-017 simplification: the structured source means confidence is implicit.
// The CC-015c three-state firm/hedge/omit rule collapses — every populated
// dimension renders firm. Unknown dimensions omit. The closing line stays
// canon-protected.

const VALUE_DOMAIN_LABEL: Record<ValueDomain, string> = {
  truth: "Truth",
  freedom: "Freedom",
  loyalty: "Loyalty",
  justice: "Justice",
  faith: "Faith",
  stability: "Stability",
  knowledge: "Knowledge",
  family: "Family",
  unknown: "the value you protect",
};

// CC-112 — Interpretation over recitation. The opener names what the
// value-cluster does to the belief; it does not narrate the act of
// selecting. Forbidden register: "Your selections place this belief
// inside …" — the reader already knows what they ranked; what the report
// adds is the meaning of holding the belief inside that cluster.
function valueOpener(
  belief: BeliefUnderTension,
  valuesPhraseFromCompass: string
): string {
  if (belief.value_domain !== "unknown") {
    return `This belief lives inside ${valuesPhraseFromCompass} — ${VALUE_DOMAIN_LABEL[belief.value_domain]} is the value it puts most directly at risk.`;
  }
  return `This belief lives inside ${valuesPhraseFromCompass}, not outside them.`;
}

function temperatureLine(belief: BeliefUnderTension): string | null {
  switch (belief.conviction_temperature) {
    case "high":
      // CC-025 — positive-read-first softening. The architectural read
      // (impervious + cost-bearing) is unchanged; the emotional register
      // moves from "held against the world" to "load-bearing in your shape."
      return "You named a cost you'd accept and named no source that could revise your mind — the belief reads as load-bearing in your shape, not provisional.";
    case "low":
      return "You named sources that could revise your mind and no cost you'd risk for it — the belief reads as held lightly.";
    case "moderate":
      return "You named both what could revise this belief and what you'd risk for it — held knowingly, with both ends visible.";
    case "unknown":
    default:
      return null;
  }
}

// CC-112 — Interpretation over recitation. State what the openness or
// closure implies; do not narrate which sources were ranked. The
// reader already knows what they marked.
function postureLine(belief: BeliefUnderTension): string | null {
  switch (belief.epistemic_posture) {
    case "open":
      return "The posture is open to revision — multiple sources carry the standing to update this belief if they ever needed to.";
    case "reflective":
      return "The posture is open within a narrower frame — a small number of trusted sources carry the standing to update this belief.";
    case "rigid":
      // CC-025 — positive-read-first softening. Architectural read
      // (no marked revision source) unchanged; emotional register softens
      // from "held without a revision path" to the LaCinda-rewrite frame.
      // CC-112 — opener reframed away from "Your selections show".
      return "The belief is closed to outside revision. That may reflect conviction, faithfulness, and spiritual stability. It may also be worth holding with awareness: when a belief is central enough to carry identity, it deserves not less care, but more humility in how it is expressed.";
    case "guarded":
      return "Revision moves through one channel only — your own counsel. The belief is held privately rather than tested against external voices.";
    case "unknown":
    default:
      return null;
  }
}

// CC-112 — closing line interprets, not recites. The "Your shape places
// this belief…" framing narrated the act of placement; the new framing
// names where the belief sits in the architecture (a load-bearing
// member, not an ornament).
function closingLine(belief: BeliefUnderTension): string {
  // Two protected variants. Picked from the conviction_temperature signal —
  // when temperature is "high" (impervious + cost-bearing), the role-it-plays
  // close fits; otherwise the architecture-position close fits.
  if (belief.conviction_temperature === "high") {
    return "The model does not judge whether this belief is correct. The model only sees the role it plays in your shape — and the role appears to be load-bearing.";
  }
  return "The belief is a load-bearing member of what you protect, not an ornament resting on top of it.";
}

// CC-017 — fallback prose when no anchor was provided (Case C: Q-I1 skipped
// AND Q-I1b also unanswered, the degenerate case the unskippable constraint
// should normally prevent).
export function noAnchorLine(): string {
  return "You did not name a belief in this session. The model leaves space for that — what you'd say here is your own.";
}

// ── CC-022b Item 3 — Keystone Reflection selection citation ─────────────
//
// CC-112 — interpretation over recitation. Q-I2 / Q-I3 selections feed
// the citation prose, but the prose now reads what the pattern reveals
// (open posture / one named exit / closed; load-bearing cost surface /
// single named price / refusal-as-read), not a tally of which sources
// or stakes were marked. The composers below build the meaning; the
// pre-CC-112 stale "Of the N you ranked highest, you marked one (X)"
// recitation has been retired across all branches.
//
// The citation prose is additive: when `answers` is not provided (or the
// selections are unavailable), the existing generic dimension-label prose
// runs unchanged. Backward-compatible for older saved sessions whose
// schema didn't preserve Q-I2/Q-I3 selection details with full fidelity.

// Build a label lookup keyed by `${source_question_id}:${item_id}` for the
// derived items that can appear in Q-I2 / Q-I3. The derived item ids are
// namespaced this way at derivation time (see app/page.tsx
// deriveItemsForMultiSelect).
function buildItemLabelLookup(): Map<string, string> {
  const out = new Map<string, string>();
  for (const q of questions) {
    if (q.type !== "ranking") continue;
    for (const item of q.items) {
      out.set(`${q.question_id}:${item.id}`, item.label);
    }
  }
  return out;
}

const ITEM_LABEL_LOOKUP = buildItemLabelLookup();

export type SelectionSummary = {
  selectedLabels: string[]; // human-readable labels of what user selected
  noneSelected: boolean;
  hasOther: boolean;
  topAvailable: string[]; // the items the user was offered
  otherText?: string;
};

function summarizeMultiSelect(
  answers: Answer[],
  questionId: string
): SelectionSummary | null {
  const a = answers.find((x) => x.question_id === questionId);
  if (!a || a.type !== "multiselect_derived") return null;

  // Resolve every selection (excluding none / other sentinels) to its
  // human-readable label via the namespaced lookup.
  const selectedLabels: string[] = [];
  let hasOther = false;
  for (const sel of a.selections) {
    if (sel.signal === null) {
      // The "other" sentinel has signal === null and id === otherOption.id;
      // none_selected is tracked separately on the answer itself.
      if (sel.id !== "none") hasOther = true;
      continue;
    }
    const label = ITEM_LABEL_LOOKUP.get(sel.id);
    if (label) selectedLabels.push(label);
  }

  // The "items the user was offered" come from the answer's stored
  // `derived_item_sources` shape on RankingDerivedAnswer (saved sessions
  // preserve this on Q-I2/Q-I3 only via the page's persisted answer
  // objects). For multiselect_derived, the offered items aren't stored
  // on the answer — we reconstruct them from the parent rankings.
  const offered: string[] = [];
  // Find Q-I2 / Q-I3's question definition to learn its derived_from.
  const qDef = questions.find((q) => q.question_id === questionId);
  if (qDef && qDef.type === "multiselect_derived") {
    const topN = qDef.derived_top_n_per_source ?? 3;
    for (const parentId of qDef.derived_from) {
      const parentAnswer = answers.find(
        (x) => x.question_id === parentId && x.type === "ranking"
      );
      if (!parentAnswer || parentAnswer.type !== "ranking") continue;
      const take = Math.min(topN, parentAnswer.order.length);
      for (let i = 0; i < take; i++) {
        const itemId = parentAnswer.order[i];
        const label = ITEM_LABEL_LOOKUP.get(`${parentId}:${itemId}`);
        if (label) offered.push(label);
      }
    }
  }

  return {
    selectedLabels,
    noneSelected: a.none_selected,
    hasOther,
    topAvailable: offered,
    otherText: a.other_text,
  };
}

export function summarizeQI2Selections(
  answers: Answer[]
): SelectionSummary | null {
  return summarizeMultiSelect(answers, "Q-I2");
}

export function summarizeQI3Selections(
  answers: Answer[]
): SelectionSummary | null {
  return summarizeMultiSelect(answers, "Q-I3");
}

function isLikelyUsername(name: string | undefined | null): boolean {
  if (!name) return false;
  if (/\d/.test(name)) return true;
  if (/[_\-\.]/.test(name)) return true;
  if (name.length > 20) return true;
  if (name === name.toLowerCase() && name.length > 2) return true;
  return false;
}

// Pull the user's name from demographics (mirrors getUserName in
// identityEngine, including the username-pattern fallback; replicated here
// to keep beliefHeuristics' dependency surface narrow and avoid a circular
// import).
function findName(demographics?: DemographicSet | null): string | null {
  if (!demographics) return null;
  const name = demographics.answers.find((a) => a.field_id === "name");
  if (!name || name.state !== "specified") return null;
  const trimmed = name.value?.trim();
  if (!trimmed || trimmed.length === 0) return null;
  if (isLikelyUsername(trimmed)) return null;
  return trimmed;
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// CC-112 — Interpretation over recitation. The qi2 citation now states
// what the revision-source pattern reveals (closed / one named exit /
// open within a frame / open) rather than reciting "Of the N sources
// you ranked, you marked X". Reflective prose is second-person only;
// the `name` parameter is no longer used (the prior `name ? `${name}
// marked` : "you marked"` ternary leaked third-person voice into a
// reflective passage and was the audience-leakage the CC names).
//
// The CC-025 closed-revision softening is preserved verbatim for the
// closed branches (noneSelected + zero-derived-selections).
function qi2CitationLine(
  summary: SelectionSummary,
  _name: string | null
): string {
  void _name;
  const CLOSED_REVISION_SOFTENING =
    "That may reflect conviction, faithfulness, and spiritual stability. It may also be worth holding with awareness: when a belief is central enough to carry identity, it deserves not less care, but more humility in how it is expressed.";
  if (summary.noneSelected) {
    return (
      `No outside source carries the standing to revise this belief. ` +
      CLOSED_REVISION_SOFTENING
    );
  }
  const n = summary.selectedLabels.length;
  if (n === 0) {
    return (
      `No outside source surfaced as a path that could revise this belief. ` +
      CLOSED_REVISION_SOFTENING
    );
  }
  if (n === 1) {
    return `The belief is mostly closed; one named exit remains — ${summary.selectedLabels[0]} carries the standing to revise it.`;
  }
  if (n === 2) {
    return `Revision is open within a narrow frame: ${summary.selectedLabels[0]} and ${summary.selectedLabels[1]} carry the standing to update this belief — held with care, but not closed.`;
  }
  return `Conviction is held alongside an open posture: multiple sources — ${joinList(summary.selectedLabels)} — carry the standing to revise this belief, so the holding is durable but not sealed.`;
}

// CC-024 — Q-I3 citation prose. Post-CC-024, Q-I3 derives from Q-Stakes1
// (concrete loss domains: Money / Job / Close relationships / Reputation /
// Health), not from Q-S1/Q-S2 (sacred values). The framing shifts from
// "sacred drivers you'd risk losing" to "concrete costs you'd bear" — the
// verb ("would risk losing") now composes cleanly with the answer space
// (concrete losses), so the CC-022b structural-acknowledgment hedge is
// retired. None-selected reads as a clean refusal-to-bear-listed-cost.
// CC-112 — Interpretation over recitation. The qi3 citation now names
// the breadth of the cost surface as the read (load-bearing across the
// named domains) rather than tallying "Of the N stakes you ranked, you
// marked X". The specific costs are woven into the sentence when they
// add meaning, never as a counted tally.
//
// Reflective voice is second-person; the `name` parameter is no longer
// used (the prior `${name} marked / ${name} would bear` ternary leaked
// third-person into the reflective passage). The CC-025-style softening
// is preserved for the refusal branch.
function qi3CitationLine(
  summary: SelectionSummary,
  _name: string | null
): string {
  void _name;

  if (summary.noneSelected) {
    return (
      `You named no concrete cost you would willingly trade for this belief. ` +
      `The refusal is itself the read — the belief sits inside what your answers protect, not inside what they would let go.`
    );
  }
  const n = summary.selectedLabels.length;
  if (n === 0) {
    return `No concrete cost surfaced as something this belief would justify paying — the belief lives at a register your answers do not yet test against loss.`;
  }
  if (n === 1) {
    return `${summary.selectedLabels[0]} reads as the one stake this belief would justify paying — a single named price, narrow but real.`;
  }
  if (n === 2) {
    return `${summary.selectedLabels[0]} and ${summary.selectedLabels[1]} are stakes this belief would justify paying — costs you appear willing to absorb when the belief is on the line.`;
  }
  // 3+ costs → wide cost surface. The breadth IS the meaning.
  return `This is a belief you would pay for across ${joinList(summary.selectedLabels)} — load-bearing, not ornamental. A belief one would shoulder cost for across that many domains sits at the center of what's protected, not at its edge.`;
}

export function generateBeliefContextProse(
  belief: BeliefUnderTension,
  valuesPhraseFromCompass: string,
  answers?: Answer[],
  demographics?: DemographicSet | null
): string {
  const lines: string[] = [];
  lines.push(valueOpener(belief, valuesPhraseFromCompass));
  const temp = temperatureLine(belief);
  if (temp) lines.push(temp);

  // CC-022b — when answers are provided, replace the generic posture line
  // with the user's actual Q-I2 / Q-I3 selection citations. When answers
  // are absent (older sessions, callers without context), fall back to
  // the generic posture line.
  const name = findName(demographics);
  const qi2 = answers ? summarizeQI2Selections(answers) : null;
  const qi3 = answers ? summarizeQI3Selections(answers) : null;

  if (qi2 || qi3) {
    if (qi2) lines.push(qi2CitationLine(qi2, name));
    if (qi3) lines.push(qi3CitationLine(qi3, name));
  } else {
    const post = postureLine(belief);
    if (post) lines.push(post);
  }

  lines.push(closingLine(belief));
  return lines.join(" ");
}
