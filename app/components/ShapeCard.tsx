"use client";

import type { ReactNode } from "react";
import type {
  ConvictionOutput,
  FullSwotOutput,
  PathOutput,
} from "../../lib/types";
import {
  SHAPE_CARD_PATTERN_NOTE,
  type ShapeCardId,
} from "../../lib/identityEngine";
import PathExpanded from "./PathExpanded";

// Pre-CC-025 saved sessions don't carry patternNote on output. Map cardName
// back to ShapeCardId so the render layer can fall back to the canonical
// aphorism without crashing.
function patternNoteFromCardName(cardName: string): string | null {
  const id = cardName.toLowerCase() as ShapeCardId;
  return SHAPE_CARD_PATTERN_NOTE[id] ?? null;
}

type CommonAccordionProps = {
  expanded?: boolean;
  onToggle?: () => void;
  mode?: "default" | "accordion";
};

type Props =
  | ({ variant: "full-swot"; output: FullSwotOutput; mbtiSlot?: ReactNode } & CommonAccordionProps)
  | ({ variant: "conviction"; output: ConvictionOutput } & CommonAccordionProps)
  | ({ variant: "path"; output: PathOutput } & CommonAccordionProps);

function CardKicker({ name, bodyPart }: { name: string; bodyPart: string }) {
  return (
    <p
      className="font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        color: "var(--ink-mute)",
        margin: 0,
      }}
    >
      {name} · {bodyPart}
    </p>
  );
}

function CardHeader({ text }: { text: string }) {
  return (
    <p
      className="font-serif italic text-[14px] md:text-[15px]"
      style={{
        color: "var(--ink-soft)",
        lineHeight: 1.55,
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

function CellLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        {children}
      </p>
      <span
        aria-hidden="true"
        style={{
          width: 24,
          height: 2,
          background: "var(--umber)",
          display: "block",
        }}
      />
    </div>
  );
}

function CellBody({ text }: { text: string }) {
  return (
    <p
      className="font-serif text-[15px] md:text-[15.5px]"
      style={{ color: "var(--ink)", lineHeight: 1.6, margin: 0 }}
    >
      {text}
    </p>
  );
}

function AphorismBody({ text }: { text: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <span
        aria-hidden="true"
        style={{
          width: 32,
          height: 1,
          background: "var(--rule-soft)",
          display: "block",
        }}
      />
      <p
        className="font-serif italic text-[14px] md:text-[14.5px]"
        style={{ color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}
      >
        {text}
      </p>
    </div>
  );
}

function Cell({
  label,
  text,
  variant = "prose",
}: {
  label: string;
  text: string;
  variant?: "prose" | "aphorism";
}) {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <CellLabel>{label}</CellLabel>
      {variant === "aphorism" ? (
        <AphorismBody text={text} />
      ) : (
        <CellBody text={text} />
      )}
    </div>
  );
}

function AccordionToggle({
  expanded,
  onToggle,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-focus-ring
      aria-expanded={expanded}
      className="text-left w-full"
      style={{
        background: "transparent",
        border: "none",
        padding: "12px 0",
        cursor: "pointer",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        color: "var(--ink)",
      }}
    >
      <div className="flex flex-col" style={{ gap: 6, minWidth: 0, flex: 1 }}>
        {children}
      </div>
      <span
        aria-hidden="true"
        style={{
          color: "var(--ink-mute)",
          fontSize: 14,
          lineHeight: 1.5,
          flex: "0 0 auto",
          paddingTop: 2,
          fontFamily: "var(--font-mono)",
        }}
      >
        {expanded ? "▾" : "▸"}
      </span>
    </button>
  );
}

export default function ShapeCard(props: Props) {
  const isAccordion = props.mode === "accordion";
  const expanded = isAccordion ? !!props.expanded : true;
  const onToggle = props.onToggle;

  // ── full-swot ──────────────────────────────────────────────────
  if (props.variant === "full-swot") {
    const { output, mbtiSlot } = props;
    const header = (
      <>
        <CardKicker name={output.cardName} bodyPart={output.bodyPart} />
        <CardHeader text={output.cardHeader} />
      </>
    );

    const patternNoteText =
      output.patternNote?.text ?? patternNoteFromCardName(output.cardName);

    const body = (
      <div className="flex flex-col" style={{ gap: 22 }}>
        {mbtiSlot}
        <Cell label="Strength" text={output.gift.text} />
        <Cell label="Growth Edge" text={output.blindSpot.text} />
        <Cell label="Practice" text={output.growthEdge.text} />
        {patternNoteText ? (
          <Cell label="Pattern Note" text={patternNoteText} variant="aphorism" />
        ) : null}
        {/* CC-015b: per-card riskUnderPressure consolidated to Mirror's
            "When the Load Gets Heavy" — not rendered here. */}
      </div>
    );

    if (isAccordion && onToggle) {
      return (
        <section
          className="flex flex-col"
          style={{
            gap: expanded ? 18 : 0,
            paddingTop: expanded ? 8 : 0,
            paddingBottom: expanded ? 8 : 0,
            borderBottom: "1px solid var(--rule-soft)",
          }}
        >
          <AccordionToggle expanded={expanded} onToggle={onToggle}>
            {header}
          </AccordionToggle>
          {expanded ? <div style={{ paddingBottom: 18 }}>{body}</div> : null}
        </section>
      );
    }

    return (
      <section
        className="flex flex-col"
        style={{ gap: 18, paddingTop: 24, paddingBottom: 24 }}
      >
        <header className="flex flex-col" style={{ gap: 8 }}>
          {header}
        </header>
        {body}
      </section>
    );
  }

  // ── conviction ─────────────────────────────────────────────────
  if (props.variant === "conviction") {
    const { output } = props;
    const header = (
      <>
        <CardKicker name={output.cardName} bodyPart={output.bodyPart} />
        <CardHeader text={output.cardHeader} />
      </>
    );

    const patternNoteText =
      output.patternNote ?? patternNoteFromCardName(output.cardName);

    const body = (
      <div className="flex flex-col" style={{ gap: 22 }}>
        <Cell label="Strength" text={output.gift.text} />
        <Cell label="Growth Edge" text={output.blindSpot.text} />
        <div className="flex flex-col" style={{ gap: 10 }}>
          <CellLabel>Posture</CellLabel>
          <CellBody text={output.posture} />
        </div>
        {patternNoteText ? (
          <Cell label="Pattern Note" text={patternNoteText} variant="aphorism" />
        ) : null}
      </div>
    );

    if (isAccordion && onToggle) {
      return (
        <section
          className="flex flex-col"
          style={{
            gap: expanded ? 18 : 0,
            paddingTop: expanded ? 8 : 0,
            paddingBottom: expanded ? 8 : 0,
            borderBottom: "1px solid var(--rule-soft)",
          }}
        >
          <AccordionToggle expanded={expanded} onToggle={onToggle}>
            {header}
          </AccordionToggle>
          {expanded ? <div style={{ paddingBottom: 18 }}>{body}</div> : null}
        </section>
      );
    }

    return (
      <section
        className="flex flex-col"
        style={{ gap: 18, paddingTop: 24, paddingBottom: 24 }}
      >
        <header className="flex flex-col" style={{ gap: 8 }}>
          {header}
        </header>
        {body}
      </section>
    );
  }

  // ── path ───────────────────────────────────────────────────────
  const { output } = props;
  const header = (
    <>
      <CardKicker name={output.cardName} bodyPart={output.bodyPart} />
      <CardHeader text="how this shape moves through work, love, and giving" />
    </>
  );

  const pathPatternNoteText =
    output.patternNote ?? patternNoteFromCardName(output.cardName);

  const body = (
    <div className="flex flex-col" style={{ gap: 22 }}>
      <PathExpanded output={output} />
      {pathPatternNoteText ? (
        <Cell label="Pattern Note" text={pathPatternNoteText} variant="aphorism" />
      ) : null}
    </div>
  );

  if (isAccordion && onToggle) {
    return (
      <section
        className="flex flex-col"
        style={{
          gap: expanded ? 18 : 0,
          paddingTop: expanded ? 8 : 0,
          paddingBottom: expanded ? 8 : 0,
          borderBottom: "1px solid var(--rule-soft)",
        }}
      >
        <AccordionToggle expanded={expanded} onToggle={onToggle}>
          {header}
        </AccordionToggle>
        {expanded ? <div style={{ paddingBottom: 18 }}>{body}</div> : null}
      </section>
    );
  }

  return (
    <section
      className="flex flex-col"
      style={{ gap: 18, paddingTop: 24, paddingBottom: 24 }}
    >
      <header className="flex flex-col" style={{ gap: 8 }}>
        {header}
      </header>
      {body}
    </section>
  );
}
