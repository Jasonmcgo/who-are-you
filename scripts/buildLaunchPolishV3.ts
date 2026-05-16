// CC-LAUNCH-VOICE-POLISH-V3 — build-time runner for the seven Part-A
// LLM rewrite sections.
//
// Usage:
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildLaunchPolishV3.ts
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildLaunchPolishV3.ts --force
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildLaunchPolishV3.ts --fixture=ocean/07-jason-real-session.json
//   ANTHROPIC_API_KEY=... npx tsx scripts/buildLaunchPolishV3.ts --section=executiveRead

// CC-LLM-REWRITES-PERSISTED-ON-SESSION — opt in to the runtime LLM branch.
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

import {
  buildInnerConstitution,
  COMPASS_LABEL,
  getTopCompassValues,
} from "../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../lib/renderMirror";
import { composeV3Rewrite } from "../lib/launchPolishV3LlmServer";
import {
  v3RewriteHash,
  V3_SECTION_IDS,
  type V3RewriteInputs,
  type V3SectionId,
} from "../lib/launchPolishV3Llm";
import type { Answer, DemographicSet } from "../lib/types";
import type { ProfileArchetype } from "../lib/profileArchetype";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(__filename);
const ROOT = join(SCRIPT_DIR, "..", "tests", "fixtures");
const CACHE_DIR = join(SCRIPT_DIR, "..", "lib", "cache");
const CACHE_FILE = join(CACHE_DIR, "launch-polish-v3-rewrites.json");

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

const V3_HEADERS: Record<V3SectionId, string> = {
  executiveRead: "## Executive Read",
  corePattern: "## Your Core Pattern",
  whatOthersMayExperience: "## What Others May Experience",
  whenTheLoadGetsHeavy: "## When the Load Gets Heavy",
  synthesis: "## A Synthesis",
  closingRead: "## Closing Read",
  pathTriptych: "",
};

function extractSection(md: string, header: string): string | null {
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  const depth = header.match(/^#+/)![0].length;
  const stopPattern = depth === 2 ? /\n## / : /\n## |\n### /;
  const nextHeader = rest.slice(header.length).search(stopPattern);
  if (nextHeader < 0) return rest.trimEnd();
  return rest.slice(0, header.length + nextHeader).trimEnd();
}

function extractPathTriptych(md: string): string | null {
  const lines = md.split("\n");
  const blocks: string[] = [];
  for (const label of ["**Work**", "**Love**", "**Give**"]) {
    const idx = lines.findIndex((l) => l.startsWith(label));
    if (idx < 0) continue;
    const chunk: string[] = [lines[idx]];
    for (let i = idx + 1; i < lines.length; i++) {
      const next = lines[i];
      if (
        /^\*\*(?:Work|Love|Give|Practice|Pattern Note|Pattern in motion|Movement Note)\*\*/.test(
          next
        ) ||
        /^## /.test(next) ||
        /^### /.test(next)
      ) {
        break;
      }
      chunk.push(next);
    }
    blocks.push(chunk.join("\n").trimEnd());
  }
  if (blocks.length === 0) return null;
  return blocks.join("\n\n");
}

function getReservedCanonLines(): string[] {
  return [
    "visible, revisable, present-tense structure",
    "grounded, legible, and free",
    "the work is not to care less; it is to let love become sustainable enough to last",
    "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
  ];
}

function fixtureFilter(argv: string[], prefix: string): string | null {
  for (const a of argv) {
    if (a.startsWith(prefix)) return a.slice(prefix.length);
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

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const fixtureOnly = fixtureFilter(argv, "--fixture=");
  const sectionFilter = fixtureFilter(argv, "--section=") as
    | V3SectionId
    | null;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "[launch-polish-v3] ANTHROPIC_API_KEY not set; aborting."
    );
    process.exit(2);
  }

  const cache = loadCache();
  const fixtures = fixtureOnly ? [fixtureOnly] : listFixtures();
  const sections =
    sectionFilter && V3_SECTION_IDS.includes(sectionFilter)
      ? [sectionFilter]
      : V3_SECTION_IDS;
  const reservedCanonLines = getReservedCanonLines();

  console.log(
    `CC-LAUNCH-VOICE-POLISH-V3 — generating LLM rewrites for ${fixtures.length} fixture(s) × ${sections.length} section(s)${force ? " [--force]" : ""}.`
  );

  let generated = 0;
  let cached = 0;
  let skipped = 0;
  let fellBack = 0;

  for (const fixturePath of fixtures) {
    let raw: { answers: Answer[]; demographics?: DemographicSet | null };
    try {
      raw = JSON.parse(readFileSync(join(ROOT, fixturePath), "utf-8")) as {
        answers: Answer[];
        demographics?: DemographicSet | null;
      };
    } catch (e) {
      console.log(`[SKIP]      ${fixturePath}  (read error: ${(e as Error).message})`);
      skipped++;
      continue;
    }
    let constitution;
    try {
      constitution = buildInnerConstitution(
        raw.answers,
        [],
        raw.demographics ?? null
      );
    } catch (e) {
      console.log(`[SKIP]      ${fixturePath}  (build error: ${(e as Error).message})`);
      skipped++;
      continue;
    }
    const archetype: ProfileArchetype =
      constitution.profileArchetype?.primary ?? "unmappedType";
    const md = renderMirrorAsMarkdown({
      constitution,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-13T00:00:00Z"),
      renderMode: "clinician",
    });
    const topCompassValueLabels = getTopCompassValues(constitution.signals)
      .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
      .filter((s) => s.length > 0);

    for (const sectionId of sections) {
      const engineSectionBody =
        sectionId === "pathTriptych"
          ? extractPathTriptych(md)
          : extractSection(md, V3_HEADERS[sectionId]);
      if (!engineSectionBody) {
        console.log(`[SKIP]      ${fixturePath} / ${sectionId}  (section missing)`);
        skipped++;
        continue;
      }
      const inputs: V3RewriteInputs = {
        sectionId,
        archetype,
        engineSectionBody,
        topCompassValueLabels,
        reservedCanonLines,
      };
      const key = v3RewriteHash(inputs);
      if (!force && cache[key]?.rewrite) {
        console.log(`[CACHED]    ${fixturePath} / ${sectionId}`);
        cached++;
        continue;
      }
      const rewrite = await composeV3Rewrite(inputs);
      if (!rewrite) {
        console.log(`[FALLBACK]  ${fixturePath} / ${sectionId}  (API error)`);
        fellBack++;
        continue;
      }
      cache[key] = {
        rewrite,
        fixtureHint: fixturePath,
        generatedAt: new Date().toISOString(),
      };
      console.log(
        `[GENERATED] ${fixturePath} / ${sectionId}  (${rewrite.split(/\s+/).length} words)`
      );
      generated++;
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
