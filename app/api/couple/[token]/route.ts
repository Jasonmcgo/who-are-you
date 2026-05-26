// CC-COUPLE-3 + CC-COUPLE-4 + CC-COUPLE-8 — Public couple-game GET/POST handler.
//
// Route: `/api/couple/[token]` (outside /api/admin/**, public; the
// unguessable token is the auth).
//
// Mode 1 (B not assessed, legacy report-page mint): one-way — B reads A.
// Mode 2 (CC-COUPLE-8, both partners assessed): two-way — each reads
// the other. The page passes a `role: "a" | "b"` so the route knows
// which direction is being played; the subject is the OTHER partner and
// engine predictions run against the SUBJECT's `InnerConstitution`
// (not always A's). When both directions are done the route emits a
// compare-view payload.
//
// Engine-as-truth: the "engine answer" for each item is
// `item.predict(subjectIC)`. Items where `predict` returns null surface
// as `tier: "unscored"`.
//
// CC-COUPLE-4 scoring: partial-credit per
// docs/obvious-oblivious-game-spec.md — 5 / 3 / 1 / 0 tiers; "strong
// adjacent" for nearby patterns. Ranked top-3 is pipe-encoded into the
// existing `CoupleGameItem.partnerGuess` string field (CC-COUPLE-1
// data model unchanged).

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
  saveDirectionResults,
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
import {
  normalizeGameResultsBundle,
  type CoupleGameDirection,
  type CoupleGameItem,
  type CoupleGameResults,
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
  /**
   * CC-COUPLE-8 — true when the bond is Mode 2 (both partners assessed
   * AND we could derive a constitution for the second partner). When
   * false, the bond stays on the Mode 1 one-way flow.
   */
  mode2: boolean;
}

type CoupleRole = "a" | "b";

/** CC-COUPLE-8 — per-direction view block used inside the compare payload. */
interface DirectionView {
  direction: CoupleGameDirection;
  /** The partner being read (the engine ran against THIS person's IC). */
  subjectName: string;
  /** The partner doing the guessing. */
  guesserName: string;
  warmTotal: WarmTotalPayload;
  items: ResolvedItem[];
}

/** CC-COUPLE-8 — compare-view payload (both directions done). */
interface ComparePayload {
  status: "compared";
  partnerAName: string;
  partnerBName: string;
  bond: BondInfo;
  directions: {
    a_guesses_b: DirectionView;
    b_guesses_a: DirectionView;
  };
  winner: { kind: "a" | "b" | "tie"; line: string };
}

interface RevealPayload {
  status: "completed";
  /** Subject display name. Alias of subjectName for back-compat. */
  personName: string;
  /** CC-COUPLE-8 — explicit subject for this reveal direction. */
  subjectName: string;
  /** CC-COUPLE-8 — explicit reader for this reveal direction; null on Mode 1. */
  guesserName: string | null;
  /** CC-COUPLE-7 — bond-resolved subject name (was `personName`). */
  partnerAName: string;
  /** CC-COUPLE-7 — bond-resolved guesser name; null on legacy one-sided invites. */
  partnerBName: string | null;
  /** CC-COUPLE-7 — bond shape; the page uses this to show the Mode 2 seam. */
  bond: BondInfo;
  /** CC-COUPLE-8 — direction this reveal corresponds to. */
  direction: CoupleGameDirection;
  /**
   * CC-COUPLE-8 — populated in Mode 2 when the viewer's direction is
   * done but the partner's isn't. The page shows the viewer's reveal
   * with a "waiting on {partner}" overlay until the partner plays.
   */
  awaiting?: { partnerName: string };
  warmTotal: WarmTotalPayload;
  items: ResolvedItem[];
}

interface IntroPayload {
  /**
   * CC-COUPLE-8 — `"needs_role"` is the Mode 2 role-select state, when
   * the bond is both-assessed but the GET arrived without a `?role=`
   * query param. The page renders a "Which one are you?" picker and
   * re-fetches with the role.
   */
  status: "invited" | "b_joined" | "needs_role";
  personName: string;
  partnerAName: string;
  partnerBName: string | null;
  bond: BondInfo;
  /** CC-COUPLE-8 — viewer role on this fetch (null in role_select state). */
  role: CoupleRole | null;
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
  /**
   * CC-COUPLE-PRONOUN-FIX — true only when the subject's demographics
   * carried a binary-gender value we recognized (woman/female/f or
   * man/male/m). False for opt-out, missing, or unrecognized values
   * (which default to singular they/their). The substitution layer
   * uses this to route the "name on file but no gender" case through
   * a name-flavored fallback ({S_poss} → "Michele's", {S_obj}/{S} →
   * "Michele") instead of producing awkward "they"/"them" forms when a
   * concrete name is right there.
   */
  hasBinaryGender: boolean;
}

const PRONOUNS_THEY: SubjectPronouns = {
  pron: "they",
  obj: "them",
  poss: "their",
  refl: "themselves",
  hasBinaryGender: false,
};
const PRONOUNS_SHE: SubjectPronouns = {
  pron: "she",
  obj: "her",
  poss: "her",
  refl: "herself",
  hasBinaryGender: true,
};
const PRONOUNS_HE: SubjectPronouns = {
  pron: "he",
  obj: "him",
  poss: "his",
  refl: "himself",
  hasBinaryGender: true,
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

// CC-COUPLE-PRONOUN-FIX — shared token-substitution helper used by BOTH
// `resolvePromptAboutPartner` (prompts) and `resolveOptionLabel` (option
// labels). Three cases:
//
//   A. No name on file (personName === "your partner") — substitute the
//      noun "your partner" for {S}, {S_pron}, and {S_obj}; singular
//      "their" / "themselves" for {S_poss} / {S_refl}. Avoids the
//      "they gives" verb-agreement awkwardness and matches the
//      CC-COUPLE-6 acceptance example for `aim_gives_you`.
//
//   B. Name on file, gender NOT on file (pronouns.hasBinaryGender ===
//      false but name is present) — use the name for {S}, {S_obj}, and
//      `{name}'s` for {S_poss}; keep singular-they for {S_pron} and
//      {S_refl}. "Michele themselves" / "they themselves" both read
//      worse than "themselves" alone, so the reflexive stays
//      pronoun-only.
//
//   C. Name + recognized binary gender — use the pronoun set verbatim.
//
// Sentence-leading-fallback capitalization applies in case A only:
// when the template literally starts with `{S}`, the rendered subject
// gets a capital first letter so the sentence reads "Your partner …".
function substituteSubjectTokens(
  template: string,
  personName: string,
  pronouns: SubjectPronouns
): string {
  const hasName = personName !== "your partner";
  let sToken: string;
  let sPronToken: string;
  let sObjToken: string;
  let sPossToken: string;
  let sReflToken: string;

  if (!hasName) {
    // Case A — no name on file.
    sToken = template.startsWith("{S}")
      ? capitalizeFirstLetter(personName)
      : personName;
    sPronToken = "your partner";
    sObjToken = "your partner";
    sPossToken = pronouns.poss; // "their"
    sReflToken = pronouns.refl; // "themselves"
  } else if (!pronouns.hasBinaryGender) {
    // Case B — name on file, gender unknown / opt-out.
    sToken = personName;
    sPronToken = "they";
    sObjToken = personName;
    sPossToken = `${personName}'s`;
    sReflToken = "themselves";
  } else {
    // Case C — name + binary gender; use pronouns verbatim.
    sToken = personName;
    sPronToken = pronouns.pron;
    sObjToken = pronouns.obj;
    sPossToken = pronouns.poss;
    sReflToken = pronouns.refl;
  }

  // Substitute longest tokens first so `{S_pron}` / `{S_poss}` /
  // `{S_refl}` / `{S_obj}` never alias against the single-character
  // `{S}` token.
  return template
    .replace(/\{S_pron\}/g, sPronToken)
    .replace(/\{S_poss\}/g, sPossToken)
    .replace(/\{S_refl\}/g, sReflToken)
    .replace(/\{S_obj\}/g, sObjToken)
    .replace(/\{S\}/g, sToken);
}

function resolvePromptAboutPartner(
  template: string,
  personName: string,
  pronouns: SubjectPronouns
): string {
  return substituteSubjectTokens(template, personName, pronouns);
}

// CC-COUPLE-PRONOUN-FIX — partner-mode option-label resolver. Falls
// through to the raw `label` when the option doesn't carry a partner-
// mode template (abstract nouns, guesser-referring "you", quoted
// direct-address compliments — see the audit in coupleGameItems.ts).
function resolveOptionLabel(
  o: { label: string; labelAboutPartner?: string },
  personName: string,
  pronouns: SubjectPronouns
): string {
  if (typeof o.labelAboutPartner === "string" && o.labelAboutPartner.length > 0) {
    return substituteSubjectTokens(o.labelAboutPartner, personName, pronouns);
  }
  return o.label;
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
      // CC-COUPLE-PRONOUN-FIX — resolve partner-mode option labels
      // through the same token system so options that referred to the
      // beloved as "you/your/yourself" now read in third person.
      options: item.options.map((o) => ({
        id: o.id,
        label: resolveOptionLabel(o, personName, pronouns),
      })),
    };
  });
}

function labelFor(
  itemId: string,
  optionId: string,
  personName: string,
  pronouns: SubjectPronouns
): string {
  if (!optionId) return "";
  const item = getCoupleGameItem(itemId);
  const opt = item?.options.find((o) => o.id === optionId);
  if (!opt) return optionId;
  // CC-COUPLE-PRONOUN-FIX — reveal-side labels go through the same
  // partner-mode resolution as the play screen, so "rankedGuessLabels"
  // and the engine-predicted label read in third person about the
  // beloved (matching the prompt's frame).
  return resolveOptionLabel(opt, personName, pronouns);
}

async function loadPartnerSession(
  db: ReturnType<typeof getDb>,
  partnerSessionId: string
): Promise<{ ic: InnerConstitution; demoRow: DemoRow | undefined } | null> {
  // CC-COUPLE-8 — generalized from `loadPartnerASession`. Loads any
  // session by id + its demographics, re-derives the IC from raw
  // answers, falls back to the stored bundle if re-derivation throws.
  const sessionRows = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, partnerSessionId))
    .limit(1);
  if (sessionRows.length === 0) return null;
  const row = sessionRows[0];

  const demoRows = await db
    .select()
    .from(demographicsTable)
    .where(eq(demographicsTable.session_id, partnerSessionId))
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
  /** CC-COUPLE-8 — subject's name + pronouns for THIS reveal direction. */
  subjectName: string;
  subjectPronouns: SubjectPronouns;
  bond: BondInfo;
  direction: CoupleGameDirection;
}

function buildRevealPayload(
  results: CoupleGameResults,
  ctx: RevealBuildContext
): RevealPayload {
  const { subjectName: personName, subjectPronouns: pronouns } = ctx;
  const guesserName =
    ctx.partnerBName === null
      ? null
      : ctx.direction === "a_guesses_b"
        ? ctx.partnerAName
        : ctx.partnerBName;
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
      rankedGuessLabels: ranked.map((id) =>
        labelFor(stored.itemId, id, personName, pronouns)
      ),
      enginePredicted,
      enginePredictedLabel: enginePredicted
        ? labelFor(stored.itemId, enginePredicted, personName, pronouns)
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
    subjectName: ctx.subjectName,
    guesserName,
    partnerAName: ctx.partnerAName,
    partnerBName: ctx.partnerBName,
    bond: ctx.bond,
    direction: ctx.direction,
    warmTotal: warm,
    items: resolvedItems,
  };
}

// CC-COUPLE-8 — build a per-direction view block for the compare payload.
function buildDirectionView(
  results: CoupleGameResults,
  ctx: RevealBuildContext,
  guesserName: string
): DirectionView {
  const reveal = buildRevealPayload(results, ctx);
  return {
    direction: ctx.direction,
    subjectName: ctx.subjectName,
    guesserName,
    warmTotal: reveal.warmTotal,
    items: reveal.items,
  };
}

interface BondContext {
  partnerAName: string;
  partnerBName: string | null;
  pronounsA: SubjectPronouns;
  /** CC-COUPLE-8 — null when B isn't on file at all (legacy one-sided). */
  pronounsB: SubjectPronouns | null;
  bond: BondInfo;
}

async function loadBondNames(
  db: ReturnType<typeof getDb>,
  couple: CoupleSessionRow
): Promise<BondContext> {
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
  // CC-COUPLE-6 — derive subject pronouns from each partner's
  // demographics gender (the bond stores names, not gender). Defaults
  // to singular they/their.
  const pronounsA = subjectPronouns(aDemoRows[0]?.gender_value ?? null);

  let partnerBName: string | null = null;
  let pronounsB: SubjectPronouns | null = null;
  // CC-COUPLE-8 — Mode 2 requires not just a B session row but a
  // derivable IC. We probe that here so the route's branching has a
  // single load-once truth (the page can't claim Mode 2 if we can't
  // build the engine read).
  let mode2 = false;
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
    pronounsB = subjectPronouns(bDemoRows[0]?.gender_value ?? null);
    // Confirm B's session is loadable (a row exists for the FK target;
    // sessions are guaranteed non-empty by the mint validation, so we
    // gate mode2 on the row existing).
    const bSessionRows = await db
      .select({ id: sessionsTable.id })
      .from(sessionsTable)
      .where(eq(sessionsTable.id, couple.partner_b_session_id))
      .limit(1);
    mode2 = bSessionRows.length > 0;
  } else if (couple.partner_b_name && couple.partner_b_name.trim().length > 0) {
    // Edge case: bond row has a B name but the B session id was
    // dropped (ON DELETE SET NULL). Preserve the sender's confirmed
    // name even though the session is gone. Mode 2 stays false because
    // we can't run engine predictions against a missing session.
    partnerBName = couple.partner_b_name.trim();
  }

  const bond: BondInfo = {
    hasPartnerB: Boolean(couple.partner_b_session_id),
    mode2,
  };

  return { partnerAName, partnerBName, pronounsA, pronounsB, bond };
}

// CC-COUPLE-8 — pick the subject for a given direction. b_guesses_a's
// subject is A; a_guesses_b's subject is B.
function subjectForDirection(
  ctx: BondContext,
  direction: CoupleGameDirection
): { name: string; pronouns: SubjectPronouns } {
  if (direction === "a_guesses_b") {
    return {
      name: ctx.partnerBName ?? "Partner B",
      pronouns: ctx.pronounsB ?? PRONOUNS_THEY,
    };
  }
  return {
    name: ctx.partnerAName,
    pronouns: ctx.pronounsA,
  };
}

function directionForRole(role: CoupleRole): CoupleGameDirection {
  return role === "a" ? "a_guesses_b" : "b_guesses_a";
}


// CC-COUPLE-8 — emit the compare-view payload from a normalized bundle.
function buildComparePayload(
  bundle: { a_guesses_b: CoupleGameResults; b_guesses_a: CoupleGameResults },
  ctx: BondContext
): ComparePayload {
  const aSubject = subjectForDirection(ctx, "a_guesses_b"); // subject = B
  const bSubject = subjectForDirection(ctx, "b_guesses_a"); // subject = A
  const a_guesses_b = buildDirectionView(
    bundle.a_guesses_b,
    {
      partnerAName: ctx.partnerAName,
      partnerBName: ctx.partnerBName,
      subjectName: aSubject.name,
      subjectPronouns: aSubject.pronouns,
      bond: ctx.bond,
      direction: "a_guesses_b",
    },
    ctx.partnerAName
  );
  const b_guesses_a = buildDirectionView(
    bundle.b_guesses_a,
    {
      partnerAName: ctx.partnerAName,
      partnerBName: ctx.partnerBName,
      subjectName: bSubject.name,
      subjectPronouns: bSubject.pronouns,
      bond: ctx.bond,
      direction: "b_guesses_a",
    },
    ctx.partnerBName ?? "Partner B"
  );
  // Winner by total points; spec wants "head-to-head … winner/tie line".
  const aPoints = a_guesses_b.warmTotal.totalPoints;
  const bPoints = b_guesses_a.warmTotal.totalPoints;
  let winner: ComparePayload["winner"];
  if (aPoints > bPoints) {
    winner = {
      kind: "a",
      line: `${ctx.partnerAName} read ${aSubject.name} more clearly.`,
    };
  } else if (bPoints > aPoints) {
    winner = {
      kind: "b",
      line: `${ctx.partnerBName ?? "Partner B"} read ${bSubject.name} more clearly.`,
    };
  } else {
    winner = { kind: "tie", line: "Dead even — you read each other equally well." };
  }
  return {
    status: "compared",
    partnerAName: ctx.partnerAName,
    partnerBName: ctx.partnerBName ?? "Partner B",
    bond: ctx.bond,
    directions: { a_guesses_b, b_guesses_a },
    winner,
  };
}

type CouplePayload = IntroPayload | RevealPayload | ComparePayload;

// CC-COUPLE-8 — central dispatcher. Branches:
//   - Mode 1 (B not assessed): one-way as today. role param ignored.
//   - Mode 2, no role on GET: emits a needs_role payload.
//   - Mode 2, role on GET: per-direction intro / single reveal / compare.
async function buildIntroOrReveal(
  db: ReturnType<typeof getDb>,
  couple: CoupleSessionRow,
  role: CoupleRole | null
): Promise<CouplePayload> {
  const ctx = await loadBondNames(db, couple);
  const bundle = normalizeGameResultsBundle(couple.game_results);

  if (!ctx.bond.mode2) {
    // ── Mode 1 (legacy / one-sided invite) ───────────────────────────
    // Reveal when game_results present (legacy bare → b_guesses_a after
    // normalization).
    const legacyResults = bundle?.b_guesses_a;
    if (couple.status === "completed" && legacyResults) {
      const aSubject = subjectForDirection(ctx, "b_guesses_a");
      return buildRevealPayload(legacyResults, {
        partnerAName: ctx.partnerAName,
        partnerBName: ctx.partnerBName,
        subjectName: aSubject.name,
        subjectPronouns: aSubject.pronouns,
        bond: ctx.bond,
        direction: "b_guesses_a",
      });
    }
    return {
      status: couple.status === "b_joined" ? "b_joined" : "invited",
      personName: ctx.partnerAName,
      partnerAName: ctx.partnerAName,
      partnerBName: ctx.partnerBName,
      bond: ctx.bond,
      role: null,
      items: itemsForIntro(
        couple.invite_token,
        ctx.partnerAName,
        ctx.pronounsA
      ),
    };
  }

  // ── Mode 2 ─────────────────────────────────────────────────────────
  // If both directions present → compare regardless of role (the view is
  // bilateral by design).
  if (bundle?.a_guesses_b && bundle?.b_guesses_a) {
    return buildComparePayload(
      { a_guesses_b: bundle.a_guesses_b, b_guesses_a: bundle.b_guesses_a },
      ctx
    );
  }

  // No role provided → role-select state.
  if (!role) {
    return {
      status: "needs_role",
      personName: ctx.partnerAName,
      partnerAName: ctx.partnerAName,
      partnerBName: ctx.partnerBName,
      bond: ctx.bond,
      role: null,
      items: [],
    };
  }

  const direction = directionForRole(role);
  const subject = subjectForDirection(ctx, direction);
  const myResults = bundle?.[direction];

  if (myResults) {
    // Viewer's direction is done; waiting on partner.
    const partnerDirection: CoupleGameDirection =
      direction === "a_guesses_b" ? "b_guesses_a" : "a_guesses_b";
    const partnerResults = bundle?.[partnerDirection];
    const partnerName =
      direction === "a_guesses_b"
        ? ctx.partnerBName ?? "Partner B"
        : ctx.partnerAName;
    const reveal = buildRevealPayload(myResults, {
      partnerAName: ctx.partnerAName,
      partnerBName: ctx.partnerBName,
      subjectName: subject.name,
      subjectPronouns: subject.pronouns,
      bond: ctx.bond,
      direction,
    });
    if (!partnerResults) {
      reveal.awaiting = { partnerName };
    }
    return reveal;
  }

  // Viewer's direction not played yet → intro for their direction.
  return {
    status: "b_joined",
    personName: subject.name,
    partnerAName: ctx.partnerAName,
    partnerBName: ctx.partnerBName,
    bond: ctx.bond,
    role,
    items: itemsForIntro(couple.invite_token, subject.name, subject.pronouns),
  };
}

// ─────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────

function parseRole(raw: string | null): CoupleRole | null {
  if (raw === "a" || raw === "b") return raw;
  return null;
}

export async function GET(
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

  // CC-COUPLE-8 — `?role=a|b` indicates the viewer's identity in Mode 2.
  // Mode 1 ignores it; the dispatcher branches.
  const role = parseRole(new URL(req.url).searchParams.get("role"));
  return NextResponse.json(await buildIntroOrReveal(db, couple, role));
}

// ─────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────

interface PostBody {
  /**
   * Map of itemId → ranked top-3 option ids (in rank order). Items
   * not present are recorded with an empty ranked guess (still scored
   * if the engine has a prediction — the `off` tier handles it).
   */
  rankedGuesses?: Record<string, string[]>;
  /**
   * CC-COUPLE-8 — viewer identity in Mode 2. Required in Mode 2,
   * ignored in Mode 1. "a" → guess about B; "b" → guess about A.
   */
  role?: "a" | "b";
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

  const ctx = await loadBondNames(db, couple);

  // CC-COUPLE-8 — direction resolution.
  // Mode 1 → always b_guesses_a (B reads A, the legacy contract). Role
  // body field is ignored.
  // Mode 2 → role required; direction follows role.
  let direction: CoupleGameDirection;
  if (ctx.bond.mode2) {
    const role = parseRole(body.role ?? null);
    if (!role) {
      return NextResponse.json(
        { error: "role is required (\"a\" or \"b\") for two-way bonds" },
        { status: 400 }
      );
    }
    direction = directionForRole(role);
  } else {
    direction = "b_guesses_a";
  }

  // CC-COUPLE-8 — idempotent on a completed direction.
  const existingBundle = normalizeGameResultsBundle(couple.game_results);
  const existingForDirection = existingBundle?.[direction];
  if (existingForDirection) {
    const dispatched = await buildIntroOrReveal(
      db,
      couple,
      direction === "a_guesses_b" ? "a" : "b"
    );
    return NextResponse.json(dispatched);
  }

  // CRITICAL — score against the SUBJECT's constitution, not always A's.
  // a_guesses_b → subject = B; b_guesses_a → subject = A. Getting this
  // wrong silently scores guesses against the wrong engine answers.
  const subjectSessionId =
    direction === "a_guesses_b"
      ? couple.partner_b_session_id
      : couple.partner_a_session_id;
  if (!subjectSessionId) {
    return NextResponse.json(
      { error: "subject session not found for this direction" },
      { status: 404 }
    );
  }
  const loaded = await loadPartnerSession(db, subjectSessionId);
  if (!loaded) {
    return NextResponse.json(
      { error: "subject session not found" },
      { status: 404 }
    );
  }
  const { ic: subjectIc } = loaded;

  // CC-COUPLE-5 — score against the round selector's items (same set
  // the page rendered to the guesser). We trust the round derived from
  // the token rather than the raw `rankedGuesses` keys — that way an
  // item the client never rendered can't be smuggled into the saved row.
  const round = selectRound(couple.invite_token);
  const storedItems: CoupleGameItem[] = round.map((item) => {
    const rankedForItem = Array.isArray(ranked[item.itemId])
      ? ranked[item.itemId].filter((s) => typeof s === "string")
      : [];
    const enginePredicted = item.predict(subjectIc);
    return {
      itemId: item.itemId,
      direction,
      selfAnswer: enginePredicted ?? "",
      partnerGuess: encodeRankedGuess(rankedForItem),
      sourceSignal: item.sourceSignal,
    };
  });

  const results: CoupleGameResults = {
    items: storedItems,
    playedAt: new Date().toISOString(),
  };

  // CC-COUPLE-8 — Mode 1 → markCompleted on first (only) save. Mode 2 →
  // markCompleted only when this save makes both directions present.
  const otherDirection: CoupleGameDirection =
    direction === "a_guesses_b" ? "b_guesses_a" : "a_guesses_b";
  const otherAlreadyPresent = Boolean(existingBundle?.[otherDirection]);
  const markCompleted = ctx.bond.mode2 ? otherAlreadyPresent : true;

  try {
    await saveDirectionResults(token, direction, results, { markCompleted });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "save failed" },
      { status: 500 }
    );
  }

  // Re-dispatch through the central builder so the returned payload is
  // exactly what a fresh GET would return (single reveal, awaiting, or
  // compare).
  const role: CoupleRole = direction === "a_guesses_b" ? "a" : "b";
  return NextResponse.json(
    await buildIntroOrReveal(db, await getCoupleSessionByToken(token) ?? couple, role)
  );
}
