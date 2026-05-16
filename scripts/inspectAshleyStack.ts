// Derive Ashley's cognitive function ranking from her saved local-DB
// session and report top 4. Useful for calibration: compare engine-
// derived stack to user's known real-world cognitive identity.

import postgres from "postgres";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Load DATABASE_URL from .env.local (sandbox-safe path).
function loadEnv() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.trim().match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}
loadEnv();

import { buildInnerConstitution } from "../lib/identityEngine";
import type { Answer } from "../lib/types";

const SEARCH_NAMES = process.argv.slice(2);
if (SEARCH_NAMES.length === 0) {
  console.error("Usage: tsx scripts/inspectAshleyStack.ts <name1> [name2 ...]");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
  for (const name of SEARCH_NAMES) {
    const rows = await client<
      Array<{
        session_id: string;
        name_value: string | null;
        answers: Answer[];
        inner_constitution: unknown;
      }>
    >`
      SELECT
        s.id AS session_id,
        d.name_value,
        s.answers,
        s.inner_constitution
      FROM sessions s
      LEFT JOIN demographics d ON d.session_id = s.id
      WHERE d.name_value ILIKE ${name}
    `;

    if (rows.length === 0) {
      console.log(`\n${name}: NO MATCH in local DB`);
      continue;
    }

    for (const row of rows) {
      console.log(`\n=== ${row.name_value} (session ${row.session_id.slice(0, 8)}) ===`);
      const c = buildInnerConstitution(row.answers, [], null);
      const stack = c.lens_stack;
      console.log(`  Driver (dominant):   ${stack?.dominant ?? "?"}`);
      console.log(`  Support (auxiliary): ${stack?.auxiliary ?? "?"}`);
      // Inspect any additional fields on lens_stack
      console.log(`  Full lens_stack keys: ${Object.keys(stack ?? {}).join(", ")}`);
      console.log(`  Full lens_stack:`);
      console.log(JSON.stringify(stack, null, 2).split("\n").map((l) => `    ${l}`).join("\n"));
    }
  }

  await client.end();
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
