"use client";

// CC-155 — admin Delete-session control. Renders in the Actions column
// of the sessions roster (the roster is a server component, so this is
// a small client sibling like CopySessionLinkButton).
//
// Two-step confirmation:
//   1. window.confirm — names the person + short session id, makes
//      irreversibility explicit. Cancel does nothing.
//   2. On confirm → DELETE /api/admin/sessions/[id] → router.refresh()
//      so the row disappears.
//
// Visually styled as destructive (rose-ink border + danger-on-hover)
// while keeping the admin's mono-uppercase register.
//
// If the caller is on the detail page (no row to refresh away), pass
// `redirectOnSuccess` so the page navigates back to the roster instead.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  sessionId: string;
  /**
   * Display name for the confirmation copy. Use the same string the
   * roster shows ("Anonymous" / "Prefer not to say" / actual name).
   */
  personLabel: string;
  /**
   * When true (detail-page caller), `router.push("/admin/sessions")`
   * after a successful delete. When false (roster caller, default),
   * `router.refresh()` so the row drops out of the table.
   */
  redirectOnSuccess?: boolean;
}

type State = "idle" | "deleting" | "error";

export default function DeleteSessionButton({
  sessionId,
  personLabel,
  redirectOnSuccess = false,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handleClick() {
    if (state === "deleting") return;
    const shortId = sessionId.slice(0, 8);
    const ok = window.confirm(
      `Permanently delete "${personLabel}" (${shortId}…) and all of their data? This cannot be undone.`
    );
    if (!ok) return;

    setState("deleting");
    setErrorText(null);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setState("error");
        setErrorText(body?.error ?? `HTTP ${res.status} ${res.statusText}`);
        return;
      }
      // Success — leave the button in `deleting` state so it stays
      // disabled (the row is about to disappear / page about to nav).
      if (redirectOnSuccess) {
        router.push("/admin/sessions");
      } else {
        router.refresh();
      }
    } catch (e) {
      setState("error");
      setErrorText((e as Error).message);
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "deleting"}
        className="font-mono uppercase"
        title={`Permanently delete ${personLabel} and all child rows`}
        style={{
          fontSize: 11,
          letterSpacing: "0.10em",
          padding: "4px 10px",
          // Rose register — distinct from the umber benign actions.
          color:
            state === "deleting" ? "var(--ink-mute)" : "var(--danger, #a83a3a)",
          border: `1px solid ${
            state === "deleting" ? "var(--rule)" : "var(--danger, #a83a3a)"
          }`,
          background: "transparent",
          cursor: state === "deleting" ? "wait" : "pointer",
          opacity: state === "deleting" ? 0.6 : 1,
        }}
      >
        {state === "deleting" ? "deleting…" : "Delete"}
      </button>
      {state === "error" && errorText ? (
        <span
          role="alert"
          style={{
            fontSize: 11,
            color: "var(--danger, #a83a3a)",
            fontFamily: "monospace",
          }}
        >
          ✕ {errorText}
        </span>
      ) : null}
    </span>
  );
}
