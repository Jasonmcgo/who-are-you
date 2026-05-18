"use client";

// Outermost error boundary. Catches errors thrown inside app/layout.tsx
// itself — the regular app/error.tsx lives UNDER the root layout, so if
// the layout fails to render there's nowhere for error.tsx to mount.
//
// Per Next.js contract, this file MUST render its own <html> and <body>
// because at this point the root layout has already failed; Next can't
// wrap the output for us.
//
// This is a last-resort fallback. It should fire rarely (only when
// something in the root layout — fonts, SiteHeader, the metadata block,
// or something globals-CSS-blocking — throws). All styling is inlined so
// it works even when asset loading or globals.css has failed.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error?.digest) {
      console.error("[app/global-error] digest:", error.digest);
    } else {
      console.error("[app/global-error]", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#f6f2ea",
          color: "#1a1713",
          fontFamily:
            '"Source Serif 4","Iowan Old Style","Palatino",Georgia,serif',
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            maxWidth: 520,
            padding: 32,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily:
                '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace',
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#807566",
              margin: 0,
            }}
          >
            Something interrupted
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#1a1713",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            The page couldn&apos;t load
          </h1>
          <p
            style={{
              fontStyle: "italic",
              fontSize: 16,
              color: "#433d33",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Something unexpected stopped the page from loading. Reload to
            try again, or wait a moment and come back.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily:
                '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace',
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8a4a1f",
              textDecoration: "underline",
              marginTop: 12,
            }}
          >
            Reload →
          </button>
          {error?.digest && (
            <p
              style={{
                fontFamily:
                  '"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace',
                fontSize: 10,
                color: "#b8ad9c",
                marginTop: 24,
                letterSpacing: "0.04em",
              }}
            >
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
