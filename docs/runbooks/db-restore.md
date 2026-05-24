# CC-151 — Database backup + restore runbook

Portable, logical backup of the project Postgres database. The dumps are
restorable to **any Postgres** at or above the server major version —
explicitly designed so the data survives Vercel disappearing, the managed
DB disappearing, or both.

## Provenance + sensitivity

- The dumps contain **real user PII**: names, emails, raw answers, follow-up
  responses, demographic fields. Treat the backup directory the way you'd
  treat a credentials file.
- Default backup location: `~/who-are-you-backups/` (override via
  `BACKUP_DIR=…`). The directory and `*.dump` are in `.gitignore`; never
  copy a dump into the repo.
- The script never echoes the connection string. The plist agent never
  needs the secret — the script loads it from `.env.local` at run time.

## How to take a backup

```sh
bash scripts/backup-db.sh
```

Optional overrides:

```sh
BACKUP_DIR=/Volumes/External/db-backups bash scripts/backup-db.sh
RETENTION=30 bash scripts/backup-db.sh   # keep last 30 instead of default 14
```

Output is a custom-format archive at
`~/who-are-you-backups/who-are-you_YYYYMMDD-HHMMSS.dump`. The script runs an
integrity check (`pg_restore -l`) before exiting; a non-zero exit means
either the dump is unreadable or the connection failed.

### Connection variants

The script prefers, in order:

1. `DATABASE_URL_UNPOOLED` — explicit Neon/Vercel direct-connection var
2. `POSTGRES_URL_NON_POOLING` — Vercel's name for the same thing
3. `DATABASE_URL` — falling back; if it contains `-pooler` in the host, the
   script depools it (`pg_dump` can't run through a pooler — long-running
   session gets terminated mid-stream)

The CONN_KIND it picked is printed in the script's first three lines so
diagnostics are visible without exposing the secret.

## Verified versions (observed 2026-05-24)

- Local client: `pg_dump (PostgreSQL) 16.13 (Homebrew)`
- Local server (when DATABASE_URL points to localhost): PG 16

**Version rule:** `pg_dump` / `pg_restore` client major must be **≥** the
server major. If you upgrade the prod DB to PG 17 before upgrading the
laptop's client, the dump will fail with `aborting because of server
version mismatch`. Fix:

```sh
brew install postgresql@17
brew link --force postgresql@17
# verify
pg_dump --version
```

## How to restore — to a fresh local Postgres

```sh
# 1. Create the target DB
createdb who_are_you_restore

# 2. Restore the archive (no GRANT/REVOKE because the dump was taken with
#    --no-owner --no-privileges — restores cleanly under any role).
pg_restore --no-owner --no-privileges \
  -d "postgresql://localhost:5432/who_are_you_restore" \
  ~/who-are-you-backups/who-are-you_YYYYMMDD-HHMMSS.dump
```

## How to restore — to a new managed Postgres (different provider)

Same `pg_restore`, different target:

```sh
pg_restore --no-owner --no-privileges \
  -d "postgresql://user:pw@new-host.example.com:5432/dbname?sslmode=require" \
  ~/who-are-you-backups/who-are-you_YYYYMMDD-HHMMSS.dump
```

The new host needs to be Postgres at the same major version as the dump
(use `pg_restore -l <dump> | head` to see the dumper's version; you can
restore *up* a major version, you cannot restore *down*).

## Migration-state caveat (critical)

The custom-format dump carries **schema + data + the
`drizzle.__drizzle_migrations` table** verbatim. This means **a restored DB
is already at the migration state it was at when the dump was taken**.

- **Do NOT replay migrations** against a restored DB. `drizzle-kit migrate`
  reading the restored `__drizzle_migrations` will conclude "all
  migrations already applied" — that's the correct outcome.
- If you restore an **old** dump (taken before a more recent migration was
  authored) and then deploy a build that contains the newer migration, the
  newer migration WILL run against the restored DB. That's fine — that's
  exactly the path forward.
- If you restore a dump from production and immediately deploy code that
  pre-dates the dump, see [cc-139-prod-migration-reconcile.md](./cc-139-prod-migration-reconcile.md)
  for the "already exists" reconcile pattern.

## Verify the restore

```sh
psql "postgresql://localhost:5432/who_are_you_restore" -c "
  SELECT
    (SELECT count(*) FROM sessions) AS sessions,
    (SELECT count(*) FROM demographics) AS demographics,
    (SELECT count(*) FROM answers) AS answers;
"
```

Compare against `psql … -c 'SELECT ...'` on the source DB at the same point
in time; non-trivial divergence means the restore didn't land cleanly.

## Recurring schedule (macOS launchd)

A `launchd` agent runs the backup weekly on Sundays at 03:00 local time.

### Install the agent

```sh
# Copy (or symlink) the plist into the user's LaunchAgents directory.
cp ops/com.who-are-you.db-backup.plist ~/Library/LaunchAgents/

# Load it. `bootstrap` is the modern launchctl verb; `load` works too on
# older macOS.
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.who-are-you.db-backup.plist

# Verify it's listed.
launchctl list | grep who-are-you
```

### Force a one-off run (without waiting until Sunday)

```sh
launchctl kickstart gui/$(id -u)/com.who-are-you.db-backup
```

### Unload / pause

```sh
launchctl bootout gui/$(id -u)/com.who-are-you.db-backup
# or, older macOS:
launchctl unload ~/Library/LaunchAgents/com.who-are-you.db-backup.plist
```

### Logs

The plist redirects stdout/stderr to
`~/who-are-you-backups/backup.log` and `backup.err.log`. Tail those after
the agent fires:

```sh
tail -50 ~/who-are-you-backups/backup.log
tail -50 ~/who-are-you-backups/backup.err.log
```

### How the agent loads the DB connection

The plist invokes `bash scripts/backup-db.sh` with the repo's working
directory; the script then `source`s `.env.local` by absolute path. The
plist itself **never embeds the secret** — if `.env.local` rotates, the
next scheduled run picks up the new value automatically.

If the prod connection string isn't already in `.env.local`, add the
direct-connection variant:

```
DATABASE_URL_UNPOOLED=postgresql://...@host.region.aws.neon.tech:5432/dbname?sslmode=require
```

Restart the agent (`bootout` then `bootstrap`) only if you change the plist
itself; an `.env.local` edit takes effect on the next scheduled run.

## Retention

The script keeps the **N newest dumps** in `${BACKUP_DIR}` (default 14;
override via `RETENTION=…`). Older dumps are deleted at the end of each
run. This is count-based — date-based cleanup with macOS `find -mtime` is
too coarse for sub-day cadences and was avoided.
