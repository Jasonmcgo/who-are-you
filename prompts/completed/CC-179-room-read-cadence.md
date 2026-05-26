# CC-179 — Room Read: Cadence

> Room Read fix + hardening. Reveal cadence is loose: the manual "Reveal the Room
> Read" button lets any player flash a reveal before everyone has voted, and the
> "Next Body Card" button can double-fire. (The double-fire already has a server-side
> guard from CC aa5d167's sibling fix — this CC closes the loop client-side and
> enforces the reveal gate on the server too.)

## Requirement (owner)

A round should reveal only when all players have read (submitted), per round — "per
round summary/scoring only when all players have submitted." Provide a clear per-
round cadence and a safe escape hatch for an abandoned player.

## Root cause (verified)

- `app/games/room-read/[token]/page.tsx` renders an always-visible "Reveal the Room
  Read" button that calls `loadOrFireReveal` regardless of `voteStatus.allIn`, so a
  player can reveal early.
- `revealRound()` in `lib/games/roomRead/persistence.ts` does not check that all
  players have voted — it reveals on demand. The all-submitted gate is currently
  client-only (the auto-reveal effect), so it's bypassable.
- `handleNextRound()` does not disable the button or guard against re-entry; a
  double-click fires advance twice. (Server now no-ops the second call via the
  open-round guard, but the button should still not double-submit.)

## Fix — Part A: server-enforce the reveal gate

`revealRound()` rejects a reveal unless `submittedCount === total` for the round,
UNLESS an explicit `force: true` is passed (the abandoned-player escape hatch). The
reveal route accepts an optional `force` flag. Auto-reveal-on-all-in stays the
primary path and needs no force.

## Fix — Part B: client cadence

- Hide the manual "Reveal the Room Read" button until `voteStatus.allIn` is true;
  auto-reveal remains the main path.
- Keep a clearly-secondary "Reveal now — someone's away" affordance that sends
  `force: true`, so a stuck game can still proceed.
- Disable the "Next Body Card" button while an advance is in flight (re-entry guard),
  and tighten the round-to-round beat: the "All reads in — revealing…" bridge →
  reveal → next round intro should read as a deliberate cadence, not a jump.

## Owner decision (confirm before building)

Default policy: server-gated all-submitted + a `force` escape hatch usable by anyone
(MVP) — the owner leans this way. If the owner wants `force` restricted to the
session creator/host, that requires host identity on the session; flag it and we'll
scope a follow-up rather than block this CC.

## Do NOT

- Do NOT change scoring, generation, the quota, or the leak guard.
- Do NOT auto-reveal a round that isn't all-in (except via explicit `force`).
- Do NOT touch the couple module or the assessment engine.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- A reveal attempt before all players have voted is rejected server-side unless
  `force: true`; auto-reveal still fires on all-in.
- The manual reveal button is hidden until all-in; the force affordance is present
  and clearly secondary.
- "Next Body Card" can't double-submit from the client.
- `npx tsc --noEmit` + lint clean; `npm run build` compiles; roomRead tests green.

## Report back

- Server gate behavior (reject vs force) + the client gating change.
- A walk: open round, reveal blocked until all-in; force path works; double-click
  Next is a no-op.
- Files touched (persistence + reveal route + player page); tsc/lint/build status.
