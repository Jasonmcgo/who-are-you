// CC-129 Part A — Resolve a session's follow-up answers into a
// rendered "From Grip to Aim" narrative block.
//
// Detection rule: follow-up answers carry `question_id` strings that
// start with "fq" (the CC-125 generator + CC-126b hand-authored set
// both emit ids like `fq1_grip_object`, `fq2_release_condition`,
// `fq2_compression_check`, `fq2_trait_vs_weather`, `fq3_aim_replacement`).
// Standard bank questions are `Q-*`.
//
// Resolution: re-run `resolveFollowUps` against the session's current
// state (matching the inputs CC-126's POST handler used at write
// time), then match each stored `picked_id` (SinglePick) or
// `derived_item_sources[].id` (RankingDerived) back to its option by
// `label` (the POST handler uses the option's label as the picked_id).
//
// Output: a structured `FollowUpNarrative` carrying the resolved
// pick(s) per purpose, or null when no follow-up answers exist.
// `renderFollowUpNarrativeMarkdown` emits the user-visible block; the
// Lens compression note is composed by its own helper because it
// slots into a different render site.
//
// Numeric trajectory is NOT touched. This module is read-side only:
// the engine has already consumed the inline signals from
// `picked_signal` / `derived_item_sources[].signal` via the standard
// `deriveSignals` path; CC-129 only surfaces the words.

import type {
  Answer,
  DemographicSet,
  InnerConstitution,
  RankingDerivedAnswer,
  SinglePickAnswer,
} from "./types";
import {
  resolveFollowUps,
} from "./followUpResolver";
import type {
  FollowUpOption,
  FollowUpPurpose,
  FollowUpQuestion,
} from "./followUpQuestions";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export interface FollowUpPick {
  /** The option label as authored (CC-126 POST handler uses this as picked_id). */
  label: string;
  /** Full first-person text for the option, ready to render verbatim. */
  text: string;
  /** One-line meta annotation explaining the pick. */
  interpretation: string;
  /** Tag list from the option (tags[0] is the write-back signal). */
  tags: string[];
  /** Rank position for rank_top_N picks (1-indexed); undefined for choose_one. */
  rank?: number;
}

export interface FollowUpNarrative {
  /** Top pick for `grip_object` — "what your grip is protecting". */
  gripObject?: FollowUpPick;
  /** Top pick for `release_condition` — "what would make release safe". */
  releaseCondition?: FollowUpPick;
  /** Top pick for `aim_replacement` — "your next move". */
  aimReplacement?: FollowUpPick;
  /** Up to two picks for `compression_check` (rank_top_2). */
  compressionCheck?: FollowUpPick[];
  /** Single pick for `trait_vs_weather` (choose_one). */
  traitVsWeather?: FollowUpPick;
}

// ─────────────────────────────────────────────────────────────────────
// Detection
// ─────────────────────────────────────────────────────────────────────

/**
 * Filter the session's answers down to those produced by the follow-up
 * flow. Detection is by `question_id` shape: follow-up answers use
 * `fq*` ids; bank answers use `Q-*` ids. Returns the answers in the
 * order they appear in the session.
 */
export function detectFollowUpAnswers(
  answers: Answer[]
): Array<SinglePickAnswer | RankingDerivedAnswer> {
  const out: Array<SinglePickAnswer | RankingDerivedAnswer> = [];
  for (const a of answers) {
    if (!a.question_id.startsWith("fq")) continue;
    if (a.type === "single_pick" || a.type === "ranking_derived") {
      out.push(a);
    }
    // (Any other shape under an `fq*` id is silently skipped; the
    // POST handler only writes single_pick / ranking_derived.)
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Resolution
// ─────────────────────────────────────────────────────────────────────

/**
 * Re-resolve the session's `FollowUpQuestionSet` and match each stored
 * pick back to its source option. Returns a structured narrative or
 * `null` when no follow-up answers exist on the session.
 *
 * The `personName` argument is the sessionKey used by `resolveFollowUps`
 * (canonical lowercase first name; see `data/cohortFollowUps.ts`). For
 * the CC-126b worked entries (Michele etc.) this finds the hand-
 * authored set; otherwise it falls through to the CC-125 generator.
 * Because the generator is deterministic on `(constitution, answers)`,
 * passing the same inputs at write-time and read-time yields the same
 * question set — which is what makes the pick-to-text match safe.
 */
export function resolveFollowUpNarrative(
  constitution: InnerConstitution,
  answers: Answer[],
  // demographics is accepted for parity with the POST handler call
  // site; the resolver doesn't read it but threading it preserves
  // future-compat for resolvers that might.
  demographics?: DemographicSet | null,
  personName: string = "You",
  sessionKey: string | null = null
): FollowUpNarrative | null {
  void demographics;
  const followUpAnswers = detectFollowUpAnswers(answers);
  if (followUpAnswers.length === 0) return null;

  // Re-resolve with the SAME inputs CC-126's POST handler used (it
  // also called `resolveFollowUps(personName, constitution, answers,
  // personName)`). Deterministic resolution → matched options.
  const set = resolveFollowUps(
    sessionKey ?? (personName === "You" ? null : personName.toLowerCase()),
    constitution,
    answers,
    personName
  );

  const narrative: FollowUpNarrative = {};

  for (const ans of followUpAnswers) {
    const question = set.questions.find((q) => q.id === ans.question_id);
    if (!question) continue;
    const picks = extractPicks(ans, question);
    if (picks.length === 0) continue;
    bind(narrative, question.purpose, picks);
  }

  // If the resolver matched nothing (all answers' question_ids missed
  // — possible if the resolver returned a different set than at write
  // time; e.g. the cohort override was added after write), surface
  // null so the render path silently omits the block rather than
  // emitting a half-populated one.
  const hasAny =
    narrative.gripObject ||
    narrative.releaseCondition ||
    narrative.aimReplacement ||
    narrative.compressionCheck ||
    narrative.traitVsWeather;
  return hasAny ? narrative : null;
}

function extractPicks(
  answer: SinglePickAnswer | RankingDerivedAnswer,
  question: FollowUpQuestion
): FollowUpPick[] {
  if (answer.type === "single_pick") {
    const opt = question.options.find((o) => o.label === answer.picked_id);
    if (!opt) return [];
    return [optionToPick(opt)];
  }
  // ranking_derived
  const picks: FollowUpPick[] = [];
  answer.order.forEach((id, idx) => {
    const opt = question.options.find((o) => o.label === id);
    if (!opt) return;
    picks.push({ ...optionToPick(opt), rank: idx + 1 });
  });
  return picks;
}

function optionToPick(opt: FollowUpOption): FollowUpPick {
  return {
    label: opt.label,
    text: opt.text,
    interpretation: opt.interpretation,
    tags: opt.tags,
  };
}

function bind(
  narrative: FollowUpNarrative,
  purpose: FollowUpPurpose,
  picks: FollowUpPick[]
): void {
  if (picks.length === 0) return;
  switch (purpose) {
    case "grip_object":
      // For rank_top_N, the top pick is the salient one — render that.
      narrative.gripObject = picks[0];
      return;
    case "release_condition":
      narrative.releaseCondition = picks[0];
      return;
    case "aim_replacement":
      narrative.aimReplacement = picks[0];
      return;
    case "compression_check":
      narrative.compressionCheck = picks.slice(0, 2);
      return;
    case "trait_vs_weather":
      narrative.traitVsWeather = picks[0];
      return;
    case "type_clarity":
      // Not yet rendered as part of the Grip→Aim block; reserved.
      return;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Render — "From Grip to Aim" block (slots after the Grip section)
// ─────────────────────────────────────────────────────────────────────

/**
 * Build the markdown lines for the "From Grip to Aim" block. Returns
 * an empty array when the narrative carries none of the three core
 * picks (grip_object / release_condition / aim_replacement). The
 * caller `out.push(...lines)` into the report at the chosen slot.
 *
 * Compression_check and trait_vs_weather are intentionally NOT
 * rendered in this block — compression_check feeds the Lens note via
 * `renderLensCompressionNoteSentence`, and trait_vs_weather is a
 * diagnostic about onset (Guide-side context rather than user-facing
 * Grip→Aim guidance).
 */
export function renderFollowUpNarrativeMarkdown(
  narrative: FollowUpNarrative,
  renderMode: "user" | "clinician" = "user"
): string[] {
  const hasCore =
    narrative.gripObject ||
    narrative.releaseCondition ||
    narrative.aimReplacement;
  if (!hasCore) return [];

  const out: string[] = [];
  out.push("");
  out.push("### From Grip to Aim");
  out.push("");
  out.push(
    "*Your follow-up answers, folded back into the read. The grip names what's worth protecting; the aim names how to keep protecting it without it costing you.*"
  );
  if (narrative.gripObject) {
    out.push("");
    out.push(
      `**What your grip is protecting:** ${narrative.gripObject.text}`
    );
  }
  if (narrative.releaseCondition) {
    out.push("");
    out.push(
      `**What would make release feel safe:** ${narrative.releaseCondition.text}`
    );
  }
  if (narrative.aimReplacement) {
    out.push("");
    out.push(
      `**Your next move:** ${narrative.aimReplacement.text}`
    );
  }
  // Trait_vs_weather is a Guide-only diagnostic — surface it as
  // scaffolding context when clinician mode is on, not in the user-
  // facing Grip→Aim block.
  if (renderMode === "clinician" && narrative.traitVsWeather) {
    out.push("");
    out.push(
      `*When this became normal (your read):* ${narrative.traitVsWeather.text}`
    );
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Compression-check Lens note (slots into the Lens hedge prose)
// ─────────────────────────────────────────────────────────────────────

/**
 * Compose a one-sentence appendix to the Lens low-confidence hedge
 * prose when the session carries a `compression_check` follow-up pick.
 * Renders as italic text continuing the existing hedge note. The Lens
 * read is NEVER changed by this — it's a state-vs-shape clarifier per
 * `docs/canon/state-compression-model.md`.
 *
 * Returns `null` when no compression_check pick is present.
 */
export function renderLensCompressionNoteSentence(
  narrative: FollowUpNarrative | null
): string | null {
  if (!narrative || !narrative.compressionCheck) return null;
  if (narrative.compressionCheck.length === 0) return null;
  const top = narrative.compressionCheck[0];
  if (!top) return null;
  // The option's `text` is a first-person sentence (e.g., "My voice
  // and pace tighten — i speak faster and shorter."). Lower-case the
  // first character so it slots cleanly after our continuation
  // phrase.
  const continuation = top.text.replace(/^./, (c) => c.toLowerCase());
  return `*Under stakes, you said the first thing that shifts is: ${continuation} That's a state-shift, not a shape-shift — the read above stays the read; the pressure is changing which register is visible right now.*`;
}
