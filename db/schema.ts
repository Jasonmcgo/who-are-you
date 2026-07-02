// CC-019 — Persistence layer schema. Two tables:
//   - sessions: one row per saved test session, with the full Answer[] +
//     InnerConstitution + meta_signals + skipped_question_ids stored as JSONB.
//   - demographics: one row per saved session, linked by session_id (unique
//     foreign key with cascade delete). Each demographic field has a (value,
//     state) pair so the engine can distinguish specified / prefer_not_to_say
//     / not_answered per the canonical opt-out-as-data principle (see
//     docs/canon/demographic-rules.md).

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";

// 3-state enum capturing the user's relationship to each demographic field.
// Default value is "not_answered" — applies when the user closed the page
// or navigated past without engaging. "specified" is set on real input.
// "prefer_not_to_say" is set when the user explicitly opts out — distinct
// from not_answered because the user saw the question and chose privacy.
export const fieldStateEnum = pgEnum("field_state", [
  "specified",
  "prefer_not_to_say",
  "not_answered",
]);

// Sessions table. Stores the full session state as JSONB so the schema does
// not need to evolve every time a new question type or InnerConstitution
// field lands. Allows querying into the JSON later via Postgres' jsonb
// operators.
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Full Answer[] from the user's session.
  answers: jsonb("answers").notNull(),
  // Full InnerConstitution result.
  inner_constitution: jsonb("inner_constitution").notNull(),
  // List of question_ids skipped during the session.
  skipped_question_ids: jsonb("skipped_question_ids").notNull(),
  // MetaSignal[] from the session.
  meta_signals: jsonb("meta_signals").notNull(),
  // CC-016 — per-allocation-ranking three-state aspirational overlays.
  // Present only if the user marked any aspirational overlay during the
  // allocation flow.
  allocation_overlays: jsonb("allocation_overlays"),
  // CC-017 — BeliefUnderTension. Present only if Q-I1 / Q-I1b produced an
  // anchor and Q-I2 / Q-I3 produced selections.
  belief_under_tension: jsonb("belief_under_tension"),
  // CC-LLM-REWRITES-PERSISTED-ON-SESSION — render-path cache.
  // `llm_rewrites` holds the full per-session rewrite bundle, keyed by
  // layer (prose / keystone / synthesis3 / grip / launchPolishV3).
  // `llm_rewrites_engine_hash` is a deterministic hash of the engine
  // inputs used to produce the rewrites; the render path uses it to
  // detect when a stored bundle is stale relative to current engine
  // output. NULL on rows that have not yet been backfilled or that
  // were saved before this column existed.
  llm_rewrites: jsonb("llm_rewrites"),
  llm_rewrites_engine_hash: text("llm_rewrites_engine_hash"),
  // CC-STALE-SHAPE-DETECTOR — schema version of the engine output that
  // produced inner_constitution / allocation_overlays / belief_under_tension.
  // Compared to ENGINE_SHAPE_VERSION at render time; mismatch triggers
  // re-derivation from `answers`. NULL on pre-CC rows (treated as stale).
  engine_shape_version: integer("engine_shape_version"),
});

// Demographics table. One row per saved session, linked by session_id.
// Each demographic field stores both a value column and a state column so
// the engine can distinguish specified / prefer_not_to_say / not_answered.
// Cascade delete on session deletion — demographics are per-session and
// have no meaning without the session they describe.
export const demographics = pgTable("demographics", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" })
    .unique(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  // Each demographic has (value, state) pair.
  name_value: text("name_value"),
  name_state: fieldStateEnum("name_state").notNull().default("not_answered"),

  gender_value: text("gender_value"),
  gender_state: fieldStateEnum("gender_state").notNull().default("not_answered"),

  age_decade: text("age_decade"),
  age_state: fieldStateEnum("age_state").notNull().default("not_answered"),

  location_country: text("location_country"),
  location_region: text("location_region"),
  location_state: fieldStateEnum("location_state")
    .notNull()
    .default("not_answered"),

  marital_status_value: text("marital_status_value"),
  marital_status_state: fieldStateEnum("marital_status_state")
    .notNull()
    .default("not_answered"),

  education_value: text("education_value"),
  education_state: fieldStateEnum("education_state")
    .notNull()
    .default("not_answered"),

  political_value: text("political_value"),
  political_state: fieldStateEnum("political_state")
    .notNull()
    .default("not_answered"),

  religious_value: text("religious_value"),
  religious_state: fieldStateEnum("religious_state")
    .notNull()
    .default("not_answered"),

  profession_value: text("profession_value"),
  profession_state: fieldStateEnum("profession_state")
    .notNull()
    .default("not_answered"),

  // CC-HEADER-NAV-AND-EMAIL-GATE — contact fields. `contact_email` is
  // required by the user-facing demographics gate (the Continue button
  // refuses to fire without a valid email), but the column itself is
  // nullable so legacy rows (created before this CC) survive the
  // migration without backfill. `contact_mobile` is optional in the
  // UI — stored raw to preserve the user's own formatting.
  contact_email: text("contact_email"),
  contact_mobile: text("contact_mobile"),
});

// CC-DEMOGRAPHICS-SAVE-WIRING — ghost-mapping audit log. One row per
// admin-initiated ghost-mapping write (attaching a name/email/etc. to
// a previously anonymous session via `/admin/sessions/ghost-mapping`).
// Surfaces who changed what, when, and what the row looked like
// before and after the write — so any later "why does this session
// have an email" question has an answer in the DB.
//
// Cascade-deletes when the underlying session is deleted; the audit
// is meaningless without the row it pertains to.
export const ghostMappingAudit = pgTable("ghost_mapping_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  recorded_at: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Free-text identifier for the admin user. The admin route is gated
  // upstream, but the CC explicitly asks for "who" in the audit log;
  // since the admin surface has no auth-bound identity yet, the
  // caller passes whatever string they want (typed at submit time).
  admin_label: text("admin_label").notNull(),
  note: text("note"),
  // JSONB snapshots of the demographic fields the admin can touch.
  // `null` when no demographics row existed before the write.
  before_snapshot: jsonb("before_snapshot"),
  after_snapshot: jsonb("after_snapshot").notNull(),
});

// CC-126 — Follow-up links. One row per tokenized public link minted by
// the admin "Copy URL" button (CC-127). The token is an unguessable
// random string; the public follow-up page at /api/follow-up/[token]
// resolves it to a session and serves that session's missing-question
// gap-fill + the CC-125 follow-up set. On submit, the API marks
// `used_at` so the link is recognized as already-redeemed for telemetry
// purposes — the link itself remains queryable (POST is idempotent by
// design; re-submit dedupes by question_id rather than rejecting).
// Cascade-deletes when the underlying session is deleted; the link is
// meaningless without the row it pertains to.
export const followUpLinks = pgTable("follow_up_links", {
  // The unguessable token (32 base64url chars from crypto.randomBytes).
  // Used as the primary key — direct lookup from the URL path segment.
  token: text("token").primaryKey(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Nullable until the first successful POST. Subsequent POSTs are
  // idempotent (dedupe by question_id) but leave used_at on its first
  // value for audit.
  used_at: timestamp("used_at", { withTimezone: true }),
});

// CC-136 — Answer history archive. One row per `resetSessionAnswer` call.
// Append-only: a Reset on an already-answered question snapshots the prior
// value here BEFORE the live answer is removed from `sessions.answers`. The
// archive avoids data loss when re-asking already-answered questions (e.g.
// re-collecting CC-135's rebalanced N/S items, re-measuring under movement)
// and serves as the groundwork for the CC-137 versioned-"passes" /
// longitudinal-delta system. CC-136 itself does NOT read this table in
// derivation; the archive is purely a safety net + future-pass anchor.
//
// Cascade-deletes when the underlying session is deleted; orphaned history
// is meaningless without the row it pertains to.
export const answerHistory = pgTable("answer_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  // Source question id — references a `data/questions.ts` row by question_id.
  // Stored as text (not FK) because question_ids live in code, not DB.
  question_id: text("question_id").notNull(),
  // Full Answer JSON at the moment of archive. Stored as JSONB so the
  // ranking/freeform/single-pick/multiselect-derived variants all
  // round-trip cleanly.
  answer: jsonb("answer").notNull(),
  archived_at: timestamp("archived_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Reason tag — defaults to "admin_reset" but is open-ended so future
  // callers (cohort re-measure, periodic re-ask campaigns) can record
  // their own causal label.
  reason: text("reason").notNull().default("admin_reset"),
});

// CC-COUPLE-1 — Couple sessions. One row per invited couple. Partner A always
// has a full individual `sessions` row; Partner B may join the game via the
// invite link without a full individual session in MVP, so `partner_b_session_id`
// is nullable. Cascade-delete on A's session removal (the couple row is
// meaningless without it); SET NULL on B's session removal (so deleting a B
// session — which may not exist at couple-create time — does not destroy
// the couple row). `game_results` is JSONB to let the per-item tuple shape
// (see `lib/coupleTypes.ts`) evolve without a migration, mirroring the
// `sessions.answers` convention. `status` is plain text + a named constant
// (`CoupleSessionStatus`) — no enum churn for a 3-state field still in flux.
//
// Hard invariant: a partner's guesses about the other partner are stored
// ONLY here, never merged into either party's `sessions.answers`. See
// docs/couple-module-mvp-spec.md §5.
export const coupleSessions = pgTable("couple_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  invite_token: text("invite_token").notNull().unique(),
  partner_a_session_id: uuid("partner_a_session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  partner_b_session_id: uuid("partner_b_session_id").references(
    () => sessions.id,
    { onDelete: "set null" }
  ),
  // CC-COUPLE-7 — bond display names, set by the sender at bond
  // creation (prefilled from each profile's demographics, editable).
  // Stored on the bond so prompts/reveals read right even when the
  // underlying profile left the name blank. Both nullable: legacy
  // one-sided invited rows have neither, a one-sided invited row
  // created with just A's name still works.
  partner_a_name: text("partner_a_name"),
  partner_b_name: text("partner_b_name"),
  status: text("status").notNull().default("invited"),
  game_results: jsonb("game_results"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// CC-021a — Attachments table. One row per uploaded file associated with a
// session. The file bytes live on disk under attachments/<session_id>/; only
// the metadata + relative path live in Postgres. Cascade-deletes on session
// removal — but the on-disk files must be cleaned up explicitly via the
// DELETE handler in app/api/admin/sessions/[id]/attachments/[attachmentId]/
// because the database does not reach the filesystem.
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  uploaded_at: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  filename: text("filename").notNull(),
  mime_type: text("mime_type").notNull(),
  size_bytes: integer("size_bytes").notNull(),
  storage_path: text("storage_path").notNull(),
  label: text("label"),
  notes: text("notes"),
  // CC-165 — when true, the individual can download this file from their
  // own report permalink (/report/[session_id]). Default false: admin-only.
  shared_with_individual: boolean("shared_with_individual")
    .notNull()
    .default(false),
});

// ─────────────────────────────────────────────────────────────────────
// CC-176 — Room Read multiplayer mode persistence (5 tables).
//
// One "Room Read" session is a 4–10-player game across 4–10 Body Card
// rounds. Players are existing `sessions` rows (their assessment
// constitutions are the engine input). Engine picks are computed at
// generation time and stored on `room_read_rounds` so reveals are
// deterministic and never re-derive; the full `RoomReadGame` artifact
// is also stored on the session row for diagnostic round-trip.
//
// HARD INVARIANT (mirrors `coupleSessions` §5): a player's guesses
// live ONLY in the Room Read tables — NEVER merged into any
// `sessions.answers`. The assessment engine is the source of truth
// for cognitive shape; the game is a downstream consumer + a
// calibration flywheel, never a writeback path.
// ─────────────────────────────────────────────────────────────────────

// `room_read_sessions` — the game container.
//
// `player_session_ids` is a jsonb array of `sessions.id` values
// (4–10 entries) rather than a relational join table — membership is
// validated in code (the array's shape is small, immutable for the
// life of a game, and only read for token-as-auth routing).
//
// `generated_game` stores the full `RoomReadGame` artifact (cards +
// per-round engine picks). The reveal path reads engine picks from
// `room_read_rounds`; `generated_game` is the diagnostic round-trip
// for "what did the generator emit on this game" (also used by the
// `engine_shape_version` calibration validity check).
//
// `engine_shape_version` captures `ENGINE_SHAPE_VERSION` at game
// generation. A game whose stored version drifts behind the current
// `lib/staleShape.ts` value is logged but not invalidated; the
// calibration aggregator gates on this version to keep flywheel
// signal clean.
export const roomReadSessions = pgTable("room_read_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  join_token: text("join_token").notNull().unique(),
  // Free-text admin label (mirrors how `ghostMappingAudit.admin_label`
  // identifies the creator — there's no `admin` user table to FK to).
  created_by_admin: text("created_by_admin"),
  // jsonb array of `sessions.id` (4–10). Not relational — see header.
  player_session_ids: jsonb("player_session_ids").notNull(),
  round_count: integer("round_count").notNull(),
  mode: text("mode").notNull().default("classic"),
  scoring_mode: text("scoring_mode").notNull().default("engine_plus_room"),
  status: text("status").notNull().default("draft"),
  // ENGINE_SHAPE_VERSION at generation time. Calibration aggregator
  // filters on this so events generated against a stale engine are
  // separable from current-engine events.
  engine_shape_version: integer("engine_shape_version"),
  // The full `RoomReadGame` artifact emitted by `generateRoomReadGame`.
  // Stored so the reveal path can serve a deterministic engine pick
  // (already in `room_read_rounds`) AND so a stale-version inspect can
  // diff the stored artifact against a re-derivation.
  generated_game: jsonb("generated_game").notNull(),
  // CC-187 — packs this game was generated from. Persisted so the
  // reveal/replay paths see the exact pool that fed generation; the
  // generator never re-derives from CARDS on reveal (it reads the
  // snapshot in `generated_game`), but having the pack list at the
  // session level keeps the contract explicit and lets future audits
  // group revenue by pack. Nullable for back-compat with pre-CC-187
  // rows; readers treat null as `["academic"]` (DEFAULT_PACK_ID).
  allowed_packs: text("allowed_packs").array(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// `room_read_rounds` — one row per round per game. Engine pick stored
// at generation; never recomputed (the source-of-truth is `room_read_
// sessions.generated_game` AND these per-round fields).
//
// `engine_matched_tags` is jsonb mirroring `EnginePick.matchedTags`
// (`{ tag, contribution }[]` — top-3 contributors).
export const roomReadRounds = pgTable("room_read_rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => roomReadSessions.id, { onDelete: "cascade" }),
  round_number: integer("round_number").notNull(),
  theme: text("theme").notNull(),
  card_id: text("card_id").notNull(),
  status: text("status").notNull().default("pending"),
  engine_pick_player_id: text("engine_pick_player_id").notNull(),
  engine_runner_up_player_id: text("engine_runner_up_player_id"),
  engine_confidence: text("engine_confidence").notNull(),
  engine_is_split: boolean("engine_is_split").notNull().default(false),
  engine_matched_tags: jsonb("engine_matched_tags").notNull(),
  engine_reason: text("engine_reason").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// `room_read_guesses` — one row per voter per round. UNIQUE(round_id,
// voter_player_id) is the upsert key: voters can change their guess
// up until the round is revealed (the route handler rejects post-
// reveal writes; the constraint is the safety net).
//
// `voter_player_id` is a `sessions.id` that must be present in the
// game's `player_session_ids` array — validated in code, not at the
// DB layer (the constraint would require a join across jsonb).
//
// Vote shape:
//   guessed_player_id  text NULL   — present for a normal vote
//   guessed_special    text NULL   — "both" or "nobody" for special tiles
// Exactly one of the two columns is non-null per row (enforced in code).
export const roomReadGuesses = pgTable(
  "room_read_guesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    session_id: uuid("session_id")
      .notNull()
      .references(() => roomReadSessions.id, { onDelete: "cascade" }),
    round_id: uuid("round_id")
      .notNull()
      .references(() => roomReadRounds.id, { onDelete: "cascade" }),
    voter_player_id: text("voter_player_id").notNull(),
    guessed_player_id: text("guessed_player_id"),
    // CC-184 — cross-card scoring: name the two. When a player picks
    // the "Both / Multiple" tile on a split card, the upsert writes
    // BOTH named player ids: the primary in `guessed_player_id` and
    // the second in `guessed_player_id_2`. A single-player guess
    // leaves this nullable column NULL. The new migration is
    // additive — pre-CC-184 rows ("both" specials and single-player
    // guesses) continue to load.
    guessed_player_id_2: text("guessed_player_id_2"),
    guessed_special: text("guessed_special"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    voterRoundUnique: unique("room_read_guesses_round_voter_unique").on(
      table.round_id,
      table.voter_player_id
    ),
  })
);

// `room_read_scores` — one row per scored voter per revealed round.
// `breakdown` jsonb mirrors `RoundScoreBreakdown` (the per-voter
// matched/perfect/splitRead flags + points). Written once at reveal;
// never mutated.
export const roomReadScores = pgTable("room_read_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id")
    .notNull()
    .references(() => roomReadSessions.id, { onDelete: "cascade" }),
  round_id: uuid("round_id")
    .notNull()
    .references(() => roomReadRounds.id, { onDelete: "cascade" }),
  player_id: text("player_id").notNull(),
  points: integer("points").notNull(),
  breakdown: jsonb("breakdown").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// `room_read_calibration_events` — THE flywheel table.
//
// Per `project_room_read_calibration_flywheel`: every revealed round
// writes exactly one event. The aggregator (a later CC, NOT this one)
// reads this table to attribute room-vs-engine disagreement to its
// three buckets:
//   1. Bad card           — aggregate BY card_id across games.
//   2. Engine miscalibration — aggregate BY engine_pick_player_id +
//                              matched tags across games.
//   3. Genuine deeper-read — neither of the above; reads as noise in
//      the first two aggregates.
// `subject_self_confirm` (populated when CC-177's "plead your case"
// step exists) weighs above peer votes — the engine-picked player's
// own confirm/deny is the strongest single calibration signal.
//
// Two indexes (one per attribution path) keep both aggregates fast.
export const roomReadCalibrationEvents = pgTable(
  "room_read_calibration_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    session_id: uuid("session_id")
      .notNull()
      .references(() => roomReadSessions.id, { onDelete: "cascade" }),
    round_id: uuid("round_id")
      .notNull()
      .references(() => roomReadRounds.id, { onDelete: "cascade" }),
    card_id: text("card_id").notNull(),
    theme: text("theme").notNull(),
    engine_pick_player_id: text("engine_pick_player_id").notNull(),
    engine_confidence: text("engine_confidence").notNull(),
    engine_is_split: boolean("engine_is_split").notNull().default(false),
    engine_matched_tags: jsonb("engine_matched_tags").notNull(),
    // `{ playerIdOrSpecial: count }` — special keys: "__both__",
    // "__nobody__". Never includes the engine pick as a key prefix.
    room_vote_distribution: jsonb("room_vote_distribution").notNull(),
    // Real player id, "__both__", or null when the room had no
    // consensus (Identity Fog).
    room_winner_player_id: text("room_winner_player_id"),
    verdict: text("verdict").notNull(),
    // Nullable now; populated when CC-177's plead-your-case step lands.
    subject_self_confirm: jsonb("subject_self_confirm"),
    engine_shape_version: integer("engine_shape_version"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    cardIdIdx: index("room_read_calibration_card_id_idx").on(table.card_id),
    enginePickIdx: index("room_read_calibration_engine_pick_idx").on(
      table.engine_pick_player_id
    ),
  })
);
