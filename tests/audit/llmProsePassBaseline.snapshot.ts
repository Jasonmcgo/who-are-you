// CC-LLM-PROSE-PASS-V1 — pre-CC non-scoped-section baseline. Hashes the
// content of every NON-scoped section to verify byte-identity holds
// after the LLM rewrite layer is wired (the LLM layer touches only
// Lens / Compass / Hands / Path / Closing Read).

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
const OUT = join(__dirname, "llmProsePassBaseline.snapshot.json");

// Non-scoped sections — these MUST stay byte-identical after the LLM
// pass. Each entry: [start header (or marker), end-marker before].
const NON_SCOPED_MARKERS: Array<{ id: string; start: string }> = [
  { id: "open-tensions", start: "## Open Tensions" },
  { id: "mirror-types-seed", start: "## Mirror-Type Seed" },
  { id: "conflict-translation", start: "## Conflict Translation" },
  { id: "work-map", start: "## Work Map" },
  { id: "love-map", start: "## Love Map" },
  { id: "disposition-mix", start: "## How Your Disposition Reads" },
  { id: "keystone", start: "## Keystone Reflection" },
];

function extractSection(md: string, header: string): string | null {
  const idx = md.indexOf(header);
  if (idx < 0) return null;
  const rest = md.slice(idx);
  const nextHeader = rest.slice(header.length).search(/\n## /);
  if (nextHeader < 0) return rest.trimEnd();
  return rest.slice(0, header.length + nextHeader).trimEnd();
}

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

const out: Record<string, Record<string, { hash: string; length: number }>> = {};
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
      renderMode: "user",
    });
    const key = `${dir}/${f}`;
    out[key] = {};
    for (const m of NON_SCOPED_MARKERS) {
      const section = extractSection(md, m.start);
      if (section) {
        out[key][m.id] = { hash: hash(section), length: section.length };
      } else {
        out[key][m.id] = { hash: "(missing)", length: 0 };
      }
    }
  }
}
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(
  `Baseline written for ${Object.keys(out).length} fixtures (${OUT})`
);
