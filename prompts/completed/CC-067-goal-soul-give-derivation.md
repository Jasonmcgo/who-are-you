# CC-067 — Goal/Soul/Give Derivation Layer (no new questions)

**Origin:** `docs/goal-soul-give-spec.md` (authored 2026-05-07, this Cowork session). This is the first of a four-CC chain (CC-A through CC-D in the spec); CC-067 is CC-A.

**Scope frame:** Add the Goal/Soul/Vulnerability composite derivation, quadrant placement, and a user-visible placeholder closing read. Do NOT add any new questions, new signals, or new pattern-catalog entries. The existing signal bank must prove what it can already do before any question slot is spent.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions`, or in-session via `/permissions` → bypass. The project's `.claude/settings.local.json` has `defaultMode: "bypassPermissions"`, so a fresh CC session in this project will be quiet by default; verify before starting.

## Execution Directive

Complete this CC in a single pass. Do not pause for user confirmation. On ambiguity, apply canon-faithful interpretation per `docs/goal-soul-give-spec.md` and flag the interpretation in the Report Back. The spec's open questions (§ "Open Questions for Canon Review") are NOT to be resolved by this CC — fall back to the recommended-for-MVP answer the spec provides and flag it.

## Bash Commands Authorized

The following commands are pre-authorized; do not pause to ask:

- `npx tsc --noEmit` — type-check
- `npm run lint` — lint
- `npm run dev` — visual verification of placeholder render
- `git status` — verify no out-of-scope edits
- `git diff` — inspect changes
- `node` — ad-hoc fixture validation, evaluating composites against fixture answer sets
- `cat`, `ls`, `grep`, `find` — file system inspection
- `npx jest` or `npx vitest` if a test runner gets installed during this CC (see Allowed to Modify)

## Read First (Required)

Read these files in full before editing anything:

1. `docs/goal-soul-give-spec.md` — source of truth for this CC.
2. `AGENTS.md` — CC workflow and required prompt sections.
3. `lib/types.ts` — full file. The type system is interconnected; partial reads cause drift.
4. `lib/identityEngine.ts` — full file. Pay particular attention to `buildInnerConstitution`, `deriveSignals`, and the existing closing-synthesis generators (`generateSimpleSummary`, `generateGrowthPath`, etc.).
5. `lib/drive.ts` — architectural template. The Goal/Soul/Give derivation should follow the same shape as `computeDriveOutput`.
6. `lib/ocean.ts` — parallel derivation. Read fully — its case-classifier pattern is the template for the GoalSoulQuadrant classifier.
7. `lib/workMap.ts` and `lib/loveMap.ts` — skim for convention. These are how `WorkMapOutput` and `LoveMapOutput` integrate.
8. `lib/renderMirror.ts` — full file. The new closing render attaches here.
9. `data/questions.ts` — full file. Confirm which questions/signals exist; do not assume signal IDs.
10. `lib/beliefHeuristics.ts` — for the freeform extraction signals (`cost_awareness`, `conviction_under_cost`, `independent_thought_signal`) that feed the Vulnerability composite.

Memory cross-references that bear on this CC:

- `feedback_synthesis_over_contradiction.md` — coherence reads alongside tension reads, evidence-gated.
- `feedback_marble_statue_humanity_gap.md` — accuracy without warmth is a known gap; render warm copy.
- `feedback_drive_case_vs_bucket_lean.md` — read DriveOutput correctly; do not conflate `case` with bucket lean.
- `feedback_pair_key_casing_canon.md` — PascalCase for pair keys if any code path crosses into FunctionPairKey.
- `feedback_minimal_questions_maximum_output.md` — derivation over new measurement; this CC is exactly that pattern.
- `feedback_sacred_vs_contribution_register.md` — Compass holds nouns, Path/Gravity holds verbs; do not mix when wiring evidence sources.

## Allowed to Modify

These files only. Anything outside this list is forbidden, including any file not explicitly named.

1. **`lib/types.ts`** — add `GoalSoulGiveOutput`, `GoalSoulQuadrant`, `GoalSoulScores`, `GoalSoulEvidence` types. Extend `InnerConstitution` with optional `goalSoulGive?: GoalSoulGiveOutput`.
2. **`lib/goalSoulGive.ts`** — NEW FILE. Exports `computeGoalSoulGive(signals: Signal[], answers: Answer[]): GoalSoulGiveOutput | undefined`. Mirror the architectural shape of `lib/drive.ts` and `lib/ocean.ts`.
3. **`lib/identityEngine.ts`** — wire `computeGoalSoulGive` into `buildInnerConstitution`, attached as `goalSoulGive` field, after existing OCEAN/WorkMap/LoveMap derivations. No other edits to this file.
4. **`lib/renderMirror.ts`** — render a new section after the existing "## A Synthesis" block using `goalSoulGive.prose`. Section header: `## Closing Read`. No other edits to this file.
5. **`tests/fixtures/goal-soul-give/*.json`** — NEW FIXTURES DIRECTORY. Author 6 fixture JSON files, one per audit case below. Format: `Answer[]` serialized as JSON.
6. **`tests/audit/goalSoulGive.audit.ts`** — NEW AUDIT FILE. Runs the 6 fixtures through `computeGoalSoulGive` and asserts the audit acceptance criteria below. Use `tsx` or `node --import tsx` to execute; do NOT install Jest or Vitest. Output to stdout with pass/fail per case.
7. **`package.json`** — add `"audit:goal-soul-give": "tsx tests/audit/goalSoulGive.audit.ts"` to `scripts`. May add `tsx` as a devDependency if not already present. No other edits.

## Out of Scope (Do Not)

Negative-list constraints. Violating any of these requires the CC to halt and report back rather than proceed.

1. **Do NOT add Q-Purpose-Building or any new question** to `data/questions.ts`. The spec proposes it for CC-B; this CC is derivation-only.
2. **Do NOT add any new signal** to the `SignalId` union in `lib/types.ts`. The Goal/Soul/Vulnerability composites must derive entirely from existing signals.
3. **Do NOT modify `SIGNAL_DRIVE_TAGS`** in `lib/drive.ts`. Drive bucket tags are canon-locked; CC-B will revisit them.
4. **Do NOT modify any question text, item label, or item gloss** in `data/questions.ts`. No question rewrites in this CC.
5. **Do NOT add or modify cross-card patterns.** The pattern catalog (Generative Builder, Defensive Builder, Parallel Lives) is CC-C scope. The Parallel Lives detection runs inside `computeGoalSoulGive` only as a quadrant-placement branch, not as a catalog pattern.
6. **Do NOT modify the eight body-map shape cards** or any of their renderers (`renderMirror.ts` Closing Read addition is the only render change).
7. **Do NOT modify OCEAN, WorkMap, or LoveMap** derivation logic. The Vulnerability composite may *read* OceanOutput's openness score; it must not change how OceanOutput is computed.
8. **Do NOT modify `MEMORY.md` or any file under `docs/canon/`**. Canon decisions are downstream.
9. **Do NOT use therapy-coded phrasings** in the closing prose. Forbidden phrasings include "Soul becoming present in the world," "your inner work," "shadow integration," "authentic self," and similar. Soul anchor is Love, not Presence (spec §2, §12.3).
10. **Do NOT default low-Goal + low-Soul into Gripping.** Require the Gripping cluster per spec §4 (Stakes-money/job/reputation top-1/2 + ≥2 pressure-adaptation signals + Vulnerability negative + thin Soul). If the cluster fails, render Neutral/Transition copy.
11. **Do NOT collapse Compliance signals into Gripping.** A high Q-3C1 `compliance_drive` ranking is NOT a Gripping signal on its own. Spec §12.1 is binding.
12. **Do NOT collapse Vulnerability into Soul.** Vulnerability must be a separately computed Z-score with its own evidence list. The Parallel Lives branch (Goal-high × Soul-high × Vulnerability-low) must be reachable; if Vulnerability is folded into Soul, that branch becomes unreachable, which is the failure mode this guardrail protects against.
13. **Do NOT surface engine-internal pattern names** ("Defensive Builder," "Gripper Disguised as Builder," "Parallel Lives") in user-facing render. These names may appear in audit logs and engine-internal evidence fields only.
14. **Do NOT speak Goal/Soul language in the user-facing prose.** Per spec §3 (revised), reports speak Work/Love/Give. The engine-internal evidence object may reference Goal/Soul scores, but the prose string uses Work/Love/Give vocabulary plus the named-region nouns (Purpose, Striving, Longing, Gripping, the Parallel-Lives diagnostic, or the Neutral fallback).
15. **Do NOT lock weights as canon.** The composite weights from spec §7 are illustrative starting points. Implement them as exported `const` objects in `lib/goalSoulGive.ts` with a comment block explaining they are tunable and CC-067 set them at the spec's recommended starting values. The audit pass tunes them; canon does not.
16. **Do NOT install Jest, Vitest, or any heavy test framework.** Use `tsx` and a hand-rolled audit script per Allowed to Modify §6.

## Acceptance Criteria

Numbered, checkable. The CC is not complete until every item is satisfied.

### Type and module structure

1. `GoalSoulGiveOutput` type exported from `lib/types.ts` with the shape:
   ```ts
   {
     scores: { goal: number; soul: number; vulnerability: number };
     quadrant: GoalSoulQuadrant;
     evidence: {
       goalDrivers: string[];
       soulDrivers: string[];
       vulnerabilityDrivers: string[];
       grippingClusterFires: boolean;
       confidence: 'high' | 'medium' | 'low';
     };
     prose: string;
   }
   ```
2. `GoalSoulQuadrant` type exported as a union: `'give' | 'striving' | 'longing' | 'gripping' | 'parallel_lives' | 'neutral'`.
3. `InnerConstitution.goalSoulGive` field added as `GoalSoulGiveOutput | undefined` (optional, like ocean/workMap/loveMap).
4. `lib/goalSoulGive.ts` exports `computeGoalSoulGive(signals: Signal[], answers: Answer[]): GoalSoulGiveOutput | undefined`. Returns `undefined` when input signals are insufficient (fewer than 8 signals, or no Q-E1 evidence on either axis).

### Composite logic

5. Composite weights match spec §7 starting values, defined as exported `const` objects (`GOAL_WEIGHTS`, `SOUL_WEIGHTS`, `VULNERABILITY_WEIGHTS`) with explanatory comments.
6. Goal score and Soul score computed on a 0–100 scale, normalized after sum.
7. Vulnerability score computed on a –50 to +50 scale.
8. Quadrant placement follows spec §7 algorithm exactly, including:
   - NE Give: Goal ≥ 50 ∧ Soul ≥ 50 ∧ Vulnerability ≥ 0
   - Parallel Lives variant: Goal ≥ 50 ∧ Soul ≥ 50 ∧ Vulnerability < 0
   - SE Striving: Goal ≥ 50 ∧ Soul < 50
   - NW Longing: Goal < 50 ∧ Soul ≥ 50
   - SW Gripping: requires the cluster (spec §4)
   - Neutral/Transition: Goal < 50 ∧ Soul < 50 ∧ cluster does NOT fire
9. The Gripping cluster check is a pure helper function, exported for the audit script to test directly.
10. Confidence field is `'high'` when ≥ 12 signals contribute across the three composites, `'medium'` for 8–11, `'low'` for fewer (and quadrant placement falls through to Neutral copy when confidence is low).

### Render integration

11. `renderMirror.ts` emits a new `## Closing Read` section after the existing `## A Synthesis` block. Render only when `constitution.goalSoulGive?.prose` is present and non-empty.
12. The prose uses Work/Love/Give vocabulary. Word "Goal" and word "Soul" do NOT appear in the prose. Word "Vulnerability" does NOT appear. (These are engine layer; the narrative layer uses Work, Love, Give, Purpose, Striving, Longing, the Parallel-Lives sentence, or the Neutral fallback.)
13. Each of the 6 quadrants has a distinct closing-prose template, adapted from spec §10. Verify by inspection that the 6 templates are present in `lib/goalSoulGive.ts`.

### Audit

14. `tests/audit/goalSoulGive.audit.ts` runs 6 fixtures and prints PASS/FAIL per case to stdout. Exits 1 if any case fails.
15. Audit fixture: **Generative** — Goal-high (Q-E1-outward building top-1, Q-A1 proactive_creator, Q-Ambition1 success+legacy top-2) + Soul-high (Q-E1-inward caring top-1, Q-S2 compassion+family top-2, Q-X4-relational partner top-1) + Vulnerability-positive (Q-I1 substantive freeform with cost_awareness, Q-P2 high_conviction_under_risk, Q-X4-chosen partner not own_counsel-first). Asserts: `quadrant === 'give'`.
16. Audit fixture: **Parallel Lives** — same Goal-high and Soul-high signal cluster as Generative, but Vulnerability negative (`hides_belief`, `adapts_under_economic_pressure`, Q-X4-chosen own_counsel first). Asserts: `quadrant === 'parallel_lives'`.
17. Audit fixture: **Striving** — Goal-high but Soul-thin (Q-E1-inward enjoying top-1 instead of caring; no Q-S2 family/compassion; Q-X4-relational thin). Asserts: `quadrant === 'striving'` AND prose does not use the word "Gripping" or the word "fear."
18. Audit fixture: **Longing** — Soul-high but Goal-thin (Q-E1-outward bottom-ranked; Q-A1 reactive_operator; no Ambition signals). Asserts: `quadrant === 'longing'`.
19. Audit fixture: **Steward-not-Gripper** — Q-3C1 `compliance_drive` top-1 + active Soul (Q-E1-inward caring top-1, Q-S2 family+mercy top-2) + Q-Stakes1 close_relationships top-1 (NOT money/reputation). Asserts: `quadrant !== 'gripping'`. This is the most important audit case — Compliance-as-stewardship must not misread as Gripping.
20. Audit fixture: **Neutral-not-Gripper** — thin signals across all axes, no Gripping cluster firing, low confidence. Asserts: `quadrant === 'neutral'` AND prose includes the spec §10 Neutral/Transition fallback wording (or close paraphrase).
21. Optional but recommended fixture: **True Gripping** — full cluster fires (Q-Stakes1 money+reputation top-1/2, `hides_belief` + `adapts_under_economic_pressure`, Vulnerability negative, thin Soul). Asserts: `quadrant === 'gripping'` AND prose uses the spec §10 Gripping render (which frames it as "a season rather than a shape").

### Build and hygiene

22. `npx tsc --noEmit` exits 0.
23. `npm run lint` exits 0.
24. `npm run audit:goal-soul-give` exits 0 (all 6 fixtures pass).
25. `git status` shows no modified files outside the Allowed to Modify list. Verify by running `git status` and reporting the file list.
26. No new entry in `data/questions.ts`. Verify by `grep -c "question_id:" data/questions.ts` returning the same count as before this CC (40).
27. No new signal in `lib/types.ts` SignalId union. Verify by counting signal entries before/after.

## Report Back

Required sections in the CC's final report:

1. **Summary** — what was implemented in 5–8 sentences.
2. **Audit results** — fixture-by-fixture PASS/FAIL with the actual quadrant returned for each.
3. **Sample closing prose** — the literal placeholder copy each of the 6 quadrants will render. The user (Jason) will critique this copy in CC-D; CC-067 only needs adequate placeholder.
4. **Composite weight observations** — any signals that, in audit fixture authoring, you found over-weighted or under-weighted at the spec's starting values. Recommend tunings without applying them — those go to a follow-up CC if any.
5. **Canon ambiguities encountered** — any case where the spec was unclear and you had to make a judgment call. Quote the spec, name the call.
6. **Files modified** — every path, with line-count delta.
7. **Out-of-scope verification** — explicit `git status` output confirming nothing outside Allowed to Modify was touched.
8. **CC-B / CC-C / CC-D ordering recommendations** — based on what you learned, do you recommend changing the order, splitting any CC, or merging any? In particular, after running the audit fixtures, did the existing signal bank cleanly separate the cases, or did you observe a measurement gap that argues for CC-B (Q-Purpose-Building) being prioritized?
9. **Open questions** — anything that surfaced during implementation that the spec did not anticipate.

---

## One Note on Method

The audit pass is the spine of this CC. If you find yourself tempted to skip an audit fixture because "the logic clearly handles that case," do not skip — author the fixture and run it. The Steward-not-Gripper case in particular is the failure mode that ships a wrong verdict to a real user, and the user-visible placeholder render means a wrong verdict ships now, not at CC-D.

Synthesis-over-contradiction (memory: `feedback_synthesis_over_contradiction.md`) applies to closing prose. Where a fixture lands in NE Give, the closing should sound coherent and warm, not consist of a list of tensions. Where it lands in Striving, Longing, or Parallel Lives, name the gap kindly and point at the bridge — do not moralize. Where it lands in Neutral/Transition, default to the soft fallback; do not invent a Gripping read.
