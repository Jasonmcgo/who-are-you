# CC-030 — v2.5 Principle Canonization (Three-Min / Four-Default / Five-Max)

**Type:** Pure canon work. **No engine logic, no data changes, no component edits, no new signals.**
**Goal:** Canonize the empirical ranking-load principle ("three minimum, four default, five maximum — above five, restructure") that has been implicit in the question-bank's ranking primitives since CC-016 introduced the multi-stage pattern. Document the principle as a named rule, mark Q-C4 as the canonical 5-item exception, and reference Q-T1–T8 as the canonical four-default-at-scale example. Foundation for CC-031 (Q-X3 multi-stage restructure) and CC-032 (Q-X4 + Q-I2 cascade).
**Predecessor:** CC-016 (Allocation Layer) shipped — established the multi-stage pattern as canon for the first time.
**Successor:** CC-031 (Q-X3 Multi-Stage Restructure), CC-032 (Q-X4 + Q-I2 Cascade).
**Source memo:** `docs/product-direction/v2-5-universal-three.md` — v2.5 architectural memo. Read before drafting CC-031 / CC-032.

---

## Why this CC

The current canonical state in `question-bank-v1.md` § Ranking Question Schema caps ranking items at 4 or 5 and forbids 6+, but doesn't name *why* the cap exists or what to do when a domain genuinely requires more resolution. The implicit answer (multi-stage pattern: parent + parent + cross-rank) is shipped in Q-S3 / Q-E1 (CC-016) but never articulated as a generalizable architectural rule.

CC-030 makes the rule canonical so future CC authors don't re-derive it. CC-031 and CC-032 then implement Q-X3 and Q-X4 restructures by reference to the canonized principle.

This CC has zero engine surface. Pure documentation. Smallest of the three v2.5 CCs.

---

## The principle, in canonical form

> **Three minimum, four default, five maximum. Above five, restructure.**

- **3 items minimum** — Below this, prefer forced-choice or another primitive entirely. A ranking of 2 is a forced-choice in disguise.
- **4 items default** — Cleanest aggregate signal across the broadest user population. Standard for Q-S1, Q-S2, Q-T1–T8, the Q-S3-close / Q-S3-wider / Q-E1-outward / Q-E1-inward parent rankings, and all cross-ranks.
- **5 items maximum** — Acceptable when the domain genuinely requires that resolution and no clean way exists to split it into two parents. Tolerable; not preferred. Q-C4 (Individual / System / Nature / Supernatural / Authority) is the canonical exception.
- **6+ items** — Not supported. When a domain needs more than five items, restructure into the **multi-stage pattern**: split into two parent groups of 3-or-4 items each, then derive a cross-rank from the top picks of each parent.

Empirical defense: below three, ranking collapses into forced-choice with no resolution to learn from. Above five, the user stops resolving and starts approximating; the middle of the list becomes noise. The 8-card iteration cycles and Michele's test session are the validation evidence.

---

## Scope

This CC modifies a focused set of canon docs:

1. `docs/canon/card-schema.md` — § Question Types — add the principle as a named rule with cross-reference to question-bank-v1.md.
2. `docs/canon/question-bank-v1.md` — § Ranking Question Schema — adopt the principle as canonical; cross-reference Q-S3 / Q-E1 as canonical multi-stage examples; mark Q-C4 trailing note as the canonical 5-item exception; add cross-references to Q-T1–T8 as the canonical four-default-at-scale example.
3. `docs/canon/shape-framework.md` — small note on each card that uses ranking, referencing the principle.
4. `docs/product-direction/v2-5-universal-three.md` — annotate as "Status: Canonized as of CC-030" so future readers know which parts are now in canon vs. still memo-only.

**No other files modified.** No engine logic. No data. No components. No new signals. No new questions.

---

## Steps

### Step 1 — Add principle to `docs/canon/card-schema.md` § Question Types

Add a new sub-section near the top of Question Types titled **"Ranking primitive: item-count rule"**:

> **Three minimum, four default, five maximum. Above five, restructure.**
>
> The engine's ranking primitive forces the user to resolve which of N items wins when they're in real competition. That cognitive job has a hard upper bound on items.
>
> - **3 items minimum** — Below this, prefer forced-choice or another primitive entirely.
> - **4 items default** — Cleanest aggregate signal across the broadest user population.
> - **5 items maximum** — Acceptable when the domain genuinely requires that resolution and no clean way exists to split it into two parents. Q-C4 (Individual / System / Nature / Supernatural / Authority) is the canonical exception — the five attribution categories don't split cleanly into two parents.
> - **6+ items forbidden** — When a domain needs more than five items, use the **multi-stage ranking pattern** (see `question-bank-v1.md` § Ranking Question Schema).

### Step 2 — Update `docs/canon/question-bank-v1.md` § Ranking Question Schema

Add the principle by reference, then document the multi-stage pattern in detail:

> **Item-count rule** (defined in `card-schema.md` § Question Types): three minimum, four default, five maximum.
>
> **Multi-stage ranking pattern** — When a domain genuinely contains more than five items of resolution, the engine does not ask the user to rank seven or eight things at once. The domain is split into two parent groups, each ranked separately at 3-or-4 items, and a derived cross-rank resolves the top picks of each parent against each other.
>
> Architectural properties:
>
> 1. Each parent stays at 3 or 4 items. The user never sees more than 4 things to rank in a single panel.
> 2. The cross-rank is always 4 items — top-2 of each parent. Fixed cross-rank shape regardless of parent size.
> 3. Parent rankings emit signals with `rank` 1..N. Cross-ranks emit cross-rank signals (`cross_rank` 1..4) using the same signal IDs as the parents.
> 4. The cross-rank does not carry the aspirational overlay. Only parent rankings do.
> 5. Parents may carry domain-specific overlays.
>
> **Canonical examples:**
>
> - Q-S3-close (3 items, parent) + Q-S3-wider (3 items, parent) + Q-S3-cross (derived, 4 items) — money allocation. Introduced in CC-016.
> - Q-E1-outward (3 items, parent) + Q-E1-inward (3 items, parent) + Q-E1-cross (derived, 4 items) — energy allocation. Introduced in CC-016.
> - Q-X3 (multi-stage; institutional trust) — introduced in CC-031.
> - Q-X4 (multi-stage; personal trust) — introduced in CC-032.

### Step 3 — Q-C4 trailing note

Update the Q-C4 entry's trailing note in `docs/canon/question-bank-v1.md` to explicitly mark it as the canonical 5-item exception:

> **Q-C4 — canonical 5-item exception.** The five attribution categories (Individual / System / Nature / Supernatural / Authority) do not split cleanly into two parents — they are five distinct ontological frames for where responsibility lives, and forcing them into two groups would smear a distinction the question is specifically trying to surface. Q-C4 sits at the principle's ceiling deliberately because the alternative loses signal. Per `card-schema.md` § Question Types: *"Five items maximum — acceptable when the domain genuinely requires that resolution and no clean way exists to split it into two parents."*

### Step 4 — Q-T1–T8 trailing notes

Update each Q-T entry's trailing note in `docs/canon/question-bank-v1.md` to cross-reference the principle:

> **Q-T1–T8 — canonical four-default-at-scale.** Each of the eight Q-T questions is a 4-item ranking (the four cognitive functions surfaced as Voice A / B / C / D). The eight-question structure gives the engine adequate observation depth without piling items into any single ranking. Per `card-schema.md` § Question Types: four-default. Q-T is the canonical example of the principle applied at scale — many small rankings, not one big one.

### Step 5 — Cross-references in `docs/canon/shape-framework.md`

For each card section that references a ranking question, add a small inline note: *"Per the ranking item-count rule (`card-schema.md` § Question Types)..."* — this seeds future readers' awareness without rewriting the section.

### Step 6 — Annotate `docs/product-direction/v2-5-universal-three.md`

Add a header-level status note:

> **Status update (2026-04-28):** The principle described in this memo's "The principle" section has been canonized as of CC-030 (`card-schema.md` § Question Types and `question-bank-v1.md` § Ranking Question Schema). The Q-X3 and Q-X4 restructure work follows in CC-031 and CC-032.

This makes the memo's relationship to live canon explicit — future readers can see what's settled vs. still memo-only.

### Step 7 — Verification

- `npx tsc --noEmit` exits 0. (No code changes, but worth running to confirm canon-doc edits didn't accidentally affect TS imports.)
- `npm run lint` passes. (Same.)
- `npm run build` succeeds.
- `git diff --stat` shows changes only in the named canon files.

---

## Acceptance

- `docs/canon/card-schema.md` § Question Types contains the locked principle text with the four-bullet item-count rule and the multi-stage pattern reference.
- `docs/canon/question-bank-v1.md` § Ranking Question Schema documents the multi-stage pattern with all four canonical examples (Q-S3, Q-E1, Q-X3 forward-reference, Q-X4 forward-reference).
- Q-C4 trailing note marks it as the canonical 5-item exception.
- Q-T1–T8 trailing notes cross-reference the principle as the four-default-at-scale example.
- `docs/canon/shape-framework.md` has cross-references to the principle for ranking-question card sections.
- `docs/product-direction/v2-5-universal-three.md` carries the canonization status note.
- `git diff --stat` shows only canon-doc files modified.
- Build, type-check, and lint all pass.

---

## Out of scope

- **Any engine, data, component, or signal change.** This CC is canon-only.
- **Implementing Q-X3 or Q-X4 multi-stage restructure.** Those are CC-031 and CC-032 respectively. CC-030 only canonizes the principle they'll reference.
- **Renaming or removing any existing question, signal, or pattern.**
- **Editing tension definitions.**
- **Q-Stakes1's status as a 5-item ranking.** Q-Stakes1 (introduced in CC-024) sits at the 5-item ceiling; whether it gets named as a canonical exception alongside Q-C4 OR scheduled for future multi-stage restructure is a CC-class architectural decision deferred to later. CC-030 doesn't decide.

If you find yourself editing files outside the named canon docs, stop and flag.

---

## Notes for the executing engineer

- **Pure documentation work.** No TypeScript, no React, no data. The verification step exists only to confirm canon-doc edits don't accidentally break imports (e.g., a stray markdown link that breaks a TypeScript JSDoc reference).
- **Voice consistency:** match the existing tone in `card-schema.md` and `question-bank-v1.md`. Both files lean architectural/declarative. The principle text above is calibrated to that voice; tune lightly if context demands but don't substantially rewrite.
- **No git diff in non-canon files.** If you find yourself touching `lib/`, `app/`, `data/`, or any component file, you've gone out of scope — reset and reconsider.
- **Forward-references to CC-031 and CC-032** are intentional — the pattern documentation references work that hasn't yet shipped. That's fine; the principle stands on its own and the forward-references make the memo's full architectural shape visible.
