# CC-037 — OCEAN Derivation from Existing Signals (Disposition Map)

**Type:** New derivation framework + new visual section. **No new questions, no new signals.** Mirrors the Drive framework's architecture (CC-026): tagging table over existing signals, rank-aware weighted distribution, dedicated render surface.
**Goal:** Produce a system-derived Big-5 OCEAN (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) ranking using only signals already collected by the instrument. The user is never asked to rank themselves on OCEAN — the distribution emerges from how they answered other questions. Render as a "Disposition Map" page section between the Mirror card and the Compass card.
**Predecessors:** CC-026 (Drive Integration — architectural template). CC-033 (Drive bucket relabel — adds Q-Ambition1 signals available for OCEAN tagging). All shipped pre-2026-04-29 or queued ahead of CC-037.
**Successor:** None hard-blocked. A future CC could add a single forced-choice Q-N1 to firm up Neuroticism if browser smoke shows it reading thin. Not in this CC.

---

## Why this CC

The instrument today produces eight ShapeCard outputs (Lens, Compass, Conviction, Gravity, Trust, Weather, Fire, Path) plus the Drive distribution on Path · Gait. None of these output a Big-5 OCEAN read. OCEAN is a widely-recognized, research-validated personality framework — adding a derivation layer over existing signals gives the report a vocabulary that translates the instrument's specific findings into a register that other tools, clinicians, and researchers can immediately recognize.

Per the project's standing memory `feedback_minimal_questions_maximum_output.md` — *derive new dimensions from existing signals before adding survey questions* — this CC does derivation-only. No new measurement surface; the instrument's existing 34-question footprint stays unchanged.

Empirical grounding: Jung-Big5 correlations are well-documented in the personality-psychology literature (extraversion preference correlates with Big-5 Extraversion ~0.5–0.7; intuition preference correlates with Big-5 Openness ~0.5–0.7; thinking/feeling preference correlates with Big-5 Agreeableness ~0.4–0.5; Si/Te dominance correlates with Big-5 Conscientiousness ~0.5–0.6). The instrument's compass values, allocation rankings, pressure-block answers, and formation-block answers carry additional signal that strengthens the Big-5 derivation beyond what Lens alone could deliver.

**Caveat that shapes the architecture:** Big-5 Neuroticism is fundamentally a trait-level emotional-reactivity measure. The instrument's existing signals proxy Neuroticism through formation-history (`chaos_exposure`), current-context load (`high_pressure_context`), pressure-adaptation behavior (`adapts_under_social_pressure`, `adapts_under_economic_pressure`, `hides_belief`), and agency reactivity (`reactive_operator`). These are state-and-history measures, not disposition. CC-037 ships Neuroticism as a derivation but flags it as **estimated** in the canonical output and in the user-facing prose. Future tuning may add Q-N1 to firm up the Neuroticism axis directly.

---

## Scope

Files modified or created:

1. **NEW** — `lib/ocean.ts`. Houses the OCEAN tagging table, distribution-compute function, rank-aware weighting (re-using Drive's 3/2/1/0.5 ladder), distribution-shape classifier, and prose generator.
2. `lib/types.ts` — add `OceanBucket`, `OceanDistribution`, `OceanRanking`, `OceanCase`, `OceanOutput` types.
3. `lib/identityEngine.ts` — wire `computeOceanOutput` into the engine pipeline; extend `EngineOutput` to include `ocean?: OceanOutput`.
4. **NEW** — `app/components/OceanBars.tsx`. Horizontal bar chart for the OCEAN distribution. Editorial chart, paper background, ink bar strokes, umber accent on the largest bar. The Neuroticism bar gets an "estimated" subscript marker.
5. `app/page.tsx` (or wherever the report assembles ShapeCards) — render a "Disposition Map" page section between the Mirror card and the Compass card. The section consumes `engineOutput.ocean` and renders `<OceanBars />` plus the prose paragraph.
6. **NEW** — `docs/canon/ocean-framework.md`. Architectural rules; full tagging table; weighting rationale; the Neuroticism caveat; distribution-shape classifier cases; prose templates.
7. `docs/canon/signal-library.md` — annotate each existing signal with its OCEAN tag(s). Read-only addition; no signal definitions change.
8. `docs/canon/output-engine-rules.md` — add OCEAN to the engine output pipeline section; document the Disposition Map render position (between Mirror and Compass).
9. `docs/canon/shape-framework.md` — note the Disposition Map as a *non-card* page section (not a ShapeCard). Document the design choice (no body-part metaphor; sits adjacent to Mirror because Jung-Big5 correlation makes adjacency natural).

Nothing else. No new questions. No new signals. No changes to existing question text, item labels, glosses, or signal definitions. No changes to existing ShapeCards, their prose, or their architecture. No changes to the Drive framework. No changes to `pickGiftCategory` or the gift-category routing (CC-034 / CC-036 territory).

---

## Locked architectural decisions

### Buckets

Five OCEAN buckets in canonical order:

```ts
type OceanBucket = "O" | "C" | "E" | "A" | "N";
```

Internal codenames are the single-letter Big-5 abbreviations. User-facing labels:

- O → "Openness"
- C → "Conscientiousness"
- E → "Extraversion"
- A → "Agreeableness"
- N → "Emotional Reactivity (estimated)"

Note the user-facing N label uses "Emotional Reactivity" rather than "Neuroticism." Reason: "neuroticism" carries clinical-pejorative baggage that doesn't match the instrument's tone (per `result-writing-canon.md` precedent — frame names should describe register, not pathologize it). The "(estimated)" parenthetical makes the proxy nature explicit.

The framework codename in code stays `"N"` for type-system stability; only the human-facing label changes.

### Multi-tag handling

Signals may tag multiple buckets. When a signal tags N buckets, its weighted contribution splits 1/N across those buckets. Mirrors the Drive `MULTI_TAG_SPLITS` pattern but generalized to N≥2 buckets per signal.

### Rank-aware weighting

Re-uses Drive's `weightFor()` ladder (rank 1 = 3×, rank 2 = 2×, rank 3 = 1×, rank ≥ 4 = 0.5×, unranked = 1). Import from `lib/drive.ts` rather than duplicating, so a future tuning change to the ladder propagates to both frameworks.

### Distribution

Output normalized to percentages summing to 100. The `OceanDistribution` shape:

```ts
type OceanDistribution = {
  O: number; C: number; E: number; A: number; N: number;
  rankAware: boolean;
  inputCount: { O: number; C: number; E: number; A: number; N: number };
  neuroticismEstimated: true; // always true; flag for prose and UI
};
```

### No claimed-vs-revealed split

The Drive framework has both claimed (Q-3C1) and revealed (15-input distribution) for its claimed-vs-revealed tension. CC-037 has revealed only — the user is never asked to rank themselves on OCEAN. There is no `OceanRanking` for "claimed Big-5"; just the derived distribution.

This simplifies the case classifier compared to Drive: 4 cases, not 6.

### Distribution-shape cases

Four locked cases for the prose engine:

| Case | Condition | Prose register |
|---|---|---|
| `single-dominant` | Top bucket > 30% AND > 10pp ahead of #2 | "Your strongest disposition reads as {top}" |
| `two-dominant` | Top two buckets each > 22% AND within 5pp of each other | "Your disposition is shaped by {top1} and {top2} in roughly equal weight" |
| `balanced` | Max-min spread across all five < 12pp | "Your disposition is unusually balanced — no single dimension dominates" |
| `n-elevated` | N > 22% (regardless of overall shape) | Neuroticism-specific: "Your distribution shows elevated emotional-reactivity proxies — meaning the instrument detected formation, context, or pressure-adaptation signals that often correlate with Big-5 Neuroticism. Treat this as an estimate; the instrument doesn't measure trait-level reactivity directly." Composes with the dominant-shape prose if applicable. |

### Render position

A page section labeled **"Disposition Map"** rendered between the Mirror card (Lens) and the Compass card. NOT a ShapeCard. Reason: ShapeCards have a 4-section architecture (Strength / Growth Edge / Practice / Pattern Note) and a body-part metaphor; OCEAN is a cross-cutting derivation that doesn't fit that schema cleanly.

The section contains:
1. Section header: "DISPOSITION MAP" (mono uppercase, matches existing section-header style).
2. One-paragraph framing: "Big-5 personality dimensions, derived from how you answered other questions in this instrument. No single answer determines a dimension; the model reads patterns across the full 34-question footprint."
3. `<OceanBars />` rendering the 5-bar distribution.
4. Distribution-shape prose paragraph.
5. Footnote: "Emotional Reactivity is shown as an estimate — the instrument measures it through proxy signals (formation history, current-context load, pressure-adaptation behavior) rather than directly."

---

## The tagging table — locked

Each signal contributes to one or more OCEAN buckets. Multi-tagged signals split-weight 1/N across their buckets. Signals not listed are excluded (e.g., demographic answers, free-form belief content).

```ts
const SIGNAL_OCEAN_TAGS: Record<string, OceanBucket[]> = {
  // ── Lens (cognitive functions, Q-T1–T8) ─────────────────────────────────
  ni: ["O"],
  ne: ["O", "E"],
  si: ["C"],
  se: ["E", "O"],
  ti: ["O", "C"],
  te: ["C", "E"],
  fi: ["A"],
  fe: ["A", "E"],

  // ── Compass: sacred values (Q-S1, Q-S2) ─────────────────────────────────
  freedom_priority: ["O"],
  truth_priority: ["O", "C"],
  stability_priority: ["C"],
  loyalty_priority: ["A", "C"],
  peace_priority: ["A"],
  honor_priority: ["C"],
  family_priority: ["A"],
  knowledge_priority: ["O"],
  justice_priority: ["C", "A"],
  faith_priority: ["C"],
  compassion_priority: ["A"],
  mercy_priority: ["A"],

  // ── Compass: concrete stakes (Q-Stakes1, post-CC-035) ───────────────────
  money_stakes_priority: ["C"],
  job_stakes_priority: ["C"],
  close_relationships_stakes_priority: ["A"],
  reputation_stakes_priority: ["E", "C"],
  health_stakes_priority: ["C"],
  time_autonomy_stakes_priority: ["O"],

  // ── Allocation: money flow (Q-S3-close, Q-S3-wider) ─────────────────────
  self_spending_priority: [], // intentionally untagged — direction-neutral on OCEAN
  family_spending_priority: ["A"],
  friends_spending_priority: ["E", "A"],
  social_spending_priority: ["E"],
  nonprofits_religious_spending_priority: ["A"],
  companies_spending_priority: ["C"],

  // ── Allocation: energy flow (Q-E1-outward, Q-E1-inward) ─────────────────
  building_energy_priority: ["C", "O"],
  solving_energy_priority: ["C"],
  restoring_energy_priority: ["C"],
  caring_energy_priority: ["A"],
  learning_energy_priority: ["O"],
  enjoying_energy_priority: ["O", "E"],

  // ── Drive: claimed (Q-3C1) ──────────────────────────────────────────────
  cost_drive: ["C"],
  coverage_drive: ["A"],
  compliance_drive: ["C"],

  // ── Drive: ambition (Q-Ambition1, post-CC-033) ──────────────────────────
  success_priority: ["C", "E"],
  fame_priority: ["E"],
  wealth_priority: ["C"],
  legacy_priority: ["C", "O"],

  // ── Trust: institutional (Q-X3, post-CC-031) ────────────────────────────
  // Institutional trust generally indexes rule-following / order-orientation
  // (Conscientiousness). Untagged where the trust signal is too ambivalent
  // to commit a direction.
  government_elected_trust_priority: ["C"],
  government_services_trust_priority: ["C"],
  education_trust_priority: ["O", "C"],
  nonprofits_trust_priority: ["A"],
  religious_trust_priority: ["C"],
  journalism_trust_priority: ["O"],
  news_organizations_trust_priority: ["C"],
  social_media_trust_priority: [], // ambivalent
  small_business_trust_priority: ["C"],
  large_companies_trust_priority: ["C"],

  // ── Trust: personal (Q-X4, post-CC-032) ─────────────────────────────────
  family_trust_priority: ["A"],
  friend_trust_priority: ["A", "E"],
  partner_trust_priority: ["A"],
  mentor_trust_priority: ["O", "A"],
  outside_expert_trust_priority: ["O"],
  own_counsel_trust_priority: [], // ambivalent

  // ── Conviction (Q-C1, Q-C3, Q-C4) ───────────────────────────────────────
  truth_priority_high: ["O", "C"],
  belonging_priority_high: ["A"],
  order_priority: ["C"],
  individual_responsibility_priority: ["C"],
  system_responsibility_priority: ["O"],
  nature_responsibility_priority: ["O"],
  supernatural_responsibility_priority: ["C"],
  authority_responsibility_priority: ["C"],

  // ── Pressure (Q-P1, Q-P2) ───────────────────────────────────────────────
  adapts_under_social_pressure: ["A", "N"],
  adapts_under_economic_pressure: ["N"],
  hides_belief: ["N"],
  holds_internal_conviction: ["C"],
  high_conviction_under_risk: ["C"],
  high_conviction_expression: ["E"],
  moderate_social_expression: [], // ambivalent

  // ── Formation (Q-F1, Q-F2) ──────────────────────────────────────────────
  authority_trust_high: ["A", "C"],
  authority_skepticism_moderate: [], // ambivalent
  authority_distrust: ["O"],
  stability_baseline_high: ["C"], // high baseline stability indexes Conscientiousness
  moderate_stability: [],
  chaos_exposure: ["N"],

  // ── Context (Q-X1, Q-X2) ────────────────────────────────────────────────
  stability_present: ["C"],
  moderate_load: [],
  high_pressure_context: ["N"],

  // ── Belief-under-tension (Q-I1, Q-I2, Q-I3) ─────────────────────────────
  // The catalog signals from Q-I1's freeform extraction:
  independent_thought_signal: ["O"],
  epistemic_flexibility: ["O", "A"],
  conviction_under_cost: ["C"],
  cost_awareness: ["C"],
};
```

**On the Neuroticism floor problem.** Several signals that *should* read as low-Neuroticism (the inverse of N) — `stability_baseline_high`, `stability_present`, `holds_internal_conviction`, `high_conviction_under_risk` — are tagged with C (Conscientiousness) rather than as anti-N. This is a deliberate architecture choice: rather than introducing negative tags (which complicate the math), the model lets the *absence* of positive-N signals mean low Neuroticism. The effect is a "weak floor" — a user with no chaos-exposure / no high-pressure context / no pressure-adaptation answers will fire low N organically. Document this in `docs/canon/ocean-framework.md`.

---

## Steps

### 1. Create `lib/ocean.ts`

Start from the structure of `lib/drive.ts`. Copy the file as a template, then adapt. Specifically:

```ts
// CC-037 — OCEAN Derivation Framework.
//
// Big-5 personality dimensions derived from existing signals. No new questions;
// the instrument's 34-question footprint is unchanged. This file is the
// canonical home for the five-bucket OCEAN framework and the tagging table
// over existing signals.
//
// Architectural rules (do not relax without canon revision):
//   - Derivation only — no claimed vs revealed split. The user is never asked
//     to rank themselves on OCEAN.
//   - User-facing prose uses Big-5 terminology with one substitution: "N"
//     renders as "Emotional Reactivity (estimated)" rather than "Neuroticism."
//   - Neuroticism is shipped with explicit "estimated" framing because its
//     proxy signals are state/history-derived rather than trait-level.
//   - Multi-tag splits divide weighted contribution 1/N across tagged buckets.
//   - Rank-aware weighting re-uses lib/drive.ts:weightFor for consistency.

import type {
  Answer,
  OceanBucket,
  OceanCase,
  OceanDistribution,
  OceanOutput,
  Signal,
} from "./types";
import { weightFor } from "./drive";

// Bucket order for canonical iteration
const ORDER: OceanBucket[] = ["O", "C", "E", "A", "N"];

// Tagging table — paste the full SIGNAL_OCEAN_TAGS map from above.
const SIGNAL_OCEAN_TAGS: Record<string, OceanBucket[]> = { /* ... */ };

// Distribution-shape thresholds (named constants for visible tuning).
export const SINGLE_DOMINANT_PCT_THRESHOLD = 30;
export const SINGLE_DOMINANT_GAP_THRESHOLD_PP = 10;
export const TWO_DOMINANT_FLOOR_PCT = 22;
export const TWO_DOMINANT_GAP_THRESHOLD_PP = 5;
export const BALANCED_SPREAD_THRESHOLD_PP = 12;
export const N_ELEVATED_THRESHOLD_PCT = 22;

export function computeOceanDistribution(
  signals: Signal[],
  answers: Answer[]
): OceanDistribution {
  const totals: Record<OceanBucket, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const counts: Record<OceanBucket, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };

  for (const signal of signals) {
    const tags = SIGNAL_OCEAN_TAGS[signal.signal_id];
    if (!tags || tags.length === 0) continue;
    const w = weightFor(signal);
    const splitWeight = w / tags.length;
    for (const bucket of tags) {
      totals[bucket] += splitWeight;
      counts[bucket] += 1;
    }
  }

  const sum = ORDER.reduce((acc, b) => acc + totals[b], 0);
  const pct: Record<OceanBucket, number> =
    sum > 0
      ? Object.fromEntries(ORDER.map((b) => [b, Math.round((totals[b] / sum) * 100)])) as Record<OceanBucket, number>
      : { O: 0, C: 0, E: 0, A: 0, N: 0 };

  // Ensure percentages sum to 100 (correct rounding drift on the largest bucket).
  const pctSum = ORDER.reduce((acc, b) => acc + pct[b], 0);
  if (pctSum !== 100 && sum > 0) {
    const largest = ORDER.reduce((best, b) => (pct[b] > pct[best] ? b : best), ORDER[0]);
    pct[largest] += 100 - pctSum;
  }

  return {
    ...pct,
    rankAware: signals.some((s) => s.rank !== undefined),
    inputCount: counts,
    neuroticismEstimated: true,
  };
}

export function classifyOceanCase(d: OceanDistribution): OceanCase {
  const sorted = ORDER.slice().sort((a, b) => d[b] - d[a]);
  const [top, second] = sorted;
  const max = d[top];
  const min = d[sorted[sorted.length - 1]];

  if (d.N >= N_ELEVATED_THRESHOLD_PCT) return "n-elevated";
  if (max >= SINGLE_DOMINANT_PCT_THRESHOLD &&
      max - d[second] >= SINGLE_DOMINANT_GAP_THRESHOLD_PP) return "single-dominant";
  if (d[top] >= TWO_DOMINANT_FLOOR_PCT && d[second] >= TWO_DOMINANT_FLOOR_PCT &&
      d[top] - d[second] <= TWO_DOMINANT_GAP_THRESHOLD_PP) return "two-dominant";
  if (max - min < BALANCED_SPREAD_THRESHOLD_PP) return "balanced";
  return "single-dominant"; // sensible default
}

const BUCKET_LABEL: Record<OceanBucket, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Reactivity (estimated)",
};

const BUCKET_LABEL_SHORT: Record<OceanBucket, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Emotional Reactivity",
};

export function generateOceanProse(output: OceanOutput): string {
  const d = output.distribution;
  const sorted = ORDER.slice().sort((a, b) => d[b] - d[a]);
  const top = sorted[0];
  const second = sorted[1];
  const topLabel = BUCKET_LABEL_SHORT[top];
  const secondLabel = BUCKET_LABEL_SHORT[second];

  switch (output.case) {
    case "single-dominant":
      return `Your strongest disposition reads as ${topLabel} (${d[top]}%). The instrument detects this through patterns across your sacred values, allocation rankings, and lens-block answers — not from any single question.`;
    case "two-dominant":
      return `Your disposition is shaped by ${topLabel} (${d[top]}%) and ${secondLabel} (${d[second]}%) in roughly equal weight. Two strong dimensions can integrate well or pull against each other depending on context.`;
    case "balanced":
      return `Your disposition is unusually balanced — no single dimension dominates. This often shows up as adaptability across registers, or as a system that draws on whichever dimension the moment is asking for.`;
    case "n-elevated":
      return `Your distribution shows elevated emotional-reactivity proxies (${d.N}%) — formation, context, or pressure-adaptation signals that often correlate with Big-5 Neuroticism. Treat this as an estimate; the instrument measures these dimensions indirectly rather than asking about them. Outside of Reactivity, your strongest dimension reads as ${topLabel} (${d[top]}%).`;
    default:
      return `Your disposition map shows ${topLabel} as the strongest dimension at ${d[top]}%.`;
  }
}

export function computeOceanOutput(signals: Signal[], answers: Answer[]): OceanOutput | undefined {
  const distribution = computeOceanDistribution(signals, answers);
  const total = ORDER.reduce((acc, b) => acc + distribution[b], 0);
  if (total === 0) return undefined;
  const oceanCase = classifyOceanCase(distribution);
  const output: OceanOutput = { distribution, case: oceanCase, prose: "" };
  output.prose = generateOceanProse(output);
  return output;
}

export const OCEAN_BUCKET_LABEL = BUCKET_LABEL;
export const OCEAN_BUCKET_LABEL_SHORT = BUCKET_LABEL_SHORT;
```

The `signals` parameter consumes the same `Signal[]` shape used by the rest of the engine. The `answers` parameter is reserved for future per-answer extensions (none in v1; matches Drive's signature for consistency).

### 2. Add types to `lib/types.ts`

```ts
export type OceanBucket = "O" | "C" | "E" | "A" | "N";

export type OceanDistribution = {
  O: number; C: number; E: number; A: number; N: number;
  rankAware: boolean;
  inputCount: { O: number; C: number; E: number; A: number; N: number };
  neuroticismEstimated: true;
};

export type OceanCase = "single-dominant" | "two-dominant" | "balanced" | "n-elevated";

export type OceanOutput = {
  distribution: OceanDistribution;
  case: OceanCase;
  prose: string;
};
```

Position alphabetically among existing exports or after `DriveOutput`, whichever matches the file's existing convention.

### 3. Wire into `lib/identityEngine.ts`

Locate where `computeDriveOutput` is called in the engine pipeline. Add a parallel call to `computeOceanOutput` and attach the result to `EngineOutput` as `ocean?: OceanOutput`. Both run from the same `signals` and `answers` inputs.

```ts
import { computeOceanOutput } from "./ocean";
// ...
const ocean = computeOceanOutput(signals, answers);
// ...
return {
  // ... existing output fields ...
  drive,
  ocean,
};
```

The `EngineOutput` type extends with `ocean?: OceanOutput`. Mark optional because pre-CC-037 saved sessions would not have an `ocean` field.

### 4. Create `app/components/OceanBars.tsx`

Horizontal bar chart, 5 bars in canonical order O / C / E / A / N. Editorial styling matching `PieChart.tsx` (paper background, ink stroke, umber-soft fill on the largest bar). Each bar:

- Bucket label on the left (mono uppercase, sized smaller than slice labels).
- Bar body filling left-to-right based on percentage of the chart width.
- Percentage label on the right of the bar.
- N bar gets a small "estimated" tag below the bar (mono, smaller, ink-mute color).

Component contract:

```tsx
import type { OceanDistribution, OceanBucket } from "../../lib/types";
import { OCEAN_BUCKET_LABEL, OCEAN_BUCKET_LABEL_SHORT } from "../../lib/ocean";

type OceanBarsProps = {
  distribution: OceanDistribution;
  width?: number;
};

export default function OceanBars({ distribution, width = 480 }: OceanBarsProps) {
  // SVG-based render. Iterate buckets in O/C/E/A/N order. Largest bar gets
  // umber-soft fill; others get paper fill with ink stroke. N bar adds an
  // "estimated" subscript below the bar.
}
```

Use SVG (matches PieChart's editorial register). Mirror the responsive sizing pattern from PieChart.tsx (the `min(${size}px, 80vw)` rule on the figure container).

### 5. Render the Disposition Map page section

Locate where the report assembles ShapeCards (likely `app/page.tsx` or a dedicated report-rendering component). Find the position between Mirror card and Compass card. Insert:

```tsx
{engineOutput.ocean ? (
  <section className="disposition-map" aria-labelledby="disposition-heading">
    <h2 id="disposition-heading" className="font-mono uppercase">DISPOSITION MAP</h2>
    <p className="framing">
      Big-5 personality dimensions, derived from how you answered other questions
      in this instrument. No single answer determines a dimension; the model reads
      patterns across the full 34-question footprint.
    </p>
    <OceanBars distribution={engineOutput.ocean.distribution} />
    <p className="ocean-prose">{engineOutput.ocean.prose}</p>
    <p className="footnote font-mono">
      Emotional Reactivity is shown as an estimate — the instrument measures it
      through proxy signals (formation history, current-context load, pressure-
      adaptation behavior) rather than directly.
    </p>
  </section>
) : null}
```

Class names follow the existing report's Tailwind / custom-CSS conventions. Match the editorial tone of existing section headers and framing paragraphs.

### 6. Create `docs/canon/ocean-framework.md`

Full canon doc. Sections:

1. **Why this framework exists** — derivation-over-existing-signals rationale; Jung-Big5 correlation evidence; the standing memory rule.
2. **The five buckets** — definitions, internal codenames, user-facing labels, the Neuroticism→"Emotional Reactivity (estimated)" relabel rationale.
3. **Tagging table** — full `SIGNAL_OCEAN_TAGS` content with multi-tag rationale per signal.
4. **Multi-tag handling** — split-weight 1/N math.
5. **Rank-aware weighting** — re-uses Drive's `weightFor`; document the dependency.
6. **The Neuroticism floor problem** — why anti-N tags are not used; the "weak floor" architecture.
7. **Distribution-shape cases** — the 4 cases, thresholds, prose templates (locked, no substitution).
8. **Render position** — Disposition Map page section between Mirror and Compass; not a ShapeCard; rationale.
9. **Open questions for future tuning** — Q-N1 candidate (single forced-choice for direct Neuroticism); whether to add anti-N tags if the floor approach reads thin.

### 7. Update `docs/canon/signal-library.md`

For each signal in the library, append its OCEAN tag(s) as a line in the entry's metadata. Untagged signals get an explicit `OCEAN: none` line so future authors don't think the omission was an oversight. CC-037 amendment paragraph at the top of the file noting the bulk addition.

### 8. Update `docs/canon/output-engine-rules.md`

Add OCEAN to the engine output pipeline section. Document the Disposition Map render position. Cross-reference `docs/canon/ocean-framework.md`.

### 9. Update `docs/canon/shape-framework.md`

Add a section noting the Disposition Map as a *non-card* page section. Document the design choice (no body-part metaphor; sits adjacent to Mirror because Jung-Big5 correlation makes adjacency natural).

### 10. Verification

- `npx tsc --noEmit` exits 0.
- `npm run lint` passes.
- `npm run build` succeeds.
- Existing test suite passes. If a test asserts on `EngineOutput` shape, extending with optional `ocean?` should not break it.
- Manual sweep: load 3 archetypal sessions and trace `computeOceanDistribution`:
  - High-Si + high-Te + family-priority + stability-priority + restoring-energy → expect C dominant, A secondary.
  - High-Ne + knowledge-priority + learning-energy + freedom-priority → expect O dominant, E secondary.
  - High-chaos-exposure + high-pressure-context + adapts-under-social-pressure + adapts-under-economic-pressure → expect N elevated, n-elevated case.

### 11. Browser smoke (Jason verifies)

Three sessions tuned to land different OCEAN shapes:

- A "Conscientious-dominant" session → Disposition Map renders with C bar largest (>30%), single-dominant prose.
- A "Balanced" session → Disposition Map renders with bars within ~12pp of each other, balanced prose.
- A "high-N-proxy" session → Disposition Map renders with N elevated, n-elevated prose explicitly naming the "estimated" framing.

For each: the "estimated" footnote is visible; the N bar's "(estimated)" subscript is visible; the framing paragraph above the chart reads cleanly.

---

## Acceptance

- `lib/ocean.ts` exists and exports `computeOceanOutput`, `generateOceanProse`, `computeOceanDistribution`, `classifyOceanCase`, `OCEAN_BUCKET_LABEL`, `OCEAN_BUCKET_LABEL_SHORT`, plus the threshold constants.
- `lib/types.ts` exports `OceanBucket`, `OceanDistribution`, `OceanCase`, `OceanOutput`.
- `lib/identityEngine.ts` calls `computeOceanOutput` in the engine pipeline; `EngineOutput` includes optional `ocean?: OceanOutput`.
- `app/components/OceanBars.tsx` exists and renders 5-bar SVG chart with N "estimated" subscript.
- The report rendering (e.g., `app/page.tsx`) renders the Disposition Map section between Mirror and Compass when `engineOutput.ocean` is present.
- `docs/canon/ocean-framework.md` exists and documents the framework per Step 6.
- `docs/canon/signal-library.md`, `docs/canon/output-engine-rules.md`, `docs/canon/shape-framework.md` updated as listed.
- `git diff --stat` shows changes only in the named files.
- `npx tsc --noEmit` exits 0. `npm run lint` passes. `npm run build` succeeds.
- Manual archetype-sweep confirms the three archetypal sessions resolve to expected OCEAN shapes.

---

## Out of scope

If you find yourself doing any of these, stop and flag — they belong elsewhere:

- **Adding a Q-N1 question** (or any new question) to firm up Neuroticism. Future CC. CC-037 is derivation-only.
- **Adding new signals.** All tags reference signals that exist today (post-CC-033 / CC-035 ambition + time-autonomy additions, which are in flight or shipped).
- **Adding anti-N tags or negative-weight tags.** The "weak floor" architecture is canonical for v1.
- **Renaming the framework codename** `"N"` to anything else at the type-system level. The user-facing relabel (Neuroticism → Emotional Reactivity (estimated)) is label-only.
- **Adding a claimed-vs-revealed split.** The user is never asked to rank themselves on OCEAN.
- **Creating a new ShapeCard for OCEAN.** Disposition Map is a page section, not a card. Don't add `disposition` to `ShapeCardId`, `CARD_PREFERENCES`, `SHAPE_CARD_PRACTICE_TEXT`, or `SHAPE_CARD_PATTERN_NOTE`.
- **Editing existing ShapeCard prose** to reference OCEAN dimensions. The Disposition Map prose is self-contained.
- **Generating a Tension entry** that compares OCEAN dimensions against other measurements. Future CC if needed; not this one.
- **Authoring cross-card patterns** that consume OCEAN buckets. Pattern catalog is CC-029 territory; OCEAN buckets are not pattern signals in v1.
- **Changing `weightFor` in `lib/drive.ts`** to tune the rank-aware ladder. The shared dependency is canonical.
- **Adding the "Emotional Reactivity" relabel logic to `lib/drive.ts`'s `HUMAN_LABELS`** or anywhere outside `lib/ocean.ts`. The relabel is OCEAN-only.
- **Removing or modifying the Drive framework.** Drive and OCEAN coexist independently.
- **Editing Q-T1–T8, Q-S*, Q-E1, Q-Stakes1, Q-3C1, Q-Ambition1, Q-X3, Q-X4, Q-P1, Q-P2, Q-F1, Q-F2, Q-X1, Q-X2, Q-C*, Q-I*** or any other question. The instrument's measurement surface stays unchanged.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

For Codex executors: substitute Codex's permission-bypass mechanism. The CC's substantive sections are tool-agnostic.

## Execution Directive

Single pass. Don't pause for user confirmation. Canon-faithful interpretation on ambiguity (the rules in `lib/drive.ts:10–22` and the new `docs/canon/ocean-framework.md` are authoritative). Don't edit files outside the Allowed-to-Modify list.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` (browser smoke; kill before exiting)
- `git diff --stat`
- `git status`
- `ls`, `cat`, `grep`, `rg` against the working tree (read-only)

## Read First (Required)

- `AGENTS.md`
- `lib/drive.ts` — the architectural template. Read in full. Especially the architectural-rules comment block (lines 10–22), the tagging table (lines 57–138), `weightFor` (lines 154–160), and `generateDriveProse` (lines 364–386).
- `lib/types.ts` — locate where Drive types live; add OCEAN types in the same neighborhood.
- `lib/identityEngine.ts` — locate where `computeDriveOutput` is wired into the engine pipeline.
- `app/components/PieChart.tsx` — the visual register template. CC-037's `OceanBars.tsx` mirrors its editorial style.
- `app/page.tsx` (or the report-assembly component) — locate the position between Mirror and Compass.
- `docs/canon/drive-framework.md` — the canon doc template; CC-037's ocean-framework.md mirrors its structure.
- `docs/canon/result-writing-canon.md` — voice rules; the Disposition Map prose composes with these.
- `data/questions.ts` — verify all signal IDs in the tagging table actually exist as `signal:` values across the question definitions.
- `prompts/completed/CC-026-path-3cs-integration-poc.md` — context on the original Drive integration architecture.

## Allowed to Modify

- `lib/ocean.ts` (new)
- `lib/types.ts`
- `lib/identityEngine.ts`
- `app/components/OceanBars.tsx` (new)
- `app/page.tsx` (or whatever component assembles the report — confirm via Read before editing)
- `docs/canon/ocean-framework.md` (new)
- `docs/canon/signal-library.md`
- `docs/canon/output-engine-rules.md`
- `docs/canon/shape-framework.md`

## Report Back

1. **Files modified or created** — full list with line counts; confirm against Allowed-to-Modify.
2. **Verification results** — `tsc`, `lint`, `build` outputs.
3. **Tagging-table verification** — confirm every `signal_id` referenced in `SIGNAL_OCEAN_TAGS` exists as a signal in the codebase (grep for it). Flag any orphaned tags.
4. **Manual archetype sweep** — paste the three archetypal session traces and the resolved OCEAN shape per archetype.
5. **Canon decisions surfaced** — places where canon was ambiguous (e.g., institutional-trust signal tagging) and the judgment applied.
6. **Out-of-scope drift caught** — anything considered and rejected.
7. **Browser smoke deferred to Jason** — confirm visual verification stays Jason's job.
8. **Open questions for future tuning** — list things that browser smoke might surface (Neuroticism floor reading thin; multi-tag splits weighting unintuitively for specific signals; Disposition Map render position feeling off relative to surrounding cards).

---

## Notes for the executing engineer

- The framework codename `"N"` and the type-level `OceanBucket = "O" | "C" | "E" | "A" | "N"` stay verbatim. Only the human-facing label uses "Emotional Reactivity (estimated)." Do not rename internal identifiers.
- `weightFor` is imported from `lib/drive.ts`, not duplicated. If `weightFor` is not currently exported from `lib/drive.ts`, add the export — that's a one-line change inside `lib/drive.ts` and explicitly authorized by this CC's intent (it does NOT count as out-of-scope drift).
- The tagging table is authoritative as written above. Don't substitute tags. If a signal seems mis-tagged during browser smoke, surface as a successor CC; don't silently retag during this CC.
- Some signals have empty tag arrays (`self_spending_priority`, `social_media_trust_priority`, `own_counsel_trust_priority`, `authority_skepticism_moderate`, `moderate_social_expression`, `moderate_load`, `moderate_stability`). These are intentionally ambivalent on OCEAN. Render them with `OCEAN: none` in `signal-library.md` so future authors don't read the absence as an oversight.
- Multi-tag split-weight is `weight / tagCount`. So `truth_priority` (tagged O+C) at rank 1 contributes `3/2 = 1.5` to each bucket. This is the canonical math; verify with a unit-test-style trace before shipping.
- Percent-rounding drift: after `Math.round`-ing five percentages, the sum may be 99 or 101. The reference implementation corrects by adjusting the largest bucket. Verify the correction logic doesn't introduce weird edge behavior for tied buckets (deterministic tie-breaking by canonical ORDER suffices).
- Pre-CC-037 saved sessions will not have an `ocean` field on `EngineOutput`. The render-side check `engineOutput.ocean ? ... : null` handles this gracefully. No migration needed.
- The Disposition Map section has no body-part metaphor. The "Map" suffix matches the existing "Map" register in the report (e.g., MapSection); it's not a new conceptual layer.
- If `app/page.tsx` is not the right file for the report assembly, the executing engineer should locate the correct component and update the Allowed-to-Modify list as a tracked deviation in the Report Back section. Do not silently edit a different file without flagging.
- The "estimated" subscript on the N bar in `OceanBars.tsx` is non-negotiable. It's the load-bearing UX element that distinguishes OCEAN's Neuroticism estimate from the other four direct-derivation dimensions. Without it, the report risks overstating what the instrument measures.
- The Jung-Big5 correlation evidence cited in the Why section is not folded into user-facing prose. The framework doc references it for canon transparency; the user just sees the distribution and the prose paragraph.
