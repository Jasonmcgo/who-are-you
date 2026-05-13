# CC-Q1 — OCEAN Questions (Q-O1 + Q-O2)

**Origin:** `docs/question-bank-additions-spec.md` Bundle 1. Empirically justified per CC-072 audit (Novelty thin in 5/6 fixtures, ER proxyOnly in 6/6).

**Scope frame:** Add 2 questions, 13 new signals, OCEAN-aligned consumption only. Bank: 40 → 42. Smallest of the 4 question bundles; OCEAN architecture (CC-072 / CC-075 / CC-077 / CODEX-078 / CODEX-081) is the most recently calibrated layer.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. Read `docs/question-bank-additions-spec.md` §2 Bundle 1 + §3 wiring table for Q-O1 + Q-O2 signals before authoring. Every signal feeds primary consumer at minimum; secondary/tertiary consumers documented in spec table — implement primary in CC-Q1, defer cross-cutting consumption to CC-RW if scope-demanding.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `docs/question-bank-additions-spec.md` — full file. §2 Bundle 1 has the verbatim question text, items, signal IDs. §3 wiring table for primary consumers. §6 composite consumption checklist.
2. `data/questions.ts` — for question schema (Question type) and existing card_id values.
3. `lib/types.ts` — SignalId union, OceanIntensities, OceanOutput, OpennessSubdimensions.
4. `lib/ocean.ts` — for the existing intensity computation (curve + multiplier per CC-075/077).
5. `lib/oceanDashboard.ts` — for prose composer (no changes here unless ER proxyOnly logic needs adjustment).
6. `tests/audit/oceanDashboard.audit.ts` — for adding fixture-based assertions.

Memory: `feedback_minimal_questions_maximum_output`, `feedback_coherence_over_cleverness`, `project_ocean_disposition_spec`.

## Allowed to Modify

1. **`data/questions.ts`** — add Q-O1 and Q-O2 verbatim per spec §2.
2. **`lib/types.ts`** — add 13 new SignalIds: `openness_intellectual`, `openness_aesthetic`, `openness_perspective`, `openness_experiential`, `openness_emotional`, `low_novelty_preference`, `low_reactivity_focus`, `anxious_reactivity`, `anger_reactivity`, `detached_reactivity`, `overwhelmed_functioning`, `hidden_reactivity`, `avoidant_reactivity`. Update SignalId union.
3. **`lib/identityEngine.ts`** OR equivalent signal extractor — emit signals from Q-O1 and Q-O2 ranking answers. Rank-aware: rank 1 strength = high; rank 2 = moderate; rank 3+ = low. The exact extraction pattern matches existing Q-S, Q-T, Q-Stakes patterns.
4. **`lib/ocean.ts`** — wire new signals into composite consumption:
   - `openness_intellectual` → Intellectual subdim
   - `openness_aesthetic` → Aesthetic subdim
   - `openness_perspective`, `openness_experiential` → Novelty subdim (replaces proxy reads — these are direct novelty signals)
   - `openness_emotional` → Aesthetic subdim (Feelings facet)
   - `low_novelty_preference` → Novelty subdim NEGATIVE
   - All Q-O2 reactivity signals → Emotional Reactivity intensity (NOT proxyOnly; these are direct measurement)
   - When Q-O2 signals fire, set `proxyOnly: false` on `OceanOutput.dispositionSignalMix.intensities.emotionalReactivity`. The proxy-disclosure prose only fires when `proxyOnly === true`.
5. **`tests/fixtures/ocean/*.json`** — add Q-O1 and Q-O2 answers to the 7 existing fixtures (signal-engineered to test the new consumption); maybe 1-2 new fixtures targeting specific subdimension/reactivity profiles.
6. **`tests/audit/oceanDashboard.audit.ts`** — add assertions:
   - Q-O1 signals fire correctly (substring match in extracted-signals list).
   - Q-O2 signals fire correctly.
   - When Q-O2 fires direct ER signals, `proxyOnly === false` and prose does NOT contain the proxy disclosure.
   - When Q-O2 is skipped/empty, `proxyOnly === true` (legacy behavior preserved for missing-data case).
   - Subdimension intensity for `architectural_led` flavor still saturates correctly when both intellectual AND architectural signals fire.

## Out of Scope (Do Not)

1. **Do NOT modify other bundle questions** (Q-GS1, Q-V1, Q-GRIP1, Q-3C2, Q-L1). Those land in CC-Q2/Q3/Q4.
2. **Do NOT modify `lib/goalSoulGive.ts`, `lib/goalSoulMovement.ts`, `lib/drive.ts`, or any non-OCEAN composite.** Cross-bundle consumption (e.g., `openness_emotional` feeding Vulnerability composite as a lift; `openness_perspective` feeding Trust card) is documented but deferred to CC-RW.
3. **Do NOT modify `Closing Read`, `Movement`, `Disposition Signal Mix` prose templates beyond the proxyOnly toggle.** Templates stay; the new signals just feed the existing intensity math.
4. **Do NOT add Drive bucket tags** for these signals. Q-O1 and Q-O2 do not feed Drive distribution.
5. **Do NOT modify `MEMORY.md`, `AGENTS.md`, `docs/canon/`, `docs/goal-soul-give-spec.md`, `docs/ocean-disposition-spec.md`.**
6. **Do NOT add Q-Purpose-Building** or any other question.
7. **Do NOT change OCEAN intensity multipliers (`INTENSITY_K`).** The curve from CC-075 is canon; Q-O1 and Q-O2 add inputs, not change the curve. If audit reveals Jason fixture lands outside [40, 65] for E or [70, 85] for O after the new signals fire, document for CC-RW; do not retune in CC-Q1.
8. **Do NOT install dependencies.**

## Acceptance Criteria

1. `data/questions.ts` has 42 question_ids (verified by `grep -c "question_id:"`). Q-O1 and Q-O2 appear with verbatim text per spec §2 Bundle 1.
2. `lib/types.ts` SignalId union extended with all 13 new IDs.
3. Signal extractors emit Q-O1 / Q-O2 signals with rank-aware strength (rank 1 = high, rank 2 = moderate, rank 3+ = low).
4. `lib/ocean.ts` consumes the new signals into Openness subdimensions and Emotional Reactivity intensity per the §3 wiring table.
5. When Q-O2 fires direct ER signals, `OceanOutput.dispositionSignalMix.proxyOnly === false`. The proxy-disclosure prose ("the safer read is that your emotional reactivity may not be easily visible from the outside, not that the affect-channel itself is absent") does NOT render in this case.
6. When Q-O2 is skipped or has no answers, `proxyOnly === true` and the disclosure prose renders as before. Backward-compatible.
7. All existing OCEAN audit assertions pass (regression — calibration math unchanged; only inputs added).
8. New audit assertions pass for Q-O1 / Q-O2 signal emission and consumption.
9. `npx tsc --noEmit` exits 0.
10. `npm run lint` exits 0.
11. `npm run audit:ocean` exits 0.
12. `npm run audit:goal-soul-give` exits 0 (regression — Goal/Soul unaffected).
13. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. Summary in 4-6 sentences.
2. Q-O1 and Q-O2 verbatim as added to `data/questions.ts`.
3. Per-fixture impact: for each existing OCEAN fixture, report old vs new Openness subdim intensities and Emotional Reactivity intensity (with `proxyOnly` flag).
4. Jason fixture (`07-jason-real-session`) verification: confirm Architectural Openness still saturates; ER `proxyOnly` becomes `false` when Q-O2 fires.
5. Audit pass/fail breakdown.
6. Spec ↔ code drift report (if any).
7. Out-of-scope verification.
