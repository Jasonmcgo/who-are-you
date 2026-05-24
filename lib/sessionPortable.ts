// CC-153 — Portable session JSON: shared shape + validation for the
// admin export/import round-trip. The owner's use case: get partial
// legacy tests (Madison, JDrew, LaCinda — taken on the old local
// system before all questions existed) into Vercel without re-taking
// the test by hand. Flow:
//   admin export    → JSON file (this module's `PortableSession` shape)
//   admin import    → new session row + new demographics row
//   admin reset Qs  → CC-136 (existing)
//   admin mint link → CopySessionLinkButton → user gap-fills the rest
//
// Design constraints (locked):
//   - The export carries SOURCE data only: answers + demographics +
//     skipped IDs + meta signals + contact fields. NOT the derived
//     `inner_constitution` (the importer re-derives) and NOT a rendered
//     report (the report regenerates from the constitution).
//   - The import always creates a NEW session row (one upload → one new
//     session). No merge-into-existing.
//   - Owner may hand-build files for the legacy cohort; the schema must
//     be small, documented, and easy to author manually.

import { questions as presentedQuestions, allQuestions } from "../data/questions";
import type {
  Answer,
  CardId,
  DemographicAnswer,
  MetaSignal,
  MetaSignalType,
} from "./types";
import type { FieldState } from "../data/demographics";

/** Schema version of the portable JSON. Bump on breaking shape changes. */
export const PORTABLE_SESSION_SCHEMA_VERSION = 1 as const;

/**
 * Portable session JSON. The export side emits this; the import side
 * consumes it. Field names mirror `saveSession`'s args / the
 * demographics answer shape so the round-trip is mechanical.
 */
export interface PortableSession {
  schemaVersion: typeof PORTABLE_SESSION_SCHEMA_VERSION;
  answers: Answer[];
  skippedQuestionIds: string[];
  metaSignals: MetaSignal[];
  demographics: DemographicAnswer[];
  contactEmail: string | null;
  contactMobile: string | null;
}

export interface ValidationOk {
  ok: true;
  portable: PortableSession;
  /** Question IDs that aren't present in either bank — flagged, not rejected. */
  unknownQuestionIds: string[];
}
export interface ValidationErr {
  ok: false;
  error: string;
}
export type ValidationResult = ValidationOk | ValidationErr;

// ── Demographic / answer validators ─────────────────────────────────────

const VALID_FIELD_STATES: ReadonlySet<FieldState> = new Set<FieldState>([
  "specified",
  "prefer_not_to_say",
  "not_answered",
]);

const VALID_CARD_IDS: ReadonlySet<CardId> = new Set<CardId>([
  "formation",
  "context",
  "role",
  "temperament",
  "conviction",
  "pressure",
  "contradiction",
  "agency",
  "sacred",
]);

// CC-153 — every Answer subtype's `type` discriminator. Source of truth
// lives across the `Answer` union in `lib/types.ts`; this duplicate is a
// runtime guard. Out-of-list values are rejected with a clear error.
const VALID_ANSWER_TYPES = new Set([
  "freeform",
  "single_pick",
  "forced",
  "ranking",
  "ranking_derived",
  "multiselect_derived",
  "binary_pick",
  "binary_pick_derived",
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateAnswer(raw: unknown, idx: number): { ok: true; answer: Answer } | { ok: false; reason: string } {
  if (!isRecord(raw)) {
    return { ok: false, reason: `answers[${idx}] is not an object` };
  }
  const r = raw;
  if (typeof r.question_id !== "string" || r.question_id.length === 0) {
    return { ok: false, reason: `answers[${idx}].question_id missing or empty` };
  }
  if (typeof r.type !== "string" || !VALID_ANSWER_TYPES.has(r.type)) {
    return { ok: false, reason: `answers[${idx}].type "${String(r.type)}" not in ${[...VALID_ANSWER_TYPES].join(", ")}` };
  }
  if (typeof r.card_id !== "string" || !VALID_CARD_IDS.has(r.card_id as CardId)) {
    return { ok: false, reason: `answers[${idx}].card_id "${String(r.card_id)}" not a valid card` };
  }
  return { ok: true, answer: r as unknown as Answer };
}

function validateDemographic(raw: unknown, idx: number): { ok: true; answer: DemographicAnswer } | { ok: false; reason: string } {
  if (!isRecord(raw)) {
    return { ok: false, reason: `demographics[${idx}] is not an object` };
  }
  const r = raw;
  if (typeof r.field_id !== "string" || r.field_id.length === 0) {
    return { ok: false, reason: `demographics[${idx}].field_id missing or empty` };
  }
  if (typeof r.state !== "string" || !VALID_FIELD_STATES.has(r.state as FieldState)) {
    return { ok: false, reason: `demographics[${idx}].state "${String(r.state)}" must be one of ${[...VALID_FIELD_STATES].join(", ")}` };
  }
  if (r.value !== undefined && typeof r.value !== "string") {
    return { ok: false, reason: `demographics[${idx}].value must be a string when present` };
  }
  if (r.other_text !== undefined && typeof r.other_text !== "string") {
    return { ok: false, reason: `demographics[${idx}].other_text must be a string when present` };
  }
  return { ok: true, answer: r as unknown as DemographicAnswer };
}

function validateMetaSignal(raw: unknown, idx: number): { ok: true; signal: MetaSignal } | { ok: false; reason: string } {
  if (!isRecord(raw)) return { ok: false, reason: `metaSignals[${idx}] is not an object` };
  const r = raw;
  if (typeof r.type !== "string") return { ok: false, reason: `metaSignals[${idx}].type missing` };
  if (typeof r.question_id !== "string") return { ok: false, reason: `metaSignals[${idx}].question_id missing` };
  if (typeof r.card_id !== "string") return { ok: false, reason: `metaSignals[${idx}].card_id missing` };
  if (typeof r.recorded_at !== "number") return { ok: false, reason: `metaSignals[${idx}].recorded_at must be a number` };
  // CC-153 — `type` may include `imported_legacy` (CC-153 provenance) and
  // any future provenance markers; we don't gate on the strict
  // `MetaSignalType` union here because legitimate imports may carry
  // legacy types from older engine shapes. Unknown types are no-ops at
  // every existing read site (none of them switch on the union
  // exhaustively).
  return { ok: true, signal: r as unknown as MetaSignal };
}

// ── Public validator ────────────────────────────────────────────────────

/**
 * Validate raw parsed JSON against the portable shape. Returns either a
 * cleanly-shaped `PortableSession` or a specific error string. Pure
 * function — no I/O.
 *
 * Question-bank cross-check: `answers[i].question_id` is matched against
 * `allQuestions` (the full bank, including legacy retired `Q-T1`–`Q-T8`).
 * IDs not in the bank are reported via `unknownQuestionIds` for the
 * admin to inspect — they don't reject the import (legacy systems may
 * carry IDs the current bank no longer recognizes; the engine treats
 * unknown answers as no-ops on the signal side).
 */
export function validatePortableSession(raw: unknown): ValidationResult {
  if (!isRecord(raw)) {
    return { ok: false, error: "expected a JSON object at the root" };
  }
  if (raw.schemaVersion !== PORTABLE_SESSION_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `schemaVersion mismatch — expected ${PORTABLE_SESSION_SCHEMA_VERSION}, got ${JSON.stringify(raw.schemaVersion)}`,
    };
  }
  if (!Array.isArray(raw.answers)) {
    return { ok: false, error: "`answers` must be an array" };
  }
  if (!Array.isArray(raw.skippedQuestionIds)) {
    return { ok: false, error: "`skippedQuestionIds` must be an array" };
  }
  if (!Array.isArray(raw.metaSignals)) {
    return { ok: false, error: "`metaSignals` must be an array" };
  }
  if (!Array.isArray(raw.demographics)) {
    return { ok: false, error: "`demographics` must be an array" };
  }
  if (raw.contactEmail !== null && typeof raw.contactEmail !== "string") {
    return { ok: false, error: "`contactEmail` must be a string or null" };
  }
  if (raw.contactMobile !== null && typeof raw.contactMobile !== "string") {
    return { ok: false, error: "`contactMobile` must be a string or null" };
  }

  const answers: Answer[] = [];
  for (let i = 0; i < raw.answers.length; i++) {
    const res = validateAnswer(raw.answers[i], i);
    if (!res.ok) return { ok: false, error: res.reason };
    answers.push(res.answer);
  }

  for (let i = 0; i < raw.skippedQuestionIds.length; i++) {
    if (typeof raw.skippedQuestionIds[i] !== "string") {
      return { ok: false, error: `skippedQuestionIds[${i}] must be a string` };
    }
  }

  const metaSignals: MetaSignal[] = [];
  for (let i = 0; i < raw.metaSignals.length; i++) {
    const res = validateMetaSignal(raw.metaSignals[i], i);
    if (!res.ok) return { ok: false, error: res.reason };
    metaSignals.push(res.signal);
  }

  const demographics: DemographicAnswer[] = [];
  for (let i = 0; i < raw.demographics.length; i++) {
    const res = validateDemographic(raw.demographics[i], i);
    if (!res.ok) return { ok: false, error: res.reason };
    demographics.push(res.answer);
  }

  // Cross-check question IDs against the full bank (legacy-inclusive).
  const known = new Set(allQuestions.map((q) => q.question_id));
  // `presentedQuestions` is the filtered live-flow view; not used for
  // validation but referenced here so a future contributor knows the two
  // exports exist and which one to use for what.
  void presentedQuestions;
  const unknownQuestionIds: string[] = [];
  for (const a of answers) {
    if (!known.has(a.question_id)) unknownQuestionIds.push(a.question_id);
  }

  const portable: PortableSession = {
    schemaVersion: PORTABLE_SESSION_SCHEMA_VERSION,
    answers,
    skippedQuestionIds: raw.skippedQuestionIds as string[],
    metaSignals,
    demographics,
    contactEmail: (raw.contactEmail as string | null) ?? null,
    contactMobile: (raw.contactMobile as string | null) ?? null,
  };

  return { ok: true, portable, unknownQuestionIds };
}

// ── Provenance helper ──────────────────────────────────────────────────

/**
 * CC-153 — provenance stamp for imported sessions. Emitted into
 * `metaSignals` so admin queries on the `meta_signals` JSONB column can
 * distinguish imports from native sessions.
 *
 * Note on the type cast: `MetaSignalType` in `lib/types.ts` is a closed
 * union (the file is outside CC-153's Allowed-to-Modify list). We cast
 * the new provenance type through `unknown` so the runtime entry lands
 * in the column with the right discriminator without extending the
 * union. Existing readers of `meta_signals` switch on known types only
 * and treat unknown discriminators as no-ops, so this is safe.
 */
export function importProvenanceSignal(): MetaSignal {
  const provenance = {
    type: "imported_legacy" as MetaSignalType,
    question_id: "__import__",
    card_id: "conviction" as CardId,
    recorded_at: Date.now(),
  };
  return provenance as unknown as MetaSignal;
}

/**
 * CC-153 — build a `PortableSession` from a session row's fields. The
 * caller is responsible for fetching the row; this helper just shapes
 * the JSON.
 */
export function buildPortableSession(input: {
  answers: Answer[];
  skippedQuestionIds: string[];
  metaSignals: MetaSignal[];
  demographics: DemographicAnswer[];
  contactEmail: string | null;
  contactMobile: string | null;
}): PortableSession {
  return {
    schemaVersion: PORTABLE_SESSION_SCHEMA_VERSION,
    answers: input.answers,
    skippedQuestionIds: input.skippedQuestionIds,
    metaSignals: input.metaSignals,
    demographics: input.demographics,
    contactEmail: input.contactEmail,
    contactMobile: input.contactMobile,
  };
}
