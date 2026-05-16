// CC-SYNTHESIS-3 — build-time runner for Path master synthesis LLM
// articulation across the full fixture cohort.
//
// CODEX-SYNTHESIS-3-CLIENT-FIX (2026-05-09): owns ALL Node-only logic
// for the synthesis-3 pipeline. The runtime library
// `lib/synthesis3Llm.ts` is now client-bundle-safe (no `node:*`
// imports, no SDK import). This script is the only place where:
//
//   - `node:fs` reads + writes the cache file
//   - `@anthropic-ai/sdk` is imported and used to call the API
//   - `node:crypto` would have lived (replaced by the canonical-string
//     `inputsHash` helper that the runtime library exports)
//
// Usage:
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildSynthesis3.ts
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildSynthesis3.ts --force
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildSynthesis3.ts --fixture=ocean/07-jason-real-session.json
//
// Without ANTHROPIC_API_KEY (or @anthropic-ai/sdk not installed): the
// composer returns null for cache misses; this script logs the
// infrastructure-only state and exits cleanly. The cache file stays
// whatever it was — empty {} or whatever entries already exist.

// CC-LLM-REWRITES-PERSISTED-ON-SESSION — opt this build script into
// the runtime LLM branch. The render path leaves it off.
process.env.LLM_REWRITE_RUNTIME = "on";

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../lib/identityEngine";
import {
  inputsHash,
  type PathMasterInputs,
  type ComposeOptions,
} from "../lib/synthesis3Llm";
// CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — composer moved to the
// server-only module. Build script imports it from there so both the
// build-time cohort runner and the runtime API endpoint use the same
// API-calling code.
import { composePathMasterSynthesisLlm } from "../lib/synthesis3LlmServer";
import { deriveSynthesis3Inputs } from "../lib/synthesis3Inputs";
import type { Answer, DemographicSet } from "../lib/types";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const ROOT = join(SCRIPT_DIR, "..", "tests", "fixtures");
const CACHE_DIR = join(SCRIPT_DIR, "..", "lib", "cache");
const CACHE_FILE = join(CACHE_DIR, "synthesis3-paragraphs.json");

// ─────────────────────────────────────────────────────────────────────
// Cache file I/O (build-time only — never imported from a client path)
// ─────────────────────────────────────────────────────────────────────

type CacheEntry = {
  paragraph: string;
  fixtureHint?: string;
  generatedAt?: string;
};

type CacheFile = Record<string, CacheEntry>;

function loadCache(): CacheFile {
  if (!existsSync(CACHE_FILE)) return {};
  try {
    const raw = readFileSync(CACHE_FILE, "utf-8");
    if (!raw.trim()) return {};
    return JSON.parse(raw) as CacheFile;
  } catch {
    return {};
  }
}

function saveCache(cache: CacheFile): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(
    CACHE_FILE,
    JSON.stringify(cache, null, 2) + "\n",
    "utf-8"
  );
}

// ─────────────────────────────────────────────────────────────────────
// Composer (build-time)
// ─────────────────────────────────────────────────────────────────────
//
// CODEX-SYNTHESIS-3-RUNTIME-FALLBACK — composer moved to
// `lib/synthesis3LlmServer.ts`. Build script wraps it with cache-aware
// behavior: on cache hit, return cached paragraph (no API call). On
// miss (or --force), call the imported composer + persist to local
// cache map. The imported composer also writes to disk on its own; the
// build script's local cache mutation here keeps the in-memory map
// synced with what's on disk for subsequent fixture iterations.

async function buildScriptCompose(
  inputs: PathMasterInputs,
  cache: CacheFile,
  options: ComposeOptions = {}
): Promise<string | null> {
  const key = inputsHash(inputs);

  // Cache hit (and not forced) — return immediately, no API call.
  if (!options.force && cache[key]?.paragraph) {
    return cache[key].paragraph;
  }

  // Cache miss — composer makes the API call AND persists to disk.
  const paragraph = await composePathMasterSynthesisLlm(inputs);
  if (!paragraph) return null;

  cache[key] = {
    paragraph,
    fixtureHint: options.fixtureHint,
    generatedAt: new Date().toISOString(),
  };
  saveCache(cache);

  return paragraph;
}

// ─────────────────────────────────────────────────────────────────────
// Fixture cohort runner
// ─────────────────────────────────────────────────────────────────────

type FixtureRecord = {
  set: "ocean" | "goal-soul-give";
  file: string;
  answers: Answer[];
  demographics: DemographicSet | null;
};

function loadFixtures(filterPath?: string): FixtureRecord[] {
  const out: FixtureRecord[] = [];
  for (const setName of ["ocean", "goal-soul-give"] as const) {
    const dir = join(ROOT, setName);
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      const id = `${setName}/${f}`;
      if (filterPath && filterPath !== id) continue;
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
      out.push({
        set: setName,
        file: f,
        answers: raw.answers,
        demographics: raw.demographics ?? null,
      });
    }
  }
  return out;
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const fixtureArg = args.find((a) => a.startsWith("--fixture="));
  const filterPath = fixtureArg?.split("=")[1];

  const fixtures = loadFixtures(filterPath);
  console.log(
    `CC-SYNTHESIS-3 — generating LLM Path master synthesis paragraphs for ${fixtures.length} fixture(s)${force ? " [--force]" : ""}.`
  );
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "  (ANTHROPIC_API_KEY not set — composer will return null on cache miss; existing cache entries are preserved.)"
    );
  }

  const cache = loadCache();
  let generated = 0;
  let cached = 0;
  let fellBack = 0;
  for (const fix of fixtures) {
    const id = `${fix.set}/${fix.file}`;
    const c = buildInnerConstitution(fix.answers, [], fix.demographics);
    const inputs = deriveSynthesis3Inputs(c);
    const result = await buildScriptCompose(inputs, cache, {
      force,
      fixtureHint: id,
    });
    if (result === null) {
      fellBack++;
      console.log(`[FALLBACK] ${id}  (no API key / SDK absent / API error)`);
      continue;
    }
    if (force) {
      generated++;
      console.log(`[GENERATED] ${id}  (${result.split(/\s+/).length} words)`);
    } else {
      cached++;
      console.log(`[CACHED]    ${id}  (${result.split(/\s+/).length} words)`);
    }
  }

  console.log("");
  console.log(
    `Summary: generated=${generated} cached=${cached} fellBack=${fellBack} of ${fixtures.length}`
  );
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
