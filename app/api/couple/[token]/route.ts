// CC-COUPLE-3 — Public couple-game GET/POST handler.
//
// Route: `/api/couple/[token]` (outside /api/admin/**, public; the
// unguessable token is the auth).
//
// GET  → intro payload (partner-A first name, the item bank, status,
//        and — when the session is already `completed` — the saved
//        reveal payload so the page can jump straight to the reveal).
// POST → resolves B's guesses against A's `InnerConstitution`, stores
//        the resulting `CoupleGameResults` on `couple_sessions`, and
//        returns the resolved reveal payload.
//
// Asymmetric, engine-as-truth: the "selfAnswer" for each item is the
// engine's prediction for A. Items where `predict(icA)` returns null
// are recorded with `selfAnswer === ""` and surface as `scored: false`
// in the response — they are never forced into a reveal.

import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "../../../../db";
import {
  demographics as demographicsTable,
  sessions as sessionsTable,
} from "../../../../db/schema";
import { buildInnerConstitution } from "../../../../lib/identityEngine";
import {
  getCoupleSessionByToken,
  saveGameResults,
  type CoupleSessionRow,
} from "../../../../lib/coupleSession";
import { COUPLE_GAME_ITEMS, getCoupleGameItem } from "../../../../lib/coupleGameItems";
import { resolveReveal } from "../../../../lib/coupleReveal";
import type {
  CoupleGameItem,
  CoupleGameResults,
  RevealType,
} from "../../../../lib/coupleTypes";
import type {
  Answer,
  DemographicAnswer,
  DemographicSet,
  InnerConstitution,
  MetaSignal,
} from "../../../../lib/types";

// ─────────────────────────────────────────────────────────────────────
// Shared types — the JSON shape the page consumes.
// ─────────────────────────────────────────────────────────────────────

interface ItemPayload {
  itemId: string;
  prompt: string;
  sourceSignal: string;
  options: { id: string; label: string }[];
}

interface ResolvedItem {
  itemId: string;
  sourceSignal: string;
  partnerGuess: string;
  // The option id the engine predicted for A, or empty string when the
  // engine had no confident read (`scored === false`).
  enginePredicted: string;
  revealType: RevealType;
  // false when the engine had no confident prediction for this item.
  scored: boolean;
}

interface RevealPayload {
  status: "completed";
  personName: string;
  // Whole-game header score per spec §4. Two numbers, never one.
  legibility: {
    matches: number;
    scored: number;
    percent: number | null; // null when scored === 0
    // Second-line companion — counts by reveal type within scored items.
    breakdown: Record<RevealType, number>;
  };
  unscoredCount: number;
  items: ResolvedItem[];
}

interface IntroPayload {
  status: "invited" | "b_joined";
  personName: string;
  items: ItemPayload[];
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

type DemoRow = typeof demographicsTable.$inferSelect;

function rowToDemographicSet(row: DemoRow | undefined): DemographicSet | null {
  if (!row) return null;
  const answers: DemographicAnswer[] = [];
  function push(
    field_id: string,
    state: string,
    value: string | null
  ): void {
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

function firstNameOf(demoRow: DemoRow | undefined): string {
  if (!demoRow || demoRow.name_state !== "specified" || !demoRow.name_value) {
    return "your partner";
  }
  const trimmed = demoRow.name_value.trim();
  if (!trimmed) return "your partner";
  // Use the first whitespace-separated token as the first name. The
  // engine never assigns meaning to the surname segment in the report
  // surface either; this matches the casual register the game needs.
  return trimmed.split(/\s+/)[0];
}

function itemsForIntro(): ItemPayload[] {
  return COUPLE_GAME_ITEMS.map((item) => ({
    itemId: item.itemId,
    prompt: item.prompt,
    sourceSignal: item.sourceSignal,
    options: item.options.map((o) => ({ id: o.id, label: o.label })),
  }));
}

async function loadPartnerASession(
  db: ReturnType<typeof getDb>,
  partnerASessionId: string
): Promise<{
  ic: InnerConstitution;
  demoRow: DemoRow | undefined;
} | null> {
  const sessionRows = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, partnerASessionId))
    .limit(1);
  if (sessionRows.length === 0) return null;
  const row = sessionRows[0];

  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, partnerASessionId))
    .limit(1);
  const demoRow = demoRows[0];

  // Re-derive A's InnerConstitution from raw answers so the game reads
  // current-engine projections (mirrors the report-path approach for
  // shape-drift resilience without importing the full stale-shape
  // ceremony). Engine is pure — no LLM, no I/O.
  const answers = (row.answers ?? []) as Answer[];
  const metaSignals = (row.meta_signals ?? []) as MetaSignal[];
  const demographics = rowToDemographicSet(demoRow);
  let ic: InnerConstitution;
  try {
    ic = buildInnerConstitution(answers, metaSignals, demographics);
  } catch {
    // Fallback: use the stored constitution if re-derivation throws on
    // a stale-shape row. Worst case the predict() reads null on missing
    // fields — which the resolver handles cleanly.
    ic = row.inner_constitution as InnerConstitution;
  }
  return { ic, demoRow };
}

function buildRevealPayload(
  results: CoupleGameResults,
  personName: string
): RevealPayload {
  const breakdown: Record<RevealType, number> = {
    obvious: 0,
    oblivious: 0,
    mirror_blind: 0,
    hidden_pattern: 0,
    loving_misread: 0,
  };
  const resolvedItems: ResolvedItem[] = [];
  let matches = 0;
  let scored = 0;
  let unscored = 0;
  for (const stored of results.items) {
    const item = getCoupleGameItem(stored.itemId);
    const scoredOk = stored.selfAnswer !== "";
    let revealType: RevealType;
    if (scoredOk) {
      revealType = resolveReveal({
        selfAnswer: stored.selfAnswer,
        partnerGuess: stored.partnerGuess,
        enginePredicted: stored.selfAnswer,
        selfKnows: stored.selfKnows,
        options: item?.options,
      });
      scored += 1;
      if (revealType === "obvious") matches += 1;
      breakdown[revealType] += 1;
    } else {
      // Sentinel: no engine read → "no strong read" rather than oblivious.
      revealType = "oblivious"; // unused for unscored items at render time
      unscored += 1;
    }
    resolvedItems.push({
      itemId: stored.itemId,
      sourceSignal: stored.sourceSignal,
      partnerGuess: stored.partnerGuess,
      enginePredicted: stored.selfAnswer,
      revealType,
      scored: scoredOk,
    });
  }
  const percent =
    scored === 0 ? null : Math.round((matches / scored) * 100);
  return {
    status: "completed",
    personName,
    legibility: { matches, scored, percent, breakdown },
    unscoredCount: unscored,
    items: resolvedItems,
  };
}

async function buildIntroOrReveal(
  db: ReturnType<typeof getDb>,
  couple: CoupleSessionRow
): Promise<IntroPayload | RevealPayload | { error: string; status: number }> {
  // Find A's first name. (Demographics-only lookup; cheap.)
  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, couple.partner_a_session_id))
    .limit(1);
  const personName = firstNameOf(demoRows[0]);

  if (couple.status === "completed" && couple.game_results) {
    return buildRevealPayload(couple.game_results, personName);
  }
  return {
    status: couple.status === "b_joined" ? "b_joined" : "invited",
    personName,
    items: itemsForIntro(),
  };
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

  const couple = await getCoupleSessionByToken(token);
  if (!couple) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const payload = await buildIntroOrReveal(db, couple);
  if ("error" in payload) {
    return NextResponse.json(
      { error: payload.error },
      { status: payload.status }
    );
  }
  return NextResponse.json(payload);
}

// ─────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────

interface PostBody {
  // Map of itemId → option id B picked. Items not present are skipped
  // (they're recorded as unscored just like null-predict items).
  guesses?: Record<string, string>;
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

  const couple = await getCoupleSessionByToken(token);
  if (!couple) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // Idempotent: a completed couple returns its saved reveal — no
  // replay over a completed result (spec §"Already completed → jump
  // straight to the saved reveal").
  if (couple.status === "completed" && couple.game_results) {
    const demoRows = await db
      .select()
      .from(demographicsTable)
      .where(eq(demographicsTable.session_id, couple.partner_a_session_id))
      .limit(1);
    return NextResponse.json(
      buildRevealPayload(couple.game_results, firstNameOf(demoRows[0]))
    );
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const guesses = body.guesses ?? {};
  if (typeof guesses !== "object" || Array.isArray(guesses)) {
    return NextResponse.json(
      { error: "guesses must be an object map of itemId → optionId" },
      { status: 400 }
    );
  }

  const loaded = await loadPartnerASession(db, couple.partner_a_session_id);
  if (!loaded) {
    return NextResponse.json(
      { error: "Partner A session not found" },
      { status: 404 }
    );
  }
  const { ic: icA, demoRow } = loaded;
  const personName = firstNameOf(demoRow);

  // Resolve every item in the bank — items B didn't answer are recorded
  // with partnerGuess="" (unscored). This keeps the stored shape uniform
  // and gives Phase 2's A-side self-answer pass a complete row to fill in.
  const storedItems: CoupleGameItem[] = [];
  for (const item of COUPLE_GAME_ITEMS) {
    const partnerGuess = guesses[item.itemId];
    if (typeof partnerGuess !== "string" || partnerGuess === "") {
      // No guess submitted for this item — record it as unscored
      // (partnerGuess="") rather than dropping it from the row.
      storedItems.push({
        itemId: item.itemId,
        direction: "b_guesses_a",
        selfAnswer: item.predict(icA) ?? "",
        partnerGuess: "",
        sourceSignal: item.sourceSignal,
      });
      continue;
    }
    const enginePredicted = item.predict(icA);
    storedItems.push({
      itemId: item.itemId,
      direction: "b_guesses_a",
      // Sentinel "" when engine has no confident read; surfaces as
      // scored:false in the reveal payload.
      selfAnswer: enginePredicted ?? "",
      partnerGuess,
      // selfKnows intentionally omitted — we don't have A's self-report
      // in the asymmetric MVP (spec note: only Obvious / Oblivious /
      // Loving Misread can fire as a result).
      sourceSignal: item.sourceSignal,
    });
  }

  const results: CoupleGameResults = {
    items: storedItems,
    playedAt: new Date().toISOString(),
  };

  try {
    await saveGameResults(token, results);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "save failed" },
      { status: 500 }
    );
  }

  return NextResponse.json(buildRevealPayload(results, personName));
}
