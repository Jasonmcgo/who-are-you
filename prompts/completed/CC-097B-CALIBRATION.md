# CC-097B-CALIBRATION — Empirical Weight Tuning + Agreement-Lift Rule

## Objective

Post-deploy verification 2026-05-17 (commit `ec366e7`) confirmed CC-097B's scaffolding is architecturally correct but lands 6 PEND assertions per Option 2 scope. This follow-up CC closes the PEND assertions via four targeted changes:

1. **NEW: Agreement-supports-confidence-lift rule.** Highest-leverage fix. Daniel's prod render is the canonical case — Q-T direct read says Si (correct), cross-signal says Si (correct), but Q-T-internal Si-Se tightness flagged `confidence: "low"` and the cascade didn't fire (hedge persists, picker reorder skipped, Trust → Harmony instead of Stewardship, Hands → unmapped). The architecture has all the evidence to lift confidence; the policy just doesn't yet do so. Add an explicit rule: when Q-T direct and cross-signal AGREE strongly on the dominant function, that agreement should override Q-T-internal same-dim-mirror ambiguity.
2. **Scoring weight tuning** so Michele (Class B Ne-Fi) and Kevin (Class C Fe-Si) synthetic fixtures cross the DISAGREE thresholds (`score_floor: 60`, `gap_floor: 20`, `qt_ceiling: 40`). Adjust per-function scoring weights with **documented rationale** per change — do NOT lower the thresholds themselves (per `feedback_cross_signal_disagreement_thresholds.md`).
3. **Ashley mirror-axis score-floor tuning** so the Ni score crosses the `MIRROR_AXIS_FLOOR: 50` while preserving Se score ≥ 50.
4. **DiSC weight rebalance** so Jason's derivation produces `D > i > C > S` (lived ordering) instead of current `C > i > S > D`.
5. **Harry Si-Fe-Ne-Te fixture** added so the non-canonical-stack agreement assertion has a regression anchor.

Per Jason canon 2026-05-17 (`feedback_cross_signal_disagreement_thresholds.md`): **tune the WEIGHTS, not the thresholds.** Per `feedback_mbti_as_litmus_canon.md`: cohort is the validation surface — each weight adjustment must produce the expected driver routing per fixture.

## Sequencing

- Fires AFTER CC-097A + CC-097-CONFIDENCE-FIX + CC-097B (all landed in commit `ec366e7`).
- Independent of CC-097C / CC-097D (mirror-axis output integration + Lens prose composer follow on).
- Independent of CC-098 (card routing widening).

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Four-phase pass:

1. **Phase 1 — Agreement-lift rule.** Add to the cross-signal post-process integration in `lib/jungianStack.ts` (after the cross-signal inference runs at end of `aggregateLensStack()`). New rule fires BEFORE the existing agree/disagree/mirror-axis branching. Pre-flip confidence to "high" when conditions met.
2. **Phase 2 — Scoring weight tuning.** Adjust per-function weights in `lib/crossSignalDriverInference.ts` so Michele's `ne_score` crosses `gap_floor: 20` over `fe_score`; Kevin's `fe_score` crosses `gap_floor: 20` over `se_score`. Document each weight change with rationale.
3. **Phase 3 — Mirror-axis tuning.** Either tune Ashley's synthetic fixture signals OR tune Ni-scoring weights so Ashley's `ni_score` reaches ≥ 50 with `se_score` also ≥ 50. Document approach.
4. **Phase 4 — DiSC weight rebalance + Harry fixture.** Rebalance DiSC derivation weights so Jason produces `D > i > C > S` and Harry produces `S > i > C > D`. Add `harry-si-fe-ne-te.json` synthetic fixture.

Single executor pass. All four phases.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`
- `npx tsx scripts/<diagnostic>.ts`

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `lib/crossSignalDriverInference.ts` — the cross-signal scoring module shipped in CC-097B. Note the 8-function scoring weights + DiSC derivation + agreement classifier with thresholds.
2. `lib/jungianStack.ts` — where the cross-signal inference is integrated post-`aggregateLensStack()`. The agreement-lift rule lands here.
3. `lib/types.ts` — `LensStack` schema (already has `crossSignalAgreement` / `crossSignalInferredDriver` / `mirrorAxis` fields per CC-097B).
4. `tests/fixtures/cc-097b-synthetic/michele-ne-fi-class-b.json` — Class B target. Score gap=10 < threshold 20; needs gap ≥ 20.
5. `tests/fixtures/cc-097b-synthetic/kevin-fe-si-class-c.json` — Class C target. Score gap=5 < threshold 20.
6. `tests/fixtures/cc-097b-synthetic/ashley-mirror-axis-se-ni.json` — Class D target. ni=35 < mirror-axis floor 50.
7. `tests/audit/crossSignalDriverInference.audit.ts` — 14 assertions, 6 PEND. The PEND list names exactly what this CC needs to flip to PASS.
8. `feedback_cross_signal_disagreement_thresholds.md` — **CANON: tune weights, not thresholds.**
9. `feedback_se_fi_attractor_canon.md` — four-class taxonomy + canonical weight anchors.
10. `feedback_jungian_over_mbti_canon.md` — non-canonical stack support (Harry).
11. `feedback_mbti_as_litmus_canon.md` — cohort = validation surface.
12. `project_cohort_calibration_2026_05_17.md` — empirical cohort data (Compass + OCEAN + keystone + Distribution per user). Use as gold-standard for weight tuning.
13. **Daniel's prod render diagnostic (2026-05-17 12:54):** Lens reads Si-Te correctly, BUT `confidence: "low"` due to Q-T Si-Se tightness. Cross-signal cleanly says Si (Compass Faith+Honor+Family+Loyalty + Trust Religious+Small Business+mentor + OCEAN C99 A82 + keystone "Faith and Family" + Distribution balanced). Cross-signal agreement should lift confidence; doesn't yet. Phase 1 fixes this.

## Scope

### Phase 1 — Agreement-supports-confidence-lift rule

In `lib/jungianStack.ts`, find the cross-signal post-process block at the end of `aggregateLensStack()` (added by CC-097B). The three existing branches are `agree` / `mirror-axis` / `disagree-prefer-cross-signal`. Currently the `agree` branch leaves confidence as-set by the upstream same-dim-mirror check.

Add a NEW pre-flip step BEFORE the existing branching:

```typescript
// CC-097B-CALIBRATION: agreement-supports-confidence-lift
// When Q-T direct and cross-signal both confidently point to the same
// driver, that converged signal should override Q-T-internal same-dim
// mirror ambiguity. Daniel's case: Q-T detects Si-Te correctly but Q-T
// ranks Si and Se tightly (he's a hands-on operational steward), so
// CC-097-CONFIDENCE-FIX's same-dim mirror check flags low. Cross-signal
// cleanly confirms Si (Compass + Trust + OCEAN + keystone all consistent).
// Two layers agreeing should lift confidence to high.
//
// Rule: lift confidence to "high" when
//   - cross-signal inferred-driver matches Q-T direct dominant
//   - cross-signal inferred-driver score >= 60
//   - cross-signal score gap to second-best >= 15 (slightly relaxed from
//     disagree threshold of 20 because we're CONFIRMING Q-T, not overriding)
//
const AGREEMENT_LIFT_INFERRED_SCORE_FLOOR = 60;
const AGREEMENT_LIFT_GAP_FLOOR = 15;

if (
  qtDirectStack.confidence === "low" &&
  crossSignal.inferredDriver === qtDirectStack.dominant &&
  crossSignal.inferredDriverScore >= AGREEMENT_LIFT_INFERRED_SCORE_FLOOR &&
  crossSignal.scoreGap >= AGREEMENT_LIFT_GAP_FLOOR
) {
  qtDirectStack.confidence = "high";
  // Note: leaving downstream agree/disagree/mirror-axis classification
  // intact — the lift only changes the confidence value.
}

// ... existing agree/mirror-axis/disagree branching ...
```

This rule fires BEFORE the existing branching. Once confidence is lifted, the existing `agree` branch sets `crossSignalAgreement = "agree"` as before. Downstream consumers (CC-089 hedge cascade, picker reorder, Hands archetype routing) now see `confidence: "high"` and fire normally.

### Phase 2 — Scoring weight tuning for Class B / C

**Michele Class B (Ne-Fi, Q-T misreads Fe-Ni):**

Current state: cross-signal `inferredDriver: "ne"` correctly identified, but `scoreGap: 10` < threshold 20. Goal: gap ≥ 20.

Investigate which Ne scoring weights underweight her signals. Likely candidates:
- Compass-Freedom presence (currently +25; could increase if Michele's signature needs it)
- Keystone register "individual-conscience-autonomy" or "humanist-universal-essence" (currently +25 / +20 for Ne)
- Distribution risk-share ≥ 0.30 (currently +10)

Tune weights such that:
- `ne_score >= 60` for Michele
- `ne_score - second_best_score >= 20`
- Existing agreement-case fixtures (Jason/Daniel/Cindy/Harry) STILL produce agreement (no regression)

**Kevin Class C (Fe-Si, Q-T misreads Se-Fi):**

Current state: cross-signal `inferredDriver: "fe"` correctly identified, but `scoreGap: 5` < threshold 20.

Investigate which Fe scoring weights underweight his signals. Likely candidates:
- Compass-Family-and-protective cluster (currently +25)
- OCEAN A high + moral-concern-dominant (currently +20)
- Work-map Pastoral/Counselor OR Embodied Craft (currently +15)
- Sub-register relational/protective (currently +15)

Tune weights similarly. Document each adjustment.

**Constraint:** ALL agreement-case fixtures (Jason/Daniel/Cindy/Harry/4 existing cohort steward shapes) must STILL classify as "agree" after tuning. Run regression check; if any flip to "disagree-prefer-cross-signal" wrongly, the weight change is too aggressive.

### Phase 3 — Mirror-axis floor tuning for Ashley

Ashley synthetic fixture (Class D Se↔Ni mirror axis): se=50, ni=35.

Two options:

**Option A — Tune Ni scoring weights** so Ashley's `ni_score` reaches ≥ 50.
**Option B — Adjust Ashley's synthetic fixture signals** so existing Ni weights produce ≥ 50 from her signal set.

Recommended: **Option A.** The synthetic fixture should reflect a real INFJ-latent + ESFP-surface signal pattern (her actual lived shape). Tuning the fixture to "fit" the weights is the wrong direction; tuning the weights to detect the real signature is the right direction. The Ni weights probably under-detect humanist-universal-essence + long-arc-pattern signals — common to INFJ-latent users.

Likely Ni weights to revisit:
- Compass-Knowledge / Compass-Truth (currently +25 / +20 for Ni)
- Keystone register "long-arc-pattern-bearing" (+15) — likely also "humanist-universal-essence" deserves a Ni hit, not just Ne
- OCEAN O>=75 + C>=90 paired (+10) — the INFJ architecture-seeking signature
- Work-map Strategic/Architectural (currently +5)

Adjust until `ni_score >= 50` for Ashley while preserving:
- `se_score >= 50` (still mirror-axis qualifying)
- Jason (Ni-Te) still reads Ni first with cohort regression intact

### Phase 4 — DiSC weight rebalance + Harry fixture

**DiSC Jason regression (currently C > i > S > D; target D > i > C > S):**

The DiSC derivation in `lib/crossSignalDriverInference.ts` over-weights Conscientiousness for Jason. Adjust weights so:
- D: more heavily weights `te_signal_strength` + low-Agreeableness; less weight on `goal_orientation` if it's a Conscientiousness proxy
- i: balanced as-is (Jason's i=second is correct)
- C: less weight on `ocean.conscientiousness` for the D-vs-C ordering; OR add a counter-balance from D-side
- S: stays low (Jason's S=very low is correct)

Constraint: Harry (Si-Fe-Ne-Te) must produce `S > i > C > D` after rebalance. Add Harry fixture to validate this.

**Harry fixture:**

Add `tests/fixtures/cc-097b-synthetic/harry-si-fe-ne-te.json` with Harry's calibrated signal pattern:
- Compass: Faith + Truth + Family + Loyalty
- Trust: Religious + Small Business + outside-expert
- OCEAN: O54 C98 E62 A92 N80 (per Harry's prod render)
- Keystone: belief-held-close-tradition-anchored ("My faith in God")
- Distribution: Building 21% / People 43% / Risk 36%
- Sub-register: stewardship
- Q-T signal pattern: Si dominant, Fe auxiliary, Ne tertiary, Te inferior (non-canonical stack)

### Phase 5 — Audit updates

Flip the 6 PEND assertions in `tests/audit/crossSignalDriverInference.audit.ts`:

1. `harry-non-canonical-si-fe-agreement` — Harry fixture loaded, `inferredDriver: "si"`, `agreement: "agree"`, score gap ≥ 10
2. `michele-class-b-disagree-ne-preferred` — `inferredDriver: "ne"`, `agreement: "disagree-prefer-cross-signal"`, score gap ≥ 20
3. `kevin-class-c-disagree-fe-preferred` — `inferredDriver: "fe"`, `agreement: "disagree-prefer-cross-signal"`, score gap ≥ 20
4. `ashley-class-d-mirror-axis-se-ni` — `ni_score >= 50`, `se_score >= 50`, `agreement: "mirror-axis"`, axisName `"SE-NI"`
5. `disc-jason-d-i-c-s` — DiSC for Jason: D > i > C > S
6. `disc-harry-s-i-c-d` — DiSC for Harry: S > i > C > D

Add a new NEW assertion for the agreement-lift rule:

7. `daniel-class-a-agreement-lift` — Synthetic Daniel-like fixture with Si-Se tight Q-T (Si=1.0, Se=1.45, just within MBTI_TIE_MARGIN) PLUS clean Si cross-signal (Compass + Trust + OCEAN as in Daniel's cohort calibration). Pre-CC: confidence="low". Post-CC: confidence="high", agreement="agree". This locks the Daniel-class fix.

Total expected: 8 PASS (from CC-097B) + 7 new PASS = 14/14 + 1 new = 15/15. Confirm in report.

### Phase 6 — Regression sweep

After Phases 1-5:
- All 4 existing-agreement cohort fixtures (Jason/Daniel/Cindy/Harry/named cohort fixtures) STILL produce `agreement: "agree"`. No regression.
- CC-097B's 8 originally-passing assertions still PASS.
- The 6 PEND assertions flip to PASS (new total 14/14 in `crossSignalDriverInference.audit.ts`).
- New `daniel-class-a-agreement-lift` assertion PASS (15/15 total).
- Wave 1 + CC-084 through CC-094 + CC-097A + CC-097-CONFIDENCE-FIX + CC-097B audits all pass.
- twoTier baseline drift: **expected for synthetic Michele/Kevin/Ashley fixtures** (they now produce different prose variants). Synthetic fixtures live in `tests/fixtures/cc-097b-synthetic/` outside the cohort baseline directory per CC-097B canon, so cohort twoTier baseline should NOT drift. Document.
- For Daniel's PROD session: post-deploy, his next render should produce `confidence: "high"`, hedge gone, picker reorder fires, Trust → Stewardship, Hands → steward archetype. (User-facing verification surface; not part of this CC's audit.)

## Do NOT

- **Do NOT lower the disagree-classifier thresholds** (`DISAGREE_INFERRED_SCORE_FLOOR=60`, `DISAGREE_GAP_FLOOR=20`, `DISAGREE_QT_DRIVER_CEILING=40`). Per `feedback_cross_signal_disagreement_thresholds.md`, those are load-bearing for cohort stability. Tune the WEIGHTS so synthetics cross them.
- **Do NOT lower the mirror-axis floor of 50**. Tune Ni weights to detect Ashley's signature.
- **Do NOT regress any agreement-case cohort fixture.** Jason/Daniel/Cindy/Harry/4 existing cohort fixtures must all stay in `agreement: "agree"` after weight tuning.
- **Do NOT mutate the existing `dominant`/`auxiliary`/`tertiary`/`inferior` fields** based on cross-signal. Cross-signal only adds parallel output + the new agreement-lift to confidence value.
- **Do NOT change CC-089's hedge cascade logic.** The agreement-lift rule flips confidence value; hedge cascade downstream picks up the new value naturally.
- **Do NOT touch CC-097A's Q-T item wording.** Forward-only improvement; not in scope.
- **Do NOT touch card routing** (Compass, Trust, Conviction, Gravity, Hands gift-category selection). CC-098 owns that.
- **Do NOT touch Lens prose composition** for non-canonical stacks. CC-097D owns that.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json`**. Document drift; CC-088 owns refreshes.
- **Do NOT call any LLM.**
- **Do NOT commit or push.**

## Allowed to Modify

- `lib/jungianStack.ts` — add agreement-lift rule pre-flip BEFORE existing cross-signal branching
- `lib/crossSignalDriverInference.ts` — scoring weight adjustments per Phase 2/3/4
- `tests/fixtures/cc-097b-synthetic/harry-si-fe-ne-te.json` (new — Harry calibration anchor)
- `tests/fixtures/cc-097b-synthetic/michele-ne-fi-class-b.json` (optional — only if Michele's fixture signals need slight realism adjustment alongside weight tuning; prefer weight-tuning-first)
- `tests/fixtures/cc-097b-synthetic/kevin-fe-si-class-c.json` (optional — same)
- `tests/fixtures/cc-097b-synthetic/ashley-mirror-axis-se-ni.json` (optional — Phase 3 recommended Option A is weight tuning, not fixture editing)
- `tests/audit/crossSignalDriverInference.audit.ts` — flip 6 PEND to PASS; add new daniel-class-a-agreement-lift assertion
- `package.json` — no new scripts needed (existing `audit:cross-signal-driver-inference` script picks up new assertions)
- Move prompt to `prompts/completed/` at end

## Out of Scope

- CC-097D Lens prose composer for non-canonical stacks (Harry's prose-flavor mismatch — separate CC)
- Card routing widening (CC-098)
- CC-097A Q-T item rewords (already landed)
- Mirror-axis output schema beyond Class D synthetic detection (CC-097C covers integration with prose layer)
- Engine math (Goal / Soul / Aim / Grip)
- LLM rewrite layer
- DB schema changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes (no new warnings introduced)
3. `npx tsx tests/audit/crossSignalDriverInference.audit.ts` passes **15/15** (8 original + 6 flipped-from-PEND + 1 new daniel-class-a-agreement-lift)
4. Wave 1 audits still pass
5. CC-084 through CC-094 + CC-097A + CC-097-CONFIDENCE-FIX + CC-097B audits still pass
6. Agreement-lift rule fires for Daniel-class synthetic (Si-Se tight Q-T + clean Si cross-signal → confidence lifts to "high")
7. Michele synthetic produces `inferredDriver: "ne"` + `agreement: "disagree-prefer-cross-signal"` with score gap ≥ 20
8. Kevin synthetic produces `inferredDriver: "fe"` + `agreement: "disagree-prefer-cross-signal"` with score gap ≥ 20
9. Ashley synthetic produces `mirrorAxis` with both `ni_score >= 50` and `se_score >= 50`
10. Jason DiSC ordering: D > i > C > S
11. Harry DiSC ordering: S > i > C > D
12. Harry Si-Fe-Ne-Te fixture loads and routes correctly (`inferredDriver: "si"`, `agreement: "agree"`)
13. Disagree thresholds and mirror-axis floor UNCHANGED (`DISAGREE_INFERRED_SCORE_FLOOR=60`, `DISAGREE_GAP_FLOOR=20`, `DISAGREE_QT_DRIVER_CEILING=40`, `MIRROR_AXIS_FLOOR=50`)
14. Existing agreement-case cohort fixtures (Jason/Daniel/Cindy/Harry/4 cohort) all still produce `agreement: "agree"`
15. Zero engine math changes
16. Zero card routing changes
17. Zero Wave 1 persistence file changes
18. Zero LLM calls
19. Zero cache file modifications
20. Zero baseline snapshot regenerations
21. Zero commits

## Report Back

- Agreement-lift rule implementation (Phase 1): code snippet, constants chosen (`AGREEMENT_LIFT_INFERRED_SCORE_FLOOR`, `AGREEMENT_LIFT_GAP_FLOOR`)
- Per-function scoring weight changes (Phase 2/3): every weight adjustment with rationale ("Raised Ne Compass-Freedom weight from 25 to 30 because Michele's Freedom signal needs higher representation to clear the 60 floor")
- DiSC weight changes (Phase 4): before/after weights with rationale
- Harry fixture: full signal composition for record
- Per fixture: pre-CC scores vs post-CC scores for the affected metrics
- Audit results: 15/15 expected
- Cohort regression: 4 named cohort fixtures (Jason/Daniel/Cindy/Harry-named-cohort) still `agreement: "agree"`
- twoTier baseline drift documentation
- Any deviation from Allowed-to-Modify list

## Notes for executor

- Estimated time: 1-2 hours (mostly empirical iteration; Phase 1 is ~20 lines)
- Cost: $0 (no LLM)
- **Iterate weight by weight with regression check.** Phase 2/3/4 are empirical — change one weight, run cohort, verify all 4 agreement-case fixtures still pass, check the target synthetic now crosses its threshold. If a weight change regresses a cohort case, back it out and try another weight.
- **Weight changes need rationale.** Per `AGENTS.md`, apply canon-faithful interpretation. Document every weight adjustment with a one-line rationale (which fixture's signal motivates the change, why this weight rather than another).
- **The agreement-lift rule (Phase 1) is the highest-leverage piece.** Land it first; verify Daniel-class case lifts; then proceed to scoring tuning. Phase 1 alone closes the most user-visible cohort gap from today's deploy.
- For Daniel's PROD session post-deploy: after this CC lands and ships, Daniel's render should show hedge gone + picker reorder fires + Trust → Stewardship + Hands archetype-specific. That's the user-facing verification surface; not the audit, but the proof.
- Per `feedback_jungian_over_mbti_canon.md`: Harry's Si-Fe-Ne-Te stack is non-MBTI; the fixture should reflect a quiet-pillar register (S+i high in DiSC; warm + tradition-anchored).
- Per `feedback_mbti_as_litmus_canon.md`: cohort is validation surface. Weight tuning is canon-faithful when it makes the cohort's known shapes route correctly. If a weight change makes a fixture route incorrectly per Jason's lived knowledge, the change is wrong even if it makes synthetic assertions pass.
- Flag any deviation from Allowed-to-Modify list per `AGENTS.md`.
