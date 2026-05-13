// CC-TWO-TIER-RENDER-SURFACE-CLEANUP — pre-CC clinician-mode baseline.
// Captures the full rendered markdown hash for every cohort fixture so
// the audit can verify that clinician-mode output stays byte-identical
// after the renderMode switch + user-mode mask are added.

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
