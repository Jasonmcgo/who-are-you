# CC-071 — Goal/Soul Dashboard (math reframe + visible scores + 2×2 visual + Gripping Pull)

**Origin:** `docs/goal-soul-give-spec.md` post-revision (§4 quadrant simplification, §7 asymmetric lift + Gripping Pull, §9 Parallel Lives removed, §10 SE/NW reframed as descriptors not labels, §12 user-facing carve-outs, §13 Movement Layer with Dashboard surface). Predecessors: CC-067, CC-068, CC-070. **This CC implements a substantive architectural reframe — read §7 and §13.4a carefully before editing.**

**Scope frame:** Reverse the engine-internal-only render in favor of a Dashboard surface that shows the user their actual scores. Three coordinated changes:

1. **Math reframe.** Vulnerability becomes an asymmetric lift factor on Goal and Soul — not a third axis, not a separate score. `raw_goal` and `raw_soul` are preserved internally; `adjusted_goal` and `adjusted_soul` are what the user sees. Asymmetric lift: Soul gets a much larger lift than Goal (0.60–1.40× vs 0.85–1.15×), so a high-output builder with thin Vulnerability keeps a strong Goal score but their Soul score reflects the integration gap. Parallel Lives is removed entirely — the math now captures the diagnostic.

2. **Dashboard surface.** A new visible block at the top of the Movement section shows `Goal: 80 / 100`, `Soul: 45 / 100`, `Direction: 29° (Goal-leaning)`, `Movement Strength: 65 / 100`, `Quadrant: Giving` (or Gripping, or omitted for SE/NW), `Gripping Pull: 22 / 100`, and the named-signal list. Plus a 2×2 SVG visual plot showing the user's line and quadrant position with Giving/Gripping labeled (SE and NW unlabeled).

3. **Prose layer reframed.** Closing Read prose templates updated: SE/NW use *Goal-leaning* / *Soul-leaning* descriptors instead of *Striving* / *Longing* labels; Parallel Lives template removed; Movement narrative prose no longer restates the dashboard numbers (the dashboard does precision, the prose does meaning).

---

## Launch Directive

Run with `claude --dangerously-skip-permissions`, or in-session via `/permissions` → bypass.

## Execution Directive

Complete in a single pass. The architectural reframe is large; pace yourself through the spec memo §7 and §13.4a until you internalize the canon BEFORE writing code. On ambiguity, apply canon-faithful interpretation per the post-revision spec memo and flag in Report Back.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run dev` — visual verification of dashboard render in browser
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `ls`, `grep`, `find`

## Read First (Required)

1. `docs/goal-soul-give-spec.md` — full file. **§4 quadrant definitions (post-revision: Giving/Gripping labeled; SE/NW unlabeled), §7 asymmetric lift + Gripping Pull, §9 Parallel Lives removed, §10 closing render examples (Parallel Lives template removed; SE/NW prose uses descriptors), §12 risks/guardrails (carve-out for Giving/Gripping as user-facing), §13 Movement Layer + §13.4a Dashboard surface specification** are all load-bearing.
2. `AGENTS.md` — CC workflow.
3. `lib/goalSoulGive.ts` — full file. CC-067/068 baseline.
4. `lib/goalSoulPatterns.ts` — full file. Parallel Lives detector must be removed.
5. `lib/goalSoulMovement.ts` — full file. Movement updates for adjusted scores.
6. `lib/identityEngine.ts` — `buildInnerConstitution` wiring.
7. `lib/renderMirror.ts` — closing render path. Dashboard surface attaches here.
8. `lib/types.ts` — `GoalSoulGiveOutput`, `MovementOutput`, `GoalSoulPatterns`, `InnerConstitution`.
9. `tests/audit/goalSoulGive.audit.ts` — current audit baseline.
10. `tests/fixtures/goal-soul-give/*.json` — all 11 fixtures including 02-parallel-lives.
11. `prompts/completed/CC-067-…md`, `prompts/completed/CC-068-…md`, `prompts/completed/CC-070-…md` — for context on the prior chain.
12. `app/page.tsx` — production caller of `buildInnerConstitution`. Update to thread demographics if it doesn't already (CC-070 left this gap; close it here).

Memory cross-references:

- `feedback_synthesis_over_contradiction.md` — coherence reads, evidence-gated.
- `feedback_marble_statue_humanity_gap.md` — accuracy without warmth is the gap; the dashboard's job is precision, the prose's job is warmth.
- `project_goal_soul_give_spec.md` — current state of the chain and the post-revision canon.
- `feedback_minimal_questions_maximum_output.md` — derivation over new measurement; this CC is exactly that pattern.

## Allowed to Modify

These files only.

1. **`lib/types.ts`** — extend `GoalSoulGiveOutput` with `rawScores: { goal, soul, vulnerability }` and `adjustedScores: { goal, soul }`; replace `scores: { goal, soul, vulnerability }` field if it exists or rename to `adjustedScores`. Add `GrippingPull` type: `{ score: number; signals: GrippingPullSignal[] }` with `GrippingPullSignal = { id: string; humanReadable: string }`. Add `MovementDashboard` type carrying the dashboard fields. Update `GoalSoulQuadrant` union: remove `'parallel_lives'` from the union. Add `goalSoulDashboard?: MovementDashboard` field to `InnerConstitution` if separating from `goalSoulMovement`, OR extend `MovementOutput` with the dashboard fields.
2. **`lib/goalSoulGive.ts`** — implement asymmetric lift per spec §7. The `computeGoalSoulGive` function gains the lift logic: compute raw_goal, raw_soul, vulnerability_composite as before, then compute adjusted_goal and adjusted_soul via the asymmetric formula. Update the returned `GoalSoulGiveOutput` shape. Update `PROSE_TEMPLATES`: remove the `parallel_lives` template entry; reframe SE/NW prose to use *Goal-leaning* / *Soul-leaning* descriptors instead of *Striving* / *Longing* labels (the words *Striving* and *Longing* appear nowhere in the SE/NW user-facing prose — they're engine-internal only). Remove `parallel_lives` from the quadrant placement algorithm (the asymmetric lift handles the compartmentalized case automatically). Compute Gripping Pull score and signals per spec §7; expose as a separate field on the output.
3. **`lib/goalSoulPatterns.ts`** — remove `detectParallelLives`, the `parallel_lives` entry from `EXPECTED_PATTERNS_BY_FIXTURE` if shared, and any rendering logic for Parallel Lives. Keep Defensive Builder and Generative Builder detectors. Update Generative Builder to read `adjusted_goal` / `adjusted_soul` not `raw_goal` / `raw_soul`.
4. **`lib/goalSoulMovement.ts`** — update polar geometry to operate on `adjusted_goal` / `adjusted_soul`. Add `dashboard: MovementDashboard` field to the output, carrying: `goalScore, soulScore, direction (angle + descriptor), movementStrength (length + descriptor), quadrantLabel (one of 'Giving' | 'Gripping' | null), grippingPull (score + signals)`. Update narrative prose templates to NOT restate the dashboard's numerical readouts — instead first sentence names the posture (Goal-leaning / Soul-leaning / balanced) and final sentence names a bridge or next move.
5. **`lib/goalSoulDashboard.ts`** — NEW FILE. Exports `renderGoalSoulDashboardSVG(dashboard: MovementDashboard): string` returning an SVG string for the 2×2 plot per spec §13.4a. Hand-rolled SVG (~80 lines), no charting library. Special render for length=0 (dot at origin, no line). 1:1 aspect ratio. Quadrant labels: Giving (NE), Gripping (SW). SE/NW corners unlabeled. Direction label near the angle's apex; Movement Strength label near the line midpoint or endpoint.
6. **`lib/identityEngine.ts`** — wire updated derivations. The Vulnerability composite is computed inside `computeGoalSoulGive` (existing path), no engine-level changes needed for the math. May need 1–2 line update if the demographics threading hasn't been completed in production caller (see app/page.tsx in §12 below).
7. **`lib/renderMirror.ts`** — render the new Dashboard surface at the top of the `## Movement` section. Order: dashboard fields (text-form: Goal: X / Soul: Y / Direction: Z° (descriptor) / Movement Strength: W / Quadrant: label or omitted / Gripping Pull: P with signal list) → SVG visual → narrative prose. The SVG is embedded inline in the markdown via `<svg>` syntax (modern markdown viewers and the on-page React render both support inline SVG). Update the Closing Read render so SE/NW Goal-leaning / Soul-leaning prose fires correctly with the new template names (verify by inspection).
8. **`app/page.tsx`** — thread `demographics` to `buildInnerConstitution(answers, metaSignals, demographics)` if it currently passes only 2 args. Close the production gap CC-070 flagged.
9. **`tests/audit/goalSoulGive.audit.ts`** — major audit additions:
   - Asymmetric lift assertions: for each fixture, verify `adjusted_goal` and `adjusted_soul` match the expected lift factor given the vulnerability composite.
   - Quadrant placement assertions updated: no `parallel_lives` quadrant for any fixture; the previously-Parallel-Lives fixture should now land in SE Goal-leaning OR NE Giving depending on whether asymmetric lift suppresses adjusted_soul below 50.
   - Gripping Pull assertions: for each fixture, score ∈ [0, 100] and signals list non-empty when score > 0.
   - Dashboard render assertions: verify the dashboard fields are present, formatted correctly, and the visual SVG output is valid (contains `<svg`, contains the line element, contains "Giving" and "Gripping" labels, does NOT contain "Striving" / "Longing" / "Parallel Lives").
   - Prose register assertions: verify SE/NW prose uses *Goal-leaning* / *Soul-leaning* descriptors and does NOT contain the words "Striving", "Longing", "Parallel Lives". Verify Movement narrative prose does NOT restate the dashboard's numerical readouts (no degree symbol followed by length number in the narrative; precise check: narrative does not contain `°` AND "length" simultaneously — those tokens belong to the dashboard).
10. **`tests/fixtures/goal-soul-give/02-parallel-lives.json`** — rename to `02-compartmentalized.json` OR update its expected-quadrant to whatever the asymmetric lift produces (likely SE Goal-leaning). Update the audit's `EXPECTED_PATTERNS_BY_FIXTURE` accordingly.

## Out of Scope (Do Not)

Negative-list constraints. Halt and report rather than violate.

1. **Do NOT add Q-Purpose-Building or any new question.** CC-B is still deferred.
2. **Do NOT add any new signal** to `lib/types.ts` SignalId / SIGNAL_DESCRIPTIONS / extractors.
3. **Do NOT modify `SIGNAL_DRIVE_TAGS`** in `lib/drive.ts`.
4. **Do NOT touch OCEAN-related files** (`lib/ocean.ts`, the Disposition Map prose, the OCEAN audit). OCEAN dashboard is the next CC after CC-071.
5. **Do NOT install new dependencies.** Hand-rolled SVG only — no Recharts, no Chart.js, no D3. `tsx` and existing libs are sufficient.
6. **Do NOT add longitudinal / trajectory tracking, repeat-assessment storage, or any longitudinal feature.** Dashboard is static (current-assessment) per spec §13.3.
7. **Do NOT add a children/dependents field to demographics.** Parent-stage gating remains deferred.
8. **Do NOT use the words "Striving", "Longing", "Parallel Lives", "Defensive Builder", "Generative Builder", "Gripper"** in user-facing prose (Closing Read body, Movement narrative). They remain engine-internal. The dashboard surface uses *Giving* and *Gripping* only as quadrant labels.
9. **Do NOT display the Vulnerability score** as a numeric field on the dashboard. Vulnerability is engine-internal. It appears in the math, in `rawScores.vulnerability`, and may be named in narrative prose as a quality — but never as a number on the user-facing surface.
10. **Do NOT restate the dashboard's numerical readouts in the Movement narrative prose.** The dashboard says "Direction: 29°"; the prose says "your line leans toward the Work axis." Two layers, two registers, no duplication.
11. **Do NOT label SE or NW corners on the SVG plot.** Only Giving (NE) and Gripping (SW) get corner labels. SE and NW positions are visible via the line's location but unlabeled.
12. **Do NOT collapse the Vulnerability composite into Soul math without preserving the asymmetric lift.** The 0.85/0.30 (Goal) and 0.60/0.80 (Soul) constants are the canon asymmetry; do not equalize them.
13. **Do NOT render therapy-coded language** in either the dashboard or the prose. Forbidden phrasings: "show up for your own life", "your inner work", "shadow self", "authentic self", etc.
14. **Do NOT moralize on a short Movement Strength or low Goal/Soul score.** A short line reflects a moment, not a person.
15. **Do NOT add a fourth pattern** to `lib/goalSoulPatterns.ts`. Defensive Builder and Generative Builder remain; Parallel Lives is removed.
16. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`**.
17. **Do NOT modify `docs/goal-soul-give-spec.md` or `docs/ocean-disposition-spec.md`.** Spec is canon; CC reads it, doesn't edit.
18. **Do NOT use Recharts, Chart.js, or any charting framework.** Hand-rolled SVG only.

## Acceptance Criteria

### Math reframe

1. `GoalSoulGiveOutput.rawScores: { goal: number; soul: number; vulnerability: number }` exposed; preserved for audit/debug.
2. `GoalSoulGiveOutput.adjustedScores: { goal: number; soul: number }` exposed; these are what the user sees.
3. `adjusted_goal = clamp(raw_goal × goal_lift_factor, 0, 100)` where `goal_lift_factor = 0.85 + 0.30 × vulnerability_normalized`.
4. `adjusted_soul = clamp(raw_soul × soul_lift_factor, 0, 100)` where `soul_lift_factor = 0.60 + 0.80 × vulnerability_normalized`.
5. `vulnerability_normalized = (vulnerability_composite + 50) / 100` clamped to [0, 1].
6. Lift factor constants exported as named `const` with comments calling them tunables.
7. At `vulnerability_composite = 0` (neutral), `adjusted_goal === raw_goal` AND `adjusted_soul === raw_soul`. Verified by audit.
8. At `vulnerability_composite = -50` (deep closure) with `raw_goal = 80, raw_soul = 60`: `adjusted_goal ≈ 68, adjusted_soul ≈ 36`. Verified by audit.
9. At `vulnerability_composite = +50` (deep openness) with `raw_goal = 80, raw_soul = 60`: `adjusted_goal ≈ 92, adjusted_soul ≈ 84` (Soul lifted significantly more than Goal). Verified by audit.

### Quadrant placement (no Parallel Lives)

10. `GoalSoulQuadrant` type union no longer includes `'parallel_lives'`. Verified by grep: zero matches of `'parallel_lives'` as a quadrant value across the codebase.
11. Quadrant placement algorithm uses `adjusted_goal` and `adjusted_soul` (not raw). Verified by inspection.
12. The fixture previously known as `02-parallel-lives.json` no longer asserts `quadrant === 'parallel_lives'`; it asserts whatever the asymmetric lift produces (likely `'striving'` since Soul gets suppressed by negative Vulnerability).

### Gripping Pull

13. `GrippingPull.score: number` ∈ [0, 100] computed per spec §7 formula.
14. `GrippingPull.signals: GrippingPullSignal[]` non-empty when score > 0; empty when score = 0.
15. Each `GrippingPullSignal` has `id` (engine internal) and `humanReadable` (user-facing).
16. Audit asserts: for each fixture, score is computed correctly; signal list contains expected entries based on the fixture's signal pool.

### Dashboard surface

17. `lib/goalSoulDashboard.ts` exports `renderGoalSoulDashboardSVG(dashboard): string`. Output is valid SVG (parseable, contains `<svg`, contains `</svg>`).
18. The dashboard text block in `renderMirror.ts` renders all required fields per spec §13.4a in the prescribed order.
19. Quadrant label appears as "Quadrant: Giving" or "Quadrant: Gripping" or is omitted entirely (no "Quadrant: Goal-leaning" or "Quadrant: Striving" — those are descriptors, not labels).
20. The SVG includes "Giving" label in NE corner and "Gripping" label in SW corner. SE and NW corners unlabeled. Verified by audit string-match on the SVG output.
21. Special render for `length === 0`: SVG shows a dot at origin without a line; dashboard text says "Movement Strength: 0 — the line has not yet been drawn".

### Prose layer

22. SE Closing Read prose contains "Goal-leaning" (or close paraphrase). Does NOT contain the word "Striving" anywhere user-facing. Verified by audit.
23. NW Closing Read prose contains "Soul-leaning" (or close paraphrase). Does NOT contain the word "Longing" anywhere user-facing. Verified by audit.
24. The previous `parallel_lives` template entry in `PROSE_TEMPLATES` is removed.
25. Movement narrative prose (below the dashboard) does NOT restate the dashboard's numerical readouts. Verified by audit: narrative does not contain both `°` and the substring "length" — those tokens belong to the dashboard.
26. Movement narrative still contains a bridge phrase per CC-068's allowlist (`the work`, `the way`, `the bridge`, `the completion`, `next`, `begin`, `becoming`, `the willingness`, `moves toward`, `anchor`, `is to`).
27. Vulnerability is named in narrative prose as a quality (e.g., "openness", "willingness to be seen", "courage") — never as a numeric score.

### Pattern catalog

28. `detectParallelLives` removed from `lib/goalSoulPatterns.ts`. Generative Builder and Defensive Builder remain.
29. Generative Builder reads `adjusted_*` not `raw_*` (firing condition uses post-lift scores).
30. `EXPECTED_PATTERNS_BY_FIXTURE` updated: no fixture asserts `parallel_lives` fires.

### Production caller

31. `app/page.tsx` calls `buildInnerConstitution(answers, metaSignals, demographics)` with three arguments. Demographics is threaded from wherever it's collected. If demographics is undefined for a given session (e.g., user skipped), pass `null` explicitly.

### Build hygiene

32. `npx tsc --noEmit` exits 0.
33. `npm run lint` exits 0.
34. `npm run audit:goal-soul-give` exits 0 across all 11 (or rename-adjusted 11) fixtures.
35. `git status --short` shows only Allowed-to-Modify files modified.
36. No new dependencies. `package.json` and `package-lock.json` unchanged unless adding `tsx` was missed earlier.
37. `data/questions.ts` unchanged (40 question_ids).

## Report Back

1. **Summary** — what was implemented in 6–10 sentences.
2. **Math reframe** — example fixture before/after: at `vulnerability_composite = -20, raw_goal = 80, raw_soul = 50`, what does `adjusted_goal` and `adjusted_soul` come out to? Show the math.
3. **Quadrant migration** — for each of the 11 fixtures, report the old quadrant (CC-067/070) and the new quadrant after asymmetric lift. Specifically flag any fixture whose quadrant changed.
4. **Gripping Pull readings** — for each fixture, the computed score and signal list verbatim.
5. **Dashboard renders (verbatim)** — the rendered text block + the SVG output (or first 30 lines) for at least 3 fixtures spanning Giving / Goal-leaning / Gripping.
6. **Sample SE Goal-leaning prose** — quote the new prose template that replaced the `striving` template name.
7. **Audit pass/fail breakdown** — fixture-by-fixture, assertion-by-assertion. Include all CC-067, CC-068, CC-070, CC-071 layers.
8. **Production caller update** — the diff to `app/page.tsx` for the demographics threading.
9. **Canon ambiguities encountered** — quote the spec, name the call.
10. **Files modified** — every path with line-count delta.
11. **Out-of-scope verification** — `git status --short` confirming Allowed-to-Modify only.
12. **Spec ↔ code drift report** — anywhere `docs/goal-soul-give-spec.md` diverged from your implementation, for downstream CODEX sync.
13. **Recommendations for next CC (OCEAN dashboard)** — based on what you learned. What patterns from CC-071 carry over? What does the OCEAN dashboard need that this CC's surface doesn't already provide?
14. **Open questions** — anything that surfaced that the spec did not anticipate.

---

## Method notes

**The asymmetric lift is the canonical math change.** Read §7 carefully — the 0.85/0.30 and 0.60/0.80 constants encode the canon that *Vulnerability gates the love-line more than it gates productive motion*. Don't equalize them; doing so flattens the high-output builder.

**The dashboard surface is engine vocabulary; the prose is narrative vocabulary.** Two registers, two surfaces, neither pretends to be the other. The dashboard says "Goal: 80, Soul: 45, Quadrant: Giving"; the prose says "your line leans toward the Work axis with the love-line beginning to register." If you find yourself writing "Goal" or "Soul" or numerical readouts in the narrative prose, stop — that text belongs to the dashboard.

**Parallel Lives is dead, not just renamed.** No detector, no template, no fixture asserts it, no pattern catalog entry. The compartmentalized case is now a math outcome of the asymmetric lift, not a pattern that fires. Audit the codebase for any leftover `parallel_lives` references and remove them.

**Hand-rolled SVG is fine; don't reach for a library.** ~80 lines does the job. The spec §13.10 implementation notes give you the visual recipe.

**Movement narrative prose no longer restates the dashboard.** The CC-068 prose templates were the only reads (no dashboard existed). Now the dashboard carries the precision; the prose carries the meaning. First sentence names the posture (Goal-leaning / Soul-leaning / balanced); final sentence names the bridge. Don't include `°` or the word "length" in the narrative — those belong to the dashboard.

**The fixture rename for `02-parallel-lives.json` is a real decision.** Either rename to `02-compartmentalized.json` (more descriptive of the case structure) or update its expected-quadrant in place. Either is fine; document which choice you made and why.
