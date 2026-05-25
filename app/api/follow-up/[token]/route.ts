// CC-126 — Public follow-up API.
//
// Route lives at `/api/follow-up/[token]` — OUTSIDE `/api/admin/**`,
// so the admin auth middleware (middleware.ts) does NOT gate it. The
// route is intentionally public; the unguessable token is the auth.
//
// GET  /api/follow-up/[token]
//   → 200 { personName, missingQuestions, followUps } when the token
//     resolves to a live session.
//   → 404 { error } on unknown token or missing session.
//   Note: used links remain queryable (we accept idempotent re-submit)
//   so used_at is informational; GET does NOT 410.
//
// POST /api/follow-up/[token]
//   Body: { gapFillAnswers?: Answer[], followUpAnswers?: FollowUpAnswerPayload[] }
//   →  Merges gap-fill answers into `sessions.answers` (replace-or-
//      append by question_id, mirroring `updateSessionAnswer`).
//   →  Maps each follow-up payload to a SinglePickAnswer (choose_one)
//      or RankingDerivedAnswer (rank_top_*), with the option `tags`
//      becoming the inline signal carried on the answer. These types
//      carry their signal inline (no `data/questions.ts` lookup
//      required) so `deriveSignals` consumes them as first-class.
//   →  Re-runs `buildInnerConstitution(updatedAnswers, metaSignals,
//      demographics)` and persists both `answers` + `inner_constitution`
//      back to the row.
//   →  Marks `used_at` (first time only; subsequent calls preserve the
//      original timestamp).
//   →  200 { ok: true, reDerived: true }.
//   Idempotent on re-submit — gap-fill answers replace by question_id;
//   follow-up answers replace by question_id (no double-append).

import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  demographics as demographicsTable,
  followUpLinks,
  sessions,
} from "../../../../db/schema";
import {
  buildInnerConstitution,
} from "../../../../lib/identityEngine";
import {
  missingQuestions,
} from "../../../../lib/missingQuestions";
import { resolveFollowUps } from "../../../../lib/followUpResolver";
import type {
  Answer,
  CardId,
  DemographicAnswer,
  DemographicSet,
  InnerConstitution,
  MetaSignal,
  RankingDerivedAnswer,
  SignalId,
  SinglePickAnswer,
} from "../../../../lib/types";
import type {
  FollowUpOption,
  FollowUpQuestion,
} from "../../../../lib/followUpQuestions";

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

interface TokenLookup {
  token: string;
  session_id: string;
  used_at: Date | null;
}

interface FollowUpAnswerPayload {
  // The follow-up question's id (e.g. "fq1_grip_object"). Stored
  // on the resulting Answer.question_id for audit + idempotent
  // re-submit dedupe.
  questionId: string;
  // The follow-up question's responseMode at submit time. Drives
  // which Answer shape we write.
  responseMode: "choose_one" | "rank_top_2" | "rank_top_3";
  // Ordered list of option labels the user picked. For choose_one
  // this is length-1; for rank_top_2/3 this is length-2/3.
  // We use option labels (not indexes) so re-submit re-renders
  // are robust to option order changes.
  pickedLabels: string[];
}

/**
 * Map a FollowUpQuestion purpose to a CardId. The CardId is what the
 * engine uses to attribute the resulting Signal to a card register —
 * grip-family probes route to "pressure", aim_replacement to "agency",
 * trait_vs_weather to "temperament".
 */
function cardIdForPurpose(purpose: FollowUpQuestion["purpose"]): CardId {
  switch (purpose) {
    case "aim_replacement":
      return "agency";
    case "trait_vs_weather":
    case "type_clarity":
      return "temperament";
    case "grip_object":
    case "release_condition":
    case "compression_check":
    default:
      return "pressure";
  }
}

/**
 * Pull the SignalId from a FollowUpOption. We use the first tag —
 * tags are the option's scoring contract (CC-125 task A).
 */
function signalFromOption(opt: FollowUpOption): SignalId {
  // Fall back to "follow_up_unknown" if the option somehow has no tags;
  // the engine will treat unknown signal_ids as no-ops via
  // SIGNAL_DESCRIPTIONS lookup, but at least the merge succeeds.
  return (opt.tags && opt.tags[0]) || "follow_up_unknown";
}

/**
 * Convert a follow-up submission to an `Answer` the engine can consume.
 * For `choose_one` we emit a `SinglePickAnswer` (engine reads the inline
 * `picked_signal` — no `questions.ts` lookup). For `rank_top_*` we emit
 * a `RankingDerivedAnswer` (engine reads inline `derived_item_sources`,
 * same path).
 */
function followUpPayloadToAnswer(
  payload: FollowUpAnswerPayload,
  question: FollowUpQuestion
): Answer | null {
  const card_id = cardIdForPurpose(question.purpose);
  if (payload.pickedLabels.length === 0) return null;

  if (payload.responseMode === "choose_one") {
    const opt = question.options.find((o) => o.label === payload.pickedLabels[0]);
    if (!opt) return null;
    const answer: SinglePickAnswer = {
      question_id: payload.questionId,
      card_id,
      question_text: question.question,
      type: "single_pick",
      picked_id: opt.label,
      picked_signal: signalFromOption(opt),
    };
    return answer;
  }

  // rank_top_2 / rank_top_3 → RankingDerivedAnswer
  const sources: RankingDerivedAnswer["derived_item_sources"] = [];
  const order: string[] = [];
  for (const label of payload.pickedLabels) {
    const opt = question.options.find((o) => o.label === label);
    if (!opt) continue;
    sources.push({
      id: opt.label,
      signal: signalFromOption(opt),
      source_question_id: payload.questionId,
    });
    order.push(opt.label);
  }
  if (order.length === 0) return null;
  const answer: RankingDerivedAnswer = {
    question_id: payload.questionId,
    card_id,
    question_text: question.question,
    type: "ranking_derived",
    order,
    derived_item_sources: sources,
  };
  return answer;
}

/**
 * Merge new answers into the existing array, replacing on question_id
 * match (so re-submits are idempotent). Existing-answer order is
 * preserved; new answers append at the end.
 */
function mergeAnswers(existing: Answer[], incoming: Answer[]): Answer[] {
  const incomingByQid = new Map(incoming.map((a) => [a.question_id, a]));
  const usedQids = new Set<string>();
  const merged: Answer[] = existing.map((a) => {
    const replacement = incomingByQid.get(a.question_id);
    if (replacement) {
      usedQids.add(a.question_id);
      return replacement;
    }
    return a;
  });
  for (const a of incoming) {
    if (usedQids.has(a.question_id)) continue;
    merged.push(a);
  }
  return merged;
}

async function lookupToken(
  db: ReturnType<typeof getDb>,
  token: string
): Promise<TokenLookup | null> {
  const rows = await db
    .select({
      token: followUpLinks.token,
      session_id: followUpLinks.session_id,
      used_at: followUpLinks.used_at,
    })
    .from(followUpLinks)
    .where(eq(followUpLinks.token, token))
    .limit(1);
  return rows[0] ?? null;
}

function demoRowToDemographicSet(row: {
  name_value: string | null;
  name_state: string;
  gender_value: string | null;
  gender_state: string;
  age_decade: string | null;
  age_state: string;
  location_country: string | null;
  location_region: string | null;
  location_state: string;
  marital_status_value: string | null;
  marital_status_state: string;
  education_value: string | null;
  education_state: string;
  political_value: string | null;
  political_state: string;
  religious_value: string | null;
  religious_state: string;
  profession_value: string | null;
  profession_state: string;
}): DemographicSet {
  const answers: DemographicAnswer[] = [];
  function push(field_id: string, state: string, value: string | null) {
    if (state === "specified" && value) {
      answers.push({ field_id, state: "specified", value });
    } else if (state === "prefer_not_to_say") {
      answers.push({ field_id, state: "prefer_not_to_say" });
    } else {
      answers.push({ field_id, state: "not_answered" });
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
  return { answers };
}

// ─────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database connection failed." },
      { status: 500 }
    );
  }

  const link = await lookupToken(db, token);
  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const sessionRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, link.session_id))
    .limit(1);
  if (sessionRows.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const session = sessionRows[0];
  const answers = (session.answers ?? []) as Answer[];
  const constitution = session.inner_constitution as InnerConstitution;

  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, link.session_id))
    .limit(1);
  const demoRow = demoRows[0];
  const personName =
    demoRow?.name_state === "specified" && demoRow.name_value
      ? demoRow.name_value
      : "You";

  const missing = missingQuestions(answers);
  const followUps = resolveFollowUps(
    personName === "You" ? null : personName,
    constitution,
    answers,
    personName
  );

  // CC-170 — return the session's stored answers so the follow-up page
  // can resolve derived-question items (ranking_derived /
  // multiselect_derived / binary_pick_derived) against the parent
  // rankings the user already completed. The same answers feed the
  // existing `missingQuestions` + `followUps` computations above; the
  // payload addition is purely so the client can re-run the same
  // resolvers the assessment uses.
  return NextResponse.json({
    personName,
    missingQuestions: missing,
    followUps,
    answers,
  });
}

// ─────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────

interface PostBody {
  gapFillAnswers?: Answer[];
  followUpAnswers?: FollowUpAnswerPayload[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database connection failed." },
      { status: 500 }
    );
  }

  const link = await lookupToken(db, token);
  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const gapFill = body.gapFillAnswers ?? [];
  const followUpPayloads = body.followUpAnswers ?? [];

  const sessionRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, link.session_id))
    .limit(1);
  if (sessionRows.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const session = sessionRows[0];
  const existingAnswers = (session.answers ?? []) as Answer[];
  const metaSignals = (session.meta_signals ?? []) as MetaSignal[];
  const currentConstitution = session.inner_constitution as InnerConstitution;

  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, link.session_id))
    .limit(1);
  const demoRow = demoRows[0];
  const demographics: DemographicSet | null = demoRow
    ? demoRowToDemographicSet(demoRow)
    : null;
  const personName =
    demoRow?.name_state === "specified" && demoRow.name_value
      ? demoRow.name_value
      : "You";

  // Re-resolve the follow-up set so we can map payload labels → options
  // → tags. Resolver is deterministic on the inputs we re-pass here.
  const followUpSet = resolveFollowUps(
    personName === "You" ? null : personName,
    currentConstitution,
    existingAnswers,
    personName
  );

  // Build the follow-up answers from the payloads. We look the
  // question up by its `id` (e.g. "fq1_grip_object") so the resulting
  // Answer carries the right inline signal.
  const followUpAnswers: Answer[] = [];
  for (const payload of followUpPayloads) {
    const q = followUpSet.questions.find((qq) => qq.id === payload.questionId);
    if (!q) continue;
    const ans = followUpPayloadToAnswer(payload, q);
    if (ans) followUpAnswers.push(ans);
  }

  const merged = mergeAnswers(existingAnswers, [...gapFill, ...followUpAnswers]);
  const reDerived = buildInnerConstitution(merged, metaSignals, demographics);

  // Persist updated answers + re-derived constitution. Mark used_at
  // on first successful POST; subsequent POSTs preserve the original.
  await db
    .update(sessions)
    .set({
      answers: merged,
      inner_constitution: reDerived,
      updated_at: new Date(),
    })
    .where(eq(sessions.id, link.session_id));

  if (!link.used_at) {
    await db
      .update(followUpLinks)
      .set({ used_at: new Date() })
      .where(eq(followUpLinks.token, token));
  }

  // CC-129 Part C — return the public report URL so the answer page
  // can reveal it as a "your page is ready" link post-submit. The
  // origin comes from the inbound request so this works in
  // dev/staging/prod without configuration.
  const reportUrl = `${new URL(req.url).origin}/report/${link.session_id}`;

  return NextResponse.json({
    ok: true,
    reDerived: true,
    answersCount: merged.length,
    reportUrl,
  });
}
