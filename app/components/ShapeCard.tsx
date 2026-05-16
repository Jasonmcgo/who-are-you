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
import { SHAPE_CARD_QUESTION } from "../../lib/cardAssets";
import PathExpanded from "./PathExpanded";
import LlmProseBlock from "./LlmProseBlock";

// Pre-CC-025 saved sessions don't carry patternNote on output. Map cardName
// back to ShapeCardId so the render layer can fall back to the canonical
// aphorism without crashing.
function patternNoteFromCardName(cardName: string): string | null {
  const id = cardName.toLowerCase() as ShapeCardId;
  return SHAPE_CARD_PATTERN_NOTE[id] ?? null;
}

// CC-PROSE-1 Layer 2 — Canonical Question line, rendered between the
// card kicker (e.g., "Lens · Eyes") and the user-specific Read line
// (cardHeader). Same string per card across all users. The component is
// a thin wrapper so both the markdown renderer and React share a single
// canonical Question source via SHAPE_CARD_QUESTION.
//
// CC-PROSE-1A Fix 1 — non-italic, uppercase-tracked label register
// (mirrors the SectionLabel / CellLabel typography family). The italic
// Read line directly below carries the user-specific reading; the
// Question line carries the card's purpose. Stacking two italic lines
// blurred them into a single voice — the uppercase-tracked rendering
// makes the Question read as a heading-tier label and the Read read as
// the body answer.
function CardQuestion({ id }: { id: ShapeCardId }) {
  const text = SHAPE_CARD_QUESTION[id];
  if (!text) return null;
  return (
    <p
      className="font-mono uppercase"
      style={{
        fontSize: 10.5,
        letterSpacing: "0.1em",
        color: "var(--ink-mute)",
        lineHeight: 1.5,
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

type CommonAccordionProps = {
  expanded?: boolean;
  onToggle?: () => void;
  mode?: "default" | "accordion";
  // CC-SYNTHESIS-1-FINISH — per-card synthesis line. Renders between
  // Practice (or Posture for Conviction) and Pattern Note. Source
  // depends on card id: Lens / Compass / Gravity / Fire get Movement
  // Notes (Section E); Trust gets Correction Channel (Section B);
  // Weather gets State-vs-Shape qualifier (Section C); Conviction gets
  // its own Movement Note (Section E).
  synthesisLine?: string | null;
  // CC-REACT-ON-SCREEN-LLM-RENDER — when set, the body is rendered
  // from the LLM rewrite markdown instead of the engine-prose cells
  // (Strength / Growth Edge / Practice). Header + accordion behavior
  // stay the same. Only the scoped body cards (Lens / Compass) pass
  // this prop; the others (Conviction, Gravity, Trust, Weather, Fire)
  // are out of LLM-rewrite scope and remain engine-prose-only.
  //
  // CC-LLM-RENDER-PRODUCTION-POLISH — the prior "refining…" kicker
  // prop (`llmResolving`) was removed. Engine prose is the visible
  // default until the rewrite arrives; the swap happens silently.
  llmRewriteMarkdown?: string | null;
};

type Props =
  | ({ variant: "full-swot"; output: FullSwotOutput; mbtiSlot?: ReactNode } & CommonAccordionProps)
  | ({ variant: "conviction"; output: ConvictionOutput } & CommonAccordionProps)
  // CC-SYNTHESIS-1-FINISH Section F — `pathMasterSynthesis` replaces the
  // pre-1F `output.directionalParagraph` rendered inside PathExpanded.
  | ({
      variant: "path";
      output: PathOutput;
      pathMasterSynthesis?: string;
      // CC-LAUNCH-VOICE-POLISH-V3 — when set, replaces the engine
      // Work/Love/Give bodies in PathExpanded with the LLM rewrite.
      pathTriptychOverride?: string | null;
    } & CommonAccordionProps);

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

// CC-SYNTHESIS-1-FINISH — Synthesis paragraph component for Movement
// Notes (Section E), Trust Correction Channel (Section B), Weather
// State-vs-Shape qualifier (Section C). Visually distinct from
// Pattern Note (italic aphorism Cell) and Pattern in motion (sibling
// CrossCardPatternBlock). Renders the bold-prefix-em-dash header
// inline with the body text. The composer outputs already include
// `**Movement Note** — ` / `**Correction channel.** ` / `**State vs.
// shape.** ` markdown — we strip the markdown and split prefix from
// body so React can render the bold prefix and non-italic body in
// separate spans.
function SynthesisParagraph({ text }: { text: string }) {
  // Strip surrounding markdown bold (`**...**`) on the leading label
  // and split on the em-dash separator if present, so the bold prefix
  // renders distinct from the body in the styled component.
  const m = text.match(/^\*\*([^*]+)\*\*\s*(?:—\s*)?([\s\S]*)$/);
  const prefix = m ? m[1] : "";
  const body = m ? m[2] : text;
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <p
        className="font-serif text-[15px] md:text-[15.5px]"
        style={{ color: "var(--ink)", lineHeight: 1.6, margin: 0 }}
      >
        {prefix ? (
          <>
            <span style={{ fontWeight: 700 }}>{prefix}</span>
            {body ? <> — {body}</> : null}
          </>
        ) : (
          body
        )}
      </p>
    </div>
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
    const { output, mbtiSlot, synthesisLine, llmRewriteMarkdown } = props;
    const cardId = output.cardName.toLowerCase() as ShapeCardId;
    const header = (
      <>
        <CardKicker name={output.cardName} bodyPart={output.bodyPart} />
        <CardQuestion id={cardId} />
        <CardHeader text={output.cardHeader} />
      </>
    );

    const patternNoteText =
      output.patternNote?.text ?? patternNoteFromCardName(output.cardName);

    // CC-REACT-ON-SCREEN-LLM-RENDER — when the LLM rewrite is
    // available, render its markdown in place of the structured
    // Strength / Growth Edge / Practice cells. Pattern Note + synthesis
    // line still render after, preserving the per-card structural
    // close. The Cell-based engine-prose body falls through when the
    // rewrite is null (pending, failed, or out-of-scope card).
    const body = llmRewriteMarkdown ? (
      <div className="flex flex-col" style={{ gap: 22 }}>
        {mbtiSlot}
        <LlmProseBlock markdown={llmRewriteMarkdown} />
        {synthesisLine && synthesisLine.length > 0 ? (
          <SynthesisParagraph text={synthesisLine} />
        ) : null}
        {patternNoteText ? (
          <Cell label="Pattern Note" text={patternNoteText} variant="aphorism" />
        ) : null}
      </div>
    ) : (
      <div className="flex flex-col" style={{ gap: 22 }}>
        {mbtiSlot}
        <Cell label="Strength" text={output.gift.text} />
        <Cell label="Growth Edge" text={output.blindSpot.text} />
        <Cell label="Practice" text={output.growthEdge.text} />
        {/* CC-SYNTHESIS-1-FINISH — per-card synthesis line (Movement
            Note for Lens/Compass/Gravity/Fire; Correction Channel
            reframe for Trust; State-vs-Shape qualifier for Weather).
            Renders between Practice and Pattern Note (italic closer). */}
        {synthesisLine && synthesisLine.length > 0 ? (
          <SynthesisParagraph text={synthesisLine} />
        ) : null}
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
    const { output, synthesisLine } = props;
    const header = (
      <>
        <CardKicker name={output.cardName} bodyPart={output.bodyPart} />
        <CardQuestion id="conviction" />
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
        {/* CC-SYNTHESIS-1-FINISH Section E — Conviction Movement Note
            (Speech-risk pattern under cost). Between Posture and the
            Pattern Note italic closer. */}
        {synthesisLine && synthesisLine.length > 0 ? (
          <SynthesisParagraph text={synthesisLine} />
        ) : null}
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
  const { output, pathMasterSynthesis, llmRewriteMarkdown, pathTriptychOverride } = props;
  const header = (
    <>
      <CardKicker name={output.cardName} bodyPart={output.bodyPart} />
      <CardQuestion id="path" />
      <CardHeader text="how this shape moves through work, love, and giving" />
    </>
  );

  const pathPatternNoteText =
    output.patternNote ?? patternNoteFromCardName(output.cardName);

  // CC-REACT-ON-SCREEN-LLM-RENDER — when the LLM rewrite is available,
  // replace the engine PathExpanded body with the LlmProseBlock. The
  // Pattern Note still renders below as a structural close.
  const body = llmRewriteMarkdown ? (
    <div className="flex flex-col" style={{ gap: 22 }}>
      <LlmProseBlock markdown={llmRewriteMarkdown} />
      {pathPatternNoteText ? (
        <Cell label="Pattern Note" text={pathPatternNoteText} variant="aphorism" />
      ) : null}
    </div>
  ) : (
    <div className="flex flex-col" style={{ gap: 22 }}>
      <PathExpanded
        output={output}
        masterSynthesisOverride={pathMasterSynthesis}
        pathTriptychOverride={pathTriptychOverride}
      />
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
