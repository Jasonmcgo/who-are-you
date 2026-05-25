// CC-175 — Room Read game core types. Pure data shapes; no engine
// imports. Persistence shapes (DB schema, API contract, React state)
// live in CC-176 / CC-177 — this module is the deterministic core they
// consume.

/** The 8 Body Card themes that drive round selection. */
export type BodyCardTheme =
  | "lens"
  | "compass"
  | "hands"
  | "voice"
  | "gravity"
  | "trust"
  | "fire"
  | "path";

/** Game modes — currently a single starter mode. The shape is
 * future-proofed so CC-176 can extend without re-typing existing data. */
export type RoomReadMode = "classic";

/** A signal tag the card library can reference. Free-form string so
 * the card author and the signal builder can negotiate the tag space
 * without a central registry; `signals.ts` is the source-of-truth for
 * which tags actually have a non-zero builder. The
 * `assert-no-tag-uniformly-zero` test in `tests/games/roomRead/` is
 * the runtime guard against typos. */
export type TagId = string;

/** A single card in the library. */
export type RoomReadCard = {
  /** Stable id; used for de-dup in `generate.ts`. */
  id: string;
  /** Which Body Card theme this card belongs to — drives round
   *  filtering. */
  theme: BodyCardTheme;
  /** Modes this card is eligible for. Empty / missing = unavailable. */
  modes: RoomReadMode[];
  /** The prompt copy the room sees. Wit is the product voice — kept
   *  verbatim from the card-library brief. */
  prompt: string;
  /** Tag weights summed for engine scoring. Weights are author-set; a
   *  card with a single 1.0 tag will rank players cleanly on that one
   *  signal; multi-tag cards average a register. */
  tags: { tag: TagId; weight: number }[];
  /** Optional confidence nudge — `generate.ts` adds this to the engine
   *  pick's score when ranking candidate cards for a round. Range -1..1
   *  per author intent; defaults to 0. */
  confidenceBoost?: number;
};

/** The signal vector produced by `buildPlayerGameSignals` for a single
 *  player. Every value is clamped to 0..1. Missing tags are absent
 *  rather than 0 so the scorer can distinguish "not measured" (absent)
 *  from "measured low" (present, = 0). */
export type PlayerGameSignals = {
  playerId: string;
  displayName: string;
  signals: Record<TagId, number>;
};

/** The engine's pick for a single card, returned by `getEnginePick`. */
export type EnginePick = {
  playerId: string;
  displayName: string;
  /** Score = Σ weight × player.signals[tag]. */
  score: number;
  /** Gap-based: high ≥ 0.12, medium ≥ 0.06, else low. */
  confidence: "high" | "medium" | "low";
  /** CC-175.1 — true when the top two players are within `SPLIT_EPS`
   *  (engine is genuinely torn — "both, for different reasons").
   *  Distinct from `confidence`: a near-tie at the TOP, not just a
   *  small overall spread. The scoring layer pays +3 to a player who
   *  votes the special "both" tile on a split card. */
  isSplit: boolean;
  /** The top-3 tags that contributed most to this player's score on
   *  this card — `weight × signalValue`. Tags absent on the player
   *  contribute 0 and are omitted. */
  matchedTags: { tag: TagId; contribution: number }[];
  /** Plain-English reason — concatenates `displayName` + the top
   *  matched tag(s) for the UI. */
  reason: string;
  /** Runner-up player + score, used for the gap calculation that drives
   *  `confidence` and `isSplit`. Undefined when the room only has one
   *  player (shouldn't happen under the 4-player floor, but guarded). */
  runnerUp?: { playerId: string; displayName: string; score: number };
};

/** A single generated round — one card + the pre-computed engine pick. */
export type RoomReadRound = {
  roundNumber: number; // 1-indexed
  theme: BodyCardTheme;
  card: RoomReadCard;
  enginePick: EnginePick;
};

/** The generated game artifact returned by `generateRoomReadGame`. */
export type RoomReadGame = {
  mode: RoomReadMode;
  players: PlayerGameSignals[];
  rounds: RoomReadRound[];
};

/** Sentinel returned by `getRoomWinner` when the room's plurality is
 *  the special "both" tile (i.e. a majority of voters picked the
 *  split-tile option). Distinct from a real `playerId` so the scorer
 *  can match a `guessedSpecial="both"` vote against the room outcome
 *  without colliding with any real player id. */
export const ROOM_WINNER_BOTH_SENTINEL = "__both__";

/** Per-card scoring inputs (one player's guess + the room's vote). */
export type RoundGuessInputs = {
  /** The voter / scorer in the room. */
  voterPlayerId: string;
  /** Who the voter said best fits this card. Present for a normal
   *  player vote; absent when the voter picked a special tile. */
  guessedPlayerId?: string;
  /** CC-175.1 — special-tile vote. Present (instead of
   *  `guessedPlayerId`) when the voter picked "both" or "nobody". The
   *  scorer treats:
   *    - "both" on a split card  → +3 (`splitRead = true`)
   *    - "both" on a non-split card → 0 (engine had a clear pick)
   *    - "nobody" in both cases → 0 (no engine signal it maps to in MVP) */
  guessedSpecial?: "both" | "nobody";
  /** The room's plurality winner for this card. May be:
   *    - a real player id (a player won the plurality),
   *    - `ROOM_WINNER_BOTH_SENTINEL` (the "both" tile won),
   *    - `undefined` when the vote was tied / empty (Identity Fog). */
  roomWinnerPlayerId: string | undefined;
  /** The engine's pick for this card — the full `EnginePick` so the
   *  scorer can read `isSplit` (a split round disables engine-match
   *  scoring and enables the +3 split-read path). */
  enginePick: EnginePick;
};

/** Per-card scoring outcome. */
export type RoundScoreBreakdown = {
  matchedEngine: boolean;
  matchedRoom: boolean;
  perfectRead: boolean;
  /** CC-175.1 — true when the voter played `guessedSpecial="both"` on
   *  a split card (`enginePick.isSplit === true`). Contributes +3 to
   *  `points`. */
  splitRead: boolean;
  /** Total points: 0..5 for normal rounds (+2 engine match, +2 room
   *  match, +1 perfect-read), 0..5 for split rounds (+3 splitRead, +2
   *  room match if room also pluralities "both" — perfect-read does
   *  not stack on split because engine-match doesn't apply). */
  points: number;
};

/** The three computable round verdicts the UI surfaces. The actual
 *  copy variants ("Engine Dissent" etc.) belong to CC-177 — core just
 *  emits the categorical outcome. */
export type RoundVerdict =
  | "obvious" // room == engine
  | "human_override" // room != engine, room has consensus
  | "identity_fog"; // room had no consensus
