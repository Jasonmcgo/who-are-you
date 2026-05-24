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
import { composeReportCallouts } from "./composeReportCallouts";
// CC-145 — single-source body-card + grip field mapping (shared with
// FiftyDegreeIndividualSection.tsx so the two surfaces can't drift).
import {
  BODY_CARDS as SHARED_BODY_CARDS,
  bodyCardFieldsFor,
  bodyGripBlockFor,
} from "./bodyCardFieldMap";
import { renderDriveDistributionDonut } from "./driveDistributionChart";
import { renderOceanDashboardSVG, composeOceanProse } from "./oceanDashboard";
import { composeDispositionSummaryLine } from "./renderMirror";
// CC-146 Part B — claimed-vs-revealed drive prose. The Individual's
// Work, Love, and Giving section now carries the same Distribution /
// Claimed lines + case-aware drive narrative the Guide emits in
// renderMirror.ts ~L1870-1920.
import { generateDriveProse } from "./drive";

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

// CC-145 — body card spec + ordering live in `lib/bodyCardFieldMap.ts`
// so the markdown composer and the React mirror share the same source.
const BODY_CARDS = SHARED_BODY_CARDS;

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
  // CC-166 — Pattern + Grip were one composer pre-CC-166. Split so
  // Top Gifts can slot BETWEEN them per the CC's ordering spec.
  parts.push(composePattern(inputs, possessive));
  parts.push(composeTopGiftsAndGrowthEdges(inputs));
  parts.push(composeGrip(inputs, possessive));
  parts.push(composeWhenTheLoadGetsHeavy(inputs));
  parts.push(composeHowOthersExperienceYou(inputs));
  parts.push(composeBodyCards(inputs));
  parts.push(composeDispositionSignalMix(inputs));
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
  // CC-166 §B — set the epistemic posture early. The Guide emits this
  // italic line just under its masthead (renderMirror.ts ~L908). The
  // Individual previously dropped it; restoring tells the reader the
  // report is a working hypothesis to test, not a verdict to receive.
  lines.push("");
  lines.push("*a possibility, not a verdict*");

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
  let body = movement.replace(/^## Movement\b.*\n?/m, "").trim();

  // CC-166 §E — collapse the raw grip sub-signal bullets into a
  // <details> drawer with a composed "Pressure Pull" summary line.
  // The Guide emits these as indented children of the `**Grip:**`
  // bullet line in clinician mode (see renderMirror.ts ~L1364):
  //
  //   - **Grip:** 26 / 100
  //     - Grips control under pressure
  //     - Grips money / security under pressure
  //     - ...
  //
  // Inline, they read accusatory/diagnostic in a public report. Strip
  // them from `body`, compose a one-line summary from the same
  // `grippingPull.signals` list, and surface the raw bullets inside
  // a drawer below.
  const gripSignals =
    inputs.constitution.goalSoulMovement?.dashboard?.grippingPull?.signals ??
    [];
  const collapsed = collapseGripSubSignals(body, gripSignals);
  body = collapsed.body;

  const callouts = composeReportCallouts(inputs.constitution);
  const finalLine = callouts.finalLine;

  const lines: string[] = [];
  lines.push(`## ${possessive} Trajectory`);
  lines.push("");
  lines.push(body);
  if (collapsed.drawer.length > 0) {
    lines.push("");
    lines.push(collapsed.drawer);
  }
  if (finalLine) {
    lines.push("");
    lines.push(`> *${finalLine}*`);
  }
  return lines.join("\n");
}

// CC-166 §E — strip the raw indented grip-signal bullets from the
// Movement body and build (a) a one-line "Pressure Pull" summary
// using the same signal list and (b) a <details> drawer containing
// the original bullets verbatim. The Movement body's `**Grip:**`
// bullet itself stays in place — only its indented children move.
function collapseGripSubSignals(
  body: string,
  signals: Array<{ id: string; humanReadable: string }>
): { body: string; drawer: string } {
  if (signals.length === 0) {
    return { body, drawer: "" };
  }
  // The Guide emits each child bullet as "  - <humanReadable>" under
  // the `- **Grip:** ...` line. Match and remove every such line
  // whose text exactly matches one of the signal humanReadable
  // strings (defensive — won't accidentally chew a non-grip
  // indented bullet).
  const signalTexts = new Set(signals.map((s) => s.humanReadable));
  const inputLines = body.split("\n");
  const keptLines: string[] = [];
  for (const ln of inputLines) {
    const m = ln.match(/^\s+-\s+(.+?)\s*$/);
    if (m && signalTexts.has(m[1])) {
      // drop — moves into drawer
      continue;
    }
    keptLines.push(ln);
  }
  const cleaned = keptLines.join("\n");
  // Compose the summary line: pick first signal as primary, next two
  // (if present) as background. Lower-cases the engine-string'd "Grip"
  // prefix for natural-reading prose. Falls back to a single primary
  // when fewer than three signals.
  const primary = humanizePressureSignal(signals[0].humanReadable);
  const secondary = signals[1]
    ? humanizePressureSignal(signals[1].humanReadable)
    : null;
  const tertiary = signals[2]
    ? humanizePressureSignal(signals[2].humanReadable)
    : null;
  let summary: string;
  if (secondary && tertiary) {
    summary = `**Pressure Pull:** ${primary} — with ${secondary} and ${tertiary} in the background.`;
  } else if (secondary) {
    summary = `**Pressure Pull:** ${primary} — with ${secondary} in the background.`;
  } else {
    summary = `**Pressure Pull:** ${primary}.`;
  }
  const drawerLines: string[] = [];
  drawerLines.push(summary);
  drawerLines.push("");
  drawerLines.push("<details>");
  drawerLines.push("<summary>View supporting signals</summary>");
  drawerLines.push("");
  for (const s of signals) {
    drawerLines.push(`- ${s.humanReadable}`);
  }
  drawerLines.push("");
  drawerLines.push("</details>");
  return { body: cleaned, drawer: drawerLines.join("\n") };
}

// CC-166 §E — humanize a single signal's humanReadable string into a
// short prose fragment for the Pressure Pull summary. Drops the
// engine "Grips " prefix + the " under pressure" suffix so the
// sentence reads as natural prose rather than a list of flags.
function humanizePressureSignal(raw: string): string {
  return raw
    .replace(/^Grips\s+/i, "")
    .replace(/\s+under pressure$/i, "")
    .trim();
}

// CC-166 — split from `composePatternAndGrip` so Top Gifts can slot
// between Pattern and Grip per the CC's ordering spec. Carries the
// MBTI humility drawer (§C) at the end of Pattern.
function composePattern(
  inputs: ComposeFiftyDegreeInputs,
  possessive: string
): string {
  const lines: string[] = [];
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

  // CC-166 §C — MBTI humility drawer at the end of Pattern. The Guide
  // emits a `*Possible surface label: <CODE>...*` italic line
  // (clinician-mode-only in renderMirror.ts ~L944); we extract it
  // and wrap in a `<details>` so the report answers "what type am I?"
  // without anchoring on the code. When the Guide didn't emit a
  // surface label (e.g. non-canonical stack, low confidence), the
  // drawer is omitted entirely.
  const mbtiDrawer = composeMbtiHumilityDrawer(inputs.guideMd);
  if (mbtiDrawer.length > 0) {
    lines.push("");
    lines.push(mbtiDrawer);
  }

  return lines.join("\n");
}

function composeGrip(
  inputs: ComposeFiftyDegreeInputs,
  possessive: string
): string {
  const grip = inputs.constitution.gripPattern;
  if (!grip) return "";

  const lines: string[] = [];
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

  // CC-145 — full Grip block from `bodyGripBlockFor`, appended below
  // the GRIP SAYS / AIM SAYS lead-in. Mirrors the Guide's ## Your Grip
  // emit (narrative + Surface Grip / Grip Pattern / Underlying Question /
  // Distorted Strategy / Healthy Gift / Contributing grips / Sub-register
  // / Confidence), de-duplicated so each field appears once.
  const block = bodyGripBlockFor(inputs.constitution);
  if (block) {
    lines.push("");
    lines.push(block.narrative);
    lines.push("");
    lines.push(`**Surface Grip:** ${block.surfaceGrip}`);
    lines.push("");
    lines.push(`**Grip Pattern:** ${block.patternLabel}`);
    lines.push("");
    lines.push(`**Underlying Question:** ${block.underlyingQuestion}`);
    if (block.distortedStrategy.length > 0) {
      lines.push("");
      lines.push(`**Distorted Strategy:** ${block.distortedStrategy}`);
    }
    if (block.healthyGift.length > 0) {
      lines.push("");
      lines.push(`**Healthy Gift:** ${block.healthyGift}`);
    }
    if (block.contributingGrips.length > 0) {
      lines.push("");
      lines.push(
        `**Contributing grips:** ${block.contributingGrips.join(", ")}`
      );
    }
    if (block.subRegister) {
      lines.push("");
      lines.push(`**Sub-register:** ${block.subRegister}`);
    }
    lines.push("");
    lines.push(`**Confidence:** ${block.confidence}`);
  }

  return lines.join("\n");
}

// CC-166 §C — extract the Guide's clinician-only "Possible surface
// label" italic note and wrap in a <details> drawer. Returns "" when
// the Guide didn't emit a label (non-canonical stack / low
// confidence), so the drawer is omitted entirely.
function composeMbtiHumilityDrawer(guideMd: string): string {
  const m = guideMd.match(
    /^\*Possible surface label:\s*([A-Z]{4})\.\s*([^\n*]+)\.\*$/m
  );
  if (!m) return "";
  const code = m[1];
  const lines: string[] = [];
  lines.push("<details>");
  lines.push("<summary>If you use personality-type language</summary>");
  lines.push("");
  lines.push(
    `*This may resemble ${code}-patterning, but the report isn't built on type labels — what matters more is the pattern above.*`
  );
  lines.push("");
  lines.push("</details>");
  return lines.join("\n");
}

// CC-166 §A.1 — Top Gifts and Growth Edges. Extract the Guide's
// "## Your Top Gifts and Growth Edges" section (which is already a
// compact per-user 3-row table). Keep the table verbatim + at most one
// lead sentence; do not author new prose (shape-blind-routing guard).
function composeTopGiftsAndGrowthEdges(
  inputs: ComposeFiftyDegreeInputs
): string {
  const raw = extractV3Section(
    inputs.guideMd,
    "## Your Top Gifts and Growth Edges"
  );
  if (!raw) return "";
  // Strip the Guide's heading line; keep the body. The body is
  // typically a 3-row markdown table preceded by one optional lead
  // sentence and optionally followed by clinician scaffolding (any
  // "## " H2 below would already be excluded by `extractV3Section`).
  const body = raw.replace(/^## Your Top Gifts and Growth Edges\b.*\n?/m, "").trim();
  if (body.length === 0) return "";
  // Length discipline (CC-166): keep the table + at most one lead
  // sentence. Walk the body line-by-line; once we've captured the
  // table (last "|" row), stop. A "lead sentence" before the table is
  // any non-empty, non-table line above the first "|".
  const inputLines = body.split("\n");
  const out: string[] = [];
  let seenTableStart = false;
  let lastTableLineIdx = -1;
  for (let i = 0; i < inputLines.length; i++) {
    const ln = inputLines[i];
    if (ln.trim().startsWith("|")) {
      seenTableStart = true;
      lastTableLineIdx = i;
    }
  }
  if (lastTableLineIdx < 0) {
    // No table found — take just the first non-empty paragraph as a
    // defensive fallback (no stub, but no full re-bloat either).
    const firstPara = inputLines
      .reduce<string[]>((acc, ln) => {
        if (acc.length === 0 && ln.trim().length === 0) return acc;
        if (acc.length > 0 && ln.trim().length === 0) {
          acc.push("__STOP__");
          return acc;
        }
        if (acc[acc.length - 1] === "__STOP__") return acc;
        acc.push(ln);
        return acc;
      }, [])
      .filter((ln) => ln !== "__STOP__");
    if (firstPara.length === 0) return "";
    out.push("## Top Gifts and Growth Edges");
    out.push("");
    out.push(firstPara.join("\n"));
    return out.join("\n");
  }
  // Table found: keep everything from the first non-empty line through
  // the last table line. Drops any trailing prose past the table.
  let firstKeepIdx = -1;
  for (let i = 0; i < inputLines.length; i++) {
    if (inputLines[i].trim().length > 0) {
      firstKeepIdx = i;
      break;
    }
  }
  if (firstKeepIdx < 0) return "";
  void seenTableStart;
  out.push("## Top Gifts and Growth Edges");
  out.push("");
  out.push(inputLines.slice(firstKeepIdx, lastTableLineIdx + 1).join("\n"));
  return out.join("\n");
}

// CC-166 §A.2 — When the Load Gets Heavy. Extract the Guide's
// "## When the Load Gets Heavy" section and keep just the first
// paragraph (the embodied "what narrows under load" prose). Stops at
// the first blank line after the first non-empty line.
function composeWhenTheLoadGetsHeavy(
  inputs: ComposeFiftyDegreeInputs
): string {
  const raw = extractV3Section(inputs.guideMd, "## When the Load Gets Heavy");
  if (!raw) return "";
  const body = raw.replace(/^## When the Load Gets Heavy\b.*\n?/m, "").trim();
  if (body.length === 0) return "";
  const firstPara = firstParagraph(body);
  if (firstPara.length === 0) return "";
  const out: string[] = [];
  out.push("## When the Load Gets Heavy");
  out.push("");
  out.push(firstPara);
  return out.join("\n");
}

// CC-166 §A.3 — How Others May Experience You. Extract the Guide's
// "## What Others May Experience" and keep the first paragraph;
// rename to second-person ("How Others May Experience You" reads
// warmer than the Guide's third-person observational framing).
function composeHowOthersExperienceYou(
  inputs: ComposeFiftyDegreeInputs
): string {
  const raw = extractV3Section(inputs.guideMd, "## What Others May Experience");
  if (!raw) return "";
  const body = raw.replace(/^## What Others May Experience\b.*\n?/m, "").trim();
  if (body.length === 0) return "";
  const firstPara = firstParagraph(body);
  if (firstPara.length === 0) return "";
  const out: string[] = [];
  out.push("## How Others May Experience You");
  out.push("");
  out.push(firstPara);
  return out.join("\n");
}

// Helper — take the first non-empty paragraph (text up to the first
// double-newline) from a markdown body. Used by §A.2 and §A.3 for
// the "first paragraph only" compression discipline.
function firstParagraph(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) return "";
  const firstBreak = trimmed.search(/\n\s*\n/);
  if (firstBreak < 0) return trimmed;
  return trimmed.slice(0, firstBreak).trim();
}

function composeBodyCards(inputs: ComposeFiftyDegreeInputs): string {
  const shape = inputs.constitution.shape_outputs;
  if (!shape) return "";

  // CC-146 Part A — markdown stays on engine prose. The warm 4-card
  // splice (lens / compass / hands / path) is React-only (live LLM
  // rewrites fetch client-side via `/api/report-cards`); the markdown
  // composer runs server-side without access to those rewrites, so
  // any swap would silently downgrade the Copy/Download artifact.
  const lines: string[] = [];
  // CC-166 §F2 — renamed from "Why This Is Happening — The Body Cards".
  // The cards organize interpretive dimensions; they don't claim
  // causation. New heading clarifies what the section does.
  lines.push("## Where the Pattern Shows Up — The Eight Body Cards");
  lines.push("");
  lines.push(
    "*Eight body parts, eight pressure points. Each card names one part of how you operate — the question that lives there, the strength it carries, the growth edge it surfaces, and a practice you can apply.*"
  );

  for (let i = 0; i < BODY_CARDS.length; i++) {
    const card = BODY_CARDS[i];
    const num = String(i + 1).padStart(2, "0");
    const fields = bodyCardFieldsFor(card.source, inputs.constitution);
    lines.push("");
    lines.push(`### ${num} · ${card.name} · ${card.body}`);
    if (!fields) continue;
    lines.push("");
    lines.push(`*${fields.question}*`);
    lines.push("");
    lines.push(`*${fields.readLede}*`);
    lines.push("");
    lines.push(`**Strength** — ${fields.strength}`);
    lines.push("");
    lines.push(`**Growth Edge** — ${fields.growthEdge}`);
    lines.push("");
    lines.push(`**${fields.practiceLabel}** — ${fields.practice}`);
  }

  return lines.join("\n");
}

function composeWorkLoveGiving(inputs: ComposeFiftyDegreeInputs): string {
  const triptych = extractV3PathTriptych(inputs.guideMd);
  // CC-145 — the Drive distribution donut renders at the top of this
  // section when Path drive data is available. The Guide emits the
  // donut inside its Path · Gait card; the user-mode mask strips the
  // SVG block from the spliced guide markdown (see renderMirror.ts
  // user-mode donut strip ~L743-748), so the Individual must generate
  // it directly off `constitution` rather than inherit from `guideMd`.
  const drive = inputs.constitution.shape_outputs?.path.drive;
  if (!triptych && !drive) return "";

  const lines: string[] = [];
  lines.push("## Work, Love, and Giving");
  lines.push("");
  if (drive) {
    // CC-145 — `applyUserModeMask` in renderMirror.ts strips any SVG
    // whose aria-label matches "Drive distribution donut chart" (the
    // cached Path LLM rewrite copied the donut through; the mask was
    // added to suppress it). Re-label this fresh donut so the mask
    // pattern doesn't match — the Individual's donut survives the
    // mask and renders on the user surface as intended.
    const donutSvg = renderDriveDistributionDonut(
      drive.distribution,
      drive.claimed?.first
    ).replace(
      'aria-label="Drive distribution donut chart"',
      'aria-label="Drive distribution chart"'
    );
    lines.push(donutSvg);
    lines.push("");
    // CC-146 Part B — claimed-vs-revealed drive narrative. Mirrors the
    // Guide's emit in renderMirror.ts ~L1870-1890 (Distribution line +
    // Claimed line + case-aware prose). The donut is already above, so
    // labels alone interpolate here — no second chart, no inverted
    // tension footnote (the Open Tensions section already carries the
    // T-D1 paragraph for inverted cases).
    const d = drive.distribution;
    lines.push(
      `[Distribution: Building & wealth ${d.cost}%, People, Service & Society ${d.coverage}%, Risk and uncertainty ${d.compliance}%]`
    );
    if (drive.claimed) {
      const labels: Record<"cost" | "coverage" | "compliance", string> = {
        cost: "Building & wealth",
        coverage: "People, Service & Society",
        compliance: "Risk and uncertainty",
      };
      const c = drive.claimed;
      lines.push("");
      lines.push(
        `Claimed drive: 1. ${labels[c.first]} · 2. ${labels[c.second]} · 3. ${labels[c.third]}`
      );
    }
    lines.push("");
    lines.push(generateDriveProse(drive));
    lines.push("");
  }
  if (triptych) {
    for (const label of ["Work", "Love", "Give"] as const) {
      const block = extractPathBeat(triptych, label);
      if (!block) continue;
      const displayLabel = label === "Give" ? "Giving" : label;
      lines.push(`**${displayLabel}.** ${block}`);
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd();
}

// CC-145 — Disposition Signal Mix section. Compact mirror of the
// Guide's "## Disposition Signal Mix" placement: emits the heading,
// the plain-language summary line, and the bar chart SVG. Guarded for
// when `constitution.ocean?.dispositionSignalMix` is absent (silently
// omitted — sessions without OCEAN derivation skip this section).
function composeDispositionSignalMix(inputs: ComposeFiftyDegreeInputs): string {
  const mix = inputs.constitution.ocean?.dispositionSignalMix;
  if (!mix) return "";

  const lines: string[] = [];
  lines.push("## Disposition Signal Mix");
  lines.push("");
  lines.push(`*${composeDispositionSummaryLine(mix)}*`);
  lines.push("");
  lines.push(renderOceanDashboardSVG(mix));
  // CC-166 §D — 4-line shape-aware read under the chart. Pre-CC-166
  // this section was just heading + summary + chart, which read as a
  // bare diagnostic. `composeOceanProse` returns per-trait paragraphs
  // built from the same `mix` data; take the first ~4 to keep the
  // length discipline. Each paragraph is one trait's plain-language
  // interpretation — no engine vocabulary, shape-aware per user.
  const prose = composeOceanProse(mix, inputs.constitution.goalSoulGive);
  const readParas = prose.paragraphs.slice(0, 4);
  if (readParas.length > 0) {
    lines.push("");
    for (const para of readParas) {
      lines.push(para);
      lines.push("");
    }
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
  // CC-166 §F1 — strip any leading belief-blockquote from the warm
  // body before we emit our own. The pre-CC-166 logic detected an
  // echo by checking `body.startsWith("> ")` AND a 30-char belief
  // prefix overlap, then skipped our own emission — but the leftover
  // body still carried the quote, producing duplicate-render in the
  // Individual (the Guide doesn't show this because its render starts
  // the section a different way). Dedupe by always stripping any
  // leading `> ` block from the warm body whose text contains the
  // belief; we then unconditionally emit the canonical blockquote
  // once below. Trim FIRST so the leading-`^` anchor reaches the
  // `> ` even if the strips above left a leading newline.
  body = body.trim();
  // CC-166.1 — strip the belief-echo blockquote WHEREVER it appears in the
  // warm body (leading OR trailing). The pre-fix leading-only strip missed
  // shapes whose Guide keystone prose echoes the belief at the END, leaving
  // a duplicate quote under our canonical one (Daniel surfaced this). We
  // emit the canonical belief blockquote once below, so any `> …belief…`
  // line in the body is a removable echo.
  const beliefKey = belief.belief_text.trim().slice(0, 30);
  body = body
    .split(/\r?\n/)
    .filter((ln) => !(ln.trim().startsWith(">") && ln.includes(beliefKey)))
    .join("\n")
    .trim();

  const lines: string[] = [];
  lines.push("## Keystone Reflection");
  lines.push("");
  // Always emit the belief blockquote exactly once (the warm body has
  // been stripped of any leading echo above). Then the warm
  // explanation. No second orphaned quote.
  for (const ln of belief.belief_text.split(/\r?\n/)) {
    lines.push(`> ${ln}`);
  }
  lines.push("");
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
// Small helpers
// ─────────────────────────────────────────────────────────────────────

function bandLabel(score: number | null | undefined): string {
  if (score == null) return "Quiet — thin signal here.";
  if (score >= 70) return "Strong.";
  if (score >= 55) return "Present.";
  if (score >= 40) return "Mixed.";
  return "Quiet — the growth edge.";
}

function aimBandLabel(score: number | null | undefined): string {
  if (score == null) return "Quiet — thin signal here.";
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
