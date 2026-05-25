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
  } | null;
  scoreboard: { playerId: string; displayName: string; total: number }[];
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

  // Current round — first row whose status is "open" (or the last
  // "revealed" round when the session is `complete`).
  const allRounds = await db
    .select()
    .from(roomReadRounds)
    .where(eq(roomReadRounds.session_id, sess.id));
  allRounds.sort((a, b) => a.round_number - b.round_number);
  const currentRoundRow =
    allRounds.find((r) => r.status === "open") ??
    allRounds.find((r) => r.status === "revealed") ??
    null;

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

  return {
    sessionId: sess.id,
    status: sess.status,
    mode: sess.mode,
    players,
    currentRound,
    scoreboard,
  };
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
  guessedPlayerId?: string;
  guessedSpecial?: "both" | "nobody";
}

export interface GuessAck {
  roundId: string;
  voterPlayerId: string;
  status: "accepted";
}

export async function submitGuess(args: SubmitGuessArgs): Promise<GuessAck> {
  if (!args.guessedPlayerId && !args.guessedSpecial) {
    throw new Error("Room Read: guess requires guessedPlayerId or guessedSpecial");
  }
  if (args.guessedPlayerId && args.guessedSpecial) {
    throw new Error(
      "Room Read: guess accepts exactly one of guessedPlayerId / guessedSpecial"
    );
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

  // Upsert on (round_id, voter_player_id). drizzle's onConflictDoUpdate
  // hits the unique constraint we declared in schema.ts.
  await db
    .insert(roomReadGuesses)
    .values({
      session_id: sess.id,
      round_id: args.roundId,
      voter_player_id: args.voterPlayerId,
      guessed_player_id: args.guessedPlayerId ?? null,
      guessed_special: args.guessedSpecial ?? null,
    })
    .onConflictDoUpdate({
      target: [roomReadGuesses.round_id, roomReadGuesses.voter_player_id],
      set: {
        guessed_player_id: args.guessedPlayerId ?? null,
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
}

export async function revealRound(args: {
  joinToken: string;
  roundId: string;
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
  if (round.status === "revealed") {
    throw new Error("Room Read: round is already revealed");
  }

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
  const guesses: RoomGuess[] = guessRows.map((g) =>
    g.guessed_special === "both" || g.guessed_special === "nobody"
      ? { kind: "special" as const, value: g.guessed_special }
      : { kind: "player" as const, playerId: g.guessed_player_id ?? "" }
  );
  const roomWinner = getRoomWinner(guesses);

  // Vote distribution for the calibration log — counts per key.
  // "both" → "__both__", "nobody" → "__nobody__"; player ids stay raw.
  const distribution: Record<string, number> = {};
  for (const g of guessRows) {
    let key: string;
    if (g.guessed_special === "both") {
      key = ROOM_WINNER_BOTH_SENTINEL;
    } else if (g.guessed_special === "nobody") {
      key = "__nobody__";
    } else {
      key = g.guessed_player_id ?? "__unknown__";
    }
    distribution[key] = (distribution[key] ?? 0) + 1;
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
    const breakdown = calculateCardScores({
      voterPlayerId: g.voter_player_id,
      guessedPlayerId: g.guessed_player_id ?? undefined,
      guessedSpecial:
        g.guessed_special === "both" || g.guessed_special === "nobody"
          ? g.guessed_special
          : undefined,
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

  const nextPending = allRounds.find((r) => r.status === "pending");
  if (!nextPending) {
    // All revealed → mark game complete.
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
