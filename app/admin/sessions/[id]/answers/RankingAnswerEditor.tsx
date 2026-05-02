"use client";

// CC-053 — Admin ranking-answer editor. Numbered list with up/down buttons.
// Item set is read from `question.items` (canonical order); admin reorders;
// on save, the new order persists. No drag-and-drop in v1 — keyboard-
// accessible up/down buttons are simpler, sufficient for admin tooling, and
// avoid the dnd-kit dependency the user-facing Ranking component carries.

import { useState } from "react";
import type {
  Answer,
  RankingAnswer,
  RankingItem,
  RankingQuestion,
} from "../../../../../lib/types";

type Props = {
  question: RankingQuestion;
  currentAnswer: RankingAnswer | undefined;
  onSave: (newAnswer: Answer) => Promise<void>;
  onCancel: () => void;
};

export default function RankingAnswerEditor({
  question,
  currentAnswer,
  onSave,
  onCancel,
}: Props) {
  // Build initial order: user's saved order, with any missing canonical
  // items appended (handles cases where the canonical item set has shifted
  // since the answer was saved).
  const canonicalIds = question.items.map((i) => i.id);
  const savedOrder = currentAnswer?.order ?? [];
  const validSaved = savedOrder.filter((id) => canonicalIds.includes(id));
  const missing = canonicalIds.filter((id) => !validSaved.includes(id));
  const initial = [...validSaved, ...missing];

  const [order, setOrder] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);

  function move(idx: number, delta: number) {
    const target = idx + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  }

  function itemFor(id: string): RankingItem | undefined {
    return question.items.find((i) => i.id === id);
  }

  async function handleSave() {
    setSaving(true);
    const newAnswer: RankingAnswer = {
      question_id: question.question_id,
      card_id: question.card_id,
      question_text: question.text,
      type: "ranking",
      order,
      // Preserve overlay if user originally set one (allocation-ranking
      // CC-016 register). Admin doesn't edit overlays in v1.
      overlay: currentAnswer?.overlay,
    };
    try {
      await onSave(newAnswer);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <ol
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {order.map((id, idx) => {
          const item = itemFor(id);
          return (
            <li
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                border: "1px solid var(--rule, #d4c8a8)",
                background: "var(--paper, #f7f1e6)",
                fontSize: 13,
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-mute, #6a5d40)",
                  minWidth: 22,
                }}
              >
                {idx + 1}.
              </span>
              <span style={{ flex: 1 }}>{item?.label ?? id}</span>
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0 || saving}
                aria-label="Move up"
                className="font-mono"
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  border: "1px solid var(--rule, #d4c8a8)",
                  background: "transparent",
                  cursor: idx === 0 ? "default" : "pointer",
                  opacity: idx === 0 ? 0.4 : 1,
                }}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === order.length - 1 || saving}
                aria-label="Move down"
                className="font-mono"
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  border: "1px solid var(--rule, #d4c8a8)",
                  background: "transparent",
                  cursor: idx === order.length - 1 ? "default" : "pointer",
                  opacity: idx === order.length - 1 ? 0.4 : 1,
                }}
              >
                ↓
              </button>
            </li>
          );
        })}
      </ol>
      <EditorButtons onSave={handleSave} onCancel={onCancel} saving={saving} />
    </div>
  );
}

function EditorButtons({
  onSave,
  onCancel,
  saving,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.10em",
          padding: "4px 12px",
          border: "1px solid var(--ink, #2b2417)",
          background: "var(--ink, #2b2417)",
          color: "var(--paper, #f7f1e6)",
          cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.5 : 1,
        }}
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.10em",
          padding: "4px 12px",
          border: "1px solid var(--rule, #d4c8a8)",
          background: "transparent",
          color: "var(--ink, #2b2417)",
          cursor: saving ? "default" : "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );
}
