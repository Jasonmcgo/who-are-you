"use client";

// CC-129 Part B — admin Copy-report-URL control. Mirrors CC-127's
// `CopySessionLinkButton` but copies the public report URL
// (`{origin}/report/{sessionId}`) to the clipboard. No mint roundtrip
// needed — the report URL is deterministic from the session id.
//
// Soft-fail behavior matches CC-127: on clipboard rejection (sandboxed
// iframe / non-secure context), surface the URL inline so the operator
// can copy it manually.

import { useState } from "react";

interface Props {
  sessionId: string;
}

type State = "idle" | "copied" | "error";

export default function CopyReportLinkButton({ sessionId }: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleClick() {
    setErrorText(null);
    const url = `${window.location.origin}/report/${sessionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2500);
    } catch {
      setErrorText(url);
      setState("error");
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      <button
        type="button"
        onClick={handleClick}
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--umber)",
          background: "transparent",
          border: "1px solid var(--rule)",
          padding: "2px 6px",
          cursor: "pointer",
        }}
      >
        {state === "copied"
          ? "copied ✓"
          : state === "error"
          ? "retry"
          : "copy report url"}
      </button>
      {state === "error" && errorText ? (
        <span
          className="font-mono"
          style={{
            fontSize: 9,
            color: "var(--ink-soft)",
            wordBreak: "break-all",
          }}
        >
          URL: {errorText}
        </span>
      ) : null}
    </span>
  );
}
