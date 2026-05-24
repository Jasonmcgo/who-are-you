// CC-COUPLE-3 + CC-COUPLE-4 — Partner B's "Obvious or Oblivious?" page.
//
// Path: `/couple/[token]` — public (the unguessable token is the auth).
//
// CC-COUPLE-4: replaces the binary single-pick with a rank-your-top-3
// input (reusing app/components/Ranking.tsx — CC-157 ▲▼ arrows give
// mobile + a11y for free) and a warm partial-credit reveal per
// docs/obvious-oblivious-game-spec.md.

"use client";

import { use, useEffect, useState } from "react";
import Ranking from "../../components/Ranking";
import type { RankingItem } from "../../../lib/types";
import type { RankedRevealTier } from "../../../lib/coupleReveal";

// ─────────────────────────────────────────────────────────────────────
// Wire types — must match `app/api/couple/[token]/route.ts`.
// ─────────────────────────────────────────────────────────────────────

interface ItemPayload {
  itemId: string;
  prompt: string;
  sourceSignal: string;
  /** CC-COUPLE-5 — deck tag + display label (e.g. "Fight Weather"). */
  deck: string | null;
  deckLabel: string;
  options: { id: string; label: string }[];
}

interface IntroPayload {
  status: "invited" | "b_joined";
  personName: string;
  items: ItemPayload[];
}

interface ResolvedItem {
  itemId: string;
  prompt: string;
  sourceSignal: string;
  deck: string | null;
  deckLabel: string;
  rankedGuess: string[];
  rankedGuessLabels: string[];
  enginePredicted: string;
  enginePredictedLabel: string;
  tier: RankedRevealTier;
  points: number;
  translation: string;
}

interface WarmTotalPayload {
  clean: number;
  close: number;
  adjacent: number;
  off: number;
  unscored: number;
  totalPoints: number;
  maxPoints: number;
  clearlyRead: number;
  clearlyOf: number;
}

interface RevealPayload {
  status: "completed";
  personName: string;
  warmTotal: WarmTotalPayload;
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
  // Per-item full ranked order (option ids). Top-3 is what gets scored;
  // we send the full order so the API can take slice(0, 3) deterministically.
  const [rankings, setRankings] = useState<Record<string, string[]>>({});

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
      // Build the ranked-top-3 map. For any item B didn't touch, fall back
      // to the option order as presented (an undeliberate ranking) — the
      // resolver will score it the same way as any other guess.
      const rankedGuesses: Record<string, string[]> = {};
      for (const item of load.data.items) {
        const order = rankings[item.itemId] ?? item.options.map((o) => o.id);
        rankedGuesses[item.itemId] = order.slice(0, 3);
      }
      const res = await fetch(`/api/couple/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankedGuesses }),
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
          <RankForm
            data={load.data}
            rankings={rankings}
            setRankings={setRankings}
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
// Rank-your-top-3 form (B's pass)
// ─────────────────────────────────────────────────────────────────────

interface RankFormProps {
  data: IntroPayload;
  rankings: Record<string, string[]>;
  setRankings: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  submitState: SubmitState;
  onSubmit: () => void;
}

function RankForm({
  data,
  rankings,
  setRankings,
  submitState,
  onSubmit,
}: RankFormProps) {
  const canSubmit = submitState.status !== "submitting";
  const touchedCount = Object.keys(rankings).length;
  const totalCount = data.items.length;

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
            ? "Your partner already knows this about you. You may or may not."
            : `${data.personName} already knows this about you. You may or may not.`}
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
          For each prompt, rank your top three answers — your #1 guess
          earns the most, and a close-adjacent in your top 3 still counts.
          No wrong reads, only close-enoughs.
        </p>
      </header>

      <section className="flex flex-col" style={{ gap: 20 }}>
        {data.items.map((item) => (
          <RankBlock
            key={item.itemId}
            item={item}
            personName={data.personName}
            order={rankings[item.itemId]}
            onChange={(order) =>
              setRankings((prev) => ({ ...prev, [item.itemId]: order }))
            }
          />
        ))}
      </section>

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
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.5,
            alignSelf: "flex-start",
          }}
        >
          {submitState.status === "submitting"
            ? "submitting…"
            : `submit (${touchedCount}/${totalCount} ranked)`}
        </button>
        <p
          className="font-mono"
          style={{
            fontSize: 10,
            color: "var(--ink-faint)",
            margin: 0,
          }}
        >
          Untouched items submit in default order — only your top 3 are
          scored.
        </p>
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

function RankBlock({
  item,
  personName,
  order,
  onChange,
}: {
  item: ItemPayload;
  personName: string;
  order: string[] | undefined;
  onChange: (order: string[]) => void;
}) {
  // Rephrase the item prompt from first-person ("you") to guess-about-A
  // ("{name}"). Mirrors the CC-COUPLE-3 substitution chain.
  const subject = personName === "your partner" ? "they" : personName;
  const possessive = personName === "your partner" ? "their" : `${personName}'s`;
  const asGuessPrompt = item.prompt
    .replace(/\byou are\b/gi, `${subject} is`)
    .replace(/\byou usually become\b/gi, `${subject} usually becomes`)
    .replace(/\byou say you are helping\b/gi, `${subject} says they are helping`)
    .replace(/\byou most need\b/gi, `${subject} most needs`)
    .replace(/\byou most want\b/gi, `${subject} most wants`)
    .replace(/\byou are at your best\b/gi, `${subject} is at their best`)
    .replace(/\byour fear takes over\b/gi, `${subject}'s fear takes over`)
    .replace(/\byou give your partner\b/gi, `${subject} gives you`)
    .replace(/\byou\b/gi, subject)
    .replace(/\byour\b/gi, possessive);

  // Map our flat option shape onto RankingItem.
  const items: RankingItem[] = item.options.map((o) => ({
    id: o.id,
    label: o.label,
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
      {item.deckLabel ? (
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--umber)",
            margin: 0,
          }}
        >
          {item.deckLabel}
        </p>
      ) : null}
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
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        Rank your top three. (▲▼ arrows reorder.)
      </p>
      <Ranking items={items} initialOrder={order} onChange={onChange} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Reveal screen (warm, partial-credit)
// ─────────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<RankedRevealTier, string> = {
  clean: "Read clean",
  close: "Close read",
  adjacent: "Strong adjacent",
  off: "Confidently off",
  unscored: "No strong read",
};

const TIER_BLURB: Record<RankedRevealTier, string> = {
  clean:
    "Your #1 guess matched the engine's read — you saw what they show.",
  close:
    "Your guess landed in your top three. Close enough that the read is recognizable to you.",
  adjacent:
    "You picked a nearby pattern. The engine saw a different inner driver, but the shape is familiar.",
  off:
    "Earned a comic badge. The engine reads something different here — worth a conversation, not a verdict.",
  unscored:
    "No strong read on this one — skipped for scoring.",
};

function RevealScreen({ data }: { data: RevealPayload }) {
  const { warmTotal, items, personName } = data;
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

      <WarmTotalCard warmTotal={warmTotal} personName={personName} />

      <section className="flex flex-col" style={{ gap: 16 }}>
        {items.map((it) => (
          <ItemReveal key={it.itemId} item={it} />
        ))}
      </section>

      <PartnerTrajectoryNudge />
    </>
  );
}

function WarmTotalCard({
  warmTotal,
  personName,
}: {
  warmTotal: WarmTotalPayload;
  personName: string;
}) {
  const name = personName === "your partner" ? "your partner" : personName;
  const headline =
    warmTotal.clearlyOf === 0
      ? `No strong reads to score on this round.`
      : `You read ${name} clearly on ${warmTotal.clearlyRead} of ${warmTotal.clearlyOf}.`;
  const secondLine =
    `${warmTotal.clean} read clean · ${warmTotal.close} close · ` +
    `${warmTotal.adjacent} adjacent · ${warmTotal.off} confidently off` +
    (warmTotal.unscored > 0
      ? ` · ${warmTotal.unscored} skipped (no strong read)`
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
        How it landed
      </p>
      <p
        className="font-serif"
        style={{
          fontSize: 22,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {headline}
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
      {warmTotal.maxPoints > 0 ? (
        <p
          className="font-mono"
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          {warmTotal.totalPoints} / {warmTotal.maxPoints} pts
        </p>
      ) : null}
    </section>
  );
}

function ItemReveal({ item }: { item: ResolvedItem }) {
  const { tier } = item;
  const isUnscored = tier === "unscored";
  return (
    <article
      className="flex flex-col"
      style={{
        gap: 10,
        padding: "16px 18px",
        borderRadius: 8,
        background: isUnscored ? "var(--paper)" : "var(--paper-warm)",
        border: isUnscored
          ? "1px dashed var(--rule)"
          : "1px solid var(--rule-soft)",
      }}
    >
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          color: isUnscored ? "var(--ink-mute)" : "var(--umber)",
          margin: 0,
        }}
      >
        {TIER_LABELS[tier]}
        {item.deckLabel ? ` · ${item.deckLabel}` : ""}
        {!isUnscored && item.points > 0 ? ` · ${item.points} pt${item.points === 1 ? "" : "s"}` : ""}
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
        {item.prompt}
      </p>
      {/* Three-line warm reveal per spec §"Reveal format":
              1) Engine read    2) Partner read (Phase-3 slot, hidden)
              3) Translation */}
      {!isUnscored ? (
        <div className="flex flex-col" style={{ gap: 4 }}>
          <p
            className="font-mono"
            style={{
              fontSize: 12,
              color: "var(--ink-soft)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Engine read: <strong>{item.enginePredictedLabel}</strong>
          </p>
          {/* PHASE-3 SLOT — symmetric self-pass: when A has answered
              themselves, surface "Partner read: …" here. Until then we
              hide the slot rather than show a stub. */}
          <p
            className="font-mono"
            style={{
              fontSize: 12,
              color: "var(--ink-soft)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Your top 3:{" "}
            <strong>
              {item.rankedGuessLabels.length > 0
                ? item.rankedGuessLabels.join(" · ")
                : "—"}
            </strong>
          </p>
        </div>
      ) : null}
      <p
        className="font-serif italic"
        style={{
          fontSize: 13,
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.55,
        }}
      >
        {TIER_BLURB[tier]}
      </p>
      {!isUnscored && item.translation ? (
        <p
          className="font-serif italic"
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {item.translation}
        </p>
      ) : null}
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
