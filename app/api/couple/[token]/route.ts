// CC-COUPLE-3 + CC-COUPLE-4 — Public couple-game GET/POST handler.
//
// Route: `/api/couple/[token]` (outside /api/admin/**, public; the
// unguessable token is the auth).
//
// GET  → intro payload (partner-A first name, the item bank, status,
//        and — when the session is already `completed` — the saved
//        reveal payload so the page can jump straight to the reveal).
// POST → resolves B's ranked-top-3 guesses against A's
//        `InnerConstitution`, stores the resulting `CoupleGameResults`
//        on `couple_sessions`, and returns the resolved reveal payload.
//
// Asymmetric, engine-as-truth: the "engine answer" for each item is
// `item.predict(icA)`. Items where `predict` returns null surface as
// `tier: "unscored"` ("no strong read") and are not scored.
//
// CC-COUPLE-4: scoring is partial-credit per
// docs/obvious-oblivious-game-spec.md — 5 / 3 / 1 / 0 tiers based on
// where the engine answer lands in B's top-3, with a "strong adjacent"
// tier for guesses that name a nearby pattern. The ranked top-3 is
// pipe-encoded into the existing `CoupleGameItem.partnerGuess` string
// field (CC-COUPLE-1 data model unchanged).

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
import {
  getCoupleGameItem,
  adjacencyFor,
  ITEM_TRANSLATIONS,
  selectRound,
  deckOf,
  COUPLE_DECK_LABEL,
  type CoupleDeck,
} from "../../../../lib/coupleGameItems";
import {
  scoreRankedGuess,
  summarizeWarmTotal,
  type RankedRevealTier,
} from "../../../../lib/coupleReveal";
import type {
  CoupleGameItem,
  CoupleGameResults,
} from "../../../../lib/coupleTypes";
import type {
  Answer,
  DemographicAnswer,
  DemographicSet,
  InnerConstitution,
  MetaSignal,
} from "../../../../lib/types";

// ─────────────────────────────────────────────────────────────────────
// Wire types — must match `app/couple/[token]/page.tsx`.
// ─────────────────────────────────────────────────────────────────────

interface ItemPayload {
  itemId: string;
  prompt: string;
  sourceSignal: string;
  /** CC-COUPLE-5 — which deck this item belongs to (UI label). */
  deck: CoupleDeck | null;
  deckLabel: string;
  options: { id: string; label: string }[];
}

interface ResolvedItem {
  itemId: string;
  prompt: string;
  sourceSignal: string;
  /** CC-COUPLE-5 — deck tag echoed on the reveal too. */
  deck: CoupleDeck | null;
  deckLabel: string;
  /** B's ranked top-3 guess (option ids in rank order). */
  rankedGuess: string[];
  /** Display labels for the ranked guess, in rank order. */
  rankedGuessLabels: string[];
  /** Engine-predicted option id, or "" when no defensible projection. */
  enginePredicted: string;
  /** Display label for the engine prediction, or "" when unscored. */
  enginePredictedLabel: string;
  tier: RankedRevealTier;
  points: number;
  /** Per-item warm translation copy (the "inner read" sentence). */
  translation: string;
}

interface WarmTotalPayload {
  clean: number;
  close: number;
  adjacent: number;
  off: number;
  unscored: number;
  totalPoints: number;
  maxPoints: number;
  clearlyRead: number;
  clearlyOf: number;
}

interface BondInfo {
  /** CC-COUPLE-7 — true when the row has both partner session ids. */
  hasPartnerB: boolean;
}

interface RevealPayload {
  status: "completed";
  /** Subject (Partner A) display name. Alias of `partnerAName` for back-compat. */
  personName: string;
  /** CC-COUPLE-7 — bond-resolved subject name (was `personName`). */
  partnerAName: string;
  /** CC-COUPLE-7 — bond-resolved guesser name; null on legacy one-sided invites. */
  partnerBName: string | null;
  /** CC-COUPLE-7 — bond shape; the page uses this to show the Mode 2 seam. */
  bond: BondInfo;
  warmTotal: WarmTotalPayload;
  items: ResolvedItem[];
}

interface IntroPayload {
  status: "invited" | "b_joined";
  personName: string;
  partnerAName: string;
  partnerBName: string | null;
  bond: BondInfo;
  items: ItemPayload[];
}

// ─────────────────────────────────────────────────────────────────────
// Pipe-encoded ranked-guess (CC-COUPLE-4)
//
// CoupleGameItem.partnerGuess is `string` per CC-COUPLE-1. We encode
// the top-3 ranked guess as "opt1|opt2|opt3" so the data model is
// unchanged. Decode trims empties (e.g. when B only ranked 2 items).
// ─────────────────────────────────────────────────────────────────────

const RANK_SEP = "|";

function encodeRankedGuess(ranked: readonly string[]): string {
  return ranked.slice(0, 3).filter((s) => s.length > 0).join(RANK_SEP);
}
function decodeRankedGuess(encoded: string): string[] {
  if (!encoded) return [];
  return encoded.split(RANK_SEP).filter((s) => s.length > 0);
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

type DemoRow = typeof demographicsTable.$inferSelect;

function rowToDemographicSet(row: DemoRow | undefined): DemographicSet | null {
  if (!row) return null;
  const answers: DemographicAnswer[] = [];
  function push(field_id: string, state: string, value: string | null): void {
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
// CC-COUPLE-7 — Name-precedence resolution for bond display names.
//
// Precedence:
//   1. Bond-stored name (`couple_sessions.partner_X_name`) — sender's
//      confirmed value at bond creation, wins because it was edited
//      with intent.
//   2. Demographics first name (via `firstNameOf`) — falls back when
//      the sender left the bond name blank.
//   3. Hard fallback — never returned empty.
// ─────────────────────────────────────────────────────────────────────

function resolveBondName(
  bondName: string | null,
  demoRow: DemoRow | undefined,
  fallback: string
): string {
  if (typeof bondName === "string" && bondName.trim().length > 0) {
    return bondName.trim();
  }
  const fromDemo = firstNameOf(demoRow);
  if (fromDemo !== "your partner") return fromDemo;
  return fallback;
}

function firstNameOf(demoRow: DemoRow | undefined): string {
  if (!demoRow || demoRow.name_state !== "specified" || !demoRow.name_value) {
    return "your partner";
  }
  const trimmed = demoRow.name_value.trim();
  if (!trimmed) return "your partner";
  // CC-COUPLE-6.1 — capitalize the leading character for display (names are
  // often typed lowercase). Only the first char is touched, so mixed-case
  // names like "McDonald" survive intact.
  const first = trimmed.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// ─────────────────────────────────────────────────────────────────────
// CC-COUPLE-6 — Server-side prompt-template resolution.
//
// Each item carries a `promptAboutPartner` template with role tokens
// ({S} / {S_pron} / {S_poss} / {S_refl}). Guesser references stay
// literal "you" / "your" — never substituted. Pronouns default to
// singular they/their when the subject didn't share a binary gender;
// we never guess a gendered pronoun from an ambiguous value.
// ─────────────────────────────────────────────────────────────────────

interface SubjectPronouns {
  /** subject pronoun — she / he / they */
  pron: string;
  /** object pronoun — her / him / them */
  obj: string;
  /** possessive — her / his / their */
  poss: string;
  /** reflexive — herself / himself / themselves */
  refl: string;
}

const PRONOUNS_THEY: SubjectPronouns = {
  pron: "they",
  obj: "them",
  poss: "their",
  refl: "themselves",
};
const PRONOUNS_SHE: SubjectPronouns = {
  pron: "she",
  obj: "her",
  poss: "her",
  refl: "herself",
};
const PRONOUNS_HE: SubjectPronouns = {
  pron: "he",
  obj: "him",
  poss: "his",
  refl: "himself",
};

function subjectPronouns(
  genderValue: string | null | undefined
): SubjectPronouns {
  if (typeof genderValue !== "string") return PRONOUNS_THEY;
  const normalized = genderValue.trim().toLowerCase();
  if (!normalized) return PRONOUNS_THEY;
  if (normalized === "woman" || normalized === "female" || normalized === "f") {
    return PRONOUNS_SHE;
  }
  if (normalized === "man" || normalized === "male" || normalized === "m") {
    return PRONOUNS_HE;
  }
  return PRONOUNS_THEY;
}

function capitalizeFirstLetter(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function resolvePromptAboutPartner(
  template: string,
  personName: string,
  pronouns: SubjectPronouns
): string {
  // Sentence-leading-fallback capitalization: when the template starts
  // with `{S}` AND the name fell back to "your partner", lift the case
  // so the rendered sentence begins with "Your partner …" not "your".
  const startsWithSubjectToken = template.startsWith("{S}");
  const subject =
    startsWithSubjectToken && personName === "your partner"
      ? capitalizeFirstLetter(personName)
      : personName;
  // No-name case: substitute the noun "your partner" for the subject
  // and object pronoun slots too. Avoids singular-they verb-agreement
  // awkwardness ("they gives you" / "they becomes") and matches the
  // CC-COUPLE-6 acceptance example for `aim_gives_you`:
  //   "When your partner is at their best, your partner gives you:".
  // Possessive + reflexive stay as singular "their" / "themselves",
  // which read naturally when the unknown subject is referenced by
  // pronoun rather than noun.
  const subjectPron =
    personName === "your partner" ? "your partner" : pronouns.pron;
  const objectPron =
    personName === "your partner" ? "your partner" : pronouns.obj;
  // Substitute longest tokens first so `{S_pron}` / `{S_poss}` /
  // `{S_refl}` / `{S_obj}` never alias against the single-character
  // `{S}` token.
  return template
    .replace(/\{S_pron\}/g, subjectPron)
    .replace(/\{S_poss\}/g, pronouns.poss)
    .replace(/\{S_refl\}/g, pronouns.refl)
    .replace(/\{S_obj\}/g, objectPron)
    .replace(/\{S\}/g, subject);
}

function deckMetaFor(itemId: string): { deck: CoupleDeck | null; deckLabel: string } {
  const deck = deckOf(itemId);
  return { deck, deckLabel: deck ? COUPLE_DECK_LABEL[deck] : "" };
}

function itemsForIntro(
  token: string,
  personName: string,
  pronouns: SubjectPronouns
): ItemPayload[] {
  // CC-COUPLE-5 — round selector draws a balanced spread (≤8 items,
  // one per deck minimum). Determinism per token: reload returns the
  // same round; different couples get different rounds.
  // CC-COUPLE-6 — `prompt` ships pre-resolved from the item's
  // `promptAboutPartner` template (server-side substitution of subject
  // name + pronouns). Client renders it as-is.
  return selectRound(token).map((item) => {
    const meta = deckMetaFor(item.itemId);
    return {
      itemId: item.itemId,
      prompt: resolvePromptAboutPartner(
        item.promptAboutPartner,
        personName,
        pronouns
      ),
      sourceSignal: item.sourceSignal,
      deck: meta.deck,
      deckLabel: meta.deckLabel,
      options: item.options.map((o) => ({ id: o.id, label: o.label })),
    };
  });
}

function labelFor(itemId: string, optionId: string): string {
  if (!optionId) return "";
  const item = getCoupleGameItem(itemId);
  return item?.options.find((o) => o.id === optionId)?.label ?? optionId;
}

async function loadPartnerASession(
  db: ReturnType<typeof getDb>,
  partnerASessionId: string
): Promise<{ ic: InnerConstitution; demoRow: DemoRow | undefined } | null> {
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

  const answers = (row.answers ?? []) as Answer[];
  const metaSignals = (row.meta_signals ?? []) as MetaSignal[];
  const demographics = rowToDemographicSet(demoRow);
  let ic: InnerConstitution;
  try {
    ic = buildInnerConstitution(answers, metaSignals, demographics);
  } catch {
    ic = row.inner_constitution as InnerConstitution;
  }
  return { ic, demoRow };
}

interface RevealBuildContext {
  partnerAName: string;
  partnerBName: string | null;
  pronouns: SubjectPronouns;
  bond: BondInfo;
}

function buildRevealPayload(
  results: CoupleGameResults,
  ctx: RevealBuildContext
): RevealPayload {
  const { partnerAName: personName, pronouns } = ctx;
  const resolvedItems: ResolvedItem[] = [];
  const tierResults: { tier: RankedRevealTier; points: number }[] = [];

  for (const stored of results.items) {
    const item = getCoupleGameItem(stored.itemId);
    const enginePredicted = stored.selfAnswer; // "" when unscored
    const ranked = decodeRankedGuess(stored.partnerGuess);
    const adjacency = enginePredicted
      ? adjacencyFor(stored.itemId, enginePredicted)
      : [];
    const scored = scoreRankedGuess({
      enginePredicted: enginePredicted || null,
      rankedGuess: ranked,
      adjacency,
    });
    tierResults.push(scored);
    const meta = deckMetaFor(stored.itemId);
    // CC-COUPLE-6 — echo the resolved guess-form prompt on the reveal,
    // matching what the player saw during the rank step. Falls back to
    // empty string when the item id is no longer in the bank.
    const resolvedPrompt = item
      ? resolvePromptAboutPartner(
          item.promptAboutPartner,
          personName,
          pronouns
        )
      : "";
    resolvedItems.push({
      itemId: stored.itemId,
      prompt: resolvedPrompt,
      sourceSignal: stored.sourceSignal,
      deck: meta.deck,
      deckLabel: meta.deckLabel,
      rankedGuess: ranked,
      rankedGuessLabels: ranked.map((id) => labelFor(stored.itemId, id)),
      enginePredicted,
      enginePredictedLabel: enginePredicted
        ? labelFor(stored.itemId, enginePredicted)
        : "",
      tier: scored.tier,
      points: scored.points,
      translation: ITEM_TRANSLATIONS[stored.itemId] ?? "",
    });
  }

  const warm = summarizeWarmTotal(tierResults);
  return {
    status: "completed",
    personName,
    partnerAName: ctx.partnerAName,
    partnerBName: ctx.partnerBName,
    bond: ctx.bond,
    warmTotal: warm,
    items: resolvedItems,
  };
}

async function loadBondNames(
  db: ReturnType<typeof getDb>,
  couple: CoupleSessionRow
): Promise<{
  partnerAName: string;
  partnerBName: string | null;
  pronouns: SubjectPronouns;
  bond: BondInfo;
}> {
  const aDemoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, couple.partner_a_session_id))
    .limit(1);
  // CC-COUPLE-7 — name precedence: bond name > demographics first name >
  // hard fallback. A is always present, so the hard fallback is the
  // legacy `"your partner"`.
  const partnerAName = resolveBondName(
    couple.partner_a_name,
    aDemoRows[0],
    "your partner"
  );
  // CC-COUPLE-6 — derive subject pronouns from A's demographics gender
  // (the bond stores names, not gender). Defaults to singular they/their.
  const pronouns = subjectPronouns(aDemoRows[0]?.gender_value ?? null);

  let partnerBName: string | null = null;
  if (couple.partner_b_session_id) {
    const bDemoRows = await db
      .select()
      .from(demographicsTable)
      .where(eq(demographicsTable.session_id, couple.partner_b_session_id))
      .limit(1);
    partnerBName = resolveBondName(
      couple.partner_b_name,
      bDemoRows[0],
      "Partner B"
    );
  } else if (couple.partner_b_name && couple.partner_b_name.trim().length > 0) {
    // Edge case: bond row has a B name but the B session id was
    // dropped (ON DELETE SET NULL). Preserve the sender's confirmed
    // name even though the session is gone.
    partnerBName = couple.partner_b_name.trim();
  }

  const bond: BondInfo = {
    hasPartnerB: Boolean(couple.partner_b_session_id),
  };

  return { partnerAName, partnerBName, pronouns, bond };
}

async function buildIntroOrReveal(
  db: ReturnType<typeof getDb>,
  couple: CoupleSessionRow
): Promise<IntroPayload | RevealPayload> {
  const ctx = await loadBondNames(db, couple);

  if (couple.status === "completed" && couple.game_results) {
    return buildRevealPayload(couple.game_results, ctx);
  }
  return {
    status: couple.status === "b_joined" ? "b_joined" : "invited",
    personName: ctx.partnerAName,
    partnerAName: ctx.partnerAName,
    partnerBName: ctx.partnerBName,
    bond: ctx.bond,
    items: itemsForIntro(couple.invite_token, ctx.partnerAName, ctx.pronouns),
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

  return NextResponse.json(await buildIntroOrReveal(db, couple));
}

// ─────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────

interface PostBody {
  /**
   * Map of itemId → B's ranked top-3 option ids (in rank order). Items
   * not present are recorded with an empty ranked guess (still scored
   * if the engine has a prediction — the `off` tier handles it).
   */
  rankedGuesses?: Record<string, string[]>;
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

  // Idempotent on a completed session.
  if (couple.status === "completed" && couple.game_results) {
    const ctx = await loadBondNames(db, couple);
    return NextResponse.json(buildRevealPayload(couple.game_results, ctx));
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const ranked = body.rankedGuesses ?? {};
  if (typeof ranked !== "object" || Array.isArray(ranked)) {
    return NextResponse.json(
      { error: "rankedGuesses must be an object map of itemId → option ids" },
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
  const { ic: icA } = loaded;
  // CC-COUPLE-7 — bond-aware name + pronoun resolution for the reveal.
  // Loads B's demo row when bonded so the reveal payload carries both
  // names + the Mode 2 seam signal.
  const ctx = await loadBondNames(db, couple);

  // CC-COUPLE-5 — score against the round selector's items (the same
  // set the page rendered to B). We trust the round derived from the
  // token rather than the raw `rankedGuesses` keys — that way an item
  // B's client never rendered can't be smuggled into the saved row.
  const round = selectRound(couple.invite_token);
  const storedItems: CoupleGameItem[] = round.map((item) => {
    const rankedForItem = Array.isArray(ranked[item.itemId])
      ? ranked[item.itemId].filter((s) => typeof s === "string")
      : [];
    const enginePredicted = item.predict(icA);
    return {
      itemId: item.itemId,
      direction: "b_guesses_a",
      // Sentinel "" when no engine prediction; surfaces as `unscored`.
      selfAnswer: enginePredicted ?? "",
      // Pipe-encoded ranked top-3. Empty string when B ranked nothing.
      partnerGuess: encodeRankedGuess(rankedForItem),
      // selfKnows intentionally omitted — Phase 3 self-pass arrives later.
      sourceSignal: item.sourceSignal,
    };
  });

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

  return NextResponse.json(buildRevealPayload(results, ctx));
}
