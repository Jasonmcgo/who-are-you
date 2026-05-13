// CC-070 — Movement Layer (static read for MVP, trajectory read deferred).
//
// Goal/Soul/Give locates the user in a 2×2 plane of derived composites.
// Movement reads that location *directionally* — the polar transform
// (angle, length) plus a guidance sentence gated on (age, profession)
// life-stage. Per spec §13:
//
//   - Angle (0–90°): atan2(soul, goal) × 180 / π. The *posture*: how
//     verbs vs nouns are weighted. 0° = pure Striving lean, 45° = balanced
//     Give, 90° = pure Longing lean.
//   - Length (0–100): sqrt(goal² + soul²) / sqrt(2). The *scale*: how much
//     activity the line carries on both axes combined.
//
// Architectural rules (canon-locked per §13.11):
//   - Demographics shape only the prose's guidance language. Angle and
//     length are pure functions of (goal, soul). The audit verifies this
//     invariant directly (acceptance §AC-19).
//   - Movement renders for ALL goalSoulGive outputs regardless of
//     confidence (spec §13.8). Low-confidence sessions get a tough-love
//     thin-signal read, NOT a soft "the picture isn't clear yet" fallback.
//   - User-facing prose contains no engine vocabulary (Goal / Soul /
//     Vulnerability) and no engine-internal pattern names. The audit
//     enforces.
//   - No moralizing on a short line. No prescribed angles by demographic.
//     Tough-love has a floor (spec §13.11).
//   - Movement read is independent of the cross-card pattern catalog
//     (spec §13.9); they render in different sections, never composed.
//   - MVP register is GEOMETRIC-anchored. Motion / warmer registers may
//     mix as secondary phrasing within the prose. The selected anchor is
//     reported in `evidence.anchorRegister`.

import type {
  DashboardQuadrantLabel,
  DemographicSet,
  DirectionDescriptor,
  GoalSoulGiveOutput,
  GoalSoulQuadrant,
  LifeStageGate,
  MovementDashboard,
  MovementOutput,
  MovementStrengthDescriptor,
  MovementVocabularyRegister,
  OceanIntensities,
  Signal,
} from "./types";

// ── Polar transform (the geometry layer) ───────────────────────────────

export function computeAngle(goal: number, soul: number): number {
  if (goal === 0 && soul === 0) return 0;
  const radians = Math.atan2(soul, goal);
  const degrees = (radians * 180) / Math.PI;
  // Clamp to [0, 90]; values outside are degenerate.
  return Math.max(0, Math.min(90, degrees));
}

export function computeLength(goal: number, soul: number): number {
  const raw = Math.sqrt(goal * goal + soul * soul) / Math.sqrt(2);
  return Math.max(0, Math.min(100, raw));
}

function formatAngle(angle: number): string {
  return Math.round(angle).toString();
}

function formatLength(length: number): string {
  return length.toFixed(1);
}

// ── Life-stage gating (demographics → guidance bucket) ──────────────────

// Per acceptance §AC-17. Order of priority codified here matters when a
// fixture's profession + age both match different rules: profession ===
// 'retired' is the most specific binding; profession === 'entrepreneur'
// overrides age-based mid_career placement; age in {1940s, 1950s} drops
// to retirement when no profession overrides; otherwise gate by age band.
// Demographic option ids are matched (data/demographics.ts:31+); the
// spec's label-form references map to ids "retired" and "entrepreneur"
// respectively.
export function deriveLifeStageGate(
  demographics: DemographicSet | null | undefined
): LifeStageGate {
  if (!demographics) return "unknown";
  const ageAnswer = demographics.answers.find((a) => a.field_id === "age");
  const profAnswer = demographics.answers.find(
    (a) => a.field_id === "profession"
  );

  if (!ageAnswer || ageAnswer.state !== "specified" || !ageAnswer.value) {
    return "unknown";
  }
  const age = ageAnswer.value;
  const prof =
    profAnswer && profAnswer.state === "specified" && profAnswer.value
      ? profAnswer.value
      : "";

  if (prof === "retired") return "retirement";
  if (prof === "entrepreneur") return "entrepreneur";
  if (age === "1940s" || age === "1950s") return "retirement";
  if (age === "1990s" || age === "2000s" || age === "2010s") {
    return "early_career";
  }
  if (age === "1970s" || age === "1980s") return "mid_career";
  if (age === "1960s") return "late_career";
  return "unknown";
}

// ── CC-071 — Direction + Movement Strength descriptors (spec §13.4a) ────

export function directionDescriptor(angle: number): DirectionDescriptor {
  // Spec §13.4a: 0–35° = Goal-leaning, 35–55° = balanced, 55–90° = Soul-leaning.
  if (angle < 35) return "Goal-leaning";
  if (angle < 55) return "balanced";
  return "Soul-leaning";
}

export function movementStrengthDescriptor(
  length: number
): MovementStrengthDescriptor {
  if (length < 30) return "short";
  if (length < 60) return "moderate";
  if (length < 85) return "long";
  return "full";
}

// CC-MOMENTUM-HONESTY — Usable-anchored descriptor. Anchored on what
// the user can actually USE (Usable Movement = Potential × gripDrag ×
// aimGovernor), not on what they theoretically possess.
//
// Bands per CC:
//   0-30:   "short"
//   30-50:  "moderate"
//   50-65:  "long"
//   65-80:  "high"
//   80+:    "high, well-governed" — but ONLY if Aim ≥ 60 AND Grip ≤ 30
//           else "high"
//
// The canonical "high, well-governed" is reserved for shapes that have
// genuinely high usable movement AND governance AND low defensive drag.
// A user at Usable 80 with Aim 50 and Grip 50 reads "high" — the line
// is long but the governance isn't there.
export type UsableMovementDescriptor =
  | "short"
  | "moderate"
  | "long"
  | "high"
  | "high, well-governed";

export function usableMovementDescriptor(
  usableLength: number,
  aim: number,
  grip: number
): UsableMovementDescriptor {
  if (usableLength < 30) return "short";
  if (usableLength < 50) return "moderate";
  if (usableLength < 65) return "long";
  if (usableLength < 80) return "high";
  // Usable ≥ 80 — reserve "high, well-governed" for governed shapes only.
  if (aim >= 60 && grip <= 30) return "high, well-governed";
  return "high";
}

export function quadrantLabel(
  quadrant: GoalSoulQuadrant
): DashboardQuadrantLabel {
  return composeQuadrantDisplayLabel(quadrant, undefined) as DashboardQuadrantLabel;
}

export function composeQuadrantDisplayLabel(
  quadrant: GoalSoulQuadrant,
  angle: number | undefined
): DashboardQuadrantLabel | "Early Giving / Goal-leaning" {
  // Spec §13.4a / CC-071 acceptance §AC-19: only Giving (NE) and Gripping
  // (SW) appear as labels. SE/NW unlabeled. Neutral also unlabeled (the
  // dashboard omits the Quadrant line entirely when null).
  if (quadrant === "give") {
    if (
      angle !== undefined &&
      angle >= PRODUCTIVE_NE_BAND_ANGLE_MIN &&
      angle <= PRODUCTIVE_NE_BAND_ANGLE_MAX
    ) {
      return "Early Giving / Goal-leaning";
    }
    return "Giving";
  }
  if (quadrant === "gripping") return "Gripping";
  return null;
}

// ── CC-071 — Narrative posture + meaning (no dashboard numbers) ─────────
//
// The narrative no longer restates the angle or length numbers — the
// dashboard does precision; the prose does meaning (spec §13.5). First
// sentence names the posture (Work-leaning / balanced / Love-leaning).
// Following sentence supplies the meaning. Life-stage guidance carries the
// bridge.

function describeNarrativePosture(angle: number): string {
  const desc = directionDescriptor(angle);
  if (desc === "Goal-leaning") {
    return "Your line leans toward the Work axis right now.";
  }
  if (desc === "Soul-leaning") {
    return "Your line leans toward the love-line right now.";
  }
  return "Your line sits balanced between the Work axis and the love-line.";
}

function describeNarrativeMeaning(angle: number, length: number): string {
  const desc = directionDescriptor(angle);
  const lengthBand = movementStrengthDescriptor(length);
  if (desc === "Goal-leaning") {
    if (lengthBand === "short") {
      return "The verbs are still gathering; the love-line has not yet arrived.";
    }
    return "The verbs are carrying the weight, and the love-line is still forming.";
  }
  if (desc === "Soul-leaning") {
    if (lengthBand === "short") {
      return "The love-line is present but not yet incarnated; the form is still gathering.";
    }
    return "The love-line is carrying the weight, and the form is still gathering.";
  }
  return "Verbs and nouns are both present in the line — different chapters of the same shape.";
}

// ── Life-stage guidance sentences (gated bridge / next-move) ────────────

const LIFE_STAGE_GUIDANCE: Record<LifeStageGate, string> = {
  early_career:
    "At an early-career stage, the season often reads as Work-leaning while the verbs find traction; the next move is to keep moving while letting the love-line begin to tilt as the season turns.",
  mid_career:
    "At a mid-career stage, the line typically broadens — both the angle and the length usually rise as the season turns from accumulation toward integration; the next move is to notice which side has been louder and to give the quieter side honest energy.",
  entrepreneur:
    "In a venture-building season, the line tends to pull hard toward the Work axis, and that pull is often in-register for the season; the next move is to ask whether the Love-line is pulling alongside, or being deferred until the venture lands.",
  late_career:
    "At a late-career stage, the line typically continues to broaden — the angle rising as legacy and relational weight take more of the load than they did mid-career; the next move is to let what already matters most claim the energy that used to go into proving.",
  retirement:
    "After the working season, the line often shifts — the verbs that mattered most gather, the nouns carry the weight they always carried, and the next move is choosing which kind of giving the next chapter wants to hold.",
  unknown:
    "The line has a shape and a scale, and what it likely wants next is whichever axis is currently quieter — the one that, if it grew, would lift the whole line.",
};

// ── CC-079 — Productive NE Movement band (spec §13.5b) ─────────────────
//
// Five canonical angle bands (spec §13.5b table). The 20°–44° band carries
// a special prose composition: affirmation → observation → 1–2 Soul-lift
// practices → landing. Per §13.11: the affirmation rule is the floor —
// users in this band have earned out-of-Gripping; the prose says so before
// any prescription. The five canonical Soul-lift practices are signal-
// driven; selection rules per §13.5b. Other bands keep their CC-068 prose.

export const PRODUCTIVE_NE_BAND_ANGLE_MIN = 20;
export const PRODUCTIVE_NE_BAND_ANGLE_MAX = 44;
export const PRODUCTIVE_NE_BAND_LENGTH_MIN = 40;
export const PRODUCTIVE_NE_BAND_RAW_SOUL_MIN = 20;

// Verbatim §13.5b gate. Returns true when angle ∈ [20°, 44°] AND length ≥ 40
// AND raw_soul ≥ 20. Pure helper, exported for direct audit testing.
export function isProductiveNEMovementBand(
  angle: number,
  length: number,
  rawSoul: number
): boolean {
  return (
    angle >= PRODUCTIVE_NE_BAND_ANGLE_MIN &&
    angle <= PRODUCTIVE_NE_BAND_ANGLE_MAX &&
    length >= PRODUCTIVE_NE_BAND_LENGTH_MIN &&
    rawSoul >= PRODUCTIVE_NE_BAND_RAW_SOUL_MIN
  );
}

export type SoulLiftPracticeId =
  | "name_the_beloved"
  | "allocate_resources_to_sacred_value"
  | "translate_care_visibly"
  | "convert_structure_into_mercy"
  | "recurring_act_of_giving";

// Spec §13.5b verbatim canon. Each prose entry is one sentence carrying the
// practice name + its explanatory clause. Substantive claim is locked; only
// the engine-vocabulary substitution ("love-line" for "Soul" in Practice 1
// and 2 explanatory clauses) is a close paraphrase, since user-facing
// Movement narrative cannot use the engine word "Soul" per CC-070/071
// register guards (audited by movement-narrative-no-dashboard-restate and
// the prose-quality forbidden-substring check on "soul").
export const SOUL_LIFT_PRACTICE_PROSE: Record<SoulLiftPracticeId, string> = {
  name_the_beloved:
    "Name the beloved — make the people, the cause, or the calling concrete; an abstract love-line reads thinner than a named one.",
  allocate_resources_to_sacred_value:
    "Allocate resources to the sacred value — time, attention, and resources flow toward what's said to matter, and the gap between named and funded is the most common love-line gap.",
  translate_care_visibly:
    "Translate care visibly — the internal love-line is real, the external sign of it can be sparse, and the work is making the care legible to the people it's for.",
  convert_structure_into_mercy:
    "Convert structure into mercy — the same structuring gift that builds systems can build relief, comfort, and care; use the gift in service of the love-line.",
  recurring_act_of_giving:
    "Choose one recurring act of Giving that does not depend on urgency — small and durable beats large and crisis-driven, and the act survives the season.",
};

// CC-079 — selection rule per §13.5b. Signal-driven, NOT random. The four
// branches map signal patterns to 1–2 practices:
//   (a) Low-E (adjusted_extraversion < 40) OR compartmentalized cluster
//       (raw_goal ≥ 50 AND raw_soul ≥ 50 BUT vulnerability < 0)
//       → Translate care visibly.
//   (b) High-C (adjusted_conscientiousness ≥ 60) AND Te top-2 in any Q-T
//       block → Convert structure into mercy.
//   (c) Sacred-Words-vs-Sacred-Spending tension proxy: high Q-S2
//       family/compassion/mercy/faith priority top-2 AND low Q-S3-close
//       family-spending (rank ≥ 3) → Allocate resources to the sacred
//       value.
//   (d) Default pair: Name the beloved + Choose one recurring act.
//
// Selection is single-branch: the first firing rule wins. The default pair
// fires only when none of (a)–(c) match the signal pattern.

const LOW_EXTRAVERSION_THRESHOLD = 40;
const HIGH_CONSCIENTIOUSNESS_THRESHOLD = 60;

export function selectSoulLiftPractices(
  goalSoulGive: GoalSoulGiveOutput,
  oceanIntensities: OceanIntensities | undefined,
  signals: Signal[] | undefined
): SoulLiftPracticeId[] {
  // Branch (a) — low-E or compartmentalized cluster.
  const adjustedE = oceanIntensities?.extraversion;
  const lowE =
    adjustedE !== undefined && adjustedE < LOW_EXTRAVERSION_THRESHOLD;
  const rawV = goalSoulGive.rawScores.vulnerability;
  const rawG = goalSoulGive.rawScores.goal;
  const rawS = goalSoulGive.rawScores.soul;
  const compartmentalized = rawG >= 50 && rawS >= 50 && rawV < 0;
  if (lowE || compartmentalized) {
    return ["translate_care_visibly"];
  }

  // Branch (b) — high-C AND Te top-2 in any Q-T block.
  const adjustedC = oceanIntensities?.conscientiousness;
  const highC =
    adjustedC !== undefined && adjustedC >= HIGH_CONSCIENTIOUSNESS_THRESHOLD;
  const teTop2 =
    signals?.some(
      (s) => s.signal_id === "te" && s.rank !== undefined && s.rank <= 2
    ) ?? false;
  if (highC && teTop2) {
    return ["convert_structure_into_mercy"];
  }

  // Branch (c) — Sacred-Words-vs-Spending proxy. High Q-S2 Soul-line value
  // top-2 AND low Q-S3-close family spending (rank ≥ 3 in Q-S3-close).
  const SOUL_VALUE_IDS = [
    "compassion_priority",
    "mercy_priority",
    "family_priority",
    "faith_priority",
  ];
  const qs2HighSoulValue =
    signals?.some(
      (s) =>
        SOUL_VALUE_IDS.includes(s.signal_id) &&
        s.rank !== undefined &&
        s.rank <= 2 &&
        s.source_question_ids.includes("Q-S2")
    ) ?? false;
  const qs3LowFamilySpending =
    signals?.some(
      (s) =>
        s.signal_id === "family_spending_priority" &&
        s.rank !== undefined &&
        s.rank >= 3 &&
        s.source_question_ids.includes("Q-S3-close")
    ) ?? false;
  if (qs2HighSoulValue && qs3LowFamilySpending) {
    return ["allocate_resources_to_sacred_value"];
  }

  // Branch (d) — default pair.
  return ["name_the_beloved", "recurring_act_of_giving"];
}

// Affirmation, observation, landing — verbatim or close paraphrase per
// spec §13.5b. None of these contain "Goal" or "Soul" substrings, so they
// pass the existing CC-068 movement-narrative forbidden-substring guard.
// Per CC-079 OOS §14: avoids the labels "Striving" and "Goal-leaning"
// (the existing CC-070 guard already forbids "Goal" anyway).
const PRODUCTIVE_NE_BAND_AFFIRMATION =
  "Your line sits in productive NE movement — leading on the Work axis, with the love-line beginning to register at meaningful scale. The lift toward giving has started.";

const PRODUCTIVE_NE_BAND_OBSERVATION =
  "What's strong here is the form — the building, the structure, the productive motion that has earned the position you're at.";

const PRODUCTIVE_NE_BAND_LANDING =
  "The next move is rarely more output — it is letting one of these practices become regular enough that the love-line catches up to the form.";

export function composeProductiveNEBandProse(
  goalSoulGive: GoalSoulGiveOutput,
  oceanIntensities: OceanIntensities | undefined,
  signals: Signal[] | undefined,
  angle: number
): string {
  const practices = selectSoulLiftPractices(
    goalSoulGive,
    oceanIntensities,
    signals
  );
  const practiceProse = practices
    .map((p) => SOUL_LIFT_PRACTICE_PROSE[p])
    .join(" ");
  const steepenSentence = `At ${Math.round(angle)}°, the next movement is not mainly to lengthen the line through more output; it is to steepen the line by making the beloved object more visible — the people, cause, calling, or sacred value the structure is meant to serve.`;
  return [
    PRODUCTIVE_NE_BAND_AFFIRMATION,
    PRODUCTIVE_NE_BAND_OBSERVATION,
    practiceProse,
    steepenSentence,
    PRODUCTIVE_NE_BAND_LANDING,
  ].join(" ");
}

// ── Tough-love thin-signal prose (spec §13.8 register) ──────────────────
//
// CC-071 — narrative no longer restates dashboard numbers. The dashboard
// shows "Movement Strength: 0" and "Direction: 0°"; the narrative speaks
// in posture / motion register. Audit guard: prose does not contain `°`
// AND "length" together (CC-071 §AC-25). The substring "length" by itself
// is allowed (e.g., "the line widens" is the rewritten form).

function thinSignalProse(isZeroOrigin: boolean): string {
  // The thin-signal close ends with a "next move" sentence so the bridge
  // allowlist (CC-068 §AC-26) registers; without it the prose would be
  // descriptive-only and read as verdict.
  if (isZeroOrigin) {
    return (
      "The line has not yet been drawn. " +
      "The signal here is thin, and that is itself a Movement read. " +
      "Thin signal often means motion is what's needed to make the picture clearer. " +
      "Willingness, courage, action, contact with what already matters to you — the line begins to widen when the verbs and the nouns get used. " +
      "The next move is the smallest motion that contacts what already matters."
    );
  }
  return (
    "Your line is short and hard to read clearly. " +
    "The signal here is thin. " +
    "That is itself a Movement read: thin signal often means motion is what's needed to make the picture clearer. " +
    "Willingness, courage, action, contact with what already matters to you — the line begins to widen when the verbs and the nouns get used. " +
    "The next move is the smallest motion that contacts what already matters."
  );
}

// ── Dashboard composition (CC-071 spec §13.4a) ──────────────────────────

function composeDashboard(
  goalSoulGive: GoalSoulGiveOutput,
  angle: number,
  length: number
): MovementDashboard {
  return {
    goalScore: goalSoulGive.adjustedScores.goal,
    soulScore: goalSoulGive.adjustedScores.soul,
    direction: {
      angle,
      descriptor: directionDescriptor(angle),
    },
    movementStrength: {
      length,
      descriptor: movementStrengthDescriptor(length),
    },
    quadrantLabel: composeQuadrantDisplayLabel(
      goalSoulGive.quadrant,
      angle
    ) as DashboardQuadrantLabel,
    grippingPull: goalSoulGive.grippingPull,
  };
}

// Suppress unused-import warnings for helpers retained for future use.
void formatAngle;
void formatLength;

// ── Top-level: full MovementOutput, or undefined when no goalSoulGive ──

export function computeMovement(
  goalSoulGive: GoalSoulGiveOutput | undefined,
  demographics: DemographicSet | null | undefined,
  // CC-079 — optional OCEAN intensities and signals for the productive-NE-
  // movement band (20°–44°). When both are provided AND the band detector
  // fires, the prose follows the §13.5b composition (affirmation →
  // observation → 1–2 Soul-lift practices → landing). When omitted (e.g.,
  // pre-CC-079 callers passing 2 args), the prose falls back to the
  // existing CC-070/CC-071 templates. Production identityEngine.ts may
  // continue to call with 2 args until a follow-on CC threads ocean +
  // signals through buildInnerConstitution.
  oceanIntensities?: OceanIntensities,
  signals?: Signal[]
): MovementOutput | undefined {
  if (!goalSoulGive) return undefined;

  // CC-071 — polar geometry now operates on ADJUSTED scores (spec §13.1
  // post-revision). Raw scores are engine-internal; the user's line is
  // drawn from the post-lift values that the dashboard displays.
  const { goal, soul } = goalSoulGive.adjustedScores;
  const angle = computeAngle(goal, soul);
  const length = computeLength(goal, soul);
  const lifeStageGate = deriveLifeStageGate(demographics);
  const confidence = goalSoulGive.evidence.confidence;
  const isZeroOrigin = goal === 0 && soul === 0;
  const rawSoul = goalSoulGive.rawScores.soul;

  let prose: string;
  const anchorRegister: MovementVocabularyRegister = "geometric";

  if (isZeroOrigin || confidence === "low") {
    prose = thinSignalProse(isZeroOrigin);
  } else if (
    isProductiveNEMovementBand(angle, length, rawSoul) &&
    (oceanIntensities !== undefined || signals !== undefined)
  ) {
    // CC-079 — productive NE movement band (spec §13.5b). Affirmation
    // first; observation second; 1–2 Soul-lift practices third; landing
    // last. Selection is signal-driven. Falls through to the CC-071
    // templates below when neither ocean nor signals are threaded
    // (production callers pre-CC-079).
    prose = composeProductiveNEBandProse(
      goalSoulGive,
      oceanIntensities,
      signals,
      angle
    );
  } else {
    // CC-071 narrative shape (spec §13.5): first sentence names the
    // posture (Work-leaning / balanced / Love-leaning) without restating
    // the numerical Direction; following sentence carries meaning;
    // life-stage guidance carries the bridge.
    const posture = describeNarrativePosture(angle);
    const meaning = describeNarrativeMeaning(angle, length);
    const guidance = LIFE_STAGE_GUIDANCE[lifeStageGate];
    prose = `${posture} ${meaning} ${guidance}`;
  }

  const dashboard = composeDashboard(goalSoulGive, angle, length);

  return {
    angle,
    length,
    anchorRegister,
    prose,
    evidence: {
      lifeStageGate,
      confidence,
    },
    dashboard,
  };
}
