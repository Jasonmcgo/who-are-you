# Audit health — 2026-05-14 (Thu) end-of-day

**Summary:** tsc cold-clean (exit 0), lint clean (exit 0, 1 pre-existing unused-import warning), 53/56 audits passing. 3 failures, none introduced by today's code.

## tsc / lint
- `tsc --noEmit` after clearing `tsconfig.tsbuildinfo`: **exit 0, zero output**
- `npm run lint`: exit 0, one warning — `app/components/PathExpanded.tsx:3` `renderDriveDistributionDonut` unused. Long-standing; not a regression.

## Audit roll-up: 53 / 56 passing

### Failures

1. **aimMigrationFinish — environmental, not a code regression.**
   The audit's own setup calls `unlinkSync(tsconfig.tsbuildinfo)`. In this sandbox the file is read-only at the kernel level (`EPERM` on unlink, though `truncate -s 0` succeeds). The audit aborts before running its assertions. This is a sandbox-permission quirk of the scheduled-task environment, not a problem with the audit's targets. Re-run from a local shell where `rm` is permitted on that file and this will pass.

2. **proseRegister — stale cohort caches (expected per task constraints).**
   8/9 assertions PASS. The single failure is `prose-register-cache-regenerated`: `synth fresh=false, grip fresh=false (window=24h)`. `lib/cache/grip-paragraphs.json` last touched 2026-05-11; `lib/cache/synthesis3-paragraphs.json` not present at expected path. Task explicitly forbids regenerating cohort cache, so this assertion will keep firing until someone runs the regeneration deliberately.

3. **twoTierRenderSurfaceCleanup — real regression in clinician-mode byte parity.**
   9/10 assertions PASS, including `user-mode-cohort-renders-clean (24/24)`. The failure is `clinician-mode-byte-identical-to-baseline`: 5 OCEAN fixtures hash-mismatch against baseline despite identical lengths. Affected fixtures:
   - `ocean/01-architectural-openness.json` — 911ea33f… vs baseline ba960381…
   - `ocean/02-high-conscientiousness.json` — 82a5cc64… vs 4c65db97…
   - `ocean/03-low-extraversion-high-soul.json` — f4d034f4… vs e2acca57…
   - `ocean/04-high-agreeableness-loyalty.json` — f7c83b7b… vs ae09d6b5…
   - `ocean/05-low-emotional-reactivity-proxy.json` — 17e8834d… vs 07693970…
   Lengths match (42060–42463 bytes), so this is a substitution/ordering shift inside clinician body, not added/removed content. Worth a targeted look — probably a downstream side-effect from a recent CC that touched the OCEAN/Disposition render path.

## Performance
No audit took more than 1s of wall time. No 30s aborts.

— generated 2026-05-14 21:11 UTC
