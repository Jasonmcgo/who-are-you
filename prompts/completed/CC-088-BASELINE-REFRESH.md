# CC-088 — Baseline Refresh (Audit Cleanup)

## Objective

Regenerate the audit baselines that drifted as a deliberate consequence of CC-084 (Risk Form 5th band) + CC-085 (Grip Pattern card render) + CC-086 (shape-aware prose routing) + CC-086 followup (aux-aware steward routing). These three CCs each introduced intentional cohort-fixture output changes; the 17 audits keyed on baseline content hashes correctly cascaded into failure as documented across each CC's report-back.

This is **cleanup-only**. Zero engine impact, zero user-visible change, zero new logic. The cohort sweep audit count drops from 19 failures → ~2 pre-existing environmental failures (`aimMigrationFinish.audit.ts` EPERM on tsbuildinfo; `proseRegister.audit.ts` 24h cache freshness window).

## Sequencing

- Fires alone or in parallel with **CC-089**, **CC-091**, **CC-094**.
- Should land **before CC-092** (Gift table fix) — CC-092 will produce additional baseline drift; refreshing once now means CC-092 only re-drifts a smaller set.
- Must not happen DURING any engine-changing CC (the baseline captured here represents post-CC-084/085/086 expected output).

## Launch Directive

Run with `claude --dangerously-skip-permissions`.

## Execution Directive

Single pass. Run each known baseline-generation script in deterministic order; commit the regenerated baselines + JSON snapshots; verify the audit sweep drops to expected residual failures.

## Bash Commands Authorized

- `grep`, `ls`, `cat`, `find`, `wc`
- `npx tsx tests/audit/<baseline-snapshot-script>.ts` for each baseline generator
- `npx tsx tests/audit/<audit>.audit.ts` for verification
- `npx tsc --noEmit`
- `npm run lint`

Do not run `npm install`, `git commit`, `git push`, `drizzle-kit push`, or any LLM build script.

## Read First (Required)

1. `tests/audit/twoTierBaseline.snapshot.ts` — generator for the twoTier cohort snapshot. Confirm shape; this is the primary baseline regen.
2. The 17 audits that cascaded into failure post-CC-084 (per CC-084's report-back): `cacheMissLoudfail`, `crisisPathProse`, `gripTaxonomy`, `handsCard`, `launchVoicePolishV2`, `liveSessionLlmWiring`, `llmProsePassV1`, `llmRenderProductionPolish`, `phase3aLabels`, `productionRenderPathWiring`, `proseV1RenderFire`, `reactOnScreenLlmRender`, `synthesis1Finish`, `synthesis3`, `voiceRubricExpansion`, plus `twoTierRenderSurfaceCleanup`. For each, locate whether it reads from a `*.snapshot.json` or `*.baseline.json` file (or equivalent); regenerate those snapshot files only.
3. `lib/cache/*.json` — only the cohort-cache files that audits consume as match-rate baselines (gripTaxonomy.cache.json + similar). The render-time cache files used by the LLM rewrite layer are OUT of scope; don't touch those.
4. `feedback_gradient_calibration_canon.md` — informational; this CC is mechanical so canon doesn't gate the work, but the resulting cleanliness sets up tomorrow's gradient-fix CCs to land cleanly.

## Scope

### Item 1 — Inventory affected baselines

Grep the 17 failing audits for their baseline file references. Build a per-audit map of `(audit name, baseline file path, regen script)`. If a baseline has no regen script (just a JSON snapshot updated by hand), flag it — those need careful regeneration via running the audit in "snapshot" mode if supported, or via manual JSON regeneration.

### Item 2 — Regenerate twoTier baseline

`npx tsx tests/audit/twoTierBaseline.snapshot.ts` — overwrites `tests/audit/twoTierBaseline.snapshot.json` with current expected output across all 24 cohort fixtures.

### Item 3 — Regenerate the remaining 16 baselines

Per the inventory in Item 1, run each baseline's regen script. Each regen script should:
- Read cohort fixtures from `tests/fixtures/cohort/`
- Run `buildInnerConstitution(answers, [], demographics)` + `renderMirrorAsMarkdown(...)` against each
- Hash the output + length per fixture
- Write the snapshot JSON

If a baseline doesn't have a regen script and the audit code computes its own expected hashes in-line (some audits embed hashes as constants), update those constants by running the audit in a "report current hash" mode (modify the audit to log its computed hash, run it, capture the hash, restore the audit code with the new hash). This is mechanical but tedious.

### Item 4 — Verify the audit sweep

Run all `tests/audit/*.audit.ts` audits. Confirm:
- 17 previously-failing audits now pass
- `aimMigrationFinish.audit.ts` still fails (sandbox EPERM — environmental, not introduced)
- `proseRegister.audit.ts` still fails (24h cache freshness — pre-existing; will pass on user's Mac if caches are recent, but we're not regenerating those LLM cache files here)
- All Wave 1 audits still pass (`audit:llm-rewrites-persisted-on-session`, `audit:stale-shape-detector`, `audit:calibration-phase-1`)
- All today's audits still pass (CC-084 `audit:risk-form-5th-band`, CC-085 `audit:grip-pattern-render-for-mixed-buckets`, CC-086 `audit:shape-aware-prose-routing-v2`, CC-087 `audit:admin-demographic-edit`)

Expected post-CC sweep state: **62 passing, 2 failing (env-only)** out of 64 total audits.

## Do NOT

- **Do NOT modify any engine code.** This CC is baseline regeneration only. `lib/identityEngine.ts`, `lib/renderMirror.ts`, `lib/handsCard.ts`, `lib/gripPattern.ts`, `lib/riskForm.ts`, `lib/movementLimiter.ts`, `lib/synthesis1Finish.ts`, `lib/saveSession.ts` — all OFF-LIMITS.
- **Do NOT modify any audit logic** beyond updating the in-line baseline hash constants (Item 3 fallback). The assertions stay; only the expected-hash strings update.
- **Do NOT touch any Wave 1 persistence file.**
- **Do NOT regenerate LLM rewrite caches** (`lib/cache/launch-polish-v3-rewrites.json`, `lib/cache/synthesis3-paragraphs.json`, `lib/cache/grip-paragraphs.json`, etc.). Those are out of scope; the `proseRegister.audit.ts` 24h-window failure stays as-is.
- **Do NOT call any LLM.** No `*LlmServer.ts` imports. No `@anthropic-ai/sdk`.
- **Do NOT commit or push.** Leave the branch dirty for review.
- **Do NOT regenerate cohort fixtures.** Fixtures stay; baselines re-derived from current engine output against unchanged fixtures.

## Allowed to Modify

- `tests/audit/twoTierBaseline.snapshot.json`
- `tests/audit/*.baseline.json` or `*.snapshot.json` files for the 16 cascading audits (per Item 1 inventory)
- Audit `*.audit.ts` files ONLY for in-line baseline hash constants that need updating (per Item 3 fallback). Document each such edit inline.
- Move prompt to `prompts/completed/` at end

## Out of Scope

- Engine code (anything in `lib/identityEngine.ts`, `lib/renderMirror.ts`, etc.)
- LLM rewrite cache regeneration
- Audit assertion logic changes (only constants)
- New audit additions
- Cohort fixture changes

## Acceptance Criteria

1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. Cohort sweep: 62 passing, 2 failing (the 2 env-only failures)
4. The 17 previously-cascading audits now pass
5. CC-084 / CC-085 / CC-086 / CC-087 audits still pass
6. Wave 1 audits still pass
7. Zero modifications to any engine file
8. Zero LLM rewrite cache modifications
9. Zero commits

## Report Back

- The per-audit inventory from Item 1 (which audits had regen scripts, which needed in-line constant updates, which had to be handled some other way)
- Cohort sweep before/after counts (was X/64, now Y/64)
- Any audit that didn't drop into expected pass-state — flag for further investigation
- Any baseline whose regen script was missing — flag for future-CC creation of the regen script
- Confirmation no engine files modified, no LLM cache modified, no commits

## Notes for executor

- Estimated time: 30–45 min, mostly running each regen script + spot-checking.
- Cost: $0.
- The most error-prone subtask is the in-line constant updates (Item 3 fallback). Most baselines should have regen scripts; if you find one that doesn't, prefer creating a regen script over editing constants in the audit file (cleaner long-term).
- This is the calmest CC of tomorrow's batch. Use it as a warm-up before the others.
