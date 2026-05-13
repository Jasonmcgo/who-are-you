// CC-021a — Session detail view (client component). Reuses
// InnerConstitutionPage for the left column and AttachmentsPanel for the
// right column.
//
// This is a Client Component (rather than Server Component as the spec
// suggests) because InnerConstitutionPage needs React state handlers
// (confirmations, explainOpen) that can't be serialized across the
// server→client boundary. Wrapping it in an additional client subcomponent
// would require another file outside the allow-list. The data fetch hits
// /api/admin/sessions/[id] via fetch — the API route runs server-side, so
// the architecture is morally a server fetch with a thin client shell.

"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import InnerConstitutionPage from "../../../components/InnerConstitutionPage";
import AttachmentsPanel from "../../../components/AttachmentsPanel";
import { buildInnerConstitution } from "../../../../lib/identityEngine";
// CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — augment session constitution
// with LLM Path master synthesis paragraph via the server-side API
// endpoint. Live sessions (e.g., Jason + family members) compute
// inputs that miss the static fixture cache; this hook hits the
// endpoint, which calls Anthropic + persists the result for next time.
import { useLlmMasterSynthesis } from "../../../../lib/synthesis3LlmClient";
// CC-GRIP-TAXONOMY — sibling hook for the Grip section LLM articulation.
import { useGripParagraph } from "../../../../lib/gripTaxonomyLlmClient";
import {
  buildFilename,
  renderMirrorAsMarkdown,
} from "../../../../lib/renderMirror";
import type {
  Answer,
  Attachment,
  DemographicAnswer,
  DemographicSet,
  InnerConstitution,
  SessionDetail,
  SessionDetailDemographics,
  TensionStatus,
} from "../../../../lib/types";

// Mirrors InnerConstitutionPage's internal Confirmation shape (the type
// isn't exported from there). Used for the local React state that the
// reused tension-card UI writes into; the writes are discarded on
// navigation since the admin view is read-only on session content.
type Confirmation_ = { status: TensionStatus; note?: string };

// CC-022b — convert the saved column-shaped SessionDetailDemographics
// (one (state, value) pair per field) into the DemographicSet shape that
// InnerConstitutionPage and the prose generators expect. Field names
// here mirror data/demographics.ts field_id values; location collapses
// the country|region split back into a single value.
function toDemographicSet(
  demo: SessionDetailDemographics | null
): DemographicSet | null {
  if (!demo) return null;
  const answers: DemographicAnswer[] = [];
  function pushSimple(field_id: string, state: DemographicAnswer["state"], value: string | null) {
    if (state === "specified" && value) {
      answers.push({ field_id, state, value });
    } else if (state === "prefer_not_to_say") {
      answers.push({ field_id, state });
    } else {
      answers.push({ field_id, state: "not_answered" });
    }
  }
  pushSimple("name", demo.name_state, demo.name_value);
  pushSimple("gender", demo.gender_state, demo.gender_value);
  pushSimple("age", demo.age_state, demo.age_decade);
  // Location: rebuild "country | region" or country-only.
  const locValue =
    demo.location_state === "specified"
      ? demo.location_region
        ? `${demo.location_country ?? ""} | ${demo.location_region}`.trim()
        : demo.location_country ?? null
      : null;
  pushSimple("location", demo.location_state, locValue);
  pushSimple("marital_status", demo.marital_status_state, demo.marital_status_value);
  pushSimple("education", demo.education_state, demo.education_value);
  pushSimple("political", demo.political_state, demo.political_value);
  pushSimple("religious", demo.religious_state, demo.religious_value);
  pushSimple("profession", demo.profession_state, demo.profession_value);
  return { answers };
}

// CC-065 Item 1 — Admin-only export panel. The user-facing Share block in
// `InnerConstitutionPage` stays suppressed in this view via `hideShareBlock`
// per CC-021a's UX distinction; this panel adds an unconditional Copy /
// Download affordance for the admin re-render workflow (manual A/B with
// external LLMs as the engine evolves). Print is intentionally dropped —
// browser print works on either route, no admin-specific tool needed.
function AdminExportPanel({
  constitution,
  demographics,
  answers,
  sessionDate,
}: {
  constitution: InnerConstitution;
  demographics: DemographicSet | null;
  answers: Answer[];
  sessionDate: Date | null;
}) {
  const [copiedFlash, setCopiedFlash] = useState(false);

  function buildMarkdown(): string {
    return renderMirrorAsMarkdown({
      constitution,
      demographics,
      answers,
      includeBeliefAnchor: true,
    });
  }

  async function handleCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(buildMarkdown());
      setCopiedFlash(true);
      window.setTimeout(() => setCopiedFlash(false), 2000);
    } catch {
      // Soft-fail on clipboard rejection (sandboxed iframes / non-secure
      // contexts). The Download affordance below is the fallback.
    }
  }

  function handleDownloadMarkdown() {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildFilename(demographics, sessionDate);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className="flex flex-col"
      style={{
        gap: 8,
        padding: "12px 14px",
        marginBottom: 16,
        border: "1px solid var(--rule)",
        background: "var(--paper-soft, transparent)",
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
        Admin Export — Re-Render Mode
      </p>
      <p
        className="font-serif italic"
        style={{
          fontSize: 13,
          color: "var(--ink-soft)",
          margin: 0,
        }}
      >
        Repeated export available; engine re-renders against current code on each load.
      </p>
      <div className="flex flex-row" style={{ gap: 10, alignItems: "center" }}>
        <button
          type="button"
          onClick={handleCopyMarkdown}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--umber)",
            border: "1px solid var(--rule)",
            padding: "6px 12px",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Copy as Markdown
        </button>
        <button
          type="button"
          onClick={handleDownloadMarkdown}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--umber)",
            border: "1px solid var(--rule)",
            padding: "6px 12px",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Download Markdown
        </button>
        {copiedFlash ? (
          <span
            className="font-serif italic"
            style={{ fontSize: 12, color: "var(--ink-soft)" }}
          >
            copied
          </span>
        ) : null}
      </div>
    </section>
  );
}

function LiveEngineBanner({ renderDate }: { renderDate: string }) {
  return (
    <div
      className="font-mono"
      style={{
        color: "var(--ink-mute)",
        borderBottom: "1px solid var(--rule)",
        paddingBottom: 10,
        marginBottom: 16,
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          margin: 0,
        }}
      >
        LIVE-ENGINE RENDER · this report was generated against current engine
        code
      </p>
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          margin: "6px 0 0 0",
        }}
      >
        {renderDate}, may differ from the report the user saw when taking the
        test
      </p>
    </div>
  );
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<SessionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState<
    Record<string, Confirmation_>
  >({});
  const [explainOpen, setExplainOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/sessions/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setLoadError(
              typeof body?.error === "string"
                ? body.error
                : `Failed to load session (${res.status})`
            );
          }
          return;
        }
        const detail: SessionDetail = await res.json();
        if (!cancelled) setData(detail);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Failed to load session."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleAttachmentsChange(next: Attachment[]) {
    setData((prev) => (prev ? { ...prev, attachments: next } : prev));
  }

  const constitution = useMemo<InnerConstitution | null>(() => {
    if (!data) return null;
    return buildInnerConstitution(
      data.answers ?? [],
      data.inner_constitution.meta_signals
    );
  }, [data]);
  // CODEX-SYNTHESIS-3-RUNTIME-FALLBACK + CC-GRIP-TAXONOMY — chained
  // augments. Path master synthesis runs first; then Grip section. Both
  // pass-through cleanly when their respective static caches hit;
  // both fire server-only API calls on miss.
  const synthesisAugmented = useLlmMasterSynthesis(constitution);
  const augmentedConstitution = useGripParagraph(synthesisAugmented);

  if (loadError) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <div
          className="flex flex-col items-center"
          style={{ gap: 12, maxWidth: 480, padding: 24, textAlign: "center" }}
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
            Could not load session
          </p>
          <p
            className="font-serif italic"
            style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}
          >
            {loadError}
          </p>
          <Link
            href="/admin/sessions"
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--umber)",
              textDecoration: "underline",
              marginTop: 8,
            }}
          >
            ← back to sessions
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-mute)",
          }}
        >
          Loading…
        </p>
      </main>
    );
  }

  const displayName =
    data.demographics?.name_state === "specified" &&
    data.demographics.name_value
      ? data.demographics.name_value
      : data.demographics?.name_state === "prefer_not_to_say"
      ? "Prefer not to say"
      : "Anonymous";
  const savedDate = new Date(data.saved_at).toLocaleString();

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <header
        className="flex flex-row items-center justify-between"
        style={{
          padding: "16px 28px",
          borderBottom: "1px solid var(--rule)",
          gap: 16,
        }}
      >
        <div className="flex flex-col" style={{ gap: 4 }}>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            Session: {displayName}
          </p>
          <p
            className="font-serif italic"
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              margin: 0,
            }}
          >
            saved {savedDate}
          </p>
        </div>
        <div className="flex flex-row" style={{ gap: 16, alignItems: "center" }}>
          {/* CC-053 — answer review/edit entry point. Admin-only. Mono link
              register matches the back-link; placement before the "back to
              sessions" link reflects walk-order (admin lands on detail,
              optionally clicks into Answers, returns out via back). */}
          <Link
            href={`/admin/sessions/${id}/answers`}
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--umber)",
              textDecoration: "underline",
            }}
          >
            view / edit answers →
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
            ← back to sessions
          </Link>
        </div>
      </header>

      <div
        className="flex flex-col md:flex-row"
        style={{
          gap: 24,
          padding: "20px 28px",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "1 1 70%", minWidth: 0 }}>
          <AdminExportPanel
            constitution={
              augmentedConstitution ?? constitution ?? data.inner_constitution
            }
            demographics={toDemographicSet(data.demographics)}
            answers={data.answers ?? []}
            sessionDate={data.saved_at ? new Date(data.saved_at) : null}
          />
          <LiveEngineBanner
            renderDate={new Date().toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          {/* Reuse the live InnerConstitutionPage. Suppress Save (omit
              onStartSave) and Share (hideShareBlock). The "start over"
              button at the footer points back to the sessions list. */}
          <InnerConstitutionPage
            constitution={
              augmentedConstitution ?? constitution ?? data.inner_constitution
            }
            confirmations={confirmations}
            setConfirmations={setConfirmations}
            explainOpen={explainOpen}
            setExplainOpen={setExplainOpen}
            onRestart={() => {
              window.location.href = "/admin/sessions";
            }}
            hideShareBlock
            demographics={toDemographicSet(data.demographics)}
            answers={data.answers}
          />
        </div>
        <aside
          style={{
            flex: "1 1 30%",
            minWidth: 280,
            position: "sticky",
            top: 16,
          }}
        >
          <AttachmentsPanel
            sessionId={id}
            initialAttachments={data.attachments}
            onAttachmentsChange={handleAttachmentsChange}
          />
        </aside>
      </div>
    </main>
  );
}
