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

interface BondInfo {
  hasPartnerB: boolean;
  /** CC-COUPLE-8 — true when both partners are assessed (Mode 2). */
  mode2: boolean;
}

type CoupleRole = "a" | "b";

interface IntroPayload {
  /**
   * CC-COUPLE-8 — `"needs_role"` is the Mode 2 role-select state. The
   * page renders a "Which one are you?" picker and re-fetches with the
   * role.
   */
  status: "invited" | "b_joined" | "needs_role";
  /** CC-COUPLE-7 — alias of partnerAName, kept for back-compat. */
  personName: string;
  partnerAName: string;
  /** CC-COUPLE-7 — guesser display name (null on legacy one-sided invites). */
  partnerBName: string | null;
  bond: BondInfo;
  /** CC-COUPLE-8 — viewer role this intro is for (null in needs_role). */
  role: CoupleRole | null;
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
  partnerAName: string;
  partnerBName: string | null;
  bond: BondInfo;
  direction: "a_guesses_b" | "b_guesses_a";
  awaiting?: { partnerName: string };
  warmTotal: WarmTotalPayload;
  items: ResolvedItem[];
}

// CC-COUPLE-8 — compare-view payload (Mode 2, both directions done).
interface DirectionView {
  direction: "a_guesses_b" | "b_guesses_a";
  subjectName: string;
  guesserName: string;
  warmTotal: WarmTotalPayload;
  items: ResolvedItem[];
}

interface ComparePayload {
  status: "compared";
  partnerAName: string;
  partnerBName: string;
  bond: BondInfo;
  directions: {
    a_guesses_b: DirectionView;
    b_guesses_a: DirectionView;
  };
  winner: { kind: "a" | "b" | "tie"; line: string };
}

type ApiPayload = IntroPayload | RevealPayload | ComparePayload;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "role_select"; data: IntroPayload }
  | { status: "intro"; data: IntroPayload }
  | { status: "reveal"; data: RevealPayload }
  | { status: "compare"; data: ComparePayload };

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
  // CC-COUPLE-8 — viewer-picked role in Mode 2. Drives the fetch (?role=)
  // and the POST body's role field.
  const [role, setRole] = useState<CoupleRole | null>(null);

  function classifyPayload(data: ApiPayload): LoadState {
    if (data.status === "compared") {
      return { status: "compare", data };
    }
    if (data.status === "completed") {
      return { status: "reveal", data };
    }
    if (data.status === "needs_role") {
      return { status: "role_select", data };
    }
    return { status: "intro", data };
  }

  // CC-COUPLE-8 — fetch with optional role query param. The role-select
  // step calls this to re-fetch as the chosen partner.
  async function fetchPayload(activeRole: CoupleRole | null): Promise<void> {
    const qs = activeRole ? `?role=${activeRole}` : "";
    try {
      const res = await fetch(`/api/couple/${token}${qs}`);
      if (!res.ok) {
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
      setLoad(classifyPayload(data));
    } catch (e) {
      setLoad({
        status: "error",
        message: e instanceof Error ? e.message : "request failed",
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Initial fetch — no role yet. Mode 2 returns needs_role; Mode 1
      // returns intro/reveal directly. Either is fine.
      await fetchPayload(null);
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // CC-COUPLE-8 — `fetchPayload` is defined inside the component and
    // would re-create every render; including it in deps causes an
    // infinite re-fetch loop. The token is the only thing that
    // legitimately drives a re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handlePickRole(picked: CoupleRole) {
    setRole(picked);
    setLoad({ status: "loading" });
    fetchPayload(picked);
  }

  async function handleSubmit() {
    if (load.status !== "intro") return;
    setSubmitState({ status: "submitting" });
    try {
      const rankedGuesses: Record<string, string[]> = {};
      for (const item of load.data.items) {
        const order = rankings[item.itemId] ?? item.options.map((o) => o.id);
        rankedGuesses[item.itemId] = order.slice(0, 3);
      }
      // CC-COUPLE-8 — include role in the POST body in Mode 2. Mode 1
      // ignores it. Take role from intro payload (server-emitted) which
      // is the source of truth.
      const submitRole = load.data.role ?? role;
      const res = await fetch(`/api/couple/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          submitRole
            ? { rankedGuesses, role: submitRole }
            : { rankedGuesses }
        ),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `submit failed (${res.status})`);
      }
      const data = (await res.json()) as ApiPayload;
      setLoad(classifyPayload(data));
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
        ) : load.status === "role_select" ? (
          <RoleSelectScreen data={load.data} onPick={handlePickRole} />
        ) : load.status === "compare" ? (
          <CompareScreen data={load.data} />
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
          {/* CC-COUPLE-7 — address B by name when the bond carries one. */}
          {data.partnerBName
            ? `How well do you know ${data.partnerAName === "your partner" ? "your partner" : data.partnerAName}, ${data.partnerBName}?`
            : data.partnerAName === "your partner"
            ? "How well do you know your partner?"
            : `How well do you know ${data.partnerAName}?`}
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
  order,
  onChange,
}: {
  item: ItemPayload;
  order: string[] | undefined;
  onChange: (order: string[]) => void;
}) {
  // CC-COUPLE-6 — `item.prompt` arrives fully resolved from the server
  // (template substitution of subject name + pronouns happens in
  // `/api/couple/[token]/route.ts`). No client-side regex chain — that
  // approach mangled prompts with mixed subject/guesser refs.

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
        {item.prompt}
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

// CC-COUPLE-8 — Mode 2 role-select. Shown when the bond is both-assessed
// and no role yet. The viewer picks which partner they are; the page
// re-fetches with the role to bring up the right direction.
function RoleSelectScreen({
  data,
  onPick,
}: {
  data: IntroPayload;
  onPick: (role: CoupleRole) => void;
}) {
  const aName = data.partnerAName;
  const bName = data.partnerBName ?? "Partner B";
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
          Which one are you?
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
          Pick yourself. You&apos;ll read the other one, and when both of you
          finish, you&apos;ll see the head-to-head.
        </p>
      </header>
      <div
        className="flex flex-col"
        style={{ gap: 12, marginTop: 8 }}
      >
        <RolePickButton label={`I'm ${aName}`} onClick={() => onPick("a")} />
        <RolePickButton label={`I'm ${bName}`} onClick={() => onPick("b")} />
      </div>
    </>
  );
}

function RolePickButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-focus-ring
      className="font-serif text-left"
      style={{
        background: "var(--paper-warm)",
        border: "1px solid var(--rule)",
        padding: "16px 18px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 16,
        color: "var(--ink)",
        lineHeight: 1.4,
      }}
    >
      {label}
    </button>
  );
}

function RevealScreen({ data }: { data: RevealPayload }) {
  const { warmTotal, items, personName, partnerAName, partnerBName, bond } =
    data;
  // CC-COUPLE-7 — prefer the bond-resolved partnerAName; the legacy
  // `personName` alias matches it but keeps any downstream consumer of
  // the older field happy.
  const aName = partnerAName || personName;
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
          {/* CC-COUPLE-7 — when the bond carries B's name, address it
              warmly ("How clearly Brad read Michele"); otherwise keep
              the original second-person phrasing. */}
          {partnerBName
            ? `How clearly ${partnerBName} read ${aName === "your partner" ? "your partner" : aName}`
            : `How clearly you read ${aName === "your partner" ? "your partner" : aName}`}
        </h1>
      </header>

      <WarmTotalCard warmTotal={warmTotal} personName={aName} />

      {/* CC-COUPLE-8 — Mode 2 one-side-done state: viewer's reveal is in,
          but their partner hasn't played yet. The compare view will
          unlock once both finish. */}
      {data.awaiting ? (
        <AwaitingPartnerBanner partnerName={data.awaiting.partnerName} />
      ) : null}

      <section className="flex flex-col" style={{ gap: 16 }}>
        {items.map((it) => (
          <ItemReveal key={it.itemId} item={it} />
        ))}
      </section>

      {/* CC-COUPLE-7 — Mode 2 seam. Shown only on Mode 1 / pre-Mode 2
          (bond.mode2 false) so it stops competing with the live compare
          screen. */}
      {bond.hasPartnerB && !bond.mode2 ? (
        <Mode2Seam aName={aName} bName={partnerBName} />
      ) : null}

      <PartnerTrajectoryNudge />
    </>
  );
}

// CC-COUPLE-8 — banner over a one-side-done reveal.
function AwaitingPartnerBanner({ partnerName }: { partnerName: string }) {
  return (
    <div
      className="flex flex-col"
      style={{
        gap: 6,
        padding: "12px 16px",
        borderRadius: 8,
        background: "var(--paper-warm)",
        border: "1px dashed var(--rule-soft)",
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
        Waiting on {partnerName}
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
        Your read is in. When {partnerName} finishes their pass, the
        head-to-head unlocks.
      </p>
    </div>
  );
}

// CC-COUPLE-8 — head-to-head compare view (both directions done).
function CompareScreen({ data }: { data: ComparePayload }) {
  const { directions, winner, partnerAName, partnerBName } = data;
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
          Head-to-head
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
          {partnerAName} & {partnerBName} — who read whom?
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
          {winner.line}
        </p>
      </header>

      <CompareScoreboard
        a_guesses_b={directions.a_guesses_b}
        b_guesses_a={directions.b_guesses_a}
        winnerKind={winner.kind}
      />

      <CompareDirectionBlock view={directions.b_guesses_a} />
      <CompareDirectionBlock view={directions.a_guesses_b} />

      <PartnerTrajectoryNudge />
    </>
  );
}

function CompareScoreboard({
  a_guesses_b,
  b_guesses_a,
  winnerKind,
}: {
  a_guesses_b: DirectionView;
  b_guesses_a: DirectionView;
  winnerKind: "a" | "b" | "tie";
}) {
  const rows = [
    {
      who: a_guesses_b.guesserName,
      subject: a_guesses_b.subjectName,
      total: a_guesses_b.warmTotal.totalPoints,
      max: a_guesses_b.warmTotal.maxPoints,
      isWinner: winnerKind === "a",
    },
    {
      who: b_guesses_a.guesserName,
      subject: b_guesses_a.subjectName,
      total: b_guesses_a.warmTotal.totalPoints,
      max: b_guesses_a.warmTotal.maxPoints,
      isWinner: winnerKind === "b",
    },
  ];
  return (
    <section
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
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        Scoreboard
      </p>
      {rows.map((row) => (
        <div
          key={`${row.who}-${row.subject}`}
          className="flex flex-row items-baseline justify-between"
          style={{ gap: 12, flexWrap: "wrap" }}
        >
          <p
            className="font-serif"
            style={{
              fontSize: 15,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {row.who} read {row.subject}
            {winnerKind !== "tie" && row.isWinner ? " ←" : ""}
          </p>
          <p
            className="font-mono"
            style={{
              fontSize: 14,
              color: "var(--ink)",
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.total} / {row.max} pts
          </p>
        </div>
      ))}
    </section>
  );
}

function CompareDirectionBlock({ view }: { view: DirectionView }) {
  return (
    <section
      className="flex flex-col"
      style={{
        gap: 12,
        padding: "16px 18px",
        borderRadius: 8,
        background: "var(--paper)",
        border: "1px solid var(--rule)",
      }}
    >
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--umber)",
          margin: 0,
        }}
      >
        {view.guesserName} reading {view.subjectName}
      </p>
      <WarmTotalCard warmTotal={view.warmTotal} personName={view.subjectName} />
      <div className="flex flex-col" style={{ gap: 12 }}>
        {view.items.map((it) => (
          <ItemReveal key={`${view.direction}-${it.itemId}`} item={it} />
        ))}
      </div>
    </section>
  );
}

// CC-COUPLE-7 — Visible-but-disabled entry point for Mode 2.
function Mode2Seam({
  aName,
  bName,
}: {
  aName: string;
  bName: string | null;
}) {
  const aLabel = aName === "your partner" ? "your partner" : aName;
  const bLabel = bName ?? "you";
  return (
    <div
      className="flex flex-col"
      style={{
        gap: 8,
        padding: "16px 18px",
        borderRadius: 8,
        background: "var(--paper)",
        border: "1px dashed var(--rule)",
        marginTop: 12,
      }}
      aria-disabled="true"
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
        Coming soon
      </p>
      <p
        className="font-serif"
        style={{
          fontSize: 15,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        Compare the two of you →
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
        Who&apos;s more likely to{" "}
        {bLabel === "you" ? `… you or ${aLabel}` : `… ${bLabel} or ${aLabel}`}?
        A different game, both of you assessed.
      </p>
    </div>
  );
}

// CC-COUPLE-6.2 — score-tier "brand" by total points (owner legend,
// 2026-05-24). Decade bands + a perfect-sweep easter egg at 40/40.
// NOTE: thresholds assume a full 40-pt round (8 items × 5). If the round
// selector ever ships materially shorter rounds, switch to maxPoints-relative
// banding so a short round can't cap out as "stranger" (and so a clean sweep
// of a short round can still hit the top tier).
interface RevealBrand {
  label: string;
  copy: string;
}
function revealBrand(points: number): RevealBrand {
  if (points >= 40)
    return { label: "You formed them with your hands", copy: "" };
  if (points >= 30)
    return {
      label: "Unofficial Biographer",
      copy: "You may know them better than they know themselves. Use this power gently.",
    };
  if (points >= 20)
    return {
      label: "Dedicated Partner",
      copy: "You know the patterns, the tells, and the emotional weather.",
    };
  if (points >= 10)
    return {
      label: "It's Obvious You Know Them",
      copy: "You're paying attention. The evidence is encouraging.",
    };
  return {
    label: "Oblivious Stranger",
    copy: "You may have met them once. Possibly near a cheese tray.",
  };
}

function WarmTotalCard({
  warmTotal,
  personName,
}: {
  warmTotal: WarmTotalPayload;
  personName: string;
}) {
  const name = personName === "your partner" ? "your partner" : personName;
  const noScore = warmTotal.maxPoints === 0 || warmTotal.clearlyOf === 0;
  const headline = noScore
    ? `No strong reads to score on this round.`
    : `You read ${name} clearly on ${warmTotal.clearlyRead} of ${warmTotal.clearlyOf}.`;
  const secondLine =
    `${warmTotal.clean} read clean · ${warmTotal.close} close · ` +
    `${warmTotal.adjacent} adjacent · ${warmTotal.off} confidently off` +
    (warmTotal.unscored > 0
      ? ` · ${warmTotal.unscored} skipped (no strong read)`
      : "");
  const brand = revealBrand(warmTotal.totalPoints);
  return (
    <section
      className="flex flex-col items-center"
      style={{
        gap: 4,
        padding: "24px 18px",
        borderRadius: 8,
        background: "var(--paper-warm)",
        border: "1px solid var(--rule-soft)",
        textAlign: "center",
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
      {!noScore ? (
        <>
          <div
            className="flex items-baseline justify-center"
            style={{ gap: 8, marginTop: 6 }}
          >
            <span
              className="font-serif"
              style={{
                fontSize: 92,
                fontWeight: 600,
                lineHeight: 1,
                color: "var(--umber)",
              }}
            >
              {warmTotal.totalPoints}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 16, color: "var(--ink-mute)" }}
            >
              / {warmTotal.maxPoints} pts
            </span>
          </div>
          <p
            className="font-serif"
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: "var(--ink)",
              margin: "8px 0 0",
              lineHeight: 1.2,
            }}
          >
            {brand.label}
          </p>
          {brand.copy ? (
            <p
              className="font-serif italic"
              style={{
                fontSize: 15,
                color: "var(--ink-soft)",
                margin: "4px 0 0",
                lineHeight: 1.45,
                maxWidth: 380,
              }}
            >
              {brand.copy}
            </p>
          ) : null}
        </>
      ) : null}
      <p
        className="font-serif italic"
        style={{
          fontSize: 14,
          color: "var(--ink-soft)",
          margin: noScore ? "4px 0 0" : "10px 0 0",
          lineHeight: 1.45,
        }}
      >
        {headline}
      </p>
      {!noScore ? (
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
