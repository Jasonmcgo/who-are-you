"use client";

// CC-127 — admin Copy-link control. Renders in the Actions column of
// the sessions list. On click it calls the admin mint endpoint
// (`POST /api/admin/sessions/[id]/follow-up-link`), writes the
// returned URL to the clipboard, and shows brief inline confirmation.
// No Gmail integration; the operator pastes the URL into email by
// hand.

import { useState } from "react";

interface Props {
  sessionId: string;
}

type State = "idle" | "minting" | "copied" | "error";

export default function CopySessionLinkButton({ sessionId }: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleClick() {
    setState("minting");
    setErrorText(null);
    try {
      const res = await fetch(
        `/api/admin/sessions/${sessionId}/follow-up-link`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `mint failed (${res.status})`);
      }
      const body = (await res.json()) as { url: string };
      try {
        await navigator.clipboard.writeText(body.url);
      } catch {
        // Clipboard may be unavailable (non-secure context, sandboxed
        // iframe). Soft-fail by surfacing the URL inline so the
        // operator can still copy it manually.
        setErrorText(body.url);
        setState("error");
        return;
      }
      setState("copied");
      window.setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      const message = e instanceof Error ? e.message : "mint failed";
      setErrorText(message);
      setState("error");
    }
  }

  // Match the admin theme: mono uppercase, umber color, no underline
  // (so it's visually distinct from the adjacent "view →" link).
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "minting"}
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--umber)",
          background: "transparent",
          border: "1px solid var(--rule)",
          padding: "2px 6px",
          cursor: state === "minting" ? "wait" : "pointer",
          opacity: state === "minting" ? 0.6 : 1,
        }}
      >
        {state === "minting"
          ? "minting…"
          : state === "copied"
          ? "copied ✓"
          : state === "error"
          ? "retry"
          : "copy link"}
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
          {errorText.startsWith("http") ? `URL: ${errorText}` : errorText}
        </span>
      ) : null}
    </span>
  );
}
