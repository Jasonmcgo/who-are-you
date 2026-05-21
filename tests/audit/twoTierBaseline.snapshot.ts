// CC-TWO-TIER-RENDER-SURFACE-CLEANUP + CC-119 — Guide-mode regression
// baseline. Pre-CC-119 this snapshot pinned the *pre-CC clinician* output
// (raw engine prose) for byte-identity audit. CC-119 made the Guide
// additive: it now contains the Individual's warm splice + scaffolding.
// This file re-snapshots that *warm* Guide output for every cohort
// fixture; the `guide-mode-snapshot-stable` assertion in
// `twoTierRenderSurfaceCleanup.audit.ts` regression-checks against
// these hashes. Re-run AFTER any intentional Guide content change
// (warm splice change, scaffolding emit change, mask change that
// affects Guide-only lines). Run order matters — snapshot LAST.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");
const OUT = join(__dirname, "twoTierBaseline.snapshot.json");

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

const out: Record<string, { length: number; hash: string }> = {};
for (const dir of ["ocean", "goal-soul-give"]) {
  for (const f of readdirSync(join(ROOT, dir))
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const raw = JSON.parse(readFileSync(join(ROOT, dir, f), "utf-8")) as {
      answers: Answer[];
      demographics?: DemographicSet | null;
    };
    const c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
    const md = renderMirrorAsMarkdown({
      constitution: c,
      includeBeliefAnchor: false,
      generatedAt: new Date("2026-05-11T00:00:00Z"),
      renderMode: "clinician",
    });
    out[`${dir}/${f}`] = { length: md.length, hash: hash(md) };
  }
}
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(
  `Baseline written for ${Object.keys(out).length} fixtures (${OUT})`
);
