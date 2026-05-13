# CODEX-MBTI-LABEL-FIX — Enforce Canonical Jung-Pair Constraint + Margin-Aware Tie-Check

**Origin:** CODEX-MBTI-LABEL-INVESTIGATION shipped 2026-05-09 with diagnostic findings:

- The MBTI Surface-label heuristic in `lib/jungianStack.ts` (`aggregateLensStack`, ~lines 181-250) computes dominant perceiver and dominant judger independently from Q-T1..Q-T8 ranking data, then composes a key like `"ni|te"` for MBTI_LOOKUP.
- The heuristic uses an exact-equality tie-check that drops confidence to "low" on ANY tie at the dominant slot.
- Architectural finding: the heuristic does NOT enforce the classical Jungian canonical-pair constraint. A user could land with `lens_stack.dominant = "ni"` and `lens_stack.auxiliary = "ti"` — but **Ni-Ti is not a valid Jungian stack**. Classical theory requires alternating perceiving/judging AND alternating introverted/extraverted orientations.
- The current behavior produces `mbtiCode = ""` for non-canonical pairs (because "ni|ti" isn't in MBTI_LOOKUP) — which is downstream-correct (no MBTI label appears) — but the underlying `lens_stack` may store a non-canonical pair, which propagates to user-facing prose ("the pattern-reader supported by the coherence-checker"). That's the architectural concern.

This fix enforces the canonical-pair constraint as a HARD filter on auxiliary candidates, plus adds Codex's recommended margin-aware tie-check for cases where canonical pair candidates tie.

**Method discipline:** Surgical fix in one function. ~15-25 lines of code change. Conservative — Dan's empty Surface label preserved (his ties are wide), Jason's fixture cleanly produces INTJ via canonical-pair filtering, Cindy's case correctly handled by either path.

**Scope:** ~minutes executor time. CODEX-scale.

**Out-of-scope (explicitly deferred to follow-on CCs):**
- **Loop detection** — when a user's data shows non-canonical signals stronger than canonical aux (e.g., Ni-dominant with Ti ranking higher than Te), that's a "loop pattern" diagnostic finding (per the Ni-Ti loop concept in classical Jungian theory). Surfacing this as a Pattern in motion is meaningful but architecturally separate from MBTI label fix. Belongs in a follow-on CODEX-MBTI-LOOP-DETECTION as part of the Grip taxonomy work (per `project_grip_taxonomy_50_degree_life.md` in Cowork memory; embedded inline below for executor reference).
- **OCEAN / Compass / other-signal tie-breakers** — using non-Q-T data to break ties at the canonical-pair-aux slot. Architecturally couples MBTI derivation to other engine outputs. Defer until/unless cohort testing shows the canonical-pair fix is insufficient.

---

## Embedded context (CC executor environments don't see Cowork memory)

**The 8 canonical Jungian stacks** (the only valid dominant + auxiliary pairings in classical Jung / MBTI theory):

| Dominant | Valid auxiliary | Canonical type code |
|---|---|---|
| Ni (introverted intuition) | Te or Fe (extraverted judging) | INTJ (Ni-Te) / INFJ (Ni-Fe) |
| Ne (extraverted intuition) | Ti or Fi (introverted judging) | ENTP (Ne-Ti) / ENFP (Ne-Fi) |
| Si (introverted sensing) | Te or Fe (extraverted judging) | ISTJ (Si-Te) / ISFJ (Si-Fe) |
| Se (extraverted sensing) | Ti or Fi (introverted judging) | ESTP (Se-Ti) / ESFP (Se-Fi) |
| Ti (introverted thinking) | Ne or Se (extraverted perceiving) | INTP (Ti-Ne) / ISTP (Ti-Se) |
| Te (extraverted thinking) | Ni or Si (introverted perceiving) | ENTJ (Te-Ni) / ESTJ (Te-Si) |
| Fi (introverted feeling) | Ne or Se (extraverted perceiving) | INFP (Fi-Ne) / ISFP (Fi-Se) |
| Fe (extraverted feeling) | Ni or Si (introverted perceiving) | ENFJ (Fe-Ni) / ESFJ (Fe-Si) |

The constraint: **dominant + auxiliary must alternate perceiving/judging AND alternate introverted/extraverted orientation.** Pairings like Ni-Ti, Si-Ti, Ti-Si, etc. are not valid stacks — they represent loop patterns or measurement noise, not canonical types.

**Why the fix matters:** the engine should produce ONLY canonical pairs in `lens_stack.dominant` and `lens_stack.auxiliary`. Non-canonical pair detection is a different concern (loop pattern → diagnostic finding) and belongs in a separate CC.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npx tsx tests/audit/synthesis1Finish.audit.ts`
- `npx tsx tests/audit/synthesis3.audit.ts`
- `npx tsx tests/audit/jungianCompletion.audit.ts`
- `npx tsx tests/audit/fixturesSiTiFiFe.audit.ts`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npx tsx tests/audit/mbtiLabelFix.audit.ts` (the new audit added by this CC)
- `git status`, `git diff`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/jungianStack.ts` — locate `aggregateLensStack` (around lines 181-250 per the prior investigation). Read the full function to understand current logic. Identify:
   - How `dominantPerceiving` and `dominantJudging` are computed
   - How `lens_stack.dominant` and `lens_stack.auxiliary` are assigned (are they direct `dominantPerceiving + dominantJudging`, or is there a head-to-head comparison?)
   - Where the tie-check fires
   - Where MBTI_LOOKUP is queried
2. The STACK_TABLE definition — find where the canonical 8 dominant + valid-auxiliary mappings are encoded. The investigation report says STACK_TABLE exists; this fix uses it as the canonical-pair source of truth.
3. `lib/coreSignalMap.ts` line 99-100 — the Surface-label render gate. Confirm it's `confidence === "high" && mbtiCode` (per investigation). No changes needed here.
4. `lib/types.ts` — confirm field types for `lens_stack.dominant`, `lens_stack.auxiliary`, `confidence`, `mbtiCode`.
5. The 24-fixture cohort. After the fix, run cohort regression — fixtures previously labeled should stay labeled identically (or document why one changes).

## Allowed to Modify

### Fix 1 — Enforce canonical-pair constraint as a HARD filter on auxiliary

**File:** `lib/jungianStack.ts` (or wherever `aggregateLensStack` lives).

**The change:**

After identifying the dominant function (the lowest-avg-rank function across all 8 functions), filter the auxiliary candidates to ONLY those that form a canonical Jung stack with the dominant. Pick lowest-avg from the filtered set.

Conceptually:

```ts
// 1. Find THE dominant: the function with the lowest avg rank across ALL 8.
const allFunctions = [...perceivers, ...judgers].sort((a, b) => a.avg - b.avg);
const dominant = allFunctions[0];

// 2. Determine the canonical aux candidates for this dominant.
//    Per STACK_TABLE / canonical Jungian theory:
//    - If dominant is perceiving (Ni/Ne/Si/Se), aux candidates are the OPPOSITE-orientation judgers.
//    - If dominant is judging (Ti/Te/Fi/Fe), aux candidates are the OPPOSITE-orientation perceivers.
const validAuxCandidates = STACK_TABLE[dominant.fn]; // e.g., for "ni": ["te", "fe"]

// 3. From the user's signal data, pick the lowest-avg-rank aux from validAuxCandidates only.
const auxCandidatesWithAvgs = validAuxCandidates.map(fn => ({ fn, avg: avgRankFor(fn) }));
auxCandidatesWithAvgs.sort((a, b) => a.avg - b.avg);
const auxiliary = auxCandidatesWithAvgs[0];

// 4. Set lens_stack.dominant = dominant.fn, lens_stack.auxiliary = auxiliary.fn.
//    Result is GUARANTEED to be a canonical Jungian stack.
```

This eliminates the possibility of `lens_stack` storing non-canonical pairs (Ni-Ti, Si-Ti, etc.). The MBTI_LOOKUP key derived from this canonical pair will always hit one of the 16 valid types.

**Verification step inside this fix**: assert that the resulting `dominant + auxiliary` pair is in STACK_TABLE (defensive — should always be true after the fix, but the assertion prevents silent regressions).

### Fix 2 — Margin-aware tie-check on canonical-pair candidates

**Same file**, immediately after the canonical-pair selection in Fix 1.

**The change:**

Replace the current exact-equality tie-check with a margin-aware version:

```ts
// Drop confidence to "low" if either:
//   (a) the dominant function's avg is within MARGIN of the runner-up's avg
//       (across ALL 8 functions, not just the canonical aux candidates)
//   (b) the auxiliary function's avg is within MARGIN of the next canonical aux
//       (e.g., for Ni-dominant: Te avg vs Fe avg — within margin → low)

const MARGIN = 0.5; // tunable; conservative starting point

const dominantRunnerUp = allFunctions[1];
const auxRunnerUp = auxCandidatesWithAvgs[1];

const dominantTooTight = (dominantRunnerUp.avg - dominant.avg) < MARGIN;
const auxTooTight = auxRunnerUp ? (auxRunnerUp.avg - auxiliary.avg) < MARGIN : false;

const confidence: "high" | "low" = (dominantTooTight || auxTooTight) ? "low" : "high";
```

**Threshold rationale:** 0.5 = "user's runner-up is at least half a rank-position away from the dominant." For Q-T data with avg ranks like 1.0, 1.5, 2.0, etc., a 0.5 margin filters out exact ties (both at 1.5) AND near-ties (1.5 vs 1.75) while preserving clear-margin shapes (1.0 vs 1.5). Tunable as `MBTI_TIE_MARGIN` constant for cohort-feedback adjustment.

**Edge case:** when `dominantRunnerUp` is from the SAME class as `dominant` (e.g., both perceivers — Ni at 1.0 vs Ne at 1.5), the margin check still applies. This is correct — if Ni and Ne are within 0.5, the user's perceiving preference is genuinely ambiguous and confidence should drop to "low."

### Fix 3 — Audit assertions

**New file:** `tests/audit/mbtiLabelFix.audit.ts`. Add assertion block (run across all 24 fixtures + 4 new Si/Ti/Fi/Fe fixtures = 28 total):

- `mbti-fix-canonical-pair-only`: For every fixture's `lens_stack`, the (dominant, auxiliary) pair must be in STACK_TABLE. Non-canonical pairs (Ni-Ti, Si-Ti, etc.) must NEVER appear.
- `mbti-fix-confidence-correctly-gated`: For every fixture, if `confidence === "high"`, then both (a) dominant runner-up margin ≥ 0.5 AND (b) aux runner-up margin ≥ 0.5 (where the aux runner-up is computed against canonical-pair candidates only).
- `mbti-fix-mbticode-matches-stack`: For every fixture with `confidence === "high"`, `mbtiCode` is set AND matches the `dominant + auxiliary` lookup in MBTI_LOOKUP.
- `mbti-fix-mbticode-empty-when-low`: For every fixture with `confidence === "low"`, `mbtiCode` may still be set (per current behavior) but the render gate (in `coreSignalMap.ts`) correctly produces empty Surface label.
- `mbti-fix-cohort-regression-no-spurious-labels`: Compare pre-fix vs post-fix label counts. The fix should produce the SAME OR MORE labels (never fewer, except when a non-canonical pair was previously being constructed and is now correctly rejected). Document any cohort changes.
- `mbti-fix-jason-fixture-now-labels`: `ocean/07-jason-real-session` should now produce `mbtiCode: "INTJ"` AND `confidence: "high"` (the te/ti tie that previously dropped confidence is resolved by the canonical-pair filter — Te wins as the only canonical aux for Ni; Ti is no longer a candidate).
- `mbti-fix-non-canonical-rejected`: Construct a synthetic test case where Q-T data would produce Ni-dominant + Ti-as-lowest-judger; assert the heuristic correctly produces Ni-Te (not Ni-Ti) by filtering Ti out of the aux candidate set.

## Out of Scope (Do Not)

1. **Do NOT add OCEAN, Compass, or other-signal tie-breakers.** This fix uses ONLY Q-T1..Q-T8 ranking data, same as the current heuristic. Architectural decoupling preserved.
2. **Do NOT add loop detection.** When a user's Q-T data shows non-canonical signals (e.g., Ni-dominant with Ti ranking higher than Te), this fix correctly REJECTS the non-canonical aux and picks Te. The fact that Ti ranked higher than Te is meaningful diagnostic information (potential Ni-Ti loop pattern) — but surfacing that as a Pattern in motion belongs in CODEX-MBTI-LOOP-DETECTION (separate follow-on, integrates with Grip taxonomy work). Don't add loop-detection prose, fields, or surfaces in this CC.
3. **Do NOT modify STACK_TABLE.** It's the canonical source of truth for valid Jungian stacks.
4. **Do NOT modify the Surface-label render gate** in `lib/coreSignalMap.ts`. Still requires `confidence === "high"` AND `mbtiCode` non-empty.
5. **Do NOT modify any signal pool, intensity math, composite consumption.**
6. **Do NOT modify CC-PROSE / CC-SYNTHESIS-1A / 1F / 3 / JUNGIAN / FIXTURES canon.**
7. **Do NOT modify** the question bank, fixture files, MEMORY.md, AGENTS.md, docs/canon/, or spec memos.
8. **Do NOT touch existing audit assertions** unless the fix legitimately changes the expected behavior. If any existing assertion breaks because the canonical-pair filter changes a fixture's lens_stack, document it explicitly in Report Back as a SHOULD-CHANGE regression and update the assertion deliberately. If an existing assertion breaks unexpectedly, that's a real bug — investigate and report.
9. **Do NOT introduce new dependencies.**
10. **Do NOT call any LLM API.** Pure structural code change.

## Acceptance Criteria

1. `aggregateLensStack` enforces canonical-pair constraint via STACK_TABLE filter on auxiliary candidates. `lens_stack.dominant + lens_stack.auxiliary` is always a canonical Jungian stack.
2. Margin-aware tie-check at MARGIN = 0.5 (exposed as tunable constant `MBTI_TIE_MARGIN`).
3. All 7+ new `mbti-fix-*` audit assertions pass.
4. Cohort regression: no fixture loses a label that it previously had AND was canonically valid. `ocean/07-jason-real-session` gains the INTJ label per the canonical-pair filter resolving its te/ti tie.
5. Existing audit assertions still pass (CC-PROSE / CC-SYNTHESIS-1A / 1F / 3 / JUNGIAN / FIXTURES / OCEAN / Goal/Soul/Give). If any assertion legitimately changes (e.g., a fixture's lens_stack flipped from non-canonical to canonical), document it and update the assertion deliberately.
6. `npx tsc --noEmit` exits 0.
7. `npm run lint` exits 0.
8. `git status --short` shows only `lib/jungianStack.ts` modified + new `tests/audit/mbtiLabelFix.audit.ts` + any audit-assertion updates that are deliberate.

## Report Back

1. **Summary** in 3-5 sentences. Confirm canonical-pair constraint enforced, margin-aware tie-check shipped, MARGIN value chosen.

2. **Pre-fix vs post-fix label distribution** across the 28-fixture cohort:
   - How many fixtures had Surface labels pre-fix
   - How many post-fix
   - Specific fixtures that gained labels (with the pair they now produce, e.g., "ocean/07 now produces INTJ via Te tie-break over Ti")
   - Specific fixtures that lost labels (should be zero unless previously holding non-canonical pair)
   - Specific fixtures that changed their lens_stack pair (e.g., from non-canonical Ni-Ti to canonical Ni-Te) — these should be documented even if the Surface label wasn't affected

3. **Family fixture verification** (if family fixtures exist or can be inferred from cohort proxies):
   - `ocean/07-jason-real-session`: should now produce "INTJ, provisional" via canonical-pair filter
   - Cindy-shape proxy fixtures (Se+Fe): should produce "ESFP" if margin clears, empty if Fe/Fi tie within margin
   - Dan-shape proxy fixtures (Si+Ti at function level): should produce empty Surface label (the Ti is filtered out as non-canonical aux for Si-dominant; the resulting Si-Te or Si-Fe pair may still hit margin tie if Te/Fe rank similarly)
   - Michele-shape proxy (Ne+Fe): should produce "ENFP" if data is clean

4. **Edge cases checked:**
   - Synthetic Ni-dominant + Ti-as-lowest-judger (NOT canonical) → assert resolved to Ni-Te (canonical) with Te as aux
   - Synthetic Ne-dominant + Te-as-lowest-judger (NOT canonical) → assert resolved to Ne-Ti or Ne-Fi (canonical)
   - Synthetic dominant tie (e.g., Ni and Ne both at 1.0) → assert margin check fires, confidence drops to "low"

5. **Audit pass/fail breakdown** — including all new `mbti-fix-*` assertions, all prior assertion suites' regression status, any deliberately-updated assertions documented.

6. **Tunability verification** — confirm `MBTI_TIE_MARGIN` constant is exposed in `lib/jungianStack.ts` for future cohort-feedback adjustment.

7. **Out-of-scope verification** — git status; explicit confirmation that signal pool, intensity math, STACK_TABLE, render gate, fixture data, OCEAN/Compass/other-signal tie-breakers, and loop-detection are all untouched.

8. **Recommendation for follow-on CODEX-MBTI-LOOP-DETECTION** (queued, not in this CC): if the fix surfaces fixtures where Q-T data shows strong non-canonical signals (e.g., a Ni-dominant fixture with Ti ranking higher than Te), name them. These are candidates for the loop-detection layer that will come later (per `project_grip_taxonomy_50_degree_life` canon — non-canonical patterns become Grip diagnostic findings, integrated with the Primal Question taxonomy). Don't act on them in this CC; just flag.
