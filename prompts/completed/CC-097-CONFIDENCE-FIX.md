# CC-097-CONFIDENCE-FIX — Class A Sensing-Driver Confidence Bug

## Objective

Per the four-class routing failure taxonomy in `feedback_se_fi_attractor_canon.md` and the 2026-05-17 cohort calibration data in `project_cohort_calibration_2026_05_17.md`: **four of seven cohort users with sensing-driver shapes are flagging ⚠ low Lens confidence when their driver+aux detection is correct.**

| User | True shape | Engine driver+aux | Lens confidence | Verdict |
|---|---|---|---|---|
| Daniel | ISTJ (Si-Te) | Si + Te ✓ | ⚠ low ✗ | wrong-low |
| Cindy | ESFP (Se-Fi) | Se + Fi ✓ | ⚠ low ✗ | wrong-low |
| Harry | Si-Fe-Ne-Te (non-canonical) | Si + Fe ✓ | ⚠ low ✗ | wrong-low |
| Ashley | INFJ-latent / Se-Fi-surface | Se + Fi (surface) | ⚠ low | **correct** (Class D mirror-axis ambiguity is real) |

**The bug:** Three of four (Daniel/Cindy/Harry) are clean stereotypical shapes that should read high confidence. They're systematically dropping to low.

## Root Cause Hypothesis

The Lens confidence calc lives in `lib/jungianStack.ts` lines 260–268:

```typescript
const dominantTooTight =
  dominantRunnerUp !== undefined &&
  dominantRunnerUp.avg - dominant.avg < MBTI_TIE_MARGIN;
const auxTooTight =
  !isFinite(auxiliary.avg) ||
  (auxRunnerUp !== undefined &&
    auxRunnerUp.avg - auxiliary.avg < MBTI_TIE_MARGIN);
const confidence: "high" | "low" =
  dominantTooTight || auxTooTight ? "low" : "high";
```

`dominantTooTight` compares the dominant function's average rank against the **runner-up perceiving function** (for Si-driver, that's the next-highest perceiving function in the user's Q-T rankings — likely Ne, since Ne is the canonical opposite-attitude pair).

**The problem:** For a developed Si-driver shape (Harry's Si-Fe-Ne-Te with strong Ne tertiary), Ne is *expected* to be close to Si in the ranking. That's normal Jungian development, not signal ambiguity. The current `dominantTooTight` logic treats developed-shadow integration as low-confidence rather than recognizing it as a healthy stack pattern.

Same for Se-driver with developed Ni-tertiary (Cindy possibly). Same for Si-Te with developed-Ne (Daniel).

**Why intuitive drivers don't trip this:** Jason (Ni-driver) renders high confidence. INTJ stack is Ni-Te-Fi-Se. The runner-up perceiving function (Se) is at the *inferior* position — naturally distant from Ni in the rankings. So `dominantTooTight` doesn't fire for healthy INTJ.

For Si/Se drivers, the runner-up perceiving function is at *tertiary* position (developed function), which Jungian theory predicts will be close. So the current logic conflates "developed shape" with "ambiguous shape."

## Fix Direction (Investigate + Choose)

Three candidate fixes; executor investigates and picks the right one based on cohort data:

**Option A — Raise MBTI_TIE_MARGIN.** Make the threshold less sensitive. May reduce false-positives but could mask actual ambiguity (e.g., Ashley's genuine Class D mirror-axis case).

**Option B — Re-architect `dominantTooTight`.** Compare dominant against the *same-attitude opposite-direction* function rather than just the next-highest perceiving function. For Si dominant: compare Si vs Se (both introverted-perceiving opposites). For Ni dominant: compare Ni vs Ne. This separates "developed shape with healthy tertiary" from "actual driver-aux ambiguity."

**Option C — Decouple confidence from same-pool runner-up.** Only flag `dominantTooTight` when the runner-up is the *opposite attitude in the same dimension* (Si vs Se, not Si vs Ne). This is similar to Option B but applied at the comparison level.

**Recommended starting point: Option B or C.** Both preserve the ability to flag genuine ambiguity (Ashley's Se↔Ni mirror-axis case where Se and Ni are genuinely close) while not penalizing developed Si-driver shapes for having strong Ne tertiary.

## Sequencing

- **Parallel-safe with CC-097A.** Different files (this CC touches `lib/jungianStack.ts`; CC-097A touches `data/questions.ts`).
- Independent of CC-097B / CC-097C / CC-097D.
- Should fire AFTER Wave CC-088–CC-094 has landed (confirmed landed via commit 704d714).

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Three-step investigation + fix:

1. **Inspect:** Read `lib/jungianStack.ts` confidence calc. Note `MBTI_TIE_MARGIN` constant value. Trace how `dominantTooTight` and `auxTooTight` are computed.
2. **Diagnose:** Run cohort fixtures through `aggregateLensStack()` and inspect (a) dominant/aux/tertiary/inferior averages for each, (b) which fixture(s) trip dominantTooTight or auxTooTight, (c) which function is the runner-up that's "too tight." Confirm hypothesis: Si/Se-driver fixtures have Ne/Ni tertiary close to dominant, triggering `dominantTooTight` even though the shape is well-formed.
3. **Fix:** Choose Option A/B/C above (Option B/C preferred). Implement. Re-run cohort and confirm Daniel/Cindy/Harry lift the ⚠ badge while Ashley correctly retains low confidence (genuine mirror-axis ambiguity).

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/<name>.audit.ts`
- `npx tsx scripts/<diagnostic>.ts` (for cohort inspection — write a small diagnostic script if useful)

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `lib/jungianStack.ts` — entire file. Confidence calc lives at lines 260–268. Understand `MBTI_TIE_MARGIN`, `VALID_AUX_BY_DOMINANT`, `STACK_TABLE`, `averageRank()`, `PERCEIVING`, `JUDGING`.
2. `lib/identityEngine.ts` — how `aggregateLensStack()` is consumed, particularly at line 2029 (the call site) and line 2129 (`lens_stack: stack` assignment). Also confirm how `stack.confidence === "low"` cascades through downstream routing (lines 4027–4094, the CC-089 short-circuits for low-confidence).
3. `tests/fixtures/cohort/` — pull 4–6 fixtures representing Si-driver (Daniel synthetic), Se-driver (Cindy synthetic), Si-Fe-Ne-Te (Harry — may need to add a fixture if none exists for Si-Fe-Ne-Te yet), Ni-driver (Jason synthetic if exists), Ashley INFJ-latent.
4. `project_cohort_calibration_2026_05_17.md` — the empirical data the cohort users produced in prod. Use this to validate the fix.
5. `feedback_se_fi_attractor_canon.md` — four-class taxonomy. Confirms Class A scope.
6. `feedback_mirror_axis_canon.md` — Ashley's case is Class D (genuine mirror-axis ambiguity). After the fix, Ashley should STILL flag low confidence; the bug fix is for the wrong-low cases (Class A) only.
7. `feedback_jungian_over_mbti_canon.md` — engine detects any 4-function ordering; the confidence calc should work for non-canonical stacks too (Harry's Si-Fe-Ne-Te).
8. `feedback_gradient_calibration_canon.md` — gradient inputs deserve gradient routing.

## Scope

### Item 1 — Investigate

Inspect the confidence calc at `lib/jungianStack.ts:260-268`. Document:

- Current `MBTI_TIE_MARGIN` value
- For each cohort fixture (Daniel, Cindy, Harry, Jason if available, Ashley), what are the dominant/aux/tertiary/inferior averages?
- Which fixture(s) trip `dominantTooTight`? Which trip `auxTooTight`?
- For each tripped case: who is the runner-up function being compared? Is it the same-attitude opposite-direction (Si vs Se) or the opposite-attitude same-direction (Si vs Ne)?

Write a brief findings paragraph in the report.

### Item 2 — Choose fix option

Based on Item 1 findings, recommend and implement one of:

**Option A — Raise MBTI_TIE_MARGIN.** If the diagnostic shows most cohort users' runner-up averages are within a tight margin (e.g., < 1.5), and a slight increase would lift the Class A cases without affecting Class D (Ashley) — this is the simplest fix. Document the new value and rationale.

**Option B — Compare against same-attitude opposite-direction.** Change `dominantTooTight` to compare against the function in the *same pool* (perceiving or judging) AND *same attitude direction* (introverted or extraverted) — which for Si is Ni (both introverted, both perceiving) or just doesn't fire because there isn't one. Actually, more precisely: compare Si to Se (introverted vs extraverted perceiving), Ni to Ne, etc. Same-dimension opposite-direction. Adjust the runner-up selection logic.

**Option C — Decouple confidence from same-pool tertiary.** Only flag `dominantTooTight` when the runner-up is the *opposite-direction same-dimension* function (Si vs Se, Ni vs Ne) — NOT when it's the same-direction opposite-attitude function (Si vs Ne, Ni vs Se). The latter is normal tertiary integration, not ambiguity.

Document choice + rationale in the report.

### Item 3 — Implement fix

Make the code change in `lib/jungianStack.ts`. Keep the public function signature of `aggregateLensStack()` unchanged. The returned LensStack object schema stays identical. Only the *value* of the `confidence` field changes for affected cohort fixtures.

### Item 4 — Audit

New `tests/audit/lensConfidenceClassAFix.audit.ts` with assertions:

1. Daniel-shape synthetic fixture (Si-Te clean) — `aggregateLensStack()` returns `confidence: "high"`
2. Cindy-shape synthetic fixture (Se-Fi clean) — `aggregateLensStack()` returns `confidence: "high"`
3. Harry-shape synthetic fixture (Si-Fe-Ne-Te non-canonical) — `aggregateLensStack()` returns `confidence: "high"`. **If no fixture exists for Si-Fe-Ne-Te, ADD one for this test** — Harry is the gold-standard non-canonical stack fixture per Jungian canon.
4. Ashley-shape synthetic fixture (Se-Fi surface, INFJ latent — mirror-axis ambiguity) — `aggregateLensStack()` returns `confidence: "low"`. Class D ambiguity remains correctly flagged.
5. Jason-shape synthetic fixture (Ni-Te clean) — `aggregateLensStack()` returns `confidence: "high"` (regression — was already high; should stay).
6. `MBTI_TIE_MARGIN` constant has its documented value (whatever Item 2 chose).
7. The confidence calc logic is documented inline with a comment referencing this CC (`// CC-097-CONFIDENCE-FIX: ...`).

### Item 5 — Regression sweep

After Items 1-4:
- Wave 1 + CC-084 through CC-094 audits all pass
- New `audit:lens-confidence-class-a-fix` passes 7/7
- CC-089 audit (`audit:hedged-low-confidence-lens`) — review the short-circuit behavior. With fewer cohort users flagging low confidence, the hedge prose fires less often. CC-089's "low confidence renders hedge" assertions should still pass for the genuinely-low-confidence cases (Ashley). The "high confidence regression anchor" assertion should still pass.
- twoTier baseline drift: expected for the 3 cohort fixtures (Daniel/Cindy/Harry) that lift the hedge prose. CC-088 owns baseline refreshes — DO NOT regenerate snapshot in this CC. Document the expected drift in the report; CC-088-style refresh can follow.

### Item 6 — Ashley fixture validation

Confirm Ashley's mirror-axis fixture (if exists) STILL flags low confidence post-fix. If no Ashley fixture exists, the Class D mirror-axis case will need its own fixture in a future CC (CC-097C). For this CC, validate that the fix doesn't lift confidence on a mirror-axis case if any fixture happens to represent one.

## Do NOT

- **Do NOT change `aggregateLensStack()`'s function signature** or the LensStack schema.
- **Do NOT add new fields to LensStack** (no `confidence_reason`, no `tooTightFunction`). Only the `confidence` value changes for affected fixtures.
- **Do NOT touch CC-089's short-circuit logic** in `lib/identityEngine.ts` (lines 4027–4094 etc.). CC-089 owns the cascade behavior; this CC owns the confidence-value computation.
- **Do NOT change `data/questions.ts`.** CC-097A owns Q-T item wording.
- **Do NOT add cross-signal inference here.** That's CC-097B.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate `tests/audit/twoTierBaseline.snapshot.json` or any other baseline snapshot.** Expected drift; CC-088 owns refreshes.
- **Do NOT regenerate any cache file** under `lib/cache/`.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports.
- **Do NOT commit or push.**
- **Do NOT lift confidence on Class D mirror-axis cases** (Ashley). Genuine ambiguity should remain flagged.

## Allowed to Modify

- `lib/jungianStack.ts` — confidence calc logic + `MBTI_TIE_MARGIN` constant (if Option A)
- `tests/audit/lensConfidenceClassAFix.audit.ts` (new)
- `package.json` (add `audit:lens-confidence-class-a-fix` script)
- `tests/fixtures/cohort/harry-si-fe-ne-te.json` (NEW — if Harry's non-canonical fixture doesn't exist yet) — add ONE synthetic Si-Fe-Ne-Te fixture so the audit can validate Harry's case
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Q-T item wording (CC-097A)
- Cross-signal cognitive-function inference (CC-097B)
- Mirror-axis output schema (CC-097C)
- Function-by-function Lens prose composer (CC-097D)
- CC-089 hedge cascade behavior (it stays as-is; just fires less often)
- Engine math beyond the confidence value
- Hands archetype routing
- Card routing changes (Compass, Trust, Conviction, Gravity)
- LLM rewrite layer

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes (no new warnings introduced)
3. `npx tsx tests/audit/lensConfidenceClassAFix.audit.ts` passes 7/7
4. Wave 1 audits still pass
5. CC-084 / CC-085 / CC-086 / CC-087 / CC-088 / CC-089 / CC-090 / CC-091 / CC-092 / CC-093 / CC-094 audits still pass
6. Daniel synthetic fixture flags `confidence: "high"` (was "low")
7. Cindy synthetic fixture flags `confidence: "high"` (was "low")
8. Harry synthetic fixture flags `confidence: "high"` (was "low"; fixture added if not present)
9. Jason synthetic fixture flags `confidence: "high"` (unchanged from baseline)
10. Ashley mirror-axis case flags `confidence: "low"` (correctly retained if fixture exists)
11. Function signature of `aggregateLensStack()` unchanged
12. LensStack schema unchanged
13. CC-089 hedge cascade unchanged (lib/identityEngine.ts:4027-4094 etc. untouched)
14. Zero Wave 1 persistence file changes
15. Zero LLM calls
16. Zero cache file modifications
17. Zero snapshot baseline regenerations (CC-088 owns those)
18. Zero commits

## Report Back

- Investigation findings (Item 1):
  - `MBTI_TIE_MARGIN` current value
  - Per-fixture dominant/aux averages
  - Which fixtures trip dominantTooTight or auxTooTight
  - Identity of the runner-up function in each tripped case
- Fix option chosen (A/B/C) with rationale
- Implementation summary (lines changed in `lib/jungianStack.ts`)
- Audit results (7/7 + regression sweep)
- Confidence-flag changes per cohort fixture (Daniel/Cindy/Harry/Jason/Ashley): before vs after
- Snapshot drift documentation: which fixtures' rendered output changes (expected for Daniel/Cindy/Harry — they'll drop the hedge prose). Note for future CC-088-style refresh.
- Any deviation from Allowed-to-Modify list

## Notes for executor

- Estimated time: 1-2 hours (investigation + fix + audit)
- Cost: $0 (no LLM)
- This is engine-math investigation work. The hypothesis in this prompt is based on the cohort calibration (4 of 7 sensing-driver shapes flagging low when 3 of those 4 should be high). The actual root cause may differ from the hypothesis — investigate first, then fix.
- Per Jason canon (`feedback_jungian_over_mbti_canon.md`): the engine detects any 4-function ordering. Harry's Si-Fe-Ne-Te is a valid stack even though MBTI's 16 don't include it. The confidence calc must work for non-canonical stacks. If `aggregateLensStack()`'s current implementation only handles canonical pairs cleanly, that's also a finding worth surfacing for CC-097C (non-canonical stack support).
- The CC-089 hedge cascade fires `confidence === "low"` short-circuits for picker reorder, relational fallback, Lens growth-edge driver anchor, and Hands archetype routing. After this fix, ~3 cohort users will stop triggering those short-circuits — that's the intended behavior. Their post-fix renders should produce specific Hands archetype routes (currently "unmapped") and shape-aware picker behavior. Some of those improvements may cascade through CC-091's steward-builder routing for Daniel. That's good; document but don't gate on it.
- Apply canon-faithful interpretation per `AGENTS.md` on any ambiguity. Flag deviations in report.
