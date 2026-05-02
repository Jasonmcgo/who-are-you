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
  generateSimpleSummary,
  getFunctionPairRegister,
  getUserName,
  getTopCompassValues,
  getTopGravityAttribution,
  SHAPE_CARD_PATTERN_NOTE,
  SHAPE_CARD_PRACTICE_TEXT,
  valueListPhrase,
  type ShapeCardId,
} from "./identityEngine";
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

type RenderArgs = {
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
};

export function renderMirrorAsMarkdown(args: RenderArgs): string {
  const { constitution, demographics, includeBeliefAnchor } = args;
  const generatedAt = args.generatedAt ?? new Date();
  const out: string[] = [];

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
    demographics
  );
  const patternsByCard = new Map<ShapeCardId, string[]>();
  for (const { pattern, prose } of detectedPatterns) {
    const list = patternsByCard.get(pattern.applicable_card) ?? [];
    list.push(prose);
    patternsByCard.set(pattern.applicable_card, list);
  }
  function emitPatternBlock(cardId: ShapeCardId): void {
    const proses = patternsByCard.get(cardId);
    if (!proses || proses.length === 0) return;
    for (const prose of proses) {
      out.push("");
      out.push(`**Pattern observation** — ${prose}`);
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

  // 3. Top 3 Gifts
  if (constitution.mirror.topGifts.length > 0) {
    out.push("");
    out.push("## Your Top 3 Gifts");
    out.push("");
    constitution.mirror.topGifts.forEach((g, i) => {
      out.push(`${i + 1}. **${g.label}** — ${g.paragraph}`);
    });
  }

  const lensRegister = getFunctionPairRegister(constitution.lens_stack);
  if (
    constitution.mirror.topGifts.length > 0 &&
    lensRegister?.product_safe_sentence
  ) {
    out.push("");
    out.push(`*${lensRegister.product_safe_sentence}*`);
  }

  // 4. Top 3 Growth Edges (renamed from "Top 3 Traps" in CC-025)
  if (constitution.mirror.topTraps.length > 0) {
    out.push("");
    out.push("## Your Top 3 Growth Edges");
    out.push("");
    constitution.mirror.topTraps.forEach((t, i) => {
      out.push(`${i + 1}. **${t.label}** — ${t.paragraph}`);
    });
  }

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
  const belief = constitution.belief_under_tension;
  if (belief && belief.belief_text) {
    out.push("");
    out.push("## Keystone Reflection");
    out.push("");
    out.push("*the belief you named, where it sits in your shape.*");
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

  // 9a. A Synthesis — mirrors the on-page early placement in MirrorSection,
  // immediately after Keystone Reflection and before Disposition / Work / Love.
  const simpleSummary = generateSimpleSummary(constitution, demographics).trim();
  if (simpleSummary.length > 0) {
    out.push("");
    out.push("## A Synthesis");
    out.push("");
    out.push("*one cross-card read, with the parallel-line close.*");
    out.push("");
    out.push(simpleSummary);
  }

  // 10. Disposition Map (OCEAN). Silently omits for pre-CC-037 / thin-signal
  // sessions where the engine didn't produce an ocean output.
  if (constitution.ocean) {
    const d = constitution.ocean.distribution;
    out.push("");
    out.push("## Disposition Map");
    out.push("");
    out.push(
      "*Disposition tendencies, derived from how you answered other questions in this instrument. No single answer determines a tendency; the model reads patterns across the full question footprint.*"
    );
    out.push("");
    out.push(
      `[Distribution: Openness ${d.O}%, Conscientiousness ${d.C}%, Extraversion ${d.E}%, Agreeableness ${d.A}%, Emotional Reactivity (estimated) ${d.N}%]`
    );
    out.push("");
    out.push(constitution.ocean.prose);
    out.push("");
    out.push(
      "*Emotional Reactivity is shown as an estimate — the instrument measures it through proxy signals (formation history, current-context load, pressure-adaptation behavior) rather than directly.*"
    );
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
    const patternNoteText =
      card.patternNote?.text ?? SHAPE_CARD_PATTERN_NOTE[id];
    if (patternNoteText) {
      out.push("");
      out.push(`*${patternNoteText}*`);
    }
    if (id === "compass" && card.peace_register_prose) {
      out.push("");
      out.push(card.peace_register_prose);
    }
    if (id === "compass" && card.faith_register_prose) {
      out.push("");
      out.push(card.faith_register_prose);
    }
    emitPatternBlock(id);
  }

  // Conviction — Strength / Growth Edge / Posture / Pattern Note (no Practice
  // cell; Posture stands in that slot per CC-025 spec).
  const conv = shape.conviction;
  out.push("");
  out.push(`### ${conv.cardName} — ${conv.bodyPart}`);
  out.push("");
  out.push(`*${conv.cardHeader}*`);
  out.push("");
  out.push(`**Strength** — ${conv.gift.text}`);
  out.push("");
  out.push(`**Growth Edge** — ${conv.blindSpot.text}`);
  out.push("");
  out.push(`**Posture** — ${conv.posture}`);
  const convPatternNote =
    conv.patternNote ?? SHAPE_CARD_PATTERN_NOTE.conviction;
  out.push("");
  out.push(`*${convPatternNote}*`);
  emitPatternBlock("conviction");

  // 14. Path — Gait. Work / Love / Give / Practice (was "Growth move" pre-CC-025).
  const path = shape.path;
  out.push("");
  out.push("## Path — Gait");
  out.push("");
  out.push("*how this shape moves through work, love, and giving.*");
  out.push("");
  out.push(path.directionalParagraph);

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
  const pathPatternNote =
    path.patternNote ?? SHAPE_CARD_PATTERN_NOTE.path;
  out.push("");
  out.push(`*${pathPatternNote}*`);
  emitPatternBlock("path");

  // 15-17. Cross-card synthesis.
  const cross = constitution.cross_card;
  out.push("");
  out.push("## Growth Path");
  out.push("");
  out.push(cross.growthPath);

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

  // 20. Footer.
  out.push("");
  out.push("---");
  out.push("");
  out.push(
    `*Generated ${formatDateTime(generatedAt)}. The model proposes — you confirm.*`
  );

  return out.join("\n") + "\n";
}
