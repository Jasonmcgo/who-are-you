# Audit Health — 2026-05-12 (Tue 21:44 UTC)

**tsc:** cold-clean (exit 0) — note: tsbuildinfo could not be deleted in sandbox (EPERM); truncated to 0 bytes before run, which forces the same cold rebuild.
**lint:** clean (exit 0).
**audits:** 35 / 38 passing.

## Failures

**1. aimMigrationFinish — environmental, not a product regression.**
Audit calls `unlinkSync` on `tsconfig.tsbuildinfo` directly and the sandbox returns `EPERM`. Same root cause as the cache-clear step above. Audit logic never ran.
```
Error: EPERM: operation not permitted, unlink '.../tsconfig.tsbuildinfo'
  at tests/audit/aimMigrationFinish.audit.ts:100:5
```

**2. proseRegister — cache staleness, single assertion.**
```
[FAIL] prose-register-cache-regenerated — synth fresh=false, grip fresh=false (window=24h)
```
synth3 cache (101 entries) and grip cache (64 entries) are both > 24 h old. All eight content assertions pass (banned-phrase absence clean across 165 cached paragraphs, bare-God scan clean, KEEP-list coverage 14/19). Routine cohort cache refresh fixes this; per task brief, not regenerating cache.

**3. twoTierRenderSurfaceCleanup — clinician-mode byte drift on 5 OCEAN fixtures.**
```
[FAIL] clinician-mode-byte-identical-to-baseline
  ocean/01-architectural-openness.json:        911ea33f92a4 ≠ ba960381674c
  ocean/02-high-conscientiousness.json:        82a5cc64bd7b ≠ 4c65db97fd01
  ocean/03-low-extraversion-high-soul.json:    f4d034f45e23 ≠ e2acca578287
  ocean/04-high-agreeableness-loyalty.json:    f7c83b7b5d7e ≠ ae09d6b54de7
  ocean/05-low-emotional-reactivity-proxy.json: 17e8834dbcaa ≠ 07693970a647
```
All five files: lengths match (42405/41799/42463/42314/42060 bytes byte-for-byte against baseline) but hashes diverge — pure content drift, not length drift. User-mode cohort renders clean (24/24); other 9 clinician assertions pass. New since previous green run; worth tracing.

## Summary
tsc green, lint green, 35/38 audits green. One environmental sandbox failure (aimMigrationFinish), one cache-staleness flag (proseRegister), one real signal (twoTierRenderSurfaceCleanup hash drift on the five OCEAN clinician fixtures).
