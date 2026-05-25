"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  SinglePickAnswer,
  TensionStatus,
} from "../../lib/types";
import Ranking from "../components/Ranking";
// CC-138 — reused by the binary attitude picks (Q-TB-*).
import SinglePickPicker from "../components/SinglePickPicker";
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
import MultiSelectDerived from "../components/MultiSelectDerived";
// CC-170 — derived-item resolvers moved to `lib/deriveQuestionItems.ts`
// so the public follow-up page can reuse them.
import {
  deriveItemsForBinaryPick,
  deriveItemsForCrossRank,
  deriveItemsForMultiSelect,
} from "../../lib/deriveQuestionItems";

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

// CC-170 — `deriveItemsForCrossRank` + `deriveItemsForMultiSelect` (and
// the new `deriveItemsForBinaryPick` resolver) moved to
// `lib/deriveQuestionItems.ts` so the public follow-up page can reuse
// them when rendering derived clarifiers against the session's stored
// parent answers. The assessment behavior is byte-identical — same
// signatures, same null-return semantics for cascade-skip.

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

// CC-157 — `UNTOUCHED_SECOND_PASS_CAP` removed; the second-pass
// routing for untouched rankings was retired (see handleContinue's
// ranking branch). Accepted-order is a valid answer; the ▲▼ arrows in
// Ranking.tsx make engagement tap-trivial on touch.

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
  // CC-REPORT-PERMALINK — capture the sessionId returned from saveSession
  // so the result render can surface the permalink affordance with the
  // canonical /report/<id> URL.
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
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
  // CC-157 — CC-134 Part A's `touchedRankings` state was removed
  // alongside the untouched→second-pass routing in handleContinue.
  // Ranking.tsx still emits `onTouched` for downstream consumers; the
  // assessment page no longer needs to track which rankings were
  // engaged because accepted-order is now a valid answer (the ▲▼
  // arrows make engagement tap-trivial on touch). The
  // `rankingUntouchedHeuristic` diagnostic audit still flags
  // "saved == default" rankings via its own server-side heuristic.

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

  // CC-138.2 — single-sourced skip predicate. Returns true when the
  // question at index `i` is in an auto-advance state — i.e. one of
  // the three forward effects below (~L283/307/330) would skip past
  // it on entry. The Back handler (`handleBack`) uses this to walk
  // backward past auto-skip questions, fixing the "Back appears
  // dead" defect where pressing Back onto a derived card whose
  // parents were skipped or a conditional whose target was answered
  // would bounce the user forward.
  //
  // **Predicate consistency.** The skip-conditions encoded here MUST
  // match the three effects exactly; otherwise the user can land on
  // a card that the forward effect immediately advances past. The
  // three effects retain their inline conditions (each emits its own
  // meta-signal); this predicate is the read-only mirror used by Back
  // and `canGoBack`.
  const isAutoSkipQuestion = useCallback(
    (i: number): boolean => {
      const q = questions[i];
      if (!q) return false;
      // Effect 1 — conditional freeform/forced whose target was answered.
      if ((q.type === "freeform" || q.type === "forced") && q.render_if_skipped) {
        const target = q.render_if_skipped;
        const wasSkipped = skippedQuestionIds.includes(target);
        const wasAnswered = answers.some((a) => a.question_id === target);
        if (!wasSkipped && wasAnswered) return true;
      }
      // Effect 2 — ranking_derived with insufficient parent data.
      if (q.type === "ranking_derived") {
        const items = deriveItemsForCrossRank(
          q.question_id,
          q.derived_from,
          q.derived_top_n ?? 2,
          answers
        );
        if (items === null) return true;
      }
      // Effect 3 — multiselect_derived with insufficient parent data.
      if (q.type === "multiselect_derived") {
        const items = deriveItemsForMultiSelect(
          q.derived_from,
          q.derived_top_n_per_source ?? 3,
          answers
        );
        if (items === null) return true;
      }
      return false;
    },
    [answers, skippedQuestionIds]
  );

  // CC-138.2 — Back handler walks backward from `current - 1` until
  // it finds a presentable question (one that `isAutoSkipQuestion`
  // returns false for). Returns the index, or -1 when no prior
  // presentable card exists (Back should be disabled). The walk also
  // stops at index 0 to never overshoot the bank.
  const previousPresentableIndex = useCallback((): number => {
    for (let i = current - 1; i >= 0; i--) {
      if (!isAutoSkipQuestion(i)) return i;
    }
    return -1;
  }, [current, isAutoSkipQuestion]);

  function handleBack() {
    const prev = previousPresentableIndex();
    if (prev >= 0) setCurrent(prev);
  }

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
    // CC-138 — binary picks seed with the prior single_pick id when
    // present (resume / edit flow). Otherwise an empty string lets
    // the picker render unchosen so the user must affirm.
    if (
      question.type === "binary_pick" ||
      question.type === "binary_pick_derived"
    ) {
      return prev && prev.type === "single_pick" ? prev.picked_id : "";
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
      // CC-157 — Reaching + advancing past a ranking is itself an
      // answer (the user accepted the presented order). The
      // pre-CC-157 CC-134 path routed every untouched ranking to a
      // single-pick second pass and stamped `question_skipped` +
      // `skippedQuestionIds`, which (a) told a real first-time user
      // she had "skipped" a question she'd engaged with, and (b)
      // forced a long second pass for any passive respondent. Now
      // the ▲▼ arrows in Ranking.tsx make engagement tap-trivial on
      // touch; users who *still* don't reorder are taken at their
      // word that the default order is fine.
      //
      // The deliberate-vs-untouched distinction stays load-bearing
      // client-side via `touchedRankings`, and the
      // `rankingUntouchedHeuristic` diagnostic audit
      // (tests/audit/rankingUntouchedHeuristic.audit.ts) still
      // flags "saved == default" rankings for clinical review.
      // No engine math reads `question_skipped` — verified by grep —
      // so dropping the second-pass routing is purely a UX cleanup.
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
    // CC-138 — binary_pick / binary_pick_derived: construct a
    // SinglePickAnswer carrying the chosen function id + the item's
    // signal. The engine's existing `signalFromSinglePick` path
    // extracts the rank-1 signal that the binary resolver reads.
    if (
      (question.type === "binary_pick" || question.type === "binary_pick_derived") &&
      typeof draft === "string" &&
      draft.length > 0
    ) {
      // For binary_pick, the items list is on the question. For
      // binary_pick_derived, items derive at render time from prior
      // picks; we re-resolve them via the shared resolver
      // (CC-170 — `deriveItemsForBinaryPick`) so the picked_signal is
      // correct.
      let items: { id: string; signal: string }[] = [];
      if (question.type === "binary_pick") {
        items = question.items;
      } else {
        items = deriveItemsForBinaryPick(question.derived_from ?? [], answers) ?? [];
      }
      const picked = items.find((i) => i.id === draft);
      if (!picked) return;
      const answer: SinglePickAnswer = {
        question_id: question.question_id,
        card_id: question.card_id,
        question_text: question.text,
        type: "single_pick",
        picked_id: picked.id,
        picked_signal: picked.signal,
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
    // CC-138 — binary picks gate Continue on a non-empty selection
    // (any of the two items chosen). Derived variants additionally
    // require both parent answers (else cascade-skip handles it).
    if (question.type === "binary_pick") {
      return typeof draft === "string" && draft.length > 0;
    }
    if (question.type === "binary_pick_derived") {
      const parents = question.derived_from ?? [];
      const allParentsAnswered = parents.every((pid) =>
        answers.some((a) => a.question_id === pid && a.type === "single_pick")
      );
      return (
        allParentsAnswered &&
        typeof draft === "string" &&
        draft.length > 0
      );
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
      const { sessionId } = await saveSession({
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
      setSavedSessionId(sessionId);
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

  function handleSkipDemographics(
    partial?: {
      answers: DemographicAnswer[];
      contact: { email: string | null; mobile: string | null };
    }
  ) {
    // CC-DEMOGRAPHICS-SAVE-WIRING — Skip preserves whatever the user
    // typed before bailing on the gate. Previously this called
    // `commitSave([])` and threw away the form state entirely, which
    // was the proximate cause of the prod cohort being 13/13 anonymous:
    // every user who got blocked by the email gate hit Skip and lost
    // the demographics they'd already filled.
    const partialEmail = partial?.contact.email ?? null;
    const partialMobile = partial?.contact.mobile ?? null;
    void commitSave(
      partial?.answers ?? [],
      partialEmail !== null || partialMobile !== null
        ? { email: partialEmail ?? "", mobile: partialMobile }
        : undefined
    );
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
        sessionId={savedSessionId}
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
        question.type === "multiselect_derived" ||
        question.type === "binary_pick" ||
        question.type === "binary_pick_derived"
          ? question.helper
          : undefined
      }
      currentIndex={current}
      totalCount={questions.length}
      onBack={previousPresentableIndex() >= 0 ? handleBack : undefined}
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
      ) : question.type === "binary_pick" ? (
        // CC-138 — same-dimension attitude binary. SinglePickPicker
        // renders the two voices side-by-side; pick stores as a
        // SinglePickAnswer carrying the chosen function's signal.
        <SinglePickPicker
          key={question.question_id}
          items={question.items}
          selectedId={typeof draft === "string" ? draft : null}
          onChange={(id) => updateDraft(id)}
        />
      ) : question.type === "binary_pick_derived" ? (
        // CC-138 — dominance ordering. Items derive at render time
        // from the user's two prior axis picks (Q-TB-NI-NE + Q-TB-SI-SE
        // for perceiving, Q-TB-TI-TE + Q-TB-FI-FE for judging). When
        // either parent is unanswered, the derived items list is
        // empty → cascade-skip behavior identical to ranking_derived.
        (() => {
          // CC-170 — items resolved by the shared
          // `deriveItemsForBinaryPick` lib (parents' two picks become
          // the two options); null when fewer than 2 parents resolved
          // (cascade-skip fires from the effect above).
          const items = deriveItemsForBinaryPick(question.derived_from ?? [], answers);
          if (!items) return null;
          return (
            <SinglePickPicker
              key={question.question_id}
              items={items}
              selectedId={typeof draft === "string" ? draft : null}
              onChange={(id) => updateDraft(id)}
            />
          );
        })()
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

