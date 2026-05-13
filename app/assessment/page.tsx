"use client";

import { useEffect, useMemo, useState } from "react";
import { questions } from "../../data/questions";
import {
  buildInnerConstitution,
  toAnswer,
  toRankingAnswer,
} from "../../lib/identityEngine";
import type {
  Answer,
  AspirationalOverlay,
  CardId,
  MetaSignal,
  MultiSelectDerivedAnswer,
  QuestionOption,
  RankingDerivedAnswer,
  RankingItem,
  SinglePickAnswer,
  TensionStatus,
} from "../../lib/types";
import Ranking from "../components/Ranking";
import QuestionShell from "../components/QuestionShell";
import InnerConstitutionPage from "../components/InnerConstitutionPage";
// CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — augment constitution with LLM
// Path master synthesis paragraph via the server-side API endpoint.
// Cache hits pass through; cache misses fire one API call per fresh
// shape.
import { useLlmMasterSynthesis } from "../../lib/synthesis3LlmClient";
// CC-GRIP-TAXONOMY — sibling hook to useLlmMasterSynthesis. Fetches the
// Grip section LLM paragraph from /api/grip/paragraph (server-only)
// when the static cache misses. Pass-through for cached / low-
// confidence shapes.
import { useGripParagraph } from "../../lib/gripTaxonomyLlmClient";
import IdentityAndContextPage from "../components/IdentityAndContextPage";
import { saveSession } from "../../lib/saveSession";
import type { DemographicAnswer } from "../../lib/types";
import SecondPassPage from "../components/SecondPassPage";
import MultiSelectDerived, { type DerivedItem } from "../components/MultiSelectDerived";

// CC-016 — the four allocation parent rankings that get the per-item
// three-state aspirational overlay affordance.
const ALLOCATION_PARENT_RANKINGS = new Set([
  "Q-S3-close",
  "Q-S3-wider",
  "Q-E1-outward",
  "Q-E1-inward",
]);

// CC-022a Item 6 — the Q-I1 (first Keystone) index, computed once at module
// load. The second-pass trigger relocation watches for the boundary where
// the next question would be Q-I1 — if any prior question was skipped, we
// detour into second-pass first so Q-I2 / Q-I3 derive from the cleanest
// possible parent answers.
const Q_I1_INDEX = questions.findIndex((q) => q.question_id === "Q-I1");

// CC-016 — derive items for a `ranking_derived` question from the top-N of
// its parent answers. Returns null if any parent doesn't have enough items
// (cascade-skip should fire in that case). CC-017 — extended for use by
// `multiselect_derived` questions via `deriveItemsForMultiSelect` below;
// the same parent-walking and id-namespacing semantics apply.
function deriveItemsForCrossRank(
  derivedQuestionId: string,
  derivedFrom: string[],
  topN: number,
  answers: Answer[]
): {
  items: RankingItem[];
  sources: { id: string; signal: string; source_question_id: string }[];
} | null {
  const items: RankingItem[] = [];
  const sources: { id: string; signal: string; source_question_id: string }[] =
    [];
  for (const parentId of derivedFrom) {
    const parentAnswer = answers.find(
      (a) => a.question_id === parentId && a.type === "ranking"
    );
    if (!parentAnswer || parentAnswer.type !== "ranking") return null;
    if (parentAnswer.order.length < topN) return null;
    const parentQuestion = questions.find((q) => q.question_id === parentId);
    if (!parentQuestion || parentQuestion.type !== "ranking") return null;
    for (let i = 0; i < topN; i++) {
      const itemId = parentAnswer.order[i];
      const parentItem = parentQuestion.items.find((it) => it.id === itemId);
      if (!parentItem) return null;
      // Namespace the id so collisions across parents don't clobber.
      const namespacedId = `${parentId}:${parentItem.id}`;
      items.push({
        id: namespacedId,
        label: parentItem.label,
        gloss: parentItem.gloss,
        signal: parentItem.signal,
      });
      sources.push({
        id: namespacedId,
        signal: parentItem.signal,
        source_question_id: parentId,
      });
    }
  }
  void derivedQuestionId;
  return { items, sources };
}

// CC-017 — derive items for a `multiselect_derived` question from the top-N
// of each parent ranking answer. Same shape as deriveItemsForCrossRank but
// returns null only when ALL parents lack data (Q-I2 / Q-I3 can render with
// just one parent's items per spec); per-parent partial availability is OK.
// Returns the items list as `DerivedItem[]` (the MultiSelectDerived component's
// expected shape).
function deriveItemsForMultiSelect(
  derivedFrom: string[],
  topN: number,
  answers: Answer[]
): DerivedItem[] | null {
  const items: DerivedItem[] = [];
  let anyParentHadData = false;
  for (const parentId of derivedFrom) {
    const parentAnswer = answers.find(
      (a) => a.question_id === parentId && a.type === "ranking"
    );
    if (!parentAnswer || parentAnswer.type !== "ranking") continue;
    if (parentAnswer.order.length === 0) continue;
    const parentQuestion = questions.find((q) => q.question_id === parentId);
    if (!parentQuestion || parentQuestion.type !== "ranking") continue;
    anyParentHadData = true;
    const take = Math.min(topN, parentAnswer.order.length);
    for (let i = 0; i < take; i++) {
      const itemId = parentAnswer.order[i];
      const parentItem = parentQuestion.items.find((it) => it.id === itemId);
      if (!parentItem) continue;
      items.push({
        id: `${parentId}:${parentItem.id}`,
        label: parentItem.label,
        gloss: parentItem.gloss,
        signal: parentItem.signal,
        source_question_id: parentId,
      });
    }
  }
  return anyParentHadData ? items : null;
}

// CC-017 — find the user's belief anchor: Q-I1 freeform first; on skip,
// Q-I1b. Returns null if neither was answered.
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

type Confirmation = {
  status: TensionStatus;
  note?: string;
};

const CARD_KICKER_NAME: Record<CardId, string> = {
  conviction: "CONVICTION",
  pressure: "PRESSURE",
  formation: "FORMATION",
  context: "CONTEXT",
  agency: "AGENCY",
  sacred: "SACRED VALUES",
  role: "ROLE",
  temperament: "FOUR VOICES",
  contradiction: "CONTRADICTION",
};

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [confirmations, setConfirmations] = useState<
    Record<string, Confirmation>
  >({});
  const [explainOpen, setExplainOpen] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string | string[]>>({});
  const [skippedQuestionIds, setSkippedQuestionIds] = useState<string[]>([]);
  const [metaSignals, setMetaSignals] = useState<MetaSignal[]>([]);
  // CC-022a — phase machinery rewritten for save-before-portrait flow.
  //   "first_pass" — test in progress.
  //   "second_pass" — second-pass page renders. Trigger relocated to
  //     post-Allocation / pre-Keystone (Item 6) so Q-I2 / Q-I3 can derive
  //     from second-pass-completed parent answers.
  //   "identity_context" — demographics page (now reached automatically
  //     after the test completes, not via an opt-in Save button).
  //   "result" — the InnerConstitution renders. Reached only after the
  //     save commits (Item 7); no thank-you detour.
  const [phase, setPhase] = useState<
    "first_pass" | "second_pass" | "identity_context" | "result"
  >("first_pass");
  // CC-022a Item 6 — when set, second-pass returns the user to the test at
  // this index instead of advancing to identity_context. Set when the
  // pre-Keystone boundary triggers the second pass (resume target = Q-I1);
  // null when the second pass fires at end-of-flow as a defensive backstop.
  const [secondPassResumeIndex, setSecondPassResumeIndex] = useState<number | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // CC-022a — captured demographics from the just-completed Identity &
  // Context fill. Used by the result-phase render to thread name + other
  // demographic hooks into the prose (CC-022b consumers). Renamed-in-spirit
  // from the CC-020 `submittedDemographics` "deviation workaround"; with
  // save-before-portrait this is now the natural data flow.
  const [submittedDemographics, setSubmittedDemographics] = useState<
    DemographicAnswer[] | null
  >(null);
  // CC-020 — the timestamp the save committed. Used by buildFilename so the
  // .md filename matches the saved session's date.
  const [sessionSavedAt, setSessionSavedAt] = useState<Date | null>(null);
  // CC-016 — per-question allocation overlays. Keyed by question_id.
  const [overlays, setOverlays] = useState<
    Record<string, Record<string, AspirationalOverlay>>
  >({});
  // CC-017 — per-question multi-select state. Keyed by question_id.
  // `selectedIds` includes the noneOption.id and otherOption.id sentinels
  // when those are checked.
  const [multiSelectState, setMultiSelectState] = useState<
    Record<string, { selectedIds: string[]; otherText: string }>
  >({});

  const question = questions[current];

  // CC-016 — for ranking_derived questions, compute items + sources from
  // parent answers. Returns null if the parents don't have enough data
  // (cascade-skip will fire).
  const derivedItems = useMemo(() => {
    if (question.type !== "ranking_derived") return null;
    return deriveItemsForCrossRank(
      question.question_id,
      question.derived_from,
      question.derived_top_n ?? 2,
      answers
    );
  }, [question, answers]);

  // CC-017 — for multiselect_derived questions, compute the derived items
  // from the top-N of each parent ranking. Returns null when ALL parents
  // lack data (cascade-skip will fire).
  const multiSelectDerivedItems = useMemo(() => {
    if (question.type !== "multiselect_derived") return null;
    return deriveItemsForMultiSelect(
      question.derived_from,
      question.derived_top_n_per_source ?? 3,
      answers
    );
  }, [question, answers]);

  // CC-017 — belief anchor (Q-I1 → Q-I1b fallback). Surfaced above Q-I2 / Q-I3.
  const beliefAnchor = useMemo(() => findBeliefAnchor(answers), [answers]);

  // CC-017 — Q-I1b is conditional. Renders only when its `render_if_skipped`
  // target (Q-I1) is in skippedQuestionIds. If Q-I1 was answered, advance
  // past Q-I1b on render (deferred via queueMicrotask to satisfy
  // react-hooks/set-state-in-effect).
  useEffect(() => {
    if (question.type !== "freeform" && question.type !== "forced") return;
    if (!question.render_if_skipped) return;
    const conditionTarget = question.render_if_skipped;
    const wasSkipped = skippedQuestionIds.includes(conditionTarget);
    const wasAnswered = answers.some(
      (a) => a.question_id === conditionTarget
    );
    if (wasSkipped) return; // condition met — render normally
    if (!wasAnswered) return; // condition not yet decided — render normally
    // Condition target was answered (not skipped) — auto-advance past this
    // conditional question.
    const idx = current;
    queueMicrotask(() => {
      advanceFromIndex(idx);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, skippedQuestionIds, answers]);

  // CC-016 — cascade-skip when entering a ranking_derived question whose
  // parents aren't fully populated. Auto-records a derived_question_skipped
  // meta-signal and advances past it. Deferred via queueMicrotask so the
  // state updates happen after the effect returns (satisfies
  // react-hooks/set-state-in-effect).
  useEffect(() => {
    if (question.type !== "ranking_derived") return;
    if (derivedItems !== null) return;
    const qid = question.question_id;
    const cardId = question.card_id;
    const idx = current;
    queueMicrotask(() => {
      const meta: MetaSignal = {
        type: "derived_question_skipped",
        question_id: qid,
        card_id: cardId,
        recorded_at: Date.now(),
      };
      setMetaSignals((prev) =>
        prev.some((m) => m.question_id === qid) ? prev : [...prev, meta]
      );
      advanceFromIndex(idx);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, derivedItems]);

  // CC-017 — cascade-skip when entering a multiselect_derived question whose
  // parents lack data. Same shape as ranking_derived cascade-skip.
  useEffect(() => {
    if (question.type !== "multiselect_derived") return;
    if (multiSelectDerivedItems !== null) return;
    const qid = question.question_id;
    const cardId = question.card_id;
    const idx = current;
    queueMicrotask(() => {
      const meta: MetaSignal = {
        type: "derived_question_skipped",
        question_id: qid,
        card_id: cardId,
        recorded_at: Date.now(),
      };
      setMetaSignals((prev) =>
        prev.some((m) => m.question_id === qid) ? prev : [...prev, meta]
      );
      advanceFromIndex(idx);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, multiSelectDerivedItems]);

  const seed: string | string[] = useMemo(() => {
    const prev = answers.find((a) => a.question_id === question.question_id);
    if (question.type === "ranking") {
      return prev && prev.type === "ranking"
        ? prev.order
        : question.items.map((i) => i.id);
    }
    if (question.type === "ranking_derived") {
      if (prev && prev.type === "ranking_derived") return prev.order;
      return derivedItems ? derivedItems.items.map((i) => i.id) : [];
    }
    return prev && (prev.type === "forced" || prev.type === "freeform")
      ? prev.response
      : "";
  }, [question, answers, derivedItems]);

  const draft = drafts[question.question_id] ?? seed;

  function updateDraft(value: string | string[]) {
    setDrafts((prev) => ({ ...prev, [question.question_id]: value }));
  }

  function advance(next: Answer) {
    const nextAnswers = [
      ...answers.filter((x) => x.question_id !== next.question_id),
      next,
    ];
    setAnswers(nextAnswers);
    advanceFromIndex(current);
  }

  function advanceFromIndex(idx: number) {
    // CC-022a Item 6 — pre-Keystone second-pass trigger. If the next
    // question would be Q-I1 and the user has any skipped questions,
    // detour into second-pass first so Q-I2 / Q-I3's parents are clean
    // by the time the Keystone block runs. After second-pass we resume
    // at Q-I1 (see handleSecondPassComplete).
    const nextIdx = idx + 1;
    if (
      nextIdx === Q_I1_INDEX &&
      Q_I1_INDEX !== -1 &&
      skippedQuestionIds.length > 0
    ) {
      setSecondPassResumeIndex(Q_I1_INDEX);
      setPhase("second_pass");
      return;
    }

    if (idx < questions.length - 1) {
      setCurrent(nextIdx);
    } else if (
      // CC-023 Item 1 — exclude Q-I1 from the end-of-flow backstop. Q-I1
      // has its own conditional-render path via Q-I1b (CC-017); a Q-I1
      // skip should never trigger second-pass. Any non-Q-I1 skip recorded
      // after the boundary (defensive case for cascade-skips we haven't
      // anticipated) still triggers the backstop.
      skippedQuestionIds.filter((id) => id !== "Q-I1").length > 0
    ) {
      setSecondPassResumeIndex(null);
      setPhase("second_pass");
    } else {
      // CC-022a Item 7 — test complete, go straight to demographics. The
      // portrait renders only after the save commits (commitSave →
      // phase: "result").
      setPhase("identity_context");
    }
  }

  function handleSkip() {
    const q = question;
    const meta: MetaSignal = {
      type: "question_skipped",
      question_id: q.question_id,
      card_id: q.card_id,
      recorded_at: Date.now(),
    };
    setMetaSignals((prev) => [...prev, meta]);
    setSkippedQuestionIds((prev) =>
      prev.includes(q.question_id) ? prev : [...prev, q.question_id]
    );
    setAnswers((prev) =>
      prev.filter((a) => a.question_id !== q.question_id)
    );
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[q.question_id];
      return next;
    });
    advanceFromIndex(current);
  }

  function handleSecondPassComplete(picks: SinglePickAnswer[]) {
    const merged: Answer[] = [
      ...answers.filter(
        (a) => !picks.some((p) => p.question_id === a.question_id)
      ),
      ...picks,
    ];
    setAnswers(merged);

    // CC-023 Item 1 — clear resolved IDs from skippedQuestionIds. Without
    // this, the post-boundary second-pass leaves the same IDs queued; the
    // end-of-flow defensive backstop in advanceFromIndex then re-triggers
    // second-pass with the same questions (the Q-T loop bug Michele hit).
    //
    // The SecondPassPage component never emits question_double_skipped
    // (its mode disables Skip in QuestionShell), so the only IDs that go
    // through second-pass and need clearing are exactly those in `picks`.
    // Any IDs that remain in skippedQuestionIds are post-pass skips
    // (Q-I1 in practice — handled by Q-I1b conditional render).
    const resolvedIds = new Set(picks.map((p) => p.question_id));
    setSkippedQuestionIds((prev) =>
      prev.filter((id) => !resolvedIds.has(id))
    );

    // CC-022a Item 6 — if second-pass was triggered at the pre-Keystone
    // boundary, resume the test at Q-I1. Otherwise (end-of-flow defensive
    // case) the test is complete; go to demographics per Item 7.
    if (secondPassResumeIndex !== null) {
      const resume = secondPassResumeIndex;
      setSecondPassResumeIndex(null);
      setCurrent(resume);
      setPhase("first_pass");
    } else {
      setPhase("identity_context");
    }
  }

  function handleContinue() {
    if (question.type === "ranking" && Array.isArray(draft)) {
      const a = toRankingAnswer(question.question_id, draft);
      if (!a) return;
      // CC-016 — attach overlay if this is an allocation parent ranking.
      const overlay = overlays[question.question_id];
      const enriched =
        ALLOCATION_PARENT_RANKINGS.has(question.question_id) && overlay
          ? { ...a, overlay }
          : a;
      advance(enriched as Answer);
      return;
    }
    if (
      question.type === "ranking_derived" &&
      Array.isArray(draft) &&
      derivedItems
    ) {
      const derived: RankingDerivedAnswer = {
        question_id: question.question_id,
        card_id: question.card_id,
        question_text: question.text,
        type: "ranking_derived",
        order: draft,
        derived_item_sources: derivedItems.sources,
      };
      advance(derived);
      return;
    }
    if (
      question.type === "multiselect_derived" &&
      multiSelectDerivedItems &&
      question.none_option &&
      question.other_option
    ) {
      const state = multiSelectState[question.question_id] ?? {
        selectedIds: [],
        otherText: "",
      };
      const noneId = question.none_option.id;
      const otherId = question.other_option.id;
      const noneSelected = state.selectedIds.includes(noneId);
      const selections: MultiSelectDerivedAnswer["selections"] = [];
      // Derived item selections (skip None / Other sentinels).
      for (const sid of state.selectedIds) {
        if (sid === noneId || sid === otherId) continue;
        const item = multiSelectDerivedItems.find((it) => it.id === sid);
        if (!item) continue;
        selections.push({
          id: item.id,
          signal: item.signal,
          source_question_id: item.source_question_id,
        });
      }
      // "Other" selection — emits no signal but stored on the answer.
      if (state.selectedIds.includes(otherId)) {
        selections.push({ id: otherId, signal: null });
      }
      const otherText = state.otherText.trim();
      const answer: MultiSelectDerivedAnswer = {
        question_id: question.question_id,
        card_id: question.card_id,
        question_text: question.text,
        type: "multiselect_derived",
        selections,
        none_selected: noneSelected,
        ...(otherText.length > 0 ? { other_text: otherText } : {}),
      };
      advance(answer);
      return;
    }
    if (typeof draft === "string") {
      const trimmed = draft.trim();
      if (question.type === "freeform" && trimmed.length === 0) return;
      if (question.type === "forced" && draft.length === 0) return;
      const a = toAnswer(question.question_id, trimmed || draft);
      if (a) advance(a);
    }
  }

  const canContinue = (() => {
    if (question.type === "ranking") return Array.isArray(draft);
    if (question.type === "ranking_derived") {
      return Array.isArray(draft) && derivedItems !== null;
    }
    if (question.type === "multiselect_derived") {
      // CC-017 — Continue is enabled when at least one option is selected
      // (any derived item, OR "None of these", OR "Other" with non-empty text).
      const state = multiSelectState[question.question_id];
      if (!state) return false;
      if (state.selectedIds.length === 0) return false;
      const noneId = question.none_option?.id;
      const otherId = question.other_option?.id;
      // If only "Other" is selected, require non-empty text.
      const onlyOther =
        otherId !== undefined &&
        state.selectedIds.length === 1 &&
        state.selectedIds[0] === otherId;
      if (onlyOther && state.otherText.trim().length === 0) return false;
      void noneId;
      return true;
    }
    if (question.type === "freeform") {
      return typeof draft === "string" && draft.trim().length > 0;
    }
    return typeof draft === "string" && draft.length > 0;
  })();

  // CC-022a — build the constitution once the test is complete (phase
  // reaches identity_context or result). It's needed during commitSave
  // (which fires from identity_context) so the engine runs at the
  // identity_context boundary, not at result.
  //
  // CC-071 — thread demographics into buildInnerConstitution so the
  // Movement layer can derive a life-stage-gated guidance sentence.
  // `submittedDemographics` is `DemographicAnswer[] | null`; the engine
  // expects `DemographicSet | null` (the wrapper shape declared in
  // lib/types.ts), so wrap before passing. When demographics aren't yet
  // collected (the user is still in the test phase), pass `null`
  // explicitly so the lifeStageGate falls back to 'unknown'.
  const constitution = useMemo(
    () =>
      phase === "identity_context" || phase === "result"
        ? buildInnerConstitution(
            answers,
            metaSignals,
            submittedDemographics
              ? { answers: submittedDemographics }
              : null
          )
        : null,
    [phase, answers, metaSignals, submittedDemographics]
  );
  // CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — augment with LLM Path master
  // synthesis. Pass-through when the static cache already produced a
  // paragraph; otherwise fetches from /api/synthesis3/master-paragraph
  // (server-side) and re-renders when the response arrives.
  const synthesisAugmented = useLlmMasterSynthesis(constitution);
  // CC-GRIP-TAXONOMY — sibling augment for the Grip section. Fires in
  // parallel with the path master synthesis fetch; both responses get
  // spliced into the constitution as they arrive.
  const augmentedConstitution = useGripParagraph(synthesisAugmented);

  function restart() {
    setCurrent(0);
    setAnswers([]);
    setConfirmations({});
    setExplainOpen({});
    setDrafts({});
    setSkippedQuestionIds([]);
    setMetaSignals([]);
    setPhase("first_pass");
    setSecondPassResumeIndex(null);
    setIsSaving(false);
    setSaveError(null);
    setSubmittedDemographics(null);
    setSessionSavedAt(null);
  }

  // CC-022a — save flow handlers. The opt-in handleStartSave is gone;
  // identity_context is reached automatically when the test completes
  // (advanceFromIndex Item 7). commitSave transitions identity_context →
  // result on success; the user lands on the portrait with their just-
  // saved demographics already threaded through.
  async function commitSave(
    demographicAnswers: DemographicAnswer[],
    contact?: { email: string; mobile: string | null }
  ) {
    if (!constitution) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveSession({
        answers,
        innerConstitution: constitution,
        skippedQuestionIds,
        metaSignals,
        allocationOverlays: constitution.allocation_overlays,
        beliefUnderTension: constitution.belief_under_tension,
        demographicAnswers,
        contactEmail: contact?.email ?? null,
        contactMobile: contact?.mobile ?? null,
      });
      setSubmittedDemographics(demographicAnswers);
      setSessionSavedAt(new Date());
      setPhase("result");
    } catch (e) {
      setSaveError(
        e instanceof Error
          ? e.message
          : "Save failed. Check your DATABASE_URL and try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmitDemographics(
    answers: DemographicAnswer[],
    contact: { email: string; mobile: string | null }
  ) {
    void commitSave(answers, contact);
  }

  function handleSkipDemographics() {
    // Skip = save with all fields not_answered. Per the amended Rule 5
    // (research mode), Skip means "skip the demographic disclosure," not
    // "skip the save."
    void commitSave([]);
  }

  // CC-022a Item 7 — Identity & Context phase renders after the test
  // completes (advanceFromIndex transitions here automatically). The
  // submit handlers commit the save and transition to result.
  if (phase === "identity_context" && constitution) {
    return (
      <>
        <IdentityAndContextPage
          onSubmit={handleSubmitDemographics}
          onSkip={handleSkipDemographics}
          isSubmitting={isSaving}
        />
        {saveError ? (
          <div
            role="alert"
            style={{
              position: "fixed",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--paper-warm)",
              border: "1px solid var(--rule)",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--ink)",
              maxWidth: 520,
              boxShadow: "0 6px 20px rgba(26,23,19,.12)",
            }}
          >
            <span className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--ink-mute)", marginRight: 8 }}>
              save error
            </span>
            {saveError}
          </div>
        ) : null}
      </>
    );
  }

  if (phase === "result" && constitution) {
    // CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — pass the augmented
    // constitution (which has the LLM Path master synthesis paragraph
    // spliced in when available) so the renderer prefers the warm
    // articulation over the mechanical fallback.
    const renderConstitution = augmentedConstitution ?? constitution;
    return (
      <InnerConstitutionPage
        constitution={renderConstitution}
        confirmations={confirmations}
        setConfirmations={setConfirmations}
        explainOpen={explainOpen}
        setExplainOpen={setExplainOpen}
        onRestart={restart}
        demographics={
          submittedDemographics
            ? { answers: submittedDemographics }
            : null
        }
        sessionDate={sessionSavedAt}
        answers={answers}
      />
    );
  }

  if (phase === "second_pass") {
    return (
      <SecondPassPage
        skippedQuestionIds={skippedQuestionIds}
        totalQuestionCount={questions.length}
        onComplete={handleSecondPassComplete}
      />
    );
  }

  const cardName = CARD_KICKER_NAME[question.card_id] ?? question.card_id.toUpperCase();
  const kicker = `CARD ${current + 1} · ${cardName} · ${question.question_id}`;

  return (
    <QuestionShell
      kicker={kicker}
      cardId={question.card_id}
      prompt={question.text}
      helper={
        question.type === "ranking" ||
        question.type === "ranking_derived" ||
        question.type === "multiselect_derived"
          ? question.helper
          : undefined
      }
      currentIndex={current}
      totalCount={questions.length}
      onBack={current > 0 ? () => setCurrent(current - 1) : undefined}
      canContinue={canContinue}
      onContinue={handleContinue}
      mode="first_pass"
      onSkip={handleSkip}
      continueLabel={
        question.type === "ranking" || question.type === "ranking_derived"
          ? "Accept"
          : undefined
      }
      unskippable={
        (question.type === "freeform" || question.type === "forced") &&
        question.unskippable === true
      }
    >
      {question.type === "ranking" ? (
        <Ranking
          key={question.question_id}
          items={question.items}
          initialOrder={Array.isArray(draft) ? draft : undefined}
          onChange={(order) => updateDraft(order)}
          overlay={
            ALLOCATION_PARENT_RANKINGS.has(question.question_id)
              ? overlays[question.question_id]
              : undefined
          }
          onOverlayChange={
            ALLOCATION_PARENT_RANKINGS.has(question.question_id)
              ? (next) =>
                  setOverlays((prev) => ({
                    ...prev,
                    [question.question_id]: next,
                  }))
              : undefined
          }
        />
      ) : question.type === "freeform" ? (
        <FreeformInput
          key={question.question_id}
          value={typeof draft === "string" ? draft : ""}
          onChange={(text) => updateDraft(text)}
        />
      ) : question.type === "forced" ? (
        <ForcedChoiceList
          key={question.question_id}
          options={question.options}
          selectedLabel={typeof draft === "string" ? draft : ""}
          onSelect={(label) => updateDraft(label)}
        />
      ) : question.type === "ranking_derived" && derivedItems ? (
        <Ranking
          key={question.question_id}
          items={derivedItems.items}
          initialOrder={Array.isArray(draft) ? draft : undefined}
          onChange={(order) => updateDraft(order)}
        />
      ) : question.type === "multiselect_derived" &&
        multiSelectDerivedItems &&
        question.none_option &&
        question.other_option ? (
        <MultiSelectDerived
          key={question.question_id}
          beliefAnchor={beliefAnchor}
          items={multiSelectDerivedItems}
          noneOption={question.none_option}
          otherOption={question.other_option}
          selectedIds={
            multiSelectState[question.question_id]?.selectedIds ?? []
          }
          otherText={multiSelectState[question.question_id]?.otherText ?? ""}
          onSelectionsChange={(selectedIds) =>
            setMultiSelectState((prev) => ({
              ...prev,
              [question.question_id]: {
                selectedIds,
                otherText: prev[question.question_id]?.otherText ?? "",
              },
            }))
          }
          onOtherTextChange={(text) =>
            setMultiSelectState((prev) => ({
              ...prev,
              [question.question_id]: {
                selectedIds: prev[question.question_id]?.selectedIds ?? [],
                otherText: text,
              },
            }))
          }
        />
      ) : null /* derived question with insufficient parent data — cascade-skip effect handles it */}
    </QuestionShell>
  );
}

function ForcedChoiceList({
  options,
  selectedLabel,
  onSelect,
}: {
  options: QuestionOption[];
  selectedLabel: string;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {options.map((opt) => {
        const selected = opt.label === selectedLabel;
        return (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.label)}
            data-focus-ring
            className="font-serif text-left"
            style={{
              background: selected ? "var(--umber-wash)" : "var(--paper-warm)",
              border: selected ? "1px solid var(--umber)" : "1px solid var(--rule)",
              color: "var(--ink)",
              padding: "14px 16px",
              fontSize: 16,
              lineHeight: 1.4,
              minHeight: 44,
              borderRadius: 8,
              cursor: "pointer",
              transition: "background 120ms ease-out, border-color 120ms ease-out",
            }}
          >
            {opt.label}
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
      placeholder="Answer in your own words…"
      rows={6}
      data-focus-ring
      className="w-full font-serif"
      style={{
        background: "var(--paper-warm)",
        color: "var(--ink)",
        border: "1px solid var(--rule)",
        padding: 16,
        fontSize: 16,
        lineHeight: 1.5,
        borderRadius: 8,
        resize: "vertical",
      }}
    />
  );
}

