# CC-139 — Migration reconciliation (square drizzle journal/meta with actual schema before prod deploy)

## Execution mode

Proceed carefully; this touches migration metadata and DB state. Do NOT run
destructive statements against prod. Introspect first, reconcile second, verify
on a throwaway/fresh DB before proposing the prod step. Flag anything uncertain
rather than guessing.

## Launch Directive

`claude --dangerously-skip-permissions`, or `/permissions` → bypass.
**Infra hygiene, not a feature.** Blocks the next prod deploy (CC-136 ships an
`answer_history` migration that can't currently go through `db:migrate`).

## Context

CC-136 surfaced pre-existing migration drift:
- Hand-authored migration **0006** (`follow_up_links`) was never snapshotted
  into drizzle's `meta`, so `drizzle-kit` diffs from the wrong baseline (it
  re-emits `follow_up_links`).
- `npm run db:migrate` **fails on an older migration** — `column contact_email
  of relation demographics already exists` — i.e. some migrations were applied
  out-of-band and the journal doesn't reflect reality.
- CC-136's `answer_history` table (migration `0007`) was therefore applied by
  hand via `psql` on dev; it is **structurally correct but not deployable
  through the normal migrate flow.**

Net: the drizzle journal/`meta` no longer matches the real schema, so a Vercel
deploy that runs migrations against prod will fail.

## Tasks

1. **Capture ground truth.** Introspect the **actual** schema of dev (and prod,
   read-only) — table/column/constraint inventory. Identify every object that
   exists in the DB but is missing/mismatched in drizzle's journal/meta
   (`follow_up_links`, `demographics.contact_email`, `answer_history`, and any
   others the diff reveals).
2. **Reconcile the journal + meta to reality.** Bring `db/migrations/meta/*`
   (snapshots + `_journal.json`) into agreement with the actual schema so
   `drizzle-kit` diffs from a correct baseline and stops re-emitting
   already-applied objects. Prefer a **baseline/squash** of the out-of-band
   migrations over rewriting history destructively; document the choice.
3. **Make `db:migrate` a clean no-op on the synchronized state.** After
   reconciliation, running migrate against a DB that already matches should do
   nothing (no "already exists" errors).
4. **Verify replayability from scratch.** On a **fresh/throwaway** database,
   apply the full migration chain top-to-bottom and confirm it builds the
   current schema cleanly (incl. `answer_history`). This is the real test that
   the chain is sound.
5. **Prod plan (propose, do not execute).** Lay out the exact steps to bring
   prod in line — e.g. mark already-applied migrations as applied (journal
   baseline) and apply only the genuinely-missing ones (`answer_history` if not
   present) — so the next deploy's migrate step succeeds. Flag for owner
   sign-off before anyone runs it against prod.

## Read First (Required)

- `drizzle.config.ts`, `db/schema.ts`, `db/migrations/*.sql`,
  `db/migrations/meta/_journal.json` + `*_snapshot.json`.
- The CC-136 report-back (the `0007` trim + the journal-mismatch description).
- `package.json` db scripts (`db:generate`, `db:migrate`).

## Allowed to Modify (exhaustive)

- `db/migrations/meta/*` (journal + snapshots — reconcile to reality).
- A new baseline/squash migration under `db/migrations/` if that's the chosen
  reconciliation path.
- `db/schema.ts` only if it's out of sync with the real schema (flag).
- A short `docs/` runbook capturing the prod reconciliation steps.

Nothing else. No app/engine/render code. No destructive prod statements.

## Out of Scope

- Any schema *change* (this is reconciliation, not new tables/columns).
- CC-137 longitudinal work; the `answer_history` shape stays as CC-136 defined.

## Bash Commands Authorized

- `drizzle-kit` introspect/generate; `npm run db:generate`
- `psql` read-only introspection on dev; apply the chain on a **fresh** DB only
- `npx tsc --noEmit` if any TS (`db/schema.ts`) changes
- `grep` / `rg`

## Acceptance Criteria

1. Drizzle journal/`meta` matches the actual schema; `drizzle-kit` no longer
   re-emits `follow_up_links` (or any already-applied object).
2. `db:migrate` is a clean no-op against a DB that already matches (no
   "already exists" failures).
3. The full chain applies top-to-bottom on a fresh DB and yields the current
   schema including `answer_history` — demonstrated.
4. A written, owner-reviewable prod reconciliation plan exists (not executed).
5. No schema changes; no app code edited; nothing destructive run on prod.

## Report Back

- The drift inventory (what existed in DB but not in meta, and vice-versa).
- The reconciliation approach (baseline/squash vs other) + why.
- Proof of clean no-op migrate + clean fresh-DB replay.
- The prod plan (exact steps) for owner sign-off.
- Any object whose true state was ambiguous (flag).
