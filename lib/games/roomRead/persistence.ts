// CC-176 — Room Read persistence layer. Pure server module — no HTTP
// types, no React. The four API route handlers under
// `app/api/admin/games/room-read/` and `app/api/games/room-read/[token]/`
// delegate the heavy lifting to the functions here so each route
// handler stays focused on request/response shapes and validation.
//
// Hard invariant (mirrors `lib/coupleSession.ts` §5): a player's guesses
// live ONLY in the room_read_* tables — NEVER merged into any
// `sessions.answers`. The functions in this module do not import
// `saveSession` or any path that mutates the assessment store.
//
// NOTE: this module is NOT a Next.js Server Actions module (no
// "use server" directive). It exports both async functions AND
// non-async types/constants (e.g. re-exported ROOM_READ_LIMITS) that
// the route handlers import directly. Adding "use server" would
// constrain the module's exports to async-only and trigger a
// "no exports at all" build error.

import { and, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { getDb } from "../../../db";
import {
  demographics as demographicsTable,
  roomReadCalibrationEvents,
  roomReadGuesses,
  roomReadRounds,
  roomReadScores,
  roomReadSessions,
  sessions as sessionsTable,
} from "../../../db/schema";
import { buildInnerConstitution } from "../../identityEngine";
import { ENGINE_SHAPE_VERSION } from "../../staleShape";
import type {
  Answer,
  DemographicAnswer,
  DemographicSet,
  MetaSignal,
} from "../../types";
import { generateRoomReadGame, ROOM_READ_LIMITS } from "./generate";
import { calculateCardScores, getRoomWinner, type RoomGuess } from "./scoring";
import { buildPlayerGameSignals } from "./signals";
import {
  ROOM_WINNER_BOTH_SENTINEL,
  type EnginePick,
  type PlayerGameSignals,
  type RoomReadCard,
  type RoomReadGame,
  type RoomReadMode,
  type RoundScoreBreakdown,
} from "./types";
import { getVerdict } from "./verdict";

// Re-exported so the admin route can return a stable error message
// without re-importing constants from generate.ts.
export { ROOM_READ_LIMITS } from "./generate";

// ─────────────────────────────────────────────────────────────────────
// Token mint — mirrors lib/coupleInviteLink mint pattern (32-char
// base64url, crypto-strong). Stored on `room_read_sessions.join_token`
// and consumed as the URL path segment.
// ─────────────────────────────────────────────────────────────────────

function mintJoinToken(): string {
  return randomBytes(24).toString("base64url");
}

// ─────────────────────────────────────────────────────────────────────
// Per-session → InnerConstitution → PlayerGameSignals
//
// Loads a `sessions` row + its demographics, re-derives the constitution
// from `answers` (mirrors the report-permalink route's re-derive policy
// so stale stored constitutions don't pollute game signals), and
// returns the engine-shape signal vector keyed by the session id.
// ─────────────────────────────────────────────────────────────────────

interface LoadedPlayer {
  sessionId: string;
  displayName: string;
  signals: PlayerGameSignals;
}

async function loadPlayer(
  db: ReturnType<typeof getDb>,
  sessionId: string
): Promise<LoadedPlayer> {
  const sessionRows = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);
  if (sessionRows.length === 0) {
    throw new Error(`Room Read: player session ${sessionId} not found`);
  }
  const row = sessionRows[0];

  // Demographics drive the display name (Q-Demographics "name" field).
  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, sessionId))
    .limit(1);
  const demoRow = demoRows[0];
  const displayName =
    demoRow?.name_state === "specified" && demoRow.name_value
      ? demoRow.name_value
      : `Player ${sessionId.slice(0, 6)}`;

  // Build a fresh constitution from answers (engine-shape current).
  const demographics: DemographicSet | null = demoRow
    ? { answers: demographicsAnswersFromRow(demoRow) }
    : null;
  const answers = (row.answers ?? []) as Answer[];
  const metaSignals = (row.meta_signals ?? []) as MetaSignal[];
  const ic = buildInnerConstitution(answers, metaSignals, demographics);
  const signals = buildPlayerGameSignals(ic, {
    playerId: sessionId,
    displayName,
  });
  return { sessionId, displayName, signals };
}

// Compact converter from the demographics row's (value,state) column
// pairs to the `DemographicAnswer[]` shape `buildInnerConstitution`
// expects. Mirrors the converter in `app/api/follow-up/[token]/route.ts`
// — kept inline here so this module doesn't take on a router-route
// import dependency.
type DemoRow = typeof demographicsTable.$inferSelect;
function demographicsAnswersFromRow(row: DemoRow): DemographicAnswer[] {
  const out: DemographicAnswer[] = [];
  function push(
    field_id: string,
    state: string,
    value: string | null
  ): void {
    if (state === "specified" && value) {
      out.push({ field_id, state: "specified", value });
    } else if (state === "prefer_not_to_say") {
      out.push({ field_id, state: "prefer_not_to_say" });
    } else {
      out.push({ field_id, state: "not_answered" });
    }
  }
  push("name", row.name_state, row.name_value);
  push("gender", row.gender_state, row.gender_value);
  push("age", row.age_state, row.age_decade);
  const locValue =
    row.location_state === "specified"
      ? row.location_region
        ? `${row.location_country ?? ""} | ${row.location_region}`.trim()
        : row.location_country ?? null
      : null;
  push("location", row.location_state, locValue);
  push("marital_status", row.marital_status_state, row.marital_status_value);
  push("education", row.education_state, row.education_value);
  push("political", row.political_state, row.political_value);
  push("religious", row.religious_state, row.religious_value);
  push("profession", row.profession_state, row.profession_value);
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Create — admin gate
// ─────────────────────────────────────────────────────────────────────

export interface CreateRoomReadSessionArgs {
  playerSessionIds: string[];
  roundCount: number;
  mode?: RoomReadMode;
  createdByAdmin?: string;
}

export interface CreatedRoomReadSession {
  sessionId: string;
  joinToken: string;
  rounds: number;
}

export async function createRoomReadSession(
  args: CreateRoomReadSessionArgs
): Promise<CreatedRoomReadSession> {
  const { playerSessionIds, roundCount } = args;
  const mode: RoomReadMode = args.mode ?? "classic";

  // Validation — match `generateRoomReadGame` so error surfaces are
  // consistent across the admin path and the (rarely-used) direct
  // pure-core path.
  if (
    !Array.isArray(playerSessionIds) ||
    playerSessionIds.length < ROOM_READ_LIMITS.MIN_PLAYERS ||
    playerSessionIds.length > ROOM_READ_LIMITS.MAX_PLAYERS
  ) {
    throw new Error(
      `Room Read: player count ${
        Array.isArray(playerSessionIds) ? playerSessionIds.length : 0
      } out of range [${ROOM_READ_LIMITS.MIN_PLAYERS}, ${
        ROOM_READ_LIMITS.MAX_PLAYERS
      }]`
    );
  }
  if (
    roundCount < ROOM_READ_LIMITS.MIN_ROUNDS ||
    roundCount > ROOM_READ_LIMITS.MAX_ROUNDS
  ) {
    throw new Error(
      `Room Read: roundCount ${roundCount} out of range [${ROOM_READ_LIMITS.MIN_ROUNDS}, ${ROOM_READ_LIMITS.MAX_ROUNDS}]`
    );
  }
  if (new Set(playerSessionIds).size !== playerSessionIds.length) {
    throw new Error("Room Read: playerSessionIds contains duplicates");
  }

  const db = getDb();
  const loaded: LoadedPlayer[] = [];
  for (const sid of playerSessionIds) {
    loaded.push(await loadPlayer(db, sid));
  }
  const game = generateRoomReadGame({
    players: loaded.map((p) => p.signals),
    roundCount,
    mode,
  });

  // Persist the session + its rounds inside one transaction so a half-
  // written game never appears on the public token route.
  const joinToken = mintJoinToken();
  const result = await db.transaction(async (tx) => {
    const [sessionRow] = await tx
      .insert(roomReadSessions)
      .values({
        join_token: joinToken,
        created_by_admin: args.createdByAdmin ?? null,
        player_session_ids: playerSessionIds,
        round_count: roundCount,
        mode,
        scoring_mode: "engine_plus_room",
        status: "active",
        engine_shape_version: ENGINE_SHAPE_VERSION,
        generated_game: game as unknown as Record<string, unknown>,
      })
      .returning({ id: roomReadSessions.id });

    // Round-1 starts open; subsequent rounds wait on /next-round to
    // open them. This mirrors the couple flow's single-active-round
    // pattern (one prompt visible at a time).
    for (const round of game.rounds) {
      await tx.insert(roomReadRounds).values({
        session_id: sessionRow.id,
        round_number: round.roundNumber,
        theme: round.theme,
        card_id: round.card.id,
        status: round.roundNumber === 1 ? "open" : "pending",
        engine_pick_player_id: round.enginePick.playerId,
        engine_runner_up_player_id:
          round.enginePick.runnerUp?.playerId ?? null,
        engine_confidence: round.enginePick.confidence,
        engine_is_split: round.enginePick.isSplit,
        engine_matched_tags: round.enginePick
          .matchedTags as unknown as Record<string, unknown>[],
        engine_reason: round.enginePick.reason,
      });
    }
    return sessionRow.id;
  });

  return {
    sessionId: result,
    joinToken,
    rounds: game.rounds.length,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Read — public (token-as-auth)
// ─────────────────────────────────────────────────────────────────────

/**
 * CC-ROOMREAD-ROUND-STATUS — per-round submission status. Surfaces ONLY
 * who has voted (presence), never WHAT they voted. The engine pick + the
 * actual choice strings stay hidden until reveal — see leak-guard
 * comments in `getRoomReadByToken`.
 */
export interface RoomReadVoteStatus {
  /** Players in the game (count of the roster). */
  total: number;
  /** How many of the roster have submitted a vote for this round. */
  submittedCount: number;
  /** Players whose vote is in. Names only — no vote choice exposed. */
  submitted: { playerId: string; displayName: string }[];
  /** Players whose vote isn't in yet. */
  waitingOn: { playerId: string; displayName: string }[];
  /** Convenience: submittedCount === total. The page polls on this. */
  allIn: boolean;
}

/**
 * CC-180 — per-round entry on the final recap payload. Only present
 * on the GET when the session status is `"complete"`. Reads-only:
 * built from persisted `roomReadCalibrationEvents` +
 * `roomReadScores` + the stored round/card lookup. Nothing here is
 * recomputed from raw guesses (the reveal pass already canonicalized
 * the room winner + the verdict; we just play it back).
 */
export interface RoomReadRecapEntry {
  roundNumber: number;
  theme: string;
  cardPrompt: string;
  enginePick: { displayName: string };
  /**
   * `{ displayName }` when the room agreed on a real player; `{ special }`
   * when the room's plurality was the "both" or "nobody" tile; `null`
   * when no plurality formed (Identity Fog).
   */
  roomPick:
    | { displayName: string }
    | { special: "both" | "nobody" }
    | null;
  verdict: ReturnType<typeof getVerdict>;
  /** Points awarded THIS round, per player. Players who scored zero
   *  are included with `points: 0` so the recap row is uniform. */
  pointsByPlayer: { displayName: string; points: number }[];
}

export interface RoomReadStateForToken {
  sessionId: string;
  status: string;
  mode: string;
  players: { playerId: string; displayName: string }[];
  currentRound: {
    roundId: string;
    roundNumber: number;
    theme: string;
    status: string;
    card: { id: string; prompt: string };
    /** Populated ONLY when the round status is "revealed". Pre-reveal
     *  the engine pick is OMITTED — never leaks to the public route. */
    enginePick?: EnginePick;
    revealedAt?: string;
    /**
     * CC-ROOMREAD-ROUND-STATUS — populated ONLY when the round status
     * is "open". Once a round is revealed the waiting roster is no
     * longer meaningful (all reveals show the room's actual votes
     * via the reveal payload), so we omit it.
     */
    voteStatus?: RoomReadVoteStatus;
  } | null;
  scoreboard: { playerId: string; displayName: string; total: number }[];
  /**
   * CC-180 — per-round recap. Present ONLY when `status === "complete"`.
   * Sorted by `roundNumber` ascending. Empty array if no rounds were
   * revealed before completion (shouldn't happen under the regular
   * flow; the field is still present for type narrowing).
   */
  recap?: RoomReadRecapEntry[];
}

/** Look up a Room Read session by `join_token`. Returns null when the
 *  token doesn't match (the route handler turns this into a 404). */
export async function getRoomReadByToken(
  joinToken: string
): Promise<RoomReadStateForToken | null> {
  const db = getDb();
  const sessRows = await db
    .select()
    .from(roomReadSessions)
    .where(eq(roomReadSessions.join_token, joinToken))
    .limit(1);
  if (sessRows.length === 0) return null;
  const sess = sessRows[0];

  // Players — load display names from `sessions` + demographics.
  // Cached on the stored `generated_game.players` (already carries
  // displayName) so we don't hit the DB N times.
  const game = sess.generated_game as unknown as RoomReadGame;
  const players = game.players.map((p) => ({
    playerId: p.playerId,
    displayName: p.displayName,
  }));

  // Current round resolution.
  //   1. A session marked `complete` has NO current round — the client
  //      renders the final recap. Returning a revealed round here is the
  //      bug that made the game appear to "loop back to Round 1": with no
  //      open round, the old fallback grabbed the FIRST revealed round.
  //   2. Otherwise an open round (voting in progress) is the current round.
  //   3. With no open round and the session still active (the beat between
  //      a reveal and the host advancing), show the MOST RECENTLY revealed
  //      round — the highest round_number among revealed rounds — so the
  //      reveal screen reflects the round just played, not the first one.
  const allRounds = await db
    .select()
    .from(roomReadRounds)
    .where(eq(roomReadRounds.session_id, sess.id));
  allRounds.sort((a, b) => a.round_number - b.round_number);
  const revealedRounds = allRounds.filter((r) => r.status === "revealed");
  // allRounds is sorted ascending by round_number, so the last revealed
  // entry is the most recently revealed round.
  const latestRevealedRow =
    revealedRounds.length > 0
      ? revealedRounds[revealedRounds.length - 1]
      : null;
  const currentRoundRow =
    sess.status === "complete"
      ? null
      : allRounds.find((r) => r.status === "open") ?? latestRevealedRow;

  let currentRound: RoomReadStateForToken["currentRound"] = null;
  if (currentRoundRow) {
    const card = game.rounds.find(
      (r) => r.card.id === currentRoundRow.card_id
    )?.card as RoomReadCard | undefined;
    currentRound = {
      roundId: currentRoundRow.id,
      roundNumber: currentRoundRow.round_number,
      theme: currentRoundRow.theme,
      status: currentRoundRow.status,
      card: {
        id: currentRoundRow.card_id,
        prompt: card?.prompt ?? "(card prompt not found)",
      },
    };
    // ENGINE PICK LEAK GUARD — only populate enginePick when the
    // round is "revealed". On open / pending rounds the pre-reveal
    // payload must never include the engine answer.
    if (currentRoundRow.status === "revealed") {
      currentRound.enginePick = engineRowToEnginePick(currentRoundRow, players);
    }
    // CC-ROOMREAD-ROUND-STATUS — voteStatus roster, open-round only.
    // We select ONLY voter_player_id (presence) — the guessed choice
    // and engine pick remain off-payload until reveal. Drizzle's
    // narrowed select makes this guarantee explicit; even if the
    // schema later grew an exploitable field, this code path can't
    // surface it.
    if (currentRoundRow.status === "open") {
      const guessRows = await db
        .select({ voter_player_id: roomReadGuesses.voter_player_id })
        .from(roomReadGuesses)
        .where(eq(roomReadGuesses.round_id, currentRoundRow.id));
      const submittedIds = new Set(guessRows.map((g) => g.voter_player_id));
      const submitted = players.filter((p) => submittedIds.has(p.playerId));
      const waitingOn = players.filter((p) => !submittedIds.has(p.playerId));
      currentRound.voteStatus = {
        total: players.length,
        submittedCount: submitted.length,
        submitted,
        waitingOn,
        allIn:
          players.length > 0 && submitted.length === players.length,
      };
    }
  }

  // Scoreboard — sum points per player across `room_read_scores`.
  const scoreRows = await db
    .select()
    .from(roomReadScores)
    .where(eq(roomReadScores.session_id, sess.id));
  const totalByPlayer = new Map<string, number>();
  for (const s of scoreRows) {
    totalByPlayer.set(
      s.player_id,
      (totalByPlayer.get(s.player_id) ?? 0) + s.points
    );
  }
  const scoreboard = players.map((p) => ({
    playerId: p.playerId,
    displayName: p.displayName,
    total: totalByPlayer.get(p.playerId) ?? 0,
  }));

  // CC-180 — per-round recap, gated to completed sessions only. Reads
  // entirely from persisted state (calibration events + score rows +
  // round/card lookup); no re-computation. Absent on every other
  // session status to keep mid-game payloads unchanged.
  let recap: RoomReadRecapEntry[] | undefined;
  if (sess.status === "complete") {
    recap = await buildRoomReadRecap({
      db,
      sessionId: sess.id,
      allRounds,
      game,
      players,
      scoreRows,
    });
  }

  return {
    sessionId: sess.id,
    status: sess.status,
    mode: sess.mode,
    players,
    currentRound,
    scoreboard,
    recap,
  };
}

// CC-180 — recap builder. Joins:
//   - `room_read_calibration_events` (one row per revealed round) for
//     engine pick, room winner, verdict.
//   - `room_read_scores` (loaded by the caller for the scoreboard
//     totals) for per-round / per-player points.
//   - `roomReadRounds.card_id` + the stored `generated_game` for the
//     card prompt.
//
// All three sources are persisted at reveal time and never re-derived,
// so a player who reloads the recap page weeks later still sees the
// same per-round summary the night of the game produced.
async function buildRoomReadRecap(args: {
  db: ReturnType<typeof getDb>;
  sessionId: string;
  allRounds: typeof roomReadRounds.$inferSelect[];
  game: RoomReadGame;
  players: { playerId: string; displayName: string }[];
  scoreRows: typeof roomReadScores.$inferSelect[];
}): Promise<RoomReadRecapEntry[]> {
  const { db, sessionId, allRounds, game, players, scoreRows } = args;
  const playerById = new Map(players.map((p) => [p.playerId, p.displayName]));
  const cardPromptById = new Map<string, string>();
  for (const r of game.rounds) cardPromptById.set(r.card.id, r.card.prompt);

  // One calibration event per revealed round. Index by round_id so the
  // recap entries align with the round rows.
  const calRows = await db
    .select()
    .from(roomReadCalibrationEvents)
    .where(eq(roomReadCalibrationEvents.session_id, sessionId));
  const calByRoundId = new Map<string, typeof calRows[number]>();
  for (const c of calRows) calByRoundId.set(c.round_id, c);

  // Per-round score rows, indexed by round_id → playerId.
  const scoresByRoundId = new Map<string, Map<string, number>>();
  for (const s of scoreRows) {
    let inner = scoresByRoundId.get(s.round_id);
    if (!inner) {
      inner = new Map();
      scoresByRoundId.set(s.round_id, inner);
    }
    inner.set(s.player_id, s.points);
  }

  const revealedRounds = allRounds
    .filter((r) => r.status === "revealed")
    .sort((a, b) => a.round_number - b.round_number);

  return revealedRounds.map((round) => {
    const cal = calByRoundId.get(round.id);
    const enginePickPlayerId =
      cal?.engine_pick_player_id ?? round.engine_pick_player_id;
    const enginePickName =
      playerById.get(enginePickPlayerId) ?? "Player";

    // Room pick resolution: real player id → name; "__both__" / "__nobody__"
    // → special; null → no plurality (Identity Fog).
    const roomWinnerRaw = cal?.room_winner_player_id ?? null;
    let roomPick: RoomReadRecapEntry["roomPick"];
    if (roomWinnerRaw === null) {
      roomPick = null;
    } else if (roomWinnerRaw === ROOM_WINNER_BOTH_SENTINEL) {
      roomPick = { special: "both" };
    } else if (roomWinnerRaw === "__nobody__") {
      roomPick = { special: "nobody" };
    } else {
      roomPick = {
        displayName: playerById.get(roomWinnerRaw) ?? "Player",
      };
    }

    // Verdict — prefer the canonical stored value; recompute as a
    // belt-and-suspenders fallback if the event row is somehow missing.
    // CC-184 — pass `isSplit` so the fallback path also routes torn
    // engine picks to the "split" verdict.
    const verdict: ReturnType<typeof getVerdict> =
      (cal?.verdict as ReturnType<typeof getVerdict> | undefined) ??
      getVerdict({
        roomWinnerPlayerId: roomWinnerRaw ?? undefined,
        enginePickPlayerId,
        isSplit: round.engine_is_split,
      });

    // Per-player points for THIS round. Players who scored zero are
    // included so the recap line has uniform shape.
    const roundScores = scoresByRoundId.get(round.id) ?? new Map<string, number>();
    const pointsByPlayer = players.map((p) => ({
      displayName: p.displayName,
      points: roundScores.get(p.playerId) ?? 0,
    }));

    return {
      roundNumber: round.round_number,
      theme: round.theme,
      cardPrompt:
        cardPromptById.get(round.card_id) ?? "(card prompt not found)",
      enginePick: { displayName: enginePickName },
      roomPick,
      verdict,
      pointsByPlayer,
    };
  });
}

function engineRowToEnginePick(
  row: typeof roomReadRounds.$inferSelect,
  players: { playerId: string; displayName: string }[]
): EnginePick {
  const playerById = new Map(players.map((p) => [p.playerId, p.displayName]));
  return {
    playerId: row.engine_pick_player_id,
    displayName: playerById.get(row.engine_pick_player_id) ?? "Player",
    score: 0, // not stored — only ordering/identity matters post-reveal
    confidence: row.engine_confidence as EnginePick["confidence"],
    isSplit: row.engine_is_split,
    matchedTags: row.engine_matched_tags as EnginePick["matchedTags"],
    reason: row.engine_reason,
    runnerUp: row.engine_runner_up_player_id
      ? {
          playerId: row.engine_runner_up_player_id,
          displayName:
            playerById.get(row.engine_runner_up_player_id) ?? "Player",
          score: 0,
        }
      : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Guess — upsert per (round_id, voter_player_id)
// ─────────────────────────────────────────────────────────────────────

export interface SubmitGuessArgs {
  joinToken: string;
  roundId: string;
  voterPlayerId: string;
  // CC-184 — a guess is one of: (a) single player, (b) pair (name the
  // two), (c) "nobody" abstain. Exactly one of the three is expected.
  // The route handler validates the shape; this function enforces the
  // exactly-one rule + the per-id "player is in the game" check.
  guessedPlayerId?: string;
  guessedPlayerIds?: readonly [string, string];
  guessedSpecial?: "nobody";
}

export interface GuessAck {
  roundId: string;
  voterPlayerId: string;
  status: "accepted";
}

export async function submitGuess(args: SubmitGuessArgs): Promise<GuessAck> {
  // CC-184 — count which of the three guess shapes is set; reject
  // none and multiple. The "both" special is gone; pair guesses use
  // `guessedPlayerIds` now.
  const supplied =
    (args.guessedPlayerId ? 1 : 0) +
    (args.guessedPlayerIds ? 1 : 0) +
    (args.guessedSpecial ? 1 : 0);
  if (supplied === 0) {
    throw new Error(
      "Room Read: guess requires guessedPlayerId, guessedPlayerIds, or guessedSpecial"
    );
  }
  if (supplied > 1) {
    throw new Error(
      "Room Read: guess accepts exactly one of guessedPlayerId / guessedPlayerIds / guessedSpecial"
    );
  }
  if (args.guessedPlayerIds) {
    if (args.guessedPlayerIds.length !== 2) {
      throw new Error(
        "Room Read: guessedPlayerIds must be a length-2 tuple of player ids"
      );
    }
    if (args.guessedPlayerIds[0] === args.guessedPlayerIds[1]) {
      throw new Error("Room Read: guessedPlayerIds must name two DIFFERENT players");
    }
  }

  const db = getDb();
  const sessRows = await db
    .select()
    .from(roomReadSessions)
    .where(eq(roomReadSessions.join_token, args.joinToken))
    .limit(1);
  if (sessRows.length === 0) throw new Error("Room Read: session not found");
  const sess = sessRows[0];

  const playerIds = sess.player_session_ids as string[];
  if (!playerIds.includes(args.voterPlayerId)) {
    throw new Error("Room Read: voter is not a player in this game");
  }
  if (args.guessedPlayerId && !playerIds.includes(args.guessedPlayerId)) {
    throw new Error("Room Read: guessed player is not in this game");
  }
  if (args.guessedPlayerIds) {
    for (const id of args.guessedPlayerIds) {
      if (!playerIds.includes(id)) {
        throw new Error("Room Read: guessed player is not in this game");
      }
    }
  }

  const roundRows = await db
    .select()
    .from(roomReadRounds)
    .where(
      and(
        eq(roomReadRounds.session_id, sess.id),
        eq(roomReadRounds.id, args.roundId)
      )
    )
    .limit(1);
  if (roundRows.length === 0) throw new Error("Room Read: round not found");
  const round = roundRows[0];
  if (round.status === "revealed") {
    throw new Error("Room Read: round is already revealed");
  }
  if (round.status !== "open") {
    throw new Error("Room Read: round is not open for voting");
  }

  // CC-184 — column layout for the row:
  //   single guess:  guessed_player_id   = id  | guessed_player_id_2 = null
  //   pair guess:    guessed_player_id   = id1 | guessed_player_id_2 = id2
  //   "nobody":      guessed_special     = "nobody" | both id columns null
  const primaryId =
    args.guessedPlayerIds?.[0] ?? args.guessedPlayerId ?? null;
  const secondaryId = args.guessedPlayerIds?.[1] ?? null;
  // Upsert on (round_id, voter_player_id). drizzle's onConflictDoUpdate
  // hits the unique constraint we declared in schema.ts.
  await db
    .insert(roomReadGuesses)
    .values({
      session_id: sess.id,
      round_id: args.roundId,
      voter_player_id: args.voterPlayerId,
      guessed_player_id: primaryId,
      guessed_player_id_2: secondaryId,
      guessed_special: args.guessedSpecial ?? null,
    })
    .onConflictDoUpdate({
      target: [roomReadGuesses.round_id, roomReadGuesses.voter_player_id],
      set: {
        guessed_player_id: primaryId,
        guessed_player_id_2: secondaryId,
        guessed_special: args.guessedSpecial ?? null,
        updated_at: sql`now()`,
      },
    });

  return {
    roundId: args.roundId,
    voterPlayerId: args.voterPlayerId,
    status: "accepted",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Reveal — compute room winner + scores + calibration event
// ─────────────────────────────────────────────────────────────────────

/**
 * CC-178 — per-voter votes for the reveal payload. Names + choices
 * surface only post-reveal; pre-reveal voteStatus exposes presence
 * only (see `RoomReadVoteStatus`).
 */
export type RevealVoteChoice =
  | { kind: "player"; playerId: string; displayName: string }
  | {
      // CC-184 — pair guess. The voter named the two on a split card
      // (or, anti-hedge'd on a normal round; the scorer handles each
      // shape — see calculateCardScores).
      kind: "pair";
      playerIds: readonly [
        { playerId: string; displayName: string },
        { playerId: string; displayName: string }
      ];
    }
  | { kind: "special"; value: "nobody" };

export interface RevealVote {
  voterPlayerId: string;
  voterName: string;
  choice: RevealVoteChoice;
}

export interface RevealedRoundPayload {
  roundId: string;
  roundNumber: number;
  theme: string;
  card: { id: string; prompt: string };
  enginePick: EnginePick;
  roomWinnerPlayerId: string | undefined;
  roomVoteDistribution: Record<string, number>;
  verdict: ReturnType<typeof getVerdict>;
  scores: {
    playerId: string;
    displayName: string;
    points: number;
    breakdown: RoundScoreBreakdown;
  }[];
  /**
   * CC-178 — full per-voter vote list. Built from `roomReadGuesses`
   * (already loaded on the reveal path) and the player roster. Same
   * data on a first-reveal POST and on every subsequent re-fetch of
   * the same round (the route is idempotent — see `revealRound`).
   * NEVER appears on the open-round GET payload (leak guard).
   */
  votes: RevealVote[];
}

export async function revealRound(args: {
  joinToken: string;
  roundId: string;
  // CC-ROOMREAD-CADENCE — server-enforced all-submitted gate. The
  // primary path is auto-reveal-on-all-in: the page polls voteStatus
  // every 2.5s and once `submittedCount === total` fires the reveal.
  // A reveal attempt before all players have voted is REJECTED here
  // unless the caller explicitly passes `force: true` (the
  // abandoned-player escape hatch, surfaced on the client as a
  // clearly-secondary "Reveal now — someone's away" affordance).
  //
  // Owner policy (MVP): `force` is callable by any player in the
  // session. If a future CC restricts it to the session host, that
  // requires host identity on the session — flagged as a follow-up,
  // not blocking this CC.
  force?: boolean;
}): Promise<RevealedRoundPayload> {
  const db = getDb();
  const sessRows = await db
    .select()
    .from(roomReadSessions)
    .where(eq(roomReadSessions.join_token, args.joinToken))
    .limit(1);
  if (sessRows.length === 0) throw new Error("Room Read: session not found");
  const sess = sessRows[0];

  const roundRows = await db
    .select()
    .from(roomReadRounds)
    .where(
      and(
        eq(roomReadRounds.session_id, sess.id),
        eq(roomReadRounds.id, args.roundId)
      )
    )
    .limit(1);
  if (roundRows.length === 0) throw new Error("Room Read: round not found");
  const round = roundRows[0];

  const game = sess.generated_game as unknown as RoomReadGame;
  const playerById = new Map(
    game.players.map((p) => [p.playerId, p.displayName])
  );
  const cardForRound = game.rounds.find(
    (r) => r.card.id === round.card_id
  )?.card;

  // Load every guess on this round and tally the plurality.
  const guessRows = await db
    .select()
    .from(roomReadGuesses)
    .where(eq(roomReadGuesses.round_id, args.roundId));

  // CC-178 — idempotent reveal. When the round is already revealed,
  // skip the all-submitted gate + the persist work and return the
  // FULL recomputed payload (distribution, per-voter votes, scores
  // loaded from `room_read_scores`). This is what every "second
  // client" of a multi-tab game hits: each client polls and POSTs
  // /reveal once the round flips, but only the race winner does the
  // first-reveal work — the rest now get real data on return instead
  // of the empty synthetic payload the old throw-then-409 path forced
  // the client to fabricate.
  if (round.status === "revealed") {
    return buildRevealPayloadForAlreadyRevealedRound({
      db,
      sessionId: sess.id,
      round,
      game,
      playerById,
      cardPrompt: cardForRound?.prompt ?? "(card prompt not found)",
      guessRows,
    });
  }

  // CC-ROOMREAD-CADENCE — all-submitted gate. The guess set is what
  // the voteStatus payload sums (see ~L399); duplicate that check
  // here so the server is the source of truth, not the client. The
  // gate runs AFTER the load (we needed guessRows anyway) but
  // BEFORE the score/persist work, so a rejected reveal never
  // touches `room_read_scores` or the calibration log. `force`
  // bypasses the gate but still goes through the rest of the flow.
  if (!args.force) {
    const submittedIds = new Set(guessRows.map((g) => g.voter_player_id));
    const submittedCount = game.players.filter((p) =>
      submittedIds.has(p.playerId)
    ).length;
    const total = game.players.length;
    if (submittedCount < total) {
      throw new Error(
        `Room Read: reveal blocked — ${submittedCount}/${total} players have submitted; pass force:true to override`
      );
    }
  }
  // CC-184 — map persisted rows into the new RoomGuess shape:
  //   - "nobody"               → { kind: "special", value: "nobody" }
  //   - both ids present       → { kind: "pair", playerIds: [a, b] }
  //   - single id present      → { kind: "player", playerId: a }
  //   - everything else        → ignored (zero-info legacy row, e.g.
  //                              pre-CC-184 blind "both" with no ids).
  const guesses: RoomGuess[] = [];
  for (const g of guessRows) {
    if (g.guessed_special === "nobody") {
      guesses.push({ kind: "special", value: "nobody" });
      continue;
    }
    if (g.guessed_player_id && g.guessed_player_id_2) {
      guesses.push({
        kind: "pair",
        playerIds: [g.guessed_player_id, g.guessed_player_id_2],
      });
      continue;
    }
    if (g.guessed_player_id) {
      guesses.push({ kind: "player", playerId: g.guessed_player_id });
      continue;
    }
    // Legacy blind-"both" row (guessed_special === "both" + no ids) or
    // a truly malformed row — treat as zero info; don't push.
  }
  const roomWinner = getRoomWinner(guesses);

  // Vote distribution for the calibration log + reveal payload —
  // CC-184: counts per PLAYER ID. A pair guess contributes 1 to each
  // named id (matching the room-winner tally). "nobody" abstains go
  // under "__nobody__" so the calibration log can still see them.
  // Legacy blind-"both" rows go under ROOM_WINNER_BOTH_SENTINEL for
  // historical inspection (the live scorer no longer reads it).
  const distribution: Record<string, number> = {};
  const bumpKey = (key: string): void => {
    distribution[key] = (distribution[key] ?? 0) + 1;
  };
  for (const g of guessRows) {
    if (g.guessed_special === "nobody") {
      bumpKey("__nobody__");
      continue;
    }
    if (g.guessed_player_id && g.guessed_player_id_2) {
      bumpKey(g.guessed_player_id);
      bumpKey(g.guessed_player_id_2);
      continue;
    }
    if (g.guessed_player_id) {
      bumpKey(g.guessed_player_id);
      continue;
    }
    if (g.guessed_special === "both") {
      // Legacy zero-info row preserved for historical inspection.
      bumpKey(ROOM_WINNER_BOTH_SENTINEL);
    }
  }

  // Build the EnginePick from the stored round row (no re-derivation).
  const enginePick: EnginePick = {
    playerId: round.engine_pick_player_id,
    displayName: playerById.get(round.engine_pick_player_id) ?? "Player",
    score: 0,
    confidence: round.engine_confidence as EnginePick["confidence"],
    isSplit: round.engine_is_split,
    matchedTags: round.engine_matched_tags as EnginePick["matchedTags"],
    reason: round.engine_reason,
    runnerUp: round.engine_runner_up_player_id
      ? {
          playerId: round.engine_runner_up_player_id,
          displayName:
            playerById.get(round.engine_runner_up_player_id) ?? "Player",
          score: 0,
        }
      : undefined,
  };

  // Score every player who voted. Players who didn't vote get no row
  // — they earn 0 by absence. (This mirrors couple-game scoring: only
  // the voter-of-record per player is scored.)
  const scoreRows: {
    playerId: string;
    displayName: string;
    points: number;
    breakdown: RoundScoreBreakdown;
  }[] = [];
  for (const g of guessRows) {
    // CC-184 — map the persisted row shape into the scorer's input.
    // Same precedence as the RoomGuess builder above: nobody → special;
    // both ids → pair; single id → player; legacy blind "both" → 0
    // (no fields set → calculateCardScores returns 0 by absence).
    const guessedPlayerIds: readonly [string, string] | undefined =
      g.guessed_player_id && g.guessed_player_id_2
        ? [g.guessed_player_id, g.guessed_player_id_2]
        : undefined;
    const guessedPlayerId =
      !guessedPlayerIds && g.guessed_player_id
        ? g.guessed_player_id
        : undefined;
    const breakdown = calculateCardScores({
      voterPlayerId: g.voter_player_id,
      guessedPlayerId,
      guessedPlayerIds,
      guessedSpecial: g.guessed_special === "nobody" ? "nobody" : undefined,
      roomWinnerPlayerId: roomWinner,
      enginePick,
    });
    scoreRows.push({
      playerId: g.voter_player_id,
      displayName: playerById.get(g.voter_player_id) ?? "Player",
      points: breakdown.points,
      breakdown,
    });
  }

  const verdict = getVerdict({
    roomWinnerPlayerId: roomWinner,
    enginePickPlayerId: enginePick.playerId,
    // CC-184 — surface the engine's split state so the verdict mapper
    // can short-circuit to "split" (never "obvious" on a torn round).
    isSplit: enginePick.isSplit,
  });

  // Persist scores + flip round status + write the calibration event
  // — one transaction so a partial reveal can't leave the round
  // half-revealed.
  await db.transaction(async (tx) => {
    if (scoreRows.length > 0) {
      await tx.insert(roomReadScores).values(
        scoreRows.map((s) => ({
          session_id: sess.id,
          round_id: args.roundId,
          player_id: s.playerId,
          points: s.points,
          breakdown: s.breakdown as unknown as Record<string, unknown>,
        }))
      );
    }
    await tx
      .update(roomReadRounds)
      .set({ status: "revealed" })
      .where(eq(roomReadRounds.id, args.roundId));
    await tx.insert(roomReadCalibrationEvents).values({
      session_id: sess.id,
      round_id: args.roundId,
      card_id: round.card_id,
      theme: round.theme,
      engine_pick_player_id: round.engine_pick_player_id,
      engine_confidence: round.engine_confidence,
      engine_is_split: round.engine_is_split,
      engine_matched_tags: round.engine_matched_tags as Record<string, unknown>[],
      room_vote_distribution: distribution,
      room_winner_player_id: roomWinner ?? null,
      verdict,
      subject_self_confirm: null,
      engine_shape_version: sess.engine_shape_version,
    });
    await tx
      .update(roomReadSessions)
      .set({ updated_at: sql`now()` })
      .where(eq(roomReadSessions.id, sess.id));
  });

  // CC-178 — per-voter vote list. Built from guessRows (already in
  // memory) + the player roster. Same shape on the idempotent
  // already-revealed path so the payload reads the same on every fetch.
  const votes = buildRevealVotes(guessRows, playerById);

  return {
    roundId: args.roundId,
    roundNumber: round.round_number,
    theme: round.theme,
    card: {
      id: round.card_id,
      prompt: cardForRound?.prompt ?? "(card prompt not found)",
    },
    enginePick,
    roomWinnerPlayerId: roomWinner,
    roomVoteDistribution: distribution,
    verdict,
    scores: scoreRows,
    votes,
  };
}

// CC-178 — shared per-voter vote builder. Used by both the first-reveal
// path and the idempotent already-revealed path so the payload is
// byte-equal between them. Order is stable on `voter_player_id` so a
// re-fetch never reshuffles the list.
function buildRevealVotes(
  guessRows: typeof roomReadGuesses.$inferSelect[] | Array<{
    voter_player_id: string;
    guessed_player_id: string | null;
    guessed_player_id_2: string | null;
    guessed_special: string | null;
  }>,
  playerById: Map<string, string>
): RevealVote[] {
  const sorted = [...guessRows].sort((a, b) =>
    a.voter_player_id.localeCompare(b.voter_player_id)
  );
  return sorted.map((g) => {
    const voterName = playerById.get(g.voter_player_id) ?? "Player";
    let choice: RevealVoteChoice;
    // CC-184 precedence:
    //   "nobody"           → special
    //   both ids present   → pair (name-the-two)
    //   single id present  → player
    //   pre-CC blind "both" with no ids → fall back to "nobody"
    //                        (zero-info row; legacy "both" is retired)
    if (g.guessed_special === "nobody") {
      choice = { kind: "special", value: "nobody" };
    } else if (g.guessed_player_id && g.guessed_player_id_2) {
      choice = {
        kind: "pair",
        playerIds: [
          {
            playerId: g.guessed_player_id,
            displayName: playerById.get(g.guessed_player_id) ?? "Player",
          },
          {
            playerId: g.guessed_player_id_2,
            displayName: playerById.get(g.guessed_player_id_2) ?? "Player",
          },
        ],
      };
    } else if (g.guessed_player_id) {
      choice = {
        kind: "player",
        playerId: g.guessed_player_id,
        displayName: playerById.get(g.guessed_player_id) ?? "Player",
      };
    } else {
      // Defensive: legacy "both"-special row with no ids, or a truly
      // malformed row. Render as "nobody" (the only option that says
      // "no specific player chosen") rather than dropping the voter.
      choice = { kind: "special", value: "nobody" };
    }
    return {
      voterPlayerId: g.voter_player_id,
      voterName,
      choice,
    };
  });
}

// CC-178 — idempotent reveal builder. Recomputes the FULL reveal
// payload deterministically from stored data for a round whose status
// is already "revealed":
//   - guessRows → roomVoteDistribution + per-voter votes
//   - room_read_scores → per-voter score rows
//   - round row → enginePick (same fields the first-reveal path uses)
//   - room_winner_player_id from the calibration event (the
//     authoritative room-winner the original reveal computed; we don't
//     re-tally to avoid drift if a future schema change shifts how
//     guesses are interpreted)
//
// Returns the same RevealedRoundPayload shape; the route returns it
// with 200 (no more 409 on the already-revealed branch).
async function buildRevealPayloadForAlreadyRevealedRound(input: {
  db: ReturnType<typeof getDb>;
  sessionId: string;
  round: typeof roomReadRounds.$inferSelect;
  game: RoomReadGame;
  playerById: Map<string, string>;
  cardPrompt: string;
  guessRows: typeof roomReadGuesses.$inferSelect[];
}): Promise<RevealedRoundPayload> {
  const { db, sessionId, round, playerById, cardPrompt, guessRows } = input;

  // Distribution recomputed from guess rows (canonical source of truth
  // for the room vote — same code path as the first-reveal branch).
  // CC-184 — per-player tally; pair guesses contribute 1 to each named id.
  const distribution: Record<string, number> = {};
  const bumpKey = (key: string): void => {
    distribution[key] = (distribution[key] ?? 0) + 1;
  };
  for (const g of guessRows) {
    if (g.guessed_special === "nobody") {
      bumpKey("__nobody__");
      continue;
    }
    if (g.guessed_player_id && g.guessed_player_id_2) {
      bumpKey(g.guessed_player_id);
      bumpKey(g.guessed_player_id_2);
      continue;
    }
    if (g.guessed_player_id) {
      bumpKey(g.guessed_player_id);
      continue;
    }
    if (g.guessed_special === "both") {
      bumpKey(ROOM_WINNER_BOTH_SENTINEL);
    }
  }

  // Engine pick rehydrated from the stored round row (no re-derivation;
  // same as the first-reveal branch).
  const enginePick: EnginePick = {
    playerId: round.engine_pick_player_id,
    displayName: playerById.get(round.engine_pick_player_id) ?? "Player",
    score: 0,
    confidence: round.engine_confidence as EnginePick["confidence"],
    isSplit: round.engine_is_split,
    matchedTags: round.engine_matched_tags as EnginePick["matchedTags"],
    reason: round.engine_reason,
    runnerUp: round.engine_runner_up_player_id
      ? {
          playerId: round.engine_runner_up_player_id,
          displayName:
            playerById.get(round.engine_runner_up_player_id) ?? "Player",
          score: 0,
        }
      : undefined,
  };

  // Score rows from `room_read_scores` (persisted at first reveal).
  const storedScores = await db
    .select()
    .from(roomReadScores)
    .where(
      and(
        eq(roomReadScores.session_id, sessionId),
        eq(roomReadScores.round_id, round.id)
      )
    );
  const scores = storedScores.map((s) => ({
    playerId: s.player_id,
    displayName: playerById.get(s.player_id) ?? "Player",
    points: s.points,
    breakdown: s.breakdown as unknown as RoundScoreBreakdown,
  }));

  // Room winner from the calibration event (the authoritative record
  // of what the first-reveal pass computed — never re-tallied here).
  const calRows = await db
    .select()
    .from(roomReadCalibrationEvents)
    .where(
      and(
        eq(roomReadCalibrationEvents.session_id, sessionId),
        eq(roomReadCalibrationEvents.round_id, round.id)
      )
    )
    .limit(1);
  const roomWinner = calRows[0]?.room_winner_player_id ?? undefined;
  const verdict = getVerdict({
    roomWinnerPlayerId: roomWinner ?? undefined,
    enginePickPlayerId: enginePick.playerId,
  });

  const votes = buildRevealVotes(guessRows, playerById);

  return {
    roundId: round.id,
    roundNumber: round.round_number,
    theme: round.theme,
    card: { id: round.card_id, prompt: cardPrompt },
    enginePick,
    roomWinnerPlayerId: roomWinner ?? undefined,
    roomVoteDistribution: distribution,
    verdict,
    scores,
    votes,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Next round — open the next pending round, or mark game complete
// ─────────────────────────────────────────────────────────────────────

export interface NextRoundResult {
  sessionStatus: "active" | "complete";
  openedRoundId?: string;
  openedRoundNumber?: number;
}

// ─────────────────────────────────────────────────────────────────────
// CC-177 — subject self-confirm writer
//
// Updates `room_read_calibration_events.subject_self_confirm` for the
// round whose engine pick == the engine-picked subject. CC-176 left
// this column null; CC-177 makes it real so the flywheel collects the
// strongest single calibration signal (self-confirmation outranks
// peer guessing — see `project_room_read_calibration_flywheel`).
//
// Last-write-wins: a subject can change their answer until the round
// stays revealed; we overwrite the jsonb with the latest payload.
// The caller (the CC-177 route handler) is responsible for verifying
// the requester's identity matches the engine pick — this function
// trusts the caller and only enforces (token, roundId) → event lookup.
// ─────────────────────────────────────────────────────────────────────

export interface SubjectSelfConfirmInput {
  joinToken: string;
  roundId: string;
  /** The engine-picked subject's own session id. Captured for audit;
   *  the route handler verifies this matches the round's
   *  `engine_pick_player_id` before calling this function. */
  subjectPlayerId: string;
  response: "yes" | "no" | "both";
  note?: string;
}

export interface SubjectSelfConfirmRecord {
  subjectPlayerId: string;
  response: "yes" | "no" | "both";
  note?: string;
  confirmedAt: string; // ISO timestamp
}

export async function setSubjectSelfConfirm(
  args: SubjectSelfConfirmInput
): Promise<SubjectSelfConfirmRecord> {
  const db = getDb();
  // Look up the session by token first; the calibration_events row is
  // keyed by (session_id, round_id) — verifying both prevents a leaked
  // round_id from one game being used to write into another.
  const sessRows = await db
    .select()
    .from(roomReadSessions)
    .where(eq(roomReadSessions.join_token, args.joinToken))
    .limit(1);
  if (sessRows.length === 0) {
    throw new Error("Room Read: session not found");
  }
  const sess = sessRows[0];

  const eventRows = await db
    .select()
    .from(roomReadCalibrationEvents)
    .where(
      and(
        eq(roomReadCalibrationEvents.session_id, sess.id),
        eq(roomReadCalibrationEvents.round_id, args.roundId)
      )
    )
    .limit(1);
  if (eventRows.length === 0) {
    throw new Error(
      "Room Read: no calibration event for this round (round must be revealed first)"
    );
  }
  const event = eventRows[0];

  // Verify the subject matches the engine pick. The route handler
  // already checks this via the request-side identity-vs-enginePick
  // comparison, but enforcing it server-side too keeps the data
  // trustworthy if a future client misuses the route.
  if (event.engine_pick_player_id !== args.subjectPlayerId) {
    throw new Error(
      "Room Read: subject_self_confirm can only be written by the engine-picked player"
    );
  }

  const record: SubjectSelfConfirmRecord = {
    subjectPlayerId: args.subjectPlayerId,
    response: args.response,
    note: args.note,
    confirmedAt: new Date().toISOString(),
  };

  await db
    .update(roomReadCalibrationEvents)
    .set({ subject_self_confirm: record as unknown as Record<string, unknown> })
    .where(eq(roomReadCalibrationEvents.id, event.id));

  return record;
}

export async function advanceToNextRound(args: {
  joinToken: string;
}): Promise<NextRoundResult> {
  const db = getDb();
  const sessRows = await db
    .select()
    .from(roomReadSessions)
    .where(eq(roomReadSessions.join_token, args.joinToken))
    .limit(1);
  if (sessRows.length === 0) throw new Error("Room Read: session not found");
  const sess = sessRows[0];

  const allRounds = await db
    .select()
    .from(roomReadRounds)
    .where(eq(roomReadRounds.session_id, sess.id));
  allRounds.sort((a, b) => a.round_number - b.round_number);

  // OPEN-ROUND GUARD. A round that is still `open` means the game is in
  // progress — it must be revealed before the game can advance or end.
  // Completing here was the "8 selected, ended after 7" bug: a second
  // advance call (e.g. a double-click on "Next Body Card", or a stray
  // re-fire) found no `pending` round left and marked the session
  // `complete` WHILE the final round was still open — stranding it
  // unplayed. Treat an open round as the current round and no-op: the
  // client refetches and shows that round's voting screen.
  const openRound = allRounds.find((r) => r.status === "open");
  if (openRound) {
    return {
      sessionStatus: "active",
      openedRoundId: openRound.id,
      openedRoundNumber: openRound.round_number,
    };
  }

  const nextPending = allRounds.find((r) => r.status === "pending");
  if (!nextPending) {
    // No open round AND no pending round → every round is revealed →
    // the game is genuinely complete.
    await db
      .update(roomReadSessions)
      .set({ status: "complete", updated_at: sql`now()` })
      .where(eq(roomReadSessions.id, sess.id));
    return { sessionStatus: "complete" };
  }

  // Confirm the previous round is actually revealed before opening
  // the next — refuses to leapfrog an unrevealed round.
  const prior = allRounds.filter(
    (r) => r.round_number < nextPending.round_number
  );
  if (prior.some((r) => r.status !== "revealed")) {
    throw new Error(
      `Room Read: cannot open round ${nextPending.round_number} — a prior round is not yet revealed`
    );
  }

  await db
    .update(roomReadRounds)
    .set({ status: "open" })
    .where(eq(roomReadRounds.id, nextPending.id));
  await db
    .update(roomReadSessions)
    .set({ status: "active", updated_at: sql`now()` })
    .where(eq(roomReadSessions.id, sess.id));

  return {
    sessionStatus: "active",
    openedRoundId: nextPending.id,
    openedRoundNumber: nextPending.round_number,
  };
}
