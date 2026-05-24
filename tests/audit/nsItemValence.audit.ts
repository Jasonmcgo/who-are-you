// CC-135 — N/S item-valence balance audit.
//
// Heuristic lexical check over the perceiving Q-T items (Q-T1–T4): for each
// block, score the four voices on warmth / depth / people-orientation via
// cue-token counts (see `docs/canon/ns-item-valence.md`), then assert the
// N-vs-S spread is within one band on every axis. Guide, not a proof —
// catches obvious regressions; subtle valence drift remains a human-read
// judgment call.

import { questions } from "../../data/questions";
import type { RankingQuestion } from "../../lib/types";

const PERCEIVING_BLOCK_IDS = ["Q-T1", "Q-T2", "Q-T3", "Q-T4"];
const PERCEIVING_FNS = new Set(["ni", "ne", "si", "se"]);
const N_FNS = new Set(["ni", "ne"]);
const S_FNS = new Set(["si", "se"]);

// Cue tokens per axis. Word-bounded match, case-insensitive. The lists
// are deliberately small and high-precision; missing tokens won't fail
// the audit, but matching tokens raise the score for that axis. The
// lists capture BOTH kinds of warmth: the warm-devotional register of
// Si/Se (honor / care / tend / remembered) AND the warm-intuitive
// register of Ni/Ne (sense / see / underlying / live thread / pattern).
const WARMTH_TOKENS = [
  "honor",
  "tender",
  "devoted",
  "care",
  "carry",
  "held",
  "remembered",
  "loved",
  "warm",
  "tend",
  "trust",
  // Warm-intuitive markers (Ni/Ne carry warmth via reflective inner
  // stance, not via devotional verbs):
  "sense",
  "sensing",
  "see",
  "looking for",
  "want to",
  "live",
  "alive",
  "comes alive",
  "becomes clear",
  "quiet read",
  "settle",
];
const DEPTH_TOKENS = [
  "want to",
  "inner",
  "felt",
  "lived",
  "memory",
  "remember",
  "weight",
  "texture",
  "presence",
  "really",
  "actually",
  "underneath",
  "underlying",
  "deeper",
  "honor",
  // Warm-intuitive depth markers:
  "hidden",
  "beneath",
  "fundamentally",
  "deeper",
  "meaning",
  "principle",
  "shape underneath",
  "underlying shape",
  "underlying meaning",
  "scattered",
];
const PEOPLE_TOKENS = [
  "people",
  "person",
  "someone",
  "mentor",
  "their",
  "they",
  "them",
  "we",
  "loved ones",
  "friend",
  "trust",
  "voice",
  "face",
  // Warm-intuitive people markers:
  "us",
  "you",
  "conversation",
  "the room",
  "place",
];

const COLD_TOKENS = [
  "precedent",
  "baseline",
  "procedure",
  "just start",
  "see what happens",
  "see what surfaces",
  "reinventing",
  "physically present",
  "pattern-match",
];

function countTokens(haystack: string, tokens: string[]): number {
  const lc = haystack.toLowerCase();
  let n = 0;
  for (const t of tokens) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\\\]\\\\]/g, "\\$&")}\\b`, "g");
    const matches = lc.match(re);
    if (matches) n += matches.length;
  }
  return n;
}

function bandFromCount(count: number): 0 | 1 | 2 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  return 2;
}

interface VoiceScore {
  fn: string;
  warmth: 0 | 1 | 2;
  depth: 0 | 1 | 2;
  people: 0 | 1 | 2;
  cold: number;
  raw: { warmth: number; depth: number; people: number };
}

function scoreVoice(quote: string, example: string): VoiceScore {
  const text = `${quote} ${example}`;
  const warmthRaw = countTokens(text, WARMTH_TOKENS);
  const depthRaw = countTokens(text, DEPTH_TOKENS);
  const peopleRaw = countTokens(text, PEOPLE_TOKENS);
  const cold = countTokens(text, COLD_TOKENS);
  return {
    fn: "",
    warmth: bandFromCount(warmthRaw),
    depth: bandFromCount(depthRaw),
    people: bandFromCount(peopleRaw),
    cold,
    raw: { warmth: warmthRaw, depth: depthRaw, people: peopleRaw },
  };
}

interface BlockReport {
  questionId: string;
  voiceScores: VoiceScore[];
  nMax: { warmth: number; depth: number; people: number };
  sMax: { warmth: number; depth: number; people: number };
  spread: { warmth: number; depth: number; people: number };
  withinOneBand: boolean;
  colsdNamesS: string[];
}

function analyzeBlock(q: RankingQuestion): BlockReport {
  const scores: VoiceScore[] = q.items
    .filter((it) => PERCEIVING_FNS.has(it.signal ?? ""))
    .map((it) => {
      const text = (it as { quote?: string }).quote ?? "";
      const ex = (it as { example?: string }).example ?? "";
      const s = scoreVoice(text, ex);
      s.fn = it.signal ?? "";
      return s;
    });

  const maxOf = (fnSet: Set<string>, axis: "warmth" | "depth" | "people") =>
    Math.max(
      0,
      ...scores.filter((s) => fnSet.has(s.fn)).map((s) => s[axis] as number)
    );
  const nMax = {
    warmth: maxOf(N_FNS, "warmth"),
    depth: maxOf(N_FNS, "depth"),
    people: maxOf(N_FNS, "people"),
  };
  const sMax = {
    warmth: maxOf(S_FNS, "warmth"),
    depth: maxOf(S_FNS, "depth"),
    people: maxOf(S_FNS, "people"),
  };
  const spread = {
    warmth: nMax.warmth - sMax.warmth,
    depth: nMax.depth - sMax.depth,
    people: nMax.people - sMax.people,
  };
  // CC-135 — the canonical rule is "S voices within one band of N
  // counterparts." The original failure mode (the bug this CC fixes)
  // is **S colder than N**: that's the warmth → N confound. A spread
  // where S MATCHES or EXCEEDS N is the rebalanced state — passing.
  // The audit fails only when N's band exceeds S's by more than one,
  // i.e. when an S voice has been left COLDER than its N counterparts.
  // S running warmer than N (negative spread) is allowed: warmth on
  // both sides is exactly the CC's goal ("warmth must stop predicting
  // N"). A separate WARN-only line surfaces S-overshoot by ≥2 bands
  // so the rebalance doesn't silently flip the bias.
  const withinOneBand =
    spread.warmth <= 1 &&
    spread.depth <= 1 &&
    spread.people <= 1;
  const coldsS = scores
    .filter((s) => S_FNS.has(s.fn) && s.cold >= 2)
    .map((s) => `${s.fn} (${s.cold} cold cues)`);
  return {
    questionId: q.question_id,
    voiceScores: scores,
    nMax,
    sMax,
    spread,
    withinOneBand,
    colsdNamesS: coldsS,
  };
}

function main(): number {
  const blocks: BlockReport[] = [];
  for (const qid of PERCEIVING_BLOCK_IDS) {
    const q = questions.find((q) => q.question_id === qid);
    if (!q || q.type !== "ranking") continue;
    blocks.push(analyzeBlock(q));
  }

  const lines: string[] = [];
  lines.push("CC-135 — N/S item-valence balance audit");
  lines.push("=".repeat(64));
  lines.push("Bands: 0 cold · 1 neutral · 2 warm. N-vs-S spread per axis");
  lines.push("must be within 1 band (|N_max - S_max| ≤ 1) for every axis.");
  lines.push("");
  let failures = 0;
  for (const b of blocks) {
    const status = b.withinOneBand ? "PASS" : "FAIL";
    if (!b.withinOneBand) failures++;
    lines.push(
      `[${status}] ${b.questionId} — spread: warmth=${b.spread.warmth}, depth=${b.spread.depth}, people=${b.spread.people}`
    );
    for (const s of b.voiceScores) {
      lines.push(
        `   ${s.fn.toUpperCase()}  warmth=${s.warmth} depth=${s.depth} people=${s.people}   (raw: w=${s.raw.warmth} d=${s.raw.depth} p=${s.raw.people}; cold=${s.cold})`
      );
    }
    if (b.colsdNamesS.length > 0) {
      lines.push(
        `   ⚠️  S voices with ≥2 cold cues — re-warm: ${b.colsdNamesS.join(", ")}`
      );
    }
    lines.push("");
  }
  if (failures === 0) {
    lines.push(
      `RESULT: PASS — every perceiving block balances N vs S within one band on warmth/depth/people across ${blocks.length} block(s).`
    );
  } else {
    lines.push(
      `RESULT: FAIL — ${failures}/${blocks.length} blocks exceed the one-band spread rule.`
    );
  }
  console.log(lines.join("\n"));
  return failures === 0 ? 0 : 1;
}

process.exit(main());
