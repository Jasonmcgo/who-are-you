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
});
