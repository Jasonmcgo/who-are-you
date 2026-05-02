"use client";

// CC-057b — Admin-only notes panel for the A/B harness page. Persists
// notes in localStorage keyed by sessionId (developer-only admin route, so
// localStorage is acceptable here per the CC's locked-content section on
// the harness UI). When localStorage is unavailable (sandboxed iframe or
// SSR), the textarea falls back to in-memory state — notes don't persist
// but the UI still functions.

import { useState } from "react";

type Props = {
  sessionId: string;
};

function readInitialNotes(sessionId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(`polish_ab_notes:${sessionId}`) ?? "";
  } catch {
    return "";
  }
}

export default function NotesPanel({ sessionId }: Props) {
  // Lazy initialization reads localStorage exactly once on first render
  // without triggering setState-in-effect (per react-hooks/set-state-in-effect).
  const [notes, setNotes] = useState<string>(() => readInitialNotes(sessionId));

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setNotes(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`polish_ab_notes:${sessionId}`, next);
    } catch {
      // Quota exceeded or denied — keep in-memory state only.
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.10em",
          color: "var(--ink-mute, #6a5d40)",
          margin: 0,
        }}
      >
        Tonal-calibration notes
      </p>
      <textarea
        value={notes}
        onChange={handleChange}
        rows={6}
        className="font-serif"
        placeholder="Compare the two providers. Which reads warmer? Which preserved the engine substance more cleanly? Any flagged tonal misses or wins?"
        style={{
          width: "100%",
          padding: 10,
          fontSize: 13.5,
          lineHeight: 1.55,
          border: "1px solid var(--rule, #d4c8a8)",
          background: "var(--paper, #f7f1e6)",
          color: "var(--ink, #2b2417)",
          resize: "vertical",
        }}
      />
    </div>
  );
}
