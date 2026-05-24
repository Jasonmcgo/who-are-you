# CC-139 — Prod Migration Reconciliation Runbook

**Status: Draft — owner sign-off required before any prod step is executed.**

CC-139 reconciled the drizzle migration meta + dev DB. Prod is presumed to be
in the same drift state dev was in (some early migrations applied out-of-band,
journal/`__drizzle_migrations` table doesn't reflect reality). This runbook
lays out the **exact** steps to bring prod into the post-CC-139 state without
running anything destructive.

**Do NOT execute any step until the owner has reviewed the introspection
output and approved the backfill plan in writing.**

## What changed in CC-139 (already on dev)

1. `db/migrations/meta/0006_snapshot.json` was authored (was missing — the
   0006 hand-authored migration had no drizzle snapshot, so the chain skipped
   it).
2. `db/migrations/meta/0007_snapshot.json` had its `prevId` re-linked to the
   new 0006 snapshot's id (was pointing at 0005, skipping 0006).
3. No SQL files were touched. No schema change.
4. After these changes:
   - `drizzle-kit generate` reports "No schema changes, nothing to migrate"
     → meta now matches `db/schema.ts`.
   - A fresh DB + full `db:migrate` chain top-to-bottom builds the current
     schema cleanly (verified on a throwaway DB).
   - Dev DB was reconciled by inserting records into
     `drizzle.__drizzle_migrations` for migrations 0002-0005 (already-applied
     out-of-band but unrecorded), then running `db:migrate` to apply 0006 +
     0007 cleanly. A second `db:migrate` run is a no-op.

## Prod state hypothesis (to verify in Step 1)

Same drift class as dev was in:

- `__drizzle_migrations` table records migrations 0000 + 0001 only
- Schema has tables from 0002-0005 (sessions / demographics with
  `contact_email` / attachments / ghost_mapping_audit) applied out-of-band
- Tables from 0006 (`follow_up_links`) and 0007 (`answer_history`) are
  ABSENT (no record + no schema)

**This must be confirmed by introspection before any backfill runs.** If prod
has different drift (e.g., `follow_up_links` already exists, or some
migrations were applied that dev didn't have), the plan below changes.

## Step 1 — Introspect prod (READ-ONLY)

Connect as a read-only user (or treat the standard connection as read-only —
no DDL/DML). Capture:

```sql
-- 1a. What tables exist?
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 1b. What does drizzle's migration tracking say is applied?
SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id;

-- 1c. Demographics.contact_email present?
SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'demographics' AND column_name = 'contact_email';

-- 1d. follow_up_links + answer_history present?
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('follow_up_links', 'answer_history');

-- 1e. Row counts on the user-data tables (sanity — DO NOT proceed if any of
--     these are unexpectedly low, that means we're connected to the wrong DB):
SELECT 'sessions' AS t, count(*) FROM sessions
UNION ALL SELECT 'demographics', count(*) FROM demographics
UNION ALL SELECT 'attachments', count(*) FROM attachments;
```

Save the output. Owner reviews before Step 2.

## Step 2 — Decision matrix based on Step 1 output

| Prod state | Action in Step 3 |
|---|---|
| `__drizzle_migrations` records 0000-0007 + all 6 tables present | **No-op. Prod is already in sync.** Verify with `db:migrate` (should be silent). Done. |
| `__drizzle_migrations` records 0000-0007 BUT some tables missing | **STOP. Don't auto-correct.** The records don't match reality in the other direction; needs owner decision (could be intentional / a different branch ran). |
| `__drizzle_migrations` records 0000-0001 only + 4 tables present (sessions, demographics with contact_email, attachments, ghost_mapping_audit) + no follow_up_links + no answer_history | **Same drift as dev — Step 3 applies as-written.** |
| Any other state | **STOP and report to owner.** |

## Step 3 — Backfill migration records (if drift matches dev's)

Apply this DDL/DML as a transaction. **It is non-destructive: it inserts rows
into `__drizzle_migrations` only. No table is created or modified.** The
schema actually exists from the out-of-band application; we're just telling
drizzle we know about it.

```sql
BEGIN;

-- Backfill migration records for already-applied 0002-0005. Hashes pulled
-- from a known-clean fresh-DB run of `drizzle-kit migrate` against the
-- current chain (validated in CC-139).
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
  ('7053e540914e36fee18a5589e999d675c7310824eb9d4f48eb537e965c51040a', 1778707877793),
  ('974897b91b9a301d89f25833d2e4822cf8facdc9c55dc999d0931981adef318e', 1778934701791),
  ('da4835de6afc762994df1a922eb63c9ce489a3c3f3cd90abd1ed8863f9c009ed', 1778942801655),
  ('e0086896768d16e417850c4da93e7c24dcca5ad1e06356823490cfe5d3bd025c', 1778950085170)
ON CONFLICT DO NOTHING;

-- Sanity check inside the transaction:
SELECT id, substring(hash, 1, 16) AS hash_prefix FROM drizzle.__drizzle_migrations ORDER BY id;
-- Expect 6 rows: 0000, 0001 (pre-existing) + the 4 new ones for 0002-0005.

COMMIT;
```

## Step 4 — Apply 0006 + 0007 via standard `db:migrate`

Run the normal deploy `db:migrate` step (or `npm run db:migrate` manually
with the prod `DATABASE_URL`). This applies **only** the genuinely missing
migrations:

- `0006_follow_up_links.sql` → creates `follow_up_links` table + FK
- `0007_chief_gateway.sql` → creates `answer_history` table + FK

Both are CREATE TABLE statements — additive, non-destructive, no data
migration. Drizzle detects them as the only unrecorded migrations (since
Step 3 backfilled the others) and runs only those two.

```bash
DATABASE_URL=<prod> npm run db:migrate
```

Expected output: `migrations applied successfully!` (the drizzle-schema
"already exists, skipping" NOTICE lines are normal).

## Step 5 — Verify

```sql
-- Records — should be 8 (0000-0007).
SELECT count(*) FROM drizzle.__drizzle_migrations;

-- Tables — should be 6.
SELECT count(*) FROM pg_tables WHERE schemaname = 'public'
  AND tablename IN (
    'sessions', 'demographics', 'attachments',
    'ghost_mapping_audit', 'follow_up_links', 'answer_history'
  );
```

Then re-run `db:migrate` once more — should be a clean no-op (only the
drizzle-schema-init NOTICE lines, no SQL applied).

## Rollback

The CC-139 changes are non-destructive and inherently safe:

- Step 3 only inserts rows into `drizzle.__drizzle_migrations`. To roll back:
  `DELETE FROM drizzle.__drizzle_migrations WHERE id BETWEEN 3 AND 6;`
- Step 4 creates two new tables. To roll back: `DROP TABLE follow_up_links;
  DROP TABLE answer_history;` then `DELETE FROM
  drizzle.__drizzle_migrations WHERE id BETWEEN 7 AND 8;`

**Do not roll back without owner sign-off** — `follow_up_links` is the CC-127
gap-fill link store and `answer_history` is the CC-136 reset archive; both
hold user-facing data once the deploy goes live.

## What this runbook does NOT do

- Does NOT regenerate or touch any meta files (meta is already reconciled in
  the repo as of CC-139).
- Does NOT change `db/schema.ts` or any application code.
- Does NOT touch user data in `sessions` / `demographics` / `attachments` /
  `ghost_mapping_audit`.
- Does NOT alter the structure of any already-existing table.

## Flagged ambiguities

1. **Prod's exact state is presumed but unverified.** Step 1 must confirm
   before Step 3 proceeds. If prod diverges from the dev-equivalent state,
   stop and re-plan with the owner.
2. **Migration hashes are computed from the SQL file contents.** If anyone
   ever edits 0000-0005 in-place, the backfilled records will mismatch what
   drizzle re-computes on next migrate. The hashes baked into Step 3 are
   pulled from a 2026-05-23 fresh-DB run of the current chain — verify they
   match by running `psql <fresh-throwaway-db> -c "SELECT id, hash FROM
   drizzle.__drizzle_migrations ORDER BY id"` BEFORE running Step 3 against
   prod.
3. **The 0007 SQL was hand-trimmed in CC-136** (removing a duplicate
   `follow_up_links` CREATE that drizzle had auto-emitted because 0006's
   snapshot was missing). The trim is correct against the now-reconciled
   meta. If a future regeneration ever recovers the dropped statements,
   verify against this runbook's chain.
