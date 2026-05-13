# CODEX-MBTI-LABEL-INVESTIGATION — Why Surface Labels Don't Surface for Some Shapes

**Origin:** Family cohort testing 2026-05-09 surfaced a pattern: shapes with clear function-pair preferences sometimes have empty Surface labels in the Core Signal Map. Specifically:

- **Cindy (Jason's mom):** Se+Fe at function level (clearly ESFP per Jason's read) — Surface label "—" (empty)
- **Dan (Jason's dad):** Si+Ti at function level (Jungian preferences clear, but doesn't slot snugly into ISTJ or ISTP) — Surface label "—" (empty)
- **Jason:** Ni+Te (clearly INTJ) — Surface label "INTJ, provisional" ✓
- **Michele:** Ne+Fe (likely ENFP) — need to verify her Surface label cell

Three possibilities for the empty labels:
1. **Correct architectural humility** — the engine declines to produce an MBTI label when the broader profile doesn't fit a 4-letter archetype cleanly. This would be good design.
2. **Coverage gap in the heuristic** — the MBTI-derivation logic genuinely doesn't handle ESFP / ISTJ / ISTP cases as well as INTJ / ENFP. Real bug.
3. **Confidence threshold too conservative** — the heuristic requires more confirming signals than necessary, so it bails out for shapes that should produce labels.

This investigation diagnoses which it is and recommends whether/how to fix.

**Method discipline:** Read-only diagnostic. No code changes in this CC; just understand the logic and report findings. Fix decisions belong to a follow-on CC.

**Scope:** ~minutes. CODEX-scale.

---

## Embedded context

Per `feedback_function_pair_over_mbti_archetype.md`: the engine measures Jungian at TWO levels — function-pair (reliable) and MBTI archetype (secondary derivation, fires only when fit is snug). The empty Surface label may be CORRECT behavior. This investigation confirms which.

The engine has been measuring four McGovern family members. Jason said Cindy is "certainly an ESFP" — clear human read. Dan "may not fit snug in MBTI but certainly has Jungian preferences" — non-snug fit acknowledged.

If the engine correctly declines to label Dan but should label Cindy, that's a real coverage gap. If the engine correctly declines both, the empty labels are doing architectural humility right.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npx tsx -e "..."` (for diagnostic eval against family fixtures or live sessions)
- `git status`, `git diff`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/identityEngine.ts` — find the MBTI label derivation logic. Grep for "INTJ" or "provisional" or "mbtiCode" to locate it. Note the exact heuristic that decides when to produce a label vs return null/empty.
2. `lib/types.ts` — confirm the field name and type for the surface label.
3. The 24-fixture cohort — note which fixtures have surface labels and which don't. Compare against their Lens stack data.
4. The session data for Cindy and Dan in postgres or admin storage if accessible — to confirm what their Lens stack signals look like.

## Diagnostic Steps (REQUIRED)

### Step 1: Locate the heuristic

Find the function that derives MBTI label from Lens stack + other signals. Document its decision logic. Specifically:

- What signals does it consume? (Lens dominant, auxiliary, OCEAN, Compass, etc.)
- What thresholds does it apply?
- When does it return a label vs null?

### Step 2: Test against family cohort

Run the heuristic against:
- Jason canonical fixture (`ocean/07-jason-real-session`) — should produce "INTJ, provisional"
- Cindy's session data (latest April-May 2026) — produces empty per Jason's report
- Dan's session data (latest May 2026) — produces empty per Jason's report
- Michele's session data — verify which

For each, capture WHY the heuristic produced or declined to produce a label. Specific signal values and the threshold check that fired.

### Step 3: Diagnose

Three possible diagnoses:

**Diagnosis A: Correct architectural humility.** The heuristic correctly declines for non-snug shapes. Cindy's broader profile genuinely doesn't fit ESFP archetype as defined by the heuristic (e.g., her OCEAN scores are Conscientiousness 91 + Reactivity 63 — typical ESFP runs lower Conscientiousness, lower Reactivity; that mismatch may correctly trigger the decline). Dan similarly doesn't fit ISTJ/ISTP cleanly. **No fix needed; document the design.**

**Diagnosis B: Coverage gap.** The heuristic genuinely doesn't handle one or more types well. For example, it might overweight Reactivity for ESFP-detection (treating high Reactivity as disqualifying when it shouldn't be), or it might require dominant function score over a threshold that's calibrated for Ni-dominant shapes only. **Fix needed; recommend specific heuristic tightening in a follow-on CC.**

**Diagnosis C: Threshold too conservative.** The heuristic correctly identifies the function pair but requires more confirming signals than necessary before producing a label. **Fix is small — relax thresholds for cases where function-pair is clear AND OCEAN doesn't actively contradict.**

### Step 4: Recommend

Based on the diagnosis, recommend either:
- "Empty labels are correct; document the architectural humility canon" (if Diagnosis A)
- "Specific heuristic adjustments needed: ..." (if Diagnosis B or C)

If the recommendation is to fix, sketch the smallest change that would correctly produce ESFP for Cindy and ISTJ-or-ISTP for Dan WITHOUT incorrectly producing labels for genuinely non-snug shapes.

## Out of Scope (Do Not)

1. **Do NOT modify the heuristic in this CC.** Investigation only. Fix decisions and implementation belong to a follow-on CC.
2. **Do NOT modify any signal pool, intensity math, composite consumption, or other engine canon.**
3. **Do NOT modify CC-PROSE / CC-SYNTHESIS-1A / 1F / JUNGIAN / FIXTURES / CC-SYNTHESIS-3 canon.**
4. **Do NOT modify** the question bank, fixture files, MEMORY.md, AGENTS.md, docs/canon/, or spec memos.
5. **Do NOT add new dependencies.**
6. **Do NOT call any LLM API as part of this investigation.** Pure read-only code analysis + diagnostic eval.

## Acceptance Criteria

1. The MBTI-label derivation function is located and its logic documented in Report Back.
2. The diagnostic eval against four family member shapes is run; specific reasons for label-presence-vs-absence are documented.
3. Diagnosis classified as A, B, or C (with evidence).
4. Recommendation made (either "no fix; document" or "specific fix needed").
5. `npx tsc --noEmit` exits 0 (no code changes should have happened, but verify).
6. `git status --short` shows no source-code changes (this is read-only investigation).

## Report Back

1. **The heuristic** — paste the relevant code that decides MBTI label production. Document the decision logic in plain English.

2. **Per-family-member diagnostic** — for each of Jason / Michele / Cindy / Dan, name:
   - Lens dominant + auxiliary
   - OCEAN intensities
   - Other signals the heuristic consumes
   - Whether label was produced; if not, the specific check that prevented production

3. **Diagnosis** — A / B / C, with evidence.

4. **Recommendation** — either "labels are correct; here's the canon to document" OR "fix needed; here's the smallest change."

5. **If fix needed** — draft a one-paragraph CODEX-MBTI-LABEL-FIX summary that a follow-on CC could implement.
