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
  // CC-ROOMREAD-EVEN-DISTRIBUTION — diagnostic record of rounds where
  // the even-distribution quota had to fall back because no candidate
  // card in the round's theme could target an under-served player
  // (every available card pointed at someone already at the cap).
  // Empty when the card library has enough per-theme variety to keep
  // distribution clean — which is the expected steady state. A
  // non-empty list signals a card-library variety gap to investigate.
  fallbackEvents?: ReadonlyArray<{
    roundNumber: number;
    theme: BodyCardTheme;
    targetPlayerId: string;
    /**
     * CC-ROOMREAD-EVEN-DISTRIBUTION — `"all-eligible-targets-at-cap"`:
     *   no eligible (under-cap) player exists for any candidate; the
     *   round fell back to picking from the full pool. Signals a card-
     *   library variety gap.
     * CC-ROOMREAD-CARD-FIT — `"weak-fit-no-strong-match"`: every
     *   candidate card's engine pick scored below `WEAK_FIT_FLOOR` for
     *   the sub-pool, so the round chose the best weak-fit card. Signals
     *   that the room genuinely has no strong match for any card in
     *   that theme/sub-pool (the canonical example: an Si-flavored card
     *   in a room with no Si player).
     */
    reason: "all-eligible-targets-at-cap" | "weak-fit-no-strong-match";
  }>;
};

/** Pre-CC-184 sentinel — `getRoomWinner` used to return this when the
 *  blind "both" tile won the plurality on a split card. CC-184 retired
 *  the blind tile in favor of name-the-two (the pair guess records two
 *  player ids), and `getRoomWinner` now tallies per-player. This
 *  constant is retained ONLY so legacy `roomVoteDistribution` records
 *  written before the migration can still be inspected; the scorer no
 *  longer consults it.
 */
export const ROOM_WINNER_BOTH_SENTINEL = "__both__";

/** Per-card scoring inputs (one player's guess + the room's vote).
 *
 *  CC-184 — a guess is now one of:
 *    (a) single player   — `guessedPlayerId` set
 *    (b) pair (name-the-two on a split) — `guessedPlayerIds` set
 *    (c) "nobody" abstain — `guessedSpecial = "nobody"`
 *  The blind `guessedSpecial = "both"` shape is gone; on a split the
 *  voter names the two players via `guessedPlayerIds`.
 */
export type RoundGuessInputs = {
  /** The voter / scorer in the room. */
  voterPlayerId: string;
  /** Single-player guess: who the voter said best fits this card.
   *  Mutually exclusive with `guessedPlayerIds` and `guessedSpecial`. */
  guessedPlayerId?: string;
  /** CC-184 — pair guess (name-the-two). Length-2 tuple of player ids;
   *  the two ids must differ. On a split card, each id that matches
   *  one of the engine's two targets earns +1; both correct earns
   *  +2 + a +1 bonus = 3. On a NORMAL (single-pick) round, a pair
   *  guess earns 0 engine credit (anti-hedge guard) — room-match may
   *  still apply if one of the named players matches the room winner. */
  guessedPlayerIds?: readonly [string, string];
  /** CC-175.1 — "nobody" abstain. CC-184 retired the "both" variant
   *  (replaced by `guessedPlayerIds`). The scorer treats "nobody" as
   *  a zero-info guess (0 points) on both split and normal rounds. */
  guessedSpecial?: "nobody";
  /** The room's plurality winner for this card.
   *  - A real player id  → that player won the plurality.
   *  - `undefined`       → tie or empty (Identity Fog).
   *  CC-184: no longer returns `ROOM_WINNER_BOTH_SENTINEL` — pair
   *  guesses now contribute 1 vote per named player to the per-player
   *  tally. */
  roomWinnerPlayerId: string | undefined;
  /** The engine's pick for this card — the full `EnginePick` so the
   *  scorer can read `isSplit` (a split round routes through the
   *  name-the-two scoring path; the runner-up's playerId is the
   *  second target). */
  enginePick: EnginePick;
};

/** Per-card scoring outcome. */
export type RoundScoreBreakdown = {
  matchedEngine: boolean;
  matchedRoom: boolean;
  perfectRead: boolean;
  /** CC-184 — true when the voter named BOTH split targets correctly
   *  via `guessedPlayerIds`. Contributes +2 + a +1 bonus = 3 to
   *  `points`. Per-spec replacement for the old blind-"both" splitRead.
   *  False when only one target was named, when the guess was a
   *  single-player vote (even if it happened to be one of the two), or
   *  when the round wasn't a split. */
  splitRead: boolean;
  /** CC-184 — count of correct named targets on a split. 0 on normal
   *  rounds. Surfaced so the reveal UI can distinguish "named one"
   *  (+1) from "named two" (+3). */
  splitNamedCorrect?: number;
  /** Total points:
   *    NORMAL round: 0..5 (+2 engine, +2 room, +1 perfect-read).
   *    SPLIT round (CC-184): 0..5 (+1 per correct named target, +1
   *    bonus on both-correct, +2 room-match).
   */
  points: number;
};

/** The four computable round verdicts the UI surfaces. The actual
 *  copy variants ("Engine Dissent" etc.) belong to CC-177/CC-184 —
 *  core just emits the categorical outcome. CC-184 added "split" so
 *  a torn-engine round never renders as "obvious." */
export type RoundVerdict =
  | "obvious" // room == engine, NOT a split
  | "human_override" // room != engine, room has consensus, NOT a split
  | "identity_fog" // room had no consensus
  | "split"; // CC-184 — engine was torn (isSplit); name-the-two was the play
