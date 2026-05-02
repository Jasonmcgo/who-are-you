"use client";

// CC-053 — Admin answer review/edit page. Lists every question in canonical
// order with the user's saved answer + an inline editor toggle. Saves call
// the `updateSessionAnswer` server action (lib/saveSession.ts); on success
// the page refetches and re-renders. Returning to the session detail page
// triggers the live-engine re-derivation against the updated answer set
// (CODEX-050 pattern).
//
// This is a Client Component for the same reason the session detail page
// is one: per-question edit state lives in React; the data fetch hits
// /api/admin/sessions/[id] (server-side) for the authoritative session.
//
// Visual register: admin-distinct (mono labels, ink-mute helper text). The
// page reads as utilitarian tooling, not as the user's experience.

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { questions as allQuestions } from "../../../../../data/questions";
import { updateSessionAnswer } from "../../../../../lib/saveSession";
import type {
  Answer,
  ForcedFreeformAnswer,
  ForcedFreeformQuestion,
  MultiSelectDerivedAnswer,
  MultiSelectDerivedQuestion,
  Question,
  RankingAnswer,
  RankingQuestion,
  SessionDetail,
} from "../../../../../lib/types";
import RankingAnswerEditor from "./RankingAnswerEditor";
import FreeformAnswerEditor from "./FreeformAnswerEditor";
import SinglepickAnswerEditor from "./SinglepickAnswerEditor";
import MultiselectDerivedAnswerEditor from "./MultiselectDerivedAnswerEditor";

type LastUpdate = {
  questionId: string;
  at: number;
};

export default function AnswerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<SessionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<LastUpdate | null>(null);

  async function fetchSession() {
    const res = await fetch(`/api/admin/sessions/${id}`, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        typeof body?.error === "string"
          ? body.error
          : `Failed to load session (${res.status})`
      );
    }
    const detail: SessionDetail = await res.json();
    return detail;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await fetchSession();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-clear the "Updated …" badge after 6 seconds so it doesn't linger
  // indefinitely. Keeps render pure (no `Date.now()` during render).
  useEffect(() => {
    if (!lastUpdate) return;
    const timer = window.setTimeout(() => {
      setLastUpdate((prev) =>
        prev && prev.at === lastUpdate.at ? null : prev
      );
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [lastUpdate]);

  async function handleSave(newAnswer: Answer) {
    await updateSessionAnswer(id, newAnswer.question_id, newAnswer);
    // Refetch to pick up the persisted answer, then close the editor.
    const refreshed = await fetchSession();
    setData(refreshed);
    setLastUpdate({ questionId: newAnswer.question_id, at: Date.now() });
    setEditingId(null);
  }

  function handleCancel() {
    setEditingId(null);
  }

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
            href={`/admin/sessions/${id}`}
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--umber)",
              textDecoration: "underline",
              marginTop: 8,
            }}
          >
            ← back to session detail
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

  const answersByQid = new Map<string, Answer>();
  for (const a of data.answers ?? []) {
    answersByQid.set(a.question_id, a);
  }

  const displayName =
    data.demographics?.name_state === "specified" &&
    data.demographics.name_value
      ? data.demographics.name_value
      : data.demographics?.name_state === "prefer_not_to_say"
      ? "Prefer not to say"
      : "Anonymous";

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
            Admin Answer Review · {displayName}
          </p>
          <p
            className="font-serif italic"
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              margin: 0,
            }}
          >
            changes here update the user&apos;s saved session and trigger
            report re-derivation on the detail view
          </p>
        </div>
        <Link
          href={`/admin/sessions/${id}`}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            textDecoration: "underline",
          }}
        >
          ← back to session detail
        </Link>
      </header>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "20px 28px 48px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {allQuestions.map((q) => {
          const answer = answersByQid.get(q.question_id);
          const isEditing = editingId === q.question_id;
          const wasJustUpdated = lastUpdate?.questionId === q.question_id;

          return (
            <section
              key={q.question_id}
              style={{
                border: "1px solid var(--rule, #d4c8a8)",
                background: "var(--paper, #f7f1e6)",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <p
                    className="font-mono uppercase"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      color: "var(--ink-mute)",
                      margin: 0,
                    }}
                  >
                    {q.question_id} · {q.type}
                  </p>
                  <p
                    className="font-serif"
                    style={{
                      fontSize: 14,
                      color: "var(--ink, #2b2417)",
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {q.text}
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setEditingId(q.question_id)}
                    className="font-mono uppercase"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.10em",
                      padding: "4px 12px",
                      border: "1px solid var(--rule, #d4c8a8)",
                      background: "transparent",
                      color: "var(--ink, #2b2417)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Edit
                  </button>
                ) : null}
              </div>

              {isEditing ? (
                <EditorDispatch
                  question={q}
                  answer={answer}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <ReadOnlyAnswer question={q} answer={answer} />
              )}

              {wasJustUpdated ? (
                <p
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.10em",
                    color: "var(--umber, #8a6f3a)",
                    margin: 0,
                  }}
                >
                  Updated {new Date(lastUpdate!.at).toLocaleTimeString()}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}

// ── Read-only renderer ──────────────────────────────────────────────────

function ReadOnlyAnswer({
  question,
  answer,
}: {
  question: Question;
  answer: Answer | undefined;
}) {
  if (!answer) {
    return (
      <p
        className="font-serif italic"
        style={{
          fontSize: 13,
          color: "var(--ink-mute, #6a5d40)",
          margin: 0,
        }}
      >
        (no saved answer — question was skipped or did not surface)
      </p>
    );
  }
  if (answer.type === "ranking" || answer.type === "ranking_derived") {
    return (
      <ol
        style={{
          margin: 0,
          paddingLeft: 18,
          fontSize: 13,
          color: "var(--ink, #2b2417)",
          lineHeight: 1.5,
        }}
      >
        {answer.order.map((id) => {
          const items =
            question.type === "ranking" ? question.items : undefined;
          const label = items?.find((i) => i.id === id)?.label ?? id;
          return <li key={id}>{label}</li>;
        })}
      </ol>
    );
  }
  if (answer.type === "freeform" || answer.type === "forced") {
    return (
      <p
        className="font-serif"
        style={{
          fontSize: 13.5,
          color: "var(--ink, #2b2417)",
          margin: 0,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}
      >
        {answer.response}
      </p>
    );
  }
  if (answer.type === "single_pick") {
    return (
      <p
        className="font-serif"
        style={{
          fontSize: 13.5,
          color: "var(--ink, #2b2417)",
          margin: 0,
        }}
      >
        Picked: <span className="font-mono">{answer.picked_id}</span>
      </p>
    );
  }
  if (answer.type === "multiselect_derived") {
    if (answer.none_selected) {
      return (
        <p
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: "var(--ink-mute, #6a5d40)",
            margin: 0,
          }}
        >
          Selected: None of these{answer.other_text ? ` (other: "${answer.other_text}")` : ""}
        </p>
      );
    }
    return (
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          fontSize: 13,
          color: "var(--ink, #2b2417)",
          lineHeight: 1.5,
        }}
      >
        {answer.selections.map((s) => (
          <li key={s.id}>{s.id}</li>
        ))}
        {answer.other_text ? <li>Other: {answer.other_text}</li> : null}
      </ul>
    );
  }
  return null;
}

// ── Editor dispatcher ──────────────────────────────────────────────────

function EditorDispatch({
  question,
  answer,
  onSave,
  onCancel,
}: {
  question: Question;
  answer: Answer | undefined;
  onSave: (newAnswer: Answer) => Promise<void>;
  onCancel: () => void;
}) {
  if (question.type === "ranking") {
    return (
      <RankingAnswerEditor
        question={question as RankingQuestion}
        currentAnswer={answer?.type === "ranking" ? (answer as RankingAnswer) : undefined}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  if (question.type === "ranking_derived") {
    return (
      <p
        className="font-serif italic"
        style={{ fontSize: 12, color: "var(--ink-mute, #6a5d40)", margin: 0 }}
      >
        Derived rankings (Q-S3-cross, Q-E1-cross) compose from parent
        rankings at survey time. Edit the parent rankings instead; the
        derived ranking re-renders on next session re-derivation.
      </p>
    );
  }
  if (question.type === "multiselect_derived") {
    return (
      <MultiselectDerivedAnswerEditor
        question={question as MultiSelectDerivedQuestion}
        currentAnswer={
          answer?.type === "multiselect_derived"
            ? (answer as MultiSelectDerivedAnswer)
            : undefined
        }
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  // forced / freeform — branch on the answer's stored type when present,
  // otherwise infer from the question's type field.
  const ffq = question as ForcedFreeformQuestion;
  if (ffq.type === "freeform") {
    return (
      <FreeformAnswerEditor
        question={ffq}
        currentAnswer={
          answer?.type === "freeform" ? (answer as ForcedFreeformAnswer) : undefined
        }
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  // type === "forced"
  return (
    <SinglepickAnswerEditor
      question={ffq}
      currentAnswer={
        answer?.type === "forced" ? (answer as ForcedFreeformAnswer) : undefined
      }
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}
