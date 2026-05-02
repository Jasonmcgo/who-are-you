"use client";

import { useEffect, useMemo, useState } from "react";
import { questions } from "../../data/questions";
import type {
  CardId,
  RankingQuestion,
  SinglePickAnswer,
} from "../../lib/types";
import QuestionShell from "./QuestionShell";
import SinglePickPicker from "./SinglePickPicker";

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

type Props = {
  skippedQuestionIds: string[];
  totalQuestionCount: number;
  onComplete: (singlePickAnswers: SinglePickAnswer[]) => void;
};

export default function SecondPassPage({
  skippedQuestionIds,
  totalQuestionCount,
  onComplete,
}: Props) {
  const skippedQuestions = useMemo(() => {
    const out: RankingQuestion[] = [];
    for (const id of skippedQuestionIds) {
      const q = questions.find((q) => q.question_id === id);
      if (q && q.type === "ranking") out.push(q);
    }
    return out;
  }, [skippedQuestionIds]);

  const [secondPassIndex, setSecondPassIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<SinglePickAnswer[]>([]);

  // CC-025-fix — defer the empty-second-pass completion to an effect so the
  // parent's setState calls don't run during this component's render. Calling
  // onComplete() synchronously during render triggers React's
  // "Cannot update a component while rendering a different component" error
  // under Turbopack/React 18 strict mode and halts the flow before the user
  // reaches identity_context.
  useEffect(() => {
    if (skippedQuestions.length === 0) {
      onComplete([]);
    }
  }, [skippedQuestions.length, onComplete]);

  if (skippedQuestions.length === 0) {
    return null;
  }

  const question = skippedQuestions[secondPassIndex];
  const selectedId = picks[question.question_id] ?? null;
  const cardName =
    CARD_KICKER_NAME[question.card_id] ?? question.card_id.toUpperCase();
  const kicker = `SECOND PASS · ${cardName} · ${question.question_id}`;

  function handleSelect(pickedId: string) {
    setPicks((prev) => ({ ...prev, [question.question_id]: pickedId }));
  }

  function handleContinue() {
    if (!selectedId) return;
    const item = question.items.find((i) => i.id === selectedId);
    if (!item) return;
    const answer: SinglePickAnswer = {
      question_id: question.question_id,
      card_id: question.card_id,
      question_text: question.text,
      type: "single_pick",
      picked_id: selectedId,
      picked_signal: item.signal,
    };
    const nextAnswers = [
      ...answers.filter((a) => a.question_id !== answer.question_id),
      answer,
    ];
    setAnswers(nextAnswers);
    if (secondPassIndex < skippedQuestions.length - 1) {
      setSecondPassIndex(secondPassIndex + 1);
    } else {
      onComplete(nextAnswers);
    }
  }

  function handleBack() {
    if (secondPassIndex > 0) setSecondPassIndex(secondPassIndex - 1);
  }

  return (
    <div className="flex flex-col">
      <SecondPassHeader
        currentPos={secondPassIndex + 1}
        totalCount={skippedQuestions.length}
      />
      <QuestionShell
        kicker={kicker}
        cardId={question.card_id}
        prompt={question.text}
        helper="Pick the option that feels closest, even if it's imperfect."
        currentIndex={totalQuestionCount + secondPassIndex}
        totalCount={totalQuestionCount + skippedQuestions.length}
        onBack={secondPassIndex > 0 ? handleBack : undefined}
        canContinue={!!selectedId}
        onContinue={handleContinue}
        mode="second_pass"
      >
        <SinglePickPicker
          key={question.question_id}
          items={question.items}
          selectedId={selectedId}
          onChange={handleSelect}
        />
      </QuestionShell>
    </div>
  );
}

function SecondPassHeader({
  currentPos,
  totalCount,
}: {
  currentPos: number;
  totalCount: number;
}) {
  return (
    <header
      className="flex flex-col items-center text-center"
      style={{
        background: "var(--paper)",
        padding: "28px 24px 8px",
        gap: 8,
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
        coming back to a few · {currentPos} of {totalCount}
      </p>
      <p
        className="font-serif italic"
        style={{
          fontSize: 14,
          color: "var(--ink-soft)",
          margin: 0,
          maxWidth: 520,
          lineHeight: 1.5,
        }}
      >
        you skipped these earlier — here&rsquo;s a simpler version. pick the
        option that feels closest, even if it&rsquo;s not a perfect fit.
      </p>
    </header>
  );
}
