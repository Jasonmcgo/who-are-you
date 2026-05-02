"use client";

// CC-053 — Admin freeform-answer editor. Text-area pre-filled with the
// user's response. No length validation; engine handles missing/short
// content gracefully (Q-I1's `belief_under_tension` extraction guards on
// non-empty text).

import { useState } from "react";
import type {
  Answer,
  ForcedFreeformAnswer,
  ForcedFreeformQuestion,
} from "../../../../../lib/types";

type Props = {
  question: ForcedFreeformQuestion;
  currentAnswer: ForcedFreeformAnswer | undefined;
  onSave: (newAnswer: Answer) => Promise<void>;
  onCancel: () => void;
};

export default function FreeformAnswerEditor({
  question,
  currentAnswer,
  onSave,
  onCancel,
}: Props) {
  const [text, setText] = useState(currentAnswer?.response ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const newAnswer: ForcedFreeformAnswer = {
      question_id: question.question_id,
      card_id: question.card_id,
      question_text: question.text,
      type: "freeform",
      response: text,
    };
    try {
      await onSave(newAnswer);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        disabled={saving}
        className="font-serif"
        style={{
          width: "100%",
          padding: 8,
          fontSize: 13.5,
          lineHeight: 1.5,
          border: "1px solid var(--rule, #d4c8a8)",
          background: "var(--paper, #f7f1e6)",
          color: "var(--ink, #2b2417)",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
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
    </div>
  );
}
