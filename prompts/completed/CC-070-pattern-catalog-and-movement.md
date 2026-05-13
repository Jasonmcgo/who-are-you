# CC-070 — Pattern Catalog (heuristic) + Movement Layer (text-only)

**Origin:** `docs/goal-soul-give-spec.md` §9 (Cross-Card Patterns) and §13 (Movement Layer). CC-C in the revised Goal/Soul/Give chain. Predecessors: CC-067 (derivation), CC-068 (Closing Read prose), CODEX-069 (spec/code prose drift sync — should be merged before CC-070 fires).

**Scope frame:** Two related additions in one CC. (1) Cross-card pattern catalog with three heuristic patterns — Parallel Lives, Defensive Builder, Generative Builder — implemented without `building_motive_*` signals (CC-B is still deferred). (2) Movement layer: polar geometry off Goal/Soul scores, rendered as a separate `## Movement` section with numerical+narrative inline read and life-stage-aware guidance. **No visual plot** — that's the next CC. **No new questions, no new signals.**

---

## Launch Directive

Run with `claude --dangerously-skip-permissions`, or in-session via `/permissions` → bypass. Project has `defaultMode: "bypassPermissions"`.

## Execution Directive

Complete in a single pass. Do not pause for user confirmation. On ambiguity, apply canon-faithful interpretation per `docs/goal-soul-give-spec.md` §9, §10, §13 and flag the call in Report Back. The §13 Movement Layer section is brand-new canon (added 2026-05-07, this session); read it carefully — it carries the demographics gating, confidence gating, vocabulary register, and guardrails that constrain CC-070's prose work.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `ls`, `grep`, `find`

## Read First (Required)

1. `docs/goal-soul-give-spec.md` — full file. **§9 Cross-Card Patterns** and **§13 Movement Layer** are the load-bearing sections; also read §10 register guidance, §11 canon language, §11a narrative guidance, §12 risks, §13.11 Movement-specific guardrails.
2. `AGENTS.md` — CC workflow.
3. `lib/goalSoulGive.ts` — full file. CC-067/CC-068 baseline; CC-070 extends but does not modify the existing derivation logic or Closing Read templates.
4. `tests/audit/goalSoulGive.audit.ts` — current audit structure. CC-070 extends with pattern + movement assertions.
5. `tests/fixtures/goal-soul-give/*.json` — all 7 fixtures. Read-only baseline; CC-070 may add new fixtures (see Allowed to Modify §6).
6. `lib/types.ts` — `InnerConstitution`, `GoalSoulGiveOutput`, `Signal`, `Answer`, `DemographicSet`, `DemographicAnswer`. CC-070 adds new types alongside.
7. `lib/identityEngine.ts` — `buildInnerConstitution`. CC-070 wires new derivations into this function.
8. `lib/renderMirror.ts` — closing render path. CC-070 adds the `## Movement` section and the Defensive Builder kicker hook.
9. `lib/cardAssets.ts` — Path · Gait shape card resolver. CC-070 adds Generative Builder kicker on this card.
10. `data/demographics.ts` — demographics field definitions. CC-070 reads `age` and `profession` only; does NOT read `marital_status` or any other field.
11. `prompts/completed/CC-067-goal-soul-give-derivation.md` and `prompts/completed/CC-068-closing-read-prose-polish.md` — for context on what's already shipped and the audit conventions to extend.
12. `prompts/completed/CODEX-069-spec-prose-drift-sync.md` — confirm spec/code §10 prose are now in sync before reading either.

Memory cross-references that bear on this CC:

- `feedback_minimal_questions_maximum_output.md` — heuristic patterns over new measurement; this CC is exactly that pattern.
- `feedback_synthesis_over_contradiction.md` — Movement read prose should land coherent and warm where evidence supports it; tough-love where it must.
- `feedback_marble_statue_humanity_gap.md` — Movement read uses the geometric register without losing warmth.
- `feedback_drive_case_vs_bucket_lean.md` — read DriveOutput correctly when computing Defensive Builder heuristic; do not conflate `case` with bucket lean.
- `project_goal_soul_give_spec.md` — current state of revised CC ordering and Movement layer canon.
- `feedback_sacred_vs_contribution_register.md` — Compass holds nouns, Path/Gravity holds verbs; respect when wiring Generative Builder kicker on Path · Gait.

## Allowed to Modify

These files only. Anything outside this list is forbidden.

1. **`lib/types.ts`** — add types: `CrossCardPattern`, `CrossCardPatternId`, `GoalSoulPatterns`, `MovementOutput`, `MovementVocabularyRegister`. Extend `InnerConstitution` with optional `goalSoulPatterns?: GoalSoulPatterns` and `goalSoulMovement?: MovementOutput`. Do NOT modify any existing type.
2. **`lib/goalSoulPatterns.ts`** — NEW FILE. Exports `detectGoalSoulPatterns(constitution: InnerConstitution): GoalSoulPatterns | undefined` plus the three pattern detector helper functions (`detectParallelLives`, `detectDefensiveBuilderHeuristic`, `detectGenerativeBuilderHeuristic`) for direct audit testing. Pattern kicker prose constants live in this file.
3. **`lib/goalSoulMovement.ts`** — NEW FILE. Exports `computeMovement(goalSoulGive: GoalSoulGiveOutput, demographics: DemographicSet | null | undefined): MovementOutput | undefined`. Polar math + life-stage-gated prose. Movement vocabulary registers (geometric / motion / warmer) defined here.
4. **`lib/identityEngine.ts`** — wire `detectGoalSoulPatterns` and `computeMovement` into `buildInnerConstitution`, attached as `goalSoulPatterns` and `goalSoulMovement` fields, after the existing `goalSoulGive` derivation. No other edits.
5. **`lib/renderMirror.ts`** — render the new `## Movement` section after the existing `## Closing Read` block. When Defensive Builder pattern fires, append the pattern's ≤1 sentence kicker to the Striving Closing Read prose (the `// CC-068 wrap-compat` slot). When Generative Builder fires, render its kicker on the Path · Gait shape card output. No other edits.
6. **`tests/fixtures/goal-soul-give/*.json`** — extend the 7 existing fixtures with `demographics` field where the test case needs life-stage variation. Add up to 4 NEW fixtures for life-stage cases: `08-early-career-striving.json`, `09-mid-career-balance.json`, `10-entrepreneur-striving.json`, `11-retirement-longing.json`. Do NOT modify any of the existing fixtures' answer arrays — only add the `demographics` field.
7. **`tests/audit/goalSoulGive.audit.ts`** — add pattern-detection assertions and Movement-read assertions per Acceptance Criteria. Do NOT remove or weaken existing CC-067/CC-068 assertions.
8. **`lib/cardAssets.ts`** — add Generative Builder kicker hook to Path · Gait card output ONLY. No other edits to this file. The kicker mechanism may already exist (similar pattern to existing card hooks); use that pattern if present, otherwise add minimally.

## Out of Scope (Do Not)

Negative-list constraints. Violating any of these requires the CC to halt and report back rather than proceed.

1. **Do NOT add Q-Purpose-Building** or any new question to `data/questions.ts`. CC-B is still deferred.
2. **Do NOT add the `building_motive_*` signal family** or any new signal to `lib/types.ts` SignalId/SIGNAL_DESCRIPTIONS. The pattern heuristics use existing signals only.
3. **Do NOT modify `SIGNAL_DRIVE_TAGS`** in `lib/drive.ts`. Drive bucket tags are canon-locked.
4. **Do NOT modify the existing `computeGoalSoulGive` function**, its weights, thresholds, or the existing `PROSE_TEMPLATES`. CC-067/CC-068 outputs are inputs to CC-070.
5. **Do NOT modify any existing `Closing Read` prose template** in `lib/goalSoulGive.ts`. The Striving template's `// CC-068 wrap-compat` marker is the integration point; the kicker is appended at render time, not by editing the template.
6. **Do NOT add a visual 2×2 plot, chart component, or any UI rendering beyond text/markdown.** The visual is the next CC.
7. **Do NOT implement trajectory tracking, repeat-assessment storage, or any longitudinal feature.** Movement read is static-only for MVP per spec §13.3.
8. **Do NOT use `marital_status` or any demographic field other than `age` and `profession`** in the Movement read prose. Children/parent-stage gating is deferred to a future CC entirely (spec §13.7).
9. **Do NOT use the words "Goal", "Soul", or "Vulnerability"** (case-insensitive) anywhere in user-facing prose — pattern kickers OR Movement read. Same rule as Closing Read.
10. **Do NOT use engine-internal pattern names** ("Parallel Lives", "Defensive Builder", "Generative Builder", "Gripper", "Gripper Disguised as Builder") in user-facing prose.
11. **Do NOT moralize on a short Movement line.** The §13.11 guardrails are binding. Forbidden phrasings include: "show up for your own life", "you should be at X°", "your line is failing", "you're behind". Tough-love has a floor.
12. **Do NOT prescribe specific angles by demographic.** The trajectory thesis is direction (line should rise; length should grow), not target. Saying "for someone your age, the line typically broadens around now — not as a target, as a likely shape" is in-register; saying "you should be at 35° by your age" is out.
13. **Do NOT render the soft "the picture isn't clear yet" fallback** for low-confidence Movement reads. Per §13.8, the MVP register is tough-love: low signal density renders as a Movement read in itself, naming the thinness as the read.
14. **Do NOT compose patterns into Movement read or Movement read into patterns.** Spec §13.9: independent renders.
15. **Do NOT modify `lib/identityEngine.ts` beyond the two-line wiring** of the new derivations into `buildInnerConstitution`. No new helpers, no refactors.
16. **Do NOT modify `MEMORY.md`, `AGENTS.md`, any file under `docs/canon/`, or `docs/goal-soul-give-spec.md`.** Spec is canon at this point; CC-070 reads it, does not edit it.
17. **Do NOT install new dependencies.** `tsx` is sufficient. The audit pattern in `tests/audit/goalSoulGive.audit.ts` extends; no new test framework.
18. **Do NOT change the `GoalSoulGiveOutput` type** or any existing exported type. Only add new types.
19. **Do NOT render Generative Builder as a Closing Read modifier.** It renders only on Path · Gait shape card. Spec §13.10 / CC-068 §9 recommendation: the Give Closing Read already lands warm; doubling erodes it.
20. **Do NOT surface Movement read with engine math details** — no exposed weights, no internal score breakdowns. The user sees angle, length, narrative. Internal Goal/Soul/Vulnerability scores stay in `goalSoulGive.scores` (existing) and never appear in the user-facing Movement prose.

## Acceptance Criteria

Numbered, checkable. CC is not complete until every item is satisfied.

### Type and module structure

1. `MovementOutput` exported from `lib/types.ts`:
   ```ts
   {
     angle: number;        // 0..90 degrees
     length: number;       // 0..100 normalized
     anchorRegister: 'geometric' | 'motion' | 'warmer';  // which register anchored the prose
     prose: string;        // user-facing render with both narrative and numerical
     evidence: {
       lifeStageGate: 'early_career' | 'mid_career' | 'entrepreneur' | 'late_career' | 'retirement' | 'unknown';
       confidence: 'high' | 'medium' | 'low';  // mirrors goalSoulGive.evidence.confidence
     };
   }
   ```
2. `GoalSoulPatterns` exported from `lib/types.ts`:
   ```ts
   {
     fired: CrossCardPattern[];   // array of pattern objects that fired (zero or more)
   }
   ```
   With `CrossCardPattern = { id: CrossCardPatternId; kickerProse: string; renderTarget: 'closing_read_suffix' | 'path_gait_card' | 'closing_read_body'; }`
3. `CrossCardPatternId = 'parallel_lives' | 'defensive_builder' | 'generative_builder'`.
4. `InnerConstitution` extended with `goalSoulPatterns?: GoalSoulPatterns` and `goalSoulMovement?: MovementOutput`. Both optional, parallel to `goalSoulGive`.
5. `lib/goalSoulPatterns.ts` exports `detectGoalSoulPatterns(constitution)` plus three pattern detector functions, each pure and directly testable.
6. `lib/goalSoulMovement.ts` exports `computeMovement(goalSoulGive, demographics)` plus the angle/length helpers.

### Pattern detection logic

7. **Parallel Lives** fires when `goalSoulGive.quadrant === 'parallel_lives'`. The detection is essentially a quadrant lookup; the value-add is the kicker prose, which lives in the Closing Read body via the existing CC-068 `parallel_lives` template (do NOT add a separate kicker — Parallel Lives is already rendered by the Closing Read template; the catalog entry exists for downstream consumers but renders nothing additional).
8. **Defensive Builder (heuristic)** fires when ALL of:
   - `goalSoulGive.quadrant === 'striving'` (high Goal, thin Soul; routes here per §7 algorithm)
   - `compliance_drive` ranked top-1 OR top-2 in Q-3C1
   - Gripping cluster fires (use existing `grippingClusterFires` helper from `lib/goalSoulGive.ts`)
   - `goalSoulGive.scores.vulnerability < 0`
   - `goalSoulGive.scores.soul < 35` (thin Soul)
9. Defensive Builder kicker prose is ≤1 sentence, appended to the Striving Closing Read at render time. Example shape: *"Right now, building appears to be one of the ways you're holding what feels under threat — not all of why you build, but enough to name."* Do NOT use the words "Goal", "Soul", "Vulnerability", "Gripper", "Defensive Builder".
10. **Generative Builder (heuristic)** fires when ALL of:
    - `goalSoulGive.quadrant === 'give'`
    - `goalSoulGive.scores.goal ≥ 70` AND `goalSoulGive.scores.soul ≥ 70`
    - `goalSoulGive.scores.vulnerability ≥ 20`
    - At least one of: `caring_energy_priority` ranked top-1 in Q-E1-inward AND (`building_energy_priority` OR `solving_energy_priority`) top-1 in Q-E1-outward
    - At least one of `compassion_priority`, `mercy_priority`, `family_priority`, `faith_priority` ranked top-2 in Q-S2 AND (`success_priority` OR `legacy_priority`) ranked top-2 in Q-Ambition1
11. Generative Builder kicker renders on Path · Gait card only (NOT closing read). Kicker prose ≤1 sentence. Same forbidden-words rule.

### Movement read computation

12. **Angle:** `atan2(soul, goal) × 180 / π`, clamped to [0, 90]. Special case: if both `goal === 0` AND `soul === 0`, angle is reported as `0` numerically with prose noting the special case.
13. **Length:** `sqrt(goal² + soul²) / sqrt(2)`, clamped to [0, 100]. Rounded to 1 decimal place for prose render.
14. Movement render fires for ALL `goalSoulGive` outputs regardless of `confidence` (per §13.8 tough-love MVP register).
15. Movement prose uses **geometric register as primary anchor** (`anchorRegister: 'geometric'`) for the standard case. Motion or warmer register may appear as secondary phrasing within the prose. The selected `anchorRegister` is reported in the evidence object.
16. Movement prose contains both narrative and numerical inline. Verified by audit: prose contains the literal degree symbol `°` AND the literal substring "length".

### Demographics gating

17. `lifeStageGate` derives from `(age, profession)` per this mapping:
    - `early_career`: age in {1990s, 2000s, 2010s} AND profession not in {Retired}
    - `mid_career`: age in {1970s, 1980s} AND profession not in {Retired, Self-employed/Entrepreneur}
    - `entrepreneur`: profession === "Self-employed/Entrepreneur" (regardless of age)
    - `late_career`: age in {1960s} AND profession not in {Retired}
    - `retirement`: age in {1940s, 1950s} OR profession === "Retired"
    - `unknown`: any case where age is `prefer_not_to_say`, `not_answered`, or missing
18. Movement prose varies by `lifeStageGate` — at minimum, the guidance sentence (the bridge/next-move sentence) differs across the 6 life-stage categories. Audit checks 4 distinct prose strings across the 4 new life-stage fixtures.
19. Demographics has zero impact on `angle`, `length`, or `anchorRegister`. Verified by audit: same composites + different demographics → same `angle` and `length`, only `prose` and `lifeStageGate` differ.

### Render integration

20. `renderMirror.ts` renders `## Movement` as a top-level section after the existing `## Closing Read` block when `constitution.goalSoulMovement?.prose` is present.
21. When Defensive Builder pattern fires AND quadrant is Striving, the Striving Closing Read prose renders WITH the Defensive Builder kicker appended as a final sentence. The kicker is NOT part of the `PROSE_TEMPLATES` constant; it is composed at render time.
22. When Generative Builder pattern fires, its kicker appears on Path · Gait card. The exact placement (kicker top, kicker bottom, badge) follows existing Path · Gait conventions in `lib/cardAssets.ts`.
23. `## Closing Read` and `## Movement` are independent sections — neither references the other in prose. Verified by audit: Movement prose does not mention "the closing read" or similar; Closing Read prose does not mention "the movement" or similar.

### Audit additions

24. `tests/audit/goalSoulGive.audit.ts` gains `patternAssertions(constitution, fixtureName)` and `movementAssertions(constitution, fixtureName)` functions. They run for every fixture and assert:
    - Pattern detector functions return correct boolean for each fixture (Generative fixture fires Generative Builder; Parallel Lives fixture fires Parallel Lives; True Gripping does NOT fire Defensive Builder because it's not Striving quadrant; etc.)
    - Movement output is non-null for every fixture
    - Movement prose contains `°` and "length"
    - Movement prose does not contain forbidden words (Goal/Soul/Vulnerability/the model/Parallel Lives/Defensive Builder/Generative Builder/Gripper/generativity)
    - Movement prose does not contain forbidden moralizing phrases ("show up for your own life", "you should be at", etc.)
    - Movement word count: 50–140 (slightly wider than Closing Read since the geometric register adds words)
    - Demographics-zero-derivation invariant: same composites + different demographics → same angle and length
25. New audit failure modes produce stderr in the format: `[FAIL] <fixture> — <assertion>: <detail>`.
26. CC-067 fixture-based quadrant assertions and CC-068 prose-quality assertions still pass unchanged.

### Build hygiene

27. `npx tsc --noEmit` exits 0.
28. `npm run lint` exits 0.
29. `npm run audit:goal-soul-give` exits 0 — all CC-067 + CC-068 + CC-070 assertions pass across all fixtures (7 existing + up to 4 new = up to 11 total).
30. `git status --short` shows only files in the Allowed-to-Modify list. No other changes.
31. No new dependencies. `package.json` and `package-lock.json` unchanged.
32. `data/questions.ts` unchanged (verify question count = 40).

## Report Back

Required sections in the CC's final report:

1. **Summary** — what was implemented in 6–10 sentences.
2. **Pattern catalog** — the three pattern detector implementations, including the heuristic firing conditions, with PASS/FAIL on each fixture.
3. **Movement output** — for each of the 11 fixtures, report `{angle, length, lifeStageGate, anchorRegister, confidence}` plus the rendered prose verbatim.
4. **Sample Closing Read + Defensive Builder kicker composition** — paste 1-2 examples showing how the kicker appends to the Striving template at render time.
5. **Audit pass/fail breakdown** — fixture-by-fixture, assertion-by-assertion. Include CC-067 + CC-068 + CC-070 layers.
6. **Demographics-invariance check** — confirm the angle/length math is identical across two fixtures with same composites and different demographics. Quote the test that proves it.
7. **Vocabulary register choices** — which register anchored each fixture's Movement prose, and why.
8. **Canon ambiguities** — any place the spec was unclear and a judgment call was made. Quote the spec, name the call.
9. **Files modified** — every path with line-count delta.
10. **Out-of-scope verification** — explicit `git status --short` confirming only Allowed-to-Modify files changed.
11. **Spec ↔ code drift report** — list anywhere `docs/goal-soul-give-spec.md` §9 or §13 diverged from your implementation, so a downstream CODEX can sync. Do NOT edit the spec.
12. **Recommendations for the next CC (visual plot)** — based on what you learned writing the Movement read, what does the chart need? SVG vs Recharts? Aspect ratio? How does the line render — origin to point with degree label, or just the point? What's the smallest visual that would carry the geometry without doubling the text?
13. **Open questions** — anything that surfaced that the spec did not anticipate.

---

## Method notes

**The heuristic patterns are this CC's experiment in derivation-over-measurement.** The spec §9 firing conditions name `building_motive_*` signals that don't exist; the heuristics here approximate those conditions using existing signal patterns. The audit will tell us how well the approximation works. If Defensive Builder under-fires or over-fires noticeably across the fixtures, that becomes the evidence case for CC-B (Q-Purpose-Building). If the heuristics carry, CC-B stays deferred. Audit honestly.

**The Movement read is the layer that converts the report from descriptive to prescriptive.** The §13.11 guardrails — no moralizing on a short line, no demographic-prescribed angles, tough-love has a floor — are the primary protection against the layer becoming therapy or coaching. Read those guardrails before drafting prose, not after.

**Demographics is interpolation only.** Per `demographic-rules.md` Rule 4, the math does not change. The acceptance §19 invariant test is the proof. Ship that test even if it feels redundant — it's the canon protection.

**The visual plot is the next CC, not this one.** When you find yourself wanting to add `<svg>` or describe a chart, stop and write text. The chart lands one CC later.
