# CC-151 — Postgres backup to a local drive + restore runbook + recurring schedule

> Owner goal: a local, portable backup of the Vercel Postgres database "just in
> case something happens to the DB, or Vercel, or both" — restorable to a
> *different* server. Owner chose **both** an on-demand script and a recurring
> scheduled backup.

## Important framing

- The portable artifact is a **logical `pg_dump`** (custom format), which IS
  restorable to any Postgres on any host. A "physical image" wouldn't port across
  managed providers — a dump is the right thing.
- This runs on **Jason's Mac** (it needs to reach the prod DB and write to his
  local drive). The executor (Claude Code on the Mac) CAN reach the DB and SHOULD
  actually run the script once to verify a real dump is produced.
- The dump contains **real user PII** (names, emails, answers). Treat it as
  sensitive: never commit it, never print the connection string, keep backups out
  of git.

## Connection string

The app reads `DATABASE_URL` from `.env.local` (`db/index.ts:24`). The script
must source it the same way (read `.env.local`, don't hardcode, don't echo it).
If `DATABASE_URL` is a **pooled** Vercel/Neon string (host contains `-pooler`),
`pg_dump` should use a **direct/non-pooled** connection instead — prefer
`DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` if present in `.env.local`,
else strip `-pooler` from the host. Flag which was used.

## Execution mode

Single pass. Build the script + runbook + schedule, then RUN the script once
against the real DB to prove it works (this is the acceptance gate). Flag any
version/permission issue rather than guessing.

## Tasks

**T1 — backup script** `scripts/backup-db.sh`:
- Source `DATABASE_URL` (or the non-pooled variant) from `.env.local`; fail
  loudly with a clear message if absent. Never echo the secret.
- `pg_dump` in **custom format** with portability flags:
  `pg_dump "$CONN" -Fc --no-owner --no-privileges -f "$OUT"` where `$OUT` is a
  timestamped path like `~/who-are-you-backups/who-are-you_YYYYMMDD-HHMMSS.dump`
  (make the dir; let the backup root be overridable via `$BACKUP_DIR`).
- **Integrity check**: after dumping, run `pg_restore -l "$OUT" >/dev/null` to
  confirm the archive is readable; fail if not. Print the dump path + size + table
  count on success.
- **Retention**: keep the last N dumps (default 14), delete older ones.
- Be idempotent and safe to run repeatedly; `set -euo pipefail`.

**T2 — restore runbook** `docs/runbooks/db-restore.md`:
- How to restore the custom-format dump to ANY Postgres:
  `createdb <target>` then
  `pg_restore --no-owner --no-privileges -d <target_conn> <dumpfile>`.
- Note the **migration-state caveat**: restoring the full dump brings schema +
  data + the `drizzle.__drizzle_migrations` table as-is — you do NOT replay
  migrations on a restored DB. Cross-reference the CC-139 drift runbook so a
  restore-then-deploy doesn't re-trigger the "already exists" failure.
- `pg_dump`/`pg_restore` **version note**: client version must be ≥ the server's
  (Neon is PG15/16); document `brew install postgresql@16` if the local client is
  older. Flag the observed versions.
- A "verify the restore" step (row counts on `sessions` / `demographics`).

**T3 — recurring schedule (macOS launchd):**
- A `launchd` plist (e.g. `com.who-are-you.db-backup.plist`) that runs
  `scripts/backup-db.sh` on a weekly cadence, writing to the local backup dir,
  with stdout/stderr to a log file. Include load/unload instructions
  (`launchctl load ~/Library/LaunchAgents/...`) in the runbook. (cron is an
  acceptable fallback — document whichever you wire.)
- The schedule must source the same env; document how it gets `DATABASE_URL`
  (the plist can't read `.env.local` implicitly — have the script load it by
  absolute path, or pass it via the plist environment, without committing the
  secret).

**T4 — PII / git hygiene:**
- Add the backup dir (and `*.dump`) to `.gitignore` so dumps never get committed.
- A one-line note in the runbook that dumps contain PII and where they live.

## Allowed to modify / create

- `scripts/backup-db.sh` (new)
- `docs/runbooks/db-restore.md` (new)
- the launchd plist (new — place in repo under `ops/` or `scripts/`, with
  install instructions; the live copy goes in `~/Library/LaunchAgents/`)
- `.gitignore` (add backup artifacts)

Do NOT commit any `.dump` file, the connection string, or `.env.local`.

## Acceptance criteria

1. `bash scripts/backup-db.sh` run against the real DB produces a readable
   custom-format dump (`pg_restore -l` succeeds) and prints path/size/table-count.
2. The restore runbook is complete enough to restore to a fresh local Postgres,
   including the migration-state caveat and version note.
3. The schedule artifact exists with documented load instructions and a working
   env path.
4. `.gitignore` excludes the dumps; `git status` after a backup shows no dump or
   secret staged.

## Flag in report

- Whether a pooled vs non-pooled connection was used, and the observed
  `pg_dump`/server versions.
- The exact backup path + cadence wired, and the launchd load command.
- Confirm no secret or dump is tracked by git.
