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
// CC-148 — use the FULL bank (`allQuestions`), not the filtered presented-flow
// view (`questions`). The admin review surface intentionally shows every
// answered question, including legacy retired-from-flow defs (Q-T1–Q-T8) so
// their saved answers render with the question's items/voices. Pre-fix this
// page imported the filtered view aliased as `allQuestions`, which (a) hid
// legacy Q-T from the main list and (b) swept them into the follow-up /
// clarifier section, where they rendered as raw signal codes.
import { allQuestions } from "../../../../../data/questions";
import {
  updateSessionAnswer,
  resetSessionAnswer,
} from "../../../../../lib/saveSession";
// CC-136 Part C — reuse the existing list-page button. It mints via
// POST /api/admin/sessions/[id]/follow-up-link and copies the URL.
import CopySessionLinkButton from "../../CopySessionLinkButton";
import type {
  Answer,
  // CC-160 — binary editor types
  BinaryPickDerivedQuestion,
  BinaryPickQuestion,
  ForcedFreeformAnswer,
  ForcedFreeformQuestion,
  MultiSelectDerivedAnswer,
  MultiSelectDerivedQuestion,
  Question,
  RankingAnswer,
  RankingItem,
  RankingQuestion,
  SessionDetail,
  SinglePickAnswer,
} from "../../../../../lib/types";
import RankingAnswerEditor from "./RankingAnswerEditor";
import FreeformAnswerEditor from "./FreeformAnswerEditor";
import SinglepickAnswerEditor from "./SinglepickAnswerEditor";
import MultiselectDerivedAnswerEditor from "./MultiselectDerivedAnswerEditor";

type LastUpdate = {
  questionId: string;
  at: number;
};

// CC-148 — Shared voice/quote lookup. Given a question definition and an
// id-or-signal (the shape stored on saved answers — `picked_id` is the
// item id; ranking `order` entries are item ids), return the human voice
// `quote` text when the question defines one, falling back to the item
// label and finally the raw id. Handles the two question shapes that
// carry static voice items: `ranking` (legacy Q-T1–Q-T8 + Q-S3/E1 etc.)
// and `binary_pick` (Q-TB-*). `binary_pick_derived` populates items at
// render time and so cannot be resolved post-hoc here. For `forced`
// questions the option array shape (`QuestionOption`) does not currently
// carry a quote, but the lookup checks defensively so any future quote-
// bearing option renders correctly.
function voiceQuoteFor(question: Question, idOrSignal: string): string {
  const items =
    question.type === "ranking" || question.type === "binary_pick"
      ? question.items
      : undefined;
  if (items && items.length > 0) {
    const byId = items.find((i) => i.id === idOrSignal);
    if (byId) return byId.quote ?? byId.label ?? idOrSignal;
    const bySignal = items.find((i) => i.signal === idOrSignal);
    if (bySignal) return bySignal.quote ?? bySignal.label ?? idOrSignal;
  }
  if (
    (question.type === "forced" || question.type === "freeform") &&
    Array.isArray(question.options)
  ) {
    const byLabel = question.options.find((o) => o.label === idOrSignal);
    if (byLabel) {
      const q = (byLabel as { quote?: string }).quote;
      return q ?? byLabel.label;
    }
    const bySignal = question.options.find((o) => o.signal === idOrSignal);
    if (bySignal) {
      const q = (bySignal as { quote?: string }).quote;
      return q ?? bySignal.label;
    }
  }
  return idOrSignal;
}

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
  // CC-136 Part B — set of question_ids freshly reset in this session.
  // Drives the "pending re-ask" badge on each section so the admin can
  // see at a glance which questions will surface on the next gap-fill
  // link without re-scanning the whole page.
  const [pendingReask, setPendingReask] = useState<Set<string>>(new Set());

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

  // CC-136 Part B — Reset handler. Confirms (browser native — keeps the
  // surface dependency-free), then calls the server action and refetches.
  // The just-reset question_id is tracked so the section can render a
  // subtle "pending re-ask" badge instead of just snapping back to the
  // "no saved answer" empty state. Cascade-reset children also surface
  // briefly via the same badge mechanism.
  async function handleReset(questionId: string, questionText: string) {
    const ok = window.confirm(
      `Reset clears the saved answer for "${questionText}" and re-asks it on the next gap-fill link. The prior value is archived. Continue?`
    );
    if (!ok) return;
    try {
      const result = await resetSessionAnswer(id, questionId, "admin_reset");
      const refreshed = await fetchSession();
      // Use Date constructor (rather than Date.now()) — react-compiler's
      // purity check flags Date.now() in a state-update path here even
      // though the value is consumed only for display.
      const at = new Date().getTime();
      setData(refreshed);
      // Mark every archived question as just-reset so the badge fires
      // for the target AND any cascaded derived children.
      setPendingReask((prev) => {
        const next = new Set(prev);
        for (const qid of result.archivedQuestionIds) next.add(qid);
        return next;
      });
      setLastUpdate({ questionId, at });
      setEditingId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Reset failed.";
      window.alert(`Reset failed: ${msg}`);
    }
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
        <div className="flex flex-row items-center" style={{ gap: 12 }}>
          {pendingReask.size > 0 ? (
            <p
              className="font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.10em",
                color: "var(--umber, #8a6f3a)",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {pendingReask.size} pending re-ask
            </p>
          ) : null}
          {/* CC-136 Part C — Generate gap-fill link from the answers
              page itself. The button mints via the admin API route
              `POST /api/admin/sessions/[id]/follow-up-link` (CC-127)
              which accepts ANY session id — including manually-
              uploaded cohorts whose gaps the admin wants to collect. */}
          <CopySessionLinkButton sessionId={id} />
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
        </div>
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
                  <div className="flex flex-row" style={{ gap: 6 }}>
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
                    {/* CC-136 Part B — Reset visible only when there is
                        a live answer to clear. Derived ranking children
                        (Q-S3-cross / Q-E1-cross) intentionally hide
                        Reset — admins reset the PARENT, which cascades. */}
                    {answer && q.type !== "ranking_derived" ? (
                      <button
                        type="button"
                        onClick={() => handleReset(q.question_id, q.text)}
                        className="font-mono uppercase"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.10em",
                          padding: "4px 12px",
                          border: "1px solid var(--rule, #d4c8a8)",
                          background: "transparent",
                          color: "var(--umber, #8a6f3a)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Reset
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <EditorDispatch
                  question={q}
                  answer={answer}
                  allAnswers={data.answers ?? []}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <ReadOnlyAnswer
                  question={q}
                  answer={answer}
                  allAnswers={data.answers ?? []}
                />
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
              {/* CC-136 Part B — pending re-ask badge. Surfaces on
                  questions reset in this session so the admin sees
                  what the next gap-fill link will surface. */}
              {pendingReask.has(q.question_id) ? (
                <p
                  className="font-mono uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.10em",
                    color: "var(--umber, #8a6f3a)",
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  pending re-ask · will surface on next gap-fill link
                </p>
              ) : null}
            </section>
          );
        })}

        {/* CC-140 — Follow-up / clarifier answers section. Lists every
            saved answer whose question_id is NOT in the canonical
            data/questions.ts bank — i.e. the fq* clarifiers + any
            other dynamically-generated follow-up question. These
            answers save into sessions.answers and feed the report,
            but pre-CC-140 they were invisible in admin because the
            bank-iteration above could never surface them.

            Reset is wired the same way it is for bank answers (reuses
            handleReset → resetSessionAnswer); on reset the entry is
            archived to answer_history (CC-136) and re-surfaces on the
            next gap-fill / follow-up link. Edit is not offered for
            follow-up answers (their question structure isn't in the
            bank, so there's no editor to dispatch to — Reset + re-ask
            is the safe path). */}
        <FollowUpAnswersSection
          answers={data.answers ?? []}
          bankIds={new Set(allQuestions.map((q) => q.question_id))}
          pendingReask={pendingReask}
          onReset={handleReset}
        />
      </div>
    </main>
  );
}

// ── CC-140 — Follow-up / clarifier answers section ──────────────────────

function FollowUpAnswersSection({
  answers,
  bankIds,
  pendingReask,
  onReset,
}: {
  answers: Answer[];
  bankIds: Set<string>;
  pendingReask: Set<string>;
  onReset: (questionId: string, questionText: string) => Promise<void>;
}) {
  // Detection: any answer whose question_id is NOT in the canonical
  // bank set. The bank set is computed from data/questions.ts once
  // per render in the parent; here we just filter the live answers.
  const followUps = answers.filter((a) => !bankIds.has(a.question_id));
  if (followUps.length === 0) return null;

  return (
    <section
      style={{
        border: "1px solid var(--rule, #d4c8a8)",
        background: "var(--paper, #f7f1e6)",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginTop: 18,
      }}
    >
      <div className="flex flex-col" style={{ gap: 4 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Follow-up & clarifier answers
        </p>
        <p
          className="font-serif italic"
          style={{
            fontSize: 12,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          These are post-test clarifier / follow-up picks the engine
          generated for this session (fq* ids). They save into
          sessions.answers and feed the report; Reset re-asks them on
          the next gap-fill link.
        </p>
      </div>
      {followUps.map((a) => (
        <FollowUpAnswerRow
          key={a.question_id}
          answer={a}
          pendingReask={pendingReask.has(a.question_id)}
          onReset={onReset}
        />
      ))}
    </section>
  );
}

function FollowUpAnswerRow({
  answer,
  pendingReask,
  onReset,
}: {
  answer: Answer;
  pendingReask: boolean;
  onReset: (questionId: string, questionText: string) => Promise<void>;
}) {
  const questionText =
    "question_text" in answer && typeof answer.question_text === "string"
      ? answer.question_text
      : "(no question text on stored answer)";
  return (
    <div
      style={{
        borderTop: "1px solid var(--rule-soft, #ece3cf)",
        paddingTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 6,
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
              fontSize: 10,
              letterSpacing: "0.10em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            {answer.question_id} · {answer.type}
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
            {questionText}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onReset(answer.question_id, questionText)}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.10em",
            padding: "4px 12px",
            border: "1px solid var(--rule, #d4c8a8)",
            background: "transparent",
            color: "var(--umber, #8a6f3a)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Reset
        </button>
      </div>
      <FollowUpAnswerValue answer={answer} />
      {pendingReask ? (
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.10em",
            color: "var(--umber, #8a6f3a)",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          pending re-ask · will surface on next gap-fill link
        </p>
      ) : null}
    </div>
  );
}

function FollowUpAnswerValue({ answer }: { answer: Answer }) {
  // CC-148 — Voice quote lookup is NOT applied here. Two reasons:
  //   1. Follow-up / clarifier answers (fq*) carry no question definition
  //      in the canonical bank, so there's nothing to look the quote up
  //      against. Genuine fq* head-to-heads display "Voice A/B" by
  //      design; inventing voice prose would be dishonest display.
  //   2. After T1's import fix, legacy Q-T answers (which DO have quotes
  //      on their bank definitions) route to the main list + ReadOnlyAnswer
  //      instead of falling through to this renderer.
  // Anything reaching this function is either an fq* clarifier (label +
  // signal is the honest display) or a freeform response.
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
        <span
          className="font-mono"
          style={{
            marginLeft: 8,
            color: "var(--ink-mute)",
            fontSize: 11,
          }}
        >
          (signal: {answer.picked_signal})
        </span>
      </p>
    );
  }
  if (answer.type === "ranking_derived") {
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
          const src = answer.derived_item_sources.find((s) => s.id === id);
          return (
            <li key={id}>
              {id}
              {src ? (
                <span
                  className="font-mono"
                  style={{ marginLeft: 8, color: "var(--ink-mute)", fontSize: 11 }}
                >
                  (signal: {src.signal})
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }
  if (answer.type === "ranking") {
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
        {answer.order.map((id) => (
          <li key={id}>{id}</li>
        ))}
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
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
        }}
      >
        {answer.response}
      </p>
    );
  }
  if (answer.type === "multiselect_derived") {
    if (answer.none_selected) {
      return (
        <p
          className="font-serif italic"
          style={{ fontSize: 13, color: "var(--ink-mute)", margin: 0 }}
        >
          Selected: None of these
          {answer.other_text ? ` (other: "${answer.other_text}")` : ""}
        </p>
      );
    }
    return (
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--ink, #2b2417)" }}>
        {answer.selections.map((s) => (
          <li key={s.id}>
            {s.id}
            {s.signal ? (
              <span
                className="font-mono"
                style={{ marginLeft: 8, color: "var(--ink-mute)", fontSize: 11 }}
              >
                (signal: {s.signal})
              </span>
            ) : null}
          </li>
        ))}
        {answer.other_text ? <li>Other: {answer.other_text}</li> : null}
      </ul>
    );
  }
  return null;
}

// ── Read-only renderer ──────────────────────────────────────────────────

// CC-160 — resolve a `binary_pick_derived` picked_id's voice quote via
// its parent binary_pick questions' items. The derived question itself
// carries no items (`derived_from` names the parents); items materialize
// at survey time from each parent's user-picked item. So to display the
// chosen voice on read, we walk the parent answers + their question
// definitions and find the item whose id matches the picked_id.
//
// Returns the quote string when resolvable, or null when no match (callers
// fall back to the raw picked_id via the existing voiceQuoteFor path).
function binaryDerivedQuoteFor(
  question: Question,
  pickedId: string,
  allAnswers: Answer[],
  allBank: Question[]
): string | null {
  if (question.type !== "binary_pick_derived") return null;
  for (const parentId of question.derived_from ?? []) {
    const parentAnswer = allAnswers.find((a) => a.question_id === parentId);
    if (!parentAnswer || parentAnswer.type !== "single_pick") continue;
    const parentQ = allBank.find((q) => q.question_id === parentId);
    if (!parentQ || parentQ.type !== "binary_pick") continue;
    const item = parentQ.items.find((i) => i.id === parentAnswer.picked_id);
    if (item && item.id === pickedId) {
      return item.quote ?? item.label ?? pickedId;
    }
  }
  return null;
}

function ReadOnlyAnswer({
  question,
  answer,
  allAnswers,
}: {
  question: Question;
  answer: Answer | undefined;
  // CC-160 — passed so `binary_pick_derived` answers can resolve their
  // picked voice via parent binary_pick item lookups. Optional with `?`
  // default `[]` so any caller that doesn't thread it still functions
  // (the binary_pick_derived branch then falls back to raw id display).
  allAnswers?: Answer[];
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
          const item = items?.find((i) => i.id === id);
          const label = item?.quote ?? item?.label ?? id;
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
    // CC-148 — Look up the picked item's voice quote on the question
    // definition. Covers (a) Q-TB-* binary picks whose items carry the
    // CC-122/CC-135 warm-balanced voice prose, and (b) legacy Q-T
    // re-asks served as single_pick against a `ranking` question. Falls
    // back through label → raw id so quote-less options still render.
    //
    // CC-160 — binary_pick + binary_pick_derived also store as
    // single_pick (see app/assessment/page.tsx CC-138 emit path). The
    // binary_pick case is already handled by voiceQuoteFor's `items`
    // branch; binary_pick_derived needs the parent-walk because its
    // items don't exist on the question itself. Try the derived
    // resolver first when applicable; fall back to the general
    // voiceQuoteFor on miss.
    const derivedDisplay =
      question.type === "binary_pick_derived"
        ? binaryDerivedQuoteFor(
            question,
            answer.picked_id,
            allAnswers ?? [],
            allQuestions
          )
        : null;
    const display = derivedDisplay ?? voiceQuoteFor(question, answer.picked_id);
    const showRawCode = display === answer.picked_id;
    return (
      <p
        className="font-serif"
        style={{
          fontSize: 13.5,
          color: "var(--ink, #2b2417)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Picked:{" "}
        {showRawCode ? (
          <span className="font-mono">{answer.picked_id}</span>
        ) : (
          <span style={{ fontStyle: "italic" }}>{display}</span>
        )}
        <span
          className="font-mono"
          style={{
            marginLeft: 8,
            color: "var(--ink-mute)",
            fontSize: 11,
          }}
        >
          (id: {answer.picked_id}
          {answer.picked_signal && answer.picked_signal !== answer.picked_id
            ? ` · signal: ${answer.picked_signal}`
            : ""}
          )
        </span>
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
  // CC-160 — durable fail-safe. If no branch above matched (a future
  // answer type lands before the editor learns about it, or a stored
  // shape is corrupt), render the raw JSON as muted mono text rather
  // than returning null and letting some upstream `.map()` /
  // property-access crash white-screen the entire admin page. The
  // pre-CC-160 surface returned `null` here, which would have been
  // safe in isolation — but a *single* unhandled type in a long
  // question list could blow up an adjacent component and take the
  // page down with it. The visible JSON also gives the admin enough
  // context to diagnose the underlying shape mismatch.
  return (
    <p
      className="font-mono italic"
      style={{
        fontSize: 11,
        color: "var(--ink-mute, #6a5d40)",
        margin: 0,
        wordBreak: "break-all",
        whiteSpace: "pre-wrap",
      }}
    >
      unsupported answer type ({(answer as { type?: string }).type ?? "unknown"}) — raw: {JSON.stringify(answer)}
    </p>
  );
}

// ── Editor dispatcher ──────────────────────────────────────────────────

function EditorDispatch({
  question,
  answer,
  allAnswers,
  onSave,
  onCancel,
}: {
  question: Question;
  answer: Answer | undefined;
  // CC-160 — passed for the binary_pick_derived editor's parent-item
  // resolution (the derived question itself has no items).
  allAnswers: Answer[];
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
  // CC-160 — binary_pick: pick-one-of-two via items. Save as
  // SinglePickAnswer (same shape the assessment flow writes — see
  // app/assessment/page.tsx CC-138 emit). Pre-CC-160 this fell through
  // to SinglepickAnswerEditor which reads question.options (undefined
  // on binary types) and crashed the editor mount.
  if (question.type === "binary_pick") {
    return (
      <BinaryPickAnswerEditor
        question={question}
        items={question.items}
        currentAnswer={
          answer?.type === "single_pick" ? (answer as SinglePickAnswer) : undefined
        }
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  // CC-160 — binary_pick_derived: same editor, with items resolved
  // from the parent binary_pick answers. If both parents aren't
  // answered, items can't be derived → safe-inert message mirroring
  // the ranking_derived pattern.
  if (question.type === "binary_pick_derived") {
    const derivedItems: RankingItem[] = [];
    for (const parentId of question.derived_from ?? []) {
      const parentAnswer = allAnswers.find((a) => a.question_id === parentId);
      if (!parentAnswer || parentAnswer.type !== "single_pick") continue;
      const parentQ = allQuestions.find((q) => q.question_id === parentId);
      if (!parentQ || parentQ.type !== "binary_pick") continue;
      const item = parentQ.items.find((i) => i.id === parentAnswer.picked_id);
      if (item) derivedItems.push(item);
    }
    if (derivedItems.length < 2) {
      return (
        <p
          className="font-serif italic"
          style={{ fontSize: 12, color: "var(--ink-mute, #6a5d40)", margin: 0 }}
        >
          Derived binary picks compose from parent binary answers at survey
          time. {derivedItems.length === 0
            ? "Both parents are unanswered, so there are no items to choose between."
            : "Only one parent is answered; the second pair member is missing."}{" "}
          Edit the parents first; this question will re-derive on the next
          re-render.
        </p>
      );
    }
    return (
      <BinaryPickAnswerEditor
        question={question}
        items={derivedItems}
        currentAnswer={
          answer?.type === "single_pick" ? (answer as SinglePickAnswer) : undefined
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

// CC-160 — pick-one-of-two editor for binary_pick + binary_pick_derived
// questions. Saves a SinglePickAnswer (matching the assessment flow's
// CC-138 emit), so the round-trip via updateSessionAnswer is byte-
// for-byte compatible with the original answer shape.
function BinaryPickAnswerEditor({
  question,
  items,
  currentAnswer,
  onSave,
  onCancel,
}: {
  question: BinaryPickQuestion | BinaryPickDerivedQuestion;
  items: RankingItem[];
  currentAnswer: SinglePickAnswer | undefined;
  onSave: (newAnswer: Answer) => Promise<void>;
  onCancel: () => void;
}) {
  const [pickedId, setPickedId] = useState<string | null>(
    currentAnswer?.picked_id ?? null
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (!pickedId) return;
    const item = items.find((i) => i.id === pickedId);
    if (!item) {
      setErr("internal: picked item not found in items list");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const next: SinglePickAnswer = {
        question_id: question.question_id,
        card_id: question.card_id,
        question_text: question.text,
        type: "single_pick",
        picked_id: item.id,
        picked_signal: item.signal,
      };
      await onSave(next);
    } catch (e) {
      setErr((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {items.map((it) => {
        const selected = pickedId === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => setPickedId(it.id)}
            disabled={saving}
            style={{
              textAlign: "left",
              padding: "10px 12px",
              border: `1px solid ${selected ? "var(--umber, #8a6f3a)" : "var(--rule, #d4c8a8)"}`,
              background: selected
                ? "var(--umber-wash, #f0e6d2)"
                : "var(--paper, #f7f1e6)",
              color: "var(--ink, #2b2417)",
              cursor: saving ? "wait" : "pointer",
              borderRadius: 4,
            }}
          >
            <span className="font-mono uppercase" style={{ fontSize: 10, color: "var(--ink-mute)" }}>
              {it.id}
            </span>
            <p className="font-serif italic" style={{ margin: "4px 0 0 0", fontSize: 13, lineHeight: 1.5 }}>
              {it.quote ?? it.label ?? it.id}
            </p>
          </button>
        );
      })}
      <div className="flex flex-row" style={{ gap: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!pickedId || saving}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.10em",
            padding: "5px 14px",
            border: "1px solid var(--umber, #8a6f3a)",
            background: "var(--umber, #8a6f3a)",
            color: "var(--paper, #f7f1e6)",
            cursor: !pickedId || saving ? "not-allowed" : "pointer",
            opacity: !pickedId || saving ? 0.5 : 1,
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.10em",
            padding: "5px 14px",
            border: "1px solid var(--rule, #d4c8a8)",
            background: "transparent",
            color: "var(--ink, #2b2417)",
            cursor: saving ? "wait" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
      {err ? (
        <p
          className="font-mono"
          style={{ fontSize: 11, color: "var(--danger, #a83a3a)", margin: 0 }}
        >
          ✕ {err}
        </p>
      ) : null}
    </div>
  );
}
