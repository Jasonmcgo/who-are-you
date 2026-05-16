# Audit Health — 2026-05-15 21:10 UTC

**Status:** 3 audits failed (1 env-only), 53/56 passing. tsc cold-clean. lint 0 errors / 1 warning.

## tsc (cold, after clearing tsbuildinfo)
Clean. No errors.

## lint
0 errors, 1 warning:
- `app/components/PathExpanded.tsx:3` — `'renderDriveDistributionDonut' is defined but never used`

## Audits: 53 PASS / 3 FAIL / 0 timeout (56 total)

### FAIL — env-only (not a project regression)
**`aimMigrationFinish.audit.ts`** — `unlinkSync('tsconfig.tsbuildinfo')` returned `EPERM` from the scheduled-task sandbox mount. The audit clears the buildinfo file as its first step; the mounted filesystem disallows unlink. Same permission applied to the manual `rm -f` in step 1 of this run (worked around via `truncate -s 0`). Audit will pass when run in the normal dev environment.

### FAIL — real
**`proseRegister.audit.ts`** — assertion `prose-register-cache-regenerated` failed: `synth fresh=false, grip fresh=false (window=24h)`. Cohort prose-register cache is stale (>24h). KEEP-list coverage and render-layer assertions both passed.

**`twoTierRenderSurfaceCleanup.audit.ts`** — assertion `clinician-mode-byte-identical-to-baseline` failed on 5 OCEAN fixtures (same byte length, different content hash):
- `ocean/01-architectural-openness.json` — 911ea33f92a4 vs baseline ba960381674c
- `ocean/02-high-conscientiousness.json` — 82a5cc64bd7b vs 4c65db97fd01
- `ocean/03-low-extraversion-high-soul.json` — f4d034f45e23 vs e2acca578287
- `ocean/04-high-agreeableness-loyalty.json` — f7c83b7b5d7e vs ae09d6b54de7
- `ocean/05-low-emotional-reactivity-proxy.json` — 17e8834dbcaa vs 07693970a647

`appendix-dialog-strips-intj` and `user-mode-cohort-renders-clean` (24/24) both passed. Clinician-mode parity drifted on OCEAN fixtures only.

## Notes
- No code modified. No cohort cache regenerated.
- `tsconfig.tsbuildinfo` was truncated (not unlinked) before tsc; tsc still ran cold.
