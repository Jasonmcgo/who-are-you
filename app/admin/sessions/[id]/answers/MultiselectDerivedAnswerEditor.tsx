"use client";

// CC-053 — Admin multi-select-derived editor for Q-I2 / Q-I3. The options
// list comes from the user's parent-question answer + the question's
// derivation rules; the admin sees the same option set the user saw at
// the time of the original answer (preserved on the saved
// `MultiSelectDerivedAnswer.selections[]`). Admin can toggle selections,
// toggle the "none" sentinel (mutually exclusive with any selection), and
// edit "other" freeform text. The selector logic in the parent question
// (re-deriving the options list) is intentionally NOT re-run here — the
// admin edits against the option set the user saw.

import { useState } from "react";
import type {
  Answer,
  MultiSelectDerivedAnswer,
  MultiSelectDerivedQuestion,
} from "../../../../../lib/types";

type Props = {
  question: MultiSelectDerivedQuestion;
  currentAnswer: MultiSelectDerivedAnswer | undefined;
  onSave: (newAnswer: Answer) => Promise<void>;
  onCancel: () => void;
};

export default function MultiselectDerivedAnswerEditor({
  question,
  currentAnswer,
  onSave,
  onCancel,
}: Props) {
  const initialSelections = currentAnswer?.selections ?? [];
  const initialNone = currentAnswer?.none_selected ?? false;
  const initialOther = currentAnswer?.other_text ?? "";

  // Working state: track which option-ids are currently checked.
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(initialSelections.map((s) => s.id))
  );
  const [noneSelected, setNoneSelected] = useState(initialNone);
  const [otherText, setOtherText] = useState(initialOther);
  const [saving, setSaving] = useState(false);

  function toggleId(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (noneSelected) setNoneSelected(false);
  }

  function toggleNone() {
    setNoneSelected((prev) => !prev);
    if (!noneSelected) setCheckedIds(new Set());
  }

  async function handleSave() {
    setSaving(true);
    // Reconstruct selections preserving the original signal + source_question_id
    // metadata from the saved answer (we don't re-derive; we filter the
    // saved option list by the new checked set).
    const allOptions = currentAnswer?.selections ?? [];
    const newSelections = allOptions.filter((s) => checkedIds.has(s.id));
    const newAnswer: MultiSelectDerivedAnswer = {
      question_id: question.question_id,
      card_id: question.card_id,
      question_text: question.text,
      type: "multiselect_derived",
      selections: noneSelected ? [] : newSelections,
      none_selected: noneSelected,
      other_text: otherText.trim().length > 0 ? otherText.trim() : undefined,
    };
    try {
      await onSave(newAnswer);
    } finally {
      setSaving(false);
    }
  }

  // Build the union of available option ids: saved selections (checked or
  // not — admin can re-check ones the user previously unchecked) plus the
  // none/other sentinels from the question definition.
  const optionEntries = currentAnswer?.selections ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {optionEntries.length === 0 && !currentAnswer ? (
        <p
          className="font-serif italic"
          style={{
            fontSize: 12,
            color: "var(--ink-mute, #6a5d40)",
            margin: 0,
          }}
        >
          No saved option set for this question — Q-I2 / Q-I3 derive options
          from the user&apos;s parent answer at survey time. Editing is
          available only for sessions that have a saved answer for this
          question.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {optionEntries.map((opt, idx) => (
            <label
              key={`${opt.id}-${idx}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "6px 8px",
                border: "1px solid var(--rule, #d4c8a8)",
                background: checkedIds.has(opt.id)
                  ? "var(--rule-soft, #e8dec8)"
                  : "var(--paper, #f7f1e6)",
                cursor: "pointer",
                fontSize: 13,
                lineHeight: 1.4,
                opacity: noneSelected ? 0.45 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={checkedIds.has(opt.id)}
                onChange={() => toggleId(opt.id)}
                disabled={saving || noneSelected}
                style={{ marginTop: 3 }}
              />
              <span className="font-serif" style={{ flex: 1 }}>
                {opt.id}
              </span>
            </label>
          ))}
          {question.none_option ? (
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "6px 8px",
                border: "1px solid var(--rule, #d4c8a8)",
                background: noneSelected
                  ? "var(--rule-soft, #e8dec8)"
                  : "var(--paper, #f7f1e6)",
                cursor: "pointer",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              <input
                type="checkbox"
                checked={noneSelected}
                onChange={toggleNone}
                disabled={saving}
                style={{ marginTop: 3 }}
              />
              <span
                className="font-serif italic"
                style={{ flex: 1, color: "var(--ink-mute, #6a5d40)" }}
              >
                {question.none_option.label}
              </span>
            </label>
          ) : null}
          {question.other_option?.allows_text ? (
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Other (freeform)"
              disabled={saving || noneSelected}
              className="font-serif"
              style={{
                padding: 6,
                fontSize: 13,
                border: "1px solid var(--rule, #d4c8a8)",
                background: "var(--paper, #f7f1e6)",
                color: "var(--ink, #2b2417)",
                opacity: noneSelected ? 0.45 : 1,
              }}
            />
          ) : null}
        </div>
      )}
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
