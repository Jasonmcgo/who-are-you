# CC-018 — Q-T Item-Order Shuffle (Pattern-Recognition Gap A)

## Launch Directive

You are executing CC-018. This is a small, data-only CC that defeats the visual pattern-recognition gap in the Temperament card's Q-T1 through Q-T8 questions by reshuffling the item order per question. No engine logic changes. No new types. No new questions, signals, or tensions. The change is contained to `data/questions.ts` and a corresponding update to `docs/canon/question-bank-v1.md`.

This CC is independent of CC-017 (Keystone Reflection Restructure) and may run in parallel with it. The two CCs touch disjoint parts of `data/questions.ts` (CC-017 touches Q-I1 / Q-I2 / Q-I3; CC-018 touches Q-T1 / Q-T2 / ... / Q-T8). No merge conflicts expected; if a conflict arises, both CCs are additive in their scope and the resolution is mechanical.

This CC addresses **Gap A only** of the two Q-T pattern-recognition gaps documented in project memory. Gap A is voice-letter pattern matching (the user notices "Voice A is always Ni" and stops re-reading the scenarios). Gap B is quote-archetype transparency (the quote phrasing itself signals the function to a Jungian-aware reader); Gap B is harder, requires a quote-rewrite pass, and is out of scope for CC-018.

## Bash Authorized

Yes. Use the shell freely for `tsc`, `eslint`, dev-server smoke runs, and any inspection scripts. Do not commit or push.

## Execution Directive

### Background — the gap

`data/questions.ts` currently lists Q-T1 through Q-T4 (the perceiving block) with items in identical function order: every question has Voice A=Ni, Voice B=Ne, Voice C=Si, Voice D=Se. Q-T5 through Q-T8 (the judging block) similarly lists Voice A=Ti, Voice B=Te, Voice C=Fi, Voice D=Fe in every question.

The voice-token-to-function binding is constant within each block. A user who notices the pattern in Q-T1 ("Voice A's quote sounds like the pattern-reader voice") can rank Voice A first across Q-T2, Q-T3, Q-T4 without re-reading the scenarios — and the engine reads four high-confidence Ni signals when the user actually identified one voice resonance and applied it. The engine's aggregation across the four function appearances becomes confirmation of pattern-spotting rather than measurement of self-recognition.

Project memory: `project_qt_pattern_recognition_gap.md` — read for full context.

### The fix

Shuffle the function-to-position mapping per question using a **Latin square** permutation. Each function still appears exactly once per question (already true). Across the four questions in each block, each function appears at each position (1st, 2nd, 3rd, 4th) **exactly once** — the Latin property — so no position is reliably correlated with any function across the block.

The canonical permutation pattern is **cyclic rotation**: each subsequent question rotates the function order by one position. Simple, replicable, and produces a valid Latin square.

**Perceiving block (Q-T1 through Q-T4) — function order at each position:**

| Question | Position 1 | Position 2 | Position 3 | Position 4 |
|----------|------------|------------|------------|------------|
| Q-T1     | ni         | ne         | si         | se         |
| Q-T2     | ne         | si         | se         | ni         |
| Q-T3     | si         | se         | ni         | ne         |
| Q-T4     | se         | ni         | ne         | si         |

**Judging block (Q-T5 through Q-T8) — function order at each position:**

| Question | Position 1 | Position 2 | Position 3 | Position 4 |
|----------|------------|------------|------------|------------|
| Q-T5     | ti         | te         | fi         | fe         |
| Q-T6     | te         | fi         | fe         | ti         |
| Q-T7     | fi         | fe         | ti         | te         |
| Q-T8     | fe         | ti         | te         | fi         |

Verify the Latin property by reading each column: in the perceiving block, position 1 columns reads `ni, ne, si, se` — each function appears exactly once. Same for positions 2, 3, 4. Same for the judging block.

Q-T1 and Q-T5 keep their current order so the canonical reference is preserved as the "Q-T1 / Q-T5 baseline." The other six questions reorder per the table above.

### Implementation

For each of Q-T1 through Q-T8 in `data/questions.ts`, reorder the `items` array to match the new function order. Each item's `id`, `label` (Voice A / B / C / D), `voice`, `quote`, `example`, and `signal` fields stay attached to the function — only the array position changes.

Concretely: today, Q-T2's items array is `[ni, ne, si, se]` in that order. After this CC, Q-T2's items array becomes `[ne, si, se, ni]` — meaning the item with `signal: "ne"` is now first (and gets `label: "Voice A"`), the item with `signal: "si"` is second (and gets `label: "Voice B"`), etc.

**Critical: voice tokens follow reading order, not function.** Per `temperament-framework.md` § 8: "Voice tokens (Voice A / B / C / D) follow reading order, not function." This means after the shuffle, each item's `label` and `voice` fields must be reassigned based on its new position. The first item in the array always gets `label: "Voice A"` and `voice: "Voice A"`; the second always gets `label: "Voice B"` / `voice: "Voice B"`; etc.

Do not preserve the original `label` / `voice` values across the shuffle — that would defeat the canonical voice-token reading-order rule.

The `id` field on each item also follows the function (`ni`, `ne`, `si`, `se`, `ti`, `te`, `fi`, `fe`) — it's a stable identifier for the function-bearing item, independent of its position. The `id` field stays unchanged across the shuffle.

The `signal` field stays attached to the function — same reason.

### Aggregation is unaffected

The engine's aggregation in `temperament-framework.md` § 4 reads each item's `signal` field, not its position or its voice label. Each function's stack position is computed from the user's average rank across the four questions where that function appears. Reordering items within questions does not change which function each item carries, so the aggregation continues to produce identical stack outputs for any given user input.

You do not need to modify `lib/identityEngine.ts`. You do not need to modify any aggregation logic. You do not need to modify any per-card derivation function. The engine sees the user's ranking via `signalsFromRankingAnswer`, which reads `q.items.find((i) => i.id === itemId)` and emits `{ signal_id: item.signal, ... rank }` — entirely indifferent to the array position.

Verify this by running a session with known top-of-stack functions before and after the CC and confirming the resulting stack outputs match.

### Soft-spot quotes

Per `question-bank-v1.md` trailing notes, five Q-T quotes are flagged as soft-spot drafts that may need polish in a later CC: Q-T1 Se, Q-T2 Ne, Q-T3 Si, Q-T6 Fi, Q-T8 Ti/Te. These soft-spot designations are **function-keyed, not position-keyed**. Shuffling positions does not affect which quotes are soft-spot — the same quotes for the same functions stay flagged. The trailing notes in `question-bank-v1.md` do not need to be updated for this CC.

### Canon update

`docs/canon/question-bank-v1.md` lists each Q-T entry's items in a specific order matching the production data. After this CC, the canon entries must be re-ordered to match the new array. Update each Q-T entry's items list to reflect the post-shuffle order. The trailing notes (the prose paragraphs after each items block) stay byte-identical except for any explicit position references — there should not be any, since the trailing notes are function-keyed.

## Allowed-to-Modify

- `data/questions.ts` — reorder the items arrays for Q-T1 through Q-T8 per the Latin-square table above. Reassign `label` and `voice` fields based on each item's new position. Leave `id`, `quote`, `example`, and `signal` fields attached to their functions.
- `docs/canon/question-bank-v1.md` — update the items listings under each Q-T entry to match the new order. Trailing notes stay unchanged.

No other file should be modified.

## Out of Scope — explicit "do not" list

- **Do not** modify any item's `quote`, `example`, `id`, or `signal` field. Quote text stays exactly as authored in CC-010. Quote-rewrite work is Gap B (CC-019 hypothetical), separate scope.
- **Do not** modify any Q-T question's text, helper, or trailing note prose.
- **Do not** modify the soft-spot quote designations or any trailing-note language about them.
- **Do not** modify `lib/identityEngine.ts`. The engine's aggregation reads `signal` from items, not position; no engine work needed.
- **Do not** modify `temperament-framework.md`. The voice-token-follows-reading-order rule is already canon and stays as-is.
- **Do not** modify any other question (Q-S, Q-X, Q-C, Q-P, Q-F, Q-A, Q-I, Q-S3, Q-E1).
- **Do not** modify any signal definition.
- **Do not** modify any tension detection block.
- **Do not** modify any Mirror prose or Map prose.
- **Do not** modify any component file (`Ranking.tsx`, `MirrorSection.tsx`, `MultiSelectDerived.tsx` from CC-017, `QuestionShell.tsx`, etc.).
- **Do not** modify build configuration (`eslint.config.mjs`, `tsconfig.json`, `package.json`).
- **Do not** modify AGENTS.md, CLAUDE.md, README, or any prompt file other than this one.
- **Do not** introduce any runtime randomization. The shuffle is canonical, deterministic, and lives in source. Runtime shuffling per session breaks replicability and is explicitly rejected for v1; the Latin-square permutation is the v1 mechanism.

## Acceptance Criteria

1. **Q-T1 unchanged.** Q-T1's items array remains `[ni, ne, si, se]` (in that order). Voice A=ni, Voice B=ne, Voice C=si, Voice D=se. This is the canonical baseline; do not modify.
2. **Q-T2 reordered to `[ne, si, se, ni]`.** Voice A=ne, Voice B=si, Voice C=se, Voice D=ni.
3. **Q-T3 reordered to `[si, se, ni, ne]`.** Voice A=si, Voice B=se, Voice C=ni, Voice D=ne.
4. **Q-T4 reordered to `[se, ni, ne, si]`.** Voice A=se, Voice B=ni, Voice C=ne, Voice D=si.
5. **Q-T5 unchanged.** `[ti, te, fi, fe]`. Voice A=ti, Voice B=te, Voice C=fi, Voice D=fe.
6. **Q-T6 reordered to `[te, fi, fe, ti]`.** Voice A=te, Voice B=fi, Voice C=fe, Voice D=ti.
7. **Q-T7 reordered to `[fi, fe, ti, te]`.** Voice A=fi, Voice B=fe, Voice C=ti, Voice D=te.
8. **Q-T8 reordered to `[fe, ti, te, fi]`.** Voice A=fe, Voice B=ti, Voice C=te, Voice D=fi.
9. **Latin square property holds.** For Q-T1-Q-T4: at each position (1, 2, 3, 4), each of `ni, ne, si, se` appears exactly once across the four questions. Same for Q-T5-Q-T8 with `ti, te, fi, fe`. Verify by reading the eight items arrays and confirming.
10. **Item field integrity.** For every item across all eight questions, the `id` field matches its `signal` field's function (item with `id: "ni"` carries `signal: "ni"`, etc.). Quote text and example text stay attached to the function (the item with `signal: "ni"` has the same quote text it had before this CC).
11. **Voice tokens reassigned by position.** For every item in every Q-T question, the `label` and `voice` fields read `Voice [A/B/C/D]` matching the item's new position in the array (first = Voice A, second = Voice B, etc.). No item retains its old voice token if its position changed.
12. **Engine aggregation unchanged.** Run a smoke session with a known input (e.g., user ranks all Voice A items first across the perceiving block — equivalent to ranking Ni, Ne, Si, Se as #1 across Q-T1, Q-T2, Q-T3, Q-T4 respectively post-shuffle, since each Q-T's first item is now a different function). Confirm the resulting Lens stack matches what would be expected from "user ranked Ni once, Ne once, Si once, Se once at top" — a balanced perceiving-block input with no clear dominant function.
13. **Canon question-bank-v1.md matches.** Each Q-T entry's items listing in the canon file matches the new order in `data/questions.ts`. Trailing notes unchanged.
14. **TSC clean.** `npx tsc --noEmit` exits 0 with no output.
15. **Lint clean.** `npm run lint` exits 0 with no warnings.
16. **No file outside the Allowed-to-Modify list is modified.**

## Report Back

1. **Files changed** — `data/questions.ts` and `docs/canon/question-bank-v1.md` only. Confirm via `git status`.
2. **New item order verified per question** — paste the eight items arrays' function sequences as a table or list, matching the Latin-square spec above.
3. **Latin square verification** — confirm the column-property (each function appears at each position exactly once across the four questions in each block).
4. **Field-integrity verification** — for each Q-T question, confirm: (a) every item's `id` matches its `signal`'s function name, (b) every item's `quote` and `example` are byte-identical to pre-CC values for that function, (c) every item's `label` and `voice` match the item's new position (Voice A for first, Voice B for second, etc.).
5. **Engine aggregation regression check** — paste a smoke session (synthetic answers + resulting Lens stack) demonstrating that aggregation produces identical results before and after the CC for the same user-input intent. The smoke should explicitly confirm that the engine reads function from `item.signal` and ignores position.
6. **Canon update verification** — paste the updated Q-T1 through Q-T8 items listings from `docs/canon/question-bank-v1.md` and confirm they match `data/questions.ts`.
7. **TSC + lint** — exit codes.
8. **Scope-creep check** — confirm only the two allowed files were modified.
9. **Risks / next-step recommendations** — anything you noticed during the work that warrants a follow-up CC. Specifically: if any Q-T quote or example text reads as positionally awkward in the new order (e.g., a quote that referenced "the previous voice"), surface it. None expected since the quotes are scenario-specific and don't cross-reference each other, but worth a check.

## Notes for the executing engineer

- This CC is mechanical. The hardest part is keeping the field reassignment straight — `id`, `quote`, `example`, `signal` stay attached to the function; `label` and `voice` are reassigned by position. A small refactor where you write each Q-T's new items array from scratch in the new order is cleaner than trying to rotate fields in place.
- The Latin-square permutation table is the spec. Do not improvise different permutations. The cyclic rotation pattern was chosen for replicability and verifiability; any other valid Latin square would also defeat the gap, but consistency with this spec lets future readers verify the permutation against a known shape.
- If you find yourself touching any file outside `data/questions.ts` and `docs/canon/question-bank-v1.md`, stop and surface in the report. The scope is intentionally narrow.
- Browser smoke is deferred to Jason. Your smoke testing should cover: the new items array order in `data/questions.ts` matches the spec, the canon matches the data, engine aggregation produces unchanged outputs for matched-intent inputs, and TSC + lint clean.
