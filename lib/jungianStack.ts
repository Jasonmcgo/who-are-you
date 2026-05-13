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

function dominantSort(
  a: { fn: CognitiveFunctionId; avg: number },
  b: { fn: CognitiveFunctionId; avg: number }
): number {
  if (a.avg !== b.avg) return a.avg - b.avg;
  const aPerceiving = PERCEIVING.includes(a.fn);
  const bPerceiving = PERCEIVING.includes(b.fn);
  if (aPerceiving !== bPerceiving) return aPerceiving ? -1 : 1;
  return a.fn.localeCompare(b.fn);
}

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

export function aggregateLensStack(signals: Signal[]): LensStack {
  const allRanks = ALL_FUNCTIONS.map((fn) => ({
    fn,
    avg: averageRank(signals, fn),
  }));
  allRanks.sort(dominantSort);
  const perceivingRanks = PERCEIVING.map((fn) => ({
    fn,
    avg: averageRank(signals, fn),
  })).sort((a, b) => a.avg - b.avg || a.fn.localeCompare(b.fn));
  const judgingRanks = JUDGING.map((fn) => ({
    fn,
    avg: averageRank(signals, fn),
  })).sort((a, b) => a.avg - b.avg || a.fn.localeCompare(b.fn));

  const dominantPerceiving = perceivingRanks[0];
  const dominantJudging = judgingRanks[0];
  if (
    !isFinite(dominantPerceiving.avg) ||
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

  const dominant =
    dominantPerceiving.avg <= dominantJudging.avg
      ? dominantPerceiving
      : dominantJudging;
  const validAuxCandidates = VALID_AUX_BY_DOMINANT[dominant.fn];
  const auxCandidatesWithAvgs = validAuxCandidates
    .map((fn) => ({ fn, avg: averageRank(signals, fn) }))
    .sort((a, b) => a.avg - b.avg || a.fn.localeCompare(b.fn));
  const auxiliary = auxCandidatesWithAvgs[0];
  const key = `${dominant.fn}|${auxiliary.fn}`;
  const stackTuple = STACK_TABLE[key];
  const mbtiCode = MBTI_LOOKUP[key];

  if (!stackTuple) {
    throw new Error(`Non-canonical Jungian stack resolved: ${key}`);
  }

  const dominantPool = PERCEIVING.includes(dominant.fn)
    ? PERCEIVING
    : JUDGING;
  const dominantRunnerUp = allRanks.find(
    (candidate) =>
      candidate.fn !== dominant.fn && dominantPool.includes(candidate.fn)
  );
  const auxRunnerUp = auxCandidatesWithAvgs[1];
  const dominantTooTight =
    dominantRunnerUp !== undefined &&
    dominantRunnerUp.avg - dominant.avg < MBTI_TIE_MARGIN;
  const auxTooTight =
    !isFinite(auxiliary.avg) ||
    (auxRunnerUp !== undefined &&
      auxRunnerUp.avg - auxiliary.avg < MBTI_TIE_MARGIN);
  const confidence: "high" | "low" =
    dominantTooTight || auxTooTight ? "low" : "high";

  return {
    dominant: stackTuple[0],
    auxiliary: stackTuple[1],
    tertiary: stackTuple[2],
    inferior: stackTuple[3],
    mbtiCode,
    confidence,
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
