// CC-LLM-REWRITES-PERSISTED-ON-SESSION — backfill script.
//
// Pure cache-file-to-DB transcoder. Reads the five committed
// `lib/cache/*.json` files, queries every row in `sessions`, derives
// each row's per-layer cache keys deterministically, picks up matching
// cache entries, and UPDATEs the row's `llm_rewrites` JSONB + the
// `llm_rewrites_engine_hash` text column.
//
// **Hard rule** (audited at Item 6): this script MUST NOT
//   - import `@anthropic-ai/sdk`
//   - import any `lib/*LlmServer.ts` module (the SDK enters the
//     bundle through those)
//
// If `ANTHROPIC_API_KEY` happens to be present in the environment,
// the script logs a warning but otherwise ignores it — the key is
// never used. The render path's guard (LLM_REWRITE_RUNTIME) is the
// independent enforcement layer.
//
// Idempotent: re-running on an already-backfilled row is a no-op
// when the freshly-computed engine hash matches the persisted one.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Inline `.env.local` loader — mirrors drizzle.config.ts so the script
// runs from a fresh shell without requiring DATABASE_URL be exported
// manually. Does not introduce a `dotenv` dependency.
function loadEnvLocal(): void {
  if (process.env.DATABASE_URL) return;
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}
loadEnvLocal();

import { eq } from "drizzle-orm";

import { getDb } from "../db";
import { sessions } from "../db/schema";
import {
  emptyLlmRewritesBundle,
  hashEngineForLlmBundle,
  type LlmRewritesBundle,
} from "../lib/llmRewritesBundle";
import { renderMirrorAsMarkdown } from "../lib/renderMirror";
import {
  proseRewriteHash,
  type ProseCardId,
  type ProseRewriteInputs,
} from "../lib/proseRewriteLlm";
import {
  keystoneRewriteHash,
  type KeystoneRewriteInputs,
} from "../lib/keystoneRewriteLlm";
import { inputsHash as synthesis3InputsHash } from "../lib/synthesis3Llm";
import { deriveSynthesis3Inputs } from "../lib/synthesis3Inputs";
import { gripInputsHash } from "../lib/gripTaxonomyLlm";
import { deriveGripInputs } from "../lib/gripTaxonomyInputs";
import {
  v3RewriteHash,
  V3_SECTION_IDS,
  type V3RewriteInputs,
  type V3SectionId,
} from "../lib/launchPolishV3Llm";
import {
  COMPASS_LABEL,
  getTopCompassValues,
} from "../lib/identityEngine";
import {
  summarizeQI2Selections,
  summarizeQI3Selections,
} from "../lib/beliefHeuristics";
import type {
  Answer,
  DemographicSet,
  InnerConstitution,
} from "../lib/types";

// CC-LLM-REWRITES-PERSISTED-ON-SESSION — defensive guard. The
// presence of ANTHROPIC_API_KEY is harmless (the script does not use
// it) but the warning makes the inadvertent leak visible.
if (process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "[backfill] ANTHROPIC_API_KEY is set in this environment. The script does NOT use it; this warning is informational only."
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cache file loaders
// ─────────────────────────────────────────────────────────────────────

const CACHE_DIR = join(process.cwd(), "lib", "cache");

interface RewriteCacheEntry {
  rewrite?: string;
  paragraph?: string;
}

function loadCache(file: string): Record<string, RewriteCacheEntry> {
  const path = join(CACHE_DIR, file);
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Record<string, RewriteCacheEntry>;
}

const PROSE_CACHE = loadCache("prose-rewrites.json");
const KEYSTONE_CACHE = loadCache("keystone-rewrites.json");
const SYNTHESIS3_CACHE = loadCache("synthesis3-paragraphs.json");
const GRIP_CACHE = loadCache("grip-paragraphs.json");
const V3_CACHE = loadCache("launch-polish-v3-rewrites.json");

// ─────────────────────────────────────────────────────────────────────
// Section slicers (mirror renderMirrorLive + resolveScopedRewritesLive)
// ─────────────────────────────────────────────────────────────────────

const SCOPED_HEADERS: Record<ProseCardId, string> = {
  lens: "### Lens — Eyes",
  compass: "### Compass — Heart",
  hands: "### Hands — Work",
  path: "## Path — Gait",
};

const V3_HEADERS: Record<V3SectionId, string> = {
  executiveRead: "## Executive Read",
  corePattern: "## Your Core Pattern",
  whatOthersMayExperience: "## What Others May Experience",
  whenTheLoadGetsHeavy: "## When the Load Gets Heavy",
  synthesis: "## A Synthesis",
  closingRead: "## Closing Read",
  pathTriptych: "",
};

const RESERVED_CANON_LINES = [
  "visible, revisable, present-tense structure",
  "grounded, legible, and free",
  "the work is not to care less; it is to let love become sustainable enough to last",
  "the work is not to abandon what has endured; it is to let what has endured remain alive enough to update",
];

function extractSection(md: string, header: string): string | null {
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  const depth = header.startsWith("## ") && !header.startsWith("### ") ? 2 : 3;
  const stop = depth === 2 ? /\n## / : /\n## |\n### /;
  const next = rest.slice(header.length).search(stop);
  return next < 0 ? rest.trimEnd() : rest.slice(0, header.length + next).trimEnd();
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

// ─────────────────────────────────────────────────────────────────────
// Per-session bundle builder
// ─────────────────────────────────────────────────────────────────────

interface PerSessionReport {
  sessionId: string;
  prose: { matched: number; missed: number };
  keystone: { matched: number; missed: number };
  synthesis3: { matched: number; missed: number };
  grip: { matched: number; missed: number };
  launchPolishV3: { matched: number; missed: number };
}

function buildBundleForSession(
  constitution: InnerConstitution,
  answers: Answer[],
  demographics: DemographicSet | null,
  sessionId: string
): { bundle: LlmRewritesBundle; report: PerSessionReport } {
  const bundle = emptyLlmRewritesBundle();
  const report: PerSessionReport = {
    sessionId,
    prose: { matched: 0, missed: 0 },
    keystone: { matched: 0, missed: 0 },
    synthesis3: { matched: 0, missed: 0 },
    grip: { matched: 0, missed: 0 },
    launchPolishV3: { matched: 0, missed: 0 },
  };

  const clinMd = renderMirrorAsMarkdown({
    constitution,
    answers,
    demographics,
    includeBeliefAnchor: false,
    renderMode: "clinician",
  });
  const archetype =
    constitution.profileArchetype?.primary ?? "unmappedType";

  // Prose — 4 scoped body cards.
  for (const cardId of ["lens", "compass", "hands", "path"] as ProseCardId[]) {
    const body = extractSection(clinMd, SCOPED_HEADERS[cardId]);
    if (!body) {
      report.prose.missed++;
      continue;
    }
    const inputs: ProseRewriteInputs = {
      cardId,
      archetype,
      engineSectionBody: body,
      reservedCanonLines: RESERVED_CANON_LINES,
    };
    const key = proseRewriteHash(inputs);
    const entry = PROSE_CACHE[key];
    if (entry?.rewrite) {
      bundle.prose[key] = { rewrite: entry.rewrite };
      report.prose.matched++;
    } else {
      report.prose.missed++;
    }
  }

  // Keystone — only when belief is present.
  const belief = constitution.belief_under_tension;
  if (belief && belief.belief_text) {
    const topCompassValueLabels = getTopCompassValues(constitution.signals)
      .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
      .filter((s) => s.length > 0);
    const qi2 = summarizeQI2Selections(answers);
    const qi3 = summarizeQI3Selections(answers);
    const keystoneInputs: KeystoneRewriteInputs = {
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
    const key = keystoneRewriteHash(keystoneInputs);
    const entry = KEYSTONE_CACHE[key];
    if (entry?.rewrite) {
      bundle.keystone[key] = { rewrite: entry.rewrite };
      report.keystone.matched++;
    } else {
      report.keystone.missed++;
    }
  }

  // Synthesis3 — single Path master paragraph per session.
  try {
    const s3Inputs = deriveSynthesis3Inputs(constitution);
    if (s3Inputs) {
      const key = synthesis3InputsHash(s3Inputs);
      const entry = SYNTHESIS3_CACHE[key];
      if (entry?.paragraph) {
        bundle.synthesis3[key] = { paragraph: entry.paragraph };
        report.synthesis3.matched++;
      } else {
        report.synthesis3.missed++;
      }
    }
  } catch (e) {
    console.warn(
      `[backfill] synthesis3 input derivation failed for ${sessionId}: ${(e as Error).message}`
    );
  }

  // Grip — single grip paragraph per session.
  try {
    const gripInputs = deriveGripInputs(constitution);
    if (gripInputs) {
      const key = gripInputsHash(gripInputs);
      const entry = GRIP_CACHE[key];
      if (entry?.paragraph) {
        bundle.grip[key] = { paragraph: entry.paragraph };
        report.grip.matched++;
      } else {
        report.grip.missed++;
      }
    }
  } catch (e) {
    console.warn(
      `[backfill] grip input derivation failed for ${sessionId}: ${(e as Error).message}`
    );
  }

  // Launch-polish V3 — seven sections.
  const topCompassValueLabels = getTopCompassValues(constitution.signals)
    .map((r) => COMPASS_LABEL[r.signal_id] ?? r.signal_id)
    .filter((s) => s.length > 0);
  for (const sectionId of V3_SECTION_IDS) {
    const body =
      sectionId === "pathTriptych"
        ? extractPathTriptych(clinMd)
        : extractSection(clinMd, V3_HEADERS[sectionId]);
    if (!body) {
      report.launchPolishV3.missed++;
      continue;
    }
    const inputs: V3RewriteInputs = {
      sectionId,
      archetype,
      engineSectionBody: body,
      topCompassValueLabels,
      reservedCanonLines: RESERVED_CANON_LINES,
    };
    const key = v3RewriteHash(inputs);
    const entry = V3_CACHE[key];
    if (entry?.rewrite) {
      bundle.launchPolishV3[key] = { rewrite: entry.rewrite };
      report.launchPolishV3.matched++;
    } else {
      report.launchPolishV3.missed++;
    }
  }

  return { bundle, report };
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("[backfill] starting");
  console.log(
    `[backfill] cache sizes — prose=${Object.keys(PROSE_CACHE).length} keystone=${Object.keys(KEYSTONE_CACHE).length} synthesis3=${Object.keys(SYNTHESIS3_CACHE).length} grip=${Object.keys(GRIP_CACHE).length} launchPolishV3=${Object.keys(V3_CACHE).length}`
  );

  const db = getDb();
  const rows = await db
    .select({
      id: sessions.id,
      answers: sessions.answers,
      inner_constitution: sessions.inner_constitution,
      llm_rewrites_engine_hash: sessions.llm_rewrites_engine_hash,
    })
    .from(sessions);

  console.log(`[backfill] ${rows.length} session rows to process`);

  let backfilled = 0;
  let skipped = 0;
  let staleShape = 0;
  const layerTotals = {
    prose: 0,
    keystone: 0,
    synthesis3: 0,
    grip: 0,
    launchPolishV3: 0,
  };

  for (const row of rows) {
    const sessionId = row.id;
    const answers = (row.answers ?? []) as Answer[];
    const constitution = row.inner_constitution as InnerConstitution;

    // Load demographics from the demographics table — separate query
    // would require a join; cheaper to refetch per row given the small
    // session count. The demographics shape is `{answers: Field[]}`
    // when present, null otherwise. Backfill defaults to null since
    // the engine inputs hash is computed against whatever the session
    // row stored at save time; the demographics row drives only the
    // name-mask, not the cache key.
    const demographics: DemographicSet | null = null;

    let freshHash: string;
    let bundleResult: ReturnType<typeof buildBundleForSession>;
    try {
      freshHash = hashEngineForLlmBundle(
        constitution,
        answers,
        demographics
      );
      if (row.llm_rewrites_engine_hash === freshHash) {
        skipped++;
        continue;
      }
      bundleResult = buildBundleForSession(
        constitution,
        answers,
        demographics,
        sessionId
      );
    } catch (e) {
      // Stale `inner_constitution` shape (older engine version that
      // omitted fields the current renderer reads). Skip the row —
      // it can be re-backfilled after a re-render, or left null
      // (render path falls through to engine prose).
      staleShape++;
      console.warn(
        `[backfill] ${sessionId}: skipped (stale shape): ${(e as Error).message}`
      );
      continue;
    }

    const { bundle, report } = bundleResult;
    layerTotals.prose += report.prose.matched;
    layerTotals.keystone += report.keystone.matched;
    layerTotals.synthesis3 += report.synthesis3.matched;
    layerTotals.grip += report.grip.matched;
    layerTotals.launchPolishV3 += report.launchPolishV3.matched;

    await db
      .update(sessions)
      .set({
        llm_rewrites: bundle,
        llm_rewrites_engine_hash: freshHash,
      })
      .where(eq(sessions.id, sessionId));

    backfilled++;
    console.log(
      `[backfill] ${sessionId}: prose=${report.prose.matched}/${
        report.prose.matched + report.prose.missed
      } keystone=${report.keystone.matched}/${
        report.keystone.matched + report.keystone.missed
      } synthesis3=${report.synthesis3.matched}/${
        report.synthesis3.matched + report.synthesis3.missed
      } grip=${report.grip.matched}/${
        report.grip.matched + report.grip.missed
      } v3=${report.launchPolishV3.matched}/${
        report.launchPolishV3.matched + report.launchPolishV3.missed
      }`
    );
  }

  console.log("");
  console.log(`[backfill] complete`);
  console.log(`  total sessions: ${rows.length}`);
  console.log(`  backfilled:     ${backfilled}`);
  console.log(`  skipped (hash match): ${skipped}`);
  console.log(`  skipped (stale shape): ${staleShape}`);
  console.log(`  layer-key totals across backfilled rows:`);
  console.log(`    prose:          ${layerTotals.prose}`);
  console.log(`    keystone:       ${layerTotals.keystone}`);
  console.log(`    synthesis3:     ${layerTotals.synthesis3}`);
  console.log(`    grip:           ${layerTotals.grip}`);
  console.log(`    launchPolishV3: ${layerTotals.launchPolishV3}`);
  // postgres-js holds the connection open; allow Node to exit.
  process.exit(0);
}

main().catch((e) => {
  console.error("[backfill] fatal:", e);
  process.exit(1);
});
