# CC-105-CHART-GEOMETRY-AND-SOUL-SYMMETRY

> Hot-fix authored 2026-05-18 Cowork-chat.
> Bundles two coupled corrections:
> 1. CC-103-CHART-MIDPOINT-RECALIBRATION misinterpreted canon — line
>    origin should be score (0,0), not midpoint; Grip arc inscribes
>    the SW box at radius 50 in score space.
> 2. Soul scoring has been saturating at 100 for 4 of 7 cohort
>    fixtures — Soul direct bonuses (~29 max) exceed Goal direct
>    bonuses (~14 max), destroying discrimination at the top of the
>    cohort.
>
> Coupled because Soul appears on the chart Y axis; fixing chart
> geometry without fixing Soul saturation means Cindy / Daniel / Harry
> / Kevin all render at the top of the chart even though they vary in
> lived Soul. Both ship together.

## Why this CC exists

**Chart geometry (Phase 1):**
CC-103 shipped 2026-05-18 with the trajectory line anchored at score
midpoint (50,50). Low-Movement users see a tiny line near midpoint and
read it as "I'm partway there," when the correct read is "I haven't
reached the canonical baseline." The fix is a radial model: line
originates at score (0,0), length = Movement-scaled distance to
(Goal, Soul), Grip arc inscribes the SW box at radius 50.

**Soul symmetry (Phase 2):**
Soul base weights sum to 100 (same as Goal). But Soul direct bonuses
have ~29 points of headroom while Goal has only ~14. A single answer
(`soul_beloved_named` top-1) adds +10 to Soul; no Goal direct bonus
exceeds +6. Result: cohort fixtures regularly saturate Soul above 100
raw, get capped to 100, and lose discrimination at the top of the
cohort. Currently 4 of 7 cohort users score Soul exactly 100. Fix:
trim Soul direct bonuses by ~50% to match Goal's bonus headroom.

## Phase 1 — Chart Radial Geometry

**Chart shape:** 100×100 square, Goal on X axis, Soul on Y axis.
Unchanged.

**Trajectory line (solid, Usable):**
- Origin: score (0, 0), bottom-left corner.
- Direction: trajectory angle θ = atan2(Soul, Goal), radians.
- Endpoint in score space: `(Goal × usable/potential, Soul × usable/
  potential)` — the user's (Goal, Soul) point pulled back along the
  same trajectory direction by the Grip-drag ratio.

**Potential line (faint):**
- Same origin and angle.
- Endpoint in score space: `(Goal, Soul)` — the user's actual scored
  position.
- When Grip drag is present, this line extends beyond the Usable
  endpoint.

**Grip drag marker (red arrow):**
- Tail anchored at Usable endpoint.
- Points back along the trajectory toward origin.
- Arrow length proportional to `(Potential − Usable)` distance.

**Grip threshold arc (NEW):**
- Quarter-circle centered at score (0, 0).
- Radius: **50 in score space** (inscribes the SW quadrant —
  passes through (50, 0), (35.4, 35.4) at 45°, and (0, 50)).
- Dashed stroke.
- Stays entirely within the (0,0)-(50,50) SW box.
- Inside the arc = Grip core / FUD territory.
- Outside the arc = made progress in at least one dimension.

**Tolerance cone (dashed fan):**
- Origin: score (0, 0).
- Centered on trajectory angle θ.
- Fan width: ± aim_tolerance degrees (existing formula).
- Arms terminate at the Potential line length.

**Removed:**
- Midpoint anchor dot at score (50, 50).
- Legend line "Solid line: usable movement from midpoint baseline".
- Any "from midpoint baseline" / "above midpoint" / "below midpoint"
  framing.

**Sanity check at Jason's values (post-Soul-fix expected):**
- Jason fixture (ocean Jason): Goal ≈ 94, Soul ≈ 79 (Jason is the
  cohort member not affected by Soul saturation — values stay roughly
  the same after Phase 2).
- θ = atan2(79, 94) ≈ 40°
- Potential endpoint score: (94, 79) — Jason's actual position.
- Usable endpoint score: (94 × 0.773, 79 × 0.773) ≈ (72.6, 61.0).
- Both endpoints clearly OUTSIDE the radius-50 arc.

## Phase 2 — Soul Direct Bonus Trim

In `lib/goalSoulGive.ts`, modify `DIRECT_SOUL_BONUS` to roughly halve
the bonus magnitudes (preserving the relative ratios). Target: Soul
direct bonus max ~14 (matching Goal's ~14).

**Specific weight changes:**

```ts
export const DIRECT_SOUL_BONUS = {
  // soul_people: 6 → 3, 3 → 2
  soulPeopleTop1: 3,
  soulPeopleTop3: 2,
  // soul_calling: 6 → 3, 3 → 2
  soulCallingTop1: 3,
  soulCallingTop3: 2,
  // creative_truth: 4 → 2, 2 → 1
  creativeTruthTop1: 2,
  creativeTruthTop3: 1,
  // durable_creation (soul lift): 3 → 2, 1 → 1
  durableCreationTop1: 2,
  durableCreationTop3: 1,
  // soul_beloved_named: 10 → 5, 6 → 3 (this is the heaviest single
  // direct bonus; halving has the most impact on saturation)
  soulBelovedNamedTop1: 5,
  soulBelovedNamedTop2: 3,
} as const;
```

New direct-bonus maximum: 3+3+2+2+5 = **15** (vs Goal's max of ~14).
Symmetric architecture restored.

**Goal direct bonuses stay unchanged** (already within headroom).

**Vulnerability direct bonuses unchanged** (separate axis).

**Anchor lift formulas (asymmetric Vulnerability lift onto Goal/Soul)
stay unchanged.** Per `goalSoulGive.ts` line 178: "Soul gets a much
larger lift coefficient than Goal" — that asymmetry is canon and
remains. This CC only adjusts the DIRECT_SOUL_BONUS table, not the
Vulnerability-lift coefficients.

**Cohort impact (expected, to verify):**
- Cindy / Daniel / Harry / Kevin: drop from Soul=100 to roughly
  Soul=85-95 range (recovering discrimination).
- Ashley / Michele: stay roughly at 92-95 (already not fully saturated).
- Jason: stays roughly at 79 (Soul direct bonuses weren't a major
  contributor to his score).

## Files to modify

1. **`lib/goalSoulGive.ts`** — `DIRECT_SOUL_BONUS` constant: halve
   bonus magnitudes per spec above. Add comment line referencing
   CC-105.

2. **`lib/trajectoryChart.ts`** — replace midpoint-anchor with
   radial-origin geometry:
   - Remove `MIDPOINT_X` / `MIDPOINT_Y` constants.
   - Rewrite `svgTrajectoryLines`: draw Usable and Potential from
     score (0, 0) along angle θ to score-space endpoints.
   - Rewrite `svgToleranceCone`: fan from score (0, 0), arms
     terminate at Potential length.
   - Rewrite `svgGripDragMarker`: tail at Usable endpoint, arrow
     pointing back along trajectory toward origin.
   - Add `svgGripThresholdArc`: quarter-circle path at radius 50,
     dashed stroke.
   - Remove `svgMidpointMarker`.
   - Update legend: drop midpoint references; add "Dashed arc: Grip
     threshold — your starting box".

3. **Audit assertions:**
   - `tests/audit/chartMidpointRecalibration.audit.ts` — replace
     midpoint-anchor assertions with radial-geometry assertions
     (origin at score (0,0); endpoints at scaled (Goal, Soul); arc
     at radius 50; no midpoint marker).
   - `tests/audit/trajectoryChart.audit.ts` — assertion 5 cone-tangent
     check: rename `svgPointToAngleFromMidpoint` →
     `svgPointToAngleFromOrigin`, recompute reference angle from
     score (0, 0).
   - `tests/audit/aimRebuild.audit.ts` — assertion 24.5 same fix.
   - `tests/audit/goalSoulGive.audit.ts` (or wherever Soul-weight
     assertions live) — update any hardcoded Soul direct-bonus
     expectations.
   - Optionally rename `chartMidpointRecalibration.audit.ts` →
     `chartRadialGeometry.audit.ts` (update package.json script).

4. **Baselines (regenerate after Phase 1 + 2 changes both land):**
   - `tests/audit/twoTierBaseline.snapshot.json`
   - `tests/audit/handsCardBaseline.snapshot.json`
   - Any other snapshot baselines that drift.

5. **LLM caches (regenerate IF Soul-value drift causes cache hash
   misses):**
   - `lib/cache/prose-rewrites.json`
   - `lib/cache/synthesis3-paragraphs.json`
   - Run in canonical order: synthesis3 → proseRewrites → others
     (per `feedback_cache_regen_ordering.md`).
   - Editorial review of regenerated entries required before accept
     (per `feedback_codex_llm_editorial_review.md`).

## What stays unchanged

Engine math for Goal weights / V/O wiring / Aim formula / Grip
formula / Movement formula / Quadrant routing / Risk Form classifier;
trajectory direction formula `atan2(Soul, Goal)`; chart SVG viewBox
and coordinate mapping; tolerance cone width formula;
Vulnerability-axis weights and lift coefficients onto Goal/Soul;
cohort-real fixtures; render mode masking; Quadrant label routing;
Next Moves prose layer.

## Audit acceptance

- `npx tsx tests/audit/chartMidpointRecalibration.audit.ts` (or
  renamed) green.
- `npx tsx tests/audit/trajectoryChart.audit.ts` green post-update.
- `npx tsx tests/audit/aimRebuild.audit.ts` green post-update.
- Soul cohort distribution post-Phase-2 falls in expected range:
  - Jason ≈ 79 (unchanged)
  - Ashley ≈ 92 ± 5
  - Cindy / Daniel / Harry / Kevin in **85-95 band** (no more 100s)
  - Michele ≈ 92 ± 5
  - Spread between min and max ≥ 10 (discrimination restored)
- Full audit suite remains green (77 → 77 or as adjusted by Soul
  fixture-expected updates).
- `npx tsc --noEmit` clean.
- `npm run lint` clean (pre-existing `PathExpanded.tsx` warning OK).
- Jason's prod render post-deploy:
  - Trajectory line visibly starts at bottom-left corner.
  - Grip arc visible as dashed quarter-circle inscribed in SW box.
  - Usable / Potential endpoints clearly outside the Grip arc.
  - No midpoint dot, no "from midpoint baseline" legend text.
  - His chart visual position (post-Soul-fix Jason ≈ same as today
    because his Soul isn't saturated).

## Do NOT

- Modify Goal weights, Goal direct bonuses, or the Goal contributor
  catalog.
- Modify Vulnerability-axis weights or asymmetric-lift coefficients.
- Modify Aim, Grip, V/O, Movement, or any other engine formula.
- Modify the chart's 100×100 axis bounds, viewBox, or score→SVG
  coordinate mapping.
- Modify cohort-real fixtures.
- Modify Next Moves router or prose.
- Make commits or push (Cowork-chat handles commit + push after
  audit-green).
- Skip the editorial-review step on any regenerated LLM cache
  entries (per `feedback_codex_llm_editorial_review.md`).

## Expected runtime

~60-90 minutes executor time:
- Phase 2 Soul refactor: ~10 min (constant change + cohort verification).
- Phase 1 chart geometry: ~30 min (geometry rewrites + 4 audit
  updates).
- Baseline regen: ~10 min.
- Cache regen (if needed): ~30 min + ~$3-5 LLM.
- Editorial review of any regenerated LLM entries: ~10 min.

## Cost

$0 if cache hashes don't drift past tolerance. ~$3-5 LLM if cache
regen is required (likely, since Soul changes will shift downstream
prose inputs for affected fixtures).

## Hot-fix deploy plan (after audit-green, Cowork-chat handles)

1. `rm scripts/_tmp-*.ts` (clean up scratch scripts left from
   investigation).
2. `git add -A`
3. `git commit -F .commit-msg.txt` with hot-fix narrative.
4. `git push`
5. Vercel auto-deploys.
6. Verify Jason's prod render: line origin at bottom-left, Grip arc
   visible as dashed quarter-circle in SW corner, Usable / Potential
   endpoints outside arc. Verify cohort renders show Soul
   discrimination (Cindy / Daniel / Harry / Kevin no longer all at
   exactly 100).

## Memory canon updates (deferred until verified in prod)

Three memory entries need updates after CC-105 verifies:

1. **`feedback_chart_as_feedback_engine.md`** — currently encodes the
   wrong interpretation ("anchor at (50,50)"). Rewrite to reflect:
   line origin at score (0, 0); Grip arc inscribes SW box at radius
   50; Movement displays 0-100 normalized; chart geometry uses raw
   score-space coordinates internally.

2. **New: `feedback_soul_goal_symmetry.md`** — canonize the principle
   that Goal and Soul scoring architectures should be symmetric in
   weight totals AND bonus headroom. Document the asymmetric direct-
   bonus issue surfaced 2026-05-18 and the Phase-2 fix.

3. **New: `feedback_score_saturation_audit.md`** — for any future
   composite scoring (Vulnerability, Aim, Grip, derived axes), audit
   the bonus-vs-base ratio before shipping. Saturation at the cap
   hides exactly the variance the score is supposed to discriminate.

Updates happen post-prod-verify, not pre-close.

## Out of scope (queued separately)

- Option-2 deeper Soul-Goal symmetric refactor (same number of
  contributors with same structure). Stays queued as CC-106-SOUL-
  GOAL-CONTRIBUTOR-CATALOG-REFACTOR.
- Option-3 raw-cap removal (expose Soul/Goal raw values above 100).
  Architectural change with cascading UX effects; deferred.
- Soul re-conceptualization (decomposing Soul into sub-axes:
  Relational / Spiritual / Aesthetic / Compassionate). Stays queued
  as a candidate CC for the "what other Soul registers should count"
  question.
- Vulnerability-axis saturation audit (separate axis, same
  architectural risk).
