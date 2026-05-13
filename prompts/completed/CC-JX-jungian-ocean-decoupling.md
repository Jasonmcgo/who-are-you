# CC-JX — Jungian / OCEAN Position-Weighted Decoupling

**Origin:** Jason's architectural insight (2026-05-08, late night). Current OCEAN math sums every Q-T cog-function emission equally, producing universal A and E inflation because every MBTI type carries 2 extraverted + 2 introverted functions in their balanced stack. Adding e-functions to OCEAN-E without subtracting i-functions inflates E across all users; same structural pattern inflates A through fi/fe. Fix: stack-position weighted contribution, scoped to canonically-defensible bridges (O, C, A only — never E, never N).

**Scope frame:** Three-layer architectural cleanup. Layer 1: extract stack resolution into a shared helper used by both Lens classification and OCEAN bridges (single source of truth). Layer 2: position-weighted contribution curve — dominant pulls full weight, shadow positions contribute zero. Layer 3: kept bridges restricted to O, C, A; removed entirely from E and N. Replaces planned CC-AS round 2 and CC-ES — both subsumed by this architectural fix. ~3 hours of executor time.

**Project memory context:** `feedback_signal_pool_diagnostic_method` (CC-077 / CC-AS lesson); `project_ocean_disposition_spec` (the canonical OCEAN spec); `feedback_coherence_over_cleverness` (the post-architecture priority — coherence wins). This CC is coherence work: aligning the Jungian-and-OCEAN layered architecture's intent (separate measurement models, parallel layers) with its math (currently bleeding).

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Execution Directive

Three-phase single pass:

**Phase 1 — Diagnostic + Stack Resolver.** Build `tests/audit/jungianOceanDiagnostic.ts` (mirrors CC-AS harness pattern). Print, per fixture: cog-function cumulative weights from Q-T, derived stack order, current OCEAN contribution per bucket from each cog function, intensity per OCEAN bucket. Aggregate: which functions currently fire into which OCEAN buckets at what magnitude. This is the load-bearing evidence for Phase 2 decisions.

Extract stack resolution into `lib/jungianStack.ts` (new file). Accepts signals input (and optional explicit ordering — placeholder hook for future Q-Function-Order question). Returns the user's cog-function stack as an ordered array `[{function, position, positionWeight}]`. Both Lens classification (which currently does this internally) and OCEAN bridges read from this shared helper.

**Phase 2 — Bridge Decoupling.** Update `SIGNAL_OCEAN_TAGS` per the bridge mapping in §"Allowed to Modify" 3. Every existing Jungian → OCEAN tag is reviewed; kept bridges get rewritten to read from the position-weighted helper; removed bridges (E entirely, N entirely) get the cog-function tags stripped.

**Phase 3 — OCEAN math integration.** `computeOceanIntensities` reads position-weighted Jungian contributions from the shared helper for O / C / A buckets. E and N compute purely from their direct Big-Five-canonical signals. Run audit; verify cohort spread widens for E and A; verify Jason canary preserves O direction (Ni dominant → O Intellectual subdim should land high) while A and E drop further.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npm run audit:goal-soul-give`
- `npm run audit:ocean`
- `npx tsx tests/audit/agreeablenessSignalPoolDiagnostic.ts` (CC-AS harness — verify regression)
- `npx tsx tests/audit/jungianOceanDiagnostic.ts` (new — runs Phase 1)
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. `lib/ocean.ts` — full file. Post-CC-AS state. `SIGNAL_OCEAN_TAGS`, `INTENSITY_K`, `computeOceanIntensities`, weighted-sum math.
2. `lib/types.ts` — `OceanBucket`, `OceanIntensity`, signal types, any existing Jungian-related types.
3. `data/questions.ts` — Q-T1 through Q-T8 (or however many). Identify which cog functions are emitted by each question and how many distinct functions appear across the full Q-T set. Also: search for any existing question that asks the user to explicitly rank cog functions (e.g., "Q-Function-Order"). If none exists, document the absence; the stack resolver provides a hook for future addition.
4. `lib/identityEngine.ts` (or wherever Q-T signals extract) — current rank-aware extraction.
5. `lib/lens.ts` (or wherever Lens classification computes function dominance) — extract the existing stack-derivation logic; this becomes the Phase 1 helper foundation.
6. `tests/audit/agreeablenessSignalPoolDiagnostic.ts` — CC-AS harness; pattern to mirror.
7. `tests/audit/oceanDashboard.audit.ts` — assertion scaffold + post-CC-AS assertions.
8. `prompts/completed/CC-077-*.md`, `prompts/completed/CC-AS-*.md` — precedent context.
9. `docs/ocean-disposition-spec.md` — §3 (Openness subdimensions), §4 (Agreeableness register), §5 (Emotional Reactivity). Bridge decisions must respect §-canon definitions.

## Allowed to Modify

### 1. NEW — `lib/jungianStack.ts`

Single source of truth for stack resolution. Exposes:

```ts
type CogFunction = "Ne" | "Ni" | "Se" | "Si" | "Te" | "Ti" | "Fe" | "Fi";

type StackEntry = {
  function: CogFunction;
  position: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  positionWeight: number;  // 1.0 / 0.6 / 0.3 / 0.1 / 0.0
  cumulativeRawWeight: number;  // from Q-T extraction
};

type JungianStack = StackEntry[];  // sorted by cumulativeRawWeight desc

function computeJungianStack(
  signals: Signal[],
  explicitOrdering?: CogFunction[]  // future Q-Function-Order hook
): JungianStack;
```

**Position weight curve (v1):**
- Position 1 (dominant): 1.0
- Position 2 (auxiliary): 0.6
- Position 3 (tertiary): 0.3
- Position 4 (inferior): 0.1
- Position 5+ (shadow): 0.0

When `explicitOrdering` is provided, use it directly. When absent, derive stack from `cumulativeRawWeight` desc-sort. Functions with zero firings end up at the tail with positionWeight 0.

Lens classification (existing) refactors to consume `computeJungianStack(signals).map(s => s.function)` rather than computing dominance internally. This unifies the Lens and OCEAN paths against the same stack truth.

### 2. UPDATE — `lib/lens.ts` (or wherever Lens dominance computes)

Refactor to read stack from `lib/jungianStack.ts`. No semantic change to Lens classification — the dominance computation already returns the same answer; this is a refactor that makes the source explicit and shared. Verify post-refactor that all existing Lens fixture readings are unchanged.

### 3. UPDATE — `lib/ocean.ts` `SIGNAL_OCEAN_TAGS` + `computeOceanIntensities`

**Bridge mapping (v1):**

| Jungian function | OCEAN bridge | Bridge coefficient (v1) |
|---|---|---|
| Ne | O (Novelty subdim primary; Intellectual mild) | 1.0 |
| Ni | O (Intellectual subdim primary) | 1.0 |
| Si | O (Novelty NEGATIVE — anti-bridge) ALSO C (Order facet) | O: 0.5 (negative); C: 1.0 |
| Se | O (Aesthetic mild — sensory engagement) | 0.5 |
| Te | C (Organization / Planning facet) | 1.0 |
| Ti | C (Deliberation facet) | 1.0 |
| Fe | A (Relational-accommodation facet) | 1.0 |
| Fi | A (Moral-concern facet) | 1.0 |

**Removed bridges (no Jungian contribution):**
- E receives ZERO contribution from any cog-function signal. Big Five Extraversion measures sociability / positive-affect / external-stimulation-seeking; Jungian e/i orientation is energy-direction (different construct). Per CC-077, secondary tags were already removed; this CC removes any remaining primary E tags from cog functions.
- N receives ZERO contribution from any cog-function signal. Jung has no canonical bridge to neuroticism / emotional reactivity; CC-Q1's Q-O2 reactivity signals are the canonical N pool.

**Contribution formula:**

```
jungianContribution(bucket, function) = positionWeight × bridgeCoefficient
```

The `cumulativeRawWeight` from Q-T is consumed only for stack ordering; OCEAN contribution comes purely from the position weight × bridge coefficient. This is the architectural simplification: position determines weight, not Q-T raw output.

`computeOceanIntensities` updates to compute Jungian contributions via this formula, then sums them with non-Jungian OCEAN signals (Q-O1/Q-O2 direct measurements; Big-Five-canonical signals from compass / stakes / etc. that survived CC-AS) into the existing weighted-sum and saturation curve.

**Anti-bridges:** Si → O Novelty NEGATIVE is the only anti-bridge in v1. Implementation: Si subtracts (positionWeight × 0.5) from O Novelty subdim. All other bridges are additive. If cohort data after Phase 3 shows insufficient separation, additional anti-bridges (e.g., Te → A negative, Se → C negative) are deferred to a CC-JX-2 follow-up; do NOT add in this CC.

### 4. NEW — `tests/audit/jungianOceanDiagnostic.ts`

Mirrors `agreeablenessSignalPoolDiagnostic.ts` pattern. For each fixture (7 OCEAN + 13 goal-soul-give = 20 total):
- Extract Q-T signals; compute stack via `computeJungianStack`.
- Print: stack ordering with positionWeight per function.
- Print: per-OCEAN-bucket Jungian contribution (decomposed by function).
- Print: pre-CC-JX vs post-CC-JX intensity per OCEAN bucket (with the diff).

Aggregate output:
- Per-bucket: cohort min / max / mean / std for Jungian-contribution magnitude.
- Histogram of stack-position distribution for each function (e.g., "Ni appeared at position 1 in 4 fixtures, position 2 in 6, …").
- Cohort spread for E and A: pre vs post.

Keep file as permanent regression tool (per CC-AS precedent — diagnostic harnesses don't get deleted).

### 5. UPDATE — `tests/audit/oceanDashboard.audit.ts`

Add CC-JX assertion block:

- `jx-no-jungian-to-e`: For every fixture, the E weighted-sum contribution from cog-function signals is exactly 0.
- `jx-no-jungian-to-n`: For every fixture, the N weighted-sum contribution from cog-function signals is exactly 0.
- `jx-stack-position-weighted`: For at least one fixture with a clear dominant function (e.g., Jason fixture: Ni dominant), the contribution from Ni to O is greater than the contribution from any cog function at position 4 or lower.
- `jx-shadow-zero-contribution`: For at least one fixture, a position 5+ cog function contributes 0 to all OCEAN buckets.
- `jx-jason-canary`: Jason fixture (`07-jason-real-session`) post-CC-JX:
  - O ≥ 75 (Ni-dominant boost preserves architectural-led Openness)
  - A drops from post-CC-AS reading by at least 5 points (Fi tertiary × 0.3 contributes, but no longer fi-firing-everywhere stacking)
  - E drops from current reading by at least 5 points (no Jungian contribution, only Big-Five-canonical signals)
- `jx-cohort-e-spread-widens`: `(max E − min E) post-CC-JX > (max E − min E) post-CC-AS`.
- `jx-cohort-a-spread-preserved-or-widens`: `(max A − min A) post-CC-JX ≥ (max A − min A) post-CC-AS`.
- `jx-architectural-flavor-preserved`: Jason fixture's Openness flavor remains `architectural_led` post-CC-JX (CODEX-078's tie-break still wins).

### 6. UPDATE — Lens regression check

After the Lens refactor (§2 above), verify ALL Lens fixture readings are bit-for-bit identical. Lens dominance and Lens-led ShapeCard prose must not change. The refactor is internal; the externally-visible Lens classification stays canon. Add a `jx-lens-regression-check` assertion confirming this.

## Out of Scope (Do Not)

1. **Do NOT retune `INTENSITY_K`.** Cleanup-first per CC-077 / CC-AS lesson. If post-CC-JX cohort spread is insufficient, document for a follow-on CC; don't retune in this pass.
2. **Do NOT modify Big-Five-direct OCEAN signals.** The Q-O1 / Q-O2 signals (CC-Q1), the kept canonical A signals (post-CC-AS: caring_energy_priority, loyalty_priority, compassion_priority, mercy_priority), and E / C / N direct signals all stay untouched. CC-JX only modifies Jungian-to-OCEAN bridges.
3. **Do NOT modify Lens classification semantics.** The refactor changes the source-of-truth for stack derivation but produces identical Lens output. Any Lens classification change is out-of-scope.
4. **Do NOT modify Path classification or any other consumer of cog-function signals.** Cog-function signals continue to fire and live in `signals[]` for downstream consumers — only the OCEAN bridge changes.
5. **Do NOT modify the OCEAN render path or prose templates.** `BAND_INTERPRETATION`, `composeOceanProse`, `renderOceanDashboardSVG` all stay. Bridge changes propagate purely through intensity values.
6. **Do NOT modify CODEX-086 §4 (moral-concern dominant gate).** The post-CC-JX A distribution may warrant a different gate, but that's a follow-on decision after CC-JX cohort impact is known.
7. **Do NOT add new questions.** The explicit-ordering hook in `computeJungianStack` accepts an optional parameter; no Q-Function-Order question is added in this CC.
8. **Do NOT modify band thresholds** (under-detected / low / moderate / moderate-high / high cutoffs).
9. **Do NOT add additional anti-bridges** beyond Si → O Novelty negative. Te → A, Se → C, etc., are deferred to CC-JX-2 if cohort data warrants.
10. **Do NOT modify** `MEMORY.md`, `AGENTS.md`, `docs/canon/`, `docs/ocean-disposition-spec.md`, or any spec memo. Drift documented in Report Back.
11. **Do NOT install dependencies.**
12. **Do NOT touch fixture files.** Same discipline as CC-AS — fixtures are input; modifying them to make assertions pass is gaming the diagnostic.
13. **Do NOT delete the diagnostic harness file after the CC.** Permanent regression tool.
14. **Do NOT modify** `tests/audit/goalSoulGive.audit.ts`. Goal/Soul audit untouched (regression-only — composite consumption unchanged).
15. **Do NOT modify** `tests/audit/agreeablenessSignalPoolDiagnostic.ts`. CC-AS harness stays as-is; CC-JX harness is a new file.

## Acceptance Criteria

1. `lib/jungianStack.ts` exists, exports `computeJungianStack` + types, accepts optional `explicitOrdering`, derives from cumulative weight when absent.
2. Lens classification refactored to consume `computeJungianStack`; Lens output bit-for-bit identical to pre-refactor.
3. `lib/ocean.ts` `SIGNAL_OCEAN_TAGS` + `computeOceanIntensities` updated per the bridge mapping (§3 above).
4. E and N receive ZERO Jungian contribution.
5. O / C / A receive position-weighted Jungian contributions per the bridge mapping.
6. Si → O Novelty anti-bridge implemented (only anti-bridge in v1).
7. Diagnostic harness exists at `tests/audit/jungianOceanDiagnostic.ts`, runs via `npx tsx`, produces per-fixture + aggregate output.
8. All CC-JX assertions in `oceanDashboard.audit.ts` pass.
9. CC-AS regression: existing CC-AS assertions still pass; A no longer universally saturates; cohort spread holds or widens.
10. Existing OCEAN audit assertions all pass (regression).
11. Goal/Soul/Give audit passes (regression — composite consumption unchanged).
12. Jason canary: O ≥ 75 (architectural Openness preserved), A drops ≥ 5 from post-CC-AS, E drops ≥ 5 from current.
13. `INTENSITY_K` unchanged.
14. `npx tsc --noEmit` exits 0.
15. `npm run lint` exits 0.
16. `npm run audit:ocean` exits 0.
17. `npm run audit:goal-soul-give` exits 0.
18. `git status --short` shows only Allowed-to-Modify files.

## Report Back

1. **Summary** in 5–8 sentences. State whether the architectural cleanup was sufficient or whether bridge coefficients / anti-bridges need a follow-on tuning pass.
2. **Diagnostic output** — per-fixture stack ordering with position weights; per-bucket Jungian contribution decomposition; aggregate stack-position histograms.
3. **Bridge mapping as implemented** — table of (function, OCEAN bucket, coefficient, sign). If any bridge was deferred or implemented differently than spec, name and justify.
4. **Pre vs post OCEAN intensities** — full table across all 20 fixtures. Per-bucket pre-CC-JX vs post-CC-JX intensity, with the delta. Show min / max / mean / std before and after for each bucket.
5. **Jason canary** — pre-CC-JX values; post-CC-JX values. Confirm: O ≥ 75; A dropped ≥ 5 from post-CC-AS; E dropped ≥ 5; architectural-led flavor preserved.
6. **Cohort spread** — E spread pre vs post; A spread pre vs post; band histograms.
7. **Universal-inflation pattern** — count of fixtures with E ≥ 70 pre vs post; count with A ≥ 90 pre vs post. Confirm both patterns broken.
8. **Lens refactor regression check** — confirmation that all Lens fixture readings are bit-for-bit identical to pre-refactor.
9. **Cross-trait spillover check** — confirm changes in non-OCEAN surfaces (Path, Compass, etc.) are absent or explainable.
10. **Audit pass/fail breakdown** — including all CC-JX assertions, CC-AS regression assertions, existing OCEAN assertions, Goal/Soul regression.
11. **Architectural notes** — observations on the position weight curve (1.0 / 0.6 / 0.3 / 0.1 / 0.0). Did it produce sufficient separation? Should v2 use a steeper or gentler curve? Document any cohort data that informs the answer.
12. **Spec ↔ code drift** — `docs/ocean-disposition-spec.md` §3-§5 may need updating to name the position-weighted Jungian bridge architecture. Flag for follow-on CODEX; do not edit spec from this CC.
13. **Out-of-scope verification** — git status; explicit confirmation that INTENSITY_K, render path, band thresholds, composite consumption, non-Jungian signals, and Lens semantics are all untouched.
14. **Recommendations** — for CC-JX-2 (anti-bridges or coefficient tuning if warranted) or CODEX-086 §4 gate revisit (the moral-concern dominant gate's right threshold post-CC-JX).
