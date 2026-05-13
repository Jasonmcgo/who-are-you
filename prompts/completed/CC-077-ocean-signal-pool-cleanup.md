# CC-077 — OCEAN Signal-Pool Cleanup + Calibration Retune + Prose Polish

**Origin:** CC-075 §7 documented two real architectural over-tagging issues that calibration alone couldn't fix: (1) Q-T fractional contributions inflate Extraversion via cog-function multi-tagging — an INTJ/INTP fires te/ne/se/fe at varying ranks and each contributes a fractional E weight, so cumulative E reaches 15+ before any direct E signal fires; (2) Agreeableness double-counts the love-line — `coverage_drive`, `partner_trust_priority`, `close_relationships_stakes_priority`, `family_trust_priority` all tag A, but they primarily measure Soul-line content. Plus: Jason's post-CC-075 report notes (2026-05-07 chat) target tighter calibration than CC-075 produced — particularly E should land in the **moderate-situational band [45–65]**, not low (≤ 40). The body-map cards read his default-introvert mode correctly; the OCEAN trait should reflect full activation capacity, not just default mode.

**Scope frame:** Three coordinated changes. (1) Signal-pool cleanup — fix the over-tagging so the math has clean inputs. (2) Calibration retune — re-tune `INTENSITY_K` so the Jason fixture and designed fixtures both land in honest bands after the cleaner inputs. (3) Prose-template polish — update the per-trait paragraph templates to absorb four sharper phrasings from Jason's notes (care-with-a-spine for high-A; openness-under-discipline for architectural-led O; situational-and-measured for moderate-E (NEW band); composure-analysis-structure-delayed-recognition for ER proxy disclosure).

**No new questions. No new signals.** Re-tagging existing signals only.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. The three changes are coordinated — signal-pool cleanup changes the weighted sums, retune adjusts k constants for the new sums, prose polish reflects the new band targets. Execute in that order. On ambiguity, default to canon-faithful interpretation per `docs/ocean-disposition-spec.md` and flag in Report Back.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:ocean:diagnose`
- `npm run audit:goal-soul-give` (regression check)
- `npm run dev` — visual verification
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `ls`, `grep`, `find`

## Read First (Required)

1. `docs/ocean-disposition-spec.md` — esp §3.1–§3.4 (signal candidates per Openness subdimension), §4 (Agreeableness register), §6 (render register).
2. `lib/ocean.ts` — full file. The signal-pool tagging table (likely a constant near the top), the `INTENSITY_K` constants from CC-075, the `intensityFromWeight` function, the trait composite computation.
3. `lib/oceanDashboard.ts` — full file. The `composeOceanProse` function and per-trait paragraph templates.
4. `tests/audit/oceanDashboard.audit.ts` — current calibration assertions, especially the Jason fixture's `intensities.extraversion ≤ 40` guard from CC-075 (this changes to the moderate band).
5. `tests/fixtures/ocean/01–07*.json` — all 7 fixtures. Their target bands need to recover after signal-pool cleanup.
6. `prompts/completed/CC-075-ocean-intensity-calibration.md` — esp §7 (suspected mis-tagged signals), §3 (calibration choice — saturation curve), §10 (spec drift report).
7. `lib/types.ts` — confirm `SignalId` union still includes the love-line signals being re-tagged (`coverage_drive`, `partner_trust_priority`, `close_relationships_stakes_priority`, `family_trust_priority`). Don't change the SignalId union; only the tag mappings.
8. `lib/goalSoulGive.ts` and `lib/goalSoulMovement.ts` — verify these signals still feed the Soul composite (they should). The CC must not regress Soul scoring.

Memory cross-references:

- `feedback_minimal_questions_maximum_output` — re-tag existing signals before adding new ones; this CC is exactly that pattern.
- `feedback_synthesis_over_contradiction` — internal report coherence is canonical.
- `project_ocean_disposition_spec` — current canon state; this CC adds drift documented for a follow-on CODEX.

## Allowed to Modify

These files only.

1. **`lib/ocean.ts`** — three changes:
   - **Signal-pool tagging table:** remove `E` from the multi-tag set for Q-T cog-function signals `ne`, `se`, `te`, `fe`. Each of these stays tagged into its native trait (ne→O, se→O, te→C, fe→A) but loses the secondary E split. Document the change with comments citing CC-077.
   - **A signal-pool cleanup:** for each of `coverage_drive`, `partner_trust_priority`, `close_relationships_stakes_priority`, `family_trust_priority` — remove or down-weight the A tag so these primarily feed the Goal/Soul composites (which they already do). Document each change inline. Verify each signal is still consumed by `lib/goalSoulGive.ts` for Soul derivation; CC-077 must not break Soul.
   - **`INTENSITY_K` retune:** after the cleanup changes the weighted sums, re-tune the per-bucket k constants so Jason's session lands at target bands AND designed fixtures recover their bands. Approximate target k values (validate empirically): `O ≈ 0.030`, `C ≈ 0.050`, `E ≈ 0.060` (boosted to compensate for fewer E inputs), `A ≈ 0.045`, `N ≈ 0.20` (unchanged — proxy-only pool small).

2. **`lib/oceanDashboard.ts`** — prose-template polish per Jason's notes + Clarence's review:

   **Canonical target prose (Jason's profile, post-CC-077):** Clarence's revised version is the verbatim canon for what the high-A + architectural-O + moderate-E + proxy-ER profile should render. The four template updates below produce text that matches this canon when applied to Jason's intensity profile.

   - **High-A template** (intensity ≥ 80): two changes.
     - **Deduplication:** the current template says *"truth and responsibility may still outrank surface harmony"* TWICE — once in the loyalty disambiguation and once in the moral-concern register restatement. Remove the second occurrence. Clarence's flagged regression: *"the current paragraph repeats itself a bit."*
     - **"Care with a spine" closing:** the closing sentence of the high-A paragraph becomes *"The high signal is not 'softness'; it is care with a spine."* Verbatim or close paraphrase. Replaces what was the duplicate sentence.
     - **Target post-CC-077 paragraph (Clarence's verbatim version, for validation):** *"Your concern for others registers strongly, but not primarily as automatic accommodation. This appears more as loyalty, moral concern, protective care, service, and relational obligation. In conflict, truth and responsibility may still outrank surface harmony. The high signal is not 'softness'; it is care with a spine."* (Four sentences; the truth/responsibility phrase appears exactly once.)

   - **Architectural-Openness flavor** (subdimension architectural-led): replace the current generic flavor sentence (*"Your openness reads broadly — multiple registers active, no single dominant flavor"*) with Clarence's full three-sentence architectural-led chain:
     - Sentence 1: *"Your openness reads as structured and conceptual rather than novelty-seeking."*
     - Sentence 2: *"The imagination register is alive, but it tends to look for form: frameworks, models, songs, systems, strategies, meanings, and long-arc patterns."*
     - Sentence 3: *"This is openness under discipline — creativity that wants architecture."*
     - Verbatim or close paraphrase across all three sentences. The architectural-led template is the full chain, not just the closing phrase.

   - **Moderate-E template — NEW band (intensity ∈ [40, 65]):** the current code likely has only "low" (≤ 39) and "high" (≥ 60) E templates. Add a moderate-band template: *"Your outward energy reads as situational and measured. You can move outward when the moment, role, or mission calls for it, but your interior process does not automatically broadcast itself. Much of your care, conviction, and pattern-reading may require deliberate translation before others can see it."* Verbatim or close paraphrase. The band threshold for selecting this template: 40 ≤ intensity < 65.

   - **ER proxy disclosure addendum:** append to the existing proxy disclosure: *"and may sometimes be processed through composure, analysis, structure, or delayed recognition."* Verbatim or close paraphrase. Clarence's full version: *"This should be treated cautiously because the instrument estimates it through proxy signals rather than direct measurement. The safer read is not that emotion is absent, but that emotional reactivity may not be easily visible from the outside, and may sometimes be processed through composure, analysis, structure, or delayed recognition."*

3. **`tests/audit/oceanDashboard.audit.ts`** — assertion updates:
   - Jason fixture target bands: `extraversion ∈ [40, 65]` (moderate, replaces CC-075's `≤ 40` guard); `conscientiousness ∈ [80, 95]`; `agreeableness ∈ [75, 90]`; `openness ∈ [65, 85]`; ER proxyOnly === true.
   - Designed-fixture band recovery: 01-architectural A returns to ≥ 80 (was demoted to moderate-high in CC-075); 02-high-conscientiousness C returns to ≥ 80; 04-high-agreeableness A returns to ≥ 85.
   - **New prose-quality assertions:**
     - When `intensities.agreeableness ≥ 80`, the rendered A paragraph contains the substring "care with a spine" (or close paraphrase — match the canonical phrase or verify a register-coherent equivalent).
     - **High-A deduplication assertion:** the rendered A paragraph contains the substring "truth and responsibility may still outrank surface harmony" (or close paraphrase) **at most once**. Doubled occurrence is a regression of the duplicate-phrase Clarence flagged.
     - When `opennessSubdimensions.architecturalLed === true`, the O paragraph contains both "structured and conceptual" AND "openness under discipline" (or close paraphrases of both — confirms the full architectural-led chain rendered, not just one sentence).
     - The architectural-led O paragraph does NOT contain "broadly — multiple registers active, no single dominant flavor" (the generic mixed-flavor fallback Clarence flagged as wrong-register).
     - When `intensities.extraversion ∈ [40, 65]`, the E paragraph contains "situational and measured" or close paraphrase. Does NOT contain "low" or "lower than average" — those are wrong-band registers.
     - When `proxyOnly === true`, the ER paragraph contains "composure" AND "delayed recognition" (or close paraphrases of both).
   - Distribution-cap assertions from CC-075 still hold (no >2 traits ≥95 per fixture; no trait >50% saturation across bank).

4. **`tests/fixtures/ocean/07-jason-real-session.json`** — update the fixture's expected-band sidecar / comment block (if present) to reflect the new target bands. The answer set itself does NOT change; only the calibration target documentation.

## Out of Scope (Do Not)

1. **Do NOT add Q-O1 (Openness subtype) or Q-O2 (direct ER)** to `data/questions.ts`. Both remain queued.
2. **Do NOT add any new signal** to `lib/types.ts` SignalId / SIGNAL_DESCRIPTIONS / extractors.
3. **Do NOT modify `SIGNAL_DRIVE_TAGS`** in `lib/drive.ts`. Drive bucket tags (cost/coverage/compliance) are separate from OCEAN trait tags. The love-line signals stay in their Drive buckets unchanged.
4. **Do NOT modify Goal/Soul/Movement files** (`lib/goalSoulGive.ts`, `lib/goalSoulMovement.ts`, `lib/goalSoulPatterns.ts`, `lib/goalSoulDashboard.ts`). The love-line signals must continue feeding Soul exactly as before. Verify by inspection — do not edit.
5. **Do NOT modify `lib/identityEngine.ts`, `lib/renderMirror.ts`, or `app/components/InnerConstitutionPage.tsx`.** The wiring is correct; only OCEAN-internal tagging and prose templates change.
6. **Do NOT modify `docs/ocean-disposition-spec.md` or `docs/goal-soul-give-spec.md`.** Spec drift introduced by this CC is documented for a follow-on CODEX.
7. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`.**
8. **Do NOT install new dependencies.**
9. **Do NOT remove the legacy `OceanOutput.distribution` field.** That migration is a separate CODEX (queued).
10. **Do NOT change the saturation curve formula** (`100 × (1 − exp(−k × weighted_sum))`). Only `k` constants change.
11. **Do NOT introduce new render bands.** The five canonical bands (under-detected/low/moderate/moderate-high/high) per spec §2.1 are unchanged. The moderate-E template fits the existing moderate band; nothing is added to the band schema.
12. **Do NOT remove fe→A tagging.** fe is the room-reader cog-function and legitimately feeds Agreeableness via accommodation/relational-energy aspects. Only the love-line signals (coverage/partner-trust/close-relationships-stakes/family-trust) lose A tags. Do NOT widen the A cleanup to other accommodation-coded signals.
13. **Do NOT ship a Jason fixture with E intensity outside [45, 65].** That's the canonical coherence band post-CC-077; outside it means the calibration missed.
14. **Do NOT moralize on any trait band in prose.** "You should be more open" is forbidden; "your openness register reads structured" is in-register.
15. **Do NOT use the words "low extraversion" or "lower-than-average" in the moderate-E template.** Those are wrong-band register; moderate-E is "situational and measured," not a softer "low."

## Acceptance Criteria

### Signal-pool cleanup

1. The Q-T cog-function signal-pool tagging in `lib/ocean.ts` no longer includes `E` for `ne`, `se`, `te`, `fe`. Each retains its native trait tag (ne→O, se→O, te→C, fe→A) only.
2. The four love-line signals — `coverage_drive`, `partner_trust_priority`, `close_relationships_stakes_priority`, `family_trust_priority` — no longer tag into A. Each retains its native non-A tags (Drive bucket per `SIGNAL_DRIVE_TAGS`, Soul composite via Goal/Soul derivation).
3. Soul composite from `lib/goalSoulGive.ts` continues to read all four signals. Verified by re-running `npm run audit:goal-soul-give` — all 11 Goal/Soul fixtures continue to pass with unchanged Soul scores. Regression-clean.

### Calibration retune

4. `INTENSITY_K` constants updated. Documented as tunables with explanatory comments citing CC-077.
5. **Jason fixture (`07-jason-real-session.json`)** lands at:
   - `extraversion ∈ [40, 65]` (moderate band — the corrected coherence target)
   - `conscientiousness ∈ [80, 95]` (high band)
   - `agreeableness ∈ [75, 90]` (high band)
   - `openness ∈ [65, 85]` (moderate-high to high band)
   - `emotionalReactivity` intensity 0 AND `proxyOnly === true`
6. **Designed fixtures recover their bands:**
   - `01-architectural-openness`: A ≥ 80 (returns to high)
   - `02-high-conscientiousness`: C ≥ 80 (returns to high)
   - `03-low-extraversion-high-soul`: E ≤ 40 (stays under-detected/low — verifies that situational-E is differentiated from genuine-low-E by signal density, not by curve)
   - `04-high-agreeableness-loyalty`: A ≥ 85 (returns to high or saturating)
   - `05-low-emotional-reactivity-proxy`: ER `proxyOnly === true`
   - `06-thin-signal-under-detected`: every trait still in low or under-detected band
7. Distribution-cap assertions from CC-075 still pass: no fixture has >2 traits ≥95; no trait saturates ≥95 in >50% of fixtures.

### Prose-template polish

8. The high-A paragraph template (intensity ≥ 80) contains the "care with a spine" disambiguation. Audit asserts on at least 2 fixtures (Jason at A=81; fixture 04 at A=85+).
9. The architectural-Openness flavor sentence reads "openness under discipline — creativity that wants architecture" or close paraphrase. Audit asserts on Jason fixture and 01-architectural fixture.
10. The moderate-E template exists and renders on intensity ∈ [40, 65]. Contains "situational and measured" and "deliberate translation" (or close paraphrases). Does NOT contain "low," "lower than average," or "social-energy register reads lower" — those are wrong-band registers reserved for the low-E template. Audit asserts on Jason fixture (E in moderate band).
11. The ER proxy disclosure addendum mentions "composure" and "delayed recognition" (or close paraphrases of both) when `proxyOnly === true`. Audit asserts on Jason fixture and 05-low-emotional-reactivity fixture.

### Build hygiene

12. `npx tsc --noEmit` exits 0.
13. `npm run lint` exits 0.
14. `npm run audit:ocean` exits 0.
15. `npm run audit:goal-soul-give` exits 0 (regression — Soul composite unaffected).
16. `git status --short` shows ONLY Allowed-to-Modify files.
17. `data/questions.ts` unchanged (40 question_ids).
18. No new dependencies.

## Report Back

1. **Summary** — what was changed in 6–10 sentences across the three coordinated changes.
2. **Signal-pool cleanup verification** — for each Q-T cog-function and each love-line signal, paste the BEFORE and AFTER tag set. Confirm the changes are minimal and surgical.
3. **Soul composite regression check** — confirm `lib/goalSoulGive.ts` still consumes the four love-line signals via the Soul derivation path. Quote the relevant lines or summarize the inspection.
4. **Calibration retune** — for each of the 7 fixtures, report (a) weighted sums per trait BEFORE and AFTER cleanup, (b) intensities BEFORE and AFTER retune. Tabular.
5. **Jason fixture target audit** — explicit per-trait pass/fail vs the AC §AC-5 target bands.
6. **Designed-fixture band recovery audit** — explicit per-trait pass/fail vs the AC §AC-6 recovery targets.
7. **Prose-template diffs** — paste the verbatim BEFORE and AFTER for each of the four template updates (high-A, architectural-O flavor, moderate-E (NEW), ER proxy addendum).
8. **Distribution-cap audit** — confirm both CC-075 distribution-cap assertions still pass.
9. **Canon ambiguities** — quote spec, name calls.
10. **Files modified** — every path with line-count delta.
11. **Out-of-scope verification** — `git status --short`.
12. **Spec ↔ code drift report** — note the spec needs follow-on sync (CODEX-078 or similar) for: §3.4 signal candidates (the love-line removals), §6 render register (moderate-E new band template), §4 Agreeableness register (the "care with a spine" canonical phrase). Document the drift; do NOT fix here.
13. **Open questions** — anything that surfaced.

---

## Method note

**The three coordinated changes are tightly bound.** Don't ship signal-pool cleanup without the calibration retune — the cleanup drops weighted sums for E and A, so the existing k constants would crush those traits. Don't ship the calibration retune without the cleanup — the curve is structurally fine; the over-tagging is the actual bug. And don't ship cleaner numbers without the prose polish — Jason's E lands in moderate but the engine renders it with "low" prose, contradicting the moderate band itself.

**The Extraversion target shift is canon, not preference.** Earlier coherence-guard framing said E ≤ 40 (because body-map cards consistently read low-E). Jason's notes refined this: trait = capacity, not default mode. Body-map cards correctly read default-introvert posture; OCEAN E should reflect full activation range, which is moderate-situational (45–65), not low (≤40). This is an architectural clarification, not a calibration loosening. The audit's coherence guard moves from `≤ 40` to `∈ [40, 65]`.

**The "care with a spine" phrase is canonical.** It does load-bearing register work: distinguishes loyalty-with-conviction-for-truth from accommodation-for-harmony in a single phrase users can carry. Future Agreeableness calibration CCs should preserve it.

**Architectural Openness flavor sentence is the user-facing payoff for the Architectural subdimension being added in CC-072.** Without this prose polish, an architectural-led user gets "openness reads broadly — multiple registers active, no single dominant flavor" (the mixed-flavor fallback). With it, the Architectural-led case lands its signature sentence: "openness under discipline — creativity that wants architecture."

**Moderate-E is the new band template that didn't exist before.** Spec §6 register table likely defines low and high E narratives; moderate has been ambient. CC-077 introduces it as a first-class template. The follow-on CODEX should canonize the template in the spec.
