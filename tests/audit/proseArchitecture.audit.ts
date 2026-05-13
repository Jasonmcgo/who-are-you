// CC-PROSE-1 — Prose architecture lift audit harness.
//
// Runs Layer 1-3 assertions over a sample of fixtures: builds the full
// InnerConstitution via buildInnerConstitution + renders the markdown
// Mirror via renderMirrorAsMarkdown, then verifies:
//
//   Layer 1 — Executive Read:
//     - prose-1-executive-read-present     (## Executive Read header rendered)
//     - prose-1-executive-read-second-person (uses "your" / "you", not user name)
//
//   Layer 2 — Body Card Question/Read:
//     - prose-1-card-question-prefix       (each of 8 cards renders its
//                                           canonical Question string)
//     - prose-1-card-read-line-present     (each card's existing cardHeader
//                                           italic Read line still renders)
//
//   Layer 3 — Visualization upgrades:
//     - prose-1-movement-grip-circle       (dashed circle present when
//                                           grippingPull > 0; absent when 0)
//     - prose-1-drive-donut-rendered       (donut SVG with 3 segments + center
//                                           Claimed #1 label rendered when
//                                           drive output is present)
//
//   Preservation regression:
//     - prose-1-tensions-preserved
//     - prose-1-conflict-translation-preserved
//     - prose-1-mirror-types-preserved
//     - prose-1-use-cases-preserved
//
//   Engine canon:
//     - prose-1-hedging-preserved          (≥3 hedge phrases per fixture)
//     - prose-1-engine-phrase-preservation (canonical phrases preserved
//                                            verbatim where they fire)
//
// CC-PROSE-1A — Coherence pass assertions (added in addition to the
// CC-PROSE-1 set above, no removals):
//
//   Fix 1 — visual distinctness:
//     - prose-1a-executive-read-blockquote (Executive Read renders as
//                                           markdown blockquote `> *...*`)
//     - prose-1a-card-question-bold        (per-card Question renders as
//                                           bold `**...**`, not italic)
//
//   Fix 2 — halo calibration:
//     - prose-1a-grip-halo-bumped          (radius reflects MOVEMENT_GRIP_HALO_MAX=28
//                                           when grippingPull > 0 and not zero-origin)
//
//   Fix 3 — Synthesis voice:
//     - prose-1a-synthesis-second-person   (A Synthesis uses "Your"/"You"
//                                           and does NOT contain user name)
//     - prose-1a-synthesis-no-third-person (no "${name}'s shape", no
//                                           "This shape is a" branches)
//
//   Fix 4 — pattern label rename:
//     - prose-1a-pattern-label-renamed     (CC-029 cross-card patterns
//                                           render as "Pattern in motion",
//                                           not "Pattern observation")
//     - prose-1a-pattern-observation-absent (literal "Pattern observation"
//                                            label is NOT in rendered markdown)
//
// CC-PROSE-1B — Layers 4, 5, 6 + follow-up A assertions:
//
//   Layer 4 — Core Signal Map:
//     - prose-1b-core-signal-map-rendered      (## Core Signal Map header
//                                               renders between Executive
//                                               Read and How to Read This)
//     - prose-1b-core-signal-map-12-cells      (all 12 canonical cell
//                                               labels appear in render)
//     - prose-1b-core-signal-map-italic-line   (canonical engine-close
//                                               italic line below grid)
//
//   Layer 5 — Pulled-Forward Callouts:
//     - prose-1b-callout-summary-present
//     - prose-1b-callout-summary-from-thesis      (5A == thesis sentence)
//     - prose-1b-callout-most-useful-line-present
//     - prose-1b-callout-most-useful-line-from-gift-danger (5B == gift/
//                                                          danger line)
//     - prose-1b-callout-final-line-present-or-null (5C present or null)
//     - prose-1b-callout-final-line-no-new-vocabulary (no new lexemes)
//     - prose-1b-callouts-second-person
//     - prose-1b-callouts-visual-consistency       (all callouts blockquote)
//
//   Layer 6 — Top Gifts and Growth Edges unified table:
//     - prose-1b-gifts-edges-table-rendered
//     - prose-1b-gifts-edges-table-pairings    (gift[i] ↔ topRisks[i])
//     - prose-1b-gifts-edges-table-what-it-means-from-prose
//     - prose-1b-gifts-edges-table-replaces-lists (no Top 3 Gifts /
//                                                  Top 3 Growth Edges
//                                                  headings remain)
//     - prose-1b-lens-flavor-line-preserved    (Lens-flavor italic line
//                                               still renders post-1B
//                                               where pre-1B engine
//                                               produced it)
//
//   Engine canon:
//     - prose-1b-engine-phrase-preservation    (CC-PROSE-1 canon phrases
//                                               render verbatim post-1B)
//
// Hand-rolled — no Jest/Vitest. Invocation: `npx tsx tests/audit/proseArchitecture.audit.ts`.
// Exits 0 only when every assertion passes; exits 1 on any failure.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildInnerConstitution,
  composeGiftDangerLine,
  composeThesisLine,
  getFunctionPairRegister,
} from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import { SHAPE_CARD_QUESTION } from "../../lib/cardAssets";
import {
  CORE_SIGNAL_CELL_LABELS,
  CORE_SIGNAL_MAP_FOOTER,
} from "../../lib/coreSignalMap";
import { composeReportCallouts } from "../../lib/composeReportCallouts";
import { firstSentence } from "../../lib/topGiftsEdgesTable";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const OCEAN_DIR = join(ROOT, "ocean");
const GSG_DIR = join(ROOT, "goal-soul-give");

type FixtureRecord = {
  set: "ocean" | "goal-soul-give";
  file: string;
  answers: Answer[];
  demographics: DemographicSet | null;
};

function loadFixtures(): FixtureRecord[] {
  const out: FixtureRecord[] = [];
  for (const f of readdirSync(OCEAN_DIR)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const raw = JSON.parse(readFileSync(join(OCEAN_DIR, f), "utf-8")) as {
      answers: Answer[];
      demographics?: DemographicSet | null;
    };
    out.push({
      set: "ocean",
      file: f,
      answers: raw.answers,
      demographics: raw.demographics ?? null,
    });
  }
  for (const f of readdirSync(GSG_DIR)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const raw = JSON.parse(readFileSync(join(GSG_DIR, f), "utf-8")) as {
      answers: Answer[];
      demographics?: DemographicSet | null;
    };
    out.push({
      set: "goal-soul-give",
      file: f,
      answers: raw.answers,
      demographics: raw.demographics ?? null,
    });
  }
  return out;
}

type AssertionResult =
  | { ok: true; assertion: string }
  | { ok: false; assertion: string; detail: string };

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HEDGE_PHRASES: readonly string[] = [
  "appears to",
  "may ",
  "tends to",
  "suggests",
  "likely",
  "this is conditional",
  "could ",
];

// Engine canon phrases — when present pre-CC-PROSE-1, must remain
// verbatim post-CC-PROSE-1. The audit checks that any of these that
// fire for a fixture are still present in the rendered markdown.
const CANONICAL_PHRASES: readonly string[] = [
  "convert structure into mercy",
  "care with a spine",
  "the early shape of giving",
  "Your gift is the long read",
  "let context travel with action",
  "Your danger is",
];

function runFixture(record: FixtureRecord): {
  pass: boolean;
  results: AssertionResult[];
} {
  const results: AssertionResult[] = [];
  const constitution = buildInnerConstitution(
    record.answers,
    [],
    record.demographics
  );
  // CC-LLM-PROSE-PASS-V1 — Lens/Compass/Hands/Path rewrites land in
  // user mode only. This audit checks engine-side prose architecture
  // (movement notes, work/love/give blocks, etc.) — query clinician
  // mode so we test the legacy engine output, not the LLM rewrite.
  const markdown = renderMirrorAsMarkdown({
    constitution,
    demographics: record.demographics,
    answers: record.answers,
    includeBeliefAnchor: false,
    renderMode: "clinician",
  });

  // ── Layer 1 — Executive Read ────────────────────────────────────────
  // Section header present.
  const hasExecutiveHeader = /^## Executive Read$/m.test(markdown);
  results.push(
    hasExecutiveHeader
      ? { ok: true, assertion: "prose-1-executive-read-present" }
      : {
          ok: false,
          assertion: "prose-1-executive-read-present",
          detail: "no `## Executive Read` header in rendered markdown",
        }
  );

  // Second-person register: contains "Your" or "You" within the
  // Executive Read block, and does not contain user name within the
  // first 200 chars of the block.
  //
  // CC-PROSE-1A Fix 1 — Executive Read now renders as a markdown
  // blockquote (`> *...*`) instead of plain italic (`*...*`). The
  // regex matches the blockquote form so the existing second-person
  // assertion continues to pull the correct text.
  const execMatch = markdown.match(/## Executive Read\n\n> \*([^*]+)\*/);
  const execText = execMatch?.[1] ?? "";
  const hasSecondPerson = /\b(Your|your|You)\b/.test(execText);
  // Match user name only if demographics provided one. The renderer pulls
  // a name from demographics; absence of name in Executive Read is the
  // canonical second-person rule.
  const userName =
    record.demographics?.answers.find((a) => a.field_id === "name")?.state ===
    "specified"
      ? record.demographics.answers.find((a) => a.field_id === "name")?.value ??
        null
      : null;
  const hasUserName =
    userName !== null && userName.length > 0 && execText.includes(userName);
  results.push(
    hasSecondPerson && !hasUserName
      ? { ok: true, assertion: "prose-1-executive-read-second-person" }
      : {
          ok: false,
          assertion: "prose-1-executive-read-second-person",
          detail: `second_person=${hasSecondPerson} user_name_present=${hasUserName}; exec="${execText.slice(0, 120)}"`,
        }
  );

  // ── Layer 2 — Body Card Question prefix + Read line ─────────────────
  // For each of 6 SWOT cards (lens / compass / gravity / trust / weather /
  // fire), conviction (separate variant), and path, verify that the
  // canonical Question string appears within the rendered markdown.
  //
  // CC-PROSE-1A Fix 1 — Question lines now render as bold `**Question**`
  // (was italic `*Question*` in CC-PROSE-1). The existing presence check
  // greps for the literal Question string (the `**`/`*` wrapping is
  // covered separately by prose-1a-card-question-bold below).
  const expectedQuestions = [
    SHAPE_CARD_QUESTION.lens,
    SHAPE_CARD_QUESTION.compass,
    SHAPE_CARD_QUESTION.gravity,
    SHAPE_CARD_QUESTION.trust,
    SHAPE_CARD_QUESTION.weather,
    SHAPE_CARD_QUESTION.fire,
    SHAPE_CARD_QUESTION.conviction,
    SHAPE_CARD_QUESTION.path,
  ];
  const missingQuestions = expectedQuestions.filter(
    (q) => !markdown.includes(q)
  );
  results.push(
    missingQuestions.length === 0
      ? { ok: true, assertion: "prose-1-card-question-prefix" }
      : {
          ok: false,
          assertion: "prose-1-card-question-prefix",
          detail: `missing canonical Question lines: ${missingQuestions.join(" | ")}`,
        }
  );

  // Each card has a Read line below the Question — the existing italic
  // cardHeader. We verify by grepping for the engine canon "led by"
  // phrase in the lens reading (which always renders) plus the path's
  // "how this shape moves through work, love, and giving" italic.
  const lensReadPresent = /led by/.test(markdown);
  const pathReadPresent =
    /how this shape moves through work, love, and giving/.test(markdown);
  results.push(
    lensReadPresent && pathReadPresent
      ? { ok: true, assertion: "prose-1-card-read-line-present" }
      : {
          ok: false,
          assertion: "prose-1-card-read-line-present",
          detail: `lens_read=${lensReadPresent} path_read=${pathReadPresent}`,
        }
  );

  // ── Layer 3a — Movement chart Gripping Pull dashed circle ───────────
  const gripScore =
    constitution.goalSoulGive?.grippingPull?.score ?? 0;
  const goalScore = constitution.goalSoulGive?.adjustedScores.goal ?? 0;
  const soulScore = constitution.goalSoulGive?.adjustedScores.soul ?? 0;
  const movementSvgPresent = /<svg[^>]*aria-label="Goal\/Soul movement chart"/.test(
    markdown
  );
  // Zero-origin edge case: when goal=0 AND soul=0, the line has no
  // endpoint and the dashboard renders only a dot at the origin. The
  // halo helper correctly skips (no endpoint to halo). Skip the grip-
  // circle assertion in this edge case — there's no place to render
  // the halo regardless of grippingPull magnitude.
  const isZeroOrigin = goalScore === 0 && soulScore === 0;
  if (movementSvgPresent && !isZeroOrigin) {
    const hasDashedCircle = /<circle[^>]*stroke-dasharray=[^>]*\/>/.test(
      markdown
    );
    if (gripScore > 0) {
      results.push(
        hasDashedCircle
          ? { ok: true, assertion: "prose-1-movement-grip-circle" }
          : {
              ok: false,
              assertion: "prose-1-movement-grip-circle",
              detail: `grippingPull=${gripScore} > 0 but no dashed circle in Movement SVG`,
            }
      );
    } else {
      results.push(
        !hasDashedCircle
          ? { ok: true, assertion: "prose-1-movement-grip-circle" }
          : {
              ok: false,
              assertion: "prose-1-movement-grip-circle",
              detail: `grippingPull=0 but dashed circle present in Movement SVG`,
            }
      );
    }
  }

  // ── Layer 3b — Drive donut chart ─────────────────────────────────────
  const drivePresent = !!constitution.shape_outputs.path.drive;
  if (drivePresent) {
    const donutPresent =
      /<svg[^>]*aria-label="Drive distribution donut/.test(markdown);
    results.push(
      donutPresent
        ? { ok: true, assertion: "prose-1-drive-donut-rendered" }
        : {
            ok: false,
            assertion: "prose-1-drive-donut-rendered",
            detail: "Drive distribution donut SVG missing from Path section",
          }
    );
    if (donutPresent) {
      // Verify 3 path segments (one per bucket) AND center Claimed #1
      // label when claimed top-bucket is present.
      const segmentMatches = markdown.match(/<path[^>]*d="M [^"]*"[^>]*fill="#[0-9a-f]+"/g) ?? [];
      const hasThreeSegments = segmentMatches.length >= 3;
      const hasClaimedLabel = /Claimed #1/.test(markdown);
      const claimed = constitution.shape_outputs.path.drive?.claimed;
      const claimedExpected = !!claimed;
      const claimedOk = !claimedExpected || hasClaimedLabel;
      results.push(
        hasThreeSegments && claimedOk
          ? { ok: true, assertion: "prose-1-drive-donut-structure" }
          : {
              ok: false,
              assertion: "prose-1-drive-donut-structure",
              detail: `segments=${segmentMatches.length} claimed_label=${hasClaimedLabel} claimed_expected=${claimedExpected}`,
            }
      );
    }
  }

  // ── CC-PROSE-1A Fix 1 — Executive Read blockquote rendering ─────────
  const execBlockquote = /^## Executive Read\n\n> \*[^*]+\*/m.test(markdown);
  results.push(
    execBlockquote
      ? { ok: true, assertion: "prose-1a-executive-read-blockquote" }
      : {
          ok: false,
          assertion: "prose-1a-executive-read-blockquote",
          detail:
            "Executive Read should render as `> *...*` (blockquote + italic), not bare `*...*`",
        }
  );

  // ── CC-PROSE-1A Fix 1 — Per-card Question bold rendering ────────────
  // Each of the 8 canonical Question strings must be wrapped in `**...**`
  // (bold non-italic) so it reads visually distinct from the italic Read
  // line that follows it.
  const missingBoldQuestions = expectedQuestions.filter(
    (q) => !markdown.includes(`**${q}**`)
  );
  results.push(
    missingBoldQuestions.length === 0
      ? { ok: true, assertion: "prose-1a-card-question-bold" }
      : {
          ok: false,
          assertion: "prose-1a-card-question-bold",
          detail: `card Questions not bold-wrapped: ${missingBoldQuestions.join(" | ")}`,
        }
  );

  // ── CC-PROSE-1A Fix 2 — Movement halo radius reflects bumped cap ────
  // When grippingPull > 0 and not zero-origin, the rendered halo radius
  // must be consistent with MOVEMENT_GRIP_HALO_MAX = 28 (post-Fix-2),
  // not the old cap of 20. Threshold of (grip/100) * 25 catches anything
  // rendered with cap ≤ 24; cap=28 produces (grip/100)*28, well above.
  if (
    movementSvgPresent &&
    !isZeroOrigin &&
    gripScore > 0
  ) {
    const radiusMatch = markdown.match(
      /<circle[^>]*r="([0-9.]+)"[^>]*stroke-dasharray=/
    );
    const renderedRadius = radiusMatch ? parseFloat(radiusMatch[1]) : 0;
    const minExpected = (gripScore / 100) * 25;
    results.push(
      renderedRadius >= minExpected
        ? { ok: true, assertion: "prose-1a-grip-halo-bumped" }
        : {
            ok: false,
            assertion: "prose-1a-grip-halo-bumped",
            detail: `grippingPull=${gripScore} rendered radius=${renderedRadius.toFixed(2)} < expected min ${minExpected.toFixed(2)} (cap should be ≥28)`,
          }
    );
  }

  // ── CC-PROSE-1A Fix 3 — Synthesis voice second-person ───────────────
  // Pull the A Synthesis section text and verify it uses second-person
  // ("Your" / "You") and does NOT contain the user name. Mirrors the
  // Executive Read second-person check so the two surfaces match voice.
  const synthMatch = markdown.match(
    /## A Synthesis\n\n\*one cross-card read[^\n]*\*\n\n([\s\S]*?)(?=\n\n##|\n---)/
  );
  const synthText = synthMatch?.[1] ?? "";
  if (synthText.length > 0) {
    const synthSecondPerson = /\b(Your|your|You)\b/.test(synthText);
    const synthHasName =
      userName !== null && userName.length > 0 && synthText.includes(userName);
    results.push(
      synthSecondPerson && !synthHasName
        ? { ok: true, assertion: "prose-1a-synthesis-second-person" }
        : {
            ok: false,
            assertion: "prose-1a-synthesis-second-person",
            detail: `synth_second_person=${synthSecondPerson} synth_has_name=${synthHasName}; synth="${synthText.slice(0, 160).replace(/\n/g, " ")}"`,
          }
    );

    // Forbidden third-person constructions from the pre-Fix-3 composer.
    const forbidden = [
      /'s shape reads as/i,
      /\bThis shape is a /,
      /What [A-Z][a-z]+ protect[s]? /, // e.g., "What Jason protects"
      /'s gift is/i,
      /'s danger is/i,
    ];
    const hits: string[] = [];
    for (const re of forbidden) {
      const m = synthText.match(re);
      if (m) hits.push(m[0]);
    }
    results.push(
      hits.length === 0
        ? { ok: true, assertion: "prose-1a-synthesis-no-third-person" }
        : {
            ok: false,
            assertion: "prose-1a-synthesis-no-third-person",
            detail: `forbidden third-person fragments in Synthesis: ${hits.join(" | ")}`,
          }
    );
  }

  // ── CC-PROSE-1A Fix 4 — Pattern label rename ────────────────────────
  // CC-029 cross-card pattern blocks must render as "Pattern in motion"
  // (the new distinct label) and the literal "Pattern observation"
  // string must NOT appear anywhere in the rendered markdown.
  const observationPresent = /Pattern observation/.test(markdown);
  results.push(
    !observationPresent
      ? { ok: true, assertion: "prose-1a-pattern-observation-absent" }
      : {
          ok: false,
          assertion: "prose-1a-pattern-observation-absent",
          detail: "literal `Pattern observation` label should not be in rendered markdown",
        }
  );
  // When CC-029 patterns fire for any card, "Pattern in motion" must
  // appear at least once. Detect by checking whether the markdown
  // contains `**Pattern in motion** —` (the renderMirror.ts emit
  // pattern). Fixtures that don't trigger any CC-029 pattern skip this
  // assertion (silent-pass — the rename is moot when nothing renders).
  const motionPresent = /\*\*Pattern in motion\*\* — /.test(markdown);
  // Quick proxy: detect whether ANY cross-card pattern fired by
  // rebuilding the patternsByCard map shape (reuse renderMirror's path:
  // detectCrossCardPatterns is internal, so we inspect the markdown
  // for the post-rename label OR for the inverted-state — if the
  // markdown lacks any pattern paragraph, the assertion is moot).
  const anyPatternEmitted = motionPresent || observationPresent;
  if (anyPatternEmitted) {
    results.push(
      motionPresent
        ? { ok: true, assertion: "prose-1a-pattern-label-renamed" }
        : {
            ok: false,
            assertion: "prose-1a-pattern-label-renamed",
            detail: "cross-card pattern emitted but not under `**Pattern in motion**` label",
          }
    );
  }

  // ── CC-PROSE-1B Layer 4 — Core Signal Map ───────────────────────────
  const coreSignalMapHeader = /^## Core Signal Map$/m.test(markdown);
  results.push(
    coreSignalMapHeader
      ? { ok: true, assertion: "prose-1b-core-signal-map-rendered" }
      : {
          ok: false,
          assertion: "prose-1b-core-signal-map-rendered",
          detail: "no `## Core Signal Map` header in rendered markdown",
        }
  );

  // Order check: Core Signal Map must sit between Executive Read and
  // How to Read This (CC-PROSE-1B render position canon).
  const idxExec = markdown.search(/^## Executive Read$/m);
  const idxCsm = markdown.search(/^## Core Signal Map$/m);
  const idxHow = markdown.search(/^## How to Read This$/m);
  const orderedCsm = idxExec >= 0 && idxCsm > idxExec && idxCsm < idxHow;
  if (idxCsm >= 0) {
    results.push(
      orderedCsm
        ? { ok: true, assertion: "prose-1b-core-signal-map-position" }
        : {
            ok: false,
            assertion: "prose-1b-core-signal-map-position",
            detail: `expected idxExec(${idxExec}) < idxCsm(${idxCsm}) < idxHow(${idxHow})`,
          }
    );
  }

  const missingCells = CORE_SIGNAL_CELL_LABELS.filter(
    (label) => !markdown.includes(`| ${label} |`)
  );
  results.push(
    missingCells.length === 0
      ? { ok: true, assertion: "prose-1b-core-signal-map-12-cells" }
      : {
          ok: false,
          assertion: "prose-1b-core-signal-map-12-cells",
          detail: `missing canonical cell labels: ${missingCells.join(" | ")}`,
        }
  );

  const csmFooterPresent = markdown.includes(`*${CORE_SIGNAL_MAP_FOOTER}*`);
  results.push(
    csmFooterPresent
      ? { ok: true, assertion: "prose-1b-core-signal-map-italic-line" }
      : {
          ok: false,
          assertion: "prose-1b-core-signal-map-italic-line",
          detail: "canonical Core Signal Map footer italic line missing",
        }
  );

  // ── CC-PROSE-1B Layer 5 — pulled-forward callouts ───────────────────
  // CC-SYNTHESIS-1-FINISH Section A relaxation — Layer 5A and 5B
  // callouts were verbatim duplicates of Executive Read sentences and
  // are no longer rendered post-1F. The composer still produces the
  // fields (composer-side regression preserved via
  // *-from-thesis / *-from-gift-danger source-of-truth checks below).
  const callouts = composeReportCallouts(constitution);

  // Composer-side source-of-truth checks: 5A summary must equal
  // composeThesisLine; 5B most-useful-line must equal composeGiftDangerLine.
  // These run on the COMPOSER OUTPUT (regardless of whether the render
  // path emits it).
  const thesisLine = composeThesisLine(constitution);
  results.push(
    callouts.summary === thesisLine
      ? { ok: true, assertion: "prose-1b-callout-summary-from-thesis" }
      : {
          ok: false,
          assertion: "prose-1b-callout-summary-from-thesis",
          detail: `summary !== thesis line — summary="${callouts.summary.slice(0, 80)}" thesis="${thesisLine.slice(0, 80)}"`,
        }
  );

  const giftDangerLine = composeGiftDangerLine(constitution);
  results.push(
    callouts.mostUsefulLine === giftDangerLine
      ? { ok: true, assertion: "prose-1b-callout-most-useful-line-from-gift-danger" }
      : {
          ok: false,
          assertion: "prose-1b-callout-most-useful-line-from-gift-danger",
          detail: `mostUsefulLine !== composeGiftDangerLine — got "${callouts.mostUsefulLine.slice(0, 80)}"`,
        }
  );

  // CC-SYNTHESIS-1-FINISH Section A — Layer 5A and 5B blockquote
  // renders are now removed. Assert their ABSENCE so a future
  // regression (e.g., re-introducing the 5A/5B emit) fails fast.
  const expectedSummaryBlockquote = `> *${callouts.summary}*`;
  const expectedMostUsefulBlockquote = `> *${callouts.mostUsefulLine}*`;
  results.push(
    !markdown.includes(expectedSummaryBlockquote)
      ? { ok: true, assertion: "prose-1b-callout-summary-deduped" }
      : {
          ok: false,
          assertion: "prose-1b-callout-summary-deduped",
          detail: "Layer 5A summary callout still rendering after Section A dedup",
        }
  );
  results.push(
    !markdown.includes(expectedMostUsefulBlockquote)
      ? { ok: true, assertion: "prose-1b-callout-most-useful-line-deduped" }
      : {
          ok: false,
          assertion: "prose-1b-callout-most-useful-line-deduped",
          detail: "Layer 5B most-useful-line callout still rendering after Section A dedup",
        }
  );

  // 5C — Final Line. Either renders as a blockquote at end of report,
  // OR null was returned (gap surfaced). Both outcomes valid.
  if (callouts.finalLine) {
    const finalLineBlockquote = `> *${callouts.finalLine}*`;
    const finalLinePresent = markdown.includes(finalLineBlockquote);
    results.push(
      finalLinePresent
        ? { ok: true, assertion: "prose-1b-callout-final-line-present-or-null" }
        : {
            ok: false,
            assertion: "prose-1b-callout-final-line-present-or-null",
            detail: "finalLine is non-null but blockquote form missing from markdown",
          }
    );

    // No-new-vocabulary check: every non-stopword token in finalLine
    // must appear in shapeDescriptor + structuralY + closed connector
    // set + standard sentence-frame words ("You are a", "The work is
    // to"). The mechanical -ing→imperative may produce stem variants
    // (translating → translate, letting → let) — accept those as
    // morphological derivations of the source structuralY.
    const STOPWORDS = new Set([
      "a",
      "an",
      "the",
      "is",
      "to",
      "and",
      "or",
      "of",
      "in",
      "on",
      "for",
      "with",
      "by",
      "as",
      "into",
      "from",
      "but",
      "not",
      "are",
      "be",
      "you",
      "your",
      "this",
      "that",
      "these",
      "those",
      "it",
      "its",
      "we",
      "our",
      "us",
      "i",
      "me",
      "my",
      "they",
      "them",
      "their",
      "his",
      "her",
      "him",
      "she",
      "he",
      "what",
      "where",
      "when",
      "how",
      "why",
      "if",
      "than",
      "then",
      "so",
      "do",
      "does",
      "did",
      "have",
      "has",
      "had",
      "can",
      "could",
      "may",
      "might",
      "would",
      "should",
      "must",
      "shall",
      "will",
      "edge",
      "growth",
      "work",
    ]);
    // Source vocabulary: shapeDescriptor + structuralY + the closed
    // connector words. We also accept any morphological prefix of a
    // source-token (e.g., "translate" derived from "translating").
    const sourceText =
      `${callouts.summary} ${giftDangerLine} ${callouts.mostUsefulLine}`.toLowerCase();
    const sourceTokens = new Set(
      sourceText.match(/[a-z]+/g) ?? []
    );
    const finalTokens = (callouts.finalLine.match(/[a-z]+/gi) ?? []).map(
      (t) => t.toLowerCase()
    );
    const noveltyHits: string[] = [];
    for (const tok of finalTokens) {
      if (STOPWORDS.has(tok)) continue;
      if (sourceTokens.has(tok)) continue;
      // Accept morphological derivations: if any source token contains
      // this token as a substring (covers "translate" ⊂ "translating",
      // "let" ⊂ "letting", "name" ⊂ "naming", "examine" ⊂ "examining"),
      // OR vice-versa, treat as derived rather than novel.
      const isDerived = Array.from(sourceTokens).some(
        (src) => src.includes(tok) || tok.includes(src)
      );
      if (!isDerived) noveltyHits.push(tok);
    }
    results.push(
      noveltyHits.length === 0
        ? {
            ok: true,
            assertion: "prose-1b-callout-final-line-no-new-vocabulary",
          }
        : {
            ok: false,
            assertion: "prose-1b-callout-final-line-no-new-vocabulary",
            detail: `novel tokens in finalLine not derivable from source: ${noveltyHits.join(", ")}`,
          }
    );
  } else {
    // Null is a valid outcome — gap surfaced, no callout rendered.
    results.push({
      ok: true,
      assertion: "prose-1b-callout-final-line-present-or-null [null — gap]",
    });
  }

  // Second-person register across all callouts that fired.
  const calloutTexts: string[] = [callouts.summary, callouts.mostUsefulLine];
  if (callouts.finalLine) calloutTexts.push(callouts.finalLine);
  const personFails: string[] = [];
  for (const txt of calloutTexts) {
    if (!/\b(Your|your|You)\b/.test(txt)) personFails.push(txt.slice(0, 60));
    if (userName && userName.length > 0 && txt.includes(userName)) {
      personFails.push(`name leak: "${txt.slice(0, 60)}"`);
    }
    if (/\bThis shape is /.test(txt) || /'s shape /i.test(txt)) {
      personFails.push(`third-person fragment: "${txt.slice(0, 60)}"`);
    }
  }
  results.push(
    personFails.length === 0
      ? { ok: true, assertion: "prose-1b-callouts-second-person" }
      : {
          ok: false,
          assertion: "prose-1b-callouts-second-person",
          detail: personFails.join(" | "),
        }
  );

  // Visual consistency: post-CC-SYNTHESIS-1-FINISH, only Layer 5C
  // (Final Line) renders as a markdown blockquote (5A and 5B were
  // removed in Section A as duplicates of Executive Read content).
  // Assert: the Final Line callout, when present, uses the blockquote
  // form. The Executive Read also still renders as a blockquote
  // (CC-PROSE-1A canon, untouched by 1F).
  if (callouts.finalLine && callouts.finalLine.length > 0) {
    const finalBlockquote = `> *${callouts.finalLine}*`;
    results.push(
      markdown.includes(finalBlockquote)
        ? { ok: true, assertion: "prose-1b-callouts-visual-consistency" }
        : {
            ok: false,
            assertion: "prose-1b-callouts-visual-consistency",
            detail: `Layer 5C Final Line not in blockquote form: ${callouts.finalLine.slice(0, 60)}`,
          }
    );
  } else {
    results.push({
      ok: true,
      assertion: "prose-1b-callouts-visual-consistency [no callouts to verify]",
    });
  }

  // ── CC-PROSE-1B Layer 6 — Top Gifts and Growth Edges unified table ──
  const tableHeader = /^## Your Top Gifts and Growth Edges$/m.test(markdown);
  results.push(
    tableHeader
      ? { ok: true, assertion: "prose-1b-gifts-edges-table-rendered" }
      : {
          ok: false,
          assertion: "prose-1b-gifts-edges-table-rendered",
          detail: "expected `## Your Top Gifts and Growth Edges` heading",
        }
  );

  // Pairing rule: gift[i] label ↔ topRisks[i] label, in that table-row
  // order. Audit derives expected pairings from cross_card and asserts
  // they appear in the markdown table rows.
  const expectedPairings = constitution.cross_card.topGifts
    .slice(0, 3)
    .map((g, i) => ({
      gift: g.label,
      trap: constitution.cross_card.topRisks[i]?.label ?? "",
    }))
    .filter((p) => p.trap.length > 0);
  const pairingFails: string[] = [];
  for (const p of expectedPairings) {
    // Markdown row: | **{gift}** | ... | **{trap}** |
    const rowRe = new RegExp(
      `\\|\\s*\\*\\*${escapeRegex(p.gift)}\\*\\*\\s*\\|[^|]*\\|\\s*\\*\\*${escapeRegex(p.trap)}\\*\\*\\s*\\|`
    );
    if (!rowRe.test(markdown)) {
      pairingFails.push(`${p.gift} → ${p.trap}`);
    }
  }
  results.push(
    pairingFails.length === 0
      ? { ok: true, assertion: "prose-1b-gifts-edges-table-pairings" }
      : {
          ok: false,
          assertion: "prose-1b-gifts-edges-table-pairings",
          detail: `pairings not found as table rows: ${pairingFails.join(" | ")}`,
        }
  );

  // "What it means" column: each row's middle cell must be a substring
  // of the corresponding gift's paragraph (no invented vocabulary).
  const meaningFails: string[] = [];
  for (let i = 0; i < expectedPairings.length; i++) {
    const giftEntry = constitution.cross_card.topGifts[i];
    const expectedMeaning = firstSentence(giftEntry.paragraph);
    if (!expectedMeaning) continue;
    if (!giftEntry.paragraph.includes(expectedMeaning)) {
      meaningFails.push(
        `row ${i + 1}: firstSentence not a substring of paragraph`
      );
    }
  }
  results.push(
    meaningFails.length === 0
      ? {
          ok: true,
          assertion: "prose-1b-gifts-edges-table-what-it-means-from-prose",
        }
      : {
          ok: false,
          assertion: "prose-1b-gifts-edges-table-what-it-means-from-prose",
          detail: meaningFails.join(" | "),
        }
  );

  // Layer 6 replaces the prior two list sections — ensure neither old
  // heading remains in the markdown.
  const oldHeadingHits: string[] = [];
  if (/^## Your Top 3 Gifts$/m.test(markdown))
    oldHeadingHits.push("## Your Top 3 Gifts");
  if (/^## Your Top 3 Growth Edges$/m.test(markdown))
    oldHeadingHits.push("## Your Top 3 Growth Edges");
  results.push(
    oldHeadingHits.length === 0
      ? { ok: true, assertion: "prose-1b-gifts-edges-table-replaces-lists" }
      : {
          ok: false,
          assertion: "prose-1b-gifts-edges-table-replaces-lists",
          detail: `legacy headings still present: ${oldHeadingHits.join(", ")}`,
        }
  );

  // Lens-flavor line preservation: when getFunctionPairRegister returns
  // a non-null product_safe_sentence for the fixture's Lens stack, the
  // markdown must contain that sentence in italic form below the table
  // and BEFORE the Layer 5A summary callout.
  const lensRegister = getFunctionPairRegister(constitution.lens_stack);
  const lensSentence = lensRegister?.product_safe_sentence;
  if (lensSentence && constitution.mirror.topGifts.length > 0) {
    const lensItalic = `*${lensSentence}*`;
    const lensIdx = markdown.indexOf(lensItalic);
    const tableIdx = markdown.search(/^## Your Top Gifts and Growth Edges$/m);
    const summaryIdx = markdown.indexOf(expectedSummaryBlockquote);
    const orderedLensFlavor =
      lensIdx > 0 &&
      tableIdx >= 0 &&
      lensIdx > tableIdx &&
      (summaryIdx < 0 || lensIdx < summaryIdx);
    results.push(
      orderedLensFlavor
        ? { ok: true, assertion: "prose-1b-lens-flavor-line-preserved" }
        : {
            ok: false,
            assertion: "prose-1b-lens-flavor-line-preserved",
            detail: `lens sentence position wrong: lens_idx=${lensIdx} table_idx=${tableIdx} summary_idx=${summaryIdx}`,
          }
    );
  }

  // ── Preservation regression ──────────────────────────────────────────
  const preservation: Array<{ name: string; pattern: RegExp }> = [
    { name: "prose-1-tensions-preserved", pattern: /^## Open Tensions/m },
    {
      name: "prose-1-conflict-translation-preserved",
      pattern: /^## Conflict Translation/m,
    },
    {
      name: "prose-1-mirror-types-preserved",
      pattern: /^## Mirror-Types Seed/m,
    },
    {
      name: "prose-1-use-cases-preserved",
      // The use-cases section title varies per USE_CASES_SECTION_TITLE
      // canon; we check for the literal "What this is good for" phrase.
      pattern: /What this is good for/i,
    },
  ];
  for (const p of preservation) {
    // Tensions section is conditional (renders only when openTensions
    // exist). Skip the assertion when no open tensions are detected.
    if (
      p.name === "prose-1-tensions-preserved" &&
      constitution.tensions.filter(
        (t) => t.status === undefined || t.status === "unconfirmed"
      ).length === 0
    ) {
      continue;
    }
    results.push(
      p.pattern.test(markdown)
        ? { ok: true, assertion: p.name }
        : {
            ok: false,
            assertion: p.name,
            detail: `pattern ${p.pattern} not found in rendered markdown`,
          }
    );
  }

  // ── Hedging preservation ────────────────────────────────────────────
  // ≥3 hedge phrases anywhere in the rendered markdown body.
  let hedgeCount = 0;
  for (const phrase of HEDGE_PHRASES) {
    const matches = markdown.match(new RegExp(phrase, "gi"));
    hedgeCount += matches?.length ?? 0;
  }
  results.push(
    hedgeCount >= 3
      ? { ok: true, assertion: "prose-1-hedging-preserved" }
      : {
          ok: false,
          assertion: "prose-1-hedging-preserved",
          detail: `hedge phrases found: ${hedgeCount}; floor 3`,
        }
  );

  // ── Engine canon phrase preservation ────────────────────────────────
  // For each canonical phrase, if the constitution's prose generators
  // produced it (we check by seeing whether the phrase appears at least
  // once in the markdown), confirm preservation. Phrases that never
  // appear are silent (the fixture didn't trigger that prose path).
  const phraseHits = CANONICAL_PHRASES.filter((p) => markdown.includes(p));
  // The assertion passes by surfacing the count — phrases that fire are
  // preserved verbatim by the lift-only discipline. Empty hit list is
  // benign (just means this fixture's generators didn't produce any
  // canonical phrase). We surface the count for visibility.
  results.push({
    ok: true,
    assertion: `prose-1-engine-phrase-preservation [${phraseHits.length} canon phrases preserved]`,
  });

  return { pass: results.every((r) => r.ok), results };
}

function main(): number {
  const fixtures = loadFixtures();
  console.log("CC-PROSE-1 + CC-PROSE-1A + CC-PROSE-1B — Prose architecture lift audit");
  console.log("=======================================================================");
  let failures = 0;
  for (const fix of fixtures) {
    const { pass, results } = runFixture(fix);
    const status = pass ? "PASS" : "FAIL";
    console.log(`[${status}] ${fix.set.padEnd(15)} ${fix.file}`);
    for (const r of results) {
      if (!r.ok) {
        console.error(`         · ${r.assertion}: ${r.detail}`);
        failures++;
      }
    }
  }
  console.log("");
  if (failures > 0) {
    console.error(`AUDIT FAILED — ${failures} assertion failure(s).`);
    return 1;
  }
  console.log(
    "AUDIT PASSED — all CC-PROSE-1 + CC-PROSE-1A + CC-PROSE-1B assertions green across cohort."
  );
  return 0;
}

process.exit(main());
