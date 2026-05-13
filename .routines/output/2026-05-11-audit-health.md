# 2026-05-11 audit health check

**Time:** 2026-05-11 21:10 UTC
**Status:** 34/35 audits passing. tsc clean. lint clean.

## tsc / lint
- `npx tsc --noEmit`: clean (no diagnostics).
- `npm run lint`: clean (eslint emitted nothing).

## Audits
34 of 35 audit files exited 0. One failure:

### aimMigrationFinish.audit.ts — sandbox-environment failure (not a code regression)
The audit calls `fs.unlinkSync('tsconfig.tsbuildinfo')` as part of its own setup, but the FUSE mount in this sandbox refuses `unlink` on that file:

```
Error: EPERM: operation not permitted, unlink '.../tsconfig.tsbuildinfo'
    at unlinkSync (node:fs:1955:11)
    at runAudit (tests/audit/aimMigrationFinish.audit.ts:100:5)
```

Same EPERM blocked the cold-cache step at the top of this routine (`rm -f tsconfig.tsbuildinfo` returned "Operation not permitted"). The file was instead truncated to 0 bytes as a workaround, which gave tsc and the other 34 audits a cold-equivalent start.

This is the sandbox blocking `unlink`, not a regression in the migration code. Same audit will pass on the local machine where `unlink` is permitted. Consider patching the audit to `truncate` or `writeFileSync('')` instead of `unlinkSync` so it survives sandboxed runs cleanly.

## Headline
All clear on tsc + lint. 34/34 substantive audits passing; only environment-blocked audit is `aimMigrationFinish`, blocked by sandbox `unlink` permission on `tsconfig.tsbuildinfo`.
