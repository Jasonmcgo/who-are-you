"use client";

// CC-REPORT-PERMALINK — client wrapper for the permalink route.
//
// Holds the React state (confirmations / explainOpen) that
// InnerConstitutionPage needs as props, threads in the LLM-augment
// chain (synthesis3 master synthesis + grip-paragraph) the same way
// the admin re-render and the fresh /assessment render do, and
// finally renders InnerConstitutionPage with the saved data + the
// permalink sessionId (so the "Return to this reading" affordance
// fires here too, per CC §"both contexts").
//
// `onRestart` here points to `/` rather than restarting test state —
// a returning visitor reading their own permalinked report doesn't
// have an in-progress test to restart.

import { useState } from "react";

import InnerConstitutionPage from "../../components/InnerConstitutionPage";
// CC-COUPLE-3 — single small CTA appended to the report. Kept inline so
// the only edit to this container is the panel + a render line below.
import { useLlmMasterSynthesis } from "../../../lib/synthesis3LlmClient";
import { useGripParagraph } from "../../../lib/gripTaxonomyLlmClient";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
  TensionStatus,
} from "../../../lib/types";

type Confirmation = {
  status: TensionStatus;
  note?: string;
};

type Props = {
  sessionId: string;
  constitution: InnerConstitution;
  answers: Answer[];
  demographics: DemographicSet | null;
  sessionDate: Date | null;
};

export default function ReportView({
  sessionId,
  constitution,
  answers,
  demographics,
  sessionDate,
}: Props) {
  const [confirmations, setConfirmations] = useState<Record<string, Confirmation>>({});
  const [explainOpen, setExplainOpen] = useState<Record<string, boolean>>({});

  // LLM augment chain — matches admin re-render. Both hooks are
  // pass-through on cache hit and silently fire /api on cache miss.
  const synthesisAugmented = useLlmMasterSynthesis(constitution);
  const augmentedConstitution = useGripParagraph(synthesisAugmented);

  return (
    <>
      <InnerConstitutionPage
        constitution={augmentedConstitution ?? synthesisAugmented ?? constitution}
        confirmations={confirmations}
        setConfirmations={setConfirmations}
        explainOpen={explainOpen}
        setExplainOpen={setExplainOpen}
        onRestart={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }}
        demographics={demographics}
        sessionDate={sessionDate}
        answers={answers}
        sessionId={sessionId}
      />
      <CoupleInviteCTA sessionId={sessionId} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-3 — Invite-your-partner CTA. Mints a `/couple/{token}` link
// against `/api/couple/mint` and reveals the URL to copy. Soft-fails on
// clipboard rejection by surfacing the URL inline (mirrors
// `app/admin/sessions/CopyReportLinkButton.tsx`).
// ─────────────────────────────────────────────────────────────────────

type CtaState =
  | { kind: "idle" }
  | { kind: "minting" }
  | { kind: "ready"; url: string; copied: boolean }
  | { kind: "error" };

// CC-154 — mirror the Share-block gate in InnerConstitutionPage
// (`!sessionId ? null : …` at L1406). A "real" saved session has a
// non-empty UUID id from the DB; anything else is the draft path
// and must not offer a live mint button.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// User-facing failure copy. Generic on purpose — covers transient
// network failure, the missing-table case, the partner-A-not-found
// case, and any future server error. The real cause is logged
// server-side in app/api/couple/mint/route.ts.
const GENERIC_MINT_ERROR =
  "We couldn't create your invite link just now. Please try again in a moment.";

function CoupleInviteCTA({ sessionId }: { sessionId: string | null | undefined }) {
  const [state, setState] = useState<CtaState>({ kind: "idle" });

  // CC-154 T1 — gate the mint on a real saved session id. In any
  // non-saved/draft context this renders the warm "save first" hint and
  // never offers a clickable mint button.
  const hasSavedSession =
    typeof sessionId === "string" && UUID_RE.test(sessionId);

  async function handleMint() {
    if (!hasSavedSession) return;
    setState({ kind: "minting" });
    try {
      const res = await fetch("/api/couple/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        // Drain the body to avoid leaks; never echo it back to the UI.
        await res.json().catch(() => ({}));
        throw new Error("mint failed");
      }
      const data = (await res.json()) as { token: string; url: string };
      setState({ kind: "ready", url: data.url, copied: false });
    } catch {
      // CC-154 T2 — never display the underlying error message to the
      // user. The server-side log carries the real cause for diagnosis.
      setState({ kind: "error" });
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setState({ kind: "ready", url, copied: true });
      window.setTimeout(
        () =>
          setState((prev) =>
            prev.kind === "ready" ? { ...prev, copied: false } : prev
          ),
        2500
      );
    } catch {
      // Soft-fail: URL is already on screen for manual copy.
    }
  }

  return (
    <aside
      className="flex flex-col"
      style={{
        maxWidth: 720,
        margin: "32px auto 64px",
        padding: "20px 18px",
        gap: 12,
        background: "var(--paper-warm)",
        border: "1px solid var(--rule-soft)",
        borderRadius: 8,
      }}
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
        Obvious or Oblivious?
      </p>
      <h2
        className="font-serif"
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        Invite your partner
      </h2>
      <p
        className="font-serif italic"
        style={{
          fontSize: 13,
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        Send them a link. They guess your answers to a short set of prompts;
        you both see how well they read you. Their answers never touch your
        report.
      </p>
      {!hasSavedSession ? (
        // CC-154 T1 — draft / unsaved state. No live mint button; warm
        // hint instead so the affordance reads as deferred, not broken.
        <p
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Save your report first, then you can invite your partner.
        </p>
      ) : state.kind === "idle" ? (
        <button
          type="button"
          onClick={handleMint}
          className="font-mono uppercase"
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            background: "var(--umber)",
            color: "var(--paper, #fff)",
            border: "1px solid var(--umber)",
            padding: "10px 16px",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          mint a couple link
        </button>
      ) : state.kind === "minting" ? (
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          minting…
        </p>
      ) : state.kind === "ready" ? (
        <div className="flex flex-col" style={{ gap: 8 }}>
          <code
            className="font-mono"
            style={{
              fontSize: 12,
              color: "var(--ink)",
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              padding: "8px 10px",
              borderRadius: 4,
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {state.url}
          </code>
          <button
            type="button"
            onClick={() => handleCopy(state.url)}
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--umber)",
              background: "transparent",
              border: "1px solid var(--rule)",
              padding: "6px 10px",
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            {state.copied ? "copied ✓" : "copy"}
          </button>
        </div>
      ) : (
        // CC-154 T2/T3 — generic, reassuring failure copy. The "in a
        // moment" framing covers the transient/missing-table case
        // without exposing why.
        <div className="flex flex-col" style={{ gap: 8 }}>
          <p
            className="font-serif italic"
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {GENERIC_MINT_ERROR}
          </p>
          <button
            type="button"
            onClick={handleMint}
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--umber)",
              background: "transparent",
              border: "1px solid var(--rule)",
              padding: "6px 10px",
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            try again
          </button>
        </div>
      )}
    </aside>
  );
}
