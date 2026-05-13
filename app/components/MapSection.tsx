"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  DemographicSet,
  FullSwotOutput,
  InnerConstitution,
  PathOutput,
} from "../../lib/types";
import ShapeCard from "./ShapeCard";
import {
  ageWeatherHook,
  detectCrossCardPatterns,
  getTopCompassValues,
  getTopGravityAttribution,
  maritalStatusLoveHook,
  professionWorkHook,
  type ShapeCardId,
} from "../../lib/identityEngine";
import {
  SHAPE_CARD_MAP_SIZE_PX,
  SHAPE_CARD_SVG_PATHS,
} from "../../lib/cardAssets";
import {
  composeCompassMovementNote,
  composeConvictionMovementNote,
  composeFireMovementNote,
  composeGravityMovementNote,
  composeLensMovementNote,
  composePathMasterSynthesis,
  composeTrustCorrectionChannel,
  composeWeatherStateVsShape,
} from "../../lib/synthesis1Finish";

type Props = {
  constitution: InnerConstitution;
  mbtiSlot?: ReactNode;
  // CC-022b — render-time enhancements: name threading, demographic
  // interpolation (profession hook on Path Work; marital hook on Love;
  // age hook on Weather), and cross-card pattern prose insertion.
  demographics?: DemographicSet | null;
};

const CARD_KEYS = [
  "lens",
  "compass",
  "conviction",
  "gravity",
  "trust",
  "weather",
  "fire",
  "path",
] as const;

type CardKey = typeof CARD_KEYS[number];

export default function MapSection({
  constitution,
  mbtiSlot,
  demographics,
}: Props) {
  const [expanded, setExpanded] = useState<Record<CardKey, boolean>>({
    lens: false,
    compass: false,
    conviction: false,
    gravity: false,
    trust: false,
    weather: false,
    fire: false,
    path: false,
  });

  function toggle(key: CardKey) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setAll(value: boolean) {
    setExpanded({
      lens: value,
      compass: value,
      conviction: value,
      gravity: value,
      trust: value,
      weather: value,
      fire: value,
      path: value,
    });
  }

  // CC-020 — print-expand bridge. ShapeCard renders the body conditionally
  // (collapsed cards are absent from the DOM), so CSS alone can't surface
  // them in print. We snapshot the user's pre-print expansion state on
  // beforeprint, expand everything for the print render, and restore on
  // afterprint. Browsers fire beforeprint before painting the print
  // preview, so the expanded DOM is what reaches the printer.
  const preprintSnapshotRef = useRef<Record<CardKey, boolean> | null>(null);
  useEffect(() => {
    function handleBeforePrint() {
      preprintSnapshotRef.current = expanded;
      setAll(true);
    }
    function handleAfterPrint() {
      const snap = preprintSnapshotRef.current;
      if (snap) setExpanded(snap);
      preprintSnapshotRef.current = null;
    }
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [expanded]);

  const anyExpanded = CARD_KEYS.some((k) => expanded[k]);
  const shape = constitution.shape_outputs;

  // CC-022b Items 4 + 2 — compute cross-card patterns + demographic hooks.
  // All render-time computations (per Rule 4 amendment); the InnerConstitution
  // stored on disk stays demographic-blind.
  const patternsByCard = useMemo(() => {
    const topCompass = getTopCompassValues(constitution.signals);
    const topGravity = getTopGravityAttribution(constitution.signals);
    const detected = detectCrossCardPatterns(
      constitution.signals,
      topCompass,
      topGravity,
      constitution.lens_stack,
      constitution.meta_signals,
      demographics
    );
    const grouped = new Map<ShapeCardId, string[]>();
    for (const { pattern, prose } of detected) {
      const list = grouped.get(pattern.applicable_card) ?? [];
      list.push(prose);
      grouped.set(pattern.applicable_card, list);
    }
    return grouped;
  }, [constitution, demographics]);

  // CC-SYNTHESIS-1-FINISH — per-card synthesis lines computed once and
  // memoized so the 6 composer calls run in one pass (instead of once
  // per render). Sections B (Trust) + C (Weather) + E (Movement Notes
  // on Lens / Compass / Conviction / Gravity / Fire) + F (Path master
  // synthesis paragraph) all attach to the appropriate ShapeCard slot.
  //
  // CC-SYNTHESIS-3 — `pathMaster` prefers the LLM-articulated cached
  // paragraph (`shape_outputs.path.masterSynthesisLlm`) when present;
  // falls back to the mechanical CC-SYNTHESIS-1F composer otherwise.
  const synthLines = useMemo(
    () => ({
      lens: composeLensMovementNote(constitution),
      compass: composeCompassMovementNote(constitution),
      conviction: composeConvictionMovementNote(constitution),
      gravity: composeGravityMovementNote(constitution),
      trust: composeTrustCorrectionChannel(constitution),
      weather: composeWeatherStateVsShape(constitution),
      fire: composeFireMovementNote(constitution),
      pathMaster:
        constitution.shape_outputs.path.masterSynthesisLlm ??
        composePathMasterSynthesis(constitution),
    }),
    [constitution]
  );

  // CC-022b Item 2 — demographic-augmented Path output. Append the
  // profession hook to the Work subsection prose; marital hook to Love.
  // Original strings preserved when no specified-state demographic exists.
  const pathOutput: PathOutput = useMemo(() => {
    const base = shape.path;
    const dom = constitution.lens_stack.dominant;
    const profHook = professionWorkHook(demographics, dom);
    const loveHook = maritalStatusLoveHook(demographics);
    return {
      ...base,
      work: profHook ? `${base.work} ${profHook}` : base.work,
      love: loveHook ? `${base.love} ${loveHook}` : base.love,
    };
  }, [shape.path, constitution.lens_stack, demographics]);

  // CC-022b Item 2 — Weather output gets the age hook appended to the
  // Strength text (where the formation-context read lands).
  const weatherOutput: FullSwotOutput = useMemo(() => {
    const base = shape.weather;
    const ageHook = ageWeatherHook(demographics);
    if (!ageHook) return base;
    return {
      ...base,
      gift: { ...base.gift, text: `${base.gift.text} ${ageHook}` },
    };
  }, [shape.weather, demographics]);

  return (
    <section className="flex flex-col" data-print-expand="map" style={{ gap: 0 }}>
      {/* Section header */}
      <header
        className="flex flex-row items-center justify-between"
        style={{ paddingBottom: 14, gap: 16 }}
      >
        <div className="flex flex-col" style={{ gap: 4 }}>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            Map · go deeper
          </p>
          <p
            className="font-serif italic"
            style={{
              fontSize: 14,
              color: "var(--ink-soft)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            eight cards under the Mirror — open whichever you want to inspect
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAll(!anyExpanded)}
          data-focus-ring
          data-print-hide="interactive"
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            flex: "0 0 auto",
          }}
        >
          {anyExpanded ? "collapse all" : "show all"}
        </button>
      </header>

      <div
        style={{
          height: 1,
          background: "var(--rule)",
          marginBottom: 4,
        }}
      />

      <CardSvgPlate cardId="lens" />
      <ShapeCard
        variant="full-swot"
        output={shape.lens}
        mbtiSlot={mbtiSlot}
        mode="accordion"
        expanded={expanded.lens}
        onToggle={() => toggle("lens")}
        synthesisLine={synthLines.lens}
      />
      <CrossCardPatternBlock
        cardId="lens"
        expanded={expanded.lens}
        proses={patternsByCard.get("lens")}
      />
      <CardSvgPlate cardId="compass" />
      <ShapeCard
        variant="full-swot"
        output={shape.compass}
        mode="accordion"
        expanded={expanded.compass}
        onToggle={() => toggle("compass")}
        synthesisLine={synthLines.compass}
      />
      {/* CC-054 — Peace + Faith cross-signal disambiguation. Renders
          inside the expanded Compass card body (gated on expanded.compass)
          adjacent to the existing Strength / Growth Edge blocks. Each
          prose block is silent when the corresponding sacred value
          (peace_priority / faith_priority) is not in the user's Compass
          top 5. The faith block contains a two-paragraph composition
          (Shape \\n\\n Texture) joined with a blank line, rendered with
          whiteSpace: "pre-line" so the paragraph break preserves. */}
      {expanded.compass && (shape.compass.peace_register_prose || shape.compass.faith_register_prose) ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "16px 20px 12px 20px",
            margin: "0 0 4px 0",
            borderLeft: "2px solid var(--rule, #d4c8a8)",
            background: "var(--paper, #f7f1e6)",
          }}
        >
          {shape.compass.peace_register_prose ? (
            <p
              className="font-serif"
              style={{
                fontSize: 14.5,
                lineHeight: 1.6,
                color: "var(--ink, #2b2417)",
                margin: 0,
              }}
            >
              {shape.compass.peace_register_prose}
            </p>
          ) : null}
          {shape.compass.faith_register_prose ? (
            <p
              className="font-serif"
              style={{
                fontSize: 14.5,
                lineHeight: 1.6,
                color: "var(--ink, #2b2417)",
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {shape.compass.faith_register_prose}
            </p>
          ) : null}
        </div>
      ) : null}
      <CrossCardPatternBlock
        cardId="compass"
        expanded={expanded.compass}
        proses={patternsByCard.get("compass")}
      />
      {/* CC-HANDS-CARD — 9th body card. Inserts after Heart/Compass and
          before the next card (Voice/Conviction in this React render
          order). Existential Goal-axis card with dual-mode read. */}
      {constitution.handsCard ? (
        <section
          className="font-serif"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "20px 22px",
            margin: "6px 0",
            borderLeft: "2px solid var(--rule, #d4c8a8)",
            background: "var(--paper, #f7f1e6)",
          }}
        >
          <h3
            style={{
              fontSize: 17,
              fontWeight: 600,
              margin: 0,
              color: "var(--ink, #2b2417)",
            }}
          >
            Hands — Work
          </h3>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: 0,
              color: "var(--ink-soft, #6f6555)",
            }}
          >
            What you build and carry
          </p>
          <p style={{ fontStyle: "italic", margin: 0, lineHeight: 1.55 }}>
            {constitution.handsCard.openingLine}
          </p>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            <strong>Strength</strong> — {constitution.handsCard.strength}
          </p>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            <strong>Growth Edge</strong> —{" "}
            {constitution.handsCard.growthEdge}
          </p>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            <strong>Under Pressure</strong> — In health:{" "}
            {constitution.handsCard.underPressure.healthRegister} Under load:{" "}
            {constitution.handsCard.underPressure.pressureRegister}{" "}
            {constitution.handsCard.underPressure.integrationLine}
          </p>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            <strong>Practice</strong> — {constitution.handsCard.practice}
          </p>
          <p style={{ fontStyle: "italic", margin: 0, lineHeight: 1.55 }}>
            {constitution.handsCard.movementNote}
          </p>
          <p style={{ fontStyle: "italic", margin: 0, lineHeight: 1.55 }}>
            {constitution.handsCard.closingLine}
          </p>
          <p
            style={{
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.55,
              fontSize: 13,
              color: "var(--ink-soft, #6f6555)",
            }}
          >
            Hands is what your life makes real. Work Map is where that making
            may fit.
          </p>
        </section>
      ) : null}
      <CardSvgPlate cardId="conviction" />
      <ShapeCard
        variant="conviction"
        output={shape.conviction}
        mode="accordion"
        expanded={expanded.conviction}
        onToggle={() => toggle("conviction")}
        synthesisLine={synthLines.conviction}
      />
      <CrossCardPatternBlock
        cardId="conviction"
        expanded={expanded.conviction}
        proses={patternsByCard.get("conviction")}
      />
      <CardSvgPlate cardId="gravity" />
      <ShapeCard
        variant="full-swot"
        output={shape.gravity}
        mode="accordion"
        expanded={expanded.gravity}
        onToggle={() => toggle("gravity")}
        synthesisLine={synthLines.gravity}
      />
      <CrossCardPatternBlock
        cardId="gravity"
        expanded={expanded.gravity}
        proses={patternsByCard.get("gravity")}
      />
      <CardSvgPlate cardId="trust" />
      <ShapeCard
        variant="full-swot"
        output={shape.trust}
        mode="accordion"
        expanded={expanded.trust}
        onToggle={() => toggle("trust")}
        synthesisLine={synthLines.trust}
      />
      <CrossCardPatternBlock
        cardId="trust"
        expanded={expanded.trust}
        proses={patternsByCard.get("trust")}
      />
      <CardSvgPlate cardId="weather" />
      <ShapeCard
        variant="full-swot"
        output={weatherOutput}
        mode="accordion"
        expanded={expanded.weather}
        onToggle={() => toggle("weather")}
        synthesisLine={synthLines.weather}
      />
      <CrossCardPatternBlock
        cardId="weather"
        expanded={expanded.weather}
        proses={patternsByCard.get("weather")}
      />
      <CardSvgPlate cardId="fire" />
      <ShapeCard
        variant="full-swot"
        output={shape.fire}
        mode="accordion"
        expanded={expanded.fire}
        onToggle={() => toggle("fire")}
        synthesisLine={synthLines.fire}
      />
      <CrossCardPatternBlock
        cardId="fire"
        expanded={expanded.fire}
        proses={patternsByCard.get("fire")}
      />
      <CardSvgPlate cardId="path" />
      <ShapeCard
        variant="path"
        output={pathOutput}
        mode="accordion"
        expanded={expanded.path}
        onToggle={() => toggle("path")}
        pathMasterSynthesis={synthLines.pathMaster}
      />
      <CrossCardPatternBlock
        cardId="path"
        expanded={expanded.path}
        proses={patternsByCard.get("path")}
      />
    </section>
  );
}

// CC-022e — body-map SVG plate rendered above each ShapeCard. Visible
// whether the accordion is collapsed or expanded; participates in print
// via the existing beforeprint bridge above. The SVG is decorative-with-
// meaning: the kicker / heading on the ShapeCard below already names the
// card, so alt="" avoids screen-reader double-naming. Plain <img> per
// spec — these are static SVGs, no responsive variants needed; the
// project doesn't already use next/image so we don't introduce it here.
function CardSvgPlate({ cardId }: { cardId: ShapeCardId }) {
  return (
    <div
      data-card-svg={cardId}
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 24,
        marginBottom: 12,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SHAPE_CARD_SVG_PATHS[cardId]}
        alt=""
        width={SHAPE_CARD_MAP_SIZE_PX}
        height={SHAPE_CARD_MAP_SIZE_PX}
        style={{
          width: SHAPE_CARD_MAP_SIZE_PX,
          height: SHAPE_CARD_MAP_SIZE_PX,
          display: "block",
        }}
      />
    </div>
  );
}

// CC-022b Item 4 — pattern prose is rendered as a sibling of each
// ShapeCard, visible only when that card is expanded. Visually it appears
// inside the card's open panel — the eye reads it as part of the card's
// content rather than as orphan paragraphs between collapsed cards.
function CrossCardPatternBlock({
  cardId,
  expanded,
  proses,
}: {
  cardId: ShapeCardId;
  expanded: boolean;
  proses: string[] | undefined;
}) {
  if (!expanded) return null;
  if (!proses || proses.length === 0) return null;
  return (
    <div
      data-cross-card-pattern={cardId}
      className="flex flex-col"
      style={{
        gap: 10,
        padding: "12px 16px",
        marginBottom: 18,
        borderLeft: "2px solid var(--umber-soft)",
        background: "var(--umber-wash)",
      }}
    >
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        Pattern in motion
      </p>
      {proses.map((prose, i) => (
        <p
          key={`${cardId}-pattern-${i}`}
          className="font-serif"
          style={{
            fontSize: 14.5,
            color: "var(--ink)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {prose}
        </p>
      ))}
    </div>
  );
}
