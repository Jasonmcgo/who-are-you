# CODEX-SYNTHESIS-1F-CLEANUP — Three Post-1F Surface Bugs

**Origin:** CC-SYNTHESIS-1-FINISH shipped 2026-05-08 with six sections, all 26 audit assertions green. Render review of the canonical Jason fixture surfaced three small bugs that the audit didn't catch (because they're prose-content issues, not structural absences). This CODEX bundles the three fixes into one mechanical pass.

**Method discipline:** Surgical fixes only. No new claims, no new layers, no new questions, no new measurements. Each fix preserves CC-PROSE / CC-SYNTHESIS-1A / CC-SYNTHESIS-1F canon; only the specific bugged template strings or composer source-field choices change.

**Scope frame:** Three fixes, one CODEX. ~2-3 hours executor time. CODEX-scale: two are template string corrections (mechanical), one requires a small investigation step (locate which engine field the Gravity Movement Note composer should read).

---

## Embedded context (CC executor environments don't see Cowork memory)

**Synthesis architecture (Jason+Clarence sketch 2026-05-08):**

The 3C drive distribution + Goal/Soul/Movement + Work/Love/Give framework collapses to one engine with three readouts: motivational fuel, trajectory state, life-mode expression. Per the architecture:

- **Cost (Drive bucket compliance) and Coverage (Drive bucket coverage) are TWO FUEL CHANNELS pointing at ONE beloved object.** They are not two different destinations. A user with Knowledge as top-Compass-1 has Knowledge as their beloved object; Goal and Soul both serve it through different mechanisms (Goal = Cost-as-structure; Soul = Coverage-as-presence).
- **Risk Form 2x2** (Wisdom-governed / Grip-governed / Free movement / Reckless-fearful) per CC-SYNTHESIS-1A is the orthogonal-axis classifier of risk-bucket × grip-score.
- **Risk-vs-Grip canon (Jason 2026-05-08):** "Risk is not Grip. Risk becomes Grip when the governor starts preventing movement instead of aiming it."

**Engine canonical phrases preserved verbatim:** "convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read", "let context travel with action", "Giving is Work that has found its beloved object". Plus all Movement Note canonical templates from CC-SYNTHESIS-1-FINISH per-card guidance.

**Hedge density:** 30-50 phrases per fixture is the existing rate. Do NOT add or remove hedges.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/synthesis1Finish.audit.ts`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npx tsx tests/audit/synthesis1a.audit.ts`
- `npx tsx tests/audit/jungianCompletion.audit.ts`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npm run dev`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/synthesis1Finish.ts` (or wherever the CC-SYNTHESIS-1-FINISH composers live — confirm via grep) — locate `composeCompassMovementNote` and `composePathMasterSynthesis` and `composeGravityMovementNote`.
2. `lib/identityEngine.ts` — locate where the masthead generates "looks first toward {gravity}" prose (grep for "looks first toward"). Identify the engine field/threshold the masthead reads.
3. `lib/types.ts` — `InnerConstitutionOutput` type. Confirm field names: `topCompass`, `topGravity`, `cross_card.topCompass`, `cross_card.topGravity`, or wherever Gravity attribution surfaces.
4. `tests/audit/synthesis1Finish.audit.ts` — existing audit harness; CODEX-SYNTHESIS-1F-CLEANUP appends new assertions to this file (or creates a parallel file — executor's call).
5. The 20-fixture cohort — verify the masthead fires "looks first toward X" for fixtures where the Gravity Movement Note composer hits thinness fallback. The discrepancy is the bug.

---

## Allowed to Modify

### Fix 1 — Compass Movement Note Cost/Coverage Distinction

**File:** `lib/synthesis1Finish.ts` (or wherever `composeCompassMovementNote` lives).

**The bug:** Current Compass Movement Note template renders `{top-Compass-1}` in BOTH Goal and Soul slots, producing prose like "Your Goal protects Knowledge; your Soul covers Knowledge." This collapses the synthesis architecture's Cost/Coverage distinction (Goal and Soul are TWO FUEL CHANNELS to ONE beloved object, not two different destinations).

**The fix:** Reframe the Compass Movement Note as same-value-two-mechanisms.

**New template:**

```
**Movement Note** — Your beloved object is {top-Compass-1}{if top-Compass-2 through top-Compass-4 exist: ` held inside {top-Compass-2}, {top-Compass-3}, and {top-Compass-4}`}. Your Goal expresses Cost in service of it; your Soul covers it as presence. Your Giving is {Compass-specific-giving-descriptor for top-Compass-1}.
```

Per-Compass-1 giving descriptors stay verbatim from CC-SYNTHESIS-1-FINISH (do NOT change those):
- Knowledge: `building structures that make truth more usable, more humane, and less captive to noise`
- Family: `love that becomes a reliable form others can count on`
- Compassion: `concrete care with enough structure to last beyond the moment`
- Peace: `order rebuilt where order broke, durable conditions for flourishing`
- Faith: `belief made visible through faithful action across time`
- Honor: `integrity given a body, the kept promise as a form of work`
- Freedom: `space made for self and others to become without coercion`
- Justice: `accountable structures that make wrong things right`
- ... (preserve whatever the existing composer has)

**Render rule:** Second-person voice; no name leaks. Hedge phrases unchanged.

**Audit assertions:**
- `cleanup-1f-compass-mn-no-double-protect`: For every fixture, the Compass Movement Note does NOT contain the substring "Your Goal protects" AND "Your Soul covers" with the same value name immediately after each (regex check: rendered Compass Movement Note does NOT match `Your Goal protects (\w+); your Soul covers \1\b`).
- `cleanup-1f-compass-mn-beloved-object-phrase`: Every fixture's Compass Movement Note contains the phrase "Your beloved object is" followed by `topCompass[0]` verbatim.
- `cleanup-1f-compass-mn-giving-descriptor-preserved`: For each Compass-1 value present in the cohort, the corresponding giving descriptor from CC-SYNTHESIS-1-FINISH renders verbatim.

### Fix 2 — Path Master Synthesis Risk Form De-duplication

**File:** `lib/synthesis1Finish.ts` (or wherever `composePathMasterSynthesis` lives).

**The bug:** Section F's Path master synthesis lifts the Fire Movement Note's Risk Form behavior prose verbatim. Same Risk Form reading appears twice in the report (Fire card Movement Note + Path master synthesis paragraph). Section A's dedup intent is partially undone.

**The fix:** Path master synthesis references the Risk Form letter as a concise integration phrase, NOT a verbatim lift of the Fire Movement Note's longer prose.

**New per-Risk-Form-letter integration phrases for Path master synthesis** (replaces whatever the current Path composer lifts from Fire):

- **Wisdom-governed:** `Your Risk Form reads as Wisdom-governed — the governor is doing its work.`
- **Grip-governed:** `Your Risk Form reads as Grip-governed — the governor has begun to lock motion rather than aim it.`
- **Free movement:** `Your Risk Form reads as Free movement — motion runs unimpeded, calibration is the future asking.`
- **Reckless-fearful:** `Your Risk Form reads as Reckless-fearful — grip without strong governing risk-orientation behind it.`
- **(thin-signal length=0):** Path master synthesis omits the Risk Form sentence entirely (consistent with Section D's suppression rule).

These are intentionally one-sentence each — concise enough to integrate into the Path master synthesis paragraph flow, distinct from the Fire Movement Note's longer behavior reading.

**Resulting Path master synthesis paragraph structure (illustrative):**

```
Your movement is {bias direction}: {Work line state}, {Soul line state}.
Your Work shape is {Work-shape descriptor from Lens dominant}, organized around {top-Compass-1}.
Your Love shape is {Love-Map flavor label} — {Love-Map descriptor lifted verbatim from Love Map data}.
{Risk Form integration phrase per above — ONE sentence}.
The next movement is {next-move descriptor based on quadrant + Risk Form letter}.
{Closing canonical phrase per CC-SYNTHESIS-1A two-tier gate: "the early shape of giving" or "Giving is Work that has found its beloved object"}.
```

The Fire Movement Note (CC-SYNTHESIS-1-FINISH Section E canon) stays UNCHANGED — it keeps its longer behavior reading. Only Path's Risk Form reference becomes the one-sentence integration phrase.

**Render rule:** Second-person voice; no Risk Form letter restated outside the Risk Form integration sentence; closing canonical phrase preserved verbatim per CC-SYNTHESIS-1A.

**Audit assertions:**
- `cleanup-1f-path-no-fire-mn-duplicate`: For every fixture, the Path master synthesis paragraph does NOT contain a verbatim substring of length ≥40 characters that also appears in the Fire card Movement Note. (Implementation: split both into 40-char windows, assert no overlap.)
- `cleanup-1f-path-risk-form-integration-phrase`: For every fixture with `riskForm.letter` present, the Path master synthesis contains exactly ONE of the four canonical integration phrases (matching the Risk Form letter). For thin-signal fixtures (length=0), Path master synthesis contains zero Risk Form sentences.
- `cleanup-1f-fire-mn-unchanged`: Fire Movement Note prose for every fixture is verbatim-identical to its post-CC-SYNTHESIS-1-FINISH state (Fire's behavior reading is canon; Fix 2 only touches Path's reference).

### Fix 3 — Gravity Movement Note Field/Threshold Investigation

**Files:** `lib/synthesis1Finish.ts` (Gravity Movement Note composer); possibly `lib/identityEngine.ts` (if the masthead's gravity-attribution source needs to be referenced or aligned).

**The bug:** Gravity Movement Note hits 100% thinness fallback (20/20 fixtures) despite the masthead clearly firing "looks first toward {gravity}" for fixtures like Jason ("looks first toward Individual when something goes wrong"). The composer is either reading a different engine field than the masthead OR using a stricter ranked-signal threshold.

**The investigation step:**

1. **Locate the masthead's gravity source.** Grep for "looks first toward" in `lib/identityEngine.ts`, `lib/renderMirror.ts`, and `lib/synthesis1Finish.ts`. Identify the field the masthead reads and the threshold/check it applies (e.g., `topGravity[0]`, `cross_card.topGravity[0]`, `gravity.dominant`).

2. **Locate the Gravity Movement Note composer's source field.** Compare to (1).

3. **Diagnose the discrepancy.** Three likely causes:
   - **Different field** — masthead reads `topGravity[0]` but composer reads `cross_card.topGravity[0]` (or vice versa); align them.
   - **Stricter threshold** — masthead fires when `topGravity[0]` is non-empty; composer requires `topGravity.length >= 2`; relax the composer to match the masthead.
   - **Field genuinely empty** — Gravity attribution doesn't surface in the cohort's `topGravity` field even though the masthead synthesizes it from upstream signals; in that case, point the composer at the same upstream field the masthead synthesizes from.

**The fix:** Align the Gravity Movement Note composer's source field and threshold to whatever the masthead uses. If the masthead fires "looks first toward Individual" for Jason, the Gravity Movement Note should fire its `Individual` per-direction template (not the thinness fallback) for Jason.

**Per-direction templates from CC-SYNTHESIS-1-FINISH stay UNCHANGED.** This fix only changes which fixtures REACH those templates vs hit fallback.

**Audit assertions:**
- `cleanup-1f-gravity-mn-fires-when-masthead-fires`: For every fixture where the masthead contains "looks first toward {X}" (X being any gravity attribution name), the Gravity Movement Note does NOT hit the thinness fallback — it fires the per-direction template matching X.
- `cleanup-1f-gravity-mn-fallback-only-when-masthead-also-thin`: The Gravity Movement Note thinness fallback fires ONLY for fixtures where the masthead does NOT contain "looks first toward" (i.e., genuine cohort thinness, not composer/masthead misalignment).
- `cleanup-1f-gravity-mn-individual-template-fires`: For Jason canonical (ocean/07), the Gravity Movement Note contains the `Individual` per-direction template's content (specifically the substring "Individual" referenced as the top gravity attribution).

If the investigation reveals that gravity attribution is genuinely empty in `topGravity` for ALL 20 fixtures (even though the masthead synthesizes it from elsewhere), the fix becomes "point the composer at whatever upstream source the masthead synthesizes from" — likely the gravity card's own `cross_card` or signal-source data. Document the chosen source field in Report Back.

---

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, intensity math, or composite consumption.** `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, `computeGoalSoulGive`, `computeMovement`, `computeDriveOutput`, `computeLoveMapOutput` — all untouched.
2. **Do NOT modify CC-PROSE-1 / 1A / 1B / SYNTHESIS-1A / SYNTHESIS-1-FINISH canon beyond the three specific bugs.** `composeExecutiveRead`, `SHAPE_CARD_QUESTION`, Risk Form 2x2 classifier, four-quadrant classifier, two-tier closing-phrase logic, all per-card Movement Note templates EXCEPT Compass Movement Note (Fix 1) and Gravity Movement Note source-field (Fix 3), Fire Movement Note (Fix 2 explicitly preserves Fire), Trust correction-channel reframe, Weather state-vs-shape qualifier, Path master synthesis structure (Fix 2 only changes Risk Form sentence, not paragraph structure) — all preserved.
3. **Do NOT modify the masthead** ("a possibility, not a verdict") or "How to Read This" framing or section ordering.
4. **Do NOT modify the per-Compass-1 giving descriptors** in Compass Movement Note. They are CC-SYNTHESIS-1-FINISH canon. Fix 1 only changes the Goal/Soul sentence; the giving descriptor closing stays verbatim.
5. **Do NOT modify the Fire Movement Note prose** (CC-SYNTHESIS-1-FINISH canon). Fix 2 only changes Path master synthesis's Risk Form reference; Fire stays unchanged.
6. **Do NOT modify the per-direction Gravity Movement Note templates** (Individual / System / Authority / Nature / Mystery). Fix 3 only changes which fixtures reach those templates vs fallback.
7. **Do NOT add or remove hedge phrases.** Per `feedback_hedge_density_in_engine_prose`. Pre-CC and post-CC hedge density should match within ±2/fixture.
8. **Do NOT introduce new vocabulary.** Use existing engine-canon phrases verbatim.
9. **Do NOT introduce LLM calls or API integrations.**
10. **Do NOT add new questions to the question bank.** Per `feedback_minimal_questions_maximum_output`.
11. **Do NOT install dependencies.**
12. **Do NOT modify** the question bank, fixture files, `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo.
13. **Do NOT touch existing audit assertions** (`prose-1-*`, `prose-1a-*`, `prose-1b-*`, `synth-1a-*`, `synth-1f-*`, `jungian-completion-*`, OCEAN, Goal/Soul/Give). They stay green; CODEX-SYNTHESIS-1F-CLEANUP adds new `cleanup-1f-*` assertions.
14. **Do NOT modify body card Strength / Growth Edge / Practice prose** on any of the cards.
15. **Do NOT change the Risk Form 2x2 thresholds** (`RISK_FORM_HIGH_BUCKET`, `RISK_FORM_HIGH_GRIP`) or Movement Quadrant threshold (`MOVEMENT_QUADRANT_HIGH_THRESHOLD`) or Closing Phrase strength floor (`CLOSING_PHRASE_ARRIVED_STRENGTH_FLOOR`). Threshold tuning is post-cohort-feedback work, not this CODEX.

## Acceptance Criteria

1. Fix 1 — Compass Movement Note: every fixture's rendered Compass Movement Note contains "Your beloved object is" followed by `topCompass[0]`; does NOT contain "Your Goal protects X; your Soul covers X" with same X. Per-Compass-1 giving descriptors preserved verbatim.
2. Fix 2 — Path master synthesis no longer contains a ≥40-char verbatim substring of the Fire Movement Note. Path's Risk Form reference is one of the four canonical integration phrases (or omitted for thin-signal fixtures).
3. Fix 3 — Gravity Movement Note: for fixtures where masthead fires "looks first toward {X}", Gravity Movement Note fires the per-direction `{X}` template (NOT thinness fallback). Thinness fallback fires only when the masthead is also thin on gravity attribution.
4. All new `cleanup-1f-*` audit assertions pass.
5. All existing CC-PROSE / CC-SYNTHESIS-1A / CC-SYNTHESIS-1-FINISH / CC-JUNGIAN-COMPLETION audit assertions still pass (regression).
6. Existing OCEAN + Goal/Soul/Give audit assertions pass.
7. CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression: all assertions still pass.
8. Hedge density delta within ±2 phrases per fixture.
9. `npx tsc --noEmit` exits 0.
10. `npm run lint` exits 0.
11. `git status --short` shows only files touched by the three fixes + new audit assertions.

## Report Back

1. **Summary** in 4-6 sentences. Confirm all three fixes landed cleanly. For Fix 3 specifically, name the diagnosis: was it different fields, stricter threshold, or genuinely empty source field? Name the chosen source-field/threshold alignment.
2. **Fix 1 verification** — paste the Compass Movement Note for the canonical Jason fixture (`topCompass = [Knowledge, Peace, Faith, Honor]`) and one other fixture with different `topCompass[0]`. Confirm "Your beloved object is X held inside Y, Z, and W" structure renders correctly.
3. **Fix 2 verification** — paste the canonical Jason fixture's full Path master synthesis paragraph; show the new one-sentence Risk Form integration phrase. Confirm zero verbatim overlap with Fire Movement Note prose.
4. **Fix 3 verification** — for the canonical Jason fixture (Gravity = Individual per masthead), paste the Gravity Movement Note. Confirm it fires the Individual per-direction template (not thinness fallback). Report cohort-wide fire rate post-fix: how many of 20 fixtures now fire per-direction Gravity Movement Notes vs hit fallback.
5. **Hedge density delta** — pre-CODEX vs post-CODEX baseline; confirm within ±2.
6. **Audit pass/fail breakdown** — including new `cleanup-1f-*` assertions, all prior assertion suites' regression status.
7. **Out-of-scope verification** — git status; confirm only Fix 1 / Fix 2 / Fix 3 files + new audit assertions changed.
8. **Recommendation for follow-on** — if Fix 3's investigation revealed a deeper engine-source issue (gravity attribution genuinely empty in `topGravity` field even though it surfaces upstream), flag for a future investigation. If the fix was a clean alignment, no follow-on needed.
