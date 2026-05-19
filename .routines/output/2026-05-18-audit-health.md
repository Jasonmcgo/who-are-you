# Audit Health — 2026-05-18 21:11 UTC

**Status:** 66/77 audits passing. tsc cold-clean. Lint clean (0 errors, 1 pre-existing warning: unused `renderDriveDistributionDonut` in `app/components/PathExpanded.tsx`).

## Failed audits (11)

### Sandbox-environment artifacts (2) — not real regressions

- `aimMigrationFinish` — `EPERM: operation not permitted, unlink '.../tsconfig.tsbuildinfo'`. Sandbox mount blocks unlink; cache-clear step in the audit cannot execute here. Likely passes on macOS.
- `demographicsSaveWiring` — `connect ECONNREFUSED 127.0.0.1:5432`. Audit needs a running Postgres; not available in the sandbox.

### Cohort cache drift — Path section (5)

Same root signature across these: 3 cache-miss logs for `prose-rewrites/path` on cohort run (archetypes: `jasonType`, `cindyType`, `unmappedType`). Path-section fingerprints have drifted from the cached entries.

- `cacheMissLoudfail` — `cohort-runs-quiet`: 3 miss warnings during cohort run.
- `liveSessionLlmWiring` — `cohort-renders-stay-silent`: 3 cache-miss logs during cohort render.
- `productionRenderPathWiring` — `cohort-runs-zero-on-demand-resolution`: 3 miss logs during sync cohort run.
- `reactOnScreenLlmRender` — `cohort-fixtures-return-cached-no-on-demand`: prose composer fired 3× during cohort run.
- `crisisPathProse` — `crisis-prose-trajectory-class-unaffected`: cached paragraph lookup failed (hash drifted) for `02-compartmentalized.json` and `12-productive-ne-default-pair.json`.

### Other real failures (4)

- `twoTierRenderSurfaceCleanup` — `clinician-mode-byte-identical-to-baseline`: 5 OCEAN fixtures hash-mismatch in clinician mode (ocean/01–05; lengths match, content drifted). Baselines need refresh or upstream change shouldn't have shipped.
- `synthesis1Finish` — `synth-1f-path-master-synthesis-references-quadrant` (and `cleanup-1f-path-risk-form-integration-phrase`): `25-ti-coherence-prober.json` missing the Risk Form integration phrase.
- `synthesis3` — `synth-3-fallback-mechanical-renders`: `25-ti-coherence-prober.json` mechanical fallback didn't render Compass-1 ("Knowledge") or Love-Map ("the Companion").
- `voiceRubricExpansion` — `voice-rubric-cohort-shift-on-ti-fixture`: `ocean/25` has no cached paragraph.

## Pattern

The Path-section cohort drift cluster and the `ti-coherence-prober`/`ocean-25` gaps look like a missed cache regen pass — consistent with the synthesis3 → proseRewrites ordering canon. Worth running the cohort cache regen chain end-to-end before next bundle audit gate.
