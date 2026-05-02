// CC-019 — Single entrypoint for database access. Lazy initialization: the
// connection is only opened on first call to `getDb()`, NOT at module load.
// Rationale: this file is imported transitively by `lib/saveSession.ts` (a
// server action) which the Next.js server may load eagerly. If the
// connection were opened at import time, the dev server would crash on
// startup whenever `DATABASE_URL` is missing — even when the user just
// wanted to test the UI flow without saving. Lazy init confines the failure
// to actual save attempts, which is the correct surface for a clear error.
//
// The spec language "exports a `db` client that fails clearly if
// DATABASE_URL is missing" is honored at the call site (`getDb()` throws
// with the descriptive error) rather than at the import site.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;

export function getDb(): DrizzleDb {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local before running with persistence. Local Postgres setup: see README § Database."
    );
  }
  // `prepare: false` — required for some hosted Postgres providers
  // (Supabase pgbouncer, Vercel Postgres); harmless on local.
  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}
