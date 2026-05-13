# CODEX-FUNCTION-COVERAGE-AUDIT — Jungian Function Coverage Survey

**Origin:** Per `project_pattern_catalog_function_bias` (memory): "only 3 of 8 cognitive functions consumed by patterns; 5 candidate patterns queued leveraging si/se/ti/fi/fe." This audit measures current state empirically across the 20-fixture cohort and across the pattern catalog itself, so CC-JUNGIAN-COMPLETION can scope precisely. CC-029 (pattern catalog expansion) shipped at some point — the audit verifies what landed and what's still queued.

**Method discipline:** Read-only audit. No code changes. Single deliverable: a coverage report showing per-function consumption in the pattern catalog AND in rendered output across the 20 fixtures.

**Scope frame:** ~30-50 lines of audit code in a new file. ~1 hour executor time. CODEX-scale because it's pure read-and-report, no editorial judgment.

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/functionCoverage.audit.ts` (the new file)
- `git status`, `git diff`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/patternCatalog.ts` (or wherever the cross-card pattern catalog lives — confirm via grep on "Pattern in motion" or "patterns" exports).
2. `lib/identityEngine.ts` — locate where `lens_stack.dominant` and `lens_stack.auxiliary` get computed, to understand which functions the engine identifies vs which it just renders.
3. The 20-fixture cohort — `tests/fixtures/ocean/*.json` and `tests/fixtures/goal-soul-give/*.json` (or wherever fixtures live; grep for `.json` files in `tests/fixtures/`).
4. `lib/cardAssets.ts` — `SHAPE_CARD_QUESTION` map confirms cards exist; not relevant to function coverage but useful for context.
5. The CC-029 prompt (`prompts/completed/CC-029-pattern-catalog-expansion.md`) — read what was scoped vs what shipped.

## Audit Implementation

Create `tests/audit/functionCoverage.audit.ts`. The audit performs three measurements:

### Measurement 1 — Pattern catalog consumption

Read the pattern catalog source. For each of the 8 functions (`Ni`, `Ne`, `Si`, `Se`, `Ti`, `Te`, `Fi`, `Fe`), count:

- How many patterns in the catalog have this function as a trigger condition
- How many patterns reference this function in their prose template

Output as a table:

```
Function | Patterns triggered | Patterns referencing
---------|-------------------|---------------------
Ni       | N                 | N
Ne       | N                 | N
...
```

### Measurement 2 — Rendered output consumption

Run `buildInnerConstitution` against all 20 fixtures. For each fixture, capture the rendered markdown via `renderMirrorAsMarkdown`. For each of the 8 functions, count:

- How many fixtures' rendered output contains the function's plain-English label (e.g., "pattern-reader" for Ni, "possibility-finder" for Ne, "structurer" for Te, "present-tense self" for Se, "inner compass" for Fi, "room-reader" for Fe, "coherence-checker" for Ti, "precedent-checker" for Si)
- Of those, how many appear in cross-card pattern blocks (the "Pattern in motion" sections per CC-PROSE-1A) vs in body card body prose (Lens / Compass / etc.)

Output:

```
Function | Fixtures with label | In Pattern in motion | In body prose only
---------|--------------------|--------------------- |-------------------
Ni       | N / 20             | N                   | N
...
```

### Measurement 3 — Queued candidate patterns

Read the CC-029 prompt and any pattern-catalog-related notes in `prompts/queued/` or `docs/`. List:

- Which 5 candidate patterns from the original `project_pattern_catalog_function_bias` queue ARE present in the current catalog (shipped via CC-029 or later)
- Which are still missing
- Function coverage of each missing pattern

Output as a list with status: SHIPPED / QUEUED / MISSING.

### Final summary

Single sentence per function: "Function X is FULLY consumed / PARTIALLY consumed / MISSING from the pattern catalog and renders in N/20 fixtures."

Identify the gap precisely: which functions need new patterns, which functions are present in body cards but absent from cross-card patterns, which are queued but not shipped.

## Out of Scope (Do Not)

1. **Do NOT modify the pattern catalog.** This audit is read-only.
2. **Do NOT modify any composer, renderer, or React component.** No code changes outside the new audit file.
3. **Do NOT modify fixtures or any test data.**
4. **Do NOT add new patterns.** That's CC-JUNGIAN-COMPLETION's job, gated by this audit's findings.
5. **Do NOT modify other audit files** (`oceanDashboard.audit.ts`, `goalSoulGive.audit.ts`, `proseArchitecture.audit.ts`). Add the new audit as its own file.
6. **Do NOT install dependencies.** Use existing TypeScript primitives.
7. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo.
8. **Do NOT generate prose that interprets the findings.** Report numbers and gaps; let the next CC interpret.

## Acceptance Criteria

1. New file `tests/audit/functionCoverage.audit.ts` created.
2. Audit runs cleanly: `npx tsx tests/audit/functionCoverage.audit.ts` exits 0 and produces a coverage report.
3. Coverage report includes Measurement 1 (pattern catalog consumption per function), Measurement 2 (rendered output consumption per function across 20 fixtures), and Measurement 3 (queued vs shipped candidate patterns).
4. Final summary lists each function's status (FULLY / PARTIALLY / MISSING).
5. `npx tsc --noEmit` exits 0.
6. `npm run lint` exits 0.
7. `git status --short` shows only the new audit file.

## Report Back

1. **Summary** in 3-5 sentences. Name the function coverage gap precisely (e.g., "Si has 0 patterns; Se has 1 pattern referencing it but not as trigger; Ti has 2 patterns; Fi has 0; Fe has 1").
2. **Coverage matrix** — paste the three measurement tables.
3. **Queued vs shipped candidate patterns** — list which of the 5 originally queued patterns shipped and which are still missing.
4. **Recommendation for CC-JUNGIAN-COMPLETION scope** — based on the audit findings, scope the next CC to close exactly the measured gaps. Don't recommend new questions or new measurements; this is pattern-catalog work per `feedback_minimal_questions_maximum_output`.
