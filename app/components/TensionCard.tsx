"use client";

import { useState } from "react";
import { questions } from "../../data/questions";
import { SIGNAL_DESCRIPTIONS } from "../../lib/identityEngine";
import type {
  CardId,
  SignalId,
  Tension,
  TensionStatus,
} from "../../lib/types";

const CARD_LABEL: Record<CardId, string> = {
  conviction: "Conviction",
  pressure: "Pressure",
  formation: "Formation",
  context: "Context",
  agency: "Agency",
  sacred: "Sacred",
  role: "Role",
  temperament: "Four Voices",
  contradiction: "Contradiction",
};

type Mode = "open" | "confirmed";

type Props = {
  tension: Tension;
  mode: Mode;
  status: TensionStatus;
  note: string;
  explainOpen: boolean;
  onSetStatus: (status: TensionStatus) => void;
  onToggleExplain: () => void;
  onSetNote: (note: string) => void;
  onEditResponse: () => void;
};

function findQuestionForSignal(signalId: SignalId): string | null {
  for (const q of questions) {
    if (q.type === "ranking") {
      if (q.items.some((it) => it.signal === signalId)) return q.question_id;
    } else if (q.type === "forced") {
      if (q.options.some((o) => o.signal === signalId)) return q.question_id;
    }
  }
  return null;
}

function humanizeSignalId(id: SignalId): string {
  return id.replace(/_/g, " ");
}

function describeSignal(signalId: SignalId): string {
  const desc = SIGNAL_DESCRIPTIONS[signalId];
  if (desc && desc.trim().length > 0) {
    return desc.trim().replace(/\.$/, "");
  }
  return humanizeSignalId(signalId);
}

function ProvenanceDisclosure({ tension }: { tension: Tension }) {
  const [open, setOpen] = useState(false);
  const items = tension.signals_involved;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-focus-ring
        className="self-start font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          background: "transparent",
          border: "none",
          padding: "4px 0",
          cursor: "pointer",
        }}
      >
        {open ? "− hide source" : "tell me more"}
      </button>
      {open ? (
        <div
          className="flex flex-col gap-3"
          style={{
            paddingLeft: 12,
            borderLeft: "2px solid var(--rule-soft)",
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
            this tension was surfaced because:
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {items.map((s, idx) => {
              const cardLabel = CARD_LABEL[s.from_card] ?? s.from_card;
              const qid = findQuestionForSignal(s.signal_id);
              const sentence = describeSignal(s.signal_id);
              return (
                <li
                  key={`${s.signal_id}-${idx}`}
                  className="font-serif"
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: "var(--ink-soft)",
                  }}
                >
                  • {sentence}
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: "var(--ink-mute)",
                      marginLeft: 6,
                    }}
                  >
                    ({qid ? `from ${qid} in ${cardLabel}` : `from ${cardLabel}`})
                  </span>
                </li>
              );
            })}
          </ul>
          {tension.strengthened_by.length > 0 ? (
            <p
              className="font-serif italic"
              style={{
                fontSize: 13,
                color: "var(--ink-soft)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Confidence raised by your written response
              {tension.strengthened_by[0]?.source_question_ids[0]
                ? ` to ${tension.strengthened_by[0].source_question_ids[0]}`
                : ""}.
            </p>
          ) : null}
          <p
            className="font-serif italic"
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            The combination of these signals at high enough rank to fire the
            rule is what put this on the table. You are the final authority on
            whether it actually fits.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatusDot({ status }: { status: TensionStatus }) {
  const color =
    status === "confirmed"
      ? "var(--umber)"
      : status === "partially_confirmed"
      ? "var(--umber-soft)"
      : status === "rejected"
      ? "var(--ink-faint)"
      : "var(--ink-faint)";
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
        display: "inline-block",
      }}
    />
  );
}

function ConfirmAffordance({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
        padding: "8px 14px",
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

export default function TensionCard({
  tension,
  mode,
  status,
  note,
  explainOpen,
  onSetStatus,
  onToggleExplain,
  onSetNote,
  onEditResponse,
}: Props) {
  const statusLabel =
    status === "confirmed"
      ? "confirmed"
      : status === "partially_confirmed"
      ? "partly"
      : status === "rejected"
      ? "set aside"
      : "open";

  return (
    <article
      style={{
        borderLeft: "2px solid var(--umber-soft)",
        paddingLeft: 18,
        paddingTop: 6,
        paddingBottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <header
        style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}
      >
        {/* CC-025 Step 2.5A — T-### internal IDs no longer surfaced
            user-facing. Engine bookkeeping still uses tension_id; UI shows
            descriptive tension.type only. */}
        <span
          className="font-serif italic"
          style={{
            fontSize: 18,
            color: "var(--ink)",
          }}
        >
          {tension.type}
        </span>
        <span
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <StatusDot status={status} />
          <span
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
            }}
          >
            {statusLabel}
          </span>
        </span>
      </header>

      <p
        className="text-[15px] md:text-[15.5px]"
        style={{ color: "var(--ink-soft)", lineHeight: 1.55, margin: 0 }}
      >
        {tension.description}
      </p>
      <p
        className="font-serif italic text-[16px] md:text-[17px]"
        style={{
          color: "var(--ink-soft)",
          lineHeight: 1.55,
          margin: 0,
          // CC-025 — allocation tensions carry `\n\n` paragraph breaks; pre-line
          // preserves them without splitting into multiple paragraphs here.
          whiteSpace: "pre-line",
        }}
      >
        {tension.user_prompt}
      </p>

      {mode === "open" ? (
        <div data-print-hide="interactive" className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <ConfirmAffordance
              active={status === "confirmed"}
              onClick={() => onSetStatus("confirmed")}
            >
              Yes
            </ConfirmAffordance>
            <ConfirmAffordance
              active={status === "partially_confirmed"}
              onClick={() => onSetStatus("partially_confirmed")}
            >
              Partially
            </ConfirmAffordance>
            <ConfirmAffordance
              active={status === "rejected"}
              onClick={() => onSetStatus("rejected")}
            >
              No
            </ConfirmAffordance>
            <ConfirmAffordance
              active={explainOpen}
              onClick={onToggleExplain}
            >
              Explain
            </ConfirmAffordance>
          </div>
          {explainOpen ? (
            <textarea
              value={note}
              onChange={(e) => onSetNote(e.target.value)}
              placeholder="In your own words…"
              rows={3}
              data-focus-ring
              className="w-full font-serif"
              style={{
                background: "var(--paper-warm)",
                border: "1px solid var(--rule)",
                color: "var(--ink)",
                padding: 12,
                fontSize: 14,
                lineHeight: 1.5,
                borderRadius: 6,
                resize: "vertical",
              }}
            />
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={onEditResponse}
          data-focus-ring
          data-print-hide="interactive"
          className="self-start font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            background: "transparent",
            border: "none",
            padding: "4px 0",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          edit response
        </button>
      )}

      <div data-print-hide="interactive">
        <ProvenanceDisclosure tension={tension} />
      </div>
    </article>
  );
}
