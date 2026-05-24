// CC-JX — Jungian / OCEAN position-weighted decoupling.
//
// Single source of truth for cog-function stack resolution. Both the Lens
// classification (existing) and the OCEAN bridges (new in CC-JX) read
// from `computeJungianStack` so the two layers share canon. The
// `cumulativeRawWeight` from Q-T extraction is consumed only for
// stack ordering; downstream OCEAN contribution comes purely from
// position weight × bridge coefficient (the architectural simplification
// CC-JX introduces).
//
// Position weight curve (v1). Spec ratios are 1.0 / 0.6 / 0.3 / 0.1 /
// 0.0; the absolute base unit is empirically tuned against the cohort
// so the position-weighted contribution roughly matches the pre-CC-JX
// Q-T-cumulative magnitude (each cog function previously fired in N
// Q-T blocks at varying ranks, totalling ~15 weighted-sum units for a
// dominant function across a full Q-T set). Setting `JUNGIAN_BASE_UNIT`
// = 15 lands the dominant contribution ≈ 15 weighted-sum units, which
// preserves the canon-faithful shape for fixtures with full Q-T data
// (Jason: O ≥ 75 architectural-led canary) while honoring the
// architectural simplification (one contribution per function per
// fixture, regardless of how many Q-T blocks fired).
//
// The curve is exposed for visible tuning; future CC-JX-2 may revise.
//
//   - Position 1 (dominant)  : 1.0 × 15 = 15.0
//   - Position 2 (auxiliary) : 0.6 × 15 =  9.0
//   - Position 3 (tertiary)  : 0.3 × 15 =  4.5
//   - Position 4 (inferior)  : 0.1 × 15 =  1.5
//   - Position 5+ (shadow)   : 0.0      =  0.0

const JUNGIAN_BASE_UNIT = 15;
//
// MBTI canon: a Lens-canonical stack of length 4 (dominant / auxiliary /
// tertiary / inferior) maps from a (dominant_perceiving, dominant_judging)
// pair via the STACK_TABLE below. Positions 5–8 ("shadow") are the four
// functions NOT in the conscious stack; their canonical order isn't
// engine-relevant since their position weight is 0.

import type {
  CognitiveFunctionId,
  ConfidenceLowReason,
  LensStack,
  Signal,
} from "./types";

export type CogFunction = CognitiveFunctionId;

export type StackEntry = {
  function: CogFunction;
  position: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  positionWeight: number;
  cumulativeRawWeight: number;
};

export type JungianStack = StackEntry[];

// ── Position weight curve ───────────────────────────────────────────────

export const POSITION_WEIGHT: Record<number, number> = {
  1: 1.0 * JUNGIAN_BASE_UNIT,
  2: 0.6 * JUNGIAN_BASE_UNIT,
  3: 0.3 * JUNGIAN_BASE_UNIT,
  4: 0.1 * JUNGIAN_BASE_UNIT,
  5: 0.0,
  6: 0.0,
  7: 0.0,
  8: 0.0,
};

function positionWeightFor(position: number): number {
  return POSITION_WEIGHT[position] ?? 0;
}

// ── MBTI stack tables (moved from identityEngine.ts; CC-JX consolidation) ─

const PERCEIVING: CognitiveFunctionId[] = ["ni", "ne", "si", "se"];
const JUDGING: CognitiveFunctionId[] = ["ti", "te", "fi", "fe"];
export const MBTI_TIE_MARGIN = 0.5;

// ── CC-134 Part C — top-pick convergence ────────────────────────────────
//
// Replaces flat avg-rank with rank-1 frequency for dominant selection.
// Owner principle: the top pick carries the signal; ranks 2–4 are noisy
// and weak-vs-weak comparisons are non-data. So we count how often each
// function is the rank-1 pick across the Q-T blocks it appears in;
// dominant/aux are selected from the per-pool top-pick leaders.
//
// `TOP_PICK_CONVERGENCE_MARGIN` is the BASELINE minimum top-pick lead
// the in-pool leader must clear over the runner-up. CC-134.1 makes the
// effective margin data-relative (`dynamicMargin` below); this constant
// is the floor that the data-relative formula uses as its `max`.
// Owner-tunable; default 2 = the leader must out-pick the runner-up by
// at least 2 top-picks even when data is abundant. With full 8-block
// Q-T data the dynamic formula may raise this; the floor protects the
// thin-data case.
//
// `NS_VALENCE_GUARD_MARGIN` is the perceiving-axis (N vs S) margin per
// §C.6 of CC-134: warm-N items over-attract, so when an N leads the S
// runner-up by < this margin, the call is suspect — we drop to `low`
// confidence and route to Part D's head-to-head clarifier instead of
// committing to N. CC-134.1 makes this reuse the same data-relative
// `dynamicMargin` formula so guard tightens with full data.
export const TOP_PICK_CONVERGENCE_MARGIN = 2;
export const NS_VALENCE_GUARD_MARGIN = 2;

// CC-134.1 — minimum-data floor for `high` confidence. CC-134's
// margin-only check granted `high` whenever the leader cleared the
// runner-up by 2 top-picks, with no minimum-observation floor. A thin
// fixture (2 top-picks vs 0, ≤2 scored blocks) trivially clears the
// flat margin and gets stamped `high` — the inverse of what CC-134
// aimed at, and most dangerous for the untouched-ranking population
// CC-134 targets. These constants close that gap:
//   - `MIN_DOMINANT_TOP_PICKS`: the dominant must accumulate ≥ this
//     many rank-1 picks before `high` is even eligible (3 = the
//     dominant must lead in 3 of 4 blocks at minimum).
//   - `MIN_QT_BLOCKS_WITH_DATA`: the dominant's pool (perceiving or
//     judging) must have ≥ this many distinct Q-T blocks scored
//     (default 3 of 4 = strict enough to block 2-vs-0 thin cases
//     while not requiring every block).
// Below either floor → `confidence = "low"` regardless of margin. Low
// already routes to the §D head-to-head clarifier from CC-134.
export const MIN_DOMINANT_TOP_PICKS = 3;
export const MIN_QT_BLOCKS_WITH_DATA = 3;

// CC-134.1 — judging-axis co-occurrence guard (Ti+Fi / Te+Fe). A
// canonical Jungian stack never holds two same-attitude judging
// functions; meaningful top-picks on BOTH Ti & Fi (or Te & Fe) is the
// warm-Ti-pulls-Fi (or symmetric warm-Te-pulls-Fe) fingerprint, not a
// real shape. When both members of an impossible same-attitude pair
// exceed this threshold, confidence drops to `low` and the §D judging
// head-to-head clarifier disambiguates. Parallel to §C.6's N/S
// valence guard. **CC-138 supersedes this guard for binary-format
// sessions** via the opposite-attitude constraint built into the new
// item flow; this guard fixes the LEGACY ranking format that ships
// today.
export const JUDGING_COOCCURRENCE_THRESHOLD = 2;

/**
 * Data-relative convergence margin (CC-134.1 §Task 2). Returns the
 * minimum top-pick lead the in-pool leader must clear to count as
 * convergent. Scales modestly with the number of scored blocks so
 * full-Q-T data doesn't trivialise the comparison; bounded below by
 * `TOP_PICK_CONVERGENCE_MARGIN`.
 *
 * Formula: `max(TOP_PICK_CONVERGENCE_MARGIN, ceil(0.25 × scoredBlocks))`.
 * With 4 scored blocks (a single pool's worth): margin = 2.
 * With 8 scored blocks (total Q-T): margin = 2.
 * With 12 scored blocks (hypothetical expanded bank): margin = 3.
 *
 * The thin-data case (≤2 scored blocks) is handled by the
 * `MIN_QT_BLOCKS_WITH_DATA` floor, not by the margin — so the formula
 * doesn't need to inflate when blocks are scarce.
 */
export function dynamicMargin(scoredBlocks: number): number {
  return Math.max(TOP_PICK_CONVERGENCE_MARGIN, Math.ceil(0.25 * scoredBlocks));
}

/**
 * Count of distinct Q-T blocks that produced AT LEAST ONE signal in
 * the given pool. Used by the min-data floor and the dynamic margin.
 * A Q-T block contributes to its pool's count when any of its items
 * was ranked (regardless of which function ended up #1).
 */
export function scoredBlocksFor(
  signals: Signal[],
  pool: CognitiveFunctionId[]
): number {
  const poolSet = new Set<string>(pool);
  const blocks = new Set<string>();
  for (const s of signals) {
    if (!poolSet.has(s.signal_id)) continue;
    for (const qid of s.source_question_ids ?? []) {
      if (qid.startsWith("Q-T")) blocks.add(qid);
    }
  }
  return blocks.size;
}

const N_FUNCTIONS = new Set<CognitiveFunctionId>(["ni", "ne"]);
const S_FUNCTIONS = new Set<CognitiveFunctionId>(["si", "se"]);

/**
 * Count the rank-1 picks for `fn` across the signal pool. A "top pick"
 * is any signal whose `rank === 1` — i.e. the user's #1 selection in
 * the originating Q-T (or other rank-bearing) question. This is the
 * canonical convergence metric per CC-134's owner principle.
 */
export function topPickCountFor(
  signals: Signal[],
  fn: CognitiveFunctionId
): number {
  let n = 0;
  for (const s of signals) {
    if (s.signal_id === fn && s.rank === 1) n++;
  }
  return n;
}

/**
 * For a given function pool (perceiving or judging), build the per-
 * function top-pick counts sorted desc with a deterministic tiebreak
 * (averageRank asc, then fn name asc).
 */
function poolTopPickRanking(
  signals: Signal[],
  pool: CognitiveFunctionId[]
): Array<{ fn: CognitiveFunctionId; topPicks: number; avg: number }> {
  return pool
    .map((fn) => ({
      fn,
      topPicks: topPickCountFor(signals, fn),
      avg: averageRank(signals, fn),
    }))
    .sort((a, b) => {
      if (b.topPicks !== a.topPicks) return b.topPicks - a.topPicks;
      if (a.avg !== b.avg) return a.avg - b.avg;
      return a.fn.localeCompare(b.fn);
    });
}

// CC-097-CONFIDENCE-FIX — same-dimension opposite-attitude pairs.
// dominantTooTight previously compared the dominant function's avg
// rank against the next-best function in the same POOL (perceiving
// or judging). For Si dominant the runner-up was typically Ne — the
// canonical tertiary in a developed Si-driver stack. Jung canon
// predicts the tertiary IS close to the dominant (healthy shape),
// so the legacy check conflated "developed tertiary" with "actual
// driver ambiguity." That bug systematically flagged 3 of 4 Si/Se-
// driver prod sessions (Daniel/Cindy/Harry) as ⚠ low confidence
// even though their driver+aux detection was correct.
//
// The fix (Option C in CC-097): compare dominant against its mirror
// — the same-dimension opposite-attitude function (Si↔Se,
// Ni↔Ne, Ti↔Te, Fi↔Fe). If THAT function is close, the dominant
// identity is genuinely ambiguous (am I introverted or extraverted
// in this dimension?). If only the tertiary is close, that's normal
// developed shape, not ambiguity. Intuitive drivers (Ni/Ne) were
// already passing because their mirror sits at inferior position in
// the canonical stack — naturally far. Sensing drivers (Si/Se) now
// get the same treatment.
//
// Class D mirror-axis cases (Se↔Ni, where the dominant and inferior
// flip across the MBTI dom-inf axis) are NOT caught by this check
// alone; they're addressed in future CC-097B/C (cross-signal
// inference + non-canonical-stack support).
const SAME_DIMENSION_MIRROR: Record<CognitiveFunctionId, CognitiveFunctionId> = {
  ni: "ne",
  ne: "ni",
  si: "se",
  se: "si",
  ti: "te",
  te: "ti",
  fi: "fe",
  fe: "fi",
};

const ALL_FUNCTIONS: CognitiveFunctionId[] = [
  "ne",
  "ni",
  "se",
  "si",
  "te",
  "ti",
  "fe",
  "fi",
];

// dominantSort — legacy avgRank tiebreak preserved as a void reference
// so the export surface is unchanged; CC-134 Part C no longer uses it
// (top-pick convergence supersedes avgRank-based dominant selection).
void PERCEIVING; // keep PERCEIVING reachable for future re-use; reference is in poolTopPickRanking.

const STACK_TABLE: Record<
  string,
  [
    CognitiveFunctionId,
    CognitiveFunctionId,
    CognitiveFunctionId,
    CognitiveFunctionId,
  ]
> = {
  "ni|te": ["ni", "te", "fi", "se"], // INTJ
  "ti|ne": ["ti", "ne", "si", "fe"], // INTP
  "te|ni": ["te", "ni", "se", "fi"], // ENTJ
  "ne|ti": ["ne", "ti", "fe", "si"], // ENTP
  "ni|fe": ["ni", "fe", "ti", "se"], // INFJ
  "fi|ne": ["fi", "ne", "si", "te"], // INFP
  "fe|ni": ["fe", "ni", "se", "ti"], // ENFJ
  "ne|fi": ["ne", "fi", "te", "si"], // ENFP
  "si|te": ["si", "te", "fi", "ne"], // ISTJ
  "ti|se": ["ti", "se", "ni", "fe"], // ISTP
  "te|si": ["te", "si", "ne", "fi"], // ESTJ
  "se|ti": ["se", "ti", "fe", "ni"], // ESTP
  "si|fe": ["si", "fe", "ti", "ne"], // ISFJ
  "fi|se": ["fi", "se", "ni", "te"], // ISFP
  "fe|si": ["fe", "si", "ne", "ti"], // ESFJ
  "se|fi": ["se", "fi", "te", "ni"], // ESFP
};

const MBTI_LOOKUP: Record<string, string> = {
  "ni|te": "INTJ",
  "ti|ne": "INTP",
  "te|ni": "ENTJ",
  "ne|ti": "ENTP",
  "ni|fe": "INFJ",
  "fi|ne": "INFP",
  "fe|ni": "ENFJ",
  "ne|fi": "ENFP",
  "si|te": "ISTJ",
  "ti|se": "ISTP",
  "te|si": "ESTJ",
  "se|ti": "ESTP",
  "si|fe": "ISFJ",
  "fi|se": "ISFP",
  "fe|si": "ESFJ",
  "se|fi": "ESFP",
};

const VALID_AUX_BY_DOMINANT: Record<CognitiveFunctionId, CognitiveFunctionId[]> =
  Object.fromEntries(
    Object.keys(STACK_TABLE).map((key) => {
      const [dominant] = key.split("|") as [CognitiveFunctionId, CognitiveFunctionId];
      const validAux = Object.keys(STACK_TABLE)
        .map((k) => k.split("|") as [CognitiveFunctionId, CognitiveFunctionId])
        .filter(([dom]) => dom === dominant)
        .map(([, aux]) => aux);
      return [dominant, validAux];
    })
  ) as Record<CognitiveFunctionId, CognitiveFunctionId[]>;

// ── Cumulative weight (CC-JX) — replaces averageRank for ordering ────────
//
// Pre-CC-JX `aggregateLensStack` ordered functions by *average rank*
// across Q-T blocks. CC-JX uses *cumulative weight* (sum of rank-aware
// weights — rank 1 = 3, rank 2 = 2, etc.) for ordering so the diagnostic
// can also surface raw weight magnitudes per function. Both metrics
// produce the same dominant/auxiliary identity for the existing fixture
// set; this is verified by the bit-for-bit Lens regression check.
function rankWeight(rank: number | undefined): number {
  if (rank === undefined) return 1;
  if (rank === 1) return 3;
  if (rank === 2) return 2;
  if (rank === 3) return 1;
  return 0.5;
}

function cumulativeWeightFor(
  signals: Signal[],
  fn: CognitiveFunctionId
): number {
  let total = 0;
  for (const s of signals) {
    if (s.signal_id === fn) {
      total += rankWeight(s.rank);
    }
  }
  return total;
}

function averageRank(signals: Signal[], fn: CognitiveFunctionId): number {
  const matches = signals.filter(
    (s) => s.signal_id === fn && s.rank !== undefined
  );
  if (matches.length === 0) return Number.POSITIVE_INFINITY;
  const sum = matches.reduce((acc, s) => acc + (s.rank ?? 0), 0);
  return sum / matches.length;
}

// ── Lens-canonical top-4 stack (preserves pre-CC-JX semantic) ───────────
//
// `aggregateLensStack` resolves the user's MBTI-canonical top-4 stack
// from Q-T signals. Input semantic identical to the pre-CC-JX
// implementation in `lib/identityEngine.ts`; CC-JX moves the function
// here as the single source of truth, and `identityEngine.ts` now
// re-exports it for backward-compat with import sites.

// CC-138 — binary-pick (Q-TB-*) detection. A session uses the new
// binary-format resolver if it contains AT LEAST ONE binary-pick
// signal (rank 1 with `source_question_ids` containing a `Q-TB-` id).
// Legacy ranking sessions never reach the binary path.
const BINARY_PERCEIVING_QID_NI_NE = "Q-TB-NI-NE";
const BINARY_PERCEIVING_QID_SI_SE = "Q-TB-SI-SE";
const BINARY_JUDGING_QID_TI_TE = "Q-TB-TI-TE";
const BINARY_JUDGING_QID_FI_FE = "Q-TB-FI-FE";
const BINARY_PERC_ORDER_QID = "Q-TB-PERC-ORDER";
const BINARY_JUDG_ORDER_QID = "Q-TB-JUDG-ORDER";

const ALL_BINARY_PICK_QIDS: readonly string[] = [
  BINARY_PERCEIVING_QID_NI_NE,
  BINARY_PERCEIVING_QID_SI_SE,
  BINARY_JUDGING_QID_TI_TE,
  BINARY_JUDGING_QID_FI_FE,
  BINARY_PERC_ORDER_QID,
  BINARY_JUDG_ORDER_QID,
];

function hasBinarySignals(signals: Signal[]): boolean {
  for (const s of signals) {
    if (s.source_question_ids?.some((q) => ALL_BINARY_PICK_QIDS.includes(q))) {
      return true;
    }
  }
  return false;
}

/**
 * CC-138 — binary-format Lens resolver. Reads the 4 attitude binary
 * picks (Q-TB-NI-NE, Q-TB-SI-SE, Q-TB-TI-TE, Q-TB-FI-FE) + the 2
 * dominance ordering picks (Q-TB-PERC-ORDER, Q-TB-JUDG-ORDER), applies
 * the opposite-attitude constraint, infers I/E from an existing
 * extraversion proxy signal, and resolves a canonical STACK_TABLE
 * entry. Confidence is `high` only when:
 *   - all 4 attitude binaries are present
 *   - both opposite-attitude constraints hold (perceiving picks are
 *     opposite attitude, judging picks are opposite attitude)
 *   - both dominance orderings are present
 *   - I/E inference is unambiguous
 *
 * Otherwise `low` with reasons populated (see ConfidenceLowReason
 * `binary-*` flags). Low-confidence sessions trigger the CC-134 §D
 * head-to-head clarifier via `followUpQuestions.ts` (the binary path
 * reuses the same clarifier surface).
 *
 * Exported separately so the compat dispatch in `aggregateLensStack`
 * can call it conditionally.
 */
export function aggregateLensStackBinary(signals: Signal[]): LensStack {
  const reasons: ConfidenceLowReason[] = [];
  // CC-161 — track which axis each binary-* reason fires on so the
  // follow-up generator can pit the actually-picked functions
  // head-to-head (instead of falling back to `topPickCountFor` which
  // counts empty legacy Q-T rank slots in a binary session and
  // selected Ne/Si garbage on the Nat case).
  let binaryContestedJudgingPair:
    | [CognitiveFunctionId, CognitiveFunctionId]
    | undefined;
  let binaryContestedPerceivingPair:
    | [CognitiveFunctionId, CognitiveFunctionId]
    | undefined;

  // Helper: get the function id chosen for a binary-pick question.
  const pickFor = (qid: string): CognitiveFunctionId | null => {
    for (const s of signals) {
      if (s.source_question_ids?.includes(qid) && s.rank === 1) {
        if (ALL_FUNCTIONS.includes(s.signal_id as CognitiveFunctionId)) {
          return s.signal_id as CognitiveFunctionId;
        }
      }
    }
    return null;
  };

  const nePick = pickFor(BINARY_PERCEIVING_QID_NI_NE);
  const sePick = pickFor(BINARY_PERCEIVING_QID_SI_SE);
  const tePick = pickFor(BINARY_JUDGING_QID_TI_TE);
  const fePick = pickFor(BINARY_JUDGING_QID_FI_FE);

  const allFour = [nePick, sePick, tePick, fePick];
  if (allFour.some((p) => p === null)) {
    reasons.push("binary-thin");
  }

  // Opposite-attitude constraint check. Perceiving: Ni+Se or Ne+Si.
  // Judging: Ti+Fe or Te+Fi. Same-attitude pair (Ni+Si etc.) means
  // the user picked two introverted attitudes (or two extraverted) —
  // impossible in a canonical stack → contamination fingerprint.
  const isIntroverted = (fn: CognitiveFunctionId): boolean =>
    fn === "ni" || fn === "si" || fn === "ti" || fn === "fi";
  if (
    nePick &&
    sePick &&
    isIntroverted(nePick) === isIntroverted(sePick)
  ) {
    reasons.push("binary-attitude-violation");
    // CC-161 — perceiving axis is the one in violation.
    binaryContestedPerceivingPair = [nePick, sePick];
  }
  if (
    tePick &&
    fePick &&
    isIntroverted(tePick) === isIntroverted(fePick)
  ) {
    reasons.push("binary-attitude-violation");
    // CC-161 — judging axis is the one in violation.
    binaryContestedJudgingPair = [tePick, fePick];
  }

  // Dominance ordering picks. Each names which of the user's two
  // axis-picks leads on that axis (T-led or F-led; N-led or S-led).
  const percOrderPick = pickFor(BINARY_PERC_ORDER_QID); // expected: nePick or sePick
  const judgOrderPick = pickFor(BINARY_JUDG_ORDER_QID); // expected: tePick or fePick

  // The perceiving axis page-winner = whichever of nePick / sePick the
  // user ordered first on Q-TB-PERC-ORDER. If both are present and the
  // ordering pick matches one of them, that's the perceiving leader.
  // Same for judging.
  let perceivingLeader: CognitiveFunctionId | null = null;
  if (nePick && sePick && percOrderPick) {
    if (percOrderPick === nePick) perceivingLeader = nePick;
    else if (percOrderPick === sePick) perceivingLeader = sePick;
    else {
      reasons.push("binary-dominance-ambiguous");
      // CC-161 — perceiving axis contested.
      binaryContestedPerceivingPair =
        binaryContestedPerceivingPair ?? [nePick, sePick];
    }
  } else if (nePick || sePick) {
    reasons.push("binary-dominance-ambiguous");
    // CC-161 — both perc picks present but no ordering → still
    // ambiguous on perceiving.
    if (nePick && sePick) {
      binaryContestedPerceivingPair =
        binaryContestedPerceivingPair ?? [nePick, sePick];
    }
  }
  let judgingLeader: CognitiveFunctionId | null = null;
  if (tePick && fePick && judgOrderPick) {
    if (judgOrderPick === tePick) judgingLeader = tePick;
    else if (judgOrderPick === fePick) judgingLeader = fePick;
    else {
      reasons.push("binary-dominance-ambiguous");
      // CC-161 — judging axis contested.
      binaryContestedJudgingPair =
        binaryContestedJudgingPair ?? [tePick, fePick];
    }
  } else if (tePick || fePick) {
    reasons.push("binary-dominance-ambiguous");
    if (tePick && fePick) {
      binaryContestedJudgingPair =
        binaryContestedJudgingPair ?? [tePick, fePick];
    }
  }

  // I/E inference: prefer the existing extraversion proxy signal
  // (`extraversion_proxy` from Q-O2 / similar). When unavailable OR
  // ambiguous, default to introverted-dominant (the historically
  // safer default given the OCEAN engine's distribution) but flag.
  // CC-138 owner-design fallback (b) — explicit order-the-two of the
  // page-winners — is NOT implemented in this CC; flagged for
  // follow-up if inference proves unreliable in practice.
  const extraversionProxy = signals.find(
    (s) =>
      s.signal_id === "extraversion_proxy" ||
      s.signal_id === "extraversion_priority" ||
      s.signal_id === "outward_energy_priority"
  );
  const inferredExtravert =
    extraversionProxy !== undefined &&
    typeof extraversionProxy.rank === "number" &&
    extraversionProxy.rank <= 2;

  // Resolve dominant: between perceivingLeader + judgingLeader, the
  // dominant is the one matching the I/E inference. If
  // perceivingLeader is introverted AND inferredExtravert is false,
  // perceivingLeader is dominant (introvert-led). If perceivingLeader
  // is extraverted AND inferredExtravert is true, perceivingLeader is
  // dominant. Otherwise judgingLeader is dominant.
  let dominant: CognitiveFunctionId | null = null;
  let auxiliary: CognitiveFunctionId | null = null;
  if (perceivingLeader && judgingLeader) {
    const percIsIntro = isIntroverted(perceivingLeader);
    const judgIsIntro = isIntroverted(judgingLeader);
    if (percIsIntro !== judgIsIntro) {
      // One is intro, one is extra — clean dom/aux selection by I/E.
      if (inferredExtravert) {
        // Extraverted dominant.
        if (!percIsIntro) {
          dominant = perceivingLeader;
          auxiliary = judgingLeader;
        } else {
          dominant = judgingLeader;
          auxiliary = perceivingLeader;
        }
      } else {
        // Introverted dominant.
        if (percIsIntro) {
          dominant = perceivingLeader;
          auxiliary = judgingLeader;
        } else {
          dominant = judgingLeader;
          auxiliary = perceivingLeader;
        }
      }
    } else {
      // Both leaders share attitude — not a canonical stack.
      reasons.push("binary-attitude-violation");
    }
  }

  // If we couldn't resolve dom/aux, fall back to a placeholder stack
  // (low confidence). Don't throw — engine pipeline expects a value.
  if (!dominant || !auxiliary) {
    return {
      dominant: dominant ?? "ni",
      auxiliary: auxiliary ?? "te",
      tertiary: "fi",
      inferior: "se",
      confidence: "low",
      confidenceLowReasons: reasons.length > 0 ? reasons : ["binary-thin"],
      binaryContestedJudgingPair,
      binaryContestedPerceivingPair,
    };
  }

  // Look up the canonical stack tuple. If the dom|aux key isn't a
  // valid canonical pair (e.g. Ni|Fi from a constraint violation),
  // fall back to the placeholder. STACK_TABLE / VALID_AUX_BY_DOMINANT
  // are unchanged — CC-138 reuses the existing canon.
  const key = `${dominant}|${auxiliary}`;
  const stackTuple = STACK_TABLE[key];
  const mbtiCode = MBTI_LOOKUP[key];
  if (!stackTuple) {
    reasons.push("binary-attitude-violation");
    // CC-161 — fallback case: the dom|aux pair itself is non-canonical.
    // Treat it as contested on the judging axis as a default (the
    // most common cause is mismatched judging attitudes); the
    // followup generator surfaces the actually-picked judging pair.
    return {
      dominant,
      auxiliary,
      tertiary: "fi",
      inferior: "se",
      confidence: "low",
      confidenceLowReasons: reasons,
      binaryContestedJudgingPair:
        binaryContestedJudgingPair ?? (tePick && fePick ? [tePick, fePick] : undefined),
      binaryContestedPerceivingPair,
    };
  }

  const confidence: "high" | "low" = reasons.length > 0 ? "low" : "high";

  return {
    dominant: stackTuple[0],
    auxiliary: stackTuple[1],
    tertiary: stackTuple[2],
    inferior: stackTuple[3],
    mbtiCode,
    confidence,
    confidenceLowReasons: reasons.length > 0 ? reasons : undefined,
    // CC-161 — only surface contested pairs when reasons actually
    // include a binary-* flag. A confident binary session has no
    // contested pair (otherwise the follow-up generator would
    // double-emit a clarifier where none is warranted).
    binaryContestedJudgingPair:
      reasons.length > 0 ? binaryContestedJudgingPair : undefined,
    binaryContestedPerceivingPair:
      reasons.length > 0 ? binaryContestedPerceivingPair : undefined,
  };
}

export function aggregateLensStack(signals: Signal[]): LensStack {
  // CC-138 — dispatch: binary-format sessions resolve via the new
  // binary resolver (Q-TB-* signals present). Legacy ranking-format
  // sessions continue to use the CC-134 top-pick convergence path
  // (unchanged below). The two paths are mutually exclusive per
  // session by design — `data/questions.ts` no longer issues the
  // legacy Q-T1-T8 rankings to new sessions, but the legacy questions
  // remain in the bank so existing cohort answers continue to derive.
  if (hasBinarySignals(signals)) {
    return aggregateLensStackBinary(signals);
  }

  // CC-134 Part C — Lens stack resolution is now driven by top-pick
  // convergence (rank-1 frequency per pool) instead of flat
  // averageRank. averageRank is retained as a deterministic
  // tiebreaker only. See TOP_PICK_CONVERGENCE_MARGIN +
  // NS_VALENCE_GUARD_MARGIN above for the threshold canon. Movement
  // numerics do NOT depend on the lens stack (verified via the CC-134
  // numeric-invariant check), so this change is type-only.
  const perceivingByTopPick = poolTopPickRanking(signals, PERCEIVING);
  const judgingByTopPick = poolTopPickRanking(signals, JUDGING);

  const dominantPerceiving = perceivingByTopPick[0];
  const dominantJudging = judgingByTopPick[0];

  // Degenerate / thin-signal fixture — no top-picks landed in either
  // pool AND averageRank is non-finite (no ranks at all). Fall through
  // to the legacy default (preserves backward-compat with pre-CC-134
  // empty-signal fixtures).
  if (
    dominantPerceiving.topPicks === 0 &&
    dominantJudging.topPicks === 0 &&
    !isFinite(dominantPerceiving.avg) &&
    !isFinite(dominantJudging.avg)
  ) {
    return {
      dominant: "ni",
      auxiliary: "te",
      tertiary: "fi",
      inferior: "se",
      confidence: "low",
    };
  }

  // CC-134 §C.2 — between perceiving and judging dominants, the one
  // with MORE top-picks leads. Ties: prefer perceiving (matches the
  // pre-CC-134 `dominantSort` convention so canonical Ni/Si/etc.
  // drivers don't suddenly demote on a tie). The legacy avgRank-
  // based "lower is better" comparison flipped here to "more top
  // picks is better."
  const perceivingLeads =
    dominantPerceiving.topPicks > dominantJudging.topPicks ||
    (dominantPerceiving.topPicks === dominantJudging.topPicks &&
      dominantPerceiving.topPicks > 0);
  const dominant = perceivingLeads ? dominantPerceiving : dominantJudging;

  // Aux selection: within the VALID_AUX_BY_DOMINANT constraints,
  // pick the highest top-pick count. Tiebreak on averageRank asc.
  const validAuxCandidates = VALID_AUX_BY_DOMINANT[dominant.fn];
  const auxByTopPick = validAuxCandidates
    .map((fn) => ({
      fn,
      topPicks: topPickCountFor(signals, fn),
      avg: averageRank(signals, fn),
    }))
    .sort((a, b) => {
      if (b.topPicks !== a.topPicks) return b.topPicks - a.topPicks;
      if (a.avg !== b.avg) return a.avg - b.avg;
      return a.fn.localeCompare(b.fn);
    });
  const auxiliary = auxByTopPick[0];
  const key = `${dominant.fn}|${auxiliary.fn}`;
  const stackTuple = STACK_TABLE[key];
  const mbtiCode = MBTI_LOOKUP[key];

  if (!stackTuple) {
    throw new Error(`Non-canonical Jungian stack resolved: ${key}`);
  }

  // Confidence from convergence (CC-134 §C.3 + CC-134.1 calibration).
  // The leader must clear the in-pool runner-up by `dynamicMargin`
  // (data-relative, floored at TOP_PICK_CONVERGENCE_MARGIN). Scattered
  // #1s with no clear leader → low → triggers Part D head-to-head
  // clarifier. The auxiliary follows the same rule against its in-pool
  // runner-up.
  //
  // CC-134.1 additions:
  //   - Min-data floor: dominant pool must have ≥ MIN_QT_BLOCKS_WITH_DATA
  //     scored blocks AND the dominant must have ≥ MIN_DOMINANT_TOP_PICKS
  //     top-picks; otherwise `low` regardless of margin.
  //   - Data-relative margin via `dynamicMargin(scoredBlocks)`.
  //   - Judging co-occurrence guard (Ti+Fi / Te+Fe).
  const dominantPool = PERCEIVING.includes(dominant.fn)
    ? perceivingByTopPick
    : judgingByTopPick;
  const dominantPoolFunctions = PERCEIVING.includes(dominant.fn)
    ? PERCEIVING
    : JUDGING;
  const dominantPoolScoredBlocks = scoredBlocksFor(signals, dominantPoolFunctions);
  const auxPoolFunctions = PERCEIVING.includes(auxiliary.fn)
    ? PERCEIVING
    : JUDGING;
  const auxPoolScoredBlocks = scoredBlocksFor(signals, auxPoolFunctions);

  const dominantMargin = dynamicMargin(dominantPoolScoredBlocks);
  const auxMargin = dynamicMargin(auxPoolScoredBlocks);

  const dominantRunnerUp = dominantPool[1];
  const auxRunnerUp = auxByTopPick[1];

  const dominantConvergenceWeak =
    dominantRunnerUp !== undefined &&
    dominant.topPicks - dominantRunnerUp.topPicks < dominantMargin;
  const auxConvergenceWeak =
    auxRunnerUp !== undefined &&
    auxiliary.topPicks - auxRunnerUp.topPicks < auxMargin;

  // CC-097-CONFIDENCE-FIX intuition preserved: the same-dimension
  // mirror (Si↔Se, Ni↔Ne, Ti↔Te, Fi↔Fe) is the disambiguation axis.
  // Under top-pick semantics, if the dominant's mirror has nearly the
  // same top-pick count, the attitude (introverted vs extraverted) is
  // genuinely ambiguous. CC-134.1 — reuses `dynamicMargin` so the
  // mirror tightness check scales with data.
  const dominantMirror = SAME_DIMENSION_MIRROR[dominant.fn];
  const dominantMirrorTopPicks = topPickCountFor(signals, dominantMirror);
  const dominantMirrorTooTight =
    dominant.topPicks - dominantMirrorTopPicks < dominantMargin;

  // CC-134 §C.6 — N/S valence guard. CC-134.1 — reuse `dynamicMargin`
  // (perceiving pool) so the guard tightens with full perceiving Q-T
  // data and stays at 2 when data is thin.
  let nsValenceSuspect = false;
  if (N_FUNCTIONS.has(dominantPerceiving.fn)) {
    const sLeader = perceivingByTopPick.find((r) => S_FUNCTIONS.has(r.fn));
    const nsMargin = dynamicMargin(
      scoredBlocksFor(signals, PERCEIVING)
    );
    if (
      sLeader &&
      dominantPerceiving.topPicks - sLeader.topPicks < nsMargin
    ) {
      nsValenceSuspect = true;
    }
  }

  // CC-134.1 §Task 3 — judging-axis co-occurrence guard. A canonical
  // stack never holds two same-attitude judging functions, so
  // meaningful top-picks on BOTH Ti & Fi (or Te & Fe) is impossible —
  // it's the warm-Ti-pulls-Fi (or warm-Te-pulls-Fe) fingerprint. When
  // both members of an impossible pair exceed the threshold, force
  // `low` and trigger the §D judging head-to-head clarifier.
  // **CC-138 supersedes this for binary-format sessions** via the
  // opposite-attitude constraint built into the new item flow.
  const tiTop = topPickCountFor(signals, "ti");
  const fiTop = topPickCountFor(signals, "fi");
  const teTop = topPickCountFor(signals, "te");
  const feTop = topPickCountFor(signals, "fe");
  const judgingCoOccurrenceSuspect =
    (tiTop >= JUDGING_COOCCURRENCE_THRESHOLD &&
      fiTop >= JUDGING_COOCCURRENCE_THRESHOLD) ||
    (teTop >= JUDGING_COOCCURRENCE_THRESHOLD &&
      feTop >= JUDGING_COOCCURRENCE_THRESHOLD);

  // CC-134.1 §Task 1 — minimum-data floor. The dominant pool must
  // carry enough observed signal for `high` to be earned at all.
  // Below the floor → `low` regardless of how cleanly the margin
  // clears (since with thin data a 2-vs-0 lead is near-random, not
  // convergent). The floor applies to the dominant's pool only —
  // the aux pool is allowed to be thinner since aux is less load-
  // bearing for the type label.
  const belowMinDominantPicks = dominant.topPicks < MIN_DOMINANT_TOP_PICKS;
  const belowMinScoredBlocks =
    dominantPoolScoredBlocks < MIN_QT_BLOCKS_WITH_DATA;
  const belowMinDataFloor = belowMinDominantPicks || belowMinScoredBlocks;

  // CC-141 §A — collect WHY confidence is low. Each flag corresponds
  // to a distinct check above. Downstream (cross-signal lift +
  // followUpQuestions clarifier triggers) uses these to make
  // axis-specific decisions: dominant-agreement lift may only resolve
  // reasons it actually addresses; contaminated-axis clarifiers fire
  // on the reasons directly, decoupled from any lifted display value.
  const reasons: ConfidenceLowReason[] = [];
  if (belowMinDataFloor) reasons.push("thin-floor");
  if (dominantConvergenceWeak) reasons.push("dominant-convergence-weak");
  if (auxConvergenceWeak) reasons.push("aux-ambiguous");
  if (dominantMirrorTooTight) reasons.push("dominant-mirror");
  if (nsValenceSuspect) reasons.push("ns-valence");
  if (judgingCoOccurrenceSuspect) reasons.push("judging-cooccurrence");

  const confidence: "high" | "low" = reasons.length > 0 ? "low" : "high";

  // CC-159 — surface the within-margin aux pair (chosen + runner-up)
  // so the follow-up generator can route to the right head-to-head
  // clarifier. The Nat case (low-confidence INTJ with Te/Fe within
  // margin) detected ambiguity but asked nothing to resolve it; with
  // this field, `buildFollowUpInput` can build a Te-vs-Fe judging
  // clarifier on the spot. Only populated when `aux-ambiguous`
  // actually fired; the field is undefined otherwise.
  const auxAmbiguousPair:
    | [CognitiveFunctionId, CognitiveFunctionId]
    | undefined =
    auxConvergenceWeak && auxRunnerUp !== undefined
      ? [auxiliary.fn, auxRunnerUp.fn]
      : undefined;

  return {
    dominant: stackTuple[0],
    auxiliary: stackTuple[1],
    tertiary: stackTuple[2],
    inferior: stackTuple[3],
    mbtiCode,
    confidence,
    confidenceLowReasons: reasons.length > 0 ? reasons : undefined,
    auxAmbiguousPair,
  };
}

// ── computeJungianStack — CC-JX shared resolver ─────────────────────────
//
// Returns an 8-entry stack covering all cog functions. Top-4 positions
// follow the Lens-canonical MBTI ordering (consistent with the existing
// `aggregateLensStack` semantic). Positions 5–8 are the "shadow stack"
// (the four functions NOT in the conscious stack); their canonical order
// isn't load-bearing because position weight 5+ is zero, but for
// diagnostic reproducibility they're sorted by `cumulativeRawWeight` desc.
//
// `explicitOrdering` is the future hook for a Q-Function-Order question
// (not yet in the bank). When provided, the ordering is used directly —
// supplied list defines positions 1..N; any missing functions land in the
// shadow tail in `cumulativeRawWeight` desc order.

export function computeJungianStack(
  signals: Signal[],
  explicitOrdering?: CogFunction[]
): JungianStack {
  const cumulative: Record<CogFunction, number> = {
    ne: 0,
    ni: 0,
    se: 0,
    si: 0,
    te: 0,
    ti: 0,
    fe: 0,
    fi: 0,
  };
  for (const fn of ALL_FUNCTIONS) {
    cumulative[fn] = cumulativeWeightFor(signals, fn);
  }

  let order: CogFunction[];
  if (explicitOrdering && explicitOrdering.length > 0) {
    const provided = [...explicitOrdering];
    const missing = ALL_FUNCTIONS.filter((f) => !provided.includes(f));
    missing.sort((a, b) => cumulative[b] - cumulative[a]);
    order = [...provided, ...missing];
  } else {
    const lens = aggregateLensStack(signals);
    const top4: CogFunction[] = [
      lens.dominant,
      lens.auxiliary,
      lens.tertiary,
      lens.inferior,
    ];
    const shadow = ALL_FUNCTIONS.filter((f) => !top4.includes(f));
    shadow.sort((a, b) => cumulative[b] - cumulative[a]);
    order = [...top4, ...shadow];
  }

  return order.map((fn, i) => {
    const position = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    return {
      function: fn,
      position,
      positionWeight: positionWeightFor(position),
      cumulativeRawWeight: cumulative[fn],
    };
  });
}

// ── Re-exports for diagnostic-time inspection ───────────────────────────

export const JUNGIAN_STACK_TABLE = STACK_TABLE;
export const JUNGIAN_MBTI_LOOKUP = MBTI_LOOKUP;
export const JUNGIAN_VALID_AUX_BY_DOMINANT = VALID_AUX_BY_DOMINANT;
export const JUNGIAN_PERCEIVING = PERCEIVING;
export const JUNGIAN_JUDGING = JUDGING;
export const JUNGIAN_ALL_FUNCTIONS = ALL_FUNCTIONS;
