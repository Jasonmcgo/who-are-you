// CC-153 — Admin import surface.
//
// File-upload + JSON-paste form. POSTs to /api/admin/sessions/import,
// which validates → derives → persists a NEW session. On success the
// page renders the new session id + a link into the detail page + a
// reminder of the downstream chain (reset legacy Qs + mint gap-fill
// link — both already exist).
//
// Middleware-guarded by `/admin/*` cookie gate; no per-page auth check
// needed.

import ImportSessionForm from "./ImportSessionForm";

export const metadata = {
  title: "Import session · admin",
};

export default function ImportSessionPage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "32px 24px",
        fontFamily: "var(--font-serif)",
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Admin
        </p>
        <h1
          className="font-serif"
          style={{
            fontSize: 24,
            margin: "4px 0 8px 0",
            color: "var(--ink)",
          }}
        >
          Import a session (portable JSON)
        </h1>
        <p
          className="font-serif"
          style={{
            fontSize: 14,
            color: "var(--ink-soft)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Upload a portable session JSON (the file produced by{" "}
          <em>Download JSON (portable)</em> on a session detail page, or a
          hand-authored file in the same shape). The server validates the
          payload, re-derives the constitution from the imported answers,
          and creates a <strong>new</strong> session row. Imports are
          stamped with an <code>imported_legacy</code> provenance meta
          signal so they&rsquo;re distinguishable in admin.
        </p>
      </header>

      <ImportSessionForm />

      <section style={{ marginTop: 28 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: "0 0 6px 0",
          }}
        >
          After import (existing tools, not part of this page)
        </p>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            fontSize: 13.5,
            lineHeight: 1.6,
            color: "var(--ink-soft)",
          }}
        >
          <li>
            Open the new session&rsquo;s detail page from the link below
            (or via <code>/admin/sessions</code>).
          </li>
          <li>
            Reset any legacy / superseded question answers via the{" "}
            <em>Reset</em> column on the answers editor (CC-136). The
            engine will re-collect those questions on the next visit.
          </li>
          <li>
            Mint a follow-up link from the roster&rsquo;s{" "}
            <em>Copy follow-up link</em> button so the user can fill the
            gap-questions in their browser.
          </li>
        </ol>
      </section>
    </main>
  );
}
