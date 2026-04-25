"use client";

import { useMemo, useState } from "react";
import { questions } from "../data/questions";
import {
  buildInnerConstitution,
  toAnswer,
  toRankingAnswer,
} from "../lib/identityEngine";
import type {
  Answer,
  RankingItem,
  Signal,
  TensionStatus,
} from "../lib/types";
import Ranking from "./components/Ranking";

type Confirmation = {
  status: TensionStatus;
  note?: string;
};

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [confirmations, setConfirmations] = useState<
    Record<string, Confirmation>
  >({});
  const [explainOpen, setExplainOpen] = useState<Record<string, boolean>>({});

  const question = questions[current];

  function submitResponse(response: string) {
    const a = toAnswer(question.question_id, response);
    if (!a) return;
    const next = [...answers.filter((x) => x.question_id !== a.question_id), a];
    setAnswers(next);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      setShowResult(true);
    }
  }

  function handleAnswer(optionLabel: string) {
    submitResponse(optionLabel);
  }

  function handleFreeformSubmit(text: string) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    submitResponse(trimmed);
  }

  function submitRanking(order: string[]) {
    const a = toRankingAnswer(question.question_id, order);
    if (!a) return;
    const next = [...answers.filter((x) => x.question_id !== a.question_id), a];
    setAnswers(next);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      setShowResult(true);
    }
  }

  const constitution = useMemo(
    () => (showResult ? buildInnerConstitution(answers) : null),
    [showResult, answers]
  );

  function setTensionStatus(tension_id: string, status: TensionStatus) {
    setConfirmations((prev) => ({
      ...prev,
      [tension_id]: { status, note: prev[tension_id]?.note },
    }));
    if (status !== "unconfirmed") {
      setExplainOpen((prev) => ({ ...prev, [tension_id]: false }));
    }
  }

  function toggleExplain(tension_id: string) {
    setExplainOpen((prev) => ({
      ...prev,
      [tension_id]: !prev[tension_id],
    }));
  }

  function setNote(tension_id: string, note: string) {
    setConfirmations((prev) => ({
      ...prev,
      [tension_id]: {
        status: prev[tension_id]?.status ?? "unconfirmed",
        note,
      },
    }));
  }

  function restart() {
    setCurrent(0);
    setAnswers([]);
    setShowResult(false);
    setConfirmations({});
    setExplainOpen({});
  }

  if (showResult && constitution) {
    return (
      <main className="min-h-screen p-6 md:p-10">
        <div className="max-w-2xl mx-auto space-y-10">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Mini Inner Constitution
            </p>
            <h1 className="text-3xl font-semibold">A first reflection</h1>
            <p className="text-sm text-gray-600 italic">
              A possibility, not a verdict. Nothing here is a final description.
            </p>
          </header>

          <section className="space-y-2">
            <h2 className="text-lg font-medium">Core Orientation</h2>
            <p className="leading-relaxed">{constitution.core_orientation}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium">Signals Detected</h2>
            {constitution.signals.length === 0 ? (
              <p className="text-gray-600">No signals detected from these answers.</p>
            ) : (
              <ul className="space-y-2">
                {constitution.signals.map((s) => (
                  <li
                    key={`${s.signal_id}-${s.source_question_ids.join(",")}`}
                    className="border-l-2 border-gray-300 pl-3"
                  >
                    <p className="text-sm">
                      <span className="font-mono text-xs text-gray-500">
                        {s.signal_id}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {" "}
                        · from {s.from_card} · {s.source_question_ids.join(", ")}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700">{s.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium">Possible Tensions</h2>
            <p className="text-sm text-gray-600 italic">
              These are patterns that may be present. You are the final authority.
            </p>
            {constitution.tensions.length === 0 ? (
              <p className="text-gray-600">
                No canonical tensions surfaced from the current signals.
              </p>
            ) : (
              <ul className="space-y-6">
                {constitution.tensions.map((t) => {
                  const status =
                    confirmations[t.tension_id]?.status ?? "unconfirmed";
                  const isOpen = !!explainOpen[t.tension_id];
                  const note = confirmations[t.tension_id]?.note ?? "";
                  return (
                    <li
                      key={t.tension_id}
                      className="border border-gray-200 rounded-md p-4 space-y-3"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-medium">
                          <span className="font-mono text-xs text-gray-500 mr-2">
                            {t.tension_id}
                          </span>
                          {t.type}
                        </p>
                        <span className="text-xs text-gray-500">
                          {status === "unconfirmed" ? "awaiting you" : status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{t.description}</p>
                      <p className="text-sm italic text-gray-600">
                        {t.user_prompt}
                      </p>
                      <StrengthenedBy signals={t.strengthened_by} />
                      <p className="text-xs text-gray-500">
                        Source signals:{" "}
                        {t.signals_involved
                          .map((s) => `${s.signal_id} (${s.from_card})`)
                          .join(" · ")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <ConfirmButton
                          active={status === "confirmed"}
                          onClick={() =>
                            setTensionStatus(t.tension_id, "confirmed")
                          }
                        >
                          Yes
                        </ConfirmButton>
                        <ConfirmButton
                          active={status === "partially_confirmed"}
                          onClick={() =>
                            setTensionStatus(
                              t.tension_id,
                              "partially_confirmed"
                            )
                          }
                        >
                          Partially
                        </ConfirmButton>
                        <ConfirmButton
                          active={status === "rejected"}
                          onClick={() =>
                            setTensionStatus(t.tension_id, "rejected")
                          }
                        >
                          No
                        </ConfirmButton>
                        <ConfirmButton
                          active={isOpen}
                          onClick={() => toggleExplain(t.tension_id)}
                        >
                          Explain
                        </ConfirmButton>
                      </div>
                      {isOpen && (
                        <textarea
                          value={note}
                          onChange={(e) => setNote(t.tension_id, e.target.value)}
                          placeholder="In your own words…"
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                          rows={3}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium">Sacred Values</h2>
            {constitution.sacred_values.length === 0 ? (
              <p className="text-gray-600">No sacred value selected.</p>
            ) : (
              <ul className="list-disc list-inside">
                {constitution.sacred_values.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-medium">Bridge Signals</h2>
            <p className="text-sm text-gray-600 italic">
              Placeholder. Shared moral ground with people of different
              worldviews will appear here as the system grows.
            </p>
          </section>

          <div className="pt-4">
            <button
              onClick={restart}
              className="text-sm underline text-gray-600 hover:text-gray-900"
            >
              Start over
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-8">
        <div className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Who Are You?
          </p>
          <p className="text-xs text-gray-500">
            Question {current + 1} of {questions.length} ·{" "}
            <span className="font-mono">{question.card_id}</span>
          </p>
        </div>

        <p className="text-xl leading-snug text-center">{question.text}</p>

        {question.type === "ranking" ? (
          <RankingAnswerWidget
            key={question.question_id}
            items={question.items}
            initial={
              (() => {
                const prev = answers.find(
                  (a) => a.question_id === question.question_id
                );
                return prev && prev.type === "ranking" ? prev.order : undefined;
              })()
            }
            onSubmit={submitRanking}
          />
        ) : question.type === "freeform" ? (
          <FreeformAnswer
            key={question.question_id}
            initial={(() => {
              const prev = answers.find(
                (a) => a.question_id === question.question_id
              );
              return prev && prev.type !== "ranking" ? prev.response : "";
            })()}
            onSubmit={handleFreeformSubmit}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {question.options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt.label)}
                className="border border-gray-300 p-3 rounded text-left hover:border-gray-900 hover:bg-gray-50 transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {current > 0 && (
          <div className="text-center">
            <button
              onClick={() => setCurrent(current - 1)}
              className="text-xs text-gray-500 underline hover:text-gray-900"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function RankingAnswerWidget({
  items,
  initial,
  onSubmit,
}: {
  items: RankingItem[];
  initial: string[] | undefined;
  onSubmit: (order: string[]) => void;
}) {
  const [order, setOrder] = useState<string[]>(
    initial && initial.length === items.length ? initial : items.map((i) => i.id)
  );
  const helper = "Drag to reorder, or focus a grip and use space + arrows.";
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500 italic">{helper}</p>
      <Ranking items={items} initialOrder={order} onChange={setOrder} />
      <button
        onClick={() => onSubmit(order)}
        className="self-end text-sm px-4 py-2 rounded border border-gray-900 bg-gray-900 text-white hover:opacity-90 transition"
      >
        Continue
      </button>
    </div>
  );
}

function FreeformAnswer({
  initial,
  onSubmit,
}: {
  initial: string;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  const disabled = text.trim().length === 0;
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Answer in your own words…"
        rows={5}
        className="border border-gray-300 rounded p-3 text-sm leading-relaxed focus:outline-none focus:border-gray-900"
      />
      <button
        disabled={disabled}
        onClick={() => onSubmit(text)}
        className={
          "self-end text-sm px-4 py-2 rounded border transition " +
          (disabled
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-900 bg-gray-900 text-white hover:opacity-90")
        }
      >
        Continue
      </button>
    </div>
  );
}

function StrengthenedBy({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) return null;
  const ids = Array.from(
    new Set(signals.flatMap((s) => s.source_question_ids))
  );
  if (ids.length === 0) return null;
  const joined =
    ids.length === 1
      ? ids[0]
      : ids.length === 2
      ? `${ids[0]} and ${ids[1]}`
      : ids.slice(0, -1).join(", ") + ", and " + ids[ids.length - 1];
  const noun = ids.length === 1 ? "response" : "responses";
  return (
    <p className="text-xs text-gray-500 italic">
      Strengthened by your {noun} to {joined}.
    </p>
  );
}

function ConfirmButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "text-sm px-3 py-1.5 rounded border transition " +
        (active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 hover:border-gray-900")
      }
    >
      {children}
    </button>
  );
}
