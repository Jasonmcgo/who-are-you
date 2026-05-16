// CC-KEYSTONE-RENDER — build-time runner for the Keystone Reflection
// LLM rewrite cohort. Walks every fixture with a Q-I1 (or Q-I1b)
// freeform belief and asks Claude to write the interpretive paragraph.
//
// Usage:
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildKeystoneRewrites.ts
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildKeystoneRewrites.ts --force
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildKeystoneRewrites.ts --fixture=ocean/07-jason-real-session.json

// CC-LLM-REWRITES-PERSISTED-ON-SESSION — opt in to the runtime LLM
// branch. The render path leaves this off; only build* scripts flip it.
process.env.LLM_REWRITE_RUNTIME = "on";

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../lib/identityEngine";
import {
  COMPASS_LABEL,
  getTopCompassValues,
} from "../lib/identityEngine";
import {
  summarizeQI2Selections,
  summarizeQI3Selections,
} from "../lib/beliefHeuristics";
import { composeKeystoneRewrite } from "../lib/keystoneRewriteLlmServer";
import {
  keystoneRewriteHash,
  type KeystoneRewriteInputs,
} from "../lib/keystoneRewriteLlm";
import type { Answer, DemographicSet } from "../lib/types";
import type { ProfileArchetype } from "../lib/profileArchetype";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const ROOT = join(SCRIPT_DIR, "..", "tests", "fixtures");
const CACHE_DIR = join(SCRIPT_DIR, "..", "lib", "cache");
const CACHE_FILE = join(CACHE_DIR, "keystone-rewrites.json");

type CacheEntry = {
  rewrite: string;
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
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

const FIXTURE_ARG_PREFIX = "--fixture=";

function fixtureFilter(argv: string[]): string | null {
  for (const a of argv) {
    if (a.startsWith(FIXTURE_ARG_PREFIX))
      return a.slice(FIXTURE_ARG_PREFIX.length);
  }
  return null;
}

function listFixtures(): string[] {
  const out: string[] = [];
  for (const set of ["ocean", "goal-soul-give"]) {
    const dir = join(ROOT, set);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      out.push(`${set}/${f}`);
    }
  }
  return out;
}

function findBeliefText(answers: Answer[]): string | null {
  const qi1 = answers.find((a) => a.question_id === "Q-I1");
  if (qi1 && qi1.type === "freeform" && qi1.response.trim().length > 0) {
    return qi1.response.trim();
  }
  const qi1b = answers.find((a) => a.question_id === "Q-I1b");
  if (qi1b && qi1b.type === "freeform" && qi1b.response.trim().length > 0) {
    return qi1b.response.trim();
  }
  return null;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const fixtureOnly = fixtureFilter(argv);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "[keystone-rewrites] ANTHROPIC_API_KEY not set; aborting."
    );
    process.exit(2);
  }

  const cache = loadCache();
  const fixtures = fixtureOnly ? [fixtureOnly] : listFixtures();

  console.log(
    `CC-KEYSTONE-RENDER — generating LLM keystone rewrites for ${fixtures.length} fixture(s)${force ? " [--force]" : ""}.`
  );

  let generated = 0;
  let cached = 0;
  let skipped = 0;
  let fellBack = 0;

  for (const fixturePath of fixtures) {
    const raw = JSON.parse(
      readFileSync(join(ROOT, fixturePath), "utf-8")
    ) as { answers: Answer[]; demographics?: DemographicSet | null };
    const beliefText = findBeliefText(raw.answers);
    if (!beliefText) {
      console.log(`[SKIP]      ${fixturePath}  (no Q-I1/Q-I1b freeform)`);
      skipped++;
      continue;
    }
    const constitution = buildInnerConstitution(
      raw.answers,
      [],
      raw.demographics ?? null
    );
    const belief = constitution.belief_under_tension;
    if (!belief) {
      console.log(`[SKIP]      ${fixturePath}  (no belief_under_tension)`);
      skipped++;
      continue;
    }
    const archetype: ProfileArchetype =
      constitution.profileArchetype?.primary ?? "unmappedType";

    const topCompassRefs = getTopCompassValues(constitution.signals);
    const topCompassValueLabels = topCompassRefs
      .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
      .filter((s) => s.length > 0);

    const qi2 = summarizeQI2Selections(raw.answers);
    const qi3 = summarizeQI3Selections(raw.answers);

    const inputs: KeystoneRewriteInputs = {
      archetype,
      beliefText: belief.belief_text,
      valueDomain: belief.value_domain,
      topCompassValueLabels,
      costSurfaceLabels: qi3?.selectedLabels ?? [],
      costSurfaceNoneSelected: qi3?.noneSelected ?? false,
      correctionChannelLabels: qi2?.selectedLabels ?? [],
      correctionChannelNoneSelected: qi2?.noneSelected ?? false,
      convictionTemperature: belief.conviction_temperature,
      epistemicPosture: belief.epistemic_posture,
    };

    const key = keystoneRewriteHash(inputs);
    if (!force && cache[key]?.rewrite) {
      console.log(`[CACHED]    ${fixturePath}`);
      cached++;
      continue;
    }

    const rewrite = await composeKeystoneRewrite(inputs);
    if (!rewrite) {
      console.log(`[FALLBACK]  ${fixturePath}  (API error)`);
      fellBack++;
      continue;
    }
    cache[key] = {
      rewrite,
      fixtureHint: fixturePath,
      generatedAt: new Date().toISOString(),
    };
    console.log(
      `[GENERATED] ${fixturePath}  (${rewrite.split(/\s+/).length} words)`
    );
    generated++;
    saveCache(cache);
  }

  saveCache(cache);
  console.log(
    `\nSummary: generated=${generated} cached=${cached} skipped=${skipped} fellBack=${fellBack}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
