# CC-075 — OCEAN Intensity Calibration

**Origin:** CC-072 produced an OCEAN dashboard with independent 0–100 trait intensities. Calibration was tuned against six designed fixtures. Production data shows the calibration is too aggressive: a real session (Jason's, 2026-05-07 17:50) lands at Openness 100 / Conscientiousness 100 / Extraversion 100 / Agreeableness 100 / Emotional Reactivity under-detected — saturating four traits simultaneously. The Extraversion = 100 reading **contradicts the same report's Path · Love and Compass observations**, which describe textbook low-Extraversion behavior ("you may not narrate care the way some people do"; "the conscience that holds the line may also become hard to reach when others need to be heard"; "the way you carry Knowledge and Peace reads as steadiness to the people inside your circle and may read as withholding to people outside it"). The same report disagrees with itself — that's an engine bug, not a calibration nuance.

CC-072's own §14 Open Questions and OCEAN spec §3.6 anticipated this: *"The intensity multipliers are stake-in-the-ground. Per-bucket multipliers calibrated against the 6 fixtures. Real-cohort calibration is the next layer; a future calibration CC could re-tune by running the audit against live saved sessions."* This CC is that layer.

**Scope frame:** Calibration only. No new signals, no new questions, no Big Five trait redefinition, no signal-pool changes. Either lower the multiplier constants OR replace the linear `signal_count × multiplier` math with a smoother saturation curve — whichever produces honest bands across the existing 6 fixtures AND the new real-session fixture. Add a distribution-cap audit assertion to catch the "all 100s" failure mode going forward.

---

## Launch Directive

Run with `claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Single pass. **Diagnose before tuning.** The first action of this CC is to inspect the actual signal counts produced by the canonical real-session fixture (Jason's session) per OCEAN trait — that data is the calibration anchor. Tuning blind without the diagnostic risks over-correcting in the other direction (everything reads as "low"). On ambiguity between linear multipliers vs smooth saturation curve, prefer the curve — it compresses the high end more naturally and matches the spec §3.6 "audit-first" discipline.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:ocean`
- `npm run audit:goal-soul-give` (regression check)
- `npm run dev` — visual verification of the rendered dashboard
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `ls`, `grep`, `find`

## Read First (Required)

1. `docs/ocean-disposition-spec.md` — esp **§2.1 (independent intensity render bands), §3 (Openness subdimensions), §3.6 (audit-first discipline), §10 (guardrails)**. The render bands (under-detected / low / moderate / moderate-high / high) are canon and don't change; only the math producing them changes.
2. `lib/ocean.ts` — full file. Find the per-bucket multipliers (CC-072 set: O=3.5, C=3.0, E=5.0, A=4.0, N=6.0) and the math that produces `intensities`. Document the existing math before changing it.
3. `lib/oceanDashboard.ts` — for the per-trait paragraph composition that consumes `intensities`. The dashboard will continue to read the post-calibration values; no changes here.
4. `tests/audit/oceanDashboard.audit.ts` — current audit harness. CC-075 extends with the distribution-cap assertion and the new real-session fixture's expected bands.
5. `tests/fixtures/ocean/01-architectural-openness.json` through `06-thin-signal-under-detected.json` — designed fixtures. Their target bands stay valid; calibration must not break their reads.
6. `prompts/completed/CC-072-ocean-dashboard.md` — predecessor; especially §4 (Openness subdimension audit), §9 (canon ambiguities — saturation curve choice), §14 (open questions, including the lift constants paragraph).
7. The user's pasted markdown report from 2026-05-07 17:50 — the canonical real-session evidence. Specifically: OCEAN reads all-100s for O/C/E/A; the same report's Path · Love, Compass, and Synthesis sections describe low-E patterns. The contradiction is the diagnostic anchor.
8. `data/questions.ts` — for the existing OCEAN signal pool. Audit which signals are tagged into Extraversion specifically (memo §6 trait→narrative mapping) — that's the suspected over-tagging source.

Memory cross-references that bear on this CC:

- `feedback_minimal_questions_maximum_output` — calibration over new measurement.
- `feedback_synthesis_over_contradiction` — coherence reads where evidence supports them; here, OCEAN must not contradict the body-map cards.
- `project_ocean_disposition_spec` — current canon state.

## Allowed to Modify

These files only.

1. **`lib/ocean.ts`** — calibration target. Two implementation paths allowed (author chooses):
   - **Path A — Lower multipliers.** Reduce the per-bucket constants until honest bands fall out. Smaller code change but less robust against future signal-pool growth.
   - **Path B — Saturation curve.** Replace `intensity = clamp(signal_count × multiplier, 0, 100)` with `intensity = 100 × (1 − exp(−k × signal_count))` where `k` is per-bucket and tunable. Smooth saturation; dense signal pools converge to high but rarely 100. Recommended.
   
   Either way, the constants/coefficients are exported `const` with comments calling them tunables.

2. **`tests/fixtures/ocean/07-jason-real-session.json`** — NEW FIXTURE. The canonical real-cohort data point. Shape: standard `{ answers, demographics }` wrapper matching the existing fixtures.

   **Source of truth:** Jason's actual session, **session ID `54265a13-ab24-4c70-95fd-8052e85c4a3f`** (accessible via the admin route, e.g., `http://localhost:3003/admin/sessions/54265a13-ab24-4c70-95fd-8052e85c4a3f/answers` and the corresponding session data store). Read the session's answers and demographics directly; serialize into the fixture file format matching `01-architectural-openness.json` etc.

   **Documentation requirement:** include a top-of-file JSON comment (or sidecar `07-jason-real-session.README.md`) that records: (a) the source session ID, (b) the date the session was captured (2026-05-07 17:50), (c) the documented saturation bug at fixture-creation time (O/C/E/A all = 100; ER under-detected), (d) the calibration target ranges this CC tunes the math to produce. The fixture is the canonical real-cohort anchor for all future OCEAN calibration CCs; the README makes that lineage discoverable.

   **Fallback (only if the session is genuinely unreadable):** synthesize a profile that approximates the documented evidence — INTJ-shaped Lens; Compass top: Knowledge, Peace, Faith, Honor; high Q-S2 family/loyalty; low Q-X4-relational extraversion-coded signals; broad Q-T te+ni dominance; Drive distribution 29/36/35; substantive freeform Q-I1 with `conviction_under_cost`. If you fall back, document the synthesis explicitly in the README as "synthetic approximation, real session was inaccessible at fixture creation" so future CCs know this is not the real anchor.

3. **`tests/audit/oceanDashboard.audit.ts`** — calibration assertions and distribution-cap check:
   - Assert Jason's fixture lands at honest bands. Specific targets: `intensities.extraversion ≤ 40` (the Extraversion bug guard); `intensities.openness ∈ [40, 80]` (moderate to high — broad Openness across registers); `intensities.conscientiousness ∈ [55, 85]` (moderate-high to high — Conscientiousness is genuinely strong); `intensities.agreeableness ∈ [40, 75]` (moderate to moderate-high — loyalty register present but not saturating); `emotionalReactivity.proxyOnly === true` (proxy-only is correct until Q-O2 lands).
   - Assert designed fixtures (01–06) still hit their intended bands per CC-072's audit. Verbatim-bands check; if a designed fixture's band shifts due to recalibration, that's a regression and the calibration is wrong.
   - Add **distribution-cap assertion**: across any single fixture, no more than 2 traits may have `intensity ≥ 95` simultaneously. Across the full fixture bank (7 fixtures post-CC-075), no trait may saturate ≥ 95 in more than 50% of fixtures.
   - Add a **diagnostic logging block** (only when run with a `--diagnose` flag or env var): for each fixture, dump per-trait signal counts AND the resulting intensity. This is the artifact future calibration CCs will read.

4. **`package.json`** — optional. If a separate `audit:ocean:diagnose` script is useful for the diagnostic logging block, add it. No other changes.

## Out of Scope (Do Not)

1. **Do NOT add Q-O1 (Openness subtype) or Q-O2 (direct Emotional Reactivity)** to `data/questions.ts`. These remain queued in the question-additions chain. Calibration first; new questions after.
2. **Do NOT add or modify any signal** in `lib/types.ts` SignalId / SIGNAL_DESCRIPTIONS / extractors.
3. **Do NOT modify the OCEAN signal-pool tagging** — i.e., don't change which signals tag into which trait. The over-tagging suspicion (signals firing into both A and E, etc.) is real but is NOT this CC's scope. If the calibration audit reveals a clearly miscategorized signal (e.g., a `family_priority` signal tagging into Extraversion), document it in the spec ↔ code drift report for a future CC; do NOT fix it here.
4. **Do NOT modify `lib/oceanDashboard.ts`, `lib/renderMirror.ts`, or `app/components/InnerConstitutionPage.tsx`.** The calibration changes the values; the rendering already handles the corrected values.
5. **Do NOT modify Goal/Soul/Movement files** (`lib/goalSoulGive.ts`, `lib/goalSoulMovement.ts`, `lib/goalSoulPatterns.ts`, `lib/goalSoulDashboard.ts`). Goal/Soul calibration is independently sound (Jason's Movement read is honest: Goal 80, Soul 45, Direction 29° Goal-leaning, Length 64.9, Gripping Pull 0).
6. **Do NOT modify `docs/ocean-disposition-spec.md` or `docs/goal-soul-give-spec.md`.** Spec is canon; this CC tunes the implementation toward what the spec already calls for (independent intensity bands per §2.1).
7. **Do NOT modify `MEMORY.md`, `AGENTS.md`, or any file under `docs/canon/`.**
8. **Do NOT remove or rename the legacy `OceanOutput.distribution` field.** It's `@deprecated` per CC-072 §9 but still consumed by `lib/workMap.ts`; the migration is a separate CODEX.
9. **Do NOT install new dependencies.**
10. **Do NOT moralize or rephrase the trait paragraphs to fit a different reading.** The contradiction the report shows is the saturation math producing wrong values — not the prose being wrong-shaped. Calibrate the math; the prose follows.
11. **Do NOT change the render bands** (under-detected: 0–19; low: 20–39; moderate: 40–59; moderate-high: 60–79; high: 80–100). These are canon per memo §2.1.
12. **Do NOT calibrate by lowering all multipliers uniformly.** The Extraversion saturation is more aggressive than the Conscientiousness saturation in Jason's case — the per-bucket multipliers (or per-bucket `k` values) are independently tunable. Treat each trait's calibration as its own decision based on its own signal pool size and density.
13. **Do NOT create a Goal/Soul "calibration" branch.** Only OCEAN calibration is in scope.

## Acceptance Criteria

### Diagnostic phase

1. The CC's first action is to dump per-trait signal counts for the new `07-jason-real-session.json` fixture under the existing math. Report Back §2 quotes the per-trait signal count and the resulting intensity under the unchanged math.
2. Same diagnostic dump for fixtures 01–06 to establish baseline behavior under existing math.

### Calibration math

3. `lib/ocean.ts` exports tunable constants (multipliers OR per-bucket `k` values) with comments labeling them tunable and citing this CC.
4. The canonical reference points hold:
   - At signal density "user fires ~5 strongly-tagged signals for the trait" → resulting intensity lands in the moderate-high band (60–79).
   - At signal density "~10 signals" → high band (80–95), not always 100.
   - At signal density "~15+ signals" → 95–100, with 100 reserved for genuinely-saturated cases.
   - At signal density "~2 signals" → low band (20–39).
   - At signal density "~0–1 signals" → under-detected band (0–19).

### Jason fixture (canonical real-cohort anchor)

5. `07-jason-real-session.json` exists in `tests/fixtures/ocean/`. JSON comment or sidecar README documents whether the fixture is sourced from the real session or synthesized to approximate it.
6. The fixture's resulting intensities match these target ranges:
   - **Extraversion ≤ 40** (under-detected to low band) — guard against the documented saturation bug.
   - **Openness ∈ [40, 80]** (moderate to high) — Openness is genuinely active across multiple registers; saturating to 100 would mean every signal-pool item fires, which contradicts the "broadly active, no single dominant flavor" observation.
   - **Conscientiousness ∈ [55, 85]** — moderate-high to high, the strongest of the four positive traits.
   - **Agreeableness ∈ [40, 75]** — moderate to moderate-high; the loyalty register is present but doesn't saturate.
   - **Emotional Reactivity intensity ∈ [0, 19] AND `proxyOnly === true`** — under-detected with proxy disclosure remains correct until Q-O2 lands.

### Designed-fixture regression

7. Designed fixtures 01–06 retain their intended target bands per CC-072's audit. Specific spot-checks (calibration must not break these):
   - Fixture 01-architectural-openness: Architectural Openness still saturates (≥ 60); Agreeableness still high (≥ 80).
   - Fixture 02-high-conscientiousness: Conscientiousness still high (≥ 80).
   - Fixture 03-low-extraversion-high-soul: Extraversion remains under-detected to low (≤ 40); Agreeableness still saturating in cluster.
   - Fixture 04-high-agreeableness-loyalty: Agreeableness still saturating (≥ 90).
   - Fixture 05-low-emotional-reactivity-proxy: ER `proxyOnly === true`, Conscientiousness still high.
   - Fixture 06-thin-signal-under-detected: every trait remains in low or under-detected band.

### Distribution-cap assertion

8. New audit assertion in `tests/audit/oceanDashboard.audit.ts`: across any single fixture, **no more than 2 traits may have `intensity ≥ 95` simultaneously**. The 6 designed fixtures and the new Jason fixture all pass this.
9. Across the full 7-fixture bank, **no single trait saturates ≥ 95 in more than 50% of fixtures**. (Catches the "Extraversion always reads as 100" failure mode going forward.)

### Diagnostic logging

10. The audit produces a per-trait diagnostic table when run with `--diagnose` flag (or equivalent):
    ```
    Fixture                          | O    | C    | E    | A    | N
    01-architectural-openness        | 46   | 80   | 34   | 87   | 0
    07-jason-real-session            | 65   | 75   | 28   | 60   | 0    (← target ranges)
    ```
    The diagnostic captures the calibration intent for future maintainers.

### Build hygiene

11. `npx tsc --noEmit` exits 0.
12. `npm run lint` exits 0.
13. `npm run audit:ocean` exits 0 (all 7 fixtures pass intensity bands; distribution cap holds; ER proxy disclosure fires correctly).
14. `npm run audit:goal-soul-give` exits 0 (regression check; CC-067 through CC-071 audits unchanged).
15. `git status --short` shows ONLY Allowed-to-Modify files.
16. `data/questions.ts` unchanged (40 question_ids).
17. No new dependencies.

## Report Back

1. **Summary** — what was changed in 5–8 sentences.
2. **Diagnostic phase** — for each of the 7 fixtures, report (a) per-trait signal counts, (b) per-trait intensity under the OLD math, (c) per-trait intensity under the NEW math. Tabular form.
3. **Calibration choice** — Path A (lower multipliers) or Path B (saturation curve)? Justify the choice. Document the new constants/coefficients verbatim.
4. **Jason fixture audit** — quote the per-trait paragraph rendered for `07-jason-real-session.json` after recalibration. Verify the prose is now coherent with the body-map cards (low-E observations match low-E intensity; the loyalty register lands moderately, not at 100; the architectural Openness flavor lands as intended).
5. **Designed-fixture regression check** — confirm fixtures 01–06 still hit their target bands. If any band shifted, document and justify (calibration trade-off).
6. **Distribution-cap audit** — confirm no fixture exceeds 2 traits at ≥ 95 simultaneously, and no single trait saturates ≥ 95 in more than 50% of fixtures.
7. **Suspected mis-tagged signals** — if the diagnostic phase revealed any signal that's plausibly tagged into the wrong trait (e.g., a Q-S2 family-priority signal tagging into Extraversion), document for a future CC. Do NOT fix here.
8. **Files modified** — every path with line-count delta.
9. **Out-of-scope verification** — `git status --short`.
10. **Spec ↔ code drift report** — anywhere `docs/ocean-disposition-spec.md` would benefit from sync after this calibration.
11. **Open questions** — what surfaced that the spec didn't anticipate. Specifically: should the saturation curve be canonized in §2.1 (replacing the linear-multiplier framing) for future CCs?

---

## Method note

**Diagnose before you tune.** The Extraversion = 100 bug isn't gradual mis-calibration; it's the math returning a high band where the body-map cards consistently read low. The diagnostic phase should reveal whether the issue is (a) too many signals tag into Extraversion (over-tagging), (b) the multiplier × count math saturates too aggressively (curve issue), or (c) both. The fix differs by cause:

- If (a), the calibration is partially correct and a future CC fixes signal tagging. This CC reduces the multiplier as a partial mitigation.
- If (b), Path B (saturation curve) is the right structural fix.
- If (c), Path B + the documented mis-tag for a future CC.

**The render bands are canon; the math producing them is the tunable.** Memo §2.1 specifies the render bands (under-detected / low / moderate / moderate-high / high). This CC tunes the math so signal counts land in the right band, not the other way around. Don't redefine bands.

**Internal report coherence is the load-bearing canon.** A user's OCEAN section should not contradict their Path / Compass / Synthesis observations. This CC's audit adds the contradiction-guard (Extraversion ≤ 40 for Jason). Future calibration CCs can add similar coherence checks for other traits.

**This is calibration, not architecture.** The CC-072 architecture (independent intensities, no 100%-summing, render bands, Disposition Signal Mix label, cross-references) all stays. Only the curve from `signal count` → `intensity value` changes.
