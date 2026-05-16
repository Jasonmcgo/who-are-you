// CC-GRIP-TAXONOMY — build-time runner for the Grip section LLM
// articulation across the full fixture cohort.
//
// Mirrors `scripts/buildSynthesis3.ts`. Server-only Node script.
//
// Usage:
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildGripTaxonomy.ts
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildGripTaxonomy.ts --force
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildGripTaxonomy.ts --fixture=ocean/07-jason-real-session.json

// CC-LLM-REWRITES-PERSISTED-ON-SESSION — opt in to the runtime LLM branch.
process.env.LLM_REWRITE_RUNTIME = "on";

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../lib/identityEngine";
import {
  gripInputsHash,
  type GripParagraphInputs,
  type GripComposeOptions,
} from "../lib/gripTaxonomyLlm";
import { composeGripParagraph } from "../lib/gripTaxonomyLlmServer";
import { deriveGripInputs } from "../lib/gripTaxonomyInputs";
import type { Answer, DemographicSet } from "../lib/types";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const ROOT = join(SCRIPT_DIR, "..", "tests", "fixtures");
const CACHE_DIR = join(SCRIPT_DIR, "..", "lib", "cache");
const CACHE_FILE = join(CACHE_DIR, "grip-paragraphs.json");

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

async function runForFixture(
  inputs: GripParagraphInputs,
  cache: CacheFile,
  options: GripComposeOptions = {}
): Promise<{ paragraph: string | null; usedApi: boolean }> {
  const key = gripInputsHash(inputs);
  if (!options.force && cache[key]?.paragraph) {
    return { paragraph: cache[key].paragraph, usedApi: false };
  }
  const paragraph = await composeGripParagraph(inputs);
  if (!paragraph) return { paragraph: null, usedApi: false };
  cache[key] = {
    paragraph,
    fixtureHint: options.fixtureHint,
    generatedAt: new Date().toISOString(),
  };
  saveCache(cache);
  return { paragraph, usedApi: true };
}

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
    `CC-GRIP-TAXONOMY — generating LLM Grip paragraphs for ${fixtures.length} fixture(s)${force ? " [--force]" : ""}.`
  );
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "  (ANTHROPIC_API_KEY not set — composer returns null on cache miss; existing entries preserved.)"
    );
  }

  const cache = loadCache();
  let generated = 0;
  let cached = 0;
  let skipped = 0;
  let fellBack = 0;

  for (const fix of fixtures) {
    const id = `${fix.set}/${fix.file}`;
    const c = buildInnerConstitution(fix.answers, [], fix.demographics);
    const inputs = deriveGripInputs(c);
    if (!inputs) {
      skipped++;
      console.log(`[SKIP]      ${id}  (no Primal cluster — low confidence)`);
      continue;
    }
    const { paragraph, usedApi } = await runForFixture(inputs, cache, {
      force,
      fixtureHint: id,
    });
    if (paragraph === null) {
      fellBack++;
      console.log(`[FALLBACK]  ${id}  (no API key / SDK / API error)`);
      continue;
    }
    if (usedApi) {
      generated++;
      console.log(
        `[GENERATED] ${id}  primary=${inputs.primary}  (${paragraph.split(/\s+/).length} words)`
      );
    } else {
      cached++;
      console.log(
        `[CACHED]    ${id}  primary=${inputs.primary}  (${paragraph.split(/\s+/).length} words)`
      );
    }
  }

  console.log("");
  console.log(
    `Summary: generated=${generated} cached=${cached} skipped=${skipped} fellBack=${fellBack} of ${fixtures.length}`
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
