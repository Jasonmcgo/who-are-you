import { defineConfig } from "drizzle-kit";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// CC-019 — Drizzle config. Schema in TypeScript (no .prisma file). Migrations
// land at db/migrations/. Connection comes from DATABASE_URL.
//
// drizzle-kit does not auto-load .env.local (Next.js's convention), only
// process.env. Inline loader below reads .env.local if present so
// `npm run db:generate` and `npm run db:migrate` work without requiring
// the user to manually export DATABASE_URL on every shell.

if (!process.env.DATABASE_URL) {
  const envPath = join(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        // Strip wrapping single or double quotes if present.
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
      }
    }
  }
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
