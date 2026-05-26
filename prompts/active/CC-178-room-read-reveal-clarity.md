# CC-178 — Room Read: Reveal Clarity

> Room Read fix. The reveal screen is hard to read: it frequently shows
> "(no vote distribution — previously-revealed round)", the verdict says the room
> and engine "agree" without naming WHO, and there's no per-voter breakdown of who
> guessed whom. Root cause: the reveal POST throws on an already-revealed round, so
> any client that didn't win the reveal race falls back to an empty synthetic
> payload. In a multi-tab game that's most clients.

## Requirement (owner)

On reveal, every player (not just the one whose click fired the reveal) must see the
real result: the room's vote distribution, **who voted for whom**, the engine pick
**named in the verdict** ("agree: this is Ashley"), and the per-voter scores. The
"(no vote distribution)" placeholder must not appear during normal play.

## Root cause (verified)

- `lib/games/roomRead/persistence.ts` `revealRound()` **throws** `"round is already
  revealed"` when called on a revealed round. The reveal route returns 409.
- `app/games/room-read/[token]/page.tsx` `loadOrFireReveal()` catches that 409 and
  calls `synthesizeRevealFromState()`, which builds a payload with
  `roomVoteDistribution: {}` and `scores: []` → renders "(no vote distribution —
  previously-revealed round)". In a 4-tab demo, only one tab wins the reveal POST;
  the other three all hit this empty path.
- `verdictCopy()` (page.tsx) does not name the engine pick in the "obvious" /
  agreement variants, so the verdict reads "the room and the engine agree" with no
  subject — the "agree on what?" complaint.
- `RevealedRoundPayload` carries `roomVoteDistribution` (counts) and `scores` (per
  voter) but **no per-voter vote list** (who picked whom). `revealRound()` already
  loads `guessRows` — the data is in hand, just not surfaced.

## Fix — Part A: make reveal idempotent (persistence + route)

`revealRound()` must return the FULL computed payload when the round is already
revealed, instead of throwing — recompute deterministically from stored data
(`roomReadGuesses` for distribution + per-voter votes, `roomReadScores` for points,
the stored round row for the engine pick, `getVerdict` from stored
`roomReadCalibrationEvents.room_winner_player_id`/`engine_pick_player_id`). The
reveal route returns 200 with that payload. First-reveal behavior (compute + persist
scores + write calibration event + flip status) is unchanged; only the
already-revealed branch changes from throw → return-computed.

## Fix — Part B: per-voter votes in the payload + render

Add to `RevealedRoundPayload`:
```ts
votes: {
  voterPlayerId: string;
  voterName: string;
  choice:
    | { kind: "player"; playerId: string; displayName: string }
    | { kind: "special"; value: "both" | "nobody" };
}[]
```
Build it from `guessRows` (already loaded). Render a "Who voted for whom" block in
`RevealScreen` alongside the existing distribution counts.

## Fix — Part C: verdict names the subject

`verdictCopy()` already receives `enginePick`. Thread `enginePick.displayName` into
the agreement/obvious copy, e.g. "The room and the engine agree: this is
{displayName}." Keep the existing tone.

## Fix — Part D: delete the empty synthetic path

Remove `synthesizeRevealFromState()` and the "(no vote distribution — previously-
revealed round)" placeholder. `loadOrFireReveal()` now always renders from the real
payload returned by Part A (whether first reveal or re-view).

## Do NOT

- Do NOT expose vote choices or the engine pick on the OPEN-round GET payload or in
  `voteStatus` — per-voter votes live ONLY in the reveal (post-reveal) payload.
  Preserve the existing pre-reveal leak guard exactly.
- Do NOT change scoring math, generation, the quota, or the open-round vote roster.
- Do NOT touch the couple module or the assessment engine.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- Revealing a round, then re-fetching it (or a second client viewing it), returns
  identical real data — distribution, per-voter votes, scores — never an empty
  placeholder.
- The verdict names the engine pick.
- `RevealScreen` shows who voted for whom.
- Open-round GET still omits all vote choices + the engine pick (leak guard intact;
  existing roomRead tests green).
- `npx tsc --noEmit` + lint clean; `npm run build` compiles.

## Report back

- The `votes` payload shape + confirmation the open-round GET is unchanged (no leak).
- A walk: reveal a round, re-fetch it, confirm real distribution both times (no
  placeholder); a second "client" view shows the same.
- Files touched (persistence + types + reveal route + player page); tsc/lint/build.
