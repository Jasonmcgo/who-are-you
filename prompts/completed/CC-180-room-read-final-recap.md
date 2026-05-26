# CC-180 — Room Read: Final Recap

> Room Read feature. The end-of-game screen (now reachable after the loop-bug fix in
> CC aa5d167) is just the winner headline + a flat scoreboard. The owner asked for "a
> recap summary of the game results" — a per-round summary of what happened.

## Requirement (owner)

On game completion, show a recap: for each round — the card, who the engine picked,
who the room picked, the verdict, and points awarded that round — followed by the
final standings. Today it's only "{winner} reads the room" + totals.

## Root cause (verified)

`FinalScoreboard` in `app/games/room-read/[token]/page.tsx` renders only
`state.scoreboard` (totals) + a winner line. The per-round history isn't surfaced to
the client on the `complete` state. The data exists: `roomReadCalibrationEvents` has
per-round `engine_pick_player_id`, `room_winner_player_id`, `verdict`, and
`room_vote_distribution`; `roomReadScores` has per-round points; the stored
`generated_game` / `roomReadRounds` have card + theme.

## Fix — Part A: recap builder (persistence)

Add a recap builder (e.g. extend `getRoomReadByToken`'s `complete` branch, or a
`getRoomReadRecap(token)` function surfaced by the GET route when
`status === "complete"`) that returns per-round:
```ts
recap: {
  roundNumber: number;
  theme: BodyCardTheme;
  cardPrompt: string;
  enginePick: { displayName: string };
  roomPick: { displayName: string } | { special: "both" | "nobody" } | null;
  verdict: "obvious" | "human_override" | "identity_fog";
  pointsByPlayer: { displayName: string; points: number }[];
}[]
```
Build it from `roomReadCalibrationEvents` + `roomReadScores` + card lookup. Keep it
behind the `complete` status so it only appears at game end.

## Fix — Part B: render the recap (player page)

Replace the bare `FinalScoreboard` with a `RecapScreen`: the winner headline, then a
per-round list (card + theme graphic optional if CC-ROOMREAD-CARD-GRAPHIC has
landed, engine pick vs room pick, verdict kicker, round points), then final
standings. Keep the existing paper/serif register and verdict copy.

## Do NOT

- Do NOT recompute or alter any scores — read the persisted results only.
- Do NOT surface recap data on any non-complete state (it's post-game only).
- Do NOT change the leak guard, generation, or mid-game payloads.
- Do NOT touch the couple module or the assessment engine.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- Completing an N-round game shows N per-round recap entries (card, engine pick, room
  pick, verdict, round points) + final standings; no loop back to Round 1.
- Recap data is absent on active/open/revealed states (only present on `complete`).
- `npx tsc --noEmit` + lint clean; `npm run build` compiles; roomRead tests green.

## Report back

- The recap payload shape; confirmation it's gated to `complete`.
- A walk of a finished game's recap (per-round lines + standings).
- Files touched (persistence + types + GET route + player page); tsc/lint/build.
