// CC-LANDING-PAGE-WIRING — root route renders the marketing landing
// page from `web/index.html` (the canonical, designer-approved
// brochure). The survey entry that previously lived here has moved to
// `/assessment` (see `app/assessment/page.tsx`). All landing styles +
// markup are emitted verbatim — visual fidelity to `web/index.html`
// opened directly in a browser is the gate.
//
// Server component: no `"use client"`, no hooks. The file is read once
// at module load (effectively build-time in Next.js static generation);
// the CTA `href` rewrites happen during that same load. Static and
// cacheable per CC Rule 5.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import LandingShareCtaWiring from "./components/LandingShareCtaWiring";

const RAW_HTML = readFileSync(
  join(process.cwd(), "web", "index.html"),
  "utf-8"
);

function extractStyle(html: string): string {
  // The landing's <style> block lives in <head>. Grab every <style>…
  // </style> the source declares and concatenate so any additional
  // blocks survive a later edit to web/index.html.
  const out: string[] = [];
  const re = /<style>([\s\S]*?)<\/style>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push(m[1]);
  }
  return out.join("\n");
}

function extractBody(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  return m ? m[1] : "";
}

function rewriteCtas(body: string): string {
  // CC-LANDING-PAGE-WIRING — "Begin the 50 Questions" → /assessment.
  // "Give it to someone you love" / "Give it to someone" also point at
  // /assessment per the CC (a future `/share` route is deferred).
  return body
    .replace(
      /<a href="#" class="btn btn-primary">/g,
      '<a href="/assessment" class="btn btn-primary">'
    )
    .replace(
      /<a href="#vignettes" class="btn btn-ghost">Give it to someone you love<\/a>/g,
      '<a href="/assessment" class="btn btn-ghost">Give it to someone you love</a>'
    )
    .replace(
      /<a href="#" class="btn btn-ghost">Give it to someone<\/a>/g,
      '<a href="/assessment" class="btn btn-ghost">Give it to someone</a>'
    );
}

const STYLE_CONTENT = extractStyle(RAW_HTML);
const BODY_CONTENT = rewriteCtas(extractBody(RAW_HTML));

export const metadata: Metadata = {
  title: "The 50° Life — Who Are You?",
  description:
    "A self-discovery instrument with 50 questions. Rank, write, and trace what holds when things pull apart.",
};

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE_CONTENT }} />
      <div
        className="landing-page-root"
        dangerouslySetInnerHTML={{ __html: BODY_CONTENT }}
      />
      {/* CC-HEADER-NAV-AND-EMAIL-GATE — attaches click handlers to the
          [data-share-cta] anchors emitted from the static HTML. Scripts
          inside dangerouslySetInnerHTML don't execute, so the wiring
          lives in a tiny client component that runs after hydration. */}
      <LandingShareCtaWiring />
    </>
  );
}
