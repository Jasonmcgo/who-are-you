# CC-176-ROOM-READ-PERSISTENCE-AND-API

> Cowork-chat CC, 2026-05-25. Second of the Room Read chain. Adds PERSISTENCE
> (Drizzle tables + migration) and the API ROUTES that drive a game, plus the
> calibration-event log that makes the game an engine-tuning flywheel. Consumes
> the pure core from CC-175 / CC-175.1; builds NO UI/React (that is CC-177).

## Dependencies — run AFTER CC-175 and CC-175.1

- CC-175 built `lib/games/roomRead/{types,rounds,cards,signals,engine,generate,
  scoring,verdict}.ts` (done, verified). Consume them; do not modify them.
- CC-175.1 adds `EnginePick.isSplit`, `RoundGuessInputs.guessedSpecial`
  ("both"|"nobody"), the split-vote +3 path, and selection tuning. CC-176 must
  PERSIST `guessedSpecial` and `engine.isSplit` and call the 175.1 versions of
  `calculateCardScores` / `getVerdict`. If 175.1 hasn't merged when you start,
  stop and confirm — the guess/score shapes depend on it.

## Conventions to mirror (verified in repo)

- DB: Postgres + Drizzle, schema in `db/schema.ts`, migrations via
  `npm run db:generate` → `db/migrations/`. `getDb()` from `db`. Use
  `uuid("id").primaryKey().defaultRandom()`, `text(...).notNull().unique()` for
  tokens, `jsonb(...)` for evolving shapes, `timestamp(..., {withTimezone:true})
  .notNull().defaultNow()`, and `.references(() => sessions.id, {onDelete:
  "cascade"})`. Model on the `coupleSessions` table (CC-COUPLE-1) and the
  `/api/couple/[token]` route (token-as-auth: public route, the unguessable
  token is the credential; admin-only actions gated like `/api/admin/**`).
- Players are assessed `sessions` rows; build engine input with
  `buildInnerConstitution(answers, metaSignals, demographics)` then
  `buildPlayerGameSignals(ic, {playerId, displayName})` (per CC-175).
- HARD INVARIANT (mirror couple §5): a player's guesses live ONLY in the Room
  Read tables — NEVER merged into any `sessions.answers`.

## Part 1 — Schema (`db/schema.ts`) + migration

Add these tables (names/columns indicative — match repo casing):

`room_read_sessions`
- `id` uuid pk; `join_token` text notNull unique; `created_by_admin` (mirror how
  couple/admin identifies the creator); `player_session_ids` jsonb (array of
  `sessions.id`, 4–10); `round_count` int (4–10); `mode` text default "classic";
  `scoring_mode` text default "engine_plus_room"; `status` text default "draft"
  (draft|active|complete); `engine_shape_version` int (capture
  `ENGINE_SHAPE_VERSION` from `lib/staleShape.ts` at generation time — so a game
  built on a stale engine is distinguishable; calibration validity depends on
  this); `generated_game` jsonb (the `RoomReadGame` artifact from `generateRoom
  ReadGame`, stored so reveals are deterministic and never re-derive); timestamps.
- Players are sessions; do NOT FK an array. Validate membership in code.

`room_read_rounds`
- `id` uuid pk; `session_id` → room_read_sessions cascade; `round_number` int;
  `theme` text; `card_id` text; `status` text default "pending"
  (pending|open|revealed); engine pick stored at generation:
  `engine_pick_player_id` text, `engine_runner_up_player_id` text,
  `engine_confidence` text, `engine_is_split` boolean, `engine_matched_tags`
  jsonb, `engine_reason` text; `created_at`.

`room_read_guesses`
- `id` uuid pk; `session_id`; `round_id` → cascade; `voter_player_id` text
  (a `sessions.id` in the game); `guessed_player_id` text nullable;
  `guessed_special` text nullable ("both"|"nobody"); `created_at`.
- UNIQUE(`round_id`, `voter_player_id`) — one vote per voter per round; overwrite
  (upsert) until the round is revealed, then lock.

`room_read_scores`
- `id`; `session_id`; `round_id`; `player_id` text; `points` int;
  `breakdown` jsonb (the `RoundScoreBreakdown`); `created_at`.

`room_read_calibration_events` — THE flywheel table (see canon below)
- `id`; `session_id`; `round_id`; `card_id` text; `theme` text;
  `engine_pick_player_id` text; `engine_confidence` text; `engine_is_split`
  boolean; `engine_matched_tags` jsonb; `room_vote_distribution` jsonb
  (`{playerIdOrSpecial: count}`); `room_winner_player_id` text nullable;
  `verdict` text; `subject_self_confirm` jsonb nullable (the engine-picked
  subject's own confirm/deny on reveal — populated when CC-177's "plead your
  case" step exists; nullable now); `engine_shape_version` int; `created_at`.
- Index so the table is aggregatable BOTH by `card_id` (surface bad CARDS) AND by
  `engine_pick_player_id` + matched tags (surface scorer issues). These are
  distinct calibration outcomes — see canon.

Run `npm run db:generate` and commit the migration SQL into `db/migrations/`.

## Part 2 — API routes (Next.js, mirror `/api/couple` style)

- `POST /api/games/room-read/sessions` (admin-gated): validate 4–10
  `playerSessionIds` and 4–10 `roundCount` (throw the brief's exact messages);
  load each player session → IC → `buildPlayerGameSignals`; call
  `generateRoomReadGame`; persist `room_read_sessions` (status "active") +
  `room_read_rounds` (engine pick per round, status "open" for round 1);
  return `{ sessionId, joinToken, joinUrl }`.
- `GET /api/games/room-read/[token]` (public, token-as-auth): return players
  (id + displayName only), the CURRENT round (theme + label title/subtitle from
  `BODY_CARD_LABELS` + card prompt + status), and the scoreboard. **Never include
  the engine pick for a round whose status !== "revealed".**
- `POST /api/games/room-read/[token]/rounds/[roundId]/guess`: validate voter ∈
  game, guessed player ∈ game (when not special); upsert one vote per
  (round, voter); reject after reveal.
- `POST /api/games/room-read/[token]/rounds/[roundId]/reveal`: auto-fire when all
  players have voted (or admin-triggered); compute `getRoomWinner`,
  `calculateCardScores` (175.1 incl. split path), `getVerdict`; persist
  `room_read_scores`; set round status "revealed"; **WRITE one
  `room_read_calibration_events` row** (all fields above). Return the reveal
  payload (room vote distribution, engine pick + reason, verdict, per-round +
  total scores).
- `POST /api/games/room-read/[token]/next-round`: open the next round; mark the
  session "complete" after the final round.

## Calibration canon (bake into the reveal write — do NOT skip)

Per `project_room_read_calibration_flywheel`: every revealed round logs a
structured event. This module only WRITES the events — it must NOT auto-tune any
scorer, card weight, or engine value from them (analysis/aggregation is a later
CC, decided by mechanism + canon, not vote volume). Capture enough to later
attribute disagreement to its THREE buckets — bad CARD (aggregate by `card_id`
across games), engine miscalibration (aggregate by `engine_pick_player_id` +
matched tags), or genuine deeper-read — and weight `subject_self_confirm` above
peer votes when it exists.

## Do NOT

- Do NOT build any UI/React, game-join screen, or reveal screen — CC-177.
- Do NOT modify `lib/games/roomRead/*` (consume it), the assessment engine, or
  any couple/report code.
- Do NOT merge guesses into `sessions.answers` (hard invariant).
- Do NOT auto-tune / write back to the engine from calibration data — LOG only.
- Do NOT commit or push (except the generated migration SQL must be staged for
  Jason to review; mention it). Sandbox: prepend `rm -f .git/index.lock` to any
  commit command handed to Jason.

## Acceptance

- `npm run db:generate` produces a clean migration; schema compiles.
- Create→generate→persist round-trips: an 8-round game over the 6-player demo
  cohort persists 1 session + 8 rounds with stored engine picks; `generated_game`
  jsonb round-trips to the same `RoomReadGame`.
- Guess upsert: a voter changing their vote pre-reveal updates the row (no dup);
  voting after reveal is rejected; UNIQUE(round_id, voter_player_id) holds.
- Reveal: scores match `calculateCardScores` (incl. a split-card +3 case), verdict
  matches `getVerdict`, round → "revealed", and exactly one
  `room_read_calibration_events` row is written with a non-empty
  `room_vote_distribution` and the engine fields populated.
- Pre-reveal `GET` never leaks the engine pick.
- A sample SQL/ORM query aggregating `room_read_calibration_events` BY `card_id`
  AND BY `engine_pick_player_id` both return rows (proves the flywheel is
  queryable both ways).
- `npx tsc --noEmit` clean; `npx eslint` clean on new files.

## Report back

- The migration filename + the 5 tables created; confirmation no `lib/games/
  roomRead/*` or engine file was modified.
- The create→reveal round-trip output for the demo cohort (session id, the 8
  stored engine picks, one revealed round's calibration-event row).
- The two aggregation queries (by card_id, by engine_pick_player_id) + sample output.
- tsc/lint/db:generate status; any place the 175.1 contract was unclear.
