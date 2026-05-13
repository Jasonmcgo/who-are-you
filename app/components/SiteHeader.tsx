"use client";

// CC-HEADER-NAV-AND-EMAIL-GATE — thin nav header that gives visitors a
// way back to the landing page from `/assessment`, the report page, and
// admin views. Suppressed on `/` itself: the static landing page in
// `web/index.html` carries its own brand mark + masthead, so rendering
// this component on top of it would duplicate the "Who Are You?" text.
//
// Client component so it can read the current pathname via Next.js's
// `usePathname` hook (Server Components can't trivially access route
// path without middleware). The body is hookless past that — single
// link, no state. Rendered from the root layout so every route inherits
// it.
//
// Visual: paper-on-paper thin bar, ~52 px tall, serif brand mark
// left-aligned. Uses existing CSS variables (`--ink`, `--paper`,
// `--rule`, `--serif`). No menu, no buttons, no theme toggles.

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  // Suppress on the static landing page — it already carries its own
  // brand mark in the masthead band. Rendering a second "Who Are You?"
  // above it would be visually redundant.
  if (pathname === "/") return null;

  return (
    <header
      role="banner"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 12,
        padding: "12px 24px",
        minHeight: 52,
        borderBottom: "1px solid var(--rule, rgba(26,23,19,0.14))",
        background: "var(--paper, #f6f2ea)",
        color: "var(--ink, #1a1713)",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily:
            'var(--serif, "Source Serif 4", "Iowan Old Style", Palatino, Georgia, serif)',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "0.005em",
          color: "var(--ink, #1a1713)",
          textDecoration: "none",
        }}
      >
        Who Are You?
      </Link>
    </header>
  );
}
