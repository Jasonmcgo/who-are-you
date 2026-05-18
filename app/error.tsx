"use client";

// Next.js App Router error boundary. Catches any uncaught error thrown
// during render of a route segment under app/ (except errors thrown
// inside app/layout.tsx itself — those are caught by global-error.tsx).
//
// Props provided by Next:
//   - error: the thrown error, optionally with a `digest` set by Next
//     when running in production. The digest is a hash that maps back
//     to a server log entry; useful for operators, not user-meaningful.
//   - reset: re-renders the route segment that errored. The browser
//     stays on the same URL — only the failed subtree is retried.
//
// Design choices:
//   - No stack trace or error message in the UI. Internals don't help
//     end users and risk leaking implementation details.
//   - The digest (when present) is rendered small at the bottom so a
//     user can copy/paste it when reporting an issue.
//   - Two affordances: "Try again" (calls reset) and "Return home"
//     (full nav back to /). Reset is first because most transient
//     errors clear on retry.
//
// Voice + styling match the in-voice not-found pattern used elsewhere.

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Console-log so the digest surfaces in Vercel function logs next
    // to the original server-side stack.
    if (error?.digest) {
      console.error("[app/error] digest:", error.digest);
    } else {
      console.error("[app/error]", error);
    }
  }, [error]);

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div
        className="flex flex-col items-center"
        style={{ gap: 16, maxWidth: 520, padding: 32, textAlign: "center" }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Something interrupted
        </p>
        <h1
          className="font-serif"
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          The page couldn&apos;t finish loading
        </h1>
        <p
          className="font-serif italic"
          style={{
            fontSize: 16,
            color: "var(--ink-soft)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          A momentary issue stopped this page mid-render. Try again, or
          head home and start fresh.
        </p>
        <div
          style={{
            display: "flex",
            gap: 28,
            marginTop: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => reset()}
            className="font-mono uppercase"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--umber, var(--ink))",
              textDecoration: "underline",
            }}
          >
            Try again →
          </button>
          <Link
            href="/"
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
              textDecoration: "underline",
            }}
          >
            Return home
          </Link>
        </div>
        {error?.digest && (
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              color: "var(--ink-faint)",
              marginTop: 24,
              letterSpacing: "0.04em",
            }}
          >
            ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
