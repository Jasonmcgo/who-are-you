// CC-177 — Room Read player page.
//
// Path: `/game/room-read/[token]` — public, token-as-auth. Mirrors
// `app/couple/[token]/page.tsx` for the client structure: `use(params)`
// for the token, `useState`/`useEffect` for state, `fetch` for the
// CC-176 API contract.
//
// Five screens:
//   1. Join — pick identity from the player roster (persisted in
//      localStorage keyed by token).
//   2. Round — body-card prompt + vote tiles (one per player + "Both"
//      + "Nobody"); upserts the vote, polls until reveal.
//   3. Waiting — N of M submitted; engine pick stays hidden.
//   4. Reveal — vote distribution, engine pick + reason, verdict,
//      per-voter scores, scoreboard. Subject self-confirm prompt is
//      gated to the engine-picked viewer ONLY.
//   5. Final — session "complete" winner card.
//
// Engine-pick leak guard: the GET payload from CC-176 already omits
// `currentRound.enginePick` until the round is "revealed". This page
// MUST NOT infer it from anywhere else; the reveal POST is the only
// surface where the engine pick becomes visible.

"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";

import { BODY_CARD_LABELS } from "../../../../lib/games/roomRead/rounds";
import type { BodyCardTheme } from "../../../../lib/games/roomRead/types";

// ─────────────────────────────────────────────────────────────────────
// Wire types — mirror `lib/games/roomRead/persistence.ts` exactly.
// Copied here (not imported) so the page works as a "use client"
// module without dragging server-only imports onto the bundle.
// ─────────────────────────────────────────────────────────────────────

interface EnginePickPayload {
  playerId: string;
  displayName: string;
  score: number;
  confidence: "high" | "medium" | "low";
  isSplit: boolean;
  matchedTags: { tag: string; contribution: number }[];
  reason: string;
  runnerUp?: { playerId: string; displayName: string; score: number };
}

// CC-ROOMREAD-ROUND-STATUS — per-round submission roster (open-round only).
interface VoteStatusPayload {
  total: number;
  submittedCount: number;
  submitted: { playerId: string; displayName: string }[];
  waitingOn: { playerId: string; displayName: string }[];
  allIn: boolean;
}

interface RoomReadStatePayload {
  sessionId: string;
  status: string;
  mode: string;
  players: { playerId: string; displayName: string }[];
  currentRound: {
    roundId: string;
    roundNumber: number;
    theme: BodyCardTheme;
    status: "pending" | "open" | "revealed";
    card: { id: string; prompt: string };
    enginePick?: EnginePickPayload;
    revealedAt?: string;
    /** CC-ROOMREAD-ROUND-STATUS — present only on open rounds. */
    voteStatus?: VoteStatusPayload;
  } | null;
  scoreboard: { playerId: string; displayName: string; total: number }[];
}

interface RoundScoreBreakdownPayload {
  matchedEngine: boolean;
  matchedRoom: boolean;
  perfectRead: boolean;
  splitRead: boolean;
  points: number;
}

interface RevealedRoundPayload {
  roundId: string;
  roundNumber: number;
  theme: BodyCardTheme;
  card: { id: string; prompt: string };
  enginePick: EnginePickPayload;
  roomWinnerPlayerId: string | undefined;
  roomVoteDistribution: Record<string, number>;
  verdict: "obvious" | "human_override" | "identity_fog";
  scores: {
    playerId: string;
    displayName: string;
    points: number;
    breakdown: RoundScoreBreakdownPayload;
  }[];
}

// Persistence sentinels — mirrored from `lib/games/roomRead/types.ts`.
const ROOM_WINNER_BOTH_SENTINEL = "__both__";
const ROOM_WINNER_NOBODY_SENTINEL = "__nobody__";

// ─────────────────────────────────────────────────────────────────────
// Round-intro prose (deferred from CC-175.1 — one short intro per
// theme; the round-intro voice matches the existing card prompts).
// ─────────────────────────────────────────────────────────────────────

const ROUND_INTRO_PROSE: Record<BodyCardTheme, string> = {
  lens: "This round is about how people read reality — the pattern, the warning sign, the emotional weather, the human clue, or the thing everyone else walks past.",
  compass:
    "This round is about what each player protects: the value that everything else gets arranged around when something has to give.",
  hands:
    "This round is about craft — what the hands actually make, and whether the work serves the life or quietly becomes the place you hide from it.",
  voice:
    "This round is about what gets said at cost: the sentence the room is avoiding, the joke that lands the moment, the silence that means something.",
  gravity:
    "This round is about who carries the weight — whose spine holds the responsibility nobody else is naming.",
  trust:
    "This round is about whose voice gets authority — the trusted few, the institutional skeptic, the security-anchor, the approval grip.",
  fire: "This round is about the immune response: who shows teeth, who stays calm, who burns for truth, who returns to the plan that used to work.",
  path: "This round is about the long arc — the governance, the pace, the meaning underneath, the willingness to jump before certain.",
};

// ─────────────────────────────────────────────────────────────────────
// Verdict copy (CC-177 §4 — 4 display variants from the 3 core
// outcomes; derived at render, never at the server).
// ─────────────────────────────────────────────────────────────────────

function verdictCopy(
  verdict: RevealedRoundPayload["verdict"],
  enginePick: EnginePickPayload
): { kicker: string; body: string } {
  if (verdict === "obvious") {
    return {
      kicker: "Obvious",
      body: "The room and the engine agree. The accused may now stop pretending.",
    };
  }
  if (verdict === "identity_fog") {
    return {
      kicker: "Identity Fog",
      body: "No clean consensus. Either the prompt is brilliant, or everyone needs snacks.",
    };
  }
  // human_override — split into two variants by engine confidence.
  if (enginePick.confidence === "high" && !enginePick.isSplit) {
    return {
      kicker: "Engine Dissent",
      body: "The room saw the surface. The engine suspects deeper wiring.",
    };
  }
  return {
    kicker: "Human Override",
    body: "The engine made a principled accusation. The room brought different receipts.",
  };
}

// ─────────────────────────────────────────────────────────────────────
// LocalStorage helpers — picked identity per token. Token-keyed so a
// device that plays multiple games keeps each identity separate.
// ─────────────────────────────────────────────────────────────────────

function identityStorageKey(token: string): string {
  return `room-read:${token}:identity`;
}
function loadIdentity(token: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(identityStorageKey(token));
  } catch {
    return null;
  }
}
function saveIdentity(token: string, playerId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(identityStorageKey(token), playerId);
  } catch {
    // soft-fail — identity stays in component state
  }
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: RoomReadStatePayload };

type RevealState =
  | { kind: "none" }
  | { kind: "loaded"; payload: RevealedRoundPayload }
  | { kind: "revealing" }
  | { kind: "error"; message: string };

type VoteSubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

type ConfirmState =
  | { kind: "hidden" }
  | { kind: "open"; note: string }
  | { kind: "submitting"; note: string }
  | { kind: "done"; response: "yes" | "no" | "both" }
  | { kind: "error"; message: string };

export default function RoomReadGamePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [identity, setIdentity] = useState<string | null>(null);
  // The active vote pick — a player id, "__both__", or "__nobody__".
  const [pick, setPick] = useState<string | null>(null);
  const [voteSubmit, setVoteSubmit] = useState<VoteSubmitState>({ kind: "idle" });
  const [reveal, setReveal] = useState<RevealState>({ kind: "none" });
  const [confirm, setConfirm] = useState<ConfirmState>({ kind: "hidden" });

  // Restore the picked identity from localStorage on first mount.
  // queueMicrotask defers the setState past the effect's synchronous
  // body, satisfying the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    const stored = loadIdentity(token);
    if (stored) {
      queueMicrotask(() => {
        setIdentity(stored);
      });
    }
  }, [token]);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/room-read/${token}`);
      if (!res.ok) {
        if (res.status === 404) {
          setLoad({ kind: "error", message: "this-link-isnt-active" });
          return;
        }
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setLoad({
          kind: "error",
          message: body.error ?? `request failed (${res.status})`,
        });
        return;
      }
      const data = (await res.json()) as RoomReadStatePayload;
      setLoad({ kind: "ready", data });
      // Reset reveal cache when the round id changes (a new round
      // opened or the previous reveal got cleared).
      setReveal((prev) => {
        if (prev.kind === "loaded" && data.currentRound?.roundId !== prev.payload.roundId) {
          return { kind: "none" };
        }
        return prev;
      });
    } catch (e) {
      setLoad({
        kind: "error",
        message: e instanceof Error ? e.message : "request failed",
      });
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      void refetch();
    });
  }, [refetch]);

  // Light polling while the round is open — picks up other players'
  // votes + the auto-reveal moment. 2.5s is a balance between
  // responsiveness and politeness toward the dev server.
  useEffect(() => {
    if (load.kind !== "ready") return;
    const round = load.data.currentRound;
    if (!round || round.status === "revealed") return;
    const id = window.setInterval(() => {
      void refetch();
    }, 2500);
    return () => window.clearInterval(id);
  }, [load, refetch]);

  // When the round flips to "revealed" via polling, auto-fetch the
  // reveal payload (so the room sees the verdict without an explicit
  // click). Idempotent — the route is the same the host might call.
  useEffect(() => {
    if (load.kind !== "ready") return;
    const round = load.data.currentRound;
    if (!round) return;
    if (round.status !== "revealed") return;
    if (reveal.kind === "loaded" && reveal.payload.roundId === round.roundId) return;
    if (reveal.kind === "revealing") return;
    void loadOrFireReveal(round.roundId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  // CC-ROOMREAD-ROUND-STATUS — auto-reveal when all reads are in.
  // The poll loop refreshes voteStatus every 2.5s; once it sees
  // allIn=true, ANY client can fire the reveal POST. The endpoint is
  // idempotent so multiple clients racing to it doesn't matter — the
  // first writes "revealed", the rest receive an "already revealed"
  // and synthesize the reveal from the GET state. No silent jump:
  // we leave the "All reads in — revealing…" beat visible while the
  // reveal POST is in flight.
  useEffect(() => {
    if (load.kind !== "ready") return;
    const round = load.data.currentRound;
    if (!round) return;
    if (round.status !== "open") return;
    if (!round.voteStatus?.allIn) return;
    if (reveal.kind === "revealing") return;
    if (reveal.kind === "loaded" && reveal.payload.roundId === round.roundId) return;
    void loadOrFireReveal(round.roundId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function loadOrFireReveal(roundId: string) {
    setReveal({ kind: "revealing" });
    try {
      const res = await fetch(
        `/api/games/room-read/${token}/rounds/${roundId}/reveal`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        // "already revealed" is fine — the server returns the round
        // in the GET payload. We just need the reveal payload to
        // render. CC-176's reveal route returns the full reveal
        // payload on success; if the round is already revealed we
        // fall back to a synthetic payload built from the GET state.
        if (body.error?.includes("already revealed") && load.kind === "ready") {
          const round = load.data.currentRound;
          if (round?.enginePick) {
            setReveal({
              kind: "loaded",
              payload: synthesizeRevealFromState(round),
            });
            return;
          }
        }
        setReveal({
          kind: "error",
          message: body.error ?? `request failed (${res.status})`,
        });
        return;
      }
      const payload = (await res.json()) as RevealedRoundPayload;
      setReveal({ kind: "loaded", payload });
      // After reveal, refresh GET so the scoreboard reflects the new
      // round and (if `complete`) the page transitions to the final.
      void refetch();
    } catch (e) {
      setReveal({
        kind: "error",
        message: e instanceof Error ? e.message : "reveal failed",
      });
    }
  }

  // Build a minimal reveal payload from the GET state. Used when the
  // user navigates back to an already-revealed round (POST reveal
  // returns 409 → we still want to show the engine pick + verdict).
  // Vote distribution and scores aren't on the GET payload — we
  // surface placeholders rather than re-fetch.
  function synthesizeRevealFromState(
    round: NonNullable<RoomReadStatePayload["currentRound"]>
  ): RevealedRoundPayload {
    if (!round.enginePick) {
      throw new Error("synthesizeReveal: round has no enginePick");
    }
    return {
      roundId: round.roundId,
      roundNumber: round.roundNumber,
      theme: round.theme,
      card: round.card,
      enginePick: round.enginePick,
      roomWinnerPlayerId: undefined,
      roomVoteDistribution: {},
      verdict: "obvious", // best-effort fallback; the real verdict was logged at reveal time
    scores: [],
    };
  }

  async function handleSubmitVote() {
    if (!identity || !pick) return;
    if (load.kind !== "ready") return;
    const round = load.data.currentRound;
    if (!round || round.status !== "open") return;

    setVoteSubmit({ kind: "submitting" });
    const isSpecial =
      pick === ROOM_WINNER_BOTH_SENTINEL || pick === ROOM_WINNER_NOBODY_SENTINEL;
    const body = isSpecial
      ? {
          voterPlayerId: identity,
          guessedSpecial: pick === ROOM_WINNER_BOTH_SENTINEL ? "both" : "nobody",
        }
      : { voterPlayerId: identity, guessedPlayerId: pick };
    try {
      const res = await fetch(
        `/api/games/room-read/${token}/rounds/${round.roundId}/guess`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `submit failed (${res.status})`);
      }
      setVoteSubmit({ kind: "idle" });
      void refetch();
    } catch (e) {
      setVoteSubmit({
        kind: "error",
        message: e instanceof Error ? e.message : "submit failed",
      });
    }
  }

  async function handleReveal() {
    if (load.kind !== "ready") return;
    const round = load.data.currentRound;
    if (!round) return;
    await loadOrFireReveal(round.roundId);
  }

  async function handleNextRound() {
    try {
      await fetch(`/api/games/room-read/${token}/next-round`, {
        method: "POST",
      });
      setReveal({ kind: "none" });
      setPick(null);
      setConfirm({ kind: "hidden" });
      void refetch();
    } catch {
      // Soft-fail; GET refresh will surface any new state.
    }
  }

  async function handleSelfConfirmSubmit(response: "yes" | "no" | "both", note: string) {
    if (reveal.kind !== "loaded" || !identity) return;
    setConfirm({ kind: "submitting", note });
    try {
      const res = await fetch(
        `/api/games/room-read/${token}/rounds/${reveal.payload.roundId}/subject-confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectPlayerId: identity,
            response,
            note: note.trim().length > 0 ? note.trim() : undefined,
          }),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setConfirm({
          kind: "error",
          message: body.error ?? `confirm failed (${res.status})`,
        });
        return;
      }
      setConfirm({ kind: "done", response });
    } catch (e) {
      setConfirm({
        kind: "error",
        message: e instanceof Error ? e.message : "confirm failed",
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────

  if (load.kind === "loading") return <LoadingState />;
  if (load.kind === "error") return <InactiveLinkState detail={load.message} />;

  const state = load.data;
  const isComplete = state.status === "complete" && state.currentRound === null;
  if (isComplete) return <FinalScoreboard state={state} />;

  // Join screen — identity not yet picked.
  if (!identity) {
    return (
      <JoinScreen
        state={state}
        onPickIdentity={(playerId) => {
          setIdentity(playerId);
          saveIdentity(token, playerId);
        }}
      />
    );
  }

  // Reveal screen (round is revealed AND we have the reveal payload).
  if (reveal.kind === "loaded" && state.currentRound?.roundId === reveal.payload.roundId) {
    return (
      <RevealScreen
        state={state}
        reveal={reveal.payload}
        viewerPlayerId={identity}
        confirm={confirm}
        onConfirmOpen={() => setConfirm({ kind: "open", note: "" })}
        onConfirmCancel={() => setConfirm({ kind: "hidden" })}
        onConfirmNoteChange={(note) =>
          setConfirm((prev) =>
            prev.kind === "open"
              ? { ...prev, note }
              : prev.kind === "error"
              ? { kind: "open", note }
              : prev
          )
        }
        onConfirmSubmit={handleSelfConfirmSubmit}
        onNextRound={handleNextRound}
      />
    );
  }

  // Voting / waiting screen.
  return (
    <VotingScreen
      state={state}
      identity={identity}
      pick={pick}
      onPick={setPick}
      onSubmitVote={handleSubmitVote}
      voteSubmit={voteSubmit}
      onReveal={handleReveal}
      revealState={reveal}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-screens
// ─────────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
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
        {children}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <PageShell>
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
    </PageShell>
  );
}

function InactiveLinkState({ detail }: { detail: string }) {
  return (
    <PageShell>
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
          The game link couldn&apos;t be opened. It may have expired or the URL
          may be incorrect.
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
    </PageShell>
  );
}

function JoinScreen({
  state,
  onPickIdentity,
}: {
  state: RoomReadStatePayload;
  onPickIdentity: (playerId: string) => void;
}) {
  const [picked, setPicked] = useState("");
  return (
    <PageShell>
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
          Room Read · Body Card Journey
        </p>
        <h1
          className="font-serif"
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          The room votes. The engine makes its read.{" "}
          <em>The accused may plead their case.</em>
        </h1>
      </header>

      <section className="flex flex-col" style={{ gap: 14 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          {state.players.length} player{state.players.length === 1 ? "" : "s"} in
          the room
        </p>
        <ul
          className="flex flex-col"
          style={{ gap: 6, margin: 0, padding: 0, listStyle: "none" }}
        >
          {state.players.map((p) => (
            <li
              key={p.playerId}
              className="font-serif"
              style={{ fontSize: 14, color: "var(--ink)" }}
            >
              {p.displayName}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col" style={{ gap: 10 }}>
        <label
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
          }}
        >
          I am
        </label>
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          data-focus-ring
          className="font-serif"
          style={{
            background: "var(--paper-warm)",
            border: "1px solid var(--rule)",
            padding: "10px 12px",
            borderRadius: 6,
            fontSize: 15,
            color: "var(--ink)",
          }}
        >
          <option value="">— select your player —</option>
          {state.players.map((p) => (
            <option key={p.playerId} value={p.playerId}>
              {p.displayName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => picked && onPickIdentity(picked)}
          disabled={picked.length === 0}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            background: picked ? "var(--umber)" : "var(--ink-faint)",
            color: "var(--paper, #fff)",
            border: "1px solid var(--umber)",
            padding: "12px 18px",
            cursor: picked ? "pointer" : "not-allowed",
            alignSelf: "flex-start",
          }}
        >
          Enter the room
        </button>
      </section>
    </PageShell>
  );
}

function VotingScreen({
  state,
  identity,
  pick,
  onPick,
  onSubmitVote,
  voteSubmit,
  onReveal,
  revealState,
}: {
  state: RoomReadStatePayload;
  identity: string;
  pick: string | null;
  onPick: (value: string) => void;
  onSubmitVote: () => void;
  voteSubmit: VoteSubmitState;
  onReveal: () => void;
  revealState: RevealState;
}) {
  const round = state.currentRound;
  const themeLabel = round ? BODY_CARD_LABELS[round.theme] : "";
  const intro = round ? ROUND_INTRO_PROSE[round.theme] : "";

  // Engine-pick leak guard — render-side assertion. If the GET payload
  // ever exposes `enginePick` on a non-revealed round, this assertion
  // makes the leak loud. The DOM never carries the engine pick on a
  // pre-reveal render because we don't read it on this code path.
  const engineLeak =
    round?.status !== "revealed" && round && round.enginePick !== undefined;

  if (!round) {
    return (
      <PageShell>
        <p className="font-serif" style={{ fontSize: 16, color: "var(--ink)" }}>
          No active round. Waiting for the host to advance the game.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {engineLeak ? (
        <div
          role="alert"
          style={{
            background: "var(--paper-warm)",
            border: "1px solid var(--umber)",
            borderRadius: 6,
            padding: 12,
            fontSize: 12,
            color: "var(--ink)",
          }}
        >
          BUG: enginePick is present on a non-revealed round in the GET payload.
          Refresh.
        </div>
      ) : null}

      <header className="flex flex-col" style={{ gap: 8 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Round {round.roundNumber} · {themeLabel}
        </p>
        <p
          className="font-serif italic"
          style={{
            fontSize: 14,
            color: "var(--ink-soft)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {intro}
        </p>
      </header>

      <section
        style={{
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          padding: "20px 18px",
          borderRadius: 8,
        }}
      >
        <p
          className="font-serif"
          style={{
            fontSize: 18,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {round.card.prompt}
        </p>
      </section>

      {/* CC-ROOMREAD-ROUND-STATUS — vote roster. Renders the
          submitted/waiting-on split (names, not just N/M), the
          viewer's own state, and a clear reveal-unlock condition. */}
      {round.voteStatus ? (
        <VoteRoster
          voteStatus={round.voteStatus}
          identity={identity}
          revealing={revealState.kind === "revealing"}
        />
      ) : null}

      <section className="flex flex-col" style={{ gap: 8 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Your read
        </p>
        <div className="flex flex-col" style={{ gap: 6 }}>
          {state.players.map((p) => (
            <VoteTile
              key={p.playerId}
              label={p.displayName}
              selected={pick === p.playerId}
              onClick={() => onPick(p.playerId)}
            />
          ))}
          <VoteTile
            label="Both / Multiple, but for different reasons"
            selected={pick === ROOM_WINNER_BOTH_SENTINEL}
            onClick={() => onPick(ROOM_WINNER_BOTH_SENTINEL)}
            variant="special"
          />
          <VoteTile
            label="Nobody, thankfully"
            selected={pick === ROOM_WINNER_NOBODY_SENTINEL}
            onClick={() => onPick(ROOM_WINNER_NOBODY_SENTINEL)}
            variant="special"
          />
        </div>
      </section>

      <div className="flex flex-col" style={{ gap: 8 }}>
        <button
          type="button"
          onClick={onSubmitVote}
          disabled={!pick || voteSubmit.kind === "submitting"}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            background: pick ? "var(--umber)" : "var(--ink-faint)",
            color: "var(--paper, #fff)",
            border: "1px solid var(--umber)",
            padding: "12px 18px",
            cursor: pick ? "pointer" : "not-allowed",
            alignSelf: "flex-start",
          }}
        >
          {voteSubmit.kind === "submitting" ? "submitting…" : "Submit Read"}
        </button>
        {voteSubmit.kind === "error" ? (
          <p
            className="font-serif italic"
            style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}
          >
            {voteSubmit.message}
          </p>
        ) : null}
        <p
          className="font-serif italic"
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Identity: {identity.slice(0, 8)}. You can change your vote until the
          round is revealed.
        </p>

        <button
          type="button"
          onClick={onReveal}
          disabled={revealState.kind === "revealing"}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            marginTop: 18,
            fontSize: 11,
            letterSpacing: "0.12em",
            background: "transparent",
            color: "var(--umber)",
            border: "1px solid var(--umber)",
            padding: "10px 16px",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          {revealState.kind === "revealing"
            ? "revealing…"
            : "Reveal the Room Read"}
        </button>
      </div>

      <Scoreboard scoreboard={state.scoreboard} />
    </PageShell>
  );
}

// CC-ROOMREAD-ROUND-STATUS — vote roster + reveal-unlock copy. Renders
// during the open round only. Names are presence-only — no vote choice
// or engine pick is exposed here.
function VoteRoster({
  voteStatus,
  identity,
  revealing,
}: {
  voteStatus: VoteStatusPayload;
  identity: string;
  revealing: boolean;
}) {
  const { submitted, waitingOn, submittedCount, total, allIn } = voteStatus;
  // Did the viewer's own read land yet? Useful so each player gets
  // confirmation independent of how many of their teammates have voted.
  const viewerSubmitted = submitted.some((p) => p.playerId === identity);

  // When `allIn` flips we surface a brief "All reads in — revealing…"
  // beat. The auto-reveal hook above fires `loadOrFireReveal`; that
  // sets `revealing` to true on the page, and the round-status flip
  // (open → revealed) brings up the RevealScreen on the next poll.
  // Either signal renders the bridge copy here, so the round-end isn't
  // a silent jump.
  const showRevealingBeat = allIn || revealing;

  return (
    <section
      className="flex flex-col"
      style={{
        gap: 8,
        background: showRevealingBeat ? "var(--umber-wash)" : "var(--paper)",
        border: showRevealingBeat
          ? "1px solid var(--umber)"
          : "1px solid var(--rule)",
        padding: "14px 16px",
        borderRadius: 8,
      }}
      aria-live="polite"
    >
      <div
        className="flex flex-row items-baseline justify-between"
        style={{ gap: 12, flexWrap: "wrap" }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: showRevealingBeat ? "var(--umber)" : "var(--ink-mute)",
            margin: 0,
          }}
        >
          {showRevealingBeat
            ? "All reads in — revealing…"
            : `Reads in: ${submittedCount} of ${total}`}
        </p>
        <p
          className="font-serif italic"
          style={{
            fontSize: 12,
            color: "var(--ink-soft)",
            margin: 0,
          }}
        >
          {viewerSubmitted ? "✓ Your read is in" : "Your read isn't in yet"}
        </p>
      </div>
      {!showRevealingBeat ? (
        <div className="flex flex-col" style={{ gap: 2 }}>
          {submitted.length > 0 ? (
            <p
              className="font-serif"
              style={{
                fontSize: 13,
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "var(--umber)" }}>✓ Submitted:</span>{" "}
              {submitted.map((p) => p.displayName).join(", ")}
            </p>
          ) : null}
          {waitingOn.length > 0 ? (
            <p
              className="font-serif italic"
              style={{
                fontSize: 13,
                color: "var(--ink-soft)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Waiting on: {waitingOn.map((p) => p.displayName).join(", ")}
            </p>
          ) : null}
          <p
            className="font-mono"
            style={{
              fontSize: 11,
              color: "var(--ink-mute)",
              margin: "4px 0 0",
            }}
          >
            Reveal unlocks when all {total} have read.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function VoteTile({
  label,
  selected,
  onClick,
  variant = "default",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "special";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-focus-ring
      className="font-serif text-left"
      style={{
        background: selected ? "var(--umber-wash)" : "var(--paper-warm)",
        border: selected ? "1px solid var(--umber)" : "1px solid var(--rule)",
        color: "var(--ink)",
        padding: "12px 14px",
        fontSize: 15,
        fontStyle: variant === "special" ? "italic" : "normal",
        lineHeight: 1.4,
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 120ms ease-out, border-color 120ms ease-out",
      }}
    >
      {label}
    </button>
  );
}

function RevealScreen({
  state,
  reveal,
  viewerPlayerId,
  confirm,
  onConfirmOpen,
  onConfirmCancel,
  onConfirmNoteChange,
  onConfirmSubmit,
  onNextRound,
}: {
  state: RoomReadStatePayload;
  reveal: RevealedRoundPayload;
  viewerPlayerId: string;
  confirm: ConfirmState;
  onConfirmOpen: () => void;
  onConfirmCancel: () => void;
  onConfirmNoteChange: (note: string) => void;
  onConfirmSubmit: (response: "yes" | "no" | "both", note: string) => void;
  onNextRound: () => void;
}) {
  const themeLabel = BODY_CARD_LABELS[reveal.theme];
  const copy = verdictCopy(reveal.verdict, reveal.enginePick);
  const viewerIsSubject = viewerPlayerId === reveal.enginePick.playerId;
  const playerById = new Map(state.players.map((p) => [p.playerId, p.displayName]));

  return (
    <PageShell>
      <header className="flex flex-col" style={{ gap: 8 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Round {reveal.roundNumber} · {themeLabel} · Revealed
        </p>
        <p
          className="font-serif"
          style={{
            fontSize: 17,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {reveal.card.prompt}
        </p>
      </header>

      <section
        className="flex flex-col"
        style={{
          gap: 10,
          background: "var(--paper-warm)",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          padding: "16px 18px",
        }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          The Room Says
        </p>
        {Object.keys(reveal.roomVoteDistribution).length === 0 ? (
          <p
            className="font-serif italic"
            style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}
          >
            (no vote distribution — previously-revealed round)
          </p>
        ) : (
          <ul
            className="flex flex-col"
            style={{ gap: 4, margin: 0, padding: 0, listStyle: "none" }}
          >
            {Object.entries(reveal.roomVoteDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => {
                const label =
                  key === ROOM_WINNER_BOTH_SENTINEL
                    ? "Both / Multiple"
                    : key === ROOM_WINNER_NOBODY_SENTINEL
                    ? "Nobody, thankfully"
                    : playerById.get(key) ?? key;
                return (
                  <li
                    key={key}
                    className="font-serif"
                    style={{
                      fontSize: 14,
                      color: "var(--ink)",
                      margin: 0,
                    }}
                  >
                    <span style={{ color: "var(--umber)", fontWeight: 600 }}>
                      {count}
                    </span>
                    {" · "}
                    {label}
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      <section
        className="flex flex-col"
        style={{
          gap: 8,
          background: "var(--paper-warm)",
          border: "1px solid var(--umber)",
          borderRadius: 8,
          padding: "16px 18px",
        }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--umber)",
            margin: 0,
          }}
        >
          The Engine Says
        </p>
        <p
          className="font-serif"
          style={{
            fontSize: 17,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {reveal.enginePick.displayName}
          {reveal.enginePick.isSplit
            ? " — and the runner-up too (split read)"
            : ""}
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
          {reveal.enginePick.reason}
        </p>
        {reveal.enginePick.matchedTags.length > 0 ? (
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.04em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            confidence: {reveal.enginePick.confidence}
            {" · "}
            tags:{" "}
            {reveal.enginePick.matchedTags.map((t) => t.tag).join(", ")}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col" style={{ gap: 6 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--umber)",
            margin: 0,
          }}
        >
          Verdict · {copy.kicker}
        </p>
        <p
          className="font-serif italic"
          style={{
            fontSize: 15,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {copy.body}
        </p>
      </section>

      {reveal.scores.length > 0 ? (
        <section className="flex flex-col" style={{ gap: 6 }}>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--ink-mute)",
              margin: 0,
            }}
          >
            This round
          </p>
          <ul
            className="flex flex-col"
            style={{ gap: 4, margin: 0, padding: 0, listStyle: "none" }}
          >
            {reveal.scores.map((s) => (
              <li
                key={s.playerId}
                className="font-serif"
                style={{ fontSize: 14, color: "var(--ink)" }}
              >
                <span style={{ color: "var(--umber)", fontWeight: 600 }}>
                  +{s.points}
                </span>
                {" · "}
                {s.displayName}
                {s.breakdown.splitRead ? " (split read)" : ""}
                {s.breakdown.perfectRead ? " (perfect read)" : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Scoreboard scoreboard={state.scoreboard} />

      {viewerIsSubject ? (
        <SelfConfirmBlock
          confirm={confirm}
          onOpen={onConfirmOpen}
          onCancel={onConfirmCancel}
          onNoteChange={onConfirmNoteChange}
          onSubmit={onConfirmSubmit}
        />
      ) : null}

      <button
        type="button"
        onClick={onNextRound}
        data-focus-ring
        className="font-mono uppercase"
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          background: "var(--umber)",
          color: "var(--paper, #fff)",
          border: "1px solid var(--umber)",
          padding: "12px 18px",
          cursor: "pointer",
          alignSelf: "flex-start",
          marginTop: 16,
        }}
      >
        Next Body Card →
      </button>
    </PageShell>
  );
}

function Scoreboard({
  scoreboard,
}: {
  scoreboard: RoomReadStatePayload["scoreboard"];
}) {
  if (scoreboard.length === 0) return null;
  const sorted = [...scoreboard].sort((a, b) => b.total - a.total);
  return (
    <section
      className="flex flex-col"
      style={{
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid var(--rule-soft)",
      }}
    >
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--ink-mute)",
          margin: 0,
        }}
      >
        Scoreboard
      </p>
      <ul
        className="flex flex-col"
        style={{ gap: 4, margin: 0, padding: 0, listStyle: "none" }}
      >
        {sorted.map((s) => (
          <li
            key={s.playerId}
            className="font-serif"
            style={{ fontSize: 14, color: "var(--ink)" }}
          >
            <span style={{ color: "var(--umber)", fontWeight: 600 }}>
              {s.total}
            </span>
            {" · "}
            {s.displayName}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SelfConfirmBlock({
  confirm,
  onOpen,
  onCancel,
  onNoteChange,
  onSubmit,
}: {
  confirm: ConfirmState;
  onOpen: () => void;
  onCancel: () => void;
  onNoteChange: (note: string) => void;
  onSubmit: (response: "yes" | "no" | "both", note: string) => void;
}) {
  if (confirm.kind === "hidden") {
    return (
      <section
        className="flex flex-col"
        style={{
          gap: 8,
          padding: "14px 16px",
          background: "var(--paper-warm)",
          border: "1px dashed var(--umber)",
          borderRadius: 8,
          marginTop: 16,
        }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--umber)",
            margin: 0,
          }}
        >
          The engine read this as you
        </p>
        <p
          className="font-serif italic"
          style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}
        >
          Plead your case — does the read land?
        </p>
        <button
          type="button"
          onClick={onOpen}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            background: "transparent",
            color: "var(--umber)",
            border: "1px solid var(--umber)",
            padding: "8px 14px",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          Answer the engine
        </button>
      </section>
    );
  }
  if (confirm.kind === "done") {
    return (
      <section
        className="flex flex-col"
        style={{
          gap: 8,
          padding: "14px 16px",
          background: "var(--paper-warm)",
          border: "1px solid var(--umber)",
          borderRadius: 8,
          marginTop: 16,
        }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--umber)",
            margin: 0,
          }}
        >
          Your answer is logged
        </p>
        <p
          className="font-serif italic"
          style={{ fontSize: 14, color: "var(--ink)", margin: 0 }}
        >
          {confirm.response === "yes"
            ? "Yes — that's you."
            : confirm.response === "no"
            ? "No — not really."
            : "Both — for different reasons."}
        </p>
      </section>
    );
  }
  const submitting = confirm.kind === "submitting";
  const note =
    confirm.kind === "open" || confirm.kind === "submitting"
      ? confirm.note
      : "";
  const errorMsg = confirm.kind === "error" ? confirm.message : null;
  return (
    <section
      className="flex flex-col"
      style={{
        gap: 10,
        padding: "16px 18px",
        background: "var(--paper-warm)",
        border: "1px solid var(--umber)",
        borderRadius: 8,
        marginTop: 16,
      }}
    >
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "var(--umber)",
          margin: 0,
        }}
      >
        The engine read this as you
      </p>
      <p
        className="font-serif italic"
        style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}
      >
        Does it land?
      </p>
      <div className="flex flex-row" style={{ gap: 8, flexWrap: "wrap" }}>
        <ConfirmTile
          label="Yes, that's me"
          onClick={() => onSubmit("yes", note)}
          disabled={submitting}
        />
        <ConfirmTile
          label="No, not really"
          onClick={() => onSubmit("no", note)}
          disabled={submitting}
        />
        <ConfirmTile
          label="Both, for different reasons"
          onClick={() => onSubmit("both", note)}
          disabled={submitting}
        />
      </div>
      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="One-line note (optional)"
        maxLength={280}
        rows={2}
        data-focus-ring
        className="font-serif"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--rule)",
          padding: "8px 10px",
          borderRadius: 6,
          fontSize: 14,
          color: "var(--ink)",
          resize: "vertical",
        }}
      />
      <div className="flex flex-row" style={{ gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            background: "transparent",
            color: "var(--ink-mute)",
            border: "1px solid var(--rule)",
            padding: "6px 12px",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
      {errorMsg ? (
        <p
          className="font-serif italic"
          style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}
        >
          {errorMsg}
        </p>
      ) : null}
    </section>
  );
}

function ConfirmTile({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-focus-ring
      className="font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        background: "var(--umber)",
        color: "var(--paper, #fff)",
        border: "1px solid var(--umber)",
        padding: "8px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}

function FinalScoreboard({ state }: { state: RoomReadStatePayload }) {
  const sorted = useMemo(
    () => [...state.scoreboard].sort((a, b) => b.total - a.total),
    [state.scoreboard]
  );
  const winner = sorted[0];
  return (
    <PageShell>
      <header className="flex flex-col" style={{ gap: 8 }}>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            color: "var(--ink-mute)",
            margin: 0,
          }}
        >
          Room Read · Complete
        </p>
        <h1
          className="font-serif"
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {winner
            ? `${winner.displayName} reads the room.`
            : "No reads recorded."}
        </h1>
        {winner ? (
          <p
            className="font-serif italic"
            style={{
              fontSize: 14,
              color: "var(--ink-soft)",
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Pattern Whisperer — {winner.total}
            {" "}
            point{winner.total === 1 ? "" : "s"} across the journey.
          </p>
        ) : null}
      </header>

      <Scoreboard scoreboard={state.scoreboard} />
    </PageShell>
  );
}
