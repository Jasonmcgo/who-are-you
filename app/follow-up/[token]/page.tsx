// CC-127 — Public follow-up answer page.
//
// Path: `/follow-up/[token]` — outside `/api/admin/**` so the admin
// auth middleware does NOT gate it. The token is the auth; the page is
// intentionally open.
//
// Flow:
//   1. On mount, GET `/api/follow-up/[token]`.
//   2. Render the missing (gap-fill) questions from the bank, by type
//      (`ranking`, `forced`, `freeform`), reusing the assessment's
//      `Ranking` component for ranking and a simple inline control for
//      forced / freeform. Derived gap-fills (ranking_derived,
//      multiselect_derived) are deferred — they need parent-derived
//      item bookkeeping the assessment owns; for CC-127 they are
//      skipped with a small "not yet supported here" note. Most cohort
//      gap-fills are ranking / forced / freeform.
//   3. Render the 3 follow-up questions. `choose_one` → reuse
//      `SinglePickPicker`; `rank_top_2` / `rank_top_3` → reuse
//      `Ranking` with `cap` on the order length.
//   4. Submit → POST `/api/follow-up/[token]` with the CC-126 payload
//      shape: `{ gapFillAnswers: Answer[], followUpAnswers: [{
//      questionId, responseMode, pickedLabels }] }`.
//   5. On success, show a calm confirmation and disable re-submit.

"use client";

import { use, useEffect, useMemo, useState } from "react";
import Ranking from "../../components/Ranking";
import SinglePickPicker from "../../components/SinglePickPicker";
import type {
  Answer,
  ForcedFreeformQuestion,
  Question,
  RankingItem,
  RankingQuestion,
} from "../../../lib/types";
import type {
  FollowUpQuestion,
  FollowUpQuestionSet,
} from "../../../lib/followUpQuestions";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface GetResponse {
  personName: string;
  missingQuestions: Question[];
  followUps: FollowUpQuestionSet;
}

type RankingDraft = string[];
type ForcedDraft = string;
type FreeformDraft = string;

type GapDraft = RankingDraft | ForcedDraft | FreeformDraft | undefined;

type FollowUpDraft = string[];

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: GetResponse };

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  // CC-129 Part C — capture `reportUrl` from the POST response so the
  // confirmation can reveal the user's public report page as the
  // reward for completing the follow-ups.
  | { status: "submitted"; reportUrl: string | null }
  | { status: "error"; message: string };

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function FollowUpAnswerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [gapDrafts, setGapDrafts] = useState<Record<string, GapDraft>>({});
  const [followUpDrafts, setFollowUpDrafts] = useState<
    Record<string, FollowUpDraft>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/follow-up/${token}`);
        if (!res.ok) {
          if (cancelled) return;
          // 404 (unknown token) or 5xx — present a calm inactive state.
          if (res.status === 404) {
            setLoad({
              status: "error",
              message: "this-link-isnt-active",
            });
            return;
          }
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setLoad({
            status: "error",
            message: body.error ?? `request failed (${res.status})`,
          });
          return;
        }
        const data = (await res.json()) as GetResponse;
        if (!cancelled) setLoad({ status: "ready", data });
      } catch (e) {
        if (cancelled) return;
        setLoad({
          status: "error",
          message: e instanceof Error ? e.message : "request failed",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit() {
    if (load.status !== "ready") return;
    setSubmitState({ status: "submitting" });
    try {
      const gapFillAnswers = buildGapFillAnswers(
        load.data.missingQuestions,
        gapDrafts
      );
      const followUpAnswers = buildFollowUpAnswers(
        load.data.followUps.questions,
        followUpDrafts
      );
      const res = await fetch(`/api/follow-up/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gapFillAnswers, followUpAnswers }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `submit failed (${res.status})`);
      }
      const body = (await res.json().catch(() => ({}))) as {
        reportUrl?: string;
      };
      setSubmitState({
        status: "submitted",
        reportUrl: typeof body.reportUrl === "string" ? body.reportUrl : null,
      });
    } catch (e) {
      setSubmitState({
        status: "error",
        message: e instanceof Error ? e.message : "submit failed",
      });
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        padding: "32px 18px 96px",
      }}
    >
      <div
        className="flex flex-col"
        style={{ maxWidth: 720, margin: "0 auto", gap: 24 }}
      >
        {load.status === "loading" ? (
          <LoadingState />
        ) : load.status === "error" ? (
          <InactiveLinkState detail={load.message} />
        ) : submitState.status === "submitted" ? (
          <SubmittedState
            personName={load.data.personName}
            reportUrl={submitState.reportUrl}
          />
        ) : (
          <ReadyForm
            data={load.data}
            gapDrafts={gapDrafts}
            setGapDrafts={setGapDrafts}
            followUpDrafts={followUpDrafts}
            setFollowUpDrafts={setFollowUpDrafts}
            submitState={submitState}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-states
// ─────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <p
      className="font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.16em",
        color: "var(--ink-mute)",
        textAlign: "center",
        padding: 40,
      }}
    >
      Loading…
    </p>
  );
}

function InactiveLinkState({ detail }: { detail: string }) {
  return (
    <div className="flex flex-col" style={{ gap: 14, paddingTop: 40 }}>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        This link isn&apos;t active
      </p>
      <p
        className="font-serif italic"
        style={{
          fontSize: 14,
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        The follow-up link couldn&apos;t be opened. It may have expired or the
        URL may be incorrect. Reach out to whoever sent the link and ask them
        to re-send.
      </p>
      {detail !== "this-link-isnt-active" ? (
        <p
          className="font-mono"
          style={{ fontSize: 10, color: "var(--ink-faint)", margin: 0 }}
        >
          ({detail})
        </p>
      ) : null}
    </div>
  );
}

function SubmittedState({
  personName,
  reportUrl,
}: {
  personName: string;
  reportUrl: string | null;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 16, paddingTop: 40 }}>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--umber)",
          margin: 0,
        }}
      >
        Submitted
      </p>
      <h1
        className="font-serif"
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        Thanks{personName && personName !== "You" ? `, ${personName}` : ""} —
        your page is ready.
      </h1>
      {/* CC-129 Part C — the report link is the reward for completing
          the follow-ups. It appears only after a successful submit.
          The link is opened in a new tab so the confirmation stays
          available behind it. */}
      {reportUrl ? (
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener"
          className="font-mono uppercase"
          style={{
            display: "inline-block",
            alignSelf: "flex-start",
            fontSize: 12,
            letterSpacing: "0.12em",
            background: "var(--umber)",
            color: "var(--paper, #fff)",
            border: "1px solid var(--umber)",
            padding: "12px 18px",
            textDecoration: "none",
          }}
        >
          Open your report ↗
        </a>
      ) : null}
      <p
        className="font-serif italic"
        style={{
          fontSize: 14,
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        Your follow-up answers are folded in and the report has updated. Bookmark
        the page above — it&apos;s how you&apos;ll find your read again.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────

interface ReadyFormProps {
  data: GetResponse;
  gapDrafts: Record<string, GapDraft>;
  setGapDrafts: React.Dispatch<
    React.SetStateAction<Record<string, GapDraft>>
  >;
  followUpDrafts: Record<string, FollowUpDraft>;
  setFollowUpDrafts: React.Dispatch<
    React.SetStateAction<Record<string, FollowUpDraft>>
  >;
  submitState: SubmitState;
  onSubmit: () => void;
}

function ReadyForm({
  data,
  gapDrafts,
  setGapDrafts,
  followUpDrafts,
  setFollowUpDrafts,
  submitState,
  onSubmit,
}: ReadyFormProps) {
  // Only show gap-fill questions we can render here: ranking, forced,
  // freeform. Derived types need parent bookkeeping — defer them.
  const renderableMissing = useMemo(
    () =>
      data.missingQuestions.filter(
        (q) =>
          q.type === "ranking" ||
          q.type === "forced" ||
          q.type === "freeform"
      ),
    [data.missingQuestions]
  );
  const deferredMissingCount = data.missingQuestions.length - renderableMissing.length;

  const canSubmit = submitState.status !== "submitting";

  return (
    <>
      <header className="flex flex-col" style={{ gap: 10 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Follow-up
        </p>
        <h1
          className="font-serif"
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          A few follow-up questions
          {data.personName && data.personName !== "You"
            ? `, ${data.personName}`
            : ""}{" "}
          —
        </h1>
        <p
          className="font-serif italic"
          style={{
            fontSize: 14,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          Take these at your own pace. When you submit, your read updates with
          the new answers folded in.
        </p>
      </header>

      {renderableMissing.length > 0 ? (
        <section className="flex flex-col" style={{ gap: 20 }}>
          <SectionLabel>Questions you didn&apos;t reach</SectionLabel>
          {renderableMissing.map((q) => (
            <GapFillBlock
              key={q.question_id}
              question={q}
              draft={gapDrafts[q.question_id]}
              onChange={(next) =>
                setGapDrafts((prev) => ({ ...prev, [q.question_id]: next }))
              }
            />
          ))}
        </section>
      ) : null}

      <section className="flex flex-col" style={{ gap: 20 }}>
        <SectionLabel>Your three follow-ups</SectionLabel>
        {data.followUps.questions.map((q) => (
          <FollowUpBlock
            key={q.id}
            question={q}
            draft={followUpDrafts[q.id]}
            onChange={(next) =>
              setFollowUpDrafts((prev) => ({ ...prev, [q.id]: next }))
            }
          />
        ))}
      </section>

      {deferredMissingCount > 0 ? (
        <p
          className="font-serif italic"
          style={{
            fontSize: 12,
            color: "var(--ink-faint)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          ({deferredMissingCount} additional question
          {deferredMissingCount === 1 ? "" : "s"} couldn&apos;t be shown here —
          they depend on items you ranked elsewhere in the survey. Whoever sent
          the link can collect them in a separate pass if useful.)
        </p>
      ) : null}

      <div className="flex flex-col" style={{ gap: 12, marginTop: 12 }}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="font-mono uppercase"
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            background: "var(--umber)",
            color: "var(--paper, #fff)",
            border: "1px solid var(--umber)",
            padding: "12px 18px",
            cursor: canSubmit ? "pointer" : "wait",
            opacity: canSubmit ? 1 : 0.6,
            alignSelf: "flex-start",
          }}
        >
          {submitState.status === "submitting" ? "submitting…" : "submit"}
        </button>
        {submitState.status === "error" ? (
          <p
            className="font-serif italic"
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              margin: 0,
            }}
          >
            Something went wrong on submit: {submitState.message}
          </p>
        ) : null}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Gap-fill question block
// ─────────────────────────────────────────────────────────────────────

function GapFillBlock({
  question,
  draft,
  onChange,
}: {
  question: Question;
  draft: GapDraft;
  onChange: (next: GapDraft) => void;
}) {
  if (question.type === "ranking") {
    return (
      <QuestionShellLite
        text={(question as RankingQuestion).text}
        hint="Drag or click to rank in order."
      >
        <Ranking
          items={(question as RankingQuestion).items}
          initialOrder={Array.isArray(draft) ? (draft as string[]) : undefined}
          onChange={(order) => onChange(order)}
        />
      </QuestionShellLite>
    );
  }
  if (question.type === "forced") {
    const opts = (question as ForcedFreeformQuestion).options;
    return (
      <QuestionShellLite text={(question as ForcedFreeformQuestion).text}>
        <ForcedChoiceList
          options={opts.map((o) => o.label)}
          selectedLabel={typeof draft === "string" ? draft : ""}
          onSelect={(label) => onChange(label)}
        />
      </QuestionShellLite>
    );
  }
  if (question.type === "freeform") {
    return (
      <QuestionShellLite text={(question as ForcedFreeformQuestion).text}>
        <FreeformInput
          value={typeof draft === "string" ? draft : ""}
          onChange={(text) => onChange(text)}
        />
      </QuestionShellLite>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Follow-up question block
// ─────────────────────────────────────────────────────────────────────

function FollowUpBlock({
  question,
  draft,
  onChange,
}: {
  question: FollowUpQuestion;
  draft: FollowUpDraft | undefined;
  onChange: (next: FollowUpDraft) => void;
}) {
  // Convert FollowUpOption[] → RankingItem[] shape so we can reuse
  // SinglePickPicker / Ranking unchanged.
  //
  // CC-149 — render the plain sentence as the displayed option, not the
  // terse insider `label`. The owner read through `control_mastery`
  // live and confirmed the terse labels ("Held lightly",
  // "Recoveries on record") actively seeded wrong guesses; the
  // sentence is the option a reader can act on. Implementation:
  //   - `id` stays = `o.label`  (write-back key — the POST handler in
  //     `app/api/follow-up/[token]/route.ts` matches on
  //     `o.label === payload.pickedLabels[0]`; the picker passes the
  //     item's `id` back through `onChange`)
  //   - `label` displayed = `o.text`  (the sentence; `Ranking` reads
  //     `item.label` in its else-branch — see `Ranking.tsx:335` —
  //     because we don't supply a `voice` to trigger the quote-body
  //     branch; `SinglePickPicker.tsx:85` likewise reads
  //     `item.label`).
  // No edit to `Ranking.tsx` (that would touch every ranking
  // question's display); no change to the write-back key.
  const items: RankingItem[] = useMemo(
    () =>
      question.options.map((o) => ({
        id: o.label,
        label: o.text,
        // `signal` is required by the RankingItem type but the public
        // answer page never reads it; the engine reads tags via the
        // POST handler's signal translation, not this surface.
        signal: `__followup_${o.label}` as never,
      })),
    [question.options]
  );

  const cap =
    question.responseMode === "rank_top_3"
      ? 3
      : question.responseMode === "rank_top_2"
      ? 2
      : 1;

  if (question.responseMode === "choose_one") {
    const selectedId = draft && draft.length > 0 ? draft[0] : null;
    return (
      <QuestionShellLite text={question.question}>
        <SinglePickPicker
          items={items}
          selectedId={selectedId}
          onChange={(pickedId) => onChange([pickedId])}
        />
      </QuestionShellLite>
    );
  }

  // rank_top_2 / rank_top_3
  return (
    <QuestionShellLite
      text={question.question}
      hint={
        cap === 2
          ? "Rank your top two."
          : "Rank your top three."
      }
    >
      <Ranking
        items={items}
        initialOrder={Array.isArray(draft) ? (draft as string[]) : undefined}
        onChange={(order) => {
          // Cap the ranking to the response mode's top-N. The Ranking
          // component returns a full order; we truncate for write-back
          // but keep the user's full order visible inside the picker.
          onChange(order.slice(0, cap));
        }}
      />
    </QuestionShellLite>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Small UI primitives — kept inline rather than extracted to a shared
// component file, per CC-127 scope ("a small client component for the
// Copy button" — no other new shared components).
// ─────────────────────────────────────────────────────────────────────

function QuestionShellLite({
  text,
  hint,
  children,
}: {
  text: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="flex flex-col"
      style={{
        gap: 14,
        padding: "20px 18px",
        borderRadius: 8,
        background: "var(--paper-warm)",
        border: "1px solid var(--rule-soft)",
      }}
    >
      <h2
        className="font-serif"
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {text}
      </h2>
      {hint ? (
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          {hint}
        </p>
      ) : null}
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.16em",
        color: "var(--ink-mute)",
        margin: 0,
      }}
    >
      {children}
    </h3>
  );
}

function ForcedChoiceList({
  options,
  selectedLabel,
  onSelect,
}: {
  options: string[];
  selectedLabel: string;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {options.map((label) => {
        const selected = label === selectedLabel;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            data-focus-ring
            className="font-serif text-left"
            style={{
              background: selected ? "var(--umber-wash)" : "var(--paper)",
              border: selected
                ? "1px solid var(--umber)"
                : "1px solid var(--rule)",
              padding: "12px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 15,
              lineHeight: 1.4,
              color: "var(--ink)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function FreeformInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="font-serif"
      style={{
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        padding: "10px 12px",
        borderRadius: 6,
        fontSize: 15,
        color: "var(--ink)",
        lineHeight: 1.5,
        resize: "vertical",
        fontFamily: "inherit",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// Answer-builders for POST
// ─────────────────────────────────────────────────────────────────────

function buildGapFillAnswers(
  questions: Question[],
  drafts: Record<string, GapDraft>
): Answer[] {
  const out: Answer[] = [];
  for (const q of questions) {
    const draft = drafts[q.question_id];
    if (draft === undefined) continue;
    if (q.type === "ranking" && Array.isArray(draft) && draft.length > 0) {
      out.push({
        question_id: q.question_id,
        card_id: q.card_id,
        question_text: q.text,
        type: "ranking",
        order: draft as string[],
      });
    } else if (
      q.type === "forced" &&
      typeof draft === "string" &&
      draft.length > 0
    ) {
      out.push({
        question_id: q.question_id,
        card_id: q.card_id,
        question_text: q.text,
        type: "forced",
        response: draft,
      });
    } else if (
      q.type === "freeform" &&
      typeof draft === "string" &&
      draft.trim().length > 0
    ) {
      out.push({
        question_id: q.question_id,
        card_id: q.card_id,
        question_text: q.text,
        type: "freeform",
        response: draft.trim(),
      });
    }
    // derived types skipped (we didn't render them)
  }
  return out;
}

interface FollowUpAnswerPayload {
  questionId: string;
  responseMode: "choose_one" | "rank_top_2" | "rank_top_3";
  pickedLabels: string[];
}

function buildFollowUpAnswers(
  questions: FollowUpQuestion[],
  drafts: Record<string, FollowUpDraft>
): FollowUpAnswerPayload[] {
  const out: FollowUpAnswerPayload[] = [];
  for (const q of questions) {
    const draft = drafts[q.id];
    if (!draft || draft.length === 0) continue;
    const mode = q.responseMode;
    if (mode !== "choose_one" && mode !== "rank_top_2" && mode !== "rank_top_3") {
      continue;
    }
    out.push({
      questionId: q.id,
      responseMode: mode,
      pickedLabels: draft,
    });
  }
  return out;
}
