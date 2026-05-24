// CC-COUPLE-7 — Admin "Create couple game" surface. Builds a two-sided
// bond from two assessed sessions (Partner A + Partner B), with sender-
// confirmed first names prefilled from each profile's demographics.
//
// Lives on the admin sessions roster (`app/admin/sessions/page.tsx`)
// behind the same middleware-gated cookie as the rest of /admin. The
// resulting `/couple/[token]` URL is rendered verbatim with a copy
// control (per the Nat-404 lesson — never concatenate URLs in the UI;
// the API returns the full URL and we surface that string).

"use client";

import { useMemo, useState } from "react";

export interface RosterEntry {
  id: string;
  /** Display name when present; otherwise null (the form falls back to "Partner A"/"Partner B"). */
  name: string | null;
}

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ready"; url: string; copied: boolean }
  | { kind: "error"; message: string };

// CC-154-aligned generic failure copy. The route returns the same
// string but we hard-code it here in case a network error short-circuits
// before the JSON body comes back.
const GENERIC_MINT_ERROR =
  "We couldn't create your couple link just now. Please try again in a moment.";

export default function CreateCoupleGameForm({
  roster,
}: {
  roster: RosterEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [partnerASessionId, setPartnerASessionId] = useState("");
  const [partnerBSessionId, setPartnerBSessionId] = useState("");
  const [partnerAName, setPartnerAName] = useState("");
  const [partnerBName, setPartnerBName] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });

  // Roster lookup by id — keyed so the name inputs can prefill the
  // moment the corresponding select changes.
  const byId = useMemo(() => {
    const m = new Map<string, RosterEntry>();
    for (const r of roster) m.set(r.id, r);
    return m;
  }, [roster]);

  function handlePickA(id: string) {
    setPartnerASessionId(id);
    setPartnerAName(byId.get(id)?.name ?? "");
    setSubmit({ kind: "idle" });
  }
  function handlePickB(id: string) {
    setPartnerBSessionId(id);
    setPartnerBName(byId.get(id)?.name ?? "");
    setSubmit({ kind: "idle" });
  }

  const aPicked = partnerASessionId.length > 0;
  const bPicked = partnerBSessionId.length > 0;
  const sameSession = aPicked && partnerASessionId === partnerBSessionId;
  const canSubmit = aPicked && bPicked && !sameSession && submit.kind !== "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmit({ kind: "submitting" });
    try {
      const res = await fetch("/api/couple/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerASessionId,
          partnerBSessionId,
          partnerAName: partnerAName.trim(),
          partnerBName: partnerBName.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        // The route already returns generic copy on CC-154; surface it
        // verbatim. Network-error fallthrough uses the local copy.
        setSubmit({
          kind: "error",
          message:
            typeof body?.error === "string" ? body.error : GENERIC_MINT_ERROR,
        });
        return;
      }
      const data = (await res.json()) as { token: string; url: string };
      // CC-153 / Nat-404 lesson — render the URL the server returned,
      // verbatim. Never concatenate from origin + token in the UI.
      setSubmit({ kind: "ready", url: data.url, copied: false });
    } catch (err) {
      setSubmit({
        kind: "error",
        message: err instanceof Error ? err.message : GENERIC_MINT_ERROR,
      });
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setSubmit({ kind: "ready", url, copied: true });
      window.setTimeout(
        () =>
          setSubmit((prev) =>
            prev.kind === "ready" ? { ...prev, copied: false } : prev
          ),
        2500
      );
    } catch {
      // Soft-fail: URL is already on screen for manual copy.
    }
  }

  function handleReset() {
    setPartnerASessionId("");
    setPartnerBSessionId("");
    setPartnerAName("");
    setPartnerBName("");
    setSubmit({ kind: "idle" });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-focus-ring
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--umber)",
          background: "transparent",
          border: "1px solid var(--umber)",
          padding: "8px 14px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Create couple game
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col"
      style={{
        gap: 12,
        padding: "16px 18px",
        background: "var(--paper-warm)",
        border: "1px solid var(--rule)",
        borderRadius: 8,
        maxWidth: 540,
      }}
    >
      <div
        className="flex flex-row items-center justify-between"
        style={{ gap: 12 }}
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
          Create couple game
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            handleReset();
          }}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            background: "transparent",
            color: "var(--ink-mute)",
            border: "1px solid var(--rule)",
            padding: "4px 8px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      <PartnerRow
        label="Partner A"
        roster={roster}
        sessionId={partnerASessionId}
        onSessionChange={handlePickA}
        name={partnerAName}
        onNameChange={setPartnerAName}
        placeholder="Partner A"
      />
      <PartnerRow
        label="Partner B"
        roster={roster}
        sessionId={partnerBSessionId}
        onSessionChange={handlePickB}
        name={partnerBName}
        onNameChange={setPartnerBName}
        placeholder="Partner B"
      />

      {sameSession ? (
        <p
          role="alert"
          className="font-serif italic"
          style={{
            fontSize: 12,
            color: "var(--umber)",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Partner A and Partner B must be different sessions.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        data-focus-ring
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          background: canSubmit ? "var(--umber)" : "transparent",
          color: canSubmit ? "var(--paper)" : "var(--ink-faint)",
          border: canSubmit ? "1px solid var(--umber)" : "1px solid var(--rule)",
          padding: "8px 14px",
          borderRadius: 6,
          cursor: canSubmit ? "pointer" : "not-allowed",
          alignSelf: "flex-start",
        }}
      >
        {submit.kind === "submitting" ? "Creating…" : "Create couple game link"}
      </button>

      {submit.kind === "ready" ? (
        <div
          className="flex flex-col"
          style={{
            gap: 8,
            padding: "10px 12px",
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            borderRadius: 6,
          }}
        >
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            Couple link
          </p>
          <code
            className="font-mono"
            style={{
              fontSize: 12,
              color: "var(--ink)",
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {submit.url}
          </code>
          <button
            type="button"
            onClick={() => handleCopy(submit.url)}
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--umber)",
              background: "transparent",
              border: "1px solid var(--rule)",
              padding: "5px 10px",
              borderRadius: 4,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            {submit.copied ? "copied ✓" : "copy"}
          </button>
        </div>
      ) : null}

      {submit.kind === "error" ? (
        <p
          role="alert"
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {submit.message}
        </p>
      ) : null}
    </form>
  );
}

function PartnerRow({
  label,
  roster,
  sessionId,
  onSessionChange,
  name,
  onNameChange,
  placeholder,
}: {
  label: string;
  roster: RosterEntry[];
  sessionId: string;
  onSessionChange: (id: string) => void;
  name: string;
  onNameChange: (n: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <span
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
        }}
      >
        {label}
      </span>
      <div className="flex flex-row" style={{ gap: 8, flexWrap: "wrap" }}>
        <select
          value={sessionId}
          onChange={(e) => onSessionChange(e.target.value)}
          data-focus-ring
          className="font-serif"
          style={{
            flex: "1 1 240px",
            minWidth: 200,
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--rule)",
            padding: "7px 10px",
            fontSize: 13,
            borderRadius: 6,
          }}
        >
          <option value="">— select session —</option>
          {roster.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name && r.name.trim().length > 0
                ? `${r.name} · ${r.id.slice(0, 8)}…`
                : `Anonymous · ${r.id.slice(0, 8)}…`}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={placeholder}
          data-focus-ring
          className="font-serif"
          style={{
            flex: "1 1 160px",
            minWidth: 140,
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--rule)",
            padding: "7px 10px",
            fontSize: 13,
            borderRadius: 6,
          }}
        />
      </div>
    </div>
  );
}
