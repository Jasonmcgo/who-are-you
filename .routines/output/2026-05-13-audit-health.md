# Audit Health — 2026-05-13 21:11 UTC

**Summary:** Mostly clean — 45/48 audits passing; 2 real failures plus 1 sandbox-only failure. tsc has 2 errors in `.next/types/` duplicate-named files. Lint clean.

## Failures

**1. `proseRegister.audit.ts` — cache-freshness assertion**
- `[FAIL] prose-register-cache-regenerated — synth fresh=false, grip fresh=false (window=24h)`
- Cohort LLM cache hasn't been regenerated within the 24h window. Other 7 assertions in this audit pass.

**2. `twoTierRenderSurfaceCleanup.audit.ts` — clinician-mode byte drift**
- `[FAIL] clinician-mode-byte-identical-to-baseline` — 5 ocean fixtures show hash mismatch despite identical byte length:
  - `01-architectural-openness.json`: 911ea33f92a4 vs ba960381674c (len 42405)
  - `02-high-conscientiousness.json`: 82a5cc64bd7b vs 4c65db97fd01 (len 41799)
  - `03-low-extraversion-high-soul.json`: f4d034f45e23 vs e2acca578287 (len 42463)
  - `04-high-agreeableness-loyalty.json`: f7c83b7b5d7e vs ae09d6b54de7 (len 42314)
  - `05-low-emotional-reactivity-proxy.json`: 17e8834dbcaa vs 07693970a647 (len 42060)
- Other 9 assertions in this audit pass (incl. user-mode cohort 24/24 clean).

**3. `aimMigrationFinish.audit.ts` — sandbox-only EPERM**
- `EPERM unlink tsconfig.tsbuildinfo` — audit attempts to delete `.tsbuildinfo`; the sandbox mount denies unlink. Not a project regression; would pass on the user's filesystem. Truncated the file to 0 bytes pre-run for tsc; the audit's own unlink still fails because of the mount.

## tsc

Two errors, both in `.next/types/` duplicate-name files (likely macOS `" 2.ts"` Finder duplicates):
- `cache-life.d 2.ts(3,1)` TS6200 — conflicting identifiers (unstable_cache, revalidateTag, etc.)
- `routes.d 2.ts(69,8)` TS2300 — Duplicate identifier 'LayoutProps'

Fix: remove the two `" 2.ts"` duplicates under `.next/types/`. No source-tree errors.

## Lint

Clean (eslint exit 0, no output).

## Audit tally

48 audit files run · 45 pass · 3 fail (1 sandbox-only).
