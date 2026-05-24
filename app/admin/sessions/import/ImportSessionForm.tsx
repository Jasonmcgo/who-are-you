"use client";

// CC-153 — Client form for the admin import page. Accepts either a file
// upload OR a JSON paste (whichever the admin finds faster for a given
// source), POSTs the raw JSON body to /api/admin/sessions/import, and
// renders the server response — success (new sessionId + derivation
// status) or a specific error from the validator.

import { useRef, useState } from "react";
import Link from "next/link";

interface ImportResult {
  sessionId: string;
  derivationStatus: "fresh" | "deferred-to-re-derive";
  derivationError: string | null;
  unknownQuestionIds: string[];
}

interface ImportError {
  error: string;
}

export default function ImportSessionForm() {
  const [pasted, setPasted] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // CC-155 Part B — synchronous in-flight latch. React's `setPending(true)`
  // re-renders on the next tick, so a fast double-click (the bug that
  // created Madison ×2 / LaCinda ×2) can fire two handlers before the
  // `disabled={pending}` attribute updates. A ref-backed latch flips
  // immediately and is checked at handler entry — second click is dropped
  // before the fetch.
  const inFlightRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function postJson(text: string) {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sessions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const body = (await res.json()) as ImportResult | ImportError;
      if (!res.ok || "error" in body) {
        setError(
          "error" in body ? body.error : `HTTP ${res.status} ${res.statusText}`
        );
      } else {
        setResult(body);
      }
    } catch (e) {
      setError(`network error: ${(e as Error).message}`);
    } finally {
      setPending(false);
      inFlightRef.current = false;
      // Reset the file input so re-selecting the same file after one
      // import (deliberate or undo) actually fires another `change`
      // event — without this, the browser sees no change and ignores.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setPasted(text);
    await postJson(text);
  }

  async function handlePasteSubmit() {
    if (pasted.trim().length === 0) {
      setError("paste a portable session JSON above first");
      return;
    }
    await postJson(pasted);
  }

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* File upload */}
      <div
        style={{
          border: "1px solid var(--rule)",
          padding: "14px 16px",
          background: "var(--paper, #f7f1e6)",
        }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: "0 0 6px 0",
          }}
        >
          Option A — upload a .json file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          disabled={pending}
          style={{ fontSize: 14 }}
        />
      </div>

      {/* JSON paste */}
      <div
        style={{
          border: "1px solid var(--rule)",
          padding: "14px 16px",
          background: "var(--paper, #f7f1e6)",
        }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: "0 0 6px 0",
          }}
        >
          Option B — paste JSON
        </p>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder={`{\n  "schemaVersion": 1,\n  "answers": [...],\n  "skippedQuestionIds": [...],\n  "metaSignals": [...],\n  "demographics": [...],\n  "contactEmail": null,\n  "contactMobile": null\n}`}
          rows={10}
          disabled={pending}
          style={{
            width: "100%",
            fontFamily: "monospace",
            fontSize: 12,
            padding: 8,
            border: "1px solid var(--rule)",
            background: "var(--paper-soft, #fcfaf4)",
            color: "var(--ink)",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={handlePasteSubmit}
          disabled={pending}
          className="font-mono uppercase"
          style={{
            marginTop: 8,
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--paper, #f7f1e6)",
            background: "var(--umber, #8a6f3a)",
            border: "1px solid var(--umber, #8a6f3a)",
            padding: "6px 14px",
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "importing…" : "Import pasted JSON"}
        </button>
      </div>

      {/* Result / error */}
      {error ? (
        <div
          role="alert"
          style={{
            border: "1px solid var(--danger, #a83a3a)",
            padding: "12px 14px",
            color: "var(--danger, #a83a3a)",
            background: "var(--paper-soft, #fcfaf4)",
            fontFamily: "monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          ✕ {error}
        </div>
      ) : null}

      {result ? (
        <div
          role="status"
          style={{
            border: "1px solid var(--ok, #2a6a3a)",
            padding: "14px 16px",
            color: "var(--ink)",
            background: "var(--paper, #f7f1e6)",
          }}
        >
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--ok, #2a6a3a)",
              margin: "0 0 6px 0",
            }}
          >
            ✓ Import succeeded
          </p>
          <p style={{ margin: "0 0 6px 0", fontSize: 14 }}>
            New session id:{" "}
            <code style={{ fontFamily: "monospace" }}>{result.sessionId}</code>
          </p>
          <p style={{ margin: "0 0 8px 0", fontSize: 13.5 }}>
            Derivation status:{" "}
            <strong>
              {result.derivationStatus === "fresh"
                ? "fresh"
                : "deferred-to-re-derive"}
            </strong>
            {result.derivationStatus === "deferred-to-re-derive" ? (
              <>
                {" — "}
                <span style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>
                  buildInnerConstitution threw on this answer set; the session
                  was persisted with engine_shape_version=null so the render
                  path re-derives at read time. Reset legacy Qs + send gap-fill
                  to complete.
                </span>
                {result.derivationError ? (
                  <pre
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      padding: "8px 10px",
                      background: "var(--paper-soft, #fcfaf4)",
                      border: "1px solid var(--rule)",
                      overflow: "auto",
                    }}
                  >
                    {result.derivationError}
                  </pre>
                ) : null}
              </>
            ) : null}
          </p>
          {result.unknownQuestionIds.length > 0 ? (
            <p style={{ margin: "0 0 8px 0", fontSize: 13 }}>
              Flagged but accepted —{" "}
              <strong>{result.unknownQuestionIds.length}</strong> answer(s)
              reference question IDs not in the current bank:{" "}
              <code>{result.unknownQuestionIds.slice(0, 6).join(", ")}</code>
              {result.unknownQuestionIds.length > 6 ? " …" : ""}
              {" "}— harmless if these are legacy IDs (the engine treats
              unknown answers as no-ops); concerning if they&rsquo;re typos.
            </p>
          ) : null}
          <div
            className="flex flex-row"
            style={{ gap: 12, marginTop: 10, alignItems: "center" }}
          >
            <Link
              href={`/admin/sessions/${result.sessionId}`}
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "var(--umber)",
                textDecoration: "underline",
              }}
            >
              open new session detail →
            </Link>
            <Link
              href="/admin/sessions"
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: "var(--ink-mute)",
                textDecoration: "underline",
              }}
            >
              back to roster
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
