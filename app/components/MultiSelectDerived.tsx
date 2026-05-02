"use client";

import type { ReactNode } from "react";

// CC-017 — MultiSelectDerived. Renders the user's belief anchor in a quoted
// callout above a check-all-that-apply panel of derived items + None + Other.
// Used by Q-I2 (trust drivers) and Q-I3 (sacred drivers). Items are derived
// at render time from the user's already-ranked Trust / Compass card answers
// and passed in as props by the parent (app/page.tsx).

export type DerivedItem = {
  id: string;
  label: string;
  gloss?: string;
  signal: string;
  source_question_id: string;
};

type Props = {
  beliefAnchor: string | null;
  items: DerivedItem[];
  noneOption: { id: string; label: string };
  otherOption: { id: string; label: string; allows_text?: boolean };
  // Selected ids — includes the noneOption.id when None is checked, and the
  // otherOption.id when Other is checked.
  selectedIds: string[];
  otherText: string;
  onSelectionsChange: (selectedIds: string[]) => void;
  onOtherTextChange: (text: string) => void;
};

function AnchorBlock({ text }: { text: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        looking at the belief you named
      </p>
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

function CheckRow({
  checked,
  onToggle,
  children,
  variant = "default",
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
  variant?: "default" | "muted";
}) {
  const isMuted = variant === "muted";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      data-focus-ring
      className="text-left"
      style={{
        background: checked ? "var(--umber-wash)" : "var(--paper-warm)",
        border: checked
          ? "1px solid var(--umber)"
          : "1px solid var(--rule)",
        padding: "12px 14px",
        borderRadius: 8,
        cursor: "pointer",
        transition:
          "background 120ms ease-out, border-color 120ms ease-out",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        opacity: isMuted ? 0.92 : 1,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: "0 0 auto",
          marginTop: 3,
          width: 14,
          height: 14,
          borderRadius: 3,
          border: checked
            ? "1px solid var(--umber)"
            : "1px solid var(--rule)",
          background: checked ? "var(--umber)" : "transparent",
          boxShadow: checked
            ? "inset 0 0 0 2px var(--paper-warm)"
            : "none",
        }}
      />
      <span style={{ minWidth: 0, flex: 1 }}>{children}</span>
    </button>
  );
}

export default function MultiSelectDerived({
  beliefAnchor,
  items,
  noneOption,
  otherOption,
  selectedIds,
  otherText,
  onSelectionsChange,
  onOtherTextChange,
}: Props) {
  const noneChecked = selectedIds.includes(noneOption.id);
  const otherChecked = selectedIds.includes(otherOption.id);

  function toggleDerivedItem(id: string) {
    let next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    // Selecting any derived item clears None.
    if (next.includes(id) && next.includes(noneOption.id)) {
      next = next.filter((s) => s !== noneOption.id);
    }
    onSelectionsChange(next);
  }

  function toggleNone() {
    if (noneChecked) {
      onSelectionsChange(selectedIds.filter((s) => s !== noneOption.id));
    } else {
      // Selecting None clears all derived items AND Other.
      onSelectionsChange([noneOption.id]);
      onOtherTextChange("");
    }
  }

  function toggleOther() {
    if (otherChecked) {
      onSelectionsChange(selectedIds.filter((s) => s !== otherOption.id));
      onOtherTextChange("");
    } else {
      // Other is compatible with derived items but mutually exclusive with None.
      const next = selectedIds.filter((s) => s !== noneOption.id);
      onSelectionsChange([...next, otherOption.id]);
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      {beliefAnchor ? <AnchorBlock text={beliefAnchor} /> : null}

      <div className="flex flex-col" style={{ gap: 8 }}>
        {items.map((item) => {
          const checked = selectedIds.includes(item.id);
          return (
            <CheckRow
              key={item.id}
              checked={checked}
              onToggle={() => toggleDerivedItem(item.id)}
            >
              <p
                className="font-serif"
                style={{
                  fontSize: 15,
                  color: "var(--ink)",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                <span style={{ fontWeight: 500 }}>{item.label}</span>
                {item.gloss ? (
                  <span style={{ color: "var(--ink-soft)" }}>
                    {" — "}
                    {item.gloss}
                  </span>
                ) : null}
              </p>
            </CheckRow>
          );
        })}
      </div>

      <div
        className="flex flex-col"
        style={{
          gap: 8,
          paddingTop: 8,
          borderTop: "1px solid var(--rule-soft)",
        }}
      >
        <CheckRow
          checked={noneChecked}
          onToggle={toggleNone}
          variant="muted"
        >
          <p
            className="font-serif"
            style={{
              fontSize: 15,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {noneOption.label}
          </p>
        </CheckRow>
        <CheckRow checked={otherChecked} onToggle={toggleOther} variant="muted">
          <p
            className="font-serif"
            style={{
              fontSize: 15,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {otherOption.label}
          </p>
        </CheckRow>
        {otherChecked && otherOption.allows_text ? (
          <textarea
            value={otherText}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="In your own words…"
            rows={2}
            data-focus-ring
            className="w-full font-serif"
            style={{
              background: "var(--paper-warm)",
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              padding: 12,
              fontSize: 15,
              lineHeight: 1.5,
              borderRadius: 6,
              resize: "vertical",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
