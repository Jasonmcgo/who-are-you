// CC-132 — "50° Life" Individual reformat.
//
// **Purpose.** Re-presents the Individual (`renderMode === "user"`) as the
// 11-section Michele outline. The Guide (`renderMode === "clinician"`) is
// unchanged. Render-only — engine substance untouched (numeric invariant
// is byte-identical before/after; see scripts/_scratch_cc132_capture.ts).
//
// **Warm reuse, ~$0, no regen.** The composer extracts prose for the
// prose-heavy sections (Executive Read, Core Pattern, Path triptych,
// Keystone Reflection, Closing Read, A Synthesis) from a fully
// warm-spliced Guide markdown. The caller (renderMirror.ts) renders the
// Guide internally first, then hands the markdown here for re-placement
// into the new outline. Cache keys are preserved because no new LLM
// inputs are constructed — the V3 splice already ran inside the Guide
// render and its committed cache lookups hit normally.
//
// **Two-tier audit.** The legacy `guide-superset-of-individual`
// (byte-subset) assertion is replaced by a topic-coverage check — see
// tests/audit/twoTierRenderSurfaceCleanup.audit.ts. The new
// presentational structures (four-forces table, Body Cards, GRIP SAYS /
// AIM SAYS) are not byte-present in the Guide; the Guide carries the
// same findings in its narrative form.

import type {
  Answer,
  DemographicSet,
  InnerConstitution,
  Tension,
} from "./types";
import type { ProfileArchetype } from "./profileArchetype";
import type { FollowUpNarrative } from "./followUpNarrative";
import {
  V3_HEADERS,
  extractV3Section,
  extractV3PathTriptych,
} from "./v3SectionInputs";
import { SHAPE_CARD_QUESTION } from "./cardAssets";
import { composeReportCallouts } from "./composeReportCallouts";

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

/**
 * Display labels per archetype for the Cover archetype line.
 * Owner-ratified (CC-133). The caregiver bucket resolves dynamically —
 * see resolveArchetypeDisplayLabel.
 */
export const ARCHETYPE_DISPLAY_LABEL: Record<ProfileArchetype, string> = {
  jasonType: "The Conviction-Driven Architect",
  cindyType: "The Present-Tense Caregiver",
  danielType: "The Faithful Steward",
  unmappedType: "A Shape not contained in a box",
};

/**
 * Resolve the cover archetype label. The caregiver bucket (cindyType)
 * branches on the already-computed lead function so Cindy (Se-led) and
 * Michele (Ne-led) read differently WITHOUT an engine/classifier change:
 *   - Ne-led caregiver → "The Possibility-Driven Caregiver" (Michele)
 *   - otherwise        → "The Present-Tense Caregiver" (Cindy + default)
 * `dominant` is the existing constitution.lens_stack.dominant value.
 */
export function resolveArchetypeDisplayLabel(
  archetype: ProfileArchetype,
  dominant: string | null | undefined
): string {
  if (archetype === "cindyType" && dominant === "ne") {
    return "The Possibility-Driven Caregiver";
  }
  return ARCHETYPE_DISPLAY_LABEL[archetype];
}

/**
 * Four-Forces "WHAT IT MEANS" canon copy. Lifted verbatim from
 * docs/canon/brochure-and-examples.md lines 32-52 (Goal / Soul / Aim /
 * Grip). Hard-coded here so the §2 table is deterministic and cache-
 * stable; the canon file remains the source of truth for the actual
 * copy and any edits should land both places.
 */
export const FOUR_FORCES_CANON: Record<
  "goal" | "soul" | "aim" | "grip",
  { label: string; what: string }
> = {
  goal: {
    label: "Goal",
    what:
      "Outward force. The part of you that builds, solves, carries responsibility, creates form, pursues excellence, and turns intention into reality. *Goal asks: what are you trying to make, repair, steward, or accomplish?* Without Goal, purpose remains abstract.",
  },
  soul: {
    label: "Soul",
    what:
      "Depth force. The part of you that loves, grieves, gives, protects, notices, belongs, believes, and knows what should matter even when it is not efficient. *Soul asks: what makes the work worth doing?* Without Soul, achievement becomes hollow.",
  },
  aim: {
    label: "Aim",
    what:
      "Trajectory governance. Wise risk, discernment, restraint, timing, judgment, and the ability to move without losing the plot. *Aim asks: can you move with force without becoming reckless, rigid, or scattered?* Aim narrows your tolerance cone.",
  },
  grip: {
    label: "Grip",
    what:
      "Defensive patterns that reduce your usable energy. Where fear, overcontrol, shame, approval-seeking, scarcity, or pressure start steering the life. *Grip asks: what starts driving you when you stop feeling free?*",
  },
};

/**
 * Body Cards in Michele's outline order (8 cards = 7 ShapeOutputs cards
 * + handsCard). Each entry carries the display name, the body part, and
 * the constitution path the one-line answer is sliced from.
 */
type BodyPart =
  | "Eyes"
  | "Heart"
  | "Work"
  | "Conviction"
  | "Spine"
  | "Ears"
  | "Nervous System"
  | "Immune Response";

interface BodyCardSpec {
  name: string;
  body: BodyPart;
  /** Which ShapeOutputs key drives the question + answer, or "hands" for handsCard. */
  source:
    | "lens"
    | "compass"
    | "hands"
    | "conviction"
    | "gravity"
    | "trust"
    | "weather"
    | "fire";
}

const BODY_CARDS: BodyCardSpec[] = [
  { name: "Lens", body: "Eyes", source: "lens" },
  { name: "Compass", body: "Heart", source: "compass" },
  { name: "Hands", body: "Work", source: "hands" },
  { name: "Voice", body: "Conviction", source: "conviction" },
  { name: "Gravity", body: "Spine", source: "gravity" },
  { name: "Trust", body: "Ears", source: "trust" },
  { name: "Weather", body: "Nervous System", source: "weather" },
  { name: "Fire", body: "Immune Response", source: "fire" },
];

// ─────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────

export interface ComposeFiftyDegreeInputs {
  constitution: InnerConstitution;
  guideMd: string;
  generatedAt: Date;
  demographics?: DemographicSet | null;
  answers?: Answer[];
  followUpNarrative?: FollowUpNarrative | null;
}

/**
 * Compose the 11-section "50° Life" Individual markdown. The caller is
 * responsible for applying the user-mode mask after this returns.
 */
export function composeFiftyDegreeIndividual(
  inputs: ComposeFiftyDegreeInputs
): string {
  const name = displayName(inputs.demographics);
  const possessive = possessiveName(name);

  const parts: string[] = [];
  parts.push(composeCover(inputs, name));
  parts.push(composeEpigraph(inputs));
  parts.push(composeHowToRead(inputs, name));
  parts.push(composeTrajectory(inputs, possessive));
  parts.push(composePatternAndGrip(inputs, possessive));
  parts.push(composeBodyCards(inputs));
  parts.push(composeWorkLoveGiving(inputs));
  parts.push(composeOpenTensions(inputs));
  parts.push(composeKeystone(inputs));
  parts.push(composeNextMoves(inputs));
  parts.push(composeClosing(inputs));
  parts.push(composeFooter(inputs, name));

  return parts.filter((s) => s.length > 0).join("\n\n") + "\n";
}

// ─────────────────────────────────────────────────────────────────────
// Section composers
// ─────────────────────────────────────────────────────────────────────

// Epigraph (CC-133): the Executive Read pull-quote, relocated off the
// cover to sit just under it as the report's opening thesis line. Empty
// when no warm executiveRead rewrite is present (filtered out on join).
function composeEpigraph(inputs: ComposeFiftyDegreeInputs): string {
  const erBody = extractV3Section(inputs.guideMd, V3_HEADERS.executiveRead);
  return extractExecutiveReadPullQuote(erBody) ?? "";
}

function composeCover(
  inputs: ComposeFiftyDegreeInputs,
  name: string
): string {
  // Cover (CC-133): masthead + FOR {NAME} only. NO bucket/type label — the
  // epigraph (composeEpigraph, next part) leads instead, because a coarse
  // 3-4-bucket archetype label can't be accurate across a bucket. The type
  // label is parked until the engine can derive a per-person label.
  void inputs;
  const lines: string[] = [];
  lines.push("# The Inner Constitution");
  lines.push("");
  lines.push(`**FOR ${name.toUpperCase()}**`);

  return lines.join("\n");
}

function composeHowToRead(
  inputs: ComposeFiftyDegreeInputs,
  name: string
): string {
  const dash = inputs.constitution.goalSoulMovement?.dashboard;
  const aimScore = inputs.constitution.aimReading?.score;
  const grip = inputs.constitution.gripPattern;

  const goalCell = bandLabel(dash?.goalScore);
  const soulCell = bandLabel(dash?.soulScore);
  const aimCell = aimBandLabel(aimScore);
  const gripCell =
    grip?.renderedLabel
      ? `${grip.renderedLabel}: ${firstSentence(grip.underlyingQuestion ?? "")}`
      : "Quiet — no dominant grip cluster fired.";

  const reads: Record<"goal" | "soul" | "aim" | "grip", string> = {
    goal: goalCell,
    soul: soulCell,
    aim: aimCell,
    grip: gripCell,
  };

  const lines: string[] = [];
  lines.push("## How to Read This Report");
  lines.push("");
  lines.push("*Four forces shape every life. The table below names them and what each one looks like for you.*");
  lines.push("");
  const readColumn =
    name === "You" ? "YOUR READ" : `${name.toUpperCase()}'S READ`;
  lines.push(`| Force | What it means | ${readColumn} |`);
  lines.push("| --- | --- | --- |");
  for (const key of ["goal", "soul", "aim", "grip"] as const) {
    const f = FOUR_FORCES_CANON[key];
    const what = f.what.replace(/\|/g, "\\|").replace(/\n/g, " ");
    const read = reads[key].replace(/\|/g, "\\|");
    lines.push(`| **${f.label}** | ${what} | ${read} |`);
  }

  return lines.join("\n");
}

function composeTrajectory(
  inputs: ComposeFiftyDegreeInputs,
  possessive: string
): string {
  // Extract the Movement section verbatim from the Guide — it carries
  // the numeric bullets, the trajectory chart SVG, and the prose.
  const movement = extractV3Section(inputs.guideMd, "## Movement");
  if (!movement) return "";

  // Replace just the H2 title with the Michele framing; keep everything
  // below the header line verbatim (so all numbers, the chart, and the
  // prose carry over unchanged).
  const body = movement.replace(/^## Movement\b.*\n?/m, "").trim();

  const callouts = composeReportCallouts(inputs.constitution);
  const finalLine = callouts.finalLine;

  const lines: string[] = [];
  lines.push(`## ${possessive} Trajectory`);
  lines.push("");
  lines.push(body);
  if (finalLine) {
    lines.push("");
    lines.push(`> *${finalLine}*`);
  }
  return lines.join("\n");
}

function composePatternAndGrip(
  inputs: ComposeFiftyDegreeInputs,
  possessive: string
): string {
  const lines: string[] = [];

  // §4a — Pattern. Use the warm Core Pattern body.
  const core = extractV3Section(inputs.guideMd, V3_HEADERS.corePattern);
  const coreBody = core
    ? core.replace(/^## Your Core Pattern\b.*\n?/m, "").trim()
    : "";

  lines.push(`## ${possessive} Pattern`);
  lines.push("");

  // CC-132 — the Quadrant label is preserved in the Movement metric
  // bullet in §3 (it's a protected metric line for the user-mode mask).
  // Referencing it again in prose here would be stripped by the verdict-
  // phrase mask, leaving an empty stub. Leave the chart and metric
  // bullet to carry the label; §4 prose names the pattern in words.
  if (coreBody.length > 0) {
    lines.push(coreBody);
  }

  // §4b — Grip. Primal question blockquote + GRIP SAYS / AIM SAYS table.
  const grip = inputs.constitution.gripPattern;
  if (grip) {
    lines.push("");
    lines.push(`## ${possessive} Grip`);
    lines.push("");
    if (grip.underlyingQuestion) {
      lines.push(`> ${grip.underlyingQuestion}`);
      lines.push("");
    }

    const rows: Array<{ grip: string; aim: string }> = [];

    // Row 1 — the base grip → healthy gift pair. Engine-fallback prose
    // lives in renderMirror.ts:emitGripSection; we re-derive the
    // essential pair from gripTaxonomy. healthyGift is typically a
    // short label list (e.g. "humility, craft") — re-frame as a full
    // AIM SAYS cell so the table reads as a complete contrast.
    const taxonomy = inputs.constitution.gripTaxonomy;
    if (taxonomy?.distortedStrategy?.text) {
      const giftLabel = taxonomy.healthyGift?.trim() ?? "";
      const aimCell = giftLabel.length > 0
        ? `Same protection, lighter hand — held as ${giftLabel} rather than as defense.`
        : "Same protection without the cost — held with a lighter hand.";
      rows.push({
        grip: taxonomy.distortedStrategy.text,
        aim: aimCell,
      });
    }

    // Row 2+ — follow-up narrative pairs (CC-129).
    const fu = inputs.followUpNarrative;
    if (fu?.gripObject?.text && fu?.releaseCondition?.text) {
      rows.push({
        grip: fu.gripObject.text,
        aim: fu.releaseCondition.text,
      });
    }
    if (fu?.aimReplacement?.text) {
      // Append as a third row — the aim move itself.
      const lastRowAim = rows[rows.length - 1]?.aim;
      rows.push({
        grip: lastRowAim ? "What you'd do instead:" : "Your next move:",
        aim: fu.aimReplacement.text,
      });
    }

    if (rows.length > 0) {
      lines.push("| GRIP SAYS | AIM SAYS |");
      lines.push("| --- | --- |");
      for (const r of rows) {
        const g = r.grip.replace(/\|/g, "\\|").replace(/\n/g, " ");
        const a = r.aim.replace(/\|/g, "\\|").replace(/\n/g, " ");
        lines.push(`| ${g} | ${a} |`);
      }
    }
  }

  return lines.join("\n");
}

function composeBodyCards(inputs: ComposeFiftyDegreeInputs): string {
  const shape = inputs.constitution.shape_outputs;
  if (!shape) return "";

  const lines: string[] = [];
  lines.push("## Why This Is Happening — The Body Cards");
  lines.push("");
  lines.push(
    "*Eight body parts, eight pressure points. Each card names one register of your shape — the question that lives there and the one-line answer your week is currently giving.*"
  );

  for (let i = 0; i < BODY_CARDS.length; i++) {
    const card = BODY_CARDS[i];
    const num = String(i + 1).padStart(2, "0");
    const question = bodyCardQuestion(card.source);
    const answer = bodyCardAnswer(card.source, inputs.constitution);
    lines.push("");
    lines.push(`### ${num} · ${card.name} · ${card.body}`);
    lines.push("");
    lines.push(`*${question}*`);
    if (answer.length > 0) {
      lines.push("");
      lines.push(answer);
    }
  }

  return lines.join("\n");
}

function composeWorkLoveGiving(inputs: ComposeFiftyDegreeInputs): string {
  const triptych = extractV3PathTriptych(inputs.guideMd);
  if (!triptych) return "";

  // Re-emit the three beats with the Michele register: ** Beat. ** as
  // the head, body verbatim minus the bold-label prefix.
  const lines: string[] = [];
  lines.push("## Work, Love, and Giving");
  lines.push("");
  for (const label of ["Work", "Love", "Give"] as const) {
    const block = extractPathBeat(triptych, label);
    if (!block) continue;
    const displayLabel = label === "Give" ? "Giving" : label;
    lines.push(`**${displayLabel}.** ${block}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function composeOpenTensions(inputs: ComposeFiftyDegreeInputs): string {
  const HYPOCRISY_TENSION_IDS = new Set(["T-013", "T-014", "T-016"]);
  const open = (inputs.constitution.tensions ?? []).filter(
    (t: Tension) =>
      (t.status === undefined || t.status === "unconfirmed") &&
      !HYPOCRISY_TENSION_IDS.has(t.tension_id)
  );
  if (open.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Open Tensions Worth Watching");
  for (const t of open) {
    const title = t.type.toUpperCase().replace(/\s+/g, " ").trim();
    // Drop trailing "Does this feel accurate?" prompt-style questions.
    const prompt = stripAccuracyPrompt(t.user_prompt);
    lines.push("");
    lines.push(`### ${title}`);
    lines.push("");
    lines.push(prompt);
  }
  return lines.join("\n");
}

function composeKeystone(inputs: ComposeFiftyDegreeInputs): string {
  const belief = inputs.constitution.belief_under_tension;
  if (!belief?.belief_text) return "";

  // Extract warm keystone prose from the Guide (the warm rewrite was
  // already spliced in by the Guide render path).
  const kw = extractV3Section(inputs.guideMd, "## Keystone Reflection");
  if (!kw) return "";
  // Strip the section header + the italic subhead the Guide emits
  // verbatim ("*the belief you named, where it sits in your shape.*").
  let body = kw.replace(/^## Keystone Reflection\b.*\n?/m, "");
  body = body.replace(
    /^\*the belief you named, where it sits in your shape\.\*\n?/m,
    ""
  );
  // Drop the clinician scaffolding bullets that may follow (Likely value,
  // Wording temperature, Openness to revision) and the contextual prose
  // — those only emit in clinician mode in renderMirror.ts:1147+, but
  // belt-and-suspenders strip them here too.
  body = body.replace(/\n- \*\*Likely value:\*\*[\s\S]*$/m, "");
  body = body.trim();

  const lines: string[] = [];
  lines.push("## Keystone Reflection");
  lines.push("");
  // Belief blockquote — only if the warm prose doesn't already lead with
  // a verbatim echo of the belief text. The CC-131 Keystone system
  // prompt forbids restatement, but some warm cache entries pre-date
  // that rule and open with the belief as a blockquote. Detect by
  // checking whether the first line of the warm body is `> ` and
  // contains a prefix of the belief text.
  const beliefFirstWords = belief.belief_text.trim().slice(0, 40);
  const warmStartsWithBelief =
    body.startsWith("> ") &&
    body.split("\n", 1)[0].includes(beliefFirstWords.slice(0, 30));
  if (!warmStartsWithBelief) {
    for (const ln of belief.belief_text.split(/\r?\n/)) {
      lines.push(`> ${ln}`);
    }
    lines.push("");
  }
  lines.push(body);
  return lines.join("\n");
}

function composeNextMoves(inputs: ComposeFiftyDegreeInputs): string {
  const moves = inputs.constitution.mirror?.yourNext3Moves ?? [];
  if (moves.length === 0) return "";

  const lines: string[] = [];
  lines.push("## Your Next Three Moves — From Grip to Aim");
  lines.push("");

  // The "This Week" 4th pathTriptych paragraph folds in as the bold
  // **Practice.** line on the first move when present; falls back to
  // nextMoves.prose.oneSmallMove.
  const thisWeek = extractPathThisWeek(inputs.guideMd);
  const oneSmallMove = inputs.constitution.nextMoves?.prose.oneSmallMove;
  const practiceLine = thisWeek ?? oneSmallMove ?? null;

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    lines.push(`### ${i + 1}. ${m.label}`);
    lines.push("");
    lines.push(m.paragraph);
    if (i === 0 && practiceLine) {
      lines.push("");
      lines.push(`**Practice.** ${practiceLine}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function composeClosing(inputs: ComposeFiftyDegreeInputs): string {
  const closing = extractV3Section(inputs.guideMd, V3_HEADERS.closingRead);
  const closingBody = closing
    ? closing.replace(/^## Closing Read\b.*\n?/m, "").trim()
    : "";

  // Synthesis fold-in: extract intro paragraph + tercet. Drop the
  // italic subhead and header.
  let synthesisFold = "";
  const syn = extractV3Section(inputs.guideMd, V3_HEADERS.synthesis);
  if (syn) {
    let s = syn.replace(/^## A Synthesis\b.*\n?/m, "");
    s = s.replace(
      /^\*one cross-card read, with the parallel-line close\.\*\n?/m,
      ""
    );
    synthesisFold = s.trim();
  }

  const lines: string[] = [];
  lines.push("## Closing Read");
  lines.push("");
  if (closingBody.length > 0) lines.push(closingBody);
  if (synthesisFold.length > 0) {
    if (closingBody.length > 0) lines.push("");
    lines.push(synthesisFold);
  }
  return lines.join("\n");
}

function composeFooter(
  inputs: ComposeFiftyDegreeInputs,
  name: string
): string {
  const date = inputs.generatedAt.toISOString().slice(0, 10);
  const verb = name === "You" ? "CONFIRM" : "CONFIRMS";
  return `---\n\n*THE MODEL PROPOSES — ${name.toUpperCase()} ${verb} · GENERATED ${date}*`;
}

// ─────────────────────────────────────────────────────────────────────
// Extraction helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Extract the bold-italic pull-quote at the top of the Executive Read
 * body (`> *...*`). Returns null if the body lacks a pull-quote.
 */
export function extractExecutiveReadPullQuote(
  body: string | null
): string | null {
  if (!body) return null;
  const m = body.match(/^> \*([^\n]+)\*/m);
  if (!m) return null;
  return `> *${m[1].trim()}*`;
}

/**
 * Extract a single beat (Work / Love / Give) from the path triptych
 * markdown (output of `extractV3PathTriptych`). Returns the body with
 * the bold-label prefix stripped.
 */
export function extractPathBeat(
  triptych: string,
  label: "Work" | "Love" | "Give"
): string | null {
  const re = new RegExp(
    `\\*\\*${label}\\*\\*\\s*[—-]\\s*([\\s\\S]*?)(?=\\n\\*\\*(?:Work|Love|Give|Practice|Pattern Note|Pattern in motion|Movement Note|This week)\\*\\*|\\n## |\\n### |$)`
  );
  const m = triptych.match(re);
  if (!m) return null;
  return m[1].trim();
}

/**
 * Extract the **This week** beat from the Path · Gait card body.
 * Returns the body with the bold-label prefix stripped, or null if
 * the beat is not present.
 */
export function extractPathThisWeek(guideMd: string): string | null {
  const m = guideMd.match(
    /\*\*This week\*\*\s*[—-]\s*([\s\S]*?)(?=\n\*\*(?:Work|Love|Give|Practice|Pattern Note|Pattern in motion|Movement Note)\*\*|\n## |\n### |$)/
  );
  if (!m) return null;
  return m[1].trim();
}

// ─────────────────────────────────────────────────────────────────────
// Body Card helpers
// ─────────────────────────────────────────────────────────────────────

function bodyCardQuestion(source: BodyCardSpec["source"]): string {
  if (source === "hands") return "What you build and carry";
  if (source === "conviction") return SHAPE_CARD_QUESTION.conviction;
  // The other 6 sources map 1:1 to SHAPE_CARD_QUESTION keys.
  return SHAPE_CARD_QUESTION[source];
}

function bodyCardAnswer(
  source: BodyCardSpec["source"],
  constitution: InnerConstitution
): string {
  if (source === "hands") {
    const h = constitution.handsCard;
    if (!h) return "";
    return firstTwoSentences(h.openingLine);
  }
  const card = constitution.shape_outputs?.[source];
  if (!card) return "";
  // Each ShapeOutputs card has a `cardHeader` — a short italicized
  // "Read" sentence used in the Mirror card lede (see renderMirror.ts
  // ShapeCard emit). Take the first 1-2 sentences for the Body Card
  // one-liner.
  return firstTwoSentences(card.cardHeader);
}

// ─────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────

function bandLabel(score: number | null | undefined): string {
  if (score == null) return "Quiet — thin signal in this register.";
  if (score >= 70) return "Strong.";
  if (score >= 55) return "Present.";
  if (score >= 40) return "Mixed.";
  return "Quiet — the growth edge.";
}

function aimBandLabel(score: number | null | undefined): string {
  if (score == null) return "Quiet — thin signal in this register.";
  if (score >= 70) return "Open-handed — Aim is doing real work.";
  if (score >= 55) return "Present — Aim is holding the line.";
  if (score >= 40) return "Mixed — Aim is partial.";
  return "The growth edge — Aim is the line you'd most like to lift.";
}

function firstSentence(s: string): string {
  if (!s) return "";
  const idx = s.search(/[.!?](\s|$)/);
  if (idx < 0) return s.trim();
  return s.slice(0, idx + 1).trim();
}

function firstTwoSentences(s: string): string {
  if (!s) return "";
  // Match up to 2 sentence-terminators.
  const re = /^[\s\S]*?[.!?](\s|$)(?:[\s\S]*?[.!?](\s|$))?/;
  const m = s.match(re);
  return (m?.[0] ?? s).trim();
}

function stripAccuracyPrompt(prompt: string): string {
  // Drop trailing "Does this feel accurate?" / "Is this how you'd
  // describe it?" prompt lines per CC §7. Handles both newline-
  // separated trailing lines AND inline trailing questions (engine
  // emits both shapes across the tension catalog).
  const cleaned = prompt
    .replace(/\n+\s*(Does this (feel|read) accurate.*|Is that how[^\n]*|Does this match[^\n]*|Does this read like .*)\??\s*$/i, "")
    .replace(/\s+(Does this (feel|read) accurate\??|Is that how (it|that) reads\??|Does this match (your|the) read\??|Does this read like .+?\?)\s*$/i, "")
    .trim();
  return cleaned;
}

function displayName(demographics?: DemographicSet | null): string {
  if (!demographics) return "You";
  // Try common name fields. Different cohort fixtures use different
  // field_ids; fall back to "You" when none match.
  const ans = demographics.answers ?? [];
  const lookup = (id: string): string | null => {
    const a = ans.find((x) => x.field_id === id);
    if (!a) return null;
    if (typeof a.value !== "string") return null;
    return a.value.trim() || null;
  };
  return (
    lookup("first_name") ??
    lookup("firstName") ??
    lookup("name") ??
    "You"
  );
}

function possessiveName(name: string): string {
  if (name === "You") return "Your";
  if (name.endsWith("s")) return `${name}'`;
  return `${name}'s`;
}
