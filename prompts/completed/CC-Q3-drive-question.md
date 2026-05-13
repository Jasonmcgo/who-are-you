# CC-Q3 — Drive Expansion (Q-3C2 Revealed Priority)

**Origin:** `docs/question-bank-additions-spec.md` Bundle 3. Per Clarence's verdict — adds revealed-Drive direct measurement to pair with Q-3C1's claimed-Drive ranking. Sharpens the DriveCase classifier (CC-083) by giving both sides direct signal.

**Scope frame:** Add 1 question, 6 new signals, Drive bucket re-tag for revealed_* signals, integration with CC-083 DriveCase. Bank: 45 → 46 (assumes CC-Q1 + CC-Q2 landed). Medium scope.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Q-3C2 mirrors Q-3C1 in structure (ranking, role card, drive-bucket-tagged signals) but reads revealed behavior under crowding. Read `docs/question-bank-additions-spec.md` §2 Bundle 3 + §4 Drive bucket tags + spec §5 tensions.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `docs/question-bank-additions-spec.md` — §2 Bundle 3 + §4 Drive bucket tags + §5 tensions.
2. `data/questions.ts` — Q-3C1 for structural parallel.
3. `lib/types.ts` — SignalId, DriveOutput, DriveCase.
4. `lib/drive.ts` — full file. SIGNAL_DRIVE_TAGS, computeDriveOutput, computeDriveCase, generateDriveProse (CC-083 case-aware version).
5. `prompts/completed/CC-083-…md` — DriveCase classifier and prose composer for context.
6. `tests/audit/goalSoulGive.audit.ts` — Drive-related assertions, esp the inversion-prose checks.

## Allowed to Modify

1. **`data/questions.ts`** — add Q-3C2 verbatim per spec §2 Bundle 3.
2. **`lib/types.ts`** — add 6 SignalIds: `revealed_cost_priority`, `revealed_coverage_priority`, `revealed_compliance_priority`, `revealed_goal_priority`, `revealed_recovery_priority`, `revealed_reputation_priority`. Update SignalId union and SIGNAL_DESCRIPTIONS.
3. **`lib/identityEngine.ts`** OR signal extractor — emit Q-3C2 signals with rank-aware strength.
4. **`lib/drive.ts`** — three changes:
   - Update `SIGNAL_DRIVE_TAGS` per spec §4: `revealed_cost_priority` → Cost; `revealed_coverage_priority` → Coverage; `revealed_compliance_priority` → Compliance; `revealed_goal_priority` → Cost (50%) + Coverage (50%); `revealed_recovery_priority` → Compliance (50%) + Coverage (50%); `revealed_reputation_priority` → Cost (75%) + Compliance (25%).
   - Update `computeDriveDistribution` if needed to incorporate revealed signals weighted appropriately. The revealed signals from Q-3C2 should count alongside the existing 15 question-equivalents — possibly weighted higher since they're direct revealed measurement, not derived.
   - Update `computeDriveCase` classifier to use Q-3C2 revealed ranking as the canonical "revealed" side (replacing or supplementing the inferred-from-distribution version). The classifier compares Q-3C1 (claimed) vs Q-3C2 (revealed) directly when both are answered.
5. **`tests/fixtures/goal-soul-give/*.json`** — add Q-3C2 answers to existing 13 fixtures. The existing `13-drive-inverted-case.json` (Jason-shape) should now have Q-3C2 explicitly answered to test that direct revealed measurement reproduces the inversion case.
6. **`tests/audit/goalSoulGive.audit.ts`** — add assertions:
   - Q-3C2 signals fire correctly.
   - Drive distribution responds to Q-3C2 ranking (revealed signals shift the distribution measurably).
   - DriveCase classifier still fires correct cases on existing fixtures (regression).
   - Specifically: Jason fixture (`13-drive-inverted-case`) still classifies as `inverted-small` AND the prose still names "claimed" + "revealed" + specific bucket pair.
   - When Q-3C2 is skipped/empty, the classifier falls back to inferring revealed from existing 15-signal distribution (backward-compatible).

## Out of Scope (Do Not)

1. **Do NOT modify other bundle questions** (Q-O1, Q-O2, Q-GS1, Q-V1, Q-GRIP1, Q-L1).
2. **Do NOT modify `Q-3C1`** text or items. Claimed Drive measurement is canon-locked.
3. **Do NOT modify the DriveCase prose templates** (CC-083). Templates stay; the new direct measurement just feeds the classifier with cleaner signal.
4. **Do NOT modify `lib/goalSoulGive.ts`, `lib/ocean.ts`, `lib/goalSoulMovement.ts`** beyond what's strictly needed to read Drive composite for cross-references.
5. **Do NOT modify `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo.**
6. **Do NOT install dependencies.**
7. **Do NOT add or modify cross-card patterns.**
8. **Do NOT change DriveCase union values** (aligned / inverted-small / inverted-big / partial-mismatch / balanced / unstated). Q-3C2 supplies cleaner data into the existing classifier; classifier output stays the same shape.

## Acceptance Criteria

1. `data/questions.ts` has 46 question_ids (or 41 if running solo without other bundles; verify final count).
2. SignalId union extended with 6 new IDs; SIGNAL_DESCRIPTIONS entries.
3. SIGNAL_DRIVE_TAGS extended with the 6 new tag entries per spec §4.
4. Q-3C2 signals fire with rank-aware strength.
5. Drive distribution incorporates Q-3C2 revealed signals.
6. DriveCase classifier compares Q-3C1 (claimed) vs Q-3C2 (revealed) directly when both answered; falls back to legacy inference when Q-3C2 is missing.
7. Jason fixture (`13-drive-inverted-case`) still classifies as `inverted-small`; prose still names "claimed" + "revealed" + specific bucket pair.
8. CC-083's case-aware prose (aligned / inverted-small / inverted-big / partial-mismatch / balanced / unstated) all continue to fire correctly with the new direct signal.
9. Existing audit assertions pass (regression).
10. New audit assertions pass.
11. `npx tsc --noEmit`, `npm run lint`, `npm run audit:goal-soul-give`, `npm run audit:ocean` all exit 0.
12. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. Summary.
2. Q-3C2 verbatim.
3. Drive distribution before/after for at least 3 fixtures (specifically the Jason inversion case + an aligned case + a partial-mismatch case).
4. DriveCase classification stability check across all 13 fixtures.
5. Audit pass/fail breakdown.
6. Spec ↔ code drift.
7. Out-of-scope verification.
