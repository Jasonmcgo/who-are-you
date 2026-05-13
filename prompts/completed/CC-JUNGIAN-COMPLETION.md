# CC-JUNGIAN-COMPLETION — Pattern-in-Motion Firing-Rate Coverage for Si / Se / Ti / Fi / Fe

**Origin:** CODEX-FUNCTION-COVERAGE-AUDIT (shipped 2026-05-08) revealed that CC-029 already shipped 5 candidate patterns (`si_tradition_built_from_chaos`, `se_crisis_alive_planning_strain`, `ti_closed_reasoning_chamber`, `fi_personally_authentic_only`, `fe_attunement_to_yielded_conviction`). The gap is NOT missing patterns; the gap is firing rate. Per the audit's Measurement 2 across the 20-fixture cohort:

```
Function | Fixtures with label | In Pattern in motion
---------|---------------------|----------------------
Ni       | 16 / 20             | 5
Ne       | 1 / 20              | 0
Si       | 1 / 20              | 0
Se       | 19 / 20             | 0
Ti       | 3 / 20              | 0
Te       | 16 / 20             | 0
Fi       | 4 / 20              | 0
Fe       | 0 / 20              | 0
```

Only Ni patterns surface in `Pattern in motion` blocks. The other 7 functions either don't fire any pattern (Se / Te / Fi / Ti / Si / Ne / Fe) or — in Fe's case — don't appear with their plain-English label anywhere in the cohort (0/20 with "room-reader" string).

**Root cause (confirmed by reading lib/identityEngine.ts CROSS_CARD_PATTERNS):** The existing 5 patterns require **dominant-function-only** AND **compound triggers** (e.g., Fe needs `dominant === "fe" && has(signals, "adapts_under_social_pressure")`). Both conditions are rare individually; their conjunction is co-rare. Result: shipped patterns sit in the catalog but rarely surface.

**Scope:** Add 5 NEW complement patterns — one per function (Si, Se, Ti, Fi, Fe) — that:
- Fire on **dominant OR auxiliary** (broader than existing patterns)
- Use **single-condition triggers** (no compound co-rare conditions)
- Express the function's **gift in healthy register** (synthesis over contradiction; the existing patterns cover gift→risk gradients, the new ones cover gift-presence)
- Use the function's **plain-English label verbatim** in prose (so future coverage audits can detect them)
- Render via the existing "Pattern in motion" footer per CC-PROSE-1A canon

**Method discipline:** Pattern-catalog work, not new measurement. Existing 5 patterns stay verbatim. New patterns complement them — they are NOT broader replacements.

**Scope frame:** ~3-4 hours executor time. CC-scale because each pattern's prose template carries editorial judgment (the gift framing, the choice of card placement, the integration of plain-English label without sounding clinical).

**Project memory context:** `project_pattern_catalog_function_bias` (the original 5-candidate queue, now closed by CC-029); `feedback_minimal_questions_maximum_output` (pattern-catalog beats new measurement); `feedback_pair_key_casing_canon` (FunctionPairKey is PascalCase); `feedback_synthesis_over_contradiction` (prefer coherence reads — gift-presence is coherence); `feedback_hedge_density_in_engine_prose` (do not add hedges); `project_cc_prose_track_status` (CC-PROSE-1A renamed Pattern observation → Pattern in motion; new patterns render via this footer).

---

## Launch Directive

`claude --dangerously-skip-permissions` or `/permissions` → bypass.

## Bash Commands Authorized

- `npx tsc --noEmit`
- `npm run lint`
- `npx tsx tests/audit/proseArchitecture.audit.ts`
- `npx tsx tests/audit/functionCoverage.audit.ts` (re-run after edits to verify firing-rate improvements)
- `npx tsx tests/audit/jungianCompletion.audit.ts` (the new file added by this CC)
- `npm run audit:ocean`
- `npm run audit:goal-soul-give`
- `npm run dev`
- `git status`, `git diff`
- `node`, `npx tsx`
- `cat`, `grep`, `find`

## Read First (Required)

1. **Re-read CODEX-FUNCTION-COVERAGE-AUDIT report back** — the firing-rate matrix is the empirical scope-target.
2. `lib/identityEngine.ts` — locate `CROSS_CARD_PATTERNS` array (around line 5400-5708 per current state). Read the full structure of the existing 5 CC-029 patterns plus surrounding patterns for structural conventions:
   - `pattern_id` (snake_case)
   - `name` (human-readable)
   - `description` (engineering note explaining the trigger logic)
   - `applicable_card` (one of: weather / path / fire / lens / compass / gravity / trust / conviction)
   - `detection: (signals, topCompass, topGravity, lensStack, metaSignals?) => boolean`
   - `prose: (signals, topCompass, topGravity, lensStack, demographics?) => string`
3. `lib/types.ts` — confirm `LensStack` shape (`dominant`, `auxiliary` fields). Confirm `Signal[]`, `SignalRef[]`, `MetaSignal[]` shapes.
4. The function plain-English label mapping — locate where Ni → "pattern-reader", Ne → "possibility-finder", Si → "precedent-checker", Se → "present-tense self", Ti → "coherence-checker", Te → "structurer", Fi → "inner compass", Fe → "room-reader" is canonized. Likely in `lib/cardAssets.ts` or `lib/identityEngine.ts`. Use these exact strings in new pattern prose.
5. The 20-fixture cohort. Empirical scope verification.
6. `tests/audit/functionCoverage.audit.ts` — the existing audit tells you exactly which functions need firing-rate improvements.

## Allowed to Modify

### Addition — 5 new complement patterns

**File modified:** `lib/identityEngine.ts` — append to the `CROSS_CARD_PATTERNS` array (or wherever new patterns are added in the existing pattern catalog structure).

For each of the 5 functions (Si, Se, Ti, Fi, Fe), add ONE new pattern following this template structure (mirroring the existing patterns' shape):

```ts
{
  pattern_id: "<function>_<descriptor>_general",  // suffix "_general" distinguishes from CC-029's specific patterns
  name: "<Function plain-English label> — <gift register descriptor>",
  description: "<function> dominant or auxiliary — naming the gift this function carries in healthy register, without compound triggers; complements the CC-029 distortion-specific pattern.",
  applicable_card: "<card>",  // executor picks; see card placement guidance below
  detection: (_signals, _tc, _tg, lensStack) =>
    lensStack.dominant === "<function>" || lensStack.auxiliary === "<function>",
  prose: (_s, _tc, _tg, _ls, demographics) => {
    // second-person; uses plain-English function label verbatim; expresses gift in healthy register
    return `<prose template>`;
  },
}
```

**Per-function authoring guidance:**

#### Si — "Precedent as carrier of continuity"

- `pattern_id`: `si_precedent_carries_continuity_general`
- `applicable_card`: `trust` (Si as the source of "what has been tested" trust register)
- Detection: `lensStack.dominant === "si" || lensStack.auxiliary === "si"`
- Prose theme: the precedent-checker's gift is fidelity to what has been tested. The function carries continuity — the inheritance of what has worked, the attention to what shouldn't be lost in the rush to update. Use the "precedent-checker" label verbatim. Express the gift in healthy register (without negating CC-029's distortion pattern, which fires on Si + chaos_exposure specifically).
- Example prose (illustrative, executor refines): "Your shape carries the precedent-checker as part of how you read what's worth keeping. The instinct to honor what has been tested is the gift this function gives — what others may dismiss as old, you may recognize as proven. The work is to let inheritance and update both have voice, not as opponents but as partners."

#### Se — "Present-tense reading"

- `pattern_id`: `se_present_tense_reading_general`
- `applicable_card`: `lens` (Se as the source of "what's actually here" reading)
- Detection: `lensStack.dominant === "se" || lensStack.auxiliary === "se"`
- Prose theme: Se's gift is reading what is actually here right now — the somatic, immediate, embodied attention to the room as it is. Use the "present-tense self" label verbatim. Gift register; CC-029's pattern handles the long-arc strain.
- Note: 19/20 fixtures already have "present-tense self" string in body prose. The complement pattern adds it to Pattern in motion specifically.

#### Ti — "Coherence as vetting"

- `pattern_id`: `ti_coherence_as_vetting_general`
- `applicable_card`: `trust` (Ti as the function that vets claims for internal fit)
- Detection: `lensStack.dominant === "ti" || lensStack.auxiliary === "ti"`
- Prose theme: Ti's gift is the test for internal coherence — the move that asks "does this hold together" before it asks "is this useful." Use the "coherence-checker" label verbatim. Gift register; CC-029's pattern handles the closed-reasoning-chamber distortion.
- Note: pair this with Trust to surface alongside Si (precedent-vetting) — both Trust-card patterns name what gets weight in the user's authority register.

#### Fi — "Inner compass as anchor"

- `pattern_id`: `fi_inner_compass_anchor_general`
- `applicable_card`: `compass` (Fi as the function that anchors authentic value)
- Detection: `lensStack.dominant === "fi" || lensStack.auxiliary === "fi"`
- Prose theme: Fi's gift is the unmistakable inner conscience — the test that asks "can I say this and remain myself" before it asks "will this be received." Use the "inner compass" label verbatim. Gift register; CC-029's pattern handles the personal-truth-as-universal-mandate distortion.

#### Fe — "Relational reading as care"

- `pattern_id`: `fe_relational_reading_care_general`
- `applicable_card`: `compass` (Fe as the function that protects relational consequence)
- Detection: `lensStack.dominant === "fe" || lensStack.auxiliary === "fe"`
- Prose theme: Fe's gift is the read of what the moment is asking relationally — sensing consequence in language, presence, timing. Use the "room-reader" label verbatim (the audit specifically measured this string at 0/20; the new pattern's prose using "room-reader" verbatim closes that gap when Fe-dominant or aux fixtures fire it).
- Note: this is the function with the deepest current gap (0/20 anywhere). Even with the broader trigger, cohort coverage may stay thin if no fixtures have Fe in dominant or auxiliary position. Document the empirical reach in Report Back; if Fe stays at 0/20 even with broadened trigger, that's a cohort-thinness finding, not a pattern bug.

**Authoring rules:**

- Use existing engine vocabulary verbatim. The function plain-English labels are canonical (per `lib/cardAssets.ts` or wherever they live); do NOT vary them.
- Each prose template uses second-person ("Your shape..." / "Your ___ carries..." / "The work is to...") matching CC-PROSE-1A voice canon.
- Each prose template embeds the function's plain-English label verbatim (so future coverage audits can detect it). The audit specifically measures string presence; using the label is the operational closure.
- Each prose template includes engine hedge language ("appears to" / "may" / "tends to" / "suggests" / "likely") at the existing rate. Per `feedback_hedge_density_in_engine_prose`: do NOT add hedges; do NOT remove existing hedges.
- Each prose template expresses the gift in healthy register. Synthesis-over-contradiction: name what the function gives, not just what it costs.
- `applicable_card` should NOT collide with the same card as the existing CC-029 distortion pattern for that function (Si's distortion is on `weather`, so general goes to `trust`; Fe's distortion is on `fire`, so general goes to `compass`). This avoids two patterns from the same function rendering on the same card.
- New pattern_id suffix: `_general` distinguishes from CC-029's specific naming. Convention is locked for future expansions.

### Audit assertions

**New file:** `tests/audit/jungianCompletion.audit.ts`. Add assertion block (run across all 20 fixtures):

- `jungian-completion-si-general-pattern-present`: Pattern with `pattern_id` ending in `si_*_general` exists in CROSS_CARD_PATTERNS.
- `jungian-completion-se-general-pattern-present`: Same for Se.
- `jungian-completion-ti-general-pattern-present`: Same for Ti.
- `jungian-completion-fi-general-pattern-present`: Same for Fi.
- `jungian-completion-fe-general-pattern-present`: Same for Fe.
- `jungian-completion-firing-rate-improved`: After CC-JUNGIAN-COMPLETION's edits, re-running the function-coverage audit shows non-Ni functions firing in Pattern in motion at higher rates than the pre-CC baseline (Si, Se, Ti, Fi, Fe each ≥ 1/20; OR document why a specific function stays at 0/20 — likely cohort thinness, not pattern bug). The exact numeric improvement depends on cohort fixture composition; no hard threshold beyond ">0 if any fixture has function dominant or aux."
- `jungian-completion-no-hedge-density-spike`: Average hedge phrase count per fixture rendered output is within ±5 of pre-CC baseline. (Prevents new patterns from raising the already-high hedge rate.)
- `jungian-completion-existing-patterns-preserved`: All 5 CC-029 patterns (`si_tradition_built_from_chaos`, `se_crisis_alive_planning_strain`, `ti_closed_reasoning_chamber`, `fi_personally_authentic_only`, `fe_attunement_to_yielded_conviction`) still exist in CROSS_CARD_PATTERNS, verbatim, with original `pattern_id` and `prose` strings.
- `jungian-completion-plain-english-label-in-prose`: For each new pattern, the prose template contains the function's plain-English label string verbatim ("precedent-checker" / "present-tense self" / "coherence-checker" / "inner compass" / "room-reader").
- `jungian-completion-applicable-card-no-collision`: Each new pattern's `applicable_card` differs from its CC-029 counterpart's `applicable_card` (audit checks per-function pair).

## Out of Scope (Do Not)

1. **Do NOT modify the 5 existing CC-029 patterns.** They are canonical. New complement patterns sit alongside them.
2. **Do NOT broaden the existing patterns' trigger conditions.** The existing patterns' prose was tuned to specific compound conditions; broader triggers would produce off-tone prose. New patterns are the cleaner route.
3. **Do NOT add new questions to the question bank.** Per `feedback_minimal_questions_maximum_output`. Functions are already measurable from existing signals.
4. **Do NOT modify any signal pool, intensity math, or composite consumption.**
5. **Do NOT modify the function identification logic** (`lens_stack.dominant`, `lens_stack.auxiliary`). Identification works; only the pattern-firing layer needs new patterns.
6. **Do NOT modify CC-PROSE-1 / 1A / 1B canon.** "Pattern in motion" footer label, callout treatment, Layer 4/5/6 composers — all untouched. New patterns render via the existing rendering path.
7. **Do NOT modify CC-SYNTHESIS-1A's classifier logic** if 1A has shipped. New patterns may reference Risk Form letter or Quadrant label as additional trigger conditions if useful, but do NOT modify the classifiers themselves.
8. **Do NOT modify body card prose** (Strength / Growth Edge / Practice / Pattern Note) outside the new pattern entries.
9. **Do NOT add hedges.** Per `feedback_hedge_density_in_engine_prose`. New pattern prose uses existing hedge rate only.
10. **Do NOT invent new function vocabulary.** Use the canonical plain-English labels verbatim. If a new pattern needs a new descriptor, that's a separate scope decision.
11. **Do NOT add LLM calls or API integrations.** Pure pattern-catalog authoring.
12. **Do NOT modify the masthead, "How to Read This", or section ordering.**
13. **Do NOT modify** the question bank, fixture files, `MEMORY.md`, `AGENTS.md`, `docs/canon/`, or any spec memo.
14. **Do NOT install dependencies.**
15. **Do NOT touch existing audit assertions** (`prose-1-*`, `prose-1a-*`, `prose-1b-*`, `synth-1a-*`, OCEAN, Goal/Soul/Give). They stay green; CC-JUNGIAN-COMPLETION adds new `jungian-completion-*` assertions in a new file.
16. **Do NOT exceed the 5 named functions.** Te is currently at 16/20 in body prose, 0/20 in patterns. If the executor sees scope to add a Te complement pattern, flag it for a future CC; do NOT include in this scope.
17. **Do NOT modify pattern detection signature shape.** The existing `(signals, topCompass, topGravity, lensStack, metaSignals?)` signature stays canonical.
18. **Do NOT add complex compound triggers to new patterns.** Single condition (dominant OR auxiliary) is the design choice. Compound triggers are CC-029's territory.

## Acceptance Criteria

1. 5 new complement patterns shipped in `CROSS_CARD_PATTERNS` (one per function: Si, Se, Ti, Fi, Fe).
2. Each new pattern's `pattern_id` ends with `_general` to distinguish from CC-029's specific naming.
3. Each new pattern's `detection` uses `lensStack.dominant === "<fn>" || lensStack.auxiliary === "<fn>"` (single-condition trigger).
4. Each new pattern's `prose` template uses second-person voice + the function's plain-English label verbatim + healthy gift register.
5. Each new pattern's `applicable_card` differs from its CC-029 counterpart's `applicable_card`.
6. All 9 new `jungian-completion-*` audit assertions pass.
7. CODEX-FUNCTION-COVERAGE-AUDIT re-run shows firing-rate improvements: Si, Se, Ti, Fi each ≥ 1/20 in Pattern in motion blocks (Fe may stay at 0/20 if no fixture has Fe-dominant/aux — document if so).
8. All existing CC-PROSE-1 / 1A / 1B audit assertions still pass (regression).
9. CC-SYNTHESIS-1A audit assertions still pass if 1A has shipped.
10. CC-029's 5 existing patterns preserved verbatim (pattern_id, prose, detection, applicable_card all unchanged).
11. Existing OCEAN + Goal/Soul/Give audit assertions pass.
12. CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression: all assertions still pass.
13. Hedge density delta within ±5 phrases per fixture.
14. `npx tsc --noEmit` exits 0.
15. `npm run lint` exits 0.
16. `npx tsx tests/audit/jungianCompletion.audit.ts` exits 0.

## Report Back

1. **Summary** in 4-6 sentences. State: 5 new complement patterns shipped; firing rate per function post-CC vs pre-CC baseline.
2. **Per-function pattern shipped** — for each of the 5 new patterns, paste:
   - `pattern_id`
   - `applicable_card` and rationale for not colliding with CC-029 counterpart's card
   - `detection` condition (in plain English)
   - Full prose template (the actual rendered string)
3. **Firing-rate improvement** — paste post-CC rerun of CODEX-FUNCTION-COVERAGE-AUDIT's Measurement 2. Compare each function's "In Pattern in motion" count pre-CC vs post-CC.
4. **Cohort thinness findings** — for any function that stays at 0/20 in Pattern in motion despite the broader trigger, name which fixtures came closest (e.g., "Fe stays at 0/20 because the cohort has 0 Fe-dominant and 0 Fe-auxiliary fixtures; closest match is fixture-X with Fe in tertiary position"). This is empirical visibility into where the 20-fixture cohort needs expansion, not a pattern bug.
5. **Render samples** — for at least 2 fixtures that fire new patterns, paste the rendered "Pattern in motion" footer lines. Confirm voice + hedging + gift register all hold; confirm the function's plain-English label appears verbatim in the rendered prose.
6. **Hedge density delta** — pre-CC baseline vs post-CC baseline; confirm within ±5 phrases per fixture.
7. **Audit pass/fail breakdown** — including all 9 new `jungian-completion-*` assertions, CC-PROSE-1 / 1A / 1B regression, CC-SYNTHESIS-1A regression if applicable, CC-029 pattern preservation, OCEAN + Goal/Soul/Give regression, CC-AS / CC-JX / CC-ES / CODEX-086 / CODEX-087 regression.
8. **Out-of-scope verification** — git status; if pre-existing modified files in the worktree make full verification impossible (per the CODEX-FUNCTION-COVERAGE-AUDIT executor's note), document which files were modified by THIS CC specifically (the `CROSS_CARD_PATTERNS` array additions + the new audit file) so reviewers can verify scope precisely.
9. **Recommendations for follow-on work**:
   - Te complement pattern queueing (Te is at 16/20 body / 0/20 patterns; same gap as Se; could be CC-JUNGIAN-COMPLETION-2)
   - Ne complement pattern queueing (Ne at 1/20 body in cohort suggests cohort thinness; may need fixture expansion before pattern work)
   - Cohort thinness findings — which functions need additional fixtures to validate firing-rate improvements
   - Any pattern catalog structural cleanup that surfaced during this work (e.g., naming convention drift, applicable_card consistency)
