"use client";

import type { ReactNode } from "react";
import type {
  Answer,
  BeliefUnderTension,
  DemographicSet,
  InnerConstitution,
  MirrorOutput,
} from "../../lib/types";
import type { ProfileArchetype } from "../../lib/profileArchetype";

// CC-LAUNCH-VOICE-POLISH B6 — per-archetype "unpack" paragraph for the
// uncomfortable-but-true masthead line. Browser-native <details> + the
// italic line as <summary>; click expands to reveal the explanation
// paragraph below. Per the CC, caregiver / steward variants are
// scaffolds for a future LLM refinement pass; the architect variant
// is the canonical reference text.
const UNCOMFORTABLE_DETAILS_BY_ARCHETYPE: Record<ProfileArchetype, string> = {
  jasonType:
    "Pattern-reading is a gift — you see the strategic shape before the room has finished forming it. The trap is sliding from \"I see what's happening\" into \"I should decide what to do about it.\" Those are different things. Authority to conclude comes from relationship to the affected parties, accountability for outcomes, having been asked, having earned trust over time, having stakes. Absorbing more context than the room doesn't, by itself, earn that authority. The check-question, when you feel the pull to call a shot: am I in the position that gets to make this call, or did I just take in more of the situation than the people who are?",
  cindyType:
    "Present-tense care is a gift — the closeness you have to people lets you see what they need before they've named it. The trap is sliding from \"I see what they need\" into \"I should decide for them.\" The check is similar: am I deciding for someone, or alongside them? Has the relationship actually given me the authority to act on their behalf, or only the closeness to see what they're going through?",
  danielType:
    "Holding precedent and continuity gives you genuine insight into what's worked and what hasn't — but that insight isn't, by itself, authority over what changes next. The check: am I the keeper of this thing, or am I assuming that being the longest-running observer makes me the right voice on its next chapter?",
  unmappedType:
    "Reading a situation closely is a gift, and the closeness can slide into a sense of authority to decide. The check, when you feel the pull to call a shot: am I in the position that gets to make this call, or have I just taken in more of the situation than the people who are?",
};

function UncomfortableButTrueDetails({
  line,
  archetype,
}: {
  line: string;
  archetype: ProfileArchetype;
}) {
  const explanation =
    UNCOMFORTABLE_DETAILS_BY_ARCHETYPE[archetype] ??
    UNCOMFORTABLE_DETAILS_BY_ARCHETYPE.unmappedType;
  return (
    <details style={{ paddingTop: 12, paddingBottom: 4 }}>
      <summary
        className="font-serif italic text-[15px] md:text-[15.5px]"
        style={{
          color: "var(--ink-mute)",
          lineHeight: 1.6,
          listStyle: "none",
          cursor: "pointer",
        }}
      >
        {line}
      </summary>
      <p
        className="font-serif text-[14.5px] md:text-[15px]"
        style={{
          color: "var(--ink-soft)",
          lineHeight: 1.6,
          margin: 0,
          paddingTop: 10,
        }}
      >
        {explanation}
      </p>
    </details>
  );
}
import KeystoneReflection from "./KeystoneReflection";
import {
  composeExecutiveRead,
  getSimpleSummaryParts,
  getFunctionPairRegister,
  getTopCompassValues,
  COMPASS_LABEL,
} from "../../lib/identityEngine";
import {
  readCachedKeystoneRewrite,
  type KeystoneRewriteInputs,
} from "../../lib/keystoneRewriteLlm";
import {
  summarizeQI2Selections,
  summarizeQI3Selections,
} from "../../lib/beliefHeuristics";
// CC-SYNTHESIS-1-FINISH Section A — composeReportCallouts is no longer
// consumed by MirrorSection (5A and 5B callouts removed; 5C lives in
// InnerConstitutionPage). Import dropped.
import CoreSignalMap from "./CoreSignalMap";
import TopGiftsGrowthEdgesTable from "./TopGiftsGrowthEdgesTable";

type Props = {
  mirror: MirrorOutput;
  mbtiSlot?: ReactNode;
  // CC-015c — Keystone Reflection mounts here when a Q-I1 answer exists.
  belief?: BeliefUnderTension | null;
  // The user's top-Compass value-list phrase, used to anchor belief prose.
  beliefValueListPhrase?: string;
  // CC-022b — render-time enhancement inputs. demographics enables name
  // threading + Keystone citation; answers feeds the Keystone selection
  // citation (Q-I2 / Q-I3 selections); constitution feeds Simple Summary.
  demographics?: DemographicSet | null;
  answers?: Answer[];
  constitution?: InnerConstitution;
  // CC-REACT-ON-SCREEN-LLM-RENDER — when set, overrides the committed-
  // cache keystone lookup. Live users whose belief misses the cohort
  // cache get their on-demand-resolved keystone prose surfaced
  // on-screen, matching what the markdown export already produces.
  liveKeystoneRewriteProse?: string | null;
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.12em",
        color: "var(--ink-mute)",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function HairlineRule() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--rule-soft)",
        margin: "28px 0",
      }}
    />
  );
}

function BodyParagraph({ text }: { text: string }) {
  return (
    <p
      className="font-serif text-[15.5px] md:text-[16px]"
      style={{ color: "var(--ink)", lineHeight: 1.65, margin: 0 }}
    >
      {text}
    </p>
  );
}

function DropCapParagraph({ text }: { text: string }) {
  if (!text) return null;
  const first = text.charAt(0);
  const rest = text.slice(1);
  return (
    <p
      className="font-serif text-[16px] md:text-[17px]"
      style={{ color: "var(--ink)", lineHeight: 1.7, margin: 0 }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 48,
          lineHeight: 1,
          color: "var(--umber)",
          float: "left",
          paddingRight: 8,
          paddingTop: 4,
          fontWeight: 600,
        }}
      >
        {first}
      </span>
      {rest}
    </p>
  );
}

// CC-PROSE-1B Layer 5 — shared callout block for Layer 5A / 5B (and the
// Executive Read above; CC-PROSE-1A introduced this visual treatment).
// Same border + tint + padding as the Executive Read so all four callout
// surfaces in the report read consistently.
function CalloutBlock({ text }: { text: string }) {
  return (
    <div
      style={{
        borderLeft: "3px solid var(--umber)",
        background: "var(--umber-wash)",
        padding: "14px 18px",
        borderRadius: 2,
      }}
    >
      <p
        className="font-serif italic text-[15px] md:text-[15.5px]"
        style={{ color: "var(--ink)", lineHeight: 1.65, margin: 0 }}
      >
        {text}
      </p>
    </div>
  );
}

function NumberedList({
  items,
}: {
  items: { label: string; paragraph: string }[];
}) {
  return (
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {items.map((it, i) => (
        <li key={`mirror-list-${i}`} className="flex flex-col" style={{ gap: 6 }}>
          <p
            className="font-serif text-[15.5px] md:text-[16px]"
            style={{ color: "var(--ink)", fontWeight: 600, margin: 0 }}
          >
            {i + 1}. {it.label}
          </p>
          <p
            className="font-serif text-[15px] md:text-[15.5px]"
            style={{ color: "var(--ink)", lineHeight: 1.6, margin: 0 }}
          >
            {it.paragraph}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function MirrorSection({
  mirror,
  mbtiSlot,
  belief,
  beliefValueListPhrase,
  demographics,
  answers,
  constitution,
  liveKeystoneRewriteProse,
}: Props) {
  // CC-025 Step 2.6 — pronoun register pinned to second-person throughout
  // the Mirror body. The Synthesis section (rendered separately below) keeps
  // its name-threading; Core Pattern, What Others May Experience, and When
  // the Load Gets Heavy now stay in the original "you / your" voice.

  // CC-PROSE-1B — Synthesis composer parts so Layer 5B (Most Useful
  // Line) can interleave between the parallel-line tercet and the
  // closing thesis sentence without duplicating gift/danger content.
  const summaryParts = constitution
    ? getSimpleSummaryParts(constitution)
    : null;

  // CC-PROSE-1 Layer 1 — Executive Read. 2-sentence distillation lifted
  // from existing Synthesis composer (gift/danger + thesis). Renders
  // between the masthead block and "How to Read This."
  const executiveRead = constitution
    ? composeExecutiveRead(constitution)
    : null;

  // CC-SYNTHESIS-1-FINISH Section A — Layer 5A and 5B callouts removed
  // from the Mirror render (verbatim duplicates of Executive Read). The
  // 5C Final Line callout is rendered by InnerConstitutionPage at end
  // of report. composeReportCallouts no longer consumed here.

  // CC-PROSE-1B Layer 6 — Lens-flavor product_safe_sentence. Pre-1B this
  // line rendered between Top Gifts and Top Growth Edges; 1B repositions
  // it BELOW the unified table and BEFORE the Layer 5A One-Sentence
  // Summary callout. Composer (getFunctionPairRegister) is unchanged.
  const lensFlavor =
    constitution && mirror.topGifts.length > 0
      ? getFunctionPairRegister(constitution.lens_stack)?.product_safe_sentence ??
        null
      : null;

  // CC-KEYSTONE-RENDER — read the LLM Keystone rewrite from cache when
  // belief is present + engine inputs derivable. Cache miss falls through
  // (KeystoneReflection renders the legacy metadata+prose path).
  //
  // CC-REACT-ON-SCREEN-LLM-RENDER — when the parent passes
  // `liveKeystoneRewriteProse` (from the `/api/report-cards` fetch), it
  // takes precedence over the local committed-cache lookup. This is
  // how live sessions whose belief misses the cohort cache get LLM
  // prose on-screen — same content the markdown export already shows.
  const keystoneRewriteProse: string | null = (() => {
    if (liveKeystoneRewriteProse) return liveKeystoneRewriteProse;
    if (!belief || !constitution) return null;
    const topCompassRefs = getTopCompassValues(constitution.signals);
    const topCompassValueLabels = topCompassRefs
      .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
      .filter((s) => s.length > 0);
    const qi2 = answers ? summarizeQI2Selections(answers) : null;
    const qi3 = answers ? summarizeQI3Selections(answers) : null;
    const inputs: KeystoneRewriteInputs = {
      archetype: constitution.profileArchetype?.primary ?? "unmappedType",
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
    return readCachedKeystoneRewrite(inputs);
  })();

  return (
    <section className="flex flex-col" style={{ gap: 0 }}>
      {/* 1. Shape in One Sentence — drop cap */}
      <div style={{ paddingTop: 8 }}>
        <DropCapParagraph text={mirror.shapeInOneSentence} />
        <div style={{ clear: "both" }} />
        {/* CC-058 — Mirror Layer uncomfortable-but-true slot (CC-048 Rule 5).
            Single italic paragraph in ink-mute, signaling the calibration-
            question register adjacent to the gift. Silent (no slot, no
            orphan whitespace) when the engine returned `null`/empty per
            the canon: silence is the canonical fallback, never a generic
            horoscope sentence. */}
        {mirror.uncomfortableButTrue && mirror.uncomfortableButTrue.length > 0 ? (
          <UncomfortableButTrueDetails
            line={mirror.uncomfortableButTrue}
            archetype={constitution?.profileArchetype?.primary ?? "unmappedType"}
          />
        ) : null}
        {mbtiSlot ? <div style={{ paddingTop: 12 }}>{mbtiSlot}</div> : null}
      </div>

      {/* 1c. CC-PROSE-1 — Executive Read. 2-sentence distillation
          (gift/danger + thesis), lifted from the existing Synthesis
          composer. Sits between the masthead block and "How to Read
          This." Second-person register; engine canon phrases preserved
          verbatim. Silent (skipped entirely) when constitution is
          unavailable.

          CC-PROSE-1A Fix 1 — wrapped in a callout block (left umber
          border + warm umber-wash tint) so the distillation reads as
          a summary callout, visually distinct from the italic
          section-body paragraphs around it (How-to-Read, Mirror body,
          Synthesis). Mirrors the markdown blockquote rendering. */}
      {executiveRead && executiveRead.length > 0 ? (
        <>
          <HairlineRule />
          <div className="flex flex-col" style={{ gap: 12 }}>
            <SectionLabel>Executive Read</SectionLabel>
            <CalloutBlock text={executiveRead} />
          </div>
        </>
      ) : null}

      {/* CC-PROSE-1B Layer 4 — Core Signal Map. 12-cell at-a-glance grid
          immediately after the Executive Read, before "How to Read This." */}
      {constitution ? (
        <>
          <HairlineRule />
          <div className="flex flex-col" style={{ gap: 12 }}>
            <SectionLabel>Core Signal Map</SectionLabel>
            <CoreSignalMap constitution={constitution} />
          </div>
        </>
      ) : null}

      <HairlineRule />

      {/* 1b. CC-025 — How to Read This preamble. Sets reader disposition
          before any specific claim. Same paragraph for every report. */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        <SectionLabel>How to Read This</SectionLabel>
        <p
          className="font-serif italic text-[15px] md:text-[15.5px]"
          style={{ color: "var(--ink-soft)", lineHeight: 1.65, margin: 0 }}
        >
          This profile is not meant to define you from the outside. It is meant to give language to a pattern your answers suggest: how you notice reality, what you protect, who you trust, where responsibility tends to land, and how your gifts behave when life puts pressure on them.
        </p>
        <p
          className="font-serif italic text-[15px] md:text-[15.5px]"
          style={{ color: "var(--ink-soft)", lineHeight: 1.65, margin: 0 }}
        >
          The model proposes. You confirm. The most useful reading is not the one that flatters you or corners you. It is the one that helps you become more grounded, more honest, more legible, and more free inside the person you already are.
        </p>
      </div>

      <HairlineRule />

      {/* 2. Core Pattern */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        <SectionLabel>Your Core Pattern</SectionLabel>
        <BodyParagraph text={mirror.corePattern} />
      </div>

      <HairlineRule />

      {/* CC-PROSE-1B Layer 6 — Top Gifts and Growth Edges unified table.
          Replaces the prior separate "Top 3 Gifts" and "Top 3 Growth
          Edges" lists with one 3-row × 3-column table. Pairing matches
          generateSimpleSummary's parallel-line close: gift[i] ↔ trap[i].

          The Lens-flavor product_safe_sentence (which pre-1B sat
          between the two list sections) repositions to BELOW the table
          and BEFORE the Layer 5A One-Sentence Summary callout. */}
      <div className="flex flex-col" style={{ gap: 16 }}>
        <SectionLabel>Your Top Gifts and Growth Edges</SectionLabel>
        <TopGiftsGrowthEdgesTable
          gifts={mirror.topGifts}
          traps={mirror.topTraps}
        />
        {lensFlavor ? (
          <p
            className="font-serif italic text-[15px] md:text-[15.5px]"
            style={{ color: "var(--ink-soft)", lineHeight: 1.65, margin: 0 }}
          >
            {lensFlavor}
          </p>
        ) : null}
        {/* CC-SYNTHESIS-1-FINISH Section A — Layer 5A summary callout
            removed (verbatim duplicate of Executive Read sentence 3). */}
      </div>

      <HairlineRule />

      {/* 5. What Others May Experience */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        <SectionLabel>What Others May Experience</SectionLabel>
        <BodyParagraph text={mirror.whatOthersMayExperience} />
      </div>

      <HairlineRule />

      {/* 6. When the Load Gets Heavy */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        <SectionLabel>When the Load Gets Heavy</SectionLabel>
        <BodyParagraph text={mirror.whenTheLoadGetsHeavy} />
      </div>

      <HairlineRule />

      {/* 7. Your Next 3 Moves */}
      <div className="flex flex-col" style={{ gap: 16 }}>
        <SectionLabel>Your Next 3 Moves</SectionLabel>
        <NumberedList items={mirror.yourNext3Moves} />
      </div>

      {/* 8. CC-015c — Keystone Reflection (only if Q-I1 was answered)
          CC-022b Item 3 — answers + demographics flow through so the
          contextual prose cites the user's actual Q-I2 / Q-I3 selections
          back by source-question label. */}
      {belief ? (
        <>
          <HairlineRule />
          <KeystoneReflection
            belief={belief}
            valueListPhrase={beliefValueListPhrase ?? "what you protect"}
            answers={answers}
            demographics={demographics}
            keystoneRewriteProse={keystoneRewriteProse}
          />
        </>
      ) : null}

      {/* 9. CC-022b Item 5 — Synthesis closing section. CC-PROSE-1B Layer
          5B inserts the Most Useful Line callout between the parallel-
          line tercet and the closing thesis sentence (ordering: intro →
          tercet → 5B callout → thesis). The 5B content is identical to
          generateSimpleSummary's pre-1B "Your gift is X. Your danger is
          Y." line, just promoted to a callout block. */}
      {summaryParts ? (
        <>
          <HairlineRule />
          <div className="flex flex-col" style={{ gap: 12 }}>
            <SectionLabel>A Synthesis</SectionLabel>
            <p
              className="font-serif italic"
              style={{
                fontSize: 14,
                color: "var(--ink-soft)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              one cross-card read, with the parallel-line close.
            </p>
            <p
              className="font-serif text-[15.5px] md:text-[16px]"
              style={{ color: "var(--ink)", lineHeight: 1.7, margin: 0 }}
            >
              {summaryParts.intro}
            </p>
            {summaryParts.tercet ? (
              <p
                className="font-serif text-[15.5px] md:text-[16px]"
                style={{
                  color: "var(--ink)",
                  lineHeight: 1.7,
                  margin: 0,
                  whiteSpace: "pre-line",
                }}
              >
                {summaryParts.tercet}
              </p>
            ) : null}
            {/* CC-SYNTHESIS-1-FINISH Section A — Layer 5B Most Useful
                Line callout + Synthesis closing thesis sentence both
                removed (verbatim duplicates of Executive Read). The
                Synthesis section now closes on the parallel-line tercet
                — its unique content. */}
          </div>
        </>
      ) : null}
    </section>
  );
}
