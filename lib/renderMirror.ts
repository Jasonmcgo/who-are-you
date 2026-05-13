// CC-020 — Markdown rendering of the Inner Constitution result for the
// "Share this reading" surface. Pure function: given the InnerConstitution
// (already produced by buildInnerConstitution), an optional DemographicSet,
// and the includeBeliefAnchor toggle, returns a structured Markdown string.
// No side effects, no DOM access — safe to test in isolation and to call
// from any React component.

import {
  USE_CASES,
  USE_CASES_SECTION_SUBHEAD,
  USE_CASES_SECTION_TITLE,
} from "../app/components/UseCasesSection";
import { generateBeliefContextProse } from "./beliefHeuristics";
import {
  detectCrossCardPatterns,
  composeClosingReadProse,
  composeExecutiveRead,
  getSimpleSummaryParts,
  getFunctionPairRegister,
  getUserName,
  getTopCompassValues,
  getTopGravityAttribution,
  SHAPE_CARD_PATTERN_NOTE,
  SHAPE_CARD_PRACTICE_TEXT,
  valueListPhrase,
  COMPASS_LABEL,
  type ShapeCardId,
} from "./identityEngine";
import {
  SHAPE_CARD_QUESTION,
  getPathGaitPatternKickers,
} from "./cardAssets";
import { generateTrajectoryChartSvgFromConstitution } from "./trajectoryChart";
import { GIFT_LABELS_BY_ARCHETYPE } from "./profileArchetype";
import {
  proseRewriteHash,
  readCachedRewrite,
  type ProseCardId,
  type ProseRewriteInputs,
} from "./proseRewriteLlm";
import {
  readCachedKeystoneRewrite,
  type KeystoneRewriteInputs,
} from "./keystoneRewriteLlm";
import { composeKeystoneFallback } from "./keystoneFallback";
import {
  summarizeQI2Selections,
  summarizeQI3Selections,
} from "./beliefHeuristics";
import { renderDriveDistributionDonut } from "./driveDistributionChart";
import { renderCoreSignalMapMarkdown } from "./coreSignalMap";
import { composeReportCallouts } from "./composeReportCallouts";
import { firstSentence } from "./topGiftsEdgesTable";
import {
  composeCompassMovementNote,
  composeConvictionMovementNote,
  composeFireMovementNote,
  composeGravityMovementNote,
  composeLensMovementNote,
  composePathMasterSynthesis,
  composeTrustCorrectionChannel,
  composeWeatherStateVsShape,
} from "./synthesis1Finish";
import {
  composeOceanProse,
  renderOceanDashboardSVG,
} from "./oceanDashboard";
import {
  CRISIS_BODY_CARD_HEDGE,
  CRISIS_MOVEMENT_HEDGE,
  CRISIS_STANDING_REMINDER,
  crisisFallbackParagraph,
} from "./crisisProseTemplates";
import type {
  Answer,
  ConvictionTemperature,
  DemographicSet,
  EpistemicPosture,
  InnerConstitution,
  ValueDomain,
} from "./types";

// ── Belief-tag label maps (mirror KeystoneReflection.tsx's tag dictionaries
// so the export reads the same as what the user sees on screen). Kept local
// to renderMirror so the markdown layer doesn't depend on a UI module.

const VALUE_LABEL: Record<ValueDomain, string> = {
  truth: "Truth",
  freedom: "Freedom",
  loyalty: "Loyalty",
  justice: "Justice",
  faith: "Faith",
  stability: "Stability",
  knowledge: "Knowledge",
  family: "Family",
  unknown: "Unsure",
};

const TEMPERATURE_LABEL: Record<ConvictionTemperature, string> = {
  high: "Deeply held",
  moderate: "Considered, not emphatic",
  low: "Provisional, held lightly",
  unknown: "Unsure",
};

const POSTURE_LABEL: Record<EpistemicPosture, string> = {
  open: "Open to revision with evidence",
  rigid: "Held as identity, not hypothesis",
  reflective: "Actively wrestling with it",
  guarded: "Held privately rather than openly",
  unknown: "Unsure",
};

// CC-GRIP-TAXONOMY — generic-cost language for the engine fallback
// prose. Mirrors the gift-pattern table from the system prompt; used
// only when LLM cache + API both unavailable.
const PRIMAL_FALLBACK_COST: Record<string, string> = {
  "Am I safe?":
    "avoidance, control, retreat, or overprotection",
  "Am I secure?":
    "hoarding, over-planning, or scarcity logic",
  "Am I loved?":
    "emotional dependency, testing, overgiving, or withdrawal",
  "Am I wanted?":
    "approval-seeking, self-editing, or room compliance",
  "Am I successful?":
    "achievement addiction, comparison, or hollow productivity",
  "Am I good enough?":
    "shame, perfectionism, hiding, or overproving",
  "Do I have purpose?":
    "urgency, savior-complex, abstraction, or restless reinvention",
};

// CC-GRIP-TAXONOMY-REPLACEMENT — render-time Foster-vocabulary scrubber.
// Cached LLM paragraphs sometimes still contain the legacy "Am I X?"
// recognition phrases verbatim even after the system prompt's Foster
// ban. This scrub substitutes any occurrence with the engine-attached
// proprietary underlyingQuestion (or, when unavailable, a generic
// recognition placeholder). Internal code paths still use the Foster
// keys; only user-facing markdown gets scrubbed.
const FOSTER_PHRASES = [
  "Am I safe?",
  "Am I secure?",
  "Am I wanted?",
  "Am I loved?",
  "Am I successful?",
  "Am I good enough?",
  "Do I have purpose?",
  "Primal Question",
];

function scrubFosterVocab(
  prose: string,
  underlyingQuestion: string | undefined
): string {
  let out = prose;
  const replacement = underlyingQuestion ?? "this same question";
  for (const phrase of FOSTER_PHRASES) {
    out = out.split(phrase).join(replacement);
  }
  return out;
}

function emitGripSection(out: string[], constitution: InnerConstitution): void {
  const grip = constitution.gripTaxonomy;
  if (!grip || !grip.primary) return;
  // CC-GRIP-CALIBRATION — `proseMode` is the renderer's gate. "omitted"
  // includes both low-confidence + zero-grip cases.
  if (grip.proseMode === "omitted") return;

  // CC-GRIP-TAXONOMY-REPLACEMENT — the user-facing Grip section emits
  // the proprietary Grip Pattern reading. The engine-internal Primal
  // register (`grip.primary` = "Am I X?") never reaches the rendered
  // markdown; it remains as a classifier input + a stable cache hash
  // proxy only.
  const pattern = constitution.gripPattern;
  const patternLabel = pattern?.renderedLabel ?? "Grip Pattern";
  const underlyingQuestion =
    pattern?.underlyingQuestion ??
    "What is this pressure asking of me that I have not yet named?";

  out.push("");
  out.push("## Your Grip");
  out.push("");

  const llmParagraph = constitution.gripParagraphLlm;
  if (llmParagraph) {
    // The LLM paragraph carries the three-concept structure (rendered)
    // or the hedged paragraph (hedged). Render as a blockquote so it
    // visually echoes the Executive Read + Layer 5C callout treatment.
    // CC-GRIP-TAXONOMY-REPLACEMENT — scrub any residual Foster vocab.
    const scrubbed = scrubFosterVocab(llmParagraph, underlyingQuestion);
    out.push(`> *${scrubbed}*`);
  } else if (grip.proseMode === "hedged") {
    // Engine fallback for hedged mode — short, qualified, no claim.
    const cost =
      PRIMAL_FALLBACK_COST[grip.primary] ??
      "the grip pattern that follows the question";
    out.push(
      `The pressure register reads quietly here. The surface clue is ${grip.surfaceGrip.toLowerCase()}; the underlying recognition may be "${underlyingQuestion}" — but the signal is thin enough that the question is worth noticing rather than governing. Under pressure this can pull toward ${cost}; for now, sit with whether the question has been doing more work than you realized.`
    );
  } else {
    // Engine fallback for rendered mode — emit the four-line three-
    // concept block from the engine's canonical templates.
    const distorted =
      grip.distortedStrategy?.text ??
      `Under pressure, this question can pull you toward ${PRIMAL_FALLBACK_COST[grip.primary] ?? "the patterns that follow the question"}.`;
    const healthy = formatHealthyGiftFallback(grip.primary, grip.healthyGift);
    out.push(`Surface Grip: ${grip.surfaceGrip}.`);
    out.push("");
    out.push(`Grip Pattern: ${patternLabel}.`);
    out.push("");
    out.push(`Underlying Question: ${underlyingQuestion}`);
    out.push("");
    out.push(`Distorted Strategy: ${distorted}`);
    out.push("");
    out.push(`Healthy Gift: ${healthy}`);
  }

  out.push("");
  out.push(`**Grip Pattern:** ${patternLabel}`);
  out.push("");
  out.push(`**Underlying Question:** ${underlyingQuestion}`);
  if (grip.contributingGrips.length > 0) {
    out.push("");
    out.push(
      `**Named grips contributing to this read:** ${grip.contributingGrips.join(", ")}`
    );
  }
  if (grip.subRegister) {
    out.push("");
    out.push(`**Sub-register:** ${grip.subRegister}`);
  }
  out.push("");
  out.push(`**Confidence:** ${pattern?.confidence ?? grip.confidence}`);
}

function formatHealthyGiftFallback(
  primary: string,
  healthyGift: string
): string {
  // The engine fallback can't compose the LLM's polished sentence; it
  // emits a workable second-person line keyed to the gift register so
  // the four-line block remains coherent even when the API path is
  // unavailable.
  switch (primary) {
    case "Am I safe?":
      return "You read what could harm what you protect before others have noticed the risk.";
    case "Am I secure?":
      return "You keep things from falling apart that others would let slip.";
    case "Am I loved?":
      return "You hold what others entrust to you with steady, attentive care.";
    case "Am I wanted?":
      return "You read what the room needs and respond before others have noticed it shifting.";
    case "Am I successful?":
      return "You finish what you start at a standard others can rely on.";
    case "Am I good enough?":
      return "You turn unfinished thinking into form that earns its keep.";
    case "Do I have purpose?":
      return "You make the work mean something past the work itself.";
    default:
      return `You carry the gift of ${healthyGift}.`;
  }
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDateTime(d: Date): string {
  return `${formatDateOnly(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatLoveFlavorLine(
  flavors: NonNullable<InnerConstitution["loveMap"]>["flavors"]
): string {
  if (flavors.length === 0) return "";
  if (flavors.length === 1) {
    return `Expressed primarily through ${flavors[0].flavor.flavor_label}.`;
  }
  if (flavors.length === 2) {
    return `Expressed primarily through ${flavors[0].flavor.flavor_label} and ${flavors[1].flavor.flavor_label}.`;
  }
  return `Expressed primarily through ${flavors[0].flavor.flavor_label} and ${flavors[1].flavor.flavor_label}, with notes of ${flavors[2].flavor.flavor_label}.`;
}

// ── Filename builder ─────────────────────────────────────────────────────

export function buildFilename(
  demographics?: DemographicSet | null,
  sessionDate?: Date | null
): string {
  const date = formatDateOnly(sessionDate ?? new Date());
  const name = getUserName(demographics);
  if (!name) return `inner-constitution-${date}.md`;
  const slug = slugifyName(name);
  if (!slug) return `inner-constitution-${date}.md`;
  return `inner-constitution-${slug}-${date}.md`;
}

// ── Markdown renderer ────────────────────────────────────────────────────

export type RenderArgs = {
  constitution: InnerConstitution;
  demographics?: DemographicSet | null;
  // CC-022c — when present, threads the user's actual Q-I2 / Q-I3
  // selections into the Keystone Reflection's contextual prose
  // (matching the on-screen render). Optional for backward-compat: when
  // missing, the Keystone citation falls back to the CC-017 generic
  // dimension-label prose.
  answers?: Answer[];
  includeBeliefAnchor: boolean;
  // Optional override for the footer timestamp; defaults to "now". Tests
  // pass a fixed Date to keep snapshots stable.
  generatedAt?: Date;
  // CC-TWO-TIER-RENDER-SURFACE-CLEANUP — render-tier switch. "user"
  // (default) applies the user-facing mask: borrowed-system labels +
  // engine-internal phrases relocated. "clinician" preserves byte-
  // identical legacy output (for audit comparison + debug access).
  renderMode?: "user" | "clinician";
};

// ─────────────────────────────────────────────────────────────────────
// CC-TWO-TIER-RENDER-SURFACE-CLEANUP — user-mode mask.
// ─────────────────────────────────────────────────────────────────────
//
// Suppression list per canon. Applied as a post-process to the
// markdown string. Lines that contain protected metric labels
// (Quadrant / Risk Form / Movement / Aim / Grip / Goal / Soul) OR
// the masthead disclaimer ("Possible surface label:") OR SVG body
// content pass through verbatim; the rest get substitutions.

const TRAIT_RENAME: Array<[RegExp, string]> = [
  [/\bEmotional Reactivity\b/g, "How you process pressure"],
  [/\bNeuroticism\b/g, "How you process pressure"],
  [/\bOpenness\b/g, "How you take in new things"],
  [/\bConscientiousness\b/g, "How you organize your effort"],
  [/\bExtraversion\b/g, "How you orient toward people"],
  [/\bAgreeableness\b/g, "How you weigh others alongside yourself"],
];

// CC-SUBSTITUTION-LEAK-CLEANUP — context-aware phrase substitutions for
// specific known leak sites where STRIP_PATTERNS / TRAIT_RENAME would
// leave ungrammatical fragments. Each entry rewrites the whole phrase
// before the bare-term passes run, so the downstream strip is a no-op.
// Add new entries only for diagnosed leak sites; this is not a general
// substitution mechanism.
const CONTEXT_SUBSTITUTIONS: Array<[RegExp, string]> = [
  // Leak 2 — Work Map: "Your composite read points toward X" → bare strip
  // leaves "Your points toward X". Substitute the whole opener.
  [
    /\bYour composite read points toward\b/g,
    "Your answers point toward",
  ],
  // Leak 4 — Disposition Openness mid-paragraph: "Architectural Openness
  // paired with the giving shape" → TRAIT_RENAME leaves "Architectural How
  // you take in new things paired with…". Replace the adjective-position
  // construction with a noun-form ("curiosity") that survives renaming.
  [
    /\bArchitectural Openness paired with\b/g,
    "Architectural curiosity paired with",
  ],
  // Leak 5 — Disposition Conscientiousness paragraph: "The disposition
  // channel for your output reinforces the Work-line we read elsewhere"
  // → strips of "disposition channel" + "reinforces the Work-line" leave
  // "The for your output we read elsewhere". Substitute the whole sentence
  // opener.
  [
    /\bThe disposition channel for your output reinforces the Work-line we read elsewhere\b/g,
    "Your output channel echoes the Work-line we read elsewhere",
  ],
  // Leak 6 — Appendix Faith bullet (UseCasesSection): "the Faith Shape and
  // Faith Texture composing in your read tell you" → dual-strip leaves "the
  // and composing in your read tell you". Substitute with the function the
  // original named, without using suppressed terms.
  [
    /\bthe Faith Shape and Faith Texture composing in your read tell you\b/g,
    "the way you hold belief under pressure tells you",
  ],
  // CC-SMALL-FIXES-BUNDLE Fix 5 — Disposition per-trait stutter. The
  // engine template emits `*how you X* — Big Five {Trait} — registering as Y`.
  // The user-mode mask strips "Big Five" then renames {Trait} → "How you X"
  // (same narrative, capitalized), producing the doubled "*how you X* — How
  // you X —" pattern. Collapse the redundant " — Big Five {Trait}" segment
  // BEFORE the bare strip/rename so a single italic narrative survives. The
  // five trait names below match BIG_FIVE_LABEL in lib/oceanDashboard.ts.
  [
    /(\*how you [^*]+\*) — Big Five (Openness|Conscientiousness|Extraversion|Agreeableness|Neuroticism|Emotional Reactivity)\b/g,
    "$1",
  ],
  // CC-SMALL-FIXES-BUNDLE Fix 3 — Closing Read canon-echo strip. The
  // engine `composeClosingReadProse` emits each archetype's canonical
  // closing line as a sentence inside the Closing Read paragraph,
  // duplicating the canon that already lives in the final pull quote
  // (callouts.finalLine via ARCHETYPE_CANONICAL_LINE) or in the Hands
  // closing italic line. Anchor each substitution to the unique
  // Closing Read preamble "work taking the form of love, love taking
  // the form of work." so the strip only fires inside Closing Read.
  // Architect: keep the trailing "Keep this shape honest" sentence.
  [
    /work taking the form of love, love taking the form of work\. The work is to translate conviction into visible, revisable, present-tense structure\. Keep this shape honest as the seasons turn\./g,
    "work taking the form of love, love taking the form of work. Keep this shape honest as the seasons turn.",
  ],
  // Caregiver: drop the trailing canon entirely.
  [
    /work taking the form of love, love taking the form of work\. The work is not to care less\. It is to let love become sustainable enough to last\./g,
    "work taking the form of love, love taking the form of work.",
  ],
  // Steward: drop the trailing canon entirely.
  [
    /work taking the form of love, love taking the form of work\. The work is not to abandon what has endured\. It is to let what has endured remain alive enough to update\./g,
    "work taking the form of love, love taking the form of work.",
  ],
];

const STRIP_PATTERNS: RegExp[] = [
  /\bBig Five\b/g,
  /\bOCEAN\b/g,
  // 4-letter MBTI codes (any of the 16). Word-bounded.
  /\b(INTJ|INTP|INFJ|INFP|ISTJ|ISTP|ISFJ|ISFP|ENTJ|ENTP|ENFJ|ENFP|ESTJ|ESTP|ESFJ|ESFP)\b/g,
  /\bcomposite read\b/g,
  /\bdisposition channel\b/g,
  /\bsignal cluster\b/g,
  /\bderived from\b/g,
  /\bthe model detects\b/g,
  /\breinforces the Work-line\b/g,
  /\bFaith Shape\b/g,
  /\bFaith Texture\b/g,
  /\bPrimal Question\b/g,
];

// Raw Jungian function names as standalone capitalized words. We strip
// them only when they appear as labels in prose (word-bounded).
const JUNGIAN_FN = /\b(Ni|Te|Fe|Si|Ne|Se|Ti|Fi)\b/g;

// Verdict phrases that should appear only in chart SVG and the
// dedicated Movement/Quadrant/Risk Form metric labels — never in prose
// echoes elsewhere.
const VERDICT_PHRASES: RegExp = new RegExp(
  "\\b(Goal-led Presence|Soul-led Presence|Strained Integration|Driven Output|Burdened Care|Pressed Output|Anxious Caring|Giving / Presence|Ungoverned Movement|White-Knuckled Aim|Open-Handed Aim|Grip-Governed|Lightly Governed Movement)\\b",
  "g"
);

function isProtectedLine(line: string): boolean {
  // Possible surface label disclaimer — masthead's allowed-MBTI line.
  if (line.includes("Possible surface label")) return true;
  // SVG content (chart) — leave unchanged.
  if (line.includes("<svg") || line.includes("</svg>")) return true;
  // SVG body lines (text/line elements / attribute-rich).
  if (/^\s*<(text|line|circle|polygon|g|path|rect)\b/.test(line)) return true;
  // Movement / Quadrant / Risk Form / Aim / Grip metric bullet lines.
  if (
    /^- \*\*(Quadrant|Risk Form|Movement|Aim|Grip|Goal|Soul|Direction|Grip Pattern)\b/.test(
      line.trim()
    )
  ) {
    return true;
  }
  // Risk Form prose paragraph — the italic line immediately after the
  // Risk Form metric bullet. The prose names the verdict letter as its
  // subject; stripping the letter would shred the prose. Per the CC's
  // "keep in the dedicated Risk Form line" rule, this prose is part of
  // that dedicated context.
  if (/^\*Your Risk Form reads as /.test(line.trim())) return true;
  return false;
}

function applyUserModeMask(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (isProtectedLine(line)) {
      out.push(line);
      continue;
    }
    let s = line;
    // CC-SUBSTITUTION-LEAK-CLEANUP — context-aware phrase rewrites run
    // BEFORE the bare strips, so the strip's pattern is no longer present
    // in the line by the time it runs. Targeted per known leak site.
    for (const [re, rep] of CONTEXT_SUBSTITUTIONS) s = s.replace(re, rep);
    // Strict suppressions: drop borrowed-system labels + engine internals.
    for (const re of STRIP_PATTERNS) s = s.replace(re, "");
    // Verdict prose echoes — strip from non-metric prose.
    s = s.replace(VERDICT_PHRASES, "");
    // Raw Jungian function names as standalone words — strip from prose.
    s = s.replace(JUNGIAN_FN, "");
    // Trait renames — substitute Big-Five trait names with plain-language.
    for (const [re, rep] of TRAIT_RENAME) s = s.replace(re, rep);
    // Disposition Signal Mix section header → plain-language banner.
    s = s.replace(
      /^## Disposition Signal Mix\b.*/,
      "## How Your Disposition Reads"
    );
    // Collapse double-spaces + orphaned punctuation that may result.
    s = s.replace(/ +([,.;:])/g, "$1").replace(/  +/g, " ");
    // Trim trailing whitespace introduced by mid-line removals.
    s = s.replace(/[ \t]+$/g, "");
    out.push(s);
  }
  return out.join("\n");
}

// CC-DISPOSITION-COLLAPSE-DEFAULT — plain-language summary-line generator
// for the user-mode disposition disclosure. Names the 1-2 strongest
// signals using the same user-mode trait labels as TRAIT_RENAME above
// ("how you take in new things", etc.), or a "steady across all five"
// fallback when no trait clears the moderate-high band. NEVER emits
// "register", "channel", "Work-line", "OCEAN", "Big Five", or any
// borrowed-system label.
export function composeDispositionSummaryLine(
  mix: import("./types").DispositionSignalMix
): string {
  const labels: Record<keyof import("./types").OceanIntensities, string> = {
    openness: "how you take in new things",
    conscientiousness: "how you organize your effort",
    extraversion: "how you orient toward people",
    agreeableness: "how you weigh others alongside yourself",
    emotionalReactivity: "how you process pressure",
  };
  const traits = (
    Object.keys(labels) as Array<keyof typeof labels>
  )
    .map((k) => ({
      key: k,
      intensity: mix.intensities[k],
      label: labels[k],
    }))
    .sort((a, b) => b.intensity - a.intensity);
  const STRONG_THRESHOLD = 60; // moderate-high (60-79) or high (80-100)
  const [top1, top2] = traits;
  if (top1.intensity >= STRONG_THRESHOLD && top2.intensity >= STRONG_THRESHOLD) {
    return `Your strongest signals are in ${top1.label} and ${top2.label} — full panel below.`;
  }
  if (top1.intensity >= STRONG_THRESHOLD) {
    return `Your strongest signal is in ${top1.label} — full panel below.`;
  }
  return `Your disposition reads as steady and balanced across the five dimensions the instrument measures — full panel below.`;
}

export function renderMirrorAsMarkdown(args: RenderArgs): string {
  const { constitution, demographics, includeBeliefAnchor } = args;
  const generatedAt = args.generatedAt ?? new Date();
  const out: string[] = [];
  // CC-PROSE-1B Layer 5 — three callouts at three depths. Computed once
  // so 5A (after Top Gifts/Edges table), 5B (inside Synthesis section),
  // and 5C (end-of-report) all source from the same composer output.
  const callouts = composeReportCallouts(constitution);

  // CC-022c — compute cross-card patterns once, group by applicable card
  // so each card section can append its pattern observation paragraphs.
  // Detection is signal-driven (works on any saved session, including
  // pre-CC-022b rows); the prose may interpolate the user's name when
  // demographics are present.
  const topCompassRefs = getTopCompassValues(constitution.signals);
  const topGravityRefs = getTopGravityAttribution(constitution.signals);
  const detectedPatterns = detectCrossCardPatterns(
    constitution.signals,
    topCompassRefs,
    topGravityRefs,
    constitution.lens_stack,
    constitution.meta_signals,
    demographics,
    // CC-PATTERN-CATALOG-SI-SE-FI — OCEAN bands are required by the
    // Si/Se/Fi/Fe-1 second-route predicates; pre-existing patterns ignore
    // this argument.
    constitution.ocean?.dispositionSignalMix.bands
  );
  const patternsByCard = new Map<ShapeCardId, string[]>();
  for (const { pattern, prose } of detectedPatterns) {
    const list = patternsByCard.get(pattern.applicable_card) ?? [];
    list.push(prose);
    patternsByCard.set(pattern.applicable_card, list);
  }
  // CC-PROSE-1A Fix 4 — CC-029 cross-card pattern blocks render as "Pattern
  // in motion" so they are visually + verbally distinct from the per-card
  // CC-022 "Pattern Note" aphorism (which is the card-closer). The two
  // labels addressed different surfaces but read identically before this
  // rename, blurring whether a paragraph was an aphorism or a detected
  // cross-card pattern.
  function emitPatternBlock(cardId: ShapeCardId): void {
    const proses = patternsByCard.get(cardId);
    if (!proses || proses.length === 0) return;
    for (const prose of proses) {
      out.push("");
      out.push(`**Pattern in motion** — ${prose}`);
    }
  }

  // 1. Header
  out.push("# The Inner Constitution");
  out.push("");
  out.push("*a possibility, not a verdict*");
  const name = getUserName(demographics);
  if (name) {
    out.push("");
    out.push(`### For: ${name}`);
  }
  // Lead matter — the on-screen Mirror opens with a drop-cap "shape in one
  // sentence" line. The export carries the same lead so the recipient sees
  // what the on-screen reader sees first.
  if (constitution.mirror.shapeInOneSentence) {
    out.push("");
    out.push(`*${constitution.mirror.shapeInOneSentence}*`);
  }

  // CC-058 — Mirror layer uncomfortable-but-true slot (CC-048 Rule 5).
  // Italic-wrapped single paragraph adjacent to the golden sentence.
  // Skip entirely when the engine returned null/empty (silence is the
  // canonical fallback per the canon).
  const uncomfortable = constitution.mirror.uncomfortableButTrue;
  if (uncomfortable && uncomfortable.length > 0) {
    out.push("");
    out.push(`*${uncomfortable}*`);
  }

  // 1a. MBTI disclosure — mirrors MbtiDisclosure.tsx exactly.
  if (
    constitution.lens_stack.confidence === "high" &&
    constitution.lens_stack.mbtiCode
  ) {
    out.push("");
    out.push(
      `*Possible surface label: ${constitution.lens_stack.mbtiCode}. Type labels are surface descriptions only — your shape is not reducible to a four-letter code. The Lens reading above is the actual interpretation.*`
    );
  }

  // 1c. CC-PROSE-1 — Executive Read. 2-sentence distillation lifted from the
  // existing Synthesis composer (gift/danger parallel-line close + "not X,
  // but Y" thesis). Sits between the masthead block (drop-cap +
  // uncomfortableButTrue + MBTI disclosure) and "How to Read This."
  // Second-person register; no invented claims; engine canon phrases
  // preserved verbatim.
  //
  // CC-PROSE-1A Fix 1 — render as a markdown blockquote (`> *...*`) so the
  // distillation reads as a callout, distinct from the surrounding italic
  // section bodies (Read lines, How-to-Read paragraphs, etc.).
  const executiveRead = composeExecutiveRead(constitution);
  if (executiveRead.length > 0) {
    out.push("");
    out.push("## Executive Read");
    out.push("");
    out.push(`> *${executiveRead}*`);
  }

  // 1d. CC-PROSE-1B Layer 4 — Core Signal Map. 12-cell grid lifted
  // verbatim from existing engine outputs (Lens / Compass / Gravity /
  // MBTI / Work / Love / Movement). Renders as three stacked 4-cell
  // markdown tables for parser compatibility. Italic line below the
  // grid is the canonical CORE_SIGNAL_MAP_FOOTER (second-person engine
  // close).
  out.push("");
  out.push("## Core Signal Map");
  out.push("");
  // CC-SUBSTITUTION-LEAK-CLEANUP — pass renderMode so the user-mode
  // Surface-label cell renders "provisional" alone (no leaked MBTI prefix).
  out.push(
    renderCoreSignalMapMarkdown(
      constitution,
      args.renderMode ?? "user"
    )
  );

  // 1b. CC-025 — How to Read This preamble. Sets reader disposition before
  // any specific claim. Same paragraph for every report.
  out.push("");
  out.push("## How to Read This");
  out.push("");
  out.push(
    "*This profile is not meant to define you from the outside. It is meant to give language to a pattern your answers suggest: how you notice reality, what you protect, who you trust, where responsibility tends to land, and how your gifts behave when life puts pressure on them.*"
  );
  out.push("");
  out.push(
    "*The model proposes. You confirm. The most useful reading is not the one that flatters you or corners you. It is the one that helps you become more grounded, more honest, more legible, and more free inside the person you already are.*"
  );

  // 2. Core Pattern
  out.push("");
  out.push("## Your Core Pattern");
  out.push("");
  out.push(constitution.mirror.corePattern);

  // 3+4. CC-PROSE-1B Layer 6 — Top Gifts and Growth Edges unified table.
  // Replaces the prior separate "## Your Top 3 Gifts" + "## Your Top 3
  // Growth Edges" lists. Pairing rule: gifts[i] paired with traps[i] (per
  // canonical generateSimpleSummary parallel-line close). The "What it
  // means" column lifts only the first descriptive sentence of the gift
  // paragraph — no rewording, no compression beyond sentence-boundary
  // truncation.
  const giftCount = Math.min(
    constitution.mirror.topGifts.length,
    constitution.mirror.topTraps.length,
    3
  );
  if (giftCount > 0) {
    out.push("");
    out.push("## Your Top Gifts and Growth Edges");
    out.push("");
    out.push("| Gift | What it means | Growth edge |");
    out.push("| --- | --- | --- |");
    // CC-SHAPE-AWARE-PROSE-ROUTING — when the user's archetype is
    // cindyType or danielType, overlay the archetype-canonical gift
    // labels onto the first N rows. The underlying gift paragraphs
    // (the "What it means" column) keep their existing engine-derived
    // meaning — only the label + growth-edge label change. jasonType
    // and unmappedType keep the legacy labels unchanged.
    const archetypeKey = constitution.profileArchetype?.primary;
    const archetypeGifts =
      archetypeKey === "cindyType" || archetypeKey === "danielType"
        ? GIFT_LABELS_BY_ARCHETYPE[archetypeKey]
        : null;
    for (let i = 0; i < giftCount; i++) {
      const g = constitution.mirror.topGifts[i];
      const t = constitution.mirror.topTraps[i];
      const meaning = firstSentence(g.paragraph)
        // Inline pipe characters break markdown table cells; escape them.
        .replace(/\|/g, "\\|");
      const archetypeOverlay = archetypeGifts?.[i];
      const giftLabel = archetypeOverlay?.label ?? g.label;
      const growthEdge = archetypeOverlay?.growthEdge ?? t.label;
      out.push(`| **${giftLabel}** | ${meaning} | **${growthEdge}** |`);
    }
  }

  // CC-PROSE-1B Layer 6 — Lens-flavor augmentation line. Pre-1B this
  // line rendered between the two list sections; 1B repositions it to
  // sit BELOW the unified table and BEFORE the Layer 5A One-Sentence
  // Summary callout. The composer (getFunctionPairRegister) is
  // unchanged — only the rendering position changes.
  const lensRegister = getFunctionPairRegister(constitution.lens_stack);
  if (giftCount > 0 && lensRegister?.product_safe_sentence) {
    out.push("");
    out.push(`*${lensRegister.product_safe_sentence}*`);
  }

  // CC-SYNTHESIS-1-FINISH Section A — Layer 5A summary callout removed.
  // The callout was a verbatim duplicate of Executive Read sentence 3
  // (composeThesisLine). Executive Read at the top is now the canonical
  // home for the thesis line; the only remaining downstream fire is
  // Layer 5C Final Line callout (different mechanical template, different
  // position, genuine closing-of-the-closing distillation). The composer
  // composeReportCallouts continues to produce `callouts.summary` for
  // backward compatibility — only the render-path emission is removed.

  // 5. What Others May Experience
  out.push("");
  out.push("## What Others May Experience");
  out.push("");
  out.push(constitution.mirror.whatOthersMayExperience);

  // 6. When the Load Gets Heavy
  out.push("");
  out.push("## When the Load Gets Heavy");
  out.push("");
  out.push(constitution.mirror.whenTheLoadGetsHeavy);

  // 7. Your Next 3 Moves
  if (constitution.mirror.yourNext3Moves.length > 0) {
    out.push("");
    out.push("## Your Next 3 Moves");
    out.push("");
    constitution.mirror.yourNext3Moves.forEach((m, i) => {
      out.push(`${i + 1}. **${m.label}** — ${m.paragraph}`);
    });
  }

  // 9. Keystone Reflection
  //
  // CC-KEYSTONE-RENDER — two-tier render. User mode replaces the
  // metadata bullets ("Likely value" / "Wording temperature" / "Openness
  // to revision") with the LLM-rendered interpretive paragraph that
  // opens on the user's verbatim belief quote. Clinician mode keeps the
  // legacy metadata bullets + engine prose byte-identical to pre-CC.
  // On LLM cache miss in user mode, falls back to the engine path so
  // the section never goes empty.
  const belief = constitution.belief_under_tension;
  if (belief && belief.belief_text) {
    const keystoneRenderMode = args.renderMode ?? "user";
    const topCompassValueLabels = topCompassRefs
      .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
      .filter((s) => s.length > 0);
    const qi2 = args.answers ? summarizeQI2Selections(args.answers) : null;
    const qi3 = args.answers ? summarizeQI3Selections(args.answers) : null;
    const keystoneInputs: KeystoneRewriteInputs = {
      archetype:
        constitution.profileArchetype?.primary ?? "unmappedType",
      beliefText: belief.belief_text,
      valueDomain: belief.value_domain,
      topCompassValueLabels,
      costSurfaceLabels: qi3?.selectedLabels ?? [],
      costSurfaceNoneSelected: qi3?.noneSelected ?? false,
      correctionChannelLabels: qi2?.selectedLabels ?? [],
      correctionChannelNoneSelected: qi2?.noneSelected ?? false,
      convictionTemperature: belief.conviction_temperature,
      epistemicPosture: belief.epistemic_posture,
    };
    const cachedKeystone =
      keystoneRenderMode === "user"
        ? readCachedKeystoneRewrite(keystoneInputs)
        : null;

    out.push("");
    out.push("## Keystone Reflection");
    out.push("");
    out.push("*the belief you named, where it sits in your shape.*");

    if (keystoneRenderMode === "user") {
      // CC-KEYSTONE-USER-MODE-UNCONDITIONAL — user-mode rendering is
      // unconditionally free of engine field-list + engine valueOpener
      // prose. Three-tier resolution:
      //   Tier A: LLM committed-cache hit (cohort fixture)
      //   Tier B: LLM runtime-cache hit (on-demand resolution from
      //           CC-LIVE-SESSION-LLM-WIRING populated the runtime cache)
      //   Tier C: deterministic plain-prose fallback when both caches
      //           miss. Composes verbatim quote + value cluster + cost
      //           surface naming with zero engine artifacts.
      out.push("");
      if (cachedKeystone) {
        // Tier A or Tier B — readCachedKeystoneRewrite consults committed
        // cache first, then the on-demand runtime cache.
        out.push(cachedKeystone);
      } else {
        // Tier C — deterministic fallback. Never emits the field-list
        // bullets, "Unsure" labels, or engine valueOpener paragraph.
        out.push(composeKeystoneFallback(keystoneInputs));
      }
    } else {
      // Clinician mode — byte-identical to pre-CC baseline: optional
      // verbatim quote + field-list metadata bullets + engine
      // valueOpener / temperature / posture / closing prose.
      if (includeBeliefAnchor) {
        out.push("");
        // Multi-line belief texts get each line prefixed so the blockquote
        // renders correctly in any Markdown viewer.
        const lines = belief.belief_text.split(/\r?\n/);
        for (const line of lines) {
          out.push(`> ${line}`);
        }
      }
      out.push("");
      out.push(`- **Likely value:** ${VALUE_LABEL[belief.value_domain]}`);
      out.push(`- **Wording temperature:** ${TEMPERATURE_LABEL[belief.conviction_temperature]}`);
      out.push(`- **Openness to revision:** ${POSTURE_LABEL[belief.epistemic_posture]}`);

      const valuesPhrase = valueListPhrase(topCompassRefs, 0);
      out.push("");
      // CC-022c — pass through args.answers + args.demographics so the
      // markdown's Keystone Reflection cites the user's actual Q-I2 / Q-I3
      // selections by source-question label. Falls back to the CC-017
      // generic posture line when answers is undefined.
      out.push(
        generateBeliefContextProse(belief, valuesPhrase, args.answers, demographics)
      );
    }
  }

  // 9a. A Synthesis — mirrors the on-page early placement in MirrorSection,
  // immediately after Keystone Reflection and before Disposition / Work / Love.
  //
  // CC-PROSE-1B Layer 5B — uses getSimpleSummaryParts so the Most Useful
  // Line callout can render between the parallel-line tercet and the
  // closing thesis sentence without duplicating gift/danger content.
  // Order: intro → tercet → Layer 5B callout (gift/danger as blockquote)
  // → closing thesis sentence.
  const summaryParts = getSimpleSummaryParts(constitution);
  if (summaryParts.intro.length > 0) {
    out.push("");
    out.push("## A Synthesis");
    out.push("");
    out.push("*one cross-card read, with the parallel-line close.*");
    out.push("");
    out.push(summaryParts.intro);
    if (summaryParts.tercet) {
      out.push("");
      out.push(summaryParts.tercet);
    }
    // CC-SYNTHESIS-1-FINISH Section A — Layer 5B Most Useful Line callout
    // removed. The callout was a verbatim duplicate of Executive Read
    // sentences 1-2 (composeGiftDangerLine). Executive Read is the
    // canonical home for the gift/danger one-liner.
    //
    // CC-SYNTHESIS-1-FINISH Section A — Synthesis closing thesis sentence
    // removed. The thesis was a verbatim duplicate of Executive Read
    // sentence 3 + Layer 5C Final Line callout. Synthesis section now
    // closes on the parallel-line tercet (unique content).
  }

  // 9b. CC-067 — Closing Read. Engine-level Goal/Soul/Give synthesis, narrated
  // in Work/Love/Give vocabulary plus the named-region nouns (Purpose,
  // Striving, Longing, Gripping, the Parallel-Lives sentence, or the Neutral
  // fallback). Skip entirely when computeGoalSoulGive returned undefined or
  // produced empty prose.
  //
  // CC-070 wrap-compat — when the Defensive Builder pattern (heuristic)
  // fires inside the Striving quadrant, its ≤1-sentence kicker is appended
  // to the Closing Read prose at render time. The kicker is NOT part of
  // the PROSE_TEMPLATES constant (CC-068 wrap-compat slot); it composes
  // here so the pattern catalog stays decoupled from the prose templates.
  // CC-SYNTHESIS-1A Addition 3 — composeClosingReadProse handles BOTH
  // the existing Defensive-Builder striving-kicker append AND the new
  // two-tier closing-phrase substitution ("the early shape of giving"
  // → "Giving is Work that has found its beloved object" when the
  // arrived-state conditions hold). Render layer just emits.
  const closingReadProse = composeClosingReadProse(constitution);
  if (closingReadProse.length > 0) {
    out.push("");
    out.push("## Closing Read");
    out.push("");
    out.push(closingReadProse);
  }

  // 9c. CC-070 + CC-071 — Movement layer. Polar geometry off ADJUSTED
  // Goal/Soul scores plus life-stage-gated guidance. Independent of
  // Closing Read (spec §13.4 / §13.9): two parallel sections, neither
  // references the other in prose. CC-071 added the Dashboard surface
  // (engine-vocabulary text block + 1:1 SVG plot) ABOVE the narrative.
  // Order per spec §13.4a:
  //   1. Dashboard text block (Goal / Soul / Direction / Movement
  //      Strength / Quadrant / Gripping Pull + signal list).
  //   2. SVG visual plot.
  //   3. Narrative prose (geometric/motion/warmer register, no dashboard
  //      numerical readouts — that data belongs to the dashboard).
  const movement = constitution.goalSoulMovement;
  // CC-CRISIS-PATH-PROSE — crisis-class users get a different Movement
  // section: trajectory degree-reading is suppressed in favor of a
  // hedge that points to the Path/Gait section for the actual read.
  const isCrisisPath =
    constitution.coherenceReading?.pathClass === "crisis";
  if (movement && movement.prose.length > 0) {
    out.push("");
    out.push("## Movement");
    out.push("");
    // Dashboard text block. Engine-vocabulary carve-out per spec §12.7.
    const dash = movement.dashboard;
    out.push(`- **Goal:** ${dash.goalScore} / 100`);
    out.push(`- **Soul:** ${dash.soulScore} / 100`);
    if (!isCrisisPath) {
      out.push(
        `- **Direction:** ${Math.round(dash.direction.angle)}° (${dash.direction.descriptor})`
      );
    }
    if (dash.movementStrength.length === 0) {
      // Special render for zero-origin: name the case (spec §AC-21).
      out.push(
        `- **Movement:** 0 — the line has not yet been drawn`
      );
    } else if (dash.movementLimiter) {
      // CC-MOMENTUM-HONESTY — lead with Usable Movement (what the user
      // can actually use), with Potential as secondary context.
      const limiter = dash.movementLimiter;
      out.push(
        `- **Movement:** Usable ${limiter.usableMovement.toFixed(1)} / 100 (${limiter.usableDescriptor})`
      );
      out.push(
        `  - Potential ${limiter.potentialMovement.toFixed(1)} (-${limiter.dragPercent}% drag)`
      );
    } else {
      // Pre-Phase-2 sessions without movementLimiter fall back to the
      // legacy Potential-anchored line.
      out.push(
        `- **Movement Strength:** ${dash.movementStrength.length.toFixed(1)} / 100 (${dash.movementStrength.descriptor})`
      );
    }
    // CC-SYNTHESIS-1A Addition 2 — Four-Quadrant Movement label. The
    // pre-1A `dash.quadrantLabel` two-state ("Giving" / "Gripping" /
    // null) is replaced with one of the four canonical labels (Drift /
    // Work without Presence / Love without Form / Giving / Presence)
    // keyed off the (Goal, Soul) plane. Bias direction stays in the
    // Direction line above — orthogonal reading.
    if (constitution.movementQuadrant) {
      out.push(`- **Quadrant:** ${constitution.movementQuadrant.label}`);
    }
    // CC-AIM-CALIBRATION — Aim composite line, displayed alongside
    // Grip for parallelism. Both are 0-100 axes; Aim is the new axis
    // for the 2×2 (replaces the legacy compliance-bucket %).
    if (constitution.aimReading) {
      out.push(
        `- **Aim:** ${constitution.aimReading.score.toFixed(1)} / 100`
      );
    }
    // CC-AIM-CALIBRATION — renamed from "Gripping Pull" to "Grip" for
    // parallelism with the new "Aim" line.
    // CC-GRIP-WIRING-AND-FLOOR-CALIBRATION — when the §13 stakes
    // amplifier fired (amplifier > 1.05), display both the defensive
    // and the composed values so the reader sees what's happening:
    // "Grip: 61 defensive · 88.5 with stakes". When no amplification
    // fired, show the single canonical composed value.
    const gripReading = constitution.gripReading;
    if (gripReading && gripReading.components.amplifier > 1.05) {
      out.push(
        `- **Grip:** ${gripReading.components.defensiveGrip.toFixed(1)} defensive · ${gripReading.score.toFixed(1)} with stakes`
      );
    } else if (gripReading) {
      out.push(`- **Grip:** ${gripReading.score.toFixed(1)} / 100`);
    } else {
      out.push(`- **Grip:** ${dash.grippingPull.score} / 100`);
    }
    if (dash.grippingPull.signals.length > 0) {
      for (const sig of dash.grippingPull.signals) {
        out.push(`  - ${sig.humanReadable}`);
      }
    }
    // CC-SYNTHESIS-1A Addition 1 — Risk Form 2x2 line.
    // CC-SYNTHESIS-1-FINISH Section D — additionally suppress the Risk
    // Form line when `movementStrength.length === 0` (zero-origin,
    // thin-signal, or Drift-quadrant fixtures with no actual movement).
    // CC-AIM-CALIBRATION — prefer the Aim-based reading when available;
    // fall back to the legacy compliance-bucket reading otherwise. The
    // legacy `constitution.riskForm` reading remains available for
    // audit comparison; the renderer surfaces the canonical Aim-based
    // letter when it's been computed.
    const riskFormForRender =
      constitution.riskFormFromAim ?? constitution.riskForm;
    if (
      !isCrisisPath &&
      riskFormForRender &&
      dash.movementStrength.length > 0
    ) {
      const axisLabel = constitution.riskFormFromAim
        ? `Aim ${constitution.aimReading?.score.toFixed(0) ?? "?"}`
        : `Risk-bucket ${riskFormForRender.riskBucketPct}%`;
      out.push(
        `- **Risk Form:** ${riskFormForRender.letter} (${axisLabel}, Grip ${riskFormForRender.gripScore}/100)`
      );
      out.push("");
      out.push(`*${riskFormForRender.prose}*`);
    }
    // CC-CRISIS-PATH-PROSE — replace trajectory framing with the
    // Movement hedge for crisis-class users.
    if (isCrisisPath) {
      out.push("");
      out.push(`*${CRISIS_MOVEMENT_HEDGE}*`);
    }
    // SVG visual plot. Embedded inline; React + most markdown renderers
    // accept inline <svg>. Surrounding blank lines keep markdown parsers
    // from absorbing the SVG into adjacent paragraphs.
    // CC-TRAJECTORY-VISUALIZATION — four-element chart (potential +
    // usable + tolerance cone + Grip drag marker) replaces the legacy
    // two-element chart. The legacy `renderGoalSoulDashboardSVG` stays
    // in `lib/goalSoulDashboard.ts` for the goalSoulGive audit's direct
    // import; this renderer pulls the upgraded chart from the
    // trajectoryChart module.
    out.push("");
    out.push(generateTrajectoryChartSvgFromConstitution(constitution));
    out.push("");
    // Narrative prose — does NOT restate dashboard numbers (spec §13.5,
    // CC-071 §AC-25).
    out.push(movement.prose);
  }

  // 9d. CC-GRIP-TAXONOMY — Your Grip section. Renders between Movement
  // and Disposition Signal Mix per the prompt's render-position canon
  // ("here's your trajectory → here's how it responds to pressure →
  // here's what bends it"). Three-tier prose preference:
  //   1. LLM-articulated paragraph from cache (gripParagraphLlm)
  //   2. Engine fallback prose (when LLM unavailable + cluster present)
  //   3. Section omitted entirely when cluster confidence is low (no
  //      named grips fired, or cluster genuinely tied)
  emitGripSection(out, constitution);

  // 10. CC-072 — Disposition Signal Mix (replaces the pre-CC-072
  // "Disposition Map" 100%-summing render). Section heading is exactly
  // "Disposition Signal Mix" per memo §6.1; trait names appear after
  // narrative names per §6.2; ER 0% guard renders "low or under-detected"
  // with proxy disclosure per §5.1; cross-references to Goal/Soul fire
  // when corroborating composite is present per §7. Silently omits for
  // pre-CC-037 / thin-signal sessions where the engine didn't produce an
  // ocean output.
  if (constitution.ocean) {
    const mix = constitution.ocean.dispositionSignalMix;
    const prose = composeOceanProse(mix, constitution.goalSoulGive);
    // CC-DISPOSITION-COLLAPSE-DEFAULT — user-mode collapses the full
    // panel behind a <details> disclosure with a plain-language summary
    // line visible above. Clinician mode renders as today (byte-identical
    // to pre-CC baseline). The disposition engine computation is
    // unchanged; this is presentation-only.
    const dispositionRenderMode = args.renderMode ?? "user";
    out.push("");
    out.push("## Disposition Signal Mix");
    out.push("");
    if (dispositionRenderMode === "user") {
      out.push(`*${composeDispositionSummaryLine(mix)}*`);
      out.push("");
      out.push("<details>");
      out.push("<summary>View the full disposition signal panel</summary>");
      out.push("");
    }
    out.push(`*${prose.disclaimer}*`);
    out.push("");
    for (const para of prose.paragraphs) {
      out.push(para);
      out.push("");
    }
    out.push(renderOceanDashboardSVG(mix));
    if (dispositionRenderMode === "user") {
      out.push("");
      out.push("</details>");
    }
  }

  // 11. Work Map. Mirrors the page-level section between Disposition Map and Map.
  if (constitution.workMap && constitution.workMap.matches.length > 0) {
    out.push("");
    out.push("## Work Map");
    out.push("");
    out.push(
      "*Work registers the instrument detects you're structurally aligned to. Derived from your cognitive register, motivational distribution, trait disposition, and value orientation — not from any vocation-specific question. These are categories of work that will come easy and feel meaningful, not prescriptions.*"
    );
    for (const match of constitution.workMap.matches) {
      out.push("");
      out.push(`### ${match.register.register_label}`);
      out.push("");
      out.push(match.register.short_description);
      out.push("");
      out.push(`*Examples: ${match.register.example_anchors.join("; ")}.*`);
    }
    out.push("");
    out.push(constitution.workMap.prose);
    out.push("");
    out.push(
      "*Work Map is a derivation, not a recommendation. It names registers your existing answers point toward; it doesn't account for training, geographic constraints, or life-stage tradeoffs you bring to any career decision.*"
    );
  }

  // 12. Love Map. Mirrors the page-level section between Work Map and Map.
  if (
    constitution.loveMap &&
    (constitution.loveMap.matches.length > 0 ||
      constitution.loveMap.resourceBalance.case !== "healthy")
  ) {
    out.push("");
    out.push("## Love Map");
    out.push("");
    out.push(
      "*Love takes many shapes — what follows describes how your love tends to take shape, not whether your love is real. Real love, regardless of register or flavor, is patient and kind, persists, refuses to keep records, rejoices with truth. The map below names the shape; the qualities it must meet to be love at all are not particular to any shape.*"
    );
    for (const match of constitution.loveMap.matches) {
      out.push("");
      out.push(`### ${match.register.register_label}`);
      out.push("");
      out.push(match.register.short_description);
    }
    const flavorLine = formatLoveFlavorLine(constitution.loveMap.flavors);
    if (flavorLine) {
      out.push("");
      out.push(`*${flavorLine}*`);
    }
    if (constitution.loveMap.resourceBalance.prose) {
      out.push("");
      out.push(constitution.loveMap.resourceBalance.prose);
    }
    out.push("");
    out.push(
      "*Love Map is a derivation, not a prescription. It names the register and modes your existing answers point toward; it doesn't account for life-stage, current circumstance, or the relationships you've actually chosen to invest in.*"
    );
  }

  // 13. Map — the seven SWOT-shape cards. Path is rendered separately as
  // the next section because its body is structurally different (work / love /
  // give / growth move) from the SWOT triple (Strength / Trap / Next move).
  // Spec calls for "all eight cards" but the prose subsection list it
  // describes is SWOT-only; rendering Path inside the same section would
  // either skip its body or distort the card grouping. Flagged in report.
  const shape = constitution.shape_outputs;
  out.push("");
  out.push("## Map — go deeper");
  out.push("");
  out.push("*eight cards under the Mirror — open whichever you want to inspect.*");

  // CC-CRISIS-PATH-PROSE — body-card hedge for crisis-class users.
  // Single soft note before the depth tools so the reader holds them
  // lightly rather than reading them as ground truth in a hard season.
  if (constitution.coherenceReading?.pathClass === "crisis") {
    out.push("");
    out.push(`> *${CRISIS_BODY_CARD_HEDGE}*`);
  }

  // Lens, Compass, Gravity, Trust, Weather, Fire — full-SWOT cards.
  // CC-022c — each card emits its own block so the pattern observations
  // can be appended under the right heading. Conviction stays separate
  // (Strength / Trap / Posture shape).
  const swotCardsWithIds: { card: typeof shape.lens; id: ShapeCardId }[] = [
    { card: shape.lens, id: "lens" },
    { card: shape.compass, id: "compass" },
    { card: shape.gravity, id: "gravity" },
    { card: shape.trust, id: "trust" },
    { card: shape.weather, id: "weather" },
    { card: shape.fire, id: "fire" },
  ];
  for (const { card, id } of swotCardsWithIds) {
    out.push("");
    out.push(`### ${card.cardName} — ${card.bodyPart}`);
    // CC-PROSE-1 Layer 2 — Canonical Question line above the user-specific
    // Read line (cardHeader). The Question states the card's purpose
    // (e.g., "How you read reality"); the Read below answers it.
    //
    // CC-PROSE-1A Fix 1 — bold (non-italic) so it reads visually distinct
    // from the italic Read line directly below. Italic+italic stacked the
    // two lines into a single voice; bold+italic separates them.
    out.push("");
    out.push(`**${SHAPE_CARD_QUESTION[id]}**`);
    out.push("");
    out.push(`*${card.cardHeader}*`);
    out.push("");
    out.push(`**Strength** — ${card.gift.text}`);
    out.push("");
    out.push(`**Growth Edge** — ${card.blindSpot.text}`);
    out.push("");
    // CC-025 — Practice replaces growthEdge.text inside the engine; pre-CC-025
    // saved sessions kept the legacy growth-edge prose there, so fall back to
    // the canonical Practice template for that card.
    const practiceText =
      SHAPE_CARD_PRACTICE_TEXT[id] ?? card.growthEdge.text;
    out.push(`**Practice** — ${practiceText}`);
    // CC-SYNTHESIS-1-FINISH Section E — render order is now:
    //   Practice → Pattern in motion (when fires) → Movement Note OR
    //   per-card synthesis paragraph → (compass-only registers) →
    //   Pattern Note (italic closer)
    // Pre-1F order put Pattern Note before Pattern in motion; the
    // Movement Note insertion required reordering so the closing
    // aphorism (Pattern Note) stays last on the card.
    emitPatternBlock(id);

    // CC-SYNTHESIS-1-FINISH per-card synthesis paragraph. Lens / Compass
    // / Gravity / Fire get Movement Notes (Section E). Trust gets the
    // Correction Channel reframe (Section B). Weather gets the State-
    // vs-Shape qualifier (Section C). Conviction is rendered separately
    // below the SWOT loop. Path is restructured in its own block.
    let cardSynthLine: string | null = null;
    if (id === "lens") cardSynthLine = composeLensMovementNote(constitution);
    else if (id === "compass") cardSynthLine = composeCompassMovementNote(constitution);
    else if (id === "gravity") cardSynthLine = composeGravityMovementNote(constitution);
    else if (id === "fire") cardSynthLine = composeFireMovementNote(constitution);
    else if (id === "trust") cardSynthLine = composeTrustCorrectionChannel(constitution);
    else if (id === "weather") cardSynthLine = composeWeatherStateVsShape(constitution);
    if (cardSynthLine && cardSynthLine.length > 0) {
      out.push("");
      out.push(cardSynthLine);
    }

    if (id === "compass" && card.peace_register_prose) {
      out.push("");
      out.push(card.peace_register_prose);
    }
    if (id === "compass" && card.faith_register_prose) {
      out.push("");
      out.push(card.faith_register_prose);
    }
    const patternNoteText =
      card.patternNote?.text ?? SHAPE_CARD_PATTERN_NOTE[id];
    if (patternNoteText) {
      out.push("");
      out.push(`*${patternNoteText}*`);
    }

    // CC-HANDS-CARD — 9th body card inserts AFTER Heart/Compass and
    // BEFORE the next SWOT card (gravity in the existing loop order,
    // which renders Spine/Gravity). Hands is the existential Goal-axis
    // card; the canon line "Hands is what your life makes real. Work
    // Map is where that making may fit" lives as the closing proverb.
    if (id === "compass" && constitution.handsCard) {
      const h = constitution.handsCard;
      out.push("");
      out.push("### Hands — Work");
      out.push("");
      out.push("**What you build and carry**");
      out.push("");
      out.push(`*${h.openingLine}*`);
      out.push("");
      out.push(`**Strength** — ${h.strength}`);
      out.push("");
      out.push(`**Growth Edge** — ${h.growthEdge}`);
      out.push("");
      out.push(
        `**Under Pressure** — In health: ${h.underPressure.healthRegister} Under load: ${h.underPressure.pressureRegister} ${h.underPressure.integrationLine}`
      );
      out.push("");
      out.push(`**Practice** — ${h.practice}`);
      out.push("");
      out.push(`*${h.movementNote}*`);
      out.push("");
      out.push(`*${h.closingLine}*`);
      out.push("");
      out.push(
        "*Hands is what your life makes real. Work Map is where that making may fit.*"
      );
    }
  }

  // Conviction — Strength / Growth Edge / Posture / Pattern Note (no Practice
  // cell; Posture stands in that slot per CC-025 spec).
  const conv = shape.conviction;
  out.push("");
  out.push(`### ${conv.cardName} — ${conv.bodyPart}`);
  // CC-PROSE-1 Layer 2 — Canonical Question for Conviction.
  // CC-PROSE-1A Fix 1 — bold (non-italic) for visual distinctness from the
  // italic Read line below.
  out.push("");
  out.push(`**${SHAPE_CARD_QUESTION.conviction}**`);
  out.push("");
  out.push(`*${conv.cardHeader}*`);
  out.push("");
  out.push(`**Strength** — ${conv.gift.text}`);
  out.push("");
  out.push(`**Growth Edge** — ${conv.blindSpot.text}`);
  out.push("");
  out.push(`**Posture** — ${conv.posture}`);
  // CC-SYNTHESIS-1-FINISH Section E — Conviction render order:
  //   Posture → Pattern in motion → Movement Note → Pattern Note
  emitPatternBlock("conviction");
  const convMovementNote = composeConvictionMovementNote(constitution);
  if (convMovementNote.length > 0) {
    out.push("");
    out.push(convMovementNote);
  }
  const convPatternNote =
    conv.patternNote ?? SHAPE_CARD_PATTERN_NOTE.conviction;
  out.push("");
  out.push(`*${convPatternNote}*`);

  // 14. Path — Gait. Work / Love / Give / Practice (was "Growth move" pre-CC-025).
  const path = shape.path;
  out.push("");
  out.push("## Path — Gait");
  // CC-PROSE-1 Layer 2 — Canonical Question for Path.
  // CC-PROSE-1A Fix 1 — bold (non-italic) for visual distinctness from the
  // italic Read line below.
  out.push("");
  out.push(`**${SHAPE_CARD_QUESTION.path}**`);
  out.push("");
  out.push("*how this shape moves through work, love, and giving.*");
  out.push("");
  // CC-SYNTHESIS-1-FINISH Section F — master synthesis paragraph
  // replaces the prior `path.directionalParagraph`. The master synthesis
  // weaves bias direction + Work shape + beloved object + Love shape +
  // Risk Form behavior + next-move into a single paragraph; the
  // existing `path.directionalParagraph` field stays on the engine
  // output for backward compatibility but is no longer rendered. The
  // Work / Love / Give detailed blocks below this paragraph remain
  // verbatim — they paint the texture; the synthesis names the
  // integration.
  //
  // CC-SYNTHESIS-3 — prefer the LLM-articulated paragraph from the
  // build-time cache when present; fall back to the mechanical
  // CC-SYNTHESIS-1F composer. The LLM version meets the warmth
  // diagnostic (warm precision with moral nerve) and is sign-off-
  // reviewed in version control. Null/missing cache → mechanical
  // fallback (no runtime API calls per CC-SYNTHESIS-3 Out-of-Scope #4).
  // CC-CRISIS-PATH-PROSE — crisis-class users get the per-flavor crisis
  // paragraph (LLM cached if present, deterministic engine fallback
  // otherwise). The trajectory rubric does not apply.
  const crisisFlavor = constitution.coherenceReading?.crisisFlavor;
  const pathMasterRaw =
    constitution.coherenceReading?.pathClass === "crisis" && crisisFlavor
      ? path.masterSynthesisLlm ?? crisisFallbackParagraph(crisisFlavor)
      : path.masterSynthesisLlm ?? composePathMasterSynthesis(constitution);
  // CC-GRIP-TAXONOMY-REPLACEMENT — render-time Foster-vocab scrub. The
  // synthesis3 LLM cache may still contain "Am I X?" phrases verbatim
  // even after the system prompt's Foster ban. Substitute with the
  // engine-attached underlyingQuestion so the user-facing surface
  // speaks the proprietary Grip Pattern taxonomy.
  const pathMaster = scrubFosterVocab(
    pathMasterRaw,
    constitution.gripPattern?.underlyingQuestion
  );
  out.push(pathMaster);

  // CC-026 — Distribution subsection. Renders only when path.drive is
  // populated; Q-3C1's claimed ranking surfaces as a "Claimed drive: 1. … 2. … 3. …"
  // line when the user answered it. Matches the on-screen render order:
  // Distribution sits above Work / Love / Give.
  if (path.drive) {
    const d = path.drive.distribution;
    out.push("");
    out.push("### Distribution");
    out.push("");
    out.push(
      `[Distribution: Building & wealth ${d.cost}%, People, Service & Society ${d.coverage}%, Risk and uncertainty ${d.compliance}%]`
    );
    if (path.drive.claimed) {
      const labels: Record<string, string> = {
        cost: "Building & wealth",
        coverage: "People, Service & Society",
        compliance: "Risk and uncertainty",
      };
      const c = path.drive.claimed;
      out.push(
        `Claimed drive: 1. ${labels[c.first]} · 2. ${labels[c.second]} · 3. ${labels[c.third]}`
      );
    }
    // CC-PROSE-1 Layer 3b — Drive distribution donut chart. Renders
    // alongside the existing prose narrative (NOT replacing it). Centered
    // "Claimed #1" annotation when Q-3C1 was answered.
    out.push("");
    out.push(
      renderDriveDistributionDonut(
        path.drive.distribution,
        path.drive.claimed?.first
      )
    );
    out.push("");
    out.push(path.drive.prose);
    if (
      path.drive.case === "inverted-small" ||
      path.drive.case === "inverted-big"
    ) {
      out.push("");
      out.push(
        "*Also surfaced in Open Tensions as Claimed and Revealed Drive.*"
      );
    }
  }

  out.push("");
  out.push(`**Work** — ${path.work}`);
  out.push("");
  out.push(`**Love** — ${path.love}`);
  out.push("");
  out.push(`**Give** — ${path.give}`);
  out.push("");
  out.push(`**Practice** — ${path.growthCounterweight}`);

  // CC-070 — Generative Builder kicker (heuristic). Renders italic on the
  // Path · Gait card when the pattern fires, sitting just above the
  // existing pattern note. Sourced via cardAssets.getPathGaitPatternKickers
  // so future cross-card patterns can attach here without re-touching
  // renderMirror.ts.
  const pathGaitKickers = getPathGaitPatternKickers(constitution);
  for (const kicker of pathGaitKickers) {
    out.push("");
    out.push(`*${kicker}*`);
  }

  const pathPatternNote =
    path.patternNote ?? SHAPE_CARD_PATTERN_NOTE.path;
  out.push("");
  out.push(`*${pathPatternNote}*`);
  emitPatternBlock("path");

  // 15-17. Cross-card synthesis.
  // CC-SYNTHESIS-1-FINISH Section A — Growth Path section removed. The
  // section's prose duplicated the Path · Gait opening paragraph in
  // compressed form. Section F's Path master synthesis paragraph
  // absorbs Growth Path's job. The engine still produces
  // `cross_card.growthPath` on the output object for backward
  // compatibility; only the render-path emission is removed.
  const cross = constitution.cross_card;

  out.push("");
  out.push("## Conflict Translation");
  out.push("");
  out.push(cross.conflictTranslation);

  out.push("");
  out.push("## Mirror-Types Seed");
  out.push("");
  out.push(cross.mirrorTypesSeed);

  // 18. Open Tensions. The page-level surface uses local confirmation state
  // not available in the markdown renderer, so the export filters to the
  // persisted engine-side "unconfirmed" tensions only.
  const openTensions = constitution.tensions.filter(
    (t) => t.status === undefined || t.status === "unconfirmed"
  );
  if (openTensions.length > 0) {
    out.push("");
    out.push("## Open Tensions");
    for (const t of openTensions) {
      out.push("");
      // CC-025 Step 2.5A — descriptive name only; T-### IDs internal-only.
      out.push(`### ${t.type}`);
      out.push("");
      out.push(t.user_prompt);
    }
  }

  // 19. Use-cases section (closer before footer).
  out.push("");
  out.push(`## ${USE_CASES_SECTION_TITLE}`);
  out.push("");
  out.push(`*${USE_CASES_SECTION_SUBHEAD}*`);
  for (const useCase of USE_CASES) {
    out.push("");
    out.push(`**${useCase.title}** ${useCase.body}`);
  }

  // 19a. CC-PROSE-1B Layer 5C — Final Line callout. Closing-of-the-closing,
  // mechanically recombined from shapeDescriptor + connector + structuralY-as-
  // imperative. composeReportCallouts returns null when the recombination
  // doesn't yield a clean imperative for the shape — in that case the
  // callout is skipped (the gap surfaces honestly rather than fabricating a
  // generic carry-away line).
  if (callouts.finalLine) {
    out.push("");
    out.push(`> *${callouts.finalLine}*`);
  }

  // CC-CRISIS-PATH-PROSE — standing-reminder block at the end of the
  // report for crisis-class users. Elevated visible treatment so the
  // reader carries the mirror-not-clinician framing past whichever
  // section landed hardest.
  if (constitution.coherenceReading?.pathClass === "crisis") {
    out.push("");
    out.push("---");
    out.push("");
    out.push(`> ${CRISIS_STANDING_REMINDER}`);
  }

  // 20. Footer.
  out.push("");
  out.push("---");
  out.push("");
  out.push(
    `*Generated ${formatDateTime(generatedAt)}. The model proposes — you confirm.*`
  );

  let raw = out.join("\n") + "\n";

  // CC-TWO-TIER-RENDER-SURFACE-CLEANUP — clinician mode emits the raw
  // engine output verbatim (byte-identical to legacy). User mode runs
  // the LLM rewrite substitution (when cache hits) + the user-mode
  // surface mask.
  const renderMode = args.renderMode ?? "user";
  if (renderMode === "clinician") return raw;

  // CC-LLM-PROSE-PASS-V1 — substitute LLM-rewritten section bodies for
  // the four scoped cards (Lens / Compass / Hands / Path) when a cache
  // entry exists. Engine remains source of truth; the substitution
  // replaces the engine prose with the LLM's higher-quality voice.
  // Falls through to engine prose when cache miss.
  const archetype = constitution.profileArchetype?.primary ?? "unmappedType";
  const reservedCanonLines = [
    "visible, revisable, present-tense structure",
    "grounded, legible, and free",
    "the work is not to care less; it is to let love become sustainable enough to last",
    "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
  ];
  const SCOPED_HEADERS: Record<ProseCardId, string> = {
    lens: "### Lens — Eyes",
    compass: "### Compass — Heart",
    hands: "### Hands — Work",
    path: "## Path — Gait",
  };
  for (const cardId of ["lens", "compass", "hands", "path"] as const) {
    const header = SCOPED_HEADERS[cardId];
    const idx = raw.indexOf(header);
    if (idx < 0) continue;
    const rest = raw.slice(idx);
    const depth = header.startsWith("## ") && !header.startsWith("### ") ? 2 : 3;
    const stopPattern = depth === 2 ? /\n## / : /\n## |\n### /;
    const nextHeaderRel = rest.slice(header.length).search(stopPattern);
    const sectionEnd =
      nextHeaderRel < 0
        ? raw.length - idx
        : header.length + nextHeaderRel;
    const engineBody = raw.slice(idx, idx + sectionEnd).trimEnd();
    const inputs: ProseRewriteInputs = {
      cardId,
      archetype,
      engineSectionBody: engineBody,
      reservedCanonLines,
    };
    const cached = readCachedRewrite(inputs);
    if (cached) {
      raw = raw.slice(0, idx) + cached + "\n" + raw.slice(idx + sectionEnd);
    }
    void proseRewriteHash;
  }

  // CC-SMALL-FIXES-BUNDLE Fix 2 — enforce Hands template structure
  // after the LLM splice. Some cohort cache entries (Cindy, Daniel)
  // dropped the sub-header / italic opener / italic canon closing
  // line. Inject what's missing using the engine `handsCard` data; the
  // function is idempotent for Jason whose rewrite already carries the
  // full template.
  raw = enforceHandsTemplate(raw, constitution.handsCard ?? null);

  return applyUserModeMask(raw);
}

/**
 * CC-SMALL-FIXES-BUNDLE Fix 2 — Hands template post-processor.
 *
 * The canonical Hands template in user mode is:
 *
 *   ### Hands — Work
 *   **What you build and carry**
 *   *<opener>*
 *   **Strength** — …
 *   **Growth Edge** — …
 *   **Under Pressure** — …
 *   **Practice** — …
 *   *<italic explanation>*
 *   *<italic canon closing line>*
 *   *Hands is what your life makes real. Work Map is where that making may fit.*
 *
 * The LLM rewrites for Cindy and Daniel dropped one or more of: the
 * sub-header, the italic opener, the italic canon closing line, and
 * the italicization on the trail. This post-processor injects what's
 * missing using `handsCard` engine data (openingLine / closingLine).
 * Idempotent: when the rewrite already supplies a piece, no injection.
 */
function enforceHandsTemplate(
  raw: string,
  handsCard: import("./handsCard").HandsCardReading | null
): string {
  if (!handsCard) return raw;
  const headerIdx = raw.indexOf("### Hands — Work");
  if (headerIdx < 0) return raw;
  const rest = raw.slice(headerIdx);
  // Find the end of the Hands section — next "## " or "### " header.
  const stopRel = rest.slice(20).search(/\n## |\n### /);
  const sectionEnd =
    stopRel < 0 ? raw.length - headerIdx : 20 + stopRel;
  let section = raw.slice(headerIdx, headerIdx + sectionEnd);

  // 1. Inject sub-header + italic opener if the sub-header is missing.
  if (!section.includes("**What you build and carry**")) {
    section = section.replace(
      /^### Hands — Work\s*\n+/,
      `### Hands — Work\n\n**What you build and carry**\n\n*${handsCard.openingLine}*\n\n`
    );
  }

  // 2. Italicize the Work Map distinction trail if not already italic.
  const trailRe = /(\n)(Hands is what your life makes real\. Work Map is where that making may fit\.)(\s*$|\n)/;
  section = section.replace(trailRe, "$1*$2*$3");

  // 3. Inject the italic canon closing line when missing. Detection:
  //    count italic-only lines BETWEEN the last "**Practice** —" line
  //    and the Work Map trail. The healthy template has exactly two
  //    italic lines in that window (italic explanation + italic canon
  //    closing). When the count is < 2, the rewrite dropped the canon
  //    — inject it just before the trail.
  const trailAnchor = "*Hands is what your life makes real. Work Map is where that making may fit.*";
  const trailIdx = section.indexOf(trailAnchor);
  if (trailIdx >= 0) {
    // Find the start of the last "**Practice** —" line.
    const practiceMarker = section.lastIndexOf("**Practice** —", trailIdx);
    const windowStart = practiceMarker >= 0 ? practiceMarker : 0;
    const window = section.slice(windowStart, trailIdx);
    const italicLines = window.match(/^\*[^*\n]+\*\s*$/gm) ?? [];
    if (italicLines.length < 2) {
      const canonLine = `*${handsCard.closingLine}*\n\n`;
      section = section.slice(0, trailIdx) + canonLine + section.slice(trailIdx);
    }
  }
  return raw.slice(0, headerIdx) + section + raw.slice(headerIdx + sectionEnd);
}
