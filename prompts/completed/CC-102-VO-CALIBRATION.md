# CC-102-VO-CALIBRATION

## Objective

Calibrate the Victim/Owner composer (from CC-100-VO-EXTRACTOR-AND-COMPOSER)
against the 7 **real-person calibration anchors** now extracted to
`tests/fixtures/cohort-real/`. CC-100 landed the architecture with
canon weights as-written; CC-100's audit produced a single PEND
(`vo-cohort-register-band-calibration`) because the original cohort
test surface was synthetic shape-pattern diagnostics, not real-person
anchors.

This CC reconciles the gap. Run V/O composer against the 7 real-person
fixtures, verify each lands in its expected register band per canon,
tune composer weights with documented rationale only if any
real-person fixture misses its band, and flip the PEND to PASS.

Per `feedback_cohort_fixtures_two_functions.md`:

> `tests/fixtures/cohort/*` are SHAPE-PATTERN diagnostics
> (synthetic personas). `tests/fixtures/cohort-real/*` are
> REAL-PERSON calibration anchors. Two distinct functions
> previously conflated; V/O composer surfaced the distinction.

## Read First

- `prompts/completed/CC-100-VO-EXTRACTOR-AND-COMPOSER.md` — V/O
  architecture + canon weight table (Item 2b)
- `feedback_victim_owner_axis_gsag.md` — canon (the architecture this
  CC calibrates)
- `feedback_cohort_fixtures_two_functions.md` — real-person vs
  synthetic fixture distinction
- `feedback_cross_signal_disagreement_thresholds.md` — thresholds
  stay locked; tune weights only
- `feedback_gradient_calibration_canon.md` — gradient routing applies
  to V/O scoring
- `feedback_cc_prompt_guardrails.md` — explicit "do not" constraints
- `lib/victimOwnerAxis.ts` — composer module + scoring weights
- `tests/fixtures/cohort-real/*.json` — 7 real-person calibration
  anchors (jason / michele / daniel / cindy / kevin / harry /
  ashley)
- `tests/audit/victimOwnerAxis.audit.ts` — existing audit with PEND
  assertion to flip

## Canon constraints (locked — do not negotiate)

- **Real-person fixtures are the calibration surface.** Do NOT
  re-tune V/O weights against `tests/fixtures/cohort/*` synthetic
  personas. Per `feedback_cohort_fixtures_two_functions.md`,
  paralysis-shame correctly reads victim-leaning and that's CORRECT
  for the synthetic — V/O calibration is about whether the 7
  real-person fixtures land in their lived register bands.
- **Thresholds DO NOT change.** All register-band cutoffs and
  composer-internal floors stay as written in
  `lib/victimOwnerAxis.ts`. V2 tunes WEIGHTS, not thresholds.
- **Synthetic fixtures must continue to land in canon.**
  victim-anchored score=0, owner-anchored score=100. These are the
  architectural floor/ceiling validators — if any weight change
  breaks them, the change is wrong.
- **Document EVERY weight change with rationale per AGENTS.md.**
  Each modification gets a code comment naming the canon source
  (e.g., `feedback_victim_owner_axis_gsag.md` verb register
  table) AND the empirical effect on the real-person cohort
  (e.g., "Cindy 65 → 52 to land in balanced band").
- **Zero engine math changes.** No edits to Grip/Aim/Goal/Soul/
  Movement composition. V/O wiring into engine math remains
  CC-101-VO-WIRING's scope.
- **Zero Wave 1 persistence file changes.** Standard list:
  `lib/staleShape.ts`, `lib/llmRewritesBundle.ts`,
  `lib/sessionLlmBundleStore.ts`, `lib/*LlmServer.ts` untouched.
- **No LLM calls, no cache file edits, no commits, no pushes.**

## Real-person calibration table (the empirical anchors)

Per `feedback_victim_owner_axis_gsag.md` + cohort calibration map at
`project_cohort_calibration_2026_05_17.md`:

| Fixture | Real shape | Expected register | Expected score range | Rationale |
|---|---|---|---|---|
| `jason-real.json` | Ni-Te architect, INTJ | owner-anchored | 75-90 | Wide cost surface, Individual blame, owner verbs in keystone, Knowledge top-2, no hypocrisy |
| `daniel-real.json` | Si-Te steward, ISTJ | owner-leaning | 65-80 | Wide cost surface, Individual blame, high A=82, no victim verbs in "Faith and Family" keystone |
| `harry-real.json` | Si-Fe-Ne-Te non-canonical | owner-leaning | 60-75 | Wide cost surface, Supernatural blame contributes neutrally (faith-as-trust not faith-as-escape), high A=92 |
| `cindy-real.json` | Se-Fi caregiver, ESFP | balanced | 45-60 | Wide cost surface BUT adapts-under-pressure fires, ESFP register softens owner |
| `michele-real.json` | Ne-Fi (ENFP, engine reads as Fe-Ni) | owner-leaning | 55-70 | Narrow cost surface (3 items), System blame (slight victim contribution), humanist keystone with owner verbs |
| `kevin-real.json` | Fe-Si (ESFJ, engine reads Se-Fi) | balanced | 45-60 | High A=94 overrides Individual blame somewhat, Fe-protector fires both owner and victim signals |
| `ashley-real.json` | Ni-Fe latent / Se-Fi surface (INFJ) | owner-leaning | 60-75 | Wide cost surface (5 items "all of the above"), System blame moderate, humanist keystone "people are born good" |

## Scope — Phase 1: Probe + diagnostic report (NO changes yet)

### Item 1a — Run V/O composer against all 7 real-person fixtures

Update `tests/audit/victimOwnerAxis.audit.ts` to load fixtures from
both `tests/fixtures/cohort/` (existing synthetics) AND
`tests/fixtures/cohort-real/` (new real-person anchors).

For each real-person fixture, log:
- `canonical_name` (from fixture metadata)
- V/O `score`
- V/O `register`
- `evidence.verbRegister.owner` and `evidence.verbRegister.victim` counts
- `evidence.blameAttribution` contribution
- `evidence.costBearing` contribution
- `evidence.hypocrisyDrag` contribution
- `evidence.truthRegister` classification
- `evidence.existingVictimSignals` list (the 7 victim-coded signals)
- `evidence.existingOwnerSignals` list
- `rationale` string

This diagnostic table is the empirical baseline for any weight
tuning. **Do not tune anything until the diagnostic is complete and
the gaps between current scores and expected bands are clear.**

### Item 1b — Synthetic fixtures regression check

Re-run V/O composer against the 2 synthetic fixtures
(`tests/fixtures/cc-vo-synthetic/victim-anchored.json` and
`owner-anchored.json`). Confirm: victim=0, owner=100. If either
deviates, STOP — the architecture has drifted and weight tuning
won't help.

## Scope — Phase 2: Empirical weight tuning (only if cohort misses)

After Phase 1's diagnostic, if any of the 7 real-person fixtures
lands OUTSIDE its expected band, tune composer weights to close
the gap.

### Item 2a — Tune ONLY the weights that move the gap

For each missed fixture, identify the smallest weight change that
lands the score in-band without:
- Regressing any other real-person fixture out-of-band
- Breaking the synthetic floor/ceiling (victim=0, owner=100)

Example workflow:
- If `cindy-real` scores 75 but expected 45-60: identify which
  composer components are over-contributing on her signature.
  Adapts-under-pressure register should pull her toward balanced
  but might not be firing. Check whether her `adapts_under_*`
  signals are correctly extracted. If they are, the issue is
  weight magnitudes — tune the ones that fire on her specifically.
- If `kevin-real` scores 30 but expected 45-60: identify which
  components are over-contributing victim. His high-A + Fe-protector
  register should temper victim-pull. Check whether high-A
  counter-weight fires correctly.

Each weight change gets a code comment:

```typescript
// CC-102 weight tune: reduced from 8 to 5 per feedback_victim_owner_axis_gsag.md
// cohort calibration. Pre-tune: cindy-real scored 75 (over band); post-tune: 58
// (in band). No regression on other real-person fixtures.
```

### Item 2b — Stop conditions

Per `feedback_cc_prompt_guardrails.md`, STOP and report if:
- Any single weight change moves another real-person fixture out
  of its band
- Two simultaneous weight changes are needed for one fixture (likely
  composer-architecture issue, not calibration)
- A real-person fixture's lived register and the canon-expected
  register conflict in a way that suggests the canon expected band
  itself is wrong (e.g., Kevin actually reads owner-anchored not
  balanced — flag for canon review, don't tune to force the band)
- Synthetic floor/ceiling breaks (victim=0 or owner=100 deviates)

Don't tune blindly to pass the assertions. Surface unresolvable
tradeoffs in the report.

### Item 2c — Audit assertion updates

After tuning, update `tests/audit/victimOwnerAxis.audit.ts`:

- Flip `vo-cohort-register-band-calibration` from PEND to PASS,
  retargeted at the 7 real-person fixtures (NOT the synthetic cohort)
- Add 7 individual band-check assertions:
  - `vo-jason-real-owner-anchored` (score 75-90)
  - `vo-daniel-real-owner-leaning` (score 65-80)
  - `vo-harry-real-owner-leaning` (score 60-75)
  - `vo-cindy-real-balanced` (score 45-60)
  - `vo-michele-real-owner-leaning` (score 55-70)
  - `vo-kevin-real-balanced` (score 45-60)
  - `vo-ashley-real-owner-leaning` (score 60-75)
- Preserve all 9 existing PASS assertions from CC-100 (synthetic
  floor/ceiling, populated fields, rationale string, etc.)

Target final state: 9 (CC-100 existing PASS) + 7 (new band checks)
+ 1 (cohort-register-band-calibration, flipped) = 17 PASS / 0 PEND
/ 0 FAIL.

## Acceptance criteria

1. `npx tsc --noEmit` clean
2. lint clean (no new warnings)
3. `audit:victim-owner-axis` exits 0 with 17/17 PASS (was 9 PASS
   + 1 PEND post-CC-100)
4. Wave 1 audits all pass
5. CC-084 through CC-100 audits all pass
6. CC-100's synthetic fixtures still land at score=0 (victim) /
   score=100 (owner) — architecture floor/ceiling preserved
7. All 7 real-person fixtures land in their expected register bands
8. Every weight change documented with code comment citing canon
   source AND empirical effect on cohort
9. Zero engine math changes — Grip/Aim/Goal/Soul/Movement scores
   byte-identical for all cohort fixtures pre- and post-CC
10. Zero Wave 1 persistence file changes
11. Zero LLM calls
12. Zero cache file modifications
13. Zero commits / pushes — left dirty for review

## Out of scope (defer to later CCs)

- **CC-101-VO-WIRING.** Engine math integration (V/O score feeds
  Grip + Aim + Movement gating) remains a separate CC. Fire only
  after CC-102-VO-CALIBRATION lands and the 7 real-person fixtures
  are validated.
- **"hope" / "can't" verb disambiguation refinement.** Layer 1 verb
  extraction uses regex defaults from CC-100. Context-sensitive
  refinement is a future CC-VO-VERB-DISAMBIGUATION if Phase 1
  diagnostic surfaces false positives.
- **Jason DiSC strict D>i>C>S PEND from CC-097B-CALIBRATION.**
  Could be re-tested against `jason-real.json` now (was previously
  testable only against `paralysis-shame-without-project` synthetic).
  Bonus item — if Phase 1 diagnostic naturally surfaces it,
  document the new DiSC reading; if it requires additional weight
  tuning, defer to a separate small CC-097B-CALIBRATION-V3.
- **Additional cohort-real fixtures.** 7 is the current set. Don't
  build more in this CC.
- **Prose surfacing of V/O axis.** Still data-only.

## Allowed to modify

- `lib/victimOwnerAxis.ts` — composer weight tuning ONLY (no
  threshold changes, no new components, no removed components)
- `tests/audit/victimOwnerAxis.audit.ts` — fixture loading update
  (load from cohort-real/), flip PEND, add 7 band-check assertions
- `prompts/active/CC-102-VO-CALIBRATION.md` →
  `prompts/completed/`

Nothing else.

## Estimated

30-45 min (per `feedback_cc_executor_time_estimates_5x_too_high.md`
calibration: scaffolding CCs ~15-30 min, calibration CCs ~30-45 min).

## Notes for executor

- **Phase 1 diagnostic is the load-bearing prerequisite.** Don't
  skip to weight tuning. The diagnostic table tells you which
  components are over- or under-contributing per fixture. Tuning
  without the table is blind.
- **Real-person fixtures are the calibration surface.** The 7
  synthetic personas in `tests/fixtures/cohort/` keep their
  edge-case-testing job. Don't conflate the two.
- **Cohort stability > completing every band.** Per the V/O
  composer's STOP rule from CC-100, if a fixture's lived register
  and canon-expected register conflict in a way that suggests the
  canon needs revision, flag it. Don't force the band by tuning
  weights that distort the composer's empirical fidelity.
- **The Jason DiSC PEND from CC-097B-CALIBRATION is a bonus item,
  not a deliverable.** If Phase 1 diagnostic happens to surface
  it (e.g., `jason-real.json` produces D>i>C>S naturally), document
  the result for a future CC-097B-CALIBRATION-V3 to flip the
  assertion. Don't tune DiSC weights in this CC — out of scope.
- Per `feedback_cc_prompt_guardrails.md`: when in doubt, document
  the gap explicitly rather than fabricating a fix. The V/O axis
  is GSAG-spine architecture — getting it empirically right matters
  more than getting it complete in one CC.
