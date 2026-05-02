"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  Answer,
  BeliefUnderTension,
  ConvictionTemperature,
  DemographicSet,
  EpistemicPosture,
  ValueDomain,
} from "../../lib/types";
import { generateBeliefContextProse, noAnchorLine } from "../../lib/beliefHeuristics";

type Props = {
  belief: BeliefUnderTension;
  valueListPhrase: string;
  // CC-022b Item 3 — when provided, generateBeliefContextProse cites the
  // user's actual Q-I2 / Q-I3 selections back to them by source-question
  // label. When omitted (older sessions, callers without context), the
  // function falls back to generic dimension-label prose.
  answers?: Answer[];
  // CC-022b Item 1 — passed through to generateBeliefContextProse so the
  // citation prose can substitute the user's name where appropriate.
  demographics?: DemographicSet | null;
};

// ── Per-tag option lists (for the "Different" dropdown) ──────────────────
// CC-017 — three dimensions only. CONTEXT_OPTIONS and COST_OPTIONS retired.

const VALUE_DOMAIN_OPTIONS: { value: ValueDomain; label: string }[] = [
  { value: "truth", label: "Truth" },
  { value: "freedom", label: "Freedom" },
  { value: "loyalty", label: "Loyalty" },
  { value: "justice", label: "Justice" },
  { value: "faith", label: "Faith" },
  { value: "stability", label: "Stability" },
  { value: "knowledge", label: "Knowledge" },
  { value: "family", label: "Family" },
  { value: "unknown", label: "None of these / unsure" },
];

const TEMPERATURE_OPTIONS: { value: ConvictionTemperature; label: string }[] = [
  { value: "high", label: "Deeply held" },
  { value: "moderate", label: "Considered, not emphatic" },
  { value: "low", label: "Provisional, held lightly" },
  { value: "unknown", label: "None of these / unsure" },
];

const POSTURE_OPTIONS: { value: EpistemicPosture; label: string }[] = [
  { value: "open", label: "Open to revision with evidence" },
  { value: "rigid", label: "Held as identity, not hypothesis" },
  { value: "reflective", label: "Actively wrestling with it" },
  { value: "guarded", label: "Held privately rather than openly" },
  { value: "unknown", label: "None of these / unsure" },
];

const VALUE_LABEL_FROM_TAG: Record<ValueDomain, string> = {
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

const TEMPERATURE_LABEL_FROM_TAG: Record<ConvictionTemperature, string> = {
  high: "Deeply held",
  moderate: "Considered, not emphatic",
  low: "Provisional, held lightly",
  unknown: "Unsure",
};

const POSTURE_LABEL_FROM_TAG: Record<EpistemicPosture, string> = {
  open: "Open to revision with evidence",
  rigid: "Held as identity, not hypothesis",
  reflective: "Actively wrestling with it",
  guarded: "Held privately rather than openly",
  unknown: "Unsure",
};

// ── Tag-row UI primitives ────────────────────────────────────────────────

function ConfirmAffordance({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-focus-ring
      className="font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        padding: "6px 12px",
        background: active ? "var(--umber)" : "transparent",
        color: active ? "var(--paper)" : "var(--ink)",
        border: active ? "1px solid var(--umber)" : "1px solid var(--rule)",
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 120ms ease-out, color 120ms ease-out",
      }}
    >
      {children}
    </button>
  );
}

type TagRowState = "fresh" | "different_open" | "confirmed";

function TagRow<T extends string>({
  label,
  currentValue,
  currentLabel,
  options,
  userConfirmed,
  onConfirm,
  onChange,
}: {
  label: string;
  currentValue: T;
  currentLabel: string;
  options: { value: T; label: string }[];
  userConfirmed: boolean;
  onConfirm: () => void;
  onChange: (v: T) => void;
}) {
  const [rowState, setRowState] = useState<TagRowState>(
    userConfirmed ? "confirmed" : "fresh"
  );

  function handleConfirm() {
    onConfirm();
    setRowState("confirmed");
  }
  function handleDifferentOpen() {
    setRowState("different_open");
  }
  function handlePick(v: T) {
    onChange(v);
    setRowState("confirmed");
  }
  function handleSkip() {
    setRowState("fresh");
  }
  function handleEdit() {
    setRowState("different_open");
  }

  return (
    <div
      className="flex flex-col"
      style={{
        gap: 8,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottom: "1px solid var(--rule-soft)",
      }}
    >
      <div
        className="flex flex-row items-start"
        style={{ gap: 12, justifyContent: "space-between" }}
      >
        <div className="flex flex-col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            {label}
          </p>
          <p
            className="font-serif"
            style={{
              fontSize: 15,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {currentLabel}
          </p>
        </div>
        {rowState === "confirmed" ? (
          <div data-print-hide="interactive" className="flex flex-row items-center" style={{ gap: 10, flex: "0 0 auto" }}>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--ink-mute)" }}
            >
              confirmed
            </span>
            <button
              type="button"
              onClick={handleEdit}
              data-focus-ring
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "var(--ink-mute)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              edit
            </button>
          </div>
        ) : (
          <div data-print-hide="interactive" className="flex flex-row flex-wrap" style={{ gap: 6, flex: "0 0 auto" }}>
            <ConfirmAffordance active={false} onClick={handleConfirm}>Yes</ConfirmAffordance>
            <ConfirmAffordance active={rowState === "different_open"} onClick={handleDifferentOpen}>Different</ConfirmAffordance>
            <ConfirmAffordance active={false} onClick={handleSkip}>Skip</ConfirmAffordance>
          </div>
        )}
      </div>
      {rowState === "different_open" ? (
        <div
          data-print-hide="interactive"
          className="flex flex-col"
          style={{
            gap: 6,
            background: "var(--paper-warm)",
            padding: "10px 12px",
            borderRadius: 6,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handlePick(opt.value)}
              data-focus-ring
              className="font-serif text-left"
              style={{
                fontSize: 14.5,
                color: opt.value === currentValue ? "var(--ink)" : "var(--ink-soft)",
                background: "transparent",
                border: "none",
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: 4,
                lineHeight: 1.4,
              }}
            >
              {opt.label}
              {opt.value === currentValue ? (
                <span
                  className="font-mono uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    color: "var(--ink-mute)",
                    marginLeft: 8,
                  }}
                >
                  current
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VerbatimBlock({ label, text }: { label?: string; text: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {label ? (
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          {label}
        </p>
      ) : null}
      <blockquote
        className="font-serif italic"
        style={{
          fontSize: 15.5,
          color: "var(--ink-soft)",
          lineHeight: 1.6,
          margin: 0,
          paddingLeft: 14,
          borderLeft: "2px solid var(--umber)",
        }}
      >
        {text}
      </blockquote>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

export default function KeystoneReflection({
  belief,
  valueListPhrase,
  answers,
  demographics,
}: Props) {
  // CC-017 — local state for user overrides on the three structured-source
  // dimensions. The engine's derived value seeds the state; the user can pick
  // a different value via the Different dropdown. No confirmation flags on
  // BUT itself — confidence is implicit in the structured source.
  const [editableValueDomain, setEditableValueDomain] = useState<ValueDomain>(
    belief.value_domain
  );
  const [editableTemperature, setEditableTemperature] = useState<ConvictionTemperature>(
    belief.conviction_temperature
  );
  const [editablePosture, setEditablePosture] = useState<EpistemicPosture>(
    belief.epistemic_posture
  );
  // CC-017 — track whether the user has confirmed each tag; used to seed the
  // TagRow's "confirmed" state but not stored back on BeliefUnderTension.
  const [valueDomainConfirmed, setValueDomainConfirmed] = useState(false);
  const [temperatureConfirmed, setTemperatureConfirmed] = useState(false);
  const [postureConfirmed, setPostureConfirmed] = useState(false);

  // Compose the BUT for prose generation from local state (so user overrides
  // re-render the prose).
  const editableBelief: BeliefUnderTension = useMemo(
    () => ({
      belief_text: belief.belief_text,
      belief_source_question_id: belief.belief_source_question_id,
      value_domain: editableValueDomain,
      conviction_temperature: editableTemperature,
      epistemic_posture: editablePosture,
    }),
    [belief, editableValueDomain, editableTemperature, editablePosture]
  );

  const contextualProse = useMemo(() => {
    if (!editableBelief.belief_text) return noAnchorLine();
    return generateBeliefContextProse(
      editableBelief,
      valueListPhrase,
      answers,
      demographics
    );
  }, [editableBelief, valueListPhrase, answers, demographics]);

  return (
    <section className="flex flex-col" style={{ gap: 18 }}>
      <header className="flex flex-col" style={{ gap: 4 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Keystone Reflection
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
          the belief you named, where it sits in your shape.
        </p>
      </header>

      {editableBelief.belief_text ? (
        <VerbatimBlock text={editableBelief.belief_text} />
      ) : null}

      {editableBelief.belief_text ? (
        <div
          className="flex flex-col"
          style={{
            gap: 0,
            background: "var(--paper-warm)",
            borderRadius: 8,
            padding: "14px 16px",
            border: "1px solid var(--rule-soft)",
          }}
        >
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
              margin: 0,
              paddingBottom: 10,
              borderBottom: "1px solid var(--rule)",
            }}
          >
            The model proposes — you confirm
          </p>
          <TagRow
            label="Likely value"
            currentValue={editableValueDomain}
            currentLabel={VALUE_LABEL_FROM_TAG[editableValueDomain]}
            options={VALUE_DOMAIN_OPTIONS}
            userConfirmed={valueDomainConfirmed}
            onConfirm={() => setValueDomainConfirmed(true)}
            onChange={(v) => {
              setEditableValueDomain(v);
              setValueDomainConfirmed(true);
            }}
          />
          <TagRow
            label="Wording temperature"
            currentValue={editableTemperature}
            currentLabel={TEMPERATURE_LABEL_FROM_TAG[editableTemperature]}
            options={TEMPERATURE_OPTIONS}
            userConfirmed={temperatureConfirmed}
            onConfirm={() => setTemperatureConfirmed(true)}
            onChange={(v) => {
              setEditableTemperature(v);
              setTemperatureConfirmed(true);
            }}
          />
          <TagRow
            label="Openness to revision"
            currentValue={editablePosture}
            currentLabel={POSTURE_LABEL_FROM_TAG[editablePosture]}
            options={POSTURE_OPTIONS}
            userConfirmed={postureConfirmed}
            onConfirm={() => setPostureConfirmed(true)}
            onChange={(v) => {
              setEditablePosture(v);
              setPostureConfirmed(true);
            }}
          />
        </div>
      ) : null}

      <p
        className="font-serif"
        style={{
          fontSize: 15.5,
          color: "var(--ink)",
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {contextualProse}
      </p>
    </section>
  );
}
