# CC-Q2 — Movement Layer Questions (Q-GS1 + Q-V1 + Q-GRIP1)

**Origin:** `docs/question-bank-additions-spec.md` Bundle 2. Per Clarence's verdict — these three questions close the measurement gaps the architecture was designed to consume: Goal/Soul calibration, Vulnerability/open-hand register, direct Gripping Pull self-report.

**Scope frame:** Add 3 questions, ~21 new signals, cross-cutting consumption (Goal / Soul / Vulnerability / Gripping Pull / Conviction / Compass). Bank: 42 → 45 (assumes CC-Q1 landed first; if not, reverify question count). Largest of the 4 bundles.

**Pre-condition:** CC-Q1 should land first to keep numbering coherent. If firing concurrent or before, just verify final question count is correct.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Three questions cross-cut multiple composites. Implement primary consumers per the spec §3 wiring table; secondary/tertiary may be deferred to CC-RW with documentation. Read `docs/question-bank-additions-spec.md` carefully — Bundle 2 has the verbatim items and signal IDs.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `docs/question-bank-additions-spec.md` — full file. §2 Bundle 2 + §3 wiring + §6 consumption.
2. `data/questions.ts`.
3. `lib/types.ts` — SignalId, GoalSoulGiveOutput, MovementOutput, GrippingPull.
4. `lib/goalSoulGive.ts` — Goal composite, Soul composite, Vulnerability composite, Gripping Pull computation, asymmetric lift math.
5. `lib/goalSoulMovement.ts` — band detector, Soul-lift practice selection (uses Vulnerability + signals).
6. `lib/identityEngine.ts` — signal extractor wiring + buildInnerConstitution.
7. `tests/audit/goalSoulGive.audit.ts`.
8. `prompts/completed/CC-077-…md` — Vulnerability composite weights, asymmetric lift constants.

## Allowed to Modify

1. **`data/questions.ts`** — add Q-GS1, Q-V1, Q-GRIP1 verbatim per spec §2.
2. **`lib/types.ts`** — add ~21 SignalIds: `goal_completion_signal`, `soul_people_signal`, `soul_calling_signal`, `gripping_proof_signal`, `security_freedom_signal`, `creative_truth_signal`, `durable_creation_signal`, `goal_logic_explanation`, `soul_beloved_named`, `vulnerability_open_uncertainty`, `vulnerability_deflection`, `performance_identity`, `sacred_belief_connection`, `grips_control`, `grips_security`, `grips_reputation`, `grips_certainty`, `grips_neededness`, `grips_comfort`, `grips_old_plan`, `grips_approval`. Update SignalId union and SIGNAL_DESCRIPTIONS.
3. **`lib/identityEngine.ts`** OR signal extractor — emit signals from Q-GS1, Q-V1, Q-GRIP1 with rank-aware strength.
4. **`lib/goalSoulGive.ts`** — wire signals into composites:
   - `goal_completion_signal`, `durable_creation_signal` → Goal composite (direct lift)
   - `soul_people_signal`, `soul_calling_signal`, `creative_truth_signal`, `soul_beloved_named` → Soul composite (direct lift)
   - `vulnerability_open_uncertainty`, `sacred_belief_connection` → Vulnerability composite (positive)
   - `vulnerability_deflection`, `performance_identity` → Vulnerability composite (negative)
   - `gripping_proof_signal`, `performance_identity` → Gripping Pull cluster (mild)
   - All Q-GRIP1 `grips_*` signals → Gripping Pull score + signal list (these become PRIMARY direct measurement; the existing cluster check stays as backstop)
   - `security_freedom_signal` → Drive Cost AND Compliance (split 50/50; or just Cost if user's other signals lean cost-coded; CC-author's call documented)
   - `goal_logic_explanation` → Goal composite (mild) + Vulnerability composite (mild suppression — explaining-not-naming)
5. **`lib/goalSoulPatterns.ts`** — verify Defensive Builder and Generative Builder detectors still fire correctly with the new signal inputs. No detector changes; just re-verify.
6. **`tests/fixtures/goal-soul-give/*.json`** — add Q-GS1, Q-V1, Q-GRIP1 answers to existing 13 fixtures; possibly 1-2 new fixtures targeting specific Soul-lift / Vulnerability / Gripping signal profiles.
7. **`tests/audit/goalSoulGive.audit.ts`** — add assertions:
   - All 21 new signals fire from Q-GS1 / Q-V1 / Q-GRIP1 ranking answers correctly.
   - Soul composite lifts when `soul_beloved_named` fires (audit asserts post-Q-V1 fixture's Soul intensity rises vs pre).
   - Vulnerability composite responds correctly to `vulnerability_open_uncertainty` (positive) and `vulnerability_deflection` (negative).
   - Gripping Pull score rises when `grips_*` signals fire and named-signals list contains the corresponding human-readable strings.
   - Existing fixtures' Movement quadrant placements don't unexpectedly shift (regression — small intensity adjustments OK; quadrant flips warrant investigation).

## Out of Scope (Do Not)

1. **Do NOT modify other bundle questions** (Q-O1, Q-O2, Q-3C2, Q-L1).
2. **Do NOT modify `lib/ocean.ts`** beyond what's needed to read Q-GS1/Q-V1 signals if they cross-cut into OCEAN. If `sacred_belief_connection` cross-feeds OCEAN Conscientiousness, defer to CC-RW.
3. **Do NOT modify `lib/drive.ts`** beyond `security_freedom_signal` Drive bucket tag if needed. Q-3C2's Drive integration is CC-Q3's scope.
4. **Do NOT modify the asymmetric lift constants (`goal_lift_factor`, `soul_lift_factor`)**. The CC-077 calibration is canon; new direct signals add inputs to raw_goal/raw_soul, not change the curve.
5. **Do NOT modify the Movement narrative prose templates** (band-aware affirmation, Soul-lift practices). The five canonical practices in `lib/goalSoulMovement.ts` are CC-079 canon.
6. **Do NOT modify `Closing Read` prose templates** in `lib/goalSoulGive.ts`.
7. **Do NOT modify `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo.** Spec drift documented for follow-on CODEX.
8. **Do NOT install dependencies.**
9. **Do NOT touch the Drive case classifier (`computeDriveCase`).** That's CC-Q3's scope when Q-3C2 lands.
10. **Do NOT add Q-Purpose-Building.**

## Acceptance Criteria

1. `data/questions.ts` has 45 question_ids (assuming CC-Q1 landed at 42; otherwise 43).
2. SignalId union extended with 21 new IDs; SIGNAL_DESCRIPTIONS entries match.
3. Signal extractors emit correctly with rank-aware strength.
4. Composite consumption per spec §3 wiring (primary consumers minimum).
5. Soul composite lifts measurably when `soul_beloved_named` fires; verified by fixture audit (pre vs post Q-V1 answer).
6. Vulnerability composite responds correctly: `vulnerability_open_uncertainty` lifts; `vulnerability_deflection` suppresses.
7. Gripping Pull score includes Q-GRIP1 signals as primary direct measurement; named signal list renders the human-readable form (e.g., "Grips control under pressure", "Grips approval", etc.).
8. Existing audit assertions all pass (regression — math fundamentals unchanged; new signals add inputs).
9. New audit assertions pass.
10. `npx tsc --noEmit`, `npm run lint`, `npm run audit:goal-soul-give`, `npm run audit:ocean` all exit 0.
11. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. Summary.
2. Three questions verbatim as added.
3. Per-fixture impact: Soul intensity, Vulnerability composite, Gripping Pull score (and named signals) before vs after.
4. Jason fixture verification: confirm asymmetric lift continues; new direct signals slot in cleanly.
5. Audit pass/fail breakdown.
6. Spec ↔ code drift.
7. Out-of-scope verification.
