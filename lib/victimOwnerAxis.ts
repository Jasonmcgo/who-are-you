// CC-VO-EXTRACTOR-AND-COMPOSER — Victim/Owner axis composer (Layer 1+2).
//
// Per `feedback_victim_owner_axis_gsag.md`:
//   Victim ↔ Owner is a Locus of Control axis that composes into
//   Goal/Soul/Aim/Grip directly. Not a personality dimension —
//   engine spine. Victim verbs (try / should / want-to) → heavy Grip
//   contribution. Owner verbs (do / commit / Knowledge-pursue) →
//   strong Aim contribution. Goal/Soul movement is gated by victim
//   weight.
//
// This module is SCAFFOLDING ONLY. It produces a `VictimOwnerReading`
// on the constitution. Wiring the score into Grip / Aim / Movement
// engine math is deferred to CC-VO-WIRING (Layer 3).
//
// Pure derivation — no API calls, no `node:*` imports.

import type {
  CanonPredictedRegister,
  IdentityFreeform,
  InnerConstitution,
  RegisterTension,
  Signal,
  VictimOwnerEvidence,
  VictimOwnerReading,
  VictimOwnerRegister,
} from "./types";

// ─────────────────────────────────────────────────────────────────────
// Layer 1 — Q-I1 / Q-I1b verb register extraction
// ─────────────────────────────────────────────────────────────────────
//
// Regex patterns per `feedback_victim_owner_axis_gsag.md` verb-register
// table. Matches are case-insensitive; word-boundary anchored. Each
// match contributes +1 to the per-answer count (capped at 5 for the
// heaviest cases; the cap prevents runaway scoring from very long
// belief paragraphs).
//
// Known imprecision flagged for CC-VO-CALIBRATION:
//   - "hope": only `hope to + INFINITIVE` form fires. "hope in Christ"
//     (Faith-context noun phrase) does NOT fire. Regex isolates this
//     correctly.
//   - "can't": treated as victim by default. Some users say "I can't
//     compromise on this" (owner-register refusal); refining requires
//     dependency parse-light, deferred to V/O-CALIBRATION.

const OWNER_VERB_PATTERNS: RegExp[] = [
  /\b(do|did|does|doing)\b/i,
  /\b(will|i'll|i will)\b/i,
  /\b(am|i'm|i am)\b/i,
  /\b(commit|commits|committed|committing)\b/i,
  /\b(chose|chosen|choosing|choose)\b/i,
  /\b(believe|believed|believing)\b/i,
  /\b(stand|stood|standing)\b/i,
  /\b(refuse|refused|refusing)\b/i,
  /\b(bear|bears|bearing|bore|borne)\b/i,
  /\b(pursue|pursues|pursued|pursuing)\b/i,
];

const VICTIM_VERB_PATTERNS: RegExp[] = [
  /\b(try|tries|tried|trying)\b/i,
  /\b(should|shouldn't|should not)\b/i,
  /\b(want to|wanted to|wanting to)\b/i,
  /\b(need to|needed to|needing to)\b/i,
  /\b(if only|i wish)\b/i,
  /\b(they made me|they make me|forced me)\b/i,
  /\b(because of them|because of him|because of her)\b/i,
  /\b(can't|cannot|couldn't|could not)\b/i,
  /\b(hope to|hoping to)\b/i,
];

const VERB_COUNT_CAP = 5;

function countMatches(text: string, patterns: RegExp[]): number {
  let total = 0;
  for (const pat of patterns) {
    const matches = text.match(pat);
    if (matches) total += matches.length;
  }
  return Math.min(total, VERB_COUNT_CAP);
}

export function extractIdentityFreeform(
  constitution: InnerConstitution
): IdentityFreeform {
  // Q-I1 belief text lives at `belief_under_tension.belief_text`. The
  // engine populates either from Q-I1 or Q-I1b (see
  // `belief_source_question_id`). We surface both fields for downstream
  // disambiguation, but the count regexes run only against whichever
  // populated source.
  const belief = constitution.belief_under_tension;
  const q_i1_text =
    belief?.belief_source_question_id === "Q-I1" ? belief.belief_text : null;
  const q_i1b_text =
    belief?.belief_source_question_id === "Q-I1b" ? belief.belief_text : null;
  const sourceText = belief?.belief_text ?? "";
  return {
    q_i1_text,
    q_i1b_text,
    owner_verb_count: countMatches(sourceText, OWNER_VERB_PATTERNS),
    victim_verb_count: countMatches(sourceText, VICTIM_VERB_PATTERNS),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Layer 2 — Composer
// ─────────────────────────────────────────────────────────────────────
//
// Composes a 0-100 score from canon-anchored components. Every weight
// is documented inline with its `feedback_victim_owner_axis_gsag.md`
// source. Score formula: start at 50 (neutral), add owner contributions,
// subtract victim contributions, clamp to [0, 100].

function has(signals: Signal[], id: string): boolean {
  return signals.some((s) => s.signal_id === id);
}

// CC-VO-EXTRACTOR-AND-COMPOSER — top-ranked gate.
// Ranking questions (Q-V1, Q-GS1, Q-O2) emit signals at ranks 1..N for
// EVERY option the user ranked. Without a rank gate, every fixture
// fires every victim-coded ranking-source signal regardless of where
// the user actually placed it. Gate: only count when rank <= 2 (the
// signal landed in the user's top-2 for its source question).
function hasInTopRank(signals: Signal[], id: string, maxRank: number): boolean {
  return signals.some(
    (s) => s.signal_id === id && (s.rank ?? 99) <= maxRank
  );
}

function topSignalIdsByRank(
  signals: Signal[],
  suffix: string,
  topN: number
): string[] {
  return signals
    .filter((s) => s.signal_id.endsWith(suffix))
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, topN)
    .map((s) => s.signal_id);
}

function compassTopIncludes(
  signals: Signal[],
  needles: string[],
  topN: number
): boolean {
  const top = topSignalIdsByRank(signals, "_priority", topN).filter((id) =>
    /^[a-z_]+_priority$/.test(id)
  );
  return needles.some((needle) =>
    top.some((id) => id.startsWith(`${needle}_`))
  );
}

function blameLensTopIs(
  signals: Signal[],
  needle: "individual" | "authority" | "system" | "nature" | "supernatural"
): boolean {
  const top = topSignalIdsByRank(signals, "_responsibility_priority", 1)[0];
  return top === `${needle}_responsibility_priority`;
}

function blameLensIncludesInTopN(
  signals: Signal[],
  needle: "individual" | "authority" | "system" | "nature" | "supernatural",
  topN: number
): boolean {
  const top = topSignalIdsByRank(signals, "_responsibility_priority", topN);
  return top.includes(`${needle}_responsibility_priority`);
}

// CC-VO-EXTRACTOR-AND-COMPOSER — Q-I3 cost-surface count.
// Q-I3 is multiselect_derived from Q-Stakes1; selected items emit
// signals whose `source_question_ids` includes "Q-I3" (per
// signalsFromMultiSelectDerived in lib/identityEngine.ts:606). The
// signal_id matches the Q-Stakes1 item (e.g., `close_relationships`,
// `reputation`). Count distinct signal_ids whose source includes Q-I3.
// 4+ = wide cost surface (owner). 0 = refusal (victim).
function costSurfaceCount(signals: Signal[]): number {
  const ids = new Set<string>();
  for (const s of signals) {
    if (s.source_question_ids?.includes("Q-I3")) {
      ids.add(s.signal_id);
    }
  }
  return ids.size;
}

// Hypocrisy panel — when 2+ entries fire (named-vs-paid gap across
// values), pull victim. CC-090's `blindSpots` field is the read.
function hypocrisyEntryCount(constitution: InnerConstitution): number {
  return constitution.blindSpots?.length ?? 0;
}

export function composeVictimOwner(
  constitution: InnerConstitution,
  identityFreeform: IdentityFreeform
): VictimOwnerReading {
  const signals = constitution.signals;
  let score = 50; // neutral start
  const ownerSignals: string[] = [];
  const victimSignals: string[] = [];
  const rationaleParts: string[] = [];

  // ── Verb register (Layer 1 inputs) ─────────────────────────────
  // Per `feedback_victim_owner_axis_gsag.md` verb table. Owner verbs
  // shift toward owner (×4); victim verbs shift toward victim (×4).
  // Capped at strength 5 → max ±20 per side.
  const ownerVerb = identityFreeform.owner_verb_count * 4;
  const victimVerb = identityFreeform.victim_verb_count * 4;
  score += ownerVerb - victimVerb;
  if (ownerVerb > 0)
    rationaleParts.push(
      `owner verbs +${ownerVerb} (${identityFreeform.owner_verb_count} matches)`
    );
  if (victimVerb > 0)
    rationaleParts.push(
      `victim verbs -${victimVerb} (${identityFreeform.victim_verb_count} matches)`
    );

  // ── Q-C4 blame attribution ─────────────────────────────────────
  // Per the CC-097B-CALIBRATION-V2 blame-lens mapping +
  // `feedback_blame_lens_disc_mapping.md`: Individual + high-A is the
  // canonical owner conviction signature; Authority/System without
  // Individual in top-3 is the victim deflection signature.
  const oceanA =
    constitution.ocean?.dispositionSignalMix?.intensities?.agreeableness ?? 0;
  if (blameLensTopIs(signals, "individual") && oceanA >= 70) {
    score += 15;
    rationaleParts.push("Q-C4 Individual+A>=70 +15 owner");
  }
  const blameAuthSystem =
    (blameLensTopIs(signals, "authority") ||
      blameLensTopIs(signals, "system")) &&
    !blameLensIncludesInTopN(signals, "individual", 3);
  if (blameAuthSystem) {
    score -= 10;
    rationaleParts.push("Q-C4 Authority/System (no Individual top-3) -10");
  }

  // ── Q-I3 cost surface ───────────────────────────────────────────
  // Wide surface = owner. The "0 = victim" rule fires ONLY when the
  // user explicitly selected "none of these" (`belief_no_cost_named`
  // emit per lib/identityEngine.ts:1256). When Q-I3 wasn't answered
  // (most cohort fixtures), the cost component is neutral — we don't
  // have signal to read.
  const cost = costSurfaceCount(signals);
  if (cost >= 4) {
    score += 10;
    rationaleParts.push(`cost surface ${cost}/5 +10 owner`);
  } else if (has(signals, "belief_no_cost_named")) {
    score -= 15;
    rationaleParts.push("Q-I3 'none of these' -15 victim");
  }

  // ── Existing victim-coded signals ──────────────────────────────
  // Per the CC-VO canon: 7 victim-coded signals already exist in the
  // engine but are uncomposed. Compose them.
  //
  // RANK GATE per CC-VO-EXTRACTOR-AND-COMPOSER Layer 2 wiring fix:
  // Ranking-source signals (Q-V1, Q-GS1, Q-O2) emit at ranks 1..N for
  // every option. Without a top-rank guard, every fixture fires every
  // option's signal regardless of where the user ranked it. Gate
  // ranking-source signals to top-2 (rank <= 2). Forced-choice and
  // freeform-derived signals (Q-P1, Q-P2 picks) fire as-is — they're
  // singular per question.
  //   [signal_id, weight, kind]
  //   kind="rank": gated by hasInTopRank
  //   kind="fire": gated by has (forced-choice / freeform-emit)
  type VOSignal = [string, number, "rank" | "fire"];
  const VICTIM_SIGNAL_WEIGHTS: VOSignal[] = [
    ["gripping_proof_signal", 8, "rank"], // Q-GS1
    ["vulnerability_deflection", 10, "rank"], // Q-V1
    ["performance_identity", 8, "rank"], // Q-V1
    ["adapts_under_social_pressure", 6, "fire"], // Q-P1 forced
    ["adapts_under_economic_pressure", 6, "fire"], // Q-P2 forced
    ["hides_belief", 12, "fire"], // Q-P2 forced
    ["avoidant_reactivity", 8, "rank"], // Q-O2
  ];
  for (const [sid, weight, kind] of VICTIM_SIGNAL_WEIGHTS) {
    const fires =
      kind === "rank" ? hasInTopRank(signals, sid, 2) : has(signals, sid);
    if (fires) {
      score -= weight;
      victimSignals.push(sid);
      rationaleParts.push(`${sid} -${weight}`);
    }
  }

  // ── Existing owner-coded signals ──────────────────────────────
  const OWNER_SIGNAL_WEIGHTS: VOSignal[] = [
    ["high_conviction_under_risk", 12, "fire"], // Q-P2 forced
    // NOTE: the CC body named `say_directly_under_relational_cost`,
    // but the engine's actual signal_id for Q-P1 "Say it directly"
    // is `high_conviction_expression` (see lib/identityEngine.ts:128).
    ["high_conviction_expression", 10, "fire"], // Q-P1 forced
    ["independent_thought_signal", 6, "fire"], // Q-I1 derived
    ["conviction_under_cost", 10, "fire"], // T-001/T-002 tension-derived
  ];
  for (const [sid, weight, kind] of OWNER_SIGNAL_WEIGHTS) {
    const fires =
      kind === "rank" ? hasInTopRank(signals, sid, 2) : has(signals, sid);
    if (fires) {
      score += weight;
      ownerSignals.push(sid);
      rationaleParts.push(`${sid} +${weight}`);
    }
  }

  // ── Truth-register modifier ────────────────────────────────────
  // "Knowledge top-2 + owner-verb top-1" reads as Knowledge-pursuit
  // (owner register). "Truth top-2 + victim-verb >= 2" reads as
  // Truth-as-deflection (victim register). Both per CC-VO canon.
  let truthRegister: "pursuit" | "possession" | "neutral" = "neutral";
  const knowledgeTop2 = compassTopIncludes(signals, ["knowledge"], 2);
  const truthTop2 = compassTopIncludes(signals, ["truth"], 2);
  if (knowledgeTop2 && identityFreeform.owner_verb_count >= 1) {
    score += 8;
    truthRegister = "pursuit";
    rationaleParts.push("Knowledge top-2 + owner verbs +8 (pursuit register)");
  } else if (truthTop2 && identityFreeform.victim_verb_count >= 2) {
    score -= 8;
    truthRegister = "possession";
    rationaleParts.push("Truth top-2 + victim verbs -8 (possession register)");
  }

  // ── Hypocrisy panel drag ───────────────────────────────────────
  // Per `feedback_hypocrisy_as_universal_shape_feature.md`: named-vs-
  // paid gap pulls victim register. 2+ entries = -6.
  const hypocrisy = hypocrisyEntryCount(constitution);
  let hypocrisyDrag = 0;
  if (hypocrisy >= 2) {
    hypocrisyDrag = -6;
    score += hypocrisyDrag;
    rationaleParts.push(`hypocrisy panel ${hypocrisy} entries ${hypocrisyDrag}`);
  }

  // ── Clamp + classify ──────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));
  const register: VictimOwnerRegister =
    score <= 20
      ? "victim-anchored"
      : score <= 40
        ? "victim-leaning"
        : score <= 59
          ? "balanced"
          : score <= 79
            ? "owner-leaning"
            : "owner-anchored";

  // Compute signed evidence contributions for the audit trace.
  const blameAttribution =
    (blameLensTopIs(signals, "individual") && oceanA >= 70 ? 15 : 0) +
    (blameAuthSystem ? -10 : 0);
  const costBearing =
    cost >= 4 ? 10 : has(signals, "belief_no_cost_named") ? -15 : 0;
  const evidence: VictimOwnerEvidence = {
    verbRegister: {
      owner: identityFreeform.owner_verb_count,
      victim: identityFreeform.victim_verb_count,
    },
    blameAttribution,
    costBearing,
    hypocrisyDrag,
    truthRegister,
    existingVictimSignals: victimSignals,
    existingOwnerSignals: ownerSignals,
  };
  const rationale =
    `score=${score} register=${register}` +
    (rationaleParts.length > 0 ? `: ${rationaleParts.join("; ")}` : "");

  return { score, register, evidence, rationale };
}

// ─────────────────────────────────────────────────────────────────────
// CC-101-VO-WIRING Phase 4 — canon-predicted V/O register from shape
// signature. Distinct from the composer's behavior-signal measurement
// above. Reads Lens stack + Compass top + OCEAN intensities + Q-C4
// blame-attribution and produces a shape-canonical "lived register"
// score that the Phase 5 tension detector compares against.
// ─────────────────────────────────────────────────────────────────────

function scoreToRegister(score: number): VictimOwnerRegister {
  if (score <= 20) return "victim-anchored";
  if (score <= 40) return "victim-leaning";
  if (score <= 59) return "balanced";
  if (score <= 79) return "owner-leaning";
  return "owner-anchored";
}

function blameTopFromConstitution(constitution: InnerConstitution): string | null {
  const candidates = constitution.signals
    .filter((s) => s.signal_id.endsWith("_responsibility_priority"))
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  if (candidates.length === 0) return null;
  return candidates[0].signal_id;
}

export function predictVictimOwnerRegister(
  constitution: InnerConstitution
): CanonPredictedRegister {
  let score = 50;
  const components: string[] = [];

  // Lens dominant function bias (per feedback_victim_owner_axis_gsag.md
  // shape-by-driver table).
  //
  // CC-101 calibration tune — for the V/O predictor (which represents
  // canon-canonical "lived shape"), use the cross-signal inferred
  // driver whenever it's populated AND differs from the Q-T direct
  // dominant. Per feedback_se_fi_attractor_canon.md, Q-T direct can
  // misread Fe-Si as Se-Fi (Kevin's pattern) and Fe-Ni as Fe-Ni-
  // surface (Michele's). Cross-signal inference is the canon-
  // canonical lived-shape read. When Q-T and cs agree (most fixtures),
  // use dom verbatim. When they differ — regardless of whether the
  // agreement classifier crossed its strict disagree threshold — the
  // predictor trusts cs as the lived-shape driver.
  const ls = constitution.lens_stack;
  const csInferred = ls?.crossSignalInferredDriver;
  const useDom =
    csInferred && ls?.dominant && csInferred !== ls.dominant
      ? csInferred
      : ls?.dominant;
  const dom = useDom;
  const aux = ls?.auxiliary;
  if (dom === "ni" && aux === "te") {
    score += 10;
    components.push("Ni-Te +10");
  } else if (dom === "te") {
    score += 10;
    components.push("Te-driver +10");
  } else if (dom === "ti") {
    score += 5;
    components.push("Ti-driver +5");
  } else if (dom === "si") {
    score += 5;
    components.push("Si-driver +5");
  } else if (dom === "ne") {
    score += 5;
    components.push(
      csInferred && ls?.dominant && csInferred !== ls.dominant
        ? "Ne-driver +5 (cross-signal override)"
        : "Ne-driver +5"
    );
  } else if (dom === "fe") {
    score -= 5;
    components.push("Fe-driver -5 (relational softening)");
  }
  // se / fi / fe-aux: neutral.

  // Compass top values (read via *_priority signals; rank-1..4 = top).
  const compassIds = constitution.signals
    .filter(
      (s) =>
        s.from_card === "sacred" &&
        s.source_question_ids?.some((q) => q === "Q-S1" || q === "Q-S2")
    )
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 4)
    .map((s) => s.signal_id);
  // CC-101 calibration tune — Knowledge/Truth/Honor weight reduced
  // from +10 to +5 per cohort regression. Cohort fixtures (Daniel/
  // Harry/Kevin) all carry one of these in top-4 because Honor and
  // Truth are dominant cluster values across the cohort; +10 was
  // double-counting against the C/Individual stack.
  if (compassIds.some((id) => /^(knowledge|truth|honor)_priority/.test(id))) {
    score += 5;
    components.push("Knowledge/Truth/Honor compass +5");
  }
  if (compassIds.some((id) => /^faith_priority/.test(id))) {
    score += 5;
    components.push("Faith compass +5");
  }
  if (compassIds.some((id) => /^(compassion|mercy)_priority/.test(id))) {
    score -= 5;
    components.push("Compassion/Mercy compass -5");
  }

  // OCEAN — high-A softens owner specifically when Fe is in the
  // driver/auxiliary slot (Fe-protector canon per
  // feedback_openness_suppression_by_agreeableness.md). Fe-driver
  // shapes (Kevin) read as softened-protector at high A; Si-driver
  // shapes with high A (Harry) don't get the softening because the
  // Fe is in their auxiliary slot but the Si owner-conviction
  // dominates the signature. Lower A lifts owner. High C lifts owner
  // (canon: discipline + responsibility).
  //
  // CC-101 calibration tune — threshold lowered from A≥95 to A≥90
  // AND gated on dom === "fe". Catches Kevin (Fe-driver, A=91)
  // without regressing Harry (Si-driver, A=92 — softening doesn't
  // fire) or Jason (Ni-Te, A=68 — softening doesn't fire).
  const A =
    constitution.ocean?.dispositionSignalMix?.intensities?.agreeableness ?? 0;
  const C =
    constitution.ocean?.dispositionSignalMix?.intensities?.conscientiousness ?? 0;
  if (A >= 90 && dom === "fe") {
    score -= 15;
    components.push(
      `A=${A.toFixed(0)} -15 (Fe-protector + high-A softening)`
    );
  } else if (A < 70) {
    score += 5;
    components.push(`A=${A.toFixed(0)} lower +5`);
  }
  // CC-101 calibration tune — C ≥ 90 ceiling reduced from +10 to +5.
  // Cohort fixtures (Daniel C=99, Harry C=98, Kevin C=94, Cindy C=93,
  // Ashley C=91, Jason C=94) all crossed the C≥90 floor; +10 was
  // pushing everyone owner-anchored.
  if (C >= 90) {
    score += 5;
    components.push(`C=${C.toFixed(0)} ceiling +5`);
  }

  // Q-C4 blame attribution top — Individual = owner; Authority = mild
  // owner (rule-respect); Nature = mild victim. System/Supernatural
  // neutral per Harry-canon (Supernatural-as-trust ≠ Supernatural-as-
  // escape).
  // CC-101 calibration tune — Q-C4 Individual reduced from +10 to +5.
  // Most cohort fixtures rank Individual top-1 (Jason/Daniel/Cindy/
  // Kevin/Harry); +10 was pushing the cohort owner-anchored uniformly.
  const blameTop = blameTopFromConstitution(constitution);
  if (blameTop === "individual_responsibility_priority") {
    score += 5;
    components.push("Q-C4 Individual +5");
  } else if (blameTop === "authority_responsibility_priority") {
    score += 5;
    components.push("Q-C4 Authority +5");
  } else if (blameTop === "nature_responsibility_priority") {
    score -= 5;
    components.push("Q-C4 Nature -5");
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    register: scoreToRegister(score),
    rationale: components.length > 0 ? components.join(", ") : "(no shape signature components fired)",
  };
}

// ─────────────────────────────────────────────────────────────────────
// CC-101-VO-WIRING Phase 5 — register-tension detection. Compares
// composer-measured register (behavior signals) with canon-predicted
// register (shape signature). Surfaces tension finding rather than
// collapsing the gap (per feedback_tension_is_the_form.md).
// ─────────────────────────────────────────────────────────────────────

const REGISTER_BAND_INDEX: Record<VictimOwnerRegister, number> = {
  "victim-anchored": 0,
  "victim-leaning": 1,
  balanced: 2,
  "owner-leaning": 3,
  "owner-anchored": 4,
};

export function detectRegisterTension(
  measured: { score: number; register: VictimOwnerRegister },
  predicted: { score: number; register: VictimOwnerRegister }
): RegisterTension {
  const mBand = REGISTER_BAND_INDEX[measured.register];
  const pBand = REGISTER_BAND_INDEX[predicted.register];
  const bandDelta = mBand - pBand;
  const absDelta = Math.abs(bandDelta);

  // Direction reversal: one side owner-leaning+ and the other
  // victim-leaning−. Crosses the balanced midpoint.
  const reversed =
    (measured.score >= 60 && predicted.score <= 40) ||
    (measured.score <= 40 && predicted.score >= 60);

  if (absDelta === 0) {
    return {
      fires: false,
      direction: "aligned",
      magnitude: "minor",
      bandDelta: 0,
      note: `Measured (${measured.score}/${measured.register}) and canon-predicted (${predicted.score}/${predicted.register}) align in the same band.`,
    };
  }

  const direction: RegisterTension["direction"] = reversed
    ? "direction-reversed"
    : bandDelta > 0
      ? "expressed-exceeds-canon"
      : "canon-exceeds-expressed";
  const magnitude: RegisterTension["magnitude"] = reversed
    ? "significant"
    : absDelta >= 2
      ? "significant"
      : "meaningful";

  const note =
    direction === "direction-reversed"
      ? `Expressed register (${measured.score}/${measured.register}) and canon-predicted (${predicted.score}/${predicted.register}) point in opposite directions across the balanced midpoint — a significant tension worth surfacing.`
      : direction === "expressed-exceeds-canon"
        ? `Expressed register (${measured.score}/${measured.register}) reads more owner-anchored than canon-predicted (${predicted.score}/${predicted.register}) — a ${magnitude} tension (band delta ${bandDelta}).`
        : `Expressed register (${measured.score}/${measured.register}) reads more victim-leaning than canon-predicted (${predicted.score}/${predicted.register}) — a ${magnitude} tension (band delta ${bandDelta}).`;

  return { fires: true, direction, magnitude, bandDelta, note };
}
