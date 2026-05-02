// CC-057b — Contract extraction. Reads an `InnerConstitution` (the engine's
// output) and produces an `EngineRenderedReport` — a flattened typed view
// the polish layer can JSON-serialize to the LLM and validate after.
//
// The four extract-* helpers feed validatePolish: they pull the substance
// fields the polish layer must preserve verbatim. If validation finds any
// drift between engine-extracted and polished-extracted snapshots, the
// validation pass fails and the polish layer falls back to the engine
// baseline.

import type {
  FullSwotOutput,
  InnerConstitution,
  TopGiftEntry,
} from "../types";
import type {
  DerivationClaim,
  EngineNumberedFacts,
  EngineRenderedReport,
  PolishedReport,
  SignalSummary,
} from "./types";

// The Sentence 2 anchor prefixes locked at CC-052/CC-052b (gift) and
// CC-061's live blind-spot half. The polish layer must preserve any
// anchor sentence intact when it appears in card prose.
export const SENTENCE_2_ANCHOR_PREFIX = "For your shape, this expresses as ";
export const BLIND_SPOT_ANCHOR_PREFIX =
  "For your shape, this blind spot expresses as ";

// All recognized Sentence 2 anchor prefixes. Order matters: the longer
// blind-spot prefix must precede the shorter "this expresses as " so the
// matcher binds blind-spot anchors to their correct prefix instead of
// misreading them as gift anchors.
const SENTENCE_2_ANCHOR_PREFIXES = [
  BLIND_SPOT_ANCHOR_PREFIX,
  SENTENCE_2_ANCHOR_PREFIX,
] as const;

function extractByPrefixMatches(
  text: string,
  prefix: string
): Array<{ idx: number; candidate: string }> {
  const out: Array<{ idx: number; candidate: string }> = [];
  let cursor = 0;
  while (true) {
    const idx = text.indexOf(prefix, cursor);
    if (idx === -1) break;
    const periodIdx = text.indexOf(".", idx);
    if (periodIdx === -1) break;
    out.push({ idx, candidate: text.substring(idx, periodIdx + 1) });
    cursor = periodIdx + 1;
  }
  return out;
}

function extractByPrefix(text: string, prefix: string): string[] {
  return extractByPrefixMatches(text, prefix).map((m) => m.candidate);
}

// Extract every Sentence 2 anchor sentence embedded in a piece of card
// prose. Returns substrings starting at any locked prefix and running to
// the next period (inclusive). Multiple matches per text are collected.
export function extractSentence2AnchorsFromText(text: string): string[] {
  const out: string[] = [];
  // Walk every prefix; each find independently advances its own cursor so
  // overlapping prefixes (e.g. "this expresses as " inside a longer
  // "this growth edge expresses as ") would each fire — but the longer-
  // first ordering above ensures the shorter prefix only binds to actual
  // gift anchors.
  for (const prefix of SENTENCE_2_ANCHOR_PREFIXES) {
    for (const { idx, candidate } of extractByPrefixMatches(text, prefix)) {
      // Skip if this candidate is actually a substring of a longer prefix
      // (i.e. the "this expresses as ..." prefix matched inside a "this
      // blind spot expresses as ..." anchor). Detect by checking the
      // character preceding `idx`: longer-prefix anchors have a non-
      // sentence-start character there (e.g. "spot ") instead of "this ".
      if (prefix === SENTENCE_2_ANCHOR_PREFIX) {
        const before = text.substring(Math.max(0, idx - 17), idx);
        if (before.endsWith("blind spot ")) {
          continue;
        }
      }
      out.push(candidate);
    }
  }
  return out;
}

export function extractBlindSpotAnchorsFromText(text: string): string[] {
  return extractByPrefix(text, BLIND_SPOT_ANCHOR_PREFIX);
}

// ── Anchor extraction ──────────────────────────────────────────────────

export function extractAnchors(report: EngineRenderedReport): string[] {
  return report.lockedAnchors.slice();
}

// ── Derivation extraction ──────────────────────────────────────────────

export function extractDerivations(
  report: EngineRenderedReport
): DerivationClaim[] {
  return report.derivations.slice();
}

// ── Structural assertion extraction ────────────────────────────────────
//
// Structural assertions are a subset of derivations focused on the
// architecture-level claims the polish layer must not soften: driver
// function, aux-pair, gift-category routing per card, top-line registers.

export function extractStructuralAssertions(
  report: EngineRenderedReport
): DerivationClaim[] {
  return report.derivations.filter(
    (d) =>
      d.startsWith("driver_function:") ||
      d.startsWith("auxiliary_function:") ||
      d.startsWith("aux_pair:") ||
      d.startsWith("gift_category:") ||
      d.startsWith("work_register:") ||
      d.startsWith("love_register:") ||
      d.startsWith("love_flavor:") ||
      d.startsWith("drive_case:") ||
      d.startsWith("ocean_case:")
  );
}

// ── Numbered-fact extraction ───────────────────────────────────────────

export function extractNumberedFacts(
  report: EngineRenderedReport
): EngineNumberedFacts {
  return {
    topGiftsOrder: report.numberedFacts.topGiftsOrder.slice(),
    compassTop5: report.numberedFacts.compassTop5.slice(),
    drivePercentages: { ...report.numberedFacts.drivePercentages },
    oceanBucketLabels: report.numberedFacts.oceanBucketLabels.slice(),
  };
}

// ── Engine → EngineRenderedReport conversion ──────────────────────────
//
// Walks the InnerConstitution, pulls out the substance fields, captures
// licensed prose slots, and assembles the polish-layer input. The
// `signalSummary` is supplied by the caller (typically derived alongside
// the InnerConstitution from the same `signals` / `lensStack` / `agency`
// /`weather` / `fire` context).

export function buildEngineRenderedReport(
  constitution: InnerConstitution,
  signalSummary: SignalSummary
): EngineRenderedReport {
  const so = constitution.shape_outputs;

  // ── Derivation claims ──
  const derivations: DerivationClaim[] = [];
  derivations.push(`driver_function:${constitution.lens_stack.dominant}`);
  derivations.push(`auxiliary_function:${constitution.lens_stack.auxiliary}`);
  if (signalSummary.auxPairKey) {
    derivations.push(`aux_pair:${signalSummary.auxPairKey}`);
  }
  for (const card of [
    "lens",
    "compass",
    "conviction",
    "gravity",
    "trust",
    "weather",
    "fire",
  ] as const) {
    const cardOutput = so[card] as FullSwotOutput;
    if (cardOutput?.gift?.category) {
      derivations.push(`gift_category:${card}:${cardOutput.gift.category}`);
    }
  }
  if (constitution.workMap && constitution.workMap.matches.length > 0) {
    derivations.push(
      `work_register:${constitution.workMap.matches[0].register.register_key}`
    );
  }
  if (constitution.loveMap && constitution.loveMap.matches.length > 0) {
    derivations.push(
      `love_register:${constitution.loveMap.matches[0].register.register_key}`
    );
    if (constitution.loveMap.flavors.length > 0) {
      derivations.push(
        `love_flavor:${constitution.loveMap.flavors[0].flavor.flavor_key}`
      );
    }
  }
  if (so.path?.drive) {
    derivations.push(`drive_case:${so.path.drive.case}`);
  }
  if (constitution.ocean) {
    derivations.push(`ocean_case:${constitution.ocean.case}`);
  }
  for (const t of constitution.tensions) {
    derivations.push(`tension_fired:${t.tension_id}`);
  }
  derivations.push(
    `compass_top_5:${signalSummary.compassTopFive.slice(0, 5).join(",")}`
  );

  // ── Numbered facts ──
  const numberedFacts: EngineNumberedFacts = {
    topGiftsOrder: constitution.cross_card.topGifts.map(
      (g: TopGiftEntry) => g.label
    ),
    compassTop5: signalSummary.compassTopFive.slice(0, 5),
    drivePercentages: so.path?.drive
      ? {
          cost: so.path.drive.distribution.cost,
          coverage: so.path.drive.distribution.coverage,
          compliance: so.path.drive.distribution.compliance,
        }
      : { cost: 0, coverage: 0, compliance: 0 },
    oceanBucketLabels: ["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Emotional Reactivity"],
  };

  // ── Locked anchors ──
  // Sentence 2 anchors live embedded in card giftText (post-CC-052) and in
  // card blindSpotText (post-CC-061's live blind-spot half). Pull them out
  // so the validator can verify they survive a polish round-trip.
  const lockedAnchors: string[] = [];
  for (const cardKey of [
    "lens",
    "compass",
    "conviction",
    "gravity",
    "trust",
    "weather",
    "fire",
  ] as const) {
    const cardOutput = so[cardKey] as FullSwotOutput;
    if (cardOutput?.gift?.text) {
      lockedAnchors.push(...extractSentence2AnchorsFromText(cardOutput.gift.text));
    }
    if (cardOutput?.blindSpot?.text) {
      lockedAnchors.push(
        ...extractBlindSpotAnchorsFromText(cardOutput.blindSpot.text)
      );
    }
  }
  // Top-3 Gifts paragraphs include capitalized Sentence 2 anchors per
  // CC-052's synthesizeTopGifts wiring. Capture those too.
  for (const g of constitution.cross_card.topGifts) {
    lockedAnchors.push(...extractSentence2AnchorsFromText(g.paragraph));
  }

  // CC-058 — Mirror layer uncomfortable-but-true sentence (CC-048 Rule 5).
  // Joins the locked-anchors array so the polish layer cannot edit it.
  // The validation pass catches any drift via the same matcher used for
  // Sentence 2 anchors and Peace/Faith disambiguation prose.
  if (
    constitution.mirror.uncomfortableButTrue &&
    constitution.mirror.uncomfortableButTrue.length > 0
  ) {
    lockedAnchors.push(constitution.mirror.uncomfortableButTrue);
  }
  for (const t of constitution.tensions) {
    if (t.user_prompt && t.user_prompt.trim().length > 0) {
      lockedAnchors.push(t.user_prompt);
    }
  }
  if (constitution.cross_card.mirrorTypesSeed) {
    lockedAnchors.push(constitution.cross_card.mirrorTypesSeed);
  }

  // ── Locked disambiguation (Peace + Faith from CC-054) ──
  const lockedDisambiguation: string[] = [];
  if (so.compass?.peace_register_prose) {
    lockedDisambiguation.push(so.compass.peace_register_prose);
  }
  if (so.compass?.faith_register_prose) {
    lockedDisambiguation.push(so.compass.faith_register_prose);
  }

  // ── Section headings (canonical engine spine) ──
  const sectionHeadings: string[] = [
    "Mirror",
    "Disposition Map",
    "Work Map",
    "Love Map",
    "Map",
    "Open Tensions",
    "Path",
    "What this is good for",
  ];

  // ── Prose slots — texture surfaces the polish layer can edit ──
  const proseSlots: Record<string, string> = {};
  proseSlots["mirror.shape_in_one_sentence"] =
    constitution.mirror.shapeInOneSentence ?? "";
  proseSlots["mirror.core_pattern"] = constitution.mirror.corePattern ?? "";
  proseSlots["mirror.what_others_may_experience"] =
    constitution.mirror.whatOthersMayExperience ?? "";
  proseSlots["mirror.when_load_heavy"] =
    constitution.mirror.whenTheLoadGetsHeavy ?? "";
  for (let i = 0; i < constitution.mirror.topGifts.length; i++) {
    proseSlots[`mirror.top_gifts[${i}].paragraph`] =
      constitution.mirror.topGifts[i].paragraph;
  }
  for (let i = 0; i < constitution.mirror.topTraps.length; i++) {
    proseSlots[`mirror.top_traps[${i}].paragraph`] =
      constitution.mirror.topTraps[i].paragraph;
  }
  for (let i = 0; i < constitution.mirror.yourNext3Moves.length; i++) {
    proseSlots[`mirror.next_moves[${i}].paragraph`] =
      constitution.mirror.yourNext3Moves[i].paragraph;
  }
  for (const cardKey of [
    "lens",
    "compass",
    "conviction",
    "gravity",
    "trust",
    "weather",
    "fire",
  ] as const) {
    const cardOutput = so[cardKey] as FullSwotOutput;
    if (cardOutput) {
      proseSlots[`card.${cardKey}.gift`] = cardOutput.gift?.text ?? "";
      proseSlots[`card.${cardKey}.blind_spot`] = cardOutput.blindSpot?.text ?? "";
      proseSlots[`card.${cardKey}.risk_under_pressure`] =
        cardOutput.riskUnderPressure?.text ?? "";
      // CC-065 Item 3 — cardHeader joins proseSlots so polish-layer
      // validation catches any drift on the locked Trust + Gravity
      // cardHeader strings (CC-063) and any other card's header.
      // Empty headers (thin-signal cards) are skipped — substring-match
      // validation can't anchor on an empty needle.
      if (cardOutput.cardHeader && cardOutput.cardHeader.length > 0) {
        proseSlots[`card.${cardKey}.card_header`] = cardOutput.cardHeader;
      }
    }
  }
  if (so.path?.directionalParagraph) {
    proseSlots["path.directional_paragraph"] = so.path.directionalParagraph;
  }
  if (so.path?.work) proseSlots["path.work"] = so.path.work;
  if (so.path?.love) proseSlots["path.love"] = so.path.love;
  if (so.path?.give) proseSlots["path.give"] = so.path.give;
  if (constitution.cross_card.growthPath) {
    proseSlots["cross_card.growth_path"] = constitution.cross_card.growthPath;
  }
  if (constitution.cross_card.relationshipTranslation) {
    proseSlots["cross_card.relationship_translation"] =
      constitution.cross_card.relationshipTranslation;
  }
  if (constitution.cross_card.conflictTranslation) {
    proseSlots["cross_card.conflict_translation"] =
      constitution.cross_card.conflictTranslation;
  }

  return {
    derivations,
    numberedFacts,
    lockedAnchors,
    lockedDisambiguation,
    sectionHeadings,
    proseSlots,
    signalSummary,
  };
}

// ── Type guard / validation helpers used by validatePolish ─────────────

export function reportsHaveSameDerivations(
  a: EngineRenderedReport,
  b: PolishedReport
): { ok: true } | { ok: false; reason: string } {
  const aSet = new Set(a.derivations);
  const bSet = new Set(b.derivations);
  if (aSet.size !== bSet.size) {
    return {
      ok: false,
      reason: `Derivation count drift: engine=${aSet.size} polished=${bSet.size}`,
    };
  }
  for (const claim of aSet) {
    if (!bSet.has(claim)) {
      return {
        ok: false,
        reason: `Engine derivation missing from polished: "${claim}"`,
      };
    }
  }
  return { ok: true };
}

export function reportsHaveSameNumberedFacts(
  a: EngineRenderedReport,
  b: PolishedReport
): { ok: true } | { ok: false; reason: string } {
  if (
    JSON.stringify(a.numberedFacts.topGiftsOrder) !==
    JSON.stringify(b.numberedFacts.topGiftsOrder)
  ) {
    return { ok: false, reason: "Top-3 gifts order drift" };
  }
  if (
    JSON.stringify(a.numberedFacts.compassTop5) !==
    JSON.stringify(b.numberedFacts.compassTop5)
  ) {
    return { ok: false, reason: "Compass top-5 order drift" };
  }
  const ad = a.numberedFacts.drivePercentages;
  const bd = b.numberedFacts.drivePercentages;
  if (ad.cost !== bd.cost || ad.coverage !== bd.coverage || ad.compliance !== bd.compliance) {
    return { ok: false, reason: "Drive percentage drift" };
  }
  if (
    JSON.stringify(a.numberedFacts.oceanBucketLabels) !==
    JSON.stringify(b.numberedFacts.oceanBucketLabels)
  ) {
    return { ok: false, reason: "OCEAN bucket label drift" };
  }
  return { ok: true };
}

export function reportsHaveSameAnchors(
  a: EngineRenderedReport,
  b: PolishedReport
): { ok: true } | { ok: false; reason: string } {
  // Each engine anchor must appear verbatim somewhere in the polished
  // report — either inside a proseSlot or in the lockedAnchors array.
  const haystack =
    Object.values(b.proseSlots).join("\n") + "\n" + b.lockedAnchors.join("\n");
  for (const anchor of a.lockedAnchors) {
    if (!haystack.includes(anchor)) {
      return {
        ok: false,
        reason: `Locked Sentence-2 anchor missing or modified: "${anchor.slice(0, 80)}…"`,
      };
    }
  }
  return { ok: true };
}

export function reportsHaveSameDisambiguation(
  a: EngineRenderedReport,
  b: PolishedReport
): { ok: true } | { ok: false; reason: string } {
  const haystack =
    Object.values(b.proseSlots).join("\n") +
    "\n" +
    b.lockedDisambiguation.join("\n");
  for (const block of a.lockedDisambiguation) {
    if (!haystack.includes(block)) {
      return {
        ok: false,
        reason: `Peace/Faith disambiguation block missing or modified (first 80 chars): "${block.slice(0, 80)}…"`,
      };
    }
  }
  return { ok: true };
}
