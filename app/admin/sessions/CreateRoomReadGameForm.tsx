// CC-177 — Admin "Create Room Read Game" surface. Builds a 4–10
// player game over assessed sessions, posts to the admin create
// route (`POST /api/admin/games/room-read/sessions` from CC-176),
// and surfaces the resulting join URL with a copy affordance.
//
// Mirrors `CreateCoupleGameForm.tsx`'s shape: collapsed button until
// clicked, then expands inline. The roster is the same `RosterEntry[]`
// shape the couple form consumes — we re-use the type to avoid a
// parallel definition.

"use client";

import { useState } from "react";

import type { RosterEntry } from "./CreateCoupleGameForm";
import { KNOWN_PACKS } from "../../../lib/games/roomRead/packs";

// Pack options for the picker, sourced from the single registry so a new
// pack shows up here automatically. `academic` (free base) stays first.
const PACK_OPTIONS = Object.values(KNOWN_PACKS).sort((a, b) =>
  a.id === "academic" ? -1 : b.id === "academic" ? 1 : a.label.localeCompare(b.label)
);

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ready"; url: string; sessionId: string; rounds: number; copied: boolean }
  | { kind: "error"; message: string };

const GENERIC_ERROR =
  "We couldn't create your Room Read game just now. Please try again in a moment.";

export default function CreateRoomReadGameForm({
  roster,
}: {
  roster: RosterEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roundCount, setRoundCount] = useState<number>(8);
  const [pack, setPack] = useState<string>("academic");
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSubmit({ kind: "idle" });
  }

  const playerCount = selectedIds.size;
  const playerCountInRange = playerCount >= 4 && playerCount <= 10;
  const roundCountInRange = roundCount >= 4 && roundCount <= 10;
  const canSubmit =
    playerCountInRange && roundCountInRange && submit.kind !== "submitting";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmit({ kind: "submitting" });
    try {
      const res = await fetch("/api/admin/games/room-read/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerSessionIds: [...selectedIds],
          roundCount,
          mode: "classic",
          // The admin route resolves entitlement per `createdByAdmin`
          // (owner comp) then intersects this override against it — so a
          // pure single-pack game is honored only if the owner holds it.
          allowedPacks: [pack],
          createdByAdmin: "admin",
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmit({
          kind: "error",
          message:
            typeof body?.error === "string" ? body.error : GENERIC_ERROR,
        });
        return;
      }
      const data = (await res.json()) as {
        sessionId: string;
        joinToken: string;
        joinUrl: string;
        rounds: number;
      };
      setSubmit({
        kind: "ready",
        url: data.joinUrl,
        sessionId: data.sessionId,
        rounds: data.rounds,
        copied: false,
      });
    } catch (err) {
      setSubmit({
        kind: "error",
        message: err instanceof Error ? err.message : GENERIC_ERROR,
      });
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setSubmit((prev) =>
        prev.kind === "ready" ? { ...prev, copied: true } : prev
      );
      window.setTimeout(
        () =>
          setSubmit((prev) =>
            prev.kind === "ready" ? { ...prev, copied: false } : prev
          ),
        2500
      );
    } catch {
      // Soft-fail: URL is already on screen for manual copy.
    }
  }

  function handleReset() {
    setSelectedIds(new Set());
    setRoundCount(8);
    setPack("academic");
    setSubmit({ kind: "idle" });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-focus-ring
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--umber)",
          background: "transparent",
          border: "1px solid var(--umber)",
          padding: "8px 14px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Create Room Read game
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col"
      style={{
        gap: 12,
        padding: "16px 18px",
        background: "var(--paper-warm)",
        border: "1px solid var(--rule)",
        borderRadius: 8,
        maxWidth: 540,
      }}
    >
      <div
        className="flex flex-row items-center justify-between"
        style={{ gap: 12 }}
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
          Create Room Read game
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            handleReset();
          }}
          data-focus-ring
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            background: "transparent",
            color: "var(--ink-mute)",
            border: "1px solid var(--rule)",
            padding: "4px 8px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      <p
        className="font-serif italic"
        style={{
          fontSize: 13,
          color: "var(--ink-soft)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Select 4–10 assessed sessions to play. The engine generates the round
        order; players vote in the room.
      </p>

      <fieldset
        className="flex flex-col"
        style={{
          gap: 6,
          border: "1px solid var(--rule-soft)",
          padding: "10px 12px",
          borderRadius: 6,
          maxHeight: 220,
          overflowY: "auto",
        }}
      >
        <legend
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
            padding: "0 4px",
          }}
        >
          Players ({playerCount} selected)
        </legend>
        {roster.length === 0 ? (
          <p
            className="font-serif italic"
            style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}
          >
            (no assessed sessions found)
          </p>
        ) : (
          roster.map((r) => (
            <label
              key={r.id}
              className="font-serif"
              style={{
                fontSize: 13,
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(r.id)}
                onChange={() => togglePlayer(r.id)}
                disabled={
                  !selectedIds.has(r.id) && selectedIds.size >= 10
                }
              />
              <span>{r.name ?? `Session ${r.id.slice(0, 8)}`}</span>
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                {r.id.slice(0, 8)}
              </span>
            </label>
          ))
        )}
      </fieldset>

      <div className="flex flex-row" style={{ gap: 10, alignItems: "center" }}>
        <label
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
          }}
        >
          Rounds
        </label>
        <select
          value={roundCount}
          onChange={(e) => setRoundCount(Number(e.target.value))}
          data-focus-ring
          className="font-serif"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            padding: "6px 10px",
            borderRadius: 4,
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          {[4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-row" style={{ gap: 10, alignItems: "center" }}>
        <label
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-mute)",
          }}
        >
          Pack
        </label>
        <select
          value={pack}
          onChange={(e) => {
            setPack(e.target.value);
            setSubmit({ kind: "idle" });
          }}
          data-focus-ring
          className="font-serif"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            padding: "6px 10px",
            borderRadius: 4,
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          {PACK_OPTIONS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {!playerCountInRange ? (
        <p
          className="font-mono"
          style={{ fontSize: 11, color: "var(--ink-mute)", margin: 0 }}
        >
          Select 4–10 players to proceed.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        data-focus-ring
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          background: canSubmit ? "var(--umber)" : "var(--ink-faint)",
          color: "var(--paper, #fff)",
          border: "1px solid var(--umber)",
          padding: "10px 16px",
          cursor: canSubmit ? "pointer" : "not-allowed",
          alignSelf: "flex-start",
        }}
      >
        {submit.kind === "submitting" ? "creating…" : "Generate game"}
      </button>

      {submit.kind === "error" ? (
        <p
          className="font-serif italic"
          style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}
        >
          {submit.message}
        </p>
      ) : null}

      {submit.kind === "ready" ? (
        <div
          className="flex flex-col"
          style={{
            gap: 6,
            padding: "10px 12px",
            background: "var(--paper)",
            border: "1px solid var(--umber)",
            borderRadius: 6,
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
            Game created · {submit.rounds} rounds
          </p>
          <p
            className="font-mono"
            style={{
              fontSize: 12,
              color: "var(--ink)",
              margin: 0,
              wordBreak: "break-all",
            }}
          >
            {submit.url}
          </p>
          <button
            type="button"
            onClick={() => handleCopy(submit.url)}
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              background: "transparent",
              color: "var(--umber)",
              border: "1px solid var(--umber)",
              padding: "6px 10px",
              borderRadius: 4,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            {submit.copied ? "copied!" : "copy join link"}
          </button>
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              color: "var(--ink-faint)",
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            session id: {submit.sessionId}
          </p>
          <button
            type="button"
            onClick={handleReset}
            data-focus-ring
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              background: "transparent",
              color: "var(--ink-mute)",
              border: "1px solid var(--rule)",
              padding: "6px 10px",
              borderRadius: 4,
              cursor: "pointer",
              alignSelf: "flex-start",
              marginTop: 4,
            }}
          >
            Create another
          </button>
        </div>
      ) : null}
    </form>
  );
}
