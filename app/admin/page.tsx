// CC-021a — Researcher login page. Renders the passcode form. The Save
// button POSTs to /api/admin/auth; on 200 the cookie is set by the server
// and the browser navigates to /admin/sessions. On 401 we surface the
// "Invalid passcode" error inline.
//
// Note: the auth cookie is HttpOnly, so this Client Component cannot read
// it. The middleware does the real gating; the only state we keep here is
// the form input + the "wrong passcode" hint.

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Local error overrides the URL-derived one once the user submits.
  const [submitError, setSubmitError] = useState<string | null>(null);
  const error =
    submitError ??
    (searchParams.get("error") === "invalid" ? "Invalid passcode." : null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        router.push("/admin/sessions");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setSubmitError(typeof body?.error === "string" ? body.error : "Login failed.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col"
        style={{
          gap: 16,
          padding: 28,
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          width: "min(420px, calc(100vw - 32px))",
        }}
      >
        <div className="flex flex-col" style={{ gap: 6 }}>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            Researcher Login
          </p>
          <p
            className="font-serif italic"
            style={{
              fontSize: 14,
              color: "var(--ink-soft)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Enter the passcode from your local <code>.env.local</code>.
          </p>
        </div>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          autoFocus
          data-focus-ring
          className="font-serif"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--rule)",
            padding: "12px 14px",
            fontSize: 16,
            borderRadius: 6,
          }}
        />
        <button
          type="submit"
          disabled={submitting || passcode.length === 0}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            background:
              submitting || passcode.length === 0
                ? "transparent"
                : "var(--umber)",
            color:
              submitting || passcode.length === 0
                ? "var(--ink-faint)"
                : "var(--paper)",
            border:
              submitting || passcode.length === 0
                ? "1px solid var(--rule)"
                : "1px solid var(--umber)",
            padding: "12px 16px",
            borderRadius: 6,
            cursor:
              submitting || passcode.length === 0 ? "not-allowed" : "pointer",
            minHeight: 44,
          }}
        >
          {submitting ? "Verifying…" : "Sign in"}
        </button>
        {error ? (
          <p
            role="alert"
            className="font-serif italic"
            style={{
              fontSize: 13,
              color: "var(--umber)",
              margin: 0,
            }}
          >
            {error}
          </p>
        ) : null}
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <AdminLoginPageInner />
    </Suspense>
  );
}
