# CC-016 — Allocation Layer (Money + Energy + Aspirational Overlay)

## Goal

Add the **first concrete v2 measurement layer** to the engine: ranked allocation across money and energy domains, with a per-category aspirational overlay that captures where the user *wishes* their resources flowed differently from where they actually flow. After CC-016, the engine stops treating the user as a portfolio of stated values only, and starts measuring the gap between stated values and actual allocation. Three new tensions surface that gap — without judging it.

This CC delivers:

1. **Six new ranking questions** organized as two derived/cross-rank groups:
   - **Q-S3 (Money allocation)**: three rankings — `Q-S3-close` (3 items), `Q-S3-wider` (3 items), `Q-S3-cross` (4 items, items derived from top-2 of each parent).
   - **Q-E1 (Energy allocation)**: three rankings — `Q-E1-outward` (3 items), `Q-E1-inward` (3 items), `Q-E1-cross` (4 items, items derived from top-2 of each parent).

2. **Per-category three-state aspirational overlay** on the four parent rankings (`Q-S3-close`, `Q-S3-wider`, `Q-E1-outward`, `Q-E1-inward` — NOT on the cross-ranks). Each ranked item can be tagged *"wish less / right / wish more"* by the user. Captures the gap between *current* allocation and *aspirational* allocation.

3. **A new question type**: `DerivedRankingQuestion`. Items populate dynamically from the top-N answers of earlier questions. First use case: the cross-ranks (Q-S3-cross, Q-E1-cross). Future canon may use the pattern for v2.5 Coherence Engine work.

4. **Three new tensions**:
   - **T-013** *Sacred Words vs Sacred Spending* — gap between Compass top-Sacred-value (Q-S2) and money allocation (Q-S3).
   - **T-014** *Sacred Words vs Spent Energy* — gap between Compass top-Sacred-value and energy allocation (Q-E1).
   - **T-015** *Current vs Aspirational Allocation* — within Q-S3 / Q-E1, where the user's current ranking diverges from their aspirational overlay.

5. **New canon doc**: `docs/canon/allocation-rules.md`. Codifies four rules — *stated vs spent values* (Clarence's framing), *direction not quality* (the model surfaces flow, not moral judgment), *current vs aspirational tension* (the gap is descriptive, not prescriptive), and *non-accusatory interpretation* (allocation gaps may indicate exhaustion, season, or constraint — never assumed dishonesty).

6. **Mirror integration**: a new small section in the Mirror surfaces the allocation tensions when they fire. Detailed Coherence narrative is v2 work; CC-016 ships only the *gap-detection + non-accusatory naming.*

7. **The doubled-determiner bug fix** from CC-015a's report (Conviction Posture template's *"the your top values you protect"* construction).

This CC does NOT include: per-card process inflection (CC-016b / v2 territory), cross-card matrix pattern detection beyond the three new tensions (v2 Coherence Engine), Q-X3 / Q-X4 / Q-T restructuring (v2.5 Universal-3), aperture / distance UX (v3), persistence / autosave (v2 Postgres-era).

---

## Launch Directive (CC tool)

**Run this CC with permission-bypass at the CC tool level.**

```
claude --dangerously-skip-permissions
```

Or, mid-session, type `/permissions` and pick **bypass permissions** mode.

This CC is the largest engine + canon CC since CC-011. It touches `lib/types.ts` substantially (new question type, new answer type, new overlay type, new tension types, new InnerConstitution fields), `lib/identityEngine.ts` substantially (signal emission for derived rankings, three new tension detection blocks, allocation-overlay handling, Mirror integration extension), `data/questions.ts` (six new question entries), `app/page.tsx` (state for derived-question gating + overlay capture), `app/components/Ranking.tsx` (overlay UI affordance), three new components, plus four canon files (one new + three appended). Per-edit approval prompts will defeat single-pass execution.

## Bash Commands Authorized

This CC will run the following bash commands without further user approval:

- `npx tsc --noEmit` — type check.
- `npm run lint` — lint check.
- `npm run dev` (if browser smoke test is performed by the agent rather than the user).
- File-system commands: `ls`, `cat`, `grep`, `find`, `git status`, `git diff`, `awk`, `sed`, `head`, `tail`, `wc`.

The agent should not pause to ask permission for these.

---

## Execution Directive

Complete every requirement in a single pass and deliver the full report-back at the end. Do **not** pause mid-execution to ask the user for confirmation, approval, scope clarification, or any additional input.

If something is genuinely ambiguous, apply the most spec-faithful interpretation and flag the decision in Risks / next-step recommendations. Do not halt.

If a prerequisite appears missing, attempt the canon-faithful equivalent, record the discrepancy, and continue.

---

## Read First (Required)

**Canon (read; one new file is created and three are appended):**

- `docs/canon/result-writing-canon.md` — appends a new section per § D-9 (cross-reference to the new allocation-rules.md).
- `docs/canon/shape-framework.md` — Compass / Heart card. Allocation extends Compass (the *"sacred is what you would not casually trade away"* canon already implies allocation). Read but do not modify.
- `docs/canon/inner-constitution.md` — § Top-Level Structure. Mirror gains a small allocation-tensions section per § D-10.
- `docs/canon/output-engine-rules.md` — six derivation rules. Already implemented; not modified here.
- `docs/canon/signal-mapping-rule.md` — rank-to-strength rules. The same rules apply to the new allocation signals.
- `docs/canon/signal-and-tension-model.md` — rank-aware signal contract. Extend per § D-3 to support derived-ranking signal emission.
- `docs/canon/signal-library.md` — appends new signals per § D-4.
- `docs/canon/tension-library-v1.md` — appends T-013, T-014, T-015 per § D-7.
- `docs/canon/question-bank-v1.md` — appends six new question entries (Q-S3-close / wider / cross + Q-E1-outward / inward / cross) per § D-2.

**New canon file (created):**

- `docs/canon/allocation-rules.md` — codifies the four rules per § D-1.

**Reference (read; do NOT edit):**

- `docs/design-prototype/components.jsx` — for ranking primitive and question shell visual reference.
- `docs/design-spec-v2.md` — for tone, hedging vocabulary, and the "Constitution is one document, not a dashboard" non-negotiable.
- `docs/product-direction/v2-allocation-and-shape.md` (if it exists) — captures Clarence's stated-vs-spent framing.

**Existing code (read; will be edited):**

- `lib/types.ts` — adds question types, answer types, overlay types, tension extensions, InnerConstitution fields.
- `lib/identityEngine.ts` — adds signal emission for derived rankings, three tension detection blocks, allocation overlay handling, Mirror extension. Updates `buildInnerConstitution`.
- `data/questions.ts` — appends six new question entries.
- `app/page.tsx` — adds state for derived-question gating and overlay capture.
- `app/components/Ranking.tsx` — adds the per-category three-state overlay affordance.
- `app/components/MirrorSection.tsx` — adds the new allocation-tensions section (when CC-015b has shipped, which it has).

**Existing code (do NOT edit):**

- `app/components/QuestionShell.tsx` — used as-is for the new questions.
- `app/components/ProgressIndicator.tsx`.
- `app/components/ShapeCard.tsx`.
- `app/components/TensionCard.tsx`.
- `app/components/MbtiDisclosure.tsx`.
- `app/components/SinglePickPicker.tsx` — created in CC-014 for skipped-question second-pass.
- `app/components/SecondPassPage.tsx` — CC-014.
- `app/components/KeystoneReflection.tsx` — CC-015c.
- `app/globals.css`, `app/layout.tsx`.
- Any tension detection block other than the new T-013, T-014, T-015 (NEVER modify the existing T-001 through T-012).
- Any signal definition (`SIGNAL_DESCRIPTIONS`, `SACRED_PRIORITY_SIGNAL_IDS`, `STRENGTHENERS`, `STACK_TABLE`, `MBTI_LOOKUP`).
- Any aggregation helper (`aggregateLensStack`, `getTopCompassValues`, etc.).
- The CC-015a constants/helpers (`FUNCTION_VOICE`, `UNDER_PRESSURE_BEHAVIOR`, `TOP_RISK_CARD_FALLBACK`, `BLIND_SPOT_TEXT_VARIANTS`, `valueListPhrase`).

---

## Context

The model after CC-015c measures **declared orientation**: what the user names as sacred, whom they say they trust, where they say responsibility sits, what they believe under cost. All of this is self-concept. The Inner Constitution surfaces it back as a structured self-portrait — but it's still primarily a portrait of *what the user has declared.*

The missing rail — surfaced through repeated user testing and Clarence's design-jam analysis — is **lived allocation.** Stated values are claims; spending is evidence. A user who ranks Family #1 sacred but allocates discretionary money mostly to Self and Companies has a gap worth naming. Not as accusation — as observation. The gap may be exhaustion, ambition, season, economic pressure, or a real conflict between stated and lived values. The model surfaces it; the user reads it.

Clarence's framing line, locked as canon-quality:

> *"Stated values reveal identity. Spent energy reveals allegiance."*

And the user's framing line, also canon-quality:

> *"Show me your energy and your spending, and I'll show you what you care about."*

CC-016 implements the measurement layer that makes this read possible. Three new questions per allocation domain (close-rank + wider-rank + cross-rank), per-category aspirational overlay, three new tensions. The Mirror gets a small section that surfaces the gaps. The Coherence narrative — the rich language that reads patterns across allocation, stated values, conviction, and shape — is v2 territory.

This is also the **first new question-type pattern** since CC-014 added single-pick: `DerivedRankingQuestion`. Its items populate dynamically from earlier questions' answers (top-N). The same pattern can be reused in v2.5 Universal-3 Restructuring (Q-X3-cross etc.) and v2 Coherence Engine work.

---

## Decisions Locked in This Prompt

These are decisions made at prompt-authorship time so the executing agent does not have to make them.

### D-1: Allocation rules canon

Create `docs/canon/allocation-rules.md`. Four canonical rules.

**Rule 1 — Stated vs Spent Values (Clarence's framing):**

> *"The model distinguishes between stated values and spent values. Stated values are what the user names as sacred, important, or worthy of protection. Spent values are inferred from where the user's energy, money, attention, and sacrifice actually go. The purpose is not to accuse the user of hypocrisy, but to identify coherence, tension, displacement, and hidden devotion. A gap between stated and spent values may indicate dishonesty, but it may also indicate exhaustion, constraint, fear, obligation, economic pressure, or a life season where survival has temporarily outranked meaning."*

**Rule 2 — Direction, Not Quality:**

> *"Allocation categories capture the direction of resource flow, not its moral quality. A user allocating heavily to Self may be reinvesting in productive capacity, consuming for well-being, or in self-destructive patterns. A user allocating heavily to Non-Profits may be supporting humanitarian causes or supporting identity-tribal organizations. The model does not distinguish these morally; it reads only flow. Moral content is read through Compass values, Conviction answers, and the Coherence engine's cross-card narrative — not through allocation alone."*

**Rule 3 — Current vs Aspirational Tension:**

> *"For each allocation category, the user is asked to mark whether the current flow is right, more than they wish, or less than they wish. The gap between current and aspirational is descriptive, not prescriptive. The model surfaces the gap; the user is the only authority on what it means or what to do about it. The model never tells the user where their resources should go."*

**Rule 4 — Non-Accusatory Interpretation:**

> *"Allocation tensions surface as observations, not verdicts. Templated prose for T-013, T-014, T-015 must use the canonical hedging vocabulary (`appears to`, `may suggest`, `may be present`, `the model reads a gap`) and must never use prosecutorial language (`you fail to`, `you don't actually`, `you're not really`, `your real values are`). The user reads the gap; the user decides what it means."*

The file structure:

```markdown
# Allocation Rules

## Purpose
...

## Rule 1 — Stated vs Spent Values
...

## Rule 2 — Direction, Not Quality
...

## Rule 3 — Current vs Aspirational Tension
...

## Rule 4 — Non-Accusatory Interpretation
...

## Implementation surfaces
| Canonical rule | Code-level surface |
|---|---|
| Rule 1 | Q-S3, Q-E1 + T-013, T-014 detection in `lib/identityEngine.ts` |
| Rule 2 | Q-S3 / Q-E1 question gloss; Mirror prose templates in CC-016 |
| Rule 3 | per-category three-state overlay UI; T-015 detection |
| Rule 4 | All allocation-tension prose templates in `lib/identityEngine.ts` |

## Relationship to other canon files
- `result-writing-canon.md` — the "do not score belief content" rule (CC-015c) is a sibling: same principle (model observes structure, doesn't judge content) applied to a different surface (Q-I1/I2/I3 instead of Q-S3/Q-E1).
- `shape-framework.md` — Compass / Heart canonically defines sacred values. This file extends Compass with allocation as the lived counterpart.
```

### D-2: Six new question entries in `data/questions.ts`

**Q-S3-close** (Money allocation — close):

```ts
{
  question_id: "Q-S3-close",
  card_id: "sacred",  // extends Compass / Heart
  type: "ranking",
  text: "When you have discretionary money — beyond basic survival — where does it most naturally flow among the people closest to you?",
  helper: "Rank from most flow to least. The model reads direction, not moral quality.",
  items: [
    { id: "yourself",  label: "Yourself",  gloss: "your own needs, comforts, savings, well-being.",
      signal: "self_spending_priority" },
    { id: "family",    label: "Family",    gloss: "kin — parents, children, siblings, spouse, chosen kin.",
      signal: "family_spending_priority" },
    { id: "friends",   label: "Friends",   gloss: "people you've chosen as close, outside family obligation.",
      signal: "friends_spending_priority" },
  ],
}
```

**Q-S3-wider** (Money allocation — wider):

```ts
{
  question_id: "Q-S3-wider",
  card_id: "sacred",
  type: "ranking",
  text: "When your money flows beyond your immediate circle, where does it most naturally go?",
  helper: "Rank from most flow to least. Direction only — the model doesn't judge what kind of allocation this is.",
  items: [
    { id: "social",       label: "Social life", gloss: "experiences, leisure, dining, travel, entertainment.",
      signal: "social_spending_priority" },
    { id: "nonprofits_religious", label: "Non-Profits & Religious",
      gloss: "civil society and faith communities — charities, NGOs, churches, voluntary missions.",
      signal: "nonprofits_religious_spending_priority" },
    { id: "companies",    label: "Companies",
      gloss: "businesses you transact with — whether you own them, work for them, invest in them, or buy from them. (For self-employed users, this category may overlap with Yourself.)",
      signal: "companies_spending_priority" },
  ],
}
```

**Q-S3-cross** (Money allocation — cross-rank, derived):

```ts
{
  question_id: "Q-S3-cross",
  card_id: "sacred",
  type: "ranking_derived",                    // NEW question type
  derived_from: ["Q-S3-close", "Q-S3-wider"], // pulls top-2 from each parent
  text: "When close-circle and wider-circle compete for the same dollar, where does it actually go?",
  helper: "These are your top picks from the previous two rankings. Rank them in resolved priority — what wins when they're forced to compete.",
  // items populated dynamically at render time from top-2 of Q-S3-close and Q-S3-wider
}
```

**Q-E1-outward** (Energy allocation — outward / generative):

```ts
{
  question_id: "Q-E1-outward",
  card_id: "sacred",
  type: "ranking",
  text: "When you have discretionary energy — not forced by obligation — where does it most naturally go in the outward, generative direction?",
  helper: "Rank from most flow to least.",
  items: [
    { id: "building",  label: "Building / creating",
      gloss: "making something new — products, structures, frameworks, art, code, businesses, ideas.",
      signal: "building_energy_priority" },
    { id: "solving",   label: "Solving problems",
      gloss: "removing dysfunction — debugging, repairing, troubleshooting, fixing what's broken.",
      signal: "solving_energy_priority" },
    { id: "restoring", label: "Restoring order",
      gloss: "bringing back coherence — organizing, cleaning, maintaining, preserving what already works.",
      signal: "restoring_energy_priority" },
  ],
}
```

**Q-E1-inward** (Energy allocation — inward / relational):

```ts
{
  question_id: "Q-E1-inward",
  card_id: "sacred",
  type: "ranking",
  text: "And in the inward, relational direction — where does your discretionary energy most naturally go?",
  helper: "Rank from most flow to least.",
  items: [
    { id: "caring",    label: "Caring for people",
      gloss: "attending to others — listening, supporting, presence, emotional labor.",
      signal: "caring_energy_priority" },
    { id: "learning",  label: "Learning / understanding",
      gloss: "taking in — reading, studying, exploring, making sense.",
      signal: "learning_energy_priority" },
    { id: "enjoying",  label: "Enjoying life / experience",
      gloss: "savoring — being in the moment, pleasure, rest, presence with what is.",
      signal: "enjoying_energy_priority" },
  ],
}
```

**Q-E1-cross** (Energy allocation — cross-rank, derived):

```ts
{
  question_id: "Q-E1-cross",
  card_id: "sacred",
  type: "ranking_derived",
  derived_from: ["Q-E1-outward", "Q-E1-inward"],
  text: "When outward energy and inward energy compete for the same hour, which actually wins?",
  helper: "Your top picks from the previous two rankings. Rank in resolved priority.",
}
```

All six questions also support the **per-category three-state overlay** on `Q-S3-close`, `Q-S3-wider`, `Q-E1-outward`, `Q-E1-inward` (NOT on the cross-ranks). The overlay is captured separately from the rank — see § D-5 for the data shape.

### D-3: New `DerivedRankingQuestion` type and `RankingDerivedAnswer` answer type

Extend `lib/types.ts`:

```ts
// New question variant
export type DerivedRankingQuestion = {
  question_id: string;
  card_id: CardId;
  type: "ranking_derived";
  derived_from: string[];          // question_ids whose top-N answers populate this question's items
  derived_top_n?: number;          // default 2
  text: string;
  helper?: string;
  // items field is computed at render time from `derived_from` answers; not stored statically
};

// Extend Question union
export type Question =
  | ForcedFreeformQuestion
  | RankingQuestion
  | DerivedRankingQuestion;

// New answer variant
export type RankingDerivedAnswer = {
  question_id: string;
  card_id: CardId;
  question_text: string;
  type: "ranking_derived";
  order: RankingItemId[];          // user's resolved ordering of the derived items
  derived_item_sources: { id: RankingItemId; signal: SignalId; source_question_id: string }[];
};

// Extend Answer union
export type Answer =
  | ForcedFreeformAnswer
  | RankingAnswer
  | SinglePickAnswer
  | RankingDerivedAnswer;

// Three-state overlay (applies only to base RankingQuestion answers, not derived)
export type AspirationalOverlay = "wish_less" | "right" | "wish_more";

export type RankingAnswerWithOverlay = RankingAnswer & {
  overlay: Record<RankingItemId, AspirationalOverlay>;
};
```

The `overlay` field on `RankingAnswer` is OPTIONAL and only populated for the four allocation parent rankings (Q-S3-close, Q-S3-wider, Q-E1-outward, Q-E1-inward). All other ranking answers leave `overlay` undefined.

### D-4: Twelve new rank-aware signals registered in `signal-library.md`

Append to `docs/canon/signal-library.md` under a new "Allocation Card (Compass extension)" subsection.

**Money signals (6):** `self_spending_priority`, `family_spending_priority`, `friends_spending_priority`, `social_spending_priority`, `nonprofits_religious_spending_priority`, `companies_spending_priority`. All `rank_aware: true`, `implementation_status: active` (consumed by T-013).

**Energy signals (6):** `building_energy_priority`, `solving_energy_priority`, `restoring_energy_priority`, `caring_energy_priority`, `learning_energy_priority`, `enjoying_energy_priority`. All `rank_aware: true`, `implementation_status: active` (consumed by T-014).

Each signal entry follows the existing schema (signal_id, description, primary_cards, produced_by_questions, used_by_tensions, rank_aware, implementation_status, notes). `description` per § D-8 below.

**Cross-rank signals.** The cross-ranks (Q-S3-cross, Q-E1-cross) emit signals at the cross-rank position, but use the *same* signal_ids as the parent rankings. The engine distinguishes them via the `source_question_id` field on the emitted signal — see § D-6 for the emission rule.

Update Active / Pending / Unused / Deprecated summary sections in `signal-library.md`. New counts:

- **Active** — gains 12 (the new spending and energy signals). Update header count.
- **Pending** — unchanged.
- **Unused** — unchanged.
- **Deprecated** — unchanged.

### D-5: Per-category three-state overlay UI

The overlay is a small affordance attached to each ranked item in the four allocation parent rankings. Three radio buttons per item: `wish less` / `right` / `wish more`. Default state: `right` (no implicit pressure to mark something).

Visual treatment:

- Affordance lives below each ranked item, indented under the rank numeral and label.
- Three small buttons in mono caps, 11px, tracking +0.08em, `var(--ink-mute)` resting, `var(--umber)` on selected.
- Single-select within each item (selecting one deselects the others).
- The overlay does NOT trigger continue logic — Continue is enabled the moment the rank order is set (matches existing CC-007 / CC-014 ranking primitive behavior). Overlay is captured if the user marks it; otherwise defaults to `right`.

The overlay's three states map to:

- `wish_less` — current allocation is more than the user wishes (gap toward less).
- `right` — current allocation matches aspiration (no gap).
- `wish_more` — current allocation is less than the user wishes (gap toward more).

The rendered Q-S3-close / wider / Q-E1-outward / inward question screen looks like:

```
[ranking primitive — three items, drag-to-reorder, mono index column, serif label + gloss]

For each:
  [item]
    ○ wish less   ● right   ○ wish more
```

Cross-ranks (Q-S3-cross, Q-E1-cross) do NOT show the overlay. The cross-rank captures resolved hierarchy only.

### D-6: Cross-rank signal emission rule

When a `RankingDerivedAnswer` is processed by `signalsFromRankingAnswer`, each ranked item emits a signal with:

- `signal_id` = the same id as the parent ranking would have produced.
- `rank` = the cross-rank position (1, 2, 3, or 4).
- `strength` = `"high"` if cross-rank ≤ 1, `"medium"` if cross-rank ≤ 2, `"low"` otherwise.
- `from_card` = the question's card_id (`sacred`).
- `source_question_ids` = `[parentQuestionId, crossQuestionId]` — both contribute to the signal's provenance. The cross-rank signal has TWO sources.
- A new optional field on `Signal`: `cross_rank?: number` — distinguishes cross-rank signal from parent-rank signal of the same id. The engine uses this to detect when a signal is the resolved-hierarchy version vs. the within-domain version.

Add to `lib/types.ts`:

```ts
export type Signal = {
  signal_id: SignalId;
  description: string;
  from_card: CardId;
  source_question_ids: string[];
  strength: SignalStrength;
  rank?: number;
  cross_rank?: number;          // NEW — set when signal comes from a derived ranking
};
```

The engine's per-card derivation and tension detection treat `rank` and `cross_rank` as separate dimensions. T-013 / T-014 / T-015 detection rules use cross-rank for their primary signal triangulation (since cross-rank is the most informative signal in the allocation layer).

### D-7: Three new tensions registered in `tension-library-v1.md`

**T-013 — Sacred Words vs Sacred Spending:**

```
## T-013 — Sacred Words vs Sacred Spending

Type: allocation tension
Description: The user's stated top sacred value (Q-S2) is not in the user's top-2 spending categories (Q-S3-cross). The model reads a gap between what the user names sacred and what receives the user's discretionary money.

Detection rule: fires when user has at least one sacred-value signal at rank ≤ 1 from Q-S2 (e.g., family_priority, faith_priority, justice_priority, knowledge_priority) AND the matching spending category in Q-S3-cross is at cross-rank ≥ 3 (low strength) or absent from Q-S3-cross entirely (didn't make top-2 in either parent ranking). Mapping:
- family_priority → family_spending_priority
- faith_priority → nonprofits_religious_spending_priority (faith correlates with religious-tradition allocation but the mapping is approximate)
- justice_priority → nonprofits_religious_spending_priority OR social_spending_priority
- knowledge_priority → social_spending_priority OR companies_spending_priority

User prompt: "You named [top sacred value from Q-S2] as among your most sacred values. Your money flows mostly to [top-2 from Q-S3-cross]. The model reads a gap — between what you say is sacred and where your discretionary resources actually go. This may be exhaustion, ambition, season, or a real conflict between stated and lived values. The model doesn't read which. Does this gap feel familiar?"

Signals consumed: [matching sacred signal] + [Q-S3-cross top-2 signals at cross-rank ≤ 2]
```

**T-014 — Sacred Words vs Spent Energy:**

Analogous to T-013 but operates on Q-E1 (energy) instead of Q-S3 (money).

Detection: user has top sacred-value signal at rank ≤ 1, AND the corresponding "energy domain" is not in Q-E1-cross top-2. Mapping (loose, since energy domains are less directly tied to specific values):

- truth_priority → learning_energy_priority OR solving_energy_priority
- family_priority → caring_energy_priority
- justice_priority → solving_energy_priority OR caring_energy_priority
- knowledge_priority → learning_energy_priority OR building_energy_priority
- freedom_priority → building_energy_priority OR enjoying_energy_priority
- stability_priority → restoring_energy_priority OR caring_energy_priority

User prompt: "You named [top sacred value] as among your most sacred values. Your discretionary energy flows mostly to [top-2 from Q-E1-cross]. There may be a gap between what you say matters most and where your best energy actually goes. Same caveat as T-013 — the model doesn't read why. Does this gap feel familiar?"

**T-015 — Current vs Aspirational Allocation:**

Detection: in any of the four allocation parent rankings (Q-S3-close, Q-S3-wider, Q-E1-outward, Q-E1-inward), at least 2 of the 3 ranked items have a non-`right` overlay (either `wish_less` or `wish_more`). Multiple categories within the same ranking diverge from the user's own aspirational read.

User prompt: "When you ranked [Q-S3-close OR whichever fired the tension], you marked at least two categories where the current flow doesn't match what you wish. The model reads this as: you're not in alignment with your own aspirational direction within this domain. The gap is yours to read; the model only surfaces it."

Signals consumed: the overlay markers themselves (any 2+ non-`right` markers within a single allocation parent ranking).

All three tensions follow the canonical hedging vocabulary: `may`, `appears to`, `may suggest`, `the model reads a gap`. None use prosecutorial language.

### D-8: Twelve SIGNAL_DESCRIPTIONS entries

Add to `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS`. Voice register matches the existing entries (single sentence, descriptive not declarative).

```ts
self_spending_priority:
  "Allocates discretionary money primarily toward themselves — needs, comforts, savings, well-being.",
family_spending_priority:
  "Allocates discretionary money primarily toward family — kin, partners, children, parents, chosen kin.",
friends_spending_priority:
  "Allocates discretionary money primarily toward chosen friends — people they've selected as close.",
social_spending_priority:
  "Allocates discretionary money primarily toward social experiences — leisure, dining, travel, entertainment.",
nonprofits_religious_spending_priority:
  "Allocates discretionary money primarily toward civil society and faith communities — charities, NGOs, churches, missions.",
companies_spending_priority:
  "Allocates discretionary money primarily toward businesses — whether owned, employed by, invested in, or transacted with.",
building_energy_priority:
  "Allocates discretionary energy primarily toward building or creating — making something new.",
solving_energy_priority:
  "Allocates discretionary energy primarily toward solving problems — removing dysfunction, debugging, repairing.",
restoring_energy_priority:
  "Allocates discretionary energy primarily toward restoring order — organizing, maintaining, preserving what works.",
caring_energy_priority:
  "Allocates discretionary energy primarily toward caring for people — attention, presence, emotional labor.",
learning_energy_priority:
  "Allocates discretionary energy primarily toward learning — taking in, studying, exploring, making sense.",
enjoying_energy_priority:
  "Allocates discretionary energy primarily toward enjoying experience — savoring, presence, rest, pleasure.",
```

### D-9: Result-writing canon update

Append to `docs/canon/result-writing-canon.md`:

```markdown
## Allocation rules (CC-016)

The allocation layer (Q-S3 money, Q-E1 energy) is governed by a separate canon doc — `docs/canon/allocation-rules.md` — which codifies four rules: stated-vs-spent values, direction-not-quality, current-vs-aspirational tension, and non-accusatory interpretation.

The allocation rules are subordinate to the result-writing canon's existing rules: hedging vocabulary, protected lines, no moralization, no clinical implication. Where the allocation rules and the result-writing canon disagree, the result-writing canon wins.
```

### D-10: Mirror integration

Append to `app/components/MirrorSection.tsx` a new section: **Allocation Tensions**. Position: between *When the Load Gets Heavy* and *Your Next 3 Moves*. The section appears only when at least one of T-013, T-014, T-015 fires.

Render structure:

- Mono kicker: `ALLOCATION GAPS` (or similar).
- Serif italic subtitle: *"the gap between what you name and where your resources actually go."*
- Up to three short paragraphs, one per fired tension.
- Each paragraph uses the canonical hedging vocabulary and ends with the user prompt question (*"Does this gap feel familiar?"* or similar) without confirmation buttons (the user reads, doesn't confirm — Mirror is reflective, not interactive in this version).

The full Coherence narrative — rich cross-card pattern detection — is v2 work. CC-016's Mirror integration is the *gap-detection floor*: surfaces tensions when they fire, doesn't try to do the deeper synthesis yet.

### D-11: Conviction Posture template determiner fix (carryover from CC-015a)

In the Conviction Posture template (in `lib/identityEngine.ts`), the `the ${valueListPhrase(...)} you protect` construction produces *"the your top values you protect"* when `valueListPhrase` returns *"your top values"*. Fix by:

1. Drop the literal `the` from the template.
2. Update `valueListPhrase` to return article-self-contained phrases:
   - variant 0: *"the X, Y, Z, and W you protect"* (article included)
   - variant 1: *"your top values"* (no article needed)
   - variant 2: *"what you protect"* (no article)
   - variant 3: *"the four values you ranked highest"* (article included)
3. The Conviction Posture template uses `${valueListPhrase(topCompass, variantIndex)}` directly without prefixing with `the`.

Smoke test: synthetic INTJ-with-Knowledge-top session — Conviction Posture line reads cleanly with no doubled determiner.

### D-12: Skip cascade behavior for derived rankings

If `Q-S3-close` OR `Q-S3-wider` is skipped (per CC-014's skip mechanism), `Q-S3-cross` cannot populate (no top-2 from one of its parents). Cascade-skip behavior:

- Mark `Q-S3-cross` as skipped automatically.
- Emit a `derived_question_skipped` MetaSignal for `Q-S3-cross` (re-using CC-014's MetaSignal type, with new `MetaSignalType` enum value).
- The user does not see Q-S3-cross at all. The flow advances directly past it.

Same for `Q-E1-cross` if either of its parents is skipped.

If a parent is skipped and then second-pass-resolved with a single-pick (per CC-014), the cross-rank can populate. Sequence: parent ranking skipped → second-pass single-pick provides one signal → cross-rank gates check if BOTH parents have at least 2 signals (top-2 needed). If second-pass provides only 1 signal (single-pick), the cross-rank still cascades skip because only 1 signal is available from the second-pass-resolved parent.

Add `MetaSignalType` value: `derived_question_skipped`.

### D-13: Tone register

All Q-S3 / Q-E1 question text and gloss respects the new allocation rules:

- Use *"flows naturally"* / *"actually goes"* / *"discretionary"* — not *"do you spend on"* (too prescriptive).
- Use *"direction"* — not *"value"* / *"importance"* (the question doesn't ask what the user values; it asks where the resources flow).
- Helper text explicitly disclaims moral judgment: *"The model reads direction, not moral quality."*

All T-013/T-014/T-015 prose templates respect:

- Canonical hedging: `may`, `appears to`, `may suggest`, `the model reads`.
- Non-accusatory framing: *"This may be exhaustion, ambition, season, or a real conflict — the model doesn't read which."*
- User as final authority: closing line is always a question, not a statement.

---

## Requirements

### 1. Create `docs/canon/allocation-rules.md` per § D-1

Four canonical rules + implementation surface table + relationship to other canon files.

### 2. Append six question entries to `docs/canon/question-bank-v1.md` per § D-2

Q-S3-close, Q-S3-wider, Q-S3-cross, Q-E1-outward, Q-E1-inward, Q-E1-cross. Each entry follows the existing format; cross-rank entries have a `derived_from` field per § D-3.

### 3. Add types to `lib/types.ts` per § D-3

`DerivedRankingQuestion`, `RankingDerivedAnswer`, `AspirationalOverlay`, `RankingAnswerWithOverlay`. Extend `Question`, `Answer`, `Signal` unions.

Plus extend `InnerConstitution`:

```ts
export type InnerConstitution = {
  // existing fields preserved
  ...
  allocation_overlays?: {
    money_close?: Record<string, AspirationalOverlay>;
    money_wider?: Record<string, AspirationalOverlay>;
    energy_outward?: Record<string, AspirationalOverlay>;
    energy_inward?: Record<string, AspirationalOverlay>;
  };
};
```

### 4. Add twelve question entries in `data/questions.ts` per § D-2

Append per the structures shown. Include the `Q-S3-cross` and `Q-E1-cross` entries with `type: "ranking_derived"` and `derived_from`.

### 5. Add twelve `SIGNAL_DESCRIPTIONS` entries to `lib/identityEngine.ts` per § D-8

Voice matches existing entries.

### 6. Register signals + tensions in canon

- Append twelve signal entries to `docs/canon/signal-library.md` per § D-4.
- Append T-013, T-014, T-015 to `docs/canon/tension-library-v1.md` per § D-7.
- Update Active / Unused / Deprecated counts in signal-library.md.

### 7. Engine: add cross-rank signal emission per § D-6

Update `signalsFromRankingAnswer` to handle `RankingDerivedAnswer`. The function reads `derived_item_sources` and emits one signal per item with the appropriate `cross_rank` value, `rank` undefined (cross-ranks don't have within-domain rank), and `source_question_ids` containing both the parent and cross IDs.

### 8. Engine: add T-013, T-014, T-015 detection blocks in `detectTensions`

Each detection block follows the existing CC-011 / CC-011b pattern. Detection rules per § D-7. Use `hasAtRank` for sacred-value signal detection; use `cross_rank` field for cross-rank signal detection.

### 9. Engine: handle aspirational overlays

Update `buildInnerConstitution` to populate `allocation_overlays` from the `RankingAnswerWithOverlay` answer entries (when overlay is set).

### 10. Renderer: add overlay UI to `Ranking.tsx`

Per § D-5. Three radio buttons per item, only on the four allocation parent rankings. Detect via question.id pattern OR via a new prop `showOverlay: boolean` passed by `app/page.tsx`.

### 11. Renderer: add derived-ranking item population in `app/page.tsx`

Update the ranking widget mount logic to handle `type: "ranking_derived"` questions. Compute items from `derived_from` answers at render time. Skip cascade per § D-12.

### 12. Renderer: add Mirror Allocation Tensions section

Append to `MirrorSection.tsx` per § D-10. Render only when one or more of T-013/T-014/T-015 fires. Each tension renders as one short paragraph + closing question.

### 13. Update `result-writing-canon.md` per § D-9

Append the cross-reference section.

### 14. Conviction Posture determiner fix per § D-11

Update `valueListPhrase` to return article-self-contained phrases. Update Conviction Posture template to use `${valueListPhrase(...)}` without prefixing `the`.

### 15. Add `derived_question_skipped` to `MetaSignalType` per § D-12

Single enum value addition.

### 16. Type-check, lint, smoke test

- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- Engine smoke: synthetic INTJ-with-Knowledge-top session that picks Yourself+Family in Q-S3-close, Companies+NPRel in Q-S3-wider, top-2-from-each in Q-S3-cross with Yourself winning cross-rank-1. Expected:
  - Q-S3-cross emits 4 signals, each at appropriate cross_rank.
  - T-013 fires (knowledge_priority is rank-1 sacred value but knowledge-related spending — companies or social — is not in Q-S3-cross top-2). Reads as gap.
  - The Conviction Posture template renders with no doubled determiner.
- Same for Q-E1.
- T-015 smoke: any synthetic session with at least 2 non-`right` overlay markers in one allocation parent ranking → T-015 fires for that ranking.
- Browser smoke at `localhost:3003` (or deferred to user).

---

## Allowed to Modify

**Canon:**

- `docs/canon/allocation-rules.md` — NEW.
- `docs/canon/question-bank-v1.md` — append six question entries.
- `docs/canon/signal-library.md` — append twelve signal entries; update summary counts.
- `docs/canon/tension-library-v1.md` — append T-013, T-014, T-015.
- `docs/canon/result-writing-canon.md` — append cross-reference per § D-9.

**Code:**

- `lib/types.ts` — add types per § D-3.
- `lib/identityEngine.ts` — add SIGNAL_DESCRIPTIONS, cross-rank emission, three tension detection blocks, allocation overlay handling, Conviction determiner fix.
- `data/questions.ts` — append six question entries.
- `app/page.tsx` — derived-ranking handling, overlay state.
- `app/components/Ranking.tsx` — overlay UI.
- `app/components/MirrorSection.tsx` — Allocation Tensions section.

Do **NOT** modify:

- Any other `docs/canon/*.md` file.
- Any tension detection block other than the new T-013, T-014, T-015 (existing T-001 through T-012 stay byte-identical).
- Any signal definition outside the twelve new entries.
- Any aggregation helper, per-card derivation function, or cross-card synthesis function.
- The CC-015a constants and helpers.
- Any other `app/components/*.tsx` file.
- `app/globals.css`, `app/layout.tsx`.
- `prompts/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `.claude/settings.local.json`, `postcss.config.mjs`.

---

## Out of Scope

- **Per-card process inflection** (Heart-as-Fi-vs-Fe, etc.). v2.
- **Cross-card matrix pattern detection** beyond T-013/T-014/T-015. v2 Coherence Engine.
- **Q-X3 / Q-X4 / Q-T restructuring.** v2.5.
- **Aperture / distance UX.** v3.
- **LLM-based extraction or interpretation.** Future when API integration is taken on.
- **Persistence / autosave / sharing.** Postgres-era work.
- **Print stylesheet, dark mode, accessibility audit.** Polish.
- **New questions, signals, or tensions** beyond the spec'd 12 signals + 3 tensions + 6 questions.

---

## Acceptance Criteria

1. `docs/canon/allocation-rules.md` exists per § D-1 with four rules + implementation surface table.
2. Six question entries appended to `question-bank-v1.md`. Each parent ranking is `type: ranking`. Each cross-rank is `type: ranking_derived` with `derived_from`.
3. Twelve signal entries in `signal-library.md`. Active count updated.
4. T-013, T-014, T-015 in `tension-library-v1.md` with detection rules + user prompts per § D-7.
5. `lib/types.ts` declares `DerivedRankingQuestion`, `RankingDerivedAnswer`, `AspirationalOverlay`, `RankingAnswerWithOverlay`. `Question`, `Answer`, `Signal` unions extended. `InnerConstitution` extended with `allocation_overlays`.
6. `data/questions.ts` appends six new question entries with the structures from § D-2.
7. `lib/identityEngine.ts` `SIGNAL_DESCRIPTIONS` gains 12 entries.
8. `signalsFromRankingAnswer` handles `RankingDerivedAnswer` and emits cross-rank signals per § D-6.
9. `detectTensions` adds T-013, T-014, T-015 detection blocks per § D-7.
10. `buildInnerConstitution` populates `allocation_overlays` from overlay-bearing ranking answers.
11. `app/components/Ranking.tsx` shows the three-state overlay UI on the four allocation parent rankings, NOT on cross-ranks.
12. `app/page.tsx` handles `type: "ranking_derived"` questions: pulls items from `derived_from` answers at render time; cascade-skips when parent is skipped.
13. `app/components/MirrorSection.tsx` renders the Allocation Tensions section when one or more of T-013/T-014/T-015 fires.
14. `result-writing-canon.md` appended with cross-reference per § D-9.
15. Conviction Posture template no longer produces *"the your top values you protect"* — `valueListPhrase` returns article-self-contained phrases, template doesn't prefix `the`.
16. `derived_question_skipped` added to `MetaSignalType`.
17. `npx tsc --noEmit` clean.
18. `npm run lint` clean.
19. Smoke test synthetic INTJ session: T-013 fires when knowledge_priority is rank-1 sacred AND no Q-S3-cross signal corresponds. Conviction Posture renders cleanly. Mirror surfaces Allocation Tensions section.
20. No file outside the Allowed to Modify list has been edited.
21. No existing tension detection block (T-001 through T-012) is modified.

---

## Report Back

Return a single markdown block with:

1. **Files changed** — bullet per file.
2. **Canon: allocation-rules.md** — quote the four rules verbatim.
3. **Canon: question-bank entries** — quote one parent ranking entry (Q-S3-close) and one cross-rank entry (Q-S3-cross) verbatim.
4. **Canon: signal-library updates** — quote one new signal entry verbatim. Confirm summary counts updated.
5. **Canon: tensions added** — quote T-013 entry verbatim.
6. **Type system** — quote new types verbatim. Confirm existing types preserved.
7. **Engine: cross-rank emission** — quote the updated `signalsFromRankingAnswer` body. Confirm `cross_rank` field set correctly.
8. **Engine: tension detection** — quote T-013 detection block. Confirm canonical hedging vocabulary in the user prompt.
9. **Renderer: overlay UI** — show the new affordance code or relevant excerpt.
10. **Renderer: derived-ranking handling** — show how `app/page.tsx` populates derived-question items at render time.
11. **Renderer: Mirror integration** — show the new Allocation Tensions section.
12. **Conviction determiner fix** — show before/after; confirm bug eliminated.
13. **Smoke test** — confirm synthetic session produces expected signals + tensions + Mirror render. If browser smoke deferred, say so.
14. **Type check + lint** — outputs.
15. **Scope-creep check** — confirm no out-of-scope file modified.
16. **Risks / next-step recommendations** — anything that surfaced. Specifically:
    - Any pattern-matching ambiguity in T-013 / T-014 detection rules (the value-to-spending mapping is approximate; surface false positives or false negatives in smoke test).
    - Whether the overlay UI feels intrusive or natural at the question-screen level.
    - Whether the Mirror Allocation Tensions section reads at the right register (gap-detection without prosecution).
    - Suggestions for v2 Coherence Engine integration beyond the three new tensions.
    - Any other observation worth surfacing.
