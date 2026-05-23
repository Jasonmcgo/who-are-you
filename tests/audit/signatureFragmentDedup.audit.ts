// CC-131 Part A.1 audit — signature-fragment dedup.
//
// The Discernment gift / blind-spot composers historically emitted the
// same verbatim canonical fragment in every card they fired in. The
// CC-131 registry (`lib/signatureFragmentRegistry.ts`) rotates each
// family through a small variant pool so the same finding lands in a
// different phrasing per card.
//
// Audit contract: for every cohort fixture, render the clinician
// markdown and assert that none of the known signature-fragment
// canonical phrasings appear more than `pool.length` times in the
// rendered body. That is the wrap point — pool of L variants supports
// up to L distinct emissions before any single phrasing repeats.
//
// Run: `npx tsx tests/audit/signatureFragmentDedup.audit.ts`. Prints a
// per-fixture report and exits non-zero on any over-budget repeat.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildInnerConstitution } from "../../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../../lib/renderMirror";
import {
  fragmentVariantPool,
  type FragmentFamily,
} from "../../lib/signatureFragmentRegistry";
import type { Answer, DemographicSet } from "../../lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..", "fixtures");

const TRACKED_FAMILIES: FragmentFamily[] = [
  "discernment_gift_generic",
  "discernment_blindspot_ni_faith",
  "discernment_gift_description",
];

type FixtureRow = {
  fixture: string;
  perFamily: Record<string, { perVariant: number[]; cap: number; over: boolean }>;
};

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

const rows: FixtureRow[] = [];
let anyOverflow = false;

for (const dir of ["ocean", "goal-soul-give"]) {
  for (const f of readdirSync(join(ROOT, dir))
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const raw = JSON.parse(
      readFileSync(join(ROOT, dir, f), "utf-8")
    ) as { answers: Answer[]; demographics?: DemographicSet | null };
    const c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
    const md = renderMirrorAsMarkdown({
      constitution: c,
      includeBeliefAnchor: false,
      renderMode: "clinician",
      generatedAt: new Date("2026-05-11T00:00:00Z"),
    });

    const row: FixtureRow = { fixture: `${dir}/${f}`, perFamily: {} };
    for (const family of TRACKED_FAMILIES) {
      const pool = fragmentVariantPool(family);
      const counts = pool.map((v) => countOccurrences(md, v));
      const cap = 1;
      const over = counts.some((n) => n > cap);
      if (over) anyOverflow = true;
      row.perFamily[family] = { perVariant: counts, cap, over };
    }
    rows.push(row);
  }
}

const lines: string[] = [];
lines.push("CC-131 Part A.1 — signature-fragment dedup audit");
lines.push("=".repeat(64));
lines.push(`Fixtures audited: ${rows.length}`);
lines.push("Per-fixture per-family per-variant occurrence counts (cap=1 per variant):");
lines.push("");
for (const row of rows) {
  lines.push(`# ${row.fixture}`);
  for (const family of TRACKED_FAMILIES) {
    const r = row.perFamily[family];
    const tag = r.over ? "OVER" : "ok";
    lines.push(`  [${tag}] ${family}: ${r.perVariant.join(", ")}`);
  }
  lines.push("");
}
if (anyOverflow) {
  lines.push("RESULT: FAIL — at least one variant exceeded cap=1.");
} else {
  lines.push("RESULT: PASS — every variant appears at most once per fixture render.");
}
console.log(lines.join("\n"));
process.exit(anyOverflow ? 1 : 0);
