// Site-wide 404 fallback. Triggers when a user visits a URL that doesn't
// resolve to any route segment (or when a server component calls
// `notFound()` without a more specific boundary).
//
// Per-route not-found pages (e.g. `app/report/[sessionId]`'s
// `ReportNotFound`) take precedence over this file. This is the global
// safety net for "unknown URL" — typos, expired share links, removed
// pages.
//
// Voice + styling match the in-voice not-found pattern used by the
// report permalink page so the fallback feels like part of the product,
// not a Next.js chrome page.

import Link from "next/link";

export default function NotFound() {
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
          Page not found
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
          This page isn&apos;t one we know
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
          The link may be incorrect, or the page may have moved. Head home
          and find your way back to the assessment.
        </p>
        <Link
          href="/"
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--umber, var(--ink))",
            textDecoration: "underline",
            marginTop: 12,
          }}
        >
          Return home →
        </Link>
      </div>
    </main>
  );
}
