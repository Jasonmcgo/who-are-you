"use client";

// CC-053 — Admin single-pick answer editor for forced-choice questions.
// Radio buttons; the user's current selection is pre-checked; save updates.
//
// Forced-choice answers come in two stored shapes depending on which user-
// facing component captured them: `ForcedFreeformAnswer` with
// type:"forced" + a string `response` (matching one of the option labels),
// or `SinglePickAnswer` with type:"single_pick" + `picked_id` /
// `picked_signal`. The editor produces a `ForcedFreeformAnswer` of
// type:"forced" since that's the dominant forced-choice shape in
// data/questions.ts.

import { useState } from "react";
import type {
  Answer,
  ForcedFreeformAnswer,
  ForcedFreeformQuestion,
  QuestionOption,
} from "../../../../../lib/types";

type Props = {
  question: ForcedFreeformQuestion;
  currentAnswer: ForcedFreeformAnswer | undefined;
  onSave: (newAnswer: Answer) => Promise<void>;
  onCancel: () => void;
};

export default function SinglepickAnswerEditor({
  question,
  currentAnswer,
  onSave,
  onCancel,
}: Props) {
  const [picked, setPicked] = useState(currentAnswer?.response ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!picked) return;
    setSaving(true);
    const newAnswer: ForcedFreeformAnswer = {
      question_id: question.question_id,
      card_id: question.card_id,
      question_text: question.text,
      type: "forced",
      response: picked,
    };
    try {
      await onSave(newAnswer);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {question.options.map((opt: QuestionOption, idx: number) => (
          <label
            key={`${opt.label}-${idx}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "6px 8px",
              border: "1px solid var(--rule, #d4c8a8)",
              background:
                picked === opt.label
                  ? "var(--rule-soft, #e8dec8)"
                  : "var(--paper, #f7f1e6)",
              cursor: "pointer",
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            <input
              type="radio"
              name={question.question_id}
              checked={picked === opt.label}
              onChange={() => setPicked(opt.label)}
              disabled={saving}
              style={{ marginTop: 3 }}
            />
            <span className="font-serif" style={{ flex: 1 }}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !picked}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.10em",
            padding: "4px 12px",
            border: "1px solid var(--ink, #2b2417)",
            background: "var(--ink, #2b2417)",
            color: "var(--paper, #f7f1e6)",
            cursor: saving || !picked ? "default" : "pointer",
            opacity: saving || !picked ? 0.5 : 1,
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
