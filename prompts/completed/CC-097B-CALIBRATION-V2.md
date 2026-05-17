# CC-097B-CALIBRATION-V2

## Objective

Close the remaining 4 PEND assertions from CC-097B-CALIBRATION Phase 1 by:
(1) fixing two systemic extractor bugs discovered during Phase 1 probe,
(2) tuning per-function weights against the post-fix baseline, and
(3) integrating blame-lens → DiSC contribution per canon.

This is a follow-up to CC-097B-CALIBRATION Phase 1 + Daniel anchor (which
landed the agreement-lift rule and Daniel Si compass broadening). All four
PEND assertions from that CC are owned here.

Primary user-visible target: **Daniel's prod render**. Phase 1 + Daniel
anchor deployed but did not lift the ⚠ hedge on his stored session. Per
Phase 1 executor report and 2026-05-17 17:26 prod re-render, his actual
cs-Si score is sitting just below the AGREEMENT_LIFT_INFERRED_SCORE_FLOOR
(60). Phase 1 extractor fixes in this CC are the highest-probability
unblock (trust + distribution extractors zero-firing on his data).

## Read First

- `prompts/completed/CC-097B-CALIBRATION.md` — Phase 1 + Daniel anchor outcome
- `prompts/completed/CC-097B-CROSS-SIGNAL-DRIVER-INFERENCE.md` — scaffolding CC
  with original weight matrix
- `prompts/completed/CC-097-CONFIDENCE-FIX.md` — same-dim mirror confidence calc
- `lib/crossSignalDriverInference.ts` — cross-signal scoring + DiSC + mirror-axis
- `lib/identityEngine.ts:attachCrossSignalDriverInference` — integration site
- `lib/identityEngine.ts:217-227` — actual trust signal_id format (verify
  by grep before changing TRUST_LABEL_BY_SIGNAL)
- `lib/identityEngine.ts` `goalSoulMovement.dashboard` shape — distribution
  extraction path
- `tests/audit/crossSignalDriverInference.audit.ts` — 4 PEND assertions
- `tests/fixtures/cc-097b-synthetic/` — Michele / Kevin / Ashley / Harry synthetics

## Canon constraints (locked — do not negotiate)

- **Thresholds DO NOT change.** `score_floor=60`, `gap_floor=20`,
  `qt_ceiling=40`, `mirror_floor=50` stay as written per
  `feedback_cross_signal_disagreement_thresholds.md`. V2 tunes WEIGHTS,
  not thresholds.
- **All 4 agreement-case fixtures stay `agreement: "agree"` (no regression).**
  Jason / Daniel / Cindy-shape / qp2-Daniel must remain unchanged after
  V2 lands.
- **Document EVERY weight change with rationale per AGENTS.md.** Each
  modification gets a code comment naming the canon source and the
  empirical effect on the cohort fixtures.
- **Zero engine math changes.** No edits to Goal/Soul/Aim/Grip composition,
  scoring, or thresholds.
- **Zero Wave 1 persistence file changes.** `lib/staleShape.ts`,
  `lib/llmRewritesBundle.ts`, `lib/sessionLlmBundleStore.ts`,
  `lib/*LlmServer.ts` untouched.
- **No LLM calls, no cache file edits, no commits, no pushes.** Same
  discipline as Phase 1.

## Scope — Phase 1: Extractor bug fixes (PREREQUISITE)

These two bugs zero-fire ~25-35 scoring points per fixture across the matrix.
**Fix them FIRST** before any weight tuning so the tuning is empirically grounded.

### Item 1a — Trust signal_id format mismatch

`lib/crossSignalDriverInference.ts:TRUST_LABEL_BY_SIGNAL` currently uses keys
like `trust_religious`, `trust_mentor`, etc. The actual engine signal_ids
emitted at `lib/identityEngine.ts:217-227` are `religious_trust_priority`,
`mentor_trust_priority`, etc.

Verify the correct format by grepping `lib/identityEngine.ts` for the
canonical `*_trust_priority` pattern. Update `TRUST_LABEL_BY_SIGNAL` keys
to match exactly. After fix, `extractTrustRegister` should return non-`(none)`
results for every fixture with trust rankings.

**Audit assertion to add:** `extractor-trust-fires-on-cohort` — at least 5 of 8
cohort fixtures produce non-`(none)` trust register output.

### Item 1b — Distribution extraction path

`lib/crossSignalDriverInference.ts:extractDistribution` reads
`dashboard.driveDistribution.bucketScores`. Investigate the actual
`goalSoulMovement.dashboard` shape and map correctly to:
- `building_and_wealth`
- `people_service_society`
- `risk_and_uncertainty`

After fix, `extractDistribution` should return non-zero values matching the
percentages shown in cohort fixture rendered output (e.g., Daniel:
Building 35% / People 35% / Risk 30%).

**Audit assertion to add:** `extractor-distribution-fires-on-cohort` — at
least 5 of 8 cohort fixtures produce non-zero distribution values across
all 3 buckets.

### Item 1c — Re-probe cohort post-fix + Daniel verification gate

Run the diagnostic probe at the bottom of
`crossSignalDriverInference.audit.ts` against all cohort + synthetic
fixtures with the fixed extractors. Log:
- Q-T direct driver
- Cross-signal inferred driver + score
- Score gap to 2nd-place function
- Agreement classification
- DiSC quad

This establishes the empirically-grounded baseline for Phase 2 tuning.

**Daniel-specific verification:** Confirm that post-extractor-fix,
`si-tradition-steward.json` produces cs-Si ≥ 65 with gap ≥ 20. This is the
new minimum for Daniel's actual prod session to clear
`AGREEMENT_LIFT_INFERRED_SCORE_FLOOR=60` given typical synthetic-vs-prod
score variance.

**If cs-Si still doesn't clear 65 after extractor fixes**, document the
actual score in the report. Do NOT soften the threshold in this CC —
flag it for a follow-up CC-097B-CALIBRATION-V3 that decides whether to
tune weights further OR soften AGREEMENT_LIFT_INFERRED_SCORE_FLOOR
(60 → 50) with explicit rationale.

## Scope — Phase 2: Per-function weight tuning

After Phase 1 extractor fixes, three PEND assertions need weight adjustments
to clear thresholds.

### Item 2a — Michele Ne (Class B disagree)

Pre-Phase-1 state: Q-T fe direct, cross-signal ne, gap=10 (needs ≥20).
Cross-signal correctly identifies Ne but doesn't separate cleanly enough
from second-place.

Tune Ne weights upward where empirically supported by Michele's signature:
- Openness=80 ceiling weight
- Conscientiousness=85 high (architecture-seeking)
- Humanist universal-essence keystone (Q-I1 "love whoever they want")
- Freedom in Compass top
- Q-O1 emotional-honesty pull (the Ne tell)

Document each Ne weight increase with a comment citing
`feedback_se_fi_attractor_canon.md` and the cohort fixture it's grounded in.

**Verify:** agreement-case fixtures (Jason/Daniel/Cindy/Harry) still produce
`agreement: "agree"` — Ne weight increases must not flip them to disagree.

**Audit assertion target:** `michele-class-b-disagree-ne-preferred` → PASS
(gap ≥ 20, `cs.inferredDriver = "ne"`, `agreement = "disagree-prefer-cross-signal"`)

### Item 2b — Kevin Fe (Class C disagree)

Pre-Phase-1 state: Q-T se direct, cross-signal fe, gap=5 (needs ≥20).
fe=70, se=65 — too close.

Two-pronged tune:
- **Boost Fe weights** for Kevin's signature: protector register,
  Faith-cluster Compass, very-high Agreeableness (94),
  Religious/Small-Business trust, pastoral Q-I1 keystone.
- **Consider Se exclusion gate:** when Agreeableness > 85 AND no
  physical-engagement signal in Q-A2 ("Building or creating" or
  "Exploring, learning, or wandering"), apply Se score penalty. This is
  the EmbodiedCraft-attractor brake from `feedback_se_fi_attractor_canon.md`.

**Verify:** Cindy's actual ESFP shape still scores Se correctly (her Q-A2
likely lands in physical-engagement, so Se penalty doesn't fire for her).
`fi-quiet-resister` synthetic still scores Fi/Se correctly.

**Audit assertion target:** `kevin-class-c-disagree-fe-preferred` → PASS

### Item 2c — Ashley Ni (Class D mirror-axis)

Pre-Phase-1 state: Q-T se direct, cross-signal se, ni=35 (needs ≥50 to
trigger mirror-axis).

Tune Ni weights upward for Ashley's signature:
- Knowledge + Truth in Compass top (humanist-Ni indicators)
- Openness=80
- Conscientiousness=91 ceiling
- Long-arc-pattern keystone ("People are born good")
- Wide cost surface (5 items willingness)
- Education trust top

Goal: Ni score reaches ≥50 while Se stays ≥50 → `detectMirrorAxis`
returns `{ axis: "se-ni", leading: "se", partner: "ni" }`.

**Verify:** agreement-case Ni-driver fixture (Jason `paralysis-shame`) still
scores Ni cleanly with gap to Se ≥ 20.

**Audit assertion target:** `ashley-class-d-mirror-axis-se-ni` → PASS
(`LensStack.mirrorAxis` populated with `axis="se-ni"`)

## Scope — Phase 3: DiSC rebalance + blame-lens integration

### Item 3a — DiSC weight rebalance

Pre-Phase-1 state: Jason produces C > i > S > D. Target: D > i > C > S.

Root causes (from Phase 1 report):
- D-side `goal_orientation` proxy reads 0 because distribution extractor was
  broken. **Phase 1 Item 1b should fix this.**
- C weight overweights `ocean.conscientiousness` — needs reduction.

After Phase 1 extractor fix, re-probe Jason:
- If D ≥ i ≥ C ≥ S naturally emerges → no rebalance needed
- If D still under i or C → rebalance:
  - Increase D weight from `te_signal_strength`
  - Increase D weight from low-Agreeableness counter (Jason A=89 high
    moderates this; for stronger Te-drivers with A<80, D should land
    higher faster)
  - Decrease C weight from `ocean.conscientiousness` ceiling cases
  - S weight stays low for Ni-driver shapes (correct already)

**Verify:** Harry still produces S > i > C > D after rebalance. Daniel
produces D > C > i > S (Te-driver but Conscientiousness=99 also high).

**Audit assertion target:** `disc-jason-d-i-c-s` → PASS

### Item 3b — Blame-lens → DiSC contribution

Per `feedback_blame_lens_disc_mapping.md` (canonized 2026-05-17), Q-C4
blame-attribution top-1 contributes to DiSC dimensions:

| Q-C4 top-1     | DiSC contribution |
|----------------|-------------------|
| Individual     | +D (strong)       |
| Authority      | +C (some +D)      |
| System         | +C                |
| Nature         | +i (low weight)   |
| Supernatural   | +S                |

Add this contribution to `deriveDisc()`. Document weights as canon-grounded
(15-25 points per dimension is the canon's empirical range).

Cohort validation:
- Jason Q-C4 top=Individual → +D ✓ (consistent with D-highest target)
- Harry Q-C4 top=Supernatural → +S ✓ (consistent with S-highest target)
- Daniel Q-C4 top=Individual → +D ✓ (Te-driver, D high)
- Michele Q-C4 top=System → +C ✓ (C-flavored ENFP)
- Kevin Q-C4 top=Individual → +D, but Fe-driver context partly suppresses
  D via high-A counter (canon-correct)
- Cindy Q-C4 top=Individual → +D, but ESFP caregiver i+S overrides overall
- Ashley Q-C4 top=System → +C (consistent with latent INFJ analytical-Ni)

After integration, re-probe all 6 named cohort users (or the synthetics
that proxy them) to confirm DiSC orderings match the calibration map.

**Audit assertions to add:** `blame-lens-individual-contributes-to-d` and
`blame-lens-supernatural-contributes-to-s` — synthetic probes confirm the
contribution fires correctly.

## Scope — Phase 4: Flip PEND assertions

After Phases 1-3, the 4 PEND assertions should flip to PASS:
- `michele-class-b-disagree-ne-preferred`
- `kevin-class-c-disagree-fe-preferred`
- `ashley-class-d-mirror-axis-se-ni`
- `disc-jason-d-i-c-s`

Plus the 2 new audit assertions from Phase 1 extractor fixes and the 2 new
from blame-lens integration:
- `extractor-trust-fires-on-cohort`
- `extractor-distribution-fires-on-cohort`
- `blame-lens-individual-contributes-to-d`
- `blame-lens-supernatural-contributes-to-s`

**Target final state:** 12 + 4 + 4 = 20 PASS / 0 PEND / 0 FAIL.

## Acceptance criteria

1. `tsc --noEmit` clean
2. lint clean (no new warnings)
3. `audit:cross-signal-driver-inference` → 20/20 PASS (was 12/16 in Phase 1)
4. All 4 PEND assertions from CC-097B-CALIBRATION Phase 1 → PASS
5. 4 new assertions (`extractor-trust`, `extractor-distribution`,
   `blame-lens-individual`, `blame-lens-supernatural`) → PASS
6. Wave 1 audits all pass
7. CC-084 / 085 / 086 / 087 / 089 / 090 / 091 / 092 / 094 audits all pass
8. CC-097-CONFIDENCE-FIX audit passes
9. All 4 agreement-case cohort fixtures still produce `agreement: "agree"`
   (Jason / Daniel / Cindy-shape / qp2-Daniel) — verify via audit
10. Every weight change documented with code comment citing canon source
    and empirical effect on cohort
11. Daniel `si-tradition-steward.json` cohort fixture produces cs-Si ≥ 65
    with gap ≥ 20 post-extractor-fix (Phase 1c verification gate)
12. Zero engine math changes
13. Zero Wave 1 persistence file changes
14. Zero LLM calls
15. Zero cache file modifications
16. Zero commits / pushes — left dirty for review

## Out of scope (defer to later CCs)

- CC-VO-EXTRACTOR / CC-VO-COMPOSER (Victim/Owner axis composer per
  `feedback_victim_owner_axis_gsag.md`) — separate CC, larger architectural
  scope.
- CC-097D function-by-function Lens/Hands prose composer (per
  `feedback_jungian_over_mbti_canon.md` and
  `feedback_si_fe_vs_si_te_prose_canon.md`) — separate CC.
- CC-098 Compass-signature support widening for Trust/Conviction routing.
- Additional cohort fixtures beyond what V2 needs for its assertions.
- AGREEMENT_LIFT_INFERRED_SCORE_FLOOR softening (60 → 50). If V2's
  extractor fixes don't close Daniel's prod render, flag for V3 with
  explicit rationale rather than absorbing the threshold change here.

## Allowed to modify

- `lib/crossSignalDriverInference.ts` (extractor fixes + weight tuning + DiSC)
- `tests/audit/crossSignalDriverInference.audit.ts` (4 PEND → PASS, 4 new asserts)
- `tests/fixtures/cc-097b-synthetic/*.json` (if any synthetic needs adjustment
  to validate tuning — document each change)
- `prompts/active/CC-097B-CALIBRATION-V2.md` → `prompts/completed/`

Nothing else.

## Verification surface (post-push, after deploy)

**Daniel prod render** (referenced 2026-05-17 17:26 baseline — hedge
still present, Trust still Harmony, Hands still generic):
- Confirm Phase 1 + Daniel anchor + V2 extractor fixes together lift the ⚠
  hedge on Daniel's stored session
- Trust → Stewardship, Gravity → Builder, Hands → steward archetype prose
- This is the load-bearing user-visible verification — if it doesn't fire,
  V3 owns the threshold-softening lever

**Cohort sweep:**
- Michele prod render — if she retakes, cross-signal should now flag
  disagree-prefer-ne with hedge prose Variant B
- Kevin prod render — same pattern with disagree-prefer-fe
- Ashley prod render — mirror-axis Variant A hedge prose if she retakes

## Estimated

2-3 hours, $0.

## Notes for executor

- **Phase 1 extractor fixes are the load-bearing prerequisite.** Do them FIRST
  and re-probe BEFORE touching weights. Tuning weights against broken
  extractors will produce wrong tuning that needs to be redone.
- The cohort calibration map at `project_cohort_calibration_2026_05_17.md`
  (referenced in canon but not necessarily in repo memory) shows the target
  DiSC orderings for all 6 cohort users. Jason D>i>C>S and Harry S>i>C>D are
  the two hardest constraints; Michele/Cindy/Kevin DiSC orderings emerge
  naturally from blame-lens + OCEAN integration.
- **Document the empirical effect of each weight change as a code comment.**
  Per `feedback_cc_prompt_guardrails.md`, canon-rooted changes should
  reference their canon memory file by name.
- If any weight change risks regressing an agreement-case fixture, prefer
  not making that change. **Cohort stability > completing every PEND.**
  Flag unresolvable tradeoffs in the report.
- The Daniel verification gate (Phase 1c) is the load-bearing user-visible
  test. If extractor fixes alone push Daniel's cs-Si to ≥65 with gap ≥20,
  V2 is empirically sufficient and the rest of Phase 2/3 is gravy. If they
  don't, document the actual score in the report so V3 can decide between
  further weight tuning OR threshold softening with full empirical context.
