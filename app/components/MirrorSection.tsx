"use client";

import type { ReactNode } from "react";
import type {
  Answer,
  BeliefUnderTension,
  DemographicSet,
  InnerConstitution,
  MirrorOutput,
} from "../../lib/types";
import KeystoneReflection from "./KeystoneReflection";
import {
  generateSimpleSummary,
  getFunctionPairRegister,
} from "../../lib/identityEngine";

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
}: Props) {
  // CC-025 Step 2.6 — pronoun register pinned to second-person throughout
  // the Mirror body. The Synthesis section (rendered separately below) keeps
  // its name-threading; Core Pattern, What Others May Experience, and When
  // the Load Gets Heavy now stay in the original "you / your" voice.

  // CC-022b Item 5 — Simple Summary section. Generated at render time
  // from the InnerConstitution + demographics; placed at the end of the
  // Mirror per the spec's integration directive.
  const simpleSummary = constitution
    ? generateSimpleSummary(constitution, demographics)
    : null;

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
          <p
            className="font-serif italic text-[15px] md:text-[15.5px]"
            style={{
              color: "var(--ink-mute)",
              lineHeight: 1.6,
              margin: 0,
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            {mirror.uncomfortableButTrue}
          </p>
        ) : null}
        {mbtiSlot ? <div style={{ paddingTop: 12 }}>{mbtiSlot}</div> : null}
      </div>

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

      {/* 3. Top 3 Gifts */}
      <div className="flex flex-col" style={{ gap: 16 }}>
        <SectionLabel>Your Top 3 Gifts</SectionLabel>
        <NumberedList items={mirror.topGifts} />
        {/* CC-038-prose — register analog elaboration. Surfaces the user's
            canonical aux-pair register (NeTi → "the prober", NiFe → "the
            seer", etc.) via the locked product_safe_sentence template
            ("Your Lens has a [analog] quality: you appear to ..."). The
            register reads as elaboration of the gifts above, not a new
            section. Non-canonical Lens stacks (e.g., Si dominant + Ne
            auxiliary) gracefully omit the line — getFunctionPairRegister
            returns undefined and the conditional render handles absence. */}
        {(() => {
          if (!constitution) return null;
          const register = getFunctionPairRegister(constitution.lens_stack);
          if (!register) return null;
          return (
            <p
              className="font-serif italic text-[15px] md:text-[15.5px]"
              style={{ color: "var(--ink-soft)", lineHeight: 1.65, margin: 0 }}
            >
              {register.product_safe_sentence}
            </p>
          );
        })()}
      </div>

      <HairlineRule />

      {/* 4. Top 3 Growth Edges (renamed from Traps in CC-025) */}
      <div className="flex flex-col" style={{ gap: 16 }}>
        <SectionLabel>Your Top 3 Growth Edges</SectionLabel>
        <NumberedList items={mirror.topTraps} />
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
          />
        </>
      ) : null}

      {/* 9. CC-022b Item 5 — Simple Summary closing section. Synthesizes
          the eight cards + closes with three structured patterns:
          "To keep X without Y" lines, gift/danger compression, and
          "not X, but Y" thesis. */}
      {simpleSummary ? (
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
            <div
              className="font-serif text-[15.5px] md:text-[16px]"
              style={{
                color: "var(--ink)",
                lineHeight: 1.7,
                whiteSpace: "pre-line",
              }}
            >
              {simpleSummary}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
