# CC-ROOMREAD-ROUND-STATUS

> Room Read fix. The live flow is opaque: players can't tell who has submitted a
> vote, who the round is waiting on, or when the round ends/reveals. Root cause:
> the GET state payload never reports the current round's vote roster, so the UI
> has no data to show it. This CC exposes per-round submission status and renders a
> clear "submitted / waiting on / round resolves when all in" flow.

## Requirement (owner)

During a round, players must see: (1) which players have submitted their vote,
(2) who we're still waiting on, (3) a clear signal of when the round ends / reveal
fires. Right now "the end of the round [is] unknown" and "it was tough to know the
status."

## Root cause (verified)

`lib/games/roomRead/persistence.ts` `getRoomReadByToken` builds `currentRound`
from the round row (roundId, roundNumber, theme, status, card, enginePick-when-
revealed) and a scoreboard — but it **never queries `roomReadGuesses` for the open
round**, so the payload can't say who voted. The CC-177 waiting screen had nothing
real to render a roster from.

## Fix — Part A: expose the roster (persistence + types)

In `getRoomReadByToken`, when `currentRound.status === "open"`, query
`roomReadGuesses` for that `round_id` and add to the `currentRound` payload:
```ts
voteStatus: {
  total: number;                 // players in the game
  submittedCount: number;
  submitted: { playerId: string; displayName: string }[];   // who has voted
  waitingOn: { playerId: string; displayName: string }[];    // who hasn't
  allIn: boolean;                // submittedCount === total
}
```
Do NOT leak WHAT anyone voted (only that they have) — the engine pick and vote
choices stay hidden until reveal (preserve the existing leak guard). Add the type
to `RoomReadStateForToken.currentRound`.

## Fix — Part B: render it + clarify round-end (player page)

In the Room Read player page (`app/game[s]/room-read/[token]/page.tsx`), the
Waiting screen should show:
- a roster: "✓ Submitted: Jason, Michele · Waiting on: Nat, Ashley" (names, not
  just "N of M"),
- the viewer's own state ("Your read is in"),
- a clear line that the round reveals automatically once everyone has voted
  ("Reveal unlocks when all 4 have read"), and the existing poll loop flips to the
  reveal when `allIn` becomes true.
Make the transition legible: when `allIn` flips, surface a brief "All reads in —
revealing…" beat before the reveal screen, so the round-end isn't a silent jump.
If the game is host-advanced rather than auto-reveal, show whose action unlocks it.

## Do NOT

- Do NOT reveal vote choices or the engine pick before reveal — only submission
  presence (voted / not voted).
- Do NOT change scoring, generation, verdict, or the reveal payload shape beyond
  adding `voteStatus` to the open-round state.
- Do NOT touch the couple module or the assessment engine.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- GET on an open round returns `voteStatus` with correct submitted/waitingOn split;
  it does NOT include the engine pick or any vote choice.
- As votes land, `submitted`/`waitingOn` update; when the last player votes,
  `allIn` is true and the round auto-reveals (poll loop).
- Player page Waiting screen names who's in and who's pending, and shows the
  reveal-unlock condition; the round-end is no longer a silent jump.
- Pre-reveal leak guard intact (engine pick absent until revealed).
- `npx tsc --noEmit` + lint clean; `npm run build` compiles; existing roomRead
  tests green.

## Report back

- The `voteStatus` payload shape as built + confirmation no vote choices/engine
  pick leak pre-reveal.
- A walk: 4-player open round → vote 1 by 1 → roster updates → all-in → auto-reveal.
- Files touched (persistence + types + player page only); tsc/lint/build status.
