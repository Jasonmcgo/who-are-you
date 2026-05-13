# CC-AS — Agreeableness Signal Pool Diagnostic + Cleanup

**Origin:** Jason's empirical observation (2026-05-07): across his preview readers, Agreeableness ranks highest for every reader. Son's case is diagnostic — high A score by the instrument, contrarian-and-job-losing in actual behavior; the instrument cannot distinguish moral-concern-loyalty from agreement-seeking-compliance. Jason's own report at A=96 reads inflated relative to actual shape. Three independent data points (cohort preview, son, Jason) triangulate the same pattern: A is universally over-firing, almost certainly because the signal pool is dominated by items most people rank highly (Compass values like Family / Loyalty / Honor / Compassion; Q-Stakes items naming close relationships; Path · Love signals reading as durable presence; possibly Q-V1 `sacred_belief_connection` and Q-L1 `love_*` signals if A-tagged downstream).

**Method precedent:** CC-077. Same diagnostic-first method that resolved Extraversion saturation: print per-fixture signal list, identify universal-firing signals, decide per signal whether the tag is canonically right or the people-relational-default-tag pattern, remove over-tags, re-run audit. Per CC-077's lesson: signal-pool cleanup BEFORE k retuning. Retuning the saturation curve to compensate for over-tagged signals masks the over-tag and costs separation between fixtures that legitimately differ.

**Scope frame:** Two-phase CC. Phase 1: diagnostic harness (new file) prints A-tagged signal firing per fixture across all 20 available fixtures (13 goal-soul-give + 7 OCEAN). Phase 2: per-signal decision + tag cleanup in `lib/ocean.ts` `SIGNAL_OCEAN_TAGS`. No `INTENSITY_K.A` retune. Editorial-judgment surface — this is a CC, not a CODEX. Pairs with CC-ES (Extraversion signal pool, queued separately) if CC-AS confirms the pattern; CC-ES not in scope here.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Two-phase single pass:

**Phase 1 — Diagnostic.** Build the harness, run it across all fixtures, produce the report. Do NOT modify `SIGNAL_OCEAN_TAGS` yet. Output: per-fixture table showing every A-tagged signal that fires, its weight contribution, the resulting weighted sum, intensity, and band. Aggregate: which signals fire across ≥ 70% of fixtures (universal-firing candidates).

**Phase 2 — Cleanup.** With the diagnostic in hand, decide per universal-firing signal: is the A tag canonically right (the signal genuinely measures loyalty / moral-concern / protective-care / cause-driven-service in a way that distinguishes high-A users from moderate-A users), OR is it the people-relational-default-tag pattern (the signal measures something near-universal that almost everyone affirms, so it inflates A across the cohort without distinguishing). Remove the over-tags. Re-run the audit. Verify the cohort spread guarantee.

The Phase 1 → Phase 2 split is the discipline. Don't decide which signals to cut from memory; let the diagnostic surface them.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `npx tsx tests/audit/agreeablenessSignalPoolDiagnostic.ts` (new file; runs Phase 1)
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/ocean.ts` — full file. `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, weighted-sum math.
2. `lib/types.ts` — `OceanBucket`, `OceanIntensity`, `OceanIntensities`, signal-tag types.
3. `prompts/completed/CC-077-*.md` (or wherever CC-077 lives) — the precedent. Read the diagnostic table format and the per-signal cut rationale; mirror the method.
4. `docs/ocean-disposition-spec.md` — §4 Agreeableness register canon ("care with a spine"; loyalty / moral-concern / protective-care / cause-driven-service). This is the canonical definition that every kept A-tagged signal must measure.
5. `tests/fixtures/ocean/*.json` (7 fixtures) and `tests/fixtures/goal-soul-give/*.json` (13 fixtures) — the cohort the diagnostic runs against.
6. `tests/audit/oceanDashboard.audit.ts` — for the assertion scaffold.

Memory: `feedback_minimal_questions_maximum_output`, `feedback_coherence_over_cleverness`, `project_ocean_disposition_spec`, `feedback_cc_prompt_guardrails`.

## Allowed to Modify

### 1. Diagnostic harness (new file)

**File:** `tests/audit/agreeablenessSignalPoolDiagnostic.ts`

Build a runnable script that, for each fixture in `tests/fixtures/ocean/*.json` and `tests/fixtures/goal-soul-give/*.json`:
- Loads the fixture, runs the signal extractor + OCEAN intensity computation.
- Filters to A-tagged signals only.
- Prints a per-fixture table: signal_id | weight contributed | (optionally) source_question_id.
- Prints fixture summary: A weighted_sum total, A intensity, A band.

After processing all fixtures, prints an aggregate table: for each A-tagged signal, the count of fixtures in which it fired, expressed as a percentage of total fixtures. Sort descending by fire-rate. Mark signals firing in ≥ 70% of fixtures as **universal-firing candidates**.

Also prints the cohort-spread metrics for A intensity across all fixtures: min, max, mean, std deviation, and the count of fixtures landing in each band (under-detected / low / moderate / moderate-high / high).

Output is plaintext to stdout; no JSON/CSV needed. Human-readable for the Phase 2 decision pass.

### 2. `SIGNAL_OCEAN_TAGS` cleanup

**File:** `lib/ocean.ts`

Per the Phase 1 diagnostic, remove A tags from signals where the A tag is the people-relational-default-tag pattern rather than canonical loyalty / moral-concern / protective-care / cause-driven-service.

For each signal you remove, add an inline comment naming:
- The fire-rate from the diagnostic (e.g., "fired in 18/20 fixtures").
- The reason for removal (e.g., "measures stake-holder-naming, not loyalty register").
- The CC-AS marker.

For each universal-firing signal you keep, also add an inline comment naming:
- The fire-rate.
- The justification (e.g., "kept: the signal measures cause-driven-service distinctly from accommodation").
- The CC-AS marker.

Likely-but-not-confirmed candidates for removal (the diagnostic decides, not this list):
- Compass-side secondary A tags on Family, Loyalty, Honor, Compassion (the values themselves are near-universally ranked top-4; A-tagging them produces universal A inflation regardless of actual loyalty register).
- Q-Stakes items naming close relationships / family / friendships if any are still A-tagged (CC-077 removed `coverage_drive`, `partner_trust_priority`, `close_relationships_stakes_priority`, `family_trust_priority`; check whether parallel signals from CC-Q2 / CC-Q4 re-introduced the pattern).
- Q-V1 `sacred_belief_connection` if it has an A secondary tag — sacred-care register is closer to the Vulnerability composite than to the loyalty/service register A measures.
- Q-L1 `love_*` signals: per the CC-Q4 report, `lib/ocean.ts` was Out-of-Scope so they shouldn't have direct OCEAN tags — but if any are inherited or inferred elsewhere, surface and remove.

Likely-but-not-confirmed candidates to keep (again, diagnostic decides):
- Direct moral-concern / cause-driven-service signals that distinguish high-A users from moderate-A users.
- Willingness-to-bear-cost signals that genuinely separate users on protective-care.
- Path · Love signals that name LOYALTY-as-love distinctly from agreement-seeking-compliance.

### 3. Audit assertions

**File:** `tests/audit/oceanDashboard.audit.ts`

Add the following assertions (CC-AS block):

- `a-not-universal-saturation`: across all 13 goal-soul-give fixtures, the count of fixtures with A intensity ≥ 90 must be ≤ 4. (Pre-cleanup, the diagnostic should show > 4; this is the regression-direction guarantee.)
- `a-cohort-spread-min-max`: across all fixtures, `max(A_intensity) − min(A_intensity) ≥ 30`. The signal pool must produce meaningful separation.
- `a-cohort-spread-band-count`: across all 20 fixtures (ocean + goal-soul-give), at least 3 of the 5 bands (under-detected / low / moderate / moderate-high / high) must each contain ≥ 1 fixture. No single-band saturation.
- `a-jason-shape-preserved`: the Jason real-session fixture (whichever it is — `07-jason-real-session.json` if it's in OCEAN fixtures, or the equivalent in goal-soul-give) post-cleanup lands in `[60, 90]`. Jason's actual shape IS high-A in the loyalty / moral-concern register; the cleanup must not erase that — only un-saturate it.

The Jason-shape preservation is the canary. If post-cleanup the Jason fixture lands < 60, the cleanup overcorrected. Investigate before landing.

### 4. INTENSITY_K untouched

`INTENSITY_K.A = 0.100` stays. If the cleanup doesn't produce sufficient spread, the right next move is more cleanup, not retuning k. CC-077 lesson: retuning the curve to compensate for over-tagged signals masks the problem.

If cleanup truly cannot produce spread (i.e., the A-tagged signal pool is fundamentally too dense even after removing universal-firers), document this in Report Back and recommend a follow-on CC for k retuning — but do not retune in CC-AS.

## Out of Scope (Do Not)

1. **Do NOT retune `INTENSITY_K.A`** or any other intensity coefficient. Cleanup-first; if cleanup is insufficient, a separate calibration CC handles it.
2. **Do NOT modify other-bucket tags** (O / C / E / N) in `SIGNAL_OCEAN_TAGS`. CC-ES (Extraversion) is queued separately.
3. **Do NOT modify the OCEAN render path or prose templates.** `lib/oceanDashboard.ts` is untouched. `BAND_INTERPRETATION.A` stays. `agreeablenessDisambiguation` stays. `agreeablenessCareWithSpineClose` stays. The CODEX-086 "moral-concern dominant" subtype label decision is downstream of CC-AS and re-evaluated post-cleanup.
4. **Do NOT modify band thresholds** (`under-detected` / `low` / `moderate` / `moderate-high` / `high` cutoffs). Those are CC-075 / CC-077 canon.
5. **Do NOT modify any composite consumption.** `goalSoulGive` cross-references that read `intensities.agreeableness >= 60` stay. The threshold semantics are unchanged; the threshold value is canon.
6. **Do NOT modify CC-Q1 / Q2 / Q3 / Q4 primary signal wiring.** The new direct-measurement signals stay in their PRIMARY consumers (Goal / Soul / Vulnerability / Drive / Love Map). Only their OCEAN-side SECONDARY A tags (if any) are candidates for removal.
7. **Do NOT add new signals.**
8. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, `docs/canon/`, `docs/ocean-disposition-spec.md`, or any spec memo. If §4 of the disposition spec needs updating to name the cleanup, document drift in Report Back; do not edit the spec from this CC.
9. **Do NOT install dependencies.**
10. **Do NOT touch fixture files.** Fixtures are the input; modifying them to make the assertion pass is gaming the diagnostic. If a fixture's A reading changes post-cleanup, that's the signal — investigate and document, don't tune the fixture.
11. **Do NOT modify other audit harnesses** beyond the CC-AS block in `oceanDashboard.audit.ts`. Goal/Soul audit untouched.
12. **Do NOT delete the diagnostic harness file after Phase 2.** Keep it as a permanent regression tool — future calibration sessions will re-run it.

## Acceptance Criteria

1. Phase 1 diagnostic harness exists at `tests/audit/agreeablenessSignalPoolDiagnostic.ts`, runs cleanly via `npx tsx`, and produces the per-fixture + aggregate output.
2. Phase 1 output is included in Report Back §2 verbatim (or summarized as a table).
3. Phase 2 cleanup removes A tags from at least the universal-firing signals identified as people-relational-default-tag pattern. Each removal documented inline with fire-rate + reason + CC-AS marker.
4. Each kept universal-firing signal also documented inline with justification + CC-AS marker.
5. New audit assertions pass: `a-not-universal-saturation`, `a-cohort-spread-min-max`, `a-cohort-spread-band-count`, `a-jason-shape-preserved`.
6. Existing OCEAN audit assertions pass (regression — math fundamentals unchanged).
7. Goal/Soul/Give audit passes (regression — composite consumption unchanged).
8. `INTENSITY_K.A` unchanged.
9. `npx tsc --noEmit` exits 0.
10. `npm run lint` exits 0.
11. `npm run audit:ocean` exits 0.
12. `npm run audit:goal-soul-give` exits 0.
13. `git status --short` shows only Allowed-to-Modify files (the new diagnostic file, `lib/ocean.ts`, `tests/audit/oceanDashboard.audit.ts`).

## Report Back

1. **Summary** in 4–6 sentences. State whether cleanup was sufficient or whether a follow-on k-retune CC is needed.
2. **Phase 1 diagnostic output** — the per-fixture A-tagged signal table + aggregate fire-rate table. This is the load-bearing evidence for every Phase 2 decision.
3. **Per-signal decisions table** — for each universal-firing signal: keep or remove + rationale. For each removed signal, the canonical-A-misfire reason. For each kept signal, the moral-concern / loyalty / protective-care / cause-driven-service distinction.
4. **Pre vs post A intensity per fixture** — full table across all 20 fixtures. Show min, max, mean, std before and after. Show the band-distribution histogram before and after.
5. **Jason-shape canary** — pre-cleanup A intensity for the Jason fixture, post-cleanup A intensity. Confirm landing in [60, 90]. If not, the cleanup overcorrected — name which signal removal is responsible and recommend either keeping that signal or compensating.
6. **Cohort universal-A pattern resolution** — pre-cleanup count of fixtures with A ≥ 90; post-cleanup count. Confirm the universal-saturation pattern is broken.
7. **Cross-trait spillover check** — confirm O / C / E / N intensities are unchanged across all fixtures (regression — only A tags were touched).
8. **Audit pass/fail breakdown** — including the four new CC-AS assertions and existing regression.
9. **Spec ↔ code drift** — if `docs/ocean-disposition-spec.md` §4 names canonical A signals that no longer exist post-cleanup, flag for spec-sync CODEX.
10. **Out-of-scope verification** — git status; explicit confirmation that INTENSITY_K, render path, band thresholds, composite consumption, and other-bucket tags are all untouched.
11. **Recommendation for CC-ES** — based on whether the same pattern likely applies to Extraversion. If E shows similar universal-firing structure, recommend running CC-ES with the same method before any further calibration.
