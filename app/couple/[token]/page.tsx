// CC-COUPLE-3 — Partner B's "Obvious or Oblivious?" guessing page.
//
// Path: `/couple/[token]` — public (the unguessable token is the auth).
// Mirrors the structure of `app/follow-up/[token]/page.tsx`: GET-on-mount
// to fetch intro state, render single-pick guesses over the
// `coupleGameItems` bank, POST on submit, render the reveal screen.

"use client";

import { use, useEffect, useState } from "react";
import SinglePickPicker from "../../components/SinglePickPicker";
import type { RankingItem } from "../../../lib/types";
import type { RevealType } from "../../../lib/coupleTypes";

// ─────────────────────────────────────────────────────────────────────
// Wire types — must match `app/api/couple/[token]/route.ts`.
// ─────────────────────────────────────────────────────────────────────

interface ItemPayload {
  itemId: string;
  prompt: string;
  sourceSignal: string;
  options: { id: string; label: string }[];
}

interface IntroPayload {
  status: "invited" | "b_joined";
  personName: string;
  items: ItemPayload[];
}

interface ResolvedItem {
  itemId: string;
  sourceSignal: string;
  partnerGuess: string;
  enginePredicted: string;
  revealType: RevealType;
  scored: boolean;
}

interface RevealPayload {
  status: "completed";
  personName: string;
  legibility: {
    matches: number;
    scored: number;
    percent: number | null;
    breakdown: Record<RevealType, number>;
  };
  unscoredCount: number;
  items: ResolvedItem[];
}

type ApiPayload = IntroPayload | RevealPayload;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "intro"; data: IntroPayload }
  | { status: "reveal"; data: RevealPayload };

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function CoupleGamePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [guesses, setGuesses] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/couple/${token}`);
        if (!res.ok) {
          if (cancelled) return;
          if (res.status === 404) {
            setLoad({ status: "error", message: "this-link-isnt-active" });
            return;
          }
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setLoad({
            status: "error",
            message: body.error ?? `request failed (${res.status})`,
          });
          return;
        }
        const data = (await res.json()) as ApiPayload;
        if (cancelled) return;
        if (data.status === "completed") {
          setLoad({ status: "reveal", data });
        } else {
          setLoad({ status: "intro", data });
        }
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
    if (load.status !== "intro") return;
    setSubmitState({ status: "submitting" });
    try {
      const res = await fetch(`/api/couple/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guesses }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `submit failed (${res.status})`);
      }
      const data = (await res.json()) as RevealPayload;
      setLoad({ status: "reveal", data });
      setSubmitState({ status: "idle" });
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
        ) : load.status === "reveal" ? (
          <RevealScreen data={load.data} />
        ) : (
          <GuessForm
            data={load.data}
            guesses={guesses}
            setGuesses={setGuesses}
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
        The couple-game link couldn&apos;t be opened. It may have expired or the
        URL may be incorrect. Ask whoever sent the link to re-send.
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

// ─────────────────────────────────────────────────────────────────────
// Guess form (B's pass)
// ─────────────────────────────────────────────────────────────────────

interface GuessFormProps {
  data: IntroPayload;
  guesses: Record<string, string>;
  setGuesses: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submitState: SubmitState;
  onSubmit: () => void;
}

function GuessForm({
  data,
  guesses,
  setGuesses,
  submitState,
  onSubmit,
}: GuessFormProps) {
  const canSubmit = submitState.status !== "submitting";
  const answered = data.items.filter((it) => guesses[it.itemId]).length;
  const total = data.items.length;
  const allAnswered = answered === total;

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
          Obvious or Oblivious?
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
          {data.personName === "your partner"
            ? "Your partner wants to know how well you read them."
            : `${data.personName} wants to know how well you read them.`}
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
          For each prompt, pick the answer you think{" "}
          {data.personName === "your partner" ? "they" : data.personName} would
          give. There&apos;s no scoring against you — only against the read.
        </p>
      </header>

      <section className="flex flex-col" style={{ gap: 20 }}>
        {data.items.map((item) => (
          <GuessBlock
            key={item.itemId}
            item={item}
            personName={data.personName}
            selectedId={guesses[item.itemId] ?? null}
            onChange={(optionId) =>
              setGuesses((prev) => ({ ...prev, [item.itemId]: optionId }))
            }
          />
        ))}
      </section>

      <div className="flex flex-col" style={{ gap: 12, marginTop: 12 }}>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || !allAnswered}
          className="font-mono uppercase"
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            background: "var(--umber)",
            color: "var(--paper, #fff)",
            border: "1px solid var(--umber)",
            padding: "12px 18px",
            cursor: canSubmit && allAnswered ? "pointer" : "not-allowed",
            opacity: canSubmit && allAnswered ? 1 : 0.5,
            alignSelf: "flex-start",
          }}
        >
          {submitState.status === "submitting"
            ? "submitting…"
            : `submit (${answered}/${total})`}
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

function GuessBlock({
  item,
  personName,
  selectedId,
  onChange,
}: {
  item: ItemPayload;
  personName: string;
  selectedId: string | null;
  onChange: (optionId: string) => void;
}) {
  // Rephrase the item prompt from first-person ("you") to guess-about-A
  // ("{name}"). The bank's prompts are all second-person; we substitute
  // "you" / "your" generically so this works across every item.
  const subject =
    personName === "your partner" ? "they" : personName;
  const possessive =
    personName === "your partner" ? "their" : `${personName}'s`;
  const asGuessPrompt = item.prompt
    // "you usually become" → "{subject} usually becomes"
    .replace(/\byou are\b/gi, `${subject} is`)
    .replace(/\byou usually become\b/gi, `${subject} usually becomes`)
    .replace(/\byou say you are helping\b/gi, `${subject} says they are helping`)
    .replace(/\byou most need\b/gi, `${subject} most needs`)
    .replace(/\byou most want\b/gi, `${subject} most wants`)
    .replace(/\bmay not ask for\b/gi, "may not ask for")
    .replace(/\byou are at your best\b/gi, `${subject} is at their best`)
    .replace(/\byour fear takes over\b/gi, `${subject}'s fear takes over`)
    .replace(/\byou give your partner\b/gi, `${subject} gives you`)
    .replace(/\byou\b/gi, subject)
    .replace(/\byour\b/gi, possessive);

  // SinglePickPicker expects RankingItem; map our option shape onto it.
  const items: RankingItem[] = item.options.map((o) => ({
    id: o.id,
    label: o.label,
    // `signal` is required by the type; the picker never reads it.
    signal: `__couple_${item.itemId}_${o.id}` as never,
  }));

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
        {asGuessPrompt}
      </h2>
      <SinglePickPicker
        items={items}
        selectedId={selectedId}
        onChange={(pickedId) => onChange(pickedId)}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Reveal screen
// ─────────────────────────────────────────────────────────────────────

// All five reveal-language blocks are kept here so the symmetric Phase-2
// pass needs no copy work. Only obvious / oblivious / loving_misread can
// fire in the asymmetric MVP (selfKnows is undefined; selfAnswer ==
// enginePredicted by construction → Mirror Blind + Hidden Pattern are
// structurally unreachable from this surface).
//
// Tone discipline (spec §5): gift-under-fear, "engine can't see the
// room" — name a tension and invite the conversation, never assert what
// IS happening between them.
const REVEAL_BLOCKS: Record<RevealType, { label: string; body: string }> = {
  obvious: {
    label: "Obvious",
    body:
      "You read them clean on this one. Whatever they show you about this, you've been receiving it accurately.",
  },
  loving_misread: {
    label: "Loving Misread",
    body:
      "You guessed something more generous than they'd say of themselves. That's a kindness, and it's worth asking whether they'd let themselves see it.",
  },
  oblivious: {
    label: "Oblivious",
    body:
      "Different read on this one. The signal is there if you go looking — worth asking them what they'd actually say, in their own words.",
  },
  mirror_blind: {
    label: "Mirror Blind",
    body:
      "You named what the read sees too — but it's not how they'd describe themselves. Worth a soft conversation about whether they know it shows.",
  },
  hidden_pattern: {
    label: "Hidden Pattern",
    body:
      "Neither of you named what the read sees here. Less a miss than a quiet pattern neither of you has put words to yet.",
  },
};

function RevealScreen({ data }: { data: RevealPayload }) {
  const { legibility, items, personName, unscoredCount } = data;
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
          The Read
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
          How clearly you read{" "}
          {personName === "your partner" ? "your partner" : personName}
        </h1>
      </header>

      <ScoreHeader legibility={legibility} unscoredCount={unscoredCount} />

      <section className="flex flex-col" style={{ gap: 16 }}>
        {items.map((it) => (
          <ItemReveal key={it.itemId} item={it} />
        ))}
      </section>

      <PartnerTrajectoryNudge />
    </>
  );
}

function ScoreHeader({
  legibility,
  unscoredCount,
}: {
  legibility: RevealPayload["legibility"];
  unscoredCount: number;
}) {
  const { matches, scored, percent, breakdown } = legibility;
  const obvious = breakdown.obvious;
  const oblivious = breakdown.oblivious;
  const lovingMisread = breakdown.loving_misread;
  // Spec §4: Legibility ALWAYS shipped with a second line. No single
  // verdict number.
  const secondLine =
    scored === 0
      ? "No scored items yet — the read had no confident projections on what you played."
      : `${obvious} Obvious · ${oblivious} Oblivious · ${lovingMisread} Loving Misread` +
        (unscoredCount > 0
          ? ` · ${unscoredCount} no-strong-read (skipped for scoring)`
          : "");
  return (
    <section
      className="flex flex-col"
      style={{
        gap: 6,
        padding: "16px 18px",
        borderRadius: 8,
        background: "var(--paper-warm)",
        border: "1px solid var(--rule-soft)",
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
        Legibility
      </p>
      <p
        className="font-serif"
        style={{
          fontSize: 24,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {percent === null
          ? "—"
          : `${matches} of ${scored} read clearly (${percent}%)`}
      </p>
      <p
        className="font-serif italic"
        style={{
          fontSize: 13,
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {secondLine}
      </p>
    </section>
  );
}

function ItemReveal({ item }: { item: ResolvedItem }) {
  if (!item.scored) {
    return (
      <article
        className="flex flex-col"
        style={{
          gap: 6,
          padding: "14px 18px",
          borderRadius: 8,
          background: "var(--paper)",
          border: "1px dashed var(--rule)",
        }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          {item.itemId.replace(/_/g, " ")}
        </p>
        <p
          className="font-serif italic"
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          No strong read on this one — skipped for scoring.
          {item.partnerGuess ? (
            <>
              {" "}
              Your guess: <strong>{prettify(item.partnerGuess)}</strong>.
            </>
          ) : null}
        </p>
      </article>
    );
  }
  const block = REVEAL_BLOCKS[item.revealType];
  return (
    <article
      className="flex flex-col"
      style={{
        gap: 8,
        padding: "16px 18px",
        borderRadius: 8,
        background: "var(--paper-warm)",
        border: "1px solid var(--rule-soft)",
      }}
    >
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "var(--umber)",
          margin: 0,
        }}
      >
        {block.label} · {item.itemId.replace(/_/g, " ")}
      </p>
      <p
        className="font-serif"
        style={{
          fontSize: 14,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Your guess: <strong>{prettify(item.partnerGuess)}</strong>.
      </p>
      <p
        className="font-serif italic"
        style={{
          fontSize: 13,
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {block.body}
      </p>
    </article>
  );
}

function PartnerTrajectoryNudge() {
  return (
    <section
      className="flex flex-col"
      style={{
        gap: 10,
        padding: "20px 18px",
        borderRadius: 8,
        background: "var(--paper-warm)",
        border: "1px solid var(--rule-soft)",
        marginTop: 12,
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
        Want the deeper read?
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
        The Partner Trajectory walks you through what each of you gives the
        other on a good day, and the loop you fall into on a hard one. Coming
        next; this game is the front door.
      </p>
    </section>
  );
}

function prettify(optionId: string): string {
  return optionId.replace(/_/g, " ");
}
