# Allocation Rules

## Purpose

Codifies the canonical rules that govern the **allocation layer** — the v2 measurement of *where the user's discretionary money and energy actually flow*, distinct from the Compass measurement of *what the user names sacred*. Allocation extends the Compass card without replacing it. The Compass card asks what the user would protect if forced to choose; the allocation layer asks where the resources actually go when no one is watching.

This canon binds every CC that authors questions, signals, tensions, or prose templates touching the allocation surface (Q-S3 money, Q-E1 energy, T-013 / T-014 / T-015, Mirror Allocation Gaps section). It is subordinate to `result-writing-canon.md` — where this canon and the result-writing canon disagree, result-writing wins.

---

## Rule 1 — Stated vs Spent Values

The model distinguishes between **stated values** and **spent values.** Stated values are what the user names as sacred, important, or worthy of protection (Q-S1, Q-S2). Spent values are inferred from where the user's energy, money, attention, and sacrifice actually go (Q-S3, Q-E1).

The purpose is not to accuse the user of hypocrisy, but to identify *coherence, tension, displacement, and hidden devotion.* A gap between stated and spent values may indicate dishonesty, but it may also indicate exhaustion, constraint, fear, obligation, economic pressure, or a life season where survival has temporarily outranked meaning. The model surfaces the gap; the user reads it.

Clarence's framing line, locked as canon-quality:

> *"Stated values reveal identity. Spent energy reveals allegiance."*

The user's framing line, also canon-quality:

> *"Show me your energy and your spending, and I'll show you what you care about."*

---

## Rule 2 — Direction, Not Quality

Allocation categories capture the *direction* of resource flow, not its *moral quality.* A user allocating heavily to **Self** may be reinvesting in productive capacity, consuming for well-being, or in self-destructive patterns. A user allocating heavily to **Non-Profits** may be supporting humanitarian causes or supporting identity-tribal organizations. A user allocating heavily to **Companies** may be supporting their own livelihood, investing in growth, or compulsively consuming.

The model does not distinguish these morally; it reads only flow. Moral content is read through Compass values (Q-S1, Q-S2), Conviction answers (Q-C1, Q-I1/I2/I3), and the cross-card narrative — never through allocation alone.

---

## Rule 3 — Current vs Aspirational Tension

For each allocation category in the four parent rankings (`Q-S3-close`, `Q-S3-wider`, `Q-E1-outward`, `Q-E1-inward`), the user is asked to mark whether the current flow is *right*, *more than they wish*, or *less than they wish*. The default is *right* — no implicit pressure to mark a category as out of alignment.

The gap between current and aspirational is **descriptive, not prescriptive.** The model surfaces the gap (T-015); the user is the only authority on what it means or what to do about it. The model never tells the user where their resources should go.

---

## Rule 4 — Non-Accusatory Interpretation

Allocation tensions surface as observations, not verdicts. Templated prose for T-013, T-014, T-015 must use the canonical hedging vocabulary (`appears to`, `may suggest`, `may be present`, `the model reads a gap`) and must never use prosecutorial language (`you fail to`, `you don't actually`, `you're not really`, `your real values are`).

The user reads the gap; the user decides what it means. Every T-013 / T-014 prose template ends with an open question, not a verdict — typically *"Does this gap feel familiar?"* — so the user has explicit permission to read the model as wrong.

---

## Implementation surfaces

For traceability, here is which constants in `lib/identityEngine.ts` (and renderer files) operationalize which canonical rule:

| Canonical rule | Code-level surface |
|---|---|
| Rule 1 (Stated vs Spent) | Q-S3, Q-E1 in `data/questions.ts` + T-013, T-014 detection in `lib/identityEngine.ts` |
| Rule 2 (Direction not quality) | Q-S3 / Q-E1 question helper text; Mirror Allocation Gaps prose |
| Rule 3 (Current vs aspirational) | Per-category three-state overlay UI in `app/components/Ranking.tsx`; T-015 detection in `detectAllocationOverlayTensions` |
| Rule 4 (Non-accusatory) | All allocation-tension `user_prompt` strings in `lib/identityEngine.ts` |

---

## Cross-rank semantics

The allocation layer introduces a new question type, `ranking_derived` (per `signal-and-tension-model.md`'s rank-aware signal contract extension in CC-016). A derived ranking takes the top-N of two parent rankings and asks the user to resolve them into one combined hierarchy. The signals emitted from a derived ranking carry both `cross_rank` (the resolved-hierarchy position) and a `source_question_ids` array containing both the parent and the derived question id.

T-013 / T-014 detection rules consume the `cross_rank` field — the resolved hierarchy is the most informative signal in the allocation layer, since it captures what wins when domains are forced to compete for the same dollar or hour.

If either parent of a derived ranking is skipped (per the CC-014 skip mechanism), the derived ranking **cascades-skip** automatically — the user does not see it, and a `derived_question_skipped` MetaSignal records the gap. T-013 / T-014 detection guards on whether cross-rank signals exist before attempting to fire.

---

## Relationship to other canon files

- `result-writing-canon.md` — the *"do not score belief content"* rule (CC-015c) is a sibling principle: the model observes structure, doesn't judge content. CC-015c applies it to free-text belief; this canon applies it to allocation flow. Both inherit the result-writing canon's hedging vocabulary and Five Dangers compliance.
- `shape-framework.md` — the Compass / Heart card canonically defines sacred values. This file extends Compass with allocation as the lived counterpart. Compass is *what you would not casually trade away;* allocation is *what you didn't trade away when no one was watching.* The two readings are distinct measurements; the engine never collapses them into one score.
- `signal-library.md` — the twelve allocation signals (six spending, six energy) are registered as canonical, rank-aware, and consumed by T-013 / T-014. Cross-rank signals share signal_ids with their parent-rank counterparts; the engine distinguishes them via the `cross_rank` field on the Signal.
- `tension-library-v1.md` — T-013, T-014, T-015 are the first allocation-driven tensions. Future v2 Coherence Engine work may add cross-card allocation tensions (e.g., gap between Gravity attribution and Q-E1 caring/solving allocation).

---

## What this canon does NOT govern

- Moral judgment of any allocation pattern. The model reads direction; the user reads meaning.
- Recommendations for *how* to close an allocation gap. The model surfaces; the user decides.
- Cross-card narrative beyond the three named tensions (T-013, T-014, T-015). Richer Coherence narrative is v2 work.
- Persistence of overlay corrections across sessions. v2 Postgres-era work.

This canon governs only the editorial and structural rules for how the allocation layer is measured and surfaced.
