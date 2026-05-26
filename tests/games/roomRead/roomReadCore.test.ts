// CC-175 — Room Read engine-core unit tests.
//
// Follows the repo's audit pattern: a single self-running file invoked
// via `npx tsx tests/games/roomRead/roomReadCore.test.ts`. Exits 1 on
// any failure. The acceptance checklist from the CC-175 prompt maps
// 1:1 to the assertions below.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../../lib/identityEngine";
import type { Answer, MetaSignal } from "../../../lib/types";

import { CARDS } from "../../../lib/games/roomRead/cards";
import {
  scoreCardForPlayer,
  rankPlayersForCard,
  getEnginePick,
  SPLIT_EPS,
} from "../../../lib/games/roomRead/engine";
import {
  generateRoomReadGame,
  ROOM_READ_LIMITS,
  tensionWeight,
} from "../../../lib/games/roomRead/generate";
import { BODY_CARD_ORDER } from "../../../lib/games/roomRead/rounds";
import {
  calculateCardScores,
  getRoomWinner,
} from "../../../lib/games/roomRead/scoring";
import { buildPlayerGameSignals } from "../../../lib/games/roomRead/signals";
import {
  ROOM_WINNER_BOTH_SENTINEL,
  type EnginePick,
  type PlayerGameSignals,
  type RoomReadCard,
} from "../../../lib/games/roomRead/types";
import { getVerdict } from "../../../lib/games/roomRead/verdict";

// Helper — synthesize an EnginePick for scoring tests without going
// through getEnginePick (we just need the playerId + isSplit toggle).
function fakeEnginePick(
  playerId: string,
  isSplit: boolean
): EnginePick {
  return {
    playerId,
    displayName: playerId,
    score: 0.5,
    confidence: "medium",
    isSplit,
    matchedTags: [],
    reason: playerId,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, "..", "..", "fixtures", "cohort-real");

// ─────────────────────────────────────────────────────────────────────
// Test harness
// ─────────────────────────────────────────────────────────────────────

interface Outcome {
  ok: boolean;
  name: string;
  detail: string;
}

const results: Outcome[] = [];
function check(name: string, predicate: () => string | null) {
  try {
    const detail = predicate();
    if (detail === null) {
      results.push({ ok: true, name, detail: "" });
    } else {
      results.push({ ok: false, name, detail });
    }
  } catch (e) {
    results.push({
      ok: false,
      name,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
// Cohort fixtures
// ─────────────────────────────────────────────────────────────────────

const COHORT_NAMES = ["harry", "keith", "daniel", "ashley", "jason"] as const;
const SI_ANCHORS = ["harry", "keith", "daniel"] as const;
const NI_ANCHORS = ["ashley", "jason"] as const;

function loadPlayer(name: string): PlayerGameSignals {
  const raw = JSON.parse(
    readFileSync(join(FIXTURES, `${name}-real.json`), "utf-8")
  ) as { answers: Answer[]; metaSignals?: MetaSignal[] };
  const c = buildInnerConstitution(
    raw.answers,
    raw.metaSignals ?? [],
    null
  );
  return buildPlayerGameSignals(c, { playerId: name, displayName: name });
}

const COHORT_PLAYERS: PlayerGameSignals[] = COHORT_NAMES.map(loadPlayer);

// ─────────────────────────────────────────────────────────────────────
// 1 · anti-placeholder guard
//     buildPlayerGameSignals must return a non-empty vector for every
//     cohort-real anchor. If ANY supported tag is uniformly 0 across
//     the cohort, we've silently re-introduced the placeholder bug.
// ─────────────────────────────────────────────────────────────────────

check("cohort-fixtures-produce-non-zero-signal-vectors", () => {
  const failures: string[] = [];
  for (const p of COHORT_PLAYERS) {
    const tagCount = Object.keys(p.signals).length;
    if (tagCount === 0) failures.push(`${p.playerId}: empty signal vector`);
  }
  return failures.length === 0 ? null : failures.join("; ");
});

// COHORT-FACT EXEMPTIONS — tags that are CORRECTLY zero across the
// cohort because no cohort fixture exercises the source. Verified
// 2026-05-25: every cohort-real anchor has `pathClass=trajectory` /
// `crisisFlavor=null`, so `crisis_action` (which fires only when
// `pathClass==="crisis"`) is uniformly 0 across the cohort by data,
// not by builder bug. The synthetic positive-case test below
// (`crisis-action-fires-on-synthetic-crisis-fixture`) covers the
// builder's correctness directly so this exemption can't hide a
// regression.
const COHORT_FACT_ZERO_TAGS = new Set<string>(["crisis_action"]);

check("no-supported-tag-uniformly-zero-across-cohort", () => {
  // A tag is "supported" if at least one cohort member has it set to
  // > 0 — i.e., the signal builder actually wired a source for it.
  // Every tag referenced by a card MUST be supported (otherwise the
  // card scores 0 for everyone and the engine degenerates to
  // "whoever sorts first"). Cohort-fact exemptions are listed above.
  const cardTagSet = new Set<string>();
  for (const card of CARDS) for (const t of card.tags) cardTagSet.add(t.tag);

  const failures: string[] = [];
  for (const tag of cardTagSet) {
    if (COHORT_FACT_ZERO_TAGS.has(tag)) continue;
    const supportedByAnyone = COHORT_PLAYERS.some(
      (p) => (p.signals[tag] ?? 0) > 0
    );
    if (!supportedByAnyone) failures.push(tag);
  }
  return failures.length === 0
    ? null
    : `card tags uniformly 0 across cohort: ${failures.join(", ")}`;
});

// Positive-case sanity for the cohort-fact-zero tags: the BUILDER
// fires them when fed a synthetic constitution that exercises the
// source. Catches a regression where the builder's read path silently
// breaks even though the cohort fixtures (which don't exercise it)
// continue to "pass" trivially.
check("crisis-action-fires-on-synthetic-crisis-fixture", () => {
  // Build a minimal Harry-derived constitution and force the path
  // class to crisis. We don't want to author a full synthetic
  // constitution by hand — borrowing a real one + mutating the one
  // field under test is the smallest faithful synthetic.
  const raw = JSON.parse(
    readFileSync(join(FIXTURES, "harry-real.json"), "utf-8")
  ) as { answers: Answer[]; metaSignals?: MetaSignal[] };
  const c = buildInnerConstitution(raw.answers, raw.metaSignals ?? [], null);
  if (!c.coherenceReading) return "harry has no coherenceReading";
  // Mutate in place: this is a test fixture, not the live engine.
  const mutated = {
    ...c,
    coherenceReading: {
      ...c.coherenceReading,
      pathClass: "crisis" as const,
      crisisFlavor: "working-without-presence" as const,
    },
  };
  const sig = buildPlayerGameSignals(mutated, { playerId: "synthetic-crisis" });
  if ((sig.signals.crisis_action ?? 0) <= 0) {
    return `crisis_action did not fire on synthetic crisis fixture (got ${sig.signals.crisis_action ?? 0})`;
  }
  return null;
});

// ─────────────────────────────────────────────────────────────────────
// 2 · sanity-of-the-read (the premise)
//     Si-card → all three Si anchors rank ABOVE both Ni anchors.
//     Ni-card → both Ni anchors rank ABOVE all three Si anchors.
//     Strict pass per the CC-175 acceptance contract; loosening would
//     silently mask a CC-SCORESI regression.
// ─────────────────────────────────────────────────────────────────────

function findCard(id: string): RoomReadCard {
  const c = CARDS.find((x) => x.id === id);
  if (!c) throw new Error(`card not found: ${id}`);
  return c;
}

function rankNames(card: RoomReadCard): { name: string; score: number }[] {
  return rankPlayersForCard(card, COHORT_PLAYERS).map((r) => ({
    name: r.player.playerId,
    score: Number(r.score.toFixed(3)),
  }));
}

check("si-card-keeps-si-anchors-above-ni-anchors", () => {
  const card = findCard("lens_history_quality_control");
  const ranked = rankNames(card);
  const positions = new Map<string, number>();
  ranked.forEach((r, i) => positions.set(r.name, i));
  const siWorstIdx = Math.max(
    ...SI_ANCHORS.map((n) => positions.get(n) ?? -1)
  );
  const niBestIdx = Math.min(...NI_ANCHORS.map((n) => positions.get(n) ?? -1));
  if (siWorstIdx >= niBestIdx) {
    return `Si anchors did NOT all outrank Ni anchors. Ranked: ${ranked
      .map((r) => `${r.name}=${r.score}`)
      .join(", ")}`;
  }
  return null;
});

check("ni-card-keeps-ni-anchors-above-si-anchors", () => {
  const card = findCard("lens_problem_behind_problem");
  const ranked = rankNames(card);
  const positions = new Map<string, number>();
  ranked.forEach((r, i) => positions.set(r.name, i));
  const niWorstIdx = Math.max(
    ...NI_ANCHORS.map((n) => positions.get(n) ?? -1)
  );
  const siBestIdx = Math.min(...SI_ANCHORS.map((n) => positions.get(n) ?? -1));
  if (niWorstIdx >= siBestIdx) {
    return `Ni anchors did NOT all outrank Si anchors. Ranked: ${ranked
      .map((r) => `${r.name}=${r.score}`)
      .join(", ")}`;
  }
  return null;
});

// scoreCardForPlayer is a pure sum — quick sanity on the math.
check("score-card-sum-matches-manual-calculation", () => {
  const fakePlayer: PlayerGameSignals = {
    playerId: "test",
    displayName: "Test",
    signals: { pattern_reader: 0.8, deep_seeing: 0.6, long_arc_thinking: 0.5 },
  };
  const card = findCard("lens_problem_behind_problem");
  // weights: pattern_reader 1.0, deep_seeing 0.6, long_arc_thinking 0.4
  const expected = 0.8 * 1.0 + 0.6 * 0.6 + 0.5 * 0.4;
  const actual = scoreCardForPlayer(card, fakePlayer);
  if (Math.abs(actual - expected) > 1e-9) {
    return `expected ${expected}, got ${actual}`;
  }
  return null;
});

// ─────────────────────────────────────────────────────────────────────
// 3 · player + round validation rejects out-of-range
// ─────────────────────────────────────────────────────────────────────

function makeStubPlayer(id: string): PlayerGameSignals {
  // Tiny variance so the engine can rank them; doesn't matter for the
  // validation tests, just for the generation test below.
  return {
    playerId: id,
    displayName: id,
    signals: {
      pattern_reader: 0.5 + Math.random() * 0.1,
      precedent_memory: 0.5 + Math.random() * 0.1,
      possibility_finder: 0.5 + Math.random() * 0.1,
      truth_teller: 0.5,
      loyalty: 0.5,
      practical_order: 0.5,
      protective_care: 0.5,
      responsibility_load: 0.5,
      connector: 0.5,
      structurer: 0.5,
      calm_containment: 0.5,
      crisis_action: 0.5,
      aim_governance: 0.5,
      intensity: 0.5,
      steadiness: 0.5,
      meaning_making: 0.5,
      conviction: 0.5,
      cost_bearing: 0.5,
      faith_truth_loyalty: 0.5,
      high_conscientiousness: 0.5,
      perfection_pressure: 0.5,
      useful_devotion: 0.5,
      mission_permission_grip: 0.5,
      competence_mask: 0.5,
      hidden_burden: 0.5,
      burden_responsibility_grip: 0.5,
      being_needed_grip: 0.5,
      relational_repair: 0.5,
      high_agreeableness_spine: 0.5,
      discernment: 0.5,
      long_arc_thinking: 0.5,
      boundary_awareness: 0.5,
      security_grip: 0.5,
      belonging_approval_grip: 0.5,
      control_certainty_grip: 0.5,
      faithful_reliability: 0.5,
      future_awareness: 0.5,
      deep_seeing: 0.5,
      emotional_perception: 0.5,
      improviser: 0.5,
      emotional_containment: 0.5,
      social_warmth: 0.5,
      service_orientation: 0.5,
      quiet_sacrifice: 0.5,
      technical_reasoning: 0.5,
      verbal_processing: 0.5,
      high_openness: 0.5,
      risk_tolerance: 0.5,
      freedom_grip: 0.5,
      control_mastery_grip: 0.5,
      control_containment_grip: 0.5,
    },
  };
}

check("validates-player-count-min", () => {
  const players = Array.from({ length: ROOM_READ_LIMITS.MIN_PLAYERS - 1 }, (_, i) =>
    makeStubPlayer(`p${i}`)
  );
  let threw = false;
  try {
    generateRoomReadGame({ players, roundCount: 4, mode: "classic" });
  } catch {
    threw = true;
  }
  return threw ? null : "expected throw on below-min players";
});

check("validates-player-count-max", () => {
  const players = Array.from({ length: ROOM_READ_LIMITS.MAX_PLAYERS + 1 }, (_, i) =>
    makeStubPlayer(`p${i}`)
  );
  let threw = false;
  try {
    generateRoomReadGame({ players, roundCount: 4, mode: "classic" });
  } catch {
    threw = true;
  }
  return threw ? null : "expected throw on above-max players";
});

check("validates-round-count-min", () => {
  const players = Array.from({ length: ROOM_READ_LIMITS.MIN_PLAYERS }, (_, i) =>
    makeStubPlayer(`p${i}`)
  );
  let threw = false;
  try {
    generateRoomReadGame({
      players,
      roundCount: ROOM_READ_LIMITS.MIN_ROUNDS - 1,
      mode: "classic",
    });
  } catch {
    threw = true;
  }
  return threw ? null : "expected throw on below-min rounds";
});

check("validates-round-count-max", () => {
  const players = Array.from({ length: ROOM_READ_LIMITS.MIN_PLAYERS }, (_, i) =>
    makeStubPlayer(`p${i}`)
  );
  let threw = false;
  try {
    generateRoomReadGame({
      players,
      roundCount: ROOM_READ_LIMITS.MAX_ROUNDS + 1,
      mode: "classic",
    });
  } catch {
    threw = true;
  }
  return threw ? null : "expected throw on above-max rounds";
});

// ─────────────────────────────────────────────────────────────────────
// 4 · 8-round game generates 8 rounds, one card each, no duplicates,
//     Journey order
// ─────────────────────────────────────────────────────────────────────

check("8-round-game-shape", () => {
  const players = Array.from({ length: 5 }, (_, i) => makeStubPlayer(`p${i}`));
  const game = generateRoomReadGame({
    players,
    roundCount: 8,
    mode: "classic",
  });
  if (game.rounds.length !== 8) return `expected 8 rounds, got ${game.rounds.length}`;
  const cardIds = new Set<string>();
  for (const r of game.rounds) {
    if (cardIds.has(r.card.id)) return `duplicate card id: ${r.card.id}`;
    cardIds.add(r.card.id);
  }
  for (let i = 0; i < 8; i++) {
    const expected = BODY_CARD_ORDER[i];
    if (game.rounds[i].theme !== expected) {
      return `round ${i + 1} expected theme=${expected}, got ${game.rounds[i].theme}`;
    }
    if (game.rounds[i].roundNumber !== i + 1) {
      return `round ${i + 1} has roundNumber=${game.rounds[i].roundNumber}`;
    }
  }
  return null;
});

// ─────────────────────────────────────────────────────────────────────
// 5 · getRoomWinner — plurality + tie behavior
// ─────────────────────────────────────────────────────────────────────

check("room-winner-plurality", () => {
  const winner = getRoomWinner(["a", "a", "b", "a", "c"]);
  return winner === "a" ? null : `expected "a", got ${winner}`;
});

check("room-winner-tie-returns-undefined", () => {
  const winner = getRoomWinner(["a", "a", "b", "b"]);
  return winner === undefined ? null : `expected undefined, got ${winner}`;
});

check("room-winner-empty-returns-undefined", () => {
  const winner = getRoomWinner([]);
  return winner === undefined ? null : `expected undefined, got ${winner}`;
});

// ─────────────────────────────────────────────────────────────────────
// 6 · calculateCardScores — perfect-read + max-5 ceiling
// ─────────────────────────────────────────────────────────────────────

check("score-perfect-read", () => {
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedPlayerId: "alice",
    roomWinnerPlayerId: "alice",
    enginePick: fakeEnginePick("alice", false),
  });
  if (!s.matchedEngine || !s.matchedRoom || !s.perfectRead) {
    return `flags wrong: ${JSON.stringify(s)}`;
  }
  if (s.points !== 5) return `expected 5 points, got ${s.points}`;
  return null;
});

check("score-engine-only", () => {
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedPlayerId: "alice",
    roomWinnerPlayerId: "bob",
    enginePick: fakeEnginePick("alice", false),
  });
  if (s.matchedRoom || s.perfectRead) return `room/perfect set wrongly: ${JSON.stringify(s)}`;
  if (s.points !== 2) return `expected 2 points, got ${s.points}`;
  return null;
});

check("score-room-only", () => {
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedPlayerId: "alice",
    roomWinnerPlayerId: "alice",
    enginePick: fakeEnginePick("bob", false),
  });
  if (s.matchedEngine || s.perfectRead) return `engine/perfect set wrongly: ${JSON.stringify(s)}`;
  if (s.points !== 2) return `expected 2 points, got ${s.points}`;
  return null;
});

check("score-zero-when-no-match", () => {
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedPlayerId: "alice",
    roomWinnerPlayerId: "bob",
    enginePick: fakeEnginePick("carol", false),
  });
  if (s.points !== 0) return `expected 0 points, got ${s.points}`;
  return null;
});

check("score-perfect-read-fires-only-when-all-three-match", () => {
  // guess == engine, but room had no consensus → perfect-read does NOT fire.
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedPlayerId: "alice",
    roomWinnerPlayerId: undefined,
    enginePick: fakeEnginePick("alice", false),
  });
  if (s.perfectRead) return `perfectRead should be false when room=undefined`;
  if (s.points !== 2) return `expected 2 points (engine only), got ${s.points}`;
  return null;
});

check("score-max-is-5", () => {
  // Stress: trying to construct a score > 5 should be impossible by
  // construction. The branches max at 2+2+1 = 5.
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedPlayerId: "alice",
    roomWinnerPlayerId: "alice",
    enginePick: fakeEnginePick("alice", false),
  });
  return s.points <= 5 ? null : `points exceeded 5: ${s.points}`;
});

// ─────────────────────────────────────────────────────────────────────
// 7 · verdict mapping
// ─────────────────────────────────────────────────────────────────────

check("verdict-obvious", () => {
  const v = getVerdict({
    roomWinnerPlayerId: "alice",
    enginePickPlayerId: "alice",
  });
  return v === "obvious" ? null : `got ${v}`;
});

check("verdict-human-override", () => {
  const v = getVerdict({
    roomWinnerPlayerId: "bob",
    enginePickPlayerId: "alice",
  });
  return v === "human_override" ? null : `got ${v}`;
});

check("verdict-identity-fog", () => {
  const v = getVerdict({
    roomWinnerPlayerId: undefined,
    enginePickPlayerId: "alice",
  });
  return v === "identity_fog" ? null : `got ${v}`;
});

// ─────────────────────────────────────────────────────────────────────
// CC-175.1 · split signal
// ─────────────────────────────────────────────────────────────────────

check("split-fires-on-near-tie-card", () => {
  // Construct two players whose scores on a 1.0-weight tag are within
  // SPLIT_EPS. The card weights pattern_reader at 1.0, so signal=0.4
  // vs 0.42 (gap=0.02 < SPLIT_EPS=0.03) gives a near-tie.
  const card = findCard("lens_problem_behind_problem");
  const players: PlayerGameSignals[] = [
    { playerId: "alpha", displayName: "Alpha", signals: { pattern_reader: 0.42 } },
    { playerId: "beta", displayName: "Beta", signals: { pattern_reader: 0.4 } },
    { playerId: "gamma", displayName: "Gamma", signals: { pattern_reader: 0.1 } },
    { playerId: "delta", displayName: "Delta", signals: { pattern_reader: 0.0 } },
  ];
  const pick = getEnginePick(card, players);
  if (!pick.isSplit) {
    return `expected isSplit=true (gap=${pick.score - (pick.runnerUp?.score ?? 0)}, SPLIT_EPS=${SPLIT_EPS})`;
  }
  return null;
});

check("split-stays-false-on-clear-card", () => {
  const card = findCard("lens_problem_behind_problem");
  const players: PlayerGameSignals[] = [
    { playerId: "alpha", displayName: "Alpha", signals: { pattern_reader: 0.9 } },
    { playerId: "beta", displayName: "Beta", signals: { pattern_reader: 0.3 } },
    { playerId: "gamma", displayName: "Gamma", signals: { pattern_reader: 0.2 } },
    { playerId: "delta", displayName: "Delta", signals: { pattern_reader: 0.1 } },
  ];
  const pick = getEnginePick(card, players);
  if (pick.isSplit) return `expected isSplit=false (gap=${pick.score - (pick.runnerUp?.score ?? 0)})`;
  return null;
});

// ─────────────────────────────────────────────────────────────────────
// CC-175.1 · split scoring + "both" tile
// ─────────────────────────────────────────────────────────────────────

check("split-both-vote-scores-plus-3", () => {
  // Split card, room had no consensus (Identity Fog). Voter played
  // "both" — should earn +3 (splitRead).
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedSpecial: "both",
    roomWinnerPlayerId: undefined,
    enginePick: fakeEnginePick("alice", true),
  });
  if (!s.splitRead) return `splitRead should be true, got ${JSON.stringify(s)}`;
  if (s.matchedEngine) return `matchedEngine should be false on a split`;
  if (s.perfectRead) return `perfectRead should not stack on a split`;
  if (s.points !== 3) return `expected 3 points, got ${s.points}`;
  return null;
});

check("non-split-both-vote-scores-zero", () => {
  // Same "both" guess on a non-split card → 0 (engine had a clear pick).
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedSpecial: "both",
    roomWinnerPlayerId: "alice",
    enginePick: fakeEnginePick("alice", false),
  });
  if (s.splitRead) return `splitRead should be false on non-split`;
  if (s.points !== 0) return `expected 0 points, got ${s.points}`;
  return null;
});

check("split-room-also-both-scores-5", () => {
  // Split card + voter plays "both" + room plurality is also "both"
  // → +3 (splitRead) + +2 (room match) = 5. perfect-read +1 does NOT
  // double-count (engine-match doesn't apply on a split).
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedSpecial: "both",
    roomWinnerPlayerId: ROOM_WINNER_BOTH_SENTINEL,
    enginePick: fakeEnginePick("alice", true),
  });
  if (!s.splitRead) return `splitRead should be true`;
  if (!s.matchedRoom) return `matchedRoom should be true (room=both)`;
  if (s.perfectRead) return `perfectRead must not fire on split (engine-match doesn't apply)`;
  if (s.points !== 5) return `expected 5 points (3+2), got ${s.points}`;
  return null;
});

check("split-nobody-vote-scores-zero", () => {
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedSpecial: "nobody",
    roomWinnerPlayerId: ROOM_WINNER_BOTH_SENTINEL,
    enginePick: fakeEnginePick("alice", true),
  });
  if (s.splitRead) return `splitRead should be false on "nobody"`;
  if (s.points !== 0) return `expected 0 points, got ${s.points}`;
  return null;
});

check("split-player-id-guess-scores-zero", () => {
  // Voting a specific player on a split card scores 0 — no engine pick
  // to match on a split. (UI/CC-177 may surface a "we couldn't say —
  // both" hint to nudge toward the both tile.)
  const s = calculateCardScores({
    voterPlayerId: "v",
    guessedPlayerId: "alice",
    roomWinnerPlayerId: "alice",
    enginePick: fakeEnginePick("alice", true),
  });
  if (s.points !== 0) return `expected 0 points, got ${s.points}`;
  return null;
});

// ─────────────────────────────────────────────────────────────────────
// CC-175.1 · getRoomWinner with "both" tile
// ─────────────────────────────────────────────────────────────────────

check("room-winner-both-plurality-returns-sentinel", () => {
  const winner = getRoomWinner([
    { kind: "special", value: "both" },
    { kind: "special", value: "both" },
    { kind: "special", value: "both" },
    { kind: "player", playerId: "alice" },
    { kind: "player", playerId: "bob" },
  ]);
  return winner === ROOM_WINNER_BOTH_SENTINEL
    ? null
    : `expected ROOM_WINNER_BOTH_SENTINEL, got ${winner}`;
});

check("room-winner-both-vs-player-tie-returns-undefined", () => {
  const winner = getRoomWinner([
    { kind: "special", value: "both" },
    { kind: "special", value: "both" },
    { kind: "player", playerId: "alice" },
    { kind: "player", playerId: "alice" },
  ]);
  return winner === undefined ? null : `expected undefined (tie), got ${winner}`;
});

check("room-winner-nobody-votes-ignored-for-plurality", () => {
  // "nobody" votes are intentionally NOT counted toward plurality —
  // they're votable for UX but carry no engine signal in MVP. Alice
  // wins 2-1 over the bob-vote; the two "nobody" votes don't matter.
  const winner = getRoomWinner([
    { kind: "player", playerId: "alice" },
    { kind: "player", playerId: "alice" },
    { kind: "player", playerId: "bob" },
    { kind: "special", value: "nobody" },
    { kind: "special", value: "nobody" },
  ]);
  return winner === "alice" ? null : `expected "alice", got ${winner}`;
});

// ─────────────────────────────────────────────────────────────────────
// CC-175.1 · selection tuning (coverage + tension)
// ─────────────────────────────────────────────────────────────────────

check("tension-weight-tent-function", () => {
  // Peaks in the debatable band; tapers to 0 outside.
  const probes: [number, number][] = [
    [0, 0], // dead-heat (split territory)
    [0.04, 1], // band start — peak
    [0.07, 1], // mid-band
    [0.10, 1], // band end — peak
    [0.20, 0], // far edge
    [0.30, 0], // beyond far — blowout
  ];
  const tol = 1e-9;
  for (const [gap, expected] of probes) {
    const got = tensionWeight(gap);
    if (Math.abs(got - expected) > tol) {
      return `tensionWeight(${gap})=${got}, expected ${expected}`;
    }
  }
  return null;
});

check("selection-spreads-targets-across-cohort", () => {
  // 8-round game over the 5-anchor cohort: at least min(8, players)=5
  // distinct engine targets when the card library allows it.
  // (Some themes/cards will inevitably re-target the strongest match
  // for that theme, but the soft-coverage penalty should keep the
  // spread wide.)
  const game = generateRoomReadGame({
    players: COHORT_PLAYERS,
    roundCount: 8,
    mode: "classic",
  });
  const distinctTargets = new Set(game.rounds.map((r) => r.enginePick.playerId));
  if (distinctTargets.size < Math.min(8, COHORT_PLAYERS.length)) {
    return `distinct targets=${distinctTargets.size}, expected ≥ ${Math.min(8, COHORT_PLAYERS.length)}: ${[...distinctTargets].join(", ")}`;
  }
  return null;
});

check("selection-avoids-blowout-when-tense-alternative-exists", () => {
  // For each generated round, if the cohort has a debatable card in
  // the same theme AND another card with a 1.0-vs-0 blowout, the
  // tension bonus should keep the selector off the blowout. We assert
  // softly: no round in the cohort-real generated game has a 1.0-vs-0
  // exact-blowout gap (i.e. score >= 1.0 with runnerUp.score === 0)
  // when the card library has alternatives for that theme.
  //
  // CC-ROOMREAD-EVEN-DISTRIBUTION — selection now computes the engine
  // pick against the eligible (under-served) sub-pool, not the full
  // player pool. In late rounds the sub-pool can legitimately shrink
  // to a single player (e.g. 5p/8r cap=2, last round's under-served
  // tier is the lone player still below cap). When the sub-pool has
  // only one player, `getEnginePick` returns no runner-up by
  // construction — that's not a one-sided card "blowout" in the
  // CC-175.1 sense, it's the quota's natural floor. Skip rounds with
  // a missing runner-up so the assertion catches genuine blowouts
  // (multi-player sub-pool, top >= 1.0, runner-up = 0).
  const game = generateRoomReadGame({
    players: COHORT_PLAYERS,
    roundCount: 8,
    mode: "classic",
  });
  const blowouts: string[] = [];
  for (const r of game.rounds) {
    if (r.enginePick.runnerUp === undefined) continue;
    const top = r.enginePick.score;
    const ru = r.enginePick.runnerUp.score;
    if (top >= 1.0 && ru === 0) blowouts.push(`${r.theme}:${r.card.id}`);
  }
  return blowouts.length === 0
    ? null
    : `blowout rounds (1.0-vs-0) detected: ${blowouts.join(", ")}`;
});

// ─────────────────────────────────────────────────────────────────────
// CC-ROOMREAD-EVEN-DISTRIBUTION · hard quota (replaces CC-175.1 nudge)
// ─────────────────────────────────────────────────────────────────────
//
// The acceptance is "engine-pick targets divide as evenly as possible":
// with P players and R rounds, each player is targeted floor(R/P) or
// ceil(R/P) times — never "one player twice while another is zero."
// The tests cover four shape cases (4p/4r balanced + dominant-synth,
// 8r/4p, 5r/4p, 4r/6p) plus a fallback-events sanity check.

/** Tally helper — engine-pick playerId → count. */
function countByPlayer(
  game: ReturnType<typeof generateRoomReadGame>
): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of game.rounds) {
    m.set(r.enginePick.playerId, (m.get(r.enginePick.playerId) ?? 0) + 1);
  }
  return m;
}

/** Build a synthetic "dominant" player whose signal vector overpowers
 *  every card. Used to prove the quota is HARD (not a tunable nudge):
 *  even when one player would out-score everyone on every theme, the
 *  cap of `ceil(R/P)` still holds. */
function dominantSynthPlayer(playerId: string): PlayerGameSignals {
  const signals: Record<string, number> = {};
  for (const card of CARDS) {
    for (const t of card.tags) {
      signals[t.tag] = 1.0;
    }
  }
  return { playerId, displayName: playerId, signals };
}

check("even-distribution-4p-4r-balanced-exactly-one-each", () => {
  // 4 players × 4 rounds → cap = 1 per player. With the cohort-real
  // anchors as players, the quota gives every player exactly 1.
  const players = COHORT_PLAYERS.slice(0, 4);
  const game = generateRoomReadGame({
    players,
    roundCount: 4,
    mode: "classic",
  });
  const counts = countByPlayer(game);
  const tally = players
    .map((p) => `${p.playerId}=${counts.get(p.playerId) ?? 0}`)
    .join(", ");
  for (const p of players) {
    if ((counts.get(p.playerId) ?? 0) !== 1) {
      return `expected every player exactly 1; got ${tally}`;
    }
  }
  return null;
});

check("even-distribution-4p-4r-with-dominant-synth-still-exactly-one-each", () => {
  // The hard-quota proof: replace one cohort player with a synthetic
  // "all signals = 1.0" player who would win every quality rank. The
  // quota must still pin them to exactly 1 — otherwise we're back to
  // the soft-penalty nudge a dominant profile could out-score.
  const dom = dominantSynthPlayer("dom-synth");
  const players: PlayerGameSignals[] = [
    dom,
    ...COHORT_PLAYERS.slice(0, 3),
  ];
  const game = generateRoomReadGame({
    players,
    roundCount: 4,
    mode: "classic",
  });
  const counts = countByPlayer(game);
  const tally = players
    .map((p) => `${p.playerId}=${counts.get(p.playerId) ?? 0}`)
    .join(", ");
  if ((counts.get("dom-synth") ?? 0) !== 1) {
    return `dominant synth got ${counts.get("dom-synth") ?? 0} picks (expected 1, proving quota is hard): ${tally}`;
  }
  for (const p of players) {
    if ((counts.get(p.playerId) ?? 0) !== 1) {
      return `expected every player exactly 1; got ${tally}`;
    }
  }
  return null;
});

check("even-distribution-8r-4p-exactly-two-each", () => {
  // 8 rounds × 4 players → cap = 2. Each player exactly twice.
  const players = COHORT_PLAYERS.slice(0, 4);
  const game = generateRoomReadGame({
    players,
    roundCount: 8,
    mode: "classic",
  });
  const counts = countByPlayer(game);
  const tally = players
    .map((p) => `${p.playerId}=${counts.get(p.playerId) ?? 0}`)
    .join(", ");
  for (const p of players) {
    if ((counts.get(p.playerId) ?? 0) !== 2) {
      return `expected every player exactly 2; got ${tally}`;
    }
  }
  return null;
});

check("even-distribution-5r-4p-one-player-two-rest-one", () => {
  // 5 rounds × 4 players → cap = 2, floor = 1. Sorted counts must
  // be {2,1,1,1} — never {3,1,1,0} or {2,2,1,0}.
  const players = COHORT_PLAYERS.slice(0, 4);
  const game = generateRoomReadGame({
    players,
    roundCount: 5,
    mode: "classic",
  });
  const counts = countByPlayer(game);
  const sorted = players
    .map((p) => counts.get(p.playerId) ?? 0)
    .sort((a, b) => b - a);
  const expected = [2, 1, 1, 1];
  for (let i = 0; i < expected.length; i++) {
    if (sorted[i] !== expected[i]) {
      return `expected sorted counts [${expected.join(",")}]; got [${sorted.join(",")}]`;
    }
  }
  return null;
});

check("even-distribution-4r-6p-four-distinct-no-player-twice", () => {
  // 4 rounds × 6 players → cap = ceil(4/6) = 1, floor = 0. Best
  // possible: 4 distinct players each once, 2 players at zero.
  // The acceptance is the negative side: NO player gets 2.
  if (COHORT_PLAYERS.length < 5) {
    return `cohort fixture pool too small (${COHORT_PLAYERS.length}) — need ≥5 to top up to 6 players`;
  }
  const synth = dominantSynthPlayer("synth-6th");
  const players: PlayerGameSignals[] = [...COHORT_PLAYERS, synth];
  const game = generateRoomReadGame({
    players,
    roundCount: 4,
    mode: "classic",
  });
  const counts = countByPlayer(game);
  const distinct = new Set(game.rounds.map((r) => r.enginePick.playerId));
  const tally = players
    .map((p) => `${p.playerId}=${counts.get(p.playerId) ?? 0}`)
    .join(", ");
  if (distinct.size !== 4) {
    return `expected 4 distinct targets; got ${distinct.size} — ${tally}`;
  }
  for (const p of players) {
    if ((counts.get(p.playerId) ?? 0) > 1) {
      return `player ${p.playerId} got ${counts.get(p.playerId)} picks; cap should hold at 1 when P>R — ${tally}`;
    }
  }
  return null;
});

check("even-distribution-fallback-events-absent-on-cohort-steady-state", () => {
  // The card library has ~5 cards per theme; the fallback shouldn't
  // fire on the standard cohort + standard round counts. If it does,
  // it's a signal to broaden the library — record so the test fails
  // loudly when a future card edit narrows variety.
  const game = generateRoomReadGame({
    players: COHORT_PLAYERS,
    roundCount: 8,
    mode: "classic",
  });
  if (game.fallbackEvents && game.fallbackEvents.length > 0) {
    const events = game.fallbackEvents
      .map((e) => `R${e.roundNumber}:${e.theme}→${e.targetPlayerId}`)
      .join(", ");
    return `fallback fired unexpectedly on 5p/8r cohort: ${events} (broaden card library for the affected themes)`;
  }
  return null;
});

// ─────────────────────────────────────────────────────────────────────
// CC-ROOMREAD-EVEN-DISTRIBUTION · report tallies (4p/4r balanced
// vs one-dominant-synth — proof the quota holds in both cases)
// ─────────────────────────────────────────────────────────────────────

{
  console.log("\nCC-ROOMREAD-EVEN-DISTRIBUTION 4p/4r target tallies:");
  for (const label of ["balanced", "one-dominant-synth"] as const) {
    const players: PlayerGameSignals[] =
      label === "balanced"
        ? COHORT_PLAYERS.slice(0, 4)
        : [dominantSynthPlayer("dom-synth"), ...COHORT_PLAYERS.slice(0, 3)];
    try {
      const game = generateRoomReadGame({
        players,
        roundCount: 4,
        mode: "classic",
      });
      const counts = countByPlayer(game);
      const tally = players
        .map((p) => `${p.playerId}=${counts.get(p.playerId) ?? 0}`)
        .join(" / ");
      console.log(`  ${label.padEnd(20)} → ${tally}`);
      for (const r of game.rounds) {
        console.log(
          `    R${r.roundNumber} ${r.theme.padEnd(8)} ${r.card.id.padEnd(30)} → ${r.enginePick.playerId}`
        );
      }
      if (game.fallbackEvents && game.fallbackEvents.length > 0) {
        console.log(
          `    fallbacks: ${game.fallbackEvents
            .map((e) => `R${e.roundNumber}:${e.theme}→${e.targetPlayerId}`)
            .join(", ")}`
        );
      }
    } catch (e) {
      console.log(
        `  ${label} → failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Demo-cohort selection report (per CC-175.1 report-back)
// ─────────────────────────────────────────────────────────────────────

{
  // The spec asks for the 6-player demo cohort: Daniel, Cindy,
  // JasonDMcG, Connor, Ashley, Michele. We load them from
  // cohort-real fixtures and run an 8-round game to surface
  // per-round target + isSplit.
  const DEMO_NAMES = [
    "daniel",
    "cindy",
    "jason",
    "connor",
    "ashley",
    "michele",
  ];
  const demoPlayers = DEMO_NAMES.map(loadPlayer);
  try {
    const game = generateRoomReadGame({
      players: demoPlayers,
      roundCount: 8,
      mode: "classic",
    });
    console.log("\nCC-175.1 demo-cohort selection (6 players, 8 rounds):");
    for (const r of game.rounds) {
      const split = r.enginePick.isSplit ? "  [SPLIT]" : "";
      const gap = r.enginePick.runnerUp
        ? (r.enginePick.score - r.enginePick.runnerUp.score).toFixed(3)
        : "n/a";
      console.log(
        `  R${r.roundNumber} ${r.theme.padEnd(8)} ${r.card.id.padEnd(30)} → ${r.enginePick.playerId} (score=${r.enginePick.score.toFixed(3)}, gap=${gap})${split}`
      );
    }
    const distinct = new Set(game.rounds.map((r) => r.enginePick.playerId));
    console.log(
      `  → distinct targets: ${distinct.size}/${demoPlayers.length} — [${[...distinct].join(", ")}]`
    );
    const splitCount = game.rounds.filter((r) => r.enginePick.isSplit).length;
    console.log(`  → split rounds: ${splitCount}/${game.rounds.length}`);
  } catch (e) {
    console.log(
      `  (demo-cohort selection failed: ${e instanceof Error ? e.message : String(e)})`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Cohort sanity-check report (always prints, ahead of pass/fail summary)
// ─────────────────────────────────────────────────────────────────────

function printRanks(label: string, cardId: string) {
  const card = findCard(cardId);
  const ranked = rankNames(card);
  console.log(`\n${label} (${cardId}):`);
  ranked.forEach((r, i) => console.log(`  ${i + 1}. ${r.name}  score=${r.score}`));
}

console.log("CC-175 ROOM-READ-ENGINE-CORE — unit tests");
console.log("==========================================");
console.log("\nCohort sanity check (5 cohort-real anchors):");
printRanks("Si card: rank-by-precedent_memory", "lens_history_quality_control");
printRanks("Ni card: rank-by-pattern_reader", "lens_problem_behind_problem");

// ─────────────────────────────────────────────────────────────────────
// Print pass / fail summary
// ─────────────────────────────────────────────────────────────────────

console.log("\nResults:");
let failed = 0;
for (const r of results) {
  const status = r.ok ? "PASS" : "FAIL";
  const detail = r.detail ? ` — ${r.detail}` : "";
  console.log(`  [${status}] ${r.name}${detail}`);
  if (!r.ok) failed++;
}
console.log("");
if (failed > 0) {
  console.log(`AUDIT FAILED — ${failed}/${results.length} test(s) failed.`);
  process.exit(1);
}
console.log(`AUDIT PASSED — ${results.length}/${results.length} tests green.`);
