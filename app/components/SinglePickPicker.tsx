"use client";

import type { KeyboardEvent } from "react";
import type { RankingItem } from "../../lib/types";

type Props = {
  items: RankingItem[];
  selectedId: string | null;
  onChange: (pickedId: string) => void;
};

export default function SinglePickPicker({
  items,
  selectedId,
  onChange,
}: Props) {
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(id);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Pick the option that feels closest"
      className="flex flex-col"
      style={{ gap: 12 }}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        const showVoice = !!item.quote;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, item.id)}
            data-focus-ring
            className="text-left"
            style={{
              background: selected ? "var(--umber-wash)" : "var(--paper-warm)",
              border: selected
                ? "1px solid var(--umber)"
                : "1px solid var(--rule)",
              padding: "16px 18px",
              borderRadius: 8,
              cursor: "pointer",
              transition:
                "background 120ms ease-out, border-color 120ms ease-out",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                flex: "0 0 auto",
                marginTop: 4,
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: selected
                  ? "1px solid var(--umber)"
                  : "1px solid var(--rule)",
                background: selected ? "var(--umber)" : "transparent",
                boxShadow: selected
                  ? "inset 0 0 0 2px var(--paper-warm)"
                  : "none",
              }}
            />
            <span className="flex flex-col" style={{ gap: 8, minWidth: 0 }}>
              <span
                className="font-mono uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: "var(--ink-mute)",
                }}
              >
                {item.label}
              </span>
              {showVoice ? (
                <span
                  className="font-serif italic"
                  style={{
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: "var(--ink)",
                  }}
                >
                  {item.quote}
                </span>
              ) : null}
              {item.example ? (
                <span
                  className="font-serif"
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    color: "var(--ink-soft)",
                  }}
                >
                  {item.example}
                </span>
              ) : item.gloss ? (
                <span
                  className="font-serif"
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    color: "var(--ink-soft)",
                  }}
                >
                  {item.gloss}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
