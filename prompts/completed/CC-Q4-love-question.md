# CC-Q4 — Love Translation Question (Q-L1)

**Origin:** `docs/question-bank-additions-spec.md` Bundle 4. Per Clarence's verdict — Love Map flavors are currently fully inferred from indirect signals (Q-S2, Q-S3, Q-X4, etc.). Q-L1 adds direct measurement of how the user's love becomes visible to the people closest to them.

**Scope frame:** Add 1 question, 7 new signals, Love Map flavor consumption. Bank: 46 → 47 (assumes CC-Q1, CC-Q2, CC-Q3 landed). Smallest bundle, fires last.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Q-L1 directly anchors Love Map flavors that were previously fully inferred. The seven items map to specific Love flavors (Companion, Builder, Vocal, Guardian, Co-creator, Servant, Co-experiencer) plus their composites. Read `docs/question-bank-additions-spec.md` §2 Bundle 4 + §3 wiring for the love_* signals.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `docs/question-bank-additions-spec.md` — §2 Bundle 4 + §3 wiring + §5 tensions.
2. `data/questions.ts`.
3. `lib/types.ts` — SignalId, LoveMapOutput, LoveFlavorMatch, LoveRegisterMatch.
4. `lib/loveMap.ts` — full file. Existing flavor computation.
5. `tests/audit/goalSoulGive.audit.ts` — Love Map related assertions if any.

## Allowed to Modify

1. **`data/questions.ts`** — add Q-L1 verbatim per spec §2 Bundle 4. Card: `sacred` (Compass-anchored; pairs with Q-S1, Q-S2). Type: `ranking`, top 2 preferred.
2. **`lib/types.ts`** — add 7 SignalIds: `love_presence`, `love_problem_solving`, `love_verbal_expression`, `love_protection`, `love_co_construction`, `love_quiet_sacrifice`, `love_shared_experience`. Update SignalId union and SIGNAL_DESCRIPTIONS.
3. **`lib/identityEngine.ts`** OR signal extractor — emit Q-L1 signals with rank-aware strength (rank 1 = high, rank 2 = moderate, rank 3+ = low).
4. **`lib/loveMap.ts`** — wire signals into Love Map flavors per spec §3 wiring:
   - `love_presence` → Companion flavor
   - `love_problem_solving` → Builder flavor
   - `love_verbal_expression` → Vocal flavor
   - `love_protection` → Guardian flavor
   - `love_co_construction` → Builder + Champion composite
   - `love_quiet_sacrifice` → Servant flavor
   - `love_shared_experience` → Companion + Co-creator composite
   These signals should be PRIMARY direct measurement of love flavors; the existing inferred-from-Q-S2/Q-X4 signals stay as supporting context.
5. **`tests/fixtures/goal-soul-give/*.json`** — add Q-L1 answers to existing fixtures.
6. **`tests/audit/goalSoulGive.audit.ts`** — add assertions:
   - Q-L1 signals fire correctly.
   - Love Map flavors respond to Q-L1 direct signals (e.g., a fixture ranking `love_presence` first should have Companion flavor as primary).
   - When Q-L1 is skipped, Love Map falls back to inferred-only signals (backward-compatible).

## Out of Scope (Do Not)

1. **Do NOT modify other bundle questions.**
2. **Do NOT modify `lib/goalSoulGive.ts`, `lib/ocean.ts`, `lib/drive.ts`** beyond what's strictly needed.
3. **Do NOT modify Love Map render path or prose templates.** Q-L1 just supplies cleaner signal to the existing flavor matcher.
4. **Do NOT modify `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo.**
5. **Do NOT install dependencies.**

## Acceptance Criteria

1. `data/questions.ts` has 47 question_ids (assuming CC-Q1, CC-Q2, CC-Q3 landed at 46).
2. SignalId union extended with 7 new IDs; SIGNAL_DESCRIPTIONS entries.
3. Q-L1 signals fire with rank-aware strength.
4. Love Map flavors consume the new direct signals.
5. Existing fixtures' flavors don't unexpectedly shift (regression — small adjustments OK; flavor flips warrant investigation).
6. New audit assertions pass.
7. `npx tsc --noEmit`, `npm run lint`, `npm run audit:goal-soul-give`, `npm run audit:ocean` all exit 0.
8. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. Summary.
2. Q-L1 verbatim.
3. Per-fixture Love Map flavor before/after.
4. Audit pass/fail breakdown.
5. Spec ↔ code drift.
6. Out-of-scope verification.
