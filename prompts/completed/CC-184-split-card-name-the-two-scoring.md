# CC-184 — Cross-card scoring: name the two, score per hit

> Room Read scoring fix + UI fix. On a **split (cross) card** the engine is torn between
> two players. Today the only way to score is the blind **"Both"** tile (+3) — and it's
> blind: the player can't say *who* the two are, and a correct single-player guess scores
> 0. That's wrong. New design: you can name **one** of the two (+1) or **both** (name the
> two specific players → +2 + a +1 bonus = 3), plus the existing room-match (+2). Max on a
> split = 5, same ceiling as a normal round. Also: a split must stop rendering the
> "Obvious" verdict.
>
> Context: now that the library has per-person cards, the engine usually has ONE clear
> pick, so cross-cards are the minority case — but when one fires, this is how it scores.

## Requirement (owner)

On a split card (engine pick `isSplit === true`, with two targets = `enginePick.playerId`
+ `enginePick.runnerUp.playerId`):

- **Name one of the two correctly → +1.**
- **Name both correctly → +2, plus a +1 bonus (3 total).**
- **Keep the room-match: +2** if your guess matches the room's plurality (as in normal rounds).
- The **"Both / Multiple" tile must let you pick the two specific players** — no blind "both."
- A single-player guess is still allowed (and earns +1 if it's one of the two targets).

Normal (single-pick) rounds are UNCHANGED.

## Root cause (verified — file:line)

- `lib/games/roomRead/scoring.ts` `calculateCardScores` split branch (lines 40-57): only
  `guessedSpecial === "both"` scores (+3 / +2 room-if-both); a player-id guess scores 0.
  No "named two" concept exists.
- The guess model is single-or-blind-special: `room_read_guesses.guessed_player_id` (one) +
  `guessed_special` ("both"|"nobody"). A "both" vote stores **no player ids** — that's the
  "you don't know who the both is" bug. See `db/schema.ts` `roomReadGuesses` and
  `submitGuess` in `lib/games/roomRead/persistence.ts`.
- `getRoomWinner` (scoring.ts 119-153) tallies the `ROOM_WINNER_BOTH_SENTINEL` as its own
  bucket rather than counting the two named players.
- Verdict: `getVerdict` (verdict.ts) compares only room-winner vs engine pick — it ignores
  `isSplit`, so a split whose room plurality lands on the engine's top pick renders
  "Obvious" (see CC-178 `verdictCopy`).

## Fix — Part A: guess data model (name the two)

A guess becomes one of: (a) **single** player id; (b) **pair** — two player ids; (c)
**"nobody"** (abstain, unchanged). Replace the blind `"both"` special with a real pair:
add a nullable `guessed_player_id_2` column to `room_read_guesses` (new migration), or store
a `guessed_player_ids jsonb` — implementer's choice; document it. `submitGuess` accepts the
pair (validate both ids are players in the game, and the two differ). Keep `"nobody"`.
Legacy rows with the old blind `guessed_special="both"` (no ids): treat as a zero-info guess
(score 0) — don't attempt to back-fill.

## Fix — Part B: scoring (`scoring.ts`)

Targets on a split = `{T1 = enginePick.playerId, T2 = enginePick.runnerUp.playerId}`.

- **Engine points** = number of the voter's named players that are in `{T1, T2}`, plus a
  `+1` bonus iff **both** were named correctly:
  - 0 correct → 0
  - 1 correct → **+1**
  - 2 correct → **+2 + 1 bonus = 3**
- **Room points** = **+2** if any of the voter's named players equals the room's plurality
  winner (the top-voted player — see Part C). Keep this, consistent with normal rounds.
- Split max = 3 + 2 = **5**.
- **Anti-hedge guard:** a **pair** guess on a **normal** (single-pick) round earns **no
  engine match** (you didn't commit to the one answer) — score it 0 on engine, room-match
  may still apply. Recommend confirming, but default to this to preserve the commit
  incentive. Normal single-pick scoring is otherwise untouched (+2 engine / +2 room / +1
  perfect).

## Fix — Part C: room winner counts named players (`getRoomWinner`)

Retire the `ROOM_WINNER_BOTH_SENTINEL` bucket. Tally room votes by **player**: a single
guess = 1 vote for that player; a pair guess = 1 vote for *each* named player; "nobody" is
ignored (abstain). Room winner = the top-voted player; tie → `undefined` (Identity Fog).
Update the reveal `roomVoteDistribution` to the per-player tally.

## Fix — Part D: vote UI (`app/games/room-read/[token]/page.tsx`)

The "Both / Multiple" tile, when tapped, enters a **pick-two** mode: the player selects
exactly two of the player tiles, then submits the pair. Single-pick and "Nobody" remain.
Submit sends the pair (two ids) per the new API. The reveal's "Who voted for whom" + the
distribution render the named players (no blind "both"). Preserve the pre-reveal leak guard
(no engine pick / no vote choices leak on the open-round GET).

## Fix — Part E: split-aware verdict

When `isSplit`, the verdict must NOT say "Obvious." Make `getVerdict` / `verdictCopy`
split-aware: name the two targets and tell players the scoring play was to name both, e.g.
*"Split read — the engine was torn between {A} and {B}. Naming both was the play."* Keep the
normal-round verdicts (obvious / human_override / identity_fog) unchanged.

## Do NOT

- Do NOT change normal (single-pick) round scoring beyond the anti-hedge pair guard.
- Do NOT leak the engine pick or any vote choice on the pre-reveal GET (leak guard intact).
- Do NOT break existing completed games — they read cards/picks from their stored snapshot;
  the migration must be additive (nullable column) so old rows still load.
- Do NOT touch the couple module or the assessment engine.
- Do NOT commit or push (sandbox: prepend `rm -f .git/index.lock`).

## Acceptance

- On a split: naming one target = +1; naming both (via the pick-two flow) = +2 + 1 bonus
  = 3; +2 room-match preserved; split max = 5. New unit tests pin each (one-correct,
  both-correct, room-match, pair-on-normal-round = no engine credit).
- The "Both" tile requires selecting two players; submit stores both ids; reveal shows them.
- A split round renders a split-aware verdict, never "Obvious."
- Pre-reveal leak guard intact; existing roomRead tests updated (the old split tests that
  asserted blind-"both"=+3 must be rewritten to the new model) and green.
- Migration is additive; existing games still load. `tsc` + lint + build clean.

## Report back

- The new guess model + migration; the scoring table (0/1/2 correct + room-match) with the
  unit tests that pin it; the pick-two UI; the split-aware verdict copy; leak-guard
  confirmation; tsc/lint/build status.
