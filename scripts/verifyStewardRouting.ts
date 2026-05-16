// Verify the aux-aware steward routing patch: render each danielType
// fixture and report the actual Strength text on Trust / Gravity /
// Conviction cards. Compare against the user's canon:
//   - Daniel-shape (Si-Te): Trust → Stewardship, Gravity → Builder, Conviction → Discernment
//   - Harry-shape (Si-Fe):  Trust → Stewardship, Gravity → Advocacy or Stewardship, Conviction → Harmony

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildInnerConstitution } from "../lib/identityEngine";
import { renderMirrorAsMarkdown } from "../lib/renderMirror";
import type { Answer, DemographicSet } from "../lib/types";

const ROOT = join(process.cwd(), "tests", "fixtures", "cohort");
const files = readdirSync(ROOT)
  .filter((f) => f.endsWith(".json"))
  .sort();

function extractStrengthLine(md: string, cardHeader: string): string {
  const idx = md.indexOf(cardHeader);
  if (idx < 0) return "(card not found)";
  const after = md.slice(idx);
  const strengthMatch = after.match(/\*\*Strength\*\* — (.+)/);
  return strengthMatch ? strengthMatch[1].slice(0, 90) : "(no Strength line)";
}

console.log("\n=== Steward routing verification per fixture ===\n");
console.log(
  `${"Fixture".padEnd(45)}  ${"Driver/Aux".padEnd(12)}  Trust Strength`
);
console.log("-".repeat(160));

for (const file of files) {
  const path = join(ROOT, file);
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    answers: Answer[];
    demographics?: DemographicSet | null;
    _archetype?: string;
  };
  const c = buildInnerConstitution(raw.answers, [], raw.demographics ?? null);
  const md = renderMirrorAsMarkdown({
    constitution: c,
    includeBeliefAnchor: false,
    generatedAt: new Date("2026-05-16T00:00:00Z"),
    renderMode: "clinician",
  });
  const drv = c.lens_stack?.dominant ?? "?";
  const aux = c.lens_stack?.auxiliary ?? "?";
  const trust = extractStrengthLine(md, "### Trust");
  const gravity = extractStrengthLine(md, "### Gravity");
  const conv = extractStrengthLine(md, "### Conviction");
  console.log(
    `${file.padEnd(45)}  ${(drv + "-" + aux).padEnd(12)}  ${trust}`
  );
  console.log(
    `${"".padEnd(45)}  ${"".padEnd(12)}  Gravity: ${gravity}`
  );
  console.log(
    `${"".padEnd(45)}  ${"".padEnd(12)}  Conviction: ${conv}`
  );
  console.log();
}
