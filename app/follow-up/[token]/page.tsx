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
import MultiSelectDerived from "../../components/MultiSelectDerived";
import type {
  Answer,
  BinaryPickQuestion,
  DerivedRankingQuestion,
  ForcedFreeformQuestion,
  MultiSelectDerivedAnswer,
  MultiSelectDerivedQuestion,
  Question,
  RankingItem,
  RankingQuestion,
  SinglePickAnswer,
} from "../../../lib/types";
import type {
  FollowUpQuestion,
  FollowUpQuestionSet,
} from "../../../lib/followUpQuestions";
// CC-170 — same resolvers the assessment uses; turn the session's stored
// parent rankings + binary picks into the items each derived question
// would render in the assessment flow.
import {
  deriveItemsForBinaryPick,
  deriveItemsForCrossRank,
  deriveItemsForMultiSelect,
  type DerivedItem,
} from "../../../lib/deriveQuestionItems";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface GetResponse {
  personName: string;
  missingQuestions: Question[];
  followUps: FollowUpQuestionSet;
  // CC-170 — the session's completed survey answers. The follow-up page
  // resolves derived-question items against these.
  answers: Answer[];
}

type RankingDraft = string[];
type ForcedDraft = string;
type FreeformDraft = string;
// CC-170 — `binary_pick_derived` writes a single picked id (the chosen
// item's id from the resolved two-item list).
type BinaryPickDraft = string;

type GapDraft =
  | RankingDraft
  | ForcedDraft
  | FreeformDraft
  | BinaryPickDraft
  | undefined;

// CC-170 — multiselect_derived state mirrors the assessment's per-
// question `multiSelectState` shape. Kept in a separate record from
// `gapDrafts` since the shape doesn't fit the simple primitive-/array-
// of-strings union.
type MultiSelectDraft = { selectedIds: string[]; otherText: string };

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
  // CC-170 — multiselect_derived drafts live in their own record (richer
  // shape than the primitive GapDraft union).
  const [multiSelectDrafts, setMultiSelectDrafts] = useState<
    Record<string, MultiSelectDraft>
  >({});
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
        gapDrafts,
        multiSelectDrafts,
        load.data.answers
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
            multiSelectDrafts={multiSelectDrafts}
            setMultiSelectDrafts={setMultiSelectDrafts}
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
  multiSelectDrafts: Record<string, MultiSelectDraft>;
  setMultiSelectDrafts: React.Dispatch<
    React.SetStateAction<Record<string, MultiSelectDraft>>
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
  multiSelectDrafts,
  setMultiSelectDrafts,
  followUpDrafts,
  setFollowUpDrafts,
  submitState,
  onSubmit,
}: ReadyFormProps) {
  // CC-170 — derived questions (ranking_derived / multiselect_derived /
  // binary_pick_derived) are now renderable too, provided the
  // session's stored parent answers have enough data for the resolver
  // to produce items. The previous behavior — defer ALL derived types
  // with a footer note — left exactly the highest-value
  // typing-refinement clarifiers unanswerable via the link.
  const beliefAnchor = useMemo(
    () => findBeliefAnchor(data.answers),
    [data.answers]
  );

  const renderableMissing = useMemo(
    () =>
      data.missingQuestions.filter((q) => {
        if (
          q.type === "ranking" ||
          q.type === "forced" ||
          q.type === "freeform"
        ) {
          return true;
        }
        // CC-170.1 — self-contained binary_pick (Q-TB attitude binaries):
        // `items` live on the question definition, no parent resolution
        // needed. Renderable on every legacy session whose bank exposes
        // a Q-TB-* in the missing set.
        if (q.type === "binary_pick") {
          return true;
        }
        if (q.type === "ranking_derived") {
          return (
            deriveItemsForCrossRank(
              q.question_id,
              q.derived_from,
              q.derived_top_n ?? 2,
              data.answers
            ) !== null
          );
        }
        if (q.type === "multiselect_derived") {
          return (
            deriveItemsForMultiSelect(
              q.derived_from,
              q.derived_top_n_per_source ?? 3,
              data.answers
            ) !== null
          );
        }
        if (q.type === "binary_pick_derived") {
          return (
            deriveItemsForBinaryPick(q.derived_from, data.answers) !== null
          );
        }
        return false;
      }),
    [data.missingQuestions, data.answers]
  );
  const deferredMissingCount =
    data.missingQuestions.length - renderableMissing.length;
  // CC-170 — assemble the deferred-count copy as a single string so the
  // adjacent JSX text/expression nodes don't collapse to "questionscouldn't"
  // (the cross-line whitespace JSX bug).
  const deferredNote =
    deferredMissingCount > 0
      ? `(${deferredMissingCount} follow-up question${
          deferredMissingCount === 1 ? "" : "s"
        } need answers you didn't complete in the original survey, so they're not shown here.)`
      : null;

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
              multiSelectDraft={multiSelectDrafts[q.question_id]}
              onMultiSelectChange={(next) =>
                setMultiSelectDrafts((prev) => ({
                  ...prev,
                  [q.question_id]: next,
                }))
              }
              sessionAnswers={data.answers}
              beliefAnchor={beliefAnchor}
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

      {deferredNote ? (
        <p
          className="font-serif italic"
          style={{
            fontSize: 12,
            color: "var(--ink-faint)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {deferredNote}
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
  multiSelectDraft,
  onMultiSelectChange,
  sessionAnswers,
  beliefAnchor,
}: {
  question: Question;
  draft: GapDraft;
  onChange: (next: GapDraft) => void;
  // CC-170 — multiselect_derived has a richer draft shape than the
  // primitive GapDraft union; tracked separately by the parent.
  multiSelectDraft: MultiSelectDraft | undefined;
  onMultiSelectChange: (next: MultiSelectDraft) => void;
  // CC-170 — the session's stored survey answers, needed to resolve
  // derived-question items here (same resolvers as the assessment).
  sessionAnswers: Answer[];
  // CC-170 — Q-I1 (or Q-I1b) freeform, shown above the multiselect
  // derived clarifiers as the belief anchor.
  beliefAnchor: string | null;
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
  // CC-170.1 — self-contained binary_pick (Q-TB attitude binaries).
  // Items live on the question; render via SinglePickPicker with no
  // parent resolution.
  if (question.type === "binary_pick") {
    const q = question as BinaryPickQuestion;
    return (
      <QuestionShellLite text={q.text} hint={q.helper}>
        <SinglePickPicker
          items={q.items}
          selectedId={typeof draft === "string" && draft.length > 0 ? draft : null}
          onChange={(pickedId) => onChange(pickedId)}
        />
      </QuestionShellLite>
    );
  }
  // CC-170 — derived types. Resolvers return null when parents lack
  // data; we filter those out upstream in `renderableMissing`, so a
  // null return here is treated as a cascade-skip (render nothing —
  // the deferred-count note covers it).
  if (question.type === "ranking_derived") {
    const q = question as DerivedRankingQuestion;
    const resolved = deriveItemsForCrossRank(
      q.question_id,
      q.derived_from,
      q.derived_top_n ?? 2,
      sessionAnswers
    );
    if (!resolved) return null;
    return (
      <QuestionShellLite
        text={q.text}
        hint={q.helper ?? "Drag or click to rank in order."}
      >
        <Ranking
          items={resolved.items}
          initialOrder={Array.isArray(draft) ? (draft as string[]) : undefined}
          onChange={(order) => onChange(order)}
        />
      </QuestionShellLite>
    );
  }
  if (question.type === "multiselect_derived") {
    const q = question as MultiSelectDerivedQuestion;
    const resolved = deriveItemsForMultiSelect(
      q.derived_from,
      q.derived_top_n_per_source ?? 3,
      sessionAnswers
    );
    if (!resolved || !q.none_option || !q.other_option) return null;
    const state = multiSelectDraft ?? { selectedIds: [], otherText: "" };
    return (
      <QuestionShellLite text={q.text} hint={q.helper}>
        <MultiSelectDerived
          beliefAnchor={beliefAnchor}
          items={resolved}
          noneOption={q.none_option}
          otherOption={q.other_option}
          selectedIds={state.selectedIds}
          otherText={state.otherText}
          onSelectionsChange={(selectedIds) =>
            onMultiSelectChange({
              selectedIds,
              otherText: state.otherText,
            })
          }
          onOtherTextChange={(otherText) =>
            onMultiSelectChange({
              selectedIds: state.selectedIds,
              otherText,
            })
          }
        />
      </QuestionShellLite>
    );
  }
  if (question.type === "binary_pick_derived") {
    const items = deriveItemsForBinaryPick(
      question.derived_from ?? [],
      sessionAnswers
    );
    if (!items) return null;
    return (
      <QuestionShellLite text={question.text} hint={question.helper}>
        <SinglePickPicker
          items={items}
          selectedId={typeof draft === "string" && draft.length > 0 ? draft : null}
          onChange={(pickedId) => onChange(pickedId)}
        />
      </QuestionShellLite>
    );
  }
  return null;
}

// CC-170 — duplicate of the assessment's belief-anchor lookup. Kept
// local to the follow-up page rather than extracted because (a) the
// shape is tiny and (b) the assessment file is the only other call
// site, so a shared helper would invert the dependency for almost no
// reuse. The behavior is byte-identical with the assessment's
// `findBeliefAnchor` (~app/assessment/page.tsx).
function findBeliefAnchor(answers: Answer[]): string | null {
  const qi1 = answers.find((a) => a.question_id === "Q-I1");
  if (qi1 && qi1.type === "freeform" && qi1.response.trim().length > 0) {
    return qi1.response.trim();
  }
  const qi1b = answers.find((a) => a.question_id === "Q-I1b");
  if (qi1b && qi1b.type === "freeform" && qi1b.response.trim().length > 0) {
    return qi1b.response.trim();
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
  drafts: Record<string, GapDraft>,
  multiSelectDrafts: Record<string, MultiSelectDraft>,
  sessionAnswers: Answer[]
): Answer[] {
  const out: Answer[] = [];
  for (const q of questions) {
    if (q.type === "ranking") {
      const draft = drafts[q.question_id];
      if (Array.isArray(draft) && draft.length > 0) {
        out.push({
          question_id: q.question_id,
          card_id: q.card_id,
          question_text: q.text,
          type: "ranking",
          order: draft as string[],
        });
      }
      continue;
    }
    if (q.type === "forced") {
      const draft = drafts[q.question_id];
      if (typeof draft === "string" && draft.length > 0) {
        out.push({
          question_id: q.question_id,
          card_id: q.card_id,
          question_text: q.text,
          type: "forced",
          response: draft,
        });
      }
      continue;
    }
    if (q.type === "freeform") {
      const draft = drafts[q.question_id];
      if (typeof draft === "string" && draft.trim().length > 0) {
        out.push({
          question_id: q.question_id,
          card_id: q.card_id,
          question_text: q.text,
          type: "freeform",
          response: draft.trim(),
        });
      }
      continue;
    }
    // CC-170.1 — binary_pick (self-contained Q-TB attitude binaries).
    // Persists as a SinglePickAnswer carrying the chosen item's signal
    // — same shape the assessment writes via `handleContinue` and what
    // `binary_pick_derived` already emits.
    if (q.type === "binary_pick") {
      const draft = drafts[q.question_id];
      if (typeof draft !== "string" || draft.length === 0) continue;
      const picked = q.items.find((it) => it.id === draft);
      if (!picked) continue;
      const answer: SinglePickAnswer = {
        question_id: q.question_id,
        card_id: q.card_id,
        question_text: q.text,
        type: "single_pick",
        picked_id: picked.id,
        picked_signal: picked.signal,
      };
      out.push(answer);
      continue;
    }
    // CC-170 — derived gap-fills. Each writes the same Answer shape the
    // assessment + saveSession.ts already know how to persist (matches
    // the assessment's `handleContinue` branches one-for-one).
    if (q.type === "ranking_derived") {
      const draft = drafts[q.question_id];
      if (!Array.isArray(draft) || draft.length === 0) continue;
      const resolved = deriveItemsForCrossRank(
        q.question_id,
        q.derived_from,
        q.derived_top_n ?? 2,
        sessionAnswers
      );
      if (!resolved) continue;
      out.push({
        question_id: q.question_id,
        card_id: q.card_id,
        question_text: q.text,
        type: "ranking_derived",
        order: draft as string[],
        derived_item_sources: resolved.sources,
      });
      continue;
    }
    if (q.type === "multiselect_derived") {
      const state = multiSelectDrafts[q.question_id];
      if (!state) continue;
      if (state.selectedIds.length === 0) continue;
      if (!q.none_option || !q.other_option) continue;
      const resolved = deriveItemsForMultiSelect(
        q.derived_from,
        q.derived_top_n_per_source ?? 3,
        sessionAnswers
      );
      if (!resolved) continue;
      const noneId = q.none_option.id;
      const otherId = q.other_option.id;
      const selections: MultiSelectDerivedAnswer["selections"] = [];
      for (const sid of state.selectedIds) {
        if (sid === noneId || sid === otherId) continue;
        const item: DerivedItem | undefined = resolved.find(
          (it) => it.id === sid
        );
        if (!item) continue;
        selections.push({
          id: item.id,
          signal: item.signal,
          source_question_id: item.source_question_id,
        });
      }
      if (state.selectedIds.includes(otherId)) {
        selections.push({ id: otherId, signal: null });
      }
      const otherText = state.otherText.trim();
      const noneSelected = state.selectedIds.includes(noneId);
      const answer: MultiSelectDerivedAnswer = {
        question_id: q.question_id,
        card_id: q.card_id,
        question_text: q.text,
        type: "multiselect_derived",
        selections,
        none_selected: noneSelected,
        ...(otherText.length > 0 ? { other_text: otherText } : {}),
      };
      out.push(answer);
      continue;
    }
    if (q.type === "binary_pick_derived") {
      const draft = drafts[q.question_id];
      if (typeof draft !== "string" || draft.length === 0) continue;
      const items: RankingItem[] | null = deriveItemsForBinaryPick(
        q.derived_from ?? [],
        sessionAnswers
      );
      if (!items) continue;
      const picked = items.find((it) => it.id === draft);
      if (!picked) continue;
      const answer: SinglePickAnswer = {
        question_id: q.question_id,
        card_id: q.card_id,
        question_text: q.text,
        type: "single_pick",
        picked_id: picked.id,
        picked_signal: picked.signal,
      };
      out.push(answer);
      continue;
    }
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
