#!/usr/bin/env bash
# CC-151 — Postgres backup script.
#
# Dumps the project DB to a timestamped, portable, custom-format archive on
# the local drive. The dump is restorable to ANY Postgres ≥ the server's major
# version (see docs/runbooks/db-restore.md).
#
# Usage:
#   bash scripts/backup-db.sh
#   BACKUP_DIR=/Volumes/External/db-backups bash scripts/backup-db.sh
#   RETENTION=30 bash scripts/backup-db.sh
#
# Env (sourced from .env.local; CLI env overrides):
#   DATABASE_URL                 — primary connection string
#   DATABASE_URL_UNPOOLED        — preferred when DATABASE_URL points at a
#   POSTGRES_URL_NON_POOLING     — Vercel/Neon pooler (pg_dump needs a
#                                  direct connection)
#
# Outputs:
#   $BACKUP_DIR/who-are-you_YYYYMMDD-HHMMSS.dump   (custom-format archive)
#
# Retention: deletes archives older than the N-th newest (default 14).
#
# The dump contains PII. Treat as sensitive; never commit; the backup dir is
# in .gitignore. Never echo the connection string.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${REPO_DIR}/.env.local"
BACKUP_DIR="${BACKUP_DIR:-${HOME}/who-are-you-backups}"
RETENTION="${RETENTION:-14}"

# ── Load .env.local without echoing secrets ─────────────────────────────
if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "${ENV_FILE}"
  set +a
fi

# Prefer a non-pooled connection: pg_dump's long-running session is rejected
# by Vercel/Neon poolers ("connection terminated unexpectedly"). Use the
# explicit unpooled var if present; otherwise strip "-pooler" from the host.
CONN=""
if [[ -n "${DATABASE_URL_UNPOOLED:-}" ]]; then
  CONN="${DATABASE_URL_UNPOOLED}"
  CONN_KIND="DATABASE_URL_UNPOOLED"
elif [[ -n "${POSTGRES_URL_NON_POOLING:-}" ]]; then
  CONN="${POSTGRES_URL_NON_POOLING}"
  CONN_KIND="POSTGRES_URL_NON_POOLING"
elif [[ -n "${DATABASE_URL:-}" ]]; then
  if [[ "${DATABASE_URL}" == *"-pooler"* ]]; then
    # Strip "-pooler" from the host portion. Works for both
    # `host-pooler.region.aws.neon.tech` and similar shapes.
    CONN="${DATABASE_URL//-pooler/}"
    CONN_KIND="DATABASE_URL (depooled)"
  else
    CONN="${DATABASE_URL}"
    CONN_KIND="DATABASE_URL"
  fi
else
  echo "ERROR: no DATABASE_URL / DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING in environment." >&2
  echo "       Looked in ${ENV_FILE}. Set one before running." >&2
  exit 1
fi

# ── Pre-flight ──────────────────────────────────────────────────────────
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump not on PATH. Install with: brew install postgresql@16" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/who-are-you_${STAMP}.dump"

echo "Backup: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  pg_dump: $(pg_dump --version | head -1)"
echo "  conn:    ${CONN_KIND}"
echo "  out:     ${OUT}"

# ── Dump ────────────────────────────────────────────────────────────────
# -Fc           custom format (compressed; restorable via pg_restore)
# --no-owner    omit ownership SQL so the dump restores cleanly under any role
# --no-privileges  omit GRANT/REVOKE for the same reason
pg_dump "${CONN}" -Fc --no-owner --no-privileges -f "${OUT}"

# ── Integrity check ─────────────────────────────────────────────────────
# `pg_restore -l` lists the archive's table of contents without restoring;
# any failure here means the dump is unreadable.
if ! pg_restore -l "${OUT}" >/dev/null 2>&1; then
  echo "ERROR: pg_restore could not read the archive at ${OUT} — backup is corrupt." >&2
  rm -f "${OUT}"
  exit 1
fi

# ── Report ──────────────────────────────────────────────────────────────
SIZE="$(du -h "${OUT}" | awk '{print $1}')"
# Count TABLE entries in the archive TOC (one line per table).
TABLES="$(pg_restore -l "${OUT}" | grep -c '^[0-9].* TABLE ' || true)"
echo "OK: ${OUT} (${SIZE}, ${TABLES} table(s))"

# ── Retention: keep the N newest dumps ──────────────────────────────────
# Find all archives in the backup dir, sort by mtime descending, drop the
# first N, delete the rest. macOS `find -mtime` is too coarse; this is
# count-based. Portable across macOS bash 3.2 (no `mapfile`).
KEEP="${RETENTION}"
TOTAL=$(ls -1t "${BACKUP_DIR}"/who-are-you_*.dump 2>/dev/null | wc -l | tr -d ' ')
if [ "${TOTAL}" -gt "${KEEP}" ]; then
  ls -1t "${BACKUP_DIR}"/who-are-you_*.dump 2>/dev/null | tail -n "+$((KEEP + 1))" | \
    while IFS= read -r f; do
      echo "  retention: removing $(basename "$f")"
      rm -f "$f"
    done
fi

echo "Done. ${TOTAL} dump(s) in ${BACKUP_DIR}; keeping newest ${KEEP}."
