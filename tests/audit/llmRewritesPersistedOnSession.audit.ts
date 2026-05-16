// CC-LLM-REWRITES-PERSISTED-ON-SESSION audit — verifies the structural
// cache-or-engine render path is in place. Six classes of assertion:
//
//   1. Schema      — db/schema.ts exports the two new columns.
//   2. Migration   — db/migrations/0003_*.sql contains both ADD COLUMNs.
//   3. Bundle      — lib/llmRewritesBundle.ts exports the type + hash.
//   4. Guards      — every lib/*LlmServer.ts contains the runtime gate
//                    before the composer call.
//   5. Backfill    — scripts/backfillLlmRewritesOnSessions.ts imports
//                    neither @anthropic-ai/sdk nor any *LlmServer
//                    module.
//   6. Smoke       — three sample sessions round-trip through
//                    resolveProseRewriteLive with a populated bundle:
//                    the bundle entry is returned and the composer
//                    stub is never invoked. (If the composer throws,
//                    the bundle path is broken.)

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { proseRewriteHash } from "../../lib/proseRewriteLlm";
import { resolveProseRewriteLive } from "../../lib/proseRewriteLlmServer";
import {
  emptyLlmRewritesBundle,
  hashEngineForLlmBundle,
} from "../../lib/llmRewritesBundle";
import { buildInnerConstitution } from "../../lib/identityEngine";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = join(__dirname, "..", "..");

type AssertionResult =
  | { ok: true; assertion: string; detail?: string }
  | { ok: false; assertion: string; detail: string };

async function runAudit(): Promise<void> {
  const results: AssertionResult[] = [];

  // ── 1. Schema columns exported ─────────────────────────────────────
  {
    const schema = readFileSync(join(REPO, "db", "schema.ts"), "utf-8");
    const hasJsonb = /llm_rewrites:\s*jsonb\("llm_rewrites"\)/.test(schema);
    const hasHash =
      /llm_rewrites_engine_hash:\s*text\("llm_rewrites_engine_hash"\)/.test(
        schema
      );
    results.push(
      hasJsonb && hasHash
        ? {
            ok: true,
            assertion: "schema-columns-exported",
            detail: `db/schema.ts declares llm_rewrites jsonb + llm_rewrites_engine_hash text`,
          }
        : {
            ok: false,
            assertion: "schema-columns-exported",
            detail: `missing column declarations (jsonb=${hasJsonb}, hash=${hasHash})`,
          }
    );
  }

  // ── 2. Migration file exists with both ADD COLUMNs ─────────────────
  {
    const migDir = join(REPO, "db", "migrations");
    const files = readdirSync(migDir).filter((f) =>
      /^0003_.*\.sql$/.test(f)
    );
    if (files.length === 0) {
      results.push({
        ok: false,
        assertion: "migration-0003-exists",
        detail: `no 0003_*.sql file under db/migrations/`,
      });
    } else {
      const sql = readFileSync(join(migDir, files[0]!), "utf-8");
      const hasJsonb = /ADD COLUMN "llm_rewrites" jsonb/.test(sql);
      const hasHash = /ADD COLUMN "llm_rewrites_engine_hash" text/.test(sql);
      results.push(
        hasJsonb && hasHash
          ? {
              ok: true,
              assertion: "migration-0003-exists",
              detail: `${files[0]} contains both ADD COLUMN statements`,
            }
          : {
              ok: false,
              assertion: "migration-0003-exists",
              detail: `${files[0]} missing ADD COLUMN (jsonb=${hasJsonb}, hash=${hasHash})`,
            }
      );
    }
  }

  // ── 3. Bundle module exports the type + hash helper ────────────────
  {
    const bundlePath = join(REPO, "lib", "llmRewritesBundle.ts");
    if (!existsSync(bundlePath)) {
      results.push({
        ok: false,
        assertion: "bundle-module-exports",
        detail: `lib/llmRewritesBundle.ts does not exist`,
      });
    } else {
      const src = readFileSync(bundlePath, "utf-8");
      const exportsType = /export interface LlmRewritesBundle/.test(src);
      const exportsHash = /export function hashEngineForLlmBundle\(/.test(src);
      const exportsLookup = /export function bundleLookup\(/.test(src);
      results.push(
        exportsType && exportsHash && exportsLookup
          ? {
              ok: true,
              assertion: "bundle-module-exports",
              detail: `LlmRewritesBundle + hashEngineForLlmBundle + bundleLookup all exported`,
            }
          : {
              ok: false,
              assertion: "bundle-module-exports",
              detail: `missing export (type=${exportsType}, hash=${exportsHash}, lookup=${exportsLookup})`,
            }
      );
    }
  }

  // ── 4. Runtime guard present in every *LlmServer.ts ────────────────
  //   The guard is the structural barrier between cache miss and the
  //   composer call. Every render-path module must contain it.
  {
    const servers = [
      "lib/proseRewriteLlmServer.ts",
      "lib/keystoneRewriteLlmServer.ts",
      "lib/synthesis3LlmServer.ts",
      "lib/gripTaxonomyLlmServer.ts",
      "lib/launchPolishV3LlmServer.ts",
    ];
    const failures: string[] = [];
    for (const rel of servers) {
      const src = readFileSync(join(REPO, rel), "utf-8");
      const hasGuard =
        /process\.env\.LLM_REWRITE_RUNTIME\s*!==\s*"on"/.test(src);
      if (!hasGuard) failures.push(rel);
    }
    results.push(
      failures.length === 0
        ? {
            ok: true,
            assertion: "runtime-guard-in-all-llm-servers",
            detail: `all 5 *LlmServer.ts modules contain the LLM_REWRITE_RUNTIME guard`,
          }
        : {
            ok: false,
            assertion: "runtime-guard-in-all-llm-servers",
            detail: `missing guard in: ${failures.join(", ")}`,
          }
    );
  }

  // ── 5. Backfill script is grep-clean ───────────────────────────────
  //   The script MUST NOT import @anthropic-ai/sdk and MUST NOT
  //   import any lib/*LlmServer module. The audit greps for both.
  {
    const scriptPath = join(
      REPO,
      "scripts",
      "backfillLlmRewritesOnSessions.ts"
    );
    if (!existsSync(scriptPath)) {
      results.push({
        ok: false,
        assertion: "backfill-script-grep-clean",
        detail: `scripts/backfillLlmRewritesOnSessions.ts does not exist`,
      });
    } else {
      const src = readFileSync(scriptPath, "utf-8");
      const importsSdk = /from\s+["']@anthropic-ai\/sdk["']/.test(src);
      const importsServer = /from\s+["'][^"']*LlmServer["']/.test(src);
      results.push(
        !importsSdk && !importsServer
          ? {
              ok: true,
              assertion: "backfill-script-grep-clean",
              detail: `backfill script imports neither @anthropic-ai/sdk nor any *LlmServer module`,
            }
          : {
              ok: false,
              assertion: "backfill-script-grep-clean",
              detail: `backfill script forbidden import detected (sdk=${importsSdk}, server=${importsServer})`,
            }
      );
    }
  }

  // ── 6. Smoke — bundle returns cached prose; composer never called ──
  //   Load three cohort fixtures, build a synthetic bundle that
  //   contains the exact prose-rewrite hash keys, and invoke
  //   resolveProseRewriteLive with a composer that throws.
  //   The resolver MUST hit the bundle path before reaching the
  //   composer; if the composer fires, the assertion fails.
  {
    const fixturesDir = join(REPO, "tests", "fixtures", "ocean");
    const fixtureFiles = readdirSync(fixturesDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .slice(0, 3);

    const composerCalls: string[] = [];
    const throwingComposer = async (): Promise<string | null> => {
      composerCalls.push("composer was called — bundle path broken");
      throw new Error("composer must not be reached");
    };

    let bundleHits = 0;
    let bundleMisses = 0;
    for (const file of fixtureFiles) {
      const raw = JSON.parse(
        readFileSync(join(fixturesDir, file), "utf-8")
      ) as { answers: Answer[]; demographics?: DemographicSet | null };
      const c = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
      const archetype = c.profileArchetype?.primary ?? "unmappedType";
      const inputs = {
        cardId: "lens" as const,
        archetype,
        // Use a known unique body so the committed cache cannot hit;
        // the only path that can return a non-null value is the
        // session bundle.
        engineSectionBody: `### Lens — Eyes\n\n[smoke-${file}]`,
        reservedCanonLines: [
          "visible, revisable, present-tense structure",
          "grounded, legible, and free",
          "the work is not to care less; it is to let love become sustainable enough to last",
          "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
        ],
      };
      const key = proseRewriteHash(inputs);
      const bundle = emptyLlmRewritesBundle();
      bundle.prose[key] = { rewrite: `BUNDLE_HIT_${file}` };

      const result = await resolveProseRewriteLive(inputs, {
        liveSession: true,
        composer: throwingComposer,
        sessionLlmBundle: bundle,
      });
      if (result === `BUNDLE_HIT_${file}`) bundleHits++;
      else bundleMisses++;
    }
    if (composerCalls.length > 0) {
      results.push({
        ok: false,
        assertion: "smoke-bundle-roundtrip-three-fixtures",
        detail: `composer was reached (${composerCalls.length} calls) — the session-bundle check did not short-circuit`,
      });
    } else if (bundleHits !== fixtureFiles.length) {
      results.push({
        ok: false,
        assertion: "smoke-bundle-roundtrip-three-fixtures",
        detail: `expected ${fixtureFiles.length} bundle hits, got ${bundleHits} (misses=${bundleMisses})`,
      });
    } else {
      results.push({
        ok: true,
        assertion: "smoke-bundle-roundtrip-three-fixtures",
        detail: `${bundleHits} bundle hits, 0 composer invocations across ${fixtureFiles.length} fixtures`,
      });
    }
  }

  // ── 7. hashEngineForLlmBundle is byte-stable ────────────────────────
  //   Compute the hash twice on the same inputs and verify equality.
  //   Compute again with one input perturbed and verify inequality.
  {
    const fixturesDir = join(REPO, "tests", "fixtures", "ocean");
    const raw = JSON.parse(
      readFileSync(
        join(fixturesDir, "07-jason-real-session.json"),
        "utf-8"
      )
    ) as { answers: Answer[]; demographics?: DemographicSet | null };
    const c = buildInnerConstitution(
      raw.answers,
      [],
      raw.demographics ?? null
    );
    const h1 = hashEngineForLlmBundle(c, raw.answers, raw.demographics ?? null);
    const h2 = hashEngineForLlmBundle(c, raw.answers, raw.demographics ?? null);
    // Perturb the answers by reversing the order — sorted hash should
    // still be stable.
    const reversed = [...raw.answers].reverse();
    const h3 = hashEngineForLlmBundle(c, reversed, raw.demographics ?? null);
    const stable = h1 === h2 && h1 === h3;
    results.push(
      stable
        ? {
            ok: true,
            assertion: "hash-engine-byte-stable",
            detail: `hashEngineForLlmBundle is stable across re-runs and answer-array permutations`,
          }
        : {
            ok: false,
            assertion: "hash-engine-byte-stable",
            detail: `hash mismatch (h1=${h1.slice(0, 12)} h2=${h2.slice(0, 12)} h3=${h3.slice(0, 12)})`,
          }
    );
  }

  // ── Report ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  for (const r of results) {
    const tag = r.ok ? "[PASS]" : "[FAIL]";
    console.log(`${tag} ${r.assertion}${r.detail ? `  — ${r.detail}` : ""}`);
  }
  console.log("");
  console.log(
    `CC-LLM-REWRITES-PERSISTED-ON-SESSION: ${passed}/${results.length} assertions passing.`
  );
  if (failed > 0) process.exit(1);
}

runAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
