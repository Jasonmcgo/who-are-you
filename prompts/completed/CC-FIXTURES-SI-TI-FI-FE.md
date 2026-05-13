# CC-FIXTURES-SI-TI-FI-FE — Author 4 New Fixtures Closing the Function-Dominance + Gravity Gaps

**Origin:** Two empirical findings from the CC-JUNGIAN-COMPLETION audit (2026-05-08) and CODEX-SYNTHESIS-1F-CLEANUP (2026-05-08):

1. **Function-dominance gap:** the 20-fixture cohort is heavily Ni-dominant (13/20) with secondary Se cluster (6/20) and 1 Ne; **zero fixtures are dominant in Si, Ti, Fi, or Fe**. This means CC-029's 5 candidate patterns covering Si/Se/Ti/Fi/Fe shipped but rarely fire — the patterns require dominant-function triggers, and the cohort has none of those four functions in dominant position.

2. **Gravity attribution gap:** all 20 fixtures fire 0/20 on masthead gravity attribution and 0/20 on per-direction Gravity Movement Notes. The masthead and composer are correctly aligned in code; the JSON fixture files just don't produce the input that surfaces gravity attribution.

This CC authors 4 new fixtures, one per missing dominant function (Si / Ti / Fi / Fe), each designed to:
- Produce its respective function as dominant in `lens_stack`
- Surface gravity attribution in the masthead (close gap #2)
- Meet the compound trigger condition for CC-029's matching pattern (so the pattern fires empirically)
- Carry diverse Compass values, plausible Movement positions, OCEAN distributions, and demographic answers — coherent personas, not minimum-viable test data

**Method discipline:** Editorial fixture authoring. No code changes; pure JSON authoring + audit verification. Each fixture is a coherent person with realistic answers across all questions in the bank, not a synthetic minimum-viable input. Per `feedback_minimal_questions_maximum_output`: this is fixture work, not new measurement.

**Scope frame:** 4 new fixtures + audit additions verifying the patterns now fire and gravity surfaces. ~6-8 hours executor time. CC-scale because each fixture is a hand-authored persona with editorial judgment in the persona's coherence; not because the structural work is heavy.

---

## Embedded context (CC executor environments don't see Cowork memory)

**The 5 CC-029 cross-card patterns and their compound trigger conditions** (from `lib/identityEngine.ts` `CROSS_CARD_PATTERNS` array, entries 13-17):

| Pattern ID | Function trigger | Compound condition | Applicable card |
|---|---|---|---|
| `si_tradition_built_from_chaos` | `lensStack.dominant === "si"` | `has(signals, "chaos_exposure")` (Weather formation answer indicating uncertain childhood ground) | weather |
| `se_crisis_alive_planning_strain` | `lensStack.dominant === "se"` | `hasFromQuestion(signals, "reactive_operator", "Q-A1")` (Q-A1 "Reacting to demands") | path |
| `ti_closed_reasoning_chamber` | `lensStack.dominant === "ti"` | `has(signals, "holds_internal_conviction")` AND `lensStack.auxiliary !== "te"` | conviction |
| `fi_personally_authentic_only` | `lensStack.dominant === "fi"` | `hasFromQuestion(signals, "high_conviction_under_risk", "Q-P2")` (Q-P2 "Accept the risk") | fire |
| `fe_attunement_to_yielded_conviction` | `lensStack.dominant === "fe"` | `has(signals, "adapts_under_social_pressure")` (Q-P1 "Stay silent" or "Soften it") | fire |

The 4 new fixtures must each meet the dominant-function condition AND the compound condition for their respective pattern, so that the patterns fire on the new cohort.

**Function plain-English labels (used in card prose):**
- Ni → pattern-reader; Ne → possibility-finder
- Si → precedent-checker; Se → present-tense self
- Ti → coherence-checker; Te → structurer
- Fi → inner compass; Fe → room-reader

**Engine canonical phrases preserved across all fixtures:** the engine's phrases like "convert structure into mercy", "care with a spine", "the early shape of giving", "Your gift is the long read" are template-driven; new fixtures just consume the templates. No fixture authoring touches those phrases.

**Gravity attribution sources:** The masthead's "looks first toward {gravity}" prose reads from `topGravity[0]` (or equivalent — confirm via grep on `looks first toward` in `lib/identityEngine.ts` or `lib/renderMirror.ts`). For gravity attribution to surface in a fixture, the fixture's responsibility-attribution answers (the questions on the Gravity card — locate via grep on Q-G* or similar in `data/questions.ts`) must produce a ranked top gravity slot. Empty-ranking fixtures hit the thinness fallback.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npx tsx tests/audit/synthesis1a.audit.ts`
- `npx tsx tests/audit/synthesis1Finish.audit.ts`
- `npx tsx tests/audit/jungianCompletion.audit.ts`
- `npx tsx tests/audit/functionCoverage.audit.ts`
- `npx tsx tests/audit/proseCorrelation.audit.ts`
- `npx tsx tests/audit/fixturesSiTiFiFe.audit.ts` (the new audit added by this CC)
- `npm run dev`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `tests/fixtures/ocean/07-jason-real-session.json` — canonical Jason fixture as a structural template. Note all the fields: question answers, demographics, ranked items, free-form responses. New fixtures follow this shape exactly.
2. `tests/fixtures/ocean/01-architectural-openness.json` and `tests/fixtures/ocean/02-high-conscientiousness.json` — additional templates showing fixture variety.
3. `tests/fixtures/goal-soul-give/01-generative.json` and `tests/fixtures/goal-soul-give/11-retirement-longing.json` — fixtures with strong Movement positions; useful for showing how Movement is expressed via answer patterns.
4. `data/questions.ts` — the question bank. Every question's structure, answer options, signal mapping. Critical reading: each question's answer needs to map to signals that produce the desired engine output for the new fixtures.
5. `lib/identityEngine.ts` — `buildInnerConstitution` end-to-end; `lens_stack` derivation logic (find the function that turns signals into dominant + auxiliary function letters); `CROSS_CARD_PATTERNS` array entries 13-17 (the 5 CC-029 patterns).
6. `lib/types.ts` — fixture input type. Confirm all required fields.
7. `tests/audit/functionCoverage.audit.ts` — pre-CC baseline of function coverage across the 20-fixture cohort. CC-FIXTURES-SI-TI-FI-FE expects this audit to show improvements post-fixture-add.
8. `tests/audit/jungianCompletion.audit.ts` — CC-029 pattern firing-rate baseline. Expect Si / Ti / Fi / Fe pattern firing rates to go from 0/20 to ≥1/24 post-CC.

## Allowed to Modify

### Addition 1 — Si-dominant fixture: "the precedent-keeper"

**New file:** `tests/fixtures/ocean/24-si-precedent-keeper.json` (or whichever numbering convention the existing fixtures use — confirm by listing `tests/fixtures/ocean/`).

**Persona spec:** A 60-something woman who's worked in archival / library / community-history work for 35 years; raised in a household that mixed stability with uncertain ground (parents divorced when she was 8, raised mostly by grandparents); inherited the role of family-keeper — the one who remembers names, calls on birthdays, holds the reunion calendar. Believes in the form of things — the steady, tested ways of doing — and feels a quiet alarm when communities forget what they used to know. Carries grief for what's been lost; carries continuity for what remains. Her gift is fidelity to what's been tested; her risk is mistaking last-decade's truth for this-decade's command.

**Required engine outputs (audit-verified):**
- `lens_stack.dominant === "si"`
- `lens_stack.auxiliary` ∈ {"fe", "te"} (executor picks; recommend `fe` for the family-keeper persona — Si+Fe is the steward archetype)
- Signal `chaos_exposure` present (Weather formation answer indicating uncertain childhood ground)
- `topCompass[0]` ∈ {Family, Honor, Stability, Faith} (precedent-protective values; executor picks one)
- `topGravity[0]` non-empty — choose Authority or System (the precedent-keeper sees responsibility in stewards and inherited frames)
- OCEAN: high Conscientiousness, moderate-high Agreeableness, low-moderate Openness (precedent-checkers tend to be lower-openness), moderate-low Extraversion, moderate Reactivity
- Movement: Goal ~50, Soul ~70 (Soul-leaning; family-keeping is more presence than output)
- Drive distribution: Coverage-leaning (~45%), Compliance-moderate (~30%), Cost-low (~25%)
- Demographics: female, age 60-69, child-bearing age past, currently married

**Pattern fires expected:** `si_tradition_built_from_chaos` (Si dominant + chaos_exposure)

### Addition 2 — Ti-dominant fixture: "the coherence-prober"

**New file:** `tests/fixtures/ocean/25-ti-coherence-prober.json`.

**Persona spec:** A 35-year-old man, software architect at a mid-sized firm; sole introvert in his cohort; the colleague everyone tags into design reviews because he sees what doesn't add up before it surfaces in language. Doesn't speak unless he has something to say; will quietly walk away from a meeting where the framing is wrong rather than argue. Has a strong principled register — when he holds a conviction, he holds it under cost. His gift is internal logical fit; his risk is mistaking coherence for completeness — the model can be coherent and miss the room.

**Required engine outputs:**
- `lens_stack.dominant === "ti"`
- `lens_stack.auxiliary === "ne"` or `lens_stack.auxiliary === "se"` (NOT `te` — the CC-029 ti pattern requires aux !== Te). Recommend `ne` (the prober archetype: Ti+Ne).
- Signal `holds_internal_conviction` present (Q-P2 answer indicating principled conviction held under cost)
- `topCompass[0]` ∈ {Truth, Honor, Knowledge, Freedom} (Ti-protective values)
- `topGravity[0]` ∈ {Individual, Authority} (Ti tends toward "name who failed in the logic")
- OCEAN: low-moderate Agreeableness (Ti can read as cold), high Openness, moderate Conscientiousness, low Extraversion (introvert), low Reactivity
- Movement: Goal ~70, Soul ~30 (Goal-leaning; coherence-checking is structural work)
- Drive: Cost-moderate (~35%), Coverage-low (~25%), Compliance-moderate (~40%, Ti tends to register risk consciously)
- Demographics: male, age 30-39, single or married no kids

**Pattern fires expected:** `ti_closed_reasoning_chamber` (Ti dominant + holds_internal_conviction + aux !== Te)

### Addition 3 — Fi-dominant fixture: "the inner-truth-anchor"

**New file:** `tests/fixtures/ocean/26-fi-inner-truth-anchor.json`.

**Persona spec:** A 45-year-old non-binary writer (gender-fluid; uses they/them); spent their twenties in activist circles, transitioned to memoir + essay writing in their thirties; the person friends call when they need someone who won't perform reassurance. Carries an unmistakable inner conscience — when they refuse, the refusal isn't social; it's principled. Has accepted real cost for what they hold (lost a job standing on principle in 2018; turned down a lucrative book deal in 2022 over editorial direction). Their gift is the inner compass that doesn't bend under pressure; their risk is mistaking personal truth for universal mandate.

**Required engine outputs:**
- `lens_stack.dominant === "fi"`
- `lens_stack.auxiliary` ∈ {"ne", "se"} (Fi+Ne = the advocate; Fi+Se = the embodied truth-teller; executor picks; recommend `ne`)
- Signal `high_conviction_under_risk` present (Q-P2 answer "Accept the risk" — willing to bear cost when belief is at stake)
- `topCompass[0]` ∈ {Authenticity, Truth, Honor, Compassion, Justice} (Fi-protective values)
- `topGravity[0]` ∈ {Individual, Authority} (Fi tends toward "the person who betrayed conscience")
- OCEAN: moderate-high Agreeableness (Fi care is real; protective register), high Openness, moderate Conscientiousness, moderate Extraversion (writers can be either), moderate-high Reactivity (Fi feels things; affect channel active)
- Movement: Goal ~60, Soul ~75 (balanced, leaning Soul; the work serves a beloved cause)
- Drive: Coverage-leaning (~45%), Cost-moderate (~30%), Compliance-low (~25%)
- Demographics: non-binary, age 40-49, no kids, single or partnered

**Pattern fires expected:** `fi_personally_authentic_only` (Fi dominant + high_conviction_under_risk)

### Addition 4 — Fe-dominant fixture: "the room-reader-attuned"

**New file:** `tests/fixtures/ocean/27-fe-room-reader-attuned.json`.

**Persona spec:** A 50-year-old woman, executive coach + organizational consultant; the kind of facilitator who can read a room of 20 people in 90 seconds and adjust the next sentence accordingly. Spent her thirties as an HR director, transitioned to consulting in her forties. Married with two adult children. Carries strong relational sensing; reads consequence in language, presence, timing. Her gift is the read of what the moment is asking; her risk is yielding under social pressure — softening the thing that needed saying because the room couldn't yet receive it.

**Required engine outputs:**
- `lens_stack.dominant === "fe"`
- `lens_stack.auxiliary` ∈ {"ni", "si"} (Fe+Ni = the diplomat-seer; Fe+Si = the relational-keeper; executor picks; recommend `ni`)
- Signal `adapts_under_social_pressure` present (Q-P1 answer "Stay silent" or "Soften it")
- `topCompass[0]` ∈ {Compassion, Family, Peace, Loyalty} (Fe-protective values)
- `topGravity[0]` ∈ {Individual, Circumstance} (Fe tends to read responsibility relationally; or to make space for circumstance)
- OCEAN: high Agreeableness, moderate-high Openness, high Conscientiousness, moderate-high Extraversion (Fe is socially active), moderate Reactivity
- Movement: Goal ~55, Soul ~80 (Soul-leaning; relational work)
- Drive: Coverage-leaning heavily (~55%), Cost-moderate (~25%), Compliance-low (~20%)
- Demographics: female, age 50-59, married with adult children

**Pattern fires expected:** `fe_attunement_to_yielded_conviction` (Fe dominant + adapts_under_social_pressure)

### Addition 5 — Audit assertions

**New file:** `tests/audit/fixturesSiTiFiFe.audit.ts`. Add assertion block:

- `fixtures-si-fixture-loads-and-builds`: Loading the Si fixture and running `buildInnerConstitution` succeeds without errors.
- `fixtures-si-lens-dominant-correct`: Si fixture's output has `lens_stack.dominant === "si"`.
- `fixtures-si-pattern-fires`: Running the pattern catalog against the Si fixture fires `si_tradition_built_from_chaos`. Same assertions for Ti / Fi / Fe fixtures (3 sets analogous).
- `fixtures-all-have-gravity-attribution`: Each of the 4 new fixtures has non-empty `topGravity[0]`. Their rendered masthead contains "looks first toward {gravity}".
- `fixtures-all-have-top-compass`: Each of the 4 new fixtures has at least 4 entries in `topCompass`.
- `fixtures-all-have-realistic-movement`: Each of the 4 new fixtures has non-zero `goalSoulMovement.goal` AND non-zero `goalSoulMovement.soul` (no length=0 thin-signal cases).
- `fixtures-cohort-now-has-all-functions-dominant`: Across the now-24-fixture cohort, all 8 functions appear as dominant in at least one fixture. (Pre-CC: only Ni / Ne / Se appeared dominant. Post-CC: Si / Ti / Fi / Fe added.)
- `fixtures-cohort-coverage-improved`: Re-running `tests/audit/functionCoverage.audit.ts`'s Measurement 1 shows non-Ni functions now firing in Pattern in motion blocks. Specifically: Si in ≥1/24 fixtures, Ti in ≥1/24, Fi in ≥1/24, Fe in ≥1/24.
- `fixtures-gravity-attribution-improved`: Re-running gravity-related audits shows masthead "looks first toward..." now fires for at least 4 of 24 fixtures (the new ones).
- `fixtures-no-existing-fixture-modifications`: Existing 20 fixtures unchanged byte-for-byte (regression check; CC-FIXTURES only adds, never modifies existing).

## Out of Scope (Do Not)

1. **Do NOT modify any signal pool, intensity math, or composite consumption.** Pure fixture authoring + audit additions; no engine code changes.
2. **Do NOT modify any existing fixture files.** The 20 existing fixtures stay byte-for-byte unchanged. CC-FIXTURES only adds 4 new files.
3. **Do NOT modify the question bank** (`data/questions.ts`). New fixtures consume the existing questions; no new questions are added.
4. **Do NOT modify any composer, renderer, or React component.** Pure data work.
5. **Do NOT modify any pre-CC audit assertions.** All `prose-1-*`, `prose-1a-*`, `prose-1b-*`, `synth-1a-*`, `synth-1f-*`, `cleanup-1f-*`, `jungian-completion-*`, OCEAN, Goal/Soul/Give regression assertions stay green; CC-FIXTURES adds new `fixtures-*` assertions in a new file.
6. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo.
7. **Do NOT install dependencies.**
8. **Do NOT exceed 4 new fixtures.** Even if the executor sees opportunities to add (e.g., Ne complement, Te complement, additional Si variant), this CC's scope is exactly 4. Future fixture work can address other gaps.
9. **Do NOT compose unrealistic minimum-viable fixtures.** Each persona must be a coherent person with answers across all questions in the bank — not a synthetic input that ticks just the boxes needed for the dominant function. The fixture should be a fixture you could imagine an actual user producing.
10. **Do NOT make the new fixtures all generative / Goal-strong.** Each persona has its own Movement position per the spec; some Soul-leaning, some balanced, one Goal-leaning. Cohort variety is part of the value.
11. **Do NOT introduce new vocabulary in fixture personas.** The personas are answer profiles; the engine's prose templates produce the user-facing output. The fixture authoring decides what gets fed in, not what comes out.
12. **Do NOT modify CC-029 patterns or their compound trigger conditions.** The fixtures meet the existing conditions; the conditions are not adjusted.
13. **Do NOT add demographic combinations that don't exist in the engine's known options.** Confirm via grep on demographic answer keys what the engine supports for gender / age / family-stage / marital-status. Use only those.

## Acceptance Criteria

1. 4 new fixture JSON files created at `tests/fixtures/ocean/24-si-precedent-keeper.json`, `25-ti-coherence-prober.json`, `26-fi-inner-truth-anchor.json`, `27-fe-room-reader-attuned.json` (or correct numbering per existing convention).
2. Each new fixture loads cleanly and produces `buildInnerConstitution` output without errors.
3. Each new fixture's `lens_stack.dominant` matches its target function (Si / Ti / Fi / Fe respectively).
4. Each new fixture meets the compound trigger condition for its respective CC-029 pattern, and the pattern fires when run.
5. Each new fixture has non-empty `topGravity[0]` and the masthead contains "looks first toward {gravity}" prose.
6. Each new fixture has 4+ entries in `topCompass` and non-zero Goal AND non-zero Soul.
7. All 11+ new `fixtures-*` audit assertions pass.
8. All existing audit assertions (CC-PROSE / CC-SYNTHESIS-1A / CC-SYNTHESIS-1F / CC-JUNGIAN / OCEAN / Goal/Soul/Give) still pass — the new fixtures don't break any pre-CC assertion.
9. Re-running `tests/audit/functionCoverage.audit.ts` shows function coverage improvements: Si / Ti / Fi / Fe each fire patterns in ≥1/24 fixtures (post-CC).
10. Re-running `tests/audit/jungianCompletion.audit.ts` shows the 4 CC-029 patterns now fire empirically (each in ≥1/24 fixtures).
11. `npx tsc --noEmit` exits 0.
12. `npm run lint` exits 0.
13. `git status --short` shows only the 4 new fixture files + the new audit file.

## Report Back

1. **Summary** in 5-7 sentences. Confirm 4 new fixtures shipped. Name each fixture's persona briefly. Confirm CC-029 patterns now fire on the new cohort. Confirm gravity attribution surfaces on all 4 new fixtures.
2. **Per-fixture render samples** — for each of the 4 new fixtures, paste the masthead (first 3-5 sentences) confirming:
   - Function plain-English label appears in the masthead's "Yours is a shape led by..." opening
   - Top-Compass-1 value appears as "protects {value}"
   - Gravity attribution appears as "looks first toward {gravity}"
3. **Pattern firing verification** — for each fixture, confirm which CC-029 pattern fires (`si_tradition_built_from_chaos` / `ti_closed_reasoning_chamber` / `fi_personally_authentic_only` / `fe_attunement_to_yielded_conviction`) and paste the rendered "Pattern in motion" block from the appropriate card.
4. **Function-coverage audit re-run** — paste the post-CC Measurement 2 from `tests/audit/functionCoverage.audit.ts`. Confirm Si / Ti / Fi / Fe now show non-zero "In Pattern in motion" counts.
5. **Gravity audit re-run** — confirm number of fixtures with masthead "looks first toward..." went from 0/20 to ≥4/24 (the 4 new ones; existing 20 unchanged).
6. **Audit pass/fail breakdown** — including all 11+ new `fixtures-*` assertions, all prior assertion suites' regression status.
7. **Fixture variety check** — confirm the 4 personas are coherent and distinct. The point isn't just to fill the function-dominance gap; it's to add cohort variety so the synthesis layer has more shapes to express through. Are the 4 personas a meaningful expansion of the cohort's range?
8. **Out-of-scope verification** — git status; confirm only 4 new fixture files + new audit file changed. Existing 20 fixtures byte-for-byte unchanged.
9. **Recommendations for follow-on**:
   - **Existing-fixture refresh:** the canonical Jason fixture (`07-jason-real-session.json`) doesn't surface gravity attribution despite the live session producing it. A separate refresh CC could update the canonical fixtures to match live session data; flag for queueing.
   - **Te-dominant complement fixture:** Te is at 16/20 body / 0/20 patterns post-CC-JUNGIAN; adding a Te-dominant fixture (the existing Ni-aux-Te is dominant Ni, not Te) would close the function-dominance gap fully. Could be CC-FIXTURES-TE-COMPLEMENT.
   - **Cohort thinness on tertiary signals:** if any of the new fixtures still hit thinness fallback for Trust / Weather despite being authored to surface those signals, that's a fixture-spec issue worth flagging.
   - **Re-running CODEX-PROSE-CORRELATION post-cohort-expansion:** the cohort distribution (cost%/coverage%/compliance% leans, Movement quadrant counts, etc.) shifts with 4 new fixtures. The 3C/Goal-Soul correlation audit should be re-run to confirm the synthesis hypothesis still holds (or strengthens) with broader cohort variety. Particularly: Compliance↔Grip correlation was 0.16 in the 20-fixture audit; the new fixtures' compliance distribution may reveal whether that correlation was statistically underpowered or genuinely absent.
