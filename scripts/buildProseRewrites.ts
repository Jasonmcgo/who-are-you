// CC-LLM-PROSE-PASS-V1 — build-time runner for the LLM prose rewrite
// layer across the four scoped cards (Lens / Compass / Hands / Path).
//
// Usage:
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildProseRewrites.ts
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildProseRewrites.ts --force
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildProseRewrites.ts --fixture=ocean/07-jason-real-session.json

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
import { renderMirrorAsMarkdown } from "../lib/renderMirror";
import { composeProseRewrite } from "../lib/proseRewriteLlmServer";
import {
  proseRewriteHash,
  type ProseCardId,
  type ProseRewriteInputs,
} from "../lib/proseRewriteLlm";
import type { Answer, DemographicSet } from "../lib/types";
import type { ProfileArchetype } from "../lib/profileArchetype";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const ROOT = join(SCRIPT_DIR, "..", "tests", "fixtures");
const CACHE_DIR = join(SCRIPT_DIR, "..", "lib", "cache");
const CACHE_FILE = join(CACHE_DIR, "prose-rewrites.json");

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

const CARD_HEADERS: Record<ProseCardId, string> = {
  lens: "### Lens — Eyes",
  compass: "### Compass — Heart",
  hands: "### Hands — Work",
  path: "## Path — Gait",
};

function extractSection(md: string, header: string): string | null {
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  // Section runs until the next "## " or "### " header at depth ≤ this.
  // For "### " sections, stop at next "### " OR "## ". For "## ", stop
  // at next "## ".
  const depth = header.match(/^#+/)![0].length;
  const stopPattern = depth === 2 ? /\n## / : /\n## |\n### /;
  const nextHeader = rest.slice(header.length).search(stopPattern);
  if (nextHeader < 0) return rest.trimEnd();
  return rest.slice(0, header.length + nextHeader).trimEnd();
}

function getReservedCanonLines(): string[] {
  // CC canon-line scarcity — phrases that land in the Executive Read
  // (or elsewhere) and must NOT be echoed in body cards.
  return [
    "visible, revisable, present-tense structure",
    "grounded, legible, and free",
    "the work is not to care less; it is to let love become sustainable enough to last",
    "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
  ];
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
    for (const f of readdirSync(join(ROOT, set))
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      out.push(`${set}/${f}`);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const fixtureOnly = fixtureFilter(argv);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "[prose-rewrites] ANTHROPIC_API_KEY not set; aborting."
    );
    process.exit(2);
  }

  const cache = loadCache();
  const fixtures = fixtureOnly ? [fixtureOnly] : listFixtures();
  const reservedCanonLines = getReservedCanonLines();

  console.log(
    `CC-LLM-PROSE-PASS-V1 — generating LLM prose rewrites for ${fixtures.length} fixture(s) × 4 cards${force ? " [--force]" : ""}.`
  );

  let generated = 0;
  let cached = 0;
  let skipped = 0;
  let fellBack = 0;

  for (const fixturePath of fixtures) {
    const raw = JSON.parse(
      readFileSync(join(ROOT, fixturePath), "utf-8")
    ) as { answers: Answer[]; demographics?: DemographicSet | null };
    const constitution = buildInnerConstitution(
      raw.answers,
      [],
      raw.demographics ?? null
    );
    const archetype: ProfileArchetype =
      constitution.profileArchetype?.primary ?? "unmappedType";
    // Render in clinician mode so the LLM sees the FULL engine substrate
    // (including any trait/Faith vocabulary the engine still emits). The
    // LLM then produces a user-mode-clean rewrite per the system prompt.
    const md = renderMirrorAsMarkdown({
      constitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-11T00:00:00Z"),
      renderMode: "clinician",
    });

    for (const cardId of ["lens", "compass", "hands", "path"] as const) {
      const header = CARD_HEADERS[cardId];
      const engineSectionBody = extractSection(md, header);
      if (!engineSectionBody) {
        console.log(`[SKIP]      ${fixturePath} / ${cardId}  (section missing)`);
        skipped++;
        continue;
      }
      const inputs: ProseRewriteInputs = {
        cardId,
        archetype,
        engineSectionBody,
        reservedCanonLines,
      };
      const key = proseRewriteHash(inputs);
      if (!force && cache[key]?.rewrite) {
        console.log(`[CACHED]    ${fixturePath} / ${cardId}`);
        cached++;
        continue;
      }
      const rewrite = await composeProseRewrite(inputs);
      if (!rewrite) {
        console.log(`[FALLBACK]  ${fixturePath} / ${cardId}  (API error)`);
        fellBack++;
        continue;
      }
      cache[key] = {
        rewrite,
        fixtureHint: fixturePath,
        generatedAt: new Date().toISOString(),
      };
      console.log(
        `[GENERATED] ${fixturePath} / ${cardId}  (${rewrite.split(/\s+/).length} words)`
      );
      generated++;
      // Persist incrementally so a mid-run failure doesn't lose work.
      saveCache(cache);
    }
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
