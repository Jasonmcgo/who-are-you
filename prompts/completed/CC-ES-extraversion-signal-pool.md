# CC-ES — Extraversion Signal Pool Diagnostic + Cleanup

**Origin:** Post-CC-JX, Jason's live E reads 73 unchanged from pre-CC-JX (CC-JX correctly removed Jungian → E entirely; nothing Jungian was contributing to E because CC-077 had already stripped the secondary tags). E elevation is therefore from non-Jungian signals — likely the same people-relational-default-tag pattern that inflated A pre-CC-AS, applied to E. Jason's self-read is moderate-E in a situational, role-based register (per CC-077's moderate-band template), not the moderate-high "social-energy register is active" reading the dashboard currently shows.

**Method precedent:** CC-077 (first E cleanup, removed secondary tags from cog-functions) and CC-AS (signal-pool diagnostic for A). Same diagnostic-first method. Phase 1: print per-fixture E-tagged signals, identify universal-firers. Phase 2: per-signal decision, keep canonical-E signals (broadcast / outward-charge / friendly-engagement / social-appetite), remove default-firing patterns.

**Scope frame:** Two-phase CC mirroring CC-AS structure. New file `tests/audit/extraversionSignalPoolDiagnostic.ts`. Cleanup pass in `lib/ocean.ts` `SIGNAL_OCEAN_TAGS` for E entries only. No Jungian work (CC-JX done). No `INTENSITY_K.E` retune (CC-077 / CC-AS lesson). ~90 minutes of executor time.

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Two-phase single pass. **Phase 1:** build the diagnostic harness, run it across all 20 fixtures, produce the aggregate fire-rate table + cohort spread metrics. Do NOT modify `SIGNAL_OCEAN_TAGS` yet. **Phase 2:** with diagnostic in hand, decide per universal-firing E signal whether the tag is canonically right (signal genuinely measures broadcast / outward-charge / friendly-engagement / social-appetite in a way that distinguishes high-E users from moderate-E users) OR the people-relational-default-tag pattern (signal measures something near-universal that almost everyone affirms, inflating E across the cohort without distinguishing). Remove the over-tags. Re-run audit; verify cohort spread + canary.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `npx tsx tests/audit/agreeablenessSignalPoolDiagnostic.ts` (CC-AS harness — verify regression)
- `npx tsx tests/audit/jungianOceanDiagnostic.ts` (CC-JX harness — verify regression)
- `npx tsx tests/audit/extraversionSignalPoolDiagnostic.ts` (NEW — runs Phase 1)
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/ocean.ts` — full file. Post-CC-JX state: `SIGNAL_OCEAN_TAGS` for E (with cog-function entries already empty per CC-JX); `INTENSITY_K.E`; weighted-sum math; the position-weighted Jungian bridge (E receives zero Jungian contribution — verify and preserve).
2. `lib/types.ts` — E-related types.
3. `lib/jungianStack.ts` (NEW per CC-JX) — confirm the stack resolver is the only path that touches Jungian contributions; ensure CC-ES doesn't reintroduce a Jungian bridge to E.
4. `tests/audit/agreeablenessSignalPoolDiagnostic.ts` — pattern to mirror exactly; structural reference.
5. `tests/audit/jungianOceanDiagnostic.ts` (NEW per CC-JX) — additional pattern reference.
6. `tests/audit/oceanDashboard.audit.ts` — assertion scaffold + post-CC-AS + post-CC-JX assertions.
7. `docs/ocean-disposition-spec.md` — §3 (Extraversion section). Canonical E definition: "how visibly your interior moves outward" — broadcast / outward-charge / friendly-engagement / social-appetite. Every kept E-tagged signal must measure this register.
8. `prompts/completed/CC-077-*.md`, `prompts/completed/CC-AS-*.md`, `prompts/completed/CC-JX-*.md` — precedent context.

Memory: `feedback_signal_pool_diagnostic_method`, `project_ocean_disposition_spec`, `feedback_cc_prompt_guardrails`, `feedback_coherence_over_cleverness`.

## Allowed to Modify

### 1. NEW — `tests/audit/extraversionSignalPoolDiagnostic.ts`

Mirror `tests/audit/agreeablenessSignalPoolDiagnostic.ts` structure exactly, retargeted to the E bucket. For each fixture in `tests/fixtures/ocean/*.json` (7) and `tests/fixtures/goal-soul-give/*.json` (13):

- Load the fixture, run the signal extractor + OCEAN intensity computation.
- Filter to E-tagged signals only (read directly from `SIGNAL_OCEAN_TAGS` to determine the active E pool).
- Print per-fixture table: signal_id | weight contributed | (optionally) source_question_id.
- Print fixture summary: E weighted_sum total, E intensity, E band.

After processing all fixtures, print aggregate table:
- For each E-tagged signal: count of fixtures fired; fire-rate %; mean rank (where applicable); total cumulative contribution. Sort descending by fire-rate.
- Mark signals firing in ≥ 70% of fixtures as **universal-firing candidates**.
- Cohort spread metrics: min, max, mean, std deviation; count per band (under-detected / low / moderate / moderate-high / high).

Output is plaintext to stdout; no JSON/CSV. Human-readable for Phase 2 decision pass. File kept as permanent regression tool per CC-AS precedent — do not delete after CC-ES lands.

### 2. UPDATE — `lib/ocean.ts` `SIGNAL_OCEAN_TAGS`

Per the Phase 1 diagnostic, remove E tags from signals where the E tag is the people-relational-default-tag pattern OR the visible-output pattern miscoded as social-energy. The canonical E spec definition (`docs/ocean-disposition-spec.md` §3) is:

> "how visibly your interior moves outward" — broadcast / outward-charge / friendly-engagement / social-appetite.

Each kept signal must measure that register in a way that distinguishes high-E users from moderate-E users (rank-aware spread or distinctiveness across the cohort).

For each signal you remove, add an inline comment naming:
- The fire-rate from the diagnostic (e.g., "fired in 17/20 fixtures").
- The reason for removal (e.g., "people-relational-default-tag — most users name friends in spending; doesn't distinguish E").
- The CC-ES marker.

For each kept universal-firing signal, also add an inline comment naming:
- The fire-rate.
- The justification (e.g., "kept: signal measures broadcast / friendly-engagement distinctly from default-affirmative patterns").
- The CC-ES marker.

**Likely-but-not-confirmed candidates for removal** (Phase 1 diagnostic decides):

- `friends_spending_priority` — most users put friends/social in their discretionary spending; near-universal default. CC-AS removed adjacent A-tagged signals on the same canon reasoning.
- `social_spending_priority` — same default-firing pattern.
- `enjoying_energy_priority` (if E-tagged) — most people rank "enjoyment" somewhere in energy allocation; doesn't distinguish E.
- `friend_trust_priority` (if E-tagged) — most users trust at least one friend; near-universal.
- `success_priority` / `fame_priority` / `reputation_stakes_priority` (if E-tagged) — these are ambition signals miscoded as social-appetite. Ambition can be entirely interior; visible role-based output ≠ social-energy.
- Any Q-Stakes role-naming signals tagging E — naming a visible role doesn't measure outward-charge; it measures stake-naming.
- `adapts_under_social_pressure` — Fire reads this as resilience-side state, not as outward-charge. Already low fire-rate (CC-AS report showed 2/20 = distinctive); keep if distinctive, remove if it's E-tagged for the wrong reason.

**Likely-but-not-confirmed candidates to keep** (Phase 1 diagnostic decides):

- Direct broadcast / outward-charge signals — signals that distinctly measure interior-moving-outward (visible affect, public engagement appetite, friendly-engagement preference).
- Q-E or Q-Energy signals if any name social-engagement appetite directly.
- Distinctive E signals (low fire-rate, high rank-aware contribution when they fire).

**Architectural rule (per CC-JX):** Do NOT reintroduce any Jungian function as an E bridge. CC-JX removed cog-function entries from `SIGNAL_OCEAN_TAGS` for all OCEAN buckets including E. The position-weighted bridge in `lib/ocean.ts` excludes E by axiom. This CC must preserve that.

### 3. UPDATE — `tests/audit/oceanDashboard.audit.ts`

Add CC-ES assertion block:

- `e-not-universal-saturation`: across all 13 goal-soul-give fixtures, the count of fixtures with E intensity ≥ 80 must be ≤ 4. (Pre-cleanup, the diagnostic should show > 4; this is the regression-direction guarantee.)
- `e-cohort-spread-min-max`: across all 20 fixtures, `max(E_intensity) − min(E_intensity) ≥ 30`. Signal pool must produce meaningful separation.
- `e-cohort-spread-band-count`: across all 20 fixtures, at least 3 of the 5 bands (under-detected / low / moderate / moderate-high / high) must each contain ≥ 1 fixture. No single-band saturation.
- `e-jason-shape-preserved`: the Jason fixture (`07-jason-real-session.json`) post-cleanup lands in `[40, 65]` (moderate band). Jason's actual self-read is situational/role-based moderate-E; the cleanup should land him in the moderate band where the CC-077 moderate-E template fires, not in the moderate-high band where the CC-077 moderate-high template currently fires.
- `e-jungian-still-zero`: For every fixture, the E weighted-sum contribution from cog-function signals remains exactly 0 (CC-JX architectural rule preserved).

The Jason canary is the load-bearing canary. Pre-CC-ES E=73 (moderate-high band, 65 < intensity < 80). Post-CC-ES target: E ∈ [40, 65] (moderate band). This is a band shift, not a small adjustment. If the cleanup doesn't produce that shift, either (a) the kept signals are still over-firing for Jason, or (b) E's signal pool is fundamentally too dense and a follow-on k retune is warranted (deferred to a separate CC).

## Out of Scope (Do Not)

1. **Do NOT retune `INTENSITY_K.E`** or any other intensity coefficient. Cleanup-first per CC-077 / CC-AS / CC-JX lesson. If cleanup is insufficient, recommend follow-on CC for retune; do not retune in CC-ES.
2. **Do NOT modify other-bucket tags** (O / C / A / N) in `SIGNAL_OCEAN_TAGS`. CC-AS handled A; CC-JX handled Jungian-to-OCEAN; CC-ES handles E only.
3. **Do NOT reintroduce any Jungian → E bridge.** CC-JX removed all cog-function entries; CC-ES preserves that. The position-weighted bridge in `lib/ocean.ts` continues to exclude E.
4. **Do NOT modify the OCEAN render path or prose templates.** `lib/oceanDashboard.ts` untouched. `BAND_INTERPRETATION.E` (including the CODEX-086 moderate-high template and the CC-077 moderate template) stays verbatim.
5. **Do NOT modify band thresholds** (under-detected / low / moderate / moderate-high / high cutoffs).
6. **Do NOT modify any composite consumption.** Cross-references reading `intensities.extraversion <= 35` (e.g., the love-line broadcast cross-reference) stay untouched. Threshold semantics canon.
7. **Do NOT modify CC-Q1 / Q2 / Q3 / Q4 primary signal wiring.** New direct-measurement signals stay in their PRIMARY consumers; only their OCEAN-side E secondary tags (if any) are removal candidates.
8. **Do NOT add new signals.**
9. **Do NOT modify `lib/jungianStack.ts`** or any CC-JX architectural piece. The stack resolver and position-weighted bridge are canon.
10. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, `docs/canon/`, `docs/ocean-disposition-spec.md`, or any spec memo. Document drift in Report Back; do not edit.
11. **Do NOT install dependencies.**
12. **Do NOT touch fixture files.** Fixtures are input; modifying them to game assertions violates diagnostic discipline. If a fixture's E reading shifts band post-cleanup, document and investigate; don't tune the fixture.
13. **Do NOT modify other audit harnesses** beyond the CC-ES block in `oceanDashboard.audit.ts`. Goal/Soul audit untouched. CC-AS harness untouched. CC-JX harness untouched.
14. **Do NOT delete the diagnostic harness file after Phase 2.** Keep `extraversionSignalPoolDiagnostic.ts` as permanent regression tool.

## Acceptance Criteria

1. Phase 1 diagnostic harness exists at `tests/audit/extraversionSignalPoolDiagnostic.ts`, runs cleanly via `npx tsx`, produces per-fixture + aggregate output.
2. Phase 1 output included in Report Back §2 verbatim (or summarized as a table).
3. Phase 2 cleanup removes E tags from at least the universal-firing signals identified as people-relational-default-tag or ambition-miscoded-as-social patterns. Each removal documented inline with fire-rate + reason + CC-ES marker.
4. Each kept universal-firing signal documented inline with justification + CC-ES marker (canonical broadcast / outward-charge / friendly-engagement / social-appetite read).
5. New CC-ES audit assertions pass: `e-not-universal-saturation`, `e-cohort-spread-min-max`, `e-cohort-spread-band-count`, `e-jason-shape-preserved`, `e-jungian-still-zero`.
6. Existing OCEAN audit assertions pass (regression — math fundamentals unchanged).
7. CC-AS regression: `agreeablenessSignalPoolDiagnostic.ts` runs unchanged; CC-AS assertions still pass.
8. CC-JX regression: `jungianOceanDiagnostic.ts` runs unchanged; CC-JX assertions still pass; Jungian → E remains zero.
9. Goal/Soul/Give audit passes (regression — composite consumption unchanged).
10. `INTENSITY_K.E` unchanged.
11. `npx tsc --noEmit` exits 0.
12. `npm run lint` exits 0.
13. `npm run audit:ocean` exits 0.
14. `npm run audit:goal-soul-give` exits 0.
15. `git status --short` shows only Allowed-to-Modify files (the new diagnostic file, `lib/ocean.ts`, `tests/audit/oceanDashboard.audit.ts`).

## Report Back

1. **Summary** in 4–6 sentences. State whether cleanup was sufficient or whether a follow-on k-retune CC is needed. Confirm Jason canary band shift moderate-high → moderate.
2. **Phase 1 diagnostic output** — per-fixture E-tagged signal table + aggregate fire-rate table. Load-bearing evidence for every Phase 2 decision.
3. **Per-signal decisions table** — for each universal-firing signal: keep or remove + rationale. For each removed signal, the canonical-E-misfire reason. For each kept signal, the broadcast / outward-charge / friendly-engagement / social-appetite distinction.
4. **Pre vs post E intensity per fixture** — full table across all 20 fixtures. Min, max, mean, std before and after. Band-distribution histogram before and after.
5. **Jason-shape canary** — pre-cleanup E intensity for Jason fixture, post-cleanup E intensity. Confirm landing in [40, 65]. If not, name which signal removal underdid the cleanup or recommend follow-on k retune.
6. **Cohort universal-E pattern resolution** — pre-cleanup count of fixtures with E ≥ 80; post-cleanup count. Confirm universal-saturation pattern (if present) is broken.
7. **Cross-trait spillover check** — confirm O / C / A / N intensities are unchanged across all fixtures (regression — only E tags were touched).
8. **Jungian-to-E zero check** — confirm no fixture has any Jungian-derived contribution to E (CC-JX architectural rule preserved).
9. **Audit pass/fail breakdown** — including all five new CC-ES assertions, CC-AS regression, CC-JX regression, existing OCEAN regression.
10. **Spec ↔ code drift** — if `docs/ocean-disposition-spec.md` §3 names canonical E signals that no longer exist post-cleanup, flag for spec-sync CODEX.
11. **Out-of-scope verification** — git status; explicit confirmation that INTENSITY_K, render path, band thresholds, composite consumption, other-bucket tags, Jungian architecture, CC-Q1-Q4 wiring are all untouched.
12. **Recommendation for follow-on work** — if cohort spread post-CC-ES is still narrow (< 30 points), recommend INTENSITY_K.E retune CC. If band coverage is still skewed (e.g., no fixture in low band), name what the missing register would look like in signal terms. If no follow-on needed, state cleanup-first held.
