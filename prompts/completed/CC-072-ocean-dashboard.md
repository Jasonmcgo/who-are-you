# CC-072 — OCEAN Dashboard (math fix + Disposition Signal Mix surface + Openness subdimensions)

**Origin:** `docs/ocean-disposition-spec.md` full architecture memo. Predecessors: CC-067, CC-068, CC-070, CC-071. **This is the OCEAN-A CC** in the OCEAN chain (memo §12). Reads §1 hierarchy, §2 math/label canon, §3 Openness subdimensions, §4 Agreeableness register, §5 Emotional Reactivity confidence handling, §6 render register, §7 OCEAN ↔ Goal/Soul composition, §8 OCEAN ↔ body-map landing points, §10 guardrails.

**Scope frame:** Apply the dashboard pattern from CC-071 to the OCEAN/Disposition layer. Six coordinated changes:

1. **Math fix.** Independent trait intensity (0–100 per trait), NOT 100%-summing distribution. Each trait stands alone as a measure; summing them is meaningless. Drop or rename the existing 100%-normalized field to `signalShareDeprecated` or remove; introduce `intensities: { openness, conscientiousness, extraversion, agreeableness, emotionalReactivity }` each in [0, 100].
2. **Dashboard surface.** Replace the existing distribution display with a `## Disposition Signal Mix` section: per-trait intensity bars (0–100, independent), signal-dominance rank order in a separate sentence, `Emotional Reactivity` translated to "low or under-detected" with proxy disclosure when intensity < 20. SVG horizontal bar chart for visual.
3. **Openness subdimensions** (re-tag existing signals into 4 subdimensions per memo §3): Intellectual / Aesthetic / Novelty / Architectural. Audit whether each subdimension carries from existing signal pool; surface a one-sentence flavor read in the dashboard with subdimension breakdown in expander; flag thin subdimensions for Q-O1 (deferred to question-additions chain).
4. **Agreeableness register interpretation** (memo §4): when Agreeableness intensity is moderate-or-higher, the prose explicitly distinguishes loyalty/service/moral-concern from accommodation/social-softness. Render canon §4 is binding.
5. **Emotional Reactivity 0% guard** (memo §5): never render 0%; translate to "low or under-detected" with proxy-signal disclosure.
6. **OCEAN ↔ Goal/Soul cross-references** (memo §7): each trait's prose paragraph adds a one-sentence cross-reference to how it modifies the Goal/Soul read (Conscientiousness × Goal, Openness × Soul, etc.) when the corroborating composite is present. Soft wiring per the "every signal feeds every relevant derivation" discipline.

**No new questions.** Q-O1 (Openness subtype) and Q-O2 (direct ER) remain queued in the question-additions chain.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions`, or in-session via `/permissions` → bypass.

## Execution Directive

Complete in a single pass. The OCEAN spec memo is the canon source; read sections §1–§8 and §10 carefully before editing. On ambiguity, apply canon-faithful interpretation per the memo and flag in Report Back.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give` (existing; CC-072 may add `npm run audit:ocean` separately)
- `npm run dev` — visual verification of dashboard render
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `ls`, `grep`, `find`

## Read First (Required)

1. `docs/ocean-disposition-spec.md` — full file. **§1 hierarchy, §2 math/label canon, §3 Openness subdimensions (esp §3.4 Architectural Openness signal candidates and §3.6 audit-first discipline), §4 Agreeableness register, §5 Emotional Reactivity confidence handling, §6 render register, §7 OCEAN ↔ Goal/Soul composition, §8 OCEAN ↔ body-map landing points, §10 guardrails.**
2. `docs/goal-soul-give-spec.md` — for §13.4a Dashboard surface specification (template for OCEAN dashboard) and §14 OCEAN Integration cross-reference.
3. `AGENTS.md` — including the new Question Bank Architecture section (50-question ceiling).
4. `lib/ocean.ts` — full file. The math fix and re-tagging happen here. Document the existing signal pool and how it currently produces the 100%-summing distribution.
5. `lib/types.ts` — `OceanOutput`, `OceanDistribution`, `OceanCase`, `InnerConstitution`. Plan extensions.
6. `lib/identityEngine.ts` — `buildInnerConstitution` wiring path for OCEAN.
7. `lib/renderMirror.ts` — current Disposition Map render path. Find the lines that emit "Distribution: Openness X%, ..." and their surrounding context.
8. `lib/goalSoulMovement.ts` — for the dashboard surface pattern from CC-071 (Goal/Soul Dashboard) to mirror.
9. `lib/goalSoulDashboard.ts` — for the SVG rendering pattern to follow.
10. `tests/audit/goalSoulGive.audit.ts` — for the audit harness pattern.
11. `prompts/completed/CC-067-…md`, `prompts/completed/CC-070-…md`, `prompts/completed/CC-071-…md` — for context on the prior chain. CC-071's report `§13` contains explicit recommendations for OCEAN that this CC operationalizes.
12. `data/questions.ts` — for the existing OCEAN signal pool (audit which signals currently feed OCEAN derivation). Per memo §3.6.
13. `data/demographics.ts` — for `age`, `profession` fields used in any life-stage-aware OCEAN prose.

Memory cross-references that bear on this CC:

- `feedback_minimal_questions_maximum_output` — re-tag existing signals before adding new ones (Q-O1 deferred).
- `feedback_synthesis_over_contradiction` — coherence reads where evidence supports them.
- `feedback_marble_statue_humanity_gap` — accuracy without warmth is the gap.
- `project_ocean_disposition_spec` — current canon state.
- `project_goal_soul_give_spec` — sister memo, especially the asymmetric lift architecture (template for OCEAN composition rules).

## Allowed to Modify

These files only.

1. **`lib/types.ts`** — add `OceanIntensity` type (one per trait, 0–100), `OceanDominance` type (rank order), `OceanSubdimensions` type (4 Openness subdimensions), `DispositionSignalMix` type (the dashboard payload). Extend `OceanOutput` with these new fields. Mark the existing `distribution: OceanDistribution` (the 100%-summing one) as `@deprecated` or rename to `signalShareLegacy` for one CC of backward-compat, then schedule its removal in a follow-up CODEX.
2. **`lib/ocean.ts`** — full rewrite of `computeOceanOutput` math. Compute independent per-trait intensities (0–100 each) using existing signal pool. Compute signal dominance ranking. Compute Openness subdimension reads (Intellectual / Aesthetic / Novelty / Architectural) by re-tagging existing signals per memo §3.4. Apply Emotional Reactivity 0% guard: when computed intensity is 0 OR signal density is below threshold, set a `proxyOnly: true` flag and translate to "low or under-detected" downstream. Update `OceanCase` classifier to operate on independent intensities.
3. **`lib/oceanDashboard.ts`** — NEW FILE. Exports `renderOceanDashboardSVG(mix: DispositionSignalMix): string` for the horizontal-bar SVG. Exports `composeOceanProse(mix, goalSoulGive)` for the Disposition Signal Mix prose paragraphs (per-trait paragraphs in dominance order; cross-references to Goal/Soul where corroborating composite is present).
4. **`lib/identityEngine.ts`** — wire the new OCEAN derivation path. Should be a 1–2 line change since OCEAN was already wired (the change is replacing the call's output handling).
5. **`lib/renderMirror.ts`** — replace the existing Disposition Map render with `## Disposition Signal Mix` section. Per memo §6.1: section heading is "Disposition Signal Mix" (NOT "OCEAN", NOT "Big Five", NOT "Personality"). Per memo §6.2: trait names appear after narrative names ("Your strongest signal is in *how you organize your effort* — Big Five Conscientiousness — registering as moderate-high..."). Render order: Disclaimer → Lede paragraph → Per-trait paragraphs (dominance order) → SVG bar chart → Optional expander mock-up (the expander itself is UI-side; renderMirror just emits the data block).
6. **`tests/audit/oceanDashboard.audit.ts`** — NEW FILE. Audit harness for OCEAN. Pattern matches `tests/audit/goalSoulGive.audit.ts`. Asserts: math is independent (no 100%-summing); intensity bands map correctly to render bands (under-detected/low/moderate/moderate-high/high); ER 0% guard fires correctly; Openness subdimension flavor reads match expected; Agreeableness loyalty-register prose fires when intensity ≥ 60; cross-references to Goal/Soul fire when corroborating composite is present; section heading is "Disposition Signal Mix" not "OCEAN"/"Big Five"; 100%-summing percentages do NOT appear in user-facing prose; "0%" does not appear for Emotional Reactivity; SVG bar chart is valid SVG and contains 5 bars.
7. **`tests/fixtures/ocean/*.json`** — NEW DIR. 6–8 fixtures spanning the trait space: high-Conscientiousness profile, high-Openness (each subdimension), low-Extraversion + high-Soul, high-Agreeableness moderate (loyalty register firing), low Emotional Reactivity (proxy only), Architectural Openness profile (the Jason-specific case Clarence flagged), thin-signal/under-detected case.
8. **`package.json`** — add `"audit:ocean": "tsx tests/audit/oceanDashboard.audit.ts"` to scripts. No new dependencies.

## Out of Scope (Do Not)

1. **Do NOT add Q-O1 (Openness subtype) or Q-O2 (direct Emotional Reactivity)** to `data/questions.ts`. Both are queued in the question-additions chain. CC-072 re-tags existing signals only.
2. **Do NOT add any new signal** to `lib/types.ts` SignalId / SIGNAL_DESCRIPTIONS / extractors. Re-tagging existing signals is the entire point of this CC — adding new ones contradicts memo §3.6.
3. **Do NOT modify `SIGNAL_DRIVE_TAGS`** in `lib/drive.ts`.
4. **Do NOT modify `lib/goalSoulGive.ts`**, `lib/goalSoulMovement.ts`, `lib/goalSoulDashboard.ts`, `lib/goalSoulPatterns.ts` — these are CC-071's territory and the OCEAN derivation does not write to them. **Do** read `goalSoulGive` from `InnerConstitution` to compose the cross-reference prose; do not modify the source data.
5. **Do NOT touch `data/questions.ts`** — no question additions, no question rewordings.
6. **Do NOT modify the Closing Read or Movement render paths in `renderMirror.ts`** — those are CC-068/CC-070/CC-071 outputs and remain stable. Add the new Disposition Signal Mix section in its own render block.
7. **Do NOT install new dependencies.** Hand-rolled SVG only — no Recharts, no Chart.js. `tsx` already present.
8. **Do NOT render the 100%-summing distribution** anywhere in user-facing prose. Per memo §2.3 this is the primary bug being fixed; if you find yourself emitting `Openness X%, Conscientiousness Y%, ...` with X+Y+... ≈ 100, the implementation is wrong.
9. **Do NOT render "Emotional Reactivity 0%"** anywhere. Per memo §5.1, even when computed intensity is 0, the user-facing render translates to "low or under-detected" with the proxy-signal note.
10. **Do NOT collapse Agreeableness signals into "you are agreeable"** without the loyalty/service register disambiguation. Per memo §4.
11. **Do NOT use the section heading "OCEAN"**, "Big Five", or "Personality" — heading is "Disposition Signal Mix" (memo §2.4 + §6.1).
12. **Do NOT use therapy-coded language.** Forbidden: "your inner work", "shadow integration", "authentic self", "your true self", "do the work on yourself". Per memo §6.4.
13. **Do NOT moralize on a low or high trait.** Disposition is observation, not prescription. Per memo §10.
14. **Do NOT use OCEAN as a personality verdict.** "You are an introvert" is forbidden; "your social-energy register reads lower than average — much of the interior process may not automatically broadcast itself" is in-register. Per memo §6.4.
15. **Do NOT speak engine-layer math in user-facing prose** — no "your Openness intensity is 67"; use band names (moderate-high) instead. Per memo §10.
16. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`**.
17. **Do NOT modify `docs/goal-soul-give-spec.md` or `docs/ocean-disposition-spec.md`.** Spec is canon; CC reads it, doesn't edit.
18. **Do NOT add the Architectural Openness signal cluster as a new SignalId.** Per memo §3.4 the cluster is illustrative; the implementation re-tags existing signals (`building_energy_priority`, `proactive_creator` + `truth_priority` co-firing, Q-T `ni`+`te` co-prominence, `legacy_priority`, conviction signals + structured-output evidence, Q-3C1 `cost_drive`+`coverage_drive`). No new SignalId.

## Acceptance Criteria

### Math reframe (memo §2)

1. `OceanOutput.intensities: { openness, conscientiousness, extraversion, agreeableness, emotionalReactivity }`, each `number ∈ [0, 100]`. Independent — no normalization across traits.
2. The five intensities do NOT sum to a fixed total. A user can be high in multiple traits simultaneously. Verified by audit on at least 3 fixtures.
3. Render bands map per memo §2.1: 0–19 = under-detected; 20–39 = low; 40–59 = moderate; 60–79 = moderate-high; 80–100 = high.
4. `OceanOutput.dominance: OceanDominance` provides rank order across traits with tie-breaking on signal density. The strongest one or two traits are namable in the dashboard's lede sentence.
5. Existing 100%-summing `distribution: OceanDistribution` field either renamed (`signalShareLegacy`) or removed; user-facing render no longer emits it.

### Dashboard surface (memo §6)

6. Section heading is `## Disposition Signal Mix` exactly. Verified by grep.
7. Disclaimer line appears immediately under the heading: *"These describe the relative weight of disposition signals detected by the instrument across this assessment. They are not percentile scores against a population, and the trait readings are independent — high in one does not mean low in another."*
8. Lede paragraph names the strongest signal in narrative-name-first form per memo §6.2 (e.g., *"Your strongest signal is in how you organize your effort — Big Five Conscientiousness — registering as moderate-high."*).
9. Per-trait paragraphs render in dominance rank order. Each paragraph: narrative name + Big Five trait name + intensity band + register interpretation + cross-reference to Goal/Soul where corroborating composite is present.
10. SVG horizontal bar chart shipped via `lib/oceanDashboard.ts:renderOceanDashboardSVG`. Five bars (one per trait). Each bar fills 0–100% horizontally. Trait names labeled. No bar exceeds 100% width. Hand-rolled SVG, ~80 lines.
11. The user-facing render does NOT display "Openness 26%, Conscientiousness 35%, ..." or any 100%-summing format.

### Openness subdimensions (memo §3)

12. `OceanOutput.opennessSubdimensions: { intellectual, aesthetic, novelty, architectural }`, each `number ∈ [0, 100]`. Re-tagged from existing signals per memo §3.4.
13. The dashboard's Openness paragraph leads with a flavor sentence per memo §3.5 — one of: intellectual-led, aesthetic-led, novelty-led, architectural-led, mixed.
14. Subdimension breakdown is available as data on `OceanOutput.opennessSubdimensions` for an optional UI expander. The default markdown render emits ONLY the flavor sentence; the breakdown is engine-internal payload for downstream UI.
15. Audit reports per-subdimension confidence: high if ≥ 4 contributing signals fire; medium if 2–3; low/under-detected otherwise. Subdimensions with low confidence are flagged in the audit's Open Questions output for the question-additions chain.

### Agreeableness register (memo §4)

16. When `intensities.agreeableness ≥ 60`, the per-trait paragraph explicitly disambiguates loyalty/service/moral-concern from accommodation. Verified by audit on at least 2 fixtures.
17. Forbidden user-facing phrasing without disambiguation: *"You are highly agreeable"* alone. Verified by audit.
18. When the signal pattern fires accommodation cluster (low conviction signals + high `adapts_under_social_pressure` + low `high_conviction_expression`), the prose acknowledges the accommodation register alongside loyalty. Both registers can coexist; the lead is loyalty per memo §4.

### Emotional Reactivity (memo §5)

19. When `intensities.emotionalReactivity = 0` OR `proxyOnly = true`, the per-trait paragraph translates to "low or under-detected" with proxy-signal disclosure per memo §5.2 verbatim or close paraphrase.
20. The string "Emotional Reactivity 0%" does NOT appear in any user-facing render. Verified by audit grep.
21. The proxy-signal disclosure references the proxy approach explicitly: *"Because the instrument estimates this through proxy signals rather than direct measurement, it should be treated cautiously."* Verbatim or close paraphrase.

### OCEAN ↔ Goal/Soul cross-references (memo §7)

22. Each per-trait paragraph adds a one-sentence cross-reference when the corroborating composite is present:
    - Conscientiousness ≥ 60 AND Goal score ≥ 60 → reference the Work-line reinforcement.
    - Openness moderate-or-higher AND Soul score moderate-or-higher → reference Soul enrichment.
    - Architectural Openness moderate-or-higher AND Give quadrant → reference the disciplined-imagination synthesis.
    - Extraversion ≤ 35 AND Soul ≥ 60 → reference the love-line visibility caveat.
    - Agreeableness × Soul → reference the relational-care vs cause-driven-service distinction.
    - Emotional Reactivity proxy + high-pressure signal → reference steadiness-under-cost.
23. Cross-references read `constitution.goalSoulGive.adjustedScores` (not raw). Match the dashboard register CC-071 established.

### Audit

24. `tests/audit/oceanDashboard.audit.ts` runs 6–8 fixtures and prints PASS/FAIL per case to stdout. Exits 1 if any case fails.
25. Audit asserts: math independent (no 100%-summing); render bands correct; ER 0% guard fires; Openness subdimension flavor reads match expected; Agreeableness loyalty-register prose fires; cross-references to Goal/Soul fire when corroborating; section heading exact; SVG valid; forbidden strings ("OCEAN" / "Big Five" / "Personality" as heading; "0%" for ER; therapy phrasings) absent.
26. Audit reports thin Openness subdimensions for the question-additions chain.
27. Existing CC-067/068/070/071 audit (`audit:goal-soul-give`) continues to pass unchanged.

### Build hygiene

28. `npx tsc --noEmit` exits 0.
29. `npm run lint` exits 0.
30. `npm run audit:ocean` exits 0.
31. `npm run audit:goal-soul-give` exits 0 (regression check).
32. `git status --short` shows only Allowed-to-Modify files modified.
33. No new dependencies. `package.json` and `package-lock.json` only changed for the audit script entry (no `tsx` install since CC-067 added it).
34. `data/questions.ts` unchanged (40 question_ids preserved).

## Report Back

1. **Summary** — what was implemented in 6–10 sentences.
2. **Math reframe** — for at least 3 fixtures, report each trait's independent intensity (0–100) AND the old 100%-summing percentages for comparison. Show that two fixtures with different absolute intensities can have similar relative percentages, demonstrating the bug the fix addresses.
3. **Dashboard render verbatim** — the rendered text block + the SVG output (or first 30 lines) for at least 3 fixtures spanning low/moderate/high trait profiles.
4. **Openness subdimension audit** — for each fixture, report the four subdimension intensities and the flavor sentence selected. Flag any subdimension that consistently reads under-detected — that's the question-additions chain's evidence.
5. **Agreeableness register audit** — for the high-A fixture, quote the rendered paragraph showing the loyalty/service disambiguation.
6. **Emotional Reactivity audit** — for the under-detected fixture, quote the rendered paragraph showing the proxy-signal disclosure.
7. **Goal/Soul cross-references** — quote 3–5 examples of cross-reference sentences firing across fixtures (e.g., Conscientiousness × Goal reinforcement; Architectural Openness × Give synthesis; Extraversion × Soul visibility).
8. **Audit pass/fail breakdown** — fixture-by-fixture, assertion-by-assertion.
9. **Canon ambiguities encountered** — quote the spec, name the call.
10. **Files modified** — every path with line-count delta.
11. **Out-of-scope verification** — `git status --short` confirming only Allowed-to-Modify files.
12. **Spec ↔ code drift report** — anywhere `docs/ocean-disposition-spec.md` diverged from your implementation.
13. **Recommendations for the question-additions chain** — based on the subdimension audit, which subdimensions clearly need Q-O1 to land cleanly? What signal-density threshold below which the existing pool can't carry?
14. **Open questions** — anything that surfaced that the spec did not anticipate.

---

## Method notes

**This CC mirrors CC-071 architecturally.** Engine vocabulary on the dashboard (trait names, intensity bands, signal dominance), narrative vocabulary in the prose register interpretation (loyalty/service for Agreeableness, structured creativity for Architectural Openness, etc.). Two layers, two registers. Don't mix them.

**The 100%-summing bug is the primary fix.** Jason's own report — *"Distribution: Openness 26%, Conscientiousness 35%, Extraversion 15%, Agreeableness 24%, Emotional Reactivity (estimated) 0%"* — is exhibit A. Make sure the new render cannot produce that shape.

**Re-tag existing signals; don't add new ones.** The OCEAN spec memo §3.6 is binding on this point. If a subdimension is consistently thin from re-tagging alone, that's the evidence the question-additions chain needs to justify Q-O1. The audit reports the gap; this CC does not close it.

**Cross-references implement the wiring discipline.** Per Jason's instruction, every signal feeds every relevant derivation. The OCEAN dashboard's per-trait paragraphs include cross-reference sentences to Goal/Soul when the corroborating composite is present. This is the architecture making the disposition layer earn its place — it's not standalone; it modifies and colors the deeper outputs.

**The "trait names internal, narrative names external" register is the user-warmth fix.** Standard OCEAN reports lead with "Openness 47%". This CC leads with *"Your strongest signal is in how you organize your effort — Big Five Conscientiousness — registering as moderate-high."* The narrative name is the entry point; the trait name follows. Memo §6.2 is binding.
